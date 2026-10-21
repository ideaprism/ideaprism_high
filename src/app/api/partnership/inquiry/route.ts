import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orgName?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      orgType?: string;
      purpose?: string;
    };

    const { orgName, contactName, contactEmail, contactPhone, orgType, purpose } = body;

    if (!orgName || !contactName || !contactEmail || !purpose) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    const notes = `${purpose}\n\n[기관 유형] ${orgType || '미기입'} | [연락처] ${contactPhone || '미기입'}`;

    let org;
    try {
      org = await supabaseRest('partner_organizations', {
        name: orgName,
        org_type: 'school',
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        notes: notes.substring(0, 1000),
      });
    } catch {
      org = await supabaseRest('partner_organizations', {
        name: orgName,
        org_type: 'school',
      });
    }

    const pendingCode = `대기중-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const labelInfo = [orgName, `담당: ${contactName}`, `메일: ${contactEmail}`].filter(Boolean).join(' | ');

    await supabaseRest('access_codes', {
      code: pendingCode,
      organization_id: org.id,
      label: labelInfo,
      is_active: false,
      max_usage: null,
    });

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('[Inquiry API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

