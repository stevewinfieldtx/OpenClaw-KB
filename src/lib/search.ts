import { query } from "./db";
import { embedSingle } from "./openrouter";
import type { SearchResult } from "./types";

interface RankedResult {
  chunk_id: number;
  content: string;
  video_title: string | null;
  youtube_url: string;
  youtube_id: string;
  rank: number;
}

export async function hybridSearch(
  queryText: string,
  topK = 6
): Promise<SearchResult[]> {
  const queryEmbedding = await embedSingle(queryText);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const [vectorResults, keywordResults] = await Promise.all([
    query<RankedResult>(
      `SELECT c.id as chunk_id, c.content, v.title as video_title,
              v.youtube_url, v.youtube_id,
              ROW_NUMBER() OVER (ORDER BY c.embedding <=> $1::vector) as rank
       FROM chunks c JOIN videos v ON c.video_id = v.id
       ORDER BY c.embedding <=> $1::vector
       LIMIT 20`,
      [embeddingStr]
    ),
    query<RankedResult>(
      `SELECT c.id as chunk_id, c.content, v.title as video_title,
              v.youtube_url, v.youtube_id,
              ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.search_vector, plainto_tsquery('english', $1)) DESC) as rank
       FROM chunks c JOIN videos v ON c.video_id = v.id
       WHERE c.search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank_cd(c.search_vector, plainto_tsquery('english', $1)) DESC
       LIMIT 20`,
      [queryText]
    ),
  ]);

  // Reciprocal Rank Fusion (k=60)
  const K = 60;
  const scores = new Map<number, { score: number; result: RankedResult }>();

  for (const r of vectorResults) {
    const existing = scores.get(r.chunk_id);
    const rrfScore = 1 / (K + r.rank);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(r.chunk_id, { score: rrfScore, result: r });
    }
  }

  for (const r of keywordResults) {
    const existing = scores.get(r.chunk_id);
    const rrfScore = 1 / (K + r.rank);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(r.chunk_id, { score: rrfScore, result: r });
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, result }) => ({
      chunk_id: result.chunk_id,
      content: result.content,
      video_title: result.video_title,
      youtube_url: result.youtube_url,
      youtube_id: result.youtube_id,
      score,
    }));
}
