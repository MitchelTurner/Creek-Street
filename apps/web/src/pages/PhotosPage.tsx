import { FormEvent, useEffect, useState } from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

type Structure = { id: string; addressLabel: string; commonName: string | null; publicSlug: string };

export function PhotosPage() {
  const { user, authHeaders } = useAuth();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [structureId, setStructureId] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [credit, setCredit] = useState('');
  const [caption, setCaption] = useState('');
  const [yearApprox, setYearApprox] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/structures')
      .then((r) => r.json())
      .then((rows: Structure[]) => {
        setStructures(rows);
        if (rows[0]) setStructureId(rows[0].id);
      });
  }, []);

  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
    if (!fileInput.files?.[0]) return;
    const body = new FormData();
    body.append('structureId', structureId);
    body.append('email', email);
    body.append('credit', credit || email);
    body.append('caption', caption);
    if (yearApprox) body.append('yearApprox', yearApprox);
    body.append('file', fileInput.files[0]);
    const res = await fetch('/api/photos/submit', {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage('Submit failed');
      return;
    }
    setMessage(`Queued for moderation (${data.photo.id}). Approved photos join the structure time-series.`);
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
      <PageHeader
        title="Historic photo crowdsourcing"
        lede="Locals submit old photos of Creek Street buildings. Moderated queue — nothing publishes until approved."
      />
      <DisclaimerBanner compact />

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          Structure
          <select
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            {structures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.commonName ?? s.addressLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Your email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Credit line
          <input
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            placeholder="Name or collection"
          />
        </label>
        <label className="block text-sm">
          Approx. year
          <input
            value={yearApprox}
            onChange={(e) => setYearApprox(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            placeholder="1950"
          />
        </label>
        <label className="block text-sm">
          Caption
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            rows={3}
          />
        </label>
        <label className="block text-sm">
          Photo
          <input name="file" type="file" accept="image/*" required className="mt-1 block text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-creek px-4 py-2.5 text-sm font-semibold text-foam">
          Submit for moderation
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-creek">{message}</p>}
    </div>
  );
}
