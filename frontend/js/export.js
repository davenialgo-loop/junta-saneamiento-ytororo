const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function exportarExcel() {
  const mes = parseInt(document.getElementById('exp-mes').value);
  const anio = parseInt(document.getElementById('exp-anio').value);
  if (typeof XLSX === 'undefined') { toast('La librería Excel aún se está cargando.'); return; }
  const data = usuarios.map(u => {
    const l = lecturas.find(x => x.usuarioId === u.id && x.mes === mes && x.anio === anio);
    return {
      'N° Medidor': u.medidor,
      'Nombre': u.nombre + ' ' + u.apellido,
      'Dirección': u.direccion || '',
      'Teléfono': u.telefono || '',
      'Lectura Anterior': l ? l.anterior : '',
      'Lectura Actual': l ? l.actual : '',
      'Consumo (m³)': l ? l.consumo : 'Sin lectura',
      'Importe (Gs.)': l ? l.importe : '',
      'Período': l ? MESES[l.mes] + ' ' + l.anio : ''
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${MESES[mes]} ${anio}`);
  XLSX.writeFile(wb, `Lecturas_Ytororo_${MESES[mes]}_${anio}.xlsx`);
  toast('Excel descargado');
}

function exportarUsuariosExcel() {
  if (typeof XLSX === 'undefined') { toast('La librería Excel aún se está cargando.'); return; }
  const data = usuarios.map(u => ({
    'N° Medidor': u.medidor,
    'Nombre': u.nombre + ' ' + u.apellido,
    'Dirección': u.direccion || '',
    'Teléfono': u.telefono || '',
    'Lectura Inicial': u.lecIni || 0
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Padrón');
  XLSX.writeFile(wb, 'Padron_Usuarios_Ytororo.xlsx');
  toast('Padrón descargado');
}

function generarReportePDF() {
  const mes = parseInt(document.getElementById('rep-mes').value);
  const anio = parseInt(document.getElementById('rep-anio').value);
  const data = usuarios.map(u => {
    const l = lecturas.find(x => x.usuarioId === u.id && x.mes === mes && x.anio === anio);
    return { u, l };
  });
  const total = data.reduce((s, { l }) => s + (l ? l.importe : 0), 0);
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte ${MESES[mes]} ${anio}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#000;font-size:12px}
    h1{font-size:18px;color:#0F6E56;margin:0}
    h2{font-size:13px;margin:2px 0 0;color:#555;font-weight:normal}
    .meta{font-size:11px;color:#777;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#0F6E56;color:white;padding:7px 8px;text-align:left;font-size:11px}
    td{padding:6px 8px;border-bottom:1px solid #eee;font-size:12px}
    tr:nth-child(even) td{background:#f9f9f9}
    .sin{color:#aaa;font-style:italic}
    .total-row{font-weight:bold;background:#E1F5EE!important}
    .footer{margin-top:24px;font-size:10px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:10px}
    @media print{body{padding:12px}}
  </style></head><body>
  <h1>Junta de Saneamiento — Barrio Ytororo</h1>
  <h2>Distrito de Capitán Miranda</h2>
  <p class="meta">Reporte de consumo — <strong>${MESES[mes]} ${anio}</strong> &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-PY')}</p>
  <table>
    <thead><tr><th>#</th><th>Medidor</th><th>Nombre</th><th>Dirección</th><th>Ant. (m³)</th><th>Act. (m³)</th><th>Consumo</th><th>Importe (Gs.)</th><th>Estado</th></tr></thead>
    <tbody>
    ${data.map(({ u, l }, i) => `<tr>
      <td>${i + 1}</td>
      <td>${u.medidor}</td>
      <td>${u.nombre} ${u.apellido}</td>
      <td>${u.direccion || '—'}</td>
      <td>${l ? l.anterior.toFixed(1) : '—'}</td>
      <td>${l ? l.actual.toFixed(1) : '—'}</td>
      <td>${l ? l.consumo.toFixed(1) + ' m³' : '<span class="sin">Sin lectura</span>'}</td>
      <td>${l ? 'Gs. ' + l.importe.toLocaleString() : '—'}</td>
      <td>${l ? '✓ OK' : '⚠ Pendiente'}</td>
    </tr>`).join('')}
    <tr class="total-row"><td colspan="7" style="text-align:right;padding-right:12px">TOTAL A COBRAR</td><td>Gs. ${total.toLocaleString()}</td><td></td></tr>
    </tbody>
  </table>
  <p style="margin-top:10px;font-size:11px;color:#555">Tarifa mínima: Gs. ${config.tarifaMin.toLocaleString()} (${config.minM3} m³) · Excedente: Gs. ${config.precioM3.toLocaleString()}/m³</p>
  <div class="footer">Junta de Saneamiento Barrio Ytororo · Capitán Miranda · ${new Date().getFullYear()}</div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  w.document.close();
}

function buildReciboHTML(l, u) {
  const fecha = new Date(l.fecha).toLocaleDateString('es-PY');
  return `<div class="recibo-preview" id="recibo-printable">
    <h2>Junta de Saneamiento</h2>
    <div class="sub">Barrio Ytororo · Distrito de Capitán Miranda</div>
    <div class="rrow"><span>Recibo N°</span><span>${l.id.slice(-6).toUpperCase()}</span></div>
    <div class="rrow"><span>Fecha</span><span>${fecha}</span></div>
    <div class="rrow"><span>Usuario</span><span>${u.nombre} ${u.apellido}</span></div>
    <div class="rrow"><span>N° Medidor</span><span>${u.medidor}</span></div>
    <div class="rrow"><span>Dirección</span><span>${u.direccion || '—'}</span></div>
    <div class="rrow"><span>Período</span><span>${MESES[l.mes]} ${l.anio}</span></div>
    <div style="margin:8px 0"></div>
    <div class="rrow"><span>Lectura anterior</span><span>${l.anterior.toFixed(1)} m³</span></div>
    <div class="rrow"><span>Lectura actual</span><span>${l.actual.toFixed(1)} m³</span></div>
    <div class="rrow"><span>Consumo</span><span>${l.consumo.toFixed(1)} m³</span></div>
    <div class="rrow"><span>Tarifa mínima</span><span>Gs. ${config.tarifaMin.toLocaleString()}</span></div>
    ${l.consumo > config.minM3 ? `<div class="rrow"><span>Excedente (${(l.consumo - config.minM3).toFixed(1)} m³)</span><span>Gs. ${((l.consumo - config.minM3) * config.precioM3).toLocaleString()}</span></div>` : ''}
    <div class="rtotal"><span>TOTAL</span><span>Gs. ${l.importe.toLocaleString()}</span></div>
    <div class="firma">____________________________<br>Firma y sello</div>
  </div>`;
}

function abrirRecibo() {
  const uid = document.getElementById('l-usu').value;
  const mes = parseInt(document.getElementById('l-mes').value);
  const anio = parseInt(document.getElementById('l-anio').value);
  const l = lecturas.find(x => x.usuarioId === uid && x.mes === mes && x.anio === anio);
  if (!l) { toast('Guardá la lectura primero.'); return; }
  const u = usuarios.find(x => x.id === uid);
  document.getElementById('recibo-content').innerHTML = buildReciboHTML(l, u);
  document.getElementById('modal-recibo').classList.add('open');
}

function abrirReciboLectura(lid) {
  const l = lecturas.find(x => x.id === lid);
  const u = usuarios.find(x => x.id === l.usuarioId);
  document.getElementById('recibo-content').innerHTML = buildReciboHTML(l, u);
  document.getElementById('modal-recibo').classList.add('open');
}

function imprimirReciboDesdeExportar() {
  const uid = document.getElementById('rec-usu').value;
  const mes = parseInt(document.getElementById('rec-mes').value);
  const anio = parseInt(document.getElementById('rec-anio').value);
  if (!uid) { toast('Seleccioná un usuario.'); return; }
  const l = lecturas.find(x => x.usuarioId === uid && x.mes === mes && x.anio === anio);
  if (!l) { toast('No hay lectura registrada para ese usuario y período.'); return; }
  const u = usuarios.find(x => x.id === uid);
  document.getElementById('recibo-content').innerHTML = buildReciboHTML(l, u);
  document.getElementById('modal-recibo').classList.add('open');
}

function imprimirRecibo() {
  const contenido = document.getElementById('recibo-printable').outerHTML;
  const w = window.open('', '_blank', 'width=500,height=600');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo</title>
  <style>
    body{font-family:Arial,sans-serif;padding:20px;color:#000}
    .recibo-preview h2{text-align:center;font-size:16px;color:#0F6E56;margin-bottom:4px}
    .sub{text-align:center;font-size:12px;color:#555;margin-bottom:14px}
    .rrow{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dotted #eee}
    .rtotal{display:flex;justify-content:space-between;font-size:15px;font-weight:bold;padding:8px 0;margin-top:4px;border-top:2px solid #0F6E56;color:#0F6E56}
    .firma{text-align:center;margin-top:20px;font-size:11px;color:#888;border-top:1px solid #ccc;padding-top:10px}
  </style></head><body>${contenido}
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  w.document.close();
}
