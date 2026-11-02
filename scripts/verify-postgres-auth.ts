import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { accountPool, postgresAdminQuery as query, postgresTransaction } from '../src/lib/postgres-auth-store'

async function main() {
  config({ path: 'private/deployment.env', quiet: true })
  const name = `Deployment regression ${randomUUID()}`
  const credential = `PG-${randomUUID()}`.toUpperCase()
  let orgId: string | undefined
  let codeId: string | undefined
  try {
    await assert.rejects(() => query('access_codes;DROP TABLE x'))
    await assert.rejects(() => query('access_codes', { code: 'like.%' }))
    await assert.rejects(() => query('access_codes', {}, { method: 'DELETE' }))
    const issued = await postgresTransaction(async () => {
      const [org] = await query('partner_organizations', {}, { method: 'POST', body: JSON.stringify({ name, org_type: 'school', school_id: 'samil', is_active: true }) })
      orgId = String(org.id)
      const [code] = await query('access_codes', {}, { method: 'POST', body: JSON.stringify({ code: credential, organization_id: org.id, is_active: true }) })
      return code
    })
    codeId = String(issued.id)
    assert.equal((issued.partner_organizations as Record<string, unknown>).school_id, 'samil')
    const before = await query('partner_organizations')
    await assert.rejects(() => postgresTransaction(async () => {
      const [org] = await query('partner_organizations', {}, { method: 'POST', body: JSON.stringify({ name: name + '-duplicate', org_type: 'school', school_id: 'mirae' }) })
      await query('access_codes', {}, { method: 'POST', body: JSON.stringify({ code: credential, organization_id: org.id }) })
    }))
    assert.equal((await query('partner_organizations')).length, before.length)
    const [changed] = await query('access_codes', { id: `eq.${codeId}` }, { method: 'PATCH', body: JSON.stringify({ code: credential + '-ROTATED' }) })
    assert.equal(changed.session_version, Number(issued.session_version) + 1)
    assert.equal((await query('access_codes', { code: `eq.${credential}` })).length, 0)
    const cas = { id: `eq.${codeId}`, session_version: `eq.${changed.session_version}`, usage_count: 'eq.0' }
    const writes = await Promise.all([1, 2].map(() => query('access_codes', cas, { method: 'PATCH', body: JSON.stringify({ usage_count: 1 }) })))
    assert.equal(writes.filter(rows => rows.length === 1).length, 1)
    console.log(JSON.stringify({ postgres: 'passed', checks: ['school binding', 'transaction rollback on duplicate code', 'code rotation increments session version', 'concurrent usage counter compare-and-set', 'invalid SQL/filter/unscoped delete rejected'] }))
  } finally {
    if (codeId) await query('access_codes', { id: `eq.${codeId}` }, { method: 'DELETE' })
    if (orgId) await query('partner_organizations', { id: `eq.${orgId}` }, { method: 'DELETE' })
    await accountPool().end()
  }
}
main().catch(() => { console.error('PostgreSQL verification failed; no credentials were logged.'); process.exitCode = 1 })
