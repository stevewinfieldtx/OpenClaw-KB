import { query } from './db';
import { embedQuery } from './openrouter';
import type { SearchResult } from './types';

interface RankedDoc {
  chunkId: number;
  content: string;
  videoTitle: string;
  youtubeUrl: string;
  youtubeId: string;
  vectorRank?: number;
  keywordRank?: number;
}

/**
 * Hybrid search: pgvector cosine similarity + tsvector keyword search
 * merged via Reciprocal Rank Fusion (RRF)
 */
export async function hybridSearch(
  userQuery: string,
  limit: number = 6
): Promise<SearchResult[]> {
  // Embed the query
  const queryEmbedding = await embedQuery(userQuery);

  // Run vector and keyword searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(queryEmbedding, 20),
    keywordSearch(userQuery, 20),
  ]);

  // Merge with RRF
  const merged = rrfMerge(vectorResults, keywordResults, limit);
  return merged;
}

async function vectorSearch(
  embedding: number[],
  limit: number
): Promise<RankedDoc[]> {
  const sql = `
    SELECT
      c.id AS chunk_id,
      c.content,
      v.title AS video_title,
      v.youtube_url,
      v.youtube_id,
      1 - (c.embedding <=> $1::vector) AS score
    FROM chunks c
    JOIN videos v ON v.id = c.video_id
    ORDER BY c.embedding <=> $1::vector
    LIMIT $2
  `;

  const rows = await query<{
    chunk_id: number;
    content: string;
    video_title: string;
    youtube_url: string;
    youtube_id: string;
    score: number;
  }>(sql, [`[${embedding.join(',')}]`, limit]);

  return rows.map((r, i) => ({
    chunkId: r.chunk_id,
    content: r.content,
    videoTitle: r.video_title || 'Unknown',
    youtubeUrl: r.youtube_url,
    youtubeId: r.youtube_id,
    vectorRank: i + 1,
  }));
}

async function keywordSearch(
  userQuery: string,
  limit: number
): Promise<RankedDoc[]> {
  const sql = `
    SELECT
      c.id AS chunk_id,
      c.content,
      v.title AS video_title,
      v.youtube_url,
      v.youtube_id,
      ts_rank_cd(c.search_vector, plainto_tsquery('english', $1)) AS score
    FROM chunks c
    JOIN videos v ON v.id = c.video_id
    WHERE c.search_vector @@ plainto_tsquery('english', $1)
    ORDER BY score DESC
    LIMIT $2
  `;

  const rows = await query<{
    chunk_id: number;
    content: string;
    video_title: string;
    youtube_url: string;
    youtube_id: string;
    score: number;
  }>(sql, [userQuery, limit]);

  return rows.map((r, i) => ({
    chunkId: r.chunk_id,
    content: r.content,
    videoTitle: r.video_title || 'Unknown',
    youtubeUrl: r.youtube_url,
    youtubeId: r.youtube_id,
    keywordRank: i + 1,
  }));
}

/**
 * Reciprocal Rank Fusion: merges two ranked lists
 * RRF_score(doc) = sum(1 / (k + rank)) across lists containing the doc
 */
function rrfMerge(
  vectorResults: RankedDoc[],
  keywordResults: RankedDoc[],
  limit: number,
  k: number = 60
): SearchResult[] {
  const scoreMap = new Map<number, { doc: RankedDoc; score: number }>();

  for (const doc of vectorResults) {
    const existing = scoreMap.get(doc.chunkId);
    const rrfScore = 1 / (k + (doc.vectorRank || 999));
    if (existing) {
      existing.score += rrfScore;
    } else {
      scoreMap.set(doc.chunkId, { doc, score: rrfScore });
    }
  }

  for (const doc of keywordResults) {
    const existing = scoreMap.get(doc.chunkId);
    const rrfScore = 1 / (k + (doc.keywordRank || 999));
    if (existing) {
      existing.score += rrfScore;
    } else {
      scoreMap.set(doc.chunkId, { doc, score: rrfScore });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      chunkId: doc.chunkId,
      content: doc.content,
      videoTitle: doc.videoTitle,
      youtubeUrl: doc.youtubeUrl,
      youtubeId: doc.youtubeId,
      score,
    }));
}
