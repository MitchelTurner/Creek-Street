# Launch checklist — Creek Street Design Review Hub

Operator: **Mitchel Turner Dev, LLC** (independent; not a borough property).

## Pre-flight legal

- [ ] Public mirror only until borough processor agreement is signed
- [ ] `PHASE3_CONTRACT_ACTIVE` remains `false` unless every Phase 3 env var is set
- [ ] Confirm no board deliberation UI is reachable without contract (expect `403 PHASE3_CONTRACT_REQUIRED`)
- [ ] Confirm `MemberNote` stays author-scoped; never in open data
- [ ] Confirm `DRAFT` applications never appear on `/api/applications` or open data
- [ ] Confirm meeting summaries require `isPublished` + `reviewedAt` before public display
- [ ] Confirm ingest never targets `borough.ketchikan.ak.us` (robots hard-block + fail-closed)

## Environment

```bash
USE_MEMORY_STORE=true          # flip false when Postgres is ready
DATABASE_URL=...               # Postgres + PostGIS when live
REDIS_URL=...                  # optional; inline ingest fallback without it
CLERK_FEED_URL=...             # CivicPlus / kgbak.us feed when available
BOROUGH_GIS_URL=...            # ArcGIS REST only after asking
PORT=3001
```

Phase 3 vars stay blank until MOU/contract.

## Deploy (Railway / Docker)

- [ ] `docker compose up -d` locally smoke-tests Postgres + Redis
- [ ] Railway: set env from `apps/api/.env.example`; deploy monorepo (`railway.toml` → Dockerfile)
- [ ] Confirm public domain is attached to the API service and deploy of `main` is **Active** (not the Railway “train station” page)
- [ ] `GET /` serves the SPA; `GET /api/health` returns JSON; same origin so no `VITE_*` split required
- [ ] CDN / edge: public GET routes send `Cache-Control` + `stale-while-revalidate` (see interceptor)
- [ ] Health: `GET /api/health` → `{ ok: true, phase: 32, store: "memory"|"prisma" }`
- [ ] Readiness: `GET /api/ready` → `ready: true` (prisma/redis/postgis/mail optional); `checks.publicBackend` matches health
- [ ] Persistence path: `USE_MEMORY_STORE=false`, migrate + seed, confirm health `store: "prisma"` and docket still has no DRAFT
- [ ] Packet: `GET /api/meetings/mtg_2026_08/packet.pdf` returns `%PDF`; board download logs `meeting.packet_download`
- [ ] Unknown web route shows 404; thrown UI errors are caught by the error boundary
- [ ] `GET /api/meetings.ics` begins with `BEGIN:VCALENDAR`
- [ ] Staff `POST /api/digest/send` delivers to confirmed EMAIL subs (stub without SMTP_URL)
- [ ] Ops: staff `GET /api/ops/dashboard` returns snapshot; `/admin/ops` loads for `staff@example.com`
- [ ] Queue: staff `GET /api/ops/queue` includes pending summary draft; `/admin/queue` can approve demo photo and review summary
- [ ] Ops brief: staff `GET /api/ops/brief/preview` omits AI summary body; `POST /api/ops/brief/send` audits `ops.brief.send`
- [ ] Aging: `GET /api/ops/aging` shows stale demo photo/summary/ingest; stale alert omits AI body; cooldown blocks repeat send
- [ ] Scheduler: default disabled; `POST /api/ops/scheduler/enable` then `…/tick` audits `ops.alert.scheduler.tick` without force-bypass
- [ ] Claims: `POST /api/ops/queue/photo/photo_pending_demo/claim` then second staff gets `409 QUEUE_ITEM_CLAIMED`
- [ ] Prep: board `GET /api/board/meetings/mtg_2026_08/prep` lists public case + similar; prep PDF audits `board.meeting.prep_download`; no DRAFT/AI body
- [ ] Outcomes: board `GET /api/board/meetings/mtg_2023_04/outcomes` shows decision votes; `mtg_2026_08` → `MEETING_NOT_HELD`; PDF audits `board.meeting.outcomes_download`
- [ ] Public outcomes: `GET /api/meetings/mtg_2023_04/outcomes` (no auth); `/meetings/mtg_2023_04/outcomes` UI; staff outcomes digest preview/send audits `digest.outcomes.send`
- [ ] Case brief: `GET /api/applications/app_sample_sign/brief` shows decisions + `mtg_2023_04` outcomes link; `app_sample_draft` → 404; `/docket/app_sample_sign` UI
- [ ] Case digest: staff preview/send `/api/digest/case/app_sample_sign/*` audits `digest.case.send`; weekly digest body includes `/docket/app_sample_pending`
- [ ] Agenda: `GET /api/meetings/mtg_2026_08/agenda` links `app_sample_pending`; HELD `mtg_2023_04` includes outcomes; `/meetings/:id` UI; DRAFT never listed
- [ ] Summary sheet: `GET /api/meetings/mtg_2023_04/summary-sheet` shows reviewed body; `mtg_2024_02` / `mtg_2026_08` → 404; `/meetings/mtg_2023_04/summary` UI
- [ ] Decision sheet: `GET /api/decisions/dec_sample_1` shows vote + `ex_sign_*` precedents; `/decisions/dec_sample_1` UI; unknown id → 404
- [ ] Criterion atlas: `GET /api/guidance/criteria/MATERIAL_HONESTY` links `dec_sample_1`; `UNIFORMITY` empty OK; `NOT_A_CRITERION` → 404; `/guidance/criteria/:key` UI
- [ ] Structure dossier: `GET /api/structures/20-creek-street/sheet` shows `dec_sample_1` + precedents; `star-house` has no DRAFT; `/structures/:slug` PDF works
- [ ] Filing pathway: `GET /api/filing/plan?projectType=SIGNAGE&answers=%7B%22sign_start%22%3A%22yes%22%2C%22sign_new%22%3A%22change%22%7D&structureSlug=20-creek-street&address=24%20Creek%20Street&buildMonth=10&buildYear=2026` shows file-by + ZA step; PDF works; no DRAFT; `/filing` UI
- [ ] Notice packet: `GET /api/notice/packet.pdf?address=24%20Creek%20Street` returns PDF; `/notice/packet` UI
- [ ] Precedent compare: `GET /api/precedents/compare?left=ex_sign_proposed&right=ex_sign_after` returns teaching analysis; `/precedents/compare` UI
- [ ] Public board packet: `GET /api/board/packet` resolves upcoming/recent meeting; PDF downloads; Meetings CTA works
- [ ] Map pin edit: sign in as `staff@example.com` / `creek-demo`; `/map` → Edit pins; drag or save lng/lat; `GET /api/map` reflects move
- [ ] Compliance: `/compliance` checklist visible; staff audit export works after a moderated action
- [ ] Applicant: export JSON from workspace; delete blocked for demo accounts
- [ ] Search: `GET /api/search?q=creek` returns hits; `/search` UI works; DRAFT text never appears
- [ ] Mail: set `RESEND_API_KEY` + `RESEND_FROM` (preferred) or `SMTP_URL` + `SMTP_FROM`; confirm readiness mail mode is `resend` or `smtp`
- [ ] Claude ideas: set `ANTHROPIC_API_KEY` + `IDEA_NOTIFY_EMAILS`; smoke `POST /api/ideas/ai` with `{ "notify": true }` and confirm inbox delivery
- [ ] Journal: `/journal` shows daily posts with photo embeds; set `JOURNAL_NOTIFY_EMAILS`; staff `POST /api/journal/digest/weekly?force=true` emails highlights; `JOURNAL_SCHEDULER_ENABLED=true` for daily auto-publish
- [ ] Rate limits: burst `POST /api/auth/login` → expect `429 RATE_LIMITED` (or set `RATE_LIMIT_DISABLED=true` only in trusted local demos)
- [ ] Persistence: when using Postgres, `USE_MEMORY_STORE=false`, run migrations + seed, confirm `GET /api/geo/status` shows `postgis: true` after helpers apply
- [ ] SEO: `/robots.txt` and `/sitemap.xml` reachable; private paths (`/workspace`, `/official`, `/admin`) not listed
- [ ] A11y smoke: keyboard tab reaches skip link → main; reduced-motion respected

## Smoke after deploy

```bash
curl -sS "$API/api/health"
curl -sS "$API/api/applications" | jq 'map(.status) | unique'   # no DRAFT
curl -sS "$API/api/summaries"                                   # reviewed only
curl -sS -X POST "$API/api/official/deliberation/..." -H "Authorization: Bearer …"  # expect 403
npm test                                                        # robots / contract / DRAFT gates
```

Demo logins (local / staging only): `applicant@example.com`, `board@example.com`, `staff@example.com` — password `creek-demo`.

## Subscriptions

- Email channel: stub logger until `SMTP_URL` is wired; deliveries visible on `GET /api/ingest/status` (`recentDeliveries`)
- RSS: `GET /api/subscriptions/rss/:token.xml` — public statuses only; DRAFT excluded
- Ingest watermark fanout topics: `subscriptions.district_wide`, `rss.feeds`

## Do not launch if

- Unreviewed AI summaries are public
- Deliberation endpoints are open without full Phase 3 contract env
- Robots fail-open on government hosts
- Open data includes applicant drafts or private notes
