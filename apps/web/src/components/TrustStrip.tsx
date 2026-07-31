import { Link } from 'react-router-dom';

/** Consistent trust chrome on every public surface. */
export function TrustStrip() {
  return (
    <div className="border-b border-ink/8 bg-ink/[0.03] text-ink/55">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-[11px] leading-snug md:px-6">
        <p>
          Independent public mirror · Operated by Mitchel Turner Dev, LLC ·{' '}
          <span className="text-ink/70">Not a borough property</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href="https://www.kgbak.us/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-creek underline-offset-2 hover:underline"
          >
            Zoning Administrator
          </a>
          <Link to="/compliance" className="hover:text-ink">
            Compliance
          </Link>
          <Link to="/opendata" className="hover:text-ink">
            Sources
          </Link>
        </p>
      </div>
    </div>
  );
}
