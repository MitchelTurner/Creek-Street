import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { api, type GuidanceResponse } from '../lib/api';

export function GuidancePage() {
  const [data, setData] = useState<GuidanceResponse | null>(null);

  useEffect(() => {
    api.guidance().then(setData).catch(() => setData(null));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="The rules, made legible"
        lede="KGBC HD zone provisions in plain language with the code cite alongside. Review criteria derive from 18.40.010(13)."
      />

      {data && (
        <p className="mb-10 max-w-2xl rounded-md border border-brass/30 bg-board/30 px-4 py-3 text-sm text-ink/75">
          {data.disclaimer}
        </p>
      )}

      <div className="space-y-10">
        {data?.sections.map((s) => (
          <section key={s.id} className="grid gap-4 border-t border-ink/10 pt-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-ink/75">{s.plainLanguage}</p>
            </div>
            <aside className="rounded-md bg-ink/[0.03] px-4 py-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Code</p>
              <p className="mt-2 font-medium text-creek">{s.codeCite}</p>
              <p className="mt-2 leading-relaxed text-ink/60">{s.codeText}</p>
            </aside>
          </section>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold">Review criteria</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/60">
          Open a teaching page for each criterion — plain language beside the code cite, with
          linked decisions and visual precedents when available.
        </p>
        <div className="mt-8 space-y-8">
          {data?.criteria.map((c) => (
            <div key={c.key} className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold">
                  <Link
                    to={`/guidance/criteria/${c.key}`}
                    className="text-ink underline-offset-4 hover:text-creek hover:underline"
                  >
                    {c.label}
                  </Link>
                </h3>
                <p className="mt-2 leading-relaxed text-ink/75">{c.plainLanguage}</p>
                <p className="mt-3 text-sm">
                  <Link
                    to={`/guidance/criteria/${c.key}`}
                    className="font-semibold text-creek underline underline-offset-4"
                  >
                    Open criterion atlas
                  </Link>
                </p>
              </div>
              <aside className="text-sm text-ink/60">
                <p className="font-medium text-creek">{c.codeCite}</p>
                <p className="mt-2">{c.codeText}</p>
              </aside>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
