export interface Video {
  id: number;
  youtube_url: string;
  youtube_id: string;
  title: string | null;
  channel: string | null;
  notebook_id: string | null;
  source_id: string | null;
  raw_text: string | null;
  extracted_at: Date;
}

export interface Chunk {
  id: number;
  video_id: number;
  chunk_index: number;
  content: string;
  token_count: number | null;
  embedding?: number[];
}

export interface SearchResult {
  chunkId: number;
  content: string;
  videoTitle: string;
  youtubeUrl: string;
  youtubeId: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  answer: string;
  sources: SearchResult[];
}

export interface BestPracticeSection {
  key: string;
  title: string;
  content: string;
}
