# Creek Street Design Review Hub

Independent public hub for the Creek Street Historic District Architectural Design Review Board (Ketchikan Gateway Borough). Advisory body to the Planning Commission and Zoning Administrator; jurisdiction is the HD zone under KGBC Title 18.

**Owned and operated by Mitchel Turner Dev, LLC — not a borough property.**

## Phase 0 (this release)

Minimum credible launch — zero auth, zero legal exposure:

- Structure inventory from NRHP nomination **14000454** (2014)
- District map (MapLibre + GeoJSON)
- Application docket (mirrored / sample rows until Clerk feed)
- Decision archive (searchable)
- Meeting calendar
- Plain-language HD guidance + criteria from KGBC 18.40.010(13)
- Board roster / vacancy watch
- Open data JSON + CSV exports

Phase 1+ (triage wizard, permit trigger map, precedent search, applicant workspace, official workflow) stays out of this branch until Phase 0 is live with real packet ingest. See the build spec for legal layering: public mirror → applicant workspace → contract-gated official workflow.

### Hard legal constraints (schema + API)

- Board deliberation never happens in this app (Open Meetings Act).
- Mirrored public records only in the public surface (Public Records Act).
- `MemberNote` is private, author-scoped, never joined into public queries — Phase 2+ board scratch notes only.
- `Application` with status `DRAFT` is never returned by public endpoints.
- AI meeting summaries stay unpublished until `isPublished` after human review (Phase 1+).

## Stack

| Layer | Tech |
| --- | --- |
| API | NestJS |
| Data | Prisma + Postgres (+ PostGIS / pgvector in later phases) |
| Queue | Redis + BullMQ (later phases) |
| Web | React, Vite, Tailwind, MapLibre GL |
| Deploy | Railway-ready monorepo |

Local Phase 0 runs on an **in-memory store** seeded from NRHP data so the hub works without Docker. Point `DATABASE_URL` at Postgres and run `npm run seed` when ready for persistence.

## Quick start

```bash
npm install
npm run dev:api    # http://localhost:3001/api
npm run dev:web    # http://localhost:5173
```

Optional Postgres + Redis:

```bash
docker compose up -d
# set USE_MEMORY_STORE=false in apps/api/.env
npm run prisma:migrate -w @creek-street/api
npm run seed
```

## Open data

- Catalog: `GET /api/opendata`
- Bundle: `GET /api/opendata/bundle.json`
- CSV: `/api/opendata/{structures,applications,decisions,meetings,seats}.csv`

License: CC0-1.0 for published public mirror datasets; always verify against borough primary documents before filing.

## Ingest policy

Do **not** scrape `borough.ketchikan.ak.us` against robots.txt. Prefer Clerk-provided feeds, `kgbak.us` CivicPlus/RSS/iCal, or ArcGIS REST for parcels. Ask before scraping.

## Operator

Mitchel Turner Dev, LLC
