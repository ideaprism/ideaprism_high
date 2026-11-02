/**
 * KIPRIS Plus API 타입 정의
 * 특허 검색 모듈에서 사용하는 인터페이스
 */

// API 요청 파라미터
export interface KiprisSearchParams {
    word: string;        // 검색어 (필수)
    ipc?: string;        // IPC 코드
    numOfRows?: number;  // 페이지당 결과 수 (기본: 10)
    pageNo?: number;     // 페이지 번호 (기본: 1)
}

// 개별 특허 정보
export interface KiprisPatent {
    indexNo?: number;            // 순번
    inventionTitle: string;      // 발명의 명칭
    applicationNumber: string;   // 출원번호
    applicationDate: string;     // 출원일자
    openNumber?: string;         // 공개번호
    openDate?: string;           // 공개일자
    registerNumber?: string;     // 등록번호
    registerDate?: string;       // 등록일자
    registerStatus?: string;     // 등록상태 (공개/등록)
    ipcNumber: string;           // IPC 번호
    applicantName: string;       // 출원인
    abstract?: string;           // 초록
    bigDrawing?: string;         // 대표도면 URL
    drawing?: string;            // 도면 URL
}

// 검색 응답
export interface KiprisSearchResponse {
    success: boolean;
    items: KiprisPatent[];
    totalCount: number;
    pageNo: number;
    numOfRows: number;
    error?: string;
}

// 원본 XML 파싱 후 item 구조
export interface KiprisRawItem {
    indexNo?: string;
    inventionTitle?: string;
    applicationNumber?: string;
    applicationDate?: string;
    openNumber?: string;
    openDate?: string;
    registerNumber?: string;
    registerDate?: string;
    registerStatus?: string;
    ipcNumber?: string;
    applicantName?: string;
    astrtCont?: string;
    abstract?: string;
    bigDrawing?: string;
    drawing?: string;
}

