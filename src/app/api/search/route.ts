import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query: userQuery, limit } = body;

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await hybridSearch(userQuery.trim(), limit || 10);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
