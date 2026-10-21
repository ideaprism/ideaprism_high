import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAdmin } from '@/lib/admin-route';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { prompt, type } = (await request.json()) as { prompt?: string; type?: string };

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        optimized:
          '[MOCK OPTIMIZED]\nThis is a simulated optimization because OPENAI_API_KEY is missing.',
      });
    }

    const openai = new OpenAI({ apiKey });

    const systemInstruction =
      type === 'sql'
        ? 'You are an expert SQL optimizer for PostgreSQL. Rewrite the given query for better performance and readability.'
        : 'You are an expert Prompt Engineer. Rewrite the given system prompt to be more effective, concise, and robust for an LLM.';

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Please optimize this:\n\n${prompt}` },
      ],
      model: 'gpt-4o',
    });

    const optimized = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ optimized });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json({ error: 'Failed to optimize prompt' }, { status: 500 });
  }
}

