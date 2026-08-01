import { afterEach, describe, expect, it } from 'vitest';
import { MemoryStore } from './memory.store';

describe('MemoryStore map pin edits', () => {
  const store = new MemoryStore();
  let restore: (() => void) | null = null;

  afterEach(() => {
    restore?.();
    restore = null;
  });

  it('updates a structure centroid and reflects it on the district map', () => {
    const before = store.districtMap();
    const pin = before.features.find(
      (f) => f.geometry.type === 'Point' && f.properties?.publicSlug === '20-creek-street',
    );
    expect(pin).toBeTruthy();
    const prev = (pin!.geometry as { coordinates: [number, number] }).coordinates;
    restore = () => {
      store.updateStructureCentroid('20-creek-street', prev[0], prev[1]);
    };

    const updated = store.updateStructureCentroid('20-creek-street', -131.6415, 55.3431);
    expect(updated?.publicSlug).toBe('20-creek-street');
    expect(updated?.centroid.coordinates).toEqual([-131.6415, 55.3431]);

    const after = store.districtMap();
    const moved = after.features.find(
      (f) => f.geometry.type === 'Point' && f.properties?.publicSlug === '20-creek-street',
    );
    expect(moved?.geometry).toEqual({
      type: 'Point',
      coordinates: [-131.6415, 55.3431],
    });
  });

  it('rejects out-of-range coordinates', () => {
    expect(store.updateStructureCentroid('20-creek-street', 200, 55)).toBeNull();
    expect(store.updateStructureCentroid('missing-slug', -131.64, 55.34)).toBeNull();
  });
});
