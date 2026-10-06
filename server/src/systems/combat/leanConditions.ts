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
 *                    multiplier — one multiplier per hit) is ADDED to the one
 *                    lineage bleed, `lineage.bleed`, over
 *                    `LEAN_CONDITION_NUMBERS.affliction`. On a weapon that owns a
 *                    reservoir there is no share to add (design §26.2): the stat
 *                    fold turned the lean into the reservoir's potency instead,
 *                    and the reservoir already afflicts every hit it converts.
 *   Control lean     the target is "Hobbled" (`lineage.hobbled`) by that fraction,
 *                    through `applyMonsterSlow` (max-wins: never weakens or
 *                    shortens a stronger Hobbled), for
 *                    `LEAN_CONDITION_NUMBERS.control` or one of the wielder's own
 *                    swings and a beat, whichever is longer — a Heavy Hammer swings
 *                    slower than the authored 1.5 s. Its own id rather than
 *                    Hamstring's, so the target frame names the card's slow and not
 *                    an ability the player may not have; the reconciler takes the
 *                    strongest slow across both ids, as it always took the
 *                    strongest across sources.
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
  LINEAGE_SLOW_STATUS_ID,
  VERB_SEED_SLOW_PCT,
  getLineageRuntime,
  lineageUnit,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../ecs/entity';
import { registerCombatListener } from './engine/combatPipeline';
import { evadeBlocksDebuffs } from '../defense/mitigation/evasion';
import { addLineageAffliction } from './damage/lineageAffliction';
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
    // A fixed verb that seeds its own hold (design §26.5: the Hammer's Easy
    // Prey) lays the light slow under every lean; the Effect lean's deeper slow
    // wins where both apply (max-wins). This runs AFTER the card runtime's
    // `hit-held` check, so this hit's seed counts for the next swing, not itself.
    const verbSeeds = getLineageRuntime(player.tracksCombat)?.cards
      .some((c) => c.card.row === 'payoff' && c.card.seeds === 'slow') === true;
    const slowPct = Math.max(
      player.usesSkills.passives['shared.slow-on-hit-pct'] ?? 0,
      verbSeeds ? VERB_SEED_SLOW_PCT : 0,
    );
    if (bleedShare <= 0 && slowPct <= 0) return;
    if (evadeBlocksDebuffs(ctx)) return;
    const target = ctx.defender;
    if (target.hasHealth.hp <= 0 || !world.hasMonster(target.isMonster.id)) return;
    if (bleedShare > 0) {
      const windowMs = LEAN_CONDITION_NUMBERS.affliction?.durationMs ?? lineageUnit('bleedTickMs');
      addLineageAffliction(world, player, target, hitBasis(player, ctx) * bleedShare, windowMs);
    }
    if (slowPct > 0) {
      applyMonsterSlow(world, target, slowPct, leanSlowMs(player), player.isPlayer.id, LINEAGE_SLOW_STATUS_ID);
    }
  });
}
