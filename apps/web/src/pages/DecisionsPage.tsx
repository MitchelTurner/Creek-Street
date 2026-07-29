import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { api, formatDate, type Decision } from '../lib/api';

export function DecisionsPage() {
  const [rows, setRows] = useState<Decision[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.decisions(q || undefined).then(setRows).catch(() => setRows([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Decision archive"
        lede="Searchable history of board recommendations and the Planning Commission / Zoning Administrator outcome that followed. The single most useful public surface — and the wedge."
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search recommendations, outcomes, case numbers"
        className="mb-8 w-full max-w-lg rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
      />

      <ul className="space-y-6">
        {rows.map((d) => (
          <li
            key={d.id}
            className="animate-rise border-t border-ink/10 pt-6 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
                {d.application?.caseNumber ?? d.applicationId} · {formatDate(d.decidedAt)}
              </p>
              {d.voteFor != null && (
                <p className="text-xs text-ink/50">
                  Vote {d.voteFor}–{d.voteAgainst ?? 0}
                </p>
              )}
            </div>
            {d.application && (
              <p className="mt-2 text-sm text-ink/60">{d.application.description}</p>
            )}
            <p className="mt-3 font-display text-xl font-semibold leading-snug text-ink">
              {d.recommendation}
            </p>
            {d.conditions && (
              <p className="mt-2 text-sm text-ink/65">Conditions: {d.conditions}</p>
            )}
            {d.finalOutcome && (
              <p className="mt-3 text-sm font-medium text-creek">Final action: {d.finalOutcome}</p>
            )}
            <p className="mt-3">
              <SourceLink href={d.sourceDocUrl} />
            </p>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="text-sm text-ink/50">No decisions match. Archive grows as packets are mirrored.</p>
      )}
    </div>
  );
}
