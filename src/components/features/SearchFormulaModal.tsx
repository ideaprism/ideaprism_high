'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Search, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
    fetchKeywordDictionary,
    fetchIpcDescription,
    extractKeywords,
    generateSearchFormula,
    KeywordMatch,
    SearchFormula,
    CATEGORY_LABELS
} from '@/utils/kipris-search'

interface SearchFormulaModalProps {
    simpleTitle: string
    ipc: string | null
    onClose: () => void
}

export function SearchFormulaModal({ simpleTitle, ipc, onClose }: SearchFormulaModalProps) {
    const [loading, setLoading] = useState(true)
    const [formula, setFormula] = useState<SearchFormula | null>(null)
    const [ipcDescription, setIpcDescription] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        async function generateFormula() {
            setLoading(true)
            try {
                const dictionary = await fetchKeywordDictionary()
                const keywords = extractKeywords(simpleTitle, dictionary)
                const result = generateSearchFormula(ipc, keywords)
                setFormula(result)


                // 2-3초 랜덤 딜레이 추가
                const delay = Math.floor(Math.random() * 1000) + 2000
                await new Promise(resolve => setTimeout(resolve, delay))

                // IPC 설명 조회
                if (ipc) {
                    const desc = await fetchIpcDescription(ipc)
                    setIpcDescription(desc)
                }
            } catch (error) {
                console.error('Failed to generate formula:', error)
            } finally {
                setLoading(false)
            }
        }

        generateFormula()
    }, [simpleTitle, ipc])

    const handleCopy = async () => {
        if (formula?.formula) {
            await navigator.clipboard.writeText(formula.formula)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleOpenKipris = () => {
        window.open('https://www.kipris.or.kr/khome/main.do', '_blank')
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        KIPRIS 검색식
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-highest transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="ml-3 text-on-surface-variant">검색식 생성 중...</span>
                        </div>
                    ) : formula ? (
                        <>
                            {/* Formula Display */}
                            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/30">
                                <div className="flex items-start justify-between gap-4">
                                    <code className="text-base font-mono text-on-surface break-all leading-relaxed flex-1">
                                        {formula.formula || '검색식을 생성할 수 없습니다'}
                                    </code>
                                    {formula.formula && (
                                        <Button
                                            variant="filled"
                                            size="sm"
                                            className={cn(
                                                "shrink-0 gap-1.5 transition-colors",
                                                copied && "bg-green-600 hover:bg-green-600"
                                            )}
                                            onClick={handleCopy}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    복사됨
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    복사
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Visual Breakdown */}
                            {(formula.ipc || formula.groups.length > 0) && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-on-surface-variant">검색식 구성</h4>
                                    <div className="flex flex-wrap items-start gap-2">
                                        {/* IPC */}
                                        {formula.ipc && (
                                            <>
                                                <div className="flex flex-col items-center">
                                                    <div className="px-4 py-2 bg-primary/10 border border-on-surface rounded-lg">
                                                        <span className="font-mono font-semibold text-on-surface">
                                                            {formula.ipc}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-on-surface-variant mt-1.5">
                                                        기술분류:IPC 코드
                                                    </span>
                                                </div>
                                                {formula.groups.length > 0 && (
                                                    <span className="text-xl font-light text-on-surface-variant self-center mt-[-12px]">*</span>
                                                )}
                                            </>
                                        )}

                                        {/* Keyword Groups */}
                                        {formula.groups.map((group, idx) => (
                                            <div key={group.category} className="flex items-start gap-2">
                                                <div className="flex flex-col items-center">
                                                    <div className="px-4 py-2 bg-primary/10 border border-on-surface rounded-lg">
                                                        <span className="font-mono font-medium text-on-surface">
                                                            {group.keywords.length === 1
                                                                ? group.keywords[0]
                                                                : `(${group.keywords.join(' + ')})`
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-on-surface-variant mt-1.5">
                                                        {group.label}
                                                    </span>
                                                </div>
                                                {idx < formula.groups.length - 1 && (
                                                    <span className="text-xl font-light text-on-surface-variant self-center mt-[-12px]">*</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* IPC Description */}
                            {formula.ipc && ipcDescription && (
                                <div className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3 border border-outline-variant/30">
                                    <span className="font-mono font-semibold text-on-surface">{formula.ipc}</span>
                                    <span className="mx-2">:</span>
                                    <span>{ipcDescription}</span>
                                </div>
                            )}

                            {/* No keywords found */}
                            {!formula.ipc && formula.groups.length === 0 && (
                                <div className="text-center py-4 text-on-surface-variant">
                                    제목에서 검색 키워드를 추출할 수 없습니다.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-on-surface-variant">
                            검색식 생성에 실패했습니다.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low space-y-4">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        KIPRIS 서비스 정책 변경으로 검색결과화면을 바로 제공해드릴 수 없는 점 양해 바랍니다.<br />
                        제공해 드리는 구조화된 검색식을 바탕으로, 찾고자 하는 정보에 맞게 키워드 구성을 재조합하여 많은 특허정보를 탐색해 보세요.<br />
                        절대 어렵지 않습니다.
                    </p>
                    <Button
                        variant="filled"
                        className="w-full gap-2"
                        onClick={handleOpenKipris}
                    >
                        <Search className="w-4 h-4" />
                        KIPRIS에서 검색하기
                    </Button>
                </div>
            </div>
        </div>
    )

    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null
}
