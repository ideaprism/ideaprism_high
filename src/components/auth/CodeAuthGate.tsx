'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react'
import { PartnershipInquiryModal } from './PartnershipInquiryModal'

export const CodeAuthGate: React.FC = () => {
    const { isAuthenticated, login, isLoading } = useAuth()
    const [code, setCode] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [isInquiryOpen, setIsInquiryOpen] = useState(false)

    // 인증된 경우 출력 안함
    if (isAuthenticated || isLoading) return null

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        const normalizedCode = code.trim().toUpperCase()

        setStatus('loading')
        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode })
            })
            const data = await res.json()

            if (data.valid) {
                setStatus('success')
                setMessage(`${data.organization.name}님, 환영합니다!`)
                setTimeout(() => {
                    login(normalizedCode, data.organization)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 1500)
            } else {
                setStatus('error')
                setMessage(data.message || '인증에 실패했습니다.')
            }
        } catch (error) {
            setStatus('error')
            setMessage('서버 통신 중 오류가 발생했습니다.')
        }
    }

    const handleTrial = () => {
        // 체험 모드: 파트너 정보 없이 로그인 상태만 변경 (제한된 접근)
        login('GUEST', { id: 'guest', name: '체험 사용자', orgType: 'guest', region: 'Global' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ zIndex: 2000 }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="bg-white rounded-[32px] shadow-2xl overflow-hidden relative w-full max-w-[1000px]"
                style={{ zIndex: 2000 }}
            >
                {/* Header */}
                <div
                    className="p-8 relative"
                    style={{
                        background: 'linear-gradient(90deg, #3730a3 0%, #6366f1 100%)',
                    }}
                >
                    <h2 className="text-2xl md:text-3xl font-black text-white text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        IDEAPRISM 시범서비스 사용 기관 모집
                    </h2>
                </div>

                {/* Content Layout */}
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Left Column: What's New */}
                    <div className="flex-[1.2] p-8 bg-slate-50/50">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    ✨ 한층 더 강력해진 기능
                                </h3>
                                <ul className="space-y-3 text-[15px] text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-900 font-bold">데이터 빵빵</strong>: 발명품 데이터가 대폭 늘어났어요. (6,000건 → 14,500여 건)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-900 font-bold">똑똑한 필터</strong>: 원하는 발명품을 더 쉽게 찾아보세요.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-900 font-bold">특허 검색 마스터</strong>: 복잡한 검색식 작성도 이제 문제없어요.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-900 font-bold">결과 바로보기</strong>: 특허 검색 결과를 바로 확인할 수 있어요.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    🚧 열심히 준비 중이에요!
                                </h3>
                                <ul className="space-y-2.5 text-xs text-slate-500">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-700 font-bold">AI 챗봇</strong>: 학생 발상 오류를 지도할 AI 멘토 (열공 중!)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                                        <span><strong className="text-slate-700 font-bold">대화형 제어</strong>: 말로 하면 척척 알아듣는 스마트 제어</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Auth & CTA */}
                    <div className="flex-1 p-8 flex flex-col justify-center">
                        <div className="space-y-8">
                            {/* Access Code Section */}
                            <div>
                                <div className="flex items-center gap-2 text-slate-900 font-black mb-3">
                                    <Lock className="w-5 h-5 text-indigo-600" />
                                    <span>파트너 전용 액세스 코드 입력</span>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                            placeholder="ACCESS CODE"
                                            disabled={status === 'loading' || status === 'success'}
                                            className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 text-center text-2xl font-black uppercase tracking-[0.4em] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-200 disabled:opacity-50"
                                        />
                                        <AnimatePresence>
                                            {status === 'error' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute -bottom-6 left-0 right-0 text-center text-[11px] font-bold text-red-500"
                                                >
                                                    {message}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || status === 'success' || !code.trim()}
                                        className="w-full h-16 bg-indigo-500 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-600 hover:shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        <AnimatePresence mode="wait">
                                            {status === 'loading' ? (
                                                <motion.div 
                                                    key="loading"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
                                                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                                                />
                                            ) : (
                                                <span>엔터 워크스페이스 →</span>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                </form>
                            </div>

                            {/* Main CTA Section */}
                            <div className="pt-6 space-y-4">
                                <button 
                                    onClick={() => setIsInquiryOpen(true)}
                                    className="w-full h-14 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    시범서비스 이용 신청
                                </button>
                                
                                <button 
                                    onClick={handleTrial}
                                    className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors underline underline-offset-4"
                                >
                                    GUEST 체험 모드로 둘러보기
                                    <span className="block text-[10px] font-medium text-slate-300 mt-1">
                                        *(인기 검색어만 지원합니다)
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <PartnershipInquiryModal 
                isOpen={isInquiryOpen} 
                onClose={() => setIsInquiryOpen(false)} 
            />
        </div>
    )
}
