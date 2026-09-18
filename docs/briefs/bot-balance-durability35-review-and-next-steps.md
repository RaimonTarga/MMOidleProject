# Durability35 review, corrected from raw artifacts — adoption, and the Durability36 assignment

Date: 2026-09-18. Execution snapshot `f123d46b`, tree `93f32398`. Corrections and the adoption
patch made at the current working revision.

Status: **Command-center review, reprocessed from the sealed raw artifacts. D35 was not rerun.
The T1 Mountain package is now IMPLEMENTED in development source; nothing else was adopted and
no cohort was launched.**

Derived audits: `AppData/Local/mmo-idle/audits/durability35-20260918/`. The sealed tree was read,
never modified.

## 1. What D35 established, verified against raw

| Context | Control survived | Candidate survived |
|---|---:|---:|
| node-01 heavy | **3/18** | **12/18** |
| node-02 swarming | **4/18** | **16/18** |
| Total | 7/36 | **28/36** |

Joint outcomes over 36 pairs: 21 control-death/candidate-survival, 8 both died, 7 both survived,
**0 adverse flips**. Survival 19.4% → 77.8%. Descriptive observations on three seeds, not
population guarantees, and no zero-death requirement is implied.

The heavy Slinger is still 0/3 at the terminal endpoint, but its deaths move from 14.5–23.1 s to
146.3–288.8 s. Calling that "untouched" would discard a large improvement; it is a **sustained
farming** concern, and it goes into Durability36.

## 2. Corrections

### 2.1 The reduction figures — a real orientation defect in my tooling

`charged-cast-audit.mjs` sorted arm names alphabetically, formed `armB/armA`, and computed
`1 - median`. For `['candidate','control']` that yields **control/candidate**, so the reported
"reduction" carried both the wrong sign and the wrong denominator.

| Cast | Reported | Correct (matched, per hit) |
|---|---|---|
| Strong Kick | ratio 1.300 → "30.0%" | **23.08%** |
| Power Shot | ratio 1.306 → "30.6%" | **23.44%** |

Fixed in schema 4: baseline and comparison are **declared** (`--baseline` / `--comparison`) or
resolved from a conventional-name list, never alphabetical; the reduction is computed **per hit**
as `(baseline − comparison)/baseline` before being summarised, because a nonlinear transform of
an even-sample median is not the median of the transformed samples. The defect was introduced in
schema 3 when I generalised arm handling — Durability33's −18.71% used the correct hardcoded
orientation and stands.

Pooled medians also do not support "both below 20%": Strong Kick 65 → 57 is 12.31% and Power
Shot 82.8 → 63 is 23.91%. Those are descriptive pooled comparisons over unequal counts.

### 2.2 Counting units, not a broken dataset

`matchedHits` counts hits; `pairsWithNoComparableHit` counts run pairs. They were never meant to
sum. Recomputed and now reported separately:

| Cast | Matched hits | Matched run pairs | Pairs with no comparable hit |
|---|---:|---:|---:|
| Strong Kick | 33 | **28** | 8 |
| Power Shot | 14 | **14** | 22 |

28 + 8 = 36. The dataset was consistent; the labels were not. Matching on ordinal and timestamp
shows **timing** alignment only — it does not establish equal source identity, HP-dependent
mitigation, barrier or guard state — so the contrast is labelled timing-matched.

### 2.3 minHP is not terminal HP

Only **4 of 35** survivors ever dipped below 8%, and their terminal HP is far higher: one run
with minHP 0.169 ended at 0.925. Brief near-misses and ending at low HP are different
observations, and the report's "ended below 8%" wording is withdrawn.

### 2.4 Per-node runtime, not a pooled median

A pooled 50/40 gross median does not describe the heavy node. Read from READY:

| Node | Modifier | Control runtime attack | Candidate runtime attack |
|---|---|---:|---:|
| node-t1-mountain-01 | heavy | **55** | **44** |
| node-t1-mountain-02 | swarming | 50 | 40 |

Authored, per-node runtime and final damage stay distinct fields.

### 2.5 Swarming is not "disproportionately easy"

16/18 versus 12/18 is a difference in observed outcomes. Swarming still contains deaths and
low-HP survivors. Calling one modifier too easy is a design conclusion needing pressure,
throughput, recovery and intended modifier roles — and it is **not** a reason to raise its damage
or undo the package.

### 2.6 Conduit — blanket exclusion removed

`CannotAttack` describes the **owner's outgoing attacks**. It does not invalidate the build's
survival and does not mean only minions took damage. Conduit stays in six-root viability tables;
owner exposure and minion damage are reported separately, and an isolated Power-Shot claim needs
owner-targeted shot evidence. The "missing-owner-exposure by design" exclusion is withdrawn.

### 2.7 Scoping my own overstatement

"No T3 TTK anywhere in this campaign" was too broad. Scoped correctly: there is no compatible
**Jungle lineage** T3 timing evidence. Other biomes' T3 studies exist. Durability36 Block J
measures the Jungle ladder directly rather than inferring it from authored HP.

## 3. Adoption — implemented

`ridge-archer.stats.attack: 50 → 40` and `cliff-hopper.stats.attack: 50 → 40`, written as
**absolute authored values** in `shared/src/data/monsters/mountain.monsters.ts`. Power Shot stays
2.2, Strong Kick 1.9, and HP, cadence, range, movement, modifiers, ecology, rewards, abilities
and RP are untouched.

Guards against the two failure modes that matter after an adoption:

- `server/test/t1MountainPressureAdoption.test.ts` asserts the live values, that a second 20%
  cut (which would reach 32) has not happened, that everything the package was required not to
  move is unchanged, that no other Mountain species was swept along, and that both charged
  attacks still carry a multiplier with **no flat damage field** — the structural property that
  makes the base cut reach Power Shot and Strong Kick.
- The Durability35 overlay is **retired**: its table now reads `[40, 40]`, so installing it is a
  no-op and the cut can never be applied twice. `DURABILITY35_ADOPTED_FROM` keeps the history.
- Durability32/33/34 drift asserts are rebased from 50 to 40. Historical experiments remain
  reproducible at their own frozen revisions.

## 4. T2 Mountain Striker — dispositioned by extraction, no new grid

Extracted from the existing Durability29 `mountain2` artifacts (12 Striker observations):

| Arm | Deaths | Time to death |
|---|---:|---|
| control | **6/6** | 98.9, 174.1, 253.9, 258.2, 367.3, 456.1 s |
| candidate | **3/6** | 101.9, 359.5, 569.7 s — plus three full 600 s windows |

Killing blows: Granite Titan ×4 and Boulder Thrower ×4, and **seven of eight are
`unmatched-to-any-cast`** — ordinary attacks at 65/70, not a special. Only one death ended on a
charged Huge Boulder. Distinct recent damage sources before the fatal blow: **1–2**.

**Disposition: sustained attrition from ordinary attacks by two species over 100–570 s.** It is
neither a terminal-mechanic problem nor a concurrency problem, so the "concurrency versus killing
blow" discriminator is answered without running anything. The attack relief roughly doubled
time-to-death and halved deaths, which is consistent with an attrition problem and is an
improvement, not "no help".

**No new experiment is proposed.** The remaining question is whether the halved rate is
acceptable for a first pass — a command-center call, not a measurement gap.

## 5. Durability36 — 72 observations, two independent blocks

Frozen packet: [bot-balance-durability36-operator-packet.md](bot-balance-durability36-operator-packet.md).

**Block M `mountain-armor` — 18.** Three residual contexts (Slinger/heavy, Apprentice/heavy,
Apprentice/swarming) × reference/local-armor × D35's seeds, reused deliberately to revisit those
cases. One item changes: `swamp-vest-t1` → `mountain-vest-t1`. Verified from source — Arcane
Wrappings carries maxHp 30 / plating 4 and `defense.dot-resistance` 0.2; Fallen Knight Plate
carries maxHp 32 / plating 5 and `guard.potency-pct` 0.15, and is **not** a damage-cap item.
Mountain has no DoT, so the swamp mechanic is inert there while the plate amplifies Second Wind.
This is the whole armor substitution, not an isolated guard-potency estimate.

**Acquisition boundary, preserved in the packet:** the plate recipe needs Mountain level 2 and +3
needs level 4, so this is a **post-acquisition farming adaptation**, not protection owned on the
first step into Mountain. Success here must not be read as fixing first entry.

**Block J `jungle-ladder` — 54.** Six roots × T2/T3/T4 × three fresh seeds, one configuration per
tier, no HP arms. Verified rather than assumed: all three `node03` Jungle nodes carry the
**dominion** modifier, so the modifier roles are comparable across tiers. T4 installs the
retained Durability34 package (apex 2900, constrictor 3400) as an overlay and restores it; the
installer asserts the package is either fully pre-adoption or fully live and **refuses to guess**
at a half-integrated state, so it can never be applied twice. Primary lineage is Jungle Ape (T2)
→ Silverback (T3) → Apex Silverback (T4), with the constrictor reported as a separate T4 role.

Both blocks are independent; neither gates the other. The navigation watch runs on Block J as
existing protection, not a new study.

## 6. Remaining-mob decision table

| Area | Status | What decides it |
|---|---|---|
| T1 Mountain pressure | **implemented** (`attack 40`) | done; runtime-checked by the adoption test |
| T1 Mountain residual cases | **open-exception** | D36 Block M |
| Jungle T4 durability | **approved-for-integration** | in the manifest; apply with the consolidated patch |
| Jungle cross-tier pacing | **open-exception** | D36 Block J |
| T2 Mountain Striker | **open-exception, dispositioned** | attrition, not a mechanic; command-center call on acceptability |
| Power Shot 1.8 | **parked** | not combined, not disproven |
| The other 30 retained packages | **selected** | one consolidated patch + regression |
| ECON-1 | **named gate** | after the consolidated baseline |

## 7. What is closed, and what is not

**Closed:** the D35 orientation, counting-unit, minHP and per-node runtime corrections; the T1
Mountain adoption; the T2 Striker causal question.

**Not closed:** the T1 residual cases; Jungle cross-tier pacing; the 30-species consolidated
patch; ECON-1; and the boss pass, which reuses the user's manual mechanic playtesting.

**Full experiment not launched.**
