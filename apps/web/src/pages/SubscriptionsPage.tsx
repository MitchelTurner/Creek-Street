import { FormEvent, useEffect, useState } from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

export function SubscriptionsPage() {
  const { user, authHeaders } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [scope, setScope] = useState<'DISTRICT_WIDE' | 'PROJECT_TYPE' | 'PARCEL' | 'RADIUS'>('DISTRICT_WIDE');
  const [channel, setChannel] = useState<'EMAIL' | 'RSS'>('EMAIL');
  const [result, setResult] = useState<string | null>(null);
  const [mine, setMine] = useState<Array<{ id: string; scope: string; channel: string; email: string }>>([]);

  useEffect(() => {
    if (user) setEmail(user.email);
    if (!user) return;
    fetch('/api/subscriptions/mine', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setMine(d.subscriptions ?? []))
      .catch(() => setMine([]));
  }, [user, authHeaders]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ email, scope, channel, projectTypes: scope === 'PROJECT_TYPE' ? ['SIGNAGE'] : [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult('Failed');
      return;
    }
    setResult(
      data.subscription.rssPath
        ? `Subscribed. RSS: ${data.subscription.rssPath} · unsub token ${data.subscription.unsubToken}`
        : `Subscribed. Unsub token: ${data.subscription.unsubToken}`,
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
      <PageHeader
        title="Alerts & subscriptions"
        lede="Parcel, radius, project type, or district-wide — email or RSS. Retention hook for property owners and Creek Street businesses."
      />
      <DisclaimerBanner />

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Scope
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            <option value="DISTRICT_WIDE">District-wide</option>
            <option value="PROJECT_TYPE">Project type (signage demo)</option>
            <option value="PARCEL">Parcel</option>
            <option value="RADIUS">Radius</option>
          </select>
        </label>
        <label className="block text-sm">
          Channel
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          >
            <option value="EMAIL">Email</option>
            <option value="RSS">RSS</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-creek px-4 py-2.5 text-sm font-semibold text-foam">
          Subscribe
        </button>
      </form>
      {result && <p className="mt-4 text-sm text-creek break-all">{result}</p>}

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Your subscriptions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {mine.map((s) => (
              <li key={s.id}>
                {s.scope} · {s.channel} · {s.email}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
