/**
 * The ONE seam a Technique's resolution passes through (design §22).
 *
 * WHY IT EXISTS. Three different things now answer "a Technique just resolved":
 * the ability node (design §19), the Technique packet's `technique-cast` trigger,
 * and — once the T3 band is bought — the Signature keystone. Each of the five
 * Technique shapes resolves in its own place, so before this every new consumer
 * meant finding all five call sites again and risking half a wiring:
 *
 *   armed / charge / formation   `applyTechniqueRider`  (rides the landed hit)
 *   cast                         `resolveCastPayload`   (the payload resolved)
 *   self-cast                    `resolveSelfCastPayload`
 *   instant                      `applyInstantTechnique`
 *   reposition                   the reposition branch of `maybeFireTechnique`
 *
 * Each of those calls {@link onTechniqueResolved} exactly once per resolution, so
 * a sixth consumer is one line here rather than five edits out there.
 *
 * "RESOLVED", NOT "ACTIVATED". An armed Technique activates when it arms, which
 * can be a swing before it touches anything, and paying out on arming would pay
 * for a charge the fight never consumed. So every call site sits at its shape's
 * own resolution — which is also why the `armed` family hooks
 * `applyTechniqueRider` rather than the `onHit` listener around it: its plain
 * rider and its formation delivery are separate branches that both end there.
 *
 * NEVER A GUARD. A Guard has its own seam (`onGuardFired` → `onLineageGuardCast`)
 * and its own trigger kind. `ability.slot` is checked once, here, so an offensive
 * lane can never be fired by a defensive cast — design-bible §1's separated
 * budgets, enforced in one place instead of three.
 */
import type { AbilityDef } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import type { CombatContext } from './engine/combatPipeline';
import { onAbilityNodeTechniqueLanded } from './abilityNodes';
import { consumeTechniqueWindow, onLineageTechniqueCast } from './lineageCards';

/**
 * A Technique resolved. Fires everything hung off that moment, in the one order
 * that is correct:
 *
 *  1. **Spend a live `technique-window`** on the hit that is landing, if this
 *     resolution rides an exchange. First, because the window exists to empower
 *     THIS Technique, and because the rider's own multiplier recovers its basis by
 *     dividing by `empoweredMultiplier` — so the fold has to be in place before
 *     the rider reads it, or the two would compound (design §6, one multiplier
 *     per hit).
 *  2. **The ability node's payoff** (design §19).
 *  3. **The `technique-cast` lineage cards** (design §22). After the window is
 *     spent, so a card that OPENS a window does not have it eaten by the same
 *     cast that opened it.
 */
export function onTechniqueResolved(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity } = {},
): void {
  if (ability.slot !== 'technique') return;
  if (site.ctx) consumeTechniqueWindow(player, site.ctx);
  onAbilityNodeTechniqueLanded(world, player, ability, site);
  onLineageTechniqueCast(world, player, site);
}
