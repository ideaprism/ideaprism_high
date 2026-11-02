/** Server-side REST access. Import only from server components and route handlers. */
export class AdminDbError extends Error {
  constructor(public status: number, public code?: string) { super('관리자 데이터 요청에 실패했습니다.') }
}

export function adminDbConfigured() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY))
}

async function adminResponse(table: string, query: Record<string, string> = {}, init: RequestInit = {}) {
  if (typeof window !== 'undefined') throw new Error('Server-only operation')
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !key) throw new AdminDbError(503, 'configuration')
  const url = new URL(`/rest/v1/${table}`, base)
  url.search = new URLSearchParams(query).toString()
  const response = await fetch(url, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(20_000),
    headers: { apikey: key, ...(!key.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json',
      Prefer: 'return=representation', ...init.headers },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new AdminDbError(response.status, data?.code)
  }
  return response
}
export async function adminDb<T>(table: string, query: Record<string, string> = {}, init: RequestInit = {}): Promise<T> {
  const response = await adminResponse(table, query, init)
  return await response.json().catch(() => null) as T
}
export async function adminCount(table: string, query: Record<string, string> = {}): Promise<number> {
  const response = await adminResponse(table, { select: 'id', ...query }, { method: 'HEAD', headers: { Prefer: 'count=exact' } })
  const count = Number(response.headers.get('content-range')?.split('/')[1])
  if (!Number.isSafeInteger(count) || count < 0) throw new AdminDbError(502, 'missing_count')
  return count
}

export interface AdminCode {
  id: string; code: string; organization_id: string; is_active: boolean | null;
  expires_at: string | null; max_usage: number | null; usage_count: number | null;
  label: string | null; created_at: string | null;
  partner_organizations: { id: string; name: string; org_type: string; is_active: boolean | null; region: string | null } | null;
}
export const CODE_COLUMNS = 'id,code,organization_id,is_active,expires_at,max_usage,usage_count,label,created_at,partner_organizations(id,name,org_type,is_active,region)'
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const CODE_PATTERN = /^[A-Z0-9_-]{4,128}$/

export function codeIsActive(code: AdminCode): boolean {
  const expiry = code.expires_at === null ? Infinity : Date.parse(code.expires_at)
  return Boolean(code.is_active && code.partner_organizations?.is_active && expiry > Date.now())
}
export function codeIsUsable(code: AdminCode): boolean {
  return codeIsActive(code) && (code.max_usage === null || (code.usage_count ?? 0) < code.max_usage)
}
