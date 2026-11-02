import { NextResponse } from 'next/server'
import { AdminDbError } from './admin-db'

export function adminJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}
export function adminError(error: unknown) {
  if (error instanceof AdminDbError && error.code === 'configuration') {
    return adminJson({ error: '관리자 DB 연결 설정이 필요합니다.' }, 503)
  }
  if (error instanceof AdminDbError && error.code === '23505') {
    return adminJson({ error: '이미 사용 중인 코드입니다.' }, 409)
  }
  console.error('[Admin DB]', error instanceof AdminDbError ? { status: error.status, code: error.code } : 'request failed')
  return adminJson({ error: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502)
}
