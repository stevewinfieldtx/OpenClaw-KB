import { NextRequest, NextResponse } from 'next/server';
import { ragChat } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await ragChat(message.trim(), sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
