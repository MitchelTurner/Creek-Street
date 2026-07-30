import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type StaffQueue = {
  phase: number;
  at: string;
  counts: {
    pendingPhotos: number;
    pendingSummaries: number;
    failedIngestRuns: number;
    failedSources: number;
    total: number;
  };
  pendingPhotos: Array<{
    id: string;
    structureId: string;
    caption: string;
    credit: string;
    yearApprox: number | null;
    submitterEmail: string;
    createdAt: string;
  }>;
  pendingSummaries: Array<{
    id: string;
    meetingId: string;
    body: string;
    model: string;
    generatedAt: string;
    meeting: { id: string; scheduledAt: string; location: string; status: string } | null;
  }>;
  failedIngestRuns: Array<{
    id: string;
    sourceId: string;
    status: string;
    message: string;
    startedAt: string;
    finishedAt: string | null;
  }>;
  note: string;
};

export function StaffQueuePage() {
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<StaffQueue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isStaff = Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN'));

  const reload = useCallback(() => {
    if (!isStaff) return;
    setError(null);
    fetch('/api/ops/queue', { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<StaffQueue>;
      })
      .then(setData)
      .catch((e: Error) => {
        setError(e.message);
        setData(null);
      });
  }, [isStaff, authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/official" replace />;

  async function moderatePhoto(id: string, status: 'APPROVED' | 'REJECTED') {
    setBusy(`photo:${id}:${status}`);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${id}/moderate`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reviewSummary(id: string, publish: boolean) {
    setBusy(`summary:${id}:${publish ? 'publish' : 'hold'}`);
    setError(null);
    try {
      const res = await fetch(`/api/summaries/${id}/review`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish }),
      });
      if (!res.ok) throw new Error(await res.text());
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Staff work queue"
        lede="Moderate photo submissions, review AI meeting summary drafts, and triage failed ingest runs — without exposing drafts to the public mirror."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => reload()}
          className="rounded-md bg-creek px-4 py-2 font-semibold text-foam"
        >
          Refresh
        </button>
        <Link to="/admin/ops" className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80">
          Ops dashboard
        </Link>
        <Link to="/admin/ingest" className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80">
          Ingest console
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <div className="space-y-10">
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
            Phase {data.phase} · {data.counts.total} open item
            {data.counts.total === 1 ? '' : 's'} · {new Date(data.at).toLocaleString()}
          </p>
          <p className="text-sm text-ink/60">{data.note}</p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">
              Pending photos ({data.counts.pendingPhotos})
            </h2>
            {data.pendingPhotos.length === 0 ? (
              <p className="text-sm text-ink/65">No photos awaiting moderation.</p>
            ) : (
              <ul className="space-y-3">
                {data.pendingPhotos.map((p) => (
                  <li key={p.id} className="border border-ink/10 bg-foam/50 px-4 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">{p.caption || 'Untitled submission'}</p>
                      <time className="text-xs text-ink/45">
                        {new Date(p.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-ink/65">
                      {p.credit} · {p.submitterEmail}
                      {p.yearApprox != null ? ` · c. ${p.yearApprox}` : ''} · structure{' '}
                      {p.structureId}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === `photo:${p.id}:APPROVED`}
                        onClick={() => void moderatePhoto(p.id, 'APPROVED')}
                        className="rounded-md bg-creek px-3 py-1.5 text-sm font-semibold text-foam disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === `photo:${p.id}:REJECTED`}
                        onClick={() => void moderatePhoto(p.id, 'REJECTED')}
                        className="rounded-md border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/80 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">
              Unreviewed summaries ({data.counts.pendingSummaries})
            </h2>
            {data.pendingSummaries.length === 0 ? (
              <p className="text-sm text-ink/65">No AI drafts awaiting human review.</p>
            ) : (
              <ul className="space-y-3">
                {data.pendingSummaries.map((s) => (
                  <li key={s.id} className="border border-ink/10 bg-foam/50 px-4 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">{s.meetingId}</p>
                      <span className="text-xs text-ink/45">{s.model}</span>
                    </div>
                    {s.meeting ? (
                      <p className="mt-1 text-sm text-ink/55">
                        {new Date(s.meeting.scheduledAt).toLocaleString()} · {s.meeting.location}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-ink/75">{s.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === `summary:${s.id}:publish`}
                        onClick={() => void reviewSummary(s.id, true)}
                        className="rounded-md bg-creek px-3 py-1.5 text-sm font-semibold text-foam disabled:opacity-50"
                      >
                        Review & publish
                      </button>
                      <button
                        type="button"
                        disabled={busy === `summary:${s.id}:hold`}
                        onClick={() => void reviewSummary(s.id, false)}
                        className="rounded-md border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/80 disabled:opacity-50"
                      >
                        Review, keep private
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">
              Failed ingest runs ({data.counts.failedIngestRuns})
            </h2>
            {data.failedIngestRuns.length === 0 ? (
              <p className="text-sm text-ink/65">No failed ingest runs in recent history.</p>
            ) : (
              <ul className="divide-y divide-ink/10 border border-ink/10 bg-foam/40">
                {data.failedIngestRuns.map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-ink">{r.sourceId}</span>
                      <time className="text-ink/45">
                        {r.finishedAt
                          ? new Date(r.finishedAt).toLocaleString()
                          : new Date(r.startedAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-ink/65">{r.message}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link className="inline-block text-sm font-semibold text-creek underline" to="/admin/ingest">
              Open ingest console to re-run sources
            </Link>
          </section>
        </div>
      ) : (
        <p className="text-sm text-ink/50">Loading queue…</p>
      )}
    </div>
  );
}
