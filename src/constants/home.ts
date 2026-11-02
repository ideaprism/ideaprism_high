import { Settings2, Frown, AlertTriangle, Leaf, Trash2, LucideIcon } from 'lucide-react'

/**
 * 문제 유형 정의
 */
export interface ProblemType {
    value: string
    label: string
    icon: LucideIcon
    activeClass: string
    themeColor: {
        text: string
        bg: string
        border: string
        icon: string
    }
    description: string
}

/**
 * 문제 유형 목록 (아이콘, 색상 포함)
 * 메인 페이지와 필터 패널에서 사용
 */
export const PROBLEM_TYPES: ProblemType[] = [
    {
        value: '성능(불완전)',
        label: '성능(불완전)',
        icon: Settings2,
        activeClass: 'border-purple-200 bg-purple-50 text-purple-700',
        themeColor: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
        description: '기능이 불완전하거나 성능이 부족한 문제'
    },
    {
        value: '편의(불편)',
        label: '편의(불편)',
        icon: Frown,
        activeClass: 'border-amber-200 bg-amber-50 text-amber-800',
        themeColor: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
        description: '사용하기 불편하거나 접근성이 떨어지는 문제'
    },
    {
        value: '안전(위험)',
        label: '안전(위험)',
        icon: AlertTriangle,
        activeClass: 'border-red-200 bg-red-50 text-red-700',
        themeColor: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
        description: '안전하지 않거나 위험을 초래하는 문제'
    },
    {
        value: '환경(오염)',
        label: '환경(오염)',
        icon: Leaf,
        activeClass: 'border-green-200 bg-green-50 text-green-700',
        themeColor: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
        description: '환경을 오염시키거나 생태계에 해로운 문제'
    },
    {
        value: '경제성(낭비)',
        label: '경제성(낭비)',
        icon: Trash2,
        activeClass: 'border-blue-200 bg-blue-50 text-blue-700',
        themeColor: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
        description: '자원이나 비용이 낭비되는 문제'
    },
]

/**
 * 인기 검색어 목록
 * 메인 페이지 검색창에서 사용
 */
export const POPULAR_KEYWORDS = ['우산', '자전거', '태양광', '의자', '청소기']

/**
 * 비활성화 스타일 (회색톤)
 * 필터 버튼 등에서 비활성화 상태 표시에 사용
 */
export const INACTIVE_CLASS = 'border-gray-200 bg-gray-50 text-gray-500'

/**
 * 가이드 단계 타입
 * GuideModal에서 사용
 */
export type GuideStep = 'problem' | 'scamper' | 'patent'
