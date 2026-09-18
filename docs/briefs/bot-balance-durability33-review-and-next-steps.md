# Durability33 review, corrected from raw artifacts — and the Durability34 assignment

Date: 2026-09-18. Execution snapshot `e4e39bc5`, tree `aa24ae5a`. Corrections made at the
current working revision.

Status: **Command-center review, recomputed against the sealed raw artifacts. No cohort
launched by this document and no production monster or reward value adopted.**

The previous review [S1] could not open the Windows-local results and said so. They were
readable here, so every figure below comes from `index.json`, `ready.json`, `events.jsonl` and
`samples.jsonl`. Derived audits are written to a separate directory
(`AppData/Local/mmo-idle/audits/durability33-20260918/`); the sealed tree was read, never
modified. Reproduce with `scripts/survey-audit.mjs`, `scripts/charged-cast-audit.mjs`,
`scripts/species-timing-audit.mjs` and `server/scripts/navigationGate.ts`.

## 1. Accepted: the repair and the gate did their jobs

| Block | Outcome | Navigation |
|---|---|---|
| A `jungle-repair` | 12/12 full 120 s windows, 0 deaths, 0 cutoffs | `pass` — 8/12 exercised, **17 attempts / 17 successes** |
| B `mountain-entry` | 7 windows / 29 deaths of 36 | **`not-applicable`** — the node authors no avoided feature |
| C `jungle-breadth` | 36/36 full 300 s windows, 0 deaths, 0 cutoffs | `pass` — 15/36 exercised, **41 attempts / 41 successes** |

**58 escape attempts, 58 successes, zero failures, zero trapped rows.** Durability32's 18
trapped rows are gone. The dependency gate opened Block C only after Block A was both
artifact-verified and behavior-passed, and the ledger records that decision explicitly.

No further random-seed navigation grid. The measured-coordinate fixtures plus this cohort
answer the question.

## 2. Corrections to the report

### 2.1 The Durability32 stall was diagnosed — this packet targeted it

The report calls the earlier idle freeze a distinct bug that "was never diagnosed or
targeted". It was: located at measured coordinates as a centre-outside / footprint-overlapping
false negative, fixed by moving admission onto `moverOverlapsBlockShapes` with the mover's pad,
and covered by mutation-checked fixtures built from those exact coordinates. No second-bug
investigation is warranted without a new reproducible failure outside that mechanism.

### 2.2 Exposure was undercounted, and the two figures were not comparable

The report compared its 3/12 sampled-geometry exposure against Durability32's superseded
event-based 1/12. The corrected Durability32 figure is 8/12 geometric.

Measured by escape events, Durability33 Block A is **8 of 12** — the same exposure as
Durability32 — with the difference being that in Durability32 zero escapes fired and five rows
froze, while here 17 fired and all 17 succeeded.

This exposed a real flaw in my own gate: at a 1 Hz sample cadence a contact entered and
resolved between samples is invisible. `navigationGate.ts` now takes **both** signals —
escape events and sampled obstruction — and reports `escapeAttempts` / `escapeSuccesses` /
`escapeFailures`, with a failed escape counting as a gate failure. A block whose nodes author
no avoided feature is now **`not-applicable`**, not `inconclusive`.

### 2.3 Mountain: the Striker row is wrong, and here is the checked ledger

Generated mechanically from `index.json`; sums and unique keys checked.

| Root | Control deaths | Candidate deaths |
|---|---:|---:|
| striker | **2/3** | 3/3 |
| squire | 3/3 | 3/3 |
| apprentice | 3/3 | 3/3 |
| slinger | 3/3 | 3/3 |
| conduit | 1/3 | 0/3 |
| spirit | 3/3 | 2/3 |
| **total** | **15/18** | **14/18** |

29 deaths, 7 completed windows, 36 observations — consistent. The report's table said striker
3/3 in both arms while its prose said control 57001 survived; **the prose was right**. Striker
control 57001 completed its window at minHP 0.479; the candidate died at 273,700 ms.

Terminal transitions over all 18 pairs: 13 both-died, 2 both-survived, 2 control-only-death
(conduit 57001, spirit 57001), 1 candidate-only-death (striker 57001). Three flips, matching
the prose.

Roster population is not pressure: the node holds 8 archers, but distinct sources damaging the
player in the 3 s before a landed charged hit is what the audit reports, and it is small.

### 2.4 Conduit: zero owner attack beats is the design, not a defect

Verified in source: the summoner archetype returns `cannotAttack: true`, the server attaches
the `CannotAttack` marker, and **Champion (`battle-bond`) is the one specialization that
restores a direct attack** — unavailable at T1. A T1 Conduit is *supposed* to deal damage only
through its minions, and it logged 94–483 minion beats per observation.

Two separate endpoints, kept separate from here on:

- **Whole-build viability** — summons engage and kill, the observation is productive, the
  build survives. Conduit: 20–22 kills per completed window.
- **Owner susceptibility to Power Shot** — Conduit took **1–2 landed Power Shots on the owner
  in every one of its six runs**, and **died once** (control 57001, 44.1 s). So it is not
  unexposed and not invulnerable.

Calling its survival invalid was a shortcut this chain introduced in the Durability32 review
and then propagated. It is retracted in both documents. Natural protection from a legal class
mechanism is not an artifact.

### 2.5 Power Shot: −18.71% matched, not −22.1% pooled

The pooled 90.6 → 70.6 compared 41 landed hits against 48 drawn from diverging sequences.
Matched hits — same cell, same seed, same cast ordinal, **same resolve time**, so both runs
were still in the same state — give:

| Cast | Matched pairs | Median ratio | Implied change |
|---|---:|---:|---|
| Power Shot | 18 | 0.8129 | **−18.71%** (coefficient change is −18.18%) |
| Strong Kick | 21 | **1.0000** | 0.00% |

Per root: striker 0.875 (−12.5%), conduit 0.811, slinger 0.811, squire 0.814, apprentice
0.825, spirit 0.779 (−22.1%). The spread is subtractive mitigation, root by root.

Strong Kick at ratio exactly 1.000 across 21 matched pairs is the rigorous form of
"unchanged" — equal medians over unequal counts was not.

**A schema trap worth recording:** `mitigation.grossDamage` stays 55 in both arms while
`hpDamage` moves 72 → 63, because a charged attack's multiplier is applied outside the
mitigation record. `hpDamage` can exceed `grossDamage`, and a coefficient treatment is **not**
readable from gross.

The attribution tooling was tightened accordingly: ordering by event `id`, `landed` only on a
unique candidate match (`ambiguous` preserved, never forced), an unmatched final blow labelled
`unmatched-to-any-cast` rather than "basic" since the damage schema carries no ability id,
`hpBefore` carrying its sample age, the standard two-middle-value median, and
`recentDamageSources3s` named for what it counts. Across 176 casts in this block: zero
ambiguous, zero unattributed. Final blows over 29 deaths: 16 Strong Kick, 4 Power Shot, 9
Ridge Ambusher unmatched-to-any-cast.

### 2.6 Jungle survival is not a durability pass

All 36 breadth windows completed with zero deaths and a minimum HP fraction of **0.878–1.000**
(i.e. the worst run never dropped below about 88%). That is bounded survival evidence for
these six builds on these two nodes at three seeds — not an all-build or all-tier safety claim,
and explicitly not evidence that no HP action is needed.

## 3. Jungle species timing — the measurement the mixed medians could not give

2,134 engagements, 2,116 kills, 18 unresolved. Clean TTK aggregated seed → root → equally
weighted across the six roots, so no fast root dominates.

| Species | Role | HP | Clean TTK | Engaged | Clean kills | Cast mechanic fired / engagement |
|---|---|---:|---:|---:|---:|---:|
| `emerald-constrictor` | durable elite | 1700 | **3.55 s** | 511 | 507 | 0 |
| `apex-silverback` | elite alpha | 1450 | **2.90 s** | 587 | 580 | 0 |
| `thornback-lizard` | small | 1000 | 1.77 s | 512 | 506 | 0.17 |
| `hunting-panther` | small | 950 | 1.90 s | 524 | 521 | 0 |

**The authored ladder runs backwards.** The T3 Jungle anchor `silverback` is 2090 HP / 83
attack. Every T4 Jungle species is authored *below* it — the T4 alpha `apex-silverback` is
1450 / 77, a 31% HP drop from its own T3 predecessor.

A caution on mechanics: none of these four authors a `chargedAttack` or `monsterAbilities`, so
"0 casts fired" is not "no mechanic". They carry `rampOnCombat` (apex), `cadenceFinisher` and
`dotEffect` (constrictor), `openingStrike` (panther) and `castedAttackSpeedBuff` (lizard). A
ramp cannot develop inside a 2.9 s body — but raising HP adds duration, **not** a new cast.

## 4. Durability34 — 108 observations, two independent blocks

Frozen packet: [bot-balance-durability34-operator-packet.md](bot-balance-durability34-operator-packet.md).

**Block J `jungle-durability` — 72.** Six roots × two nodes × control/candidate × three fresh
seeds. One HP-only package on the two durable roles: `apex-silverback` 1450 → 2900,
`emerald-constrictor` 1700 → 3400. The fast bodies are untouched so role separation survives.
The magnitude is justified by the ladder inversion, not by an invented duration band: both
candidates clear the T3 anchor of 2090, and expected TTK is roughly 5.8 s and 7.1 s. No
damage, modifier, population, navigation or build-policy change. The navigation gate runs as a
**regression watch**, not a scheduling dependency.

**Block M `mountain-guard` — 36.** Six roots × one node × two guard arms × three fresh seeds,
on Durability33's earned-entry kit. **Power Shot is held at 2.2 in both arms** — this is not
another scalar grid; 1.8 stays on the adoption list, uncrossed.

The arms are a substitution, not an addition: Sweep + Second Wind versus **Sweep + Brace
instead of Second Wind**. Measured costs are Sweep 6, Second Wind 6, Brace 5 against a budget
of 22, so the substitution is **cheaper** — melee 17 vs 18, ranged 20 vs 21. My earlier claim
that "Brace is not affordable at T1" was about *adding* it and is retracted. The freed point is
left unspent.

**Neither guard reacts to a cast.** Both are `hp-below` instants: Second Wind triggers under
60% and heals (recoveryPct 0.5 over 4 s, 12 s cooldown); Brace triggers under 50% for 35%
damage reduction over 3 s on a 10 s cooldown. So the question is sustain versus mitigation
opportunity cost — not reactive counterplay to a telegraph-less, player-tracking Power Shot.

Verified functionally, not by label: a 30 s pilot activated `second-wind` ×2 in the reference
arm and `brace` ×1 in the substitution arm, and the preflight asserts both, plus that the
substitution arm no longer carries Second Wind.

## 5. Economy: the user's hypothesis, recorded as a named gate

> **ECON-1.** At later player tiers, lower-tier nodes in a recurring biome may yield better
> usable essence and biome XP per elapsed minute than current-tier nodes, because combat
> duration has increased without a sufficient reward premium.

**Not established.** Durability33 is synthetic combat evidence with `economyEligible=false`;
it is not an economy result, and no reward value changes in any combat packet.

Why it is worth a gate: the reward path grants biome XP to `biomeGroup` against a cap derived
from the player's tier and group, multiplies essence by tier and node modifier, and keys
catalyst progress by modifier family with tier-dependent scaling — so cross-tier opportunity
cost is a real mechanism, not a guess. Block J would lengthen T4 Jungle fights without touching
rewards, which moves this question rather than answering it.

The screen belongs after the consolidated combat baseline, and its design constraints are
recorded in the campaign state: same later-tier character in both routes, elapsed gameplay
time as the denominator (never accelerated wall time), like-for-like essence and catalyst
families, credited versus nominal XP against caps, and travel/setup reported separately from
steady state. A useful fallback route is not the failure; systematic domination of current-tier
progression is.

## 6. What is closed, and what is not

**Closed:** the navigation repair and the behavioral gate (58/58 escapes, zero trapped rows,
gate opened correctly); Durability33's Mountain ledger, Power Shot effect size, exposure
definitions and Conduit framing; Jungle species/role timing now measured; the Brace
affordability error retracted.

**Not closed:** whether the Jungle HP candidate is right (Block J); sustain versus mitigation
at T1 Mountain (Block M); the 1.8 Power Shot candidate, still unadopted; every retained mob
package, none of which is live; T2 Mountain Striker; and ECON-1.

**Full experiment not launched.**

## Sources

[S1] `bot-balance-durability33-review-and-opus-handoff-2026-09-18.md`.
[S2] `docs/briefs/bot-balance-durability33-report.md`, with its correction record.
[S3] Sealed artifacts under
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability33-20260918`, read only.
[S4] `docs/conduit-current-state.md` and `server/src/ecs/playerEntityFormulas.ts` for
`CannotAttack`; `shared` ability definitions for Brace and Second Wind.
[S5] `shared/src/data/monsters/jungle.monsters.ts` and live node rosters for the T3/T4 ladder.
