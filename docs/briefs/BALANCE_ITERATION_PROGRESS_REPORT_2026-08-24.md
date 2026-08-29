# Balance iteration progress report — for an assessing LLM

**Written 2026-08-24**, end of a single continuous session that ran T1-T4 numerical
balance iteration on top of `docs/briefs/SONNET_BALANCE_ITERATION_HANDOFF_2026-08-23.md`
(read that first — it is the contract this session operated under: numbers only, no
mechanics, escalate item/class tuning, never invent an absolute-pitch target).

**Audience**: another LLM (or a human) auditing or continuing this work with no memory of
the session. Everything here is a claim to verify, not a conclusion to trust blindly —
re-run the commands cited before acting on any of it.

**Repo state**: nothing in this session was committed. `git status` shows 31 modified
files (20 data files across `shared/src/data/monsters/*.ts`, `shared/src/data/recipes/*.ts`,
`shared/src/data/monsters/bossesT1.ts`, plus regenerated `reports/*`). `pnpm db:up` was run
mid-session (Postgres/Redis needed for the bench harness) and containers were left running.

---

## 1. What this session actually did, in order

1. **T1 iterations 1-4** (provisional, per designer-set D1/D2/D3 anchors from the prior
   session): Chaotic Axe attack curve cut ~10%, two Mountain monster charged-spike
   multipliers cut ~10-12%, Gnarled Greatbear's pre-50% attack-speed ramp cut, a stale
   source comment fixed. A charm-comparison diagnostic (real runtime bench, not the
   analytical eHP report) found Murk Eye is NOT uniformly dominant as the analytical
   report claims — full findings in conversation history, not repeated here since no
   charm numbers were changed in that phase.

2. **User granted broad autonomy** ("iterate until no edge cases, numbers only, flag
   mechanics") and the scope expanded to T2-T4 monster ladder smoothing, then to items.

3. **T3 Glacier Bear fix** (§3 below) — the first T2-T4 monster fix, found by sweeping
   every tier's "Heavy spike"/"One-shot" flag in `mob-llm-packet-t{2,3,4}.md` and checking
   each flagged monster's mechanic (plain ordinary hit vs CC/telegraph-gated).

4. **Item diagnostic** (§4) — real-runtime bench comparison of T2-T4 charms across
   biomes/classes found 4 catastrophically broken biomes (T2 Desert, T3 Tundra, T3
   Volcanic, T4 Trench: some classes landing **zero kills** in 20 sim-minutes). Charm
   magnitude was hypothesized as the cause and four charms were buffed.

5. **The charm-magnitude hypothesis was WRONG** — verified by re-running the exact same
   diagnostic after the buffs. Numbers barely moved (§5). This is the most important
   methodological result of the session: **do not trust a plausible-looking correlation
   without a controlled re-test.**

6. **Death-trace instrumentation** (§6) — a new diagnostic technique built mid-session:
   a temporary script that hooks `registerCombatListener('onDamageTaken'/'onKill', ...)`
   directly on the real combat pipeline and prints every hit against the bench bot in the
   seconds before each death. This found the REAL cause in every broken biome: a specific
   monster's **plain, untelegraphed ordinary attack** dealing 50-180% of the arrival
   player's max HP per swing, not a defensive-item shortfall.

7. **12 monster ordinary-attack cuts** across T2 Desert, T3 Volcanic, T4 Trench, T4
   Desert, T4 Volcanic (§7), each verified by re-running the death-trace and then a full
   6-class farm re-run. Every one of the four originally-catastrophic biomes now shows
   healthy death rates and non-zero kill rates for the great majority of classes.

8. **Two residual, deliberately-untouched failures** identified and diagnosed to root
   cause but NOT fixed: Apprentice (DoT-root) and Conduit (summoner-root) still
   underperform in several biomes for reasons that are class-behavior/output related, not
   monster numbers (§8) — explicitly out of this session's scope per the original handoff
   ("item and class numbers... escalate instead").

9. **Full T2-T4 flag re-sweep** (§9) — confirmed which flags cleared, which are correctly
   deferred (CC/telegraph-gated, left alone on purpose), and which are confirmed-fine
   despite an analytical flag (simulation disagrees with the analytical report and wins,
   per the standing project rule).

---

## 2. The four charm buffs (kept, but NOT the fix — see §5)

All in `shared/src/data/recipes/`, `mechanicEffects` fields only, base value bumped
(upgrade-step deltas left alone unless noted):

| File | Item | Field(s) | Before (+5 total) | After (+5 total) |
|---|---|---|---|---|
| `desert.recipes.ts` | `desert-charm-t2` (Mirage Talisman) | `cleanse-empty-heal-pct` base 0.03→0.10, per-upgrade 0.01→0.03; `cleanse-interval-ms` 6000→4500 | 0.08 | 0.25 |
| `tundra.recipes.ts` | `tundra-charm-t3` (Frostward Charm) | `barrier-pct` 0.12→0.18, `absorb-pct` 0.08→0.12 | 0.40 | ~0.50 |
| `volcanic.recipes.ts` | `volcanic-charm-t3` (Magmaheart Stone) | `recovery-active-pct` 0.06→0.14, `recovery-on-kill-pct` 0.04→0.09 | 0.30 | ~0.43 |
| `trench.recipes.ts` | `trench-charm-t4` (Pressure Vessel) | `absorb-pct` 0.16→0.22, `recovery-pulse-pct` 0.10→0.15 | 0.51 | ~0.62 |

**These are directionally reasonable** (they bring each charm's magnitude closer to
same-tier peers) but **did not fix the death-loops they were built to fix**. Kept because
they're not wrong on their own terms, not because they were validated as load-bearing.

---

## 3. T3 Glacier Bear (first monster fix, found via flag-sweep not death-trace)

`shared/src/data/monsters/tundra.monsters.ts`, `glacier-bear.stats.attack`: **415 → 300**.

Found by reading `mob-llm-packet-t3.md`'s Walls & Stalls table (`Tundra | One-shot |
Glacier Bear hits for 114% of the arrival player's maxHP`) and checking the monster's own
mechanic: no `chargedAttack`, no root, no CC — a **plain ordinary hit** at 2.48x the
tier's average spike. This is the template the rest of the session's fixes follow: a
flagged spike is only touched if the monster's own definition shows the damage is NOT
gated by a telegraph/cast-bar/root (which would mean real player counterplay exists that
the analytical tool can't see — see the standing rule about Murk Eye/Swamp in the prior
handoff).

Verified via `pnpm mob:llm` regen: worst-hit dropped 114%→94.6% (one-shot flag cleared),
Tundra's difficulty-wall step improved 2.87x→2.55x, and Volcanic's shape inversion
(EASIER-then-nothing) incidentally resolved too.

---

## 4. The item diagnostic (methodology + raw findings)

**No existing tool could do this.** Investigated first: `bench:balance`/`boss:exam` CLI
flags only pin class/biome/tier, not individual gear slots. The only override path is
`BuildSpec.gearItemIds` (a field consumed by `materializeBot()` in
`server/bench/balance/botFactory.ts`), which isn't exposed via CLI. So a temporary script
was written each time (pattern below), used, and deleted — never committed as permanent
infra, per the original handoff's explicit instruction ("do not build new permanent
balance infrastructure").

**Pattern** (reusable if this needs doing again): import
`representativeBuildsPerClass(tier, biome, {classRoot})` from
`server/bench/balance/progression.ts` to get a real auto-selected build, optionally
override `build.gearItemIds[slot]`, then call `runFarm(build, target, {maxSimSeconds,
timeScale})` from `server/bench/balance/runFarm.ts`. `runFarm` returns real per-hour
`deaths`, `hpLostPerHour`, `damageTakenPerHour`, `kills` — genuine combat outcomes, not
analytical estimates. Needs `ensureBenchHitboxCache()` first and a live Postgres
(`pnpm db:up`) because hitbox baking touches the DB.

**First-pass finding** (54 runs: T2/T3/T4 baseline + 2 flagged biomes each, 6 classes,
default auto-gear): T2 Desert, T3 Tundra, T3 Volcanic, T4 Trench were catastrophic —
several classes landed **zero kills** in 20 sim-minutes with death rates up to 1047/hour.
T4 Mountain showed near-zero engagement (`meanAggroed` as low as 0.03) which was
*suspected* at the time to be a known unfixed "Mountain auto-combat wedge" bug referenced
in an old project memory — **this suspicion was later retracted** (§9) after a direct
trace showed T4 Mountain is fine for most classes; the low numbers were class-specific
(Apprentice/Spirit), not biome-wide.

A magnitude correlation was drawn (weak charms ↔ broken biomes) and used to justify the
§2 buffs. **That correlation was not causal — see §5.**

---

## 5. The charm buffs did not work (important negative result)

Re-ran the exact same diagnostic on just the 4 broken biomes after applying the §2 buffs.
Deaths/kills barely moved (T2 Desert Slinger: 1047→990 deaths/hr, **still 0 kills**; T4
Trench Slinger: 765→771 deaths/hr, **still 0 kills**; Desert Striker actually got
*worse*, 345→411). Full before/after table is in conversation history.

**Lesson for whoever reads this next**: a plausible mechanism (item magnitude too low)
backed by a real correlation in the data can still be wrong. The fix was verified by
literally re-running the same measurement, not by reasoning about it harder. Do this for
any future balance hypothesis in this codebase.

---

## 6. The death-trace technique (the actual breakthrough)

Built as `server/bench/_deathTrace*.ts` (temporary, deleted after each use, never
committed). Core idea: register real combat-pipeline listeners on the bench bot and print
every hit taken (attacker name, damage, HP before/after) in the seconds leading up to each
death, using the SAME real farm-bench world/tick loop as `runFarm` (not a separate model).

```ts
import { registerCombatListener, unregisterCombatListener }
  from '../src/systems/combat/engine/combatPipeline';
// onDamageTaken(ctx): ctx.defender.isPlayer.id === BENCH_BOT_ID, ctx.attacker.isMonster?.name, ctx.damage
// onKill(ctx): fires when the bot dies -> dump the buffered hit log and clear it
```

This is the tool to reach for first next time something reads "0 kills" or an extreme
death rate in a farm-bench sweep — it answers "what actually killed it" in one run,
where aggregate stats (deaths/hour, hpLostPerHour) only tell you THAT something is wrong.

---

## 7. Monster ordinary-attack fixes (the real fixes, all verified)

All are `stats.attack` cuts on **plain, untelegraphed, ordinary hits only**. Every monster
here was checked for a `chargedAttack`/root/lockdown first; if present, ONLY the ordinary
attack was touched and the ability's own multiplier was left completely alone (matching
the standing "leave CC-gated spikes for manual playtest" rule from the prior session).

| File | Monster | Attack before → after | % cut | Evidence |
|---|---|---|---|---|
| `desert.monsters.ts` (`dust-djinn`) | Sun Scarab (T2) | 156 → 85 | 46% | death-trace: 165 dmg = 63.7% of 259 maxHP, repeated every ~2s, dominant killer |
| `desert.monsters.ts` (`sand-scorpion`) | Sand Scorpion (T2) | 132 → 75 | 43% | death-trace: 136 dmg = 52.5% of maxHP |
| `desert.monsters.ts` (`stone-basilisk`) | Stone Basilisk (T2) | 138 → 55 | 60% | death-trace: 144 dmg = 55.6% of maxHP; **own comment says "weak normal attacks" — contradicted by the authored value** |
| `volcano.monsters.ts` (`ember-scuttler`) | Ember Scuttler (T3) | 148 → 70 | 53% | death-trace: 110-122 dmg (up to 42% maxHP); **own comment says "weak... filler" — contradicted** |
| `volcano.monsters.ts` (`cinder-hound`) | Cinder Hound (T3) | 184 → 135 | 27% | death-trace: 150-165 dmg (up to 57% maxHP) |
| `volcano.monsters.ts` (`magma-brute`) | Magma Tortoise (T3) | 343 → 190 | 45% | death-trace: 320-342 dmg — **literal one-shot** against ~291 maxHP; own comment says "no signature ability" so this base number WAS the whole threat |
| `trench.monsters.ts` (`abyssal-serpent`) | Abyssal Serpent (T4) | 420 → 230 | 45% | death-trace: 321-370 dmg (up to 81% maxHP), ordinary hit only — Abyssal Bite charged multiplier untouched |
| `trench.monsters.ts` (`hadal-stalker`) | Hadal Stalker (T4) | 401 → 210 | 48% | death-trace: 304-342 dmg (up to 75% maxHP), ordinary only — Pressure Lance untouched |
| `trench.monsters.ts` (`elder-leviathan`) | Elder Leviathan (T4) | 483 → 260 | 46% | death-trace: 370-376 dmg (up to 82% maxHP), ordinary only — Devour untouched |
| `desert.monsters.ts` (`sandspitter-cobra`) | Sunshield Scarab (T4) | 292 → 180 | 38% | death-trace: 341 dmg = 62% of 549 maxHP every ~1.9s — was the REAL killer, not the analytically-flagged Dune Tyrant |
| `volcano.monsters.ts` (`obsidian-tortoise`) | Obsidian Tortoise (T4) | 262 → 100 | 62% | **clean author-error**: monster's own comment computes intended DPS assuming base attack 100 (`(3·100+220)/4`, cadence-finisher comment literally says `// 220` = 100×2.2); authored value was 262 |

## Also from the T1 phase (§1, kept provisional, not re-verified this session beyond
what was already reported)

| File | Entity | Field | Before → After |
|---|---|---|---|
| `cave.recipes.ts` | Chaotic Axe (`chaotic-axe`) | `stats.attack` curve, +0→+5 | 24/26/28/30/33/36 → 22/23/25/27/30/32 |
| `mountain.monsters.ts` | Cliff Hopper (`cliff-hopper`) | `chargedAttack.multiplier` | 2.1 → 1.9 |
| `mountain.monsters.ts` | Ridge Ambusher (`ridge-archer`) | `chargedAttack.multiplier` | 2.5 → 2.2 |
| `bossesT1.ts` | Gnarled Greatbear (`gnarled-greatbear`) | `rampOnCombat.perTickPct` / `.maxPct` | 0.07/0.28 → 0.05/0.20 |

---

## 8. Explicitly NOT fixed — flagged for you or the designer, not silently ignored

- **Apprentice (dot-root)**: death-traced at T2 Desert. Kept dying with **zero kills**
  across three separate death cycles despite dealing real damage — but damage was spread
  across 3 different targets (Stone Basilisk, Sand Scorpion, Sun Scarab) each time, never
  enough sustained focus on one target to finish a kill. Reads as a target-switching
  problem under concurrent pack aggro, likely compounding badly with a DoT-based damage
  model (stacks probably don't carry over between targets). **Not touched — this is
  AI/aggro-priority behavior, a mechanic, not a monster number.** The user separately
  floated a possible future "DoT spreading" mechanic for Apprentice as a design idea, but
  called it explicitly theoretical/not-now.
- **Conduit (summoner-root)**: death-traced at T2 Desert. Landed exactly 1 kill in ~40s of
  trace time; summon-formation damage output (5 hits × 16 dmg per volley ≈ 80/volley) is
  too low to finish a 660 HP monster before the pack's incoming damage kills the 261 HP
  player first. **Not touched — this is class/summon DPS output, explicitly "item and
  class numbers... escalate instead" from the very first handoff of this whole balance
  program.** Note: Conduit's Volcanic/Trench T3/T4 results improved a lot from the
  monster-side fixes in §7 (90→240 kills at T3 Volcanic) — it is NOT broken everywhere,
  just still weak specifically at T2 Desert and to a lesser extent T3 Tundra.
- **T2 Caverns Cave Troll** (127% one-shot): its damage is delivered via
  `engageSequence: 'charge-lock-charged-attack'` — a genuine player-movement lockdown
  before the hit lands, i.e. real (if narrow) counterplay the analytical tool can't
  model. Left alone per explicit user decision earlier in the session ("leave as-is, flag
  for manual playtest").
- **T3 Rime Caster** (94.6% heavy spike): its spike is Frostbind, a stack-gated CC
  ability (`requiresAmbientStacks: 3`), not a plain hit. Same treatment as above.
- **T4 Desert Dune Tyrant** (131% one-shot per the analytical Walk table): death-traced
  directly — confirmed this is its own telegraphed Pincer Smash landing at 711 damage,
  not a plain hit. Correctly left untouched; Sunshield Scarab (§7) was the real problem
  in that biome.
- **T4 Tundra Permafrost Behemoth** (203% one-shot per the analytical table): a full
  6-class farm re-run of T4 Tundra showed **0 deaths for every class** despite this flag.
  Simulation disagrees with the analytical report here and, per the project's standing
  rule ("simulation outranks reconstructed analytical formulas when they disagree"), the
  analytical flag is treated as a false positive. Not touched.
- **T1 Cave Brute "unexplained deaths"** (a designer observation from manual play,
  carried over from the prior session): investigated at the code level
  (`server/src/systems/combat/engine/combat.ts` / `monsterMechanics.ts`) — the Ground
  Slam AoE resolution is correctly implemented (impact point planted once at cast start,
  resolved against each player's LIVE position at impact time, matching the documented
  "walk out of the circle" design). Then death-traced at runtime: normal attritional
  deaths, no unexplained spike reproduced. No code or number issue found; closing this
  thread without a fix since there's nothing identified to fix.
- **T1 Mountain concurrency** ("one enemy fine, two enemies death") and **T2 Desert-style
  counterplay-vs-numbers ambiguity for Swamp**: both remain exactly where the prior
  session left them — flagged, not touched, awaiting the designer's manual playtest.

---

## 9. Post-fix flag re-sweep (what's left in the reports right now)

Re-ran `pnpm mob:llm` after all fixes and grepped every tier's Walls & Stalls table for
`One-shot|Heavy spike|Difficulty wall|No progression`. Current state (2026-08-24):

- **All "one-shot" (>100% maxHP) flags are now accounted for**: T4 Volcanic's cleared
  entirely (fixed); the three remaining ones (T2 Caverns, T4 Desert, T4 Tundra) are each
  individually confirmed above (§8) to be either correctly-deferred CC/telegraph
  mechanics or a confirmed-fine-in-simulation false positive.
- Remaining "Heavy spike" flags (all <100% maxHP: Ridge Ambusher 50%, Cave Brute 87%,
  Granite Titan 71%, Mountain Colossus 72%, Cavern Troll 88%, Rime Caster 95%[deferred],
  Granite Mammoth 84%, Elder Leviathan 87%[down from a pre-fix 186%]) are within the same
  magnitude band already treated as acceptable elsewhere in this program (e.g. T1
  Caverns' Cave Brute at 87% was never flagged for a fix). Not touched.
- Remaining "Difficulty wall"/"No progression" flags (Forest walls at T1/T2, Jungle
  stalls at T2/T3/T4, Desert/Tundra walls at T3, Desert wall at T4) are **shape/step**
  signals from the cost-per-kill Walk table, not raw danger signals — T1's own Forest
  wall was confirmed HEALTHY by the designer via manual play, and none of the T2-T4
  biomes have an equivalent designer-set anchor (D1/D2 was T1-only). These were
  deliberately NOT chased — doing so would mean inventing an absolute-pitch judgment for
  unreviewed tiers, which the original handoff explicitly reserves for the designer.

---

## 10. Verification gaps — do these before trusting this is "done"

- **`pnpm test` (the full suite) was never run this session.** Only `recipeGates.test.ts`
  and `instrumentParity.test.ts` were run after each change (per repo convention: full
  suite is a pre-commit gate, not a per-step one). Run it before any commit.
- **No boss content was touched or re-examined this session** beyond what the prior
  session already covered (Gnarled Greatbear's ramp). `pnpm boss:exam` was not re-run
  after any of these changes.
- **None of the T2-T4 fixes have been manually playtested.** Everything in §7 is verified
  against the real farm-bench simulation (genuine server combat pipeline, full
  ability/stance/rite loadout) — which is a much stronger signal than the analytical
  reports, but it is still a bot, not a human. Per the T1 precedent, treat all of this as
  provisional pending actual play.
- **The death-trace sample size is small** (4 deaths per trace, ~150-180 sim-seconds).
  Good enough to identify a dominant killer, not a statistically tight measurement — the
  full 6-class `runFarm` re-runs (20 sim-minutes each) are the more trustworthy
  before/after comparison and are what's cited as "verified" throughout.
- **Postgres/Redis containers are currently running** (`pnpm db:up`, left up for the
  bench harness). Not committed to any config — just a live local state.
- **No item other than the 4 charms in §2 was examined.** Weapons/armor/boots/cores/
  relics across T2-T4 are unexamined; the item diagnostic only covered the `recovery`
  (charm) slot, and only for 4 specific biomes.

---

## 11. Suggested next actions, roughly in priority order

1. Run `pnpm test` (full suite) once, before anything else touches this branch.
2. If continuing the sweep: T1 Mountain concurrency and T2 Desert-style Swamp
   counterplay-ambiguity are the two oldest unresolved flags — both need a design/manual
   read, not more monster-number cuts (already tried the number-only lever, it's not the
   right tool for either).
3. If picking up the item-diagnostic thread: extend death-trace coverage to the
   remaining T2-T4 biomes never explicitly traced (only baseline + 2 flagged biomes per
   tier were sampled — Caverns, Jungle, Wasteland, Swamp at T3/T4 etc. were never
   death-traced, only read from the analytical Walk table).
4. Apprentice's target-switching problem and Conduit's low summon output are real,
   reproducible, class-level issues with concrete trace evidence in this document (§8) —
   good candidates for a dedicated class-balance session once that's back in scope.
5. Get a human (or the designer) to actually play T2-T4 content before trusting any of
   these numbers as final. Nothing here has been played by a person.
