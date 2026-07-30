import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type ContractStatus = {
  active: boolean;
  missing: string[];
  message: string;
  custodian: string | null;
  processor: string;
};

type Dashboard = {
  contract: ContractStatus;
  constraints: Record<string, string>;
  deliberationEnabled: boolean;
  docket: Array<{
    id: string;
    caseNumber: string | null;
    projectType: string;
    description: string;
    status: string;
    structure: { addressLabel: string; commonName: string | null } | null;
  }>;
  upcomingMeetings: Array<{ id: string; scheduledAt: string; status: string }>;
};

export function OfficialPortalPage() {
  const { user, ready, authHeaders, login, logout } = useAuth();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('board@example.com');
  const [password, setPassword] = useState('creek-demo');

  const isBoard =
    user && (user.role === 'BOARD_MEMBER' || user.role === 'STAFF' || user.role === 'ADMIN');

  useEffect(() => {
    if (!isBoard) return;
    fetch('/api/board/dashboard', { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setDash)
      .catch((e: Error) => setError(e.message));
  }, [isBoard, authHeaders]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <PageHeader
          title="Official / board portal"
          lede="Read-only docket and private scratch notes. Deliberation stays dark until a borough processor agreement is active."
        />
        <form
          className="mt-8 space-y-3"
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            try {
              await login(email, password);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input
            className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-foam">
            Sign in
          </button>
        </form>
        <p className="mt-4 text-xs text-ink/45">Demo board: board@example.com / creek-demo</p>
        {error && <p className="mt-3 text-sm text-cedar-deep">{error}</p>}
      </div>
    );
  }

  if (!isBoard) {
    return <Navigate to="/workspace" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Board portal"
        lede="Docket, packets, precedent context, and private notes. No member-to-member deliberation outside a noticed meeting."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink/60">
          {user.email} · {user.role.replace(/_/g, ' ')}
        </p>
        <button type="button" className="underline text-ink/50" onClick={() => logout()}>
          Sign out
        </button>
      </div>

      {dash && (
        <div
          className={`mb-8 rounded-md border px-4 py-3 text-sm ${
            dash.contract.active
              ? 'border-creek/40 bg-creek/10 text-creek'
              : 'border-brass/40 bg-board/30 text-ink/75'
          }`}
        >
          <p className="font-semibold">
            Official workflow: {dash.contract.active ? 'ENABLED' : 'CONTRACT-GATED (dark)'}
          </p>
          <p className="mt-1">{dash.contract.message}</p>
          {!dash.contract.active && dash.contract.missing.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {dash.contract.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {dash && (
        <section className="mb-10 grid gap-4 md:grid-cols-3 text-sm">
          {Object.entries(dash.constraints).map(([k, v]) => (
            <div key={k} className="border-t border-ink/15 pt-3">
              <p className="text-xs uppercase tracking-[0.14em] text-ink/45">{k}</p>
              <p className="mt-2 text-ink/70 leading-relaxed">{v}</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold">Live docket</h2>
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {dash?.docket.map((a) => (
            <li key={a.id}>
              <Link
                to={`/official/applications/${a.id}`}
                className="flex flex-col gap-1 py-3 hover:bg-mist/30 md:flex-row md:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {a.caseNumber ?? a.id} · {a.projectType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-ink/65">{a.description}</p>
                </div>
                <p className="text-xs text-ink/45">
                  {a.structure?.commonName ?? a.structure?.addressLabel ?? '—'} · {a.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        {dash?.docket.length === 0 && (
          <p className="mt-3 text-sm text-ink/50">No active docket items.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Upcoming meetings</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {dash?.upcomingMeetings.map((m) => (
            <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-3">
              <span>
                {new Date(m.scheduledAt).toLocaleString('en-US', { timeZone: 'America/Juneau' })} ·{' '}
                {m.status}
              </span>
              <button
                type="button"
                className="font-semibold text-creek underline underline-offset-4"
                onClick={() => {
                  fetch(`/api/board/meetings/${m.id}/packet.pdf`, { headers: authHeaders() })
                    .then(async (r) => {
                      if (!r.ok) throw new Error(await r.text());
                      return r.blob();
                    })
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `creek-street-board-packet-${m.id}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    })
                    .catch((err: Error) => setError(err.message));
                }}
              >
                Packet PDF
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink/45">
          Packets are mirrored public facts only — private MemberNotes are never attached.
        </p>
      </section>

      <p className="mt-10">
        <a
          href="/api/board/notes/export.json"
          className="text-sm font-semibold text-creek underline"
          onClick={(e) => {
            e.preventDefault();
            fetch('/api/board/notes/export.json', { headers: authHeaders() })
              .then((r) => r.json())
              .then((data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'private-member-notes.json';
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
        >
          Export my private notes only
        </a>
      </p>
      {error && <p className="mt-4 text-sm text-cedar-deep">{error}</p>}
    </div>
  );
}
