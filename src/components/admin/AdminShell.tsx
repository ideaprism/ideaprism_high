'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [error, setError] = useState('')
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw Error()
      window.location.assign('/admin-login')
    } catch { setError('로그아웃하지 못했습니다. 다시 시도해 주세요.') }
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b bg-white px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/admin" className="text-xl font-black">IdeaPrism High · 관리</Link>
        <div className="flex items-center gap-4 text-sm"><span>{name}</span><Link href="/">학교 화면</Link><button onClick={logout} className="font-bold">로그아웃</button></div>
      </div>
      <nav className="mx-auto mt-5 flex max-w-7xl flex-wrap gap-2">
        {[['/admin','운영 현황'],['/admin/codes','기관 코드 관리'],['/admin/inquiries','기존 제휴 문의'],['/admin/stats','통계 안내']].map(([href,label]) =>
          <Link key={href} href={href} className={`rounded-xl px-4 py-2 text-sm font-bold ${pathname === href ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}>{label}</Link>)}
      </nav>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </header>
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
  </div>
}
