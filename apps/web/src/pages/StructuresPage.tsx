import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PageSkeleton } from '../components/Skeleton';
import { SourceLink } from '../components/SourceLink';
import { api, type StructureSummary } from '../lib/api';

export function StructuresPage() {
  const [rows, setRows] = useState<StructureSummary[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    const contrib = filter === 'all' ? undefined : filter === 'yes';
    setRows(null);
    api.structures(contrib).then(setRows).catch(() => setRows([]));
  }, [filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Structure inventory"
        lede="Buildings in the Creek Street Historic District from the 2014 NRHP nomination (ref. 14000454), plus non-contributing inventory for map completeness."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {(
            [
              ['all', 'All'],
              ['yes', 'Contributing'],
              ['no', 'Non-contributing'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === key ? 'bg-ink text-foam' : 'bg-mist/50 text-ink/70 hover:bg-mist'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link to="/map" className="text-sm font-semibold text-creek underline underline-offset-4">
          Open district map
        </Link>
      </div>

      {rows === null && <PageSkeleton />}
      {rows && rows.length === 0 && (
        <EmptyState
          title="No structures in this filter"
          body="Try All, or open the map to browse by location."
          action={{ to: '/map', label: 'Browse map' }}
        />
      )}
      {rows && rows.length > 0 && (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                to={`/structures/${s.publicSlug}`}
                className="flex flex-col gap-1 py-4 transition hover:bg-mist/30 md:flex-row md:items-baseline md:justify-between md:gap-6"
              >
                <div>
                  <p className="font-display text-xl font-semibold text-ink">
                    {s.commonName ?? s.addressLabel}
                  </p>
                  {s.commonName && <p className="text-sm text-ink/60">{s.addressLabel}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60">
                  <span>{s.yearBuilt ?? 'Year n/a'}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      s.nrhpContributing ? 'bg-cedar/15 text-cedar-deep' : 'bg-ink/5 text-ink/50'
                    }`}
                  >
                    {s.nrhpContributing ? 'Contributing' : 'Non-contributing'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6">
        <SourceLink href="https://npgallery.nps.gov/AssetDetail/NRIS/14000454" label="NRHP nomination 14000454" />
      </p>
    </div>
  );
}
