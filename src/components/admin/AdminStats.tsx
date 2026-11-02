'use client'

import React, { useMemo } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    isPositive?: boolean
}

const StatCard = ({ title, value, change, isPositive }: StatCardProps) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</div>
        <div className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{value}</div>
        {change && (
            <div className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? '↑' : '↓'} {change}
            </div>
        )}
    </div>
)

export default function AdminStats() {
    // 임시 트래픽 데이터 (최근 7일)
    const trafficData = [
        { name: '03.22', searches: 450, auth: 380 },
        { name: '03.23', searches: 520, auth: 410 },
        { name: '03.24', searches: 480, auth: 390 },
        { name: '03.25', searches: 610, auth: 520 },
        { name: '03.26', searches: 580, auth: 480 },
        { name: '03.27', searches: 890, auth: 720 },
        { name: '03.28', searches: 1240, auth: 1020 },
    ]

    // 임시 인기 키워드 데이터
    const keywordData = [
        { name: '우산', value: 245 },
        { name: '친환경', value: 180 },
        { name: '스마트', value: 156 },
        { name: '자동화', value: 120 },
        { name: '미세먼지', value: 98 },
    ]

    // 임시 기관별 사용량 데이터
    const orgUsageData = [
        { name: '서울과학고', value: 450 },
        { name: '경기영재고', value: 320 },
        { name: '한국영재고', value: 280 },
        { name: '대전과학고', value: 190 },
    ]

    const COLORS = ['#0066FF', '#6366F1', '#4F5D75', '#94A3B8']

    return (
        <div className="space-y-10">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Searches" value="4,775" change="24% from last week" isPositive={true} />
                <StatCard title="Auth Success Rate" value="84.2%" change="2.1% from last week" isPositive={true} />
                <StatCard title="Active Partners" value="12" change="1 new today" isPositive={true} />
                <StatCard title="Avg. Search/User" value="8.4" change="0.5 from last week" isPositive={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                        실시간 검색 트래픽 추이
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0F172A', 
                                        border: 'none', 
                                        borderRadius: '16px',
                                        color: '#F8FAFC',
                                        fontWeight: 800
                                    }}
                                    itemStyle={{ color: '#F8FAFC' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="searches" 
                                    stroke="#0066FF" 
                                    strokeWidth={4} 
                                    dot={{ fill: '#0066FF', strokeWidth: 2, r: 6, stroke: '#FFFFFF' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="auth" 
                                    stroke="#CBD5E1" 
                                    strokeWidth={2} 
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popular Keywords Bar */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-8">인기 키워드 TOP 5</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={keywordData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 800 }}
                                    width={70}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none' }}
                                />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                    {keywordData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0066FF' : '#E2E8F0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Institution Usage */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-10">
                    <div className="w-1/2">
                        <h3 className="text-xl font-black text-slate-900 mb-4">기관별 점유율</h3>
                        <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed">
                            활성 파트너 기관 중 검색량이 가장 많은 상위 4개 도메인입니다.
                        </p>
                        <div className="space-y-3">
                            {orgUsageData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm font-black text-slate-700">{item.name}</span>
                                    <span className="text-xs text-slate-400 font-bold ml-auto">{((item.value / 1240) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-1/2 h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orgUsageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {orgUsageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Automation Promo / Tip */}
                <div className="bg-gradient-to-br from-primary to-blue-700 p-10 rounded-[40px] text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 relative z-10 italic">Smart Operational Insights</h3>
                    <p className="font-bold text-white/80 leading-relaxed mb-8 relative z-10">
                        현재 검색량이 평소보다 40% 증가했습니다. <br />
                        상위 키워드 '친환경' 관련 신규 DB 패치가 필요할 수 있습니다.
                    </p>
                    <button className="self-start px-6 py-3 bg-white text-primary rounded-2xl font-black text-sm hover:scale-105 transition-all relative z-10">
                         상세 분석 보고서 생성
                    </button>
                </div>
            </div>
        </div>
    )
}
