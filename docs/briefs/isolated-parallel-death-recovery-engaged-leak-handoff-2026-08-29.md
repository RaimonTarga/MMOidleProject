# Handoff: stale `engaged` flag survives a death-recovery walk (found 2026-08-29)

## Context

Third live-validation pass of `bot/src/concurrency` `isolated-parallel` mode,
after two same-day fixes:

1. [isolated-parallel-walkout-race-handoff-2026-08-28.md](isolated-parallel-walkout-race-handoff-2026-08-28.md)
   — release-on-travel-decision → release-on-observed-departure. Fixed,
   re-validated clean in a 3-bot smoke.
2. [isolated-parallel-8bot-scale-overlap-handoff-2026-08-28.md](isolated-parallel-8bot-scale-overlap-handoff-2026-08-28.md)
   — fight-back-while-travelling inside a leased node, plus the
   engaged/transit overlap classification (`contaminating` flag,
   `isForeignNode`, `setEngaged`). Fixed same day; the handoff's own
   resolution note says "Not re-validated live — Phase B should be re-run."

This is that re-run: the full 8-route controlled cohort
(`executionMode=isolated-parallel`, `maxConcurrency=8`, `staggerMs=15000`,
25x rewards). All relevant unit tests passed going in
(`routeLeaseSession.test.ts`, `areaLeaseManager.test.ts`, `harness.test.ts`).

A `contaminating:true` overlap fired within ~4 minutes between `slinger-t1`
(the legitimate owner of `node-t1-swamp-03`, actively killing, gaining a
catalyst, crafting) and `squire-t1` (observed in the same node). The batch
was stopped once the cause was confirmed; artifacts preserved at
`bot/runs/live-validation-phaseB/batch-2026-08-28T22-34-07-133Z/`.

## What actually happened (confirmed from squire's own log)

This is **not** the fight-back bug from handoff #2 — squire's own
`concurrency-sample` events show `attackers:0` for the entire window it spent
in `swamp-06` and `swamp-03` (34 samples, zero non-zero). It never fought
anything there; no kill, no damage-taken, no catalyst gain attributable to
squire in either node.

The real sequence, from `squire-t1`'s events.jsonl:

1. `atMs=308488` — squire is farming `swamp-02` (a `craftRune` step's
   `farmBlocked` → `farmUntil`), which sets `leaseSession.setEngaged(true)`
   once `ensureAt` lands it there.
2. `atMs=373566` — squire **dies** to a DoT (Tiny Wisp poison, 4 stacks) while
   still farming `swamp-02`.
3. Respawn sends it to the region hub (`node-clearing`, seen at
   `atMs=375881`).
4. `farmUntil`'s own death-recovery logic (`bot/src/route/executor.ts`,
   inside `farmUntil`'s `onPoll`) notices `obs.nodeId !== nodeId` and calls
   `intents.navigateTo(nodeId)` directly to walk back to `swamp-02` — **not**
   through `ensureAt`.
5. That walk-back physically crosses `swamp-06` (`atMs=394898`) then
   `swamp-03` (`atMs=413921`, ~36 seconds of dwell before the overlap
   resolved), which `slinger-t1` was actively farming.
6. Because step 4 never calls `ensureAt`, none of `ensureAt`'s protections
   apply to this walk: no `setEngaged(false)` at the start, no
   `isForeignNode` gate on fight-back (moot here since nothing attacked
   squire), and — the actual cause — the `engaged=true` flag set back in
   step 1 is **never cleared**. `AreaLeaseManager.isEngaged(squire)` reads
   true the whole time squire is wandering through nodes it doesn't own,
   so `slinger`'s `observe()` classifies the co-presence as
   `contaminating:true` instead of the intended `transit-co-presence`.

## Why this is a real gap, not just an overly strict classifier

The handoff #2 resolution note frames the design intent plainly: "a
transiting bot genuinely cannot affect the node owner." Squire here was
purely transiting (confirmed zero combat), so by that stated intent this
should have been `transit-co-presence` / non-contaminating. It wasn't,
because `engaged` is farm-session-scoped state that only `ensureAt`s
entry/exit points reset, and the death-recovery nudge inside `farmUntil` is a
third travel path (alongside `doTravel` and `farmUntil`'s own initial
`ensureAt` call) that was never wired to it.

## Suggested next steps (not investigated further, no fix applied)

- `farmUntil`'s death-recovery nudge (`bot/src/route/executor.ts`, the
  `if (obs.nodeId !== nodeId && !isDead) { ...; intents.navigateTo(nodeId); }`
  branch inside its `onPoll`) should clear `setEngaged(false)` before issuing
  that navigate, symmetric with what `ensureAt` does at its own entry — or
  the recovery walk should route through `ensureAt` itself rather than firing
  `navigateTo` inline, which would inherit all of its protections (the
  observed-departure release, the foreign-node fight-back gate, and the
  engaged reset) for free instead of needing a parallel fix.
- Worth auditing for other `navigateTo` call sites outside `ensureAt` that
  could leave `engaged` stale the same way — `clearDungeonGuard` and
  `doAttemptBoss`'s altar-walk logic also call `intents.navigateTo`/`moveTo`
  directly mid-fight; unclear whether any of those can leave a bot standing
  in a foreign node with a stale flag the way this death-recovery path did.
- A regression test in the shape of "Crossing a node someone else owns"
  (already added for handoff #2) but specifically for the
  die-mid-farm-then-walk-home path would catch this directly: farm a node,
  force a death, let the recovery walk cross a second session's owned node,
  assert the resulting overlap is `transit-co-presence` / non-contaminating.

## Batch status left behind

Hard-killed (same Windows/`pnpm --filter` limitation as the prior two
handoffs) — no `summary.json`, `batch-manifest.json` still shows all 8 routes
`"status": "running"`. Raw `events.jsonl`/`deaths.jsonl` per route are intact.

---

## Resolution (2026-08-29)

Fixed, and fixed at the source rather than at the reported path.

### The diagnosis was exactly right

`engaged` was farm-session-scoped state toggled by hand, and `farmUntil`'s
death-recovery nudge is a third travel path that was never wired to it. Squire
was purely transiting (its own samples show `attackers:0` throughout), so this
should have been `transit-co-presence`.

### Why patching that path would not have been enough

The handoff offered two options: clear the flag in the recovery branch, or route
the recovery walk through `ensureAt`. Neither is sufficient, because the real
defect is the *design* of the flag. `bot/src/route/executor.ts` has **eleven**
navigation call sites (`navigateTo` / `moveTo`); only three were wired. The
recovery nudge is not a special case, it is simply the one that happened to be
observed first — `clearDungeonGuard`'s recovery and the altar walk had the same
exposure, as this handoff suspected.

Routing the recovery through `ensureAt` is also not available as written: the
nudge lives inside a synchronous `waitUntil` poll, and `ensureAt` is async.

### The fix: derive engagement instead of declaring it

`RouteLeaseSession.observe()` now sets engagement every tick from the server's
own authoritative combat state:

```ts
this.manager.setEngaged(ownerId, (self?.auto ?? false) && !(self?.isDead ?? false));
```

`auto` is a networked `PlayerView` field owned by the server, which clears it on
`navigateTo` and on respawn. It therefore cannot go stale, and it covers every
present and future travel path without anyone needing to know the path exists.
It is also semantically sharper than the flag ever was: it answers "is this bot
currently set to fight", which is precisely the question the overlap classifier
asks. A bot fighting in a node it does not own still reads as engaged and is
still flagged — the real overlap from handoff #2 is not weakened.

All seven manual `setEngaged` calls were deleted, and the session's public
`setEngaged` was removed so the footgun cannot be picked back up.

### Regression tests

- `routeLeaseSession.test.ts` "Death-recovery walk" reproduces the live
  sequence: farm with auto on (engaged), die (engagement cleared), walk home
  across another session's owned node (still not engaged, and the resident
  records `transit-co-presence`, not contamination), resume farming (engaged
  again).
- The overlap cases are now driven through `observe()` with real auto/isDead
  flags rather than a hand-set flag, and a dead bot standing in a leased node is
  asserted not to be an overlap.
- `harness.test.ts` gains a source guard: no module outside the two concurrency
  files may call `setEngaged`. Re-adding a hand toggle anywhere fails the suite.

Mutation-checked: making the derivation sticky (never clearing) fails, and
re-introducing a manual toggle fails the source guard.

Full suite green. Not re-validated live — Phase B should be re-run.
