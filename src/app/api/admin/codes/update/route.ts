import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-route';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing server configuration' }, { status: 500 });
  }

  try {
    const { codeId, newCode } = (await request.json()) as { codeId?: string; newCode?: string };
    if (!codeId || !newCode) {
      return NextResponse.json({ error: 'Code ID and new code are required' }, { status: 400 });
    }

    const normalizedCode = newCode.toUpperCase().trim();
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/access_codes?code=eq.${normalizedCode}`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const existing = (await checkRes.json()) as Array<{ id: string }>;

    if (existing.length > 0 && existing[0].id !== codeId) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/access_codes?id=eq.${codeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ code: normalizedCode }),
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Update failed');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Code Update Error]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

