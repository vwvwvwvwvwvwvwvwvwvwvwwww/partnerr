import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

function convertPlaceholders(text) {
  return text.replace(/\$(\d+)/g, '?');
}

function createClient(db) {
  return {
    query(textOrConfig, params = []) {
      const text = typeof textOrConfig === 'object' ? textOrConfig.text : textOrConfig;
      const values = typeof textOrConfig === 'object' ? textOrConfig.values ?? [] : params;
      const sql = convertPlaceholders(text).trim();

      if (!sql) {
        return { rows: [], rowCount: 0 };
      }

      const stmt = db.prepare(sql);
      const isRead = /^(SELECT|WITH|PRAGMA)/i.test(sql);
      const hasReturning = /RETURNING/i.test(sql);

      if (isRead || hasReturning) {
        const rows = stmt.all(...values);
        return { rows, rowCount: rows.length };
      }

      const info = stmt.run(...values);
      return { rows: [], rowCount: info.changes };
    },

    exec(sql) {
      db.exec(sql);
    },

    release() {},
  };
}

export function createSqlitePool(dbPath) {
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const db = new Database(absolutePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const client = createClient(db);

  return {
    query: (textOrConfig, params) => Promise.resolve(client.query(textOrConfig, params)),
    connect: async () => client,
    exec: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    end: async () => {
      db.close();
    },
  };
}
