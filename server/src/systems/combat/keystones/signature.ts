/**
 * TECHNIQUE — **Signature**. "A Technique that lands counts as your class
 * mechanic firing." (design §22)
 *
 * THE SEAM. `emitMechanicFired`, reached from `combat/techniqueResolved.ts` — the
 * one place every Technique shape's resolution passes through. Like Always First,
 * the rule touches no class root: it announces the moment, and everything hung
 * off `mechanic-fired` — the Empowered lane's own payoff cards, a capstone, a Rune
 * keyed to it, another lineage's cross row — answers exactly as it always does.
 * That is the whole reason the seam exists.
 *
 * WHAT IT DOES NOT DO. It never calls `setEmpoweredAttack`. Arming the flag would
 * hand the player the mechanic's DAMAGE multiplier on top of the Technique's own
 * rider — two multipliers for one swing, which design §6 forbids — and would also
 * desync the root's own counter (cadence would arm at a count it never reached).
 * The rule is "counts as the mechanic firing", and what the mechanic firing MEANS
 * to the rest of the game is this event, not the marker.
 *
 * ONCE PER CAST, WITH NO LATCH OF ITS OWN. A Technique already has a cooldown, and
 * `onTechniqueResolved` is called exactly once per resolution, so the rate is the
 * Technique's own rate and there is nothing here to limit. Where the resolution
 * rides an exchange, `emitMechanicFired` latches on that exchange, so a Technique
 * landing on the very hit that spent the root's own mechanic emits once rather
 * than twice — and the keystone draws nothing in that case, because the moment had
 * already happened and an effect claiming otherwise would be a lie on screen.
 *
 * WHICH RESOLUTIONS COUNT. Every one the seam reports, including a self-facing
 * instant like Frenzy. "Lands" is the seam's own word for "the Technique resolved
 * rather than merely armed" (an armed charge the fight never consumed resolves
 * never), and a Technique the player spent is a Technique the player spent. One
 * definition of landing, in one place, is worth more than a second opinion here.
 */
import type { PacketId } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import type { CombatContext } from '../engine/combatPipeline';
import { emitMechanicFired, mechanicAlreadyFired } from '../engine/mechanicFired';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'technique';

export const SIGNATURE_KEYSTONE = defineKeystone({
  id: 'signature',
  lane: LANE,
  seam: 'the Technique resolution seam emitting mechanicFired, once per cast',
  // No `register`: the rule is not a combat-pipeline listener but a call the
  // Technique seam makes, the same shape Festering and Unbroken use for theirs.
});

/**
 * A Technique resolved: announce the class mechanic. Returns true when it did, so
 * the caller never has to reason about the latch.
 *
 * Called from `onTechniqueResolved`, which is the only moment the rule has.
 */
export function signatureOnTechniqueResolved(
  world: World,
  player: PlayerEntity,
  site: { ctx?: CombatContext; target?: MonsterEntity } = {},
): boolean {
  if (!keystoneActive(player, LANE)) return false;
  // The root's own mechanic already fired on this exchange, so the moment has
  // happened and the keystone has nothing to announce.
  if (site.ctx && mechanicAlreadyFired(site.ctx)) return false;

  emitMechanicFired(world, player, site.ctx);
  pushKeystoneFx(world, player, LANE, site.target ? { target: site.target } : {});
  return true;
}
