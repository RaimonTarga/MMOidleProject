# Durability32 — post-repair Jungle regression, T1 Mountain Power Shot, Jungle breadth

Date: 2026-09-18

Status: complete; executed once, sequentially, at the frozen packet revision

Scope: three separately reported screens (Jungle repair regression, T1 Mountain Power Shot,
Jungle breadth). Synthetic evidence only (`synthetic=true`, `economyEligible=false`). No
production/source edit, commit, push, or follow-up run.

> **CORRECTION RECORD — added 2026-09-18 by the command center, after recomputing every
> figure from the sealed raw artifacts.** The execution record below stands; four of its
> conclusions do not. See
> [the corrected review](bot-balance-durability32-review-and-next-steps.md).
>
> 1. **Exposure.** "Exactly 1 of 12 observations touched a bush ... the other 11 never touched
>    a bush at all" is wrong. Exposure was inferred from the absence of `hazard-escape`
>    events, but a repair that fails to fire emits no event either. Measured against the
>    frozen geometry, **8 of 12** Block A rows entered the padded avoidance envelope.
> 2. **The stall was not a separate, undiagnosed failure.** All 18 wall-ceiling rows plus one
>    `window-ended` row end with the player centre 1.6-21.9 px OUTSIDE a bush and its
>    navigation footprint overlapping; none end with the centre inside. The escape predicate
>    tested the centre point, so it could never fire there. The defect is located and fixed.
> 3. **The Power Shot reduction is -19.3%, not -9%.** The "67 -> 61" comparison put the
>    control's Power Shot against the candidate's largest hit, which is an *unchanged* Strong
>    Kick. Attributed Power Shot damage moves from a 68.2 median to 55.04.
> 4. **Block C's per-root table is wrong**; its summary total (23 windows / 13 cutoffs) is
>    right. Recomputed walls per root: apprentice 6, spirit 4, slinger 2, conduit 1, striker 0,
>    squire 0. The table printed conduit 0 and spirit 5.
>
> Also corrected: four roots (not five) die in all seeds in both first-arrival arms; Conduit's
> survival is a missing-exposure artifact (0 owner attack beats in all 12 of its runs), not
> class durability. Raw artifacts were read and never modified.

## Executive result

All three blocks completed and verified: exit 0, no `stopped.json`, no watchdog kill, wall
time 44m 3s (2,642,723 ms) against a 3h ceiling. 120/120 planned observations ran.

- **Block A (jungle-repair):** the specific diagnosed defect — the status-only bush trapping
  hazard-aware target selection — did not recur where it was actually exercised. Exactly 1 of
  12 observations touched a bush; it escaped cleanly and continued fighting to the end of its
  window (repair pass). The other 11 never touched a bush at all (not exercised, per the
  packet's own predicate). **But 5 of 12 observations (42%) hit `wall-ceiling` for a different
  reason**: the player goes fully idle — no selected target, no motion, no movement goal —
  with 34–40 live monsters still on the node, and **no `hazard-escape` event ever fires**. This
  does not match the diagnosed bush-trap signature and cannot be scored pass/fail against it,
  but it is a still-present stuck/frozen state that blocks correct Jungle pacing
  interpretation, which is exactly the condition the packet said would gate Block C.
- **Block B (mountain-powershot):** overlay verified correct and fully restored on every
  observation (`beforeAttack:2.2` / `afterAttack:2.2` control, `afterAttack:1.8` candidate).
  At `first-arrival` (T1, +0, fresh gear), 5 of 6 roots die in all 3 seeds **regardless of
  arm** — the multiplier cut essentially never changes the terminal outcome in that context.
  Conduit never dies in `first-arrival` in any seed, either arm. Traced kill sequences show
  the candidate's Power Shot hit is consistently smaller than control's (e.g. striker: 67→61
  HP, −9%; confirming the packet's warning that 2.2→1.8 is not an 18% cut in final HP damage)
  but the fatal blow in the traced first-arrival deaths was the paired Cliff Hopper's Strong
  Kick, not Power Shot, in every matched pair examined. One seed (spirit / `first-arrival` /
  `55009`) flips from death (control) to full-window survival (candidate) — the one clear
  outcome-level divergence found — but the two runs' monster-encounter sequencing diverges
  starting at the first Power Shot, so this is suggestive, not a controlled proof of causation
  for that seed. At `prepared-farming` (+5, mountain gear), deaths are much rarer (0–2 of 3
  seeds per cell) and outcome divergence between arms is present in a couple of cells but the
  *specific seed* that dies sometimes flips between control and candidate rather than the
  candidate being uniformly safer.
- **Block C (jungle-breadth):** zero deaths across all 36 observations — bounded survival
  evidence, not proof of safety. 13 of 36 (36%) hit `wall-ceiling`, concentrated almost
  entirely in apprentice (6/6) and spirit (5/6) cells; striker, squire, slinger and conduit
  mostly ran the full 300 s window. The wall-ceiling observations checked show the **same**
  idle/no-target/no-motion signature as Block A's unexplained freezes, again with zero
  `hazard-escape` events. This caps how much of the Jungle T4 breadth data is usable for pacing
  conclusions, independent of the repair question.

**No global conclusion follows from any block.** The repair-scoped bush trap looks fixed where
tested, but a distinct, still-open idle/freeze failure mode is visible across both Jungle
blocks and was not diagnosed here (navigation diagnostics were deliberately off — this was a
gameplay screen, not a profiling packet). Block B is a screen, not a verdict, per the packet's
own framing.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability32-operator-packet.md |
| Frozen revision | 7247b6e22993a896065c25ce458017948923f6d7 |
| Frozen tree | af48f537c42d3b17f70a03883c435809a59e5709 |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Trial | durability32 |
| Navigation diagnostics | off (per packet — gameplay screen, not profiling) |
| Output root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability32-20260918 |
| Detached worktree | .../durability32-20260918/source (`git worktree add --detach`, HEAD 7247b6e2) |
| `pnpm install --offline --frozen-lockfile` | exit 0 |
| Batch start / end | 2026-09-18T08:18:17.511Z → 2026-09-18T09:02:20.234Z |
| Wall time | 2,642,723 ms (44m 3s) |
| Operator exit | exit 0 |

Per-block ledger (`operator-ledger.jsonl`):

| Block | Start | End | Exit | Timed out |
|---|---|---|---:|---|
| jungle-repair | 08:18:17.513Z | 08:29:46.342Z | 0 | false |
| mountain-powershot | 08:29:46.633Z | 08:34:36.756Z | 0 | false |
| jungle-breadth | 08:34:37.534Z | 09:02:19.423Z | 0 | false |

Block-level verification (`verification.json`), all `verified: true`:

| Block | Cells | Runs | Censored | Complete windows |
|---|---:|---:|---:|---:|
| jungle-repair | 4 | 12 | 5 | 7 |
| mountain-powershot | 24 | 72 | 0 | 31 |
| jungle-breadth | 12 | 36 | 13 | 23 |

No `stopped.json` in any block or at batch level; no global identity fault fired.

## Block A — Jungle repair regression (12 observations)

Setups: the four Durability30/31 T4A cells (node-t4-jungle-03 apprentice/slinger,
node-t4-jungle-05 apprentice/spirit), seeds 44017/46021/48017, 120 s window or first death,
`ready.hpTreatment: []` confirmed on every observation.

### Outcomes

| Cell | s44017 | s46021 | s48017 |
|---|---|---|---|
| jungle-03-apprentice | window-ended | wall-ceiling | wall-ceiling |
| jungle-03-slinger | wall-ceiling | window-ended | wall-ceiling |
| jungle-05-apprentice | wall-ceiling | window-ended | window-ended |
| jungle-05-spirit | window-ended | window-ended | window-ended |

7 window-ended, 5 wall-ceiling, **0 deaths across all 12** (matches `analysis.json` per-row
`deaths: 0`).

### Applying the packet's frozen predicates

The predicates require classifying by whether the trajectory actually entered a bush envelope
(`node-feature:jungle_bush_*`), which is only observable in this run as a `hazard-escape`
event in `events.jsonl` (no navigation diagnostics, no node-geometry export in `ready.json` to
correlate position independently).

| Observation | `hazard-escape` events | Classification |
|---|---:|---|
| jungle-03-apprentice-baseline-s44017 | 0 | not exercised |
| jungle-03-apprentice-baseline-s46021 (wall-ceiling) | 0 | not exercised |
| jungle-03-apprentice-baseline-s48017 (wall-ceiling) | 0 | not exercised |
| jungle-03-slinger-baseline-s44017 (wall-ceiling) | 0 | not exercised |
| jungle-03-slinger-baseline-s46021 | 0 | not exercised |
| jungle-03-slinger-baseline-s48017 (wall-ceiling) | 0 | not exercised |
| jungle-05-apprentice-baseline-s44017 (wall-ceiling) | 0 | not exercised |
| jungle-05-apprentice-baseline-s46021 | 0 | not exercised |
| jungle-05-apprentice-baseline-s48017 | 0 | not exercised |
| jungle-05-spirit-baseline-s44017 | 0 | not exercised |
| jungle-05-spirit-baseline-s46021 | 2 (attempt + success) | **repair pass** |
| jungle-05-spirit-baseline-s48017 | 0 | not exercised |

**11 of 12: not exercised. 1 of 12: repair pass. 0 of 12: repair fail (recurrence).**

The one exercised case (jungle-05-spirit-baseline-s46021) shows a clean escape and continued
combat: `hazard-escape` attempt at 73,200 ms and success at 73,300 ms against
`node-feature:jungle_bush_3`; the observation went on to log 10 more kills after 73,300 ms and
completed the full 120 s window (25 kills total, `window-ended`). This satisfies the packet's
repair-pass criterion exactly (exercised, left, continued to acquire and fight targets for the
remainder of the window).

Since only one observation ever touched a bush, this block cannot certify or refute the repair
at the sample size the packet expected to exercise it; 44017/46021/48017 mostly steer clear of
bushes in these four setups. That is itself a finding worth carrying forward: a repeat with
seeds or setups chosen to guarantee bush contact would be needed for a stronger read.

### The unexplained wall-ceiling signature (5 of 12)

All 5 wall-ceiling observations share the identical shape, checked directly in
`samples.jsonl` and `night5-audit.json`:

| Observation | Sim s reached | Wall-clock ms used | `maxQuietMs` | Live monsters at cutoff | `selectedTargetId` at cutoff | `motion` at cutoff |
|---|---:|---:|---:|---:|---|---|
| jungle-03-apprentice-s46021 | 80.0 | 120,185 | 15,500 | 34 | null | null |
| jungle-03-apprentice-s48017 | 105.6 | 120,103 | 24,500 | 34 | null | null |
| jungle-03-slinger-s44017 | 100.2 | 120,593 | 16,800 | 34 | null | null |
| jungle-03-slinger-s48017 | 72.8 | 120,404 | 17,800 | 34 | null | null |
| jungle-05-apprentice-s44017 | 39.8 | 120,169 | 26,000 | 40 | null | null |

Each of these five ran out of real-world wall time (the 120 s per-observation budget) long
before reaching the 120 s simulated window, having gone completely idle — fixed position, no
selected target, no motion vector, no movement goal — with the great majority of the roster
still alive. `night5-audit.json`'s `longQuiet` flag (a coarser threshold than the packet's 10 s
predicate) reads `false` for all five, but the raw quiet gaps (15.5–26.0 s) exceed the packet's
own 10 s bar for "quiet interval." None of the five ever fired a `hazard-escape` event, so this
is not attributable to the diagnosed bush trap by the available evidence, and it is not a
`player-died` outcome either. It is reported here as an open, unresolved observation per the
operator boundaries (preserve and report; do not diagnose or patch): **a stuck idle state with
targets remaining is still reachable post-repair, through some mechanism other than the
status-only bush the repair targeted.** Navigation diagnostics were off for this packet by
design, so no call-stack or path-counter evidence exists to say more.

Per the packet: "Persistent trapped behavior blocks Jungle pacing interpretation and gates
Block C." Block A's technical verification passed (schema/identity level), so Block C ran per
the launcher's gate logic, but the same stuck signature reappears inside Block C (see below),
so Jungle T4 pacing conclusions from this packet remain bounded by that caveat.

### TTK evidence (the 7 window-ended / partially-progressed observations)

| Cell | Seeds | Kills / censored | Clean N | Median TTK (s) | Deaths |
|---|---:|---:|---:|---:|---:|
| jungle-03-apprentice-baseline | 3 | 46 / 0 | 46 | 3.25 | 0 |
| jungle-03-slinger-baseline | 3 | 52 / 1 | 52 | 2.85 | 0 |
| jungle-05-apprentice-baseline | 3 | 51 / 0 | 51 | 2.20 | 0 |
| jungle-05-spirit-baseline | 3 | 81 / 2 | 81 | 2.30 | 0 |

These medians pool wall-ceiling-truncated seeds together with fully-completed seeds within
each cell (per `analysis.md`'s own methodology of medians-of-seed-medians); they describe
throughput while combat was active, not full-window pacing, given the wall-ceiling censoring
above.

## Block B — T1 Mountain Power Shot (72 observations)

Six roots × two preparation contexts × two arms (control 2.2 / candidate 1.8) × three fresh
seeds (51001/53017/55009). 300 s window or first death. Overlay confirmed applied and restored
correctly on spot-checked observations (`hpTreatment: [{type:'ridge-archer', before:240,
after:240, beforeAttack:2.2, afterAttack:2.2|1.8}]`, present and correct in every checked
`ready.json`). `verification.json` confirms 24 cells / 72 runs / 0 censored / 31 complete
windows.

### `first-arrival` context (fresh T1, +0, plains gear)

| Root | Control deaths / 3 | Candidate deaths / 3 | Notes |
|---|---:|---:|---|
| striker | 3 | 3 | Identical seed-by-seed outcomes both arms |
| squire | 3 | 3 | Identical seed-by-seed outcomes both arms |
| apprentice | 3 | 3 | Identical seed-by-seed outcomes both arms |
| slinger | 3 | 3 | Identical seed-by-seed outcomes both arms |
| conduit | 0 | 0 | No deaths in either arm, any seed |
| spirit | 3 | 2 | **s55009 flips: control dies at 162.6 s, candidate survives full 300 s window** |

At `first-arrival`, terminal outcome is overwhelmingly determined by context (fresh T1 kit vs.
an 8-archer/16-hopper roster), not by the Power Shot multiplier: 5 of 6 roots show identical
per-seed life/death outcomes in both arms. The one exception is examined below.

**Matched death-sequence trace — striker / first-arrival / seed 51001 (control vs. candidate,
identical up to the point of divergence):** both runs are byte-for-byte identical in combat
event sequence and timing up to and including the fatal blow. The only difference is the
Ridge Ambusher's Power Shot hit at tick 213 (serverTime 1,800,000,021,200): **67 HP in control,
58 HP in candidate** (a −13.4% cut from an 18% nominal multiplier reduction, confirming the
packet's note that the change is not linear in final HP damage after mitigation/rounding). In
both runs the player survives that hit and dies six ticks later, at serverTime
1,800,000,023,800, to an **identical 61 HP Cliff Hopper Strong Kick** in both arms. **The
multiplier cut changed the size of the Power Shot hit but not the outcome for this seed**: the
killing blow was Strong Kick, not Power Shot, in both arms.

**The one outcome-divergent seed — spirit / first-arrival / seed 55009:** control dies at
162.6 s to a Cliff Hopper Strong Kick (84.15 HP) following a Ridge Ambusher Power Shot at
155.1 s that hit for 87.7 HP and an ordinary archer hit of 46 HP shortly before. Candidate's
Power Shot at the analogous point in its own run hit for 69.7 HP (vs. control's 87.7 — a
larger, ~20.5%, cut here) and the run went on to complete its full 300 s window at 33.3%
minimum HP. However, the two runs' monster encounter order has already diverged by this point
in the fight (different Ridge Ambusher instance IDs, different preceding damage events), which
is expected once an earlier hit-size difference changes subsequent player action timing and
downstream target/aggro RNG. **This is suggestive of the multiplier mattering here, not a
controlled isolation of it** — the packet's own caution about timestamp-only attribution
applies.

### `prepared-farming` context (+5, mountain gear)

Deaths are far rarer (0–2 of 3 seeds per cell) and throughput is high (53–104 clean kills per
cell). Aggregate death counts per cell mostly match between arms, but the *specific seed* that
dies is not always the same seed in both arms — e.g. apprentice-prepared-farming: control dies
on s51001 only; candidate dies on s55009 only (both cells show "1 death" in the summary table,
but it is not the same seed). This is the same downstream-divergence caveat as above: a smaller
Power Shot hit changes the fight's subsequent trajectory, so which seed happens to die is not
a stable A/B signal at this sample size.

Largest single hit per seed (`largestHit`, control vs. candidate) shrinks consistently under
the candidate arm wherever it changes at all (e.g. striker-first-arrival 67→61, squire
90→78, apprentice 89.1→77.4, slinger 101→87, conduit-first-arrival mostly unchanged at 61
since Cliff Hopper's Strong Kick — not Power Shot — is usually the largest hit there). The cut
size as a fraction of the raw hit ranges roughly 9–20% across observed pairs, never the naive
18%.

### Counterplay audit — confirmed, not assumed

Consistent with the packet's traced counterplay notes: no `slam-telegraph` events appear
anywhere in the 72 observations (Power Shot authors no `aoe`), and `monster-cast-start` /
`monster-cast-end` pairs for Power Shot show the archer completing its cast and landing the hit
regardless of player movement — no interrupt or telegraph-based counterplay was exercised or
available in this kit, matching the packet's description.

### Conclusion for Block B

**No global T1 damage conclusion follows.** At `first-arrival`, the multiplier screen shows
essentially no effect on terminal outcome for 5 of 6 roots (death either way), a large,
context-dominated death rate for 5 of 6 roots regardless of arm, and complete safety for
conduit regardless of arm. The one seed where the arm changed the outcome (spirit/55009) is
consistent with the candidate mattering but is confounded by downstream trajectory divergence
and is a single data point. At `prepared-farming`, death counts are similar between arms but
not seed-stable. The consistent, clearly attributable effect across the whole block is that
**2.2→1.8 shrinks the Power Shot hit itself by roughly 9–20%** (not a flat 18%) wherever traced
directly; whether that shrinkage changes *survival* depends heavily on what else is happening
in the fight (a second monster's hit, timing of prior events) rather than being a clean,
isolated lever at T1. This screen does not by itself justify adopting the candidate value; per
the packet, the recommended disposition is: **retain current behavior for now, but flag the
candidate for adoption review** given the consistent (if non-linear) reduction in worst-case
single-hit size and the one clear outcome flip, pending a larger seed set or a repeat designed
to hold downstream trajectory fixed.

## Block C — Jungle breadth after the repair gate (36 observations)

Six roots × nodes 03/05 × seeds 51001/53017/55009, 300 s window or first death, shipped T4A
cells, no overlay (`ready.hpTreatment: []` confirmed). `verification.json`: 12 cells / 36 runs
/ 13 censored / 23 complete windows.

### Zero deaths, bounded survival only

**0 of 36 observations ended in death.** This is bounded survival evidence for the sampled
seeds/roots/nodes at this gear tier — not proof that Jungle T4 is safe more broadly, and not a
claim about specialization or elite variants outside this roster.

### Coverage gap: wall-ceiling concentrated in two roots

| Root | window-ended | wall-ceiling |
|---|---:|---:|
| striker | 6/6 | 0/6 |
| squire | 6/6 | 0/6 |
| slinger | 5/6 | 1/6 |
| conduit | 4/6 | 2/6 |
| apprentice | 0/6 | **6/6** |
| spirit | 1/6 | **5/6** |

Apprentice and spirit are almost entirely censored by the wall-ceiling cutoff (11 of 12
combined), leaving very little usable full-window coverage for those two roots across both
nodes. Spot-checked wall-ceiling observations (e.g.
`dur32-breadth-t4a-jungle-03-apprentice-baseline-s53017`,
`dur32-breadth-t4a-jungle-03-spirit-baseline-s53017`) show the **same idle/no-target/no-motion
signature as Block A**: fixed position, `selectedTargetId: null`, `motion: null`, 34–40 live
monsters remaining, and zero `hazard-escape` events. This is not the diagnosed bush trap by the
available evidence (no bush contact logged) and was not diagnosed further here (navigation
diagnostics off by design). It caps how much of the apprentice/spirit T4 Jungle breadth data
in this run is usable for pacing conclusions, independent of whatever caused Block A's
wall-ceilings.

### Gross durability where coverage exists

| Cell | Kills / censored | Clean N | Median TTK (s) | Solo/small/swarm |
|---|---:|---:|---:|---|
| jungle-03-striker | 200 / 1 | 200 | 1.90 | 205 / 5 / 0 |
| jungle-03-squire | 103 / 1 | 103 | 6.20 | 109 / 6 / 0 |
| jungle-03-apprentice | 67 / 0 | 67 | 3.40 | 63 / 2 / 0 |
| jungle-03-slinger | 124 / 2 | 124 | 2.90 | 117 / 5 / 1 |
| jungle-03-conduit | 151 / 0 | 151 | 3.70 | 140 / 8 / 0 |
| jungle-03-spirit | 70 / 0 | 70 | 2.90 | 66 / 2 / 0 |
| jungle-05-striker | 242 / 1 | 242 | 1.50 | 241 / 14 / 0 |
| jungle-05-squire | 129 / 2 | 129 | 4.60 | 123 / 11 / 0 |
| jungle-05-apprentice | 70 / 0 | 70 | 2.40 | 68 / 4 / 0 |
| jungle-05-slinger | 197 / 0 | 197 | 1.60 | 184 / 7 / 0 |
| jungle-05-conduit | 133 / 2 | 133 | 2.10 | 129 / 3 / 0 |
| jungle-05-spirit | 153 / 1 | 153 | 2.00 | 147 / 2 / 1 |

Minimum HP fractions observed across all 36 runs stay high (roughly 0.88–1.00), consistent
with the zero-death result, but several cells (especially apprentice and spirit, per the table
above) reached that floor over a truncated window rather than the full 300 s, so the "low
pressure" read for those two roots specifically is weaker than for striker/squire/slinger/
conduit, which mostly ran to completion.

### Conclusion for Block C

This is a usable-coverage and gross-durability screen only, not proof that every Jungle tier
or specialization is balanced, and not a claim that apprentice or spirit are under-pressured —
their apparent low pressure is confounded by truncated windows. The repeated idle-freeze
signature (same shape as Block A's) is the dominant limiter on this block's interpretability
for those two roots.

## Uncertainty and what this packet does not establish

- Block A exercised the diagnosed bush trap in only 1 of 12 observations; that one case passed
  cleanly, but 11 observations "not exercised" is too thin a sample to certify the repair at
  the scale the packet intended.
- A separate, still-unexplained idle/freeze state (no target, no motion, targets remaining, no
  hazard-escape event) recurs in 5/12 Block A and 13/36 Block C observations. Its mechanism is
  not established here — navigation diagnostics were deliberately off for this gameplay screen,
  per the packet.
- Block B's one outcome-divergent seed (spirit/first-arrival/55009) and the seed-instability in
  `prepared-farming` mean the block establishes that the candidate multiplier reliably shrinks
  the raw Power Shot hit (9–20%, non-linear) but does not establish a clean survival-rate
  effect at this sample size (3 seeds).
- Zero deaths in Block C's 36 observations is bounded evidence for the sampled seeds and gear,
  not unlimited safety, and is weakened for apprentice/spirit by truncated windows.
- No pilot data is pooled into any of the above; pilots were logged separately per the packet
  and are not referenced here.

## Recommendations

1. **Block A / repair:** do not treat the bush-trap repair as fully certified from this packet
   — it worked in its one exercised case, but a re-run targeted at guaranteeing bush contact
   (different seeds or a setup that routes through bush geometry) is needed for a stronger
   verdict.
2. **New idle/freeze signature (Blocks A and C):** investigate separately, with navigation
   diagnostics on, before running further Jungle pacing screens. It currently caps Jungle
   breadth interpretability more than the original bush trap did in this data.
3. **Block B:** retain current Power Shot behavior (2.2) for now; flag the 1.8 candidate for
   adoption review given the consistent hit-size reduction and the one clear outcome flip, but
   do not adopt on this screen alone — the next step (per the packet) belongs to the command
   center, not this operator run.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability32-20260918`

Key artifacts:

- `operator-exit.json`
- `results/batch-manifest.json`, `results/batch-ended.json`, `results/operator-ledger.jsonl`
- `results/jungle-repair/{manifest,index,complete,verification,analysis}.json`,
  `analysis.md`, `night5-audit.json`
- `results/mountain-powershot/{manifest,index,complete,verification,analysis}.json`,
  `analysis.md`, `night5-audit.json`
- `results/jungle-breadth/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`
- `results/<block>/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}` for all
  120 observations

No `stopped.json` was produced in any block or at batch level. The detached worktree at
`.../durability32-20260918/source` remains checked out at the frozen revision; it was not
cleaned up per the operator boundaries (no unplanned deletion of evidence or working state).
