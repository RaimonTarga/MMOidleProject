import { getResource, setResource } from "@mmo-idle/shared";
import type { World } from "../../world/World";
import { registerEvasion, resetEvadeAccumulator } from "./mitigation/evasion";
import { registerDamageCap } from "./mitigation/damageCap";
import { registerWardAbsorb } from "./barrier/wards";
import { registerBarrierAbsorb, runBarrierRecharge } from "./barrier/barrier";
import { registerBarrierBreakHeal } from "./barrier/barrierBreakHeal";
import { registerHitToDot, runDebtDrain, resetDebtCheatDeath } from "./mitigation/hitToDot";
import { registerCheatDeath, resetCheatDeath, runPostCheatDeathHeal } from "./mitigation/cheatDeath";
import { registerDamageAbsorb, runAbsorbDrain } from "./regen/damageAbsorb";
import { registerRecoveryOnKill } from "./regen/recoveryOnKill";
import { runDebuffCleanse } from "./mitigation/debuffCleanse";
import { runRecovery, resetRecoveryRamp } from "./regen/recovery";
import { registerHardening, runHardening, resetHardening, runHardeningMaxDr, resetHardeningMaxDr } from "./mitigation/hardening";
import { runStationaryDr } from "./mitigation/stationaryDr";
import { runSustainedFightDr } from "./mitigation/sustainedFightDr";
import { registerReactivePlating, runReactivePlating } from "./mitigation/reactivePlating";
import {
  registerBrambleReflect,
  runBramblePlating,
} from "../player/abilities/abilityBramble";
import { COMBAT_ELAPSED_KEY } from "./core/pools";
import { isPlayerInCombat } from "../combat/ai/engagement";

/**
 * Register all defense-layer combat pipeline listeners.
 * Call once at server startup after weapon/archetype effects so defense
 * listeners run last in onDamageTaken.
 *
 * Listener order within onDamageTaken (player as defender):
 *   1. Evasion         — reduces ctx.damage by the evade-mitigation fraction
 *   2. Damage cap      — clamps to defense.max-hit-pct of maxHp
 *   3. Wards           — temporary absorb pools spend first (use-it-or-lose-it)
 *   4. Barrier         — the permanent pool absorbs what the wards left
 *   5. Break heal      — reads the emptied-pool metadata both absorbs set
 *   6. Hit-to-DoT      — redirects defense.hit-to-dot-pct to debt pool
 *   7. Cheat death     — caps lethal damage to hp-1 (once per combat)
 *   8. Damage absorb   — converts defense.absorb-pct of hit into HoT pool
 */
export function initDefenseSystems(): void {
  registerEvasion();
  registerDamageCap();
  registerWardAbsorb();      // before the barrier — wards are use-it-or-lose-it
  registerBarrierAbsorb();
  registerBarrierBreakHeal(); // after both absorbs — reads their emptied-pool metadata
  registerHitToDot();
  registerCheatDeath();
  registerDamageAbsorb();
  registerRecoveryOnKill();
  registerHardening();
  registerReactivePlating();
  registerBrambleReflect();
}

/**
 * Run once per world tick after combat resolution.
 *
 * Handles all time-based defensive and recovery mechanics for each player.
 * The order matters — debt drain can kill the player and is skipped first.
 */
export function updateDefensiveSystems(
  world: World,
  dt: number,
  now: number,
): void {
  for (const player of world.livePlayers) {
    const inCombat = isPlayerInCombat(player, now);

    // Deterministic dodge accumulator resets while out of combat (single balance
    // lever via GAME_CONFIG.EVADE_OOC_RESET).
    if (!inCombat) {
      resetEvadeAccumulator(world, player);
      resetCheatDeath(player);
      resetDebtCheatDeath(player);
      resetRecoveryRamp(player);
      resetHardening(player);
      resetHardeningMaxDr(player);
    }

    // Combat-elapsed timer for in-fight ramps (sustained-fight DR, absorb ramp).
    // Reset to 0 out of combat; accumulated before the ramps that read it run.
    setResource(
      player.tracksCombat,
      COMBAT_ELAPSED_KEY,
      inCombat ? getResource(player.tracksCombat, COMBAT_ELAPSED_KEY) + dt : 0,
    );

    if (runDebtDrain(world, player)) continue; // player died → skip remaining

    runAbsorbDrain(world, player, dt);
    runPostCheatDeathHeal(world, player, dt);
    runBarrierRecharge(world, player, dt);
    runDebuffCleanse(world, player);
    // One Recovery pass covers OOC regen AND every in-combat regen effect: they
    // all activate a fraction of the same rate, so they must not be applied
    // separately (that is what made them independent %-maxHp heals before).
    runRecovery(world, player, dt, inCombat, player.hasNodeFeatureEffect !== undefined);
    runHardening(world, player, dt);
    runHardeningMaxDr(world, player);
    runStationaryDr(world, player, dt);
    runSustainedFightDr(world, player);
    runReactivePlating(world, player);
    runBramblePlating(world, player);
  }
}

// ── Public re-exports (preserve `defenseSystems` public API) ─────────────────

export { applyWard, applyWardPercent, updateWards } from "./barrier/wards";
export { refillBarrier, syncBarrier } from "./barrier/barrier";
export {
  applyHealToPlayer,
  getAntiHealMult,
  getDebuffResistanceMult,
} from "./regen/healing";
export {
  getDefenseAbsorbPool,
  getDefenseDebtPool,
} from "./core/pools";
export {
  activateRecovery,
  activeRecoveryFraction,
  recoveryPerSecond,
  type RecoverySourceId,
} from "./regen/recovery";
export { DEFENSE_BUFFS } from "./core/buffs";
