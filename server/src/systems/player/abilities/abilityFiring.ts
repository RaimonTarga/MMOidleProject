/**
 * Ability auto-fire — the per-tick driver for equipped abilities.
 *
 * Each ability fires on its built-in trigger with ZERO runes equipped; a
 * `fire-technique*` / `fire-guard*` rune OVERRIDES the built-in timing for ITS
 * SLOT INDEX (when such a rune is equipped, the built-in trigger is suppressed
 * and that slot fires on the rune's condition).
 *
 * Execution shapes:
 * - `armed`   — arms the next attack (`hasArmedAbility`); the rider lands in
 *               `abilityEffects.ts`.
 * - `cast`    — starts a wind-up (`isCastingAbility`); see `abilityCasting.ts`.
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
  getFlag,
  guardEffectIdForSlot,
  isHarmfulPlayerStatusEffect,
  recoveryEffectIdForSlot,
  removeStatusEffect,
  removeStatusEffectStacks,
  resolveAbilityEffect,
  setCooldown,
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
import {
  isHardControlled,
  worstHardControl,
} from "../../combat/status/playerHardControl";
import { syncPlayerControlLockout } from "../../combat/status/playerControlLockout";
import { activateRecovery } from "../../defense/regen/recovery";
import { repositionPlayer } from "../../combat/damage/knockback";
import { abilityCooldownKey, guardCooldownMs, techniqueCooldownMs } from "./abilityCooldowns";
import { beginAbilityCast } from "./abilityCasting";
import { applyBrambleGuard } from "./abilityBramble";
import { abilityTarget, gapToTarget, nearestMonsterGap } from "./abilityTargeting";

/** Hard cap on amplified Guard damage reduction (mirrors abilityEffects' GUARD_DR_CAP). */
const GUARD_DR_CAP = 0.9;

/** Hard cap on Break Free's control resistance — never total immunity. */
const CONTROL_RESIST_CAP = 0.9;

/**
 * Rune override per SLOT INDEX. Slot 0 keeps the shipped `fire-technique` /
 * `fire-guard` actions; slot 1 gets its own channel so two equipped abilities of
 * the same kind can carry genuinely independent narrow triggers.
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

export function updateAbilityFiring(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const equipped = player.tracksProgression.equippedAbilities;
    if (!equipped) continue;
    const techniques = equipped.techniques ?? [];
    const guards = equipped.guards ?? [];
    if (techniques.length === 0 && guards.length === 0) continue;

    const fctx = buildFireContext(world, player);

    // Techniques share ONE offensive execution channel: at most one may be
    // armed/casting at a time. Walk in loadout order — index 0 is the player's
    // declared priority — and stop at the first one that CLAIMS the channel, so
    // arbitration is deterministic when several rune conditions go valid at once.
    //
    // An `instant` Technique (Frenzy) is self-facing and claims nothing, so it
    // neither blocks nor is blocked by an armed charge sitting on the channel.
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
  world: World,
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
  return triggerActive(ability.trigger, fctx, world, player, ability);
}

/** Returns true when the slot CLAIMED the shared offensive channel. */
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
  const cdKey = abilityCooldownKey(abilityId);

  // A self-facing offensive buff is not an attack: it neither waits for the
  // armed/cast channel nor occupies it, so Frenzy can go up while Quick Strike
  // is still waiting for a hit to consume it.
  if (ability.shape === "instant") {
    if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
    if (!shouldFire(world, player, ability, slotIndex, fctx)) return false;
    applyInstantTechnique(world, player, ability);
    setCooldown(player.tracksCombat, cdKey, techniqueCooldownMs(player, ability));
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-technique-armed",
      playerId: player.isPlayer.id,
      ability: abilityId,
    });
    return false;
  }

  // One offensive channel: an armed charge persists until a hit consumes it, and
  // a cast owns the channel until it resolves. Neither may be pre-empted.
  if (player.hasArmedAbility || player.isCastingAbility) return true;
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  if (!shouldFire(world, player, ability, slotIndex, fctx)) return false;

  // A cast pays its cooldown on RESOLVE, not on begin (see abilityCasting.ts),
  // so nothing is charged here.
  if (ability.shape === "cast") {
    return beginAbilityCast(world, player, ability, slotIndex, now);
  }

  // Reposition (Charge / Disengage): the movement resolves NOW. If it carries a
  // strike rider it then arms as usual, turning the gap-close into an alpha
  // strike. A dash with nowhere to go declines to fire so the cooldown isn't wasted.
  if (ability.shape === "reposition") {
    const effect = resolveTechniqueEffect(player, ability);
    if (effect.kind !== "reposition") return false;
    const target = abilityTarget(world, player, ability);
    if (!target) return false;
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
    if (distance <= 0) return false;
    if (
      repositionPlayer(
        world,
        player,
        target.hasPosition.current,
        distance,
        effect.toward,
      ) === null
    ) {
      return false;
    }
    setCooldown(player.tracksCombat, cdKey, techniqueCooldownMs(player, ability));
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-reposition",
      playerId: player.isPlayer.id,
      ability: abilityId,
      from,
      to: { ...player.hasPosition.current },
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
  slotIndex: number,
  fctx: FireContext,
): boolean {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "guard") return false;
  const cdKey = abilityCooldownKey(abilityId);
  if (getCooldown(player.tracksCombat, cdKey) > 0) return false;
  // One activation per decision window — ongoing buffs still overlap freely.
  if (getCooldown(player.tracksCombat, GUARD_WINDOW_KEY) > 0) return false;
  if (!guardEffectCanFire(player, ability, fctx)) return false;
  if (!shouldFire(world, player, ability, slotIndex, fctx)) return false;

  // Charm Guard-ability amplifiers. Only present while an amplifying charm is
  // equipped; they merge into passives via the equipment loop in stats.ts.
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

  setCooldown(player.tracksCombat, cdKey, guardCooldownMs(player, ability));
  setCooldown(player.tracksCombat, GUARD_WINDOW_KEY, GUARD_WINDOW_MS);

  // Cosmetic: tell the node a Guard fired so the client overlays the Guard FX on
  // the player's sprite.
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
  // Guards resolve their magnitudes through the shared seam so the authored rank
  // applies. Technique Power deliberately does NOT — guard potency is the
  // defensive stat family and the budgets must not cross.
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
    applyCleanse(player, effect.stacks, effect.debuffs);
  } else if (effect.kind === "break-free") {
    applyBreakFree(world, player, effect.controlResistPct, effect.controlResistMs);
  } else if (effect.kind === "heal") {
    applyGuardHeal(player, ability, slotIndex, effect.recoveryPct, effect.durationMs, passives);
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
function applyCleanse(player: PlayerEntity, stacks: number, debuffs: number): void {
  const cs = player.tracksCombat;
  const byId = new Map<string, number>();
  for (const effect of cs.statusEffects) {
    if (effect.instanced) continue;
    if (effect.stacks <= 0) continue;
    if (!isHarmfulPlayerStatusEffect(effect.id, effect.data)) continue;
    byId.set(effect.id, Math.max(byId.get(effect.id) ?? 0, effect.stacks));
  }
  const ordered = [...byId.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, debuffs));
  for (const [id] of ordered) {
    removeStatusEffectStacks(cs, id, Math.max(1, stacks));
  }
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
 * The Recovery SOURCE is keyed per GUARD SLOT. Second Wind and Recuperate are
 * deliberate opposites (strong/short vs weak/long) and a player may hold both;
 * sharing one source would let the stronger fraction ride the longer window, which
 * is strictly better than either ability as authored.
 */
function applyGuardHeal(
  player: PlayerEntity,
  ability: AbilityDef,
  slotIndex: number,
  recoveryPct: number,
  durationMs: number,
  passives: Record<string, number>,
): void {
  const ms = durationMs > 0 ? durationMs : GAME_CONFIG.RECOVERY_SKILL_MS;
  const potency = ability.tags.includes("recovery")
    ? Math.max(0, passives["defense.recovery-skill-potency"] ?? 0)
    : 0;
  const fraction = recoveryPct * (1 + potency);
  activateRecovery(player.tracksCombat, slotIndex === 1 ? "skill-2" : "skill", fraction, ms);
  applyStatusEffect(player.tracksCombat, {
    id: recoveryEffectIdForSlot(slotIndex),
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
 * guard.duration-pct extends it. Shared by Brace and Endure.
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
