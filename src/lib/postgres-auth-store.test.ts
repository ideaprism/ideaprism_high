import assert from 'node:assert/strict'
import test from 'node:test'
import { Pool } from 'pg'
import { accountPool, postgresAdminQuery, postgresTransaction } from './postgres-auth-store'
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'

test('Vercel pool releases participate in the function lifecycle', t => {
  const previous = process.env.VERCEL
  process.env.VERCEL = '1'
  t.after(() => { if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous })
  assert.ok(accountPool().listenerCount('release') > 0)
})

test('a disconnected read reconnects once without dropping authorization filters', async t => {
  const calls: unknown[][] = []
  t.mock.method(Pool.prototype, 'query', async (...args: unknown[]) => {
    calls.push(args)
    if (calls.length === 1) throw Error('Connection terminated due to connection timeout')
    return { rows: [{ id: 'bound-school', is_active: 1 }] }
  })
  const rows = await postgresAdminQuery('partner_organizations', { id: 'eq.bound-school', is_active: 'eq.true' })
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0], calls[1])
  assert.deepEqual(calls[0][1], ['bound-school', 1, 10000])
  assert.equal(rows[0].is_active, true)
})

test('writes and non-connection errors are never retried', async t => {
  let calls = 0
  const failure = Object.assign(Error('Connection terminated unexpectedly'), { code: 'ECONNRESET' })
  t.mock.method(Pool.prototype, 'query', async () => { calls++; throw failure })
  await assert.rejects(() => postgresAdminQuery('access_codes', { id: 'eq.account' }, { method: 'PATCH', body: JSON.stringify({ usage_count: 1 }) }))
  assert.equal(calls, 1)
})

test('read retries are bounded and database errors fail closed', async t => {
  let calls = 0
  t.mock.method(Pool.prototype, 'query', async () => { calls++; throw Object.assign(Error('Connection reset'), { code: 'ECONNRESET' }) })
  await assert.rejects(() => postgresAdminQuery('access_codes', { id: 'eq.account' }))
  assert.equal(calls, 2)
})

test('SQL and permission errors on reads are not retried', async t => {
  let calls = 0
  t.mock.method(Pool.prototype, 'query', async () => { calls++; throw Object.assign(Error('permission denied'), { code: '42501' }) })
  await assert.rejects(() => postgresAdminQuery('access_codes', { id: 'eq.account' }))
  assert.equal(calls, 1)
})

test('reads inside a transaction fail and roll back without replaying the transaction', async t => {
  const sql: string[] = []
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async (statement: string) => {
      sql.push(statement)
      if (statement.startsWith('SELECT')) throw Object.assign(Error('Connection reset'), { code: 'ECONNRESET' })
      return { rows: [] }
    },
    release: () => {},
  }))
  await assert.rejects(() => postgresTransaction(() => postgresAdminQuery('access_codes', { id: 'eq.account' })))
  assert.equal(sql.filter(query => query.startsWith('SELECT')).length, 1)
  assert.equal(sql.at(-1), 'ROLLBACK')
})

test('idle pool disconnects are handled rather than crashing the request worker', t => {
  t.mock.method(console, 'warn', () => {})
  assert.doesNotThrow(() => accountPool().emit('error', Object.assign(Error('Connection terminated unexpectedly'), { code: 'ECONNRESET' })))
})

test.after(async () => { await accountPool().end(); delete process.env.DATABASE_URL })
