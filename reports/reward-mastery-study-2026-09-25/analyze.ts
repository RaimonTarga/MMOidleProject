// Read-only balance inventory. Run from root with the command in README.md.
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { BIOME_DATABASE, MONSTER_DATABASE, NODE_BIOMES, NODE_MODIFIERS, GAME_CONFIG, biomeLevelCap, biomeXpForBiomeLevel, modifierRewardMult } from '../../shared/src/index';

const out = dirname(fileURLToPath(import.meta.url));
const root = resolve(out, '../..');
const targets = [0, 5, 15, 30, 60];
const rows = Object.entries(NODE_BIOMES).filter(([, n]) => n.kind === 'normal' && n.biomeTier >= 1 && n.biomeTier <= 4).map(([nodeId, node]) => {
  const tier = node.biomeTier;
  const biome = BIOME_DATABASE.get(node.biomeGroup)!;
  const pool = biome.monsterPoolByTier[tier] ?? [];
  if (!pool.length) throw new Error(`Empty pool: ${nodeId}`);
  // Expected bodies per spawn draw, preserving duplicate pool entries and
  // nonrecursive fixed/variant followers. This is NOT a measured kill mix.
  const weights = new Map<string, number>();
  const add = (id: string, count: number) => weights.set(id, (weights.get(id) ?? 0) + count / pool.length);
  for (const id of pool) {
    add(id, 1);
    const def = MONSTER_DATABASE.get(id)!;
    if (def.pack?.role !== 'alpha') continue;
    for (const f of def.pack.followers ?? []) add(f.typeId, f.count);
    const variants = def.pack.followerVariants ?? [];
    for (const variant of variants) for (const f of variant) add(f.typeId, f.count / variants.length);
  }
  const modifier = NODE_MODIFIERS[nodeId]?.modifier;
  const rewardMult = modifierRewardMult(modifier, tier);
  const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0);
  const monsters = [...weights].map(([id, weight]) => {
    const def = MONSTER_DATABASE.get(id);
    if (!def) throw new Error(`Missing monster ${id}`);
    const xp = Math.round(Math.max(1, Math.round((def.rewards.biomeXp ?? 1) * rewardMult)) * GAME_CONFIG.BIOME_XP_REWARD_MULT_BY_TIER[tier]);
    const essence = Math.max(1, Math.round(def.rewards.essence * GAME_CONFIG.BIOME_ESSENCE_TIER_MULT[tier] * rewardMult));
    return { id, expectedBodyShare: weight / totalWeight, xp, essence, baseHp: def.stats.hp };
  });
  const cap = biomeLevelCap(tier, node.biomeGroup);
  const entryLevel = biomeLevelCap(tier - 1, node.biomeGroup);
  const budget = biomeXpForBiomeLevel(node.biomeGroup, cap) - biomeXpForBiomeLevel(node.biomeGroup, entryLevel);
  if (cap - entryLevel !== 6 || budget !== GAME_CONFIG.BIOME_XP_SEGMENT_BUDGET_BY_TIER[tier]) throw new Error(`Unexpected segment ${nodeId}`);
  const meanXp = monsters.reduce((a, m) => a + m.xp * m.expectedBodyShare, 0);
  const meanEssence = monsters.reduce((a, m) => a + m.essence * m.expectedBodyShare, 0);
  const kills = budget / meanXp;
  return { nodeId, biome: node.biomeGroup, tier, modifier, rewardMult, entryLevel, cap, budget, targetMinutes: targets[tier], monsters,
    expectedXpPerBody: meanXp, expectedEssencePerBody: meanEssence,
    expectedBodiesForSegment: kills, fastestSingleTypeKills: Math.ceil(budget / Math.max(...monsters.map(m => m.xp))), slowestSingleTypeKills: Math.ceil(budget / Math.min(...monsters.map(m => m.xp))),
    secondsPerKillAtTarget: targets[tier] * 60 / kills,
    minutesAtKillsPerMinute: Object.fromEntries([1, 2, 4, 8, 12].map(rate => [rate, kills / rate])),
    expectedEssenceDuringSegment: kills * meanEssence };
});
const sources = ['shared/src/config/gameConfig.ts', 'shared/src/biomeDatabase.ts', 'shared/src/world/nodeModifiers.ts', 'server/src/systems/player/progression/rewards.ts', 'server/src/analytics/gameplayRecorder.ts'];
const bosses = Object.entries(NODE_BIOMES).filter(([, n]) => n.biomeTier >= 1 && n.biomeTier <= 4 && n.kind === 'dungeon').flatMap(([nodeId, n]) => (n.bossTypeId ? [n.bossTypeId] : BIOME_DATABASE.get(n.biomeGroup)?.bossPoolByTier?.[n.biomeTier] ?? []).map(id => {
  const def = MONSTER_DATABASE.get(id)!;
  const mult = modifierRewardMult(NODE_MODIFIERS[nodeId]?.modifier, n.biomeTier);
  const xp = Math.round(Math.max(1, Math.round((def.rewards.biomeXp ?? 1) * mult)) * GAME_CONFIG.BIOME_XP_REWARD_MULT_BY_TIER[n.biomeTier]);
  const budget = GAME_CONFIG.BIOME_XP_SEGMENT_BUDGET_BY_TIER[n.biomeTier];
  return { nodeId, tier: n.biomeTier, biome: n.biomeGroup, monsterId: def.id, xp, fractionOfSegment: xp / budget };
}));
const evidence = { generatedAt: new Date().toISOString(), head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), rewardMultiplier: 1, targetsMinutes: targets.slice(1), sourceHashes: Object.fromEntries(sources.map(p => [p, createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex')])), bosses, rows };
writeFileSync(resolve(out, 'inventory.json'), JSON.stringify(evidence, null, 2) + '\n');
const lines = ['# Static reward inventory', '', 'Generated from working-tree source, debug multiplier 1. No combat simulation or player observations. Kill mix is expected spawned bodies, including pack followers; actual targeting, respawns, survival and AoE change the realized mix. Fractional kill counts are expectation ratios, not exact completion counts. Budgets assume entry at the previous cap threshold with no XP overshoot.', '', '| Tier | Biome | Node | Reward multiplier | XP/body | Bodies/segment | Seconds/body for target | Minutes at 4 kills/min |', '|---|---|---|---:|---:|---:|---:|---:|'];
for (const r of rows) lines.push(`| ${r.tier} | ${r.biome} | ${r.nodeId} | ${r.rewardMult.toFixed(2)} | ${r.expectedXpPerBody.toFixed(1)} | ${r.expectedBodiesForSegment.toFixed(1)} | ${r.secondsPerKillAtTarget.toFixed(1)} | ${r.minutesAtKillsPerMinute[4].toFixed(1)} |`);
writeFileSync(resolve(out, 'INVENTORY.md'), lines.join('\n') + '\n');
for (let tier = 1; tier <= 4; tier++) {
  const subset = rows.filter(r => r.tier === tier);
  const range = (key: 'expectedBodiesForSegment' | 'secondsPerKillAtTarget') => [Math.min(...subset.map(r => r[key])), Math.max(...subset.map(r => r[key]))].map(n => n.toFixed(1)).join('–');
  console.log(`T${tier}: ${subset.length} nodes; bodies ${range('expectedBodiesForSegment')}; seconds/body for target ${range('secondsPerKillAtTarget')}`);
}
console.log(`Wrote ${rows.length} node rows to ${out}`);
