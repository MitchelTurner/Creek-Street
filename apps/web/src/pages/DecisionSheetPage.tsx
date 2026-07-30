import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { formatDate, statusLabel } from '../lib/api';

type DecisionSheet = {
  phase: number;
  decision: {
    id: string;
    recommendation: string;
    conditions: string | null;
    voteFor: number | null;
    voteAgainst: number | null;
    finalOutcome: string | null;
    decidedAt: string | null;
    sourceDocUrl: string;
  };
  application: {
    id: string;
    caseNumber: string | null;
    projectType: string;
    description: string;
    status: string;
    caseBriefUi: string;
  };
  structure: {
    commonName: string | null;
    addressLabel: string;
    publicSlug: string;
    yearBuilt: number | null;
  } | null;
  meeting: {
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    agendaUi: string;
    outcomesUi: string | null;
    packetPdf: string;
  } | null;
  precedents: Array<{
    id: string;
    photoUrl: string;
    side: string;
    caption: string;
    sourceDocUrl: string;
    criterion: string;
    weight: string;
  }>;
  disclaimer: string;
};

export function DecisionSheetPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<DecisionSheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/decisions/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<DecisionSheet>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const title = data?.application.caseNumber
    ? `Decision · ${data.application.caseNumber}`
    : 'Decision sheet';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title={title}
        lede="Mirrored board recommendation, vote, final action, and linked visual precedents. Not an official borough decision."
      />

      <p className="mb-6 text-sm">
        <Link to="/decisions" className="font-semibold text-creek underline">
          ← Decision archive
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-ink/50">Loading decision…</p> : null}

      {data ? (
        <div className="space-y-10">
          <p className="border-l-2 border-brass/70 pl-3 text-sm text-ink/70">{data.disclaimer}</p>

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm text-ink/60">
                {data.application.projectType.replace(/_/g, ' ')} · decided{' '}
                {formatDate(data.decision.decidedAt)}
              </p>
              <span className="inline-block rounded bg-creek/10 px-2.5 py-1 text-xs font-semibold text-creek">
                {statusLabel(data.application.status)}
              </span>
            </div>
            <p className="font-display text-2xl font-semibold leading-snug text-ink">
              {data.decision.recommendation}
            </p>
            {data.decision.conditions ? (
              <p className="text-sm text-ink/70">
                <span className="font-semibold text-ink">Conditions:</span>{' '}
                {data.decision.conditions}
              </p>
            ) : null}
            <p className="text-sm text-ink/65">
              Vote {data.decision.voteFor ?? '—'}–{data.decision.voteAgainst ?? '—'}
            </p>
            {data.decision.finalOutcome ? (
              <p className="text-sm font-medium text-creek">
                Final action: {data.decision.finalOutcome}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <a
                href={`/api/decisions/${id}/sheet.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Download decision PDF
              </a>
              <Link
                to={data.application.caseBriefUi}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Case brief
              </Link>
              <SourceLink href={data.decision.sourceDocUrl} />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-ink">Case & site</h2>
            <p className="text-sm text-ink/75">{data.application.description}</p>
            {data.structure ? (
              <p className="text-sm text-ink/65">
                <Link
                  className="font-semibold text-creek underline"
                  to={`/structures/${data.structure.publicSlug}`}
                >
                  {data.structure.commonName ?? data.structure.addressLabel}
                </Link>
                {data.structure.yearBuilt ? ` · c. ${data.structure.yearBuilt}` : ''}
              </p>
            ) : null}
          </section>

          {data.meeting ? (
            <section className="space-y-2">
              <h2 className="font-display text-2xl text-ink">Meeting</h2>
              <p className="text-sm text-ink/75">
                {new Date(data.meeting.scheduledAt).toLocaleString('en-US', {
                  timeZone: 'America/Juneau',
                })}{' '}
                · {data.meeting.location}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  to={data.meeting.agendaUi}
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  Agenda
                </Link>
                {data.meeting.outcomesUi ? (
                  <Link
                    to={data.meeting.outcomesUi}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Outcomes
                  </Link>
                ) : null}
                <a
                  href={data.meeting.packetPdf}
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  Packet PDF
                </a>
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Visual precedents</h2>
            {data.precedents.length === 0 ? (
              <p className="text-sm text-ink/55">No exemplars linked yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
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
                          to={`/guidance/criteria/${p.criterion}`}
                          className="font-semibold text-creek underline underline-offset-4"
                        >
                          {p.criterion.replace(/_/g, ' ')}
                        </Link>
                      </span>
                      <p className="mt-2">{p.caption}</p>
                    </figcaption>
                    <p className="mt-2">
                      <SourceLink href={p.sourceDocUrl} />
                    </p>
                  </figure>
                ))}
              </div>
            )}
            <p className="text-xs text-ink/45">
              Illustrative placeholders until packet exhibits are mirrored.{' '}
              <Link to="/precedents" className="font-semibold text-creek underline">
                Full precedent library
              </Link>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
