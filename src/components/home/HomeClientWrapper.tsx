'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GuideModal } from '@/components/modals/GuideModal'
import { HomeSearchSection } from './HomeSearchSection'
import { GuideStep } from '@/constants/home'
import { useSchool } from '@/components/school/SchoolProvider'
import { SchoolCrest } from '@/components/school/SchoolCrest'

export function HomeClientWrapper({ children }: { children: React.ReactNode }) {
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [guideModalStep, setGuideModalStep] = useState<GuideStep>('problem')
  const { organization } = useAuth()
  const school = useSchool()
  const isGuestMode = organization?.orgType === 'guest'

  const openGuide = (step: GuideStep = 'problem') => {
    setGuideModalStep(step)
    setIsGuideModalOpen(true)
  }

  return (
    <div onClick={(event) => {
      const target = event.target as HTMLElement
      const trigger = target.closest('[data-guide-trigger]')
      const stepKey = trigger?.getAttribute('data-guide-trigger') as GuideStep
      if (stepKey) openGuide(stepKey)
    }}>
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialStep={guideModalStep}
      />

      <section className="relative z-10 flex flex-col items-center justify-center px-6 pb-16 pt-16 text-center md:px-12">
        {school && (
          <div className="mb-6 flex flex-col items-center">
            <SchoolCrest slug={school.slug} size={84} />
            <p className="mt-4 text-xs font-bold tracking-[0.28em] text-primary">
              {school.region} · {school.established}
            </p>
          </div>
        )}
        <h1 className="font-school mb-4 text-4xl font-bold leading-tight text-on-surface md:text-6xl">
          {school ? school.name : 'IdeaPrism'}
        </h1>
        <p className="mb-3 max-w-2xl text-base font-semibold text-primary md:text-lg">
          {school?.motto ?? '학생 발명 아이디어를 검색합니다'}
        </p>
        <p className="mb-12 max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg" style={{ wordBreak: 'keep-all' }}>
          키워드로 선배들의 발명품을 찾고, SCAMPER로 좁힌 뒤 특허 검색식까지 이어갑니다.
        </p>
        <HomeSearchSection isGuestMode={isGuestMode} onOpenGuide={() => openGuide('problem')} />
      </section>

      {children}
    </div>
  )
}
