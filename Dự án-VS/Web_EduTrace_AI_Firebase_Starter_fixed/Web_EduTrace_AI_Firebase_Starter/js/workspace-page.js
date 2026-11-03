import { subscribeAuth, logoutUser, initAuthService } from './firebase-auth.js';
import { initRoleWorkspaces, applyRoleWorkspace } from './role-workspaces.js';

const status = document.getElementById('workspaceStatus');
const logoutBtn = document.getElementById('workspaceLogout');
const greeting = document.getElementById('workspaceUserGreeting');
const adminLink = document.getElementById('workspaceAdminLink');

logoutBtn?.addEventListener('click', async () => {
  try {
    await logoutUser();
    location.replace('index.html');
  } catch (err) {
    console.error('Logout error:', err);
    location.replace('index.html');
  }
});

// Khoi tao cac su kien va du lieu Role Workspaces
initRoleWorkspaces();

// Doc tham so vai tro tu URL (?role=doctor | center | investor | admin)
const urlParams = new URLSearchParams(window.location.search);
const requestedRole = urlParams.get('role');

subscribeAuth(async user => {
  if (greeting) {
    greeting.textContent = user ? `Xin chào, ${user.displayName || user.email}` : '';
  }
  if (adminLink) {
    adminLink.style.display = (user && user.role === 'admin') ? 'inline-flex' : 'none';
  }

  let activeUser = user;
  if (!activeUser) {
    // Neu chua dang nhap, lay vai tro yeu cau hoac mac dinh doctor
    const role = requestedRole || 'doctor';
    const names = {
      doctor: 'ThS. Nguyễn Mai Anh (Bác sĩ Chuyên khoa)',
      center: 'Trung Tâm Can Thiệp Ánh Sao Ninh Kiều',
      investor: 'Đối Tác & Nhà Đầu Tư Chiến Lược',
      admin: 'Ban Quản Trị Hệ Thống'
    };
    activeUser = { role, displayName: names[role] || 'Chuyên Gia' };
  } else if (requestedRole && requestedRole !== activeUser.role && activeUser.role === 'admin') {
    // Neu la admin, cho phep xem view vai tro cu the theo tham so URL
    activeUser = { ...activeUser, role: requestedRole };
  }

  if (status) status.textContent = '';
  applyRoleWorkspace(activeUser);
});

initAuthService();