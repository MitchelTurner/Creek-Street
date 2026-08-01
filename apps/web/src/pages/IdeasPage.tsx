import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  api,
  type AiSuggestion,
  type CivicIdea,
  type IdeasAiPost,
  type IdeasAiStatus,
  type IdeasBrief,
  type IdeasCatalog,
} from '../lib/api';

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

function IdeaBlock({ idea, index }: { idea: CivicIdea | AiSuggestion; index: number }) {
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
      {'links' in idea && idea.links && idea.links.length > 0 && (
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
  const [params] = useSearchParams();
  const [focus, setFocus] = useState<string>('ALL');
  const [seed, setSeed] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [catalog, setCatalog] = useState<IdeasCatalog | null>(null);
  const [brief, setBrief] = useState<IdeasBrief | null>(null);
  const [aiStatus, setAiStatus] = useState<IdeasAiStatus | null>(null);
  const [aiPost, setAiPost] = useState<IdeasAiPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<IdeasAiPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const [catalogPillar, setCatalogPillar] = useState<string>('ALL');

  useEffect(() => {
    api.ideasCatalog().then(setCatalog).catch((e: Error) => setError(e.message));
    api.ideasAiStatus().then(setAiStatus).catch(() => setAiStatus(null));
    api
      .ideasPosts(8)
      .then((r) => setRecentPosts(r.posts))
      .catch(() => setRecentPosts([]));
  }, []);

  useEffect(() => {
    const postId = params.get('post');
    if (!postId) return;
    api
      .ideasPost(postId)
      .then(setAiPost)
      .catch(() => setError('That AI idea post was not found (posts are in-memory until restart).'));
  }, [params]);

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

  async function askClaude() {
    setAiLoading(true);
    setError(null);
    setNotifyMsg(null);
    try {
      const row = await api.ideasAiSuggest({
        focus,
        notes: notes.trim() || undefined,
        notify: notifyEmail,
      });
      setAiPost(row);
      setRecentPosts((prev) => [row, ...prev.filter((p) => p.id !== row.id)].slice(0, 8));
      if (row.notify) {
        setNotifyMsg(
          `Emailed ${row.notify.accepted} of ${row.notify.recipients} inbox(es) via ${row.notify.mode}.`,
        );
      } else if (notifyEmail) {
        setNotifyMsg('Suggestion saved — email was not sent (check IDEA_NOTIFY_EMAILS / mail config).');
      }
      api.ideasAiStatus().then(setAiStatus).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claude suggestion failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function emailPost() {
    if (!aiPost) return;
    setNotifyLoading(true);
    setError(null);
    setNotifyMsg(null);
    try {
      const row = await api.ideasNotify(aiPost.id);
      setNotifyMsg(`Emailed ${row.accepted} of ${row.recipients} inbox(es) via ${row.mode}.`);
      setAiPost({ ...aiPost, notifiedAt: row.at, notifyRecipientCount: row.recipients });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send email');
    } finally {
      setNotifyLoading(false);
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
            Curated briefs plus Claude suggestions — heritage craft, maker commerce, and public
            revenue — emailed to your team when you post.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <DisclaimerBanner />

        <section
          className="mt-10 border-t border-ink/10 pt-10"
          aria-labelledby="claude-heading"
        >
          <h2 id="claude-heading" className="font-display text-3xl font-semibold tracking-tight">
            Ask Claude
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
            Claude drafts a short civic brief. Optionally email it to your notify list via Resend
            (or SMTP). Independent ideation — not borough policy.
          </p>
          {aiStatus && (
            <p className="mt-3 text-xs text-ink/45">
              Claude: {aiStatus.configured ? `ready · ${aiStatus.model}` : 'not configured (set ANTHROPIC_API_KEY)'}
              {' · '}
              Mail: {aiStatus.mail.mode}
              {' · '}
              Notify inboxes: {aiStatus.notifyRecipients}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block text-sm text-ink/70 sm:min-w-[14rem]">
              Focus
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="field mt-1.5 w-full"
              >
                {FOCUSES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ink/70 sm:min-w-[16rem] sm:flex-1">
              Notes for Claude <span className="text-ink/40">(optional)</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. shoulder season, Tlingit interpretation, parking revenue"
                className="field mt-1.5 w-full"
                maxLength={1200}
              />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              className="mt-1"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
            />
            <span>
              Email this suggestion to our team when Claude finishes
              <span className="block text-xs text-ink/45">
                Uses Resend when <code className="text-ink/55">RESEND_API_KEY</code> is set; otherwise
                SMTP or stub. Recipients from <code className="text-ink/55">IDEA_NOTIFY_EMAILS</code>.
              </span>
            </span>
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={aiLoading || (aiStatus !== null && !aiStatus.configured)}
              onClick={() => void askClaude()}
            >
              {aiLoading ? 'Asking Claude…' : 'Generate with Claude'}
            </button>
            {aiPost && !aiPost.notifiedAt && (
              <button
                type="button"
                className="btn-secondary"
                disabled={notifyLoading}
                onClick={() => void emailPost()}
              >
                {notifyLoading ? 'Sending…' : 'Email this post'}
              </button>
            )}
          </div>
        </section>

        {error && <p className="mt-6 text-sm text-cedar-deep">{error}</p>}
        {notifyMsg && <p className="mt-4 text-sm text-creek">{notifyMsg}</p>}

        {aiPost && (
          <div className="mt-12 animate-rise">
            <p className="text-xs uppercase tracking-[0.16em] text-ink/40">
              Claude brief · {aiPost.model}
              {aiPost.notifiedAt ? ' · emailed' : ''}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink text-balance md:text-4xl">
              {aiPost.headline}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/65">{aiPost.lede}</p>
            <div className="mt-2">
              {aiPost.suggestions.map((idea, i) => (
                <IdeaBlock key={`${idea.pillar}-${idea.title}`} idea={idea} index={i} />
              ))}
            </div>
            {aiPost.playbook.length > 0 && (
              <section className="mt-8 border-t border-ink/10 pt-8">
                <h3 className="font-display text-xl font-semibold">Playbook</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/70">
                  {aiPost.playbook.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            )}
            <p className="mt-8 text-xs leading-relaxed text-ink/45">{aiPost.disclaimer}</p>
          </div>
        )}

        {recentPosts.length > 0 && (
          <section className="mt-14 border-t border-ink/10 pt-10" aria-labelledby="recent-ai-heading">
            <h2 id="recent-ai-heading" className="font-display text-2xl font-semibold tracking-tight">
              Recent AI posts
            </h2>
            <ul className="mt-4 space-y-3">
              {recentPosts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="text-left text-sm font-semibold text-creek hover:underline"
                    onClick={() => setAiPost(p)}
                  >
                    {p.headline}
                  </button>
                  <span className="ml-2 text-xs text-ink/40">
                    {new Date(p.createdAt).toLocaleString('en-US', { timeZone: 'America/Juneau' })}
                    {p.notifiedAt ? ' · emailed' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-16 border-t border-ink/10 pt-10" aria-labelledby="curated-heading">
          <h2 id="curated-heading" className="font-display text-3xl font-semibold tracking-tight">
            Curated generator
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
            Offline catalog shuffle — no API key required. Use this when Claude is offline or you want
            deterministic seeds.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block text-sm text-ink/70 sm:min-w-[14rem]">
              Seed <span className="text-ink/40">(optional)</span>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g. shoulder-season-2026"
                className="field mt-1.5 w-full"
              />
            </label>
            <button
              type="button"
              className="btn-secondary sm:mb-0.5"
              disabled={loading}
              onClick={() => void generate()}
            >
              {loading ? 'Generating…' : brief ? 'Shuffle curated brief' : 'Generate curated ideas'}
            </button>
          </div>
        </section>

        {catalog && !brief && !aiPost && (
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
                <span className="mt-4 inline-block text-sm font-semibold text-creek">
                  Generate this pillar →
                </span>
              </button>
            ))}
          </div>
        )}

        {brief && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.16em] text-ink/40">Curated brief · seed {brief.seed}</p>
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
            <p className="mt-10 text-xs leading-relaxed text-ink/45">{brief.disclaimer}</p>
          </div>
        )}

        {catalog && (
          <section className="mt-20 border-t border-ink/10 pt-12" aria-labelledby="catalog-heading">
            <h2 id="catalog-heading" className="font-display text-3xl font-semibold tracking-tight">
              Full idea catalog
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
              {catalog.count} curated prompts across culture, business, and municipal revenue.
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
