import {
  MONSTER_DATABASE,
  applyStatusEffect,
  distanceSq,
  getFlag,
  getStatusEffect,
  removeStatusEffect,
  setFlag,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { setAggroTarget } from '../../../../../combat/ai/targeting';
import { redirectDamageToMinion } from '../../damageSponge';
import { computeLeashRadius } from '../../ai';
import {
  SENTINEL_REFRESH_MS,
  SENTINEL_SLOW_EFFECT,
  SENTINEL_SLOW_FLAG,
} from '../core/constants';
import { minionBuffRadius } from '../../range';
import { livingMinionsOfType } from '../core/helpers';

function findRockslideHopperForVictim(
  world: World,
  victim: PlayerEntity,
): { owner: PlayerEntity; hopper: MinionEntity } | null {
  const nodeId = victim.hasPosition.nodeId;
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.rockslide-cover']) continue;

    const hoppers = livingMinionsOfType(world, owner, 'cliff-hopper');
    for (const hopper of hoppers) {
      if (hopper.hasPosition.nodeId !== nodeId) continue;
      const r2 = minionBuffRadius(hopper) ** 2;
      if (distanceSq(hopper.hasPosition.current, victim.hasPosition.current) <= r2) {
        return { owner, hopper };
      }
    }
  }
  return null;
}

function applySentinelSlowStats(
  monster: MonsterEntity,
  speedMult: number,
  atkCdMult: number,
): void {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  if (!def) return;
  monster.hasPosition.speed = Math.max(
    10,
    Math.round(def.stats.speed * speedMult),
  );
  monster.performsAttack.attackCooldown = Math.round(
    def.stats.attackCooldown * atkCdMult,
  );
}

function restoreSentinelSlowStats(world: World, monster: MonsterEntity): void {
  const cs = monster.tracksCombat;
  if (!getStatusEffect(cs, SENTINEL_SLOW_EFFECT)) return;

  removeStatusEffect(cs, SENTINEL_SLOW_EFFECT);
  if (!getFlag(cs, SENTINEL_SLOW_FLAG)) return;

  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  if (def) {
    monster.hasPosition.speed = def.stats.speed;
    monster.performsAttack.attackCooldown = def.stats.attackCooldown;
  }
  setFlag(cs, SENTINEL_SLOW_FLAG, false);
}

/** Stone Sentinel: monsters in aura move and attack slower. Requires living archers. */
export function tickStoneSentinelAura(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.stone-sentinel']) continue;

    const archers = livingMinionsOfType(world, owner, 'ridge-archer');
    const speedMult = passives['summoner.sentinel-slow-speed-mult'] ?? 0.65;
    const atkCdMult = passives['summoner.sentinel-slow-atk-mult'] ?? 1.35;
    const nodeId = owner.hasPosition.nodeId;

    if (archers.length === 0) {
      for (const monster of world.monsterEntitiesInNode(nodeId)) {
        const eff = getStatusEffect(monster.tracksCombat, SENTINEL_SLOW_EFFECT);
        if (eff?.sourceId === owner.isPlayer.id) {
          restoreSentinelSlowStats(world, monster);
        }
      }
      continue;
    }

    for (const monster of world.monsterEntitiesInNode(nodeId)) {
      const inAura = archers.some((a) => {
        const r2 = minionBuffRadius(a) ** 2;
        return distanceSq(a.hasPosition.current, monster.hasPosition.current) <= r2;
      });
      if (!inAura) {
        restoreSentinelSlowStats(world, monster);
        continue;
      }

      const cs = monster.tracksCombat;
      removeStatusEffect(cs, SENTINEL_SLOW_EFFECT);
      applyStatusEffect(cs, {
        id:          SENTINEL_SLOW_EFFECT,
        maxStacks:   1,
        remainingMs: SENTINEL_REFRESH_MS,
        refreshable: true,
        sourceId:    owner.isPlayer.id,
        data:        { speedMult, atkCdMult },
      });
      applySentinelSlowStats(monster, speedMult, atkCdMult);
      if (!getFlag(cs, SENTINEL_SLOW_FLAG)) {
        setFlag(cs, SENTINEL_SLOW_FLAG, true);
      }
    }
  }
}

/** Mountain Guardian: force leash-range monsters onto the sentinel minion. */
export function tickGuardianTaunt(world: World, now: number): void {
  for (const owner of world.summonerPlayers) {
    if (!owner.usesSkills.passives['summoner.mountain-guardian']) continue;

    const sentinels = livingMinionsOfType(world, owner, 'crag-behemoth');
    const sentinel = sentinels[0];
    if (!sentinel) continue;

    const leashSq = computeLeashRadius(owner) ** 2;
    const op = owner.hasPosition.current;
    const nodeId = owner.hasPosition.nodeId;

    for (const m of world.monsterEntitiesInNode(nodeId)) {
      if (distanceSq(m.hasPosition.current, op) > leashSq) continue;
      const aggro = m.hasAggroTarget;
      if (aggro?.targetKind === 'minion' && aggro.targetId === sentinel.isMinion.id) {
        continue;
      }
      setAggroTarget(world, m, { id: sentinel.isMinion.id, kind: 'minion' }, now);
    }
  }
}

export function registerMountainPathHooks(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const victim = ctx.defender;

    const rockslide = findRockslideHopperForVictim(world, victim);
    if (rockslide) {
      const pct = rockslide.owner.usesSkills.passives['summoner.rockslide-pct'] ?? 0.30;
      const redirected = Math.max(1, Math.round(ctx.damage * pct));
      ctx.damage = Math.max(0, ctx.damage - redirected);
      redirectDamageToMinion(rockslide.hopper, redirected);
    }
  });
}

export function tickMountainPath(world: World, now: number): void {
  tickStoneSentinelAura(world);
  tickGuardianTaunt(world, now);
}
