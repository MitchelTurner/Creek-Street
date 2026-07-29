/** Shared geo helpers for notice radius (haversine fallback when PostGIS offline). */

export function centroidOf(geometry: { coordinates: number[][][] }): [number, number] {
  const ring = geometry.coordinates[0] ?? [];
  let x = 0;
  let y = 0;
  const n = Math.max(ring.length - 1, 1);
  for (let i = 0; i < ring.length - 1; i++) {
    x += ring[i][0];
    y += ring[i][1];
  }
  return [x / n, y / n];
}

export function haversineMeters(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const FEET_PER_METER = 1 / 0.3048;
