-- 긴급 보안: 아무 SQL이나 실행하는 함수를 익명·로그인 사용자에게서 회수
--
-- 문제 (2026-10-27 Supabase 보안 점검에서 발견):
--   public.exec_sql(text), public.exec_sql_v3(text) 는 SECURITY DEFINER(소유자 postgres 권한)로
--   받은 문자열을 그대로 EXECUTE 한다. anon·authenticated에 EXECUTE 권한이 있어
--   브라우저에 공개된 publishable 키만으로 /rest/v1/rpc/exec_sql_v3 를 호출해
--   테이블 조회·수정·삭제(DROP 포함)가 가능한 상태였다.
--
-- 조치: PUBLIC·anon·authenticated의 EXECUTE 권한 회수. 함수 자체는 남겨 두고
--   service_role(서버 전용)과 postgres만 실행 가능하게 한다. 되돌리려면 grant execute.
--
-- 영향: 앱(src/)은 이 함수를 쓰지 않음. scripts/upload-csv-rpc.ts(일회성 데이터 업로드)는
--   anon 키로 exec_sql_v3를 호출하므로 이후에는 service_role 키나 SQL Editor로 실행해야 함.

do $$
declare
  fn text;
begin
  foreach fn in array array['public.exec_sql(text)', 'public.exec_sql_v3(text)'] loop
    if to_regprocedure(fn) is null then
      raise notice 'skip (없음): %', fn;
      continue;
    end if;
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;

-- 확인: anon_exec, auth_exec 가 모두 false 여야 함
select p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('exec_sql', 'exec_sql_v3');
