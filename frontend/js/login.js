/* Login / register page. */
let role = 'applicant';

setTabs('roleTabs', ['Applicant', 'Recruiter'], (t) => {
  role = t.toLowerCase();
});

function showReg() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('regForm').classList.remove('hidden');
}
function showLogin() {
  document.getElementById('regForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}
function goHome(u) {
  location.href = u.role === 'applicant' ? 'applicant.html'
    : u.role === 'recruiter' ? 'recruiter.html' : 'admin.html';
}
async function doLogin() {
  const email = document.getElementById('liEmail').value.trim();
  const password = document.getElementById('liPass').value;
  try {
    const r = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('sr_token', r.access_token);
    localStorage.setItem('sr_user', JSON.stringify(r.user));
    goHome(r.user);
  } catch (e) { toast(e.message, false); }
}
async function doRegister() {
  const name = document.getElementById('rgName').value.trim();
  const email = document.getElementById('rgEmail').value.trim();
  const password = document.getElementById('rgPass').value;
  try {
    const r = await api('/api/auth/register', { method: 'POST', body: { name, email, password, role } });
    localStorage.setItem('sr_token', r.access_token);
    localStorage.setItem('sr_user', JSON.stringify(r.user));
    toast('Account created — welcome!');
    goHome(r.user);
  } catch (e) { toast(e.message, false); }
}
document.getElementById('liPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('rgPass').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
