const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  rows.forEach(r => { config[r.key] = parseFloat(r.value) || r.value; });
  res.json(config);
});

router.put('/', (req, res) => {
  const db = getDB();
  const allowed = ['minM3', 'tarifaMin', 'precioM3', 'mora'];
  const update = db.prepare('UPDATE config SET value = ? WHERE key = ?');
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update.run(String(req.body[key]), key);
    }
  }
  const rows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  rows.forEach(r => { config[r.key] = parseFloat(r.value) || r.value; });
  res.json(config);
});

module.exports = router;
