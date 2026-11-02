import { testStore, testSchoolToken } from '@/lib/test-accounts';
testStore();
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { createSchoolSessionToken, SCHOOL_SESSION_COOKIE } from '@/lib/school-token';

test('invalid formula returns 400 without contacting KIPRIS', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('unexpected network request'); });
  for (const formula of ['(우산*자전거)+의자', '우산*', '(우산+의자']) {
    const response = await GET(await schoolRequest(`http://localhost/api/kipris/search?q=${encodeURIComponent(formula)}`));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('upstream HTML is reported as an error rather than zero patents', async (t) => {
  const previous = process.env.KIPRIS_SERVICE_KEY;
  process.env.KIPRIS_SERVICE_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.KIPRIS_SERVICE_KEY; else process.env.KIPRIS_SERVICE_KEY = previous; });
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Service unavailable</html>'));
  const response = await GET(await schoolRequest('http://localhost/api/kipris/search?q=우산'));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).success, false);
});

test('upstream timeout has a stable 504 response', async (t) => {
  const previous = process.env.KIPRIS_SERVICE_KEY;
  process.env.KIPRIS_SERVICE_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.KIPRIS_SERVICE_KEY; else process.env.KIPRIS_SERVICE_KEY = previous; });
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('network detail', 'TimeoutError'); });
  const response = await GET(await schoolRequest('http://localhost/api/kipris/search?q=우산'));
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.includes('network detail'), false);
});

process.env.SCHOOL_SESSION_SECRET = 'school-api-test-secret-0123456789';
async function schoolRequest(url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  const token = await testSchoolToken('mirae');
  const headers = new Headers(init.headers);
  headers.set('Cookie', SCHOOL_SESSION_COOKIE + '=' + token);
  return new NextRequest(url, { ...init, headers });
}
