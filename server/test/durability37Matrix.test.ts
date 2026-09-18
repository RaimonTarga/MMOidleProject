import { BIOME_DATABASE, MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import {
  DURABILITY37_BLOCKS,
  DURABILITY37_FAMILIES,
  DURABILITY37_INTEGRATION_SEEDS,
  DURABILITY37_LADDER_SEEDS,
  DURABILITY37_WINDOW_MS,
  assertDurability37Definitions,
  durability37WindowMs,
  installDurability37Treatment,
} from '../bench/balance/durability37Spec';
import { DURABILITY36_BLOCKS, DURABILITY36_LADDER_NODES } from '../bench/balance/durability36Spec';
import { SURVEY_CLASSES } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertDurability37Definitions();

// ── Shape: 54 + 20 = 74 planned observations.
{
  const j = DURABILITY37_BLOCKS['jungle-ladder']!;
  const i = DURABILITY37_BLOCKS['mob-integration']!;
  assert(j.cells.length === 18, `ladder: expected 18 cells, got ${j.cells.length}`);
  assert(j.cells.length * DURABILITY37_LADDER_SEEDS.length === 54, 'ladder plans 54 observations');
  assert(i.cells.length === 20, `integration: expected 20 cells, got ${i.cells.length}`);
  assert(i.cells.length * DURABILITY37_INTEGRATION_SEEDS.length === 20, 'integration plans 20 observations');
  assert(DURABILITY37_INTEGRATION_SEEDS.length === 1,
    'Block I is one seed per cell; more declared seeds would multiply the cohort');
  for (const b of [j, i]) {
    assert(new Set(b.cells.map((c) => c.id)).size === b.cells.length, 'duplicate cell id');
    assert(b.pilotIds.length > 0 && b.pilotIds.every((id) => b.cells.some((c) => c.id === id)),
      'pilot ids must name real cells');
    for (const c of b.cells) assert(!!c.treatment, `${c.id} declares no treatment`);
  }
}

// ── Block J is Durability36's ladder, unchanged apart from its identity.
{
  const before = DURABILITY36_BLOCKS['jungle-ladder']!.cells;
  const after = DURABILITY37_BLOCKS['jungle-ladder']!.cells;
  assert(before.length === after.length, 'the ladder must carry the same cells');
  for (let n = 0; n < before.length; n++) {
    const a = before[n]!, b = after[n]!;
    assert(b.id !== a.id && b.id.startsWith('dur37-ladder'), `${a.id}: the regression needs its own identity`);
    assert(b.nodeId === a.nodeId && b.tier === a.tier && b.className === a.className, `${a.id}: cell drift`);
    assert(JSON.stringify(b.build.skillPath) === JSON.stringify(a.build.skillPath), `${a.id}: skill path drift`);
    assert(JSON.stringify(b.build.gearItemIds) === JSON.stringify(a.build.gearItemIds), `${a.id}: gear drift`);
    assert(b.build.playerTier === a.build.playerTier && b.build.gearTier === a.build.gearTier, `${a.id}: build tier drift`);
  }
  // Seed reuse is deliberate and must stay identical, or this is not a regression.
  assert(DURABILITY37_LADDER_SEEDS.join(',') === '81013,83003,85009',
    'Block J must reuse Durability36 ladder seeds exactly');
  // Six roots at each of three tiers, on the three verified ladder nodes.
  for (const tier of [2, 3, 4] as const) {
    const cells = after.filter((c) => c.tier === tier);
    assert(cells.length === 6, `tier ${tier}: six roots, got ${cells.length}`);
    assert(new Set(cells.map((c) => c.className)).size === 6, `tier ${tier}: roots must be distinct`);
    assert(cells.every((c) => c.nodeId === DURABILITY36_LADDER_NODES[tier]), `tier ${tier}: node drift`);
  }
}

// ── Block I: one representative node per changed family, all six roots covered.
{
  const cells = DURABILITY37_BLOCKS['mob-integration']!.cells;
  assert(DURABILITY37_FAMILIES.length === 10, `expected 10 changed families, got ${DURABILITY37_FAMILIES.length}`);

  const seen = new Set<string>();
  for (const f of DURABILITY37_FAMILIES) {
    const key = `${f.role}:${f.tier}`;
    assert(!seen.has(key), `${key} appears twice; each family is checked once`);
    seen.add(key);
    assert(f.sensitive !== f.comparator, `${key}: the two arms must be different roots`);

    const mine = cells.filter((c) => c.role === f.role && c.tier === f.tier);
    assert(mine.length === 2, `${key}: expected 2 cells, got ${mine.length}`);
    assert(mine.every((c) => c.nodeId === `node-t${f.tier}-${f.role}-03`), `${key}: node drift`);
    assert(mine.every((c) => c.build.playerTier === f.tier && c.build.gearTier === f.tier),
      `${key}: builds must be tier-legal for the family`);
    assert(mine.every((c) => c.build.gearItemIds.armor === `${f.role}-vest-t${f.tier}`),
      `${key}: builds must wear the family's own biome kit`);
    assert(mine.every((c) => c.treatment === 'integrated'),
      `${key}: this packet has no control arm — every cell fights authored source`);
  }

  // Block I must not duplicate Block J's Jungle ladder or the already-guarded T1 Mountain.
  assert(!DURABILITY37_FAMILIES.some((f) => f.role === 'jungle'),
    'Jungle is Block J; duplicating it here wastes the spot-check budget');
  assert(!DURABILITY37_FAMILIES.some((f) => f.role === 'mountain' && f.tier === 1),
    'T1 Mountain is already guarded in source by t1MountainPressureAdoption.test.ts');

  const roots = new Set(cells.map((c) => c.className));
  assert(roots.size === SURVEY_CLASSES.length,
    `all six roots must appear across the collection, found ${[...roots].sort().join(', ')}`);
}

// ── Windows: Trench and Graveyard keep their longer ones.
{
  const cells = DURABILITY37_BLOCKS['mob-integration']!.cells;
  assert(DURABILITY37_WINDOW_MS['trench'] === 600_000, 'Trench keeps its 600 s window');
  assert(DURABILITY37_WINDOW_MS['graveyard'] === 900_000, 'Graveyard keeps its 900 s attrition window');
  for (const c of cells) {
    const want = DURABILITY37_WINDOW_MS[c.role] ?? 300_000;
    assert(durability37WindowMs(c) === want, `${c.id}: window must be ${want}, got ${durability37WindowMs(c)}`);
  }
  for (const c of DURABILITY37_BLOCKS['jungle-ladder']!.cells) {
    assert(durability37WindowMs(c) === 300_000, `${c.id}: the ladder keeps Durability36's 300 s window`);
  }
}

// ── This packet installs nothing, and must leave the database untouched.
{
  const snapshot = () =>
    JSON.stringify([...MONSTER_DATABASE.entries()].map(([k, v]) => [k, v.stats.hp, v.stats.attack]));
  const baseline = snapshot();
  for (const block of Object.values(DURABILITY37_BLOCKS)) {
    for (const cell of block.cells) {
      const overlay = installDurability37Treatment(cell);
      assert(overlay.changes.length === 0, `${cell.id}: Durability37 has no overlay to install`);
      assert(snapshot() === baseline, `${cell.id}: the database moved during a no-op install`);
      overlay.restore();
      assert(snapshot() === baseline, `${cell.id}: restore must be a no-op too`);
    }
  }
}

// ── The definitions guard actually guards: it names live source, not a doc label.
{
  // Every family's node exists, is ordinary, and pools the species it is here to check.
  for (const f of DURABILITY37_FAMILIES) {
    const nodeId = `node-t${f.tier}-${f.role}-03`;
    const node = NODE_BIOMES[nodeId];
    assert(!!node && !node.isDungeon, `${nodeId} must exist as an ordinary node`);
    const pool = BIOME_DATABASE.get(f.role)?.monsterPoolByTier?.[f.tier];
    assert(!!pool && pool.length > 0, `${f.role} T${f.tier} must author a pool`);
  }
  // The superseded Durability34 Jungle values must be nowhere in source.
  assert(MONSTER_DATABASE.get('apex-silverback')!.stats.hp === 10_000, 'Block J requires the adopted 10000');
  assert(MONSTER_DATABASE.get('emerald-constrictor')!.stats.hp === 12_000, 'Block J requires the adopted 12000');
}

console.log('durability37Matrix: ok');
