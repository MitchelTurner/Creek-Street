import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type Draft = {
  id: string;
  projectType: string;
  description: string;
  status: string;
  updatedAt: string;
  completeness: { complete: boolean; missingKinds: string[] };
};

const PROJECT_TYPES = [
  'EXTERIOR_ALTERATION',
  'SIGNAGE',
  'NEW_CONSTRUCTION',
  'PAINT_MATERIALS',
  'AWNING_CANOPY',
  'DEMOLITION',
  'BOARDWALK_STRUCTURE',
  'SUBSTRUCTURE_PILING',
  'OTHER',
];

export function WorkspacePage() {
  const { user, ready, authHeaders, logout } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [projectType, setProjectType] = useState('SIGNAGE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/applicant/drafts', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setDrafts(d.drafts ?? []))
      .catch(() => setDrafts([]));
  }, [user, authHeaders]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  async function createDraft(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/applicant/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ projectType, applicantName: user!.email }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = await res.json();
    window.location.href = `/workspace/${data.draft.id}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Applicant workspace"
        lede="Guided pre-application builder: triage outcome → criteria → exhibits → agency triggers → submittal-ready PDF."
      />
      <DisclaimerBanner />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink/60">Signed in as {user.email}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="underline text-ink/50"
            onClick={async () => {
              const res = await fetch('/api/applicant/export', { headers: authHeaders() });
              if (!res.ok) {
                setError(await res.text());
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'creek-street-account-export.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export my data
          </button>
          <button
            type="button"
            className="underline text-cedar-deep/80"
            onClick={async () => {
              if (
                !window.confirm(
                  'Delete your account and private drafts? Demo accounts cannot be deleted. This cannot be undone.',
                )
              ) {
                return;
              }
              const res = await fetch('/api/applicant/account', {
                method: 'DELETE',
                headers: authHeaders(),
              });
              if (!res.ok) {
                setError(await res.text());
                return;
              }
              logout();
              window.location.href = '/';
            }}
          >
            Delete account
          </button>
          <button type="button" onClick={() => logout()} className="underline text-ink/50">
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={createDraft} className="mt-8 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="font-medium text-ink/70">New draft — project type</span>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="field mt-1"
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Start draft
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-cedar-deep">{error}</p>}

      <h2 className="mt-12 font-display text-2xl font-semibold">Your drafts</h2>
      {drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          body="Start a private preparation package, or build a public filing pathway first."
          action={{ to: '/filing', label: 'Filing pathway' }}
        />
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link to={`/workspace/${d.id}`} className="flex justify-between gap-4 py-3 hover:bg-mist/30">
                <div>
                  <p className="font-medium">{d.projectType.replace(/_/g, ' ')}</p>
                  <p className="line-clamp-1 text-sm text-ink/55">{d.description || 'No description yet'}</p>
                </div>
                <div className="text-right text-xs text-ink/45">
                  <p>
                    {d.completeness.complete
                      ? 'Package ready'
                      : `${d.completeness.missingKinds.length} exhibits missing`}
                  </p>
                  <p>{d.status}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/filing" className="btn-secondary">
          Filing pathway
        </Link>
        <Link to="/notice/packet" className="btn-ink">
          Notice packet
        </Link>
        <Link to="/subscriptions" className="self-center text-sm font-semibold text-creek underline underline-offset-4">
          Alerts
        </Link>
      </div>
    </div>
  );
}
