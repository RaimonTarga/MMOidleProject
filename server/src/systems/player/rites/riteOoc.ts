import { isHarmfulPlayerStatusEffect } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { applyHealToPlayer } from "../../defense/regen/healing";
import { abilityCooldownKey } from "../abilities/abilityCooldowns";

const MECHANIC_RENEWAL_FRACTION = 0.3;
const ABILITY_REPRIEVE_FRACTION = 0.3;
const BLOOD_OFFERING_MAX_HP_FRACTION = 0.05;

function hasRite(player: PlayerEntity, riteId: string): boolean {
  return player.tracksProgression.equippedRites?.includes(riteId) ?? false;
}

/** Shared post-combat timeout. Opposed timing Rites cancel when both are equipped. */
export function combatExitDelay(player: PlayerEntity, baseMs: number): number {
  let multiplier = 1;
  if (hasRite(player, "lingering-battle")) multiplier += 0.5;
  if (hasRite(player, "swift-repose")) multiplier -= 0.5;
  return Math.max(250, baseMs * multiplier);
}

function purify(player: PlayerEntity): void {
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((effect) => {
    if (!isHarmfulPlayerStatusEffect(effect.id, effect.data)) return true;
    // Active terrain/zone owners remain authoritative and will remove their own status
    // when the player exits. Purification removes carried monster/player effects only.
    return effect.sourceId.startsWith("node-feature:") || effect.sourceId.startsWith("ground-zone:");
  });
}

function renewClassMechanic(world: World, player: PlayerEntity): void {
  switch (player.usesSkills.combatArchetype) {
    case "cooldown":
      if (player.usesCooldown) {
        player.usesCooldown.executionCooldownMs *= 1 - MECHANIC_RENEWAL_FRACTION;
        markSliceDirty(world, player, "usesCooldown");
      }
      break;
    case "energy":
      if (player.usesEnergy) {
        player.usesEnergy.energy = Math.min(
          player.usesEnergy.energyMax,
          player.usesEnergy.energy + player.usesEnergy.energyMax * MECHANIC_RENEWAL_FRACTION,
        );
        markSliceDirty(world, player, "usesEnergy");
      }
      break;
    case "reload":
      if (player.usesReload) {
        player.usesReload.ammo = Math.min(
          player.usesReload.ammoMax,
          player.usesReload.ammo + Math.ceil(player.usesReload.ammoMax * MECHANIC_RENEWAL_FRACTION),
        );
        player.usesReload.reloadingMs *= 1 - MECHANIC_RENEWAL_FRACTION;
        markSliceDirty(world, player, "usesReload");
      }
      break;
    case "cadence":
      if (player.usesCadence) {
        player.usesCadence.count = Math.min(
          Math.max(0, player.usesCadence.threshold - 1),
          player.usesCadence.count + Math.ceil(player.usesCadence.threshold * MECHANIC_RENEWAL_FRACTION),
        );
        markSliceDirty(world, player, "usesCadence");
      }
      break;
    case "summoner": {
      const active = player.summonsMinions?.activeReconstruction;
      if (active) {
        active.elapsedMs = Math.min(active.durationMs, active.elapsedMs + active.durationMs * MECHANIC_RENEWAL_FRACTION);
        markSliceDirty(world, player, "summonsMinions");
      }
      break;
    }
    // DoT has no portable player-side preparation state in v1.
    case "dot":
    default:
      break;
  }
}

function reprieveAbilities(player: PlayerEntity): void {
  const equipped = player.tracksProgression.equippedAbilities;
  for (const abilityId of [...(equipped?.techniques ?? []), ...(equipped?.guards ?? [])]) {
    const key = abilityCooldownKey(abilityId);
    if ((player.tracksCombat.cooldowns[key] ?? 0) > 0) {
      player.tracksCombat.cooldowns[key] *= 1 - ABILITY_REPRIEVE_FRACTION;
    }
  }
}

/** Runs exactly once when POST_COMBAT becomes OUT_OF_COMBAT. */
export function applyCombatEndRites(world: World, player: PlayerEntity): void {
  if (hasRite(player, "purification")) purify(player);
  if (hasRite(player, "mechanic-renewal")) renewClassMechanic(world, player);
  if (hasRite(player, "ability-reprieve")) reprieveAbilities(player);
}

export function initRiteListeners(): void {
  registerCombatListener("onKill", (ctx, world) => {
    if (ctx.attackerType !== "player" || !hasRite(ctx.attacker, "blood-offering")) return;
    applyHealToPlayer(
      ctx.attacker,
      ctx.attacker.tracksCombat,
      ctx.attacker.hasHealth.maxHp * BLOOD_OFFERING_MAX_HP_FRACTION,
      world,
    );
  });
}
