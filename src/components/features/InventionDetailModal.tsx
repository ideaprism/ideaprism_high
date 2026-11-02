'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, ExternalLink, ImageIcon, BadgeCheck, ChevronDown, ChevronUp, LucideIcon, Search, Loader2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { createPortal } from 'react-dom'
import { Invention } from './InventionCard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
    getProblemColorClass,
    getScamperColorClass,
    getCategoryColorClass,
    getCategoryIcon,
    getSDGIconUrl,
    getProblemIcon,
    getScamperIcon,
    getScamperLabel,
    isValidProblemTag
} from '@/utils/tag-styles'
import { PatentSearchView, InventionThumbnail } from '@/components/patent/PatentSearchView'

interface InventionDetailModalProps {
    invention: Invention
    onClose: () => void
}

interface ExpandableSectionProps {
    title: string
    content: string | null | undefined
    defaultOpen?: boolean
}

// Helper to get Icon Component
const getIconComponent = (iconName: string): LucideIcon | null => {
    const pascalCase = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

    return (LucideIcons as unknown as Record<string, LucideIcon>)[pascalCase] || null
}

function ExpandableSection({ title, content, defaultOpen = false }: ExpandableSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    if (!content) return null

    const lines = content.split('//').map(line => line.trim()).filter(line => line.length > 0)

    return (
        <div className="border border-outline-variant/30 rounded-lg overflow-hidden group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-highest transition-colors text-left"
            >
                <h3 className="text-sm font-bold text-primary">{title}</h3>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-on-surface-variant transition-transform" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-on-surface-variant transition-transform" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 bg-surface text-sm text-on-surface border-t border-outline-variant/30 animate-in slide-in-from-top-1 duration-200">
                    <ul className="space-y-2">
                        {lines.map((line, index) => (
                            <li key={index} className="flex gap-2.5 items-start">
                                <span className="mt-2 w-1 min-w-[4px] h-1 rounded-full bg-primary flex-shrink-0" />
                                <span className="leading-relaxed text-on-surface/90">{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

/** 상세 모달을 열 때 따로 불러오는 본문 필드 */
type InventionDetailFields = Pick<
    Invention,
    'invention_motive' | 'detailed_summary' | 'problem' | 'solution' | 'next_step' | 'curriculum' | 'sdg' | 'student_name' | 'school_name' | 'grade_year' | 'keyword' | 'search_terms' | 'ipc_secondary' | 'competition_name' | 'round' | 'award_year' | 'award' | 'award_detail'
>

export function InventionDetailModal({ invention: baseInvention, onClose }: InventionDetailModalProps) {
    // 목록 API는 카드 필드만 보내므로, 본문은 모달을 열 때 단건 조회해 합친다
    const [detail, setDetail] = useState<InventionDetailFields | null>(null)
    const [detailState, setDetailState] = useState<'loading' | 'done' | 'error'>('loading')

    useEffect(() => {
        const controller = new AbortController()
        setDetail(null)
        setDetailState('loading')
        fetch(`/api/inventions/${encodeURIComponent(baseInvention.id)}`, { signal: controller.signal })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((data: InventionDetailFields) => {
                setDetail(data)
                setDetailState('done')
            })
            .catch((err) => {
                if (err?.name === 'AbortError') return
                console.error('[InventionDetailModal] detail load failed:', err)
                setDetailState('error')
            })
        return () => controller.abort()
    }, [baseInvention.id])

    const invention = useMemo<Invention>(
        () => (detail ? { ...baseInvention, ...detail } : baseInvention),
        [baseInvention, detail]
    )
    const detailLoading = detailState === 'loading'

    const [activeTab, setActiveTab] = useState<'basic' | 'detail'>('basic')
    const [viewMode, setViewMode] = useState<'invention' | 'patent'>('invention')
    const [isTransitioning, setIsTransitioning] = useState(false)

    const handlePatentSearch = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode('patent')
            setIsTransitioning(false)
        }, 300)
    }

    const handleBackToInvention = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode('invention')
            setIsTransitioning(false)
        }, 300)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className={cn(
                "bg-surface rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 transition-all",
                viewMode === 'patent'
                    ? 'w-full h-[95vh] max-w-7xl'
                    : 'w-full h-[85vh] max-w-5xl'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface flex-shrink-0">
                    {viewMode === 'patent' ? (
                        <div className="flex items-center gap-4 flex-1">
                            {/* 발명 정보 썸네일 */}
                            <InventionThumbnail
                                invention={invention}
                                onClick={handleBackToInvention}
                            />

                            {/* 구분선 */}
                            <div className="h-10 w-px bg-outline-variant/30" />

                            {/* 특허 검색 제목 */}
                            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                특허 검색
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold text-on-surface">
                            {invention.simple_title || invention.original_title}
                        </h2>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-highest transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className={cn(
                    "flex-1 overflow-hidden transition-opacity duration-300",
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                )}>
                    {viewMode === 'invention' ? (
                        /* 발명 상세 뷰 */
                        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                            {/* Left: Image Section */}
                            {/* 이미지는 최대 400×300px까지만 커지고, 좁은 화면(세로 배치)에서는 화면 높이의 30%로 줄여 아래 정보가 보이게 함 */}
                            <div className="w-full lg:w-[45%] flex-shrink-0 bg-surface-container-low p-4 lg:p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-outline-variant/20">
                                <div className="relative w-full max-w-[400px] aspect-[4/3] max-h-[30vh] lg:max-h-[300px] bg-surface rounded-lg shadow-sm border border-outline-variant/30 flex items-center justify-center overflow-hidden">
                                    {invention.drawing_url ? (
                                        <img
                                            src={invention.drawing_url}
                                            alt={invention.original_title}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">
                                            <ImageIcon className="w-16 h-16" />
                                            <span className="text-sm">이미지가 없습니다</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Info Section */}
                            <div className="w-full lg:w-[55%] flex flex-col bg-surface flex-1 min-h-0 lg:h-full overflow-hidden">
                                {/* Tabs */}
                                <div className="flex border-b border-outline-variant/20 px-8 pt-4">
                                    <button
                                        onClick={() => setActiveTab('basic')}
                                        className={cn(
                                            "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                                            activeTab === 'basic'
                                                ? "border-primary text-primary"
                                                : "border-transparent text-on-surface-variant hover:text-on-surface"
                                        )}
                                    >
                                        기본 정보
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('detail')}
                                        className={cn(
                                            "px-6 py-3 text-sm font-semibold border-b-2 transition-colors",
                                            activeTab === 'detail'
                                                ? "border-primary text-primary"
                                                : "border-transparent text-on-surface-variant hover:text-on-surface"
                                        )}
                                    >
                                        상세 설명
                                    </button>
                                </div>

                                {/* Tab Content Area */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    {activeTab === 'basic' ? (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            {/* Info List */}
                                            <table className="w-full text-sm text-left">
                                                <tbody className="align-top">
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">대회명</th>
                                                        <td className="py-3 pl-4">{detailLoading ? '불러오는 중…' : invention.competition_name ? `${invention.round ? `제${invention.round}회 ` : ''}${invention.competition_name}` : '-'}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">연도</th>
                                                        <td className="py-3 pl-4">{invention.award_year ? `${invention.award_year}년` : detailLoading ? '불러오는 중…' : '-'}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">상격</th>
                                                        <td className="py-3 pl-4">{detailLoading ? '불러오는 중…' : <>
                                                            <span>{invention.award || invention.award_detail || '-'}</span>
                                                            {invention.award && invention.award_detail && invention.award !== invention.award_detail && <span className="mt-1 block text-xs text-on-surface-variant">{invention.award_detail}</span>}
                                                        </>}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">학생명</th>
                                                        <td className="py-3 pl-4">{detailLoading ? '불러오는 중…' : invention.student_name || '-'}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">수상 당시</th>
                                                        <td className="py-3 pl-4">{invention.school_name || '-'} · {invention.grade_year || '-'}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">원본 제목</th>
                                                        <td className="py-3 pl-4 text-on-surface font-medium">{invention.original_title}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">학년 구분</th>
                                                        <td className="py-3 pl-4 text-on-surface">{invention.grades?.name || '-'}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">분야</th>
                                                        <td className="py-3 pl-4 text-on-surface">
                                                            {invention.categories ? (
                                                                <span className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 w-fit", getCategoryColorClass(invention.categories.name))}>
                                                                    {(() => {
                                                                        const Icon = getIconComponent(getCategoryIcon(invention.categories.name))
                                                                        return Icon ? <Icon className="w-3.5 h-3.5" /> : null
                                                                    })()}
                                                                    {invention.categories.name}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">관련교과</th>
                                                        <td className="py-3 pl-4 text-on-surface">{invention.curriculum || (detailLoading ? '…' : '-')}</td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24">ESG 과제</th>
                                                        <td className="py-3 pl-4 text-on-surface">
                                                            {invention.sdg ? (
                                                                <div className="flex items-center gap-2">
                                                                    {(() => {
                                                                        const num = parseInt(invention.sdg || '0')
                                                                        const url = getSDGIconUrl(num)
                                                                        return url ? <img src={url} alt={invention.sdg} className="w-5 h-5 rounded-sm" /> : null
                                                                    })()}
                                                                    <span>{invention.sdg}</span>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-dashed border-outline-variant/30">
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24 pt-4">문제유형</th>
                                                        <td className="py-3 pl-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                {invention.problem_tag ? (
                                                                    invention.problem_tag
                                                                        .split(',')
                                                                        .map(t => t.trim())
                                                                        .filter(tagName => isValidProblemTag(tagName))
                                                                        .map((tagName, i) => {
                                                                            const Icon = getIconComponent(getProblemIcon(tagName))
                                                                            return (
                                                                                <span key={i} className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", getProblemColorClass(tagName))}>
                                                                                    {Icon && <Icon className="w-3.5 h-3.5" />}
                                                                                    {tagName}
                                                                                </span>
                                                                            )
                                                                        })
                                                                ) : <span className="text-on-surface">-</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th className="py-3 font-semibold text-on-surface-variant w-24 pt-4">SCAMPER</th>
                                                        <td className="py-3 pl-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                {invention.scamper ? (
                                                                    invention.scamper
                                                                        .split(',')
                                                                        .map(t => t.trim())
                                                                        .map((tagName, i) => {
                                                                            const Icon = getIconComponent(getScamperIcon(tagName))
                                                                            return (
                                                                                <span key={i} className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", getScamperColorClass(tagName))}>
                                                                                    {Icon && <Icon className="w-3.5 h-3.5" />}
                                                                                    {getScamperLabel(tagName)}
                                                                                </span>
                                                                            )
                                                                        })
                                                                ) : <span className="text-on-surface">-</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-4">
                                                <Button variant="outlined" className="flex-1 gap-2 h-11 border-outline text-primary hover:bg-primary/5" onClick={handlePatentSearch}>
                                                    <ExternalLink className="w-4 h-4" />
                                                    특허 검색
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            {detailLoading && (
                                                <div className="flex items-center justify-center py-16 text-on-surface-variant">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    <span className="ml-3 text-sm">상세 설명을 불러오는 중...</span>
                                                </div>
                                            )}
                                            {detailState === 'error' && (
                                                <div className="text-center py-10 text-sm text-on-surface-variant">
                                                    상세 설명을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
                                                </div>
                                            )}
                                            <div className="space-y-4">
                                                <ExpandableSection
                                                    title="발명 동기"
                                                    content={invention.invention_motive}
                                                    defaultOpen={true}
                                                />
                                                <ExpandableSection
                                                    title="발명 요약"
                                                    content={invention.detailed_summary}
                                                    defaultOpen={true}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <ExpandableSection
                                                    title="해결하려는 문제"
                                                    content={invention.problem}
                                                />
                                                <ExpandableSection
                                                    title="해결방법 및 효과"
                                                    content={invention.solution}
                                                />
                                                <ExpandableSection
                                                    title="어떻게 더 개선해 볼 수 있을까?"
                                                    content={invention.next_step}
                                                />
                                            </div>

                                            {detailState === 'done' && !invention.invention_motive && !invention.detailed_summary && !invention.problem && !invention.solution && !invention.next_step && (
                                                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant font-medium">
                                                    <BadgeCheck className="w-12 h-12 mb-4 opacity-30" />
                                                    <p>상세 설명 정보가 등록되지 않은 발명품입니다.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 특허 검색 뷰 */
                        <PatentSearchView invention={invention} />
                    )}
                </div>
            </div>
        </div>
    )

    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null
}
