export interface Video {
  id: number;
  youtube_url: string;
  youtube_id: string;
  title: string | null;
  channel: string | null;
  raw_text: string | null;
  extracted_at: Date;
}

export interface Chunk {
  id: number;
  video_id: number;
  chunk_index: number;
  content: string;
  token_count: number | null;
  embedding: number[];
}

export interface SearchResult {
  chunk_id: number;
  content: string;
  video_title: string | null;
  youtube_url: string;
  youtube_id: string;
  score: number;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  source_chunks?: number[];
}

export interface BestPractice {
  id: number;
  section_key: string;
  title: string;
  content: string;
}
