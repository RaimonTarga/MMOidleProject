# T4 iteration 05: XP-only holdout

Written up 2026-09-25 by the XP pacing session. Codex ran this batch and did not write it up.
Protocol: [README.md](README.md). Candidate: T4 segment 600,000 XP, T4 mastery XP factors
Tundra ×1.8 and Desert ×2.4. Iteration 04 calibrated these values ([RESULTS](../iteration-04/RESULTS.md)).
Essence, catalysts and recipe costs are the live baseline values.

## Verdict

The holdout used new nodes (Tundra 03, Desert 01, Volcanic 03) and new seeds (101051, 101063).
On those, the candidate reproduces the iteration-04 window for the builds it was tuned on:

- Striker (offensive): **49-56 min**
- Conduit without Recover First: **66-87 min**
- Squire with Offensive stance: **84-97 min**

It **does not** generalize to every build:

- Slinger Bounty Hunter in Tundra takes **98-108 min**.
- Spirit Stormdancer never reached mastery (3 deaths, 1 run censored at 120 min).
- Volcanic stalled in all 4 runs. That is the approach/avoidance stall another session
  owns. Volcanic also has no XP factor, so it is uncalibrated either way.

The candidate is a reasonable **first pass** for Tundra and Desert, not a validated T4 curve.

## Receipt

- 24/24 jobs finished with exit code 0. No timeouts, source drift or harness drift
  ([complete.json](holdout/complete.json), [status.json](holdout/status.json)).
- "Finished" means the process ended. Only 16 of the 24 runs reached mastery.
- [summary.json](holdout/summary.json) lists only 10 rows. The table below rebuilds all 24 from
  each run's `.log` receipt (`masteryMs` / `deathMs`) and its last `.progress.json` snapshot.
- Full traces were kept for only 3 runs (Spirit Desert s101063, both Striker Volcanic runs).
- Stop rules: mastery, first death, 3 min without XP (plateau), 120 simulated min, or
  180 wall-clock seconds. A run that ended with no mastery, no death, under 120 simulated
  minutes and under 180 wall seconds is classed as a plateau.
- Segment progress below is XP gained since the segment reset, divided by 600,000. The start
  is 42,000 XP for Tundra and Volcanic and 45,750 for Desert, taken from the traces' `initial.xp`.

## Results

| Build | Stance / key runes | Node | Seed | Endpoint | Minutes | Segment progress |
|---|---|---|---:|---|---:|---:|
| Striker Justicar (balanced, close) | Offensive | desert-01 | 101051 | Mastery | 49.00 | 100% |
| Striker Justicar | Offensive | desert-01 | 101063 | Mastery | 48.72 | 100% |
| Striker Justicar | Offensive | tundra-03 | 101051 | Mastery | 55.53 | 100% |
| Striker Justicar | Offensive | tundra-03 | 101063 | Mastery | 55.69 | 100% |
| Conduit Marshal (balanced, mid) | Defensive, no Recover First | tundra-03 | 101051 | Mastery | 66.77 | 100% |
| Conduit Marshal | Defensive, no Recover First | tundra-03 | 101063 | Mastery | 65.98 | 100% |
| Conduit Marshal | Defensive, no Recover First | desert-01 | 101051 | Mastery | 85.32 | 100% |
| Conduit Marshal | Defensive, no Recover First | desert-01 | 101063 | Mastery | 87.38 | 100% |
| Squire Destroyer (heavy, close) | Offensive, focus lowest HP | desert-01 | 101051 | Mastery | 84.22 | 100% |
| Squire Destroyer | Offensive, focus lowest HP | desert-01 | 101063 | Mastery | 86.49 | 100% |
| Squire Destroyer | Offensive, focus lowest HP | tundra-03 | 101051 | Mastery | 96.57 | 100% |
| Squire Destroyer | Offensive, focus lowest HP | tundra-03 | 101063 | Mastery | 95.73 | 100% |
| Slinger Melter (heavy, mid) | Defensive, Recover First | desert-01 | 101051 | Mastery | 64.52 | 100% |
| Slinger Melter | Defensive, Recover First | desert-01 | 101063 | Mastery | 66.38 | 100% |
| Slinger Bounty Hunter (balanced, mid) | Defensive, Recover First, Orbit | tundra-03 | 101051 | Mastery | 97.70 | 100% |
| Slinger Bounty Hunter | Defensive, Recover First, Orbit | tundra-03 | 101063 | Mastery | 107.78 | 100% |
| Spirit Stormdancer (light, mid) | Defensive, Recover First, Orbit | desert-01 | 101051 | **Death** | 101.78 | 73% |
| Spirit Stormdancer | Defensive, Recover First, Orbit | desert-01 | 101063 | **Death** | 7.21 | 4% |
| Spirit Stormdancer | Defensive, Recover First, Orbit | tundra-03 | 101051 | **Death** | 89.53 | 62% |
| Spirit Stormdancer | Defensive, Recover First, Orbit | tundra-03 | 101063 | **Censored** (120 min) | 120.00 | 84% |
| Striker Justicar | Offensive | volcanic-03 | 101051 | **Plateau** (last XP 0.8 min) | 3.77 | 1% |
| Striker Justicar | Offensive | volcanic-03 | 101063 | **Plateau** (last XP 10.4 min) | 13.42 | 18% |
| Slinger Sniper (light, mid) | Offensive, Orbit | volcanic-03 | 101051 | **Plateau** | ~50 | 86% |
| Slinger Sniper | Offensive, Orbit | volcanic-03 | 101063 | **Plateau** | ~36 | 63% |

The minutes for mastery and death rows come from the receipt. For the Slinger Volcanic plateaus
they are the last 10-second snapshot, because those full traces were not kept.

## Reading

Striker, Squire, Slinger and Spirit all run Recover First; only Conduit was run without it.

**Tuned builds hold.** Every row from iteration 04's calibration set lands inside or next to
its iteration-04 range on new nodes and seeds. Striker is at 49-56 min (was 49-51), Squire
Offensive at 84-97 (was 91-93), and Conduit without Recover First at 66-87 (was 89-92 on
desert-03 and 65-66 on tundra-01). The seed-to-seed spread on the same node is at most 2 min.

**Node matters inside a biome.** Conduit on desert-01 is 2-7 min faster than on desert-03.
Striker on tundra-03 is about 6 min slower than on tundra-01. A single biome-wide factor absorbs
this, but it limits how far any one node's calibration can be trusted.

**Builds outside the tuned set:**

- Slinger Melter in Desert (64-66 min) fits the window.
- Slinger Bounty Hunter in Tundra (98-108 min) is the slowest build that still reaches mastery.
  It sits in the same band as iteration 04's original defensive Squire/Conduit.
- Spirit Stormdancer has a **survival** problem, not a pacing one. It died at 7, 90 and 102
  min, and its only surviving run had reached 84% at 120 min (about 143 min projected).
  A bigger XP factor would not fix this.

**Volcanic.** All four runs plateaued with the player alive. The retained Striker traces show
full HP and "Moving out of a hazard" alternating with target approach. This is the same
signature as iteration 04's stall diagnosis. Slinger Sniper sustained about 10k XP/min before
it stalled (86% by 50 min). That suggests Volcanic without a factor could land near the fast
end once the stall is fixed, but it is not a measurement. Recalibrate Volcanic after the stall
fix lands.

## What this does not establish

- **T2/T3 pacing** (3,750 / 42,000). No viable-fixture validation in this batch or in iteration 04.
- **Defensive builds.** No original Defensive-stance Squire or Recover-First Conduit in this
  batch. Iteration 04 measured them at 110-124 min with the 1.7/2.3 factors.
- **Economy.** Essence earned over a longer mastery is not a validated balance
  (owned by the Economy session).
- **Future tiers** inherit 600k × 1.2 growth. Not calibrated.
- **Boss nodes and the other normal nodes.** Only 2 of about 10 Tundra/Desert normal nodes have
  been run.
- **Real play.** These are bot runs from prepared, mature +4 loadouts at 1× rewards. They are
  not earned progression and not live telemetry.
