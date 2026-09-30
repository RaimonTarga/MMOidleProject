/**
 * Shards and capstones: the kill side of the lineage economy (Phase 1b).
 *
 * WHY THIS EXISTS: drops are DETERMINISTIC by design — "every kill drops its
 * family's shard; the boss drops its capstone material every kill. No rolls, no
 * pity timers. Costs, not chance, gate the pace" (design §1). Determinism is
 * exactly the kind of property that rots quietly, so this pins it directly:
 * N kills is N times one kill, the shard is the family's and not the biome's,
 * and a boss pays a capstone rather than a shard.
 *
 * It also pins the FAMILY PARTITION, which is the invariant that makes the whole
 * thing work: a non-boss monster of a T1 biome that belongs to no family is a
 * kill that silently pays nothing.
 *
 * Deliberately NOT asserted: drop amounts. Those are one row in the magnitude
 * table; everything here is relative or structural.
 *
 * Run: node --conditions=development --import tsx test/lineageMaterials.test.ts
 */
import {
  CAPSTONE_MATERIALS,
  FAMILY_BIOMES,
  FAMILY_DATABASE,
  GAME_CONFIG,
  MONSTER_DATABASE,
  PACKET_IDS,
  WORLD_NODE_LIST,
  baseRecoveryForTier,
  blendEntries,
  emptyEquipment,
  familyForMonster,
  shardForMonster,
} from '@mmo-idle/shared';
import type { PacketId, PersistedPlayerSlices } from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { grantMonsterRewards } from '../src/systems/player/progression/rewards';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: boolean, message: string): void => {
  if (!condition) problems.push(message);
};

// ─── The family table partitions each T1 biome's pool ────────────────────────

const claimed = new Map<string, string>();
for (const family of FAMILY_DATABASE.values()) {
  check(FAMILY_BIOMES.includes(family.biome), `${family.id}: biome '${family.biome}' is not a family biome`);
  check(PACKET_IDS.includes(family.drops), `${family.id}: drops unknown packet '${family.drops}'`);
  check(PACKET_IDS.includes(family.punishes), `${family.id}: punishes unknown packet '${family.punishes}'`);
  check(family.drops !== family.punishes, `${family.id}: favours and punishes the same lane`);
  check(family.monsterIds.length > 0, `${family.id}: has no monsters`);

  for (const id of family.monsterIds) {
    const monster = MONSTER_DATABASE.get(id);
    check(!!monster, `${family.id}: '${id}' is not a monster`);
    check(monster?.isBoss !== true, `${family.id}: '${id}' is a boss — bosses drop capstones, not shards`);
    check(
      monster === undefined || monster.biome === family.biome,
      `${family.id}: '${id}' lives in ${monster?.biome}, not ${family.biome}`,
    );
    const owner = claimed.get(id);
    check(owner === undefined, `'${id}' is in two families (${owner} and ${family.id})`);
    claimed.set(id, family.id);
  }
}

// Every non-boss monster of a family biome must belong to a family. A mob left
// out is a kill that pays nothing, and nothing in the game would say so.
let swept = 0;
for (const [id, monster] of MONSTER_DATABASE) {
  if (monster.isBoss) continue;
  if (!FAMILY_BIOMES.includes(monster.biome ?? '')) continue;
  swept++;
  check(claimed.has(id), `'${id}' (${monster.biome}) is in no family, so killing it pays no shard`);
}
// Guard the guard: a sweep that finds no monsters passes vacuously forever.
assert(swept === claimed.size, `the partition sweep saw ${swept} monsters but the table claims ${claimed.size}`);

// ─── The map and the family table name the same families ─────────────────────
//
// A node blend is a set of keys into this table (Phase 2a). A key that does not
// resolve is a node that spawns nothing from a family, and a family no node names
// is a shard with no place to farm it -- both silent. `variantBlend.test.ts` owns
// the shares and the spawn cycle; this owns the join.

const namedByNodes = new Set<string>();
for (const node of WORLD_NODE_LIST) {
  if (!node.blend) continue;
  check(node.kind === 'normal', `${node.id}: only normal nodes carry a blend`);
  for (const entry of blendEntries(node.blend)) {
    const family = FAMILY_DATABASE.get(entry.family);
    check(!!family, `${node.id}: blend names unknown family '${entry.family}'`);
    check(
      family === undefined || family.biome === node.biomeGroup,
      `${node.id}: blend names '${entry.family}', a ${family?.biome} family`,
    );
    namedByNodes.add(entry.family);
  }
}
for (const family of FAMILY_DATABASE.values()) {
  check(
    namedByNodes.has(family.id),
    `${family.id}: no node fields it, so its ${family.drops} shard has no source`,
  );
}
// Guard the guard: a join that reads no blends passes vacuously forever.
assert(
  namedByNodes.size === FAMILY_DATABASE.size,
  `the blend join saw ${namedByNodes.size} families of ${FAMILY_DATABASE.size}`,
);

// Every biome that a lineage gates a form behind needs a capstone material, and
// the boss it names has to be that biome's.
for (const material of CAPSTONE_MATERIALS.values()) {
  const boss = MONSTER_DATABASE.get(material.bossMonsterId);
  check(!!boss, `capstone '${material.name}': boss '${material.bossMonsterId}' does not exist`);
  check(boss?.isBoss === true, `capstone '${material.name}': '${material.bossMonsterId}' is not a boss`);
  check(boss?.biome === material.biome, `capstone '${material.name}': its boss is not in ${material.biome}`);
}

assert(problems.length === 0, `family/capstone authoring failures:\n  ${problems.join('\n  ')}`);

// Guard the guard.
assert(FAMILY_DATABASE.size >= 15, `family table has only ${FAMILY_DATABASE.size} entries — it is broken`);
assert(claimed.size > 20, `family table claims only ${claimed.size} monsters — it is broken`);

// ─── Drops are deterministic ─────────────────────────────────────────────────

function makePlayer(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

/** Farm `kills` of one monster type in one node and return the wallets. */
function farm(id: string, nodeId: string, monsterTypeId: string, kills: number) {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayer(id), id);
  const monster = world.createMonster(nodeId, monsterTypeId, { x: 800, y: 800 });
  assert(!!monster, `fixture: could not spawn ${monsterTypeId} in ${nodeId}`);
  for (let i = 0; i < kills; i++) grantMonsterRewards(world, id, monster!);
  return {
    shards: { ...player.tracksProgression.shards },
    capstones: { ...player.tracksProgression.capstones },
  };
}

// A Forest wolf is Pack, and Pack drops Tempo.
{
  const wolfShard = shardForMonster('wolf');
  assert(wolfShard === 'tempo', `fixture: the Pack should drop tempo, got ${wolfShard}`);

  const one = farm('m-one', 'node-t1-forest-01', 'wolf', 1);
  const ten = farm('m-ten', 'node-t1-forest-01', 'wolf', 10);

  assert((one.shards.tempo ?? 0) > 0, 'a kill in a family must drop its shard');
  assert(
    (ten.shards.tempo ?? 0) === (one.shards.tempo ?? 0) * 10,
    'drops are deterministic: ten kills is exactly ten times one',
  );
  assert(
    Object.keys(one.shards).length === 1,
    `a kill drops exactly its own family's shard, got ${Object.keys(one.shards).join()}`,
  );
  assert(Object.keys(one.capstones).length === 0, 'a normal kill drops no capstone');
}

// Two families in the same biome drop DIFFERENT shards — the whole point of
// keying materials by packet rather than by biome.
{
  const pack = shardForMonster('wolf');
  const grove = shardForMonster('ironwood-golem');
  assert(pack !== grove, 'two Forest families must not drop the same shard');
  const golem = farm('m-golem', 'node-t1-forest-01', 'ironwood-golem', 1);
  assert((golem.shards[grove as PacketId] ?? 0) > 0, 'the Grove drops its own shard');
  assert((golem.shards[pack as PacketId] ?? 0) === 0, 'and not the Pack\'s');
}

// The boss drops its biome's capstone, every kill, and no shard.
{
  const boss = [...MONSTER_DATABASE.values()].find((m) => m.isBoss && m.biome === 'forest');
  assert(!!boss, 'fixture: a Forest boss');
  assert(!familyForMonster(boss!.id), 'a boss belongs to no family');

  const one = farm('m-boss1', 'node-t1-forest-01', boss!.id, 1);
  const three = farm('m-boss3', 'node-t1-forest-01', boss!.id, 3);
  assert((one.capstones.forest ?? 0) > 0, 'a boss kill drops its biome capstone');
  assert(
    (three.capstones.forest ?? 0) === (one.capstones.forest ?? 0) * 3,
    'capstones are deterministic too — no pity timer',
  );
  assert(Object.keys(one.shards).length === 0, 'a boss drops a capstone, not a shard');
}

// A monster outside the family biomes pays no shard and does not crash. This is
// the Phase 1 footprint: Phase 2 authors the rest of the families.
{
  const outsider = [...MONSTER_DATABASE.values()].find(
    (m) => !m.isBoss && m.biome && !FAMILY_BIOMES.includes(m.biome),
  );
  assert(!!outsider, 'fixture: a monster outside the T1 biomes');
  assert(!shardForMonster(outsider!.id), 'it is in no family');
}

// The dev reward multiplier reaches shards, like it reaches every other payout.
{
  const world = new World();
  world.rewardMultiplier = 10;
  const player = world.attachPlayerEntity(makePlayer('m-mult'), 'm-mult');
  const wolf = world.createMonster('node-t1-forest-01', 'wolf', { x: 800, y: 800 })!;
  grantMonsterRewards(world, 'm-mult', wolf);
  const boosted = player.tracksProgression.shards.tempo ?? 0;
  const base = farm('m-base', 'node-t1-forest-01', 'wolf', 1).shards.tempo ?? 0;
  assert(boosted > base, `the dev multiplier must reach shards (${boosted} vs ${base})`);
}

console.log('lineageMaterials.test.ts: ok');
