import assert from "node:assert/strict";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  DEFAULT_RUNE_LOADOUT,
  isRuneRuleCompatibleForArchetype,
  type EquippedRule,
  type PlayerView,
} from "@mmo-idle/shared";
import { BuildError, runeLoadoutKey, validateRuneLoadout } from "./runes";
import { applyRuneLoadout, type RuneLoadoutControl } from "./apply";
import type { Observation } from "../state/observation";

const allFragments = [...CONDITION_DATABASE.keys(), ...ACTION_DATABASE.keys()];
const self = { runesOwned: allFragments, combatArchetype: "cadence", runesEquipped: [] } as unknown as PlayerView;

// ── Validation: shape, ownership and the class. Nothing is priced. ──────────
assert.deepEqual(validateRuneLoadout([...DEFAULT_RUNE_LOADOUT], self), [], "the default standing orders are legal");
assert.deepEqual(validateRuneLoadout([], self), [], "an empty loadout clears the runes");
assert.equal(validateRuneLoadout(null as unknown as EquippedRule[], self)[0].code, "MALFORMED_BUILD");
assert.equal(validateRuneLoadout([{ conditionId: "always" } as EquippedRule], self)[0].code, "MALFORMED_BUILD");
assert(
  validateRuneLoadout([...DEFAULT_RUNE_LOADOUT], { ...self, runesOwned: [] }).every((issue) => issue.code === "MISSING_UNLOCK"),
  "unowned fragments are a missing unlock",
);
assert.equal(
  validateRuneLoadout([{ conditionId: "always", actionId: "no-such-action" }], { ...self, runesOwned: [...allFragments, "no-such-action"] })[0].code,
  "MALFORMED_BUILD",
  "an unknown fragment is malformed even when listed as owned",
);
{
  // A class-only action: legal for its own class, refused for another.
  const conditionId = [...CONDITION_DATABASE.keys()].find((id) =>
    isRuneRuleCompatibleForArchetype({ conditionId: id, actionId: "let-dots-finish" }, "dot"));
  assert(conditionId, "fixture: some condition pairs with Let DoTs Finish");
  const rule = { conditionId, actionId: "let-dots-finish" };
  assert.deepEqual(validateRuneLoadout([rule], { ...self, combatArchetype: "dot" }), []);
  assert.equal(validateRuneLoadout([rule], self)[0].code, "MALFORMED_BUILD");
}
{
  // Runic Points are gone: forty rules is a long list, not an over-budget one.
  const many = Array.from({ length: 40 }, () => ({ ...DEFAULT_RUNE_LOADOUT[0] }));
  assert.deepEqual(validateRuneLoadout(many, self), []);
}

// ── Identity: order and every carried field, nothing else ───────────────────
{
  const [a, b] = DEFAULT_RUNE_LOADOUT;
  assert.equal(runeLoadoutKey([a, b]), runeLoadoutKey([{ ...a }, { ...b }]));
  assert.notEqual(runeLoadoutKey([a, b]), runeLoadoutKey([b, a]), "order is behavior");
  assert.notEqual(runeLoadoutKey([a]), runeLoadoutKey([]), "clearing is never a subset match");
  assert.equal(runeLoadoutKey([{ ...a, waitOutMode: undefined }]), runeLoadoutKey([a]), "an absent field is not a difference");
  assert.notEqual(
    runeLoadoutKey([{ conditionId: "always", actionId: "wait-it-out", waitOutMode: "all" }]),
    runeLoadoutKey([{ conditionId: "always", actionId: "wait-it-out", waitOutMode: "heat-managed" }]),
    "a carried field is part of the rule",
  );
}

// ── Application: one authoritative edit, verified, or a named failure ───────
function harness(onSet: (rules: EquippedRule[], live: { runesEquipped: EquippedRule[] }) => { success: boolean; reason?: string }) {
  const live = { ...self, runesEquipped: [] as EquippedRule[] };
  const reports: Array<Record<string, unknown>> = [];
  let sends = 0;
  const control: RuneLoadoutControl = {
    obs: { self: live } as unknown as Observation,
    intents: { setRuneLoadout: async (rules) => { sends += 1; return onSet(rules, live); } },
    mutate: (send) => send(),
    wait: async (predicate, what) => { if (!predicate()) throw new Error(`never converged: ${what}`); },
    report: (detail) => reports.push(detail),
  };
  return { live, reports, control, sends: () => sends };
}

async function application(): Promise<void> {
  const wanted = [...DEFAULT_RUNE_LOADOUT];

  const accepted = harness((rules, live) => {
    live.runesEquipped = structuredClone(rules);
    return { success: true };
  });
  await applyRuneLoadout(wanted, accepted.control);
  assert.equal(accepted.sends(), 1, "one edit applies the loadout");
  assert.equal(runeLoadoutKey(accepted.live.runesEquipped), runeLoadoutKey(wanted));
  await applyRuneLoadout(wanted, accepted.control);
  assert.equal(accepted.sends(), 1, "an equal loadout sends nothing");
  assert(accepted.reports.some((r) => r.phase === "verified" && r.idempotent === true));

  const unknown = harness(() => ({ success: false, reason: "Unknown rune" }));
  await assert.rejects(applyRuneLoadout(wanted, unknown.control),
    (e: unknown) => e instanceof BuildError && e.code === "STALE_IMPLEMENTATION");
  assert(unknown.reports.some((r) => r.phase === "failed"), "a rejection is reported before it is thrown");

  const ignored = harness(() => ({ success: true }));
  await assert.rejects(applyRuneLoadout(wanted, ignored.control),
    (e: unknown) => e instanceof BuildError && e.code === "STATE_SYNC_FAILURE");

  const unowned = harness(() => ({ success: true }));
  unowned.live.runesOwned = [];
  await assert.rejects(applyRuneLoadout(wanted, unowned.control),
    (e: unknown) => e instanceof BuildError && e.code === "MISSING_UNLOCK");
  assert.equal(unowned.sends(), 0, "an invalid loadout is refused before any edit");
}

application().then(() => console.log("loadout.test.ts: ok"), (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
