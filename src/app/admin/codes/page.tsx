'use client'

import React, { useState, useEffect } from 'react'
import { 
    Key, 
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal, 
    ExternalLink, 
    Copy, 
    Check, 
    AlertCircle,
    Archive,
    History,
    RefreshCw,
    TrendingUp
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { DirectIssueModal } from '@/components/admin/DirectIssueModal'

type AccessCodeWithOrg = Database['public']['Tables']['access_codes']['Row'] & {
    partner_organizations: {
        name: string
    } | null
}

export default function CodesPage() {
    const [codes, setCodes] = useState<AccessCodeWithOrg[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
    const [editedCode, setEditedCode] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchCodes()
    }, [])

    const fetchCodes = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('access_codes')
                .select('*, partner_organizations(name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCodes(data as AccessCodeWithOrg[])
        } catch (error) {
            console.error('Error fetching codes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateCodeValue = async (id: string) => {
        if (!editedCode || editedCode.length < 4) {
            alert('코드는 최소 4자 이상이어야 합니다.')
            return
        }

        try {
            const res = await fetch('/api/admin/codes/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeId: id, newCode: editedCode.toUpperCase() })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            alert('액세스 코드가 변경되었습니다.')
            setEditingCodeId(null)
            fetchCodes()
        } catch (error: any) {
            alert(error.message || '코드 변경에 실패했습니다.')
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const toggleCodeActive = async (id: string, currentStatus: boolean | null) => {
        try {
            const { error } = await supabase
                .from('access_codes')
                .update({ is_active: !currentStatus })
                .eq('id', id)
            
            if (error) throw error
            fetchCodes()
        } catch (error) {
            console.error('Error toggling code status:', error)
            alert('상태 변경에 실패했습니다.')
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
                    <p className="text-slate-500 font-bold text-lg">기관별 액세스 코드 현황 및 사용량을 모니터링합니다.</p>
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
                    <div key={item.id} className={`bg-white p-8 rounded-[40px] border transition-all duration-300 relative group overflow-hidden ${item.is_active ? 'border-slate-200 hover:shadow-2xl hover:-translate-y-1' : 'border-slate-100 opacity-60 grayscale'}`}>
                        {/* Status Badge */}
                        <div className="absolute top-8 right-8 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="mb-8">
                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Partner Org</div>
                                <h3 className="text-xl font-black text-slate-900 line-clamp-1">{item.partner_organizations?.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">{item.label || '공식 액세스 코드'}</p>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 mb-8 relative group/code overflow-hidden border border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Access Code
                                    {!editingCodeId && (
                                        <button 
                                            onClick={() => {
                                                setEditingCodeId(item.id)
                                                setEditedCode(item.code)
                                            }}
                                            className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-all opacity-0 group-hover:opacity-100"
                                            title="코드 수정"
                                        >
                                            <TrendingUp className="w-3.5 h-3.5 rotate-90" /> {/* Edit Icon Replacement */}
                                        </button>
                                    )}
                                </div>
                                
                                {editingCodeId === item.id ? (
                                    <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                                        <input 
                                            type="text" 
                                            value={editedCode}
                                            onChange={(e) => setEditedCode(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-2 bg-white border-2 border-primary rounded-xl font-black text-slate-900 outline-none tracking-widest"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => updateCodeValue(item.id)}
                                                className="flex-1 py-2 bg-primary text-white text-[10px] font-black rounded-lg hover:bg-primary/90 transition-all"
                                            >
                                                저장
                                            </button>
                                            <button 
                                                onClick={() => setEditingCodeId(null)}
                                                className="flex-1 py-2 bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg hover:bg-slate-300 transition-all"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black text-slate-900 tracking-[0.2em]">{item.code}</span>
                                        <button 
                                            onClick={() => copyToClipboard(item.code, item.id)}
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
                                        {item.max_usage || 'Unlimited'}
                                    </div>
                                </div>
                            </div>


                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                                <button 
                                    onClick={() => toggleCodeActive(item.id, item.is_active)}
                                    className={`flex items-center gap-2 text-xs font-black transition-colors ${item.is_active ? 'text-slate-400 hover:text-red-500' : 'text-primary hover:text-primary/80'}`}
                                >
                                    {item.is_active ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                    {item.is_active ? 'Deactivate Code' : 'Reactive Code'}
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
