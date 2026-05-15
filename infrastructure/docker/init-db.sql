-- pgvector extension (needed for langchain_postgres PGVector tables, which are auto-created
-- by the API at startup based on the embedding dim configured per environment).
CREATE EXTENSION IF NOT EXISTS vector;

-- App-managed document registry (one row per uploaded file per user). The actual chunk
-- embeddings live in PGVector's `langchain_pg_embedding` table (auto-created).
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    chunks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS rag_documents_user_idx ON rag_documents(user_id);
