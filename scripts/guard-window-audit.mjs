/**
 * Read-only guard-window analysis over a sealed ttkSurvey block. Writes only under --out.
 *
 * Answers the questions a deaths-only median cannot:
 *  - all four PAIRED joint outcomes, not two terminal labels;
 *  - guard activations against ALIVE time, because equal run counts do not imply
 *    equal exposure;
 *  - every activation, including windows truncated by death or by the end of
 *    recording. Durability34 logged 38 Brace activations but only 30 recorded
 *    expiries; closing an interval only on an expiry silently drops 8;
 *  - damage split by DEFENSE STATE — inside an active guard window versus
 *    outside it. When the treatment is a defensive guard, unchanged monster
 *    coefficients do NOT imply unchanged final HP damage, so conditioning on the
 *    defense state is the analysis, not a confound to be removed.
 *
 * Arms come from the block manifest and an undeclared arm fails loudly.
 *
 * Usage:
 *   node scripts/guard-window-audit.mjs --block=<dir> --out=<dir>
 *        [--guard-buff=ability-guard] [--fallback-ms=3000] [--name=x]
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, basename} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const i = s.indexOf('=');
  return i < 0 ? [s.replace(/^--/, ''), 'true'] : [s.slice(2, i), s.slice(i + 1)];
}));
if (!args.block || !args.out) throw new Error('--block and --out are required');
const block = args.block, out = args.out, name = args.name ?? basename(block);
const GUARD_BUFF = args['guard-buff'] ?? 'ability-guard';
/** Used only when an interval has no recorded expiry; always clipped to the run. */
const FALLBACK_MS = Number(args['fallback-ms'] ?? 3000);
mkdirSync(out, {recursive: true});
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const index = rd(join(block, 'index.json'));
const manifest = rd(join(block, 'manifest.json'));
const PLAYER = 'bench-bot-0';

const cellMeta = new Map(manifest.cells.map(c => [c.id, c]));
const arms = [...new Set(manifest.cells.map(c => c.treatment))].filter(Boolean).sort();
if (arms.length === 0) throw new Error(`${name}: manifest declares no treatment`);
function metaOf(id) {
  const m = cellMeta.get(id);
  if (!m) throw new Error(`${name}: cell "${id}" is not declared in the manifest`);
  if (!m.treatment) throw new Error(`${name}: cell "${id}" declares no treatment; refusing to pool it`);
  return m;
}
function median(v) {
  if (!v.length) return null;
  const a = [...v].sort((x, y) => x - y), m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

const rows = [];
for (const row of index) {
  const dir = join(block, `${row.cell}-s${row.seed}`);
  if (!existsSync(join(dir, 'events.jsonl'))) continue;
  const meta = metaOf(row.cell);
  const events = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split(String.fromCharCode(10))
    .filter(Boolean).map(l => { const r = JSON.parse(l); return {atMs: r.atMs, e: r.event ?? r}; })
    .sort((a, b) => (a.atMs - b.atMs) || ((a.e.id ?? 0) - (b.e.id ?? 0)));

  const aliveMs = row.elapsedMs;
  const activations = [];
  const gains = [];
  for (const {atMs, e} of events) {
    if (e.kind === 'ability-activation' && e.player?.id === PLAYER) activations.push({atMs, abilityId: e.abilityId});
    if (e.kind === 'buff-gain' && e.buffId === GUARD_BUFF && e.target?.id === PLAYER) gains.push({atMs, label: e.label});
    if (e.kind === 'buff-expire' && e.buffId === GUARD_BUFF && e.target?.id === PLAYER) {
      const open = gains.find(g => g.endMs === undefined);
      if (open) { open.endMs = atMs; open.closedBy = 'expiry'; }
    }
  }
  // Close every remaining interval against the run itself, never drop it.
  for (const g of gains) {
    if (g.endMs !== undefined) continue;
    g.endMs = Math.min(g.atMs + FALLBACK_MS, aliveMs);
    g.closedBy = row.outcome === 'player-died' && g.atMs + FALLBACK_MS > aliveMs ? 'truncated-by-death' : 'truncated-by-recording-end';
  }

  const inWindow = ms => gains.some(g => ms >= g.atMs && ms <= g.endMs);
  const hits = [];
  for (const {atMs, e} of events) {
    if (e.kind !== 'damage' || e.target?.id !== PLAYER) continue;
    hits.push({atMs, source: e.source?.name, hpDamage: e.hpDamage ?? null,
      grossDamage: e.mitigation?.grossDamage ?? null, absorbed: e.absorbed ?? null,
      guarded: inWindow(atMs)});
  }
  const guarded = hits.filter(h => h.guarded), unguarded = hits.filter(h => !h.guarded);
  const guardedMs = gains.reduce((n, g) => n + (g.endMs - g.atMs), 0);

  rows.push({
    cell: row.cell, seed: row.seed, arm: meta.treatment, root: meta.className, nodeId: meta.nodeId,
    outcome: row.outcome, aliveMs, timeToFirstDeathMs: row.outcome === 'player-died' ? row.elapsedMs : null,
    completedWindow: row.outcome === 'window-ended',
    activations: activations.reduce((acc, a) => { acc[a.abilityId] = (acc[a.abilityId] ?? 0) + 1; return acc; }, {}),
    guardWindows: gains.length,
    guardWindowsClosedByExpiry: gains.filter(g => g.closedBy === 'expiry').length,
    guardWindowsTruncated: gains.filter(g => g.closedBy !== 'expiry').length,
    guardedMs, guardedFraction: aliveMs ? Number((guardedMs / aliveMs).toFixed(4)) : null,
    hitsTotal: hits.length, hitsGuarded: guarded.length, hitsUnguarded: unguarded.length,
    medianHpDamageGuarded: median(guarded.map(h => h.hpDamage).filter(v => v != null)),
    medianHpDamageUnguarded: median(unguarded.map(h => h.hpDamage).filter(v => v != null)),
    intervals: gains.map(g => ({startMs: g.atMs, endMs: g.endMs, closedBy: g.closedBy, label: g.label})),
  });
}

// ── Four paired joint outcomes. Two terminal labels still make four categories.
let paired = null;
if (arms.length === 2) {
  const [a, b] = arms;
  const byKey = new Map();
  for (const r of rows) {
    const k = `${r.root}|${r.nodeId}|${r.seed}`;
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k)[r.arm] = r;
  }
  const joint = {[`both survived`]: 0, [`both died`]: 0, [`${a} died / ${b} survived`]: 0, [`${a} survived / ${b} died`]: 0};
  const discordant = [];
  let pairs = 0;
  for (const [k, p] of byKey) {
    if (!p[a] || !p[b]) continue;
    pairs++;
    const da = p[a].outcome === 'player-died', db = p[b].outcome === 'player-died';
    if (!da && !db) joint['both survived']++;
    else if (da && db) joint['both died']++;
    else if (da && !db) { joint[`${a} died / ${b} survived`]++; discordant.push({key: k, favoured: b, [a]: p[a].aliveMs, [b]: p[b].aliveMs}); }
    else { joint[`${a} survived / ${b} died`]++; discordant.push({key: k, favoured: a, [a]: p[a].aliveMs, [b]: p[b].aliveMs}); }
  }
  paired = {arms: [a, b], pairs, joint, discordant};
}

const byArm = {};
for (const r of rows) {
  const s = (byArm[r.arm] ??= {n: 0, deaths: 0, completed: 0, aliveMs: 0, guardWindows: 0, truncated: 0,
    guardedMs: 0, hitsGuarded: 0, hitsUnguarded: 0, guardedDmg: [], unguardedDmg: []});
  s.n++; if (r.outcome === 'player-died') s.deaths++; if (r.completedWindow) s.completed++;
  s.aliveMs += r.aliveMs; s.guardWindows += r.guardWindows; s.truncated += r.guardWindowsTruncated;
  s.guardedMs += r.guardedMs; s.hitsGuarded += r.hitsGuarded; s.hitsUnguarded += r.hitsUnguarded;
  if (r.medianHpDamageGuarded != null) s.guardedDmg.push(r.medianHpDamageGuarded);
  if (r.medianHpDamageUnguarded != null) s.unguardedDmg.push(r.medianHpDamageUnguarded);
}
const armSummary = {};
for (const [arm, s] of Object.entries(byArm)) {
  armSummary[arm] = {
    observations: s.n, deaths: s.deaths, completedWindows: s.completed,
    totalAliveSeconds: Number((s.aliveMs / 1000).toFixed(1)),
    guardWindows: s.guardWindows, guardWindowsTruncated: s.truncated,
    activationsPerAliveMinute: s.aliveMs ? Number((s.guardWindows / (s.aliveMs / 60000)).toFixed(3)) : null,
    guardedTimeFraction: s.aliveMs ? Number((s.guardedMs / s.aliveMs).toFixed(4)) : null,
    hitsGuarded: s.hitsGuarded, hitsUnguarded: s.hitsUnguarded,
    medianOfPerRunGuardedHp: median(s.guardedDmg), medianOfPerRunUnguardedHp: median(s.unguardedDmg),
  };
}

const report = {
  schemaVersion: 1, block: name, declaredArms: arms, guardBuffId: GUARD_BUFF, fallbackMs: FALLBACK_MS,
  conventions: {
    intervals: 'every activation is closed: by its recorded expiry, else by activation+fallback clipped to the run. Truncated intervals are counted, never dropped',
    guardedHit: 'a player-damage event whose timestamp lies inside a guard interval, using actual event order',
    exposure: 'activations are reported per ALIVE minute; equal run counts do not imply equal time alive',
    pairedJoint: 'all four joint outcomes over pairs matched on (class, node, seed)',
    defenseState: 'damage is split by defense state on purpose. With a defensive treatment, identical monster coefficients do not imply identical final HP damage',
    deathsOnlyMedian: 'a median over dying runs is conditional on dying and is not a paired estimate of survival gained',
  },
  armSummary, paired, rows,
};
writeFileSync(join(out, `${name}-guard-windows.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({block: name, declaredArms: arms, armSummary, paired: paired && {pairs: paired.pairs, joint: paired.joint}}, null, 1));
