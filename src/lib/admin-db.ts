import { localAdminQuery } from './local-auth-store'
import { postgresAdminQuery } from './postgres-auth-store'
/** Server-only local account repository; no Supabase/network dependency. */
export class AdminDbError extends Error {
  constructor(public status: number, public code?: string) { super('관리자 데이터 요청에 실패했습니다.') }
}

export function adminDbConfigured() {
  return true
}

export async function adminDb<T>(table: string, query: Record<string, string> = {}, init: RequestInit = {}): Promise<T> {
  try { return (process.env.DATABASE_URL ? await postgresAdminQuery(table, query, init) : localAdminQuery(table, query, init)) as T }
  catch (error) {
    if (error instanceof Error && (error.message.includes('UNIQUE constraint') || ('code' in error && error.code === '23505'))) throw new AdminDbError(409, '23505')
    throw error
  }
}
export async function adminCount(table: string, query: Record<string, string> = {}): Promise<number> {
  return (await adminDb<unknown[]>(table, query)).length
}

export interface AdminCode {
  id: string; code: string; organization_id: string; is_active: boolean | null;
  expires_at: string | null; max_usage: number | null; usage_count: number | null;
  label: string | null; created_at: string | null; session_version: number;
  partner_organizations: { id: string; name: string; org_type: string; school_id: string | null; is_active: boolean | null; region: string | null } | null;
}
export const CODE_COLUMNS = 'id,code,organization_id,is_active,expires_at,max_usage,usage_count,label,created_at,partner_organizations(id,name,org_type,is_active,region)'
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const CODE_PATTERN = /^[A-Z0-9_-]{4,128}$/

export { codeIsActive, codeIsUsable } from './access-code-status'
