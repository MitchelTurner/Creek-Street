import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SourceLink } from '../components/SourceLink';

type VisitData = {
  structure: {
    publicSlug: string;
    commonName: string | null;
    addressLabel: string;
    yearBuilt: number | null;
    nrhpContributing: boolean | null;
    historicNarrative: string;
    sourceDocUrl: string;
  };
  photos: Array<{
    id: string;
    photoUrl: string;
    yearApprox: number | null;
    caption: string;
    credit: string;
    isHistoric: boolean;
  }>;
  qr: { path: string; note: string };
  civicLink: string;
};

export function VisitStructurePage() {
  const { slug } = useParams();
  const [data, setData] = useState<VisitData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tourism/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-cedar-deep">{error}</p>
        <Link to="/visit" className="mt-4 inline-block text-sm underline">
          Back to visit guide
        </Link>
      </div>
    );
  }

  if (!data) return <div className="p-16 text-sm text-ink/50">Loading…</div>;

  const s = data.structure;

  return (
    <div>
      <section className="relative min-h-[50vh] overflow-hidden border-b border-ink/10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: data.photos[data.photos.length - 1]
              ? `linear-gradient(180deg, rgba(14,28,28,0.25), rgba(14,28,28,0.72)), url(${data.photos[data.photos.length - 1].photoUrl})`
              : 'linear-gradient(135deg, #145c5a, #5c3a24)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-end px-4 pb-12 pt-24 md:px-6">
          <p className="animate-rise text-xs uppercase tracking-[0.2em] text-foam/70">Creek Street</p>
          <h1 className="animate-rise-delay mt-2 font-display text-4xl font-semibold text-foam md:text-6xl">
            {s.commonName ?? s.addressLabel}
          </h1>
          <p className="animate-rise-delay-2 mt-3 text-foam/80">
            {s.addressLabel}
            {s.yearBuilt ? ` · Built ${s.yearBuilt}` : ''}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <p className="text-lg leading-relaxed text-ink/80">{s.historicNarrative}</p>
        <p className="mt-4">
          <SourceLink href={s.sourceDocUrl} label="NRHP source" />
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Through time</h2>
          <div className="mt-6 space-y-8">
            {data.photos.map((p) => (
              <figure key={p.id} className="animate-rise">
                <img src={p.photoUrl} alt={p.caption} className="w-full object-cover" />
                <figcaption className="mt-3 text-sm text-ink/65">
                  <span className="font-semibold text-ink">
                    {p.yearApprox ?? 'Date unknown'}
                    {p.isHistoric ? ' · historic' : ''}
                  </span>
                  {' — '}
                  {p.caption}
                  <span className="block text-xs text-ink/45 mt-1">Credit: {p.credit}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-ink/45">
          QR path: <code className="rounded bg-mist/60 px-1.5">{data.qr.path}</code> — {data.qr.note}
        </p>
        <p className="mt-4 text-sm">
          <Link to={data.civicLink} className="text-creek underline underline-offset-4">
            Design-review / civic record for this structure
          </Link>
        </p>
        <p className="mt-2 text-sm">
          <Link to="/photos" className="text-ink/50 underline">
            Submit a historic photo
          </Link>
        </p>
      </div>
    </div>
  );
}
