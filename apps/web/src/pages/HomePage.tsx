import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api, type Meta } from '../lib/api';
import { DEFAULT_DESC, JsonLd, SITE } from '../lib/seo';

export function HomePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [updatedLabel, setUpdatedLabel] = useState('Checking mirror sync…');

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    fetch('/api/ingest/status')
      .then((r) => r.json())
      .then((d) => {
        const runs = (d.recentRuns ?? d.runs ?? []) as Array<{ finishedAt?: string; startedAt?: string }>;
        const stamp =
          runs.map((x) => x.finishedAt || x.startedAt).find(Boolean) ||
          d.lastRunAt ||
          d.updatedAt ||
          null;
        if (stamp) {
          const when = new Date(stamp).toLocaleString('en-US', {
            timeZone: 'America/Juneau',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          setUpdatedLabel(`Last mirrored sync ${when} (Alaska)`);
        } else {
          setUpdatedLabel('Seeded public mirror · live ingest when feeds are configured');
        }
      })
      .catch(() => setUpdatedLabel('Public mirror online · confirm freshness with primary sources'));
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

      <section className="relative min-h-[100svh] overflow-hidden" aria-label="Hero">
        <img
          src="/hero-creek.jpg"
          alt=""
          className="hero-kenburns absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(7,19,18,0.82) 0%, rgba(7,19,18,0.55) 46%, rgba(10,46,44,0.28) 100%), linear-gradient(180deg, rgba(7,19,18,0.2) 0%, rgba(7,19,18,0.62) 100%)',
          }}
        />
        <div className="hero-fog pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-foam/20 to-transparent" />
        <div className="tide-sheen pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-creek-bright/25 to-transparent" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 md:px-6 md:pb-24">
          <p className="animate-rise font-display text-[clamp(3.4rem,10vw,7.5rem)] font-semibold leading-[0.9] tracking-tight text-foam">
            Creek Street
          </p>
          <p className="animate-rise-delay mt-3 font-display text-[clamp(1.4rem,3.6vw,2.6rem)] font-medium leading-tight text-board">
            Design Review Hub
          </p>
          <p className="animate-rise-delay mt-6 max-w-lg text-base leading-relaxed text-foam/85 md:text-lg">
            The Historic District boardwalk, made legible — structures, docket, and the rules that
            shape what gets built.
          </p>
          <div className="animate-rise-delay-2 mt-9 flex flex-wrap gap-3">
            <Link
              to="/triage"
              className="inline-flex items-center justify-center rounded-lg bg-board px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-foam"
            >
              Do I need review?
            </Link>
            <Link to="/map" className="btn-ghost">
              Open the district map
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl text-balance">
            From question to filing plan
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/65 text-pretty">
            Independent of the borough. Public mirror plus decision-support — no deliberation, no
            private records custody.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Triage',
              body: 'Branching questions that cite the code and always end at the Zoning Administrator.',
              to: '/triage',
            },
            {
              title: 'Filing pathway',
              body: 'One printable plan: triage, permits, HD notice, and a build-season file-by date.',
              to: '/filing',
            },
            {
              title: 'Journal',
              body: 'Daily case studies from other historic districts — culture, business, and revenue ideas with photo embeds.',
              to: '/journal',
            },
            {
              title: 'Civic ideas',
              body: 'Generate strategies that preserve culture, grow business, and fund City & Borough capacity.',
              to: '/ideas',
            },
          ].map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'group surface-panel block',
                i === 0 ? 'animate-rise' : i === 1 ? 'animate-rise-delay' : 'animate-rise-delay-2',
              ].join(' ')}
            >
              <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-creek">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.body}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-creek transition-transform group-hover:translate-x-0.5">
                Continue →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-4 border-t border-ink/10 pt-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
              Mirror freshness
            </p>
            <p className="mt-1 text-sm text-ink/65" id="mirror-updated">
              {updatedLabel}
            </p>
          </div>
          {meta && (
            <p className="text-xs tracking-wide text-ink/40">
              Operator {meta.operator} · NRHP {meta.nrhpReference} · Not a borough property
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
