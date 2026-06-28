import type { Vec2 } from '@mmo-idle/shared';
import { getCounter, resetCounter, setCounter } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { runPlayerAttack } from '../../../../../combat/engine/combat';
import { applyKnockback, applyPlayerKnockback } from '../../../../../combat/damage/knockback';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import {
  BLUNDERBUSS_VOLLEY_HITS_COUNTER,
  DEFAULT_BLUNDERBUSS_KNOCKBACK_DIST_PER_PELLET,
  DEFAULT_BLUNDERBUSS_KNOCKBACK_MS_PER_PELLET,
  DEFAULT_BLUNDERBUSS_SELF_KNOCKBACK_DIST,
  DEFAULT_BLUNDERBUSS_SPREAD_RAD,
} from '../core/constants';

/**
 * Scatter a pellet through the shotgun cone. Both the angle (within ±spread/2)
 * and the travel distance are randomized per pellet so the volley reads as a
 * chaotic blast rather than an ordered fan. Damage still hits the real target.
 */
export function blunderbussAimPos(from: Vec2, to: Vec2, spreadRad: number): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const baseAngle = Math.atan2(dy, dx);
  const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
  const visualLen = len * (0.7 + Math.random() * 0.85) + (15 + Math.random() * 45);
  return {
    x: from.x + Math.cos(angle) * visualLen,
    y: from.y + Math.sin(angle) * visualLen,
  };
}

function fireBlunderbussPellet(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  now: number,
  opts: {
    attackOrigin: Vec2;
    aggroSource: { id: string; kind: 'player' | 'minion' };
    spreadRad: number;
    pelletIndex: number;
    pelletTotal: number;
    isLastPellet: boolean;
  },
): void {
  if (target.hasHealth.hp <= 0) return;

  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  runPlayerAttack(world, player, target, now, {
    attackOrigin: opts.attackOrigin,
    aggroSource: opts.aggroSource,
    metadata: {
      blunderbussPellet: true,
      blunderbussPelletIndex: opts.pelletIndex,
      blunderbussPelletTotal: opts.pelletTotal,
      blunderbussLastPellet: opts.isLastPellet,
      aimPos: blunderbussAimPos(from, to, opts.spreadRad),
      // Aesthetic-only crits on every pellet (yellow "!" + tracer).
      empoweredAttack: true,
    },
  });
}

function resolveBlunderbussKnockback(hits: number, passives: Record<string, number | undefined>): {
  distance: number;
  durationMs: number;
} {
  const distPer =
    passives['reload.blunderbuss-knockback-distance-per-pellet'] ??
    DEFAULT_BLUNDERBUSS_KNOCKBACK_DIST_PER_PELLET;
  const msPer =
    passives['reload.blunderbuss-knockback-ms-per-pellet'] ??
    DEFAULT_BLUNDERBUSS_KNOCKBACK_MS_PER_PELLET;
  return {
    distance: hits * distPer,
    durationMs: Math.min(450, Math.max(120, hits * msPer)),
  };
}

export function registerBlunderbussVolley(): void {
  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (ctx.metadata['blunderbussPellet'] !== true) return;

    const damageMult = ctx.attacker.usesSkills.passives['reload.blunderbuss-damage-mult'] ?? 0;
    if (damageMult === 0) return;
    ctx.damage = Math.max(0, Math.round(ctx.damage * Math.max(0, 1 + damageMult)));
  });

  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (ctx.metadata['blunderbussPellet'] !== true) return;
    if (ctx.damage <= 0) return;

    const player = ctx.attacker;
    const target = ctx.defender;
    const combatState = player.tracksCombat;
    if (!combatState) return;

    const hits = getCounter(combatState, BLUNDERBUSS_VOLLEY_HITS_COUNTER) + 1;
    setCounter(combatState, BLUNDERBUSS_VOLLEY_HITS_COUNTER, hits);

    const volleyEnds =
      ctx.metadata['blunderbussLastPellet'] === true || target.hasHealth.hp <= 0;
    if (volleyEnds) {
      const passives = player.usesSkills.passives;
      const { distance, durationMs } = resolveBlunderbussKnockback(hits, passives);
      if (distance > 0 && target.hasHealth.hp > 0) {
        applyKnockback(
          world,
          target.isMonster.id,
          player.hasPosition.current,
          distance,
          durationMs,
        );
      }
      // Recoil the shooter a fixed distance opposite the firing direction so
      // the volley reads as having real force behind it. Fires every volley,
      // independent of whether the target survived. The client owns own-player
      // prediction and ignores small authoritative shifts while moving, so emit
      // a player-knockback event to force it to slide to the recoil position.
      const recoilEnd = applyPlayerKnockback(
        world,
        player,
        target.hasPosition.current,
        DEFAULT_BLUNDERBUSS_SELF_KNOCKBACK_DIST,
      );
      if (recoilEnd) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind: 'player-knockback',
          playerId: player.isPlayer.id,
          pos: recoilEnd,
        });
      }
      resetCounter(combatState, BLUNDERBUSS_VOLLEY_HITS_COUNTER);
    }

    const remaining = ctx.metadata['blunderbussRemaining'];
    if (typeof remaining !== 'number' || remaining <= 0) return;

    const spreadRad =
      player.usesSkills.passives['reload.blunderbuss-spread-rad'] ??
      DEFAULT_BLUNDERBUSS_SPREAD_RAD;

    const aggroSource = ctx.metadata.aggroSource as
      | { id: string; kind: 'player' | 'minion' }
      | undefined;
    const attackOrigin = player.hasPosition.current;
    const now = Date.now();
    const currentIndex =
      typeof ctx.metadata['blunderbussPelletIndex'] === 'number'
        ? ctx.metadata['blunderbussPelletIndex']
        : 0;
    const pelletTotal =
      typeof ctx.metadata['blunderbussPelletTotal'] === 'number'
        ? ctx.metadata['blunderbussPelletTotal']
        : remaining + 1;

    ctx.metadata['blunderbussRemaining'] = 0;

    for (let i = 0; i < remaining; i++) {
      if (target.hasHealth.hp <= 0) break;
      fireBlunderbussPellet(world, player, target, now, {
        attackOrigin,
        aggroSource: aggroSource ?? { id: player.isPlayer.id, kind: 'player' },
        spreadRad,
        pelletIndex: currentIndex + i + 1,
        pelletTotal,
        isLastPellet: i === remaining - 1,
      });
    }
  });

  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['blunderbussVolleyTrigger'] !== true) return;
    ctx.metadata['blunderbussVolleyTrigger'] = false;
    ctx.metadata['pendingReloadStart'] = true;
  });
}
