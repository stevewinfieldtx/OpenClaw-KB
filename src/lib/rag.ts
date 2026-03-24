import { hybridSearch } from './search';
import { chatCompletion } from './openrouter';
import { query, queryOne } from './db';
import type { SearchResult, ChatResponse } from './types';

const SYSTEM_PROMPT = `You are an OpenClaw expert assistant. OpenClaw (formerly Clawdbot/Moltbot) is an open-source autonomous AI agent framework.

Answer questions using ONLY the provided context from OpenClaw tutorial video transcripts. Follow these rules:
1. Cite sources as [Video: Title] when referencing specific information.
2. If the context doesn't contain enough information, say so clearly.
3. Be specific, practical, and actionable in your answers.
4. When discussing setup or configuration, include concrete steps.
5. Mention security considerations when relevant.
6. Format responses with markdown for readability.`;

function buildContextPrompt(results: SearchResult[]): string {
  let context = 'CONTEXT FROM OPENCLAW VIDEO TRANSCRIPTS:\n\n';
  for (let i = 0; i < results.length; i++) {
    context += `--- Source ${i + 1}: [Video: ${results[i].videoTitle}] ---\n`;
    context += `${results[i].content}\n\n`;
  }
  return context;
}

export async function ragChat(
  userMessage: string,
  sessionId?: string
): Promise<ChatResponse> {
  // 1. Search for relevant chunks
  const searchResults = await hybridSearch(userMessage, 6);

  // 2. Get or create session
  let sid = sessionId;
  if (!sid) {
    const session = await queryOne<{ id: string }>(
      'INSERT INTO chat_sessions DEFAULT VALUES RETURNING id'
    );
    sid = session!.id;
  }

  // 3. Get recent conversation history for context
  const history = await query<{ role: string; content: string }>(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC LIMIT 6`,
    [sid]
  );
  history.reverse();

  // 4. Build messages array
  const contextPrompt = buildContextPrompt(searchResults);
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add conversation history
  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  // Add current query with context
  messages.push({
    role: 'user',
    content: `${contextPrompt}\n\nUSER QUESTION: ${userMessage}`,
  });

  // 5. Get LLM response
  const answer = (await chatCompletion(messages)) as string;

  // 6. Save to chat history
  const sourceChunkIds = searchResults.map((r) => r.chunkId);
  await query(
    'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
    [sid, 'user', userMessage]
  );
  await query(
    'INSERT INTO chat_messages (session_id, role, content, source_chunks) VALUES ($1, $2, $3, $4)',
    [sid, 'assistant', answer, sourceChunkIds]
  );

  return {
    sessionId: sid,
    answer,
    sources: searchResults,
  };
}
