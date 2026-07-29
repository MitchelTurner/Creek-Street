-- Enable extensions used by Phase 7+. Harmless if already present.
CREATE EXTENSION IF NOT EXISTS postgis;
-- pgvector: available on many Railway Postgres images; ignore if missing locally.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension unavailable in this image — Json TF-IDF fallback remains active';
END $$;
