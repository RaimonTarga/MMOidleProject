#!/usr/bin/env node
// One-screen digest of a bot run directory (`runs/<runId>/`): where the route is, kills and
// deaths by zone, every boss attempt, milestones with their times, stalls. Reads the run's
// events.jsonl and deaths.jsonl as they stream, so it works on a run still in progress.
//
//   node tools/lane/runSummary.mjs <runDir | runsDir>   (a runs dir: its newest run)
//   node tools/lane/runSummary.mjs <dir> --deaths       (also one line per death: killer, hit)

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const showDeaths = args.includes('--deaths');
let dir = args.find((a) => !a.startsWith('--'));
if (!dir) {
  console.log('usage: node tools/lane/runSummary.mjs <runDir|runsDir> [--deaths]');
  process.exit(2);
}
if (!fs.existsSync(path.join(dir, 'events.jsonl'))) {
  const runs = fs.readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((p) => fs.existsSync(path.join(p, 'events.jsonl')))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (runs.length === 0) throw new Error(`no run under ${dir}`);
  dir = runs[runs.length - 1];
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* a line still being written */ }
  }
  return out;
}

const events = readJsonl(path.join(dir, 'events.jsonl'));
const deaths = readJsonl(path.join(dir, 'deaths.jsonl'));
const min = (ms) => `${(ms / 60000).toFixed(1)}m`;
const zoneOf = (nodeId) => (nodeId ?? '?').replace(/^node-/, '').replace(/-\d+$/, '');

const last = events[events.length - 1];
const start = events.find((e) => e.kind === 'run-start');
const end = events.find((e) => e.kind === 'run-end');
console.log(`run ${path.basename(dir)}`);
console.log(`elapsed ${min(last?.atMs ?? 0)}${end ? `  ENDED: ${end.outcome ?? end.status ?? JSON.stringify(end).slice(0, 160)}` : '  (running)'}`);
if (start?.route) console.log(`route ${start.route}`);

const steps = events.filter((e) => e.kind === 'route-step-start');
const lastStep = steps[steps.length - 1];
if (lastStep) console.log(`step ${lastStep.index ?? '?'}: ${lastStep.label ?? lastStep.step ?? ''} (since ${min(lastStep.atMs)})`);

const kills = new Map();
for (const e of events.filter((ev) => ev.kind === 'kill')) {
  const z = zoneOf(e.context?.nodeId ?? e.nodeId);
  kills.set(z, (kills.get(z) ?? 0) + 1);
}
const deathsBy = new Map();
for (const d of deaths) {
  const z = zoneOf(d.nodeId);
  deathsBy.set(z, (deathsBy.get(z) ?? 0) + 1);
}
const zones = [...new Set([...kills.keys(), ...deathsBy.keys()])];
console.log(`kills ${[...kills.values()].reduce((a, b) => a + b, 0)}, deaths ${deaths.length}`);
for (const z of zones) console.log(`  ${z.padEnd(28)} kills ${String(kills.get(z) ?? 0).padStart(4)}  deaths ${deathsBy.get(z) ?? 0}`);

const attempts = events.filter((e) => e.kind === 'boss-attempt' && e.phase === 'end');
if (attempts.length) console.log('boss attempts:');
for (const a of attempts) {
  const hp = a.bossHpFraction === undefined ? '?' : `${Math.round(a.bossHpFraction * 100)}%`;
  const fight = a.bossCombatDurationMs === undefined ? '' : ` fight ${(a.bossCombatDurationMs / 1000).toFixed(0)}s`;
  console.log(`  ${min(a.atMs).padStart(6)} ${a.biomeGroup} #${a.attempt} ${a.outcome} boss hp ${hp}${fight}`);
}
const exhausted = events.filter((e) => e.kind === 'boss-step-exhausted');
for (const e of exhausted) console.log(`  BOSS STEP EXHAUSTED ${e.biomeGroup ?? ''} at ${min(e.atMs)}`);

const ms = events.filter((e) => e.kind === 'milestone');
if (ms.length) console.log('milestones: ' + ms.map((m) => `${m.id}@${min(m.atMs)}`).join(', '));
const tiers = events.filter((e) => e.kind === 'tier-up');
if (tiers.length) console.log('tier-ups: ' + tiers.map((t) => `T${t.tier ?? t.toTier ?? '?'}@${min(t.atMs)}`).join(', '));
const crafts = events.filter((e) => e.kind === 'craft');
if (crafts.length) console.log('crafts: ' + crafts.map((c) => `${c.recipeId}${c.success ? '' : '(FAILED)'}`).join(', '));
for (const s of events.filter((e) => e.kind === 'stall')) {
  console.log(`STALL at ${min(s.atMs)}: ${s.reason ?? ''} ${JSON.stringify(s.detail ?? {}).slice(0, 300)}`);
}

if (showDeaths) {
  console.log('deaths:');
  for (const d of deaths) {
    const kb = d.killingBlow;
    const killer = kb?.sourceName ?? kb?.source ?? d.dominantSource?.name ?? '?';
    console.log(`  ${min(d.atMs).padStart(6)} ${zoneOf(d.nodeId)} [${d.routeStepLabel}] cause ${d.cause} killer ${killer}` +
      ` largest ${d.largestHit?.amount ?? d.largestHit?.damage ?? '?'} maxHp ${d.maxHp} attackers ${d.maxConcurrentAttackers}`);
  }
}
