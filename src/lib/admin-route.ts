import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './admin-session';
import { isActiveAdmin } from './admin-access';
import { adminError, adminJson } from './admin-response';
import { isSameOriginRequest } from './request-origin';

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !isSameOriginRequest(request)) {
    return adminJson({ error: 'Forbidden' }, 403);
  }
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return adminJson({ error: 'Unauthorized' }, 401);
  }

  const session = await verifyAdminSessionToken(token);
  if (!session) {
    const response = adminJson({ error: 'Unauthorized' }, 401);
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  }

  try {
    if (!await isActiveAdmin(session)) return adminJson({ error: 'Unauthorized' }, 401);
  } catch (error) { return adminError(error); }
  return null;
}

