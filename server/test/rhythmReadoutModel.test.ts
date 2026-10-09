// The rhythm readout's ring model (design §24.6; course-correction W2-B).
//
// Lives in server/test/ because the runner discovers only server/test/ and
// shared/src/; the model is pure data-in/data-out (like areaInformationModel),
// so it runs here without a DOM.
//
// What it pins — ring derivation, not balance:
//   - which cards get a ring, in what order, and that there are never more than
//     three (cards first, then the frame);
//   - each moment shape's state off the server's `ShowsRhythm` moments: a count
//     toward the payoff, a cap's clock against the server clock, a per-target
//     latch, a kill carry, a pulse on fire;
//   - a running lineage window and the frame's window/bank, read off the buff
//     projection, and the buff tiles the readout stands in for;
//   - the floating word is the card's name, not a number.

import {
  PACKET_DEFINITIONS,
  emptyEquipment,
  resolveActiveLineages,
  rhythmFirings,
  type LineageProgressMap,
  type PlayerBuff,
  type RhythmFiring,
} from "@mmo-idle/shared";
import {
  BLOCKED_MARK,
  FRAME_RING_COLOR,
  READY_MARK,
  SPENT_MARK,
  awayText,
  cardWordFor,
  deriveRhythmRings,
  newlyReady,
  readoutBuffIds,
  ringShortName,
  ringState,
  ringStateText,
  type RhythmInput,
} from "../../client/src/hud/rhythmReadoutModel";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const color = (lane: string) => PACKET_DEFINITIONS.get(lane as never)!.color;

/** The firings a Rapier player with these cards active would show. */
function rapierFirings(active: { stat?: string; payoff?: string }, wornForm = "flash-rapier"): RhythmFiring[] {
  const owned = [active.stat, active.payoff].filter((id): id is string => !!id);
  const lineages: LineageProgressMap = {
    rapier: { ownedCards: owned, active, ownedForms: ["flash-rapier", wornForm], wornForm },
  };
  return rhythmFirings(resolveActiveLineages({ equipment: { ...emptyEquipment(), weapon: wornForm }, lineages }));
}

function input(over: Partial<RhythmInput>): RhythmInput {
  return {
    firings: [], moments: undefined, attackTargetId: null, serverNow: 1_000_000,
    buffs: [], passives: {}, ...over,
  };
}

function buff(id: string, over: Partial<PlayerBuff> = {}): PlayerBuff {
  return {
    id: id as PlayerBuff["id"], label: id, stacks: 1, durationPct: -1, color: "#fff",
    category: "neutral", iconKey: id, shape: "square", ...over,
  };
}

const FLURRY = "rapier-t1-tempo-payoff";
// Since design §26.1 (legibility run) the Rapier's one T1 verb is Flurry; its
// Affliction and Engagement verbs (and a lean of another lane composing with a
// verb) are T2 cards, read on the Gale Needle with the verb's own firing only.
const VENOM_POINT = "rapier-t2-affliction-payoff";
const OPENING_LUNGE = "rapier-t2-engagement-payoff";
const t2Verb = (payoff: string, stat?: string): RhythmFiring[] =>
  rapierFirings({ payoff, ...(stat ? { stat } : {}) }, "gale-needle").filter((f) => f.key === payoff);

// ── Which cards get a ring ────────────────────────────────────────────────────
{
  assert(rapierFirings({ stat: "rapier-t1-speed" }).length === 0, "a lean alone has no rhythm");
  const [flurry] = rapierFirings({ stat: "rapier-t1-speed", payoff: FLURRY });
  assert(flurry?.key === FLURRY && flurry.name === "Flurry", "the verb is the ring, named for the card");
  assert(flurry.shape === "count" && flurry.trigger.n === 6, "Flurry counts toward its 6th hit");
  assert(flurry.lane === "tempo" && flurry.payloadLane === "tempo", "pure: its own lane, its own payload");
  const [composed] = t2Verb("rapier-t2-tempo-payoff", "rapier-t2-affliction-stat");
  assert(composed.payloadLane === "affliction", "with Deeper Brew, the payload (and its glyph key) is Affliction's");
  assert(composed.lane === "tempo", "but the ring stays in the verb's lane colour");

  assert(t2Verb(VENOM_POINT)[0]?.shape === "cap", "the Affliction moment is capped");
  assert(t2Verb(OPENING_LUNGE)[0]?.shape === "latch-body", "the Engagement moment latches per body");

  // A worn T2 form adds its capstone, ranked after the verb.
  const withCapstone = rapierFirings({ payoff: FLURRY }, "gale-needle");
  assert(withCapstone.map((f) => f.key).join() === `${FLURRY},rapier-capstone-gale-needle`,
    `verb first, then the worn capstone, got ${withCapstone.map((f) => f.key).join()}`);
  assert(withCapstone[1].shape === "pulse", "a mechanic-fired capstone pulses on fire");
}

// ── count: toward the payoff, ready on the hit before it ─────────────────────
{
  const firings = rapierFirings({ payoff: FLURRY });
  const at = (count: number | undefined) =>
    deriveRhythmRings(input({ firings, moments: { [FLURRY]: count === undefined ? {} : { count } } }))[0];
  const zero = at(undefined);
  assert(zero.text === "0/6" && zero.fill === 0 && !zero.ready, "a fresh count reads 0/6, empty");
  const mid = at(3);
  assert(mid.text === "3/6" && mid.fill === 0.5 && !mid.ready, "mid-count reads 3/6, half full");
  assert(mid.color === color("tempo") && mid.label === "Flurry", "in the lane colour, labelled with the card's name");
  const ready = at(5);
  assert(ready.text === "5/6" && ready.fill === 1 && ready.ready, "5/6: the next hit pays — full and ready");
  assert(deriveRhythmRings(input({ firings, moments: undefined }))[0].text === "0/6", "no slice yet reads as zero");
}

// ── cap: ready, or the cap's clock against the server clock ──────────────────
{
  const firings = t2Verb(VENOM_POINT);
  const now = 1_000_000;
  const cooling = deriveRhythmRings(input({ firings, serverNow: now, moments: { [VENOM_POINT]: { capUntil: now + 2_000 } } }))[0];
  assert(!cooling.ready && cooling.text === "2.0", `a running cap shows its seconds, got ${cooling.text}`);
  assert(Math.abs(cooling.fill - 0.6) < 1e-9, `and fills back over the 5 s cap, got ${cooling.fill}`);
  assert(cooling.clockMs === 2_000, "and asks to be re-rendered until it lands");
  const cleared = deriveRhythmRings(input({ firings, serverNow: now + 2_001, moments: { [VENOM_POINT]: { capUntil: now + 2_000 } } }))[0];
  assert(cleared.ready && cleared.text === READY_MARK && cleared.clockMs === undefined, "a cap in the past is ready");
  const fresh = deriveRhythmRings(input({ firings, moments: { [VENOM_POINT]: {} } }))[0];
  assert(fresh.ready && fresh.fill === 1, "no cap: ready");
}

// ── latch per body: ready for the CURRENT target until spent ─────────────────
{
  const firings = t2Verb(OPENING_LUNGE);
  const moments = { [OPENING_LUNGE]: { spentOn: ["m1"] } };
  const spent = deriveRhythmRings(input({ firings, moments, attackTargetId: "m1" }))[0];
  assert(!spent.ready && spent.text === SPENT_MARK && spent.fill === 0, "spent on this target");
  const fresh = deriveRhythmRings(input({ firings, moments, attackTargetId: "m2" }))[0];
  assert(fresh.ready && fresh.text === READY_MARK, "a new target resets it");
  const idle = deriveRhythmRings(input({ firings, moments, attackTargetId: null }))[0];
  assert(idle.ready, "with no target, the next opener is ready");
}

// ── carry and pulse ──────────────────────────────────────────────────────────
{
  const carry: RhythmFiring = {
    key: "axe-t2-kill-chain-payoff", name: "Deeper Fury", lane: "kill-chain",
    trigger: { kind: "kill", carry: true }, shape: "carry", payoff: "heal-and-load",
    payloadLane: "kill-chain", source: "card",
  };
  const empty = deriveRhythmRings(input({ firings: [carry], moments: { [carry.key]: {} } }))[0];
  assert(!empty.ready && empty.text === SPENT_MARK, "a carry is empty until a kill");
  const armed = deriveRhythmRings(input({ firings: [carry], moments: { [carry.key]: { armed: true } } }))[0];
  assert(armed.ready && armed.fill === 1, "a kill arms it");

  const [, capstone] = rapierFirings({ payoff: FLURRY }, "gale-needle");
  const resting = deriveRhythmRings(input({ firings: [capstone] }))[0];
  assert(!resting.ready && resting.fill === 0, "a pulse ring rests between firings");
  const lit = deriveRhythmRings(input({ firings: [capstone], firedRecently: new Set([capstone.key]) }))[0];
  assert(lit.ready && lit.fill === 1, "and lights for the beat its card fires");

  // Its payoff is a timed window: while the window runs, the ring IS the window.
  const window = buff("lineage-speed", { durationPct: 40, remainingMs: 1_000 });
  const running = deriveRhythmRings(input({ firings: [capstone], buffs: [window] }))[0];
  assert(running.windowing && running.ready && running.fill === 0.4 && running.text === "1.0",
    "a running window drains on the ring of the card that opened it");
  assert(readoutBuffIds([running]).has("lineage-speed"), "and its tile is the ring's, not the buff bar's");
}

// ── the frame ring ───────────────────────────────────────────────────────────
{
  assert(deriveRhythmRings(input({})).length === 0, "no cards and no frame container: no readout");

  const banked = deriveRhythmRings(input({ buffs: [buff("frame-charge", { stacks: 2, durationPct: 50 })] }));
  assert(banked.length === 1 && banked[0].key === "frame", "a bank is a frame ring");
  assert(banked[0].color === FRAME_RING_COLOR && banked[0].label === "Frame", "gold, labelled Frame");
  assert(banked[0].text === "2" && banked[0].fill === 0.5 && !banked[0].ready, "2 banked of 4");
  const full = deriveRhythmRings(input({ buffs: [buff("energy-frame-overcharge", { stacks: 4, durationPct: 100 })] }))[0];
  assert(full.ready, "a full bank is ready");

  const open = deriveRhythmRings(input({
    buffs: [buff("frame-charge", { stacks: 1, durationPct: 25 }), buff("frame-window", { durationPct: 75, remainingMs: 600 })],
  }))[0];
  assert(open.windowing && open.fill === 0.75 && open.text === "0.6", "an open window outranks the bank");

  const idle = deriveRhythmRings(input({ passives: { "cadence.frame-charge-per-stack": 0.1 } }))[0];
  assert(idle?.key === "frame" && idle.text === "0" && idle.fill === 0, "an empty bank holds its place");
  const closed = deriveRhythmRings(input({ passives: { "cadence.frame-window-ms": 1600 } }))[0];
  assert(closed?.text === SPENT_MARK, "a closed window holds its place");

  const owned = readoutBuffIds(banked);
  for (const id of ["frame-window", "frame-charge", "energy-frame-surge", "energy-frame-overcharge",
    "summoner-frame-frenzy", "summoner-frame-link", "reload-frame-ramp"]) {
    assert(owned.has(id), `the frame ring stands in for the ${id} tile`);
  }
}

// ── at most three: cards first, then the frame ───────────────────────────────
{
  const firings = rapierFirings({ payoff: FLURRY }, "gale-needle");
  const frameBuffs = [buff("frame-charge", { stacks: 1, durationPct: 25 })];
  const two = deriveRhythmRings(input({ firings, buffs: frameBuffs }));
  assert(two.map((r) => r.key).join() === `${FLURRY},rapier-capstone-gale-needle,frame`, "verb, capstone, frame");

  const extra: RhythmFiring = { ...firings[0], key: "extra-card", name: "Extra" };
  const crowded = deriveRhythmRings(input({ firings: [...firings, extra], buffs: frameBuffs }));
  assert(crowded.length === 3, `never more than three rings, got ${crowded.length}`);
  assert(crowded.every((r) => r.key !== "frame"), "three cards leave no room for the frame");
  assert(!readoutBuffIds(crowded).has("frame-charge"), "and its bank keeps its tile");
}

// ── the flash fires on the transition, not on every render ───────────────────
{
  const firings = rapierFirings({ payoff: FLURRY });
  const four = deriveRhythmRings(input({ firings, moments: { [FLURRY]: { count: 4 } } }));
  const five = deriveRhythmRings(input({ firings, moments: { [FLURRY]: { count: 5 } } }));
  const prev = new Map(four.map((r) => [r.key, r.ready]));
  assert(newlyReady(prev, five).join() === FLURRY, "4 → 5 of 6 becomes ready: one flash");
  assert(newlyReady(new Map(five.map((r) => [r.key, r.ready])), five).length === 0, "staying ready does not flash again");
  assert(newlyReady(new Map(), five).length === 0, "a ring seen for the first time does not flash");
}

// ── The five states (design §26.4): clock, coming, ready, blocked, away ──────
// Synthetic firings, so the states are pinned whatever the card data says.
{
  const afflicted: RhythmFiring = {
    key: "test-into-the-wound", name: "Into the Wound", lane: "affliction",
    trigger: { kind: "hit-afflicted", capMs: 5_000 }, shape: "cap", payoff: "redose",
    payloadLane: "affliction", source: "card",
  };
  const held: RhythmFiring = {
    key: "test-easy-prey", name: "Easy Prey", lane: "control",
    trigger: { kind: "hit-held", capMs: 5_000 }, shape: "cap", payoff: "stun",
    payloadLane: "control", source: "card",
  };
  const now = 1_000_000;
  const ring = (firing: RhythmFiring, over: Partial<RhythmInput>) =>
    deriveRhythmRings(input({ firings: [firing], serverNow: now, ...over }))[0];

  // Named: the short name under the ring, the full name for the tooltip.
  const named = ring(afflicted, {});
  assert(named.label === "Wound" && named.name === "Into the Wound", `short name 'Wound', got '${named.label}'`);
  assert(ringShortName("Easy Prey") === "Easy Prey" && ringShortName("Chopping Rhythm") === "Rhythm"
    && ringShortName("Flurry") === "Flurry", "short names keep a short name whole, else its last word");

  // clock: a running cap, more than a second out.
  const clock = ring(afflicted, { moments: { [afflicted.key]: { capUntil: now + 3_000 } }, targetStatusIds: ["poison-dagger-burn"] });
  assert(ringState(clock) === "clock" && !clock.coming && clock.text === "3.0", `clock, got ${ringState(clock)}`);

  // coming: the clock's last second brightens.
  const coming = ring(afflicted, { moments: { [afflicted.key]: { capUntil: now + 800 } }, targetStatusIds: ["poison-dagger-burn"] });
  assert(ringState(coming) === "coming" && coming.coming && coming.text === "0.8", `coming, got ${ringState(coming)}`);
  assert(/coming/i.test(ringStateText(coming)), "and says so");

  // ready: the cap has cleared and the target carries an affliction.
  const ready = ring(afflicted, { moments: { [afflicted.key]: {} }, targetStatusIds: ["lineage.bleed"] });
  assert(ringState(ready) === "ready" && ready.ready && ready.text === READY_MARK, `ready, got ${ringState(ready)}`);

  // blocked: the condition is absent on the current target — dashed, never ready.
  const blocked = ring(afflicted, { moments: { [afflicted.key]: {} }, targetStatusIds: ["ability-slowed"] });
  assert(ringState(blocked) === "blocked" && blocked.blocked && !blocked.ready && blocked.text === BLOCKED_MARK,
    `an afflicted-moment verb on an un-afflicted target is blocked, got ${ringState(blocked)}`);
  assert(/not afflicted/.test(ringStateText(blocked)), "and the tooltip says why");
  const heldBlocked = ring(held, { moments: { [held.key]: {} }, targetStatusIds: ["poison-dagger-burn"] });
  assert(ringState(heldBlocked) === "blocked" && /not held/.test(ringStateText(heldBlocked)), "a held-moment verb waits for a hold");
  const heldReady = ring(held, { moments: { [held.key]: {} }, targetStatusIds: ["ability-slowed"] });
  assert(ringState(heldReady) === "ready", "a slowed target unblocks it");
  const noTarget = ring(afflicted, { moments: { [afflicted.key]: {} }, targetStatusIds: null });
  assert(ringState(noTarget) === "ready", "with no target nothing blocks the ring");
  const flurry = deriveRhythmRings(input({ firings: rapierFirings({ payoff: FLURRY }), targetStatusIds: [] }))[0];
  assert(!flurry.blocked, "an unconditional moment is never blocked");
  assert(!newlyReady(new Map([[afflicted.key, false]]), [blocked]).length, "a blocked ring never flashes ready");

  // away: firings while the tab was hidden, on whatever state the ring is in.
  const away = ring(afflicted, { moments: { [afflicted.key]: { capUntil: now + 3_000, away: 2 } }, targetStatusIds: ["dot"] });
  assert(away.away === 2 && ringState(away) === "clock", "the away count rides on the clock");
  assert(awayText(away) === "Fired 2 times while you were away", `away text, got ${awayText(away)}`);
  assert(awayText(ready) === undefined && ready.away === 0, "no away count, no away text");
  const frame = deriveRhythmRings(input({ buffs: [buff("frame-charge", { stacks: 1, durationPct: 25 })] }))[0];
  assert(frame.away === 0 && !frame.blocked && ringState(frame) === "clock", "the frame ring keeps its bank, never blocked");
}

// ── the floating word ────────────────────────────────────────────────────────
{
  const word = cardWordFor(FLURRY);
  assert(word?.text === "Flurry!" && word.color === color("tempo"), "the card's name with '!', in its lane colour");
  assert(cardWordFor("rapier-capstone-gale-needle")?.text === "Gale Wake!", "a capstone names itself too");
  assert(cardWordFor(undefined) === undefined && cardWordFor("some-ability-node-option") === undefined,
    "a firing that is not a card's draws no word");
}

console.log("rhythmReadoutModel: ok");
