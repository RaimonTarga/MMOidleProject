/**
 * The tutorial's per-class lean + verb picks, read off the T1 boss-lab composition
 * matrix (verbs-that-fire wave 2, design §24.9):
 *
 *   for each class, on the weapon it FIGHTS with (its `bossKit` weapon: the Chaotic
 *   Axe, the Slinger's Poison Dagger), the pair with the best boss-lab uplift among
 *   the pairs whose verb fired for that class (verb firings > 0).
 *
 * Uplift is the composition report's own (`bench/compositionReport.ts`): mean boss DPS
 * over the same class's no-card control on the same boss and seeds, median over the
 * five bosses. Prints, per class, every pair on its weapon (uplift · fires/min · win
 * rate vs the control) and the pick, and the plan's current pick beside it.
 *
 *   node --conditions=development --import tsx scripts/_vfTutorialPicks.ts <matrix-boss.jsonl> [--md]
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { LINEAGE_DATABASE, TUTORIAL_CLASS_PLANS } from '@mmo-idle/shared';
import { compositionPairs } from '../bench/lineage/compositionPairs';
import { medianOf } from '../bench/lineage/viabilityFloor';

interface Row {
  id: string; boss: string; cls: string; lineage: string; dps: number; won: boolean; t: number; verbFires: number;
}

const path = process.argv[2];
assert(path && existsSync(path), 'usage: _vfTutorialPicks.ts <matrix-boss.jsonl>');
const rows: Row[] = readFileSync(path, 'utf8').split('\n').filter((l) => l.trim())
  .map((l) => JSON.parse(l) as Row).filter((r) => r.id.startsWith('cmp-'));
const pairOf = (r: Row) => r.id.slice(`cmp-${r.lineage}-`.length, r.id.indexOf('|'));
const by = new Map<string, Row[]>();
for (const r of rows) {
  const k = `${r.lineage}|${r.cls}|${pairOf(r)}|${r.boss}`;
  by.set(k, [...(by.get(k) ?? []), r]);
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x: number | null) => (x === null || Number.isNaN(x) ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`);
const bosses = [...new Set(rows.map((r) => r.boss))];

console.log(`${rows.length} rows from ${path}; bosses: ${bosses.join(', ')}\n`);
for (const plan of TUTORIAL_CLASS_PLANS) {
  const cls = plan.className.toLowerCase();
  const weapon = plan.bossKit.find((id) => [...LINEAGE_DATABASE.values()].some((l) => l.slot === 'weapon' && l.forms.some((f) => f.recipeId === id)))!;
  const lineage = [...LINEAGE_DATABASE.values()].find((l) => l.forms.some((f) => f.recipeId === weapon))!;
  const name = (id: string | undefined) => lineage.cards.find((c) => c.id === id)?.name ?? '—';
  const readings = compositionPairs(lineage).filter((p) => p.label !== 'control').map((pair) => {
    const uplifts: number[] = [];
    let fires = 0; let ms = 0; let wins = 0; let n = 0; let cWins = 0; let cn = 0;
    for (const boss of bosses) {
      const mine = by.get(`${lineage.id}|${cls}|${pair.label}|${boss}`) ?? [];
      const control = by.get(`${lineage.id}|${cls}|control|${boss}`) ?? [];
      if (!mine.length || !control.length) continue;
      const c = mean(control.map((r) => r.dps));
      if (c > 0) uplifts.push(mean(mine.map((r) => r.dps)) / c - 1);
      fires += mine.reduce((a, r) => a + r.verbFires, 0);
      ms += mine.reduce((a, r) => a + r.t * 1000, 0);
      wins += mine.filter((r) => r.won).length; n += mine.length;
      cWins += control.filter((r) => r.won).length; cn += control.length;
    }
    return {
      pair, uplift: medianOf(uplifts), meanUplift: mean(uplifts), fires, perMin: ms > 0 ? fires / (ms / 60_000) : 0,
      win: n ? wins / n : NaN, cWin: cn ? cWins / cn : NaN, n,
    };
  }).filter((r) => r.n > 0);
  const firing = readings.filter((r) => r.fires > 0 && r.uplift !== null);
  // Best median uplift; a tie at the reported precision (0.1 pp) goes to the mean over the bosses.
  const rounded = (x: number | null) => Math.round((x ?? 0) * 1000);
  const best = [...firing].sort((a, b) => rounded(b.uplift) - rounded(a.uplift) || b.meanUplift - a.meanUplift)[0];
  const current = readings.find((r) => r.pair.leanCardId === plan.weaponCards.lean && r.pair.verbCardId === plan.weaponCards.verb);
  console.log(`### ${plan.className} — ${lineage.id} (${weapon}); ${readings[0]?.n ?? 0} fights per pair`);
  console.log('| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |');
  console.log('|---|---|---:|---:|---|');
  for (const r of [...readings].sort((a, b) => (b.uplift ?? -9) - (a.uplift ?? -9))) {
    const mark = r === best ? ' **pick**' : r === current ? ' (plan)' : '';
    console.log(`| ${r.pair.label}${mark} | ${name(r.pair.leanCardId)} → ${name(r.pair.verbCardId)} | ${pct(r.uplift)} · ${pct(r.meanUplift)} | ${r.perMin.toFixed(1)}${r.fires === 0 ? ' ⌀' : ''} | ${(r.win * 100).toFixed(0)}% (${(r.cWin * 100).toFixed(0)}%) |`);
  }
  console.log(`pick: ${best ? `${best.pair.label} = ${name(best.pair.leanCardId)} → ${name(best.pair.verbCardId)} (${pct(best.uplift)}, ${best.perMin.toFixed(1)}/min)` : 'none fires'}`
    + `; plan: ${current ? `${current.pair.label} (${pct(current.uplift)})` : 'not in the matrix'}`
    + `${best && current && best !== current ? '  <-- DIFFERS' : ''}\n`);
}
