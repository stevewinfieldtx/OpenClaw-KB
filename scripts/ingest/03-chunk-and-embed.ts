/**
 * Step 3: Chunk transcripts and embed into PostgreSQL.
 *
 * Reads videos from the DB, chunks them, embeds via OpenRouter,
 * and inserts into the chunks table.
 */

import { query, close } from './utils/db';
import { chunkTranscript } from './utils/chunker';
import { embedAll } from './utils/embeddings';

async function main() {
  // Get videos that have raw text but no chunks yet
  const videos = await query<{
    id: number;
    youtube_id: string;
    title: string;
    raw_text: string;
  }>(`
    SELECT v.id, v.youtube_id, v.title, v.raw_text
    FROM videos v
    WHERE v.raw_text IS NOT NULL
      AND v.raw_text != ''
      AND NOT EXISTS (SELECT 1 FROM chunks c WHERE c.video_id = v.id)
    ORDER BY v.id
  `);

  if (videos.length === 0) {
    console.log('No videos need chunking. All done or no transcripts yet.');
    return;
  }

  console.log(`Processing ${videos.length} videos...`);

  let totalChunks = 0;

  for (const video of videos) {
    const title = video.title || video.youtube_id;
    console.log(`\nChunking: ${title} (${video.raw_text.length} chars)`);

    // Chunk the transcript
    const chunks = chunkTranscript(video.raw_text, title);

    if (chunks.length === 0) {
      console.log('  No chunks generated (empty transcript?)');
      continue;
    }

    console.log(`  Generated ${chunks.length} chunks`);

    // Embed all chunks
    const texts = chunks.map((c) => c.content);
    console.log(`  Embedding ${texts.length} chunks...`);
    const embeddings = await embedAll(texts);

    // Insert into DB
    console.log(`  Inserting into database...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      await query(
        `INSERT INTO chunks (video_id, chunk_index, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)
         ON CONFLICT (video_id, chunk_index) DO UPDATE SET
           content = EXCLUDED.content,
           token_count = EXCLUDED.token_count,
           embedding = EXCLUDED.embedding`,
        [
          video.id,
          chunk.chunkIndex,
          chunk.content,
          chunk.tokenCount,
          `[${embedding.join(',')}]`,
        ]
      );
    }

    totalChunks += chunks.length;
    console.log(`  Done: ${chunks.length} chunks inserted`);
  }

  console.log(`\nTotal: ${totalChunks} chunks from ${videos.length} videos`);
  await close();
}

main().catch(console.error);
