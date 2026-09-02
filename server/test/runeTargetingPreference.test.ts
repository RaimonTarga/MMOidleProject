import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  type EquippedRule,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { selectAutoCombatAction } from "../src/systems/combat/ai/targetPriority";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

/**
 * Target ACQUISITION vs target PREFERENCE.
 *
 * These are two different decisions and the Rune language treats them as such:
 *
 *   Acquisition  -- which new fight to begin. Owned by the GLOBAL_STRATEGY
 *                   channel (`Find Enemies`) and the acquire radius.
 *   Preference   -- which enemy to focus among the ones already in this fight.
 *                   Owned by the TARGETING channel (`Focus Highest HP` etc.).
 *
 * A player who writes `In Combat -> Focus Highest HP` is saying "in a fight,
 * hit the big one first". They are NOT saying "walk away from the wolf chewing
 * on you and go wake the 4,000 HP razortusk across the field". Conflating the
 * two turns a reasonable preference into a suicide button, and it is invisible
 * from the rune panel because the rule looks like it did exactly what it said.
 *
 * The bug this pins down was structural rather than a tuning slip. The scoring
 * weights for both HP-preference modes set `distance: 0.001`, and `Find Enemies`
 * raises the acquire radius to `RUNE_NODE_ACQUIRE_RADIUS` (10,000 -- larger than
 * a 4,800px node), so `score = maxHp - 0.001 * penalty` ranked EVERY monster in
 * the node by raw max HP with distance as a rounding error.
 *
 * `focus-elites` is deliberately NOT covered by this rule and keeps its
 * cross-node reach: pulling the necromancer first is the whole point of it, and
 * `eliteTargeting.test.ts` pins that behavior on purpose.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const NODE = "node-5-5";

function makePlayerSlices(id: string, runesEquipped: EquippedRule[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: NODE,
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
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      // `focus-highest-max-hp` and `focus-lowest-hp` are both crafted unlocks,
      // not starters. `attachPlayerEntity` re-derives ownership from crafted
      // recipes and silently drops any rule it does not own, so a missing recipe
      // here would make the test pass for the wrong reason.
      runeRecipesCrafted: ["rune-recipe-focus-highest-hp", "rune-recipe-focus-lowest-hp"],
      runesEquipped,
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
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
      combatArchetype: null,
    },
  };
}

interface Scenario {
  world: World;
  player: ReturnType<World["attachPlayerEntity"]>;
}

function scenario(id: string, rules: EquippedRule[]): Scenario {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices(id, rules), id);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    acquireRadius: 10_000,
  });
  return { world, player };
}

function spawn(s: Scenario, typeId: string, x: number, y: number) {
  const monster = s.world.createMonster(NODE, typeId, { x, y });
  if (!monster) throw new Error(`failed to spawn ${typeId}`);
  return monster;
}

/** Derive rune flags for this tick, then restore the wide test acquire radius. */
function tick(s: Scenario, now: number): void {
  updateRuneDerivedConfig(s.world, now);
  s.player.usesAutocombat.acquireRadius = 10_000;
}

function chosen(s: Scenario, now: number): string | null {
  const action = selectAutoCombatAction(s.world, s.player, s.player.usesAutocombat, now);
  return action.kind === "attack" ? action.target.isMonster.id : null;
}

// ── 1. Preference must not become acquisition ──────────────────────────────
{
  const s = scenario("focus-high-engaged", [
    { conditionId: "in-combat", actionId: "focus-highest-max-hp" },
  ]);
  // The fight the player is actually in: an ordinary wolf, right on top of them.
  const engaged = spawn(s, "prairie-wolf", 460, 400);
  // An unrelated 4,000 HP monster, far across the node, minding its own business.
  const distantBig = spawn(s, "gorging-razortusk", 3_600, 400);

  setAggroTarget(s.world, engaged, { id: s.player.isPlayer.id, kind: "player" }, 1_000);
  tick(s, 1_000);

  const picked = chosen(s, 1_000);
  assert(
    picked === engaged.isMonster.id,
    `In Combat -> Focus Highest HP must focus within the active encounter, not walk ` +
      `across the node to a bigger unengaged monster (picked ${picked}, ` +
      `expected the engaged ${engaged.isMonster.id} rather than ${distantBig.isMonster.id})`,
  );
}

// ── 2. Preference orders WITHIN the encounter ──────────────────────────────
{
  const s = scenario("focus-high-multi", [
    { conditionId: "in-combat", actionId: "focus-highest-max-hp" },
  ]);
  const small = spawn(s, "plains-slime", 450, 400);
  const big = spawn(s, "stampede-bull", 700, 400);
  for (const m of [small, big]) {
    setAggroTarget(s.world, m, { id: s.player.isPlayer.id, kind: "player" }, 1_000);
  }
  tick(s, 1_000);
  assert(
    chosen(s, 1_000) === big.isMonster.id,
    "among two engaged enemies, Focus Highest HP takes the larger pool even though it is farther",
  );
}

// ── 3. Out of combat, the rule's condition is false and must not steer ─────
{
  const s = scenario("focus-high-idle", [
    { conditionId: "in-combat", actionId: "focus-highest-max-hp" },
  ]);
  const near = spawn(s, "plains-slime", 460, 400);
  spawn(s, "gorging-razortusk", 3_600, 400);
  tick(s, 1_000);
  assert(
    chosen(s, 1_000) === near.isMonster.id,
    "with nothing engaged the In Combat condition is false, so acquisition stays on nearest",
  );
}

// ── 4. Focus Lowest HP, and the scale trap underneath it ──────────────────
{
  const s = scenario("focus-low-multi", [
    { conditionId: "in-combat", actionId: "focus-lowest-hp" },
  ]);
  const wounded = spawn(s, "prairie-wolf", 700, 400);
  const healthy = spawn(s, "stampede-bull", 450, 400);
  wounded.hasHealth.hp = 30;
  for (const m of [wounded, healthy]) {
    setAggroTarget(s.world, m, { id: s.player.isPlayer.id, kind: "player" }, 1_000);
  }
  tick(s, 1_000);
  assert(
    chosen(s, 1_000) === wounded.isMonster.id,
    "Focus Lowest HP finishes the wounded enemy even though it is farther away",
  );
}
{
  // The same preference at a much larger HP scale. The original score was
  // `1 / hp`, whose SPACING collapses as HP grows: at 1,700 vs 4,000 the two
  // candidates differ by 3e-4 while the distance term contributes 1e-3, so the
  // rule silently inverted into "focus nearest" exactly where big pulls make it
  // matter most. A correct implementation is scale-free.
  const s = scenario("focus-low-scale", [
    { conditionId: "in-combat", actionId: "focus-lowest-hp" },
  ]);
  const lower = spawn(s, "tusked-razorback", 900, 400);
  const higher = spawn(s, "gorging-razortusk", 450, 400);
  for (const m of [lower, higher]) {
    setAggroTarget(s.world, m, { id: s.player.isPlayer.id, kind: "player" }, 1_000);
  }
  tick(s, 1_000);
  assert(
    chosen(s, 1_000) === lower.isMonster.id,
    "Focus Lowest HP must stay correct at large HP scales, not collapse into focus-nearest",
  );
}

// ── 5. Focus Closest is unchanged ─────────────────────────────────────────
{
  const s = scenario("focus-closest", [
    { conditionId: "in-combat", actionId: "focus-closest" },
  ]);
  const near = spawn(s, "plains-slime", 450, 400);
  const farBig = spawn(s, "gorging-razortusk", 1_200, 400);
  for (const m of [near, farBig]) {
    setAggroTarget(s.world, m, { id: s.player.isPlayer.id, kind: "player" }, 1_000);
  }
  tick(s, 1_000);
  assert(chosen(s, 1_000) === near.isMonster.id, "Focus Closest still picks the nearest enemy");
}

console.log("runeTargetingPreference.test.ts: ok");
