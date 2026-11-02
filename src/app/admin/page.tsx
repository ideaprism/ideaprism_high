import Link from 'next/link'
import AdminStats from '@/components/admin/AdminStats'
import { SCHOOLS } from '@/config/schools'

export default function AdminDashboard() {
  return <div className="space-y-8">
    <header><h1 className="text-3xl font-bold">운영 현황</h1><p className="mt-3 text-slate-500">High에 등록된 학교 계정과 발급 코드 현황입니다.</p></header>
    <AdminStats />
    <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
      <h2 className="text-xl font-bold">High 학교 화면</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500">계정을 발급할 때 소속 학교를 지정합니다. 발급받은 코드로 로그인하면 연결된 학교의 발명 자료만 열립니다.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{SCHOOLS.map(school => <div key={school.slug} className="rounded-2xl border p-5" style={{borderColor:school.primary}}>
        <h3 className="font-bold" style={{color:school.primary}}>{school.name}</h3><p className="mt-2 text-sm text-slate-500">{school.motto}</p>
      </div>)}</div>
    </section>
    <div className="flex flex-wrap gap-4"><Link href="/admin/codes" className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">기관 코드 관리</Link><Link href="/admin/inquiries" className="rounded-xl border px-5 py-3 font-bold">기존 제휴 문의 확인</Link></div>
  </div>
}
