'use client'

import { Server, RefreshCw } from 'lucide-react'

interface DbWarmingBannerProps {
    retryCount: number
}

export function DbWarmingBanner({ retryCount }: DbWarmingBannerProps) {
    return (
        <div className="w-full mb-6 border border-slate-200 bg-slate-50/80 rounded-xl p-4 shadow-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {/* Simple pulsing icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                        <Server className="w-5 h-5 text-slate-400" />
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white animate-spin" style={{ animationDuration: '2s' }}>
                            <RefreshCw className="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Text + Status */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900">
                            시스템 엔진 구동 중...
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            Retry Attempt {retryCount}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">
                        데이터베이스가 절전 모드에서 깨어나고 있습니다. 잠시만 기다려 주세요.
                    </p>

                    {/* Simple Loading Bar */}
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 w-1/3 rounded-full animate-infinite-loading" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes infinite-loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                .animate-infinite-loading {
                    animation: infinite-loading 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
