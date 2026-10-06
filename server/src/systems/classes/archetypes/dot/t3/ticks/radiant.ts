import {
  lineageUnit,
  relicRatingsFromPassives,
  resolveDotClassProfile,
  resolveDotRelicDeliveryProfile,
  resolveDotStackCap,
  type StatusEffect,
} from '@mmo-idle/shared';
import { playerAoeTargets } from '../../../../../combat/damage/aoeDamage';
import { dotElementForSource, pushDotTickEvent } from '../../../../../combat/damage/dotTickEvent';
import { renewPackPursuit } from '../../../../../combat/ai/targeting';
import { buildSimpleBreakdown, recordMonsterDamagedByPlayer } from '../../../../../../world/worldLogCombat';
import { actorFromSourceId } from '../../../../../../world/worldLogActors';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { classDotTickDamage } from '../../tickDamage';

/** World-log tag on every Radiant strike, so a damage breakdown can tell it from the burn's own tick. */
export const RADIANT_TAG = 'radiant';

/**
 * The cap THIS player's hits fill. Read as the lower of the record's own cap and
 * the player's resolved delivery cap: Harbinger raises the record's cap by one
 * after the fact, and the Pyromancer's hits (which apply at the delivery cap) can
 * never climb into that extra stack, so the record's cap alone would never read
 * as full for a Far-range Pyromancer.
 */
function burnIsFull(player: PlayerEntity, effect: StatusEffect): boolean {
  if (effect.maxStacks <= 0) return false;
  const passives = player.usesSkills.passives;
  const profile = resolveDotClassProfile(passives, player.usesSkills.selectedSubVariant);
  const cap = resolveDotRelicDeliveryProfile(
    profile.tickIntervalMs,
    resolveDotStackCap(passives, profile.maxStacks),
    relicRatingsFromPassives(passives),
  ).maxStacks.after;
  return effect.stacks >= Math.min(effect.maxStacks, cap);
}

/**
 * RADIANT — the Pyromancer's payoff (design §22.5, dot-balanced-t3-a).
 *
 * A burn tick on a target at max stacks also strikes every adjacent body for the
 * tick's damage. Fire radiates; nothing moves:
 *
 *   - It is DAMAGE, never a stack. It touches no body's burn record, so it applies
 *     no stacks and spreads nothing. That is the whole difference from the Warlock
 *     range node (a stack applied at reach also lands one adjacent), Contagion and
 *     the Outbreak keystone, which all move STACKS.
 *   - Each struck body pays the DoT rules for ITSELF (`classDotTickDamage`: no
 *     plating, half its DR, its own `dotResistance` and DoT vulnerabilities) on the
 *     burning body's RAW tick, so an armoured centre never dims the fire around it.
 *   - It is not a hit. No combat-pipeline event runs, so nothing that listens for a
 *     hit (on-hit procs, the lineage `hit-nth` counter, Sweep's Tempo attack
 *     equivalent) sees it. A body it kills is handed back through `queueKill` and
 *     dies exactly as a DoT-tick kill does.
 *   - It never recurses. A struck body's burn is untouched, so one that is itself
 *     at max radiates on its OWN tick and only then: one splash per ticking body.
 *
 * Gated on the burn's source carrying `dot.radiant`, which only the Pyromancer node
 * authors: the class DoT record is one id across all three elements, so the path's
 * presence, not the element, is what decides. The reach is the lineage adjacency
 * unit (`LINEAGE_UNITS.contagionRadius`), measured as body overlap from the burning
 * body, through the same target query `applyPlayerAoe` uses. `applyPlayerAoe`
 * itself is not used because it mitigates as a hit (plating, full DR).
 *
 * Presentation: a `dot-tick` on each struck body in the burn's element (fire), with
 * `sourceType: 'special'` so the struck body's number and flame read as the burn,
 * while the caster's own tick clock (which listens to `class` ticks on its target)
 * does not mistake the splash for its target's tick.
 *
 * Returns how many bodies the tick struck.
 */
export function radiateBurnTick(
  world: World,
  burning: MonsterEntity,
  effect: StatusEffect,
  rawTick: number,
  isDying: (monsterId: string) => boolean,
  queueKill: (monster: MonsterEntity, damage: number) => void,
): number {
  const sourceId = effect.sourceId;
  if (!sourceId || rawTick <= 0) return 0;
  const player = world.getPlayerEntity(sourceId);
  if (!player || (player.usesSkills.passives['dot.radiant'] ?? 0) <= 0) return 0;
  if (!burnIsFull(player, effect)) return 0;
  // The target query is anchored on the caster's node; a burn left ticking in a
  // node the caster has walked out of does not radiate into the wrong one.
  if (player.hasPosition.nodeId !== burning.hasPosition.nodeId) return 0;

  const victims = playerAoeTargets(
    world,
    player,
    burning.hasPosition.current,
    lineageUnit('contagionRadius'),
    burning.isMonster.id,
  );
  if (victims.length === 0) return 0;

  const element = dotElementForSource(world, sourceId);
  const source = actorFromSourceId(world, sourceId);
  let struck = 0;
  for (const victim of victims) {
    // Already dead this pass (its own tick, or a neighbour's fire): never twice.
    if (victim.hasHealth.hp <= 0 || isDying(victim.isMonster.id)) continue;
    const damage = classDotTickDamage(world, victim, sourceId, rawTick);
    recordMonsterDamagedByPlayer(
      world,
      sourceId,
      source,
      victim,
      damage,
      'dot',
      buildSimpleBreakdown(damage, damage),
      [RADIANT_TAG],
    );
    victim.hasHealth.hp -= damage;
    // The same pack wake-up `applyPlayerAoe` gives a body its area damage hurts.
    renewPackPursuit(world, victim, { id: sourceId, kind: 'player' });
    pushDotTickEvent(world, victim, element, damage, { sourceType: 'special', sourceId });
    struck++;
    if (victim.hasHealth.hp <= 0) queueKill(victim, damage);
  }
  return struck;
}
