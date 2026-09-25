import { ITEM_DATABASE, MONSTER_DATABASE, NODE_BIOMES, RECIPE_DATABASE } from '@mmo-idle/shared';
import {
  DURABILITY36_ARMOR_ARMS,
  DURABILITY36_ARMOR_SEEDS,
  DURABILITY36_BLOCKS,
  DURABILITY36_LADDER_NODES,
  DURABILITY36_LADDER_SEEDS,
  DURABILITY36_LINEAGE,
  assertDurability36Definitions,
  installDurability36Treatment,
} from '../bench/balance/durability36Spec';
import { DURABILITY34_JUNGLE_HP } from '../bench/balance/durability34Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertDurability36Definitions();

// ── Shape: two independent blocks, 18 + 54 = 72 planned observations.
{
  const m = DURABILITY36_BLOCKS['mountain-armor'], j = DURABILITY36_BLOCKS['jungle-ladder'];
  assert(m.cells.length === 6, `armor block: expected 6 cells, got ${m.cells.length}`);
  assert(j.cells.length === 18, `ladder block: expected 18 cells, got ${j.cells.length}`);
  assert(m.cells.length * DURABILITY36_ARMOR_SEEDS.length === 18, 'armor block plans 18 observations');
  assert(j.cells.length * DURABILITY36_LADDER_SEEDS.length === 54, 'ladder block plans 54 observations');
  for (const b of [m, j]) {
    assert(b.durationMs === 300_000, 'window drift');
    assert(new Set(b.cells.map((c) => c.id)).size === b.cells.length, 'duplicate cell id');
    for (const c of b.cells) assert(!!c.treatment, `${c.id} declares no treatment`);
  }
  // Block M reuses D35's seeds on purpose; Block J draws fresh ones.
  assert(DURABILITY36_ARMOR_SEEDS.join(',') === '75011,77003,79001', 'armor block must revisit D35 seeds');
  assert(DURABILITY36_LADDER_SEEDS.every((s) => !DURABILITY36_ARMOR_SEEDS.includes(s as never)),
    'the ladder block draws fresh seeds');
}

// ── Block M: exactly one item differs, on the adopted enemy baseline.
{
  const block = DURABILITY36_BLOCKS['mountain-armor'];
  const byCtx = new Map<string, Record<string, (typeof block.cells)[number]>>();
  for (const c of block.cells) {
    const k = `${c.className}|${c.nodeId}`;
    byCtx.set(k, { ...(byCtx.get(k) ?? {}), [c.treatment]: c });
  }
  assert(byCtx.size === 3, `three residual contexts, got ${byCtx.size}`);
  const contexts = [...byCtx.keys()].sort();
  assert(contexts.join(' ') === 'apprentice|node-t1-mountain-01 apprentice|node-t1-mountain-02 slinger|node-t1-mountain-01',
    `contexts drifted: ${contexts.join(' ')}`);

  for (const [k, p] of byCtx) {
    const ref = p['reference'], loc = p['local-armor'];
    assert(!!ref && !!loc, `${k}: both arms required`);
    assert(ref.build.gearItemIds.armor === DURABILITY36_ARMOR_ARMS.reference, `${k}: reference armor`);
    assert(loc.build.gearItemIds.armor === DURABILITY36_ARMOR_ARMS.localArmor, `${k}: local armor`);
    // ONLY the armor slot may move.
    for (const slot of ['weapon', 'recovery', 'mobility'] as const) {
      assert(ref.build.gearItemIds[slot] === loc.build.gearItemIds[slot], `${k}: ${slot} must not move`);
    }
    assert(ref.upgradeLevel === loc.upgradeLevel && ref.upgradeLevel === 3, `${k}: both arms stay +3`);
    assert(JSON.stringify(ref.guards) === JSON.stringify(loc.guards), `${k}: guards must match`);
    assert(JSON.stringify(ref.build.skillPath) === JSON.stringify(loc.build.skillPath), `${k}: skill path must match`);
  }

  // Both arms sit on the ADOPTED enemy baseline; this block has no monster contrast.
  for (const id of ['ridge-archer', 'cliff-hopper']) {
    assert(MONSTER_DATABASE.get(id)!.stats.attack === 40, `${id}: Block M requires the adopted 40`);
  }

  // The substitution is a WHOLE armor swap, not an isolated guard-potency probe,
  // and the plate is not a damage-cap item.
  const swamp = ITEM_DATABASE.get('swamp-vest-t1')!, plate = ITEM_DATABASE.get('mountain-vest-t1')!;
  const eff = (i: typeof swamp) => (i as unknown as { mechanicEffects?: Record<string, number> }).mechanicEffects ?? {};
  assert('defense.dot-resistance' in eff(swamp), 'the reference armor carries DoT resistance');
  assert('guard.potency-pct' in eff(plate), 'the local armor carries guard potency');
  assert(!('defense.damage-cap' in eff(plate)), 'the plate is NOT a damage-cap item');
  const mods = (i: typeof swamp) => (i as unknown as { statModifiers?: Record<string, number> }).statModifiers ?? {};
  assert(mods(plate).maxHp > mods(swamp).maxHp && (mods(plate).plating ?? 0) > (mods(swamp).plating ?? 0),
    'the plate also moves HP and plating, so this is the whole item');

  // Acquisition boundary: this is a post-acquisition farming adaptation.
  assert(RECIPE_DATABASE.get('mountain-vest-t1')!.requiredBiomeLevel === 2,
    'the plate recipe needs Mountain level 2, so it is not owned on first entry');
}

// ── Block J: one configuration per tier, comparable modifier roles.
{
  const block = DURABILITY36_BLOCKS['jungle-ladder'];
  for (const tier of [2, 3, 4] as const) {
    const cells = block.cells.filter((c) => c.tier === tier);
    assert(cells.length === 6, `tier ${tier}: six roots, got ${cells.length}`);
    assert(new Set(cells.map((c) => c.className)).size === 6, `tier ${tier}: roots must be distinct`);
    assert(cells.every((c) => c.nodeId === DURABILITY36_LADDER_NODES[tier]), `tier ${tier}: node drift`);
    assert(cells.every((c) => c.treatment === `tier-${tier}`), `tier ${tier}: one configuration per tier`);
    assert(cells.every((c) => c.targetTypes.includes(DURABILITY36_LINEAGE[tier])), `tier ${tier}: lineage exposure`);
    // Tier-legal builds, not a single template granted future layers.
    assert(cells.every((c) => c.build.playerTier === tier && c.build.gearTier === tier), `tier ${tier}: build tier`);
  }
  // The modifier role must actually match across tiers; the suffix is not proof.
  const modifiers = ([2, 3, 4] as const).map(
    (t) => (NODE_BIOMES[DURABILITY36_LADDER_NODES[t]] as { modifier?: string }).modifier);
  assert(new Set(modifiers).size === 1, `ladder needs matched modifier roles, got ${modifiers.join(',')}`);
  // Deeper skill paths at higher tiers, not identical templates.
  const depth = (t: 2 | 3 | 4) => block.cells.find((c) => c.tier === t)!.build.skillPath.length;
  assert(depth(2) < depth(3) && depth(3) <= depth(4), 'skill paths must deepen with tier');
}

// ── The T4 overlay: HP-only, restored, and never applied twice.
{
  const snapshot = () => JSON.stringify([...MONSTER_DATABASE.entries()].map(([k, v]) => [k, v.stats.hp, v.stats.attack]));
  const baseline = snapshot();
  const block = DURABILITY36_BLOCKS['jungle-ladder'];

  for (const tier of [2, 3] as const) {
    const o = installDurability36Treatment(block.cells.find((c) => c.tier === tier)!);
    assert(o.changes.length === 0, `tier ${tier} must carry no overlay`);
    o.restore();
    assert(snapshot() === baseline, `tier ${tier} restore`);
  }

  const t4 = installDurability36Treatment(block.cells.find((c) => c.tier === 4)!);
  for (const [type, [, after]] of Object.entries(DURABILITY34_JUNGLE_HP)) {
    assert(MONSTER_DATABASE.get(type)!.stats.hp === after, `${type}: the retained value must be active at tier 4`);
  }
  assert(t4.changes.every((c) => c.beforeAttack === c.afterAttack), 'the Jungle package is HP-only');
  // REBASED 2026-09-18. Durability36's own T4 overlay is retired: the adopted Jungle
  // ladder SUPERSEDED the 2900/3400 this block ran, so the installer now takes its
  // already-integrated path and this block's cells fight authored source. The fast
  // bodies are no longer untouched either — the adopted ladder raises them too, far
  // less than the durable roles. The frozen D36 run stays valid at its own revision.
  assert(MONSTER_DATABASE.get('hunting-panther')!.stats.hp === 2400, 'fast bodies move far less than durable roles');
  t4.restore();
  assert(snapshot() === baseline, 'tier 4 restore');

  const thrown = installDurability36Treatment(block.cells.find((c) => c.tier === 4)!);
  try { throw new Error('simulated failure'); } catch { thrown.restore(); }
  assert(snapshot() === baseline, 'restore must survive a failed observation');

  // Block M never overlays a monster.
  const m = installDurability36Treatment(DURABILITY36_BLOCKS['mountain-armor'].cells[0]);
  assert(m.changes.length === 0, 'Block M overlays nothing; its treatment is the armor slot');
  m.restore();
  assert(snapshot() === baseline, 'armor block restore');
}

console.log('durability36Matrix: ok');
