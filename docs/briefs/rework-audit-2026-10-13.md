# Class-first rework — system audit (2026-10-13)

**Status:** AUDIT, read-only. No code changed. This is step 1 of the brief's workflow.
**Against:** develop `591398fe` and the brief
[class-first-rework-brief-2026-10-13.md](class-first-rework-brief-2026-10-13.md) (with its
addendum of the designer's same-day calls). Production is master `52248e2c` (v0.6.2).
**Recovery point:** the tag `pre-rework-2026-10-13` (= `591398fe`, pushed) holds everything
this audit proposes to remove.

## What the audit found

1. **The item passive trees never shipped.** Master (v0.6.2) has no `shared/src/data/lineages/`
   and no `shared/src/data/abilityNodes/`. Both arrived on develop with the progression
   rework (merged 2026-10-03, after v0.6.2). No real player's save holds a lineage, a shard
   or an ability row; only dev and bot databases do. Scrapping them costs nothing in save
   compatibility. The same is true of mob families, frame loops and range mechanics:
   develop-only.
2. **The brief's progression is the current Passive Tree's shape.** Today every class has a
   root (node tier 0), three frames (tier 1), three range nodes shared by all its frames
   (tier 2), and three paths under each frame (tier 3): 3 + 3 + 9 = 15 nodes per class, 96
   with the roots. That is exactly Discipline / flat pick / Mastery. The unlock gate
   (`shared/src/systems/skills.ts`), reset, persistence and the Passive Tree panel are kept;
   the content of every node is replaced.
3. **The weapon tree is big but sits at the edge of the code.** It is 65 source files and
   ~16,900 lines, and the ability node rows add 38 files and ~7,600 lines. The two are
   tangled with each other (ability rows reuse the lineage payoff vocabulary), but both
   reach the rest of the game through a short list of named seams (table below). There is
   also a switch already built: a lineage marked `parked: true` loses its tree and gates
   and its items become plain recipes. 15 of the 20 lineages (all armor, charm and boots)
   are parked today. Parking the five weapon lineages switches the trees off with a data
   change; deleting the code can follow.
4. **The expensive parts are the two things that use every system at once.** The guided
   tutorial (`shared/src/tutorial/`, where `classScript.ts` is the single heaviest user of
   lineage names) and the bot (`bot/`, 149 files; the route executor, tier-entry profiles
   and T2 routes buy lineage cards). Both need rewriting. The bot is the balance pipeline
   the brief keeps, so it has to be rebuilt early in the slice, not at the end.
5. **The brief overturns six written rules and is silent on six systems.** Both lists are
   below. The rules need explicit amendments in the new bible, or agents will "fix" the new
   design back to the old rules.

## Inventory and verdicts

"Prod" = present on master (v0.6.2). Verdicts follow the brief where it speaks; where it
is silent the verdict is marked *proposed*.

### Kept untouched

| System | Prod | Note |
|---|---|---|
| Combat engine, hit pipeline, `CombatContext`, deterministic dodge counter | yes | Brief: deterministic combat stays |
| Defense pipeline (plating, DR, evasion, damage cap, DoT DR share) | yes | The shared armor bases keep expressing these (see open call 1) |
| Flat Recovery | no | Kept as the baseline; per-class recovery goes on top |
| Monsters: combat rework, behavior, targeting; the six new mobs | yes / no | Brief: mobs unchanged |
| Families and node variants (zone modifiers) | no | Brief: keep and extend; each family drops specific item bases |
| Bosses (encounters, boss lineages) | yes | Brief: keep; staging for Squire responses and Frost/Execute |
| World, biomes, dungeons, seals and tier advancement | yes | The walking between seals (playtest 3: 6.5 of 10 minutes) is a separate problem |
| Combat readout, animation, sprites, audio | partly | Player looks are keyed to T3 path ids; they get remapped to the new Masteries (salvage) |
| Auth, telemetry, admin, party | yes | |

### Kept machinery, new content

| System | Prod | What changes |
|---|---|---|
| Passive Tree machinery (`skillTree/`, `skills.ts`, panel) | yes | All 90 non-root nodes replaced (18 frames → Disciplines, 18 range nodes → flat picks, 54 paths → Masteries) |
| Class roots (6) | yes | Four of six core mechanics change (Striker five-hit cycle → decaying Momentum; Squire timed execution → Resolve; Spirit barrier → energy as shield; Conduit weapon-scaled summons → roles). Slinger and Apprentice change in detail. See conflict 6 |
| Crafting, recipes, essences | yes | Kept (designer). Weapon and relic recipes filter by class; the craft result gains random affixes (proposal for the loot section) |
| Rune engine (conditions → actions, AI consumers) | yes | The engine drives the six custom systems. Its universal orders (Flee, Recover First, Avoid Hazards, focus) become free; the class-only actions that exist today (Spread DoTs, Reload Safely, Ready Execution, Rebuild Formation) are the seeds of the class systems |
| Conduit formation profile (`resolveSummonerProfile`) | yes | Kept as the one place that turns a build into a formation; the weapon-translation contract is reversed (conflict 4). The existing T4 bodies (Kilnmaster, Idolwright, Colossus…) are salvage for roles |
| Item `+N` upgrades | yes | Kept; Global Mastery still sets the ceiling (Tentative) |

### Rework

| System | Prod | Today | Brief |
|---|---|---|---|
| Abilities | yes | 19 shared (11 Techniques + 8 Guards) with class adapters, crafted from recipes, attuned with Runic Points, fired only by the Use Ability rune | Class-specific, from progression, plugged into the class system. The casting/firing engine, control ladder and per-ability FX modules are salvage |
| Weapons | yes | Five class-agnostic archetypes (Broadsword, Rapier, Hammer, DoT conversion, Chaotic Axe) | Class-specific weapons |
| Armor, charm, boots | yes | Shared, one budget per slot | Shared with cross-budget tradeoffs; per-class expression is open call 1 |
| Relics | yes | One universal relic, four ratings read per class, unlocks at T4, mastery-only, no drops | Class-specific, modifies the class mechanic. Proposed: arrives at T2 with the Discipline |
| Rewards | yes | Deterministic: essence, shards, boss materials | Random drops steered by families, rerolls and pity |
| Damage over time | yes | Attack conversion, front-weighted stack curve, DoT weapons for any class | Class DoT weapons (stacks, tick speed, spread); curve scrapped (Tentative) |
| Global Mastery | yes | Gates the upgrade ceiling, Runic Point capacity, the T1 verb and lean ranks | Only the upgrade ceiling is left. Proposed: hide behind tier wording |
| Guided tutorial | yes | Teaches leans, verbs, shards, runes, abilities | Rewritten per class |
| Bot harness | partly | Routes buy lineage cards and ability attunements | Routes and profiles rebuilt; it is the balance pipeline |

### Scrap

| System | Prod | Note |
|---|---|---|
| Item lineage trees: leans, verbs, packets, amplifiers, keystones, cross rows, form gates, the weapon page, payload FX, rhythm readout | no | The weapon page's layout (an "in the fight" sentence, the choice cards with their cost) was the clearest screen in playtest 3. Reuse the layout for the new item card |
| Ability node rows and ability keystones | no | Neither the guide nor the bots buy a row today; only the client panel can |
| Shards (nine packet currencies) | no | The family → drop pipe is salvage for a per-family pity token |
| Runic Points and attunement (the shared budget) | yes | |
| Cores (12, one slot) | yes | Small: 2 owned files, ~190 lines; the `core` equipment slot leaves the slot type |
| Frames: content and frame loops | yes / no | Frame loops are develop-only |
| Range nodes: content, range mechanics, the range override in `isMeleeArchetype` | yes / no | Melee or ranged becomes fixed per class |
| T3 paths (54): content | yes | Many mechanics are good Mastery material; mine them, don't port them |

### The brief is silent: proposed verdicts

| System | Prod | Proposed |
|---|---|---|
| Stances | yes | Scrap. Modal postures overlap Disciplines and the custom systems, and they were paid with Runic Points |
| Rites | yes | Scrap, or fold the useful ones into a class system. Also paid with Runic Points |
| Boss materials | yes | Their main sink (lineage form gates) goes. Proposed new job: the pity currency's top tier, or relic crafting |
| Conduit manual commands (`player:commandSummons`, recall) | yes | Keep or drop is a call: the bible says "fully auto", and the Formation system may make them unnecessary |
| Charge/kite toggle | yes | Keep; it is the one universal combat lever |
| Character saves at the rework release | — | Wipe proposed. Production saves are v0.6.2: they hold stances, rites, Runic Points and cores, all scrapped |

## Footprint of what gets scrapped

"Owned" files are deleted whole. "Touch points" are other source files that use a name an
owned file exports, i.e. the files that need an edit when it goes. Measured on `591398fe`
with a script that collects every exported name of six or more characters from the owned
files and searches the rest of the tree for it (tests counted separately).

| System | Owned source files | Owned lines | Touch points (shared / server / client / bot) | Test files touching it |
|---|---:|---:|---|---:|
| Item lineage trees | 65 | 16,868 | 26 / 49 / 36 / 10 | 55 + 4 owned |
| Ability node rows | 38 | 7,638 | 7 / 23 / 14 / 0 | 9 + 1 owned |
| Stances | 6 | 1,395 | 11 / 11 / 19 / 8 | 29 |
| Rites | 5 | 488 | 4 / 7 / 10 / 7 | 15 |
| Runic Point budget | 3 | 189 | 2 / 8 / 5 / 2 | 17 |
| Frame loops | 7 | 1,638 | 0 / 11 / 0 / 0 | 6 |
| Range mechanics | 1 | 412 | 0 / 1 / 0 / 0 | 1 |
| Cores | 2 | 186 | 3 / 2 / 5 / 1 | 2 |

Most touch points are imports and reads that disappear with the system. The ones that
carry real logic, for the item trees and ability rows:

| Seam | File | What it does today |
|---|---|---|
| Combat listeners | `server/src/systems/combatBootstrap.ts` | Registers the lineage card listeners (two) and the ability-node listeners (two) |
| Attack speed | `server/src/systems/combat/engine/attackCadence.ts` | Adds a card's `speed-window` bonus to the attack-speed sum |
| Mechanic events | `server/src/systems/combat/engine/mechanicFired.ts` | The lineage cards are its only listener |
| Stat recalc | `server/src/ecs/playerEntityFormulas.ts` | Refreshes the card runtime cache on every recalc |
| Crafting and equipping | `server/src/systems/player/economy/crafting.ts`, `inventory.ts` | Crafting a T1 base takes the slot's lineage; equipping a form moves the worn form; T2+ forms are gated |
| Rewards | `server/src/systems/player/progression/rewards.ts` | `grantLineageMaterials`: shards per kill and the boss capstone material |
| Persistence | `server/src/db/playerRepo.ts` | Normalizes `holdsInventory.lineages` and the shard wallets; refunds retired cards. JSON inside the inventory slice, no table of its own |
| Presentation | `client/src/ui/stats/statsPanelModel.ts`, `client/src/render/combatFx.ts`, `client/src/fx/auraDefs.ts`, the materials panel | Show leans, verbs, card FX and shard chips |

## Removing the weapon tree: an order of operations

A plan, not an authorization: the brief allows no code edits until the items section of
the bible is locked.

1. **Park the five weapon lineages** (`parked: true` in each weapon file). Weapons become
   plain recipes with no tree and no gate; the game runs without the trees. This is also a
   clean baseline for the bots before anything new lands.
2. **Stop granting shards** in `rewards.ts`; drop the shard chips from the materials panel.
3. **Delete the runtime:** `lineageCards.ts`, `lineageKeys.ts`, `leanConditions.ts`,
   `rhythmReadout.ts`, `keystones/` and the ability node runtime; remove the four
   registrations, the speed-window term and the recalc refresh.
4. **Delete the data and the client:** `shared/src/data/lineages/`,
   `shared/src/data/abilityNodes/`, `client/src/ui/lineage/` (keep the weapon page layout
   as a reference), the payload and keystone FX. The save normalizer drops `lineages` and
   the shard wallets, or the dev databases are wiped.
5. **Delete or rewrite the tests**: roughly 60–70 of the 404 test files touch the trees or
   the rows.

Stances, rites, the Runic Point budget and cores come out the same way, but they shipped,
so they ride on the save-wipe call.

## Where the brief overturns a written rule

1. **"Deterministic. No RNG."** ([design-bible.md](../../design_docs/design-bible.md) §1)
   becomes deterministic combat, random rewards.
2. **Separated offense and defense budgets** (bible §1; the ability axiom "no defense scaling
   with offense") is broken by Glass Duster, Juggernaut (armor/HP → damage) and Spirit
   (spending lowers defense). The budget index (offense × defense, bible §7) still prices
   these trades. The old rule existed to stop a loop where stacking defense *is* stacking
   offense; it needs a replacement guardrail, not just deletion.
3. **"Biome = one theme expressed three times"** (bible §3) and the five class-agnostic
   weapon archetypes (bible §6) end with class weapons. The replacement rule is family →
   item base.
4. **Conduit's locked contract** ([summoner-overhaul-design-source.md](../../design_docs/archive/summoner-overhaul-design-source.md)
   §4.2: the weapon sets summon damage and cadence) is reversed by the designer's call that
   the weapon sets the summon budget split and role buffs.
5. **Relics** ([relics-current-state.md](../relics-current-state.md)): universal ratings,
   T4 unlock and mastery-only acquisition all change.
6. **"T1 Class. Unchanged."** (brief, Progression) holds for the pick, not the content: the
   class reworks table changes four of the six T1 mechanics. The T1 class section of the
   bible is new work, not a carry-over.

**Names that collide.** Brief names already used by current ids: Flurry (Striker light
frame), Bulwark (Squire heavy frame), Juggernaut (a Striker T3 path), Crescendo (a Striker
T3 mechanic), Overflow (an ability keystone). Names can be reused; ids should not be, so a
stale save or test can never resolve to the new node.

**Design docs the bible will supersede** (archive with a header, don't delete):
`progression-rework-design.md`, `T1_ITEM_DESIGN_PHILOSOPHY.md`, `T1_ITEM_NUMERICAL_BASELINE.md`,
`ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`, `CORE_DESIGN_PHILOSOPHY.md`, `CORE_T4_CAST.md`,
`CORE_CAST_REVIEW_DRAFT.md`, `summoner-overhaul-design-source.md`, `relics-design.md`; and
amend `design-bible.md` §1, §3, §6, §9, §10.

## Open calls for the designer

**Answered the same day** (details in the brief's addendum, second round): 1 shared bases
with class affixes; 2 stances and rites scrapped as shared systems, class-specific
equivalents decided per class; 3 wipe; 4 deferred until the item system exists; 5 the
Formation system probably replaces the commands, a recall button and ability probably
stay; 6 relics come earlier and are redesigned per class, timing decided per class. The
list below is the original wording.

1. **Armor, charm, boots: shared or per class?** Recommended: shared bases, class affixes.
   The base is a biome's defensive mechanic (plating, evasion, damage cap, DoT resistance,
   %DR), already balanced by the defense rework, and the family that drops it picks it.
   Affixes and the legendary rule-bender roll from your class's pool (smart loot), e.g. a
   Squire's plate rolls Resolve lines. Five bases authored once, plus about 8–12 affixes per
   class per slot, instead of 30 item lines. Boots stay generic.
2. **Stances and rites:** scrap (recommended), or fold into the class systems?
3. **Save wipe at the rework release:** recommended, since every scrapped system that
   shipped lives in v0.6.2 saves.
4. **Boss materials' new job** once the form gates are gone.
5. **Conduit manual commands:** keep, or let the Formation system replace them?
6. **Relic at T2** with the Discipline, instead of T4?
