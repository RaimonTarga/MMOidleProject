/**
 * Summarise the verbs-that-fire 1x six-class tutorial sweep (wave 2): one server and
 * one game database per class, bots launched directly (`bot/src/run.ts`). The model is
 * `_ccTutorialSweep.ts` (the course-correction sweep); this one adds what that sweep
 * could not show — the card FIRINGS the bot now records (`card-fired`, and our own
 * damage-over-time ticks as `own-dot-ticks`) — and reads each class's own lineage.
 *
 *   node --conditions=development --import tsx scripts/_vfTutorialSweep.ts <runs-dir> [<out.json>] [--before=<sweep-1x.json>]
 *
 * Per class: completion, wall, beats by chapter, deaths, the weapon in the slot at each
 * purchase, purchase time with the home zone's level and Global Mastery, the verb's
 * composed sentence (`verbSentence`, the page's own), verb firings in every boss fight
 * (the seals and the gate) and per minute of farming after the purchase, the lean's
 * own condition where it seeds one (own bleed ticks), seals, gate, and the first-hour
 * checklist measured at the level each beat was ACTUALLY shown at. `--before` adds the
 * comparison against the previous sweep's JSON (`reports/course-correction/sweep-1x.json`).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LINEAGE_DATABASE,
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  TUTORIAL_SEALS,
  globalMastery as globalMasteryOf,
  tutorialScriptFor,
  verbSentence,
  type TutorialConceptId,
} from '@mmo-idle/shared';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const root = positional[0];
assert(root && existsSync(root), 'usage: _vfTutorialSweep.ts <runs-dir> [<out.json>] [--before=<sweep-1x.json>]');
const outJson = positional[1];
const beforePath = process.argv.find((a) => a.startsWith('--before='))?.slice('--before='.length);

interface Ev {
  kind: string; atMs: number; label?: string; outcome?: string; reason?: string; durationMs?: number; stepType?: string;
  id?: string; biomeGroup?: string | null; newLevel?: number; newTier?: number; attempt?: number; phase?: string;
  bossHpFraction?: number; bossCombatDurationMs?: number; bossCombatStartedAtMs?: number; bossCombatEndedAtMs?: number;
  completion?: string; slot?: string; definitionId?: string | null; cardId?: string; nodeId?: string;
  ticks?: Record<string, number>;
  header?: { gitRevision?: string; taints?: unknown[]; routeId?: string; routeVersion?: string };
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

const mins = (ms?: number | null) => {
  if (ms === undefined || ms === null) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};
const beatOf = (label: string) => label.slice(0, label.lastIndexOf(': '));
const ZONE: Record<string, string> = {
  'The Clearing': 'clearing', 'The Plains': 'plains', 'The Forest': 'forest',
  'The Swamp': 'swamp', 'The Mountain': 'mountain', 'The Cave': 'cave',
};
const cap = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;

const ledger: Record<string, any>[] = [];
const measured: string[] = [];

for (const plan of TUTORIAL_CLASS_PLANS) {
  const cls = plan.className.toLowerCase();
  const dir = readdirSync(root).filter((d) => d.startsWith(`tutorial-${cls}-t1-`)).sort().at(-1);
  if (!dir) { console.log(`\n${plan.className}: no run`); continue; }
  const events = jsonl<Ev>(join(root, dir, 'events.jsonl'));
  const deaths = jsonl<Death>(join(root, dir, 'deaths.jsonl'));
  const script = tutorialScriptFor(plan.classRoot);
  const lineage = LINEAGE_DATABASE.get(plan.weaponCards.lineageId)!;
  const home = lineage.homeBiome;
  const lean = lineage.cards.find((c) => c.id === plan.weaponCards.lean)!;
  const verb = lineage.cards.find((c) => c.id === plan.weaponCards.verb)!;
  const header = events.find((e) => e.kind === 'run-start')?.header;
  const end = events.find((e) => e.kind === 'run-end');
  const last = events.at(-1)?.atMs ?? 0;
  const wallMs = end?.durationMs ?? last;

  // Levels, Global Mastery and the weapon slot as the run reached them.
  const levelUps = events.filter((e) => e.kind === 'biome-level-up');
  const levelsAt = (atMs: number) => {
    const levels: Record<string, number> = {};
    for (const e of levelUps) if (e.atMs <= atMs && e.biomeGroup) levels[e.biomeGroup] = Math.max(levels[e.biomeGroup] ?? 0, e.newLevel ?? 0);
    return levels;
  };
  const levelAt = (zone: string, atMs: number) => levelsAt(atMs)[zone] ?? 0;
  const gmAt = (atMs: number) => globalMasteryOf(levelsAt(atMs));
  const weaponAt = (atMs: number) => events.filter((e) => e.kind === 'equip' && e.slot === 'weapon' && e.atMs <= atMs).at(-1)?.definitionId ?? '—';
  const reachedAt = (zone: string, level: number) => levelUps.find((e) => e.biomeGroup === zone && (e.newLevel ?? 0) >= level)?.atMs;

  // Beats.
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
  const perChapter = Object.fromEntries(chapters.map((ch) => {
    const ids = script.beats.filter((b) => b.chapter === ch).map((b) => b.id);
    return [ch, `${ids.filter(beatDone).length}/${ids.length}`];
  }));
  const passed = script.beats.filter((b) => beatDone(b.id)).length;

  // Card firings and own DoT ticks.
  const fired = events.filter((e) => e.kind === 'card-fired');
  const firedIn = (cardId: string, from: number, to: number) => fired.filter((e) => e.cardId === cardId && e.atMs >= from && e.atMs <= to).length;
  const dotWindows = events.filter((e) => e.kind === 'own-dot-ticks');
  const bleedIn = (from: number, to: number) => dotWindows.filter((e) => e.atMs >= from && e.atMs <= to + 5_000)
    .reduce((a, e) => a + (e.ticks?.bleed ?? 0), 0);

  // Bosses: every attempt, with the verb's firings in its fight.
  const attemptEnds = events.filter((e) => e.kind === 'boss-attempt' && e.phase === 'end');
  const attemptStarts = events.filter((e) => e.kind === 'boss-attempt' && e.phase === 'start');
  const fights = attemptEnds.map((e) => {
    const start = [...attemptStarts].reverse().find((s) => s.atMs <= e.atMs && s.biomeGroup === e.biomeGroup)?.atMs ?? e.atMs;
    const from = e.bossCombatStartedAtMs ?? start;
    const to = e.bossCombatEndedAtMs ?? e.atMs;
    const fightMs = Math.max(1, to - from);
    const verbFires = firedIn(verb.id, from, to);
    return {
      biome: e.biomeGroup ?? '?', outcome: e.outcome ?? '?', atMs: e.atMs,
      fightS: Math.round((e.bossCombatDurationMs ?? fightMs) / 1000),
      bossPctLeft: e.bossHpFraction !== undefined ? Math.round(e.bossHpFraction * 100) : null,
      weapon: weaponAt(from),
      verbFires, verbPerMin: Number((verbFires / (fightMs / 60_000)).toFixed(1)),
      leanFires: firedIn(lean.id, from, to),
      ownBleedTicks: bleedIn(from, to),
    };
  });
  const gateBiome = home;
  const bossCell = (biome: string, kills?: string) => {
    const a = fights.filter((f) => f.biome === biome);
    if (a.length === 0) return 'not reached';
    const won = a.filter((f) => f.outcome === 'victory');
    const lost = a.filter((f) => f.outcome !== 'victory').map((f) => `${f.outcome}${f.bossPctLeft !== null ? ` ${f.bossPctLeft}%` : ''}`);
    const secs = won.map((f) => f.fightS);
    return `${won.length}/${a.length}${kills ?? ''}${secs.length ? `, ${Math.min(...secs)}–${Math.max(...secs)} s` : ''}${lost.length ? ` (lost: ${lost.join(', ')})` : ''}`;
  };

  // Purchases.
  const milestone = (id: string) => events.find((e) => e.kind === 'milestone' && e.id === id)?.atMs;
  const farmFor = (cardId: string) => Math.round((stepEnds.get(`shards:${cardId}`) ?? []).reduce((t, e) => t + (e.durationMs ?? 0), 0) / 1000);
  const purchase = (milestoneId: string, card: typeof lean) => {
    const at = milestone(milestoneId);
    return at === undefined
      ? { card: card.name, at: null }
      : { card: card.name, at, weapon: weaponAt(at), level: `${cap(home)} ${levelAt(home, at)}`, gm: gmAt(at), farmS: farmFor(card.id) };
  };
  const leanBuy = purchase('first-lineage-card', lean);
  const verbBuy = purchase('verb-card', verb);

  // Farming after the verb: farm steps outside every boss attempt.
  const farmSpans: Array<[number, number]> = [];
  {
    const open = new Map<string, number>();
    for (const e of events) {
      if (e.stepType !== 'farm' || !e.label) continue;
      if (e.kind === 'route-step-start') open.set(e.label, e.atMs);
      if (e.kind === 'route-step-end' && open.has(e.label)) { farmSpans.push([open.get(e.label)!, e.atMs]); open.delete(e.label); }
    }
  }
  const verbAt = verbBuy.at ?? Infinity;
  let farmMs = 0; let farmFires = 0; let farmBleed = 0;
  for (const [a, b] of farmSpans) {
    const from = Math.max(a, verbAt);
    if (b <= from) continue;
    farmMs += b - from;
    farmFires += firedIn(verb.id, from, b);
    farmBleed += bleedIn(from, b);
  }
  // A farm step inside the gate chapter is the gate's shards, not a boss fight; boss attempts are their own steps.

  const stallEvents = events.filter((e) => e.kind === 'stall' || e.kind === 'boss-step-exhausted');
  const row = {
    class: plan.className,
    revision: header?.gitRevision?.slice(0, 8) ?? '?',
    routeVersion: header?.routeVersion ?? '?',
    taints: header?.taints ?? [],
    completion: end?.completion ?? 'running',
    endReason: end?.reason ?? null,
    wallMs,
    tier2Ms: milestone('tier-2-reached') ?? null,
    gm30Ms: milestone('gm-30-all-maxed') ?? null,
    gatePaidMs: milestone('gate-paid') ?? null,
    forest4: (() => { const at = reachedAt('forest', 4); return at === undefined ? null : { atMs: at, gm: gmAt(at) }; })(),
    beatsPassed: passed,
    beatsTotal: script.beats.length,
    perChapter,
    deaths: deaths.map((d) => ({
      atMs: d.atMs, where: d.biomeGroup ?? d.nodeId, step: d.routeStepLabel,
      killer: `${d.cause?.killer?.monsterName ?? '?'}${d.cause?.killer?.isBoss ? ' (boss)' : ''}`,
    })),
    lineage: lineage.id,
    lean: leanBuy,
    verb: verbBuy,
    sentence: verbSentence(verb.lane, lean.lane),
    pure: verb.lane === lean.lane,
    seals: Object.fromEntries(TUTORIAL_SEALS.map((b) => [b, bossCell(b)])),
    gate: bossCell(gateBiome),
    fights,
    farming: {
      minutes: Number((farmMs / 60_000).toFixed(1)),
      verbFires: farmFires,
      verbPerMin: farmMs > 0 ? Number((farmFires / (farmMs / 60_000)).toFixed(1)) : null,
      ownBleedTicks: farmBleed,
    },
    verbFiresTotal: fired.filter((e) => e.cardId === verb.id).length,
    otherCardFires: Object.fromEntries([...new Set(fired.map((e) => e.cardId!))].filter((id) => id !== verb.id).map((id) => [id, fired.filter((e) => e.cardId === id).length])),
    notDone: notDone.map((e) => `${e.label} -> ${e.outcome}${e.reason ? ` (${e.reason})` : ''}`),
    stalls: stallEvents.map((e) => `${mins(e.atMs)} ${e.kind}${e.reason ? `: ${e.reason}` : ''}`),
  };
  ledger.push(row);

  // The first-hour checklist, measured (as `_ccTutorialSweep.ts`).
  const shownAt = new Map<string, TutorialConceptId[]>();
  for (const beat of script.beats) {
    const at = starts.get(beat.id);
    if (at === undefined || !beat.teaches?.length) continue;
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
const L = ledger;
console.log(`\nrevision ${[...new Set(L.map((r) => r.revision))].join(', ')} · route ${[...new Set(L.map((r) => r.routeVersion))].join(', ')} · taints ${JSON.stringify([...new Set(L.flatMap((r) => r.taints))])}\n`);
const chapters = Object.keys(L[0]?.perChapter ?? {});
console.log(`| Class | ${chapters.join(' | ')} | beats | outcome | wall | deaths |`);
console.log(`|---|${chapters.map(() => '---').join('|')}|---|---|---|---|`);
for (const r of L) {
  console.log(`| ${r.class} | ${chapters.map((c) => r.perChapter[c] ?? '—').join(' | ')} | ${r.beatsPassed}/${r.beatsTotal} | ${r.completion}${r.endReason ? ` (${r.endReason})` : ''} | ${mins(r.wallMs)} | ${r.deaths.length} |`);
}
const buy = (p: any) => (p.at === null ? `${p.card}: not bought` : `${p.card}, ${mins(p.at)} (${p.level}, GM ${p.gm}, ${p.weapon}, farm ${p.farmS} s)`);
console.log('\n| Class | Lean | Verb | The verb then reads |');
console.log('|---|---|---|---|');
for (const r of L) console.log(`| ${r.class} | ${buy(r.lean)} | ${buy(r.verb)} | ${r.sentence}${r.pure ? ' (pure)' : ''} |`);
console.log('\n| Class | GM 30 | Plains seal | Mountain seal | Gate boss (3 kills) | Tier 2 | gate paid | Forest 4 at GM |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of L) {
  console.log(`| ${r.class} | ${mins(r.gm30Ms)} | ${r.seals.plains} | ${r.seals.mountain} | ${r.gate} | ${mins(r.tier2Ms)} | ${mins(r.gatePaidMs)} | ${r.forest4 ? `${r.forest4.gm} (${mins(r.forest4.atMs)})` : '—'} |`);
}
console.log('\nVerb firings per boss fight (fight s, fires, /min, own bleed ticks, weapon):');
for (const r of L) {
  console.log(`- ${r.class}: ${r.fights.map((f: any) => `${f.biome} ${f.outcome} ${f.fightS}s ${f.verbFires}× (${f.verbPerMin}/min${f.ownBleedTicks ? `, bleed ${f.ownBleedTicks}` : ''}${f.weapon !== 'chaotic-axe' && f.weapon !== 'ashbrand-blade' ? `, ${f.weapon}` : ''})`).join('; ')}`);
  console.log(`  farming after the verb: ${r.farming.minutes} min, ${r.farming.verbFires} fires (${r.farming.verbPerMin}/min)${r.farming.ownBleedTicks ? `, own bleed ticks ${r.farming.ownBleedTicks}` : ''}; verb total ${r.verbFiresTotal}; other cards ${JSON.stringify(r.otherCardFires)}`);
}
console.log('\nDeaths:');
for (const r of L) for (const d of r.deaths) console.log(`- ${r.class} ${mins(d.atMs)} in ${d.where}, ${d.step}, by ${d.killer}`);
console.log('\nNot done / stalls:');
for (const r of L) for (const s of [...r.notDone, ...r.stalls]) console.log(`- ${r.class}: ${s}`);
console.log('\nFirst-hour checklist, measured:');
for (const m of measured) console.log(`- ${m}`);

let comparison: Record<string, unknown>[] | undefined;
if (beforePath && existsSync(beforePath)) {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')).ledger as Record<string, any>[];
  comparison = L.map((r) => {
    const b = before.find((x) => x.class === r.class);
    return {
      class: r.class,
      gm30: [b?.gm30Ms ?? null, r.gm30Ms], tier2: [b?.tier2Ms ?? null, r.tier2Ms], gatePaid: [b?.gatePaidMs ?? null, r.gatePaidMs],
      wall: [b?.wallMs ?? null, r.wallMs], deaths: [b?.deaths?.length ?? null, r.deaths.length], beats: [b?.beatsTotal ?? null, r.beatsTotal],
    };
  });
  console.log(`\nAgainst ${beforePath}:`);
  console.log('| Class | GM 30 | Tier 2 | gate paid | wall | deaths | beats |');
  console.log('|---|---|---|---|---|---|---|');
  for (const c of comparison as any[]) {
    const pair = (x: [number | null, number | null]) => `${mins(x[0])} → ${mins(x[1])}`;
    console.log(`| ${c.class} | ${pair(c.gm30)} | ${pair(c.tier2)} | ${pair(c.gatePaid)} | ${pair(c.wall)} | ${c.deaths[0]} → ${c.deaths[1]} | ${c.beats[0]} → ${c.beats[1]} |`);
  }
}
if (outJson) writeFileSync(outJson, `${JSON.stringify({ ledger, measured, comparison }, null, 2)}\n`);
