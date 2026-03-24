import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'OpenClaw KB Ingestion',
  },
});

/**
 * Embed a batch of texts (max ~20 at a time for reliability)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: texts,
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/**
 * Embed texts in batches of batchSize, with delay between batches
 */
export async function embedAll(
  texts: string[],
  batchSize: number = 20,
  delayMs: number = 500
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`  Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} chunks)`);

    const embeddings = await embedBatch(batch);
    allEmbeddings.push(...embeddings);

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return allEmbeddings;
}
