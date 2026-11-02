import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminDb, CODE_COLUMNS, type AdminCode } from '@/lib/admin-db'
import { adminError, adminJson } from '@/lib/admin-response'

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const data = await adminDb<AdminCode[]>('access_codes', { select: CODE_COLUMNS, order: 'created_at.desc', limit: '1000' })
    return adminJson({ success: true, data })
  } catch (error) { return adminError(error) }
}
