export function PageHeader({
  title,
  lede,
}: {
  title: string;
  lede: string;
}) {
  return (
    <header className="mb-10 max-w-2xl animate-rise">
      <h1 className="font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-ink text-balance">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/65 text-pretty md:text-[1.05rem]">
        {lede}
      </p>
      <div className="accent-line mt-6 h-px w-20" aria-hidden="true" />
    </header>
  );
}
