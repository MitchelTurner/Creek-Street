import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { statusLabel } from '../lib/api';

type Agenda = {
  phase: number;
  meeting: {
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    quorumMet: boolean | null;
    agendaUrl: string | null;
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
      caseBriefUi: string;
    } | null;
    structure: {
      commonName: string | null;
      addressLabel: string;
      publicSlug: string;
    } | null;
    decision: {
      recommendation: string;
      conditions: string | null;
      voteFor: number | null;
      voteAgainst: number | null;
      finalOutcome: string | null;
    } | null;
    note: string | null;
  }>;
  outcomes: { ui: string; pdf: string } | null;
  disclaimer: string;
};

export function MeetingAgendaPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<Agenda | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/meetings/${id}/agenda`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Agenda>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title="Meeting agenda"
        lede="Mirrored agenda items with public case links. Not a substitute for Clerk agendas or minutes."
      />

      <p className="mb-6 text-sm">
        <Link to="/meetings" className="font-semibold text-creek underline">
          ← Meeting calendar
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-ink/50">Loading agenda…</p> : null}

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
              {data.meeting.status.replace(/_/g, ' ')}
              {data.meeting.quorumMet === true ? ' · quorum met' : ''}
              {data.meeting.quorumMet === false ? ' · quorum failed' : ''}
            </p>
            {data.summary ? (
              <p className="text-sm text-ink/55">
                Published summary on file ({data.summary.id}
                {data.summary.reviewedAt
                  ? ` · reviewed ${new Date(data.summary.reviewedAt).toLocaleDateString()}`
                  : ''}
                ). Summary text is not shown on this agenda sheet.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <a
                href={`/api/meetings/${id}/agenda.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Download agenda PDF
              </a>
              <a
                href={`/api/meetings/${id}/packet.pdf`}
                className="font-semibold text-creek underline underline-offset-4"
              >
                Mirror packet PDF
              </a>
              {data.outcomes ? (
                <Link
                  to={data.outcomes.ui}
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  View outcomes
                </Link>
              ) : null}
              {data.meeting.agendaUrl ? (
                <SourceLink href={data.meeting.agendaUrl} label="Clerk agenda" />
              ) : null}
              {data.meeting.minutesUrl ? (
                <SourceLink href={data.meeting.minutesUrl} label="Minutes" />
              ) : null}
              {data.meeting.videoUrl ? (
                <SourceLink href={data.meeting.videoUrl} label="Video" />
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Agenda items</h2>
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
                          to={item.application.caseBriefUi}
                        >
                          {item.application.caseNumber ?? item.application.id}
                        </Link>{' '}
                        · {item.application.projectType.replace(/_/g, ' ')} ·{' '}
                        {statusLabel(item.application.status)}
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
                      <p className="mt-2 text-sm leading-relaxed text-ink/70">
                        {item.application.description}
                      </p>
                      {item.decision ? (
                        <p className="mt-2 text-sm text-ink/60">
                          Mirrored decision: vote {item.decision.voteFor ?? '—'}–
                          {item.decision.voteAgainst ?? '—'} ·{' '}
                          {item.decision.finalOutcome ?? '—'}
                        </p>
                      ) : null}
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
