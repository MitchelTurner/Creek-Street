import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { formatDate, statusLabel } from '../lib/api';

type StructureSheet = {
  phase: number;
  structure: {
    publicSlug: string;
    commonName: string | null;
    addressLabel: string;
    yearBuilt: number | null;
    nrhpContributing: boolean;
    historicNarrative: string;
    sourceDocUrl: string;
  };
  parcel: { parcelNumber: string; address: string } | null;
  photos: Array<{
    id: string;
    photoUrl: string;
    yearApprox: number | null;
    caption: string;
    credit: string;
    isHistoric: boolean;
  }>;
  applications: Array<{
    id: string;
    caseNumber: string | null;
    projectType: string;
    description: string;
    status: string;
    filedAt: string | null;
    caseBriefUi: string;
  }>;
  decisions: Array<{
    id: string;
    recommendation: string;
    conditions: string | null;
    voteFor: number | null;
    voteAgainst: number | null;
    finalOutcome: string | null;
    decidedAt: string | null;
    sourceDocUrl: string;
    decisionUi: string;
  }>;
  criteria: Array<{ key: string; ui: string }>;
  precedents: Array<{
    id: string;
    photoUrl: string;
    side: string;
    caption: string;
    sourceDocUrl: string;
    criterion: string;
    decisionUi: string;
    criterionUi: string;
  }>;
  meetings: Array<{
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    agendaUi: string;
    outcomesUi: string | null;
    summaryUi: string | null;
    packetPdf: string;
  }>;
  disclaimer: string;
  links: { pdf: string; visit: string };
};

export function StructureDetailPage() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<StructureSheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/structures/${slug}/sheet`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<StructureSheet>;
      })
      .then(setData)
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

  if (!data) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/50">Loading…</div>;
  }

  const row = data.structure;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title={row.commonName ?? row.addressLabel}
        lede="Civic dossier — NRHP inventory facts with mirrored cases, decisions, criteria, and meetings. Not an official borough property file."
      />

      {row.commonName ? <p className="mb-4 text-lg text-ink/65">{row.addressLabel}</p> : null}

      <p className="mb-6 border-l-2 border-brass/70 pl-3 text-sm text-ink/70">{data.disclaimer}</p>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded bg-mist/70 px-2.5 py-1">Built {row.yearBuilt ?? '—'}</span>
        <span
          className={`rounded px-2.5 py-1 font-medium ${
            row.nrhpContributing ? 'bg-cedar/15 text-cedar-deep' : 'bg-ink/5 text-ink/55'
          }`}
        >
          {row.nrhpContributing ? 'NRHP contributing' : 'Non-contributing'}
        </span>
        {data.parcel ? (
          <span className="rounded bg-mist/70 px-2.5 py-1">Parcel {data.parcel.parcelNumber}</span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <a
          href={data.links.pdf}
          className="font-semibold text-creek underline underline-offset-4"
        >
          Download dossier PDF
        </a>
        <Link
          to={data.links.visit}
          className="font-semibold text-creek underline underline-offset-4"
        >
          Visitor / tourism view
        </Link>
        <Link to="/map" className="font-semibold text-creek underline underline-offset-4">
          District map
        </Link>
        <SourceLink href={row.sourceDocUrl} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-semibold">What is this building</h2>
        <p className="text-base leading-relaxed text-ink/75">{row.historicNarrative}</p>
      </section>

      {data.photos.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Photo time-series</h2>
          <div className="mt-4 space-y-6">
            {data.photos.map((p) => (
              <figure key={p.id}>
                <img src={p.photoUrl} alt={p.caption} className="w-full object-cover" />
                <figcaption className="mt-2 text-sm text-ink/65">
                  <span className="font-medium text-ink">{p.yearApprox ?? '—'}</span> — {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Applications</h2>
        {data.applications.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">No mirrored applications for this structure yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {data.applications.map((a) => (
              <li key={a.id} className="py-3">
                <p className="font-medium">
                  <Link
                    to={a.caseBriefUi}
                    className="text-ink underline-offset-4 hover:text-creek hover:underline"
                  >
                    {a.caseNumber ?? a.id}
                  </Link>{' '}
                  <span className="text-ink/45">· {a.projectType.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-sm text-ink/65">{a.description}</p>
                <p className="mt-1 text-xs text-ink/45">
                  {statusLabel(a.status)} · filed {formatDate(a.filedAt)} ·{' '}
                  <Link
                    to={a.caseBriefUi}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Case brief
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Board decisions</h2>
        {data.decisions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">No mirrored decisions yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.decisions.map((d) => (
              <li key={d.id} className="border-l-2 border-creek pl-4">
                <p className="text-sm leading-relaxed">
                  <Link
                    to={d.decisionUi}
                    className="font-semibold text-ink underline-offset-4 hover:text-creek hover:underline"
                  >
                    {d.recommendation}
                  </Link>
                </p>
                {d.finalOutcome ? (
                  <p className="mt-1 text-sm text-ink/60">Final outcome: {d.finalOutcome}</p>
                ) : null}
                <p className="mt-2 flex flex-wrap gap-3 text-xs">
                  <Link
                    to={d.decisionUi}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Decision sheet
                  </Link>
                  <SourceLink href={d.sourceDocUrl} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.criteria.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Review criteria</h2>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {data.criteria.map((c) => (
              <li key={c.key}>
                <Link
                  to={c.ui}
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  {c.key.replace(/_/g, ' ')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.precedents.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Visual precedents</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {data.precedents.map((p) => (
              <figure key={p.id}>
                <img
                  src={p.photoUrl}
                  alt={p.caption}
                  className="aspect-[16/10] w-full object-cover"
                />
                <figcaption className="mt-3 text-sm leading-relaxed text-ink/70">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                    {p.side.replace(/_/g, ' ')} ·{' '}
                    <Link
                      to={p.criterionUi}
                      className="font-semibold text-creek underline underline-offset-4"
                    >
                      {p.criterion.replace(/_/g, ' ')}
                    </Link>
                  </span>
                  <p className="mt-2">{p.caption}</p>
                </figcaption>
                <p className="mt-2 text-xs">
                  <Link
                    to={p.decisionUi}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Decision sheet
                  </Link>
                </p>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {data.meetings.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Related meetings</h2>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {data.meetings.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">
                    {new Date(m.scheduledAt).toLocaleString('en-US', {
                      timeZone: 'America/Juneau',
                    })}
                  </p>
                  <p className="mt-1 text-ink/60">
                    {m.location} · {m.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <Link
                    to={m.agendaUi}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Agenda
                  </Link>
                  {m.outcomesUi ? (
                    <Link
                      to={m.outcomesUi}
                      className="font-semibold text-creek underline underline-offset-4"
                    >
                      Outcomes
                    </Link>
                  ) : null}
                  {m.summaryUi ? (
                    <Link
                      to={m.summaryUi}
                      className="font-semibold text-creek underline underline-offset-4"
                    >
                      Summary
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-xs text-ink/45">
        QR target slug: <code className="rounded bg-mist/60 px-1.5 py-0.5">{row.publicSlug}</code>
      </p>
    </div>
  );
}
