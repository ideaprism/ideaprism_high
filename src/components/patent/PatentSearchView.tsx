'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Copy, Check, Loader2, ChevronDown, ChevronUp, ImageIcon, ExternalLink } from 'lucide-react'
import { InventionV2 } from '../features/InventionCardV2'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { fetchIpcDescription } from '@/utils/kipris-search'
import {
    parseKiprisKeywords,
    keywordsToTemplateFields,
    OPSME_CATEGORIES,
    OPSMETemplateFields,
    templateFieldsToFormula,
    type OPSMECategory,
} from '@/utils/opsme-keywords'
import { createClient } from '@/utils/supabase/client'
import type { KiprisSearchResponse, KiprisPatent } from '@/types/kipris'

// OPSME 키워드 모드
type KeywordMode = 'simple' | 'expert';

// 날짜 포맷팅 함수
function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return dateStr || '-'
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

// ============ 특허 카드 컴포넌트 ============
export function PatentCard({ patent, index }: { patent: KiprisPatent; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="bg-surface rounded-lg overflow-hidden shadow-sm border border-outline-variant/30">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-on-primary px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index}
                    </span>
                    <span className="font-semibold text-sm truncate">{patent.inventionTitle}</span>
                </div>
                {patent.ipcMatch && (
                    <span className="mr-2 px-2 py-1 rounded text-xs font-semibold flex-shrink-0 bg-white text-emerald-700" title="검색식의 IPC 분류와 같은 특허">
                        IPC 일치
                    </span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${patent.registerNumber ? 'bg-emerald-500' : 'bg-white/30'}`}>
                    {patent.registerStatus || (patent.registerNumber ? '등록' : '공개')}
                </span>
            </div>

            <div className="p-4 flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low rounded-lg flex items-center justify-center overflow-hidden">
                    {patent.drawing || patent.bigDrawing ? (
                        <img
                            src={patent.drawing || patent.bigDrawing}
                            alt="도면"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                            }}
                        />
                    ) : (
                        <span className="text-on-surface-variant/50 text-xs">도면 없음</span>
                    )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-on-surface-variant text-xs">출원번호</div>
                        <div className="text-primary font-medium">{patent.applicationNumber || '-'}</div>
                    </div>
                    <div>
                        <div className="text-on-surface-variant text-xs">출원일</div>
                        <div>{formatDate(patent.applicationDate)}</div>
                    </div>
                    <div>
                        <div className="text-on-surface-variant text-xs">등록번호</div>
                        <div>{patent.registerNumber || '-'}</div>
                    </div>
                    <div>
                        <div className="text-on-surface-variant text-xs">출원인</div>
                        <div className="text-primary">{patent.applicantName || '-'}</div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 border-t border-outline-variant/30 bg-surface-container-low text-primary text-sm font-medium hover:bg-surface-container-highest transition-colors"
            >
                상세 정보 {isExpanded ? '▲' : '▼'}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low text-sm">
                    <table className="w-full">
                        <tbody>
                            <tr className="border-b border-outline-variant/20">
                                <td className="py-2 text-on-surface-variant w-20">발명명칭</td>
                                <td className="py-2">{patent.inventionTitle}</td>
                            </tr>
                            <tr className="border-b border-outline-variant/20">
                                <td className="py-2 text-on-surface-variant">IPC</td>
                                <td className="py-2">{patent.ipcNumber || '-'}</td>
                            </tr>
                            {patent.abstract && (
                                <tr>
                                    <td className="py-2 text-on-surface-variant align-top">요약</td>
                                    <td className="py-2 leading-relaxed">{patent.abstract}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ============ 페이지네이션 컴포넌트 ============
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}) {
    const maxVisible = 7

    const getPages = () => {
        const pages: number[] = []
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            const half = Math.floor(maxVisible / 2)
            let start = Math.max(1, currentPage - half)
            let end = Math.min(totalPages, currentPage + half)

            if (currentPage <= half) end = maxVisible
            else if (currentPage >= totalPages - half) start = totalPages - maxVisible + 1

            for (let i = start; i <= end; i++) pages.push(i)
        }
        return pages
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex justify-center items-center gap-1 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-outline-variant/30 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-highest"
            >
                &lt;
            </button>
            {getPages().map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1.5 border rounded text-sm min-w-[36px] ${page === currentPage
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant/30 hover:bg-surface-container-highest'
                        }`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-outline-variant/30 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-highest"
            >
                &gt;
            </button>
        </div>
    )
}

// ============ 발명 정보 썸네일 컴포넌트 ============
export function InventionThumbnail({
    invention,
    onClick
}: {
    invention: InventionV2
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-outline-variant/30 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
        >
            {/* 썸네일 이미지 */}
            <div className="w-14 h-14 flex-shrink-0 bg-surface-container-low rounded-lg overflow-hidden">
                {invention.drawing_url ? (
                    <img
                        src={invention.drawing_url}
                        alt={invention.original_title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* 발명 제목 */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {invention.simple_title || invention.original_title}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                    탐구 중인 발명 • 클릭하여 상세 보기
                </p>
            </div>

            {/* 화살표 아이콘 */}
            <ChevronDown className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors -rotate-90" />
        </div>
    )
}

// ============ 특허 검색 뷰 컴포넌트 (OPSME 구조) ============
export function PatentSearchView({ invention }: { invention: InventionV2 }) {
    const [formulaLoading, setFormulaLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [ipcDescription, setIpcDescription] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // OPSME 키워드 모드 (Simple/Expert)
    const [keywordMode, setKeywordMode] = useState<KeywordMode>('simple')
    const [opsmeKeywordsData, setOpsmeKeywordsData] = useState<{
        simple: OPSMETemplateFields
        expert: OPSMETemplateFields
    } | null>(null)

    // OPSME 카테고리 활성화 상태 (O, S만 기본 활성화)
    const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
        O: true,
        P: false,
        S: true,
        M: false,
        E: false,
    })

    const [templateFields, setTemplateFields] = useState<OPSMETemplateFields>({
        ipc: invention.ipc || '',
        object: '',
        problem: '',
        solution: '',
        method: '',
        effect: '',
    })

    const [searchLoading, setSearchLoading] = useState(false)
    const [showSearchTip, setShowSearchTip] = useState(false)
    const [results, setResults] = useState<KiprisPatent[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    // 서버가 실제로 KIPRIS에 보낸 질의 (표시식과 다를 수 있음 → 화면에 그대로 알림)
    const [applied, setApplied] = useState<{
        query: string | null
        relaxed: boolean
        ipc: string | null
        ipcApplied: boolean
        operatorMode: boolean
    } | null>(null)
    const numOfRows = 10
    const totalPages = Math.ceil(totalCount / numOfRows)

    // KIPRIS 검색식 자동 생성 (활성화된 카테고리만 포함)
    const generatedFormula = useMemo(() => {
        const categories = (Object.keys(OPSME_CATEGORIES) as OPSMECategory[]).filter((key) => activeCategories[key])
        return templateFieldsToFormula(templateFields, categories)
    }, [templateFields, activeCategories])

    useEffect(() => {
        if (generatedFormula) {
            setSearchQuery(generatedFormula)
        }
    }, [generatedFormula])

    // Supabase에서 OPSME 키워드 로딩
    useEffect(() => {
        async function loadOPSMEKeywords() {
            setFormulaLoading(true)
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('kipris_search_keywords')
                    .select('kipris_search_keywords')
                    .eq('invention_id', invention.id)
                    .single()

                if (error || !data) {
                    // 데이터가 없으면 기본값 사용
                    console.log('OPSME 키워드 없음, 기본값 사용')
                    setTemplateFields({
                        ipc: invention.ipc || '',
                        object: '',
                        problem: '',
                        solution: '',
                        method: '',
                        effect: '',
                    })
                } else {
                    // 키워드 파싱
                    const parsed = parseKiprisKeywords(data.kipris_search_keywords)

                    const simpleFields = keywordsToTemplateFields(invention.ipc ?? null, parsed.simple)
                    const expertFields = keywordsToTemplateFields(invention.ipc ?? null, parsed.expert)

                    setOpsmeKeywordsData({ simple: simpleFields, expert: expertFields })

                    // 기본 모드(simple)로 템플릿 필드 설정
                    setTemplateFields(simpleFields)
                }

                // IPC 설명 로딩
                if (invention.ipc) {
                    const desc = await fetchIpcDescription(invention.ipc)
                    setIpcDescription(desc)
                }
            } catch (error) {
                console.error('OPSME 키워드 로딩 실패:', error)
            } finally {
                setFormulaLoading(false)
            }
        }
        loadOPSMEKeywords()
    }, [invention])

    // 모드 변경 시 템플릿 필드 업데이트
    const handleModeChange = (mode: KeywordMode) => {
        setKeywordMode(mode)
        if (opsmeKeywordsData) {
            setTemplateFields(mode === 'simple' ? opsmeKeywordsData.simple : opsmeKeywordsData.expert)
        }
    }

    // 자동 검색
    useEffect(() => {
        if (!formulaLoading && searchQuery && !hasSearched) {
            executeSearch(1)
            setHasSearched(true)
        }
    }, [formulaLoading, searchQuery, hasSearched])

    // KIPRIS API 검색 실행
    const executeSearch = useCallback(async (page: number) => {
        if (!searchQuery.trim()) return

        setSearchLoading(true)
        setSearchError(null)

        try {
            // 검색식을 그대로 서버에 보내고, 서버가 구조(IPC / AND 그룹 / OR 대체어)를 해석해
            // 실제 KIPRIS 질의를 만든다. 실제로 쓴 질의는 appliedQuery로 돌려받아 화면에 표시.
            const params = new URLSearchParams()
            params.set('q', searchQuery.trim())
            params.set('pageNo', page.toString())
            params.set('numOfRows', numOfRows.toString())

            const response = await fetch(`/api/kipris/search?${params.toString()}`)

            // 서버가 JSON이 아닌 응답(게이트웨이 오류 등)을 내려도 안전하게 처리
            const data: KiprisSearchResponse | null = await response.json().catch(() => null)

            if (!data) {
                setSearchError(`특허 검색 서버 응답 오류가 발생했습니다. (코드 ${response.status}) 잠시 후 다시 시도해 주세요.`)
                setResults([])
                setTotalCount(0)
                return
            }

            if (data.success) {
                setResults(data.items)
                setTotalCount(data.totalCount)
                setCurrentPage(page)
                setApplied({
                    query: data.appliedQuery ?? null,
                    relaxed: !!data.relaxed,
                    ipc: data.ipc ?? null,
                    ipcApplied: !!data.ipcApplied,
                    operatorMode: !!data.operatorMode,
                })
            } else {
                setSearchError(data.error || '검색 중 오류가 발생했습니다.')
                setResults([])
                setTotalCount(0)
                setApplied(null)
            }
        } catch (error) {
            setSearchError('API 호출 중 오류가 발생했습니다.')
            console.error(error)
        } finally {
            setSearchLoading(false)
        }
    }, [searchQuery, numOfRows])

    const handleCopy = async () => {
        if (searchQuery) {
            await navigator.clipboard.writeText(searchQuery)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSearch = () => {
        setCurrentPage(1)
        executeSearch(1)
    }

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            executeSearch(page)
        }
    }

    const updateField = (field: keyof OPSMETemplateFields, value: string) => {
        setTemplateFields(prev => ({ ...prev, [field]: value }))
    }

    // 카테고리 활성화 토글
    const toggleCategory = (category: string) => {
        setActiveCategories(prev => ({ ...prev, [category]: !prev[category] }))
    }

    // OPSME 카테고리 뱃지 색상 (활성화 상태에 따라 다름)
    const getCategoryBadgeClass = (category: string, isActive: boolean) => {
        if (!isActive) {
            return 'bg-gray-100 text-gray-400 border-gray-200'
        }
        const colors: Record<string, string> = {
            O: 'bg-blue-100 text-blue-700 border-blue-300',
            P: 'bg-red-100 text-red-700 border-red-300',
            S: 'bg-green-100 text-green-700 border-green-300',
            M: 'bg-purple-100 text-purple-700 border-purple-300',
            E: 'bg-amber-100 text-amber-700 border-amber-300',
        }
        return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 전체 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto">
                {/* 검색 영역 */}
                <div className="px-6 py-4 bg-surface-container-low space-y-4">
                    {formulaLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            <span className="ml-3 text-on-surface-variant">OPSME 키워드 로딩 중...</span>
                        </div>
                    ) : (
                        <>
                            {/* 검색식 입력창 (상단) */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="검색식 입력"
                                    className="flex-1 px-4 py-3 border border-outline-variant/30 rounded-lg text-base font-mono bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button
                                    variant="filled"
                                    onClick={handleCopy}
                                    className={cn(
                                        "px-4 gap-2",
                                        copied ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"
                                    )}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? '완료' : '복사'}
                                </Button>
                                <Button
                                    variant="filled"
                                    onClick={handleSearch}
                                    disabled={searchLoading || !searchQuery.trim()}
                                    className="px-6 gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    검색
                                </Button>
                            </div>

                            {/* OPSME 구조화 템플릿 */}
                            <div className="bg-surface rounded-lg p-4 border border-outline-variant/30 space-y-4">
                                {/* 헤더: 검색식 구성 + 검색팁 + Simple/Expert 토글 */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-semibold text-on-surface-variant flex items-center gap-2">
                                            <span>📝</span> 검색식 구성
                                        </h4>
                                        {/* 검색팁 - 클릭 시 풍선팝업 */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSearchTip(!showSearchTip)}
                                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center text-[10px] font-bold">?</span>
                                                검색도움말
                                            </button>
                                            {/* 풍선팝업 */}
                                            {showSearchTip && (
                                                <div className="absolute left-0 top-7 z-50 bg-surface border border-outline-variant/50 rounded-lg shadow-lg p-3 w-[520px]">
                                                    <div className="text-xs text-on-surface-variant leading-relaxed">
                                                        <p className="whitespace-nowrap">이용팁! 50건 정도의 검색결과가 나오게 검색식을 수정해 보세요.</p>
                                                        <p className="whitespace-nowrap">검색결과가 너무 많으면 AND 조건으로 항목이나 키워드를 추가하고,</p>
                                                        <p className="whitespace-nowrap">너무 적다면 키워드를 줄여보세요.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowSearchTip(false)}
                                                        className="absolute top-1 right-1 text-on-surface-variant/50 hover:text-on-surface-variant text-sm p-1"
                                                    >×</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Simple/Expert 토글 */}
                                    {opsmeKeywordsData && (
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                keywordMode === 'simple' ? "text-primary font-bold" : "text-on-surface-variant/60"
                                            )}>Simple</span>
                                            <button
                                                type="button"
                                                onClick={() => handleModeChange(keywordMode === 'simple' ? 'expert' : 'simple')}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                    keywordMode === 'expert' ? 'bg-primary' : 'bg-gray-300'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                                                        keywordMode === 'expert' ? "translate-x-6" : "translate-x-1"
                                                    )}
                                                />
                                            </button>
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                keywordMode === 'expert' ? "text-primary font-bold" : "text-on-surface-variant/60"
                                            )}>Expert</span>
                                        </div>
                                    )}
                                </div>

                                {/* IPC 코드 - 세로바와 함께 설명 표시 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-on-surface-variant">IPC 코드</label>
                                    <div className="flex items-center border border-outline-variant/30 rounded-lg bg-white focus-within:ring-1 focus-within:ring-primary">
                                        <input
                                            type="text"
                                            value={templateFields.ipc}
                                            onChange={(e) => updateField('ipc', e.target.value)}
                                            placeholder="A47B"
                                            className="px-4 py-2.5 text-sm bg-transparent focus:outline-none font-mono w-24 shrink-0"
                                        />
                                        {templateFields.ipc && ipcDescription && (
                                            <>
                                                <span className="text-gray-300 text-lg">|</span>
                                                <span className="px-3 py-2 text-xs text-on-surface-variant truncate">
                                                    {ipcDescription}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* OPSME 필드 (5열 가로 배치) */}
                                <div className="grid grid-cols-5 gap-3">
                                    {/* O: 발명대상 */}
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => toggleCategory('O')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-xs font-semibold cursor-pointer",
                                                getCategoryBadgeClass('O', activeCategories.O)
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                activeCategories.O ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"
                                            )}>O</span>
                                            {OPSME_CATEGORIES.O.name}
                                        </button>
                                        <input
                                            type="text"
                                            value={templateFields.object}
                                            onChange={(e) => updateField('object', e.target.value)}
                                            placeholder="이불장"
                                            disabled={!activeCategories.O}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg text-sm transition-all",
                                                activeCategories.O
                                                    ? "bg-white border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        />
                                    </div>

                                    {/* P: 문제점 */}
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => toggleCategory('P')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-xs font-semibold cursor-pointer",
                                                getCategoryBadgeClass('P', activeCategories.P)
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                activeCategories.P ? "bg-red-600 text-white" : "bg-gray-300 text-gray-500"
                                            )}>P</span>
                                            {OPSME_CATEGORIES.P.name}
                                        </button>
                                        <input
                                            type="text"
                                            value={templateFields.problem}
                                            onChange={(e) => updateField('problem', e.target.value)}
                                            placeholder="수납어려움"
                                            disabled={!activeCategories.P}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg text-sm transition-all",
                                                activeCategories.P
                                                    ? "bg-white border-red-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        />
                                    </div>

                                    {/* S: 해결수단 */}
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => toggleCategory('S')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-xs font-semibold cursor-pointer",
                                                getCategoryBadgeClass('S', activeCategories.S)
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                activeCategories.S ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"
                                            )}>S</span>
                                            {OPSME_CATEGORIES.S.name}
                                        </button>
                                        <input
                                            type="text"
                                            value={templateFields.solution}
                                            onChange={(e) => updateField('solution', e.target.value)}
                                            placeholder="이동식 봉"
                                            disabled={!activeCategories.S}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg text-sm transition-all",
                                                activeCategories.S
                                                    ? "bg-white border-green-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        />
                                    </div>

                                    {/* M: 방법/원리 */}
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => toggleCategory('M')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-xs font-semibold cursor-pointer",
                                                getCategoryBadgeClass('M', activeCategories.M)
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                activeCategories.M ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-500"
                                            )}>M</span>
                                            {OPSME_CATEGORIES.M.name}
                                        </button>
                                        <input
                                            type="text"
                                            value={templateFields.method}
                                            onChange={(e) => updateField('method', e.target.value)}
                                            placeholder="봉에 끼움"
                                            disabled={!activeCategories.M}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg text-sm transition-all",
                                                activeCategories.M
                                                    ? "bg-white border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        />
                                    </div>

                                    {/* E: 효과 */}
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => toggleCategory('E')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-xs font-semibold cursor-pointer",
                                                getCategoryBadgeClass('E', activeCategories.E)
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                activeCategories.E ? "bg-amber-500 text-white" : "bg-gray-300 text-gray-500"
                                            )}>E</span>
                                            {OPSME_CATEGORIES.E.name}
                                        </button>
                                        <input
                                            type="text"
                                            value={templateFields.effect}
                                            onChange={(e) => updateField('effect', e.target.value)}
                                            placeholder="수납효율"
                                            disabled={!activeCategories.E}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg text-sm transition-all",
                                                activeCategories.E
                                                    ? "bg-white border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* 안내 문구 */}
                                <div className="text-xs text-on-surface-variant/70 space-y-0.5">
                                    <p className="flex items-start gap-1">
                                        <span className="shrink-0">💡</span>
                                        <span>적정 검색결과를 위해 발명대상과 해결수단이 기본 선택되어 표시됩니다.</span>
                                    </p>
                                    <p className="pl-5">쉼표(,)로 구분하여 여러 키워드를 입력할 수 있습니다. 여러 키워드는 OR(+) 조건으로 묶입니다.</p>
                                    <p className="pl-5">위 검색식은 KIPRIS 사이트에 그대로 붙여 쓸 수 있어요(복사 버튼). 이 화면에서 바로 찾은 결과는 검색 결과 위 &lsquo;실제 조회&rsquo;에 적힌 질의로 찾은 거예요.</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 검색 결과 */}
                <div className="px-6 py-4">
                    {!formulaLoading && !searchLoading && applied?.query && (
                        <div className="mb-3 text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 space-y-1">
                            <p>
                                <span className="font-semibold text-on-surface">실제 조회:</span>{' '}
                                <span className="font-mono">{applied.query}</span>
                                {!applied.operatorMode && (
                                    <span className="text-on-surface-variant/70"> (각 항목의 첫 키워드로 검색)</span>
                                )}
                            </p>
                            {applied.relaxed && (
                                <p className="text-amber-700">
                                    모든 조건을 만족하는 특허가 없어 일부 항목을 빼고 다시 찾았어요.
                                </p>
                            )}
                            {applied.ipc && !applied.ipcApplied && (
                                <p className="text-amber-700">
                                    IPC <span className="font-mono">{applied.ipc}</span> 조건으로는 결과가 없어 IPC를 빼고 찾았어요.
                                    같은 분류의 특허에는 <span className="font-semibold text-emerald-700">IPC 일치</span> 표시가 붙어요.
                                </p>
                            )}
                        </div>
                    )}

                    {!formulaLoading && totalCount > 0 && (
                        <div className="mb-4 text-sm text-on-surface-variant">
                            총 <span className="text-primary font-bold">{totalCount.toLocaleString()}</span>건의
                            검색결과 (페이지 {currentPage}/{totalPages})
                        </div>
                    )}

                    {searchLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="ml-3 text-on-surface-variant">검색 중...</span>
                        </div>
                    )}

                    {searchError && (
                        <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30 mb-4">
                            {searchError}
                        </div>
                    )}

                    {!searchLoading && results.length > 0 && (
                        <div className="space-y-3">
                            {results.map((patent, index) => (
                                <PatentCard
                                    key={`${patent.applicationNumber}-${index}`}
                                    patent={patent}
                                    index={(currentPage - 1) * numOfRows + index + 1}
                                />
                            ))}
                        </div>
                    )}

                    {!searchLoading && !formulaLoading && hasSearched && results.length === 0 && !searchError && (
                        <div className="text-center py-12 text-on-surface-variant">
                            <div className="text-4xl mb-4">🔍</div>
                            <p>검색 결과가 없습니다.</p>
                        </div>
                    )}

                    {!searchLoading && totalCount > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t border-outline-variant/20 bg-surface-container-low flex-shrink-0">
                <p className="text-xs text-on-surface-variant text-center">
                    KIPRIS Plus API를 통해 KIPRIS와 동일한 특허 정보를 실시간으로 제공합니다.
                </p>
            </div>
        </div>
    )
}
