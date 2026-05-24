let currentUser = null;

const LOGIN_USERS = [
  { username: 'admin', password: 'admin123', nombre: 'Administrador', role: 'admin' },
  { username: 'lector', password: 'lector123', nombre: 'Encargado de Lecturas', role: 'lector' }
];

function checkAuth() {
  const stored = sessionStorage.getItem('yto_user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return true;
  }
  return false;
}

function login(username, password) {
  const user = LOGIN_USERS.find(u => u.username === username && u.password === password);
  if (!user) return false;
  currentUser = { username: user.username, nombre: user.nombre, role: user.role };
  sessionStorage.setItem('yto_user', JSON.stringify(currentUser));
  return true;
}

async function logout() {
  currentUser = null;
  sessionStorage.removeItem('yto_user');
  document.getElementById('page-admin').style.display = 'none';
  document.getElementById('page-landing').style.display = 'block';
  await cargarNoticias();
  renderNoticiasPublic();
}

function hasAccess(section) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'lector') {
    return section === 'lecturas' || section === 'dashboard';
  }
  return false;
}
