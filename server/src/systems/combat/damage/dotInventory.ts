/**
 * The DoT inventory — one enumeration seam over every damage-over-time effect a
 * player owns on a monster.
 *
 * WHY THIS EXISTS. The game grew four unrelated DoT families (the Apprentice core
 * `dot` stack, the T3 path DoTs, the weapon reservoirs, and the specials), each
 * with its own damage model, its own tick driver and its own effect ids. Nothing
 * could ask the simple question every DoT-facing tool needs to ask: *what
 * damage-over-time is on this target right now, whose is it, what element is it,
 * and how much damage does it still owe?*
 *
 * Contagion, Detonate and the `target-max-stacks` rune condition all ask exactly
 * that question, so they all read through here. A future T4 DoT path registers
 * one {@link DotFamily} from its own init and picks up all three for free —
 * which is the whole point. Hardcoding an effect-id list in each consumer would
 * be three lists to forget to update.
 *
 * A family DESCRIBES; it never mutates. Applying a copy, or removing a detonated
 * effect, stays with the consumer so ownership of world state is unambiguous.
 */
import {
  computeEternalDoomDamage,
  computeScaledDotDamage,
  weaponDotProfileForEffect,
  type DamageElement,
  type StatusEffect,
} from "@mmo-idle/shared";
import {
  DOT_EFFECT_ID,
  CONF_EFFECT_ID,
} from "../../classes/archetypes/dot/t3/core/constants";
import {
  PERM_MAX_HITS,
  PERM_PCT_PER_HIT,
} from "../../classes/archetypes/dot/t3/paths/_constants";
import {
  getFrostbiteDotTakenMult,
  getFrozenMult,
  getSmolderMult,
} from "../../classes/archetypes/dot/t3/core/selectors";
import { applyMonsterDamageTakenDebuffs } from "../../classes/shared/debuffs";
import { dotElementForSource } from "./dotTickEvent";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/**
 * ECS marker a receiving monster needs so the owning tick driver picks a copy up.
 *
 * NOTE: every weapon reservoir — the brands, Ashbrand and Edge of Oblivion alike —
 * shares the single `hasWeaponDot` marker. `docs/dot-systems-current-state.md`
 * still names `hasAshbrandBurn` / `hasVoidCorruption`; those markers do not
 * exist in `entity.ts` and the doc is stale.
 */
export type DotMarkerKey = "hasDot" | "hasConflagration" | "hasWeaponDot";

/** What one live DoT effect is, mechanically, to a tool that wants to act on it. */
export interface DotInventoryEntry {
  /** The live status effect, by reference — consumers mutate or remove it. */
  effect: StatusEffect;
  /** Which family described it (diagnostics, and de-duplication by consumers). */
  familyId: string;
  /** Visual element, for damage-number styling and FX tinting. */
  element: DamageElement;
  /**
   * Damage still owed if the effect ran to completion from right now, including
   * the target's CURRENT vulnerability multipliers. An estimate by nature: a
   * refresh, a new stack or an expiring Smoulder all move it afterwards.
   */
  remainingDamage: number;
  /** Contagion may copy this onto another monster. */
  spreadable: boolean;
  /** Detonate may consume this for its remaining damage. */
  detonatable: boolean;
  /**
   * Stack ceiling for the `target-max-stacks` rune condition, or 0 when the
   * effect does not meaningfully stack. Reservoirs report 0 deliberately: they
   * are internally `maxStacks: 1`, so treating them as stacking would read
   * "at max" from the very first hit and the condition would never turn off.
   */
  stackCap: number;
  /** Marker the receiving monster needs for the owning tick driver to see a copy. */
  marker?: DotMarkerKey;
}

/** Everything a family needs to describe one effect. */
export interface DotDescribeContext {
  world: World;
  /** The player who owns the effect (already matched against `effect.sourceId`). */
  owner: PlayerEntity;
  monster: MonsterEntity;
  effect: StatusEffect;
}

export interface DotFamily {
  id: string;
  /** True when this family owns the effect. First matching family wins. */
  owns(effect: StatusEffect): boolean;
  /** Describe the effect, or null when it is inert (expired, zero stacks, …). */
  describe(
    ctx: DotDescribeContext,
  ): Omit<DotInventoryEntry, "effect" | "familyId"> | null;
}

const _families: DotFamily[] = [];

/**
 * Register a DoT family. Call from your system's own `init`, which
 * `initCombatSystems()` runs exactly once per process — so the live server and
 * the bench see an identical inventory.
 */
export function registerDotFamily(family: DotFamily): void {
  const existing = _families.findIndex((f) => f.id === family.id);
  if (existing >= 0) _families[existing] = family;
  else _families.push(family);
}

/** Test/bench escape hatch — never call from game code. */
export function _resetDotFamilies(): void {
  _families.length = 0;
}

/**
 * Every DoT on `monster` owned by `player`, described.
 *
 * Ownership is by `sourceId`, the same rule kill credit and reward attribution
 * already use: in a party you act on your own damage-over-time and nobody
 * else's.
 */
export function playerDotsOnMonster(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
): DotInventoryEntry[] {
  const out: DotInventoryEntry[] = [];
  const ownerId = player.isPlayer.id;
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.sourceId !== ownerId) continue;
    const family = _families.find((f) => f.owns(effect));
    if (!family) continue;
    const described = family.describe({ world, owner: player, monster, effect });
    if (!described) continue;
    out.push({ effect, familyId: family.id, ...described });
  }
  return out;
}

/**
 * True when any stacking DoT this player owns on the monster sits at its own
 * ceiling. Drives the `target-max-stacks` rune condition.
 */
export function playerDotAtMaxStacks(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
): boolean {
  for (const entry of playerDotsOnMonster(world, player, monster)) {
    if (entry.stackCap > 0 && entry.effect.stacks >= entry.stackCap) return true;
  }
  return false;
}

/** Total remaining damage across a set of entries. */
export function totalRemainingDamage(
  entries: readonly DotInventoryEntry[],
): number {
  let total = 0;
  for (const entry of entries) total += entry.remainingDamage;
  return Math.max(0, Math.round(total));
}

// ── Shared helpers ───────────────────────────────────────────────────────────

/**
 * How many ticks a timed DoT has left: the one pending in `nextTickIn`, plus one
 * per whole interval that still fits inside `remainingMs`.
 */
function ticksRemaining(effect: StatusEffect): number {
  const interval = effect.data["tickIntervalMs"] ?? 0;
  if (interval <= 0) return 0;
  const remaining = effect.remainingMs;
  if (remaining <= 0) return 0;
  const nextIn = Math.max(0, effect.data["nextTickIn"] ?? 0);
  if (remaining < nextIn) return 0;
  return 1 + Math.floor((remaining - nextIn) / interval);
}

/**
 * The target's current DoT vulnerability stack (Smoulder, Frozen, Frostbite and
 * the shared damage-taken debuffs), applied exactly as the real tick drivers
 * apply it so a projection matches what the ticks would actually deal.
 */
function withVulnerability(monster: MonsterEntity, perTick: number): number {
  const state = monster.tracksCombat;
  const withPathVuln =
    perTick *
    getSmolderMult(state) *
    getFrozenMult(state) *
    getFrostbiteDotTakenMult(state);
  return Math.max(1, applyMonsterDamageTakenDebuffs(state, Math.round(withPathVuln)));
}

/**
 * A permanent DoT owes unbounded damage, so "the rest of its duration" is not a
 * number. Detonate projects a bounded window instead — long enough that
 * detonating a ramped Permafrost is worth doing, short enough that a permanent
 * effect can never out-earn a timed one purely by never ending.
 */
const PERMANENT_DOT_PROJECTED_TICKS = 5;

// ── Built-in families ────────────────────────────────────────────────────────

/**
 * Apprentice core DoT stack (`dot`), including the Eternal Doom curve. Excludes
 * Permafrost, which shares the effect id but has its own tick driver and damage
 * model — see {@link PERMAFROST_FAMILY}.
 */
const CLASS_DOT_FAMILY: DotFamily = {
  id: "class-dot",
  owns: (effect) => effect.id === DOT_EFFECT_ID && !effect.data["t3Perm"],
  describe({ world, monster, effect }) {
    if (effect.stacks <= 0) return null;
    const perTick = effect.data["isEternalDoom"]
      ? computeEternalDoomDamage(
          effect.stacks,
          effect.data["damagePerStack"] ?? 0,
          effect.data["edFullStacks"],
          effect.data["edDiminishRate"],
        )
      : computeScaledDotDamage(effect);
    return {
      element: dotElementForSource(world, effect.sourceId),
      remainingDamage: withVulnerability(monster, perTick) * ticksRemaining(effect),
      spreadable: true,
      detonatable: true,
      stackCap: effect.maxStacks,
      marker: "hasDot",
    };
  },
};

/**
 * Permafrost — the permanent frost DoT whose damage ramps with accumulated hits
 * and derives from the OWNER's attack stat, not from stored stack damage.
 */
const PERMAFROST_FAMILY: DotFamily = {
  id: "permafrost",
  owns: (effect) => effect.id === DOT_EFFECT_ID && !!effect.data["t3Perm"],
  describe({ owner, monster, effect }) {
    const hits = Math.min(PERM_MAX_HITS, effect.data["hits"] ?? 0);
    const perTick = Math.max(
      1,
      Math.round(owner.dealsDamage.attack * hits * PERM_PCT_PER_HIT),
    );
    return {
      element: "frost",
      remainingDamage:
        withVulnerability(monster, perTick) * PERMANENT_DOT_PROJECTED_TICKS,
      spreadable: true,
      detonatable: true,
      // Permafrost's pressure is its ramp, not a stack count, so it never
      // satisfies the max-stacks condition.
      stackCap: 0,
      marker: "hasDot",
    };
  },
};

/** Conflagration — a finite fast burn counted in `ticksLeft`, not in duration. */
const CONFLAGRATION_FAMILY: DotFamily = {
  id: "conflagration",
  owns: (effect) => effect.id === CONF_EFFECT_ID,
  describe({ monster, effect }) {
    const ticksLeft = Math.max(0, Math.floor(effect.data["ticksLeft"] ?? 0));
    if (ticksLeft <= 0) return null;
    const perTick = Math.max(1, Math.round(effect.data["damagePerTick"] ?? 0));
    return {
      element: "fire",
      remainingDamage: withVulnerability(monster, perTick) * ticksLeft,
      spreadable: true,
      detonatable: true,
      stackCap: 0,
      marker: "hasConflagration",
    };
  },
};

/**
 * Weapon reservoir DoTs (the swamp brands, Ashbrand, the tundra/volcanic
 * followers, Edge of Oblivion). A reservoir IS its remaining damage: `pool` is a
 * bank that drains, so no tick projection is needed.
 */
const WEAPON_RESERVOIR_FAMILY: DotFamily = {
  id: "weapon-reservoir",
  owns: (effect) => weaponDotProfileForEffect(effect.id) !== undefined,
  describe({ monster, effect }) {
    const profile = weaponDotProfileForEffect(effect.id);
    if (!profile) return null;
    const pool = effect.data["pool"] ?? 0;
    if (pool <= 0) return null;
    return {
      element: profile.element,
      remainingDamage: withVulnerability(monster, pool),
      spreadable: true,
      detonatable: true,
      // Reservoirs are maxStacks:1 internally — see DotInventoryEntry.stackCap.
      stackCap: 0,
      marker: "hasWeaponDot",
    };
  },
};

/**
 * Register the built-in families. Called from `initCombatSystems()` so live
 * server and bench agree.
 *
 * Permafrost is registered FIRST: it shares the `dot` effect id with the class
 * family, and first-match-wins means the more specific guard has to be seen
 * first. Both also test `t3Perm`, so the order is belt-and-braces rather than
 * load-bearing — keep it anyway.
 */
export function initDotInventory(): void {
  registerDotFamily(PERMAFROST_FAMILY);
  registerDotFamily(CLASS_DOT_FAMILY);
  registerDotFamily(CONFLAGRATION_FAMILY);
  registerDotFamily(WEAPON_RESERVOIR_FAMILY);
}
