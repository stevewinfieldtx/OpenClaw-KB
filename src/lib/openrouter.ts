import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'OpenClaw Knowledge Base',
      },
    });
  }
  return client;
}

/**
 * Generate embeddings for one or more texts via OpenRouter
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const c = getClient();
  const response = await c.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

/**
 * Embed a single text query
 */
export async function embedQuery(text: string): Promise<number[]> {
  const embeddings = await embedTexts([text]);
  return embeddings[0];
}

/**
 * Chat completion with streaming support
 */
export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { stream?: boolean; model?: string }
) {
  const c = getClient();
  const model = options?.model || 'anthropic/claude-sonnet-4';

  if (options?.stream) {
    return c.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 2048,
    });
  }

  const response = await c.chat.completions.create({
    model,
    messages,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content || '';
}
