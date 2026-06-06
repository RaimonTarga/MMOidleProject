import {
  registerCombatListener,
  unregisterCombatListener,
  type CombatEventHandler,
  type CombatEventName,
} from '../../src/systems/combat/engine/combatPipeline';

/**
 * Aggregates combat metrics for one or more tracked players. For a solo boss run
 * this is a single bot; for an overlord run it sums across the whole party and
 * records which members died.
 */
export class BalanceMetricsCollector {
  damageDealt = 0;
  damageTaken = 0;

  private readonly ids: Set<string>;
  private readonly deaths = new Set<string>();
  private handlers: Array<{ event: CombatEventName; fn: CombatEventHandler }> =
    [];

  constructor(botIds: string | string[]) {
    this.ids = new Set(Array.isArray(botIds) ? botIds : [botIds]);
  }

  /** True if any tracked player has been killed (solo: the bot died). */
  get botKilled(): boolean {
    return this.deaths.size > 0;
  }

  /** Number of tracked players killed so far. */
  get deathCount(): number {
    return this.deaths.size;
  }

  /** True once every tracked player has died (a full party wipe). */
  get allDead(): boolean {
    return this.deaths.size >= this.ids.size;
  }

  register(): void {
    const onHit: CombatEventHandler = (ctx) => {
      if (
        ctx.attackerType === 'player' &&
        this.ids.has(ctx.attacker.isPlayer.id) &&
        ctx.defenderType === 'monster'
      ) {
        this.damageDealt += ctx.damage;
      }
    };

    const onDamageTaken: CombatEventHandler = (ctx) => {
      if (
        ctx.defenderType === 'player' &&
        this.ids.has(ctx.defender.isPlayer.id)
      ) {
        this.damageTaken += ctx.damage;
      }
    };

    const onKill: CombatEventHandler = (ctx) => {
      if (
        ctx.defenderType === 'player' &&
        this.ids.has(ctx.defender.isPlayer.id)
      ) {
        this.deaths.add(ctx.defender.isPlayer.id);
      }
    };

    for (const [event, fn] of [
      ['onHit', onHit],
      ['onDamageTaken', onDamageTaken],
      ['onKill', onKill],
    ] as const) {
      registerCombatListener(event, fn);
      this.handlers.push({ event, fn });
    }
  }

  dispose(): void {
    for (const { event, fn } of this.handlers) {
      unregisterCombatListener(event, fn);
    }
    this.handlers = [];
  }
}
