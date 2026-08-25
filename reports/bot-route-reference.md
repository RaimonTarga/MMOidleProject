# Bot route authoring — game knowledge packet

**Generated from live game data. Do not hand-edit — run `pnpm bot:reference`.**

Audience: whoever (human or model) is authoring progression routes for the
headless bot harness. It contains everything needed to choose a class, a gear
path, abilities and runes, and to express that choice as a route.

A route is a **hypothesis about how the game should be played**. The harness
executes it faithfully and reports where it breaks. A stall is a finding, not
automatically a bug in the route.

Companion docs: [`bot/README.md`](../bot/README.md) (running, telemetry),
[`bot/ROUTE-AUTHORING.md`](../bot/ROUTE-AUTHORING.md) (the DSL in detail).

## 1. The gating rules a route must obey

These are not guidelines. A route that violates one cannot complete.

**Player tier gates biome access.** `biomeLevelCap(playerTier, biome)` is
`(playerTier - biomeStartTier + 1) x 6`. A tier-0 character has a cap of
**0** in every T1 biome — it cannot bank a single level there. The tier-0 quest
(10 Tiny Wisps in the Clearing) must come first. At tier 1 each T1 biome caps at
**6**.

**Item upgrades are gated by Global Mastery, which is account-wide.** GM is the
sum of every biome's level, *excluding the Clearing and Sanctuary*. Gear depth is
therefore bought with **breadth**:

| upgrade | +1 | +2 | +3 | +4 | +5 |
|---|---|---|---|---|---|
| GM required (tier-1 item) | 6 | 12 | 18 | 24 | 30 |

One T1 biome maxes at 6 GM, so a single-biome character can only ever reach **+1**.
All five maxed = GM 30, which is exactly what **+5** needs.

**Ability slots at player tier 1: 1 Technique, 1 Guard.**
Every mid-run ability change is therefore a REPLACEMENT, not an addition.
(Tier 3 grants a 2nd Technique; tier 4 a 2nd Guard.)

**Runic Points**: budget is `8 + floor(GM / 10)` — 8 at GM 0,
11 at GM 30. Each equipped rune rule costs condition + action.

**Biome XP curve** (cumulative, per biome):

| level | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|
| cumulative XP | 25 | 174 | 542 | 1213 | 2265 | 3774 |
| this level costs | 25 | 149 | 368 | 671 | 1052 | 1509 |

Note the shape: reaching L6 costs roughly **twice** everything spent up to L4.

## 2. Classes (tier-0 roots)

Choosing a root costs 1 skill point, granted by the tier-0 quest. Percentages
are class affinities applied once after gear.

### Striker — `cadence-root`

Find the rhythm of battle. Every few hits your attack surges with accumulated force. A balanced bruiser — your recovery rate surges on a fixed cycle, sustaining you through prolonged engagements.

- **Affinities:** attackPct 0.08, maxHpPct 0.18, platingPct 0.15, attackSpeedPct 0.06, moveSpeedPct 0.04, damageReduction 0.02
- **Mechanics:** defense.recovery-pulse-pct 0.2, defense.recovery-pulse-interval-ms 6000, defense.recovery-pulse-duration-ms 4000, defense.max-hit-pct 0.25, defense.max-hit-mult 0.5

### Squire — `cooldown-root`

Patience is power. Prepare a devastating strike on a set cycle. The heaviest chassis in the game — enormous bulk and armor, bought with the slowest hands and feet — and 10% of your Recovery rate stays active even while you fight.

- **Affinities:** attackPct 0.18, maxHpPct 0.3, platingPct 0.3, attackSpeedPct -0.15, moveSpeedPct -0.1, damageReduction 0.04
- **Mechanics:** defense.recovery-active-pct 0.1

### Slinger — `reload-root`

Unleash a rapid clip then reload. Your speed is doubled and damage per shot halved as a fundamental multiplier — a light, evasive frame that fights from range and weaves around incoming blows.

- **Affinities:** attackPct 0.1, maxHpPct 0.07, attackSpeedPct 0.1, moveSpeedPct 0.1, attackRange 120, evasion 0.25
- **Mechanics:** defense.recovery-on-kill-pct 0.2, defense.recovery-on-kill-ms 4000, defense.evade-mitigation 0.2, reload.acquire-radius-mult 2.5

### Spirit — `energy-root`

Channel each blow into a building surge of power. The lightest, fastest, highest-output chassis — almost no natural bulk, so a barrier worth 30% of your max HP takes the hits that do reach you. It recharges between fights, not during them.

- **Affinities:** attackPct 0.15, maxHpPct 0.03, attackSpeedPct 0.12, moveSpeedPct 0.12, attackRange 130
- **Mechanics:** defense.barrier-pct 0.3

### Apprentice — `dot-root`

Your strikes leave lingering wounds. Stack the pain until nothing survives. The middle chassis — no extreme in any direction — and a toxin-hardened body that resists DoT damage by 18% and converts 10% of incoming direct hits into delayed damage you can outlast.

- **Affinities:** attackPct 0.1, maxHpPct 0.12, platingPct 0.08, attackSpeedPct 0.02, moveSpeedPct 0.03, attackRange 60
- **Mechanics:** defense.dot-resistance 0.18, defense.hit-to-dot-pct 0.1

### Conduit — `summoner-root`

Four persistent summons fight in your place. Your weapon sets their damage and cadence while the formation shares one offense and proc budget. Fallen slots rebuild one at a time, costing HP without crossing your safety floor.

- **Affinities:** attackPct 0.08, maxHpPct 0.08, attackSpeedPct 0.04, moveSpeedPct 0.05, attackRange 150

> `summoner-root` (Conduit) is gated behind the server's `CONDUIT_ENABLED` flag.

## 3. The world map

An 11x11 grid of nodes. Travel is gate-to-gate between orthogonally adjacent
nodes; the server owns pathing (`player:navigateTo`), so a route only names a
destination. Routes should name content (`{ biomeGroup, tier }`), not node ids.

### Shape (tier-1 region and its neighbours)

```text
     1 2 3 4 5 6 7 8 9 0 1 2 3 4
   2 . . m M V v . . · · · · · .
   3 . M M V V V f · · · · · · ·
   4 . M M V V F F · · · · · · ·
   5 . P P C F F F · · · · · · .
   6 . P P S S S . . · · · · · ·
   7 . . P S S s . · · · · · · ·
   8 . . p S . . . . · · · · · .
   9 . · · · · · . . . · · . . .
  10 · · · · · · · . . · · · . .
  11 · · · · · · · . · · · · · ·
  12 · · · · · · · · · · · · · ·
  13 · · · · · · . · · · · · · ·
  14 · · · · · · · · · · · · · .
  15 · · · · · · · · · · · · · ·
  16 . . . . . . . . · · · · · ·
  17 . . . . . . . . · · · · . .
```

`C` Clearing · `P` Plains · `F` Forest · `V` Cave · `M` Mountain · `S` Swamp
· lowercase = that biome's **dungeon** node · `·` = tier 2+ content · `.` = no node

### Tier-1 nodes

| node id | biome | kind | modifier |
|---|---|---|---|
| `node-clearing` | clearing | tutorial | — |
| `node-t1-mountain-01` | mountain | normal | heavy |
| `node-t1-mountain-02` | mountain | normal | swarming |
| `node-t1-mountain-03` | mountain | normal | dominion |
| `node-t1-mountain-04` | mountain | normal | fortified |
| `node-t1-mountain-05` | mountain | normal | heavy |
| `node-t1-mountain-dungeon` | mountain | dungeon | — |
| `node-t1-cave-01` | cave | normal | alacrity |
| `node-t1-cave-02` | cave | normal | heavy |
| `node-t1-cave-03` | cave | normal | swarming |
| `node-t1-cave-04` | cave | normal | dominion |
| `node-t1-cave-05` | cave | normal | fortified |
| `node-t1-cave-06` | cave | normal | dominion |
| `node-t1-cave-dungeon` | cave | dungeon | — |
| `node-t1-forest-01` | forest | normal | alacrity |
| `node-t1-forest-02` | forest | normal | swarming |
| `node-t1-forest-03` | forest | normal | dominion |
| `node-t1-forest-04` | forest | normal | fortified |
| `node-t1-forest-05` | forest | normal | alacrity |
| `node-t1-forest-dungeon` | forest | dungeon | — |
| `node-t1-plains-01` | plains | normal | alacrity |
| `node-t1-plains-02` | plains | normal | heavy |
| `node-t1-plains-03` | plains | normal | swarming |
| `node-t1-plains-04` | plains | normal | dominion |
| `node-t1-plains-05` | plains | normal | fortified |
| `node-t1-plains-dungeon` | plains | dungeon | — |
| `node-t1-swamp-01` | swamp | normal | alacrity |
| `node-t1-swamp-02` | swamp | normal | heavy |
| `node-t1-swamp-03` | swamp | normal | swarming |
| `node-t1-swamp-04` | swamp | normal | dominion |
| `node-t1-swamp-05` | swamp | normal | fortified |
| `node-t1-swamp-06` | swamp | normal | fortified |
| `node-t1-swamp-dungeon` | swamp | dungeon | — |

Node modifiers are all-upside and determine which **catalyst family** the node
pays into (alacrity / heavy / swarming / dominion / fortified).

## 4. Tier-1 biomes and their rosters

Essence type per biome: plains = yellow · forest = green · cave = red · mountain = blue · swamp = purple.

### Plains (`plains`, yellow essence)

| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |
|---|---|---|---|---|---|---|---|---|---|
| Field Hare `plains-slime` | normal | 50 | 12 | 0 | 0 | 12 | 2000 | melee | 2 |
| Boar `boar` | normal | 100 | 18 | 0 | 0 | 12 | 1900 | melee | 3 |
| Tusked Razorback `tusked-razorback` | **BOSS** | 1700 | 34 | 4 | 0.02 | 15 | 2000 | melee | 100 |

### Forest (`forest`, green essence)

| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |
|---|---|---|---|---|---|---|---|---|---|
| Moss Rat `forest-slime` | normal | 160 | 17 | 0 | 0 | 12 | 1400 | melee | 3 |
| Wolf `wolf` | normal | 130 | 20 | 0 | 0 | 12 | 1100 | melee | 4 |
| Gnarled Greatbear `gnarled-greatbear` | **BOSS** | 2000 | 24 | 0 | 0 | 15 | 1400 | melee | 100 |

### Caverns (`cave`, red essence)

| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |
|---|---|---|---|---|---|---|---|---|---|
| Cave Lurker `cave-lurker` | normal | 225 | 31 | 1 | 0.05 | 12 | 1400 | melee | 10 |
| Cave Brute `cave-brute` | normal | 250 | 90 | 1 | 0.1 | 12 | 2800 | melee | 13 |
| Obsidian Broodmother `obsidian-broodmother` | **BOSS** | 1750 | 47 | 6 | 0.1 | 18 | 2800 | melee | 110 |

### Mountain (`mountain`, blue essence)

| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |
|---|---|---|---|---|---|---|---|---|---|
| Cliff Hopper `cliff-hopper` | normal | 190 | 50 | 0 | 0 | 12 | 3000 | melee | 6 |
| Cliff Hopper `cliff-hopper` | normal | 190 | 50 | 0 | 0 | 12 | 3000 | melee | 6 |
| Ridge Ambusher `ridge-archer` | normal | 240 | 50 | 0 | 0 | 210 | 3100 | ranged | 8 |
| Crag Behemoth `crag-behemoth` | **BOSS** | 2100 | 56 | 0 | 0 | 18 | 3500 | melee | 105 |

### Swamp (`swamp`, purple essence)

| monster | role | hp | atk | plate | DR | rng | cd(ms) | behavior | essence |
|---|---|---|---|---|---|---|---|---|---|
| Mire Ooze `bog-slime` | normal | 140 | 10 | 0 | 0 | 12 | 2000 | melee | 5 |
| Mud Toad `mud-toad` | normal | 120 | 13 | 2 | 0 | 12 | 2200 | melee | 6 |
| Grave Toadeater `grave-toadeater` | **BOSS** | 2100 | 13 | 2 | 0.02 | 15 | 2600 | melee | 100 |

A dungeon node is entered through its **guard** — a pack of guardians engages
before the boss awakens. Measured: 11-12 simultaneous attackers in the Plains
dungeon. Plan armor and Guards for the guard fight, not just the boss.

## 5. Tier-0/1 gear

| biome | id | slot | gate lvl | craft cost | stats | mechanics |
|---|---|---|---|---|---|---|
| clearing | `primordial-club` | weapon | 1 | 4 green | attack 8, aps 0.75 |  |
| clearing | `clearing-vest-t1` | armor | 2 | 4 green | maxHp 20, plating 4 |  |
| clearing | `clearing-charm-t1` | recovery | 3 | 3 green | recovery 2 |  |
| clearing | `clearing-boots-t1` | mobility | 4 | 3 green | speed 12 |  |
| plains | `iron-broadsword` | weapon | 1 | 10 yellow | attack 10, aps 0.8 | technique.cooldown-reduction-pct 0.06 |
| plains | `plains-vest-t1` | armor | 2 | 20 yellow | maxHp 24, plating 7 |  |
| plains | `plains-charm-t1` | recovery | 3 | 10 yellow | recovery 1 | defense.recovery-on-kill-pct 0.2, defense.recovery-on-kill-ms 4000 |
| plains | `plains-boots-t1` | mobility | 4 | 10 yellow | speed 18 | mobility.kill-speed-pct 0.25, mobility.kill-speed-ms 3000 |
| forest | `flash-rapier` | weapon | 1 | 20 green | attack 5, aps 1.5 |  |
| forest | `forest-vest-t1` | armor | 2 | 20 green | maxHp 28, plating 3, evasion 0.16 |  |
| forest | `forest-charm-t1` | recovery | 3 | 15 green | recovery 3 | defense.recovery-skill-potency 0.1 |
| forest | `forest-boots-t1` | mobility | 4 | 10 green | speed 22 | mobility.ooc-speed-pct 0.25 |
| cave | `chaotic-axe` | weapon | 1 | 26 red | attack 22, aps 1.1 | weapon.dead-swing-interval 3 |
| cave | `cave-vest-t1` | armor | 2 | 22 red | maxHp 28, plating 4, damageReduction 0.06 |  |
| cave | `cave-charm-t1` | recovery | 3 | 18 red | recovery 2 | defense.absorb-pct 0.08 |
| cave | `cave-boots-t1` | mobility | 4 | 18 red | speed 20 | mobility.stealth-pct 0.25 |
| mountain | `heavy-hammer` | weapon | 1 | 22 blue | attack 26, aps 0.55 | weapon.empowered-mult-bonus 0.15 |
| mountain | `mountain-vest-t1` | armor | 2 | 22 blue | maxHp 32, plating 5 | guard.potency-pct 0.15 |
| mountain | `mountain-charm-t1` | recovery | 3 | 18 blue | recovery 1 | defense.barrier-pct 0.12 |
| mountain | `mountain-boots-t1` | mobility | 4 | 18 blue | speed 16 | mobility.approach-speed-pct 0.35 |
| swamp | `ashbrand-blade` | weapon | 1 | 22 purple | attack 10, aps 0.9 |  |
| swamp | `swamp-vest-t1` | armor | 2 | 22 purple | maxHp 30, plating 4 | defense.dot-resistance 0.2 |
| swamp | `swamp-charm-t1` | recovery | 3 | 18 purple | recovery 2 | defense.recovery-pulse-pct 0.2, defense.recovery-pulse-interval-ms 8000, defense.recovery-pulse-duration-ms 4000 |
| swamp | `swamp-boots-t1` | mobility | 4 | 18 purple | speed 18 | mobility.slow-resistance 0.25 |

The Clearing set is deliberately FIXED POWER (`upgrades: []`) — it cannot be
upgraded at all, and is meant to be replaced wholesale by T1 gear.

### Total essence to take a T1 item +0 -> +5

| item | total |
|---|---|
| `chaotic-axe` | 474 red |
| `cave-vest-t1` | 600 red |
| `cave-charm-t1` | 237 red |
| `cave-boots-t1` | 158 red |
| `flash-rapier` | 930 green |
| `forest-vest-t1` | 450 green |
| `forest-charm-t1` | 225 green |
| `forest-boots-t1` | 150 green |
| `heavy-hammer` | 474 blue |
| `mountain-vest-t1` | 474 blue |
| `mountain-charm-t1` | 237 blue |
| `mountain-boots-t1` | 158 blue |
| `iron-broadsword` | 230 yellow |
| `plains-vest-t1` | 450 yellow |
| `plains-charm-t1` | 180 yellow |
| `plains-boots-t1` | 150 yellow |
| `ashbrand-blade` | 450 purple |
| `swamp-vest-t1` | 450 purple |
| `swamp-charm-t1` | 237 purple |
| `swamp-boots-t1` | 158 purple |

## 6. Abilities

Techniques are offensive riders; Guards are defensive reactions. Both auto-fire
on a built-in heuristic, which a Rune rule can override.

| ability | slot | tier | learn via | gate | cost | what it does |
|---|---|---|---|---|---|---|
| **Sweep** `sweep` | technique | 1 | `ability-recipe-sweep` | plains L3 | 160 yellow | Arms your next attack to cleave nearby enemies. |
| **Second Wind** `second-wind` | guard | 1 | `ability-recipe-second-wind` | forest L3 | 150 green | Catch your breath, sharply raising your recovery rate for a few seconds. |
| **Cleanse** `cleanse` | guard | 1 | `ability-recipe-cleanse` | swamp L3 | 150 purple | Purge the worst of what is eating you — stacks first, then a second affliction. |
| **Brace** `brace` | guard | 1 | `ability-recipe-brace` | mountain L3 | 150 blue | Brace for impact — heavy mitigation and footing, for a moment. |
| **Power Strike** `power-strike` | technique | 1 | `ability-recipe-power-strike` | mountain L5 | 190 blue | Wind up a devastating blow. You stop attacking while it charges — and hard control breaks it. |
| **Expose Weakness** `expose-weakness` | technique | 1 | `ability-recipe-expose-weakness` | cave L3 | 150 red | Arms your next attack to expose the target, increasing all damage it takes. |

## 7. Runes

A rune rule pairs one **condition** with one **action**, and the equipped list is
ordered by priority. Both fragments must be owned. Fragments not marked
*starter* must be unlocked by crafting a rune forge recipe.

### Conditions

| id | cost | starter | what it means |
|---|---|---|---|
| `always` | 0 | yes | Works whenever the response can run. |
| `in-combat` | 1 | yes | Works while you are fighting. |
| `when-idle` | 1 | yes | Works when combat has cleared. |
| `hp-below-25` | 1 | yes | Works while your health is at or under 25%. |
| `hp-above-90` | 1 | yes | Works while your health is at or above 90%. |
| `target-hp-below-25` | 1 | yes | Works while your current target is at or under 25% health. |
| `has-debuff` | 1 | yes | Works while you are carrying a harmful debuff or damage-over-time effect. |
| `in-party` | 1 | yes | Works while in a party with one or more players. |
| `n-aggro-3` | 2 | yes | Works when three or more enemies are chasing you. |
| `target-casting` | 2 | yes | Works while an enemy attacking you is winding up a cast-time attack. |
| `before-empowered` | 2 | yes | Works the instant your next attack becomes empowered — a finisher, execution, or full-energy discharge that is armed and waiting to land. |
| `target-elite` | 2 | yes | Works while the enemy you are attacking is an elite — the high-value target worth spending a specialised ability on. |

### Actions

| id | cost | channel | starter | what it does |
|---|---|---|---|---|
| `chase-enemy` | 0 | MOVEMENT | yes | Move into the weapon's normal attack range. |
| `flee` | 1 | MOVEMENT | **no** | Retreat from the current fight. |
| `orbit` | 2 | MOVEMENT | **no** | Hold a standoff gap and kite while attacking. |
| `step-back` | 3 | MOVEMENT | **no** | Back out of a telegraphed danger zone. Placeholder for cast telegraphs. |
| `follow-and-assist` | 1 | MOVEMENT | yes | Follow the party leader out of combat, and attack their target in combat. |
| `focus-closest` | 0 | TARGETING | yes | Prefer the nearest valid enemy. |
| `focus-lowest-hp` | 2 | TARGETING | **no** | Prefer fast kills to reduce enemy count. |
| `focus-highest-max-hp` | 2 | TARGETING | **no** | Prefer the enemy with the largest maximum health pool. |
| `let-dots-finish` | 1 | TARGETING | **no** | Prefer a new enemy when your damage over time should finish the current one. |
| `spread-dots` | 2 | TARGETING | **no** | In multi-enemy fights, rotate targets to keep your damage over time active. |
| `focus-elites` | 2 | TARGETING | **no** | Prioritize elite enemies (the yellow-outlined standouts) — necromancers, apex predators — before clearing the rest. |
| `tactical-reload` | 1 | RESOURCE_MAINTENANCE | **no** | Out of combat, pause to refill reload-class clips. |
| `wait-for-execution` | 1 | OOC_MAINTENANCE | **no** | Out of combat, wait until your cooldown-class execution is ready. |
| `wait-for-regen` | 1 | OOC_MAINTENANCE | **no** | Out of combat, hold position until HP is full. |
| `auto-path-enemy` | 0 | GLOBAL_STRATEGY | yes | When idle, path to the nearest valid enemy in this node. |
| `avoid-hazards` | 2 | PATHING | **no** | Route around damaging and slowing terrain when pathing. |
| `careful-pulling` | 2 | PATHING | **no** | While approaching a target, bias movement away from nearby non-target elites. |
| `lead-the-way` | 0 | GLOBAL_STRATEGY | yes | As party leader, look for enemies in this zone so followers can trail you. |
| `taunt-current-target` | 1 | CONTROL | yes | On hit, force your current enemy to attack you. Has a 4 second cooldown. |
| `fire-technique` | 1 | TECHNIQUE | yes | Override your Technique's auto-timing: arm it when this situation holds instead of the default. |
| `fire-technique-2` | 1 | TECHNIQUE_2 | yes | Override the auto-timing of your SECOND Technique. Inert until a second Technique slot is unlocked. |
| `fire-guard` | 1 | GUARD | yes | Override your Guard's auto-timing: trigger it when this situation holds instead of the default. |
| `fire-guard-2` | 1 | GUARD_2 | yes | Override the auto-timing of your SECOND Guard. Inert until a second Guard slot is unlocked. |
| `switch-stance` | 2 | STANCE | yes | Switch to a chosen learned stance while this situation holds, reverting to your default otherwise. |

### Rune forge recipes (how non-starter fragments are unlocked)

| recipe | unlocks | kind | gate | cost |
|---|---|---|---|---|
| `rune-recipe-out-of-combat` | `when-idle` | condition | forest L2 | 180 green |
| `rune-recipe-reload-safely` | `tactical-reload` | action | forest L2 | 140 green + 60 blue |
| `rune-recipe-ready-execution` | `wait-for-execution` | action | forest L3 | 140 green + 60 red |
| `rune-recipe-focus-highest-hp` | `focus-highest-max-hp` | action | forest L4 | 220 green |
| `rune-recipe-low-hp` | `hp-below-25` | condition | cave L2 | 180 red |
| `rune-recipe-avoid-hazards` | `avoid-hazards` | action | swamp L2 | 90 purple |
| `rune-recipe-flee` | `flee` | action | cave L2 | 160 red + 80 green |
| `rune-recipe-careful-pulling` | `careful-pulling` | action | cave L3 | 180 red |
| `rune-recipe-recover-first` | `wait-for-regen` | action | cave L3 | 140 red + 100 green |
| `rune-recipe-keep-distance` | `orbit` | action | mountain L3 | 180 blue + 80 yellow |

## 8. Stances and Rites

Both are build layers the harness can set but the baseline routes do not yet
use. Listed so a route author knows they exist.

- **Stances** (11 authored): postures folded into stats; one free default slot,
  with automated destinations carried on Rune `switch-stance` rules.
- **Rites** (6 authored): always-on out-of-combat effects sharing the Runic Point
  budget with rune rules.

## 9. Expressing a route

Routes are data in `bot/src/routes/`, registered in `bot/src/routes/index.ts`.
`bot/src/harness.test.ts` fails the build if a route names a recipe, item,
ability, rune fragment, dungeon or node that does not exist, equips something it
never crafted, or exceeds the tier-1 ability slot count.

```ts
{ type: "chooseClass",  skillId: "cadence-root" }
{ type: "travel",       to: <NodeRef> }
{ type: "farm",         at: <NodeRef>, until: <Condition> }
{ type: "craft",        recipeIds: [...], farmAt?: <NodeRef> }
{ type: "equip",        definitionIds: [...] }
{ type: "upgrade",      definitionId, toPlus, farmAt?, opportunistic? }
{ type: "learnAbility", recipeId, abilityId, slot: "technique"|"guard", farmAt? }
{ type: "setAbilities", techniques: [...], guards: [...] }   // REPLACES
{ type: "craftRune",    recipeId, farmAt? }
{ type: "configureRunes", rules: [{ conditionId, actionId }] }
{ type: "attemptBoss",  biomeGroup, tier, maxAttempts? }
{ type: "repeatUntil",  steps: [...], until: <Condition> }
{ type: "milestone",    id: "..." }

// every step also accepts: label?, optional?, stallAfterMs?
//   optional: the `intended` policy does it; `rusher`/`generic` skip it

// NodeRef
{ kind: "node",    nodeId: "node-clearing" }
{ kind: "biome",   biomeGroup: "plains", tier: 1, pick?: "first"|"rotate"|"uncleared" }
{ kind: "dungeon", biomeGroup: "plains", tier: 1 }

// Condition
{ type: "biomeLevelAtLeast", biomeGroup, level }   { type: "essenceAtLeast", essence, amount }
{ type: "catalystAtLeast", family, amount }        { type: "recipeUnlocked", recipeId }
{ type: "hasItem", definitionId }                  { type: "itemAtLeastPlus", definitionId, plus }
{ type: "equipped", definitionId }                 { type: "bossCleared", biomeGroup, tier }
{ type: "playerTierAtLeast", tier }                { type: "globalMasteryAtLeast", value }
{ type: "canCraft", recipeId }                     { type: "canUpgrade", definitionId }
{ type: "elapsedMs", ms }                          allOf(...) / anyOf(...) / { type: "not", of }
```

**The Clearing is not a `biome` ref.** It is `kind: "tutorial"` at biomeTier 0,
so `{ kind: "biome", biomeGroup: "clearing", tier: 1 }` resolves to nothing. Use
`{ kind: "node", nodeId: "node-clearing" }`.

### Policies

One executor, three parameter sets — never forked route code.

| | intended | rusher | generic |
|---|---|---|---|
| authored upgrade target | as written | 0 | -1 |
| biome-level thresholds | as written | -2 | -1 |
| `optional` steps | performed | skipped | skipped |
| rune loadout | as authored | starter default | starter default |

## 10. Worked example — the Striker baseline

Authored by the designer, 2026-08-25. Full source:
[`bot/src/routes/strikerT1.ts`](../bot/src/routes/strikerT1.ts).

Its spine, and *why* it is shaped that way:

```text
Clearing   full tutorial set, tier 0->1, pick Striker
Plains     whole set + Sweep,               max out -> +1
Forest     flash-rapier + Second Wind,      max out -> +2
Mountain   plate + Brace + brace rune,      max out -> +3   (nothing else crafted)
Swamp      Cleanse + avoid-hazards + charm, max out -> +4   (charm only)
Cave       Chaotic Axe + Expose Weakness,   max out -> GM 30, everything -> +5
Bosses     Plains, Forest, Mountain, Swamp, Cave
```

- **All five bosses at the END, not per biome.** +5 needs GM 30, which needs all
  five biomes maxed. The gear ladder and the boss tuning agree on this.
- **Each biome maxed adds exactly one upgrade level** (6 GM per biome, gates every 6).
- **Mountain is walked before Swamp** because Brace — the Guard the reactive rune
  fires — is gated at Mountain L3, and Swamp's DoT attrition punishes weak kit.
- **Only one piece is taken from Mountain and Swamp.** Breadth exists to raise GM,
  not to collect a full set from every biome.

Standing kit into the gauntlet: `chaotic-axe`, `swamp-charm-t1`, `plains-boots-t1`,
with `plains-vest-t1` (plating 7) for Plains/Forest and `mountain-vest-t1`
(guard potency 15%) for Mountain/Swamp/Cave.

Per-boss loadout — one Technique + one Guard is all tier 1 allows:

| boss | armor | technique | guard |
|---|---|---|---|
| Plains | plains-vest-t1 | sweep | second-wind |
| Forest | plains-vest-t1 | expose-weakness | second-wind |
| Mountain | mountain-vest-t1 | expose-weakness | brace |
| Swamp | mountain-vest-t1 | expose-weakness | cleanse |
| Cave | mountain-vest-t1 | expose-weakness | brace |

Rune loadout (6 RP of a budget that starts at 8):

```ts
{ conditionId: "always",         actionId: "auto-path-enemy" }  // 0 RP
{ conditionId: "in-combat",      actionId: "chase-enemy" }      // 1 RP
{ conditionId: "target-casting", actionId: "fire-guard" }       // 3 RP
{ conditionId: "always",         actionId: "avoid-hazards" }    // 2 RP, Swamp L2 recipe
```

`target-casting -> fire-guard` is the ONLY reactive-to-telegraph behavior in the
harness, and the game supplies it. Bots do not manually dodge. The rule is legal
from minute one but INERT until a Guard is learned — which is deliberate.

