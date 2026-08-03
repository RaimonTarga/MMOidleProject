import {
  applyStatusEffect,
  scaleDebuffConfig,
  type StatusEffect,
  type StatusEffectConfig,
  type TracksCombat,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";

/**
 * Apply a debuff FROM a player TO a monster, scaled by the Controller core.
 *
 * Use this instead of `applyStatusEffect` whenever the player is debuffing an
 * enemy. Everything else — self buffs, class resource clocks, monster-applied
 * effects on the player — keeps calling `applyStatusEffect` directly, and must:
 * routing a monster's debuff through here would let a player's core strengthen the
 * thing hitting them.
 *
 * Only ids listed in SCALABLE_DEBUFFS are affected; anything else passes straight
 * through untouched, so migrating a call site is safe even before its effect is
 * registered. See shared/src/systems/debuffScaling.ts for the registry rules.
 */
export function applyPlayerDebuff(
  player: PlayerEntity,
  targetState: TracksCombat,
  config: StatusEffectConfig,
): StatusEffect {
  return applyStatusEffect(targetState, playerDebuffConfig(player, config));
}

/**
 * The scaling step alone, without applying.
 *
 * Needed by call sites that write values back onto the effect after applying — the
 * weapon brittle listener refreshes `platingPerStack`/`drPerStack` each hit so a
 * weapon swap takes effect immediately. Writing the RAW numbers back there would
 * silently undo the core's scaling one tick after it was applied, which is invisible
 * in every test that only checks the first application. Take the scaled config, then
 * write back from `cfg.data`, never from the local variables.
 */
export function playerDebuffConfig(
  player: PlayerEntity,
  config: StatusEffectConfig,
): StatusEffectConfig {
  const passives = player.usesSkills.passives;
  const durationMult = 1 + (passives["core.debuff-duration-mult"] ?? 0);
  const potencyMult = 1 + (passives["core.debuff-potency-mult"] ?? 0);

  if (durationMult === 1 && potencyMult === 1) return config;
  return scaleDebuffConfig(config, durationMult, potencyMult);
}
