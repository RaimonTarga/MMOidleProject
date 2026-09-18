/**
 * Read-only attribution of monster charged casts to the damage they actually
 * landed, over a sealed ttkSurvey block. Writes only under --out.
 *
 * A charged cast is attributed ONLY when a `monster-cast-end` with `fired:true`
 * is followed, within --window ms (default 200), by a `damage` event from the
 * same monster onto the player. Anything else is reported as unresolved rather
 * than guessed from timestamps.
 *
 * Usage: node scripts/charged-cast-audit.mjs --block=<dir> --out=<dir> [--window=200]
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, basename} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
if (!args.block || !args.out) throw new Error('--block and --out are required');
const WINDOW = Number(args.window ?? 200);
const block = args.block, out = args.out, name = args.name ?? basename(block);
mkdirSync(out, {recursive: true});
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));

const PLAYER = 'bench-bot-0';
const rows = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  if (!existsSync(join(dir, 'events.jsonl'))) continue;
  const events = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
    .map(l => { const r = JSON.parse(l); return {atMs: r.atMs, e: r.event ?? r}; });

  // Player HP over time, so a hit can be reported against the HP it landed on.
  const samples = existsSync(join(dir, 'samples.jsonl'))
    ? readFileSync(join(dir, 'samples.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
    : [];
  const hpAt = ms => {
    let hp = null;
    for (const s of samples) { if (s.atMs > ms) break; hp = s.hp; }
    return hp;
  };

  const casts = [];
  const pending = new Map();
  for (const {atMs, e} of events) {
    if (e.kind === 'monster-cast-start') pending.set(e.monsterId, {label: e.label, castMs: e.castMs, startMs: atMs});
    else if (e.kind === 'monster-cast-end') {
      const p = pending.get(e.monsterId);
      pending.delete(e.monsterId);
      if (p) casts.push({...p, endMs: atMs, fired: e.fired === true, monsterId: e.monsterId});
    }
  }
  for (const c of casts) {
    let hit = null;
    if (c.fired) {
      for (const {atMs, e} of events) {
        if (e.kind !== 'damage' || atMs < c.endMs || atMs > c.endMs + WINDOW) continue;
        if (e.source?.id !== c.monsterId || e.target?.id !== PLAYER) continue;
        hit = {atMs, hpDamage: e.hpDamage, sourceName: e.source.name};
        break;
      }
    }
    c.hit = hit;
    c.hpBefore = hpAt(c.endMs - 1);
    c.resolution = !c.fired ? 'interrupted-or-cancelled' : hit ? 'landed' : 'fired-unattributed';
  }

  // Concurrent attackers in the 3s before each landed charged hit.
  for (const c of casts) {
    if (!c.hit) continue;
    const from = c.hit.atMs - 3000;
    const attackers = new Set();
    let windowDamage = 0;
    for (const {atMs, e} of events) {
      if (e.kind !== 'damage' || atMs < from || atMs > c.hit.atMs) continue;
      if (e.target?.id !== PLAYER) continue;
      attackers.add(e.source.id);
      windowDamage += e.hpDamage ?? 0;
    }
    c.concurrentAttackers3s = attackers.size;
    c.playerDamage3s = Math.round(windowDamage * 100) / 100;
  }

  // What actually landed the killing blow, when the run ended in death.
  let finalBlow = null;
  if (row.outcome === 'player-died') {
    for (let i = events.length - 1; i >= 0; i--) {
      const {atMs, e} = events[i];
      if (e.kind === 'damage' && e.target?.id === PLAYER) {
        const c = casts.find(x => x.hit && x.hit.atMs === atMs && x.monsterId === e.source.id);
        finalBlow = {atMs, source: e.source.name, hpDamage: e.hpDamage, charged: c ? c.label : null};
        break;
      }
    }
  }

  rows.push({
    cell: row.cell, seed: row.seed, outcome: row.outcome, simMs: row.elapsedMs,
    casts: casts.map(c => ({label: c.label, startMs: c.startMs, endMs: c.endMs, resolution: c.resolution,
      hpDamage: c.hit?.hpDamage ?? null, hpBefore: c.hpBefore,
      concurrentAttackers3s: c.concurrentAttackers3s ?? null, playerDamage3s: c.playerDamage3s ?? null})),
    finalBlow,
  });
}

// Per-label aggregates, landed hits only.
const byLabel = {};
for (const r of rows) for (const c of r.casts) {
  const arm = r.cell.endsWith('-candidate') ? 'candidate' : r.cell.endsWith('-control') ? 'control' : 'n/a';
  const k = `${c.label} | ${arm}`;
  byLabel[k] ??= {landed: 0, interrupted: 0, unattributed: 0, damages: []};
  if (c.resolution === 'landed') { byLabel[k].landed++; byLabel[k].damages.push(c.hpDamage); }
  else if (c.resolution === 'interrupted-or-cancelled') byLabel[k].interrupted++;
  else byLabel[k].unattributed++;
}
const summary = {};
for (const [k, v] of Object.entries(byLabel)) {
  const d = v.damages.slice().sort((a, b) => a - b);
  summary[k] = {landed: v.landed, interrupted: v.interrupted, unattributed: v.unattributed,
    min: d[0] ?? null, median: d.length ? d[Math.floor(d.length / 2)] : null, max: d[d.length - 1] ?? null,
    distinct: [...new Set(d)].sort((a, b) => a - b)};
}
const finalBlows = {};
for (const r of rows) if (r.finalBlow) {
  const k = `${r.finalBlow.source}${r.finalBlow.charged ? ' / ' + r.finalBlow.charged : ' / basic'}`;
  finalBlows[k] = (finalBlows[k] ?? 0) + 1;
}

writeFileSync(join(out, `${name}-casts.json`), JSON.stringify({window: WINDOW, rows}, null, 2));
writeFileSync(join(out, `${name}-casts-summary.json`), JSON.stringify({summary, finalBlows}, null, 2));
console.log(JSON.stringify({summary, finalBlows}, null, 1));
