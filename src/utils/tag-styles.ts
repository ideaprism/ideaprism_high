export type ProblemType = 'economic' | 'safe' | 'convenient' | 'environment' | 'other'

// Hex codes from external_assets/tailwind.config.ts
const PROBLEM_COLORS = {
    economic: "#60A5FA", // Blue - 경제성
    safe: "#F87171",     // Red - 안전
    easy: "#FBBF24",     // Yellow - 용이/편리
    perfect: "#4ADE80",  // Green - 완벽/환경
    other: "#4B5563"     // Grey - 기타
}

const SCAMPER_COLORS = {
    substitute: { bg: "#FECACA", text: "#7F1D1D" }, // Red
    combine: { bg: "#FED7AA", text: "#7C2D12" },    // Orange
    adapt: { bg: "#FEF3C7", text: "#78350F" },      // Yellow
    modify: { bg: "#D1FAE5", text: "#064E3B" },     // Green
    putToOtherUse: { bg: "#BFDBFE", text: "#1E3A8A" }, // Blue
    eliminate: { bg: "#C7D2FE", text: "#312E81" }, // Indigo
    reverse: { bg: "#DDD6FE", text: "#4C1D95" }    // Violet
}

export const getProblemColorClass = (tagName: string = '') => {
    const name = tagName.trim()

    // Style: Border + Light BG + Text (using style attribute or arbitrary values)
    // We will return class strings with arbitrary values to match exact colors

    // 환경 - Green
    if (name.includes('환경')) {
        return "border-[1px] border-[#4ADE80] bg-[#4ADE80]/10 text-[#15803D]"
    }

    // 안전 - Red
    if (name.includes('안전')) {
        return "border-[1px] border-[#F87171] bg-[#F87171]/10 text-[#B91C1C]"
    }

    // 편의 - Yellow/Amber
    if (name.includes('편리') || name.includes('편의')) {
        return "border-[1px] border-[#FBBF24] bg-[#FBBF24]/10 text-[#92400E]"
    }

    // 에너지/경제성 - Blue (경제성은 DB값)
    if (name.includes('경제') || name.includes('에너지')) {
        return "border-[1px] border-[#60A5FA] bg-[#60A5FA]/10 text-[#1D4ED8]"
    }

    // 성능 - Violet/Purple (DB NEW)
    if (name.includes('성능')) {
        return "border-[1px] border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#5B21B6]"
    }

    // 복지/사회 - removed as it's not a valid problem type per instructions
    // if (name.includes('복지') || name.includes('사회')) ...

    // 기타/Default - Gray
    return "border-[1px] border-[#9CA3AF] bg-[#9CA3AF]/10 text-[#4B5563]"
}

export const getScamperColorClass = (tagName: string = '') => {
    const name = tagName.trim()

    // SCAMPER 7가지 기법 - 빨(Red)-주(Orange)-노(Yellow)-초(Green)-파(Blue)-남(Indigo)-보(Violet)

    // S - Substitute (대체하기) - 빨간색 계열
    if (name.includes('대체')) return "bg-[#FECACA] text-[#7F1D1D]"

    // C - Combine (결합하기) - 주황색 계열
    if (name.includes('결합')) return "bg-[#FED7AA] text-[#7C2D12]"

    // A - Adapt (적용하기/응용하기) - 노란색 계열
    if (name.includes('응용') || name.includes('적용')) return "bg-[#FEF3C7] text-[#78350F]"

    // M - Modify/Magnify/Minify (변형하기) - 초록색 계열
    if (name.includes('변형') || name.includes('확대') || name.includes('축소')) return "bg-[#D1FAE5] text-[#064E3B]"

    // P - Put to other use (다르게 활용하기/다른용도로) - 파란색 계열
    if (name.includes('다르게') || name.includes('활용') || name.includes('용도') || name.includes('변경')) return "bg-[#BFDBFE] text-[#1E3A8A]"

    // E - Eliminate (제거하기) - 남색 계열
    if (name.includes('제거')) return "bg-[#C7D2FE] text-[#312E81]"

    // R - Reverse/Rearrange (뒤집기/거꾸로하기) - 보라색 계열
    if (name.includes('뒤집') || name.includes('반전') || name.includes('재배열') || name.includes('거꾸로')) return "bg-[#DDD6FE] text-[#4C1D95]"

    // Default
    return "bg-gray-100 text-gray-800"
}

// SCAMPER Label Formatter - Use original name from DB
export const getScamperLabel = (tagName: string = ''): string => {
    return tagName.trim()
}

// Helper to identify valid Problem Tags
export const isValidProblemTag = (tagName: string = ''): boolean => {
    const name = tagName.trim()
    if (!name || name === '-') return false
    if (name.includes('복지') || name.includes('사회') || name.includes('건강')) return false
    return true
}

// ========== Category 스타일 - 6종 ==========
export const getCategoryColorClass = (tagName: string = '') => {
    const name = tagName.trim()

    if (name.includes('안전')) return "border-[1px] border-[#EF4444] bg-[#EF4444]/10 text-[#B91C1C]"
    if (name.includes('복지')) return "border-[1px] border-[#EC4899] bg-[#EC4899]/10 text-[#BE185D]"
    if (name.includes('교통')) return "border-[1px] border-[#F97316] bg-[#F97316]/10 text-[#C2410C]"
    if (name.includes('교육')) return "border-[1px] border-[#3B82F6] bg-[#3B82F6]/10 text-[#1D4ED8]"
    if (name.includes('환경')) return "border-[1px] border-[#22C55E] bg-[#22C55E]/10 text-[#15803D]"
    if (name.includes('생활')) return "border-[1px] border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#5B21B6]"

    return "border-[1px] border-[#9CA3AF] bg-[#9CA3AF]/10 text-[#4B5563]"
}

// ========== 아이콘 매핑 (Lucide Icon names) ==========

// Problem Tag 아이콘 - 6종
export const getProblemIcon = (tagName: string = ''): string => {
    const name = tagName.trim()
    if (name.includes('안전')) return 'alert-triangle'
    if (name.includes('환경')) return 'cloud-off'
    if (name.includes('경제')) return 'trash-2'
    if (name.includes('편의') || name.includes('편리')) return 'frown'
    if (name.includes('성능')) return 'settings-2'
    return 'more-horizontal' // 기타
}

// SCAMPER 아이콘 - 7종
export const getScamperIcon = (tagName: string = ''): string => {
    const name = tagName.trim()
    if (name.includes('대체')) return 'replace'
    if (name.includes('결합')) return 'combine'
    if (name.includes('응용') || name.includes('적용')) return 'lightbulb'
    if (name.includes('변형')) return 'scaling'
    if (name.includes('용도') || name.includes('활용')) return 'arrow-right-left'
    if (name.includes('제거')) return 'trash-2'
    if (name.includes('거꾸로') || name.includes('뒤집')) return 'flip-horizontal-2'
    return 'circle'
}

// Category 아이콘 - 6종
export const getCategoryIcon = (tagName: string = ''): string => {
    const name = tagName.trim()
    if (name.includes('안전')) return 'shield-alert'
    if (name.includes('복지')) return 'heart-handshake'
    if (name.includes('교통')) return 'car'
    if (name.includes('교육')) return 'graduation-cap'
    if (name.includes('환경')) return 'trees'
    if (name.includes('생활')) return 'home'
    return 'folder'
}

// SDG 아이콘 URL - 통계청 공식 한글 아이콘
export const getSDGIconUrl = (sdgNumber: number): string => {
    if (sdgNumber >= 1 && sdgNumber <= 17) {
        return `https://www.index.go.kr/potal/sdg/images/main/ko/${sdgNumber}.png`
    }
    return ''
}

// SDG 색상 (공식)
export const getSDGColor = (sdgNumber: number): string => {
    const colors: Record<number, string> = {
        1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
        6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
        11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
        16: '#00689D', 17: '#19486A'
    }
    return colors[sdgNumber] || '#9CA3AF'
}

