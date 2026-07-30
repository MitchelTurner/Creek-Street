import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';

type Outcomes = {
  phase: number;
  meeting: {
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    quorumMet: boolean | null;
    minutesUrl: string | null;
    videoUrl: string | null;
  };
  summary: { id: string; reviewedAt: string | null; isPublished: boolean } | null;
  items: Array<{
    agendaItem: { id: string; itemNumber: string; title: string };
    application: {
      id: string;
      caseNumber: string | null;
      projectType: string;
      description: string;
      status: string;
    } | null;
    structure: {
      commonName: string | null;
      addressLabel: string;
      publicSlug: string;
    } | null;
    decision: {
      id: string;
      recommendation: string;
      conditions: string | null;
      voteFor: number | null;
      voteAgainst: number | null;
      finalOutcome: string | null;
      decidedAt: string | null;
      sourceDocUrl: string;
    } | null;
    note: string | null;
  }>;
  disclaimer: string;
};

export function MeetingOutcomesPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<Outcomes | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/meetings/${id}/outcomes`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Outcomes>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title="Meeting outcomes"
        lede="Mirrored decisions and votes for a held meeting — public record facts only. Not a substitute for Clerk minutes."
      />

      <p className="mb-6 text-sm">
        <Link to="/meetings" className="font-semibold text-creek underline">
          ← Meeting calendar
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      {!data && !error ? (
        <p className="text-sm text-ink/50">Loading outcomes…</p>
      ) : null}

      {data ? (
        <div className="space-y-8">
          <p className="border-l-2 border-brass/70 pl-3 text-sm text-ink/70">{data.disclaimer}</p>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-ink">Meeting</h2>
            <p className="text-sm text-ink/75">
              {new Date(data.meeting.scheduledAt).toLocaleString('en-US', {
                timeZone: 'America/Juneau',
              })}{' '}
              · {data.meeting.location}
            </p>
            <p className="text-sm text-ink/55">
              {data.meeting.status}
              {data.meeting.quorumMet === true ? ' · quorum met' : ''}
              {data.meeting.quorumMet === false ? ' · quorum failed' : ''}
            </p>
            {data.summary ? (
              <p className="text-sm text-ink/55">
                Published summary on file ({data.summary.id}
                {data.summary.reviewedAt
                  ? ` · reviewed ${new Date(data.summary.reviewedAt).toLocaleDateString()}`
                  : ''}
                ). Summary text is not shown on this outcomes sheet.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <a
                href={`/api/meetings/${id}/outcomes.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Download outcomes PDF
              </a>
              <a
                href={`/api/meetings/${id}/packet.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Mirror packet PDF
              </a>
              {data.meeting.minutesUrl ? (
                <SourceLink href={data.meeting.minutesUrl} label="Minutes" />
              ) : null}
              {data.meeting.videoUrl ? (
                <SourceLink href={data.meeting.videoUrl} label="Video" />
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Agenda outcomes</h2>
            <ul className="space-y-4">
              {data.items.map((item) => (
                <li key={item.agendaItem.id} className="border-b border-ink/10 pb-4">
                  <p className="font-semibold text-ink">
                    {item.agendaItem.itemNumber}. {item.agendaItem.title}
                  </p>
                  {item.application ? (
                    <>
                      <p className="mt-2 text-sm text-ink/70">
                        <Link
                          className="font-semibold text-creek underline"
                          to={`/docket/${item.application.id}`}
                        >
                          {item.application.caseNumber ?? item.application.id}
                        </Link>{' '}
                        · {item.application.projectType.replace(/_/g, ' ')} ·{' '}
                        {item.application.status}
                      </p>
                      <p className="mt-1 text-sm text-ink/65">
                        {item.structure?.publicSlug ? (
                          <Link
                            className="underline"
                            to={`/structures/${item.structure.publicSlug}`}
                          >
                            {item.structure.commonName ?? item.structure.addressLabel}
                          </Link>
                        ) : (
                          (item.structure?.commonName ?? item.structure?.addressLabel ?? '—')
                        )}
                      </p>
                      {item.decision ? (
                        <div className="mt-3 space-y-1 text-sm text-ink/75">
                          <p>
                            <span className="font-semibold text-ink">Recommendation:</span>{' '}
                            {item.decision.recommendation}
                          </p>
                          {item.decision.conditions ? (
                            <p>
                              <span className="font-semibold text-ink">Conditions:</span>{' '}
                              {item.decision.conditions}
                            </p>
                          ) : null}
                          <p>
                            Vote {item.decision.voteFor ?? '—'}–{item.decision.voteAgainst ?? '—'} ·{' '}
                            {item.decision.finalOutcome ?? '—'}
                          </p>
                          {item.decision.sourceDocUrl ? (
                            <p>
                              <a
                                className="underline"
                                href={item.decision.sourceDocUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Source document
                              </a>
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-ink/55">No mirrored decision for this item.</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-ink/55">{item.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
