# Boss4 operator packet — execution report

> **READ [`bot-balance-boss4-addendum.md`](bot-balance-boss4-addendum.md) WITH THIS FILE.**
> Five prose claims below are corrected there — the Cave apprentice 50% crossing in §12, the
> Eruption-multiplier inference in §10 (**withdrawn**), the shred-only explanation of `hpDamage`
> variance in §10, the "1/18" Cave observation total in §5 (it is **24**), and the recurrence
> claim about the Conduit accounting gap in §11. The tables, counts, verification and treatment
> records in this report stand unchanged, and no fight was re-run.
>
> The Swamp candidate has since been **ADOPTED into source** and its block retired.

Executed 2026-09-19 against the frozen packet
[`bot-balance-boss4-operator-packet.md`](bot-balance-boss4-operator-packet.md). This report
follows the structure demanded by that packet's §9 ("What the report must separate") and §10
("Endpoint and reading rules"). No gameplay, build, or test-code changes were made. No commits,
pushes, or follow-up experiments were launched. This is read-only analysis of a run that already
happened; no fight was re-run to produce it.

**Revision executed:** `9040902d2af27e5e8a8a36795e649c2119220d4a` (tree
`b1971cde6663338bb7707eba379c38f8bd960ff5`). The packet's own "Frozen at" pin is
`a10ed1531d30ff5fd27c369ea326ebebb22cc6a0` (tree `a873f7061715abc9e0b2704f755cdb990e59b933`);
the executed HEAD is one commit ahead of it. `git diff --stat` between the two commits shows
exactly one file changed — `docs/briefs/bot-balance-boss4-operator-packet.md`, `1 file changed,
1 insertion(+)` — i.e. the single intervening commit (`9040902d docs(balance): record the
committed tip the Boss4 packet was frozen at`) only edited the packet document itself. No source,
test, or script file differs between the freeze point and the executed revision, so this is the
same source the packet froze, and both the manifest's and every `ready.json`'s own re-hash confirm
it (§6 below).

**Qualification (all executed, not predicted):**
- `pnpm typecheck` (including `typecheck:bench`): clean.
- All 8 named tests passed: `boss4Matrix: ok`, `boss4Pressure: ok`, `boss3Matrix: ok`,
  `boss3Cleanse: ok`, `boss2Matrix: ok`, `boss1Matrix: ok`, `bossDeclaration: ok`,
  `bossTerminal: ok` — reproducing the packet's §6.1 list exactly.
- Preflight reproduced all 15 lines of the packet's §6.4 receipt block exactly (12 per-root
  qualify lines + 2 block "qualify ok" lines + 1 closing "boss4 preflight: ok" line), against a
  fresh preflight root, zero fights spent.
- The formal run (`scripts/boss4-run.mjs`) then executed 24/24 fights across two child processes.
  `batch-ended.json`: `artifactVerified: true` for both `swamp-pressure` and `cave-pressure`.
  Each block's own `verification.json` agrees (`"verified": true`). `operator-ledger.jsonl`: both
  blocks `"code":0,"timedOut":false` — swamp 5.573 s wall (14:56:38.572Z→14:56:44.145Z), cave
  5.458 s wall (14:56:44.174Z→14:56:49.632Z), both far under the 40-minute per-block watchdog.
  Total batch wall time 11,091 ms (`batch-ended.json`), bench-clock, not combat time. No
  `stopped-<block>.json` was written.

---

## 1. Terminal outcome first

All 24 observations resolved to one of exactly two terminal outcomes — `boss-killed` or
`bot-died` — confirmed by reading each cell's own `summary.json.outcome` field directly (not
inferred from the aggregate counts). **Zero** `capped`, `encounter-reset`-as-terminal,
`boss-vanished-no-kill`, `simultaneous-terminal`, or `invalid` outcomes occurred in either block;
`verification.json`'s own per-arm tallies (`capped:0, reset:0, vanished:0, ambiguous:0,
invalid:0` for every arm in both blocks) agree with the per-cell field-by-field read.

Every `bot-died` cell also carries an `encounterResetEvidence` record (`"message":"The guard
reforms."`) — this is the dungeon's guard-respawn side effect of a wipe, not a distinct terminal
category; the packet's own outcome taxonomy still classifies these fights as `bot-died`, and this
report follows that classification rather than double-counting a reset.

- **swamp-pressure**: current (control) 2 killed / 4 died; reduced-venom (candidate) 4 killed /
  2 died.
- **cave-pressure**: current (control) 0 killed / 6 died; reduced-attack (candidate) 1 killed /
  5 died.

## 2. Planned / started / terminal / verified counts, one row per observation

| Block | Planned | Started (cells in manifest) | Terminal (summary.json written) | Verified |
|---|---:|---:|---:|---:|
| swamp-pressure | 12 | 12 | 12 | yes (`verification.json.verified:true`, `complete.json` 12/12 expected 12) |
| cave-pressure | 12 | 12 | 12 | yes (`verification.json.verified:true`, `complete.json` 12/12 expected 12) |
| **Total** | **24** | **24** | **24** | **24/24** |

Per-observation table (all 24, terminal outcome, elapsed time, boss HP fraction removed on
non-kills, `crossedHalfAtMs`):

### swamp-pressure

| Root | Arm | Outcome | Elapsed | Boss HP remaining | Fraction removed | crossedHalfAtMs |
|---|---|---|---:|---:|---:|---:|
| striker | current | bot-died | 44,600 ms | 1500 / 3375 | 55.56% | 41,300 |
| striker | reduced-venom | bot-died | 53,500 ms | 1257 / 3375 | 62.76% | 41,300 |
| squire | current | bot-died | 40,000 ms | 669 / 3375 | 80.18% | 26,800 |
| squire | reduced-venom | **boss-killed** | 50,000 ms | 0 | 100% | 26,800 |
| apprentice | current | bot-died | 32,400 ms | 595 / 3375 | 82.37% | 20,900 |
| apprentice | reduced-venom | **boss-killed** | 39,100 ms | 0 | 100% | 20,900 |
| slinger | current | **boss-killed** | 35,200 ms | 0 | 100% | 15,500 |
| slinger | reduced-venom | **boss-killed** | 35,200 ms | 0 | 100% | 15,500 |
| conduit | current | bot-died | 31,300 ms | 1545 / 3375 | 54.22% | 28,700 |
| conduit | reduced-venom | bot-died | 40,300 ms | 1055 / 3375 | 68.74% | 28,700 |
| spirit | current | **boss-killed** | 29,600 ms | 0 | 100% | 17,000 |
| spirit | reduced-venom | **boss-killed** | 29,600 ms | 0 | 100% | 17,000 |

### cave-pressure

| Root | Arm | Outcome | Elapsed | Boss HP remaining | Fraction removed | crossedHalfAtMs |
|---|---|---|---:|---:|---:|---:|
| striker | current | bot-died | 43,400 ms | 3134 / 4375 | 28.37% | null (never crossed) |
| striker | reduced-attack | bot-died | 115,400 ms | 911 / 4375 | 79.18% | 73,400 |
| squire | current | bot-died | 34,400 ms | 2330 / 4375 | 46.74% | null (never crossed) |
| squire | reduced-attack | **boss-killed** | 69,600 ms | 0 | 100% | 36,100 |
| apprentice | current | bot-died | 20,000 ms | 2752 / 4375 | 37.10% | null (never crossed) |
| apprentice | reduced-attack | bot-died | 34,400 ms | 1500 / 4375 | 65.71% | 26,500 |
| slinger | current | bot-died | 34,200 ms | 1453 / 4375 | 66.79% | 26,700 |
| slinger | reduced-attack | bot-died | 52,100 ms | 253 / 4375 | 94.22% | 26,700 |
| conduit | current | bot-died | 37,900 ms | 3344 / 4375 | 23.57% | null (never crossed) |
| conduit | reduced-attack | bot-died | 47,600 ms | 2986 / 4375 | 31.75% | null (never crossed) |
| spirit | current | bot-died | 38,200 ms | 988 / 4375 | 77.42% | 25,200 |
| spirit | reduced-attack | bot-died | 46,100 ms | 157 / 4375 | 96.41% | 25,200 |

No `ttk` is extrapolated for any non-kill row above — only the outcome and the HP fraction
actually removed at the terminal tick are reported, per the packet's stop rule and §9 item 5/14.

## 3. The paired readout (from `verification.json`, not composed by hand)

### swamp-pressure — `mire-gorged-behemoth`

`perArm`: current — wins 2, deaths 4; reduced-venom — wins 4, deaths 2 (both arms: capped 0,
reset 0, vanished 0, ambiguous 0, invalid 0).

| Root | Control | Candidate | Category |
|---|---|---|---|
| striker | bot-died | bot-died | **both-lost** |
| squire | bot-died | boss-killed | **candidate-only-won** |
| apprentice | bot-died | boss-killed | **candidate-only-won** |
| slinger | boss-killed | boss-killed | **both-won** |
| conduit | bot-died | bot-died | **both-lost** |
| spirit | boss-killed | boss-killed | **both-won** |

Category totals: **both-won: 2, candidate-only-won: 2, control-only-won: 0, both-lost: 2.**

### cave-pressure — `chitinous-dreadbore`

`perArm`: current — wins 0, deaths 6; reduced-attack — wins 1, deaths 5 (both arms: capped 0,
reset 0, vanished 0, ambiguous 0, invalid 0).

| Root | Control | Candidate | Category |
|---|---|---|---|
| striker | bot-died | bot-died | **both-lost** |
| squire | bot-died | boss-killed | **candidate-only-won** |
| apprentice | bot-died | bot-died | **both-lost** |
| slinger | bot-died | bot-died | **both-lost** |
| conduit | bot-died | bot-died | **both-lost** |
| spirit | bot-died | bot-died | **both-lost** |

Category totals: **both-won: 0, candidate-only-won: 1, control-only-won: 0, both-lost: 5.**

The two bosses are **not pooled**. Swamp's 2/6 and Cave's 1/6 flips are reported separately, as
two independent single-seed screens on different boss mechanics.

## 4. Control-versus-Boss3 reproduction (per cell, against the CORRECT historical arm)

Per the packet's §5 pairing rule: swamp-current must be compared only to Boss3
`cleanse-substitution`; cave-current must be compared only to Boss3 `portable-reference`. Both
comparisons use the elapsed time and boss-HP-remaining figures from
[`bot-balance-boss3-report.md`](bot-balance-boss3-report.md) §4.1/§4.2.

### swamp-current vs. Boss3 `cleanse-substitution`

| Root | Boss3 substitution elapsed / outcome / fraction removed | Boss4 swamp-current elapsed / outcome / fraction removed | Match |
|---|---|---|---|
| striker | 44,600 ms / bot-died / 55.6% | 44,600 ms / bot-died / 55.56% | **exact** |
| squire | 40,000 ms / bot-died / 80.2% | 40,000 ms / bot-died / 80.18% | **exact** |
| apprentice | 32,400 ms / bot-died / 82.4% | 32,400 ms / bot-died / 82.37% | **exact** |
| slinger | 35,200 ms / boss-killed / 100% | 35,200 ms / boss-killed / 100% | **exact** |
| conduit | 31,300 ms / bot-died / 54.2% | 31,300 ms / bot-died / 54.22% | **exact** |
| spirit | 29,600 ms / boss-killed / 100% | 29,600 ms / boss-killed / 100% | **exact** |

All 6 cells reproduce Boss3's `cleanse-substitution` arm exactly (elapsed time to the millisecond,
outcome, and boss HP fraction removed to within reported-decimal rounding).

### cave-current vs. Boss3 `portable-reference`

| Root | Boss3 baseline elapsed / outcome / fraction removed | Boss4 cave-current elapsed / outcome / fraction removed | Match |
|---|---|---|---|
| striker | 43,400 ms / bot-died / 28.4% | 43,400 ms / bot-died / 28.37% | **exact** |
| squire | 34,400 ms / bot-died / 46.7% | 34,400 ms / bot-died / 46.74% | **exact** |
| apprentice | 20,000 ms / bot-died / 37.1% | 20,000 ms / bot-died / 37.10% | **exact** |
| slinger | 34,200 ms / bot-died / 66.8% | 34,200 ms / bot-died / 66.79% | **exact** |
| conduit | 37,900 ms / bot-died / 23.6% | 37,900 ms / bot-died / 23.57% | **exact** |
| spirit | 38,200 ms / bot-died / 77.4% | 38,200 ms / bot-died / 77.42% | **exact** |

All 6 cells reproduce Boss3's `portable-reference` arm exactly.

**Finding: full reproducibility, no divergence in either block.** This is a reproducibility check
on the same seed/package/unchanged-base-sim, not new independent coverage, and is not pooled with
Boss3's own figures or counted as an additional replicate. Had any cell diverged, it would be
reported as a reproducibility finding in its own right (per the packet's explicit instruction);
none did.

## 5. Remaining boss HP / fraction removed (non-kills) and actual clear duration (wins)

Already tabulated per-cell in §2 above. Restated as the packet asks — near-clears and half-clears
kept distinct, and no non-kill row's elapsed time is treated as a time-to-victory:

**Swamp non-kills** (fraction removed, ascending): conduit-current 54.22%, striker-current
55.56%, striker-reduced-venom 62.76%, conduit-reduced-venom 68.74%, squire-current 80.18%,
apprentice-current 82.37%. All four cells that stay losses under the candidate (striker×2,
conduit×2) removed strictly more boss HP and survived strictly longer than their control pair —
striker +19.9% elapsed / +7.2 points of fraction removed; conduit +28.8% elapsed / +14.5 points.

**Swamp wins** (actual clear duration, i.e. `ttkMs` from `summary.json.targets[0].ttkMs`, distinct
from `elapsedMs` which includes a small pre-engage window): slinger both arms 34,300 ms; spirit
both arms 28,800 ms; squire-reduced-venom 48,600 ms; apprentice-reduced-venom 38,000 ms. Slinger
and spirit's clear durations are **identical to the millisecond** across both arms (see §9 below).

**Cave non-kills** (fraction removed, ascending): conduit-current 23.57%, conduit-reduced-attack
31.75%, striker-current 28.37%, apprentice-current 37.10%, squire-current 46.74%,
apprentice-reduced-attack 65.71%, slinger-current 66.79%, spirit-current 77.42%,
striker-reduced-attack 79.18%, slinger-reduced-attack 94.22%, spirit-reduced-attack 96.41%. Every
one of the 5 cave roots that stay a loss under the candidate removed more boss HP and survived
longer than its control pair (see §10 below for per-root deltas) — a uniform direction, but none
crossed into a kill within the 300,000 ms cap.

**Cave wins**: squire-reduced-attack only, `ttkMs` 68,100 ms (`elapsedMs` 69,600 ms). This is the
only kill recorded on Chitinous Dreadbore across all 24 Boss4 fights (Boss3+Boss4 combined on this
boss remain 1/18 total observations against it, not pooled here as a rate — reported as the raw
count of kills observed).

## 6. The treatment record (before/after fields, runtime readback, live definitions hash)

Verified per-cell against every one of the 24 `ready.json` files (not sampled), and cross-checked
against `manifest.json`'s `blockDetail`:

| Block | Field | Before | After | Control `bossRuntime` readback | Candidate `bossRuntime` readback |
|---|---|---:|---:|---|---|
| swamp-pressure | `MONSTER_DATABASE['mire-gorged-behemoth'].dotEffect.damagePerStack` | 9 | 6 | `dotDamagePerStack: 9` (6/6 control cells) | `dotDamagePerStack: 6` (6/6 candidate cells) |
| cave-pressure | `MONSTER_DATABASE['chitinous-dreadbore'].stats.attack` | 139 | 104 | `attack: 139` (6/6 control cells) | `attack: 104` (6/6 candidate cells) |

`definitionsIdentity` on every one of the 24 receipts: `base` is
`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f` on all 24 (matches the
packet's frozen base hash exactly). Split of `live`:

- Every control cell (12/12 across both blocks): `live == base` (`treated:false`, `damageTreatment:[]`).
- Every swamp candidate cell (6/6): `live = cd8077b49ce658c2467ba20e692c01c354003b1782ff2f0a8027876895a32f9a`
  (`treated:true`, `damageTreatment` has exactly 1 entry) — matches the packet's §6.4 recorded
  swamp candidate hash exactly.
- Every cave candidate cell (6/6): `live = 4af6e4f23d4a7fe1b79116c7665fd6831ce38e56fcbc4787639a7e8be23ce33a`
  (`treated:true`, `damageTreatment` has exactly 1 entry) — matches the packet's §6.4 recorded cave
  candidate hash exactly.

`hpTreatment: []` on all 24 receipts — an empty `hpTreatment` is not treated as evidence of "no
treatment installed"; the damage-treatment fields above are the load-bearing record. All other
boss fields held fixed per receipt: swamp `maxHp:3375, attack:38, plating:6, dr:0.08` unchanged
across both arms; cave `maxHp:4375, plating:12, dr:0.12` unchanged across both arms (only
`attack` moves, as declared).

`guardianAccess: "not-measured-guard-stripped"` on all 24 `ready.json` records and both block
`manifest.json` files (see §13).

**Base identity / hitbox confirmation.** Both block `manifest.json` files carry
`definitionsHash: "17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f"` and
`hitboxesSha256: "08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"` — both match
the packet's §3 frozen values exactly. `batch-manifest.json` records
`"revision": "9040902d2af27e5e8a8a36795e649c2119220d4a"` and
`"tree": "b1971cde6663338bb7707eba379c38f8bd960ff5"`, consistent with the header above.

## 7. Starting stats, player min/terminal HP, recording interval and age

Per the packet's own instruction (citing Boss3 §11 C3, which is not re-litigated here): three
distinct readings exist and are kept distinct.

| Reading | Cadence | What it is |
|---|---|---|
| `minHpFraction` (`summary.json`) | every 100 ms tick | minimum ever observed by the runner's internal loop |
| `samples.jsonl` HP series | every 1000 ms | the recorded series, up to 1 s stale relative to the 100 ms loop |
| terminal HP | at the terminal tick | the value at the outcome (0 on any death, by construction of a death tick) |

Two illustrations, one per damage profile, both drawn from this run's own data:

- **Swamp (gradual DoT death)** — `boss4-swamp-pressure-current-squire`: `samples.jsonl` reads
  hp 41.99/300 (14.0%) at 38,000 ms, hp 6.89/300 (2.3%) at 39,000 ms, hp 0/300 at 40,000 ms
  (death). Because this fight's death lands on a whole-second boundary, the 1000 ms series here
  tracks the terminal drop closely — the reported `minHpFraction` is 0, matching the terminal
  sample. This is a per-fight property of where the death timestamp falls relative to the 1000 ms
  grid, not a general property of DoT deaths (Boss3 §11 C3 withdrew exactly that generalization,
  and this report does not restate it).
- **Cave (sudden burst death)** — `boss4-cave-pressure-current-slinger`: `samples.jsonl` reads hp
  117.536/239 (49.2%) at both 33,000 ms and 34,000 ms (200 ms before the 34,200 ms death), then
  the fight ends with `minHpFraction: 0` in `summary.json`. A positive, large (49.2%) sampled
  reading coexists with death 200 ms later — the 1000 ms series does not resolve this lethal hit.
  This is the same cell/root/seed as Boss3's `portable-reference-slinger` illustration (§6 of that
  report), reproduced here identically as expected given the exact control replay in §4.

## 8. Guard activity, normalized by time alive

Raw ability-activation counts (`abilityId`/`slot:"guard"`) were extracted directly from each
cell's `events.jsonl`, cross-checked against `verification.json`'s per-cell `guardActivations`
count (swamp) and against the `channelEvidence.guardActivations` figures (cave; that field counts
all guard activations, i.e. Second Wind + Brace combined, not Cleanse-specific).

### Swamp — Cleanse (10 s cooldown) and Second Wind, per-10s-alive rate

| Root | Arm | Cleanse count | First cast | Elapsed | Cleanse per 10 s alive |
|---|---|---:|---:|---:|---:|
| striker | current | 5 | 1,300 ms | 44,600 ms | 1.12 |
| striker | reduced-venom | 6 | 1,300 ms | 53,500 ms | 1.12 |
| squire | current | 4 | 1,500 ms | 40,000 ms | 1.00 |
| squire | reduced-venom | 5 | 1,500 ms | 50,000 ms | 1.00 |
| apprentice | current | 3 | 6,200 ms | 32,400 ms | 0.93 |
| apprentice | reduced-venom | 4 | 6,200 ms | 39,100 ms | 1.02 |
| slinger | current | 3 | 6,700 ms | 35,200 ms | 0.85 |
| slinger | reduced-venom | 3 | 6,700 ms | 35,200 ms | 0.85 |
| conduit | current | 3 | 6,500 ms | 31,300 ms | 0.96 |
| conduit | reduced-venom | 4 | 6,500 ms | 40,300 ms | 0.99 |
| spirit | current | 3 | 6,900 ms | 29,600 ms | 1.01 |
| spirit | reduced-venom | 3 | 6,900 ms | 29,600 ms | 1.01 |

Normalized, Cleanse fires at essentially the same rate (~0.85–1.12 per 10 s alive) in both arms
for every root — the higher raw counts on longer candidate fights (striker 5→6, squire 4→5,
apprentice 3→4, conduit 3→4) track added survival time on cooldown, not a change in usage
efficiency. **Striker and squire's first cast fires 1,300–1,500 ms in, roughly 5 s before the
other four roots (6,200–6,900 ms), in both arms** — the same divergence Boss3 §5.2/§11-C4
recorded and explicitly declined to explain or generalize; it recurs here unchanged and remains
unexplained, per that report's instruction not to derive a universal timing prediction from it.

Every Cleanse activation across all 46 casts in this block (both arms) carried a non-empty
`removedEffects` record — 0 empty-removal activations, confirmed by direct scan of every
`events.jsonl` file in the block (not sampled).

### Cave — Second Wind and Brace (10 s cooldown), per-10s-alive rate

| Root | Arm | Second Wind count | Brace count | First Brace | Elapsed | Brace per 10 s alive |
|---|---|---:|---:|---:|---:|---:|
| striker | current | 3 | 3 | 20,100 ms | 43,400 ms | 0.69 |
| striker | reduced-attack | 8 | 10 | 20,200 ms | 115,400 ms | 0.87 |
| squire | current | 2 | 2 | 20,100 ms | 34,400 ms | 0.58 |
| squire | reduced-attack | 5 | 5 | 20,200 ms | 69,600 ms | 0.72 |
| apprentice | current | 2 | 1 | 16,400 ms | 20,000 ms | 0.50 |
| apprentice | reduced-attack | 2 | 2 | 20,100 ms | 34,400 ms | 0.58 |
| slinger | current | 2 | 2 | 16,200 ms | 34,200 ms | 0.58 |
| slinger | reduced-attack | 3 | 3 | 25,200 ms | 52,100 ms | 0.58 |
| conduit | current | 2 | 2 | 25,100 ms | 37,900 ms | 0.53 |
| conduit | reduced-attack | 2 | 3 | 25,200 ms | 47,600 ms | 0.63 |
| spirit | current | 1 | 1 | 34,100 ms | 38,200 ms | 0.26 |
| spirit | reduced-attack | 2 | 2 | 34,200 ms | 46,100 ms | 0.43 |

Normalized rates cluster tightly (0.26–0.87 per 10 s), and every fight is consistent with Brace
firing on cooldown throughout — e.g. striker-reduced-attack's raw count of 10 over a 115.4 s fight
is exactly what a 10 s cooldown starting at 20.2 s produces, not evidence of unusually heavy
Brace usage. The large raw-count gap between control (1–3 Brace activations) and candidate
(1–10) is a direct consequence of the candidate fights running longer, not a difference in
per-use behavior; every fight's Brace activation applied its DR window (Boss3's finding, and
this dataset shows no evidence to the contrary — Brace carries no removal record to check
emptiness against, unlike Cleanse).

## 9. Swamp specifically — venom evidence, Boss3 winners' survival, remaining references' progress

**Venom tick and removal evidence** (from `verification.json.channelEvidence`, cross-checked
against `events.jsonl` `damageType:"dot"` events targeting the player):

| Root | Arm | DoT ticks | DoT damage (hpDamage+absorbed) | Stacks removed (Cleanse) |
|---|---|---:|---:|---:|
| striker | current | 37 | 521 | 9 |
| striker | reduced-venom | 46 | 516 | 11 |
| squire | current | 33 | 583 | 7 |
| squire | reduced-venom | 43 | 533 | 9 |
| apprentice | current | 22 | 294 | 5 |
| apprentice | reduced-venom | 28 | 272 | 7 |
| slinger | current | 23 | 298 | 5 |
| slinger | reduced-venom | 23 | 208 | 5 |
| conduit | current | 21 | 297 | 5 |
| conduit | reduced-venom | 30 | 342 | 7 |
| spirit | current | 18 | 296 | 5 |
| spirit | reduced-venom | 18 | 202 | 5 |

("DoT damage" here = `hpDamage + absorbed` per tick, confirmed by direct reconciliation against
`events.jsonl`: e.g. striker-current's 37 ticks sum to 475 hpDamage + 46 absorbed = 521, matching
`channelEvidence.dotDamage` exactly — this is total landed-or-absorbed damage, not raw
pre-mitigation coefficient output.)

**The two Boss3 Swamp winners (slinger, spirit — confirmed from `bot-balance-boss3-report.md`
§4.1, "substitution-only-won") both still win under the reduced-venom candidate.** Both are
`both-won` pairs (§3), with **identical elapsed time and `ttkMs` to the millisecond** in both
arms (slinger 35,200 ms/34,300 ms clear both arms; spirit 29,600 ms/28,800 ms clear both arms) —
the candidate changed neither root's terminal outcome nor duration. It did materially change
their safety margin: slinger's `minHpFraction` rose from 0.0146 (control) to 0.2938 (candidate);
spirit's rose from 0.1042 to 0.5111. Per §9's caution against reading identical endpoints as zero
intermediate effect, this is reported as a measured margin change with no terminal-outcome
change, not as "no effect."

**Squire and apprentice flip from `bot-died` to `boss-killed` under the candidate** — two
additional wins beyond what Boss3's Cleanse-alone substitution produced. Their terminal cause
changes from `kind:"dot", effectName:"Gorged Venom"` (both, at 4 stacks) under control to
`bossKillEvidence` (a player kill) under candidate.

**The two references that remain losses under the candidate (striker, conduit) both survive
longer and remove more boss HP than their control pair:**

| Root | Control elapsed / fraction removed | Candidate elapsed / fraction removed | Elapsed delta | Fraction-removed delta |
|---|---|---|---:|---:|
| striker | 44,600 ms / 55.56% | 53,500 ms / 62.76% | +19.9% | +7.2 pts |
| conduit | 31,300 ms / 54.22% | 40,300 ms / 68.74% | +28.8% | +14.5 pts |

Striker's terminal cause is `kind:"melee"` (12 damage) in **both** arms, not DoT — this is
unchanged from Boss3, where striker was already the one exception under Cleanse substitution
(Boss4's swamp-current control cell **is** a replay of that Boss3 substitution arm, so the same
exception necessarily carries forward). Conduit's terminal cause stays `kind:"dot"` (Gorged
Venom) in both arms.

## 10. Cave specifically — ordinary/pattern hit evidence, Brace state, phase, clearability

**Ordinary vs. pattern (Eruption) hit magnitude.** A direct scan of every `damage` event
targeting a player across all 12 Cave cells found only two non-trivial `mitigation.grossDamage`
values landing on players: **139** (every control cell) and **104** (every candidate cell) — plus
small residual values (1–4) attributable to summon/minion chip damage on the Conduit cells. This
includes the events that coincide with an `Eruption` `monster-cast-end` and are tagged
`abilityName:"Eruption"` in `playerDeathEvidence` (e.g. squire-current's fatal hit at 34,400 ms:
`gross:139, hpDamage:110.75`) — consistent with the packet's own §4.2 pin that "the Eruption step
multiplier" is **1.0**, i.e. Eruption's hit is the same base-attack magnitude as an ordinary
swing; the packet's separate `dreadbore-emergence` multiplier is 1.6, but **no event in this
dataset shows a `grossDamage` consistent with that multiplier having landed on a player**
(~222 for control, ~166 for candidate). This is reported as an absence in this run's raw event
log, not as proof that `dreadbore-emergence` never fires — per the packet's own caution that
"zero casts does not mean zero mechanics," an unobserved high-multiplier hit in 12 fights is not
evidence the mechanic is inert, only that it did not land on a player in any of these particular
fights (all 12 use the same seed/positioning-rune package, so this is one data point on
positioning, not twelve independent ones).

Variance in `hpDamage` for otherwise-identical `grossDamage` hits (e.g. squire-current's 8 hits,
all `gross:139`, ranging `hpDamage` 0–110.75) is explained by accumulating plating-shred stacks
over the fight (`empower-shred` and the base 2/stack-to-6 shred, both held fixed per the packet),
not by a bigger raw hit.

**Brace state.** See §8 for counts/timing; every activation observed applies a DR window (no
evidence to the contrary in this dataset — Brace carries no removal record, unlike Cleanse, so
"empty activation" is not a defined concept for it here).

**Phase reached / clearability.** `crossedHalfAtMs` and `castsStarted`/`castLabels` per cell are
in §2's table and §12 below. Every Cave fight in both arms reaches at least one `Eruption` cast
(`castLabels` always includes `"Burrow","Burrowed","Eruption"`); cast counts scale with fight
length, not with arm (e.g. striker-reduced-attack's 115.4 s fight reaches 39 `castsStarted`/25
fired, dwarfing any other cell — a direct consequence of surviving nearly 3x longer, not of the
candidate changing cast frequency).

**Every one of the 5 Cave roots that remains a loss under the candidate survives longer and
removes more boss HP than its control pair** — the same uniform direction Swamp shows, but with
zero flips beyond squire:

| Root | Control elapsed / fraction removed | Candidate elapsed / fraction removed | Elapsed delta | Fraction-removed delta |
|---|---|---|---:|---:|
| striker | 43,400 ms / 28.37% | 115,400 ms / 79.18% | +165.9% | +50.8 pts |
| apprentice | 20,000 ms / 37.10% | 34,400 ms / 65.71% | +72.0% | +28.6 pts |
| slinger | 34,200 ms / 66.79% | 52,100 ms / 94.22% | +52.3% | +27.4 pts |
| conduit | 37,900 ms / 23.57% | 47,600 ms / 31.75% | +25.6% | +8.2 pts |
| spirit | 38,200 ms / 77.42% | 46,100 ms / 96.41% | +20.7% | +19.0 pts |

Striker's candidate fight (115,400 ms) is far outside Boss2/Boss3's historical 20.0–47.0 s range
for these two bosses (packet §7) — it remains a well-supported, non-capped, non-extrapolated
`bot-died` observation (cap is 300,000 ms; this fight used 38.5% of it), reported as its own
data point, not smoothed into an average with the other four candidate deaths.

## 11. Owner and summon damage, reported separately

Conduit records `attackBeats: 0` in every one of its 4 cells (both arms, both blocks) by design
(`CannotAttack`); all of its damage output is recorded under `minionAttackBeats` instead
(swamp-current 62, swamp-reduced-venom 80, cave-current 41, cave-reduced-attack 55). This is not
treated as invalid or missing data — it is Conduit's summoner-root damage channel, reported as
its own field per the packet's instruction.

**The `hpLost` vs. `damageFromBoss` gap on Conduit/Dreadbore, first recorded in Boss2 §2.6 and
reproduced in both Boss3 arms (see that report §7), recurs again here, in both Boss4 Cave
arms:**

| Cell | hpLost | damageFromBoss | Excess |
|---|---:|---:|---:|
| cave-pressure / current / conduit | 473.65280 | 388.95000 | **+84.70** |
| cave-pressure / reduced-attack / conduit | 501.56640 | 330.75000 | **+170.82** |

Every other one of the 22 remaining Boss4 fights shows `hpLost` at or below `damageFromBoss`
(consistent with Boss2/Boss3's pattern of barrier/mitigation absorption accounting for the
difference in the other direction). Per the packet's explicit instruction (§9 item 11's note and
the shared measurement-property note on this exact gap), this is preserved as unknown — not
filled by subtracting incompatible counters, not attributed to boss output, not resolved by
excluding the summoner, and not treated as a logger-migration prerequisite. Its recurrence a
third time (Boss2, both Boss3 arms, now both Boss4 arms), at a larger magnitude under the reduced
Cave attack candidate specifically, is additional evidence it is a structural property of this
root/boss combination rather than run-to-run noise, but the underlying attribution is still not
established and this report does not attempt to establish it here.

## 12. Phase exposure

`crossedHalfAtMs` per cell is tabulated in §2. Two observations, both exposure-only per the
packet's own framing (crossing a threshold is not causal proof a phase caused a death):

- **Swamp**: `crossedHalfAtMs` is **identical between arms for every root** (e.g. slinger 15,500
  ms, spirit 17,000 ms, striker 41,300 ms in both arms) — expected, since the venom-coefficient
  candidate does not touch the boss's Attack, HP, or the 50%-phase trigger itself, only the DoT
  payload; the two fights only diverge in trajectory after whichever point the venom difference
  starts compounding.
- **Cave**: `crossedHalfAtMs` is **null in the control arm for striker, squire, apprentice, and
  conduit** (they die before reaching 50% boss HP) but **becomes non-null under the candidate for
  striker (73,400 ms) and squire (36,100 ms)** — consistent with those two roots' large
  fraction-removed gains (§10). Apprentice and conduit still never cross 50% in either arm.
  Slinger and spirit cross at the identical timestamp in both arms (26,700 ms and 25,200 ms
  respectively) despite the attack reduction, because damage before that point is dominated by
  early positioning/DPS uptime rather than by boss-damage differences.

Cast labels (`castLabels`) are always `["Corrosive Pool"]` for Swamp and always
`["Burrow","Burrowed","Eruption"]` for Cave, in every one of the 24 cells — no zero-cast case
occurs in this screen, so the "zero casts does not mean zero mechanics" caution is noted per the
packet's instruction but does not apply to any specific cell here.

## 13. Guardian/access

`guardianAccess: "not-measured-guard-stripped"` on all 24 `ready.json` records and both blocks'
`manifest.json`. This is stated as unmeasured, not pooled into either boss's outcome figures
anywhere in this report.

## 14. Reference, never corroboration

Every fight against a treated boss (12 candidate cells) has no history at all — it is a first
observation, not a corroboration of anything. Every control cell is a **replay** of a specific,
named Boss3 arm (§4), not independent corroboration of that arm; the exact-match table in §4
is a reproducibility finding on the same seed and package against an unchanged base simulation,
and is reported as such rather than as new supporting evidence for Boss3's own conclusions.

---

## Two measurement properties (carried, not restated as findings)

- **HP lost is sampled as per-tick HP decreases, not the pipeline's `damageTaken`.** Both are
  recorded (§11's `hpLost` vs `damageFromBoss` gap on Conduit/Dreadbore is the visible instance in
  this run) so the relationship is visible in both directions; the gap is not filled by
  subtracting incompatible counters, not attributed to boss output, not resolved by excluding the
  summoner, and a logger migration is not made a prerequisite for reporting the valid outcome
  evidence elsewhere in this report.
- **No `ttk` is extrapolated anywhere.** Every non-kill in §2 and §5 reports its outcome and the
  HP fraction actually removed at the terminal tick; no non-kill elapsed time is treated as, or
  used to project, a time-to-kill.

---

## Two-block paired table (§10 requirement)

| Root | Swamp control | Swamp candidate | Swamp category | Cave control | Cave candidate | Cave category |
|---|---|---|---|---|---|---|
| striker | bot-died (55.6%) | bot-died (62.8%) | both-lost | bot-died (28.4%) | bot-died (79.2%) | both-lost |
| squire | bot-died (80.2%) | **boss-killed** | candidate-only-won | bot-died (46.7%) | **boss-killed** | candidate-only-won |
| apprentice | bot-died (82.4%) | **boss-killed** | candidate-only-won | bot-died (37.1%) | bot-died (65.7%) | both-lost |
| slinger | boss-killed | boss-killed | both-won | bot-died (66.8%) | bot-died (94.2%) | both-lost |
| conduit | bot-died (54.2%) | bot-died (68.7%) | both-lost | bot-died (23.6%) | bot-died (31.8%) | both-lost |
| spirit | boss-killed | boss-killed | both-won | bot-died (77.4%) | bot-died (96.4%) | both-lost |
| **Totals** | **2/6 killed** | **4/6 killed** | 2 both-won / 2 candidate-only / 2 both-lost | **0/6 killed** | **1/6 killed** | 1 candidate-only / 5 both-lost |

Percentages are boss HP fraction removed at the terminal tick for non-kills. The two bosses are
kept in separate columns and are not pooled into a combined win-rate anywhere in this table or
this report.

---

## Retain / adjust / defer — judged separately per candidate

**Swamp `reduced-venom` (9→6 `dotEffect.damagePerStack`): RETAIN as a continuing local candidate,
not yet an adoption recommendation.** It produced 2 additional flips to `boss-killed` beyond
Boss3's Cleanse-alone substitution (squire, apprentice), left the two existing Boss3 winners
(slinger, spirit) winning with materially larger safety margins and unchanged clear times, and
the two roots that remain losses (striker, conduit) both survived materially longer and removed
materially more boss HP than their control pair (+19.9%/+7.2 pts and +28.8%/+14.5 pts
respectively) — a uniform directional improvement across all 6 roots with zero regressions. This
satisfies the packet's stated desired direction (material reduction in shared early failures plus
credible prepared clears) without erasing the venom mechanic or manufacturing artificial 6/6
parity; per §10, this is a prioritization signal, not a causal verdict, and per the packet's own
stop rules, adopting the exact value into source would require a separate scoped
source/runtime regression, which this packet does not authorize and this report does not
recommend triggering unprompted.

**Cave `reduced-attack` (139→104 `stats.attack`, ≈25.2% authored cut): ADJUST-candidate signal is
weak; DEFER further Cave-specific tuning decisions to command center rather than treating this
screen as conclusive.** It produced exactly one flip (squire) out of six, and the other five
roots — while uniformly surviving longer and removing more boss HP, sometimes substantially
(striker +165.9% elapsed) — remained deaths inside a 300,000 ms cap. Striker's 115.4 s candidate
fight is far outside this pairing's own historical 20–47 s range and did not resolve into either
a kill or a cap, which is itself informative (the fight is survivable-but-unwinnable-in-this-
build-for-a-long-time, not simply "still dies fast"). Per §10's explicit instruction, a weak root
alone does not require lowering every boss, and this screen's own scope (one seed, one frozen
reference package, one scalar) does not distinguish "the multiplier chosen is too small" from
"this reference package cannot clear Cave regardless of a single coarse Attack cut." No further
Swamp/Cave fights are proposed here — per the packet's closing instruction, that disposition
belongs to command center, and Boss4 is a decision checkpoint, not licence for a follow-on
permutation grid on either boss.

No Boss5 or further equipment-permutation study is proposed here.
