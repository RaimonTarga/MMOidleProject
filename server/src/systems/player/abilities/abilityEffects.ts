/**
 * Ability combat effects (system rework Step 7).
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
  ABILITY_DATABASE,
  ABILITY_GUARD_EFFECT_ID,
  getStatusEffect,
  type AbilityDef,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { applyPlayerAoe } from "../../combat/damage/aoeDamage";
import { detachComponent } from "../../../ecs/markerHelpers";
import type { CombatContext } from "../../combat/engine/combatPipeline";
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

  // Guard buff: while an ability-guard buff (e.g. Brace) is active, reduce incoming
  // damage by its drPct. Mirrors reload's cover-fire DR listener.
  registerCombatListener("onDamageTaken", (ctx) => {
    if (ctx.defenderType !== "player") return;
    const buff = getStatusEffect(ctx.defender.tracksCombat, ABILITY_GUARD_EFFECT_ID);
    if (!buff || buff.remainingMs <= 0) return;
    const dr = Math.max(0, Math.min(GUARD_DR_CAP, buff.data["drPct"] ?? 0));
    if (dr <= 0) return;
    ctx.damage = Math.max(0, Math.round(ctx.damage * (1 - dr)));
  });
}

function applyTechniqueRider(
  ctx: CombatContext,
  world: World,
  ability: AbilityDef,
): void {
  // Riders act on enemy-facing hits only.
  if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;

  const effect = ability.effect;
  if (effect.kind === "cleave") {
    const splash = Math.floor(ctx.damage * effect.splashPct);
    if (splash <= 0) return;
    applyPlayerAoe(
      world,
      ctx.attacker,
      ctx.defender.hasPosition.current,
      effect.radius,
      splash,
      ctx.defender.isMonster.id,
    );
  }
  // `shield` is a Guard immediate effect, never a Technique rider — ignored here.
}
