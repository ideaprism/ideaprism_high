import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { isSameOriginRequest } from './request-origin'
test('origin checks preserve host and protocol isolation, ignoring untrusted forwarded-host',()=>{
  for (const [origin,allowed] of [['http://127.0.0.1:3102',true],['https://127.0.0.1:3102',false],['http://127.0.0.1:3103',false],['https://attacker.test',false],['null',false]] as const) {
    assert.equal(isSameOriginRequest(new NextRequest('http://localhost:3102/api/auth/school',{headers:{Host:'127.0.0.1:3102',Origin:origin,'x-forwarded-host':'attacker.test'}})),allowed)
  }
})
