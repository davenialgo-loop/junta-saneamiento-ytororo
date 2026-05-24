const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT DEFAULT '',
      medidor TEXT NOT NULL UNIQUE,
      direccion TEXT DEFAULT '',
      telefono TEXT DEFAULT '',
      lecIni REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lecturas (
      id TEXT PRIMARY KEY,
      usuarioId TEXT NOT NULL,
      mes INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      anterior REAL NOT NULL,
      actual REAL NOT NULL,
      consumo REAL NOT NULL,
      importe REAL NOT NULL,
      fecha TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_lectura_unica ON lecturas(usuarioId, mes, anio);
  `);

  const cfgCount = db.prepare('SELECT COUNT(*) as c FROM config').get().c;
  if (cfgCount === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO config(key, value) VALUES(?, ?)');
    insert.run('minM3', '5');
    insert.run('tarifaMin', '15000');
    insert.run('precioM3', '3000');
    insert.run('mora', '10');
  }
}

module.exports = { getDB };
