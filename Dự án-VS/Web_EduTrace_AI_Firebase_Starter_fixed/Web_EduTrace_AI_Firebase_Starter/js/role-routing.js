export function pageForRole(role) {
  if (role === 'admin') return 'admin.html';
  if (role === 'doctor' || role === 'center' || role === 'investor') return 'workspace.html';
  return 'index.html';
}
