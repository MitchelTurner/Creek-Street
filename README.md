# Creek Street Design Review Hub

Independent public hub for the Creek Street Historic District Architectural Design Review Board (Ketchikan Gateway Borough). Advisory body to the Planning Commission and Zoning Administrator; jurisdiction is the HD zone under KGBC Title 18.

**Owned and operated by Mitchel Turner Dev, LLC — not a borough property.**

## Current release: Phase 0–9 (delivery & ops)

See [LAUNCH.md](./LAUNCH.md) for the production go-live checklist.

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

**Phase 3 — official workflow (contract-gated):**

- Board portal (`/official`) — read-only docket, precedent context, upcoming meetings
- Private `MemberNote`s — author-scoped only, exportable by that member, never shared
- Circulated comments / criterion scoring / draft findings / recommendation assembly exist as API paths but return **403 PHASE3_CONTRACT_REQUIRED** until all processor-agreement env vars are set
- Legal constraints surfaced in the UI (AS 44.62.310 OMA, AS 40.25 PRA)

Deliberation does **not** turn on by default. That is intentional.

**Parallel track — audience (Phase 4):**

- Tourism / visit layer (`/visit`, `/visit/:slug`) — QR-ready structure stories for boardwalk walkers
- Photo time-series on civic + visit structure pages
- Construction-window calendar (`/construction`) — backward-plan filing from build season using ship-call density + timeline medians
- Meeting AI summaries — **unpublished until human review**; public surfaces only show reviewed+published rows

**Phase 5 — ingest & production infra:**

- BullMQ + Redis workers (inline fallback when `REDIS_URL` unset)
- Watermarked source adapters: Clerk/CivicPlus, borough GIS, NRHP, ktnport, embeddings, meeting summaries
- Hard robots.txt respect — `borough.ketchikan.ak.us` blocked; fail closed if robots unreachable
- PostGIS `ST_DWithin` + pgvector SQL helpers (`apps/api/src/geo/postgis.sql`)
- Railway/Docker deploy stubs; staff ingest console at `/admin/ingest`

**Phase 6 — launch hardening:**

- GitHub Actions CI (`lint` · `test` · `build`)
- Vitest gates: robots hard-block, contract dark-by-default, DRAFT never public, unreviewed summaries hidden
- CDN-friendly `Cache-Control` / `stale-while-revalidate` on public GET + fingerprinted web assets
- Subscription email stub + RSS polish; ingest fanout → `recentDeliveries`
- [LAUNCH.md](./LAUNCH.md) checklist

**Phase 7 — persistence & geo:**

- Optional Prisma path when `USE_MEMORY_STORE=false` + `DATABASE_URL`
- PostGIS notice: `creek_parcels_within_meters` (ST_DWithin) with haversine fallback
- Precedent embedding persist (TF-IDF → `PrecedentEmbedding`); pgvector helper when extension present
- `GET /api/geo/status` · `GET /api/geo/notice-set` · `GET /api/geo/embeddings/status`

**Phase 8 — SEO & accessibility:**

- Per-route document titles, meta/OG tags, canonical URLs, home JSON-LD
- Skip link, landmarks, `:focus-visible`, `prefers-reduced-motion`, print CSS
- Static `robots.txt` + `sitemap.xml`; dynamic `GET /api/sitemap.xml` (public paths only)
- Readiness: `GET /api/ready` (prisma / redis / postgis / contract probes)

**Phase 9 — delivery & ops:**

- SMTP mail via `SMTP_URL` (nodemailer); stub log when unset
- Rate limits on auth / subscriptions / photo submit (`429 RATE_LIMITED`)
- Security headers + `X-Request-Id` + JSON access logs on every API request
- Readiness reports mail mode + rate-limit flag

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
- `GET /api/tourism` · `GET /api/tourism/:slug`
- `GET /api/construction/window` · `GET /api/construction/ships`
- `GET /api/summaries` · staff `POST /api/summaries/:id/review`
- Staff ingest: `GET /api/ingest/status` · `POST /api/ingest/run/:sourceId` · `POST /api/ingest/run-all`
- Geo: `GET /api/geo/status` · `GET /api/geo/notice-set?parcelId=` · `GET /api/geo/embeddings/status`
- Ops: `GET /api/ready` · `GET /api/sitemap.xml` · `GET /api/sitemap/paths`

Demo accounts (password `creek-demo` for all):

- Applicant: `applicant@example.com`
- Board: `board@example.com`
- Staff: `staff@example.com`

### Phase 3 contract env (all required to unlock deliberation)

```bash
PHASE3_CONTRACT_ACTIVE=true
PHASE3_CUSTODIAN="Ketchikan Gateway Borough"
PHASE3_PROCESSOR="Mitchel Turner Dev, LLC"
PHASE3_AGREEMENT_ID=...
PHASE3_AGREEMENT_EFFECTIVE=2026-01-01
PHASE3_RETENTION_SCHEDULE_URL=...
PHASE3_RECORDS_REQUEST_CONTACT=...
PHASE3_OMA_NOTICE_INTEGRATION=true
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
