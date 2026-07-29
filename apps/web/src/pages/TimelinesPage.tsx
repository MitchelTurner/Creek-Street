import { useEffect, useState } from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';

type TimelineResponse = {
  minSampleSize: number;
  disclaimer: string;
  buckets: Array<{
    projectType: string;
    n: number;
    suppressed: boolean;
    reason?: string;
    medianDays?: number;
    p25Days?: number;
    p75Days?: number;
  }>;
  overall: {
    n: number;
    suppressed: boolean;
    reason?: string;
    medianDays?: number;
    p25Days?: number;
    p75Days?: number;
  };
};

export function TimelinesPage() {
  const [data, setData] = useState<TimelineResponse | null>(null);

  useEffect(() => {
    fetch('/api/timelines')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Timeline expectations"
        lede="Median and interquartile days from filing → board recommendation, by project type. Sample size shown; stats suppressed below n=5. Never a promise."
      />
      <DisclaimerBanner compact />
      {data && <p className="mt-6 text-sm text-ink/60">{data.disclaimer}</p>}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Overall</h2>
        {data?.overall.suppressed ? (
          <p className="mt-2 text-sm text-ink/55">{data.overall.reason}</p>
        ) : (
          <p className="mt-2 text-sm">
            Median {data?.overall.medianDays} days (IQR {data?.overall.p25Days}–{data?.overall.p75Days}) · n=
            {data?.overall.n}
          </p>
        )}
      </section>

      <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
        {data?.buckets.map((b) => (
          <li key={b.projectType} className="py-4">
            <p className="font-medium">{b.projectType.replace(/_/g, ' ')}</p>
            {b.suppressed ? (
              <p className="mt-1 text-sm text-ink/50">{b.reason}</p>
            ) : (
              <p className="mt-1 text-sm text-ink/70">
                Median {b.medianDays} days (IQR {b.p25Days}–{b.p75Days}) · n={b.n}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
