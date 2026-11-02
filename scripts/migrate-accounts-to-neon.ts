import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { accountColumns } from '../src/lib/local-auth-store'

async function main() {
  config({ path: 'private/deployment.env', quiet: true })
  if (!process.env.DATABASE_URL) throw Error('Missing DATABASE_URL in private/deployment.env')
  const source = new DatabaseSync(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite', { readOnly: true })
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(readFileSync('scripts/neon-schema.sql', 'utf8'))
    const counts: Record<string, number> = {}
    for (const [table, columns] of Object.entries(accountColumns)) {
      const rows = source.prepare(`SELECT * FROM ${table}`).all()
      for (const row of rows) {
        const values = columns.map(column => row[column])
        await client.query(`INSERT INTO ideaprism_high.${table} (${columns.join(',')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT(id) DO NOTHING`, values)
        const saved = (await client.query(`SELECT * FROM ideaprism_high.${table} WHERE id=$1`, [row.id])).rows[0]
        // Never silently overwrite a code or setting that has since changed in the deployed store.
        for (const column of columns) assert.equal(saved[column], row[column], `Existing ${table} record differs; migration rolled back`)
      }
      counts[table] = rows.length
    }
    await client.query('COMMIT')
    console.log(JSON.stringify({ migrated: counts, existingCodesPreserved: true }))
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { source.close(); client.release(); await pool.end() }
}
main().catch(() => { console.error('Account migration failed. No credentials were logged; the transaction was rolled back.'); process.exitCode = 1 })
