# Durability32 review, corrected from raw artifacts — and the Durability33 assignment

Date: 2026-09-18. Reviewed at `7247b6e2` (execution) and the current working revision (corrections).

Status: **Command-center review, corrected against the sealed raw artifacts. No experiment
launched by this document and no production monster stat adopted.**

The previous command-center review [S1] was written without access to the Windows experiment
directories and said so. Those directories **were** readable here, so every number below is
recomputed from `index.json`, `ready.json`, `events.jsonl` and `samples.jsonl` rather than
inferred. Where the prior review's arithmetic was provisional, this says whether it held.

Audit outputs (written outside the sealed input tree, which was not modified):
`C:/Users/osaif/AppData/Local/mmo-idle/audits/durability32-20260918/`. They are reproducible
with `scripts/survey-audit.mjs`, `scripts/charged-cast-audit.mjs` and
`server/scripts/navigationGate.ts`.

## 1. The headline correction: the Jungle stall is a real, located defect

The Durability32 report concluded that 11 of 12 Block A observations "never touched a bush"
and that the five wall cutoffs were therefore an undiagnosed *different* failure. Both halves
were wrong, and the prior review was right to refuse the inference.

Exposure was recomputed from sample positions against the frozen feature geometry:

| Block | Observations | Ever entered the padded avoidance envelope | Ended stationary inside it |
|---|---:|---:|---:|
| A `jungle-repair` | 12 | **8** | 5 |
| C `jungle-breadth` | 36 | **15** | 12 (+1 unexplained cutoff) |

"No `hazard-escape` event" never meant "no exposure": a repair that fails to fire emits no
event either. Eight of twelve Block A rows did reach a bush.

**Every one of the 18 wall-ceiling rows, plus one `window-ended` row, ends with the player
centre 1.6–21.9 px OUTSIDE a bush's raw circle and its navigation footprint overlapping.
Not one ends with the centre inside.** Player navigation half-extents are (22, 18).

| Observation | Final position | Nearest bush | Centre offset | Footprint offset |
|---|---|---|---:|---:|
| A 03-apprentice / 46021 | (4121, 2334) | jungle_bush_2 | +2.19 | −19.81 |
| A 03-slinger / 48017 | (1623, 1104) | jungle_bush_1 | +5.15 | −16.85 |
| A 05-apprentice / 44017 | (1566, 2269) | jungle_bush_1 | +15.53 | −6.47 |
| A 03-apprentice / 48017 | (1253, 2345) | jungle_bush_0 | +17.63 | −4.37 |
| A 03-slinger / 44017 | (1669, 4072) | jungle_bush_4 | +18.75 | −3.25 |
| A 03-apprentice / 44017 *(window-ended)* | (3622, 4084) | jungle_bush_3 | +12.28 | −9.72 |

Every `window-ended` row that is *not* trapped ends 67–1784 px clear. There is no overlap
between the two populations.

The prior review's Durability31-derived offsets (+1.95, +4.82, +15.95, +17.43, +18.53 px)
match these measured Durability32 positions to within rounding. The hypothesis it proposed is
therefore **confirmed, not merely plausible** — and it was confirmed at the exact frozen
coordinates, not by analogy.

### The mechanism, verified end to end

At each measured position, with the frozen geometry:

- `pointInNodeFeatureShape(pos, shape)` → **false** for every bush, so the old escape
  admission never fired and no `hazard-escape` event could exist.
- `moverOverlapsBlockShapes(pos, shapes, (22,18))` → **true**, so the planner's own cell test
  considers the position obstructed.
- `findPathForMover(..., avoidHazards: true)` → **null**.
- `findPathForMover(..., avoidHazards: false)` → a real path.

Auto-target only accepts a reachable candidate, so every monster fails its reachability check
and the intent becomes `"No worthy target nearby"` — which is exactly what the samples record,
with 34–40 live monsters on the node, full HP, no selected target, no motion, no goal.

A walking player stops precisely where the padded footprint first blocks. The centre-point
predicate was therefore a false negative **in exactly the band where hazard-aware pathing had
already died**. That is why only one escape fired across 48 Jungle observations.

## 2. Repair: align escape admission with the planner's own primitive

`dynamicHazardAvoidance.ts` now measures admission, continuation and safe exit with
`moverOverlapsBlockShapes(pos, [shape], pad + clearance)` — the same call
`withDynamicHazards` uses to block a cell. Ground zones and node features share it, so a
toxic-pool edge cannot reproduce the same class of false negative. This is not an arbitrary
inflation constant: it is the mover's own footprint.

`activePlayerDamageFeatures` is deliberately untouched, so out-of-combat Recovery suppression
keeps its narrower real-damage meaning — resting in a harmless bush must still regenerate.

Regression fixtures use the **measured** trapped coordinates and assert the whole chain: the
fixture starts outside every raw shape with an obstructed footprint, hazard-aware planning is
dead and hazard-free planning is not, escape claims ownership, the exit leaves the padded
envelope onto standable ground, ownership releases, and hazard-aware planning succeeds again
from the exit. A near-miss fixture just beyond the envelope must claim nothing. All of it is
mutation-checked: with the pad removed from the predicate the suite fails on
`an obstructed footprint must claim escape ownership`.

This closes the mechanism. It does **not** certify Jungle: only the Durability33 run on
repaired source can do that, and its gate is described below.

## 3. Block B corrected: the multiplier is not the lever, and the context was wrong

### Outcome table, recomputed from all 72 rows

| Context | Arm | Deaths | Observations |
|---|---|---:|---:|
| first-arrival | control | 15 | 18 |
| first-arrival | candidate | 14 | 18 |
| prepared-farming | control | **6** | 18 |
| prepared-farming | candidate | **6** | 18 |

The prior review's provisional arithmetic — 29 first-arrival deaths and **12/36**
prepared-farming deaths — **holds exactly**. Its correction to the report's "5 roots die in
all seeds" also holds: **four** roots die in all three seeds in both arms (striker, squire,
apprentice, slinger); spirit is 3/3 control and 2/3 candidate; conduit is 0/3 in both.

All 36 matched pairs share an identical recorded start-state hash, so the pairing is valid.

| Transition | first-arrival | prepared-farming |
|---|---:|---:|
| died → died | 14 | 2 |
| survived → survived | 3 | 8 |
| died → survived | 1 | 4 |
| survived → died | 0 | **4** |

At prepared-farming the flips are **symmetric**: four each way. The candidate shows no net
survival benefit there. Overall the candidate is 20/36 deaths against the control's 21/36.

### The metric confusion, resolved by attribution

Charged casts were attributed to the damage they actually landed — only where a
`monster-cast-end` with `fired: true` is followed within 200 ms by a damage event from that
same monster onto the player. Nothing is inferred from timestamps alone.

| Cast | Arm | Landed | Interrupted | Median | Max |
|---|---|---:|---:|---:|---:|
| Power Shot | control | 148 | 2 | **68.2** | 101 |
| Power Shot | candidate | 163 | 1 | **55.04** | 83 |
| Strong Kick | control | 83 | 0 | 61 | 87 |
| Strong Kick | candidate | 84 | 0 | 61 | 87 |

So the report's "67 → 61, −9%" was a **metric error**, exactly as the prior review suspected:
67 is the control's largest hit (a Power Shot) and 61 is the candidate's largest hit (an
*unchanged Strong Kick*). The attributed Power Shot moves 68.2 → 55.04, a **−19.3% pooled
median**, against a −18.2% coefficient change. (A stricter same-state paired method, adopted
for Durability33, is the better measure; pooled medians compare unequal hit counts drawn from
diverging sequences. On Durability33 that method gives −18.71%.) Strong Kick is identical in both arms, which is the
control the overlay needed. At T1 mitigation is small enough that the coefficient passes
through nearly proportionally — the packet's caution about mitigation was correct in
principle and close to non-binding here.

### Why a real −19% cut changes almost nothing

| Evidence | Value |
|---|---|
| Deaths with a Power Shot landing in the 10 s before death | **41 of 41** |
| Fatal blows that overkill the HP they hit | **29 of 41** |
| first-arrival matched pairs dying at the *identical* millisecond | **10 of 12** |
| Killing blows: Cliff Hopper Strong Kick / Ridge Ambusher basic / Power Shot / Hopper basic | 29 / 6 / 3 / 3 |

A Cliff Hopper killing blow does **not** exonerate Power Shot — it is present in the pressure
window of every single death. But the deaths are an accumulated deficit finished by a blow
that overkills, so removing ~13 damage from one hit does not move the outcome. That is the
mechanism, and it is why the arms die at the same millisecond.

### The Conduit result — **RETRACTED 2026-09-18**

This section originally read "missing exposure, not class durability". That was wrong and it
propagated into the Durability33 packet and report. Verified in source afterwards: the
summoner archetype returns `cannotAttack: true` and the server attaches the `CannotAttack`
marker, so **zero owner attack beats is the designed behavior of a T1 Conduit**, not missing
combat. Champion (`battle-bond`) is the one specialization that restores a direct attack and
it is not available at T1.

What the data actually supports: Conduit deals its damage through 360–502 minion beats, and
its *owner* takes 0–2 landed Power Shots per run. Low owner exposure limits the narrow
question "how hard does Power Shot hit this owner"; it does not invalidate the build's
survival. In Durability33 the Conduit owner took 1–2 landed Power Shots in every run and died
once. See [the Durability33 review](bot-balance-durability33-review-and-next-steps.md) §2.4.

### The `first-arrival` preset was not a credible first arrival

Checked against the shipped T1 route (`bot/src/routes/apprenticeV2T1.ts`): on first travel to
Mountain a character has maxed Forest and Swamp, carries **+3** gear including a Swamp vest
and charm, and has learned Second Wind, Cleanse and **Brace**. Durability32's preset was +0
previous-biome gear with Second Wind only.

That preset is materially weaker than the game's own progression, which explains 29/36 deaths
in 13–26 s and makes the first-arrival block a poor place to judge Power Shot. It is a
preparation artifact, not a Mountain balance finding.

**A design constraint found while resolving this — later CORRECTED:** the T1 Runic Point
budget is 22, and Sweep (6) + Second Wind (6) + Brace (5) does not fit. The original wording
concluded Brace was "not affordable at T1". That was about *adding* Brace. **Substituting** it
for Second Wind is cheaper than the reference (melee 17 vs 18, ranged 20 vs 21) and is legal
for all six roots. Brace is also an `hp-below` 50% guard, not a response to an incoming cast,
so it was never reactive counterplay to Power Shot. Durability34 Block M tests the
substitution; see [the Durability33 review](bot-balance-durability33-review-and-next-steps.md) §4.

### Disposition

Retain **1.8 as a candidate**; no production change. The audit shows the multiplier is not the
lever for the deaths observed, but it does cut the spike it is aimed at, and it has not yet
been tested at a defensible preparation. Do **not** nerf Strong Kick on the strength of
terminal-blow counts.

## 4. Block C corrected

Raw totals are **23 window-ended and 13 wall-ceiling**, so the report's *summary* was right
and its per-root table was wrong. Recomputed per root across both nodes: apprentice 6 walls,
spirit 4, slinger 2, conduit 1, striker 0, squire 0 — the table printed conduit 0 and spirit 5.

Zero deaths in 36 observations is bounded survival evidence, not proof of safety. With 13 of
36 observations censored by the same navigation defect and their tails idle rather than
fighting, the usable pacing evidence is the 23 clean windows. The reported ~1.5–6.2 s cell TTK
values mix species and include truncated seeds; they are a lead for role-specific review, not
an elite-duration estimate and not an HP-multiplier prescription.

## 5. The dependency gate was semantically wrong, and is now fixed

Durability32's launcher gated Block C on `verifySurvey(...).verified`, which only certifies
that artifacts are well formed. Five correctly recorded wall cutoffs therefore still opened
the gate. This was a tooling defect, not operator disobedience — the operator was never given
a behavioral gate.

`server/scripts/navigationGate.ts` now derives four independent fields from geometry and
samples: `scenarioExposure` (exercised / not-exercised / unknown), `navigationGate`
(pass / fail / inconclusive with reasons and affected rows), `balanceExposure`
(usable / censored / died / unknown), alongside the existing artifact verification.
`scripts/block-gate.mjs` holds the pure decision so it is testable without an experiment.

Run retroactively over Durability32's own artifacts, the gate **fails** both Jungle blocks —
Block A on "5 observations ended stationary inside the padded avoidance envelope", Block C on
12 trapped rows plus 1 unexplained cutoff. Block C would not have run.

`server/test/navigationGate.test.ts` fixes the scheduling behavior: a valid recorded wall
cutoff on a trapped row fails the gate and skips dependent breadth; a never-exercised block is
`inconclusive` and also blocks, because not-exercised is not success; an unexplained cutoff
cannot silently pass; artifact validity alone never opens the gate; an ordinary gameplay death
after real exposure is a gameplay result and passes, and zero deaths is not the gate; identity
failures are global while count mismatches are block-local.

## 6. Durability33

Frozen packet: [bot-balance-durability33-operator-packet.md](bot-balance-durability33-operator-packet.md).
**84 observations**, three separately reported blocks, within the review's 84 cap.

| Block | Purpose | Runs |
|---|---|---:|
| A `jungle-repair` | The four historical Jungle setups × their three historical seeds on repaired source | 12 |
| B `mountain-entry` | T1 Mountain at a defensible earned-entry preparation, control 2.2 vs candidate 1.8 | 36 |
| C `jungle-breadth` | Six roots × two nodes × D32's breadth seeds, **gated on A's behavior** | 36 |

Block B is included because the audit identified the realistic-entry interpretation as the
material gap and located it precisely: the tested first-arrival was too weak for the treatment
to matter (overkill, identical death times) and the tested prepared-farming was +5 local gear
with symmetric flips. The new context is the route's actual arrival kit and sits between them.
Its single delta from Durability32's first-arrival is the earned kit; guards stay at the tier
default so it does not become a guard experiment in the same arm.

No new Jungle HP treatment is proposed. Role-specific timing must come out of Block C first.

## 7. What is now closed, and what is not

**Closed:** the Jungle stall mechanism is located, fixed and mutation-checked; the semantic
gate defect is fixed and fixture-tested; Durability32's Mountain and Block C arithmetic is
corrected from raw data; the Power Shot metric confusion is resolved by attribution; the
`first-arrival` preset is shown to be unrepresentative; Conduit's survival is explained.

**Not closed:** Jungle pacing (needs Durability33 Block A to pass its gate, then C); whether
1.8 is worth adopting (needs Block B); the T1 Brace affordability question (a design decision,
not an experiment); the T2 Mountain Striker exception (see the adoption review); and every
retained mob candidate, none of which is live.

**Full experiment not launched.**

## Sources

[S1] `bot-balance-durability32-review-and-opus-handoff-2026-09-18.md`, the command-center
review this document answers.
[S2] `docs/briefs/bot-balance-durability32-report.md`, the operator's execution record.
[S3] Sealed artifacts under
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability32-20260918`, read and not
modified.
[S4] `server/bench/balance/durability{19,22,24,26,27,29}Spec.ts` for resolved candidate values.
[S5] `bot/src/routes/apprenticeV2T1.ts` and `bot/src/routes/t1Common.ts` for the shipped T1
route's state on first travel to Mountain.
