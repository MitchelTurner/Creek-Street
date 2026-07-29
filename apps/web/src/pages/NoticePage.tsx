import { useEffect, useState } from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';
import { SourceLink } from '../components/SourceLink';

type NoticeResult = {
  found: boolean;
  message?: string;
  note?: string;
  radiusFeet?: number;
  subjectParcel?: { address: string; parcelNumber: string };
  noticedParcelSet?: { address: string; parcelNumber: string; feet: number }[];
  pendingApplicationsThatWouldNoticeAddress?: Array<{
    within600ft: boolean;
    hdDistrictNotice: boolean;
    meters: number;
    application: { caseNumber: string | null; description: string; status: string };
    parcel: { address: string };
  }>;
  config?: {
    hdDesignReview: { cite: string; rule: string };
    planningCommissionStyle: { cite: string; rule: string; cityRadiusFeet: number };
    sourceUrl: string;
  };
};

export function NoticePage() {
  const [address, setAddress] = useState('24 Creek Street');
  const [data, setData] = useState<NoticeResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/notice?address=${encodeURIComponent(address)}`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData(null));
    }, 200);
    return () => clearTimeout(t);
  }, [address]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Notice radius lookup"
        lede="Enter an address to see which pending applications would notice you under the verified statutory rules — not a guessed 300 ft."
      />
      <DisclaimerBanner compact />

      {data?.config && (
        <div className="mt-6 space-y-3 text-sm text-ink/70">
          <p>
            <span className="font-semibold text-creek">{data.config.hdDesignReview.cite}</span>
            {' — '}
            {data.config.hdDesignReview.rule}
          </p>
          <p>
            <span className="font-semibold text-creek">{data.config.planningCommissionStyle.cite}</span>
            {' — '}
            {data.config.planningCommissionStyle.rule} (city: {data.config.planningCommissionStyle.cityRadiusFeet} ft)
          </p>
          <SourceLink href={data.config.sourceUrl} label="KGBC 18.90.060" />
        </div>
      )}

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="mt-8 w-full rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
        placeholder="Address in the HD zone"
      />

      {data && !data.found && <p className="mt-6 text-sm text-cedar-deep">{data.message}</p>}

      {data?.found && (
        <div className="mt-8 space-y-8">
          <p className="text-sm text-ink/60">
            Subject: {data.subjectParcel?.address} ({data.subjectParcel?.parcelNumber}) · {data.radiusFeet} ft
            city radius · {data.note}
          </p>

          <section>
            <h2 className="font-display text-xl font-semibold">Parcels within 600 ft</h2>
            <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
              {data.noticedParcelSet?.map((p) => (
                <li key={p.parcelNumber} className="flex justify-between py-2 text-sm">
                  <span>{p.address}</span>
                  <span className="text-ink/45">{p.feet} ft</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Pending applications</h2>
            <ul className="mt-3 space-y-3">
              {data.pendingApplicationsThatWouldNoticeAddress?.map((row) => (
                <li key={row.application.caseNumber ?? row.parcel.address} className="border-t border-ink/10 pt-3 text-sm">
                  <p className="font-medium">
                    {row.application.caseNumber} · {row.parcel.address}
                  </p>
                  <p className="text-ink/65">{row.application.description}</p>
                  <p className="mt-1 text-xs text-ink/45">
                    {row.within600ft ? 'Within 600 ft (18.90.060-style)' : 'Outside 600 ft'}
                    {row.hdDistrictNotice ? ' · Also in HD district notice set (18.90.020)' : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
