/**
 * Flavor progression (design §22.7, §22.10): an ability's NAME deepens with its
 * rows, through the one entry point `abilityDisplayName`, and nothing is authored
 * per ability.
 *
 * Every (ability, row combination) is walked — every packet option or none, every
 * amplifier option (on the active route or left on another, inert) or none, every
 * keystone verb (live or a silhouette) or none, every cross option or none — and
 * every one must yield a name that is non-empty, number-free and well formed, in
 * every form a surface shows.
 */
import {
  ABILITY_DATABASE,
  abilityDisplayName,
  abilityLineageLine,
  type AbilityNameForm,
} from '../../abilities';
import { MAX_LINEAGE_TIER } from '../lineages/magnitudes';
import { ABILITY_KEYSTONE_DEFINITIONS, ABILITY_NODE_DATABASE, abilityKeystoneDefinition, abilityNodeOptionsForRow } from './index';
import {
  ABILITY_KEYSTONE_SILHOUETTES, abilityActiveRows, abilityIconLayers, abilityNodeNameParts,
  type AbilityIconLayer,
} from './flavor';
import type { AbilityNodeOption, AbilityNodeProgress, AbilityNodeRow } from './types';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const FORMS: readonly AbilityNameForm[] = ['full', 'noun', 'plain'];

/** Every choice a row offers, plus leaving it empty. */
function choices(options: readonly AbilityNodeOption[]): (AbilityNodeOption | undefined)[] {
  return [undefined, ...options];
}

function progressOf(picks: Partial<Record<AbilityNodeRow, AbilityNodeOption | undefined>>): AbilityNodeProgress {
  const progress: AbilityNodeProgress = { owned: [], active: {} };
  for (const [row, option] of Object.entries(picks) as [AbilityNodeRow, AbilityNodeOption | undefined][]) {
    if (!option) continue;
    progress.owned.push(option.id);
    progress.active[row] = option.id;
  }
  return progress;
}

// ─── Every combination names the ability ─────────────────────────────────────

{
  let combinations = 0;
  assert(ABILITY_NODE_DATABASE.size === 19, `the roster is 19 abilities, got ${ABILITY_NODE_DATABASE.size}`);
  for (const tree of ABILITY_NODE_DATABASE.values()) {
    const ability = ABILITY_DATABASE.get(tree.abilityId)!;
    const tiers = [...new Set([ability.tier, MAX_LINEAGE_TIER, 8])];
    for (const packet of choices(abilityNodeOptionsForRow(tree, 'packet'))) {
      for (const amplifier of choices(abilityNodeOptionsForRow(tree, 'amplifier'))) {
        for (const keystone of choices(abilityNodeOptionsForRow(tree, 'keystone'))) {
          for (const cross of choices(abilityNodeOptionsForRow(tree, 'cross'))) {
            combinations++;
            const progress = progressOf({ packet, amplifier, keystone, cross });
            const parts = abilityNodeNameParts(tree.abilityId, progress);
            for (const tier of tiers) {
              for (const form of FORMS) {
                const name = abilityDisplayName(ability, tier, parts, form);
                const where = `${tree.abilityId} [${progress.owned.join(', ') || 'no rows'}] T${tier} ${form}`;
                assert(name.trim().length > 0, `${where}: an empty name`);
                assert(!/\d/.test(name), `${where}: a number in the name: "${name}"`);
                assert(!/undefined|null|NaN/.test(name), `${where}: a missing word in "${name}"`);
                assert(name === name.trim() && !/\s{2}/.test(name), `${where}: stray spacing in "${name}"`);
                assert(/^[A-Z]/.test(name), `${where}: the name starts with a capital: "${name}"`);
              }
            }

            // A live verb renames the ability outright; a silhouette renames nothing.
            const verb = keystone?.keystone ? abilityKeystoneDefinition(keystone.keystone) : undefined;
            const plain = abilityDisplayName(ability, ability.tier, parts, 'plain');
            if (verb?.live) {
              assert(plain === verb.name, `${tree.abilityId}: ${verb.name} renames it, got "${plain}"`);
              assert(abilityLineageLine(ability, parts) === ability.name,
                `${tree.abilityId}: "${ability.name}" is the lineage line under ${verb.name}`);
            } else {
              assert(plain === ability.name, `${tree.abilityId}: no live verb, its own name, got "${plain}"`);
              assert(abilityLineageLine(ability, parts) === undefined, `${tree.abilityId}: no rename, no lineage line`);
            }

            // Words only for rows that do something.
            const rows = abilityActiveRows(tree.abilityId, progress);
            assert(!parts.of || !!rows.amplifier, `${tree.abilityId}: an "of X" with no amplifier on the active route`);
            assert(!parts.with || !!rows.cross, `${tree.abilityId}: a "with Y" with no cross off the packet's lane`);
            assert(!parts.adjective || !!rows.packet, `${tree.abilityId}: an adjective with no packet`);
          }
        }
      }
    }
  }
  assert(combinations > 1000, `walked too few combinations (${combinations})`);
}

// ─── The forms (design §22.10: the hotbar the noun, the tooltip the whole name) ─

{
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const tree = ABILITY_NODE_DATABASE.get('sweep')!;
  const find = (row: AbilityNodeRow, test: (o: AbilityNodeOption) => boolean): AbilityNodeOption => {
    const option = abilityNodeOptionsForRow(tree, row).find(test);
    if (!option) throw new Error(`sweep has no ${row} option for the test`);
    return option;
  };
  const packet = find('packet', (o) => o.lane === 'affliction');
  const amplifier = find('amplifier', (o) => o.lane === 'affliction' && o.amplifies === 'targets');
  const keystone = find('keystone', (o) => o.keystone === 'whirlwind');
  const cross = find('cross', (o) => o.lane === 'tempo');
  const parts = abilityNodeNameParts('sweep', progressOf({ packet, amplifier, keystone, cross }));
  const tier = sweep.tier;
  assert(abilityDisplayName(sweep, tier, parts) === 'Bleeding Whirlwind of Many I, with Echoes',
    `the whole name, got "${abilityDisplayName(sweep, tier, parts)}"`);
  assert(abilityDisplayName(sweep, tier, parts, 'noun') === 'Whirlwind I', 'the hotbar shows the noun and the rank');
  assert(abilityDisplayName(sweep, tier, parts, 'plain') === 'Whirlwind', 'running copy shows the noun alone');
  assert(abilityDisplayName(sweep, tier, {}, 'noun') === 'Sweep I', 'no rows: the ability and its rank');
  assert(abilityDisplayName(sweep, tier + 2) === 'Sweep III', 'the rank numeral stays after the name');
}

// ─── Icons: the layer list is a pure function of (ability, active rows) ──────

{
  const ORDER: AbilityIconLayer['kind'][] = [
    'base', 'lane-frame', 'cross-edge', 'keystone-border', 'keystone-glyph', 'axis-glyph',
  ];
  let combinations = 0;
  for (const tree of ABILITY_NODE_DATABASE.values()) {
    const ability = ABILITY_DATABASE.get(tree.abilityId)!;
    for (const packet of choices(abilityNodeOptionsForRow(tree, 'packet'))) {
      for (const amplifier of choices(abilityNodeOptionsForRow(tree, 'amplifier'))) {
        for (const keystone of choices(abilityNodeOptionsForRow(tree, 'keystone'))) {
          for (const cross of choices(abilityNodeOptionsForRow(tree, 'cross'))) {
            combinations++;
            const progress = progressOf({ packet, amplifier, keystone, cross });
            const layers = abilityIconLayers(tree.abilityId, progress);
            const where = `${tree.abilityId} [${progress.owned.join(', ') || 'no rows'}]`;
            const again = abilityIconLayers(tree.abilityId, progressOf({ packet, amplifier, keystone, cross }));
            assert(JSON.stringify(layers) === JSON.stringify(again), `${where}: the same rows, the same layers`);
            assert(layers[0]?.kind === 'base' && layers[0].glyph === (ability.icon?.trim() || ability.id),
              `${where}: the ability's own glyph is the base`);
            const kinds = layers.map((l) => l.kind);
            assert(new Set(kinds).size === kinds.length, `${where}: one layer per kind, got ${kinds.join(', ')}`);
            const ranks = kinds.map((k) => ORDER.indexOf(k));
            assert(ranks.every((r, i) => i === 0 || r > ranks[i - 1]), `${where}: layers paint bottom to top`);

            // Each row's layer exactly when its row does something.
            const rows = abilityActiveRows(tree.abilityId, progress);
            const has = (kind: AbilityIconLayer['kind']) => kinds.includes(kind);
            assert(has('lane-frame') === !!rows.packet, `${where}: a frame iff a packet`);
            assert(has('cross-edge') === !!rows.cross, `${where}: an edge iff a live cross`);
            assert(has('axis-glyph') === !!rows.amplifier, `${where}: an axis glyph iff an amplifier on the route`);
            assert(has('keystone-border') === !!rows.keystone, `${where}: a border iff a live verb`);
            assert(!has('keystone-glyph') || has('keystone-border'), `${where}: a second glyph only with the border`);
            for (const layer of layers) {
              if (layer.kind === 'lane-frame') assert(layer.lane === rows.packet?.lane, `${where}: the frame is the packet's lane`);
              if (layer.kind === 'cross-edge') assert(layer.lane === rows.cross?.lane, `${where}: the edge is the borrowed lane`);
              if (layer.kind === 'axis-glyph') assert(layer.axis === rows.amplifier?.amplifies, `${where}: the glyph is the axis`);
              if (layer.kind === 'keystone-glyph') {
                assert(ABILITY_KEYSTONE_SILHOUETTES.get(layer.keystone) === layer.silhouette, `${where}: the verb's own silhouette`);
              }
            }
          }
        }
      }
    }
  }
  assert(combinations > 1000, `walked too few icon combinations (${combinations})`);

  // Every first verb (§22.4, §22.8) has a silhouette; a silhouette names only an authored verb.
  for (const verb of ABILITY_KEYSTONE_DEFINITIONS.values()) {
    if (verb.verb === 1) assert(ABILITY_KEYSTONE_SILHOUETTES.has(verb.id), `${verb.name} has no silhouette`);
  }
  for (const id of ABILITY_KEYSTONE_SILHOUETTES.keys()) {
    assert(ABILITY_KEYSTONE_DEFINITIONS.has(id), `a silhouette for an unknown verb '${id}'`);
  }

  // The worked example, layer by layer.
  const tree = ABILITY_NODE_DATABASE.get('sweep')!;
  const find = (row: AbilityNodeRow, test: (o: AbilityNodeOption) => boolean): AbilityNodeOption =>
    abilityNodeOptionsForRow(tree, row).find(test)!;
  const packet = find('packet', (o) => o.lane === 'affliction');
  const amplifier = find('amplifier', (o) => o.lane === 'affliction' && o.amplifies === 'targets');
  const keystone = find('keystone', (o) => o.keystone === 'whirlwind');
  const cross = find('cross', (o) => o.lane === 'tempo');
  assert(JSON.stringify(abilityIconLayers('sweep', undefined)) === JSON.stringify([{ kind: 'base', glyph: 'sweep' }]),
    'no rows: the base glyph alone');
  const full = abilityIconLayers('sweep', progressOf({ packet, amplifier, keystone, cross }));
  assert(JSON.stringify(full) === JSON.stringify([
    { kind: 'base', glyph: 'sweep' },
    { kind: 'lane-frame', lane: 'affliction' },
    { kind: 'cross-edge', lane: 'tempo' },
    { kind: 'keystone-border', lane: keystone.lane, keystone: 'whirlwind' },
    { kind: 'keystone-glyph', keystone: 'whirlwind', silhouette: 'spin' },
    { kind: 'axis-glyph', axis: 'targets' },
  ]), `Bleeding Whirlwind of Many, with Echoes, layer by layer: ${JSON.stringify(full)}`);
  assert(abilityIconLayers('no-such-ability', undefined).length === 0, 'an unknown ability composes nothing');
}

console.log('abilityNodes/flavor: ok');
