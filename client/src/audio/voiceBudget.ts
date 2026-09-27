/** Shared budget across all sources; priority cues can displace routine attacks. */
export class VoiceBudget {
  private voices: { key: object; priority: number; stop: () => void }[] = [];
  private last = new Map<object, number>();
  constructor(private capacity = 12) {}
  acquire(key: object, now: number, cooldown: number, maxVoices: number, priority: number, stop: () => void): (() => void) | undefined {
    if (now - (this.last.get(key) ?? -Infinity) < cooldown) return undefined;
    if (this.voices.filter(v => v.key === key).length >= maxVoices) return undefined;
    if (this.voices.length >= this.capacity) {
      const victim = this.voices.find(v => v.priority < priority);
      if (!victim) return undefined;
      this.voices.splice(this.voices.indexOf(victim), 1);
      victim.stop();
    }
    const voice = { key, priority, stop };
    this.voices.push(voice);
    this.last.set(key, now);
    return () => { this.voices = this.voices.filter(v => v !== voice); };
  }
  clear(): void {
    const old = this.voices;
    this.voices = [];
    this.last.clear();
    for (const voice of old) voice.stop();
  }
}
