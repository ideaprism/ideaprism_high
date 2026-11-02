import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminCount } from '@/lib/admin-db'
import { adminError, adminJson } from '@/lib/admin-response'

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const [organizations, codes, activeCodes, pendingInquiries] = await Promise.all([
      adminCount('partner_organizations'), adminCount('access_codes'),
      adminCount('access_codes', { is_active: 'eq.true' }), adminCount('partnership_inquiries', { status: 'eq.pending' }),
    ])
    return adminJson({ success: true, organizations, codes, activeCodes, pendingInquiries, searchLogging: false })
  } catch (error) { return adminError(error) }
}
