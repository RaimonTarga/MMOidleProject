> **HISTORICAL (archived 2026-07-07).** Consolidated brainstorm; turned into `docs/system-rework-roadmap.md` + `docs/system-rework-status.md`. Kept for the major decisions it captured. Not current.

# System Rework Brainstorming — Final Consolidated Draft

**Status:** consolidated brainstorm, not final implementation spec.  
**Purpose:** capture the current rework direction clearly enough to red-team, turn into a concrete plan, and preserve the major decisions made during brainstorming.

---

## 1. Rework Thesis

The current game skeleton works, but the playtest exposed a shallow progression structure:

- Players can rush one easy/useful biome.
- Gear can collapse into “best four items.”
- Bosses can be beaten after touching too little of the tier.
- Dungeons are functional but not yet strong biome exams.
- Ranged/kiting safety creates a major advantage over melee.
- Essence is too smooth/plentiful and lacks meaningful reward moments.
- Biomes and monsters need stronger identities.
- The game needs more build preparation, but without becoming manual action combat.

The rework should move the game from:

```text
Farm one biome → craft a few strong items → kill one boss → next tier
```

toward:

```text
Explore biome-shaped problems → unlock recipes → craft answers → prepare a build/rune setup → clear biome trials → advance tiers
```

The game should remain:

```text
deterministic
automated by default
solo-complete
party-incentivized
build-preparation focused
```

---

## 2. System Responsibility Map

Each system should have a clear job.

```text
Tier = major character/system era
Biome Mastery = local recipe unlocks
Global Mastery = system-depth caps, not direct stats
Essence = broad crafting cost
Biome Catalysts = local deterministic special currency
Gear = passive build engine
Weapon = how I kill
Armor = what damage profile I survive
Charm = how I recover
Boots = how I move / farm / control pull rhythm
Skill = timed intervention
Rune = automation logic
Stance = combat posture
Rite/Discipline/Protocol = between-fight or long-rhythm passive behavior
Core = role/range amplifier
Relic = later rule-bending keystone
Dungeon = conscious biome trial
Boss = named final exam of the biome
```

Important principle:

```text
Recipes unlock access.
Essence/catalysts pay for power.
Global Mastery opens caps.
Tier unlocks major system structure.
```

---

## 3. Tier Unlock Schedule

Baseline systems:

```text
gear
runes
biome mastery
dungeons/bosses
essence/crafting
```

Current system unlock direction:

```text
T1 = skills
T2 = cores, maybe basic stances
T3 = rites / protocols / disciplines
T4 = relics
```

Notes:

- Gear and runes are baseline systems.
- Skill slots should be tied to tier, not Global Mastery.
- Cores begin after baseline play is understood.
- Relics are intentionally not brainstormed in this document because their direction is already planned separately.

---

## 4. Biome Mastery and Global Mastery

### Biome Mastery

Biome Mastery remains the main local progression track.

```text
Farm biome → gain biome mastery → unlock recipes → spend essence/catalysts → craft tools
```

Biome Mastery should unlock recipes, not directly grant most power.

Potential Biome Mastery unlocks:

```text
item crafting recipes
item evolution recipes
skill recipes
skill evolution recipes
basic/biome rune conditions and actions
core recipes from T2+
relic recipes/fragments from T4+
stance recipes from T2+
rite/discipline/protocol recipes from T3+
```

Skills should be strongly tied to Biome Mastery. Each biome should feel like it teaches a technique or answer.

Examples:

```text
Plains → Sweep / cleave / swarm tools
Forest → Opening Strike / Evasive Step / pursuit tools
Swamp → Cleanse / Contagion / rot tools
Mountain → Brace / Charged Blow / impact tools
Cave → Expose Weakness / elite-hunter tools
```

### Possible Biome Level Expansion

The current design has about 4 biome levels per tier segment, mapping well to the four item slots:

```text
Level 1 = weapon
Level 2 = armor
Level 3 = charm
Level 4 = boots
```

This may become too cramped once skills, runes, cores, relic fragments, and other unlocks are added.

A possible rework is to expand each biome’s per-tier segment to 5 or 6 levels.

Example 6-level structure:

```text
Level 1 = weapon recipe
Level 2 = armor recipe + early biome skill recipe
Level 3 = charm / recovery recipe
Level 4 = boots / mobility recipe + basic biome rune
Level 5 = core recipe / advanced local recipe / skill evolution
Level 6 = mastery recipe / boss-prep recipe / optional capstone-style unlock
```

This is not locked. The goal is more reward space without bloating biome mastery into a checklist.

Skills should appear early enough to help solve the biome, not only after the biome is already solved.

### Global Mastery

Global Mastery is derived from total biome mastery and should provide system depth, not direct stats.

Preferred Global Mastery unlocks:

```text
item upgrade caps
runic point cap
possibly core/relic rank caps
possibly Rite/Discipline/Protocol slot caps
possibly item evolution depth requirements
```

Global Mastery should not own skill slots.

### Catch-Up Logic

If a player rushes into the next tier with low Global Mastery, they should be able to catch up by farming current-tier content. Old mastery helps, but players should not be forced to fully complete old/retired content.

---

## 5. Reward Map and Economy

### Core Economy

Current preferred model:

```text
5 generic aspect essences across all tiers
+ biome catalysts as deterministic local currency
+ one-time dungeon/boss bundles
```

Do not add boss-specific materials or elite currency yet.

### Five Generic Aspect Essences

Keep the current idea of five generic colored essences, but reinterpret them as broad aspect currencies that remain relevant across all tiers.

Example naming direction:

```text
Might Essence
Wild Essence
Rot Essence
Stone Essence
Deep Essence
```

Names are not final; current colors can stay for now.

Starter biome mapping:

```text
Plains → Might
Forest → Wild
Swamp → Rot
Mountain → Stone
Cave → Deep
```

Advanced biomes can drop mixtures based on theme:

```text
Jungle → mostly Wild + some Rot
Desert → mostly Might + some Stone
Volcanic → Might + Stone
Tundra → Stone + Deep
Graveyard → Rot + Deep
Trench → Deep + Stone or Deep + Rot
```

Generic essences are used for broad costs:

```text
basic gear crafting
basic skill crafting
rune crafting
core crafting
item upgrades
item evolution costs
generic recipe costs
```

### Biome Catalysts

Biome catalysts are deterministic local materials layered on top of generic essences.

Each biome has one catalyst or catalyst counter.

Example names, not final:

```text
Plains = Swarm Crest / War Crest
Forest = Alpha Fang / Wild Heart
Swamp = Rot Pearl / Mire Bloom
Mountain = Sentinel Shard / Stone Sigil
Cave = Echo Crystal / Brute Plate
Jungle = Vine Heart
Desert = Sun Mark
Volcanic = Cinder Core
Tundra = Frost Shard
Graveyard = Grave Ash
Trench = Abyss Pearl
```

Preferred model:

```text
Kill enemies in a biome → gain catalyst progress.
When progress fills → gain 1 biome catalyst.
```

Stronger enemies give more progress:

```text
normal mob = small catalyst progress
tanky/dangerous mob = more catalyst progress
future elite = large catalyst progress
guardian = large one-time catalyst progress or catalyst bundle
boss first clear = one-time catalyst bundle
```

Biome catalysts are used for:

```text
biome-specific skills
skill evolutions
item evolutions tied to that biome
core recipes or branches
advanced rune unlocks
relic fragments/recipes T4+
special weapon branches
```

Design sentence:

```text
Generic essence pays for broad power.
Biome catalyst proves local engagement.
Recipes often require both.
```

### Lower-Tier Farming Problem

Do not add hard tiered essence yet.

Preferred approach:

```text
Five generic essences stay the same across tiers.
Higher-tier enemies drop much more essence per time.
Higher-tier/current-biome recipes require relevant biome catalysts.
```

If lower-tier farming is still too efficient, consider a later anti-trivial-farm correction.

### Conversion and Catch-Up

Players should not be forced back into trivial content just to craft old prerequisite items.

Possible catch-up rule:

```text
Current-tier catch-up recipes can replace obsolete catalyst requirements with higher generic essence costs.
```

Example:

```text
Normal T1 Forest item:
- Wild Essence
- Forest Catalyst

Catch-up craft at T3:
- higher Wild Essence cost
- no Forest Catalyst
```

This keeps catalysts meaningful for active content while avoiding tedious backtracking.

### Dungeons and Bosses as One-Time Rewards

Current preferred direction:

```text
Open-world biomes = repeatable farming
Dungeons = one-time trials
Bosses = one-time exams / seals / bundles / signature unlocks
```

Dungeon/boss first-clear rewards can include:

```text
boss seal
recipe unlock or signature unlock
generic essence bundle
biome catalyst bundle
possibly rune/skill/core/relic unlock depending on tier
```

Repeatable dungeon farming is not part of the baseline plan.

Future systems may add repeatable group dungeons, hard modes, roaming world bosses, or event variants later.

### Avoid Currency Bloat

Current decision:

```text
No boss-specific material by default.
No elite currency by default.
Use biome catalysts as the deterministic special material.
Use bosses as one-time unlocks/bundles.
Use future elites as high catalyst-progress enemies.
```

Add more currencies only when an existing currency cannot express the reward cleanly.

---

## 6. Gear, Upgrades, and Evolution

### Core Gear Direction

All item slots can evolve, but with different complexity.

```text
Weapons = deepest lineage/branching identity
Armor = defensive lineage
Charm = recovery lineage
Boots = movement/farming lineage
```

Every item can belong to a lineage.

Example weapon lineage:

```text
Flash Rapier → Gale Needle → Cinder Needle / Jungle Fang / Mirage Stiletto
```

### Evolution vs Upgrade

Upgrade levels are numerical investment.

Evolution is identity/tier progression.

Preferred structure:

```text
+3 = evolution-ready
+4 = comfort / strong preparation
+5 = premium mastery
```

Evolution should generally require +3, not +5.

### +5 Role

+5 should not be required for early-tier progression.

Preferred +5 rewards:

```text
cheaper evolution
cheaper branch switching
partial essence/catalyst refund
cosmetic/mastery marker
easier reconstruction of this lineage
maybe unlocks alternate branch recipe earlier
```

Avoid:

```text
permanent inherited combat bonus
mandatory +5 evolution
boss balance assuming +5 in early tiers
```

### Branching Evolutions

Branches are alternate evolved forms inside a lineage.

Example:

```text
Rapier Lineage

T1:
- Flash Rapier

T2:
- Gale Needle

T3 branches:
- Cinder Needle = Volcanic / heat / attack-speed / flurry
- Jungle Fang = Jungle / poison / on-hit / spread
- Mirage Stiletto = Desert / opening strike / execute
```

Branches should not be permanent irreversible choices. The player should be able to learn multiple branches over time and switch/reconstruct at a cost.

### Reconstruction / Catch-Up Crafting

Problem:

```text
Player reaches T3 and wants Cinder Needle.
Bad version: go farm T1 Forest, craft Flash Rapier, evolve to Gale Needle, then evolve to Cinder Needle.
```

Preferred solution:

```text
Owning and upgrading the previous item is the efficient path, but not the only path.
```

Two paths:

```text
True evolution:
- previous item at +3
- recipe
- essence
- catalyst
- lower cost

Direct reconstruction:
- lineage/recipe known
- essence
- catalyst
- higher cost
- no need to rebuild the entire chain
```

This preserves lineage importance without making experimentation painful.

---

## 7. Skills

### Skill Slot Structure

Current preferred structure:

```text
Technique slot = offensive / enemy-facing skill
Guard slot = defensive / recovery / self-facing skill
Mobility = tag, not a separate slot
```

Early direction:

```text
T1 = 1 Technique + 1 Guard
Later = more Technique/flex depth
Guard slots expand very cautiously, if at all
```

Extra Guard slots risk immortal automation. Defensive depth should mostly come from one Guard skill plus armor/charm/rune/core synergies.

### Skill Responsibility

```text
Skill = timed intervention
Item = passive engine
Rune = when the intervention fires
```

### Offensive Skills

Most offensive skills should arm or modify the next attack rather than being free independent casts.

Examples:

```text
Sweep / Cleave = next attack cleaves
Execute = next attack gains low-HP bonus
Expose / Sunder = next attack applies debuff/shred
Leap Strike = move to target, then next attack is empowered
Charged Blow = windup, then next attack is empowered
DoT Detonate = next attack consumes/detonates DoT state
```

Some offensive effects can be separate actions:

```text
self-buff
aura
ground puddle / field
```

### Guard Skills

Guard skills are usually separate defensive/recovery/mobility reactions.

Examples:

```text
Brace
Cleanse
Barrier
Heal
Disengage
Parry
Take damage as DoT
Enemy weakening debuff
```

### Mobility Skills

Mobility is a skill tag.

```text
Leap Strike = Technique + Mobility
Evasive Retreat = Guard + Mobility
Charge Taunt = Guard/Tank + Mobility
Shadow Step = Technique/Utility + Mobility
```

Boots remain the passive movement layer.

### Skill Evolution

Skills should evolve through families across tiers.

Preferred:

```text
Sweep → Sweep II → Whirlwind / Shockwave
Brace → Brace II → Bulwark / Counterguard
Cleanse → Cleanse II → Purifying Pulse / Antivenom Field
Leap Strike → Leap Strike II → Predator Pounce / Thunderstep
Expose Weakness → Expose II → Sunder Mark / Execution Mark
```

Avoid same-tier upgrades like:

```text
Sweep +1
Sweep +2
Sweep +3
```

Skill evolution should add behavior, tags, targeting, rune hooks, class interaction, or branches—not just bigger numbers.

---

## 8. Class Recovery, Charms, and Recovery Layers

Classes already have baseline recovery mechanics:

```text
Squire / Cooldown = fraction of OOC regen applies in combat
Striker / Cadence = periodic burst healing
Apprentice / Warlock / DoT = damage debt + DoT resistance
Energy = recurring temporary HP shield
Reload = recovery on kill
```

These should be kept.

They serve as each class’s native recovery rhythm and let classes function before items are optimized.

### Charm Role

Charms become:

```text
recovery engine
+ recovery specialization
+ Guard-skill amplifier
```

Old T1 charm identities still work:

```text
Plains = heal on kill / momentum recovery
Forest = out-of-combat regen / recovery rhythm
Swamp = absorb / delayed recovery
Mountain = temporary shield / pre-hit buffer
Cave = periodic burst heal / long-fight recovery
```

Later charm identities:

```text
Desert = cleanse / anti-debuff / last-stand recovery
Volcanic = in-combat regen / attrition recovery
```

### Recovery Layer Map

```text
Class = baseline recovery rhythm
Charm = recovery school / sustain specialization
Guard Skill = timed survival response
Armor = mitigation profile
Core = role/range amplifier
Rite/Discipline = between-fight recovery behavior
Rune = when Guard skill fires
```

---

## 9. Runes, Stances, and Rites/Disciplines/Protocols

### Runes

Runes remain the automation spine.

```text
Condition → Action
```

Examples:

```text
When HP is low → retreat
When surrounded → use AoE skill
When target is low HP → use execute
Before finisher → apply debuff
When poisoned → cleanse
```

Preferred reward split:

```text
Biome Mastery = basic and biome-problem rune conditions/actions
Bosses = advanced, signature, or boss-reactive rune tech
Global Mastery = more runic points
```

Do not add a hard automation count limit unless UI/performance/priority issues require it. Runic points are the main constraint.

### Stances

Stances are persistent combat postures.

Preferred economy:

```text
Stance system likely unlocks T2.
Stances are free to equip.
Player chooses one active/default stance.
Automated stance switching costs runic points.
Biome Mastery unlocks stance recipes.
Bosses can unlock signature stance variants or stance-switch tech.
```

Example stances:

```text
Balanced Stance
Offensive Stance
Defensive Stance
Tanking Stance
Evasive Stance
Support/Banner Stance later
```

### Rites / Disciplines / Protocols

Naming is unsettled. “Rites” or “Disciplines” currently fit better than “Protocols,” unless the game leans into arcane-programming language.

These modify between-fight rhythm, recovery transitions, buff decay, target acquisition, party regrouping, or other long-flow behaviors.

Preferred economy:

```text
System likely unlocks T3.
Biome Mastery unlocks recipes.
Global Mastery may unlock additional slots/rank caps.
Bosses may unlock rare/special variants.
```

Examples:

```text
Quickened Breath = reduce OOC regen delay
Cleansing Breath = remove debuffs/DoTs shortly after leaving combat
Lingering Momentum = buffs decay more slowly after combat
Hunter's Instinct = acquire next target faster after kill
Antivenom Rite = poison/DoT stacks fall off faster out of combat
Mountain Breathing = recover shield resources faster after large hits
```

---

## 10. Cores

Cores are the role/range amplifier slot.

Primary purpose:

```text
reinforce close/mid/far identity
help solve ranged safety dominance
make melee/bruiser/tank builds durable enough
give mid-range a real role
support party identities such as tank/support
```

### Range Tags

Avoid continuous range scaling.

Preferred:

```text
Close Core = full effect only with Close range
Mid Core = full effect only with Mid range
Far Core = full effect only with Far range
Universal Core = works for anyone, weaker/simpler
Party Core = role-based, may work across ranges
```

### Close Cores

Close cores compensate for melee risk and travel tax.

Examples:

```text
Bastion Core = tank / group defender
Predator Core = melee tempo / aggressive farmer
Duelist Core = single-target melee / elite hunter
```

May provide:

```text
HP / plating / DR
recovery under pressure
threat control
target stickiness
dash/charge support
defensive buffer near enemies
kill-chain movement
```

### Far Cores

Far cores reinforce ranged identity but should include real tradeoffs.

Examples:

```text
Sniper Core = long-range precision / elite burst
Artillery Core = charged attacks / AoE windows
Skirmisher Core = mobile ranged farming
```

Possible tradeoffs:

```text
lower HP
weaker Guard potency
lower sustain
reduced effect when enemies are close
movement/cast restrictions
```

### Mid Cores

Mid range should become hybrid/control/skill-interaction range.

Examples:

```text
Arcanist Core = skill-heavy / cooldown manipulation
Harbinger Core = DoT/attrition manipulation
Warden Core = defensive controller / debuffer
Banner Core = support aura / party utility
```

### Core Progression

Cores can have shallow same-tier ranks unlike skills.

Suggested:

```text
Core Rank 1 = base identity
Core Rank 2 = improved budget
Core Rank 3 = signature hook improves
```

Avoid +5-style core enhancement if gear already has +5.

Preferred unlock:

```text
T2 = simple role cores
T3 = range-specific core evolution after range choice
T4+ = advanced role morphs
```

---

## 11. Relics

Relics are intentionally not deeply designed here.

Current placeholder identity:

```text
Relics = later build-warping mini-keystones / rule benders
```

Likely unlock timing:

```text
T4+
```

Some relic recipes/fragments may come from Biome Mastery. More special/named relics may come from bosses.

---

## 12. Biome Identity

Biome identity should be a combat ecology, not only a monster stat package.

A biome is defined by:

```text
spawn pattern
movement / grouping behavior
aggro / pull behavior
attack profile
terrain / hazard interaction
dungeon expression
boss exam
```

Relationship:

```text
Biome = open-world version of the problem
Dungeon = concentrated challenge version
Boss = named final expression of the problem
```

### Starter Biomes

#### Plains — Swarm Field

```text
Many weak enemies converge and create many-body pressure.
```

Open-world behavior:

- Mobs cluster more actively.
- Some mobs call nearby allies when aggroed.
- Individual enemies are weak, but group pressure becomes dangerous.

Build question:

```text
Can you survive and clear many weak enemies?
```

Counters:

```text
cleave / AoE
plating
heal-on-kill
kill-chain recovery
swarm-control runes
melee brawler tools
```

#### Forest — Predator Packs

```text
Small, fast, coordinated packs hunt the player.
```

Open-world behavior:

- Alpha mobs patrol with 1–2 followers.
- Followers assist the alpha.
- Followers may retreat toward the alpha or call it.
- Forest terrain such as trees creates pathing texture.

Build question:

```text
Can you handle fast pursuit, small packs, and target transitions?
```

Counters:

```text
burst
opening strike
mobility
roots/slows
evasion
target-priority runes
soft-stealth / pull-control boots
```

#### Swamp — Attrition Terrain

```text
The battlefield becomes poisonous, slow, and harder to recover through.
```

Open-world behavior:

- Ambient poison/rot pools may appear.
- Some mobs create pools periodically.
- Some mobs leave pools on death.
- Pools may slow movement, apply poison, increase DoT damage taken, or reduce healing.

Build question:

```text
Can you sustain through accumulated damage, debuffs, and bad terrain?
```

Counters:

```text
cleanse
DoT resistance
absorb
regen
out-of-combat cleansing rites
hazard-aware movement runes
swamp boots / reduced pool penalty
```

#### Mountain — Guarded Ascent

```text
Enemies hold terrain, defend chokepoints, and punish forced approaches.
```

Mountain needs terrain to fully come alive. The stronger identity is guarded positions, not merely big slow hitters.

Open-world behavior:

- Sentinels hold narrow paths, bridges, or chokepoints.
- Shield-wall enemies guard lanes.
- Ranged/throwing enemies can stand behind frontliners.
- Heavy mobs use telegraphed slams or charges.

Build question:

```text
Can you break a defended position without being crushed?
```

Counters:

```text
Brace
shields
damage cap
high HP
sunder / armor break
defensive stance
charged attacks
tank/bruiser cores
```

#### Cave — Patrolled Elite Territory

```text
Sparse dangerous elites patrol predictable territory and punish overpulling.
```

The current Cave brute enemy can become a key identity anchor. Brutes should patrol in organized, repetitive, predictable patterns.

Open-world behavior:

- Few enemies.
- Durable elites.
- Brutes patrol fixed routes.
- Some elites have very high detection range.
- Fighting can risk pulling additional elites.
- Stealth / reduced-detection boots become meaningful.

Build question:

```text
Can you choose fights carefully and kill hard targets without overpulling?
```

Counters:

```text
single-target DPS
sunder / elite damage
elite-focus runes
stealth boots
reduced detection range
duelist cores
long-fight recovery
```

### Advanced Biomes

```text
Jungle = living ambush ecology / overgrowth / roots / hidden threats
Desert = lethal duels, marks, open-space danger, phase-shifting duelists
Volcanic = escalating heat pressure / soft timer / lava vents / enrage
Tundra = frozen tempo / slows / chill / blizzard / shatter windows
Graveyard = recursive horde / undead density / revival / curses
Deep-Sea Trench = abyssal pressure / rare terrifying super-elites
```

Other possible future biomes:

```text
Ruins / Fallen City = constructs, traps, patrols, ancient mechanisms
Crystal Spires = shields, refraction, linked enemies, resonance breaks
Stormlands = chain damage, volatile burst, spacing punishment
Hive / Infestation = nests, brood summons, commanders, pressure sources
Dreamlands / Shattered Dream = illusions, phase shifts, unstable rules
```

---

## 13. Dungeons, Gauntlets, and Bosses

### Dungeon Thesis

Dungeons should be conscious challenges.

```text
Player chooses to initiate.
Build and rune setup are tested.
This is where the player is most likely to pay attention.
```

Current structure remains a good foundation:

```text
Dungeon has no inherent random spawns.
Activation object in the middle.
Guardians/pre-threats nearby.
Activating starts the challenge.
Higher version may include waves.
Recovery delay before boss.
Boss spawns.
```

Activation object can be biome-themed rather than always an altar.

Examples:

```text
Plains = warhorn / battle standard
Forest = alpha den / marked tree / blood scent trail
Swamp = corrupted spring / rot basin / sunken idol
Mountain = sealed gate / summit gong / stone watchpost
Cave = buried seal / echoing crystal / brute watchstone
```

### Guardians / Pre-Threats

Guardians should become biome-specific pre-threats.

Examples:

```text
Plains = banner carriers / callers / small swarm group
Forest = alpha pack
Swamp = pool-makers / rot totems / debuff casters
Mountain = sentinels holding chokepoints
Cave = brute patrols / durable elites
```

Possible rule:

```text
If pre-threats are alive when activated, they join or empower the challenge.
If cleared first, the challenge starts cleaner.
```

### Tier 1 Dungeon Simplicity

T1 does not need full gauntlets.

Clean T1 formula:

```text
T1 dungeon = biome-flavored guardian encounter + simple boss exam.
```

T1 should teach one sentence per dungeon:

```text
Plains: survive the swarm.
Forest: survive the pack.
Swamp: survive the rot.
Mountain: survive the impact / guarded position.
Cave: survive the elite.
```

T1 should avoid:

```text
anchors
optional modifiers
hardmode activation
complex phase chains
multi-object rituals
full rune puzzle bosses
```

### Dungeon Complexity by Tier

Suggested ramp:

```text
T1 = guardians + simple boss exam
T2 = guardians + short biome gauntlet + boss exam
T3 = stronger range/core/rune checks
T4 = multi-phase bosses and optional dungeon modifiers
T5+ = anchors, hard modes, arena transformations, advanced boss scripting
```

### Boss Structure

Current bosses are mostly big HP mobs with some phase/enrage/AoE behavior. This is a good base, but bosses should become clearer final exams.

Each boss should have:

```text
1. Core threat
2. Add/hazard layer
3. Phase change or 50% escalation
4. Rune-readable tell
5. Build counter
```

Examples:

```text
Swamp Boss
Core threat: rot / DoT / healing reduction
Add/hazard layer: pools and rot totems
Phase change: arena gets more polluted at 50%
Rune tell: boss begins Rot Bloom cast
Build counter: cleanse, absorb, DoT resistance, pool movement
```

```text
Mountain Boss
Core threat: telegraphed heavy hits
Add/hazard layer: sentinels or shockwave zones
Phase change: slam pattern gets faster at 50%
Rune tell: boss begins Titan Slam cast
Build counter: Brace, shield, damage cap, defensive stance
```

```text
Cave Boss
Core threat: elite pressure and long-fight durability
Add/hazard layer: brute patrol/add at 50%
Phase change: detection/pressure increases
Rune tell: boss echoes/awakens brute
Build counter: elite focus, stealth/detection control, sunder, long-fight recovery
```

Rune-readable tells matter because the game is automated.

Examples:

```text
Boss begins heavy cast → Brace
Boss summons adds → use cleave skill
Player has Rot stacks > 3 → Cleanse
Boss below 25% → Execute
Arena heat high → Defensive stance
Boss enters ranged phase → chase/mobility setup
```

### T1 Boss Balance Target

Old state:

```text
Boss could be beaten after roughly 20% of T1 engagement.
```

New target:

```text
T1 boss should be beatable around 50–60% T1 preparation.
```

This should not mean maxing every T1 biome.

It should mean:

```text
player has several relevant +3 items
player has a useful Technique/Guard setup
player has some relevant biome mastery
player has basic runes
player has engaged with multiple T1 tools
```

Balance expectation:

```text
+0/+1 = probably dies
+2 = may beat easiest/favorable boss
+3 = intended clear point
+4 = comfortable
+5 = overprepared / boss becomes much easier
```

---

## 14. Map Traversal and Future World Systems

### Current Map Traversal Issue

Map traversal is a known unresolved issue.

Current problem:

```text
Map expands outward from the center.
Low-tier zones are near the center.
Higher-tier zones are toward the edges.
Traveling between far higher-tier biomes can require crossing large amounts of obsolete low-tier terrain.
```

This can make traversal feel like dead time rather than meaningful world movement.

Important player/world-feel goal:

```text
The world should feel interconnected.
Players should be able to see each other moving through the map.
The game should not collapse into an instance hub or teleport menu.
```

No final solution is set in this document.

### Future Emerging World Events

Emerging world systems are promising later, after the core rework is implemented and playtested.

Possible future systems:

```text
changing biome affixes
limited-time biome events
roaming world bosses
roaming elite patrols
temporary map-state changes
event-driven reasons for players to gather physically
```

These may eventually help traversal feel meaningful by creating reasons to move through the world.

Examples:

```text
Swamp Rot Bloom = stronger rot hazards and increased rewards
Cave Brute Patrol = more elite patrols and stealth/detection relevance
Volcanic Overheat = heat pressure rises faster in affected nodes
Graveyard Horde = undead density spreads to neighboring nodes
Roaming world boss = players converge on a physical location
```

These are future systems, not part of the current rework MVP.

### Future Group Content

Group content is also a later layer.

Possible future systems:

```text
group dungeons
dangerous shared zones
roaming world bosses
party-role checks
group-balanced dungeon variants
shared deterministic rewards
```

These should come after core solo progression, biome identity, roles, cores, runes, and dungeon language are working.

Baseline rule remains:

```text
Solo-complete.
Party-incentivized.
Group content optional/parallel.
```

---

## 15. UI, Clarity, and Player Understanding

The rework adds many systems, so clarity becomes critical.

Useful future UI/clarity needs:

```text
Biome identity summary
Recipe unlock visibility
Catalyst progress visibility
Pinned recipe/wishlist
Boss seal progress
Global Mastery next unlock
Failure/death diagnosis
Build mismatch hints
Rune suggestion hints
Dungeon/boss tell visibility
```

Failure diagnosis is especially important.

Examples:

```text
You died while surrounded by many weak enemies.
Suggested answers: cleave, plating, heal-on-kill, swarm-control runes.

You died after repeated poison damage.
Suggested answers: cleanse, DoT resistance, absorb, Swamp tools.

You died to a large telegraphed hit.
Suggested answers: Brace, shield, damage cap, Mountain armor.
```

This supports organic learning without a heavy tutorial.

---

## 16. Implementation and Balance Implications

The conceptual rework implies a major balance pass.

Required implementation/balance work:

```text
rebalance biome XP requirements
possibly expand biome levels per tier segment
rebalance essence drop rates
add biome catalyst progress and costs
rebalance item costs around recipe unlock + crafting cost
rebalance item upgrade costs through +5
rebalance item evolution around +3 readiness
rebalance T1 bosses around +3 intended clear
rebalance tier advancement around multiple boss seals
update combat simulator/reporting for new systems
```

### T1 Progression Target

Before:

```text
One-biome rush → craft a few items → boss at ~20% tier engagement
```

After:

```text
Engage with multiple T1 tools → build toward +3 → boss at ~50–60% tier preparation
```

This should feel like needing a real build, not like completing a mandatory checklist.

### +5 Balance Target

Early tiers:

```text
+5 = premium comfort / boss help / overpreparation
```

Later tiers:

```text
+4/+5 may become more expected, but +5 should still be handled carefully
```

Avoid accidentally balancing early bosses around +5.

---

## 17. Concrete Next Work

The major brainstorming architecture is now mostly settled.

Most useful next steps:

```text
1. Create concrete T1 content package.
2. Create concrete T2 content package.
3. Red-team the system rework plan.
4. Define MVP implementation scope.
5. Update balance/simulation reports to understand the new systems.
```

### T1 Content Package Should Include

For each T1 biome:

```text
biome identity
2–3 enemy types
guardian/pre-threat pattern
boss mechanic
weapon
armor
charm
boots
Technique skill
Guard skill
1–2 rune unlocks
catalyst name
biome mastery reward layout
```

This will turn the abstract rework into something testable.

### Red-Team Questions

Useful questions for critique:

```text
Can players still rush one biome?
Does catalyst pressure become annoying?
Are melee cores mandatory instead of interesting?
Do skills make gear feel irrelevant?
Do dungeons feel like exams or chores?
Does +5 become secretly mandatory?
Are old biomes useful or tedious?
Does the UI explain enough?
Does the reward map create currency bloat?
Are ranged builds still too safe?
Does mid-range have a real reason to exist?
```
