'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, School, User, Mail, Phone, MessageSquare, CheckCircle2, ChevronDown, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PartnershipInquiryModalProps {
    isOpen: boolean
    onClose: () => void
}

export function PartnershipInquiryModal({ isOpen, onClose }: PartnershipInquiryModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        orgName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        orgType: '',
        orgTypeEtc: '',
        purpose: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/partnership/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setIsSubmitted(true)
            } else {
                const msg = result.error || '신청 처리 중 오류가 발생했습니다.'
                alert(`오류: ${msg}`)
            }
        } catch (error) {
            console.error('Inquiry error:', error)
            alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-[700px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        {!isSubmitted ? (
                            <div className="relative">
                                {/* Header */}
                                <div className="p-8 bg-gradient-to-r from-primary to-blue-600 text-white relative">
                                    <button 
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest">
                                        Partnership Application
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight mb-2">IDEAPRISM과 함께하세요</h2>
                                    <p className="text-white/80 font-medium">우리 교육기관을 위한 차세대 창의 발명 솔루션을 도입하세요.</p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-10 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                                                <School className="w-3.5 h-3.5" /> 기관명
                                            </label>
                                            <input
                                                required
                                                placeholder="예: 서울과학고등학교"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                                                value={formData.orgName}
                                                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                                                <Briefcase className="w-3.5 h-3.5" /> 기관 유형
                                            </label>
                                            <input
                                                required
                                                placeholder="예: 발명학원, OO 중학교"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                                                value={formData.orgType}
                                                onChange={e => setFormData({ ...formData, orgType: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" /> 담당자명
                                            </label>
                                            <input
                                                required
                                                placeholder="신청자 성함"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                                                value={formData.contactName}
                                                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" /> 연락처 (이메일/전화번호)
                                            </label>
                                            <div className="space-y-2">
                                                <input
                                                    required
                                                    placeholder="연락받으실 정보를 입력해주세요"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                                                    value={formData.contactEmail}
                                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                                />
                                                <div className="px-1 text-[11px] text-slate-400 font-medium leading-relaxed">
                                                    예: example@email.com<br />
                                                    예: 010-0000-0000
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5" /> 도입 목적 및 문의 사항
                                        </label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="학생 발명 교육용, 대회 준비용 등"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm resize-none text-slate-900"
                                            value={formData.purpose}
                                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 rounded-2xl bg-primary text-white text-base font-black shadow-lg hover:shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mt-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '신청 정보 전송 중...' : (
                                            <>
                                                시범서비스 이용 신청
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-10">
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-4xl font-black text-on-surface tracking-tight">신청이 접수되었습니다!</h2>
                                <p className="text-lg text-on-surface-variant font-medium max-w-md mx-auto leading-relaxed">
                                    남겨주신 메일로 24시간 이내에 도입 안내서와 파트너 전용 계정 생성 절차를 보내드리겠습니다.
                                </p>
                                <Button
                                    onClick={onClose}
                                    variant="outlined"
                                    className="px-10 h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
                                >
                                    메인으로 돌아가기
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
