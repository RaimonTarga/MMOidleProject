// Smoke test for the Forest T1 dungeon: the alpha-priority / predator-burst exam.
//   - alpha den (1 Wolf alpha + 2 Young Wolves) spawns as the pre-encounter
//   - clearing the den → clean boss start; leaving it → it joins the boss (join)
//   - the boss's charged "Savage Maul" telegraphs (cast bar) then lands a spike
//   - the boss's 50% beat is a light enrage only (no adds — T1 simplification)
//   - the boss can still be cleared
//
// Run: pnpm --filter @mmo-idle/server exec tsx ../server/test/dungeonForest.test.ts

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  PRE_ENCOUNTER_AURA_EFFECT_ID,
  STARTER_RUNE_IDS,
  SUN_MARK_EFFECT_ID,
  emptyEquipment,
  getDungeonGauntletDef,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeonGauntlet,
  onDungeonMonsterRewarded,
  tickDungeonGauntlets,
} from "../src/systems/world/dungeons/gauntlet";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { setAggroTarget, setAttackTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
const FOREST_NODE = "node-6-7"; // Forest T1 dungeon (Gnarled Greatbear)

function makePlayerSlices(
  id: string,
  nodeId: string,
  pos = { ...ALTAR },
  maxHp = GAME_CONFIG.PLAYER_MAX_HP,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...pos }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: maxHp, maxHp, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
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
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
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
      combatArchetype: "cadence",
    },
  };
}

function setupForest(): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${FOREST_NODE}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, FOREST_NODE), playerId);
  world.frozenNodes.delete(FOREST_NODE);
  ensureDungeonGauntlet(world, FOREST_NODE);
  return { world, playerId };
}

// ── 0. Definition wiring ────────────────────────────────────────────────────
{
  const def = getDungeonGauntletDef(FOREST_NODE);
  assert(!!def, `expected a gauntlet def for ${FOREST_NODE}`);
  assert(def!.biomeTier === 1, "forest dungeon must be tier 1 (pre-encounter)");
  assert(def!.phases.length === 0, "forest T1 must not run gauntlet waves");
  assert(def!.preEncounter?.id === "forest-alpha-den", "forest T1 uses an authored alpha den");
  const denGroup = def!.preEncounter.groups[0];
  assert(denGroup?.kind === "pack", "forest alpha den is authored as a pack");
  assert((def!.unclearedThreat?.mode ?? "join") === "join", "uncleared alpha joins the boss");
  // The alpha projects a predator howl (damage aura) over its pups.
  assert(
    denGroup.kind === "pack" && denGroup.aura?.kind === "damage" && denGroup.aura.mult > 1,
    "the den alpha carries a damage (howl) aura buffing its pups",
  );

  const boss = MONSTER_DATABASE.get("gnarled-greatbear")!;
  assert(boss.chargedAttack?.name === "Savage Maul", "forest boss has the charged Maul");
  assert((boss.chargedAttack?.multiplier ?? 0) > 1, "Maul is an amplified spike");
  assert((boss.chargedAttack?.knockback?.distance ?? 0) > 0, "Maul has a pounce-shove");
  // Marked-prey identity: the Maul paints "Scent of Blood" before the pounce.
  assert(
    (boss.chargedAttack?.marksTarget?.durationMs ?? 0) > 0,
    "the Maul marks its prey (Scent of Blood) before the charged pounce",
  );
  // T1 simplification: no adds during the boss fight (Plains is the only T1 boss
  // with adds) — the Maul, not adds, is the threat. The 50% beat is a light enrage.
  assert(
    !boss.bossScript?.phases?.some((p) => p.actions.some((a) => a.type === "spawn-adds")),
    "the forest boss spawns no adds (T1 simplification)",
  );
  assert(
    boss.bossScript?.phases?.[0]?.actions.some((a) => a.type === "enrage") === true,
    "the 50% beat is a light enrage",
  );
  assert(
    !boss.bossScript?.repeating,
    "the forest boss has no repeating add beat (no continuous wolf spam)",
  );
}

// ── 1. Alpha den spawns (1 alpha + 2 young wolves, alpha is the standout) ────
{
  const { world } = setupForest();
  const state = world.gauntlets.get(FOREST_NODE)!;
  assert(state.idleGuardianIds.length === 3, "den spawns 3 members (alpha + 2 young)");

  const members = state.idleGuardianIds.map((id) => world.getMonsterEntity(id)!);
  const alphas = members.filter((m) => m.inPack?.role === "alpha");
  const followers = members.filter((m) => m.inPack?.role === "follower");
  assert(alphas.length === 1, "exactly one pack alpha in the den");
  assert(followers.length === 2, "two pack followers in the den");
  assert(alphas[0].isMonster.monsterTypeId === "wolf", "alpha is the adult Wolf");
  assert(
    followers.every((f) => f.isMonster.monsterTypeId === "young-wolf"),
    "followers are Young Wolves",
  );
  assert(
    members.every((m) => m.tracksDungeon?.source === "idleDungeonGuardian"),
    "all den members are tracked as idle guardians",
  );
  // The alpha is the standout (guardian name + buff); followers keep their identity.
  assert(alphas[0].tracksDungeon?.preEncounterRole === "leader", "alpha is the den leader");
  assert(followers.every((f) => f.tracksDungeon?.preEncounterRole === "follower"), "pups are followers");
  assert(alphas[0].isMonster.name === "Pack Alpha", "alpha is renamed as the den priority");
  assert(followers[0].isMonster.name === "Young Wolf", "followers keep their plain name");
  // The aura SOURCE (alpha) carries the display-only "Rally" buff indicator; the
  // pups, which only benefit when near it, do not.
  assert(
    !!getStatusEffect(alphas[0].tracksCombat!, PRE_ENCOUNTER_AURA_EFFECT_ID),
    "the alpha shows the aura (Rally) buff indicator",
  );
  assert(
    followers.every((f) => !getStatusEffect(f.tracksCombat!, PRE_ENCOUNTER_AURA_EFFECT_ID)),
    "pups carry no aura indicator (they only benefit while the alpha lives near)",
  );
}

// ── 2. Cleared den → clean boss start ───────────────────────────────────────
{
  const { world, playerId } = setupForest();
  const state = world.gauntlets.get(FOREST_NODE)!;
  for (const id of [...state.idleGuardianIds]) {
    onDungeonMonsterRewarded(world, playerId, world.getMonsterEntity(id)!);
    world.removeMonsterEntity(id);
  }
  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates after clearing the den");
  assert(state.unclearedThreatCount === 0, "no den left → zero uncleared threat");
  assert(state.preEncounterThreatIds.length === 0, "clean boss start: nothing joins");

  tickDungeonGauntlets(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "boss spawns after the awakening delay");
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  assert(boss.isMonster.monsterTypeId === "gnarled-greatbear", "the forest boss spawned");
  assert(state.requiredKillsForCurrentPhase === 1, "only the boss gates completion");
}

// ── 3. Uncleared den → joins the boss fight, then boss can be cleared ────────
{
  const { world, playerId } = setupForest();
  const state = world.gauntlets.get(FOREST_NODE)!;
  const denSize = state.idleGuardianIds.length;

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "altar activates with the den alive");
  assert(state.status === "bossAwakening", "uncleared forest dungeon goes to boss awakening (no waves)");
  assert(state.unclearedThreatCount === 1, "uncleared count tracks the surviving alpha, not every pup");
  assert(state.preEncounterThreatIds.length === denSize, "the whole surviving den joins the boss fight");

  tickDungeonGauntlets(world, Date.now() + 1_000_000);
  assert(state.status === "boss", "boss spawns alongside the joined den");
  assert(state.preEncounterThreatIds.length === denSize, "joined den persists through boss spawn");

  // Boss can still be cleared → cooldown.
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  const res = onDungeonMonsterRewarded(world, playerId, boss);
  assert(res.suppressBossRespawn, "gauntlet boss death suppresses the old respawn marker");
  assert(state.status === "cooldown", "boss death starts the altar cooldown");
}

// ── 4. Charged Maul telegraphs (cast bar) then lands a spike ─────────────────
{
  const world = new World();
  const node = "node-5-5";
  const playerId = "maul-target";
  // Beefy HP so the spike doesn't kill the player before we can assert it landed.
  world.attachPlayerEntity(
    makePlayerSlices(playerId, node, { x: 400, y: 400 }, 4000),
    playerId,
  );
  const player = world.getPlayerEntity(playerId)!;

  const boss = world.createMonster(node, "gnarled-greatbear", { x: 412, y: 400 })!;
  const t0 = 10_000;
  setAggroTarget(world, boss, { id: playerId, kind: "player" }, t0);
  setAttackTarget(world, boss, playerId);
  boss.hasAwareness.state = "attacking";

  const charged = MONSTER_DATABASE.get("gnarled-greatbear")!.chargedAttack!;
  const initialCd = charged.initialCooldownMs ?? charged.cooldownMs;

  // Tick once the charge is armed (past the initial cooldown AND the attack gap):
  // the boss should BEGIN the telegraphed cast (a cast bar, no damage yet).
  const beginAt = t0 + initialCd + 200;
  updateCombat(world, 100, beginAt);
  const beginEvents = world.takeNodeEvents(node);
  const castStart = beginEvents.find(
    (e) => e.kind === "monster-cast-start" && (e as { label?: string }).label === "Savage Maul",
  );
  assert(!!castStart, "the Maul opens a readable cast-bar telegraph");
  assert(player.hasHealth.hp === 4000, "no damage during the wind-up (telegraph window)");
  // Marked-prey beat: the mark is painted when the charge begins (Scent of Blood),
  // visible to the player throughout the readable wind-up.
  assert(
    !!getStatusEffect(player.tracksCombat!, SUN_MARK_EFFECT_ID),
    "the Maul marks the player (Scent of Blood) at cast-start",
  );

  // Tick again after the wind-up completes: the spike resolves.
  const resolveAt = beginAt + charged.castMs + 100;
  const hpBefore = player.hasHealth.hp;
  updateCombat(world, 100, resolveAt);
  const resolveEvents = world.takeNodeEvents(node);
  const castEnd = resolveEvents.find(
    (e) => e.kind === "monster-cast-end" && (e as { fired?: boolean }).fired === true,
  );
  assert(!!castEnd, "the Maul resolves (cast-end fired)");
  assert(player.hasHealth.hp < hpBefore, "the Maul lands a damage spike after the telegraph");
  // The pounce caught the marked prey → the mark is consumed when the Maul lands.
  assert(
    !getStatusEffect(player.tracksCombat!, SUN_MARK_EFFECT_ID),
    "the mark is consumed once the pounce lands",
  );
}

console.log("dungeonForest.test.ts: ok");
