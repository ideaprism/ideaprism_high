-- =====================================================================
-- RLS(행 수준 보안) 점검 — 읽기 전용. 데이터·설정을 바꾸지 않는다.
-- 실행: Supabase 대시보드 → SQL Editor → 붙여넣고 Run (3개 쿼리 결과 확인)
-- 작성: 2026-10-27 [회사]
--
-- 기대 상태
--   공개 읽기 테이블 : inventions, grades, categories, keyword_dictionary,
--                      ipc_descriptions, kipris_search_keywords
--                      → RLS 켜짐 + anon/authenticated SELECT 정책만
--   비공개 테이블    : access_codes, partner_organizations, partnership_inquiries,
--                      search_attempt_logs, bot_settings
--                      → RLS 켜짐 + anon 정책 없음 (서버가 secret 키로만 접근)
-- =====================================================================

-- [1] 테이블별 RLS 켜짐 여부 (rls_enabled = false 면 anon 키로 누구나 읽기·쓰기 가능)
select
  c.relname                      as table_name,
  c.relrowsecurity               as rls_enabled,
  c.relforcerowsecurity          as rls_forced,
  case
    when c.relname in ('inventions','grades','categories','keyword_dictionary',
                       'ipc_descriptions','kipris_search_keywords') then '공개 읽기'
    when c.relname in ('access_codes','partner_organizations','partnership_inquiries',
                       'search_attempt_logs','bot_settings') then '비공개'
    else '확인 필요'
  end                            as expected
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by expected, table_name;

-- [2] 정책 목록 — anon·public 대상 쓰기 정책(INSERT/UPDATE/DELETE/ALL)이 있으면 위험
select
  tablename,
  policyname,
  cmd,
  roles,
  qual        as using_expr,
  with_check  as check_expr,
  case
    when cmd in ('INSERT','UPDATE','DELETE','ALL')
         and (roles && array['anon','public']::name[]) then '⚠️ 익명 쓰기 허용'
    when cmd = 'SELECT'
         and (roles && array['anon','public']::name[])
         and tablename in ('access_codes','partner_organizations','partnership_inquiries',
                           'search_attempt_logs','bot_settings') then '⚠️ 비공개 테이블 익명 읽기'
    else ''
  end         as risk
from pg_policies
where schemaname = 'public'
order by risk desc, tablename, cmd;

-- [3] anon 역할의 테이블 권한 (RLS가 꺼진 테이블에서 이 권한이 그대로 적용됨)
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as anon_privileges
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
group by table_name
order by table_name;

-- ---------------------------------------------------------------------
-- 결과 해석 메모
-- - search_attempt_logs: 마이그레이션 20260328094621에 "Anyone can insert"(INSERT true),
--   "Admins can view"(SELECT true) 정책이 있음 → 익명 읽기·쓰기 모두 열려 있을 가능성 높음
-- - access_codes: /api/auth/verify-code 가 anon 키로 usage_count 를 UPDATE 함.
--   anon UPDATE 정책이 있으면 누구나 코드 테이블 수정 가능 → 정책 제거 후
--   해당 API를 secret 키 서버 클라이언트로 바꿔야 함 (현재 API는 꺼져 있음)
-- - 수정은 이 파일에서 하지 않는다. 결과를 보고 supabase/migrations/ 에 별도 마이그레이션으로.
-- ---------------------------------------------------------------------
