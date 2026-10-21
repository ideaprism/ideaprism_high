import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ImageIcon, Lock } from 'lucide-react'

export interface Invention {
    id: string
    original_title: string
    simple_title: string | null
    drawing_url: string | null
    grades?: { name: string } | null
    categories?: { name: string } | null
    ipc?: string | null
    curriculum?: string | null
    sdg?: string | null
    simple_summary?: string | null
    invention_motive?: string | null
    detailed_summary?: string | null
    problem?: string | null
    solution?: string | null
    next_step?: string | null
    problem_tag?: string | null
    scamper?: string | null
    isRestricted?: boolean // B2B Visual Locking
}

interface InventionCardProps {
    invention: Invention
    onClick?: () => void
}

export function InventionCard({ invention, onClick }: InventionCardProps) {
    const CardContent = (
        <Card className={`h-full flex flex-col overflow-hidden transition-all duration-300 group ${invention.isRestricted ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:shadow-lg hover:border-primary/30'}`}>
            {/* Image Area */}
            <div className="relative aspect-[4/3] bg-surface-container-low flex items-center justify-center overflow-hidden">
                {invention.drawing_url ? (
                    <img
                        src={invention.drawing_url}
                        alt={invention.original_title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${invention.isRestricted ? 'blur-md grayscale opacity-60' : 'group-hover:scale-105'}`}
                        loading="lazy"
                    />
                ) : (
                    <ImageIcon className={`w-12 h-12 text-on-surface-variant/20 ${invention.isRestricted ? 'blur-sm opacity-50' : ''}`} />
                )}
                
                {/* B2B Visual Lock Overlay */}
                {invention.isRestricted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
                        <div className="bg-slate-900/80 text-white rounded-full p-2 backdrop-blur-sm shadow-xl mb-1">
                            <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Partners Only</span>
                    </div>
                )}
            </div>

            {/* Title Area */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className={`font-bold text-base text-on-surface line-clamp-2 leading-snug transition-colors ${invention.isRestricted ? 'blur-[4px] select-none text-slate-400' : 'group-hover:text-primary'}`}>
                    {invention.simple_title || invention.original_title}
                </h3>
                
                {/* Summary (Original Minimalist) */}
                <p className={`mt-2 text-xs text-on-surface-variant line-clamp-2 leading-relaxed ${invention.isRestricted ? 'blur-[4px] select-none text-slate-400' : ''}`}>
                    {invention.simple_summary || invention.detailed_summary || invention.invention_motive || "발명 설명을 불러오는 중입니다."}
                </p>

                <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-outline font-black uppercase tracking-widest">
                        {invention.categories?.name || "기타"}
                    </span>
                    <span className="text-[10px] font-black text-primary group-hover:underline">
                        자세히 보기 →
                    </span>
                </div>
            </div>
        </Card>
    )

    if (onClick) {
        return (
            <div onClick={invention.isRestricted ? undefined : onClick} role="button" tabIndex={0} className="h-full">
                {CardContent}
            </div>
        )
    }

    if (invention.isRestricted) {
        return <div className="h-full">{CardContent}</div>
    }

    return (
        <Link href={`/inventions/${invention.id}`} className="h-full">
            {CardContent}
        </Link>
    )
}
