// Jungle thicket = a BROADCAST, not a hiding place (Pass 2 locked decision 4).
//
// The bush used to conceal a dormant ambush pack seeded at pullRange 150 — below the
// entire jungle roster's 240–290 — so hidden mobs noticed the player LATER than one
// standing in the open, and the ambush read as dead in playtest. The spawner is gone;
// the detection multiplier is the whole mechanic now. This pins both halves.

import {
  GAME_CONFIG,
  BIOME_DATABASE,
  MONSTER_DATABASE,
  NODE_FEATURES,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  detectionMultForPoint,
  hazardAvoidanceShapesForMover,
  pointInNodeFeatureShape,
  removeStatusEffect,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { playerDetectionMult } from "../src/systems/world/mobility/mobilityBoots";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = "node-t2-jungle-01";

function makePlayerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, hpRegen: 0 },
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

/** Centre of the first thicket on the node — standing here IS being in a bush. */
function firstBushCentre(): { x: number; y: number } {
  const bush = (NODE_FEATURES[NODE] ?? []).find((f) => f.id.includes("bush"));
  if (!bush) throw new Error(`${NODE} has no bush feature`);
  return { x: bush.x, y: bush.y };
}

/** Somewhere on the node that is inside NO feature. */
function openGround(): { x: number; y: number } {
  for (let x = 100; x < 3100; x += 50) {
    for (let y = 100; y < 2300; y += 50) {
      if (detectionMultForPoint(NODE, { x, y }) === 1) return { x, y };
    }
  }
  throw new Error("no open ground on the node");
}

initCombatSystems();

// ── 1. The authored thickets carry the radius and no longer carry a spawner ──
{
  const jungleNodeIds = Object.keys(NODE_FEATURES).filter((id) => id.includes("jungle"));
  assert(jungleNodeIds.length > 0, "expected jungle nodes in NODE_FEATURES");

  let bushes = 0;
  for (const nodeId of jungleNodeIds) {
    for (const feature of NODE_FEATURES[nodeId] ?? []) {
      if (!feature.id.includes("bush")) continue;
      bushes++;
      assert(
        feature.spawns === undefined,
        `${nodeId}/${feature.id} still seeds a dormant ambush pack — decision 4 removes it`,
      );
      const mult = feature.detectionMultWhileInside;
      assert(
        typeof mult === "number" && mult > 1,
        `${nodeId}/${feature.id} should broadcast the player (detectionMult > 1), got ${mult}`,
      );
    }
  }
  // Every tier, not just T2 — the reported symptom was "maybe not applied to all tiers".
  for (const tier of ["t2", "t3", "t4"]) {
    assert(
      jungleNodeIds.some(
        (id) =>
          id.includes(tier) &&
          (NODE_FEATURES[id] ?? []).some(
            (f) => f.id.includes("bush") && (f.detectionMultWhileInside ?? 0) > 1,
          ),
      ),
      `no ${tier} jungle node carries a broadcasting thicket`,
    );
  }
  assert(bushes >= 18, `expected the jungle thickets to still exist (got ${bushes})`);
}

// ── 2. playerDetectionMult reads terrain, and caps the compound case ────────
{
  const world = new World();
  const open = openGround();
  const bush = firstBushCentre();
  const player = world.attachPlayerEntity(
    makePlayerSlices("detect-a", open.x, open.y),
    "detect-a",
  );

  assert(
    playerDetectionMult(player) === 1,
    "a player standing on open ground should not be broadcast",
  );

  player.hasPosition.current = { ...bush };
  assert(
    playerDetectionMult(player) === 2,
    `standing in a thicket should double detection (got ${playerDetectionMult(player)})`,
  );

  // Walking out clears it immediately — terrain-derived state cannot linger.
  player.hasPosition.current = { ...open };
  assert(
    playerDetectionMult(player) === 1,
    "leaving the thicket should stop broadcasting on the same tick",
  );

  // A pre-existing unrelated slow must not suppress the thicket. This is the exact
  // trap the status-data approach fell into: applyStatusEffect refreshes duration
  // but never replaces data, so a slow landing first would have won forever.
  applyStatusEffect(player.tracksCombat, {
    id: "slow",
    maxStacks: 1,
    remainingMs: 5_000,
    refreshable: true,
    sourceId: "some-other-slow",
    data: { speedMult: 0.5, totalMs: 5_000 },
  });
  player.hasPosition.current = { ...bush };
  assert(
    playerDetectionMult(player) === 2,
    "an unrelated slow applied first must not suppress the thicket's broadcast",
  );
  removeStatusEffect(player.tracksCombat, "slow");

  // Jungle aggro-pull boots top out at +0.80 => 1.8 alone, 3.6 compounded with a
  // thicket. The cap binds only on the compound case.
  player.hasPosition.current = { ...open };
  player.usesSkills.passives["mobility.aggro-pull-pct"] = 0.8;
  assert(
    Math.abs(playerDetectionMult(player) - 1.8) < 1e-9,
    `boots alone must be uncapped at 1.8 (got ${playerDetectionMult(player)})`,
  );
  player.hasPosition.current = { ...bush };
  assert(
    playerDetectionMult(player) === 3,
    `boots inside a thicket should clamp to the cap (got ${playerDetectionMult(player)})`,
  );

  // Cave stealth still counts against it — one field, two signs.
  player.usesSkills.passives["mobility.aggro-pull-pct"] = 0;
  player.usesSkills.passives["mobility.stealth-pct"] = 0.5;
  assert(
    Math.abs(playerDetectionMult(player) - 1) < 1e-9,
    `stealth should offset the thicket (got ${playerDetectionMult(player)})`,
  );
}

// ── 3. It actually changes who aggros: the whole point ──────────────────────
{
  const apePull = MONSTER_DATABASE.get("jungle-ape")?.stats.pullRange ?? 0;
  assert(apePull > 0, "jungle-ape should define a pullRange");
  // Sit the player outside the ape's normal reach but inside a doubled one.
  const gap = apePull + 60;
  assert(gap < apePull * 2, "test needs a gap that only a doubled radius can cross");

  // Put the player at a real thicket's centre and the ape `gap` px away, outside it.
  const bush = firstBushCentre();
  const open = openGround();

  function apeSeesPlayer(inBush: boolean): boolean {
    const world = new World();
    const spot = inBush ? bush : open;
    const player = world.attachPlayerEntity(
      makePlayerSlices("detect-b", spot.x, spot.y),
      "detect-b",
    );
    const ape = world.createMonster(NODE, "jungle-ape", { x: spot.x + gap, y: spot.y });
    assert(ape !== null, "test needs a jungle-ape");
    let now = 5_000;
    for (let i = 0; i < 12; i++) {
      now += 100;
      updateMonsters(world, 100, now);
    }
    return ape!.hasAggroTarget?.targetId === "detect-b";
  }

  assert(
    !apeSeesPlayer(false),
    `an ape should NOT notice a player ${gap}px away on open ground (pullRange ${apePull})`,
  );
  assert(
    apeSeesPlayer(true),
    `an ape SHOULD notice a player ${gap}px away once they stand in a thicket`,
  );
}

// ── 4. Jungle carries NO pack mechanics ─────────────────────────────────────
// The T3 silverback used to arrive flanked by two stalkers, which read in-game as
// the boss summoning adds. Jungle groups fights through TERRAIN now, not through
// monster coordination, so no jungle definition may declare a pack.
{
  const jungleMobs = [...MONSTER_DATABASE.values()].filter((m) => m.biome === "jungle");
  assert(jungleMobs.length > 0, "expected jungle monsters in the database");

  for (const mob of jungleMobs) {
    assert(
      mob.pack === undefined,
      `${mob.id} still declares a pack (${JSON.stringify(mob.pack)}) — jungle carries none`,
    );
  }

  // Removing the packs must not have removed the mobs: every one still has to be
  // reachable through its tier's normal spawn pool, or the biome quietly loses mobs.
  const jungle = BIOME_DATABASE.get("jungle");
  assert(!!jungle, "expected a jungle biome entry");
  const pooled = new Set(Object.values(jungle!.monsterPoolByTier ?? {}).flat());
  for (const id of ["jungle-snake", "jungle-stalker", "hunting-panther", "silverback"]) {
    assert(pooled.has(id), `${id} lost its only spawn route when its pack was removed`);
  }
}

// ── 5. `avoid-hazards` still routes around a thicket ────────────────────────
// A thicket is not a damage zone, so nothing in it announces itself to hazard
// avoidance except its `statusWhileInside`. The slow could look droppable in a
// later pass — dropping it would silently un-hazard the bush, and an autopathing
// player would walk straight through the one place that broadcasts them.
{
  const bush = firstBushCentre();
  const shapes = hazardAvoidanceShapesForMover(NODE, "player");
  assert(shapes.length > 0, "the jungle node must expose hazard shapes to avoid");
  assert(
    shapes.some((shape) => pointInNodeFeatureShape(bush, shape)),
    "a thicket must be returned by hazardAvoidanceShapesForMover so avoid-hazards routes around it",
  );

  // Monsters move through their own undergrowth freely — the slow is players-only,
  // so their avoidance set must not pick the thickets up.
  const monsterShapes = hazardAvoidanceShapesForMover(NODE, "monster");
  assert(
    !monsterShapes.some((shape) => pointInNodeFeatureShape(bush, shape)),
    "thickets must not be hazards for monsters — they live there",
  );
}

console.log("jungleBushDetection: ok");
