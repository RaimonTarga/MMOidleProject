/**
 * Keystone area hits that land LATER — Whirlwind's spin ticks and Aftershock's
 * second eruption (design §22.4).
 *
 * THE MACHINERY. The channelled beam's (`cooldown/t3/ticks/heavy/channeledBeam.ts`):
 * a component carrying what is left to land, drained by `dt` every logic tick,
 * landing each hit as its clock runs out, broken by hard control, and detached
 * the moment nothing is left. What it lands is NOT the beam's attack pipeline: a
 * keystone hit resolves through `applyPlayerAoe` — the authoritative splash seam
 * Sweep's cleave and Slam's payload use — which emits no attack event. So a
 * keystone hit pays plating and DR, feeds kill credit, rewards and the world log
 * like every area payload, and is never an attack-equivalent (Sweep's Tempo
 * counts `afterHit`) nor a hit the weapon verb's `hit-nth` counter sees (`onHit`).
 *
 * Runs from `World.tick` right after the cast lifecycle, so a hit that comes due
 * this tick lands before combat resolves, as a completed cast does.
 */
import type { Vec2 } from '@mmo-idle/shared';
import type { PlayerEntity, ScheduledKeystoneHit } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import { applyPlayerAoe } from '../../damage/aoeDamage';
import { isHardControlled } from '../../status/playerHardControl';

/** Schedule one keystone area hit on the player. */
export function scheduleKeystoneHit(world: World, player: PlayerEntity, hit: ScheduledKeystoneHit): void {
  const pending = player.schedulesKeystoneHits?.hits ?? [];
  attachComponent(world, player, 'schedulesKeystoneHits', { hits: [...pending, { ...hit }] });
}

/** Drop every pending hit of one verb (a new spin replaces the old one). */
export function cancelKeystoneHits(world: World, player: PlayerEntity, keystoneId: string): void {
  const state = player.schedulesKeystoneHits;
  if (!state) return;
  state.hits = state.hits.filter((hit) => hit.keystoneId !== keystoneId);
  if (state.hits.length === 0) detachComponent(world, player, 'schedulesKeystoneHits');
}

/** The pending hits of one verb, for a test or a readout. */
export function pendingKeystoneHits(player: PlayerEntity, keystoneId?: string): readonly ScheduledKeystoneHit[] {
  const hits = player.schedulesKeystoneHits?.hits ?? [];
  return keystoneId ? hits.filter((hit) => hit.keystoneId === keystoneId) : hits;
}

/** The area a hit lands on: its fixed spot, else around the owner as they stand now. */
function landingPoint(player: PlayerEntity, hit: ScheduledKeystoneHit): Vec2 {
  return hit.at ? { ...hit.at } : { ...player.hasPosition.current };
}

function land(world: World, player: PlayerEntity, hit: ScheduledKeystoneHit): void {
  const at = landingPoint(player, hit);
  // The ground the hit actually covered — the existing area grammar, drawn from
  // the same centre and radius the resolution queries.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-aoe-footprint',
    playerId: player.isPlayer.id,
    pos: at,
    radius: hit.radius,
  });
  if (hit.fxOnLand) {
    world.pushEvent(player.hasPosition.nodeId, {
      kind: 'card-fx',
      playerId: player.isPlayer.id,
      fx: hit.fxOnLand,
      pos: { ...player.hasPosition.current },
      targetPos: at,
      // The verb that landed, for its bespoke animation's payoff (design §22.7).
      keystone: hit.keystoneId,
    });
  }
  applyPlayerAoe(
    world, player, at, hit.radius, hit.damage, undefined, 'player', {},
    // A keystone hit is the wielder's own damage, so it converts into the weapon
    // reservoir like the swing or the cast it extends — Sweep's cleave and Slam's
    // payload both do.
    { feedsWeaponReservoir: true },
  );
}

/**
 * Advance every pending keystone hit by `dt`. A dead player's hits are dropped
 * (nothing lands for a corpse), a hit whose owner left its node is dropped, and
 * an interruptible hit is dropped the moment its owner is hard-controlled — the
 * spin breaks like a cast does.
 */
export function updateScheduledKeystoneHits(world: World, dt: number): void {
  for (const player of world.playerEntities) {
    const state = player.schedulesKeystoneHits;
    if (!state) continue;
    if (player.isDead || player.hasHealth.hp <= 0) {
      detachComponent(world, player, 'schedulesKeystoneHits');
      continue;
    }
    const controlled = isHardControlled(player.tracksCombat);
    const remaining: ScheduledKeystoneHit[] = [];
    const due: ScheduledKeystoneHit[] = [];
    for (const hit of state.hits) {
      if (hit.nodeId !== player.hasPosition.nodeId) continue;
      if (hit.interruptible && controlled) continue;
      hit.dueInMs -= dt;
      (hit.dueInMs <= 0 ? due : remaining).push(hit);
    }
    // Written back before landing: a landing can kill, and a kill can schedule.
    state.hits = remaining;
    for (const hit of due) land(world, player, hit);
    if ((player.schedulesKeystoneHits?.hits.length ?? 0) === 0) {
      detachComponent(world, player, 'schedulesKeystoneHits');
    }
  }
}
