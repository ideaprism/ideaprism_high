import { Pool, type PoolClient } from 'pg'
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { accountColumns } from './local-auth-store'

let pool: Pool | undefined
const transaction = new AsyncLocalStorage<PoolClient>()
export function accountPool() {
  if (!process.env.DATABASE_URL) throw Error('Missing DATABASE_URL')
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 5000, connectionTimeoutMillis: 15000, allowExitOnIdle: true })
  return pool
}
export async function postgresTransaction<T>(work: () => Promise<T>) {
  const client = await accountPool().connect()
  try {
    await client.query('BEGIN')
    const result = await transaction.run(client, work)
    await client.query('COMMIT')
    return result
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}
type Row = Record<string, unknown>
function hydrate(row: Row): Row {
  return { ...row, ...('is_active' in row ? { is_active: Boolean(row.is_active) } : {}) }
}
function bind(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number' || typeof value === 'string') return value
  throw Error('Unsupported field value')
}
export async function postgresAdminQuery(table: string, query: Record<string, string> = {}, init: RequestInit = {}): Promise<Row[]> {
  const allowed = accountColumns[table]
  if (!allowed) throw Error('Unknown table')
  const client = transaction.getStore() || accountPool()
  const values: unknown[] = []
  const parameter = (value: unknown) => { values.push(bind(value)); return `$${values.length}` }
  const filters = Object.entries(query).filter(([key]) => !['select', 'order', 'limit'].includes(key)).map(([key, value]) => {
    if (!allowed.includes(key)) throw Error('Unknown filter')
    if (value === 'is.null') return `${key} IS NULL`
    if (!value.startsWith('eq.')) throw Error('Unsupported filter')
    const raw = value.slice(3)
    return `${key} = ${parameter(raw === 'true' ? 1 : raw === 'false' ? 0 : raw)}`
  })
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : ''
  const target = `ideaprism_high.${table}`
  const method = init.method || 'GET'
  let sql: string
  if (method === 'POST' || method === 'PATCH') {
    const body = JSON.parse(String(init.body)) as Row
    if (method === 'POST') body.id ??= randomUUID()
    const entries = Object.entries(body)
    if (!entries.length || entries.some(([key]) => !allowed.includes(key))) throw Error('Unknown write field')
    if (method === 'POST') {
      sql = `INSERT INTO ${target} (${entries.map(([key]) => key).join(',')}) VALUES (${entries.map(([, value]) => parameter(value)).join(',')}) RETURNING *`
    } else {
      if (!filters.length) throw Error('Update requires a filter')
      const revoke = table === 'access_codes' && entries.some(([key]) => ['code', 'is_active', 'expires_at', 'organization_id'].includes(key))
      sql = `UPDATE ${target} SET ${entries.map(([key, value]) => `${key} = ${parameter(value)}`).join(',')}${revoke ? ', session_version = session_version + 1' : ''}${where} RETURNING *`
    }
  } else if (method === 'DELETE') {
    if (!filters.length) throw Error('Delete requires a filter')
    sql = `DELETE FROM ${target}${where} RETURNING *`
  } else if (method === 'GET') {
    const [column, direction] = (query.order || 'created_at.desc').split('.')
    if (!allowed.includes(column) || !['asc', 'desc'].includes(direction)) throw Error('Invalid ordering')
    const limit = query.limit === undefined ? 10000 : Number(query.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw Error('Invalid limit')
    sql = `SELECT * FROM ${target}${where} ORDER BY ${column} ${direction} LIMIT ${parameter(limit)}`
  } else throw Error('Unsupported method')
  const { rows } = await client.query<Row>(sql, values)
  const result = rows.map(hydrate)
  if (table === 'access_codes' && rows.length) {
    const ids = [...new Set(rows.map(row => String(row.organization_id)))]
    const orgs = (await client.query<Row>('SELECT * FROM ideaprism_high.partner_organizations WHERE id = ANY($1::text[])', [ids])).rows
    for (const row of result) row.partner_organizations = orgs.find(org => org.id === row.organization_id) ? hydrate(orgs.find(org => org.id === row.organization_id)!) : null
  }
  return result
}
