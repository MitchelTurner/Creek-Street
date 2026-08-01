import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DistrictMap } from '../components/DistrictMap';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

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

function updatePinInGeojson(
  geojson: GeoJSON.FeatureCollection,
  slug: string,
  lng: number,
  lat: number,
): GeoJSON.FeatureCollection {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      if (f.geometry?.type !== 'Point') return f;
      if (f.properties?.publicSlug !== slug) return f;
      return {
        ...f,
        geometry: { type: 'Point', coordinates: [lng, lat] },
      };
    }),
  };
}

export function MapPage() {
  const { user, authHeaders } = useAuth();
  const canEdit = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetPreview | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lngInput, setLngInput] = useState('');
  const [latInput, setLatInput] = useState('');

  const reloadMap = useCallback(() => {
    api
      .map()
      .then(setGeojson)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    reloadMap();
  }, [reloadMap]);

  useEffect(() => {
    if (!slug) {
      setSheet(null);
      setLngInput('');
      setLatInput('');
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

    if (geojson) {
      const pin = geojson.features.find(
        (f) => f.geometry?.type === 'Point' && f.properties?.publicSlug === slug,
      );
      const coords = (pin?.geometry as { coordinates?: number[] } | undefined)?.coordinates;
      if (coords) {
        setLngInput(String(coords[0]));
        setLatInput(String(coords[1]));
      }
    }
  }, [slug, geojson]);

  async function saveCentroid(targetSlug: string, lng: number, lat: number) {
    setSaveError(null);
    setSaveNote('Saving…');
    setGeojson((prev) => (prev ? updatePinInGeojson(prev, targetSlug, lng, lat) : prev));
    try {
      const res = await fetch(`/api/ops/structures/${encodeURIComponent(targetSlug)}/centroid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ lng, lat }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveNote(`Saved ${targetSlug} → ${lng.toFixed(5)}, ${lat.toFixed(5)}`);
      setLngInput(String(lng));
      setLatInput(String(lat));
    } catch (e) {
      setSaveNote(null);
      setSaveError(e instanceof Error ? e.message : 'Save failed');
      reloadMap();
    }
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <PageHeader
          title="District map"
          lede="Full-bleed HD zone. Click a structure for its civic dossier — cases, decisions, visit story — without leaving the map."
        />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {canEdit ? (
            <>
              <button
                type="button"
                className={editMode ? 'btn-primary py-2' : 'btn-secondary py-2'}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? 'Done editing pins' : 'Edit pins'}
              </button>
              {editMode && (
                <p className="text-sm text-ink/60">
                  Drag markers to nudge locations. Changes save for staff immediately.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink/50">
              Staff can nudge pin locations after{' '}
              <Link to="/auth" className="font-semibold text-creek underline underline-offset-4">
                signing in
              </Link>
              .
            </p>
          )}
          {saveNote && <p className="text-sm text-creek">{saveNote}</p>}
          {saveError && <p className="text-sm text-cedar-deep">{saveError}</p>}
        </div>
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
            editMode={editMode}
            onPinMoved={saveCentroid}
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

                  {editMode && canEdit && (
                    <form
                      className="mt-4 grid grid-cols-2 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const lng = Number(lngInput);
                        const lat = Number(latInput);
                        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                          setSaveError('Enter valid lng/lat numbers');
                          return;
                        }
                        void saveCentroid(slug, lng, lat);
                      }}
                    >
                      <label className="text-xs text-ink/55">
                        Longitude
                        <input
                          className="field mt-1 py-1.5 text-sm"
                          value={lngInput}
                          onChange={(e) => setLngInput(e.target.value)}
                        />
                      </label>
                      <label className="text-xs text-ink/55">
                        Latitude
                        <input
                          className="field mt-1 py-1.5 text-sm"
                          value={latInput}
                          onChange={(e) => setLatInput(e.target.value)}
                        />
                      </label>
                      <button type="submit" className="btn-primary col-span-2 py-2">
                        Save coordinates
                      </button>
                    </form>
                  )}

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
