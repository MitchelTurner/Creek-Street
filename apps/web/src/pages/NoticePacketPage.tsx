import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';
import { RelatedNext } from '../components/RelatedNext';

export function NoticePacketPage() {
  const [address, setAddress] = useState('24 Creek Street');
  const pdfHref = useMemo(
    () => `/api/notice/packet.pdf?address=${encodeURIComponent(address.trim())}`,
    [address],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Neighbor notice packet"
        lede="Print a draft notice helper for an HD-zone address — radius, neighbor parcels, and suggested language. Confirm with staff before mailing."
      />
      <DisclaimerBanner compact />

      <label className="mt-8 block text-sm font-medium text-ink/70">
        Subject address
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="field mt-2 w-full"
          placeholder="24 Creek Street"
        />
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={pdfHref} className="btn-primary">
          Download notice packet (PDF)
        </a>
        <Link to={`/notice?address=${encodeURIComponent(address)}`} className="btn-secondary">
          Open interactive lookup
        </Link>
      </div>

      <ul className="mt-10 space-y-3 text-sm text-ink/65">
        <li>Uses the same mirrored notice rules as `/notice` (KGBC 18.90.060 city radius + 18.90.020 HD district).</li>
        <li>Pending DRAFT applications are never listed.</li>
        <li>Suggested language is a checklist starter — not an official Borough form.</li>
      </ul>

      <RelatedNext
        links={[
          { to: '/filing', label: 'Filing pathway', hint: 'Fold notice into a full file-by plan.' },
          { to: '/meetings', label: 'Meetings', hint: 'Grab the next public board packet.' },
          { to: '/workspace', label: 'Workspace', hint: 'Keep private draft exhibits offline from the public mirror.' },
        ]}
      />
    </div>
  );
}
