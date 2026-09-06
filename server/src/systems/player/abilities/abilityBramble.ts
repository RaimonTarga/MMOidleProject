import { pushDamageEvent } from '../../combat/damage/damageEvent';
/**
 * Bramble Guard — temporary hardening + flat retaliation (abilities evolution §9, T2).
 *
 * The first reflect mechanic in the game. Two halves, both keyed off one status
 * effect so the buff bar has a single honest clock:
 *
 * 1. **Hardening** — `platingBonus` is added to `mitigatesDamage.plating` while
 *    the buff is up, synced per tick from the effect exactly like reactive
 *    plating (`defense/mitigation/reactivePlating.ts`), which is the established
 *    pattern for temporary plating.
 * 2. **Reflect** — a flat amount dealt back to a monster that lands a DIRECT
 *    hit. Deliberately FLAT rather than a fraction of damage taken: a
 *    percentage would scale with incoming damage and turn "get hit harder" into
 *    "deal more damage", which is exactly the offence/defence budget leak the
 *    design forbids (plan §3.3).
 *
 * Reflect explicitly does NOT fire on DoT ticks (no attacker to answer), on
 * evaded hits, or on damage from anything but a monster.
 */
import {
  applyStatusEffect,
  getResource,
  getStatusEffect,
  setResource,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { actorFromPlayer } from "../../../world/worldLogActors";
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
} from "../../../world/worldLogCombat";

export const BRAMBLE_EFFECT_ID = "ability-bramble";

/** Integer plating currently folded into `mitigatesDamage.plating` from the buff. */
const APPLIED_KEY = "bramblePlatingApplied";

/** Apply (or refresh) the Bramble state. Called when the Guard fires. */
export function applyBrambleGuard(
  player: PlayerEntity,
  platingBonus: number,
  reflectFlat: number,
  durationMs: number,
): void {
  applyStatusEffect(player.tracksCombat, {
    id: BRAMBLE_EFFECT_ID,
    maxStacks: 1,
    instanced: false,
    refreshable: true,
    remainingMs: durationMs,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: durationMs,
      platingBonus: Math.round(platingBonus),
      reflectFlat: Math.round(reflectFlat),
    },
  });
}

/** Current bramble plating bonus applied — for the buff descriptor. */
export function getBramblePlatingBonus(player: PlayerEntity): number {
  return Math.round(getResource(player.tracksCombat, APPLIED_KEY));
}

/** Strip the applied plating and zero tracking (recalc, before rebuild). */
export function resetBramblePlating(player: PlayerEntity): void {
  const applied = Math.round(getResource(player.tracksCombat, APPLIED_KEY));
  if (applied <= 0) return;
  player.mitigatesDamage.plating -= applied;
  setResource(player.tracksCombat, APPLIED_KEY, 0);
}

/**
 * Per-tick sync of bramble plating onto `mitigatesDamage.plating`. The status
 * effect decays on its own in `updateCombatState`; this reconciles the applied
 * delta so the stat sheet reflects it live and it unwinds exactly once.
 */
export function runBramblePlating(world: World, player: PlayerEntity): void {
  const cs = player.tracksCombat;
  const effect = getStatusEffect(cs, BRAMBLE_EFFECT_ID);
  const target =
    effect && effect.remainingMs > 0 ? Math.round(effect.data["platingBonus"] ?? 0) : 0;
  const applied = Math.round(getResource(cs, APPLIED_KEY));
  const delta = target - applied;
  if (delta === 0) return;
  player.mitigatesDamage.plating += delta;
  setResource(cs, APPLIED_KEY, target);
  markSliceDirty(world, player, "mitigatesDamage");
}

/**
 * Register the reflect listener. `afterHit` rather than `onDamageTaken` so the
 * retaliation is a consequence of a RESOLVED hit — reflecting mid-mitigation
 * would let it fire on hits that end up fully absorbed.
 */
export function registerBrambleReflect(): void {
  registerCombatListener("afterHit", (ctx, world) => {
    if (ctx.attackerType !== "monster" || ctx.defenderType !== "player") return;
    if (ctx.metadata["isDot"]) return; // no attacker swing to answer
    if (ctx.damage <= 0) return; // fully absorbed / evaded to nothing

    const player = ctx.defender;
    const effect = getStatusEffect(player.tracksCombat, BRAMBLE_EFFECT_ID);
    if (!effect || effect.remainingMs <= 0) return;
    const reflect = Math.round(effect.data["reflectFlat"] ?? 0);
    if (reflect <= 0) return;

    const monster = ctx.attacker;
    if (monster.hasHealth.hp <= 0) return;

    // Flat and unmitigated: the thorns are the player's damage, not a re-run of
    // the monster's attack, so plating/DR would double-dip the same exchange.
    recordMonsterDamagedByPlayer(
      world,
      player.isPlayer.id,
      actorFromPlayer(player),
      monster,
      reflect,
      // `proc` — damage from a triggered effect rather than a swing. Reusing the
      // existing type keeps the world-log filters working without a new category.
      "proc",
      buildSimpleBreakdown(reflect, reflect),
    );
    monster.hasHealth.hp -= reflect;
    pushDamageEvent(world, monster, reflect, { sourceId: player.isPlayer.id });

    // Killing blow is handled by the normal monster-death sweep on the next
    // tick; deliberately not calling removeMonsterEntity mid-pipeline.
  });
}
