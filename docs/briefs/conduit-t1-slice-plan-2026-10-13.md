# Conduit T1 slice plan (2026-10-13)

**Status:** PLAN. Step 3 of the rework workflow in the
[brief](class-first-rework-brief-2026-10-13.md). No gameplay code has been written for it.
**Build authority:** [class-first bible](../../design_docs/class-first-bible.md) §7 (Conduit,
Locked 2026-10-13, commit `4f889bab`), with §1–§4 as cross-class drafts.
**Against:** develop `ad09f5cc`. Code facts were read on that commit.
**Where:** branch `feat/class-first-conduit`, worktree `../mmo-class-first-conduit`.
**Strategy (designer's call, 2026-10-13): strangler.** New systems run beside the old ones,
so the other five classes keep working until their sections lock; the old systems are
deleted last. §1 sets the rules.

**What "T1 slice" means.** A fresh Conduit plays from the Clearing through the five T1 biomes
and its two seals to the T2 promotion, on the new design, while the other five classes play
exactly as today.

| In the slice | Out of the slice (each has its own later slice or session) |
|---|---|
| Command and its Global Mastery steps; the roster; the four Thralls; the five T1 specialists and binding them; the five T1 Souls in the relic slot; the free orders and Recall; monster debuffs landing on summons; no default damage sponge; six Conduit weapons; Conduit lines on the T1 armors and charms; the HUD; the Formation screen; the Conduit tutorial; the bot route; a T1 bot comparison against the other five classes | T2+ (disciplines, specializations, leaves, variants, Soul ranks, Two Souls); components and sockets (§4, under review); random drops; raising the summon cap (§5 shows T1 does not need it); new art (stand-in bodies only); balance (every number is a placeholder the designer tunes) |

## Contents

1. Strangler rules and the seam ledger
2. Every §7 item a playable T1 Conduit needs, mapped to code
3. What depends on unsettled shared sections, and the stand-ins
4. The ordered task list (OPUS / DELEGATE), with the delegate briefs
5. Measurements: what 12, 20 and 30 summons cost
6. Design questions for the designer

---

## 1. Strangler rules and the seam ledger

1. **One switch.** A new `shared/src/classFirst.ts` exports
   `CLASS_FIRST_ARCHETYPES: ReadonlySet<CombatArchetype>`, holding only `'summoner'` for now,
   and `isClassFirst(archetype)`. Every place where the Conduit and the other five classes
   go different ways asks `isClassFirst`. Grepping that one name finds every seam. A later
   class joins the set when its own slice lands; the set and every branch on it are deleted
   when the sixth class lands.
2. **The Conduit is replaced in place, never kept twice.** Its old content (frames, range
   nodes, the nine specializations, the frame loop, line holds, the default damage sponge,
   manual focus and move commands, the formation delivering shared abilities, Battle Bond's
   direct attack) is deleted inside the slice, with its tests. Only shared systems the other
   five still use live on beside the new ones. A develop Conduit at T2+ has no picks until
   the T2 slice; the save wipe (brief addendum) makes dev and bot saves disposable.
3. **New behaviour hangs off new components**, per the ECS rules: `commandsFormation` (roster
   and orders) and a minion status layer. The switch only gates *shared* systems.
4. **Merge at milestones** (M1–M5 in §4), each one with the T1 Conduit playable as far as it
   goes and the full suite green, so `develop` never carries a half-built Conduit for long.
5. **The ledger below is the deletion checklist.** Each task that adds a seam adds its row;
   the last class's slice deletes the old path of every row.

| # | Seam | Where | Class-first path | Old path kept for |
|---|---|---|---|---|
| L1 | Rule cost (Runic Points) | `shared/src/runeDatabase.ts` `runeRuleCost`, `shared/src/runicPoints.ts` (`runicPointLoadoutCost`, `runicPointEditAllowed`), the client's budget readouts | Every rule costs 0 (bible §3, "Rules cost nothing", Decided) | 5 classes |
| L2 | Ability crafting and attunement | `server/src/systems/player/economy/abilityCrafting.ts`, `client/src/ui/AbilitiesPanel.tsx` | Refused / hidden: the Conduit's abilities are its summons' (§7.8) | 5 classes |
| L3 | Stances and rites | `stanceCrafting.ts`, `riteCrafting.ts`, their panels | Refused / hidden (§7.11: none) | 5 classes |
| L4 | Relic slot gate | `shared/src/systems/relics.ts` `relicIsUnlocked`, `inventory.ts` `equipItem` | Open from the first boss clear (§4, Decided) | T4 gate |
| L5 | Recipes offered (smart loot) | `rewards.ts` `checkRecipeUnlocks`, `crafting.ts`, the client crafting list | Only recipes whose `classes` include the class, plus classless non-weapon bases | Classless weapons |
| L6 | Class lines on shared armor and charms | the stat rebuild (`playerEntityFormulas.ts`) | Applies `classLines[archetype]` | No line |
| L7 | Passive Tree beyond the root | `shared/src/systems/skills.ts` `canUnlockSkill`, `SkillTreePanel.tsx` | Conduit nodes past the root locked until the T2 slice | 5 classes |
| L8 | Orders compiled into rules | `server/src/systems/combat/ai/runeConfig.ts` `updateRuneDerivedConfig` | Formation orders become rules before `deriveAutoConfigFromRunes` | 5 classes (runes only) |
| L9 | Tutorial builder | `shared/src/tutorial/scripts/index.ts` `tutorialScriptFor` | `buildConduitBeats` | `buildClassBeats` |
| L10 | Bot routes | `bot/src/routes/index.ts`, the T2+ Conduit routes | `conduit-t1` v3; Conduit T2+ routes retired | 5 classes |

Not seams: code that already branches on the summoner archetype (`syncArchetypeSlices`,
`CannotAttack`, `world.summonerPlayers`) belongs to the Conduit alone and simply changes.

---

## 2. What a playable T1 Conduit needs, mapped to code

Paths are relative to the repo root. "New" marks a file that does not exist yet.

### 2.1 Budget, roster, rebuilds

| §7 item | Data (shared) | Components | Server | Client / protocol |
|---|---|---|---|---|
| Command is the budget; grows with Global Mastery in steps (T1 4 → 6); the weapon adds or removes some (§7.2) | New `shared/src/data/conduit/command.ts`: `COMMAND_STEPS`, `commandFor(globalMastery, passives)`. Global Mastery is `globalMastery(biomeLevel)` (`shared/src/config/gameConfig.ts:509`): 6 levels × 5 T1 biomes = 30 at the end of T1 | — | Read by the profile and roster validation | Pips on the HUD and the screen |
| Every summon costs Command; cost buys power (a 2-cost ≈ two 1-costs) | New `shared/src/data/conduit/summons.ts`: `SummonTypeDef` (id, role, Command, attack mode, row, stat multipliers, ability, body) | — | — | Cards on the screen |
| The roster: which summons you field, within Command; role sets the row (§7.3) | `validateRoster`, `rosterCost`, `defaultRoster` (§7.13's order) | New `commandsFormation` slice `{ roster: string[]; orders }`, persisted and sent to the owner | `summonerPrototype.ts` `reconcileMinionSlots` builds slot ids `<typeId>#<n>` from the roster; `spawn.ts` follow offsets by row instead of the even ring | New intent `formation:setRoster` + result |
| Every summon's stats scale with the Conduit's tier (§7.2) | `SUMMON_UNIT_BY_TIER` × the type's multipliers | — | The profile reads `tracksProgression.playerTier` | — |
| One rebuild queue, HP cost ∝ summon HP, 20% floor (§7.2) | Today's `SUMMONER_CORE_TUNING` values move with the rest | `summonsMinions` (kept) | `reconstruction.ts` kept; the cost already reads the slot's own max HP | — |
| Rebuild order by role (an order, §7.3) | Order vocabulary | `commandsFormation.orders.rebuildFirst` | `enqueueSummonReconstruction` sorts the queue by it | — |
| HUD: Command pips, the bodies, the queue with the next rebuild's HP cost (§7.2) | New `projectFormationHud` beside `projectSummonSlots` in `shared/src/systems/summonerHud.ts` | — | — | `client/src/hud/mechanics/SummonerMechanic.tsx` |
| No design cap; 9 is a tuning number (§7.2) | `hardEntityCap` stays 9 for T1 (most T1 bodies: 6 Command + the Soul + the Cave Soul's spiderling = 8; §5) | — | — | — |

### 2.2 The pieces: Thralls, specialists, binding

| §7 item | Data | Server | Client / protocol | Reuses |
|---|---|---|---|---|
| Four Thralls at the start (§7.4) | `thrall` in `summons.ts`; always bound | Class pick sets the default roster | — | Today's root body `conduit-summon` |
| Plains tank: plating; a short sweep taunts the enemies around it | Type `plains-tank` (tank, 1 Command, melee, front row), ability `sweep-taunt` | New summon ability runtime | Sweep FX | `setAggroTarget` (`server/src/systems/combat/ai/targeting.ts`), the taunt rule in `taunt.ts` |
| Forest bruiser: fast melee, little HP | `forest-bruiser` (damage, 1, melee, middle row) | — | — | — |
| Swamp spitter: ranged support; its acid strips the target's plating | `swamp-spitter` (support, 1, ranged, back row), ability `acid-shred` | Applies the monster status `plating-shred` | Spit FX | `effectivePlatingAfterShred` (`server/src/systems/combat/damage/effectivePlating.ts`) already reads it |
| Mountain marksman: ranged power shot from the back row, little HP | `mountain-marksman` (damage, 1, ranged, back row), ability `power-shot` | Empowered summon hit | Shot FX | `runFormationAttack` with `empowered` metadata |
| Cave heavy: 2 Command, the first multi-Command summon | `cave-heavy` (tank, 2, melee, front row) | — | — | — |
| A tank's taunt holds a boss (§7.3) | `role: 'tank'` | Tank default: its hits taunt, on a cooldown per tank | — | `taunt.ts` (today's rune-driven taunt, moved onto the role) |
| Bound at a zone level, as that zone's class recipe, before its boss (§7.4, §7.8; cost follows the recipe pattern, Tentative) | New `shared/src/data/conduit/bindRecipes.ts` (zone, level, essence) | New `server/src/systems/player/economy/summonBinding.ts`, modelled on `abilityCrafting.ts` | New intent `summon:bindRecipe` + `summon:bindResult` | Zone levels already gate recipes (`requiredBiomeLevel`) |
| Attack modes (melee 18, reach 96, ranged 190) per type (§7.14) | Values from `SUMMONER_RANGE_TUNING` move onto the type | `ai.ts`: ranged types keep today's Harrier retreat | `SUMMON_ATTACK_STYLE` per mode | — |

### 2.3 Orders and Recall

| §7 item | Where | Notes |
|---|---|---|
| Attack first: what attacks the Conduit / closest / weakest / elites and bosses (§7.3) | Compiled into one TARGETING rule at `deriveAutoConfigFromRunes` (`runeConfig.ts`) | `focus-closest`, `focus-lowest-hp`, `focus-elites` exist. "What attacks the Conduit" is new: a Conduit-only TARGETING action scored with the existing `isAggroedOnPlayer` helper (`server/src/systems/combat/ai/targetPriority.ts`). Summons already follow the owner's TARGETING rule (`inheritedRuneTarget`, `ai.ts`) |
| Tanks guard: the Conduit / the back row | Tank target choice in `ai.ts` | Tanks prefer enemies whose aggro is on the guarded group, then taunt them |
| Recall: a button and a free rule (§7.3) | `player:recallSummons` (exists, R); the rule compiles to `recall-summons` (exists) | Rule options from existing conditions: Conduit HP low (`hp-below-25`), formation broken, enemy charging, never |
| Rebuild first: tanks / damage / supports / in the order they fell | §2.1 | — |
| Universal orders (Flee, Recover First, Avoid Hazards) free (§3, Proposed) | The rune editor stays, every rule costs 0 (ledger L1) | Step Back stays a free rule for the Conduit's own movement; summons step out of telegraphs by default, no longer only when the owner holds Step Back (§7.14, "summon behaviours"; S1.3) |
| Not in it: tactics, Conduit casts beyond Recall, per-summon AI (§7.3) | Remove `player:commandSummons` (focus and move) and `command.ts`'s focus/move paths; keep Recall | Ledger L2, L3 |

### 2.4 Defense

| §7 item | Where | Notes |
|---|---|---|
| No damage redirection by default (§7.10) | Stop registering `registerSummonerDamageSponge` in the defense bootstrap (`server/src/systems/combatBootstrap.ts`) | Keep `redirectDamageToMinion` for the Mountain armor line |
| Monster debuffs land on summons (§7.10, build task) | `runMonsterAttackOnMinion` (`server/src/systems/combat/engine/combat.ts:1973`) today skips every rider | The riders live in `runMonsterAttack` (`combat.ts` ~900–1060: `appliesMark`, `cadenceFinisher.rootMs`, `slowEffect`, `appliesAntiheal`, `appliesVulnerability`, `appliesPlatingShred`, `rampDebuff`) and `applyMonsterDotToPlayer` (`server/src/systems/combat/status/monsterDot.ts`). Minions have `tracksCombat` and `hasStatus`, but **nothing ticks a minion's statuses**: `updateCombatState` (`combat/engine/combatState.ts`) loops players and monsters only, and DoT ticks read `world.dottedPlayers` / `dottedMonsters`. T1 riders that matter: Swamp `dotEffect` (7 defs), `slowEffect`, `appliesAntiheal`; Forest and Cave `dotEffect`; Mountain `cadenceFinisher` root |
| Kept: summons copy plating and DR; summon hits pay half plating; N^-0.5 area sharing (§7.10) | `spawn.ts` `computeMinionMitigation`; `combat.ts` `ctx.platingMult = 0.5`; `formationArea.ts` | Unchanged |
| Monster targeting unchanged (§7.10) | `monsterTargeting.ts` | Unchanged |

### 2.5 Souls and the relic slot

| §7 item | Where | Notes |
|---|---|---|
| A free boss summon held in the relic slot, from the first T1 boss kill (§7.2, §4) | Five Soul items (`slot: 'relic'`, `classes: ['summoner']`) granted on a boss clear in `applyKillRewardsToPlayer` (`server/src/systems/player/progression/rewards.ts`), which already records `bossesCleared` | Relic gate: ledger L4 |
| The Soul fields a body at 0 Command | Profile adds a `soul` slot when the relic slot holds a Soul | Body: a stand-in from the 13 existing summon bodies, never the boss's sprite |
| Five T1 bonuses, seed lines as written (§7.8, §7.15 item 5) | New `server/src/systems/classes/archetypes/summoner/souls.ts` | Plains: every 10 s the melee summons charge the focus target. Forest: summons heal slowly in a fight. Swamp: a summon death leaves a bile pool that hurts enemies (see question 2). Mountain: a tank's taunt also shields it. Cave: every 6 s a spiderling appears for 8 s (temporary summons are new: not in the roster, never rebuilt) |
| Named after the lineage (Proposed) | Razortusk, Timberclaw, Mire Behemoth, Stoneplate, Dreadbore Souls | The names come from §7.16's T2 table; they are placeholders |

### 2.6 Items

| §7 item | Where | Notes |
|---|---|---|
| Smart loot (§4, Decided) | New `classes?: CombatArchetype[]` on `Recipe` (`shared/src/data/recipes/types.ts`) and `ItemDefinition` (`shared/src/items.ts`) | Ledger L5. Precedent: runes already carry `requiredArchetype` |
| Weapon shapes the formation: potency, Command ±, a role bonus; T1's five jobs + the tutorial's generic one (§7.4, §7.9) | Six weapon recipes, one in each of `clearing/plains/forest/swamp/mountain/cave.recipes.ts`, with `classes: ['summoner']` and `conduit.*` mechanic effects | Clearing: potency. Plains: more Command, softer hits. Forest: less Command, faster attacks. Swamp: summon hits stack poison (a `weaponDot` profile: formation hits already apply weapon DoTs; the old Conduit measured on the Plague Axe). Mountain: stronger summon abilities. Cave: less Command, harder hits |
| Armor: who tanks, as a Conduit line on the shared bases (§7.4, §4) | New `classLines?: Partial<Record<CombatArchetype, MechanicEffects>>` on the six T1 armor recipes | Ledger L6. Plains: plating for the summons. Forest: Bramble thorns on summons. Swamp: poison on you moves to a summon. Mountain: a hit over 30% of your HP goes to the nearest tank. Cave: you tank. `conduitDefenseShare` (authored, no consumer today) becomes the share the summons copy |
| Charm: who recovers (§7.9, lines Decided) | Same `classLines` on the five T1 charms | Herd (faster out-of-combat rebuilds), Sapbark (summons regenerate after a few seconds unhit), Bloodtithe (a dead summon refunds part of its rebuild HP), Cairnstone (Recovery ×3 for a few seconds after a big hit), Deep Reserve (two rebuilds at once) |
| Boots generic (Proposed) | Unchanged | — |
| `+N` upgrades | The existing per-recipe `upgrades` steps | Conduit steps raise potency or the line's number; same costs and gates as today |

### 2.7 HUD, the Formation screen, visuals

| §7 item | Where | Notes |
|---|---|---|
| The Formation screen (§7.3; v1 mockup, partly superseded) | New `shared/src/systems/formationView.ts` (`composeFormationView`) + a new React panel under `client/src/ui/formation/` | The panel reads only the view; intents go through the client's intent helpers |
| Stand-in bodies | `MinionMonsterType` (`shared/src/components/archetypes/summoner/isMinion.ts`), `frameMaps.ts` | 13 existing bodies cover Thrall + 5 specialists + 5 Souls + the spiderling (§4, brief S4.3) |
| Ability FX | `client/src/render/combatFx.ts`, `client/src/fx/conduitSummon.ts` | Events through `world.pushEvent`, never per-tick flags |

### 2.8 Bot harness and tutorial

| §7 item | Where | Notes |
|---|---|---|
| Harness intents: set the roster, equip the relic, set the orders incl. Recall (§7.13) | `bot/src/route/types.ts` and `executor.ts`: new step kinds `bind`, `roster`, `orders`; the relic uses the existing equip step | The bot imports only `@mmo-idle/shared`, never server internals |
| Defaults: bound specialists in role order (tank, damage, damage, support), then the Cave heavy | `defaultRoster` in shared, used by new characters, the bot and the tutorial | One function, three users |
| Metrics: `formationAttrition`, time to kill, Conduit deaths | `bot/src/telemetry/summary.ts` (`formationAttrition` exists) | — |
| The old manual commands and the Step Back / Taunt runes go (for the harness) | `bot/src/routes/classRecovery.ts` (Rebuild Formation in Recover First's slot), `conduitT1.ts`, `conduitV2T1.ts`, the Conduit lanes in `tierEntry/profiles.ts` | Retire the T2+ Conduit routes |
| The first ten minutes: four Thralls, Command 4 as pips, orders pre-set, Recall on R; the Plains tank around minute 6; the first Soul from the first boss (§7.4) | `shared/src/tutorial/scripts/`: a Conduit plan and builder beside `classScript.ts` (987 lines, built on lineage cards) | Ledger L9. Needs new tutorial conditions: summon bound, roster contains, Soul equipped |

### 2.9 What is removed from the Conduit (§7.14)

| Remove | Files |
|---|---|
| Weapon Attack and cadence turned into summon damage | `spawn.ts` (`attack`, `attackCooldown` from the owner), `summonerPrototype.ts` `syncLiveMinionFrameStats`, `combat.ts` (`player.dealsDamage.attack * minionDamageMult` for formation hits) |
| Frames, range nodes, the nine specializations | `shared/src/data/summoner.ts` (frame, range and specialization tuning), `shared/src/systems/summonerProfile.ts`, `specs/`, `frameLoop.ts`, `lineHolds.ts`, `range.ts`, the summoner nodes in `shared/src/data/skillTree/` (locked, then deleted with the T2 slice). `observation.ts` stays: the benches read it |
| The default damage sponge | `damageSponge.ts` registration |
| `hardEntityCap: 9` as a design cap | Stays as tuning (§5) |
| Manual commands other than Recall; Step Back and Taunt runes driving summons (replaced by summon behaviours) | `command.ts` focus/move, `player:commandSummons`; `ai.ts` `ownerStepsBack` (stepping out of telegraphs becomes every summon's default); the Taunt rune's summon branch in `taunt.ts` (tanks taunt by role) |
| Battle Bond's direct attack | `combat.ts` `runPlayerAttack` (`directSummonerProfile`, `battleBondProfile`) |
| The formation delivering the owner's shared abilities | `formationTechnique.ts`, `hasFormationTechnique`, `hasFormationCharge` for the Conduit (keep the charge machinery if the Plains Soul's charge reuses it) |
| The relic summon-count rating | `resolveSummonerRelicProfile` use in the profile and `summonerHud.ts` |

---

## 3. Unsettled shared sections, and the smallest stand-in for each

The rule: a stand-in is the smallest thing that lets the T1 Conduit play and be measured,
sits behind one name, and is cheap to replace when the section locks.

| Depends on | Section status | Stand-in | If the section lands differently |
|---|---|---|---|
| Command steps from Global Mastery (§2, Decided per class; numbers illustrative) | Draft | `COMMAND_STEPS` T1: 4 at GM 0, 5 at GM 15, 6 at GM 30 (the Striker dive's draft uses the same steps) | One table |
| Zone levels gate recipes (§2, Decided keep / Tentative jobs) | Draft | Existing `requiredBiomeLevel` on bind recipes and gear | — |
| The Passive Tree past the root (§2) | Draft, and T2 is out of scope | Conduit nodes past the root locked (L7) | The T2 slice adds disciplines |
| Rules cost nothing (§3, Decided); universal orders free (§3, Proposed) | Draft | Every rule costs 0 for a class-first class (L1); the rune editor stays the surface for universal orders | Remove L1 when the shared budget is deleted |
| Same engine, different surface (§3, Proposed) | Draft | Orders compiled into rules (L8) | If rejected, the orders read their own selector; the orders slice is unchanged |
| Relic slot from the first boss (§4, Decided) | Draft | L4 | — |
| Smart loot (§4, Decided) | Draft | `classes` on recipes (L5) | — |
| Armor and charm: shared bases + class lines (§4, Decided shared / Tentative fixed lines) | Draft | `classLines` keyed by archetype on the existing T1 armor and charm recipes (L6) | A line chosen at an upgrade step becomes a list on the same key |
| Item structure, `+N`, sockets (§4, Tentative) | Draft | Today's upgrade steps; no sockets | Sockets add a field; nothing in the slice reads one |
| Components (§4, under review) | Under review | None in the slice | — |
| Random drops, rerolls, pity (§4, Tentative) | Draft | None: recipes only. Balance is measured on the crafted schedule anyway (§4, "Balance") | — |
| Boss rewards (§4, direction Decided) | Draft | The Soul is granted on a boss clear | — |
| Global Mastery no longer gates item upgrades (§2, Tentative) | Draft | Not touched: upgrades keep today's GM band for every class | — |
| Per-class stats and affinities (§5, Open) | Not started | The Conduit's % affinities keep applying to the Conduit's own stats; summon stats come from the type table only | One profile input |
| Defense and recovery (§5) | Not started | Flat Recovery stays; Conduit-specific recovery only through charm lines | — |
| Ground hazards hurt players only (§13, Decided for now) | Parked | The Swamp Soul's "bile pool" becomes a death burst that leaves a poison stack on nearby enemies, drawn as a pool decal (question 2) | A real friendly ground zone replaces one function |
| Abilities, stances, rites (shared) | Scrapped as shared systems | Stay for the other five; refused for the Conduit (L2, L3) | Deleted with the last class |

---

## 4. The ordered task list

### 4.0 How to run it

- **The conductor** is an Opus session in `../mmo-class-first-conduit` on
  `feat/class-first-conduit`. It does every OPUS task there, gives each DELEGATE task its own
  worktree `../mmo-cf-<id>` on `feat/cf-<id>` off the current `feat/class-first-conduit`
  (made with the junction recipe: `git worktree add`, junction `node_modules/.pnpm`, mirror
  each package's `node_modules`, repoint `@mmo-idle/*` at the new worktree; never install),
  reviews the delegate's diff, and merges it back with `--no-ff`.
- **OPUS** = judgment (combat pipeline, protocol, persistence, architecture).
  **DELEGATE** = mechanical (sweeps, data entry, smoke tests, doc chores), with a brief below.
- **Every task's gate:** `pnpm typecheck` (about 50 s) plus its named tests via
  `pnpm test -- <substring>`. The full suite (`pnpm test`, about 5.5 min, 404/404 at
  `591398fe`) runs at each milestone, and its pass count is recorded.
- **Ids:** new ids never reuse an old one (audit, "Names that collide").
- **Milestone merges** go `feat/class-first-conduit` → `develop` with the full suite green.

### 4.1 The list

| Id | Task | Kind | Needs | Acceptance |
|---|---|---|---|---|
| **M0** | **Foundations (no behaviour change)** | | | |
| S0.1 | The class-first switch: `shared/src/classFirst.ts` (`CLASS_FIRST_ARCHETYPES`, `isClassFirst`), exported from `@mmo-idle/shared`; the ledger's rows as comments at each later seam | OPUS | — | typecheck; new `shared/src/classFirst.test.ts` |
| S0.2 | Bench repair: `pnpm bench:server` never fights (its scenarios use the removed node id `node-5-5` and never thaw a node; the 8 monsters it reports are the dev test room's). Point it at real nodes and thaw them; add a `bench:summon-cap` script for `server/bench/summonCap.ts` | DELEGATE | — | typecheck (`typecheck:bench` included); `pnpm bench:server --scenario autoCombatSameNode --players 1` reports the node's own monsters |
| **M1** | **The roster runtime: four Thralls in the Clearing** | | | |
| S1.1 | The shared roster model: `shared/src/data/conduit/` (`SummonTypeDef`, the Thrall, `SUMMON_UNIT_BY_TIER`, `COMMAND_STEPS`, `commandFor`, `rosterCost`, `validateRoster`, `defaultRoster`, the order vocabulary and defaults). Rewrite `resolveSummonerProfile` to take roster, tier, gear passives and Soul, and return per-slot stats (attack, cooldown, HP, range, mode, row, body, role). Anchor: four Thralls at Command 4 match today's root formation (43.1 dps at the T1 arrival build, `docs/conduit-current-state.md` §4); see question 4 | OPUS | S0.1 | typecheck; new `shared/src/data/conduit/roster.test.ts`; rewritten `shared/src/systems/summonerProfile.test.ts` |
| S1.2 | Components, protocol, persistence: the `commandsFormation` slice (roster, orders), `tracksProgression.boundSummons`; intents `formation:setRoster` / `formation:setOrders` with results in `shared/src/protocol/socketEvents.ts`; persistence (the `summoner_state` column already holds the formation as JSON; add the roster there or a migration `0010`); hydration gives a Conduit with no roster the default; the networked allowlists and dev invariants | OPUS | S1.1 | typecheck; new `server/test/conduitFormationPersistence.test.ts` (round trip without a DB, as `upgradeRefundMigration.test.ts` does), new `server/test/conduitFormationIntents.test.ts` |
| S1.3 | The runtime on the roster: slots from the roster; per-slot attack, cooldown, HP, range and body from the profile, not the owner's weapon; formation hits use the summon's own base attack in `runPlayerAttack` (decide the `ctx.formation` weights: recommended `directDamageWeight` 1 against that base, `procWeight` 1, tempo 0); rows replace the ring; summons step out of telegraphs by default instead of only under the owner's Step Back rule; cache the profile once per owner per tick (it is rebuilt ~5× per body per tick today) and remove the world-wide scans run per body (`isMinionInCombat`, `countMinionsTargetingMonster`; §5.4); delete the content in §2.9 except the sponge and commands (S1.4) | OPUS | S1.2 | typecheck; new `server/test/conduitRosterRuntime.test.ts` (four Thralls spawn; a roster swap reconciles slots; a dead body queues, rebuilds and costs HP; summon damage does not change with the owner's weapon Attack); `summonCap.ts --spread 25 --summons 0,9` re-run and recorded against §5.3 |
| S1.4 | Ledger seams L1, L2, L3, L7 for the Conduit; remove the default sponge; remove focus/move commands and `player:commandSummons`, keep Recall | OPUS | S1.3 | typecheck; new `server/test/classFirstSeams.test.ts` (a Conduit rule costs 0; ability, stance and rite crafts are refused; a Striker is unchanged); new `server/test/conduitNoSponge.test.ts` |
| S1.5 | Test sweep for the removed Conduit content (list in brief S1.5) | DELEGATE | S1.4 | `pnpm test` all green, pass count recorded |
| S1.6 | HUD: Command pips (used of total), the bodies by role, the rebuild queue with the next rebuild's HP cost | DELEGATE | S1.3 | typecheck; new `shared/src/systems/summonerHud.test.ts` |
| | **M1 exit:** full suite green; by hand, a fresh Conduit in the Clearing shows 4 of 4 pips, four Thralls fight, a dead one rebuilds and costs HP; a Striker plays as before. Merge to develop | | | |
| **M2** | **Specialists, binding, debuffs, orders** | | | |
| S2.1 | The minion status layer: `runMonsterAttackOnMinion` applies the monster's riders through one rider function shared with `runMonsterAttack` (no second copy of the table); minion status durations tick in `updateCombatState`; DoTs tick on minions (a `dottedMinions` query); slows and roots reach `computeMinionSpeed`, stuns stop a summon's swings, antiheal reaches minion heals; a summon killed by a DoT queues a rebuild like any death. Summons do not evade, so `evadeBlocksDebuffs` does not apply | OPUS | S1.3 | typecheck; new `server/test/summonDebuffs.test.ts`; `pnpm test -- statusRegistry dot` |
| S2.2 | Summon abilities: one ability per type on its own cooldown, fired by that summon (`sweep-taunt`, `acid-shred`, `power-shot`); the tank default taunt on hit; events for FX | OPUS | S1.3 | typecheck; new `server/test/summonAbilities.test.ts` |
| S2.3 | T1 specialist and bind-recipe data | DELEGATE | S1.1, S2.2 | typecheck; new `shared/src/data/conduit/specialists.test.ts` |
| S2.4 | Binding: `summon:bindRecipe` → `summon:bindResult`; zone level, essence and class checked on the server; bind recipes unlock with zone levels | OPUS | S1.2, S2.3 | typecheck; new `server/test/conduitBinding.test.ts` |
| S2.5 | Orders: compiled into rules (L8), the new "what attacks the Conduit" TARGETING action, tanks guard, rebuild order, the Recall rule | OPUS | S1.2 | typecheck; new `server/test/conduitOrders.test.ts`; `pnpm test -- rune summoner` |
| | **M2 exit:** each specialist binds at its zone level; the roster changes by intent; Swamp poison lands on summons and kills them; orders change the formation's target. Full suite green; merge | | | |
| **M3** | **Items and Souls** | | | |
| S3.1 | Item seams: `classes` on recipes and items, filtered in unlock, craft, equip and the client list (L5); `classLines` applied in the stat rebuild (L6); the profile reads the `conduit.*` weapon keys | OPUS | S1.1 | typecheck; new `server/test/classFilteredRecipes.test.ts`, new `server/test/classLines.test.ts`; `pnpm test -- recipeGates` |
| S3.2 | T1 Conduit gear data: six weapons, the Conduit lines on six armors and five charms, labels and help text for the `conduit.*` keys | DELEGATE | S3.1 | typecheck; new `shared/src/data/recipes/conduitT1Gear.test.ts`; `pnpm test -- recipeGates mechanicLabels recipeCurve weaponCurve` |
| S3.3 | Gear-line runtime: the five armor lines, the five charm lines, the weapon lines (Command ±, attack speed, ability potency, potency; the Swamp weapon's DoT through the existing weapon-DoT path) | OPUS | S2.1, S3.2 | typecheck; new `server/test/conduitGearLines.test.ts` (one observable assertion per line) |
| S3.4 | Souls: L4; the Soul granted on a boss clear; the free `soul` slot; the five seed bonuses; temporary summons for the Cave Soul | OPUS | S2.2, S3.1 | typecheck; new `server/test/conduitSouls.test.ts` |
| | **M3 exit:** a T1 Conduit crafts and wears its own gear only; each line does what its card says; a first boss kill gives a Soul that fields a body. Full suite green; merge | | | |
| **M4** | **The screen, visuals, tutorial and bot** | | | |
| S4.1 | The Formation view: `composeFormationView` in shared (roster, bound cards with role/cost/row/text, Command, orders, Soul, and why a "Field" button is disabled), the one model the panel, the tutorial and the bot read | OPUS | S2.5, S3.4 | typecheck; new `shared/src/systems/formationView.test.ts` |
| S4.2 | The Formation panel (React) | DELEGATE | S4.1 | typecheck; `pnpm test -- formationView`; screenshots |
| S4.3 | Stand-in bodies and ability FX | DELEGATE | S2.2, S3.4 | typecheck; `pnpm test -- summonerSprites conduitPlayerBodies` |
| S4.4 | Tutorial seam: per-class builders in `tutorialScriptFor` (L9); the tutorial conditions the Conduit needs | OPUS | S2.4, S3.4 | typecheck; `pnpm test -- tutorial` |
| S4.5 | The Conduit tutorial content | DELEGATE | S4.4 | typecheck; `pnpm test -- tutorial` |
| S4.6 | Bot: step kinds `bind`, `roster`, `orders`; `conduit-t1` v3 with the §7.13 defaults; retire the Conduit T2+ routes (L10) | DELEGATE | S2.4, S2.5, S3.4 | typecheck; `pnpm test -- routes harness profiles`; one run to the first seal (`--rewardMultiplier=25`) |
| | **M4 exit:** a fresh Conduit plays the guided T1 to the T2 promotion in a real browser; the bot route reaches both seals. Full suite green; merge | | | |
| **M5** | **Measure and hand off** | | | |
| S5.1 | T1 bot cohort: `conduit-t1` v3 against the five unchanged classes' T1 routes, one server per class (`reference_bot_arm_isolation`), same reward multiplier: time to each seal, deaths, `formationAttrition`, boss kill time. No number is changed: the designer tunes | OPUS | M4 | A report in `docs/briefs/` |
| S5.2 | Docs: rewrite `docs/conduit-current-state.md` to the new runtime; move the ledger to a living doc; update `docs/README.md` and `docs/system-rework-status.md`; archive this plan with a header | DELEGATE | M4 | `pnpm test -- docs` if a docs test exists; links resolve |

**After the slice, before the T2 slice raises the cap:** the minion bandwidth diet (§5):
measure which minion fields change every tick and cut them (`performsAttack.lastAttackAt`
into events, unchanged resync writes skipped), then re-run `summonCap.ts`.

### 4.2 Delegate briefs

Each brief is ready to paste. The conductor fills `<worktree>` and `<branch>`.

#### Brief S0.2: bench repair

```text
You are fixing a benchmark harness in the MMO Idle repo (TypeScript, pnpm monorepo).
Work ONLY in <worktree> on branch <branch>. Run `git branch --show-current` before your
first commit. Never run `pnpm install` (node_modules are junctions to another worktree).

Problem: `pnpm bench:server` (server/bench/run.ts, harness.ts, scenarios.ts) never measures
combat. Its scenarios place players in node id 'node-5-5', which no longer exists (the world
is an authored node registry: see NODE_BIOMES in shared/src/world/nodeBiomes.ts; the hub is
'node-clearing', T1 nodes look like 'node-t1-plains-01'). It also never thaws a node:
`world.attachPlayerEntity` counts occupancy but does not populate; the live server calls
`thawNode(world, nodeId)` from server/src/world/nodeLifecycle.ts on join. The 8 monsters
the bench prints are the dev test room's.

Do:
1. scenarios.ts: 'idle' and 'autoCombatSameNode' use 'node-t1-plains-01'; 'spreadNodes'
   spreads players over the T1 nodes from NODE_BIOMES (biomeTier 1, not 'clearing').
2. harness.ts spawnBenchPlayers: thaw each node before attaching its first player.
3. run.ts: count only monsters in the scenario's nodes.
4. server/package.json: add "bench:summon-cap": "tsx --conditions=development
   bench/summonCap.ts"; root package.json: "bench:summon-cap": "pnpm --filter
   @mmo-idle/server bench:summon-cap". Do not edit summonCap.ts itself.

Check:
- pnpm typecheck   (includes typecheck:bench)
- pnpm bench:server -- --scenario autoCombatSameNode --players 1,5  → the monsters column
  is the node's own population (dozens, not 8)
- git diff --numstat  (line endings: match each file's existing endings; never convert)

Don't: change any gameplay file under server/src or shared/src; change tick or broadcast
rates; delete scenarios; push. End your commit message with your co-author line.
```

#### Brief S1.5: test sweep for the removed Conduit content

```text
You are cleaning up tests after a refactor in the MMO Idle repo. Work ONLY in <worktree>
on <branch>; run `git branch --show-current` before committing; never run `pnpm install`.

Context: the Conduit (summoner) class was rebuilt on a roster model (read
docs/briefs/conduit-t1-slice-plan-2026-10-13.md §2.9 for what was removed: frames,
range nodes, the nine specializations, frame loop, line holds, the default damage sponge,
manual focus/move commands, Battle Bond, the formation delivering shared abilities).
Tests are plain tsx scripts (server/test/*.test.ts, shared/src/**/*.test.ts), run with
`pnpm test -- <substring>`, or one file from server/:
`node --conditions=development --import tsx test/<file>`.

Do, for each file below: run it. If it fails because it pins REMOVED Conduit content,
delete the Conduit-specific cases (or the file, if nothing else is in it). If it loops over
all six classes, drop or adapt only the summoner case so the other five keep their exact
assertions. If it fails for any other reason, STOP and report the file and output.
Candidate files: abilityConduitTechniqueAdapter, conduitManualAbilities, conduitPathFx,
summonerOverhaul, summonerSpecializations, summonerRuneBehaviors, summonerRuneTargeting,
summonerMitigation, summonerAreaAttrition, formationPlatingCompensation, frameLoopsRanged,
runeFormationBroken, minionOocRegen, mechanicFired, rangeMechanics, relicMechanicEffectCoverage,
skillTreeMechanicCopy, skillPreview, playerBreadth, dpsEstimate, relics, rhythmReadoutModel,
t3PacketTags, describeText, combatTextCoverage, statusRegistry (all *.test.ts). Then run
the full suite; any other failing file mentioning summoner/conduit/minion gets the same rule.

Check: pnpm typecheck; pnpm test → all pass; report the pass count (e.g. "397/397") and a
table: file → deleted / trimmed (which cases) / untouched.

Don't: change any non-test file; weaken an assertion for the five other classes; delete a
test because it is slow or flaky (biomeEcology.test is flaky under load: rerun it alone);
push.
```

#### Brief S1.6: the Conduit HUD

```text
You are building a small HUD feature in MMO Idle (server-authoritative; the client only
renders). Work ONLY in <worktree> on <branch>; `git branch --show-current` before
committing; never `pnpm install`.

Goal (design bible §7.2): the Conduit's HUD shows Command as pips (used of total), the
bodies in the formation (by role: tank / damage / support / soul), and the rebuild queue
with the NEXT rebuild's HP cost.

Do:
1. shared/src/systems/summonerHud.ts: add `projectFormationHud(summons, formationProfile)`
   returning { commandUsed, commandTotal, bodies: { slotId, role, typeId, alive }[],
   queue: { slotId, typeId, progressPct, remainingMs }[], nextRebuildHpCost }.
   Read the profile type from shared/src/systems/summonerProfile.ts (per-slot maxHp and
   reconstructionHpCostRatio); do not recompute game rules in the client.
2. client/src/hud/mechanics/SummonerMechanic.tsx: render pips (filled = used, hollow =
   spare), one small role-coloured dot per body (dim when dead), and the queue head as a
   bar with "−<n> HP" beside it. Data flows through the existing hudBus/Jotai atoms used by
   this component; follow the existing style in client/src/hud/mechanics/.
3. New shared/src/systems/summonerHud.test.ts: build a SummonsMinions + profile by hand and
   assert the projection (pips, a dead body, queue order, the cost = round(maxHp × ratio)).
   Hand-rolled assert, ends with console.log("summonerHud: ok").

Check: pnpm typecheck; pnpm test -- summonerHud; git diff --numstat (keep line endings).
Don't: add a networked field (everything needed is already on summonsMinions and the
profile); compute HP costs in React; use raw depth integers; push.
```

#### Brief S2.3: T1 specialist and bind-recipe data

```text
You are entering static game data in MMO Idle. Work ONLY in <worktree> on <branch>;
`git branch --show-current` before committing; never `pnpm install`.

Read first: design_docs/class-first-bible.md §7.4 (the T1 table) and §7.8; the types in
shared/src/data/conduit/summons.ts and bindRecipes.ts (written by the previous task); one
existing recipe file (shared/src/data/recipes/plains.recipes.ts) for cost and level shapes.

Do: add to shared/src/data/conduit/ the five T1 specialists and their bind recipes, with
these PLACEHOLDER numbers (the designer tunes them; copy exactly):

| id | role | Command | mode | row | hp× | atk× | cd× | ability | bind: zone, level, cost |
| plains-tank | tank | 1 | melee | front | 1.6 | 0.6 | 1.0 | sweep-taunt: every 8000 ms, radius 70 | plains, 2, same essence as plains-vest-t1 |
| forest-bruiser | damage | 1 | melee | middle | 0.6 | 0.8 | 0.55 | none | forest, 2, as forest's T1 armor |
| swamp-spitter | support | 1 | ranged | back | 0.7 | 0.5 | 1.0 | acid-shred: every 4000 ms, 1 stack of -2 plating, max 3 stacks, 6000 ms | swamp, 2, as swamp's T1 armor |
| mountain-marksman | damage | 1 | ranged | back | 0.5 | 1.2 | 1.3 | power-shot: every 6000 ms, ×2.5 | mountain, 2, as mountain's T1 armor |
| cave-heavy | tank | 2 | melee | front | 3.2 | 1.0 | 1.2 | none (tanks taunt on hit by default) | cave, 2, as cave's T1 armor |

Display names are placeholders: "Plains Warden", "Thornrunner", "Bile Spitter",
"Ridge Marksman", "Cave Brute". Each gets a one-line card text in plain language (what it
does in a fight, no numbers, no system words). Bodies (MinionMonsterType stand-ins):
plains-tank 'conduit-summon-effigy', forest-bruiser 'conduit-summon-splinter',
swamp-spitter 'conduit-summon-chorister', mountain-marksman 'conduit-summon-inquisitor',
cave-heavy 'conduit-summon-idolwright'.

Test: new shared/src/data/conduit/specialists.test.ts asserting: exactly one specialist per
T1 biome; every bind recipe's zone is a T1 biome and its level ≤ 6; ids are unique and none
reuses an existing skill-node, recipe or item id (check RECIPE_DATABASE, ITEM_DATABASE,
SKILL_TREE ids); every body resolves a frame (resolveMonsterFrame). Ends with
console.log("specialists: ok").

Check: pnpm typecheck; pnpm test -- specialists; git diff --numstat.
Don't: invent mechanics beyond the table; change other data; touch server code; push.
```

#### Brief S3.2: T1 Conduit gear data

```text
You are entering static item data in MMO Idle. Work ONLY in <worktree> on <branch>;
`git branch --show-current` before committing; never `pnpm install`.

Read first: design_docs/class-first-bible.md §7.4 (weapon and armor columns) and §7.9
(charm lines); shared/src/data/recipes/types.ts (the new `classes` and `classLines`
fields from the previous task); shared/src/data/mechanicLabels.ts and its test.

Do (all numbers are PLACEHOLDERS, copy them exactly; the designer tunes):
1. Six Conduit weapons, one per file (clearing, plains, forest, swamp, mountain, cave
   .recipes.ts), slot 'weapon', tier 1, `classes: ['summoner']`, requiredBiomeLevel 1
   (clearing: its first level), cost = that file's first weapon recipe cost, icon = that
   file's first weapon icon, no `lineageId`, `attack: 0`:
   - clearing  'conduit-rod-t1'      Binding Rod     conduit.potency-pct 0.10
   - plains    'conduit-chime-t1'    Herd Chime      conduit.command-delta 1, conduit.potency-pct -0.15
   - forest    'conduit-switch-t1'   Thorn Switch    conduit.command-delta -1, conduit.attack-speed-pct 0.35
   - swamp     'conduit-censer-t1'   Bile Censer     weaponDot: copy the profile shape of the swamp
                                                     DoT weapon in swamp.recipes.ts; conduit.potency-pct -0.10
   - mountain  'conduit-horn-t1'     Ridge Horn      conduit.ability-potency-pct 0.40, conduit.ability-cooldown-pct -0.20
   - cave      'conduit-idol-t1'     Deep Idol       conduit.command-delta -1, conduit.potency-pct 0.35
   Upgrade steps: 5 steps, each +0.03 conduit.potency-pct, costs and requiredBiomeLevel copied
   step by step from that file's first weapon.
2. Conduit armor lines: on each T1 armor recipe (the Clearing armor and plains-vest-t1 etc.)
   add classLines.summoner:
   - clearing: none (generic defense)
   - plains:   conduit.summon-plating-flat 3
   - forest:   conduit.summon-thorns-flat 2
   - swamp:    conduit.poison-transfer 1
   - mountain: conduit.big-hit-intercept-pct 0.30
   - cave:     conduit.summon-defense-share 0.25, conduit.owner-hp-pct 0.20
3. Conduit charm lines on each T1 charm (slot 'recovery'), classLines.summoner:
   - plains (Herd):        conduit.ooc-rebuild-speed-mult 2
   - forest (Sapbark):     conduit.sapbark-delay-ms 3000, conduit.sapbark-regen-pct 0.05
   - swamp (Bloodtithe):   conduit.bloodtithe-refund-pct 0.5
   - mountain (Cairnstone): conduit.cairnstone-threshold-pct 0.15, conduit.cairnstone-recovery-mult 3, conduit.cairnstone-ms 4000
   - cave (Deep Reserve):  conduit.rebuild-parallel 2
4. Every new key gets a label and a one-line plain help text where mechanic keys are
   labelled (mechanicLabels.ts, client/src/hud/stat/statHelp.ts,
   client/src/ui/describe/passiveText.ts), following the neighbours' style.
5. New shared/src/data/recipes/conduitT1Gear.test.ts: each T1 biome + the Clearing has
   exactly one weapon with classes ['summoner']; the T1 armor and T1 charm of each of the five
   T1 biomes has a summoner line (the Clearing's armor and charm have none); every
   conduit.* key has a label. Ends with
   console.log("conduitT1Gear: ok").

Check: pnpm typecheck; pnpm test -- conduitT1Gear recipeGates mechanicLabels recipeCurve
weaponCurve; git diff --numstat.
Don't: change any existing recipe's stats, costs or levels; add server code; invent keys
beyond this list; push.
```

#### Brief S4.2: the Formation panel

```text
You are building a React panel in the MMO Idle client (client/, Vite + React + Jotai;
the server decides everything, the client only shows state and sends intents). Work ONLY
in <worktree> on <branch>; `git branch --show-current` before committing; never install.

Read first: design_docs/class-first-bible.md §7.2-§7.4 and §7.13; the view model
shared/src/systems/formationView.ts (composeFormationView) and its test; the intent helpers
in client/src/net/ (how other panels emit, e.g. rune:setLoadout); an existing panel for
style (client/src/ui/BuildRunesTab.tsx, client/src/ui/buildPanel.css).

Layout (from the designer's v1 mockup, with §7's later calls applied):
- A summary strip: Command as pips "used / total" (hollow pips = spare), bodies "n / cap",
  what the formation does (chips from the view model).
- The board: three rows top to bottom, Front (tanks), Middle (melee), Back (ranged,
  support), enemies above, the Conduit below ("Commands. Does not attack."). Each fielded
  summon is a token whose size shows its Command cost; clicking it removes it (sends
  formation:setRoster with the new roster).
- Bound summons, grouped by role (Tank, Damage, Support, Generic): a card per type with
  name, "<n> Command", row, card text, where it was bound, and a "Field" button that is
  disabled with the view model's reason ("Not enough Command", "Body limit").
- Orders (label "Free · formation-wide"): Attack first [What attacks the Conduit /
  Closest enemy / Weakest enemy / Elites and bosses]; Tanks guard [The Conduit / The back
  row]; Recall everyone when [the options the view model lists]; Rebuild first [Tanks /
  Damage / Supports / In the order they fell]; a "Recall now (R)" button
  (player:recallSummons). Changes send formation:setOrders.
- The Soul slot: the equipped Soul and its bonus line, or "Beat a boss to bind its Soul".
NOT from the mockup (superseded): spare Command speeding rebuilds, "rebuilding costs no
HP", the Bond/Host disciplines, the T2 tier switch, the tier ladder.

Where: client/src/ui/formation/FormationPanel.tsx (+ .css), opened from the Build panel
as the Conduit's tab, visible only when the player's class is the Conduit.

Check: pnpm typecheck; pnpm test -- formationView; then the `run` skill (or pnpm dev) and
a screenshot of the panel at 1440 and phone width, attached to your report.
Don't: compute game rules in React (Command, validity, costs all come from the view
model); add socket events; edit shared/ or server/; use raw depth integers; push.
```

#### Brief S4.3: stand-in bodies and ability FX

```text
You are wiring stand-in sprites and effects in MMO Idle. Work ONLY in <worktree> on
<branch>; `git branch --show-current` before committing; never install; never run
art:generate; never edit packed atlas PNG/JSON by hand (tools/pixellab/README.md).

Do:
1. shared/src/components/archetypes/summoner/isMinion.ts: the MinionMonsterType union
   stays the body list. Map summon type → body in shared/src/data/conduit/summons.ts
   (already has a `body` field) and add Souls/spiderling bodies in souls.ts:
   Razortusk Soul 'conduit-summon-champion', Timberclaw Soul 'conduit-summon-consort',
   Mire Behemoth Soul 'conduit-summon-ritualist', Stoneplate Soul
   'conduit-summon-covenanter-defense', Dreadbore Soul 'conduit-summon-marshal',
   spiderling 'conduit-summon-kilnmaster'.
2. Ability FX: the server pushes events (look up the event kinds the summon ability
   runtime added in shared/src/protocol). In client/src/render/combatFx.ts and
   client/src/fx/conduitSummon.ts draw: sweep-taunt = a short ring around the tank;
   acid-shred = a green bolt (reuse the conduit-bolt drawing, green tint) and a small
   splash on hit; power-shot = the conduit-beam drawn thicker. Reuse existing helpers;
   no new art files. Respect the background-tab rules (no queued tweens while hidden).
3. Update server/test/summonerSprites.test.ts so every summon type and Soul body resolves a
   frame.

Check: pnpm typecheck; pnpm test -- summonerSprites conduitPlayerBodies; a short screen
capture or screenshots of each FX via the `run` skill.
Don't: change server logic; add networked fields; push.
```

#### Brief S4.5: the Conduit tutorial content

```text
You are writing guided-tutorial content in MMO Idle. Work ONLY in <worktree> on <branch>;
`git branch --show-current` before committing; never install.

Read first: design_docs/class-first-bible.md §7.4 ("The first ten minutes") and §7.13;
shared/src/tutorial/types.ts and conditions.ts (including the Conduit conditions the
previous task added); shared/src/tutorial/scripts/plans.ts (TUTORIAL_SEALS: the guide
fights the Plains, then the Mountain boss); the existing class builder classScript.ts for
beat shapes only (it is built on weapon trees, which the Conduit does not have);
docs/briefs/playtest-3-report-2026-10-12.md (what confused a new player).

Do: shared/src/tutorial/scripts/conduitScript.ts exporting buildConduitBeats(), registered
for 'summoner-root' in the per-class builder map. The route:
- Clearing: you command four Thralls (Command 4 shown as pips); the orders are set for
  you; R recalls them. Craft and wear the Binding Rod and the Clearing armor.
- Plains: fight to the level that binds the Plains Warden (about minute 6); bind it;
  field it in place of a Thrall (it holds the swarm). Craft the Plains armor. Seal 1: the
  Plains boss. On the kill, equip its Soul.
- Forest, Swamp, Cave: bind each zone's specialist when its level allows; one line on what
  it answers; field the default roster (the view model's defaultRoster).
- Mountain: bind the marksman; craft the Mountain armor (big hits go to your tank); seal 2.
Voice: short sentences, what to do and why in fight terms; never system words like
"slot", "budget", "profile", "lineage"; at most two new ideas per level (the guide's rule).

Check: pnpm typecheck; pnpm test -- tutorial; paste the full beat text in your report.
Don't: change other classes' scripts or the opening; add conditions (ask the conductor);
push.
```

#### Brief S4.6: bot steps and the Conduit T1 route

```text
You are extending the headless bot harness in MMO Idle (bot/ package: real socket.io
clients, authored routes, JSONL telemetry; it imports only @mmo-idle/shared). Work ONLY in
<worktree> on <branch>; `git branch --show-current` before committing; never install.

Read first: bot/README.md and bot/ROUTE-AUTHORING.md; bot/src/route/types.ts and
executor.ts (how a step kind is declared, executed, and retried with emitUntil while the
player is dead); bot/src/routes/conduitT1.ts and t1RouteBuilder.ts; the socket events
formation:setRoster, formation:setOrders, summon:bindRecipe in
shared/src/protocol/socketEvents.ts; defaultRoster and composeFormationView in shared.

Do:
1. New step kinds: { kind: 'bind', summonId }, { kind: 'roster', roster: 'default' |
   string[] }, { kind: 'orders', orders: Partial<FormationOrders> }. Each waits for its
   result event and goes through emitUntil like equip does. The relic uses the existing
   equip step with the Soul's item id.
2. Observation: read boundSummons and the commandsFormation slice from the player's own
   delta mirror (no server change).
3. bot/src/routes/conduitT1.ts: version 3.0.0. Gear: the six Conduit weapons, the shared
   armors with their Conduit lines, the charms (Herd first). After each zone level that
   unlocks a bind: bind, then roster 'default'. Orders: attack first 'closest', tanks guard
   'conduit', recall when 'hp-low', rebuild first 'tanks'. After each seal: equip that
   boss's Soul. Remove Step Back, Taunt Target and Rebuild Formation rune stages.
4. Retire the Conduit T2+ routes and lanes: conduitV2T1.ts and the Conduit entries in
   tierEntry/profiles.ts, t2GearPlans.ts, t2DayExperimentRoutes.ts, t2Night2Routes.ts,
   classRecovery.ts (leave the other classes' entries exactly as they are).

Check: pnpm typecheck; pnpm test -- routes harness profiles classRecovery; then one run on
your own dev server (see the memory note on isolated bot lanes: one server and one game DB
per lane, never :4000 if another session uses it): `pnpm bot:run --route=conduit-t1
--rewardMultiplier=25` to the first seal; attach summary.json's formationAttrition.
Don't: change server code or balance numbers; touch other classes' routes; push.
```

#### Brief S5.2: docs

```text
You are updating documentation in MMO Idle. Work ONLY in <worktree> on <branch>;
`git branch --show-current` before committing; never install.

Read first: CLAUDE.md "Docs"; docs/README.md; docs/conduit-current-state.md (describes the
OLD Conduit); docs/briefs/conduit-t1-slice-plan-2026-10-13.md; the code under
server/src/systems/classes/archetypes/summoner/ and shared/src/data/conduit/.

Do:
1. Rewrite docs/conduit-current-state.md for the code as it is now: roster and Command,
   summon types, binding, orders and Recall, rebuilds, Souls, gear lines, debuffs on
   summons, HUD and screen, bot and tutorial, the file map. Keep the dated history sections
   that still explain a kept number (rebuild timings) and drop the ones about removed
   content (frames, range, specializations) with one line pointing to git tag
   pre-rework-2026-10-13.
2. Move the plan's strangler ledger (§1) to a new docs/class-first-current-state.md.
3. docs/README.md: index entries for both; mark this plan ARCHIVED and `git mv` it to
   docs/archive/briefs/ with the header line "ARCHIVED — implemented; live state in
   docs/conduit-current-state.md and docs/class-first-current-state.md".
4. docs/system-rework-status.md: a Conduit row.
Check: every relative link you wrote resolves (ls each path); git diff --numstat.
Don't: edit design_docs/class-first-bible.md (design sessions own it); change code; push.
```

---

## 5. Measurements: what 12, 20 and 30 summons cost

**Tool:** `server/bench/summonCap.ts` (new, committed with this plan). It runs today's minion
runtime in a real T1 node: it thaws the node, fields Conduits with N summons by patching the
formation tuning at runtime (no gameplay code changed), keeps each body at the root's
per-body HP and damage (an army does not split one budget, as in the rework), tops the owner
up to full HP every tick (worst-case rebuild churn, never a balance result), and walks idle
owners to the nearest pack every 2 s. 200 warm-up ticks, then 600 measured ticks (60 s of
game time) at the live 10 Hz logic / 5 Hz broadcast. `--summons 0` is a Striker in the same
node, the baseline.

```text
pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/summonCap.ts \
  [--summons 0,4,9,12,20,30] [--owners 1,5] [--node node-t1-plains-01] [--spread 25]
```

Machine: the designer's Windows 11 PC, Node 22.16, one process, no DB (hitboxes fall back to
boxes). Tick budget at 10 Hz: 100 ms.

### 5.1 One T1 node (Plains, `node-t1-plains-01`, about 35 monsters)

| Owners × summons | Live summons | Tick p50 / p95 (ms) | Summoner system p50 (ms) | Delta per viewer p50 / p95 (KB/s) | Full snapshot (KB) |
|---|---:|---:|---:|---:|---:|
| 1 × 0 (Striker) | 0 | 1.11 / 1.88 | — | 31.1 / 43.7 | 33 |
| 1 × 4 (today's root) | 3 | 1.27 / 2.18 | 0.21 | 33.8 / 47.9 | 35 |
| 1 × 9 (today's cap) | 9 | 1.41 / 2.29 | 0.44 | 39.8 / 63.0 | 38 |
| **1 × 12** | 12 | 1.76 / 3.37 | 0.61 | 45.6 / 68.5 | 43 |
| **1 × 20** | 20 | 2.38 / 3.83 | 1.11 | 50.8 / 82.1 | 48 |
| **1 × 30** | 30 | 3.66 / 5.65 | 2.04 | 64.6 / 102.2 | 58 |
| 5 × 0 (five Strikers) | 0 | 1.40 / 3.50 | — | 37.7 / 58.6 | 44 |
| 5 × 4 | 20 | 2.63 / 4.36 | 0.87 | 61.2 / 97.2 | 62 |
| 5 × 9 | 45 | 4.51 / 6.77 | 1.99 | 80.0 / 123.6 | 83 |
| **5 × 12** | 60 | 5.04 / 7.88 | 2.56 | 99.7 / 154.2 | 95 |
| **5 × 20** | 100 | 9.04 / 12.76 | 5.35 | 137.2 / 181.3 | 129 |
| **5 × 30** | 150 | 14.11 / 19.45 | 9.51 | 197.7 / 252.8 | 175 |

### 5.2 One T1 node (Cave, `node-t1-cave-01`, about 15 monsters)

| Owners × summons | Live summons | Tick p50 / p95 (ms) | Summoner p50 (ms) | Delta per viewer p50 / p95 (KB/s) |
|---|---:|---:|---:|---:|
| 1 × 0 | 0 | 0.67 / 1.31 | — | 16.2 / 26.0 |
| 1 × 12 | 2 | 0.73 / 1.17 | 0.12 | 21.1 / 30.5 |
| 1 × 20 | 20 | 1.78 / 3.80 | 0.94 | 36.2 / 69.9 |
| 1 × 30 | 30 | 2.91 / 4.90 | 1.77 | 50.8 / 105.5 |
| 5 × 0 | 0 | 0.96 / 1.62 | — | 21.5 / 48.8 |
| 5 × 12 | 60 | 4.69 / 10.33 | 2.45 | 77.0 / 161.7 |
| 5 × 20 | 100 | 8.64 / 19.68 | 5.19 | 111.5 / 188.0 |
| 5 × 30 | 150 | 13.07 / 20.67 | 8.70 | 160.4 / 239.8 |

In the Cave, one owner's 4–12 summon formations never stayed up (2 live on average): the
single rebuild queue could not keep up with T1 Cave damage at that formation strength. Read
cost against **live** summons, not the configured count.

A second Plains run agreed with 5.1 within about 10% in every cell (for example 5 × 30:
13.27 ms p50, 198.2 KB/s per viewer).

### 5.3 Server-wide: one Conduit in each of 25 T1 nodes (about 500 monsters)

| Summons each | Live summons | Tick p50 / p95 / max (ms) | Summoner p50 / p95 (ms) | Broadcast build p50 (ms) | Delta per viewer p50 / p95 (KB/s) |
|---|---:|---:|---:|---:|---:|
| 0 (25 Strikers) | 0 | 17.8 / 56.9 / 389 | — | 6.0 | 17.3 / 39.7 |
| 4 | 72 | 27.3 / 146.1 / 468 | 6.5 / 80.1 | 7.8 | 20.0 / 43.3 |
| 9 | 185 | 40.5 / 114.4 / 693 | 13.7 / 22.1 | 7.5 | 25.1 / 55.7 |
| **12** | 252 | 55.8 / 230.5 / 995 | 19.4 / 93.1 | 9.2 | 33.1 / 67.7 |
| **20** | 489 | **103.7** / 516.4 / 942 | 38.7 / 427.9 | 10.0 | 41.9 / 78.0 |
| **30** | 745 | **148.9** / 832.9 / 3,244 | 64.8 / 555.7 | 13.0 | 49.9 / 98.5 |

One run per cell; the p95 and max columns swing with garbage collection (4 summons shows a
worse p95 than 9), so read the p50s.

### 5.4 What the numbers say

- **In one node, CPU is linear and modest:** about **0.085 ms of tick per live summon**
  (Plains: (3.66 − 1.11) / 30 and (14.11 − 1.40) / 150 both give 0.085), about 70% of it
  in the summoner system. 150 summons in one node use 14 ms of the 100 ms tick.
- **Across the server it is not linear:** with 25 populated nodes a live summon costs
  **about 0.18 ms**, twice as much, and **20 summons each takes the tick median past the
  100 ms budget** (104 ms; 30 each: 149 ms). Even at 12 each, the median (56 ms) and the
  garbage-collection spikes are already a problem. The code points at world-wide scans run
  per body, per tick: `isMinionInCombat` (`summonerPrototype.ts`) copies **every aggroed
  monster in the world** into a new array for each summon; `countMinionsTargetingMonster`
  (`ai.ts`) walks every minion in the world; `buildNodeDelta` (`server/src/world/nodeDelta.ts`)
  walks every entity in the world once per node. The rest of the tick grows too (17.8 →
  84 ms at 30 each, outside the summoner system): monsters weigh summons as targets.
  To confirm with a profiler before optimizing.
- **Bandwidth binds in a shared node:** about **1.1 KB/s per live summon for every viewer in
  that node** (p50; about 1.5 at p95). Socket.IO runs with default options (no per-message
  compression), so these are wire bytes. One Conduit with 30 summons doubles a Plains node's
  stream (31 → 65 KB/s per viewer); a party of five such Conduits sends each member about
  200 KB/s (p95 253), five times the same party as Strikers, and about 1 MB/s out of the
  server for that one node. Node entry (the full snapshot) grows from 33 KB to 175 KB.
- **Other hot spots** (code reading): `summonerProfileFor` rebuilds the whole profile about
  five times per body per tick (`ai.ts`, `spawn.ts`, `formationAttack.ts`,
  `summonerPrototype.ts`); minion deltas resend whole components when `hasPosition` or
  `performsAttack.lastAttackAt` change.
- **T1 needs no cap change.** The most bodies a T1 Conduit fields is 8 (Command 6 of
  1-cost summons, the Soul, the Cave Soul's spiderling), so `hardEntityCap: 9` stands for the
  slice. T2 Swarm doubles 1-cost summons (Command 6–9 → 12–18 bodies, plus the Soul), so
  **20 is the T2 step**; 30 is the T5 army (§13).
- **Recommendation.** S1.3 removes the world-wide scans (aggro looked up per summon or per
  node, minion counts per owner, the profile cached per owner per tick), because S1.3
  rewrites those files anyway, and re-runs `--spread 25 --summons 0,9`. The T2 slice raises
  the cap to 12, then 20, only after the bandwidth diet (§4, "After the slice"), re-running
  `summonCap.ts` at each step. Budgets to hold at 20: the spread-25 tick median under 40 ms,
  and a five-Conduit party's node stream under 100 KB/s per viewer.
- **Side finding:** `pnpm bench:server` has not measured combat since the node registry
  replaced the grid: its scenarios use `node-5-5` and never thaw a node (S0.2).

---

## 6. Design questions for the designer

Each has a stand-in in the plan, so no task is blocked; the answer replaces the stand-in.

1. **Out-of-combat rebuilds.** §7.14 says today's faster out-of-combat rebuild "becomes the
   charm line" (Herd). Does the baseline lose today's 4× (Herd brings it back), or keep it
   (Herd adds more)? Stand-in: the baseline keeps 4× and Herd doubles it, because dropping
   it reopens the early attrition fixed on 2026-09-26.
2. **The Swamp Soul's bile pool.** Ground hazards hurt only players (§13), and no
   player-owned damaging ground exists. Stand-in: a dying summon bursts, leaving a poison
   stack on enemies nearby, drawn as a pool. Is that close enough until the hazards session?
3. **The bind cost.** Stand-in: a specialist costs what its zone's T1 armor costs in that
   zone's essence, at zone level 2. Should binding cost essence at all, or be free at the
   level?
4. **The power anchor.** Stand-in: four Thralls at Command 4 hit as hard as today's root
   formation (43.1 dps at the T1 arrival build). Keep today's Conduit power as the T1 bar?
5. **Recall options.** The mockup offered "below 30% HP", "half the formation has fallen",
   "never". The rule engine has "HP below 25%", "formation broken", "enemy charging". Use the
   engine's, or add the mockup's?
6. **Names.** The specialist names in brief S2.3 (Plains Warden, Thornrunner, Bile Spitter,
   Ridge Marksman, Cave Brute) and the weapon names in brief S3.2 are placeholders. Keep
   them as working names?
