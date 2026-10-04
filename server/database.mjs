import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const configured = process.env.LAVAFLASH_DATABASE_FILE || process.env.DATABASE_FILE || './data/lavaflash.sqlite';
const DB_FILE = resolve(ROOT, configured);
mkdirSync(dirname(DB_FILE), { recursive: true });

export const sql = new DatabaseSync(DB_FILE);
sql.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS historical_sales (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    sale_date TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    row_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_history_customer ON historical_sales(customer_id);
  CREATE INDEX IF NOT EXISTS idx_history_sale ON historical_sales(sale_id);
  CREATE INDEX IF NOT EXISTS idx_history_date ON historical_sales(sale_date);
  CREATE TABLE IF NOT EXISTS customer_auth (
    customer_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
try { sql.exec('ALTER TABLE app_state ADD COLUMN revision INTEGER NOT NULL DEFAULT 1'); } catch { /* ya existe */ }

const stateGet = sql.prepare('SELECT value_json, revision FROM app_state WHERE key = ?');
const stateInsert = sql.prepare('INSERT INTO app_state(key,value_json,updated_at,revision) VALUES(?,?,?,1)');
const stateSet = sql.prepare(`INSERT INTO app_state(key,value_json,updated_at,revision) VALUES(?,?,?,1)
  ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json, updated_at=excluded.updated_at, revision=app_state.revision+1`);
const stateUpdateIfRevision = sql.prepare('UPDATE app_state SET value_json=?, updated_at=?, revision=revision+1 WHERE key=? AND revision=?');
const stateDelete = sql.prepare('DELETE FROM app_state WHERE key = ?');

const parse = (raw, fallback = null) => {
  try { return JSON.parse(raw); } catch { return fallback; }
};

export function getStateRecord(key, fallback = null) {
  const row = stateGet.get(key);
  if (!row) return { value: fallback, revision: 0, exists: false };
  return { value: parse(row.value_json, fallback), revision: Number(row.revision || 0), exists: true };
}

export function getState(key, fallback = null) { return getStateRecord(key, fallback).value; }

export function setState(key, value) {
  stateSet.run(key, JSON.stringify(value), new Date().toISOString());
  return getStateRecord(key, value);
}

export function setStateIfRevision(key, value, expectedRevision = 0) {
  const now = new Date().toISOString();
  if (Number(expectedRevision) === 0) {
    const existing = stateGet.get(key);
    if (existing) return { ok: false, ...getStateRecord(key) };
    try { stateInsert.run(key, JSON.stringify(value), now); return { ok: true, ...getStateRecord(key) }; }
    catch { return { ok: false, ...getStateRecord(key) }; }
  }
  const result = stateUpdateIfRevision.run(JSON.stringify(value), now, key, Number(expectedRevision));
  if (Number(result.changes || 0) !== 1) return { ok: false, ...getStateRecord(key) };
  return { ok: true, ...getStateRecord(key) };
}

export function deleteState(key) { stateDelete.run(key); }

export function getAllState(keys) {
  const state = {}; const revisions = {};
  for (const key of keys) {
    const row = stateGet.get(key); if (!row) continue;
    state[key] = parse(row.value_json, null); revisions[key] = Number(row.revision || 0);
  }
  return { state, revisions };
}

export function setManyState(values) {
  sql.exec('BEGIN IMMEDIATE');
  try {
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(values)) stateSet.run(key, JSON.stringify(value), now);
    sql.exec('COMMIT');
  } catch (error) {
    sql.exec('ROLLBACK');
    throw error;
  }
  return getAllState(Object.keys(values));
}

export function mutateState(key, fallback, mutator) {
  sql.exec('BEGIN IMMEDIATE');
  try {
    const current = getStateRecord(key, fallback);
    const next = mutator(structuredClone(current.value));
    const now = new Date().toISOString();
    if (current.exists) stateUpdateIfRevision.run(JSON.stringify(next), now, key, current.revision);
    else stateInsert.run(key, JSON.stringify(next), now);
    sql.exec('COMMIT');
    return getStateRecord(key, next);
  } catch (error) {
    sql.exec('ROLLBACK');
    throw error;
  }
}

const authGet = sql.prepare('SELECT password_hash FROM customer_auth WHERE customer_id = ?');
const authSet = sql.prepare(`INSERT INTO customer_auth(customer_id,password_hash,updated_at) VALUES(?,?,?)
  ON CONFLICT(customer_id) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at`);
export function getCustomerPasswordHash(customerId) { return authGet.get(customerId)?.password_hash || null; }
export function setCustomerPasswordHash(customerId, passwordHash) { authSet.run(customerId, passwordHash, new Date().toISOString()); }

const historyUpsert = sql.prepare(`INSERT INTO historical_sales(id,sale_id,sale_date,customer_id,customer_name,row_json,updated_at)
 VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET sale_id=excluded.sale_id,sale_date=excluded.sale_date,
 customer_id=excluded.customer_id,customer_name=excluded.customer_name,row_json=excluded.row_json,updated_at=excluded.updated_at`);
export function importHistory(rows) {
  sql.exec('BEGIN IMMEDIATE');
  try {
    const now = new Date().toISOString();
    for (const row of rows) historyUpsert.run(String(row[0]), String(row[1]), String(row[2]), String(row[10]), String(row[9]), JSON.stringify(row), now);
    sql.exec('COMMIT');
  } catch (error) {
    sql.exec('ROLLBACK');
    throw error;
  }
  return rows.length;
}

export function getHistoryRows() {
  return sql.prepare('SELECT row_json FROM historical_sales ORDER BY sale_date ASC, id ASC').all().map((r) => JSON.parse(r.row_json));
}
export function getHistoryCount() { return Number(sql.prepare('SELECT COUNT(*) AS count FROM historical_sales').get()?.count || 0); }
export function importHistoryFileIfEmpty(filePath) {
  if (getHistoryCount() > 0 || !existsSync(filePath)) return 0;
  const payload = JSON.parse(readFileSync(filePath, 'utf8'));
  if (payload?.version !== 1 || !Array.isArray(payload?.rows)) return 0;
  return importHistory(payload.rows);
}
export function databaseInfo() { return { file: DB_FILE, historyRows: getHistoryCount() }; }
