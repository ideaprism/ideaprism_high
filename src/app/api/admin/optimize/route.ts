import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminJson } from '@/lib/admin-response'
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  return adminJson({ error: '현재 제공하지 않는 작업입니다.' }, 410)
}
