/**
 * A tier-up must rebuild the player's stats on the kill that causes it.
 *
 * `playerTier` is a STAT INPUT, not just a progression counter. `recalculatePlayerStats`
 * reads it three times — `baseRecoveryForTier`, `poolFactorForTier`, and the T4 path
 * on-hit scaling — so bumping it without a recalc left the player on the previous
 * tier's numbers (6.5 HP/s instead of 10 on T1->T2, and the previous tier's pool
 * factor) until some unrelated recalc happened to fire: equipping something, swapping
 * a stance, a relog. A player who tiered up and kept fighting carried the old rate for
 * as long as they touched nothing.
 *
 * The rebuild is the state-PRESERVING one, because a tier-up lands on a kill and
 * therefore mid-combat: the class mechanic's counters, resources and cooldowns must
 * survive it, and HP must carry across as a share of a pool that just grew rather
 * than being healed to full or chopped.
 *
 * Run: node --conditions=development --import tsx test/tierUpRecalc.test.ts
 */
import {
  DUNGEON_DEFS,
  GAME_CONFIG,
  baseRecoveryForTier,
  bossClearKey,
  bossSealSourcesAtTier,
  emptyEquipment,
  poolFactorForTier,
  sealsRequiredForTier,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { grantMonsterRewards } from '../src/systems/player/progression/rewards';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayer(id: string, playerTier: number, bossesCleared: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(playerTier),
    },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier, currentSkillTier: 0, bossesCleared, clearedNodes: [],
      runesOwned: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

// The tier-1 seal gate, read off the data rather than restated: hold every seal but
// the last one, then clear the boss that mints it.
const required = sealsRequiredForTier(1);
assert(required > 1, `fixture: tier 1 should need more than one seal, needs ${required}`);
const sources = bossSealSourcesAtTier(1);
const held = sources.slice(0, required - 1).map((group) => bossClearKey(group, 1));
const lastGroup = sources[required - 1]!;

const world = new World();
const player = world.attachPlayerEntity(makePlayer('tier-up', 1, [...held]), 'tier-up');

// The baseline the bug produced: tier-1 numbers.
const beforeRecovery = player.hasHealth.recovery;
const beforeMaxHp = player.hasHealth.maxHp;
assert(
  beforeRecovery === baseRecoveryForTier(1),
  `fixture: a tier-1 player should start at ${baseRecoveryForTier(1)} HP/s, got ${beforeRecovery}`,
);

// Clear the last seal's boss. `grantMonsterRewards` records the clear and then
// advances the tier on that same kill.
// The biome's authored boss and its own node, read off `DUNGEON_DEFS` so a boss
// rename cannot silently turn this into a normal-monster kill.
const dungeon = [...DUNGEON_DEFS.values()].find((d) => d.biomeTier === 1 && d.biomeGroup === lastGroup);
assert(!!dungeon, `fixture: no tier-1 dungeon for ${lastGroup}`);
const boss = world.createMonster(dungeon!.nodeId, dungeon!.boss.bossId, { x: 800, y: 800 });
assert(!!boss, `fixture: could not spawn ${dungeon!.boss.bossId} in ${dungeon!.nodeId}`);
assert(boss!.isMonster.isBoss === true, 'fixture: the kill must be a boss kill to mint a seal');

grantMonsterRewards(world, 'tier-up', boss!);

assert(
  player.tracksProgression.playerTier === 2,
  `the seal should have advanced the player to tier 2, got ${player.tracksProgression.playerTier}`,
);

// 1. Base Recovery is the new tier's, immediately — this is the finding.
assert(
  player.hasHealth.recovery === baseRecoveryForTier(2),
  `after tier-up Recovery should be ${baseRecoveryForTier(2)} HP/s, got ${player.hasHealth.recovery} ` +
    `(tier 1 was ${baseRecoveryForTier(1)})`,
);

// 2. The pool factor is the new tier's too, since it reads `playerTier` as well.
const expectedMaxHp = Math.round(GAME_CONFIG.PLAYER_MAX_HP * poolFactorForTier(2));
assert(
  player.hasHealth.maxHp === expectedMaxHp,
  `after tier-up max HP should be the tier-2 pool ${expectedMaxHp}, got ${player.hasHealth.maxHp}`,
);
assert(
  expectedMaxHp !== beforeMaxHp,
  `fixture: the tier-2 pool factor must differ from tier 1's, or this assertion proves nothing`,
);

// 3. HP carried across as a SHARE of the pool, not healed to full and not left flat.
// The player was at full, so full is the correct answer — what matters is that the
// rebuild did not chop HP to the old pool's value.
assert(
  player.hasHealth.hp === player.hasHealth.maxHp,
  `a player at full HP must still be at full after the pool grows, got ${player.hasHealth.hp}/${player.hasHealth.maxHp}`,
);

console.log('tierUpRecalc.test.ts: ok');
