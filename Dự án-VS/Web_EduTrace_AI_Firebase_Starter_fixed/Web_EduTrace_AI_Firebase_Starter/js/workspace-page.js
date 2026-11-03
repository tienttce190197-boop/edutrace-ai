import { subscribeAuth, logoutUser, initAuthService } from './firebase-auth.js';
import { applyRoleWorkspace } from './role-workspaces.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

const status = document.getElementById('workspaceStatus');
const logoutBtn = document.getElementById('workspaceLogout');
const greeting = document.getElementById('workspaceUserGreeting');
const adminLink = document.getElementById('workspaceAdminLink');
const requestedRole = new URLSearchParams(location.search).get('role');
logoutBtn?.addEventListener('click', async () => {
  try { await logoutUser(); location.replace('index.html'); }
  catch { if (status) { status.style.display = 'block'; status.textContent = 'Không đăng xuất được. Vui lòng thử lại.'; } }
});
subscribeAuth(async user => {
  if (!user) return;
  if (user.role === 'parent') { location.replace('index.html'); return; }
  if (greeting) greeting.textContent = `Xin chào, ${user.displayName || user.email}`;
  if (adminLink) adminLink.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
  const activeUser = requestedRole && user.role === 'admin' ? {...user, role: requestedRole} : user;
  if (status) { status.style.display = 'none'; status.textContent = ''; }
  applyRoleWorkspace(activeUser);
  if (activeUser.role === 'doctor') {
    const name = document.getElementById('doctorPortalName');
    if (name) name.textContent = user.role === 'doctor' ? (user.displayName || 'Bác sĩ / Chuyên viên') : 'Xem giao diện bác sĩ';
    if (user.role !== 'doctor') {
      const inboxStatus = document.getElementById('screeningInboxStatus');
      if (inboxStatus) inboxStatus.textContent = 'Đăng nhập bằng tài khoản bác sĩ để xem dữ liệu chuyên môn.';
      return;
    }
    try { await Promise.all([import('./clinical-workspace.js'), import('./screening-inbox.js')]); }
    catch { if (status) { status.style.display = 'block'; status.textContent = 'Không tải được khu vực chuyên môn. Vui lòng tải lại trang.'; } }
  } else if (activeUser.role === 'center' || activeUser.role === 'investor') {
    const name = document.getElementById('centerPortalName');
    if (name) name.textContent = user.role === 'admin' ? 'Xem giao diện trung tâm' : (user.displayName || 'Trung tâm / Đối tác');
    if (user.role === 'admin') {
      const panel = document.getElementById('centerPanel');
      const message = document.getElementById('centerStatus');
      if (panel) panel.hidden = false;
      if (message) message.textContent = 'Đăng nhập bằng tài khoản trung tâm để xem và quản lý dữ liệu.';
      return;
    }
    try { await Promise.all([import('./center-workspace.js'), import('./investor-workspace.js')]); }
    catch { if (status) { status.style.display = 'block'; status.textContent = 'Không tải được khu vực trung tâm. Vui lòng tải lại trang.'; } }
  }
});
onAuthStateChanged(getAuth(getApp()), user => { if (!user) location.replace('index.html'); });
initAuthService();
