/**
 * The Conduit's Souls (class-first build plan CD.4; bible §7.2, §7.8): the boss trophy in the
 * relic slot is a free summon (0 Command) with its own body, plus the boss's seed line. The
 * body joins the roster in `profile.ts`; this module runs the lines. Every number is a
 * placeholder, and the seed lines are the brief's sentences (the designer expects them to change).
 *
 * Stand-ins, flagged for the designer: the Mountain Soul's shield is a heal (minions have no
 * ward), and the Cave Soul's spiderling is a free strike on a timer (a temporary summon entity
 * does not exist yet).
 */
import { CONDUIT_KIT, getResource, setResource, type ConduitTrophy } from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { runFormationAttack } from './formationAttack';

/** The Soul's own body: sturdier and harder-hitting than a one-Command summon. */
export const SOUL_BODY = { hpMult: 1.3, damageMult: 1.2 } as const;

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
} as const;

const NEXT_CHARGE = 'soul.nextChargeAt';
const NEXT_SPIDER = 'soul.nextSpiderAt';

const TROPHIES = new Map<string, ConduitTrophy>(CONDUIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

/** The Soul in the relic slot, if the Formation holds one. */
export function soulOf(owner: PlayerEntity): ConduitTrophy | undefined {
  const config = owner.configuresClass?.config;
  if (config?.system.kind !== 'formation') return undefined;
  return config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
}

/** The living minions of the formation, with the one that is the Soul's body. */
function bodies(world: World, owner: PlayerEntity): { all: MinionEntity[]; soul: MinionEntity | undefined } {
  const all: MinionEntity[] = [];
  let soul: MinionEntity | undefined;
  for (const id of owner.summonsMinions?.minionIds ?? []) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion || minion.hasHealth.hp <= 0) continue;
    all.push(minion);
    if (TROPHIES.has(minion.isMinion.slotId.split('#')[0] ?? '')) soul = minion;
  }
  return { all, soul };
}

function formationTarget(world: World, owner: PlayerEntity) {
  const id = owner.summonsMinions?.formationTargetId;
  const target = id ? world.getMonsterEntity(id) : undefined;
  return target && target.hasHealth.hp > 0 ? target : undefined;
}

/** Per-tick Soul lines: Razortusk's charge, Timberclaw's mending, Dreadbore's spiderling. */
export function updateSoul(world: World, owner: PlayerEntity, dt: number, now: number): void {
  const soul = soulOf(owner);
  if (!soul) return;
  const { all, soul: soulBody } = bodies(world, owner);
  if (all.length === 0) return;
  const cs = owner.tracksCombat;
  const inCombat = isPlayerInCombat(owner, now);

  if (soul.lineage === 'forest' && inCombat) {
    for (const minion of all) {
      if (minion.hasHealth.hp >= minion.hasHealth.maxHp) continue;
      applyHealToMinion(minion, owner.isPlayer.id, minion.hasHealth.maxHp * PARAMS.healPctPerSec * (dt / 1_000), world);
    }
  }

  const target = formationTarget(world, owner);
  if (!target) return;

  if (soul.lineage === 'plains' && now >= getResource(cs, NEXT_CHARGE)) {
    setResource(cs, NEXT_CHARGE, now + PARAMS.chargeEveryMs);
    for (const minion of all) {
      const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === minion.isMinion.slotId.split('#')[0]);
      if ((piece?.mode ?? 'melee') !== 'melee') continue;
      runFormationAttack(world, owner, minion, target, now);
    }
  }

  if (soul.lineage === 'cave' && soulBody && now >= getResource(cs, NEXT_SPIDER)) {
    setResource(cs, NEXT_SPIDER, now + PARAMS.spiderEveryMs);
    // Stand-in for the spiderling: a lighter free strike from the Soul's body.
    runFormationAttack(world, owner, soulBody, target, now, { soulSpiderling: PARAMS.spiderMult });
  }
}

/** Mire Behemoth: a fallen summon leaves a pool of bile that hurts the enemies around it. */
export function onSoulSummonDeath(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  if (soulOf(owner)?.lineage !== 'swamp') return;
  const victims = playerAoeTargets(world, owner, minion.hasPosition.current, PARAMS.bileRadius);
  if (victims.length === 0) return;
  applyPlayerAoeTo(world, owner, victims, owner.dealsDamage.attack * PARAMS.bileMult, 'summon', {}, {});
}

/** Stoneplate: when a tank taunts, the taunt also shields it. */
export function onTankTaunt(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  if (soulOf(owner)?.lineage !== 'mountain') return;
  applyHealToMinion(minion, owner.isPlayer.id, minion.hasHealth.maxHp * PARAMS.shieldPct, world);
}
