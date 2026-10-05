/* Admin console. */
const me = guard('admin');
renderNav(me.name, me.role);

async function load() {
  try {
    const r = await api('/api/reports/admin/overview');
    const k = r.counts;
    document.getElementById('kpis').innerHTML =
      [['Users', k.users], ['Candidates', k.candidates], ['Jobs', k.jobs],
       ['Applications', k.applications]]
      .map(x => '<div class="card kpi"><div class="num">' + x[1] + '</div><div class="lbl">' + x[0] + '</div></div>').join('');
    document.getElementById('byRole').innerHTML = Object.entries(r.users_by_role)
      .map(([role, n]) => '<span style="margin-right:10px">' + statusBadge(role) + ' <b>' + n + '</b></span>').join('');
    document.getElementById('byStatus').innerHTML = Object.entries(r.applications_by_status)
      .map(([s, n]) => '<span style="margin-right:10px">' + statusBadge(s) + ' <b>' + n + '</b></span>').join('');

    const users = await api('/api/admin/users');
    document.getElementById('userList').innerHTML =
      '<table><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>' +
      users.map(u => '<tr><td><b>' + esc(u.name) + '</b></td><td class="muted">' + esc(u.email) +
        '</td><td>' + statusBadge(u.role) + '</td><td class="muted">' + fmtDate(u.created_at) + '</td><td>' +
        (u.user_id === me.user_id ? '<span class="muted">you</span>'
          : '<button class="btn small danger" onclick="delUser(' + u.user_id + ')">Delete</button>') +
        '</td></tr>').join('') + '</table>';
  } catch (e) { toast(e.message, false); }
}
async function delUser(id) {
  if (!confirm('Delete this user and all their data?')) return;
  try { await api('/api/admin/users/' + id, { method: 'DELETE' }); toast('User deleted.'); load(); }
  catch (e) { toast(e.message, false); }
}
load();
