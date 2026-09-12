/** A bounded presentation clock. No timers, Phaser objects, or gameplay state. */
export const COMBAT_PLAYBACK_DELAY_MS = 250;
export const COMBAT_PLAYBACK_CAPACITY = 512;
const STALE_MS = 120;
const RESET_GAP_MS = 750;

interface Entry<T> { at: number; value: T; dispose?: () => void }

export class CombatPlaybackClock<T> {
  private entries: Entry<T>[] = [];
  private head = 0;
  private offset: number | undefined;
  private lastReceive: number | undefined;
  private lastServerTime: number | undefined;
  private lastSequence = -1;
  private nodeId: string | undefined;

  get size(): number { return this.entries.length - this.head; }

  latestTime(matches: (value: T) => boolean): number | undefined {
    for (let i = this.entries.length - 1; i >= this.head; i--) {
      if (matches(this.entries[i].value)) return this.entries[i].at;
    }
    return undefined;
  }

  reset(): void {
    for (let i = this.head; i < this.entries.length; i++) this.entries[i].dispose?.();
    this.entries = [];
    this.head = 0;
    this.offset = this.lastReceive = this.lastServerTime = undefined;
    this.lastSequence = -1;
    this.nodeId = undefined;
  }

  /** Lowest observed transit time anchors playback; packet jitter never restarts it. */
  observe(nodeId: string, serverTime: number, localTime: number): void {
    if (
      this.nodeId !== nodeId ||
      (this.lastReceive !== undefined && localTime - this.lastReceive > RESET_GAP_MS) ||
      (this.lastServerTime !== undefined && serverTime < this.lastServerTime)
    ) this.reset();
    const sample = localTime - serverTime;
    this.offset = this.offset === undefined ? sample : Math.min(this.offset, sample);
    this.nodeId = nodeId;
    this.lastReceive = localTime;
    this.lastServerTime = serverTime;
  }

  /** Call for every timed event, including ones whose presentation stays immediate. */
  acceptSequence(seq: number): boolean {
    if (!Number.isSafeInteger(seq) || seq <= this.lastSequence) return false;
    this.lastSequence = seq;
    return true;
  }

  enqueue(at: number, value: T, dispose?: () => void): boolean {
    if (this.offset === undefined || !Number.isFinite(at) || this.size >= COMBAT_PLAYBACK_CAPACITY) {
      dispose?.();
      return false;
    }
    // Normally append-only. Deferred death can precede a later-arriving attack,
    // so insert stably by time; the hard capacity bounds this uncommon shift.
    const entry = { at, value, dispose };
    let index = this.entries.length;
    while (index > this.head && this.entries[index - 1].at > at) index--;
    this.entries.splice(index, 0, entry);
    return true;
  }

  drain(localTime: number): T[] {
    const ready: T[] = [];
    if (this.offset === undefined) return ready;
    const playhead = localTime - this.offset - COMBAT_PLAYBACK_DELAY_MS;
    while (this.head < this.entries.length && this.entries[this.head].at <= playhead) {
      const entry = this.entries[this.head++];
      if (playhead - entry.at > STALE_MS) entry.dispose?.();
      else ready.push(entry.value);
    }
    if (this.head === this.entries.length) {
      this.entries = [];
      this.head = 0;
    } else if (this.head >= COMBAT_PLAYBACK_CAPACITY) {
      this.entries = this.entries.slice(this.head);
      this.head = 0;
    }
    return ready;
  }
}
