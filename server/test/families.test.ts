/**
 * Mob families: the family table partitions each biome's pool, and the map and
 * the table name the same families.
 *
 * WHY THIS EXISTS: a family is what a node blend is made of (design §12) and what
 * will drive loot (class-first bible §4). Both invariants fail silently: a
 * non-boss monster of a family biome that belongs to no family is a body no node
 * can name, and a blend key that resolves to nothing is a node that spawns
 * nothing from that family.
 *
 * Run: node --conditions=development --import tsx test/families.test.ts
 */
import {
  FAMILY_BIOMES,
  FAMILY_DATABASE,
  MONSTER_DATABASE,
  WORLD_NODE_LIST,
  blendEntries,
} from '@mmo-idle/shared';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const check = (condition: boolean, message: string): void => {
  if (!condition) problems.push(message);
};

// ─── The family table partitions each biome's pool ───────────────────────────

const claimed = new Map<string, string>();
for (const family of FAMILY_DATABASE.values()) {
  check(FAMILY_BIOMES.includes(family.biome), `${family.id}: biome '${family.biome}' is not a family biome`);
  check(family.monsterIds.length > 0, `${family.id}: has no monsters`);

  for (const id of family.monsterIds) {
    const monster = MONSTER_DATABASE.get(id);
    check(!!monster, `${family.id}: '${id}' is not a monster`);
    check(monster?.isBoss !== true, `${family.id}: '${id}' is a boss — families are non-boss only`);
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
// out is a body no blend can name, and nothing in the game would say so.
let swept = 0;
for (const [id, monster] of MONSTER_DATABASE) {
  if (monster.isBoss) continue;
  if (!FAMILY_BIOMES.includes(monster.biome ?? '')) continue;
  swept++;
  check(claimed.has(id), `'${id}' (${monster.biome}) is in no family`);
}
// Guard the guard: a sweep that finds no monsters passes vacuously forever.
assert(swept === claimed.size, `the partition sweep saw ${swept} monsters but the table claims ${claimed.size}`);

// ─── The map and the family table name the same families ─────────────────────
//
// A node blend is a set of keys into this table (Phase 2a). A key that does not
// resolve is a node that spawns nothing from a family, and a family no node names
// is a family the player never meets -- both silent. `variantBlend.test.ts` owns
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
  check(namedByNodes.has(family.id), `${family.id}: no node fields it`);
}
// Guard the guard: a join that reads no blends passes vacuously forever.
assert(
  namedByNodes.size === FAMILY_DATABASE.size - UNSOURCED_FAMILIES.size,
  `the blend join saw ${namedByNodes.size} families of ` +
    `${FAMILY_DATABASE.size - UNSOURCED_FAMILIES.size} expected (${FAMILY_DATABASE.size} total, ` +
    `${UNSOURCED_FAMILIES.size} unsourced)`,
);

assert(problems.length === 0, `family authoring failures:\n  ${problems.join('\n  ')}`);

// Guard the guard.
assert(FAMILY_DATABASE.size >= 15, `family table has only ${FAMILY_DATABASE.size} entries — it is broken`);
assert(claimed.size > 20, `family table claims only ${claimed.size} monsters — it is broken`);

console.log('families.test.ts: ok');
