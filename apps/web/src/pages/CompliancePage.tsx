import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
};

type Readiness = {
  title: string;
  score: { done: number; total: number };
  deliberationUnlocked: boolean;
  message: string;
  items: ChecklistItem[];
  contract: {
    active: boolean;
    custodian: string | null;
    processor: string;
    retentionScheduleUrl: string | null;
    recordsRequestContact: string | null;
    missing: string[];
  };
};

type Retention = {
  title: string;
  operator: string;
  custodian: string | null;
  retentionScheduleUrl: string | null;
  recordsRequestContact: string | null;
  principles: Array<{ id: string; text: string }>;
  scheduleConfigured: boolean;
  contactConfigured: boolean;
};

type AuditEvent = {
  id: string;
  at: string;
  action: string;
  summary: string;
  actor: { email: string | null; role: string | null };
};

export function CompliancePage() {
  const { user, authHeaders } = useAuth();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [retention, setRetention] = useState<Retention | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const isStaff = user && (user.role === 'STAFF' || user.role === 'ADMIN');

  useEffect(() => {
    fetch('/api/compliance/readiness')
      .then((r) => r.json())
      .then(setReady)
      .catch(() => setReady(null));
    fetch('/api/compliance/retention')
      .then((r) => r.json())
      .then(setRetention)
      .catch(() => setRetention(null));
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    fetch('/api/compliance/audit?limit=30', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setAudit(d.events ?? []))
      .catch(() => setAudit([]));
  }, [isStaff, authHeaders]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Compliance & readiness"
        lede="Public Records Act posture, retention hooks, and processor-agreement checklist. Independent operator — not a borough property."
      />

      {ready && (
        <section className="mt-8" aria-labelledby="readiness-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="readiness-heading" className="font-display text-2xl font-semibold">
              {ready.title}
            </h2>
            <p className="text-sm text-ink/55">
              {ready.score.done}/{ready.score.total} complete
              {ready.deliberationUnlocked ? ' · deliberation unlocked' : ' · deliberation dark'}
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{ready.message}</p>
          <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {ready.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3 text-sm">
                <span
                  className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${item.done ? 'bg-creek' : 'bg-ink/20'}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-ink">
                    <span className="sr-only">{item.done ? 'Done: ' : 'Open: '}</span>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-ink/55">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink/55">
            Processor: {ready.contract.processor}
            {ready.contract.custodian ? ` · Custodian: ${ready.contract.custodian}` : ''}
          </p>
        </section>
      )}

      {retention && (
        <section className="mt-14" aria-labelledby="retention-heading">
          <h2 id="retention-heading" className="font-display text-2xl font-semibold">
            {retention.title}
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/70">
            {retention.principles.map((p) => (
              <li key={p.id}>{p.text}</li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 text-sm">
            {retention.retentionScheduleUrl ? (
              <p>
                Retention schedule:{' '}
                <a
                  className="font-semibold text-creek underline underline-offset-4"
                  href={retention.retentionScheduleUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open schedule
                </a>
              </p>
            ) : (
              <p className="text-ink/55">Retention schedule URL not configured yet.</p>
            )}
            {retention.recordsRequestContact ? (
              <p>
                Records requests: <span className="font-medium">{retention.recordsRequestContact}</span>
              </p>
            ) : (
              <p className="text-ink/55">Records request contact not configured yet.</p>
            )}
          </div>
        </section>
      )}

      {isStaff && (
        <section className="mt-14" aria-labelledby="audit-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="audit-heading" className="font-display text-2xl font-semibold">
              Staff audit log
            </h2>
            <a
              className="text-sm font-semibold text-creek underline underline-offset-4"
              href="/api/compliance/audit/export.json"
              onClick={(e) => {
                e.preventDefault();
                fetch('/api/compliance/audit/export.json', { headers: authHeaders() })
                  .then((r) => r.blob())
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'creek-street-audit.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  });
              }}
            >
              Export JSON
            </a>
          </div>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
            {audit.map((ev) => (
              <li key={ev.id} className="py-3">
                <p className="font-medium text-ink">{ev.summary}</p>
                <p className="mt-0.5 text-xs text-ink/45">
                  {ev.action} · {ev.actor.email ?? 'system'} · {new Date(ev.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
          {audit.length === 0 && (
            <p className="mt-4 text-sm text-ink/50">No staff actions recorded yet in this process.</p>
          )}
        </section>
      )}

      <p className="mt-12 text-sm text-ink/55">
        Board members: private note export lives in the{' '}
        <Link to="/official" className="font-semibold text-creek underline underline-offset-4">
          board portal
        </Link>
        . Applicants: export or delete your account from the{' '}
        <Link to="/workspace" className="font-semibold text-creek underline underline-offset-4">
          workspace
        </Link>
        .
      </p>
    </div>
  );
}
