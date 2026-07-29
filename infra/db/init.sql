-- Enable extensions used by later phases. Harmless if already present.
CREATE EXTENSION IF NOT EXISTS postgis;
-- pgvector ships on Railway; may need a custom image locally.
-- CREATE EXTENSION IF NOT EXISTS vector;
