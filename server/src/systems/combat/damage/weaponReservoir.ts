import {
  applyStatusEffect,
  weaponDotProfileForWeapon,
  weaponDotBasisFromResolvedDirectDamage,
  type StatusEffect,
  type BurnWeaponEntry,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { attachMarker } from "../../../ecs/markerHelpers";

/** The reservoir profile of the weapon this player is holding, if it owns one. */
export function heldWeaponReservoir(player: PlayerEntity): BurnWeaponEntry | undefined {
  const weaponId = player.holdsInventory.equipment.weapon;
  return weaponId ? weaponDotProfileForWeapon(weaponId) : undefined;
}

/**
 * The reservoir record on `monster`, created (empty) when absent, its drain
 * window refreshed. The one place a reservoir's record is written, so a pool fed
 * by a hit and a pool topped up by a lineage payload are the same record with
 * the same clock.
 */
function reservoirRecord(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  profile: BurnWeaponEntry,
): StatusEffect {
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

  effect.data.pool = effect.data.pool ?? 0;
  effect.data.tickIntervalMs = profile.tickIntervalMs;
  effect.data.tickOnExpire = 1;
  effect.data.drainDurationMs = profile.drainDurationMs;
  effect.data.dotMultiplier = profile.dotMultiplier;
  effect.data.slowPerStack = profile.slowPerStack ?? 0;

  attachMarker(world, monster, "hasWeaponDot");
  return effect;
}

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
 *
 * The Affliction lean on a reservoir weapon (design §26.2) is the reservoir's
 * POTENCY: `weapon.reservoir-potency-pct` scales what each converted hit banks.
 * The converted share — and so the direct damage left to land — is unchanged.
 */
export function feedWeaponReservoir(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  directDamage: number,
  secondaryEffectMult = 1,
): number {
  const profile = heldWeaponReservoir(player);
  if (!profile) return directDamage;

  // Class listeners already applied empowerment; store that resolved damage
  // without removing the bonus or multiplying it a second time.
  const reservoirBasis = weaponDotBasisFromResolvedDirectDamage(
    directDamage,
    player.usesSkills.combatArchetype,
    player.usesSkills.passives,
  );
  const potency = 1 + Math.max(0, player.usesSkills.passives["weapon.reservoir-potency-pct"] ?? 0);
  const poolGain = reservoirBasis
    * profile.convPct
    * profile.dotMultiplier
    * secondaryEffectMult
    * potency;

  const effect = reservoirRecord(world, player, monster, profile);
  effect.data.pool = (effect.data.pool ?? 0) + poolGain;

  return Math.max(1, Math.round(directDamage * (1 - profile.convPct)));
}

/**
 * ADD `amount` of damage to the held weapon's reservoir on `monster` — what it
 * still owes grows, and its drain window restarts. The lineage payloads' route on
 * a weapon that owns a reservoir (design §26.2: amplified, never joined): the
 * heavy bleed, the re-dose and `poison-stack` top up the Poison Dagger's poison
 * rather than starting a second record beside it.
 *
 * Returns the reservoir record, or undefined when the player holds no reservoir
 * weapon (the caller then writes the one lineage bleed instead).
 */
export function addToWeaponReservoir(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  amount: number,
): StatusEffect | undefined {
  const profile = heldWeaponReservoir(player);
  if (!profile) return undefined;
  const effect = reservoirRecord(world, player, monster, profile);
  if (amount > 0) effect.data.pool = (effect.data.pool ?? 0) + amount;
  return effect;
}
