import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { SCHOOL_ACCESS_CODES } from '@/config/school-codes';

process.env.SCHOOL_SESSION_SECRET = 'school-login-test-secret-0123456789';
const request = (body: unknown) => new NextRequest('http://localhost/api/auth/school', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

test('school login rejects malformed input with 400', async () => {
  for (const body of [null, [], {}, { code: 123 }, { code: 'a'.repeat(129) }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
});

test('unknown code returns 401, valid codes set an HttpOnly session', async () => {
  assert.equal((await POST(request({ code: 'not-a-school' }))).status, 401);
  for (const [slug, code] of Object.entries(SCHOOL_ACCESS_CODES)) {
    const response = await POST(request({ code }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).school.slug, slug);
    assert.match(response.headers.get('set-cookie') ?? '', /HttpOnly/i);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});
