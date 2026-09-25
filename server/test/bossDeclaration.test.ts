import { referenceAbilityRules } from '@mmo-idle/shared';
import { resolveSurveyPackage, type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { BOSS1_BLOCKS } from '../bench/balance/boss1Spec';
// The checker lives beside the runners it guards, in plain JS, because the frozen
// packet's launcher is a .mjs script outside the typecheck. Importing it HERE is
// what puts it under `pnpm test` at all.
import { verifyDeclaredApplied } from '../../scripts/boss-verify.mjs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base = (over: Partial<SurveyCell> = {}): SurveyCell => ({
  id: 'fixture', className: 'striker', tier: 2, role: 'forest',
  nodeId: 'node-t2-forest-dungeon', alternate: false,
  build: {
    id: 'fixture', classRoot: 'cadence-root', contentTier: 2, playerTier: 2, gearTier: 2,
    skillPath: ['cadence-root', 'cadence-heavy'],
    gearItemIds: { weapon: 'gale-needle', armor: 'cave-vest-t2' },
  },
  ...over,
});

/** A receipt of the shape `bossScreen.ts` writes, from a resolved declaration. */
const receipt = (cell: SurveyCell, appliedOver: Record<string, unknown> = {}) => {
  const d = resolveSurveyPackage(cell);
  return {
    cell: cell.id, seed: 1,
    declaredPackage: {
      gearItemIds: { ...cell.build.gearItemIds }, upgradeLevel: d.upgradeLevel,
      stance: d.stance, abilities: d.abilities, runeRules: d.runeRules, sources: d.sources,
    },
    appliedPackage: {
      activeStance: d.stance, attunedStances: d.stance ? [d.stance] : [],
      attunedAbilities: d.abilities, runesEquipped: d.runeRules,
      equipment: { ...cell.build.gearItemIds },
      itemUpgrades: Object.fromEntries(Object.values(cell.build.gearItemIds).map((id) => [id, d.upgradeLevel])),
      ...appliedOver,
    },
    runicPoints: { budget: 30, cost: 26 },
  };
};

// -- An EXPLICIT stance is reported as explicit and is never defaulted over.
{
  const r = resolveSurveyPackage(base({ stance: 'defensive-stance' }));
  assert(r.stance === 'defensive-stance', `explicit stance drift: ${r.stance}`);
  assert(r.sources.stance === 'explicit', `explicit stance must report its provenance, got ${r.sources.stance}`);
}

// -- An OMITTED stance inherits Offensive from tier 2 and says that it inherited it.
//
// THE Boss1 defect: this case previously serialized as `stance: null` against a
// correctly applied `offensive-stance`, and failed twelve completed fights.
{
  const r = resolveSurveyPackage(base());
  assert(r.stance === 'offensive-stance', `omitted stance must resolve to the default, got ${r.stance}`);
  assert(r.sources.stance === 'preparation-default', `omitted stance provenance: ${r.sources.stance}`);
  assert(verifyDeclaredApplied(receipt(base())).length === 0,
    'a resolved default declaration must match the package preparation applies');
}

// -- An INTENTIONAL neutral stance is honoured, not defaulted.
//
// `??` could not express this: it swallowed an explicit null alongside an omitted
// field, so "this package runs no stance" and "this package did not say" were the
// same input. They are different statements and are now kept apart.
{
  const r = resolveSurveyPackage(base({ stance: null }));
  assert(r.stance === null, `an explicit neutral stance must survive, got ${r.stance}`);
  assert(r.sources.stance === 'explicit', `a neutral stance is an explicit choice, got ${r.sources.stance}`);
  assert(verifyDeclaredApplied(receipt(base({ stance: null }))).length === 0,
    'a neutral declaration matches a bot carrying no stance');
}

// -- Tier 1 admits no stance at all, which is a third case again.
{
  const r = resolveSurveyPackage(base({ tier: 1, nodeId: 'node-t1-forest-02' }));
  assert(r.stance === null && r.sources.stance === 'tier-none', `tier-1 stance: ${r.stance}/${r.sources.stance}`);
}

// -- An EXPLICIT empty rule array is a real package and is not refilled with the
// behaviour policy; it carries only its abilities' reference wiring.
{
  const r = resolveSurveyPackage(base({ runeRules: [] }));
  assert(JSON.stringify(r.runeRules) === JSON.stringify(referenceAbilityRules(r.abilities)),
    `an explicit empty rule array must carry only ability wiring, got ${JSON.stringify(r.runeRules)}`);
  assert(r.sources.runeRules === 'explicit', `empty is a declaration, got ${r.sources.runeRules}`);
  const omitted = resolveSurveyPackage(base());
  assert(omitted.runeRules.length > 0 && omitted.sources.runeRules === 'preparation-default',
    'an OMITTED rule list still inherits the survey policy');
}

// -- MUTATION CHECK. The checker must still fail on a genuine mismatch, or the fix
//    has only made the old failure invisible.
{
  const wrongStance = verifyDeclaredApplied(
    receipt(base(), { activeStance: 'defensive-stance', attunedStances: ['defensive-stance'] }),
  ) as string[];
  assert(wrongStance.length > 0, 'a bot wearing a stance it did not declare MUST be flagged');
  assert(wrongStance.some((m) => m.includes('stance')), `expected a stance divergence, got ${JSON.stringify(wrongStance)}`);

  const dropped = verifyDeclaredApplied(
    receipt(base(), { runesEquipped: [{ conditionId: 'always', actionId: 'auto-path-enemy' }] }),
  ) as string[];
  assert(dropped.length > 0, 'a dropped rune rule MUST be flagged');

  // Ordering is load-bearing: movement-channel arbitration is top-to-bottom, so a
  // reordered package is a different package at the same length. The check this
  // replaces compared only COUNTS and would have passed this.
  const declared = resolveSurveyPackage(base()).runeRules;
  const swapped = [declared[1]!, declared[0]!, ...declared.slice(2)];
  const reordered = verifyDeclaredApplied(receipt(base(), { runesEquipped: swapped })) as string[];
  assert(reordered.length > 0, 'a REORDERED rule list must be flagged; a count check would pass it');
  assert(reordered.every((m) => m.includes('rule ')), `expected ordering divergences, got ${JSON.stringify(reordered)}`);

  const raw = receipt(base());
  delete (raw.declaredPackage as { sources?: unknown }).sources;
  assert((verifyDeclaredApplied(raw) as string[]).some((m) => m.includes('provenance')),
    'a declaration serialized raw, without provenance, must be flagged');

  const overBudget = { ...receipt(base()), runicPoints: { budget: 30, cost: 31 } };
  assert((verifyDeclaredApplied(overBudget) as string[]).some((m) => m.includes('RP')),
    'an illegal RP total must be flagged');

  const wrongGear = verifyDeclaredApplied(
    receipt(base(), { equipment: { weapon: 'quake-hammer', armor: 'cave-vest-t2' } }),
  ) as string[];
  assert(wrongGear.length > 0, 'equipment that is not the declared kit must be flagged');
}

// -- The two live Boss1 blocks resolve to what their packet prescribes.
{
  for (const cell of BOSS1_BLOCKS['timberclaw']!.cells) {
    const r = resolveSurveyPackage(cell);
    assert(r.stance === 'defensive-stance' && r.sources.stance === 'explicit',
      `${cell.id}: the earlier slot states its stance explicitly`);
    const behaviour = r.runeRules.filter(rule => rule.actionId !== 'use-ability');
    assert(behaviour.length === 5, `${cell.id}: five ordered behaviour rules`);
    assert(r.runeRules.slice(0, 5).every(rule => rule.actionId !== 'use-ability'),
      `${cell.id}: ability wiring follows the prescribed rules`);
    assert(r.runeRules[1]!.actionId === 'step-back',
      `${cell.id}: Step Back must precede the movement rule`);
  }
  for (const cell of BOSS1_BLOCKS['sovereign']!.cells) {
    const r = resolveSurveyPackage(cell);
    assert(r.stance === 'offensive-stance', `${cell.id}: the later slot runs Offensive, got ${r.stance}`);
    assert(r.sources.stance === 'preparation-default',
      `${cell.id}: it INHERITS Offensive from preparation; recording that is the whole fix`);
    assert((verifyDeclaredApplied(receipt(cell)) as string[]).length === 0,
      `${cell.id}: resolved declaration must be self-consistent`);
  }
}

console.log('bossDeclaration: ok');
