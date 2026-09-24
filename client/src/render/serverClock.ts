/** Server timestamps advance using a monotonic client clock, never its wall clock. */
export class ServerClock {
  private sample: { serverTime: number; receivedAt: number } | undefined;

  observe(serverTime: number | undefined, receivedAt = performance.now()): void {
    if (serverTime !== undefined && Number.isFinite(serverTime)) {
      this.sample = { serverTime, receivedAt };
    }
  }

  now(localTime = performance.now()): number | undefined {
    return this.sample
      ? this.sample.serverTime + Math.max(0, localTime - this.sample.receivedAt)
      : undefined;
  }
}

export function attackCooldownFraction(now: number | undefined, lastAttackAt: number, duration: number): number {
  if (now === undefined || !Number.isFinite(lastAttackAt) || !Number.isFinite(duration)) return 0;
  return Math.max(0, Math.min(1, (now - lastAttackAt) / Math.max(1, duration)));
}
