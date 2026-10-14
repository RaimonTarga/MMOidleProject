import assert from 'node:assert/strict';
import { ITEM_DATABASE, emptyEquipment, previewEquipmentStats, type CombatArchetype } from '@mmo-idle/shared';
import { buildStatSheet, type StatSheetBuild } from '../../client/src/ui/inventory/statSheetModel';
import { formatMechanicEffectEntries, formatMechanicEffects } from '../../client/src/ui/crafting/itemDisplay';

const build = (equipment: Partial<ReturnType<typeof emptyEquipment>>): StatSheetBuild => ({
  usesSkills: {
    unlockedSkills: ['cadence-root'], passives: {}, selectedClass: 'cadence-root',
    selectedSubVariant: null, selectedRange: 'melee', combatArchetype: 'cadence' as CombatArchetype,
  },
  equipment: { ...emptyEquipment(), ...equipment },
  itemUpgrades: {},
  playerTier: 2,
  hpFraction: 1,
});

// Nothing selected: the character sheet, no deltas.
const character = buildStatSheet(build({ weapon: 'chaotic-axe' }), null);
assert.equal(character.mode, 'character');
assert.ok(character.rows.every((row) => !row.changed));

// An equipped item reports what it contributes: with it vs without it.
const contribution = buildStatSheet(build({ weapon: 'chaotic-axe' }), 'chaotic-axe');
assert.equal(contribution.mode, 'contribution');
assert.ok(contribution.dps.after > contribution.dps.before, 'the equipped weapon adds DPS');
assert.ok(contribution.rows.some((row) => row.def.key === 'attack' && row.changed && row.direction === 1));

// A bag item compares against what it replaces, and names it.
const rapier = [...ITEM_DATABASE.values()].find((item) => item.slot === 'weapon' && item.id !== 'chaotic-axe' && item.tier === 1);
assert.ok(rapier, 'fixture: a second T1 weapon');
const swap = buildStatSheet(build({ weapon: 'chaotic-axe' }), rapier.id);
assert.equal(swap.mode, 'swap');
assert.equal(swap.replacesId, 'chaotic-axe');
assert.ok(swap.effects.lost.some((line) => /dead swing/i.test(line)), 'swapping away names the lost dead swing');

// Pinned stats stay on the sheet in every mode, so rows never jump.
for (const sheet of [character, contribution, swap]) {
  for (const key of ['attack', 'attacksPerSecond', 'maxHp', 'damageReduction']) {
    assert.ok(sheet.rows.some((row) => row.def.key === key), `${sheet.mode} keeps ${key}`);
  }
}

// Effect accounting is measured, not labelled: a final-damage core moves DPS.
const core = buildStatSheet(build({ weapon: 'chaotic-axe' }), 'core-tempered');
assert.ok(core.effects.counted.some((line) => /final damage/i.test(line)), 'core final damage is counted');

// The preview-only omission leaves the default path untouched.
const plain = previewEquipmentStats(build({ weapon: 'chaotic-axe', core: 'core-tempered' }));
const omitNothing = previewEquipmentStats({
  ...build({ weapon: 'chaotic-axe', core: 'core-tempered' }),
  omitItemEffects: { defId: 'core-tempered', keys: new Set() },
});
assert.deepEqual(omitNothing.stats, plain.stats);
const omitted = previewEquipmentStats({
  ...build({ weapon: 'chaotic-axe', core: 'core-tempered' }),
  omitItemEffects: { defId: 'core-tempered', keys: new Set(['core.damage-dealt-pct']) },
});
assert.ok(omitted.stats.dps < plain.stats.dps, 'omitting the core final-damage key lowers DPS');

// Keyed entries render exactly the text the old formatter did.
for (const item of ITEM_DATABASE.values()) {
  assert.deepEqual(
    formatMechanicEffectEntries(item.mechanicEffects).map((entry) => entry.text),
    formatMechanicEffects(item.mechanicEffects),
    item.id,
  );
}

console.log('inventoryStatSheet: ok');
