import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const C = readFileSync(`${T}/resC.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const B = readFileSync(`${T}/resB.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const ros = JSON.parse(readFileSync(`${T}/roster.json`, 'utf8'));
console.log('errors', C.filter((r) => r.error).length, 'capped', C.filter((r) => r.outcome === 'capped').length);
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = (x) => x == null ? '—' : (Math.round(x * 10) / 10);
const BIO = { 'Caverns': 'cave', 'Mountain': 'mountain', 'Jungle': 'jungle', 'Desert': 'desert', 'Tundra': 'tundra', 'Volcanic': 'volcanic', 'Wasteland': 'graveyard', 'Deep-Sea Trench': 'trench', 'Swamp': 'swamp' };
for (const tier of [3, 4]) {
  console.log(`\n### T${tier}: trash TTK (one mob, median over non-Conduit reference builds, seconds from first hit) vs boss`);
  console.log('| biome | trash (HP → TTK s) | spawn-weighted mean TTK | slowest trash | boss HP | boss TTK live (bench / offensive) | boss ÷ weighted trash | boss ÷ slowest trash |');
  const biomes = [...new Set(ros[tier].map((m) => m.biome))];
  for (const bio of biomes) {
    const mobs = ros[tier].filter((m) => m.biome === bio && !m.boss);
    const ttk = {};
    for (const m of mobs) ttk[m.id] = med(C.filter((r) => r.tier === tier && r.cls !== 'conduit' && r.treatment === `trash:${m.id}` && !r.error).map((r) => r.outcome === 'capped' ? 60 : r.fightS));
    const wsum = mobs.reduce((s, m) => s + m.w, 0);
    const wm = mobs.reduce((s, m) => s + m.w * ttk[m.id], 0) / wsum;
    const slow = Math.max(...mobs.map((m) => ttk[m.id]));
    const boss = ros[tier].find((m) => m.biome === bio && m.boss);
    const node = `node-t${tier}-${BIO[bio]}-dungeon`;
    const bw = (arm) => med(B.filter((r) => r.node === node && r.cls !== 'conduit' && r.won && (arm === 'off' ? r.id.endsWith('-off') : !r.id.endsWith('-off'))).map((r) => r.t));
    const bb = bw('bench'), bo = bw('off');
    console.log(`| ${bio} | ${mobs.map((m) => `${m.name}${m.elite ? '*' : ''}${m.w > 1 ? ' x' + m.w : ''} ${m.hp}→${r1(ttk[m.id])}`).join('; ')} | ${r1(wm)} | ${r1(slow)} | ${boss?.hp ?? ''} | ${r1(bb)} / ${r1(bo)} | ${r1(bb / wm)} | ${r1(bb / slow)} |`);
  }
}
// Player DPS vs trash dummy: context
const t4dps = med(C.filter((r) => r.tier === 4 && r.cls !== 'conduit' && r.won).map((r) => r.dpsAll));
const t3dps = med(C.filter((r) => r.tier === 3 && r.cls !== 'conduit' && r.won).map((r) => r.dpsAll));
console.log('\nmedian effective DPS vs trash dummies: T3', t3dps, 'T4', t4dps);
