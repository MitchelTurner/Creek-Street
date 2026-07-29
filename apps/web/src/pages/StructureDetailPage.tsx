import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SourceLink } from '../components/SourceLink';
import { api, formatDate, statusLabel, type StructureDetail } from '../lib/api';

export function StructureDetailPage() {
  const { slug } = useParams();
  const [row, setRow] = useState<StructureDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .structure(slug)
      .then(setRow)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-cedar-deep">{error}</p>
        <Link to="/structures" className="mt-4 inline-block text-sm underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  if (!row) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/50">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Structure profile</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink animate-rise">
        {row.commonName ?? row.addressLabel}
      </h1>
      {row.commonName && <p className="mt-1 text-lg text-ink/65">{row.addressLabel}</p>}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded bg-mist/70 px-2.5 py-1">Built {row.yearBuilt ?? '—'}</span>
        <span
          className={`rounded px-2.5 py-1 font-medium ${
            row.nrhpContributing ? 'bg-cedar/15 text-cedar-deep' : 'bg-ink/5 text-ink/55'
          }`}
        >
          {row.nrhpContributing ? 'NRHP contributing' : 'Non-contributing'}
        </span>
        {row.parcel && (
          <span className="rounded bg-mist/70 px-2.5 py-1">Parcel {row.parcel.parcelNumber}</span>
        )}
      </div>

      <div className="accent-line mt-8 h-px w-20" />

      <section className="mt-8 animate-rise-delay">
        <h2 className="font-display text-2xl font-semibold">What is this building</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/75">{row.historicNarrative}</p>
        <p className="mt-4">
          <SourceLink href={row.sourceDocUrl} />
        </p>
        <p className="mt-2 text-sm">
          <Link to={`/visit/${row.publicSlug}`} className="text-creek underline underline-offset-4">
            Visitor / tourism view
          </Link>
        </p>
      </section>

      {row.photos?.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Photo time-series</h2>
          <div className="mt-4 space-y-6">
            {row.photos.map((p) => (
              <figure key={p.id}>
                <img src={p.photoUrl} alt={p.caption} className="w-full object-cover" />
                <figcaption className="mt-2 text-sm text-ink/65">
                  <span className="font-medium text-ink">{p.yearApprox ?? '—'}</span> — {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Applications</h2>
        {row.applications.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">No mirrored applications for this structure yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {row.applications.map((a) => (
              <li key={a.id} className="py-3">
                <p className="font-medium">{a.caseNumber ?? a.id}</p>
                <p className="text-sm text-ink/65">{a.description}</p>
                <p className="mt-1 text-xs text-ink/45">
                  {statusLabel(a.status)} · filed {formatDate(a.filedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Board decisions</h2>
        {row.decisions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">No mirrored decisions yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {row.decisions.map((d) => (
              <li key={d.id} className="border-l-2 border-creek pl-4">
                <p className="text-sm leading-relaxed">{d.recommendation}</p>
                {d.finalOutcome && (
                  <p className="mt-1 text-sm text-ink/60">Final outcome: {d.finalOutcome}</p>
                )}
                <p className="mt-2">
                  <SourceLink href={d.sourceDocUrl} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-12 text-xs text-ink/45">
        QR target slug: <code className="rounded bg-mist/60 px-1.5 py-0.5">{row.publicSlug}</code>
      </p>
    </div>
  );
}
