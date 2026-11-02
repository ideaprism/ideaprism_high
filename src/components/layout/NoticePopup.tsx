'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, ChevronRight, Lock, Building2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PartnershipInquiryModal } from '@/components/auth/PartnershipInquiryModal'

export default function NoticePopup() {
    const [isVisible, setIsVisible] = useState(false)
    const [isInquiryOpen, setIsInquiryOpen] = useState(false)

    useEffect(() => {
        const hasSeenPopup = localStorage.getItem('hidePartnershipNotice')
        if (!hasSeenPopup) {
            const timer = setTimeout(() => setIsVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        localStorage.setItem('hidePartnershipNotice', 'true')
    }

    const handleInquiry = () => {
        setIsInquiryOpen(true)
    }

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="fixed bottom-8 right-8 z-[2000] w-full max-w-sm"
                    >
                        <div className="relative overflow-hidden bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 group">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                            
                            {/* Content */}
                            <div className="p-8">
                                <button 
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Megaphone className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Notice</span>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mt-0.5">B2B/B2G 파트너십 오픈</h3>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        IDEA PRISM이 교육기관 및 공공기관을 위한 <span className="text-primary font-bold">전용 솔루션</span>으로 새롭게 도약합니다.
                                    </p>
                                    
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            파트너 전용 14,000건 특허 DB 접근
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Building2 className="w-3 h-3 text-blue-500" />
                                            기관 맞춤형 창의 교육 관리 시스템
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <Button
                                        onClick={handleInquiry}
                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        파트너십 도입 문의
                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                    
                                    <button 
                                        onClick={() => {
                                            const chatInput = document.querySelector('textarea');
                                            if(chatInput) chatInput.placeholder = "도입 인증 코드를 입력해주세요.";
                                            handleClose();
                                        }}
                                        className="w-full h-12 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Lock className="w-3 h-3" />
                                        이미 인증 코드가 있으신가요?
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Progress Bar (Subtle) */}
                            <div className="h-1.5 w-full bg-slate-50 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary/20"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PartnershipInquiryModal 
                isOpen={isInquiryOpen} 
                onClose={() => setIsInquiryOpen(false)} 
            />
        </>
    )
}
