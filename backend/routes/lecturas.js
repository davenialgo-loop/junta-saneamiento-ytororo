const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDB();
  const { mes, anio, usuarioId } = req.query;
  let sql = 'SELECT * FROM lecturas WHERE 1=1';
  const params = [];
  if (mes) { sql += ' AND mes = ?'; params.push(parseInt(mes)); }
  if (anio) { sql += ' AND anio = ?'; params.push(parseInt(anio)); }
  if (usuarioId) { sql += ' AND usuarioId = ?'; params.push(usuarioId); }
  sql += ' ORDER BY anio DESC, mes DESC, fecha DESC';
  const lecturas = db.prepare(sql).all(...params);
  res.json(lecturas);
});

router.post('/', (req, res) => {
  const { id, usuarioId, mes, anio, anterior, actual, consumo, importe, fecha } = req.body;
  if (!usuarioId || !mes || !anio) {
    return res.status(400).json({ error: 'usuarioId, mes y anio son obligatorios' });
  }
  const db = getDB();
  const exist = db.prepare('SELECT id FROM lecturas WHERE usuarioId = ? AND mes = ? AND anio = ?').get(usuarioId, mes, anio);
  if (exist) {
    db.prepare('DELETE FROM lecturas WHERE usuarioId = ? AND mes = ? AND anio = ?').run(usuarioId, mes, anio);
  }
  db.prepare(`INSERT INTO lecturas (id, usuarioId, mes, anio, anterior, actual, consumo, importe, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id || Date.now().toString(), usuarioId, mes, anio, anterior || 0, actual || 0, consumo || 0, importe || 0, fecha || new Date().toISOString()
  );
  const lectura = db.prepare('SELECT * FROM lecturas WHERE id = ?').get(id || Date.now().toString());
  res.status(201).json(lectura);
});

router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM lecturas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
