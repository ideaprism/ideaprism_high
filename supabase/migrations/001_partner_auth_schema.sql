-- =============================================
-- 1. partner_organizations (파트너 기관 마스터)
-- =============================================
CREATE TABLE IF NOT EXISTS partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- 기관명 (예: '서울과학고등학교')
  org_type TEXT NOT NULL DEFAULT 'school',      -- 'school' | 'academy' | 'government' | 'corporate'
  region TEXT,                                  -- 지역 (예: '서울특별시')
  contact_name TEXT,                            -- 담당자 이름
  contact_email TEXT,                           -- 담당자 이메일
  contact_phone TEXT,                           -- 담당자 연락처
  max_seats INTEGER DEFAULT 100,                -- 최대 사용자 수
  is_active BOOLEAN DEFAULT true,               -- 활성 여부
  partnership_start DATE,                       -- 파트너십 시작일
  partnership_end DATE,                         -- 파트너십 종료일
  notes TEXT,                                   -- 관리자 메모
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. access_codes (기관별 고유 코드)
-- =============================================
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                    -- 고유 인증 코드 (예: 'SGH-2026-SPRING')
  organization_id UUID NOT NULL REFERENCES partner_organizations(id) ON DELETE CASCADE,
  label TEXT,                                   -- 코드 라벨 (예: '2026 상반기')
  is_active BOOLEAN DEFAULT true,               -- 코드 활성 상태
  usage_count INTEGER DEFAULT 0,                -- 사용 횟수 추적
  max_usage INTEGER,                            -- 최대 사용 가능 횟수 (NULL = 무제한)
  expires_at TIMESTAMPTZ,                       -- 만료일 (NULL = 무기한)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_org ON access_codes(organization_id);

-- =============================================
-- 3. search_attempt_logs (검색 시도 로그 - 마케팅 데이터)
-- =============================================
CREATE TABLE IF NOT EXISTS search_attempt_logs (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,                        -- 시도한 검색어
  is_authenticated BOOLEAN DEFAULT false,        -- 인증 여부
  organization_id UUID REFERENCES partner_organizations(id),
  access_code TEXT,                             -- 사용한 접근 코드
  ip_address TEXT,                              -- IP (선택)
  user_agent TEXT,                              -- UA (선택)
  blocked_reason TEXT,                          -- 차단 사유 ('whitelist' | 'expired' | etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_attempt_logs(keyword);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_attempt_logs(created_at DESC);

-- =============================================
-- 4. partnership_inquiries (파트너십 신청)
-- =============================================
CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,                       -- 기관명
  contact_name TEXT NOT NULL,                   -- 담당자명
  contact_email TEXT NOT NULL,                  -- 이메일
  contact_phone TEXT,                           -- 연락처
  purpose TEXT NOT NULL,                        -- 활용 목적
  student_count INTEGER,                        -- 예상 학생 수
  message TEXT,                                 -- 추가 메시지
  status TEXT DEFAULT 'pending',                -- 'pending' | 'contacted' | 'approved' | 'rejected'
  admin_notes TEXT,                             -- 관리자 메모
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 5. SEED: 테스트용 기관 및 코드
-- =============================================
-- 중복 삽입 방지를 위해 존재하지 않을 때만 삽입하는 로직 (선택적 사용)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM partner_organizations WHERE name = '데모 학교') THEN
        INSERT INTO partner_organizations (name, org_type, region, contact_name, contact_email) 
        VALUES ('데모 학교', 'school', '서울특별시', '홍길동', 'demo@school.kr');
        
        INSERT INTO access_codes (code, organization_id, label) 
        VALUES ('DEMO-2026', (SELECT id FROM partner_organizations WHERE name = '데모 학교'), '데모용 접근 코드');
    END IF;
END $$;
