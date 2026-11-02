// Node-only persistence. Never import this module into client components or middleware.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve, relative, isAbsolute } from 'node:path'
import { randomUUID } from 'node:crypto'

const databases = new Map<string, DatabaseSync>()
export const accountColumns: Record<string, string[]> = {
  partner_organizations: ['id', 'name', 'org_type', 'school_id', 'is_active', 'region', 'contact_name', 'contact_email', 'created_at'],
  access_codes: ['id', 'code', 'organization_id', 'is_active', 'expires_at', 'max_usage', 'usage_count', 'label', 'created_at', 'session_version'],
  partnership_inquiries: ['id', 'org_name', 'contact_name', 'contact_email', 'purpose', 'status', 'created_at'],
}

export function authDatabase() {
  if (typeof window !== 'undefined') throw Error('Server-only operation')
  if (process.env.VERCEL) throw Error('Vercel requires DATABASE_URL; local SQLite is not persistent')
  const filename = resolve(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite')
  const publicRelative = relative(resolve('public'), filename)
  if (!publicRelative.startsWith('..') && !isAbsolute(publicRelative)) throw Error('Account store cannot be public')
  let db = databases.get(filename)
  if (db) return db
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 })
  db = new DatabaseSync(filename)
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS partner_organizations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, org_type TEXT NOT NULL,
      school_id TEXT CHECK(school_id IS NULL OR school_id IN ('mirae','boseong','samil','daegwang')),
      is_active INTEGER NOT NULL DEFAULT 1, region TEXT, contact_name TEXT, contact_email TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      CHECK(org_type <> 'school' OR school_id IS NOT NULL));
    CREATE TABLE IF NOT EXISTS access_codes (
      id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, organization_id TEXT NOT NULL REFERENCES partner_organizations(id),
      is_active INTEGER NOT NULL DEFAULT 1, expires_at TEXT, max_usage INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0, label TEXT, session_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    CREATE TABLE IF NOT EXISTS partnership_inquiries (
      id TEXT PRIMARY KEY, org_name TEXT, contact_name TEXT, contact_email TEXT, purpose TEXT,
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));`)
  databases.set(filename, db)
  return db
}

export function authTransaction<T>(work: () => T): T {
  const db = authDatabase()
  db.exec('BEGIN IMMEDIATE')
  try { const result = work(); db.exec('COMMIT'); return result }
  catch (error) { db.exec('ROLLBACK'); throw error }
}

type Row = Record<string, unknown>
function bind(value: unknown): SQLInputValue {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number' || typeof value === 'string') return value
  throw Error('Unsupported field value')
}
function hydrate(row: Row): Row {
  return { ...row, ...('is_active' in row ? { is_active: Boolean(row.is_active) } : {}) }
}

/** Small compatibility repository for the existing administrator screens. SQL identifiers are allowlisted. */
export function localAdminQuery(table: string, query: Record<string, string> = {}, init: RequestInit = {}): Row[] {
  const allowed = accountColumns[table]
  if (!allowed) throw Error('Unknown table')
  const db = authDatabase()
  const values: SQLInputValue[] = []
  const filters = Object.entries(query).filter(([key]) => !['select', 'order', 'limit'].includes(key)).map(([key, value]) => {
    if (!allowed.includes(key)) throw Error('Unknown filter')
    if (value === 'is.null') return `${key} IS NULL`
    if (!value.startsWith('eq.')) throw Error('Unsupported filter')
    const raw = value.slice(3)
    values.push(raw === 'true' ? 1 : raw === 'false' ? 0 : raw)
    return `${key} = ?`
  })
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : ''
  const method = init.method || 'GET'
  let rows: Row[]
  if (method === 'POST' || method === 'PATCH') {
    const body = JSON.parse(String(init.body)) as Row
    if (method === 'POST') body.id ??= randomUUID()
    const entries = Object.entries(body)
    if (!entries.length || entries.some(([key]) => !allowed.includes(key))) throw Error('Unknown write field')
    const keys = entries.map(([key]) => key)
    const parameters = entries.map(([, value]) => bind(value))
    if (method === 'POST') {
      rows = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) RETURNING *`).all(...parameters)
    } else {
      if (!filters.length) throw Error('Update requires a filter')
      const revoke = table === 'access_codes' && keys.some(key => ['code', 'is_active', 'expires_at', 'organization_id'].includes(key))
      rows = db.prepare(`UPDATE ${table} SET ${keys.map(key => `${key} = ?`).join(',')}${revoke ? ', session_version = session_version + 1' : ''}${where} RETURNING *`).all(...parameters, ...values)
    }
  } else if (method === 'DELETE') {
    if (!filters.length) throw Error('Delete requires a filter')
    rows = db.prepare(`DELETE FROM ${table}${where} RETURNING *`).all(...values)
  } else {
    const [orderColumn, direction] = (query.order || 'created_at.desc').split('.')
    if (!allowed.includes(orderColumn) || !['asc', 'desc'].includes(direction)) throw Error('Invalid ordering')
    const limit = query.limit === undefined ? 10000 : Number(query.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw Error('Invalid limit')
    rows = db.prepare(`SELECT * FROM ${table}${where} ORDER BY ${orderColumn} ${direction} LIMIT ?`).all(...values, limit)
  }
  return rows.map(row => {
    const result = hydrate(row)
    if (table === 'access_codes') {
      const org = db.prepare('SELECT * FROM partner_organizations WHERE id = ?').get(String(row.organization_id))
      result.partner_organizations = org ? hydrate(org) : null
    }
    return result
  })
}
