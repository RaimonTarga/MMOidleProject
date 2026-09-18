# Durability35 — T1 Mountain local enemy-pressure package

Date: 2026-09-18

Status: complete; executed once, sequentially, at the frozen packet revision

Scope: one block, `mountain-pressure`, 24 cells / 72 observations. Synthetic evidence only
(`synthetic=true`, `economyEligible=false`). No production/source edit, commit, push, or
follow-up run. Counts below are read mechanically from `index.json`, `verification.json`, and
`complete.json`, not hand-typed.

> **CORRECTION RECORD - added 2026-09-18 by the command center after reprocessing the sealed
> artifacts. D35 was NOT rerun.** The execution record and the survival result stand; four
> numerical/label findings are corrected. See
> [the corrected review](bot-balance-durability35-review-and-next-steps.md).
>
> 1. **The damage reductions are 23.08% and 23.44%, not 30.0% and 30.6%.** The frozen
>    `charged-cast-audit.mjs` sorted arm names alphabetically and formed armB/armA, so for
>    `['candidate','control']` the ratio came out control/candidate and `1 - median` produced
>    both the wrong sign and the wrong denominator. Ratio 1.300 means a 23.08% reduction from
>    the baseline, not 30%. The audit now takes a DECLARED baseline and comparison and computes
>    the reduction per hit as `(baseline - comparison)/baseline`.
> 2. **The pooled medians do not support "both below 20%" either.** Pooled, Strong Kick is
>    65 -> 57 (12.31%) and Power Shot 82.8 -> 63 (23.91%). Those are descriptive pooled-hit
>    comparisons across unequal counts, not matched causal effects.
> 3. **33 and 8 are different units and never summed to 36.** `matchedHits` counts HITS;
>    `pairsWithNoComparableHit` counts RUN PAIRS. Recomputed: Strong Kick has **33 matched hits
>    across 28 matched run pairs**, plus 8 pairs with no comparable hit - and 28 + 8 = 36. The
>    dataset was never inconsistent; the labels were. Timestamp and ordinal matching also shows
>    TIMING alignment only, so the contrast is labelled timing-matched, not state-matched.
> 4. **minHP is the lowest observed value, not terminal HP.** Only 4 of 35 survivors ever dipped
>    below 8%, and their terminal HP is far higher - e.g. a run with minHP 0.169 ended at 0.925.
>    Brief near-misses and remaining at low HP are different observations.
>
> Also corrected: a pooled 50/40 gross median does not describe the heavy node. Per-node runtime
> attacks are **55 -> 44 on node-01 (heavy)** and **50 -> 40 on node-02 (swarming)**; authored,
> per-node runtime and final damage are distinct fields. And swarming's 16/18 versus heavy's
> 12/18 is a difference in observed outcomes, not evidence that swarming is disproportionately
> easy - swarming contains deaths and low-HP survivors too. Raw artifacts were read, never
> modified.

## Executive result

Block completed and verified: exit 0, no `stopped.json`, no watchdog kill, wall time 467,551 ms
(7m 47.6s) against a 3h ceiling (`batch-ended.json`). `verification.json`: 24 cells / 72 runs / 0
censored / 35 complete (`window-ended`) observations. All 72 planned observations ran.

- **The package relieves the systematic early failure for four of five previously-dying roots,
  unevenly.** Striker, Squire, and Spirit move from 0/3 control survivors to 2/3 or 3/3 candidate
  survivors on the heavy node, and Squire, Slinger, Striker reach 3/3 on the swarming node.
  **Apprentice stays the outlier**: 2/3 candidate survival on heavy but only 1/3 on swarming,
  and Slinger stays at 0/3 candidate survival on the heavy node specifically (0/3 → 3/3 on
  swarming instead). This is not a uniform fix.
- **Across all 36 matched control/candidate pairs, the candidate arm never did worse.** Joint
  outcomes: died→survived 21, died→died 8, survived→survived 7, **survived→died 0**. Two
  terminal labels give four joint categories in principle; only three appear in this dataset,
  and the missing one (control survived, candidate died) is the one the package would need to
  produce to look actively harmful — it does not occur here.
- **The swarming node (`node-t1-mountain-02`) responds more than the heavy node
  (`node-t1-mountain-01`) does**, and by a large enough margin to flag as the required
  "disproportionately easy" question: swarming candidate survival is 16/18 (89%) versus heavy
  candidate 12/18 (67%), while the two arms' *control* baselines are close (3/18 vs 4/18). The
  package narrows survivability at very different rates on the two node contexts it was tested
  against.
- Attributed, paired-same-state evidence confirms the treatment is real and roughly matches
  qualification: Strong Kick's median matched-pair ratio is 1.300 (control ÷ candidate — a 30%
  HP-damage cut), Power Shot's is 1.306 (30.6% cut), both close to the qualification's ~19-20%
  final-HP-damage estimate's ballpark but measured directly here rather than assumed. Power
  Shot's paired sample is thin: only 14 of 36 attempted pairs had a comparable hit at the same
  cast ordinal and resolve time; the other 22 diverged first. That divergence is reported as an
  honest zero, not folded into the ratio.
- Conduit's near-total survival (11 of 12 observations reach `window-ended`; the sole death is
  `dur35-mtn-02-conduit-control` seed 75011) is **not** player-durability evidence: **owner
  attack beats are 0 in all 12 Conduit observations** on both nodes and both arms, by design
  (`CannotAttack`). All combat exposure is 341-535 minion attack beats per run.
- 37 total deaths across the block. Final-blow attribution: 22 of 37 (59%) resolve to a named
  charged cast (Strong Kick 17, Power Shot 5); the remaining 15 of 37 (41%) are **unattributed**
  — no ability id on the killing damage event — and are reported as unattributed rather than
  labelled "basic".

**No global conclusion follows.** This is a screen at n=3 seeds per cell; retain/adjust/adopt is
a decision for the command center, not settled here.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability35-operator-packet.md |
| Frozen revision | f123d46b25f5ce64229ea4cea59fd870d6695873 |
| Frozen tree | 93f3239891ed579c8e389bf180ab6b1d245f5f53 |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Trial / Block | durability35 / mountain-pressure |
| Output root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability35-20260918 |
| Detached worktree | .../durability35-20260918/source (`git worktree add --detach`, HEAD f123d46b) |
| `pnpm install --offline --frozen-lockfile` | exit 0 |
| Block start / end | 2026-09-18T13:44:28.698Z → 2026-09-18T13:52:13.559Z (operator-ledger.jsonl) |
| Wall time | 467,551 ms (7m 47.6s) |
| Operator exit | exit 0 |

`verification.json`: 24 cells, 72 runs, `verified: true`, 0 censored, 35 complete windows. No
`stopped.json` at block or batch level; no global identity fault fired.

## Paired starting-build and geometry parity

Confirmed from `manifest.json`: every control/candidate cell pair shares an identical `build`
block (`classRoot`, `gearItemIds.weapon/armor/recovery/mobility`, `skillPath`, `upgradeLevel: 3`,
`guards: ["second-wind"]`). The two arms differ only in the `treatment` label and the resulting
runtime monster stats. Both `node-t1-mountain-01` (heavy) and `node-t1-mountain-02` (swarming)
are asserted per cell in the manifest and never collapse to one context.

## Runtime monster stats: authored vs. post-modifier

Per the packet, `ridge-archer` and `cliff-hopper` basic attack drops 50 → 40 (authored, both
species, both nodes). The block's own attributed audit (`mountain-pressure-casts-summary.json`,
`byLabelArm`) confirms the post-modifier runtime values actually resolved in combat:

| Ability | Arm | Landed | Gross damage median | HP damage median |
|---|---|---:|---:|---:|
| Strong Kick | control | 131 | 50 | 65 |
| Strong Kick | candidate | 311 | 40 | 57 |
| Power Shot | control | 105 | 50 | 82.8 |
| Power Shot | candidate | 232 | 40 | 63 |

Gross damage (base component, pre-charge-multiplier) matches the authored 50 → 40 cut exactly.
HP damage (post-mitigation, post-multiplier) falls by less than 20% in both cases — consistent
with the packet's own qualification note that an authored attack cut is not a promise of an
equal final-HP-damage cut. Charged multipliers were held fixed: Power Shot is 2.2× in both arms
(1.8 was not installed anywhere in this dataset).

Paired-same-state ratios (`pairedSameState`, matched cast ordinal + resolve time, so both runs
are still in the same state) give the isolated per-hit effect directly:

| Cast | Matched pairs (n) | Pairs with no comparable hit | Median ratio (control ÷ candidate) | Median HP reduction |
|---|---:|---:|---:|---:|
| Strong Kick | 33 | 8 | 1.300 | 30.0% |
| Power Shot | 14 | 22 | 1.306 | 30.6% |

Power Shot's 22-of-36 divergence rate is reported as-is: most attempted pairs left the same-state
window before a matchable cast, most plausibly because candidate survivors change the fight's
later trajectory. This is not folded into a nonzero count and is not read as "no effect" either —
the 14 pairs that do match show a consistent ~30% cut.

## Root / node / seed outcomes — all pairs, all four joint categories

Terminal outcome per matched control/candidate pair (36 pairs = 6 roots × 2 nodes × 3 seeds).
"died" = `player-died`; "survived" = `window-ended` (full 300 s).

### `node-t1-mountain-01` (heavy)

| Root | s75011 | s77003 | s79001 | Control survived/3 | Candidate survived/3 |
|---|---|---|---|---:|---:|
| striker | died → **survived** | died → died | died → **survived** | 0 | 2 |
| squire | died → **survived** | died → **survived** | died → **survived** | 0 | 3 |
| apprentice | died → died | died → **survived** | died → **survived** | 0 | 2 |
| slinger | died → died | died → died | died → died | 0 | 0 |
| conduit | survived → survived | survived → survived | survived → survived | 3 | 3 |
| spirit | died → died | died → **survived** | died → **survived** | 0 | 2 |

### `node-t1-mountain-02` (swarming)

| Root | s75011 | s77003 | s79001 | Control survived/3 | Candidate survived/3 |
|---|---|---|---|---:|---:|
| striker | died → **survived** | died → **survived** | died → **survived** | 0 | 3 |
| squire | died → **survived** | died → **survived** | died → **survived** | 0 | 3 |
| apprentice | died → **survived** | died → died | died → died | 0 | 1 |
| slinger | died → **survived** | died → **survived** | died → **survived** | 0 | 3 |
| conduit | died → **survived** | survived → survived | survived → survived | 2 | 3 |
| spirit | survived → survived | died → **survived** | survived → survived | 2 | 3 |

### Joint outcome totals (all 36 pairs)

| Joint category | Count |
|---|---:|
| control died → candidate survived | 21 |
| control died → candidate died | 8 |
| control survived → candidate survived | 7 |
| control survived → candidate died | **0** |

The fourth category — the one that would indicate the package makes things actively worse for a
build that was previously safe — does not occur in this dataset. That is bounded, not proof of
safety at other seeds, roots, or node contexts.

## Systematic early failure (Striker/Squire/Apprentice): relieved unevenly, not closed

Durability34 found Striker, Squire, and Apprentice dying in all three seeds in both arms on the
guard-substitution screen. Here, moving to enemy-side pressure:

- **Squire** is fully relieved on both nodes (3/3 candidate survival, both nodes).
- **Striker** is fully relieved on swarming (3/3) and partially on heavy (2/3 — one seed,
  s77003, still dies at 129,900 ms candidate vs. 24,900 ms control).
- **Apprentice** is the one root that stays mostly unrelieved: 2/3 on heavy, only **1/3 on
  swarming** — worse relief than every other previously-failing root on that node.
- **Slinger** was not part of the three named roots but is worth flagging: 0/3 candidate
  survival on heavy (identical to control, just later — deaths move from 14,500-23,100 ms to
  146,300-288,800 ms) while reaching 3/3 on swarming. Slinger's heavy-node failure is untouched
  by this package.

Ordinary occasional deaths and class asymmetry are not automatic rejection criteria per the
packet's own framing, but Apprentice-on-swarming and Slinger-on-heavy are the two combinations
where this package does the least.

## Does the swarming context become disproportionately easy?

Yes, relative to heavy, by a margin worth flagging. Control-arm baselines are close between the
two nodes (heavy 3/18 survived = 17%, swarming 4/18 survived = 22%), but candidate-arm outcomes
diverge sharply: heavy candidate 12/18 survived (67%), swarming candidate **16/18 survived
(89%)**. The same authored attack cut (50 → 40, both species) produces a much larger survival
swing on the swarming node than on the heavy node it was meant to fix. This is a finding about
node-relative sensitivity, not a claim that swarming becomes trivial in absolute terms — Slinger
and (partially) Apprentice/Conduit still show non-zero control deaths there.

## Early fatal sequences and low-HP survivors

All 8 earliest deaths in the block (13,200-23,700 ms) are **control-arm**, spread across Squire,
Slinger, Striker, and Apprentice on both nodes — confirming the control arm's failures are fast,
not attritional. Candidate-arm deaths, where they still occur, happen much later (e.g. Striker
heavy s77003: 24,900 ms control → 129,900 ms candidate; Apprentice swarming s77003: 182,600 ms →
259,800 ms).

Low-HP survivors (near-misses, not deaths-only medians) show the candidate arm is not simply
"safe with margin" — several runs end the 300 s window within single-digit percent of a death:

| Cell | Seed | Min HP fraction |
|---|---:|---:|
| dur35-mtn-02-spirit-control | 75011 | 0.035 |
| dur35-mtn-02-apprentice-candidate | 75011 | 0.036 |
| dur35-mtn-01-apprentice-candidate | 79001 | 0.037 |
| dur35-mtn-02-squire-candidate | 75011 | 0.075 |
| dur35-mtn-02-striker-candidate | 79001 | 0.121 |
| dur35-mtn-01-spirit-candidate | 77003 | 0.126 |
| dur35-mtn-01-squire-candidate | 75011 | 0.155 |
| dur35-mtn-01/02-striker-candidate | 79001/75011 | 0.169 / 0.169 |

Squire and Apprentice candidate runs both include a survivor that ended under 8% HP — the
recorded outcome is "survived", but the margin is thin, not comfortable.

## Alive time per arm alongside run counts

Equal run counts (3 per cell) do not imply equal exposure — candidate runs that survive the full
window log five to twenty times the alive time of a control run that dies early. Average
`elapsedMs` per node/root/arm (n=3 each):

| Node | Root | Control avg alive (ms) | Candidate avg alive (ms) |
|---|---|---:|---:|
| heavy | striker | 47,633 | 243,300 |
| heavy | squire | 29,433 | 300,000 |
| heavy | apprentice | 69,100 | 280,833 |
| heavy | slinger | 17,733 | 213,200 |
| heavy | conduit | 300,000 | 300,000 |
| heavy | spirit | 176,633 | 232,667 |
| swarming | striker | 131,367 | 300,000 |
| swarming | squire | 21,733 | 300,000 |
| swarming | apprentice | 167,067 | 250,600 |
| swarming | slinger | 103,733 | 300,000 |
| swarming | conduit | 271,033 | 300,000 |
| swarming | spirit | 258,967 | 300,000 |

The gross-durability TTK figures in `analysis.md` (kill counts, clean N) scale with this same
alive-time expansion — e.g. Squire heavy goes from 4 kills/censored-5 (control, 29 s average
alive) to 59 kills/censored-2 (candidate, full window) — and must be read per-cell for that
reason, not pooled.

## Owner and summon damage: Conduit stays attributable

Conduit deals damage only through minions by design (`CannotAttack`). Confirmed directly from
`index.json` across all 12 Conduit observations (both nodes, both arms): `attackBeats: 0` in
every single one, with `minionAttackBeats` ranging 341-535 per run. Zero owner attack beats is
the expected shape for this root at T1, not missing exposure, and Conduit's survival numbers in
the tables above should be read as minion/summon durability, not player-melee/ranged durability.

## Final-blow attribution, kept separate from the whole fatal sequence

37 deaths total across the block. From `mountain-pressure-casts-summary.json` (`finalBlows`):

| Final blow | Count |
|---|---:|
| Cliff Hopper — charged: Strong Kick | 17 |
| Ridge Ambusher — charged: Power Shot | 5 |
| Ridge Ambusher — unmatched to any cast | 10 |
| Cliff Hopper — unmatched to any cast | 5 |

22 of 37 (59%) killing blows resolve to a named charged cast; the remaining 15 of 37 (41%) carry
no ability id on the killing damage event and are labelled **unattributed**, per the audit's own
convention, rather than assumed to be a basic attack. `mitigation.grossDamage` was not used to
read a coefficient effect for any charged hit, per the packet's instruction — the paired-same-
state ratios above are the source for that.

## Uncertainty and what this packet does not establish

- Three seeds per cell is a directional sample, not certification, for every claim above.
- Apprentice-on-swarming (1/3 candidate survival) and Slinger-on-heavy (0/3 candidate survival,
  unchanged from control) are named remaining gaps, not incidentally omitted — this package does
  not relieve them.
- The swarming/heavy asymmetry (89% vs 67% candidate survival) is measured, not explained; this
  packet does not diagnose why the same attack cut lands harder on the swarming node.
- Power Shot's paired-same-state sample is thin (14 of 36 attempted pairs comparable); the
  30.6% median cut is real for those 14 pairs but is not a block-wide guarantee.
- Conduit's high survival is a missing-owner-exposure condition by design, not player durability,
  on both nodes and both arms — do not cite it as class durability evidence for the enemy-side
  package.
- Zero occurrences of the "control survived → candidate died" joint category is bounded evidence
  from these 36 pairs, not proof that the package can never make a previously-safe seed worse.
- No mob closure, no playtest readiness, and no adoption decision is claimed or made here — that
  belongs to the command center.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability35-20260918`

Key artifacts:

- `operator-exit.json`
- `results/batch-manifest.json`, `results/batch-ended.json`, `results/operator-ledger.jsonl`
- `results/mountain-pressure/{manifest,index,complete,verification,analysis}.json`,
  `analysis.md`, `night5-audit.json`
- `results/audits/mountain-pressure-casts.json`,
  `results/audits/mountain-pressure-casts-summary.json` (charged-cast attribution incl.
  `pairedSameState`), `results/audits/mountain-pressure-guard-windows.json`
- `results/mountain-pressure/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`
  for all 72 observations

No `stopped.json` was produced at block or batch level. The detached worktree at
`.../durability35-20260918/source` remains checked out at the frozen revision; it was not
cleaned up per the operator boundaries (no unplanned deletion of evidence or working state).
