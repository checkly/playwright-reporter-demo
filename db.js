const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'raccoon.db');
const db = new Database(dbPath, { timeout: 5000 });

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ── Schema ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    record_id INTEGER PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
