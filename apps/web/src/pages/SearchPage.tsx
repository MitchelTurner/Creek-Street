import { FormEvent, useDeferredValue, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

type SearchHit = {
  type: string;
  id: string;
  title: string;
  snippet: string;
  href: string;
  score: number;
};

const TYPE_LABEL: Record<string, string> = {
  structure: 'Structure',
  application: 'Application',
  decision: 'Decision',
  meeting: 'Meeting',
  guidance: 'Guidance',
  criterion: 'Criterion',
};

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const deferredQ = useDeferredValue(q);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = deferredQ.trim();
    if (query.length < 2) {
      setHits([]);
      setTotal(0);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((d) => {
        setHits(d.hits ?? []);
        setTotal(d.total ?? 0);
        setError(null);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [deferredQ]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = q.trim();
    setParams(next ? { q: next } : {});
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Search the public mirror"
        lede="Structures, docket, decisions, meetings, and HD guidance. Private drafts and unreviewed AI summaries are never indexed."
      />

      <form onSubmit={onSubmit} className="mt-2 flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="site-search">
          Search
        </label>
        <input
          id="site-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. awning, Dolly’s, uniformity"
          className="field min-w-[16rem] flex-1"
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      <p className="mt-3 text-xs text-ink/45" aria-live="polite">
        {deferredQ.trim().length < 2
          ? 'Type at least two characters.'
          : loading
            ? 'Searching…'
            : `${total} match${total === 1 ? '' : 'es'}${total > hits.length ? ` (showing ${hits.length})` : ''}`}
      </p>
      {error && <p className="mt-2 text-sm text-cedar-deep">{error}</p>}

      <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/8">
        {hits.map((h) => (
          <li key={`${h.type}-${h.id}`}>
            <Link to={h.href} className="group block py-5 transition-colors hover:bg-mist/25">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                {TYPE_LABEL[h.type] ?? h.type}
              </p>
              <p className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink transition-colors group-hover:text-creek">
                {h.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{h.snippet}</p>
            </Link>
          </li>
        ))}
      </ul>
      {deferredQ.trim().length >= 2 && !loading && hits.length === 0 && !error && (
        <p className="mt-6 text-sm text-ink/50">No public matches. Try a street number, project type, or criterion.</p>
      )}
    </div>
  );
}
