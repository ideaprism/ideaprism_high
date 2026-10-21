import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-route';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

async function supabaseRest(table: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing server configuration');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || JSON.stringify(data));
  }

  return Array.isArray(data) ? data[0] : data;
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      orgName?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      customCode?: string;
    };
    const { orgName, contactName, contactEmail, contactPhone, customCode } = body;

    if (!orgName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    let org;
    try {
      org = await supabaseRest('partner_organizations', {
        name: orgName,
        org_type: 'school',
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        notes: `[Direct Issuance] ${contactName || ''} / ${contactPhone || ''} / ${contactEmail || ''}`,
      });
    } catch {
      org = await supabaseRest('partner_organizations', {
        name: orgName,
        org_type: 'school',
      });
    }

    const generatedCode =
      customCode?.trim() || `PRISM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const labelInfo = [
      orgName,
      contactName ? `담당: ${contactName}` : '',
      contactPhone ? `연락처: ${contactPhone}` : '',
      contactEmail ? `이메일: ${contactEmail}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const codeData = await supabaseRest('access_codes', {
      code: generatedCode,
      organization_id: org.id,
      label: labelInfo,
      is_active: true,
      max_usage: null,
    });

    return NextResponse.json({
      success: true,
      data: { org, code: codeData },
    });
  } catch (error) {
    console.error('[Admin Direct Issue Error]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

