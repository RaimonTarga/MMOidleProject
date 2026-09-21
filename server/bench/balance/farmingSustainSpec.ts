import assert from 'node:assert/strict';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';
import { FARMING_STANCE_CELLS } from './farmingStanceSpec';
import { ITEM_DATABASE, RECIPE_DATABASE, requiredBiomeLevelForUpgrade, runicPointBreakdown, STANCE_RECIPE_DATABASE, isStanceRecipeUnlocked } from '@mmo-idle/shared';
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
        cell.abilities!.techniques = cell.abilities!.techniques.filter(id => id !== 'expose-weakness');
        cell.displacedAbility = 'expose-weakness';
      }
      if (policy === 'recuperating') {
        cell.additionalStances = ['recuperating-stance'];
        cell.runeRules!.push({ conditionId: 'hp-below-25', actionId: 'switch-stance', targetStanceId: 'recuperating-stance' });
      }
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
  const chain: unknown[] = [];
  let id: string | undefined = cell.build.gearItemIds.recovery;
  while (id) {
    const r = RECIPE_DATABASE.get(id)!;
    assert(r && r.tier <= cell.tier && (p.biomeLevel[r.recipeGroup] ?? 0) >= r.requiredBiomeLevel);
    chain.push({ id, evolvesFrom: r.evolvesFrom ?? null, tier: r.tier, group: r.recipeGroup,
      requiredMastery: r.requiredBiomeLevel, actualMastery: p.biomeLevel[r.recipeGroup],
      equipped: id === cell.build.gearItemIds.recovery });
    id = r.evolvesFrom;
  }
  const item = ITEM_DATABASE.get(cell.build.gearItemIds.recovery!)!;
  const stanceGates = (p.attunedStances ?? []).map(id => {
    const recipe = [...STANCE_RECIPE_DATABASE.values()].find(r => r.stanceId === id)!;
    assert(recipe && recipe.tier <= cell.tier && isStanceRecipeUnlocked(recipe, p));
    return { id, recipeId: recipe.id, group: recipe.recipeGroup, requiredMastery: recipe.requiredBiomeLevel,
      actualMastery: recipe.recipeGroup ? p.biomeLevel[recipe.recipeGroup] : null };
  });
  return { evolutionChain: chain, acquisition: 'Synthetic mature equipment; chain gates checked, no acquisition/cost claim',
    upgrade: { plus: bot.holdsInventory.itemUpgrades[item.id], requiredMastery: requiredBiomeLevelForUpgrade(item, 5) },
    stanceGates, reserved: runicPointBreakdown({ abilities: p.attunedAbilities, rules: p.runesEquipped,
      stances: p.attunedStances ?? [], rites: p.equippedRites }),
    recoveryPassives: Object.fromEntries(Object.entries(bot.usesSkills.passives).filter(([k]) => k.includes('recovery'))) };
}
