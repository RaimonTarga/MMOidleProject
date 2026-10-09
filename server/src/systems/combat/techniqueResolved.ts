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
import { onAbilityKeystoneResolved, signatureOnTechniqueResolved } from './keystones';
import { consumeTechniqueWindow, onLineageTechniqueCast } from './lineageCards';
import { destroyerOnTechniqueResolved } from '../classes/archetypes/cooldown/t3/pipeline/destroyer';

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
 *  2. **The ability node's payoff** (design §19), then **the ability's keystone
 *     verb** (design §22.4) — the ability's own rows, before anything a lineage
 *     hangs off the moment. A verb runs once per resolution, which is what makes a
 *     Reload clip's keystone first-hit-only and a Conduit cast's once per cast.
 *  3. **The `technique-cast` lineage cards** (design §22). After the window is
 *     spent, so a card that OPENS a window does not have it eaten by the same
 *     cast that opened it.
 *  4. **The Squire's Destroyer** (design §22.5) — a cast delivers the primed
 *     execution to its target or area. (An armed shape already carried it on its
 *     own hit, decided before the root's multiplier: `t3/pipeline/destroyer.ts`.)
 *     After the Technique's own payoffs, like the Signature keystone, because the
 *     execution announces `mechanic-fired` too.
 *  5. **The Signature keystone** (design §22) — this Technique counts as the class
 *     mechanic firing. Last, because `mechanic-fired` is a louder event than any
 *     one lane: it fires every `mechanic-fired` card the player owns, on any
 *     lineage, and it must see the Technique's own payoffs already applied rather
 *     than racing them. Skipped when the Destroyer just delivered the execution on
 *     this cast: the one execution fires once and counts once.
 *
 * `now` is the tick's clock, passed by a resolution that may land an attack of
 * its own (the cast loop's, for the Destroyer's delivery).
 *
 * `departedFrom` is the body a backward reposition broke from (Disengage's
 * threat). It is NOT a `target`: nothing was struck, so the Destroyer must not
 * deliver an execution to it and a `technique-cast` card keeps its own read. Only
 * the ability node reads it, for "on the body you broke from" (design §22.10).
 */
export function onTechniqueResolved(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity; now?: number; departedFrom?: MonsterEntity } = {},
): void {
  if (ability.slot !== 'technique') return;
  if (site.ctx) consumeTechniqueWindow(player, site.ctx);
  onAbilityNodeTechniqueLanded(world, player, ability, site);
  onAbilityKeystoneResolved(world, player, ability, site);
  onLineageTechniqueCast(world, player, { ...site, abilityId: ability.id });
  const delivered = destroyerOnTechniqueResolved(world, player, ability, site);
  if (!delivered) signatureOnTechniqueResolved(world, player, site);
}
