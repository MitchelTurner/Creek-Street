import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { api, formatDate, type Meta, type Seat } from '../lib/api';

export function BoardPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [apply, setApply] = useState<Meta['applyForBoard'] | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    api
      .seats()
      .then((r) => {
        setSeats(r.seats);
        setApply(r.apply);
        setNote(r.note);
      })
      .catch(() => undefined);
  }, []);

  const vacancies = seats.filter((s) => s.isVacant).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Board roster & vacancies"
        lede="Current seats, terms, and open positions. Neutral facts only — no member scorecards."
      />

      <p className="mb-8 text-sm text-ink/65">
        Open seats (including placeholders pending Clerk confirmation):{' '}
        <span className="font-semibold text-ink">{vacancies}</span>
      </p>

      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {seats.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-xl font-semibold">{s.label}</p>
              <p className="text-sm text-ink/55">{s.seatType.replace(/_/g, ' ')}</p>
            </div>
            <div className="md:text-right">
              {s.isVacant ? (
                <p className="text-sm font-semibold text-cedar-deep">Vacant / confirm with Clerk</p>
              ) : (
                <p className="text-sm font-medium">{s.currentTerm?.memberName}</p>
              )}
              {s.currentTerm && (
                <p className="text-xs text-ink/45">
                  Term {formatDate(s.currentTerm.termStart)} – {formatDate(s.currentTerm.termEnd)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {apply && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold">How to apply</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{apply.note}</p>
          <a
            href={apply.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-creek underline underline-offset-4"
          >
            {apply.label} ↗
          </a>
        </section>
      )}

      {note && <p className="mt-8 text-xs text-ink/45">{note}</p>}
    </div>
  );
}
