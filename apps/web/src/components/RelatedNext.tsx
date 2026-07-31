import { Link } from 'react-router-dom';

export type RelatedLink = {
  to: string;
  label: string;
  hint?: string;
};

/** Teaching-loop handoffs between criterion ↔ decision ↔ structure ↔ case. */
export function RelatedNext({
  title = 'Continue the teaching loop',
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (!links.length) return null;
  return (
    <section className="mt-12 border-t border-ink/10 pt-8">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="group block border-l-2 border-creek/30 pl-3 transition hover:border-creek"
            >
              <span className="text-sm font-semibold text-creek group-hover:underline underline-offset-4">
                {l.label}
              </span>
              {l.hint && <p className="mt-1 text-xs leading-relaxed text-ink/55">{l.hint}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
