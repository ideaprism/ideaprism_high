'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X, Settings2, Frown, AlertTriangle, Leaf, Trash2,
    Replace, Combine, Lightbulb, Scaling, ArrowRightLeft, FlipHorizontal2,
    Search, Copy, ExternalLink, Sparkles
} from 'lucide-react'
import { FadeInSection, RotateInSection } from '@/components/ui/AnimatedSection'
import { GuideStep } from '@/constants/home'

interface GuideModalProps {
    isOpen: boolean
    onClose: () => void
    initialStep?: GuideStep
}

/**
 * 통합 가이드 모달 컴포넌트
 * 문제정의/해결방법탐색/관련특허보기 3단계 가이드 제공
 */
export function GuideModal({
    isOpen,
    onClose,
    initialStep = 'problem'
}: GuideModalProps) {
    const [activeStep, setActiveStep] = useState<GuideStep>(initialStep)

    // 모달이 열릴 때마다 initialStep으로 리셋
    useEffect(() => {
        if (isOpen) {
            setActiveStep(initialStep)
        }
    }, [isOpen, initialStep])

    // 스크롤 제어를 위한 ref
    const scrollRef = useRef<HTMLDivElement>(null)

    // 탭 변경 시 스크롤 최상단 이동
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [activeStep])

    if (!isOpen) return null

    const steps = [
        { id: 'problem' as GuideStep, label: '문제 정의', number: 1 },
        { id: 'scamper' as GuideStep, label: '해결 방법 탐색', number: 2 },
        { id: 'patent' as GuideStep, label: '관련 특허 보기', number: 3 },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 오버레이 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* 모달 - 크기 확대 */}
            <div
                ref={scrollRef}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10"
                >
                    <X className="w-6 h-6 text-on-surface-variant" />
                </button>

                {/* 상단 네비게이션 - 스크롤 시 고정 */}
                <div className="sticky top-0 z-10 bg-white px-10 py-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => setActiveStep(step.id)}
                                    className={`flex items-center gap-2 transition-all ${activeStep === step.id
                                        ? 'text-on-surface font-bold text-lg'
                                        : 'text-on-surface-variant/50 text-sm hover:text-on-surface-variant'
                                        }`}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === step.id
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {step.number}
                                    </span>
                                    <span>{step.label}</span>
                                </button>
                                {index < steps.length - 1 && (
                                    <span className="mx-3 text-gray-300">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 활성화된 단계 제목 - 스크롤됨 */}
                <div className="px-10 pt-6 pb-4">
                    <h2 className="text-3xl font-bold text-on-surface mb-4">
                        {activeStep === 'problem' && '문제 정의'}
                        {activeStep === 'scamper' && 'SCAMPER 기법'}
                        {activeStep === 'patent' && '관련 특허 보기'}
                    </h2>
                    <p className="text-on-surface-variant text-lg leading-relaxed">
                        {activeStep === 'problem' && '키워드 입력 → 문제 유형 선택 → 문제 정의 완성의 3단계로 검색을 시작합니다.'}
                        {activeStep === 'scamper' && '7가지 질문으로 기존 아이디어를 새로운 관점에서 바라보고 해결책을 확장합니다.'}
                        {activeStep === 'patent' && '발명 아이디어와 관련된 특허를 검색하고 참고할 수 있습니다.'}
                    </p>
                </div>

                {/* 탭 콘텐츠 - 문제 정의 */}
                {activeStep === 'problem' && <ProblemTab />}

                {/* 탭 콘텐츠 - SCAMPER 기법 */}
                {activeStep === 'scamper' && <ScamperTab />}

                {/* 탭 콘텐츠 - 관련 특허 보기 */}
                {activeStep === 'patent' && <PatentTab />}

                {/* 모달 푸터 */}
                <div className="flex justify-between items-center px-10 pb-10 pt-6">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 border border-outline-variant rounded-xl text-on-surface-variant hover:bg-gray-50 transition-colors font-medium"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div >
    )
}

/**
 * 문제 정의 탭 콘텐츠
 */
function ProblemTab() {
    return (
        <div className="px-10 pb-12 space-y-12">
            {/* 섹션 1: 문제 정의의 중요성 */}
            <FadeInSection>
                <div className="text-center max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-on-surface mb-4">문제 정의의 중요성</h3>
                    <p className="text-on-surface-variant leading-relaxed mb-6">
                        발명의 시작은 <strong className="text-primary font-bold">문제를 정확하게 정의</strong>하는 것입니다.<br />
                        막연한 생각보다는 <strong className="text-primary font-bold">&quot;무엇이 불편한지&quot;</strong> 구체적으로 찾아야 합니다.
                    </p>
                    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 inline-block text-left">
                        <p className="text-sm text-on-surface-variant">
                            💡 <IdeaPrismLogo />은 키워드와 문제 유형의 조합으로<br />
                            여러분이 해결하고자 하는 문제를 명확하게 정의하도록 도와줍니다.
                        </p>
                    </div>
                </div>
            </FadeInSection>

            {/* 3단계 설명 - 카드 스타일 */}
            <FadeInSection delay={100}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1단계 */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 hover:bg-primary/10 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-lg font-bold text-primary">1</span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2 text-lg">키워드 입력</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                            해결하고자 하는 대상의 핵심 키워드를 입력합니다. 예: &quot;우산&quot;, &quot;자전거&quot;
                        </p>
                    </div>

                    {/* 2단계 */}
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6 hover:bg-secondary/10 transition-colors">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-lg font-bold text-secondary">2</span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2 text-lg">문제 유형 선택</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                            성능, 편의, 안전, 환경, 경제성 중에서 해결하려는 문제의 방향을 선택합니다.
                        </p>
                    </div>

                    {/* 3단계 */}
                    <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-6 hover:bg-tertiary/10 transition-colors">
                        <div className="w-10 h-10 bg-tertiary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-lg font-bold text-tertiary">3</span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2 text-lg">문제 정의 완성</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                            키워드와 문제 유형의 조합으로 구체적인 문제 정의가 완성됩니다.
                        </p>
                    </div>
                </div>
            </FadeInSection>

            {/* 구분선 */}
            <div className="border-t border-outline-variant/30" />

            {/* 섹션 2: IdeaPrism의 문제 유형 */}
            <FadeInSection delay={200}>
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h3 className="text-2xl font-bold text-on-surface mb-4">
                        <IdeaPrismLogo />의 문제 유형
                    </h3>
                    <p className="text-on-surface-variant leading-relaxed">
                        발명 아이디어를 탐색할 때 어떤 종류의 문제를 해결하고 싶은지 선택합니다.<br />
                        각 문제 유형에 맞는 발명들을 효과적으로 찾을 수 있습니다.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* 성능(불완전) */}
                    <ProblemTypeCard
                        icon={Settings2}
                        title="성능(불완전)"
                        color="#8B5CF6"
                        titleColor="#5B21B6"
                        description="기능이 불완전하거나 성능이 부족한 문제를 해결하는 발명입니다."
                        examples="&quot;우산이 바람에 뒤집어지는 문제&quot;, &quot;청소기 흡입력이 약한 문제&quot;"
                    />

                    {/* 편의(불편) */}
                    <ProblemTypeCard
                        icon={Frown}
                        title="편의(불편)"
                        color="#FBBF24"
                        titleColor="#92400E"
                        description="사용하기 불편하거나 접근성이 떨어지는 문제를 해결하는 발명입니다."
                        examples="&quot;우산을 들고 가방을 찾기 불편한 문제&quot;, &quot;자전거 주차가 불편한 문제&quot;"
                    />

                    {/* 안전(위험) */}
                    <ProblemTypeCard
                        icon={AlertTriangle}
                        title="안전(위험)"
                        color="#F87171"
                        titleColor="#B91C1C"
                        description="안전하지 않거나 위험을 초래하는 문제를 해결하는 발명입니다."
                        examples="&quot;우산 끝이 뾰족해서 위험한 문제&quot;, &quot;야간 자전거 타기가 위험한 문제&quot;"
                    />

                    {/* 환경(환경오염) */}
                    <ProblemTypeCard
                        icon={Leaf}
                        title="환경(오염)"
                        color="#4ADE80"
                        titleColor="#15803D"
                        description="환경을 오염시키거나 생태계에 해로운 문제를 해결하는 발명입니다."
                        examples="&quot;일회용 우산이 환경을 오염시키는 문제&quot;, &quot;폐배터리 처리 문제&quot;"
                    />

                    {/* 경제성(낭비) */}
                    <ProblemTypeCard
                        icon={Trash2}
                        title="경제성(낭비)"
                        color="#60A5FA"
                        titleColor="#1D4ED8"
                        description="자원이나 비용이 불필요하게 낭비되는 문제를 해결하는 발명입니다."
                        examples="&quot;우산을 자주 분실하는 문제&quot;, &quot;에너지가 낭비되는 문제&quot;"
                    />
                </div>
            </FadeInSection>

            {/* 구분선 */}
            <div className="border-t border-outline-variant/30" />

            {/* 섹션 3: 문제 해결 과정 */}
            <FadeInSection delay={200} className="w-full">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h3 className="text-2xl font-bold text-on-surface mb-4">문제 해결 과정</h3>
                    <p className="text-on-surface-variant leading-relaxed">
                        체계적인 문제 해결 과정을 통해 창의적인 발명 아이디어를 개발해보세요.
                    </p>
                </div>

                {/* 타임라인 */}
                <div className="relative px-4">
                    {/* 중앙 세로선 */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-primary/20" />

                    <div className="space-y-8">
                        {/* 1. 문제 발견 */}
                        <FadeInSection delay={250}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1 text-right pr-6">
                                    <h4 className="font-bold text-on-surface">1. 문제 발견</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        일상생활에서 <span className="text-primary">개선이 필요한 상황</span>이나 불편함을 발견합니다.
                                    </p>
                                </div>
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1" />
                            </div>
                        </FadeInSection>

                        {/* 2. 문제 분석 */}
                        <FadeInSection delay={300}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1" />
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1 pl-6">
                                    <h4 className="font-bold text-on-surface">2. 문제 분석</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        문제의 <span className="text-primary">원인과 영향</span>을 분석하고 관련 요소들을 정리합니다.
                                    </p>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* 3. 아이디어 생성 */}
                        <FadeInSection delay={350}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1 text-right pr-6">
                                    <h4 className="font-bold text-on-surface">3. 아이디어 생성</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        SCAMPER 기법을 활용하여 <span className="text-primary">다양한 해결 아이디어</span>를 생성합니다.
                                    </p>
                                </div>
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1" />
                            </div>
                        </FadeInSection>

                        {/* 4. 아이디어 평가 */}
                        <FadeInSection delay={400}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1" />
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1 pl-6">
                                    <h4 className="font-bold text-on-surface">4. 아이디어 평가</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        생성된 아이디어들을 <span className="text-primary">실현 가능성과 효과성</span> 측면에서 평가합니다.
                                    </p>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* 5. 프로토타입 제작 */}
                        <FadeInSection delay={450}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1 text-right pr-6">
                                    <h4 className="font-bold text-on-surface">5. 프로토타입 제작</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        선택된 아이디어를 바탕으로 <span className="text-primary">간단한 프로토타입</span>을 제작합니다.
                                    </p>
                                </div>
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1" />
                            </div>
                        </FadeInSection>

                        {/* 6. 테스트 및 개선 */}
                        <FadeInSection delay={500}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1" />
                                <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0 z-10" />
                                <div className="flex-1 pl-6">
                                    <h4 className="font-bold text-on-surface">6. 테스트 및 개선</h4>
                                    <p className="text-on-surface-variant text-sm">
                                        프로토타입을 테스트하고 <span className="text-primary">피드백을 바탕으로 개선</span>합니다.
                                    </p>
                                </div>
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </FadeInSection>

            {/* 구분선 */}
            <div className="border-t border-outline-variant/30" />

            {/* 섹션 4: 문제 해결을 위한 팁 */}
            <FadeInSection delay={300} className="w-full">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h3 className="text-2xl font-bold text-on-surface mb-4">문제 해결을 위한 팁</h3>
                    <p className="text-on-surface-variant leading-relaxed">
                        더 효과적인 문제 해결을 위한 실용적인 조언들입니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FadeInSection delay={350}>
                        <TipCard
                            emoji="👥"
                            title="다양한 관점에서 바라보기"
                            description="문제를 한 가지 관점에서만 바라보지 말고, 다양한 사람들의 입장에서 생각해보세요. 사용자, 제작자, 관리자 등 다양한 관점이 새로운 해결책을 제시할 수 있습니다."
                        />
                    </FadeInSection>

                    <FadeInSection delay={400}>
                        <TipCard
                            emoji="⚡"
                            title="빠른 프로토타입 제작"
                            description="완벽한 해결책을 찾으려 하지 말고, 빠르게 간단한 프로토타입을 만들어보세요. 실제로 만들어보면서 문제점과 개선점을 발견할 수 있습니다."
                        />
                    </FadeInSection>

                    <FadeInSection delay={450}>
                        <TipCard
                            emoji="💪"
                            title="실패를 두려워하지 않기"
                            description="실패는 성공의 어머니입니다. 아이디어가 실패하더라도 그 과정에서 배운 것을 바탕으로 더 나은 해결책을 찾을 수 있습니다."
                        />
                    </FadeInSection>

                    <FadeInSection delay={500}>
                        <TipCard
                            emoji="📚"
                            title="지속적인 학습"
                            description="문제 해결 능력은 지속적인 학습과 연습을 통해 향상됩니다. 새로운 기술과 방법론을 배우고, 다양한 문제에 도전해보세요."
                        />
                    </FadeInSection>
                </div>
            </FadeInSection>
        </div>
    )
}

/**
 * SCAMPER 탭 콘텐츠
 */
function ScamperTab() {
    const scamperItems = [
        { letter: 'S', name: '(S) 바꿔보기 (Substitute)', desc: '재료나 부품을 다른 걸로 바꿔보면 어떨까?', example: '(예: 플라스틱 컵 → 옥수수 컵)', color: 'bg-[#FECACA] text-[#7F1D1D]', icon: Replace },
        { letter: 'C', name: '(C) 합쳐보기 (Combine)', desc: '두 가지를 합쳐보면 어떨까?', example: '(예: 필통 + 자 = 자가 달린 필통)', color: 'bg-[#FED7AA] text-[#7C2D12]', icon: Combine },
        { letter: 'A', name: '(A) 따라해보기 (Adapt)', desc: '다른 곳의 아이디어를 빌려오면 어떨까?', example: '(예: 박쥐의 초음파 → 자동차 후방 감지 센서)', color: 'bg-[#FEF3C7] text-[#78350F]', icon: Lightbulb },
        { letter: 'M', name: '(M) 크거나 작게, 다르게! (Modify/Magnify)', desc: '모양, 색깔, 크기를 바꿔보면 어떨까?', example: '(예: 작은 사탕 → 엄청 큰 막대 사탕)', color: 'bg-[#D1FAE5] text-[#064E3B]', icon: Scaling },
        { letter: 'P', name: '(P) 다른 데 써보기 (Put to another use)', desc: '이걸 다른 곳에 쓸 수는 없을까?', example: '(예: 폐타이어 → 멋진 그네 만들기)', color: 'bg-[#BFDBFE] text-[#1E3A8A]', icon: ArrowRightLeft },
        { letter: 'E', name: '(E) 빼보기 (Eliminate)', desc: '필요 없는 부분을 빼면 더 좋아지지 않을까?', example: '(예: 선이 있는 이어폰 → 선 없는 블루투스 이어폰)', color: 'bg-[#C7D2FE] text-[#312E81]', icon: Trash2 },
        { letter: 'R', name: '(R) 거꾸로, 반대로! (Reverse/Rearrange)', desc: '순서나 모양을 뒤집어보면 어떨까?', example: '(예: 낮에만 쓰는 우산 → 밤에 빛나는 LED 우산)', color: 'bg-[#DDD6FE] text-[#4C1D95]', icon: FlipHorizontal2 },
    ]

    return (
        <>
            {/* SCAMPER 상단 헤더 */}
            <RotateInSection className="px-10 pb-8 text-center">
                <h3 className="text-2xl font-bold text-on-surface mb-4">🧙 생각 마법, 스캠퍼(SCAMPER)!</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                    스캠퍼는 아이디어를 더 새롭고 특별하게 만드는 <strong className="text-primary">7가지 질문 마법</strong>이에요.<br />
                    오래된 장난감을 새롭게 바꾸는 것처럼, 여러분의 아이디어를 변신시켜 봐요!
                </p>
                <p className="text-on-surface-variant/80 text-sm">
                    아래 7가지 생각 마법으로 여러분의 아이디어를 요리조리 살펴보세요!
                </p>
            </RotateInSection>

            {/* SCAMPER 7가지 기법 리스트 */}
            <div className="px-10 pb-12 space-y-4">
                {scamperItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <FadeInSection key={item.letter} delay={index * 80}>
                            <div className={`p-5 rounded-xl flex items-start gap-4 ${item.color.replace('text-', 'bg-').split(' ')[0]}/30`}>
                                {/* Icon Box */}
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${item.color.split(' ')[0]}`}>
                                    <Icon className={`w-6 h-6 ${item.color.split(' ')[1]}`} />
                                </div>
                                {/* Text Content */}
                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-1 ${item.color.split(' ')[1]}`}>{item.name}</h4>
                                    <p className="text-on-surface-variant text-sm mb-1 font-medium">{item.desc}</p>
                                    <p className="text-on-surface-variant/70 text-sm">{item.example}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    )
                })}
            </div>

            {/* SCAMPER 하단 안내 */}
            <div className="px-10 pb-8 border-t border-outline-variant/30 pt-8 space-y-0">
                <FadeInSection delay={0} className="text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-2">
                            <IdeaPrismLogo />에서 스캠퍼 사용하기
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed mb-1 max-w-2xl">
                            <IdeaPrismLogo />에서 발명품을 찾아보면, 이 <span className="text-primary font-bold">스캠퍼 마법 질문들</span>이 함께 나타나요.
                        </p>
                        <p className="text-on-surface-variant leading-relaxed max-w-2xl">
                            질문에 하나씩 답하다 보면 <span className="text-primary font-bold">나만의 멋진 아이디어</span>가 짠! 하고 나타날 거예요.
                        </p>
                    </div>
                </FadeInSection>
            </div>
        </>
    )
}

/**
 * 특허 검색 탭 콘텐츠
 */
function PatentTab() {
    return (
        <div className="px-10 pb-12 space-y-12">
            <FadeInSection delay={0} className="text-center pt-4">
                <h3 className="text-2xl font-bold text-on-surface mb-4">⚡ 실시간 특허 검색</h3>
                <p className="text-on-surface-variant leading-relaxed">
                    <IdeaPrismLogoKorean />은 발명의 핵심 키워드와 IPC 코드를 분석해<br />
                    <strong className="text-primary">KIPRIS Plus API</strong>를 통해 관련 특허를 바로 검색해드립니다.
                </p>
            </FadeInSection>

            <div className="border-t border-outline-variant/30" />

            {/* 검색식 구조 설명 */}
            <FadeInSection delay={100} className="w-full bg-surface-container-low rounded-xl p-6 border border-outline-variant/30">
                <h4 className="text-lg font-bold text-on-surface text-center mb-6">🔍 검색식 구조 예시</h4>
                <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-4 font-mono text-on-surface">
                    <FormulaElement label="IPC 코드" value="IPC=[B23K]" color="gray" />
                    <span className="text-on-surface-variant/50 pb-7 font-light text-xl">*</span>
                    <FormulaElement label="O 발명대상" value="(이불장)" color="indigo" />
                    <span className="text-on-surface-variant/50 pb-7 font-light text-xl">*</span>
                    <FormulaElement label="P 문제점" value="(유해연기)" color="red" />
                    <span className="text-on-surface-variant/50 pb-7 font-light text-xl">*</span>
                    <FormulaElement label="S 해결수단" value="(PVC관)" color="emerald" />
                    <span className="text-on-surface-variant/50 pb-7 font-light text-xl">*</span>
                    <FormulaElement label="M 방법/원리" value="(흡입)" color="amber" />
                    <span className="text-on-surface-variant/50 pb-7 font-light text-xl">*</span>
                    <FormulaElement label="E 효과" value="(건강보호)" color="purple" />
                </div>
                <p className="text-xs text-on-surface-variant/70 text-center mt-6">
                    * <strong>IPC 코드</strong>와 <strong>5가지 검색어(OPSME)</strong>를 조합하여 정확도 높은 특허 검색식을 자동으로 만듭니다.<br />
                    * 각 그룹은 곱하기(*:AND) 조건으로 연결되어 모든 조건을 만족하는 특허를 찾습니다.
                </p>
            </FadeInSection>

            <div className="border-t border-outline-variant/30" />

            {/* 단계별 가이드 */}
            <div className="space-y-8">
                <PatentStep
                    number={1}
                    icon={Sparkles}
                    title="특허 검색 버튼 클릭"
                    description="발명 상세 화면에서 '특허 검색' 버튼을 클릭하면 화면이 확장되며 자동으로 검색이 시작됩니다."
                    delay={100}
                />

                <PatentStep
                    number={2}
                    icon={Search}
                    title="자동 검색 결과 확인"
                    description={<>AI가 추출한 <strong>IPC 코드</strong>와 <strong>핵심 키워드</strong>를 조합하여 생성된 검색식으로 실시간 특허 검색 결과를 제공합니다.</>}
                    delay={200}
                />

                <PatentStep
                    number={3}
                    icon={Settings2}
                    title="검색식 수정 및 재검색"
                    description="OPSME(대상, 문제, 해결, 방법, 효과) 5가지 필드의 키워드를 수정하여 더 정확한 특허를 찾아보세요."
                    delay={300}
                    hasOpsmePreview
                />

                <PatentStep
                    number={4}
                    icon={Copy}
                    title="KIPRIS 검색식 복사"
                    description={<>생성된 복잡한 검색식을 클릭 한 번으로 복사하여 <strong>키프리스(KIPRIS)</strong> 사이트에서 직접 활용할 수 있습니다.</>}
                    delay={400}
                />

                <PatentStep
                    number={5}
                    icon={ExternalLink}
                    title="발명 정보와 비교"
                    description="좌측 상단의 썸네일을 클릭하여 원래 발명 아이디어와 찾아진 특허들을 비교하며 아이디어를 발전시켜 보세요."
                    delay={500}
                />
            </div>

            <div className="border-t border-outline-variant/30" />

            <FadeInSection delay={500} className="text-center pb-2">
                <p className="text-on-surface-variant text-sm">
                    특허 검색이 처음이어도 걱정하지 마세요.<br />
                    <span className="text-primary font-bold">IdeaPrism</span>이 전문적인 검색식 작성을 도와드립니다! 🚀
                </p>
            </FadeInSection>
        </div>
    )
}

// ============================================
// 하위 컴포넌트들
// ============================================

/** IdeaPrism 로고 (영문 레인보우) */
function IdeaPrismLogo() {
    return (
        <span className="font-bold inline-flex">
            <span className="text-red-500">I</span>
            <span className="text-orange-500">d</span>
            <span className="text-yellow-500">e</span>
            <span className="text-green-500">a</span>
            <span className="text-teal-500">P</span>
            <span className="text-blue-500">r</span>
            <span className="text-indigo-500">i</span>
            <span className="text-violet-500">s</span>
            <span className="text-purple-600">m</span>
        </span>
    )
}

/** IdeaPrism 로고 (한글 레인보우) */
function IdeaPrismLogoKorean() {
    return (
        <span className="font-bold inline-flex">
            <span className="text-red-500">아</span>
            <span className="text-orange-500">이</span>
            <span className="text-yellow-500">디</span>
            <span className="text-green-500">어</span>
            <span className="text-teal-500">프</span>
            <span className="text-blue-500">리</span>
            <span className="text-purple-600">즘</span>
        </span>
    )
}

/** 문제 유형 카드 */
function ProblemTypeCard({
    icon: Icon,
    title,
    color,
    titleColor,
    description,
    examples
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    title: string
    color: string
    titleColor: string
    description: string
    examples: string
}) {
    return (
        <div className={`flex items-start gap-4 p-5 rounded-xl border`} style={{ borderColor: color, backgroundColor: `${color}10` }}>
            <div className="flex-shrink-0 p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-6 h-6" style={{ color: titleColor }} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold mb-2 text-lg" style={{ color: titleColor }}>{title}</h4>
                <p className="text-on-surface-variant text-sm mb-3 leading-relaxed">{description}</p>
                <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-on-surface-variant font-medium mb-1">💡 예시</p>
                    <p className="text-sm text-on-surface-variant">{examples}</p>
                </div>
            </div>
        </div>
    )
}

/** 팁 카드 */
function TipCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <div className="border border-outline-variant/30 rounded-xl p-5 h-full">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <span className="text-lg">{emoji}</span>
                </div>
                <h4 className="font-bold text-on-surface">{title}</h4>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
                {description.split('다양한 사람들의 입장').length > 1
                    ? <>{description.split('다양한 사람들의 입장')[0]}<span className="text-primary">다양한 사람들의 입장</span>{description.split('다양한 사람들의 입장')[1]}</>
                    : description.split('빠르게 간단한 프로토타입').length > 1
                        ? <>{description.split('빠르게 간단한 프로토타입')[0]}<span className="text-primary">빠르게 간단한 프로토타입</span>{description.split('빠르게 간단한 프로토타입')[1]}</>
                        : description.split('실패는 성공의 어머니').length > 1
                            ? <><span className="text-primary">실패는 성공의 어머니</span>{description.split('실패는 성공의 어머니')[1]}</>
                            : description.split('지속적인 학습과 연습').length > 1
                                ? <>{description.split('지속적인 학습과 연습')[0]}<span className="text-primary">지속적인 학습과 연습</span>{description.split('지속적인 학습과 연습')[1]}</>
                                : description
                }
            </p>
        </div>
    )
}

/** 검색식 요소 */
function FormulaElement({ label, value, color }: { label: string; value: string; color: string }) {
    const colorMap: Record<string, { border: string; bg: string; text: string }> = {
        gray: { border: 'border-gray-400/50', bg: 'bg-gray-100', text: 'text-gray-600' },
        indigo: { border: 'border-indigo-500/50', bg: 'bg-indigo-100', text: 'text-indigo-600' },
        red: { border: 'border-red-500/50', bg: 'bg-red-100', text: 'text-red-600' },
        emerald: { border: 'border-emerald-500/50', bg: 'bg-emerald-100', text: 'text-emerald-600' },
        amber: { border: 'border-amber-500/50', bg: 'bg-amber-100', text: 'text-amber-600' },
        purple: { border: 'border-purple-500/50', bg: 'bg-purple-100', text: 'text-purple-600' },
    }
    const colors = colorMap[color] || colorMap.gray
    const letter = label.split(' ')[0]

    return (
        <div className="flex flex-col items-center group">
            <span className={`text-xl font-bold border-b-4 ${colors.border} text-on-surface px-1 pb-1`}>{value}</span>
            <span className="text-xs text-on-surface-variant mt-2 font-sans font-bold">
                {letter !== 'IPC' && (
                    <span className={`w-4 h-4 ${colors.bg} ${colors.text} rounded-full inline-flex items-center justify-center text-[10px] font-bold mr-1`}>
                        {letter}
                    </span>
                )}
                {label.includes(' ') ? label.split(' ').slice(1).join(' ') : label}
            </span>
        </div>
    )
}

/** 특허 검색 단계 */
function PatentStep({
    number,
    icon: Icon,
    title,
    description,
    delay,
    hasOpsmePreview = false
}: {
    number: number
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: React.ReactNode
    delay: number
    hasOpsmePreview?: boolean
}) {
    return (
        <FadeInSection delay={delay}>
            <div className="flex flex-col gap-4 p-5 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shadow-sm text-primary font-bold border border-outline-variant/20 flex-shrink-0">
                        {number}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-5 h-5 text-primary" />
                            <h4 className="font-bold text-on-surface">{title}</h4>
                        </div>
                        <p className="text-on-surface-variant text-sm">{description}</p>
                    </div>
                </div>

                {hasOpsmePreview && (
                    <div className="mt-2 bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
                        <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2 border border-outline-variant/20 text-center col-span-5 md:col-span-1">
                                <div className="text-gray-500 mb-1 font-bold">IPC 코드</div>
                                <div className="font-mono text-on-surface font-medium truncate">B23K</div>
                            </div>
                            <OpsmePreviewItem letter="O" label="대상" value="이불장" color="indigo" />
                            <OpsmePreviewItem letter="P" label="문제" value="유해연기" color="red" opacity />
                            <OpsmePreviewItem letter="S" label="해결" value="PVC관" color="emerald" highlight />
                            <OpsmePreviewItem letter="M" label="방법" value="흡입" color="amber" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            * 입력하지 않은 필드는 검색 조건에서 자동으로 제외됩니다.
                        </p>
                    </div>
                )}
            </div>
        </FadeInSection>
    )
}

/** OPSME 미리보기 항목 */
function OpsmePreviewItem({
    letter,
    label,
    value,
    color,
    opacity = false,
    highlight = false
}: {
    letter: string
    label: string
    value: string
    color: string
    opacity?: boolean
    highlight?: boolean
}) {
    const colorMap: Record<string, { text: string; bg: string }> = {
        indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
        red: { text: 'text-red-600', bg: 'bg-red-100' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
        amber: { text: 'text-amber-600', bg: 'bg-amber-100' },
    }
    const colors = colorMap[color] || colorMap.indigo

    return (
        <div className={`bg-white rounded-lg p-2 border border-outline-variant/20 text-center ${opacity ? 'opacity-50' : ''} ${highlight ? 'border-l-4 border-l-emerald-400' : ''}`}>
            <div className={`${colors.text} mb-1 font-bold flex justify-center items-center gap-1`}>
                <span className={`w-3.5 h-3.5 ${colors.bg} rounded text-[9px] flex items-center justify-center`}>{letter}</span>
                {label}
            </div>
            <div className="font-mono text-on-surface font-medium truncate">{value}</div>
        </div>
    )
}
