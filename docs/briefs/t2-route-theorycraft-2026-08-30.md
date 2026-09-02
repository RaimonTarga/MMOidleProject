# T2 Route Theorycraft — exploratory survey

**Date:** 2026-08-30
**Status:** EXPLORATORY. Source material and hypotheses, **not** an authority.
**Method:** read-only pass over the repo at `develop`, plus `bot/runs/` artifacts. No server run, no bot batch, no code or data changed.
**Published copy:** <https://claude.ai/code/artifact/1132d5ef-87a1-4007-8754-441e4a7a6eb3>

These proposals are not approved and are not a source of truth. They are to be compared
against human playtesting, 1x economy validation, and real bot runs. Where this document
and the code disagree, the code wins.

## Evidence tiers

Conclusions are tagged and the tiers are not blurred:

- **[C] Confirmed** — read directly out of current repo data or a run artifact.
- **[SI] Strong inference** — not stated anywhere, but several pieces of evidence agree.
- **[T] Theorycraft** — a proposal. Unvalidated. Expect it to change.

---

## 1. Executive summary

Six findings change what should happen next. Three are hard blockers on any T2 route
existing at all; three are T1 corrections worth making before another validation batch.

### 1.1 The bot cannot craft 21 of the 29 T2 gear items — [C]

Every returning-biome T2 item is an *evolution*. `craftRecipe()` in
`server/src/systems/player/economy/crafting.ts:29` explicitly rejects any recipe carrying
`evolvesFrom` ("This item must be evolved or reconstructed."). The evolve path is a
separate socket event, `crafting:evolveItem`, and the bot's intent layer
(`bot/src/net/intents.ts`) does not emit it. The route DSL has no step for it either.

This is the highest-priority automation work. Without it a T2 route can only touch the
eight Jungle/Desert items.

### 1.2 T1 routes never spend the Tier 2 skill point — [C]

Leaving T1 takes **two** seals, not one (`SEALS_REQUIRED_BY_TIER[1] === 2`). In boss order
(Plains -> Forest -> Mountain -> Swamp -> Cave) the character reaches tier 2 after the
**Forest** boss and immediately receives a skill point for its sub-variant frame. No route
calls `unlockSkill` — the executor implements the step (`bot/src/route/executor.ts:203`),
but nothing in `bot/src/routes/` uses it.

So the last three T1 bosses are fought with a whole frame's worth of stats unclaimed. For
Squire that is Bulwark's +22% max HP / +25% plating; for Striker, Breaker's +18% HP /
+20% plating and a 4x empowered finisher.

### 1.3 The most recent validation batch is 1-for-6, and mostly stale — [C]

`bot/runs/overnight-t1-validation-2026-08-30-A` (25x reward multiplier, sequential):

| Route | Bosses cleared | Deaths | Terminal |
|---|---|---:|---|
| `striker-t1` | plains, forest, mountain, swamp | 7 | stalled on **Cave** |
| `squire-t1` | plains, forest, mountain, swamp | **29** | stalled on **Cave** |
| `slinger-t1` | plains | 8 | stalled on **Forest** |
| `spirit-t1` | plains | 10 | stalled on **Forest** |
| `apprentice-t1` | plains, forest, mountain, swamp | 8 | stalled on **Cave** |
| `conduit-t1` | all five | 8 | **completed** |

The three Cave failures ran with `cleanse` equipped at the Cave boss; the working tree
already contains the uncommitted `cleanse` -> `second-wind` change. Treat those three as
invalidated, not as balance evidence. The Slinger/Spirit Forest wall is not explained by
that change and is live.

### 1.4 The Cave-guard fix is probably right, but its stated reason is wrong — [C]

`T1_FINAL_VALIDATION_HANDOFF_2026-08-30.md` justifies the swap with "Cave currently has no
relevant debuff." Obsidian Broodmother carries `appliesPlatingShred`, which writes
`PLATING_SHRED_EFFECT_ID` onto the player; `isHarmfulPlayerStatusEffect`
(`shared/src/systems/monsterDebuffs.ts:131`) returns true for it, and the bestiary text
says "Cleansable." Cleanse does fire there.

It is still the right swap, for a throughput reason: at player tier 2 Cleanse sits on rank
II — 2 stacks per 10 s — against a boss re-applying ~3.5 stacks per 10 s and deepening the
ceiling at 50% (`empower-shred`, +3 max stacks). Cleanse loses the race. Worth recording
the real rationale so the same conclusion is reachable next time.

### 1.5 Catalysts cannot be earned inside a dungeon — [C]

`NODE_MODIFIERS` (`shared/src/world/nodeModifierMap.ts`) is built only from
`kind === 'normal'` nodes, and `grantCatalystProgress` early-returns without a family key.
So neither dungeon guardians nor bosses grant any catalyst progress. The T2 economy ledger
still describes a boss `catalystBundle`; no such field exists anywhere in the codebase.

Consequence for routing: every catalyst a T2 kit needs (~8 of one family for a full
four-piece set) must come from normal nodes carrying that modifier — and the route DSL's
`NodeRef` has no modifier filter.

### 1.6 T1's end state is a clean T2 launchpad — [SI]

Evolution requires the predecessor at **+5** (`EVOLUTION_REQUIRED_PLUS === 5`). Every
canonical T1 route already drives its whole worn kit to +5 and banks a `gear-plus-5`
milestone. That is exactly the entry condition for the T1->T2 lineage map, so the T2 route
can open by evolving rather than re-crafting.

### What to watch

- The **Forest boss vs. light chassis** problem is the only live T1 balance signal in the
  current artifact set. Slinger and Spirit are the two lowest-HP roots and both stalled
  there at 143-153 max HP against a boss whose dominant contribution was 176-198 damage.
- **Mitigation scale** underlies everything: end-of-T1 characters carry 6-15 plating and
  0-0.04 damage reduction on 134-198 HP.
- A T2 route is **not authorable today**. Three DSL/intent gaps (evolve, stances, skill
  points) sit between the current harness and a runnable T2 route.

---

## 2. T1 route audit

T1 is mostly done. This is a calibration read, not a redesign — only materially useful
issues are listed. All six canonical routes are generated from one config
(`bot/src/routes/t1RouteBuilder.ts`), so most findings are shared rather than per-class.

### 2.1 What the shared structure gets right

Content-named nodes rather than node ids; costs read from `RECIPE_DATABASE` at runtime; an
explicit rune-arbitration order with Step Back ahead of Chase/Orbit; and a semantic test
that re-derives RP spend and unlock levels from the generated steps rather than from the
config object. The `reactiveGuardRune` fix — only arming `target-casting -> fire-guard`
when Brace is the equipped Guard — is exactly right, because `abilityFiring.ts` suppresses
a Guard's built-in trigger the moment any `fire-guard` rune is present.

### 2.2 Shared issues

| Issue | Tier | Detail |
|---|---|---|
| No sub-variant frame at bosses 3-5 | [C] | See §1.2. Fix is one `unlockSkill` step after the second boss clear, per class. Largest single power gain available to the route. |
| Runic Points underspent by 2-4 | [C] | Budget is `8 + floor(GM/10)` = 11 RP at GM 30. Melee dodge profile spends 7; ranged-orbit spends 9. The honest read is that the T1 rune catalog does not offer 11 RP of useful rules yet — which is itself a finding. |
| Power Strike never learned by any route | [C] | `ability-recipe-power-strike` gates at Mountain L5 (inside the T1 cap of 6) for 190 blue. x3.0 -> x3.5 cast-strike, 10 s cd, 1.6 s wind-up. Every route runs Sweep then Expose Weakness (+15-17.5% damage taken, 4 s, 12 s cd). "Never even crafted" is not a considered choice — worth one A/B arm, not a baseline change. |
| The gauntlet is fought entirely at GM 30 | [C] | The semantic test asserts `boss.gm === 30` for all five. Correct as authored, but after boss 2 the character is tier 2 and every T1 biome's cap rises 6 -> 12. A real player would keep levelling rather than throw themselves at a boss six times. A route-philosophy question, not a bug — flagged because the T2 route needs the opposite behaviour. |
| Stale comment on tier advance | [C] | `t1Common.ts` `standardMilestones` says "one T1 boss down advances the character to tier 2." Two seals are required. This is the comment that hides the missing skill point. |
| A historical route is unrunnable | [C] | `apprenticeLetDotsFinishT1.ts` crafts `rune-recipe-let-dots-finish` during T1 Swamp; the T2 pass moved that gate to Swamp L9, past the T1 cap. Excluded from the controlled set and from the semantic test's legality checks, so nothing catches it. Already flagged in the T2 ledger. |

### 2.3 Per class

| Class | Route | Identity | Latest batch | Verdict |
|---|---|---|---|---|
| Striker (`cadence`) | `striker-t1` v3.0.0 | melee-chase, dodge; Chaotic Axe -> +5 | 4/5, stalled Cave, 7 deaths | Keep. Add the frame pick. |
| Squire (`cooldown`) | `squire-t1` v2.0.0 | identical gear plan to Striker | 4/5, stalled Cave, **29 deaths** | Revisit — see below. |
| Slinger (`reload`) | `slinger-t1` v2.0.0 | ranged-orbit; Poison Dagger; Forest evasion vest | 1/5, stalled Forest, 8 deaths | Investigate Forest. |
| Spirit (`energy`) | `spirit-t1` v2.0.0 | ranged-orbit on the durable-melee gear plan | 1/5, stalled Forest, 10 deaths | Investigate gear fit. |
| Apprentice (`dot`) | `apprentice-t1` v2.0.0 | apprentice-chase; Arcane Wrappings for Swamp | 4/5, stalled Cave, 8 deaths | Keep. Add the frame pick. |
| Conduit (`summoner`) | `conduit-t1` v2.0.0 | ranged-orbit; durable-melee gear plan | **5/5 complete**, 8 deaths | Keep as the reference. |

**Squire — the one route with a real structural problem.** The 29 deaths were almost all
to **Cave Sentinel**, a dungeon *guardian*, at `node-t1-cave-dungeon`. It never reached
Obsidian Broodmother. Squire is the slowest chassis in the game (-15% attack speed, -10%
move) and runs Striker's gear plan verbatim — `DURABLE_MELEE_BOSS_GEAR` is shared between
the two. [T] Squire has the strongest case for a different kit (Fallen Knight Plate's
`guard.potency-pct 0.15`) and for the Brace A/B arm becoming the baseline. None of it is
worth changing before the frame pick lands, because the frame pick alone may move it.

**Slinger and Spirit — the Forest wall.** Both stalled at Gnarled Greatbear with 143-153
max HP and 7-14 plating. The boss's own source comment calls it "the evasion exam" and
notes that *none* of the baseline routes carry evasion into the fight. Slinger reaches
Forest's evasion vest but is on `forest-vest-t1` +5 (28 HP, 3 plating, 0.16 evasion);
Spirit is on `plains-vest-t1` (24 HP, 7 plating, no evasion). [SI] The Forest boss is
parked on the plating cliff its own comment describes, and the two lightest chassis fall
off it. More likely a mitigation-scale problem than a route problem.

### 2.4 Guard / Technique matrix (dodge baseline, after the pending Cave correction)

| Boss | Technique | Guard | Read |
|---|---|---|---|
| Plains | Sweep | Second Wind | Correct — swarm commander, constant adds. |
| Forest | Expose Weakness | Second Wind | Sound; the fight is sustained, not spiky. |
| Mountain | Expose Weakness | Second Wind | **Questionable.** Crag Behemoth is the burst exam — one telegraphed Ground Slam at ~50% of the pool. Brace (35-40% DR, knockback footing) is the designed answer, which is why the Brace arm exists. Second Wind at 60% HP is a poor response. |
| Swamp | Expose Weakness | Cleanse | Correct — 4-stack poison plus a Bile Pool. Cleanse rank II strips 2 of 4. |
| Cave | Expose Weakness | Second Wind *(pending)* | Right call, wrong stated reason (§1.4). |

Movement behaviour looks appropriate throughout: Step Back ahead of Chase/Orbit is correct
given top-to-bottom per-channel resolution, and Avoid Hazards on a separate PATHING
channel composes rather than competes.

### 2.5 Verdict

**T1 routes require small cleanup, not meaningful revision.** The frame pick is the one
change clearly worth making. The Cave guard correction is already in the working tree.
Everything else — Power Strike, Brace at Mountain, Squire's kit, evasion for the light
chassis — belongs in A/B arms, and none of it should move before a clean batch runs with
the frame pick in place.

---

## 3. T2 system map

### 3.1 Progression constants — [C]

| Quantity | T1 | T2 | Source |
|---|---:|---:|---|
| Global Mastery ceiling | 30 | 72 | `maxGlobalMasteryAtTier` |
| Runic Points | 11 | 15 | `8 + floor(GM/10)` |
| Biome level cap, returning biome | 6 | 12 | `biomeLevelCap` |
| Biome level cap, Jungle / Desert | 0 | 6 | start tier 2 |
| Seals to leave the tier | 2 of 5 | 3 of 7 | `SEALS_REQUIRED_BY_TIER` |
| Ability slots (Technique / Guard) | 1 / 1 | 1 / 1 | `abilitySlotCount` |
| Skill point spent on | class root | sub-variant frame | `canUnlockSkill` |
| Essence multiplier on kills | x1.00 | x0.85 | `BIOME_ESSENCE_TIER_MULT` |
| Biome XP multiplier on kills | x1.50 | x1.25 | `BIOME_XP_REWARD_MULT_BY_TIER` |

**The gate nobody mentions — [C].** Item upgrade ceilings are indexed by the *item's* tier.
A T2 item's **+1 requires GM 38**; +5 requires GM 72
(`globalMasteryRequiredForUpgrade(2, .) = [38, 47, 55, 64, 72]`). A character arriving at
tier 2 sits at GM 30. So the first T2 item is evolved and then cannot be upgraded at all
until eight further biome levels are banked. This makes "evolve early, upgrade later"
structurally forced, and it means the T2 route's first leg is a levelling leg, not a
crafting leg.

### 3.2 Biomes — [C]

| Biome | Essence | Levels at T2 | Density | Identity | Retires after |
|---|---|---:|---:|---|---|
| Plains | yellow | 7-12 | 48 | Swarm; volume is the threat | **T2** |
| Forest | green | 7-12 | 36 | Fast, frequent, frail; evasion's home | **T2** |
| Swamp | purple | 7-12 | 20 | Attrition; DoT resistance | T3 |
| Mountain | blue | 7-12 | 24 | Telegraphed burst; the damage cap | T4 |
| Cave | red | 7-12 | 16 | Few elites, mixed shapes, real DR | T3 |
| Jungle *(debut)* | green | 1-6 | 40 | High density, ambush, on-hit | T4 |
| Desert *(debut)* | yellow | 1-6 | 16 | Exact 1:1 controller/dealer duos | T4 |

[SI] **Plains and Forest are the tier's last call.** Their caps freeze at 12 forever, so a
T3 character gains nothing further there. A knowledgeable player finishes both to 12 during
T2 or writes off that mastery permanently — and since they are also the cheapest-gear,
lowest-difficulty biomes, ending the tier there is both easiest and most time-limited.

[C] Jungle/Desert trash is on a visibly different stat scale from returning-biome T2 trash:
jungle-snake 400 HP, jungle-ape 500, sand-scorpion and stone-basilisk 660 HP / 55-75 attack
— against forest's ancient-wolf at 270 HP or plains' stampede-bull at 230. Their rewards
are on the low end (7-8 essence, 38-46 biome XP) because they are level-1 content in their
own biome. A real difficulty/reward inversion to route around early.

### 3.3 Gear — [C]

29 T2 gear items: 21 evolutions of a T1 predecessor at +5 (Flash Rapier branches into two),
8 plain crafts with no predecessor (the Jungle and Desert sets).

| Slot | Lifetime essence | Catalysts | Note |
|---|---:|---:|---|
| Weapon | 1,000-1,270 | 3 | 1 at +4, 2 at +5 |
| Armor | 960-1,260 | 3 | 1 at +4, 2 at +5 |
| Recovery | 468-655 | 1 | at +5 only |
| Mobility | 329-432 | 1 | at +5 only |
| Core | 45 | 1 | on base craft; no upgrades exist |

A full four-piece T2 kit is roughly **2,800-3,600 essence of one colour plus 8 catalysts**.
Evolving costs the recipe's base craft and no catalyst; reconstructing without a +5
predecessor costs 3.5x the essence plus 2 catalysts. Knight's Steelsword is a documented
catalyst-neutral exception at 4x instead.

**Pieces carrying a mechanic worth building around:**

| Item | Gate | Mechanic |
|---|---|---|
| Iron Crusader Plate | Mountain L8 | `guard.potency-pct 0.28` — scales Brace / Endure DR and duration |
| Iron Bulwark | Mountain L9 | `defense.barrier-pct 0.20` — stacks with Spirit's own 30% |
| Dire Bestial Hide | Cave L8 | 50 HP / 7 plating / `damageReduction 0.13` — the only %DR armour at T2 |
| Duneplate of the Last Stand | Desert L2 | `defense.cheat-death` + a cleanse tick every 8 s |
| Mirage Talisman | Desert L3 | cleanse every 6 s, heals 3% when there is nothing to strip |
| Bog Wrappings | Swamp L8 | `dot-resistance 0.34` + `hit-to-dot-pct 0.08` |
| Phantom Bindings | Forest L8 | 50 HP / 5 plating / **0.24 evasion** |
| Verdant Weave | Jungle L2 | 44 HP / 6 plating / 0.15 evasion — cheapest evasion at T2 |
| Canopy Heart | Jungle L3 | Recovery that ramps over 10 s of sustained combat |
| Venom Knife | Swamp L7 | 50% attack -> poison DoT, x1.5 multiplier |
| Quake Hammer | Mountain L7 | 47 attack at 0.55 aps; carries cast speed |
| Sunsteel Falchion | Desert L1 | 24 attack at 0.80 aps; carries Technique Power |

### 3.4 Cores — a three-way choice, all unrestricted — [C]

Range is not chosen until player tier 3, so every melee/ranged-restricted core is inert at
T2, and `coreAuthoring.test.ts` enforces that none is reachable here. Exactly three exist:

| Core | Gate | Effect | Catalyst | Suits |
|---|---|---|---|---|
| Tempered | Plains L7 | +12% attack, +12% max HP | 1 swarming | The safe default; no drawback |
| Survivalist | Forest L7 | +30% Recovery rate, +15% max HP | 1 fortified | Anything leaning on Recovery-derived sustain |
| Force | Cave L8 | +22% attack, -12% max HP | 1 dominion | Builds that already win the HP race |

All three cost 45 essence and 1 catalyst. No upgrade path, and **no evolution branches are
authored yet**, so a core is a one-time 45-essence decision, freely re-made.
[SI] Survivalist scales the Recovery *rate*, and every in-combat regen effect activates a
fraction of that rate — so it multiplies passive regen, Second Wind, on-kill bursts and
pulses at once. Stronger than its line reads on any class with a recovery charm.

### 3.5 Stances — the tier's genuinely new system — [C]

`resolveSystemVisibility` reveals stances at `playerTier >= 2`. A character picks one free
default posture; switching mid-fight is a Rune rule (`switch-stance`, 2 RP for the action
plus the destination stance's own cost, on top of the condition).

| Stance | Gate | RP | Posture |
|---|---|---:|---|
| Offensive | Forest L7 | 1 | +15% attack, +10% attack speed, +10% damage taken |
| Defensive | Forest L7 | 1 | +20% plating, -10% damage taken, -15% attack |
| Tanking | Forest L8 | 3 | +40% plating, -25% damage taken, -40% attack, -20% attack speed |
| Perfection | Plains L8 | 2 | +12% attack / attack speed / move speed, -20% plating |
| Enraged | Desert L5 | 3 | +30% attack, +15% attack speed, +15% damage taken |
| Fleeting | Jungle L5 | 2 | +35% move speed, +15pp evasion, -35% attack, -20% attack speed |

Two structural facts matter for automation. `damageTakenPct` is a multiplicative layer read
at hit time, not a stat — so Defensive's -10% is real even at zero gear DR. And a switch
has a 1,500 ms minimum dwell with at most one transition per tick, which makes stance
switching a coarse tool: it can express "in combat" or "below 25% HP", not a reaction to a
specific telegraph.

### 3.6 Abilities and runes — [C]

| Unlock | Gate | Cost | What it does |
|---|---|---|---|
| **Hamstring** (Technique) | Jungle L3 | 70 green | Armed slow, 40-45% for 3-3.5 s, x1.15-1.2 rider, 6 s cd |
| **Bramble Guard** (Guard) | Jungle L5 | 90 green | +6-8 plating, 6-10 flat thorns, 5 s; fires at 3 aggressors |
| **Charge** (Technique) | Desert L3 | 70 yellow | 220 px dash, +220 engagement range, x1.5-1.7 blow, 9 s cd |
| **Endure** (Guard) | Desert L5 | 90 yellow | 18-20% DR for 8 s at 70% HP, 14 s cd — Brace's long/shallow opposite |
| **Surrounded** (rune condition) | Swamp L7 | 70 purple | `n-aggro-3`, 2 RP |
| **Focus Lowest HP** (rune action) | Swamp L8 | 90 purple | TARGETING, 2 RP |
| **Let DoTs Finish** (rune action) | Swamp L9 | 90 purple | TARGETING, 1 RP, DoT classes only |
| **Spread DoTs** (rune action) | Swamp L10 | 120 purple | TARGETING, 2 RP, DoT classes only |

Note the placement: **every new ability is in a debut biome, every new rune is in Swamp.**
The three other returning biomes teach nothing new at T2 except gear. A clean routing signal.

### 3.7 Bosses — [C]

Seven T2 bosses; three seals needed to advance.

| Boss | Biome | HP | Attack | The exam |
|---|---|---:|---:|---|
| Gorging Razortusk | Plains | 4,000 | 96 | Constant slime trickle plus two rally beats at 50% and 25%. No self-enrage — it calls the herd. |
| Apex Timberclaw | Forest | 3,750 | 64 | Two-hit claw combos, a stunning charged swipe, a stacking Bestial Frenzy, a 50% frequency surge. |
| Stoneplate Juggernaut | Mountain | 5,000 | 128 | 2.3 s Earthshatter, 450 ms pre-cast stun, 180 px radius; digs in behind a 25% DR shield every 14 s; 50% adds two Peak Archers. |
| Mire-Gorged Behemoth | Swamp | 3,375 | 38 | 4-stack venom plus permanent Corrosive Pools that slow *and* apply +12% damage taken while you stand in them. |
| Chitinous Dreadbore | Cave | 4,375 | 139 | 2 plating shred per stack to 6 (7 at 50%), a 140 px Chitin Slam, a Cave Troll at 50%. |
| Dune-Stalker Emperor | Desert | 3,750 | 85 | x2.5 opening strike, then a self-run paint/cash Sun Mark cycle plus a telegraphed Sandburst that stacks with the mark. |
| Jungle Dread-Gorger | Jungle | 3,625 | 85 | x2.5 pounce, then one ambush wave at 50% and a 1.35x speed buff. |

[SI] Difficulty order for an automated character: **Swamp** (38 attack, no adds, no burst)
and **Jungle** (no plating, no DR, one add wave) look most tractable; **Mountain** (128
attack, pre-cast stun, DR shield, ranged adds) and **Cave** (139 attack, erosion, a troll)
look hardest. Only three seals of seven are needed, so the route has real freedom.

---

## 4. T2 class routes

All six share the same opening and economy shape. Divergence is in armour, core, stance,
and which three seals to take.

### 4.0 Shared spine — [T]

1. **Spend the skill point.** The sub-variant frame is free, permanent, and the largest
   single power step of the tier's opening. Should happen first — arguably before the T1
   gauntlet even finishes.
2. **Level the T1 biomes from 6 to ~8.** The GM 38 gate for any T2 upgrade; also opens the
   L7 weapons, L8 armours and the Plains/Forest/Cave cores. Nothing else can happen first.
3. **Evolve the weapon and armour** (both already +5 from T1), craft a core, pick a stance.
4. **Take the debut biomes to L5** for the abilities that suit the class, and the cheap
   Jungle/Desert gear where it beats the evolved piece.
5. **Take three seals**, then finish Plains and Forest to 12 before they retire.

### 4.0.1 Entry state — reconstructed — [C]

| Held | Value |
|---|---|
| Global Mastery | 30 (all five T1 biomes at 6) |
| Worn kit | Weapon, armor, recovery, mobility — all at **+5**. Core slot empty. |
| Abilities known | Sweep, Second Wind, Cleanse, Expose Weakness (+ Brace on A/B arms). Power Strike never learned. |
| Runes owned | Starters + Avoid Hazards, Keep Distance (ranged only), Step Back |
| Runic Points | 11, of which 7-9 spent |
| Skill points | 1 unspent — the frame |
| Max HP observed | 134 (Spirit) - 198 (Squire) |
| Essence wallet | **Unknown.** Not recorded in run summaries. The single largest gap for costing a T2 route. |

### 4.1 Striker (`cadence-root`, melee) — confidence MEDIUM

- **Frame:** *Intended/bot-safe* **Skirmisher** (5 hits at x2.0, +10% HP, +10% plating).
  *Optimized* **Breaker** (6 hits at x4.0, +18% HP, +20% plating) — but a 4x finisher every
  6 hits is worth much less to an automated character that loses target frequently.
- **Weapon:** evolve `chaotic-axe` -> **Ruinous Axe** (Cave L7, 43 attack at 1.20 aps,
  dead-swing counter 4). Already the T1 identity and already +5.
- **Armor:** evolve `mountain-vest-t1` -> **Iron Crusader Plate** if Brace is the Guard;
  otherwise `cave-vest-t1` -> **Dire Bestial Hide** for the 13% flat DR. The T1 routes
  carry both vests.
- **Core:** **Tempered.** Force's -12% HP is a bad trade on a 180 HP pool.
- **Stance:** default **Defensive.** Offensive's +10% damage taken is a multiplicative
  layer at a scale where the pool is the binding constraint.
- **Runes:** keep the T1 melee profile (7 of 15 RP). `n-aggro-3 -> bramble-guard` once
  learned; `in-combat -> switch-stance(offensive)` is the obvious 4-RP experiment.
- **Route:** Cave + Mountain to L8 -> evolve, craft Tempered -> Jungle to L5 (Hamstring,
  Bramble Guard) -> seals Jungle/Swamp/Plains -> finish Plains and Forest to 12.
- **Economy risk:** red and blue lifetimes near 1,100-1,200 each; Cave's density 16 makes
  it the slowest essence source in the tier.
- **Missing evidence:** whether Ruinous Axe +0 beats Chaotic Axe +5 on the day of the swap.

### 4.2 Squire (`cooldown-root`, melee) — confidence MEDIUM

- **Frame:** **Bulwark** (heavy; +22% HP, +25% plating, 3.5x execution every 8 s).
  *Bot-safe deviation:* **Knight** if the -12% attack speed / -12% move proves fatal to
  auto-combat holding a target. The 29-death Cave artifact warns that Squire's tempo is
  already marginal.
- **Weapon:** **Quake Hammer** (Mountain L7) is the thematic fit and carries cast speed —
  but requires `heavy-hammer` at +5, which *no current T1 route crafts*. Reconstruction
  costs 3.5x plus 2 heavy catalysts. The available-today answer is Ruinous Axe.
- **Armor:** **Iron Crusader Plate.** The 28% Guard potency is worth more to Squire than to
  anyone else if Brace or Endure is equipped.
- **Core:** **Survivalist** — Squire's root carries `defense.recovery-active-pct 0.10`,
  exactly the throughput a +30% rate multiplies. The strongest Survivalist case of the six.
- **Stance:** default **Defensive.** Tanking's -40% attack on a class whose damage arrives
  in scheduled bursts risks never finishing anything — A/B arm, not baseline.
- **Route:** Mountain to L9 -> Desert to L5 (Endure, Charge, Duneplate's cheat-death) ->
  seals Swamp/Plains/Desert -> backfill Cave and Forest to 12.
- **Economy risk:** the Quake Hammer fork — either a T1 detour to craft and +5 the Heavy
  Hammer, or ~640 blue plus 2 heavy catalysts to reconstruct. Decide deliberately.
- **Automation note:** `wait-for-execution` (OOC_MAINTENANCE, 1 RP, cooldown classes only)
  exists and no route uses it.

### 4.3 Slinger (`reload-root`, ranged) — confidence LOW

- **Frame:** *bot-safe* **Artillerist** (20-round clip, 3 s reload, +14% HP, +12% plating —
  the only reload frame with real armour). *Optimized* is Scout (5-round clip, +7pp
  evasion) for a human who can control spacing. **The largest intended/bot-safe divergence
  of the six.**
- **Weapon:** evolve `ashbrand-blade` -> **Venom Knife** (Swamp L7), or **Stinger Rapier**
  (Jungle L1, 55 green, 10 attack + 8 on-hit at 1.55 aps) — an on-hit weapon on a class
  whose identity is shot count.
- **Armor:** **Phantom Bindings** (Forest L8, 0.24 evasion) from the vest Slinger already
  wears. The root grants +0.30 evasion and `defense.evade-mitigation 0.20`; the one class
  where evasion is unambiguously right.
- **Core:** **Tempered.**
- **Stance:** default **Offensive**, with `hp-below-25 -> switch-stance(fleeting)` as the
  emergency posture. 1+2+2 = 5 RP inside 15. The most natural stance rule in the game.
- **Runes:** `tactical-reload` is **owned but never equipped by the T1 route**. On
  Artillerist's 3 s window this is the most class-specific rune available.
- **Route:** Forest L8 + Swamp L7 -> Jungle to L5 (Fleeting, Bramble Guard) -> seals
  Swamp/Plains/Jungle (deliberately avoiding Mountain 128 and Cave 139 attack) -> finish
  Forest and Plains to 12.
- **Why LOW:** the class has not cleared a T1 gauntlet under the current build, so its T2
  entry state is hypothetical.

### 4.4 Spirit (`energy-root`, ranged) — confidence LOW

- **Frame:** *bot-safe* **Phantasm** (+14% HP, +12% plating, +2% DR, 10 energy at x6.0).
  The root is +3% HP with *no* plating affinity and it stalled at Forest on 134-143 max HP.
  Spark is the optimized pick and probably unsurvivable for an automated character at this
  mitigation scale.
- **Recovery slot:** **Iron Bulwark** (Mountain L9, `defense.barrier-pct 0.20`). The root
  grants a barrier worth 30% of max HP; this takes it to 50% — the largest proportional
  defensive item in the tier for any class. Spirit's defining T2 pickup.
- **Armor:** **Dire Bestial Hide** (flat 13% DR) or **Phantom Bindings** (evasion). Barrier
  and evasion are complementary, but the T1 routes put Spirit on Plains/Mountain vests, so
  either lineage may need reconstruction.
- **Core:** **Tempered** — +12% max HP is +12% barrier too.
- **Stance:** default **Defensive.**
- **Open question:** the barrier "recharges between fights, not during them," and the
  Barrier/Ward rework is on record as a known large nerf to Spirit that has not been
  rebalanced. Whether Iron Bulwark's +20% is a real answer or merely restores what the
  rework took depends on numbers this pass did not measure. [T] throughout.
- **Route:** Mountain to L9 first (against the class's instincts), then Cave or Forest to
  L8, then the same Swamp/Plains/Jungle seal set as Slinger.
- **Why LOW:** no clean T1 artifact, an unresolved defensive system, and a gear plan that
  currently gives Spirit the durable-melee kit with no class rationale recorded.

### 4.5 Apprentice (`dot-root`, mid-range) — confidence MEDIUM

- **Frame:** **Ember mage** (balanced; 6 burn stacks at 50% conversion, 1.5 s ticks).
  *Optimized* Venom vessel (8 stacks at 30%, 1 s ticks) for faster swarm application;
  *bot-safe* Rime-Bound (3 stacks at 70%, +18% HP, +20% plating).
- **Weapon:** **Venom Knife** (Swamp L7). Two independent conversion sources — whether they
  compose was not verified. Ruinous Axe is the safe generalist.
- **Armor:** **Bog Wrappings** (Swamp L8): 54 HP, 7 plating, `dot-resistance 0.34`,
  `hit-to-dot-pct 0.08`. The root already carries 0.18 and 0.10, taking these to 0.52 and
  0.18 — the class turns incoming direct damage into damage it is highly resistant to.
  The most coherent item/class pairing in the whole T2 set.
- **Core:** **Survivalist.** The hit-to-DoT loop converts spikes into a slow drain, and a
  +30% Recovery rate is exactly the tool for out-healing a drain.
- **Runes:** Swamp L9/L10 unlock **Let DoTs Finish** (1 RP) and **Spread DoTs** (2 RP),
  both DoT-class-only, both a real behavioural change rather than a stat.
- **Route:** Swamp to L10 (the deepest single-biome commitment of any route, justified by
  weapon + armour + two class-exclusive runes) -> evolve, craft Survivalist (Forest L7) ->
  Jungle to L3 (Hamstring; a slow buys ticks) -> seals Swamp/Plains/Jungle -> finish Plains
  and Forest to 12.
- **Economy:** almost entirely purple, which is unusually clean; Swamp's density 20 is the
  offsetting cost.
- **Automation:** Spread DoTs changes target selection in a way the farm loop has never
  exercised. A/B it against Focus Closest rather than assuming it is better.

### 4.6 Conduit (`summoner-root`, ranged) — confidence LOW

- **Frame:** the one class where the frame is a genuine mechanical fork — Splinter (6 small
  summons), Consort (5 medium), Effigy (2 large). T2 bosses argue for Consort or Effigy:
  Plains, Mountain and Cave all spawn adds or AoE, and Splinter's swarm is explicitly
  "vulnerable to plating and area damage."
- **Weapon:** the owner's weapon sets summon damage and cadence, so it is a formation-wide
  multiplier. **Ruinous Axe** (43 attack) over a fast on-hit weapon — unless on-hit
  distributes across the formation, which the Catalyst core's documentation implies and
  this pass did not verify.
- **Core:** **Tempered.** Force's -12% HP hits the reconstruction budget, since rebuilding
  fallen slots costs the owner HP.
- **Stance:** default **Defensive.** The chassis is deliberately unremarkable; survival
  comes from summon interception, which no stance touches.
- **Automation gap:** `player:commandSummons` exists in the protocol and is **absent from
  `bot/src/net/intents.ts`**. The Conduit bot cannot issue a single formation command. It
  cleared T1 anyway — the only route that did — which is itself a data point.
- **Why LOW:** feature-flagged (`CONDUIT_ENABLED`, dev-only by default), its T3
  specialisation tree is the only one fully authored, and formation/on-hit/core
  interactions were only read at the doc level.

---

## 5. T3 direction

A sketch, not a route. T3 is where the build space opens: a second Technique slot, the
range choice, nine restricted cores, and the Rites layer all land at once.

| System | Change at T3 | Tier |
|---|---|---|
| Ability slots | **2 Techniques**, still 1 Guard | [C] |
| Skill point | The **range node** — close / mid / far | [C] |
| Cores | Nine more, seven range-restricted and therefore only now functional | [C] |
| Rites | New system: combat-boundary rules sharing the RP pool with runes and stances | [C] |
| Biomes | Tundra and Volcanic debut; Plains and Forest are gone; Cave and Swamp run to 18 | [C] |
| Abilities | Binding Strike (root), Break Free, Frenzy, Quick Strike | [C] |
| Runes | **None.** Zero T3 rune recipes, deliberately — Rites are T3's RP layer. | [C] |
| Global Mastery | Ceiling 114; upgrade gates 80 / 89 / 97 / 106 / 114 | [C] |
| Gear | 29 items, 22 evolutions and 7 debuts; lifetime 658-2,540 essence each | [C] |

**How each class changes — [T]:**

- **Striker / Squire** get real melee cores. Juggernaut (Mountain L14: +30% HP, +40%
  plating, a 14% independent DR layer, -25% attack speed) is the mitigation answer missing
  since T1 — the first item giving a melee build a second DR layer. Duelist (Cave L15)
  rewards staying on one target, a poor fit for auto-combat's target churn.
- **Slinger / Spirit** get Sniper (+40% attack, -30% HP, -25% plating) and Scout (+24%
  attack, +25% move, -20% HP). Both trade away the exact stat both classes are short of.
  Whether either can afford a ranged core at all is the interesting T3 question — and if
  not, that is a strong balance signal.
- **Apprentice** gets Controller (Swamp L15: +35% debuff duration, +25% potency), the most
  directly class-shaped core in the cast, plus Binding Strike. Swamp runs to L18.
- **Conduit** reaches its tier-3 skill node at player tier 4, so T3 is its range choice
  only. Catalyst core (Volcanic L3, +115% existing on-hit) composes through summon scaling.
- **Everyone** gains a second Technique. Interesting pairings are control + damage —
  Techniques share one execution channel and the driver walks the list in order, so slot 0
  is a genuine priority declaration.

**Structural decisions:** range gates seven of twelve cores and is permanent — a route that
picks it casually wastes T3. Arcanist (Mountain L17, 20% Technique CDR + 20% power) is
unrestricted and pairs with the second slot; it may become everyone's default, which would
itself be a balance signal. And `plains-vest-t2` / `plains-charm-t2` evolve into *volcanic*
T3 items — the only cross-biome lineages in the game — so neglecting Plains at T2 quietly
forecloses two T3 items.

**Automation implications:** two Technique slots with independent `fire-technique-2`
conditions; a rite loadout intent; RP arithmetic spanning runes + stance destinations +
rites in one shared budget; and Tundra's `rampDebuff` / Volcanic's Heat as biome-wide
pressure systems rather than per-monster mechanics.

---

## 6. T4 direction

The thinnest sketch. T4 is where the supplied map ends, only rank I is authored for its
abilities, and the balance work is furthest behind.

| System | Change at T4 | Tier |
|---|---|---|
| Ability slots | **2 Techniques, 2 Guards.** Simultaneous Guard mitigation sums multiplicatively, capped 0.9. | [C] |
| Skill point | The class path node — for Conduit, one of nine authored specialisations | [C] |
| Biomes | Wasteland and Trench debut; Mountain caps at 24; Cave and Swamp are gone | [C] |
| Abilities | Disengage, Recuperate (Trench); Snipe, Stunning Strike (Wasteland). Rank I only. | [C] |
| Gear | 39 items, 36 evolutions from 26 distinct T3 parents — **10 parents branch into two children each** | [C] |
| Global Mastery | Ceiling 156; gates 122 / 131 / 139 / 148 / 156 | [C] |

[SI] T4 is a **branching** tier, not an accumulating one. Ten T3 items each fork into two
T4 successors, and every successor's lifetime cost is 1.8-2.2x its predecessor's. Combined
with the second Guard slot and the path node, T4 is the first tier where two characters of
the same class can end up genuinely different. Expect *several* T4 routes per class.

**Class direction — [T]:**

- **Striker / Squire** — double Guard is worth most to a melee chassis; expect Brace paired
  with Endure (burst answer plus sustained answer) as the reference loadout.
- **Slinger** — Snipe (+300 px reach, holds position while casting) is the first tool that
  lets a ranged class open a fight it chose. The class T4 most obviously serves.
- **Spirit** — Recuperate is the weak/long Recovery Guard, deliberately holdable alongside
  Second Wind because the two use different Recovery sources. Spirit's answer to a barrier
  that does not recharge in combat.
- **Apprentice** — Wasteland is purple and corpse-themed, the DoT lineage's natural home.
  Stunning Strike is the third rung of the control ladder.
- **Conduit** — the path node is the whole tier. The only class whose T4 identity is
  authored rather than emergent.

**Must be tested before any T4 route:** whether the Void Overlord is in scope (placed
explicitly on its throne node, persisted 5-minute cooldown, described as "soft-discarded
legacy"); whether T4 trash exists everywhere it needs to; and whether rank-I-only abilities
are a deliberate plateau or an unfinished authoring pass.

---

## 7. Cross-class findings

**Routes that converge.** Striker, Squire and Conduit want nearly the same T2 route:
Mountain and Cave to L8, evolve the melee kit, Tempered core, Defensive stance, low-attack
seals. They diverge only at the frame node and Squire's Quake Hammer question. [SI] Fine
and probably intended — but it means one shared T2 progression plan can serve all three,
exactly as `durableMeleeProgression()` does at T1.

**Routes that diverge sharply.** Apprentice is the only class whose route is a single-biome
commitment. Spirit is the only class whose defining pickup is in the *recovery* slot rather
than weapon or armour. Both need bespoke plans.

**Items that look mandatory for nearly everyone — [SI]:**

- **Tempered Core** — five of six proposed routes pick it. +12% attack and +12% max HP with
  no drawback, for 45 essence, against a Force core costing 12% of a pool already too small
  and a Survivalist that only pays off with a recovery-shaped build. At current mitigation
  scale a straight HP gain dominates. Watch what happens after the mitigation pass.
- **Defensive Stance** — four of six. 1 RP for +20% plating and a -10% multiplicative
  damage-taken layer that works from zero gear DR. If the mitigation pass raises player
  defenses, this asymmetry reverses.

**Things that look like they are never worth using** (flagged, deliberately not concluded —
none of this has been tested): Tanking Stance at T2 (-40% attack may never finish a boss
inside the attempt budget); Force Core at T2; Sniper and Scout cores at T3 for the two
eligible classes; Perfection Stance; and `flee`, owned from Cave L2, deliberately excluded
from every T1 route and never revisited.

**Classes whose optimal play is hardest to automate:** Conduit (cannot issue any formation
command), Slinger (reload timing is a real decision; `tactical-reload` exists and is
unused), Squire (execution readiness is a scheduled resource; `wait-for-execution` exists
and is unused). All three have a purpose-built rune that no route equips — the most
actionable cross-class observation here.

---

## 8. Automation requirements

### REQUIRED — a route is unlikely to work without it

- **An `evolve` route step.** Emitting `crafting:evolveItem` with `{ recipeId, mode }`, plus
  `canEvolve` / `canReconstruct` conditions. Without it 21 of 29 T2 gear items are
  unreachable. Smallest form: one new `StepBody` variant, one intent method, one executor
  case.
- **Spend the skill point.** `unlockSkill` already exists and works; routes just have to
  call it. Zero new infrastructure — a route-authoring fix that also improves T1.
- **Stance craft and loadout.** `stance:craftRecipe` and `stance:setLoadout` are in the
  protocol and absent from the bot. A T2 route that ignores stances is not modelling a
  competent player.
- **RP budgeting that includes stance destinations.** `runicPointLoadoutCost` already sums
  condition + action + destination stance cost. The semantic test's RP check must learn the
  same arithmetic or it will pass loadouts the server rejects.

### USEFUL — improves reliability, may not block progression

- **Modifier-aware node selection.** An optional `modifier` field on the biome `NodeRef`.
  Catalysts only accrue on normal nodes carrying the matching family, and a full T2 kit
  needs ~8 of one family; without it the bot farms the right family about one node in five.
- **Guardian pre-clearing as an explicit step.** Squire's 29 deaths were to a dungeon
  guardian, not a boss. "Clear the guard, then disturb the altar" is a real player decision.
- **A farm-more-and-retry fallback on `attemptBoss`.** "Six attempts then stall" is not what
  a player does. "On N failures, bank M more biome levels and re-try" would turn several
  stalls into slower clears — and the difference between those outcomes is the signal.
- **Class-resource runes.** `tactical-reload` and `wait-for-execution` are owned and never
  equipped. Equipping them is free; the work is deciding channel priority.
- **Record the essence wallet in run summaries.** Currently absent, which makes every
  economy claim about T2 entry state an inference.

### SPECULATIVE — potential future optimization

- **Summon commands** (`player:commandSummons`). Needed for Conduit to play its class, but
  Conduit is the only route that cleared T1 without it, so urgency is unclear.
- **Rite loadout.** T3 only. Do not build it until a T2 route runs.
- **Per-phase behaviour changes.** Switching movement or loadout at a boss HP threshold.
  Several T2 bosses phase at 50%. This is the first item that risks crossing from
  "competent player" into "reaction times a player does not have" — the stance system's own
  1.5 s dwell is a hint about the intended granularity.

> **Design constraint restated.** The farm loop is deliberately the game's own auto-combat:
> "no bot-only tactics, no hazard avoidance, no manual dodging. The only tactical reactions
> come from equipped Runes." Every proposal above respects that — each is either a build
> decision a player makes in a menu, or a rune the game already ships.

---

## 9. Human playtest questions

A reference T2 run should answer these.

**Build decisions**

- Which **sub-variant frame** did you pick, and did you feel the difference immediately or
  only at the next boss?
- Which piece did you **evolve first** — weapon or armour — and why that one?
- Did you ever **reconstruct** rather than evolve, and was the 3.5x cost plus 2 catalysts a
  real deterrent?
- Which **core** did you equip, did you change it, and did the change register as meaningful
  or as a rounding error?
- Which **stance** became your default, and did you ever build a `switch-stance` rune rule?
  If not, why not?
- Did you keep any **T1 gear** past the point its T2 replacement was available, and which?

**Routing**

- Which biome did you enter first at T2, and did you go to **Jungle or Desert** before or
  after finishing the returning biomes?
- Where did you farm **longer than expected**, and was it for essence, biome level, or
  catalysts?
- Did the **GM 38 gate** on the first T2 upgrade register as a wall, a nudge, or invisibly?
- Did you deliberately finish **Plains and Forest to 12** before they retire, or find out
  later that you had missed them?
- Which **three seals** did you take, and did you pick them by difficulty, by proximity, or
  by what the biome gave you?

**Bosses**

- Rank the seven T2 bosses **easiest to hardest** for your class.
- Which boss **forced a Guard swap**, and what did you swap to?
- Did any boss make you change **runes** rather than gear or abilities?
- At Mountain: did the **pre-cast stun** on Earthshatter feel answerable, or unavoidable?
- At Swamp: did you fight **inside the Corrosive Pools** or reposition out of them? (They
  are permanent for the encounter.)
- At Cave: did the **plating shred** change how you played the back half of the fight?

**Things automation cannot reproduce**

- List every action that was **not** a menu choice or a rune rule — every manual reposition,
  every retreat, every decision to leave a fight.
- Did you ever **clear a dungeon guard before disturbing the altar**, and did it feel
  deliberate?
- Did you ever **retreat and farm more** after failing a boss, and after how many attempts?
- Conduit only: how often did you **command the formation**, and would the fight have gone
  differently if you could not?

**Economy**

- What was your **essence balance per colour** on arriving at T2, and again on leaving it?
- Which **catalyst family** ran short first, and did you notice before the upgrade was
  blocked?
- Did you ever consciously farm a node for its **modifier** rather than its biome?

---

## 10. Suggested future route template

Conceptual structure only. The intent is to separate the per-tier parts from the per-class
parts, and to state the entry contract explicitly instead of implying it.

1. **Entry contract.** What the character must hold before the route is valid: player tier,
   Global Mastery floor, the specific items that must be at +5 for the tier's evolutions,
   abilities known, runes owned, unspent skill points. Stated as conditions the executor can
   check, so a route refuses to start rather than stalling halfway. T1 has this implicitly
   and it caused a real bug — no route noticed the unspent frame point.
2. **Mastery floor.** The first leg is always "reach the GM the tier's own upgrades require"
   — 38 for a T2 item's +1, 80 for a T3's. Which biomes get levelled is a per-class choice;
   that the leg exists is not.
3. **Build commitments.** Decisions that are permanent or expensive to reverse, made once
   and early: skill node, core, default stance, weapon lineage. Each carries a one-line
   stated rationale in the route data, so a later reader can tell an intentional choice from
   an inherited one.
4. **Per-biome legs.** Each names the biome, the level it is taken to, *what that level
   buys*, the crafts and evolutions performed there, and the upgrade targets.
   `t1GearPlans.ts`'s `beforeShared` / `afterShared` / `afterMax` shape should survive.
5. **Boss set.** Not a fixed gauntlet. A tier needs N seals of M available, so the route
   declares an ordered preference list and a stop condition. Each entry carries its loadout
   — worn kit, ability pair, stance, rune profile — and why that loadout answers that boss.
6. **Diagnostics.** Two things T1 lacks. *Economy checkpoints:* assert an expected essence
   and catalyst position at named points, so a stall is attributed to the economy rather
   than to combat. *Stop conditions:* distinguish "failed this boss" from "cannot progress
   at all" — the current single stall reason collapses both.

**Two rules worth carrying forward:** generate routes from data and keep semantics in one
builder (`t1RouteBuilder.ts` is why a rune-ordering fix applied to all eight routes at
once — parameterise it rather than forking per tier); and assert against the generated
output, not the config object (that is what lets the semantic test catch a stale gate).

---

## 11. Unknowns and evidence gaps

### Cannot be determined from the repo

- **The essence wallet at T2 entry.** Run summaries record biome levels, deaths and item
  upgrades but not essences. Every statement about whether a T2 craft is affordable is an
  inference.
- **Whether an evolved T2 item at +0 beats its T1 predecessor at +5** on the day of the
  swap. Upgrade stat deltas were not summed for any lineage. If it does not, the whole
  "evolve early" spine is wrong.
- **Real T2 kill rates.** XP arithmetic gives ~22,500 XP per returning biome for levels
  7-12, and per-kill XP of 38-181 before the x1.25 multiplier — but density, respawn cadence
  and travel time dominate real throughput, and none of that was measured.
- **Whether a weapon DoT and a class DoT compose.** Venom Knife converts 50% of attack to
  poison; the Apprentice's frames convert 30-70%. Whether these stack, override, or occupy
  separate effect ids was not traced.
- **Whether on-hit distributes across a Conduit formation.** Read at doc level only.
- **Whether Reload's halved per-shot damage interacts badly with flat on-hit or DoT
  conversion.** The reload multiplier is a final stat layer; where on-hit sits relative to
  it was not verified.

### Known-stale or contradictory documentation found during this pass

- `gameConfig.ts`'s `biomeLevelCap` doc comment says four levels per tier;
  `BIOME_LEVELS_PER_TIER` is 6. Its worked examples are wrong throughout.
- `biomeXpForLevel`'s worked example says level 6 costs 1,800 XP; the formula gives ~3,774.
- `t1Common.ts` says one T1 boss advances the tier; two seals are required.
- The T2 economy ledger describes a boss `catalystBundle`; no such field exists.
- `T1_FINAL_VALIDATION_HANDOFF_2026-08-30.md` says Cave has no relevant debuff; it has a
  cleansable plating shred.
- `socketEvents.ts` says `crafting:evolveItem` consumes the "+3 predecessor";
  `EVOLUTION_REQUIRED_PLUS` is 5.
- The Forest T1 boss comment carries an explicit "STALE" marker on its own DPS figures
  after the 2026-08-29 enrage removal.

### Deliberately not investigated

Party play and `grantMonsterRewards`; relics, seals presentation, quests beyond the tier-0
tutorial, and the Void Overlord; any live server state.

---

## 12. Candidate next experiments

Five, ordered by information per unit of effort. None launched.

1. **Re-run the six T1 baselines with the frame pick and the Cave guard fix.** Both changes
   are small and one is already in the working tree. The cheapest way to find out whether
   the current 1-of-6 result is a balance problem or a route problem — and the answer
   changes everything downstream.
2. **Instrument the essence wallet in run summaries.** One field. It converts every economy
   claim in this document from inference to measurement.
3. **A single human T2 reference run, one class, recorded against §9.** Striker or Squire —
   the two whose T2 route this document is most confident about, so the recording tests a
   real hypothesis rather than exploring blind. Highest-value single answer: does a player
   go to Jungle/Desert first, or finish the returning biomes?
4. **Isolate the Forest boss against the two light chassis.** Same boss, evasion armour vs.
   plating armour, at matched upgrade level. Separates "the boss is on the plating cliff"
   from "the routes put the wrong armour on these classes." The boss's own source comment
   predicts the former.
5. **Build the evolve step and prove it on one item.** Not a route — a single scripted
   sequence: take a +5 Chaotic Axe, evolve it into a Ruinous Axe, confirm the predecessor is
   consumed and the stats land. That one proof unblocks T2 route authoring entirely.
