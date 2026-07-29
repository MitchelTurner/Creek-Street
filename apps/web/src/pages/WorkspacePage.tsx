import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
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
        <button type="button" onClick={() => logout()} className="underline text-ink/50">
          Sign out
        </button>
      </div>

      <form onSubmit={createDraft} className="mt-8 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="font-medium text-ink/70">New draft — project type</span>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="mt-1 block rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm"
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-creek px-4 py-2.5 text-sm font-semibold text-foam">
          Start draft
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-cedar-deep">{error}</p>}

      <h2 className="mt-12 font-display text-2xl font-semibold">Your drafts</h2>
      <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
        {drafts.map((d) => (
          <li key={d.id}>
            <Link to={`/workspace/${d.id}`} className="flex justify-between gap-4 py-3 hover:bg-mist/30">
              <div>
                <p className="font-medium">{d.projectType.replace(/_/g, ' ')}</p>
                <p className="text-sm text-ink/55 line-clamp-1">{d.description || 'No description yet'}</p>
              </div>
              <div className="text-right text-xs text-ink/45">
                <p>{d.completeness.complete ? 'Package ready' : `${d.completeness.missingKinds.length} exhibits missing`}</p>
                <p>{d.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {drafts.length === 0 && <p className="mt-4 text-sm text-ink/50">No drafts yet.</p>}

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link to="/subscriptions" className="font-semibold text-creek underline underline-offset-4">
          Alerts & subscriptions
        </Link>
        <Link to="/notice" className="font-semibold text-creek underline underline-offset-4">
          Notice radius lookup
        </Link>
        <Link to="/timelines" className="font-semibold text-creek underline underline-offset-4">
          Timeline expectations
        </Link>
        <Link to="/photos" className="font-semibold text-creek underline underline-offset-4">
          Historic photo submit
        </Link>
      </div>
    </div>
  );
}
