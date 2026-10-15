/**
 * Tracer, Lookout and Shade (bible §10.16 T2): the Slinger's answers to what hides.
 *
 * A traced target is one a Slinger's round has tagged: it can't hide (a burrow or cover that
 * would make it untargetable stays hittable) and ambushers in cover are revealed. It designates
 * and never stores damage. The tag is a timestamp in the target's server-only combat scratch, per
 * Slinger, so it is not a status effect and needs no status tile.
 */
import { getCounter, getResource, removeStatusEffect, setCounter, setResource, SUN_MARK_EFFECT_ID } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { momentTick } from '../../combat/moments/moments';
import { applyMonsterSlow } from '../../combat/status/monsterControl';

const tracedKey = (playerId: string) => `slinger.tracedUntil.${playerId}`;
const LOOKOUT_TICK = 'slinger.lookout.tick';
const SHADE_AT = 'slinger.shade.at';
/** How far an ambusher can be and still be "the one that sprang on you" (px). PLACEHOLDER. */
const AMBUSH_REACH_PX = 220;
/** How long Lookout's slow and reveal last (ms). PLACEHOLDER. */
const LOOKOUT_MS = 3_000;

export function traceTarget(player: PlayerEntity, target: MonsterEntity, until: number): void {
  setResource(target.tracksCombat, tracedKey(player.isPlayer.id), until);
}

export function isTracedBy(monster: MonsterEntity, playerId: string, now: number): boolean {
  return getResource(monster.tracksCombat, tracedKey(playerId)) > now;
}

/** A traced monster that went to ground stays a legal target: the cover is no use. */
export function revealTraced(world: World, player: PlayerEntity, now: number): void {
  for (const monster of world.concealedMonsters) {
    if (monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (monster.isConcealed.targetable === true || !isTracedBy(monster, player.isPlayer.id, now)) continue;
    monster.isConcealed.targetable = true;
  }
}

/** Lookout: the enemy that sprang on you while you reload is slowed and revealed. */
export function lookoutAmbusher(world: World, player: PlayerEntity, slowPct: number, now: number): void {
  const fired = momentTick(player, 'ambush');
  if (fired === undefined || fired < world.tickCounter - 1 || getCounter(player.tracksCombat, LOOKOUT_TICK) === fired + 1) return;
  setCounter(player.tracksCombat, LOOKOUT_TICK, fired + 1);
  const at = player.hasPosition.current;
  let nearest: MonsterEntity | undefined;
  let best = AMBUSH_REACH_PX;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetId !== player.isPlayer.id || monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    const d = Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y);
    if (d <= best) { best = d; nearest = monster; }
  }
  if (!nearest) return;
  applyMonsterSlow(world, nearest, slowPct, LOOKOUT_MS, player.isPlayer.id);
  traceTarget(player, nearest, now + LOOKOUT_MS);
}

/** The marks and slows a monster can put on a player, in the order Shade ends them. */
const MARK_OR_SLOW = [SUN_MARK_EFFECT_ID, 'slow'] as const;

/** Shade: every `everyMs` one mark or slow on you ends. */
export function shadeTick(player: PlayerEntity, everyMs: number, now: number): void {
  const cs = player.tracksCombat;
  if (now - getResource(cs, SHADE_AT) < everyMs) return;
  for (const id of MARK_OR_SLOW) {
    if (cs.statusEffects.some((effect) => effect.id === id && effect.stacks > 0)) {
      removeStatusEffect(cs, id);
      setResource(cs, SHADE_AT, now);
      return;
    }
  }
}
