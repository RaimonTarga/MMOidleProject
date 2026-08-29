# Handoff: isolated-parallel overlaps at 8-bot scale (found 2026-08-28)

## Context

This is a follow-up to [isolated-parallel-walkout-race-handoff-2026-08-28.md](isolated-parallel-walkout-race-handoff-2026-08-28.md).
That bug (release-on-travel-decision instead of release-on-observed-departure)
was fixed same day and re-validated clean in a 3-bot smoke
(`striker-t1`/`slinger-t1`/`conduit-t1`, `maxConcurrency=3`) — ~7.5 minutes of
real progression across five biomes with zero work-overlap.

Scaling that same fix straight to the full 8-route controlled cohort
(`striker-t1`, `striker-brace-tank-t1`, `squire-t1`, `squire-brace-tank-t1`,
`slinger-t1`, `spirit-t1`, `apprentice-t1`, `conduit-t1`,
`executionMode=isolated-parallel`, `maxConcurrency=8`, `staggerMs=15000`,
25x rewards) reproduced a **different** overlap problem within the first four
minutes, independently five times, across three different Plains/Forest
nodes. The batch was stopped once this was clear; Phase B has not been
re-run since.

Artifacts (untouched, preserved):
`bot/runs/live-validation-phaseB/batch-2026-08-28T21-50-31-277Z/`.

## What the logs show

Five distinct `(node, bot-pair)` combinations logged `controlled-overlap`
(`reason: controlled-player-observed`), 120 log lines total across 6 of the 8
route files:

- `node-t1-plains-05` — `striker-t1` / `striker-brace-tank-t1`
- `node-t1-plains-05` — `slinger-t1` / `squire-t1`
- `node-t1-plains-05` — `apprentice-t1` / `conduit-t1`
- `node-t1-plains-02` — `conduit-t1` / `squire-brace-tank-t1`
- `node-t1-forest-03` — `squire-t1` / `slinger-t1`

Unlike the Phase A false-positive (a bot legitimately transiting through a
node it doesn't own, `attackers:0` throughout), these are **not** brief
pass-throughs. The first one, examined in detail:

- `striker-brace-tank-t1` requested a travel lease for the Plains biome. The
  manager correctly saw `node-t1-plains-05` already held by `striker-t1` and
  granted the fallback candidate instead: log line shows
  `"phase":"acquired","areaIds":["node:node-t1-plains-04"]`.
- Its very next event is `"kind":"node-enter","nodeId":"node-t1-plains-05"`
  — the node it was *not* granted, and the one `striker-t1` was actively
  farming.
- It then stayed there ~21 seconds with live combat: auto-combat engaged,
  `attackers` rose to 3, a kill landed, a catalyst was gained, HP dropped to
  58%. This is real concurrent progression in a node leased to someone else,
  not mere co-presence.
- The `conduit-t1`/`squire-brace-tank-t1` pair in `plains-02` is worse: the
  overlap recurred in at least two separate windows roughly a minute apart
  and individually ran 15+ seconds each — over 100 of the 120 total overlap
  lines belong to this one pair.

## Hypothesis (not confirmed — no further code tracing done this session)

`doTravel` in `bot/src/route/executor.ts` (~line 249):

```ts
const granted = await this.deps.leaseSession?.acquireActivity(candidates, ...);
await this.ensureAt(granted ?? candidates[0]);
```

`candidates[0]` is always the biome's literal head candidate (`plains-05` in
every incident above) regardless of which node the manager actually granted.
If `granted` is ever falsy despite the manager's internal state recording a
real grant elsewhere, `ensureAt` silently walks to the wrong node — one this
bot holds no lease for, and which may be actively held and worked by another
controlled bot. Every observed incident is consistent with this: the granted
area in the lease log is never the node the bot is later found fighting in.

This is a hypothesis only. It was not confirmed by tracing
`RouteLeaseSession.acquireActivity`'s return path, `AreaLeaseManager.acquire`
promise resolution, or whether `intents.navigateTo` / server-side pathing
could independently route a bot through/into an adjacent leased node under
load that wasn't visible at 3-bot scale. Both are plausible next steps.

## Why this didn't show up in the 3-bot smoke

Likely just contention density: 8 bots launched close together (15s stagger)
create far more candidate collisions in the shared six-biome spine than 3
bots did, and the recurring `plains-02` incident in particular suggests
something stateful (not just a one-off race) once a bot ends up mis-routed
into a leased node it doesn't hold.

## Suggested next steps (not investigated further, no fix applied)

- Add logging or a regression test that asserts, for every `doTravel` call,
  the node the bot's own `obs.nodeId` settles on after `ensureAt` matches
  the `granted` area returned by `acquireActivity` — this would catch the
  exact divergence seen here directly rather than only inferring it from
  `controlled-overlap` events.
- Re-run the 3-bot smoke with a shorter stagger (e.g. 5s) to see if the
  walkout-race fix's own re-validation was clean partly because contention
  was too low to exercise this path — if it reproduces there too, the issue
  isn't really "8-bot scale," it's latent and needs less setup to trigger
  than assumed.
- Check whether `RouteLeaseSession.acquireActivity`'s promise can resolve
  `undefined`/falsy under any real code path (as opposed to only when
  `leaseSession` itself is undefined, which isn't the case in a controlled
  run).

## Batch status left behind

The batch process was hard-killed (same Windows/`pnpm --filter` limitation
noted in the prior handoff), so no `summary.json` was written for any of the
8 runs and `batch-manifest.json` still shows all routes `"status": "running"`.
Raw `events.jsonl`/`deaths.jsonl` per route are intact and were not touched.

---

## Resolution (2026-08-29)

Fixed. The hypothesis in this handoff is **not** what happened — `granted` was
never falsy, and no bot walked to the wrong node.

### What the artifacts actually show

Tracing `striker-brace-tank-t1` around the first incident:

```
194654 LEASE acquired ['node:node-t1-forest-02']  travel:node-t1-forest-04
205879 LEASE released ['node:node-t1-plains-04']  departed-node
205903 ENTER node-t1-mountain-04
207906 ENTER node-t1-mountain-05
240957 ENTER node-t1-cave-05
272066 ENTER node-t1-cave-06
```

The bot asked for `forest-04`, the manager correctly saw it held and granted the
fall-through `forest-02`, and the bot then walked toward `forest-02` — a long
crossing through Mountain and Cave. `node-enter` fires on **every transit hop**,
so "granted X, entered Y" is a pass-through, not a mis-route. The lease layer was
behaving correctly throughout.

### Root cause: fighting back mid-transit inside a leased node

`ensureAt`'s **FIGHT BACK WHILE TRAVELLING** rule
(`bot/src/route/executor.ts`) enables auto-combat when attacked during travel and
`return`s *without re-issuing navigation*, so the bot stops and fights wherever it
is until nothing is attacking it. Crossing a node another controlled bot was
farming, that produced exactly the reported symptoms: ~21s and 15s+ bouts,
`attackers` rising to 3, a kill, a catalyst gain, HP to 58% — real progression
inside a node the bot did not hold.

This scales with bot count because contention pushes fall-through grants further
away, and longer crossings traverse more leased nodes. At 3 bots almost nothing
was contended, so crossings were short and stayed inside unleased ground.

### Fixes

1. **Never fight in a node another controlled bot holds.** The travel loop now
   consults `RouteLeaseSession.isForeignNode(nodeId)`; when attacked there it
   keeps walking instead of trading blows (and cancels any fight-back already in
   progress). Fight-back is unchanged in unleased nodes — including the Clearing
   — so the original "three deaths crossing one Forest node" protection survives
   everywhere it is safe. Taking hits while crossing only risks *that* run, which
   is an acceptable cost; contaminating another bot's evidence is not.

2. **Overlap is classified, not blanket-tainting.** Sessions now declare whether
   they are ENGAGED (farming / guard-clear / boss) or merely travelling. An
   observed co-presence is `controlled-player-observed` + `contaminating: true`
   only when the other bot is engaged; a pass-through is recorded as
   `transit-co-presence` + `contaminating: false` and does **not** taint the run.
   This is what the Phase A handoff flagged as needing an owner's call — the
   designer has since confirmed bots may share a zone in transit, and with fix 1
   a transiting bot genuinely cannot affect the node owner.

   Summaries now carry `coordination.contaminatingOverlaps` and
   `coordination.transitCoPresences` so pass-throughs stay auditable.

### Regression tests

`routeLeaseSession.test.ts` gains "Crossing a node someone else owns" (the
`isForeignNode` contract the executor gates on, including that the Clearing is
never foreign) and splits the overlap case into a non-tainting pass-through and a
tainting engaged overlap. Both mutation-checked: forcing `isForeignNode` to false
and forcing every overlap to contaminate each fail.

Full suite green. Not re-validated live — Phase B should be re-run.

### Still open (not a correctness bug)

At 8-bot contention the fall-through can grant a node on the far side of the map,
producing multi-biome crossings that cost real time. It is now *safe*, just slow.
Whether a bot should instead **wait** for a nearer node rather than trek across
several biomes is a scheduling-policy call worth making before a long wave.

### Follow-up: nearness bias (2026-08-29)

The "still open" item above is now implemented rather than left as a policy note.

`resolveNearCandidates` returns the candidates whose hop-distance is within a
slack (default 2) of the CLOSEST one — a *relative* bias, so it behaves the same
whether the target biome is next door or across the map, and never insists on
waiting for something that was never close. The lease manager takes that as
`preferredAreaIds` plus a `widenAfterMs` deadline: an `"any"` request is granted
only from the near cluster until the deadline passes, then from the full list.

So a bot now waits ~90s for a nearby node before accepting a distant one. Waiting
is cheap — a bot that owns the node it is standing in keeps farming through it —
and the deadline guarantees a busy cluster can never wedge a run. FIFO fairness
is untouched: this narrows what a request may be granted, it does not reorder the
queue. `AreaLeaseManager.poll()` re-runs arbitration for the time-based deadline
(the sweep timer calls it).

Tested in `areaLeaseManager.test.ts` (holds out while near nodes are busy; takes
a freed near node over a free distant one; widens past the deadline) and
`harness.test.ts` (the near set is a non-empty subset that keeps the head and
genuinely excludes distant candidates). Mutation-checked.
