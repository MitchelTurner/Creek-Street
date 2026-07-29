-- PostGIS + pgvector helpers for Creek Street hub (Railway Postgres).
-- Apply after CREATE EXTENSION postgis; CREATE EXTENSION vector;

-- Parcel geometry as geography for meter-based ST_DWithin (notice radius).
-- Application stores GeoJSON in Parcel.geometry (jsonb); sync into geom for queries.

ALTER TABLE "Parcel" ADD COLUMN IF NOT EXISTS geom geography(Polygon, 4326);

CREATE OR REPLACE FUNCTION creek_sync_parcel_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.geometry IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.geometry::text), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parcel_geom ON "Parcel";
CREATE TRIGGER trg_parcel_geom
  BEFORE INSERT OR UPDATE OF geometry ON "Parcel"
  FOR EACH ROW EXECUTE FUNCTION creek_sync_parcel_geom();

-- Notice set: parcels within N meters of subject parcel perimeter (approx via geography).
-- City of Ketchikan HD notice under KGBC 18.90.060 uses 600 feet ≈ 182.88 meters.
CREATE OR REPLACE FUNCTION creek_parcels_within_meters(subject_id text, meters double precision)
RETURNS TABLE(id text, "parcelNumber" text, address text, meters_away double precision)
LANGUAGE sql STABLE AS $$
  SELECT p.id, p."parcelNumber", p.address,
         ST_Distance(s.geom, p.geom) AS meters_away
  FROM "Parcel" s
  JOIN "Parcel" p ON p.id <> s.id
  WHERE s.id = subject_id
    AND s.geom IS NOT NULL
    AND p.geom IS NOT NULL
    AND ST_DWithin(s.geom, p.geom, meters)
  ORDER BY meters_away;
$$;

-- Precedent embeddings (pgvector). Prisma keeps Json fallback until migrated.
ALTER TABLE "PrecedentEmbedding" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

CREATE INDEX IF NOT EXISTS precedent_embedding_ivfflat
  ON "PrecedentEmbedding" USING ivfflat (embedding_vec vector_cosine_ops)
  WITH (lists = 100);

-- Similarity search helper
CREATE OR REPLACE FUNCTION creek_similar_applications(query_vec vector(1536), lim int DEFAULT 5)
RETURNS TABLE(application_id text, distance double precision)
LANGUAGE sql STABLE AS $$
  SELECT pe."applicationId", (pe.embedding_vec <=> query_vec) AS distance
  FROM "PrecedentEmbedding" pe
  WHERE pe.embedding_vec IS NOT NULL
  ORDER BY pe.embedding_vec <=> query_vec
  LIMIT lim;
$$;
