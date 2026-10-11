/* SmartRecruit — live SPA.
   All data comes from the FastAPI + PostgreSQL backend (API_BASE).
   Client-side match badges use the same strict, resume-aware formula as
   app/ai/matcher.py: score = 100*(0.65*skill + 0.20*exp + 0.15*edu),
   where a required skill earns 1.0 evidenced in the resume, 0.6 claimed
   on the profile only, 0 missing. The recruiter Screening page uses the
   backend's authoritative ranking. */
'use strict';

/* ============================== DATA ============================== */
/* Live data: all entities come from the FastAPI + PostgreSQL backend
   (see DATA LAYER below). No demo seeds. */
function scoreCandidate(cand, job){
  // Strict, resume-aware screening:
  // a required skill counts 1.0 if evidenced in the resume, 0.6 if only claimed on the profile, 0 if absent.
  const prof = splitSkills(cand.skills||'');
  const rsk = resumeSkillList(cand);
  const need = splitSkills(job.skills);
  let credit=0; const verified=[], claimed=[], missing=[];
  need.forEach(s=>{
    const inR = rsk.some(r=>r===s||r.includes(s)||s.includes(r));
    const inP = prof.some(p=>p===s||p.includes(s)||s.includes(p));
    if(inR){ credit+=1; verified.push(s); }
    else if(inP){ credit+=0.6; claimed.push(s); }
    else missing.push(s);
  });
  const skill = need.length ? Math.min(1, credit/need.length) : 1.0;
  const matched=[...verified, ...claimed].sort();
  const expScore=job.exp>0 ? Math.min((cand.exp||0)/job.exp,1) : 1.0;
  const edu=eduScore(cand.qual, job.qual);
  const score=Math.round(100*(0.65*skill+0.20*expScore+0.15*edu)*100)/100;
  return { score, matched, missing, verified:verified.sort(), claimed:claimed.sort(),
    parts:{skill:Math.round(skill*1000)/1000, exp:Math.round(expScore*1000)/1000, edu:Math.round(edu*1000)/1000} };
}

/* ---- resume skill vocabulary + parser (used by seeding, so defined before STATE) ---- */
const RESUME_SKILLS=['python','java','javascript','typescript','c++','c#','go','rust','php','ruby','kotlin','swift',
  'react','angular','vue','node.js','django','flask','spring','express','html','css','graphql','rest','microservices',
  'sql','postgresql','mysql','mongodb','redis','pandas','numpy','machine learning','deep learning','tensorflow','pytorch',
  'docker','kubernetes','aws','azure','gcp','terraform','linux','git','figma','selenium','testing','ci/cd','tableau',
  'excel','agile','analytics','prototyping','user research'];
function parseResumeText(text){
  const low=' '+text.toLowerCase()+' ';
  const escRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const skills=RESUME_SKILLS.filter(s=>{
    try{ return new RegExp('(?<!\\w)'+escRx(s)+'(?!\\w)').test(low); }catch{ return low.includes(s); }
  });
  let exp=0; const m=low.match(/(\d+(?:\.\d+)?)\s*(?:\+?\s*)years?/g)||[];
  m.forEach(x=>{ const n=parseFloat(x); if(n>exp&&n<50) exp=n; });
  const quals=DEGREE_KW.filter(d=>low.includes(d));
  return {skills, exp, quals};
}

/* ============================== DATA LAYER (live API) ============================== */
/* The UI below is unchanged; every read/write now goes to the FastAPI +
   PostgreSQL backend. In-memory caches mirror the API in SPA shapes. */
const API_BASE = window.__SR_API_BASE || 'https://smartrecruit-api.onrender.com';

let apiToken = null, apiUser = null;
try {
  apiToken = localStorage.getItem('sr_token');
  apiUser = JSON.parse(localStorage.getItem('sr_user') || 'null');
} catch { /* fresh session */ }
let session = apiUser ? { name: apiUser.name, email: apiUser.email, role: apiUser.role, user_id: apiUser.user_id } : null;

async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    method: opts.method || 'GET',
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      apiToken ? { Authorization: 'Bearer ' + apiToken } : {},
      opts.headers || {}
    ),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && data.detail) || text || ('HTTP ' + res.status);
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = res.status;
    throw err;
  }
  return data;
}
function setSession(token, user) {
  apiToken = token; apiUser = user;
  session = user ? { name: user.name, email: user.email, role: user.role, user_id: user.user_id } : null;
  try {
    if (token) { localStorage.setItem('sr_token', token); localStorage.setItem('sr_user', JSON.stringify(user)); }
    else { localStorage.removeItem('sr_token'); localStorage.removeItem('sr_user'); }
  } catch {}
}

/* ---------- backend -> SPA shape mappers ---------- */
const mapJob = j => ({
  id: 'j' + j.job_id, job_id: j.job_id, title: j.title, company: j.company || '',
  location: j.location || '', type: j.employment_type || 'Full-time',
  salary: j.salary_range || '', openings: j.openings || 1,
  desc: j.description || '', about: '', resp: [],
  skills: j.required_skills || '', qual: j.qualification || '',
  exp: parseFloat(j.min_experience_years) || 0,
  posted: (j.created_at || '').slice(0, 10),
});
const mapCandidate = c => ({
  id: 'c' + (c.candidate_id || c.user_id || 0), candidate_id: c.candidate_id,
  name: c.name || '', email: c.email || '', phone: c.phone || '',
  location: c.location || '', skills: c.skills || '',
  exp: parseFloat(c.experience_years) || 0, qual: c.qualification || '',
  headline: c.qualification || '',
  resumeText: c.resume_text || '', resumeName: c.resume_filename || '',
});
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };
const mapApplication = a => ({
  id: 'a' + a.application_id, application_id: a.application_id,
  candId: 'c' + a.candidate_id, jobId: 'j' + a.job_id,
  status: a.status, appliedOn: fmtDate(a.applied_at), coverNote: '',
  candidate_name: a.candidate_name || '', score: a.score,
});
const mapInterview = iv => ({
  id: 'i' + iv.interview_id, interview_id: iv.interview_id,
  appId: 'a' + iv.application_id, application_id: iv.application_id,
  candId: 'c' + iv.candidate_id, jobId: 'j' + iv.job_id,
  when: (iv.scheduled_on || '').slice(0, 16), mode: iv.mode,
  status: iv.status || 'scheduled', message: iv.message || '',
  by: iv.interviewer || '', feedback: iv.feedback || '', result: iv.result || 'pending',
  candName: iv.candidate_name || '', jobTitle: iv.job_title || '',
});

/* ---------- in-memory caches (SPA shapes) ---------- */
let JOBS = [], CANDIDATES = [], applications = [], interviews = [];
let ME = null; // signed-in applicant's profile (mapped candidate)

const jobById = id => JOBS.find(j => j.id === id);
const candById = id => CANDIDATES.find(c => c.id === id);
const getApp = (cid, jid) => applications.find(a => a.candId === cid && a.jobId === jid);
const appStatus = (cid, jid) => { const a = getApp(cid, jid); return a ? a.status : null; };
const candJobs = cid => applications.filter(a => a.candId === cid).map(a => a.jobId);
const primaryJobId = cid => (candJobs(cid)[0] || (JOBS[0] && JOBS[0].id));
const primaryStatus = cid => appStatus(cid, primaryJobId(cid));
const jobApplicants = jid => [...new Set(applications.filter(a => a.jobId === jid).map(a => a.candId))].map(candById).filter(Boolean);
const myCandidate = () => ME;

/* resume skills for the strict scorer: parse the candidate's own resume text */
const resumeSkillList = cand => {
  if (!cand || !cand.resumeText) return [];
  try { return parseResumeText(cand.resumeText).skills || []; } catch { return []; }
};

/* ---------- loaders ---------- */
async function loadJobs() { JOBS = (await api('/api/jobs')).map(mapJob); }
async function loadMyProfile() {
  const p = await api('/api/applicants/me');
  ME = mapCandidate(Object.assign({}, p, { name: session.name, email: session.email }));
}
async function loadMyApplications() { applications = (await api('/api/applications/me')).map(mapApplication); }
async function loadMyInterviews() { interviews = (await api('/api/interviews/me')).map(mapInterview); }
async function loadCandidates() { CANDIDATES = (await api('/api/applicants')).map(mapCandidate); }
async function loadJobApplications(job_id) {
  applications = (await api('/api/applications/job/' + job_id)).map(mapApplication);
  const cands = (await api('/api/applicants')).map(mapCandidate);
  const byId = {}; cands.forEach(c => byId[c.id] = c);
  CANDIDATES = [...new Set(applications.map(a => a.candId))].map(id => byId[id]).filter(Boolean);
}
async function loadRecruiterInterviews(status) {
  interviews = (await api('/api/interviews' + (status ? '?status=' + status : ''))).map(mapInterview);
}
async function refreshFor(role) {
  await loadJobs();
  if (role === 'applicant') {
    await loadMyProfile(); await loadMyApplications(); await loadMyInterviews();
    CANDIDATES = ME ? [ME] : [];
  } else if (role === 'recruiter' || role === 'admin') {
    await loadCandidates(); await loadRecruiterInterviews();
    try {
      const all = [];
      for (const j of JOBS) { (await api('/api/applications/job/' + j.job_id)).forEach(a => all.push(mapApplication(a))); }
      applications = all;
    } catch { applications = []; }
  }
}

/* ============================== HELPERS ============================== */
const $ = s=>document.querySelector(s);
function esc(s){ return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
const AVA_COLORS=[['#8b5cf6','#ede9fe'],['#0ea5e9','#e0f2fe'],['#10b981','#d1fae5'],['#f59e0b','#fef3c7'],['#ef4444','#fee2e2'],['#6366f1','#e0e7ff']];
function avaColor(name){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return AVA_COLORS[h%AVA_COLORS.length]; }
function avatar(name, sz){ const [bg,fg]=avaColor(name);
  const init=name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  return `<span class="avatar" style="background:${bg};color:#fff;${sz?`width:${sz}px;height:${sz}px;font-size:${Math.round(sz*0.36)}px`:''}">${esc(init)}</span>`; }
function toast(msg, kind=''){
  const r=$('#toast-root'); const t=document.createElement('div');
  t.className='toast '+kind; t.textContent=msg; r.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .25s'; setTimeout(()=>t.remove(),260); }, 3000);
}
function emptyState(title, sub, icon){ return `<div class="empty"><div class="e-ic">${icon||ICONS.doc}</div><b>${title}</b>${sub||''}</div>`; }
const ICONS={
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
  brief:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 10a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.9.5 2.9.7a2 2 0 011.6 2z"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>',
};
function pill(status){
  const map={applied:'p-applied',screening:'p-screening',interview:'p-interview',hired:'p-hired',
    shortlisted:'p-shortlisted',rejected:'p-rejected',requested:'p-applied',scheduled:'p-hired',
    declined:'p-rejected',pending:'p-interview',selected:'p-hired'};
  const cls=map[status]||'p-inactive';
  return `<span class="pill ${cls}">${esc(status)}</span>`;
}

/* ============================== SHELL ============================== */
const NAV_ALL=[['dashboard','Dashboard',ICONS.grid],['candidates','Candidates',ICONS.users],['jobs','Jobs',ICONS.brief],['applications','Applications',ICONS.doc],['screening','Screening',ICONS.chart],['interviews','Interviews',ICONS.cal]];
const NAV_APPLICANT=[['jobs','Jobs',ICONS.brief],['interviews','My Interviews',ICONS.cal],['profile','Profile',ICONS.user]];
function navItems(){ return session && session.role==='applicant' ? NAV_APPLICANT : NAV_ALL; }
function topbar(active){
  const u=session; const NAV=navItems();
  return `<header class="topbar">
    <div class="brand"><span class="mark">S</span>SmartRecruit</div>
    <nav class="nav" aria-label="Primary">${NAV.map(([k,l,ic])=>
      `<button data-nav="${k}" class="${k===active?'active':''}" aria-current="${k===active?'page':'false'}">${ic}${l}</button>`).join('')}
      ${u&&u.role==='admin'?`<button data-nav="admin" class="${active==='admin'?'active':''}">Admin</button>`:''}
    </nav>
    <div class="top-actions">
      <button class="icon-btn" aria-label="Search" onclick="openSearch()">${ICONS.search}</button>
      <button class="icon-btn" aria-label="Notifications" onclick="toast('2 new applications this week')">${ICONS.bell}<span class="dot"></span></button>
      <button class="user-chip" onclick="confirmLogout()" aria-label="Account">
        ${avatar(u?u.name:'?',34)}
        <span><span class="nm">${esc(u?u.name.split(' ')[0]+' '+ (u.name.split(' ')[1]||'') :'')}</span><br><span class="rl">${esc(u?u.role:'')}</span></span>
      </button>
    </div>
  </header>`;
}
function footer(){
  const isApplicant = session && session.role==='applicant';
  const prodLinks = isApplicant
    ? [['Jobs','jobs'],['My Interviews','interviews'],['Profile','profile']]
    : [['Dashboard','dashboard'],['Candidates','candidates'],['Jobs','jobs'],['Applications','applications'],['AI Screening','screening'],['Interviews','interviews']];
  return `<footer class="site-footer"><div class="foot-inner">
    <div class="foot-brand"><div class="brand"><span class="logo">S</span><b>SmartRecruit</b></div>
      <p>AI-assisted hiring, from application to interview — screening every candidate on skills, experience and education.</p></div>
    <div class="foot-col"><h5>Product</h5>${prodLinks.map(([l,h])=>`<button onclick="location.hash='#/${h}'">${l}</button>`).join('')}</div>
    <div class="foot-col"><h5>Legal</h5>
      <button onclick="openLegal('terms')">Terms of Service</button>
      <button onclick="openLegal('privacy')">Privacy Policy</button></div>
  </div>
  <div class="foot-base"><span>© 2026 SmartRecruit · Demo workspace</span><span>Sample data for presentation — no real candidates.</span></div>
  </footer>`;
}
function confirmLogout(){ openModal('Sign out', `<p style="font-size:14px;color:var(--gray)">Sign out of the demo workspace?</p>
  <div class="mt" style="display:flex;gap:10px;justify-content:flex-end"><button class="btn ghost sm" onclick="closeModal()">Cancel</button>
  <button class="btn sm" onclick="doLogout()">Sign out</button></div>`); }
function doLogout(){ setSession(null, null); closeModal(); location.hash='#/login'; }
let _booted = false;
async function boot(){
  if(_booted) return; _booted = true;
  try { await api('/api/health'); }
  catch(e){ app.innerHTML = emptyState('Cannot reach the API', 'The backend at '+esc(API_BASE)+' is not responding. Please try again in a moment.', ICONS.x); return; }
  if(apiToken && apiUser){
    try {
      const me = await api('/api/auth/me');
      setSession(apiToken, me);
      await refreshFor(me.role);
    } catch { setSession(null, null); }
  }
  route();
}

/* ============================== ROUTER ============================== */
const app=$('#app');
function route(){
  const h=(location.hash||'#/login').replace('#/','');
  if(!_booted){ boot(); return; }
  if(!session && h!=='login'){ location.hash='#/login'; return; }
  if(session && h==='login'){ location.hash = session.role==='applicant' ? '#/jobs' : '#/dashboard'; return; }
  if(session && session.role==='applicant' && !['jobs','interviews','profile','login'].includes(h)){ location.hash='#/jobs'; return; }
  ({login:vLogin,dashboard:vDashboard,candidates:vCandidates,jobs:vJobs,applications:vApplications,screening:vScreening,interviews:vInterviews,admin:vAdmin,profile:vProfile}[h]||vDashboard)();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);
// delegated nav: survives every re-render (views are often re-rendered directly,
// e.g. after accepting a request, which would wipe per-element handlers)
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-nav]');
  if(b){ location.hash='#/'+b.dataset.nav; }
});

/* ============================== LOGIN ============================== */
function vLogin(mode){
  mode = mode || 'signin';
  const isUp = mode==='signup';
  app.innerHTML=`<div class="login-wrap"><div class="login-card">
    <div class="login-side">
      <div class="mark">S</div>
      <h2>Hiring, minus the busywork.</h2>
      <p>SmartRecruit centralizes applications, ranks candidates with explainable AI, and keeps every hiring decision auditable — from first application to signed offer.</p>
    </div>
    <div class="login-form">
      <h3>${isUp?'Create your account':'Welcome back'}</h3>
      <p class="sub">${isUp?'Join as an applicant — apply in minutes.':'Sign in with your SmartRecruit account.'}</p>
      <form id="loginForm" novalidate>
        ${isUp?`<div class="field"><label for="nm">Full name</label><input id="nm" autocomplete="name" placeholder="Priya Sharma"><div class="err">Name is required.</div></div>`:''}
        <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="username" placeholder="meera.nair@smartrecruit.app"><div class="err">Enter a valid email.</div></div>
        <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${isUp?'new-password':'current-password'}" placeholder="••••••••"><div class="err">${isUp?'Minimum 6 characters.':'Password is required.'}</div></div>
        <button class="btn block" type="submit">${isUp?'Create account':'Sign in'}</button>
      </form>
      <p class="sub" style="text-align:center;margin-top:12px">${isUp
        ? `Already have an account? <button class="linklike" onclick="vLogin('signin')">Sign in</button>`
        : `New here? <button class="linklike" onclick="vLogin('signup')">Create an account</button>`}</p>
      ${isUp?'':`<div class="demo-box">Demo accounts — recruiter:<button data-fill="meera.nair@smartrecruit.app|password123">fill</button>
        applicant:<button data-fill="aarav.mehta@example.com|password123">fill</button>
        admin:<button data-fill="admin@smartrecruit.app|admin123">fill</button></div>`}
    </div></div>
  <p class="login-legal"><button class="linklike" onclick="openLegal('terms')">Terms of Service</button> · <button class="linklike" onclick="openLegal('privacy')">Privacy Policy</button></p></div>`;
  document.querySelectorAll('[data-fill]').forEach(b=>b.onclick=()=>{
    const [e,p]=b.dataset.fill.split('|'); $('#em').value=e; $('#pw').value=p; });
  $('#loginForm').onsubmit=async e=>{
    e.preventDefault();
    const em=$('#em').value.trim().toLowerCase(), pw=$('#pw').value;
    const emOk=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em);
    $('#em').closest('.field').classList.toggle('invalid',!emOk);
    const pwOk=isUp?pw.length>=6:!!pw;
    $('#pw').closest('.field').classList.toggle('invalid',!pwOk);
    const btn=e.target.querySelector('button[type=submit]');
    if(isUp){
      const nm=$('#nm').value.trim();
      $('#nm').closest('.field').classList.toggle('invalid',!nm);
      if(!emOk||!pwOk||!nm) return;
      btn.disabled=true;
      try{
        const r=await api('/api/auth/register',{method:'POST',body:{name:nm,email:em,password:pw,role:'applicant'}});
        setSession(r.access_token, r.user);
        await refreshFor('applicant');
        toast('Account created — welcome, '+nm.split(' ')[0],'ok');
        location.hash='#/jobs';
      }catch(err){ toast(err.message||'Could not create the account','err'); btn.disabled=false; }
      return;
    }
    if(!emOk||!pwOk) return;
    btn.disabled=true;
    try{
      const r=await api('/api/auth/login',{method:'POST',body:{email:em,password:pw}});
      setSession(r.access_token, r.user);
      await refreshFor(r.user.role);
      toast('Signed in as '+r.user.name,'ok');
      location.hash = r.user.role==='applicant' ? '#/jobs' : (r.user.role==='admin' ? '#/admin' : '#/dashboard');
    }catch(err){ toast(err.message||'Invalid email or password','err'); btn.disabled=false; }
  };
}

/* ============================== DASHBOARD ============================== */
function vDashboard(){
  if(session && session.role!=='applicant' && !window._dashLoading){
    window._dashLoading=true;
    (async()=>{ try{ await refreshFor(session.role); }catch{} window._dashLoading=false; vDashboard(); })();
  }
  const cands=CANDIDATES;
  const openJobs=JOBS.length, total=cands.length;
  const upcoming=interviews.filter(i=>i.status==='scheduled'&&new Date(i.when)>new Date()).length;
  const scores=cands.map(c=>{ const j=jobById(primaryJobId(c.id)); return j?scoreCandidate(c,j).score:0; }).filter(s=>s>0);
  const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
  // funnel from real application states
  let fA=0,fS=0,fI=0,fH=0;
  applications.forEach(a=>{
    const s=appStatus(a.candId,a.jobId);
    if(s==='applied')fA++; else if(s==='screening'||s==='shortlisted')fS++;
    else if(s==='interview')fI++; else if(s==='hired')fH++;
  });
  const fMax=Math.max(fA,fS,fI,fH,1);
  const funnel=[['Applied',fA,'#8b5cf6'],['Screening',fS,'#0ea5e9'],['Interview',fI,'#f59e0b'],['Hired',fH,'#10b981']];
  const top=[...cands].map(c=>{ const j=jobById(primaryJobId(c.id)); return {c,s:j?scoreCandidate(c,j):{score:0}}; }).sort((a,b)=>b.s.score-a.s.score).slice(0,5);
  const pendingReq=interviews.filter(r=>r.status==='proposed');
  const attention=[];
  if(pendingReq.length) attention.push([`${pendingReq.length} interview request${pendingReq.length>1?'s':''} waiting`, 'Review on the Interviews page', '#/interviews']);
  const unscreened=JOBS.filter(j=>!jobApplicants(j.id).some(c=>['screening','interview','shortlisted','hired'].includes(appStatus(c.id,j.id))));
  if(unscreened.length) attention.push([`${unscreened.length} job${unscreened.length>1?'s':''} with no one screened yet`, unscreened.slice(0,3).map(j=>j.title).join(', '), '#/screening']);
  if(!attention.length) attention.push(['Pipeline is clear', 'Nothing needs your attention right now.', '#/candidates']);
  app.innerHTML=topbar('dashboard')+`<main class="page">
    <div class="page-head"><div><h1>Dashboard</h1><p class="sub">Hiring pipeline at a glance.</p></div>
      <div class="head-actions"><button class="btn" onclick="location.hash='#/screening'">${ICONS.chart} Run screening</button></div></div>
    <div class="grid g4 mb">
      ${[['Open jobs',openJobs,'live postings'],['Candidates',total,'in pipeline'],['Interviews',interviews.length,'total scheduled'],['Avg. match score',avg+'%','across primary roles']]
        .map(([l,v,s])=>`<div class="panel kpi"><div class="num">${v}</div><div class="lbl">${l}</div><div class="delta up">${s}</div></div>`).join('')}
    </div>
    <div class="grid g2">
      <div class="panel"><h3>Application funnel</h3><p class="sub">Every application across all roles.</p>
        ${funnel.map(([l,v,c])=>`<div class="funnel-row"><span>${l}</span><span class="bar"><i style="width:${v/fMax*100}%;background:${c}"></i></span><b>${v}</b></div>`).join('')}
      </div>
      <div class="panel"><h3>Needs attention</h3><p class="sub">What to do next.</p>
        ${attention.map(([t,s,link])=>`<div class="feed-item"><div><b>${esc(t)}</b><div style="font-size:12.5px;color:var(--gray)">${esc(s)}</div></div><span class="t"><button class="btn ghost sm" onclick="location.hash='${link}'">Open</button></span></div>`).join('')}
      </div>
    </div>
    <div class="panel mt"><h3>Top matches</h3><p class="sub">Best AI score per candidate, primary role.</p>
      <div class="grid" style="gap:0">${top.map(({c,s},i)=>`<div class="feed-item">${avatar(c.name,36)}<div><b>${esc(c.name)}</b><div style="font-size:12px;color:var(--gray)">${esc(c.headline)} → ${esc(jobById(primaryJobId(c.id)).title)}</div></div><span class="t"><b style="color:var(--ink)">${s.score}%</b></span></div>`).join('')}</div>
    </div>
    <div class="panel mt"><h3>How screening works</h3><p class="sub">Strict and deterministic — every point is accounted for.</p>
      <div class="breakdown" style="max-width:560px">
        ${[['Skill overlap × 0.65','65%'],['Experience fit × 0.20','20%'],['Education fit × 0.15','15%']].map(([l,w])=>
        `<div class="bd-row"><span>${l}</span><span class="bar"><i style="width:${w}"></i></span><b>${w}</b></div>`).join('')}
      </div>
      <p class="sub" style="margin-top:8px">A required skill earns full marks only when evidenced in the candidate's resume; skills claimed on the profile alone earn 0.6×. Missing skills earn nothing.</p>
    </div>
  </main>`+footer();
}

/* ============================== CANDIDATES ============================== */
let candFilter='all', candQuery='';
function vCandidates(){
  (async()=>{ try{ await loadCandidates(); }catch(err){ toast('Could not load candidates','err'); } renderCandGrid(); })();
  app.innerHTML=topbar('candidates')+`<main class="page">
    <div class="page-head"><div><h1>Candidates</h1><p class="sub" id="candCount"></p></div>
      <div class="head-actions"></div></div>
    <div class="chips" role="tablist" aria-label="Filter candidates">
      ${[['all','All'],['shortlisted','Shortlisted'],['interview','In interview'],['new','New']].map(([k,l])=>
        `<button class="chip ${candFilter===k?'active':''}" data-f="${k}">${l}</button>`).join('')}
      <span class="searchbox">${ICONS.search}<input id="cq" placeholder="Search name or skill…" value="${esc(candQuery)}" aria-label="Search candidates"></span>
    </div>
    <div class="cards" id="candGrid"></div>
  </main>`+footer();
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{candFilter=b.dataset.f;vCandidates();});
  $('#cq').oninput=e=>{candQuery=e.target.value;renderCandGrid();};
  renderCandGrid();
}
function renderCandGrid(){
  const g=$('#candGrid'); if(!g) return;
  let list=[...CANDIDATES];
  const q=candQuery.trim().toLowerCase();
  if(q) list=list.filter(c=>(c.name+' '+c.skills+' '+(c.headline||'')).toLowerCase().includes(q));
  if(candFilter==='shortlisted') list=list.filter(c=>applications.some(a=>a.candId===c.id&&a.status==='shortlisted'));
  if(candFilter==='interview') list=list.filter(c=>primaryStatus(c.id)==='interview');
  if(candFilter==='new') list=list.filter(c=>primaryStatus(c.id)==='applied');
  $('#candCount').textContent=list.length+' candidate'+(list.length===1?'':'s')+' in pipeline';
  g.innerHTML=list.length?list.map(c=>{
    const pj=primaryJobId(c.id), st=primaryStatus(c.id), job=jobById(pj), sc=job?scoreCandidate(c,job).score:0;
    const stCls={applied:'p-active',interview:'p-interview',screening:'p-screening',shortlisted:'p-shortlisted',hired:'p-hired'}[st]||'p-inactive';
    return `<article class="ccard" tabindex="0" role="button" aria-label="View ${esc(c.name)}" onclick="openCandidate('${c.id}')" onkeydown="if(event.key==='Enter')openCandidate('${c.id}')">
      <button class="kebab" aria-label="More actions" aria-haspopup="menu" onclick="event.stopPropagation();toggleKebab(event,'${c.id}')">&#8942;</button>
      ${avatar(c.name,58)}
      <div class="nm">${esc(c.name)}</div><div class="rl">${esc(c.headline)}</div>
      <span class="pill center ${stCls}">${esc(st)}</span>
      <div class="score-line"><span class="bar"><i style="width:${sc}%"></i></span><b>${sc}%</b></div>
      <div class="meta">
        <div class="mrow">${ICONS.mail}<span>${esc(c.email)}</span></div>
        <div class="mrow">${ICONS.phone}<span>${esc(c.phone)}</span></div>
      </div>
      <div class="kv"><span>Applied for</span><b>${esc(job?job.title:'—')}</b></div>
      <div class="kv"><span>Applied on</span><b>${esc((getApp(c.id,pj)||{}).appliedOn||'—')}</b></div>
    </article>`;}).join('')
    :`<div class="empty panel">No candidates match. Try clearing the search.</div>`;
}
function toggleKebab(e, cid){
  closeKebab();
  const btn=e.currentTarget;
  const m=document.createElement('div');
  m.className='kebab-menu'; m.id='kebab-menu'; m.setAttribute('role','menu');
  m.innerHTML=`<button role="menuitem" onclick="closeKebab();openCandidate('${cid}')">${ICONS.user} View profile</button>
    <button role="menuitem" onclick="closeKebab();scheduleFor('${cid}')">${ICONS.cal} Schedule interview</button>
    <button role="menuitem" onclick="closeKebab();messageCandidate('${cid}')">${ICONS.mail} Send message</button>`;
  document.body.appendChild(m);
  const r=btn.getBoundingClientRect();
  m.style.top=(r.bottom+window.scrollY+6)+'px';
  m.style.left=Math.max(8,(r.right+window.scrollX-180))+'px';
  setTimeout(()=>document.addEventListener('click',closeKebab,{once:true}),0);
  document.addEventListener('keydown',function esc2(ev){ if(ev.key==='Escape'){ closeKebab(); document.removeEventListener('keydown',esc2); } });
}
function closeKebab(){ const m=$('#kebab-menu'); if(m) m.remove(); }
function scheduleFor(cid){
  location.hash='#/interviews';
  setTimeout(()=>{
    const app=applications.find(a=>a.candId===cid&&a.status==='interview');
    const s=$('#ivApp');
    if(s&&app){ s.value=app.application_id; s.scrollIntoView({block:'center'}); }
  },150);
}
function messageCandidate(cid){
  const c=candById(cid);
  openModal('Message '+(c?c.name:''), `<div class="field"><label for="cmMsg">Message</label>
    <textarea id="cmMsg" rows="4" placeholder="Write a message to ${esc(c?c.name:'the candidate')}…"></textarea></div>
    <div class="mt" style="display:flex;justify-content:flex-end"><button class="btn" onclick="closeModal();toast('Message sent','ok')">Send</button></div>`);
}
function openCandidate(id){
  const c=candById(id); if(!c) return;
  const pjid=primaryJobId(id), job=jobById(pjid); if(!job) return;
  const s=scoreCandidate(c,job);
  const ivs=interviews.filter(i=>i.candId===id);
  const apps=candJobs(id).map(jid=>({j:jobById(jid), st:appStatus(id,jid)}));
  openModal(c.name, `<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">${avatar(c.name,56)}
    <div><div style="font-weight:800;font-size:17px">${esc(c.name)}</div>
    <div style="color:var(--gray);font-size:13px">${esc(c.headline)} · ${esc(c.location)}</div>
    <div style="margin-top:6px">${pill(primaryStatus(id))}</div></div></div>
    <div class="kv"><span>Email</span><b>${esc(c.email)}</b></div>
    <div class="kv"><span>Phone</span><b>${esc(c.phone)}</b></div>
    <div class="kv"><span>Experience</span><b>${c.exp} years</b></div>
    <div class="kv"><span>Qualification</span><b>${esc(c.qual)}</b></div>
    ${c.resumeText?`<div class="kv"><span>Resume</span><b>${esc(c.resumeName||'resume')} <button class="btn ghost sm" style="margin-left:6px" onclick="viewCandidateResume('${id}')">View</button></b></div>`:`<div class="kv"><span>Resume</span><b style="color:var(--faint)">not uploaded</b></div>`}
    <div style="margin:14px 0 6px;font-weight:700;font-size:13.5px">Skills</div>
    <div class="skillchips">${splitSkills(c.skills).map(x=>`<span class="neutral">${esc(x)}</span>`).join('')}</div>
    <div style="margin:16px 0 6px;font-weight:700;font-size:13.5px">AI match — ${esc(job.title)} <span style="color:var(--accent-dark)">${s.score}%</span></div>
    <div class="breakdown">
      ${[['Skills × 0.65',s.parts.skill],['Experience × 0.20',s.parts.exp],['Education × 0.15',s.parts.edu]].map(([l,v])=>
      `<div class="bd-row"><span>${l}</span><span class="bar"><i style="width:${v*100}%"></i></span><b>${Math.round(v*100)}%</b></div>`).join('')}
    </div>
    <div style="margin:12px 0 6px;font-weight:700;font-size:13.5px">Evidence</div>
    <div class="skillchips">${s.verified.map(x=>`<span class="hit">+ ${esc(x)}</span>`).join('')}${s.claimed.map(x=>`<span class="warn">~ ${esc(x)}</span>`).join('')}${s.missing.map(x=>`<span class="miss">− ${esc(x)}</span>`).join('')}</div>
    <div style="font-size:11.5px;color:var(--faint);margin-bottom:10px">+ evidenced in resume · ~ profile claim only · − missing</div>
    <div style="margin:14px 0 6px;font-weight:700;font-size:13.5px">Applications</div>
    ${apps.map(({j,st})=>{const r=scoreCandidate(c,j);return `<div class="kv"><span>${esc(j.title)}</span><b>${pill(st)} · ${r.score}%</b></div>`;}).join('')}
    ${ivs.length?`<div style="margin:14px 0 6px;font-weight:700;font-size:13.5px">Interviews</div>`+ivs.map(i=>`<div class="kv"><span>${esc(jobById(i.jobId).title)} · ${esc(i.mode)}</span><b>${esc(fmtWhen(i.when))}</b></div>`).join(''):''}
    <div class="mt" style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn ghost sm" onclick="closeModal();location.hash='#/interviews'">Schedule interview</button>
      <button class="btn sm" onclick="saveShortlist('${c.id}','${pjid}')">Shortlist</button>
    </div>`, true);
}
async function saveShortlist(application_id){
  try{
    await api('/api/applications/'+application_id+'/status',{method:'PATCH',body:{status:'shortlisted'}});
    closeModal(); toast('Candidate shortlisted','ok');
    if((location.hash||'').includes('candidates')){ await loadCandidates(); renderCandGrid(); }
    if((location.hash||'').includes('screening')) runScreening();
  }catch(err){ toast(err.message,'err'); }
}
/* ============================== JOBS ============================== */
function vJobs(){
  const isApplicant = session.role==='applicant';
  app.innerHTML=topbar('jobs')+`<main class="page">
    <div class="page-head"><div><h1>Jobs</h1><p class="sub">${isApplicant?'Open roles — your AI match on each card.':'Open roles and their pipelines.'}</p></div>
    <div class="head-actions"><span class="searchbox">${ICONS.search}<input id="jq" placeholder="Search title, company, skill…" oninput="renderJobGrid(this.value)" aria-label="Search jobs"></span>
    ${!isApplicant?`<button class="btn" onclick="location.hash='#/applications'">${ICONS.doc} Applications</button>`:''}</div></div>
    <div class="grid g3" id="jobGrid"></div></main>`+footer();
  renderJobGrid('');
}
function renderJobGrid(q){
  const isApplicant = session.role==='applicant';
  const me = myCandidate();
  const query=(q||'').trim().toLowerCase();
  const list=JOBS.filter(j=>!query || [j.title,j.company,j.skills,j.location,j.type].join(' ').toLowerCase().includes(query));
  $('#jobGrid').innerHTML=list.length?list.map(j=>{
      const apps=jobApplicants(j.id), n=apps.length;
      const match = me ? scoreCandidate(me,j).score : null;
      const myApp = me ? getApp(me.id, j.id) : null;
      const st = myApp ? appStatus(me.id, j.id) : null;
      let action;
      if(!isApplicant) action=`<button class="btn ghost sm" onclick="openJobProfile('${j.id}')">View</button><button class="btn sm" onclick="location.hash='#/applications';setTimeout(()=>selectAppJob('${j.id}'),80)">Applications</button>`;
      else if(!myApp) action=`<button class="btn sm" onclick="openJobProfile('${j.id}')">View &amp; Apply</button>`;
      else action = pill(st);
      return `<div class="jobcard"><div><h3>${esc(j.title)}</h3>
      <div class="loc">${esc(j.company)} · ${esc(j.location)} · ${esc(j.type)}</div></div>
      <p style="font-size:13.5px;color:var(--gray)">${esc(j.desc)}</p>
      <div class="kv"><span>Salary</span><b>${esc(j.salary)}</b></div>
      <div class="kv"><span>Openings</span><b>${j.openings}</b></div>
      <div class="skillchips">${splitSkills(j.skills).map(s=>`<span class="neutral">${esc(s)}</span>`).join('')}</div>
      ${match!==null?`<div class="score-line"><span style="font-size:12px;color:var(--gray)">Your match</span><span class="bar"><i style="width:${match}%"></i></span><b>${match}%</b></div>`:''}
      <div class="foot"><span class="count-pill">${n} applicant${n===1?'':'s'}</span>
        <span style="display:flex;gap:8px">${action}</span></div></div>`;}).join('')
    :'${emptyState("No jobs match your search","Try a different title, company or skill.")}';
}
/* ---- full job profile + guided apply ---- */
function openJobProfile(jid){
  const j=jobById(jid); if(!j) return;
  const isApplicant=session.role==='applicant';
  const me=myCandidate(), myApp=me?getApp(me.id,jid):null;
  const st=myApp?appStatus(me.id,jid):null;
  const match=me?scoreCandidate(me,j).score:null;
  openModal(j.title, `<div class="loc" style="margin-bottom:12px">${esc(j.company)} · ${esc(j.location)} · ${esc(j.type)} · posted ${esc(j.posted)}</div>
    <div class="form2" style="margin-bottom:14px">
      <div class="kv" style="margin:0"><span>Salary</span><b>${esc(j.salary)}</b></div>
      <div class="kv" style="margin:0"><span>Openings</span><b>${j.openings}</b></div>
    </div>
    ${match!==null?`<div class="score-line" style="margin-bottom:14px"><span style="font-size:12px;color:var(--gray)">Your AI match</span><span class="bar"><i style="width:${match}%"></i></span><b>${match}%</b></div>`:''}
    <div style="font-weight:700;font-size:13.5px;margin-bottom:6px">About the role</div>
    <p style="font-size:13.5px;color:var(--gray);margin-bottom:12px">${esc(j.about)}</p>
    <div style="font-weight:700;font-size:13.5px;margin-bottom:6px">What you'll do</div>
    <ul style="font-size:13.5px;color:var(--gray);margin:0 0 12px;padding-left:18px">${j.resp.map(r=>`<li style="margin-bottom:4px">${esc(r)}</li>`).join('')}</ul>
    <div style="font-weight:700;font-size:13.5px;margin-bottom:6px">Required skills</div>
    <div class="skillchips" style="margin-bottom:12px">${splitSkills(j.skills).map(s=>`<span class="neutral">${esc(s)}</span>`).join('')}</div>
    <div class="form2">
      <div class="kv" style="margin:0"><span>Min. experience</span><b>${j.exp} yrs</b></div>
      <div class="kv" style="margin:0"><span>Qualification</span><b>${esc(j.qual)}</b></div>
    </div>
    <div class="mt">${isApplicant
      ? (!myApp ? `<button class="btn block" onclick="openApply('${jid}')">Apply for this role</button>`
        : st==='interview' ? `<div class="empty">Approved for interview — arrange it in <a href="#/interviews" onclick="closeModal()" style="color:var(--accent-dark);font-weight:600">My Interviews</a>.</div>`
        : `<div class="empty">Application ${pill(st)} — we'll notify you when it moves.</div>`)
      : `<button class="btn block" onclick="closeModal();location.hash='#/applications';setTimeout(()=>selectAppJob('${jid}'),80)">View applications (${jobApplicants(jid).length})</button>`}</div>`, true);
}
function openApply(jid){
  const j=jobById(jid), me=myCandidate(); if(!j||!me) return;
  if(getApp(me.id,jid)){ toast('You already applied for this role','err'); return; }
  window._apply={jid, step:1};
  renderApplyStep();
}
function renderApplyStep(){
  const {jid,step}=window._apply, j=jobById(jid), me=myCandidate();
  const res=me.resumeText?{name:me.resumeName||'resume'}:null;
  const steps=['Your profile','Resume','Cover note'];
  const body = step===1 ? `
    <p style="font-size:13.5px;color:var(--gray);margin-bottom:12px">The recruiter sees exactly this — keep it accurate.</p>
    <div class="kv"><span>Name</span><b>${esc(me.name)}</b></div>
    <div class="kv"><span>Email</span><b>${esc(me.email)}</b></div>
    <div class="kv"><span>Phone</span><b>${esc(me.phone)}</b></div>
    <div class="kv"><span>Skills</span><b>${esc(me.skills)}</b></div>
    <div class="kv"><span>Experience</span><b>${me.exp} yrs</b></div>
    <div class="kv"><span>Qualification</span><b>${esc(me.qual)}</b></div>
    <button class="btn ghost sm mt" onclick="closeModal();location.hash='#/profile'">Edit in Profile</button>`
  : step===2 ? `
    <p style="font-size:13.5px;color:var(--gray);margin-bottom:12px">Your resume goes to the recruiter with this application.</p>
    ${res?`<div class="resume-row"><div class="ic">${ICONS.doc}</div>
      <div style="flex:1"><b style="font-size:13.5px">${esc(res.name)}</b>
      <div style="font-size:12px;color:var(--gray)">On your profile — the recruiter sees it with this application.</div></div></div>`
    :`<div class="empty">No resume on your profile yet.</div>
      <div class="field"><label for="apFile">Attach resume (PDF, DOCX, TXT — max 5 MB)</label><input id="apFile" type="file" accept=".pdf,.docx,.txt"></div>`}`
  : `
    <p style="font-size:13.5px;color:var(--gray);margin-bottom:12px">Optional — a line or two the recruiter reads first.</p>
    <div class="field"><label for="apNote">Cover note</label><textarea id="apNote" rows="4" placeholder="Why are you a fit for ${esc(j.title)}?"></textarea></div>
    <div class="kv"><span>Role</span><b>${esc(j.title)} · ${esc(j.company)}</b></div>
    <div class="kv"><span>Your AI match</span><b>${scoreCandidate(me,j).score}%</b></div>`;
  openModal('Apply — '+j.title, `
    <div class="steps">${steps.map((s,i)=>`<span class="step${i+1===step?' on':''}${i+1<step?' done':''}">${i+1}. ${s}</span>`).join('')}</div>
    <div class="mt">${body}</div>
    <div class="mt" style="display:flex;gap:8px;justify-content:flex-end">
      ${step>1?`<button class="btn ghost" onclick="window._apply.step--;renderApplyStep()">Back</button>`:''}
      ${step<3?`<button class="btn" onclick="applyNext()">Continue</button>`
              :`<button class="btn" onclick="submitApplication()">Submit application</button>`}
    </div>`);
}
async function uploadResumeFile(file){
  if(!file) throw new Error('Choose a file first');
  if(!/\.(pdf|docx|txt)$/i.test(file.name)) throw new Error('Only PDF, DOCX or TXT');
  if(file.size>5*1024*1024) throw new Error('Resume must be under 5 MB');
  const fd=new FormData(); fd.append('file', file);
  const res=await fetch(API_BASE+'/api/applicants/me/resume',{
    method:'POST', headers: apiToken?{Authorization:'Bearer '+apiToken}:{}, body:fd });
  if(!res.ok){ const t=await res.text(); throw new Error(t||'Upload failed'); }
  const out=await res.json();
  await loadMyProfile();
  if(CANDIDATES.length && ME) CANDIDATES[0]=ME;
  return out;
}
function applyNext(){
  const {step}=window._apply, me=myCandidate();
  if(step===2 && !me.resumeText){
    const f=$('#apFile')&&$('#apFile').files[0];
    if(!f){ toast('Attach your resume to continue','err'); return; }
    toast('Uploading resume…');
    uploadResumeFile(f).then(out=>{
      const n=(out.extracted_skills||[]).length;
      toast(n?`Resume parsed — ${n} skills extracted`:'Resume uploaded','ok');
      window._apply.step++; renderApplyStep();
    }).catch(err=>toast(err.message,'err'));
    return;
  }
  window._apply.step++; renderApplyStep();
}
async function submitApplication(){
  const {jid}=window._apply, me=myCandidate(), j=jobById(jid);
  try{
    await api('/api/applications',{method:'POST',body:{job_id:j.job_id}});
    await loadMyApplications();
    closeModal(); toast('Application sent to the recruiter','ok'); vJobs();
  }catch(err){ toast(err.message,'err'); }
}
function openRequestInterview(jid){
  const j=jobById(jid), me=myCandidate(); if(!me) return;
  const myApp=getApp(me.id,jid);
  if(!myApp){ toast('Apply for this role first','err'); return; }
  if(appStatus(me.id,jid)!=='interview'){ toast('The recruiter approves applications for interview first','err'); return; }
  const existing=interviews.find(i=>i.application_id===myApp.application_id&&['proposed','scheduled'].includes(i.status));
  if(existing){ toast('You already have a pending or scheduled interview for this role','err'); return; }
  openModal('Request interview', `<p style="font-size:13.5px;color:var(--gray);margin-bottom:14px">
    Propose a slot for <b style="color:var(--ink)">${esc(j.title)}</b> — your AI match is
    <b style="color:var(--accent-dark)">${scoreCandidate(me,j).score}%</b>. The recruiter accepts or declines.</p>
    <form id="rqForm" novalidate>
      <div class="form2">
        <div class="field"><label for="rqWhen">Proposed date &amp; time</label><input id="rqWhen" type="datetime-local"><div class="err">Pick a future date.</div></div>
        <div class="field"><label for="rqMode">Mode</label><select id="rqMode"><option>online</option><option>in-person</option><option>phone</option></select></div>
      </div>
      <div class="field"><label for="rqMsg">Message to the recruiter</label>
      <textarea id="rqMsg" rows="3" placeholder="A line or two about why you're a fit…"></textarea></div>
      <button class="btn block" type="submit">Send request</button></form>`);
  $('#rqForm').onsubmit=async e=>{ e.preventDefault();
    const when=$('#rqWhen').value;
    const ok=when && new Date(when)>new Date();
    $('#rqWhen').closest('.field').classList.toggle('invalid',!ok);
    if(!ok) return;
    const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true;
    try{
      await api('/api/interviews/propose',{method:'POST',body:{
        application_id:myApp.application_id, scheduled_on:new Date(when).toISOString(),
        mode:$('#rqMode').value, message:$('#rqMsg').value.trim()||null }});
      await loadMyInterviews();
      closeModal(); toast('Interview requested for '+fmtWhen(when),'ok'); vInterviews();
    }catch(err){ toast(err.message,'err'); btn.disabled=false; }
  };
}
function goScreen(jid){ location.hash='#/screening'; setTimeout(()=>{ const s=$('#scrJob'); if(s){ s.value=jid; runScreening(); } },60); }

/* ============================== SCREENING ============================== */
function vScreening(){
  app.innerHTML=topbar('screening')+`<main class="page">
    <div class="page-head"><div><h1>AI Screening</h1><p class="sub">Deterministic, explainable ranking — resume evidence required.</p></div></div>
    <div class="panel mb"><div class="form2" style="align-items:end">
      <div class="field" style="margin:0"><label for="scrJob">Job</label><select id="scrJob">${JOBS.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('')}</select></div>
      <div><button class="btn block" onclick="runScreening()">Run AI Screening</button></div>
    </div></div>
    <div id="rankList"><div class="empty panel">Choose a job and run screening to see the ranked shortlist.</div></div>
  </main>`+footer();
}
function runScreening(){
  const job=jobById($('#scrJob').value); if(!job) return;
  const box=$('#rankList');
  box.innerHTML='<div class="empty panel">Scoring candidates against '+esc(job.title)+'…</div>';
  (async()=>{
    try{
      const res=await api('/api/screening/job/'+job.job_id+'/run',{method:'POST'});
      const ranking=res.ranking||[];
      window._lastRank={job,ranking};
      const byEmail={}; CANDIDATES.forEach(c=>byEmail[c.email]=c);
      const chipCls={evidenced:'hit',claimed:'warn',missing:'miss'};
      const chipMark={evidenced:'+ ',claimed:'~ ',missing:'− '};
      box.innerHTML='<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" onclick="exportShortlist()">Export shortlist (CSV)</button></div>'
      +'<div class="grid" style="gap:12px" aria-live="polite">'+ranking.map((r,i)=>{
        const c=byEmail[r.email]||{name:r.candidate_name,email:r.email,skills:r.candidate_skills||'',exp:r.candidate_experience||0,qual:'',location:'',headline:''};
        const parts=scoreCandidate(c,job).parts;
        const ev=r.skill_evidence||[];
        return `
        <div class="rank"><div class="pos ${i===0?'top':''}">${i+1}</div>
          <div class="who"><div class="nm">${esc(r.candidate_name)}</div><div class="rl">${esc(c.headline||'')} · ${c.exp} yrs · ${esc(c.location||'')}</div>
            <div class="skillchips">${ev.map(e=>`<span class="${chipCls[e.status]}">${chipMark[e.status]}${esc(e.skill)}</span>`).join('')}</div>
            <div style="font-size:11.5px;color:var(--faint);margin-bottom:6px">+ evidenced in resume · ~ claimed on profile only · − missing</div>
            <div class="breakdown" style="max-width:420px">
              ${[['Skills',parts.skill],['Experience',parts.exp],['Education',parts.edu]].map(([l,v])=>
              `<div class="bd-row"><span>${l}</span><span class="bar"><i style="width:${v*100}%"></i></span><b>${Math.round(v*100)}%</b></div>`).join('')}
            </div></div>
          <div class="bigscore"><div class="v">${r.score}%</div><div class="l">match</div>
            <div class="mt"><button class="btn ghost sm" onclick="saveShortlist(${r.application_id})">Shortlist</button></div></div>
        </div>`;}).join('')+'</div>';
      toast('Screened '+ranking.length+' candidates for '+job.title,'ok');
    }catch(err){ box.innerHTML='<div class="empty panel">Screening failed: '+esc(err.message)+'</div>'; }
  })();
}
function exportShortlist(){
  const lr=window._lastRank; if(!lr){ toast('Run screening first','err'); return; }
  const rows=[['Rank','Name','Email','Experience (yrs)','Score %','Evidenced skills','Claimed skills','Missing skills']];
  lr.ranking.forEach((r,i)=>{
    const ev=r.skill_evidence||[];
    const pick=s=>ev.filter(e=>e.status===s).map(e=>e.skill).join('; ');
    rows.push([i+1,r.candidate_name,r.email,r.candidate_experience,r.score,pick('evidenced'),pick('claimed'),pick('missing')]);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='smartrecruit-shortlist-'+lr.job.title.toLowerCase().replace(/\s+/g,'-')+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Shortlist downloaded','ok');
}

/* ============================== APPLICATIONS (recruiter inbox) ============================== */
let _appJob=null, _appSort='score';
function vApplications(){
  if(!_appJob && JOBS.length) _appJob=JOBS[0].id;
  app.innerHTML=topbar('applications')+`<main class="page">
    <div class="page-head"><div><h1>Applications</h1><p class="sub">Pick a published role — review, AI-rank, approve for interview.</p></div>
    <div class="head-actions"><button class="btn" onclick="goScreen(_appJob)">${ICONS.chart} AI Screening</button></div></div>
    <div class="panel mb"><div class="form2" style="align-items:end">
      <div class="field" style="margin:0"><label for="appJob">Published role</label>
        <select id="appJob" onchange="selectAppJob(this.value)">${JOBS.map(j=>`<option value="${j.id}"${j.id===_appJob?' selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('')}</select></div>
      <div class="field" style="margin:0"><label for="appSort">Order by</label>
        <select id="appSort" onchange="_appSort=this.value;renderAppList()">
          <option value="score"${_appSort==='score'?' selected':''}>AI score (highest first)</option>
          <option value="date"${_appSort==='date'?' selected':''}>Applied date (newest first)</option>
        </select></div>
    </div></div>
    <div class="panel"><div class="mb" style="display:flex;justify-content:space-between;align-items:center">
      <h3 style="margin:0" id="appCount"></h3>
      <button class="btn sm" id="bulkApprove" onclick="approveSelected()">Approve selected for interview</button></div>
      <div id="appList"></div></div>
  </main>`+footer();
  renderAppList();
}
function selectAppJob(jid){ _appJob=jid; const s=$('#appJob'); if(s) s.value=jid; renderAppList(); }
function renderAppList(){
  const box=$('#appList'); if(!box) return;
  const j=jobById(_appJob);
  box.innerHTML='<div class="empty">Loading applications…</div>';
  (async()=>{
    try{
      await loadJobApplications(j.job_id);
      let rows=applications
        .map(a=>({a, c:candById(a.candId), r:scoreCandidate(candById(a.candId)||{skills:'',exp:0,qual:''}, j)}))
        .filter(x=>x.c);
      rows.sort((x,y)=>_appSort==='score' ? y.r.score-x.r.score : (y.a.appliedOn>x.a.appliedOn?1:-1));
      $('#appCount').textContent=`${rows.length} application${rows.length===1?'':'s'} — ${j.title}`;
      if(!rows.length){ box.innerHTML=emptyState("No applications yet","Applications for this role will appear here.",ICONS.users); return; }
      box.innerHTML=rows.map(({a,c,r})=>{
        const st=a.status;
        return `<div class="app-row">
          <input type="checkbox" class="app-check" data-aid="${a.application_id}" aria-label="Select ${esc(c.name)}"${['interview','hired','rejected'].includes(st)?' disabled':''}>
          <div class="ava">${avatar(c.name,40)}</div>
          <div class="who"><b>${esc(c.name)}</b>
            <div class="meta">${esc(c.email)} · applied ${esc(a.appliedOn)}${c.resumeName?' · '+esc(c.resumeName):''}</div>
            <div class="meta">${r.matched.slice(0,3).map(esc).join(', ')||'—'}</div></div>
          <div class="app-score"><div class="score-line"><span class="bar"><i style="width:${r.score}%"></i></span><b>${r.score}%</b></div></div>
          <div>${pill(st)}</div>
          <div class="app-actions">
            <button class="btn ghost sm" onclick="openCandidate('${c.id}')">Profile</button>
            ${['interview','hired','rejected'].includes(st)?'':`<button class="btn sm" onclick="approveForInterview(${a.application_id})">Approve</button>
            <button class="btn ghost sm" onclick="rejectApp(${a.application_id})">Reject</button>`}
          </div></div>`;
      }).join('');
    }catch(err){ box.innerHTML='<div class="empty">Could not load applications: '+esc(err.message)+'</div>'; }
  })();
}
async function setApplicationStatus(application_id, status){
  await api('/api/applications/'+application_id+'/status',{method:'PATCH',body:{status}});
}
async function approveForInterview(application_id){
  try{
    await setApplicationStatus(application_id,'interview');
    toast('Approved for interview — the candidate can request a slot from My Interviews','ok');
    renderAppList();
  }catch(err){ toast(err.message,'err'); }
}
async function rejectApp(application_id){
  try{
    await setApplicationStatus(application_id,'rejected');
    toast('Application rejected','err'); renderAppList();
  }catch(err){ toast(err.message,'err'); }
}
async function approveSelected(){
  const ids=[...document.querySelectorAll('.app-check:checked')].map(x=>x.dataset.aid);
  if(!ids.length){ toast('Select at least one application','err'); return; }
  try{
    await Promise.all(ids.map(id=>setApplicationStatus(id,'interview')));
    toast(ids.length+' candidate'+(ids.length>1?'s':'')+' approved for interview','ok');
    renderAppList();
  }catch(err){ toast(err.message,'err'); }
}

/* ============================== INTERVIEWS ============================== */
function fmtWhen(iso){ const d=new Date(iso); return d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
function vInterviews(){
  const isApplicant = session.role==='applicant';
  const me = myCandidate();
  const proposed = interviews.filter(i=>i.status==='proposed');
  const decided = interviews.filter(i=>['declined'].includes(i.status));
  const myIvs = isApplicant ? interviews.filter(i=>['scheduled','completed'].includes(i.status)) : interviews.filter(i=>['scheduled','completed'].includes(i.status));
  const myReqs = isApplicant ? interviews.filter(i=>['proposed','declined'].includes(i.status)) : [];
  const approved = isApplicant && me ? applications.filter(a=>a.status==='interview'
    && !interviews.some(i=>i.application_id===a.application_id && ['proposed','scheduled'].includes(i.status))) : [];
  // recruiter schedule form: approved applications (status interview)
  const schedApps = !isApplicant ? applications.filter(a=>a.status==='interview') : [];
  app.innerHTML=topbar('interviews')+`<main class="page">
    <div class="page-head"><div><h1>${isApplicant?'My Interviews':'Interviews'}</h1>
    <p class="sub">${isApplicant?'Request slots for approved roles, track requests, see scheduled conversations.':'Requests from applicants, scheduling, and outcomes.'}</p></div></div>
    ${isApplicant?`<div class="panel mb"><h3>Approved for interview ${approved.length?`<span class="count-pill">${approved.length}</span>`:''}</h3>
      <p class="sub">The recruiter accepted your application — propose a slot or wait for them to schedule.</p>
      ${approved.length?approved.map(a=>{const j=jobById(a.jobId);return `
        <div class="req-card"><div class="req-ava">${avatar(j?j.company:'?',44)}</div>
          <div class="req-body"><div><b>${esc(j?j.title:'')}</b></div>
          <div class="req-meta">${esc(j?j.company:'')} · your AI match ${j?scoreCandidate(me,j).score:0}%</div></div>
          <div class="req-actions"><button class="btn sm" onclick="openRequestInterview('${a.jobId}')">Request interview</button></div>
        </div>`;}).join('')
      :'${emptyState("Nothing waiting","Approved applications will appear here.",ICONS.check)}'}
    </div>`:''}
    ${!isApplicant?`
    <div class="panel mb"><h3>Interview requests ${proposed.length?`<span class="count-pill">${proposed.length} pending</span>`:''}</h3>
      <p class="sub">The applicant proposes a slot — you accept or decline.</p><div id="reqList">
      ${proposed.length?proposed.map(r=>{const c=candById(r.candId),j=jobById(r.jobId);const sc=(c&&j)?scoreCandidate(c,j).score:'—';return `
        <div class="req-card"><div class="req-ava">${avatar(r.candName||'?',44)}</div>
          <div class="req-body"><div><b>${esc(r.candName||'—')}</b> <span style="color:var(--gray);font-size:12.5px">requests</span> <b>${esc(r.jobTitle||'')}</b>
          ${c?`<span class="count-pill" style="margin-left:6px">${sc}% match</span>`:''}</div>
          <div class="req-slot">${ICONS.cal}<b>${esc(r.when?fmtWhen(r.when):'—')}</b><span> · ${esc(r.mode||'')}</span></div>
          <div class="req-msg">"${esc(r.message||'No message.')}"</div>
          <div class="req-meta">${esc(r.candName||'')}</div></div>
          <div class="req-actions"><button class="btn sm" onclick="decideRequest(${r.interview_id},'accept')">Accept</button>
          <button class="btn ghost sm" onclick="decideRequest(${r.interview_id},'decline')">Decline</button></div>
        </div>`;}).join('')
      :'<div class="empty">No pending requests. New applicant requests appear here.</div>'}
      </div></div>`:''}
    <div class="grid g2">
      ${!isApplicant?`<div class="panel"><h3>Schedule interview</h3><p class="sub">Pick an approved application and a slot.</p>
        <form id="ivForm" novalidate>
          <div class="field"><label>Approved application</label><select id="ivApp">${schedApps.map(a=>{const c=candById(a.candId),j=jobById(a.jobId);return `<option value="${a.application_id}">${esc(c?c.name:'?')} — ${esc(j?j.title:'?')}</option>`;}).join('')}</select></div>
          <div class="form2">
            <div class="field"><label>Date &amp; time</label><input id="ivWhen" type="datetime-local"><div class="err">Pick a future date.</div></div>
            <div class="field"><label>Mode</label><select id="ivMode"><option>online</option><option>in-person</option><option>phone</option></select></div>
          </div>
          <div class="field"><label>Interviewer</label><input id="ivBy" placeholder="Meera Nair"></div>
          <button class="btn block" type="submit">Schedule</button>
        </form></div>`:''}
      <div class="panel"><h3>${isApplicant?'My requests':'Scheduled'}</h3>
        <p class="sub">${isApplicant?'Track what you asked for.':myIvs.length+' upcoming & past.'}</p>
        ${isApplicant&&myReqs.length?myReqs.map(r=>{const j=jobById(r.jobId);return `
          <div class="feed-item"><div><b>Interview request — ${esc(j?j.title:r.jobTitle)}</b>
          <div style="font-size:12.5px;color:var(--gray)">${r.when?esc(fmtWhen(r.when))+' · ':''}${esc(r.mode||'')}</div>
          ${r.message?`<div style="font-size:12.5px;color:var(--gray)">"${esc(r.message)}"</div>`:''}</div>
          <span class="t">${pill(r.status)}</span></div>`;}).join(''):''}
        <div id="ivList"></div></div>
    </div></main>`+footer();
  const render=()=>{
    $('#ivList').innerHTML=myIvs.length?myIvs.map(i=>{const j=jobById(i.jobId);return `
      <div class="feed-item">${avatar(i.candName||'?',36)}<div><b>${esc(i.candName||'—')}</b>
      <div style="font-size:12.5px;color:var(--gray)">${esc(j?j.title:i.jobTitle)} · ${esc(i.mode)} · ${esc(i.by||'')}</div>
      ${i.feedback?`<div style="font-size:12.5px;margin-top:4px">"${esc(i.feedback)}"</div>`:''}</div>
      <span class="t">${esc(fmtWhen(i.when))}<br>${pill(i.result||'pending')}</span></div>`;}).join('')
      :emptyState("No interviews scheduled","Scheduled interviews will appear here.",ICONS.cal);
  };
  render();
  const f=$('#ivForm');
  if(f) f.onsubmit=async e=>{ e.preventDefault();
    const when=$('#ivWhen').value;
    const ok=when && new Date(when)>new Date();
    $('#ivWhen').closest('.field').classList.toggle('invalid',!ok);
    if(!ok) return;
    const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true;
    try{
      await api('/api/interviews',{method:'POST',body:{
        application_id:parseInt($('#ivApp').value,10),
        scheduled_on:new Date(when).toISOString(),
        mode:$('#ivMode').value, interviewer:$('#ivBy').value.trim()||null }});
      await loadRecruiterInterviews();
      render(); toast('Interview scheduled','ok'); e.target.reset();
    }catch(err){ toast(err.message,'err'); }
    btn.disabled=false;
  };
}
async function addInterview(){ /* replaced by direct API call in the form */ }
async function decideRequest(interview_id, verdict){
  try{
    await api('/api/interviews/'+interview_id+'/respond',{method:'PATCH',body:{action:verdict}});
    await loadRecruiterInterviews();
    toast(verdict==='accept'?'Slot accepted — interview scheduled':'Proposal declined', verdict==='accept'?'ok':'err');
    vInterviews();
  }catch(err){ toast(err.message,'err'); }
}

/* ============================== ADMIN ============================== */
function vAdmin(){
  app.innerHTML=topbar('admin')+`<main class="page">
    <div class="page-head"><div><h1>Admin</h1><p class="sub">Workspace users and roles.</p></div></div>
    <div class="panel"><div class="empty">Loading users…</div></div></main>`+footer();
  (async()=>{
    try{
      const users=await api('/api/admin/users');
      app.querySelector('.panel').innerHTML=`<table class="tbl"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>
        ${users.map(u=>`<tr><td><div style="display:flex;gap:10px;align-items:center">${avatar(u.name,32)}<b>${esc(u.name)}</b></div></td><td>${esc(u.email)}</td><td style="text-transform:capitalize">${esc(u.role)}</td><td><span class="pill p-active">active</span></td></tr>`).join('')}
      </tbody></table>`;
    }catch(err){ app.querySelector('.panel').innerHTML='<div class="empty">Could not load users: '+esc(err.message)+'</div>'; }
  })();
}

/* ============================== PROFILE ============================== */
function vProfile(){
  const me=myCandidate();
  if(!me){ location.hash='#/jobs'; return; }
  const res=me.resumeText?{name:me.resumeName||'resume'}:null;
  const myJobs=candJobs(me.id).map(jid=>({j:jobById(jid), s:jobById(jid)?scoreCandidate(me,jobById(jid)):{score:0}})).filter(x=>x.j);
  app.innerHTML=topbar('profile')+`<main class="page">
    <div class="page-head"><div><h1>My Profile</h1><p class="sub">Keep it fresh — recruiters and the AI read this.</p></div>
    <div class="head-actions">${avatar(me.name,40)}</div></div>
    <div class="grid g2">
      <div class="panel"><h3>Profile details</h3><p class="sub">Edits update your AI match scores instantly.</p>
        <form id="pfForm" novalidate>
          <div class="field"><label>Full name</label><input id="pfName" value="${esc(me.name)}"></div>
          <div class="form2">
            <div class="field"><label>Phone</label><input id="pfPhone" value="${esc(me.phone)}"></div>
            <div class="field"><label>Location</label><input id="pfLoc" value="${esc(me.location)}"></div>
          </div>
          <div class="field"><label>Headline</label><input id="pfHead" value="${esc(me.headline)}"></div>
          <div class="field"><label>Skills (comma-separated)</label><input id="pfSkills" value="${esc(me.skills)}"></div>
          <div class="form2">
            <div class="field"><label>Experience (years)</label><input id="pfExp" type="number" min="0" step="0.5" value="${me.exp}"></div>
            <div class="field"><label>Qualification</label><input id="pfQual" value="${esc(me.qual)}"></div>
          </div>
          <button class="btn block" type="submit">Save profile</button>
        </form></div>
      <div>
        <div class="panel"><h3>Resume</h3><p class="sub">PDF, DOCX or TXT, up to 5 MB — like the full product.</p>
          ${res?`<div class="resume-row"><div class="ic">${ICONS.doc}</div>
            <div style="flex:1;min-width:0"><b style="font-size:13.5px">${esc(res.name)}</b>
            <div style="font-size:12px;color:var(--gray)">Parsed by the AI — skills feed your match scores.</div></div>
            <button class="btn ghost sm" onclick="viewResume()">View</button></div>
            <div class="mt"></div>`:'<div class="empty">No resume yet — upload one below.</div>'}
          <div class="field"><label for="rsFile">Choose file</label><input id="rsFile" type="file" accept=".pdf,.docx,.txt"></div>
          <button class="btn block" onclick="uploadResume()">Upload &amp; parse resume</button>
          <div id="parseOut" class="mt"></div>
        </div>
        <div class="panel mt"><h3>Your matches</h3><p class="sub">Live AI scores for roles you applied to.</p>
          ${myJobs.length?myJobs.map(({j,s})=>`<div class="kv"><span>${esc(j.title)}</span><b>${s.score}%</b></div>
            <div class="score-line" style="margin:2px 0 8px"><span class="bar"><i style="width:${s.score}%"></i></span></div>`).join('')
          :'<div class="empty">No applications yet — browse Jobs.</div>'}
        </div>
      </div>
    </div></main>`+footer();
  $('#pfForm').onsubmit=async e=>{ e.preventDefault();
    const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true;
    try{
      await api('/api/applicants/me',{method:'PUT',body:{
        phone:$('#pfPhone').value.trim()||null, location:$('#pfLoc').value.trim()||null,
        skills:$('#pfSkills').value.trim()||null,
        experience_years:parseFloat($('#pfExp').value)||0,
        qualification:$('#pfQual').value.trim()||null }});
      await loadMyProfile(); CANDIDATES=[ME];
      toast('Profile saved — match scores updated','ok'); vProfile();
    }catch(err){ toast(err.message,'err'); btn.disabled=false; }
  };
}
function uploadResume(){
  const me=myCandidate(); if(!me) return;
  const inp=$('#rsFile'), f=inp.files[0];
  if(!f){ toast('Choose a resume file first','err'); return; }
  toast('Uploading resume…');
  uploadResumeFile(f).then(out=>{
    const skills=out.extracted_skills||[];
    $('#parseOut').innerHTML=`<div style="font-weight:700;font-size:13px;margin-bottom:8px">AI extracted</div>
      <div class="skillchips">${skills.map(s=>`<span class="hit">${esc(s)}</span>`).join('')||'<span class="neutral">no known skills found</span>'}</div>
      <div class="kv mt"><span>Experience</span><b>${out.extracted_experience_years||0} yrs</b></div>
      <div class="kv"><span>Qualification</span><b>${esc(out.extracted_qualification||'—')}</b></div>
      <p style="font-size:12.5px;color:var(--gray)">Your profile was updated automatically — match scores use the new data.</p>`;
    toast('Resume parsed and profile updated','ok');
  }).catch(err=>toast(err.message,'err'));
}
function resumePreviewHtmlText(text){
  const lines=text.split('\n');
  let html=`<div class="resume-paper"><h4>${esc((lines[0]||'').trim())}</h4><div class="rsub">${esc((lines[1]||'').trim())}<br>${esc((lines[2]||'').trim())}</div>`;
  let i=3;
  const isSec=l=>/^[A-Z][A-Z \-\/]+$/.test(l.trim()) && l.trim().length<30;
  while(i<lines.length){
    const l=lines[i].trim();
    if(!l){ i++; continue; }
    if(isSec(l)){ html+=`<div class="rsec">${esc(l)}</div>`; i++; continue; }
    if(l.startsWith('-')){ html+='<ul>'; while(i<lines.length&&lines[i].trim().startsWith('-')){ html+=`<li>${esc(lines[i].trim().slice(1).trim())}</li>`; i++; } html+='</ul>'; continue; }
    html+=`<p style="margin:4px 0">${esc(l)}</p>`; i++;
  }
  return html+'</div>';
}
function viewResume(){
  const me=myCandidate();
  if(!me||!me.resumeText){ toast('No resume uploaded','err'); return; }
  openModal('Resume — '+me.name, resumePreviewHtmlText(me.resumeText), true);
}
function viewCandidateResume(cid){
  const c=candById(cid);
  if(!c||!c.resumeText){ toast('No resume on file for this candidate','err'); return; }
  openModal('Resume — '+c.name, resumePreviewHtmlText(c.resumeText), true);
}
function openSearch(){
  const isApplicant=session.role==='applicant';
  openModal('Search', `<div class="field" style="margin-bottom:10px"><label for="gq">Search ${isApplicant?'jobs':'jobs and candidates'}</label>
    <input id="gq" placeholder="Try 'python', 'designer', 'Bengaluru'…" autocomplete="off"></div>
    <div id="gRes">${emptyState("Start typing to search","Results appear as you type.",ICONS.search)}</div>`);
  const inp=$('#gq'); inp.focus();
  inp.oninput=()=>{
    const q=inp.value.trim().toLowerCase(), box=$('#gRes');
    if(q.length<2){ box.innerHTML=emptyState("Start typing to search","Results appear as you type.",ICONS.search); return; }
    const jhits=JOBS.filter(j=>[j.title,j.company,j.skills,j.location].join(' ').toLowerCase().includes(q));
    let html='';
    if(jhits.length) html+=`<div style="font-size:12px;font-weight:700;color:var(--faint);margin:8px 0 4px">JOBS</div>`+
      jhits.map(j=>`<div class="feed-item" style="cursor:pointer" onclick="closeModal();openJobProfile('${j.id}')">
        <div><b>${esc(j.title)}</b><div style="font-size:12px;color:var(--gray)">${esc(j.company)} · ${esc(j.location)}</div></div>
        <span class="t">${esc(j.salary)}</span></div>`).join('');
    if(!isApplicant){
      const chits=CANDIDATES.filter(c=>[c.name,c.headline,c.skills,c.location].join(' ').toLowerCase().includes(q)).slice(0,6);
      if(chits.length) html+=`<div style="font-size:12px;font-weight:700;color:var(--faint);margin:8px 0 4px">CANDIDATES</div>`+
        chits.map(c=>`<div class="feed-item" style="cursor:pointer" onclick="closeModal();openCandidate('${c.id}')">
          ${avatar(c.name,32)}<div><b>${esc(c.name)}</b><div style="font-size:12px;color:var(--gray)">${esc(c.headline)} · ${esc(c.location)}</div></div></div>`).join('');
    }
    box.innerHTML=html||'<div class="empty">No matches. Try a skill, title or city.</div>';
  };
}
/* ============================== MODAL / LEGAL ============================== */
function openModal(title, html, wide){
  const r=$('#modal-root');
  r.innerHTML=`<div class="overlay" onclick="if(event.target===this)closeModal()"><div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-h"><h3>${esc(title)}</h3><button class="x" onclick="closeModal()" aria-label="Close">${ICONS.x}</button></div>
    <div class="modal-b">${html}</div></div></div>`;
  const f=r.querySelector('input,select,button.x'); if(f) f.focus();
  document.addEventListener('keydown', escClose);
}
function escClose(e){ if(e.key==='Escape') closeModal(); }
function closeModal(){ $('#modal-root').innerHTML=''; document.removeEventListener('keydown', escClose); }
function openLegal(which){
  const isT=which==='terms';
  openModal(isT?'Terms of Service':'Privacy Policy', `<span class="draft-tag">DRAFT — FOR REVIEW</span><div class="legal-prose">
    ${isT?`<h4>1. The demo</h4><p>SmartRecruit is demonstrated with synthetic candidate data. No real personal data is collected, stored, or processed by this demo site.</p>
    <h4>2. Accounts</h4><p>Demo accounts are shared and carry no security guarantees. Do not use real credentials.</p>
    <h4>3. AI screening</h4><p>Rankings come from a published deterministic formula. They are illustrative and not hiring advice.</p>`
    :`<h4>1. Data in this demo</h4><p>Candidate profiles are fictional demo data stored in the SmartRecruit PostgreSQL database. Your login session token is kept in your browser's local storage.</p>
    <h4>2. No tracking</h4><p>This demo sets no analytics cookies and makes no third-party requests.</p>
    <h4>3. Production note</h4><p>A production deployment would need a published retention policy, consent flows, and data-processing terms before handling real candidate data.</p>`}
    <p style="color:var(--faint);font-size:12.5px">Final legal text must be reviewed by counsel before any production use.</p></div>`);
}

boot();
