/**
 * The Stats panel's model (design §26.4: a panel of its own, thesis D's dense
 * ordered layout, every number with its source, the lean's share in its lane
 * colour). Off the client model, no DOM.
 *
 * Pins: the four groups in their fixed order; every value is the server's own
 * stat formula (`previewEquipmentStats`); an item's share is "with it" minus
 * "without it"; the lean's share is marked in its lane colour; the weapon's
 * reservoir and the out-of-combat rule say where they come from; a verb row
 * says how often it can fire.
 */
import assert from 'node:assert/strict';
import {
  LEAN_COLORS, LINEAGE_DATABASE, emptyEquipment, packetDefinition, previewEquipmentStats, type CombatArchetype,
  type EquipmentPreviewInput,
} from '@mmo-idle/shared';
import { buildStatsPanel, cadenceText } from '../../client/src/ui/stats/statsPanelModel';

const dagger = LINEAGE_DATABASE.get('dagger')!;
const BASE_FORM = dagger.forms.find((f) => f.tier === 1)!.recipeId;
// The Dagger's Effect lean: it amplifies the Poison Dagger's own reservoir (§26.2).
const lean = dagger.cards.find((c) => c.id === 'dagger-t1-effect')!;
const verb = dagger.cards.find((c) => c.tier === 1 && c.row === 'payoff')!;

const build = (over: Partial<EquipmentPreviewInput> = {}): EquipmentPreviewInput => ({
  usesSkills: {
    unlockedSkills: ['reload-root'], passives: {}, selectedClass: 'reload-root',
    selectedSubVariant: null, selectedRange: null, combatArchetype: 'reload' as CombatArchetype,
  },
  equipment: { ...emptyEquipment(), weapon: BASE_FORM, armor: 'forest-vest-t1', recovery: 'swamp-charm-t1' },
  itemUpgrades: {},
  playerTier: 1,
  hpFraction: 1,
  lineages: {
    dagger: {
      ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id },
      ownedForms: [BASE_FORM], wornForm: BASE_FORM,
    },
  },
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

// ── Sources: items by "with minus without", the lean in its lane colour ──────
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

  assert.equal(data.lean?.name, lean.name, 'the active lean is named at the top');
  // The trio's own colour (design §26.4, 2026-10-06), not the shard's lane.
  const laneColor = LEAN_COLORS[lean.leanKind!];
  assert.notEqual(laneColor, packetDefinition(lean.lane)!.color, 'the trio colour is not the lane colour');
  assert.equal(data.lean?.color, laneColor, 'in the trio colour');
  const leanShares = data.groups.flatMap((g) => g.rows).flatMap((r) => r.sources).filter((s) => s.kind === 'lean');
  assert.ok(leanShares.length > 0, 'the lean moves at least one number, and says so');
  assert.ok(leanShares.every((s) => s.color === laneColor && s.label.includes(lean.name)), 'its share in its lane colour');
  const potency = row(data, 'reservoirPotency')!;
  assert.equal(potency.label, 'Poison potency', 'the Effect lean reads as the reservoir it amplifies');
  assert.equal(potency.value, '+10%', 'rank I: +10% (PROVISIONAL, A\'s table)');
  assert.deepEqual(potency.sources.map((s) => [s.kind, s.amount]), [['lean', '+10%']], 'all of it the lean\'s');
  assert.equal(row(data, 'bleedOnHit'), undefined, 'a reservoir weapon writes no light bleed (one DoT record)');
  const rankIII = buildStatsPanel({ build: build({ lineages: { dagger: {
    ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id },
    ownedForms: [BASE_FORM], wornForm: BASE_FORM, ranks: { [lean.id]: 3 },
  } } }) });
  assert.equal(row(rankIII, 'reservoirPotency')?.value, '+20%', 'rank III: +20%');
  assert.equal(rankIII.lean?.rank, 'rank III of III');

  // No lean: no lean line, no lean share.
  const bare = buildStatsPanel({ build: build({ lineages: {} }) });
  assert.equal(bare.lean, undefined);
  assert.ok(!bare.groups.flatMap((g) => g.rows).flatMap((r) => r.sources).some((s) => s.kind === 'lean'));
}

// ── Rules and rhythm ─────────────────────────────────────────────────────────
{
  const data = buildStatsPanel({ build: build() });
  const reservoir = row(data, 'reservoir');
  assert.ok(reservoir, 'the Poison Dagger\'s reservoir is on the panel');
  assert.equal(reservoir!.label, 'Poison per hit');
  assert.ok(reservoir!.sources[0].label.includes('Poison Dagger'), 'and says whose it is');
  assert.equal(row(data, 'outOfCombat')?.sources[0].label, 'fixed, of your pool');

  const rhythm = data.groups.find((g) => g.key === 'rhythm')!;
  const verbRow = rhythm.rows.find((r) => r.key === `verb:${verb.id}`);
  assert.ok(verbRow, 'the active verb has a rhythm row');
  assert.equal(verbRow!.label, verb.name);
  assert.ok(verbRow!.sources[0].label.length > 0, 'saying how often it can fire');

  // On a weapon with no mechanic of its own, Effect is the verb's payload size.
  const rapier = LINEAGE_DATABASE.get('rapier')!;
  const rapierForm = rapier.forms.find((f) => f.tier === 1)!.recipeId;
  const effect = rapier.cards.find((c) => c.id === 'rapier-t1-effect')!;
  const flurry = rapier.cards.find((c) => c.tier === 1 && c.row === 'payoff')!;
  const rapierData = buildStatsPanel({ build: build({
    usesSkills: {
      unlockedSkills: ['cadence-root'], passives: {}, selectedClass: 'cadence-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'cadence' as CombatArchetype,
    },
    equipment: { ...emptyEquipment(), weapon: rapierForm },
    lineages: { rapier: {
      ownedCards: [effect.id, flurry.id], active: { stat: effect.id, payoff: flurry.id },
      ownedForms: [rapierForm], wornForm: rapierForm,
    } },
  }) });
  const flurryRow = row(rapierData, `verb:${flurry.id}`)!;
  const payload = flurryRow.sources.find((s) => s.kind === 'lean');
  assert.ok(payload && payload.amount === '+10%' && payload.label.includes(effect.name),
    `the Rapier's Effect lean shows as the verb's payload share, got ${JSON.stringify(flurryRow.sources)}`);

  assert.equal(cadenceText({
    key: 'x', name: 'X', lane: 'tempo', trigger: { kind: 'hit-nth', n: 6 }, shape: 'count',
    payoff: 'echo-hit', payloadLane: 'tempo', source: 'card',
  }), 'every 6th hit');
  assert.equal(cadenceText({
    key: 'x', name: 'X', lane: 'affliction', trigger: { kind: 'hit-afflicted', capMs: 5_000 }, shape: 'cap',
    payoff: 'redose', payloadLane: 'affliction', source: 'card',
  }), 'every 5 s at most');

  // A barrier pool, which the preview does not model, shows with its source.
  const barred = buildStatsPanel({ build: build(), barrierMax: 40 });
  assert.equal(row(barred, 'barrier')?.value, '40');
  assert.equal(row(data, 'barrier'), undefined, 'and hides at zero');
}

// ── A bare character: rows hold, no sources invented ─────────────────────────
{
  const bare = buildStatsPanel({ build: build({ equipment: emptyEquipment(), lineages: {} }) });
  const attack = row(bare, 'attack')!;
  assert.ok(attack.sources.every((s) => s.kind !== 'item'), 'no item, no item source');
  assert.equal(row(bare, 'reservoir'), undefined, 'no weapon, no reservoir');
  assert.equal(bare.groups.find((g) => g.key === 'rhythm')!.rows.filter((r) => r.key.startsWith('verb:')).length, 0);
}

console.log('statsPanel: ok');
