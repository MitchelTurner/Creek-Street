import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { RelatedNext } from '../components/RelatedNext';
import { Skeleton } from '../components/Skeleton';
import { SourceLink } from '../components/SourceLink';

type Side = {
  id: string;
  photoUrl: string;
  side: string;
  caption: string;
  sourceDocUrl: string;
  criterion: string;
  weight: string;
  criterionUi: string;
  decision: { id: string; recommendation: string; ui: string } | null;
  application: { id: string; caseNumber: string | null; ui: string } | null;
};

type ComparePayload = {
  left: Side;
  right: Side;
  analysis: {
    sameCriterion: string | null;
    sameDecision: boolean;
    sideContrast: string;
    weightContrast: string;
    teachingPrompt: string;
  };
  defaults: { left: string; right: string };
};

const PRESETS = [
  ['ex_sign_proposed', 'ex_sign_after', 'Sign proposed → as built'],
  ['ex_awning_proposed', 'ex_awning_after', 'Awning proposed → as built'],
  ['ex_sign_proposed', 'ex_awning_proposed', 'Sign vs awning (as proposed)'],
] as const;

export function PrecedentComparePage() {
  const [params, setParams] = useSearchParams();
  const left = params.get('left') || 'ex_sign_proposed';
  const right = params.get('right') || 'ex_sign_after';
  const [data, setData] = useState<ComparePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/precedents/compare?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<ComparePayload>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setData(null);
          setError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [left, right]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="Compare precedents"
        lede="Put two published exemplars side by side — same criterion teaching loop, different frames."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {PRESETS.map(([l, r, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setParams({ left: l, right: r }, { replace: true })}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              left === l && right === r ? 'bg-ink text-foam' : 'bg-mist/50 text-ink/70 hover:bg-mist'
            }`}
          >
            {label}
          </button>
        ))}
        <Link to="/precedents" className="self-center text-sm font-semibold text-creek underline underline-offset-4">
          Full library
        </Link>
      </div>

      {error && <p className="text-sm text-cedar-deep">{error}</p>}
      {!data && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      )}
      {data && (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            <Exemplar column="Left" row={data.left} />
            <Exemplar column="Right" row={data.right} />
          </div>
          <section className="mt-10 border-t border-ink/10 pt-8">
            <h2 className="font-display text-2xl font-semibold">Teaching read</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">{data.analysis.teachingPrompt}</p>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">Criterion</dt>
                <dd className="mt-1 font-medium">
                  {data.analysis.sameCriterion
                    ? data.analysis.sameCriterion.replace(/_/g, ' ')
                    : 'Different criteria'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">Frames</dt>
                <dd className="mt-1 font-medium">{data.analysis.sideContrast}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink/45">Weight</dt>
                <dd className="mt-1 font-medium">{data.analysis.weightContrast}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
      {!data && !error && null}
      {data === null && error && (
        <EmptyState
          title="Could not compare"
          body="Pick a preset pair from the published exemplar library."
          action={{ to: '/precedents', label: 'Browse precedents' }}
        />
      )}

      <RelatedNext
        links={[
          { to: '/guidance', label: 'Guidance', hint: 'Open the criterion atlas behind these frames.' },
          { to: '/decisions', label: 'Decisions', hint: 'Read the mirrored recommendation language.' },
          { to: '/filing', label: 'Filing pathway', hint: 'Carry lessons into your file-by plan.' },
        ]}
      />
    </div>
  );
}

function Exemplar({ column, row }: { column: string; row: Side }) {
  return (
    <article className="animate-rise">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">{column}</p>
      <img
        src={row.photoUrl}
        alt={row.caption}
        className="mt-3 aspect-[4/3] w-full object-cover"
      />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-creek">
        {row.side.replace(/_/g, ' ')} · {row.weight}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">{row.caption}</p>
      <p className="mt-3 text-sm">
        <Link to={row.criterionUi} className="font-semibold text-creek underline underline-offset-4">
          {row.criterion.replace(/_/g, ' ')}
        </Link>
      </p>
      {row.decision && (
        <p className="mt-2 text-sm text-ink/60">
          <Link to={row.decision.ui} className="underline underline-offset-4 hover:text-creek">
            Decision sheet
          </Link>
          {' — '}
          {row.decision.recommendation}
        </p>
      )}
      {row.application && (
        <p className="mt-1 text-sm">
          <Link to={row.application.ui} className="text-creek underline underline-offset-4">
            Case {row.application.caseNumber ?? row.application.id}
          </Link>
        </p>
      )}
      <p className="mt-3">
        <SourceLink href={row.sourceDocUrl} label="Source" />
      </p>
    </article>
  );
}
