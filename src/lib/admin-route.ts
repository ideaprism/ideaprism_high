import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './admin-session';
import { isActiveAdmin } from './admin-access';
import { adminError, adminJson } from './admin-response';

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin && origin !== request.nextUrl.origin) {
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

