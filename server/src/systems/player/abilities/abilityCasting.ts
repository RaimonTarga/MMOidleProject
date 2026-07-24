/**
 * Player casted-Technique lifecycle (abilities evolution plan §5.2).
 *
 * The first player-side cast. Deliberately mirrors the PROVEN monster
 * `chargedAttack` state machine (`combat.ts` + `monsterMechanics.ts`):
 *
 *   arm -> begin wind-up (telegraph) -> resolve -> cooldown
 *                    \-> interrupted by hard CC / lost target -> abort
 *
 * Differences from the monster version, both deliberate:
 * - **Movement continues.** A monster roots itself while charging; the player
 *   does not, because auto-movement is rune-driven and a cast that fought
 *   pathing would be unusable in an idle game. Only NORMAL ATTACKS are
 *   suppressed (see the `isCastingAbility` check in `combat.ts`).
 * - **An aborted cast costs nothing.** The cooldown is only set when the cast
 *   actually resolves, so losing a target mid-wind-up is not punished.
 *
 * `isCastingAbility` and `hasArmedAbility` are mutually exclusive: together they
 * are the single offensive execution channel (plan §7.1).
 */
import {
  ABILITY_DATABASE,
  hasStatusEffect,
  setCooldown,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { STUN_EFFECT } from "../../combat/status/stun";
import { FROZEN_EFFECT } from "../../classes/archetypes/dot/t3/core/constants";
import { abilityCooldownKey, techniqueCooldownMs } from "./abilityCooldowns";
import { resolveCastPayload } from "./abilityEffects";

/** Hard CC that breaks a wind-up — same rule the monster cast machine uses. */
function isHardCCd(player: PlayerEntity): boolean {
  const cs = player.tracksCombat;
  return hasStatusEffect(cs, STUN_EFFECT) || hasStatusEffect(cs, FROZEN_EFFECT);
}

/**
 * Begin a wind-up. Returns true when the cast started (claiming the offensive
 * channel), false when it could not — the caller then leaves the slot eligible.
 */
export function beginAbilityCast(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  slotIndex: number,
  now: number,
): boolean {
  const castMs = ability.castMs ?? 0;
  if (castMs <= 0) return false;
  if (isHardCCd(player)) return false;

  // A cast needs something to resolve INTO. Without a live target the wind-up
  // would just abort on the next tick, so don't start it at all.
  const targetId = player.hasAttackTarget?.targetId;
  if (!targetId || !world.hasMonster(targetId)) return false;

  const effectiveMs = Math.max(1, Math.round(castMs * castSpeedMult(player)));
  attachComponent(world, player, "isCastingAbility", {
    abilityId: ability.id,
    slotIndex,
    endsAt: now + effectiveMs,
    castMs: effectiveMs,
    targetId,
  });

  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-cast-start",
    playerId: player.isPlayer.id,
    ability: ability.id,
    castMs: effectiveMs,
  });
  return true;
}

/**
 * `technique.cast-speed-pct` shortens the wind-up. Capped so a cast can never
 * collapse to an instant — the telegraph IS the cost that makes Technique Power
 * on casts a fair trade (plan §6.1).
 */
const CAST_SPEED_CAP = 0.6;

function castSpeedMult(player: PlayerEntity): number {
  const pct = player.usesSkills.passives["technique.cast-speed-pct"] ?? 0;
  return 1 - Math.min(CAST_SPEED_CAP, Math.max(0, pct));
}

/**
 * Advance every in-flight cast. Runs each tick AFTER `updateAbilityFiring` (which
 * may have started one this tick) and BEFORE combat resolves, so a completed cast
 * lands in the same tick it finished.
 */
export function updateAbilityCasts(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const casting = player.isCastingAbility;
    if (!casting) continue;

    const ability = ABILITY_DATABASE.get(casting.abilityId);
    if (!ability) {
      abortCast(world, player, casting.abilityId);
      continue;
    }

    // Hard CC breaks the wind-up — the player's counterplay against a caster is
    // exactly the counterplay a monster has against theirs.
    if (isHardCCd(player)) {
      abortCast(world, player, casting.abilityId);
      continue;
    }

    // Target died, left the node, or we drifted out of reach: abort harmlessly.
    const target = world.getMonsterEntity(casting.targetId);
    if (
      !target ||
      target.hasHealth.hp <= 0 ||
      target.hasPosition.nodeId !== player.hasPosition.nodeId
    ) {
      abortCast(world, player, casting.abilityId);
      continue;
    }

    if (now < casting.endsAt) continue; // still winding up

    // Wind-up complete — resolve, then pay the cooldown. Cooldown is charged
    // ONLY here so an interrupted cast costs the player nothing.
    detachComponent(world, player, "isCastingAbility");
    resolveCastPayload(world, player, ability, target);
    setCooldown(
      player.tracksCombat,
      abilityCooldownKey(ability.id),
      techniqueCooldownMs(player, ability),
    );
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-cast-end",
      playerId: player.isPlayer.id,
      ability: ability.id,
      fired: true,
    });
  }
}

function abortCast(world: World, player: PlayerEntity, abilityId: string): void {
  detachComponent(world, player, "isCastingAbility");
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-cast-end",
    playerId: player.isPlayer.id,
    ability: abilityId,
    fired: false,
  });
}
