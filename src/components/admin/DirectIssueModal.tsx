'use client'
import { useState, type FormEvent } from 'react'
import { SCHOOL_SLUGS, getSchoolBySlug } from '@/config/schools'
interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void }
export function DirectIssueModal({ isOpen, onClose, onSuccess }: Props) {
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [form,setForm] = useState({ schoolId: '', orgName: '', contactName: '', contactEmail: '', customCode: '' })
  if (!isOpen) return null
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if(busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/codes/direct-issue', { method:'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const result = await response.json()
      if(!response.ok || !result.success) throw Error(result.error || '발급에 실패했습니다.')
      setForm({schoolId:'',orgName:'',contactName:'',contactEmail:'',customCode:''}); onSuccess(); onClose()
    } catch(cause) { setError(cause instanceof Error ? cause.message : '연결에 실패했습니다.') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 p-4 flex items-center justify-center">
    <section role="dialog" aria-modal="true" aria-labelledby="issue-title" className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8">
      <div className="flex justify-between gap-4"><h2 id="issue-title" className="text-2xl font-bold">새 학교 계정 발급</h2><button type="button" onClick={onClose} disabled={busy} aria-label="닫기">닫기</button></div>
      <p className="mt-3 text-sm leading-6 text-slate-500">발급받은 계정은 선택한 학교의 발명 자료만 볼 수 있습니다.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">소속 학교<select required value={form.schoolId} onChange={e=>setForm({...form,schoolId:e.target.value})} className="mt-2 w-full rounded-xl border p-3"><option value="">학교 선택</option>{SCHOOL_SLUGS.map(slug=><option key={slug} value={slug}>{getSchoolBySlug(slug)?.name}</option>)}</select></label>
        {([['orgName','계정 이름',200],['contactName','담당자 성함',100],['contactEmail','담당자 이메일',254],['customCode','지정 코드 (비워 두면 자동 생성)',128]] as const).map(([key,label,max]) =>
          <label key={key} className="block text-sm font-semibold">{label}<input className="mt-2 w-full rounded-xl border p-3" type={key==='contactEmail'?'email':'text'} required={key==='orgName'} minLength={key==='customCode'?4:undefined} maxLength={max} placeholder={key==='customCode'?'예: MIRAE, DEMO1':undefined} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} /></label>)}
        <p className="text-xs text-slate-500">코드는 영문·숫자·_·- 4자 이상으로 정할 수 있습니다. 비워 두면 학교 이름과 숫자 4자리로 생성됩니다.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white disabled:opacity-50">{busy?'발급 중…':'학교 계정 발급'}</button>
      </form>
    </section>
  </div>
}
