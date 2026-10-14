/**
 * The class-kit conditions (class-first build plan §3.4, F8): a route can wait for a lesson
 * or a trophy, both derived from the player view exactly as the server derives them.
 */
import assert from "node:assert/strict";
import type { PlayerView } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import { describe, evaluate } from "./conditions";

function obsFor(view: Partial<PlayerView>): Observation {
  return { self: view as PlayerView } as unknown as Observation;
}

const fresh = obsFor({ combatArchetype: "cadence", biomeLevel: {}, bossesCleared: [], disciplineId: null });
const plains2 = obsFor({ combatArchetype: "cadence", biomeLevel: { plains: 2 }, bossesCleared: ["plains:1"], disciplineId: null });
const unclassed = obsFor({ combatArchetype: null, biomeLevel: { plains: 2 }, bossesCleared: [], disciplineId: null });

const sweep = { type: "pieceLearned", pieceId: "striker-sweep" } as const;
const wideArc = { type: "trophyHeld", trophyId: "striker-relic-plains" } as const;
const wideArc2 = { type: "trophyHeld", trophyId: "striker-relic-plains", rank: 2 } as const;

assert.equal(evaluate(sweep, { obs: fresh, elapsedMs: 0 }), false, "a fresh Striker hasn't learned Sweep");
assert.equal(evaluate(sweep, { obs: plains2, elapsedMs: 0 }), true, "Plains level 2 teaches it");
assert.equal(evaluate(wideArc, { obs: plains2, elapsedMs: 0 }), true, "the Plains boss gives Wide Arc");
assert.equal(evaluate(wideArc2, { obs: plains2, elapsedMs: 0 }), false, "rank 2 needs the T2 Plains boss");
assert.equal(evaluate(sweep, { obs: unclassed, elapsedMs: 0 }), false, "no class, no kit");
assert.equal(describe(wideArc2), "striker-relic-plains held (rank 2+)");

console.log("classConditions.test.ts: ok");
