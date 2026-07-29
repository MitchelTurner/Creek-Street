import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { api, type PrecedentRow, type SimilarResult } from '../lib/api';

const CRITERIA = [
  ['', 'All criteria'],
  ['MATERIAL_HONESTY', 'Material honesty'],
  ['APPROPRIATENESS', 'Appropriateness'],
  ['DESIGN_QUALITY', 'Design quality'],
  ['UNIFORMITY', 'Uniformity'],
  ['DISSIMILARITY', 'Dissimilarity'],
] as const;

export function PrecedentsPage() {
  const [criterion, setCriterion] = useState('');
  const [rows, setRows] = useState<PrecedentRow[]>([]);
  const [query, setQuery] = useState('wood sign boardwalk façade hand-painted');
  const [similar, setSimilar] = useState<SimilarResult | null>(null);

  useEffect(() => {
    api.precedents(criterion || undefined).then(setRows).catch(() => setRows([]));
  }, [criterion]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!query.trim()) {
        setSimilar(null);
        return;
      }
      api.similar(query).then(setSimilar).catch(() => setSimilar(null));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pairs = groupPairs(rows);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Precedent library & similarity search"
        lede="Approved outcomes tagged by the criterion that drove them — and a “show me applications like this one” index over mirrored descriptions and decisions."
      />

      <section className="mb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">Visual library</h2>
          <select
            value={criterion}
            onChange={(e) => setCriterion(e.target.value)}
            className="rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
          >
            {CRITERIA.map(([value, label]) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-10">
          {pairs.map((pair) => (
            <div key={pair.key} className="border-t border-ink/10 pt-8">
              <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
                {pair.criterion.replace(/_/g, ' ')} · {pair.weight.replace(/_/g, ' ')}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {pair.items.map((item) => (
                  <figure key={item.id}>
                    <img
                      src={item.photoUrl}
                      alt={item.caption}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <figcaption className="mt-3 text-sm leading-relaxed text-ink/70">
                      <span className="font-semibold text-ink">{item.side.replace(/_/g, ' ')}</span>
                      {' — '}
                      {item.caption}
                    </figcaption>
                    <p className="mt-2">
                      <SourceLink href={item.sourceDocUrl} />
                    </p>
                  </figure>
                ))}
              </div>
              {pair.application && (
                <p className="mt-4 text-xs text-ink/45">
                  Linked application: {pair.application.caseNumber ?? pair.application.id}
                </p>
              )}
            </div>
          ))}
        </div>
        {pairs.length === 0 && (
          <p className="text-sm text-ink/50">No exemplars for this filter yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Similarity search</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">
          Lexical TF-IDF over application descriptions and decision text. Same index for applicants
          and board members. pgvector embeddings replace this when the embedding job ships.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe a project…"
          className="mt-4 w-full max-w-xl rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
        />

        <ul className="mt-6 space-y-4">
          {similar?.results.map((r) => (
            <li key={r.application.id} className="border-t border-ink/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {r.application.caseNumber ?? r.application.id}{' '}
                  <span className="text-ink/45">· {r.application.projectType.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-xs text-ink/45">score {r.score}</p>
              </div>
              <p className="mt-1 text-sm text-ink/70">{r.application.description}</p>
              {r.decisions[0] && (
                <p className="mt-2 text-sm text-creek">{r.decisions[0].recommendation}</p>
              )}
            </li>
          ))}
        </ul>
        {similar && similar.results.length === 0 && (
          <p className="mt-4 text-sm text-ink/50">No close matches in the mirrored archive yet.</p>
        )}
      </section>
    </div>
  );
}

function groupPairs(rows: PrecedentRow[]) {
  const byDecision = new Map<string, PrecedentRow[]>();
  for (const r of rows) {
    const list = byDecision.get(r.decisionId) ?? [];
    list.push(r);
    byDecision.set(r.decisionId, list);
  }
  return [...byDecision.entries()].map(([decisionId, items]) => ({
    key: decisionId,
    criterion: items[0]?.criterion ?? '',
    weight: items[0]?.weight ?? '',
    application: items[0]?.application ?? null,
    items,
  }));
}
