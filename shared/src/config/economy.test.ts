import { priceRecipeForEconomy, economyForTier } from './economy';
import { RECIPE_DATABASE } from '../recipeDatabase';
import { ITEM_DATABASE } from '../itemDatabase';
import { checkUpgrade, upgradeCostFor } from '../systems/itemUpgrades';
import { mountainRecipeEntries } from '../data/recipes/mountain.recipes';
function assert(value: unknown, message: string): asserts value { if (!value) throw Error(message); }
const anchor = { tier: 1, cost: { blue: 7 }, upgrades: [{ cost: { blue: 11 } }] };
assert(priceRecipeForEconomy(anchor) === anchor, 'T1 must remain untouched, including authored upgrade shape');
const authored = { tier: 3, cost: { blue: 7 }, catalystCost: { heavy: 2 }, reconstructCost: { blue: 23 }, upgrades: [1,2,3,4,5].map(i=>({cost:{blue:i,red:1},stats:{attack:i}})) };
const before = JSON.stringify(authored);
const priced = priceRecipeForEconomy(authored);
assert(JSON.stringify(authored) === before, 'registration must not mutate authoring data or compound on rebuild');
for (const colour of ['blue','red'] as const) {
  assert(priced.upgrades.reduce((sum,u)=>sum+u.cost[colour],0) === authored.upgrades.reduce((sum,u)=>sum+u.cost[colour],0)*economyForTier(3).essenceCost, 'rounding must preserve each colour total');
}
assert(JSON.stringify(priced.upgrades.map(u=>u.stats)) === JSON.stringify(authored.upgrades.map(u=>u.stats)), 'prices must not change combat bonuses');
const raw = mountainRecipeEntries.find(([id])=>id==='mountain-vest-t4')![1];
const recipe = RECIPE_DATABASE.get(raw.id)!;
const item = ITEM_DATABASE.get(raw.id)!;
assert(recipe.cost.blue === raw.cost.blue! * economyForTier(4).essenceCost, 'public recipe exposes payable cost');
assert(item.upgrades === recipe.upgrades, 'UI item view and recipe must share the same priced steps');
const first = upgradeCostFor(item,1)!;
const wallet = {red:0,blue:0,green:0,yellow:0,purple:0,...first};
assert(checkUpgrade({item,currentPlus:0,biomeLevel:100,globalMastery:999,essences:wallet,catalysts:{}}).ok, 'displayed exact upgrade wallet must be accepted');
assert(!checkUpgrade({item,currentPlus:0,biomeLevel:100,globalMastery:999,essences:{...wallet,blue:wallet.blue-1},catalysts:{}}).ok, 'one short of displayed price must be rejected');
console.log('economy: ok');
