/**
 * Nodes are rosters, not proportions (design §26.3, legibility run 2026-10-05).
 *
 * WHY THIS EXISTS: a 70/20/10 node and a 45/45/10 node were indistinguishable by
 * eye, so a T1 node now fields its dominant family and at most one guest, and one
 * node per biome — the crossroads, the cell the dungeon is entered from — fields
 * all three. The failure modes are silent (a third family creeping back into a
 * pair, a family losing its last territory, two nodes that look the same but pay
 * different shards), so they are pinned here as invariants over the registry, not
 * as node ids (the lists are re-ordered by balance passes; review B5):
 *
 *  1. The spawner seam handles a one-family and a two-family blend: it resolves
 *     to exactly the authored families (no division by zero, no empty pool, no
 *     fallback to the biome's whole pool), and a guest the tier cannot field is
 *     dropped onto the leader rather than widening the node.
 *  2. Shapes: every T1 normal node is a pure, a pair, or its biome's crossroads.
 *     A pair has a clear leader (at least six in ten, never a near-even split) and
 *     a visible guest (at least two in ten), in exact tenths so what the map shows
 *     is what spawns. No T1 node other than the five crossroads fields three
 *     families.
 *  3. The crossroads: exactly one per T1 biome, fielding every family of the
 *     biome at near-equal shares with a strict (by-a-hair) leader, adjacent to the
 *     biome's dungeon and the last of the dungeon's cells a player meets.
 *  4. Territories: every family of a T1 biome leads at least one node that is NOT
 *     the crossroads, so each of the biome's three shards has a home of its own
 *     (and keeps one if the crossroads ever rolls its shard per kill — §26.3 open).
 *  5. Variety: no two nodes of a biome field the same set of families, so a node's
 *     roster — and with it its shard — is read off the bodies in one visit.
 *
 * `nodeShards.test.ts` owns the currency side (every node pays its leader's shard,
 * a leader the tier fields); `server/test/variantBlend.test.ts` owns the cycle and
 * the live spawner (a World spawning a pure, a pair and a crossroads).
 *
 * Run (from server/): node --conditions=development --import tsx ../shared/src/world/nodeRosters.test.ts
 */
import { BIOME_DATABASE } from '../biomeDatabase';
import {
  BLEND_SPAWN_SLOTS,
  blendEntries,
  familiesForBiome,
  familyForMonster,
  type FamilyId,
  type NodeBlend,
} from '../data/families';
import { T1_BIOME_ORDER } from '../tutorial/scripts/plans';
import { WORLD_NODE_LIST, worldNodeExits } from './map/registry';
import {
  blendSpawnPick,
  isCrossroadsNode,
  nodeSpawnBlend,
  resolveNodeBlend,
  ROSTER_TIERS,
} from './nodeBlends';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: unknown, message: string): void => {
  if (!condition) problems.push(message);
};

const isTenths = (share: number): boolean => Math.abs(share * BLEND_SPAWN_SLOTS - Math.round(share * BLEND_SPAWN_SLOTS)) < 1e-9;

// ── 1. The spawner seam: one family and two families ─────────────────────────
//
// The live spawner (`spawnMonster`) takes `blendSpawnPick(nodeSpawnBlend(id), cursor)`
// and rolls the biome's WHOLE pool only when that is undefined — i.e. when the
// blend resolves to nothing. So the seam to prove is `resolveNodeBlend` +
// `blendSpawnPick`: a pure and a pair must resolve, cycle only their own families
// and walk only their own mobs, for thirty picks.

/** Thirty picks off a resolved blend: the family and mob counts, every pick checked. */
function pickSweep(where: string, biome: string, tier: number, blend: NodeBlend) {
  const resolved = resolveNodeBlend(biome, tier, blend);
  assert(resolved, `${where}: did not resolve`);
  const total = Object.values(resolved.shares).reduce<number>((sum, s) => sum + (s ?? 0), 0);
  assert(Number.isFinite(total) && Math.abs(total - 1) < 1e-9, `${where}: resolved shares sum to ${total}`);
  for (const share of Object.values(resolved.shares)) {
    assert(Number.isFinite(share), `${where}: a resolved share is ${share}`);
  }
  assert(resolved.cycle.length === BLEND_SPAWN_SLOTS, `${where}: cycle is ${resolved.cycle.length} long`);
  for (const [family, pool] of resolved.poolByFamily) {
    assert(pool.length > 0, `${where}: ${family} resolved with an empty pool`);
  }
  const families = new Map<FamilyId, number>();
  for (let cursor = 0; cursor < BLEND_SPAWN_SLOTS * 3; cursor += 1) {
    const pick = blendSpawnPick(resolved, cursor);
    assert(pick, `${where}: pick ${cursor} came back empty (the spawner would roll the whole pool)`);
    assert(resolved.poolByFamily.has(pick.family), `${where}: picked ${pick.family}, which it does not field`);
    assert(familyForMonster(pick.monsterTypeId)?.id === pick.family,
      `${where}: picked '${pick.monsterTypeId}' for ${pick.family}`);
    families.set(pick.family, (families.get(pick.family) ?? 0) + 1);
  }
  return { resolved, families };
}

{
  // A pure: every pick is the one family.
  const pure = pickSweep('pure plains-sky', 'plains', 1, { 'plains-sky': 1 });
  assert(pure.families.size === 1 && pure.families.get('plains-sky') === 30,
    `a pure must spawn only its family, got ${JSON.stringify([...pure.families])}`);
  assert(pure.resolved.unavailable.length === 0, 'a fielded pure has nothing unavailable');

  // A door pair: exactly six and four per ten, nothing else.
  const pair = pickSweep('pair forest pack/canopy', 'forest', 1, { 'forest-pack': 0.6, 'forest-canopy': 0.4 });
  assert(pair.families.size === 2
    && pair.families.get('forest-pack') === 18 && pair.families.get('forest-canopy') === 12,
    `a 60/40 pair must spawn 18/12 over thirty picks, got ${JSON.stringify([...pair.families])}`);

  // An outward pair: seven and three.
  const outward = pickSweep('pair swamp coven/stalker', 'swamp', 1, { 'swamp-coven': 0.7, 'swamp-stalker': 0.3 });
  assert(outward.families.get('swamp-coven') === 21 && outward.families.get('swamp-stalker') === 9
    && outward.families.size === 2,
    `a 70/30 pair must spawn 21/9 over thirty picks, got ${JSON.stringify([...outward.families])}`);

  // A guest the tier cannot field (Desert's Stalker family is T3+ only; Swamp T2 has
  // had a Mire body since 2026-10-12) is dropped onto the leader: the node narrows to
  // one family, it never widens to the whole pool.
  assert((BIOME_DATABASE.get('desert')?.monsterPoolByTier[2] ?? []).length >= 2,
    'fixture: the Desert T2 pool fields more than one family');
  const narrowed = pickSweep('pair with an unfielded guest', 'desert', 2, { 'desert-scorpion': 0.7, 'desert-stalker': 0.3 });
  assert(narrowed.resolved.unavailable.length === 1 && narrowed.resolved.unavailable[0] === 'desert-stalker',
    `fixture: desert-stalker must be unfielded at T2, got ${JSON.stringify(narrowed.resolved.unavailable)}`);
  assert(narrowed.families.size === 1 && narrowed.families.get('desert-scorpion') === 30,
    `an unfielded guest must fold onto the leader, got ${JSON.stringify([...narrowed.families])}`);

  // A blend with nothing fieldable resolves to undefined — the one path on which
  // the spawner falls back to the flat pool. `nodeShards.test.ts` section 4 makes
  // it unreachable for every real node (its leader always has a body).
  assert(resolveNodeBlend('desert', 2, { 'desert-stalker': 1 }) === undefined,
    'a blend with no fielded family resolves to nothing');
}

// ── 2–5. The T1 rosters ──────────────────────────────────────────────────────

assert(ROSTER_TIERS.has(1), 'T1 is a roster tier');
const t1Normals = WORLD_NODE_LIST.filter((node) => node.biomeTier === 1 && node.kind === 'normal');
assert(t1Normals.length === 25, `fixture: expected 25 T1 normal nodes, got ${t1Normals.length}`);

/** The bot's next node: BFS layers, neighbours in N > S > E > W order (as `variantBlend.test.ts`). */
function nextArrival(from: string, pool: readonly string[]): string | undefined {
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
}

/** Arrival order over a biome's normal nodes from one entry. */
function arrivals(entry: string, pool: readonly string[]): string[] {
  const order: string[] = [];
  const remaining = [...pool];
  let at = entry;
  while (remaining.length > 0) {
    const node = nextArrival(at, remaining);
    assert(node, `nothing in ${pool.join(',')} is reachable from ${at}`);
    order.push(node);
    remaining.splice(remaining.indexOf(node), 1);
    at = node;
  }
  return order;
}

let crossroadsTotal = 0;
const biomes = [...new Set(t1Normals.map((node) => node.biomeGroup))];
assert(biomes.length === 5, `fixture: five T1 biomes, got ${biomes.join(',')}`);

for (const biome of biomes) {
  const nodes = t1Normals.filter((node) => node.biomeGroup === biome);
  const families = familiesForBiome(biome).map((family) => family.id);
  assert(families.length === 3, `fixture: ${biome} has three families, got ${families.length}`);

  // 2. Shapes.
  const crossroads = nodes.filter((node) => isCrossroadsNode(node.id));
  for (const node of nodes) {
    const entries = blendEntries(node.blend ?? {});
    check(entries.length > 0, `${node.id}: no blend`);
    if (isCrossroadsNode(node.id)) continue;
    check(entries.length <= 2, `${node.id}: fields ${entries.length} families but is not a crossroads`);
    const [leader, guest] = entries;
    if (guest) {
      check(leader.share >= 0.6 - 1e-9,
        `${node.id}: a pair needs a clear leader (>= 60%), got ${leader.family} ${leader.share}`);
      check(guest.share >= 0.2 - 1e-9,
        `${node.id}: a guest must be visible (>= 20%), got ${guest.family} ${guest.share}`);
    }
    for (const entry of entries) {
      check(isTenths(entry.share),
        `${node.id}: ${entry.family} ${entry.share} is not a whole number of spawns in ${BLEND_SPAWN_SLOTS}`);
    }
  }

  // 3. The crossroads.
  check(crossroads.length === 1,
    `${biome}: expected exactly one crossroads, got ${crossroads.map((n) => n.id).join(', ') || 'none'}`);
  crossroadsTotal += crossroads.length;
  const cross = crossroads[0];
  if (cross) {
    const entries = blendEntries(cross.blend!);
    check(entries.length === families.length && families.every((f) => (cross.blend![f] ?? 0) > 0),
      `${cross.id}: a crossroads fields every ${biome} family, got ${entries.map((e) => e.family).join(', ')}`);
    const top = entries[0].share;
    const bottom = entries[entries.length - 1].share;
    check(top - bottom <= 0.02 + 1e-9, `${cross.id}: crossroads shares must be near-equal, got ${top}..${bottom}`);
    check(entries.length < 2 || entries[0].share > entries[1].share + 1e-9,
      `${cross.id}: the crossroads' leader must lead by a hair, not tie (its shard is its leader's)`);
    // The resolved spawn is all three, too.
    check(nodeSpawnBlend(cross.id)?.poolByFamily.size === families.length,
      `${cross.id}: the spawner does not field all three families`);

    // Placed before the dungeon: on the dungeon, and the last of its cells met.
    const dungeon = WORLD_NODE_LIST.find((n) => n.kind === 'dungeon' && n.biomeTier === 1 && n.biomeGroup === biome);
    assert(dungeon, `fixture: a T1 ${biome} dungeon`);
    const onDungeon = nodes.filter((n) => Object.values(worldNodeExits(n.id)).includes(dungeon.id)).map((n) => n.id);
    check(onDungeon.includes(cross.id), `${cross.id}: the crossroads must open onto ${dungeon.id} (cells on it: ${onDungeon.join(', ')})`);
    const index = T1_BIOME_ORDER.indexOf(biome as (typeof T1_BIOME_ORDER)[number]);
    assert(index >= 0, `fixture: ${biome} is in T1_BIOME_ORDER`);
    const entriesTo = ['node-clearing', ...(index > 0
      ? t1Normals.filter((n) => n.biomeGroup === T1_BIOME_ORDER[index - 1]).map((n) => n.id)
      : [])];
    for (const entry of entriesTo) {
      const order = arrivals(entry, nodes.map((n) => n.id)).filter((id) => onDungeon.includes(id));
      check(order[order.length - 1] === cross.id,
        `${cross.id}: entered from ${entry}, the dungeon's cells are met ${order.join(' > ')} — the crossroads must be the last`);
    }
  }

  // 4. Every family leads a node that is not the crossroads.
  for (const family of families) {
    const led = nodes.filter((node) => !isCrossroadsNode(node.id) && blendEntries(node.blend ?? {})[0]?.family === family);
    check(led.length > 0, `${biome}: ${family} leads no node but the crossroads — its shard has no territory`);
  }

  // 5. Variety: every node's roster is its own.
  const rosters = new Map<string, string>();
  for (const node of nodes) {
    const key = blendEntries(node.blend ?? {}).map((e) => e.family).sort().join('+');
    const twin = rosters.get(key);
    check(!twin, `${node.id} fields the same families as ${twin} (${key}) — two nodes that look alike`);
    rosters.set(key, node.id);
  }
}
check(crossroadsTotal === 5, `expected five crossroads at T1, got ${crossroadsTotal}`);

// Outside a roster tier there is no crossroads (a three-family blend is normal there).
{
  const t2Three = WORLD_NODE_LIST.find((n) => n.biomeTier === 2 && n.kind === 'normal'
    && blendEntries(n.blend ?? {}).length === 3);
  assert(t2Three, 'fixture: a T2 node with a three-family blend');
  check(!isCrossroadsNode(t2Three.id), `${t2Three.id}: a T2 node is never a crossroads (T1 only in this run)`);
  check(!isCrossroadsNode('node-t1-plains-dungeon'), 'a dungeon is never a crossroads');
}

assert(problems.length === 0, `roster failures:\n  ${problems.join('\n  ')}`);

console.log('nodeRosters.test.ts: ok');
