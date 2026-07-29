import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';

type BoardApp = {
  application: {
    id: string;
    caseNumber: string | null;
    description: string;
    projectType: string;
    status: string;
    structure: { addressLabel: string; commonName: string | null } | null;
    decisions: Array<{ recommendation: string; finalOutcome: string | null }>;
  };
  similar: Array<{ score: number; application: { id: string; caseNumber: string | null; description: string } }>;
  contract: { active: boolean; message: string };
  privateNotesOnly: string;
};

type Note = { id: string; body: string; updatedAt: string };

export function OfficialApplicationPage() {
  const { id } = useParams();
  const { user, ready, authHeaders } = useAuth();
  const [data, setData] = useState<BoardApp | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [delibMsg, setDelibMsg] = useState<string | null>(null);

  const isBoard =
    user && (user.role === 'BOARD_MEMBER' || user.role === 'STAFF' || user.role === 'ADMIN');

  useEffect(() => {
    if (!isBoard || !id) return;
    fetch(`/api/board/applications/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData);
    fetch(`/api/board/notes?applicationId=${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []));
  }, [isBoard, id, authHeaders]);

  if (!ready) return <div className="p-10 text-sm text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/official" replace />;
  if (!isBoard) return <Navigate to="/workspace" replace />;
  if (!data) return <div className="p-10 text-sm text-ink/50">Loading application…</div>;

  const app = data.application;

  async function saveNote(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ applicationId: id, body: noteBody }),
    });
    const row = await res.json();
    if (res.ok) {
      setNotes((n) => [row.note, ...n]);
      setNoteBody('');
    }
  }

  async function tryCirculate() {
    const res = await fetch(`/api/board/applications/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ body: 'This should be blocked without a contract.' }),
    });
    const body = await res.json();
    if (!res.ok) {
      const msg = body?.message;
      setDelibMsg(
        typeof msg === 'string'
          ? msg
          : msg?.message ?? body?.error ?? 'Blocked — contract required',
      );
      return;
    }
    setDelibMsg('Comment accepted (contract active)');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link to="/official" className="text-sm text-ink/50 underline">
        ← Board portal
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {app.caseNumber ?? app.id}
      </h1>
      <p className="mt-1 text-ink/60">
        {app.projectType.replace(/_/g, ' ')} · {app.status} ·{' '}
        {app.structure?.commonName ?? app.structure?.addressLabel}
      </p>
      <p className="mt-4 leading-relaxed text-ink/75">{app.description}</p>

      {app.decisions[0] && (
        <p className="mt-4 text-sm text-creek">{app.decisions[0].recommendation}</p>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Similar precedents</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.similar.map((s) => (
            <li key={s.application.id}>
              <span className="text-ink/45">{s.score}</span> — {s.application.caseNumber}:{' '}
              {s.application.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Private scratch notes</h2>
        <p className="mt-2 text-sm text-ink/60">{data.privateNotesOnly}</p>
        <form onSubmit={saveNote} className="mt-4 space-y-3">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            placeholder="Visible only to you…"
            required
          />
          <button type="submit" className="rounded-md bg-creek px-3 py-2 text-sm font-semibold text-foam">
            Save private note
          </button>
        </form>
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="border-t border-ink/10 pt-3 text-sm text-ink/70">
              {n.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-md border border-brass/35 bg-board/25 px-4 py-4">
        <h2 className="font-display text-xl font-semibold">Circulated deliberation</h2>
        <p className="mt-2 text-sm text-ink/70">{data.contract.message}</p>
        <button
          type="button"
          onClick={tryCirculate}
          className="mt-3 rounded-md border border-ink/20 px-3 py-2 text-sm font-medium"
        >
          Attempt circulated comment (proves gate)
        </button>
        {delibMsg && <p className="mt-3 text-sm text-cedar-deep break-words">{String(delibMsg)}</p>}
      </section>
    </div>
  );
}
