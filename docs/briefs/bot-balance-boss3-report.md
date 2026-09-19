# Boss3 operator packet — execution report

Executed 2026-09-19 against the frozen packet
[`bot-balance-boss3-operator-packet.md`](bot-balance-boss3-operator-packet.md). No gameplay,
build, or test-code changes were made. No commits, pushes, or follow-up experiments were
launched.

---

## 1. Executive summary

- **Revision used**: `aedef12270214c4172c107b9596d76d29370c262` (tree
  `c08f1a8270b9eece69fb28c4662f111c97af6c56`), resolved mechanically from `HEAD` at execution
  time — the docs-only commit on top of the frozen harness commit `83040603`. Working tree was
  clean before and throughout the run.
- **Qualification**: `pnpm typecheck` and all six named tests (`boss3Matrix`, `boss3Cleanse`,
  `boss2Matrix`, `boss1Matrix`, `bossDeclaration`, `bossTerminal`) passed.
- **Preflight**: both blocks qualified into a fresh root and reproduced the packet's own §8
  receipts **verbatim** — same 12 "arms paired" lines, same RP deltas, same closing line
  (`boss3 preflight: ok — 2 blocks, 24 planned observations, ZERO fights spent`). No divergence.
- **Formal run — both blocks verified.** `batch-ended.json` shows `artifactVerified: true` on
  both blocks; each block's own `verification.json` agrees (`"verified": true`). 24/24 fights
  completed, 0 capped, 0 reset, 0 vanished, 0 ambiguous, 0 invalid. No `stopped-<block>.json`
  was written (no watchdog trip). Total wall time 19.1 s (bench-clock, not combat time).
- **Result**: **Swamp responds, Cave does not.** `swamp-response`: baseline 0/6, substitution
  **2/6 killed**, and the four remaining substitution deaths all survived longer and removed
  more boss HP than their baseline pair. `cave-response`: baseline 0/6, substitution 0/6 — no
  win, matching the packet's own recorded prior that Cave was "the one that may get worse."
  Nothing here got worse in the sense of dying faster; Cave stayed a clean sweep with mixed,
  small per-fight shifts in either direction (see §5).
- **Baseline-vs-Boss2 reproducibility: exact.** All 12 baseline rows (elapsed time and boss HP
  remaining) are byte-identical to Boss2's original recordings for the same 12 cells. This is a
  reproducibility finding, not a new replicate — see §4.
- **The Conduit/Dreadbore unattributed-HP anomaly from Boss2 §2.6 recurs identically here**, in
  both arms. It is preserved as unknown per the packet's instruction, not re-investigated.

---

## 2. Planned / started / completed / verified counts

| Block | Boss | Planned | Completed | Block-verified |
|---|---|---:|---:|---:|
| swamp-response | Mire-Gorged Behemoth | 12 | 12 | **yes** |
| cave-response | Chitinous Dreadbore | 12 | 12 | **yes** |
| **Total** | | **24** | **24** | **24/24** |

`operator-ledger.jsonl`: both blocks `"code":0,"timedOut":false`, well under the 40-minute
per-block watchdog (swamp 11.3 s, cave 7.7 s wall time).

---

## 3. Reproducibility check — baseline arm vs Boss2 (packet requirement §9.4)

Per cell, the `portable-reference` arm's elapsed time and boss HP remaining are compared against
Boss2's original `behemoth`/`dreadbore` recordings for the same root.

| Root | Boss2 elapsed | Boss3 baseline elapsed | Boss2 boss HP left | Boss3 baseline boss HP left | Match |
|---|---:|---:|---:|---:|---|
| striker (swamp) | 22,200 ms | 22,200 ms | 2466 | 2466 | exact |
| squire (swamp) | 23,400 ms | 23,400 ms | 1945 | 1945 | exact |
| apprentice (swamp) | 25,100 ms | 25,100 ms | 1344 | 1344 | exact |
| slinger (swamp) | 21,600 ms | 21,600 ms | 1195 | 1195 | exact |
| conduit (swamp) | 22,400 ms | 22,400 ms | 2086 | 2086 | exact |
| spirit (swamp) | 23,800 ms | 23,800 ms | 805 | 805 | exact |
| striker (cave) | 43,400 ms | 43,400 ms | 3134 | 3134 | exact |
| squire (cave) | 34,400 ms | 34,400 ms | 2330 | 2330 | exact |
| apprentice (cave) | 20,000 ms | 20,000 ms | 2752 | 2752 | exact |
| slinger (cave) | 34,200 ms | 34,200 ms | 1453 | 1453 | exact |
| conduit (cave) | 37,900 ms | 37,900 ms | 3344 | 3344 | exact |
| spirit (cave) | 38,200 ms | 38,200 ms | 988 | 988 | exact |

All 12 baseline replays reproduce Boss2 exactly. **This confirms reproducibility; it is not
pooled into Boss2's 42-row map and does not add new coverage.**

---

## 4. Per-block paired table — terminal outcome first

Categories are read from each block's `verification.json`, not composed by hand.

### 4.1 swamp-response — Mire-Gorged Behemoth — baseline 0/6, substitution 2/6

| Root | Baseline outcome | Baseline elapsed | Baseline % removed | Substitution outcome | Substitution elapsed | Substitution % removed | Category |
|---|---|---:|---:|---|---:|---:|---|
| striker | bot-died | 22,200 ms | 26.9% | bot-died | 44,600 ms | 55.6% | both-lost |
| squire | bot-died | 23,400 ms | 42.4% | bot-died | 40,000 ms | 80.2% | both-lost |
| apprentice | bot-died | 25,100 ms | 60.2% | bot-died | 32,400 ms | 82.4% | both-lost |
| slinger | bot-died | 21,600 ms | 64.6% | **boss-killed** | 35,200 ms | 100% | substitution-only-won |
| conduit | bot-died | 22,400 ms | 38.2% | bot-died | 31,300 ms | 54.2% | both-lost |
| spirit | bot-died | 23,800 ms | 76.1% | **boss-killed** | 29,600 ms | 100% | substitution-only-won |

Pair categories: **substitution-only-won: 2, both-lost: 4, baseline-only-won: 0, both-won: 0.**

Every root improved under substitution — the 4 that still died survived 29–101% longer
(striker +100.9%, squire +70.9%, conduit +39.7%, apprentice +29.1%) and removed 37–106% more of
the boss's HP (striker +106.3%, squire +89.2%, conduit +42.0%, apprentice +36.9%) than their
baseline pair. This is a uniform directional effect, not just two flips.

**Lethal cause changed for striker only.** Every baseline swamp death and 3 of 4 substitution
deaths are `kind: "dot", effectName: "Gorged Venom"` at 4 stacks. Striker's substitution death
is the one exception: the recorded terminal event is `kind: "melee"` for 12 damage. Both venom
ticks and direct hits were landing throughout the fight's final seconds (a 95-point direct hit
at 42,700 ms did not kill), so this is reported as which channel happened to cross zero, not as
evidence that Cleanse suppressed the DoT enough to change the fight's character.

### 4.2 cave-response — Chitinous Dreadbore — baseline 0/6, substitution 0/6

| Root | Baseline outcome | Baseline elapsed | Baseline % removed | Substitution outcome | Substitution elapsed | Substitution % removed | Category |
|---|---|---:|---:|---|---:|---:|---|
| striker | bot-died | 43,400 ms | 28.4% | bot-died | 47,000 ms | 31.5% | both-lost |
| squire | bot-died | 34,400 ms | 46.7% | bot-died | 34,400 ms | 46.7% | both-lost |
| apprentice | bot-died | 20,000 ms | 37.1% | bot-died | 20,000 ms | 37.1% | both-lost |
| slinger | bot-died | 34,200 ms | 66.8% | bot-died | 37,700 ms | 70.3% | both-lost |
| conduit | bot-died | 37,900 ms | 23.6% | bot-died | 37,800 ms | 23.5% | both-lost |
| spirit | bot-died | 38,200 ms | 77.4% | bot-died | 37,900 ms | 75.5% | both-lost |

Pair categories: **both-lost: 6.** No flips either direction.

Two pairs (squire, apprentice) are **outcome-identical to the millisecond and the boss-HP
point** despite Cleanse firing and removing plating-shred stacks (see §6) — a clean case of
"removal without a change in outcome," reported as its own result per packet §10, not as a
defect. The other four pairs show small, mixed shifts (striker/slinger survived slightly
longer and removed slightly more boss HP under substitution; conduit/spirit shifted slightly
the other way) — none large enough to change a terminal outcome.

---

## 5. Guard activity — both arms, and prediction vs measured

### 5.1 Baseline: Brace activations

Brace's `hp-below 0.5` trigger, 10 s cooldown. Counts below are **not empty-record events** —
every activation applied its 40% DR window.

| Root | Swamp brace count | Swamp first activation | Cave brace count | Cave first activation |
|---|---:|---:|---:|---:|
| striker | 1 | 17,200 ms | 3 | 20,100 / 30,100 / 40,100 ms |
| squire | 1 | 18,400 ms | 2 | 20,100 / 30,100 ms |
| apprentice | 1 | 20,100 ms | 1 | 16,400 ms |
| slinger | 1 | 16,600 ms | 2 | 16,200 / 26,200 ms |
| conduit | 1 | 17,400 ms | 2 | 25,100 / 35,100 ms |
| spirit | 1 | 18,800 ms | 1 | 34,100 ms |

Every Swamp fight crosses 50% HP exactly once before death, consistent with one Brace use per
fight there; Cave's longer fights allow the 10 s cooldown to cycle 1–3 times.

### 5.2 Substitution: Cleanse activations and removed effects

All activation counts and removed-stack totals below are read from `verification.json`'s
`substitutionActivity` and cross-checked against each fight's `events.jsonl`. **No activation
in this run had an empty removal record** — every Cleanse cast in all 24 substitution fights
found an eligible target.

| Root | Swamp activations | Swamp stacks removed | Swamp 1st cast | Cave activations | Cave stacks removed | Cave 1st cast (target) |
|---|---:|---|---:|---:|---|---|
| striker | 5 | venom ×9 | 1,300 ms | 5 | plating-shred ×9 | 1,200 ms (plating-shred) |
| squire | 4 | venom ×7 | 1,500 ms | 4 | plating-shred ×7 | 1,300 ms (plating-shred) |
| apprentice | 3 | venom ×5 | 6,200 ms | 2 | plating-shred ×3 | 1,200 ms (plating-shred) |
| slinger | 3 | venom ×5 | 6,700 ms | 4 | slow ×1, plating-shred ×3 | 6,300 ms (slow) |
| conduit | 3 | venom ×5 | 6,500 ms | 4 | slow ×1, plating-shred ×5 | 6,300 ms (slow) |
| spirit | 3 | venom ×5 | 6,900 ms | 4 | slow ×1, plating-shred ×4 | 6,300 ms (slow) |

Cadence is exactly the 10,000 ms cooldown from the first cast onward in every fight (e.g.
striker/swamp: 1,300 / 11,300 / 21,300 / 31,300 / 41,300).

**Measured activity split into two distinct groups the packet's uniform prediction did not
anticipate.** §6 of the packet predicted a single first-cast time per block (~6.6–6.8 s on
Swamp, ~6.3 s on Cave, targeting the slow rider). That held for apprentice/slinger/conduit/
spirit on Swamp and for slinger/conduit/spirit on Cave. **Striker and squire diverge on both
blocks**: their first Cleanse fires at 1.2–1.5 s, roughly 5 seconds earlier than the other four
roots, and on Cave it targets `plating-shred` directly rather than `slow` — meaning
plating-shred was already live on striker/squire at ~1.2 s, before the packet's predicted
corrosion arrival (~7.1 s). Apprentice matches this early/plating-first pattern on Cave despite
otherwise tracking the late/venom-first group on Swamp. No cause is asserted here (build,
positioning, or engagement timing are all plausible and none is measured); this is reported as
the measured split, per §6's instruction that a contradicted prediction is reported, not
repaired or tuned toward.

---

## 6. Player HP — sampled vs continuous, with sampling age

Sampling is 1000 ms; `minHpFraction` in each `summary.json` is the continuous terminal value
(0% at any death, by construction), which can differ sharply from the last 1000 ms sample. Two
representative illustrations, one per damage profile:

- **Swamp (gradual DoT death)** — `portable-reference-conduit`: last sample at 22,000 ms reads
  3.3% HP (8.1/244 max HP); death follows 400 ms later at 22,400 ms. The sampled minimum (3.3%)
  is close to the true terminal value (0%) — DoT decay is visible tick-to-tick in the sampling,
  with the preceding samples at 19,000/20,000/21,000 ms reading 42.7%, 30.4%, 15.6% as the venom
  stacks accumulate.
- **Cave (sudden burst death)** — `portable-reference-squire`: last sample at 34,000 ms reads
  15.2% HP (45.7/300); death follows 400 ms later at 34,400 ms. A **~110-point hit (37% of max
  HP) landed entirely inside the final 400 ms window**, invisible to the sampled series. Several
  other Cave fights show the same pattern more sharply — `portable-reference-slinger`'s sampled
  minimum is 24.9% (at 26,000 ms) but its last sample, 200 ms before death, reads 49.2%; the
  lethal hit is a same-window event the 1000 ms cadence cannot resolve.

**Reporting rule applied:** Swamp's sampled minimum is a reasonable proxy for the true minimum
(DoT ticks are visible between samples); Cave's is not — a positive, sometimes large, sampled
minimum coexists with death in every Cave fight in this run. This is the sampling-age property
described in packet §9.6, now measured rather than asserted.

---

## 7. Damage-channel note — the Conduit/Dreadbore anomaly recurs

Boss2 §2.6 recorded `hpLost` exceeding `damageFromBoss` by ~85 HP for Conduit on Dreadbore, with
no damage event behind the excess, and treated it as unknown rather than attributed. The same
signed anomaly reproduces in **both** Boss3 arms on the same root/boss pair:

| Cell | hpLost | damageFromBoss | Excess |
|---|---:|---:|---:|
| cave-response / portable-reference / conduit | 473.7 | 389.0 | **+84.7** |
| cave-response / cleanse-substitution / conduit | 473.7 | 407.5 | **+66.1** |

Every other one of the 22 remaining fights shows `hpLost` **below** `damageFromBoss` (barrier
and healing absorption, 6–69 point gaps), matching Boss2's 11/12 pattern. Per the packet's
instruction, this gap is preserved as unknown — not filled by subtracting counters, not
attributed to boss output, and not chased with a logger change. Its recurrence at nearly the
same magnitude across two independent Boss3 arms is additional evidence it is a structural
property of this root/boss combination (a summoner-side HP-cost hypothesis remains
unconfirmed), not run-to-run noise.

---

## 8. Phase exposure and reference status

- `crossedHalfAtMs` on Swamp: slinger (15,500 ms) and spirit (17,000 ms) cross the boss's 50%
  HP mark at the **same timestamp in both arms** — the two Guards hadn't yet diverged the
  fights' early trajectories. Striker/squire/conduit never cross 50% in the baseline arm
  (`null`, consistent with their sub-50% HP removed at death) but do in the substitution arm
  (41,300 / 26,800 / 28,700 ms respectively), consistent with the substitution's higher % HP
  removed for those three. Crossing this threshold is exposure only, not a death cause, per
  §9.10.
- Cave's `Eruption` cast label appears in every fight regardless of outcome; cast counts scale
  with fight length (6–15 `castsStarted`), not with arm. Zero-cast cases do not occur in this
  screen.
- `guardianAccess: "not-measured-guard-stripped"` on every one of the 24 `ready.json` records —
  stated here as unmeasured, not pooled into either boss's figures.
- **No Boss3 row is a historical result.** Every cell in both arms is a reference fight from
  this run; only the baseline arm's byte-identical reproduction of Boss2 (§4) lends it any
  external corroboration, and that corroboration is Boss2's, not Boss3's own.

---

## 9. Stop-rule and integrity compliance

- HEAD equaled `--revision`, tree was clean, both hashes (`17aa46cb…` definitions,
  `08bcc556…` hitboxes) matched before any output was created — the run script's own assertions
  passed and are corroborated by every `ready.json`/manifest reading the same values back.
- Both blocks verified independently; neither required repair, retry, or extension.
- No `stopped-<block>.json` was produced; both blocks finished well under the 40-minute
  watchdog.
- Arm pairing verified per-root via the preflight's fingerprint comparison (§8 receipts,
  reproduced verbatim) before any fight was spent.
- The substitution only ever freed RP (2 per root, unspent) in both blocks; no cost increase.
- No boss, mob, player, item, ability, Rune, or reward values were touched. No commits, pushes,
  or additional experiments were run beyond what this packet specified.

---

## 10. What this does and doesn't show

- **Swamp**: replacing Brace with Cleanse against a DoT-only kill channel is a genuine,
  uniform improvement on this one seed — 2 outright flips to `boss-killed`, and the 4 remaining
  deaths all survived longer and dealt more damage. Combined with demonstrated, substantial
  venom-stack removal (5–9 stacks per fight) on every root, this **supports a situational
  adaptation for DoT-channel encounters** — not a general Cleanse-over-Brace recommendation.
- **Cave**: the substitution neither flipped nor clearly worsened any of the 6 pairs; it is a
  wash within this seed and this default trigger. Demonstrated plating-shred removal (3–9
  stacks per fight) did not translate into materially better survival against hits that are
  40–65% of the player's max HP in one strike, and two pairs (squire, apprentice) show removal
  with **zero** measurable outcome change. This is consistent with the packet's own framing:
  Cleanse's target on Cave is a mitigation lever, not the lethal channel, and burst this large
  is not something a few plating stacks reliably answer.
- **Striker/squire's early first-cast divergence** (§5.2) is a genuine measured deviation from
  the packet's stated prediction and is worth a preparation note before any follow-up screen
  reuses this reference package, but it did not change any terminal outcome in this run.

### Prioritized follow-ups (at most three, per §10 — prioritization signals, not verdicts)

1. **Retain the Swamp result as supporting evidence for a DoT-channel Cleanse adaptation**,
   with the caveat that it is one seed, one build, and one default trigger — not a timing-
   optimized or build-searched result.
2. **Do not chase a Cave improvement from this data.** The all-loss outcome with genuinely
   exercised counterplay (Guard activity present, stacks actually removed) keeps local
   pressure-tuning on the table for Cave, but this screen does not say by how much, and a
   regression here is explicitly not grounds for a boss nerf.
3. **Note the striker/squire early-Cleanse timing divergence** for whoever next authors a
   Cave or Swamp reference package — it is unexplained here and should not be assumed uniform
   across roots in future screens that reuse this construction.

No Boss4 or further equipment-permutation study is proposed here; that disposition is for
command center, per the packet's own closing instruction.

---

## 11. Corrections — 2026-09-19, prose only

Added after review. **No fight was re-run, no artifact was altered, and no number in
§§1-10 above was recomputed.** Every correction below is to the report's *wording*;
where a claim is withdrawn, the underlying recorded data stands unchanged and is
restated. Nothing here reopens the sampling or HP-accounting questions — see C3 and
C6.

**C1 — the fight counts in §5.2.** "all 24 substitution fights" is wrong. The screen is
24 fights: **12 substitution fights and 12 reference fights**, six of each per block.
The finding itself is unaffected — no activation in any of the **12** substitution
fights had an empty removal record.

**C2 — "nothing got worse" in §1 is too broad.** Two Cave pairs did die slightly
sooner under substitution: conduit 37,900 → 37,800 ms and spirit 38,200 → 37,900 ms
(both already recorded in §4.2, and both also removed marginally less boss HP). The
correct statement is the one §4.2 already makes: **Cave showed small, mixed shifts in
both directions and no victory in either arm.** "No Cave case died faster" is
withdrawn; "Cave stayed a clean sweep" stands.

**C3 — `minHpFraction` is not a continuous terminal value (§6).** It is the **minimum
of the runner's per-tick observations**, taken every 100 ms inside the simulation loop
(`server/scripts/bossScreen.ts`, `minHp = Math.min(minHp, v.hp / v.maxHp)`); the
recorded `samples.jsonl` series is a **separate** 1000 ms cadence; and the terminal
reading is a **third** thing. It reaches 0 on a death because the loop observes the
dead tick, not because it is continuous. Three distinct resolutions, kept distinct:

| Reading | Cadence | What it is |
|---|---|---|
| `minHpFraction` in `summary.json` | every 100 ms tick | minimum ever observed by the loop |
| `samples.jsonl` HP series | every 1000 ms | the recorded series, up to 1 s stale |
| terminal HP | at the terminal tick | the value at the outcome |

The §6 *illustrations* are unchanged and remain correct as read: the 1000 ms series
tracked the Swamp DoT death closely in that one case and missed a ~110-point Cave hit
inside the final 400 ms in another. What is withdrawn is the **generalisation** —
"Swamp's sampled minimum is a reasonable proxy for the true minimum" is one example,
not a property of DoT deaths, and must not be carried forward as a sampling rule.

**C4 — the first-Cleanse divergence (§5.2) is per-root, and stays that way.** The
recorded first-cast times are the finding: striker/squire at 1.2-1.5 s on both blocks,
the other four at 6.2-6.9 s, with apprentice joining the early group on Cave only. No
cause is isolated and none is claimed, and no effect on any terminal outcome is
established. Record the per-root timings; do **not** derive a universal first-cast
prediction from them, and do not open a timing-optimisation study.

**C5 — identical endpoints are not evidence of zero effect.** The squire and
apprentice Cave pairs match to the millisecond and the boss-HP point (§4.2) with
Cleanse demonstrably removing plating-shred stacks. That shows **no change in the
endpoints**, not that the removal had no intermediate defensive effect. Symmetrically,
the terminal DoT attribution in §4.1 identifies the channel that crossed zero; it does
not show that direct hits, pool exposure or positioning contributed nothing.

**C6 — the Conduit/Dreadbore accounting gap (§7) stays unknown.** Reaffirmed rather
than changed: it is not filled by subtracting incompatible counters, not attributed to
boss output, not resolved by excluding the summoner, and not a reason to start a
logger migration. An unsupported aggregate is omitted; the valid outcome evidence in
§§2-5 is unaffected by it.
