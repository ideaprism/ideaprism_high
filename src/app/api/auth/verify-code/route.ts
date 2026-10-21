import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isAdminOrgType,
} from '@/lib/admin-session';

/**
 * Access code verification API
 * POST /api/auth/verify-code
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body as { code?: string };
    const normalizedCode = code?.trim().toUpperCase();

    if (!normalizedCode) {
      return NextResponse.json(
        {
          valid: false,
          error: 'no_code',
          message: '인증 코드를 입력해 주세요.',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: codeData, error: codeError } = await supabase
      .from('access_codes')
      .select(
        `
          *,
          partner_organizations (
            id,
            name,
            org_type,
            region,
            is_active
          )
        `
      )
      .eq('code', normalizedCode)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        {
          valid: false,
          error: 'invalid_code',
          message: '유효하지 않은 코드입니다. 다시 확인해 주세요.',
        },
        { status: 200 }
      );
    }

    const org = codeData.partner_organizations;
    const now = new Date();

    if (org && !org.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'inactive_org',
        message: '해당 기관은 현재 활성 상태가 아닙니다.',
      });
    }

    if (!codeData.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'inactive_code',
        message: '만료되었거나 비활성화된 코드입니다.',
      });
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < now) {
      return NextResponse.json({
        valid: false,
        error: 'expired_code',
        message: '사용 기한이 만료된 코드입니다.',
      });
    }

    if (codeData.max_usage && (codeData.usage_count || 0) >= codeData.max_usage) {
      return NextResponse.json({
        valid: false,
        error: 'limit_exceeded',
        message: '사용 횟수를 초과한 코드입니다.',
      });
    }

    await supabase
      .from('access_codes')
      .update({ usage_count: (codeData.usage_count || 0) + 1 })
      .eq('id', codeData.id);

    const response = NextResponse.json({
      valid: true,
      organization: {
        id: org.id,
        name: org.name,
        orgType: org.org_type,
        region: org.region,
      },
      codeLabel: codeData.label,
    });

    if (isAdminOrgType(org.org_type)) {
      const adminToken = await createAdminSessionToken({
        orgId: org.id,
        orgName: org.name,
        orgType: org.org_type,
      });

      response.cookies.set(ADMIN_SESSION_COOKIE, adminToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8,
      });
    } else {
      response.cookies.delete(ADMIN_SESSION_COOKIE);
    }

    return response;
  } catch (error) {
    console.error('[VerifyCode API Error]:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'server_error',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      },
      { status: 500 }
    );
  }
}
