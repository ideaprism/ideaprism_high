import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { OPERATOR, LEGAL_EFFECTIVE_DATE, SITE_NAME_KO } from '@/constants/site'

export const metadata: Metadata = {
  title: '이용약관',
  description: `${SITE_NAME_KO}(IdeaPrism) 이용약관`,
}

export default function TermsPage() {
  return (
    <LegalDocument title="이용약관" effectiveDate={LEGAL_EFFECTIVE_DATE}>
      <LegalSection title="제1조 (목적)">
        <p>
          이 약관은 {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)가 제공하는 {SITE_NAME_KO}(IdeaPrism, 이하
          &lsquo;서비스&rsquo;)의 이용 조건과 절차를 정합니다.
        </p>
      </LegalSection>

      <LegalSection title="제2조 (서비스 내용)">
        <ul className="list-disc pl-5 space-y-1">
          <li>학생발명대회 수상작을 학생 눈높이로 풀어 쓴 발명 데이터 검색</li>
          <li>문제 유형·SCAMPER 기법 등 분류 필터를 이용한 아이디어 탐색</li>
          <li>발명 내용을 바탕으로 한 특허 검색식 작성과 특허 검색 결과 보기</li>
        </ul>
        <p>학교 코드를 인증한 학생·교사에게 학교별 화면을 제공합니다.</p>
      </LegalSection>

      <LegalSection title="제3조 (콘텐츠의 출처와 권리)">
        <p>
          발명 데이터는 공공데이터포털·KIPRIS Plus 등에 공개된 학생발명대회 자료를 바탕으로 운영자가 쉬운
          말로 다시 쓰고 분류한 것입니다. 원 발명의 권리는 각 발명자에게 있고, 특허 정보의 권리는 특허청과
          한국특허정보원에 있습니다.
        </p>
        <p>
          이용자는 학습과 연구 목적으로 서비스 내용을 자유롭게 참고할 수 있습니다. 다만 데이터를 대량으로
          내려받거나 다른 서비스에 다시 배포하려면 운영자와 미리 협의해야 합니다.
        </p>
      </LegalSection>

      <LegalSection title="제4조 (정보의 정확성)">
        <p>
          서비스의 발명 요약, 분류, 특허 검색식은 학습을 돕는 참고 자료입니다. 특허 등록 가능성이나 권리
          침해 여부에 대한 법적 판단이 아닙니다. 실제 출원 전에는 변리사 등 전문가의 확인을 받으세요.
        </p>
      </LegalSection>

      <LegalSection title="제5조 (이용자의 의무)">
        <ul className="list-disc pl-5 space-y-1">
          <li>자동화 프로그램으로 데이터를 대량 수집하거나 서버에 과도한 부담을 주는 행위 금지</li>
          <li>서비스의 정상적인 운영을 방해하는 행위 금지</li>
          <li>기관 인증코드를 발급받은 기관 밖으로 공유하는 행위 금지</li>
        </ul>
      </LegalSection>

      <LegalSection title="제6조 (서비스의 변경과 중단)">
        <p>
          운영자는 서비스 개선이나 점검을 위해 서비스 내용을 바꾸거나 일시 중단할 수 있으며, 가능한 한 미리
          알립니다.
        </p>
      </LegalSection>

      <LegalSection title="제7조 (개인정보 보호)">
        <p>
          개인정보 처리에 관한 사항은{' '}
          <Link href="/privacy" className="text-primary font-semibold hover:underline">
            개인정보처리방침
          </Link>
          을 따릅니다.
        </p>
      </LegalSection>

      <LegalSection title="제8조 (문의)">
        <p>서비스 이용 문의: {OPERATOR.email} / {OPERATOR.phone}</p>
      </LegalSection>
    </LegalDocument>
  )
}
