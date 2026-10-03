/**
 * Summarise a 1x six-class tutorial sweep run with one server per class and the
 * bots launched directly (`bot/src/run.ts`), not through the frozen experiment
 * runner — so it reads plain bot run directories, not an experiment's state.json.
 * `_t1Sweep.ts` is the experiment-runner sibling.
 *
 *   node --conditions=development --import tsx scripts/_ccTutorialSweep.ts <runs-dir> [<out.json>] [--skip=<Chapter>,…]
 *
 * The checklist is measured against the CURRENT script's `teaches`; `--skip` leaves
 * out chapters whose beat order changed after the runs' revision.
 *
 * Prints the ledger the course-correction report wants (docs/guided-tutorial-plan.md):
 * per class — completion, wall time, beats passed / total by chapter, deaths and
 * where, every seal and gate attempt, the lean and verb purchases (time, levels,
 * Global Mastery), stalls — and the first-hour checklist measured: the level each
 * beat's line was ACTUALLY shown at (beat start + the run's own level-ups), with
 * skipped farm beats (already satisfied, so the guide never shows them) left out.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LINEAGE_DATABASE,
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  tutorialScriptFor,
  type TutorialConceptId,
} from '@mmo-idle/shared';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const root = positional[0];
assert(root && existsSync(root), 'usage: _ccTutorialSweep.ts <runs-dir> [<out.json>] [--skip=<Chapter>,…]');
const outJson = positional[1];
const skipChapters = new Set((process.argv.find((a) => a.startsWith('--skip='))?.slice('--skip='.length) ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean));

interface Ev {
  kind: string; atMs: number; label?: string; outcome?: string; reason?: string; durationMs?: number;
  id?: string; biomeGroup?: string | null; newLevel?: number; newTier?: number; attempt?: number; phase?: string;
  bossHpFraction?: number; bossCombatDurationMs?: number; completion?: string; system?: string;
  detail?: Record<string, unknown>; header?: { gitRevision?: string; taints?: unknown[]; routeId?: string; routeVersion?: string };
}
interface Death {
  atMs: number; biomeGroup?: string | null; nodeId?: string; routeStepLabel?: string;
  cause?: { killer?: { monsterName?: string; isBoss?: boolean } };
}

const jsonl = <T>(path: string): T[] => (existsSync(path)
  ? readFileSync(path, 'utf8').split('\n').filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l) as T; } catch { return null; } })
    .filter((e): e is NonNullable<typeof e> => e !== null) as T[]
  : []);

const mins = (ms?: number) => {
  if (ms === undefined) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};
const beatOf = (label: string) => label.slice(0, label.lastIndexOf(': '));
const ZONE: Record<string, string> = {
  'The Clearing': 'clearing', 'The Plains': 'plains', 'The Forest': 'forest',
  'The Swamp': 'swamp', 'The Mountain': 'mountain', 'The Cave': 'cave',
};
// Card names across every lineage: the course-correction sweep's pairs were the Rapier's; since
// verbs-that-fire wave 2 each plan names its own lineage (`weaponCards.lineageId`).
const cardName = (id: string) => [...LINEAGE_DATABASE.values()].flatMap((l) => l.cards).find((c) => c.id === id)?.name ?? id;

const ledger: Record<string, unknown>[] = [];
const measured: string[] = [];

for (const plan of TUTORIAL_CLASS_PLANS) {
  const cls = plan.className.toLowerCase();
  const dir = readdirSync(root).filter((d) => d.startsWith(`tutorial-${cls}-t1-`)).sort().at(-1);
  if (!dir) { console.log(`\n${plan.className}: no run`); continue; }
  const events = jsonl<Ev>(join(root, dir, 'events.jsonl'));
  const deaths = jsonl<Death>(join(root, dir, 'deaths.jsonl'));
  const script = tutorialScriptFor(plan.classRoot);
  const header = events.find((e) => e.kind === 'run-start')?.header;
  const end = events.find((e) => e.kind === 'run-end');
  const last = events.at(-1)?.atMs ?? 0;

  // Levels as the run reached them.
  const levelUps = events.filter((e) => e.kind === 'biome-level-up');
  const levelAt = (zone: string, atMs: number) => levelUps
    .filter((e) => e.biomeGroup === zone && e.atMs <= atMs)
    .reduce((max, e) => Math.max(max, e.newLevel ?? 0), 0);
  const gmAt = (atMs: number) => {
    const levels: Record<string, number> = {};
    for (const e of levelUps) if (e.atMs <= atMs && e.biomeGroup && e.biomeGroup !== 'clearing') levels[e.biomeGroup] = e.newLevel ?? 0;
    return Object.values(levels).reduce((a, b) => a + b, 0);
  };

  // Beats: started, done (every step `done`), and how long their steps took.
  const starts = new Map<string, number>();
  const stepEnds = new Map<string, Ev[]>();
  for (const e of events) {
    if (e.kind === 'route-step-start' && e.label && !starts.has(beatOf(e.label))) starts.set(beatOf(e.label), e.atMs);
    if (e.kind === 'route-step-end' && e.label) stepEnds.set(beatOf(e.label), [...(stepEnds.get(beatOf(e.label)) ?? []), e]);
  }
  const notDone = events.filter((e) => e.kind === 'route-step-end' && e.outcome !== 'done');
  const beatDone = (id: string) => {
    const beat = script.beats.find((b) => b.id === id)!;
    const ends = stepEnds.get(id) ?? [];
    return ends.length >= beat.steps.length && ends.every((e) => e.outcome === 'done');
  };
  const chapters: string[] = [];
  for (const b of script.beats) if (!chapters.includes(b.chapter)) chapters.push(b.chapter);
  const perChapter = chapters.map((ch) => {
    const ids = script.beats.filter((b) => b.chapter === ch).map((b) => b.id);
    return `${ids.filter(beatDone).length}/${ids.length}`;
  });
  const passed = script.beats.filter((b) => beatDone(b.id)).length;

  // Bosses.
  const attempts = events.filter((e) => e.kind === 'boss-attempt' && e.phase === 'end');
  const bossCell = (biome: string) => {
    const a = attempts.filter((e) => e.biomeGroup === biome);
    if (a.length === 0) return 'not reached';
    const won = a.filter((e) => e.outcome === 'victory');
    const lost = a.filter((e) => e.outcome !== 'victory').map((e) => `${e.outcome}${e.bossHpFraction !== undefined ? ` ${Math.round(e.bossHpFraction * 100)}%` : ''}`);
    const fights = won.map((e) => e.bossCombatDurationMs).filter((x): x is number => x !== undefined);
    return `${won.length}/${a.length}${fights.length ? `, fight ${Math.round(Math.min(...fights) / 1000)}–${Math.round(Math.max(...fights) / 1000)} s` : ''}${lost.length ? ` (lost: ${lost.join(', ')})` : ''}`;
  };

  // Purchases.
  const milestone = (id: string) => events.find((e) => e.kind === 'milestone' && e.id === id)?.atMs;
  // How long the purchase's shards farm stood (0 s: skipped, the wallet already covered it).
  const farmFor = (cardId: string) => {
    const ends = stepEnds.get(`shards:${cardId}`) ?? [];
    return ends.length === 0 ? '' : `, farm ${Math.round(ends.reduce((t, e) => t + (e.durationMs ?? 0), 0) / 1000)} s`;
  };
  const purchase = (milestoneId: string, cardId: string) => {
    const at = milestone(milestoneId);
    if (at === undefined) return 'not bought';
    return `${mins(at)} (Forest ${levelAt('forest', at)}, GM ${gmAt(at)}${farmFor(cardId)})`;
  };

  const stallEvents = events.filter((e) => e.kind === 'stall' || e.kind === 'boss-step-exhausted');
  const row = {
    class: plan.className,
    revision: header?.gitRevision?.slice(0, 8) ?? '?',
    taints: header?.taints ?? [],
    completion: end?.completion ?? 'running',
    endReason: end?.reason ?? null,
    wallMs: end?.durationMs ?? last,
    tier2Ms: milestone('tier-2-reached') ?? null,
    gm30Ms: milestone('gm-30-all-maxed') ?? null,
    gatePaidMs: milestone('gate-paid') ?? null,
    beatsPassed: passed,
    beatsTotal: script.beats.length,
    perChapter: Object.fromEntries(chapters.map((ch, i) => [ch, perChapter[i]])),
    deaths: deaths.map((d) => ({
      atMs: d.atMs, where: d.biomeGroup ?? d.nodeId, step: d.routeStepLabel,
      killer: `${d.cause?.killer?.monsterName ?? '?'}${d.cause?.killer?.isBoss ? ' (boss)' : ''}`,
    })),
    seals: { plains: bossCell('plains'), mountain: bossCell('mountain') },
    gate: bossCell('forest'),
    lean: { card: cardName(plan.weaponCards.lean), at: purchase('first-lineage-card', plan.weaponCards.lean) },
    verb: { card: cardName(plan.weaponCards.verb), at: purchase('verb-card', plan.weaponCards.verb) },
    notDone: notDone.map((e) => `${e.label} -> ${e.outcome}${e.reason ? ` (${e.reason})` : ''}`),
    stalls: stallEvents.map((e) => `${mins(e.atMs)} ${e.kind}${e.reason ? `: ${e.reason}` : ''}`),
  };
  ledger.push(row);

  // The first-hour checklist, measured: the ideas each SHOWN beat introduced, at
  // the level the run was at when the beat started. A beat whose steps all ended
  // in ~0 ms was already satisfied, so the client guide would never show it.
  const shownAt = new Map<string, TutorialConceptId[]>();
  for (const beat of script.beats) {
    const at = starts.get(beat.id);
    if (at === undefined || !beat.teaches?.length || skipChapters.has(beat.chapter)) continue;
    const ends = stepEnds.get(beat.id) ?? [];
    const skipped = ends.length > 0 && ends.every((e) => (e.durationMs ?? 0) < 200 && e.outcome === 'done')
      && beat.steps.every((s) => s.type === 'farm');
    if (skipped) { measured.push(`${plan.className}: ${beat.id} skipped (line never shown): ${beat.teaches.join(', ')}`); continue; }
    const zone = ZONE[beat.chapter];
    const level = zone ? `${beat.chapter.replace(/^The /, '')} ${levelAt(zone, at)}` : beat.chapter;
    shownAt.set(level, [...(shownAt.get(level) ?? []), ...beat.teaches]);
  }
  for (const [level, ideas] of shownAt) {
    if (ideas.length > TUTORIAL_CONCEPTS_PER_LEVEL) measured.push(`${plan.className}: ${level} showed ${ideas.length} ideas (${ideas.join(', ')})`);
  }
}

// ── Print ────────────────────────────────────────────────────────────────────
const L = ledger as Array<ReturnType<typeof Object> & Record<string, any>>;
console.log(`\nrevision ${[...new Set(L.map((r) => r.revision))].join(', ')} · taints ${JSON.stringify([...new Set(L.flatMap((r) => r.taints))])}\n`);
const chapters = Object.keys(L[0]?.perChapter ?? {});
console.log(`| Class | ${chapters.join(' | ')} | beats | outcome | wall | deaths |`);
console.log(`|---|${chapters.map(() => '---').join('|')}|---|---|---|---|`);
for (const r of L) {
  console.log(`| ${r.class} | ${chapters.map((c) => r.perChapter[c] ?? '—').join(' | ')} | ${r.beatsPassed}/${r.beatsTotal} | ${r.completion}${r.endReason ? ` (${r.endReason})` : ''} | ${mins(r.wallMs)} | ${r.deaths.length} |`);
}
console.log('\n| Class | Lean (bought) | Verb (bought) | GM 30 | Plains seal | Mountain seal | Greatbear (gate, 3 kills) | Tier 2 | gate paid |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const r of L) {
  console.log(`| ${r.class} | ${r.lean.card}, ${r.lean.at} | ${r.verb.card}, ${r.verb.at} | ${mins(r.gm30Ms ?? undefined)} | ${r.seals.plains} | ${r.seals.mountain} | ${r.gate} | ${mins(r.tier2Ms ?? undefined)} | ${mins(r.gatePaidMs ?? undefined)} |`);
}
console.log('\nDeaths:');
for (const r of L) for (const d of r.deaths) console.log(`- ${r.class} ${mins(d.atMs)} in ${d.where}, ${d.step}, by ${d.killer}`);
console.log('\nNot done / stalls:');
for (const r of L) for (const s of [...r.notDone, ...r.stalls]) console.log(`- ${r.class}: ${s}`);
console.log('\nFirst-hour checklist, measured:');
for (const m of measured) console.log(`- ${m}`);
if (outJson) writeFileSync(outJson, `${JSON.stringify({ ledger, measured }, null, 2)}\n`);
