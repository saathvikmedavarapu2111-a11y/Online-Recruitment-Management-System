/* SmartRecruit presentation site — demo SPA.
   Data mirrors seed.sql (labeled demo). Scoring is a faithful JS port of
   app/ai/matcher.py: score = 100*(0.65*skill + 0.20*exp + 0.15*edu). */
'use strict';

/* ============================== DATA ============================== */
const CANDIDATES = [
  { id:'c1', name:'Aarav Mehta', email:'aarav.mehta@example.com', phone:'+91 98200 11223',
    location:'Bengaluru', headline:'Backend Developer', dept:'Engineering',
    skills:'python, django, postgresql, rest, docker', exp:3.0, qual:'B.Tech Computer Science',
    appliedOn:'02 Oct 2026', active:true },
  { id:'c2', name:'Sneha Rao', email:'sneha.rao@example.com', phone:'+91 98200 44556',
    location:'Hyderabad', headline:'Java Developer', dept:'Engineering',
    skills:'java, spring, postgresql, microservices', exp:2.0, qual:'B.Tech Information Technology',
    appliedOn:'03 Oct 2026', active:true },
  { id:'c3', name:'Vikram Nair', email:'vikram.nair@example.com', phone:'+91 98200 77889',
    location:'Chennai', headline:'Frontend Developer', dept:'Engineering',
    skills:'javascript, react, node.js, css', exp:1.5, qual:'B.Sc Computer Science',
    appliedOn:'04 Oct 2026', active:true },
  { id:'c4', name:'Divya Patel', email:'divya.patel@example.com', phone:'+91 98200 99001',
    location:'Pune', headline:'Data Analyst', dept:'Data Science',
    skills:'python, pandas, sql, machine learning', exp:2.5, qual:'M.Sc Data Science',
    appliedOn:'05 Oct 2026', active:false },
  { id:'c5', name:'Priya Sharma', email:'priya.sharma@example.com', phone:'+91 98200 22334',
    location:'Mumbai', headline:'Frontend Developer', dept:'Engineering',
    skills:'javascript, typescript, react, css', exp:2.5, qual:'B.Tech Computer Science',
    appliedOn:'06 Oct 2026', active:true },
  { id:'c6', name:'Rahul Verma', email:'rahul.verma@example.com', phone:'+91 98200 33445',
    location:'Delhi', headline:'DevOps Engineer', dept:'Engineering',
    skills:'docker, kubernetes, aws, terraform, linux', exp:4.0, qual:'B.Tech Information Technology',
    appliedOn:'07 Oct 2026', active:true },
  { id:'c7', name:'Ananya Iyer', email:'ananya.iyer@example.com', phone:'+91 98200 44567',
    location:'Bengaluru', headline:'ML Engineer', dept:'Data Science',
    skills:'python, machine learning, tensorflow, sql', exp:3.0, qual:'M.Tech Artificial Intelligence',
    appliedOn:'08 Oct 2026', active:true },
  { id:'c8', name:'Karan Malhotra', email:'karan.malhotra@example.com', phone:'+91 98200 55678',
    location:'Hyderabad', headline:'QA Engineer', dept:'Engineering',
    skills:'selenium, python, testing, ci/cd', exp:2.0, qual:'B.Sc Computer Science',
    appliedOn:'09 Oct 2026', active:true },
  { id:'c9', name:'Ishita Bose', email:'ishita.bose@example.com', phone:'+91 98200 66789',
    location:'Kolkata', headline:'UI/UX Designer', dept:'Design',
    skills:'figma, prototyping, user research, css', exp:3.5, qual:'B.Des Communication Design',
    appliedOn:'10 Oct 2026', active:true },
  { id:'c10', name:'Aditya Rao', email:'aditya.rao@example.com', phone:'+91 98200 77890',
    location:'Chennai', headline:'Backend Developer', dept:'Engineering',
    skills:'java, spring, mysql, microservices', exp:5.0, qual:'B.Tech Computer Science',
    appliedOn:'11 Oct 2026', active:true },
  { id:'c11', name:'Neha Kulkarni', email:'neha.kulkarni@example.com', phone:'+91 98200 88901',
    location:'Pune', headline:'Data Analyst', dept:'Data Science',
    skills:'sql, python, excel, tableau', exp:1.5, qual:'B.Sc Statistics',
    appliedOn:'12 Oct 2026', active:true },
  { id:'c12', name:'Arjun Reddy', email:'arjun.reddy@example.com', phone:'+91 98200 99012',
    location:'Hyderabad', headline:'Product Manager', dept:'Product',
    skills:'roadmap, agile, sql, analytics', exp:4.5, qual:'MBA',
    appliedOn:'13 Oct 2026', active:true },
];
const JOBS = [
  { id:'j1', title:'Backend Developer', company:'FinEdge Technologies', location:'Bengaluru', type:'Full-time',
    salary:'₹12–18 LPA', openings:3,
    desc:'Build and maintain REST APIs for our fintech platform.',
    about:'FinEdge is a growing fintech startup processing over 2M transactions a day. You will join a 12-person engineering team owning services end to end.',
    resp:['Design and build REST APIs with Python and Django','Own PostgreSQL schema design and query optimisation','Ship containerised services with Docker','Participate in code reviews and on-call rotation'],
    skills:'python, django, postgresql, rest', qual:'B.Tech Computer Science', exp:2.0, posted:'28 Sep 2026' },
  { id:'j2', title:'Frontend Developer', company:'BrightKart Retail', location:'Chennai', type:'Full-time',
    salary:'₹8–12 LPA', openings:2,
    desc:'Build responsive customer-facing interfaces.',
    about:'BrightKart serves 5M shoppers a month. Our storefront team cares deeply about performance and polish.',
    resp:['Build responsive interfaces with React','Own UI performance budgets and accessibility','Work with designers on a shared component library'],
    skills:'javascript, react, css', qual:'B.Sc Computer Science', exp:1.0, posted:'29 Sep 2026' },
  { id:'j3', title:'Data Analyst', company:'HealthLoop Analytics', location:'Pune', type:'Full-time',
    salary:'₹10–14 LPA', openings:2,
    desc:'SQL analytics and reporting for product teams.',
    about:'HealthLoop turns hospital operations data into decisions. Small data team, large ownership.',
    resp:['Write SQL analyses and build recurring reports','Partner with product on experiment readouts','Maintain dashboards used by leadership'],
    skills:'python, sql, pandas', qual:'M.Sc Data Science', exp:2.0, posted:'30 Sep 2026' },
  { id:'j4', title:'DevOps Engineer', company:'FinEdge Technologies', location:'Bengaluru', type:'Full-time',
    salary:'₹14–20 LPA', openings:1,
    desc:'Own CI/CD pipelines and cloud infrastructure on AWS.',
    about:'FinEdge runs entirely on AWS. You will keep 40+ services deploying safely, several times a day.',
    resp:['Own Kubernetes clusters and Terraform modules','Build CI/CD pipelines with zero-downtime deploys','Drive monitoring, alerting and incident response'],
    skills:'docker, kubernetes, aws', qual:'B.Tech Computer Science', exp:3.0, posted:'01 Oct 2026' },
  { id:'j5', title:'ML Engineer', company:'VisionCraft AI', location:'Bengaluru', type:'Full-time',
    salary:'₹16–24 LPA', openings:2,
    desc:'Build and ship machine-learning models to production.',
    about:'VisionCraft builds vision models for retail. Research-friendly team with a strong MLOps culture.',
    resp:['Train and evaluate models with TensorFlow','Ship models behind production APIs','Build data pipelines for training and monitoring'],
    skills:'python, machine learning, tensorflow', qual:'M.Tech Artificial Intelligence', exp:2.0, posted:'02 Oct 2026' },
  { id:'j6', title:'UI/UX Designer', company:'BrightKart Retail', location:'Remote', type:'Full-time',
    salary:'₹9–13 LPA', openings:1,
    desc:'Design intuitive product experiences from research to prototype.',
    about:'BrightKart’s design team of six owns the end-to-end shopper journey across web and mobile.',
    resp:['Run user research and usability tests','Produce prototypes in Figma','Maintain and evolve the design system'],
    skills:'figma, prototyping, user research', qual:'B.Des', exp:2.0, posted:'03 Oct 2026' },
  { id:'j7', title:'QA Engineer', company:'FinEdge Technologies', location:'Hyderabad', type:'Full-time',
    salary:'₹7–10 LPA', openings:2,
    desc:'Automate testing and guard release quality.',
    about:'Quality is a first-class function at FinEdge — QA engineers pair directly with developers.',
    resp:['Build Selenium test automation suites','Own regression and release sign-off','Integrate tests into CI pipelines'],
    skills:'selenium, python, testing', qual:'B.Sc Computer Science', exp:1.5, posted:'04 Oct 2026' },
  { id:'j8', title:'Product Manager', company:'VisionCraft AI', location:'Bengaluru', type:'Full-time',
    salary:'₹18–26 LPA', openings:1,
    desc:'Own the roadmap for our hiring platform.',
    about:'VisionCraft is launching an AI hiring product. You will own discovery, roadmap and launch.',
    resp:['Own roadmap and prioritisation','Run discovery with customers and data','Define success metrics and launch plans'],
    skills:'roadmap, agile, analytics', qual:'MBA', exp:3.0, posted:'05 Oct 2026' },
];
// application status per (candidate -> job); default 'applied'
const APP_STATUS = {
  c1:{j1:'interview'},
  c2:{j1:'screening'},
  c3:{j1:'applied', j2:'interview'},
  c4:{j1:'applied', j3:'screening'},
  c5:{j2:'screening'},
  c6:{j4:'interview'},
  c7:{j3:'interview', j5:'applied'},
  c8:{j1:'screening', j7:'applied'},
  c9:{j2:'applied', j6:'screening'},
  c10:{j1:'applied'},
  c11:{j3:'applied'},
  c12:{j8:'applied'},
};
const DEMO_USERS = [
  { name:'Meera Nair', email:'meera.nair@smartrecruit.app', pass:'password123', role:'recruiter' },
  { name:'Aarav Mehta', email:'aarav.mehta@example.com', pass:'password123', role:'applicant' },
  { name:'Site Administrator', email:'admin@smartrecruit.app', pass:'admin123', role:'admin' },
];
const DEGREE_KW = ['phd','m.tech','b.tech','m.sc','b.sc','mba','bca','mca','bachelor','master'];

/* ====================== SCORING (matcher.py port) ====================== */
function splitSkills(csv){ return (csv||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean); }
function eduScore(candQual, jobQual){
  const c=(candQual||'').toLowerCase(), j=(jobQual||'').toLowerCase();
  if(!j.trim()) return 1.0;
  const cd=DEGREE_KW.filter(d=>c.includes(d)), jd=DEGREE_KW.filter(d=>j.includes(d));
  if(cd.some(d=>jd.includes(d))) return 1.0;
  return cd.length ? 0.6 : 0.0;
}
/* ---- seeded realistic resumes (demo data) ---- */
const RESUME_SEEDS = {
c1:`AARAV MEHTA
Backend Developer | Bengaluru
aarav.mehta@example.com | +91 98200 11223

SUMMARY
Backend developer with 3 years of experience designing and shipping REST APIs for high-traffic fintech services.

SKILLS
Python, Django, PostgreSQL, REST, Docker

EXPERIENCE
Backend Developer — FinEdge Technologies, Bengaluru (2023–present)
- Built REST APIs with Python and Django serving 2M requests per day
- Designed PostgreSQL schemas and optimised slow queries, cutting p95 latency by 40%
- Containerised services with Docker and owned CI deployments
- 3 years of production backend experience

EDUCATION
B.Tech Computer Science`,
c2:`SNEHA RAO
Java Developer | Hyderabad
sneha.rao@example.com | +91 98200 44556

SUMMARY
Java developer with 2 years of experience building microservices with Spring Boot.

SKILLS
Java, Spring, PostgreSQL, Microservices

EXPERIENCE
Software Engineer — CloudNine Systems, Hyderabad (2024–present)
- Developed microservices in Java and Spring Boot for a logistics platform
- Worked with PostgreSQL for persistence and service-to-service REST contracts
- Participated in code reviews and sprint planning in an agile team

EDUCATION
B.Tech Information Technology`,
c3:`VIKRAM NAIR
Frontend Developer | Chennai
vikram.nair@example.com | +91 98200 77889

SUMMARY
Frontend developer with 1.5 years of experience building responsive web apps with React.

SKILLS
JavaScript, React, Node.js, CSS

EXPERIENCE
Frontend Developer — PixelWorks Studio, Chennai (2025–present)
- Built responsive interfaces with React and modern CSS
- Integrated REST APIs and handled client-side state
- 1.5 years of professional frontend experience

EDUCATION
B.Sc Computer Science`,
c4:`DIVYA PATEL
Data Analyst | Pune
divya.patel@example.com | +91 98200 99001

SUMMARY
Data analyst with 2.5 years of experience turning raw data into decisions with SQL and Python.

SKILLS
Python, Pandas, SQL, Machine Learning

EXPERIENCE
Data Analyst — HealthLoop Analytics, Pune (2024–present)
- Wrote SQL analyses and built recurring reports with Python and Pandas
- Built dashboards tracking product KPIs for leadership
- Applied machine learning basics for churn analysis
- 2.5 years of analytics experience

EDUCATION
M.Sc Data Science`,
c5:`PRIYA SHARMA
Frontend Developer | Mumbai
priya.sharma@example.com | +91 98200 22334

SUMMARY
Frontend developer with 2.5 years of experience crafting polished, accessible interfaces.

SKILLS
JavaScript, TypeScript, React, CSS

EXPERIENCE
Frontend Developer — BrightKart Retail, Mumbai (2023–present)
- Built a React component library adopted by 4 product teams
- Shipped accessible, responsive pages with TypeScript and CSS
- 2.5 years of frontend experience

EDUCATION
B.Tech Computer Science`,
c6:`RAHUL VERMA
DevOps Engineer | Delhi
rahul.verma@example.com | +91 98200 33445

SUMMARY
DevOps engineer with 4 years of experience running production infrastructure on AWS.

SKILLS
Docker, Kubernetes, AWS, Terraform, Linux

EXPERIENCE
DevOps Engineer — FinEdge Technologies, Delhi (2022–present)
- Manage Kubernetes clusters on AWS running 40+ services
- Built Terraform modules and CI/CD pipelines with zero-downtime deploys
- Own monitoring, alerting and incident response
- 4 years of infrastructure experience

EDUCATION
B.Tech Information Technology`,
c7:`ANANYA IYER
ML Engineer | Bengaluru
ananya.iyer@example.com | +91 98200 44567

SUMMARY
Machine learning engineer with 3 years of experience training and shipping models.

SKILLS
Python, Machine Learning, TensorFlow, SQL

EXPERIENCE
ML Engineer — VisionCraft AI, Bengaluru (2023–present)
- Trained and evaluated models with TensorFlow for retail vision tasks
- Built data pipelines with Python and SQL for training and monitoring
- Shipped models behind production APIs
- 3 years of ML experience

EDUCATION
M.Tech Artificial Intelligence`,
c8:`KARAN MALHOTRA
QA Engineer | Hyderabad
karan.malhotra@example.com | +91 98200 55678

SUMMARY
QA engineer with 2 years of experience in test automation with Selenium and Python.

SKILLS
Selenium, Python, Testing, CI/CD

EXPERIENCE
QA Engineer — FinEdge Technologies, Hyderabad (2024–present)
- Built Selenium test automation suites in Python
- Integrated tests into CI/CD pipelines for release sign-off
- 2 years of quality engineering experience

EDUCATION
B.Sc Computer Science`,
c9:`ISHITA BOSE
UI/UX Designer | Kolkata
ishita.bose@example.com | +91 98200 66789

SUMMARY
Product designer with 3.5 years of experience from research to high-fidelity prototypes.

SKILLS
Figma, Prototyping, User Research, CSS

EXPERIENCE
Product Designer — BrightKart Retail, Kolkata (2022–present)
- Ran user research and usability tests informing the checkout redesign
- Produced prototypes in Figma and maintained the design system
- 3.5 years of design experience

EDUCATION
B.Des Communication Design`,
c10:`ADITYA RAO
Backend Developer | Chennai
aditya.rao@example.com | +91 98200 77890

SUMMARY
Backend developer with 5 years of experience building Java microservices at scale.

SKILLS
Java, Spring, MySQL, Microservices

EXPERIENCE
Senior Software Engineer — LogiServe, Chennai (2021–present)
- Led development of Spring microservices processing 10M events daily
- Designed MySQL schemas and optimised query performance
- Mentored junior engineers; 5 years of backend experience

EDUCATION
B.Tech Computer Science`,
c11:`NEHA KULKARNI
Data Analyst | Pune
neha.kulkarni@example.com | +91 98200 88901

SUMMARY
Data analyst with 1.5 years of experience in reporting and dashboarding.

SKILLS
SQL, Python, Excel, Tableau

EXPERIENCE
Data Analyst — RetailMetrics, Pune (2025–present)
- Built Tableau dashboards and Excel reports for category managers
- Wrote SQL queries for weekly business reviews
- 1.5 years of analytics experience

EDUCATION
B.Sc Statistics`,
c12:`ARJUN REDDY
Product Manager | Hyderabad
arjun.reddy@example.com | +91 98200 99012

SUMMARY
Product manager with 4.5 years of experience owning roadmaps for B2B SaaS products.

SKILLS
Roadmap, Agile, SQL, Analytics

EXPERIENCE
Product Manager — TalentFlow SaaS, Hyderabad (2021–present)
- Owned roadmap and prioritisation for a hiring analytics product
- Ran discovery with customers; defined success metrics with SQL and analytics
- Led agile ceremonies across 3 squads
- 4.5 years of product experience

EDUCATION
MBA`,
};

function seedResumes(){
  const seeded={};
  Object.keys(RESUME_SEEDS).forEach(cid=>{
    const c=CANDIDATES.find(x=>x.id===cid);
    const text=RESUME_SEEDS[cid];
    const parsed=parseResumeText(text);
    seeded[cid]={ name:c.name.split(' ').join('_')+'_Resume.txt', size:text.length,
      type:'text/plain', uploadedOn:'02 Oct 2026', text, parsedSkills:parsed.skills };
  });
  return seeded;
}
function scoreCandidate(cand, job){
  // Strict, resume-aware screening:
  // a required skill counts 1.0 if evidenced in the resume, 0.6 if only claimed on the profile, 0 if absent.
  const prof = splitSkills(cand.skills||'');
  const rsk = resumeSkills(cand.id||'');
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

/* ============================== STATE ============================== */
const store = {
  get(k,d){ try{ const v=localStorage.getItem('sr_site_'+k); return v?JSON.parse(v):d; }catch{ return d; } },
  set(k,v){ try{ localStorage.setItem('sr_site_'+k, JSON.stringify(v)); }catch{} },
};
let session = store.get('session', null);
let extraCandidates = store.get('candidates', []);
let extraUsers = store.get('extra_users', []);
function seedInterviews(){
  const d=new Date(); d.setDate(d.getDate()+2); d.setHours(11,0,0,0);
  const d2=new Date(); d2.setDate(d2.getDate()-3); d2.setHours(15,30,0,0);
  const d3=new Date(); d3.setDate(d3.getDate()+4); d3.setHours(10,0,0,0);
  const d4=new Date(); d4.setDate(d4.getDate()+1); d4.setHours(16,0,0,0);
  const iso=x=>x.toISOString().slice(0,16);
  return [
    { id:'i1', candId:'c1', jobId:'j1', when:iso(d), mode:'online', by:'Meera Nair',
      feedback:'Strong API design answers; system-design round pending.', result:'pending' },
    { id:'i2', candId:'c3', jobId:'j2', when:iso(d2), mode:'online', by:'Arjun Menon',
      feedback:'Excellent React fundamentals and portfolio. Cleared for offer.', result:'hired' },
    { id:'i3', candId:'c7', jobId:'j3', when:iso(d3), mode:'in-person', by:'Meera Nair',
      feedback:'', result:'pending' },
    { id:'i4', candId:'c6', jobId:'j4', when:iso(d4), mode:'phone', by:'Arjun Menon',
      feedback:'', result:'pending' },
  ];
}
let interviews = store.get('interviews', null);
if(!interviews || !interviews.length){ interviews = seedInterviews(); store.set('interviews', interviews); }
// interview requests: applicant proposes a slot -> recruiter accepts/declines
function seedRequests(){
  const d1=new Date(); d1.setDate(d1.getDate()+3); d1.setHours(14,0,0,0);
  const d2=new Date(); d2.setDate(d2.getDate()+2); d2.setHours(11,30,0,0);
  const iso=x=>x.toISOString().slice(0,16);
  return [
    { id:'r1', candId:'c5', jobId:'j2', status:'requested', createdOn:'09 Oct 2026',
      when:iso(d1), mode:'online',
      message:'I would love to discuss the frontend role — I built a component library used by 4 teams in my current job.' },
    { id:'r2', candId:'c8', jobId:'j1', status:'requested', createdOn:'10 Oct 2026',
      when:iso(d2), mode:'phone',
      message:'Backend systems interest me and my Python testing experience transfers well. Keen to chat.' },
  ];
}
let requests = store.get('requests', null);
if(!requests || (requests.length && !requests[0].when)){ requests = seedRequests(); store.set('requests', requests); }
// profile overrides + resumes (applicant-editable, recruiter-visible)
let profileOverrides = store.get('profile_overrides', {});
let resumes = store.get('resumes_v3', null);
if(!resumes){
  // fresh realistic seeds every version bump — old demo files are dropped on purpose
  resumes = seedResumes();
  store.set('resumes_v3', resumes);
}
const resumeSkills = cid => {
  const r = resumes[cid];
  if(!r) return [];
  if(r.parsedSkills) return r.parsedSkills;
  if(r.text){ const p=parseResumeText(r.text); r.parsedSkills=p.skills; return p.skills; }
  return [];
};
let shortlisted = store.get('shortlisted', {});
const allCandidates = ()=>{
  const list=[...CANDIDATES, ...extraCandidates];
  return list.map(c=>profileOverrides[c.id]?{...c, ...profileOverrides[c.id]}:c);
};
const candById = id=>allCandidates().find(c=>c.id===id);
const jobById = id=>JOBS.find(j=>j.id===id);
const myCandidate = ()=>{ // candidate record for the signed-in applicant
  if(!session || session.role!=='applicant') return null;
  return allCandidates().find(c=>c.email===session.email) || candById('c1');
};
// applications: the real pipeline records (seeded from APP_STATUS once)
function seedApplications(){
  const dates={c1:'02 Oct 2026',c2:'03 Oct 2026',c3:'04 Oct 2026',c4:'05 Oct 2026',c5:'06 Oct 2026',
    c6:'07 Oct 2026',c7:'08 Oct 2026',c8:'09 Oct 2026',c9:'10 Oct 2026',c10:'11 Oct 2026',
    c11:'12 Oct 2026',c12:'13 Oct 2026'};
  const apps=[]; let n=0;
  Object.keys(APP_STATUS).forEach(cid=>Object.keys(APP_STATUS[cid]).forEach(jid=>{
    apps.push({id:'a'+(++n), candId:cid, jobId:jid, status:APP_STATUS[cid][jid],
      appliedOn:dates[cid]||'10 Oct 2026', coverNote:''});
  }));
  return apps;
}
let applications = store.get('applications', null);
if(!applications || !applications.length){ applications = seedApplications(); store.set('applications', applications); }
const getApp=(cid,jid)=>applications.find(a=>a.candId===cid&&a.jobId===jid);
const appStatus=(cid,jid)=>{
  const a=getApp(cid,jid); if(!a) return null;
  if(shortlisted[cid+':'+jid]) return 'shortlisted';
  return a.status;
};
const setAppStatus=(cid,jid,st)=>{ const a=getApp(cid,jid); if(a){ a.status=st; store.set('applications',applications); } };
const candJobs=cid=>applications.filter(a=>a.candId===cid).map(a=>a.jobId);
const primaryJobId=cid=>(candJobs(cid)[0]||'j1');
const primaryStatus=cid=>appStatus(cid,primaryJobId(cid));
const jobApplicants=jid=>[...new Set(applications.filter(a=>a.jobId===jid).map(a=>a.candId))].map(candById).filter(Boolean);

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
function doLogout(){ session=null; store.set('session',null); closeModal(); location.hash='#/login'; }

/* ============================== ROUTER ============================== */
const app=$('#app');
function route(){
  const h=(location.hash||'#/login').replace('#/','');
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
      <p class="sub">${isUp?'Join as an applicant — apply in minutes.':'Sign in to the demo workspace.'}</p>
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
  $('#loginForm').onsubmit=e=>{
    e.preventDefault();
    const em=$('#em').value.trim().toLowerCase(), pw=$('#pw').value;
    const emOk=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em);
    $('#em').closest('.field').classList.toggle('invalid',!emOk);
    const pwOk=isUp?pw.length>=6:!!pw;
    $('#pw').closest('.field').classList.toggle('invalid',!pwOk);
    if(isUp){
      const nm=$('#nm').value.trim();
      $('#nm').closest('.field').classList.toggle('invalid',!nm);
      if(!emOk||!pwOk||!nm) return;
      if(DEMO_USERS.some(u=>u.email===em)||extraUsers.some(u=>u.email===em)){ toast('An account with this email already exists','err'); return; }
      const c={ id:'u'+Date.now(), name:nm, email:em, phone:'—', location:'—', headline:'Candidate',
        dept:'Engineering', skills:'', exp:0, qual:'',
        appliedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), active:true };
      extraCandidates.push(c); store.set('candidates',extraCandidates);
      extraUsers.push({name:nm,email:em,pass:pw,role:'applicant'});
      store.set('extra_users',extraUsers);
      session={name:nm,email:em,role:'applicant'}; store.set('session',session);
      toast('Account created — welcome, '+nm.split(' ')[0],'ok');
      location.hash='#/jobs'; return;
    }
    if(!emOk||!pwOk) return;
    const u=DEMO_USERS.find(x=>x.email===em && x.pass===pw)||extraUsers.find(x=>x.email===em && x.pass===pw);
    if(!u){ toast('Invalid credentials — use a fill button or create an account.', 'err'); return; }
    session={name:u.name,email:u.email,role:u.role}; store.set('session',session);
    toast('Signed in as '+u.name,'ok');
    location.hash = u.role==='applicant' ? '#/jobs' : '#/dashboard';
  };
}

/* ============================== DASHBOARD ============================== */
function vDashboard(){
  const cands=allCandidates();
  const openJobs=JOBS.length, total=cands.length;
  const upcoming=interviews.filter(i=>new Date(i.when)>new Date()).length;
  const scores=cands.map(c=>scoreCandidate(c,jobById(primaryJobId(c.id))).score);
  const avg=(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
  // funnel from real application states
  let fA=0,fS=0,fI=0,fH=0;
  applications.forEach(a=>{
    const s=appStatus(a.candId,a.jobId);
    if(s==='applied')fA++; else if(s==='screening'||s==='shortlisted')fS++;
    else if(s==='interview')fI++; else if(s==='hired')fH++;
  });
  const fMax=Math.max(fA,fS,fI,fH,1);
  const funnel=[['Applied',fA,'#8b5cf6'],['Screening',fS,'#0ea5e9'],['Interview',fI,'#f59e0b'],['Hired',fH,'#10b981']];
  const top=[...cands].map(c=>({c,s:scoreCandidate(c,jobById(primaryJobId(c.id)))})).sort((a,b)=>b.s.score-a.s.score).slice(0,5);
  const pendingReq=requests.filter(r=>r.status==='requested');
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
  app.innerHTML=topbar('candidates')+`<main class="page">
    <div class="page-head"><div><h1>Candidates</h1><p class="sub" id="candCount"></p></div>
      <div class="head-actions"><button class="btn" onclick="openAddCandidate()">${ICONS.plus} Add Candidate</button></div></div>
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
  let list=allCandidates();
  const q=candQuery.trim().toLowerCase();
  if(q) list=list.filter(c=>(c.name+' '+c.skills+' '+c.headline).toLowerCase().includes(q));
  if(candFilter==='shortlisted') list=list.filter(c=>Object.keys(shortlisted).some(k=>k.startsWith(c.id+':')));
  if(candFilter==='interview') list=list.filter(c=>primaryStatus(c.id)==='interview');
  if(candFilter==='new') list=list.filter(c=>primaryStatus(c.id)==='applied');
  $('#candCount').textContent=list.length+' candidate'+(list.length===1?'':'s')+' in pipeline';
  g.innerHTML=list.length?list.map(c=>{
    const pj=primaryJobId(c.id), st=primaryStatus(c.id), sc=scoreCandidate(c,jobById(pj)).score;
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
      <div class="kv"><span>Applied for</span><b>${esc(jobById(pj).title)}</b></div>
      <div class="kv"><span>Applied on</span><b>${esc(c.appliedOn)}</b></div>
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
  setTimeout(()=>{ const s=$('#ivCand'); if(s){ s.value=cid; s.scrollIntoView({block:'center'}); } },120);
}
function messageCandidate(cid){
  const c=candById(cid);
  openModal('Message '+(c?c.name:''), `<div class="field"><label for="cmMsg">Message</label>
    <textarea id="cmMsg" rows="4" placeholder="Write a message to ${esc(c?c.name:'the candidate')}…"></textarea></div>
    <div class="mt" style="display:flex;justify-content:flex-end"><button class="btn" onclick="closeModal();toast('Message sent','ok')">Send</button></div>`);
}
function openCandidate(id){
  const c=candById(id); if(!c) return;
  const pjid=primaryJobId(id), job=jobById(pjid), s=scoreCandidate(c,job);
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
    ${(()=>{const r=resumes[id];return r?`<div class="kv"><span>Resume</span><b>${esc(r.name)} <button class="btn ghost sm" style="margin-left:6px" onclick="viewCandidateResume('${id}')">View</button></b></div>`:`<div class="kv"><span>Resume</span><b style="color:var(--faint)">not uploaded</b></div>`;})()}
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
function saveShortlist(cid,jid){ shortlisted[cid+':'+jid]=true; store.set('shortlisted',shortlisted); closeModal(); toast('Candidate shortlisted','ok'); if((location.hash||'').includes('candidates'))renderCandGrid(); }
function openAddCandidate(){
  openModal('Add Candidate', `<form id="acForm" novalidate>
    <div class="form2">
      <div class="field"><label>Full name</label><input id="acName" placeholder="Priya Sharma"><div class="err">Name required.</div></div>
      <div class="field"><label>Email</label><input id="acEmail" type="email" placeholder="priya@example.com"><div class="err">Valid email required.</div></div>
    </div>
    <div class="form2">
      <div class="field"><label>Phone</label><input id="acPhone" placeholder="+91 98XXX XXXXX"></div>
      <div class="field"><label>Location</label><input id="acLoc" placeholder="Bengaluru"></div>
    </div>
    <div class="field"><label>Headline</label><input id="acHead" placeholder="Backend Developer"></div>
    <div class="field"><label>Skills (comma-separated)</label><input id="acSkills" placeholder="python, django, postgresql"><div class="err">Add at least one skill.</div></div>
    <div class="form2">
      <div class="field"><label>Experience (years)</label><input id="acExp" type="number" min="0" step="0.5" value="2"></div>
      <div class="field"><label>Qualification</label><input id="acQual" placeholder="B.Tech Computer Science"></div>
    </div>
    <button class="btn block" type="submit">Add to pipeline</button></form>`);
  $('#acForm').onsubmit=e=>{ e.preventDefault();
    const name=$('#acName').value.trim(), email=$('#acEmail').value.trim(), skills=$('#acSkills').value.trim();
    let ok=true;
    $('#acName').closest('.field').classList.toggle('invalid',!name); ok=ok&&!!name;
    const emOk=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    $('#acEmail').closest('.field').classList.toggle('invalid',!emOk); ok=ok&&emOk;
    $('#acSkills').closest('.field').classList.toggle('invalid',!skills); ok=ok&&!!skills;
    if(!ok) return;
    const c={ id:'x'+Date.now(), name, email, phone:$('#acPhone').value.trim()||'—',
      location:$('#acLoc').value.trim()||'—', headline:$('#acHead').value.trim()||'Candidate',
      dept:'Engineering', skills, exp:parseFloat($('#acExp').value)||0,
      qual:$('#acQual').value.trim(), appliedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), active:true };
    extraCandidates.push(c); store.set('candidates',extraCandidates);
    applications.push({id:'a'+Date.now(), candId:c.id, jobId:'j1', status:'applied',
      appliedOn:c.appliedOn, coverNote:''});
    store.set('applications', applications);
    closeModal(); toast(name+' added to pipeline','ok'); renderCandGrid();
  };
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
  const res=resumes[me.id];
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
      <div style="font-size:12px;color:var(--gray)">${(res.size/1024).toFixed(0)} KB · uploaded ${esc(res.uploadedOn)}</div></div></div>`
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
function applyNext(){
  const {step}=window._apply, me=myCandidate();
  if(step===2 && !resumes[me.id]){
    const f=$('#apFile')&&$('#apFile').files[0];
    if(!f){ toast('Attach your resume to continue','err'); return; }
    if(!/\.(pdf|docx|txt)$/i.test(f.name)){ toast('Only PDF, DOCX or TXT','err'); return; }
    if(f.size>5*1024*1024){ toast('Resume must be under 5 MB','err'); return; }
    const rd=new FileReader();
    rd.onload=()=>{ const rec={name:f.name,size:f.size,type:f.type,
      uploadedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),dataUrl:rd.result};
      if(/\.txt$/i.test(f.name)){
        try{
          const bin=atob(rd.result.split(',')[1]||'');
          let tx; try{ tx=decodeURIComponent(escape(bin)); }catch{ tx=bin; }
          rec.text=tx; rec.parsedSkills=parseResumeText(tx).skills;
        }catch{}
      }
      try{ const all={...resumes,[me.id]:rec}; store.set('resumes_v3',all); resumes=all; }
      catch{ resumes={...resumes,[me.id]:{...rec,dataUrl:null}}; try{store.set('resumes_v3',resumes);}catch{} }
      window._apply.step++; renderApplyStep();
    };
    rd.onerror=()=>toast('Could not read file','err');
    rd.readAsDataURL(f);
    return;
  }
  window._apply.step++; renderApplyStep();
}
function submitApplication(){
  const {jid}=window._apply, me=myCandidate();
  const note=($('#apNote')||{}).value||'';
  applications.push({id:'a'+Date.now(), candId:me.id, jobId:jid, status:'applied',
    appliedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
    coverNote:note.trim()});
  store.set('applications', applications);
  closeModal(); toast('Application sent to the recruiter','ok'); vJobs();
}
function openRequestInterview(jid){
  const j=jobById(jid), me=myCandidate(); if(!me) return;
  const existing=requests.find(r=>r.candId===me.id&&r.jobId===jid&&r.status==='requested');
  if(existing){ toast('You already have a pending request for this role','err'); return; }
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
  $('#rqForm').onsubmit=e=>{ e.preventDefault();
    const when=$('#rqWhen').value;
    const ok=when && new Date(when)>new Date();
    $('#rqWhen').closest('.field').classList.toggle('invalid',!ok);
    if(!ok) return;
    requests.unshift({ id:'r'+Date.now(), candId:me.id, jobId:jid, status:'requested',
      createdOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      when, mode:$('#rqMode').value, message:$('#rqMsg').value.trim() });
    store.set('requests', requests); closeModal();
    toast('Interview requested for '+fmtWhen(when),'ok'); vInterviews();
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
  const job=jobById($('#scrJob').value);
  const ranked=allCandidates().map(c=>({c, r:scoreCandidate(c,job)})).sort((a,b)=>b.r.score-a.r.score);
  window._lastRank={job,ranked};
  const box=$('#rankList');
  box.innerHTML='<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" onclick="exportShortlist()">Export shortlist (CSV)</button></div>'
  +'<div class="grid" style="gap:12px" aria-live="polite">'+ranked.map(({c,r},i)=>`
    <div class="rank"><div class="pos ${i===0?'top':''}">${i+1}</div>
      <div class="who"><div class="nm">${esc(c.name)}</div><div class="rl">${esc(c.headline)} · ${c.exp} yrs · ${esc(c.location)}</div>
        <div class="skillchips">${r.verified.map(s=>`<span class="hit">+ ${esc(s)}</span>`).join('')}${r.claimed.map(s=>`<span class="warn">~ ${esc(s)}</span>`).join('')}${r.missing.map(s=>`<span class="miss">− ${esc(s)}</span>`).join('')}</div>
        <div style="font-size:11.5px;color:var(--faint);margin-bottom:6px">+ evidenced in resume · ~ claimed on profile only · − missing</div>
        <div class="breakdown" style="max-width:420px">
          ${[['Skills',r.parts.skill],['Experience',r.parts.exp],['Education',r.parts.edu]].map(([l,v])=>
          `<div class="bd-row"><span>${l}</span><span class="bar"><i style="width:${v*100}%"></i></span><b>${Math.round(v*100)}%</b></div>`).join('')}
        </div></div>
      <div class="bigscore"><div class="v">${r.score}%</div><div class="l">match</div>
        <div class="mt"><button class="btn ghost sm" onclick="saveShortlist('${c.id}','${job.id}')">Shortlist</button></div></div>
    </div>`).join('')+'</div>';
  toast('Screened '+ranked.length+' candidates for '+job.title,'ok');
}
function exportShortlist(){
  const lr=window._lastRank; if(!lr){ toast('Run screening first','err'); return; }
  const rows=[['Rank','Name','Email','Headline','Experience (yrs)','Qualification','Score %','Skill %','Exp %','Edu %','Matched skills','Missing skills']];
  lr.ranked.forEach(({c,r},i)=>rows.push([i+1,c.name,c.email,c.headline,c.exp,c.qual,r.score,
    Math.round(r.parts.skill*100),Math.round(r.parts.exp*100),Math.round(r.parts.edu*100),
    r.matched.join('; '),r.missing.join('; ')]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='smartrecruit-shortlist-'+lr.job.title.toLowerCase().replace(/\s+/g,'-')+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Shortlist downloaded','ok');
}

/* ============================== APPLICATIONS (recruiter inbox) ============================== */
let _appJob=JOBS[0].id, _appSort='score';
function vApplications(){
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
  let rows=applications.filter(a=>a.jobId===_appJob)
    .map(a=>({a, c:candById(a.candId), r:scoreCandidate(candById(a.candId)||{skills:'',exp:0,qual:''}, j)}))
    .filter(x=>x.c);
  rows.sort((x,y)=>_appSort==='score' ? y.r.score-x.r.score : (y.a.appliedOn>x.a.appliedOn?1:-1));
  $('#appCount').textContent=`${rows.length} application${rows.length===1?'':'s'} — ${j.title}`;
  if(!rows.length){ box.innerHTML=emptyState("No applications yet","Applications for this role will appear here.",ICONS.users); return; }
  box.innerHTML=rows.map(({a,c,r})=>{
    const st=appStatus(c.id,_appJob);
    const res=resumes[c.id];
    return `<div class="app-row">
      <input type="checkbox" class="app-check" data-cid="${c.id}" aria-label="Select ${esc(c.name)}"${['interview','hired','rejected'].includes(st)?' disabled':''}>
      <div class="ava">${avatar(c.name,40)}</div>
      <div class="who"><b>${esc(c.name)}</b>
        <div class="meta">${esc(c.email)} · applied ${esc(a.appliedOn)}${a.coverNote?' · has cover note':''}${res?' · '+esc(res.name):''}</div>
        <div class="meta">${r.matched.slice(0,3).map(esc).join(', ')||'—'}</div></div>
      <div class="app-score"><div class="score-line"><span class="bar"><i style="width:${r.score}%"></i></span><b>${r.score}%</b></div></div>
      <div>${pill(st)}</div>
      <div class="app-actions">
        <button class="btn ghost sm" onclick="openCandidate('${c.id}')">Profile</button>
        ${['interview','hired','rejected'].includes(st)?'':`<button class="btn sm" onclick="approveForInterview('${c.id}','${_appJob}')">Approve</button>
        <button class="btn ghost sm" onclick="rejectApp('${c.id}','${_appJob}')">Reject</button>`}
      </div></div>`;
  }).join('');
}
function approveForInterview(cid,jid){
  setAppStatus(cid,jid,'interview');
  const c=candById(cid);
  toast((c?c.name:'Candidate')+' approved for interview — they can request a slot from My Interviews','ok');
  renderAppList();
}
function rejectApp(cid,jid){
  setAppStatus(cid,jid,'rejected');
  toast('Application rejected','err'); renderAppList();
}
function approveSelected(){
  const ids=[...document.querySelectorAll('.app-check:checked')].map(x=>x.dataset.cid);
  if(!ids.length){ toast('Select at least one application','err'); return; }
  ids.forEach(cid=>setAppStatus(cid,_appJob,'interview'));
  toast(ids.length+' candidate'+(ids.length>1?'s':'')+' approved for interview','ok');
  renderAppList();
}

/* ============================== INTERVIEWS ============================== */
function fmtWhen(iso){ const d=new Date(iso); return d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
function vInterviews(){
  const isApplicant = session.role==='applicant';
  const me = myCandidate();
  const pending = requests.filter(r=>r.status==='requested');
  const decided = requests.filter(r=>r.status!=='requested');
  const myIvs = isApplicant ? (me ? interviews.filter(i=>i.candId===me.id) : []) : interviews;
  const myReqs = isApplicant ? (me ? requests.filter(r=>r.candId===me.id) : []) : [];
  const approved = isApplicant && me ? applications.filter(a=>a.candId===me.id && appStatus(me.id,a.jobId)==='interview'
    && !requests.some(r=>r.candId===me.id && r.jobId===a.jobId && ['requested','scheduled'].includes(r.status))) : [];
  app.innerHTML=topbar('interviews')+`<main class="page">
    <div class="page-head"><div><h1>${isApplicant?'My Interviews':'Interviews'}</h1>
    <p class="sub">${isApplicant?'Request slots for approved roles, track requests, see scheduled conversations.':'Requests from applicants, scheduling, and outcomes.'}</p></div></div>
    ${isApplicant?`<div class="panel mb"><h3>Approved for interview ${approved.length?`<span class="count-pill">${approved.length}</span>`:''}</h3>
      <p class="sub">The recruiter accepted your application — propose a slot or wait for them to schedule.</p>
      ${approved.length?approved.map(a=>{const j=jobById(a.jobId);return `
        <div class="req-card"><div class="req-ava">${avatar(j?j.company:'?',44)}</div>
          <div class="req-body"><div><b>${esc(j?j.title:'')}</b></div>
          <div class="req-meta">${esc(j?j.company:'')} · your AI match ${scoreCandidate(me,j).score}%</div></div>
          <div class="req-actions"><button class="btn sm" onclick="openRequestInterview('${a.jobId}')">Request interview</button></div>
        </div>`;}).join('')
      :'${emptyState("Nothing waiting","Approved applications will appear here.",ICONS.check)}'}
    </div>`:''}
    ${!isApplicant?`
    <div class="panel mb"><h3>Interview requests ${pending.length?`<span class="count-pill">${pending.length} pending</span>`:''}</h3>
      <p class="sub">The applicant proposes a slot — you accept or decline.</p><div id="reqList">
      ${pending.length?pending.map(r=>{const c=candById(r.candId),j=jobById(r.jobId);const sc=c?scoreCandidate(c,j).score:'—';return `
        <div class="req-card"><div class="req-ava">${avatar(c?c.name:'?',44)}</div>
          <div class="req-body"><div><b>${esc(c?c.name:'—')}</b> <span style="color:var(--gray);font-size:12.5px">requests</span> <b>${esc(j?j.title:'')}</b>
          ${c?`<span class="count-pill" style="margin-left:6px">${sc}% match</span>`:''}</div>
          <div class="req-slot">${ICONS.cal}<b>${esc(r.when?fmtWhen(r.when):'—')}</b><span> · ${esc(r.mode||'')}</span></div>
          <div class="req-msg">“${esc(r.message||'No message.') }”</div>
          <div class="req-meta">${esc(r.createdOn)} · ${esc(c?c.email:'')}</div></div>
          <div class="req-actions"><button class="btn sm" onclick="decideRequest('${r.id}','accepted')">Accept</button>
          <button class="btn ghost sm" onclick="decideRequest('${r.id}','declined')">Decline</button></div>
        </div>`;}).join('')
      :'<div class="empty">No pending requests. New applicant requests appear here.</div>'}
      ${decided.length?`<div style="margin-top:10px;font-size:12.5px;color:var(--gray)">Recently decided: `+decided.slice(0,4).map(r=>{const c=candById(r.candId);return `${esc(c?c.name.split(' ')[0]:'?')} ${pill(r.status)}`;}).join(' · ')+'</div>':''}
      </div></div>`:''}
    <div class="grid g2">
      ${!isApplicant?`<div class="panel"><h3>Schedule interview</h3><p class="sub">Pick a candidate and a slot.</p>
        <form id="ivForm" novalidate>
          <div class="field"><label>Candidate</label><select id="ivCand">${allCandidates().map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Job</label><select id="ivJob">${JOBS.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('')}</select></div>
          <div class="form2">
            <div class="field"><label>Date &amp; time</label><input id="ivWhen" type="datetime-local"><div class="err">Pick a future date.</div></div>
            <div class="field"><label>Mode</label><select id="ivMode"><option>online</option><option>in-person</option><option>phone</option></select></div>
          </div>
          <div class="field"><label>Interviewer</label><input id="ivBy" placeholder="Meera Nair"></div>
          <button class="btn block" type="submit">Schedule</button>
        </form></div>`:''}
      <div class="panel"><h3>${isApplicant?'My requests':'Scheduled'}</h3>
        <p class="sub">${isApplicant?'Track what you asked for.':interviews.length+' upcoming & past.'}</p>
        ${isApplicant&&myReqs.length?myReqs.map(r=>{const j=jobById(r.jobId);return `
          <div class="feed-item"><div><b>Interview request — ${esc(j?j.title:'')}</b>
          <div style="font-size:12.5px;color:var(--gray)">${r.when?esc(fmtWhen(r.when))+' · ':''}${esc(r.mode||'')}</div>
          ${r.message?`<div style="font-size:12.5px;color:var(--gray)">“${esc(r.message)}”</div>`:''}</div>
          <span class="t">${esc(r.createdOn)}<br>${pill(r.status)}</span></div>`;}).join(''):''}
        <div id="ivList"></div></div>
    </div></main>`+footer();
  const render=()=>{
    $('#ivList').innerHTML=myIvs.length?myIvs.map(i=>{const c=candById(i.candId),j=jobById(i.jobId);return `
      <div class="feed-item">${avatar(c?c.name:'?',36)}<div><b>${esc(c?c.name:'—')}</b>
      <div style="font-size:12.5px;color:var(--gray)">${esc(j?j.title:'')} · ${esc(i.mode)} · ${esc(i.by||'')}</div>
      ${i.feedback?`<div style="font-size:12.5px;margin-top:4px">“${esc(i.feedback)}”</div>`:''}</div>
      <span class="t">${esc(fmtWhen(i.when))}<br>${pill(i.result||'pending')}</span></div>`;}).join('')
      :emptyState("No interviews scheduled","Scheduled interviews will appear here.",ICONS.cal);
  };
  render();
  const f=$('#ivForm');
  if(f) f.onsubmit=e=>{ e.preventDefault();
    const when=$('#ivWhen').value;
    const ok=when && new Date(when)>new Date();
    $('#ivWhen').closest('.field').classList.toggle('invalid',!ok);
    if(!ok) return;
    addInterview({candId:$('#ivCand').value,jobId:$('#ivJob').value,when,mode:$('#ivMode').value,by:$('#ivBy').value.trim()});
    render(); toast('Interview scheduled','ok'); e.target.reset();
  };
}
function addInterview({candId,jobId,when,mode,by,feedback='',result='pending'}){
  interviews.unshift({id:'i'+Date.now(),candId,jobId,when,mode,by,feedback,result});
  store.set('interviews',interviews);
}
function decideRequest(rid,verdict){
  const r=requests.find(x=>x.id===rid); if(!r) return;
  const c=candById(r.candId);
  if(verdict==='accepted'){
    if(!r.when){ toast('This request has no proposed slot','err'); return; }
    addInterview({candId:r.candId, jobId:r.jobId, when:r.when, mode:r.mode||'online',
      by:session?session.name:'', feedback:'', result:'pending'});
    r.status='scheduled';
    toast('Interview scheduled for '+(c?c.name:'candidate'),'ok');
  } else {
    r.status='declined';
    toast('Request declined','err');
  }
  store.set('requests',requests);
  vInterviews();
}

/* ============================== ADMIN ============================== */
function vAdmin(){
  app.innerHTML=topbar('admin')+`<main class="page">
    <div class="page-head"><div><h1>Admin</h1><p class="sub">Workspace users and roles.</p></div></div>
    <div class="panel"><table class="tbl"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>
      ${DEMO_USERS.map(u=>`<tr><td><div style="display:flex;gap:10px;align-items:center">${avatar(u.name,32)}<b>${esc(u.name)}</b></div></td><td>${esc(u.email)}</td><td style="text-transform:capitalize">${esc(u.role)}</td><td><span class="pill p-active">active</span></td></tr>`).join('')}
    </tbody></table></div></main>`+footer();
}

/* ============================== PROFILE ============================== */
function vProfile(){
  const me=myCandidate();
  if(!me){ location.hash='#/jobs'; return; }
  const res=resumes[me.id];
  const myJobs=candJobs(me.id).map(jid=>({j:jobById(jid), s:scoreCandidate(me,jobById(jid))}));
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
            <div style="font-size:12px;color:var(--gray)">${(res.size/1024).toFixed(0)} KB · uploaded ${esc(res.uploadedOn)}</div></div>
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
  $('#pfForm').onsubmit=e=>{ e.preventDefault();
    profileOverrides[me.id]={ name:$('#pfName').value.trim()||me.name, phone:$('#pfPhone').value.trim(),
      location:$('#pfLoc').value.trim(), headline:$('#pfHead').value.trim()||'Candidate',
      skills:$('#pfSkills').value.trim(), exp:parseFloat($('#pfExp').value)||0,
      qual:$('#pfQual').value.trim() };
    store.set('profile_overrides',profileOverrides);
    toast('Profile saved — match scores updated','ok'); vProfile();
  };
}
function uploadResume(){
  const me=myCandidate(); if(!me) return;
  const inp=$('#rsFile'), f=inp.files[0];
  if(!f){ toast('Choose a resume file first','err'); return; }
  const okExt=/\.(pdf|docx|txt)$/i.test(f.name);
  if(!okExt){ toast('Only PDF, DOCX or TXT resumes','err'); return; }
  if(f.size>5*1024*1024){ toast('Resume must be under 5 MB','err'); return; }
  const done=(dataUrl)=>{
    const rec={name:f.name,size:f.size,type:f.type,uploadedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),dataUrl};
    if(/\.txt$/i.test(f.name)&&dataUrl){
      const text=atob(dataUrl.split(',')[1]||'');
      let parsed;
      try{ parsed=parseResumeText(decodeURIComponent(escape(text))); }
      catch{ parsed=parseResumeText(text); }
      rec.text=text; rec.parsedSkills=parsed.skills;
      $('#parseOut').innerHTML=`<div style="font-weight:700;font-size:13px;margin-bottom:8px">AI extracted</div>
        <div class="skillchips">${parsed.skills.map(s=>`<span class="hit">${esc(s)}</span>`).join('')||'<span class="neutral">no known skills found</span>'}</div>
        <div class="kv mt"><span>Experience</span><b>${parsed.exp} yrs</b></div>
        <div class="kv"><span>Qualification</span><b>${esc(parsed.quals.join(', ')||'—')}</b></div>
        <button class="btn block mt" onclick='applyParsed(${JSON.stringify(parsed.skills)},${parsed.exp},"${parsed.quals.join(', ')}")'>Apply to my profile</button>`;
      toast('Resume parsed','ok');
    } else {
      toast('Resume uploaded — full parsing runs on the connected backend','ok');
    }
    try{ const all={...resumes,[me.id]:rec}; store.set('resumes_v3',all); resumes=all; }
    catch{ const slim={...rec,dataUrl:null}; const all={...resumes,[me.id]:slim}; try{store.set('resumes_v3',all);}catch{} resumes=all; }
    vProfile();
  };
  const rd=new FileReader();
  rd.onload=()=>done(rd.result);
  rd.onerror=()=>toast('Could not read file','err');
  rd.readAsDataURL(f);
}
function applyParsed(skills,exp,quals){
  const me=myCandidate(); if(!me) return;
  const ov={...(profileOverrides[me.id]||{})};
  if(skills.length) ov.skills=skills.join(', ');
  if(exp) ov.exp=exp;
  if(quals) ov.qual=quals;
  profileOverrides[me.id]=ov; store.set('profile_overrides',profileOverrides);
  toast('Profile updated from resume','ok'); vProfile();
}
function resumeTextOf(r){
  if(!r) return null;
  if(r.text) return r.text;
  if(r.dataUrl && /\.txt$/i.test(r.name||'')){
    try{
      const bin=atob(r.dataUrl.split(',')[1]||'');
      try{ return decodeURIComponent(escape(bin)); }catch{ return bin; }
    }catch{ return null; }
  }
  return null;
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
function downloadResume(r){
  const a=document.createElement('a');
  a.href=r.dataUrl; a.download=r.name||'resume'; a.rel='noopener';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Resume downloaded','ok');
}
function viewResume(){
  const me=myCandidate(); const r=me&&resumes[me.id];
  if(!r){ toast('No resume uploaded','err'); return; }
  const t=resumeTextOf(r);
  if(t){ openModal('Resume — '+me.name, resumePreviewHtmlText(t), true); return; }
  if(r.dataUrl){ downloadResume(r); return; }
  toast('No preview available for this resume','err');
}
function viewCandidateResume(cid){
  const r=resumes[cid]; const c=candById(cid);
  if(!r){ toast('No resume uploaded','err'); return; }
  const t=resumeTextOf(r);
  if(t){ openModal('Resume — '+(c?c.name:''), resumePreviewHtmlText(t), true); return; }
  if(r.dataUrl){ downloadResume(r); return; }
  toast('No preview available for this resume','err');
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
      const chits=allCandidates().filter(c=>[c.name,c.headline,c.skills,c.location].join(' ').toLowerCase().includes(q)).slice(0,6);
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
    :`<h4>1. Data in this demo</h4><p>All candidate profiles are fictional and stored only in your browser (localStorage). Nothing leaves your device.</p>
    <h4>2. No tracking</h4><p>This demo sets no analytics cookies and makes no third-party requests.</p>
    <h4>3. Production note</h4><p>A production deployment would need a published retention policy, consent flows, and data-processing terms before handling real candidate data.</p>`}
    <p style="color:var(--faint);font-size:12.5px">Final legal text must be reviewed by counsel before any production use.</p></div>`);
}

route();
