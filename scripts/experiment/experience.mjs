import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { validateStudy } from "./study.mjs";
import { isTerminal } from "./lib.mjs";

export const readJson = path => JSON.parse(readFileSync(path, "utf8"));
export function readEvents(path) {
  return readFileSync(path, "utf8").split(/\r?\n/).filter(line => line.trim()).map((line, i) => {
    let e;
    try { e = JSON.parse(line); } catch { throw new Error(`${path}: invalid JSON at record ${i + 1}`); }
    if (!e || typeof e.kind !== "string" || !Number.isFinite(e.atMs) || e.atMs < 0) throw new Error(`${path}: invalid event ${i + 1}`);
    return e;
  });
}
const stable = value => JSON.stringify(canonical(value));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const markerKinds = new Set(["milestone", "equip", "unequip", "upgrade", "craft", "evolution", "stance-craft", "build-change", "biome-level-up", "tier-up", "death", "respawn", "treatment-assertion"]);

/** Samples describe observed activity; blocked reasons describe purpose and may overlap. */
export function timeline(events, durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error("invalid timeline duration");
  const segments = [], activityMs = {}, purposeMs = {}, markers = [], blocks = [], steps = [];
  const openSteps = new Map(), openBlocks = new Map();
  let cursor = 0;
  const add = segment => {
    if (segment.endMs <= segment.startMs) return;
    const dt = segment.endMs - segment.startMs;
    activityMs[segment.activity] = (activityMs[segment.activity] ?? 0) + dt;
    purposeMs[segment.purpose] = (purposeMs[segment.purpose] ?? 0) + dt;
    const previous = segments.at(-1);
    if (previous && previous.endMs === segment.startMs && previous.activity === segment.activity && previous.purpose === segment.purpose && previous.nodeId === segment.nodeId) previous.endMs = segment.endMs;
    else segments.push(segment);
  };
  for (const e of events) {
    if (e.kind === "experience-sample") {
      const start = e.atMs - e.durationMs;
      if (!Number.isFinite(e.durationMs) || e.durationMs <= 0 || start < -1 || start < cursor - 1 || e.atMs > durationMs + 1) throw new Error("overlapping or out-of-range experience samples");
      if (!["unavailable", "dead", "combat", "travel", "waiting", "idle"].includes(e.activity) || typeof e.purpose !== "string") throw new Error("invalid experience category");
      add({ startMs: cursor, endMs: Math.max(cursor, start), activity: "unavailable", purpose: "unknown", nodeId: null });
      add({ startMs: Math.max(cursor, start), endMs: Math.min(e.atMs, durationMs), activity: e.activity, purpose: e.purpose, nodeId: e.nodeId });
      cursor = Math.min(e.atMs, durationMs);
    }
    if (markerKinds.has(e.kind)) markers.push(e);
    if (e.kind === "route-step-start") openSteps.set(e.index, e);
    if (e.kind === "route-step-end") {
      const start = openSteps.get(e.index);
      steps.push({ ...e, startMs: start?.atMs ?? null, endMs: e.atMs });
      openSteps.delete(e.index);
    }
    if (e.kind === "blocked-on-resource") {
      if (e.phase === "start") {
        if (openBlocks.has(e.forWhat)) throw new Error(`duplicate resource block ${e.forWhat}`);
        openBlocks.set(e.forWhat, e);
      } else if (e.phase === "end") {
        const start = openBlocks.get(e.forWhat);
        blocks.push({ ...e, startMs: start?.atMs ?? null, endMs: e.atMs, initialReasons: start?.blockReasons ?? null, censored: false });
        openBlocks.delete(e.forWhat);
      }
    }
  }
  add({ startMs: cursor, endMs: durationMs, activity: "unavailable", purpose: "unknown", nodeId: null });
  for (const e of openSteps.values()) steps.push({ ...e, startMs: e.atMs, endMs: durationMs, outcome: "unfinished" });
  for (const e of openBlocks.values()) blocks.push({ ...e, startMs: e.atMs, endMs: durationMs, censored: true });
  return { schemaVersion: 1, durationMs, activityMs, purposeMs, observedCoverage: durationMs ? 1 - (activityMs.unavailable ?? 0) / durationMs : null,
    segments, steps, blocks, markers,
    interpretation: "Activity and purpose are separate partitions, never added together. Combat is sampled target/attacker presence; travel is route intent outside combat. Idle does not prove recovery. Blocks and nested route steps overlap. Reasons are observed gates, not exclusive causal attribution. Missing intervals remain unavailable." };
}

export function distribution(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const q = p => {
    if (!sorted.length) return null;
    const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  };
  return { n: sorted.length, median: q(.5), p10: q(.1), p90: q(.9), min: sorted[0] ?? null, max: sorted.at(-1) ?? null };
}

export function compareStudy(manifest, state, loadSummary) {
  const study = validateStudy(manifest.config.study);
  const rows = state.runs.map(r => {
    const issues = [];
    if (!Number.isInteger(r.replica) || r.replica < 1 || r.replica > manifest.config.count || r.pairId !== `r${r.replica}`) issues.push("invalid replica/pair identity");
    if (manifest.config.mode !== "canonical-isolated") issues.push("noncanonical experiment mode");
    let summary = null;
    try { summary = loadSummary(r); } catch (e) { issues.push(`artifact error: ${e.message}`); }
    const s = summary?.run;
    const arm = study.arms.find(a => a.id === r.armId);
    if (!arm) issues.push("unknown arm");
    if (!s) issues.push("no summary");
    else {
      if (!Array.isArray(s.taints) || s.taints.length || !["isolated", "ambient-concurrency"].includes(s.isolationGrade) ||
          s.treatmentValidity === "invalid" || s.completion === "error" ||
          (s.tierEntry && s.tierEntry.economyPolicy !== "authoritative-economy-continuation")) issues.push("invalid or noncanonical observation");
      // Summary completion flags deliberately exclude unfinished runs. Do not turn that into a harness failure.
      if (s.completion === "completed" && (s.economyEvidenceEligible !== true || s.canonical !== true)) issues.push("ineligible completed economy evidence");
      if (s.gitRevision !== manifest.source.gitRevision) issues.push("source revision mismatch");
      if (s.routeId !== arm?.route || s.policyId !== arm?.policy) issues.push("route/policy mismatch");
      if (!s.behavior) issues.push("missing behavior provenance");
      for (const [k, v] of Object.entries(arm?.choices ?? {})) if (s.behavior?.choices?.[k] !== v) issues.push(`choice mismatch: ${k}`);
      if (s.completion === "completed" && study.factor === "choice" && s.behavior?.reachedChoices?.[study.choiceId] !== arm?.choices[study.choiceId]) issues.push("declared choice never reached");
      if (!s.startState) issues.push("missing observed start state");
      if (!Number.isFinite(s.durationMs) || s.durationMs < 0) issues.push("invalid duration");
    }
    return { runKey: r.runKey, armId: r.armId, pairId: r.pairId, replica: r.replica, status: r.status,
      completion: s?.completion ?? null, issues, eligible: issues.length === 0,
      evidenceClass: !s ? "unavailable" : issues.length ? "invalid" : s.completion === "completed" ? "completed" : "incomplete-observation",
      durationMs: s?.durationMs ?? null, deaths: summary?.deaths?.total ?? null,
      progression: summary?.progression ?? null, economy: summary?.economy ? { finalEssences: summary.economy.finalEssences, finalCatalysts: summary.economy.finalCatalysts, zoneTiming: summary.economy.zoneTiming, totalBlockedOnResourceMs: summary.economy.totalBlockedOnResourceMs } : null,
      header: s ?? null };
  });
  const pairs = [];
  for (let replica = 1; replica <= manifest.config.count; replica++) {
    const group = rows.filter(r => r.replica === replica);
    const issues = [];
    if (group.length !== study.arms.length || new Set(group.map(r => r.armId)).size !== study.arms.length) issues.push("missing or duplicate arm");
    if (group.some(r => !r.eligible)) issues.push("invalid or unavailable member");
    if (group.some(r => r.completion !== "completed" || r.status !== "completed")) issues.push("incomplete member; no completion-time contrast");
    const signature = r => stable({ classRoot: r.header?.classRoot, startState: r.header?.startState, economy: r.header?.economyCandidate, rewardMultiplier: r.header?.rewardMultiplier });
    if (new Set(group.map(signature)).size > 1) issues.push("start/class/economy mismatch");
    const base = group.find(r => r.armId === study.arms[0].id);
    pairs.push({ pairId: `r${replica}`, issues, comparable: issues.length === 0,
      contrasts: issues.length ? [] : group.filter(r => r !== base).map(r => ({ armId: r.armId, baseline: base.armId, durationDeltaMs: r.durationMs - base.durationMs,
        deathDelta: Number.isFinite(r.deaths) && Number.isFinite(base.deaths) ? r.deaths - base.deaths : null })) });
  }
  const arms = study.arms.map(a => {
    const group = rows.filter(r => r.armId === a.id);
    const completed = group.filter(r => r.eligible && r.status === "completed" && r.completion === "completed");
    return { id: a.id, scheduled: manifest.config.count, present: group.length, completedEligible: completed.length,
      incomplete: group.filter(r => r.completion !== "completed").length, invalidOrUnavailable: group.filter(r => !r.eligible).length,
      completedDurationMs: distribution(completed.map(r => r.durationMs)),
      pairedDurationDeltaMs: distribution(pairs.flatMap(p => p.contrasts.filter(c => c.armId === a.id).map(c => c.durationDeltaMs))) };
  });
  return { schemaVersion: 1, study, experimentId: manifest.experimentId, provisional: state.runs.some(r => !isTerminal(r.status)) || state.runs.length !== manifest.config.count * study.arms.length, arms, pairs, rows,
    interpretation: "Replica blocks share declared inputs, not an RNG seed. Completed-only durations have survivor bias; inspect all incomplete and invalid rows. Quantiles are descriptive, not confidence intervals. A route factor can contain several build/ordering differences; it estimates the whole route effect. No automatic winner or balance change." };
}

/** Native human recorder adapter. Explicit windows prevent comparing an entire bot run to a short session. */
export function calibrate(botEvents, humanEvents, window) {
  const { botStartMs, humanStartMs, durationMs, label } = window;
  if (!label || ![botStartMs, humanStartMs, durationMs].every(Number.isFinite) || botStartMs < 0 || humanStartMs < 0 || durationMs <= 0) throw new Error("calibration needs label, nonnegative bot/human starts and positive durationMs");
  const bh = botEvents.find(e => e.kind === "run-start")?.header;
  const hh = humanEvents.find(e => e.kind === "run-start")?.header;
  if (!bh || hh?.type !== "HUMAN_PLAYTEST") throw new Error("expected native bot and HUMAN_PLAYTEST event streams");
  const end = events => events.findLast(e => e.kind === "run-end")?.durationMs;
  if (!(end(botEvents) >= botStartMs + durationMs) || !(end(humanEvents) >= humanStartMs + durationMs)) throw new Error("calibration window exceeds a closed recording");
  timeline(botEvents, end(botEvents)); // Reject overlapping/malformed bot sampling before computing fractions.
  const inWindow = (events, start) => events.filter(e => e.atMs >= start && e.atMs < start + durationMs);
  const bot = inWindow(botEvents, botStartMs), human = inWindow(humanEvents, humanStartMs);
  const issues = [];
  if (bh.classRoot !== hh.classRoot) issues.push("class mismatch");
  if (bh.gitRevision === "unknown" || hh.gitRevision === "unknown" || !(bh.gitRevision.startsWith(hh.gitRevision) || hh.gitRevision.startsWith(bh.gitRevision))) issues.push("source mismatch or unknown source");
  if (bh.rewardMultiplier !== 1 || hh.rewardMultiplier !== 1 || bh.taints?.length || hh.taints?.length || humanEvents.some(e => e.kind === "reward-multiplier-change")) issues.push("noncanonical or changed rewards");
  const count = (events, kind) => events.filter(e => e.kind === kind).length;
  const humanWorld = human.map(e => e.kind === "world" ? e.event : null).filter(Boolean);
  const botStats = { kills: count(bot, "kill"), deaths: count(bot, "death") };
  const humanStats = { kills: humanWorld.filter(e => e.kind === "kill" && (e.killer?.id === hh.characterId || e.killer?.ownerPlayerId === hh.characterId)).length, deaths: humanWorld.filter(e => e.kind === "player-death" && e.player?.id === hh.characterId).length };
  const botSegments = botEvents.filter(e => e.kind === "experience-sample");
  let botCombatMs = 0, botCoveredMs = 0;
  for (const e of botSegments) {
    const dt = Math.max(0, Math.min(e.atMs, botStartMs + durationMs) - Math.max(e.atMs - e.durationMs, botStartMs));
    if (e.activity !== "unavailable") botCoveredMs += dt;
    if (e.activity === "combat") botCombatMs += dt;
  }
  // Human sampling cadence changes during combat: time weighting is essential.
  const positions = humanEvents.filter(e => e.kind === "position-sample").sort((a, b) => a.atMs - b.atMs);
  let humanCombatMs = 0, humanCoveredMs = 0;
  for (let i = 0; i < positions.length; i++) {
    const e = positions[i];
    const stop = Math.min(positions[i + 1]?.atMs ?? e.atMs, e.atMs + 1500, humanStartMs + durationMs);
    const dt = Math.max(0, stop - Math.max(e.atMs, humanStartMs));
    humanCoveredMs += dt;
    if (e.combat) humanCombatMs += dt;
  }
  return { schemaVersion: 1, label, window, issues, bot: { header: bh, ...botStats, combatFraction: botCoveredMs ? botCombatMs / botCoveredMs : null, coveredMs: botCoveredMs },
    human: { header: hh, ...humanStats, combatFraction: humanCoveredMs ? humanCombatMs / humanCoveredMs : null, coveredMs: humanCoveredMs },
    buildEvidence: { bot: botEvents.filter(e => ["build-change", "equip", "upgrade"].includes(e.kind) && e.atMs <= botStartMs), human: humanEvents.filter(e => ["build-snapshot", "build-change"].includes(e.kind) && e.atMs <= humanStartMs) },
    reviewStatus: "requires-human-review",
    interpretation: "Descriptive calibration candidate only. Caller aligns equivalent progression windows; manually verify starting gear, mastery, node, behavior and build evidence. Combat definitions differ between client observation and server recorder. Missing samples are not idle. No automatic tuning; repeat human playtests before accepting calibration." };
}

export function loadRunTimeline(summaryPath) {
  const summary = readJson(summaryPath);
  return { run: summary.run, ...timeline(readEvents(join(dirname(summaryPath), "events.jsonl")), summary.run.durationMs) };
}
