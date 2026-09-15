/**
 * SLAM — the T2 area counterpart to Power Strike.
 *
 * Asserts the things that make it a real choice rather than a second Power
 * Strike:
 *   1. it is acquired like any other T2 Technique, and ranks by player tier;
 *   2. it hits everything in its authored radius exactly once, through the
 *      normal mitigation pipeline;
 *   3. it is a CAST, not an empowered attack — no on-hit effects ride it;
 *   4. Technique Power buys damage and never reach;
 *   5. cast speed shortens its wind-up, attack speed does not, and hard control
 *      breaks it exactly like every other cast;
 *   6. the Power Strike / Slam crossover holds at every tier;
 *   7. Power Strike itself is untouched.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilitySlam.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityCastMs,
  abilityCooldownMs,
  abilityRankAt,
  abilityRankNumber,
  applyStatusEffect,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  resolveAbilityEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { updateAbilityCasts } from "../src/systems/player/abilities/abilityCasting";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { resolveCastPayload } from "../src/systems/player/abilities/abilityEffects";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";
import type { PlayerEntity } from "../src/ecs/entity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const SLAM = ABILITY_DATABASE.get("slam")!;
const POWER_STRIKE = ABILITY_DATABASE.get("power-strike")!;

function slamEffect(tier: number) {
  const effect = abilityRankAt(SLAM, tier).effect;
  assert(effect.kind === "cast-strike", "Slam must resolve as a cast-strike");
  return effect as Extract<typeof effect, { kind: "cast-strike" }>;
}

function castMult(ability: typeof SLAM, tier: number): number {
  const effect = abilityRankAt(ability, tier).effect;
  return effect.kind === "cast-strike" ? effect.damageMult : 0;
}

function slices(
  id: string,
  options: { tier?: number; archetype?: "dot" | null } = {},
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: options.tier ?? 2,
      currentSkillTier: options.tier ?? 2,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["slam"],
      attunedAbilities: { techniques: ["slam"], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: options.archetype ?? null,
    },
  };
}

function spawn(id: string, options: { tier?: number; archetype?: "dot" | null } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, options), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  return { world, player };
}

function monsterAt(world: World, x: number, y = 400) {
  const monster = world.createMonster("node-5-5", "plains-slime", { x, y });
  if (!monster) throw new Error("failed to create Slam target");
  monster.hasHealth.hp = 100_000;
  monster.hasHealth.maxHp = 100_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  monster.mitigatesDamage.evasion = 0;
  return monster;
}

initCombatSystems();

// ── 1. Acquisition and ranking ───────────────────────────────────────────────
{
  const recipe = [...ABILITY_RECIPE_DATABASE.values()].find((r) => r.abilityId === "slam");
  assert(!!recipe, "Slam must be learnable through an ability recipe, not granted by tier");
  assert(recipe!.tier === 2, "Slam's recipe is a T2 recipe");
  assert(
    recipe!.recipeGroup === "mountain" && recipe!.requiredBiomeLevel === 9,
    "Slam is homed in Mountain's T2 band (its own level 3 = biome level 9)",
  );

  assert(SLAM.tier === 2 && SLAM.slot === "technique" && SLAM.shape === "cast",
    "Slam is a T2 cast-shaped Technique");
  assert(SLAM.attunementCost === 6, "Slam reserves 6 RP");
  assert(abilityRankNumber(SLAM, 2) === 1, "a T2 player holds Slam I");
  assert(abilityRankNumber(SLAM, 3) === 2, "a T3 player holds Slam II");
  assert(abilityRankNumber(SLAM, 4) === 3, "a T4 player holds Slam III");

  const mults = [2, 3, 4].map((tier) => slamEffect(tier).damageMult);
  assert(
    mults[0] === 1.75 && mults[1] === 2.0 && mults[2] === 2.25,
    `Slam's authored ladder should be 1.75 / 2.0 / 2.25, got ${mults.join(" / ")}`,
  );
  for (const tier of [2, 3, 4]) {
    assert(slamEffect(tier).radius === 150, "Slam's authored radius is 150px at every rank");
    assert(abilityCooldownMs(SLAM, tier) === 10000, "Slam holds a 10s cooldown");
    assert(abilityCastMs(SLAM, tier) === 1600, "Slam holds a 1.6s wind-up");
  }
  assert(
    slamEffect(2).radius > 90,
    "Slam's area must be meaningfully broader than Sweep's 90px splash",
  );
  assert(
    slamEffect(2).stunMs === undefined,
    "Slam carries no control rider in this pass",
  );
}

// ── 2. It hits everything in the radius exactly once, through mitigation ─────
{
  const { world, player } = spawn("slam-area");
  const target = monsterAt(world, 430);
  const inside = monsterAt(world, 470);
  const outside = monsterAt(world, 900);
  // Plating on the secondary proves the payload still runs the defensive
  // pipeline rather than writing HP directly.
  inside.mitigatesDamage.plating = 20;

  const before = [target, inside, outside].map((m) => m.hasHealth.hp);
  resolveCastPayload(world, player, SLAM, target);

  const expected = Math.round(player.dealsDamage.attack * 1.75);
  assert(
    before[0]! - target.hasHealth.hp === expected,
    `the primary should take attack x1.75 (${expected}), got ${before[0]! - target.hasHealth.hp}`,
  );
  assert(
    before[1]! - inside.hasHealth.hp === expected - 20,
    "a second target inside the radius takes the same payload through its own plating",
  );
  assert(
    outside.hasHealth.hp === before[2]!,
    "a monster outside the radius must take nothing",
  );

  // Once each — a second cast adds exactly one more hit's worth, never two.
  resolveCastPayload(world, player, SLAM, target);
  assert(
    before[0]! - target.hasHealth.hp === expected * 2,
    "each target is damaged exactly once per Slam",
  );
}

// ── 3. A cast is not an attack: no ordinary on-hit effects ride it ───────────
{
  const { world, player } = spawn("slam-onhit", { archetype: "dot" });
  assert(!!player.appliesDots, "Apprentice fixture should attach AppliesDots");
  // A large flat on-hit stat: if Slam went through the attack pipeline this
  // would land on top of the payload.
  player.dealsDamage.onHitDamage = 500;
  const target = monsterAt(world, 430);
  const before = target.hasHealth.hp;

  resolveCastPayload(world, player, SLAM, target);

  assert(
    before - target.hasHealth.hp === Math.round(player.dealsDamage.attack * 1.75),
    "Slam's damage is its own payload — flat on-hit damage must not be added to it",
  );
  assert(
    getStatusEffect(target.tracksCombat, "dot") === undefined,
    "an Apprentice's on-hit class DoT must not proc off a cast payload",
  );
}

// ── 4. Technique Power scales damage, never radius ───────────────────────────
{
  const powered = resolveAbilityEffect(SLAM, { playerTier: 2, techniquePowerPct: 0.5 });
  assert(powered.kind === "cast-strike", "Slam stays a cast-strike under Technique Power");
  assert(
    powered.kind === "cast-strike" && Math.abs(powered.damageMult - 1.75 * 1.5) < 1e-9,
    "Technique Power must scale Slam's damage multiplier",
  );
  assert(
    powered.kind === "cast-strike" && powered.radius === 150,
    "Technique Power must NOT widen Slam's radius",
  );

  const { world, player } = spawn("slam-power");
  player.usesSkills.passives["technique.power-pct"] = 0.5;
  const target = monsterAt(world, 430);
  const far = monsterAt(world, 400 + 200);
  const before = target.hasHealth.hp;
  resolveCastPayload(world, player, SLAM, target);
  assert(
    before - target.hasHealth.hp === Math.round(100 * 1.75 * 1.5),
    "the live payload should carry Technique Power",
  );
  assert(
    far.hasHealth.hp === far.hasHealth.maxHp,
    "Technique Power must not reach a target the authored radius cannot",
  );
}

// ── 5. Cast lifecycle: speed, cadence independence, interruption ─────────────
{
  const { world, player } = spawn("slam-cast");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  updateAbilityFiring(world, 1_000);
  assert(
    player.isCastingAbility?.abilityId === "slam",
    "Slam should begin a wind-up rather than arming the next attack",
  );
  const baselineCastMs = player.isCastingAbility!.castMs;
  assert(baselineCastMs === 1600, "the authored wind-up should be used as-is");

  updateAbilityCasts(world, 1_000 + baselineCastMs - 1);
  assert(!!player.isCastingAbility, "the wind-up must hold until it elapses");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 0,
    "a cast pays its cooldown on resolve, never on begin",
  );
  const before = target.hasHealth.hp;
  updateAbilityCasts(world, 1_000 + baselineCastMs);
  assert(player.isCastingAbility === undefined, "the wind-up should resolve on time");
  assert(target.hasHealth.hp < before, "the resolved cast should land its payload");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 10000,
    "resolving should start Slam's authored cooldown",
  );
}

// Attack speed does NOT shorten the wind-up; cast speed does.
{
  const fast = spawn("slam-attack-speed");
  fast.player.usesSkills.passives["shared.attack-speed-pct"] = 1.5;
  const fastTarget = monsterAt(fast.world, 430);
  setAttackTarget(fast.world, fast.player, fastTarget.isMonster.id);
  updateAbilityFiring(fast.world, 1_000);
  assert(
    fast.player.isCastingAbility?.castMs === 1600,
    "attack speed must not shorten Slam's wind-up — that is the whole reason it favours heavy builds",
  );

  const quick = spawn("slam-cast-speed");
  quick.player.usesSkills.passives["technique.cast-speed-pct"] = 0.25;
  const quickTarget = monsterAt(quick.world, 430);
  setAttackTarget(quick.world, quick.player, quickTarget.isMonster.id);
  updateAbilityFiring(quick.world, 1_000);
  assert(
    (quick.player.isCastingAbility?.castMs ?? 1600) < 1600,
    "technique.cast-speed-pct should shorten Slam's wind-up through the existing seam",
  );
}

// Hard control breaks the wind-up, with no payload and no cooldown spent.
{
  const { world, player } = spawn("slam-interrupt");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  updateAbilityFiring(world, 1_000);
  assert(!!player.isCastingAbility, "Slam should begin a wind-up");

  const before = target.hasHealth.hp;
  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    remainingMs: 2_000,
    refreshable: true,
    sourceId: target.isMonster.id,
    data: { totalMs: 2_000 },
  });
  updateAbilityCasts(world, 1_010);
  assert(player.isCastingAbility === undefined, "hard control must break the wind-up");
  assert(target.hasHealth.hp === before, "an interrupted Slam lands no payload");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 0,
    "an interrupted cast must not be punished with its cooldown too",
  );
}

// ── 6. The Power Strike crossover holds at every tier ────────────────────────
{
  for (const tier of [2, 3, 4]) {
    const slam = castMult(SLAM, tier);
    const power = castMult(POWER_STRIKE, tier);
    assert(
      Math.abs(power - slam * 2) < 1e-9,
      `T${tier}: two Slam targets must equal Power Strike's multiple (${slam} x2 vs ${power})`,
    );
    assert(slam < power, `T${tier}: one target must clearly favour Power Strike`);
    assert(slam * 3 > power, `T${tier}: three targets must clearly favour Slam`);
  }
}

// ── 7. Power Strike is untouched ─────────────────────────────────────────────
{
  const mults = [1, 2, 3, 4].map((tier) => castMult(POWER_STRIKE, tier));
  assert(
    mults.join(",") === "3,3.5,4,4.5",
    `Power Strike's ladder must be unchanged, got ${mults.join(",")}`,
  );
  for (const tier of [1, 2, 3, 4]) {
    const effect = abilityRankAt(POWER_STRIKE, tier).effect;
    assert(
      effect.kind === "cast-strike" && effect.radius === undefined,
      "Power Strike must stay strictly single-target",
    );
    assert(abilityCooldownMs(POWER_STRIKE, tier) === 10000, "Power Strike's cooldown is unchanged");
    assert(abilityCastMs(POWER_STRIKE, tier) === 1600, "Power Strike's wind-up is unchanged");
  }
  assert(
    POWER_STRIKE.attunementCost === 6 && POWER_STRIKE.tier === 1,
    "Power Strike's cost and home tier are unchanged",
  );
  // Both are ordinary attunable Techniques: neither consumes or disables the other.
  assert(
    SLAM.lineageId !== POWER_STRIKE.lineageId,
    "Slam must not be filed as a Power Strike evolution",
  );
}

// Both can be held and attuned at once.
{
  const { world, player } = spawn("slam-coexist") as { world: World; player: PlayerEntity };
  player.tracksProgression.knownAbilities = ["slam", "power-strike"];
  player.tracksProgression.attunedAbilities = {
    techniques: ["slam", "power-strike"],
    guards: [],
  };
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  updateAbilityFiring(world, 1_000);
  assert(
    player.isCastingAbility?.abilityId === "slam",
    "loadout order decides which of the two casts claims the channel",
  );
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("power-strike")) === 0,
    "the Technique that did not fire is merely waiting — never consumed or disabled",
  );
}

console.log("abilitySlam.test.ts: ok");
