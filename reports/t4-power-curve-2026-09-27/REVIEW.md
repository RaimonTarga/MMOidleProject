# T4 power curve review (2026-09-27)

Brief: [`docs/briefs/t4-power-curve-review-2026-09-27.md`](../../docs/briefs/t4-power-curve-review-2026-09-27.md).
Branch `integration/2026-09-27` at `894afb2a` (develop + Conduit + tilesets + boss lineages).
**Analysis only. No balance number was changed.**

## Bottom line

1. **The T4 "damage explosion" is the weapon ladder, not the T4-only layers.** Swapping only
   the weapon (best T3 → reference T4) multiplies sustained DPS by **×2.0–2.35** for every
   class. Everything T4 adds on top of that is small: specialization ×1.02–1.20 (one outlier
   ×1.6), relic ×1.00–1.07, T4 armour/charm/boots ×1.00, and T4 cores, T4 stances and T4
   abilities add **nothing** over their T3 equivalents on single-target damage.
2. **The same ×2–3 step has happened at every tier boundary, and trash kept up; T4 bosses did
   not.** Median DPS (heavy dummy) T1 34 → T2 114 → T3 270 → T4 912. Trash TTK stayed flat
   T3 → T4 (spawn-weighted ~3–7 s both tiers). Boss HP grew ×2.1, ×3.2, then only **×1.6**.
   T4 bosses are the thing that's out of line, because they were pinned to ×8.13 of Wasteland
   trash HP, the thinnest trash in the tier.
3. **Measured T4 boss fights run 29–42 s median against a 180 s contract** (4.3–6.1× short),
   and are shorter than T3's (64–82 s). The live player's build clears 6/7 T4 bosses in
   **15–25 s**.
4. **Two real outliers sit on top of the curve:** Charge wired to *Empowered Ready* (+40–100%
   on empowered heavy specs, already present at T3), and Apprentice light-b / Cultist (its
   spec layer is ×1.6 where every other spec is ≤ ×1.2).
5. **Trench trash is boss-grade.** Every Trench mob is a 16.8–17.6k HP elite with 18–22 plating;
   one takes 19–23 s to kill against a 33–45 s Trench boss (boss ≈ 2 trash). Elsewhere in T4 the
   boss is 2.4–4.9× the slowest trash; at T3 it was 6–18×.

A player-side nerf alone cannot reach the contract without making T4 weaker than T3. Raising
boss HP alone reaches it (probe below) but leaves the outlier builds at a fraction of the fight.
The numbers support a mix; the call is yours (§5).

---

## 1. Method and evidence boundaries

- **Harness:** `server/scripts/_t4PowerLab.ts` (new, throwaway). Real `World.tick`, combat
  bootstrap, 100 ms ticks, seeded `Math.random`/`Date.now`, guard stripped and boss force-woken
  like `bossScreen.ts`, outcome from `bossTerminal`. Freshly baked hitbox artifact.
- **Reference builds:** verbatim bench packages: T1 = TTK-survey solo cell, T2–T3 = breadth
  boss cell for each frame, T4 = breadth boss cell for every frame × spec (54). All +5, mature
  biome mastery, no rites.
- **Normalized abilities (this review's main tables).** The bench packages are inconsistent
  across tiers (T1 Sweep only; T2 melee Expose only; T3 ranged no Power Strike; T4 PS + Expose +
  Sweep), which alone fakes a ×1.3–1.9 jump for ranged classes at T3 → T4. Every tier here runs
  the same package: T1 PS + Second Wind; T2 PS + SW + Brace (T2 RP can't afford Expose); T3/T4
  PS + Expose + SW + Brace + Cleanse. Offensive stance at T2+.
- **Treatments:** `dummy-armored` (6 plating / 10% DR), `dummy-heavy` (16 / 15%, T4-realistic),
  `live` (the real boss), `trash:<id>` (boss slot replaced by one trash mob's HP / plating / DR /
  evasion, offense and mechanics stripped; TTK from first hit), `hpx:<k>` (live boss, HP × k).
- **Sustained DPS** = damage dealt in the first 60 s after first hit.
- **eHP** = (max HP + barrier) ÷ (fraction of a tier-median boss hit that lands after plating,
  DR and evasion). Reference hits T1 30 / T2 60 / T3 120 / T4 185.
- **Boss arms.** `bench` = the breadth convention (Defensive stance at T3/T4 bosses);
  `off` = the same builds on Offensive stance. Real players sit between or above.
- Conduit is measured but excluded from medians, per the brief.
- Bots don't dodge manually; human play outranks these results. Trash TTK has a ~1.7 s floor
  (one- and two-shot mobs); read it as "trivial".

Run counts: 192 + 354 reference/sweep, 1,164 live boss, 1,962 trash, 356 decomposition, 35 combo
probe, 90 farm, 735 boss-HP probe (analysis); ~3,900 more for the applied pass (§9).

---

## 2. Deliverable 1: reference builds per class × tier (+5)

Median over frames (T2–T3) and frame × spec (T4). Sustained DPS on the dummy, 60 s window.

**dummy-heavy (16 plating / 15% DR)**

| class | T1 | T2 | T3 | T4 | T2/T1 | T3/T2 | T4/T3 | T4 spec range |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Squire | 33 | 122 | 355 | 927 | 3.70 | 2.91 | 2.61 | 763–1117 |
| Striker | 24 | 101 | 320 | 912 | 4.21 | 3.17 | 2.85 | 709–1049 |
| Apprentice | 47 | 127 | 270 | 911 | 2.70 | 2.13 | 3.37 | 757–1027 |
| Slinger | 36 | 107 | 212 | 987 | 2.97 | 1.98 | 4.66 | 755–1096 |
| Spirit | 34 | 114 | 251 | 716 | 3.35 | 2.20 | 2.85 | 650–950 |
| Conduit † | 27 | 57 | 170 | 413 | 2.11 | 2.98 | 2.43 | 215–696 |
| **median (no Conduit)** | **34** | **114** | **270** | **912** | **3.35** | **2.37** | **3.38** | |

**dummy-armored (6 / 10%)**: median T1 43, T2 134, T3 287, T4 977 (×3.12, ×2.14, ×3.40).

**T3 is under-measured by the bench weapon picks.** With each T3 cell on its best T3 weapon
(9-weapon sweep), the T3 median is **349**, so the honest best-vs-best T3 → T4 step is
**×2.6**. Best T3 weapons: Avalanche Maul (melee), Rimebrand (ranged/casters), Permafrost Maul
(Apprentice heavy/balanced), Cinderlash (Striker light/heavy). The bench's T3 Venomthorn is the
worst T3 weapon for every cell that carries it.

**eHP** (median; pool = max HP + barrier / eHP vs tier-median boss hit):

| class | T1 | T2 | T3 | T4 | eHP T4/T3 |
|---|---|---|---|---|---:|
| Squire | 189 / 327 | 399 / 676 | 828 / 1591 | 1470 / 2947 | 1.85 |
| Striker | 171 / 260 | 360 / 511 | 764 / 1242 | 1355 / 2298 | 1.85 |
| Apprentice | 162 / 219 | 365 / 668 | 616 / 1220 | 1056 / 2302 | 1.89 |
| Slinger | 155 / 276 | 344 / 927 | 584 / 1652 | 967 / 2967 | 1.80 |
| Spirit | 194 / 242 | 407 / 685 | 686 / 1250 | 1161 / 2329 | 1.86 |
| Conduit † | 157 / 196 | 335 / 390 | 718 / 903 | 1274 / 1676 | 1.86 |

Durability grows a steady ×1.8–1.9 at T3 → T4. Defence is not where the explosion is.

---

## 3. Deliverable 2: decomposition of the T3 → T4 jump

Each class's **median T4 spec** (on the heavy dummy), T4 host, player tier 4. Start from that
build wearing its T3 counterpart's kit (best T3 weapon, T3 armour/charm/boots, same core, no
relic, no spec), then add one T4 layer at a time. Step multipliers in brackets.

| class (T4 ref spec) | T3 native | T3 kit @T4 | + weapon | + armour/charm/boots | + core | + spec | + relic | T4 ÷ T3 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Squire (Reverb) | 355 | 371 (1.05) | 845 (**2.28**) | 845 (1.00) | 845 (1.00) | 883 (1.04) | 927 (1.05) | 2.61 |
| Striker (Maestro) | 359 | 378 (1.05) | 860 (**2.28**) | 860 (1.00) | 860 (1.00) | 904 (1.05) | 912 (1.01) | 2.54 |
| Apprentice (Cultist) | 263 | 278 (1.06) | 562 (**2.02**) | 541 (0.96) | 541 (1.00) | 854 (**1.58**) | 911 (1.07) | 3.46 |
| Slinger (Cannoneer) | 349 | 368 (1.05) | 833 (**2.26**) | 831 (1.00) | 831 (1.00) | 997 (1.20) | 987 (0.99) | 2.83 |
| Spirit (Stormbringer) | 277 | 297 (1.07) | 698 (**2.35**) | 697 (1.00) | 697 (1.00) | 716 (1.03) | 716 (1.00) | 2.58 |
| Conduit † (Marshal) | 220 | 221 (1.00) | 333 (1.51) | 312 (0.94) | 312 (1.00) | 349 (1.12) | 413 (1.18) | 1.88 |

- "T3 kit @T4" vs "T3 native" (×1.05) is the tier itself: mastery and player tier on T3 gear.
- **Leave-one-out** from the full T4 build agrees: removing the weapon costs ×2.1–2.3; spec
  ×1.02–1.63; relic ×0.99–1.07; armour set ×0.98–1.00; core ×1.00.
- **Cores.** Every reference build keeps its T3 core at T4, because no T4 core beats it on damage.
  Sweep of all 11 cores: the best damage core is the same at both tiers for every class
  (Duelist melee, Sniper ranged/casters), with identical ratios. Juggernaut is ×0.63–0.68 for melee.
- **Stances.** Best at both tiers is Berserker (T3), ×1.17–1.29 over Offensive. T4 stances:
  Perfection ×1.04–1.15; Time to Strike ×0.67–0.93 on reference builds; Reaper, Brawler and
  Powering Up are losses on single target. No T4 stance is a damage step.
- **Abilities.** Replacing Expose Weakness with Snipe, Stunning Strike or Imbue Lightning is
  ×0.84–0.96, so T4 Techniques are not a damage step. Quick Strike (T3) is ×1.17–1.24 for
  Striker/Spirit at T4. Detonate is ×1.48 for Slinger at T4 (×1.34 at T3).
- **Rites** carry no single-target damage; Mechanic Renewal only matters between fights.

### The live player's build

Squire / Bulwark / Vanguard / Destroyer, Earthsunder Maul, Titan's Keep, Juggernaut Core,
Colossus Heart, Time to Strike, Charge on Empowered Ready, Brace on Always.

| | heavy-dummy DPS | vs full |
|---|---:|---:|
| full build | **1,234** (armored 1,324) | — |
| Charge replaced by Expose | 575 | ×0.47 |
| T3 weapon (Avalanche Maul) | 610 | ×0.49 |
| Offensive instead of Time to Strike | 1,115 | ×0.90 |
| no spec | 1,100 | ×0.89 |
| no relic | 1,128 | ×0.91 |
| Duelist instead of Juggernaut | 1,578 | ×1.28 |

Live: Mountain 15.1 s, Jungle 15.1 s, Volcanic 15.2 s, Desert 16.0 s, Tundra 24.4 s, Trench
24.8 s, Wasteland: died at 26 s. That reproduces the report of two-shotting T4 bosses.

**Charge on Empowered Ready is a combo outlier, not a T4 layer.** Technique riders multiply
`ctx.damage`, the hit as already resolved (`abilityEffects.ts` `addEmpoweredDamage`, basis =
`ctx.damage` for players). Charge's rider (×2.2–2.8) wired to Empowered Ready lands on the
class's empowered hit and multiplies it. Power Strike wired the same way gains nothing.

| build (heavy dummy) | reference (PS + Expose) | Charge on Empowered Ready | + Time to Strike |
|---|---:|---:|---:|
| Squire heavy-a (Avenger) | 862 | 1,413 (×1.64) | 1,458 |
| Striker heavy-a (Berserker) | 1,013 | 1,410 (×1.39) | 1,416 |
| Spirit heavy-a (Voidwalker) | 801 | 1,191 (×1.49) | 916 |
| Spirit heavy-b (Invoker) | 790 | 988 (×1.25) | 857 |
| Striker heavy-b (Hemomancer) | 825 | 778 (×0.94) | 653 |
| Slinger heavy-b (Warmonger) | 1,054 | 979 (×0.93) | 780 |
| **T3** Squire heavy, Avalanche Maul | 411 | 559 (×1.36); Berserker 708 (×1.72) | n/a |

### The two hammers

On this branch Earthsunder grows +45/+45/+44/+44/+44 (264 → 486) and Warmaul
+38/+38/+38/+34/+38 (184 → 370), which is close. Before the 2026-09-26 normalization, Warmaul was
98 → 147 (+10/step) against Earthsunder's 240 → 540 (+60/step). That is almost certainly what
the player saw if the live patch predates `f4d584d9`. Nothing to fix on develop.

---

## 4. Deliverable 3: T4 TTK matrix

Trash TTK = one mob, median over the 45 non-Conduit T4 reference builds, seconds from first hit
(mechanics stripped). Boss TTK = live boss median over winning fights. Contract = 180 s.
`*` = elite.

| biome | trash (HP → TTK s) | weighted trash TTK | slowest trash | boss HP | boss TTK bench / off | win % bench | boss ÷ slowest trash | vs 180 s |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Mountain | Granite Mammoth 13,800 → 14.9; Cragback Rhino* 6,600 → 8.0; Tyrant, Roc ≤ 1.7 | 6.6 | 14.9 | 19,499 | 44.5 / 36.2 | 100 | 3.0 | ×0.25 |
| Jungle | Constrictor* 12,000 → 13.5; Silverback* 10,000 → 11.6; Panther, Chameleon ≤ 1.7 | 7.1 | 13.5 | 18,352 | 32.2 / 23.8 | 100 | 2.4 | ×0.18 |
| Desert | Basilisk 9,006 → 12.0; Dune Tyrant* 6,952 → 9.0; Viper 4,029 → 4.2; Scarab ×3 ≤ 1.7 | 5.1 | 12.0 | 17,893 | 37.7 / 24.9 | 100 | 3.1 | ×0.21 |
| Tundra | Permafrost Behemoth* 7,656 → 10.0; Dire-Bear 4,884 → 6.0; Mastodon 2.4; Yeti ≤ 1.7 | 5.0 | 10.0 | 22,940 | 47.1 / 36.2 | 100 | 4.7 | ×0.26 |
| Volcanic | Magma Salamander* 5,808 → 7.0; Tortoise 4,488 → 4.8; Skink ×8 etc. ≤ 1.7 | 2.4 | 7.0 | 20,646 | 34.4 / 23.1 | 62 | 4.9 | ×0.19 |
| Wasteland | Gravewright* 5,702 → 6.4; all others ≤ 1.7 | 2.4 | 6.4 | 19,499 | 113.6 / 69.0 | 33 | 17.7 | ×0.63 |
| **Deep-Sea Trench** | Elder Leviathan* 17,640 → 23.2; Abyssal Serpent* 16,800 → 20.1; Hadal Stalker* 16,800 → 19.0 | **20.8** | **23.2** | 21,793 | 44.6 / 33.4 | 100 | **1.9** | ×0.25 |
| **T4 all** | | | | 19,499 | **41.6 / 29.3** | 85 / 89 | | **×0.23 / ×0.16** |

T3 for comparison (contract 120 s): weighted trash TTK 3.2–7.5 s, slowest 6.4–18 s, boss
median **82 s bench / 64 s off** (84 / 78% wins), boss ÷ slowest trash **5.9–18.5**.

- **T4 trash is coherent with T3 trash;** T4 bosses are not. Boss ÷ weighted trash fell from
  11–36× at T3 to 4.5–14× at T4.
- **Wasteland's Charnel-Crown is the only T4 boss doing its job** (33–38% wins, 69–114 s).
  It's also the one boss that would get *harder* under a blanket HP raise; treat it separately.
- **Volcanic's Caldera Sovereign** is 62% bench / 87% offensive: it kills bots in short fights
  (cause not isolated in this review), not through length.
- Per class (bench, T4 median kill): Squire 39 s, Slinger 39 s, Apprentice 39 s, Striker 46 s,
  Spirit 48 s, Conduit † 66 s. At T3: 68 / 90 / 82 / 76 / 83 / 138 s.

---

## 5. Deliverable 4: options, costed

Targets: T4 median boss ~180 s (contract), T3 ~120 s; keep trash TTK roughly flat across tiers
(it is today), and keep boss sustained damage below class sustain.

### Probe: what boss HP alone does (live bosses, bench arm, 45 non-Conduit builds × 7 bosses)

| boss | T3 ×1 | T3 ×1.5 | T4 ×1 | T4 ×3 | T4 ×5 |
|---|---|---|---|---|---|
| T3 Mountain | 92 s, 93% | 141 s, 93% | | | |
| T3 Desert | 82 s, 60% | 127 s, 47% | | | |
| T3 Volcanic | 62 s, 100% | 92 s, 67% | | | |
| T3 Jungle | 69 s, 93% | 107 s, 80% | | | |
| T3 Cave | 106 s, 80% | 148 s, 80% | | | |
| T3 Swamp | 119 s, 73% | 172 s, **40%** | | | |
| T3 Tundra | 90 s, 87% | 132 s, 73% | | | |
| T4 Mountain | | | 45 s, 100% | 145 s, 100% | 240 s, 100% |
| T4 Jungle | | | 32 s, 100% | 96 s, 96% | 159 s, 82% |
| T4 Desert | | | 38 s, 100% | 107 s, 100% | 178 s, 100% |
| T4 Tundra | | | 47 s, 100% | 153 s, 100% | 248 s, 100% |
| T4 Volcanic | | | 34 s, 62% | 65 s, **9%** | 115 s, **2%** |
| T4 Wasteland | | | 114 s, 33% | 280 s, 36% | 432 s, 24% |
| T4 Trench | | | 45 s, 100% | 141 s, 98% | 229 s, 98% |
| **all** | **82 s, 84%** | **125 s, 69%** | **42 s, 85%** | **128 s, 77%** | **210 s, 72%** |

- **Length is ~linear in HP.** The 180 s contract lands at **T4 boss HP ×~4.3** (bench builds;
  ×~6 if players run Offensive), and T3 lands 120 s at **×~1.45**.
- **Longer fights expose sustained damage.** Median lowest HP in T4 wins falls from 93% (×1) to
  71% (×5). Caldera Sovereign and T3 Swamp/Volcanic become the killers: their ramps (Heat, rot)
  were tuned for the current short fights. Under the contract's soft-enrage rule (~1.5× target)
  those ramps must be re-timed together with any HP raise, or they turn into hard walls.
- Wasteland's Charnel-Crown stays at 24–36% and gets very long (280–430 s). It needs its own
  pass, not a multiplier.
- Spirit is the slowest class at ×5 (288 s median vs 189–223 s), consistent with the class-pass
  residual that Spirit is slow on real bosses.

### (a) Nerf the player layers the decomposition blames

The only large layer is the **T4 weapon step** (×2.17 on median +5 weapon DPS, against ×1.76 at
T2 → T3 and T4 +0 already ×1.18 over T3 +5). Candidates:

- **a1. Match the T3 step:** T4 +5 median to ×1.76 of T3 (194 → ~158 raw DPS, **−19%**). The
  "+0 ≥ 1.10× predecessor +5" floor still holds if the T4 upgrade curve flattens from ×1.84 to
  ~×1.6 +0 → +5 (T1 and T3 already sit at ×1.60–1.66). Player DPS moves ~1:1 with weapon DPS.
  - Boss TTK: 42 → ~51 s (bench). **Still ×0.28 of contract.**
  - Trash TTK: ×1.23. XP pace: elite biomes (Mountain, Jungle, Trench) about −5 to −15% kills
    (measured at weapon Attack ×0.8); swarm biomes (Wasteland, Volcanic) unchanged, because they
    are respawn/pathing-bound.
  - Cost: a second weapon rewrite a day after the normalization; upgrades feel flatter, which is
    the opposite of the playtest note that "upgrades feel flat".
- **a2. Floor-only T4 weapons** (T4 +5 ≈ ×1.5 of T3 +5, −32%): boss ~60 s, trash ×1.45, elite
  biomes −20 to −45% kills (measured at ×0.6). Breaks the upgrade feel badly. Not recommended.
- **a3. Outliers (independent of the others; recommended in any mix):**
  - Charge rider should not multiply an already-empowered hit. For example, compute the rider on
    the pre-empower basis, or make Empowered Ready and a Charge rider exclusive. Effect: −30 to
    −50% on the builds that use it (T3 as well); zero on everyone else.
  - Apprentice light-b (Cultist): spec layer ×1.58 vs ≤ ×1.20 for every other median spec. Trim
    toward ×1.2 (about −25% on that spec).

**(a) alone cannot reach the contract.** Hitting 180 s by nerfs alone needs player DPS ÷ 4.3,
which puts T4 below T3.

### (b) Raise boss (and mob) HP

- **T4 bosses:** HP × ~4.3 (probe: ×3 → 128 s, ×5 → 210 s). T4 trash unchanged: its TTK already
  matches T3, so **XP pacing does not change**. Boss clears take ~3 min instead of ~40 s; if a
  boss kill gates progression, that is +2–2.5 min per clear.
- **T3 bosses:** × ~1.45 (82 → ~120 s) for the same contract.
- Requires boss sustained damage to stay under class sustain over 3 min (contract principle 1).
  The probe shows it does for 5 of 7 T4 bosses. Caldera (T4) and Swamp/Volcanic (T3) need their
  ramps re-timed; Charnel-Crown needs its own pass.
- Does not address the spread. The live player's build (1,234–1,578 DPS) would still finish in
  ~40–70 s against a 180 s median, a 3–4× gap.

### (c) Mix (the shape the numbers point to)

1. a3 outliers (Charge-on-Empowered, Cultist): narrows the top of the spread without touching
   the median.
2. Optionally a1 (−19% T4 weapon step) if you want T3 → T4 to feel like T2 → T3 rather than a
   doubling. It buys ~×1.2 of fight length and costs ~10% XP pace in elite biomes only.
3. Boss HP to the contract with the remainder: ×~3.5 at T4 with a1, ×~4.3 without; ×~1.45 at T3,
   with the Heat/rot ramps (Caldera, T3 Swamp/Volcanic) re-timed to the new length.
   Charnel-Crown separately (it's already long and lethal).
4. Trench trash per your call below.

XP pacing summary:

| option | T4 trash TTK | T4 farm kills (elite biomes / swarm biomes) | T4 boss clear |
|---|---|---|---|
| (a1) weapon −19% | ×1.23 | −5 to −15% / ~0 | ~51 s |
| (a2) weapon −32% | ×1.45 | −20 to −45% / ~0 | ~60 s |
| (b) boss HP ×~4.3 (+ ramp re-timing) | ×1.00 | 0 / 0 | ~180 s (probe: 128 s at ×3, 210 s at ×5) |
| (c) a1 + a3 + boss HP ×~3.5 | ×1.23 | −5 to −15% / ~0 | ~180 s |

---

## 6. Decisions for the designer

1. **Nerf, HP, or both?** Evidence: the jump is the weapon step, trash kept up, bosses did not.
   (b) or (c) reach the contract; (a) can't.
2. **Trench.** Today one Trench mob ≈ half a Trench boss (and ≈ a whole boss for the best
   builds). Options: keep the "long rather than frantic" exemption but put the boss at the
   contract (then boss ÷ trash ≈ 8×, like other T4 biomes after (b)); or cut Trench trash HP
   to ~6–8k (≈ other T4 elites) and keep its damage identity.
3. **Boss anchor.** Stay at ×8.13 of Wasteland trash HP, or size bosses to the fight-length
   contract directly? The ×8.13 anchor is what produced this: Wasteland trash is the thinnest in
   the tier (weighted TTK 2.4 s), so bosses were anchored to the floor.
4. **Outliers:** approve looking at the Charge rider and Cultist regardless of 1–3?

## 7. Side findings

- **Bench package drift.** Breadth cells give different Techniques per tier (see §1). Any tier
  ratio read from them is contaminated; `defenseMatrix05`'s tier medians include this.
- **Bench weapon picks at T3** use Venomthorn for ranged cells: the worst T3 weapon for all of them.
- **T4 regenerated tier table has drifted** from `docs/tier-balance-current-state.md`: the
  sustained ladder is no longer monotone (`1.00 → 1.77 → 1.40 → 1.64 → 2.16 → 2.89`), Mountain
  and Jungle eHP are ×2.3–2.9 over target while Volcanic/Wasteland are ×0.27–0.3, and Trench trash
  reads 34,577 eHP@51 (doc: 7,269). The static packets were regenerated in this session.
- The live player lost 22% by picking Juggernaut over Duelist; Juggernaut is a survival core, and
  its −25% attack speed is paid in full on damage.

## 8. Reproduce

From `server/` (hitboxes: bake with `scripts/_t4Bake.ts <out.json>`):

```
node --conditions=development --import tsx scripts/_t4PowerLab.ts --plan=<plan.json> --out=<res.jsonl> --hitboxes=<hitboxes.json> [--shard=i --shards=n]
```

Raw plans and results (~11 MB of JSONL) are not committed; the generators (`gen*.mjs`), tabulators
(`ana*.mjs`), runners (`runlab.mjs`, `runfarm.mjs` for `_t1BossLab.ts --mode farm`) and boss
iteration configs (`bosscfg*.json`) regenerate them. Their tabulated outputs are committed as text:
`reference-dps.txt` (§2), `decomposition.txt` (§3), `trash-ttk.txt` and `live-bosses-before.txt` (§4),
`hp-probe.txt` (§5), `iterations.txt` and `validation.txt` (§9). Catalogue and ladder dumps:
`scripts/_t4Catalog*.ts`, `scripts/_t4Ladder.ts`. The generators carry absolute scratch paths; edit
`T` before rerunning.

---

## 9. Outcome: applied 2026-09-27 (branch `balance/t4-power-curve`)

Designer decisions: nerf players only for clear outliers; raise T3/T4 boss eHP to the
fight-length contract (midpoint of Defensive and Offensive bench builds) with varied
profiles leaning on DR; re-time ramps and keep each boss's win rate; Trench mobs ~1 min
each, rewards ×2.2; DoTs pay half of DR both ways; delete the Void Overlord (separate change).

### Player side (outliers only)

| change | why | effect |
|---|---|---|
| One multiplier per hit: Technique riders on an empowered hit scale the pre-empowered hit (`abilityEffects.ts` `addEmpoweredDamage`) | Charge on Empowered Ready compounded ×2.2–2.8 on the class's empowered multiplier | Charge combos −30 to −40% (live player's build 1,234 → 778 heavy-dummy DPS); reference builds unchanged except Slinger/Apprentice −4 to −6% |
| Energy discharges record their multiplier; the shared "suppressed" path keeps it | Voidwalker + Charge still compounded (+49%) | 1,191 → 779 (reference 801) |
| Energy discharges skip chaotic misses | Every dead swing fired the discharge's side effects (Critical Mass stacks, Stormbringer strikes, SM pool, Binary flip), then fired again on the next hit | Invoker was inflated ~9%; retuned (empowered-mult −2 → −1, Critical Mass 0.20 → 0.25/stack) back to 786 vs 790 |
| Detonate weapon reservoir ×5.0/×5.5 → ×3.6/×4.0 | Glacial Rimebrand + Detonate was every class's ceiling (up to ×1.5 the median ceiling) | Slinger light-a ceiling 1,492 → ~1,254; class DoT multiplier (×2.0) unchanged |
| `GAME_CONFIG.DOT_DR_SHARE = 0.5`: DoT ticks/procs pay half of DR both directions; monster `dotResistance` added | Player DoTs ignored monster DR entirely, so a DR-leaning boss profile would have favoured DoT builds | Apprentice kill time = class median on the new bosses: no boss needed `dotResistance` |

T4 median sustained DPS (heavy dummy, normalized packages) 905 → 867; the top of the range
is unchanged. T1–T3 medians unchanged.

### Bosses (all numbers in source; see `docs/tier-balance-current-state.md` §7)

| boss | HP | plating / DR | other |
|---|---|---|---|
| T3 Crag-Gorged Horn-Behemoth | 12,418 → 16,070 | 12/5% → 20/15% | plating profile |
| T3 Deep-Core Burrow-Gorger | 12,895 → 14,360 | 16/15% → 12/35% | |
| T3 Rot-Spore Croc-Behemoth | 11,940 → 10,790 | 8/10% → 8/30% | |
| T3 Dune-Carapace Monarch | 11,940 → 15,800 | 10/8% → 10/30% | Execution ×1.6 → ×1.35 |
| T3 Apex Bramble-Slasher | 11,701 → 22,400 | 0/3% → 0/5% | raw HP; venom ambush ×2.0 → ×1.5, poison 16 → 10 |
| T3 Cinder-Shell Magma-Salamander | 11,462 → 18,760 | 8/4% → 8/30% | attack 179 → 130; Final Eruption 22 → 42 s; arena Heat clock ×1.9 |
| T3 Frost-Plated Rime-Mammoth | 12,895 → 19,100 | 12/12% → 22/15% | Frostbite 6.0/4.0 → 9.6/6.4 s; Chill stoke 0.6 → 0.96 |
| T4 Iron-Crest Titan | 19,499 → 73,140 | 14/6% → 28/15% | plating profile |
| T4 Dune-Throne Sovereign | 17,893 → 71,080 | 8/8% → 8/35% | |
| T4 Verdant-Crown Predator | 18,352 → 112,570 | 0/4% → 0/8% | raw HP; Cornered ×1.40/×1.35 → ×1.2/×1.2 |
| T4 Glacial Patriarch | 22,940 → 90,450 | 22/14% → 32/18% | plating profile |
| T4 Caldera Sovereign | 20,646 → 74,130 | 10/5% → 10/35% | Cataclysm 26 → 60 s, 1,000 → 650 raw; arena Heat clock ×5 (node feature, not a boss stoke: the 2026-09-04 no-stoke rule holds); vents ×0.75; Simmering Burn 4 → 3/stack, phase-3 interval 1.5 → 3 s |
| T4 Charnel-Crown Sovereign | 19,499 → 42,000 | 14/8% → 14/25% | raise 9 → 15.3 s; Harvest 2.5 → 4.25 s; Invocation 4 → 3 Bone Crawlers |
| T4 Elder Trench Serpent | 21,793 → 68,910 | 20/22% → 20/40% | |
| T1 Grave Toadeater / T2 Mire-Gorged Behemoth | — | — | poison 3 → 2 / 6 → 5 per stack (hold win rates under the DoT/DR rule) |

Trench trash: see `tier-balance-current-state.md` §6 (HP ~×2, DR 30–40%, rewards ×2.2; the
Leviathan's shield keeps its absolute 1,058 budget).

### Validation from source (45 non-Conduit builds × every boss, both stance arms)

| | before bench / off | after bench / off | wins before → after |
|---|---|---|---|
| T3 median kill | 82 / 64 s | **139 / 103 s** (midpoint 121; target 120) | 84/78% → 85/74% |
| T4 median kill | 42 / 29 s | **208 / 149 s** (midpoint 179; target 180) | 85/89% → 92/82% |
| Trench mob (Offensive) | 19–23 s | 48–50 s (~57 s midpoint) | |
| T1 / T2 | 56 / 36 s | 52 / 36 s | 52 → 44%* / 59 → 57% |

\* The T1 change is the half-DR rule before the Toadeater fix; the fixed poison restores its 40%
(measured separately on the same builds and seeds).

Every T4 boss now runs 146–223 s median; the slowest arm is Charnel-Crown (223 s bench).
Conduit is still ~1.5–2× slower on bosses (T4 173–428 s): a known Conduit curve issue owned by
its own session.

Evidence for this section: `iterations.txt` (rounds 1–5), `validation.txt` (final, from source).
