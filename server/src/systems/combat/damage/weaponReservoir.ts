import {
  applyStatusEffect,
  weaponDotProfileForWeapon,
  weaponDotBasisFromResolvedDirectDamage,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { attachMarker } from "../../../ecs/markerHelpers";

/**
 * Feed a DoT-conversion weapon's reservoir from a player's direct damage, and
 * return the direct damage that is left to land.
 *
 * ONE implementation for every source that should convert: the weapon's own
 * on-hit listener (normal swings and the Techniques that ride them) and the
 * ability payloads that resolve outside the attack pipeline (cast strikes such
 * as Power Strike/Slam, and Sweep splash). A weapon that converts, converts
 * whatever the wielder's damage is; a separate code path must not leak past it.
 *
 * `directDamage` is the gross, pre-mitigation hit, exactly what `ctx.damage`
 * holds in `onHit`. A player without a conversion weapon gets the damage back
 * unchanged. Detonate must NOT call this: re-feeding a consumed reservoir would
 * loop.
 */
export function feedWeaponReservoir(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  directDamage: number,
  secondaryEffectMult = 1,
): number {
  const weaponId = player.holdsInventory.equipment.weapon;
  if (!weaponId) return directDamage;
  const profile = weaponDotProfileForWeapon(weaponId);
  if (!profile) return directDamage;

  // Class listeners already applied empowerment; store that resolved damage
  // without removing the bonus or multiplying it a second time.
  const reservoirBasis = weaponDotBasisFromResolvedDirectDamage(
    directDamage,
    player.usesSkills.combatArchetype,
    player.usesSkills.passives,
  );
  const poolGain = reservoirBasis
    * profile.convPct
    * profile.dotMultiplier
    * secondaryEffectMult;

  const effect = applyStatusEffect(monster.tracksCombat, {
    id: profile.effectId,
    maxStacks: 1,
    instanced: false,
    sourceId: player.isPlayer.id,
    remainingMs: profile.drainDurationMs,
    refreshable: true,
    data: {
      pool: 0,
      nextTickIn: profile.tickIntervalMs,
      tickIntervalMs: profile.tickIntervalMs,
      tickOnExpire: 1,
      drainDurationMs: profile.drainDurationMs,
      dotMultiplier: profile.dotMultiplier,
      slowPerStack: profile.slowPerStack ?? 0,
    },
  });

  effect.data.pool = (effect.data.pool ?? 0) + poolGain;
  effect.data.tickIntervalMs = profile.tickIntervalMs;
  effect.data.tickOnExpire = 1;
  effect.data.drainDurationMs = profile.drainDurationMs;
  effect.data.dotMultiplier = profile.dotMultiplier;
  effect.data.slowPerStack = profile.slowPerStack ?? 0;

  attachMarker(world, monster, "hasWeaponDot");

  return Math.max(1, Math.round(directDamage * (1 - profile.convPct)));
}
