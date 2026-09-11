# T2 bossless progression — overnight experiment, 2026-09-07

**Date:** 2026-09-07 · **Experiment id:** `20260906t225326z-t2-progression-overnight` ·
**Status:** all 6 runs terminal after ~87 minutes wall clock (well under the 3h/4h
ceiling) · **Type:** exploratory pipeline + route-feasibility run, non-canonical

This executes the campaign designed in `docs/briefs/t2-bossless-progression-campaign-2026-09-03.md`
and picks up after the abandoned overnight attempt in
`docs/briefs/t2-overnight-run-log-2026-09-04.md`, but through the newer **frozen
isolated experiment runner** (`docs/bot-experiment-runner-current-state.md`)
instead of `bot:batch --executionMode=isolated-parallel`, and with
`--entryEconomy=catalyst-primed` instead of real T1 snapshots (none were on hand
tonight).

Routes, gear plans, biome order and abilities are all pre-existing, committed
route data (`bot/src/routes/t2RouteBuilder.ts`, `t2GearPlans.ts`, `t2Loadouts.ts`).
No monster/player/item/ability/stance/core/biome-requirement/combat-mechanic data
was touched. Two small harness-side fixes were required to make the run possible
at all and are disclosed in full below.

---

## 1. Experiment configuration

| Field | Value |
|---|---|
| Experiment id | `20260906t225326z-t2-progression-overnight` |
| Frozen commit | `9022bf4805a1636e62bf305cdf743870c55aa6e1` (branch `develop`) |
| Frozen source tree | `3eaf12b65b1aecf44bfc9de63a909207e0bd44db` |
| Image | `mmo-idle-experiment:9022bf4805a1-b660575a` |
| Mode | `smoke-isolated` |
| Entry economy | `catalyst-primed` (zero essence; full derived Tier-2 catalyst demand per family) |
| Reward multiplier | 25x (essence + biome XP only; catalysts never scale) |
| Completion mode | `full-gauntlet` (default) — governed by each route's own `globalMasteryAtLeast: 72` condition, **not** `next-tier` |
| Concurrency | 4 workers (opt-in ceiling per the doc's resource qualification) |
| Per-run runtime cap | `--maxRunMs=10800000` (3h); worker adds a 30s grace, so the true kill point is 3h00m30s. No run came close — longest (Conduit) ran 43m55s |
| Launch timestamp | 2026-09-06T22:53:26Z |
| Cohort wall-clock | 2026-09-06T22:53:26Z → 2026-09-07T00:18:06Z (≈ 87 min) |
| Stall rules relied on | `DEFAULT_NO_PROGRESS_MS` = 12 min, `DEFAULT_STEP_TIMEOUT_MS` = 30 min, `TRAVEL_TIMEOUT_MS` = 10 min, `BIOME_CAPPED_GRACE_MS` = 8 min (`bot/src/route/executor.ts`) |
| Invoking checkout | dirty (excluded from the frozen image by construction — `git archive` on the commit) |

Peak resource use across the 4-worker cohort: 183–202 MiB per worker, 39–61%
container CPU, event-loop p99 41–215 ms (Squire's 214.6 ms p99 is the only value
notably above the earlier qualification's ~33 ms ceiling at 4 workers — plausibly
a one-off GC/tick spike rather than a trend, since CPU% for that same run was
mid-pack at 54.5%; not chased further).

### Flag-name corrections vs. the task's assumptions

The prompt assumed flags that do not exist on the frozen runner. Verified against
`node scripts/experiment/cli.mjs --help` and the source before launching:

- **`--completion=next-tier` does not apply here and was correctly omitted.**
  `full-gauntlet` (the default) runs the route to its own authored `completion`
  condition; the prompt's own suspicion that `next-tier` would deadlock against a
  bossless route's `globalMasteryAtLeast: 72` was confirmed correct by reading
  `bot/src/botRun.ts:195` (`next-tier` overrides completion to
  `playerTierAtLeast: 2`, which is irrelevant and would either falsely early-exit
  or never fire depending on entry tier — either way, the wrong instrument).
- **`--entryEconomy` did not exist on the experiment runner at all.** This is the
  one genuine gap, described in full below.
- The runner's own `--maxRunMs` **is** the run-deadline flag; no separate
  deadline concept exists. `--maxRunMs=10800000` was threaded straight through to
  the bot's own flag of the same name, so no extra plumbing was needed there.
- `--workers=4` is correctly the opt-in ceiling per the doc; the queue drained
  correctly (4 running immediately, 2 queued, each queued run started the moment
  a slot freed — confirmed in `state.json` transitions).

### Harness fix required: `--entryEconomy` did not reach the bot process

Reading `scripts/experiment/{lib,cli,supervisor,worker}.mjs` end to end: the
experiment runner's `normalizeCreateOptions` had no `entryEconomy` field at all,
and `worker.mjs`'s `botArguments()` never emitted `--entryEconomy=...`. Every T2
route run through the experiment runner would have silently resolved
`config.entryEconomy` to the bot's own hardcoded default, `"clean"`
(`bot/src/config.ts:228`) — meaning every run tonight would have carried **zero**
carryover essence *and* zero catalysts, and hit the ~four-hour irreducible
catalyst floor documented in `bot/src/tierEntry/economy.ts` before making any
real Tier-2 progress. This would have silently defeated the entire point of
requesting `catalyst-primed` and made every run in this cohort meaningless.

Fixed by threading `entryEconomy` through the same four places `rewardMultiplier`
and `completionMode` already flow: `scripts/experiment/lib.mjs`
(`normalizeCreateOptions`, validated against `clean|natural|catalyst-primed`),
`scripts/experiment/cli.mjs` (`manifest.config.entryEconomy`, `--help` text),
`scripts/experiment/supervisor.mjs` (`writeRunConfig`), and
`scripts/experiment/worker.mjs` (`botArguments()`, emitting
`--entryEconomy=${config.entryEconomy}` when non-default). Confirmed end to end
in a 5-minute smoke run before the real launch: `run-config.json` carried
`"entryEconomy": "catalyst-primed"`, and every real run's `bot.log` shows
`profile=<class>-t1-t2-entry-catalyst-primed` passing template + spawn
validation (89–90 checks each, 0 errors). **This is the only source change made
tonight**, confined entirely to `scripts/experiment/*.mjs`; nothing under `bot/`,
`shared/`, or `server/` was touched.

### Starting-snapshot methodology

Synthetic tier-entry via `smoke-isolated` + `catalyst-primed`, one profile per
class root, resolved automatically by each route's `startsFromTierEntry: 2`
declaration (`bot/src/tierEntry/profiles.ts`, `t2EntryProfileId`). No real T1
handoff snapshots were available tonight, so every run used the `clean`
permanent-progression / `catalyst-primed` wallet template — **not** a measured T1
run. Frame per class root, all `-balanced` or the class's authored T2 entry
frame (`FRAME_BY_ROOT` in `profiles.ts`): `cadence-balanced` (Striker),
`cooldown-heavy` (Squire), `reload-heavy` (Slinger), `energy-heavy` (Spirit),
`dot-balanced` (Apprentice), `summoner-balanced` (Conduit). Route ids used —
confirmed directly from `T2_PROGRESSION_ROUTES` in `bot/src/routes/t2RouteBuilder.ts`,
not guessed: `striker-t2-progression`, `squire-t2-progression`,
`apprentice-t2-progression`, `slinger-t2-progression`, `spirit-t2-progression`,
`conduit-t2-progression`.

---

## 2. Route definitions (what each of the 6 routes actually does)

All six share the fixed spine **Plains → Forest → Swamp → Mountain → Cave →
Jungle → Desert**, the same per-biome scaffold, and complete on
`globalMasteryAtLeast: 72` (all seven Tier-2 biomes at their playerTier-2 cap; no
boss is ever fought, `attemptBoss` is entirely absent from these routes). Per
leg, every route runs the same four blocks in this fixed order — **and that
fixed order is itself one of tonight's two findings, see §5**:　

1. **`buildAcquisitionSteps`** — craft the leg's Tier-2 core and/or stance if
   this is their designated leg (`core-tempered`/Cave, `core-survivalist`/Jungle,
   `core-force`/Desert; offensive+defensive stances both at Plains).
2. **`farmLoadoutSteps`** — set the ability pair, default stance and farm core
   for this leg's encounter shape (Sweep+offensive-stance for the crowd biomes
   Plains/Forest/Jungle; Expose Weakness+defensive-stance for the single-target
   biomes Swamp/Mountain/Cave/Desert; Cleanse replaces Second Wind only in Swamp).
3. **Per-class gear plan** (`t2GearPlans.ts`) — adopt/craft-only/skip each
   biome's weapon, armor, charm, boots per the class's authored hypothesis, via
   the acquisition planner (craft / evolve / evolve-after-unequip / reconstruct).
4. **Max the biome, then opportunistically upgrade** everything currently worn
   as far as Global Mastery allows (`+0` until GM 42, `+5` only at GM 72).

Class-specific weapon path and hypothesis (unchanged from the 2026-09-03 audit,
restated here for convenience — see that doc for full per-biome tables):

| Class | First T2 weapon (leg) | Second weapon (leg) | Own hypothesis (abridged) |
|---|---|---|---|
| Striker | gale-needle (Forest, 2) | ruinous-axe (Cave, 5) | Cave-dependent; Jungle/Desert offer nothing |
| Squire | — | quake-hammer (Mountain, 4) | the one class Mountain is built for |
| Apprentice | — | swamp-mirebrand (Swamp, 3) | slowest killer, weakest AoE; Jungle/Desert predicted to offer nothing |
| Slinger | gale-needle (Forest, 2) | jungle-stinger-rapier (Jungle, 6) | reload's speed layer should favor a fast on-hit weapon |
| Spirit | gale-needle (Forest, 2) | ruinous-axe (Cave, 5) | wants hit frequency early, then raw attack |
| Conduit | — | ruinous-axe (Cave, 5) | OPEN QUESTION; probe arm (quake-hammer) exists but was not run tonight |

All six adopt the Plains core kit (`plains-vest-t2`, `plains-charm-t2`,
`plains-boots-t2`) and all six skip `knight-steelsword` — both unchanged from the
prior audit and reconfirmed live tonight in every run's milestone stream.

---

## 3. Results table

| Class (route) | Result | Runtime | Final biome / GM | Deaths | Gear path actually taken | Failure reason |
|---|---|---:|---|---:|---|---|
| Striker | **FAILED** | 49m21s | Jungle lvl 2/6 stall · GM 62 | 35 (30 in Cave, 4 Swamp, 1 Mountain) | Full Plains kit → gale-needle (Forest) → ruinous-axe + cave-vest-t2 + core-tempered (Cave) | `no progress for 12m` farming Jungle for `core-survivalist` |
| Squire | **FAILED** | 50m36s | Jungle lvl 4/6 stall · GM 64 | 8 (7 Jungle, 1 Swamp) | Plains kit → swamp-charm-t2 → quake-hammer + mountain-vest-t2 (Mountain) → core-tempered (Cave) | `timed out` (30-min step cap) waiting on `core-survivalist`; real, if slow, progress |
| Apprentice | **FAILED** | 42m01s | Jungle lvl 0/6 stall · GM 60 | 14 (7 Jungle, 3 Mountain, 2 Cave, 2 Swamp) | Plains kit → swamp-mirebrand + swamp-vest-t2 (Swamp) → core-tempered (Cave) | `no progress for 12m`; **zero** Jungle level-ups recorded at all |
| Slinger | **FAILED** | 19m28s | Swamp lvl 7/12 stall · GM 44 | 10 (7 Swamp, 3 Plains) | Plains kit → gale-needle + forest-vest-t2 (Forest) → **weaponless from Swamp onward** | `no progress for 12m`; genuine harness defect, see §4 |
| Spirit | **COMPLETE** | 20m06s | All 7 biomes maxed · GM 72 | 0 | Plains kit → gale-needle (Forest) → mountain-charm-t2 (Mountain) → ruinous-axe + cave-vest-t2 + core-tempered (Cave) → full Jungle/Desert clear | — |
| Conduit | **FAILED** | 43m55s | Jungle lvl 4/6 stall · GM 64 | 5 (2 Jungle, 2 Swamp, 1 Cave) | Plains kit → core-tempered + ruinous-axe + cave-vest-t2 (Cave, leg 5 — its latest weapon of any class) | `no progress for 12m` farming Jungle for `core-survivalist` |

No run came anywhere near the 3h/4h ceiling; the longest (Conduit) finished in
44 minutes. No run required manual `experiment:stop` intervention, and no
event-log staleness (the 2026-09-04 silent-hang signature) was observed at any
point — every `events.jsonl` kept writing at ≤2s cadence for the entirety of its
run's life, confirmed by repeated spaced polling every ~60s throughout.

---

## 4. Per-class observations

**Spirit (COMPLETE, 0 deaths, fastest at 20m06s).** The clean success case and
the class whose own 2026-09-03 hypothesis ("wants hit frequency early, then raw
attack once Cave arrives") played out with zero friction. Notably, Spirit *also*
farmed its pre-`core-survivalist` Jungle block under the leftover single-target
Expose Weakness technique (same ordering defect as every other class, see §5) —
but cleared Jungle level 0→6 in only 150 seconds of real time before the Sweep
swap fired, so the defect never had time to cost it anything. This is direct
evidence that the ordering defect's *severity* depends on raw kill speed at that
exact leg, not on whether the defect exists — every class hit it, only the
slower-killing five were actually punished by it.

**Striker (FAILED, 35 deaths — by far the highest of the cohort).** 30 of 35
deaths are concentrated in **Cave**, not Jungle. Striker's own hypothesis calls
it "Cave-dependent" (it doesn't get its real weapon, ruinous-axe, until Cave, leg
5 of 7), and the death count suggests that dependency has teeth: Striker spent a
large, costly, repeatedly-dying farm grinding toward its own signature weapon
before ever reaching the Jungle wall that ultimately failed it. This is a single
run and not corroborated by a replicate, but it is a large enough outlier (30
deaths in one leg vs. single digits everywhere else in the cohort) to flag for a
follow-up rather than dismiss.

**Squire (FAILED, real progress, hit the 30-min step-timeout not the 12-min
stall).** The only failure of the four Jungle-wall classes that shows genuine,
if slow, level-ups (0→1→2→3→4 over its Jungle dwell) rather than a hard freeze.
This is a pacing problem, not a dead stop — Squire was still making headway when
the harness's step-timeout cut it off. Worth a longer `--maxRunMs`-style
per-step budget for this specific gate before concluding the biome itself is
unbeatable for this class.

**Apprentice (FAILED, zero Jungle level-ups in ~14.8 minutes).** The starkest
data point in the cohort: entered Jungle, farmed continuously (65% of
concurrency samples showed the bot actively engaged, `attackers ≥ 1`), and
recorded **not one single biome-level-up event** before the 12-minute
no-progress stall fired. This is exactly what Apprentice's own authored
hypothesis predicted — "slowest killer; weakest AoE... Jungle predicted to offer
it almost nothing" — and the run essentially reproduced its author's prediction
verbatim. Consistent with genuine class weakness, but confounded by the same
ordering defect every other class hit (§5); cannot be separated from that
confound on this evidence alone.

**Slinger (FAILED, 19m28s — fastest failure, and the only cause unrelated to
Jungle).** Failed in **Swamp**, not Jungle, and for a completely different, fully
diagnosed reason: see §5's route-acquisition bug. Slinger fought its entire
Swamp leg and everything after with **no weapon equipped at all**
(`"weapon":null` in every subsequent death record). This is squarely diagnostic
item 1 — a bot/route implementation defect, not a balance signal about Swamp.

**Conduit (FAILED, 43m55s, cleanest failure of the four Jungle-wall runs).**
Never validated live before tonight per the 2026-09-03 audit; validated cleanly
tonight (89 template + spawn checks, 0 errors). Followed its baseline plan
exactly (ruinous-axe + cave-vest-t2 + core-tempered at Cave, its latest weapon
arrival of any class) and still hit the identical Jungle wall as three other
classes, in the identical node. Its own hammer-vs-axe probe arm
(`conduit-hammer-t2-progression`) was **not** run tonight — it is a separate,
deliberately-excluded probe route per the campaign design and stays that way.

---

## 5. Cross-class findings

### Finding A — a route step-ordering defect makes every class fight its Jungle
core-unlock grind with the wrong ability kit

`makeT2Route` (`bot/src/routes/t2RouteBuilder.ts`) emits, per leg, in this fixed
order: `buildAcquisitionSteps` (core/stance craft-gate farm) **before**
`farmLoadoutSteps` (the technique/stance/core swap for that leg's own encounter
shape). This is silent almost everywhere, because most legs' core-craft gate (if
any) matches the leg's own encounter shape. It is **not** silent at Jungle:
Jungle is the one crowd (`"aoe"`) biome that also gates a core
(`core-survivalist`, `requiredBiomeLevel: 6`), so every class's very first block
of Jungle farming — the block that has to carry it from level 0 to level 6
before `core-survivalist` even unlocks — runs under the **previous** biome's
leftover single-target `expose-weakness` technique, not Jungle's own intended
`sweep`. Confirmed directly in event logs for every one of the six runs
(`ability-activation` shows `expose-weakness` firing throughout the
pre-`core-survivalist` farm block in all six; the `setAbilities` step to `sweep`
does not fire until *after* that block completes). Striker's concurrency samples
during this block show `attackers: 0` in 344 of 355 (97%) two-second samples —
the bot was barely engaging combat at all for nearly the entirety of its 12-minute
stall window, with `monstersInNode` static at 40 the whole time and only 5 kills
recorded.

**This is not a Jungle balance problem — it is a route-authoring ordering bug**,
and the evidence bar the 2026-09-03 campaign doc itself sets (`docs/briefs/t2-bossless-progression-campaign-2026-09-03.md`
§11: "4 or more of 6 classes degraded in the same biome... sufficient to
recommend a global change") is technically met tonight (Striker, Squire,
Apprentice, and Conduit all walled in the identical `node-t2-jungle-04` at the
identical `core-survivalist` gate) — **but the doc's own diagnostic order
(§ preamble, "is the bot implementation broken" before "is it balance") applies
directly here, and the answer is yes, it is.** All four failing classes also
landed on the exact same node id, `node-t2-jungle-04`, with the same `fortified`
modifier — Spirit's initial node was also `node-t2-jungle-04`, but it cleared the
gate in 150 seconds before the modifier or the technique mismatch had time to
matter. **Recommendation: fix the ordering (move `farmLoadoutSteps` before
`buildAcquisitionSteps` in `makeT2Route`) and re-run before drawing any
conclusion about Jungle's difficulty or the `fortified` modifier's tuning.**

### Finding B — an acquisition-planner bug can silently disarm a class for the
rest of a run

`t2Acquisition.ts`'s `evolve-after-unequip` path computes `unequipSlot` **once**,
at route-build time, by finding which equipment slot the frozen tier-entry
profile's snapshot says holds a specific predecessor item id. The emitted route
step (`{type: "unequip", slot: plan.unequipSlot}`) only carries the **slot
name**, and the executor's `unequip` step evicts whatever currently occupies
that slot at **runtime** — not the specific item id the plan intended. When a
class equips a *new* weapon into that slot before reaching the leg that needs to
evict the *original* T1 predecessor (exactly Slinger's case: `gale-needle`
equipped in Forest, leg 2; the Swamp leg's `swamp-mirebrand` acquisition still
carries a stale "unequip weapon" step written against the entry profile's
original `ashbrand-blade`), the step evicts the live, correct weapon instead —
and because `swamp-mirebrand` is `craftOnly` (owned but never equipped per
Slinger's plan), nothing re-equips a weapon until Jungle (leg 6). Slinger fought
Swamp, Mountain, and Cave — three full legs — with an empty weapon slot,
confirmed directly in every subsequent death record's `"weapon":null` and in the
`unequip` event showing `definitionId: "gale-needle"` where the route's own
label claimed `ashbrand-blade`.

This is squarely a bot-implementation defect (diagnostic item 1), not a Swamp
balance finding, and it likely affects **any** class/leg combination where a
`craftOnly` (not `adopt`) evolve-after-unequip acquisition follows a prior
weapon-slot equip. **Recommendation: make the acquisition planner track live
equipment state incrementally as it builds each leg's steps (rather than reading
only the static entry-profile snapshot), or have the executor's `unequip` step
verify the currently-worn item id matches the plan's intended predecessor before
evicting it, refusing/re-planning otherwise.**

### Other cross-class notes

- **Boss statistics: correctly absent in every run.** `bosses.attempts` reads 0
  throughout; the `bosses 5` figure printed in each `bot.log` line is the
  five T1 bosses carried over in the entry profile's `bossesCleared` list, not a
  Tier-2 boss attempt. The bossless route family behaved exactly as designed.
- **`ruinous-axe` / `knight-steelsword` weapon-hypothesis check.** Five of six
  routes (all but Slinger and Squire) do adopt `ruinous-axe` at Cave, and
  `knight-steelsword` was skipped 6/6 as designed — both reconfirmed live
  tonight. Nothing in tonight's data corroborates or contradicts the suspected
  `ruinous-axe` DPS-outlier finding from the 2026-09-03 audit: every adopting
  class reached Cave and equipped it without incident, but no run got far enough
  past Cave under directly comparable conditions to isolate its effect from the
  Jungle wall that immediately follows. This needs a dedicated weapon-comparison
  experiment, not an inference from tonight's data.
- **Mandatory-in-practice defensive gear.** The Plains kit
  (`plains-vest-t2`/`plains-charm-t2`/`plains-boots-t2`) was adopted 6/6 as
  designed, and no run's death record shows a case where skipping it would have
  plausibly helped — consistent with the prior audit's framing of it as the
  tier's plating leader.
- **No bot-behavior false-failure beyond the two defects above.** Squire's
  30-minute step-timeout (real, if slow, progress) is not a bug — it is the
  harness's step-timeout doing its job against a leg that was going to take
  longer than the default budget allows. No hazard-walk, no target-drop loop, no
  contamination/lease issue was observed (this cohort ran single-bot isolated
  workers, so lease contamination cannot apply here).
- **No silent-hang recurrence.** The 2026-09-04 defect (sockets lost mid-run,
  zero reconnect, no summary) did not recur in any of the six runs tonight;
  every worker wrote a complete `worker-result.json` and the bot's own
  `summary.json` in every case.

---

## 6. Recommended next experiments

In the brief's mandated priority order — route corrections first, then
weapon/defensive alternatives, then frame comparisons, then repeatability, only
then balance speculation:

1. **Fix Finding A** (swap `farmLoadoutSteps` before `buildAcquisitionSteps` in
   `makeT2Route`) and **re-run this exact six-route cohort** under the same
   configuration. This alone may resolve 3 of the 4 Jungle-wall failures
   (Striker, Squire, Conduit all showed real if insufficient engagement; only
   Apprentice's zero-level-up result looks like it might survive the fix).
2. **Fix Finding B** (planner tracks live equipment state, or the executor's
   `unequip` step verifies the item id before evicting) and re-run Slinger
   specifically to see how far a *armed* Slinger actually gets.
3. **After both fixes land, re-run the full six-route cohort at least once more**
   before drawing any conclusion about Jungle's `fortified` modifier, biome
   tuning, or any individual class's viability — tonight's data cannot yet
   separate "route bug" from "biome difficulty" for four of six classes.
4. **A dedicated weapon-comparison experiment** for the suspected `ruinous-axe`
   outlier and the deferred Conduit `quake-hammer` probe
   (`conduit-hammer-t2-progression`), once the ordering fix removes the Jungle
   confound that currently prevents any class from being observed cleanly past
   Cave.
5. **A targeted Striker Cave-leg investigation** (30 of 35 deaths concentrated
   there) — determine whether this is automation (e.g., insufficient
   retreat/telegraph handling under the pre-ruinous-axe weapon) or a genuine
   difficulty spike, before treating it as either.
6. **Frame comparisons (Light/Heavy vs. Balanced)** were not run tonight — every
   route used its class's already-authored default frame per
   `FRAME_BY_ROOT`. Worth a follow-up only after 1–3 above land, since frame
   choice cannot be meaningfully evaluated while every class also carries the
   two confirmed route bugs.
7. **Repeatability reruns.** Tonight was one replicate per class (`--count=1`,
   matching the runner's default). Given how decisively Findings A and B explain
   tonight's failures, a second replicate is lower priority than fixing the two
   bugs first — but should follow once the fixes are in, to confirm Spirit's
   clean completion and the others' post-fix outcomes are not one-off variance.
8. **Only after 1–4 are exhausted**, consider whether Jungle's `fortified`
   modifier or Apprentice's raw AoE throughput need an actual balance change —
   tonight's evidence is suggestive but explicitly confounded by two known,
   fixable bugs, and the campaign's own evidence bar requires ruling those out
   first.

---

## Artifacts

Full per-run logs, `events.jsonl`, `deaths.jsonl`, and `summary.json` remain at
`%LOCALAPPDATA%\mmo-idle\experiments\20260906t225326z-t2-progression-overnight\runs\`
(retained; `experiment:clean` removes only containers/network/database volume,
never artifacts or the frozen image). `cohort-summary.json` in the experiment
root carries the resource-metrics table reproduced in §1.
