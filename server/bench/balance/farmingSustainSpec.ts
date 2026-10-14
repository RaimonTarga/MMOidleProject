import assert from 'node:assert/strict';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';
import { FARMING_STANCE_CELLS } from './farmingStanceSpec';
import { ITEM_DATABASE, RECIPE_DATABASE, requiredBiomeLevelForUpgrade } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';

export interface FarmingSustainCell extends BreadthCell {
  arm: string;
  comparisonId: string;
  originalCaseId: string;
  reconstructionPolicy: 'production-r2' | 'not-applicable';
  charm: 'mountain' | 'volcanic';
  policy: 'static' | 'recuperating';
  displacedAbility: string | null;
}
const identities = ['breadth-t3-striker-balanced', 'breadth-t3-squire-balanced',
  'breadth-t3-apprentice-balanced', 'breadth-t4-conduit-heavy-a', 'breadth-t4-squire-heavy-a'];
export const FARMING_SUSTAIN_CELLS: FarmingSustainCell[] = identities.flatMap(identityId => {
  const original = BREADTH_CELLS.find(c => c.identityId === identityId && c.role === 'farm' && !c.controlCaseId)!;
  assert(original);
  const fixtures = original.tier === 3
    ? FARMING_STANCE_CELLS.filter(c => c.identityId === identityId && c.arm === 'offensive').map(c => c.nodeId)
    : ['node-t4-graveyard-03'];
  assert.equal(fixtures.length, original.tier === 3 ? 2 : 1);
  return fixtures.flatMap(nodeId => (['mountain', 'volcanic'] as const).flatMap(charm =>
    (original.tier === 3 ? ['static'] as const : ['static', 'recuperating'] as const).map(policy => {
      const cell = structuredClone(original) as FarmingSustainCell;
      const comparisonId = `sustain-01-${identityId}-${nodeId}`;
      const arm = `${charm}-${policy}`;
      Object.assign(cell, { id: `${comparisonId}-${arm}`, comparisonId, originalCaseId: original.id,
        nodeId, arm, charm, policy, stance: 'offensive-stance', displacedAbility: null,
        reconstructionPolicy: cell.className === 'conduit' ? 'production-r2' : 'not-applicable' });
      cell.build.id = cell.id;
      cell.build.gearItemIds.recovery = `${charm}-charm-t${cell.tier}`;
      // Covenanter has only four spare RP. One common optional attunement is
      // displaced in every arm, so the charm and policy factors stay separable.
      if (identityId === 'breadth-t4-conduit-heavy-a') {
        // Slam since the ability pass cut Expose Weakness (design §22.2).
        cell.abilities!.techniques = cell.abilities!.techniques.filter(id => id !== 'slam');
        cell.displacedAbility = 'slam';
      }
      // The `recuperating` policy was a low-HP Switch Stance rule into Recuperating;
      // stances are gone (class-first rework D2), so that arm now runs the static policy.
      cell.preparationNotes = cell.preparationNotes.filter(n => !n.includes('No stance switching') && !n.includes('no stance switching'));
      cell.preparationNotes.push('Offensive default; only declared native low-HP Rune may switch posture. No combat treatment.');
      return cell;
    })));
});
assert.equal(FARMING_SUSTAIN_CELLS.length, 20);
export const FARMING_SUSTAIN_BLOCKS = Object.fromEntries(FARMING_SUSTAIN_CELLS.map(cell =>
  [cell.id, { cells: [cell], durationMs: 300000, pilotIds: [] }]));

export function sustainGates(cell: FarmingSustainCell, bot: PlayerEntity) {
  const p = bot.tracksProgression;
  // One recipe, no predecessor chain: the evolve path is gone (class-first rework D1).
  const id = cell.build.gearItemIds.recovery!;
  const r = RECIPE_DATABASE.get(id)!;
  assert(r && r.tier <= cell.tier && (p.biomeLevel[r.recipeGroup] ?? 0) >= r.requiredBiomeLevel);
  const chain: unknown[] = [{ id, tier: r.tier, group: r.recipeGroup,
    requiredMastery: r.requiredBiomeLevel, actualMastery: p.biomeLevel[r.recipeGroup], equipped: true }];
  const item = ITEM_DATABASE.get(cell.build.gearItemIds.recovery!)!;
  return { evolutionChain: chain, acquisition: cell.progressionSnapshot ? 'Fixed route checkpoint; paid costs in progression receipt' : 'Synthetic mature equipment; chain gates checked, no acquisition/cost claim',
    upgrade: { plus: bot.holdsInventory.itemUpgrades[item.id], requiredMastery: requiredBiomeLevelForUpgrade(item, cell.progressionSnapshot ? bot.holdsInventory.itemUpgrades[item.id] : 5) },
    recoveryPassives: Object.fromEntries(Object.entries(bot.usesSkills.passives).filter(([k]) => k.includes('recovery'))) };
}
