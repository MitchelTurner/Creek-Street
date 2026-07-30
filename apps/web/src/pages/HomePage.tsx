import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api, type Meta } from '../lib/api';
import { DEFAULT_DESC, JsonLd, SITE } from '../lib/seo';

export function HomePage() {
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setMeta(null));
  }, []);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE,
      description: DEFAULT_DESC,
      url: typeof window !== 'undefined' ? window.location.origin : 'https://creek-street.local',
      publisher: {
        '@type': 'Organization',
        name: 'Mitchel Turner Dev, LLC',
        description: 'Independent operator — not a borough property.',
      },
      about: {
        '@type': 'GovernmentOrganization',
        name: 'Creek Street Historic District Architectural Design Review Board',
        parentOrganization: 'Ketchikan Gateway Borough',
      },
    }),
    [],
  );

  return (
    <div>
      <JsonLd data={jsonLd} />
      <section className="relative min-h-[92vh] overflow-hidden border-b border-ink/10" aria-label="Hero">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(105deg, rgba(14,28,28,0.78) 0%, rgba(14,28,28,0.45) 42%, rgba(20,92,90,0.25) 100%),
              linear-gradient(180deg, rgba(14,28,28,0.2), rgba(14,28,28,0.55)),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23145c5a'/%3E%3Cstop offset='.55' stop-color='%230e1c1c'/%3E%3Cstop offset='1' stop-color='%235c3a24'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1600' height='900' fill='url(%23g)'/%3E%3Cpath d='M0 620 C 220 540, 380 700, 620 640 S 1040 520, 1280 600 S 1500 680, 1600 640 L1600 900 L0 900 Z' fill='%231a2f2e' opacity='.55'/%3E%3Cpath d='M0 700 C 260 640, 480 760, 760 700 S 1180 620, 1600 720 L1600 900 L0 900 Z' fill='%238a5a3a' opacity='.28'/%3E%3C/svg%3E")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="hero-fog pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-foam/25 to-transparent" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:px-6 md:pb-24">
          <p className="animate-rise font-display text-5xl font-semibold leading-[0.95] tracking-tight text-foam md:text-7xl lg:text-8xl">
            Creek Street
            <span className="mt-2 block text-3xl font-medium text-board md:text-5xl">
              Design Review Hub
            </span>
          </p>
          <p className="animate-rise-delay mt-6 max-w-xl text-base leading-relaxed text-foam/85 md:text-lg">
            Public mirror of the Historic District Architectural Design Review Board —
            structures, docket, decisions, and the rules made legible.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              to="/search"
              className="rounded-md bg-board px-5 py-3 text-sm font-semibold text-ink transition hover:bg-foam"
            >
              Search the mirror
            </Link>
            <Link
              to="/triage"
              className="rounded-md border border-foam/40 px-5 py-3 text-sm font-semibold text-foam transition hover:bg-foam/10"
            >
              Do I need review?
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-ink">Built as infrastructure</h2>
          <p className="mt-3 text-ink/70 leading-relaxed">
            Independent of the borough. Public mirror plus decision-support tools — no board
            deliberation, no private records custody. Every mirrored fact links to its source.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Triage wizard',
              body: 'Branching questions that cite KGBC 18.40.010(b)(13) and 18.90.020 — review required, not required, or confirm with ZA.',
              to: '/triage',
            },
            {
              title: 'Permit trigger map',
              body: 'Multi-agency jurisdiction as data. Verified rows only by default; unverified research leads stay gated.',
              to: '/permits',
            },
            {
              title: 'Precedent search',
              body: 'Visual pairs tagged by criterion, plus similarity search over the mirrored archive.',
              to: '/precedents',
            },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="group block border-t border-ink/15 pt-5">
              <h3 className="font-display text-xl font-semibold group-hover:text-creek transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.body}</p>
            </Link>
          ))}
        </div>

        {meta && (
          <p className="mt-12 text-xs text-ink/50">
            Operator: {meta.operator}. NRHP ref. {meta.nrhpReference}. Not a borough property.
          </p>
        )}
      </section>
    </div>
  );
}
