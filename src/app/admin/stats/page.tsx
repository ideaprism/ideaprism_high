import AdminStats from '@/components/admin/AdminStats'
export default function StatsPage() {
  return <div className="space-y-8"><h1 className="text-3xl font-bold">통계 안내</h1><AdminStats />
    <section className="rounded-3xl border bg-white p-8"><h2 className="text-xl font-bold">학교 검색 통계는 수집하지 않습니다.</h2>
      <p className="mt-4 leading-8 text-slate-600">High는 학생의 검색어·개인별 사용 기록을 통계 서비스로 보내지 않습니다. 검색량, 인기 검색어, 학교별 사용률은 제공하지 않습니다.</p>
      <p className="mt-3 text-sm text-slate-500">계정 코드의 사용 횟수는 이 서비스에서 성공한 로그인 횟수입니다.</p>
    </section></div>
}
