import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const candidate = resolve('reports/defense-redesign-01');
const control = resolve('../mmo-defense-control/reports/defense-redesign-01');
const receipts = {};
function read(root, name) {
  const path = resolve(root, name);
  const raw = readFileSync(resolve(path, 'rows.jsonl'));
  const rows = raw.toString().trim().split('\n').map(JSON.parse);
  const complete = JSON.parse(readFileSync(resolve(path, 'complete.json')));
  if (rows.length !== complete.expected || complete.completed !== complete.expected) throw Error(name);
  if (new Set(rows.map(r => r.id + '/' + r.seed)).size !== rows.length) throw Error('duplicate ' + name);
  receipts[name] = { path, ...complete, rowsSha256: createHash('sha256').update(raw).digest('hex') };
  return rows.map(r => ({ ...r, outcome: r.hpEnd <= 0 ? 'bot_died' : r.outcome }));
}
const stats = rows => ({ n: rows.length, deaths: rows.filter(r => r.outcome === 'bot_died').length,
  bossWins: rows.filter(r => r.outcome === 'boss_killed').length, kills: rows.reduce((s,r) => s+r.kills,0),
  seconds: Math.round(rows.reduce((s,r) => s+r.elapsedMs,0)/100)/10,
  fullHpLethalHits: rows.reduce((s,r) => s+r.fullHpLethalHits,0) });
const baseline = read(control, 'baseline-03'), cores = read(control, 'core-02');
const full02 = read(candidate, 'full-02'), full03 = read(candidate, 'full-03'), full04 = read(candidate, 'full-04');
const armor = read(candidate, 'armor-followup');
const replacement = new Map(armor.map(r => [r.id+'/'+r.seed,r]));
if (armor.some(r => !full04.some(b => b.id === r.id && b.seed === r.seed))) throw Error('unpaired replacement');
const final = full04.map(r => replacement.get(r.id+'/'+r.seed) ?? r);
const followBase = read(control, 'followup-baseline'), followFinal = read(candidate, 'followup-final');
const altBase = read(control, 'alternatives-baseline'), altFinal = read(candidate, 'alternatives-candidate');
const groups = rows => {
  const result = {};
  for (const row of rows) {
    const group = row.id.startsWith('follow-t1') ? row.id.split('-').slice(0,3).join('-') :
      row.id.includes('heat-managed') ? 'heat-managed-boss' : row.id.split('-').slice(0,2).join('-');
    (result[group] ??= []).push(row);
  }
  return Object.fromEntries(Object.entries(result).map(([k,v]) => [k, stats(v)]));
};
const output = { schema: 1, receipts, summary: {
  baseline: stats(baseline), coreOnly: stats(cores), firstFull: stats(full02), revision2: stats(full03),
  revision3: stats(full04), finalComposite: stats(final),
  coreAffectedBaseline: stats(baseline.filter(r => /core-(force|scout|sniper)/.test(r.id))),
  coreAffectedCandidate: stats(cores.filter(r => /core-(force|scout|sniper)/.test(r.id))) },
  mainGroups: { baseline: groups(baseline), final: groups(final) },
  followup: { baseline: groups(followBase), final: groups(followFinal) },
  alternatives: { baseline: groups(altBase), final: groups(altFinal) },
  bossWins: [...followFinal,...altFinal].filter(r => r.outcome === 'boss_killed').map(({id,seed,elapsedMs,hpEnd,starting}) => ({id,seed,elapsedMs,hpEnd,maxHp:starting.hp})),
  compositeNote: '176 rows reused from full-04; 42 affected Desert/Volcano rows replaced by armor-followup. This is not a single fresh 218-row run.',
  evidenceLimits: 'Synthetic mature mastery and ownership; 180-second first-death cap; two fixed seeds; no production or economy inference. Counts of fullHpLethalHits mean resolved direct hits at least max HP, not necessarily an actual death from full current HP.' };
writeFileSync(resolve(candidate, 'FINAL-RESULTS.json'), JSON.stringify(output,null,2)+'\n');
writeFileSync(resolve(candidate, 'CORE-ONLY.patch'), JSON.parse(readFileSync(resolve(control,'core-02/manifest.json'))).diff.replace(/\r\n/g,'\n').replace(/^ $/gm,''));
console.log(JSON.stringify({summary:output.summary,followup:output.followup,alternatives:output.alternatives,bossWins:output.bossWins},null,2));
