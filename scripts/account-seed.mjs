import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { config } from 'dotenv'
export function decodeAccountSeed(bytes, key) {
  if (!/^[a-f0-9]{64}$/i.test(key || '') || bytes.subarray(0, 5).toString() !== 'IPAC1') throw Error('Invalid account seed settings')
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), bytes.subarray(5, 17))
  decipher.setAuthTag(bytes.subarray(17, 33))
  return JSON.parse(gunzipSync(Buffer.concat([decipher.update(bytes.subarray(33)), decipher.final()])).toString())
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  config({ path: '.env.local', quiet: true })
  const key = readFileSync('private/service-data-key.txt', 'utf8').trim()
  const db = new DatabaseSync(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite', { readOnly: true })
  const tables = ['partner_organizations', 'access_codes', 'partnership_inquiries']
  const snapshot = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()]))
  db.close()
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), nonce)
  const encrypted = Buffer.concat([cipher.update(gzipSync(JSON.stringify(snapshot))), cipher.final()])
  const artifact = Buffer.concat([Buffer.from('IPAC1'), nonce, cipher.getAuthTag(), encrypted])
  if (JSON.stringify(decodeAccountSeed(artifact, key)) !== JSON.stringify(snapshot)) throw Error('Account seed roundtrip failed')
  writeFileSync('server-data/accounts-seed.enc', artifact)
  console.log('Account snapshot encrypted; no credentials were printed.')
}
