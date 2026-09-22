import assert from 'node:assert/strict';
import { ABILITY_DATABASE, ABILITY_RECIPE_DATABASE, RUNE_RECIPE_DATABASE, ACTION_DATABASE,
  CONDITION_DATABASE, isRuneRecipeUnlocked, runeIdsFromCraftedRecipes, globalMastery, runeBudgetForGlobalMastery,
  runicLoadoutFromProgression, runicPointLoadoutCost, runicPointEditAllowed, sanitizeRuneLoadout, attunedAbilityIds } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';
import { markSliceDirty } from '../../src/ecs/dirtyHelpers';
import { craftRuneRecipe } from '../../src/systems/player/economy/runeCrafting';
import { T2_LOW_HP_RULE, type T2MultiCell } from './t2MultiBiomeSpec';

export const FOCUS_RECIPE = 'rune-recipe-focus-lowest-hp';
export function prepareT2Ownership(c: T2MultiCell, bot: PlayerEntity) {
  const p = bot.tracksProgression;
  const recipes = [...RUNE_RECIPE_DATABASE.values()].filter(r => !r.deprecated && r.runeId &&
    c.runeRules!.some(rule => rule.actionId === r.runeId || rule.conditionId === r.runeId));
  for (const r of recipes) assert(r.tier <= 2 && isRuneRecipeUnlocked(r, p), `Unreachable rune ${r.id}`);
  // Existing support is synthetic mature ownership, but its persisted recipe
  // receipts must agree: normal subsequent crafting rebuilds ownership from them.
  p.runeRecipesCrafted = recipes.map(r => r.id);
  p.runesOwned = runeIdsFromCraftedRecipes(p.runeRecipesCrafted);
  for (const rule of p.runesEquipped) {
    assert(ACTION_DATABASE.get(rule.actionId)!.tier <= 2 && CONDITION_DATABASE.get(rule.conditionId)!.tier <= 2);
  }
  const abilities = attunedAbilityIds(p.attunedAbilities).map(id => {
    const recipe = [...ABILITY_RECIPE_DATABASE.values()].find(r => r.abilityId === id)!;
    assert(recipe && recipe.tier <= 2 && ABILITY_DATABASE.get(id)!.tier <= 2);
    assert(recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined && (p.biomeLevel[recipe.recipeGroup] ?? 0) >= recipe.requiredBiomeLevel);
    return { id, recipeId: recipe.id, group: recipe.recipeGroup, requiredLevel: recipe.requiredBiomeLevel,
      actualLevel: p.biomeLevel[recipe.recipeGroup] };
  });
  const valid = sanitizeRuneLoadout(p.runesEquipped, new Set(p.runesOwned), Infinity, bot.usesSkills.combatArchetype,
    new Set(p.attunedStances), new Set(attunedAbilityIds(p.attunedAbilities)));
  assert.deepEqual(valid, p.runesEquipped);
  assert(!p.runesOwned.includes('focus-lowest-hp'));
  const loadout = runicLoadoutFromProgression(p);
  const budget = runeBudgetForGlobalMastery(globalMastery(p.biomeLevel));
  const afterCost = runicPointLoadoutCost({ ...loadout, rules: [T2_LOW_HP_RULE, ...p.runesEquipped] });
  if (c.delayedFocus) {
    assert(afterCost <= budget, `${c.id}: midpoint rule lacks RP headroom`);
    assert(isRuneRecipeUnlocked(RUNE_RECIPE_DATABASE.get(FOCUS_RECIPE)!, p));
    // Explicit starting reserve, not a reward/acquisition claim or midpoint grant.
    p.essences.yellow = 90;
  }
  return { abilities, supportRuneRecipes: recipes.map(r => ({ id: r.id, group: r.recipeGroup, level: r.requiredBiomeLevel })),
    ownedRunes: [...p.runesOwned], startingEssences: { ...p.essences },
    focus: { scheduled: c.delayedFocus, atMs: c.delayedFocus ? 300000 : null, recipeId: FOCUS_RECIPE,
      requiredDesertLevel: 4, actualDesertLevel: p.biomeLevel.desert, cost: { yellow: 90 },
      initiallyOwned: false, budget, costAfterAdoption: c.delayedFocus ? afterCost : null } };
}

/** One declared player-like loadout edit; never changes health, targets, or ecology. */
export function attemptT2Focus(world: World, bot: PlayerEntity, elapsedMs: number, opening = false) {
  assert.equal(elapsedMs, opening ? 0 : 300000, 'Only the declared adoption time; no retries');
  const p = bot.tracksProgression;
  const before = { yellow: p.essences.yellow, desertLevel: p.biomeLevel.desert, hp: bot.hasHealth.hp,
    rules: structuredClone(p.runesEquipped) };
  if (bot.isDead || bot.hasHealth.hp <= 0) return { atMs: elapsedMs, status: 'not-alive', before };
  const craft = craftRuneRecipe(world, bot, FOCUS_RECIPE);
  if (!craft.success) return { atMs: elapsedMs, status: 'craft-unavailable', before, craft };
  const rules = [T2_LOW_HP_RULE, ...p.runesEquipped];
  const valid = sanitizeRuneLoadout(rules, new Set(p.runesOwned), Infinity, bot.usesSkills.combatArchetype,
    new Set(p.attunedStances), new Set(attunedAbilityIds(p.attunedAbilities)));
  const current = runicLoadoutFromProgression(p);
  const budget = runeBudgetForGlobalMastery(globalMastery(p.biomeLevel));
  assert.deepEqual(valid, rules, 'Crafted midpoint rule invalid');
  assert(runicPointEditAllowed(current, { ...current, rules: valid }, budget), 'Midpoint RP validation failed');
  p.runesEquipped = valid;
  markSliceDirty(world, bot, 'tracksProgression');
  assert.equal(bot.hasHealth.hp, before.hp);
  return { atMs: elapsedMs, status: 'crafted-and-equipped', before, craft,
    after: { yellow: p.essences.yellow, hp: bot.hasHealth.hp, owned: p.runesOwned.includes('focus-lowest-hp'),
      recipesCrafted: [...p.runeRecipesCrafted], rules: structuredClone(p.runesEquipped),
      budget, cost: runicPointLoadoutCost(runicLoadoutFromProgression(p)) } };
}
