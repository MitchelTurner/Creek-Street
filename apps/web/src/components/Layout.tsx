import { NavLink, Outlet } from 'react-router-dom';
import { RouteSeo } from '../lib/seo';

const links = [
  { to: '/search', label: 'Search' },
  { to: '/visit', label: 'Visit' },
  { to: '/construction', label: 'Build window' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/official', label: 'Board portal' },
  { to: '/admin/ops', label: 'Ops' },
  { to: '/admin/ingest', label: 'Ingest' },
  { to: '/triage', label: 'Triage' },
  { to: '/permits', label: 'Permits' },
  { to: '/precedents', label: 'Precedents' },
  { to: '/notice', label: 'Notice' },
  { to: '/timelines', label: 'Timelines' },
  { to: '/map', label: 'Map' },
  { to: '/structures', label: 'Structures' },
  { to: '/docket', label: 'Docket' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/meetings', label: 'Meetings' },
  { to: '/guidance', label: 'Rules' },
  { to: '/board', label: 'Board' },
  { to: '/photos', label: 'Photos' },
  { to: '/opendata', label: 'Open data' },
  { to: '/compliance', label: 'Compliance' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <RouteSeo />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-ink/10 bg-foam/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink to="/" className="group flex min-w-0 flex-col" aria-label="Creek Street Design Review Hub home">
            <span className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl group-hover:text-creek-bright transition-colors">
              Creek Street
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink/55">
              Design Review Hub
            </span>
          </NavLink>
          <nav
            className="hidden lg:flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-medium text-ink/70"
            aria-label="Primary"
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-sm transition-colors hover:text-creek ${isActive ? 'text-creek' : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <details className="relative lg:hidden">
            <summary
              className="cursor-pointer list-none rounded-md border border-ink/15 px-3 py-1.5 text-sm font-medium"
              aria-label="Open navigation menu"
            >
              Menu
            </summary>
            <nav
              className="absolute right-0 mt-2 w-56 rounded-lg border border-ink/10 bg-foam p-2 shadow-lg"
              aria-label="Mobile"
            >
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-mist/60"
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="border-t border-ink/10 bg-ink text-foam">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:px-6">
          <div>
            <p className="font-display text-2xl">Creek Street Design Review Hub</p>
            <p className="mt-2 max-w-xl text-sm text-foam/75 leading-relaxed">
              Owned and operated by Mitchel Turner Dev, LLC — not a borough property.
              Public mirror of borough records and NRHP inventory. Cite primary documents;
              confirm filings with the Zoning Administrator.
            </p>
          </div>
          <div className="text-sm text-foam/70 space-y-2">
            <p>Advisory body to the Planning Commission and Zoning Administrator.</p>
            <p>Jurisdiction: HD zone under KGBC Title 18.</p>
            <p>
              <a className="underline decoration-brass/60 underline-offset-4 hover:text-foam" href="/opendata">
                Open data & license
              </a>
              {' · '}
              <a className="underline decoration-brass/60 underline-offset-4 hover:text-foam" href="/sitemap.xml">
                Sitemap
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
