import { describe, expect, it } from 'vitest';
import { AuditStore } from './audit.store';

describe('AuditStore', () => {
  it('records newest-first and filters by action', () => {
    const store = new AuditStore();
    store.record({
      action: 'photo.moderate',
      actor: { id: 'u1', email: 'staff@example.com', role: 'STAFF' },
      resourceType: 'photo',
      resourceId: 'p1',
      summary: 'Approved photo',
    });
    store.record({
      action: 'ingest.run',
      actor: { id: 'u1', email: 'staff@example.com', role: 'STAFF' },
      resourceType: 'ingest',
      resourceId: 'clerk_agendas',
      summary: 'Ran clerk ingest',
    });
    expect(store.list({ limit: 10 })[0]?.action).toBe('ingest.run');
    expect(store.list({ action: 'photo.moderate' })).toHaveLength(1);
  });
});
