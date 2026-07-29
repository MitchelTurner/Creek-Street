import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type AuditActor = {
  id: string | null;
  email: string | null;
  role: string | null;
};

export type AuditEvent = {
  id: string;
  at: string;
  action: string;
  actor: AuditActor;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class AuditStore {
  private events: AuditEvent[] = [];

  record(input: {
    action: string;
    actor?: Partial<AuditActor> | null;
    resourceType: string;
    resourceId?: string | null;
    summary: string;
    meta?: Record<string, unknown>;
  }) {
    const event: AuditEvent = {
      id: randomUUID(),
      at: new Date().toISOString(),
      action: input.action,
      actor: {
        id: input.actor?.id ?? null,
        email: input.actor?.email ?? null,
        role: input.actor?.role ?? null,
      },
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      summary: input.summary,
      meta: input.meta,
    };
    this.events.unshift(event);
    if (this.events.length > 2000) this.events.length = 2000;
    return event;
  }

  list(opts?: { limit?: number; action?: string; actorId?: string }) {
    let rows = this.events;
    if (opts?.action) rows = rows.filter((e) => e.action === opts.action);
    if (opts?.actorId) rows = rows.filter((e) => e.actor.id === opts.actorId);
    return rows.slice(0, opts?.limit ?? 100);
  }
}
