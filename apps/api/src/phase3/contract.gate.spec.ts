import { ForbiddenException } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import { ContractGate } from './contract.gate';

const KEYS = [
  'PHASE3_CONTRACT_ACTIVE',
  'PHASE3_CUSTODIAN',
  'PHASE3_PROCESSOR',
  'PHASE3_AGREEMENT_ID',
  'PHASE3_AGREEMENT_EFFECTIVE',
  'PHASE3_RETENTION_SCHEDULE_URL',
  'PHASE3_RECORDS_REQUEST_CONTACT',
  'PHASE3_OMA_NOTICE_INTEGRATION',
] as const;

describe('ContractGate', () => {
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it('stays inactive when contract env is unset', () => {
    const gate = new ContractGate();
    const status = gate.status();
    expect(status.active).toBe(false);
    expect(status.missing.length).toBeGreaterThan(0);
    expect(status.missing).toContain('PHASE3_CONTRACT_ACTIVE=true');
  });

  it('assertActive throws PHASE3_CONTRACT_REQUIRED when dark', () => {
    const gate = new ContractGate();
    try {
      gate.assertActive();
      expect.unreachable('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      const body = (e as ForbiddenException).getResponse() as { error: string };
      expect(body.error).toBe('PHASE3_CONTRACT_REQUIRED');
    }
  });

  it('activates only when every processor-agreement flag is set', () => {
    process.env.PHASE3_CONTRACT_ACTIVE = 'true';
    process.env.PHASE3_CUSTODIAN = 'Ketchikan Gateway Borough';
    process.env.PHASE3_PROCESSOR = 'Mitchel Turner Dev, LLC';
    process.env.PHASE3_AGREEMENT_ID = 'MOU-2026-01';
    process.env.PHASE3_AGREEMENT_EFFECTIVE = '2026-01-01';
    process.env.PHASE3_RETENTION_SCHEDULE_URL = 'https://example.com/retention';
    process.env.PHASE3_RECORDS_REQUEST_CONTACT = 'records@kgbak.us';
    process.env.PHASE3_OMA_NOTICE_INTEGRATION = 'true';

    const gate = new ContractGate();
    expect(gate.status().active).toBe(true);
    expect(gate.assertActive().agreementId).toBe('MOU-2026-01');
  });
});
