import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { runAdapter } from './adapters';
import { IngestStore } from './ingest.store';
import type { IngestSourceId } from './ingest.types';

const QUEUE_NAME = 'creek-ingest';

@Injectable()
export class IngestQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(IngestQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private mode: 'bullmq' | 'inline' = 'inline';

  constructor(private readonly store: IngestStore) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.mode = 'inline';
      this.log.warn('REDIS_URL unset — ingest runs inline (no BullMQ).');
      return;
    }
    try {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job: Job<{ sourceId: IngestSourceId }>) => this.execute(job.data.sourceId),
        { connection: this.connection.duplicate() },
      );
      this.worker.on('failed', (job, err) => {
        this.log.error(`Job ${job?.id} failed: ${err.message}`);
      });
      this.mode = 'bullmq';
      this.log.log('BullMQ ingest worker online');
    } catch (e) {
      this.mode = 'inline';
      this.log.error(`Redis connect failed; falling back to inline. ${(e as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    this.connection?.disconnect();
  }

  status() {
    return {
      mode: this.mode,
      redisConfigured: Boolean(process.env.REDIS_URL),
      queue: QUEUE_NAME,
    };
  }

  async enqueue(sourceId: IngestSourceId) {
    if (this.mode === 'bullmq' && this.queue) {
      const job = await this.queue.add(
        'ingest',
        { sourceId },
        { removeOnComplete: 100, removeOnFail: 100 },
      );
      return { mode: this.mode, jobId: job.id, sourceId, status: 'queued' as const };
    }
    const run = await this.execute(sourceId);
    return { mode: this.mode, jobId: run.id, sourceId, status: run.status, run };
  }

  async enqueueAll() {
    const sources = this.store.listSources().map((s) => s.id);
    const results = [];
    for (const sourceId of sources) {
      results.push(await this.enqueue(sourceId));
    }
    return results;
  }

  private async execute(sourceId: IngestSourceId) {
    const wm = this.store.getWatermark(sourceId);
    if (!wm) throw new Error(`Unknown source ${sourceId}`);
    const run = this.store.startRun(sourceId);
    try {
      const result = await runAdapter(sourceId, wm);
      const status = result.skipped ? 'skipped' : 'succeeded';
      return this.store.finishRun(
        run,
        status,
        result.message,
        result.diff,
        result.fanout,
        result.fingerprint,
        result.skipped ? wm.robotsAllowed : true,
      );
    } catch (e) {
      return this.store.finishRun(
        run,
        'failed',
        (e as Error).message,
        { added: 0, updated: 0, removed: 0, unchanged: 0 },
        [],
      );
    }
  }
}
