/**
 * Ability cooldown keys and modifiers.
 *
 * Split out from `abilityFiring.ts` so the firing driver and the cast driver can
 * both use them without an import cycle.
 */
import {
  TECHNIQUE_TEMPO_MIN_CYCLE_MS,
  abilityTempoRefundMs,
  modifiedAbilityCooldownMs,
  setCooldown,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/**
 * Cooldowns are keyed PER ABILITY, not per slot: with two Technique slots a
 * fixed `ability.technique.cd` would let a loadout swap dodge the cooldown and
 * would couple two independent abilities' rhythms together.
 */
export function abilityCooldownKey(abilityId: string): string {
  return `ability.cd.${abilityId}`;
}

/**
 * The Tempo minimum-cycle guard, as an ordinary cooldown so it decays with real
 * time in `tickCooldowns` and needs no wall-clock timestamp of its own.
 *
 * Kept SEPARATE from the real cooldown rather than folded into it because it
 * answers a different question: the cooldown is "how long until ready", this is
 * "how far down may Tempo push that". Tempo never touches this key, so it is an
 * honest record of time elapsed since the last activation.
 */
export function abilityTempoFloorKey(abilityId: string): string {
  return `ability.tempo.floor.${abilityId}`;
}

/**
 * Accumulated fractional attack-equivalents owed to this ability, on `resources`
 * because it is a float pool rather than a whole count. Carried across
 * activations so a Slinger's part-finished clip is never silently discarded.
 *
 * Like every other `TracksCombat` key it is wiped wholesale by
 * `resetTracksCombat` on death and node teardown, so no bespoke cleanup exists.
 */
export function abilityTempoProgressKey(abilityId: string): string {
  return `ability.tempo.progress.${abilityId}`;
}

/** Both firing channels use the same tag-based equipment modifiers as the UI. */
export function techniqueCooldownMs(player: PlayerEntity, ability: AbilityDef): number {
  return modifiedAbilityCooldownMs(ability, player.tracksProgression.playerTier, player.usesSkills.passives);
}

export function guardCooldownMs(player: PlayerEntity, ability: AbilityDef): number {
  return modifiedAbilityCooldownMs(ability, player.tracksProgression.playerTier, player.usesSkills.passives);
}

/**
 * Publish the authoritative remaining cooldown for one ability.
 *
 * The client cannot derive this. Cooldowns live in `TracksCombat`, which is not
 * networked, and the two things that move them — equipment cooldown reduction
 * and Sweep's Tempo refunds — are both invisible to a countdown started from an
 * authored constant. So every change the client could NOT have predicted is
 * sampled to it here, and ordinary time decay is left to the client's own clock.
 *
 * `totalMs` rides along so the HUD's sweep has a denominator from the same
 * authoritative source as its numerator. Without it the bar would divide a real
 * remaining time by an authored total and draw a fraction that belongs to
 * neither.
 *
 * Purely presentational: the cooldown itself was already set by the caller.
 */
export function publishAbilityCooldown(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  remainingMs: number,
  totalMs: number,
): void {
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-ability-cooldown",
    playerId: player.isPlayer.id,
    ability: abilityId,
    remainingMs,
    totalMs,
  });
}

/**
 * THE single place a Technique's cooldown starts.
 *
 * Every activation path (armed, cast, charge, self-cast, reposition, instant)
 * routes through here so the Tempo minimum-cycle guard can never be forgotten by
 * one of them — a missed floor would let that one shape be driven to a
 * continuous activation by attack speed alone.
 *
 * Ordering note: the ordinary cooldown-reduction layer has already been applied
 * by `techniqueCooldownMs`, and the floor is capped to the RESULT. Cooldown
 * reduction therefore always helps, Tempo then works on what is left, and the
 * floor never lengthens a cooldown that equipment already shortened past it.
 */
export function startTechniqueCooldown(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  const cooldownMs = techniqueCooldownMs(player, ability);
  setCooldown(player.tracksCombat, abilityCooldownKey(ability.id), cooldownMs);
  // Sampled from here rather than from each activation path for the same reason
  // the Tempo floor is set here: this is the one place every shape passes
  // through, so no shape can start a cooldown the HUD never hears about.
  publishAbilityCooldown(world, player, ability.id, cooldownMs, cooldownMs);

  const refundMs = abilityTempoRefundMs(ability, player.tracksProgression.playerTier);
  setCooldown(
    player.tracksCombat,
    abilityTempoFloorKey(ability.id),
    refundMs > 0 ? Math.min(TECHNIQUE_TEMPO_MIN_CYCLE_MS, cooldownMs) : 0,
  );
}
