import { config } from 'dotenv'
import { DatabaseSync } from 'node:sqlite'

/** Only pass an account ID minted by the current local verification run. */
export function cleanupVerificationAccount(id) {
  config({ path: '.env.local', quiet: true })
  const db = new DatabaseSync(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite')
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE')
  try {
    const account = db.prepare('SELECT organization_id FROM access_codes WHERE id=?').get(id)
    if (account) {
      db.prepare('DELETE FROM access_codes WHERE id=?').run(id)
      db.prepare('DELETE FROM partner_organizations WHERE id=? AND NOT EXISTS(SELECT 1 FROM access_codes WHERE organization_id=?)').run(account.organization_id, account.organization_id)
    }
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  finally { db.close() }
}
