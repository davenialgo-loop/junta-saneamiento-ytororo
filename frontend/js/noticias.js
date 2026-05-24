let noticias = [];
let noticiaEditandoId = null;

const TIPO_NOTICIA = {
  general: { icon: 'ti ti-info-circle', color: '#1565C0', label: 'General' },
  corte: { icon: 'ti ti-alert-triangle', color: '#C62828', label: 'Corte de agua' },
  mantenimiento: { icon: 'ti ti-tool', color: '#E65100', label: 'Mantenimiento' },
  asamblea: { icon: 'ti ti-users', color: '#2E7D32', label: 'Asamblea' }
};

async function cargarNoticias() {
  noticias = await dbAPI.getAll('noticias') || [];
}

async function guardarNoticia() {
  if (!currentUser || currentUser.role !== 'admin') { toast('Solo administradores.'); return; }
  const titulo = document.getElementById('noti-titulo').value.trim();
  const tipo = document.getElementById('noti-tipo').value;
  const contenido = document.getElementById('noti-contenido').value.trim();
  if (!titulo || !contenido) { toast('Completá título y contenido.'); return; }

  if (noticiaEditandoId) {
    const n = noticias.find(x => x.id === noticiaEditandoId);
    n.titulo = titulo; n.tipo = tipo; n.contenido = contenido;
    noticiaEditandoId = null;
    document.getElementById('btn-noti-cancelar').style.display = 'none';
  } else {
    noticias.push({ id: Date.now().toString(), titulo, tipo, contenido, fecha: new Date().toISOString(), activa: true });
  }

  await saveAllNoticias();
  document.getElementById('noti-titulo').value = '';
  document.getElementById('noti-contenido').value = '';
  document.getElementById('noti-tipo').value = 'general';
  renderNoticiasAdmin();
  renderNoticiasPublic();
  toast('Noticia publicada');
}

async function saveAllNoticias() {
  await dbAPI.clear('noticias');
  for (const n of noticias) await dbAPI.put('noticias', n);
}

function renderNoticiasPublic() {
  const el = document.getElementById('lp-noticias');
  const activas = noticias.filter(n => n.activa !== false).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (!activas.length) { el.innerHTML = '<div class="empty-state"><i class="ti ti-news"></i>No hay avisos por el momento</div>'; return; }
  el.innerHTML = activas.map(n => {
    const t = TIPO_NOTICIA[n.tipo] || TIPO_NOTICIA.general;
    const fecha = new Date(n.fecha).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<div class="noticia-card" style="border-left:4px solid ${t.color}">
      <div class="noticia-card-header">
        <span class="noticia-tipo" style="background:${t.color}15;color:${t.color}"><i class="${t.icon}"></i> ${t.label}</span>
        <span class="noticia-fecha">${fecha}</span>
      </div>
      <h4>${n.titulo}</h4>
      <p>${n.contenido}</p>
    </div>`;
  }).join('');
}

function renderNoticiasAdmin() {
  const el = document.getElementById('lista-noticias-admin');
  const ordenadas = [...noticias].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (!ordenadas.length) { el.innerHTML = '<div class="empty-state"><i class="ti ti-news"></i>Sin noticias</div>'; return; }
  el.innerHTML = '<div class="user-list">' + ordenadas.map(n => {
    const t = TIPO_NOTICIA[n.tipo] || TIPO_NOTICIA.general;
    const fecha = new Date(n.fecha).toLocaleDateString('es-PY');
    return `<div class="user-item">
      <div class="avatar" style="background:${t.color}15;color:${t.color}"><i class="${t.icon}"></i></div>
      <div class="user-info">
        <div class="name">${n.titulo}</div>
        <div class="meta"><span style="color:${t.color}">${t.label}</span> · ${fecha}${n.activa === false ? ' · <span style="color:var(--color-danger)">Oculta</span>' : ''}</div>
      </div>
      <div class="user-actions">
        <button class="btn btn-secondary btn-sm" onclick="editarNoticia('${n.id}')"><i class="ti ti-edit"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="toggleNoticia('${n.id}')">${n.activa !== false ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>'}</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarNoticia('${n.id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function editarNoticia(id) {
  const n = noticias.find(x => x.id === id);
  document.getElementById('noti-titulo').value = n.titulo;
  document.getElementById('noti-tipo').value = n.tipo;
  document.getElementById('noti-contenido').value = n.contenido;
  noticiaEditandoId = id;
  document.getElementById('btn-noti-cancelar').style.display = 'inline-flex';
  document.getElementById('card-nueva-noticia').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionNoticia() {
  noticiaEditandoId = null;
  document.getElementById('noti-titulo').value = '';
  document.getElementById('noti-tipo').value = 'general';
  document.getElementById('noti-contenido').value = '';
  document.getElementById('btn-noti-cancelar').style.display = 'none';
}

async function toggleNoticia(id) {
  const n = noticias.find(x => x.id === id);
  n.activa = n.activa === false ? true : false;
  await saveAllNoticias();
  renderNoticiasAdmin();
  renderNoticiasPublic();
}

async function eliminarNoticia(id) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  noticias = noticias.filter(x => x.id !== id);
  await dbAPI.delete('noticias', id);
  renderNoticiasAdmin();
  renderNoticiasPublic();
  toast('Noticia eliminada');
}
