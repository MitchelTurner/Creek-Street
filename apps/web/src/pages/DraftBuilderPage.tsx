import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../lib/auth';

type Draft = {
  id: string;
  projectType: string;
  description: string;
  applicantName: string;
  parcelId: string | null;
  structureId: string | null;
  triageOutcome: string | null;
  triageAnswers: Record<string, string>;
  criteria: string[];
  exhibitsRequired: string[];
  agencyTriggerIds: string[];
  linkedCaseNumber: string | null;
  documents: { id: string; kind: string; fileName: string }[];
  completeness: { complete: boolean; missingKinds: string[]; requiredKinds: string[] };
};

export function DraftBuilderPage() {
  const { id } = useParams();
  const { user, ready, authHeaders } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [docketMatch, setDocketMatch] = useState<{ caseNumber: string | null; status: string } | null>(null);
  const [kind, setKind] = useState('NARRATIVE');
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    if (!id) return;
    const res = await fetch(`/api/applicant/drafts/${id}`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setDraft(data.draft);
    setDocketMatch(data.docketMatch);
  }

  useEffect(() => {
    if (user && id) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!draft) return <div className="p-10 text-sm text-ink/50">Loading draft…</div>;

  async function save(patch: Partial<Draft>) {
    const res = await fetch(`/api/applicant/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setDraft(data.draft);
    setMessage('Saved');
  }

  async function runTriage() {
    const current = draft;
    if (!current) return;
    const evalRes = await fetch('/api/triage/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: current.projectType,
        answers: {
          // Sensible defaults for builder convenience — user can refine on /triage
          ...(current.projectType === 'SIGNAGE'
            ? { sign_start: 'yes', sign_new: 'change' }
            : current.projectType === 'NEW_CONSTRUCTION'
              ? { new_start: 'yes' }
              : { ext_start: 'yes', ext_visible: 'yes' }),
          ...current.triageAnswers,
        },
      }),
    });
    const result = await evalRes.json();
    if (result.status !== 'complete') {
      setMessage('Triage incomplete — finish the public wizard, then paste outcome here.');
      return;
    }
    const permits = await fetch(
      '/api/permits/triggers?inHdZone=true&exteriorChange=true&overWater=true',
    ).then((r) => r.json());
    await save({
      triageOutcome: result.outcome,
      criteria: result.criteria,
      exhibitsRequired: [
        'SITE_PLAN',
        'ELEVATION',
        'PHOTO',
        'NARRATIVE',
        'MATERIALS',
        ...((result.exhibits ?? []).includes('Structural/substructure drawings')
          ? ['STRUCTURAL']
          : []),
      ],
      agencyTriggerIds: (permits.results ?? []).map((r: { id: string }) => r.id),
    });
    setMessage(`Triage: ${result.outcome}`);
  }

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    if (!fileInput.files?.[0]) return;
    const body = new FormData();
    body.append('kind', kind);
    body.append('file', fileInput.files[0]);
    const res = await fetch(`/api/applicant/drafts/${id}/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    const data = await res.json();
    setDraft(data.draft);
    setMessage(`Uploaded ${fileInput.files[0].name}`);
    form.reset();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">Pre-application builder</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        {draft.projectType.replace(/_/g, ' ')}
      </h1>
      <div className="mt-4">
        <DisclaimerBanner />
      </div>

      <section className="mt-8 space-y-3">
        <label className="block text-sm">
          <span className="font-medium">Applicant name</span>
          <input
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            value={draft.applicantName}
            onChange={(e) => setDraft({ ...draft, applicantName: e.target.value })}
            onBlur={() => save({ applicantName: draft.applicantName })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Description</span>
          <textarea
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            onBlur={() => save({ description: draft.description })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Linked borough case number (once filed)</span>
          <input
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            placeholder="HDR-…"
            value={draft.linkedCaseNumber ?? ''}
            onChange={(e) => setDraft({ ...draft, linkedCaseNumber: e.target.value || null })}
            onBlur={() => save({ linkedCaseNumber: draft.linkedCaseNumber })}
          />
        </label>
        {docketMatch && (
          <p className="text-sm text-creek">
            Docket match: {docketMatch.caseNumber} · {docketMatch.status}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">1. Triage → criteria → agencies</h2>
        <p className="mt-2 text-sm text-ink/65">
          Outcome: <strong>{draft.triageOutcome ?? 'not run'}</strong>
        </p>
        {draft.criteria.length > 0 && (
          <p className="mt-1 text-sm text-ink/65">
            Criteria: {draft.criteria.join(', ').replace(/_/g, ' ')}
          </p>
        )}
        {draft.agencyTriggerIds.length > 0 && (
          <p className="mt-1 text-sm text-ink/65">
            Matched verified agency triggers: {draft.agencyTriggerIds.length}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runTriage}
            className="rounded-md bg-creek px-3 py-2 text-sm font-semibold text-foam"
          >
            Apply triage defaults
          </button>
          <Link to="/triage" className="text-sm underline text-ink/60 self-center">
            Open full triage wizard
          </Link>
          <Link to="/permits" className="text-sm underline text-ink/60 self-center">
            Permit map
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">2. Exhibit checklist</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {draft.completeness.requiredKinds.map((k) => {
            const uploaded = draft.documents.find((d) => d.kind === k);
            return (
              <li key={k} className={uploaded ? 'text-creek' : 'text-ink/55'}>
                {uploaded ? '✓' : '○'} {k}
                {uploaded ? ` — ${uploaded.fileName}` : ' — missing'}
              </li>
            );
          })}
        </ul>
        <form onSubmit={upload} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Kind
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="mt-1 block rounded-md border border-ink/15 px-3 py-2"
            >
              {draft.completeness.requiredKinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            File
            <input name="file" type="file" required className="mt-1 block text-sm" />
          </label>
          <button type="submit" className="rounded-md border border-ink/20 px-3 py-2 text-sm font-medium">
            Upload
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">3. Submittal PDF</h2>
        <p className="mt-2 text-sm text-ink/65">
          {draft.completeness.complete
            ? 'Checklist complete — generate a preparation package.'
            : `Still missing: ${draft.completeness.missingKinds.join(', ') || 'description'}`}
        </p>
        <a
          href={`/api/applicant/drafts/${draft.id}/package.pdf`}
          onClick={(e) => {
            e.preventDefault();
            fetch(`/api/applicant/drafts/${draft.id}/package.pdf`, { headers: authHeaders() })
              .then((r) => r.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `creek-street-preapp-${draft.id.slice(0, 8)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-foam"
        >
          Download preparation PDF
        </a>
      </section>

      {message && <p className="mt-6 text-sm text-creek">{message}</p>}
      <p className="mt-8">
        <Link to="/workspace" className="text-sm underline text-ink/50">
          ← All drafts
        </Link>
      </p>
    </div>
  );
}
