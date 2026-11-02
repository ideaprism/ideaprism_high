import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminDb } from '@/lib/admin-db'
import { adminError, adminJson } from '@/lib/admin-response'

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const data = await adminDb('partnership_inquiries', { select: 'id,org_name,contact_name,contact_email,purpose,status,created_at', order: 'created_at.desc', limit: '100' })
    return adminJson({ success: true, data })
  } catch (error) { return adminError(error) }
}
