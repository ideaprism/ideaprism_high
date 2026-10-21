'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Search, Info, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useSchool } from '@/components/school/SchoolProvider'
import { SchoolCrest } from '@/components/school/SchoolCrest'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const school = useSchool()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleServiceIntroClick = () => {
    if (pathname === '/') {
      document.getElementById('service-intro')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/#service-intro')
    }
  }

  const handleSearchGuideClick = () => {
    if (pathname === '/') {
      document.getElementById('search-guide')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/#search-guide')
    }
  }

  const leaveSchool = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="w-full max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          {school ? (
            <>
              <SchoolCrest slug={school.slug} size={40} />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold tracking-[0.22em] text-primary uppercase">IdeaPrism</span>
                <span className="block truncate font-school text-lg font-bold leading-none text-on-surface">{school.shortName}</span>
              </span>
            </>
          ) : (
            <span className="font-school text-xl font-bold">IdeaPrism High</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/search" className="px-4 py-2 text-sm font-bold text-on-surface hover:bg-primary/10 rounded-full transition-all">
            발명품 검색
          </Link>
          <button
            onClick={handleSearchGuideClick}
            className="px-4 py-2 text-sm font-bold text-on-surface hover:bg-primary/10 rounded-full transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            검색 방법 안내
          </button>
          <button
            onClick={handleServiceIntroClick}
            className="px-4 py-2 text-sm font-bold text-on-surface hover:bg-primary/10 rounded-full transition-all flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            서비스 소개
          </button>
          {school && (
            <Button variant="text" size="sm" onClick={leaveSchool} title="학교 코드 화면으로">
              <LogOut className="w-4 h-4 mr-1" />
              나가기
            </Button>
          )}
        </nav>

        <button
          className="md:hidden p-2 text-on-surface hover:bg-primary/10 rounded-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface px-4 py-3">
          <nav className="flex flex-col gap-2">
            <Link href="/search" className="px-3 py-3 font-bold rounded-xl hover:bg-primary/10" onClick={() => setIsMenuOpen(false)}>
              발명품 검색
            </Link>
            <button onClick={() => { handleSearchGuideClick(); setIsMenuOpen(false) }} className="px-3 py-3 text-left font-bold rounded-xl hover:bg-primary/10">
              검색 방법 안내
            </button>
            {school && (
              <button onClick={leaveSchool} className="px-3 py-3 text-left font-bold text-primary rounded-xl hover:bg-primary/10">
                {school.shortName}에서 나가기
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
