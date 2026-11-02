import { config } from 'dotenv'
import { randomBytes } from 'node:crypto'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { authTransaction, localAdminQuery } from '../src/lib/local-auth-store'

config({ path: '.env.local', quiet: true })
const output = resolve('private/initial-admin-code.txt')
if (existsSync(output)) throw Error('Initial credential file already exists; refusing to overwrite it.')
const code = 'ADMIN-' + randomBytes(24).toString('hex').toUpperCase()
authTransaction(() => {
  if (localAdminQuery('partner_organizations').some(org => ['admin', 'master_admin', 'super_admin'].includes(String(org.org_type)))) {
    throw Error('An administrator already exists. Use the existing administrator account.')
  }
  const [org] = localAdminQuery('partner_organizations', {}, { method: 'POST', body: JSON.stringify({ name: 'IdeaPrism High 관리자', org_type: 'admin', is_active: true }) })
  localAdminQuery('access_codes', {}, { method: 'POST', body: JSON.stringify({ code, organization_id: org.id, label: '최초 관리자', is_active: true }) })
  writeFileSync(output, `IdeaPrism High local administrator\nLogin: /admin-login\nCode: ${code}\nKeep this file private. Do not commit or share publicly.\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
})
console.log('Administrator created. Credential saved privately to: ' + output)
