import { GAME_CONFIG, getResource, setResource, type TracksCombat } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { mutateSlice } from "../../../ecs/dirtyHelpers";
import { registerCombatListener } from "../../combat/engine/combatPipeline";

/**
 * The barrier: a permanent absorb pool worth `defense.barrier-pct × maxHp` that
 * sits in front of HP at all times.
 *
 * It has no duration and no application interval. Instead it refills once the
 * player has gone `defense.barrier-delay-ms` (default 4 s) without taking damage,
 * at `defense.barrier-recharge-pct` of its MAX per second (default 25% → four
 * seconds from empty to full). Direct hits and DoT ticks both restart the delay,
 * so in sustained combat the barrier is a per-engagement buffer that recharges
 * between packs rather than a throughput stat.
 *
 * `HasBarrier` presence gates the entire mechanic — it is attached, resized and
 * detached by {@link syncBarrier} at stat recalc, so nothing downstream needs to
 * re-read the passive.
 */

/**
 * Milliseconds since the player last took damage, as an accumulator rather than a
 * timestamp: the pipeline listener resets it to 0 (it has no clock) and the tick
 * adds `dt`. Deterministic and tick-rate independent.
 */
const UNDAMAGED_KEY = "barrierUndamagedMs";

/**
 * Shared cooldown for the barrier-break riders (break heal + damage-cap refill).
 * Barrier depletion is a routine event under the recharge model; without this
 * gate a barrier flickering at zero would fire them every tick.
 */
export const BARRIER_RIDER_CD = "barrierBreakRider";

export function barrierDelayMs(player: PlayerEntity): number {
  const authored = player.usesSkills.passives["defense.barrier-delay-ms"] ?? 0;
  return authored > 0 ? authored : GAME_CONFIG.BARRIER_DELAY_MS;
}

export function barrierRechargePct(player: PlayerEntity): number {
  const authored = player.usesSkills.passives["defense.barrier-recharge-pct"] ?? 0;
  return authored > 0 ? authored : GAME_CONFIG.BARRIER_RECHARGE_PCT;
}

export function getUndamagedMs(cs: TracksCombat): number {
  return getResource(cs, UNDAMAGED_KEY);
}

/**
 * Record that the player just took damage: restart the recharge delay and stop
 * any refill in progress. Called from BOTH damage paths — the direct-hit listener
 * below and the DoT tick in `dotPrototype` — including when the barrier itself
 * absorbed nothing (a bypass DoT, or an empty pool). Missing either call site
 * would let a burning player recharge straight through the burn.
 */
export function stampBarrierDamage(world: World, player: PlayerEntity): void {
  setResource(player.tracksCombat, UNDAMAGED_KEY, 0);
  if (player.hasBarrier?.recharging) {
    mutateSlice(world, player, "hasBarrier", (slice) => { slice.recharging = false; });
  }
}

/**
 * Drain `damage` off the barrier. Returns the post-absorb damage, the amount
 * absorbed, and whether THIS drain emptied a pool that had something in it (the
 * break-rider trigger). Does not stamp the delay — callers do that unconditionally
 * via {@link stampBarrierDamage}, because a hit that the barrier could not absorb
 * still counts as being hit.
 */
export function drainBarrier(
  world: World,
  player: PlayerEntity,
  damage: number,
): { damage: number; absorbed: number; emptied: boolean } {
  const barrier = player.hasBarrier;
  if (!barrier || damage <= 0 || barrier.current <= 0) {
    return { damage, absorbed: 0, emptied: false };
  }
  const absorbed = Math.min(barrier.current, damage);
  mutateSlice(world, player, "hasBarrier", (slice) => { slice.current -= absorbed; });
  return {
    damage: Math.max(0, damage - absorbed),
    absorbed,
    emptied: barrier.current <= 0,
  };
}

/** Refill the barrier to full. Used on spawn/respawn/node entry and by the damage-cap rider. */
export function refillBarrier(world: World, player: PlayerEntity): void {
  const barrier = player.hasBarrier;
  if (!barrier || barrier.current >= barrier.max) return;
  mutateSlice(world, player, "hasBarrier", (slice) => {
    slice.current = slice.max;
    slice.recharging = false;
  });
  setResource(player.tracksCombat, UNDAMAGED_KEY, 0);
}

/**
 * Attach, resize or detach the barrier to match the player's current passives and
 * max HP. Called from `recalculatePlayerEntityStats`, which is the ONLY place the
 * pool's size is decided — gear swaps, level-ups and class affinities all move
 * `maxHp`, and a second sizing site would silently desync the pool from its
 * percentage.
 *
 * A newly attached barrier starts full (it is never persisted).
 */
export function syncBarrier(world: World, player: PlayerEntity): void {
  const pct = player.usesSkills?.passives["defense.barrier-pct"] ?? 0;
  const max = pct > 0 ? Math.round(player.hasHealth.maxHp * pct) : 0;

  if (max <= 0) {
    if (player.hasBarrier) detachComponent(world, player, "hasBarrier");
    return;
  }
  if (!player.hasBarrier) {
    attachComponent(world, player, "hasBarrier", { current: max, max, recharging: false });
    return;
  }
  const barrier = player.hasBarrier;
  if (barrier.max === max) return;
  mutateSlice(world, player, "hasBarrier", (slice) => {
    slice.max = max;
    slice.current = Math.min(slice.current, max);
  });
}

/**
 * Per-tick recharge. Accumulates undamaged time and, past the delay, refills at a
 * dt-scaled fraction of MAX per second.
 *
 * Every write is guarded by an actual-change check: `current` moves on each of the
 * ~40 ticks a full refill takes, and marking the slice dirty when nothing changed
 * would put the barrier on the wire every tick for the rest of the session.
 */
export function runBarrierRecharge(world: World, player: PlayerEntity, dt: number): void {
  const cs = player.tracksCombat;
  const undamaged = getUndamagedMs(cs) + dt;
  setResource(cs, UNDAMAGED_KEY, undamaged);

  const barrier = player.hasBarrier;
  if (!barrier) return;

  const ready = undamaged >= barrierDelayMs(player);
  const full = barrier.current >= barrier.max;

  if (!ready || full) {
    if (barrier.recharging) {
      mutateSlice(world, player, "hasBarrier", (slice) => { slice.recharging = false; });
    }
    return;
  }

  const gain = barrier.max * barrierRechargePct(player) * (dt / 1000);
  const next = Math.min(barrier.max, barrier.current + gain);
  if (next === barrier.current && barrier.recharging) return;
  mutateSlice(world, player, "hasBarrier", (slice) => {
    slice.current = next;
    slice.recharging = next < slice.max;
  });
}

/**
 * Register the barrier absorb listener on `onDamageTaken`. Runs AFTER the ward
 * listener — wards are use-it-or-lose-it, so they spend first and the barrier is
 * the standing layer underneath.
 *
 * Adds into the shared `absorbed` metadata (the client renders one blue number for
 * all absorb pools) and reports its own emptied-pool event separately so the break
 * riders can tell a barrier bottoming out from a ward breaking.
 */
export function registerBarrierAbsorb(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player") return;
    // Zero damage here means the hit was fully evaded, fully capped away, or
    // entirely soaked by a ward. The first two are not "being hit" and must not
    // restart the delay; the third is, and the ward listener stamps it itself.
    if (ctx.damage <= 0) return;

    const player = ctx.defender;
    // Any damage that survives to the defense layer restarts the delay, including
    // a hit the barrier is empty for.
    stampBarrierDamage(world, player);

    const result = drainBarrier(world, player, ctx.damage);
    if (result.absorbed > 0) {
      ctx.metadata["absorbed"] = Number(ctx.metadata["absorbed"] ?? 0) + result.absorbed;
    }
    if (result.emptied) ctx.metadata["barrierEmptied"] = true;
    ctx.damage = result.damage;
  });
}
