import { GAME_CONFIG, getResource, setResource } from "@mmo-idle/shared";
import type { World } from "../../world/World";
import { registerEvasion, resetEvadeAccumulator } from "./mitigation/evasion";
import { registerDamageCap } from "./mitigation/damageCap";
import { registerShieldAbsorb } from "./shields/shields";
import { registerShieldBreakHeal } from "./shields/shieldBreakHeal";
import { registerHitToDot, runDebtDrain, resetDebtCheatDeath } from "./mitigation/hitToDot";
import { registerCheatDeath, resetCheatDeath, runPostCheatDeathHeal } from "./mitigation/cheatDeath";
import { registerDamageAbsorb, runAbsorbDrain } from "./shields/damageAbsorb";
import { registerKillBurst, runRegenBurst } from "./regen/regenBurst";
import { runPeriodicShield } from "./shields/periodicShield";
import { runDebuffCleanse } from "./mitigation/debuffCleanse";
import { runInCombatRegen } from "./regen/inCombatRegen";
import { runRampRegen, resetRampRegen } from "./regen/rampRegen";
import { registerHardening, runHardening, resetHardening, runHardeningMaxDr, resetHardeningMaxDr } from "./mitigation/hardening";
import { runStationaryDr } from "./mitigation/stationaryDr";
import { runSustainedFightDr } from "./mitigation/sustainedFightDr";
import { registerReactivePlating, runReactivePlating } from "./mitigation/reactivePlating";
import {
  registerBrambleReflect,
  runBramblePlating,
} from "../player/abilities/abilityBramble";
import { COMBAT_ELAPSED_KEY } from "./core/pools";
import { runRiteOoc } from "../player/rites/riteOoc";

/**
 * Register all defense-layer combat pipeline listeners.
 * Call once at server startup after weapon/archetype effects so defense
 * listeners run last in onDamageTaken.
 *
 * Listener order within onDamageTaken (player as defender):
 *   1. Evasion         — reduces ctx.damage by the evade-mitigation fraction
 *   2. Damage cap      — clamps to defense.max-hit-pct of maxHp
 *   3. Shield          — absorbs remaining damage
 *   4. Hit-to-DoT      — redirects defense.hit-to-dot-pct to debt pool
 *   5. Cheat death     — caps lethal damage to hp-1 (once per combat)
 *   6. Damage absorb   — converts defense.absorb-pct of hit into HoT pool
 */
export function initDefenseSystems(): void {
  registerEvasion();
  registerDamageCap();
  registerShieldAbsorb();
  registerShieldBreakHeal(); // after shield absorb — reads its shieldBrokenMax metadata
  registerHitToDot();
  registerCheatDeath();
  registerDamageAbsorb();
  registerKillBurst();
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
    const lastCombatAt = player.tracksEngagement;
    const inCombat =
      player.hasAttackTarget !== undefined ||
      (lastCombatAt !== undefined &&
        now - lastCombatAt < GAME_CONFIG.COMBAT_REGEN_DELAY);

    // Deterministic dodge accumulator resets while out of combat (single balance
    // lever via GAME_CONFIG.EVADE_OOC_RESET).
    if (!inCombat) {
      resetEvadeAccumulator(player);
      resetCheatDeath(player);
      resetDebtCheatDeath(player);
      resetRampRegen(player);
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
    runRegenBurst(world, player, dt, inCombat);
    runPeriodicShield(world, player, inCombat);
    runDebuffCleanse(world, player);
    runInCombatRegen(world, player, dt);
    runRampRegen(world, player, dt);
    runHardening(world, player, dt);
    runHardeningMaxDr(world, player);
    runStationaryDr(world, player, dt);
    runSustainedFightDr(world, player);
    runReactivePlating(world, player);
    runBramblePlating(world, player);
    // Rites (system rework Step 11): OOC cleanse + buff-decay slowdown. Internally
    // gated to out-of-combat, so it self-skips while the player is engaged.
    runRiteOoc(world, player, dt, now);
  }
}

// ── Public re-exports (preserve `defenseSystems` public API) ─────────────────

export {
  applyShield,
  applyShieldPercent,
  updateShields,
} from "./shields/shields";
export {
  applyHealToPlayer,
  getAntiHealMult,
  getDebuffResistanceMult,
} from "./regen/healing";
export {
  getDefenseAbsorbPool,
  getDefenseBurstPool,
  getDefenseDebtPool,
} from "./core/pools";
export { DEFENSE_BUFFS } from "./core/buffs";
