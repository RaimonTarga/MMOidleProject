import {
  distanceSq,
  getStatusEffect,
  removeStatusEffect,
  type AggroTargetKind,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import { applyPlayerAoe } from '../../../../../combat/damage/aoeDamage';
import { alliesInNodeWithin } from '../../../../../world/queries';
import {
  BANNER_EFFECT,
  BANNER_REFRESH_MS,
  CORROSION_EFFECT,
  OVERWHELMED_EFFECT,
  WET_EFFECT,
} from '../core/constants';
import { hasWet } from '../core/selectors';
import {
  computeMinionAttackRange,
  minionBuffRadius,
} from '../../range';
import { livingMinions } from '../core/helpers';
import { applyPlayerDebuff } from '../../../../shared/applyPlayerDebuff';
import { applyPlayerMechanicBuff } from '../../../../shared/applyPlayerMechanicBuff';

type AggroSourceMeta = { id: string; kind: AggroTargetKind };

function isMinionAggroSource(metadata: Record<string, unknown>): boolean {
  const src = metadata.aggroSource as AggroSourceMeta | undefined;
  return src?.kind === 'minion';
}

function applyCorrosionStacks(
  monsterCs: NonNullable<MonsterEntity['tracksCombat']>,
  owner: PlayerEntity,
  stackCount: number,
): void {
  const passives = owner.usesSkills.passives;
  const cap = passives['summoner.acid-cap'] ?? 10;
  const durationMs = passives['summoner.acid-duration-ms'] ?? 8000;
  const platingPerStack = passives['summoner.acid-plating-per-stack'] ?? 2;

  for (let i = 0; i < stackCount; i++) {
    const eff = applyPlayerDebuff(owner, monsterCs, {
      id:           CORROSION_EFFECT,
      maxStacks:    cap,
      remainingMs:  durationMs,
      refreshable:  true,
      sourceId:     owner.isPlayer.id,
      data:         { platingPerStack },
    }, { origin: 'mechanic' });
    eff.data.platingPerStack = eff.data.platingPerStack ?? platingPerStack;
  }
}

/** Lurker death burst at `center` — AoE damage + corrosion on nearby monsters. */
function detonateAcidBroodAt(
  world: World,
  owner: PlayerEntity,
  center: Vec2,
  nodeId: string,
): void {
  const passives = owner.usesSkills.passives;
  const radius = passives['summoner.acid-explosion-radius'] ?? 80;
  const damagePct = passives['summoner.acid-explosion-damage-pct'] ?? 0.80;
  const spreadStacks = Math.max(1, Math.floor(passives['summoner.acid-explosion-corrosion-stacks'] ?? 2));
  const baseDamage = Math.max(1, Math.round(owner.dealsDamage.attack * damagePct));

  applyPlayerAoe(world, owner, center, radius, baseDamage);

  const radiusSq = radius * radius;
  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    if (distanceSq(monster.hasPosition.current, center) > radiusSq) continue;
    applyCorrosionStacks(monster.tracksCombat, owner, spreadStacks);
  }
}

/**
 * Acid Brood: when a cave-lurker dies (lifetime expiry, sponge damage, etc.),
 * it explodes once and splashes corrosion.
 */
export function tryAcidBroodMinionExplosion(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
): void {
  if (!owner.usesSkills.passives['summoner.acid-brood']) return;
  if (minion.isMinion.monsterTypeId !== 'cave-lurker') return;
  const cm = minion.controlsMinion;
  if (cm.acidDetonated) return;
  cm.acidDetonated = true;

  detonateAcidBroodAt(
    world,
    owner,
    minion.hasPosition.current,
    minion.hasPosition.nodeId,
  );
}

/**
 * Acid Brood: lurkers decay over time; at 0 HP they explode via the death handler.
 * Returns true if the minion was killed by decay this tick.
 */
export function tickAcidLurkerLifetime(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  dt: number,
): boolean {
  if (!owner.usesSkills.passives['summoner.acid-brood']) return false;
  if (minion.isMinion.monsterTypeId !== 'cave-lurker') return false;

  const passives = owner.usesSkills.passives;
  const cm = minion.controlsMinion;
  const lifetime = passives['summoner.acid-lurker-lifetime-ms'] ?? 12_000;

  if (cm.lifetimeRemainingMs === undefined) {
    cm.lifetimeRemainingMs = lifetime;
  }
  cm.lifetimeRemainingMs = Math.max(0, cm.lifetimeRemainingMs - dt);

  if (cm.lifetimeRemainingMs > 0) return false;

  tryAcidBroodMinionExplosion(world, owner, minion);
  minion.hasHealth.hp = 0;
  return true;
}

function resolveHowlBaseAttackCooldown(ally: PlayerEntity): number {
  const existing = getStatusEffect(ally.tracksCombat, BANNER_EFFECT);
  if (!existing) return ally.performsAttack.attackCooldown;

  const stacks = Math.floor(existing.data.stacks ?? 0);
  const perStack = existing.data.perStack ?? 0.05;
  const storedBase = existing.data.baseCd ?? ally.performsAttack.attackCooldown;
  const expectedModified = Math.max(
    200,
    Math.round(storedBase / (1 + stacks * perStack)),
  );

  if (expectedModified === ally.performsAttack.attackCooldown) {
    return storedBase;
  }
  return ally.performsAttack.attackCooldown;
}

function restoreHowlBaseAttackCooldown(ally: PlayerEntity): number {
  const existing = getStatusEffect(ally.tracksCombat, BANNER_EFFECT);
  if (!existing) return ally.performsAttack.attackCooldown;

  const baseCd = resolveHowlBaseAttackCooldown(ally);
  if (ally.performsAttack.attackCooldown !== baseCd) {
    ally.performsAttack.attackCooldown = baseCd;
  }
  return baseCd;
}

function applyHowlAttackSpeed(
  world: World,
  ally: PlayerEntity,
  stacks: number,
  perStack: number,
  baseCd: number,
): void {
  ally.performsAttack.attackCooldown = Math.max(
    200,
    Math.round(baseCd / (1 + stacks * perStack)),
  );
  markSliceDirty(world, ally, 'performsAttack');
}

export function tickPredatorsHowl(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.predators-howl']) continue;
    if (!owner.tracksCombat) continue;

    const cap = passives['summoner.howl-cap'] ?? 6;
    const perStack = passives['summoner.howl-pct-per-stack'] ?? 0.05;
    const minions = livingMinions(world, owner);
    if (minions.length === 0) continue;

    const scanRadius = computeMinionAttackRange(passives) * 4;
    const allies = alliesInNodeWithin(
      world,
      owner.hasPosition.current,
      owner.hasPosition.nodeId,
      scanRadius,
    );

    for (const ally of allies) {
      if (!ally.tracksCombat) continue;
      const stacks = minions.reduce((n, m) => {
        const r2 = minionBuffRadius(m) ** 2;
        return n + (distanceSq(m.hasPosition.current, ally.hasPosition.current) <= r2 ? 1 : 0);
      }, 0);
      if (stacks <= 0) {
        const hadBanner = getStatusEffect(ally.tracksCombat, BANNER_EFFECT);
        if (hadBanner) {
          restoreHowlBaseAttackCooldown(ally);
          markSliceDirty(world, ally, 'performsAttack');
        }
        removeStatusEffect(ally.tracksCombat, BANNER_EFFECT);
        continue;
      }

      const effectiveStacks = Math.min(stacks, cap);
      const baseCd = resolveHowlBaseAttackCooldown(ally);

      removeStatusEffect(ally.tracksCombat, BANNER_EFFECT);
      const banner = applyPlayerMechanicBuff(owner, ally.tracksCombat, {
        id:           BANNER_EFFECT,
        maxStacks:    cap,
        remainingMs:  BANNER_REFRESH_MS,
        refreshable:  true,
        sourceId:     owner.isPlayer.id,
        data:         { stacks: effectiveStacks, perStack, baseCd },
      });
      applyHowlAttackSpeed(
        world,
        ally,
        effectiveStacks,
        banner.data.perStack ?? perStack,
        baseCd,
      );
    }
  }
}

/** Swarm: re-project Overwhelmed stacks from live attacker count each tick. */
function countSwarmAttackersOnMonster(
  world: World,
  owner: PlayerEntity,
  monsterId: string,
): number {
  let count = 0;
  if (owner.hasAttackTarget?.targetId === monsterId) count++;

  const nodeId = owner.hasPosition.nodeId;
  for (const minion of world.minionEntities) {
    if (minion.isMinion.ownerPlayerId !== owner.isPlayer.id) continue;
    if (minion.hasPosition.nodeId !== nodeId) continue;
    if (minion.hasHealth.hp <= 0) continue;
    if (minion.controlsMinion.currentTargetId === monsterId) count++;
  }
  return count;
}

export function tickSwarmOverwhelmed(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.swarm']) continue;

    const perAttacker = passives['summoner.overwhelmed-pct-per-attacker'] ?? 0.10;
    const refreshMs = passives['summoner.overwhelmed-ms'] ?? 2000;
    const nodeId = owner.hasPosition.nodeId;

    for (const monster of world.monsterEntitiesInNode(nodeId)) {
      if (monster.hasHealth.hp <= 0) continue;
      const attackers = countSwarmAttackersOnMonster(
        world,
        owner,
        monster.isMonster.id,
      );

      removeStatusEffect(monster.tracksCombat, OVERWHELMED_EFFECT);
      if (attackers <= 0) continue;

      const eff = applyPlayerDebuff(owner, monster.tracksCombat, {
        id:           OVERWHELMED_EFFECT,
        maxStacks:    attackers,
        remainingMs:  refreshMs,
        refreshable:  true,
        sourceId:     owner.isPlayer.id,
        data:         { perAttacker },
      }, { origin: 'mechanic' });
      eff.stacks = attackers;
    }
  }
}

export function registerCavePathHooks(): void {
  registerCombatListener('beforeAttack', (ctx) => {
    if (ctx.defenderType !== 'monster') return;

    const corrosion = getStatusEffect(ctx.defender.tracksCombat, CORROSION_EFFECT);
    if (corrosion && corrosion.stacks > 0) {
      const perStack = corrosion.data.platingPerStack ?? 2;
      ctx.metadata.platingShred = (ctx.metadata.platingShred as number ?? 0) + corrosion.stacks * perStack;
    }

    if (hasWet(ctx.defender.tracksCombat)) {
      ctx.metadata.consumeWet = true;
    }
  });

  registerCombatListener('onHit', (ctx) => {
    if (ctx.defenderType === 'monster') {
      const overwhelmed = getStatusEffect(ctx.defender.tracksCombat, OVERWHELMED_EFFECT);
      if (overwhelmed && overwhelmed.stacks > 0) {
        const perAttacker = overwhelmed.data.perAttacker ?? 0.10;
        ctx.damage = Math.round(ctx.damage * (1 + overwhelmed.stacks * perAttacker));
      }

      if (hasWet(ctx.defender.tracksCombat)) {
        const wet = getStatusEffect(ctx.defender.tracksCombat, WET_EFFECT);
        const wetPct = wet?.data.wetPct ?? 0.25;
        ctx.damage = Math.round(ctx.damage * (1 + wetPct));
      }
    }
  });

  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;

    if (ctx.metadata.consumeWet) {
      removeStatusEffect(ctx.defender.tracksCombat, WET_EFFECT);
    }

    if (!isMinionAggroSource(ctx.metadata)) return;
    if (evadeBlocksDebuffs(ctx)) return; // dodged hit plants no corrosion

    const passives = ctx.attacker.usesSkills.passives;

    if (passives['summoner.acid-brood']) {
      applyCorrosionStacks(ctx.defender.tracksCombat, ctx.attacker, 1);
    }
  });
}

export function tickCavePath(world: World): void {
  tickPredatorsHowl(world);
  tickSwarmOverwhelmed(world);
}
