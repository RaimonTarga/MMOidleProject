# Mastery pacing re-check after the T2–T4 balance passes (2026-09-28)

Question: after the 2026-09-27/28 balance work (T2–T4 boss pass, Trench trash ×2 HP / ×2.2
rewards, DoTs paying half of DR, the T4 outlier and Conduit passes), how long does it take to max
a biome in each tier? Targets: T2 15, T3 30, T4 60 min per biome segment.

Method: the 2026-09-26 sweep, unchanged (`../xp-sweep-2026-09-26/run.mjs` and
`run-bot-t4-cross.ts`, the same mature survivor loadouts, node `-02`, seed 101051), run from
branch `balance/t4-power-curve` at `8941794b`. T2/T3 use six classes; T4 uses Striker and Conduit
(balanced-a) only, as before. `tables.txt` has every cell; `summary.json` the per-run rows.
Compare with `../xp-sweep-2026-09-26/tables.txt` (sections `cand-calib`, `cand-t4`, and the
T4 "before" column in its RESULTS.md for Tundra/Desert/Volcanic).

## Median minutes to mastery (class median; T4 shown as Striker / Conduit)

| T2 biome | 2026-09-26 | now |   | T3 biome | 2026-09-26 | now |
|---|---:|---:|---|---|---:|---:|
| Cave | 14.3 | 16.0 | | Cave | 29.7 | 25.9 |
| Desert | 15.3 | 14.7 | | Desert | 31.4 | 32.6 |
| Forest | 13.8 | 15.8 | | Jungle | 30.2 | 30.5 |
| Jungle | 15.0 | 16.0 | | Mountain | 30.8 | 31.6 |
| Mountain | 15.0 | 13.6 | | Swamp | 31.4 | 30.7 |
| Plains | 15.5 | 14.9 | | Tundra | 29.6 | 28.4 |
| Swamp | 15.3 | 14.5 | | Volcanic | 30.6–32.0* | 29.1 |

\* Volcanic T3 "before" is the 2026-09-26 final Volcanic pass (`vfinal-*`).

| T4 biome | 2026-09-26 Striker / Conduit | now Striker / Conduit |
|---|---:|---:|
| Desert | 53.9 / 81.9 | 57.0 / 86.1 |
| Graveyard | 54.8 / 71.5 | 57.8 / 76.7 |
| Jungle | 55.4 / 73.5 | 59.7 / 80.9 (died) |
| Mountain | 55.3 / 65.5 | 59.4 / 75.6 |
| Trench | 55.5 / 80.3 | 65.2 / 104.8 (died) |
| Tundra | 58.0 / 67.8 | 63.0 / 74.0 |
| Volcanic | 54.0 / 76.4 | 63.6 / 75.9 |

## Verdict

- **T2 and T3 are still on target.** Every biome median is within about ±15% of 15 / 30 min
  (T2 13.6–16.0, T3 25.9–32.6), and the class spread is unchanged: Spirit/Slinger fastest,
  Squire/Striker slowest at T2.
- **T3 Conduit Desert no longer stalls**: 87 min (projected) before, 47.5 min now. It is still
  the slowest T3 cell.
- **T3 Volcanic stays fixed:** 1 death in 6 (Apprentice), median 29.1 min.
- **T4 is ~5–15% slower than on 2026-09-26.**
  - **Striker:** 57–65 min, on target.
  - **Conduit (balanced-a, survivor loadout):** 74–86 min, ~25–40% over target, as it was before
    (66–82).
  - **Trench:** the one real change. Striker 55 → 65, Conduit 80 → 105 with a death. Trash HP
    roughly doubled for the ~1-minute mini-boss target, and its rewards were scaled ×2.2 to
    compensate. That holds for Striker but not for the slower Conduit, which now also dies there.
- **Nothing is too fast.** The only "too long" candidates are T4 Conduit (a class curve issue,
  not biome pacing) and Trench for slow builds.

## Not changed

No XP factor was touched. If T4 should land on 60 min for the median class rather than for
Striker, the T4 factors would need ~×1.1 across the board (Trench ~×1.2). This is left to the
designer: the 2026-09-26 calibration deliberately tuned T4 on Striker.
