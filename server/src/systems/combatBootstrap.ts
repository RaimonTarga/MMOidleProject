import { initAllMechanics } from "./classes/registry";
import { initWeaponEffects } from "./combat/damage/weaponEffects";
import { initDefenseSystems } from "./defense";
import { initDebuffMechanics } from "./classes/shared/debuffs";
import { initInvulnerabilityGuard } from "./combat/invulnerability";
import { initDeadPlayerGuard } from "./world/playerIncapacitation";
import {
  registerSummonerDamageSponge,
} from "./classes/archetypes/summoner";
import { initMobilityBoots } from "./world/mobility/mobilityBoots";
import { initRuneTauntSystem } from "./combat/ai/taunt";
import { initDungeonGauntletCombatHooks } from "./world/dungeons/gauntlet";
import { initAbilitySystems } from "./player/abilities/abilityEffects";
import { initRiteListeners } from "./player/rites/riteOoc";
import { initCoreCombatEffects } from "./combat/cores";
import { initMonsterDeathEffects } from "./combat/damage/monsterDeathEffects";
import { initPlayerAmplifiers } from "./combat/damage/playerAmplifiers";

let initialized = false;

/**
 * Single source of truth for combat-pipeline bootstrap.
 *
 * Registers every combat-pipeline listener and per-system hook exactly once per
 * process. BOTH the live server (`server/src/index.ts`) and the balance/bench
 * harness (`server/bench/harness.ts`) call this, so anything registered here is
 * automatically exercised by the simulation bench.
 *
 * IMPORTANT: when you add a new combat-pipeline listener, defensive hook, or any
 * one-time `register*`/`init*` that affects combat resolution, add it HERE — not
 * inline in `index.ts`. Registering it only in `index.ts` makes the bench
 * silently diverge from live server behavior (this is exactly how the overlord
 * invulnerability guard was missed from the bench).
 *
 * Ordering matters — registration order is pipeline priority:
 *  - the player incoming amplifier must register BEFORE defense (so the cap and
 *    shields act on the amplified hit)
 *  - defense systems must register AFTER weapon effects (run later in the chain)
 *  - the summoner damage sponge must register AFTER defense (shields/absorb get
 *    first crack at incoming damage; whatever remains is siphoned to a slime)
 */
export function initCombatSystems(): void {
  if (initialized) return;
  initialized = true;

  // Class mechanics: each module's `init` registers its combat listeners once.
  initAllMechanics();
  // Weapon-specific hooks (first-strike, brittle, flurry, reservoir DoTs, ...).
  initWeaponEffects();
  // Player damage amplifiers (P3): must register BEFORE defense so the incoming
  // multiplier lands ahead of evasion / damage-cap / shields.
  initPlayerAmplifiers();
  // Evasion + shield absorption onDamageTaken listeners (after weapon effects).
  initDefenseSystems();
  // Vulnerability/debuff multipliers applied on damage taken.
  initDebuffMechanics();
  // Cancels attacks against invulnerable entities (dormant/phased bosses).
  initInvulnerabilityGuard();
  // Prevents dead players (corpses) from acting/being targeted.
  initDeadPlayerGuard();
  // Rune control hooks (currently taunt-current-target).
  initRuneTauntSystem();
  // Dungeon gauntlet participant tracking.
  initDungeonGauntletCombatHooks();
  // Definition-authored monster death triggers (and pack-alpha cleanup).
  initMonsterDeathEffects();
  // Abilities (Step 7): Technique rider applied on hit (consumes hasArmedAbility).
  initAbilitySystems();
  // Rites (Step 11): Hunter's Instinct onKill movement-haste buff.
  initRiteListeners();
  // Cores: Duelist elite/boss damage (onHit) + Bruiser mobility refund (onKill).
  initCoreCombatEffects();
  // Summoner mountain-path cover + damage sponge (after defense systems).
  registerSummonerDamageSponge();
  // Mobility boots: on-kill / on-acquire / on-hit speed & tenacity hooks.
  // Order-independent — these listeners only apply status effects, never touch ctx.damage.
  initMobilityBoots();
}
