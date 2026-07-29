import { useEffect, useState } from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';

type WindowResult = {
  target: { label: string; month: number; year: number };
  inPeakCruiseSeason: boolean;
  recommendation: string;
  shipCallsInMonth: { count: number; estimatedPaxSum: number; source: string };
  timeline: {
    medianDaysUsed: number;
    usingPlanningAssumption: boolean;
    boardBufferDays: number;
    disclaimer: string;
    projectType: string;
  };
  fileByDate: string;
  fileByNote: string;
  upcomingMeetingsAfterFileBy: Array<{ scheduledAt: string; status: string }>;
  buildSeasonDefaults: { preferredBuildMonths: number[]; peakCruiseMonths: number[]; note: string };
};

export function ConstructionPage() {
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [projectType, setProjectType] = useState('EXTERIOR_ALTERATION');
  const [data, setData] = useState<WindowResult | null>(null);

  useEffect(() => {
    fetch(
      `/api/construction/window?month=${month}&year=${year}&projectType=${projectType}`,
    )
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [month, year, projectType]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Construction window calendar"
        lede="Backward-plan from the build season: file by this date to get review in time to build outside peak cruise. Not a promise."
      />
      <DisclaimerBanner compact />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Build month
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Year
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            {[2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Project type
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            {['EXTERIOR_ALTERATION', 'SIGNAGE', 'AWNING_CANOPY', 'NEW_CONSTRUCTION', 'SUBSTRUCTURE_PILING'].map(
              (t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {data && (
        <div className="mt-10 space-y-6">
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              data.inPeakCruiseSeason
                ? 'border-brass/40 bg-board/30'
                : 'border-creek/30 bg-creek/10'
            }`}
          >
            <p className="font-semibold">Target {data.target.label}</p>
            <p className="mt-1">{data.recommendation}</p>
          </div>

          <section>
            <h2 className="font-display text-xl font-semibold">File by</h2>
            <p className="mt-2 font-display text-3xl font-semibold text-creek">{data.fileByDate}</p>
            <p className="mt-2 text-sm text-ink/65">{data.fileByNote}</p>
            <p className="mt-2 text-xs text-ink/45">
              Median days used: {data.timeline.medianDaysUsed}
              {data.timeline.usingPlanningAssumption ? ' (planning assumption — sample size suppressed)' : ''}
              {' · '}board buffer {data.timeline.boardBufferDays} days
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Ship calls in target month</h2>
            <p className="mt-2 text-sm text-ink/70">
              {data.shipCallsInMonth.count} calls · ~{data.shipCallsInMonth.estimatedPaxSum.toLocaleString()} pax
            </p>
            <p className="mt-1 text-xs text-ink/45">{data.shipCallsInMonth.source}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Meetings after file-by</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {data.upcomingMeetingsAfterFileBy.map((m) => (
                <li key={m.scheduledAt}>
                  {new Date(m.scheduledAt).toLocaleDateString('en-US', { timeZone: 'America/Juneau' })} ·{' '}
                  {m.status}
                </li>
              ))}
            </ul>
            {data.upcomingMeetingsAfterFileBy.length === 0 && (
              <p className="mt-2 text-sm text-ink/50">No scheduled meetings in the mirrored calendar after that date.</p>
            )}
          </section>

          <p className="text-xs text-ink/45">{data.buildSeasonDefaults.note}</p>
        </div>
      )}
    </div>
  );
}
