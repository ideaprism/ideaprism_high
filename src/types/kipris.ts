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
    ipcMatch?: boolean;          // 검색식 IPC와 일치 여부 (q 방식 검색에서만)
}

// 검색 응답
export interface KiprisSearchResponse {
    success: boolean;
    items: KiprisPatent[];
    totalCount: number;
    pageNo: number;
    numOfRows: number;
    error?: string;
    /** 실제로 KIPRIS에 보낸 질의 (사람이 읽는 형태) */
    appliedQuery?: string;
    /** 0건이라 조건을 줄여 다시 조회했는지 */
    relaxed?: boolean;
    /** 실제 질의에 IPC 조건을 넣었는지 (0건이면 IPC를 빼고 다시 찾음) */
    ipcApplied?: boolean;
    /** 검색식에서 읽은 IPC 코드 */
    ipc?: string | null;
    /** KIPRIS에 *, + 연산자를 그대로 보냈는지 */
    operatorMode?: boolean;
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

