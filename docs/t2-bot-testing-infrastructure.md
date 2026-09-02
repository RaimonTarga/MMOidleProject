# Tier-2 Bot Testing Infrastructure — current state

**Status:** LIVE as of 2026-09-02. This is the living truth for the Tier-2 bot
testing platform. Where this doc and the code disagree, the code wins — fix the
doc.

**Purpose in one line:** *do not optimize the game's balance; optimize our
ability to measure it.*

This describes what a Tier-2 balance campaign can now do without first building
infrastructure, what it must not conclude from which kind of run, and the
findings the build-out turned up along the way.

---

## 1. The structural finding that reshapes the campaign

> **There are six legal Tier-2 entry templates, not eighteen. The branch is
> bought on the way OUT of Tier 2, not on the way in.**

A skill point is minted by a TIER advance and by nothing else (`advanceTier`,
`server/src/systems/player/progression/questSystem.ts`), and `canUnlockSkill`
requires `node.tier === currentSkillTier`. Together those mean the skill-tree
tier a character can afford is always `playerTier - 1`:

| player tier | how it is reached | what the point buys |
|---|---|---|
| 1 | tier-0 kill quest | tier-0 class **root** |
| 2 | 2 Tier-1 seals | tier-1 **frame** (light/balanced/heavy) |
| 3 | 3 Tier-2 seals | tier-2 **range node** (close/mid/far) — *the branch* |

`server/bench/balance/progression.ts` agrees:
`maxSkillTreeTierForContent(contentTier) = contentTier - 1`.
`design_docs/player-power-curve.md` and `design_docs/game-overview.md` describe
the "T2 snapshot" as root + frame + range, which contradicts both. **The code
wins**; the design docs are stale on this point and are listed under Known
Issues.

### What that means for an 18-build campaign

The 6 × 3 matrix is still real and still worth running — it just does not
partition Tier 2 the way the plan assumed:

- **Legs 1–3 (Plains, Forest, Swamp)** are byte-identical across a class's three
  branch variants. That is a genuine shared control period, not wasted work.
- **The branch fires after the third boss step**, which is the earliest moment
  three seals can exist.
- **Legs 4–7 (Mountain, Cave, Jungle, Desert)** are where the branch can
  actually differ — and per the designer, the half where builds are expected to
  wall. So the branch matters exactly where the campaign is looking.
- **A run that never clears three Tier-2 bosses never buys its branch.** That is
  recorded as a skipped conditional, not a stall (see `ifPossible` below), so
  the run still reports where it was walled.

`t2Routes.semantic.test.ts` pins that a class's three variants differ in the
range node and nothing else.

---

## 2. What was built

| Piece | Where | What it does |
|---|---|---|
| Entry-economy models | `bot/src/tierEntry/economy.ts` | `clean` (zero carryover), `natural` (documented conservative model), `catalyst-primed` (progression-integrity instrument) |
| Entry templates | `bot/src/tierEntry/profiles.ts` | 6 classes × 3 economy modes = 18 templates, derived from the canonical T1 routes |
| Template validation | `bot/src/tierEntry/validate.ts` | offline legality + live spawn agreement; run refuses to start on failure |
| Acquisition planner | `bot/src/routes/t2Acquisition.ts` | resolves craft / evolve / evolve-after-unequip / reconstruct per item, per class |
| Control route builder | `bot/src/routes/t2RouteBuilder.ts` | 18 branch routes over one fixed biome order |
| Class gear plans | `bot/src/routes/t2GearPlans.ts` | per-class adopt / craft-only / skip, each an argued hypothesis |
| `ifPossible` step | `bot/src/route/types.ts` | run steps only if a condition holds now; never waits, never stalls |
| `unequip` step | `bot/src/route/types.ts` | empties a slot — required to reach the cheap evolve path |
| Reporting | `bot/src/tools/t2Report.ts` | smoke matrix + gear adoption report from raw `events.jsonl` |
| Catalogue / reachability tools | `bot/src/tools/` | live T2 item data and per-template obtainability |
| Rune regression | `server/test/runeTargetingPreference.test.ts` | acquisition-vs-preference semantics |

### Commands

```bash
pnpm bot:t2-validate       # T2_ENTRY_TEMPLATE_VALIDATION over all 18 templates
pnpm bot:t2-templates      # full template dump + per-template validation report
pnpm bot:t2-catalogue      # live T2 item catalogue in control-route order
pnpm bot:t2-reachability   # which T2 items each template can obtain, and how
pnpm bot:t2-routes         # the 18 routes and every resolved acquisition path
pnpm bot:t2-catalyst-demand # total T2 catalyst demand per family (never accelerated)
pnpm bot:t2-report <dir>   # smoke matrix + gear adoption from a batch directory

# one run
pnpm bot:run --route=striker-t2-mid --policy=intended --entryEconomy=clean

# a multi-class smoke batch (NON-CANONICAL: reward-multiplied)
pnpm bot:batch --controlled=false --parallel=true --policies=intended --count=1 \
  --routes=striker-t2-mid,squire-t2-mid,apprentice-t2-mid,slinger-t2-mid,spirit-t2-mid \
  --entryEconomy=clean --rewardMultiplier=100 --out=bot/runs/<name>
```

`--entryEconomy` exists because a tier-entry template is class-specific: a
batch spanning six classes cannot share one `--tierEntry=<id>`. The runner
resolves the right template from the route's own class root and records the
resolved id in the run header, so the arm stays explicit and reproducible.

---

## 3. The Tier-2 entry template specification

### Derivation

Templates are **derived from the canonical Tier-1 routes**, not hand-authored.
`buildProfile` walks a route's steps and reads off what it crafted, equipped,
upgraded, learned and configured. A change to a T1 route therefore moves the T2
template with it, and a change to static game data makes the template fail
validation rather than silently drift.

### Permanent progression state (deterministic)

| Field | Value | Why |
|---|---|---|
| class root / frame | from the route | the frame is bought at the tier-1→2 advance |
| `playerTier` | 2 | |
| `currentSkillTier` | 2 | the tier it may buy NEXT |
| `skillPoints` | **0** | the T2 point was already spent on the frame |
| `selectedRange` | **null** | no branch — see §1 |
| spawn | `node-t2-sanctuary` | |
| biome levels | 6 in each of the five T1 biomes, **4 in `clearing`** | GM 30 |
| `bossesCleared` | all five `<biome>:1` | the canonical routes clear all five |
| abilities | `sweep`, `second-wind`, `cleanse`, `expose-weakness`; equipped `expose-weakness` + `second-wind` | |
| runes crafted | avoid-hazards, step-back, (+ keep-distance for ranged classes) | |
| stances / rites / cores | **none** | every one gates above the Tier-1 ceiling |
| gear | the route's own final kit and bag, with its real upgrade levels | |

The `clearing: 4` entry was a **defect found by the new validator**: templates
owned the four Clearing starter items while declaring no Clearing mastery, so
they described a character whose own gear was never craftable. The Clearing is
excluded from `globalMastery()`, so adding it changes no rune budget and no
upgrade ceiling — only legality.

### Carryover economic state (a labelled model)

The wallet is the half the game does not determine. A T1-completing character
has nothing left to buy — every T1 item is at +5 and every T2 recipe gates at
biome level 7, above the T1 cap — so it accumulates freely through the boss
gauntlet, and what it arrives with depends entirely on how long that took.

Three arms, byte-identical except for the wallet:

**Clean Entry** — zero essence, zero catalysts. The economy-isolation control.
Every resource a Clean run spends in Tier 2 was earned in Tier 2, so
resource-blocked time and gear-adoption ORDER mean what they say.

**Natural Entry** — ⚠ **UNMEASURED MODEL, not evidence.** Per colour, the
largest single Tier-1 `+5` upgrade step in that colour, read live from
`RECIPE_DATABASE` ("stopped one purchase short"), plus 2 spare catalysts per
family. Today that is red 195 / green 155 / blue 155 / yellow 150 / purple 150 —
about 17% of the 1,164 red a Cave T2 weapon needs to reach +5.

**Catalyst-Primed Entry** — zero essence, plus the full derived Tier-2 catalyst
demand. A **progression-integrity instrument only**, and never admissible economy
evidence: it deletes catalyst supply by construction. See §6.5 for why it had to
exist.

`walletFromT1Run()` replaces the Natural model with measurement as soon as a
canonical T1 run exists; it refuses non-canonical runs, whose closing wallet is a
multiple of the real one.

> **What this replaced.** The first version of the harness gave every template
> **1,500 of every essence and 25 of every catalyst family**. Against live recipe
> data that is not a starting wallet, it is most of a finished tier: 1,500 of a
> colour buys a full T2 weapon at +5 outright, in every colour at once. Any run
> from that wallet can report combat outcomes but cannot report progression
> pacing, gear adoption order, or resource-blocked time.

---

## 4. Template validation

Two passes, both required before a tier-entry run may start.

**Offline** (`validateProfile`) — is the template legal against today's static
game data? ~120 checks per template: frame parentage, the skill-point budget,
sanctuary spawn, mastery within the previous tier's cap, no current-tier boss
clears, no future-tier items, upgrade levels within both the item's own steps
and the Global Mastery ceiling, every owned item's recipe gate-reachable, every
known ability and rune recipe reachable, the loadout inside its RP budget, and
no speculative stance/rite/core content.

**Live** (`validateSpawn`) — did the SERVER build that character? ~90 checks
comparing the template against the authoritative `PlayerView`: class, frame, the
absence of a range node, tier, mastery, the server's own derived recipe unlocks
in both directions, equipment, upgrade levels, abilities, the surviving rune
loadout, the wallet, and no stale combat state (full HP, no buffs, no target,
auto off).

A failure **aborts the run** rather than producing hours of evidence about an
impossible character, and the result is written into the run header as
`templateValidation` so a reader never has to take it on trust.

```
T2_ENTRY_TEMPLATE_VALIDATION[profile]: PASS (profile=striker-t1-t2-entry-clean, 123 checks, 0 errors, 0 warnings)
T2_ENTRY_TEMPLATE_VALIDATION[spawn]:   PASS (profile=striker-t1-t2-entry-clean,  89 checks, 0 errors, 0 warnings)
```

`bot/src/tierEntry/validate.test.ts` runs the offline pass over all 18 templates
in CI, so a future data change fails loudly instead of quietly minting
impossible characters.

**Result, 2026-09-02: 18/18 templates PASS offline; 5/5 classes exercised PASS
live against the running dev server (212–221 combined checks each, 0 errors).
Conduit is not yet exercised live — it needs `CONDUIT_ENABLED`.**

---

## 5. The control route

Biome order, held constant for every class and branch:

> **Plains → Forest → Swamp → Mountain → Cave → Jungle → Desert**

Per leg: travel → obtain the class's planned items → farm to the live
`biomeLevelCap(2, group)` → opportunistic upgrades → attempt the boss. After the
third boss step, the branch is bought *if* three seals were actually earned.

Deliberate properties:

- **Biome order is the controlled variable.** `t2Routes.semantic.test.ts` fails
  if a route ever visits them in a different sequence — a route that does is no
  longer comparable and every cross-class conclusion from the batch is void.
- **Every biome gets a boss attempt** (`maxAttempts: 4`). A biome whose boss was
  never tried produces no evidence about that boss. Exhausting attempts records
  `boss-step-exhausted` and continues; being walled is data, not a crash.
- **Every upgrade is `opportunistic`.** The Tier-2 upgrade ceiling is **+0 until
  Global Mastery 42** and only reaches +5 at **GM 72 — every one of the seven
  biomes at its cap**. A fixed `toPlus` would park the bot waiting for headroom
  that only arrives by farming a *different* biome.
- **Runes and abilities are carried forward unchanged** from the Tier-1 endgame
  profile. Tier 2 opens four new rune recipes and four new abilities; adopting
  any of them in the baseline would make automation quality a second variable
  moving alongside biome difficulty. They are probes, not baseline.
- **Cost-farming is catalyst-aware.** Catalysts are minted by the node MODIFIER
  and by nothing else, and modifiers are static per node. A cost-farm pointed at
  the plain biome ref waits on a wallet that may never fill — measured: a Striker
  run spent **521 of its 540 seconds** blocked needing 2 alacrity while parked in
  a *dominion* node with 46,044 spare yellow. `t2FarmFor(group, family)` now
  prefers a node that mints the required family, and
  `t2Routes.semantic.test.ts` fails any route that forgets.
- **Completion is the tier gate** (`playerTierAtLeast: 3` = three seals), not
  "maxed the map".

### Gear plans are hypotheses

Each class declares `adopt` / `craftOnly` / `skip`, every skip carries a written
reason, and a skip is emitted as a telemetry milestone rather than as nothing —
so *"0/18 adoption"* and *"nobody could afford it"* stay distinguishable. The
adoption report scores the hypotheses against what the runs actually did.

---

## 6. The other structural finding: Tier-2 gear is mostly *not craftable*

**20 of the 32 Tier-2 recipes are evolutions** (`evolvesFrom`) of one specific
Tier-1 item, and `craftRecipe` refuses them outright. Only the eight
Jungle/Desert pieces and the three Cores are plain crafts. An evolution offers:

- **EVOLVE** — consume a **bag** copy of the predecessor at **+5**, pay the cheap
  `cost`.
- **RECONSTRUCT** — pay `reconstructCost` (~3.5×), no predecessor, and only
  where that cost is authored.

Two traps, both live, both now handled:

1. **`checkEvolve` tests `inventory.includes(predecessor)`, and an equipped item
   is not in the inventory array.** A character wearing its fully-upgraded T1
   weapon cannot evolve that weapon until it takes it off. Without an unequip
   the route silently pays reconstruction — three times the price, for no reason
   a reader of the run could ever see. Hence the new `unequip` step.

2. **`EVOLUTION_REQUIRED_PLUS` is 5** (raised from 3 on 2026-08-29). The
   canonical Tier-1 routes take only *some* gear to +5 — Striker's `flash-rapier`
   ends at **+4**, its `iron-broadsword` at **+1**, `plains-charm-t1` at **+2** —
   so most lineages are **not evolvable at Tier-2 entry no matter what the route
   does**. This is recorded as a finding, not routed around.

Across the six class plans (50 planned acquisitions):

| path | count |
|---|---:|
| evolve (predecessor already in the bag at +5) | 7 |
| evolve after unequipping the worn predecessor | 15 |
| **reconstruct (predecessor below +5 or absent)** | **22** |
| plain craft (Jungle / Desert / Cores) | 6 |
| unreachable | 0 |

`pnpm bot:t2-reachability` prints this per template.

### 6.5 You cannot accelerate past catalysts

The dev reward multiplier **deliberately does not scale catalyst progress**
(`rewards.ts`: *"a catalyst is a discovery, not a currency pile"*). That is right
for the game and it has a sharp consequence for the harness: **an accelerated run
is not accelerated at all with respect to catalysts.**

Measured live at 100× rewards: a Striker minted **2 alacrity catalysts in 298
seconds** while banking **46,044 spare yellow essence** in the same window.

Total Tier-2 catalyst demand, derived live (`pnpm bot:t2-catalyst-demand`):

| family | demand |
|---|---:|
| alacrity | 40 |
| swarming | 17 |
| fortified | 17 |
| heavy | 16 |
| dominion | 9 |
| **total** | **99** |

At the measured rate that is on the order of **four hours of irreducible waiting
per full-tier run**, none of which measures combat or progression. An accelerated
Tier-2 smoke run is therefore **catalyst-bound, not combat-bound** — the exact
opposite of what an accelerated run is for.

Hence the `catalyst-primed` arm. It carries the whole tier's catalyst demand and
no essence, so a progression-integrity run measures recipes, gates, gear, bosses
and combat rather than catalyst discovery time. Measured effect: the Plains leg
went from ~300 s to **~35 s**, and the same run then reached the Plains Tier-2
boss inside its nine-minute budget.

**Never read economy conclusions from a `catalyst-primed` run.** Catalyst supply
is one of the things a Tier-2 balance pass most needs to measure, and this arm
removes it deliberately.

---

## 7. Conduit weapon-scaling note

**Answer: Conduit is weapon-speed NEUTRAL on minion throughput, and prefers slow
high-attack weapons once monster plating is accounted for.**

Read directly from `server/src/systems/classes/archetypes/summoner/spawn.ts` and
`summonerPrototype.ts`:

```
minion.attack          = owner.attack          × damagePct × formationOffenseMult × slotOffenseWeight
minion.attackCooldown  = owner.attackCooldown  × summonAttackCooldownMult
```

Both are proportional to the player's own values, so

```
minion DPS ∝ owner.attack / owner.attackCooldown = owner.attack × owner.APS
```

— the player's own DPS product. A slow high-attack weapon and a fast low-attack
weapon with the same `attack × aps` give **identical** minion throughput. There
is no normalization and no per-hit bias in the inheritance itself.

The tie is broken elsewhere, and every tiebreak favours **slow and heavy**:

1. **Plating.** Damage per hit is `max(1, H − plating) × (1 − DR)`. Flat plating
   is subtracted per hit, so many small hits lose proportionally far more than
   few big ones. Against any plated monster, slow+high-attack is strictly better
   for minions.
2. **`onHitDamage` is not inherited** — minions spawn with `onHitDamage: 0`. The
   Jungle rapier's and Thorn Needle's on-hit component is worth nothing to the
   formation and only pays the Conduit's own attacks.
3. **Attack style is set by the summoner profile, not the weapon**, so weapon
   flavour and reservoir DoT do not travel to the minions either.

Secondary effects that *would* favour fast weapons (per-hit procs on the
player's own swing) exist only on the player's attacks, which are the smaller
share of a formation build's damage.

**Practical reading:** Mountain's `quake-hammer` (47 attack @ 0.55 aps) should be
Conduit's best Tier-2 weapon and the Cave `ruinous-axe` (43 @ 1.20, with a dead
swing every 4th) its best generalist. The baseline plan takes the axe and holds
the hammer as the paired probe, so the campaign measures the gap rather than
assuming it.

**Latent defect found and fixed:** the per-tick minion resync recomputed
`minion.attack` **without** the `summoner.minion-damage-pct` passive that the
spawn path applies, so it overwrote it one tick after every spawn. No skill node
or item sets that key today, so it is currently a no-op — but the first T3/T4
node that grants minion damage would have appeared to do nothing, with no error
anywhere. The resync now uses the spawn formula verbatim.

---

## 8. Rune / autoplay regression

### Fixed: target acquisition was being driven by target preference

`Focus Highest HP` and `Focus Lowest HP` answer *which enemy do I hit in this
fight*, not *which fight do I start*. Scored across every monster in the node
they answered the second question instead.

Two compounding causes, both confirmed in code and reproduced in a test:

1. `WEIGHT_PRESETS` set `distance: 0.001` for both HP-preference modes, and
   `Find Enemies` raises the acquire radius to `RUNE_NODE_ACQUIRE_RADIUS`
   (10,000 — wider than a 4,800px node). `score = maxHp − 0.001 × penalty` ranked
   *every monster in the node* by raw max HP with distance as a rounding error.
2. `focus-lowest-hp` scored `1 / hp`, whose spacing **collapses as HP grows**. At
   1,700 vs 4,000 HP the candidates differ by 3e-4 while the distance term
   contributes 1e-3 — so the rule silently **inverted into "focus nearest"**
   exactly where big pulls make it matter most.

Reproduced live: `In Combat → Focus Highest HP`, with a Prairie Wolf actively
attacking the player and a 4,000 HP Gorging Razortusk 3,200px away and
unengaged, selected **the razortusk**.

**Fix** (`server/src/systems/combat/ai/targetPriority.ts`), deliberately narrow:

- While anything is actually engaged, the two HP-preference modes choose from the
  **engaged set**. With nothing engaged there is no encounter to have a
  preference within, and acquisition falls through to the ordinary path.
- Both modes now score a **normalized 0..1 term** against the largest relevant
  pool among the tick's candidates, so distance is a real tie-break and the rule
  behaves identically at every HP scale.

`focus-elites` is **deliberately excluded** and keeps its cross-node reach:
reaching the necromancer before it raises the dead is the entire purpose of that
rune, and `eliteTargeting.test.ts` pins that on purpose. Worth a designer look —
it is the one targeting rune that *can* still start a fight across the node.

`server/test/runeTargetingPreference.test.ts` covers: preference not becoming
acquisition; ordering within a multi-enemy encounter; the out-of-combat case
where the rule's condition is false and must not steer; lowest-HP correctness;
lowest-HP scale-independence; and Focus Closest unchanged.

### Verified, not changed: same-condition conflicts

`In Combat → Chase` above `In Combat → Orbit` resolves by **channel claim,
top-to-bottom, first wins** (`deriveAutoConfigFromRunes`). Both are MOVEMENT, so
the lower rule never fires — the documented behaviour, and why every authored
profile puts `inside-telegraph → step-back` *above* the chase/orbit rule.
Legitimate priority layering works because the conditions differ: `Inside
Telegraph → Step Back` outranks `In Combat → Chase` by position while its
condition holds, and yields when it does not.

### Not covered yet

Travel (`while-traveling`, Avoid Enemies, Fight Back, suspend/resume, death
mid-journey), hazard interaction (Avoid Hazards × Step Back × Recover First ×
forced displacement), and the rune status panel's correspondence to actual
behaviour. `runeDynamicHazardAvoidance.test.ts`, `runeMaintenance.test.ts` and
`runeTelegraphEvasion.test.ts` cover parts of the hazard/maintenance space
already; the travel matrix is the gap. Listed under Recommended Next Campaign.

---

## 9. Canonical vs accelerated evidence

A run is canonical only when `summary.run.canonical === true`. Every Tier-2 run
described here carries at least two taints:

| Taint | Meaning |
|---|---|
| `SYNTHETIC_TIER_ENTRY` | started from a template, not from a played Tier 1 |
| `NON_CANONICAL_REWARD_MULTIPLIER` | the server's kill-reward multiplier was not 1 at any point |

`bot:t2-report` prints the evidence class in its header and refuses to let spend
totals read as pacing. **Accelerated Tier-2 runs answer progression integrity
and combat sanity. They say nothing about economy pacing.** Never mix the two in
one table.

---

## 9.5 What the first runs actually showed

Five live runs, all non-canonical. Full detail and classification in
[`reports/t2-experiment-ledger.md`](../reports/t2-experiment-ledger.md).

| id | what happened | classification |
|---|---|---|
| T2-E005 | Striker blocked **521 of 540 s** on 2 alacrity catalysts while parked in a dominion node with 46,044 spare yellow | route problem — **fixed** |
| T2-E006 | Same run after the fix: full Plains leg — evolve vest, reconstruct charm, unequip + evolve boots, max to 12, upgrades correctly resolving to +0 | fix verified |
| T2-E008 | Catalyst-primed Striker finished Plains in ~35 s, then **died twice to the Plains T2 boss**, leaving it at 91.7% both times. Largest hit **61 into a 183 HP pool** — three hits to kill | **ambiguous, preserved** |
| T2-E009 | Five-class batch terminated by the environment at ~2 min; all five templates validated live, four had already evolved `plains-vest-t2`; uncontrolled parallel put all five in one node | infrastructure |

**On T2-E008, read carefully.** A 61-into-183 ratio is *consistent* with the
designer's report that Tier-2 numbers are out — but that run was one class, one
branch, non-canonical, from a synthetic template, fighting the Plains Tier-2 boss
with a **Tier-1 weapon** (`chaotic-axe` +5), because the control route fights each
boss at the end of its own leg and Striker's Tier-2 weapon does not arrive until
Cave. One build with a tier-behind weapon cannot distinguish *boss too strong*
from *route fights it too early* from *the +5 evolution gate left this build with
no Tier-2 weapon*. It is recorded as ambiguous on purpose, and the follow-up is
two arms with one variable each.

---

## 10. Known issues

### Harness

- **Travel/hazard rune matrix is untested.** See §8.
- `bot:t2-report` reads `events.jsonl` directly rather than `summary.json`, so it
  works on in-flight and killed runs. It does not yet compute biome dwell time or
  travel-vs-combat time split — the Tier-2 response map (§11) needs those.
- The T2 route carries no stance, core or Tier-2 ability adoption in the
  baseline. Deliberate (single-variable control), but it means the Tier-2 content
  in those three systems is currently untested by bots.

### Route

- Gear plans are argued hypotheses written from stat blocks, not from measured
  outcomes. Expect several to be wrong; that is what the adoption report is for.

### Rune / autoplay

- `focus-elites` still reaches across the whole node to begin a new fight. It is
  pinned deliberately, but it is the one targeting rune that can pull an
  unrelated enemy, and it deserves a designer decision now that the HP-preference
  modes no longer do.

### Progression

- **`EVOLUTION_REQUIRED_PLUS` moved 3 → 5 on 2026-08-29 and the canonical Tier-1
  routes were never updated.** They leave their characters unable to *evolve*
  most of their own lineages, forcing ~3.5× reconstruction costs across Tier 2.
  Either the T1 routes should take more items to +5, or the +5 gate is too
  strict — a designer call, with the evidence in §6.
- `design_docs/player-power-curve.md` and `design_docs/game-overview.md` state
  that a Tier-2 character holds root + frame + **range**. Live progression and
  the balance bench both say root + frame only. Doc bug; see §1.

### Suspected balance (evidence recorded, nothing changed)

- **`ruinous-axe` (Cave) is roughly twice the naive DPS of every other Tier-2
  weapon**: 43 attack × 1.20 aps = 51.6, and 38.7 even after its dead swing every
  4th, against 25.9 for the next best (`quake-hammer`) and 18.0 for
  `knight-steelsword`. The designer's own hypothesis was "watch for it becoming
  universally dominant"; the stat block says it already is. Deliberately not
  changed — the campaign should measure how universal the pull is in play.
- **`knight-steelsword` (Plains, the tier's first weapon) is 18 attack @ 1.0 aps**,
  which is below the Tier-1 weapon every canonical route already ends on. Every
  one of the six class plans skips it. If the runs confirm that, the tier's
  opening weapon is dead on arrival.
- **The designer reports Jungle and Desert "completely destroy you"** and expects
  builds to wall in the back half. The control route is built to record exactly
  where, with `maxAttempts: 4` per boss and continue-on-exhaustion.

---

## 11. Not yet built

- **Tier-2 response map** (§Phase 12 of the brief). The per-biome matrix needs
  dwell time, travel-vs-combat split, and resource-blocked time aggregated per
  biome per build. The events carry the data; the aggregation is not written.
- **Standardized mid-tier checkpoints** ("spawn Slinger at Cave entry"). The
  template mechanism generalizes — `TierEntryProfile` is not Tier-2-specific and
  the server validates any target tier ≥ 2 — but no checkpoint capture exists
  yet. The clean way is a `--captureCheckpoint` that writes the live
  `PlayerView` back out as a profile at a named milestone.
- **T3-entry (18-branch) templates.** Same mechanism, `targetTier: 3`, spawning
  at the T3 Sanctuary with a range node spent. This is where the 6 × 3 matrix
  becomes a set of *entry* templates rather than a set of route variants.
- **Targeted equipment experiments** (Desert boots vs Cave melee, Steelsword,
  Rapier, Mountain/Jungle armor). These need mid-tier checkpoints to be
  affordable; running them from Tier-2 entry means replaying half a tier per arm.

---

## 12. Recommended next campaign

In order, because each unblocks the next.

1. **Decide the two progression questions before spending machine time.**
   (a) Should the canonical Tier-1 routes take more gear to +5, so Tier-2
   evolution is reachable? (b) Is `focus-elites` allowed to start a fight across
   the node? Both change what every subsequent run measures.
2. **Run the 18-route accelerated smoke matrix to completion** and read
   `bot:t2-report`. The question is progression integrity — can each build reach
   Desert at all, and where does each one stop — not balance.
3. **Build mid-tier checkpoint capture.** Everything in §11 is gated on it, and
   it is the difference between a targeted experiment costing minutes and
   costing half a tier.
4. **Then, and only then, the equipment experiments** from standardized
   checkpoints, one variable each.
5. **Canonical 1× runs last**, and only for the builds the accelerated pass shows
   can actually finish. A canonical run of a build that walls in Mountain spends
   hours to learn something the accelerated run already said.

Do not tune Tier-2 numbers from the accelerated matrix. It is a progression and
combat-sanity instrument, and its reward multiplier makes every economy reading
meaningless by construction.
