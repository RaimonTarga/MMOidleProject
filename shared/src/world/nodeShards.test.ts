/**
 * One shard per node (design §24.3): every node is categorised under its dominant
 * family, and every kill in it pays that family's shard.
 *
 * WHY THIS EXISTS: the node rule replaced "a kill pays its own family's shard",
 * and the two only differ on minority bodies — exactly the kind of difference
 * that drifts silently. Pinned here, as invariants rather than per-node ids (the
 * blend lists are re-ordered by balance passes; review B5):
 *
 *  1. Partition: every T1 normal node pays exactly one shard, and it is its
 *     dominant family's `drops` — for EVERY blended node, T1 to T4.
 *  2. Nodes with no blend (dungeons, sanctuaries, the Clearing) have no node
 *     shard; the reward seam keeps the per-monster rule there.
 *  3. Every T1 weapon lane is payable in the weapon's home biome — some node there
 *     is led by a family dropping it — so a T1 tree never sends the player out
 *     of its biome for a shard (design §24.4).
 *  4. Every node pays a family it FIELDS: the family whose shard a node pays has
 *     at least one member in that node's tier pool — every node in the registry,
 *     every tier, no allowlist. A node that paid for a family it never spawns
 *     (review L16; eight T2–T4 nodes until the verbs-that-fire run) teaches the
 *     player a currency with no body behind it.
 *
 * The reward seam's half (a kill really pays the node's shard) is in
 * `server/test/lineageMaterials.test.ts`, which owns a World.
 *
 * Run (from server/): node --conditions=development --import tsx ../shared/src/world/nodeShards.test.ts
 */
import { BIOME_DATABASE } from '../biomeDatabase';
import { dominantBlendFamily, FAMILY_DATABASE } from '../data/families';
import { LINEAGE_DATABASE } from '../data/lineages';
import { WORLD_NODE_LIST } from './map/registry';
import { nodeFamily, nodeShard, nodeSpawnBlend, nodesPayingShard } from './nodeBlends';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: unknown, message: string): void => {
  if (!condition) problems.push(message);
};

// ── 1 + 2. Partition, every tier ─────────────────────────────────────────────

let blended = 0;
for (const node of WORLD_NODE_LIST) {
  const shard = nodeShard(node.id);
  if (!node.blend) {
    check(shard === undefined, `${node.id}: a ${node.kind} node with no blend has node shard '${shard}'`);
    check(nodeFamily(node.id) === undefined, `${node.id}: a node with no blend has a territory family`);
    continue;
  }
  blended += 1;
  const dominant = dominantBlendFamily(node.blend);
  const family = dominant ? FAMILY_DATABASE.get(dominant) : undefined;
  check(!!family, `${node.id}: blend has no dominant family`);
  check(nodeFamily(node.id)?.id === family?.id, `${node.id}: territory is ${nodeFamily(node.id)?.id}, dominant is ${family?.id}`);
  check(
    shard === family?.drops,
    `${node.id}: pays '${shard}', but its dominant family ${family?.id} drops '${family?.drops}'`,
  );
}
// Guard the guard: a sweep that sees no blends passes vacuously.
assert(blended > 100, `only ${blended} blended nodes — the sweep is broken`);

// T1 specifically: every normal node carries a blend, so every one pays a shard.
const t1Normals = WORLD_NODE_LIST.filter((node) => node.biomeTier === 1 && node.kind === 'normal');
assert(t1Normals.length === 25, `fixture: expected 25 T1 normal nodes, got ${t1Normals.length}`);
for (const node of t1Normals) {
  check(nodeShard(node.id) !== undefined, `${node.id}: a T1 normal node pays no shard`);
}

// The 45/45 tie breaks in family-table order (the one definition, dominantBlendFamily):
// a two-family tie must name the family authored first in the table.
{
  const familyOrder: string[] = [...FAMILY_DATABASE.keys()];
  let ties = 0;
  for (const node of WORLD_NODE_LIST) {
    if (!node.blend) continue;
    const shares = Object.entries(node.blend).filter(([, s]) => (s ?? 0) > 0) as [string, number][];
    const top = Math.max(...shares.map(([, s]) => s));
    const leaders = shares.filter(([, s]) => s === top).map(([f]) => f);
    if (leaders.length < 2) continue;
    ties += 1;
    const expected = leaders.sort((a, b) => familyOrder.indexOf(a) - familyOrder.indexOf(b))[0];
    check(nodeFamily(node.id)?.id === expected, `${node.id}: a tie between ${leaders.join('/')} must go to ${expected}`);
  }
  assert(ties > 0, 'fixture: the map authors at least one tied blend');
}

// ── 3. Every T1 weapon lane is payable in its home biome ─────────────────────

/**
 * (weapon lineage, lane) pairs knowingly NOT payable in the home biome. Empty:
 * design §24.4 made each T1 biome's families its weapon's lanes, and every T1
 * biome has a node led by each of its three families.
 */
const UNPAYABLE_AT_HOME = new Set<string>();

{
  const weapons = [...LINEAGE_DATABASE.values()].filter((l) => l.slot === 'weapon');
  assert(weapons.length === 5, `fixture: expected five T1 weapon lineages, got ${weapons.length}`);
  for (const weapon of weapons) {
    for (const lane of weapon.lanes) {
      const key = `${weapon.id}/${lane}`;
      const nodes = nodesPayingShard(weapon.homeBiome, 1, lane);
      check(
        (nodes.length > 0) !== UNPAYABLE_AT_HOME.has(key),
        UNPAYABLE_AT_HOME.has(key)
          ? `${key}: now payable in ${weapon.homeBiome} (${nodes.join(', ')}) — drop it from UNPAYABLE_AT_HOME`
          : `${key}: no T1 ${weapon.homeBiome} node pays the ${lane} shard its cards cost`,
      );
    }
  }
}

// ── 4. Every node pays a family it fields (review L16, no allowlist) ─────────
//
// Read off the RAW tier pool, not `resolveNodeBlend`, so the spawner's own
// filtering cannot vouch for itself. A node's territory is its AUTHORED dominant
// family (`nodeFamily`), so a family with no body at the node's tier must never
// lead a blend: author the leader from what the tier fields, or add a body to
// the pool (both the designer's). A minority share for a bodiless family is
// allowed — it renormalises away and pays nothing.

{
  let territories = 0;
  for (const node of WORLD_NODE_LIST) {
    const shard = nodeShard(node.id);
    if (shard === undefined) continue; // no blend: the per-mob rule (section 2)
    territories += 1;
    const territory = nodeFamily(node.id)!;
    const pool = BIOME_DATABASE.get(node.biomeGroup)?.monsterPoolByTier[node.biomeTier] ?? [];
    const bodies = pool.filter((id) => territory.monsterIds.includes(id));
    check(
      bodies.length > 0,
      `${node.id}: pays ${territory.name}'s '${shard}' shard, but ${territory.id} has no member in `
        + `${node.biomeGroup}'s tier-${node.biomeTier} pool (${pool.join(', ') || 'empty'})`,
    );
    // And the spawner agrees: the territory is a fielded family and leads what
    // the node actually spawns, so the map's name and the bodies match.
    const resolved = nodeSpawnBlend(node.id);
    check(
      resolved?.poolByFamily.has(territory.id) === true,
      `${node.id}: the spawner does not field its territory family ${territory.id}`,
    );
    check(
      resolved !== undefined && dominantBlendFamily(resolved.shares) === territory.id,
      `${node.id}: reads as ${territory.id} but spawns mostly `
        + `${resolved ? dominantBlendFamily(resolved.shares) : 'nothing'}`,
    );
  }
  // Guard the guard: every blended node, T1 to T4, was swept (section 1 counted them).
  assert(territories === blended, `swept ${territories} territories, expected every blended node (${blended})`);
}

assert(problems.length === 0, `node shard failures:\n  ${problems.join('\n  ')}`);

console.log('nodeShards.test.ts: ok');
