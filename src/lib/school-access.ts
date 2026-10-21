export function normalizeSchoolCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '')
}

export function findSchoolSlugByCode(
  input: string,
  codes: Record<string, string>
): string | null {
  const normalized = normalizeSchoolCode(input)
  if (!normalized) return null

  const match = Object.entries(codes).find(
    ([, code]) => normalizeSchoolCode(code) === normalized
  )
  return match?.[0] ?? null
}
