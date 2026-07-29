-- Phase 7: PostGIS geography column + notice helpers.
-- Requires CREATE EXTENSION postgis (see infra/db/init.sql).
-- pgvector helpers are applied only when the vector extension exists.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE "Parcel" ADD COLUMN IF NOT EXISTS geom geography(Polygon, 4326);

    CREATE OR REPLACE FUNCTION creek_sync_parcel_geom() RETURNS trigger AS $fn$
    BEGIN
      IF NEW.geometry IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.geometry::text), 4326)::geography;
      END IF;
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_parcel_geom ON "Parcel";
    CREATE TRIGGER trg_parcel_geom
      BEFORE INSERT OR UPDATE OF geometry ON "Parcel"
      FOR EACH ROW EXECUTE FUNCTION creek_sync_parcel_geom();

    -- Backfill from existing GeoJSON
    UPDATE "Parcel"
    SET geom = ST_SetSRID(ST_GeomFromGeoJSON(geometry::text), 4326)::geography
    WHERE geometry IS NOT NULL AND geom IS NULL;

    CREATE OR REPLACE FUNCTION creek_parcels_within_meters(subject_id text, meters double precision)
    RETURNS TABLE(id text, "parcelNumber" text, address text, meters_away double precision)
    LANGUAGE sql STABLE AS $fn$
      SELECT p.id, p."parcelNumber", p.address,
             ST_Distance(s.geom, p.geom) AS meters_away
      FROM "Parcel" s
      JOIN "Parcel" p ON p.id <> s.id
      WHERE s.id = subject_id
        AND s.geom IS NOT NULL
        AND p.geom IS NOT NULL
        AND ST_DWithin(s.geom, p.geom, meters)
      ORDER BY meters_away;
    $fn$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE "PrecedentEmbedding" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

    CREATE OR REPLACE FUNCTION creek_similar_applications(query_vec vector(1536), lim int DEFAULT 5)
    RETURNS TABLE(application_id text, distance double precision)
    LANGUAGE sql STABLE AS $fn$
      SELECT pe."applicationId", (pe.embedding_vec <=> query_vec) AS distance
      FROM "PrecedentEmbedding" pe
      WHERE pe.embedding_vec IS NOT NULL
      ORDER BY pe.embedding_vec <=> query_vec
      LIMIT lim;
    $fn$;
  END IF;
END $$;
