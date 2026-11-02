/**
 * 발명품(Invention) 핵심 데이터 타입 정의
 * 지노 수석: 프로젝트 전반에서 사용하는 발명품 데이터의 정합성을 위해 정의했습니다.
 */
export interface Invention {
    id: string;
    simple_title: string;
    simple_summary: string;
    drawing_url?: string;
    sdg?: string;
    scamper?: string;
    problem_tag?: string;
    grade_id?: number;
    category_id?: number;
}
