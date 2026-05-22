export type LogKind =
  | 'damage-out'  // player hit a monster
  | 'damage-in'   // player took damage
  | 'heal'        // player recovered HP
  | 'shield'      // player gained shield HP
  | 'kill'        // player's target was defeated
  | 'death'       // player died
  | 'empowered'   // empowered / finisher fired
  | 'execution'   // execution strike fired
  | 'info';       // generic message

export interface LogEntry {
  id:   number;
  time: number;   // Date.now()
  kind: LogKind;
  text: string;
}

const MAX_ENTRIES = 500;

class CombatLogStore {
  private entries: LogEntry[] = [];
  private subs    = new Set<(entries: LogEntry[]) => void>();
  private seq     = 0;

  push(kind: LogKind, text: string): void {
    this.entries.push({ id: this.seq++, time: Date.now(), kind, text });
    if (this.entries.length > MAX_ENTRIES) this.entries.shift();
    this.notify();
  }

  subscribe(fn: (entries: LogEntry[]) => void): () => void {
    this.subs.add(fn);
    fn([...this.entries]);
    return () => this.subs.delete(fn);
  }

  private notify(): void {
    const snap = [...this.entries];
    for (const fn of this.subs) fn(snap);
  }
}

export const combatLog = new CombatLogStore();
