import { parseSearchQuery } from './search-parser';

export interface SearchRequest {
  keyword: string;
  limit: number;
  guestMode: boolean;
}

/** Validate untrusted JSON before building filters or contacting the database. */
export function parseSearchRequest(input: unknown): SearchRequest | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  const keyword = body.keyword ?? '';
  const limit = body.limit ?? 15;
  const guestMode = body.guestMode ?? false;
  if (typeof keyword !== 'string' || keyword.length > 500) return null;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 500) return null;
  if (typeof guestMode !== 'boolean') return null;
  if (body.page !== undefined && (typeof body.page !== 'number' || !Number.isInteger(body.page) || body.page < 1)) return null;
  const trimmed = keyword.trim();
  if (/[*+()"]/.test(trimmed) && !parseSearchQuery(trimmed)) return null;
  return { keyword: trimmed, limit, guestMode };
}
