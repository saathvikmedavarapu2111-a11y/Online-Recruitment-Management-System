/* Recruiter portal. */
const me = guard('recruiter');
renderNav(me.name, me.role);
let jobsCache = [];

setTabs('tabs', ['Dashboard', 'My Jobs', 'AI Screening', 'Interviews'], (t) => {
  ['tab-dash', 'tab-jobs', 'tab-screen', 'tab-int'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  const map = { 'Dashboard': 'tab-dash', 'My Jobs': 'tab-jobs', 'AI Screening': 'tab-screen', 'Interviews': 'tab-int' };
  document.getElementById(map[t]).classList.remove('hidden');
  if (t === 'Dashboard') loadDash();
  if (t === 'My Jobs') loadMyJobs();
  if (t === 'AI Screening') loadScreenJobs();
  if (t === 'Interviews') loadIntTab();
});

/* ---------- dashboard ---------- */
async function loadDash() {
  try {
    const r = await api('/api/reports/overview');
    document.getElementById('kpis').innerHTML =
      [['Jobs posted', r.jobs_posted], ['Applications', r.applications_received],
       ['Interviews', r.interviews_scheduled],
       ['Avg. match score', r.average_match_score == null ? '—' : r.average_match_score + '%']]
      .map(k => '<div class="card kpi"><div class="num">' + k[1] + '</div><div class="lbl">' + k[0] + '</div></div>').join('');
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    document.getElementById('funnel').innerHTML = stages
      .map(s => '<span style="margin-right:10px">' + statusBadge(s) + ' <b>' + (r.funnel[s] || 0) + '</b></span>').join('');
  } catch (e) { toast(e.message, false); }
}

/* ---------- jobs ---------- */
async function loadMyJobs() {
  try {
    jobsCache = await api('/api/jobs/mine');
    const box = document.getElementById('myJobs');
    if (!jobsCache.length) { box.innerHTML = '<p class="muted">No postings yet — create one.</p>'; return; }
    box.innerHTML = '<table><tr><th>Title</th><th>Applicants</th><th>Status</th><th></th></tr>' +
      jobsCache.map(j => '<tr><td><b>' + esc(j.title) + '</b><br><span class="muted">' + esc(j.location || '') + '</span></td>' +
        '<td>' + j.application_count + '</td><td>' + (j.is_active ? '<span class="badge offer">active</span>' : '<span class="badge">closed</span>') + '</td>' +
        '<td><button class="btn small danger" onclick="delJob(' + j.job_id + ')">Delete</button></td></tr>').join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function postJob() {
  const body = {
    title: document.getElementById('jTitle').value.trim(),
    description: document.getElementById('jDesc').value.trim() || null,
    required_skills: document.getElementById('jSkills').value.trim(),
    qualification: document.getElementById('jQual').value.trim() || null,
    min_experience_years: parseFloat(document.getElementById('jExp').value) || 0,
    location: document.getElementById('jLoc').value.trim() || null,
    employment_type: document.getElementById('jType').value,
  };
  if (!body.title || !body.required_skills) { toast('Title and required skills are mandatory.', false); return; }
  try {
    await api('/api/jobs', { method: 'POST', body });
    toast('Job posted.');
    ['jTitle', 'jDesc', 'jSkills', 'jQual', 'jLoc'].forEach(id => document.getElementById(id).value = '');
    loadMyJobs();
  } catch (e) { toast(e.message, false); }
}
async function delJob(id) {
  if (!confirm('Delete this job and all its applications?')) return;
  try { await api('/api/jobs/' + id, { method: 'DELETE' }); toast('Job deleted.'); loadMyJobs(); }
  catch (e) { toast(e.message, false); }
}

/* ---------- screening ---------- */
async function loadScreenJobs() {
  try {
    jobsCache = await api('/api/jobs/mine');
    document.getElementById('scrJob').innerHTML =
      jobsCache.map(j => '<option value="' + j.job_id + '">' + esc(j.title) + '</option>').join('');
    if (jobsCache.length) loadRanking(jobsCache[0].job_id);
  } catch (e) { toast(e.message, false); }
}
async function runScreening() {
  const id = document.getElementById('scrJob').value;
  if (!id) return;
  try {
    toast('Scoring applicants…');
    const r = await api('/api/screening/job/' + id + '/run', { method: 'POST' });
    toast('Scored ' + r.scored + ' applicant(s).');
    renderRanking(r.ranking);
  } catch (e) { toast(e.message, false); }
}
async function loadRanking(id) {
  try { renderRanking(await api('/api/screening/job/' + id)); }
  catch (e) { toast(e.message, false); }
}
function renderRanking(rows) {
  const box = document.getElementById('ranking');
  if (!rows.length) { box.innerHTML = '<p class="muted">No applications for this job yet.</p>'; return; }
  box.innerHTML = '<table><tr><th>#</th><th>Candidate</th><th>Match score</th><th>Matched skills</th><th>Missing</th><th>Status</th><th></th></tr>' +
    rows.map((r, i) => '<tr><td><b>' + (i + 1) + '</b></td><td><b>' + esc(r.candidate_name) + '</b><br><span class="muted">' +
      esc(r.candidate_experience) + ' yrs exp</span></td><td>' + scoreCell(r.score) + '</td><td class="muted">' +
      esc(r.matched_skills || '—') + '</td><td class="muted">' + esc(r.missing_skills || '—') + '</td><td>' +
      statusBadge(r.status) + '</td><td><select onchange="setStatus(' + r.application_id + ', this.value)">' +
      ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'].map(s =>
        '<option value="' + s + '"' + (s === r.status ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></td></tr>').join('') + '</table>' +
      '<p class="muted mt">Scores are advisory — the final hiring decision stays with you.</p>';
}
async function setStatus(appId, status) {
  try {
    await api('/api/applications/' + appId + '/status', { method: 'PATCH', body: { status } });
    toast('Status → ' + status);
  } catch (e) { toast(e.message, false); }
}
document.getElementById('scrJob').addEventListener('change', e => loadRanking(e.target.value));

/* ---------- interviews ---------- */
async function loadIntTab() {
  try {
    jobsCache = await api('/api/jobs/mine');
    const sel = document.getElementById('intJob');
    sel.innerHTML = jobsCache.map(j => '<option value="' + j.job_id + '">' + esc(j.title) + '</option>').join('');
    await loadJobApps();
    await loadInts();
  } catch (e) { toast(e.message, false); }
}
async function loadJobApps() {
  const id = document.getElementById('intJob').value;
  if (!id) return;
  try {
    const apps = await api('/api/applications/job/' + id);
    document.getElementById('intApp').innerHTML =
      apps.map(a => '<option value="' + a.application_id + '">' + esc(a.candidate_name) + ' (' + esc(a.status) + ')</option>').join('');
  } catch (e) { toast(e.message, false); }
}
async function scheduleInt() {
  const body = {
    application_id: parseInt(document.getElementById('intApp').value),
    scheduled_on: new Date(document.getElementById('intWhen').value).toISOString(),
    mode: document.getElementById('intMode').value,
    interviewer: document.getElementById('intBy').value.trim() || null,
  };
  if (!body.application_id || !document.getElementById('intWhen').value) {
    toast('Pick an applicant and a date/time.', false); return;
  }
  try {
    await api('/api/interviews', { method: 'POST', body });
    toast('Interview scheduled.');
    loadInts();
  } catch (e) { toast(e.message, false); }
}
async function loadInts() {
  try {
    const list = await api('/api/interviews');
    const box = document.getElementById('intList');
    if (!list.length) { box.innerHTML = '<p class="muted">Nothing scheduled yet.</p>'; return; }
    box.innerHTML = '<table><tr><th>Candidate</th><th>When</th><th>Mode</th><th>Result</th><th>Feedback</th><th></th></tr>' +
      list.map(i => '<tr><td><b>' + esc(i.candidate_name) + '</b><br><span class="muted">' + esc(i.job_title) + '</span></td>' +
        '<td>' + fmtDate(i.scheduled_on) + '</td><td>' + esc(i.mode) + '</td><td>' + statusBadge(i.result) + '</td>' +
        '<td class="muted">' + esc(i.feedback || '—') + '</td>' +
        '<td><button class="btn small secondary" onclick="feedback(' + i.interview_id + ')">Update</button></td></tr>'
      ).join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function feedback(id) {
  const fb = prompt('Feedback for this interview:');
  if (fb === null) return;
  const result = prompt('Result (pending / selected / rejected):', 'pending');
  if (!['pending', 'selected', 'rejected'].includes(result)) { toast('Invalid result.', false); return; }
  try {
    await api('/api/interviews/' + id, { method: 'PATCH', body: { feedback: fb, result } });
    toast('Interview updated.');
    loadInts();
  } catch (e) { toast(e.message, false); }
}
loadDash();
