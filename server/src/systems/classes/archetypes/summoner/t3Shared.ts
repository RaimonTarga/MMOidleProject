/**
 * What the Conduit's tier 3 runtime shares (T3-CONDUIT; bible §7.6, §7.16): the status ids it
 * adds, the specialization the character picked, and the fight clock that Ascendant, the
 * Cinderling and the Magma Salamander Soul read. Imports nothing from the other Conduit files, so
 * the T2 listeners, the Souls and the T3 listeners can all use it without a cycle.
 */
import { getResource, getStatusEffect, isConduitSpecialization, isHoldStatusId, setResource, STUN_STATUS_ID, type ConduitSpecializationId } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';

/** Warhorn's call: the summons around it attack faster for a moment. */
export const HORN_EFFECT_ID = 'conduit-horn';
/** Burn Bright: a fresh summon attacks faster for its first seconds. */
export const BURN_BRIGHT_EFFECT_ID = 'conduit-burn-bright';
/** Sporecaller's spores on an enemy: it deals less damage. `cut` is the share. */
export const SPORE_EFFECT_ID = 'conduit-spore';
/** Hibernate: the summon is encased in ice; `hp` in its combat resources is the floor it cannot fall below. */
export const HIBERNATE_EFFECT_ID = 'conduit-hibernate';
/** The Hunt: the last time each kind of damage summon hit this enemy (`t<kind>` in ms). */
export const HUNT_EFFECT_ID = 'conduit-hunt';
/** Infestation: this enemy carries an infestation and bursts when it dies. */
export const INFESTED_FLAG = 'conduit.infested';

export function specializationOf(owner: PlayerEntity): ConduitSpecializationId | null {
  const picked = owner.usesSkills.specializationId;
  return isConduitSpecialization(picked) ? picked : null;
}

const FIGHT_START = 'fight.startAt';

/** Seconds since the formation's current fight began; 0 outside a fight. */
export function fightSeconds(owner: PlayerEntity, now: number): number {
  const start = getResource(owner.tracksCombat, FIGHT_START);
  return start > 0 ? Math.max(0, (now - start) / 1_000) : 0;
}

/** The clock reading when the current fight began; 0 outside a fight. It names the fight (once-per-fight rules compare it). */
export function fightStartedAt(owner: PlayerEntity): number {
  return getResource(owner.tracksCombat, FIGHT_START);
}

/** Whether the formation is in a fight right now (the clock is running, even at second 0). */
export function inFight(owner: PlayerEntity): boolean {
  return getResource(owner.tracksCombat, FIGHT_START) > 0;
}

/** Start or end the fight clock; the summoner tick calls it once per pass. */
export function updateFightClock(world: World, owner: PlayerEntity, now: number): void {
  const targetId = owner.summonsMinions?.formationTargetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  const fighting = isPlayerInCombat(owner, now) || (target !== undefined && target.hasHealth.hp > 0);
  const start = getResource(owner.tracksCombat, FIGHT_START);
  if (fighting && start <= 0) setResource(owner.tracksCombat, FIGHT_START, Math.max(1, now));
  else if (!fighting && start > 0) setResource(owner.tracksCombat, FIGHT_START, 0);
}

/** Whether an enemy is slowed, rooted, chilled or frozen: Icebound's mark (a stun alone is not). */
export function isHeldOrSlowed(monster: MonsterEntity): boolean {
  return monster.tracksCombat.statusEffects.some(
    (effect) => effect.remainingMs !== 0 && effect.id !== STUN_STATUS_ID && isHoldStatusId(effect.id),
  );
}

/** The share of its damage an enemy under Sporecaller's spores loses, 0 without them. */
export function sporeCut(monster: MonsterEntity): number {
  return getStatusEffect(monster.tracksCombat, SPORE_EFFECT_ID)?.data['cut'] ?? 0;
}
