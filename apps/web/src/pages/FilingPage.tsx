import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';

const PROJECT_TYPES = [
  'EXTERIOR_ALTERATION',
  'SIGNAGE',
  'NEW_CONSTRUCTION',
  'PAINT_MATERIALS',
  'AWNING_CANOPY',
  'DEMOLITION',
  'SUBSTRUCTURE_PILING',
  'BOARDWALK_STRUCTURE',
  'OTHER',
] as const;

type FilingPlan = {
  phase: number;
  projectType: string;
  triage: {
    status: string;
    outcome?: string;
    summary?: string;
    current?: { prompt: string };
    disclaimer?: string;
  };
  criteria: Array<{ key: string; ui: string }>;
  structure: {
    publicSlug: string;
    commonName: string | null;
    addressLabel: string;
    ui: string;
  } | null;
  permits: {
    note: string;
    results: Array<{
      id: string;
      permitName: string;
      statutoryCite: string;
      verified: boolean;
      agency: { shortName: string; contactUrl: string };
    }>;
  };
  notice: {
    found: boolean;
    message?: string;
    noticedParcelCount?: number;
    subjectParcel?: { address: string; parcelNumber: string };
  };
  constructionWindow: {
    target: { label: string };
    fileByDate: string;
    fileByNote: string;
    recommendation: string;
    upcomingMeetingsAfterFileBy: Array<{ id: string; scheduledAt: string; agendaUi: string }>;
  };
  steps: Array<{ order: number; key: string; title: string; summary: string; href: string | null }>;
  zoningAdministrator: { label: string; url: string; note: string };
  handoff: { workspaceUi: string; workspaceNote: string };
  disclaimer: string;
  links: { pdf: string; ui: string };
};

function parseAnswers(raw: string | null): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
  } catch {
    return {};
  }
}

export function FilingPage() {
  const [params, setParams] = useSearchParams();
  const [projectType, setProjectType] = useState(params.get('projectType') ?? 'SIGNAGE');
  const [address, setAddress] = useState(params.get('address') ?? '24 Creek Street');
  const [structureSlug, setStructureSlug] = useState(params.get('structureSlug') ?? '20-creek-street');
  const [buildMonth, setBuildMonth] = useState(Number(params.get('buildMonth') ?? 10));
  const [buildYear, setBuildYear] = useState(Number(params.get('buildYear') ?? 2026));
  const [answers] = useState(() => parseAnswers(params.get('answers')));
  const [data, setData] = useState<FilingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('projectType', projectType);
    if (Object.keys(answers).length) qs.set('answers', JSON.stringify(answers));
    if (address.trim()) qs.set('address', address.trim());
    if (structureSlug.trim()) qs.set('structureSlug', structureSlug.trim());
    qs.set('buildMonth', String(buildMonth));
    qs.set('buildYear', String(buildYear));
    return qs.toString();
  }, [projectType, answers, address, structureSlug, buildMonth, buildYear]);

  useEffect(() => {
    setParams(queryString, { replace: true });
  }, [queryString, setParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/filing/plan?${queryString}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<FilingPlan>;
      })
      .then((plan) => {
        if (!cancelled) setData(plan);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setData(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Applicant filing pathway"
        lede="One printable plan from triage through permits, HD notice, and file-by date. Always ends with the Zoning Administrator — never a legal conclusion."
      />
      <DisclaimerBanner compact />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Project type
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="field mt-1"
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Structure slug
          <input
            value={structureSlug}
            onChange={(e) => setStructureSlug(e.target.value)}
            placeholder="20-creek-street"
            className="field mt-1"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Address for notice lookup
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="24 Creek Street"
            className="field mt-1"
          />
        </label>
        <label className="text-sm">
          Build month
          <select
            value={buildMonth}
            onChange={(e) => setBuildMonth(Number(e.target.value))}
            className="field mt-1"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Build year
          <select
            value={buildYear}
            onChange={(e) => setBuildYear(Number(e.target.value))}
            className="field mt-1"
          >
            {[2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {Object.keys(answers).length > 0 && (
        <p className="mt-4 text-xs text-ink/50">
          Carrying {Object.keys(answers).length} triage answer
          {Object.keys(answers).length === 1 ? '' : 's'} from{' '}
          <Link to="/triage" className="underline">
            /triage
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {data && (
          <a href={data.links.pdf} className="btn-primary">
            Download PDF
          </a>
        )}
        <Link to={`/notice/packet?address=${encodeURIComponent(address)}`} className="btn-secondary">
          Notice packet
        </Link>
        <button
          type="button"
          className="btn-ink"
          onClick={() => window.print()}
        >
          Print
        </button>
        <Link to="/workspace" className="font-semibold text-creek underline underline-offset-4">
          Continue in workspace
        </Link>
      </div>

      {loading && <p className="mt-8 text-sm text-ink/50">Building pathway…</p>}
      {error && <p className="mt-8 text-sm text-cedar-deep">{error}</p>}

      {data && !loading && (
        <div className="mt-10 space-y-10 animate-rise">
          <section>
            <p className="text-xs uppercase tracking-[0.16em] text-ink/45">File by</p>
            <p className="mt-2 font-display text-4xl font-semibold text-creek">
              {data.constructionWindow.fileByDate}
            </p>
            <p className="mt-2 text-sm text-ink/70">
              Build target {data.constructionWindow.target.label}. {data.constructionWindow.recommendation}
            </p>
            <p className="mt-2 text-xs text-ink/45">{data.constructionWindow.fileByNote}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Pathway</h2>
            <ol className="mt-4 space-y-5">
              {data.steps.map((step) => (
                <li key={step.key} className="border-l-2 border-ink/10 pl-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink/45">Step {step.order}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">{step.summary}</p>
                  {step.href && (
                    <a
                      href={step.href}
                      className="mt-2 inline-block text-sm font-semibold text-creek underline underline-offset-4"
                      {...(step.href.startsWith('http')
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                    >
                      Open ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {data.criteria.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">Criteria to teach against</h2>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {data.criteria.map((c) => (
                  <li key={c.key}>
                    <Link to={c.ui} className="font-semibold text-creek underline underline-offset-4">
                      {c.key.replace(/_/g, ' ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.structure && (
            <section>
              <h2 className="font-display text-xl font-semibold">Structure dossier</h2>
              <p className="mt-2 text-sm text-ink/70">
                {data.structure.commonName ?? data.structure.addressLabel}
              </p>
              <Link
                to={data.structure.ui}
                className="mt-2 inline-block text-sm font-semibold text-creek underline underline-offset-4"
              >
                Open civic dossier
              </Link>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl font-semibold">Permit triggers</h2>
            <p className="mt-2 text-sm text-ink/65">{data.permits.note}</p>
            {data.permits.results.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">No verified triggers matched these flags.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.permits.results.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium">{p.agency.shortName}</span> — {p.permitName}
                    {!p.verified ? ' (unverified)' : ''} · {p.statutoryCite}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Notice</h2>
            {data.notice.found ? (
              <p className="mt-2 text-sm text-ink/70">
                {data.notice.subjectParcel?.address} · ~{data.notice.noticedParcelCount} parcels in
                the city notice radius.
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink/70">{data.notice.message}</p>
            )}
          </section>

          {data.constructionWindow.upcomingMeetingsAfterFileBy.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">Meetings after file-by</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.constructionWindow.upcomingMeetingsAfterFileBy.map((m) => (
                  <li key={m.id}>
                    <Link to={m.agendaUi} className="font-semibold text-creek underline underline-offset-4">
                      {new Date(m.scheduledAt).toLocaleDateString('en-US', {
                        timeZone: 'America/Juneau',
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="rounded-md border border-brass/35 bg-board/25 px-4 py-4 text-sm">
            <p className="font-medium">{data.zoningAdministrator.label}</p>
            <p className="mt-1 text-ink/65">{data.zoningAdministrator.note}</p>
            <a
              href={data.zoningAdministrator.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-semibold text-creek underline underline-offset-4"
            >
              Contact / borough site ↗
            </a>
          </div>

          <div className="border-t border-ink/10 pt-6">
            <h2 className="font-display text-xl font-semibold">Private handoff</h2>
            <p className="mt-2 text-sm text-ink/70">{data.handoff.workspaceNote}</p>
            <Link
              to={data.handoff.workspaceUi}
              className="mt-3 inline-block text-sm font-semibold text-creek underline underline-offset-4"
            >
              Open workspace
            </Link>
          </div>

          <p className="text-xs text-ink/45">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
