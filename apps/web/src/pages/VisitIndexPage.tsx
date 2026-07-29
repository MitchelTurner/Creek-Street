import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

type TourismIndex = {
  title: string;
  lede: string;
  structures: Array<{
    publicSlug: string;
    commonName: string | null;
    addressLabel: string;
    yearBuilt: number | null;
    teaser: string;
    qrPath: string;
    photo: { photoUrl: string; caption: string } | null;
  }>;
};

export function VisitIndexPage() {
  const [data, setData] = useState<TourismIndex | null>(null);

  useEffect(() => {
    fetch('/api/tourism')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title={data?.title ?? 'Visit Creek Street'}
        lede={
          data?.lede ??
          'Historic boardwalk stories for walkers and cruise visitors — QR-ready structure pages.'
        }
      />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {data?.structures.map((s, i) => (
          <Link
            key={s.publicSlug}
            to={s.qrPath}
            className="group block animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {s.photo && (
              <img
                src={s.photo.photoUrl}
                alt={s.photo.caption}
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:brightness-110"
              />
            )}
            <h2 className="mt-3 font-display text-xl font-semibold group-hover:text-creek transition-colors">
              {s.commonName ?? s.addressLabel}
            </h2>
            <p className="text-sm text-ink/55">
              {s.addressLabel}
              {s.yearBuilt ? ` · ${s.yearBuilt}` : ''}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.teaser}</p>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-sm text-ink/50">
        Looking for design review tools?{' '}
        <Link to="/" className="underline text-creek">
          Creek Street Design Review Hub
        </Link>
      </p>
    </div>
  );
}
