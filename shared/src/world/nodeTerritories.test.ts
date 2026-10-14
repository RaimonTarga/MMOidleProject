/**
 * One territory per node (design §24.3): every blended node is categorised under
 * its dominant family.
 *
 * Pinned here as invariants rather than per-node ids (the blend lists are
 * re-ordered by balance passes; review B5):
 *
 *  1. Every blended node, T1 to T4, has a territory, and it is its dominant family.
 *  2. Nodes with no blend (dungeons, sanctuaries, the Clearing) have no territory.
 *  3. Every node's territory is a family it FIELDS: it has at least one member in
 *     that node's tier pool — every node in the registry, every tier, no
 *     allowlist. A node led by a family it never spawns (review L16; eight T2–T4
 *     nodes until the verbs-that-fire run) names bodies the player never meets.
 *
 * Run (from server/): node --conditions=development --import tsx ../shared/src/world/nodeTerritories.test.ts
 */
import { BIOME_DATABASE } from '../biomeDatabase';
import { dominantBlendFamily, FAMILY_DATABASE } from '../data/families';
import { WORLD_NODE_LIST } from './map/registry';
import { nodeFamily, nodeSpawnBlend } from './nodeBlends';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: unknown, message: string): void => {
  if (!condition) problems.push(message);
};

// ── 1 + 2. Territory, every tier ─────────────────────────────────────────────

let blended = 0;
for (const node of WORLD_NODE_LIST) {
  if (!node.blend) {
    check(nodeFamily(node.id) === undefined, `${node.id}: a node with no blend has a territory family`);
    continue;
  }
  blended += 1;
  const dominant = dominantBlendFamily(node.blend);
  const family = dominant ? FAMILY_DATABASE.get(dominant) : undefined;
  check(!!family, `${node.id}: blend has no dominant family`);
  check(nodeFamily(node.id)?.id === family?.id, `${node.id}: territory is ${nodeFamily(node.id)?.id}, dominant is ${family?.id}`);
}
// Guard the guard: a sweep that sees no blends passes vacuously.
assert(blended > 100, `only ${blended} blended nodes — the sweep is broken`);

// T1 specifically: every normal node carries a blend, so every one has a territory.
const t1Normals = WORLD_NODE_LIST.filter((node) => node.biomeTier === 1 && node.kind === 'normal');
assert(t1Normals.length === 25, `fixture: expected 25 T1 normal nodes, got ${t1Normals.length}`);
for (const node of t1Normals) {
  check(nodeFamily(node.id) !== undefined, `${node.id}: a T1 normal node has no territory`);
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

// ── 3. Every node's territory is a family it fields (review L16, no allowlist) ─
//
// Read off the RAW tier pool, not `resolveNodeBlend`, so the spawner's own
// filtering cannot vouch for itself. A node's territory is its AUTHORED dominant
// family (`nodeFamily`), so a family with no body at the node's tier must never
// lead a blend: author the leader from what the tier fields, or add a body to
// the pool (both the designer's). A minority share for a bodiless family is
// allowed — it renormalises away.

{
  let territories = 0;
  for (const node of WORLD_NODE_LIST) {
    const territory = nodeFamily(node.id);
    if (territory === undefined) continue; // no blend (section 2)
    territories += 1;
    const pool = BIOME_DATABASE.get(node.biomeGroup)?.monsterPoolByTier[node.biomeTier] ?? [];
    const bodies = pool.filter((id) => territory.monsterIds.includes(id));
    check(
      bodies.length > 0,
      `${node.id}: reads as ${territory.name}, but ${territory.id} has no member in `
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

assert(problems.length === 0, `node territory failures:\n  ${problems.join('\n  ')}`);

console.log('nodeTerritories.test.ts: ok');
