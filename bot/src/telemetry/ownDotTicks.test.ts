import assert from "node:assert/strict";
import type { CombatEvent } from "@mmo-idle/shared";
import type { BotEvent } from "./events";
import { OWN_DOT_WINDOW_MS, Recorder } from "./recorder";
import type { TelemetrySink } from "./sink";

/**
 * The bot batches its own damage-over-time ticks into `own-dot-ticks` windows,
 * by element. Another player's ticks, and a monster's DoT on us, never enter
 * the run.
 */
const events: BotEvent[] = [];
let now = 1_000;
const realNow = Date.now;
Date.now = () => now;
try {
  const recorder = new Recorder(
    { write: (event: BotEvent) => events.push(event) } as unknown as TelemetrySink,
    1_000,
    () => "me",
    false,
  );
  const pos = { x: 0, y: 0 };
  const batch: CombatEvent[] = [
    // Our bleed ticking on a monster, twice; another player's; a monster's DoT on us.
    { kind: "dot-tick", targetId: "m1", targetPos: pos, amount: 3, element: "bleed", sourceType: "special", sourceId: "me" },
    { kind: "dot-tick", targetId: "m1", targetPos: pos, amount: 3, element: "bleed", sourceType: "special", sourceId: "me" },
    { kind: "dot-tick", targetId: "m1", targetPos: pos, amount: 3, element: "bleed", sourceType: "special", sourceId: "someone-else" },
    { kind: "dot-tick", targetId: "me", targetPos: pos, amount: 2, element: "poison", sourceType: "class", sourceId: "me" },
  ];
  recorder.ingestCombatEvents(batch, "t1-cave-01");

  // The DoT window is still open: nothing written until it closes.
  assert.equal(events.length, 0, "only own-dot-tick windows are written, and not before they close");
  now += OWN_DOT_WINDOW_MS;
  recorder.ingestCombatEvents([], "t1-cave-01");
  const windows = events.filter((e): e is Extract<BotEvent, { kind: "own-dot-ticks" }> => e.kind === "own-dot-ticks");
  assert.equal(windows.length, 1);
  assert.deepEqual(windows[0].ticks, { bleed: 2 });
  assert.equal(windows[0].nodeId, "t1-cave-01");

  // A node change closes the window early; a window with no tick writes nothing.
  recorder.ingestCombatEvents([
    { kind: "dot-tick", targetId: "m2", targetPos: pos, amount: 1, element: "poison", sourceType: "class", sourceId: "me" },
  ], "t1-cave-02");
  now += 100;
  recorder.ingestCombatEvents([], "t1-cave-03");
  const after = events.filter((e): e is Extract<BotEvent, { kind: "own-dot-ticks" }> => e.kind === "own-dot-ticks");
  assert.equal(after.length, 2);
  assert.deepEqual(after[1].ticks, { poison: 1 });
  assert.equal(after[1].nodeId, "t1-cave-02");
  now += OWN_DOT_WINDOW_MS;
  recorder.ingestCombatEvents([], "t1-cave-03");
  assert.equal(events.filter((e) => e.kind === "own-dot-ticks").length, 2);
} finally {
  Date.now = realNow;
}

console.log("ownDotTicks.test: ok");
