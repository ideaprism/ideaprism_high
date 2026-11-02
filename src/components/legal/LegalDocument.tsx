import Link from 'next/link'

/** 개인정보처리방침·이용약관 공통 레이아웃 (서버 컴포넌트) */
export function LegalDocument({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-black text-on-surface mb-2">{title}</h1>
      <p className="text-sm text-on-surface-variant mb-10">시행일: {effectiveDate}</p>
      <div className="space-y-10 text-[15px] leading-relaxed text-on-surface">{children}</div>
      <div className="mt-16 pt-8 border-t border-outline-variant/30 flex gap-4 text-sm">
        <Link href="/privacy" className="text-on-surface-variant hover:text-primary">개인정보처리방침</Link>
        <Link href="/terms" className="text-on-surface-variant hover:text-primary">이용약관</Link>
        <Link href="/" className="text-on-surface-variant hover:text-primary ml-auto">홈으로</Link>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-on-surface mb-3">{title}</h2>
      <div className="space-y-3 text-on-surface-variant">{children}</div>
    </section>
  )
}
