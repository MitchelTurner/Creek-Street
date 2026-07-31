import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DistrictMap } from '../components/DistrictMap';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { api } from '../lib/api';

type SheetPreview = {
  structure: {
    publicSlug: string;
    commonName: string | null;
    addressLabel: string;
    yearBuilt: number | null;
    nrhpContributing: boolean;
    historicNarrative: string;
  };
  applications: Array<{ id: string; caseNumber: string | null; status: string }>;
  decisions: Array<{ id: string; recommendation: string }>;
  links: { ui: string; visit: string; pdf: string };
};

export function MapPage() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetPreview | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  useEffect(() => {
    api
      .map()
      .then(setGeojson)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!slug) {
      setSheet(null);
      return;
    }
    setSheetError(null);
    fetch(`/api/structures/${slug}/sheet`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<SheetPreview>;
      })
      .then(setSheet)
      .catch((e: Error) => setSheetError(e.message));
  }, [slug]);

  return (
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <PageHeader
          title="District map"
          lede="Full-bleed HD zone. Click a structure for its civic dossier — cases, decisions, visit story — without leaving the map."
        />
      </div>

      <div className="relative border-y border-ink/10 bg-ink">
        {error && (
          <p className="bg-spray px-4 py-3 text-sm text-cedar-deep md:px-6">{error}</p>
        )}
        {geojson ? (
          <DistrictMap
            geojson={geojson}
            selectedSlug={slug}
            onSelectSlug={setSlug}
            className="h-[min(78vh,820px)] min-h-[480px] w-full"
          />
        ) : (
          !error && (
            <div className="flex h-[min(78vh,820px)] items-center justify-center bg-tide">
              <Skeleton className="h-8 w-40 bg-foam/20" />
            </div>
          )
        )}

        {slug && (
          <aside
            className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto border-t border-foam/15 bg-spray/95 shadow-[0_-20px_60px_rgba(7,19,18,0.35)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:max-h-[70%] md:w-[22rem] md:rounded-xl md:border md:border-ink/10"
            aria-label="Structure dossier preview"
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                Civic dossier
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-ink/50 hover:text-ink"
                onClick={() => setSlug(null)}
              >
                Close
              </button>
            </div>
            <div className="px-4 pb-5">
              {sheetError && <p className="text-sm text-cedar-deep">{sheetError}</p>}
              {!sheet && !sheetError && <Skeleton className="h-24 w-full" />}
              {sheet && (
                <>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                    {sheet.structure.commonName ?? sheet.structure.addressLabel}
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">{sheet.structure.addressLabel}</p>
                  <p className="mt-1 text-xs text-ink/45">
                    {sheet.structure.yearBuilt ? `Built ${sheet.structure.yearBuilt} · ` : ''}
                    {sheet.structure.nrhpContributing ? 'NRHP contributing' : 'Non-contributing'}
                  </p>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink/65">
                    {sheet.structure.historicNarrative}
                  </p>
                  <p className="mt-3 text-xs text-ink/45">
                    {sheet.applications.length} public case
                    {sheet.applications.length === 1 ? '' : 's'} · {sheet.decisions.length} decision
                    {sheet.decisions.length === 1 ? '' : 's'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link to={sheet.links.ui} className="btn-primary py-2">
                      Full dossier
                    </Link>
                    <Link to={sheet.links.visit} className="btn-ink py-2">
                      Visit story
                    </Link>
                    <a href={sheet.links.pdf} className="btn-ink py-2">
                      PDF
                    </a>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-4 text-xs text-ink/55 md:px-6">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cedar" /> Contributing (NRHP)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5a7a78]" /> Non-contributing
        </span>
        <span>Boundary approximate pending borough GIS refine.</span>
      </div>

      {!geojson && !error && (
        <div className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
          <EmptyState
            title="Loading the district"
            body="Fetching HD boundary and structure pins from the public mirror."
          />
        </div>
      )}
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
