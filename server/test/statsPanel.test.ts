/**
 * The Stats panel's model (design §26.4: a panel of its own, thesis D's dense
 * ordered layout, every number with its source). Off the client model, no DOM.
 *
 * Pins: the four groups in their fixed order; every value is the server's own
 * stat formula (`previewEquipmentStats`); an item's share is "with it" minus
 * "without it"; the weapon's reservoir and the out-of-combat rule say where they
 * come from.
 */
import assert from 'node:assert/strict';
import {
  emptyEquipment, previewEquipmentStats, type CombatArchetype, type EquipmentPreviewInput,
} from '@mmo-idle/shared';
import { buildStatsPanel } from '../../client/src/ui/stats/statsPanelModel';

/** The Poison Dagger: a weapon with a reservoir of its own. */
const DAGGER = 'ashbrand-blade';

const build = (over: Partial<EquipmentPreviewInput> = {}): EquipmentPreviewInput => ({
  usesSkills: {
    unlockedSkills: ['reload-root'], passives: {}, selectedClass: 'reload-root',
    selectedSubVariant: null, selectedRange: null, combatArchetype: 'reload' as CombatArchetype,
  },
  equipment: { ...emptyEquipment(), weapon: DAGGER, armor: 'forest-vest-t1', recovery: 'swamp-charm-t1' },
  itemUpgrades: {},
  playerTier: 1,
  hpFraction: 1,
  ...over,
});

const row = (data: ReturnType<typeof buildStatsPanel>, key: string) => {
  for (const group of data.groups) for (const r of group.rows) if (r.key === key) return r;
  return undefined;
};

// ── The four groups, in order, values off the real formula ───────────────────
{
  const input = build();
  const data = buildStatsPanel({ build: input });
  assert.deepEqual(data.groups.map((g) => g.key), ['offence', 'defence', 'recovery', 'rhythm']);
  assert.deepEqual(data.groups.map((g) => g.title), ['Offence', 'Defence', 'Recovery', 'Movement & rhythm']);
  const truth = previewEquipmentStats(input).stats;
  assert.equal(row(data, 'attack')?.value, String(Math.round(truth.attack)), 'attack is the stat formula\'s');
  assert.equal(row(data, 'maxHp')?.value, String(Math.round(truth.maxHp)));
  assert.equal(row(data, 'speed')?.value, String(Math.round(truth.speed)));
  for (const key of ['attack', 'attacksPerSecond', 'dps', 'maxHp', 'damageReduction', 'recovery', 'speed', 'outOfCombat']) {
    assert.ok(row(data, key), `${key} is always on the panel`);
  }
}

// ── Sources: items by "with minus without" ───────────────────────────────────
{
  const input = build();
  const data = buildStatsPanel({ build: input });
  const attack = row(data, 'attack')!;
  const weaponSource = attack.sources.find((s) => s.kind === 'item');
  assert.ok(weaponSource && /Poison Dagger/.test(weaponSource.label), 'attack names the weapon');
  const without = previewEquipmentStats({ ...input, equipment: { ...input.equipment, weapon: null } }).stats.attack;
  assert.ok(Number(weaponSource!.amount!.replace('+', '')) > 0, 'with a positive share');
  assert.ok(Math.round(previewEquipmentStats(input).stats.attack - without) > 0, '(the formula agrees it adds attack)');

  const health = row(data, 'maxHp')!;
  assert.ok(health.sources.some((s) => s.kind === 'item' && /Shaded Bindings/.test(s.label)), 'health names the armour');
  assert.ok(health.sources.some((s) => s.kind === 'base'), 'and the base it started from');
  assert.equal(row(data, 'bleedOnHit'), undefined, 'a reservoir weapon writes no light bleed (one DoT record)');
}

// ── Rules ────────────────────────────────────────────────────────────────────
{
  const data = buildStatsPanel({ build: build() });
  const reservoir = row(data, 'reservoir');
  assert.ok(reservoir, 'the Poison Dagger\'s reservoir is on the panel');
  assert.equal(reservoir!.label, 'Poison per hit');
  assert.ok(reservoir!.sources[0].label.includes('Poison Dagger'), 'and says whose it is');
  assert.equal(row(data, 'outOfCombat')?.sources[0].label, 'fixed, of your pool');

  // A barrier pool, which the preview does not model, shows with its source.
  const barred = buildStatsPanel({ build: build(), barrierMax: 40 });
  assert.equal(row(barred, 'barrier')?.value, '40');
  assert.equal(row(data, 'barrier'), undefined, 'and hides at zero');
}

// ── A bare character: rows hold, no sources invented ─────────────────────────
{
  const bare = buildStatsPanel({ build: build({ equipment: emptyEquipment() }) });
  const attack = row(bare, 'attack')!;
  assert.ok(attack.sources.every((s) => s.kind !== 'item'), 'no item, no item source');
  assert.equal(row(bare, 'reservoir'), undefined, 'no weapon, no reservoir');
}

console.log('statsPanel: ok');
