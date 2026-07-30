import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type OpsDashboard = {
  phase: number;
  at: string;
  ready: {
    ready: boolean;
    phase: number;
    checks: Record<string, unknown>;
    noticeMethod: string;
    contractMessage: string;
  };
  geo: {
    noticeMethod: string;
    postgis: boolean;
    pgvector: boolean;
    prismaEnabled: boolean;
  };
  mail: { mode: string; from: string; sent: number; failed: number };
  digest: {
    at: string;
    recipients: number;
    mode: string;
    subject: string;
    preview: string;
  } | null;
  opsBrief: {
    at: string;
    recipients: number;
    mode: string;
    subject: string;
    preview: string;
  } | null;
  aging: {
    thresholds: {
      photoHours: number;
      summaryHours: number;
      ingestHours: number;
      alertCooldownHours: number;
    };
    staleTotal: number;
    stalePhotos: number;
    staleSummaries: number;
    staleIngestRuns: number;
    lastAlert: {
      at: string;
      sent: boolean;
      reason: string;
      recipients: number;
      staleTotal: number;
    } | null;
  };
  scheduler: {
    phase: number;
    enabled: boolean;
    tickHours: number;
    running: boolean;
    nextTickAt: string | null;
    lastTick: {
      at: string;
      triggered: string;
      skipped: boolean;
      skipReason: string | null;
      alert: { sent: boolean; reason: string; recipients: number; staleTotal: number } | null;
    } | null;
  };
  claims: {
    claimHours: number;
    activeCount: number;
    byKind: { photo: number; summary: number; ingest: number };
  };
  ingest: {
    queue: { mode: string; redisConfigured: boolean; queue: string };
    sources: Array<{
      id: string;
      label: string;
      lastStatus: string;
      lastRunAt: string | null;
      lastMessage: string | null;
    }>;
    recentRuns: Array<{
      id: string;
      sourceId: string;
      status: string;
      message: string;
      startedAt: string;
    }>;
  };
  compliance: {
    score: { done: number; total: number };
    deliberationUnlocked: boolean;
    openItems: Array<{ id: string; label: string; detail: string }>;
    contractMessage: string;
  };
  recentAudit: Array<{
    id: string;
    at: string;
    action: string;
    actor: { email: string | null };
    resourceType: string;
    resourceId: string | null;
    summary: string;
  }>;
  links: Record<string, string>;
};

export function OpsDashboardPage() {
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<OpsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [briefBusy, setBriefBusy] = useState(false);
  const [briefPreview, setBriefPreview] = useState<string | null>(null);
  const [briefNote, setBriefNote] = useState<string | null>(null);
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertNote, setAlertNote] = useState<string | null>(null);
  const [schedulerBusy, setSchedulerBusy] = useState(false);
  const [schedulerNote, setSchedulerNote] = useState<string | null>(null);

  const isStaff = Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN'));

  const reload = useCallback(() => {
    if (!isStaff) return;
    setLoading(true);
    setError(null);
    fetch('/api/ops/dashboard', { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<OpsDashboard>;
      })
      .then(setData)
      .catch((e: Error) => {
        setError(e.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [isStaff, authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/official" replace />;

  async function loadBriefPreview() {
    setBriefBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/brief/preview', { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        body: string;
        staffRecipients: string[];
        note: string;
      };
      setBriefPreview(json.body);
      setBriefNote(`${json.note} Recipients: ${json.staffRecipients.join(', ') || '(none)'}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBriefBusy(false);
    }
  }

  async function sendBrief() {
    setBriefBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/brief/send', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { recipients: number; mode: string };
      setBriefNote(`Ops brief sent to ${json.recipients} staff recipient(s) (${json.mode}).`);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBriefBusy(false);
    }
  }

  async function sendStaleAlert(force = false) {
    setAlertBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/alerts/send${force ? '?force=1' : ''}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        sent: boolean;
        reason: string;
        recipients: number;
        staleTotal: number;
      };
      setAlertNote(
        json.sent
          ? `Stale alert sent to ${json.recipients} staff (${json.staleTotal} stale).`
          : `Alert not sent (${json.reason}).`,
      );
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAlertBusy(false);
    }
  }

  async function schedulerAction(path: 'enable' | 'disable' | 'tick') {
    setSchedulerBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/scheduler/${path}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Record<string, unknown>;
      if (path === 'tick') {
        const alert = json.alert as { sent?: boolean; reason?: string; recipients?: number } | null;
        setSchedulerNote(
          alert
            ? `Manual tick: ${alert.sent ? `SENT (${alert.recipients})` : alert.reason}`
            : 'Manual tick complete.',
        );
      } else {
        setSchedulerNote(`Scheduler ${path}d.`);
      }
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSchedulerBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Ops dashboard"
        lede="Staff snapshot of readiness, mail/digest status, ingest queue health, open compliance items, and recent audit activity."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => reload()}
          disabled={loading}
          className="rounded-md bg-creek px-4 py-2 font-semibold text-foam disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          type="button"
          onClick={() => void loadBriefPreview()}
          disabled={briefBusy}
          className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80 disabled:opacity-50"
        >
          {briefBusy ? 'Working…' : 'Preview ops brief'}
        </button>
        <button
          type="button"
          onClick={() => void sendBrief()}
          disabled={briefBusy}
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink disabled:opacity-50"
        >
          Send ops brief
        </button>
        <button
          type="button"
          onClick={() => void sendStaleAlert(false)}
          disabled={alertBusy}
          className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink disabled:opacity-50"
        >
          Send stale alert
        </button>
        <Link to="/admin/queue" className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80">
          Work queue
        </Link>
        <Link to="/admin/ingest" className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80">
          Ingest console
        </Link>
        <Link to="/compliance" className="rounded-md border border-ink/15 px-4 py-2 font-medium text-ink/80">
          Compliance
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {briefNote ? <p className="mb-4 text-sm text-ink/70">{briefNote}</p> : null}
      {alertNote ? <p className="mb-4 text-sm text-ink/70">{alertNote}</p> : null}
      {schedulerNote ? <p className="mb-4 text-sm text-ink/70">{schedulerNote}</p> : null}
      {loading && !data ? <p className="text-sm text-ink/50">Loading dashboard…</p> : null}

      {data ? (
        <div className="space-y-10">
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
            Phase {data.phase} · generated {new Date(data.at).toLocaleString()}
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Queue aging</h2>
            <p className="text-sm text-ink/65">
              Stale totals use env thresholds (defaults 48h photos / 24h summaries / 12h failed
              ingest). Alerts skip when nothing is stale or cooldown is active.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Stale total" value={String(data.aging.staleTotal)} />
              <Stat label="Stale photos" value={String(data.aging.stalePhotos)} />
              <Stat label="Stale summaries" value={String(data.aging.staleSummaries)} />
              <Stat label="Stale ingest" value={String(data.aging.staleIngestRuns)} />
              <Stat label="Claimed" value={String(data.claims.activeCount)} />
            </dl>
            <p className="text-sm text-ink/55">
              Active claims: photos {data.claims.byKind.photo} · summaries{' '}
              {data.claims.byKind.summary} · ingest {data.claims.byKind.ingest} (TTL{' '}
              {data.claims.claimHours}h)
            </p>
            <p className="text-sm text-ink/55">
              Thresholds: {data.aging.thresholds.photoHours}h / {data.aging.thresholds.summaryHours}h
              / {data.aging.thresholds.ingestHours}h · cooldown{' '}
              {data.aging.thresholds.alertCooldownHours}h
            </p>
            {data.aging.lastAlert?.sent ? (
              <p className="text-sm text-ink/70">
                Last alert {new Date(data.aging.lastAlert.at).toLocaleString()} ·{' '}
                {data.aging.lastAlert.recipients} recipient(s) · {data.aging.lastAlert.staleTotal}{' '}
                stale
              </p>
            ) : (
              <p className="text-sm text-ink/70">No stale alert sent yet this process.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Alert scheduler</h2>
            <p className="text-sm text-ink/65">
              Periodic ticks call the same stale-alert path without force — NO_STALE and cooldown
              still apply. Default off (`OPS_ALERT_SCHEDULER_ENABLED`).
            </p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Enabled" value={data.scheduler.enabled ? 'yes' : 'no'} />
              <Stat label="Running" value={data.scheduler.running ? 'yes' : 'no'} />
              <Stat label="Tick hours" value={String(data.scheduler.tickHours)} />
              <Stat
                label="Next tick"
                value={
                  data.scheduler.nextTickAt
                    ? new Date(data.scheduler.nextTickAt).toLocaleString()
                    : '—'
                }
              />
            </dl>
            {data.scheduler.lastTick ? (
              <p className="text-sm text-ink/70">
                Last tick {new Date(data.scheduler.lastTick.at).toLocaleString()} ·{' '}
                {data.scheduler.lastTick.triggered}
                {data.scheduler.lastTick.skipped
                  ? ` · skipped (${data.scheduler.lastTick.skipReason})`
                  : data.scheduler.lastTick.alert
                    ? ` · ${data.scheduler.lastTick.alert.sent ? 'SENT' : data.scheduler.lastTick.alert.reason}`
                    : ''}
              </p>
            ) : (
              <p className="text-sm text-ink/70">No scheduler tick yet this process.</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                type="button"
                disabled={schedulerBusy || data.scheduler.enabled}
                onClick={() => void schedulerAction('enable')}
                className="rounded-md border border-ink/15 px-3 py-1.5 font-semibold text-ink disabled:opacity-50"
              >
                Enable
              </button>
              <button
                type="button"
                disabled={schedulerBusy || !data.scheduler.enabled}
                onClick={() => void schedulerAction('disable')}
                className="rounded-md border border-ink/15 px-3 py-1.5 font-semibold text-ink disabled:opacity-50"
              >
                Disable
              </button>
              <button
                type="button"
                disabled={schedulerBusy}
                onClick={() => void schedulerAction('tick')}
                className="rounded-md bg-creek px-3 py-1.5 font-semibold text-foam disabled:opacity-50"
              >
                Run tick now
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Staff ops brief</h2>
            <p className="text-sm text-ink/65">
              Email STAFF/ADMIN with queue counts and readiness. Never includes AI summary body,
              DRAFT applications, or MemberNotes.
            </p>
            {data.opsBrief ? (
              <p className="text-sm text-ink/70">
                Last sent {new Date(data.opsBrief.at).toLocaleString()} · {data.opsBrief.recipients}{' '}
                recipient(s) ({data.opsBrief.mode})
              </p>
            ) : (
              <p className="text-sm text-ink/70">No ops brief sent yet this process.</p>
            )}
            {briefPreview ? (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-ink/10 bg-foam/60 p-4 text-xs text-ink/80">
                {briefPreview}
              </pre>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Readiness</h2>
            <p className="text-sm text-ink/65">{data.ready.contractMessage}</p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="API ready" value={data.ready.ready ? 'yes' : 'no'} />
              <Stat label="Public store" value={String(data.ready.checks.publicBackend ?? '—')} />
              <Stat label="Prisma" value={data.ready.checks.prisma ? 'on' : 'off'} />
              <Stat label="Redis" value={data.ready.checks.redisConfigured ? 'configured' : 'off'} />
              <Stat label="Mail" value={String(data.ready.checks.mail ?? data.mail.mode)} />
              <Stat label="Notice method" value={data.geo.noticeMethod} />
              <Stat label="PostGIS" value={data.geo.postgis ? 'yes' : 'no'} />
              <Stat label="pgvector" value={data.geo.pgvector ? 'yes' : 'no'} />
            </dl>
          </section>

          <section className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-ink">Mail</h2>
              <p className="text-sm text-ink/70">
                Mode <span className="font-semibold text-ink">{data.mail.mode}</span> · from{' '}
                {data.mail.from}
              </p>
              <p className="text-sm text-ink/70">
                Sent {data.mail.sent} · failed {data.mail.failed}
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-ink">Digest</h2>
              {data.digest ? (
                <>
                  <p className="text-sm text-ink/70">
                    Last sent {new Date(data.digest.at).toLocaleString()} · {data.digest.recipients}{' '}
                    recipient(s) ({data.digest.mode})
                  </p>
                  <p className="text-sm text-ink/55">{data.digest.subject}</p>
                </>
              ) : (
                <p className="text-sm text-ink/70">No digest sent yet this process.</p>
              )}
              <a className="text-sm font-semibold text-creek underline" href="/api/digest/preview">
                Preview digest
              </a>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Ingest</h2>
            <p className="text-sm text-ink/70">
              Queue {data.ingest.queue.queue} · {data.ingest.queue.mode}
              {data.ingest.queue.redisConfigured ? ' (Redis)' : ' (inline)'}
            </p>
            <ul className="divide-y divide-ink/10 border border-ink/10 bg-foam/40">
              {data.ingest.sources.map((s) => (
                <li key={s.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{s.label}</span>
                    <span className="text-ink/50">{s.lastStatus}</span>
                  </div>
                  <p className="text-ink/60">
                    {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'never run'}
                    {s.lastMessage ? ` · ${s.lastMessage}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl text-ink">Compliance open items</h2>
              <p className="text-sm text-ink/55">
                {data.compliance.score.done}/{data.compliance.score.total} ready · deliberation{' '}
                {data.compliance.deliberationUnlocked ? 'unlocked' : 'dark'}
              </p>
            </div>
            {data.compliance.openItems.length === 0 ? (
              <p className="text-sm text-ink/70">No open checklist items.</p>
            ) : (
              <ul className="space-y-2">
                {data.compliance.openItems.map((item) => (
                  <li key={item.id} className="border-l-2 border-brass/70 pl-3 text-sm">
                    <p className="font-medium text-ink">{item.label}</p>
                    <p className="text-ink/60">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Recent audit</h2>
            {data.recentAudit.length === 0 ? (
              <p className="text-sm text-ink/70">No audit entries yet.</p>
            ) : (
              <ul className="divide-y divide-ink/10 border border-ink/10 bg-foam/40">
                {data.recentAudit.map((entry) => (
                  <li key={entry.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-ink">{entry.action}</span>
                      <time className="text-ink/45">{new Date(entry.at).toLocaleString()}</time>
                    </div>
                    <p className="text-ink/65">{entry.summary}</p>
                    <p className="text-ink/45">
                      {entry.actor.email ?? 'system'} · {entry.resourceType}
                      {entry.resourceId ? `/${entry.resourceId}` : ''}
                    </p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/10 bg-foam/50 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 font-display text-xl text-ink">{value}</dd>
    </div>
  );
}
