# Verbs-that-fire run — brief (2026-10-03)

Follow-up to the course-correction run (docs/briefs/course-correction-report-2026-10-03.md,
merged 2bb1a8af). Implements design §24.9 and closes the report's open calls that are not
the designer's numbers. **Opus conductor** in `../mmo-lin-w2c` on `feat/verbs-that-fire`
off `develop`; subagents in `../mmo-lin-w1a`, `w1b`, `w1c`, `w1d2`, `w2a`; same rules as
the previous brief (no installs, no push, strip CR on touched files only, never kill by
image name, full suite before each merge, `git status` + `git branch --show-current` before
the first commit in any worktree). Read §24 whole (§24.9 last) and the report's "designer's
open calls" first.

## Wave 1 — the four firing fixes (parallel; merge order A, B, C)

### A — leans seed their condition (§24.9) · Opus
```
Branch feat/vf-conditions.
1. Affliction lean: a new LineageStatKey 'bleedOnHitPct' (or the dot.* conversion seam if a
   non-DoT class can carry it without inventing a parallel stat — decide by reading
   abilityBramble/DoT code paths, flag the choice): every basic hit applies a light bleed
   worth the lean's share of the hit over 4 s, through the existing lineage bleed id
   (LINEAGE_BLEED_ID), evadeBlocksDebuffs respected. The Apprentice's own DoT also reads
   the stat (it is DoT potency). The Affliction moment ('hit-afflicted') must now fire for
   every class with the lean active; prove it in a wiring test with a Striker.
2. Control lean: 'slowOnHit' — every basic hit applies a short weak slow (duration and
   pct are the designer's; implement as data with provisional 15% / 1.5 s) through
   applyMonsterSlow (max-wins, review P7). 'hit-held' counts slowed, rooted, stunned AND
   knocked-down targets. The Control moment must fire for a Hammer Striker with the lean
   active and no Mid range; wiring test.
3. The Empowered moment gets capMs like Affliction and Control (data; 4000 ms provisional).
   The Conduit's cycle then fires it at the cap; a wiring test pins ≤ 1 firing per cap
   window.
4. Page copy: a Control verb with no held source reads "needs a slow"; the Slinger's
   Empowered verb reads "your mechanic has no hit yet" (known asymmetry, §24.9); Kill
   chain's page copy says it is weak on bosses; Kill chain's pure sentence says "your next
   hit after a kill heals…" (report item 20).
```

### B — T2+ bands compose (§24.9) · Opus
```
Branch feat/vf-t2. The T2 amplifier row moves one axis of the COMPOSED pair (frequency n,
targets, duration, magnitude) — applyAmplifiedAxis on the composed payoff, not on the old
per-pull card; T3 keystone and T4 cross are unchanged in kind. Re-resolve the T2+ verbs'
payoffs through the §24.1 shape rule (same cadence/magnitude tables as T1, scaled by tier
through TIER_SCALAR); every T2 pair must read at least as large as its T1 pair in the lab
(a gate never makes cards smaller) — matrix for the Rapier and Broadsword T2 bands, 10
seeds, against their T1 pairs. Row labels Lean/Verb at T2+ only where they compose.
```

### C — data and docs · Opus (Sonnet acceptable)
```
Branch feat/vf-data.
1. The eight T2–T4 nodes that pay a family they cannot field (report item 15): move the
   dominant to a family the node fields, or add a member; one commit per node; test that
   every node's shard family has ≥1 member in the node's pool.
2. Parked lineages: the boss Lane-A stopgap stops paying Iron and Glass shards while their
   trees are parked (report 17); the stopgap pays the weapon lanes only.
3. Copy: the Hammer's two "+3 Attack." leans read their own stat; the Technique sentence
   at a hit moment; shorten "(once every 5 s)" to "(every 5 s at most)".
4. Docs: §18.9's ±3 pp band, §9's lane-budget bullet and the stray decision above the
   design doc's title are superseded by §24.1 — mark them so; fold the run's living truth
   into docs/lineages-current-state.md; docs/README.md index; move
   docs/briefs/course-correction-run-2026-10-03.md's status line to DONE.
5. Latent: 'first-hit', 'hit-afflicted' and 'hit-held' skip chaotic misses like 'hit-nth'
   does (report: latent, no T1 Axe lane uses them yet — fix anyway, wiring test).
```

## Wave 2 — tutorial (after wave 1; one task) · Opus
```
Branch feat/vf-tutorial. §24.9: the tree lesson moves to the weapon each class fights
with — the Axe for Striker/Squire/Apprentice/Spirit/Conduit plans, the Dagger for the
Slinger — so the bought lean and verb are live in every boss fight; the T1 verb row's
mastery gate is lowered so the verb lands at Forest 4 (Global Mastery value: the
designer's; provisional = the value the Forest-4 beat reaches in the sweep); the guide's
copy names the composed sentence; every per-class pick re-confirmed against the
composition matrix (pick the pair with the best boss-lab uplift for that class that fires
for it). Canonical 1x six-class sweep, one server + DB per class; the bot records card
FIRINGS this time (the report's gap) so the sweep proves the pair fired in the seals.
```

## Close-out (conductor)
- Full suite + typecheck; composition matrix rerun (45 pairs × 6 classes × 10 seeds, boss
  lab + lane bench) — target: no pair under the floor for a firing reason; list any pair
  still under it with its reason.
- Boss lab after/before against the course-correction run's `after-boss.md`.
- Merge to develop (no push). Report `docs/briefs/verbs-that-fire-report-2026-10-03.md`:
  numbers picked, matrix, sweep ledger with firings, unverified list, open calls.
- Drop nothing; the designer drops scratch DBs (gamedb_ccpage, gamedb_ccreadout,
  gamedb_ccfx, gamedb_tut1-5) when done.

## Decide before launch (the designer)
- Tick quantisation of attack timing (§24.9 open): include "carry the remainder" as a
  wave-1 task D, or leave it. If included: a bench of every class's attack rate before/after
  and the Tempo lean's uplift on the Rapier for Striker/Spirit/Slinger.
- Provisional numbers in A (slow 15% / 1.5 s; Empowered cap 4 s; bleed share).

## Not in scope
Kill chain boss quarters (future-plans, needs boss HP quarter markers). The ability pass
(§22, next). Non-weapon trees. Boss/monster numbers. Recovery.
