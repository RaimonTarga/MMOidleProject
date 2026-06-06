import type {
  DamageMitigationBreakdown,
  HeadlinePart,
  WorldLogDamageType,
  WorldLogDisplayKind,
} from '@mmo-idle/shared';

export type LogKind =
  | WorldLogDisplayKind
  | 'empowered'
  | 'execution';

export interface LogEntry {
  id: number;
  time: number;
  kind: LogKind;
  text: string;
  headline?: string;
  headlineParts?: HeadlinePart[];
  detail?: string;
  damageType?: WorldLogDamageType;
  targetName?: string;
  sourceName?: string;
  mitigation?: DamageMitigationBreakdown;
  glancing?: boolean;
}

const MAX_ENTRIES = 500;

export interface LogPushOpts {
  headline?: string;
  headlineParts?: HeadlinePart[];
  detail?: string;
  damageType?: WorldLogDamageType;
  targetName?: string;
  sourceName?: string;
  mitigation?: DamageMitigationBreakdown;
  glancing?: boolean;
}

class CombatLogStore {
  private entries: LogEntry[] = [];
  private subs = new Set<(entries: LogEntry[]) => void>();
  private seq = 0;

  push(kind: LogKind, text: string, opts?: LogPushOpts): void {
    this.entries.push({
      id: this.seq++,
      time: Date.now(),
      kind,
      text,
      headline: opts?.headline,
      headlineParts: opts?.headlineParts,
      detail: opts?.detail,
      damageType: opts?.damageType,
      targetName: opts?.targetName,
      sourceName: opts?.sourceName,
      mitigation: opts?.mitigation,
      glancing: opts?.glancing,
    });
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
