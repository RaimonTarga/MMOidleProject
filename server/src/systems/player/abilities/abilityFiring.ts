/**
 * Ability auto-fire (system rework Step 7; multi-slot per abilities evolution §7).
 *
 * Per-tick driver for equipped abilities. Each ability fires on its built-in
 * trigger with ZERO runes equipped; a `fire-technique*` / `fire-guard*` rune
 * OVERRIDES the built-in timing for ITS SLOT INDEX (when such a rune is equipped,
 * the built-in trigger is suppressed and that slot fires on the rune's condition).
 *
 * - Technique (`armed`): arms the next attack (`hasArmedAbility`) — the rider
 *   lands in `abilityEffects.ts`.
 * - Technique (`cast`): starts a wind-up (`isCastingAbility`) — see `abilityCasting.ts`.
 * - Guard: an immediate self-facing effect (e.g. shield).
 *
 * Runs in `World.tick` after rune-derived flags are stamped and after targets are
 * acquired, but before combat resolves, so an armed Technique is honored this tick.
 */
import {
  ABILITY_DATABASE,
  ABILITY_SECOND_WIND_EFFECT_ID,
  GAME_CONFIG,
  applyStatusEffect,
  getCooldown,
  getFlag,
  getResource,
  guardEffectIdForSlot,
  isHarmfulPlayerStatusEffect,
  removeStatusEffectStacks,
  resolveAbilityEffect,
  setCooldown,
  setResource,
  type AbilityDef,
  type AbilityTrigger,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent } from "../../../ecs/markerHelpers";
import {
  RUNE_FIRE_GUARD_2_FLAG,
  RUNE_FIRE_GUARD_FLAG,
  RUNE_FIRE_TECHNIQUE_2_FLAG,
  RUNE_FIRE_TECHNIQUE_FLAG,
} from "../../combat/ai/runeConfig";
import { activateRecovery } from "../../defense/regen/recovery";
import { repositionPlayer } from "../../combat/damage/knockback";
import { abilityCooldownKey, techniqueCooldownMs } from "./abilityCooldowns";
import { beginAbilityCast } from "./abilityCasting";
import { applyBrambleGuard } from "./abilityBramble";

/** Hard cap on amplified Guard damage reduction (mirrors abilityEffects' GUARD_DR_CAP). */
const GUARD_DR_CAP = 0.9;

/**
 * Rune override per SLOT INDEX. Slot 0 keeps the shipped `fire-technique` /
 * `fire-guard` actions; slot 1 gets its own channel so two equipped abilities of
 * the same kind can carry genuinely independent narrow triggers (plan §4.4).
 */
const TECHNIQUE_RUNE_OVERRIDES = [
  { actionId: "fire-technique", flag: RUNE_FIRE_TECHNIQUE_FLAG },
  { actionId: "fire-technique-2", flag: RUNE_FIRE_TECHNIQUE_2_FLAG },
] as const;

const GUARD_RUNE_OVERRIDES = [
  { actionId: "fire-guard", flag: RUNE_FIRE_GUARD_FLAG },
  { actionId: "fire-guard-2", flag: RUNE_FIRE_GUARD_2_FLAG },
] as const;

/**
 * Shared one-tick gate so at most ONE Guard ACTIVATION resolves per decision
 * window (abilities evolution plan §7.2). Already-active Guard buffs are
 * untouched and may overlap — this only stops instant defensive combo-dumping.
 */
const GUARD_WINDOW_KEY = "ability.guard.window";
const GUARD_WINDOW_MS = 100; // one logic tick at 10 Hz


interface FireContext {
  inCombat: boolean;
  hpPct: number;
  aggroCount: number;
  hasHarmfulDebuff: boolean;
}

export function updateAbilityFiring(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const equipped = player.tracksProgression.equippedAbilities;
    if (!equipped) continue;
    const techniques = equipped.techniques ?? [];
    const guards = equipped.guards ?? [];
    if (techniques.length === 0 && guards.length === 0) continue;

    const fctx = buildFireContext(world, player);

    // Techniques share ONE offensive execution channel: at most one may be
    // armed/casting at a time (plan §7.1). Walk in loadout order — index 0 is
    // the player's declared priority — and stop at the first one that fires, so
    // arbitration is deterministic when several rune conditions go valid at once.
    for (const [index, abilityId] of techniques.entries()) {
      if (maybeFireTechnique(world, player, abilityId, index, fctx, now)) break;
    }

    // Guards are independent, but only one ACTIVATION resolves per window.
    for (const [index, abilityId] of guards.entries()) {
      if (maybeFireGuard(world, player, abilityId, index, fctx)) break;
    }
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
  };
}

function triggerActive(trigger: AbilityTrigger, fctx: FireContext): boolean {
  switch (trigger.kind) {
    case "in-combat":
      return fctx.inCombat;
    case "hp-below":
      return fctx.hpPct <= trigger.hpPct;
    case "n-aggro":
      return fctx.aggroCount >= trigger.count;
    case "has-debuff":
      return fctx.hasHarmfulDebuff;
  }
}

function hasRuneAction(player: PlayerEntity, actionId: string): boolean {
  return player.tracksProgression.runesEquipped.some(
    (rule) => rule.actionId === actionId,
  );
}

/**
 * Resolve whether a slot should fire this tick: a rune override (when equipped)
 * wins and suppresses the built-in trigger; otherwise the built-in trigger drives.
 *
 * Each slot INDEX has its own rune channel (`fire-technique` drives slot 0,
 * `fire-technique-2` drives slot 1), so two equipped Techniques can carry
 * genuinely independent narrow triggers.
 */
function shouldFire(
  player: PlayerEntity,
  ability: AbilityDef,
  slotIndex: number,
  fctx: FireContext,
): boolean {
  const override =
    ability.slot === "technique"
      ? TECHNIQUE_RUNE_OVERRIDES[slotIndex]
      : GUARD_RUNE_OVERRIDES[slotIndex];
  if (override && hasRuneAction(player, override.actionId)) {
    return getFlag(player.tracksCombat, override.flag);
  }
  return triggerActive(ability.trigger, fctx);
}

/** Returns true when the slot fired (and therefore claimed the channel). */
function maybeFireTechnique(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  slotIndex: number,
  fctx: FireContext,
  now: number,
): boolean {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "technique") return false;
  // One offensive channel: an armed charge persists until a hit consumes it, and
  // a cast owns the channel until it resolves. Neither may be pre-empted.
  if (player.hasArmedAbility || player.isCastingAbility) return true;
  const cdKey = abilityCooldownKey(abilityId);
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  if (!shouldFire(player, ability, slotIndex, fctx)) return false;

  // A cast pays its cooldown on RESOLVE, not on begin (see abilityCasting.ts),
  // so nothing is charged here.
  if (ability.shape === "cast") {
    return beginAbilityCast(world, player, ability, slotIndex, now);
  }

  // Reposition (Charge): the dash resolves NOW. If it carries a strike rider it
  // then arms as usual, turning the gap-close into an alpha strike. A dash with
  // nowhere to go declines to fire so the cooldown isn't wasted.
  if (ability.shape === "reposition") {
    const effect = ability.effect;
    if (effect.kind !== "reposition") return false;
    if (!repositionFromTarget(world, player, effect.distance, effect.toward)) {
      return false;
    }
    setCooldown(player.tracksCombat, cdKey, techniqueCooldownMs(player, ability));
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-technique-armed",
      playerId: player.isPlayer.id,
      ability: abilityId,
    });
    if (effect.empowerMult !== undefined) {
      attachComponent(world, player, "hasArmedAbility", { abilityId });
    }
    return true;
  }

  attachComponent(world, player, "hasArmedAbility", { abilityId });
  setCooldown(player.tracksCombat, cdKey, techniqueCooldownMs(player, ability));

  // Cosmetic: tell the node the Technique armed so the client telegraphs it
  // (skill-name callout + red cooldown bar until the charge is consumed).
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-technique-armed",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  return true;
}

/** Returns true when the Guard activated (and therefore claimed the window). */
function maybeFireGuard(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  slotIndex: number,
  fctx: FireContext,
): boolean {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "guard") return false;
  const cdKey = abilityCooldownKey(abilityId);
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  // One activation per decision window — ongoing buffs still overlap freely.
  if (getCooldown(player.tracksCombat, GUARD_WINDOW_KEY) > 0) return false;
  if (!guardEffectCanFire(player, ability)) return false;
  if (!shouldFire(player, ability, slotIndex, fctx)) return false;

  // Charm Guard-ability amplifiers (Step 8). Only present while an amplifying
  // charm is equipped; they merge into passives via the equipment loop in stats.ts.
  const passives = player.usesSkills.passives;

  applyGuardEffect(world, player, ability, slotIndex, passives);

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

  // guard.cooldown-reduction-pct: fire the Guard more often.
  const cdReduction = passives["guard.cooldown-reduction-pct"] ?? 0;
  const effectiveCd = ability.cooldownMs * (1 - Math.min(0.9, Math.max(0, cdReduction)));
  setCooldown(player.tracksCombat, cdKey, effectiveCd);
  setCooldown(player.tracksCombat, GUARD_WINDOW_KEY, GUARD_WINDOW_MS);

  // Cosmetic: tell the node a Guard fired so the client overlays the Guard FX
  // (Brace shield / Cleanse purge / Second Wind heal) on the player's sprite.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-guard",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
  return true;
}

function applyGuardEffect(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  slotIndex: number,
  passives: Record<string, number>,
): void {
  // Guards resolve their magnitudes through the shared seam so tier deepening
  // applies. Technique Power deliberately does NOT — guard potency is the
  // defensive stat family and the budgets must not cross (plan §3.3).
  const effect = resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
  });
  if (effect.kind === "damage-reduction") {
    applyGuardDrBuff(
      player,
      slotIndex,
      effect.drPct,
      effect.durationMs,
      passives,
      effect.knockbackResistPct,
    );
  } else if (effect.kind === "cleanse") {
    // Strip harmful debuff/DoT stacks from the player. One pass per distinct id.
    const cs = player.tracksCombat;
    const harmfulIds = [
      ...new Set(
        cs.statusEffects
          .filter((e) => !e.instanced && isHarmfulPlayerStatusEffect(e.id, e.data))
          .map((e) => e.id),
      ),
    ];
    for (const id of harmfulIds) removeStatusEffectStacks(cs, id, effect.stacks);
    // Optional post-cleanse resilience: a short damage-reduction guard buff.
    if (effect.drPct !== undefined && effect.durationMs !== undefined) {
      applyGuardDrBuff(player, slotIndex, effect.drPct, effect.durationMs, passives);
    }
  } else if (effect.kind === "heal") {
    applyGuardHeal(player, ability, effect.recoveryPct, effect.durationMs, passives);
  } else if (effect.kind === "bramble") {
    applyBrambleGuard(player, effect.platingBonus, effect.reflectFlat, effect.durationMs);
  } else if (effect.kind === "reposition") {
    // A Guard-slot reposition (Disengage) is pure escape — no strike rider.
    repositionFromTarget(world, player, effect.distance, effect.toward);
  }
  // `cleave`/`empower`/`cast-strike` are Technique-only — ignored here.
}

/**
 * Move the player relative to their current attack target. Returns false when
 * there is nothing to reposition against, so a Technique-slot reposition can
 * decline to fire (and keep its cooldown) rather than dashing nowhere.
 */
function repositionFromTarget(
  world: World,
  player: PlayerEntity,
  distance: number,
  toward: boolean,
): boolean {
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  if (!target) return false;
  return repositionPlayer(world, player, target.hasPosition.current, distance, toward) !== null;
}

function guardEffectCanFire(player: PlayerEntity, ability: AbilityDef): boolean {
  if (ability.effect.kind === "heal") {
    return player.hasHealth.hp < player.hasHealth.maxHp - 0.5;
  }
  return true;
}

/**
 * Fire a Recovery-skill Guard (Second Wind): switch on a fraction of the player's
 * Recovery rate for a window. The healing itself is paid out by the Recovery
 * engine, so this shares antiheal, the overheal ward and `core.recovery-mult`
 * with every other regen effect instead of running its own HoT.
 *
 * `defense.recovery-skill-potency` scales the fraction, and ONLY for abilities
 * carrying the `recovery` tag — that is the whole point of the tag. The status
 * effect is kept purely so the buff bar can show the ability's own icon/timer.
 */
function applyGuardHeal(
  player: PlayerEntity,
  ability: AbilityDef,
  recoveryPct: number,
  durationMs: number | undefined,
  passives: Record<string, number>,
): void {
  const ms = durationMs ?? GAME_CONFIG.RECOVERY_SKILL_MS;
  const potency = ability.tags.includes("recovery")
    ? Math.max(0, passives["defense.recovery-skill-potency"] ?? 0)
    : 0;
  const fraction = recoveryPct * (1 + potency);
  activateRecovery(player.tracksCombat, "skill", fraction, ms);
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_SECOND_WIND_EFFECT_ID,
    remainingMs: ms,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: ms,
      recoveryPct: fraction,
    },
  });
}

/**
 * Apply the explicit Guard damage-reduction buff (a status effect on
 * TracksCombat). updateTracksCombat decrements remainingMs; abilityEffects'
 * onDamageTaken reads drPct; the buff descriptor (abilityBuffs.ts) projects it to
 * the buff bar. `totalMs` drives the clock. guard.potency-pct scales magnitude;
 * guard.duration-pct extends it. Shared by Brace (damage-reduction) and Cleanse's
 * optional post-cleanse resilience.
 *
 * The effect id is keyed PER GUARD SLOT (`ability-guard`, `ability-guard-2`).
 * Two Guard slots means two independent DR buffs that must not overwrite each
 * other or mislabel in the buff bar; status-effect `data` is numbers-only, so
 * the owning ability's identity has to live in the id.
 */
function applyGuardDrBuff(
  player: PlayerEntity,
  slotIndex: number,
  baseDrPct: number,
  baseDurationMs: number,
  passives: Record<string, number>,
  baseKnockbackResistPct?: number,
): void {
  const potency = passives["guard.potency-pct"] ?? 0;
  const durationBonus = passives["guard.duration-pct"] ?? 0;
  const drPct = Math.min(GUARD_DR_CAP, baseDrPct * (1 + Math.max(0, potency)));
  const knockbackResistPct =
    baseKnockbackResistPct !== undefined
      ? Math.min(GUARD_DR_CAP, baseKnockbackResistPct * (1 + Math.max(0, potency)))
      : undefined;
  const durationMs = Math.round(baseDurationMs * (1 + Math.max(0, durationBonus)));
  applyStatusEffect(player.tracksCombat, {
    id: guardEffectIdForSlot(slotIndex),
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
