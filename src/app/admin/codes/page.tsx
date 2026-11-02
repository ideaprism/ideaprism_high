'use client'

import React, { useState, useEffect } from 'react'
import { 
    Key, 
    Search, 
    Plus, 
    Copy, 
    Check, 
    Archive,
    History,
    RefreshCw,
    Pencil
} from 'lucide-react'

import type { AdminCode } from '@/lib/admin-db'
import { codeIsUsable } from '@/lib/access-code-status'
import { DirectIssueModal } from '@/components/admin/DirectIssueModal'
import { getSchoolBySlug } from '@/config/schools'
type AccessCodeWithOrg = AdminCode

export default function CodesPage() {
    const [codes, setCodes] = useState<AccessCodeWithOrg[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
    const [editedCode, setEditedCode] = useState('')
    const [savingCode, setSavingCode] = useState(false)

    const [loadError, setLoadError] = useState('')
    const [notice, setNotice] = useState('')

    useEffect(() => {
        fetchCodes()
    }, [])

    const fetchCodes = async () => {
        setIsLoading(true)
        try {
            setLoadError('')
            const response = await fetch('/api/admin/codes')
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || '코드 조회에 실패했습니다.')
            setCodes(result.data as AccessCodeWithOrg[])
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : '코드 조회에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const updateCodeValue = async (id: string, activate = false) => {
        const normalizedCode = editedCode.trim().toUpperCase()
        if (!/^[A-Z0-9_-]{4,128}$/.test(normalizedCode)) {
            setLoadError('코드는 영문·숫자·_·- 4~128자로 입력해 주세요.')
            return
        }
        if (savingCode) return
        setSavingCode(true)
        setLoadError('')
        setNotice('')
        try {
            const res = await fetch('/api/admin/codes/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeId: id, newCode: normalizedCode, ...(activate ? { isActive: true } : {}) })
            })
            const result = await res.json()
            if (!res.ok || result.error) throw new Error(result.error || '코드 변경에 실패했습니다.')

            setNotice(result.loginAvailable
                ? '코드가 저장되었고 로그인할 수 있습니다. 다음 로그인부터 새 코드를 사용해 주세요.'
                : '코드는 저장되었지만 현재 로그인할 수 없는 계정입니다. 활성 상태·사용 기간·로그인 횟수를 확인해 주세요.')
            setEditingCodeId(null)
            await fetchCodes()
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : '코드 변경에 실패했습니다.')
        } finally { setSavingCode(false) }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const toggleCodeActive = async (id: string, currentStatus: boolean | null) => {
        try {
            const response = await fetch('/api/admin/codes/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codeId: id, isActive: !currentStatus }) })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || '상태 변경 실패')
            if (result.requiresRelogin) { window.location.assign('/admin-login'); return }
            setNotice(result.loginAvailable ? '계정이 활성화되었습니다. 저장된 코드로 로그인할 수 있습니다.' : '현재 이 계정으로 로그인할 수 없습니다.')
            fetchCodes()
        } catch (error) {
            console.error('Error toggling code status:', error)
            setLoadError('상태 변경에 실패했습니다.')
        }
    }

    const filteredCodes = codes.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.partner_organizations?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Key className="w-10 h-10 text-primary" />
                        발급된 코드 관리
                    </h1>
                    <p className="text-slate-500 font-bold text-lg">관리자·학교 코드를 4자 이상으로 직접 정할 수 있습니다. 본인 코드를 바꾸면 현재 화면의 로그인은 유지되고, 다른 로그인은 해제됩니다.</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    새 코드 직접 발급
                </button>
            </header>

            <DirectIssueModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchCodes()
                    setIsModalOpen(false)
                }}
            />

            {loadError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{loadError}</p>}
            {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">{notice}</p>}

            {/* Toolbar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="코드명 또는 기관명 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 focus:ring-4 focus:ring-primary/10 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                    <button 
                        onClick={fetchCodes}
                        className="p-3 hover:bg-slate-50 rounded-xl transition-colors"
                        title="새로고침"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-2" />
                    <span>Total: {codes.length} Codes</span>
                </div>
            </div>

            {/* Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-[40px] animate-pulse" />
                    ))
                ) : filteredCodes.map((item) => (
                    <div key={item.id} className={`bg-white p-8 rounded-[40px] border transition-all duration-300 relative group overflow-hidden ${codeIsUsable(item) ? 'border-slate-200 hover:shadow-2xl hover:-translate-y-1' : 'border-amber-300'}`}>
                        {/* Status Badge */}
                        <div className="absolute top-8 right-8 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${codeIsUsable(item) ? 'bg-emerald-400' : 'bg-amber-500'}`} />
                            <span className="text-xs font-bold text-slate-600">
                                {codeIsUsable(item) ? '로그인 가능' : '로그인 불가'}
                            </span>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="mb-8">
                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Partner Org</div>
                                <h3 className="text-xl font-black text-slate-900 line-clamp-1">{item.partner_organizations?.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">{item.partner_organizations?.school_id ? getSchoolBySlug(item.partner_organizations.school_id)?.name : '관리자'} · {item.label || '발급 계정'}</p>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 mb-8 relative group/code overflow-hidden border border-slate-100">
                                {!item.is_active && <p className="mb-4 rounded-lg bg-amber-100 p-3 text-sm font-semibold text-amber-900">비활성 계정입니다. 코드를 바꾸어도 활성화하기 전에는 로그인할 수 없습니다.</p>}
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Access Code
                                    {!editingCodeId && (
                                        <button 
                                            onClick={() => {
                                                setEditingCodeId(item.id)
                                                setEditedCode(item.code)
                                            }}
                                            type="button"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/20 bg-white text-primary hover:bg-primary/10 transition-colors text-xs font-bold tracking-normal"
                                            title="코드 수정"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> 코드 수정
                                        </button>
                                    )}
                                </div>
                                
                                {editingCodeId === item.id ? (
                                    <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                                        <input 
                                            type="text" 
                                            aria-label="새 기관 코드"
                                            minLength={4}
                                            maxLength={128}
                                            disabled={savingCode}
                                            value={editedCode}
                                            onChange={(e) => setEditedCode(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-2 bg-white border-2 border-primary rounded-xl font-black text-slate-900 outline-none tracking-widest"
                                            autoFocus
                                        />
                                        <p className="text-xs text-slate-500">영문·숫자·_·- 4자 이상. 예: ADMIN1, MIRAE</p>
                                        {!item.is_active && <button
                                            type="button"
                                            onClick={() => updateCodeValue(item.id, true)}
                                            disabled={savingCode}
                                            className="w-full rounded-lg bg-primary px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
                                        >{savingCode ? '저장 중…' : '저장하고 활성화'}</button>}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => updateCodeValue(item.id)}
                                                disabled={savingCode}
                                                className="flex-1 py-2 bg-primary text-white text-[10px] font-black rounded-lg hover:bg-primary/90 transition-all"
                                            >
                                                {savingCode ? '저장 중…' : item.is_active ? '저장' : '코드만 저장'}
                                            </button>
                                            <button 
                                                onClick={() => setEditingCodeId(null)}
                                                disabled={savingCode}
                                                className="flex-1 py-2 bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-300 transition-all"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="min-w-0 break-all text-base md:text-xl font-black text-slate-900 tracking-wider">{item.code}</span>
                                        <button 
                                            onClick={() => copyToClipboard(item.code, item.id)}
                                            aria-label="코드 복사"
                                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-primary border border-transparent hover:border-slate-100"
                                        >
                                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/10 transition-all group-hover/code:bg-primary/30" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Usage</div>
                                    <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        {item.usage_count}
                                        <History className="w-3.5 h-3.5 text-slate-300" />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Limit</div>
                                    <div className="text-lg font-black text-slate-900">
                                        {item.max_usage ?? 'Unlimited'}
                                    </div>
                                </div>
                            </div>


                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                                <button 
                                    onClick={() => toggleCodeActive(item.id, item.is_active)}
                                    className={`flex items-center gap-2 text-xs font-black transition-colors ${item.is_active ? 'text-slate-400 hover:text-red-500' : 'text-primary hover:text-primary/80'}`}
                                >
                                    {item.is_active ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                    {item.is_active ? '로그인 중지' : '계정 활성화'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
