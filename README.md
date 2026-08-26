# CreekStreet.org

Public site of the Creek Street Historic District Architectural Design Review Board in Ketchikan, Alaska.

**Live at [creekstreet.org](https://creekstreet.org)**

This is an independent site to make the board’s work easier to follow. It is not an official publication of the Ketchikan Gateway Borough. The Borough holds the official record.

## Contact

- Public inbox: [hello@creekstreet.org](mailto:hello@creekstreet.org)
- Meeting notices and project questions go to the same address

## Pages

- [`index.html`](./index.html) — purpose, what the board reviews, the last meeting
- [`meetings.html`](./meetings.html) — next meeting, archive, how the record works
- [`meetings/`](./meetings) — one summary page per meeting
- [`priorities.html`](./priorities.html) — standing list of what's in front of the board, with status
- [`board.html`](./board.html) — members, what the board is, how it relates to the Borough
- [`workshops.html`](./workshops.html) — the open conversation after each agenda
- [`404.html`](./404.html)

No build step. Plain HTML, one stylesheet, one small script.

## Editing

**Paths are root-relative** (`/styles.css`, `/meetings.html`). The site must be served from a domain root — which it is, at creekstreet.org. Opening the files straight off disk will not load styles; run a local server instead:

```bash
python3 -m http.server 4173
```

**The header and footer are copied into every page** because there is no template system. After editing either, run the check so the pages don't drift apart:

```bash
node tools/check-shared.mjs
```

It compares the header, footer, and disclaimer across all pages, confirms the required meta tags are present, and verifies every root-relative link points at a file that exists.

### Adding a meeting summary

1. Copy `meetings/2026-08-17.html` to `meetings/<date>.html` and rewrite the content.
2. Keep `<body data-nav="/meetings.html">` so the nav marks Meetings as current.
3. Add a `meeting-card` to the archive in `meetings.html`, newest first.
4. Replace the card in the `#updates` section of `index.html` with the new meeting.
5. Add the page to `sitemap.xml`.
6. Run `node tools/check-shared.mjs`.

### Labeling the record

Minutes are drafted after a meeting and adopted at the following one. Until the board adopts them, every reference to them on the site says **Draft — not yet adopted by the board**, and the summary carries a `badge--draft`. When minutes are adopted, swap the badge to `badge--adopted` and drop the draft lines.

Summaries describe what members *raised* or *discussed*. The board takes positions by motion; don't write one it hasn't taken.

## Publishing

GitHub Pages serves this repo at the apex domain. The [`CNAME`](./CNAME) file is set to `creekstreet.org`.

At the registrar, point DNS at GitHub Pages:

- `A` records for `@` to GitHub’s Pages IPs
- `CNAME` for `www` to `mitchelturner.github.io`

Then enable Pages on the `main` branch and add `creekstreet.org` as a custom domain so HTTPS can provision.
