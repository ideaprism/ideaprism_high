'use client';

import { useState, useCallback, useEffect } from 'react';
import type { KiprisSearchResponse, KiprisPatent } from '@/types/kipris';
import { KiprisSearchModal } from './KiprisSearchModal';
import { IntegratedInventionModal } from './IntegratedInventionModal';
import { OPSMESearchModal } from './OPSMESearchModal';
import { createClient } from '@/utils/supabase/client';

// 테스트용 더미 발명품 데이터
const TEST_INVENTIONS = [
    { title: '핸드 스핀 기어 방식의 우산 물기 제거 장치', ipc: 'A45B' },
    { title: '태양광 에너지를 이용한 스마트 화분', ipc: 'A01G' },
    { title: '자동 분리수거 쓰레기통', ipc: 'B65F' },
];

// 통합 모달 테스트용 발명 데이터
const TEST_FULL_INVENTIONS = [
    {
        id: 'test-1',
        simple_title: '우산 원리 활용 허리 부담 없는 접시 콘 회수기',
        original_title: '허리가 아프지 않은 접시콘 회수기',
        drawing_url: 'https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=발명+도면',
        ipc: 'A45B',
        grades: { name: '초등학교' },
        categories: { name: '생활(일반)' },
        curriculum: '[초] 실과-발명과 지식 재산, [중] 기가-기술 혁신과 설계',
        sdg: null,
        problem_tag: '편의(불편), 경제성(낭비)',
        scamper: 'C(결합), M(변형), R(거꾸로)',
        invention_motive: '운동회에서 접시콘을 회수할 때 허리를 계속 숙여야 해서 힘들었다.',
        detailed_summary: '우산 원리를 활용해 허리를 숙이지 않고 접시콘을 회수할 수 있는 장치',
        problem: '접시콘 회수 시 허리 통증 문제',
        solution: '우산처럼 접히는 구조로 허리를 숙이지 않아도 접시콘 회수 가능',
    },
    {
        id: 'test-2',
        simple_title: '태양광 에너지를 이용한 스마트 화분',
        original_title: '태양광 스마트 화분',
        drawing_url: null,
        ipc: 'A01G',
        grades: { name: '중학교' },
        categories: { name: '환경' },
        curriculum: null,
        sdg: '7',
        problem_tag: '환경(환경문제)',
        scamper: 'A(적용), C(결합)',
        invention_motive: null,
        detailed_summary: null,
        problem: null,
        solution: null,
    },
];

// OPSME 키워드 데이터 타입
interface OPSMEInvention {
    id: string;
    title: string;
    ipc: string;
    kiprisKeywords: string;
}

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return dateStr || '-';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// 특허 카드 컴포넌트
function PatentCard({
    patent,
    index
}: {
    patent: KiprisPatent;
    index: number;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
            {/* 헤더 - 번호와 제목 */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        {index}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>
                        {patent.inventionTitle}
                    </span>
                </div>
                <span style={{
                    backgroundColor: patent.registerNumber ? '#10b981' : 'rgba(255,255,255,0.3)',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                }}>
                    {patent.registerStatus || (patent.registerNumber ? '등록' : '공개')}
                </span>
            </div>

            {/* 간략보기 본문 */}
            <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                {/* 도면 이미지 */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    flexShrink: 0,
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    {patent.drawing || patent.bigDrawing ? (
                        <img
                            src={patent.drawing || patent.bigDrawing}
                            alt="도면"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="color:#9ca3af;font-size:12px;">도면 없음</span>';
                            }}
                        />
                    ) : (
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>도면 없음</span>
                    )}
                </div>

                {/* 기본 정보 */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>출원번호</div>
                            <div style={{ color: '#6366f1', fontWeight: '600' }}>{patent.applicationNumber || '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>출원일</div>
                            <div style={{ fontWeight: '500' }}>{formatDate(patent.applicationDate)}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>등록번호</div>
                            <div>{patent.registerNumber || '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>등록일</div>
                            <div>{patent.registerDate ? formatDate(patent.registerDate) : '-'}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>출원인</div>
                            <div style={{ color: '#6366f1', fontWeight: '500' }}>{patent.applicantName || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 상세보기 토글 버튼 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    color: '#6366f1',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}
            >
                상세 정보 {isExpanded ? '▲' : '▼'}
            </button>

            {/* 상세보기 내용 */}
            {isExpanded && (
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#fafafa',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 12px', color: '#6b7280', width: '100px', verticalAlign: 'top' }}>출원인</td>
                                <td style={{ padding: '8px 12px' }}>{patent.applicantName || '-'}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#fff' }}>
                                <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>출원일</td>
                                <td style={{ padding: '8px 12px' }}>{formatDate(patent.applicationDate)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>출원번호</td>
                                <td style={{ padding: '8px 12px' }}>{patent.applicationNumber || '-'}</td>
                            </tr>
                            {patent.abstract && (
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>요약</td>
                                    <td style={{ padding: '8px 12px', lineHeight: '1.6' }}>{patent.abstract}</td>
                                </tr>
                            )}
                            <tr>
                                <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>발명의 명칭</td>
                                <td style={{ padding: '8px 12px' }}>{patent.inventionTitle}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#fff' }}>
                                <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>IPC 분류</td>
                                <td style={{ padding: '8px 12px' }}>{patent.ipcNumber || '-'}</td>
                            </tr>
                            {patent.openDate && (
                                <tr>
                                    <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>공개일</td>
                                    <td style={{ padding: '8px 12px' }}>{formatDate(patent.openDate)}</td>
                                </tr>
                            )}
                            {patent.openNumber && (
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>공개번호</td>
                                    <td style={{ padding: '8px 12px' }}>{patent.openNumber}</td>
                                </tr>
                            )}
                            <tr>
                                <td style={{ padding: '8px 12px', color: '#6b7280', verticalAlign: 'top' }}>등록상태</td>
                                <td style={{ padding: '8px 12px' }}>{patent.registerStatus || (patent.registerNumber ? '등록' : '공개')}</td>
                            </tr>
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
    const maxVisiblePages = 7;

    // 표시할 페이지 번호 계산
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            let start = Math.max(1, currentPage - halfVisible);
            let end = Math.min(totalPages, currentPage + halfVisible);

            if (currentPage <= halfVisible) {
                end = maxVisiblePages;
            } else if (currentPage >= totalPages - halfVisible) {
                start = totalPages - maxVisiblePages + 1;
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const buttonStyle = (isActive: boolean, isDisabled: boolean = false) => ({
        padding: '8px 14px',
        border: '1px solid #d1d5db',
        backgroundColor: isActive ? '#6366f1' : isDisabled ? '#f3f4f6' : '#fff',
        color: isActive ? '#fff' : isDisabled ? '#9ca3af' : '#374151',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '400',
        minWidth: '40px',
    });

    if (totalPages <= 1) return null;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginTop: '32px',
        }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={buttonStyle(false, currentPage === 1)}
            >
                &lt;
            </button>

            {getPageNumbers().map((page, idx) => (
                <button
                    key={idx}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    style={buttonStyle(page === currentPage)}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={buttonStyle(false, currentPage === totalPages)}
            >
                &gt;
            </button>
        </div>
    );
}

// 메인 페이지 컴포넌트
export default function KiprisSearchPage() {
    const [keyword, setKeyword] = useState('');
    const [ipcCode, setIpcCode] = useState('');
    const [results, setResults] = useState<KiprisPatent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastSearchKeyword, setLastSearchKeyword] = useState('');
    const [lastSearchIpc, setLastSearchIpc] = useState('');
    const numOfRows = 10;

    // 통합 모달 테스트 상태
    const [showModal, setShowModal] = useState(false);
    const [selectedInvention, setSelectedInvention] = useState<{ title: string; ipc: string } | null>(null);

    // IntegratedInventionModal 테스트용 상태
    const [showIntegratedModal, setShowIntegratedModal] = useState(false);
    const [selectedFullInvention, setSelectedFullInvention] = useState<typeof TEST_FULL_INVENTIONS[0] | null>(null);

    // OPSME 모달 테스트용 상태
    const [showOPSMEModal, setShowOPSMEModal] = useState(false);
    const [selectedOPSMEInvention, setSelectedOPSMEInvention] = useState<OPSMEInvention | null>(null);

    // Supabase에서 OPSME 데이터 로딩
    const [opsmeInventions, setOpsmeInventions] = useState<OPSMEInvention[]>([]);
    const [opsmeLoading, setOpsmeLoading] = useState(false);
    const [opsmeSearchId, setOpsmeSearchId] = useState('');

    // OPSME 데이터 검색 함수
    const searchOPSMEById = useCallback(async (inventionId: string) => {
        if (!inventionId.trim()) return;

        setOpsmeLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('kipris_search_keywords' as any)
                .select(`
                    invention_id,
                    kipris_search_keywords,
                    inventions!inner (
                        id,
                        simple_title,
                        ipc
                    )
                `)
                .ilike('invention_id', `%${inventionId}%`)
                .limit(10);

            if (error) throw error;

            const formattedData: OPSMEInvention[] = (data || []).map((item: any) => ({
                id: item.invention_id,
                title: item.inventions?.simple_title || item.invention_id,
                ipc: item.inventions?.ipc || '',
                kiprisKeywords: item.kipris_search_keywords,
            }));

            setOpsmeInventions(formattedData);
        } catch (error) {
            console.error('OPSME 데이터 로딩 실패:', error);
        } finally {
            setOpsmeLoading(false);
        }
    }, []);

    // 랜덤 OPSME 데이터 로딩
    const loadRandomOPSME = useCallback(async () => {
        setOpsmeLoading(true);
        try {
            const supabase = createClient();
            // 랜덤 offset으로 데이터 가져오기
            const randomOffset = Math.floor(Math.random() * 14400);
            const { data, error } = await supabase
                .from('kipris_search_keywords' as any)
                .select(`
                    invention_id,
                    kipris_search_keywords,
                    inventions!inner (
                        id,
                        simple_title,
                        ipc
                    )
                `)
                .range(randomOffset, randomOffset + 4);

            if (error) throw error;

            const formattedData: OPSMEInvention[] = (data || []).map((item: any) => ({
                id: item.invention_id,
                title: item.inventions?.simple_title || item.invention_id,
                ipc: item.inventions?.ipc || '',
                kiprisKeywords: item.kipris_search_keywords,
            }));

            setOpsmeInventions(formattedData);
        } catch (error) {
            console.error('OPSME 데이터 로딩 실패:', error);
        } finally {
            setOpsmeLoading(false);
        }
    }, []);

    // 초기 로딩
    useEffect(() => {
        loadRandomOPSME();
    }, [loadRandomOPSME]);

    const totalPages = Math.ceil(totalCount / numOfRows);

    const handleSearch = useCallback(async (page: number = 1, useLastSearch: boolean = false) => {
        const searchWord = useLastSearch ? lastSearchKeyword : keyword;
        const searchIpc = useLastSearch ? lastSearchIpc : ipcCode;

        if (!searchWord.trim() && !searchIpc.trim()) {
            setError('검색어를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (searchWord.trim()) params.set('word', searchWord.trim());
            if (searchIpc.trim()) params.set('ipc', searchIpc.trim());
            params.set('pageNo', page.toString());
            params.set('numOfRows', numOfRows.toString());

            const response = await fetch(`/api/kipris/search?${params.toString()}`);
            const data: KiprisSearchResponse = await response.json();

            if (data.success) {
                setResults(data.items);
                setTotalCount(data.totalCount);
                setCurrentPage(page);
                if (!useLastSearch) {
                    setLastSearchKeyword(searchWord);
                    setLastSearchIpc(searchIpc);
                }
            } else {
                setError(data.error || '검색 중 오류가 발생했습니다.');
                setResults([]);
                setTotalCount(0);
            }
        } catch (err) {
            setError('API 호출 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [keyword, ipcCode, lastSearchKeyword, lastSearchIpc, numOfRows]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        handleSearch(1, false);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            handleSearch(page, true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            {/* 헤더 */}
            <header style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                padding: '24px',
                textAlign: 'center',
            }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                    📋 KIPRIS 특허 검색 테스트
                </h1>
                <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
                    IdeaPrism용 특허 연계 모듈 테스트 페이지
                </p>
            </header>

            <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
                {/* 검색 폼 */}
                <form onSubmit={handleSubmit} style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="검색어 입력 (예: 인공지능, 우산)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            style={{
                                flex: 2,
                                minWidth: '200px',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="IPC 코드 (선택)"
                            value={ipcCode}
                            onChange={(e) => setIpcCode(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '120px',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '12px 32px',
                                backgroundColor: isLoading ? '#9ca3af' : '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            {isLoading ? '검색 중...' : '검색'}
                        </button>
                    </div>
                </form>

                {/* 통합 모달 테스트 섹션 */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    border: '2px dashed #10b981',
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                        🧪 통합 모달 테스트 (검색식 생성 + KIPRIS 검색)
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                        아래 발명품 버튼을 클릭하면 통합 검색 모달이 열립니다.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {TEST_INVENTIONS.map((inv, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedInvention(inv);
                                    setShowModal(true);
                                }}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: '4px',
                                }}
                            >
                                <span style={{ fontWeight: '600' }}>{inv.title}</span>
                                <span style={{ fontSize: '12px', opacity: 0.8 }}>IPC: {inv.ipc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 🆕 IntegratedInventionModal 테스트 섹션 */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    border: '2px dashed #6366f1',
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#6366f1' }}>
                        🚀 NEW! 발명 상세 + 특허 검색 통합 모달 테스트
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                        발명 카드를 클릭하면 발명 상세 모달이 열리고, &quot;특허 검색&quot; 버튼을 클릭하면 화면이 전환됩니다.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {TEST_FULL_INVENTIONS.map((inv) => (
                            <div
                                key={inv.id}
                                onClick={() => {
                                    setSelectedFullInvention(inv);
                                    setShowIntegratedModal(true);
                                }}
                                style={{
                                    padding: '16px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#6366f1';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* 썸네일 */}
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '8px',
                                    backgroundColor: '#e5e7eb',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {inv.drawing_url ? (
                                        <img src={inv.drawing_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px' }}>📷</span>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{
                                        margin: '0 0 4px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {inv.simple_title}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                                        <span>IPC: {inv.ipc}</span>
                                        <span>•</span>
                                        <span>{inv.grades?.name || '-'}</span>
                                    </div>
                                </div>

                                {/* 화살표 */}
                                <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🆕 OPSME 키워드 모달 테스트 섹션 */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    border: '2px dashed #f59e0b',
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                        ✨ OPSME 키워드 검색 모달 테스트 (Supabase 실제 데이터)
                    </h3>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                        OPSME (Object, Problem, Solution, Method, Effect) 구조로 키워드를 구성합니다.
                    </p>
                    <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9ca3af' }}>
                        발명품 ID로 검색하거나 랜덤 데이터를 불러올 수 있습니다.
                    </p>

                    {/* 검색 영역 */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            value={opsmeSearchId}
                            onChange={(e) => setOpsmeSearchId(e.target.value)}
                            placeholder="발명품 ID 검색 (예: elem-10001)"
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && searchOPSMEById(opsmeSearchId)}
                        />
                        <button
                            onClick={() => searchOPSMEById(opsmeSearchId)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#f59e0b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                        >
                            검색
                        </button>
                        <button
                            onClick={loadRandomOPSME}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6b7280',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                        >
                            🎲 랜덤
                        </button>
                    </div>

                    {/* 로딩 상태 */}
                    {opsmeLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                            데이터 로딩 중...
                        </div>
                    )}

                    {/* 데이터 목록 */}
                    {!opsmeLoading && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {opsmeInventions.length === 0 ? (
                                <p style={{ color: '#9ca3af', fontSize: '14px' }}>검색 결과가 없습니다.</p>
                            ) : (
                                opsmeInventions.map((inv) => (
                                    <button
                                        key={inv.id}
                                        onClick={() => {
                                            setSelectedOPSMEInvention(inv);
                                            setShowOPSMEModal(true);
                                        }}
                                        style={{
                                            padding: '12px 20px',
                                            backgroundColor: '#f59e0b',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: '4px',
                                            maxWidth: '300px',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontWeight: '600', fontSize: '13px', lineHeight: 1.3 }}>{inv.title}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>ID: {inv.id} | IPC: {inv.ipc}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #fecaca',
                    }}>
                        {error}
                    </div>
                )}

                {/* 검색 결과 요약 */}
                {totalCount > 0 && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '12px 20px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}>
                        <span style={{ color: '#6b7280' }}>총 </span>
                        <span style={{ color: '#6366f1', fontWeight: '700' }}>{totalCount.toLocaleString()}</span>
                        <span style={{ color: '#6b7280' }}> 건의 검색결과 (페이지 {currentPage}/{totalPages})</span>
                    </div>
                )}

                {/* 로딩 상태 */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #e5e7eb',
                            borderTop: '4px solid #6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px',
                        }} />
                        <p style={{ color: '#6b7280' }}>검색 중...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* 검색 결과 목록 */}
                {!isLoading && results.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {!isLoading && results.length === 0 && totalCount === 0 && keyword && !error && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        color: '#6b7280',
                    }}>
                        <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🔍</p>
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}

                {/* 페이지네이션 */}
                {!isLoading && totalCount > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </main>

            {/* 통합 모달 */}
            {showModal && selectedInvention && (
                <KiprisSearchModal
                    simpleTitle={selectedInvention.title}
                    ipc={selectedInvention.ipc}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedInvention(null);
                    }}
                />
            )}

            {/* IntegratedInventionModal 테스트 */}
            {showIntegratedModal && selectedFullInvention && (
                <IntegratedInventionModal
                    invention={selectedFullInvention}
                    onClose={() => {
                        setShowIntegratedModal(false);
                        setSelectedFullInvention(null);
                    }}
                />
            )}

            {/* OPSME 키워드 모달 테스트 */}
            {showOPSMEModal && selectedOPSMEInvention && (
                <OPSMESearchModal
                    title={selectedOPSMEInvention.title}
                    ipc={selectedOPSMEInvention.ipc}
                    kiprisKeywords={selectedOPSMEInvention.kiprisKeywords}
                    onClose={() => {
                        setShowOPSMEModal(false);
                        setSelectedOPSMEInvention(null);
                    }}
                />
            )}
        </div>
    );
}
