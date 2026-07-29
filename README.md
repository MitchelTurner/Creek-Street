# Creek Street Design Review Hub

Independent public hub for the Creek Street Historic District Architectural Design Review Board (Ketchikan Gateway Borough). Advisory body to the Planning Commission and Zoning Administrator; jurisdiction is the HD zone under KGBC Title 18.

**Owned and operated by Mitchel Turner Dev, LLC — not a borough property.**

## Current release: Phase 0 + Phase 1 + Phase 2

**Phase 0 — public mirror** (zero auth, zero legal exposure):

- Structure inventory from NRHP nomination **14000454** (2014)
- District map (MapLibre + GeoJSON)
- Application docket, decision archive, meeting calendar
- Plain-language HD guidance + criteria from KGBC 18.40.010(b)(13)
- Board roster / vacancy watch
- Open data JSON + CSV exports

**Phase 1 — decision support** (still zero borough agreement required):

- Triage wizard (`/triage`) — versioned flows per project type; outcomes cite code; always ends at Zoning Administrator
- Multi-agency permit trigger map (`/permits`) — data rows with `verifiedAt`; unverified gated behind opt-in
- Visual precedent library + lexical similarity search (`/precedents`) — TF-IDF until pgvector embeddings land

**Phase 2 — applicant workspace & retention** (still zero official status):

- Auth + private drafts (`/auth`, `/workspace`)
- Pre-application builder: triage → criteria → exhibits → agencies → preparation PDF
- Document checklist with completeness validation
- Subscriptions (email + RSS)
- Notice lookup citing **KGBC 18.90.060** (600 ft in city) and **18.90.020** (HD district-wide notice)
- Timeline expectations (suppress n&lt;5)
- Historic photo crowdsourcing with moderation queue
- Disclaimer on every applicant surface

Phase 3 (contract-gated official workflow / deliberation) is **not** started.

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

## Phase 1–2 API

- `GET /api/triage/flows` · `POST /api/triage/evaluate`
- `GET /api/permits/triggers?...` · `GET /api/precedents` · `GET /api/precedents/similar?q=`
- `POST /api/auth/register|login` · `GET /api/auth/me`
- `CRUD /api/applicant/drafts` · document upload · `GET .../package.pdf`
- `POST /api/subscriptions` · `GET /api/notice` · `GET /api/timelines`
- `POST /api/photos/submit` · moderation endpoints (staff)

Demo applicant: `applicant@example.com` / `creek-demo`

## Open data

- Catalog: `GET /api/opendata`
- Bundle: `GET /api/opendata/bundle.json`
- CSV: `/api/opendata/{structures,applications,decisions,meetings,seats}.csv`

License: CC0-1.0 for published public mirror datasets; always verify against borough primary documents before filing.

## Ingest policy

Do **not** scrape `borough.ketchikan.ak.us` against robots.txt. Prefer Clerk-provided feeds, `kgbak.us` CivicPlus/RSS/iCal, or ArcGIS REST for parcels. Ask before scraping.

## Operator

Mitchel Turner Dev, LLC
