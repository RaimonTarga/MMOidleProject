# Tier-2 bossless progression campaign — audit & plan

**Date:** 2026-09-03 (decisions taken 2026-09-04) · **Status:** PLAN for the campaign; the locked T2 reward redistribution is now implemented in source · **Type:** read-only audit + campaign design

**Campaign question:** *can every class progress through ordinary Tier-2 content,
and are any Tier-2 zones significantly over- or under-tuned?*

Tier-2 **bosses are out of scope and treated as invalid evidence** — they are
being reworked separately. Nothing in this plan may conclude anything from a
boss outcome.

Companion docs: `docs/t2-bot-testing-infrastructure.md` (living truth for the
platform), `reports/t2-experiment-ledger.md` (runs to date). This brief supersedes
their "recommended next campaign" section, which assumed a boss-bearing route.

---

## 1. Current Tier-2 bot readiness

| Area | Status | Note |
|---|---|---|
| T2 entry templates (6 classes x 3 economy modes) | **ready** | 18/18 validate offline; derived from the canonical T1 routes, not hand-authored |
| Template validation (offline + live spawn) | **ready** | ~120 + ~90 checks, aborts the run on failure. 5/6 classes proven live; **Conduit unexercised** (needs `CONDUIT_ENABLED`) |
| Class-specific routes | **usable but unsuitable as-is** | 18 routes exist, but every leg ends in `attemptBoss` and completion is `playerTierAtLeast: 3`. Boss-dependent by construction |
| Biome progression order | **ready** | Plains → Forest → Swamp → Mountain → Cave → Jungle → Desert, pinned by semantic test |
| Gear acquisition / craft / evolve / reconstruct | **ready** | `t2Acquisition.ts` resolves per item per class; `unequip` step exists for the cheap evolve path |
| Upgrade behaviour | **ready** | all `opportunistic`, correct given the GM-driven ceiling (+0 until GM 42, +5 at GM 72) |
| Abilities | **ready but deliberately thin** | biome encounter-shape policy (Sweep vs Expose Weakness, Cleanse in Swamp). Only one class learns a T2 ability |
| Runes | **ready** | T1 endgame loadouts carried forward unchanged; targeting-preference regression fixed and covered |
| Stances | **ready** | `t2Loadouts.ts` puts both introductory stances in the Plains L7 baseline; the specialized stances remain content rewards in their authored biomes |
| Cores | **ready** | Tempered (Cave L12) → Force (Desert L6) farm, Survivalist (Jungle L6) for bosses. All three unrestricted, which is forced: a pre-branch character has `selectedRange: null`, so a directional core is inert |
| Skill-tree progression / branch | **missing, and structurally blocked** | see section 7 |
| Combat behaviour / policies | **ready** | policy profiles + autocombat config, shared with the proven T1 harness |
| Resource farming | **ready** | catalyst-aware `t2FarmFor(group, family)`; the "farmed the wrong node forever" bug is fixed and pinned |
| Telemetry | **usable but needs review** | per-biome time/travel/fight/dead/blocked split, kills, deaths, damage, catalysts-by-modifier all exist. TTK, kills/min, adoption timing and disengagement do **not** |
| Reporting | **usable but incomplete** | `bot:t2-report` gives a smoke matrix + adoption. The per-biome response map is not written |
| Controlled / isolated parallel execution | **missing for T2** | the blocker — see section 3, item 3 |
| T2 reports / experiment ledger | **ready** | 5 runs logged (T2-E005…E009), 6 open hypotheses |
| Real T1→T2 handoff snapshots | **ready, better than documented** | fully wired end to end; the infra doc says it isn't built |

---

## 2. What is already finished

Substantially more than `docs/t2-bot-testing-infrastructure.md` claims.

- **Entry templates + two-pass validation.** A run refuses to start rather than
  produce hours of evidence about an impossible character. This is the single
  most valuable thing already built.
- **The acquisition planner.** 50 planned acquisitions resolve to 7 evolve,
  15 unequip-then-evolve, 22 reconstruct, 6 plain craft, **0 unreachable**.
- **Catalyst-aware farming**, after a measured failure (521 of 540 s blocked on
  2 alacrity while parked in a node that mints a different family).
- **Loadout policy** (`t2Loadouts.ts`, currently untracked): per-biome ability
  pair, stance and core, held identical across classes. The infra doc predates it.
- **Isolated-parallel machinery**: `AreaLeaseManager` + `RouteLeaseSession`, with
  contamination detection, productive-wait accounting and a recorded node mix.
  Real and tested — just not reachable from a T2 batch (section 3).
- **Tooling**: `bot:t2-{catalogue,templates,validate,routes,reachability,report,catalyst-demand,payable,plan}`.
- **The T1→T2 snapshot handoff, complete.** `T1SnapshotStore` writes
  `snapshot-a.json` (all-biomes-maxed) and `snapshot-b.json` (tier-2 handoff);
  `tierEntryProfileFromT1Snapshot` converts B into an entry profile;
  `--tierEntrySnapshot=<path>` loads it in `botRun`, mutually exclusive with
  `--tierEntry` with a clear error. **Nothing needs building for a single-run
  real-snapshot start.** Section 8 covers the batch-level gap.

---

## 3. What is missing

1. **A bossless route family.** All 18 routes end each leg with `attemptBoss` and
   complete on `playerTierAtLeast: 3` (three T2 seals). Under this campaign's
   constraint that condition can never legitimately fire, so every run would
   terminate `stalled`.
2. **A boss-free terminal condition.** `--winCondition` accepts only
   `full-gauntlet` and `next-tier`; neither is right here.
3. **Lease isolation for T2 — the highest-value gap.** `batch.ts` builds an
   `AreaLeaseManager` only when `controlled && executionMode === "isolated-parallel"`,
   and the controlled path rejects any route id not in `T1_CONTROLLED_ROUTE_IDS`.
   T2 batches are therefore forced to `--controlled=false`, which is either
   sequential (one bot at a time) or legacy uncontrolled parallel. T2-E009
   measured the consequence: five bots in one node, comparative evidence void.
4. **The Tier-2 response map.** Per-biome x per-class aggregation. The events
   carry the data; the aggregation is unwritten.
5. **Four metrics the campaign asks for**: ordinary-monster TTK, kills/min,
   gear-adoption *timing*, and retreat/disengagement counts.
6. **Per-route snapshot resolution in batches.** `--tierEntrySnapshot` passes
   through `batch.ts` via arg spread, but it is a single path — and a snapshot is
   class-specific. A six-class batch needs a directory-and-resolve form, exactly
   as `--entryEconomy` solved for templates.
7. **Conduit never validated live.**
8. **Mid-tier checkpoints**, and any way to synthesize a branched character
   (section 7).

---

## 4. Problems and stale assumptions found

**Docs vs code.** `docs/t2-bot-testing-infrastructure.md` is one day old and
already stale in three places: it says the baseline carries no stance or core
(`t2Loadouts.ts` adds both), and says mid-tier snapshot capture is "not yet
built" (the T1→T2 snapshot path is fully wired). Fix the doc, not the code.

**The route's boss dependence is total, and its only real consequence is the
branch.** Verified in code:

- `requiredBossClear` is declared in the recipe type and used by **zero** recipes.
- There is no travel or node-access gate anywhere — the grid is open.
- `biomeLevelCap(playerTier, group)` reads `playerTier` only.

So boss clears gate **exactly one thing inside Tier 2**: seals → `playerTier` 3 →
one skill point → the range branch. Every biome, every recipe, every level cap
and every upgrade in the tier is reachable bossless. *This is what makes the
recommended campaign possible.*

**Weapon-arrival leg is an uncontrolled confound, and it is large.** Under the
current gear plans, the leg at which each class first wears a Tier-2 weapon is:
Slinger and Spirit leg 2, Apprentice leg 3, Squire leg 4, **Striker and Conduit
leg 5**. Striker and Conduit therefore fight nearly two-thirds of the tier on a
Tier-1 weapon. Any per-biome difficulty reading for those two in legs 1–4 is
about the route's shape at least as much as about the biome. T2-E008 is already
an instance of this and was correctly filed as ambiguous.

**The +5 evolution gate dominates gear cost.** `EVOLUTION_REQUIRED_PLUS` moved
3 → 5 on 2026-08-29 and the canonical T1 routes were never updated, so 22 of 50
acquisitions pay ~3.5x reconstruction. Open designer call (section 12).

**Catalysts are the binding constraint and acceleration cannot touch them.** The
dev multiplier deliberately does not scale catalyst progress. Total T2 demand is
99 (alacrity 40, swarming 17, fortified 17, heavy 16, dominion 9) — roughly four
hours of irreducible waiting per full-tier run. This drives the entry-state
recommendation in section 10.

**`natural` entry is an unmeasured model** and must stop being used the moment
real snapshots exist. `catalyst-primed` is never admissible economy evidence.

**Suspected balance, recorded not acted on:** `ruinous-axe` at roughly twice the
naive DPS of anything else in the tier; `knight-steelsword` below the T1 weapon
every route ends on, and skipped by 6/6 plans.

---

## 5. Six-class route/setup review

Shared across all six (deliberate controls, not per-class choices): biome order;
encounter-shape ability policy (Sweep on Plains/Forest/Jungle, Expose Weakness
elsewhere; Cleanse in Swamp, Second Wind otherwise); stance policy (offensive on
crowd biomes from Plains, defensive on single-target biomes and bosses from
Plains); core policy (Tempered from Cave, Force from Desert, Survivalist for
bosses from Jungle); T1 endgame rune loadout carried forward unchanged; Plains vest + charm +
boots adopted 6/6; `knight-steelsword` skipped 6/6.

| Class | T1 carryover | Weapon path (first T2 weapon) | Armour / charm / boots | Ability | Rune profile | Expected weakness | Deliberate skips |
|---|---|---|---|---|---|---|---|
| **Striker** (cadence-balanced) | full T1 kit, `chaotic-axe` +5 | gale-needle (Forest, **leg 2**) → ruinous-axe (Cave) | Plains kit → cave-vest; mountain-vest craft-only | none learned | melee-chase | Cave-dependent; 4 legs before its real weapon | forest/swamp/jungle/desert vests, thorn-needle, quake-hammer, mirebrand, sunsteel |
| **Squire** (cooldown-heavy) | full T1 kit | quake-hammer (Mountain, **leg 4**) | Plains kit → mountain-vest; swamp-charm | none | melee-chase | 3 legs on a T1 weapon; the only class Mountain is built for | gale-needle, forest/cave/desert vests, mirebrand |
| **Apprentice** (dot-balanced) | full T1 kit | swamp-mirebrand (**leg 3**) | Plains kit → swamp-vest | **learns bramble-guard (Jungle)** — the only class that does | ranged-orbit | slowest killer; weakest AoE; Jungle/Desert predicted to offer nothing | gale/thorn needle, mountain/cave/desert vests, sunsteel |
| **Slinger** (reload-heavy) | full T1 kit | gale-needle (**leg 2**) → jungle-stinger-rapier (leg 6) | Plains kit → forest-vest; desert-boots | none | ranged-orbit | 9-attack weapon for four legs; thorn-needle skip is a **payability artifact, not a design call** | thorn-needle, swamp/mountain vests, quake-hammer, sunsteel |
| **Spirit** (energy-heavy) | full T1 kit | gale-needle (**leg 2**) → ruinous-axe (Cave) | Plains kit → cave-vest; mountain-charm | none | ranged-orbit | Barrier/recharge nerf unrebalanced upstream; wants hit frequency but takes the slow axe at Cave | mirebrand, mountain-vest, jungle/desert gear |
| **Conduit** (summoner-balanced) | full T1 kit | ruinous-axe (Cave, **leg 5**) | Plains kit → cave-vest; desert-boots | none | ranged-orbit | latest weapon of any class, and its *entire* damage is weapon-derived through minions; never validated live | quake-hammer (held as the paired probe), jungle rapier, sunsteel |

### Are these plausible player builds?

Mostly yes. Each carries an argued hypothesis and every deviation is a recorded
skip, which is the right shape. Six flags:

1. **`knight-steelsword` is skipped 6/6.** The tier's opening weapon is untested
   by construction. If the skip reasoning is wrong we will not find out.
2. **Three armours have no adopter at all** (jungle, desert; mountain has only
   Squire). Their tuning is untestable by this cohort.
3. **Ability adoption is asymmetric.** Apprentice alone learns a T2 ability, so
   its Jungle/Desert legs move two variables at once.
4. **Slinger's thorn-needle skip is an ordering artifact** — reconstruction needs
   purple, first minted one leg later. Correctly flagged in code, but it means
   Slinger's Forest arm is weaker than its author intended. Do not read it as a
   design judgement.
5. **Conduit's plan contradicts its own code-derived answer.** Minion DPS is
   proportional to `owner.attack x owner.APS` (speed-neutral), with flat plating
   and non-inherited `onHitDamage` both breaking the tie toward slow+heavy — i.e.
   `quake-hammer`. The plan takes `ruinous-axe` and holds the hammer as a probe.
   Defensible as measurement, but the probe is not in the cohort, so the campaign
   will not answer it.
6. **Conduit is `ranged-orbit`.** A formation class arguably should not be
   orbiting inside the engagement at all. Worth one designer look.

None of these are blockers. They are the boundaries of what the first cohort can
conclude, and section 11 encodes them as interpretation rules.

---

## 6. Recommended bossless campaign architecture

**Recommendation: bossless progression routes, run start-to-finish, terminated on
biome mastery rather than on seals. No synthetic seal advancement, no separate
early/late snapshots, no biome probes in the first cohort.**

One new route family, `<class>-t2-progression`, identical to today's `-mid`
routes except:

- **every `attemptBoss` step removed**, and the `ifPossible` branch step removed;
- **completion becomes `globalMasteryAtLeast: 72`** — every one of the seven
  biomes at its playerTier-2 cap. It is already in the condition vocabulary and
  already an authored milestone, it is boss-independent, and it is the same
  condition that governs whether Tier-2 gear can reach +5;
- boss-specific loadout steps (`bossLoadoutSteps`, the Survivalist swaps) removed
  with the boss steps, so each leg is fought in one stated kit;
- everything else — biome order, gear plans, stance/core policy, rune loadout,
  opportunistic upgrades, catalyst-aware farming — held **identical** to the
  current control route, so this cohort stays comparable to T2-E005…E009.

**Why this and not the alternatives.**

- *Synthetic seal/tier advancement between legs* would set `playerTier` 3, which
  raises `biomeLevelCap` for every biome and changes the upgrade ceiling. It does
  not just skip the bosses — it changes the content the run is measuring.
  Rejected.
- *Separate early-T2 and late-T2 snapshots* costs a second entry mechanism and,
  as section 7 shows, cannot legitimately produce the late state anyway. Rejected
  for the first cohort; revisit once section 7's server change exists.
- *Per-biome probes* destroy exactly what the campaign asks for — "can it reach
  that biome using a plausible progression state" and "how long does ordinary
  progression take". Probes are the right instrument for the *equipment*
  experiments that come after. Rejected here.
- *Keep the boss steps and just exclude boss stats from analysis* is the worst
  option: boss deaths still cost run time, still bank deaths against the biome,
  and still leave the character resource-drained afterwards. Boss balance would
  contaminate the progression signal through the back door. Rejected.

Because nothing in Tier 2 gates on a boss clear (section 4), this cohort loses
**no** content coverage. It loses only the branch, and section 7 argues the
branch was never part of ordinary Tier-2 content in the first place.

---

## 7. Pre-branch vs post-branch

**The pre-branch state is not a compromise. It is the real state for the whole of
ordinary Tier-2 content.**

A skill point is minted by a tier advance and nothing else, and `canUnlockSkill`
requires `node.tier === currentSkillTier`, so the affordable skill tier is always
`playerTier - 1`. The tier-2 range node is bought with the point granted by
reaching **playerTier 3** — i.e. on the way *out* of Tier 2. A character playing
Tier 2 legitimately has root + frame and `selectedRange: null` for the entire
tier. (`design_docs/player-power-curve.md` and `game-overview.md` say root +
frame + range; both are wrong and are already logged as doc bugs.)

Therefore **early *and* late Tier 2 are both correctly tested pre-branch.** There
is no invalid assumption to route around, and the campaign needs no synthetic
branch at all.

**The branch is a Tier-3-entry concern**, and testing it is currently blocked:

- `TierEntryProfile` has no `unlockedSkills` or `selectedRange` field, and
  `applyTierEntryProfile` hardcodes `unlockedSkills = [root.id, frame.id]` and
  `selectedRange = null`.
- `validateSpawn` asserts `selectedRange === null` unconditionally.
- The server also requires `spawnNodeId` to be a sanctuary of exactly
  `targetTier`, so mid-tier spawns are blocked too.
- The snapshot converter rejects any snapshot whose `unlockedSkills` is not
  exactly `[root, frame]`.

So the only way to obtain a branched character today is to kill three Tier-2
bosses for real — which would smuggle invalid boss balance into the experiment.
**Do not do that.** Instead, when a branch/late-tier campaign is actually wanted,
make one small additive dev-only server change: an optional `unlockedSkills` (or
`selectedRange`) on `TierEntryProfile`, validated against `SKILL_TREE` parentage
and the tier's own point budget, with the matching relaxation in `validateSpawn`.
That is out of scope here and should be scheduled as its own task.

**Synthetic vs real, explicitly:**

| | Source |
|---|---|
| Class root, frame, gear, upgrade levels, abilities, runes, biome levels, wallet | **real** — from the T1 handoff snapshot |
| Position at the T2 sanctuary, cleared combat state, full HP | synthetic (unavoidable, and validated) |
| Everything gained during Tier 2 | **real** — earned in play |
| Seals / `playerTier` 3 / the range branch | **neither** — deliberately never reached |

---

## 8. How real Tier-1 handoff snapshots plug in

The mechanism exists. Do not rebuild it.

`botRun` already accepts `--tierEntrySnapshot=<path>`, reads it with
`readT1CharacterSnapshot`, converts with `tierEntryProfileFromT1Snapshot`, applies
it through `debug:applyTierEntryProfile`, and then runs the same offline + live
validation as a template. Snapshot B (`tier2-handoff`) is captured automatically
when a T1 run's own completion condition holds.

**What they replace.** The `natural` entry-economy model should be **retired as
evidence** the moment real snapshots land — it is an unmeasured guess. Real
snapshots also replace four template assumptions with measurement: the wallet;
the `bossesCleared` list; **`itemUpgrades` — the +5 shortfall that drives 22 of
50 acquisitions into ~3.5x reconstruction becomes measured rather than argued**;
and the `clearing: 4` legality fudge. Keep `clean` as the zero-carryover control
and `catalyst-primed` as the progression-integrity instrument; both are still
useful, and both remain inadmissible as economy evidence.

**Is one snapshot per class enough? No — preserve at least three replicates per
class.** The wallet is the high-variance field by construction: a T1-completing
character has nothing left to buy, so it accumulates freely through the boss
gauntlet and arrives with whatever that gauntlet's length happened to bank. That
variance *is* the quantity `clean` vs `natural` was invented to bracket. Use the
**median-wallet snapshot per class** as the primary entry state and keep the
others for a later sensitivity check. Everything else in the snapshot (gear,
upgrades, abilities, runes, biome levels) should be near-identical across
replicates of one route — **if it is not, that is a finding about T1 route
determinism and should be reported before the T2 cohort launches.**

**Exact fields the T2 loader needs** — these are the converter's own hard
preconditions, and a snapshot violating any of them is unusable:

- `schemaVersion === 1`, `snapshotKind === "tier2-handoff"`;
- `state.playerTier >= 2` and `currentSkillTier === playerTier`;
- **`state.skillPoints === 0`** — an unspent point makes the snapshot unusable;
- **`state.unlockedSkills` exactly `[classRoot, frameId]`**;
- `state.activeStance === state.equippedStances.default`;
- `state.runesOwned` exactly derivable from `state.runeRecipesCrafted`;
- no duplicates in inventory, knownAbilities, runeRecipesCrafted, knownStances,
  knownRites, bossesCleared, clearedNodes, visitedNodes;
- carried through: `essences`, `catalysts`, `catalystProgress`, `level`,
  `biomeLevel`, `biomeXP`, `bossesCleared`, `clearedNodes`, `visitedNodes`,
  `questProgress`, `inventory`, `equipment`, `itemUpgrades`, `knownAbilities`,
  `equippedAbilities`, `runeRecipesCrafted`, `runesEquipped`, `knownStances`,
  `equippedStances`, `knownRites`, `equippedRites`.

**Two things to tell the T1 agent now, while the cohort is still running:**

1. **Snapshot B is only written when the T1 run's completion condition actually
   holds.** A run that stalls, times out or is killed produces no handoff state.
   If a class's run ends any other way, that class has no real entry state and
   the T2 cohort falls back to its `clean` template for that class alone.
2. **`canonicalAtCapture` is true only when the run had zero taints *and* a 1x
   reward multiplier.** If the cohort runs accelerated, the snapshot wallets are
   inflated and are **not** economy evidence — the gear, upgrade levels, ability
   and rune state remain fully usable, and those are the fields that matter most
   here. Record which it is; it changes what section 11 permits.

---

## 9. Minimal implementation work required, in order

Each item is small and independent unless noted. Items 0a and 0b come from the
designer decisions in section 12 and **both require a server restart, so neither
may be applied while the Tier-1 cohort is running.**

0a. **Lower `EVOLUTION_REQUIRED_PLUS` from 5 back to 3** (decision 1). Then
    **re-run `bot:t2-reachability`** and re-baseline the acquisition figures
    quoted throughout this brief — the 7/15/22/6 split will move substantially,
    and hypothesis T2-H06 in the ledger is invalidated as written.

0b. **Narrow `focus-elites` to the engaged set** in
    `server/src/systems/combat/ai/targetPriority.ts` (decision 5), mirroring the
    HP-preference fix: while anything is engaged, choose from the engaged set;
    with nothing engaged, fall through to ordinary acquisition. Add the
    regression case alongside `runeTargetingPreference.test.ts`, and note that
    `eliteTargeting.test.ts` currently pins the *opposite* behaviour on purpose —
    it must be updated, not worked around. This changes automation quality, so it
    lands before the cohort and partially breaks comparability with
    T2-E005…E009.

Then, in order:

1. **Admit the T2 progression routes to the controlled batch registry**
   (`bot/src/routes/index.ts`, `bot/src/batch.ts`). This is the single
   highest-value change: it is what makes `--executionMode=isolated-parallel`
   and area leases available, without which no cross-class comparison is valid.
   Keep the controlled invariants (`--policies=intended`, `--count=1`) or
   consciously widen them for replicates.
2. **Add the bossless route family** — a `bossless` option on `makeT2Route`, or a
   sibling builder, emitting six `<class>-t2-progression` routes with
   `attemptBoss`, the branch step and the boss loadout steps omitted, and
   `completion: { type: "globalMasteryAtLeast", value: 72 }`. Update
   `t2Routes.semantic.test.ts`: it currently asserts every route gates its branch
   behind `ifPossible`, which the new family will not have.
3. **Per-route snapshot resolution for batches** — a `--tierEntrySnapshotDir`
   that resolves a snapshot per route by `classRoot`, mirroring how
   `--entryEconomy` resolves a template. Today `--tierEntrySnapshot` is a single
   path, and a snapshot is class-specific.
4. **Response-map aggregation in `bot:t2-report`** — biome x class, emitting per
   leg: dwell, travel/fight/dead/`blockedOnResourceMs` split, kills, kills/min,
   `fightMs / kills` as the TTK proxy, deaths, damage taken, upgrades, node
   modifier mix. All of this already exists in `summary.biomes`; this is pure
   aggregation plus a printer.
5. **Four missing metrics.** Kills/min and the TTK proxy come free with item 4.
   Gear-adoption *timing* needs the equip/skip milestones read with their
   existing `atMs` rather than as a set. Disengagement needs a small recorder
   addition (count `step-back` / retreat rune activations and target drops per
   biome) — the only item here that touches the recorder.
6. **Validate Conduit live** with `CONDUIT_ENABLED` before the cohort launches —
   it is the one class whose entry template has never been server-verified, and
   it is also the class with the latest weapon arrival.
7. **Fix the three stale claims** in `docs/t2-bot-testing-infrastructure.md`
   (stance + core in the baseline; snapshot capture already built).

Explicitly **not** required for this campaign: mid-tier checkpoint capture, T3
entry templates, and any server change for branched characters (section 7).

---

## 10. The first Tier-2 experiment

**Cohort:** six bossless progression routes — `striker`, `squire`, `apprentice`,
`slinger`, `spirit`, `conduit` — **x 2 replicates, plus one Conduit
`quake-hammer` probe = 13 runs**.

Two replicates, not one and not three: one gives no within-class variance and
makes the "isolated extreme replicate" rule in section 11 unenforceable; three
triples machine time for a second-order question. Two detects gross divergence,
which is all the first cohort needs.

**The Conduit probe varies the weapon and nothing else** — same `ranged-orbit`
profile, same gear plan otherwise, `quake-hammer` adopted at Mountain (leg 4)
instead of `ruinous-axe` at Cave (leg 5). It tests the code-derived prediction
that minion DPS is speed-neutral and flat plating breaks the tie toward
slow+heavy. Because it also moves Conduit's weapon arrival one leg earlier, read
it against the Conduit baseline only, never against other classes.

**Run shape:** full progression, start to finish, no probes. Terminal condition
`globalMastery >= 72`.

**Entry state:** the **median-wallet real T1 handoff snapshot per class**. Any
class without a usable snapshot B falls back to its `clean` template, and that
substitution is recorded per run and stated in every table it appears in — a
`clean` run and a snapshot run are not the same arm.

**Reward multiplier: 25x, matching the controlled T1 convention.** Reasoning:
catalysts do not scale, so the roughly four-hour catalyst floor is unchanged
either way, and the real snapshots carry real T1 catalysts into the run — which
is precisely the acceleration that matters. 25x removes the essence grind, which
is the part acceleration *can* help. Consequence, stated up front: this cohort
answers **progression integrity, combat sanity and relative biome difficulty**,
and says **nothing** about absolute economy pacing. If absolute pacing is wanted,
run one canonical 1x replicate afterwards, and only for classes the accelerated
cohort shows can finish.

**Isolation:** `--executionMode=isolated-parallel`, `--maxConcurrency=6`, after
implementation item 1. Check `coordination.contaminated`, `contaminatingOverlaps`
and `productiveWaitMs` on every run before reading any comparison; a contaminated
run is not evidence.

**Boss statistics:** absent by construction. `bosses.attempts` should be 0 in
every summary — if it is not, the route family is wrong and the run is void.

**What each biome leg must report:** time spent, travel/fight/dead/resource-blocked
split, kills, kills/min, TTK proxy, deaths and their dominant source, damage
taken, downtime/recovery, disengagements, upgrades completed, gear adopted and
when, resource-blocked time, node modifier mix, stalls.

---

## 11. Metrics and interpretation rules

Read the **response map first, one metric at a time, before forming any
hypothesis about a specific number.**

| Pattern | Conclusion |
|---|---|
| Same biome degraded for **4 or more of 6 classes** | likely biome/monster tuning. Sufficient to recommend a global change |
| Same biome degraded for **2–3 classes** | investigate as a matchup; not sufficient for a global change |
| One class degraded across **4 or more biomes** | class, build, or route problem — **not** monster tuning |
| One class degraded in **exactly one biome** | matchup or build interaction. Check its weapon-arrival leg first |
| Healthy combat (TTK, deaths, damage taken normal) but long biome dwell | economy/acquisition, not combat. Read `blockedOnResourceMs` and `catalystsByModifier` before touching a monster |
| High `blockedOnResourceMs` with a full essence wallet | catalyst supply or node-modifier exposure, not difficulty |
| Repeated bad tactical choice (walks into hazards, drops target, fails to disengage) | automation defect. File against the harness, never against balance |
| One replicate extreme, its twin normal | investigate the individual run before tuning anything |
| Any biome where `bosses.attempts > 0` | the run is void for this campaign |

**Mandatory confound checks before any tuning recommendation:**

1. **Weapon-arrival leg.** Striker and Conduit fight legs 1–4 on a Tier-1 weapon.
   Difficulty in Plains/Forest/Swamp/Mountain for those two is confounded and may
   not be attributed to the biome without corroboration from a class that already
   holds a T2 weapon there.
2. **Jungle and Desert cap at level 6, not 12** — they first appear in Tier 2. A
   "maxed" Desert is not the same relative power state as a maxed Plains, and
   their dwell times are not directly comparable to the carryover biomes.
3. **Node modifier mix.** Modifiers change monster stats, and node choice under
   isolated-parallel is schedule-dependent. Compare `coordination.nodeMix` before
   comparing two runs.
4. **Lease productive waits.** Time spent fighting in an exclusively-owned node
   while waiting banks essence and XP a sequential run would not have yet.
5. **Snapshot vs `clean` entry.** Never pool the two in one row.
6. **Upstream unrebalanced systems.** Barrier/Ward recharge and Recovery were
   reworked and deliberately not rebalanced; Spirit is the most exposed. A Spirit
   result is provisional until that is settled.

**Evidence bar for a global monster change:** 4 or more of 6 classes degraded in
the same biome, across both replicates, with no contamination taint, no confound
above unresolved, and boss statistics absent. Anything less is a hypothesis for
the ledger, not a tuning instruction.

---

## 12. Decisions taken — designer, 2026-09-04

All eight open decisions are resolved. Two of them are code/data changes that
**must not be applied while the Tier-1 cohort is running** (both need a server
restart); both are listed as pre-cohort implementation work in section 9.

| # | Decision | Consequence |
|---|---|---|
| 1 | **Lower `EVOLUTION_REQUIRED_PLUS` back to 3** | The in-flight T1 snapshots stay valid — the gate is evaluated at T2 time, not at capture. But the acquisition table is reshuffled: many of the 22 reconstructions become cheap evolves. **Re-run `bot:t2-reachability` before the cohort launches** and re-baseline the cost figures in this brief. Also invalidates the T2-H06 hypothesis as written. Requires a restart — defer until T1 finishes |
| 2 | **25x reward multiplier**, matching the T1 convention | Cohort answers progression integrity, combat sanity and relative biome difficulty. **Not** absolute economy pacing; every table must say so |
| 3 | **Terminal condition: `globalMastery >= 72`** | All seven biomes at their playerTier-2 cap. Measures the tier as authored, and reaches the +5 upgrade ceiling. Longest run shape |
| 4 | **One extra arm only: the Conduit `quake-hammer` probe** | `knight-steelsword` and the orphan armours (jungle, desert, mountain) stay untested — a recorded, deliberate gap for a later targeted equipment campaign. Cohort is 6 routes x 2 replicates + 1 probe = **13 runs** |
| 5 | **Narrow `focus-elites` to the engaged set**, like the HP-preference modes | Makes targeting consistent: preference never becomes acquisition. Server change to `targetPriority.ts` plus a regression test. It changes automation quality, so it must land **before** the cohort, and it partially breaks comparability with T2-E005…E009. Requires a restart — defer until T1 finishes |
| 6 | **Schedule the branch-entry API separately, after this cohort** | Optional `unlockedSkills` / `selectedRange` on `TierEntryProfile` plus the `validateSpawn` relaxation. Not on this campaign's critical path; unblocks late-T2 and T3-entry work later |
| 7 | **Conduit stand-back — already satisfied by `ranged-orbit`; no change needed** | See below |
| 8 | **A class with no usable snapshot B falls back to its `clean` template**, recorded per run | Cohort stays at six classes so the 4-of-6 evidence bar keeps meaning. A `clean` run and a snapshot run are never pooled in one row |

### On decision 7 — the premise was wrong, in our favour

The intent was "a formation class should not be orbiting inside the engagement".
Reading `autoTarget.ts`, `orbit` (keep-distance) already **is** a stand-back
behaviour: it computes a standoff gap beyond the target's own reach
(`mobReach + RANGED_SAFE_BUFFER`, clamped to 92% of attack range), holds there
with `stopEntity` to fire, and repositions on a ring only when it drifts out of
the hold window. It is not circle-strafing in melee.

The alternative is strictly worse. There is no `hold-position` action in the
MOVEMENT channel — it holds only `chase-enemy`, `flee`, `orbit`, `step-back` and
`follow-and-assist` — and **`chase-enemy` and "no movement rule at all" derive
to the same state** (both fall through `default`). Since the comment at
`autoTarget.ts:745` records that *"kiting is no longer automatic for ranged
players"*, dropping the orbit rule would make Conduit close to melee, not stand
back. A genuine stand-back profile would require a **new rune action plus its AI
consumer** — a feature, not a route edit.

**Conclusion: keep `ranged-orbit` for Conduit.** It already delivers the intended
behaviour, it costs nothing, and it keeps the movement profile constant across
all four ranged classes so Conduit's results stay comparable. If the runs show
Conduit taking damage it should not, that surfaces as a class-wide automation
finding with the standoff maths above as the place to look.
