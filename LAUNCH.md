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
- [ ] Railway: set env from `apps/api/.env.example`; deploy monorepo (`railway.toml`)
- [ ] Web origin proxies `/api` or sets `VITE_*` if split hosts
- [ ] CDN / edge: public GET routes send `Cache-Control` + `stale-while-revalidate` (see interceptor)
- [ ] Health: `GET /api/health` → `{ ok: true, phase: 11 }`
- [ ] Readiness: `GET /api/ready` → `ready: true` (prisma/redis/postgis/mail optional)
- [ ] Compliance: `/compliance` checklist visible; staff audit export works after a moderated action
- [ ] Applicant: export JSON from workspace; delete blocked for demo accounts
- [ ] Search: `GET /api/search?q=creek` returns hits; `/search` UI works; DRAFT text never appears
- [ ] Mail: set `SMTP_URL` + `SMTP_FROM` in production; confirm `checks.mail` is `smtp`
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
