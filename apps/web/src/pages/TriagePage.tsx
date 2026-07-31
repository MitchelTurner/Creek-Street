import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { api, type TriageEval, type TriageFlow } from '../lib/api';

const PROJECT_TYPES = [
  ['EXTERIOR_ALTERATION', 'Exterior alteration'],
  ['SIGNAGE', 'Signage'],
  ['NEW_CONSTRUCTION', 'New construction'],
  ['PAINT_MATERIALS', 'Paint / materials'],
  ['AWNING_CANOPY', 'Awning / canopy'],
  ['DEMOLITION', 'Demolition'],
  ['SUBSTRUCTURE_PILING', 'Substructure / pilings'],
  ['BOARDWALK_STRUCTURE', 'Boardwalk structure'],
  ['OTHER', 'Other'],
] as const;

export function TriagePage() {
  const [projectType, setProjectType] = useState<string>('');
  const [flow, setFlow] = useState<TriageFlow | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TriageEval | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectType) return;
    setAnswers({});
    setResult(null);
    setError(null);
    api
      .triageFlow(projectType)
      .then(setFlow)
      .catch((e: Error) => setError(e.message));
  }, [projectType]);

  useEffect(() => {
    if (!projectType || !flow) return;
    api
      .triageEvaluate(projectType, answers)
      .then(setResult)
      .catch((e: Error) => setError(e.message));
  }, [projectType, flow, answers]);

  const outcomeColor = (outcome: string) => {
    if (outcome === 'REVIEW_REQUIRED') return 'border-creek text-creek';
    if (outcome === 'NOT_REQUIRED') return 'border-ink/30 text-ink/70';
    return 'border-brass text-cedar-deep';
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Do I even need review?"
        lede="Five-to-seven branching questions keyed to project type and boardwalk visibility. Every outcome cites the code and ends with the Zoning Administrator — never a legal conclusion."
      />

      <label className="block text-sm font-medium text-ink/70">Project type</label>
      <select
        value={projectType}
        onChange={(e) => setProjectType(e.target.value)}
        className="field mt-2 max-w-md"
      >
        <option value="">Select a project type…</option>
        {PROJECT_TYPES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="mt-6 text-sm text-cedar-deep">{error}</p>}

      {result?.status === 'in_progress' && (
        <div className="mt-10 animate-rise">
          <p className="text-xs uppercase tracking-[0.16em] text-ink/45">
            Question {(result.path?.length ?? 0) + 1}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-snug">
            {result.current.prompt}
          </h2>
          {result.current.help && (
            <p className="mt-2 text-sm text-ink/60">{result.current.help}</p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            {result.current.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [result.current.id]: opt.id }))}
                className="choice"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {Object.keys(answers).length > 0 && (
            <button
              type="button"
              className="mt-6 text-sm text-ink/50 underline"
              onClick={() => {
                const keys = result.path;
                const last = keys[keys.length - 1];
                if (!last) return;
                setAnswers((a) => {
                  const next = { ...a };
                  delete next[last];
                  return next;
                });
              }}
            >
              Back
            </button>
          )}
          <p className="mt-8 text-xs text-ink/45">{result.disclaimer}</p>
        </div>
      )}

      {result?.status === 'complete' && (
        <div className="mt-10 animate-rise">
          <p className={`inline-block border-l-4 pl-3 font-display text-2xl font-semibold ${outcomeColor(result.outcome)}`}>
            {result.outcome.replace(/_/g, ' ')}
          </p>
          <p className="mt-4 leading-relaxed text-ink/75">{result.summary}</p>

          <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Code cites</h3>
          <ul className="mt-2 space-y-1">
            {result.codeCites.map((c) => (
              <li key={c} className="text-sm font-medium text-creek">
                {c}
              </li>
            ))}
          </ul>

          {result.criteria.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
                Applicable criteria
              </h3>
              <p className="mt-2 text-sm text-ink/70">{result.criteria.join(' · ').replace(/_/g, ' ')}</p>
            </>
          )}

          {result.exhibits.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
                Typical exhibits
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/70">
                {result.exhibits.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8 rounded-md border border-brass/35 bg-board/25 px-4 py-4 text-sm">
            <p className="font-medium">{result.zoningAdministrator.label}</p>
            <p className="mt-1 text-ink/65">{result.note}</p>
            <a
              href={result.zoningAdministrator.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-semibold text-creek underline underline-offset-4"
            >
              Contact / borough site ↗
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/filing?projectType=${encodeURIComponent(projectType)}&answers=${encodeURIComponent(JSON.stringify(answers))}`}
              className="btn-primary"
            >
              Build filing pathway
            </Link>
            <Link to="/permits" className="btn-secondary">
              Check multi-agency permits
            </Link>
            <button
              type="button"
              className="text-ink/50 underline"
              onClick={() => {
                setAnswers({});
              }}
            >
              Start over
            </button>
          </div>
          <p className="mt-6 text-xs text-ink/45">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
