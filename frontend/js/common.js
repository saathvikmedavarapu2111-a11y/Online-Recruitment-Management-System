/* Shared helpers: auth, API calls, UI bits. */
function token() { return localStorage.getItem('sr_token'); }
function currentUser() {
  try { return JSON.parse(localStorage.getItem('sr_user') || 'null'); }
  catch { return null; }
}
function guard(role) {
  const u = currentUser();
  if (!u) { location.href = 'index.html'; return null; }
  if (role && u.role !== role) { location.href = 'index.html'; return null; }
  return u;
}
function logout() {
  localStorage.removeItem('sr_token');
  localStorage.removeItem('sr_user');
  location.href = 'index.html';
}
function headers() {
  const h = {};
  const t = token();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}
async function api(path, opts = {}) {
  const o = { method: opts.method || 'GET', headers: headers() };
  if (opts.body !== undefined) {
    o.headers['Content-Type'] = 'application/json';
    o.body = JSON.stringify(opts.body);
  }
  if (opts.form) o.body = opts.form; // FormData: browser sets content-type
  const res = await fetch(path, o);
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = (data && data.detail) || ('Request failed (' + res.status + ')');
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}
function toast(msg, ok = true) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = ok ? 'show' : 'show err';
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.className = ''; }, 3200);
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
function statusBadge(s) {
  return '<span class="badge ' + esc(s) + '">' + esc(s) + '</span>';
}
function scoreCell(score) {
  if (score == null) return '<span class="muted">not scored</span>';
  const v = Math.max(0, Math.min(100, Number(score)));
  return '<div class="scorewrap"><div class="scorebar"><div style="width:' + v + '%"></div></div><b>' + v + '%</b></div>';
}
function setTabs(containerId, tabs, onPick) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  tabs.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i === 0 ? ' active' : '');
    b.textContent = t;
    b.onclick = () => {
      c.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      onPick(t);
    };
    c.appendChild(b);
  });
}
function renderNav(name, role) {
  document.getElementById('navWho').innerHTML =
    esc(name) + ' <span class="badge">' + esc(role) + '</span>';
}
