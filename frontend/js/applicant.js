/* Applicant portal. */
const me = guard('applicant');
renderNav(me.name, me.role);
let appliedIds = new Set();

setTabs('tabs', ['Find Jobs', 'My Applications', 'My Interviews', 'Profile'], (t) => {
  ['tab-jobs', 'tab-apps', 'tab-interviews', 'tab-profile'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  const map = { 'Find Jobs': 'tab-jobs', 'My Applications': 'tab-apps', 'My Interviews': 'tab-interviews', 'Profile': 'tab-profile' };
  document.getElementById(map[t]).classList.remove('hidden');
  if (t === 'My Applications') loadApps();
  if (t === 'My Interviews') loadInterviews();
  if (t === 'Profile') loadProfile();
});

async function searchJobs() {
  const p = new URLSearchParams({
    search: document.getElementById('q').value,
    location: document.getElementById('qloc').value,
    skill: document.getElementById('qskill').value,
  });
  try {
    const jobs = await api('/api/jobs?' + p.toString());
    const apps = await api('/api/applications/me');
    appliedIds = new Set(apps.map(a => a.job_id));
    const box = document.getElementById('jobList');
    if (!jobs.length) { box.innerHTML = '<p class="muted">No jobs match your search.</p>'; return; }
    box.innerHTML = '<table><tr><th>Job</th><th>Skills required</th><th>Location</th><th></th></tr>' +
      jobs.map(j => '<tr><td><b>' + esc(j.title) + '</b><br><span class="muted">' +
        esc(j.recruiter_name) + ' · ' + esc(j.employment_type) + '</span></td><td>' +
        esc(j.required_skills) + '</td><td>' + esc(j.location || '—') + '</td><td>' +
        (appliedIds.has(j.job_id)
          ? '<span class="badge applied">applied ✓</span>'
          : '<button class="btn small" onclick="apply(' + j.job_id + ')">Apply</button>') +
        '</td></tr>').join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function apply(jobId) {
  try {
    await api('/api/applications', { method: 'POST', body: { job_id: jobId } });
    toast('Application submitted!');
    searchJobs();
  } catch (e) { toast(e.message, false); }
}
async function loadApps() {
  try {
    const apps = await api('/api/applications/me');
    const box = document.getElementById('appList');
    if (!apps.length) { box.innerHTML = '<p class="muted">You have not applied anywhere yet.</p>'; return; }
    box.innerHTML = '<table><tr><th>Job</th><th>Status</th><th>AI match score</th><th>Applied</th></tr>' +
      apps.map(a => '<tr><td><b>' + esc(a.job_title) + '</b><br><span class="muted">' +
        esc(a.job_location || '') + '</span></td><td>' + statusBadge(a.status) + '</td><td>' +
        scoreCell(a.match_score) + '</td><td class="muted">' + fmtDate(a.applied_at) + '</td></tr>'
      ).join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function loadInterviews() {
  try {
    const list = await api('/api/interviews/me');
    const box = document.getElementById('intList');
    if (!list.length) { box.innerHTML = '<p class="muted">No interviews scheduled yet.</p>'; return; }
    box.innerHTML = '<table><tr><th>Job</th><th>When</th><th>Mode</th><th>Interviewer</th><th>Result</th></tr>' +
      list.map(i => '<tr><td><b>' + esc(i.job_title) + '</b></td><td>' + fmtDate(i.scheduled_on) +
        '</td><td>' + esc(i.mode) + '</td><td>' + esc(i.interviewer || '—') + '</td><td>' +
        statusBadge(i.result) + '</td></tr>').join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function loadProfile() {
  try {
    const p = await api('/api/applicants/me');
    document.getElementById('pPhone').value = p.phone || '';
    document.getElementById('pLoc').value = p.location || '';
    document.getElementById('pSkills').value = p.skills || '';
    document.getElementById('pExp').value = p.experience_years || '';
    document.getElementById('pQual').value = p.qualification || '';
  } catch (e) { toast(e.message, false); }
}
async function saveProfile() {
  const body = {
    phone: document.getElementById('pPhone').value || null,
    location: document.getElementById('pLoc').value || null,
    skills: document.getElementById('pSkills').value || null,
    experience_years: parseFloat(document.getElementById('pExp').value) || null,
    qualification: document.getElementById('pQual').value || null,
  };
  try { await api('/api/applicants/me', { method: 'PUT', body }); toast('Profile saved.'); }
  catch (e) { toast(e.message, false); }
}
async function uploadResume() {
  const f = document.getElementById('resumeFile').files[0];
  if (!f) { toast('Choose a resume file first.', false); return; }
  const form = new FormData();
  form.append('file', f);
  try {
    const r = await api('/api/applicants/me/resume', { method: 'POST', form });
    document.getElementById('parseOut').innerHTML =
      '<p><b>Parsed ' + r.text_chars + ' characters.</b></p>' +
      '<p class="muted">Skills found: ' + esc(r.extracted_skills.join(', ') || 'none') + '<br>' +
      'Experience: ' + esc(String(r.extracted_experience_years)) + ' yrs<br>' +
      'Qualification: ' + esc(r.extracted_qualification || '—') + '</p>';
    toast('Resume parsed and profile updated.');
    loadProfile();
  } catch (e) { toast(e.message, false); }
}
searchJobs();
