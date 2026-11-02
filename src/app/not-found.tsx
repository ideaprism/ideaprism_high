import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
}

export default function NotFound() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-black text-primary/30 mb-6">404</p>
      <h1 className="text-2xl font-bold text-on-surface mb-3">페이지를 찾을 수 없어요</h1>
      <p className="text-on-surface-variant mb-10">주소가 바뀌었거나 없는 페이지예요.</p>
      <div className="flex justify-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-variant/40"
        >
          홈으로
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90"
        >
          발명품 검색하기
        </Link>
      </div>
    </div>
  )
}
