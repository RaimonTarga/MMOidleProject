/**
 * ATTACK-EQUIVALENTS — the shared normalization seam for "how much of one
 * logical basic attack did the player just deliver".
 *
 * Sweep's Tempo mechanic is the first consumer, but the concept is deliberately
 * not Sweep's: the naive implementation ("every damage event takes a second off
 * the cooldown") is wrong for every class the game actually ships. A Slinger
 * empties six bullets into one swing's worth of damage; a Conduit spreads one
 * attack across a whole formation; a laser or a channelled beam delivers a
 * fraction of an attack ten times a second; an Apprentice's real output arrives
 * later, as ticks that are not attacks at all. Counting damage events would pay
 * those builds two to ten times over.
 *
 * So: one QUALIFYING BASIC ATTACK is worth exactly 1.0, and every multi-body,
 * multi-projectile or continuous delivery is normalized back down to its share
 * of one.
 *
 * WHAT QUALIFIES. A landed player-versus-monster basic attack — the thing that
 * reaches `afterHit` through `runPlayerAttack` or through a channel tick. That
 * is a much narrower seam than it looks, and most of the exclusion list is free
 * rather than filtered: damage-over-time ticks, Sweep's own splash, Slam's and
 * Power Strike's cast payloads, thorns/retaliation and secondary proc damage
 * all apply damage WITHOUT emitting an attack event at all (they go through
 * `applyPlayerAoe`, the DoT tick systems, or direct HP writes), so none of them
 * can reach this module even in principle. A single attack that damages several
 * monsters resolves as ONE event with splash, so breadth never multiplies Tempo
 * either.
 *
 * What is filtered here, explicitly:
 * - chaotic dead swings, which spend no ammo and deliver no payload;
 * - attacks on anything that is not a monster;
 * - continuous channel ticks, scaled to the fraction of an attack they deal;
 * - ammo-backed shots, scaled by NOMINAL magazine size;
 * - formation bodies, scaled by their share of the authored formation.
 *
 * An EMPOWERED basic attack is still one basic attack: the multiplier changes
 * how hard it hits, not how many times the player swung.
 */
import {
  ABILITY_DATABASE,
  abilityTempoRefundMs,
  getCooldown,
  getResource,
  setCooldown,
  setResource,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import {
  abilityCooldownKey,
  abilityTempoFloorKey,
  abilityTempoProgressKey,
} from "./abilityCooldowns";
import type { CombatContext } from "../../combat/engine/combatPipeline";
import type { PlayerEntity } from "../../../ecs/entity";

/**
 * Fallback fraction for a continuous channel whose authored damage-per-tick is
 * missing. Matches the laser's authored default; only reached if a channel
 * forgets to author its own share.
 */
const DEFAULT_CHANNEL_TICK_FRACTION = 0.18;

/**
 * How much of one logical basic attack this exchange delivered. 0 means it does
 * not qualify at all.
 */
export function basicAttackTempoContribution(ctx: CombatContext): number {
  if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return 0;
  // A dead swing delivers nothing — the same rule that stops it consuming an
  // armed Technique or spending ammo.
  if (ctx.metadata["chaoticMiss"]) return 0;

  // Continuous channels (the Slinger laser, the heavy cooldown beam) are not
  // discrete attack cycles: they tick at the server rate and would otherwise be
  // worth ten attacks a second. Each tick is worth the fraction of an attack it
  // actually deals, so a channel earns Tempo at the rate its own authored
  // damage says it is worth — no new balance constant, and no dead build.
  const channelFraction = channelTickFraction(ctx);
  if (channelFraction !== null) return Math.max(0, Math.min(1, channelFraction));

  // Conduit: one complete formation's worth of delivery is one attack. The
  // weight is normalized over the AUTHORED formation, so more bodies means more
  // events each worth proportionally less, and a formation fighting bodies down
  // simply never delivers the missing shares.
  if (ctx.formation) return Math.max(0, ctx.formation.tempoWeight);

  // Slinger: one nominal magazine is one attack. `reloadClipSize` is the
  // authoritative `ammoMax`, never the live ammo count, so a tactical reload
  // that dumps two bullets contributes 2/ammoMax rather than promoting each
  // bullet to a larger share of an attack.
  if (ctx.metadata["reloadClipShot"] === true) {
    const clipSize = reloadClipSize(ctx);
    return clipSize > 0 ? 1 / clipSize : 1;
  }

  return 1;
}

function reloadClipSize(ctx: CombatContext): number {
  const value = ctx.metadata["reloadClipSize"];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : 1;
}

/** The authored attack-fraction of a continuous channel tick, or null. */
function channelTickFraction(ctx: CombatContext): number | null {
  if (ctx.attackerType !== "player") return null;
  const passives = ctx.attacker.usesSkills.passives;
  if (ctx.metadata["reloadLaser"] === true) {
    return passives["reload.laser-damage-per-tick-pct"] ?? DEFAULT_CHANNEL_TICK_FRACTION;
  }
  if (ctx.metadata["channelBeam"] === true) {
    return passives["cooldown.channeled-beam-mult"] ?? DEFAULT_CHANNEL_TICK_FRACTION;
  }
  return null;
}

/**
 * Pay accumulated attack-equivalents into every attuned Technique whose CURRENT
 * rank owns a Tempo refund.
 *
 * Generic over the roster on purpose: Sweep is the only ability authoring
 * `tempoRefundMs` today, and a second one should need no server change.
 */
export function applyAttackTempo(player: PlayerEntity, contribution: number): void {
  if (contribution <= 0) return;
  const attuned = player.tracksProgression.attunedAbilities;
  if (!attuned) return;

  const combat = player.tracksCombat;
  for (const abilityId of attuned.techniques) {
    const ability = ABILITY_DATABASE.get(abilityId);
    if (!ability) continue;
    const refundMs = abilityTempoRefundMs(ability, player.tracksProgression.playerTier);
    if (refundMs <= 0) continue;

    const cooldownKey = abilityCooldownKey(abilityId);
    const remaining = getCooldown(combat, cooldownKey);
    // Tempo ACCELERATES a recovery; it never banks credit against a future one.
    // Accumulating while ready would let a player stand in a pack building a
    // free head start on the next activation.
    if (remaining <= 0) continue;

    const progressKey = abilityTempoProgressKey(abilityId);
    const progress = getResource(combat, progressKey) + contribution;
    // 1e-9 so six exact sixths of a clip complete the attack they obviously
    // are, instead of leaving a floating-point crumb that defers the refund by
    // a whole extra shot.
    const whole = Math.floor(progress + 1e-9);
    setResource(combat, progressKey, progress - whole);
    if (whole <= 0) continue;

    // The floor ticks down in real time from the last activation, so this is
    // exactly "never ready sooner than TECHNIQUE_TEMPO_MIN_CYCLE_MS after the
    // last one". Clamped against `remaining` so Tempo can only ever shorten.
    const floor = Math.min(remaining, getCooldown(combat, abilityTempoFloorKey(abilityId)));
    setCooldown(combat, cooldownKey, Math.max(floor, remaining - whole * refundMs));
  }
}

/**
 * Register the Tempo consumer.
 *
 * `afterHit`, not `onHit`, for two reasons: it runs only for attacks that
 * actually landed (a cancelled or fully dodged attack returns before it), and
 * it runs after the armed-Technique rider in `abilityEffects.ts` has resolved,
 * so the attack that DELIVERS Sweep is counted without any ordering assumption
 * between two listeners on one phase. That attack still counts toward the NEXT
 * Sweep — the cooldown it feeds started when Sweep ARMED, not when it landed,
 * so it is already running by the time the delivering blow connects.
 *
 * MUST be registered from `initCombatSystems()` so the live server and the
 * balance bench stay identical.
 */
export function initAttackTempoSystem(): void {
  registerCombatListener("afterHit", (ctx) => {
    if (ctx.attackerType !== "player") return;
    applyAttackTempo(ctx.attacker, basicAttackTempoContribution(ctx));
  });
}
