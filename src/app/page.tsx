import { Leaf, Replace, Lightbulb, Sparkles } from 'lucide-react'
import { SchoolGate } from '@/components/auth/SchoolGate'
import { HomeClientWrapper } from '@/components/home/HomeClientWrapper'
import { getSchoolSession } from '@/lib/school-session'

export default async function Home() {
  const school = await getSchoolSession()
  if (!school) {
    return <SchoolGate />
  }

  return (
    <HomeClientWrapper>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-3xl opacity-40" style={{ background: 'color-mix(in srgb, var(--primary) 28%, transparent)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-3xl opacity-50" style={{ background: 'color-mix(in srgb, var(--accent, var(--tertiary)) 24%, transparent)' }} />
          <div className="absolute inset-0 z-0 opacity-50">
            <span className="absolute top-[10%] left-[5%] text-6xl font-black text-primary/10 -rotate-12">{school.shortName}</span>
            <span className="absolute bottom-[15%] right-[5%] text-5xl font-black text-primary/10 rotate-12">SCAMPER</span>
            <Lightbulb className="absolute top-[15%] left-[25%] w-12 h-12 text-primary/10 rotate-12" />
            <Sparkles className="absolute top-[25%] right-[20%] w-8 h-8 text-primary/15" />
            <Replace className="absolute bottom-[30%] left-[15%] w-10 h-10 text-primary/10 -rotate-45" />
            <Leaf className="absolute bottom-[10%] right-[25%] w-12 h-12 text-primary/10 rotate-12" />
          </div>
        </div>

        <section id="search-guide" className="py-20 bg-surface z-10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
            <h2 className="text-3xl font-bold text-on-surface text-center mb-4">검색 방법 안내</h2>
            <p className="text-on-surface-variant text-center mb-12 max-w-2xl mx-auto" style={{ wordBreak: 'keep-all' }}>
              {school.name} 화면에서 문제 정의, SCAMPER, 특허 검색 순서로 아이디어를 좁혀 보세요.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <GuideCard
                step="1"
                title="문제 정의"
                desc="키워드 입력과 해결하려는 문제 유형을 선택하여 문제를 정의합니다."
                stepKey="problem"
              />
              <GuideCard
                step="2"
                title="해결 방법 탐색"
                desc="발명에 적용한 SCAMPER 기법을 선택하여 다양한 관점에서의 해결 방법을 탐색합니다."
                stepKey="scamper"
              />
              <GuideCard
                step="3"
                title="관련 특허 보기"
                desc="유사 발명을 선택해서 특허 검색 버튼을 누르면 실제 특허를 조회할 수 있습니다."
                stepKey="patent"
              />
            </div>
          </div>
        </section>

        <section id="service-intro" className="py-24 bg-white relative overflow-hidden z-10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-20">
              <h2 className="font-school text-3xl md:text-4xl font-bold text-on-surface mb-8">
                {school.shortName} 핵심 기능
              </h2>

              <div className="bg-primary-container/40 rounded-3xl p-8 md:p-10 border border-primary/10 text-left space-y-6">
                <Feature
                  mark="1"
                  title="학생을 위한 발명 검색"
                  body="학생발명대회 수상작을 학교 화면 안에서 키워드로 찾습니다."
                />
                <Feature
                  mark="2"
                  title="SCAMPER 필터"
                  body="대체, 결합, 응용처럼 발상 기법으로 결과를 좁힙니다."
                />
                <Feature
                  mark="3"
                  title="특허 검색식"
                  body="고른 발명에서 특허 검색식을 만들고 KIPRIS로 이어갑니다."
                />
              </div>
            </div>

            <div className="bg-primary-container/50 p-8 rounded-3xl text-center border border-primary/10 max-w-4xl mx-auto">
              <h4 className="font-school font-bold text-on-surface text-xl mb-3">{school.motto}</h4>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                {school.region} {school.name} 학생을 위한 IdeaPrism 화면입니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </HomeClientWrapper>
  )
}

function GuideCard({ step, title, desc, stepKey }: { step: string, title: string, desc: string, stepKey: string }) {
  return (
    <div className="bg-white border border-primary/10 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl font-bold">{step}</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-4">{title}</h3>
      <p className="text-on-surface-variant mb-6 leading-relaxed flex-1">{desc}</p>
      <button data-guide-trigger={stepKey} className="text-primary text-sm font-bold hover:underline">
        상세 내용 보기
      </button>
    </div>
  )
}

function Feature({ mark, title, body }: { mark: string, title: string, body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
        {mark}
      </div>
      <div>
        <h3 className="font-bold text-lg text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
