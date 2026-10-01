/**
 * Node blends: what a node is made of, and whether it spawns what it says.
 *
 * WHY THIS EXISTS: a blend is the one piece of node authoring a player is meant to
 * read off the map ("this is a Herd node, Herd drops Empowered shards"), so the
 * failure mode is silent — a node that advertises one family and fields another
 * looks fine and teaches the player the wrong thing. Two things are pinned:
 *
 *  1. Every T1 normal node's shares sum to 1 and name only families of its own
 *     biome. (Node COUNT is pinned by `validateWorldMap`, which this also runs.)
 *  2. Spawning cycles the blend instead of rolling it, so the composition is a
 *     fact about ten spawns rather than a hope about a thousand.
 *
 * Quantization, deliberately: the cycle is `BLEND_SPAWN_SLOTS` long, so a share
 * is met to the nearest 1/10 and no closer. That is the point — a player can see
 * 7-2-1 in one visit, where a roll needs hundreds of kills to become legible. The
 * "within one mob" assertions below are therefore per cycle, with the 30-spawn
 * run asserted to be exactly three identical cycles rather than a drifting sample.
 *
 * Deliberately NOT asserted: which families a biome has, or their shards —
 * `lineageMaterials.test.ts` owns the family table.
 *
 * Run: node --conditions=development --import tsx test/variantBlend.test.ts
 */
import {
  BLEND_SPAWN_SLOTS,
  FAMILY_DATABASE,
  NODE_BLENDS,
  WORLD_NODE_LIST,
  blendEntries,
  blendShareTotal,
  blendSpawnCycle,
  blendSpawnPick,
  familiesForBiome,
  familyForMonster,
  nodeSpawnBlend,
  validateWorldMap,
} from '@mmo-idle/shared';
import type { FamilyId, NodeBlend } from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { resetBlendCursors, spawnMonster } from '../src/systems/world/spawning';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: unknown, message: string): void => {
  if (!condition) problems.push(message);
};

function countFamilies(families: readonly FamilyId[]): Map<FamilyId, number> {
  const counts = new Map<FamilyId, number>();
  for (const family of families) counts.set(family, (counts.get(family) ?? 0) + 1);
  return counts;
}

// ─── Authoring: shares sum to 1, families belong to the biome ─────────────────

const t1Normals = WORLD_NODE_LIST.filter(
  (node) => node.kind === 'normal' && node.biomeTier === 1,
);
assert(t1Normals.length === 27, `fixture: expected 27 T1 normal nodes, found ${t1Normals.length}`);

const countByBiome = new Map<string, number>();
for (const node of t1Normals) {
  countByBiome.set(node.biomeGroup, (countByBiome.get(node.biomeGroup) ?? 0) + 1);

  const blend = node.blend;
  check(!!blend, `${node.id}: T1 normal node has no blend`);
  if (!blend) continue;

  const total = blendShareTotal(blend);
  check(
    Math.abs(total - 1) < 1e-6,
    `${node.id}: shares sum to ${total}, not 1`,
  );
  const entries = blendEntries(blend);
  check(entries.length > 0, `${node.id}: every share is zero`);
  for (const key of Object.keys(blend) as FamilyId[]) {
    const family = FAMILY_DATABASE.get(key);
    check(!!family, `${node.id}: unknown family '${key}'`);
    check(
      family === undefined || family.biome === node.biomeGroup,
      `${node.id}: '${key}' is a ${family?.biome} family`,
    );
    check((blend[key] ?? 0) > 0, `${node.id}: '${key}' has a non-positive share`);
  }
  check(
    Object.keys(NODE_BLENDS).includes(node.id),
    `${node.id}: authored a blend but is missing from NODE_BLENDS`,
  );
}

// The blend list is the node count source for T1, so the two must agree.
for (const [biomeGroup, count] of countByBiome) {
  const blended = t1Normals.filter(
    (node) => node.biomeGroup === biomeGroup && node.blend,
  ).length;
  check(
    blended === count,
    `T1 ${biomeGroup}: ${count} normal nodes but ${blended} blends`,
  );
  // Every family of the biome leads at least one node, so no shard is unreachable.
  for (const family of familiesForBiome(biomeGroup)) {
    const leads = t1Normals.some(
      (node) =>
        node.biomeGroup === biomeGroup &&
        node.blend &&
        blendEntries(node.blend)[0]?.family === family.id,
    );
    check(leads, `T1 ${biomeGroup}: no node is dominated by ${family.name}`);
  }
}

// T2-T4 carry no blend yet (their family tables are not authored). This asserts
// the CURRENT deliberate state; Phase 4/5 authoring is what flips it.
for (const node of WORLD_NODE_LIST) {
  if (node.kind === 'normal' && node.biomeTier === 1) continue;
  check(!node.blend, `${node.id}: only T1 normal nodes carry a blend today`);
}

check(
  Object.keys(NODE_BLENDS).length === 27,
  `NODE_BLENDS holds ${Object.keys(NODE_BLENDS).length} nodes, expected 27`,
);
problems.push(...validateWorldMap());
assert(problems.length === 0, `blend authoring failures:\n  ${problems.join('\n  ')}`);

// ─── The cycle meets the shares to the slot ──────────────────────────────────

// The design's own example, at the pure layer: three families, 70/20/10.
{
  const blend: NodeBlend = {
    'plains-herd': 0.7,
    'plains-swarm': 0.2,
    'plains-sky': 0.1,
  };
  const cycle = blendSpawnCycle(blend);
  assert(cycle.length === BLEND_SPAWN_SLOTS, `a cycle is ${BLEND_SPAWN_SLOTS} slots`);
  const counts = countFamilies(cycle);
  assert(counts.get('plains-herd') === 7, `70% must take 7 of 10, got ${counts.get('plains-herd')}`);
  assert(counts.get('plains-swarm') === 2, `20% must take 2 of 10, got ${counts.get('plains-swarm')}`);
  assert(counts.get('plains-sky') === 1, `10% must take 1 of 10, got ${counts.get('plains-sky')}`);
  assert(cycle[0] === 'plains-herd', 'the dominant family leads the cycle');
  // Spread, not clumped: the minor families are not both stacked at the end.
  assert(
    cycle.slice(0, 5).some((family) => family !== 'plains-herd'),
    `the first half is all dominant: ${cycle.join(',')}`,
  );
}

// An even three-way split rounds by largest remainder, never to 3/3/3 plus a gap.
{
  const cycle = blendSpawnCycle({
    'plains-herd': 0.34,
    'plains-swarm': 0.33,
    'plains-sky': 0.33,
  });
  assert(cycle.length === BLEND_SPAWN_SLOTS, 'an even split still fills every slot');
  const counts = countFamilies(cycle);
  assert(
    [...counts.values()].every((count) => count === 3 || count === 4),
    `an even split must be 4/3/3, got ${[...counts.entries()].map(([f, c]) => `${f}=${c}`).join(' ')}`,
  );
}

// ─── Every authored node's resolved blend, one cycle at a time ────────────────

for (const node of t1Normals) {
  const resolved = nodeSpawnBlend(node.id);
  assert(!!resolved, `${node.id}: no resolvable blend`);

  const shares = blendEntries(resolved.shares);
  const total = blendShareTotal(resolved.shares);
  check(
    Math.abs(total - 1) < 1e-6,
    `${node.id}: resolved shares sum to ${total}, not 1`,
  );
  for (const family of resolved.unavailable) {
    check(
      !resolved.poolByFamily.has(family),
      `${node.id}: '${family}' is both unavailable and spawnable`,
    );
  }

  // One cycle: every family within one mob of its share of the slots. Largest
  // remainder guarantees it, which is exactly why the cycle is built that way.
  const cycle = Array.from(
    { length: BLEND_SPAWN_SLOTS },
    (_, cursor) => blendSpawnPick(resolved, cursor)!.family,
  );
  const counts = countFamilies(cycle);
  for (const { family, share } of shares) {
    const expected = share * BLEND_SPAWN_SLOTS;
    const actual = counts.get(family) ?? 0;
    check(
      Math.abs(actual - expected) < 1,
      `${node.id}: ${family} took ${actual} of ${BLEND_SPAWN_SLOTS} slots, wanted ${expected.toFixed(2)}`,
    );
  }

  // Three cycles are exactly three of the same cycle: cycling, not drifting.
  const thirty = Array.from(
    { length: BLEND_SPAWN_SLOTS * 3 },
    (_, cursor) => blendSpawnPick(resolved, cursor)!.family,
  );
  const thirtyCounts = countFamilies(thirty);
  for (const [family, count] of counts) {
    check(
      thirtyCounts.get(family) === count * 3,
      `${node.id}: ${family} is ${thirtyCounts.get(family)} over three cycles, not ${count * 3}`,
    );
  }

  // Every mob picked belongs to the family that picked it, and the family walks
  // its own mob list rather than repeating one mob forever.
  const fielded = new Map<FamilyId, Set<string>>();
  for (let cursor = 0; cursor < BLEND_SPAWN_SLOTS * 3; cursor += 1) {
    const pick = blendSpawnPick(resolved, cursor)!;
    check(
      familyForMonster(pick.monsterTypeId)?.id === pick.family,
      `${node.id}: picked '${pick.monsterTypeId}' for ${pick.family}`,
    );
    const seen = fielded.get(pick.family) ?? new Set<string>();
    seen.add(pick.monsterTypeId);
    fielded.set(pick.family, seen);
  }
  for (const [family, seen] of fielded) {
    const pool = resolved.poolByFamily.get(family) ?? [];
    check(
      seen.size === Math.min(pool.length, thirtyCounts.get(family) ?? 0),
      `${node.id}: ${family} fielded ${seen.size} of its ${pool.length} mobs`,
    );
  }
}
assert(problems.length === 0, `blend resolution failures:\n  ${problems.join('\n  ')}`);

// ─── The server spawns it ────────────────────────────────────────────────────

// Plains 01 is 70/20/10 Herd-led, and neither of the mobs its tier can field is
// a pack alpha, so entity headcount equals pick count. (On a node whose dominant
// family has an alpha, one pick fields a whole pack and the family's HEADCOUNT
// runs ahead of its share — that is the pack system, not the blend.)
{
  const nodeId = 'node-t1-plains-01';
  const resolved = nodeSpawnBlend(nodeId)!;
  const world = new World();
  resetBlendCursors(world);
  const spawns = BLEND_SPAWN_SLOTS * 3;
  let placed = 0;
  for (let i = 0; i < spawns; i += 1) if (spawnMonster(world, nodeId)) placed += 1;
  assert(placed === spawns, `only ${placed} of ${spawns} spawns were placed`);

  const live = [...world.monsterEntities].filter(
    (mob) => mob.hasPosition.nodeId === nodeId,
  );
  assert(live.length === spawns, `${live.length} monsters in the node, expected ${spawns}`);

  const byFamily = countFamilies(
    live.map((mob) => familyForMonster(mob.isMonster.monsterTypeId)?.id as FamilyId),
  );
  for (const [family] of byFamily) {
    assert(
      resolved.poolByFamily.has(family),
      `${nodeId} spawned ${family}, which its blend does not name`,
    );
  }
  for (const { family, share } of blendEntries(resolved.shares)) {
    const expected = share * spawns;
    const actual = byFamily.get(family) ?? 0;
    assert(
      Math.abs(actual - expected) <= spawns / BLEND_SPAWN_SLOTS,
      `${nodeId}: ${family} spawned ${actual} of ${spawns}, wanted ${expected.toFixed(1)}`,
    );
  }
  // 70/20/10 with all three Plains families fielded at T1 (Sky's Grass Kite landed
  // 2026-10-01) is exactly 7/2/1 per cycle: 21 Herd / 6 Swarm / 3 Sky over 30.
  assert(
    (byFamily.get('plains-herd') ?? 0) === 21
      && (byFamily.get('plains-swarm') ?? 0) === 6
      && (byFamily.get('plains-sky') ?? 0) === 3,
    `expected 21 Herd / 6 Swarm / 3 Sky, got ${[...byFamily.entries()].map(([f, c]) => `${f}=${c}`).join(' ')}`,
  );
}

// Cursors are per world, so a bench never inherits the live sim's position and
// every fresh world opens a node on its dominant family.
{
  const nodeId = 'node-t1-cave-03';
  const dominant = blendEntries(nodeSpawnBlend(nodeId)!.shares)[0].family;
  const first = (): FamilyId | undefined => {
    const world = new World();
    assert(spawnMonster(world, nodeId), `${nodeId}: nothing spawned`);
    const mob = [...world.monsterEntities][0];
    return familyForMonster(mob.isMonster.monsterTypeId)?.id as FamilyId;
  };
  assert(first() === dominant, `${nodeId}: a fresh world must open on ${dominant}`);
  assert(first() === dominant, `${nodeId}: a second fresh world must open on ${dominant} too`);
}

// A node with no blend still spawns, from the flat biome pool. This is the
// T2-T4 path, and it must not have been broken by the blended one.
{
  const unblended = WORLD_NODE_LIST.find(
    (node) => node.kind === 'normal' && node.biomeTier === 2,
  );
  assert(!!unblended, 'fixture: a T2 normal node');
  assert(!nodeSpawnBlend(unblended.id), `${unblended.id}: T2 nodes carry no blend yet`);
  const world = new World();
  let placed = 0;
  for (let i = 0; i < 10; i += 1) if (spawnMonster(world, unblended.id)) placed += 1;
  assert(placed > 0, `${unblended.id}: the unblended fallback spawned nothing`);
}

console.log('variantBlend.test.ts: ok');
