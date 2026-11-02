'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { KiprisSearchResponse, KiprisPatent } from '@/types/kipris';
import {
    fetchKeywordDictionary,
    fetchIpcDescription,
    extractKeywords,
    generateSearchFormula,
} from '@/utils/kipris-search';

// ============ 타입 정의 ============
interface InventionData {
    id: string;
    simple_title: string;
    original_title: string;
    drawing_url?: string | null;
    ipc?: string | null;
    grades?: { name: string } | null;
    categories?: { name: string } | null;
    curriculum?: string | null;
    sdg?: string | null;
    problem_tag?: string | null;
    scamper?: string | null;
    invention_motive?: string | null;
    detailed_summary?: string | null;
    problem?: string | null;
    solution?: string | null;
    next_step?: string | null;
}

interface IntegratedModalProps {
    invention: InventionData;
    onClose: () => void;
}

// ============ 유틸 함수 ============
function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return dateStr || '-';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// ============ 특허 카드 컴포넌트 ============
function PatentCard({ patent, index }: { patent: KiprisPatent; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index}
                    </span>
                    <span className="font-semibold text-sm truncate">{patent.inventionTitle}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${patent.registerNumber ? 'bg-emerald-500' : 'bg-white/30'
                    }`}>
                    {patent.registerStatus || (patent.registerNumber ? '등록' : '공개')}
                </span>
            </div>

            <div className="p-4 flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {patent.drawing || patent.bigDrawing ? (
                        <img
                            src={patent.drawing || patent.bigDrawing}
                            alt="도면"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <span className="text-gray-400 text-xs">도면 없음</span>
                    )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-gray-500 text-xs">출원번호</div>
                        <div className="text-indigo-600 font-medium">{patent.applicationNumber || '-'}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">출원일</div>
                        <div>{formatDate(patent.applicationDate)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">등록번호</div>
                        <div>{patent.registerNumber || '-'}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">출원인</div>
                        <div className="text-indigo-600">{patent.applicantName || '-'}</div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 border-t border-gray-200 bg-gray-50 text-indigo-600 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
                상세 정보 {isExpanded ? '▲' : '▼'}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm">
                    <table className="w-full">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 text-gray-500 w-20">발명명칭</td>
                                <td className="py-2">{patent.inventionTitle}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 text-gray-500">IPC</td>
                                <td className="py-2">{patent.ipcNumber || '-'}</td>
                            </tr>
                            {patent.abstract && (
                                <tr>
                                    <td className="py-2 text-gray-500 align-top">요약</td>
                                    <td className="py-2 leading-relaxed">{patent.abstract}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ============ 페이지네이션 컴포넌트 ============
function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const maxVisible = 7;

    const getPages = () => {
        const pages: number[] = [];
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const half = Math.floor(maxVisible / 2);
            let start = Math.max(1, currentPage - half);
            let end = Math.min(totalPages, currentPage + half);

            if (currentPage <= half) end = maxVisible;
            else if (currentPage >= totalPages - half) start = totalPages - maxVisible + 1;

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-1 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
                &lt;
            </button>
            {getPages().map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1.5 border rounded text-sm min-w-[36px] ${page === currentPage
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
                &gt;
            </button>
        </div>
    );
}

// ============ 구조화 템플릿 타입 ============
interface TemplateFields {
    ipc: string;
    principle: string;
    target: string;
    func: string;
    product: string;
}

// ============ 발명 정보 썸네일 컴포넌트 ============
function InventionThumbnail({
    invention,
    onClick
}: {
    invention: InventionData;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
        >
            {/* 썸네일 이미지 */}
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {invention.drawing_url ? (
                    <img
                        src={invention.drawing_url}
                        alt={invention.original_title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* 발명 제목 */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {invention.simple_title || invention.original_title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                    탐구 중인 발명 • 클릭하여 상세 보기
                </p>
            </div>

            {/* 화살표 아이콘 */}
            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
}

// ============ 발명 상세 뷰 컴포넌트 ============
function InventionDetailView({
    invention,
    onPatentSearch
}: {
    invention: InventionData;
    onPatentSearch: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'basic' | 'detail'>('basic');

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* 왼쪽: 이미지 */}
            <div className="w-full lg:w-[45%] bg-gray-50 p-8 flex items-center justify-center border-r border-gray-200">
                <div className="relative w-full aspect-[4/3] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden">
                    {invention.drawing_url ? (
                        <img
                            src={invention.drawing_url}
                            alt={invention.original_title}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">이미지가 없습니다</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 오른쪽: 정보 */}
            <div className="w-full lg:w-[55%] flex flex-col bg-white h-full overflow-hidden">
                {/* 탭 */}
                <div className="flex border-b border-gray-200 px-8 pt-4">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'basic'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        기본 정보
                    </button>
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'detail'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        상세 설명
                    </button>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'basic' ? (
                        <div className="space-y-6">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-dashed border-gray-200">
                                        <th className="py-3 text-left font-semibold text-gray-500 w-24">원본 제목</th>
                                        <td className="py-3 pl-4 text-gray-900 font-medium">{invention.original_title}</td>
                                    </tr>
                                    <tr className="border-b border-dashed border-gray-200">
                                        <th className="py-3 text-left font-semibold text-gray-500 w-24">학교 구분</th>
                                        <td className="py-3 pl-4 text-gray-700">{invention.grades?.name || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-dashed border-gray-200">
                                        <th className="py-3 text-left font-semibold text-gray-500 w-24">분야</th>
                                        <td className="py-3 pl-4 text-gray-700">{invention.categories?.name || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-dashed border-gray-200">
                                        <th className="py-3 text-left font-semibold text-gray-500 w-24">IPC</th>
                                        <td className="py-3 pl-4 text-gray-700 font-mono">{invention.ipc || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-dashed border-gray-200">
                                        <th className="py-3 text-left font-semibold text-gray-500 w-24">관련교과</th>
                                        <td className="py-3 pl-4 text-gray-700">{invention.curriculum || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* 특허 검색 버튼 */}
                            <button
                                onClick={onPatentSearch}
                                className="w-full py-3 border-2 border-indigo-500 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                특허 검색
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invention.invention_motive && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-indigo-600 mb-2">발명 동기</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{invention.invention_motive}</p>
                                </div>
                            )}
                            {invention.detailed_summary && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-indigo-600 mb-2">발명 요약</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{invention.detailed_summary}</p>
                                </div>
                            )}
                            {invention.problem && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-indigo-600 mb-2">해결하려는 문제</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{invention.problem}</p>
                                </div>
                            )}
                            {invention.solution && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-indigo-600 mb-2">해결방법 및 효과</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{invention.solution}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ 특허 검색 뷰 컴포넌트 ============
function PatentSearchView({
    invention,
}: {
    invention: InventionData;
}) {
    const [formulaLoading, setFormulaLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [ipcDescription, setIpcDescription] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [templateFields, setTemplateFields] = useState<TemplateFields>({
        ipc: invention.ipc || '',
        principle: '',
        target: '',
        func: '',
        product: '',
    });

    const [searchLoading, setSearchLoading] = useState(false);
    const [results, setResults] = useState<KiprisPatent[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const numOfRows = 10;
    const totalPages = Math.ceil(totalCount / numOfRows);

    // KIPRIS 검색식 자동 생성
    const generatedFormula = useMemo(() => {
        const parts: string[] = [];

        if (templateFields.ipc.trim()) {
            parts.push(`IPC=[${templateFields.ipc.trim()}]`);
        }
        if (templateFields.principle.trim()) {
            const keywords = templateFields.principle.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`);
        }
        if (templateFields.target.trim()) {
            const keywords = templateFields.target.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`);
        }
        if (templateFields.func.trim()) {
            const keywords = templateFields.func.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`);
        }
        if (templateFields.product.trim()) {
            const keywords = templateFields.product.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`);
        }

        return parts.join('*');
    }, [templateFields]);

    useEffect(() => {
        if (generatedFormula) {
            setSearchQuery(generatedFormula);
        }
    }, [generatedFormula]);

    // 초기 검색식 생성
    useEffect(() => {
        async function generate() {
            setFormulaLoading(true);
            try {
                const simpleTitle = invention.simple_title || invention.original_title;
                const ipc = invention.ipc || null;

                const dictionary = await fetchKeywordDictionary();
                const keywords = extractKeywords(simpleTitle, dictionary);
                const result = generateSearchFormula(ipc, keywords);

                const delay = Math.floor(Math.random() * 2000) + 1000;
                await new Promise(resolve => setTimeout(resolve, delay));

                const newFields: TemplateFields = {
                    ipc: ipc || '',
                    principle: '',
                    target: '',
                    func: '',
                    product: '',
                };

                result.groups.forEach(group => {
                    const keywordStr = group.keywords.join(', ');
                    switch (group.category) {
                        case 'principle':
                            newFields.principle = keywordStr;
                            break;
                        case 'domain':
                            newFields.target = keywordStr;
                            break;
                        case 'function':
                            newFields.func = keywordStr;
                            break;
                        case 'product':
                            newFields.product = keywordStr;
                            break;
                    }
                });

                setTemplateFields(newFields);
                setSearchQuery(result.formula);

                if (ipc) {
                    const desc = await fetchIpcDescription(ipc);
                    setIpcDescription(desc);
                }
            } catch (error) {
                console.error('Formula generation failed:', error);
                setSearchQuery(invention.simple_title || invention.original_title);
            } finally {
                setFormulaLoading(false);
            }
        }
        generate();
    }, [invention]);

    // 자동 검색
    useEffect(() => {
        if (!formulaLoading && searchQuery && !hasSearched) {
            executeSearch(1);
            setHasSearched(true);
        }
    }, [formulaLoading, searchQuery, hasSearched]);

    // KIPRIS API 검색 실행
    const executeSearch = useCallback(async (page: number) => {
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        setSearchError(null);

        try {
            const cleanQuery = searchQuery
                .replace(/\*/g, ' ')
                .replace(/\+/g, ' ')
                .replace(/[()]/g, '')
                .replace(/IPC=\[([^\]]+)\]/g, '$1')
                .replace(/\s+/g, ' ')
                .trim();

            const params = new URLSearchParams();
            params.set('word', cleanQuery);
            params.set('pageNo', page.toString());
            params.set('numOfRows', numOfRows.toString());

            const response = await fetch(`/api/kipris/search?${params.toString()}`);
            const data: KiprisSearchResponse = await response.json();

            if (data.success) {
                setResults(data.items);
                setTotalCount(data.totalCount);
                setCurrentPage(page);
            } else {
                setSearchError(data.error || '검색 중 오류가 발생했습니다.');
                setResults([]);
                setTotalCount(0);
            }
        } catch (error) {
            setSearchError('API 호출 중 오류가 발생했습니다.');
            console.error(error);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery, numOfRows]);

    const handleCopy = async () => {
        if (searchQuery) {
            await navigator.clipboard.writeText(searchQuery);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        executeSearch(1);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            executeSearch(page);
        }
    };

    const updateField = (field: keyof TemplateFields, value: string) => {
        setTemplateFields(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 전체 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto">
                {/* 검색 영역 */}
                <div className="px-6 py-4 bg-gray-50 space-y-4">
                    {formulaLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            <span className="ml-3 text-gray-500">검색식 생성 중...</span>
                        </div>
                    ) : (
                        <>
                            {/* 자유 검색창 */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="검색식 입력"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${copied
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={2} />
                                    </svg>
                                    {copied ? '완료' : '복사'}
                                </button>
                                <button
                                    onClick={handleSearch}
                                    disabled={searchLoading || !searchQuery.trim()}
                                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    검색
                                </button>
                            </div>

                            {/* 구조화 템플릿 */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <span>📝</span> 검색식 구성
                                </h4>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">IPC 코드</label>
                                        <input
                                            type="text"
                                            value={templateFields.ipc}
                                            onChange={(e) => updateField('ipc', e.target.value)}
                                            placeholder="A45B"
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">기술/원리</label>
                                        <input
                                            type="text"
                                            value={templateFields.principle}
                                            onChange={(e) => updateField('principle', e.target.value)}
                                            placeholder="기어, 스핀"
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">대상물</label>
                                        <input
                                            type="text"
                                            value={templateFields.target}
                                            onChange={(e) => updateField('target', e.target.value)}
                                            placeholder="우산, 양산"
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">기능</label>
                                        <input
                                            type="text"
                                            value={templateFields.func}
                                            onChange={(e) => updateField('func', e.target.value)}
                                            placeholder="제거, 건조"
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">제품</label>
                                        <input
                                            type="text"
                                            value={templateFields.product}
                                            onChange={(e) => updateField('product', e.target.value)}
                                            placeholder="장치, 기구"
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400">
                                    💡 쉼표(,)로 구분하여 여러 키워드를 입력할 수 있습니다.
                                </p>
                            </div>

                            {templateFields.ipc && ipcDescription && (
                                <div className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                                    <span className="font-mono font-semibold text-gray-900">{templateFields.ipc}</span>
                                    <span className="mx-2">:</span>
                                    <span>{ipcDescription}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 검색 결과 */}
                <div className="px-6 py-4">
                    {!formulaLoading && totalCount > 0 && (
                        <div className="mb-4 text-sm text-gray-600">
                            총 <span className="text-indigo-600 font-bold">{totalCount.toLocaleString()}</span>건의
                            검색결과 (페이지 {currentPage}/{totalPages})
                        </div>
                    )}

                    {searchLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
                            <span className="ml-3 text-gray-500">검색 중...</span>
                        </div>
                    )}

                    {searchError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4">
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
                        <div className="text-center py-12 text-gray-500">
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
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <p className="text-xs text-gray-500 text-center">
                    KIPRIS Plus API를 통해 KIPRIS와 동일한 특허 정보를 실시간으로 제공합니다.
                </p>
            </div>
        </div>
    );
}

// ============ 메인 통합 모달 컴포넌트 ============
export function IntegratedInventionModal({ invention, onClose }: IntegratedModalProps) {
    const [viewMode, setViewMode] = useState<'invention' | 'patent'>('invention');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handlePatentSearch = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setViewMode('patent');
            setIsTransitioning(false);
        }, 300);
    };

    const handleBackToInvention = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setViewMode('invention');
            setIsTransitioning(false);
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${viewMode === 'patent'
                    ? 'w-full h-[95vh] max-w-7xl'
                    : 'w-full h-[85vh] max-w-5xl'
                    }`}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                    {viewMode === 'patent' ? (
                        <div className="flex items-center gap-4 flex-1">
                            {/* 발명 정보 썸네일 */}
                            <InventionThumbnail
                                invention={invention}
                                onClick={handleBackToInvention}
                            />

                            {/* 구분선 */}
                            <div className="h-10 w-px bg-gray-300" />

                            {/* 특허 검색 제목 */}
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                특허 검색
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold text-gray-900">
                            {invention.simple_title || invention.original_title}
                        </h2>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 콘텐츠 영역 */}
                <div className={`flex-1 overflow-hidden transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    {viewMode === 'invention' ? (
                        <InventionDetailView
                            invention={invention}
                            onPatentSearch={handlePatentSearch}
                        />
                    ) : (
                        <PatentSearchView invention={invention} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default IntegratedInventionModal;
