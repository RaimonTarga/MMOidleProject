/**
 * The affliction Techniques — Contagion and Detonate (T3, Swamp).
 *
 * Both are casted Techniques that act on damage-over-time the player already
 * owns, so neither invents a DoT of its own and neither knows what a "poison" or
 * a "reservoir" is. They read the DoT inventory
 * (`combat/damage/dotInventory.ts`), which is what lets a future T4 path join in
 * by registering a family rather than by editing this file.
 *
 * They are deliberate opposites and are meant to be held together at T3, where
 * the second Technique slot opens:
 *   Contagion — turn ONE target's afflictions into MANY targets' afflictions.
 *   Detonate  — turn a LONG payout into an IMMEDIATE one, and take a cut.
 */
import {
  ABILITY_DATABASE,
  resolveAbilityEffect,
  applyStatusEffect,
  removeStatusEffect,
  type AbilityDef,
  type AbilityEffectSpec,
  type StatusEffect,
} from "@mmo-idle/shared";
import {
  playerDotsOnMonster,
  totalRemainingDamage,
  type DotInventoryEntry,
} from "../../combat/damage/dotInventory";
import { applyPlayerAoe, playerAoeTargets } from "../../combat/damage/aoeDamage";
import { attachMarker, detachMarkerIfNoEffect } from "../../../ecs/markerHelpers";
import { actorFromMonster, actorFromPlayer } from "../../../world/worldLogActors";
import { recordWorldLogEvent } from "../../../world/worldLog";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/** Resolve an ability's effect through the shared Technique Power seam. */
function afflictionEffect(
  player: PlayerEntity,
  ability: AbilityDef,
): AbilityEffectSpec {
  return resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: player.usesSkills.passives["technique.power-pct"] ?? 0,
  });
}

// ── Firing guards ────────────────────────────────────────────────────────────

/**
 * Whether an affliction Technique has anything to act on RIGHT NOW.
 *
 * Checked before the wind-up begins, not after it resolves. Both of these
 * abilities are worthless against a target carrying no damage-over-time, and the
 * roster's established rule is that a situational ability declines rather than
 * burning its cooldown on nothing (Break Free with nothing holding you, Cleanse
 * with nothing to strip, a dash with nowhere to go). Detonate's 15 s cooldown
 * makes this the difference between a usable ability and a trap.
 */
export function afflictionTechniqueHasWork(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: MonsterEntity,
): boolean {
  const effect = afflictionEffect(player, ability);
  if (effect.kind === "spread-dots") {
    if (spreadableDots(world, player, target).length === 0) return false;
    // Nothing to spread TO is just as dead as nothing to spread.
    return contagionVictims(world, player, target, effect.radius, effect.maxTargets).length > 0;
  }
  if (effect.kind === "detonate-dots") {
    const entries = playerDotsOnMonster(world, player, target).filter((e) => e.detonatable);
    return totalRemainingDamage(entries) > 0;
  }
  return true;
}

function spreadableDots(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
): DotInventoryEntry[] {
  return playerDotsOnMonster(world, player, target).filter((e) => e.spreadable);
}

/**
 * The enemies a Contagion cast would infect: everything in radius except the
 * source, NEAREST FIRST, capped at `maxTargets`.
 *
 * Nearest-first matters because the cap is the balance lever. An arbitrary query
 * order would make the same cast infect different enemies on different ticks,
 * which reads as a bug from the player's side and makes the ability impossible
 * to aim by positioning.
 */
function contagionVictims(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  radius: number,
  maxTargets: number,
): MonsterEntity[] {
  if (maxTargets <= 0) return [];
  const origin = target.hasPosition.current;
  return playerAoeTargets(world, player, origin, radius, target.isMonster.id)
    .filter((monster) => monster.hasHealth.hp > 0)
    .sort(
      (a, b) =>
        squaredGap(a, origin) - squaredGap(b, origin),
    )
    .slice(0, maxTargets);
}

function squaredGap(monster: MonsterEntity, origin: { x: number; y: number }): number {
  const dx = monster.hasPosition.current.x - origin.x;
  const dy = monster.hasPosition.current.y - origin.y;
  return dx * dx + dy * dy;
}

// ── Contagion ────────────────────────────────────────────────────────────────

/**
 * Copy every spreadable DoT from the target onto nearby enemies.
 *
 * COPY, not move: the original target keeps everything it had. Copies carry full
 * stacks and the full reservoir pool, so the target cap is the only bound on the
 * multiplication — which is exactly why the cap, not the radius, is the number
 * to tune.
 */
export function resolveContagion(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: MonsterEntity,
): void {
  const effect = afflictionEffect(player, ability);
  if (effect.kind !== "spread-dots") return;

  const entries = spreadableDots(world, player, target);
  if (entries.length === 0) return;

  const victims = contagionVictims(world, player, target, effect.radius, effect.maxTargets);
  if (victims.length === 0) return;

  // One link per (victim × distinct element): a target carrying a burn and a
  // poison sends two differently-coloured tendrils to each new host, which is
  // what makes the FX read as "these specific afflictions moved".
  const elements = [...new Set(entries.map((e) => e.element))];
  const links: Array<{ to: { x: number; y: number }; element: (typeof entries)[number]["element"] }> = [];

  for (const victim of victims) {
    for (const entry of entries) {
      copyDotOnto(world, player, victim, entry);
    }
    for (const element of elements) {
      links.push({ to: { ...victim.hasPosition.current }, element });
    }
  }

  world.pushEvent(player.hasPosition.nodeId, {
    kind: "dot-spread",
    playerId: player.isPlayer.id,
    from: { ...target.hasPosition.current },
    links,
  });

  recordWorldLogEvent(
    world,
    {
      kind: "technique-adapter",
      nodeId: player.hasPosition.nodeId,
      player: actorFromPlayer(player),
      adapter: "affliction-contagion",
      event: "contagion-spread",
      target: actorFromMonster(target),
      spreadTargets: victims.length,
      spreadEffects: entries.length,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

/**
 * Write one DoT copy onto a receiving monster.
 *
 * Generic on purpose: the inventory entry already carries the marker the owning
 * tick driver needs, and every family's per-effect state lives in `data`, so a
 * wholesale `data` copy transplants a reservoir pool, a Permafrost ramp and a
 * Conflagration tick counter without this function knowing which is which.
 *
 * When the receiver already carries the same effect from this player, each axis
 * takes the BETTER of the two rather than overwriting. Overwriting would let a
 * Contagion cast REDUCE a DoT the player had already built up on a secondary
 * target — an ability that can make your own damage worse is a bug, not a
 * trade-off.
 */
function copyDotOnto(
  world: World,
  player: PlayerEntity,
  victim: MonsterEntity,
  entry: DotInventoryEntry,
): void {
  const source = entry.effect;
  // Captured BEFORE applying: `applyStatusEffect` INCREMENTS an existing stack
  // by one as a side effect of returning it. Without this, spreading a 2-stack
  // DoT onto a target already carrying 5 would leave it at 6 — Contagion would
  // hand out a free stack to everything it touched.
  const priorStacks =
    victim.tracksCombat.statusEffects.find((e) => e.id === source.id)?.stacks ?? 0;

  const applied = applyStatusEffect(victim.tracksCombat, {
    id: source.id,
    maxStacks: source.maxStacks,
    instanced: source.instanced,
    refreshable: source.refreshable,
    remainingMs: source.remainingMs,
    sourceId: player.isPlayer.id,
    data: { ...source.data },
  });

  mergeCopiedDot(applied, source, priorStacks);

  if (entry.marker) attachMarker(world, victim, entry.marker);
}

/** Numeric `data` keys where a copy should keep whichever value is larger. */
const ADDITIVE_DOT_DATA_KEYS = ["pool", "hits", "ticksLeft"] as const;

function mergeCopiedDot(
  applied: StatusEffect,
  source: StatusEffect,
  priorStacks: number,
): void {
  // Set explicitly from what was ALREADY there versus what is arriving — never
  // from `applied.stacks`, which `applyStatusEffect` has already incremented.
  // Capped at the effect's own ceiling so a copy can never exceed what the
  // target could have accumulated on its own.
  const merged = Math.max(priorStacks, source.stacks);
  applied.stacks = source.maxStacks > 0 ? Math.min(merged, source.maxStacks) : merged;
  applied.remainingMs =
    applied.remainingMs < 0 || source.remainingMs < 0
      ? -1 // permanent wins: a Permafrost copy must not inherit a finite clock
      : Math.max(applied.remainingMs, source.remainingMs);

  for (const [key, value] of Object.entries(source.data)) {
    const existing = applied.data[key];
    applied.data[key] =
      typeof existing === "number" &&
      (ADDITIVE_DOT_DATA_KEYS as readonly string[]).includes(key)
        ? Math.max(existing, value)
        : value;
  }
}

// ── Detonate ─────────────────────────────────────────────────────────────────

/**
 * Consume every detonatable DoT on the target and deal what they still owed,
 * multiplied.
 *
 * The damage goes through `applyPlayerAoe` at a minimal radius rather than being
 * written into HP directly, so plating, damage reduction, the damage cap, kill
 * credit, rewards and the world log all behave exactly as they do for any other
 * player payload. The radius is 1 rather than 0 because the query is a BODY
 * overlap test and a zero-radius circle can miss a monster whose origin has
 * drifted from its body centre — the same reason `resolveCastPayload` does it.
 */
export function resolveDetonate(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: MonsterEntity,
): void {
  const effect = afflictionEffect(player, ability);
  if (effect.kind !== "detonate-dots") return;

  const entries = playerDotsOnMonster(world, player, target).filter((e) => e.detonatable);
  if (entries.length === 0) return;

  const owed = totalRemainingDamage(entries);
  if (owed <= 0) return;

  // Captured BEFORE the effects are stripped, and pushed before the damage in
  // case the burst kills: a dead monster's position is gone by the time
  // `applyPlayerAoe` returns, and an explosion has to happen somewhere.
  const element = dominantElement(entries);
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "dot-detonate",
    playerId: player.isPlayer.id,
    pos: { ...target.hasPosition.current },
    element,
  });

  // Strip the effects BEFORE dealing the damage. If the burst kills, the monster
  // is removed inside `applyPlayerAoe`, and leaving spent effects on a corpse
  // would let a tick driver bill the same damage twice on the way out.
  for (const entry of entries) {
    removeStatusEffect(target.tracksCombat, entry.effect.id);
    if (entry.marker) {
      detachMarkerIfNoEffect(
        world,
        target,
        entry.marker,
        target.tracksCombat,
        entry.effect.id,
      );
    }
  }

  const damage = Math.max(1, Math.round(owed * effect.detonateMult));
  applyPlayerAoe(world, player, target.hasPosition.current, 1, damage);

  recordWorldLogEvent(
    world,
    {
      kind: "technique-adapter",
      nodeId: player.hasPosition.nodeId,
      player: actorFromPlayer(player),
      adapter: "affliction-detonate",
      event: "detonate-consumed",
      target: actorFromMonster(target),
      detonatedEffects: entries.length,
      detonatedDamage: damage,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

/**
 * The dominant element among a set of DoT entries — what the FX should be tinted
 * with. Picks the element owed the most damage, so the beam/explosion colour
 * matches whatever is actually doing the work rather than whatever happened to
 * be applied first.
 */
export function dominantElement(entries: readonly DotInventoryEntry[]): DotInventoryEntry["element"] {
  const byElement = new Map<DotInventoryEntry["element"], number>();
  for (const entry of entries) {
    byElement.set(entry.element, (byElement.get(entry.element) ?? 0) + entry.remainingDamage);
  }
  let best: DotInventoryEntry["element"] = "poison";
  let bestWeight = -1;
  for (const [element, weight] of byElement) {
    if (weight > bestWeight) {
      best = element;
      bestWeight = weight;
    }
  }
  return best;
}

/** Re-exported for the FX layer, which needs the same entry list the payload used. */
export function afflictionEntriesFor(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: MonsterEntity,
): DotInventoryEntry[] {
  const def = ABILITY_DATABASE.get(ability.id);
  if (!def) return [];
  const effect = afflictionEffect(player, def);
  const all = playerDotsOnMonster(world, player, target);
  if (effect.kind === "spread-dots") return all.filter((e) => e.spreadable);
  if (effect.kind === "detonate-dots") return all.filter((e) => e.detonatable);
  return [];
}
