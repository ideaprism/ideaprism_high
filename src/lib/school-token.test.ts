import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { createSchoolSessionToken, verifySchoolSessionToken } from './school-token';
import { SCHOOL_SLUGS } from '@/config/schools';

const secret = 'school-test-secret-only-0123456789';
process.env.SCHOOL_SESSION_SECRET = secret;
const signed = (payload: unknown) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`;
};

test('each school can create and verify its own session', async () => {
  for (const slug of SCHOOL_SLUGS) assert.equal(await verifySchoolSessionToken(await createSchoolSessionToken(slug)), slug);
});

test('tampered and extra-segment school sessions are rejected', async () => {
  const token = await createSchoolSessionToken('daegwang');
  assert.equal(await verifySchoolSessionToken(`${token}extra`), null);
  assert.equal(await verifySchoolSessionToken(`${token}.extra`), null);
});

test('expiry must be a future integer, and the school must exist', async (t) => {
  t.mock.method(Date, 'now', () => 1_800_000_000_000);
  for (const exp of [1_800_000_000, 1_799_999_999, 'invalid', '1800001000', 1_800_000_000.5]) {
    assert.equal(await verifySchoolSessionToken(signed({ aud: 'ideaprism-high', slug: 'daegwang', exp })), null);
  }
  assert.equal(await verifySchoolSessionToken(signed({ aud: 'ideaprism-high', slug: 'unknown', exp: 1_800_001_000 })), null);
  assert.equal(await verifySchoolSessionToken(signed({ aud: 'admin', slug: 'daegwang', exp: 1_800_001_000 })), null);
});

test('a missing school secret fails closed even when an admin secret exists', async () => {
  const previousAdmin = process.env.ADMIN_SESSION_SECRET;
  delete process.env.SCHOOL_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = secret;
  try {
    await assert.rejects(createSchoolSessionToken('daegwang'), /SCHOOL_SESSION_SECRET/);
    assert.equal(await verifySchoolSessionToken(signed({ aud: 'ideaprism-high', slug: 'daegwang', exp: 2_000_000_000 })), null);
  } finally {
    process.env.SCHOOL_SESSION_SECRET = secret;
    if (previousAdmin === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = previousAdmin;
  }
});
