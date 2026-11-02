import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initAuthService, subscribeAuth, logoutUser } from './firebase-auth.js';
import { updateRoleWorkspace } from './role-workspace.js';
import { pageForRole } from './role-routing.js';

const status = document.getElementById('workspaceStatus');
const root = document.getElementById('workspaceRoot');
let generation = 0;
let loaded = false;
document.getElementById('workspaceLogout').addEventListener('click', async () => {
  try { await logoutUser(); location.replace('index.html'); }
  catch { status.textContent = 'Không đăng xuất được. Vui lòng thử lại.'; }
});

subscribeAuth(async user => {
  if (!user) return;
  const current = ++generation;
  const destination = pageForRole(user.role);
  if (destination !== 'workspace.html') { location.replace(destination); return; }
  try {
    if (!loaded) {
      const response = await fetch('index.html', {cache:'no-cache'});
      if (!response.ok) throw new Error('Không tải được giao diện.');
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const workspace = html.getElementById('roleWorkspace');
      if (!workspace) throw new Error('Thiếu giao diện.');
      workspace.querySelector('#parentWorkspace')?.remove();
      workspace.querySelector('#parentReferralPanel')?.remove();
      workspace.querySelector('#roleWorkspaceProfile')?.remove();
      workspace.querySelector('.role-workspace-footer')?.remove();
      for (const link of workspace.querySelectorAll('.role-workspace-card')) {
        if (!['#clinicalPanel', '#centerPanel', '#investorReportPanel'].includes(link.getAttribute('href'))) link.remove();
      }
      if (current !== generation) return;
      root.replaceChildren(workspace);
      loaded = true;
    }
    if (user.role === 'doctor') {
      await import('./clinical-workspace.js');
      await import('./screening-inbox.js');
    } else {
      await import('./center-workspace.js');
      await import('./investor-workspace.js');
    }
    if (current !== generation) return;
    updateRoleWorkspace(user);
    status.textContent = '';
  } catch (error) { if (current === generation) status.textContent = 'Không tải được không gian làm việc. Vui lòng thử lại.'; }
});
onAuthStateChanged(getAuth(getApp()), user => { if (!user) location.replace('index.html'); });
initAuthService();
