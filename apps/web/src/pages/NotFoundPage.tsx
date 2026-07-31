import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/40">404</p>
      <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
        Off the boardwalk
      </p>
      <p className="mt-4 text-base leading-relaxed text-ink/60">
        That path is not part of the Creek Street public mirror. Try search, or return home.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/search" className="btn-primary">
          Search
        </Link>
        <Link to="/" className="btn-ink">
          Home
        </Link>
      </div>
    </div>
  );
}
