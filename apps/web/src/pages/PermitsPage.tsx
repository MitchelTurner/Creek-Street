import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { api, type PermitTriggerResult } from '../lib/api';

const FLAGS: { key: string; label: string }[] = [
  { key: 'inHdZone', label: 'In HD zone' },
  { key: 'exteriorChange', label: 'Exterior change' },
  { key: 'overWater', label: 'Over water' },
  { key: 'inWater', label: 'In water' },
  { key: 'substructure', label: 'Substructure / pilings' },
  { key: 'groundDisturbing', label: 'Ground-disturbing' },
  { key: 'structural', label: 'Structural' },
  { key: 'occupancyChange', label: 'Occupancy change' },
  { key: 'fill', label: 'Fill' },
  { key: 'wastewater', label: 'Wastewater' },
  { key: 'federalNexus', label: 'Federal funding / permit nexus' },
  { key: 'includeUnverified', label: 'Include unverified research leads' },
];

export function PermitsPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    inHdZone: true,
    exteriorChange: true,
  });
  const [data, setData] = useState<PermitTriggerResult | null>(null);

  const queryKey = useMemo(() => JSON.stringify(flags), [flags]);

  useEffect(() => {
    api.permitTriggers(flags).then(setData).catch(() => setData(null));
  }, [queryKey, flags]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Multi-agency permit trigger map"
        lede="Design review is often the smallest approval a Creek Street project needs. Answer location characteristics; get agencies, statutory cites, and typical lead times — verified rows only unless you opt in."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLAGS.map((f) => (
          <label
            key={f.key}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-ink/10 bg-foam/50 px-3 py-2.5 text-sm"
          >
            <input
              type="checkbox"
              checked={Boolean(flags[f.key])}
              onChange={(e) => setFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))}
              className="accent-creek"
            />
            {f.label}
          </label>
        ))}
      </div>

      {data && <p className="mt-6 text-xs text-ink/50">{data.note}</p>}

      <ul className="mt-8 space-y-6">
        {data?.results.map((t) => (
          <li key={t.id} className="border-t border-ink/10 pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">{t.permitName}</h2>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  t.verified ? 'bg-creek/10 text-creek' : 'bg-brass/20 text-cedar-deep'
                }`}
              >
                {t.verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/60">
              {t.agency.name} · {t.agency.jurisdiction}
            </p>
            <p className="mt-3 text-sm font-medium text-creek">{t.statutoryCite}</p>
            {t.typicalLeadTimeDays != null && (
              <p className="mt-1 text-sm text-ink/65">
                Typical lead time: ~{t.typicalLeadTimeDays} days (not a promise)
              </p>
            )}
            {t.verifiedNote && <p className="mt-3 text-sm leading-relaxed text-ink/65">{t.verifiedNote}</p>}
            <div className="mt-3 flex flex-wrap gap-4">
              <SourceLink href={t.guidanceUrl} label="Guidance" />
              <SourceLink href={t.agency.contactUrl} label="Agency contact" />
            </div>
          </li>
        ))}
      </ul>

      {data && data.results.length === 0 && (
        <p className="mt-8 text-sm text-ink/50">
          No triggers matched. Try enabling more characteristics, or include unverified research leads.
        </p>
      )}

      {data && (
        <p className="mt-10 max-w-2xl text-xs text-ink/45">
          {data.zoningAdministrator.note}{' '}
          <a href={data.zoningAdministrator.url} className="underline" target="_blank" rel="noreferrer">
            {data.zoningAdministrator.label}
          </a>
        </p>
      )}
    </div>
  );
}
