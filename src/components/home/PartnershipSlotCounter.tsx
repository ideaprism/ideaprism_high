'use client'

import { motion } from 'framer-motion'
import { Users, Clock, AlertCircle } from 'lucide-react'

interface PartnershipSlotCounterProps {
    current: number
    total: number
}

export function PartnershipSlotCounter({ current, total }: PartnershipSlotCounterProps) {
    const percentage = (current / total) * 100

    return (
        <div className="w-full max-w-xl mx-auto bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-primary/20 shadow-2xl overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-on-surface">2026 상반기 파트너십 현황</h4>
                    </div>
                    <div className="px-4 py-1.5 bg-red-50 rounded-full border border-red-100 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-black text-red-600 uppercase tracking-tighter">Closing Soon</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-primary">{current}</span>
                            <span className="text-xl font-bold text-on-surface-variant">/ {total}</span>
                            <span className="ml-2 text-sm font-bold text-on-surface-variant">Slots Left</span>
                        </div>
                        <span className="text-sm font-bold text-primary italic">Only selected institutions</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - percentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-600 rounded-full shadow-lg"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                            <Users className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Capacity</div>
                            <div className="text-sm font-black text-on-surface">{total} Groups</div>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="text-xs font-bold text-primary uppercase tracking-tighter mb-1">Status</div>
                            <div className="text-sm font-black text-primary">High Demand</div>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Region</div>
                            <div className="text-sm font-black text-on-surface">Nationwide</div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-xs text-on-surface-variant/60 leading-relaxed text-center font-medium">
                    * 파트너십 체결 시 해당 기관 소속 학생들에게 모든 프리미엄 기능이 무제한으로 개방됩니다.
                </p>
            </div>
        </div>
    )
}
