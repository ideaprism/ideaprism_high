'use client'

import React, { useState, useEffect } from 'react'
import { X, Key, Building2, User, Phone, Mail, Hash, Check, Loader2, AlertCircle } from 'lucide-react'

interface DirectIssueModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function DirectIssueModal({ isOpen, onClose, onSuccess }: DirectIssueModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        orgName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        customCode: '',
        notes: ''
    })
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // 새 직발급 API 호출 (문의 내역 생성 없이 바로 파트너/코드 생성)
            const res = await fetch('/api/admin/codes/direct-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    orgName: formData.orgName,
                    contactName: formData.contactName,
                    contactEmail: formData.contactEmail,
                    contactPhone: formData.contactPhone,
                    customCode: formData.customCode
                })
            })
            
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            alert(`코드 직접 발급 완료!\n발급된 코드: ${result.data.code.code}`)
            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Direct issue failed:', err)
            setError(err.message || '코드 발급 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Key className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">새 코드 직접 발급</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Direct Code Issuance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-6 rounded-[28px] border border-red-100 space-y-3">
                            <div className="flex items-center gap-3 text-sm font-black">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>발급 중 오류가 발생했습니다.</span>
                            </div>
                            <div className="text-[10px] font-mono bg-white/50 p-3 rounded-xl border border-red-50 break-all leading-relaxed opacity-80">
                                {error}
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                >
                                    데이터베이스 캐시 강제 새로고침
                                </button>
                                <p className="text-[10px] text-red-400 mt-2 font-bold text-center">
                                    * 최근 DB 변경 사항이 반영되지 않았을 때 발생하는 일시적 현상일 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <input 
                                required
                                type="text" 
                                placeholder="기관명 (학교/기관/기업명)" 
                                value={formData.orgName}
                                onChange={e => setFormData({...formData, orgName: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="담당자 성함" 
                                    value={formData.contactName}
                                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                                />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <input 
                                    required
                                    type="tel" 
                                    placeholder="연락처" 
                                    value={formData.contactPhone}
                                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <input 
                                required
                                type="email" 
                                placeholder="이메일 주소" 
                                value={formData.contactEmail}
                                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>

                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                                <Key className="w-4 h-4" />
                                Custom Access Code (Optional)
                            </div>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="직접 지정할 코드 (예: PRISM-GUEST)" 
                                    value={formData.customCode}
                                    onChange={e => setFormData({...formData, customCode: e.target.value.toUpperCase()})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl font-black text-slate-900 outline-none transition-all placeholder:text-slate-300 tracking-widest"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold px-1 italic">
                                * 미입력 시 'PRISM-XXXX' 형식으로 자동 생성됩니다.
                            </p>
                        </div>


                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                        >
                            취소
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    발급 중...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    코드 즉시 발급
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
