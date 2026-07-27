import { GAME_CONFIG, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { mutateSlice } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import type { CombatContext } from '../../combat/engine/combatPipeline';

/**
 * Deterministic evasion (NO RNG). `evadesHits.charge` sums the player's per-hit
 * `dodgeRate`; when it crosses 1.0 the hit is evaded and 1.0 is subtracted.
 * Given the same hit sequence the outcome is always identical and fully
 * replayable.
 *
 * The accumulator lives on the networked slice rather than in `tracksCombat`,
 * so the HUD can show the charge building toward the next guaranteed dodge.
 * Every write goes through `mutateSlice`, which marks the slice dirty for the
 * next broadcast.
 *
 * Two listeners cover the player-as-defender (monster → player) path:
 *   - onAttack: decides whether this hit is evaded and records the decision in
 *     ctx.metadata BEFORE onHit/afterHit, so debuff appliers can suppress.
 *   - onDamageTaken: reduces ctx.damage by the evade-mitigation fraction
 *     (1.0 ⇒ damage 0, the legacy full-avoid behavior).
 *
 * The monster-as-defender (player → monster, monster `evasion` fraction) path is
 * handled inline in combat.ts; it shares {@link evadeBlocksDebuffs} for debuff gating.
 */
export function registerEvasion(): void {
  // ── Evade decision (player defender) ───────────────────────────────────────
  registerCombatListener('onAttack', (ctx, world) => {
    if (ctx.defenderType !== 'player' || ctx.attackerType !== 'monster') return;
    const player = ctx.defender;
    if (!player.evadesHits || player.evadesHits.dodgeRate <= 0) return;

    const acc = player.evadesHits.charge + player.evadesHits.dodgeRate;
    if (acc >= 1) {
      mutateSlice(world, player, 'evadesHits', (slice) => { slice.charge = acc - 1; });
      ctx.metadata['evaded'] = true;
      ctx.metadata['evadeMitigation'] = player.evadesHits.evadeMitigation;
      // The attacking monster's debuffs/DoT are suppressed unless it pierces evade.
      const def = MONSTER_DATABASE.get(ctx.attacker.isMonster.monsterTypeId);
      if (!def?.appliesThroughEvade) ctx.metadata['evadeBlocksDebuffs'] = true;
    } else {
      mutateSlice(world, player, 'evadesHits', (slice) => { slice.charge = acc; });
    }
  });

  // ── Evade mitigation (player defender) — runs first in onDamageTaken ────────
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (!ctx.metadata['evaded']) return;
    const mit = typeof ctx.metadata['evadeMitigation'] === 'number'
      ? (ctx.metadata['evadeMitigation'] as number)
      : GAME_CONFIG.EVADE_MITIGATION_BASE;
    // Full mitigation fully avoids the hit (→ "DODGE" floater client-side); a
    // partial evade restyles the reduced damage number and raises its own
    // "GRAZE" floater. Flag which one for the monster-attack path to translate
    // into the right client event.
    ctx.metadata['evadeFull'] = mit >= 1;
    ctx.damage = Math.max(0, Math.round(ctx.damage * (1 - mit)));
  });
}

/**
 * True when the current attack was evaded AND the source does not pierce evade.
 * Debuff/DoT/status appliers call this and early-return to suppress on a dodge.
 */
export function evadeBlocksDebuffs(ctx: CombatContext): boolean {
  return ctx.metadata['evadeBlocksDebuffs'] === true;
}

/**
 * Reset a player's deterministic dodge accumulator to the out-of-combat baseline.
 * Called each tick while the player is out of combat. The reset value is a single
 * balance lever (`GAME_CONFIG.EVADE_OOC_RESET`) — raise it toward 1.0 to preload
 * a guaranteed dodge on the first hit of an engagement.
 *
 * No-ops when the charge already sits at the baseline. Without that guard this
 * would mark the slice dirty on every tick for every out-of-combat player, and
 * broadcast an unchanged value at 5 Hz forever.
 */
export function resetEvadeAccumulator(world: World, player: PlayerEntity): void {
  if (!player.evadesHits) return;
  if (player.evadesHits.charge === GAME_CONFIG.EVADE_OOC_RESET) return;
  mutateSlice(world, player, 'evadesHits', (slice) => {
    slice.charge = GAME_CONFIG.EVADE_OOC_RESET;
  });
}
