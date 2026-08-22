import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { actorFromPlayer } from "../../../world/worldLogActors";
import { stampBarrierDamage } from "./barrier";

/**
 * Wards: temporary absorb pools, the counterpart to the permanent barrier.
 *
 * A ward is explicitly timed and use-it-or-lose-it, so it spends BEFORE the
 * barrier — otherwise a ward that expired unspent while the barrier soaked the
 * damage would be pure waste. Multiple wards stack and drain oldest-first.
 *
 * Overheal (`defense.overheal-ward-pct`) is currently the only source.
 */

/**
 * Apply a ward to a player.
 *
 * @param amount     Absorb HP. Caller is responsible for scaling by maxHp if needed.
 * @param durationMs Duration in ms. 0 or negative = lasts until fully depleted.
 */
export function applyWard(
  world: World,
  player: PlayerEntity,
  amount: number,
  durationMs: number,
): void {
  if (amount <= 0) return;
  const ward = {
    amount,
    maxAmount: amount,
    remainingMs: durationMs > 0 ? durationMs : -1,
  };
  if (player.holdsWards) {
    player.holdsWards.wards.push(ward);
  } else {
    attachComponent(world, player, "holdsWards", { wards: [ward] });
  }
  recordWorldLogEvent(
    world,
    {
      kind: "ward-gain",
      nodeId: player.hasPosition.nodeId,
      target: actorFromPlayer(player),
      amount,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

/**
 * Convenience: apply a ward sized as a fraction of the player's max HP.
 * e.g. applyWardPercent(player, 0.20, 5000) → 20% maxHp ward for 5 s.
 */
export function applyWardPercent(
  world: World,
  player: PlayerEntity,
  pct: number,
  durationMs: number,
): void {
  applyWard(world, player, Math.round(player.hasHealth.maxHp * pct), durationMs);
}

/**
 * Tick ward timers and remove expired ones.
 * Call once per world tick, before combat resolution, so wards that expire
 * mid-tick are gone before they can absorb damage in that tick.
 */
export function updateWards(world: World, dt: number): void {
  for (const player of world.wardedPlayers) {
    const wards = player.holdsWards.wards;

    for (const ward of wards) {
      if (ward.remainingMs > 0) {
        ward.remainingMs = Math.max(0, ward.remainingMs - dt);
      }
    }

    const active = wards.filter(
      (w) => w.amount > 0 && (w.remainingMs === -1 || w.remainingMs > 0),
    );
    if (active.length > 0) {
      player.holdsWards.wards = active;
    } else {
      detachComponent(world, player, "holdsWards");
    }
  }
}

/**
 * Drain `damage` off the player's ward stack (oldest first), mutating each ward's
 * `amount` and dropping emptied wards. Returns the post-absorb damage, the amount
 * absorbed, and the summed max of any wards this drain fully broke (the
 * break-heal trigger). Shared by the direct-hit listener and the DoT tick path so
 * both deplete wards identically. The `holdsWards` component is left in place when
 * fully drained (empty array) — `updateWards` detaches it on the next tick.
 */
export function drainWards(
  player: PlayerEntity,
  damage: number,
): { damage: number; absorbed: number; brokenMax: number } {
  const component = player.holdsWards;
  if (!component || damage <= 0) return { damage, absorbed: 0, brokenMax: 0 };

  let remaining = damage;
  let absorbed = 0;
  let brokenMax = 0;
  for (const ward of component.wards) {
    if (remaining <= 0) break;
    const block = Math.min(ward.amount, remaining);
    ward.amount -= block;
    remaining -= block;
    absorbed += block;
    if (block > 0 && ward.amount <= 0) brokenMax += ward.maxAmount;
  }
  component.wards = component.wards.filter((w) => w.amount > 0);
  return { damage: Math.max(0, remaining), absorbed, brokenMax };
}

/**
 * Register the ward-absorption listener on `onDamageTaken`. Registered BEFORE the
 * barrier listener so wards spend first.
 */
export function registerWardAbsorb(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player") return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender;
    if (!player.holdsWards) return;

    const result = drainWards(player, ctx.damage);
    ctx.damage = result.damage;
    if (result.absorbed > 0) {
      ctx.metadata["absorbed"] = Number(ctx.metadata["absorbed"] ?? 0) + result.absorbed;
      // A ward soaking the whole hit still counts as being hit, and the barrier
      // listener's own stamp is skipped once damage reaches zero.
      stampBarrierDamage(world, player);
    }
    if (result.brokenMax > 0) ctx.metadata["wardBrokenMax"] = result.brokenMax;
  });
}
