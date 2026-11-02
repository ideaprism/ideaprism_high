import type { AdminCode } from './admin-db'

/** Shared account state checks; safe to use in administrator UI and server routes. */
export function codeIsActive(code: AdminCode): boolean {
  const expiry = code.expires_at === null ? Infinity : Date.parse(code.expires_at)
  return Boolean(code.is_active && code.partner_organizations?.is_active && expiry > Date.now())
}

export function codeIsUsable(code: AdminCode): boolean {
  return codeIsActive(code) && (code.max_usage === null || (code.usage_count ?? 0) < code.max_usage)
}
