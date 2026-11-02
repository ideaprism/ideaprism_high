'use client'
import { useEffect, useState } from 'react'
type Inquiry = { id: string; org_name: string; contact_name: string; contact_email: string; purpose: string; status: string | null; created_at: string | null }
export default function InquiriesPage() {
  const [items,setItems] = useState<Inquiry[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/inquiries', { signal: controller.signal }).then(async response => {
      const result = await response.json()
      if (!response.ok) throw Error(result.error || '문의 조회에 실패했습니다.')
      setItems(result.data)
    }).catch(cause => { if(!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '조회 실패') })
      .finally(() => { if(!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  return <div className="space-y-6"><h1 className="text-3xl font-bold">기존 제휴 문의</h1><p className="text-slate-500">High 저장소의 최근 문의 100건입니다. 이전 서비스의 문의는 자동 이전되지 않았으며, 새 문의 접수는 비활성 상태입니다.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p>불러오는 중입니다.</p> : !error && !items.length ? <p>접수된 문의가 없습니다.</p> : items.map(item =>
      <article key={item.id} className="rounded-2xl border bg-white p-6 space-y-3"><h2 className="text-xl font-bold">{item.org_name}</h2>
        <p className="text-sm text-slate-500">{item.contact_name} · {item.contact_email}</p><p className="whitespace-pre-wrap">{item.purpose}</p>
        <p className="text-sm text-slate-500">{item.status || '상태 미지정'} · {item.created_at ? new Date(item.created_at).toLocaleDateString('ko-KR') : ''}</p>
      </article>)}
  </div>
}
