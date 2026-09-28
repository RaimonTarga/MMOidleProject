import { writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const G = ['second-wind', 'brace', 'cleanse'];
const onEmp = (a) => ({ conditionId: 'before-empowered', actionId: 'use-ability', targetAbilityId: a });
const TECH = { 'ps-ew': { techniques: ['power-strike', 'expose-weakness'] }, 'ps-qs': { techniques: ['power-strike', 'quick-strike'] }, 'ps-det': { techniques: ['power-strike', 'detonate'] }, 'ps-chg': { techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge')] } };
const H = [];
for (const b of refs().filter((r) => r.tier === 4)) for (const st of ['offensive-stance', 'berserker-stance', 'perfection-stance']) for (const [tk, t] of Object.entries(TECH))
  H.push({ id: `H-${b.key}-${st.replace('-stance', '')}-${tk}`, tier: 4, cls: b.cls, frame: b.frame, path: b.path, treatment: 'dummy-heavy', stance: st, guards: G, ...t, capMs: 65000 });
writeFileSync(`${T}/planH.json`, JSON.stringify(H)); console.log('H', H.length);
