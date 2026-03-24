-- OpenClaw Knowledge Base Schema
-- Railway PostgreSQL with pgvector

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Video metadata and raw transcripts
CREATE TABLE IF NOT EXISTS videos (
  id            SERIAL PRIMARY KEY,
  youtube_url   TEXT NOT NULL UNIQUE,
  youtube_id    TEXT NOT NULL UNIQUE,
  title         TEXT,
  channel       TEXT,
  notebook_id   TEXT,
  source_id     TEXT,
  raw_text      TEXT,
  extracted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chunked transcript segments with embeddings and full-text search
CREATE TABLE IF NOT EXISTS chunks (
  id            SERIAL PRIMARY KEY,
  video_id      INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  token_count   INTEGER,
  embedding     vector(1536) NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  UNIQUE(video_id, chunk_index)
);

-- Vector similarity index (IVFFlat for ~2000 chunks)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_chunks_search ON chunks USING gin (search_vector);

-- Cached best practices content
CREATE TABLE IF NOT EXISTS best_practices (
  id            SERIAL PRIMARY KEY,
  section_key   TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  generated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat session tracking
CREATE TABLE IF NOT EXISTS chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id            SERIAL PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT NOT NULL,
  source_chunks INTEGER[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
