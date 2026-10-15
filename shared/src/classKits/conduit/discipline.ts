/**
 * The Conduit's disciplines as numbers (bible §7.5): what each one does to a summon's Command
 * cost and to its stats. Pure, so the config check, the Formation view and the server runtime
 * read one answer. Every number is a PLACEHOLDER the bots and playtests tune; the Elite stat
 * step and the Pack Strike timer are the bible's starting points.
 */

export type ConduitDisciplineId = 'conduit-swarm' | 'conduit-pack' | 'conduit-elite';

export const CONDUIT_DISCIPLINE_TUNING = {
  /** Elite (§7.5): +50% HP and +25% damage on every summon, on top of its extra. */
  eliteHpMult: 1.5,
  eliteDamageMult: 1.25,
  /** Elite's extra, per family (the bible leaves its granularity open; per family is the simplest reading). */
  eliteSplashRadius: 90,
  eliteSplashShare: 0.4,
  /** Elite supports: their job (heal, acid, bark) is this much stronger. */
  eliteSupportMult: 1.5,
  /** Pack (§7.5): every different type strikes the focus target together this often. */
  packStrikeEveryMs: 8_000,
} as const;

/**
 * One summon's Command under a discipline (§7.5).
 * Swarm: a 1-cost summon costs half. Pack: a type the formation doesn't have yet costs 1 less,
 * never below 1. Elite: every summon costs 1 more. `firstOfType` is whether no earlier body of the
 * same type is in the roster.
 */
export function disciplineCommandCost(base: number, disciplineId: string | null | undefined, firstOfType: boolean): number {
  if (base <= 0) return base;
  switch (disciplineId) {
    case 'conduit-swarm': return base === 1 ? 0.5 : base;
    case 'conduit-pack': return firstOfType ? Math.max(1, base - 1) : base;
    case 'conduit-elite': return base + 1;
    default: return base;
  }
}
