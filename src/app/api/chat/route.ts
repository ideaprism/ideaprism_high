import { NextRequest, NextResponse } from 'next/server';

// Supabase Edge Function URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: '메시지를 입력해주세요.' },
                { status: 400 }
            );
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return NextResponse.json(
                { error: '서버 설정 오류입니다.' },
                { status: 500 }
            );
        }

        // Supabase Edge Function 호출
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Edge Function error:', errorText);
            return NextResponse.json(
                {
                    type: 'error',
                    content: '검색 중 오류가 발생했습니다.',
                    error: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            {
                type: 'error',
                content: '서버 오류가 발생했습니다.',
                error: String(error),
            },
            { status: 500 }
        );
    }
}
