'use client'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const result = await response.json()
      if (!response.ok || !result.valid) throw new Error(result.error || '로그인하지 못했습니다.')
      window.location.assign('/admin')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '연결에 실패했습니다.'); setBusy(false) }
  }
  return <main className="min-h-screen grid place-items-center px-6 bg-slate-50 text-slate-900">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-8 space-y-6">
      <h1 className="text-2xl font-bold">IdeaPrism High 관리자</h1>
      <p className="text-sm text-slate-500">학교 코드와 별도로 발급된 관리자 코드로 로그인합니다.</p>
      <label className="block text-sm font-semibold">관리자 코드
        <input type="password" autoComplete="current-password" value={code} onChange={e => setCode(e.target.value)} maxLength={128} required className="mt-2 w-full rounded-xl border p-3" />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-slate-900 text-white py-3 disabled:opacity-50">{busy ? '확인 중…' : '관리자 로그인'}</button>
      <Link href="/" className="block text-sm text-slate-500">학교 코드 화면으로</Link>
    </form>
  </main>
}
