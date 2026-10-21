'use client'

import React from 'react'
import { 
    Users, 
    Key, 
    MessageSquare, 
    TrendingUp, 
    ChevronRight,
    ArrowUpRight,
    ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

import AdminStats from '@/components/admin/AdminStats'
import { Database } from '@/types/supabase'

type Inquiry = Database['public']['Tables']['partnership_inquiries']['Row']

function RecentInquiries() {
    const [inquiries, setInquiries] = React.useState<Inquiry[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/admin/inquiries')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setInquiries(data.data.slice(0, 3))
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-3xl" />
            ))}
        </div>
    }

    if (inquiries.length === 0) {
        return <div className="text-center py-10 text-slate-400 font-bold">최근 접수된 문의가 없습니다.</div>
    }

    return (
        <div className="space-y-6">
            {inquiries.map((inquiry: any) => (
                <Link key={inquiry.id} href="/admin/codes" className="block group p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-slate-900">{inquiry.partner_organizations?.name || '알 수 없는 기관'}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                            !inquiry.is_active ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            {!inquiry.is_active ? '승인 대기중' : '활성됨'}
                        </span>
                    </div>
                    <div className="text-xs font-bold text-slate-500 mb-4 truncate">
                        {inquiry.label || "상세 정보 없음"}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(inquiry.created_at || '').toLocaleDateString()}
                        </span>
                        <div className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            기록 확인 <ArrowUpRight className="w-3 h-3 inline" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}

export default function AdminDashboard() {
    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Overview</h1>
                <p className="text-slate-500 font-bold text-lg">IDEAPRISM B2B 플랫폼 운영 현황입니다.</p>
            </header>

            {/* Visual Stats Section */}
            <AdminStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
                {/* Recent Inquiries Shortcut */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            최근 파트너십 문의
                        </h2>
                        <Link href="/admin/inquiries" className="text-sm font-black text-primary hover:gap-2 transition-all flex items-center gap-1 group">
                            전체보기 <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
                        </Link>
                    </div>
                    
                    <RecentInquiries />
                </div>

                {/* System Status / Quick Actions */}
                <div className="bg-slate-900 p-10 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-10 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            시스템 상태
                        </h2>
                        
                        <div className="space-y-10">
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 animate-pulse" />
                                <div>
                                    <div className="text-lg font-black text-white">Database Cluster</div>
                                    <p className="text-slate-400 text-sm font-medium">Supabase PostgreSQL Region: Seoul - Healthy</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 animate-pulse" />
                                <div>
                                    <div className="text-lg font-black text-white">Verification Engine</div>
                                    <p className="text-slate-400 text-sm font-medium">Auto-generation for Access Codes: Ready</p>
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/10 grid grid-cols-2 gap-4">
                                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-sm transition-all">
                                    인덱싱 수동 갱신
                                </button>
                                <button className="p-4 bg-primary hover:bg-primary/90 rounded-2xl text-white font-black text-sm transition-all">
                                    마스터 코드 변경
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
