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
 * It also pins the shard-sourcing STOPGAP (design §18.6): a boss kill also drops
 * shards of each Lane-A packet of the lineages homed in its biome, deduplicated per
 * packet, because Bulwark and Barrier tempo have no T1 mob family at all and
 * Technique (design §22) has only one.
 *
 * And it pins §12's COVERAGE RULE — "every packet has >= 2 sources per tier, so no
 * shard has a single source" — counting the stopgap, computed from the pools and the
 * family table rather than asserted by hand.
 *
 * Deliberately NOT asserted: drop amounts. Those are one row in the magnitude
 * table; everything here is relative or structural.
 *
 * Run: node --conditions=development --import tsx test/lineageMaterials.test.ts
 */
import {
  BIOME_DATABASE,
  CAPSTONE_MATERIALS,
  FAMILY_BIOMES,
  FAMILY_DATABASE,
  GAME_CONFIG,
  LINEAGE_DATABASE,
  MONSTER_DATABASE,
  PACKET_IDS,
  WORLD_NODE_LIST,
  baseRecoveryForTier,
  biomeLaneAPackets,
  rowShardCost,
  blendEntries,
  emptyEquipment,
  familiesForBiome,
  familyForMonster,
  shardForMonster,
} from '@mmo-idle/shared';
import type { PacketId } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { grantMonsterRewards } from '../src/systems/player/progression/rewards';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: boolean, message: string): void => {
  if (!condition) problems.push(message);
};

// ─── The family table partitions each T1 biome's pool ────────────────────────

/**
 * Families allowed to drop the lane they punish. Design §24.4 moved the Brood's
 * `drops` to Tempo so the Cave's families are its weapon's lanes, and left
 * `punishes` (Tempo) unchanged on purpose — so the Brood now favours and punishes
 * one lane, which `server/bench/familyContracts.ts` reads as a degenerate one-lane
 * contract. A DESIGNER CALL, named here rather than waved through: the set is
 * checked both ways below, so it cannot outlive the collision nor hide a new one.
 */
const SAME_LANE_FAMILIES = new Set<string>(['cave-brood']);

const claimed = new Map<string, string>();
for (const family of FAMILY_DATABASE.values()) {
  check(FAMILY_BIOMES.includes(family.biome), `${family.id}: biome '${family.biome}' is not a family biome`);
  check(PACKET_IDS.includes(family.drops), `${family.id}: drops unknown packet '${family.drops}'`);
  check(PACKET_IDS.includes(family.punishes), `${family.id}: punishes unknown packet '${family.punishes}'`);
  check(
    (family.drops === family.punishes) === SAME_LANE_FAMILIES.has(family.id),
    SAME_LANE_FAMILIES.has(family.id)
      ? `${family.id}: no longer favours and punishes the same lane — drop it from SAME_LANE_FAMILIES`
      : `${family.id}: favours and punishes the same lane`,
  );
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

/**
 * Families with no blend yet. Empty as of W1-C (2026-10-01): Desert Stalker
 * is now named by `regionT3.ts`'s three-way Desert blends (its T2 gap is
 * described in `shared/src/data/families/index.ts`), and every T3/T4 family
 * authored in this same wave has a node. Kept as a named, typed set (rather
 * than deleted) so the next gap has somewhere to go.
 */
const UNSOURCED_FAMILIES = new Set<string>();

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
  if (UNSOURCED_FAMILIES.has(family.id)) {
    check(
      !namedByNodes.has(family.id),
      `${family.id}: now named by a node — remove it from UNSOURCED_FAMILIES`,
    );
    continue;
  }
  check(
    namedByNodes.has(family.id),
    `${family.id}: no node fields it, so its ${family.drops} shard has no source`,
  );
}
// Guard the guard: a join that reads no blends passes vacuously forever.
assert(
  namedByNodes.size === FAMILY_DATABASE.size - UNSOURCED_FAMILIES.size,
  `the blend join saw ${namedByNodes.size} families of ` +
    `${FAMILY_DATABASE.size - UNSOURCED_FAMILIES.size} expected (${FAMILY_DATABASE.size} total, ` +
    `${UNSOURCED_FAMILIES.size} unsourced)`,
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
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
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

// The boss drops its biome's capstone, every kill, plus the Phase 4
// shard-sourcing stopgap's Lane-A shards (design §17) — and nothing else.
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

  const forestLaneA = biomeLaneAPackets('forest');
  assert(forestLaneA.length > 0, 'fixture: Forest has lineages with a Lane A');
  assert(
    Object.keys(one.shards).length === forestLaneA.length,
    `a boss drops exactly its biome's Lane-A shards (${forestLaneA.join(', ')}), got ${Object.keys(one.shards).join(', ')}`,
  );
  for (const packet of forestLaneA) {
    assert((one.shards[packet] ?? 0) > 0, `a boss kill drops its biome's '${packet}' Lane-A shard`);
    assert(
      (three.shards[packet] ?? 0) === (one.shards[packet] ?? 0) * 3,
      `the Lane-A stopgap is deterministic too, for '${packet}'`,
    );
    // Design §18.6 prices the stopgap by what it BUYS: a boss-only lane reaches a
    // payoff card in two kills. Asserting "> 0" let the price drift away from its
    // own stated purpose, which is the whole reason it has a number.
    assert(
      (one.shards[packet] ?? 0) * 2 >= rowShardCost(1, 'payoff'),
      `two boss kills must cover a T1 payoff row's ${rowShardCost(1, 'payoff')} shards, `
        + `got ${(one.shards[packet] ?? 0)} per kill for '${packet}'`,
    );
  }
}

// The stopgap is deduplicated per packet, not per lineage that names it: a
// biome whose armor and mobility Lane A are the same packet (Plains' Kill
// chain) pays it once per boss kill, not twice.
{
  const plainsLaneA = biomeLaneAPackets('plains');
  assert(
    plainsLaneA.includes('kill-chain') && plainsLaneA.includes('bulwark'),
    `fixture: Plains' Lane A should include kill-chain and bulwark, got ${plainsLaneA.join(', ')}`,
  );
  // Design §22: the Broadsword's Lane A is Technique, and the stopgap pays every
  // lineage's Lane A — which is the Plains boss's half of Technique's two sources.
  assert(
    plainsLaneA.includes('technique'),
    `the Plains boss must pay Technique shards (design §18.6, §22), got ${plainsLaneA.join(', ')}`,
  );
  assert(
    new Set(plainsLaneA).size === plainsLaneA.length,
    'biomeLaneAPackets must already be deduplicated',
  );

  const boss = [...MONSTER_DATABASE.values()].find((m) => m.isBoss && m.biome === 'plains');
  assert(!!boss, 'fixture: a Plains boss');
  const one = farm('m-boss-plains', 'node-t1-plains-01', boss!.id, 1);
  assert(
    Object.keys(one.shards).length === plainsLaneA.length,
    `a Plains boss kill pays each Lane-A packet once, got ${Object.keys(one.shards).join(', ')}`,
  );
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

// ── Every packet has at least two T1 shard sources (design §12) ──────────────
//
// Computed from the tier-1 pools and the family table, plus the §18.6 boss
// stopgap, so neither half can quietly become the only source. A family whose mobs
// all live in a later tier's pool drops nothing at tier 1 however a blend names it,
// which is why this reads the POOL and not the blends.

const T1_BIOMES = ['plains', 'forest', 'mountain', 'cave', 'swamp'] as const;

{
  const fieldableAtT1 = new Set<string>(
    T1_BIOMES.flatMap((biome) => BIOME_DATABASE.get(biome)?.monsterPoolByTier[1] ?? []),
  );
  const sources = new Map<PacketId, string[]>(PACKET_IDS.map((p) => [p, []]));
  for (const family of FAMILY_DATABASE.values()) {
    if (!T1_BIOMES.includes(family.biome as typeof T1_BIOMES[number])) continue;
    if (!family.monsterIds.some((id) => fieldableAtT1.has(id))) continue;
    sources.get(family.drops)!.push(`${family.biome}/${family.name}`);
  }
  for (const biome of T1_BIOMES) {
    for (const packet of biomeLaneAPackets(biome)) sources.get(packet)!.push(`${biome} boss`);
  }
  for (const packet of PACKET_IDS) {
    const from = sources.get(packet)!;
    check(
      from.length >= 2,
      `coverage (design §12): '${packet}' has ${from.length} T1 source(s) — ${from.join(', ') || 'none'}`,
    );
  }

  // The ninth packet specifically (design §22), because it is the thin one: the
  // Plains Swarm's trash plus the Plains boss's Lane-A stopgap, and nothing else.
  // If either half moves, Technique drops to one source and this says so by name.
  const technique = sources.get('technique')!;
  check(
    technique.includes('plains/Swarm') && technique.includes('plains boss'),
    `Technique's two T1 sources are the Plains Swarm and the Plains boss, got ${technique.join(', ')}`,
  );

  // Design §24.4's own count of FAMILY sources after its four moves, stopgap
  // excluded: "empowered 3, kill-chain 3, tempo 2, engagement 2, affliction 2,
  // control 2, technique 1 (+ the Plains boss stopgap)". Pinned exactly, so a
  // family edit that silently re-balances the T1 shard sources has to say so here.
  const SECTION_24_4_FAMILY_SOURCES: Partial<Record<PacketId, number>> = {
    empowered: 3, 'kill-chain': 3, tempo: 2, engagement: 2, affliction: 2, control: 2, technique: 1,
  };
  for (const [packet, expected] of Object.entries(SECTION_24_4_FAMILY_SOURCES) as [PacketId, number][]) {
    const families = sources.get(packet)!.filter((source) => !source.endsWith(' boss'));
    check(
      families.length === expected,
      `design §24.4: '${packet}' should have ${expected} T1 family source(s), got ${families.length} (${families.join(', ')})`,
    );
  }
}

// ── A T1 biome's three families are its weapon's three lanes (design §24.4) ───
//
// "Stay in the Forest to build Forest gear" is only coherent without a lookup if
// the shards a biome's territory pays are exactly the lanes its weapon's tree
// costs. One weapon lineage per T1 biome (design §2), three families per biome.

{
  const weapons = [...LINEAGE_DATABASE.values()].filter((l) => l.slot === 'weapon');
  for (const biome of T1_BIOMES) {
    const weapon = weapons.filter((l) => l.homeBiome === biome);
    check(weapon.length === 1, `${biome}: expected one weapon lineage, got ${weapon.length}`);
    if (weapon.length !== 1) continue;
    const lanes = [...weapon[0].lanes].sort();
    const drops = familiesForBiome(biome).map((f) => f.drops).sort();
    check(
      JSON.stringify(drops) === JSON.stringify(lanes),
      `design §24.4: ${biome}'s families drop ${drops.join('/')}, but the ${weapon[0].id}'s lanes are ${lanes.join('/')}`,
    );
  }
}

// ── Plains' three families partition the biome and pay three DIFFERENT shards ──
//
// Design §22 moved the Swarm from Tempo to Technique. The partition is what makes
// a kill pay at all, and three distinct shards is what makes a Plains node's blend
// worth reading.

{
  const plains = [...FAMILY_DATABASE.values()].filter((f) => f.biome === 'plains');
  check(plains.length === 3, `Plains fields three families, got ${plains.length}`);
  const drops = plains.map((f) => f.drops);
  check(
    new Set(drops).size === drops.length,
    `two Plains families must not drop the same shard, got ${drops.join('/')}`,
  );
  const swarm = plains.find((f) => f.name === 'Swarm');
  check(!!swarm, 'Plains fields a Swarm');
  check(
    swarm?.drops === 'technique',
    `the Swarm drops the Technique shard (design §22), got ${swarm?.drops}`,
  );
  // Each of its mobs is in exactly one family, and it is this one.
  for (const id of swarm?.monsterIds ?? []) {
    check(
      familyForMonster(id)?.id === swarm?.id,
      `${id} must belong to the Swarm and nothing else`,
    );
  }
  // And a Swarm kill really pays Technique shards through the live reward seam.
  const kill = farm('m-swarm', 'node-t1-plains-01', swarm!.monsterIds[0]!, 1);
  check((kill.shards.technique ?? 0) > 0, 'a Swarm kill pays Technique shards');
  check(
    Object.keys(kill.shards).length === 1,
    `and only its own family's shard, got ${Object.keys(kill.shards).join(', ')}`,
  );
}

// The `check` collector is drained once above for the authoring pass; the two
// blocks since then use it too, so drain it again rather than letting a coverage
// gap be collected and never read.
assert(problems.length === 0, `shard coverage / family failures:\n  ${problems.join('\n  ')}`);

console.log('lineageMaterials.test.ts: ok');
