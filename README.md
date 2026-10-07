# CreekStreet.org

An independent site about Creek Street in Ketchikan — the boardwalk, the historic district, and the projects coming to it.

**Live at [creekstreet.org](https://creekstreet.org)**

This site is not the Creek Street Architectural Design Review Board, and it is not an official publication of the Ketchikan Gateway Borough. Members, meetings, and how architectural review works are published by the Borough, on the [board page](https://www.kgbak.us/269/Creek-Street-Historic-District-Board).

## Contact

- This site: [hello@creekstreet.org](mailto:hello@creekstreet.org)
- Borough Planning Department, for review and meeting notices: [planning@kgbak.us](mailto:planning@kgbak.us), 907.228.6610

## Pages

- [`index.html`](./index.html) — the street, and what is coming to it
- [`projects.html`](./projects.html) — projects and problems on the street, with status and a source
- [`notes.html`](./notes.html) — independent notes on public meetings
- [`meetings/`](./meetings) — one note per meeting
- [`board.html`](./board.html) — points to the Borough for design-review information
- [`meetings.html`](./meetings.html), [`priorities.html`](./priorities.html), [`workshops.html`](./workshops.html) — old addresses, kept so existing links resolve
- [`404.html`](./404.html)

No build step. Plain HTML, one stylesheet, one small script.

## Editing

**Paths are root-relative** (`/styles.css`, `/projects.html`). The site must be served from a domain root — which it is, at creekstreet.org. Opening the files straight off disk will not load styles; run a local server instead:

```bash
python3 -m http.server 4173
```

**The header and footer are copied into every page** because there is no template system. After editing either, run the check so the pages don't drift apart:

```bash
node tools/check-shared.mjs
```

It compares the header, footer, and disclaimer across all pages, confirms the required meta tags are present, and verifies every root-relative link points at a file that exists.

Do not copy the Borough's member roster, phone numbers, or mailing addresses onto this site. That record belongs on the Borough's page.

### Adding a meeting note

1. Copy `meetings/2026-08-17.html` to `meetings/<date>.html` and rewrite the content.
2. Keep `<body data-nav="/notes.html">` so the nav marks Notes as current.
3. Add a `meeting-card` to the archive in `notes.html`, newest first.
4. Replace the card in the `#latest` section of `index.html` with the new note.
5. Add the page to `sitemap.xml`.
6. Run `node tools/check-shared.mjs`.

### Labeling the record

Minutes are drafted after a meeting and adopted at the following one. Until they are adopted, every reference says **draft**, and the note carries a `badge--draft`. When minutes are adopted, swap the badge to `badge--adopted` and drop the draft lines.

Notes describe what members *raised* or *discussed*. The board takes positions by motion; don't write one it hasn't taken. Don't write this site as if it were the board.

### Project status

On `projects.html`, a label is not a promise:

- `badge--agenda` — **Next up.** A specific next step was named in public.
- `badge--raised` — **Named.** Raised as a problem; nothing scheduled here.
- `badge--elsewhere` — **Broader than the street.**
- `badge--question` — **Unsettled.** It is not clear whose job this is.

Each item names its source. News reporting and meeting notes stay distinguishable.

## Publishing

GitHub Pages serves this repo at the apex domain. The [`CNAME`](./CNAME) file is set to `creekstreet.org`.

At the registrar, point DNS at GitHub Pages:

- `A` records for `@` to GitHub’s Pages IPs
- `CNAME` for `www` to `mitchelturner.github.io`

Then enable Pages on the `main` branch and add `creekstreet.org` as a custom domain so HTTPS can provision.
