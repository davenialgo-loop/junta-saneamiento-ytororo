const API_BASE = window.location.origin;

let isOnline = navigator.onLine;
let syncInProgress = false;

const syncStatusEl = document.getElementById('sync-status');

function updateSyncStatus() {
  if (!syncStatusEl) return;
  if (syncInProgress) {
    syncStatusEl.className = 'syncing';
    syncStatusEl.innerHTML = '🔄 Sincronizando...';
  } else if (isOnline) {
    syncStatusEl.className = 'online';
    syncStatusEl.innerHTML = '✅ En línea';
  } else {
    syncStatusEl.className = 'offline';
    syncStatusEl.innerHTML = '⚠️ Sin conexión';
  }
}

window.addEventListener('online', () => { isOnline = true; updateSyncStatus(); syncAll(); });
window.addEventListener('offline', () => { isOnline = false; updateSyncStatus(); });

async function apiFetch(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function syncUsuarios() {
  try {
    const local = await dbAPI.getAll('usuarios');
    const remote = await apiFetch('GET', '/api/usuarios');
    const remoteMap = {};
    remote.forEach(u => remoteMap[u.id] = u);

    for (const u of local) {
      if (!remoteMap[u.id]) {
        await apiFetch('POST', '/api/usuarios', u);
      } else {
        await apiFetch('PUT', `/api/usuarios/${u.id}`, u);
      }
    }

    for (const u of remote) {
      if (!local.find(l => l.id === u.id)) {
        await dbAPI.put('usuarios', u);
      }
    }
  } catch (e) {
    console.warn('syncUsuarios:', e.message);
  }
}

async function syncLecturas() {
  try {
    const local = await dbAPI.getAll('lecturas');
    const remote = await apiFetch('GET', '/api/lecturas');
    const remoteMap = {};
    remote.forEach(l => remoteMap[l.id] = l);

    for (const l of local) {
      if (!remoteMap[l.id]) {
        await apiFetch('POST', '/api/lecturas', l);
      }
    }

    for (const l of remote) {
      if (!local.find(x => x.id === l.id)) {
        await dbAPI.put('lecturas', l);
      }
    }
  } catch (e) {
    console.warn('syncLecturas:', e.message);
  }
}

async function syncConfig() {
  try {
    const local = await dbAPI.getAll('config');
    const remote = await apiFetch('GET', '/api/config');
    const remoteObj = {};

    if (Array.isArray(remote)) {
      remote.forEach(c => remoteObj[c.key] = c);
    } else {
      for (const [key, value] of Object.entries(remote)) {
        await dbAPI.put('config', { key, value: String(value) });
      }
      return;
    }

    for (const c of local) {
      if (remoteObj[c.key]) {
        await apiFetch('PUT', '/api/config', { [c.key]: c.value });
      }
    }
  } catch (e) {
    console.warn('syncConfig:', e.message);
  }
}

async function syncAll() {
  if (!isOnline || syncInProgress) return;
  syncInProgress = true;
  updateSyncStatus();
  await syncUsuarios();
  await syncLecturas();
  await syncConfig();
  syncInProgress = false;
  updateSyncStatus();
}
