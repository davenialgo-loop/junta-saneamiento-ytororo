let usuarios = [];
let lecturas = [];
let config = { minM3: 5, tarifaMin: 15000, precioM3: 3000, mora: 10 };

async function loadData() {
  usuarios = await dbAPI.getAll('usuarios') || [];
  lecturas = await dbAPI.getAll('lecturas') || [];
  const cfgRows = await dbAPI.getAll('config') || [];
  cfgRows.forEach(r => { config[r.key] = parseFloat(r.value) || r.value; });
}

async function saveData() {
  for (const u of usuarios) await dbAPI.put('usuarios', u);
  for (const l of lecturas) await dbAPI.put('lecturas', l);
  for (const [k, v] of Object.entries(config)) await dbAPI.put('config', { key: k, value: String(v) });
  syncAll();
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2500);
}

function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'lecturas') { poblarSelectU(); renderHistorial(); }
  if (id === 'usuarios') renderUsuarios();
  if (id === 'dashboard') renderDashboard();
  if (id === 'config') cargarConfig();
  if (id === 'reportes') initExportSelects();
}

function initSelects() {
  const anio = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  ['l-mes', 'filt-mes', 'exp-mes', 'rep-mes', 'rec-mes'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    const addAll = id.startsWith('filt');
    s.innerHTML = (addAll ? '<option value="">Todos</option>' : '') + MESES.slice(1).map((m, i) =>
      `<option value="${i + 1}"${i + 1 === mes ? ' selected' : ''}>${m}</option>`
    ).join('');
  });
  ['l-anio', 'exp-anio', 'rep-anio', 'rec-anio'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = '';
    for (let a = anio; a >= anio - 4; a--) {
      const o = document.createElement('option');
      o.value = a; o.textContent = a; if (a === anio) o.selected = true;
      s.appendChild(o);
    }
  });
  document.getElementById('l-usu').addEventListener('change', onUsuarioChange);
}

function calcTarifa(m3) {
  if (m3 <= config.minM3) return config.tarifaMin;
  return config.tarifaMin + (m3 - config.minM3) * config.precioM3;
}

async function agregarUsuario() {
  const nom = document.getElementById('u-nom').value.trim();
  const ape = document.getElementById('u-ape').value.trim();
  const med = document.getElementById('u-med').value.trim();
  const dir = document.getElementById('u-dir').value.trim();
  const tel = document.getElementById('u-tel').value.trim();
  const ini = parseFloat(document.getElementById('u-ini').value) || 0;
  if (!nom || !med) { toast('Nombre y N° de medidor son obligatorios.'); return; }
  if (usuarios.find(u => u.medidor === med)) { toast('Ya existe un usuario con ese medidor.'); return; }
  const u = { id: Date.now().toString(), nombre: nom, apellido: ape, medidor: med, direccion: dir, telefono: tel, lecIni: ini };
  usuarios.push(u);
  await saveData();
  renderUsuarios();
  renderDashboard();
  ['u-nom', 'u-ape', 'u-med', 'u-dir', 'u-tel', 'u-ini'].forEach(i => document.getElementById(i).value = '');
  toast('Usuario registrado');
}

function renderUsuarios() {
  const q = (document.getElementById('buscar-u').value || '').toLowerCase();
  const el = document.getElementById('lista-usuarios');
  const f = usuarios.filter(u => (u.nombre + ' ' + u.apellido).toLowerCase().includes(q) || u.medidor.toLowerCase().includes(q));
  if (!f.length) { el.innerHTML = '<div class="empty-state"><i class="ti ti-users"></i>Sin usuarios</div>'; return; }
  el.innerHTML = '<div class="user-list">' + f.map(u => `<div class="user-item">
    <div class="avatar">${(u.nombre[0] + (u.apellido ? u.apellido[0] : '')).toUpperCase()}</div>
    <div class="user-info"><div class="name">${u.nombre} ${u.apellido}</div><div class="meta"><i class="ti ti-meter"></i> ${u.medidor} · ${u.direccion || 'Sin dirección'}</div></div>
    <div class="user-actions">
      <button class="btn btn-secondary btn-sm" onclick="abrirEditar('${u.id}')"><i class="ti ti-edit"></i></button>
      <button class="btn btn-danger btn-sm" onclick="eliminarU('${u.id}')"><i class="ti ti-trash"></i></button>
    </div>
  </div>`).join('') + '</div>';
}

async function eliminarU(id) {
  if (!confirm('¿Eliminar usuario y todas sus lecturas?')) return;
  usuarios = usuarios.filter(u => u.id !== id);
  lecturas = lecturas.filter(l => l.usuarioId !== id);
  await saveData();
  renderUsuarios();
  renderDashboard();
  toast('Usuario eliminado');
}

function abrirEditar(id) {
  const u = usuarios.find(x => x.id === id);
  document.getElementById('edit-id').value = u.id;
  document.getElementById('edit-nom').value = u.nombre;
  document.getElementById('edit-ape').value = u.apellido;
  document.getElementById('edit-med').value = u.medidor;
  document.getElementById('edit-dir').value = u.direccion;
  document.getElementById('edit-tel').value = u.telefono;
  document.getElementById('modal-edit').classList.add('open');
}

async function guardarEdicion() {
  const id = document.getElementById('edit-id').value;
  const u = usuarios.find(x => x.id === id);
  u.nombre = document.getElementById('edit-nom').value.trim();
  u.apellido = document.getElementById('edit-ape').value.trim();
  u.medidor = document.getElementById('edit-med').value.trim();
  u.direccion = document.getElementById('edit-dir').value.trim();
  u.telefono = document.getElementById('edit-tel').value.trim();
  await saveData();
  cerrarModal('modal-edit');
  renderUsuarios();
  toast('Usuario actualizado');
}

function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

function poblarSelectU() {
  ['l-usu', 'filt-usu', 'rec-usu'].forEach(sid => {
    const s = document.getElementById(sid);
    if (!s) return;
    const prev = s.value;
    const addAll = sid.startsWith('filt');
    s.innerHTML = (addAll ? '<option value="">Todos los usuarios</option>' : '<option value="">— Seleccionar —</option>') +
      usuarios.map(u => `<option value="${u.id}">${u.nombre} ${u.apellido} (${u.medidor})</option>`).join('');
    if (prev) s.value = prev;
  });
}

function getUltima(uid, mes, anio) {
  const u = usuarios.find(x => x.id === uid);
  const prevs = lecturas.filter(l => l.usuarioId === uid && (l.anio < anio || (l.anio === anio && l.mes < mes)));
  if (!prevs.length) return u ? u.lecIni || 0 : 0;
  prevs.sort((a, b) => a.anio !== b.anio ? b.anio - a.anio : b.mes - a.mes);
  return prevs[0].actual;
}

function onUsuarioChange() {
  const uid = document.getElementById('l-usu').value;
  if (!uid) { document.getElementById('l-ant').value = ''; return; }
  const mes = parseInt(document.getElementById('l-mes').value);
  const anio = parseInt(document.getElementById('l-anio').value);
  document.getElementById('l-ant').value = getUltima(uid, mes, anio);
  calcConsumo();
}

function calcConsumo() {
  const uid = document.getElementById('l-usu').value;
  const ant = parseFloat(document.getElementById('l-ant').value) || 0;
  const act = parseFloat(document.getElementById('l-act').value);
  const div = document.getElementById('l-result');
  const btnR = document.getElementById('btn-recibo');
  if (!uid || isNaN(act)) { div.innerHTML = ''; btnR.style.display = 'none'; return; }
  if (act < ant) {
    div.innerHTML = '<div style="background:#FCEBEB;border:.5px solid #F09595;border-radius:8px;padding:9px;color:#791F1F;font-size:12px;margin-top:8px"><i class="ti ti-alert-triangle"></i> La lectura actual no puede ser menor a la anterior.</div>';
    btnR.style.display = 'none'; return;
  }
  const consumo = act - ant;
  const imp = calcTarifa(consumo);
  btnR.style.display = 'inline-flex';
  div.innerHTML = `<div class="result-box">
    <div class="result-row"><span>Consumo</span><span><strong>${consumo.toFixed(1)} m³</strong></span></div>
    <div class="result-row"><span>Tarifa mínima (${config.minM3} m³)</span><span>Gs. ${config.tarifaMin.toLocaleString()}</span></div>
    ${consumo > config.minM3 ? `<div class="result-row"><span>Excedente (${(consumo - config.minM3).toFixed(1)} m³ × Gs. ${config.precioM3.toLocaleString()})</span><span>Gs. ${((consumo - config.minM3) * config.precioM3).toLocaleString()}</span></div>` : ''}
    <div class="result-row total"><span>Total a pagar</span><span>Gs. ${imp.toLocaleString()}</span></div>
  </div>`;
}

async function guardarLectura() {
  const uid = document.getElementById('l-usu').value;
  const mes = parseInt(document.getElementById('l-mes').value);
  const anio = parseInt(document.getElementById('l-anio').value);
  const ant = parseFloat(document.getElementById('l-ant').value) || 0;
  const act = parseFloat(document.getElementById('l-act').value);
  if (!uid) { toast('Seleccioná un usuario.'); return; }
  if (isNaN(act) || act < ant) { toast('Lectura actual inválida.'); return; }
  const existe = lecturas.find(l => l.usuarioId === uid && l.mes === mes && l.anio === anio);
  if (existe) {
    if (!confirm('Ya existe lectura para este período. ¿Reemplazar?')) return;
    lecturas = lecturas.filter(l => !(l.usuarioId === uid && l.mes === mes && l.anio === anio));
  }
  const consumo = act - ant;
  const imp = calcTarifa(consumo);
  lecturas.push({ id: Date.now().toString(), usuarioId: uid, mes, anio, anterior: ant, actual: act, consumo, importe: imp, fecha: new Date().toISOString() });
  await saveData();
  document.getElementById('l-act').value = '';
  document.getElementById('l-result').innerHTML = '';
  document.getElementById('btn-recibo').style.display = 'none';
  renderHistorial();
  renderDashboard();
  toast('Lectura guardada');
}

function renderHistorial() {
  const uid = document.getElementById('filt-usu').value;
  const mes = parseInt(document.getElementById('filt-mes').value) || 0;
  let data = [...lecturas];
  if (uid) data = data.filter(l => l.usuarioId === uid);
  if (mes) data = data.filter(l => l.mes === mes);
  data.sort((a, b) => a.anio !== b.anio ? b.anio - a.anio : b.mes - a.mes);
  const div = document.getElementById('historial');
  if (!data.length) { div.innerHTML = '<div class="empty-state"><i class="ti ti-table"></i>Sin lecturas</div>'; return; }
  div.innerHTML = `<div style="overflow-x:auto"><table class="htable">
    <thead><tr><th>Usuario</th><th>Período</th><th>Ant.</th><th>Act.</th><th>Consumo</th><th>Importe</th><th></th></tr></thead>
    <tbody>${data.map(l => {
      const u = usuarios.find(x => x.id === l.usuarioId);
      return `<tr>
        <td>${u ? u.nombre + ' ' + u.apellido : '—'}</td>
        <td>${MESES[l.mes]} ${l.anio}</td>
        <td>${l.anterior.toFixed(1)}</td><td>${l.actual.toFixed(1)}</td>
        <td>${l.consumo.toFixed(1)} m³</td>
        <td>Gs. ${l.importe.toLocaleString()}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-print btn-sm" onclick="abrirReciboLectura('${l.id}')"><i class="ti ti-receipt"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarL('${l.id}')"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

async function eliminarL(id) {
  if (!confirm('¿Eliminar esta lectura?')) return;
  lecturas = lecturas.filter(l => l.id !== id);
  await saveData();
  renderHistorial();
  renderDashboard();
  toast('Lectura eliminada');
}

function renderDashboard() {
  document.getElementById('stat-u').textContent = usuarios.length;
  const anio = new Date().getFullYear(), mes = new Date().getMonth() + 1;
  const em = lecturas.filter(l => l.mes === mes && l.anio === anio);
  document.getElementById('stat-l').textContent = em.length;
  document.getElementById('stat-t').textContent = 'Gs. ' + em.reduce((s, l) => s + l.importe, 0).toLocaleString();
  const pend = usuarios.filter(u => !lecturas.find(l => l.usuarioId === u.id && l.mes === mes && l.anio === anio));
  const pd = document.getElementById('dash-pending');
  pd.innerHTML = !pend.length ? '<div class="empty-state"><i class="ti ti-check"></i>Todos registrados</div>' :
    '<div class="user-list">' + pend.slice(0, 5).map(u => `<div class="user-item">
      <div class="avatar">${(u.nombre[0] + (u.apellido ? u.apellido[0] : '')).toUpperCase()}</div>
      <div class="user-info"><div class="name">${u.nombre} ${u.apellido}</div><div class="meta">${u.medidor}</div></div>
      <span class="badge badge-pending">Pendiente</span>
    </div>`).join('') + (pend.length > 5 ? `<div style="text-align:center;font-size:12px;color:var(--color-text-secondary);padding:6px">+${pend.length - 5} más</div>` : '') +
    '</div>';
  const rec = [...lecturas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 4);
  const rl = document.getElementById('dash-recent');
  rl.innerHTML = !rec.length ? '<div class="empty-state"><i class="ti ti-meter"></i>Sin lecturas</div>' :
    '<div class="user-list">' + rec.map(l => {
      const u = usuarios.find(x => x.id === l.usuarioId);
      return `<div class="user-item">
        <div class="avatar" style="background:#EAF3DE;color:#27500A">${u ? (u.nombre[0] + (u.apellido ? u.apellido[0] : '')).toUpperCase() : '?'}</div>
        <div class="user-info"><div class="name">${u ? u.nombre + ' ' + u.apellido : '—'}</div><div class="meta">${MESES[l.mes]} ${l.anio} · ${l.consumo.toFixed(1)} m³</div></div>
        <span style="font-size:13px;font-weight:500;color:var(--color-primary)">Gs. ${l.importe.toLocaleString()}</span>
      </div>`;
    }).join('') + '</div>';
}

function cargarConfig() {
  document.getElementById('cfg-min').value = config.minM3;
  document.getElementById('cfg-tmin').value = config.tarifaMin;
  document.getElementById('cfg-pm3').value = config.precioM3;
  document.getElementById('cfg-mora').value = config.mora;
}

async function guardarConfig() {
  config.minM3 = parseFloat(document.getElementById('cfg-min').value) || 5;
  config.tarifaMin = parseFloat(document.getElementById('cfg-tmin').value) || 15000;
  config.precioM3 = parseFloat(document.getElementById('cfg-pm3').value) || 3000;
  config.mora = parseFloat(document.getElementById('cfg-mora').value) || 10;
  await saveData();
  toast('Configuración guardada');
}

function simular() {
  const m3 = parseFloat(document.getElementById('sim-m3').value);
  const mora = document.getElementById('sim-mora').value === '1';
  const div = document.getElementById('sim-res');
  if (isNaN(m3) || m3 < 0) { div.innerHTML = ''; return; }
  const base = calcTarifa(m3);
  const total = mora ? Math.round(base * (1 + config.mora / 100)) : base;
  div.innerHTML = `<div class="result-box">
    <div class="result-row"><span>Consumo</span><span>${m3.toFixed(1)} m³</span></div>
    <div class="result-row"><span>Importe base</span><span>Gs. ${base.toLocaleString()}</span></div>
    ${mora ? `<div class="result-row"><span>Mora (${config.mora}%)</span><span>Gs. ${Math.round(base * config.mora / 100).toLocaleString()}</span></div>` : ''}
    <div class="result-row total"><span>Total</span><span>Gs. ${total.toLocaleString()}</span></div>
  </div>`;
}

function initExportSelects() {
  poblarSelectU();
  const anio = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  ['exp-mes', 'rep-mes', 'rec-mes'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = MESES.slice(1).map((m, i) => `<option value="${i + 1}"${i + 1 === mes ? ' selected' : ''}>${m}</option>`).join('');
  });
  ['exp-anio', 'rep-anio', 'rec-anio'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = '';
    for (let a = anio; a >= anio - 4; a--) { const o = document.createElement('option'); o.value = a; o.textContent = a; if (a === anio) o.selected = true; s.appendChild(o); }
  });
}

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-error');
  if (!user || !pass) { errEl.textContent = 'Completá ambos campos.'; return; }
  if (login(user, pass)) {
    document.getElementById('login-screen').classList.add('hidden');
    applyAuth();
    init();
  } else {
    errEl.textContent = 'Usuario o contraseña incorrectos.';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-screen') && !document.getElementById('login-screen').classList.contains('hidden')) {
    handleLogin();
  }
});

function applyAuth() {
  if (!currentUser) return;
  const badge = document.getElementById('user-badge');
  document.getElementById('user-name').innerHTML = `<i class="ti ti-user" style="font-size:10px"></i> ${currentUser.nombre} <span class="role-badge">${currentUser.role === 'admin' ? 'Admin' : 'Lector'}</span>`;
  badge.style.display = 'flex';

  document.querySelectorAll('.nav button').forEach(btn => {
    const section = btn.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
    if (section && !hasAccess(section)) {
      btn.style.display = 'none';
    }
  });

  if (currentUser.role === 'lector') {
    const firstAccessible = document.querySelector('.nav button:not([style*="display: none"])');
    if (firstAccessible) {
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      firstAccessible.classList.add('active');
      const section = firstAccessible.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
      if (section) showSection(section, firstAccessible);
    }
  }

  document.getElementById('card-seed').style.display = currentUser.role === 'admin' ? 'block' : 'none';
}

async function init() {
  if (!checkAuth()) {
    document.getElementById('login-screen').classList.remove('hidden');
    return;
  }
  document.getElementById('login-screen').classList.add('hidden');
  applyAuth();
  await loadData();
  initSelects();
  poblarSelectU();
  renderDashboard();
  cargarConfig();
  updateSyncStatus();
  if (isOnline) syncAll();
}
