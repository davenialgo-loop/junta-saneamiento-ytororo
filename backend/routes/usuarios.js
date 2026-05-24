const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDB();
  const usuarios = db.prepare('SELECT * FROM usuarios ORDER BY nombre ASC').all();
  res.json(usuarios);
});

router.post('/', (req, res) => {
  const { id, nombre, apellido, medidor, direccion, telefono, lecIni } = req.body;
  if (!nombre || !medidor) {
    return res.status(400).json({ error: 'Nombre y medidor son obligatorios' });
  }
  const db = getDB();
  const exist = db.prepare('SELECT id FROM usuarios WHERE medidor = ?').get(medidor);
  if (exist) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese medidor' });
  }
  db.prepare(`INSERT INTO usuarios (id, nombre, apellido, medidor, direccion, telefono, lecIni)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    id || Date.now().toString(), nombre, apellido || '', medidor, direccion || '', telefono || '', lecIni || 0
  );
  const user = db.prepare('SELECT * FROM usuarios WHERE medidor = ?').get(medidor);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const db = getDB();
  const { nombre, apellido, medidor, direccion, telefono } = req.body;
  const exist = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!exist) return res.status(404).json({ error: 'Usuario no encontrado' });
  db.prepare(`UPDATE usuarios SET nombre=?, apellido=?, medidor=?, direccion=?, telefono=? WHERE id=?`).run(
    nombre, apellido || '', medidor, direccion || '', telefono || '', req.params.id
  );
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
