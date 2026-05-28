import {
  applyStatusEffect,
  distanceSq,
  getStatusEffect,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../../../ecs/entity';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { setAggroTarget } from '../../../../../combat/ai/targeting';
import { alliesInNodeWithin } from '../../../../../world/queries';
import { redirectDamageToMinion } from '../../damageSponge';
import { computeLeashRadius } from '../../ai';
import {
  SENTINEL_EFFECT,
  SENTINEL_REFRESH_MS,
} from '../core/constants';
import { livingMinionsOfType } from '../core/helpers';

function findRockslideHopperForVictim(
  world: World,
  victim: PlayerEntity,
): { owner: PlayerEntity; hopper: MinionEntity } | null {
  const nodeId = victim.hasPosition.nodeId;
  for (const owner of world.summonerPlayers) {
    if (owner.isPlayer.id === victim.isPlayer.id) continue;
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.rockslide-cover']) continue;

    const radius = passives['summoner.rockslide-radius'] ?? 160;
    const r2 = radius * radius;
    const hoppers = livingMinionsOfType(world, owner, 'cliff-hopper');
    for (const hopper of hoppers) {
      if (hopper.hasPosition.nodeId !== nodeId) continue;
      if (distanceSq(hopper.hasPosition.current, victim.hasPosition.current) <= r2) {
        return { owner, hopper };
      }
    }
  }
  return null;
}

export function tickStoneSentinelAura(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.stone-sentinel']) continue;

    const radius = passives['summoner.sentinel-radius'] ?? 120;
    const plating = passives['summoner.sentinel-plating'] ?? 6;
    const dr = passives['summoner.sentinel-dr'] ?? 0.04;
    const archers = livingMinionsOfType(world, owner, 'ridge-archer');
    if (archers.length === 0) continue;

    const scanRadius = radius * 4;
    const allies = alliesInNodeWithin(
      world,
      owner.hasPosition.current,
      owner.hasPosition.nodeId,
      scanRadius,
    );

    const r2 = radius * radius;
    for (const ally of allies) {
      if (!ally.tracksCombat) continue;
      const inAura = archers.some(
        a => distanceSq(a.hasPosition.current, ally.hasPosition.current) <= r2,
      );
      if (!inAura) {
        removeStatusEffect(ally.tracksCombat, SENTINEL_EFFECT);
        continue;
      }
      removeStatusEffect(ally.tracksCombat, SENTINEL_EFFECT);
      applyStatusEffect(ally.tracksCombat, {
        id:           SENTINEL_EFFECT,
        maxStacks:    1,
        remainingMs:  SENTINEL_REFRESH_MS,
        refreshable:  true,
        sourceId:     owner.isPlayer.id,
        data:         { plating, dr },
      });
    }
  }
}

/** Mountain Guardian: force leash-range monsters onto the sentinel minion. */
export function tickGuardianTaunt(world: World, now: number): void {
  for (const owner of world.summonerPlayers) {
    if (!owner.usesSkills.passives['summoner.mountain-guardian']) continue;

    const sentinels = livingMinionsOfType(world, owner, 'mountain-sentinel');
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

    // Stone Sentinel — bonus plating/DR (recompute before ally sponge).
    if (ctx.attackerType === 'monster' && victim.tracksCombat) {
      const eff = getStatusEffect(victim.tracksCombat, SENTINEL_EFFECT);
      if (eff) {
        const monster = ctx.attacker;
        const bonusPlt = eff.data.plating ?? 0;
        const bonusDr = eff.data.dr ?? 0;
        const plt = victim.mitigatesDamage.plating + bonusPlt;
        const dr = Math.min(0.95, victim.mitigatesDamage.damageReduction + bonusDr);
        ctx.damage = Math.max(1, Math.round(
          Math.max(0, monster.dealsDamage.attack - plt) * (1 - dr),
        ));
      }
    }

    // Rockslide Cover — ally damage near a living cliff-hopper.
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
