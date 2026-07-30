import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AuditStore } from '../compliance/audit.store';
import { OpsAgingService, type OpsAlertResult } from './ops-aging.service';

export type SchedulerTickResult = {
  at: string;
  triggered: 'auto' | 'manual';
  skipped: boolean;
  skipReason: 'DISABLED' | null;
  alert: OpsAlertResult | null;
};

function envFlag(key: string, fallback: boolean) {
  const raw = process.env[key];
  if (raw == null || raw === '') return fallback;
  return raw.toLowerCase() === 'true' || raw === '1';
}

function envHours(key: string, fallback: number) {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Phase 19 — periodic stale-alert dispatcher.
 * Calls OpsAgingService.sendAlert({ force: false }) so cooldown + NO_STALE gates apply.
 * Never emails AI summary bodies (enforced by OpsAgingService).
 */
@Injectable()
export class OpsSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(OpsSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private enabled = envFlag('OPS_ALERT_SCHEDULER_ENABLED', false);
  private tickHours = envHours('OPS_ALERT_TICK_HOURS', 1);
  private lastTick: SchedulerTickResult | null = null;
  private nextTickAt: string | null = null;

  constructor(
    private readonly aging: OpsAgingService,
    private readonly audit: AuditStore,
  ) {}

  onModuleInit() {
    if (this.enabled) this.startTimer();
    this.log.log(
      `Ops alert scheduler ${this.enabled ? 'enabled' : 'disabled'} tickHours=${this.tickHours}`,
    );
  }

  onModuleDestroy() {
    this.stopTimer();
  }

  status() {
    return {
      phase: 19,
      enabled: this.enabled,
      tickHours: this.tickHours,
      running: Boolean(this.timer),
      lastTick: this.lastTick,
      nextTickAt: this.enabled ? this.nextTickAt : null,
      envDefaultEnabled: envFlag('OPS_ALERT_SCHEDULER_ENABLED', false),
      note: 'Auto ticks call sendAlert without force — NO_STALE and COOLDOWN still apply. AI summary bodies are never emailed.',
    };
  }

  enable() {
    this.enabled = true;
    this.startTimer();
    return this.status();
  }

  disable() {
    this.enabled = false;
    this.stopTimer();
    this.nextTickAt = null;
    return this.status();
  }

  async tick(opts: {
    triggered: 'auto' | 'manual';
    origin?: string;
    actor?: { id: string; email: string; role: string } | null;
  }): Promise<SchedulerTickResult> {
    const at = new Date().toISOString();
    if (!this.enabled && opts.triggered === 'auto') {
      const result: SchedulerTickResult = {
        at,
        triggered: 'auto',
        skipped: true,
        skipReason: 'DISABLED',
        alert: null,
      };
      this.lastTick = result;
      return result;
    }

    // Manual tick runs even if disabled so staff can force a check
    const alert = await this.aging.sendAlert({
      origin: opts.origin,
      force: false,
    });

    const result: SchedulerTickResult = {
      at,
      triggered: opts.triggered,
      skipped: false,
      skipReason: null,
      alert,
    };
    this.lastTick = result;
    this.bumpNextTick();

    this.audit.record({
      action: 'ops.alert.scheduler.tick',
      actor: opts.actor ?? { id: null, email: 'system', role: 'STAFF' },
      resourceType: 'ops_scheduler',
      resourceId: opts.triggered,
      summary: `Scheduler tick (${opts.triggered}): ${
        alert.sent ? `SENT to ${alert.recipients}` : alert.reason
      }`,
      meta: {
        triggered: opts.triggered,
        sent: alert.sent,
        reason: alert.reason,
        staleTotal: alert.staleTotal,
      },
    });

    return result;
  }

  private startTimer() {
    this.stopTimer();
    const ms = Math.max(1, this.tickHours) * 3600000;
    this.bumpNextTick();
    this.timer = setInterval(() => {
      void this.tick({ triggered: 'auto' }).catch((e) =>
        this.log.error(`Scheduler tick failed: ${(e as Error).message}`),
      );
    }, ms);
    // Avoid keeping the process alive solely for the timer in tests
    this.timer.unref?.();
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private bumpNextTick() {
    if (!this.enabled) {
      this.nextTickAt = null;
      return;
    }
    this.nextTickAt = new Date(Date.now() + this.tickHours * 3600000).toISOString();
  }
}
