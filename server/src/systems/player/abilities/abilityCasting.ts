/**
 * Player casted-Technique lifecycle.
 *
 * Deliberately mirrors the PROVEN monster `chargedAttack` state machine
 * (`combat.ts` + `monsterMechanics.ts`):
 *
 *   arm -> begin wind-up (telegraph) -> resolve -> cooldown
 *                    \-> interrupted by hard CC / lost target -> abort
 *
 * Differences from the monster version, both deliberate:
 * - **An aborted cast costs nothing.** The cooldown is only set when the cast
 *   actually resolves, so losing a target mid-wind-up is not punished twice.
 * - **Movement is held only for a RANGED cast.** A monster roots itself while
 *   charging. A player casting Power Strike keeps walking, because auto-movement
 *   is rune-driven and a cast that fought pathing would be unusable in an idle
 *   game. A cast that carries a `rangeBonus`, though, exists precisely to be
 *   delivered from out there — so auto-combat holds position for its duration
 *   (see `holdsPositionWhileCasting`), which is what makes Snipe a standoff tool
 *   instead of a slow opener you immediately walk out of.
 *
 * `isCastingAbility` and `hasArmedAbility` are mutually exclusive: together they
 * are the single offensive execution channel.
 */
import {
  ABILITY_DATABASE,
  abilityCastMs,
  abilityRangeBonus,
  setCooldown,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { isHardControlled } from "../../combat/status/playerHardControl";
import { abilityCooldownKey, techniqueCooldownMs } from "./abilityCooldowns";
import { resolveCastPayload } from "./abilityEffects";
import { abilityEngagementRange, abilityTarget } from "./abilityTargeting";

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
  const castMs = abilityCastMs(ability, player.tracksProgression.playerTier);
  if (castMs <= 0) return false;
  if (isHardControlled(player.tracksCombat)) return false;

  // A cast needs something to resolve INTO. Resolved through the ability's own
  // reach, not the player's, so a `rangeBonus` cast can open on something the
  // player could not otherwise touch.
  const target = abilityTarget(world, player, ability);
  if (!target) return false;

  const effectiveMs = Math.max(1, Math.round(castMs * castSpeedMult(player)));
  attachComponent(world, player, "isCastingAbility", {
    abilityId: ability.id,
    slotIndex,
    endsAt: now + effectiveMs,
    castMs: effectiveMs,
    targetId: target.isMonster.id,
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
 * True while the player is mid-cast on an ability whose reach exceeds their own.
 *
 * Auto-combat reads this and stops closing: the whole value of the extended reach
 * is spending the wind-up at distance. A cast with no range bonus is unaffected,
 * so ordinary casts still walk with the fight.
 */
export function holdsPositionWhileCasting(player: PlayerEntity): boolean {
  const casting = player.isCastingAbility;
  if (!casting) return false;
  const ability = ABILITY_DATABASE.get(casting.abilityId);
  if (!ability) return false;
  return abilityRangeBonus(ability, player.tracksProgression.playerTier) > 0;
}

/**
 * `technique.cast-speed-pct` shortens the wind-up. Capped so a cast can never
 * collapse to an instant — the telegraph IS the cost that makes Technique Power
 * on casts a fair trade.
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
    if (isHardControlled(player.tracksCombat)) {
      abortCast(world, player, casting.abilityId);
      continue;
    }

    // Target died, left the node, or we drifted out of the ability's reach.
    const target = world.getMonsterEntity(casting.targetId);
    if (
      !target ||
      target.hasHealth.hp <= 0 ||
      target.hasPosition.nodeId !== player.hasPosition.nodeId ||
      !world.collision.canReach(player, target, abilityEngagementRange(player, ability))
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
      targetPos: { ...target.hasPosition.current },
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
