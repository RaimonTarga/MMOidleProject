/**
 * Ability firing — fire one given ability now.
 *
 * Nothing fires an ability on its own: the player has no ability bar, no
 * attunement and no Use Ability rune. The class runtimes call `fireTechnique` /
 * `fireGuard` when their system decides (a Striker beat, a Squire response...).
 * Every engine rule still applies here: per-ability cooldowns, the one offensive
 * channel, one Guard activation per decision window, control, and the execution
 * gates that stop an ability spending its cooldown where it would do nothing
 * (see `fireGateOpen`). A caller firing several Techniques arbitrates with the
 * returned `claimed` flag.
 *
 * Execution shapes:
 * - `armed`   — arms the next attack (`hasArmedAbility`); the rider lands in
 *               `abilityEffects.ts`.
 * - `cast`    — starts a wind-up (`isCastingAbility`); see `abilityCasting.ts`.
 * - `charge`  — starts a wind-up, then enters a fast target-bound rush.
 * - `reposition` — resolves immediately by moving the player.
 * - `instant` — an immediate self-facing effect.
 *
 * A caller in `World.tick` should fire after rune-derived flags are stamped and
 * targets are acquired, but before casts advance and combat resolves, so an armed
 * Technique is honored the same tick.
 */
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_DATABASE,
  ABILITY_SIDESTEP_EFFECT_ID,
  CHARGE_MIN_GAP_PX,
  GAME_CONFIG,
  abilityActsWhileControlled,
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
  sidestepWindow,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import {
  activePlayerRoots,
  isHardControlled,
  isPlayerControlled,
  worstHardControl,
} from "../../combat/status/playerHardControl";
import { syncPlayerControlLockout } from "../../combat/status/playerControlLockout";
import { cleansePlayerAfflictions, type RemovedEffect } from "../../combat/status/cleanse";
import { activateRecovery } from "../../defense/regen/recovery";
import { onGuardFired } from "../../defense/charmHooks";
import { onTechniqueResolved } from "../../combat/techniqueResolved";
import { repositionPlayer } from "../../combat/damage/knockback";
import { abilityCooldownKey, guardCooldownMs, startTechniqueCooldown } from "./abilityCooldowns";
import { beginAbilityCast } from "./abilityCasting";
import { applyBrambleGuard } from "./abilityBramble";
import { abilityTarget, gapToTarget } from "./abilityTargeting";
import { armTechnique } from "./abilityArming";
import { afflictionTechniqueHasWork } from "./abilityAffliction";
import { applyImbueWindow } from "./abilityImbue";
import { usesSummonTechniques } from "../../classes/archetypes/summoner/profile";
import { formationChargeHasGap } from "./formationCharge";
import { actorFromPlayer } from "../../../world/worldLogActors";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { advanceKata, techniquePowerPctFor } from "./abilityKata";

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
  hasHarmfulDebuff: boolean;
  hardControlled: boolean;
  /** Hard-controlled or rooted: something for Break Free to break. */
  controlled: boolean;
}

/** What one `fireTechnique` call did. */
export interface TechniqueAttempt {
  /** The Technique fired: armed, began its cast, moved, or opened its window. */
  activated: boolean;
  /**
   * It holds (or found already held) the one offensive channel. A caller walking
   * several Techniques stops offering non-instant ones once this is true.
   */
  claimed: boolean;
}

export interface FireTechniqueOptions {
  /** Act on exactly the player's current attack target: no nearest-in-reach fallback. */
  currentTargetOnly?: boolean;
  /**
   * Charge at any range. Without it Charge keeps its gap gate: it fires only on
   * a target meaningfully outside the player's own reach.
   */
  chargeAtAnyRange?: boolean;
}

const DECLINED_TECHNIQUE: TechniqueAttempt = { activated: false, claimed: false };
const CLAIMED_TECHNIQUE: TechniqueAttempt = { activated: false, claimed: true };

function buildFireContext(player: PlayerEntity): FireContext {
  return {
    hasHarmfulDebuff: player.tracksCombat.statusEffects.some(
      (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
    ),
    hardControlled: isHardControlled(player.tracksCombat),
    controlled: isPlayerControlled(player),
  };
}

/**
 * Execution gates. These are not triggers — the caller decides WHEN — they only
 * stop an ability spending its cooldown where it can do nothing. They ask about
 * the ability's OWN reach rather than the player's.
 */
function fireGateOpen(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  chargeAtAnyRange = false,
): boolean {
  if (ability.shape === "charge") {
    const target = abilityTarget(world, player, ability);
    if (!target) return false;
    // The gap gate stands in for a missing moment: "charge the next enemy worth
    // closing on". A caller that chose its moment (an opener, say) skips it, and
    // Charge still lands its strike rider from contact, so it fires at any range.
    if (chargeAtAnyRange) return true;
    // A gap-closer needs a gap: something inside the ABILITY's reach that is
    // meaningfully outside the player's own.
    if (usesSummonTechniques(player)) {
      return formationChargeHasGap(world, player, target, ability, CHARGE_MIN_GAP_PX);
    }
    return gapToTarget(player, target) >= CHARGE_MIN_GAP_PX;
  }
  return true;
}

/**
 * Fire one Technique now, if it can fire: off cooldown, the player not hard
 * controlled or channeling, the offensive channel free (an `instant` Technique
 * claims nothing), and its execution gate open. A cast pays its cooldown on
 * resolve, so an aborted wind-up costs nothing.
 */
export function fireTechnique(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  now: number,
  options: FireTechniqueOptions = {},
): TechniqueAttempt {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "technique") return DECLINED_TECHNIQUE;
  const cdKey = abilityCooldownKey(abilityId);
  const fctx = buildFireContext(player);

  if (fctx.hardControlled) return DECLINED_TECHNIQUE;
  if (player.isChanneling) return DECLINED_TECHNIQUE;
  if (
    player.isRooted
    && (ability.shape === "reposition" || (ability.shape === "charge" && !usesSummonTechniques(player)))
  ) return DECLINED_TECHNIQUE;

  // A self-facing offensive buff is not an attack: it neither waits for the
  // armed/cast channel nor occupies it, so Imbue Lightning can open its window
  // while Sweep is still waiting for a hit to consume it.
  if (ability.shape === "instant") {
    if (getCooldown(player.tracksCombat, cdKey) > 0) return DECLINED_TECHNIQUE;
    if (!fireGateOpen(world, player, ability, options.chargeAtAnyRange)) return DECLINED_TECHNIQUE;
    applyInstantTechnique(world, player, ability);
    recordAbilityActivation(world, player, abilityId, 'technique');
    // The cooldown starts BEFORE the resolution fires, because `technique-refund`
    // takes its share off the REMAINING cooldown: resolve first and the refund
    // reads zero and skips. The armed path below already orders it this way.
    startTechniqueCooldown(world, player, ability);
    // An instant Technique resolves the moment it fires, so firing IS landing.
    onTechniqueResolved(world, player, ability);
    // Imbue's window is spent in hits, not seconds, so the event carries no
    // `durationMs`: a timed cue would lie about how long it lasts.
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-technique-armed",
      playerId: player.isPlayer.id,
      ability: abilityId,
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
    player.hasFormationCharge ||
    player.isCastingAbility ||
    player.isChargingAbility
  ) return CLAIMED_TECHNIQUE;
  if (getCooldown(player.tracksCombat, cdKey) > 0) return DECLINED_TECHNIQUE;
  if (!fireGateOpen(world, player, ability, options.chargeAtAnyRange)) return DECLINED_TECHNIQUE;

  // A cast pays its cooldown on RESOLVE, not on begin (see abilityCasting.ts),
  // so nothing is charged here.
  if (
    ability.shape === "cast" ||
    ability.shape === "charge" ||
    ability.shape === "self-cast"
  ) {
    const started = beginAbilityCast(world, player, ability, now, options.currentTargetOnly);
    if (started) {
      advanceKata(player);
      recordAbilityActivation(world, player, abilityId, 'technique');
    }
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
    startTechniqueCooldown(world, player, ability);
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-reposition",
      playerId: player.isPlayer.id,
      ability: abilityId,
      from,
      to: { ...player.hasPosition.current },
    });
    advanceKata(player);
    recordAbilityActivation(world, player, abilityId, 'technique');
    if (effect.empowerMult !== undefined) {
      armTechnique(world, player, abilityId);
    } else {
      // A reposition with no strike rider has nothing further to land, so the
      // move itself is the landing. One that DOES arm pays out from the armed
      // rider instead, so nothing fires twice for one cooldown. The departure
      // point rides along: Disengage's Vanish drops the aggro of what was near it.
      // A backward one (Disengage) also broke from `target` — the threat it
      // reacted to — which is where its node fires (design §22.10: "on the body
      // you broke from").
      onTechniqueResolved(world, player, ability, {
        from,
        ...(effect.toward ? {} : { departedFrom: target }),
      });
    }
    return { activated: true, claimed: true };
  }

  // Armed Contagion declines to arm with nothing to spread or nowhere to spread
  // it — the rule the cast had before its wind-up, now before the arming (a
  // situational Technique never burns its cooldown on nothing).
  if (!armedTechniqueHasWork(world, player, ability, options.currentTargetOnly)) return DECLINED_TECHNIQUE;

  armTechnique(world, player, abilityId);
  startTechniqueCooldown(world, player, ability);

  // Cosmetic: tell the node the Technique armed so the client telegraphs it
  // (skill-name callout + red cooldown bar until the charge is consumed).
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-technique-armed",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  advanceKata(player);
  recordAbilityActivation(world, player, abilityId, 'technique');
  return { activated: true, claimed: true };
}

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
    techniquePowerPct: techniquePowerPctFor(player),
  });
}

/**
 * Instant Techniques — today, Imbue Lightning (instant since the ability pass,
 * design §22.9): the charge window opens the moment it is activated.
 */
function applyInstantTechnique(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  const effect = resolveTechniqueEffect(player, ability);
  if (effect.kind === "imbue") applyImbueWindow(world, player, ability);
}

/**
 * Whether an ARMED Technique has something to act on before it arms. Only armed
 * Contagion is situational: with no afflictions on the target, or no body to
 * spread them to, the spread would be a cooldown spent on nothing.
 */
function armedTechniqueHasWork(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  currentTargetOnly = false,
): boolean {
  if (resolveTechniqueEffect(player, ability).kind !== "spread-dots") return true;
  // The rider lands on whatever the next hit strikes: the player's own target,
  // or — for a Conduit, whose summons deliver it — any summon's engaged target.
  const candidates: MonsterEntity[] = [];
  const own = abilityTarget(world, player, ability, currentTargetOnly);
  if (own) candidates.push(own);
  if (usesSummonTechniques(player)) {
    for (const id of player.summonsMinions?.minionIds ?? []) {
      const targetId = world.getMinionEntity(id)?.hasAttackTarget?.targetId;
      const target = targetId ? world.getMonsterEntity(targetId) : undefined;
      if (target && target.hasPosition.nodeId === player.hasPosition.nodeId) candidates.push(target);
    }
  }
  return candidates.some((target) => afflictionTechniqueHasWork(world, player, ability, target));
}

/**
 * Fire one Guard now, if it can fire: off cooldown, no other Guard activated this
 * decision window, not hard controlled (unless it acts while controlled), and
 * its situational gate open. Returns true when it activated (and therefore
 * claimed the window).
 */
export function fireGuard(
  world: World,
  player: PlayerEntity,
  abilityId: string,
): boolean {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "guard") return false;
  const cdKey = abilityCooldownKey(abilityId);
  const fctx = buildFireContext(player);
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  // One activation per decision window — ongoing buffs still overlap freely.
  if (getCooldown(player.tracksCombat, GUARD_WINDOW_KEY) > 0) return false;
  if (fctx.hardControlled && !abilityActsWhileControlled(ability)) return false;
  if (!guardEffectCanFire(world, player, ability, fctx)) return false;
  if (!fireGateOpen(world, player, ability)) return false;

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

  onGuardFired(world, player, ability);

  setCooldown(player.tracksCombat, cdKey, guardCooldownMs(player, ability));
  setCooldown(player.tracksCombat, GUARD_WINDOW_KEY, GUARD_WINDOW_MS);

  // Cosmetic: tell the node a Guard fired so the client overlays the Guard FX on
  // the player's sprite.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-guard",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  if (removedEffects && removedEffects.length > 0) {
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-cleansed",
      playerId: player.isPlayer.id,
    });
  }
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
    return cleansePlayerAfflictions(player, effect.stacks, effect.debuffs);
  } else if (effect.kind === "break-free") {
    applyBreakFree(world, player, effect.controlResistPct, effect.controlResistMs);
  } else if (effect.kind === "heal") {
    applyGuardHeal(player, ability, effect.recoveryPct, effect.durationMs);
  } else if (effect.kind === "bramble") {
    applyBrambleGuard(player, effect.platingBonus, effect.reflectFlat, effect.durationMs);
  } else if (effect.kind === "dodge-window") {
    applySidestep(player, ability);
  }
  // Technique effect kinds are ignored here — they are applied on the offensive
  // channel, never as a Guard immediate.
}


/**
 * Break Free: remove the worst hard control AND every root holding the player,
 * then optionally leave a control-resistance window behind. Roots go in the same
 * activation because a player stunned mid-drag should come out of both.
 * Removing the lair-drag root also ends the drag (`updateLairDrags` releases a
 * haul whose root is gone).
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
  const removed = [...(worst ? [worst] : []), ...activePlayerRoots(cs)];
  for (const id of removed) removeStatusEffect(cs, id);
  if (removed.length > 0) {
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-cleansed",
      playerId: player.isPlayer.id,
    });
  }
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
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  fctx: FireContext,
): boolean {
  const effect = abilityRankAt(ability, player.tracksProgression.playerTier).effect;
  // Sidestep dodges what is about to hit you: with nothing in reach there is
  // nothing to dodge, and the window would be a cooldown spent on air.
  if (effect.kind === "dodge-window") return sidestepHasThreat(world, player);
  if (effect.kind === "heal") {
    return player.hasHealth.hp < player.hasHealth.maxHp - 0.5;
  }
  // Break Free is the one ability whose whole value is situational. Firing it
  // with nothing to break would waste a 14 s cooldown on nothing.
  if (effect.kind === "break-free") return fctx.controlled;
  if (effect.kind === "cleanse") return fctx.hasHarmfulDebuff;
  return true;
}

/**
 * Something Sidestep could dodge: a living monster in the player's node within
 * the player's own reach. Reach rather than aggro, so a ranged build fighting at
 * range still has something to step away from, and an empty field has nothing.
 */
function sidestepHasThreat(world: World, player: PlayerEntity): boolean {
  return world.collision.bestTargetInReach(
    player,
    world.monsterEntitiesInNode(player.hasPosition.nodeId),
    player.performsAttack.attackRange,
  ) !== null;
}

/**
 * Sidestep (design §22.8): an evasion window and a move-speed burst on ONE
 * status, so the burst ends exactly when the window does. Both magnitudes come
 * from `sidestepWindow`; the evade is rolled by `defense/mitigation/evasion.ts`,
 * and the speed is a movement layer in `world/movement.ts`.
 */
function applySidestep(player: PlayerEntity, ability: AbilityDef): void {
  const window = sidestepWindow(ability, player.tracksProgression.playerTier);
  if (window.durationMs <= 0) return;
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_SIDESTEP_EFFECT_ID,
    maxStacks: 1,
    remainingMs: window.durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: window.durationMs,
      evasionPct: window.evasionPct,
      moveSpeedPct: window.moveSpeedPct,
    },
  });
}

/**
 * Fire a Recovery-skill Guard (Second Wind / Recuperate): switch on a fraction of
 * the player's Recovery rate for a window. The healing itself is paid out by the
 * Recovery engine, so this shares antiheal and the overheal ward with every other
 * regen effect instead of running its own HoT.
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
