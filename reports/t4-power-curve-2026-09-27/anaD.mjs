import { readFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const rows = readFileSync(`${T}/resD.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const by = Object.fromEntries(rows.map((r) => [r.id, r]));
const errs = rows.filter((r) => r.error); console.log('errors', errs.length); for (const e of errs.slice(0, 40)) console.log('  ', e.id, e.error.slice(0, 90));
const d = (id) => by[id] && !by[id].error ? by[id].dps60 : null;
const CLS = ['squire', 'striker', 'apprentice', 'slinger', 'spirit', 'conduit'];
console.log('\n### Cumulative layers (dps60, T4 host dummy-heavy); step multiplier in ()');
console.log('| class (T4 spec) | T3 native | L0 T3 kit @T4 | +weapon | +armor/charm/boots | +core | +spec | +relic | total L5/T3native |');
for (const c of CLS) {
  const seq = ['L0-t3kit', 'L1-weapon', 'L2-defgear', 'L3-core', 'L4-spec', 'L5-relic'].map((k) => d(`D-${c}-${k}`));
  const nat = d(`D-${c}-T3native`);
  const cells = seq.map((v, i) => i === 0 ? `${v} (${(v / nat).toFixed(2)})` : `${v} (${(v / seq[i - 1]).toFixed(2)})`);
  console.log(`| ${c} | ${nat} | ${cells.join(' | ')} | **${(seq[5] / nat).toFixed(2)}** |`);
}
console.log('\n### Leave-one-out from full T4 (L5): full / without layer');
console.log('| class | full | -weapon | -def gear | -core | -spec | -relic |');
for (const c of CLS) {
  const f = d(`D-${c}-L5-relic`);
  console.log(`| ${c} | ${f} | ${['weapon', 'defgear', 'core', 'spec', 'relic'].map((k) => { const v = d(`D-${c}-LOO-${k}`); return `${(f / v).toFixed(2)}`; }).join(' | ')} |`);
}
const ST = ['offensive', 'defensive-stance', 'berserker-stance', 'enraged-stance', 'execute-stance', 'time-to-strike-stance', 'reaper-stance', 'brawler-stance', 'perfection-stance', 'powering-up-stance'];
console.log('\n### Stance sweep, T4 full build (vs offensive) and T3 native (vs offensive)');
for (const c of CLS) {
  const off4 = d(`D-${c}-L5-relic`), off3 = d(`D-${c}-T3native`);
  const s4 = ST.slice(1).map((s) => [s, d(`D-${c}-st4-${s}`)]).filter(([, v]) => v).map(([s, v]) => `${s.replace('-stance', '')} ${(v / off4).toFixed(2)}`);
  const s3 = ST.slice(1).map((s) => [s, d(`D-${c}-st3-${s}`)]).filter(([, v]) => v).map(([s, v]) => `${s.replace('-stance', '')} ${(v / off3).toFixed(2)}`);
  console.log(`${c}\n  T4: ${s4.join(', ')}\n  T3: ${s3.join(', ')}`);
}
console.log('\n### Ability sweep: PS + X instead of PS + Expose (ratio vs PS+Expose)');
for (const c of CLS) {
  const f4 = d(`D-${c}-L5-relic`), f3 = d(`D-${c}-T3native`);
  const a4 = ['snipe', 'stunning-strike', 'imbue-lightning', 'charge', 'detonate', 'quick-strike', 'binding-strike', 'frenzy'].map((a) => [a, d(`D-${c}-ab4-${a}`)]).filter(([, v]) => v).map(([a, v]) => `${a} ${(v / f4).toFixed(2)}`);
  const a3 = ['charge', 'detonate', 'quick-strike', 'binding-strike', 'frenzy'].map((a) => [a, d(`D-${c}-ab3-${a}`)]).filter(([, v]) => v).map(([a, v]) => `${a} ${(v / f3).toFixed(2)}`);
  console.log(`${c}\n  T4: ${a4.join(', ')}\n  T3: ${a3.join(', ')}`);
}
console.log('\n### Core sweep (ratio vs the reference core)');
for (const c of CLS) {
  const f4 = d(`D-${c}-L5-relic`), f3 = d(`D-${c}-T3native`);
  const cs = ['core-tempered', 'core-force', 'core-duelist', 'core-bruiser', 'core-accelerant', 'core-arcanist', 'core-sniper', 'core-scout', 'core-catalyst', 'core-controller', 'core-juggernaut'];
  console.log(`${c}\n  T4: ${cs.map((k) => [k, d(`D-${c}-core4-${k}`)]).filter(([, v]) => v).map(([k, v]) => `${k.slice(5)} ${(v / f4).toFixed(2)}`).join(', ')}\n  T3: ${cs.map((k) => [k, d(`D-${c}-core3-${k}`)]).filter(([, v]) => v).map(([k, v]) => `${k.slice(5)} ${(v / f3).toFixed(2)}`).join(', ')}`);
}
console.log('\n### Live player build');
for (const r of rows.filter((r) => r.id.startsWith('LIVEP'))) console.log(r.id.padEnd(22), r.error ? r.error.slice(0, 100) : `${r.outcome} t=${r.t}s dps60=${r.dps60} dpsAll=${r.dpsAll} minHp=${r.minHpPct}`);
