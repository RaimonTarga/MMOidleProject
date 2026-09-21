import type { GameplayEvent, GameplayWriterHealth } from '@mmo-idle/shared';

/** Bounded, single-flight writer. IDs survive retries; the DB enforces idempotency. */
export class GameplayWriter {
  private queue: Array<{ event: GameplayEvent; enqueuedAt: number }> = [];
  private pending: Promise<void> | null = null;
  private draining: Promise<void> | null = null;
  private retryAt = 0;
  private failures = 0;
  private health: Omit<GameplayWriterHealth, 'queued'> = { inserted: 0, failedBatches: 0, dropped: 0, lastSuccessAt: null };
  constructor(
    private readonly insert: (events: GameplayEvent[]) => Promise<void>,
    private readonly now = Date.now,
    private readonly capacity = 10_000,
  ) {}
  enqueue(event: GameplayEvent): void {
    if (this.queue.length >= this.capacity) { this.health.dropped++; return; }
    this.queue.push({ event, enqueuedAt: this.now() });
  }
  status(): GameplayWriterHealth { return { ...this.health, queued: this.queue.length }; }
  flush(force = false): Promise<void> {
    if (this.pending) return this.pending;
    if (!force && this.now() < this.retryAt) return Promise.resolve();
    // Expiry only outside an in-flight write. Never evict rows underneath a write.
    const cutoff = this.now() - 10 * 60_000;
    const expired = this.queue.findIndex(row => row.enqueuedAt >= cutoff);
    const n = expired === -1 ? this.queue.length : expired;
    this.queue.splice(0, n);
    this.health.dropped += n;
    const batch = this.queue.slice(0, 100);
    if (!batch.length) return Promise.resolve();
    this.pending = Promise.resolve().then(() => this.insert(batch.map(row => row.event))).then(() => {
      this.queue.splice(0, batch.length);
      this.health.inserted += batch.length;
      this.health.lastSuccessAt = this.now();
      this.failures = 0;
      this.retryAt = 0;
    }).catch(() => {
      this.health.failedBatches++;
      this.failures++;
      this.retryAt = this.now() + Math.min(30_000, 1_000 * 2 ** Math.min(this.failures - 1, 5));
    }).finally(() => { this.pending = null; });
    return this.pending;
  }
  drain(force = false): Promise<void> {
    if (this.draining) return this.draining;
    this.draining = this.drainBatches(force).finally(() => { this.draining = null; });
    return this.draining;
  }
  private async drainBatches(force: boolean): Promise<void> {
    // Catch up in the background without capping throughput at 100 events/sec.
    // Bound ordinary work per timer turn; shutdown may drain the whole queue.
    for (let i = 0; this.queue.length && (force || i < 10); i++) {
      const failed = this.health.failedBatches;
      const queued = this.queue.length;
      await this.flush(force);
      if (failed !== this.health.failedBatches || this.queue.length >= queued) break;
    }
  }
}
