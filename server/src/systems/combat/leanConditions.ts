/**
 * The leans that SEED their lane's condition (design §24.9).
 *
 * "A lane's lean is its POTENCY stat, and for the two conditional lanes that stat
 * is the condition's source." Two moments look for a state on the target — the
 * Affliction moment for an affliction, the Control moment for a hold — and before
 * this no T1 kit supplied either for five classes of six, so those verbs never
 * fired (course-correction report, "Verbs that do not fire at T1"). The lean of the
 * lane now puts its condition on every landed hit, for every class:
 *
 *   Affliction lean  that share of the hit (as it was before any empowered
 *                    multiplier — one multiplier per hit) is ADDED to a light
 *                    lineage bleed over `LEAN_CONDITION_NUMBERS.affliction`.
 *   Control lean     the target is slowed by that fraction, through
 *                    `applyMonsterSlow` (max-wins: never weakens or shortens a
 *                    stronger slow), for `LEAN_CONDITION_NUMBERS.control` or one of
 *                    the wielder's own swings and a beat, whichever is longer — a
 *                    Heavy Hammer swings slower than the authored 1.5 s.
 *
 * A slow is the ladder's bottom rung and enters a monster the way every other
 * slow does (Hamstring, the at-bay slow): control immunity refuses the ROOT and
 * the STUN the Control payloads apply (`applyMonsterRoot`, `applyStun` and the
 * stun ladder), not a slow.
 *
 * WHY HERE AND NOT A CARD. A lean is a stat row, not a triggered card: it folds
 * into the stat rebuild like any item stat (`stats.ts` writes the passive), so it
 * is live whenever the form is worn — collapsed bands included — and the card
 * runtime never sees it. This listener reads the passive and nothing else.
 *
 * The rules every on-hit applier keeps: a blocking evade applies nothing
 * (`evadeBlocksDebuffs`), and a target an earlier `onHit` proc already killed is
 * left alone. A chaotic miss DOES seed, like every on-hit ailment on the dead
 * swing (`weapon.dead-swing-interval`: "deals 0 damage but still applies on-hit
 * effects").
 */
import {
  LEAN_CONDITION_NUMBERS,
  getStatusEffect,
  lineageUnit,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { attachMarker } from '../../ecs/markerHelpers';
import { registerCombatListener } from './engine/combatPipeline';
import { applyPlayerDebuff } from '../classes/shared/applyPlayerDebuff';
import { evadeBlocksDebuffs } from '../defense/mitigation/evasion';
import { LEAN_BLEED_ID } from './damage/bleedIds';
import { hitBasis } from './lineageCards';
import { applyMonsterSlow } from './status/monsterControl';

/**
 * How long one hit's lean slow holds: the authored window, or the wielder's own
 * swing interval plus the bridge, whichever is longer — so the slow one swing lays
 * down is still on the target when the next swing lands, whatever the weapon.
 */
export function leanSlowMs(player: PlayerEntity): number {
  const numbers = LEAN_CONDITION_NUMBERS.control;
  const authored = numbers?.durationMs ?? 0;
  const bridged = player.performsAttack.attackCooldown + (numbers?.swingBridgeMs ?? 0);
  return Math.max(authored, bridged);
}

/**
 * ADD `amount` to the lean's light bleed on `target`, spread over at least one
 * application's ticks.
 *
 * A reservoir, never a refresh: what the bleed still owes is kept and the new
 * share joins it, re-spread over the longer of what it had left and one
 * application's window. So a stream of hits delivers exactly its shares (a refresh
 * would deliver one tick's worth per hit and drop the rest), and the bleed drains
 * one window after the last hit. The tick clock is left running: re-arming it on
 * every hit would postpone the tick forever under a fast weapon. The per-tick
 * value is kept fractional; the tick driver rounds what it deals.
 */
function addLeanBleed(world: World, player: PlayerEntity, target: MonsterEntity, amount: number): void {
  if (!(amount > 0)) return;
  const tickMs = lineageUnit('bleedTickMs');
  const windowMs = LEAN_CONDITION_NUMBERS.affliction?.durationMs ?? tickMs;
  const windowTicks = Math.max(1, Math.round(windowMs / tickMs));
  const prior = getStatusEffect(target.tracksCombat, LEAN_BLEED_ID);
  const priorTicks = prior ? Math.max(0, prior.stacks) : 0;
  const priorOwed = priorTicks * Math.max(0, prior?.data.damagePerTick ?? 0);
  const ticks = Math.max(windowTicks, priorTicks);
  const perTick = (priorOwed + amount) / ticks;
  const bleed = applyPlayerDebuff(player, target.tracksCombat, {
    id: LEAN_BLEED_ID,
    instanced: false,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { damagePerTick: perTick, nextTickIn: tickMs, tickIntervalMs: tickMs, bleedMode: 0 },
  });
  bleed.data.damagePerTick = perTick;
  bleed.data.tickIntervalMs = tickMs;
  bleed.data.bleedMode = 0;
  if (!(bleed.data.nextTickIn > 0)) bleed.data.nextTickIn = tickMs;
  bleed.stacks = ticks;
  attachMarker(world, target, 'hasHemorrhage');
}

/**
 * Register the lean-condition listener. Called from `initCombatSystems()` right
 * after the card runtime, so the class mechanics have already recorded the hit's
 * empowered multiplier (`hitBasis` divides it out) — and so the live server and
 * the benches see one rule.
 */
export function registerLeanConditions(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    const bleedShare = player.usesSkills.passives['shared.bleed-on-hit-pct'] ?? 0;
    const slowPct = player.usesSkills.passives['shared.slow-on-hit-pct'] ?? 0;
    if (bleedShare <= 0 && slowPct <= 0) return;
    if (evadeBlocksDebuffs(ctx)) return;
    const target = ctx.defender;
    if (target.hasHealth.hp <= 0 || !world.hasMonster(target.isMonster.id)) return;
    if (bleedShare > 0) addLeanBleed(world, player, target, hitBasis(player, ctx) * bleedShare);
    if (slowPct > 0) applyMonsterSlow(world, target, slowPct, leanSlowMs(player), player.isPlayer.id);
  });
}
