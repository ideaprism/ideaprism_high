import { isSchoolSlug, type SchoolSlug } from '@/config/schools'

export const SCHOOL_SESSION_COOKIE = 'ideaprism_school_session'
const SESSION_TTL_SECONDS = 60 * 60 * 12

interface SchoolTokenPayload {
  slug: SchoolSlug
  exp: number
}

function getSecret(): string | null {
  return process.env.SCHOOL_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || null
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '==='.slice((base64.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toBase64Url(new Uint8Array(signature))
}

export async function createSchoolSessionToken(slug: SchoolSlug): Promise<string> {
  const secret = getSecret()
  if (!secret) {
    throw new Error('Missing SCHOOL_SESSION_SECRET')
  }

  const payload: SchoolTokenPayload = {
    slug,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const payloadEncoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await sign(payloadEncoded, secret)
  return `${payloadEncoded}.${signature}`
}

export async function verifySchoolSessionToken(token: string): Promise<SchoolSlug | null> {
  try {
    const secret = getSecret()
    if (!secret) return null

    const [payloadEncoded, signature] = token.split('.')
    if (!payloadEncoded || !signature) return null

    const expected = await sign(payloadEncoded, secret)
    if (expected !== signature) return null

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadEncoded))
    ) as SchoolTokenPayload

    if (!payload?.slug || !isSchoolSlug(payload.slug)) return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload.slug
  } catch {
    return null
  }
}

export const SCHOOL_SESSION_MAX_AGE = SESSION_TTL_SECONDS
