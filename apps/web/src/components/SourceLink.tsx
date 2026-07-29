export function SourceLink({ href, label = 'Primary source' }: { href?: string | null; label?: string }) {
  if (!href) {
    return <span className="text-xs text-ink/40">Source pending borough packet ingest</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-creek underline decoration-creek/30 underline-offset-4 hover:decoration-creek"
    >
      {label}
      <span aria-hidden>↗</span>
    </a>
  );
}
