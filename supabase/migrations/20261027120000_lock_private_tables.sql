-- =====================================================================
-- 비공개 테이블 익명 접근 차단
-- 작성: 2026-10-27 [회사]
--
-- 배경 (scripts/rls-anon-check.mjs 실측, 2026-10-27)
--   anon(공개) 키로 아래 테이블을 읽을 수 있었음
--     access_codes          : 기관 인증코드 (관리자 코드 포함 가능)
--     partner_organizations : 기관 담당자 이름·이메일·전화 (개인정보)
--     bot_settings          : 챗봇 프롬프트·설정
--
-- 영향
--   - 서비스 화면(검색·특허검색)은 이 테이블을 쓰지 않음 → 영향 없음
--   - /api/admin/* 는 secret 키(service_role)를 써서 RLS를 우회 → 영향 없음
--   - 브라우저에서 anon 키로 직접 읽던 곳(어드민 화면, 챗봇 설정 패널, verify-code)은
--     현재 모두 비활성. 다시 켤 때는 서버 API(secret 키)를 거치도록 바꿔야 함
--
-- 실행: Supabase 대시보드 → SQL Editor → 전체 붙여넣고 Run
-- 확인: node --use-system-ca scripts/rls-anon-check.mjs → "비공개 테이블 익명 읽기 차단 확인"
-- 되돌리기: 맨 아래 주석 참고
-- =====================================================================

do $$
declare
  t text;
  p record;
begin
  foreach t in array array['access_codes', 'partner_organizations', 'partnership_inquiries',
                           'search_attempt_logs', 'bot_settings']
  loop
    -- 테이블이 없으면 건너뜀 (search_attempt_logs 는 현재 DB에 없음: 404)
    if to_regclass('public.' || t) is null then
      raise notice '건너뜀(테이블 없음): %', t;
      continue;
    end if;

    -- 1) RLS 켜기
    execute format('alter table public.%I enable row level security', t);

    -- 2) 기존 정책 모두 제거 (anon·authenticated 대상 허용 정책 포함)
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
      raise notice '정책 삭제: %.%', t, p.policyname;
    end loop;

    -- 3) anon·authenticated 테이블 권한 회수 (RLS와 이중 방어)
    execute format('revoke all on table public.%I from anon, authenticated', t);

    raise notice '잠금 완료: %', t;
  end loop;
end $$;

-- 결과 확인 (rls_enabled 가 모두 true, 정책 0개여야 함)
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('access_codes','partner_organizations','partnership_inquiries','search_attempt_logs','bot_settings')
order by 1;

-- ---------------------------------------------------------------------
-- 되돌리기 (필요할 때만, 테이블별로)
--   grant select on table public.access_codes to anon, authenticated;
--   alter table public.access_codes disable row level security;
-- ---------------------------------------------------------------------
