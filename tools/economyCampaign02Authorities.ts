/** Preparation export only; no World construction or experiment launch. */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NATIVE_MODIFIER, ECONOMY_BY_TIER, ECONOMY_UPGRADE_SHARES,
  globalMasteryRequiredForUpgrade, ITEM_DATABASE, requiredBiomeLevelForUpgrade,
  getMaxUpgrade, biomeXpForBiomeLevel, BIOME_DATABASE, biomeLevelCap } from '../shared/src/index';
import { ROUTES } from '../bot/src/routes';
import { T2_CLASS_PLANS } from '../bot/src/routes/t2GearPlans';
const output = process.argv[2];
if (!output) throw new Error('Pass an output JSON path');
const actors = ['striker', 'squire', 'apprentice', 'conduit'];
const ids = actors.flatMap(a => [`${a}-t1`, `${a}-t2-mid`, `${a}-t2-progression`]);
const routes = ids.map(id => { const route = ROUTES.get(id); if (!route) throw Error(id); return route; });
const data = {
  source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  nativeModifiers: NATIVE_MODIFIER, curves: ECONOMY_BY_TIER, upgradeShares: ECONOMY_UPGRADE_SHARES,
  routes, classPlans: T2_CLASS_PLANS.filter(p => actors.includes(p.slug)),
  laterTierCandidates: [...ROUTES.values()].filter(r => (r.startsFromTierEntry ?? r.progressionEntry?.tier ?? 0) >= 3)
    .map(r => ({ id: r.id, version: r.version, root: r.classRoot, frame: r.frameId,
      entry: r.progressionEntry ?? r.startsFromTierEntry, completion: r.completion,
      description: r.description, fullTierAccepted: false })),
  globalUpgradeGates: [1, 2, 3, 4].map(tier => ({ tier,
    gm: [1, 2, 3, 4, 5].map(plus => globalMasteryRequiredForUpgrade(tier, plus)) })),
  localUpgradeGates: Object.fromEntries([...ITEM_DATABASE].filter(([, item]) => item.tier <= 4)
    .map(([id, item]) => [id, Array.from({ length: getMaxUpgrade(item) }, (_, i) =>
      requiredBiomeLevelForUpgrade(item, i + 1))])),
  masteryThresholds: Object.fromEntries([...BIOME_DATABASE.keys()].map(biome => [biome, {
    caps: [1, 2, 3, 4].map(tier => biomeLevelCap(tier, biome)),
    cumulative: Array.from({ length: biomeLevelCap(4, biome) + 1 }, (_, level) => biomeXpForBiomeLevel(biome, level)),
  }])),
};
writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
console.log(`Campaign 02 source authorities exported: ${output}`);
