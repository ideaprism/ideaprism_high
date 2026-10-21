'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AboutModal } from './AboutModal'
import { useSchool } from '@/components/school/SchoolProvider'
import { SchoolCrest } from '@/components/school/SchoolCrest'

export function Footer() {
  const pathname = usePathname()
  const router = useRouter()
  const school = useSchool()
  const [showContact, setShowContact] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  const handleSearchGuideClick = () => {
    if (pathname === '/') {
      document.getElementById('search-guide')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/#search-guide')
    }
  }

  return (
    <>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <footer className="mt-auto w-full border-t border-outline-variant/30 bg-surface py-12">
        <div className="mx-auto w-full max-w-[1440px] px-4">
          <div className="mb-8 flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <h3 className="mb-4 flex items-center gap-3 font-school text-lg font-bold">
                {school && <SchoolCrest slug={school.slug} size={36} />}
                <span>{school ? school.name : 'IdeaPrism High'}</span>
              </h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {school ? school.motto : '학생 발명 검색'}
                <br />
                {school ? `${school.region} ${school.shortName} 전용 화면` : '고등학교 전용 발명 검색'}
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">메뉴</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/search" className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">
                    발명품 검색
                  </Link>
                </li>
                <li>
                  <button onClick={handleSearchGuideClick} className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">
                    검색 방법 안내
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsAboutModalOpen(true)} className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">
                    About IdeaPrism
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">관련 사이트</h4>
              <ul className="space-y-1">
                <li><a href="http://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">KIPRIS 특허정보검색</a></li>
                <li><a href="https://www.science.go.kr/mps/index.do" target="_blank" rel="noopener noreferrer" className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">국립중앙과학관</a></li>
                <li><a href="https://www.ip-edu.net/home/kor/main.do" target="_blank" rel="noopener noreferrer" className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">발명교육포털사이트</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">이용문의</h4>
              {showContact ? (
                <div className="text-sm text-on-surface-variant">
                  <p className="mb-1 font-medium text-on-surface">Steve Changs</p>
                  <p>010-2019-7117</p>
                </div>
              ) : (
                <button onClick={() => setShowContact(true)} className="-ml-3 inline-block rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-primary/10">
                  Contact Info
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-outline-variant/30 pt-8 text-center text-xs text-on-surface-variant">
            <p>© {new Date().getFullYear()} {school ? school.name : 'IdeaPrism High'}</p>
          </div>
        </div>
      </footer>
    </>
  )
}
