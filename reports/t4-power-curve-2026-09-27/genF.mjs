import { writeFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const W = { 'mountain-warmaul': [184, 370], 'tundra-glacial-rimebrand': [165, 310], 'desert-sunmonk-warstaff': [115, 192] };
const builds = [
  { cls: 'squire', frame: 'heavy', spec: 'b', weapon: 'mountain-warmaul', armor: 'mountain-vest-t4', charm: 'mountain-charm-t4', boots: 'mountain-boots-t4', core: 'core-duelist', relic: 'relic-colossus-heart' },
  { cls: 'slinger', frame: 'heavy', spec: 'c', range: 'mid', weapon: 'tundra-glacial-rimebrand', armor: 'jungle-vest-t4', charm: 'mountain-charm-t4', boots: 'mountain-boots-t4', core: 'core-tempered', relic: 'relic-colossus-heart' },
  { cls: 'spirit', frame: 'balanced', spec: 'b', range: 'mid', weapon: 'desert-sunmonk-warstaff', armor: 'jungle-vest-t4', charm: 'mountain-charm-t4', boots: 'mountain-boots-t4', core: 'core-tempered', relic: 'relic-equilibrium-shard' },
];
const F = [];
for (const node of ['node-t4-mountain-03', 'node-t4-jungle-03', 'node-t4-graveyard-03', 'node-t4-trench-03', 'node-t4-volcanic-03'])
  for (const b of builds) for (const k of [1, 0.8, 0.6]) for (const seed of [173, 947]) {
    const [a0, a5] = W[b.weapon];
    F.push({ id: `F-${node}-${b.cls}-x${k}-${seed}`, mode: 'farm', node, durable: true, capMs: 300000, seed, techniques: ['power-strike'], guards: ['brace'], ...b,
      ...(k !== 1 ? { wp: { [b.weapon]: { atk: [Math.round(a0 * k), Math.round(a5 * k)] } } } : {}) });
  }
writeFileSync(`${T}/planF.json`, JSON.stringify(F)); console.log('F', F.length);
