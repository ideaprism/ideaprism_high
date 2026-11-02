import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { createSchoolSessionToken, SCHOOL_SESSION_COOKIE } from './school-token';
import { POST as search } from '@/app/api/search/route';
import { GET as detail } from '@/app/api/inventions/[id]/route';
import { GET as patent } from '@/app/api/kipris/search/route';
import { POST as chat } from '@/app/api/chat/route';

process.env.SCHOOL_SESSION_SECRET = 'school-route-test-secret-0123456789';

test('school middleware recognizes detail and base chat API paths', async () => {
  const token = await createSchoolSessionToken('mirae');
  for (const path of ['/api/search', '/api/inventions/elem-10001', '/api/kipris/search', '/api/chat']) {
    const response = await middleware(new NextRequest(`http://localhost${path}`, {
      headers: { Cookie: `${SCHOOL_SESSION_COOKIE}=${token}` },
    }));
    assert.equal(response.status, 200, path);
  }
});

test('route handlers deny access independently of middleware', async () => {
  const request = new NextRequest('http://localhost/api/search', { method: 'POST', body: '{}' });
  for (const response of [await search(request), await patent(request), await chat(request),
    await detail(request, { params: Promise.resolve({ id: 'elem-10001' }) })]) {
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
});

test('unauthenticated API access is denied, and school sessions do not grant admin access', async () => {
  assert.equal((await middleware(new NextRequest('http://localhost/api/search'))).status, 401);
  const token = await createSchoolSessionToken('mirae');
  assert.equal((await middleware(new NextRequest('http://localhost/api/admin/inquiries', {
    headers: { Cookie: `${SCHOOL_SESSION_COOKIE}=${token}` },
  }))).status, 401);
});
