import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JournalService } from './journal.service';

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
 * Daily journal publish + Monday weekly highlights.
 * Ticks hourly (default); publishes at most one post per Alaska calendar day.
 */
@Injectable()
export class JournalSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(JournalSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private enabled = envFlag('JOURNAL_SCHEDULER_ENABLED', true);
  private tickHours = envHours('JOURNAL_TICK_HOURS', 1);
  private lastTick: Record<string, unknown> | null = null;
  private nextTickAt: string | null = null;

  constructor(private readonly journal: JournalService) {}

  onModuleInit() {
    if (this.enabled) this.startTimer();
    this.log.log(
      `Journal scheduler ${this.enabled ? 'enabled' : 'disabled'} tickHours=${this.tickHours}`,
    );
  }

  onModuleDestroy() {
    this.stopTimer();
  }

  status() {
    return {
      enabled: this.enabled,
      tickHours: this.tickHours,
      running: Boolean(this.timer),
      lastTick: this.lastTick,
      nextTickAt: this.enabled ? this.nextTickAt : null,
      journal: this.journal.status(),
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

  async tick(opts: { triggered: 'auto' | 'manual'; origin?: string }) {
    const at = new Date().toISOString();
    if (!this.enabled && opts.triggered === 'auto') {
      this.lastTick = { at, triggered: 'auto', skipped: true, reason: 'DISABLED' };
      return this.lastTick;
    }

    const daily = await this.journal.ensureDailyPost({ origin: opts.origin });
    let weekly: unknown = null;
    if (isAlaskaMonday(new Date()) || opts.triggered === 'manual') {
      try {
        weekly = await this.journal.sendWeeklyHighlights({
          force: opts.triggered === 'manual',
          origin: opts.origin,
        });
      } catch (e) {
        weekly = { error: (e as Error).message };
      }
    }

    this.lastTick = {
      at,
      triggered: opts.triggered,
      skipped: false,
      daily,
      weekly,
    };
    this.bumpNextTick();
    return this.lastTick;
  }

  private startTimer() {
    this.stopTimer();
    const ms = Math.max(1, this.tickHours) * 3600_000;
    this.bumpNextTick();
    this.timer = setInterval(() => {
      void this.tick({ triggered: 'auto' }).catch((e) =>
        this.log.error(`Journal tick failed: ${(e as Error).message}`),
      );
    }, ms);
    this.timer.unref?.();
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private bumpNextTick() {
    this.nextTickAt = this.enabled
      ? new Date(Date.now() + this.tickHours * 3600_000).toISOString()
      : null;
  }
}

function isAlaskaMonday(d: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Juneau',
    weekday: 'short',
  }).format(d);
  return weekday === 'Mon';
}
