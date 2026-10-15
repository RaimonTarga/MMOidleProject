/**
 * The Conduit's Souls (class-first build plan CD.4; bible §7.2, §7.8): the boss trophy in the
 * relic slot is a free summon (0 Command) with its own body, plus the boss's seed line. The
 * body joins the roster in `profile.ts`; this module runs the lines. Every number is a
 * placeholder, and the seed lines are the brief's sentences (the designer expects them to change).
 *
 * T2 (T2-CONDUIT): a Soul's rank scales its body and its line (`soulPower`); the Jungle and
 * Desert Souls arrive at rank 1 (the Desert's mark stacks live in `summonPiecesT2.ts`).
 *
 * T3 (T3-CONDUIT): the Tundra Soul (Rime-Mammoth) chills the enemies near it, the Volcanic Soul
 * (Magma Salamander) heats the formation up over a fight, and Two Souls (a specialization) fields
 * a second Soul that strengthens both.
 *
 * Stand-ins, flagged for the designer: the Mountain Soul's shield is a heal (minions have no
 * ward), and the Cave Soul's spiderling is a free strike on a timer (a temporary summon entity
 * does not exist yet).
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  CONDUIT_KIT,
  CONDUIT_SPECIALIZATION_TUNING,
  getResource,
  getStatusEffect,
  setResource,
  trophyRanks,
  type ConduitTrophy,
} from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { runFormationAttack } from './formationAttack';
import { specializationOf } from './t3Shared';

/** The Soul's own body: sturdier and harder-hitting than a one-Command summon. */
export const SOUL_BODY = { hpMult: 1.3, damageMult: 1.2 } as const;

/**
 * Each rank above 1 makes the Soul this much stronger (bible §7.8: "the same lineage's next-tier
 * boss ranks one up"; the real rank designs come later, so this is one PLACEHOLDER step for the
 * body and the line alike).
 */
export const SOUL_RANK_GROWTH = 0.25;

const PARAMS = {
  /** Razortusk: how often the melee summons charge the target together. */
  chargeEveryMs: 10_000,
  /** Timberclaw: the share of its max HP a summon heals per second in a fight. */
  healPctPerSec: 0.02,
  /** Mire Behemoth: the bile pool's burst, as a multiple of the owner's attack, and its radius. */
  bileMult: 1.0,
  bileRadius: 100,
  /** Stoneplate: the share of its max HP a taunting tank shields itself with. */
  shieldPct: 0.2,
  /** Dreadbore: how often the spiderling strikes, and how hard (a multiple of the Soul's hit). */
  spiderEveryMs: 2_000,
  spiderMult: 0.5,
  /** Dread-Gorger (Jungle): the formation's leash (so a fleeing target stays inside it) and speed grow by this much. */
  chaseLeashBonus: 0.6,
  chaseSpeedBonus: 0.2,
  /** Dune-Stalker (Desert): each different summon type that has hit the marked target adds this much damage on it. */
  markStackBonus: 0.1,
  /** Rime-Mammoth (Tundra): enemies within this reach of the Soul are slowed and attack slower by this much. */
  chillRadius: 140,
  chillSlow: 0.25,
  chillAttackSlow: 0.25,
  chillEveryMs: 1_000,
  /** Magma Salamander (Volcanic): the formation hits this much harder per ten seconds of the fight, up to the cap in steps. */
  heatPerStep: 0.1,
  heatStepSec: 10,
  heatMaxSteps: 6,
} as const;

const NEXT_CHARGE = 'soul.nextChargeAt';
const NEXT_SPIDER = 'soul.nextSpiderAt';
const NEXT_CHILL = 'soul.nextChillAt';

const TROPHIES = new Map<string, ConduitTrophy>(CONDUIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

/** The Soul in the relic slot, if the Formation holds one. */
export function soulOf(owner: PlayerEntity): ConduitTrophy | undefined {
  const config = owner.configuresClass?.config;
  if (config?.system.kind !== 'formation') return undefined;
  return config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
}

/**
 * Every Soul the Conduit fields: the relic slot's, and with Two Souls (§7.6) a second. The config
 * check holds one relic slot, so until it carries a second the second Soul is the newest other one
 * the character owns (a stand-in; see the T3-CONDUIT report).
 */
export function soulsOf(owner: PlayerEntity): ConduitTrophy[] {
  const first = soulOf(owner);
  if (!first) return [];
  if (specializationOf(owner) !== 'conduit-two-souls') return [first];
  const config = owner.configuresClass?.config;
  const picked = config?.relic[1] ? TROPHIES.get(config.relic[1]) : undefined;
  if (picked && picked.id !== first.id) return [first, picked];
  const cleared = owner.tracksProgression?.bossesCleared ?? [];
  const owned = trophyRanks('summoner', cleared);
  for (let i = cleared.length - 1; i >= 0; i -= 1) {
    const lineage = cleared[i]!.split(':')[0];
    for (const trophy of TROPHIES.values()) {
      if (trophy.lineage === lineage && owned.has(trophy.id) && trophy.id !== first.id) return [first, trophy];
    }
  }
  return [first];
}

/** A Soul's strength multiplier at the rank the character holds (1 at rank 1), and stronger with a second Soul beside it. */
export function soulPower(owner: PlayerEntity, soul: ConduitTrophy | undefined = soulOf(owner)): number {
  if (!soul) return 1;
  const rank = trophyRanks('summoner', owner.tracksProgression?.bossesCleared ?? []).get(soul.id) ?? 1;
  const together = specializationOf(owner) === 'conduit-two-souls' && soulsOf(owner).length > 1
    ? 1 + CONDUIT_SPECIALIZATION_TUNING.twoSoulsBuff
    : 1;
  return (1 + SOUL_RANK_GROWTH * (Math.max(1, rank) - 1)) * together;
}

/** The strongest power among the fielded Souls of one lineage, 0 when none is out. */
export function lineagePower(owner: PlayerEntity, lineage: string): number {
  let best = 0;
  for (const soul of soulsOf(owner)) {
    if (soul.lineage === lineage) best = Math.max(best, soulPower(owner, soul));
  }
  return best;
}

/** Dread-Gorger: the leash and speed bonuses, 0 without that Soul. */
export function chaseBonus(owner: PlayerEntity): { leash: number; speed: number } {
  const power = lineagePower(owner, 'jungle');
  return { leash: PARAMS.chaseLeashBonus * power, speed: PARAMS.chaseSpeedBonus * power };
}

/** Dune-Stalker: the damage bonus per mark stack, 0 without that Soul. */
export function markStackBonus(owner: PlayerEntity): number {
  return PARAMS.markStackBonus * lineagePower(owner, 'desert');
}

/** Magma Salamander: how much harder the formation hits after `seconds` of the fight (1 without that Soul). */
export function fightHeatMult(owner: PlayerEntity, seconds: number): number {
  const power = lineagePower(owner, 'volcanic');
  if (power <= 0 || seconds <= 0) return 1;
  return 1 + PARAMS.heatPerStep * Math.min(PARAMS.heatMaxSteps, Math.floor(seconds / PARAMS.heatStepSec)) * power;
}

/** The living minions of the formation, with the body of each Soul keyed by the Soul's id. */
function bodies(world: World, owner: PlayerEntity): { all: MinionEntity[]; souls: Map<string, MinionEntity> } {
  const all: MinionEntity[] = [];
  const souls = new Map<string, MinionEntity>();
  for (const id of owner.summonsMinions?.minionIds ?? []) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion || minion.hasHealth.hp <= 0) continue;
    all.push(minion);
    const slot = minion.isMinion.slotId.split('#')[0] ?? '';
    if (TROPHIES.has(slot)) souls.set(slot, minion);
  }
  return { all, souls };
}

function formationTarget(world: World, owner: PlayerEntity) {
  const id = owner.summonsMinions?.formationTargetId;
  const target = id ? world.getMonsterEntity(id) : undefined;
  return target && target.hasHealth.hp > 0 ? target : undefined;
}

/** Per-tick Soul lines: Razortusk's charge, Timberclaw's mending, Dreadbore's spiderling, Rime-Mammoth's chill. */
export function updateSoul(world: World, owner: PlayerEntity, dt: number, now: number): void {
  const { all, souls } = bodies(world, owner);
  if (all.length === 0) return;
  for (const soul of soulsOf(owner)) updateOneSoul(world, owner, soul, souls.get(soul.id), all, dt, now);
}

function updateOneSoul(
  world: World,
  owner: PlayerEntity,
  soul: ConduitTrophy,
  soulBody: MinionEntity | undefined,
  all: MinionEntity[],
  dt: number,
  now: number,
): void {
  const cs = owner.tracksCombat;
  const inCombat = isPlayerInCombat(owner, now);
  const power = soulPower(owner, soul);

  if (soul.lineage === 'forest' && inCombat) {
    for (const minion of all) {
      if (minion.hasHealth.hp >= minion.hasHealth.maxHp) continue;
      applyHealToMinion(minion, owner.isPlayer.id, minion.hasHealth.maxHp * PARAMS.healPctPerSec * power * (dt / 1_000), world);
    }
  }

  // Rime-Mammoth: enemies near the Soul are chilled (slowed, and attacking slower). Bosses that accept no control shrug it off.
  if (soul.lineage === 'tundra' && soulBody && now >= getResource(cs, NEXT_CHILL)) {
    setResource(cs, NEXT_CHILL, now + PARAMS.chillEveryMs);
    for (const victim of playerAoeTargets(world, owner, soulBody.hasPosition.current, PARAMS.chillRadius)) {
      if (victim.hasHealth.hp <= 0 || monsterIgnoresControl(victim)) continue;
      applyMonsterSlow(world, victim, Math.min(0.9, PARAMS.chillSlow * power), PARAMS.chillEveryMs * 3, soulBody.isMinion.id);
      const slow = getStatusEffect(victim.tracksCombat, ABILITY_SLOW_EFFECT_ID);
      if (slow) slow.data['attackSlowPct'] = Math.max(slow.data['attackSlowPct'] ?? 0, PARAMS.chillAttackSlow * power);
    }
  }

  const target = formationTarget(world, owner);
  if (!target) return;

  if (soul.lineage === 'plains' && now >= getResource(cs, NEXT_CHARGE)) {
    setResource(cs, NEXT_CHARGE, now + PARAMS.chargeEveryMs / power);
    for (const minion of all) {
      const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === minion.isMinion.slotId.split('#')[0]);
      if ((piece?.mode ?? 'melee') !== 'melee') continue;
      runFormationAttack(world, owner, minion, target, now);
    }
  }

  if (soul.lineage === 'cave' && soulBody && now >= getResource(cs, NEXT_SPIDER)) {
    setResource(cs, NEXT_SPIDER, now + PARAMS.spiderEveryMs / power);
    // Stand-in for the spiderling: a lighter free strike from the Soul's body.
    runFormationAttack(world, owner, soulBody, target, now, { soulSpiderling: PARAMS.spiderMult });
  }
}

/** Mire Behemoth: a fallen summon leaves a pool of bile that hurts the enemies around it. */
export function onSoulSummonDeath(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  const power = lineagePower(owner, 'swamp');
  if (power <= 0) return;
  const victims = playerAoeTargets(world, owner, minion.hasPosition.current, PARAMS.bileRadius);
  if (victims.length === 0) return;
  applyPlayerAoeTo(world, owner, victims, owner.dealsDamage.attack * PARAMS.bileMult * power, 'summon', {}, {});
}

/** Stoneplate: when a tank taunts, the taunt also shields it. */
export function onTankTaunt(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  const power = lineagePower(owner, 'mountain');
  if (power <= 0) return;
  applyHealToMinion(minion, owner.isPlayer.id, minion.hasHealth.maxHp * PARAMS.shieldPct * power, world);
}
