# Defense iteration 03 — measurements and isolated armor screens

**Decision: hold all three numerical candidates. Keep iteration 02's Graveyard change.** The new evidence supports improving the experiment design before another armor coefficient sweep. The broad defense redesign is still unmerged and not release-qualified.

## What was tested

All six classes, balanced reference builds, +3 armor, T3/T4 Desert and Jungle at home and in the same revised Volcano. Cores, class bonuses, other gear and the imported monster values were fixed. Fresh Worlds use seeded randomness and synchronized simulation clocks. Farming ends at first death or 180 seconds; it is not a progression/acquisition test.

| Isolated change | Screen deaths | Screen kills | Fresh-seed deaths | Fresh-seed kills | Disposition |
|---|---:|---:|---:|---:|---|
| Desert T3/T4 base DR +6 percentage points | 39 → 44 | 1300 → 1319 | Not run | Not run | Hold |
| Jungle T3/T4 raw evasion +10 points | 45 → 45 | 1487 → 1596 | 37 → 37 | 1551 → 1683 | Hold; useful throughput signal, no survival improvement |
| Jungle T3/T4 evade mitigation +5 points | 45 → 40 | 1487 → 1592 | 37 → 42 | 1551 → 1591 | Hold; initial survival gain reversed |

Each table comparison has 96 matched rows per arm. The Jungle comparisons share their baseline rows; do not treat them as independent replications. Four screening seeds and four fresh seeds were declared. Frequency has 82 deaths in both arms across both sets, with 3038 → 3279 kills (+7.9%). Strength also totals 82 deaths in both arms, with 3038 → 3183 kills. Neither result establishes that the survival problem is fixed.

Tier differences matter: frequency screen T3 deaths 30 → 29 and T4 15 → 16; fresh T3 26 → 28 and T4 11 → 9. Strength screen T3 30 → 31 and T4 15 → 9; fresh T3 26 → 29 and T4 11 → 13. Both fresh candidates increased home-Jungle deaths from 13 to 17. No per-tier buff was selected by cherry-picking the favorable subset.

## Identical-threat tests

360 controlled tests cover all classes, T3/T4, +0/+3/+5, and small/frequent versus large/slow direct hits at equal gross DPS. Passive recovery and the native defense pipeline run, but autonomous attacks, offensive kills, movement, summoned cover, Rune AI and environmental hazards do not. These stress fixtures are not estimates of live death rates.

| Change | Matched mean capped survival | Deaths within 60 seconds |
|---|---:|---:|
| Desert DR | 19.69 → 21.74 seconds | 70 → 69 / 72 |
| Jungle frequency | 23.69 → 26.85 seconds | 64 → 61 / 72 |
| Jungle strength | 23.69 → 24.52 seconds | 64 → 64 / 72 |

None of these fixed-stream candidates caused an earlier death than its own baseline. Frequency helps more than strength in these particular fixtures, but the changes are not normalized to equal item-budget cost. This does not prove frequency is always the better investment.

## Why a beneficial defense can lose a farming run

A full trace replays T3 Jungle Slinger seed 202151, baseline versus extra frequency. The results exactly reproduce their corresponding fresh-seed rows.

- At 55.2 seconds, the same Canopy Harrier hit deals **58 baseline versus 9 with the extra evade**: an immediate 49-HP improvement.
- Through 62 seconds, sampled positions and targets agree. The candidate carries that recovery advantage: at 62 seconds it has 388.80 HP versus 339.80, out of 395.
- By 63 seconds both are full, but their positions have diverged. The next incoming Stalker hit occurs at **66.3 seconds instead of 67.3**.
- The candidate subsequently dies at 78.4 seconds with four kills; baseline survives 180 seconds with eleven kills. Its lethal hit is 127 damage against approximately 50.84 remaining HP, not a full-health one-shot.

Observed: extra evasion prevented damage, followed by changed movement and encounter timing. Earlier recovery is the likely connection; this trace does not by itself prove which AI condition made the movement decision. It does establish that the later farming outcomes are no longer a comparison against an identical incoming sequence. Do not conclude that adding evasion makes its mitigation formula harmful.

## Tank combinations

96 fixed-pressure tests cover heavy Squire/Striker, T4 Mountain/Tundra/Graveyard, +3/+5, Arcanist versus Juggernaut, Tanking Stance, and a declared synthetic Guard schedule on/off. All survived 60 seconds. A further 48 tests use 1920 gross damage every 20 seconds: the same 96 gross DPS and 5760 total damage over the horizon as the smaller T4 streams. All survived; worst minimum HP fractions were approximately 31% Graveyard, 34% Mountain and 35% Tundra.

Their ending HP often recovered near full during the long intervals, illustrating why minimum HP and hit size matter alongside ending HP. These fixtures preserve a visible melee durability advantage. They do not establish that bunker builds are balanced: the test omits movement, forced displacement, control, debuff pressure, boss mechanics and offensive opportunity cost. No new tank/core nerf is justified from this ceiling-limited result.

## Measurement work retained

Added opt-in per-World callback attribution with labels for opening DR, evasion, shields, redirection, debt and other groups. Added primary-hit plating/DR/rounding measurements at the authoritative calculation. The bench records exact HP increases/decreases, damage channels where captured, death causes, evade counts, opening uptime and optional full position/target/hit traces. No observer is installed by the live server.

Eight diagnostic replays match original baseline outcome, elapsed time, kills, ending HP, HP gains/losses, direct-hit count, evades and damage totals exactly. All compared farming rows reconcile starting HP + increases − decreases = ending HP. Measurement boundaries, including deferred versus prevented damage and missing early channel fields, are explicit in [MEASUREMENT-SCOPE.md](MEASUREMENT-SCOPE.md).

## Next experiment and release gate

Next, replay **identical finite packs** from fixed positions with matched HP, shields, cooldowns and evade accumulator. Keep native Rune and enemy ability execution, stop at pack clear or death, and prevent travel/repopulation from changing which threat is being measured. Include pack sizes and charged-hit/debuff profiles that caused the traced failures. This sits between the simplified direct-hit streams and roaming farms.

Use that to decide whether Jungle needs more evasion, protection between evades, or a different recovery interaction, and whether Desert needs a sustained foundation or an engagement-boundary redesign. Do not add new mechanics or change Recover First solely from this one trace. Preserve the user's desired biome/cross-biome specialist roles and melee durability advantage.

Before adoption, still run the full original-defenses versus retained-candidate comparison with the same updated Volcano in both arms, including bosses and progression-like loadouts, followed by human play. That release qualification was not performed here. No production telemetry or human-play evidence was used.

## Completion and validation

Completed: **768 farming comparison runs**, **360 fixed-threat tests**, **144 tank tests**, **8 diagnostic replays**, and **2 reversal traces**. Total 1282 completed observations, with distinct endpoint semantics. Raw runs are preserved locally; manifests retain runner source, source diff and configuration. No previous run was overwritten. Compact results and hash receipts accompany this report.

Passed: workspace and bench typechecking, server build, defenseMeasurements (including charged-hit attribution), defenseRedesign. Initial typechecking caught invalid extra/missing fields in the new synthetic Guard fixture; those authoring fields were corrected. No gameplay balance coefficients changed. Full suite and browser tests were not run. Experimental changes remain isolated; nothing merged, pushed or deployed.
