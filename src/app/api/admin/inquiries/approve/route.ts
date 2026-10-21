import { NextRequest, NextResponse } from 'next/server';
import { createPartnerAndCode } from '@/utils/admin/partner-actions';
import { requireAdmin } from '@/lib/admin-route';

/**
 * Approve partnership inquiry and issue an access code.
 * POST /api/admin/inquiries/approve
 * Body: { inquiryId: string }
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as { inquiryId?: string };
    const { inquiryId } = body;

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const result = await createPartnerAndCode(inquiryId);

    return NextResponse.json({
      success: true,
      message: 'Partner approved and code generated successfully',
      data: result,
    });
  } catch (error) {
    console.error('[Admin Approve Error]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

