import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a productivity scheduling assistant.
Given a user's description of their weekly goals, generate a structured weekly schedule.

Return ONLY a valid JSON array (no markdown, no explanation) with this exact shape:
[
  {
    "title": "Block title",
    "category": "Category name (one of: Sleep, Work, Gym, Study, Personal, or any user-specified category)",
    "day": "Mon/Tue/Wed/Thu/Fri/Sat/Sun",
    "startTime": "HH:MM",
    "endTime": "HH:MM"
  }
]

Rules:
- Use 24-hour time format (e.g., "09:00", "13:30", "22:00")
- Do NOT create overlapping blocks on the same day
- Spread activities realistically across the week (Mon-Sun)
- Include sleep blocks (22:00-07:00 range), meal breaks, and varied activities
- Generate 15–30 blocks total for a realistic week
- Keep blocks between 30 minutes and 4 hours each
- Ensure a balanced, healthy schedule`;

const AI_TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'AI features require an OPENROUTER_API_KEY environment variable.' },
      { status: 503 }
    );
  }

  // Parse body — return 400 on malformed JSON instead of silently using {}
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, categories } = body as { prompt?: unknown; categories?: unknown };

  // Validate prompt
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });
  }

  // Validate categories
  if (categories !== undefined && !Array.isArray(categories)) {
    return NextResponse.json({ error: 'categories must be an array' }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://week-planner.app',
      'X-Title': 'Week Planner',
    },
  });

  const userMessage = `Generate a weekly schedule for someone who wants to: ${prompt.trim()}.
${Array.isArray(categories) && categories.length > 0 ? `Available categories: ${(categories as string[]).join(', ')}.` : ''}
Return ONLY the JSON array, no other text.`;

  // 30-second AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const message = await client.chat.completions.create(
      {
        model: 'anthropic/claude-3.5-haiku',
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      },
      { signal: controller.signal }
    );

    const text = message.choices[0]?.message?.content ?? '';
    return NextResponse.json({ schedule: text });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'AI request timed out' }, { status: 504 });
    }
    const msg = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
