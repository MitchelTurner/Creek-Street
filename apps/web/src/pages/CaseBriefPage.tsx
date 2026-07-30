import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { formatDate, statusLabel } from '../lib/api';

type CaseBrief = {
  phase: number;
  application: {
    id: string;
    caseNumber: string | null;
    projectType: string;
    description: string;
    status: string;
    filedAt: string | null;
    applicantName: string | null;
    sourceDocUrl: string | null;
  };
  structure: {
    commonName: string | null;
    addressLabel: string;
    publicSlug: string;
    yearBuilt: number | null;
  } | null;
  parcel: { parcelNumber: string; address: string } | null;
  decisions: Array<{
    id: string;
    meetingId: string | null;
    recommendation: string;
    conditions: string | null;
    voteFor: number | null;
    voteAgainst: number | null;
    finalOutcome: string | null;
    decidedAt: string | null;
    sourceDocUrl: string;
  }>;
  meetings: Array<{
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    outcomes: { ui: string; pdf: string } | null;
    packetPdf: string;
    minutesUrl: string | null;
    agendaUrl: string | null;
  }>;
  disclaimer: string;
};

export function CaseBriefPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<CaseBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/applications/${id}/brief`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<CaseBrief>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const title = data?.application.caseNumber ?? data?.application.id ?? 'Case brief';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title={title}
        lede="Mirrored public case facts — site, decisions, and related meetings. Not an official borough case file."
      />

      <p className="mb-6 text-sm">
        <Link to="/docket" className="font-semibold text-creek underline">
          ← Application docket
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-ink/50">Loading case…</p> : null}

      {data ? (
        <div className="space-y-10">
          <p className="border-l-2 border-brass/70 pl-3 text-sm text-ink/70">{data.disclaimer}</p>

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm text-ink/60">
                {data.application.projectType.replace(/_/g, ' ')} · filed{' '}
                {formatDate(data.application.filedAt)}
              </p>
              <span className="inline-block rounded bg-creek/10 px-2.5 py-1 text-xs font-semibold text-creek">
                {statusLabel(data.application.status)}
              </span>
            </div>
            <p className="text-base leading-relaxed text-ink/80">{data.application.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href={`/api/applications/${id}/brief.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Download case brief PDF
              </a>
              <a
                href={`/api/digest/case/${id}/preview`}
                className="font-semibold text-creek underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Subscriber digest preview
              </a>
              {data.application.sourceDocUrl ? (
                <SourceLink href={data.application.sourceDocUrl} />
              ) : null}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-ink">Site</h2>
            {data.structure ? (
              <p className="text-sm text-ink/75">
                <Link
                  className="font-semibold text-creek underline"
                  to={`/structures/${data.structure.publicSlug}`}
                >
                  {data.structure.commonName ?? data.structure.addressLabel}
                </Link>
                {data.structure.yearBuilt ? ` · c. ${data.structure.yearBuilt}` : ''}
              </p>
            ) : (
              <p className="text-sm text-ink/55">No structure linked.</p>
            )}
            {data.parcel ? (
              <p className="text-sm text-ink/60">
                Parcel {data.parcel.parcelNumber} · {data.parcel.address}
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Decisions</h2>
            {data.decisions.length === 0 ? (
              <p className="text-sm text-ink/55">No mirrored decision yet.</p>
            ) : (
              <ul className="space-y-5">
                {data.decisions.map((d) => (
                  <li key={d.id} className="border-b border-ink/10 pb-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
                      {formatDate(d.decidedAt)}
                      {d.voteFor != null ? ` · vote ${d.voteFor}–${d.voteAgainst ?? 0}` : ''}
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
                      {d.recommendation}
                    </p>
                    {d.conditions ? (
                      <p className="mt-2 text-sm text-ink/65">Conditions: {d.conditions}</p>
                    ) : null}
                    {d.finalOutcome ? (
                      <p className="mt-2 text-sm font-medium text-creek">
                        Final action: {d.finalOutcome}
                      </p>
                    ) : null}
                    <p className="mt-2">
                      <SourceLink href={d.sourceDocUrl} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Related meetings</h2>
            {data.meetings.length === 0 ? (
              <p className="text-sm text-ink/55">No related mirrored meetings.</p>
            ) : (
              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {data.meetings.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                    <div>
                      <p className="font-medium text-ink">
                        {new Date(m.scheduledAt).toLocaleString('en-US', {
                          timeZone: 'America/Juneau',
                        })}
                      </p>
                      <p className="mt-1 text-sm text-ink/60">
                        {m.location} · {m.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {m.outcomes ? (
                        <Link
                          to={m.outcomes.ui}
                          className="font-semibold text-creek underline underline-offset-4"
                        >
                          View outcomes
                        </Link>
                      ) : null}
                      <a
                        href={m.packetPdf}
                        className="font-semibold text-creek underline underline-offset-4"
                      >
                        Packet PDF
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
