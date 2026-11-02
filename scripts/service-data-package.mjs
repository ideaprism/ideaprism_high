// Git contains only this encrypted package. Its key is a server-side deployment secret.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { config } from 'dotenv'

function validName(name) {
  return /^(README\.md|data\/(inventions|catalog)\.json|images\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|gif))$/i.test(name)
}
function keyBytes(key) {
  if (!/^[a-f0-9]{64}$/i.test(key || '')) throw Error('SERVICE_DATA_KEY must be a 32-byte hex secret')
  return Buffer.from(key, 'hex')
}
export function pack(root, key) {
  const files = []
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name)
      if (entry.isDirectory()) walk(file)
      else {
        const name = relative(root, file).replaceAll('\\', '/')
        if (!entry.isFile() || !validName(name)) throw Error('Unexpected service package file')
        files.push({ name, data: readFileSync(file).toString('base64') })
      }
    }
  }
  walk(root)
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyBytes(key), nonce)
  const encrypted = Buffer.concat([cipher.update(gzipSync(JSON.stringify(files))), cipher.final()])
  return Buffer.concat([Buffer.from('IPSD1'), nonce, cipher.getAuthTag(), encrypted])
}
export function unpack(bytes, root, key) {
  if (bytes.subarray(0, 5).toString() !== 'IPSD1') throw Error('Invalid encrypted package')
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(key), bytes.subarray(5, 17))
  decipher.setAuthTag(bytes.subarray(17, 33))
  const files = JSON.parse(gunzipSync(Buffer.concat([decipher.update(bytes.subarray(33)), decipher.final()])).toString())
  if (!Array.isArray(files) || files.some(file => !validName(file.name) || typeof file.data !== 'string')) throw Error('Invalid package paths')
  for (const file of files) {
    const target = resolve(root, file.name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, Buffer.from(file.data, 'base64'))
  }
  return files.length
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  config({ path: '.env.local', quiet: true })
  const root = resolve('private/service-data')
  const artifact = resolve('server-data/service-data.enc')
  if (process.argv.includes('--pack')) {
    const keyFile = resolve('private/service-data-key.txt')
    const key = process.env.SERVICE_DATA_KEY || (existsSync(keyFile) ? readFileSync(keyFile, 'utf8').trim() : randomBytes(32).toString('hex'))
    mkdirSync(dirname(keyFile), { recursive: true })
    writeFileSync(keyFile, key + '\n', { mode: 0o600 })
    mkdirSync(dirname(artifact), { recursive: true })
    writeFileSync(artifact, pack(root, key))
    console.log('Encrypted service package prepared; key saved privately.')
  } else if (process.env.SERVICE_DATA_KEY) {
    console.log(`Prepared ${unpack(readFileSync(artifact), root, process.env.SERVICE_DATA_KEY)} private service files.`)
  } else if (process.env.VERCEL || !existsSync(resolve(root, 'data/inventions.json'))) {
    throw Error('Configure SERVICE_DATA_KEY before building this deployment')
  }
}
