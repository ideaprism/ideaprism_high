'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { KiprisSearchResponse, KiprisPatent } from '@/types/kipris';
import {
    fetchKeywordDictionary,
    fetchIpcDescription,
    extractKeywords,
    generateSearchFormula,
    SearchFormula,
    CATEGORY_LABELS,
} from '@/utils/kipris-search';

// 날짜 포맷팅 함수
function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return dateStr || '-';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// 특허 카드 컴포넌트
function PatentCard({ patent, index }: { patent: KiprisPatent; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            {/* 헤더 */}
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

            {/* 본문 */}
            <div className="p-4 flex gap-4">
                {/* 도면 */}
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

                {/* 정보 */}
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

            {/* 상세보기 토글 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 border-t border-gray-200 bg-gray-50 text-indigo-600 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
                상세 정보 {isExpanded ? '▲' : '▼'}
            </button>

            {/* 상세보기 내용 */}
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

// 페이지네이션 컴포넌트
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

// 구조화 템플릿 타입
interface TemplateFields {
    ipc: string;
    principle: string;  // 기술/원리 키워드
    target: string;     // 대상물 키워드
    func: string;       // 기능 키워드
    product: string;    // 제품 키워드
}

// Props 타입
interface KiprisSearchModalProps {
    simpleTitle: string;
    ipc: string | null;
    onClose: () => void;
}

// 메인 모달 컴포넌트
export function KiprisSearchModal({ simpleTitle, ipc, onClose }: KiprisSearchModalProps) {
    // 검색식 상태
    const [formulaLoading, setFormulaLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // 자유 검색창
    const [ipcDescription, setIpcDescription] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // 구조화 템플릿 필드
    const [templateFields, setTemplateFields] = useState<TemplateFields>({
        ipc: ipc || '',
        principle: '',
        target: '',
        func: '',
        product: '',
    });

    // 검색 결과 상태
    const [searchLoading, setSearchLoading] = useState(false);
    const [results, setResults] = useState<KiprisPatent[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const numOfRows = 10;
    const totalPages = Math.ceil(totalCount / numOfRows);

    // 템플릿 필드에서 KIPRIS 검색식 자동 생성
    // KIPRIS 검색식 규칙: IPC=[IPC코드] * 키워드1 * 키워드2 * (키워드3 + 키워드4)
    const generatedFormula = useMemo(() => {
        const parts: string[] = [];

        // IPC 코드는 IPC=[코드] 형식으로
        if (templateFields.ipc.trim()) {
            parts.push(`IPC=[${templateFields.ipc.trim()}]`);
        }
        if (templateFields.principle.trim()) {
            const keywords = templateFields.principle.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`)
        }
        if (templateFields.target.trim()) {
            const keywords = templateFields.target.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`)
        }
        if (templateFields.func.trim()) {
            const keywords = templateFields.func.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`)
        }
        if (templateFields.product.trim()) {
            const keywords = templateFields.product.split(',').map(k => k.trim()).filter(k => k);
            if (keywords.length === 1) parts.push(keywords[0]);
            else if (keywords.length > 1) parts.push(`(${keywords.join('+')})`)
        }

        return parts.join('*');
    }, [templateFields]);

    // 템플릿 변경 시 검색창 업데이트
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
                const dictionary = await fetchKeywordDictionary();
                const keywords = extractKeywords(simpleTitle, dictionary);
                const result = generateSearchFormula(ipc, keywords);

                // 1-3초 랜덤 딜레이 (고급 기능 느낌)
                const delay = Math.floor(Math.random() * 2000) + 1000;
                await new Promise(resolve => setTimeout(resolve, delay));

                // 템플릿 필드 초기화
                const newFields: TemplateFields = {
                    ipc: ipc || '',
                    principle: '',
                    target: '',
                    func: '',
                    product: '',
                };

                // 그룹별로 키워드 분배
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

                // IPC 설명 조회
                if (ipc) {
                    const desc = await fetchIpcDescription(ipc);
                    setIpcDescription(desc);
                }
            } catch (error) {
                console.error('Formula generation failed:', error);
                setSearchQuery(simpleTitle);
            } finally {
                setFormulaLoading(false);
            }
        }
        generate();
    }, [simpleTitle, ipc]);

    // 검색식 생성 완료 후 자동 검색
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
            // 검색식에서 * 와 + 를 공백으로 변환하여 API에 전달
            const cleanQuery = searchQuery
                .replace(/\*/g, ' ')
                .replace(/\+/g, ' ')
                .replace(/[()]/g, '')
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

    // 복사 기능
    const handleCopy = async () => {
        if (searchQuery) {
            await navigator.clipboard.writeText(searchQuery);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // 배경 클릭으로 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    // 검색 실행
    const handleSearch = () => {
        setCurrentPage(1);
        executeSearch(1);
    };

    // 페이지 변경
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            executeSearch(page);
        }
    };

    // 템플릿 필드 업데이트
    const updateField = (field: keyof TemplateFields, value: string) => {
        setTemplateFields(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        특허 검색
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 검색 영역 */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 space-y-4">
                    {formulaLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            <span className="ml-3 text-gray-500">검색식 생성 중...</span>
                        </div>
                    ) : (
                        <>
                            {/* 자유 검색창 + 버튼 */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="검색식 입력 (예: A45B * 기어 * 우산)"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${copied
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                    title="검색식 복사"
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
                                    <span>📝</span> 검색식 구성 (키워드를 입력하면 자동으로 검색식이 생성됩니다)
                                </h4>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {/* IPC 코드 */}
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

                                    {/* 기술/원리 */}
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

                                    {/* 대상물 */}
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

                                    {/* 기능 */}
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

                                    {/* 제품 */}
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
                                    💡 쉼표(,)로 구분하여 여러 키워드를 입력할 수 있습니다. 여러 키워드는 OR(+) 조건으로 묶입니다.
                                </p>
                            </div>

                            {/* IPC 설명 */}
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

                {/* 검색 결과 섹션 */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* 결과 요약 */}
                    {!formulaLoading && totalCount > 0 && (
                        <div className="mb-4 text-sm text-gray-600">
                            총 <span className="text-indigo-600 font-bold">{totalCount.toLocaleString()}</span>건의
                            검색결과 (페이지 {currentPage}/{totalPages})
                        </div>
                    )}

                    {/* 로딩 */}
                    {searchLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
                            <span className="ml-3 text-gray-500">검색 중...</span>
                        </div>
                    )}

                    {/* 에러 */}
                    {searchError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4">
                            {searchError}
                        </div>
                    )}

                    {/* 결과 목록 */}
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

                    {/* 빈 결과 */}
                    {!searchLoading && !formulaLoading && hasSearched && results.length === 0 && !searchError && (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">🔍</div>
                            <p>검색 결과가 없습니다.</p>
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    {!searchLoading && totalCount > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {/* 푸터 */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center">
                        KIPRIS Plus API를 통해 KIPRIS와 동일한 특허 정보를 실시간으로 제공합니다. 검색식을 수정하여 다양한 키워드 조합으로 검색해 보세요.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default KiprisSearchModal;
