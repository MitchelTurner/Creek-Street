# CreekStreet.org

Public site of the Creek Street Historic District Architectural Design Review Board in Ketchikan, Alaska.

**Live at [creekstreet.org](https://creekstreet.org)**

This is an independent site to make the board’s work easier to follow. It is not an official publication of the Ketchikan Gateway Borough.

## Contact

- Public inbox: [hello@creekstreet.org](mailto:hello@creekstreet.org)
- Meeting notices and project questions go to the same address

## Pages

- [`index.html`](./index.html) — purpose, what the board reviews, meeting updates
- [`workshops.html`](./workshops.html) — the open conversation after each agenda

## Publishing

GitHub Pages should serve this repo at the apex domain. The [`CNAME`](./CNAME) file is set to `creekstreet.org`.

At the registrar, point DNS at GitHub Pages:

- `A` records for `@` to GitHub’s Pages IPs
- `CNAME` for `www` to `mitchelturner.github.io` (or the Pages hostname GitHub shows)

Then enable Pages on the `main` branch and add `creekstreet.org` as a custom domain so HTTPS can provision.

## Editing meeting updates

In `index.html`, edit the `UPDATES` array and the `NEXT_MEETING` object. New entries go at the top of the array.
