/**
 * Summarise a canonical six-class tutorial sweep into the tables the
 * `docs/guided-tutorial-plan.md` ledger wants: beats passed per chapter, every boss
 * attempt, and the milestones.
 *
 * Chapters are read from `tutorialScriptFor` rather than guessed from beat names, so
 * this cannot drift from the script. A route step's label is `<beatId>: <stepType>`
 * and a beat can emit several steps, so beats are counted DISTINCT -- the ledger's
 * "11/11" for the Clearing is eleven beats, not eleven steps.
 *
 *   tsx scripts/_t1Sweep.ts <experiment-artifacts-dir>
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TUTORIAL_CLASS_PLANS, tutorialScriptFor } from '@mmo-idle/shared';

const root = process.argv[2];
assert(root && existsSync(join(root, 'state.json')), 'usage: _t1Sweep.ts <experiment-dir>');

/** beat id -> chapter, for every class, plus the chapter order the script uses. */
const chapterOf = new Map<string, string>();
const chapterOrder: string[] = [];
for (const plan of TUTORIAL_CLASS_PLANS) {
  for (const beat of tutorialScriptFor(plan.classRoot).beats) {
    chapterOf.set(beat.id, beat.chapter);
    if (!chapterOrder.includes(beat.chapter)) chapterOrder.push(beat.chapter);
  }
}

interface Ev { kind: string; atMs?: number; label?: string; outcome?: string; phase?: string;
  biomeGroup?: string; attempt?: number; bossHpFraction?: number; durationMs?: number;
  bossCombatStartedAtMs?: number; bossCombatEndedAtMs?: number; newTier?: number;
  id?: string; header?: { gitRevision?: string; taints?: unknown[] }; detail?: { globalMastery?: number } }

const state = JSON.parse(readFileSync(join(root, 'state.json'), 'utf8')) as
  { experimentId: string; runs: { runKey: string; status: string; reason?: string }[] };

function eventsFor(runKey: string): Ev[] {
  const art = join(root, 'runs', runKey, 'artifacts');
  if (!existsSync(art)) return [];
  for (const d of readdirSync(art)) {
    const p = join(art, d, 'events.jsonl');
    if (!existsSync(p)) continue;
    return readFileSync(p, 'utf8').split('\n').filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l) as Ev; } catch { return null; } })
      .filter((e): e is Ev => e !== null);
  }
  return [];
}

const runs = state.runs.map((run) => ({ run, events: eventsFor(run.runKey) }));
const cls = (k: string) => k.replace(/^\d+-tutorial-/, '').replace(/-t1-intended-r\d+$/, '');
const beatId = (label: string) => label.slice(0, label.lastIndexOf(': '));
const mins = (ms?: number) => ms === undefined ? '—' : `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s`;
const secs = (ms?: number) => ms === undefined ? '—' : `${Math.round(ms / 1000)} s`;
/**
 * `boss-attempt`'s whole outcome vocabulary is `victory | death | timeout | unreachable`
 * (bot/src/route/executor.ts), so only `victory` is a win and the other three are all
 * real failures — a `timeout` is a fight the bot could not finish, not a missing row.
 */
const WON = new Set(['victory']);

const header = runs.find((r) => r.events.length > 0)?.events.find((e) => e.kind === 'run-start')?.header;
console.log(`\n# ${state.experimentId}`);
console.log(`revision \`${header?.gitRevision ?? '?'}\`  taints: ${JSON.stringify(header?.taints ?? [])}\n`);

console.log('## Beats passed per chapter (a short cell is beats never reached)\n');
console.log(`| Class | ${chapterOrder.join(' | ')} | status | deaths | wall |`);
console.log(`|---|${chapterOrder.map(() => '---').join('|')}|---|---|---|`);
const notDone: string[] = [];
for (const { run, events } of runs) {
  const seen = new Map<string, boolean>();
  for (const e of events) {
    if (e.kind === 'route-step-start' && e.label) seen.set(beatId(e.label), seen.get(beatId(e.label)) ?? false);
    if (e.kind === 'route-step-end' && e.label) {
      const id = beatId(e.label);
      if (e.outcome === 'done') seen.set(id, seen.get(id) === false ? true : seen.get(id) ?? true);
      else notDone.push(`${cls(run.runKey)}: ${e.label} -> ${e.outcome}`);
    }
  }
  const cells = chapterOrder.map((ch) => {
    const ids = [...seen.keys()].filter((id) => chapterOf.get(id) === ch);
    if (ids.length === 0) return '—';
    return `${ids.filter((id) => seen.get(id)).length}/${ids.length}`;
  });
  const deaths = events.filter((e) => e.kind === 'player-death' || e.kind === 'death').length;
  console.log(`| ${cls(run.runKey)} | ${cells.join(' | ')} | ${run.status}${run.reason ? ` (${run.reason})` : ''} | ${deaths} | ${mins(events.at(-1)?.atMs)} |`);
}
console.log(`\n**Beats not \`done\`: ${notDone.length === 0 ? 'none.**' : `${notDone.length}.**`}`);
for (const b of notDone) console.log(`- ${b}`);

console.log('\n## Every boss attempt\n');
console.log('| Class | biome | attempt | outcome | boss HP left | fight | attempt total |');
console.log('|---|---|---|---|---|---|---|');
for (const { run, events } of runs) {
  for (const e of events.filter((x) => x.kind === 'boss-attempt' && x.phase === 'end')) {
    const hp = e.bossHpFraction === undefined ? '—' : `${Math.round(e.bossHpFraction * 1000) / 10}%`;
    const fight = e.bossCombatStartedAtMs !== undefined && e.bossCombatEndedAtMs !== undefined
      ? secs(e.bossCombatEndedAtMs - e.bossCombatStartedAtMs) : '—';
    console.log(`| ${cls(run.runKey)} | ${e.biomeGroup} | ${e.attempt} | ${e.outcome} | ${hp} | ${fight} | ${secs(e.durationMs)} |`);
  }
}

console.log('\n## Boss summary — wins / attempts, and where the losses died\n');
console.log('| Class | Plains seal | Mountain seal | Greatbear (gate, needs 3 kills) |');
console.log('|---|---|---|---|');
for (const { run, events } of runs) {
  const att = events.filter((x) => x.kind === 'boss-attempt' && x.phase === 'end');
  const cell = (biome: string) => {
    const a = att.filter((x) => x.biomeGroup === biome);
    if (a.length === 0) return 'not reached';
    const w = a.filter((x) => WON.has(x.outcome ?? ''));
    const L = a.filter((x) => !WON.has(x.outcome ?? '') && x.bossHpFraction !== undefined)
      .map((x) => x.bossHpFraction! * 100);
    const range = L.length > 0 ? ` (lost at ${Math.round(Math.min(...L))}–${Math.round(Math.max(...L))}%)` : '';
    const t = w.length > 0 ? `, ${secs(Math.min(...w.map((x) => x.durationMs ?? Infinity)))} best` : '';
    return `**${w.length}/${a.length}**${t}${range}`;
  };
  console.log(`| ${cls(run.runKey)} | ${cell('plains')} | ${cell('mountain')} | ${cell('forest')} |`);
}

console.log('\n## Milestones\n');
console.log('| Class | GM 30 | Tier 2 | gate paid | last event |');
console.log('|---|---|---|---|---|');
for (const { run, events } of runs) {
  const gm30 = events.find((e) => e.kind === 'milestone' && (e.detail?.globalMastery ?? 0) >= 30)
    ?? events.filter((e) => e.kind === 'biome-level-up').at(-1);
  const t2 = events.find((e) => e.kind === 'tier-up' && (e.newTier ?? 0) >= 2);
  const gate = events.find((e) => e.kind === 'route-step-end' && /^gate:/.test(e.label ?? '') && e.outcome === 'done');
  console.log(`| ${cls(run.runKey)} | ${mins(gm30?.atMs)} | ${mins(t2?.atMs)} | ${mins(gate?.atMs)} | ${mins(events.at(-1)?.atMs)} |`);
}
console.log();
