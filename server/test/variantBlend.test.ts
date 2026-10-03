/**
 * Node blends: what a node is made of, and whether it spawns what it says.
 *
 * WHY THIS EXISTS: a blend is the one piece of node authoring a player is meant to
 * read off the map ("this is a Herd node, Herd drops Empowered shards"), so the
 * failure mode is silent — a node that advertises one family and fields another
 * looks fine and teaches the player the wrong thing. Two things are pinned:
 *
 *  1. Every T1/T2 normal node's shares sum to 1 and name only families of its
 *     own biome. (Node COUNT is pinned by `validateWorldMap`, which this also
 *     runs.)
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
  T1_BIOME_ORDER,
  WORLD_NODE_LIST,
  blendEntries,
  blendShareTotal,
  blendSpawnCycle,
  blendSpawnPick,
  familyForMonster,
  nodeSpawnBlend,
  validateWorldMap,
  worldNodeExits,
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
//
// T1 and T2 both carry blends now (W1-E adds T2's). The "every family leads a
// node" rule is checked per tier against the families that tier's OWN blends
// actually name, not every family of the biome: Desert's Stalker family is
// T3+ only by design (no T2 member — see families/index.ts), so a T2 check
// against `familiesForBiome` would wrongly demand a Stalker-led T2 node.

function checkTierBlends(tier: number, expectedCount: number) {
  const normals = WORLD_NODE_LIST.filter(
    (node) => node.kind === 'normal' && node.biomeTier === tier,
  );
  assert(
    normals.length === expectedCount,
    `fixture: expected ${expectedCount} T${tier} normal nodes, found ${normals.length}`,
  );

  const countByBiome = new Map<string, number>();
  const familiesNamedByBiome = new Map<string, Set<FamilyId>>();
  for (const node of normals) {
    countByBiome.set(node.biomeGroup, (countByBiome.get(node.biomeGroup) ?? 0) + 1);

    const blend = node.blend;
    check(!!blend, `${node.id}: T${tier} normal node has no blend`);
    if (!blend) continue;

    const total = blendShareTotal(blend);
    check(
      Math.abs(total - 1) < 1e-6,
      `${node.id}: shares sum to ${total}, not 1`,
    );
    const entries = blendEntries(blend);
    check(entries.length > 0, `${node.id}: every share is zero`);
    const named = familiesNamedByBiome.get(node.biomeGroup) ?? new Set<FamilyId>();
    for (const key of Object.keys(blend) as FamilyId[]) {
      const family = FAMILY_DATABASE.get(key);
      check(!!family, `${node.id}: unknown family '${key}'`);
      check(
        family === undefined || family.biome === node.biomeGroup,
        `${node.id}: '${key}' is a ${family?.biome} family`,
      );
      check((blend[key] ?? 0) > 0, `${node.id}: '${key}' has a non-positive share`);
      named.add(key);
    }
    familiesNamedByBiome.set(node.biomeGroup, named);
    check(
      Object.keys(NODE_BLENDS).includes(node.id),
      `${node.id}: authored a blend but is missing from NODE_BLENDS`,
    );
  }

  // The blend list is the node count source at this tier, so the two must agree.
  for (const [biomeGroup, count] of countByBiome) {
    const blended = normals.filter(
      (node) => node.biomeGroup === biomeGroup && node.blend,
    ).length;
    check(
      blended === count,
      `T${tier} ${biomeGroup}: ${count} normal nodes but ${blended} blends`,
    );
    // Every family this tier's blends name for the biome leads at least one
    // node, so no shard this tier claims to source is actually unreachable.
    for (const familyId of familiesNamedByBiome.get(biomeGroup) ?? []) {
      const leads = normals.some(
        (node) =>
          node.biomeGroup === biomeGroup &&
          node.blend &&
          blendEntries(node.blend)[0]?.family === familyId,
      );
      check(leads, `T${tier} ${biomeGroup}: no node is dominated by '${familyId}'`);
    }
  }
  return normals;
}

const t1Normals = checkTierBlends(1, 25);
const t2Normals = checkTierBlends(2, 37);
const t3Normals = checkTierBlends(3, 38);
const t4Normals = checkTierBlends(4, 38);

// Every normal node of every tier now carries a blend (W1-C adds T3/T4). Only
// non-normal kinds (dungeon/sanctuary/tutorial) stay blend-free, by design
// (`validateKindsAndContent` enforces that separately).
for (const node of WORLD_NODE_LIST) {
  if (node.kind === 'normal') continue;
  check(!node.blend, `${node.id}: a non-normal node must not carry a blend`);
}

check(
  Object.keys(NODE_BLENDS).length === 25 + 37 + 38 + 38,
  `NODE_BLENDS holds ${Object.keys(NODE_BLENDS).length} nodes, expected ${25 + 37 + 38 + 38}`,
);
problems.push(...validateWorldMap());
assert(problems.length === 0, `blend authoring failures:\n  ${problems.join('\n  ')}`);

// ─── T1 arrival order: the first two arrivals are mixed ──────────────────────
//
// `regionT1.ts` ("ORDER IS DISTANCE") puts each biome's two MIXED blends (no family
// at 60% or more) on the first two nodes a player meets, so no biome opens on its
// worst concentration — and since design §24.3 the order also decides which node
// pays which shard. Asserted as the rule, from where the T1 routes and the guide
// actually enter each biome (the previous biome of T1_BIOME_ORDER, every node of
// it; Plains from the Clearing), with the bot's resolver (nearest uncleared by BFS
// over worldNodeExits, ties N > S > E > W). Not as node ids: a reorder that keeps
// the rule must pass, one that breaks it must fail (review B5, P17).
{
  const MIXED_MAX_SHARE = 0.6;
  /** The bot's next node: BFS layers, neighbours in N > S > E > W order. */
  const nextArrival = (from: string, pool: readonly string[]): string | undefined => {
    const targets = new Set(pool);
    if (targets.has(from)) return from;
    const seen = new Set([from]);
    let frontier = [from];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const neighbour of Object.values(worldNodeExits(id))) {
          if (!neighbour || seen.has(neighbour)) continue;
          if (targets.has(neighbour)) return neighbour;
          seen.add(neighbour);
          next.push(neighbour);
        }
      }
      frontier = next;
    }
    return undefined;
  };
  const normalsOf = (biome: string): string[] =>
    WORLD_NODE_LIST.filter((n) => n.biomeGroup === biome && n.biomeTier === 1 && n.kind === 'normal').map((n) => n.id);
  let checked = 0;
  T1_BIOME_ORDER.forEach((biome, index) => {
    const pool = normalsOf(biome);
    const entries = index === 0
      ? ['node-clearing']
      : normalsOf(T1_BIOME_ORDER[index - 1]);
    for (const entry of entries) {
      let at = entry;
      const remaining = [...pool];
      for (let arrival = 1; arrival <= 2; arrival += 1) {
        const node = nextArrival(at, remaining);
        assert(node, `${biome}: nothing reachable from ${at}`);
        const top = Math.max(...blendEntries(NODE_BLENDS[node] ?? {}).map((e) => e.share));
        check(
          top < MIXED_MAX_SHARE,
          `${biome} entered from ${entry}: arrival ${arrival} is ${node}, a ${Math.round(top * 100)}% pure`,
        );
        remaining.splice(remaining.indexOf(node), 1);
        at = node;
        checked += 1;
      }
    }
  });
  assert(checked >= 2 * (1 + 5 * 4), `the arrival sweep checked only ${checked} arrivals`);
  assert(problems.length === 0, `T1 arrival order:\n  ${problems.join('\n  ')}`);
}

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

for (const node of [...t1Normals, ...t3Normals, ...t4Normals]) {
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

// A node with no blend still spawns, from the flat biome pool. Every normal
// node now carries a blend (W1-C), so the one kind that stays blend-free by
// design is a dungeon node (`validateKindsAndContent` enforces that) — this
// is the fallback path dungeons, sanctuaries, and the pre-blend T3/T4 state
// all relied on, and it must not have been broken by the blended one.
{
  const unblended = WORLD_NODE_LIST.find(
    (node) => node.kind === 'dungeon' && node.biomeTier === 3,
  );
  assert(!!unblended, 'fixture: a T3 dungeon node');
  assert(!nodeSpawnBlend(unblended.id), `${unblended.id}: dungeon nodes carry no blend`);
  const world = new World();
  let placed = 0;
  for (let i = 0; i < 10; i += 1) if (spawnMonster(world, unblended.id)) placed += 1;
  assert(placed > 0, `${unblended.id}: the unblended fallback spawned nothing`);
}

console.log('variantBlend.test.ts: ok');
