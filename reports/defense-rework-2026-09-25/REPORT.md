# Defense rework: qualification matrix (2026-09-25)

Branch `feat/defense-rework`. The Codex package is split into three commits:

- **(a)** pipeline fixes on the original armor, `2bc19c1e`
- **(b)** armor/core/class rebudget, `9e6e795a`
- research artifacts

Harness `server/bench/defenseMatrix05.ts`, analysis `analyzeMatrix.mjs`, full output
[MATRIX-ANALYSIS.txt](MATRIX-ANALYSIS.txt). Raw rows are in
`D:/mmo-idle/defense-rework-2026-09-25/matrix/` (not committed). The finite-pack replay run
first is in [../defense-iteration-04/REPORT.md](../defense-iteration-04/REPORT.md).

## Design (declared before running)

- **Arms:**
  - original: develop `7094727e`
  - (a): `2bc19c1e`
  - (a+b): `9e6e795a` + benches
- **Monster data:** identical in all three, i.e. develop's post-nerf Volcano.
- **Farm cells:** 26 `-03` farm nodes (T1–T4) × 6 classes, at +3. Once in the home armor
  (156 cells) and again in the class reference armor where different (132). The reference
  armor is Mountain for melee and Conduit, Jungle (Forest at T1) for ranged/casters.
- **Boss cells:** all 26 bosses × 6 classes, reference armor at +5 (156 cells).
- **Builds:** balanced frame, taken from the survey (T1) and breadth (T2–T4) specs.
- **Run rules:** native auto-combat, 180 s cap. A farm run ends at first death with
  repopulation on. A boss win requires the dungeon cooldown state.
- **Seeds:** two fresh (515003, 515037). 444 cells → 888 runs per arm, 2664 total. All
  completed, with no runner failures.
- **Validity check:** passed. The original arm's first shard had 17.9% farm deaths and
  53/132 boss wins, inside the 2–95% band.
- **Sample size:** 194 of 444 cells give identical results on both seeds, so the effective
  sample is roughly 70% of nominal. A paired "net 2" is often a single cell.

**Adoption rules:**

- **Adopt (a)** if all of these hold against original:
  - farm deaths at most +17
  - boss wins at most 3 below original
  - no class with a net paired loss above 4
- **Adopt (b)** if all of these hold against (a):
  - farm deaths not higher
  - boss wins not lower
  - no class×tier with a net paired loss above 4
  - melee keeps better survival than ranged/caster

## Results

| Arm | Farm deaths / 576 | Farm kills | Boss wins / 312 | Hits ≥ max HP |
|---|---:|---:|---:|---:|
| Original | 87 | 9239 | 159 | 14 |
| (a) pipeline | 94 | 9203 | 140 | 14 |
| (a+b) candidate | 89 | 8845 | 171 | 6 |

| Arm | Farm survival, melee+Conduit | Farm survival, ranged/caster | Boss wins, melee | Boss wins, ranged |
|---|---:|---:|---:|---:|
| Original | 0.819 | 0.878 | 64 | 95 |
| (a) | 0.813 | 0.861 | 53 | 87 |
| (a+b) | 0.875 | 0.816 | 89 | 82 |

### (a) vs original: fails the boss rule (−19 wins)

Farm is within tolerance: +7 deaths, kills −0.4%. No class×tier crosses the net-4 flag.

**Every boss win (a) loses dies to a named charged or empowered attack**, and the maximum
hit rises in each case:

| Boss | Killing attack | Max hit | Classes that lose the win |
|---|---|---:|---|
| Dune Stalker Emperor | Execution | 112→138 / 186→235 / 134→199 | Striker, Slinger, Spirit |
| Dune Carapace Monarch | Execution | 190→201 | Slinger |
| Crag-Gorged Horn Behemoth | Cragbreaker (gross 710) | 282→333 | Squire |
| Frost-Plated Rime Mammoth | Shatter | 185→215 | Slinger |
| Crag Behemoth | Crag Charge | 92→106 | Squire |

Stoneplate Juggernaut (T2) and Apex Bramble Slasher (T3) add more Squire losses the same way.

The cause is the charged-hit plating order. Plating used to be subtracted *before* the charge
multiplier, which silently multiplied its value on exactly the attacks bosses are balanced
around. The fix is correct, but on the original, plating-heavy armor it is a boss-difficulty
increase. It is coupled to the armor budget, not independent of it. The rest of (a) (Guard
order, sponge order, debt installments, DoT DR, splash, DR grouping) shows no measurable cost.

### (b) vs (a): fails one class×tier gate

- Farm deaths 94 → 89 and boss wins 140 → 171 both pass.
- Melee survival is now better than ranged/caster (0.875 vs 0.816), which passes.
- **T2 Spirit bosses: net −6**, which fails. The T2 ranged/caster bosses all lean the same way
  (Slinger −4, Apprentice −2).

### (a+b) vs original

The package is not a net loss (farm +2 deaths, bosses +12 wins), but it **moves survival from
ranged/casters to melee**:

- Ranged/caster farm survival falls 0.878 → 0.816, and their boss wins fall 95 → 82.
- Melee boss wins rise 64 → 89, farm survival 0.819 → 0.875.
- Striker gains the most: T3 bosses +10, T4 farm +6.
- T2 Apprentice/Slinger/Spirit are flagged: farm net +5, bosses +6/+8.
- Oversized direct hits fall from 14 to 6.

The finite-pack replay shows the same mechanism in one place. The T3 Volcano anchor with
Desert armor goes from 2 to 15 deaths, because plating falls from 38 to 2 against a pack of
many small hitters plus one heavy one.

## Recommendation

1. **Split (a) once more, by coupling:**
   - **(a1)** is everything in (a) except the charged-hit plating order. Measure it with the
     same harness, arms original vs (a1), bosses plus farm, and the same rules. If it passes,
     it can merge now and unblock the Conduit session.
   - **(a2)**, the charged-hit plating order, moves into the rebudget. It only balances
     against the rebudgeted plating.
2. **Hold (b)** for a targeted pass before re-running this matrix. The pass should do three
   things:
   - Restore some flat plating on the T2/T3 ranged/caster armors, Jungle and Desert
     (Volcano packs of small hitters).
   - Look at the T2 caster bosses (Dune Stalker Emperor Execution).
   - Trim the Striker gains.

   Keep: Graveyard reactive plating, the core HP-penalty removal (its oversized-hit benefit is
   visible here), and melee durability ahead of ranged.
3. **Jungle:** do not buff its coefficients. Neither variant changes deaths on identical packs.
   **Desert:** +6 DR is loss-free but does not fix cross-biome Volcano.

Human play has not been done. No production telemetry was used.
