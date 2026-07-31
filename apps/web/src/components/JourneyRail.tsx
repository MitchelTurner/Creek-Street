import { Link, useLocation } from 'react-router-dom';

const STEPS = [
  { to: '/triage', label: 'Triage', key: 'triage' },
  { to: '/filing', label: 'Filing plan', key: 'filing' },
  { to: '/permits', label: 'Permits', key: 'permits' },
  { to: '/notice', label: 'Notice', key: 'notice' },
  { to: '/construction', label: 'File-by', key: 'construction' },
  { to: '/workspace', label: 'Workspace', key: 'workspace' },
] as const;

function stepIndex(pathname: string): number {
  if (pathname.startsWith('/triage')) return 0;
  if (pathname.startsWith('/filing')) return 1;
  if (pathname.startsWith('/permits')) return 2;
  if (pathname.startsWith('/notice')) return 3;
  if (pathname.startsWith('/construction')) return 4;
  if (pathname.startsWith('/workspace')) return 5;
  return -1;
}

/** Sticky applicant pathway progress across triage → workspace. */
export function JourneyRail() {
  const { pathname } = useLocation();
  const current = stepIndex(pathname);
  if (current < 0) return null;

  return (
    <nav
      aria-label="Applicant filing pathway"
      className="sticky top-[3.75rem] z-30 border-b border-ink/8 bg-spray/90 backdrop-blur-md"
    >
      <ol className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 md:px-6">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.key} className="flex shrink-0 items-center gap-1">
              {i > 0 && <span className="mx-1 h-px w-4 bg-ink/15" aria-hidden />}
              <Link
                to={step.to}
                aria-current={active ? 'step' : undefined}
                className={[
                  'rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors',
                  active
                    ? 'bg-creek text-foam'
                    : done
                      ? 'bg-creek/10 text-creek'
                      : 'text-ink/45 hover:bg-mist/50 hover:text-ink',
                ].join(' ')}
              >
                <span className="mr-1.5 opacity-60">{i + 1}</span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
