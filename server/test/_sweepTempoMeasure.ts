/**
 * INSTRUMENTATION, not a test (underscore-prefixed, so the runner skips it).
 *
 * Two questions the Sweep-Tempo / Slam pass has to answer with numbers:
 *   1. what Sweep's real cycle time becomes for a slow, average, fast, Slinger
 *      and Conduit attacker under continuous combat;
 *   2. where Power Strike stops beating Slam as targets are added.
 *
 * Deliberately narrow: it drives the real cooldown, arming and Tempo code on a
 * fixed swing metronome. It does NOT model target acquisition, movement, the
 * attack-cadence gate, or the offensive-channel contention with other attuned
 * Techniques, so the cycle times are an upper bound on activation frequency
 * rather than a prediction of live DPS.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/_sweepTempoMeasure.ts
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityRankAt,
  emptyEquipment,
  getCooldown,
  tickCooldowns,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { runFormationAttack } from "../src/systems/classes/archetypes/summoner/formationAttack";
import { updateSummonerArchetype } from "../src/systems/classes/archetypes/summoner/summonerPrototype";
import { updateReloadArchetype } from "../src/systems/classes/archetypes/reload/reloadPrototype";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";
import type { MonsterEntity, PlayerEntity } from "../src/ecs/entity";

const TICK_MS = 100;
const RUN_MS = 120_000;

type Archetype = "reload" | "summoner" | null;

function slices(id: string, tier: number, archetype: Archetype, frame: string | null = null): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {},
      playerTier: tier, currentSkillTier: tier,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: ["sweep"], attunedAbilities: { techniques: ["sweep"], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype === "summoner" ? ["summoner-root", ...(frame ? [`summoner-${frame}`] : [])] : [],
      passives: {},
      selectedClass: archetype === "summoner" ? "summoner-root" : null,
      selectedSubVariant: frame as never,
      selectedRange: null,
      combatArchetype: archetype,
    },
  };
}

function build(id: string, tier: number, archetype: Archetype, frame: string | null = null) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, tier, archetype, frame), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  const targets: MonsterEntity[] = [];
  for (const x of [430, 470, 455]) {
    const monster = world.createMonster("node-5-5", "plains-slime", { x, y: 400 })!;
    monster.hasHealth.hp = 1e12;
    monster.hasHealth.maxHp = 1e12;
    monster.mitigatesDamage.plating = 0;
    monster.mitigatesDamage.damageReduction = 0;
    monster.mitigatesDamage.evasion = 0;
    targets.push(monster);
  }
  return { world, player, target: targets[0]! };
}

/** Activations of Sweep over RUN_MS, given a swing metronome. */
function measure(
  label: string,
  tier: number,
  swingMs: number,
  archetype: Archetype = null,
  ammoMax?: number,
  frame: string | null = null,
): void {
  const { world, player, target } = build(`m-${label}-${tier}`, tier, archetype, frame);
  if (archetype === "reload") {
    if (ammoMax) player.usesSkills.passives["reload.max-ammo"] = ammoMax;
    updateReloadArchetype(world, 0);
  }
  const minions: PlayerEntity["summonsMinions"] extends undefined ? never[] : ReturnType<World["getMinionEntity"]>[] = [];
  if (archetype === "summoner") {
    updateSummonerArchetype(world, 0, 0);
    for (const entityId of player.summonsMinions?.minionIds ?? []) {
      minions.push(world.getMinionEntity(entityId));
    }
  }

  let now = 0;
  let nextSwingAt = 0;
  let activations = 0;
  let firstActivationAt: number | null = null;
  let lastActivationAt = 0;
  // Ready-but-not-armed: for the Slinger this is the pre-existing clip gate
  // (`hasSweepClip` blocks re-arming until the magazine empties), which can
  // matter more than Tempo does.
  let readyButBlockedMs = 0;
  let landedShots = 0;

  while (now < RUN_MS) {
    // Arm Sweep whenever it is ready (the real firing driver).
    const wasCooling = getCooldown(player.tracksCombat, abilityCooldownKey("sweep")) > 0;
    setAttackTarget(world, player, target.isMonster.id);
    updateAbilityFiring(world, now);
    if (!wasCooling && getCooldown(player.tracksCombat, abilityCooldownKey("sweep")) > 0) {
      activations++;
      if (firstActivationAt === null) firstActivationAt = now;
      lastActivationAt = now;
    }

    if (!wasCooling && getCooldown(player.tracksCombat, abilityCooldownKey("sweep")) === 0) {
      readyButBlockedMs += TICK_MS;
    }

    if (archetype === "reload") updateReloadArchetype(world, TICK_MS);

    while (nextSwingAt <= now) {
      if (archetype === "summoner") {
        // Every body swings on the same metronome; the formation is what makes
        // one logical attack, so this is one formation cycle per swingMs.
        for (const minion of minions) {
          if (minion && minion.hasHealth.hp > 0) runFormationAttack(world, player, minion, target, now);
        }
      } else if (archetype === "reload") {
        // A shot only fires with ammo in the clip; the reload timer owns the gap.
        if ((player.usesReload?.ammo ?? 0) > 0 && (player.usesReload?.reloadingMs ?? 0) <= 0) {
          const outcome = runPlayerAttack(world, player, target, now, {
            attackOrigin: player.hasPosition.current,
            aggroSource: { id: player.isPlayer.id, kind: "player" },
          });
          if (outcome === "hit") landedShots++;
        }
      } else {
        runPlayerAttack(world, player, target, now, {
          attackOrigin: player.hasPosition.current,
          aggroSource: { id: player.isPlayer.id, kind: "player" },
        });
      }
      nextSwingAt += swingMs;
    }

    tickCooldowns(player.tracksCombat, TICK_MS);
    now += TICK_MS;
  }

  const span = lastActivationAt - (firstActivationAt ?? 0);
  const cycle = activations > 1 ? span / (activations - 1) : NaN;
  const authored = abilityRankAt(ABILITY_DATABASE.get("sweep")!, tier).cooldownMs;
  console.log(
    `  ${label.padEnd(30)} T${tier}  swing ${String(swingMs).padStart(5)}ms  ` +
    `activations ${String(activations).padStart(3)}  ` +
    `cycle ${cycle.toFixed(0).padStart(5)}ms  (authored ${authored}ms)` +
    (readyButBlockedMs > 0 ? `  [ready-but-blocked ${readyButBlockedMs}ms]` : "") +
    (landedShots > 0 ? `  [${landedShots} shots = ${(landedShots / Math.max(1, ammoMax ?? 1)).toFixed(1)} clips]` : ""),
  );
}

initCombatSystems();

console.log("\nSWEEP CYCLE UNDER CONTINUOUS COMBAT (120s, attacks always landing)\n");
console.log(" T1 — the untouched teaching rank:");
measure("slow (2.0s swing)", 1, 2000);
measure("average (1.0s swing)", 1, 1000);
measure("fast (0.5s swing)", 1, 500);

console.log("\n T3 — Tempo, 7s base, 1s per landed attack, 3s floor:");
measure("slow (2.0s swing)", 3, 2000);
measure("average (1.0s swing)", 3, 1000);
measure("fast (0.5s swing)", 3, 500);
measure("very fast (0.25s swing)", 3, 250);
measure("slinger 6-shot (0.25s shot)", 3, 250, "reload", 6);
measure("slinger 10-shot (0.25s shot)", 3, 250, "reload", 10);
measure("conduit 4-body (1.0s cycle)", 3, 1000, "summoner");
measure("conduit 4-body (0.5s cycle)", 3, 500, "summoner");
measure("conduit 6-body (1.0s cycle)", 3, 1000, "summoner", undefined, "light");
measure("conduit 2-body (1.0s cycle)", 3, 1000, "summoner", undefined, "heavy");

console.log("\nPOWER STRIKE vs SLAM — raw Attack multiple delivered per cast\n");
const slam = ABILITY_DATABASE.get("slam")!;
const power = ABILITY_DATABASE.get("power-strike")!;
const mult = (ability: typeof slam, tier: number): number => {
  const effect = abilityRankAt(ability, tier).effect;
  return effect.kind === "cast-strike" ? effect.damageMult : 0;
};
for (const tier of [2, 3, 4]) {
  const row = [1, 2, 3, 4, 5, 6].map((targets) => {
    const p = mult(power, tier);
    const s = mult(slam, tier) * targets;
    return `${targets}:${s > p ? "SLAM" : s === p ? "tie " : "PS  "} ${s.toFixed(2)}v${p.toFixed(2)}`;
  });
  console.log(`  T${tier}  ${row.join("   ")}`);
}
console.log("");
