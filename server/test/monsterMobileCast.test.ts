// MOBILE MONSTER CASTS — a targeted, non-area wind-up chases its victim.
//
// Before this contract existed, any cast whose payload followed a player was
// unusable against a moving one: the caster planted itself, the player walked,
// the range check broke the wind-up, and because an abort pays no cooldown the
// monster instantly re-armed — an endless cast bar that never once resolved.
//
// What is pinned here:
//   1. a targeted, non-area charged attack SURVIVES the target stepping out of
//      reach: no cast-end, and the monster chases with the bar still up;
//   2. it LANDS on the victim it captured, wherever the chase took the pair. Reach
//      gates the start of the cast and is never re-tested — a melee caster's reach
//      is ~15px and the player it chases is by definition ahead of it, so a second
//      reach test left the beat exactly as unlandable as standing still did;
//   3. the same rule covers the generic `monsterAbilities` path;
//   4. the interrupt is still the counterplay: a stun mid-wind-up kills it;
//   5. planted and self-facing casts are UNCHANGED: a committed `aoe` slam and a
//      self-target ability both still stand still.

import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { applyStun } from "../src/systems/combat/status/stun";
import {
  chargedCastEndsAt,
  hasMobileMonsterCast,
  monsterAbilityCastEndsAt,
} from "../src/systems/combat/engine/monsterMechanics";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = "node-5-5";
const FAR = 2_000; // well outside any melee reach in this file

function makePlayerSlices(id: string, x: number, y: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
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
      attunedAbilities: { technique: null, guard: null },
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

initCombatSystems();

/**
 * Spawn `typeId` in contact with a fresh player and run the clock to the tick its
 * cast is armed. Both cast engines key their first cooldown off the aggro-session
 * timestamp, so the session has to be older than `initialCooldownMs` before the
 * monster will wind up at its next attack opportunity.
 */
function armedCaster(typeId: string, initialCooldownMs: number) {
  const world = new World();
  const playerId = `${typeId}-target`;
  const player = world.attachPlayerEntity(makePlayerSlices(playerId, 405, 400), playerId);
  const monster = world.createMonster(NODE, typeId, { x: 400, y: 400 });
  assert(monster !== null, `test needs ${typeId}; it is not in the database`);
  const t0 = 1_000;
  setAggroTarget(world, monster!, { id: playerId, kind: "player" }, t0);
  monster!.hasAwareness.state = "attacking";
  const armedAt = t0 + initialCooldownMs + 1_000;
  monster!.performsAttack.lastAttackAt = armedAt - monster!.performsAttack.attackCooldown;
  return { world, player, monster: monster!, armedAt };
}

function castEvents(world: World) {
  return world
    .takeNodeEvents(NODE)
    .filter(e => e.kind === "monster-cast-start" || e.kind === "monster-cast-end");
}

// ── 1. A targeted charged attack chases instead of breaking, then LANDS ──────
{
  const STING = MONSTER_DATABASE.get("sand-scorpion")?.chargedAttack;
  assert(!!STING, "sand-scorpion should define a chargedAttack");
  assert(!STING!.aoe, "Numbing Sting must stay a targeted, non-area cast");

  const { world, player, monster, armedAt } = armedCaster(
    "sand-scorpion",
    STING!.initialCooldownMs ?? STING!.cooldownMs,
  );

  updateCombat(world, 100, armedAt);
  const started = castEvents(world);
  assert(
    started.length === 1 && started[0].kind === "monster-cast-start",
    "the scorpion should open exactly one cast bar when its sting is armed",
  );
  assert(hasMobileMonsterCast(monster), "an unplanted targeted charge is a mobile cast");

  // The player kites out of reach mid-wind-up. This used to cancel the cast on the
  // very next tick, through BOTH the "chasing" state gate and the range check.
  player.hasPosition.current = { x: 400 + FAR, y: 400 };
  updateMonsters(world, 100, armedAt + 100);
  updateCombat(world, 100, armedAt + 100);
  assert(castEvents(world).length === 0, "walking out of reach must not cancel a mobile cast");
  assert(chargedCastEndsAt(monster) > 0, "the wind-up should still be pending");
  assert(
    monster.hasAwareness.state === "chasing",
    "the caster should CHASE during a mobile cast rather than stand still",
  );

  // ...and it LANDS on the victim it committed to. This is the half the first pass
  // got wrong: gating resolution on reach reproduced the original bug exactly,
  // because a chasing melee caster is never within 12px of the player it chases.
  const hpBefore = player.hasHealth.hp;
  const resolvesAt = armedAt + STING!.castMs;
  updateMonsters(world, 100, resolvesAt);
  updateCombat(world, 100, resolvesAt);
  const ended = castEvents(world);
  assert(
    ended.length === 1 && ended[0].kind === "monster-cast-end" && ended[0].fired === true,
    "a mobile cast should FIRE on the victim it captured, not fizzle",
  );
  assert(
    player.hasHealth.hp < hpBefore,
    "the sting must actually damage the player it chased",
  );
  assert(chargedCastEndsAt(monster) === 0, "the resolved cast should be consumed");
}

// ── 1b. The whole point: it lands on a player who is ACTUALLY kiting ──────────
//
// The assertions above teleport the target. This one walks it away at real player
// speed for the whole wind-up, which is the case that was still broken after the
// first pass — the scorpion moves at 30 and the player at 120, so no amount of
// chasing closes a 12px reach gap before the cast completes.
{
  const STING = MONSTER_DATABASE.get("sand-scorpion")!.chargedAttack!;
  const { world, player, armedAt } = armedCaster(
    "sand-scorpion",
    STING.initialCooldownMs ?? STING.cooldownMs,
  );

  updateCombat(world, 100, armedAt);
  world.takeNodeEvents(NODE);

  const hpBefore = player.hasHealth.hp;
  const stepPx = (GAME_CONFIG.PLAYER_SPEED * 100) / 1000; // one 100ms tick of running
  for (let t = armedAt + 100; t <= armedAt + STING.castMs; t += 100) {
    player.hasPosition.current = {
      x: player.hasPosition.current.x + stepPx,
      y: player.hasPosition.current.y,
    };
    updateMonsters(world, 100, t);
    updateCombat(world, 100, t);
  }

  assert(
    castEvents(world).some(e => e.kind === "monster-cast-end" && e.fired === true),
    "a cast should still land on a player kiting at full speed",
  );
  assert(player.hasHealth.hp < hpBefore, "the kited-through sting must deal damage");
}

// ── 1c. The interrupt is the counterplay, and it still works ─────────────────
{
  const STING = MONSTER_DATABASE.get("sand-scorpion")!.chargedAttack!;
  const { world, player, monster, armedAt } = armedCaster(
    "sand-scorpion",
    STING.initialCooldownMs ?? STING.cooldownMs,
  );

  updateCombat(world, 100, armedAt);
  world.takeNodeEvents(NODE);

  applyStun(monster.tracksCombat, 1_000, player.isPlayer.id, 1);
  updateMonsters(world, 100, armedAt + 100);
  updateCombat(world, 100, armedAt + 100);
  const ended = castEvents(world);
  assert(
    ended.some(e => e.kind === "monster-cast-end" && e.fired === false),
    "a stun mid-wind-up should still interrupt a mobile cast",
  );
  assert(chargedCastEndsAt(monster) === 0, "the interrupted cast should be dropped");

  const hpBefore = player.hasHealth.hp;
  updateMonsters(world, 100, armedAt + STING.castMs);
  updateCombat(world, 100, armedAt + STING.castMs);
  assert(
    player.hasHealth.hp === hpBefore,
    "an interrupted cast must never land its payload",
  );
}

// ── 2. The same cast still LANDS on a target that stayed in reach ─────────────
{
  const STING = MONSTER_DATABASE.get("sand-scorpion")!.chargedAttack!;
  const { world, player, armedAt } = armedCaster(
    "sand-scorpion",
    STING.initialCooldownMs ?? STING.cooldownMs,
  );

  updateCombat(world, 100, armedAt);
  world.takeNodeEvents(NODE);

  const hpBefore = player.hasHealth.hp;
  const resolvesAt = armedAt + STING.castMs;
  updateMonsters(world, 100, resolvesAt);
  updateCombat(world, 100, resolvesAt);
  assert(
    castEvents(world).some(e => e.kind === "monster-cast-end" && e.fired === true),
    "a cast that kept contact should still fire",
  );
  assert(player.hasHealth.hp < hpBefore, "a fired sting should damage its target");
}

// ── 3. The generic ability path follows the same contract ────────────────────
//
// Exemplar moved off the Rime-Tusk Mastodon (Tundra ecology polish, 2026-09-11):
// its Frost-Tusk Impact is now a PLANTED `area-hit` circle, which is the committed
// half of this contract and is covered in §4 / biomeEcologyPolish. The Obsidian
// Tortoise's Molten Eruption is the same shape the Mastodon used to be — a
// player-targeted, non-area ability — so the mobile-cast contract keeps a live
// subject.
{
  const ABILITY = MONSTER_DATABASE.get("obsidian-tortoise")?.monsterAbilities?.[0];
  assert(!!ABILITY, "obsidian-tortoise should define a monster ability");
  assert(ABILITY!.target === "player", "Molten Eruption should be player-targeted");
  assert(
    ABILITY!.actions.every(a => a.type !== "area-hit"),
    "the mobile-cast exemplar must be a NON-area ability",
  );

  const { world, player, monster, armedAt } = armedCaster(
    "obsidian-tortoise",
    ABILITY!.initialCooldownMs ?? ABILITY!.cooldownMs,
  );

  updateCombat(world, 100, armedAt);
  assert(
    castEvents(world).some(e => e.kind === "monster-cast-start"),
    "the tortoise should open its Molten Eruption",
  );
  assert(hasMobileMonsterCast(monster), "a targeted, non-area ability is a mobile cast");

  player.hasPosition.current = { x: 400 + FAR, y: 400 };
  updateMonsters(world, 100, armedAt + 100);
  updateCombat(world, 100, armedAt + 100);
  assert(
    castEvents(world).length === 0,
    "walking out of reach must not cancel a mobile ability cast",
  );
  assert(monsterAbilityCastEndsAt(monster) > 0, "the ability wind-up should still be pending");
  assert(
    monster.hasAwareness.state === "chasing",
    "an ability caster should chase rather than plant itself",
  );

  const hpBefore = player.hasHealth.hp;
  const resolvesAt = armedAt + ABILITY!.castMs;
  updateMonsters(world, 100, resolvesAt);
  updateCombat(world, 100, resolvesAt);
  const ended = castEvents(world);
  assert(
    ended.length === 1 && ended[0].kind === "monster-cast-end" && ended[0].fired === true,
    "an ability cast should fire on the victim it chased",
  );
  assert(player.hasHealth.hp < hpBefore, "the chased impact must land");
  assert(monsterAbilityCastEndsAt(monster) === 0, "the resolved ability should be consumed");
}

// ── 4. Planted and self-facing casts keep the stand-still contract ────────────
{
  // A committed `aoe` slam is NOT mobile: the circle is the counterplay.
  const SLAM = MONSTER_DATABASE.get("cave-brute")!.chargedAttack!;
  assert(!!SLAM.aoe, "the cave-brute charge should still carry its aoe rider");
  const brute = armedCaster("cave-brute", SLAM.initialCooldownMs ?? SLAM.cooldownMs);
  updateCombat(brute.world, 100, brute.armedAt);
  assert(chargedCastEndsAt(brute.monster) > 0, "the brute should be winding up");
  assert(
    !hasMobileMonsterCast(brute.monster),
    "a planted ground slam must never become a mobile cast",
  );
  brute.player.hasPosition.current = { x: 400 + FAR, y: 400 };
  updateMonsters(brute.world, 100, brute.armedAt + 100);
  assert(
    brute.monster.hasAwareness.state === "attacking" && !brute.monster.isMoving,
    "the brute should stay committed to its planted circle",
  );

  // A self-target ability is NOT mobile either — the Magma Salamander's shell.
  const SHELL = MONSTER_DATABASE.get("magma-salamander")!.monsterAbilities![0];
  assert(SHELL.target === "self", "Obsidian Shell should be self-targeted");
  const magma = armedCaster("magma-salamander", SHELL.initialCooldownMs ?? SHELL.cooldownMs);
  updateCombat(magma.world, 100, magma.armedAt);
  assert(monsterAbilityCastEndsAt(magma.monster) > 0, "the salamander should be winding up");
  assert(
    !hasMobileMonsterCast(magma.monster),
    "a self-facing cast must keep the stand-still contract",
  );
  magma.player.hasPosition.current = { x: 400 + FAR, y: 400 };
  updateMonsters(magma.world, 100, magma.armedAt + 100);
  assert(
    magma.monster.hasAwareness.state === "attacking" && !magma.monster.isMoving,
    "a self-casting monster should plant itself for the wind-up",
  );
}

console.log("monsterMobileCast: ok");
