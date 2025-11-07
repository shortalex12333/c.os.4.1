-- SOP Creation System - Database Schema
-- pgvector extension already enabled

-- Table for storing manual document embeddings
CREATE TABLE IF NOT EXISTS manual_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  yacht_id TEXT NOT NULL,
  equipment TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1024), -- BGE-large produces 1024-dim vectors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for storing generated SOPs
CREATE TABLE IF NOT EXISTS sop_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  yacht_id TEXT NOT NULL,
  equipment TEXT,
  title TEXT NOT NULL,
  query TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  source_chunks INTEGER[] DEFAULT '{}', -- references to manual_embeddings IDs
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for tracking SOP edits (learning loop)
CREATE TABLE IF NOT EXISTS sop_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_id UUID REFERENCES sop_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  original_content TEXT NOT NULL,
  edited_content TEXT NOT NULL,
  edit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS manual_embeddings_vector_idx
  ON manual_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index for yacht-based queries
CREATE INDEX IF NOT EXISTS manual_embeddings_yacht_idx
  ON manual_embeddings(yacht_id);

CREATE INDEX IF NOT EXISTS sop_documents_yacht_idx
  ON sop_documents(yacht_id);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_manual_chunks(
  query_embedding vector(1024),
  match_yacht_id TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    manual_embeddings.id,
    manual_embeddings.file_name,
    manual_embeddings.chunk_text,
    1 - (manual_embeddings.embedding <=> query_embedding) AS similarity
  FROM manual_embeddings
  WHERE
    manual_embeddings.yacht_id = match_yacht_id
    AND 1 - (manual_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY manual_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Row Level Security (RLS) Policies
ALTER TABLE manual_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_edits ENABLE ROW LEVEL SECURITY;

-- Allow users to read their yacht's data
CREATE POLICY "Users can view their yacht's manual embeddings"
  ON manual_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their yacht's SOPs"
  ON sop_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert manual embeddings"
  ON manual_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert SOPs"
  ON sop_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to do everything (for n8n automation)
CREATE POLICY "Service role has full access to manual_embeddings"
  ON manual_embeddings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to sop_documents"
  ON sop_documents FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
