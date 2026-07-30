import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type IngestStatus = {
  queue: { mode: string; redisConfigured: boolean; queue: string };
  sources: Array<{
    id: string;
    label: string;
    watermark: {
      lastRunAt: string | null;
      lastStatus: string;
      lastMessage: string | null;
      lastFingerprint: string | null;
      notes: string;
    };
  }>;
  recentRuns: Array<{
    id: string;
    sourceId: string;
    status: string;
    message: string;
    startedAt: string;
    diff: { added: number; updated: number; removed: number; unchanged: number };
    fanout: string[];
  }>;
  policy: { robots: string; askFirst: string; fanout: string };
};

export function IngestAdminPage() {
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<IngestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isStaff = user && (user.role === 'STAFF' || user.role === 'ADMIN');

  const reload = useCallback(() => {
    if (!isStaff) return;
    fetch('/api/ingest/status', { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [isStaff, authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/official" replace />;

  async function run(sourceId: string) {
    setBusy(sourceId);
    setError(null);
    try {
      const res = await fetch(`/api/ingest/run/${sourceId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runAll() {
    setBusy('all');
    try {
      await fetch('/api/ingest/run-all', { method: 'POST', headers: authHeaders() });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendDigest() {
    setBusy('digest');
    setError(null);
    try {
      const res = await fetch('/api/digest/send', { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setError(null);
      window.alert(`Digest sent to ${result.recipients} recipient(s) (${result.mode}).`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendOutcomesDigest() {
    setBusy('outcomes');
    setError(null);
    try {
      const res = await fetch('/api/digest/outcomes/mtg_2023_04/send', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      window.alert(
        `Outcomes digest sent to ${result.recipients} recipient(s) (${result.mode}).`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendCaseDigest() {
    setBusy('case');
    setError(null);
    try {
      const res = await fetch('/api/digest/case/app_sample_sign/send', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      window.alert(`Case digest sent to ${result.recipients} recipient(s) (${result.mode}).`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Ingest & workers"
        lede="Watermarked source sync with robots.txt respect. Docket diffs fan out to subscriptions. Redis/BullMQ when REDIS_URL is set; otherwise inline."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          disabled={busy === 'digest'}
          onClick={() => void sendDigest()}
          className="rounded-md bg-creek px-4 py-2 font-semibold text-foam disabled:opacity-50"
        >
          {busy === 'digest' ? 'Sending digest…' : 'Send weekly digest'}
        </button>
        <a
          href="/api/digest/preview"
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
          target="_blank"
          rel="noreferrer"
        >
          Preview digest
        </a>
        <button
          type="button"
          disabled={busy === 'outcomes'}
          onClick={() => void sendOutcomesDigest()}
          className="rounded-md bg-creek px-4 py-2 font-semibold text-foam disabled:opacity-50"
        >
          {busy === 'outcomes' ? 'Sending outcomes…' : 'Send outcomes digest (demo)'}
        </button>
        <a
          href="/api/digest/outcomes/mtg_2023_04/preview"
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
          target="_blank"
          rel="noreferrer"
        >
          Preview outcomes digest
        </a>
        <button
          type="button"
          disabled={busy === 'case'}
          onClick={() => void sendCaseDigest()}
          className="rounded-md bg-creek px-4 py-2 font-semibold text-foam disabled:opacity-50"
        >
          {busy === 'case' ? 'Sending case…' : 'Send case digest (demo)'}
        </button>
        <a
          href="/api/digest/case/app_sample_sign/preview"
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
          target="_blank"
          rel="noreferrer"
        >
          Preview case digest
        </a>
        <a
          href="/api/meetings.ics"
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
        >
          meetings.ics
        </a>
      </div>

      {data && (
        <div className="mb-8 rounded-md border border-ink/10 bg-foam/70 px-4 py-3 text-sm">
          <p>
            Queue mode: <strong>{data.queue.mode}</strong>
            {data.queue.redisConfigured ? ' · Redis configured' : ' · REDIS_URL unset'}
          </p>
          <p className="mt-2 text-ink/65">{data.policy.robots}</p>
          <p className="mt-1 text-ink/65">{data.policy.askFirst}</p>
        </div>
      )}

      <div className="mb-6">
        <button
          type="button"
          onClick={runAll}
          disabled={busy !== null}
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-foam disabled:opacity-50"
        >
          {busy === 'all' ? 'Running…' : 'Run all sources'}
        </button>
      </div>

      <ul className="space-y-6">
        {data?.sources.map((s) => (
          <li key={s.id} className="border-t border-ink/10 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">{s.label}</h2>
                <p className="mt-1 text-xs font-mono text-ink/45">{s.id}</p>
                <p className="mt-2 text-sm text-ink/65">{s.watermark.notes}</p>
                <p className="mt-2 text-sm">
                  Status:{' '}
                  <span className="font-medium">{s.watermark.lastStatus}</span>
                  {s.watermark.lastRunAt
                    ? ` · ${new Date(s.watermark.lastRunAt).toLocaleString()}`
                    : ' · never'}
                </p>
                <p className="mt-1 text-sm text-ink/70">{s.watermark.lastMessage}</p>
                {s.watermark.lastFingerprint && (
                  <p className="mt-1 text-xs text-ink/40">fp {s.watermark.lastFingerprint}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => run(s.id)}
                disabled={busy !== null}
                className="rounded-md border border-ink/20 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy === s.id ? 'Running…' : 'Run'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Recent runs</h2>
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
          {data?.recentRuns.map((r) => (
            <li key={r.id} className="py-3">
              <p className="font-medium">
                {r.sourceId} · {r.status}
              </p>
              <p className="text-ink/65">{r.message}</p>
              <p className="mt-1 text-xs text-ink/40">
                +{r.diff.added} ~{r.diff.updated} ={r.diff.unchanged}
                {r.fanout.length ? ` · fanout: ${r.fanout.join(', ')}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="mt-6 text-sm text-cedar-deep break-all">{error}</p>}
      <p className="mt-8 text-xs text-ink/45">Staff demo: staff@example.com / creek-demo</p>
    </div>
  );
}
