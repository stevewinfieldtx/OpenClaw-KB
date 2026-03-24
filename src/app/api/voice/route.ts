import { NextRequest, NextResponse } from 'next/server';
import { ragChat } from '@/lib/rag';

// Voice route: receives transcribed text from client-side Web Speech API,
// runs RAG, returns text answer (client handles TTS playback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sessionId } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Transcribed text is required' },
        { status: 400 }
      );
    }

    const result = await ragChat(text.trim(), sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
