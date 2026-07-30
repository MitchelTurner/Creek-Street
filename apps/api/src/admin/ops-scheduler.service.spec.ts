import { describe, expect, it, vi } from 'vitest';
import { OpsSchedulerService } from './ops-scheduler.service';

describe('OpsSchedulerService', () => {
  it('runs a tick through sendAlert without force and records audit', async () => {
    const sendAlert = vi.fn(async () => ({
      at: '2026-07-30T12:00:00.000Z',
      sent: true,
      reason: 'SENT',
      recipients: 1,
      mode: 'stub',
      subject: 'stale',
      preview: 'Creek Street — stale queue alert\nsum_draft id only',
      staleTotal: 2,
      cooldownHours: 6,
      nextEligibleAt: null,
    }));
    const record = vi.fn();
    const svc = new OpsSchedulerService(
      { sendAlert } as never,
      { record } as never,
    );

    const result = await svc.tick({
      triggered: 'manual',
      origin: 'https://creek.example',
      actor: { id: 'user_staff', email: 'staff@example.com', role: 'STAFF' },
    });

    expect(sendAlert).toHaveBeenCalledWith({
      origin: 'https://creek.example',
      force: false,
    });
    expect(result.skipped).toBe(false);
    expect(result.alert?.sent).toBe(true);
    expect(result.alert?.preview).not.toContain('AI DRAFT');
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ops.alert.scheduler.tick',
        meta: expect.objectContaining({ triggered: 'manual', sent: true }),
      }),
    );
  });

  it('skips auto ticks when disabled', async () => {
    const sendAlert = vi.fn();
    const svc = new OpsSchedulerService(
      { sendAlert } as never,
      { record: vi.fn() } as never,
    );
    svc.disable();
    const result = await svc.tick({ triggered: 'auto' });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('DISABLED');
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it('allows manual tick while disabled', async () => {
    const sendAlert = vi.fn(async () => ({
      at: '2026-07-30T12:00:00.000Z',
      sent: false,
      reason: 'NO_STALE',
      recipients: 0,
      mode: null,
      subject: null,
      preview: null,
      staleTotal: 0,
      cooldownHours: 6,
      nextEligibleAt: null,
    }));
    const svc = new OpsSchedulerService(
      { sendAlert } as never,
      { record: vi.fn() } as never,
    );
    svc.disable();
    const result = await svc.tick({ triggered: 'manual' });
    expect(result.skipped).toBe(false);
    expect(sendAlert).toHaveBeenCalled();
    expect(result.alert?.reason).toBe('NO_STALE');
  });
});
