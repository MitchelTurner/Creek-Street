import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api, type CivicIdea, type IdeasBrief, type IdeasCatalog } from '../lib/api';

const FOCUSES = [
  { value: 'ALL', label: 'All three pillars' },
  { value: 'CULTURE', label: 'Preserve culture' },
  { value: 'BUSINESS', label: 'Build business' },
  { value: 'REVENUE', label: 'Drive public revenue' },
] as const;

const pillarTone: Record<string, string> = {
  CULTURE: 'text-creek border-creek/35 bg-creek/8',
  BUSINESS: 'text-cedar-deep border-cedar/35 bg-board/40',
  REVENUE: 'text-tide border-brass/40 bg-brass/10',
};

function IdeaBlock({ idea, index }: { idea: CivicIdea; index: number }) {
  return (
    <article
      className={[
        'border-t border-ink/10 py-7',
        index === 0 ? 'animate-rise' : index === 1 ? 'animate-rise-delay' : 'animate-rise-delay-2',
      ].join(' ')}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">{idea.pillar}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{idea.title}</h3>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/70">{idea.summary}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/55">
        <span className="font-semibold text-ink/70">Why it fits: </span>
        {idea.whyItFits}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-creek">
        <span className="font-semibold">Next step: </span>
        {idea.nextStep}
      </p>
      {idea.tags?.length > 0 && (
        <p className="mt-3 text-xs tracking-wide text-ink/40">{idea.tags.join(' · ')}</p>
      )}
      {idea.links && idea.links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {idea.links.map((l) => (
            <Link key={l.href + l.label} to={l.href} className="text-sm font-semibold text-creek hover:underline">
              {l.label} →
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export function IdeasPage() {
  const [focus, setFocus] = useState<string>('ALL');
  const [seed, setSeed] = useState('');
  const [catalog, setCatalog] = useState<IdeasCatalog | null>(null);
  const [brief, setBrief] = useState<IdeasBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogPillar, setCatalogPillar] = useState<string>('ALL');

  useEffect(() => {
    api
      .ideasCatalog()
      .then(setCatalog)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function generate(nextSeed?: string) {
    setLoading(true);
    setError(null);
    try {
      const row = await api.ideasGenerate({
        seed: nextSeed ?? (seed.trim() || undefined),
        focus,
        count: 2,
      });
      setBrief(row);
      setSeed(row.seed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate ideas');
    } finally {
      setLoading(false);
    }
  }

  const filteredCatalog =
    catalog?.ideas.filter((i) => catalogPillar === 'ALL' || i.pillar === catalogPillar) ?? [];

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-ink/10"
        aria-label="Civic ideas"
        style={{
          background:
            'radial-gradient(120% 80% at 8% 0%, rgba(26,138,132,0.22) 0%, transparent 55%), radial-gradient(90% 70% at 95% 15%, rgba(154,98,64,0.14) 0%, transparent 50%), linear-gradient(180deg, #e7f3f0 0%, #eef6f4 45%, #f7fbfa 100%)',
        }}
      >
        <div className="tide-sheen pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-creek/10 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
          <p className="animate-rise font-display text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-[0.92] tracking-tight text-tide">
            Creek Street
          </p>
          <h1 className="animate-rise-delay mt-4 max-w-3xl font-display text-[clamp(1.55rem,3.8vw,2.4rem)] font-semibold leading-tight tracking-tight text-ink text-balance">
            Ideas that keep culture alive, grow business, and fund the City & Borough
          </h1>
          <p className="animate-rise-delay mt-4 max-w-xl text-base leading-relaxed text-ink/65 md:text-lg">
            A curated generator for Historic District strategies — heritage craft, maker commerce, and
            public revenue — grounded in boardwalk design review.
          </p>

          <div className="animate-rise-delay-2 mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block text-sm text-ink/70 sm:min-w-[14rem]">
              Focus
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="field mt-1.5 w-full bg-foam/80"
              >
                {FOCUSES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ink/70 sm:min-w-[14rem] sm:flex-1">
              Seed <span className="text-ink/40">(optional)</span>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g. shoulder-season-2026"
                className="field mt-1.5 w-full bg-foam/80"
              />
            </label>
            <button
              type="button"
              className="btn-primary sm:mb-0.5"
              disabled={loading}
              onClick={() => void generate()}
            >
              {loading ? 'Generating…' : brief ? 'Generate again' : 'Generate ideas'}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <DisclaimerBanner />

        {error && <p className="mt-6 text-sm text-cedar-deep">{error}</p>}

        {catalog && !brief && (
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {catalog.pillars.map((p, i) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setFocus(p.key);
                  void generate(`${p.key.toLowerCase()}-${Date.now().toString(36)}`);
                }}
                className={[
                  'text-left transition hover:translate-y-[-1px]',
                  i === 0 ? 'animate-rise' : i === 1 ? 'animate-rise-delay' : 'animate-rise-delay-2',
                ].join(' ')}
              >
                <p
                  className={`inline-block border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${pillarTone[p.key]}`}
                >
                  {p.key}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">{p.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{p.blurb}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-creek">Generate this pillar →</span>
              </button>
            ))}
          </div>
        )}

        {brief && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.16em] text-ink/40">Brief · seed {brief.seed}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink text-balance md:text-4xl">
              {brief.headline}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/65">{brief.lede}</p>

            <section className="mt-12" aria-labelledby="spotlight-heading">
              <h3 id="spotlight-heading" className="font-display text-xl font-semibold text-ink">
                Spotlight
              </h3>
              <div className="mt-2">
                {brief.spotlight.map((idea, i) => (
                  <IdeaBlock key={idea.id} idea={idea} index={i} />
                ))}
              </div>
            </section>

            <section className="mt-14 border-t border-ink/10 pt-10" aria-labelledby="playbook-heading">
              <h3 id="playbook-heading" className="font-display text-xl font-semibold">
                Playbook
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/70">
                {brief.playbook.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {Object.entries(brief.links).map(([key, href]) => (
                  <Link key={key} to={href} className="text-sm font-semibold capitalize text-creek hover:underline">
                    {key} →
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-14" aria-labelledby="pillars-heading">
              <h3 id="pillars-heading" className="font-display text-xl font-semibold">
                Pillar stack
              </h3>
              <div className="mt-6 space-y-10">
                {(['CULTURE', 'BUSINESS', 'REVENUE'] as const).map((pillar) => (
                  <div key={pillar}>
                    <p
                      className={`inline-block border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${pillarTone[pillar]}`}
                    >
                      {pillar}
                    </p>
                    {brief.pillars[pillar].map((idea, i) => (
                      <IdeaBlock key={idea.id} idea={idea} index={i} />
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-10 text-xs leading-relaxed text-ink/45">{brief.disclaimer}</p>

            <button
              type="button"
              className="btn-secondary mt-6"
              onClick={() => void generate(`reshuffle-${Date.now().toString(36)}`)}
              disabled={loading}
            >
              Shuffle a new brief
            </button>
          </div>
        )}

        {catalog && (
          <section className="mt-20 border-t border-ink/10 pt-12" aria-labelledby="catalog-heading">
            <h2 id="catalog-heading" className="font-display text-3xl font-semibold tracking-tight">
              Full idea catalog
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
              {catalog.count} curated prompts across culture, business, and municipal revenue.
              Independent brainstorming — not borough policy.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['ALL', 'CULTURE', 'BUSINESS', 'REVENUE'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCatalogPillar(p)}
                  className={[
                    'border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition',
                    catalogPillar === p
                      ? 'border-tide bg-tide text-foam'
                      : 'border-ink/15 bg-transparent text-ink/60 hover:border-ink/30',
                  ].join(' ')}
                >
                  {p === 'ALL' ? 'All' : p}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {filteredCatalog.map((idea, i) => (
                <IdeaBlock key={idea.id} idea={idea} index={Math.min(i, 2)} />
              ))}
            </div>
            <p className="mt-8 text-xs leading-relaxed text-ink/45">{catalog.disclaimer}</p>
          </section>
        )}
      </div>
    </div>
  );
}
