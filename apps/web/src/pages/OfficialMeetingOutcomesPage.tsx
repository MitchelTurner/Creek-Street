import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

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

export function OfficialMeetingOutcomesPage() {
  const { id = '' } = useParams();
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<Outcomes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBoard =
    user && (user.role === 'BOARD_MEMBER' || user.role === 'STAFF' || user.role === 'ADMIN');

  useEffect(() => {
    if (!isBoard || !id) return;
    fetch(`/api/board/meetings/${id}/outcomes`, { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Outcomes>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [isBoard, id, authHeaders]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/official" replace />;
  if (!isBoard) return <Navigate to="/workspace" replace />;

  async function downloadPdf() {
    setError(null);
    try {
      const res = await fetch(`/api/board/meetings/${id}/outcomes.pdf`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creek-street-meeting-outcomes-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title="Meeting outcomes"
        lede="Mirrored decisions and votes for a held meeting — public record facts only. Not a substitute for Clerk minutes."
      />

      <p className="mb-6 text-sm">
        <Link to="/official" className="font-semibold text-creek underline">
          ← Board portal
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
                ). Summary text is not shown here.
              </p>
            ) : null}
            <button
              type="button"
              className="rounded-md bg-creek px-4 py-2 text-sm font-semibold text-foam"
              onClick={() => void downloadPdf()}
            >
              Download outcomes PDF
            </button>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Agenda outcomes</h2>
            <ul className="space-y-4">
              {data.items.map((item) => (
                <li key={item.agendaItem.id} className="border border-ink/10 bg-foam/50 px-4 py-4">
                  <p className="font-semibold text-ink">
                    {item.agendaItem.itemNumber}. {item.agendaItem.title}
                  </p>
                  {item.application ? (
                    <>
                      <p className="mt-2 text-sm text-ink/70">
                        <Link
                          className="font-semibold text-creek underline"
                          to={`/official/applications/${item.application.id}`}
                        >
                          {item.application.caseNumber ?? item.application.id}
                        </Link>{' '}
                        · {item.application.projectType.replace(/_/g, ' ')} ·{' '}
                        {item.application.status}
                      </p>
                      <p className="mt-1 text-sm text-ink/65">
                        {item.structure?.commonName ?? item.structure?.addressLabel ?? '—'}
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
