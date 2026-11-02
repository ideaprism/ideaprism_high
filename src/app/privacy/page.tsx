import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { OPERATOR, LEGAL_EFFECTIVE_DATE, SITE_NAME_KO } from '@/constants/site'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME_KO}(IdeaPrism) 개인정보처리방침`,
}

export default function PrivacyPage() {
  return (
    <LegalDocument title="개인정보처리방침" effectiveDate={LEGAL_EFFECTIVE_DATE}>
      <p className="text-on-surface-variant">
        {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)는 {SITE_NAME_KO}(IdeaPrism, 이하 &lsquo;서비스&rsquo;)를 이용하는
        학생·교사·보호자의 개인정보를 소중히 여기며, 「개인정보 보호법」을 지킵니다. 서비스는 관리자가 발급한 계정 코드로
        이용할 수 있으며, 로그인할 때 학생의 이름·연락처를 입력받지 않습니다. 관리자가 계정 코드를
        관리할 때에는 기관 담당자 이름과 이메일을 입력할 수 있습니다.
      </p>

      <LegalSection title="1. 처리하는 정보와 목적">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 text-left">
              <th className="py-2 pr-3 font-semibold text-on-surface">구분</th>
              <th className="py-2 pr-3 font-semibold text-on-surface">항목</th>
              <th className="py-2 font-semibold text-on-surface">목적</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-b border-outline-variant/20"><td className="py-2 pr-3">발명 자료</td><td className="py-2 pr-3">제공받은 수상작의 학생명, 학교명, 수상 당시 학년, 작품 내용과 사진</td><td className="py-2">해당 학교에 연결된 계정의 발명 탐구·검색</td></tr>
            <tr className="border-b border-outline-variant/20">
              <td className="py-2 pr-3">자동 생성 정보</td>
              <td className="py-2 pr-3">접속 기록(IP 주소, 브라우저 종류, 접속 시각), 방문한 페이지</td>
              <td className="py-2">서비스 운영·보안, 장애 대응</td>
            </tr>
            <tr className="border-b border-outline-variant/20">
              <td className="py-2 pr-3">학교 인증</td>
              <td className="py-2 pr-3">발급 계정 코드, 계정·학교 식별자, 세션 버전과 만료 시각을 담은 서명 쿠키</td>
              <td className="py-2">계정 확인 및 소속 학교 자료 접근 통제</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">기관 운영 관리</td>
              <td className="py-2 pr-3">기관명, 담당자 이름·이메일(관리자가 입력한 경우), 관리자 인증 쿠키</td>
              <td className="py-2">기관 코드 발급·관리와 관리자 접근 확인</td>
            </tr>
          </tbody>
        </table>
        <p>검색창에는 이름, 전화번호 같은 개인정보를 입력하지 마세요. 검색어를 이용 통계 서비스로 전송하지 않으며 AI 도우미는 제공하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="2. 만 14세 미만 아동의 개인정보">
        <p>
          서비스는 고등학교용 발명 자료 서비스입니다. 운영자는 만 14세 미만 아동의 개인정보를 수집하지
          않습니다. 앞으로 개인정보를 수집하는 기능을 추가할 경우, 법에 따라 법정대리인(보호자)의 동의를
          먼저 받습니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 보유 기간과 파기">
        <p>
          접속 기록은 호스팅 서비스의 보관 정책에 따라 일정 기간이 지나면 자동으로 삭제됩니다. 학교 인증
          쿠키는 발급 후 12시간 동안 유효하며 나가기를 누르면 삭제됩니다. 목적을 달성한 정보는 복구할 수 없는 방법으로
          파기합니다.
        </p>
      </LegalSection>

      <LegalSection title="4. 브라우저 저장 정보">
        <p>
          서비스는 광고·추적용 쿠키를 쓰지 않습니다. 학교 인증에는 자바스크립트로 읽을 수 없는 HttpOnly 쿠키를
          사용합니다. 쿠키에는 계정 식별자, 학교, 세션 버전과 만료 시각이 포함되며 계정 코드 원문은 포함하지 않습니다.
          유효 기간은 12시간이며, 나가기 버튼이나 브라우저 설정에서 지울 수 있습니다.
          관리자 인증에는 별도 HttpOnly 쿠키를 사용하며 유효 기간은 8시간입니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 외부 서비스 이용 (처리 위탁 및 국외 이전)">
        <ul className="list-disc pl-5 space-y-1">
          <li>발명 자료·사진과 계정 정보는 운영 서버의 비공개 저장소에서 관리합니다.</li>

          <li>
            한국특허정보원 KIPRIS Plus: 특허 검색. 이용자가 특허 검색을 하면 검색 키워드만 전달되며 개인정보는
            전달되지 않습니다.
          </li>
        </ul>
        <p>운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="6. 이용자의 권리">
        <p>
          이용자와 보호자는 운영자가 처리하는 자신의 정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수
          있습니다. 아래 연락처로 요청하시면 지체 없이 조치합니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 개인정보 보호책임자">
        <ul className="list-none space-y-1">
          <li>운영자: {OPERATOR.name}</li>
          <li>개인정보 보호책임자: {OPERATOR.privacyOfficer}</li>
          <li>이메일: {OPERATOR.email}</li>
          <li>전화: {OPERATOR.phone}</li>
        </ul>
        <p>
          개인정보 침해에 대한 상담은 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr)에도 할 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection title="8. 방침의 변경">
        <p>이 방침을 바꾸는 경우 시행 7일 전부터 서비스 화면에 알립니다.</p>
      </LegalSection>
    </LegalDocument>
  )
}
