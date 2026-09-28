> **ARCHIVED — implemented 2026-09-27.** Findings and the applied pass are in
> `reports/t4-power-curve-2026-09-27/REVIEW.md`; live state in `docs/tier-balance-current-state.md` §6–7.

# T4 power curve review: handoff (2026-09-27)

**Status: not started.** Analysis session brief. Change no balance numbers until the
designer has chosen a direction from the findings (see "Decisions for the designer").

## Why this session exists

No player patch ships until T4 is reviewed. The designer's words: review the eHP/TTK of
tier 4 and decide whether to **nerf the player damage explosion** in that tier or **buff mob
HP** to match. Mobs and bosses must also be coherent with each other. Today Deep-Sea Trench
trash takes longer to kill than some T4 bosses, which the designer calls incoherent.

This is step 1 of the numbers pass the designer agreed on (2026-09-27): **player power curve
first**, then mobs, then bosses against the fight-length contract, then XP/reward pacing.
T1 is considered mostly fine. T2-T4 are the focus, T4 first.

## Known evidence to start from

- **The T3 -> T4 jump.** Median boss kill time (2026-09-26 matrix, 5 classes): T1 53 s,
  T2 45 s, T3 93 s, **T4 52 s**. T4 player damage grew **2.7x** over T3 while boss HP grew
  only **1.6x** (median 11,940 -> 19,499). Source: `design_docs/boss-lineage-redesign.md` §1.
- **A live player** finished T4 two-shotting bosses: Squire/Bulwark/Vanguard/Destroyer, Earthsunder
  Maul, Titan's Keep, Juggernaut Core, Colossus Heart, Charge on Execute, defensive Guards on Always,
  stance Time to Strike. They also reported that two T4 Mountain hammers gain very different
  Attack per upgrade.
- **The fight-length contract** (boss lineage redesign §2): median build T1 ~50 s, T2 ~60 s,
  T3 ~120 s, **T4 ~180 s**. Part of the length should come from the new phases, not HP alone.
- **Why Trench outlasts bosses:** `docs/tier-balance-current-state.md` §6-7. Trench was
  deliberately exempted from the sustained ladder and set to **7,269 eHP / 212 DPS**, not the
  ladder's 3,097 / 497 ("long rather than frantic"). T4 bosses were then sized at **x8.13 the
  trash HP of Wasteland**, the top ladder biome, and not of Trench. Every tier used
  **x0.736 of trash DPS**. Bosses were calibrated "in the vacuum", not against a measured
  player.
- **Prior T4 work:** `reports/t4-scaling-study-2026-09-25/STUDY.md` (185 observations,
  specialization outliers), `reports/t4-balance-2026-09-25/SCREEN.md` (Voidwalker fix,
  Berserker 30, Juggernaut log knee: shipped; Melter/Invoker held). T4 specialization pass in
  `3488b9f2`. Weapon ladder rules: `docs/gear-evolution-current-state.md` ("tier medians stay
  put", +0 >= 1.10x predecessor +5).
- **Pre-generated packets** (these may be stale; regenerate them): `reports/dps-llm-packet-t4.md`,
  `ehp-llm-packet-t4.md`, `mob-llm-packet-t4.md`, `tier-4-table.md`.

## Instruments

- **Static reports** (fast, theoretical): `pnpm dps:report` / `dps:llm`, `pnpm ehp:report` /
  `ehp:llm`, `pnpm mob:report` / `mob:llm`, `pnpm tier:table`. The DPS model carries weapon, armour,
  charm, boots, skills, upgrades and affinities only. It has **no core, relic, rune, rite, stance or
  ability**, and those are exactly where the T4 explosion may live. Use these for ranking and
  decomposition, not for absolute numbers.
- **Simulated** (real combat): `server/scripts/_t1BossLab.ts`. Despite its name, it maps all 26
  bosses (`BOSS_NODE`). Plan rows are JSON, one fight per row. Treatments: `live`, `dummy-bare`,
  `dummy-armored` (6 plating / 10% DR), `dummy-heavy` (16 / 15%, T4-realistic), `attacker`
  (survival dummy with a set damage shape), plus `mode: 'farm'` for open-node pace. It needs
  a hitbox artifact. Bake one from the current atlas with `writeHitboxArtifact(outPath)` from
  `server/src/hitbox/cache.ts` (no DB needed). Run with
  `node --conditions=development --import tsx scripts/_t1BossLab.ts --plan=... --out=... --hitboxes=...`
  from `server/`, about 1 s per T1 fight.
- **Reference loadouts:** `server/bench/balance/ttkSurveySpec.ts` (`SURVEY_CLASSES`,
  `resolveSurveyPackage`): Sweep + Second Wind at T1, + Cleanse at T2+, + Frenzy at T3+;
  offensive stance at T2+. `SURVEY_CLASSES` lists weapons for T1-T3 only. **Choose T4 reference
  builds deliberately and write them down**, including the core, relic and specialization.
  The live player build above is one mandatory row.

## Deliverables

1. **Per class x tier (T1-T4), +5 reference builds:** sustained DPS vs `dummy-armored` and
   `dummy-heavy`, and eHP.
2. **Decomposition of the T3 -> T4 damage jump:** how much comes from weapon, armour/affinity,
   core, relic, specialization, stance, abilities and rites. Add one layer at a time on the same
   dummy.
3. **T4 TTK matrix:** for each T4 biome, trash TTK (median build) next to that biome's boss TTK
   and the 180 s contract. Trench goes next to the bosses.
4. **Options for the designer**, each costed: (a) nerf the player layers the decomposition
   blames; (b) raise mob/boss HP; (c) a mix. For each, what it does to T4 XP pacing, since
   mastery time depends on kill speed.

## Decisions for the designer

Don't settle these yourself. Put them to the designer with the numbers:
- Nerf the T4 player jump, raise monster HP, or both.
- Whether Trench keeps its deliberate "long rather than frantic" exemption, or whether its trash
  should drop below boss durability.
- Whether bosses stay pinned to x8.13 trash HP, or move to the fight-length contract directly.

## Traps

- The boss lab mocks `Date.now` and `Math.random`. Boss scripts read wall-clock time.
- T2+ loadouts need at most 1 Guard, or `pickRules` throws "no legal rule set".
- A `bossExam` 0/N has been a harness artifact before (`project-t2-boss-benchmark-gap`). Sanity-check
  any wipe against a `dummy-*` treatment.
- Conduit is excluded from the weapon-normalization medians. T4 Conduit is already the
  strongest spec. Measure it but report it separately.
- Tests: `pnpm test -- <substr>` for subsets. The full suite takes ~5.5 min.
