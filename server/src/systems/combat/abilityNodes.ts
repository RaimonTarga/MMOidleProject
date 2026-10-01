/**
 * The ability-node runtime (design §19).
 *
 * WHAT THIS IS. Eleven lines of dispatch and no combat code at all. A node fires
 * the chosen packet's payoff through `fireLineagePayoffs` — the lineage card
 * dispatcher — so every rule that runtime already enforces holds here without
 * being restated: the evade early-return on on-target payoffs, the max-wins
 * shared debuff records, `hitBasis`'s one-multiplier-per-hit basis, the
 * amplified second body, and exactly ONE `card-fx` per application that
 * actually did something.
 *
 * THE TWO MOMENTS. A Technique node fires when the Technique LANDS, a Guard node
 * when the Guard CASTS. "Lands" is deliberately not "activates": an armed
 * Technique activates when it arms, which can be a swing before it touches
 * anything, and a node that paid out on arming would pay out on a charge the
 * fight never consumed. So the hook sits at each shape's own resolution:
 *
 *   armed / charge / formation   `applyTechniqueRider`  (rides the landed hit)
 *   cast                         `resolveCastPayload`   (the payload resolved)
 *   self-cast                    `resolveSelfCastPayload`
 *   instant                      `applyInstantTechnique`
 *   reposition                   the reposition branch of `maybeFireTechnique`
 *   every Guard                  `onGuardFired`         (the one Guard seam)
 *
 * ONCE PER LANDING. Each of those is called once per resolution, so the node
 * fires once per resolution. The one shape that could double is `armed`, whose
 * rider and whose formation delivery are separate branches of one `onHit` —
 * both of which end in `applyTechniqueRider`, which is why the hook is there and
 * not in the listener around it.
 */
import {
  getAbilityNodeRuntime,
  resolveActiveAbilityNodes,
  setAbilityNodeRuntime,
  abilityNodeFx,
  type AbilityDef,
  type AbilityNodeRuntime,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import type { CombatContext } from './engine/combatPipeline';
import { fireLineagePayoffs, type ExternalLineagePayoff } from './lineageCards';

/**
 * Re-resolve the player's ability nodes. Called from
 * `recalculatePlayerEntityStats` alongside `refreshLineageRuntime`, which is the
 * one place the input (`tracksProgression.abilityNodes`) can change.
 */
export function refreshAbilityNodeRuntime(player: PlayerEntity): void {
  const firings = resolveActiveAbilityNodes(player.tracksProgression.abilityNodes);
  const runtime: AbilityNodeRuntime = {};
  for (const [abilityId, firing] of firings) {
    runtime[abilityId] = { option: firing.option, payoff: firing.payoff };
  }
  setAbilityNodeRuntime(player.tracksCombat, runtime);
}

/**
 * The payoff this ability's active node pays, as the dispatcher wants it, or
 * null when the player has bought no node for it.
 *
 * A node with no declared fx is refused rather than drawn with someone else's
 * grammar: design §8's "one thing you can see" is a contract, and a silent
 * payoff would be the worst of both.
 */
function payoffFor(player: PlayerEntity, abilityId: string): ExternalLineagePayoff | null {
  const runtime = getAbilityNodeRuntime(player.tracksCombat);
  const firing = runtime?.[abilityId];
  if (!firing) return null;
  const fx = abilityNodeFx(firing.option.lane, firing.payoff.kind);
  if (!fx) return null;
  // The payoff is cloned because the dispatcher mutates what it is handed (a
  // bleed rewrites `damagePerTick`, plating-stack stamps `perStackFraction`),
  // and the cache must survive the fight unchanged.
  return { key: firing.option.id, fx, payoff: { ...firing.payoff } };
}

/**
 * A Technique resolved. Fires its node's payoff, on the exchange when there was
 * one so the payoff's share is taken off the hit that carried it.
 */
export function onAbilityNodeTechniqueLanded(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity } = {},
): void {
  if (ability.slot !== 'technique') return;
  const payoff = payoffFor(player, ability.id);
  if (!payoff) return;
  fireLineagePayoffs(world, player, [payoff], site);
}

/**
 * A Guard cast. No exchange to ride, so the payoff's basis is the player's own
 * Attack — which is what the magnitude table's flat column is seeded against —
 * and the target, if a defensive payoff needed one, is the live attack target.
 */
export function onAbilityNodeGuardCast(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  if (ability.slot !== 'guard') return;
  const payoff = payoffFor(player, ability.id);
  if (!payoff) return;
  fireLineagePayoffs(world, player, [payoff]);
}
