export function PageHeader({
  title,
  lede,
}: {
  title: string;
  lede: string;
}) {
  return (
    <div className="mb-8 max-w-2xl animate-rise">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl text-balance">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">{lede}</p>
      <div className="accent-line mt-5 h-px w-24 rounded-full" />
    </div>
  );
}
