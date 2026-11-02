'use client'

import React, { useState, useEffect } from 'react'
import { 
    Search, 
    BarChart3, 
    TrendingUp, 
    ArrowUpRight, 
    History, 
    Calendar,
    Globe,
    Zap,
    Download
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ReentLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            // Note: search_attempt_logs 테이블 데이터 조회
            const { data, error } = await supabase
                .from('search_attempt_logs' as any)
                .select('*, partner_organizations(name)')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(data || [])
        } catch (error: any) {
            console.warn('Logs table missing or fetch failed. Showing mock data.', error.message)
            // Mock data fallback to prevent crash while table is not created
            setLogs([
                { id: '1', keyword: '친환경', created_at: new Date().toISOString(), access_code: 'PRISM-SEOUL1', partner_organizations: { name: '서울과학고' } },
                { id: '2', keyword: '자동화', created_at: new Date(Date.now() - 3600000).toISOString(), access_code: 'PRISM-GY-X', partner_organizations: { name: '경기영재고' } },
                { id: '3', keyword: '우산', created_at: new Date(Date.now() - 7200000).toISOString(), access_code: 'PRISM-KOREA1', partner_organizations: { name: '한국영재고' } },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <BarChart3 className="w-10 h-10 text-primary" />
                        통계 및 검색 로그
                    </h1>
                    <p className="text-slate-500 font-bold text-lg">사용자들의 실시간 검색 트래픽과 통계를 분석합니다.</p>
                </div>
                
                <button className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    CSV 내보내기
                </button>
            </header>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Today Traffic
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-1">1,240</div>
                    <div className="text-xs text-emerald-500 font-bold">+12.5% from yesterday</div>
                </div>
                
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                     <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Top Keyword
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-1">우산</div>
                    <div className="text-xs text-slate-400 font-bold">245 Total Hits</div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                     <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3 h-3 text-emerald-500" />
                        Auth Rate
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-1">82.4%</div>
                    <div className="text-xs text-slate-400 font-bold">Partner Access Ratio</div>
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                    <History className="w-5 h-5 text-slate-400" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">실시간 검색 로그 (최근 50건)</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Keyword</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Institution / Access</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-6 h-16 bg-slate-50/30"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">로그 데이터가 아직 없습니다.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-6 font-black text-slate-900">
                                            {log.keyword}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {log.partner_organizations?.name || 'GUEST'}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {log.access_code || 'Trial Mode'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button className="p-2 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                <ArrowUpRight className="w-4 h-4 text-primary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
