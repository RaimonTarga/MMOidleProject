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
import { ABILITY_NODE_DATABASE, abilityKeystoneDefinition, abilityNodeOptionsForRow } from './index';
import { abilityActiveRows, abilityNodeNameParts } from './flavor';
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

console.log('abilityNodes/flavor: ok');
