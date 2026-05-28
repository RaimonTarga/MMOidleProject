import {
  applyStatusEffect,
  distanceSq,
  getStatusEffect,
  removeStatusEffect,
  type AggroTargetKind,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyPlayerAoe } from '../../../../../combat/damage/aoeDamage';
import { alliesInNodeWithin } from '../../../../../world/queries';
import {
  BANNER_EFFECT,
  BANNER_REFRESH_MS,
  CORROSION_EFFECT,
  WEB_EFFECT,
  WET_EFFECT,
} from '../core/constants';
import { hasWet } from '../core/selectors';
import { livingMinions } from '../core/helpers';

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
    const eff = applyStatusEffect(monsterCs, {
      id:           CORROSION_EFFECT,
      maxStacks:    cap,
      remainingMs:  durationMs,
      refreshable:  true,
      sourceId:     owner.isPlayer.id,
      data:         { platingPerStack },
    });
    eff.data.platingPerStack = platingPerStack;
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

export function tickPredatorsHowl(world: World): void {
  for (const owner of world.summonerPlayers) {
    const passives = owner.usesSkills.passives;
    if (!passives['summoner.predators-howl']) continue;
    if (!owner.tracksCombat) continue;

    const radius = passives['summoner.howl-radius'] ?? 120;
    const cap = passives['summoner.howl-cap'] ?? 6;
    const minions = livingMinions(world, owner);
    if (minions.length === 0) continue;

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
      const stacks = minions.reduce((n, m) => {
        return n + (distanceSq(m.hasPosition.current, ally.hasPosition.current) <= r2 ? 1 : 0);
      }, 0);
      if (stacks <= 0) {
        removeStatusEffect(ally.tracksCombat, BANNER_EFFECT);
        continue;
      }
      removeStatusEffect(ally.tracksCombat, BANNER_EFFECT);
      applyStatusEffect(ally.tracksCombat, {
        id:           BANNER_EFFECT,
        maxStacks:    cap,
        remainingMs:  BANNER_REFRESH_MS,
        refreshable:  true,
        sourceId:     owner.isPlayer.id,
        data:         { stacks: Math.min(stacks, cap) },
      });
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
    if (ctx.attackerType === 'player' && ctx.defenderType === 'monster') {
      const eff = getStatusEffect(ctx.attacker.tracksCombat, BANNER_EFFECT);
      if (eff) {
        const stacks = Math.floor(eff.data.stacks ?? 0);
        if (stacks > 0) {
          const perStack = ctx.attacker.usesSkills.passives['summoner.howl-pct-per-stack'] ?? 0.05;
          ctx.damage = Math.round(ctx.damage * (1 + stacks * perStack));
        }
      }
    }

    if (ctx.defenderType === 'monster') {
      const web = getStatusEffect(ctx.defender.tracksCombat, WEB_EFFECT);
      if (web && web.stacks > 0) {
        const perStack = web.data.perStack ?? 0.06;
        ctx.damage = Math.round(ctx.damage * (1 + web.stacks * perStack));
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

    const passives = ctx.attacker.usesSkills.passives;

    if (passives['summoner.web-of-the-hunt']) {
      const cap = passives['summoner.web-cap'] ?? 8;
      const perStack = passives['summoner.web-pct-per-stack'] ?? 0.06;
      applyStatusEffect(ctx.defender.tracksCombat, {
        id:           WEB_EFFECT,
        maxStacks:    cap,
        remainingMs:  passives['summoner.web-ms'] ?? 6000,
        refreshable:  true,
        sourceId:     ctx.attacker.isPlayer.id,
        data:         { perStack },
      });
    }

    if (passives['summoner.acid-brood']) {
      applyCorrosionStacks(ctx.defender.tracksCombat, ctx.attacker, 1);
    }
  });
}

export function tickCavePath(world: World): void {
  tickPredatorsHowl(world);
}
