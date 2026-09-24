# Subsystem patch candidate 01 — Astra handoff

## Purpose

Prepare and validate the first shallow item/ability subsystem patch after the class-balance pass.

This is **not** a new broad optimization campaign. The preceding item/ability screen already completed 44/44 observations and supplied direct matched evidence for the three candidate numerical changes below. Reuse that evidence rather than recreating it.

The goal is:

1. implement a small, reversible candidate patch;
2. retire Blood Offering cleanly;
3. run only a bounded combined-regression packet;
4. return a decision-ready patch recommendation for designer approval.

Do not alter class coefficients, Heat values, encounter values, or unrelated equipment.

## Source boundary

Start from the current committed `develop` baseline after the Heat-management correctness closeout.

Record:
- exact starting SHA;
- exact candidate SHA(s);
- tree hashes;
- all files changed.

If unrelated local edits exist, isolate this work in a clean worktree. Do not import unfinished changes.

## Candidate P1 — Desert kiting-boot progression compression

Keep flat Speed values and all acquisition/economy fields unchanged.

Change only the authored `mobility.kite-speed-pct` progression:

- T2 Desert boots: **0.20 → 0.20** (unchanged)
- T3 Desert boots: **0.30 → 0.25**
- T4 Desert boots: **0.40 → 0.30**

Rationale:
- preserve the kiting identity and meaningful utility;
- make the tier-to-tier bonus curve less steep;
- avoid treating kiting boots as a mandatory escalating movement multiplier;
- do not change the base movement-speed progression in this patch.

This is a design-directed compression, supported by the previous comparison being small/mixed rather than by evidence that the current values are causing a universal balance failure.

## Candidate P2 — Swamp slow-resistance progression compression

Preserve the slow-resistance identity. Do **not** convert it to tenacity or hard-control resistance.

Target completed-item values:

- T1 +5: **0.40** (unchanged)
- T2 +5: **0.50**
- T3 +5: **0.60**

Implement the same sealed curve used by the previous item/ability experiment unless current source has changed:

- T1: unchanged.
- T2 base: **0.45 → 0.40**.
- T2 upgrade resistance deltas: replace the current sequence with **+0.02 each step**, producing 0.50 at +5.
- T3 base: **0.62 → 0.50**.
- T3 upgrade resistance deltas remain **+0.02 each step**, producing 0.60 at +5.

Do not change flat Speed values.

Before editing, verify that evolving a completed predecessor into the next tier does not create an unintended regression beyond this declared curve. Report the resulting base and +1…+5 values for every tier.

Do not invent a T4 Swamp successor in this task. If the lineage still ends at T3, record that as a future design note.

## Candidate P3 — Arcanist Core

Keep Technique cooldown reduction unchanged at **0.20**.

Change only:

- `technique.power-pct`: **0.20 → 0.30**

No Guard benefit, cast-speed change, cooldown change, eligibility change, acquisition change, or new downside is authorized.

The previous screen showed a consistent increase in delivered player-source AoE HP damage in the tested Reverb and Idolwright packages, but mixed completed-kill results. Treat this as a modest specialization buff, not as proof of a universal throughput increase.

## Candidate P4 — retire Blood Offering

Designer decision: Blood Offering does not belong in the Rite system and should be retired.

This is a compatibility / product change, **not a combat-balance experiment**.

Implement retirement so that:
- new players cannot acquire it;
- it cannot be newly equipped;
- legacy saves containing it remain load-safe;
- a legacy equipped copy no longer applies its healing effect;
- any RP reserved by a legacy equipped copy is released / excluded from loadout cost;
- old IDs remain safely normalized or ignored rather than crashing/deserializing badly;
- UI surfaces do not advertise it as an available Rite.

Do not invent a replacement Rite.
Do not refund essence/catalysts unless separately authorized.
Historical experiment reports remain unchanged.

Add focused migration / normalization / loadout-cost tests.

## Explicit no-change decisions

Do **not** change these from the previous screen:

- Power Strike
- Quick Strike
- Frenzy
- Endure
- Swift Repose
- Ability Reprieve
- other Rites
- Rune RP costs
- stances
- other cores/relics/weapons/armor/charms/boots
- class coefficients
- encounter numbers
- Heat thresholds or formulas

The previous comparison showed Power Strike vs Quick Strike was package-specific, not a universal winner. Rite contrasts were mixed/negative and did not support tuning.

## Combined regression experiment

Do not repeat the 44-case item/ability screen.

Prepare **24 fresh observations maximum** using two fixed seeds (`101009`, `101033`) and the same synthetic/fixed-build discipline as prior balance packets.

### Block A — Arcanist regression: 8 observations

Use two established Technique-relevant packages:

1. **Reverb**
2. **Idolwright**

For each package:
- current baseline source;
- combined candidate source;
- two seeds.

Use the exact fixture, progression checkpoint, gear, stance, abilities, Rune policy, and observation cap from the previous Arcanist comparison where possible.

Total: `2 packages × 2 arms × 2 seeds = 8`.

Required measurements:
- completed work at equal endpoints;
- owner minimum HP;
- Technique starts/fires/aborts;
- delivered player-source AoE HP damage where supported;
- any cast/channel/summon-delivery anomaly.

Do not add an additional Tempered arm: the previous screen already contains that opportunity-cost evidence.

### Block B — Desert mobility regression: 8 observations

Use two packages whose current behavior meaningfully exercises kiting:

1. the prior **desert-ranger** package;
2. one additional ranged package from the closing T4 references with sustained `Keep Distance` use and no channel/stationary exception.

For each:
- baseline source;
- combined candidate source;
- two seeds.

Use the same slow/ranged-pressure fixture as the previous D comparison where possible. Do not change boots, weapon, stance, or Runes besides the source-side candidate values.

Total: `2 packages × 2 arms × 2 seeds = 8`.

Required measurements:
- completed work;
- owner min HP / damage taken;
- time actively kiting / away-motion exposure if already recorded;
- target-contact / attack-delivery gaps if already available.

The candidate is not required to win. We are checking that the compressed bonus still supports the intended ranged-kiting role without a severe regression.

### Block C — Swamp slow-resistance regression: 8 observations

Use:
1. the prior **T2 slow-exposure** package;
2. the prior **T3 slow-exposure** package.

For each:
- baseline source;
- combined candidate source;
- two seeds.

Use the same fixtures and progression snapshots as the previous S comparison.

Total: `2 packages × 2 arms × 2 seeds = 8`.

Required measurements:
- completed work;
- min HP / damage taken;
- sampled slow/root exposure;
- effective movement while slowed where already available.

Do not add a T4 arm merely to fill the matrix.

### Total

`8 + 8 + 8 = 24 fresh observations maximum.`

If an exact previous fixture/package cannot be reconstructed from the retained receipts, do **not** improvise a materially different build. Bring the exact incompatibility back to the command center.

## Interpretation rules

This is a regression / adoption test, not a search for perfect parity.

Recommend adoption when:
- the intended item/core identity remains intact;
- no major new survival or delivery regression appears;
- the candidate moves the design in the intended direction;
- counterexamples are acceptable and clearly stated.

Do not reject a deliberate nerf merely because it lowers throughput.
Do not approve a buff merely because one seed gains kills.

For Arcanist, prioritize whether the core meaningfully improves eligible Technique contribution without introducing an obvious exploit or delivery regression.

For mobility, prioritize whether the intended utility remains credible after compression.

## Deliverables

Primary deliverable: readable `REPORT.md`.

Also provide:
- compact `results-summary.json`;
- exact resolved build receipts;
- candidate diff / commit identities;
- focused compatibility-test results for Blood Offering retirement;
- a short `PATCH_DECISION.md` containing four separate dispositions:
  - Desert boot curve: adopt / revise / reject;
  - Swamp slow-resistance curve: adopt / revise / reject;
  - Arcanist 30% Technique Power: adopt / revise / reject;
  - Blood Offering retirement: ready / blocked, with exact reason.

Do not combine the four decisions into one all-or-nothing verdict.

## Publication

Commit and push the scoped report, compact evidence, and candidate preparation to the assigned experiment branch. Verify the remote publication.

Do not merge to `develop`.
Do not deploy.
Do not launch additional combat automatically.
