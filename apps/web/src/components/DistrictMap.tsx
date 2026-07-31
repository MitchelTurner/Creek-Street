import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Link, useNavigate } from 'react-router-dom';
import type { StructureSummary } from '../lib/api';

type Props = {
  geojson: GeoJSON.FeatureCollection;
  structures?: StructureSummary[];
  interactive?: boolean;
  className?: string;
  /** When set, pin click opens drawer instead of navigating away. */
  onSelectSlug?: (slug: string) => void;
  selectedSlug?: string | null;
};

type Pin = { slug: string; name: string; contributing: boolean };

function pinsFromGeojson(geojson: GeoJSON.FeatureCollection): Pin[] {
  return geojson.features
    .filter((f) => f.geometry?.type === 'Point')
    .map((f) => {
      const p = f.properties ?? {};
      const slug = typeof p.publicSlug === 'string' ? p.publicSlug : '';
      const name =
        (typeof p.commonName === 'string' && p.commonName) ||
        (typeof p.addressLabel === 'string' && p.addressLabel) ||
        (typeof p.name === 'string' && p.name) ||
        slug ||
        'Structure';
      return {
        slug,
        name,
        contributing: p.nrhpContributing === true,
      };
    })
    .filter((p) => p.slug);
}

function MapFallback({
  geojson,
  onSelectSlug,
  message,
  className,
}: {
  geojson: GeoJSON.FeatureCollection;
  onSelectSlug?: (slug: string) => void;
  message: string;
  className?: string;
}) {
  const pins = pinsFromGeojson(geojson);
  return (
    <div className={['flex flex-col bg-tide text-foam', className ?? 'h-[420px] w-full'].join(' ')}>
      <div className="border-b border-foam/15 px-4 py-3 text-sm text-foam/80 md:px-6">
        Interactive map unavailable — {message} Use the structure list below, or open the{' '}
        <Link to="/structures" className="font-semibold text-board underline underline-offset-4">
          inventory
        </Link>
        .
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-foam/10 px-4 py-2 md:px-6">
        {pins.map((p) => (
          <li key={p.slug}>
            {onSelectSlug ? (
              <button
                type="button"
                onClick={() => onSelectSlug(p.slug)}
                className="flex w-full items-baseline justify-between gap-3 py-3 text-left hover:bg-foam/5"
              >
                <span className="font-medium text-foam">{p.name}</span>
                <span className="text-xs text-foam/50">
                  {p.contributing ? 'Contributing' : 'Non-contributing'}
                </span>
              </button>
            ) : (
              <Link
                to={`/structures/${p.slug}`}
                className="flex items-baseline justify-between gap-3 py-3 hover:bg-foam/5"
              >
                <span className="font-medium text-foam">{p.name}</span>
                <span className="text-xs text-foam/50">
                  {p.contributing ? 'Contributing' : 'Non-contributing'}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Catches MapLibre / WebGL failures so the rest of the hub stays usable. */
class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('District map failed', error, info.componentStack);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function DistrictMapCanvas({
  geojson,
  interactive = true,
  className,
  onSelectSlug,
  selectedSlug,
  onFatal,
}: Props & { onFatal: (message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedRef = useRef(selectedSlug);
  const navigate = useNavigate();
  const onFatalRef = useRef(onFatal);
  selectedRef.current = selectedSlug;
  onFatalRef.current = onFatal;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = (await import('maplibre-gl')).default;
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
              },
            ],
          },
          center: [-131.6422, 55.3425],
          zoom: 16.2,
          interactive,
          attributionControl: {},
        });
        if (cancelled) {
          map.remove();
          return;
        }
        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('error', (e: { error?: Error; message?: string }) => {
          const msg = e?.error?.message || e?.message || 'Map failed to load';
          if (/webgl/i.test(msg) || /Failed to initialize/i.test(msg)) {
            onFatalRef.current('this browser could not start WebGL.');
          }
        });

        map.on('load', () => {
          if (cancelled) return;
          map.addSource('district', { type: 'geojson', data: geojson as never });

          map.addLayer({
            id: 'hd-fill',
            type: 'fill',
            source: 'district',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': '#0f4f4d',
              'fill-opacity': 0.16,
            },
          });

          map.addLayer({
            id: 'hd-line',
            type: 'line',
            source: 'district',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'line-color': '#1a8a84',
              'line-width': 2,
            },
          });

          map.addLayer({
            id: 'structures',
            type: 'circle',
            source: 'district',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
              'circle-radius': [
                'case',
                ['==', ['get', 'publicSlug'], selectedRef.current ?? ''],
                11,
                7,
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'nrhpContributing'], true],
                '#9a6240',
                '#5a7a78',
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#eef6f4',
            },
          });

          if (interactive) {
            map.on('mouseenter', 'structures', () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'structures', () => {
              map.getCanvas().style.cursor = '';
            });
            map.on('click', 'structures', (e) => {
              const f = e.features?.[0];
              const slug = f?.properties?.publicSlug;
              if (typeof slug !== 'string') return;
              if (onSelectSlug) onSelectSlug(slug);
              else navigate(`/structures/${slug}`);
            });
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onFatalRef.current(
          /webgl/i.test(msg)
            ? 'this browser could not start WebGL.'
            : 'the map library failed to start.',
        );
      }
    })();

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
      } catch {
        /* map may already be torn down after WebGL failure */
      }
      mapRef.current = null;
    };
  }, [geojson, interactive, navigate, onSelectSlug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('structures')) return;
    map.setPaintProperty('structures', 'circle-radius', [
      'case',
      ['==', ['get', 'publicSlug'], selectedSlug ?? ''],
      11,
      7,
    ]);
  }, [selectedSlug]);

  return <div ref={containerRef} className={className ?? 'h-[420px] w-full'} />;
}

export function DistrictMap(props: Props) {
  const [fatal, setFatal] = useState<string | null>(null);
  const fallback = (
    <MapFallback
      geojson={props.geojson}
      onSelectSlug={props.onSelectSlug}
      message={fatal ?? 'the interactive map could not start.'}
      className={props.className}
    />
  );

  if (fatal) return fallback;

  return (
    <MapErrorBoundary fallback={fallback}>
      <DistrictMapCanvas {...props} onFatal={setFatal} />
    </MapErrorBoundary>
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
