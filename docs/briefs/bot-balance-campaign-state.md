# Bot balance campaign state

Updated: 2026-09-19. Owner: Astra (planning and interpretation); operators: Luna, Sonnet.

## CURRENT PHASE (2026-09-19): Boss3 executed and reviewed; Boss4 frozen, NOT launched

**Boss3 executed.** 24 fights at `aedef122` (tree `c08f1a82`), both blocks verified, 0 capped /
reset / vanished / ambiguous / invalid. All 12 control rows reproduce Boss2's elapsed time and
boss HP remaining exactly — a reproducibility check, never pooled as new coverage.

| Boss | Brace reference | Cleanse substitution | Reading |
|---|---:|---:|---|
| Mire-Gorged Behemoth | 0/6 | **2/6** | Cleanse is useful here; the four remaining deaths all lasted longer and removed more boss HP |
| Chitinous Dreadbore | 0/6 | 0/6 | small mixed shifts in BOTH directions, no victory in either arm |

**The guard/equipment permutation sequence stops here.** Swamp retains Cleanse as its practical
reference; Cave retains the original Brace reference, where the replacement did not solve the
failure.

**Corrections to the Boss3 report** — prose only, in [its §11](bot-balance-boss3-report.md).
No fight was re-run and no artifact altered. The report said "24 substitution fights" (it is 12
and 12); its executive "nothing got worse" is too broad (Cave conduit 37.9→37.8 s, spirit
38.2→37.9 s); and `minHpFraction` is the minimum of the **100 ms tick** observations, not a
continuous terminal value — the 1000 ms `samples.jsonl` series and the terminal reading are two
further, distinct things. The one-example claim that coarse samples proxy DoT deaths well is
withdrawn. The per-root first-Cleanse divergence stays a recorded observation with no isolated
cause, and the Conduit/Dreadbore accounting gap stays **unknown**.

**Next authorized task.** Sonnet executes [the Boss4 operator packet](bot-balance-boss4-operator-packet.md):
**one local enemy-pressure candidate per boss**, in two independent blocks, at the Boss3 reference
that is sensible for each matchup.

- `swamp-pressure` — `mire-gorged-behemoth` venom `damagePerStack` **9 → 6**, on the Boss3
  **cleanse-substitution** package in BOTH arms.
- `cave-pressure` — `chitinous-dreadbore` `stats.attack` **139 → 104** (`round(139 x 0.75)`), on
  the Boss3 **portable-reference** package, Brace included, in BOTH arms.

2 blocks x 6 roots x 2 arms x the carried seed `98011`, 300 s cap = **24 fights**. The candidate
is installed process-locally and restored after every observation; **nothing is adopted into
source**. A control may only be compared to its OWN historical arm — Swamp current ↔ Boss3
Cleanse, Cave current ↔ Boss3 portable reference. Comparing Swamp's candidate to the old Brace
result would fold the guard substitution into the boss-stat effect.

Qualification ran during preparation and passed: typecheck (bench included), the eight named
tests, a functional fixture measuring both damage paths, and a zero-fight preflight. Two results
worth carrying: **the base definitions hash does not prove a fight ran untreated** (it is hashed
before any install, so each receipt carries its own `damageTreatment`, runtime readback and LIVE
hash), and **the 25.2% authored attack cut is not the effect size** — post-mitigation damage
falls 28.9–30.4% because plating subtracts before the scaling, and landed damage falls by a
different, non-uniform 21.3–29.5%.

Opus is NOT authorized to launch it. Boss4 is a decision checkpoint, not permission for endless
Swamp/Cave tests; after review the main coverage work moves toward the missing boss tiers.

See: [Boss3 report](bot-balance-boss3-report.md) · [Boss4 packet](bot-balance-boss4-operator-packet.md).

---

## PREVIOUS PHASE (2026-09-19): T2 boss coverage COMPLETE; Boss3 frozen, then executed

**Boss2 executed and reviewed.** 36 fights at `96cf77d4` (tree `2bf3a8c4`), all six blocks
verified, plus the six reused Timberclaw rows: **42 observations, 17 boss-killed / 25 bot-died**,
0 capped / reset / vanished / ambiguous / invalid. That completes T2 boss **COVERAGE** — 7 bosses
x 6 roots. It is coverage, **not T2 balance completion**, and says nothing about T1/T3/T4 boss
readiness or guardian access.

Per-boss victories: Juggernaut 5/6, Gorger 5/6, Emperor 4/6, Razortusk 2/6, Timberclaw 1/6
(reused), **Behemoth 0/6, Dreadbore 0/6**. Per-root: Spirit 5/7, Slinger 4/7, Striker 3/7,
Squire 3/7, Apprentice 1/7, Conduit 1/7.

**Corrections to the Boss2 report, from the artifacts** — full detail in
[the Boss2 review](bot-balance-boss2-review.md) §2. Do not re-run Boss2 to repair prose.
- Conduit has **ONE** victory (Juggernaut), not the two §4 claims. The tables were right.
- The Behemoth attribution claim is **WITHDRAWN**. The Corrosive Pool does not bypass
  `damageFromBoss`; that counter fully accounts for what the player took, and `hpLost` is *lower*
  in every fight because barrier and healing sit between them. Behemoth is **87-92% DoT**
  (`monster-dot:mire-gorged-venom`), `largestHit` is **30** in all six, and all six deaths record
  a DoT cause at 4 stacks. There is no burst in that encounter.
- Dreadbore is **burst, not attrition**: zero DoT in all six, lethal blows 92-149 against 231-300
  max HP. Four of its six deaths occurred **before** 50% HP, so `empower-shred` cannot explain them.
- Positional counterplay DID act on both: 12-20 `telegraph-dodge` per fight, 4 `hazard-escape` on
  Behemoth. Neither wipe is explained by the references standing still.
- No functional defect found in the four named recordings. No stat compensation is proposed.

**Retained limitations.** Timberclaw and Razortusk remain difficult portable matchups. Apprentice
and Conduit remain **reference-fit** questions — Conduit's has a stated design explanation
(`CannotAttack`, zero owner `attackBeats` by design), Apprentice's does not. **No global class
verdict** follows from either. Guardian/access stays unmeasured and is never pooled in. Boss1's
Sovereign block keeps its **separate retrospective-verification** status; Boss2's passing tests do
**not** retroactively certify it. T1/T3/T4 boss coverage is still pending.

**Next authorized task.** Sonnet executes [the Boss3 operator packet](bot-balance-boss3-operator-packet.md):
**one** defensive substitution (Brace -> Cleanse at index 1 of the ordered Guard list) against the
two total-wipe bosses. 2 blocks x 6 roots x 2 arms x the reused Boss2 seed `98011`, 300 s cap =
**24 fights**, at the Boss2 revision itself. Arm neutrality is measured: every root's effective
stats are byte-identical across both arms on both bosses, and the substitution frees exactly 2 RP,
left unspent. Swamp is the plausible block (Cleanse's only target is the channel doing 87-92% of
the damage); **Cave is the one that may get worse** (plating restoration against 92-149 point
hits, in place of a 40% DR window). Opus is NOT authorized to launch it. This is ONE screen, not
permission to optimize builds until they win, and **Boss4 is not automatically created**.

See: [Boss2 review](bot-balance-boss2-review.md) ·
[Boss3 packet](bot-balance-boss3-operator-packet.md).

---

## PREVIOUS PHASE (2026-09-19): Boss1 reviewed and retained; Boss2 frozen, NOT launched

**Phase.** T2 boss coverage. The mob campaign is closed for this purpose and is not reopened;
the named T3 Jungle pressure and the earlier Mountain limitations stay visible but nothing
below depends on them. ECON-1 is preserved and untouched.

**Boss1 — reviewed evidence.** 18 fights at `66d33d57` (tree `bad68e01`).
- *Timberclaw, 6 fights, verified as recorded.* Spirit (the corroborated V1i package) killed it
  at 30.3 s; five constructed references died after removing 51.1–94.3%. All five kept. Slinger's
  212 HP remaining is a near-clear and is not equivalent to Striker's 1,835.
- *Sovereign, 12 fights.* **Completed; original frozen verification failed on stance declaration;
  retrospectively reviewed and confirmed.** Not certified, and `artifactVerified: false` stands.
  The declaration gap was a receipt-SERIALIZATION defect (`bossScreen.ts` recorded the cell's raw
  optional fields instead of the package preparation resolves), covering `stance`, `runeRules`
  and `abilities` — not stance alone, as the run's first assert suggested. Offensive was
  unambiguously intended, provable from the pre-execution packet §4b, from the deterministic
  `prepareSurveyBot` default, and from D37's own graveyard T4 receipts. **No rerun is authorized.**
- Raw-event agreement was extended from the report's 3-fight spot-check to **all 18**, with zero
  disagreements.
- Guardian/access was stripped in both blocks and remains unmeasured. Do not compare the two
  slots' success rates as a tier-difficulty estimate; they differ in tier, package origin, gear
  biome and seed count at once.

**Named local exceptions.**
- Packet §4b said "the five-rune survey loadout"; the two **melee** Sovereign roots actually ran
  **four** rules (the survey default adds `orbit` for ranged only). Prose inaccuracy, not a build
  defect — the resolved declaration now records the real per-root count.
- `gorging-razortusk` is the ONLY summoning T2 boss, and its spawns are nested inside a `cast`
  plus a `repeating` cadence. A census that walks only `phases[].actions` reports it as a
  non-summoner.
- Boss mechanics live in **two** fields: `bossScript` *and* `bossPattern`. `jungle-dread-gorger`
  has no `bossScript` at all and reads as a bare statline unless the pattern is read too.
- Seed honesty: only razortusk has a declared randomness consumer among the six. The other five
  are *unmeasured*, not proven inert — do not present one seed as seed coverage.

**Fix shipped.** `resolveSurveyPackage` is now the single source of the preparation defaults;
`prepareSurveyBot` and the receipt both read it, so a declaration is computable from the cell
before the fight and never copied back off the bot. Provenance (`explicit` /
`preparation-default` / `tier-none`) keeps an omitted field, a deliberate choice and a tier that
admits no stance apart, and an intentional neutral stance is now expressible. The check is
**stricter** (ordered rules, abilities, equipment, upgrades, RP) and now runs at **zero-fight
qualification** as well as verification — Boss1 ran it on its earlier slot only, which is why the
later slot's gap surfaced after twelve fights. Proven declaration-only: both Boss1 blocks
re-qualify to **byte-identical** effective stats and roster hashes, at an unchanged definitions
hash `17aa46cb…`.

**Boss2 was then executed** (see the current phase above): 36 fights, all six blocks verified,
seven-boss combined map complete. This section is retained for the Boss1 record and the fix it
shipped.

See: [Boss1 review](bot-balance-boss1-review.md) ·
[declaration audit](bot-balance-boss1-stance-declaration-audit.md).

---

## Current decision: D37 EXECUTED and its receipts verified; the boss screen is BLOCKED at early tiers

Durability37 ran once at `bdee5dca`, 74/74 observations in 5m58.6s, both blocks verified,
navigation watch pass. **Receipts independently checked** — revision, tree and hitbox hashes match,
the definitions hash `17aa46cb…` was *recomputed* from source and is identical, and all 74
`ready.json` files were parsed mechanically: `hpTreatment` empty in every one. The runner
hard-asserts HEAD, a clean tree and both hashes before it writes anything, so execution on the
committed tree is enforced rather than claimed. **The Jungle ladder direction is confirmed**:
primary-lineage equal-weight body TTK now RISES 10.95 → 14.84 → 23.85 s.

**One defect in the adoption commit:** `server/test/t4ProgressionEconomy.test.ts` FAILS at
`bdee5dca` — its Trench snapshot still guards pre-adoption HP (2800/4200/5880 vs the adopted
16800/16800/17640). The repair was written during the run and left uncommitted. D37's measurements
are unaffected (test-only; the definitions hash is unchanged), but **no revision can be frozen
until it lands**, because the runner requires a clean tree. Qualification named four tests and
none of them guarded that HP.

**T3 Jungle pressure is open, and its mechanism is identified.** Five deaths, all T3, all with the
Silverback as dominant killer and the killing blow. The adoption changed **HP only**, so incoming
DPS is unchanged and exposure per body rose ~55%. The structural reading is a pool-to-burst ratio
(player `maxHp` ÷ worst observed second): T2 4.6–17.1, **T3 2.2–4.1**, T4 4.1–9.9 — T3 is a
defensive trough and every death sits at its floor. **Do not roll back the T3 HP adoption**; that
would re-break the ladder D37 just confirmed. The correction belongs on the T3 defensive margin,
and 9 observations would verify it. Conduit's summons, navigation (66/66) and mechanic firing all
checked clean.

**The single T2 Forest death is a known nonblocking attrition matchup** — largest hit 26.1 against
a 240 pool, death at 224.5 s after 28 kills and 18 late joiners. It blocks nothing.

**BOSS SCREEN BLOCKED — CORRECTED 2026-09-18.** The "inverted difficulty curve" reading below is
**WITHDRAWN**: the T2 and T4 figures came from two different instruments and are not comparable, and
**Apex Timberclaw was in fact beaten 2/2 on 2026-09-13** (`61080e54`, HP never below 41.9%). 0/126
describes ONE `bossExam.ts` configuration, not boss balance. The benchmark picks `gale-needle` — the
weapon the campaign's own V1i study measured at 0/2 — spends its entire 30-point RP budget on a
round-robin ability set with **zero** rune rules, and runs `offensive-stance` where the winning build
runs `defensive-stance` with Second Wind and Brace. See
[the T2 boss benchmark gap brief](bot-balance-t2-boss-benchmark-gap-2026-09-18.md). Superseded text:

[Boss reference packet](bot-balance-boss-reference-operator-packet.md): **FROZEN 2026-09-19, NOT
LAUNCHED.** Two cases, one boss (`apex-timberclaw`), one skill path (the recovered V1i Spirit
`energy-heavy` frame), one declared seed, 300 s cap: **2 fights**. Case A is the complete historical
successful package, Case B the complete legacy benchmark package for that same path. The four
component-removal arms were deliberately NOT built -- rules, abilities and stance share one RP
budget, and the ability-swap hybrid costs **39 RP against a 30 budget**, asserted illegal by
`bossReferenceMatrix`. Qualification records every starting package and spends ZERO fights. Recorded
setup: A = 231 maxHp / 100 attack / 18 plating / 0.19 DR / 0.9 taken / 129 barrier at 28 RP; B = 230
/ 36 / 10 / 0.02 / 1.1 / 69 at 30 RP; both meet the same 3750/44 boss with no other bodies present.
A's 231 pool matches the V1i report exactly. Interpretation is bounded in advance: a Case A win is a
usable reference FOR THIS BOSS AND BUILD, not harness correctness and not a balance result.

**Main milestone: resume the earlier/later boss numerical screen.** The mob campaign stays closed.

**RESULT 2026-09-19 — the reference question is ANSWERED, and it exposed a runner defect.**
Case A (the historical V1i Spirit package) killed Apex Timberclaw at **30,300 ms** with
authoritative kill evidence and 24.9% HP to spare. Case B (the legacy benchmark package, same skill
path) **died at 12,900 ms** with the boss still on 2,521 of 3,750 HP. **Case A is retained as the
current Spirit/Timberclaw reference** — for this boss and this build, not harness correctness and
not a balance result. A won and B lost, so the explanation stops at PACKAGE level; no
component-removal experiments were run and none are proposed.

**RUNNER DEFECT, FOUND AND FIXED.** `bossScreen.ts` read the boss's ABSENCE as a kill, forced
terminal HP to zero, and tested that BEFORE player death. `resetDungeon(..., "node_wipe")` removes
the boss and respawns the guard in the same tick, so B was first recorded as a 100%-removed victory
with twelve phantom adds on a boss that summons nothing. The raw log always said otherwise: zero
kill events, a `player-death` at 12,900 ms by melee from `apex-timberclaw`, and the message "The
guard reforms." A victory now requires boss-specific authoritative kill evidence; player death is
evaluated alongside, not after; disappearance, reset and simultaneous terminals are distinct
outcomes; terminal HP is the last SUPPORTED reading; and post-terminal replacement guardians are
excluded from add statistics. Verification now fails a self-contradictory record instead of passing
it, and re-checking the ORIGINAL records surfaces all four contradictions.
[Repair record](bot-balance-boss-runner-repair-2026-09-19.md). The originals were NOT overwritten;
a separate corrected re-read sits beside them, and the end-to-end rerun was limited to the same two
cases and is repair evidence, not balance evidence.

**Boss1 FINALIZED 2026-09-19 as the earlier/later screen.** `apex-timberclaw` is RESTORED as the
earlier slot on **explicit legal reference builds** (the corroborated shape: defensive stance,
Expose Weakness, Second Wind + Brace, five ordered rules; only the Spirit cell is historically
corroborated, the other five are constructions). The Sovereign preparation is PRESERVED untouched.
6 + 12 = **18 fights**, both blocks verified independently. The **T3 Jungle exception stays
separate** and is asserted out of both slots.

**BOSS SCREEN BLOCKED: the difficulty curve is inverted.** Measured today — **every T2 boss is
0 wins / 126 attempts**, with `apex-timberclaw` among the *cheapest* of the seven; T3 is ragged
(0/54 swamp to 37/54 jungle); and **T4 `charnel-crown-sovereign` wins 12/12** with qualified
tier-legal builds. With T1's documented 0/30, early-tier bosses are unbeatable by the reference
player while the final-tier boss is comfortable. The T4 result is a **positive control the
campaign did not previously have**: the same code path and rune loadout *can* win boss fights, so
0/N at T1–T2 measures the reference player at those tiers, not a useless harness. Freezing the
packet as proposed would re-measure a known wall. Three `bossExam` gaps also block a freeze: no
seeds (inert for a no-add boss — two seeds gave byte-identical results), no per-observation
receipts (so the mandatory escort-identity rule cannot be met), and the forbidden full build
cross-product. See
[the D37 decision note](bot-balance-d37-decision-and-boss-screen-blocker-2026-09-18.md).

[Boss1 operator packet](bot-balance-boss1-operator-packet.md): **FROZEN, NOT LAUNCHED.** ONE boss,
six tier-legal roots, two declared seeds = **12 attempts**, and it INSTALLS NOTHING. The earlier
slot is withdrawn on the evidence above, not deferred by preference. Definitions `17aa46cb...` and
hitbox `08bcc556...` are frozen and machine-checked; revision and tree are resolved mechanically
from the tip, so there are NO launch-time placeholders. The screen runs on a new
`server/scripts/bossScreen.ts`, because `bossExam.ts` consumes no seed, emits no per-observation
receipt (so the escort rule is unsatisfiable on it) and builds its bot without runes. Preflight is
green: the pilot killed the Sovereign in 37.6 s, crossed 50% at 24.2 s and fired Mass Resurrection,
with add pressure attributed per species.

**NEXT MAIN WORKSTREAM: the early-tier boss wall.** T1 0/30 (documented 2026-08-23), T2 0/126
(measured 2026-09-18), T3 ragged, T4 comfortable. The documented top blocker in
`docs/tier-balance-current-state.md` §8 -- the reference player broken by the five 2026-08-22
affinity / Barrier / Recovery / item / ability commits -- is still unresolved, and is now BOUNDED:
the T4 positive control shows the harness wins boss fights when the player is strong enough, so
0/N at T1-T2 measures the reference player at those tiers rather than a useless harness. Note that
the Barrier/Ward and Recovery reworks both shipped SYSTEMS ONLY with item data deliberately
untouched; that rebalance was already named as the next task and has not happened.

The adoption's red test is repaired forward in `dd8cae23` (`t4ProgressionEconomy`); D37 was NOT
rerun, and the definitions hash is unchanged by that commit.

## Superseded decision: the mob pass is INTEGRATED into source; Durability37 regression prepared; the first boss packet drafted

Durability36 ran once at `0e28217b`: 72/72 observations in 4m50s, both blocks verified, navigation
watch pass, zero deaths in Block J. The execution stands; five prose/interpretation findings are
corrected WITHOUT rerunning it (dated banner on [the report](bot-balance-durability36-report.md)).

**MOUNTAIN: the dedicated tuning sequence ENDS.** Block M's armor swap is 5 favourable flips, 1
adverse, 2 both-survived, 1 both-died over 9 pairs (reference 6/9 deaths, local-armor 2/9; alive
time 2233.9 vs 2393.2 s) on RE-USED D35 seeds. So Fallen Knight Plate is a credible
**post-acquisition** option for heavy-node cases, NOT a universal default and NOT proof first
entry is fixed - the recipe needs Mountain level 2 and +3 needs level 4. Apprentice/swarming stays
a named residual farming exception. This does not justify another item/rune/guard search or a
second enemy nerf. The already-implemented base attack of 40 stays; do not multiply by 0.8 again.

**JUNGLE: the tested ladder FAILED the intended direction, so one coarse role-based correction was
made.** Block J measured T3 directly for the first time: primary-lineage equal-weight clean body
TTK 10.95 s (T2 Ape) -> 9.95 s (T3 Silverback) -> 6.55 s (T4 Apex, on the retained 2900 overlay).
It FALLS. The fast lineages shorten too but far less steeply (4.15 -> 3.10 -> 2.475), so a
universal elite-duration floor was the wrong shape.

**ADOPTED AND IMPLEMENTED: 37 species, one commit.** The retained Forest/Volcano, Graveyard,
Desert, Mountain, Tundra and Trench packages, written as absolute authored values with every
overlay layer flattened - plus a NEW Jungle ladder that SUPERSEDES Durability34's 2900/3400 before
it ever reached source (`silverback` 3200, `jungle-stalker` 1250, `canopy-harrier` 1150,
`apex-silverback` 10000, `emerald-constrictor` 12000, `hunting-panther` 2400, `thornback-lizard`
2500; T2 deliberately untouched as the anchor). Those seven are a COMMAND-CENTER PROPOSAL derived
from D36, not measured successful values - Durability37 Block J is what checks them. Guarded by
`server/test/mobAdoptionIntegration.test.ts`. `dune-basilisk` carries the later Desert 9006, not
the other branch's 4503; Power Shot 1.8 and Hadal Stalker 21000 were never written.

**FIVE COUPLED DEFENCE FIELDS, one deliberate divergence, one deliberate non-change.** Every field
taken as a percentage of `maxHp` holds its PRE-ADOPTION ABSOLUTE budget: `granite-mammoth` ward
287.5 (authored as an expression - 1/48 does not round cleanly), `glacial-direbear` barrier 268.62
AND self-shatter 170.94, and three NESTED `monsterAbilities` shield actions - `elder-leviathan`
1058.4, `magma-brute` 280, `magma-salamander` 813.12. The last two DIVERGE from their own
experiments: D15 and D23 never scaled those shells, so both species are now weaker than in the
runs that selected their HP. Recorded, not hidden; D37 Block I families 2 and 3 observe it.
`granite-titan` keeps `wardPct` 0.25 because only its attack moved. `cragback-rhino`'s
`enemySoftCap.capPct` is deliberately NOT rescaled - it is self-relative and the retained
installer never touched it - so its clip threshold moves 275 -> 1650.

**FOUR TIER LABELS IN THE MANIFEST HAD DRIFTED**, resolved from `monsterPoolByTier`:
`obsidian-tortoise` and `magma-salamander` are T4 Volcano (not T3), `sand-scorpion` and
`stone-basilisk` are T2 Desert (not T4). The manifest is corrected and D37's family list uses the
resolved tiers.

**TEN INSTALLERS AND ELEVEN TESTS REBASED OR RETIRED.** `installNight5Treatment` reaches D20 ->
D19 -> D17/D15, so the multiplicative overlays were a LIVE double-application hazard, not
bookkeeping: D17/D22/D23/D24/D26/D27/D29/D34 are retired to no-ops, D15/D16 merely rebased
(they already write the adopted value), and D5/D7 gained `stone-eagle` in their own frozen test
fixtures. Historical experiments stay reproducible at their own revisions; no frozen artifact was
edited.

[Durability37 packet](bot-balance-durability37-operator-packet.md): PREPARED, NOT LAUNCHED. **74
observations**, two INDEPENDENT blocks, and it INSTALLS NOTHING - both blocks fight authored
source, so `hpTreatment` must be empty in all 74 and the preflight fails on a non-empty one.
J) the Jungle ladder re-measured, 54: D36's cells re-identified, seeds REUSED deliberately so the
only thing that moved is authored HP. Working intent ~11 -> 15 -> 23 s primary and ~4 -> 5 -> 6 s
fast; a miss is a measurement, not something to correct mid-run. I) one representative node per
OTHER changed family, 20: ten families x sensitive/comparator roots x one seed, all six roots
across the collection, Trench keeping 600 s and Graveyard 900 s. One seed is a spot check, never
certification. T2 Mountain family 7 sits on the named open exception - a Striker death there is
expected and dispositioned, not a new finding.

[Boss starter packet](bot-balance-boss-numerical-starter-packet.md): DRAFTED, NOT FROZEN. Two
bosses resolved from source, 6 roots, 2 seeds = 24 attempts. `apex-timberclaw` (T2 forest, no
summons, clean single-target) and `charnel-crown-sovereign` (T4 graveyard) - the latter chosen
because it summons `bone-crawler`, `plague-hound` and `carrion-vulture`, three species the adoption
changed, so it is exactly the "boss reuses changed ordinary mobs" case and its starting receipts
must name them. Reuse `bench/bossExam.ts`, NOT `--mode boss`, which has only ever measured the
dungeon guard. Four prerequisites remain before it can be frozen; a Jungle-only problem does not
block it, but a Forest or Graveyard problem in D37 Block I does.

## Superseded decision: T1 Mountain package ADOPTED; Durability35 corrected; Durability36 prepared, not launched

Durability35 ran once at `f123d46b`: 72 observations, 35 full windows, 37 deaths, zero cutoffs.
The survival result stands and was verified against raw; four numerical/label findings are
corrected WITHOUT rerunning it. See
[the corrected review](bot-balance-durability35-review-and-next-steps.md) and the dated banner on
[the report](bot-balance-durability35-report.md).

RESULT: survival 7/36 -> 28/36 (node-01 heavy 3->12, node-02 swarming 4->16), 21 pairs improved,
**zero adverse flips**. Three seeds, descriptive, not a population guarantee.

**ADOPTED AND IMPLEMENTED:** `ridge-archer` and `cliff-hopper` base attack 50 -> 40, written as
absolute authored values. Power Shot stays 2.2, Strong Kick 1.9, and HP, cadence, range,
movement, modifiers, ecology, rewards, abilities and RP are untouched. Guarded by
`t1MountainPressureAdoption.test.ts`; the Durability35 overlay is RETIRED to `[40,40]` so the cut
can never be applied twice; Durability32/33/34 drift asserts rebased 50 -> 40. Historical
experiments stay reproducible at their own revisions.

FOUR CORRECTIONS. (1) The reductions are **23.08%** and **23.44%**, not 30.0%/30.6%: the audit
sorted arms alphabetically and formed control/candidate, giving the wrong sign AND denominator.
Schema 4 takes a DECLARED baseline/comparison and computes the reduction per hit. This was a
schema-3 regression; D33's -18.71% used the correct orientation and stands. (2) 33 and 8 are
different units - 33 matched HITS across **28 matched RUN PAIRS**, plus 8 pairs with no
comparable hit, and 28+8=36. The dataset was fine; the labels were not. (3) `minHP` is the
lowest observed value, not terminal HP: only 4 of 35 survivors dipped below 8% and one with
minHP 0.169 ended at 0.925. (4) Per-node runtime attacks are **55 -> 44 on heavy** and 50 -> 40
on swarming; a pooled median does not describe a node.

TWO FRAMINGS WITHDRAWN. Conduit: `CannotAttack` describes the OWNER'S outgoing attacks only - it
never invalidated the build's survival, and the "missing-owner-exposure by design" blanket
exclusion is removed. Conduit stays in six-root viability tables with owner exposure and minion
damage reported separately. And my "no T3 TTK anywhere in this campaign" was too broad: scoped
correctly, there is no compatible JUNGLE LINEAGE T3 timing evidence; other biomes measured T3.

Swarming's 16/18 vs heavy's 12/18 is a difference in observed outcomes, NOT evidence that
swarming is disproportionately easy. It still contains deaths and low-HP survivors, and it is not
a reason to raise its damage or undo the package.

T2 MOUNTAIN STRIKER DISPOSITIONED BY EXTRACTION, no new grid. From the existing Durability29
`mountain2` artifacts: control 6/6 deaths at 98.9-456.1 s, candidate 3/6 at 101.9-569.7 s plus
three full 600 s windows. Killing blows were Granite Titan x4 and Boulder Thrower x4, with
**seven of eight unmatched to any cast** - ordinary attacks at 65/70 - and only 1-2 distinct
recent damage sources. So it is **sustained two-species attrition**, not a terminal mechanic and
not concurrency. The relief roughly doubled time-to-death and halved deaths. Whether the halved
rate is acceptable for a first pass is a command-center call, not a measurement gap.

[Durability36 packet](bot-balance-durability36-operator-packet.md): PREPARED, NOT LAUNCHED. **72
observations**, two INDEPENDENT blocks. M) local armor adaptation at the adopted enemy baseline,
18: three residual contexts (Slinger/heavy, Apprentice/heavy, Apprentice/swarming) x
reference/local-armor x D35's seeds, swapping ONLY `swamp-vest-t1` for `mountain-vest-t1`. The
plate is maxHp 32 / plating 5 / `guard.potency-pct` 0.15 against the wrapping's 30 / 4 /
`defense.dot-resistance` 0.2, and is NOT a damage-cap item; Mountain has no DoT, so the swamp
mechanic is inert there. ACQUISITION BOUNDARY: the plate needs Mountain level 2 and +3 needs
level 4, so this is a post-acquisition FARMING ADAPTATION and success must not be read as fixing
first entry. J) the actual Jungle T2/T3/T4 role-duration ladder, 54: six roots x three tiers x
three fresh seeds, one configuration per tier. All three node03 Jungle nodes carry the
**dominion** modifier - verified, not assumed - so modifier roles are comparable. T4 installs the
retained D34 package and restores it, and the installer refuses to guess at a half-integrated
state.

### Named gate ECON-1 — reward efficiency across tiers

> At later player tiers, lower-tier nodes in a recurring biome may yield better usable essence
> and biome XP per elapsed minute than current-tier nodes, because combat duration has increased
> without a sufficient reward premium.

**Recorded, not established.** Compare the SAME higher-tier character at x1 in current-tier and
accessible lower-tier versions of a recurring biome, on credited biome XP, usable essence and
catalyst progress per ELAPSED GAMEPLAY TIME, with caps, recovery/death costs and travel explicit.
Longer fights may alter payout rates; that is a hypothesis, not a result from synthetic capped
combat starts. Do not change rewards in a durability trial, do not equate kills with reward
value, and do not reverse the longer-combat design to restore an old kill rate.

### Boss pass — reuse the user's manual coverage

The user has already playtested and iterated boss MECHANICS manually. The boss pass reuses that
coverage and addresses numerical pacing and pressure. Do not restart functional discovery, and do
not claim its logs were inspected when they were not.

## Previous decision: Durability34 executed and corrected; Jungle package retained; Durability35 prepared, not launched


Durability34 ran once at `4c926e0e`: 108/108 observations in about seven minutes, both blocks
verified. Execution stands; the findings were corrected from the sealed artifacts **without
rerunning D34**. See [the corrected review](bot-balance-durability34-review-and-next-steps.md)
and the dated banner on [the report](bot-balance-durability34-report.md). Audits:
`AppData/Local/mmo-idle/audits/durability34-20260918`.

JUNGLE PACKAGE RETAINED. `apex-silverback` 1450 -> 2900 and `emerald-constrictor` 1700 -> 3400,
added to the [adoption manifest](bot-balance-mob-adoption-manifest.md) (now 32 species).
Measured clean TTK 2.85 -> 5.95 s and 3.27 -> 6.50 s, fast bodies unmoved (1.90 -> 1.90,
1.85 -> 1.80), both arms full-window with zero deaths. Do not rerun the doubling comparison.
**Cross-tier pacing is NOT closed**: there is no measured T3 TTK anywhere in this campaign - the
report's "2.90 s T3 anchor" was the T4 apex baseline, and the real T3 citation was authored HP
2090. Authored HP ordering is not the acceptance test for a duration ladder.

T1 MOUNTAIN MOVES TO ENEMY PRESSURE. The Brace substitution is rejected as a general solution
and Second Wind stays the reference guard. The guard-window audit explains why without blaming
the guard: matched hits inside a Brace window take 0.648x - its authored 35% reduction, measured
- but Brace covers only 5.07% of alive time and 14 of 147 hits. Four paired joint outcomes over
18 pairs: 3 both survived, 11 both died, 1 reference-died/substitution-survived, 3
reference-survived/substitution-died, with unequal exposure (2461 vs 1999 alive seconds). The
pressure fails, not the guard choice.

TOOLING BUG, MINE, FIXED. The audits inferred arms from id suffixes and knew only
`control`/`candidate`, so D34's `reference`/`substitution` collapsed into one `n/a` group and the
species table pooled treatments. Both now read arm and pairing metadata from the block MANIFEST,
pair on (class, node, seed), and FAIL LOUDLY on an undeclared arm. The arm split also exposed
that runtime `maxHp` was being overwritten by the last observation read; it has two values per
species because node modifiers scale it, and authored versus post-modifier HP are now distinct.
`durability35-preflight` checks derived reports semantically, not just exit codes.

RAMP CONFIRMED WITHOUT NEW INSTRUMENTATION. `rampOnCombat` mutates `dealsDamage.attack` directly
and emits NO buff event, so absent buff events never established a broken ramp. Read from
existing damage evidence, the Apex ramp climbs its authored 3%/s ladder and develops further in
the longer body: ramped share 81.9% -> 91.7%, p90 gross 124 -> 137, median unchanged at 108.

NOT EVERY ROOT DIRECTLY ATTACKS. Conduit logged 0 owner attack beats in all six Block M runs by
design (`CannotAttack`) while dealing 272-482 minion beats, and died once. Summon-only offense is
intended, not an exposure artifact.

[Durability35 packet](bot-balance-durability35-operator-packet.md): (superseded - it has since RUN, been corrected, and its package adopted; see the current decision.) PREPARED, NOT LAUNCHED.
**72 observations**, one block: six roots x two T1 Mountain nodes x control/candidate x three
seeds. Candidate is base attack 50 -> 40 on BOTH `ridge-archer` and `cliff-hopper` - a
two-species package, not an attempt to isolate either. Power Shot stays 2.2 in both arms; 1.8
remains parked. Contexts are node-01 (heavy, the problematic entry) and node-02 (swarming), so a
nerf that makes another context trivially easy is visible. Attack-derived special damage was
verified through the real pipeline: Strong Kick hp 65 -> 55, Power Shot hp 69 -> 57.5, both
falling by less than 20% - an authored 20% cut is not a promise of 20% less final damage.

### Named gate ECON-1 — reward efficiency across tiers

> At later player tiers, lower-tier nodes in a recurring biome may yield better usable essence
> and biome XP per elapsed minute than current-tier nodes, because combat duration has increased
> without a sufficient reward premium.

**Recorded, not established.** D34's Jungle kills fell 2084 -> 1597 at equal exposure (-23.37%),
which is KILL THROUGHPUT, not credited XP, essence or catalyst throughput. It motivates the gate
and does not settle it. When it runs: the SAME higher-tier character at x1 in current-tier and
accessible lower-tier locations; elapsed gameplay time as the denominator, never accelerated
wall time; like-for-like essence and catalyst families; credited versus nominal XP against caps;
recovery and death costs included; travel and setup reported apart from steady state. A useful
safe fallback route is not the failure - systematic dominance of current-tier progression is. No
reward retuning inside a durability trial, no reward multiplier automatically matching an HP
multiplier, and no rollback of longer combat merely to preserve kills per minute.

### Boss pass — reuse the user's manual coverage

The user has already playtested and iterated boss MECHANICS manually, more than ordinary mobs.
The boss pass reuses that coverage, locates existing logs where available, and addresses
numerical pacing and pressure. Do not restart boss functional discovery, and do not claim
artifact-backed certification for tests whose logs were never inspected.

## Previous decision: Durability33 executed and corrected; navigation CLOSED; Durability34 prepared, not launched


Durability33 ran once at `e4e39bc5`: 84/84 observations in 4m56s. Execution stands; five
conclusions were corrected from the sealed raw artifacts. See
[the corrected review](bot-balance-durability33-review-and-next-steps.md) and the dated banner
on [the report](bot-balance-durability33-report.md). Audits:
`AppData/Local/mmo-idle/audits/durability33-20260918`.

NAVIGATION IS CLOSED. Block A 12/12 full windows, Block C 36/36 full windows, zero deaths,
zero cutoffs, zero trapped rows. **58 escape attempts, 58 successes, zero failures.** The gate
opened Block C only after Block A was artifact-verified AND behaviour-passed. No further
random-seed navigation grid; the measured-coordinate fixtures plus this cohort answer it. The
geometry gate continues as a regression WATCH on Jungle blocks, not a scheduling dependency.

FIVE CORRECTIONS. (1) The Durability32 stall was diagnosed and targeted, not a separate
undiagnosed bug. (2) Exposure was undercounted: 1 Hz sampling misses contacts resolved between
samples, so the gate now uses escape EVENTS plus sampled geometry, and Block A is 8/12
exercised, matching Durability32's corrected 8/12. (3) Mountain Striker control is 2/3, not
3/3; arm totals are control 15/18, candidate 14/18, with three flips. (4) **Conduit's zero
owner attack beats is BY DESIGN** — the summoner carries `CannotAttack` and Champion is the
only specialization that restores a direct attack. Conduit took 1-2 landed Power Shots on the
owner in every run and died once. The earlier "missing exposure" framing was a shortcut this
chain introduced and is retracted in both reviews. (5) Power Shot is **-18.71% matched**, not
-22.1% pooled; Strong Kick is ratio exactly 1.000 over 21 matched pairs.

JUNGLE MEASURED AT LAST. 2,134 engagements: `emerald-constrictor` 1700 HP -> 3.55 s,
`apex-silverback` 1450 -> 2.90 s, `thornback-lizard` 1000 -> 1.77 s, `hunting-panther` 950 ->
1.90 s. **The authored ladder runs backwards**: the T3 anchor `silverback` is 2090 HP / 83
attack and every T4 Jungle species sits below it. Zero deaths is NOT a durability pass.

BRACE CORRECTION: the earlier "Brace is unaffordable at T1" claim was about ADDING it.
SUBSTITUTING Brace for Second Wind is cheaper than the reference (melee 17 vs 18, ranged 20 vs
21, budget 22) and legal for all six roots. Both are `hp-below` instants — Second Wind at 60%
heals, Brace at 50% gives 35% DR for 3 s — so neither reacts to a cast, and this is a
sustain-versus-mitigation opportunity cost, not Power Shot counterplay.

[Durability34 packet](bot-balance-durability34-operator-packet.md): (superseded - it has since RUN and been corrected; see the current decision.) PREPARED, NOT LAUNCHED.
108 observations, two INDEPENDENT blocks. J) Jungle HP-only candidate, 72: `apex-silverback`
1450 -> 2900 and `emerald-constrictor` 1700 -> 3400, both clearing the T3 anchor; fast bodies
untouched. M) T1 Mountain guard substitution, 36, Power Shot held at 2.2 in BOTH arms;
verified functionally that each arm activates its own guard.

[Adoption manifest](bot-balance-mob-adoption-manifest.md) is now resolved: 30 species, final
authored values with layers flattened, exact defence coupling, and a proposed patch shape.
Still `selected`, not applied. Records the composition trap that silently turns `dune-basilisk`
9006 back into 4503.

### Named gate ECON-1 — reward efficiency across tiers

> At later player tiers, lower-tier nodes in a recurring biome may yield better usable essence
> and biome XP per elapsed minute than current-tier nodes, because combat duration has
> increased without a sufficient reward premium.

**Recorded, not established.** All durability evidence is `economyEligible=false`. No reward
value changes in any combat packet. The screen belongs after the consolidated combat baseline.
Design constraints when it runs: the SAME later-tier character in both routes; **elapsed
gameplay time** as the denominator, never accelerated wall time; like-for-like essence and
catalyst families; credited versus nominal XP against caps; travel and setup reported apart
from steady state; and a useful fallback route is not the failure — systematic domination of
current-tier progression is. Block J lengthens T4 Jungle fights without touching rewards, which
moves this question rather than answering it.

### Boss pass — reuse the user's manual coverage

The user has already playtested and iterated boss MECHANICS manually, more than ordinary mobs.
The later boss pass reuses that coverage, locates existing logs where available, and addresses
numerical pacing and pressure. Do not restart boss functional discovery, and do not claim
artifact-backed certification for tests whose logs were never inspected.

## Previous decision: Durability32 executed and CORRECTED; the Jungle defect is located and fixed; Durability33 prepared, not launched


Durability32 ran once at `7247b6e2` and completed 120/120 observations. Its execution record
stands; four of its conclusions did not survive recomputation from the sealed raw artifacts,
which the command center could not open but this session could. Corrections are recorded in
[the corrected review](bot-balance-durability32-review-and-next-steps.md) and as a dated
banner on [the report](bot-balance-durability32-report.md). Raw artifacts were read, never
modified; audits live under `AppData/Local/mmo-idle/audits/durability32-20260918`.

THE JUNGLE DEFECT IS LOCATED. All 18 wall-ceiling rows plus one window-ended row end with the
player centre 1.6-21.9 px OUTSIDE a slow bush and its navigation footprint overlapping; none
end with the centre inside. The escape predicate tested the centre point, so it could never
fire in the band where hazard-aware planning had already died — at those exact coordinates
`findPathForMover` returns null with avoidHazards and a real path without it, which is why
auto-target reports "No worthy target nearby" beside 34-40 live monsters. The status-only
repair from the previous cycle was correct but insufficient: admission now uses
`moverOverlapsBlockShapes` with the mover's pad, the same primitive the nav grid blocks cells
with, for ground zones and node features alike. Fixtures use the measured coordinates and are
mutation-checked. Recovery suppression keeps its narrower real-damage meaning.

Report exposure claims were wrong in a specific, instructive way: "no hazard-escape event"
was read as "never touched a bush", but a repair that fails to fire emits no event either.
Measured from geometry, 8 of 12 Block A rows entered the envelope, not 1.

THE DEPENDENCY GATE WAS SEMANTICALLY WRONG and is fixed. Durability32 gated its breadth block
on `verifySurvey` alone, which only certifies artifact shape, so five correctly recorded wall
cutoffs still opened it. That was a tooling defect, not operator disobedience. The new
`navigationGate.ts` derives `scenarioExposure`, `navigationGate` and `balanceExposure` from
geometry and samples, `block-gate.mjs` holds the pure decision, and fixtures pin the
scheduling behaviour. Run retroactively, the gate FAILS both Durability32 Jungle blocks.

BLOCK B: the multiplier is not the lever, and the context was wrong. Attributed Power Shot
damage moves 68.2 -> 55.04 median (-19.3%), so the report's "-9%" was a metric error that
compared the control's Power Shot with the candidate's unchanged Strong Kick. Yet all 41
deaths had a Power Shot land within 10 s, 29 of 41 fatal blows overkill the HP they hit, and
10 of 12 first-arrival pairs die at the IDENTICAL millisecond. Deaths are an accumulated
deficit finished by an overkilling blow, so removing ~13 damage changes nothing. Prepared
-farming flips are symmetric (4 each way, 6/18 deaths in both arms). Conduit's 0/6 is a
missing-exposure artifact: 0 owner attack beats in all 12 of its runs. And the `first-arrival`
preset was not a credible first arrival - the shipped T1 route reaches Mountain with +3 gear,
a Swamp vest and charm, and Second Wind/Cleanse/Brace learned. Retain 1.8 as a candidate; do
NOT nerf Strong Kick from terminal-blow counts.

DESIGN QUESTION FOR THE COMMAND CENTER, found in source rather than a run: the T1 Runic Point
budget is 22, and Sweep(6) + Second Wind(6) + Brace(5) plus rune logic does not fit. Power
Shot publishes no telegraph and tracks the player, so Brace is its only mitigation counterplay
- and it is not affordable beside the standard sustain guard at T1.

[Durability33 packet](bot-balance-durability33-operator-packet.md): (superseded - it has since RUN and been corrected; see the current decision.) PREPARED, NOT LAUNCHED.
84 observations. A) the four historical Jungle setups on repaired source, 12. B) T1 Mountain
at the route's actual earned entry kit, control 2.2 vs candidate 1.8, 36. C) Jungle breadth,
36, GATED ON A'S BEHAVIOUR rather than its artifacts. No new Jungle HP treatment until C
yields role-specific timing.

The [adoption review](bot-balance-mob-adoption-review.md) is corrected: 30 unique species (not
23), Forest/Volcano resolved from the installers, the later Desert selection carried
(`dune-basilisk` 9006, not the intermediate 4503), the Mammoth ward stated as the exact 1/48
rather than a rounded 0.0208 that loses 0.46 of its absolute budget, and T2 Striker restated
as 6/6 -> 3/6 (halved, not "no help"). Still none of it is live. The T2 Striker follow-up is
6 observations, not 18, and extraction from existing artifacts comes before any new run.

## Previous decision: Jungle navigation REPAIRED; Durability32 prepared, not launched

Superseded in part: Durability32 has since RUN and been corrected. The "PREPARED and NOT
LAUNCHED" status below was true when written and no longer holds; see the current decision
above and the report's correction record.


The Durability31 repair is implemented at `7247b6e2`. `activePlayerAvoidedFeatures` now
classifies damaging AND status-only player node features, one identity per feature, and the
dynamic hazard escape owner reads it, so a player stopped inside a player-targeted
statusWhileInside slow bush escapes on a short standable leg instead of having every
hazard-aware path rejected at the initial padded-segment check. All five Durability31
invariants are covered by regression, mutation-checked to fail without the repair.
`activePlayerDamageFeatures` is deliberately untouched so out-of-combat Recovery suppression
keeps its narrower "real hazard" meaning. This is unit/regression evidence at the frozen
revision, NOT live-play or in-browser validation.

[Durability32 packet](bot-balance-durability32-operator-packet.md) is PREPARED and NOT
LAUNCHED: 120 observations in three separately reported blocks. A) the four unchanged
Durability30/31 Jungle setups on repaired source, 12 obs, with frozen pass/fail predicates
that separate a navigation recurrence from a legitimate death and record whether a bush was
exercised at all. B) T1 Mountain Power Shot, 72 obs, six roots x two preparation contexts x
control 2.2 vs candidate 1.8. C) Jungle breadth, 36 obs, gated on A. Frozen `7247b6e2`;
definitions and hitbox hashes are unchanged from Durability31, so progression definitions and
collision geometry did not drift under the repair. Qualify and 30 s pilots passed for all
three blocks; pilots are smoke checks and must never enter the operator dataset.

NEW EXCEPTION from the user: T1 Mountain archers and Power Shot may be excessively punishing.
Block B screens exactly that and nothing else. T1 is not otherwise reopened. The counterplay
was traced rather than assumed: Power Shot authors no `aoe`, so no slam-telegraph zone is
published and Step Back never sees it; `hasMobileMonsterCast` is true so the archer tracks
through the wind-up and neither Orbit nor leaving range denies it. Mitigation or a stun/freeze
interrupt is what remains. 2.2 is the executable value; the data file's "2x" and "3 -> 1.8"
comments were stale and were corrected without changing the number.

[Adoption review](bot-balance-mob-adoption-review.md) headline: **no retained mob candidate
is live.** All 23 checked species are authored at pre-candidate values; every retained
package exists only as a bench overlay. The candidates are also STACKED — D26/D27/D29/D30
each install an earlier packet's overlay first and then modify it — so `granite-titan`'s
retained attack 54 is two compounded 0.8 steps, and `granite-mammoth`'s retained 13800 HP
requires writing `wardPct` 0.0208, not 0.25, to preserve the absolute ward of 287.5.

T2 Mountain Striker is dispositioned as **unresolved evidence**: the relief cut T2 deaths
10/36 -> 5/36 while Striker stayed 3/6, stance is ruled out by Durability28's 3/12 in both
stances, and the candidate's own deaths make its timing sparse. The smallest follow-up
question is proposed in the review as a SEPARATE 18-observation packet, deliberately not
appended to Durability32.

Roadmap order agreed with the command center: ordinary mobs -> bosses -> coordinated items
and abilities -> class tuning -> integrated regression and basic x1 checks -> invited
playtest. See [the assignment brief](bot-balance-next-steps-2026-09-18.md). Preserve the
expedited-playtest principle; make exceptions explicit at each phase exit.

Two incidental repairs found while qualifying: `pnpm typecheck` was red on develop because
`shared/` has no `@types/node` and one test imported `node:assert`; and `prepareSurveyBot`
rejected +0 gear as illegal because it passed a HELD upgrade level into a helper that expects
a TARGET of 1 or more. Both fixed; cells may now declare an explicit `upgradeLevel`.

## Previous decision: Durability31 reviewed; one navigation repair is the next step


[Durability31](bot-balance-durability31-report.md) executed once on 2026-09-17 at
frozen d6643bde and completed all12 Jungle observations. READY files are
byte-identical to their Durability30 counterparts and the event/sample streams are
exact prefixes, so the diagnostic wrapper changed no gameplay. Six observations
reached the120s window and six hit the process wall ceiling. Zero player deaths.

The six wall cutoffs are a navigation runtime artifact, NOT Jungle balance
evidence. A player standing inside a status-only Jungle slow bush
(player-targeted `statusWhileInside`) has every hazard-aware request rejected at
the initial padded-segment check, because hazardAvoidanceShapesForMover includes
status shapes as avoidance geometry while the bush is not a block shape.
Auto-target then repeats that rejection across candidates through both its primary
and fallback reachability branches:94.1-99.6% null paths on cutoff rows, up to
17417 path calls, fixed position, no selected target/motion/path. A read-only
frozen probe returned null with avoidHazards=true and a direct one-point path with
avoidHazards=false for the same exact keys. Ruled against: broken collider or
generally unreachable destination, costly successful routes (normal rows show
0.15-4.6 path ms per simulated second and zero nulls), target churn, and GC (~7.89%
of sampled time). Do not read the six cutoffs as Jungle survival or pacing data.

Next step is exactly one targeted repair, not another diagnostic grid: extend the
existing dynamic hazard escape owner (`server/src/systems/combat/ai/dynamicHazardAvoidance.ts`)
to also claim escape for a live player-targeted statusWhileInside feature, using a
short physically standable escape leg at avoidHazards=false before ordinary
hazard-aware targeting resumes. The five regression invariants in the Durability31
report are binding, including the new inside-a-slow-bush regression case. No cache
or debounce workaround. The repair is NOT implemented and no Durability32 packet is
frozen.

After the repair lands and its regression is green: consolidated current-source
reconciliation and adoption review of the retained packages (T4 Mountain candidate,
Desert controller HP with situational Defensive Striker, Stalker16800 alongside
Leviathan17640/Serpent16800), then the bounded shallow all-mob playtest gate. T2
Mountain Striker pressure and Jungle durability stay explicit open exceptions, not
silently counted as passed. Boss/progression/x1 economy readiness and broad
class/ability polish remain separate.

Campaign docs are no longer uncommitted: Durability8-31 and Night4/Night5 reports,
plus the combat and death-attribution fixes those runs surfaced, are on `develop`
as `54a54a82`. Durability31 evidence is synthetic (economyEligible=false); it is
diagnostic evidence about the frozen simulation, not live-play or economy
certification.

## Previous decision: Durability30 reviewed; Durability31 Jungle diagnosis prepared

Superseded in part: this section was written before Durability31 ran. Its "NOT
launched" status no longer holds; see the current decision above.

Durability30: Trench72/72 complete600s windows,zero deaths; Jungle6/12 complete
and6/12 wall cutoffs. Hold Stalker16800 rather than adopt21000: the candidate
helps some fast roots but stretches already-long Squire/Conduit fights. Keep
Leviathan17640/Serpent16800 context; no further Trench scalar grid. Class/build
spread remains a later-layer issue, not uniformly solved Trench pacing. Zero deaths
IS bounded survival evidence; report wording suggesting attrition was untested is
too strong. Pressure differs by root, and unlimited safety is not established.

[Durability31 packet](bot-balance-durability31-operator-packet.md) prepares12
unchanged Jungle observations with one CPU profile per observation, cumulative
per-tick navigation counters and bounded exact repeated-request aggregates.
Frozen d6643bde; reuses Dur30 Jungle matrix/IDs intentionally. Four qualifications,
two pilots and focused checks passed; pilot READY/events/samples match the original
uninstrumented pilots. NOT launched. No gameplay/stat changes; opt-in diagnostics.
The baseline navigation files match current main, but unrelated dirty gameplay
changes are excluded. This is controlled diagnosis, not current-source certification.

Use the results to choose one targeted repair/regression, not another diagnostic
grid. Then consolidate retained mob packages on current source; keep T2 Mountain
Striker pressure and Jungle durability explicit. Preserve shallow playtest roadmap;
boss/progression/x1 economy and broad class/ability polish are separate.

## Previous decision: Durability29 reviewed; Durability30 Trench/Jungle prepared

Durability29 completed144 observations (120 windows,20 deaths,4 wall cutoffs).
Retain T4 Mountain candidate for consolidated adoption review: deaths4/36->1/36,
longer body timing retained; minHP median42.63->60.21. One Maestro death and sparse
Slinger timing remain, not universal safety. T2 deaths10/36->5/36 but Striker3/6
candidate deaths: Titan54 remains provisional. Boulder terminal blows do not prove
sole cause. Hold the specific T2 build/pressure question; stop broad Mountain grids.

[Durability30 packet](bot-balance-durability30-operator-packet.md):84 observations.
Trench72 compares selected Stalker16800 vs21000 HP, all six roots/two nodes/fresh
paired seeds; Leviathan17640 and Serpent16800 fixed, absolute shield preserved.
Target remains40–60s representative mini-boss fights for all three species, not
every class. Jungle12 replays four unchanged Dur23 setups with CPU profiling to
diagnose the six prior cutoffs before any Jungle durability patch. Profiling wall
times are not directly equivalent balance benchmarks. No assumed movement cause.
Frozen e151f061;28 qualified setups/14 pilots, focused test/typecheck and Windows
profile smoke passed. Full experiment NOT launched. No production balance edits.

After these gaps: consolidated current-source reconciliation/adoption review and
bounded regression for the shallow all-mob playtest gate. T2 Mountain remains an
explicit exception requiring a targeted decision, not silently counted as passed.
Boss/progression/x1 economy readiness and broad class/ability polishing remain
separate. Preserve the faster-playtest roadmap rather than demand perfect parity.

## Previous decision: Durability28 reviewed; Durability29 Mountain attack comparison prepared

Durability28 verified: T2 Mountain3/12 deaths both stances; Desert6/12 Offensive
vs0/12 Defensive; T4 Mountain2 Offensive/3 Defensive deaths, one cutoff each.
Retain Desert controller HP candidate with situational Defensive Striker template
for adoption review; clear survival/throughput tradeoff, not universal stance winner.
Do not keep re-running Desert. Mountain mitigation insufficient; T4 deaths all
Maestro. Report reference to five-root interpretation is inapplicable to this
TWO-class sample. Do not promote sparse/cutoff timings to success.

[Durability29 packet](bot-balance-durability29-operator-packet.md):144 observations,
all six roots/two nodes/fresh paired seeds, Offensive fixed both arms. T2 selected
Titan attack67->54 while Eagle60/Boulder72 fixed; T4 selected four-mob roster attack
80% while HP/absolute ward fixed. Retained HP package includes Mammoth13800.
Test pressure relief and all-root over-relief risk, not another HP/stance grid.
Frozen699122f6;48 setups/24 pilots plus focused checks passed. NOT launched.
No production balance edits. Whole database restoration includes attack explicitly.

After this Mountain decision prioritize pending Jungle performance/durability and
Trench Stalker timing, rather than indefinite intermediate scalars. Selected values
still require consolidated current-source reconciliation/regression; no full mob
or invited-playtest certification. Desert's ordinary defensive solution is sampled
preparation evidence, not proof of live feel or economy pacing.

## Previous decision: Durability27 reviewed; Durability28 melee stance interaction prepared

Durability27: Mountain18->6 deaths/36 plus one candidate cutoff; Desert0->6/36.
Mountain pressure reduction works for much of the roster but Striker4/6 candidate
deaths remains. Desert controller center~15.2s among five eligible roots, while
Striker6/6 candidate deaths makes its timing sparse. Retain numerical directions
provisionally; test normal player defensive preparation before further HP rollback
or blanket attack changes. Conduit T2 Basilisk27.6s is below its own T3~44.15s;
comparing only to the all-root T3 center does not establish a class-specific reversal.

[Durability28 packet](bot-balance-durability28-operator-packet.md):72 observations,
Striker/Squire, Offensive vs Defensive stance on fixed candidate packages across
T2 Mountain/T2 Desert/T4 Mountain. Each class has a paired same-seed control;
Squire is a melee comparator. T4 profiles are Maestro/Reverb. Mob values, gear,
runes and abilities held fixed. Frozen40eba357;24 setups/12 pilots plus focused
technical checks passed. NOT launched, no production edits. If successful assess
TTK/throughput cost; if not isolate pressure rather than repeating a broad HP grid.

Still pending: current-source reconciliation, Jungle performance/durability,
Trench Stalker pacing, and consolidated adoption/regression. This narrow build
interaction does not certify six-class balance or invited-playtest readiness.

## Previous decision: Durability26 retained provisionally; Durability27 T2 gaps prepared

Durability26 completed144 observations/no wall cutoffs. Mammoth candidate center
32.79s vs15.88s; Basilisk23.50s vs13s. Retain Mammoth13800/Basilisk9006 with fixed
absolute ward for consolidated review instead of automatically reducing HP to
accommodate slow class tails. Those tails stay explicit for class/build work.
IMPORTANT: all Mountain deaths were Maestro3/6 candidate vs0/6 control; unresolved
pressure regression, not3/36 generic rare variance. Desert had no deaths. Neither
package is production-adopted or universally validated. Report adjust-both is an
operator recommendation; planner retains provisionally with these boundaries.

[Durability27 packet](bot-balance-durability27-operator-packet.md) prepared, NOT launched:
144 observations, T2 Mountain attack80% on Titan/Eagle/Boulder Thrower, and Desert
Scorpion/Basilisk HP1.75x with Scarab unchanged; independent control/candidate blocks.
Same six Durability25 T2 builds/two nodes/three fresh seeds. Attack-derived casts
scale naturally in Mountain; no multiplier/cadence/mechanic edit. Frozen5925ee93,
48 setup checks/24 pilots and focused technical checks passed. No production edits.

This addresses known T2 gaps rather than repeating the T4 grid. Remaining: T4
Maestro pressure, Jungle performance/durability, Trench Stalker timing, then source
reconciliation/consolidated adoption and focused regressions. Initial mob pass is
not complete. Deep class/item/ability balance remains later; no perfect-equality
or zero-death requirement. Preserve user-defined role differences and tier ladder.

## Previous decision: Durability25 reviewed; Durability26 targeted anchor trial prepared

Durability25 completed216 observations,194 windows/22 deaths/no wall cutoffs.
Primary root-weighted Mountain TTK19.28/25.27/14.50s and Desert8.80/22.10/14.61s
for T2/T3/T4 establish a T4 reversal in this baseline. This is a gap against intent,
not grounds to reject rising tier pacing. Report's no-numeric-adjustment language
is too restrictive for planning a local candidate trial, though global adoption
would be premature. Spirit's +0.4/-0.65s split belongs to Desert, not Mountain.

[Durability26 packet](bot-balance-durability26-operator-packet.md):144 observations,
paired selected T4 control vs doubling ONLY Mammoth6900->13800 and Basilisk4503->9006.
Mammoth absolute ward preserved, all other selected values unchanged. Six branch-A
builds/two nodes/three fresh seeds; monitor attrition and slow tails. Frozen9c333816;
48 setups/24 pilots passed. NOT launched. No production balance changes.

T2 Mountain14/36 deaths is an actionable pressure concern, not occasional noise.
Operator packet includes a bounded read-only review of existing death windows and
comparable survivors, without extra runs or attributing everything to killing blow.
T2 Desert primary center8.80s is also below the intended tough-controller guide;
keep it explicit rather than calling all T2 complete.

Remaining mob gates: T4 anchor pacing, T2 Mountain pressure/T2 Desert controller
pacing, Jungle performance/durability, Trench Stalker pacing, consolidated source
reconciliation and targeted regression. Route validation is past; first-pass mob
calibration is still ongoing. Keep selected Graveyard and other candidates, but
selection is not production adoption or full tier-pacing certification. Bosses,
progression/basic x1 and operations remain before invited playtest. Deep class,
item and ability balance stays later. Do not promise a date or arbitrary percentage.

## Previous decision: Durability24 retained; Durability25 tier ladder prepared

Durability24 verified arm deaths: control-normal 5/42, control-focus 20/42,
redistributed-normal 0/42, redistributed-focus 12/42. Retain the exact five-species
Graveyard HP redistribution under normal targeting for consolidated adoption review.
Do not re-run universal Focus Elites. No production adoption yet.

Planner correction: the report assigns a 40–60s goal to Gravewright, but that goal
was specified for the three Trench species. Gravewright's ~15.925s root center is
not automatically a failure against an invented target. Its role and pack duration
need their own interpretation. Report pack columns described as all-target body
medians are not actual episode-clear durations.

[Durability25 packet](bot-balance-durability25-operator-packet.md): 72 cells / 216
observations, Mountain and Desert, T2/T3/T4, six roots, nodes03/05, three fresh seeds.
One frozen runtime, selected T4 durability22 overlays and existing T2/T3 definitions.
Conduit uses tier-appropriate rapier and Spirit fast weapons throughout the ladder
rather than historical lower-tier axes; this is a fresh experienced-pacing screen,
not a pure specialization-DPS isolation. Branch A names must be shown in reports.
72 setups and 36 pilots passed; frozen 03a3bf24; NOT launched. No production edits.

Use root-weighted role-matched body timing plus real episode durations, explicit
fast/slow/missing/death tails. Compare Titan/Colossus/Mammoth and Basilisk roles,
not pooled all-mob kill medians. Retain 16 earlier species candidates and Graveyard's
five-species package. Pending Jungle performance/durability, Trench Stalker pacing,
and current-source regression remain open; this limited ladder is not full mob
certification or playtest readiness.

## Previous decision: Durability24 prepared; tier pacing is an explicit remaining gate

[Durability24 operator packet](bot-balance-durability24-operator-packet.md) is
prepared, NOT launched: 56 cells / 168 observations, six A-root builds plus
Blunderbuss, two nodes, three seeds, four HP/targeting combinations. Candidate
Gravewright HP doubles and escort HP falls 40%; ordinary and Focus Elites policies
are tested under both HP distributions. Frozen d00215b4; 56 setup checks and
28 short pilots passed. No production balance edits. Jungle source/performance
investigation remains a separate pending task.

USER REAFFIRMATION: TTK must rise across tiers, more sharply for low-density elites;
all Trench species should represent 40–60s mini-bosses. Do not equate survival or
improvement over old T4 values with meeting this ladder. Stalker ~35s remains below
target; Volcano anchors ~10–14s do not establish T4 > T3. Before declaring the mob
pass complete, run a focused role-matched tier-ladder regression on a consistent
source with equivalent build philosophies and tier-appropriate preparation.

Use equal-weight six-root/profile medians by encounter role, plus explicit fast/slow
and specialization tails. No single T4 class is a universal average-DPS reference;
kill-pooled medians over-weight fast builds. Trench node03 Leviathan candidate
medians include Apprentice 22.3s, Striker 40.4s, Slinger 47.4s, Spirit 66.5s and
Squire 128.6s; Conduit's 306s has only one eligible seed and is not a reliable timing
benchmark. These are encounter/build observations, not universal class rankings.
Retain the 16 selected candidates pending adoption review, with pacing gaps explicit.

## Previous decision: Durability23 reviewed; Graveyard durability distribution clarified

Durability23 retained 192 observations: Volcano 71 windows/one candidate death,
Graveyard 64 windows/20 deaths, Jungle 30 windows/six wall ceilings. Volcano's
Tortoise and Salamander HP candidates remain recommended for consolidated adoption
review (eligible representative body medians 9.88s and 13.90s). No production adoption.

USER DESIGN CLARIFICATION: Gravewrights should carry high HP, with lower-HP
accompanying creatures. This supersedes the earlier squishy-necromancer assumption
in the packet/source comments. Preserve role differences among escorts; this is
not a request to make every follower identical or to add a general damage nerf.

Planner correction to the report: Focus Elites demonstrably changes selection,
but is NOT a generally validated template improvement. Deaths were 17/42 with
Focus versus 3/42 without; all Conduit and Spirit focused runs died. Keep this
as a conditional tactic, not a default. Aggregate DoT/cast totals have unequal
survival exposure and do not isolate the cause. Pursuit/positioning and live pack
pressure remain hypotheses requiring event-level checks.

Recommended next test: bounded Graveyard HP redistribution, comparing current
and candidate HP under both normal and elite-priority targeting. Lower escort
HP alongside raising Gravewright HP; do not just extend the leader fight. Check
pack clear time, deaths, resurrection/risen pressure and specialization tails.
Exact candidate numbers and executable packet remain to be prepared. Jungle
needs a separate bounded performance investigation of the six named cutoff rows;
short normal windows show low durability but do not certify the biome. Carry
forward the 14 Durability22 and two Volcano candidates without repeating them.
No new experiment or balance change executed during this review.

## Previous decision: Durability22 reviewed; remaining T4 role screen prepared

Durability22 completed288 observations,283 windows/five deaths/no timeouts.
Retain all14 candidate HP packages for consolidated adoption review, preserving
absolute shields/wards/self-shatter. No production adoption yet. Mountain03's
three candidate deaths and slow Conduit tails remain watch items, not automatic
reasons to repeat the full matrix or require zero deaths. Excluding inconclusive
cells gives Trench57.75/48.7/34.95s representative Leviathan/Serpent/Stalker medians;
near enough for the initial pass rather than further fine tuning now.

[Durability23 packet](bot-balance-durability23-operator-packet.md):192 observations,
Volcano two-anchor HP comparison, Graveyard Focus Elites comparison including
Blunderbuss, and separate short Jungle exposure/runtime block. Frozenb12bb917,
no production edits, NOT launched. Gravewright is intended to die quickly when
prioritized; test its counterplay before increasing its HP or nerfing DoT. Finish
remaining biome decisions then consolidate mob changes and run focused regression.

## Previous decision: Durability21 reviewed; Durability22 durability candidates prepared

Durability21 completed108 observations in5m19s:107 windows, one Volcano Conduit
accumulated-DoT death, no timeouts. No broad damage nerf from that single death.
Tundra's2–5s species medians warrant durability changes despite zero deaths;
T4 Mountain's own ~2s species evidence supports its candidate independently of
T2 Striker deaths. Corrected24 raw low-sampleHP values mislabeled as percentages
in report21; normalized minHP stays unchanged.

USER DESIGN CLARIFICATION: ALL THREE Trench species should feel like40–60s
mini-boss encounters. This supersedes the prior suggestion to leave Trench HP
unchanged or target only its apex. Respect full class spread/slow Conduit tails;
this is representative encounter pacing, not enforced equality for every class.

[Durability22 packet](bot-balance-durability22-operator-packet.md):96 cells/288
observations, four independently budgeted paired control/candidate blocks:
Trench, Mountain, Tundra, Desert.14 species HP candidates, fixed absolute
wards/shells/self-shatter; attacks/DR/plating unchanged. Frozen ffd6f1ec, no
production patch and no full run launched. Review for consolidated mob adoption
rather than more broad screening; rare deaths remain contextual, not automatic
failure. Other biomes and current-source reconciliation remain in mob worklist.

## Previous decision: Durability21 prepared; occasional deaths are not automatic failure

[Durability21 packet](bot-balance-durability21-operator-packet.md):108 observations,
T4 Tundra/Volcano/Trench, six medium/native-range roots with Night5A specializations,
two nodes, three fresh seeds, five-minute windows and separate biome budgets.
Frozen bcd0b0a3; no new mob stats. Includes a bounded read-only review of24 existing
Night5 Mountain Striker/Desert Equinox/Graveyard Blunderbuss rows. NOT launched.

User accepts occasional deaths and biome variability. Expert preparation does
not make a fixed bot policy perfect. Interpret failure frequency, exposure time,
preventability, pull/pressure sequence and eventual recovery cost; zero deaths
in every build is not the playtest gate. Do not automatically nerf Mountain from
Striker losses or pool short deaths with full windows as equivalent exposure.

## Previous decision: Night5-R1 reviewed; invited-playtest roadmap

User approved a shallow initial mob balance pass through ALL tiers1–4, focused
regression, basic x1 pacing and operational checks, then a small invited playtest.
Full item/class/ability parity and comprehensive economy work move to subsequent
polishing with player feedback. See [Night5-R1 review and active roadmap](bot-balance-night5-r1-review.md).

Night5-R1 completed its6h43m queue but only1222/1572 observations. T4 Tundra and
Volcano remain untested; Trench sparse. Prioritize their breadth with one credible
specialization per root and independent biome budgets; no repeat of all18 builds.
Separate Jungle performance from mob balance. T4 Mountain species die in roughly
1–3s; strong durability review candidate. Cave boots support ranged Mountain
orbit templates, not disabling kiting globally; T2 Striker remains problematic
with both boots. Forest/Volcano selected overlays still need explicit production
adoption. Preserve branch/weapon findings for later, without blocking the mob gate.
No new experiment launched or balance patch applied during this review.

## Historical decision: Durability19 reviewed; broad Durability20 closure survey ready

Both selected packages had zero deaths in36 observations each. Forest had one
9.9% Apprentice survivor dominated by Spitter pressure; Volcano none below20%.
Recommend retaining both for adoption consideration, with explicit exceptions.
Conduit Volcano05 remains exposure-limited, not a universal mob-TTK veto. Report19
sign/species/geography/checkpoint wording corrected against raw data. No production
mob files changed in this preparation.

[Durability20 packet](bot-balance-durability20-operator-packet.md) surveys all14
T2/T3 biome-tier combinations, nodes03/05, six roots, three fresh seeds:504 runs.
One selected arm; Forest/Volcano packages carried as local overlays, other mobs
unchanged. Preserve Jungle defensive stance exceptions. Snapshot14fce3ed uses the
same current runtime as19.168 setups, four pilots, overlay test and bench typecheck
passed. Manual Luna, NOT launched; estimate35–60min. Deliver a14-row coverage map
and at most three remaining mob interventions, with class/tooling exceptions apart.
Do not launch another blanket candidate-selection loop. T4/boss/class/ability and
economy work remain later; Conduit baseline remains explicitly unsettled.

## Previous decision: Durability19 current-runtime candidate confirmation prepared

Durability18 resolved Striker's observed death/low-HP tail with either Wolf22 or
defensive stance. Wolf22 retained20s Wolf median; defensive stance took30.6s.
Carry Wolf1575HP/22attack and Badger945HP/25attack, with offensive baseline.
Raw READY corrected in report: scaled Wolf32/26, Badger30; table error only.
[Durability19 packet](bot-balance-durability19-operator-packet.md) confirms Forest
and parked Volcano (Tortoise3000HP/116attack, Salamander84attack) against current
unmodified mob stats on a frozen current server/shared snapshot. Six roots,
two nodes per biome, two arms, three fresh seeds:144 runs. Ready, NOT launched.
48 setups/four pilot observations and focused tests passed. Frozen6ac0a4b7 includes
Heat/chill cleanup and attribution/status updates; concurrent originals preserved.
No production mob patch. If results hold, review concrete adoption per biome rather
than repeat candidate selection. Conduit class weakness remains later-pass evidence;
actual exposure failures remain separate. Next class/ability and T4 work stays later.

## Previous decision: Durability18 focused Forest pressure/build trial ready

Durability17: eight deaths (seven Striker, one Apprentice), all Forest03; only
two long-quiet rows. Adult duration improved, but pressure80 still leaves a
Striker death and deep-low survivors. User approved a focused comparison.
[Durability18 packet](bot-balance-durability18-operator-packet.md) applies local
candidate adjustments: Wolf attack27 versus22 crossed with offensive/defensive
stance, fixed Wolf1575HP and Badger945HP/25attack. Striker/Apprentice Forest03,
three historical seeds:24 observations. No production adoption yet.8 setups and
four-arm pilot passed; overlay test and bench typecheck passed. Frozen e8d4a6bd.
Ready for manual Luna, NOT launched. Conduit's unsettled class/build baseline is
for the later class pass; do not use its long TTK as a universal mob durability
ceiling. Separate actual movement defects. Source reconciliation/fresh confirmation
remain before production adoption; no Slam/class buffs in this pass.

## Previous decision: Durability16 reviewed; Forest Durability17 prepared

Durability16 completed72 observations in7m28s: one reference death, no treatment
deaths, seven exposure flags,15/18 retained matched sets,36/36 historical bookend
matches. Both80 remains the leading Volcano candidate, not production adoption.
Conduit03 has two matched seeds but excludes the lethal8089 comparison; Conduit05
still has no clean Tortoise median. Keep these as targeted unresolved cases.
Do not repeat the whole old matrix. Reconcile newer combat and confirm candidates
on fresh seeds before adoption.

[Durability17 packet](bot-balance-durability17-operator-packet.md) returns to T2
Forest: six roots, nodes03/05, three fresh seeds, four adult HP/pressure arms,
144 observations. Wolf/Badger HP1x/2x/3x and3x with attack80%; Whelps/Spitters stay
unchanged.48 setups and four-arm pilot passed, along with bench typecheck and
overlay restoration tests. Ready for manual Luna, NOT launched. Frozen413a43e5;
no production/ability changes. Then review remaining T2/T3 role coverage and
candidate reconciliation; item/class/ability, boss TTK and T4 remain later.

## Previous decision: Durability15 reviewed; Durability16 species pressure trial ready

Durability15 completed144 runs in22m44s. Deaths by arm: control2, pressure80 zero,
anchor150 one, combined zero. Eight long-quiet rows remove five complete matched
sets; Conduit03 has no clean four-arm set. Attack relief is promising, HP alone
is insufficient, and neither result authorizes blanket production adoption.
[Durability16 packet](bot-balance-durability16-operator-packet.md) isolates Tortoise
versus Salamander attack relief at fixed Tortoise HP3000: three sensitive classes,
two nodes, four arms, three historical seeds =72 runs. Prepared, NOT launched.
Local24-case qualify/four-arm pilot, overlay tests and bench typecheck passed.
Frozen1b0188d8 retains the Durability15 combat runtime; newer concurrent changes
are excluded. No movement prerequisite or production/ability patch. Exposure
limits remain explicit. If Conduit remains inconclusive, isolate its diagnostic
work rather than repeat whole matrices; then resume remaining T2/T3 roster roles,
including Forest, with candidate reconciliation/fresh confirmation before adoption.

## Previous decision: Durability15 selective Volcano balance trial prepared

Durability14 completed72 runs: two deaths and four terminal inactivity cases.
Local diagnostics reproduced all four; pack-assist reacquisition and vent-edge
approach are candidates, not resolved causes. Keep them isolated in interpretation.
[Durability15 packet](bot-balance-durability15-operator-packet.md) prepares144 runs:
six classes, two nodes, three paired seeds, four arms (control, attack80%, Tortoise
HP150%, combined). Sweep fixed; no production balance/movement/ability edits.
All48 setups and a four-arm30s pilot passed, as did frozen typecheck and overlay
restoration tests. Full experiment is NOT launched. Manual Luna executes once.
Audit internal and terminal inactivity; preserve all deaths and compare matched
four-arm sets for exposure sensitivity. Then resume T2/T3 roster/role balance;
Slam/ability tuning and T4 remain later. Concurrent combat edits remain excluded.

## Previous decision: Swamp handoff repaired; Durability14 Volcano continuation prepared

Durability13 stopped correctly at14/15 movement passes; the72 Volcano comparison
runs were never launched. Swamp6151 was a hazard-clearance handoff loop: normal
chase cancelled an unfinished retreat and reset its timeout. Repair6be18a7b
finishes the retreat leg and keeps the failure budget across mode changes.
No numeric balance change. Frozen local qualification now passes15/15 full300s
windows with zero deaths and maximum quiet gaps6.3–16.4s. Swamp6151's gap is11.7s,
and the previously stalled Hexer is actually killed at176.0s.

[Durability14 operator packet](bot-balance-durability14-operator-packet.md) is ready
for manual Luna, not launched: only the pending72-run Volcano Sweep/Slam matrix
on frozen6be18a7b. It checks the completed movement receipt rather than rerunning
it. Keep exposure audit and blocked/quiet cases separate from balance conclusions.
Next remains remaining T2/T3 roster/role gaps, then item/class/ability work, boss
TTK and later T4. Concurrent Detonate/combat/presentation changes are excluded
from this frozen comparison and preserved in the shared checkout.

## Previous decision: movement repair applied; Durability 13 prepared

User approved the repair. Runtime8cf9cb73 validates hazard pull endpoints against
all nearby terrain, defers failed hazard approaches, checks safe target reach/pull
feasibility, and prevents proximity reacquisition during leash return. No balance
values changed. Six full300s diagnostic cases retained combat through298.2–299.9s;
largest sampled quiet intervals5.7–12.6s. This is local qualification, not a broad
balance result or proof every target is accessible.

[Durability13 operator packet](bot-balance-durability13-operator-packet.md) is ready
for manual Luna, not launched.15 full-window movement observations gate72 Volcano
Sweep/Slam observations across six classes and three seeds. Stop expansion on a
death or30s outgoing-damage gap in the first block; classify rather than retry.
Preserve blocked encounters and compare exposure before interpreting technique
strength. Plains and the broader roster are not repeated. Concurrent combat/HUD
edits are preserved outside the frozen revision. Next remains T2/T3 roster gaps,
item/class/ability work, boss TTK and later T4; economy follows combat balance.

## Previous decision: Durability 12 investigated; repair engagement before balance comparison

[Durability12 review and investigation](bot-balance-durability12-report.md) found
29 Volcano windows with at least30s terminal quiet time. Four frozen diagnostic
cases reproduce exact roster/kill/last-damage signatures. Jungle173's retreat
goal lies inside a second bush, leaving an aggroed Chameleon at ranged standoff;
Volcano03 Spirit6151 selects idle targets deep inside lava; Volcano05 Squire
Slam6151 encounters a100ms leash/reacquisition loop. Swamp173 continues fighting.

Hold mob numbers. Next work is all-hazard/reachable pull-goal validation,
hazard-aware engagement feasibility and bounded target release, and coherent
leash return. Qualify the four reproduced cases plus Jungle3911 and paired
Volcano05 Squire Sweep6151 for full300s windows before rerunning affected technique
pairs. Reporting an unreachable encounter is not certifying that it was solved.
Investigation only: no gameplay patch or new operator packet yet. Preserve
concurrent heat/chill/death/HUD work outside the original frozen evidence.

## Previous decision: Durability 11 reviewed; Durability 12 prepared

Durability11 completed126 observations: retain adopted Bear/Snapper values and
selective Jungle defensive stances. Two deaths are pressure tails to track;
Jungle Conduit remains a slow/censored tail. No blanket HP increase is approved.

[Durability12](bot-balance-durability12-operator-packet.md) is prepared for manual
Luna, not launched: four movement observations then144 paired Sweep/Slam runs
across six classes in T2 Plains and T3 Volcano03/05. Confirm hazard approach fixes
before using the wider swarm screen. Current mob numbers remain fixed.
Swamp's apparent stationary sample was a100ms oscillation; Jungle approach did
not recognize slowing terrain blocked by navigation. Short debugging replays now
reach the named elites; full windows remain pending. Runtime7b37b393 contains the
fix and diagnostic sampling. Concurrent heat/chill/death-label/HUD work is
preserved outside this frozen revision.

Next: remaining T2/T3 roster/role gaps, item and class/ability work (including
Detonate), boss TTK and eventually T4 with wider branch coverage. T4 balance is
still pending and must not inherit flat tier multipliers. x1 economy comes later.

## Previous decision: Durability 10 selections and Durability 11 preparation

Durability10 completed324 observations with valid artifacts. User approved Bear
HP3750/attack148/shield0.08 and T3 SnapperHP2320; applied in9f58ee46. Bear attack
relief removed baseline deaths2->0, though the DoT Slinger alternative remains
weak. Snapper HP2320 produced12–13s centers without an attrition wall. This does
not meet the toughest-body25–35s target or close all durability work.

Confirmed templates: defensive stance for T2 Jungle Squire and T3 Jungle Conduit
only. Offensive remains for other baselines, including Apprentice/Spirit;
Silverback HP2090/ramp45% unchanged. No global stance/ramp change.

[Durability11](bot-balance-durability11-operator-packet.md):42cells/126 observations,
fresh seeds3911/6151/8089, T3 Tundra/Swamp/Jungle03/05 and T2 Jungle Squire03/05;
Tundra retains Slinger/Conduit alternatives. Single selected build per class,
no overlays. New confirmation, not another deterministic replay of selection seeds.
Manual Luna, no full run launched by planner. Frozen qualification receipt in packet.

Separate movement issue: Swamp05 Striker/s173 stalled identically in all three
Durability10 arms, last outgoing damage12s to Hexer, unchanged position/path for
most of300s. No Snapper contact. Cause unproven; preserved artifact path/signature
in packet. Fresh seeds do not fix it. Report any such runs as engagement limits,
never as successful Snapper survivability. Movement fix is separate work.

## Previous decision: Durability 9 retained; Durability 10 continuation prepared

Durability9 roster completed600 observations (10 previous versus3 selected deaths).
Retain the applied patch. The post-block guard stopped before the Bear block;
all persisted identity predicates and the new artifact validator pass. Original
stop cause remains unproven. Do not rerun the completed roster block.

[Durability10](bot-balance-durability10-operator-packet.md) runs missing Bear96 on
original02758290 runtime first, then Swamp108 and Jungle120 on new6d8f97fc runtime.
324 observations total. T3 Snapper HP1160/1740/2320; Jungle current versus defensive
stance versus Silverback ramp cap45%->25% (T3), plus T2 Squire stance-only check.
No new production stat changes. Hold Jungle HP while distinguishing adaptation
from enemy pressure. Added minion snapshots to new trials and named-error artifact
verification. Manual Luna execution, no retry/adaptation or full run by planner.
Qualification receipt is in packet. Typecheck, focused overlay tests and verifier
fixtures passed; no full suite/live playtest. Expected25–50min, not a guarantee.

Conduit minions were still damaging targets in its Jungle death window; missing
minion-kill events do not establish absence of summon losses. The longer fight
may expose Silverback's45% attack ramp; test that separately from stance. T2
Squire's failure was dominated by Chameleon/Snake rather than Ape damage.
For reporting preserve seed medians -> class medians -> six-class center order;
do not substitute mixed-species node medians or transpose seed/class aggregation.

## Previous decision: role patch applied; Durability 9

User approved applying the Night4 recommendations and preparing the next run.
Applied HP: Dire Wolf350->525, Stampede Bull330->495, Jungle Ape600->1200,
Silverback1045->2090, Moss-Shell Snapper340->680, Plague-Shell Snapper580->1160.
Desert: Sun Scarab attack60->48; T3 Dune/Basilisk HP1350->4050 and Gilded Scarab
attack120->96. Cave/Mountain, small swarm bodies, DR/plating and T1/T4 unchanged.
No live Bear change: pressure relief remains experimental before selection.

[Durability9](bot-balance-durability9-operator-packet.md) compares absolute old/new
patch values on the same code across16 nodes, plus a separate two-node Bear
HP3750/shield0.08 attack185-vs148 comparison. Six baselines, relevant Slinger/
Conduit alternatives, three seeds;232cells/696observations total. Manual Luna,
two sequential blocks, no retries or adaptation. Runtime02758290bc40042d0f65618e465ecb5e0b78d09d.
All232 configurations qualified, four30s pilots/report generation passed,
paired builds/geometry/isolation checked. Conduit minion counters now work.
Typecheck and five focused tests passed; full suite/live playtest not run.
Planner has NOT launched the full batch. Estimated45–90min, finish when done.
Interpret by enemy role and pressure, not a universal elite-TTK floor. No new
Sweep/Slam comparison until a later ability pass with suitable measurements.

## Previous decision: Night 4 reviewed; role-based propagation recommended

[Night4 review](bot-balance-night4-review.md) verifies936 completed observations
in approximately63 wall minutes. Retain Cave/Mountain elite HP anchors. T2 Desert
needs pressure relief (Striker6/6 deaths); T3 dealer80% materially improves survival
at fixed controller HP. HP3x/dealer80% is a candidate, not a live selection.
Bear fixed shell avoids the earlier Conduit wall, but more HP starts killing
Apprentice and alternate Slinger before meeting the duration band. Test output
relief before further HP escalation. Sweep/Slam results are class/encounter-specific.

Correct the report's inactivity interpretation: all zero attackBeats runs are
Conduit; the counter reads player cooldown rather than minion attacks. Volcano
contact/episode anomalies still need diagnosis, but zeros do not establish a lava
loop. Body TTK excludes pre-hit Slam charge; secondary-hit telemetry differs by
class. Preserve valid results and improve only the needed measurements.

Next proposed stage: broad role-based HP screen on remaining durable bodies,
separate Desert/Bear pressure arms, targeted measurement cleanup. No new live
patch, frozen experiment implementation or launch authorized/performed this review.

## Previous decision: Night 4 broad overnight batch prepared

Durability8 completed144 observations. Baseline-capacity Bear shield relieved
Conduit's approximately142s scaled-shell outlier to16s. Desert HP3x killed
Striker3/3; HP2x survived with only0.8–3% minimum HP. No live Desert/Bear patch.

[Night4](bot-balance-night4-operator-packet.md) broadens to28 T2/T3 nodes and six
baseline classes, plus targeted Desert pressure/Bear fixed-shell HP brackets
and paired Sweep/Slam swarm tests. Three sequential blocks,312cells/936runs,
three seeds. Runtime115297985869598fe49b215a2c40e19b331b998f. All312 configurations
qualified; six30s tooling pilots and report generation passed. Typecheck and
focused matrix/treatment tests passed; full suite/human playtest not run.
Manual Luna execution only; full batch not launched by planner. No overnight
source/balance edits, adaptation or retries. Report partial and stop on tooling
failure. Use breadth to recommend changes by encounter role, then revisit only
exceptions; do not repeat a long tuning ladder for every species. Elite timing
bands do not apply to swarm bodies. Ability comparison is a separate screen,
not a selected ability rebalance. Approximate2–4 wall hours; finish when complete.

## Previous decision: Titan reduction applied; Durability 8

User approved Titan attack105->84 after Durability7. Applied live authored
definition; HP1656 and Eagle75/dive1.25 unchanged. Both treatments reduced
all-build deaths8->4; Titan favored broader heavy-hit relief, not a definitive
survival winner. Eagle overlap deaths remain a watchlist item.

[Durability8](bot-balance-durability8-operator-packet.md) moves to T3 Desert03
and Tundra03. Six baselines plus Slinger/Conduit alternatives, three seeds,
48cells/144observations. Desert controllers HP1x/2x/3x; dealer unchanged.
Glacier Bear control versus HP1.5x with scaled or baseline-capacity shield;
other Tundra enemies unchanged. No new live biome changes; no weapon swaps/Slam.
Current Sweep fixed. The approved separate Falchion rework is committed in the
frozen source but is not equipped. Source04e80e9ae38183c194f4cacc4b5fa171a3de8873.
All48 configurations qualified, three30s tooling pilots/report generation and
typecheck/focused tests passed. Luna executes manually once; full run not launched.

## Previous decision: Durability 7

Durability6 completed192 observations. Retain the four selected HP values:
baseline centers18.2s/17.2s T2 Cave/Mountain and24.8s/25.75s T3. Selected arm
had5 deaths versus7 controls; not proof that higher HP improves survival.
T2 Mountain remains the pressure question; T3 Cave slow builds38-40s are tracked
for later class/item work. No further durability increase selected.

[Durability7](bot-balance-durability7-operator-packet.md) tests T2 Mountain04:
control, Eagle attack75->60, Titan attack105->84, separately. Eight builds,
five seeds,24cells/120observations. Titan HP1656 and Eagle dive1.25 stay fixed.
Base-attack changes also affect attack-derived specials. Current Sweep stays;
no Slam, other biomes or Desert rework. These are process-local treatments;
live attack definitions remain unchanged until choosing from the results.
Frozen source e538db33bcc8b5df9c828af53daaa2ab8c02325f excludes concurrent dirty
Desert/weapon work. Luna executes manually once; full experiment not launched.
After results choose a local pressure adjustment if supported, then other biomes.

## Previous decision: Durability 6

Durability5 completed160 observations with8 deaths (1 T2 Cave,7 T2 Mountain,
0 T3), credible elite pacing and no Conduit summon floor. User approved typical
toughest-enemy duration15-25s T2 /25-35s T3, allowing favorable matchups below
the bands. Assess the median of SIX baseline class medians; alternatives and
fast/slow tails remain separate. This supersedes older10-20s/20-30s targets.

Applied HP: Cave Troll1320->1584, Granite Titan1380->1656, Cavern Troll3780->4725,
Mountain Colossus4250->4675. Attack/DR/plating unchanged; Eagle75/dive1.25 remains.
[Durability6](bot-balance-durability6-operator-packet.md) compares previous/new
absolute HP on identical current code: eight builds, four nodes, three seeds,
64 cells/192 observations. Current Sweep Tempo in both arms; no Slam equipped.
Both abilities still need separate balance evaluation. Desert weapon changes
are excluded by frozen source/builds. Source7398e25bce92e1c2efac4bc1bda8c715ef542ef7.
All64 configurations qualified; three30s pilots and report generation passed.
Luna runs manually once; no full experiment launched here.
Next retain/adjust locally, especially T2 Mountain pressure, then other biomes.

## Previous decision: Durability 5

[Durability5](bot-balance-durability5-operator-packet.md) freezes the selected
patch at `3a0220aed0c6765e72ecbfae9cdc2de224b38a30`. Four T2/T3 Cave/Mountain
nodes, six baselines plus Slinger DoT/Conduit on-hit: 32 cells, five seeds,
160 observations. No overlays or equipment adaptation. All builds qualified;
three short instrumentation pilots and report generation passed. Luna executes
manually once; no subagents or full experiment launched during preparation.
Read the packet for exact hashes, commands, outputs and report requirements.
Next decision is retain versus locally adjust this combined package, then broaden
to other biomes; this does not finish T2/T3 or authorize further live tuning.

## Previous decision: selected durability patch applied

Durability4 completed all 60 cells / 300 observations. The axe remained faster
than the heavy weapon at every highest-plating target; both killed the T3 elites
across all five seeds. Heavy rescued the stalled on-hit case but did not justify
high ordinary plating. The report's claims that heavy was best/the only repeatable
T3 Mountain option are contradicted by its raw results. Keep Conduit's axe baseline;
no class compensation, penetration or DoT resistance is selected.

User approved the candidate balance package on 2026-09-15. Applied to shared
monster definitions (authored values before node modifiers):

| Monster | HP before -> after | DR before -> after | Attack before -> after |
| --- | --- | --- | --- |
| T2 Cave Troll | 550 -> 1320 | 8% -> 26.4% | 115 -> 86 |
| T3 Cavern Troll | 945 -> 3780 | 10% -> 28% | 124 unchanged |
| T2 Granite Titan | 460 -> 1380 | 0% unchanged | 105 unchanged |
| T3 Mountain Colossus | 850 -> 4250 | 0% unchanged | 130 unchanged |

Plating is unchanged. Cave uses the Durability3 HP/DR arm; Mountain uses the
Durability2/3 HP-high reference, including its max-HP-scaled Granite Barrier.
Stone Eagle Skyfall Rend is 1.75 -> 1.25, with ordinary attack 75 unchanged.
Durability4 opening hits fell about 17-30%; deaths 8/40 -> 7/40 do not establish
that companion attrition is solved. Mechanics, rewards and other monsters remain
unchanged. This is a selected candidate, not completed T2/T3 balance validation.

Next: prepare a combined confirmation using the six medium-frame, normal-range
baselines across T2/T3 Cave and Mountain, retaining Slinger DoT and Conduit on-hit
alternatives for matchup visibility. Measure named-elite TTK, unfinished targets,
survival/minimum HP, companion pressure and mechanic/ward activity. Use current
definitions without old multiplicative durability treatments: replaying the old
arms on this revision would double-apply the buffs and invalidate comparison.
Freeze a new revision before Luna execution; no experiment launched by this patch.
Human playtesting remains needed. Then broaden role-specific tuning to remaining
biomes, followed by boss TTK and later item/class/economy passes. T2 remains open;
provisional toughest-enemy TTK bands remain 10-20s T2 and 20-30s T3.

Patch verification: workspace + bench typecheck, shared build, Cave engage
sequence, Mountain T2 charged defenses, Eagle dive behavior and Durability4
overlay restoration checks passed. The existing Eagle authoring assertion was
updated for 1.25x. Full suite was started then stopped after its opening tests;
no full-suite pass is claimed. No human or integrated balance run was performed.

## Previous decision: Durability 4 prepared

Durability3 completed456 observations. DR preserved reference pacing; high
plating drove Conduit summon hits to1damage in verified raw T3 Mountain traces.
User confirms this weakness is known. Before considering compensation or a new
penetration stat, test the legal Mountain heavy-weapon equipment counter.
Keep ordinary plating below invalidating thresholds; no DoT resistance.

[Durability4](bot-balance-durability4-operator-packet.md) runs Conduit axe/on-hit/
heavy at low/intermediate/high plating in T2/T3 Cave/Mountain, plus separate
T2 Mountain Eagle dive1.75/1.5/1.25 with ordinary attack unchanged. Five seeds,
60cells/300observations. Qualified, not executed. Source
ac4595442d93e81f5e3eebc72e5ce4538ff6c94f; Luna manual operation, no subagents.
No live patches or compensation. Larger defense profiles and boss/swarm/economy
passes remain subsequent work after these concrete equipment/pressure decisions.

## Previous decision: Durability 3

[Durability3](bot-balance-durability3-operator-packet.md) exchanges20% of the
experimental elite HP for plating or DR, with both HP-only references retained.
Separate T2 Mountain Eagle/Thrower/both attack reductions test companion pressure.
152cells/456observations, manual Luna execution, source
5d64868501ebb3f3c877e1980ffbe0e0e269ec28. Qualification and short pilots passed.
No live balance, root/slam, ability or DoT-resistance changes.

User accepts Apprentice armor advantage; repeated roughly4x TTK advantage is
a review trigger, not an automatic nerf. Source confirms ordinary class DoT
bypasses monster plating/DR while weapon reservoirs are funded post-mitigation.
Troll rush fantasy can remain; shorter root/more post-root escape time is a
future option. T2 remains unfinished; T2/T3 toughest targets10–20s/20–30s.
Boss TTK and future Slam/Sweep swarm comparisons remain subsequent scopes.

Durability2 report's named table was corrected from raw IDs: all32 baseline/alt
node/build combinations now present, spurious T3 Spirit death removed. Raw
results unchanged. T3 high actual baseline ranges Cave16.05–29.70s,
Mountain19.40–28.40s. Companion preceding-damage audit supports testing Eagles
separately from Throwers; a final hit alone was not adequate attribution.

## Previous decision: Durability 2 executed

Durability1 finished all576 observations in44m41s with13 deaths; manifest/index
hashes verified. T3 Cave/Mountain +50% HP remained roughly4–11s for the target
bruisers, below the desired elite band. Tundra Glacier Bear's recurring shell
scales with maxHP and high-treatment Conduit fights exceeded140s; this requires
its own defensive-mechanic audit, not blanket HP scaling. Jungle/Volcano/Swamp
movement inactivity and Desert controller/dealer interaction remain separate.

User clarified: T2 is unfinished and needs adjustment, not a balanced benchmark.
Provisional toughest ordinary-enemy targets: T2 10–20s, T3 20–30s, with lower
monster output considered to manage attrition. Boss TTK is a later explicit
pass. Targets refer to first-damage-to-kill under the six prepared baselines;
they are not a required duration for swarm bodies or every build.

[Durability2](bot-balance-durability2-operator-packet.md) executed once at
source9fc34ff94b0d6a82490bcc32c8036f25105ccc84: all160cells/480observations,
with no runner failure or retry. It covered Cave Troll and Granite Titan T2,
Cavern Troll and Mountain Colossus T3, using T2 HP x2/x3 and T3 x3/x5 at
current attack and x0.75 attack, plus controls. Only named elites changed;
companions and builds stayed fixed. HP-high is the broadest candidate for the
provisional duration bands; x0.75 attack is a pressure candidate, not a live
edit. The [Durability2 report](bot-balance-durability2-report.md) records
named-elite TTK, pressure/survival, Granite Barrier, death attribution and
outgoing-damage-gap evidence. Luna operates manually.

Do not wait for the proposed Ground Slam or T2+ attack-driven Sweep cooldown
reduction: their implementation and a scoped old/new swarm comparison come later.
Current class/swarm evidence remains conditional on current abilities. The next
comparison, if approved, is selected plating/DR/DoT-resistance profiles against
the T2/T3 HP-high references, retaining the x0.75 attack arms when pressure
attribution matters; present concrete tradeoffs for a user decision.
No live balance changes or ability implementation authorized by this packet.

## Previous decision: Durability 1 executed

The frozen [Durability 1 packet](bot-balance-durability1-operator-packet.md)
executed once at source
`bc559b0228ed4a2d08b1f0f721d99ed873d6056a`: all seven T3 combat biomes, six
baseline classes plus Conduit/Slinger weapon alternatives, control/low/high HP,
and unchanged T1/T2 Cave/Mountain references. All 192 cells and 576
observations completed with no runner failure or retry. Jungle/Volcano
increases were 10/20%; other biomes 25/50%, Desert controllers only. HP
overlays were process-local; no live balance data changed. The
[Durability 1 report](bot-balance-durability1-report.md) records the generated
HP/TTK, pressure, weapon, engagement and inactivity evidence.

Review the HP candidates by enemy role before the defense stage. Cave,
Mountain and much of the controller response is clean, but Tundra high had
three deaths and long Glacier Bear outliers; Desert and Volcano had sparse
non-clear swarms; and Jungle/Volcano had inactivity signals. Sandweaver stayed
unchanged. No live balance edit or defense treatment was selected. Luna
executed the packet manually; no agent was spawned.

Defense profiles follow review and source verification of plating/DR/DoT
mitigation. The slam remains deferred. Volcano inactivity is unclassified:
new samples capture actual static damage contact and movement paths, complementing
hazard-escape logs. Do not treat full-health idle time as survival evidence.
Longer-lived Desert controllers and swarms may require later damage tuning.

## Previous decision after TTK survey execution

The frozen T1–T3 TTK survey completed once on 2026-09-15: all 66 cells and
198 predeclared seed observations completed with no runner failure or retry.
The survey is synthetic in-process combat evidence only; it does not certify
earned progression, normal economy, network/client fidelity, or average-player
readiness.

Cave and Mountain baseline individual TTK falls from T1 to T3 for all six
classes when comparing endpoints, but Squire and Slinger rise from T2 to T3 in
both nodes. T3 Volcano changes biome/ecology as well as tier: most individual
TTKs remain short while full swarm clears become sparse or censored. Baseline
Slinger cleared only2/5 observed Volcano swarm episodes; baseline and alternate
Conduit cleared0/3 each.

The Slinger DoT alternatives emitted the expected `weapon-dot` events and were
slower/more censored than the on-hit-rapier baselines in every paired T2/T3
role. Conduit alternatives were mixed: faster in all T2 roles, near-neutral in
T3 Cave/Mountain, and slower in the T3 Volcano swarm. These are descriptive
screen results, not global weapon rankings or a target-duration decision.

The [TTK survey report](bot-balance-ttk-survey-report.md) records generated
analysis first, all baseline/alternate seed medians with censor/death markers,
enemy HP/TTK, observed engagement mix, recovery/pressure, raw outlier links,
roster-hash verification and artifact hashes. Source revision was
`60817047ffec3065cfd9807dd09868aa08f9b2b4`, source tree
`297553dc950d20b791c79cca9161a306bc29e471`, with no source or balance change.
The prior [Volcano finishing result](bot-balance-volcano-finish-report.md)
remains the current T4 preparation reference; Swamp T3 and Volcano farming
inactivity remain separate open questions.

No target TTK, monster edit, ground-slam/AoE design, or follow-on experiment is
selected automatically. Continue discussion using the survey as a descriptive
qualification input, then retain the broad order mobs -> items -> classes ->
canonical 1x economy.

## Previous decision after Volcano finishing comparison

The frozen four-cell Volcano finishing comparison executed once on 2026-09-15
with no retries, adaptation, source changes or balance edits. Both Empty-relic
cells cleared the nine guardians but stopped at first death before a named
Caldera Sovereign victory. Both Colossus Heart cells cleared the guardians,
killed the Caldera Sovereign, reached Volcano 4 and returned. Expose Weakness
was not required for the Colossus wins, and Expose alone did not rescue either
Empty-relic run.

This closes the sampled Volcano viability gap for the prepared Colossus
reference, not universal relic balance, causal attribution or canonical
economy. Use Colossus preparation when Volcano enters the next scoped
measurement; retain Empty as a robustness exception. The prior validation-exit
productive-inactivity window remains unresolved, farming inactivity remains a
separate qualification question, and Swamp T3 remains open.

The [Volcano finishing report](bot-balance-volcano-finish-report.md) records the
four outcomes, final-phase samples, death/source boundary, occupancy check,
taints and hashes. The [Volcano finishing operator packet](bot-balance-volcano-finish-operator-packet.md)
was executed at source revision `67a7722559c4e7b4063032bda179ed1e8796aa4d`,
source tree `67798156542c8ddf0a795a03138d126907398f3a`, with input checkpoint
SHA256 `866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98`.
Experiment `20260915t074612z-t4-volcano-finish-reference-em` was reported and
released with scoped resources cleaned up.

The raw-log correction from the prior stage still stands: the earlier Volcano
control spent roughly 9.5 minutes idle with full sampled HP, zero attackers,
and monsters present after lava escape. Root cause is not established; do not
call the 221-versus-91 kill count a relic advantage or productive farming
proof. The Graveyard Colossus 9.9% minimum-HP result remains a robustness
warning, while the earlier Mountain Empty and Colossus runs were both viable.

[Validation exit plan](bot-balance-validation-exit-plan.md) remains the ordering
authority: targeted exception review, then mobs -> items -> classes -> canonical
1x economy. No further routine Volcano or Mountain replica is required for this
question. No balance changes or subagents were used.

## Previous decision after V1z - Night3 prepared

V1z passed36/36 in13m40s. Jungle/Desert observation kills43/61; Jungle sampled
HP1.0, Desert minimum0.802. Both safely returned; +2 defenses purchased at GM132.
These establish two more farming candidates alongside Mountain, not all-T4 balance.

User requests a fixed overnight batch operated entirely by Luna, no subagents,
and explicitly confirms Colossus Heart for Voidwalker. [Night3](bot-balance-night3-operator-packet.md)
is prepared, not launched:12 independent cases from the same V1z +2 return.
Mountain boss two replicas per arm, plus15-minute Tundra/Trench/Graveyard/Volcano
farming once per arm. Compare empty relic against ordinary Colossus Heart.
Qualified maxEnergy200->280, base gain20->14, full discharge6x->8x. Keep Cinderlash,
Accelerant, ranged Wisp and fixed+2 defenses; no adaptive upgrades as mastery grows.

One worker,30-minute per-case caps,6h total case budgets,8h overall ceiling.
Gameplay death/timeout ends only that case; infrastructure/invalid treatment
stops the batch when detected. Luna reports/releases; no new experiments, balance
changes or Astra supervision. User launches Luna. Actual-input, paid relic,
all12 build/path checks and relic integration tests pass; no live Night3 yet.

Swamp T3 remains open. After the batch, review first T4 boss viability and broader
farming results before selecting earned captures and next bosses. Broad balance
mobs -> items -> classes and canonical1x economy remain downstream. Missing TTK/
discharge telemetry limits mechanics conclusions; preserve honest phase attribution.

## Previous decision after V1y

V1y passed51/51 in10m04s: Voidwalker, T4 entry, Mountain24/GM124, +1 armor/charm,
five-minute farming and recovered return. Mountain74 kills across the run, zero
recorded Mountain damage; observation mostly single attackers. Missing per-target
TTK/discharge telemetry prevents mechanic-exposure conclusions. Setup HP minima
are not combat minima. Final checkpoint SHA f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83.

[V1z](bot-balance-v1z-operator-packet.md) prepared, not launched: one sequential
Jungle then Desert farming continuation, mastery18 and five-minute observation
for each, safe returns and final +2 defense purchases. Actual current caps are18
for both groups; GM124->130->132. +2 unlocks only after the second leg. Keep
Cinderlash/Accelerant/Wisp; Jungle adds Sweep and Desert retains control guards.
Both screens use+1 gear; final+2 is preparation, not tested combat evidence.
Actual-input/path/build/cap/purchase preflight and focused checks passed.

Next after successful breadth: assess first T4 boss readiness alongside remaining
Tundra/Volcano/Graveyard/Trench farming, without requiring every mastery cap before
a boss. Swamp T3 remains open; six T3 boss diagnostic wins stand. No balance edits.
User launches Luna. Preserve resource release and separate worker/WSL measurements.

## Previous decision after V1x

V1x completed both sequential boss wins, safe returns and the actual four-seal
T4 unlock with one unspent point. 14m08s bot runtime, zero HP loss. The checkpoint
restores as GM120/Mountain22/Desert14, correcting the report's blanket GM114
summary (114 was initial). No earlier checkpoint or invented progression needed.

[V1y](bot-balance-v1y-operator-packet.md) is prepared, not launched. One normal
Voidwalker unlock preserves ranged Wisp; affordable Mountain T4 armor/charm base
purchases before explicit entry via Desert avoiding Trench/Volcano/Tundra/Graveyard.
Farm adjacent heavy Mountain05 to24, return and buy+1 at GM122, then five minutes
of sustained observation and recovered return. Keep Cinderlash+5/Accelerant/
Desert Boots+5 and the qualified Frenzy/Hamstring farming build. Zero boss attempts.
The initial wallet covers all665 blue/135 red; no new currency is assumed.

Actual-input unlock/purchase/path qualification, TypeScript, observation/transit
and map tests pass. Future Mountain24 is modeled only for setup arithmetic and
must be earned live; no live V1y yet. User launches Luna, no automatic next run.

T3 six-of-seven diagnostic coverage stands, Swamp remains open for human playtest;
Desert robustness remains a flag. Next after qualified T4 entry: wider T4 farming,
mastery and equipment gates, then bosses. No balance changes. Long-term order is
mobs -> items -> classes -> canonical1x economy after validation.

V1x cleanup succeeded; worker max198.5MiB and WSL1726.1->3354.5MiB are different
scopes. Keep before/after measurements and terminal resource release. No leak
conclusion or RAM-setting change.

## Previous decision after V1w

Six of seven T3 bosses have candidate-build diagnostic wins: Volcano/Tundra2/2,
Mountain/Cave/Desert/Jungle1/1. Swamp cleared six guardians then died to late
pool/DoT pressure; not yet validated. Desert's sampled HP minimum16.4% is a
robustness flag. These restored smoke results are not canonical combat/economy
certification or all-class balance evidence.

Correction: V1w incorrectly expected T4 after THREE T3 seals. Shared progression
requires FOUR. All four winners correctly stayed T3 and then hit the authored
bad assertion before return. No returned handoff exists; independent seals must
not be combined. The prior V1w packet is retained with a correction notice.

[V1x](bot-balance-v1x-operator-packet.md) is prepared, not launched. One character
from the exact two-seal V1v Tundra return earns Mountain then Cave with the clean
V1w winning build. Capture the three-seal recovered return, then actual four-seal
T4 unlock at T3 Sanctuary, leaving the skill point unspent. No purchases or
balance changes. Qualification now tests this precise progression sequence and
T4 safe capture, in addition to input, builds and bidirectional paths.

User has not tried T3 Swamp yet and permits moving forward pending later human
playtest. Keep it open; do not require it for the four-seal T4 handoff or claim
complete T3 coverage. Future counterplay hypotheses include DoT resistance and
late-pool escape/re-entry; none is a tested fix yet.

Next: normal Voidwalker unlock (energy-heavy-t3-a), ranged Wisp/attack-speed
strategy, T4 travel/farming/gear qualification, then boss screens. Preserve the
mobs -> items -> classes -> canonical1x economy sequence after validation.

Docker was restarted by the user after observing about12GB. Post-restart normal
containers total59-65MiB; Windows vmmemWSL snapshot about1764MiB. V1w cgroup
samples153-171MiB per worker cannot explain total prior Docker/WSL memory. V1x
records both scopes before/after, verifies terminal release and preserves normal
services. No leak conclusion or resource-setting change. User launches Luna.

## Previous decision after V1u2

Volcano package viability is accepted: two verified guardian clears, boss kills,
authoritative volcanic:3 clears and recovered returns, with boss combat26.530/
26.517 seconds. Preparation and audited V1u2 paths completed with zero deaths.
This closes Volcano for the current Heavy Spirit/Wisp validation build, not all
classes or balance. No further Volcano nerf is needed for this beatability gate.

[V1v](bot-balance-v1v-operator-packet.md) is prepared, not launched: two fresh1x
Tundra dungeon attempts from first chronological Volcano returned checkpoint,
retaining GM114/+5 tempo-barrier equipment. Buy Break Free for190 blue; replace
Sweep with Cleanse/Break Free in boss build37/38RP. Travel38/38RP follows audited
waypoints avoiding ordinary Tundra and Volcano, with explicit reverse return.
Actual-input/purchase/path preflight, TypeScript and Chill/control tests pass.
No gameplay balance changes; user launches Luna. No live V1v or full suite run.

Next after Tundra: remaining T3 bosses, then T4; encounter-specific builds and
clear/progression/return evidence remain mandatory. Broad mobs -> items -> classes
balance and eventual canonical1x economy follow validation, not this isolated run.

## Previous decision after V1u

V1u's first death occurred during travel to Jungle, before any kit purchases or
boss attempt. Authored `pick:first` selected distant Jungle-01 through Tundra,
although Jungle-05 is adjacent to Sanctuary. This was an avoidable route-authoring
error; path and reverse-path qualification were missing from V1u preflight.

[V1u2](bot-balance-v1u2-operator-packet.md) is prepared, not launched. Restore
V1u's verified safe GM96 Mountain checkpoint (also Swamp/Cave18), use adjacent
Jungle and explicit Desert waypoints avoiding Tundra; buy +3 kit after Jungle,
+4 after Desert, then enter Tundra intentionally for its mastery and finish +5.
The actual retained wallet covers purchases. Two 1x boss replicas remain gated
on completed preparation. No repeat of already earned mastery or balance change.
Astra qualifies both directions of all new preparation paths, legal travel/builds
and ordinary purchases; user launches Luna. Live path/farming survival remains open.

## Previous decision after V1t

[V1t](bot-balance-v1t-report.md) cleared all 12 Volcano guardians and reached the
boss in 2/2 runs, then died in the boss phase in both. Remaining boss HP and the
identity of the second run's 550-damage terminal attack are unconfirmed. V1s's
3/3 sustained farming and recovered returns remain valid. No new nerf is justified
from this entry-kit result alone.

The user reports a successful **fully upgraded T3** Heavy Spirit build: fast
Volcano weapon, Mountain armor/charm, Accelerant, aggressive stance, Frenzy and
defensive abilities. V1t used T2 +5 gear at GM78, Tempered/Defensive and farming
abilities. This preparation gap is the next actionable issue.

[V1u](bot-balance-v1u-operator-packet.md) is prepared, not launched: one bounded
25x preparation run earns GM114 and the main T3 items +5, with safe checkpoints;
then two independent 1x Volcano boss attempts reuse that earned state. Retain Wisp
and Desert Boots T2 +5; use Cinderlash, Summit Aegis, Bastion Heart, Accelerant,
Offensive stance, Frenzy/Sweep/Hamstring/Second Wind/Brace (37/38 RP). Preparation
failures stop before boss testing. Astra does not dispatch Luna; user launches it.

This tests package viability, not a controlled attribution to one item. Broader
balance, Heat/cooling, T3/T4 low TTK, other class/boss coverage and canonical 1x
economy remain open. No gameplay balance changed. Actual-input setup qualification
and targeted TypeScript pass; the broader static bot harness stops on older V1r
checkpoint assumptions and is not green. Full suite/live V1u have not run.

## Historical status notes through V1p/V1q

The following older status text is retained as history; the current decision above supersedes it.
Current: [V1p](bot-balance-v1p-report.md) closed: all four Volcano kits died
before a kill; Tundra completed its farming window but died returning, so safe
transit remains open. User approved fodder correction: T3 Scuttler650HP/45attack,
T4 Skink720HP/75attack. Heat/leaders/pack composition/rewards unchanged. T4 is
provisional, not combat-validated. [V1q](bot-balance-v1q-operator-packet.md), source
`e9577ec4`, is prepared to repeat the four Volcano diagnostics and compare with
retained V1p. Checks pass; no experiment launched. The V1o/V1p planning text below
is historical. Next after a clear: natural packs and chain-pulling, then assess
cooling separately. No further tuning or downstream execution preauthorized.
Latest: [V1o](bot-balance-v1o-report.md) completed: Tundra control died, all three
counterplay arms cleared; Volcano single mobs cleared and both three-body packs
died. All11 execution hashes verified at review. Single-seed diagnostic evidence,
not natural farming validation. [V1p](bot-balance-v1p-operator-packet.md) prepared:
four Volcano swarm-kit comparisons with unchanged Heat and30-second post-clear
tails, followed by natural Tundra farming with Hamstring/Desert Boots. Setup,
ordinary purchase checks and bot preflight pass; no V1p combat launched.
Heat tuning is deferred until first-pack viability and between-pack recovery are
measured. No gameplay balance changes authorized. Earlier prepared text below
is historical. Validation baseline preference: melee branches for melee classes,
medium range for ranged classes; retain Wisp separately for failure reconstruction.
Status: V1m succeeded with zero deaths and a recovered T3 Sanctuary checkpoint. Spirit has candidate wins on all seven T2 bosses and has earned three seals continuously four times. The earned Wisp checkpoint now passes strict import and authoritative spawn qualification. V1n is prepared, not launched: independent Volcano/Tundra farming screens. Squire Plains: Mountain armor2/2, Plains1/2, all victories with safe tails. No gameplay balance changes in this preparation. [V1m assessment](bot-balance-v1m-assessment.md).
V1j's original capacity stop is historical; both rerun manifests completed and released their networks automatically. [Lifecycle](bot-experiment-resource-lifecycle.md).
Audited gameplay revision: `353d5eceeea31bd14de9eb38dbeb70dca85abc95`.
This is an audit anchor, not a frozen execution manifest. Recheck source before execution.

Reusable strategy reasoning: [theorycrafting reference](bot-balance-theorycrafting-reference.md), reviewed September 13 against `99391c5` with a concurrent control-change caveat. It corrects the human Plains loadout timeline and records encounter-specific gear, ability and RP hypotheses for selection after V1i; it does not amend the frozen packet.

## Objective and authority

Establish expert-prepared solo viability. Cover every boss and establish a viable
progression path for each class. Difficult class/boss matchups are acceptable;
every class need not defeat every boss. Preparation uses tools legitimately
available at the declared progression boundary, with encounter-specific swaps.
Best justified candidate does not mean proven global optimum.

Astra selects questions, treatments, checkpoints, replication and stopping rules,
interprets reports, and proposes design changes. Astra implements templates, profiles, routes and assertions. Luna operates
approved work, preserves artifacts and reports facts. Gameplay balance changes
require explicit user approval. On September 13 the user approved removing T1
Cave corrosion from ordinary hits and retaining two or three stacks on Breach;
the follow-up human playtest requested two stacks, now implemented. Other balance changes still require approval.
Technical defects and design changes must be reported separately.

User-supplied Class Route & Build Baselines and Runic Point Allocation Reference
are advisory strategy material. Their proposed matrices and imperatives are not
execution instructions. Current source and explicit user direction take precedence.

## Sequential plan

### Active operating mode: user-launched Luna, Astra preparation and review

September14 user direction supersedes autonomous dispatch: Astra prepares the
next experiment, the user launches a Luna operator and returns the report.
Do not spawn/continue an operator or schedule execution unless requested anew.
Prefer bounded packets and concise analysis to conserve tokens. Ask the user
for strategy advice or a short manual playtest when behavior remains unclear
or progress is blocked; avoid repeated runs on the same unresolved mechanism.

Current next packet: [V1w](bot-balance-v1w-operator-packet.md): five remaining T3
boss screens, one worker, no adaptive retries or balance changes; Voidwalker T4
preparation is the recorded next direction after review.

Historical V1p plan: [V1p](bot-balance-v1p-operator-packet.md), source `7340037d`.
User-launched Luna runs four local Volcano diagnostics, then one isolated natural
Tundra route if the infrastructure/setup gates pass. No automatic downstream work.
Ask about unclear mechanics/intent; do not treat anti-kiting contact as proof
of broken movement. Future ranged validation defaults to medium range; this
diagnostic preserves earned Wisp to isolate the historical failure.

Historical V1n preparation: [V1n](bot-balance-v1n-operator-packet.md), source `1cb668fd`.
Reuse V1m's unchanged safe checkpoint independently for Volcano and Tundra;
five-minute farming windows, recovered return, first-death stops, 15-minute
run caps and 90-minute packet ceiling. User launches Luna. Bot preflight,
typecheck and actual snapshot spawn qualification pass; optional full-suite
sweep was stopped before completion. No manifest created. This begins targeted
T3 exploration while broader T2 class coverage remains open. Earlier importer
limitations described below are historical: earned branch and transit mastery
now survive explicit `earned-t3` import. Runtime live validation still applies.

[V1l packet](bot-balance-v1l-operator-packet.md) has finished: [report](bot-balance-v1l-report.md). Three T2 seals and
T3 earned; Ash Salamander ranged93 caused the transit death with one attacker.
Avoid Enemies was verified equipped and is starter-owned (1RP); its current
behavior chooses a safer exit target, not a guaranteed enemy-free path.
No lava contact/escape or DoT was recorded.

[V1m packet](bot-balance-v1m-operator-packet.md) is prepared on `38116567`:
one original-input Spirit bridge with ordinary Wisp unlock after the third seal,
before the unchanged 28RP travel package. Wisp tests increased reach/movement
plus its small stat bonuses as a package. First-death stop, 45-minute run cap,
90-minute whole packet; no manifest or operator dispatched. Bot preflight and
typechecking pass. A successful branched snapshot must be preserved unchanged;
strict T3 import currently requires an unbranched state and needs separate
qualification before downstream probes. Do not sacrifice earned preparation
merely to fit the old importer. T3/T4 low mob eHP remains flagged; Volcano and
Tundra damage remain high-risk exploration targets, not settled balance verdicts.

The packet used one unchanged Night2-C Spirit bridge on static-hazard fix6e1f1ee1, keeping
Avoid Hazards and Recover First. The user reproduced the original lava bug
and had another agent fix it; no post-fix human confirmation yet. Focused
hazard tests pass and the old diagnostic now initiates escape with Recover
First enabled. Success still requires an actual safe T3 checkpoint. No T3
downstream probe or build/gear change in this packet.

User strategy note: Cave slow can be cleansed to enable leaving the AoE;
carry this into later Cave movement/timing hypotheses. Squire Plains thorns/
Bramble Guard remains a separate candidate, not part of the lava-fix test.

### Historical operating mode: completed autonomous Astra–Luna overnight loop

Activated by the user's explicit start instruction on 2026-09-13 at21:04:42 UTC. The [overnight plan](bot-balance-autonomous-night-plan.md) has an eight-hour,20-case,four-packet ceiling and conditional experiment sequence. Deadline2026-09-14 05:04:42 UTC. Follow the active ledger for packet state; this authorization does not include gameplay balance edits.

Once activated, the purpose is to remove the user's messenger role while keeping expensive Astra work focused on decisions:

1. **Astra plans and prepares:** inspect current source and completed evidence; choose a useful bounded question; implement/test bot templates, routes and necessary harness work; freeze a concrete operator packet with inputs, revision, run limits, evidence requirements and stopping rules.
2. **Luna operates:** delegate the packet to a Luna subagent with minimal essential context and explicit document paths. Luna runs the frozen cases, supervises execution, preserves artifacts, verifies terminal resource release and returns a concise report. Luna does not redesign builds, tune gameplay, improvise retries or expand the experiment.
3. **Astra waits:** use completion-driven agent waiting while Luna operates. Renew bounded waits only as required by the available tools; a wait timeout is not a reason for a fresh gameplay analysis or repeated log inspection. Avoid routine five-/ten-minute supervisory polling by Astra. Waits/messages still have some overhead; exact limits depend on the current runtime. Give Luna responsibility for packet deadlines and runtime health.
4. **Astra reviews and iterates:** verify the returned evidence, update this campaign state and the reusable theorycrafting reference, select the next experiment and repeat within the activated session's scope and deadline. The user should not need to relay completion messages between agents. Keep each packet bounded; autonomy does not permit extra attempts inside a frozen packet.

The overnight work continues **validation, analysis and experimentation** toward expert-prepared solo viability and credible progression. Improve general understanding of class delivery, gear/ability/rune/stance synergies and encounter counters; do not just copy the last successful build. Continue the existing tier roadmap, including a credible continuous T2-to-T3 path before limited T3 exploration; preserve the T3/T4 low-eHP balance caveat.

**Balance proposals are allowed; balance changes are not.** Astra may record what it would rebalance, the evidence, proposed direction/values, expected tradeoffs, confidence and the test that would validate the proposal. Do not implement those changes, even in a new experimental image, without separate user approval. Distinguish weak bot preparation, behavior defects, instrumentation gaps and actual balance pressure. Scoped bot/harness fixes remain within preparation authority; a proposed gameplay-mechanics change needing user judgment must be surfaced rather than disguised as a bot fix.

At activation, record a finite session deadline and scope in the first packet. No token budget or exact overnight duration has been specified yet. Retain one active operator/manifest unless separately authorized. Use normal terminal network release and preserve artifacts/volumes; do not revive or alter old runs to create new evidence.

Latest T3 steering: the user identifies **Volcano and Tundra as highest risk for excessive mob damage**, possibly badly unbalanced. Treat this as an explicit investigation priority, not a confirmed result. Establish another source-audited T3 reference before separate bounded probes; avoid uncontrolled death loops. Keep incoming-damage risk distinct from the existing T3/T4 low enemy-eHP concern. No balance changes without approval.

If progress is blocked, evidence is insufficient for a responsible next step, the session deadline is reached, or a decision requires the user, stop safely and leave a concise handoff. The user explicitly accepts waiting until they return, including an overnight stall; there is no requirement to keep producing runs or spend tokens repeatedly checking an unresolved blocker. Preserve the current facts, failed/unstarted slots, candidate balance proposals and the exact input needed to continue. Do not automatically schedule reminders or restart after a stop.

End-of-session handoff: completed experiments and artifact/report links; conclusions versus hypotheses; template/harness changes and validation; proposed balance changes (unapplied); remaining blockers; recommended next experiment.

| Stage | Question / work | Exit evidence |
|---|---|---|
| Q0, prepared | Qualify existing templates and their first build transitions; prepare exact local readiness routes | Six source-derived profile records, legal acquisition/build sequences, concrete runtime packet |
| Q1, complete | Can each selected profile acquire and reconcile its build? | Six configuration successes; combat under the post-prep builds was untested |
| Q2, initial slice complete | Do the two configured builds actually fight and activate abilities? | Six profiles, twelve completed T2 Plains windows on `755b2a36`; broader conditions/routes remain untested |
| V1, in progress | Can prepared builds farm and solve bosses? | Four of five T1 bosses have historical Striker candidate wins; human Cave success recorded. Current Cave/Mountain checks and targeted T2 progression are prepared in V1h |
| V2 | What resolves a particular failing matchup? | Small local alternatives selected from failure diagnosis, initially 2–3 replicates |
| E1 | Is shipped progression pacing appropriate? | One-tier 1× economy studies using current credible carryover, after functional routes/builds |
| A1 | Does the assembled progression work? | Late broader acceptance runs only |

Q0 is specified in [the qualification packet](bot-balance-q0-template-qualification.md).
Q1 is specified in [the operator packet](bot-balance-q1-operator-packet.md); no large matrix or automatic downstream queue.
T3/T4 remain outside V1g. Update from the user on September 13: formerly nonfunctional boss mechanics are repaired; do not keep that as an active known defect. Low TTK / insufficient ordinary-mob eHP remains an open T3/T4 balance issue for a later pass. V1f used integrated mechanic source `3426063e`; V1g retains that gameplay.

## Template shortlist and current RP audit

Calculated directly from `TIER_ENTRY_PROFILES` with shared `runicPointBreakdown`
and `runeBudgetForGlobalMastery` on 2026-09-12. This is cost arithmetic, not a
runtime validation or acquisition proof. Each row uses its `-clean` profile;
the other wallet modes are not additional combat treatments.

All six have GM30 / 22 RP, Expose Weakness + Second Wind (13 RP), no attuned
stance or Rite. Armor/recovery/mobility are `mountain-vest-t1`,
`swamp-charm-t1`, `plains-boots-t1`; Core and relic are null.

| Seed profile ID | Frame | Weapon | Logic / total RP | First issue to qualify |
|---|---|---|---|---|
| striker-t1-t2-entry-clean | cadence-balanced | chaotic-axe | 7 / 20 | Frequency-compatible abilities; stance transition |
| squire-t1-t2-entry-clean | cooldown-heavy | chaotic-axe | 7 / 20 | Recovery/telegraph response; later heavy-weapon alternative |
| slinger-t1-t2-entry-clean | reload-heavy | ashbrand-blade | 9 / 22 | Ranged spacing and first additional reservation |
| spirit-t1-t2-entry-clean | energy-heavy | chaotic-axe | 9 / 22 | Ranged spacing/barrier and first additional reservation |
| apprentice-t1-t2-entry-clean | dot-balanced | chaotic-axe | 9 / 22 | DoT targeting opportunity cost and first additional reservation |
| conduit-t1-t2-entry-clean | summoner-balanced | chaotic-axe | 9 / 22 | Formation/reconstruction and first additional reservation |

Common ordered logic: Always → Find Enemies; Inside Telegraph → Step Back;
In Combat → Chase Enemy (first two) or Keep Distance (`orbit`, remaining four);
Always → Avoid Hazards; Always → Recover First.

These are compatibility seeds, not optimized recommendations. Keep their source
controls intact; author new named profiles for deliberate improvements. Examine
both an economical farm repertoire and a prepared boss repertoire per class,
but only run alternatives that address an observed question. Conduit frame,
Apprentice frame/weapon and Slinger weapon alternatives remain targeted branches.

## Entry-state policy

- Synthetic T2 profiles: reusable for explicitly labeled combat/integration work;
  even `natural` is a modeled wallet, not measured natural carryover.
- Snapshot B: authentic historical T1 handoff; requalify current legality and
  representativeness independently. Snapshot A is not interchangeable.
- J0/J3/D0: local T2 checkpoint support exists. Seal exact files and checkpoint
  kinds; avoid a broad directory that also contains nested source inputs.
- No qualified T3/T4 entry catalogue established by this audit.
- Reconstructed runtime state (HP, cooldowns, summons, stance ownership) requires
  explicit readiness; a persistent snapshot is not an exact combat replay.
- Earlier-tier items are allowed; future-tier power and circular acquisition
  (requiring the target boss's first-clear to prepare for that first-clear) are not.

## Validity and evidence rules

Assert source/build identity, isolation, checkpoint kind, tier, root/frame/range,
equipment IDs and upgrades, Core eligibility, known tools, exact ordered build,
RP capacity/cost, policy, reward mode and reached treatment before measurement.
Recheck after evolution, death, swaps and resync. An accepted partial build is
invalid, not a weak build. Active stance may change legitimately via Rune rules.

Configuration evidence and behavior evidence are separate. For conditional
firing, record an eligible opportunity, expected activation/suppression and
observed result. No opportunity means untested, not failed. Exclude cooldown,
targeting, cast arbitration and interruption explanations before diagnosing a bug.

Classify outcomes: invalid treatment; bot configuration; route deficiency;
harness/orchestration; engine defect; economy/progression; build weakness;
encounter difficulty; or unresolved. Preserve timeouts and partial observations.
No automatic retries, pooling replacements or automatic winners. Fixed RNG replay
is not available; paired launch order does not imply matched random encounters.

## Time and sample policy

Default runtime readiness ceiling: 5 minutes per case, setup reported separately.
Default local viability ceiling: 15 minutes per run, with an initial maximum of
3 boss attempts. Packet-specific changes must be justified before execution.
Begin with one readiness case per distinct behavior, then 2–3 real replicates.
Stop early when sufficient evidence answers the question; one valid kill proves
possibility, repeat kills support reliability, neither proves universal balance.

Define progress for each objective (kills/XP for farming, phase/HP advancement for
bosses, prerequisite convergence for prep). Account for legitimate recovery and
scripted invulnerability. Never use a universal idle timeout as a balance verdict.
Record preparation, transit, recovery, attempts and elapsed-time cap separately.
Do not extend a live run merely because it has already consumed time.

## Historical evidence and invalidation ledger

| Evidence / change | Current interpretation |
|---|---|
| Final T1 cohort, 2026-09-05: 24 full, 5 Slinger partial, 1 Spirit infrastructure failure | Route/provenance assets survive; mastery/+5 success did not prove boss success |
| T2 day closeout: invalid prep, wrong treatment boundaries and stranded manifests | Readiness/assertion-order lessons; non-runs are not gameplay evidence |
| T2 focused closeout, 2026-09-10 | Cross-cohort queue was repaired; do not repeat the obsolete missing-queue diagnosis |
| Jungle thicket / Recover First softlock | Engine confound fixed in source; old frame/weapon stall rankings are not clean balance evidence |
| Unified RP | Reprice all legacy packages; custom rules suppress the named ability default |
| XP redesign: T1–T4 segment budgets 1750/5000/7000/9000 | Old pacing and accumulated wallets are not current pacing evidence |
| September 12 stance gates / attack-speed changes | Requalify affected combat comparisons |
| Splinter/Kilnmaster secondary efficiency | Advisory future idea is already live at 1.2/1.3; weighted formation model still applies |

Source/report links: [build audit](../bot-harness-capability-audit.md),
[command-center tooling](../bot-experience-command-center.md),
[runner](../bot-experiment-runner-current-state.md),
[T2 day closeout](t2-day-experiment-closeout-2026-09-09.md),
[focused closeout](t2-focused-experiment-2026-09-10.md),
[old pacing](t2-economy-pacing-analysis-2026-09-10.md),
[XP redesign](biome-mastery-progression-redesign-2026-09-11.md).

## Campaign ledger

- Validated: shared-cost projection and source-ordered build/acquisition tests; see Q0 report for executed checks.
- Current runtime qualification: Q1 six profiles passed configuration on `1d3c710f`; Q2b/Q2c/Q2d all six completed both local behavior windows on `755b2a36`. Slinger and Apprentice supplied death/return evidence. Later T1 Striker boss results are recorded below; T2 boss coverage remains open.
- New confirmed balance signals: none. Bot executor defects: death notification consumed before live respawn; suppressed-combat attackers postponed navigation recovery. Repaired for V1d; one natural death recovered and preparation completed.
- Approved gameplay change, 2026-09-13: T1 Cave corrosion only on Breach, two stacks per cast after a follow-up human test found three still too strong; ordinary attacks apply none. Base cap six and half-HP cap nine retained and displayed explicitly in the bestiary. Further approval reduces base attack 47 to 40, retaining Breach's 1.1x multiplier; HP remains 1750 under discussion. No T2/T3 change. Await the user's playtest before preparing the next Cave experiment; beatability remains unvalidated.
- Historical operation: V1a `20260912t194203z-striker-campaign-plains-boss-t` reached GM30, timed out while upgrading Plains Vest +5, and made zero boss attempts. Supervisor EPERM left stale running state; worker timeout is durable. [Assessment](bot-balance-v1a-assessment.md).
- Latest result: V1b finalized normally with a preparation timeout, Axe +5 and zero boss attempts. [Assessment](bot-balance-v1b-assessment.md). The earlier V1a lifecycle remains invalid.
- Latest result: V1c failed its supplier arrival wait after a transit death. Two ordinary deaths overall, no final kit or boss encounter. [Assessment and executor repair](bot-balance-v1c-assessment.md).
- Latest result: V1d completed 105/105 steps in 18m42s with one natural transit death recovered. [Assessment and inherited-lessons review](bot-balance-v1d-assessment.md).
- Latest result: V1e completed in 213.919 seconds with one authoritative Plains clear, zero deaths and 46.548 seconds of boss combat. This demonstrates prepared Striker possibility, not reliability, other-class viability or canonical pacing. [Assessment](bot-balance-v1e-assessment.md).
- Latest result: [Night 1](bot-balance-night1-report.md) earned Mountain armor +5, then produced one valid Swamp Expose/Cleanse loss and one dual-Guard victory. Third entry failed HP/buff checks; fourth case interrupted, all remaining slots unstarted. [Assessment and count clarification](bot-balance-night1-assessment.md). No new T2 results.
- Latest result: [V1f assessment](bot-balance-v1f-assessment.md): atomic entry qualified; dual Guard is the preferred prepared Striker Swamp candidate (3/3 versus 0/3). Gnarled Greatbear and Crag Behemoth killed; Cave retained 30.63% HP after a valid death. Cave's `bot_partial` did not justify stopping Plains. Guardian/boss identity and range-metric corrections are recorded in the assessment. No T2 execution evidence added.
- Active operation: V1g is frozen on `d836321279ef3fa4927f293326a5483928f54378`. Cave phase `20260913t090242z-striker-campaign-night-cave-t1` is terminal with six `bot_partial` losses. T2 phase `20260913t093354z-striker-t2-progression-squire` was running when the user approved the Cave nerf. Leave this independent T2 screen running; do not alter images/manifests or mix pre-nerf Cave evidence with later results. After its final report, qualify the patched source and repeat the bounded Cave comparison with the same earned input.
- Historical Q2d Spirit, Apprentice and Squire passed. Apprentice died once and returned; Spirit's Q2c pre-worker failure remains separate. [Overall readiness state](bot-balance-q2d-assessment.md).
- Historical Q2c Conduit/Slinger passed and Spirit stopped before startup due to Docker address exhaustion. [Assessment and infrastructure repair](bot-balance-q2c-assessment.md).
- Historical Q2b `20260912t170727z-striker-campaign-local-behavio`: Striker completed, no deaths or unwanted transit; Sweep 8 kills/8 activations, Expose 5 kills/6 activations. Readiness only.
- [Q2b assessment](bot-balance-q2b-assessment.md) accepts the repair and corrects the report's truncated manifest hash and Defensive Rune count. No template or gameplay edits needed.
- Historical Q2 `20260912t162628z-striker-campaign-behavior-t2-s`: Striker timeout, Squire cancelled after start, four cancelled before start. Keep its partial evidence separate.
- [Q2 assessment](bot-balance-q2-assessment.md): unnecessary catalogue-first node transit consumed 278 seconds. This is route/observation evidence, not a build weakness verdict.
- [Astra Q1 assessment](bot-balance-q1-assessment.md): raw event verification and reason for Q2. Uncommitted gameplay changes are excluded from the Q2 source.
- On return: record exact revisions/artifacts, classify evidence, update affected
  profile/checkpoint status, then choose one next question. Historical passing
  preflight reports must not be presented as fresh verification.

## V1g review / V1h prepared

See [V1g assessment](bot-balance-v1g-assessment.md) and [V1h operator packet](bot-balance-v1h-operator-packet.md). Source 3145246a includes current Cave/Mountain mechanics and corrected catalyst acceleration. Thirteen bounded runs; no experiment launched by Astra. T2 legacy screens remain not-asserted diagnostics. Next direction: isolate build improvements, acquire credible current T2 checkpoints, then qualify separate boss encounters. T3/T4 low TTK remains deferred.

## V1h reviewed / V1i prepared

[Assessment](bot-balance-v1h-assessment.md) and [operator packet](bot-balance-v1i-operator-packet.md). Frozen source61080e54. Resource-aware upgrades and strict explicit prepared-T2 resume are tested. The original Spirit snapshot stays unchanged and retains synthetic/25x provenance. Plains compares two weapons with dual Techniques; Forest tests a prepared burst-defense candidate. Eight runs; three hours of worker ceilings, four hours total. No manifest created or launched by Astra. T2 boss coverage begins here; T3/T4 low TTK and normal-speed economy remain deferred.

## V1i reviewed / V1j prepared

[Assessment](bot-balance-v1i-assessment.md), [V1j packet](bot-balance-v1j-operator-packet.md). Frozen source `6365651b` includes the monster-control correction. Expand encounter coverage while testing a transferable defensive distinction: burst buffering versus sustained Recovery access. Two Mountain and four Swamp cases independently reuse the original Spirit prepared input. No class-wide weapon ranking, canonical evidence promotion, gameplay changes or launched manifest. Remaining T2 bosses and broader class paths follow after these results; T3/T4 balance stays deferred.

## V1j reviewed / V1k prepared

[Assessment](bot-balance-v1j-assessment.md), [V1k packet](bot-balance-v1k-operator-packet.md). Frozen source `a419a7ff`. Swamp losses identify poison as the lethal pressure; test Bog Wrappings against Cave armor with recovery/abilities fixed. Add Cave triple-Guard and Desert Cleanse candidates. A boss kill and surviving its remaining effects are now separate reported outcomes. Eight independent cases reuse original Spirit input; no manifest launched. Jungle remains after this coverage pass, then one continuous three-seal/ascent route can open limited T3 exploration without requiring every class/boss combination. T3/T4 low mob eHP remains deferred.


## 2026-09-17 — Night5 prepared; playtest gate clarified

User requires an initial mob balance pass through ALL tiers1–4 before the human
player playtest. One successful route is insufficient. T4 mob durability is still
unadjusted; item/class/ability perfection is not the gate. Earlier provisional
calendar estimates must be revised against T4 findings rather than promised.

Durability20:470 full windows,14 deaths (11 Mountain),20 Jungle wall ceilings.
The outcome verifier mismatch is tooling; older hazard/approach repairs changed
real behavior. Mountain human evidence: longer fights plus kiting around ledges
can attract additional dangerous mobs. Test orbit/boots before attack reductions.
Cave boots' detection reduction is implemented, but equipment trades speed and
defenses too. User offers T4 specialization advice; request it before interpreting
a weak standardized build as a mob problem.

[Night5 packet](bot-balance-night5-operator-packet.md):524 cells/1572 maximum
observations, six independent sequential blocks, eight-hour simulation ceiling.
Frozen7f9ab446; no experiment launched. Medium native-range T4 branchesA/B/C are
first-screen references, not optimal builds or a substitute for Voidwalker.
No new production stat changes. Keep finite mob worklist and class/tooling
exceptions separate; proceed mobs -> items -> classes (abilities/stances/rune
choices alongside class builds) -> full economy, with mechanics validity throughout.

## 2026-09-17 — Night5 launcher repaired; R1 prepared

Night5 failed before any observation because Node --import rejected a Windows
absolute drive path. Corrected to a file URL; the exact shared launcher argument
builder passed four Mountain pilots plus audit. Frozen revision d0492235,
[replacement packet](bot-balance-night5-r1-operator-packet.md), new root
night5-r1-20260917. Same524 cells/1572 observations, seeds, gameplay and limits.
Original failure artifacts remain intact; full R1 batch not launched by planner.
