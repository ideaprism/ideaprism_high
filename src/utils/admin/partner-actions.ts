import { createClient } from '@/utils/supabase/server'

/**
 * 파트너 기관 등록 및 액세스 코드 생성 유틸리티
 */
export async function createPartnerAndCode(inquiryId: string) {
    const supabase = await createClient()

    // 1. 문의 내역 정보 가져오기
    const { data: inquiry, error: inquiryError } = await supabase
        .from('partnership_inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single()

    if (inquiryError || !inquiry) {
        throw new Error('Inquiry not found')
    }

    // 2. 파트너 기관 생성 (이미 있으면 생략하거나 업데이트하는 로직 필요할 수 있음)
    const { data: org, error: orgError } = await supabase
        .from('partner_organizations')
        .insert([
            {
                name: inquiry.org_name,
                org_type: 'school', // 기본값
                contact_name: inquiry.contact_name,
                contact_email: inquiry.contact_email,
                // contact_phone: inquiry.contact_phone, // 스키마 동기화 문제 우회를 위해 주석 처리
                notes: `[승인: ${inquiryId}] 입력된 연락처: ${inquiry.contact_phone || '없음'}`
            }
        ])
        .select()
        .single()

    if (orgError) throw orgError

    // 3. 액세스 코드 생성 (랜덤 문자열 조합)
    const generatedCode = generateRandomCode(inquiry.org_name)
    
    const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .insert([
            {
                code: generatedCode,
                organization_id: org.id,
                label: `${inquiry.org_name} 공식 코드`,
                is_active: true
            }
        ])
        .select()
        .single()

    if (codeError) throw codeError

    // 4. 문의 상태 업데이트
    await supabase
        .from('partnership_inquiries')
        .update({ status: 'approved', admin_notes: `Auto-approved. OrgID: ${org.id}, Code: ${generatedCode}` })
        .eq('id', inquiryId)

    return { org, code: codeData }
}

function generateRandomCode(orgName: string) {
    // 기관명에서 첫 글자 추출 (한글인 경우 영문 변환 생략하고 간단히 랜덤 조합)
    const prefix = "PRISM"
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${randomSuffix}`
}
