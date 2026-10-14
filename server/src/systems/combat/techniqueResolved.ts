/**
 * The ONE seam a Technique's resolution passes through (design §22).
 *
 * WHY IT EXISTS. Each of the five Technique shapes resolves in its own place, so
 * without it every consumer of "a Technique just resolved" would mean finding all
 * five call sites again and risking half a wiring:
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
 * NEVER A GUARD. A Guard has its own seam (`onGuardFired`). `ability.slot` is
 * checked once, here, so an offensive payoff can never be fired by a defensive
 * cast — design-bible §1's separated budgets, enforced in one place.
 */
import type { AbilityDef, Vec2 } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import type { CombatContext } from './engine/combatPipeline';
import { destroyerOnTechniqueResolved } from '../classes/archetypes/cooldown/t3/pipeline/destroyer';

/**
 * A Technique resolved. Today one thing hangs off that moment: **the Squire's
 * Destroyer** (design §22.5) — a cast delivers the primed execution to its target
 * or area. (An armed shape already carried it on its own hit, decided before the
 * root's multiplier: `t3/pipeline/destroyer.ts`.)
 *
 * `now` is the tick's clock, passed by a resolution that may land an attack of
 * its own (the cast loop's, for the Destroyer's delivery).
 *
 * `departedFrom` is the body a backward reposition broke from (Disengage's
 * threat). It is NOT a `target`: nothing was struck, so the Destroyer must not
 * deliver an execution to it.
 */
export function onTechniqueResolved(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: {
    ctx?: CombatContext;
    target?: MonsterEntity;
    now?: number;
    /** A Conduit cast's physical caster. */
    casterMinionId?: string;
    /** A reposition's departure point. */
    from?: Vec2;
    /** A cast's target's health share before its payload landed. */
    targetHealthShare?: number;
    /** The body a backward reposition broke from (see above). */
    departedFrom?: MonsterEntity;
  } = {},
): void {
  if (ability.slot !== 'technique') return;
  destroyerOnTechniqueResolved(world, player, ability, site);
}
