import { resolveSurveyPackage, type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { BOSS1_BLOCKS } from '../bench/balance/boss1Spec';
// The checker lives beside the runners it guards, in plain JS, because the frozen
// packet's launcher is a .mjs script outside the typecheck. Importing it HERE is
// what puts it under `pnpm test` at all.
import { verifyDeclaredApplied } from '../../scripts/boss-verify.mjs';

function assert(condition: unknown, message: string): asserts condition {
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
      abilities: d.abilities, runeRules: d.runeRules, sources: d.sources,
    },
    appliedPackage: {
      attunedAbilities: d.abilities, runesEquipped: d.runeRules,
      equipment: { ...cell.build.gearItemIds },
      itemUpgrades: Object.fromEntries(Object.values(cell.build.gearItemIds).map((id) => [id, d.upgradeLevel])),
      ...appliedOver,
    },
  };
};

// -- A resolved default declaration matches the package preparation applies.
//
// THE Boss1 defect: the receipt serialized the cell's raw optional fields against
// the package preparation actually applied, and failed twelve completed fights.
{
  assert(verifyDeclaredApplied(receipt(base())).length === 0,
    'a resolved default declaration must match the package preparation applies');
}

// -- An EXPLICIT empty rule array is a real package and is not refilled with the
// behaviour policy; it carries only its abilities' reference wiring.
{
  const r = resolveSurveyPackage(base({ runeRules: [] }));
  assert(r.runeRules.length === 0,
    `an explicit empty rule array must stay empty, got ${JSON.stringify(r.runeRules)}`);
  assert(r.sources.runeRules === 'explicit', `empty is a declaration, got ${r.sources.runeRules}`);
  const omitted = resolveSurveyPackage(base());
  assert(omitted.runeRules.length > 0 && omitted.sources.runeRules === 'preparation-default',
    'an OMITTED rule list still inherits the survey policy');
}

// -- MUTATION CHECK. The checker must still fail on a genuine mismatch, or the fix
//    has only made the old failure invisible.
{
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

  const wrongGear = verifyDeclaredApplied(
    receipt(base(), { equipment: { weapon: 'quake-hammer', armor: 'cave-vest-t2' } }),
  ) as string[];
  assert(wrongGear.length > 0, 'equipment that is not the declared kit must be flagged');
}

// -- The two live Boss1 blocks resolve to what their packet prescribes.
{
  for (const cell of BOSS1_BLOCKS['timberclaw']!.cells) {
    const r = resolveSurveyPackage(cell);
    assert(r.runeRules.length === 5, `${cell.id}: five ordered behaviour rules`);
    assert(r.runeRules[1]!.actionId === 'step-back',
      `${cell.id}: Step Back must precede the movement rule`);
  }
  for (const cell of BOSS1_BLOCKS['sovereign']!.cells) {
    assert((verifyDeclaredApplied(receipt(cell)) as string[]).length === 0,
      `${cell.id}: resolved declaration must be self-consistent`);
  }
}

console.log('bossDeclaration: ok');
