import { isAdminOrgType } from './auth-roles';

export const ADMIN_SESSION_COOKIE = 'ideaprism_admin_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

export interface AdminSessionPayload {
  orgId: string;
  orgName: string;
  orgType: string;
  exp: number;
}

interface CreateSessionInput {
  orgId: string;
  orgName: string;
  orgType: string;
  ttlSeconds?: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET');
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export async function createAdminSessionToken(input: CreateSessionInput): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    orgId: input.orgId,
    orgName: input.orgName,
    orgType: input.orgType,
    exp: nowSeconds + (input.ttlSeconds ?? DEFAULT_TTL_SECONDS),
  };

  const payloadEncoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(payloadEncoded, getSecret());
  return `${payloadEncoded}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const [payloadEncoded, signature] = token.split('.');
    if (!payloadEncoded || !signature) return null;

    const expected = await sign(payloadEncoded, getSecret());
    if (expected !== signature) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadEncoded));
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    if (!payload.orgId || !payload.orgName || !payload.orgType || !payload.exp) return null;
    if (!isAdminOrgType(payload.orgType)) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) return null;

    return payload;
  } catch {
    return null;
  }
}

export { isAdminOrgType };

