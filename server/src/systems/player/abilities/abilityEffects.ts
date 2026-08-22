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
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { applyPlayerDebuff } from "../../classes/shared/applyPlayerDebuff";
import { applyPlayerAoe } from "../../combat/damage/aoeDamage";
import { applyMonsterRoot, applyMonsterSlow } from "../../combat/status/monsterControl";
import { applyStun } from "../../combat/status/stun";
import { detachComponent } from "../../../ecs/markerHelpers";
import type { CombatContext } from "../../combat/engine/combatPipeline";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/** Hard cap on Guard-buff damage reduction (mirrors cover-fire's DR cap). */
const GUARD_DR_CAP = 0.9;

export function initAbilitySystems(): void {
  // Technique rider: apply the armed ability's effect on the landed hit.
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;
    const armed = ctx.attacker.hasArmedAbility;
    if (!armed) return;
    // Chaotic miss: the attack whiffs — keep the charge armed for the next real hit.
    if (ctx.metadata["chaoticMiss"]) return;

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

function applyTechniqueRider(
  ctx: CombatContext,
  world: World,
  ability: AbilityDef,
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
    // Tag this landed hit so the client overlays the Sweep slash FX on the normal
    // attack and pulses the Technique HUD icon. Stamped before the splash check so
    // the slash still reads even when the splash rounds to 0. combat.ts reads
    // `clientEffects` when it pushes the primary `player-hit` event (post-onHit).
    tagClientEffect(ctx, ABILITY_SWEEP_FX);

    const splash = Math.floor(formationBasis * effect.splashPct);
    if (splash <= 0) return;
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
    addEmpoweredDamage(ctx, formationBasis, mult);
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
    addEmpoweredDamage(ctx, formationBasis, effect.damageMult);
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
    addEmpoweredDamage(ctx, formationBasis, effect.damageMult);
    if (evadeBlocksDebuffs(ctx)) return;
    applyMonsterRoot(world, ctx.defender, effect.rootMs, ctx.attacker.isPlayer.id);
    return;
  }

  // Guard immediates are never Technique riders — applied in abilityFiring.ts.
}

/**
 * Scale the landed hit. Runs in onHit so `onDamageTaken` still mitigates the
 * boosted value — an empowered blow is a bigger blow, not an unmitigated one.
 */
function addEmpoweredDamage(
  ctx: CombatContext,
  formationBasis: number,
  mult: number,
): void {
  ctx.damage = Math.max(0, Math.round(
    ctx.damage + formationBasis * Math.max(0, mult - 1),
  ));
}
