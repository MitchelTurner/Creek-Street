import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 md:px-6">
      <p className="font-display text-4xl font-semibold text-ink">Page not found</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">
        That path is not part of the Creek Street public mirror. Try search, or return home.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link to="/search" className="rounded-md bg-creek px-4 py-2 font-semibold text-foam">
          Search
        </Link>
        <Link to="/" className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink">
          Home
        </Link>
      </div>
    </div>
  );
}
