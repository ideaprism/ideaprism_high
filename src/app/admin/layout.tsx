import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'
import { isActiveAdmin } from '@/lib/admin-access'
import { AdminShell } from '@/components/admin/AdminShell'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  const session = token ? await verifyAdminSessionToken(token) : null
  if (!session) redirect('/admin-login')
  let active: boolean
  try { active = await isActiveAdmin(session) }
  catch {
    return <div className="p-10"><h1 className="text-xl font-bold">관리자 DB 연결을 확인해 주세요.</h1><p className="my-4">서버 설정 또는 연결 문제로 관리자 정보를 확인하지 못했습니다.</p><Link href="/admin-login">로그인 화면으로</Link></div>
  }
  if (!active) redirect('/admin-login')
  return <AdminShell name={session.orgName}>{children}</AdminShell>
}
