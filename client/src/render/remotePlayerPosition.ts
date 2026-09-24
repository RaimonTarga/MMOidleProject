import type { Vec2 } from '@mmo-idle/shared';

export const REMOTE_PLAYER_DELAY_MS = 250;
type Sample = { at: number; pos: Vec2 };

/** A bounded snapshot path, rendered behind the stream. Never predicts toward
 * a movement intent or advances beyond the latest confirmed position. */
export class RemotePlayerPosition {
  private samples: Sample[] = [];
  private offset = 0;
  private receivedAt = 0;
  private nodeId = '';

  observe(nodeId: string, at: number, pos: Vec2, receivedAt: number): void {
    if (!Number.isFinite(at)) return;
    const last = this.samples.at(-1);
    if (!last || nodeId !== this.nodeId || at < last.at ||
      receivedAt - this.receivedAt > 1000 ||
      Math.hypot(pos.x - last.pos.x, pos.y - last.pos.y) > 240) {
      this.samples = [];
      this.offset = receivedAt - at;
    } else {
      // Least-delayed receipt anchors the clock; jitter does not restart motion.
      this.offset = Math.min(this.offset, receivedAt - at);
    }
    this.nodeId = nodeId;
    this.receivedAt = receivedAt;
    if (this.samples.at(-1)?.at === at) this.samples.pop();
    this.samples.push({ at, pos: { ...pos } });
    if (this.samples.length > 16) this.samples.shift();
  }

  position(localTime: number): Vec2 | undefined {
    if (!this.samples.length) return undefined;
    const origin = this.samples[0].at;
    const at = localTime - (this.offset + origin) - REMOTE_PLAYER_DELAY_MS;
    while (this.samples.length > 2 && this.samples[1].at - origin <= at) this.samples.shift();
    const first = this.samples[0];
    if (at <= first.at - origin) return { ...first.pos };
    for (let i = 1; i < this.samples.length; i++) {
      const next = this.samples[i];
      if (at <= next.at - origin) {
        const prev = this.samples[i - 1];
        const fraction = (at - (prev.at - origin)) / (next.at - prev.at);
        return {
          x: prev.pos.x + (next.pos.x - prev.pos.x) * fraction,
          y: prev.pos.y + (next.pos.y - prev.pos.y) * fraction,
        };
      }
    }
    return { ...this.samples.at(-1)!.pos };
  }
}
