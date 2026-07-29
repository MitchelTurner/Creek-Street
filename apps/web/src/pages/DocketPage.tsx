import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { api, formatDate, statusLabel, type Application } from '../lib/api';

export function DocketPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.applications(q || undefined).then(setRows).catch(() => setRows([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const live = rows.filter((r) => ['FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED'].includes(r.status));
  const rest = rows.filter((r) => !live.includes(r));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Application docket"
        lede="Live list of applications before the board — status, project type, and linked source documents. Sample rows are labeled until borough packets are ingested cooperatively."
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search case number or description"
        className="mb-8 w-full max-w-md rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
      />

      <Section title="Before the board" rows={live} />
      <Section title="Recent / closed (mirrored)" rows={rest} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Application[] }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">None in this view.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {rows.map((a) => (
            <li key={a.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-medium">
                  {a.caseNumber ?? 'Unnumbered'}{' '}
                  <span className="text-ink/45">· {a.projectType.replace(/_/g, ' ')}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">{a.description}</p>
                <p className="mt-2 text-xs text-ink/45">
                  {a.structure?.addressLabel ?? 'Parcel linked'} · filed {formatDate(a.filedAt)}
                </p>
                <p className="mt-2">
                  <SourceLink href={a.sourceDocUrl} />
                </p>
              </div>
              <div className="md:text-right">
                <span className="inline-block rounded bg-creek/10 px-2.5 py-1 text-xs font-semibold text-creek">
                  {statusLabel(a.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
