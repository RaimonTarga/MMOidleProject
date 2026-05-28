import {
  applyStatusEffect,
  distanceSq,
  getCounter,
  getCooldown,
  isCooldownActive,
  removeStatusEffect,
  resetCounter,
  setCounter,
  setCooldown,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../../../ecs/entity';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyStun } from '../../../../../combat/status/stun';
import { alliesInNodeWithin } from '../../../../../world/queries';
import {
  DEBUFF_IMMUNE_EFFECT,
  GRAZING_COOLDOWN_KEY,
  TRAMPLE_BOON_EFFECT,
  TRAMPLE_REFRESH_MS,
  VITAL_BURST_COUNTER_KEY,
} from '../core/constants';
import {
  canApplyPlayerDebuff,
  cleanseAllyDebuffs,
  grantDebuffImmunity,
} from '../core/debuffGuard';
import { isInCombat, livingMinionsOfType } from '../core/helpers';

export function tickGrazingField(world: World, dt: number, now: number): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.grazing-field']) continue;
    if (!owner.tracksCombat) continue;

    const cs = owner.tracksCombat;
    const interval = passives['summoner.grazing-interval-ms'] ?? 2000;
    const remaining = Math.max(0, getCooldown(cs, GRAZING_COOLDOWN_KEY) - dt);
    setCooldown(cs, GRAZING_COOLDOWN_KEY, remaining);
    if (isCooldownActive(cs, GRAZING_COOLDOWN_KEY)) continue;
    setCooldown(cs, GRAZING_COOLDOWN_KEY, interval);

    const radius = passives['summoner.grazing-radius'] ?? 100;
    const pct = passives['summoner.grazing-pct'] ?? 0.04;
    const healMult = isInCombat(owner, now)
      ? 1
      : (passives['summoner.grazing-ooc-mult'] ?? 2);

    const slimes = livingMinionsOfType(world, owner, 'plains-slime');
    if (slimes.length === 0) continue;

    const healed = new Set<string>();
    const r2 = radius * radius;
    for (const slime of slimes) {
      for (const ally of alliesInNodeWithin(
        world,
        slime.hasPosition.current,
        slime.hasPosition.nodeId,
        radius,
      )) {
        if (healed.has(ally.isPlayer.id)) continue;
        if (distanceSq(slime.hasPosition.current, ally.hasPosition.current) > r2) continue;
        healed.add(ally.isPlayer.id);
        const amount = Math.max(1, Math.round(ally.hasHealth.maxHp * pct * healMult));
        ally.hasHealth.hp = Math.min(ally.hasHealth.maxHp, ally.hasHealth.hp + amount);
        markSliceDirty(world, ally, 'hasHealth');
      }
    }
  }
}

export function tickTrampleAura(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.trampled-path']) continue;

    const radius = passives['summoner.trample-aura-radius'] ?? 120;
    const speedPct = passives['summoner.trample-speed-pct'] ?? 0.25;
    const boars = livingMinionsOfType(world, owner, 'boar');
    if (boars.length === 0) continue;

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
      const inAura = boars.some(
        b => distanceSq(b.hasPosition.current, ally.hasPosition.current) <= r2,
      );
      if (!inAura) {
        removeStatusEffect(ally.tracksCombat, TRAMPLE_BOON_EFFECT);
        continue;
      }
      removeStatusEffect(ally.tracksCombat, TRAMPLE_BOON_EFFECT);
      applyStatusEffect(ally.tracksCombat, {
        id:           TRAMPLE_BOON_EFFECT,
        maxStacks:    1,
        remainingMs:  TRAMPLE_REFRESH_MS,
        refreshable:  true,
        sourceId:     owner.isPlayer.id,
        data:         { speedPct },
      });
    }
  }
}

export function tryVitalBurst(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  now: number,
): void {
  const passives = owner.usesSkills.passives;
  if (!passives['summoner.vital-burst']) return;
  if (minion.isMinion.monsterTypeId !== 'plains-slime') return;
  if (!isInCombat(owner, now)) return;
  if (!owner.tracksCombat) return;
  if (getCounter(owner.tracksCombat, VITAL_BURST_COUNTER_KEY) > 0) return;

  setCounter(owner.tracksCombat, VITAL_BURST_COUNTER_KEY, 1);

  const radius = passives['summoner.vital-burst-radius'] ?? 200;
  const immunityMs = passives['summoner.vital-burst-immunity-ms'] ?? 3000;

  for (const ally of alliesInNodeWithin(
    world,
    minion.hasPosition.current,
    minion.hasPosition.nodeId,
    radius,
  )) {
    if (!ally.tracksCombat) continue;
    cleanseAllyDebuffs(ally.tracksCombat);
    grantDebuffImmunity(ally.tracksCombat, immunityMs, owner.isPlayer.id);
    markSliceDirty(world, ally, 'hasStatus');
  }
}

export function tickVitalBurstReset(world: World, now: number): void {
  for (const owner of world.summonerPlayers) {
    if (!owner.usesSkills.passives['summoner.vital-burst']) continue;
    if (!owner.tracksCombat) continue;
    if (isInCombat(owner, now)) continue;
    resetCounter(owner.tracksCombat, VITAL_BURST_COUNTER_KEY);
  }
}

export function registerPlainsPathHooks(): void {
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    if (!ctx.metadata.boarCharge) return;

    const passives = ctx.attacker.usesSkills.passives;
    if (!passives['summoner.trampled-path']) return;

    const stunMs = passives['summoner.trample-stun-ms'] ?? 1200;
    applyStun(ctx.defender.tracksCombat, stunMs, ctx.attacker.isPlayer.id);
  });
}

function tickBoarChargeCooldowns(world: World, dt: number): void {
  for (const owner of world.summonerPlayers) {
    if (!owner.usesSkills.passives['summoner.trampled-path']) continue;
    for (const boar of livingMinionsOfType(world, owner, 'boar')) {
      const cm = boar.controlsMinion;
      if (cm.chargeCooldownMs > 0) {
        cm.chargeCooldownMs = Math.max(0, cm.chargeCooldownMs - dt);
      }
    }
  }
}

export function tickPlainsPath(world: World, dt: number, now: number): void {
  tickGrazingField(world, dt, now);
  tickTrampleAura(world);
  tickBoarChargeCooldowns(world, dt);
  tickVitalBurstReset(world, now);
}
