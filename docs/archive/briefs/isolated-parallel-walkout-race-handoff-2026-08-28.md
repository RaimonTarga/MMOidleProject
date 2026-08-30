> **ARCHIVED — fixed same-day 2026-08-28.** Live harness is `bot/src/concurrency`; see
> `docs/headless-bot-harness-plan.md`. Kept as the bug record.

# Handoff: isolated-parallel lease walk-out race (found 2026-08-28)

## Context

Live validation of `bot/src/concurrency` `isolated-parallel` mode against the
real dev server (not a unit-test scenario — this was three real socket.io bot
clients: `striker-t1`, `slinger-t1`, `conduit-t1`, `maxConcurrency=3`,
25x rewards, 20s launch stagger). Full suite was 106/106 green going in; this
is a live-server-only defect, nothing changed in this session.

Artifacts (untouched, preserved): `bot/runs/live-validation-phaseA/batch-2026-08-28T21-11-20-569Z/`.
Relevant files: `striker-t1-intended-2026-08-28T21-14-16-198Z-697e2516/events.jsonl`
and `slinger-t1-intended-2026-08-28T21-14-36-222Z-d86c8ad0/events.jsonl`.

**Caution for whoever reads these logs**: `atMs` in `events.jsonl` is relative
to *that bot's own* connect time, not a shared clock. To compare events across
bots, convert to absolute time using each route's `startTime` from
`batch-manifest.json` (`absolute = startTime + atMs`). Comparing raw `atMs`
across two different bots' files directly gives a wrong ordering — I did this
live during the validation session and initially mis-diagnosed the finding
below as a lease-manager double-grant. It isn't. Converting to absolute time
resolves it cleanly; see "What actually happened" below.

## What actually happened

Both bots were farming node `node-t1-swamp-03` (biome Swamp), one after the
other, as intended — this is a normal lease hand-off, not two controlled bots
being granted the same lease simultaneously:

- Striker held the lease on `node:node-t1-swamp-03` continuously and released
  it via `releaseForTransit` (`reason: "route-travel"`) at absolute
  **21:19:05.073Z**.
- Slinger requested and was granted the same area at absolute
  **21:19:13.370Z** — over 8 seconds later, well after striker's release.
  This is the lease manager working correctly: single in-process instance,
  synchronous `dispatch()`, no scheduler-level race.
- Both bots then logged `controlled-overlap` (`reason:
  "controlled-player-observed"`) for ~3 seconds, absolute **21:19:13.4 –
  21:19:16.4Z** — i.e. starting the instant slinger's lease was granted.

So striker's *lease* was gone 8+ seconds before slinger arrived, but
striker's *avatar* was still physically standing in `node-t1-swamp-03` when
slinger's avatar entered and started farming. `RouteLeaseSession.observe()`
correctly detected two controlled-bot players occupying the same leased area
and flagged `CONTAMINATED_CONTROLLED_OVERLAP` — the detector did its job.

## Root cause (hypothesis, not yet confirmed by code reading beyond this)

`releaseForTransit` (`bot/src/concurrency/routeLeaseSession.ts:160`) fires as
soon as the route executor *decides* to travel — i.e. at the logical
transition — not when the character has actually left the node in-world.
Real travel (walking to an exit, pathing to the next node) takes real time.
During that window the node is unleased and up for grabs, so another
controlled bot with a pending `"any"` request for the same biome
(`AreaLeaseManager.dispatch()`, `bot/src/concurrency/areaLeaseManager.ts:314`,
the `mode === "any"` branch at line ~327) can be granted it and start farming
while the previous owner is still standing there.

This is a genuine gap in the isolation guarantee, distinct from the
documented "waiter keeps its parked node" protection (which only covers a bot
that is *waiting*, not one that just voluntarily released and is now
walking out).

## Suggested directions (not investigated further, no fix applied)

- Don't release the lease until the executor observes the bot's own
  `obs.nodeId` actually differ from the leased node (i.e. gate
  `releaseForTransit` on an observed node-exit rather than the travel
  decision).
- Or: keep releasing at the decision point, but have the *grantee* not
  actually start combat/farming until it also observes the node is clear of
  other controlled players (would need a new observation-side check, not just
  a lease-side one).
- Or: accept a few seconds of walk-out overlap as inherent to "logical release
  precedes physical departure" and explicitly classify it as non-combat
  contamination (the overlapping window here had `attackers: 0` on both sides'
  `concurrency-sample` events — no double-tapped monsters were observed) —
  i.e. narrow the detector to flag only overlap *with concurrent combat*,
  not mere co-presence. This would be a deliberate scope change to what
  counts as contamination, so needs a call from whoever owns this system, not
  a unilateral fix.

Whichever direction is chosen, add a regression test that reproduces a
walk-out-timing overlap (two lease sessions on one `AreaLeaseManager`, one
releasing right as the other is granted the same area) since
`bot/src/concurrency/*.test.ts` currently has no case for this specific
timing gap.

## Batch status left behind

The batch processes were hard-killed (Windows doesn't deliver a clean
SIGTERM through the `pnpm --filter` process tree in this environment), so
`batch-manifest.json` still shows all three routes as `"status": "running"`
with no `summary.json` written. The raw `events.jsonl`/`deaths.jsonl` per
route are complete and were not touched. Live validation did not proceed to
Phase B (the 8-route wave) per the session's own stop condition once this was
confirmed.

---

## Resolution (2026-08-28, same day)

Fixed. The diagnosis in this handoff was correct; reading the artifacts also
turned up a second, latent defect on the same code path.

### Defect 1 — release at the travel decision (the reported race)

`ensureAt` released the lease before `navigateTo`, so the node sat unleased for
the whole walk-out while the avatar was still in it.

**Fix:** `ensureAt` captures the node it is departing and releases it only when
the bot's own position slice reports a different node — an *observed* departure,
checked both in the travel poll and once more after arrival (the wait can end
before `onPoll` sees the last hop). `RouteLeaseSession.releaseNode(nodeId)`
surrenders exactly that one node and nothing else.

### Defect 2 — the destination lease was released too (latent, not yet observed)

`releaseForTransit()` retained *nothing*, and `ensureAt` called it after
`acquireActivity` had already been granted the destination. Whenever the bot was
not already standing in the granted node, it dropped that grant and then farmed
the node holding no lease at all — which also silences `observe()`, since
overlap is only reported by a bot that owns the area.

The live logs did not show this: every route puts an explicit `travel` step
before each farm, so `ensureAt` early-returned and the grant survived. The `"any"`
fall-through path would have hit it directly.

**Fix:** the release-everything helper is gone. `acquireActivity` no longer drops
the old node on grant either — a bot briefly holds `{from, to}` and gives up
`from` on departure.

### Also fixed: bots were not spreading out

Because the lease was dropped during travel, a follower's `"any"` request always
saw the head candidate free and picked the *same* node. Both bots walked the
identical path (`plains-05` → `forest-04` → `swamp-03`); the fall-through
spreading never engaged. With the lease now held through the walk, a follower
falls through to a different node — or, for a single-candidate resource farm like
the `swamp-03` collision here, correctly *waits*.

### Third hole closed

A bare `travel` step acquired nothing, so a bot could arrive and stand in a node
another bot was farming. `doTravel` now acquires its destination before walking.

### Regression test

`routeLeaseSession.test.ts` "Walk-out race" reproduces the timing directly:
after the travel decision the departing bot must still own the node, a follower
asking for it must be handed a different candidate, and only an observed
departure frees it. Mutation-checked — restoring the old release-on-grant
behaviour fails it.

Full suite green. Not yet re-validated live; Phase A should be re-run.
