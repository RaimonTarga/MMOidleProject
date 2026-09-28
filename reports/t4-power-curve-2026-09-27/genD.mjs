import { readFileSync, writeFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const rows = readFileSync(`${T}/resA2.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const norm = rows.filter((r) => r.id.endsWith('-norm') && r.treatment === 'dummy-heavy');
const sweep = rows.filter((r) => r.id.includes('-w-'));
const AB3 = { techniques: ['power-strike', 'expose-weakness'], guards: ['second-wind', 'brace', 'cleanse'] };
const D = []; const refs = {};
for (const cls of ['squire', 'striker', 'apprentice', 'slinger', 'spirit', 'conduit']) {
  const t4 = norm.filter((r) => r.tier === 4 && r.cls === cls).sort((a, b) => a.dps60 - b.dps60);
  const ref = t4[Math.floor(t4.length / 2)];
  const t3 = norm.find((r) => r.tier === 3 && r.cls === cls && r.frame === ref.frame);
  const w3 = sweep.filter((r) => r.cls === cls && r.frame === ref.frame).sort((a, b) => b.dps60 - a.dps60)[0].pkg.gear.weapon;
  refs[cls] = { spec: `${ref.frame}-${ref.path}`, t4gear: ref.pkg.gear, t3gear: { ...t3.pkg.gear, weapon: w3 }, t4abil: ref.pkg.abilities };
  const g3 = refs[cls].t3gear, g4 = ref.pkg.gear;
  const base = { tier: 4, cls, frame: ref.frame, path: ref.path, treatment: 'dummy-heavy', stance: 'offensive-stance', ...AB3 };
  const L = [
    ['L0-t3kit', { gear: { weapon: g3.weapon, armor: g3.armor, recovery: g3.recovery, mobility: g3.mobility, core: g3.core, relic: null }, noSpec: true }],
    ['L1-weapon', { gear: { weapon: g4.weapon, armor: g3.armor, recovery: g3.recovery, mobility: g3.mobility, core: g3.core, relic: null }, noSpec: true }],
    ['L2-defgear', { gear: { weapon: g4.weapon, armor: g4.armor, recovery: g4.recovery, mobility: g4.mobility, core: g3.core, relic: null }, noSpec: true }],
    ['L3-core', { gear: { ...g4, relic: null }, noSpec: true }],
    ['L4-spec', { gear: { ...g4, relic: null } }],
    ['L5-relic', { gear: { ...g4 } }],
    // leave-one-out from L5
    ['LOO-weapon', { gear: { ...g4, weapon: g3.weapon } }],
    ['LOO-defgear', { gear: { ...g4, armor: g3.armor, recovery: g3.recovery, mobility: g3.mobility } }],
    ['LOO-core', { gear: { ...g4, core: g3.core } }],
    ['LOO-spec', { gear: { ...g4 }, noSpec: true }],
    ['LOO-relic', { gear: { ...g4, relic: null } }],
  ];
  for (const [k, o] of L) D.push({ ...base, id: `D-${cls}-${k}`, ...o });
  // T3 build on the T3 host (player tier 3), best T3 weapon: the "tier itself" check
  D.push({ id: `D-${cls}-T3native`, tier: 3, cls, frame: ref.frame, treatment: 'dummy-heavy', stance: 'offensive-stance', ...AB3, gear: { weapon: g3.weapon } });
  // Stance sweep on full T4 (L5) and on T3-native
  for (const st of ['defensive-stance', 'berserker-stance', 'enraged-stance', 'execute-stance', 'time-to-strike-stance', 'reaper-stance', 'brawler-stance', 'perfection-stance', 'powering-up-stance']) {
    D.push({ ...base, id: `D-${cls}-st4-${st}`, gear: { ...g4 }, stance: st });
    if (['defensive-stance', 'berserker-stance', 'enraged-stance', 'execute-stance'].includes(st)) D.push({ id: `D-${cls}-st3-${st}`, tier: 3, cls, frame: ref.frame, treatment: 'dummy-heavy', stance: st, ...AB3, gear: { weapon: g3.weapon } });
  }
  // Ability sweep: replace Expose Weakness with a T4 (or T2/T3) Technique
  for (const ab of ['snipe', 'stunning-strike', 'imbue-lightning', 'charge', 'detonate', 'quick-strike', 'binding-strike', 'frenzy']) {
    D.push({ ...base, id: `D-${cls}-ab4-${ab}`, gear: { ...g4 }, techniques: ['power-strike', ab] });
    if (!['snipe', 'stunning-strike', 'imbue-lightning'].includes(ab)) D.push({ id: `D-${cls}-ab3-${ab}`, tier: 3, cls, frame: ref.frame, treatment: 'dummy-heavy', stance: 'offensive-stance', guards: AB3.guards, techniques: ['power-strike', ab], gear: { weapon: g3.weapon } });
  }
  // Core sweep on full T4
  for (const core of ['core-tempered', 'core-force', 'core-duelist', 'core-bruiser', 'core-accelerant', 'core-arcanist', 'core-sniper', 'core-scout', 'core-catalyst', 'core-controller', 'core-juggernaut']) {
    D.push({ ...base, id: `D-${cls}-core4-${core}`, gear: { ...g4, core } });
    if (!['core-catalyst', 'core-controller', 'core-juggernaut'].includes(core)) D.push({ id: `D-${cls}-core3-${core}`, tier: 3, cls, frame: ref.frame, treatment: 'dummy-heavy', stance: 'offensive-stance', ...AB3, gear: { weapon: g3.weapon, core } });
  }
}
// The live player build: Squire/Bulwark/Vanguard/Destroyer.
const live = { tier: 4, cls: 'squire', frame: 'heavy', path: 'b', gear: { weapon: 'mountain-earthsunder-maul', armor: 'mountain-vest-t4', core: 'core-juggernaut', relic: 'relic-colossus-heart' },
  stance: 'time-to-strike-stance', techniques: ['power-strike', 'charge'], guards: ['brace', 'second-wind'],
  extraRules: [{ conditionId: 'before-empowered', actionId: 'use-ability', targetAbilityId: 'charge' }, { conditionId: 'always', actionId: 'use-ability', targetAbilityId: 'brace' }] };
for (const t of ['dummy-armored', 'dummy-heavy']) D.push({ ...live, id: `LIVEP-${t}`, treatment: t });
const BOSSES4 = ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench'];
for (const b of BOSSES4) D.push({ ...live, id: `LIVEP-live-${b}`, treatment: 'live', node: `node-t4-${b}-dungeon` });
// Live player without its T4 layers, one at a time (on heavy dummy)
D.push({ ...live, id: 'LIVEP-noTTS', treatment: 'dummy-heavy', stance: 'offensive-stance' });
D.push({ ...live, id: 'LIVEP-noRelic', treatment: 'dummy-heavy', gear: { ...live.gear, relic: null } });
D.push({ ...live, id: 'LIVEP-noSpec', treatment: 'dummy-heavy', noSpec: true });
D.push({ ...live, id: 'LIVEP-noCharge', treatment: 'dummy-heavy', techniques: ['power-strike', 'expose-weakness'], extraRules: [live.extraRules[1]] });
D.push({ ...live, id: 'LIVEP-avalanche', treatment: 'dummy-heavy', gear: { ...live.gear, weapon: 'mountain-avalanche-maul' } });
writeFileSync(`${T}/planD.json`, JSON.stringify(D)); writeFileSync(`${T}/refs.json`, JSON.stringify(refs, null, 1));
console.log('D', D.length); console.log(JSON.stringify(refs, null, 1));
