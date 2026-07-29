import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useNavigate } from 'react-router-dom';
import type { StructureSummary } from '../lib/api';

type Props = {
  geojson: GeoJSON.FeatureCollection;
  structures?: StructureSummary[];
  interactive?: boolean;
  className?: string;
};

export function DistrictMap({ geojson, interactive = true, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('district', { type: 'geojson', data: geojson as never });

      map.addLayer({
        id: 'hd-fill',
        type: 'fill',
        source: 'district',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#145c5a',
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'hd-line',
        type: 'line',
        source: 'district',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': '#145c5a',
          'line-width': 2,
        },
      });

      map.addLayer({
        id: 'structures',
        type: 'circle',
        source: 'district',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'case',
            ['==', ['get', 'nrhpContributing'], true],
            '#8a5a3a',
            '#5a7a78',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#e7f1ef',
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
          if (typeof slug === 'string') navigate(`/structures/${slug}`);
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [geojson, interactive, navigate]);

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
