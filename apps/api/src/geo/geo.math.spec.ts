import { describe, expect, it } from 'vitest';
import { centroidOf, haversineMeters } from './geo.math';
import { NOTICE_RADIUS_CITY_METERS } from '../phase2/phase2.constants';
import { parcels } from '../data/phase0-seed';
import { GeoService } from './geo.service';

describe('geo.math', () => {
  it('computes a centroid inside the ring bbox', () => {
    const [lng, lat] = centroidOf(parcels[0].geometry);
    expect(lng).toBeLessThan(-131);
    expect(lat).toBeGreaterThan(55);
  });

  it('haversine is ~0 for identical points and finite for neighbors', () => {
    const a = centroidOf(parcels[0].geometry);
    expect(haversineMeters(a, a)).toBeLessThan(1);
    const b = centroidOf(parcels[1].geometry);
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(5000);
  });
});

describe('GeoService haversine notice', () => {
  it('returns parcels within 600 ft of a subject using haversine fallback', () => {
    // Minimal stub — Prisma not connected in unit tests.
    const geo = new GeoService({
      enabled: false,
      rawQuery: async () => [],
    } as never);
    const subject = parcels[0];
    const result = geo.haversineNotice(subject.id, NOTICE_RADIUS_CITY_METERS);
    expect(result.method).toBe('centroid-haversine-approx');
    expect(result.parcels.some((p) => p.id === subject.id)).toBe(true);
    expect(result.parcels.every((p) => p.meters <= NOTICE_RADIUS_CITY_METERS + 0.5)).toBe(true);
  });
});
