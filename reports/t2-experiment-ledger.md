# Tier-2 experiment ledger

Every meaningful run from the Tier-2 infrastructure build-out, including the ones
that failed. Negative results stay here: a hypothesis that turned out wrong is
the cheapest thing in the ledger and the most expensive thing to re-learn.

Machine-readable twin: [`t2-experiment-ledger.json`](t2-experiment-ledger.json).

**Evidence-class rule.** Nothing below is canonical. Every run carries
`SYNTHETIC_TIER_ENTRY` (started from a template, not from a played Tier 1) and
`NON_CANONICAL_REWARD_MULTIPLIER`. They answer *progression integrity* and
*combat sanity*. They say **nothing** about economy pacing, and no completion
time here may be read as a player-facing duration.

---

## T2-E001 — Do the Tier-2 entry templates describe legal characters?

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Build** | `develop` @ `721d2b57` + working tree |
| **Type** | Offline validation, no server |
| **Hypothesis** | The templates derived from the canonical Tier-1 routes are characters the game could actually produce. |
| **Method** | `pnpm bot:t2-validate` — ~120 static checks per template. |
| **Result** | **FAILED, then fixed.** 4 errors × 12 templates: every template owned the four Clearing starter items (`primordial-club`, `clearing-vest-t1`, `clearing-charm-t1`, `clearing-boots-t1`) while declaring no `clearing` biome level, so those recipes never unlocked. The templates described characters whose own gear was never craftable. |
| **Fix** | Added `clearing: 4` to the manifest — the level the canonical routes actually farm, and the gate on Soft Boots. The Clearing is excluded from `globalMastery()`, so this changes no rune budget and no upgrade ceiling. |
| **After** | 18/18 templates PASS (12 at the time; the `catalyst-primed` arm added 6 more). |
| **Classification** | Harness defect (bad template state). |
| **Confidence** | High — mechanical check against live static data. |

---

## T2-E002 — Does the server build the character the template describes?

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Type** | Live spawn validation against the running dev server |
| **Hypothesis** | `applyTierEntryProfile` produces exactly the declared character, with no stale combat state. |
| **Method** | `validateSpawn` — ~90 checks comparing the template to the authoritative `PlayerView`, including the server's own derived recipe unlocks in both directions. |
| **Result** | **PASS for all five classes exercised** (Striker, Squire, Apprentice, Slinger, Spirit): 212–221 combined checks each, 0 errors. |
| **Classification** | — |
| **Confidence** | High. Conduit not yet exercised live (needs `CONDUIT_ENABLED`). |

---

## T2-E003 — Does `In Combat → Focus Highest HP` stay inside the encounter?

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Type** | Targeted regression, real `World`, no network |
| **Hypothesis** | A targeting PREFERENCE orders the enemies already in the fight; it does not choose which fight to start. |
| **Control** | Same scene with `focus-closest`, and the same scene out of combat. |
| **Variable** | The equipped targeting rule. |
| **Result** | **HYPOTHESIS VIOLATED.** With a Prairie Wolf actively attacking the player and a 4,000 HP Gorging Razortusk 3,200px away and unengaged, the bot selected **the razortusk**. Root cause: `WEIGHT_PRESETS` sets `distance: 0.001` for both HP-preference modes, and `Find Enemies` raises the acquire radius to `RUNE_NODE_ACQUIRE_RADIUS` (10,000, wider than a 4,800px node), so `score = maxHp − 0.001 × penalty` ranked every monster in the node by raw max HP. |
| **Second finding** | `focus-lowest-hp` scored `1 / hp`, whose spacing collapses as HP grows. At 1,700 vs 4,000 HP the candidates differ by 3e-4 against a 1e-3 distance term, so the rule **inverted into "focus nearest"** exactly where big pulls make it matter most. |
| **Fix** | While anything is engaged, both HP-preference modes choose from the **engaged set**; both now score a normalized 0..1 term so distance is a real tie-break at every HP scale. `focus-elites` deliberately excluded — its cross-node reach is its purpose and `eliteTargeting.test.ts` pins it. |
| **Classification** | Rune/autoplay defect. |
| **Confidence** | High — reproduced in a test that fails without the fix. |
| **Next** | Designer call: should `focus-elites` still be allowed to start a fight across the node, now that it is the only targeting rune that can? |

---

## T2-E004 — Can a Tier-2 route obtain Tier-2 gear at all?

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Type** | Static analysis of live recipe data against each template |
| **Hypothesis** | Tier-2 items are crafted the way Tier-1 items are. |
| **Result** | **HYPOTHESIS WRONG.** 20 of 32 Tier-2 recipes are EVOLUTIONS of a specific Tier-1 predecessor, and `craftRecipe` refuses them outright. Only the eight Jungle/Desert pieces and the three Cores are plain crafts. Evolution needs the predecessor **in the bag** (not equipped) at **+5**; otherwise the only path is reconstruction at roughly 3.5× the cost. |
| **Consequence** | Across the six class plans (50 planned acquisitions): 7 evolve directly, 15 evolve only after unequipping the worn predecessor, **22 must reconstruct**, 6 are plain crafts, 0 unreachable. |
| **Root cause of the 22** | `EVOLUTION_REQUIRED_PLUS` moved 3 → 5 on 2026-08-29 and the canonical Tier-1 routes were never updated. Striker's `flash-rapier` ends at +4, `iron-broadsword` at +1, `plains-charm-t1` at +2. |
| **Fix** | Added an `unequip` route step and an acquisition planner that resolves the path per item from the class's own template. The +5 shortfall was **not** routed around. |
| **Classification** | Harness gap (fixed) + progression finding (recorded, for a designer). |
| **Confidence** | High — read from live data, and the evolve path was then observed working on the server. |

---

## T2-E005 — First live Tier-2 route run

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Run** | `striker-t2-mid-intended-2026-09-02T00-56-21Z-30f8e515` |
| **Template** | `striker-t1-t2-entry-clean` |
| **Config** | reward multiplier **100×**, `maxRunMs` 540,000 |
| **Hypothesis** | The control route progresses through its first biome leg. |
| **Result** | **BLOCKED.** 98 kills, 1 death, Plains reached level 12 (GM 30 → 36), and then the run spent **521 of its 540 seconds** `blocked-on-resource` on `reconstruct:plains-charm-t2`, needing **2 alacrity catalysts** — while parked in `node-t2-plains-04` (**dominion** modifier), holding **46,044 spare yellow essence** and 5 unspendable dominion catalysts. |
| **Diagnosis** | Route problem, not balance. Catalysts are minted by the node MODIFIER and by nothing else, and modifiers are static per node. The cost-farm was pointed at the plain biome ref, so the bot farmed in a node that could never mint the family it needed. |
| **Fix** | `t2FarmFor(group, family)` — a cost-farm now prefers a node whose modifier mints the required family, falling back to the plain ref where the biome has none. Applied to acquisition and to upgrade steps (deep upgrade steps cost catalysts too). Guarded by `t2Routes.semantic.test.ts`. |
| **Classification** | Route problem. |
| **Confidence** | High — the block reason, the node, the modifier and the wallet are all in the artifact. |

---

## T2-E006 — Same run, after the catalyst-node fix

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Run** | `striker-t2-mid-intended-2026-09-02T01-08-02Z-a178ee7c` |
| **Control** | T2-E005, identical in every other respect. |
| **Variable** | Cost-farm node selection only. |
| **Result** | **Plains leg completed.** Evolved `plains-vest-t2`, reconstructed `plains-charm-t2` (298s, down from never), unequipped and evolved `plains-boots-t2`, recorded the deliberate `knight-steelsword` skip, maxed Plains to 12, ran three opportunistic upgrades (all resolved to +0, correctly — the Tier-2 ceiling is +0 below Global Mastery 42). |
| **Interpretation** | The fix works. But 298 seconds for 2 catalysts **at 100× rewards** exposed the next constraint. |
| **Classification** | Fix verified. |
| **Confidence** | High. |

---

## T2-E007 — Accelerated Tier-2 runs are catalyst-bound, not combat-bound

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Type** | Code reading + measurement |
| **Finding** | The dev reward multiplier **deliberately does not scale catalyst progress** (`rewards.ts`: "a catalyst is a discovery, not a currency pile"). Catalysts therefore mint at 1× in every run, accelerated or not. |
| **Measurement** | 2 alacrity catalysts in 298s at 100× rewards, against 46,044 banked essence in the same window. |
| **Scale** | Total Tier-2 catalyst demand, derived live: **alacrity 40, swarming 17, fortified 17, heavy 16, dominion 9 — 99 total.** At the measured rate that is on the order of **four hours of irreducible waiting per full-tier run**, none of which measures combat or progression. |
| **Consequence** | An accelerated Tier-2 smoke run spends most of its time on the one axis acceleration cannot touch — the opposite of what an accelerated run is for. |
| **Response** | Added a third entry-economy arm, `catalyst-primed`: zero essence, plus the full derived Tier-2 catalyst demand. Progression-integrity instrument only; it deletes catalyst supply by construction and is **never** admissible economy evidence. |
| **Classification** | Harness/measurement design. Not a game defect — the no-scaling rule is deliberate and correct. |
| **Confidence** | High. |

---

## T2-E008 — Catalyst-primed Striker reaches the Plains Tier-2 boss

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Run** | `striker-t2-mid-intended-2026-09-02T01-19-10Z-d0f8e5ea` |
| **Template** | `striker-t1-t2-entry-catalyst-primed` |
| **Config** | reward multiplier **100×**, `maxRunMs` 545,000 |
| **Control** | T2-E006 (`clean`), same route, same multiplier. |
| **Variable** | Catalyst carryover only. |
| **Result** | Plains leg finished in **~35 seconds** (vs ~300s in T2-E006), then three attempts at the Plains Tier-2 boss. **Two deaths, boss left at 91.7% HP both times.** |
| **Death detail** | Killer `gorging-razortusk` (the Plains T2 boss, `isBoss: true`): largest hit **61** into a **183 HP** pool — three hits to kill. Both deaths were identical, the killing blow a 1-damage Field Hare tick at 26 HP. |
| **Interpretation — READ CAREFULLY** | This is **one class, one branch, one node, non-canonical, from a synthetic template**, and the character was fighting the Plains Tier-2 boss with **Tier-1 weapon** (`chaotic-axe` +5) plus Plains Tier-2 armour, because the control route fights each boss at the end of its own leg. It is a data point about the control route's shape as much as about the boss. |
| **What it is NOT** | Evidence that the Plains T2 boss is overtuned. A 61-into-183 ratio is *consistent* with the designer's report that Tier-2 numbers are out, but one build with a tier-behind weapon cannot distinguish "boss too strong" from "route fights it too early" from "the +5 evolution gate left this build without a Tier-2 weapon". |
| **Classification** | Ambiguous — preserved as evidence, deliberately not resolved. |
| **Confidence** | Low as balance evidence; high as a description of what happened. |
| **Next** | Run the same boss from a build that already holds a Tier-2 weapon, and separately with the boss step moved to the end of the tier. Two arms, one variable each. |

---

## T2-E009 — Five-class smoke batch (terminated early)

| | |
|---|---|
| **Date** | 2026-09-02 |
| **Batch** | `bot/runs/t2-smoke-2026-09-02/batch-2026-09-02T00-50-44-725Z` |
| **Config** | Striker / Squire / Apprentice / Slinger / Spirit, `-mid` branch, `clean`, 100×, uncontrolled parallel |
| **Result** | **Terminated by the environment at ~2 minutes**, before any run reached a boss. All five templates validated live (212–221 checks each, 0 errors) and four of five had already evolved `plains-vest-t2`. |
| **Secondary finding** | Uncontrolled parallel put **all five bots in the same node** (`node-t2-plains-04`, 4 other players present, `contention` events recorded). Fine for a pipeline check, useless as comparative evidence. A real batch needs `--executionMode=isolated-parallel` area leases, which the controlled path currently restricts to the Tier-1 registry. |
| **Classification** | Infrastructure/environment, not game. |
| **Confidence** | High. |
| **Next** | Extend the controlled-batch registry to admit the Tier-2 routes so leased isolation is available, then re-run to completion. |

---

## Open hypotheses, not yet tested

| Id | Hypothesis | Why it matters |
|---|---|---|
| T2-H01 | `ruinous-axe` is universally dominant. 43 atk × 1.20 aps = 51.6 naive DPS (38.7 after its dead swing) vs 25.9 for the next best. | If true, five of the seven Tier-2 weapons are decoration. |
| T2-H02 | `knight-steelsword` (18 atk @ 1.0 aps) is worse than the Tier-1 weapon every route already ends on. All six class plans skip it. | The tier's opening weapon may be dead on arrival. |
| T2-H03 | Desert mobility boots (58 speed, `mobility.kite-speed-pct`) are an extreme effective-defence multiplier against melee-heavy Cave. | The brief's highest-value single equipment experiment. Needs mid-tier checkpoints. |
| T2-H04 | Conduit prefers slow high-attack weapons. Derived from code: minion DPS ∝ `owner.attack × owner.APS` (speed-neutral), with flat plating breaking the tie toward slow, and `onHitDamage` not inherited at all. | Determines whether Mountain or Cave is Conduit's biome. Not yet measured in play. |
| T2-H05 | Mountain and Jungle armour have no natural adopter. | Currently 1/6 and 0/6 in the plans; the runs have not tested it. |
| T2-H06 | The `+5` evolution gate, not Tier-2 costs, is what makes Tier-2 gear expensive. | 22 of 50 acquisitions pay ~3.5× because of a Tier-1 upgrade shortfall. |
