'use client'
import { useState, type FormEvent } from 'react'
interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void }
export function DirectIssueModal({ isOpen, onClose, onSuccess }: Props) {
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [form,setForm] = useState({ orgName: '', contactName: '', contactEmail: '', customCode: '' })
  if (!isOpen) return null
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if(busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/codes/direct-issue', { method:'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const result = await response.json()
      if(!response.ok || !result.success) throw Error(result.error || '발급에 실패했습니다.')
      setForm({orgName:'',contactName:'',contactEmail:'',customCode:''}); onSuccess(); onClose()
    } catch(cause) { setError(cause instanceof Error ? cause.message : '연결에 실패했습니다.') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 p-4 flex items-center justify-center">
    <section role="dialog" aria-modal="true" aria-labelledby="issue-title" className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8">
      <div className="flex justify-between gap-4"><h2 id="issue-title" className="text-2xl font-bold">새 기관 코드 발급</h2><button type="button" onClick={onClose} disabled={busy} aria-label="닫기">닫기</button></div>
      <p className="mt-3 text-sm leading-6 text-slate-500">공용 서비스용 기관 코드를 발급합니다. High 학교 진입 코드는 별도입니다.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {([['orgName','기관명',200],['contactName','담당자 성함',100],['contactEmail','담당자 이메일',254],['customCode','지정 코드 (비워 두면 자동 생성)',128]] as const).map(([key,label,max]) =>
          <label key={key} className="block text-sm font-semibold">{label}<input className="mt-2 w-full rounded-xl border p-3" type={key==='contactEmail'?'email':'text'} required={key==='orgName'} maxLength={max} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} /></label>)}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white disabled:opacity-50">{busy?'발급 중…':'기관 코드 발급'}</button>
      </form>
    </section>
  </div>
}
