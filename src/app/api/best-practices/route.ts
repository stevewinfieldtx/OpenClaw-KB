import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { BestPracticeSection } from '@/lib/types';

export async function GET() {
  try {
    const rows = await query<{
      section_key: string;
      title: string;
      content: string;
    }>('SELECT section_key, title, content FROM best_practices ORDER BY id');

    const sections: BestPracticeSection[] = rows.map((r) => ({
      key: r.section_key,
      title: r.title,
      content: r.content,
    }));

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Best practices API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
