import assert from 'node:assert/strict';
import { SKILL_TREE } from '@mmo-idle/shared';
import { PACKAGE_FIT_CELLS } from './playerPackageFitSpec';
import { SURVEY_CLASSES } from './ttkSurveySpec';
import type { Night5Cell } from './night5Spec';

export interface BreadthCell extends Night5Cell {
  identityId: string;
  frame: 'light' | 'balanced' | 'heavy';
  pathName: string;
  range: string | null;
  playerTreatment: 'untreated' | 'reconstruction-r1';
  controlCaseId: string | null;
  preparationNotes: string[];
}
const frames = ['light', 'balanced', 'heavy'] as const;
const fastWeapon = (tier: number) => ['','', 'jungle-stinger-rapier', 'jungle-venomthorn-rapier', 'jungle-deathfang-rapier'][tier];
const heavyWeapon = (tier: number) => ['','', 'quake-hammer', 'mountain-avalanche-maul', 'mountain-warmaul'][tier];

function build(tier: number, root: typeof SURVEY_CLASSES[number], frame: BreadthCell['frame'], path: string | null, far = false): BreadthCell[] {
  const pathId = path ? `${root.prefix}-${frame}-t3-${path}` : null;
  const node = SKILL_TREE.get(pathId ?? `${root.prefix}-${frame}`)!;
  assert(node && !node.description.includes('[Placeholder]'));
  const closeException = pathId === 'reload-balanced-t3-b' || pathId === 'summoner-heavy-t3-b';
  const range = tier < 3 ? null : far ? 'far' : root.melee || closeException ? 'close' : 'mid';
  const identityId = `breadth-t${tier}-${root.name}-${frame}${path ? '-'+path : ''}${far ? '-far' : ''}`;
  return (['farm', 'boss'] as const).map(role => {
    const cell = structuredClone(PACKAGE_FIT_CELLS.find(c => c.tier === tier && c.className === root.name && c.role === role)!) as BreadthCell;
    Object.assign(cell, { identityId, frame, range, pathName: node.name, playerTreatment: 'untreated', controlCaseId: null });
    cell.id = `${identityId}-${role}`; cell.build.id = cell.id;
    cell.build.skillPath = [`${root.prefix}-root`, `${root.prefix}-${frame}`,
      ...(range ? [`${root.prefix}-range-${range}`] : []), ...(pathId ? [pathId] : [])];
    const notes = cell.preparationNotes = [node.description,
      'Mature reachable biome caps; +5 where authored upgrades permit; full owner HP/barrier; production fresh summons; no rites.',
      'Ordered abilities use production triggers. Only declared target-casting Brace replaces its low-HP default.',
      'Historical starting point: package-fit-r1 balanced reference; frame/path changes are new packages, not historical reuses.'];
    let weapon = cell.build.gearItemIds.weapon!;
    // Frame delivery, then individually inspected path exceptions. No outcome search.
    if (root.name === 'striker') weapon = frame === 'heavy' ? heavyWeapon(tier) : fastWeapon(tier);
    if (root.name === 'squire') weapon = frame === 'light' ? fastWeapon(tier) : heavyWeapon(tier);
    if (root.name === 'apprentice') weapon = frame === 'light' ? fastWeapon(tier) : cell.build.gearItemIds.weapon!;
    if (root.name === 'conduit' || root.name === 'slinger') weapon = fastWeapon(tier);
    if (root.name === 'spirit') weapon = frame === 'light' ? fastWeapon(tier) : cell.build.gearItemIds.weapon!;
    const onHitPath = ['cadence-light-t3-a', 'cooldown-heavy-t3-c', 'reload-balanced-t3-c', 'reload-heavy-t3-a', 'energy-light-t3-c'].includes(pathId ?? '');
    if (onHitPath) { weapon = fastWeapon(tier); notes.push('Authored flat/on-hit or channel delivery: Deathfang supplies actual on-hit magnitude; Catalyst amplifies it.'); }
    if (['reload-light-t3-c', 'energy-light-t3-b', 'energy-heavy-t3-c', 'dot-heavy-t3-c'].includes(pathId ?? '')) {
      weapon = 'mountain-earthsunder-maul'; notes.push('Fixed cadence, attack bonus, or long-lived Attack-scaled DoT makes high base Attack credible despite slow weapon cadence.');
    }
    if (['cooldown-heavy-t3-b', 'energy-balanced-t3-b', 'cadence-heavy-t3-b'].includes(pathId ?? '')) {
      weapon = 'mountain-warmaul'; notes.push('Empowered or empowered-derived payload: Warmaul keeps the authored empowered modifier.');
    }
    cell.build.gearItemIds.weapon = weapon;
    let core = tier === 2 ? 'core-tempered' : root.melee ? role === 'boss' ? 'core-duelist' : 'core-bruiser' : 'core-tempered';
    if (root.name === 'conduit') { core = 'core-survivalist'; notes.push('Survivalist funds ordinary Recovery and queue-scoped Recovery without changing payment/safety ratios.'); }
    if (tier >= 3 && root.name === 'squire' && role === 'farm' && frame !== 'light') core = 'core-arcanist';
    if (tier === 4 && (onHitPath || (root.name === 'conduit' && frame === 'light'))) core = 'core-catalyst';
    if (tier >= 3 && root.name === 'apprentice' && frame === 'light') core = 'core-accelerant';
    cell.build.gearItemIds.core = core;
    if (tier === 4) {
      let relic = frame === 'heavy' && !onHitPath ? 'relic-colossus-heart' : 'relic-equilibrium-shard';
      if (['dot-light-t3-a', 'cooldown-light-t3-a', 'reload-light-t3-b'].includes(pathId ?? '')) relic = 'relic-hastebound-dial';
      if (root.name === 'conduit') relic = frame === 'heavy' ? 'relic-colossus-heart' : 'relic-equilibrium-shard';
      cell.build.gearItemIds.relic = relic;
      notes.push(`Relic ${relic}: ${relic === 'relic-colossus-heart' ? 'concentrated potency; accepts frequency/reconstruction penalty' : relic === 'relic-hastebound-dial' ? 'frequency-driven repeats; accepts potency cost' : 'modest frequency and potency without signed penalty'}.`);
    }
    const slam = (root.name === 'squire' && frame !== 'light' && !onHitPath) || (root.name === 'apprentice' && frame !== 'light') || weapon === 'mountain-earthsunder-maul';
    if (role === 'farm') {
      const aoe = slam ? 'slam' : 'sweep';
      cell.abilities!.techniques = tier === 2 ? [aoe] : tier === 3 ? [aoe, 'frenzy'] : [aoe, 'frenzy', 'expose-weakness'];
      notes.push(`${aoe} has first offensive priority; ${slam ? 'high Attack supports direct AoE burst' : 'multiple delivery opportunities support Sweep'}.`);
    }
    // Persistent defense complements reactive Brace's demonstrated cooldown gap.
    if (role === 'boss' && tier >= 3) {
      cell.stance = 'defensive-stance';
      notes.push('Defensive stance is always active to complement, not guarantee, Brace coverage through cooldown/travel gaps. No stance switching.');
    } else notes.push('Offensive stance is always active; no stance switching.');
    if (root.name === 'conduit') {
      // Preserve the narrow historical T3 balanced-mid farm no-Orbit policy only.
      cell.runeRules = cell.runeRules!.filter(r => r.actionId !== 'orbit');
      if (!(tier === 3 && frame === 'balanced' && !far && role === 'farm') && !closeException)
        cell.runeRules.push({ conditionId: 'in-combat', actionId: 'orbit' });
      notes.push('Orbit retained except historical T3 balanced/mid farming and owner-melee Champion. Pair copies are identical.');
    }
    if (closeException || pathId === 'cooldown-heavy-t3-c' || pathId === 'reload-heavy-t3-a') {
      cell.runeRules = cell.runeRules!.filter(r => r.actionId !== 'orbit');
      notes.push(closeException ? 'Declared close-range exception supports point-blank volley or Champion owner contribution; Orbit omitted.' : 'Channel package omits Orbit to avoid unnecessary movement; telegraph escape remains.');
    }
    notes.push('Unused RP is deliberate bounded-package headroom, not a claim of optimal allocation.');
    return cell;
  });
}
const controls = [2,3,4].flatMap(t => SURVEY_CLASSES.flatMap(root => frames.flatMap(frame =>
  (t === 4 ? ['a','b','c'] : [null]).flatMap(path => build(t, root, frame, path)))));
controls.push(...frames.flatMap(frame => build(3, SURVEY_CLASSES.find(c => c.name === 'conduit')!, frame, null, true)));
const candidateIdentities = new Set([
  'breadth-t2-conduit-light', 'breadth-t2-conduit-balanced', 'breadth-t3-conduit-balanced',
  ...frames.map(f => `breadth-t3-conduit-${f}-far`),
  'breadth-t4-conduit-light-b', 'breadth-t4-conduit-light-c', 'breadth-t4-conduit-balanced-c',
]);
controls.sort((a,b)=>a.tier-b.tier || SURVEY_CLASSES.findIndex(x=>x.name===a.className)-SURVEY_CLASSES.findIndex(x=>x.name===b.className) || a.identityId.localeCompare(b.identityId) || (a.role === b.role ? 0 : a.role === 'farm' ? -1 : 1));
export const BREADTH_CELLS: BreadthCell[] = controls.flatMap(c => {
  if (!candidateIdentities.has(c.identityId)) return [c];
  const copy = structuredClone(c); copy.controlCaseId = c.id; copy.id += '-reconstruction-r1'; copy.build.id = copy.id;
  copy.playerTreatment = 'reconstruction-r1'; return [c,copy];
});
// One observation per child isolates local failures and gives control/candidate siblings stable identities.
export const BREADTH_BLOCKS = Object.fromEntries(BREADTH_CELLS.map(cell => [cell.id, { cells: [cell], durationMs: 300000, pilotIds: [cell.id] }]));
export function assertBreadthDefinitions() {
  assert.equal(controls.length, 186); assert.equal(BREADTH_CELLS.length, 204);
  assert.equal(new Set(controls.map(c => c.identityId)).size, 93);
  assert.equal(new Set(BREADTH_CELLS.map(c => c.id)).size, 204);
  for (const c of BREADTH_CELLS) {
    assert(c.build.skillPath.every(id => SKILL_TREE.has(id) && !SKILL_TREE.get(id)!.description.includes('[Placeholder]')));
    if (c.role === 'farm') assert(c.abilities!.techniques.some(id => ['slam','sweep'].includes(id)));
    else assert(c.runeRules!.some(r => r.conditionId === 'target-casting' && r.actionId === 'use-ability' && r.targetAbilityId === 'brace'));
    if (c.controlCaseId) {
      const control = controls.find(x => x.id === c.controlCaseId)!;
      const normalize = (x: BreadthCell) => ({ ...x, id: '', build: { ...x.build, id: '' }, playerTreatment: '', controlCaseId: null });
      assert.deepEqual(normalize(c), normalize(control));
    }
  }
}
