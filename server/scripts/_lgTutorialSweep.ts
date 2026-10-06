/**
 * Summarise the legibility run's 1x six-class tutorial sweep (wave 2, agent E): one
 * server and one game database per class, bots launched directly (`bot/src/run.ts`).
 * The model is `_vfTutorialSweep.ts` (the verbs-that-fire sweep); this one reads the
 * design §26.1 band — the Effect lean at rank I, the weapon's one verb, the lean's
 * ranks II and III (the route's `lean-rank-N` milestones) — and adds the two
 * comparisons the run asked for: the Forest leg (wave 1 C raised Forest entry
 * pressure) and the Mountain seal, against the verbs-that-fire runs.
 *
 *   node --conditions=development --import tsx scripts/_lgTutorialSweep.ts <runs-dir> [<out.json>]
 *     [--before=<sweep-1x.json>] [--before-runs=<verbs-that-fire runs dir>]
 *
 * Per class: completion, wall, beats by chapter, deaths, every purchase (time, the
 * home zone's level, Global Mastery, the weapon in the slot, the shards farm's
 * length), the page sentences (`cardSentence`), verb firings in every boss fight and
 * per minute of farming after the purchase, seals, gate, the Forest leg (Plains 6 →
 * Forest 6, Forest 4, deaths in the Forest), and the first-hour checklist measured at
 * the level each beat was ACTUALLY shown at. `--before-runs` reads the same Forest-leg
 * and Mountain-seal facts off the previous sweep's raw runs.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LINEAGE_DATABASE,
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  TUTORIAL_SEALS,
  cardSentence,
  globalMastery as globalMasteryOf,
  tutorialScriptFor,
  type LineageProgress,
  type TutorialConceptId,
} from '@mmo-idle/shared';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const root = positional[0];
assert(root && existsSync(root), 'usage: _lgTutorialSweep.ts <runs-dir> [<out.json>] [--before=<json>] [--before-runs=<dir>]');
const outJson = positional[1];
const flag = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const beforePath = flag('before');
const beforeRuns = flag('before-runs');

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

function runDir(dir: string, cls: string): string | undefined {
  if (!existsSync(dir)) return undefined;
  const found = readdirSync(dir).filter((d) => d.startsWith(`tutorial-${cls}-t1-`)).sort().at(-1);
  return found ? join(dir, found) : undefined;
}

/** Facts any tutorial run carries, whatever its script: the Forest leg and the seals. */
function legFacts(events: Ev[], deaths: Death[]) {
  const levelUps = events.filter((e) => e.kind === 'biome-level-up');
  const reachedAt = (zone: string, level: number) => levelUps.find((e) => e.biomeGroup === zone && (e.newLevel ?? 0) >= level)?.atMs;
  const plains6 = reachedAt('plains', 6);
  const forest4 = reachedAt('forest', 4);
  const forest6 = reachedAt('forest', 6);
  const attemptEnds = events.filter((e) => e.kind === 'boss-attempt' && e.phase === 'end');
  const seal = (biome: string) => {
    // The seal is the first win; the attempts are every fight up to and including it.
    const fights = attemptEnds.filter((e) => e.biomeGroup === biome);
    const firstWin = fights.findIndex((f) => f.outcome === 'victory');
    const sealFights = firstWin >= 0 ? fights.slice(0, firstWin + 1) : fights;
    return {
      attempts: sealFights.length,
      wins: firstWin >= 0 ? 1 : 0,
      losses: sealFights.filter((f) => f.outcome !== 'victory')
        .map((f) => `${f.outcome}${f.bossHpFraction !== undefined ? ` ${Math.round(f.bossHpFraction * 100)}%` : ''}`),
      fightS: firstWin >= 0 ? Math.round((fights[firstWin]!.bossCombatDurationMs ?? 0) / 1000) : null,
    };
  };
  const forestDeaths = deaths.filter((d) => d.biomeGroup === 'forest');
  return {
    plains6Ms: plains6 ?? null,
    forest4Ms: forest4 ?? null,
    forest6Ms: forest6 ?? null,
    forestLegMs: plains6 !== undefined && forest6 !== undefined ? forest6 - plains6 : null,
    forestDeaths: forestDeaths.map((d) => ({
      atMs: d.atMs, node: d.nodeId, step: d.routeStepLabel,
      killer: `${d.cause?.killer?.monsterName ?? '?'}${d.cause?.killer?.isBoss ? ' (boss)' : ''}`,
    })),
    seals: Object.fromEntries(TUTORIAL_SEALS.map((b) => [b, seal(b)])),
  };
}

const ledger: Record<string, any>[] = [];
const measured: string[] = [];

for (const plan of TUTORIAL_CLASS_PLANS) {
  const cls = plan.className.toLowerCase();
  const dir = runDir(root, cls);
  if (!dir) { console.log(`\n${plan.className}: no run`); continue; }
  const events = jsonl<Ev>(join(dir, 'events.jsonl'));
  const deaths = jsonl<Death>(join(dir, 'deaths.jsonl'));
  const script = tutorialScriptFor(plan.classRoot);
  const lineage = LINEAGE_DATABASE.get(plan.weaponCards.lineageId)!;
  const home = lineage.homeBiome;
  const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const lean = lineage.cards.find((c) => c.id === plan.weaponCards.lean)!;
  const verb = lineage.cards.find((c) => c.id === plan.weaponCards.verb)!;
  const tree = (rank: number): LineageProgress => ({
    ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id }, ownedForms: [base], wornForm: base,
    ranks: { [lean.id]: rank },
  });
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
  const ticksIn = (from: number, to: number) => {
    const out: Record<string, number> = {};
    for (const e of dotWindows) {
      if (e.atMs < from || e.atMs > to + 5_000) continue;
      for (const [k, v] of Object.entries(e.ticks ?? {})) out[k] = (out[k] ?? 0) + v;
    }
    return out;
  };

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
      leanRank: [3, 2, 1].find((r) => (milestoneAt(r === 1 ? 'first-lineage-card' : `lean-rank-${r}`) ?? Infinity) <= from) ?? 0,
      verbFires, verbPerMin: Number((verbFires / (fightMs / 60_000)).toFixed(1)),
      ownDotTicks: ticksIn(from, to),
    };
  });
  function milestoneAt(id: string): number | undefined {
    return events.find((e) => e.kind === 'milestone' && e.id === id)?.atMs;
  }
  const bossCell = (biome: string) => {
    const a = fights.filter((f) => f.biome === biome);
    if (a.length === 0) return 'not reached';
    const won = a.filter((f) => f.outcome === 'victory');
    const lost = a.filter((f) => f.outcome !== 'victory').map((f) => `${f.outcome}${f.bossPctLeft !== null ? ` ${f.bossPctLeft}%` : ''}`);
    const secs = won.map((f) => f.fightS);
    return `${won.length}/${a.length}${secs.length ? `, ${Math.min(...secs)}–${Math.max(...secs)} s` : ''}${lost.length ? ` (lost: ${lost.join(', ')})` : ''}`;
  };

  // Purchases: lean I, the verb, the lean's ranks.
  const farmFor = (beatId: string) => Math.round((stepEnds.get(beatId) ?? []).reduce((t, e) => t + (e.durationMs ?? 0), 0) / 1000);
  const purchase = (milestoneId: string, name: string, shardsBeat: string) => {
    const at = milestoneAt(milestoneId);
    return at === undefined
      ? { card: name, at: null }
      : { card: name, at, weapon: weaponAt(at), level: `${cap(home)} ${levelAt(home, at)}`, gm: gmAt(at), farmS: farmFor(shardsBeat) };
  };
  const purchases = {
    leanI: purchase('first-lineage-card', `${lean.name} I`, `shards:${lean.id}`),
    verb: purchase('verb-card', verb.name, `shards:${verb.id}`),
    ...(plan.weaponCards.leanRank >= 2 ? { leanII: purchase('lean-rank-2', `${lean.name} II`, `shards:${lean.id}:rank-2`) } : {}),
    ...(plan.weaponCards.leanRank >= 3 ? { leanIII: purchase('lean-rank-3', `${lean.name} III`, `shards:${lean.id}:rank-3`) } : {}),
  };

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
  const verbAt = purchases.verb.at ?? Infinity;
  let farmMs = 0; let farmFires = 0;
  for (const [a, b] of farmSpans) {
    const from = Math.max(a, verbAt);
    if (b <= from) continue;
    farmMs += b - from;
    farmFires += firedIn(verb.id, from, b);
  }

  const stallEvents = events.filter((e) => e.kind === 'stall' || e.kind === 'boss-step-exhausted');
  const row = {
    class: plan.className,
    run: dir,
    revision: header?.gitRevision?.slice(0, 8) ?? '?',
    routeVersion: header?.routeVersion ?? '?',
    taints: header?.taints ?? [],
    completion: end?.completion ?? 'running',
    endReason: end?.reason ?? null,
    wallMs,
    tier2Ms: milestoneAt('tier-2-reached') ?? null,
    gm30Ms: milestoneAt('gm-30-all-maxed') ?? null,
    gatePaidMs: milestoneAt('gate-paid') ?? null,
    beatsPassed: passed,
    beatsTotal: script.beats.length,
    perChapter,
    deaths: deaths.map((d) => ({
      atMs: d.atMs, where: d.biomeGroup ?? d.nodeId, node: d.nodeId, step: d.routeStepLabel,
      killer: `${d.cause?.killer?.monsterName ?? '?'}${d.cause?.killer?.isBoss ? ' (boss)' : ''}`,
    })),
    lineage: lineage.id,
    purchases,
    sentences: {
      leanI: cardSentence(lean, tree(1)),
      leanIII: cardSentence(lean, tree(plan.weaponCards.leanRank)),
      verbAtLeanI: cardSentence(verb, tree(1)),
      verbAtLeanTop: cardSentence(verb, tree(plan.weaponCards.leanRank)),
    },
    seals: Object.fromEntries(TUTORIAL_SEALS.map((b) => [b, bossCell(b)])),
    gate: bossCell(home),
    leg: legFacts(events, deaths),
    fights,
    farming: {
      minutes: Number((farmMs / 60_000).toFixed(1)),
      verbFires: farmFires,
      verbPerMin: farmMs > 0 ? Number((farmFires / (farmMs / 60_000)).toFixed(1)) : null,
    },
    verbFiresTotal: fired.filter((e) => e.cardId === verb.id).length,
    otherCardFires: Object.fromEntries([...new Set(fired.map((e) => e.cardId!))].filter((id) => id !== verb.id).map((id) => [id, fired.filter((e) => e.cardId === id).length])),
    notDone: notDone.map((e) => `${e.label} -> ${e.outcome}${e.reason ? ` (${e.reason})` : ''}`),
    stalls: stallEvents.map((e) => `${mins(e.atMs)} ${e.kind}${e.reason ? `: ${e.reason}` : ''}`),
  };
  ledger.push(row);

  // The first-hour checklist, measured (as `_vfTutorialSweep.ts`).
  const shownAt = new Map<string, TutorialConceptId[]>();
  const shown: string[] = [];
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
    if (/^(card|shards):/.test(beat.id)) shown.push(`${beat.id} @ ${level}`);
  }
  for (const [level, ideas] of shownAt) {
    if (ideas.length > TUTORIAL_CONCEPTS_PER_LEVEL) measured.push(`${plan.className}: ${level} showed ${ideas.length} ideas (${ideas.join(', ')})`);
  }
  (row as Record<string, unknown>).pageLessonsShownAt = shown;
}

// ── The previous sweep's raw runs: the same Forest and seal facts ────────────
const beforeLegs: Record<string, ReturnType<typeof legFacts>> = {};
if (beforeRuns) {
  for (const plan of TUTORIAL_CLASS_PLANS) {
    const dir = runDir(beforeRuns, plan.className.toLowerCase());
    if (!dir) continue;
    beforeLegs[plan.className] = legFacts(jsonl<Ev>(join(dir, 'events.jsonl')), jsonl<Death>(join(dir, 'deaths.jsonl')));
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
const buy = (p: any) => (!p ? '—' : p.at === null ? `${p.card}: not bought` : `${mins(p.at)} (${p.level}, GM ${p.gm}, farm ${p.farmS} s${p.weapon !== 'chaotic-axe' && p.weapon !== 'ashbrand-blade' ? `, ${p.weapon}` : ''})`);
console.log('\n| Class | Effect I | Verb | Effect II | Effect III |');
console.log('|---|---|---|---|---|');
for (const r of L) console.log(`| ${r.class} | ${buy(r.purchases.leanI)} | ${buy(r.purchases.verb)} | ${buy(r.purchases.leanII)} | ${buy(r.purchases.leanIII)} |`);
console.log('\nSentences (the page):');
for (const r of L) console.log(`- ${r.class}: lean ${JSON.stringify(r.sentences.leanI)} → ${JSON.stringify(r.sentences.leanIII)}; verb ${JSON.stringify(r.sentences.verbAtLeanI)} → ${JSON.stringify(r.sentences.verbAtLeanTop)}`);
console.log('\n| Class | GM 30 | Plains seal | Mountain seal | Gate boss (3 kills) | Tier 2 | gate paid |');
console.log('|---|---|---|---|---|---|---|');
for (const r of L) {
  console.log(`| ${r.class} | ${mins(r.gm30Ms)} | ${r.seals.plains} | ${r.seals.mountain} | ${r.gate} | ${mins(r.tier2Ms)} | ${mins(r.gatePaidMs)} |`);
}
console.log('\nVerb firings per boss fight (fight s, fires, /min, lean rank, own DoT ticks, weapon):');
for (const r of L) {
  console.log(`- ${r.class}: ${r.fights.map((f: any) => `${f.biome} ${f.outcome} ${f.fightS}s ${f.verbFires}× (${f.verbPerMin}/min, r${f.leanRank}${Object.keys(f.ownDotTicks).length ? `, ${JSON.stringify(f.ownDotTicks)}` : ''}${f.weapon !== 'chaotic-axe' && f.weapon !== 'ashbrand-blade' ? `, ${f.weapon}` : ''})`).join('; ')}`);
  console.log(`  farming after the verb: ${r.farming.minutes} min, ${r.farming.verbFires} fires (${r.farming.verbPerMin}/min); verb total ${r.verbFiresTotal}; other cards ${JSON.stringify(r.otherCardFires)}`);
}
console.log('\nForest leg (Plains 6 → Forest 6), Forest 4, Forest deaths; Mountain seal — now vs before:');
console.log('| Class | Forest leg | Forest 4 at | Forest deaths | Mountain seal (attempts, wins) | Plains seal |');
console.log('|---|---|---|---|---|---|');
for (const r of L) {
  const b = beforeLegs[r.class];
  const pair = (now: string, then?: string) => (then === undefined ? now : `${then} → ${now}`);
  const sealText = (s: any) => (s ? `${s.wins}/${s.attempts}${s.losses.length ? ` (lost ${s.losses.join(', ')})` : ''}${s.fightS !== null ? `, ${s.fightS} s` : ''}` : '—');
  console.log(`| ${r.class} | ${pair(mins(r.leg.forestLegMs), b && mins(b.forestLegMs))} | ${pair(mins(r.leg.forest4Ms), b && mins(b.forest4Ms))} | ${pair(String(r.leg.forestDeaths.length), b && String(b.forestDeaths.length))} | ${pair(sealText(r.leg.seals.mountain), b && sealText(b.seals.mountain))} | ${pair(sealText(r.leg.seals.plains), b && sealText(b.seals.plains))} |`);
}
console.log('\nDeaths:');
for (const r of L) for (const d of r.deaths) console.log(`- ${r.class} ${mins(d.atMs)} in ${d.where} (${d.node}), ${d.step}, by ${d.killer}`);
console.log('\nNot done / stalls:');
for (const r of L) for (const s of [...r.notDone, ...r.stalls]) console.log(`- ${r.class}: ${s}`);
console.log('\nPage lessons, shown at:');
for (const r of L) console.log(`- ${r.class}: ${r.pageLessonsShownAt.join('; ')}`);
console.log('\nFirst-hour checklist, measured:');
for (const m of measured) console.log(`- ${m}`);
if (measured.length === 0) console.log('- every level showed at most two ideas; no idea-carrying beat was skipped');

let comparison: Record<string, unknown>[] | undefined;
if (beforePath && existsSync(beforePath)) {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')).ledger as Record<string, any>[];
  comparison = L.map((r) => {
    const b = before.find((x) => x.class === r.class);
    return {
      class: r.class,
      leanAt: [b?.lean?.at ?? null, r.purchases.leanI.at], verbAt: [b?.verb?.at ?? null, r.purchases.verb.at],
      gm30: [b?.gm30Ms ?? null, r.gm30Ms], tier2: [b?.tier2Ms ?? null, r.tier2Ms], gatePaid: [b?.gatePaidMs ?? null, r.gatePaidMs],
      wall: [b?.wallMs ?? null, r.wallMs], deaths: [b?.deaths?.length ?? null, r.deaths.length], beats: [b?.beatsTotal ?? null, r.beatsTotal],
      gateBoss: [b?.gate ?? null, r.gate],
    };
  });
  console.log(`\nAgainst ${beforePath}:`);
  console.log('| Class | lean I | verb | GM 30 | Tier 2 | gate paid | wall | deaths | beats | gate boss |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const c of comparison as any[]) {
    const pair = (x: [number | null, number | null]) => `${mins(x[0])} → ${mins(x[1])}`;
    console.log(`| ${c.class} | ${pair(c.leanAt)} | ${pair(c.verbAt)} | ${pair(c.gm30)} | ${pair(c.tier2)} | ${pair(c.gatePaid)} | ${pair(c.wall)} | ${c.deaths[0]} → ${c.deaths[1]} | ${c.beats[0]} → ${c.beats[1]} | ${c.gateBoss[0]} → ${c.gateBoss[1]} |`);
  }
}
if (outJson) writeFileSync(outJson, `${JSON.stringify({ ledger, measured, beforeLegs, comparison }, null, 2)}\n`);
