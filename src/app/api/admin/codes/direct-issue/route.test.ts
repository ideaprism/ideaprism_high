import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-session'

process.env.ADMIN_SESSION_SECRET = 'direct-issue-test-only-0123456789'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY = 'server-test-key'
const id = '11111111-1111-4111-8111-111111111111'
const orgId = '22222222-2222-4222-8222-222222222222'
test('a failed code insert cleans up only the newly created organization', async t => {
  const calls: { url: string; method: string; body?: string }[] = []
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url), method = init?.method ?? 'GET'
    calls.push({ url: href, method, body: init?.body as string | undefined })
    if (method === 'GET' && new URL(href).searchParams.has('id')) return Response.json([{ id, organization_id: orgId,
      is_active: true, expires_at: null, max_usage: null, partner_organizations: { org_type: 'admin', is_active: true } }])
    if (method === 'GET') return Response.json([])
    if (method === 'POST' && href.includes('partner_organizations')) return Response.json([{ id: JSON.parse(init?.body as string).id }])
    if (method === 'POST') return Response.json({ code: '23505' }, { status: 409 })
    return Response.json([])
  })
  const token = await createAdminSessionToken({ codeId: id, orgId, orgName: 'Admin', orgType: 'admin' })
  const response = await POST(new NextRequest('http://localhost/api/admin/codes/direct-issue', { method: 'POST',
    headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName: 'Test school', customCode: 'TEST-CODE', contactName: 'Contact', contactEmail: 'contact@example.com' }) }))
  assert.equal(response.status, 409)
  const orgWrites = calls.filter(x => x.method === 'POST' && x.url.includes('partner_organizations'))
  assert.equal(orgWrites.length, 1)
  assert.equal(JSON.parse(orgWrites[0].body!).contact_name, 'Contact')
  const cleanup = calls.find(x => x.method === 'DELETE')
  assert.ok(cleanup)
  assert.equal(new URL(cleanup.url).searchParams.get('id'), `eq.${JSON.parse(orgWrites[0].body!).id}`)
})

test('an ambiguous organization insert has a preassigned ID available for cleanup', async t => {
  let insertedId = '', cleanupId: string | null = null
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    if (init?.method === 'POST') { insertedId = JSON.parse(init.body as string).id; throw new Error('Response lost after insert') }
    if (init?.method === 'DELETE') { cleanupId = new URL(String(url)).searchParams.get('id'); return Response.json([]) }
    if (new URL(String(url)).searchParams.has('id')) return Response.json([{ id, organization_id:orgId, is_active:true,
      expires_at:null, max_usage:null, partner_organizations:{org_type:'admin',is_active:true} }])
    return Response.json([])
  })
  const token = await createAdminSessionToken({ codeId:id, orgId, orgName:'Admin', orgType:'admin' })
  const response = await POST(new NextRequest('http://localhost/api/admin/codes/direct-issue', {method:'POST',
    headers:{Cookie:`${ADMIN_SESSION_COOKIE}=${token}`, 'Content-Type':'application/json'}, body:JSON.stringify({orgName:'Test',customCode:'TEST-CODE'})}))
  assert.equal(response.status, 502)
  assert.ok(insertedId)
  assert.equal(cleanupId, `eq.${insertedId}`)
})
