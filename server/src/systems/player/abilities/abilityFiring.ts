/**
 * Ability auto-fire — the per-tick driver for equipped abilities.
 *
 * Each ability fires on its built-in trigger with ZERO runes equipped; a
 * `use-ability` Rune overrides the named ability's default timing. Custom rules
 * arbitrate in Rune order; remaining defaults follow attunement order.
 *
 * Execution shapes:
 * - `armed`   — arms the next attack (`hasArmedAbility`); the rider lands in
 *               `abilityEffects.ts`.
 * - `cast`    — starts a wind-up (`isCastingAbility`); see `abilityCasting.ts`.
 * - `charge`  — starts a wind-up, then enters a fast target-bound rush.
 * - `reposition` — resolves immediately by moving the player.
 * - `instant` — an immediate self-facing effect.
 *
 * Runs in `World.tick` after rune-derived flags are stamped and after targets are
 * acquired, but before combat resolves, so an armed Technique is honored this tick.
 */
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_DATABASE,
  ABILITY_FRENZY_EFFECT_ID,
  GAME_CONFIG,
  abilityRankAt,
  applyStatusEffect,
  getCooldown,
  guardEffectIdForAbility,
  cleanseableStacks,
  isCleanseable,
  isHarmfulPlayerStatusEffect,
  recoveryEffectIdForAbility,
  removeStatusEffect,
  removeStatusEffectStacks,
  resolveAbilityEffect,
  resolveAbilityEffectWithPassives,
  setCooldown,
  type AbilityDef,
  type AbilityTrigger,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { getAbilityRuneTargets } from "../../combat/ai/runeConfig";
import {
  isHardControlled,
  worstHardControl,
} from "../../combat/status/playerHardControl";
import { syncPlayerControlLockout } from "../../combat/status/playerControlLockout";
import { activateRecovery } from "../../defense/regen/recovery";
import { repositionPlayer } from "../../combat/damage/knockback";
import { abilityCooldownKey, guardCooldownMs, startTechniqueCooldown } from "./abilityCooldowns";
import { beginAbilityCast } from "./abilityCasting";
import { applyBrambleGuard } from "./abilityBramble";
import { abilityTarget, gapToTarget, nearestMonsterGap } from "./abilityTargeting";
import { armTechnique } from "./abilityArming";
import { actorFromPlayer } from "../../../world/worldLogActors";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";

/** Hard cap on Break Free's control resistance — never total immunity. */
const CONTROL_RESIST_CAP = 0.9;

/**
 * Shared one-tick gate so at most ONE Guard ACTIVATION resolves per decision
 * window. Already-active Guard buffs are untouched and may overlap — this only
 * stops instant defensive combo-dumping.
 */
const GUARD_WINDOW_KEY = "ability.guard.window";
const GUARD_WINDOW_MS = 100; // one logic tick at 10 Hz

interface FireContext {
  inCombat: boolean;
  hpPct: number;
  aggroCount: number;
  hasHarmfulDebuff: boolean;
  hardControlled: boolean;
}

interface TechniqueAttempt {
  activated: boolean;
  claimed: boolean;
}

const DECLINED_TECHNIQUE: TechniqueAttempt = { activated: false, claimed: false };
const CLAIMED_TECHNIQUE: TechniqueAttempt = { activated: false, claimed: true };

export interface ManualAbilityResult {
  success: boolean;
  reason?: string;
  state?: "activated" | "queued" | "cancelled" | "rejected";
}

interface ManualAbilityAttempt extends ManualAbilityResult {
  retryable: boolean;
}

export function updateAbilityFiring(world: World, now: number): void {
  for (const player of world.livePlayers) {
    updateQueuedAbilityUses(world, player, now);

    // The Auto Combat toggle owns default/Rune ability activation. Fight Back is
    // the deliberate exception: while it temporarily owns travel combat, the
    // player behaves exactly as though Auto Combat were enabled. Manual hotbar
    // requests do not enter this driver and remain available in either state.
    if (!player.usesAutocombat.auto && !player.fightsWhileTraveling) continue;
    const equipped = player.tracksProgression.attunedAbilities;
    if (!equipped) continue;
    const priority = getAbilityRuneTargets(player);
    const ordered = (ids: string[]) => [...priority.filter(id => ids.includes(id)), ...ids.filter(id => !priority.includes(id))];
    const techniques = ordered(equipped.techniques ?? []);
    const guards = ordered(equipped.guards ?? []);
    if (techniques.length === 0 && guards.length === 0) continue;

    const fctx = buildFireContext(world, player);

    // Techniques share ONE offensive execution channel: at most one may be
    // armed/casting at a time. Walk in loadout order — index 0 is the player's
    // declared priority — and stop at the first one that CLAIMS the channel, so
    // arbitration is deterministic when several rune conditions go valid at once.
    //
    // An `instant` Technique (Frenzy) is self-facing and claims nothing, so it
    // neither blocks nor is blocked by an armed charge sitting on the channel.
    let offensiveClaimed = false;
    for (const abilityId of techniques) {
      if (offensiveClaimed && ABILITY_DATABASE.get(abilityId)?.shape !== "instant") continue;
      const attempt = maybeFireTechnique(world, player, abilityId, fctx, now);
      offensiveClaimed = attempt.claimed || offensiveClaimed;
    }

    // Guards are independent, but only one ACTIVATION resolves per window.
    for (const abilityId of guards) {
      if (maybeFireGuard(world, player, abilityId, fctx)) break;
    }
  }
}

/**
 * Authoritative toggle boundary for a player pressing an attuned ability hotkey.
 * A legal request activates immediately. A temporarily illegal request is held
 * in the runtime queue and retried; pressing its hotkey again cancels it.
 */
export function requestManualAbilityUse(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  now = Date.now(),
): ManualAbilityResult {
  // Validate before treating the press as a cancel. Loadout edits normally prune
  // stale queue entries immediately, but this keeps the untrusted request
  // boundary correct even if a stale runtime component is ever observed.
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability) {
    removeQueuedAbility(world, player, abilityId);
    return { success: false, reason: "Unknown ability.", state: "rejected" };
  }
  const attuned = ability.slot === "technique"
    ? player.tracksProgression.attunedAbilities.techniques
    : player.tracksProgression.attunedAbilities.guards;
  if (!attuned.includes(abilityId)) {
    removeQueuedAbility(world, player, abilityId);
    return { success: false, reason: "Ability is not attuned.", state: "rejected" };
  }

  const queued = player.queuesAbilities?.abilityIds.includes(abilityId) ?? false;
  if (queued) {
    removeQueuedAbility(world, player, abilityId);
    return { success: true, state: "cancelled" };
  }

  const attempt = attemptManualAbilityUse(world, player, abilityId, now);
  if (attempt.success) return { success: true, state: "activated" };
  if (!attempt.retryable) {
    return { success: false, reason: attempt.reason, state: "rejected" };
  }

  const abilityIds = [...(player.queuesAbilities?.abilityIds ?? []), abilityId];
  attachComponent(world, player, "queuesAbilities", { abilityIds });
  return { success: true, state: "queued" };
}

/** One authoritative activation attempt, shared by direct presses and queue ticks. */
function attemptManualAbilityUse(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  now: number,
): ManualAbilityAttempt {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability) return { success: false, reason: "Unknown ability.", retryable: false };
  const attuned = ability.slot === "technique"
    ? player.tracksProgression.attunedAbilities.techniques
    : player.tracksProgression.attunedAbilities.guards;
  if (!attuned.includes(abilityId)) {
    return { success: false, reason: "Ability is not attuned.", retryable: false };
  }

  const fctx = buildFireContext(world, player);
  if (fctx.hardControlled && ability.trigger.kind !== "has-hard-control") {
    return { success: false, reason: "Cannot use that ability while controlled.", retryable: true };
  }

  // Enemy-facing manual actions use exactly the current combat target. The
  // automatic driver retains its extended-range nearest-target fallback.
  const requiresTarget = ability.slot === "technique"
    && ability.shape !== "instant"
    && ability.shape !== "self-cast";
  if (requiresTarget && !abilityTarget(world, player, ability, true)) {
    return { success: false, reason: "No valid current target.", retryable: true };
  }

  if (ability.slot === "technique") {
    const attempt = maybeFireTechnique(
      world,
      player,
      abilityId,
      fctx,
      now,
      { manual: true, currentTargetOnly: true },
    );
    if (!attempt.activated) {
      return {
        success: false,
        reason: attempt.claimed
          ? "Another Technique is already active."
          : "Ability is not ready.",
        retryable: true,
      };
    }
    return { success: true, retryable: false };
  }

  if (!maybeFireGuard(world, player, abilityId, fctx, true)) {
    return {
      success: false,
      reason: "Ability is not ready or its requirements are not met.",
      retryable: true,
    };
  }
  return { success: true, retryable: false };
}

function updateQueuedAbilityUses(
  world: World,
  player: PlayerEntity,
  now: number,
): void {
  for (const abilityId of [...(player.queuesAbilities?.abilityIds ?? [])]) {
    const attempt = attemptManualAbilityUse(world, player, abilityId, now);
    if (attempt.success || !attempt.retryable) {
      removeQueuedAbility(world, player, abilityId);
    }
  }
}

function removeQueuedAbility(
  world: World,
  player: PlayerEntity,
  abilityId: string,
): void {
  const current = player.queuesAbilities?.abilityIds;
  if (!current?.includes(abilityId)) return;
  const abilityIds = current.filter((id) => id !== abilityId);
  if (abilityIds.length === 0) {
    detachComponent(world, player, "queuesAbilities");
  } else {
    attachComponent(world, player, "queuesAbilities", { abilityIds });
  }
}

function buildFireContext(world: World, player: PlayerEntity): FireContext {
  let aggroCount = 0;
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      aggroCount++;
    }
  }
  const attackTargetId = player.hasAttackTarget?.targetId;
  const inCombat =
    (attackTargetId !== undefined && world.hasMonster(attackTargetId)) ||
    aggroCount > 0;
  const hasHarmfulDebuff = player.tracksCombat.statusEffects.some(
    (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
  );
  return {
    inCombat,
    hpPct: player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    aggroCount,
    hasHarmfulDebuff,
    hardControlled: isHardControlled(player.tracksCombat),
  };
}

/**
 * Evaluate a built-in trigger. `world`/`player`/`ability` are needed by the
 * spatial triggers, which ask about the ability's OWN reach rather than the
 * player's — that is what lets a gap-closer notice a gap it can actually close.
 */
function triggerActive(
  trigger: AbilityTrigger,
  fctx: FireContext,
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): boolean {
  switch (trigger.kind) {
    case "in-combat":
      return fctx.inCombat;
    case "hp-below":
      return fctx.hpPct <= trigger.hpPct;
    case "n-aggro":
      return fctx.aggroCount >= trigger.count;
    case "has-debuff":
      return fctx.hasHarmfulDebuff;
    case "has-hard-control":
      return fctx.hardControlled;
    case "target-beyond-reach": {
      // There must be something inside the ABILITY's reach that is meaningfully
      // outside the player's own. Firing a gap-closer at a target already in
      // contact burns the cooldown for nothing, which is exactly what made
      // Charge feel pointless.
      const target = abilityTarget(world, player, ability);
      if (!target) return false;
      return gapToTarget(player, target) >= trigger.minGapPx;
    }
    case "enemy-within": {
      const gap = nearestMonsterGap(world, player);
      return gap !== null && gap <= trigger.maxGapPx;
    }
  }
}

/** Custom rules replace the authored default only for their named ability. */
function shouldFire(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  fctx: FireContext,
): boolean {
  if (player.tracksProgression.runesEquipped.some(rule => rule.actionId === "use-ability" && rule.targetAbilityId === ability.id)) {
    return getAbilityRuneTargets(player).includes(ability.id);
  }
  return triggerActive(ability.trigger, fctx, world, player, ability);
}

/** Returns true when the slot CLAIMED the shared offensive channel. */
function maybeFireTechnique(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  fctx: FireContext,
  now: number,
  options: { manual?: boolean; currentTargetOnly?: boolean } = {},
): TechniqueAttempt {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "technique") return DECLINED_TECHNIQUE;
  const cdKey = abilityCooldownKey(abilityId);

  if (fctx.hardControlled) return DECLINED_TECHNIQUE;
  if (player.isChanneling) return DECLINED_TECHNIQUE;
  if (
    player.isRooted
    && (ability.shape === "reposition" || ability.shape === "charge")
  ) return DECLINED_TECHNIQUE;

  // A self-facing offensive buff is not an attack: it neither waits for the
  // armed/cast channel nor occupies it, so Frenzy can go up while Quick Strike
  // is still waiting for a hit to consume it.
  if (ability.shape === "instant") {
    if (getCooldown(player.tracksCombat, cdKey) > 0) return DECLINED_TECHNIQUE;
    if (!options.manual && !shouldFire(world, player, ability, fctx)) return DECLINED_TECHNIQUE;
    applyInstantTechnique(world, player, ability);
    recordAbilityActivation(world, player, abilityId, 'technique');
    startTechniqueCooldown(player, ability);
    // Carry the window length so the client can sustain an in-world cue for the
    // ability's REAL duration. Resolved here rather than looked up client-side
    // because the authored rank is the server's to interpret.
    const windowEffect = resolveTechniqueEffect(player, ability);
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-technique-armed",
      playerId: player.isPlayer.id,
      ability: abilityId,
      durationMs:
        windowEffect.kind === "attack-speed" ? windowEffect.durationMs : undefined,
    });
    return { activated: true, claimed: false };
  }

  // The previous Sweep charge is already being paid out across this ammo clip.
  // Do not spend another Sweep cooldown into it; later slots remain eligible.
  if (ability.id === "sweep" && player.hasSweepClip) return DECLINED_TECHNIQUE;

  // One offensive channel: an armed charge persists until a hit consumes it, and
  // a cast owns the channel until it resolves. Neither may be pre-empted.
  if (
    player.hasArmedAbility ||
    player.hasFormationTechnique ||
    player.isCastingAbility ||
    player.isChargingAbility
  ) return CLAIMED_TECHNIQUE;
  if (getCooldown(player.tracksCombat, cdKey) > 0) return DECLINED_TECHNIQUE;
  if (!options.manual && !shouldFire(world, player, ability, fctx)) return DECLINED_TECHNIQUE;

  // A cast pays its cooldown on RESOLVE, not on begin (see abilityCasting.ts),
  // so nothing is charged here.
  if (
    ability.shape === "cast" ||
    ability.shape === "charge" ||
    ability.shape === "self-cast"
  ) {
    const started = beginAbilityCast(world, player, ability, now, options.currentTargetOnly);
    if (started) recordAbilityActivation(world, player, abilityId, 'technique');
    return { activated: started, claimed: started };
  }

  // Reposition (Charge / Disengage): the movement resolves NOW. If it carries a
  // strike rider it then arms as usual, turning the gap-close into an alpha
  // strike. A dash with nowhere to go declines to fire so the cooldown isn't wasted.
  if (ability.shape === "reposition") {
    const effect = resolveTechniqueEffect(player, ability);
    if (effect.kind !== "reposition") return DECLINED_TECHNIQUE;
    const target = abilityTarget(world, player, ability, options.currentTargetOnly);
    if (!target) return DECLINED_TECHNIQUE;
    const from = { ...player.hasPosition.current };
    // A gap-CLOSER stops when the gap is closed. Moving the full authored
    // distance regardless would sail the player straight through anything that
    // was nearer than the dash is long, landing them behind it and out of reach —
    // the opposite of the ability's job. Aim comfortably inside the player's own
    // reach so a ranged build closes to firing distance, not to contact.
    const distance = effect.toward
      ? Math.min(
        effect.distance,
        Math.max(0, gapToTarget(player, target) - player.performsAttack.attackRange * 0.7),
      )
      : effect.distance;
    if (distance <= 0) return DECLINED_TECHNIQUE;
    if (
      repositionPlayer(
        world,
        player,
        target.hasPosition.current,
        distance,
        effect.toward,
      ) === null
    ) {
      return DECLINED_TECHNIQUE;
    }
    startTechniqueCooldown(player, ability);
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-reposition",
      playerId: player.isPlayer.id,
      ability: abilityId,
      from,
      to: { ...player.hasPosition.current },
    });
    recordAbilityActivation(world, player, abilityId, 'technique');
    if (effect.empowerMult !== undefined) {
      armTechnique(world, player, abilityId);
    }
    return { activated: true, claimed: true };
  }

  armTechnique(world, player, abilityId);
  startTechniqueCooldown(player, ability);

  // Cosmetic: tell the node the Technique armed so the client telegraphs it
  // (skill-name callout + red cooldown bar until the charge is consumed).
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-technique-armed",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  recordAbilityActivation(world, player, abilityId, 'technique');
  return { activated: true, claimed: true };
}

type RemovedEffect = { effectId: string; stacks: number };

function recordAbilityActivation(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  slot: 'guard' | 'technique',
  removedEffects?: RemovedEffect[],
): void {
  recordWorldLogEvent(world, {
    kind: 'ability-activation',
    nodeId: player.hasPosition.nodeId,
    player: actorFromPlayer(player),
    abilityId,
    slot,
    ...(removedEffects && removedEffects.length > 0 ? { removedEffects } : {}),
  }, {
    visibility: 'combat',
    relatedPlayerIds: [player.isPlayer.id],
    nodeId: player.hasPosition.nodeId,
  });
}

function resolveTechniqueEffect(player: PlayerEntity, ability: AbilityDef) {
  return resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: player.usesSkills.passives["technique.power-pct"] ?? 0,
  });
}

/**
 * Instant Techniques — today, Frenzy.
 *
 * The attack-speed window is stored as a STATUS EFFECT and read at the attack
 * cadence gate (`combat.ts`), never written into `performsAttack.attackCooldown`.
 * Mutating the stat is how the Zealot Frenzy works, and two mutators that each
 * cache "the clean base" would ratchet against each other; the frost-ramp slow
 * already proved the multiplier-at-the-gate shape is the safe one.
 */
function applyInstantTechnique(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  const effect = resolveTechniqueEffect(player, ability);
  if (effect.kind !== "attack-speed") return;
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_FRENZY_EFFECT_ID,
    maxStacks: 1,
    remainingMs: effect.durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: { totalMs: effect.durationMs, attackSpeedPct: effect.attackSpeedPct },
  });
}

/** Returns true when the Guard activated (and therefore claimed the window). */
function maybeFireGuard(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  fctx: FireContext,
  manual = false,
): boolean {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "guard") return false;
  const cdKey = abilityCooldownKey(abilityId);
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  // One activation per decision window — ongoing buffs still overlap freely.
  if (getCooldown(player.tracksCombat, GUARD_WINDOW_KEY) > 0) return false;
  if (fctx.hardControlled && ability.trigger.kind !== "has-hard-control") return false;
  if (!guardEffectCanFire(player, ability, fctx)) return false;
  if (!manual && !shouldFire(world, player, ability, fctx)) return false;

  // Charm Guard-ability amplifiers. Only present while an amplifying charm is
  // equipped; they merge into passives via the equipment loop in stats.ts.
  const passives = player.usesSkills.passives;

  const removedEffects = applyGuardEffect(world, player, ability, passives);

  // guard.recovery-on-fire-pct: firing any Guard switches on a slice of Recovery.
  // A charm rider, NOT a Recovery skill — recovery-skill-potency does not touch it.
  const onFirePct = passives["guard.recovery-on-fire-pct"] ?? 0;
  if (onFirePct > 0) {
    activateRecovery(
      player.tracksCombat,
      "guard",
      onFirePct,
      passives["guard.recovery-on-fire-ms"] ?? GAME_CONFIG.RECOVERY_ON_GUARD_MS,
    );
  }

  setCooldown(player.tracksCombat, cdKey, guardCooldownMs(player, ability));
  setCooldown(player.tracksCombat, GUARD_WINDOW_KEY, GUARD_WINDOW_MS);

  // Cosmetic: tell the node a Guard fired so the client overlays the Guard FX on
  // the player's sprite.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-guard",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  recordAbilityActivation(world, player, abilityId, 'guard', removedEffects);
  return true;
}

function applyGuardEffect(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  passives: Record<string, number>,
): RemovedEffect[] | undefined {
  // Guards resolve their magnitudes through the shared seam so the authored rank
  // applies. Technique Power deliberately does NOT — guard potency is the
  // defensive stat family and the budgets must not cross.
  const effect = resolveAbilityEffectWithPassives(ability, player.tracksProgression.playerTier, passives);
  if (effect.kind === "damage-reduction") {
    applyGuardDrBuff(
      player,
      ability.id,
      effect.drPct,
      effect.durationMs,
      effect.knockbackResistPct,
    );
  } else if (effect.kind === "cleanse") {
    return applyCleanse(player, effect.stacks, effect.debuffs);
  } else if (effect.kind === "break-free") {
    applyBreakFree(world, player, effect.controlResistPct, effect.controlResistMs);
  } else if (effect.kind === "heal") {
    applyGuardHeal(player, ability, effect.recoveryPct, effect.durationMs);
  } else if (effect.kind === "bramble") {
    applyBrambleGuard(player, effect.platingBonus, effect.reflectFlat, effect.durationMs);
  }
  // Technique effect kinds are ignored here — they are applied on the offensive
  // channel, never as a Guard immediate.
}

/**
 * Strip `stacks` from up to `debuffs` distinct harmful effects.
 *
 * DETERMINISTIC PRIORITY, not map order: when several afflictions are present,
 * take the deepest stack first (that is the one doing the most, and the one the
 * player cannot out-heal), and break ties by id so two identical situations
 * always cleanse the same thing. Instanced effects are skipped — they are
 * per-source entries, and stripping one of five identical burns reads as the
 * button doing nothing.
 */
function applyCleanse(player: PlayerEntity, stacks: number, debuffs: number): RemovedEffect[] {
  const cs = player.tracksCombat;
  const byId = new Map<string, { stacks: number; data: Record<string, number> }>();
  for (const effect of cs.statusEffects) {
    if (effect.instanced) continue;
    if (effect.stacks <= 0) continue;
    if (!isHarmfulPlayerStatusEffect(effect.id, effect.data)) continue;
    // CLEANSE POLICY (redesign §4.7). Being harmful is no longer enough: Heat is
    // genuinely hurting you and is still the wrong thing to answer with a button,
    // because walking out of the vent is the mechanic. Immune effects are skipped
    // ENTIRELY here rather than filtered later, so they cannot consume one of the
    // `debuffs` slots and quietly make Cleanse do nothing.
    if (!isCleanseable(effect.id, effect.data)) continue;
    const existing = byId.get(effect.id);
    if (!existing || effect.stacks > existing.stacks) {
      byId.set(effect.id, { stacks: effect.stacks, data: effect.data });
    }
  }
  const ordered = [...byId.entries()]
    .sort((a, b) => (b[1].stacks - a[1].stacks) || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, debuffs));
  const removed: RemovedEffect[] = [];
  for (const [id, { stacks: before, data }] of ordered) {
    // A `partial` effect is REDUCED, never deleted: the room re-applies it, so a
    // full strip would be true for a second and read as the button not working.
    const allowed = cleanseableStacks(id, data, Math.max(1, stacks));
    if (allowed <= 0) continue;
    removeStatusEffectStacks(cs, id, allowed);
    const after = cs.statusEffects.find((effect) => effect.id === id)?.stacks ?? 0;
    const removedStacks = Math.max(0, before - after);
    if (removedStacks > 0) removed.push({ effectId: id, stacks: removedStacks });
  }
  return removed;
}

/**
 * Break Free: remove the hard control holding the player, then optionally leave
 * a control-resistance window behind.
 *
 * Removing the effect is not enough on its own — `stun` owns `isRooted` and
 * `cannotAttack` through the control-lockout reconciler, so we re-sync
 * immediately rather than leaving the player locked for a tick after the thing
 * locking them is gone.
 */
function applyBreakFree(
  world: World,
  player: PlayerEntity,
  controlResistPct: number | undefined,
  controlResistMs: number | undefined,
): void {
  const cs = player.tracksCombat;
  const worst = worstHardControl(cs);
  if (worst) removeStatusEffect(cs, worst);
  syncPlayerControlLockout(world, player);

  if (controlResistPct !== undefined && controlResistMs !== undefined) {
    applyStatusEffect(cs, {
      id: ABILITY_CONTROL_RESIST_EFFECT_ID,
      maxStacks: 1,
      remainingMs: controlResistMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: {
        totalMs: controlResistMs,
        controlResistPct: Math.min(CONTROL_RESIST_CAP, Math.max(0, controlResistPct)),
      },
    });
  }
}

function guardEffectCanFire(
  player: PlayerEntity,
  ability: AbilityDef,
  fctx: FireContext,
): boolean {
  const effect = abilityRankAt(ability, player.tracksProgression.playerTier).effect;
  if (effect.kind === "heal") {
    return player.hasHealth.hp < player.hasHealth.maxHp - 0.5;
  }
  // Break Free is the one ability whose whole value is situational. Firing it
  // with nothing to break would waste a 14 s cooldown on nothing.
  if (effect.kind === "break-free") return fctx.hardControlled;
  if (effect.kind === "cleanse") return fctx.hasHarmfulDebuff;
  return true;
}

/**
 * Fire a Recovery-skill Guard (Second Wind / Recuperate): switch on a fraction of
 * the player's Recovery rate for a window. The healing itself is paid out by the
 * Recovery engine, so this shares antiheal, the overheal ward and
 * `core.recovery-mult` with every other regen effect instead of running its own HoT.
 *
 * `defense.recovery-skill-potency` scales the fraction, and ONLY for abilities
 * carrying the `recovery` tag — that is the whole point of the tag.
 *
 * The Recovery source is keyed by ability identity. Second Wind and Recuperate are
 * deliberate opposites (strong/short vs weak/long) and a player may hold both;
 * sharing one source would let the stronger fraction ride the longer window, which
 * is strictly better than either ability as authored.
 */
function applyGuardHeal(
  player: PlayerEntity,
  ability: AbilityDef,
  recoveryPct: number,
  durationMs: number,
): void {
  const ms = durationMs > 0 ? durationMs : GAME_CONFIG.RECOVERY_SKILL_MS;
  activateRecovery(player.tracksCombat, ability.id === "recuperate" ? "skill-2" : "skill", recoveryPct, ms);
  applyStatusEffect(player.tracksCombat, {
    id: recoveryEffectIdForAbility(ability.id)!,
    remainingMs: ms,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: ms,
      recoveryPct,
    },
  });
}

/**
 * Apply the explicit Guard damage-reduction buff (a status effect on
 * TracksCombat). updateTracksCombat decrements remainingMs; abilityEffects'
 * onDamageTaken reads drPct; the buff descriptor (abilityBuffs.ts) projects it to
 * the buff bar. `totalMs` drives the clock. guard.potency-pct scales magnitude;
 * guard.duration-pct extends it. Shared by Brace and Endure.
 *
 * Each authored DR ability owns a stable effect ID. Reordering attunements
 * cannot overwrite or relabel a running effect.
 */
function applyGuardDrBuff(
  player: PlayerEntity,
  abilityId: string,
  drPct: number,
  durationMs: number,
  knockbackResistPct?: number,
): void {
  applyStatusEffect(player.tracksCombat, {
    id: guardEffectIdForAbility(abilityId)!,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: durationMs,
      drPct,
      ...(knockbackResistPct !== undefined ? { knockbackResistPct } : {}),
    },
  });
}
