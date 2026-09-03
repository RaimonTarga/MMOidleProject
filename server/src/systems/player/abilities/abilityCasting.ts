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
  abilityRankAt,
  abilityRangeBonus,
  resolveAbilityEffect,
  setCooldown,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { isHardControlled } from "../../combat/status/playerHardControl";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { abilityCooldownKey, techniqueCooldownMs } from "./abilityCooldowns";
import { resolveCastPayload } from "./abilityEffects";
import { abilityEngagementRange, abilityTarget } from "./abilityTargeting";
import { armTechnique } from "./abilityArming";

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
    if (ability.shape === "charge") {
      if (!beginAbilityCharge(world, player, ability, target, now)) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind: "player-cast-end",
          playerId: player.isPlayer.id,
          ability: ability.id,
          fired: false,
        });
        continue;
      }
    } else {
      resolveCastPayload(world, player, ability, target);
    }
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

/**
 * Convert a completed charge wind-up into target-bound high-speed movement.
 * The instant reposition primitive remains untouched for Disengage and future
 * blink-style Techniques; this state owns an actual, interruptible approach.
 */
function beginAbilityCharge(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: NonNullable<ReturnType<typeof abilityTarget>>,
  now: number,
): boolean {
  if (player.isRooted) return false;
  const rank = abilityRankAt(ability, player.tracksProgression.playerTier);
  const effect = resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: player.usesSkills.passives["technique.power-pct"] ?? 0,
  });
  const speedMult = rank.chargeSpeedMult ?? 0;
  const chargeMaxMs = rank.chargeMaxMs ?? 0;
  if (
    effect.kind !== "reposition" ||
    !effect.toward ||
    effect.distance <= 0 ||
    speedMult <= 0 ||
    chargeMaxMs <= 0
  ) {
    return false;
  }

  const from = { ...player.hasPosition.current };
  attachComponent(world, player, "isChargingAbility", {
    abilityId: ability.id,
    targetId: target.isMonster.id,
    speedMult,
    endsAt: now + chargeMaxMs,
  });
  setEntityMotion(world, player, target.hasPosition.current);

  // Keep Charge's established hot dash trail rather than borrowing the birds'
  // aerial Dive Bomb treatment. Its projected endpoint matches the initial rush;
  // the authoritative movement can still bend toward a moving target afterward.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-reposition",
    playerId: player.isPlayer.id,
    ability: ability.id,
    from,
    to: chargeVisualDestination(player, target, effect.distance),
  });
  return true;
}

function chargeVisualDestination(
  player: PlayerEntity,
  target: NonNullable<ReturnType<typeof abilityTarget>>,
  maxDistance: number,
): { x: number; y: number } {
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.0001) return { ...from };
  const travel = Math.min(
    maxDistance,
    Math.max(0, distance - player.performsAttack.attackRange * 0.7),
  );
  return { x: from.x + (dx / distance) * travel, y: from.y + (dy / distance) * travel };
}

/** Advance each live charge; called after casts and before the movement tick. */
export function updateAbilityCharges(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const charging = player.isChargingAbility;
    if (!charging) continue;

    const ability = ABILITY_DATABASE.get(charging.abilityId);
    const target = world.getMonsterEntity(charging.targetId);
    if (
      !ability ||
      ability.shape !== "charge" ||
      !target ||
      target.hasHealth.hp <= 0 ||
      target.hasPosition.nodeId !== player.hasPosition.nodeId ||
      player.isRooted ||
      isHardControlled(player.tracksCombat)
    ) {
      abortCharge(world, player);
      continue;
    }

    if (world.collision.canReach(player, target, player.performsAttack.attackRange)) {
      stopEntity(world, player);
      detachComponent(world, player, "isChargingAbility");
      armTechnique(world, player, charging.abilityId);
      // The arrival is the ability's payoff: make its armed strike eligible in
      // this same combat tick instead of making Charge wait through a full basic
      // attack cooldown after successfully closing the gap.
      player.performsAttack.lastAttackAt = now - player.performsAttack.attackCooldown;
      continue;
    }

    if (now >= charging.endsAt) {
      abortCharge(world, player);
      continue;
    }

    // Own the move goal while rushing. Auto-targeting runs earlier in the tick,
    // so it may select targets normally without being able to overwrite this
    // committed approach.
    setEntityMotion(world, player, target.hasPosition.current);
  }
}

function abortCharge(world: World, player: PlayerEntity): void {
  stopEntity(world, player);
  detachComponent(world, player, "isChargingAbility");
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
