'use client'

import { FormEvent, useState } from 'react'

export function SchoolGate() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!code.trim() || isSubmitting) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await response.json()) as { ok?: boolean; message?: string }

      if (!response.ok || !data.ok) {
        setMessage(data.message || '학교 코드가 맞지 않습니다.')
        setIsSubmitting(false)
        return
      }

      window.location.assign('/')
    } catch {
      setMessage('연결이 잠시 끊겼습니다. 다시 시도해 주세요.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="fixed inset-0 z-[80] grid min-h-screen bg-[#efe6d6] text-[#1c1915] md:grid-cols-[minmax(280px,42%)_1fr]">
      <section className="relative hidden overflow-hidden bg-[#1c1915] text-[#f3ecdf] md:flex md:flex-col md:justify-between md:p-12">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #8c6a3a 0, transparent 42%), radial-gradient(circle at 80% 80%, #3d4a38 0, transparent 40%)' }} />
        <p className="relative text-xs font-semibold tracking-[0.42em] text-[#d8c4a0]">IDEAPRISM HIGH</p>
        <div className="relative">
          <p className="font-school text-6xl leading-none tracking-tight">교문</p>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#d9d0c3]" style={{ wordBreak: 'keep-all' }}>
            학교 코드 하나가 교표, 교훈, 색이 다른 발명 검색 화면을 엽니다.
          </p>
        </div>
        <div className="relative flex gap-3">
          <span className="h-2 w-8 bg-[#0C7A43]" />
          <span className="h-2 w-8 bg-[#17233F]" />
          <span className="h-2 w-8 bg-[#6E2B55]" />
          <span className="h-2 w-8 bg-[#7C1E2B]" />
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-[0.34em] text-[#8a5a32]">SCHOOL CODE</p>
          <h1 className="font-school mt-4 text-4xl leading-tight text-[#1c1915] md:text-5xl">
            학교 코드를
            <br />
            입력하세요
          </h1>
          <p className="mt-5 text-sm leading-7 text-[#5c5348]">
            코드가 맞으면 그 학교 이름과 색으로 꾸며진 발명 검색이 열립니다.
          </p>

          <label htmlFor="school-code" className="mt-10 block text-xs font-bold tracking-[0.16em] text-[#5c5348]">
            학교 코드
          </label>
          <input
            id="school-code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="코드를 입력"
            className="mt-3 w-full border-0 border-b-2 border-[#1c1915] bg-transparent py-3 font-school text-2xl tracking-[0.18em] text-[#1c1915] outline-none placeholder:tracking-normal placeholder:text-[#b3a89a]"
          />

          {message && (
            <p role="alert" className="mt-4 text-sm font-medium text-[#8E1D24]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="mt-10 inline-flex h-12 items-center justify-center bg-[#1c1915] px-8 text-sm font-semibold tracking-[0.18em] text-[#f3ecdf] transition hover:bg-[#3a3128] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? '확인 중' : '들어가기'}
          </button>
        </form>
      </section>
    </main>
  )
}
