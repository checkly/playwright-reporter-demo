// db.js — Dual-mode database: Turso (remote) or better-sqlite3 (local)
//
// When TURSO_DATABASE_URL is set (Vercel / production), uses @libsql/client.
// Otherwise falls back to better-sqlite3 with a local raccoon.db file.
// Both expose the same async interface: execute({ sql, args }) and batch([...], mode).

function createDb() {
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = require('@libsql/client');
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // Wrap better-sqlite3 in an async-compatible interface matching @libsql/client
  const Database = require('better-sqlite3');
  const path = require('path');
  const sqlite = new Database(path.join(__dirname, 'raccoon.db'), { timeout: 5000 });
  sqlite.pragma('journal_mode = WAL');

  return {
    async execute(stmt) {
      const { sql, args = [] } = typeof stmt === 'string' ? { sql: stmt } : stmt;
      const prepared = sqlite.prepare(sql);
      if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
        const rows = prepared.all(...args);
        return { rows, columns: Object.keys(rows[0] || {}), rowsAffected: 0, lastInsertRowid: undefined };
      }
      const info = prepared.run(...args);
      return { rows: [], columns: [], rowsAffected: info.changes, lastInsertRowid: info.lastInsertRowid };
    },

    async batch(stmts, mode) {
      const results = [];
      sqlite.transaction(() => {
        for (const s of stmts) {
          const { sql, args = [] } = typeof s === 'string' ? { sql: s } : s;
          const prepared = sqlite.prepare(sql);
          if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
            const rows = prepared.all(...args);
            results.push({ rows, columns: Object.keys(rows[0] || {}), rowsAffected: 0, lastInsertRowid: undefined });
          } else {
            const info = prepared.run(...args);
            results.push({ rows: [], columns: [], rowsAffected: info.changes, lastInsertRowid: info.lastInsertRowid });
          }
        }
      })();
      return results;
    },
  };
}

const db = createDb();

async function initSchema() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS inventory (
        record_id INTEGER PRIMARY KEY,
        stock INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        customer TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS cart (
        record_id INTEGER PRIMARY KEY,
        quantity INTEGER NOT NULL DEFAULT 1
      )`,
      args: [],
    },
  ], 'write');
}

module.exports = { db, initSchema };
