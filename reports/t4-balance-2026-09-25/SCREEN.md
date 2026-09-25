# T4 class balance: paired screen (2026-09-25)

Branch `feat/t4-balance` against `develop` `7094727e`. Proposals come from the
[T4 scaling study](../t4-scaling-study-2026-09-25/STUDY.md).

## What was adopted

| Path | Change | Tunable (recommended value) |
|---|---|---|
| Voidwalker | The stored-energy discharge now multiplies the **mitigated** base hit. The early execute projects with the same helper, from `onHit`. | none (correctness) |
| Berserker | Rampage attack-cooldown reduction per stack drops from 60 to 30 ms. | `cadence.rampage-aps-per-stack-ms` on the node = **30**; fallback `RAMPAGE_APS_PER_STACK_MS` |
| Juggernaut | A logarithmic knee past +100% replaces the unbounded +1%/s tail. The user chose this over the study's hard cap. | `CRESCENDO_KNEE_MULT` = **1.0**, `CRESCENDO_KNEE_SCALE` = **0.1** (`cadence/t3/core/crescendo.ts`) |

**Held:** Melter and Invoker. The study grades them "needs broader coverage before
adoption" and "modest, no evidence every build is overpowered". Devout Priest and
Apprentice are on hold per the program.

## Screen design

The runner is `server/bench/balance/t4ScalingStudy.ts screen`, baseline arm only. The
identical runner file ran once in a develop checkout and once on the branch.

- **Size:** 37 specs per arm.
- **Specs:** probes at +0/+5 over 120 s; farm at +0/+5 × seeds 173/947 over 300 s; the
  Iron-Crest Titan dungeon at +0/+5 × 2 seeds.
- **Sentinels:** Invoker probe and Cadence heavy-b probe.
- **Stop rule:** halt if a sentinel moves, a run crashes, or a run hits the wall-ceiling.
  None happened; both sentinels are bit-identical.
- **Raw evidence:** `D:/mmo-idle/t4-balance-2026-09-25/`. The committed files hold only
  per-row results.

Evidence boundaries are the study's. These are synthetic mature-mastery packages, and
+0 is an upgrade sensitivity, not earned T4 entry. Titan results are identical across
seeds, meaning the boss fight is deterministic.

## Results (DPS; Δ = branch vs develop)

**Voidwalker** (`energy-heavy-t3-a`)

| Case | develop | branch | Δ |
|---|---|---|---|
| Probe, bare target +0 / +5 | 721 / 1,259 | 721 / 1,259 | 0 / 0 |
| Probe, armored (plating 50, DR 0.4) +0 / +5 | 460 / 888 | 210 / 531 | −54% / −40% |
| Titan +5 | kill 47 s | kill 50 s | −3.7% |
| Titan +0 | kill 76 s | **died 87 s** | kill → death |
| Farm +5 (seeds 173 / 947) | 657 / 647 | 603 / 640 | −8% / −1% |
| Farm +0 (seeds 173 / 947) | 395 / 422 | 399 / 363 | survival flips both ways |

The bare-target probe is unchanged to the unit. That shows the fix adds no other scaling
and only restores mitigation, which settles the study's "exactly once" concern.
Universal empowered bonuses (`shared.empowered-mult-add`, `weapon.empowered-mult-bonus`)
still skip this path, as they skip every suppressed energy discharge. That behavior is
unchanged.

**Berserker** (`cadence-heavy-t3-a`)

| Case | develop | branch | Δ |
|---|---|---|---|
| Probe, default weapon +0 / +5 | 548 / 820 | 508 / 760 | −7.3% |
| Probe, Plague Axe +0 / +5 | 1,300 / 2,491 | 1,118 / 2,142 | −14.0% |
| Titan +5 / +0 | 95 s / 142 s | 101 s / 149 s | −6.1% / −6.4% |
| Farm +5 (seeds 173 / 947) | 697 / 746 (died 198 s) | 606 / 620 (survived) | −13% / −17% |

The strongest combination (Plague Axe) loses twice as much as the default weapon, which
is the study's target. Farm at +0 dies at 13–28 s in both arms for every cadence path;
that is a setup artifact.

**Juggernaut** (`cadence-heavy-t3-c`)

| Case | develop | branch | Δ |
|---|---|---|---|
| Probe 120 s +0 / +5 | 431 / 642 | 420 / 627 | −2.4% |
| Probe 600 s +5 | 1,123 | 673 | −40% |
| Titan, farm (all 8 rows) | — | identical | 0 |

The knee only binds in uninterrupted ideal-access fights. Titan and farm never push
Crescendo past +100%: the Titan fight runs 149–233 s but is unchanged, so the in-combat
timer must reset during it. The study's `cap100` arm showed the same null.

## Open for the user

- **Sign off numbers:** 30 ms, knee 1.0, scale 0.1.
- **Voidwalker at +0 no longer kills the Titan.** The fix is a correctness fix, and +0
  is a sensitivity case. The only compensating knob is authored `energy.empowered-mult`;
  I do not recommend touching it, because at +5 the live deltas are −1% to −8%.
