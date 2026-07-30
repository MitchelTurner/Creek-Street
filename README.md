# Creek Street Design Review Hub

Independent public hub for the Creek Street Historic District Architectural Design Review Board (Ketchikan Gateway Borough). Advisory body to the Planning Commission and Zoning Administrator; jurisdiction is the HD zone under KGBC Title 18.

**Owned and operated by Mitchel Turner Dev, LLC — not a borough property.**

## Current release: Phase 0–23 (public outcomes & digest)

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

**Phase 10 — compliance & audit:**

- Staff-action audit log (`GET /api/compliance/audit`) for ingest, photo moderation, summary review, account export/delete
- Applicant data export + account delete (`/api/applicant/export`, `DELETE /api/applicant/account`)
- Public retention / PRA posture + processor readiness checklist (`/compliance`)
- MemberNotes remain author-scoped export from the board portal

**Phase 11 — search & performance:**

- Public lexical search across structures / docket / decisions / meetings / guidance (`GET /api/search?q=`)
- Search UI at `/search` (deferred query, never indexes DRAFT or unpublished summaries)
- Route-level `React.lazy` code splitting + Vite `manualChunks` for maplibre / react

**Phase 12 — Prisma public store:**

- `PublicStore` dual-read: Prisma when `USE_MEMORY_STORE=false` + connected `DATABASE_URL`, else memory seed
- Public + open-data endpoints go through `PublicStore` (DRAFT still hard-filtered; unpublished summaries stay private)
- Automatic memory fallback if a Prisma query fails
- Health/ready report `store` / `publicBackend`: `prisma` | `memory`

**Phase 13 — meeting packets & web resilience:**

- Mirrored meeting packet PDFs (`GET /api/meetings/:id/packet.pdf`) — public facts only
- Board/staff download with audit (`GET /api/board/meetings/:id/packet.pdf`)
- Never includes MemberNotes, DRAFT apps, or unreviewed AI summaries
- React error boundary + catch-all 404 page

**Phase 14 — calendar & digests:**

- Public iCal feed: `GET /api/meetings.ics`
- Weekly digest preview + staff send: `GET /api/digest/preview` · `POST /api/digest/send`
- Digest lists public docket + upcoming meetings only (never DRAFT text)
- Calendar link on `/meetings` and `/subscriptions`; send control on ingest admin

**Phase 15 — ops dashboard:**

- Staff ops snapshot: `GET /api/ops/dashboard` (STAFF/ADMIN)
- Consolidates readiness, geo, mail, digest, ingest sources/runs, open compliance items, recent audit
- Web console at `/admin/ops` (auth-gated; not in sitemap)

**Phase 16 — staff work queue:**

- Unified queue: `GET /api/ops/queue` (STAFF/ADMIN) — pending photos, unreviewed AI summaries, failed ingest runs
- Staff UI at `/admin/queue` with approve/reject photo and review/publish summary actions
- Demo pending photo + failed ingest seed for local smoke; public surfaces still never show drafts

**Phase 17 — staff ops brief:**

- Staff-only email brief: `GET /api/ops/brief/preview` · `POST /api/ops/brief/send` · `GET /api/ops/brief/last`
- Body = queue counts + photo metadata + summary **ids only** (never AI body) + failed ingest + readiness
- Delivered to STAFF/ADMIN emails via `MailService`; audited as `ops.brief.send`
- Preview/send controls on `/admin/ops`

**Phase 18 — queue aging & staff alerts:**

- Aging snapshot: `GET /api/ops/aging`; queue payload enriched with `ageHours` / `stale`
- Conditional stale alert: `GET /api/ops/alerts/preview` · `POST /api/ops/alerts/send` (cooldown; `?force=1` bypass)
- Thresholds via env: `OPS_STALE_PHOTO_HOURS` · `OPS_STALE_SUMMARY_HOURS` · `OPS_STALE_INGEST_HOURS` · `OPS_ALERT_COOLDOWN_HOURS`
- Alert email is staff-only and never includes AI summary body

**Phase 19 — alert scheduler:**

- Periodic stale-alert dispatcher (default off): `OPS_ALERT_SCHEDULER_ENABLED` · `OPS_ALERT_TICK_HOURS`
- Staff controls: `GET /api/ops/scheduler` · `POST …/enable|disable|tick`
- Auto ticks call `sendAlert({ force: false })` — inherits NO_STALE + cooldown; audited as `ops.alert.scheduler.tick`
- Scheduler card on `/admin/ops`

**Phase 20 — queue claim/lock:**

- Soft claims on queue items: `POST /api/ops/queue/:kind/:id/claim|release` (`kind`: photo|summary|ingest)
- TTL via `OPS_CLAIM_HOURS` (default 2); conflict `409 QUEUE_ITEM_CLAIMED`; ADMIN force-release
- Queue payload includes `claim` metadata; `/admin/queue` Claim/Release + action gating
- Audited as `ops.queue.claim` / `ops.queue.release`

**Phase 21 — board meeting prep:**

- Board prep brief: `GET /api/board/meetings/:id/prep` · `GET /api/board/meetings/:id/prep.pdf`
- Agenda → public case → structure → similar precedents → own private-note **count** only
- Never includes DRAFT apps, other members' notes, or unreviewed AI summary text
- UI at `/official/meetings/:id`; “Open prep” on board portal upcoming meetings

**Phase 22 — meeting outcomes:**

- Post-meeting brief for `HELD` meetings: `GET /api/board/meetings/:id/outcomes` · `…/outcomes.pdf`
- Agenda → public case → mirrored decision/votes/conditions; published summary **metadata only**
- `400 MEETING_NOT_HELD` for scheduled meetings; UI at `/official/meetings/:id/outcomes`
- “Open outcomes” on board portal past meetings

**Phase 23 — public outcomes & subscriber digest:**

- Zero-auth public mirror: `GET /api/meetings/:id/outcomes` · `…/outcomes.pdf` (HELD only)
- Public UI at `/meetings/:id/outcomes`; “View outcomes” on `/meetings` for held meetings
- Staff outcomes digest: `GET /api/digest/outcomes/:meetingId/preview` · `POST …/send`
- Sitemap includes held-meeting outcomes paths; digest never includes DRAFT or AI body

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
- Compliance: `GET /api/compliance/readiness` · `GET /api/compliance/retention` · staff `GET /api/compliance/audit`
- Applicant: `GET /api/applicant/export` · `DELETE /api/applicant/account`
- Search: `GET /api/search?q=`
- Packets: `GET /api/meetings/:id/packet.pdf` · board `GET /api/board/meetings/:id/packet.pdf`
- Meeting prep: board `GET /api/board/meetings/:id/prep` · `GET /api/board/meetings/:id/prep.pdf`
- Meeting outcomes: board `GET /api/board/meetings/:id/outcomes` · `GET /api/board/meetings/:id/outcomes.pdf`
- Public outcomes: `GET /api/meetings/:id/outcomes` · `GET /api/meetings/:id/outcomes.pdf`
- Calendar: `GET /api/meetings.ics` · digest `GET /api/digest/preview` · staff `POST /api/digest/send`
- Outcomes digest: `GET /api/digest/outcomes/:meetingId/preview` · staff `POST /api/digest/outcomes/:meetingId/send`
- Ops: staff `GET /api/ops/dashboard` · `GET /api/ops/queue` · `GET /api/ops/aging` · brief `GET /api/ops/brief/preview` · `POST /api/ops/brief/send` · alerts `GET /api/ops/alerts/preview` · `POST /api/ops/alerts/send` · scheduler `GET /api/ops/scheduler` · `POST /api/ops/scheduler/{enable,disable,tick}` · claims `POST /api/ops/queue/:kind/:id/{claim,release}`

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
