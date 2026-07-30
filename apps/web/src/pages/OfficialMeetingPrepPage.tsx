import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type Prep = {
  phase: number;
  meeting: {
    id: string;
    scheduledAt: string;
    location: string;
    status: string;
    agendaUrl: string | null;
  };
  packet: { pdfPath: string; itemCount: number } | null;
  items: Array<{
    agendaItem: { id: string; itemNumber: string; title: string; applicationId: string | null };
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
    similar: Array<{
      applicationId: string;
      caseNumber: string | null;
      score: number;
      status: string;
    }>;
    privateNoteCount: number;
    note: string | null;
  }>;
  disclaimer: string;
  links: { pdf: string; packetPdf: string };
};

export function OfficialMeetingPrepPage() {
  const { id = '' } = useParams();
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<Prep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBoard =
    user && (user.role === 'BOARD_MEMBER' || user.role === 'STAFF' || user.role === 'ADMIN');

  useEffect(() => {
    if (!isBoard || !id) return;
    fetch(`/api/board/meetings/${id}/prep`, { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Prep>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [isBoard, id, authHeaders]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/official" replace />;
  if (!isBoard) return <Navigate to="/workspace" replace />;

  async function download(path: string, filename: string) {
    setError(null);
    try {
      const res = await fetch(path, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title="Meeting prep"
        lede="Personal brief for a mirrored meeting — public case facts, similar precedents, and your private-note counts. Not deliberation."
      />

      <p className="mb-6 text-sm">
        <Link to="/official" className="font-semibold text-creek underline">
          ← Board portal
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      {!data ? (
        <p className="text-sm text-ink/50">Loading prep…</p>
      ) : (
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
            <p className="text-sm text-ink/55">{data.meeting.status.replace(/_/g, ' ')}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="rounded-md bg-creek px-4 py-2 font-semibold text-foam"
                onClick={() =>
                  void download(
                    `/api/board/meetings/${id}/prep.pdf`,
                    `creek-street-meeting-prep-${id}.pdf`,
                  )
                }
              >
                Download prep PDF
              </button>
              <button
                type="button"
                className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
                onClick={() =>
                  void download(
                    `/api/board/meetings/${id}/packet.pdf`,
                    `creek-street-board-packet-${id}.pdf`,
                  )
                }
              >
                Packet PDF
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Agenda items</h2>
            {data.items.length === 0 ? (
              <p className="text-sm text-ink/65">No agenda items mirrored.</p>
            ) : (
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
                          {item.structure ? (
                            <>
                              {' '}
                              ·{' '}
                              <Link
                                className="underline"
                                to={`/structures/${item.structure.publicSlug}`}
                              >
                                structure page
                              </Link>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink/75">
                          {item.application.description}
                        </p>
                        <p className="mt-2 text-xs text-ink/50">
                          Your private notes on this case: {item.privateNoteCount} (not shared)
                        </p>
                        {item.similar.length > 0 ? (
                          <ul className="mt-2 text-sm text-ink/65">
                            {item.similar.map((s) => (
                              <li key={s.applicationId}>
                                Similar:{' '}
                                <Link
                                  className="underline"
                                  to={`/official/applications/${s.applicationId}`}
                                >
                                  {s.caseNumber ?? s.applicationId}
                                </Link>{' '}
                                · score {s.score.toFixed(2)} · {s.status}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-ink/50">No similar public cases scored.</p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-ink/55">
                        {item.note ?? 'No public case linked.'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
