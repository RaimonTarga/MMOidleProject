import { writeFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const live = { tier: 4, cls: 'squire', frame: 'heavy', path: 'b', treatment: 'dummy-heavy', gear: { weapon: 'mountain-earthsunder-maul', armor: 'mountain-vest-t4', core: 'core-juggernaut', relic: 'relic-colossus-heart' }, stance: 'time-to-strike-stance', guards: ['brace', 'second-wind'] };
const BR = { conditionId: 'always', actionId: 'use-ability', targetAbilityId: 'brace' };
const onEmp = (a) => ({ conditionId: 'before-empowered', actionId: 'use-ability', targetAbilityId: a });
const E = [
  { ...live, id: 'E-live-PSonEmp', techniques: ['power-strike', 'expose-weakness'], extraRules: [onEmp('power-strike'), BR] },
  { ...live, id: 'E-live-bothOnEmp', techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), onEmp('power-strike'), BR] },
  { ...live, id: 'E-live-chargeEmp-offensive', stance: 'offensive-stance', techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), BR] },
  { ...live, id: 'E-live-chargeEmp-berserker', stance: 'berserker-stance', techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), BR] },
  { ...live, id: 'E-live-chargeEmp-duelist', gear: { ...live.gear, core: 'core-duelist' }, techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), BR] },
  { ...live, id: 'E-live-chargeEmp-warmaul', gear: { ...live.gear, weapon: 'mountain-warmaul' }, techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), BR] },
  { ...live, id: 'E-live-chargeEmp-noSpec', noSpec: true, techniques: ['power-strike', 'charge'], extraRules: [onEmp('charge'), BR] },
  // T3 equivalent: same class/frame at T3, Avalanche Maul, Charge on Empowered Ready
  { id: 'E-t3-chargeEmp', tier: 3, cls: 'squire', frame: 'heavy', treatment: 'dummy-heavy', gear: { weapon: 'mountain-avalanche-maul' }, stance: 'offensive-stance', techniques: ['power-strike', 'charge'], guards: ['brace', 'second-wind'], extraRules: [onEmp('charge'), BR] },
  { id: 'E-t3-chargeEmp-berserker', tier: 3, cls: 'squire', frame: 'heavy', treatment: 'dummy-heavy', gear: { weapon: 'mountain-avalanche-maul' }, stance: 'berserker-stance', techniques: ['power-strike', 'charge'], guards: ['brace', 'second-wind'], extraRules: [onEmp('charge'), BR] },
  { id: 'E-t3-ref', tier: 3, cls: 'squire', frame: 'heavy', treatment: 'dummy-heavy', gear: { weapon: 'mountain-avalanche-maul' }, stance: 'offensive-stance', techniques: ['power-strike', 'expose-weakness'], guards: ['second-wind', 'brace', 'cleanse'] },
];
// Other empowered-hit specs: PS wired on Empowered Ready vs reference wiring, plus TTS
for (const [cls, frame, path] of [['striker', 'heavy', 'a'], ['striker', 'heavy', 'b'], ['squire', 'heavy', 'a'], ['spirit', 'heavy', 'b'], ['spirit', 'heavy', 'a'], ['slinger', 'heavy', 'b']]) {
  const b = { tier: 4, cls, frame, path, treatment: 'dummy-heavy', stance: 'offensive-stance', techniques: ['power-strike', 'charge'], guards: ['second-wind', 'brace', 'cleanse'] };
  E.push({ ...b, id: `E-${cls}-${frame}-${path}-ref`, techniques: ['power-strike', 'expose-weakness'] });
  E.push({ ...b, id: `E-${cls}-${frame}-${path}-chargeEmp`, extraRules: [onEmp('charge')] });
  E.push({ ...b, id: `E-${cls}-${frame}-${path}-chargeEmp-tts`, stance: 'time-to-strike-stance', extraRules: [onEmp('charge')] });
}
for (const b of ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench']) E.push({ ...live, id: `E-live-offensive-live-${b}`, treatment: 'live', node: `node-t4-${b}-dungeon`, stance: 'offensive-stance', techniques: ['power-strike', 'expose-weakness'], guards: ['second-wind', 'brace', 'cleanse'] });
writeFileSync(`${T}/planE.json`, JSON.stringify(E)); console.log('E', E.length);
