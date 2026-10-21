'use client'

import { X, Lightbulb } from 'lucide-react'
import { useEffect } from 'react'

interface AboutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-gray-100 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-5 h-5 text-on-surface-variant" />
                </button>

                {/* 스크롤 가능한 콘텐츠 */}
                <div className="overflow-y-auto max-h-[90vh] p-8 md:p-12">
                    {/* 헤더 */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Lightbulb className="w-6 h-6 text-amber-500" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
                                About{' '}
                                <span className="font-black inline-flex">
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
                            </h2>
                        </div>
                        <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
                            "지식의 선순환으로 <span className="text-primary font-bold">미래의 발명가</span>를 응원합니다"
                        </p>
                    </div>

                    {/* 소개 문구 */}
                    <div className="text-center mb-10 px-4">
                        <p className="text-on-surface-variant leading-relaxed">
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
                            </span>은 25년 차 특허 전문가의 정보 검색/활용에 대한 오랜 경험과 노하우를
                            <br className="hidden md:block" /> 미래 세대에 공유하기 위해 탄생한 프로젝트입니다.
                            <br />
                            <span className="font-bold text-primary">1만 4천여 건</span> 발명대회 수상작에 전문가의 통찰을 더해 학습에 최적화된 고품질 정보를 제공합니다.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {/* 1. 사용자 중심의 정교한 데이터 생성 */}
                        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                                    ✍️
                                </div>
                                <h4 className="font-bold text-lg text-on-surface">사용자 중심의 정교한 데이터 생성</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">정보 재구성</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        원문에만 의존하지 않고 이용자 입장에서 정보를 적극 보완·생성했습니다. 특히 발명 동기는 아이디어를 떠올린 배경을 생생하게 전달하기 위해 인터뷰 형식으로 창작했습니다.
                                    </p>
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">전문가 검수</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        AI가 생성한 콘텐츠를 특허 전문가가 직접 검수하여 교육용으로 최적화된 고품질 정보를 보장합니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. SCAMPER 기법 활용 */}
                        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                                    🧠
                                </div>
                                <h4 className="font-bold text-lg text-on-surface">SCAMPER 기법을 활용한 검색 혁신</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">발상법의 역적용</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        아이디어 발상 도구인 SCAMPER 기법을 검색 인덱스에 역으로 적용했습니다. 정보를 수렴하는 과정에서 창의적 사고 기법을 자연스럽게 체득할 수 있습니다.
                                    </p>
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">검색 장벽 해소</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        학생들의 눈높이에서 표현된 아이디어를 전문 키워드로 재구성하여, 누구나 원하는 사례를 직관적으로 찾을 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. 관련 특허 검색결과 제공 */}
                        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                                    ⚡
                                </div>
                                <h4 className="font-bold text-lg text-on-surface">관련 특허 검색결과 제공</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">구조적 검색식 작성 가이드</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        발명 검색 결과를 바탕으로 특허 검색식을 구조적으로 작성할 수 있도록 돕습니다.
                                    </p>
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">실시간 특허 연동</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        작성된 검색식을 통해 관련 특허 검색 결과를 즉시 확인하고 분석할 수 있는 실무 환경을 제공합니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. 안전하고 신뢰할 수 있는 데이터 활용 */}
                        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                                    🛡️
                                </div>
                                <h4 className="font-bold text-lg text-on-surface">안전하고 신뢰할 수 있는 데이터 활용</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">개인정보 보호</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        발명자의 성명이나 소속 등 개인정보는 일절 다루지 않습니다.
                                    </p>
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-primary block mb-1">본질에 집중</span>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        오직 '발명 검색을 통한 특허정보의 쉬운 활용'이라는 가치에만 전념하여 안전한 학습 환경을 제공합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info Box */}
                    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 rounded-2xl text-center border border-primary/10">
                        <h4 className="font-bold text-on-surface text-lg flex items-center justify-center gap-2 mb-2">
                            <span className="text-xl">🎁</span> 서비스 이용 안내
                        </h4>
                        <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-1">
                            미래의 혁신을 꿈꾸는 학생, 교육자, 그리고 발명에 관심 있는 모든 분을 위해
                        </p>
                        <p className="text-lg font-bold text-primary mb-4">
                            IDEAPRISM 서비스를 무료로 제공합니다.
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                            지금 바로 IDEAPRISM에서 당신의 아이디어를 현실로 만드는 첫걸음을 시작해 보세요!
                        </p>
                    </div>

                    {/* 닫기 버튼 */}
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
