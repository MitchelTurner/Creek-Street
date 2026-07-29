import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';

export function OpenDataPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.openData().then(setData).catch(() => setData(null));
  }, []);

  const endpoints = (data?.endpoints ?? {}) as Record<string, string>;
  const license = data?.license as { name?: string; spdx?: string; summary?: string; attribution?: string } | undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Open data"
        lede="Documented read-only JSON and CSV exports of every public dataset. Public infrastructure framing — not one guy’s website."
      />

      {license && (
        <section className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold">{license.name}</h2>
          <p className="mt-1 text-sm font-medium text-creek">License: {license.spdx}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{license.summary}</p>
          <p className="mt-2 text-xs text-ink/50">{license.attribution}</p>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold">Endpoints</h2>
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {Object.entries(endpoints).map(([key, path]) => (
            <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="font-medium capitalize">{key}</span>
              <a href={path} className="font-mono text-xs text-creek underline underline-offset-4">
                {path}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
