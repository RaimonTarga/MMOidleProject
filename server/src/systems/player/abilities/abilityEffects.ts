/**
 * Ability combat effects.
 *
 * Registers the Technique rider: when a player lands an attack with a Technique
 * armed (`hasArmedAbility`), consume the charge and apply the ability's rider
 * (e.g. Sweep's cleave). Mirrors the empowered-attack consume contract, including
 * the chaotic-miss rule (a whiff keeps the charge armed for the next real hit).
 *
 * MUST be registered from `initCombatSystems()` so the live server and the
 * balance bench stay identical.
 */
import {
  ABILITY_BINDING_STRIKE_FX,
  ABILITY_EXPOSE_WEAKNESS_FX,
  ABILITY_GUARD_EFFECT_IDS,
  ABILITY_HAMSTRING_FX,
  ABILITY_QUICK_STRIKE_FX,
  ABILITY_SWEEP_FX,
  ABILITY_TECHNIQUE_FIRED_FX,
  ABILITY_DATABASE,
  EXPOSE_WEAKNESS_EFFECT_ID,
  applyStatusEffect,
  getStatusEffect,
  resolveAbilityEffect,
  resolveSummonerProfile,
  type AbilityDef,
  type AbilityEffectSpec,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { resolveContagion, resolveDetonate } from "./abilityAffliction";
import { applyImbueWindow, initImbueSystem } from "./abilityImbue";
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { applyPlayerDebuff } from "../../classes/shared/applyPlayerDebuff";
import {
  applyPlayerAoe,
  playerAoeTargets,
} from "../../combat/damage/aoeDamage";
import { applyClassDotStack } from "../../classes/archetypes/dot/dotPrototype";
import { registerReloadLifecycleHook } from "../../classes/archetypes/reload/reloadLifecycle";
import { applyMonsterRoot, applyMonsterSlow } from "../../combat/status/monsterControl";
import { applyStun } from "../../combat/status/stun";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import {
  beginFormationTechnique,
  consumeFormationTechniqueDelivery,
  type FormationTechniqueDelivery,
} from "../../classes/archetypes/summoner/formationTechnique";
import { actorFromMonster, actorFromPlayer } from "../../../world/worldLogActors";
import { recordWorldLogEvent } from "../../../world/worldLog";
import type { CombatContext } from "../../combat/engine/combatPipeline";
import type {
  HasSweepClip,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import type { World } from "../../../world/World";
import type { WorldLogActor } from "@mmo-idle/shared";

/** Reporting-only: Technique/Sweep adapter contribution for combat-run diagnostics. */
function recordTechniqueAdapter(
  world: World,
  player: PlayerEntity,
  fields: {
    adapter: "apprentice-sweep" | "slinger-sweep" | "conduit-formation";
    event:
      | "apprentice-secondary-target"
      | "slinger-clip-created"
      | "slinger-clip-shot"
      | "slinger-splash-hit"
      | "conduit-arm"
      | "conduit-delivery"
      | "conduit-share-lost"
      | "conduit-secondary-damage";
    target?: WorldLogActor;
    stacksApplied?: number;
    clipSize?: number;
    splashDamage?: number;
    eligibleSummons?: number;
    formationRoot?: string;
  },
): void {
  recordWorldLogEvent(
    world,
    {
      kind: "technique-adapter",
      nodeId: player.hasPosition.nodeId,
      player: actorFromPlayer(player),
      ...fields,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

/** Hard cap on Guard-buff damage reduction (mirrors cover-fire's DR cap). */
const GUARD_DR_CAP = 0.9;

/**
 * A full Slinger clip receives 1.5 old one-projectile Sweep budgets. With the
 * root's 0.65 per-shot damage layer, that is 0.975 of a normal class attack:
 * materially above the old 0.65 budget without exceeding a generic full hit.
 */
export const SLINGER_SWEEP_CLIP_BUDGET_MULT = 1.5;

export function initAbilitySystems(): void {
  // Imbue's on-hit charge consumer. Registered here so live server and bench
  // share one registration point (see combatBootstrap.ts).
  initImbueSystem();
  // A Sweep clip is exactly one ammo lifecycle. Partial tactical reloads and
  // ordinary empty-clip reloads share these hooks, so both end it identically.
  registerReloadLifecycleHook({
    onStart(world, player) {
      detachComponent(world, player, "hasSweepClip");
    },
    onComplete(world, player) {
      // Defensive cleanup for restored/legacy state that missed its start hook.
      detachComponent(world, player, "hasSweepClip");
    },
  });

  // Technique rider: apply the armed ability's effect on the landed hit.
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;
    // Chaotic misses neither spend ammo nor consume/apply Technique payloads.
    if (ctx.metadata["chaoticMiss"]) return;

    // Once activated, every real ammo-backed shot in this clip carries the
    // normalized Slinger cleave. The first shot is handled below while consuming
    // the armed Technique; later shots arrive here with no armed charge.
    if (ctx.attacker.hasSweepClip && isReloadClipShot(ctx)) {
      applySlingerSweepShot(ctx, world, ctx.attacker.hasSweepClip);
    }

    // Conduit owns one formation-wide armed payload. A snapshotted summon can
    // deliver it once; direct Battle Bond attacks and repeat attacks by the same
    // summon cannot steal another summon body's share.
    if (ctx.attacker.hasFormationTechnique) {
      const state = ctx.attacker.hasFormationTechnique;
      const delivery = consumeFormationTechniqueDelivery(
        world,
        ctx.attacker,
        ctx.formation,
      );
      const ability = ABILITY_DATABASE.get(state.abilityId);
      if (delivery && ability) applyTechniqueRider(ctx, world, ability, delivery);
      return;
    }

    const armed = ctx.attacker.hasArmedAbility;
    if (!armed) return;

    // Restored state, or a Conduit armed while its formation was down: convert
    // only once a living formation exists. With no summons, preserve the charge.
    if (ctx.attacker.summonsMinions) {
      const state = beginFormationTechnique(world, ctx.attacker, armed.abilityId);
      if (!state) return;
      detachComponent(world, ctx.attacker, "hasArmedAbility");
      const delivery = consumeFormationTechniqueDelivery(
        world,
        ctx.attacker,
        ctx.formation,
      );
      const ability = ABILITY_DATABASE.get(state.abilityId);
      if (delivery && ability) applyTechniqueRider(ctx, world, ability, delivery);
      return;
    }

    detachComponent(world, ctx.attacker, "hasArmedAbility");
    const ability = ABILITY_DATABASE.get(armed.abilityId);
    if (!ability) return;
    applyTechniqueRider(ctx, world, ability);
  });

  // Guard buff: while a Guard DR buff (Brace / Endure) is active, reduce incoming
  // damage by its drPct. Mirrors reload's cover-fire DR listener.
  //
  // Two Guard slots can be active at once, so the slots stack MULTIPLICATIVELY
  // (each is a separate reduction of what got through) rather than additively —
  // additive stacking would reach the cap far too easily and make the second
  // Guard slot a strictly-better defensive choice than any other pairing. This is
  // the global "simultaneous Guard mitigation" rule the roster depends on.
  registerCombatListener("onDamageTaken", (ctx) => {
    if (ctx.defenderType !== "player") return;
    let survives = 1;
    for (const effectId of ABILITY_GUARD_EFFECT_IDS) {
      const buff = getStatusEffect(ctx.defender.tracksCombat, effectId);
      if (!buff || buff.remainingMs <= 0) continue;
      const dr = Math.max(0, Math.min(GUARD_DR_CAP, buff.data["drPct"] ?? 0));
      survives *= 1 - dr;
    }
    const total = Math.min(GUARD_DR_CAP, 1 - survives);
    if (total <= 0) return;
    ctx.damage = Math.max(0, Math.round(ctx.damage * (1 - total)));
  });
}

/**
 * Resolve an ability's effect through the shared scaling seam: the authored rank
 * for the player's tier, plus Technique Power on the fields that opt in. Every
 * Technique path must go through this — reading a rank's `effect` raw silently
 * opts the ability out of Technique Power.
 */
function techniqueEffect(
  player: PlayerEntity,
  ability: AbilityDef,
): AbilityEffectSpec {
  return resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: player.usesSkills.passives["technique.power-pct"] ?? 0,
  });
}

/** Append a client-effect tag to the hit that combat.ts is about to broadcast. */
function tagClientEffect(ctx: CombatContext, tag: string): void {
  const existing = ctx.metadata["clientEffects"];
  ctx.metadata["clientEffects"] = Array.isArray(existing) ? [...existing, tag] : [tag];
}

/**
 * Resolve a completed CAST. Unlike an armed Technique, a cast has no triggering
 * attack to ride, so it applies its payload directly to the target it was started
 * against.
 *
 * Deliberately NOT routed through the normal attack pipeline: a cast is its own
 * action, so "every on-hit effect procs off the cast too" is an explicit design
 * decision rather than a side effect of reusing `runPlayerAttack`. The payload
 * still passes through the target's defensive pipeline via `applyPlayerAoe`, so
 * plating/DR/caps all apply.
 */
export function resolveCastPayload(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  target: MonsterEntity,
): void {
  const effect = techniqueEffect(player, ability);

  // The affliction Techniques act on damage-over-time the player already owns
  // rather than on the player's attack, so they own their own resolution. They
  // still arrive here because they are ordinary casts in every other respect.
  if (effect.kind === "spread-dots") {
    resolveContagion(world, player, ability, target);
    return;
  }
  if (effect.kind === "detonate-dots") {
    resolveDetonate(world, player, ability, target);
    return;
  }

  if (effect.kind !== "cast-strike") return;

  // The payload is authored as a multiple of the player's attack, so the wind-up
  // buys a burst a normal swing can't reach. `applyPlayerAoe` runs it through the
  // target's plating/DR and owns kills + rewards + the world log.
  //
  // A single-target cast still goes through the circle query with a small radius
  // rather than radius 0: the query is a BODY-overlap test, and a zero-radius
  // circle on a monster whose origin has drifted from its body centre would miss.
  const damage = Math.max(1, Math.round(player.dealsDamage.attack * effect.damageMult));
  const radius = effect.radius && effect.radius > 0 ? effect.radius : 1;
  applyPlayerAoe(world, player, target.hasPosition.current, radius, damage);

  // Stunning Strike: the control lands with the blow. Applied after the damage so
  // a killing blow doesn't spend the stun on a corpse, and through `applyStun` so
  // the shared post-stun immunity keeps chain-locking off the table.
  if (effect.stunMs && effect.stunMs > 0 && target.hasHealth.hp > 0) {
    applyStun(target.tracksCombat, effect.stunMs, player.isPlayer.id);
  }
}

/**
 * Resolve a completed `self-cast`. The counterpart to {@link resolveCastPayload}
 * for wind-ups that land on the player: no target, no reach check, no AoE.
 *
 * Kept as its own dispatcher rather than folded into `resolveCastPayload` so the
 * two can never be confused at a call site — a targeted payload reaching a
 * self-cast (or the reverse) would be a silent no-op rather than a type error.
 */
export function resolveSelfCastPayload(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  const effect = techniqueEffect(player, ability);
  if (effect.kind === "imbue") {
    applyImbueWindow(world, player, ability);
    return;
  }
}

function applyTechniqueRider(
  ctx: CombatContext,
  world: World,
  ability: AbilityDef,
  formationDelivery?: FormationTechniqueDelivery,
): void {
  // Riders act on enemy-facing hits only.
  if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;

  const effect = techniqueEffect(ctx.attacker, ability);
  const formationBasis = ctx.formation
    ? Math.max(1, Math.round(
      ctx.attacker.dealsDamage.attack * resolveSummonerProfile({
        selectedSubVariant: ctx.attacker.usesSkills.selectedSubVariant,
        selectedRange: ctx.attacker.usesSkills.selectedRange,
        unlockedSkills: ctx.attacker.usesSkills.unlockedSkills,
        passives: ctx.attacker.usesSkills.passives,
      }).formationOffenseMult,
    ))
    : ctx.damage;

  if (effect.kind === "cleave") {
    // Apprentice: the primary already received its normal on-hit class stack
    // earlier in the pipeline. Spread exactly one stack-equivalent through the
    // same root DoT seam, with no fake direct cleave or shortcut to full stacks.
    if (ctx.attacker.appliesDots) {
      tagClientEffect(ctx, ABILITY_SWEEP_FX);
      for (const target of playerAoeTargets(
        world,
        ctx.attacker,
        ctx.defender.hasPosition.current,
        effect.radius,
        ctx.defender.isMonster.id,
      )) {
        applyClassDotStack(world, ctx.attacker, target);
        recordTechniqueAdapter(world, ctx.attacker, {
          adapter: "apprentice-sweep",
          event: "apprentice-secondary-target",
          target: actorFromMonster(target),
          stacksApplied: 1,
        });
      }
      return;
    }

    // Slinger: consume the armed charge on the first ammo-backed shot, then let
    // the clip component carry reduced cleave until reload starts. Reload attacks
    // without a clip-shot tag retain the safe generic one-hit Sweep behavior.
    if (ctx.attacker.usesReload && isReloadClipShot(ctx)) {
      if (!ctx.attacker.hasSweepClip) {
        const clipSize = reloadClipSize(ctx);
        attachComponent(world, ctx.attacker, "hasSweepClip", {
          splashPct: effect.splashPct,
          radius: effect.radius,
          clipSize,
          damageRemainder: 0,
        });
        recordTechniqueAdapter(world, ctx.attacker, {
          adapter: "slinger-sweep",
          event: "slinger-clip-created",
          clipSize,
        });
      }
      if (ctx.metadata["slingerSweepApplied"] !== true) {
        applySlingerSweepShot(ctx, world, ctx.attacker.hasSweepClip!);
      }
      return;
    }

    // Tag this landed hit so the client overlays the Sweep slash FX on the normal
    // attack and pulses the Technique HUD icon. Stamped before the splash check so
    // the slash still reads even when the splash rounds to 0. combat.ts reads
    // `clientEffects` when it pushes the primary `player-hit` event (post-onHit).
    tagClientEffect(ctx, ABILITY_SWEEP_FX);

    const splash = formationTechniqueAmount(
      formationBasis * effect.splashPct,
      formationDelivery,
    );
    if (splash <= 0) return;
    if (formationDelivery) {
      recordTechniqueAdapter(world, ctx.attacker, {
        adapter: "conduit-formation",
        event: "conduit-secondary-damage",
        target: actorFromMonster(ctx.defender),
        splashDamage: splash,
      });
    }
    applyPlayerAoe(
      world,
      ctx.attacker,
      ctx.defender.hasPosition.current,
      effect.radius,
      splash,
      ctx.defender.isMonster.id,
    );
    return;
  }

  if (effect.kind === "empower" || effect.kind === "reposition") {
    // A reposition's dash already happened at fire time; what rides the next hit
    // is its optional strike rider, which behaves exactly like `empower`.
    const mult =
      effect.kind === "empower" ? effect.damageMult : (effect.empowerMult ?? 1);
    tagClientEffect(
      ctx,
      effect.kind === "empower" ? ABILITY_QUICK_STRIKE_FX : ABILITY_TECHNIQUE_FIRED_FX,
    );
    const beforeDamage = ctx.damage;
    addEmpoweredDamage(ctx, formationBasis, mult, formationDelivery);
    if (formationDelivery) {
      const delta = ctx.damage - beforeDamage;
      if (delta > 0) {
        recordTechniqueAdapter(world, ctx.attacker, {
          adapter: "conduit-formation",
          event: "conduit-secondary-damage",
          target: actorFromMonster(ctx.defender),
          splashDamage: delta,
        });
      }
    }
    return;
  }

  if (effect.kind === "expose-weakness") {
    tagClientEffect(ctx, ABILITY_EXPOSE_WEAKNESS_FX);
    // An evaded hit lands no debuff — the shared rule for every on-hit applier.
    if (evadeBlocksDebuffs(ctx)) return;
    applyPlayerDebuff(ctx.attacker, ctx.defender.tracksCombat, {
      id: EXPOSE_WEAKNESS_EFFECT_ID,
      instanced: false,
      maxStacks: 1,
      refreshable: true,
      remainingMs: effect.durationMs,
      sourceId: ctx.attacker.isPlayer.id,
      data: {
        damageTakenPct: effect.damageTakenPct,
        totalMs: effect.durationMs,
      },
    });
    return;
  }

  if (effect.kind === "slow-strike") {
    tagClientEffect(ctx, ABILITY_HAMSTRING_FX);
    addEmpoweredDamage(ctx, formationBasis, effect.damageMult, formationDelivery);
    if (evadeBlocksDebuffs(ctx)) return;
    applyMonsterSlow(
      world,
      ctx.defender,
      effect.slowPct,
      effect.slowDurationMs,
      ctx.attacker.isPlayer.id,
    );
    return;
  }

  if (effect.kind === "root-strike") {
    tagClientEffect(ctx, ABILITY_BINDING_STRIKE_FX);
    addEmpoweredDamage(ctx, formationBasis, effect.damageMult, formationDelivery);
    if (evadeBlocksDebuffs(ctx)) return;
    applyMonsterRoot(world, ctx.defender, effect.rootMs, ctx.attacker.isPlayer.id);
    return;
  }

  // Guard immediates are never Technique riders — applied in abilityFiring.ts.
}

function isReloadClipShot(ctx: CombatContext): boolean {
  return ctx.metadata["reloadClipShot"] === true;
}

function reloadClipSize(ctx: CombatContext): number {
  const value = ctx.metadata["reloadClipSize"];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : 1;
}

/** Apply one normalized share of the Slinger clip's Sweep budget. */
function applySlingerSweepShot(
  ctx: Extract<CombatContext, { attackerType: "player" }>,
  world: World,
  sweep: HasSweepClip,
): void {
  if (ctx.defenderType !== "monster") return;

  tagClientEffect(ctx, ABILITY_SWEEP_FX);
  ctx.metadata["slingerSweepApplied"] = true;
  recordTechniqueAdapter(world, ctx.attacker, {
    adapter: "slinger-sweep",
    event: "slinger-clip-shot",
    clipSize: sweep.clipSize,
  });

  const rawSplash =
    (ctx.damage * sweep.splashPct * SLINGER_SWEEP_CLIP_BUDGET_MULT) /
      sweep.clipSize +
    sweep.damageRemainder;
  const splash = Math.floor(rawSplash);
  sweep.damageRemainder = rawSplash - splash;
  if (splash <= 0) return;

  recordTechniqueAdapter(world, ctx.attacker, {
    adapter: "slinger-sweep",
    event: "slinger-splash-hit",
    target: actorFromMonster(ctx.defender),
    splashDamage: splash,
    clipSize: sweep.clipSize,
  });
  applyPlayerAoe(
    world,
    ctx.attacker,
    ctx.defender.hasPosition.current,
    sweep.radius,
    splash,
    ctx.defender.isMonster.id,
  );
}

/**
 * Scale the landed hit. Runs in onHit so `onDamageTaken` still mitigates the
 * boosted value — an empowered blow is a bigger blow, not an unmitigated one.
 */
function addEmpoweredDamage(
  ctx: CombatContext,
  formationBasis: number,
  mult: number,
  formationDelivery?: FormationTechniqueDelivery,
): void {
  if (formationDelivery) {
    ctx.damage = Math.max(0, ctx.damage + formationTechniqueAmount(
      formationBasis * Math.max(0, mult - 1),
      formationDelivery,
    ));
    return;
  }
  ctx.damage = Math.max(0, Math.round(
    ctx.damage + formationBasis * Math.max(0, mult - 1),
  ));
}

/**
 * Pay one summon's normalized share while carrying fractional integer damage.
 * Across a complete formation this totals floor(fullAmount), independent of its
 * summon count or attack speed. If a snapshotted summon dies, its unpaid share
 * is deliberately lost rather than transferred to a reconstructed replacement.
 */
function formationTechniqueAmount(
  fullAmount: number,
  delivery?: FormationTechniqueDelivery,
): number {
  if (!delivery) return Math.floor(fullAmount);
  const raw = fullAmount * delivery.magnitudeWeight + delivery.state.damageRemainder;
  const amount = Math.floor(raw + 1e-9);
  delivery.state.damageRemainder = raw - amount;
  return Math.max(0, amount);
}
