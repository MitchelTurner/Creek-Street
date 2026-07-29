import { useEffect, useState } from 'react';
import { DistrictMap } from '../components/DistrictMap';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';

export function MapPage() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .map()
      .then(setGeojson)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader
        title="District map"
        lede="HD zone boundary, parcels, and structures — contributing versus non-contributing. Click a structure for its history."
      />
      <div className="overflow-hidden rounded-lg border border-ink/10 shadow-[0_20px_60px_-30px_rgba(14,28,28,0.45)]">
        {error && <p className="p-4 text-sm text-cedar-deep">{error}</p>}
        {geojson ? (
          <DistrictMap geojson={geojson} className="h-[70vh] min-h-[420px] w-full" />
        ) : (
          !error && <div className="flex h-[70vh] items-center justify-center text-sm text-ink/50">Loading map…</div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/60">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cedar" /> Contributing (NRHP)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5a7a78]" /> Non-contributing
        </span>
        <span>Boundary is approximate pending borough GIS refine.</span>
      </div>
    </div>
  );
}

declare namespace GeoJSON {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: Record<string, unknown> | null;
      geometry: { type: string; coordinates: unknown };
    }>;
  }
}
