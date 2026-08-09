/**
 * Biome-differentiated boots (the `mobility` slot).
 *
 * Every boot mechanic lives strictly on the speed + positioning axis — none grant
 * eHP/DR/plating/HP (that is the armor slot). All triggers are deterministic:
 * countable events (kills, target locks, hits taken) or state-driven counters
 * (in-combat flag, continuous-move timer, motion direction) — never an RNG roll.
 *
 * The 10 boot lines reduce to these primitives, all owned here:
 *   - Per-tick conditional speed multiplier (Plains/Desert/Tundra/Volcanic + the
 *     timed-buff readers) folded into movement.ts via {@link bootSpeedMultiplier}.
 *   - Player-side detection-radius multiplier (Cave stealth / Jungle pull) read by
 *     ai.ts findAggro via {@link playerDetectionMult}.
 *   - Tenacity: incoming slow/CC duration scaling (Swamp + Graveyard) via
 *     {@link mobilityTenacityDurationMult}, applied at the slow-application site.
 *   - Timed/stacking buffs (Forest/Mountain/Graveyard on-kill & on-acquire,
 *     Volcanic suppression) built on the existing tracksCombat status-effect API.
 *
 * (Trench — Nth-hit backward glide — is intentionally not implemented yet.)
 */

import {
  addCounter,
  applyStatusEffect,
  getCooldown,
  getCounter,
  getStatusEffect,
  detectionMultForPoint,
  getString,
  hasStatusEffect,
  setCooldown,
  setCounter,
  setString,
  vectorTo,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { isPlayerInCombat } from "../../combat/ai/engagement";
import {
  defineBuff,
  type BuffDescriptor,
} from "../../combat/buffs/descriptor";

// ── Status-effect ids (player tracksCombat) ─────────────────────────────────────
// Exported so the Hunter's Instinct rite (system rework Step 11) can reuse the same
// on-kill haste buff — the `mob-haste` descriptor projects it unconditionally.
export const FOREST_HASTE = "mob-forest-haste"; // Forest on-kill speed
const MOUNTAIN_BURST = "mob-mountain-burst"; // Mountain on-acquire speed
const GRAVEYARD_HASTE = "mob-graveyard-haste"; // Graveyard on-kill speed + tenacity (stacks)
const VOLCANIC_SUPPRESS = "mob-volcanic-suppress"; // Volcanic: suppresses passive speed on hit

// ── tracksCombat scratch keys ───────────────────────────────────────────────────
const MOVE_TIMER = "mobMoveTimerMs"; // counter — Tundra continuous-move accumulator
const LAST_TARGET = "mobLastTargetId"; // string  — Mountain edge detection
const ACQUIRE_CD = "mobAcquireCd"; // cooldown — Mountain re-trigger gate

// ── Tuning floors/caps (structural, not balance) ────────────────────────────────
const TENACITY_CAP = 0.9; // CC duration can be cut at most 90% — never fully nullified
const DETECTION_FLOOR = 0.1; // a stealthed player is never fully invisible to pull aggro
// Guard on the compound case only. Jungle aggro-pull boots reach +0.80, so boots
// alone top out at 1.8 and are UNAFFECTED by this cap; it exists so boots stacked
// with a thicket's 2x cannot reach 3.6 (~1044px on a 3200px node) and pull the
// whole node at once.
const DETECTION_CAP = 3;

// ── Defaults for timed effects when the boot omits an explicit duration ─────────
const DEFAULT_KILL_SPEED_MS = 3000;
const DEFAULT_ACQUIRE_SPEED_MS = 1500;
const DEFAULT_ACQUIRE_CD_MS = 8000;
const DEFAULT_KILL_STACK_MS = 4000;
const DEFAULT_SUPPRESS_MS = 4000;
const GRAVEYARD_MAX_STACKS = 3;

/**
 * Collapsed per-tick speed multiplier for `player` (1.0 = no change). Folded into
 * the movement speed product in movement.ts alongside slow/trample. All boot speed
 * sources sum additively here so they compound with slow/trample exactly once.
 */
export function bootSpeedMultiplier(
  world: World,
  player: PlayerEntity,
  now: number,
): number {
  const p = player.usesSkills.passives;
  const cs = player.tracksCombat;
  let pct = 0;

  // Plains — out-of-combat sprint; collapses to base the instant combat starts.
  const ooc = p["mobility.ooc-speed-pct"] ?? 0;
  if (ooc > 0 && !isPlayerInCombat(player, now)) pct += ooc;

  // Volcanic — high passive speed, suppressed for a window after a direct hit.
  const passive = p["mobility.passive-speed-pct"] ?? 0;
  if (passive > 0 && !hasStatusEffect(cs, VOLCANIC_SUPPRESS)) pct += passive;

  // Desert — bonus only while actively moving away from the engaged target.
  const kite = p["mobility.kite-speed-pct"] ?? 0;
  if (kite > 0 && isMovingAwayFromTarget(world, player)) pct += kite;

  // Tundra — ramp scales with continuous-move time, capped; bleeds off on stop
  // (the timer is reset in updateMobilityState the moment the player is idle).
  const rampCap = p["mobility.ramp-speed-pct"] ?? 0;
  if (rampCap > 0) {
    const rate = p["mobility.ramp-rate"] ?? 0;
    const secs = getCounter(cs, MOVE_TIMER) / 1000;
    pct += Math.min(rampCap, secs * rate);
  }

  // Timed buffs (Forest / Mountain / Graveyard). Graveyard scales by stack count.
  const forest = getStatusEffect(cs, FOREST_HASTE);
  if (forest) pct += forest.data["speedPct"] ?? 0;
  const mountain = getStatusEffect(cs, MOUNTAIN_BURST);
  if (mountain) pct += mountain.data["speedPct"] ?? 0;
  const grave = getStatusEffect(cs, GRAVEYARD_HASTE);
  if (grave) pct += grave.stacks * (grave.data["speedPct"] ?? 0);

  return pct > 0 ? 1 + pct : 1;
}

/** True when the player's current motion points away from its attack target. */
function isMovingAwayFromTarget(world: World, player: PlayerEntity): boolean {
  if (!player.isMoving) return false;
  const targetId = player.hasAttackTarget?.targetId;
  if (!targetId) return false;
  const target = world.getMonsterEntity(targetId);
  if (!target) return false;
  const toTarget = vectorTo(
    player.hasPosition.current,
    target.hasPosition.current,
  ).direction;
  const dir = player.isMoving.motion.direction;
  return dir.x * toTarget.x + dir.y * toTarget.y < 0;
}

/**
 * Player-side multiplier on a monster's effective pull/detection radius.
 * < 1 for Cave stealth, > 1 for Jungle aggro-pull — one field, two signs. Floored
 * so a stealthed player is never fully undetectable, and capped so the compound
 * case (pull boots inside a jungle thicket) cannot pull an entire node.
 * Used in ai.ts findAggro.
 */
export function playerDetectionMult(player: PlayerEntity): number {
  const p = player.usesSkills.passives;
  const stealth = (p["mobility.stealth-pct"] ?? 0)
    + (player.tracksProgression.activeStance === "predator-stance" ? 0.5 : 0);
  const pull = p["mobility.aggro-pull-pct"] ?? 0;
  // Terrain can broadcast the player (jungle thicket). Read straight off the node
  // feature rather than a status effect — see the note on `detectionMultWhileInside`.
  // Never below 1: terrain only makes you LOUDER here, so it cannot be used to hide.
  const zoneMult = Math.max(
    1,
    detectionMultForPoint(player.hasPosition.nodeId, player.hasPosition.current),
  );
  if (stealth <= 0 && pull <= 0 && zoneMult === 1) return 1;
  return Math.min(
    DETECTION_CAP,
    Math.max(DETECTION_FLOOR, (1 - stealth) * (1 + pull) * zoneMult),
  );
}

/**
 * Multiplier applied to an incoming slow/CC duration at application time
 * (Swamp static tenacity + active Graveyard buff stacks). 1.0 = no reduction.
 * Only ever scales movement CC — never damage debuffs.
 */
export function mobilityTenacityDurationMult(player: PlayerEntity): number {
  const p = player.usesSkills.passives;
  let ten = p["mobility.tenacity-pct"] ?? 0;
  const grave = getStatusEffect(player.tracksCombat, GRAVEYARD_HASTE);
  if (grave) ten += grave.stacks * (grave.data["tenacityPct"] ?? 0);
  if (ten <= 0) return 1;
  return 1 - Math.min(TENACITY_CAP, ten);
}

/**
 * Per-tick mobility bookkeeping. Runs over every live player BEFORE updateMovement
 * so the speed multiplier reads current state:
 *   - Tundra: accumulate / reset the continuous-move timer.
 *   - Mountain: edge-detect a newly-locked target and fire the cooldown-gated burst.
 */
export function updateMobilityState(world: World, dt: number): void {
  for (const player of world.livePlayers) {
    const cs = player.tracksCombat;
    const p = player.usesSkills.passives;

    // Tundra continuous-move ramp accumulator.
    if ((p["mobility.ramp-speed-pct"] ?? 0) > 0) {
      if (player.isMoving) addCounter(cs, MOVE_TIMER, dt);
      else setCounter(cs, MOVE_TIMER, 0);
    }

    // Mountain on-acquire burst — fires when the locked target id changes to a new
    // non-empty id and the cooldown is clear. The cooldown debounces the natural
    // flip-flop of hasAttackTarget as monsters drift in/out of range.
    const acquirePct = p["mobility.acquire-speed-pct"] ?? 0;
    if (acquirePct > 0) {
      const currentId = player.hasAttackTarget?.targetId ?? "";
      const lastId = getString(cs, LAST_TARGET) ?? "";
      if (
        currentId !== "" &&
        currentId !== lastId &&
        getCooldown(cs, ACQUIRE_CD) <= 0
      ) {
        const ms = p["mobility.acquire-speed-ms"] ?? DEFAULT_ACQUIRE_SPEED_MS;
        applyStatusEffect(cs, {
          id: MOUNTAIN_BURST,
          maxStacks: 1,
          remainingMs: ms,
          refreshable: true,
          sourceId: player.isPlayer.id,
          data: { speedPct: acquirePct, totalMs: ms },
        });
        setCooldown(
          cs,
          ACQUIRE_CD,
          p["mobility.acquire-cooldown-ms"] ?? DEFAULT_ACQUIRE_CD_MS,
        );
      }
      setString(cs, LAST_TARGET, currentId);
    }
  }
}

/**
 * Register the combat-pipeline listeners that drive event-triggered boots.
 * Called once from combatBootstrap.
 *   - onKill (player attacker): Forest haste + Graveyard stacking haste/tenacity.
 *   - onDamageTaken (player defender): Volcanic passive-speed suppression.
 *
 * Direct-attack kills and player-owned DoT tick kills both emit onKill, so these
 * buffs refresh from any player-credited monster kill path.
 */
export function initMobilityBoots(): void {
  registerCombatListener("onKill", (ctx) => {
    if (ctx.attackerType !== "player") return;
    const player = ctx.attacker;
    const cs = player.tracksCombat;
    const p = player.usesSkills.passives;

    const forestPct = p["mobility.kill-speed-pct"] ?? 0;
    if (forestPct > 0) {
      const ms = p["mobility.kill-speed-ms"] ?? DEFAULT_KILL_SPEED_MS;
      applyStatusEffect(cs, {
        id: FOREST_HASTE,
        maxStacks: 1,
        remainingMs: ms,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { speedPct: forestPct, totalMs: ms },
      });
    }

    const gSpeed = p["mobility.kill-stack-speed-pct"] ?? 0;
    const gTen = p["mobility.kill-stack-tenacity-pct"] ?? 0;
    if (gSpeed > 0 || gTen > 0) {
      const ms = p["mobility.kill-stack-ms"] ?? DEFAULT_KILL_STACK_MS;
      applyStatusEffect(cs, {
        id: GRAVEYARD_HASTE,
        maxStacks: GRAVEYARD_MAX_STACKS,
        remainingMs: ms,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { speedPct: gSpeed, tenacityPct: gTen, totalMs: ms },
      });
    }
  });

  registerCombatListener("onDamageTaken", (ctx) => {
    if (ctx.defenderType !== "player") return;
    const player = ctx.defender;
    const p = player.usesSkills.passives;
    if ((p["mobility.passive-speed-pct"] ?? 0) <= 0) return;
    const ms = p["mobility.suppress-ms"] ?? DEFAULT_SUPPRESS_MS;
    applyStatusEffect(player.tracksCombat, {
      id: VOLCANIC_SUPPRESS,
      maxStacks: 1,
      remainingMs: ms,
      refreshable: true,
      sourceId: VOLCANIC_SUPPRESS,
      data: { totalMs: ms },
    });
  });
}

// ── Buff-bar projection ─────────────────────────────────────────────────────────
//
// Every boot speed source is surfaced as a buff so (a) the player sees it and
// (b) `speedMult` lets the client's own-player extrapolation match the server's
// effective speed (movement.ts folds the same factor in). A player wears one boot,
// so at most one speed source is ever active — the client's per-buff product and
// the server's `1 + Σpct` agree (single term). Registered via ALL_BUFFS in buffSync.

const NEUTRAL_CIRCLE = { category: "neutral" as const, shape: "circle" as const };

/** Remaining-duration percentage for a timed status effect (clock-sweep). */
function effectDurationPct(remainingMs: number, totalMs: number): number {
  return totalMs > 0 && remainingMs > 0 ? (remainingMs / totalMs) * 100 : -1;
}

export const MOBILITY_BUFFS = [
  // Plains — out-of-combat sprint (collapses the instant combat starts).
  defineBuff(
    "mob-sprint",
    ({ player, now }) => {
      const pct = player.usesSkills.passives["mobility.ooc-speed-pct"] ?? 0;
      if (pct <= 0 || isPlayerInCombat(player, now)) return null;
      return {
        id: "mob-sprint",
        label: "Sprint",
        stacks: 1,
        durationPct: -1,
        speedMult: 1 + pct,
        color: "#7cfc00",
        logDetail: `+${Math.round(pct * 100)}% move speed (out of combat)`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#7cfc00", label: "Sprint" },
  ),

  // Forest — on-kill haste.
  defineBuff(
    "mob-haste",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, FOREST_HASTE);
      if (!fx) return null;
      const pct = fx.data["speedPct"] ?? 0;
      return {
        id: "mob-haste",
        label: "Haste",
        stacks: 1,
        durationPct: effectDurationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        speedMult: 1 + pct,
        color: "#9acd32",
        logDetail: `+${Math.round(pct * 100)}% move speed (kill)`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#9acd32", label: "Haste" },
  ),

  // Mountain — on-new-target burst.
  defineBuff(
    "mob-burst",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, MOUNTAIN_BURST);
      if (!fx) return null;
      const pct = fx.data["speedPct"] ?? 0;
      return {
        id: "mob-burst",
        label: "Burst",
        stacks: 1,
        durationPct: effectDurationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        speedMult: 1 + pct,
        color: "#87cefa",
        logDetail: `+${Math.round(pct * 100)}% move speed (new target)`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#87cefa", label: "Burst" },
  ),

  // Graveyard — stacking on-kill speed + tenacity.
  defineBuff(
    "mob-grave",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, GRAVEYARD_HASTE);
      if (!fx) return null;
      const sPct = (fx.data["speedPct"] ?? 0) * fx.stacks;
      const tPct = (fx.data["tenacityPct"] ?? 0) * fx.stacks;
      return {
        id: "mob-grave",
        label: "Grave",
        stacks: fx.stacks,
        durationPct: effectDurationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        speedMult: 1 + sPct,
        color: "#b39ddb",
        logDetail: `+${Math.round(sPct * 100)}% move speed, ${Math.round(
          tPct * 100,
        )}% tenacity`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#b39ddb", label: "Grave" },
  ),

  // Desert — extra speed while actively moving away from the target.
  defineBuff(
    "mob-kite",
    ({ player, world }) => {
      const pct = player.usesSkills.passives["mobility.kite-speed-pct"] ?? 0;
      if (pct <= 0 || !isMovingAwayFromTarget(world, player)) return null;
      return {
        id: "mob-kite",
        label: "Kite",
        stacks: 1,
        durationPct: -1,
        speedMult: 1 + pct,
        color: "#ffd27f",
        logDetail: `+${Math.round(pct * 100)}% move speed (kiting)`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#ffd27f", label: "Kite" },
  ),

  // Tundra — continuous-move ramp (durationPct shows the ramp filling toward cap).
  defineBuff(
    "mob-rush",
    ({ player }) => {
      const cap = player.usesSkills.passives["mobility.ramp-speed-pct"] ?? 0;
      if (cap <= 0) return null;
      const rate = player.usesSkills.passives["mobility.ramp-rate"] ?? 0;
      const secs = getCounter(player.tracksCombat, MOVE_TIMER) / 1000;
      const pct = Math.min(cap, secs * rate);
      if (pct <= 0) return null;
      return {
        id: "mob-rush",
        label: "Rush",
        stacks: 1,
        durationPct: (pct / cap) * 100,
        speedMult: 1 + pct,
        color: "#80deea",
        logDetail: `+${Math.round(pct * 100)}% move speed (ramp)`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#80deea", label: "Rush" },
  ),

  // Volcanic — passive speed, present while not suppressed.
  defineBuff(
    "mob-volcanic",
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      const pct = player.usesSkills.passives["mobility.passive-speed-pct"] ?? 0;
      if (pct <= 0 || hasStatusEffect(playerCs, VOLCANIC_SUPPRESS)) return null;
      return {
        id: "mob-volcanic",
        label: "Pyre",
        stacks: 1,
        durationPct: -1,
        speedMult: 1 + pct,
        color: "#ff8a50",
        logDetail: `+${Math.round(pct * 100)}% move speed`,
      };
    },
    { ...NEUTRAL_CIRCLE, color: "#ff8a50", label: "Pyre" },
  ),

  // Volcanic — suppression debuff window after taking a direct hit. No speedMult:
  // the base speed already excludes the suppressed bonus (mob-volcanic returns null
  // while this is active), so the client product correctly drops to 1.
  defineBuff(
    "mob-suppress",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, VOLCANIC_SUPPRESS);
      if (!fx) return null;
      return {
        id: "mob-suppress",
        label: "Heavy",
        stacks: 1,
        durationPct: effectDurationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        color: "#a9744f",
        logDetail: "speed bonus suppressed",
      };
    },
    { category: "neutral" as const, shape: "diamond" as const, color: "#a9744f", label: "Heavy" },
  ),
] as const satisfies readonly BuffDescriptor[];
