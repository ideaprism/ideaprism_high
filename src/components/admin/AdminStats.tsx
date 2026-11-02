'use client'
import { useEffect, useState } from 'react'

type Overview = { organizations: number; codes: number; activeCodes: number; pendingInquiries: number }
export default function AdminStats() {
  const [data,setData] = useState<Overview | null>(null)
  const [error,setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/overview', { signal: controller.signal }).then(async response => {
      const result = await response.json()
      if (!response.ok) throw Error(result.error || '운영 현황을 불러오지 못했습니다.')
      setData(result)
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '조회 실패') })
    return () => controller.abort()
  }, [])
  if (error) return <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">{error}</p>
  if (!data) return <p className="py-6 text-slate-500">운영 현황을 불러오는 중입니다.</p>
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[['등록 기관',data.organizations],['기관 코드',data.codes],['활성 표시된 코드',data.activeCodes],['처리 대기 문의',data.pendingInquiries]].map(([label,value]) =>
      <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>)}
  </div>
}
