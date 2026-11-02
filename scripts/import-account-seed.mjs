// One-time import runs inside Vercel, where the sensitive Neon URL is available.
// No database credential is exported from Vercel or embedded in this repository.
import { readFileSync } from 'node:fs'
import pg from 'pg'
import { decodeAccountSeed } from './account-seed.mjs'

if (process.env.ACCOUNT_SEED_IMPORT === '1' && process.env.VERCEL_ENV === 'production') {
  if (!process.env.DATABASE_URL || !process.env.SERVICE_DATA_KEY) throw Error('Account migration settings are missing')
  const snapshot = decodeAccountSeed(readFileSync('server-data/accounts-seed.enc'), process.env.SERVICE_DATA_KEY)
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ideaprism_high_initial_seed'))")
    await client.query(readFileSync('scripts/neon-schema.sql', 'utf8'))
    await client.query('CREATE TABLE IF NOT EXISTS ideaprism_high.seed_imports (id TEXT PRIMARY KEY, imported_at TIMESTAMPTZ NOT NULL DEFAULT now())')
    const done = await client.query("SELECT id FROM ideaprism_high.seed_imports WHERE id='initial-local-accounts'")
    if (!done.rowCount) {
      const columns = {
        partner_organizations: ['id','name','org_type','school_id','is_active','region','contact_name','contact_email','created_at'],
        access_codes: ['id','code','organization_id','is_active','expires_at','max_usage','usage_count','label','created_at','session_version'],
        partnership_inquiries: ['id','org_name','contact_name','contact_email','purpose','status','created_at'],
      }
      for (const table of Object.keys(columns)) {
        const existing = await client.query(`SELECT 1 FROM ideaprism_high.${table} LIMIT 1`)
        if (existing.rowCount) throw Error('Account store is not empty; refusing to overwrite existing data')
      }
      for (const [table, keys] of Object.entries(columns)) {
        if (!Array.isArray(snapshot[table])) throw Error('Invalid account snapshot')
        for (const row of snapshot[table]) {
          await client.query(`INSERT INTO ideaprism_high.${table} (${keys.join(',')}) VALUES (${keys.map((_, index) => `$${index + 1}`).join(',')})`, keys.map(key => row[key]))
        }
      }
      await client.query("INSERT INTO ideaprism_high.seed_imports(id) VALUES('initial-local-accounts')")
      console.log('Initial local accounts imported into Neon; codes and school bindings preserved.')
    } else console.log('Initial accounts already imported; current account changes preserved.')
    await client.query('COMMIT')
  } catch {
    await client.query('ROLLBACK')
    throw Error('Neon account migration failed and rolled back; no credentials logged')
  } finally { client.release(); await pool.end() }
}
