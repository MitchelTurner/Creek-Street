import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OpsQueueService } from './ops-queue.service';

export type QueueClaimKind = 'photo' | 'summary' | 'ingest';

export type QueueClaim = {
  kind: QueueClaimKind;
  id: string;
  byUserId: string;
  byEmail: string;
  at: string;
  expiresAt: string;
};

function claimKey(kind: QueueClaimKind, id: string) {
  return `${kind}:${id}`;
}

function envHours(key: string, fallback: number) {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Phase 20 — soft claim/lock on staff queue items.
 * Prevents two staff from acting on the same photo/summary/ingest failure.
 */
@Injectable()
export class OpsClaimService {
  private claims = new Map<string, QueueClaim>();

  constructor(private readonly queue: OpsQueueService) {}

  claimHours() {
    return envHours('OPS_CLAIM_HOURS', 2);
  }

  purgeExpired(nowMs = Date.now()) {
    for (const [key, claim] of this.claims) {
      if (new Date(claim.expiresAt).getTime() <= nowMs) this.claims.delete(key);
    }
  }

  listActive(nowMs = Date.now()) {
    this.purgeExpired(nowMs);
    return [...this.claims.values()];
  }

  get(kind: QueueClaimKind, id: string, nowMs = Date.now()): QueueClaim | null {
    this.purgeExpired(nowMs);
    return this.claims.get(claimKey(kind, id)) ?? null;
  }

  publicClaim(claim: QueueClaim | null) {
    if (!claim) return null;
    return {
      by: claim.byUserId,
      email: claim.byEmail,
      at: claim.at,
      expiresAt: claim.expiresAt,
    };
  }

  assertKnown(kind: QueueClaimKind, id: string) {
    const snap = this.queue.snapshot();
    if (kind === 'photo' && !snap.pendingPhotos.some((p) => p.id === id)) {
      throw new NotFoundException('Queue photo not found');
    }
    if (kind === 'summary' && !snap.pendingSummaries.some((s) => s.id === id)) {
      throw new NotFoundException('Queue summary not found');
    }
    if (kind === 'ingest' && !snap.failedIngestRuns.some((r) => r.id === id)) {
      throw new NotFoundException('Queue ingest run not found');
    }
  }

  claim(
    kind: QueueClaimKind,
    id: string,
    user: { id: string; email: string; role: string },
    nowMs = Date.now(),
  ) {
    this.assertKnown(kind, id);
    this.purgeExpired(nowMs);
    const key = claimKey(kind, id);
    const existing = this.claims.get(key);
    if (existing && existing.byUserId !== user.id) {
      throw new ConflictException({
        code: 'QUEUE_ITEM_CLAIMED',
        message: `Claimed by ${existing.byEmail} until ${existing.expiresAt}`,
        claim: this.publicClaim(existing),
      });
    }
    const hours = this.claimHours();
    const claim: QueueClaim = {
      kind,
      id,
      byUserId: user.id,
      byEmail: user.email,
      at: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + hours * 3600000).toISOString(),
    };
    this.claims.set(key, claim);
    return this.publicClaim(claim);
  }

  release(
    kind: QueueClaimKind,
    id: string,
    user: { id: string; email: string; role: string },
    opts?: { force?: boolean; nowMs?: number },
  ) {
    this.assertKnown(kind, id);
    this.purgeExpired(opts?.nowMs);
    const key = claimKey(kind, id);
    const existing = this.claims.get(key);
    if (!existing) return { released: false, claim: null };
    const isOwner = existing.byUserId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !(opts?.force && isAdmin)) {
      throw new ConflictException({
        code: 'QUEUE_ITEM_CLAIMED',
        message: `Claimed by ${existing.byEmail}; only owner or ADMIN force-release`,
        claim: this.publicClaim(existing),
      });
    }
    this.claims.delete(key);
    return { released: true, claim: this.publicClaim(existing) };
  }

  enrichQueueItems<T extends { id: string }>(
    kind: QueueClaimKind,
    items: T[],
    nowMs = Date.now(),
  ) {
    this.purgeExpired(nowMs);
    return items.map((item) => ({
      ...item,
      claim: this.publicClaim(this.get(kind, item.id, nowMs)),
    }));
  }

  summary(nowMs = Date.now()) {
    const active = this.listActive(nowMs);
    return {
      claimHours: this.claimHours(),
      activeCount: active.length,
      byKind: {
        photo: active.filter((c) => c.kind === 'photo').length,
        summary: active.filter((c) => c.kind === 'summary').length,
        ingest: active.filter((c) => c.kind === 'ingest').length,
      },
    };
  }
}

export function parseClaimKind(raw: string): QueueClaimKind {
  if (raw === 'photo' || raw === 'summary' || raw === 'ingest') return raw;
  throw new NotFoundException('Unknown queue claim kind');
}
