import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useNavigate } from 'react-router-dom';
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

export function DistrictMap({
  geojson,
  interactive = true,
  className,
  onSelectSlug,
  selectedSlug,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

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
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
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
            ['==', ['get', 'publicSlug'], selectedSlug ?? ''],
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

    return () => {
      mapRef.current = null;
      map.remove();
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
