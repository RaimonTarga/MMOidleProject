# Boss5 operator packet — execution report

Executed 2026-09-19 against the frozen packet
[`bot-balance-boss5-operator-packet.md`](bot-balance-boss5-operator-packet.md). This report follows
the structure demanded by that packet's §10 ("What the report must separate") and §11 (stop rules).
No gameplay, build, or test-code changes were made during execution. No commits, pushes, or
follow-up experiments were launched from this run's findings. This is read-only analysis of a run
that already happened; no fight was re-run to produce it.

**Preparation, actually run before launch (not predicted):** the packet's uncommitted preparation
work (the Boss4 venom adoption/retirement bookkeeping and the Boss5 wiring) was committed as
`e1a6f321bc17ea2d3d051e33c24ca250ae52fec2` (tree `1b5737857a83170a58f365c9d390f3628b2aeb86`) so the
runner's clean-tree check could pass — it was finished, self-consistent code sitting uncommitted,
not new work authored for this report. `pnpm typecheck`, all 11 named tests, and a 19-block/120-
observation preflight at zero fights spent were re-executed against that commit and reproduced the
packet's own §8 figures exactly, including the definitions hash (`cd8077b4…`, confirmed by direct
read of a live `ready.json.definitionsIdentity`, not by trusting the packet's prose).

**The formal run** (`scripts/boss5-run.mjs`) then executed 120/120 planned observations across 19
child processes, `--revision=e1a6f321…`, `--tree=1b573785…`, `--definitions=cd8077b4…`,
`--hitbox-hash=08bcc556…` — all four matching the packet's frozen identity. Total wall time
188,972 ms (`batch-ended.json`, `2026-09-19T16:17:22.326Z`→`16:20:31.298Z`), bench-clock across 19
sequential child processes, not combat time. `operator-ledger.jsonl`: all 19 blocks
`"code":0,"timedOut":false` — no watchdog was ever approached, let alone tripped.

---

## 0. Identity failures — 4 of 19 blocks preserved without retry

Per the packet's stop rules (§11): *"A block whose identity fails … is preserved without retry, and
the remaining blocks continue."* That is exactly what happened. Four blocks' child processes
completed all 6 cells normally (`code:0`) but their own `assertDeclarationsApplied` verification
step then failed with **"Contradictory boss records"** — a live artifact disagreeing with the
block's declaration that this boss "summons nothing." The run loop did not stop, and no other
block's allocation was consumed.

| Block | Boss | Cells run | `verification.json.verified` |
|---|---|---:|---|
| `t1-plains` | `tusked-razorback` | 6/6 | **false** |
| `t3-swamp` | `rot-spore-croc-behemoth` | 6/6 | **false** |
| `t3-volcanic` | `cinder-shell-magma-salamander` | 6/6 | **false** |
| `t4-volcanic` | `caldera-sovereign` | 6/6 | **false** |

**These are two structurally different failures, not one repeated cause, established by reading
each cell's `damageFromAdds` map and `maxAddsAlive` directly:**

- **`t1-plains` — genuine wandering fauna.** `maxAddsAlive` reads 5–6 in every one of its 6 cells,
  and `damageFromAdds` names ordinary Plains ambient mobs — `plains-slime` and `boar` — not a
  scripted summon. `tusked-razorback` itself has no `spawn-adds`/`raisesDead` script (the roster
  derivation was correct about the *boss*); what the spec's "summons nothing" check did not model
  is that ambient node wildlife can wander into an unguarded arena and get counted as adds anyway.
  This is a roster-derivation gap, not a boss-script contradiction.
- **`t3-swamp`, `t3-volcanic`, `t4-volcanic` — a boss's own hazard object, not a creature.**
  `maxAddsAlive` reads **0 in every one of these 18 cells** — no add was ever alive — yet
  `damageFromAdds` carries nonzero entries keyed like `"Cinder-Shell Magma-Salamander — Magma
  Vent"` and `"Rot-Spore Croc-Behemoth — Spore Pool"` (33–630 damage per cell for the two volcanic
  bosses; one 7-damage instance for swamp, on the `slinger` cell only). These are the boss's own
  charged-ability hazard objects (a vent/pool that deals damage as a separate entity), routed
  through the same attribution channel the verifier reserves for summoned adds. This is an
  attribution-granularity gap in what counts as an "add," not evidence either boss secretly
  summons a creature.

Because their `verification.json.verified` is `false`, **these 4 bosses' outcome rows below are
reported as data (the fights genuinely happened, on the declared reference package, at the frozen
definitions), but are explicitly excluded from any "N verified breadth bosses" count** and are
flagged inline in §3. Of the 18 Block B bosses, **14 are cleanly verified**; `cave-refinement`
(`chitinous-dreadbore`) is verified separately and cleanly. **15 of 19 blocks verified; 4 preserved
as identity failures.**

One further consequence, stated plainly and not overclaimed: `t1-plains`'s wandering adds are a
concrete counter-example to treating "no adds" as `spawn-adds`/`raisesDead`-only, which is the same
property the packet's seed-inertness argument (§6 of the packet) rests on. Whether wandering fauna
make this specific block seed-sensitive was **not tested** — no second seed was run, per the
packet's own stop rule — so this is recorded as an open question about `t1-plains` specifically,
not as a correction to the other 17 blocks' inertness claim.

## 1. Terminal outcome first

All 120 observations resolved to one of exactly three terminal outcomes, read from each cell's own
`index.json.outcome` field directly: **`boss-killed` (62), `bot-died` (56), `capped` (2)**. Zero
`encounter-reset`-as-terminal, `boss-vanished-no-kill`, `simultaneous-terminal`, or `invalid`
outcomes occurred anywhere. **Capped and died are kept distinct** — the 2 `capped` cells
(`t3-tundra`/`conduit` at 600,000 ms, `t4-tundra`/`conduit` at 900,000 ms) are boss survivals at the
tier's own cap, not deaths, and are never folded into the `bot-died` count.

Every one of the 56 `bot-died` cells also carries an `encounterResetEvidence` record (the dungeon
guard-respawn side effect of a wipe) — this is not a distinct terminal category; it is reported
here once so it is not mistaken for one anywhere below.

## 2. Planned / started / terminal / verified counts

| Scope | Planned | Started | Terminal | Block-verified |
|---|---:|---:|---:|---:|
| Block B breadth (18 blocks × 6 cells) | 108 | 108 | 108 | **84** (14 blocks × 6) |
| Block C `cave-refinement` (12 cells) | 12 | 12 | 12 | 12 |
| **Total** | **120** | **120** | **120** | **96** |

Missing observations are not passes, and there are none here — every planned cell started and
reached a terminal outcome. What did not universally pass is **block-level artifact verification**
(§0): 4 of 18 breadth blocks (24 cells) ran to a terminal outcome but failed their own
`assertDeclarationsApplied` check.

## 3. Per boss, per root — outcome, elapsed, boss HP remaining, fraction removed

No `ttk` is extrapolated from any non-kill row below — only the outcome and the HP fraction
actually removed at the terminal tick. Blocks marked **⚠ UNVERIFIED** are §0's 4 identity failures;
their rows are real fight data on the declared package but are not counted as clean breadth
coverage.

### Tier 1 (cap 300 s)

| Boss | Root | Outcome | Elapsed (ms) | Boss HP remaining / max | Fraction removed | Casts started | Cast labels | Max adds alive |
|---|---|---|---:|---|---:|---:|---|---:|
| `obsidian-broodmother` (t1-cave) | striker | bot-died | 39,800 | 424/1750 | 75.8% | 4 | Breach | 0 |
| | squire | bot-died | 45,400 | 420/1750 | 76.0% | 4 | Breach | 0 |
| | apprentice | bot-died | 35,300 | 181/1750 | 89.7% | 3 | Breach | 0 |
| | slinger | bot-died | 32,800 | 618/1750 | 64.7% | 3 | Breach | 0 |
| | conduit | bot-died | 39,200 | 904/1750 | 48.3% | 3 | Breach | 0 |
| | spirit | bot-died | 37,600 | 374/1750 | 78.6% | 3 | Breach | 0 |
| `gnarled-greatbear` (t1-forest) | striker | bot-died | 20,600 | 825/1800 | 54.2% | 3 | Bestial Frenzy | 0 |
| | squire | bot-died | 24,400 | 968/1800 | 46.2% | 4 | Bestial Frenzy | 0 |
| | apprentice | bot-died | 20,300 | 867/1800 | 51.8% | 3 | Bestial Frenzy | 0 |
| | slinger | bot-died | 21,200 | 881/1800 | 51.1% | 3 | Bestial Frenzy | 0 |
| | conduit | bot-died | 28,600 | 656/1800 | 63.6% | 4 | Bestial Frenzy | 0 |
| | spirit | bot-died | 31,500 | 342/1800 | 81.0% | 5 | Bestial Frenzy | 0 |
| `crag-behemoth` (t1-mountain) | striker | **boss-killed** | 66,700 | 0/2100 | 100% | 8 | Crag Charge | 0 |
| | squire | **boss-killed** | 73,600 | 0/2100 | 100% | 8 | Crag Charge | 0 |
| | apprentice | **boss-killed** | 47,600 | 0/2100 | 100% | 5 | Crag Charge | 0 |
| | slinger | **boss-killed** | 52,900 | 0/2100 | 100% | 6 | Crag Charge | 0 |
| | conduit | **boss-killed** | 59,200 | 0/2100 | 100% | 7 | Crag Charge | 0 |
| | spirit | **boss-killed** | 51,600 | 0/2100 | 100% | 6 | Crag Charge | 0 |
| `tusked-razorback` (t1-plains) **⚠ UNVERIFIED** | striker | bot-died | 35,900 | 377/1700 | 77.8% | 5 | Rallying Cry | 6 |
| | squire | bot-died | 49,900 | 363/1700 | 78.6% | 6 | Rallying Cry | 6 |
| | apprentice | bot-died | 38,900 | 485/1700 | 71.5% | 5 | Rallying Cry | 5 |
| | slinger | bot-died | 39,400 | 728/1700 | 57.2% | 5 | Rallying Cry | 6 |
| | conduit | bot-died | 69,100 | 350/1700 | 79.4% | 8 | Rallying Cry | 5 |
| | spirit | bot-died | 48,800 | 524/1700 | 69.2% | 6 | Rallying Cry | 6 |
| `grave-toadeater` (t1-swamp) | striker | bot-died | 35,300 | 835/2100 | 60.2% | 3 | Bile Pool | 0 |
| | squire | bot-died | 38,400 | 974/2100 | 53.6% | 4 | Bile Pool | 0 |
| | apprentice | bot-died | 35,600 | 477/2100 | 77.3% | 4 | Bile Pool | 0 |
| | slinger | **boss-killed** | 47,900 | 0/2100 | 100% | 5 | Bile Pool | 0 |
| | conduit | bot-died | 28,000 | 923/2100 | 56.0% | 2 | Bile Pool | 0 |
| | spirit | bot-died | 30,200 | 825/2100 | 60.7% | 3 | Bile Pool | 0 |

### Tier 3 (cap 600 s)

| Boss | Root | Outcome | Elapsed (ms) | Boss HP remaining / max | Fraction removed | Casts started | Cast labels | Max adds alive |
|---|---|---|---:|---|---:|---:|---|---:|
| `deep-core-burrow-gorger` (t3-cave) | striker | **boss-killed** | 103,600 | 0/12895 | 100% | 36 | Deep Burrow, Burrowed, Deep-Core Eruption | 0 |
| | squire | **boss-killed** | 117,400 | 0/12895 | 100% | 42 | (same) | 0 |
| | apprentice | bot-died | 24,800 | 9548/12895 | 26.0% | 9 | (same) | 0 |
| | slinger | **boss-killed** | 104,500 | 0/12895 | 100% | 36 | (same) | 0 |
| | conduit | bot-died | 500,700 | 5905/12895 | 54.2% | 177 | (same) | 0 |
| | spirit | **boss-killed** | 89,200 | 0/12895 | 100% | 31 | (same) | 0 |
| `dune-carapace-monarch` (t3-desert) | striker | bot-died | 45,200 | 4414/11940 | 63.0% | 15 | Death Sting, Numbing Sting, Execution | 0 |
| | squire | **boss-killed** | 99,300 | 0/11940 | 100% | 37 | (same) | 0 |
| | apprentice | bot-died | 45,200 | 5059/11940 | 57.6% | 15 | (same) | 0 |
| | slinger | bot-died | 45,200 | 5060/11940 | 57.6% | 15 | (same) | 0 |
| | conduit | bot-died | 95,600 | 3633/11940 | 69.6% | 33 | (same) | 0 |
| | spirit | bot-died | 59,600 | 1832/11940 | 84.7% | 21 | (same) | 0 |
| `apex-bramble-slasher` (t3-jungle) | striker | **boss-killed** | 72,700 | 0/11701 | 100% | 10 | Flee, Vanished, Venomous Bite | 0 |
| | squire | **boss-killed** | 105,900 | 0/11701 | 100% | 19 | (same) | 0 |
| | apprentice | bot-died | 42,200 | 5079/11701 | 56.6% | 5 | (same) | 0 |
| | slinger | bot-died | 64,900 | 2901/11701 | 75.2% | 10 | (same) | 0 |
| | conduit | bot-died | 30,000 | 8922/11701 | 23.8% | 4 | (same) | 0 |
| | spirit | bot-died | 39,800 | 4768/11701 | 59.3% | 5 | (same) | 0 |
| `crag-gorged-horn-behemoth` (t3-mountain) | striker | bot-died | 73,800 | 5213/12418 | 58.0% | 12 | Cragbreaker Charge, Cragbreaker | 0 |
| | squire | **boss-killed** | 153,200 | 0/12418 | 100% | 26 | (same) | 0 |
| | apprentice | bot-died | 72,500 | 2302/12418 | 81.5% | 12 | (same) | 0 |
| | slinger | **boss-killed** | 102,000 | 0/12418 | 100% | 18 | (same) | 0 |
| | conduit | **boss-killed** | 555,500 | 0/12418 | 100% | 104 | (same) | 0 |
| | spirit | **boss-killed** | 79,300 | 0/12418 | 100% | 14 | (same) | 0 |
| `rot-spore-croc-behemoth` (t3-swamp) **⚠ UNVERIFIED** | striker | bot-died | 24,200 | 8168/11940 | 31.6% | 2 | Spore Pool | 0 |
| | squire | bot-died | 29,400 | 8788/11940 | 26.4% | 3 | (same) | 0 |
| | apprentice | bot-died | 41,600 | 5282/11940 | 55.8% | 3 | (same) | 0 |
| | slinger | bot-died | 57,800 | 3229/11940 | 73.0% | 6 | (same) | 0 |
| | conduit | bot-died | 37,200 | 8500/11940 | 28.8% | 2 | (same) | 0 |
| | spirit | bot-died | 36,500 | 5209/11940 | 56.4% | 3 | (same) | 0 |
| `frost-plated-rime-mammoth` (t3-tundra) | striker | **boss-killed** | 156,400 | 0/12895 | 100% | 35 | Shatter, Deep Freeze | 0 |
| | squire | **boss-killed** | 195,600 | 0/12895 | 100% | 45 | (same) | 0 |
| | apprentice | **boss-killed** | 97,000 | 0/12895 | 100% | 21 | (same) | 0 |
| | slinger | **boss-killed** | 171,400 | 0/12895 | 100% | 39 | (same) | 0 |
| | conduit | **capped** | 600,000 | 2260/12895 | 82.5% | 139 | (same) | 0 |
| | spirit | **boss-killed** | 165,400 | 0/12895 | 100% | 37 | (same) | 0 |
| `cinder-shell-magma-salamander` (t3-volcanic) **⚠ UNVERIFIED** | striker | bot-died | 18,100 | 7515/11462 | 34.4% | 0 | — | 0 |
| | squire | **boss-killed** | 77,200 | 0/11462 | 100% | 2 | Final Eruption | 0 |
| | apprentice | bot-died | 26,900 | 6815/11462 | 40.5% | 0 | — | 0 |
| | slinger | bot-died | 42,000 | 4062/11462 | 64.6% | 0 | — | 0 |
| | conduit | bot-died | 35,700 | 7701/11462 | 32.8% | 0 | — | 0 |
| | spirit | bot-died | 46,400 | 442/11462 | 96.1% | 2 | Final Eruption | 0 |

### Tier 4 (cap 900 s)

| Boss | Root | Outcome | Elapsed (ms) | Boss HP remaining / max | Fraction removed | Casts started | Cast labels | Max adds alive |
|---|---|---|---:|---|---:|---:|---|---:|
| `dune-throne-sovereign` (t4-desert) | striker | **boss-killed** | 46,000 | 0/17893 | 100% | 17 | Death Sting, Numbing Sting, Execution | 0 |
| | squire | **boss-killed** | 111,500 | 0/17893 | 100% | 41 | (same) | 0 |
| | apprentice | **boss-killed** | 44,100 | 0/17893 | 100% | 16 | (same) | 0 |
| | slinger | **boss-killed** | 59,400 | 0/17893 | 100% | 21 | (same) | 0 |
| | conduit | **boss-killed** | 58,900 | 0/17893 | 100% | 21 | (same) | 0 |
| | spirit | **boss-killed** | 62,500 | 0/17893 | 100% | 23 | (same) | 0 |
| `verdant-crown-predator` (t4-jungle) | striker | **boss-killed** | 37,200 | 0/18352 | 100% | 2 | Flee | 0 |
| | squire | **boss-killed** | 102,600 | 0/18352 | 100% | 7 | Flee, Vanished, Venomous Bite | 0 |
| | apprentice | **boss-killed** | 36,900 | 0/18352 | 100% | 2 | Flee | 0 |
| | slinger | **boss-killed** | 50,600 | 0/18352 | 100% | 2 | Flee | 0 |
| | conduit | bot-died | 47,000 | 3984/18352 | 78.3% | 5 | Flee, Vanished, Venomous Bite | 0 |
| | spirit | **boss-killed** | 53,400 | 0/18352 | 100% | 2 | Flee | 0 |
| `iron-crest-titan` (t4-mountain) | striker | **boss-killed** | 93,100 | 0/19499 | 100% | 17 | Titan Charge, Earthshatter | 0 |
| | squire | **boss-killed** | 172,800 | 0/19499 | 100% | 32 | (same) | 0 |
| | apprentice | **boss-killed** | 50,700 | 0/19499 | 100% | 8 | (same) | 0 |
| | slinger | **boss-killed** | 69,200 | 0/19499 | 100% | 11 | (same) | 0 |
| | conduit | **boss-killed** | 557,500 | 0/19499 | 100% | 105 | (same) | 0 |
| | spirit | **boss-killed** | 79,300 | 0/19499 | 100% | 13 | (same) | 0 |
| `elder-trench-serpent` (t4-trench) | striker | **boss-killed** | 50,100 | 0/21793 | 100% | 17 | Abyssal Bite, Undertow, Constrict, Devour | 0 |
| | squire | **boss-killed** | 151,000 | 0/21793 | 100% | 56 | (same) | 0 |
| | apprentice | **boss-killed** | 42,200 | 0/21793 | 100% | 14 | (same) | 0 |
| | slinger | **boss-killed** | 69,600 | 0/21793 | 100% | 24 | (same) | 0 |
| | conduit | **boss-killed** | 128,200 | 0/21793 | 100% | 48 | (same) | 0 |
| | spirit | **boss-killed** | 79,400 | 0/21793 | 100% | 28 | (same) | 0 |
| `glacial-patriarch` (t4-tundra) | striker | **boss-killed** | 77,900 | 0/22940 | 100% | 15 | Glacial Collapse, Deep Freeze | 0 |
| | squire | **boss-killed** | 214,300 | 0/22940 | 100% | 46 | (same) | 0 |
| | apprentice | **boss-killed** | 63,600 | 0/22940 | 100% | 12 | (same) | 0 |
| | slinger | **boss-killed** | 90,200 | 0/22940 | 100% | 18 | (same) | 0 |
| | conduit | **capped** | 900,000 | 1081/22940 | 95.3% | 204 | (same) | 0 |
| | spirit | **boss-killed** | 103,100 | 0/22940 | 100% | 21 | (same) | 0 |
| `caldera-sovereign` (t4-volcanic) **⚠ UNVERIFIED** | striker | **boss-killed** | 37,300 | 0/20646 | 100% | 1 | Cataclysm | 0 |
| | squire | **boss-killed** | 105,000 | 0/20646 | 100% | 2 | Cataclysm | 0 |
| | apprentice | **boss-killed** | 39,500 | 0/20646 | 100% | 1 | Cataclysm | 0 |
| | slinger | **boss-killed** | 57,200 | 0/20646 | 100% | 2 | Cataclysm | 0 |
| | conduit | bot-died | 59,200 | 5739/20646 | 72.2% | 0 | — | 0 |
| | spirit | bot-died | 49,000 | 2282/20646 | 88.9% | 2 | Cataclysm | 0 |

**Do not sum these into a win rate** (§11). Read per-boss, per-root only.

## 4. Block C — the 104-vs-85 pairing, by root

`chitinous-dreadbore`, both arms treated, 300 s cap. **Neither arm is a control** — 104 is the
Boss4 candidate, 85 is this block's own further step; authored source (139) appears in neither.

| Root | 104 outcome / elapsed / fraction removed | 85 outcome / elapsed / fraction removed | Category |
|---|---|---|---|
| striker | bot-died / 115,400 ms / 79.2% | **boss-killed** / 145,400 ms / 100% | **lower-only-won** |
| squire | **boss-killed** / 69,600 ms / 100% | **boss-killed** / 69,600 ms / 100% | **both-won** |
| apprentice | bot-died / 34,400 ms / 65.7% | **boss-killed** / 51,100 ms / 100% | **lower-only-won** |
| slinger | bot-died / 52,100 ms / 94.2% | **boss-killed** / 53,700 ms / 100% | **lower-only-won** |
| conduit | bot-died / 47,600 ms / 31.7% | bot-died / 52,100 ms / 36.1% | **both-lost** |
| spirit | bot-died / 46,100 ms / 96.4% | **boss-killed** / 48,000 ms / 100% | **lower-only-won** |

**Category totals: both-won 1, lower-only-won 4, upper-only-won 0, both-lost 1.** 85 wins strictly
more than 104 on every root that differs, and no root that wins at 104 loses at 85 (squire is the
only 104 win, and it also wins at 85). Conduit stays a loss at both values but still removes
slightly more boss HP at 85 (36.1% vs 31.7%). This is **6 fights per arm, one seed, one reference
package** — read as a single further coarse step in the direction §8 of the packet already found
credible, not as a fitted or validated optimum.

## 5. The treatment record

Verified programmatically against every one of the 120 `ready.json` files (not sampled):

- **All 108 breadth receipts**: `damageTreatment: []`, `definitionsIdentity.live == base ==
  cd8077b4…`, `treated: false`. Zero exceptions, including the 24 cells belonging to the 4
  identity-failed blocks — their verification failure is about add-damage attribution, not about
  an unwanted install.
- **All 12 `cave-refinement` receipts**: exactly one change each
  (`MONSTER_DATABASE['chitinous-dreadbore'].stats.attack`), `definitionsIdentity.live != base`,
  `treated: true`. `before` reads 139 in every receipt (the authored, untouched value); `after`
  reads 104 or 85 per arm.
- **Zero Cave receipts read a live `bossRuntime.attack` of 139.** Every one of the 12 installed its
  declared absolute value — checked directly, not inferred from the block passing.

## 6. Mechanic exposure per boss

Casts started (summed across the block's cells) and the distinct cast labels observed. **Zero
casts is not zero mechanics** — reported as exposure, not as proof a mechanic is inert.

| Block | Boss | Total casts started (6 or 12 cells) | Cast labels observed | Max adds alive (any cell) |
|---|---|---:|---|---:|
| t1-cave | obsidian-broodmother | 20 | Breach | 0 |
| t1-forest | gnarled-greatbear | 22 | Bestial Frenzy | 0 |
| t1-mountain | crag-behemoth | 40 | Crag Charge | 0 |
| t1-plains ⚠ | tusked-razorback | 35 | Rallying Cry | 6 |
| t1-swamp | grave-toadeater | 21 | Bile Pool | 0 |
| t3-cave | deep-core-burrow-gorger | 331 | Deep Burrow, Burrowed, Deep-Core Eruption | 0 |
| t3-desert | dune-carapace-monarch | 136 | Death Sting, Numbing Sting, Execution | 0 |
| t3-jungle | apex-bramble-slasher | 53 | Flee, Vanished, Venomous Bite | 0 |
| t3-mountain | crag-gorged-horn-behemoth | 186 | Cragbreaker Charge, Cragbreaker | 0 |
| t3-swamp ⚠ | rot-spore-croc-behemoth | 19 | Spore Pool | 0 |
| t3-tundra | frost-plated-rime-mammoth | 316 | Shatter, Deep Freeze | 0 |
| t3-volcanic ⚠ | cinder-shell-magma-salamander | **4** | Final Eruption | 0 |
| t4-desert | dune-throne-sovereign | 139 | Death Sting, Numbing Sting, Execution | 0 |
| t4-jungle | verdant-crown-predator | 20 | Flee, Vanished, Venomous Bite | 0 |
| t4-mountain | iron-crest-titan | 186 | Titan Charge, Earthshatter | 0 |
| t4-trench | elder-trench-serpent | 187 | Abyssal Bite, Undertow, Constrict, Devour | 0 |
| t4-tundra | glacial-patriarch | 316 | Glacial Collapse, Deep Freeze | 0 |
| t4-volcanic ⚠ | caldera-sovereign | 8 | Cataclysm | 0 |
| cave-refinement | chitinous-dreadbore | 263 (12 cells) | Burrow, Burrowed, Eruption | 0 |

`cinder-shell-magma-salamander` (t3-volcanic) is worth flagging specifically: 4 of its 6 cells
(`striker`, `apprentice`, `slinger`, `conduit`) show **0 casts started** — those references died
before triggering any named ability, only `squire`/`spirit` (both kills or near-kills) saw `Final
Eruption`. Per the caution above, this is reported as an exposure gap on this package, not read as
evidence the boss has no mechanics.

## 7. The seed limitation, stated plainly

The packet's own measurement holds: none of the 18 breadth bosses has a `spawn-adds` species or
`raisesDead` in `bossScript`, so the declared seed (`99011`) is inert to each boss's own scripted
behavior, and every breadth row here is **one deterministic case, not a sample**. §0 adds a
narrower qualification to this, not a correction of it: `t1-plains`'s wandering ambient fauna
(`plains-slime`, `boar`) are a mechanism outside the boss's own script that the inertness argument
did not account for, and whether that specific block would vary with a different seed was not
tested (no second seed was run, per stop rules). The other 17 blocks' inertness argument is
untouched by this.

## 8. The kit caveat, stated plainly

Block B's package is the **Mountain** family, fixed within each tier (`mountain-vest-t1` /
`mountain-charm-t1` / `mountain-boots-t1` at T1; the T3 set plus `core-tempered` at T3; the T4 set
plus `core-tempered` and `relic-colossus-heart` at T4), with T1 additionally dropping the technique
slot entirely (`[]`) because `second-wind + brace + any technique` is illegal at T1's 22 RP budget.
**This is not the Boss1–Boss4 kit.** These rows are readable against one another within and across
tiers in this report, and are **not** presented as a continuation of the T2 rows, and no portable-
kit comparison is drawn between them.

## 9. Guardian/access — not measured

`guardianAccess: "not-measured-guard-stripped"` on every one of the 120 `ready.json` records
(spot-checked across breadth, identity-failed, and cave-refinement cells; the guard is stripped by
design for every block). Never pooled into any outcome figure in this report.

## 10. Reference, never corroboration

Every one of the 120 rows in §3/§4 is a first observation. None of the 18 Block B bosses, and
neither of Block C's two arms, has prior Boss1–Boss4 evidence to corroborate — `cave-refinement`'s
own prior data point is the Boss4 `104` candidate itself (1/6, reused here as the Boss4 reference,
not re-run as a fresh control), and its `85` arm has no history at all.

## 11. Do not pool

No combined win rate is computed anywhere in this report — not across the 18 Block B bosses, not
across tiers, not across Block C's two arms, and not between Block B and Block C. §3's tables are
read one boss, one root at a time; §4's table is read one root at a time within Block C only.

---

## Summary, without pooling

**14 of 18 Block B bosses verified cleanly** (`t1-cave`, `t1-forest`, `t1-mountain`, `t1-swamp`,
`t3-cave`, `t3-desert`, `t3-jungle`, `t3-mountain`, `t3-tundra`, `t4-desert`, `t4-jungle`,
`t4-mountain`, `t4-trench`, `t4-tundra`); **4 preserved as identity failures**
(`t1-plains`, `t3-swamp`, `t3-volcanic`, `t4-volcanic` — §0). `cave-refinement` verified cleanly,
both arms. Every roster boss now has at least one first-contact observation on a tier-legal
reference package except the 4 identity-failed ones, whose fight data exists but is not certified.

**Block C**: 85 strictly dominates 104 on every root that differs (4 flips to `boss-killed`, 0
reverse flips, 1 root — squire — already won at 104 and still wins at 85, 1 root — conduit — loses
at both but removes slightly more boss HP at 85). Read against the packet's own §12 framing
("prefer 85 if it gives credible broader clears with meaningful mechanics"): this result is
consistent with preferring 85, on this one seed and this one reference package — stated as a
reference finding for whoever makes that call next, not as an adoption recommendation, which this
report does not make.

**No further Boss5 fights, permutation grid, or roster-tuning discussion is proposed here.** Per
the packet's §12, the next authorized artifact is the missing-tier boss readiness map — a
roster-level retain/change/open table, at most three gross interventions at a time — plus, as a
narrower prerequisite this run surfaced, a decision on whether `t1-plains`'s ambient-wildlife
leak-in and the volcanic-family Magma-Vent/Spore-Pool attribution gap need a roster-derivation fix
before either boss can be re-screened cleanly.
