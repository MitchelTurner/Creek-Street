import { describe, expect, it } from 'vitest';
import { ContractGate } from '../phase3/contract.gate';
import { AuditStore } from './audit.store';
import { ComplianceService } from './compliance.service';

describe('ComplianceService', () => {
  it('exposes retention principles and incomplete processor agreement by default', () => {
    const svc = new ComplianceService(new ContractGate(), new AuditStore());
    const retention = svc.retentionPolicy();
    expect(retention.principles.length).toBeGreaterThan(3);
    expect(retention.scheduleConfigured).toBe(false);

    const checklist = svc.readinessChecklist();
    expect(checklist.deliberationUnlocked).toBe(false);
    expect(checklist.items.find((i) => i.id === 'draft-gate')?.done).toBe(true);
    expect(checklist.items.find((i) => i.id === 'processor-agreement')?.done).toBe(false);
  });
});
