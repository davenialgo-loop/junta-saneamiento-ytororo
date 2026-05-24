const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/lecturas', require('./routes/lecturas'));
app.use('/api/config', require('./routes/config'));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const db = getDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📁 Frontend: http://localhost:${PORT}`);
});
