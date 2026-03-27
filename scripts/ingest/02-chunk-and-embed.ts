import { Pool } from "pg";
import OpenAI from "openai";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const CHUNK_SIZE = 400; // target tokens (rough: 1 token ≈ 4 chars)
const CHUNK_OVERLAP = 100;
const BATCH_SIZE = 20; // embeddings per API call

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function chunkText(
  text: string,
  videoTitle: string
): { content: string; tokenCount: number }[] {
  const prefix = `[Video: ${videoTitle}] `;
  const prefixTokens = estimateTokens(prefix);
  const targetChars = (CHUNK_SIZE - prefixTokens) * 4;
  const overlapChars = CHUNK_OVERLAP * 4;

  // Split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: { content: string; tokenCount: number }[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > targetChars && current.length > 0) {
      const content = prefix + current.trim();
      chunks.push({ content, tokenCount: estimateTokens(content) });

      // Overlap: keep last portion
      const words = current.split(" ");
      const overlapWords = Math.floor(overlapChars / 5);
      current = words.slice(-overlapWords).join(" ") + " " + sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    const content = prefix + current.trim();
    chunks.push({ content, tokenCount: estimateTokens(content) });
  }

  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "perplexity/pplx-embed-v1-4b",
    input: texts,
  });
  // OpenRouter returns data array; handle both standard and wrapped responses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = response as any;
  const items: { embedding: number[] }[] = raw.data ?? raw;
  return items.map((d) => d.embedding);
}

async function main() {
  // Get all videos with text but no chunks
  const videos = await pool.query(
    `SELECT v.id, v.title, v.raw_text FROM videos v
     WHERE v.raw_text IS NOT NULL AND v.raw_text != ''
     AND NOT EXISTS (SELECT 1 FROM chunks c WHERE c.video_id = v.id)
     ORDER BY v.id`
  );

  console.log(`Found ${videos.rows.length} videos to chunk and embed...`);

  let totalChunks = 0;

  for (const video of videos.rows) {
    const chunks = chunkText(video.raw_text, video.title || "Unknown");
    console.log(`[${video.id}] "${video.title}" → ${chunks.length} chunks`);

    // Embed in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      try {
        const embeddings = await embedBatch(texts);

        for (let j = 0; j < batch.length; j++) {
          const chunkIndex = i + j;
          const embeddingStr = `[${embeddings[j].join(",")}]`;

          await pool.query(
            `INSERT INTO chunks (video_id, chunk_index, content, token_count, embedding)
             VALUES ($1, $2, $3, $4, $5::vector)
             ON CONFLICT (video_id, chunk_index) DO NOTHING`,
            [
              video.id,
              chunkIndex,
              batch[j].content,
              batch[j].tokenCount,
              embeddingStr,
            ]
          );
        }

        totalChunks += batch.length;
        console.log(`  Embedded batch ${i / BATCH_SIZE + 1} (${batch.length} chunks)`);
      } catch (err) {
        console.error(`  Embed error:`, (err as Error).message);
        // Wait and retry once
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const embeddings = await embedBatch(texts);
          for (let j = 0; j < batch.length; j++) {
            const chunkIndex = i + j;
            const embeddingStr = `[${embeddings[j].join(",")}]`;
            await pool.query(
              `INSERT INTO chunks (video_id, chunk_index, content, token_count, embedding)
               VALUES ($1, $2, $3, $4, $5::vector)
               ON CONFLICT (video_id, chunk_index) DO NOTHING`,
              [video.id, chunkIndex, batch[j].content, batch[j].tokenCount, embeddingStr]
            );
          }
          totalChunks += batch.length;
        } catch (retryErr) {
          console.error(`  Retry failed:`, (retryErr as Error).message);
        }
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\nDone: ${totalChunks} total chunks embedded`);
  await pool.end();
}

main().catch(console.error);
