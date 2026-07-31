import { useEffect, useId, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { RouteSeo } from '../lib/seo';

const primary = [
  { to: '/search', label: 'Search' },
  { to: '/map', label: 'Map' },
  { to: '/structures', label: 'Structures' },
  { to: '/docket', label: 'Docket' },
  { to: '/triage', label: 'Triage' },
  { to: '/filing', label: 'Filing' },
];

const explore = [
  { to: '/visit', label: 'Visit' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/meetings', label: 'Meetings' },
  { to: '/guidance', label: 'Rules' },
  { to: '/precedents', label: 'Precedents' },
  { to: '/photos', label: 'Photos' },
  { to: '/board', label: 'Board' },
];

const tools = [
  { to: '/permits', label: 'Permits' },
  { to: '/notice', label: 'Notice' },
  { to: '/construction', label: 'Build window' },
  { to: '/timelines', label: 'Timelines' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/subscriptions', label: 'Alerts' },
  { to: '/opendata', label: 'Open data' },
  { to: '/compliance', label: 'Compliance' },
];

const staff = [
  { to: '/official', label: 'Board portal' },
  { to: '/admin/ops', label: 'Ops' },
  { to: '/admin/queue', label: 'Queue' },
  { to: '/admin/ingest', label: 'Ingest' },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-creek/10 text-creek' : 'text-ink/65 hover:bg-mist/40 hover:text-ink',
  ].join(' ');
}

function MenuGroup({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: Array<{ to: string; label: string }>;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
        {title}
      </p>
      <div className="mt-1.5 flex flex-col">
        {items.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkClass} onClick={onNavigate}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col">
      <RouteSeo />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        className={[
          'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter]',
          isHome
            ? 'border-b border-transparent bg-ink/25 text-foam backdrop-blur-md'
            : 'border-b border-ink/8 bg-spray/80 backdrop-blur-xl',
        ].join(' ')}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <NavLink
            to="/"
            className="group flex min-w-0 flex-col"
            aria-label="Creek Street Design Review Hub home"
          >
            <span
              className={[
                'font-display text-lg font-semibold tracking-tight transition-colors md:text-xl',
                isHome ? 'text-foam group-hover:text-board' : 'text-ink group-hover:text-creek-bright',
              ].join(' ')}
            >
              Creek Street
            </span>
            <span
              className={[
                'text-[10px] uppercase tracking-[0.18em]',
                isHome ? 'text-foam/65' : 'text-ink/45',
              ].join(' ')}
            >
              Design Review Hub
            </span>
          </NavLink>

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Primary"
          >
            {primary.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [
                    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isHome
                      ? isActive
                        ? 'bg-foam/15 text-foam'
                        : 'text-foam/75 hover:bg-foam/10 hover:text-foam'
                      : isActive
                        ? 'bg-creek/10 text-creek'
                        : 'text-ink/65 hover:bg-mist/40 hover:text-ink',
                  ].join(' ')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors',
              isHome
                ? 'border-foam/30 text-foam hover:bg-foam/10'
                : 'border-ink/12 text-ink hover:bg-mist/40',
            ].join(' ')}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        {open && (
          <div
            id={menuId}
            className="border-t border-ink/8 bg-spray/95 text-ink shadow-[0_24px_60px_rgba(7,19,18,0.12)] backdrop-blur-xl"
          >
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
              <MenuGroup title="Primary" items={primary} onNavigate={() => setOpen(false)} />
              <MenuGroup title="Explore" items={explore} onNavigate={() => setOpen(false)} />
              <MenuGroup title="Tools" items={tools} onNavigate={() => setOpen(false)} />
              <MenuGroup title="Staff" items={staff} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="relative overflow-hidden border-t border-ink/10 bg-tide text-foam">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(600px 240px at 10% 0%, rgba(26,138,132,0.35), transparent 60%), radial-gradient(500px 220px at 90% 100%, rgba(196,161,92,0.18), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.5fr_1fr] md:px-6">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight">Creek Street</p>
            <p className="mt-1 text-sm uppercase tracking-[0.18em] text-foam/55">
              Design Review Hub
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-foam/75">
              Operated by Mitchel Turner Dev, LLC — not a borough property. A public mirror of
              borough records and the NRHP inventory. Confirm every filing with the Zoning
              Administrator.
            </p>
          </div>
          <div className="space-y-3 text-sm text-foam/70">
            <p>Advisory to the Planning Commission and Zoning Administrator.</p>
            <p>Jurisdiction: HD zone · KGBC Title 18</p>
            <p className="pt-1">
              <NavLink
                to="/opendata"
                className="underline decoration-brass/50 underline-offset-4 hover:text-foam"
              >
                Open data
              </NavLink>
              <span className="mx-2 text-foam/35">·</span>
              <NavLink
                to="/compliance"
                className="underline decoration-brass/50 underline-offset-4 hover:text-foam"
              >
                Compliance
              </NavLink>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
