import assert from 'node:assert/strict';
import { FAST_PASS_CELLS, FAST_PASS_CAP_MS } from './playerFastPassSpec';
import type { Night5Cell } from './night5Spec';

/** Sealed reference-package revision. No production treatments or outcome search. */
export const PACKAGE_FIT_CELLS: Night5Cell[] = FAST_PASS_CELLS.map(original => {
  const c = structuredClone(original);
  c.id = original.id.replace('pfp-', 'pfit-r1-');
  c.build.id = c.id;
  if (c.role === 'farm') {
    const aoe = ['squire', 'apprentice'].includes(c.className) ? 'slam' : 'sweep';
    c.abilities!.techniques = c.tier === 2 ? [aoe] : c.tier === 3
      ? ['frenzy', aoe] : ['frenzy', aoe, 'expose-weakness'];
    // One focused behavior delta, confined to the failing T3 farming context.
    if (c.tier === 3 && c.className === 'conduit') {
      c.runeRules = c.runeRules!.filter(r => r.actionId !== 'orbit');
    }
  } else {
    c.runeRules!.push({ conditionId: 'target-casting', actionId: 'use-ability', targetAbilityId: 'brace' });
    if (!['striker', 'squire'].includes(c.className)) {
      // T2 needs one RP; Power Strike is the existing single-target cast option.
      if (c.tier === 2) c.abilities!.techniques = ['power-strike'];
      // T3 needs two RP. Keep the targeted offensive channel and all safety rules.
      if (c.tier === 3) c.abilities!.techniques = ['expose-weakness'];
    }
  }
  return c;
});
export const PACKAGE_FIT_BLOCKS = Object.fromEntries([2, 3, 4].flatMap(tier => ['farm', 'boss'].map(role => {
  const cells = PACKAGE_FIT_CELLS.filter(c => c.tier === tier && c.role === role);
  return [`t${tier}-${role}`, { cells, durationMs: FAST_PASS_CAP_MS,
    pilotIds: cells.filter(c => c.className === (role === 'farm' ? 'apprentice' : 'squire')).map(c => c.id) }];
})));
export function assertPackageFitDefinitions() {
  assert.equal(PACKAGE_FIT_CELLS.length, 36);
  assert.equal(new Set(PACKAGE_FIT_CELLS.map(c => c.id)).size, 36);
  for (const c of PACKAGE_FIT_CELLS) {
    assert.equal(c.stance, 'offensive-stance');
    if (c.role === 'boss') assert(c.runeRules!.some(r => r.conditionId === 'target-casting' && r.actionId === 'use-ability' && r.targetAbilityId === 'brace'));
    else assert(c.abilities!.techniques.some(a => a === 'slam' || a === 'sweep'));
  }
}
