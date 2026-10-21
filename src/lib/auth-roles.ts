const ADMIN_ORG_TYPES = new Set(['admin', 'master_admin', 'super_admin']);

export function isAdminOrgType(orgType: string | null | undefined): boolean {
  if (!orgType) return false;
  return ADMIN_ORG_TYPES.has(orgType.toLowerCase());
}

