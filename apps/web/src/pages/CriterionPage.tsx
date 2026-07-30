import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';
import { formatDate, statusLabel } from '../lib/api';

type Atlas = {
  phase: number;
  criterion: {
    key: string;
    label: string;
    plainLanguage: string;
    codeCite: string;
    codeText: string;
  };
  decisions: Array<{
    id: string;
    recommendation: string;
    conditions: string | null;
    voteFor: number | null;
    voteAgainst: number | null;
    finalOutcome: string | null;
    decidedAt: string | null;
    decisionUi: string;
    application: {
      id: string;
      caseNumber: string | null;
      projectType: string;
      status: string;
      caseBriefUi: string;
    };
    structure: {
      commonName: string | null;
      addressLabel: string;
      publicSlug: string;
    } | null;
  }>;
  precedents: Array<{
    id: string;
    decisionId: string;
    photoUrl: string;
    side: string;
    caption: string;
    sourceDocUrl: string;
    weight: string;
    decisionUi: string;
  }>;
  disclaimer: string;
};

export function CriterionPage() {
  const { key = '' } = useParams();
  const [data, setData] = useState<Atlas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    fetch(`/api/guidance/criteria/${encodeURIComponent(key)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Atlas>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [key]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title={data?.criterion.label ?? 'Review criterion'}
        lede="Plain-language teaching page for one HD review criterion — with linked decisions and visual precedents. Not a legal conclusion."
      />

      <p className="mb-6 text-sm">
        <Link to="/guidance" className="font-semibold text-creek underline">
          ← HD guidance
        </Link>
      </p>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-ink/50">Loading criterion…</p> : null}

      {data ? (
        <div className="space-y-10">
          <p className="border-l-2 border-brass/70 pl-3 text-sm text-ink/70">{data.disclaimer}</p>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-base leading-relaxed text-ink/80">
                {data.criterion.plainLanguage}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href={`/api/guidance/criteria/${encodeURIComponent(key)}/sheet.pdf`}
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  Download teaching PDF
                </a>
                <Link
                  to="/precedents"
                  className="font-semibold text-creek underline underline-offset-4"
                >
                  Precedent library
                </Link>
              </div>
            </div>
            <aside className="text-sm text-ink/60">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Code</p>
              <p className="mt-2 font-medium text-creek">{data.criterion.codeCite}</p>
              <p className="mt-2 leading-relaxed">{data.criterion.codeText}</p>
            </aside>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Linked decisions</h2>
            {data.decisions.length === 0 ? (
              <p className="text-sm text-ink/55">
                No mirrored decisions tagged to this criterion yet. The archive grows as packets
                are mirrored.
              </p>
            ) : (
              <ul className="space-y-5">
                {data.decisions.map((d) => (
                  <li key={d.id} className="border-b border-ink/10 pb-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
                      <Link
                        to={d.application.caseBriefUi}
                        className="font-semibold text-creek underline"
                      >
                        {d.application.caseNumber ?? d.application.id}
                      </Link>{' '}
                      · {formatDate(d.decidedAt)} · {statusLabel(d.application.status)}
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
                      <Link
                        to={d.decisionUi}
                        className="text-ink underline-offset-4 hover:text-creek hover:underline"
                      >
                        {d.recommendation}
                      </Link>
                    </p>
                    {d.finalOutcome ? (
                      <p className="mt-2 text-sm font-medium text-creek">
                        Final action: {d.finalOutcome}
                      </p>
                    ) : null}
                    {d.structure ? (
                      <p className="mt-2 text-sm text-ink/60">
                        <Link
                          className="underline"
                          to={`/structures/${d.structure.publicSlug}`}
                        >
                          {d.structure.commonName ?? d.structure.addressLabel}
                        </Link>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ink">Visual precedents</h2>
            {data.precedents.length === 0 ? (
              <p className="text-sm text-ink/55">No exemplars for this criterion yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {data.precedents.map((p) => (
                  <figure key={p.id}>
                    <img
                      src={p.photoUrl}
                      alt={p.caption}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <figcaption className="mt-3 text-sm leading-relaxed text-ink/70">
                      <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                        {p.side.replace(/_/g, ' ')} · {p.weight.replace(/_/g, ' ')}
                      </span>
                      <p className="mt-2">{p.caption}</p>
                    </figcaption>
                    <p className="mt-2 flex flex-wrap gap-3 text-xs">
                      <Link
                        to={p.decisionUi}
                        className="font-semibold text-creek underline underline-offset-4"
                      >
                        Decision sheet
                      </Link>
                      <SourceLink href={p.sourceDocUrl} />
                    </p>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
