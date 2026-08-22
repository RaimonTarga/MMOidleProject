# Monster Combat Rework Handoff — Locked Biome Designs (T1–T4)

**Date:** 2026-08-22  
**Purpose:** Implementation/planning handoff for a coding agent.  
**Scope:** Individual monster combat identities, recurring lineages, and the small ecology changes explicitly approved during the design pass.  
**Out of scope:** Final numerical balance, rewards/economy, bosses, item/class balance, and broad biome-layout redesign unless explicitly called out below.

---

## 0. Read This First

This document consolidates the monster-design conversation and represents the **latest locked direction**. It intentionally overrides mechanics and comments that exist in the current monster-definition files when they conflict with the decisions below.

### Core design rule

Do **not** add mechanics merely because a monster is simple.

Early monsters are allowed to be simple. A monster can be differentiated by:

- movement behavior;
- roaming behavior;
- target/position behavior;
- one signature attack;
- a shared lineage mechanic;
- its role inside the biome ecology;
- or simply a distinctive stat shape.

"No new mechanic" is a valid and often preferred result.

### Goal of this pass

The biomes already have substantial ecology work. This pass is primarily about making **individual monsters and lineages more recognizable** without turning every enemy into a mini-boss.

Desired progression:

- early tiers: restrained and readable;
- later tiers: more authored behavior;
- recurring families: evolve recognizable mechanics;
- not every lineage must appear every tier;
- later enemies can become more complex, but each should still have one clear headline identity.

### Idle-game constraint

This is an idle MMO. Enemy mechanics may reward active play, but ordinary farming should usually be solvable through configuration:

- class/build choice;
- Guards and Techniques;
- runes / automation priorities;
- targeting rules;
- mobility;
- resistance;
- routing / stealth;
- sustain;
- burst vs sustained damage.

Telegraphs are good. Requiring constant frame-perfect manual inputs is not.

### Numerical balance

Most current values are **placeholders**.

Do not preserve a number merely because it is already in code. Preserve the **stat shape** where this document asks for it.

A separate balance pass will follow. Important numerical/field cleanup is summarized in §12.

### Tier-label warning

Some source comments use stale tier terminology from older progression structures. This handoff is authoritative when those comments conflict with it.

---

# 1. Plains — Keep It Simple

Plains is already close to finished and should remain an early, readable biome.

## Field Hare

**Role:** basic swarm body / pack follower.

**Locked behavior:**
- no special combat ability;
- deliberately one of the simplest enemies;
- participates in Plains' swarm behavior.

Do not add dodge, debuffs, finishers, or extra complexity.

## Boar

**Role:** basic charging herd threat.

**Locked behavior:**
- keep charge-on-aggro;
- no additional special mechanic required.

## Prairie Wolf

**Role:** fast pack alpha/caller.

**Locked behavior:**
- very fast;
- uses existing Plains pack/call behavior;
- pack relationship is its identity.

No additional ability required.

## Stampede Bull

**Role:** heavier herd charger.

**Locked behavior:**
- keep as heavier charging threat;
- no extra ability required.

## Savanna Hawk

**Role:** aerial ranged enemy.

**Locked change:**
- aerial roaming while idle;
- fly rather than move like a ground creature;
- ordinary ranged combat once engaged.

**Do not:**
- make it repeatedly hit-and-run;
- constantly disengage/re-engage;
- create annoying repeated swoops.

A one-time approach/swoop is optional if it falls naturally out of implementation.

### Plains conclusion

After the Hawk movement/presentation cleanup, Plains is essentially done.

---

# 2. Forest — Frequency, Packs, and One Ranged Volley

Forest should also remain straightforward.

## Basic Forest filler (`forest-slime` / current renamed basic creature)

**Role:** deliberately basic Forest filler.

**Locked behavior:**
- frequent attacks;
- no special mechanic.

It is allowed to be extremely simple.

## Wolf

**Role:** normal predator-pack alpha.

**Locked behavior:**
- adult Wolf + 2 Young Wolves;
- fast pack threat;
- existing pack behavior is enough.

## Young Wolf

**Role:** pack body.

**Locked behavior:**
- simple follower;
- no extra mechanics.

## Dire Wolf / Ancient Wolf

**Role:** evolved Wolf pack.

**Locked change:**
- remove Thorn Spitter / canopy-sprite from its follower list;
- mixed wolf+ranged-creature pack was rejected;
- spawn only Young Wolves.

**Baseline count:**
- start with **3 Young Wolves**;
- 4 is acceptable later if balance supports it.

Identity:
- stronger/faster alpha;
- larger pure wolf pack;
- current engagement/charge behavior.

No additional ability required.

## Ironclaw Badger

**Role:** territorial melee blender.

Preserve:
- very slow movement;
- small territory / low roaming;
- very fast attack cadence once in melee.

No new ability required.

Player-facing read:
> Easy to avoid; extremely dangerous if allowed to sit on top of you.

## Thorn Spitter

**Role:** ranged Forest pressure.

**Locked mechanic:** periodic burst volley.

Preferred simple implementation:
- every Nth attack (baseline concept: every 3rd), fire a second thorn in quick succession;
- equivalent short two-shot cadence is acceptable.

Exact damage split/cadence is balance-owned.

Do not turn it into a generic root/slow support creature.

---

# 3. Swamp — Poison Lineages, Support, and Ambush

T1 is conceptually sound. The larger rewrite is in later monster stages.

**Important:** current Swamp damage values were explicitly called out during playtesting as likely **far too high**. Do not treat them as authoritative.

## T1 Mire Ooze

**Role:** baseline poison enemy.

- weak direct attack;
- poison stacking is the main threat;
- no extra mechanic.

## T1 Mud Toad

**Role:** poison + sticking power.

- lighter poison than Ooze;
- on-hit slow / mire-clinging effect;
- no further mechanic required.

---

## Snapper lineage

### Moss-Shell Snapper

**Role:** armored swamp anchor.

Replace "big HP + DR + more poison" with a recognizable shell identity.

**Locked direction:**
- high HP;
- slow movement;
- shell/plating is main defense;
- reduce/remove generic DR if shell/plating already defines it;
- de-emphasize poison.

**Signature: Shell Up**
- rare or one-time defensive state;
- retracts into shell;
- cannot meaningfully attack/move while shelled;
- becomes extremely resistant to direct damage.

Preferred trigger:
- one authored HP threshold such as ~50%, or a long internal cooldown.

DoTs can continue ticking while shelled.

### Plague-Shell Snapper

**Role:** evolved shell anchor.

Inherits Shell Up.

**Evolution:**
- shell-up also contaminates nearby area with poison cloud/pool.

Progression:
- earlier Snapper: shell = defense;
- later Snapper: shell = defense + space denial.

Avoid stacking huge HP + plating + major DR without a strong reason.

---

## Witch / Hexer lineage

### Bog Witch

**Role:** ranged attrition support.

Remove the "another ranged stacking poison mob" identity.

**Locked mechanic: Wither**
- periodic debuff reducing player **Recovery effectiveness**;
- normal attacks relatively weak;
- Wither is the reason the Witch matters.

Conceptual seed:
- ~25–35% Recovery suppression, exact value not locked.

Do not put major stacking poison on every basic attack.

### Later Witch / current Mire Hex Spitter

Prefer a lineage-continuous name if art supports it.

**Role:** evolved Swamp support.

Inherits:
- Wither.

Adds:
- periodic hex that **refreshes/extends existing poison durations**.

Important:
- it does **not create extra poison stacks**;
- it supports poison already applied by other mobs.

---

## Stalker / Lurker lineage

### Mire Stalker

**Role:** venomous ambush predator.

**Locked behavior:**
- fast/light predator;
- meaningful evasion is acceptable as its defensive specialization;
- reduce/remove generic DR/excessive bulk if it already owns evasion;
- opening bite after aggro applies multiple poison stacks immediately;
- normal combat afterward.

Concept:
- normal bite = 1 stack;
- opener = 2 stacks.

Exact values are balance-owned.

Do not repeatedly vanish/re-ambush.

### Bog Lurker

**Role:** evolved environmental ambusher.

**Locked AI/ecology:**
- lives/idles inside bog or poison pools;
- semi-hidden / partially submerged while idle;
- does not roam like a normal crocodile;
- erupts from pool when player comes near.

**Signature opener:**
- first bite applies a larger multi-stack poison alpha strike, conceptually ~3 stacks.

Afterward:
- normal combat;
- no repeat pool-retreat;
- no repeated stealth reset.

---

# 4. Mountain — Clean the Existing Lineages

Do **not** add monsters merely to fill missing tier links. Lineages may disappear for a tier and return later.

Major identities:
1. ledge-crossing caprines;
2. huge ground bruisers/slammers;
3. ranged mountain artillery;
4. flyers;
5. standalone late elite.

---

## Cliff Hopper lineage

### Cliff Hopper

**Locked behavior:**
- vaults mountain ledges;
- Strong Kick with knockback;
- knockback matters around ledges/positioning.

**Change:**
- prefer normal/mobile roaming over current sentinel-style fixed patrol.
- Hopper fantasy is terrain traversal, not guarding a post.

### Avalanche Ram

**Role:** return/evolution of Hopper lineage.

- ledge traversal;
- aggressive charge;
- heavy knockback ram/kick.

### Avalanche Tyrant

**Role:** apex caprine.

- ledge traversal;
- extreme mobility/charge;
- brutal knockback/ram.

---

## Mountain artillery lineage

### Ridge Ambusher

Already good.

- holds chokepoints;
- heavy slow ranged attacks;
- telegraphed Power Shot.

No additional mechanic needed.

### Boulder Thrower

**Role:** evolved artillery.

- remains chokepoint/position-holding ranged threat;
- heavy boulder attack.

Optional if cheap:
- lobbed/delayed impact with small telegraphed landing area.

Do not build a major subsystem solely for this.

### Crag Mortar

Current kiting behavior is not preferred.

**Locked direction:**
- relatively stationary/terrain-holding artillery;
- delayed bombardment/lobbed boulders;
- player solves via repositioning/build rather than endless chase.

Avoid conventional backpedal-kiting if feasible.

---

## Titan / Colossus / Mammoth lineage

### Granite Titan

**Locked changes:**
- **do not** give it ledge vaulting;
- ledge identity stays special to caprines/flyers;
- give it existing reusable Ground Slam from Cave/Cavern implementation;
- very slow, territorial, readable.

A modest engagement charge may remain if needed against trivial kiting.

### Mountain Colossus

- same Slam family;
- larger/more threatening footprint and/or damage;
- still deliberate/readable.

### Granite Mammoth

Use predictable cadence finisher as evolved Slam:
- large normal attacks;
- every Nth attack = major Slam/finisher.

---

## Flyer lineage

### Stone Eagle

- aerial roaming while idle;
- ignores/crosses ledges because it flies;
- one-time dive/charge on engagement;
- normal combat afterward.

No repeated hit-and-run loop.

### Cliffside Roc

Flyer lineage may disappear for a tier and return later.

**Locked behavior:**
- aerial movement;
- ranged bombardment/boulder-dropping;
- maintains useful spacing through flight rather than ordinary ground `kiter` backpedaling.

Progression:
- Stone Eagle: dive-bomber;
- Roc: aerial artillery.

---

## Cragback Rhino

**Role:** standalone late elite / weapon-matchup exam.

Keep conceptually:
- heavy plating;
- some DR;
- existing soft-cap/weapon-matchup identity;
- large periodic empowered hit.

Do not add another mechanic.

---

# 5. Cave / Caverns — Predictable Brutes vs Chaotic Roamers

Main contrast:

> **Brutes/Trolls are predictable territorial threats. Lurkers/Spiders unexpectedly enter fights. Gargoyles are static ranged sentries.**

Remove dodge/evasion from the roaming line. Its identity is roaming, not random misses.

## Cave Lurker

**Role:** chaotic roaming threat.

**Locked changes:**
- remove evasion;
- fast movement;
- large wander radius;
- active/short idle cycle;
- can unexpectedly wander into existing fight.

No special attack required.

## Cave Brute

**Role:** predictable territorial elite.

- fixed/readable patrol/territory;
- Ground Slam;
- clear wind-up;
- strong but predictable.

---

## Spider lineage

### Giant Spider

**Role:** evolved Cave Lurker.

- remove evasion;
- fast chaotic roaming;
- venom is the new escalation;
- can unexpectedly join another fight.

Do not give it repeated stealth/ambush behavior.

### Deep Spider

- even more active roaming / large wander space;
- stronger venom;
- no evasion gimmick.

Do not automatically replace removed evasion with more DR.

---

## Troll lineage

### Cave Troll

**Important override:** keep the more authored Slam setup. Do **not** simplify it into "walk up and Slam."

**Locked engage sequence:**
- Troll closes/engages;
- applies a short control/lock/stun setup;
- then prepares/commits Ground Slam.

The point is that the later Troll makes the player **answer the Slam**.

Valid configured answers:
- Brace / mitigation;
- Disengage / reposition after control window;
- Guard setup;
- other control/defensive tools.

**Design contract:**
- control + telegraph must still allow a configured response;
- if Disengage is an intended answer, control ends early enough for it to fire before impact;
- no frame-perfect manual requirement.

The existing `charge-lock-charged-attack` concept is worth preserving/refining.

### Cavern Troll

Final Brute/Troll evolution.

Inherits:
- territorial behavior;
- engage/control setup;
- Ground Slam.

Evolution:
- wider/larger/more punishing Slam;
- longer/readable tell rather than making it unanswerable.

---

## Gargoyle lineage

### Cave Gargoyle

**Role:** static ranged sentry.

**Locked change:**
- does not roam like normal ranged enemy;
- remains perched/static;
- activates when player enters aggro range;
- fires from that position.

Optional secondary:
- occasional telegraphed heavy Stone Spear / Stalactite Shot.

Static sentry behavior is the main mechanic.

### Crystal Gargoyle

- same perch/static identity;
- evolved charged crystal volley / several rapid shots after wind-up;
- one stronger heavy shard is acceptable if volley support is expensive.

Do not make it a kiter.

---

# 6. Jungle — Terrain Creates the Swarm

Existing ecology:
- high density;
- bushes slow player;
- entering bushes increases player aggro radius;
- player can configure routing/runes around entering/avoiding bushes.

**Hard rule:**
- no monster pack/alpha/follower/call-allies mechanics.
- terrain creates the multi-pull.

**Rejected:** Marking Dart that increases player aggro radius. Do not implement it.

---

## Ambusher lineage

### Jungle Snake

**Role:** bush-lurking early Jungle ambusher.

- likes to lurk/idle in/around bushes;
- stronger opening strike/pounce;
- light poison is acceptable and is early Jungle's main poison presence;
- ordinary melee after opener.

No evasion needed.

### Jungle Stalker

**Role:** evolved ambusher.

- very fast;
- moves through/around foliage effectively;
- pounce/strong opener;
- de-emphasize/remove poison here.

### Hunting Panther

**Role:** apex ambusher.

- strongest fast foliage predator;
- pounce/engagement burst;
- no generic evasion gimmick.

---

## Ape / Silverback lineage

### Jungle Ape

**Role:** priority bruiser that punishes long fights.

Current `charge + opening strike + ramp` is too much.

**Locked:**
- charge to enter combat;
- attack/damage ramps over time while in combat.

**Remove/de-emphasize:**
- separate opening-strike multiplier;
- unnecessary generic DR.

### Silverback

- charge;
- stronger combat ramp;
- remove unrelated pack/evasion/opening clutter.

### Apex Silverback

- charge;
- strongest combat ramp;
- remove evasion;
- remove separate opening strike;
- avoid excessive DR layering.

Visual Rage state at high ramp is optional presentation.

---

## Chameleon lineage

### Vine Chameleon

**Role:** concealed ranged nuisance.

- camouflaged/visually subdued while idle;
- reveals when attacking;
- normal ranged behavior afterward.

Light poison is optional at this first stage, but not core identity.

Do not repeatedly re-camouflage in combat.

### Canopy Chameleon

**Role:** evolved concealed ranged threat.

**Opening Volley**
- reveal from camouflage;
- rapidly fire ~2 shots;
- then ordinary ranged combat.

No poison necessary.

### Thornback Chameleon / current Thornback Lizard

If art still reads Chameleon, prefer lineage-continuous naming.

- camouflage while idle;
- stronger opening volley, conceptually ~3 rapid projectiles;
- ordinary ranged combat afterward.

Do not keep current stacking poison solely because it is late tier.

---

## Emerald Constrictor

**Role:** standalone T4 elite/control predator.

Current kit is overstacked.

**Locked headline: Constrict**
- predictable cadence attack, e.g. every Nth successful attack;
- heavier hit;
- briefly **roots** player.

Light venom may remain for snake flavor.

**Remove:**
- evasion;
- combat ramp;
- unnecessary extra defensive layers.

Interesting interaction:
> Constrictor roots player inside an already-dangerous Jungle pull.

---

# 7. Desert — Exact Controller/Dealer Duos

Biome contrast:

> Jungle: "I accidentally pulled six things."  
> Desert: "It is exactly two things. Which one do I kill first?"

## Hard structural rule

Normal Desert group = **exact 1:1 duo**.

### Controller
- high HP;
- low mobility;
- low direct offense;
- does not kite;
- applies control/debuffs.

### Dealer
- low HP;
- fast;
- ranged kiter;
- high direct damage;
- generally no CC of its own.

Aggro either -> engage both.

This is a **duo**, not fictionally an alpha+followers pack.

If pack infrastructure is reused internally, remove contradictory pack-specific behavior.

### Important removal

Do **not** despawn/scatter Dealer when Controller dies.

Decision:
- kill Dealer first -> incoming DPS collapses, Controller remains annoying;
- kill Controller first -> CC disappears, but player tanks Dealer damage while doing so.

---

## Basilisk controller lineage — hard control + vulnerability

### Stone Basilisk

Replace ordinary-hit `speedMult: 0` with readable ability.

**Petrifying Gaze**
- periodic wind-up;
- brief root;
- weak normal attacks.

Can function at short/mid range.

### Desert Basilisk

Inherits Gaze.

Adds:
- **single nonstacking Sunder/Expose** increasing damage taken.

Conceptual range:
- ~10–15%.

Do not use current 4-stack +32% model.

Clean option:
- successful Gaze roots and leaves player Exposed for several seconds.

### Dune Basilisk

- root;
- stronger/longer nonstacking Sunder;
- conceptual ceiling ~15–20% before balance.

No large stacking vulnerability.

---

## Scorpion/Viper controller lineage — soft mobility control

Repurpose current solo "harasser" line into second Controller family.

### Sand Scorpion

Reshape:
- HP higher;
- movement lower;
- direct damage much lower.

Mechanic:
- strong movement slow.

Pair 1:1 with Sun Scarab.

### Dune Stalker

- evolved soft controller;
- stronger/longer slow/Cripple;
- durable/slow/low direct offense;
- paired with Gilded Scarab.

### Sand Viper

- mature soft controller;
- severe Cripple/high soft-control uptime;
- controller stat shape, not current fast DPS profile;
- paired with Sunshield Scarab.

---

## Scarab dealer lineage

### Sun Scarab

- fragile;
- fast;
- ranged kiter;
- high direct damage.

**Remove its slow.**

### Gilded Scarab

- squishy high-damage kiter;
- occasional charged/high-damage ranged shot.

Readable combo:
> Controller roots/exposes -> Scarab winds up dangerous shot.

No slow on Dealer.

### Sunshield Scarab

- high-damage kiter;
- small Sunshield/Barrier;
- shield recharges only after avoiding damage for several seconds.

So:
- catch and pressure it -> stays fragile;
- fail to catch it -> shield returns.

Do not make it generically tanky.

---

## Dune Tyrant — apex exception

Still:
- exactly 1 Tyrant + 1 Sunshield Scarab.

**Role:**
- durable/slow apex Controller;
- also real personal offense.

Simplify current kit.

Preferred:
- one strong control action, e.g. Crushing Pincer causing strong slow or brief root;
- one telegraphed heavy Pincer Smash.

Do not stack huge slow + vulnerability + multiple Dealers + unrelated gimmicks.

---

# 8. Volcano — Global Heat, Not Per-Mob Ramps

## Global Heat

During continuous combat:
- Heat rises predictably;
- increases **player damage dealt**;
- increases **player damage taken**;
- capped;
- clearly visible;
- decays/resets after genuinely leaving combat.

Exact cadence/magnitude is balance-owned.

## Critical cleanup

Remove blanket `rampOnCombat` from Volcano monsters.

Global Heat already owns "fight gets more dangerous over time."

## Swarm movement

Volcano is high density.

Small creatures may use loose cohesion/separation so the biome visually reads as a swarm, but:
- no alpha;
- no followers;
- no call-allies.

Density creates the swarm.

---

## Ember Scuttler

- basic swarm filler;
- weak, fast, numerous;
- loose swarm movement;
- remove personal ramp;
- no extra ability.

## Cinder Hound

- swarm catcher / anti-kite;
- fast;
- charge on engagement;
- remove personal ramp.

## Magma Tortoise

- slow armored anchor;
- high HP;
- plating;
- very slow;
- heavier attacks;
- remove personal ramp.

Strategic role:
> It keeps combat alive, which lets global Heat keep climbing.

No signature ability required at this stage.

## Ash Salamander

- stationary ranged pressure;
- does not kite;
- fires from background.

Optional:
- light Burn.

Remove personal ramp.

---

## Ember Skink

- evolved swarm filler;
- adds light Burn;
- no personal ramp.

## Infernal Direhound

- evolved catcher;
- high speed;
- charge;
- no personal ramp.

## Obsidian Tortoise

- evolved anchor;
- predictable cadence Eruption/Slam every N attacks;
- no personal ramp.

## Ashspitter Salamander

- evolved ranged Burn pressure;
- stationary ranged;
- stronger/more persistent Burn;
- optional small volley if infrastructure is cheap;
- no personal ramp.

## Magma Salamander

**Role:** elite defensive-window enemy.

Remove personal ramp.

Retain/reframe shield as:
**Obsidian Shell / molten Barrier**
- periodically reforms;
- player wants to burst through/around its defensive windows before global Heat becomes dangerous.

If practical, reuse real Barrier framework.

## Do not over-integrate Heat

Do not add custom Heat thresholds to each normal monster yet.

Bosses/future tiers may interact with Heat more explicitly later.

## Lava pools

Keep:
- standing in lava applies Burn/DoT.

Balance check:
- lava should punish routing/positioning;
- it should not accidentally dominate total Volcano damage.

---

# 9. Tundra — Combat Tempo Suppression

Approved framing:

> **Volcano accelerates combat. Tundra suppresses combat tempo.**

Tundra:
- low-to-mid density;
- more elite-focused;
- calm/deliberate fights;
- fewer simultaneous enemies.

No new terrain system is required.

## Global Chill

During sustained combat:
- periodic cold/blizzard pulses add Chill stacks;
- Chill reduces movement speed;
- Chill reduces attack speed;
- capped;
- falls off after combat.

Do not turn max Chill into an automatic stun/freeze.

## Critical cleanup

Individual mobs should **not all reapply generic slows**.

Remove most per-hit `slowEffect`/`rampDebuff`. Environment owns baseline slow.

---

## Frost Lurker

**Role:** straightforward Tundra melee baseline.

- slow/moderate movement;
- meaningful direct hits;
- otherwise simple.

Remove current giant per-hit slow.

Natural synergy:
> Chill makes this otherwise straightforward enemy harder to kite.

## Glacier Bear

**Role:** defensive-window elite.

Keep **Ice Armor**:
- periodic frost shell/Barrier.

**Shatter payoff:**
- if player breaks armor efficiently, Bear takes bonus self-damage and/or becomes briefly staggered/vulnerable.

Preferred:
- reward breaking shell with a damage window.

Replace/de-emphasize current "shatter freezes nearby enemies."

Remove:
- per-hit ramping move slow;
- per-hit attack-speed slow.

## Rime Caster

**Role:** ranged control caster.

Change from generic kiter + slow-every-hit.

Preferred:
- relatively stationary ranged caster;
- normal frost projectiles;
- special **Frostbind** root.

Frostbind interacts with Chill.

Preferred simple implementation:
- Frostbind becomes available or meaningfully stronger once player reaches a Chill threshold.

Use a simple threshold rather than complex continuous formula if possible.

## Rime-Tusk Mastodon

**Role:** telegraphed heavy hitter.

- predictable cadence Frost/Tusk Slam;
- no need for giant slow rider.

Ambient Chill already makes escaping the telegraph harder.

## Glacial Dire-Bear

- stronger/larger Ice Armor;
- stronger Shatter reward;
- longer/better vulnerability window if needed.

Remove ramping per-hit slows.

## Hoarfrost Yeti

- evolved ranged Chill-control caster;
- stronger Frostbind / Deep Freeze root interaction at high Chill;
- no generic slow stacks on every projectile.

## Permafrost Behemoth

**Role:** Tundra apex.

Simplify current kitchen sink.

Keep:
- enormous HP;
- heavy plating;
- very slow movement;
- one huge telegraphed **Glacial Slam**.

**Signature Chill interaction:**
- Glacial Slam specifically becomes more dangerous based on current player Chill.

Do **not** scale all Behemoth damage with Chill.

**Remove:**
- enemy soft-cap.

Heavy plating is already enough defensive identity. Generic DR can be reduced/removed later if HP + plating are sufficient.

---

# 10. Wasteland — Corpses and Necromancy, Not Universal Plague

Biome was previously called Graveyard; legacy IDs/code may still use `graveyard`.

Current file makes nearly every monster a plague DoT enemy. Preferred identity:

> **Death does not cleanly remove enemies from the encounter.**

## Ecology adjustment

Prefer:
- moderate/moderately high starting density;
- not another extreme initial swarm.

Combat persists through:
- corpses;
- resurrection;
- selective death effects.

## Shared corpse rule

Normal undead deaths may leave corpses.

Necromancers manipulate those corpses.

**Critical recursion rule:**
- risen/summoned undead must **not** create reusable corpses;
- otherwise `corpse -> raise -> kill -> corpse -> raise` creates endless fights.

Risen:
- give no normal rewards;
- crumble permanently on death;
- crumble when controlling Gravewright dies.

## Bone Crawler

- basic undead body/corpse fodder;
- remove plague/DoT;
- simple melee;
- leaves valid corpse.

## Bone Rat

- fast nuisance/filler;
- remove plague/DoT;
- simple;
- leaves valid corpse.

## Plague Hound

**Role:** dedicated plague creature.

Keep:
- aggressive charge;
- modest plague/DoT;
- on-death contaminated/toxic pool.

Death pool:
- matters for positioning;
- short-lived;
- should not dominate encounter damage.

## Carrion Vulture

**Role:** ranged undead support.

Remove generic plague DoT.

Replace with:
**Necrotic Screech / Carrion Cry**
- periodically empowers nearby undead briefly.

Preferred first implementation:
- attack-speed increase.

Avoid simultaneously stacking huge damage+speed boosts.

## Gravewright

**Role:** centerpiece necromancer.

Preserve concept.

**Locked:**
- weak/squishy ranged attacker;
- no major personal plague required;
- periodically raises real corpses;
- capped living risen;
- risen weakened relative to originals;
- risen give zero rewards;
- risen crumble when Gravewright dies;
- risen do not create reusable corpses.

The Gravewright's power budget can be resurrection alone.

Current raise cadence/range/maxAlive values are balance placeholders.

## Charnel Brute — recommended deferral

The user explicitly raised cutting one or two T4 Wasteland mobs and moving them later, especially Charnel Brute.

**Strong recommendation, not hard lock:**
- defer Charnel Brute to T5 for a cleaner T4 debut.

If retained in T4:
- armored anchor;
- predictable heavy attack;
- on-death empowerment of nearby undead;
- remove stacking DoT.

Death empowerment:
- short;
- capped or refresh-only;
- no runaway multiplier from several Brutes dying together.

## T5–T8 Wasteland runway

Do not exhaust necromancy at T4.

Future options:
- fewer but stronger raises;
- raise an elite corpse;
- consume multiple corpses into one amalgamation;
- empower existing risen;
- sacrifice minions;
- protect/reposition corpses;
- temporary corpses that cannot recursively fuel resurrection;
- special undead that split on death;
- corpse hazards;
- corpses with higher necromantic value.

Maintain:
- basic bodies can have no death effect;
- special bodies get at most one meaningful death effect;
- necromancers manipulate corpses.

---

# 11. Deep-Sea Trench — Three Mini-Boss Problems

Existing ecology is good:
- extreme low density;
- very few monsters;
- each is elite/near-mini-boss;
- wide roaming territories;
- very high detection;
- accidentally pulling a second elite is the real disaster;
- stealth/routing matters.

Do not convert this into a swarm biome.

Current overlap is excessive:
- huge HP;
- plating;
- DR;
- charge;
- giant finisher;
- anti-heal.

Differentiate the three into separate single-target problems.

## Critical anti-heal cleanup

Current values can reach roughly:
- 75% healing reduction on Serpent/Stalker;
- 90% on Leviathan.

Too aggressive for intentionally long elite fights.

**Locked change:**
- remove universal anti-heal;
- anti-Recovery primarily belongs to Serpent lineage;
- use one moderate nonstacking debuff rather than 3 large stacks.

Conceptual seed:
- ~25–30% Recovery suppression.

Exact value not locked.

---

## Abyssal Serpent — the hunter

**Role:** relentless sustain-pressure predator.

Keep:
- huge roam/detection radius;
- relatively high movement for Trench elite;
- engagement charge;
- persistent melee pursuit.

**Signature: Abyssal Bite**
- periodic telegraphed heavy bite;
- applies **Abyssal Wound**;
- Wound reduces Recovery effectiveness moderately;
- nonstacking.

Normal attacks should not repeatedly stack anti-heal.

**Preferred defense:**
- huge HP;
- meaningful DR;
- less plating than other elites.

Automated/build answers:
- enough sustain despite Wound;
- Brace/defensive setup for heavy bite;
- burst/execute;
- stealth/routing to avoid second pull.

## Hadal Stalker — the kiter

Current melee charger/cadence-finisher should change substantially.

**Role:** armored ranged/skirmishing elite.

**Locked:**
- ranged/ranged-skirmisher presentation;
- `kiter` behavior;
- always catchable by properly configured player/mobility;
- heavy plating;
- lower HP than Serpent/Leviathan;
- no anti-heal;
- no engagement charge.

**Signature:**
- periodic telegraphed heavy projectile / Pressure Lance / Crushing Volley.

Ecology creates danger:
> A Close build chasing it may cross into another elite's detection radius.

Automated answers:
- Charge/mobility;
- Mid/Far;
- Brace;
- stealth/routing;
- target selection.

Do not make it literally uncatchable.

## Elder Leviathan — apex anchor

Remove:
- anti-heal;
- enemy soft-cap;
- overlapping kitchen-sink mechanics.

**Role:** ultimate stand-and-fight Trench monster.

Keep:
- enormous HP;
- strong broad defenses;
- very slow movement;
- periodic defensive shell/Barrier;
- one gigantic predictable attack.

**Abyssal Carapace**
- periodic Barrier/defensive shell;
- secondary mechanic.

**Devour**
- long clear wind-up;
- enormous bite/impact roughly every 10–12 seconds conceptually;
- central offensive threat.

Fight should read:
> huge target -> defensive shell windows -> survive Devour -> finish before another elite wanders in.

Prefer no aggressive anti-kite charge unless testing proves necessary.

### Save for future tiers

Do not add low-HP enrage yet.

A later Leviathan evolution can become more aggressive when bloodied for a stronger Execute interaction.

---

# 12. Notable Stat / Flag / Field Changes

Exact retuning is not part of this handoff, but these existing fields conflict with the locked designs.

## Plains
- no major stat rewrite required;
- Hawk needs aerial movement/presentation;
- some names/comments/legacy IDs may be stale.

## Forest
- Dire Wolf followers: remove ranged follower; use ~3 Young Wolves;
- Badger: preserve slow movement + very fast attacks;
- Thorn Spitter: add periodic double-shot/volley cadence.

## Swamp
- **broad damage retune expected**; current damage judged too high in playtesting;
- Snapper: HP + plating/shell; reduce/remove generic DR overlap;
- Witch/Hexer: remove generic stacking poison from basics; add Recovery suppression/support;
- Mire Stalker/Bog Lurker: if using evasion, reduce generic DR/bulk overlap;
- Bog Lurker needs pool-idle/ambush AI.

## Mountain
- Cliff Hopper: remove/reconsider sentinel patrol; preserve ledge vault + knockback;
- Granite Titan: **no ledge vault**;
- Titan/Colossus/Mammoth: reuse/evolve Slam;
- Avalanche Ram/Tyrant: ledge traversal + knockback;
- Crag Mortar: replace generic kiter with stationary/terrain artillery if feasible;
- Cliffside Roc: aerial ranged behavior;
- old comments about Mountain's historical damage-cap armor answer may be stale after equipment redesign.

## Cave
- remove evasion from Cave Lurker, Giant Spider, Deep Spider;
- do not automatically add DR to compensate;
- keep/refine Troll/Cavern Troll engage-control-Slam sequence;
- Gargoyles static/perched.

## Jungle
- **no pack mechanics**;
- remove pack comments/fields where present;
- Ape/Silverback/Apex: keep combat ramp, strip separate opening/evasion clutter;
- remove evasion from Apex Silverback;
- Chameleon line: camouflage + opening volley; no aggro-radius Marking Dart;
- Thornback: remove stacking poison under locked identity;
- Emerald Constrictor: remove evasion/ramp/unnecessary DR; add cadence root.

## Desert
- replace controller + 2 followers with **exact 1 controller + 1 dealer**;
- pair aggro; do not despawn Dealer on Controller death;
- Controllers: HP up, mobility down, damage down;
- Dealers: HP down, ranged DPS up, fast/kiter, remove slows;
- Basilisk: periodic Gaze root, not ordinary-hit full root;
- replace stacking vulnerability with single nonstacking Sunder;
- Scorpion/Stalker/Viper: reshape from solo fast harassers into soft Controllers;
- Sunshield Scarab: recharge-after-not-hit shield;
- Dune Tyrant: one Dealer partner and simplified kit.

## Volcano
- remove `rampOnCombat` from normal roster;
- global Heat is the ramp;
- small creatures may gain loose swarm/cohesion movement;
- Tortoise keeps plating/anchor identity;
- Obsidian Tortoise keeps cadence Eruption;
- Magma Salamander keeps shell/Barrier, no personal ramp;
- check lava/Burn scaling separately.

## Tundra
- remove generic per-hit slow spam;
- remove `rampDebuff` from Bear/Yeti line;
- global Chill owns attack/movement suppression;
- Bear line: Ice Armor + Shatter damage window;
- caster line: Frostbind root tied to Chill;
- Behemoth: remove `enemySoftCap`; only signature Slam scales with Chill;
- consider reducing generic DR if HP+plating are already enough.

## Wasteland
- remove `dotEffect` from most normal undead;
- keep plague mainly on Plague Hound/future plague line;
- Bone Crawler/Rat simple corpse bodies;
- Vulture buffs allies instead of DoT;
- Gravewright does not need personal plague;
- risen must not leave reusable corpses;
- strong recommendation: move Charnel Brute to T5;
- if Brute stays, remove DoT and keep on-death ally empowerment.

## Deep-Sea Trench
- remove universal stacked `appliesAntiheal`;
- Serpent: one nonstacking Recovery suppression on Bite;
- Stalker: ranged kiter, no charge, high plating/lower HP;
- Leviathan: remove anti-heal and enemy soft-cap; simplify to broad defenses + Barrier + Devour;
- all kiting/movement solutions remain automation-friendly and catchable.

---

# 13. Implementation Priorities

Recommended coding-agent order:

1. **Data cleanup/removals**
   - remove rejected evasion, DoTs, ramps, slows, anti-heal, followers, etc.

2. **Reuse existing mechanics first**
   - Ground Slam;
   - charged attacks;
   - cadence finishers;
   - charge/reposition;
   - Barrier/shield;
   - root/slow;
   - patrol;
   - kiter;
   - swarm cohesion/separation;
   - corpse/raise.

3. **Add only small reusable missing behavior primitives**
   Likely:
   - static/perched sentry mode;
   - idle aerial movement / flying ledge-ignore;
   - bush/pool preferred idle zones;
   - opening volley;
   - exact Desert duo linkage;
   - Recovery-suppression debuff;
   - poison-duration refresh;
   - Chill-threshold ability condition;
   - non-recursive corpse marker for risen undead.

4. **Implement biome-global mechanics cleanly**
   - Volcano Heat;
   - Tundra Chill.

5. **Then retune stats**
   - preserve role shapes;
   - current DPS/HP totals are not sacred.

---

# 14. Do Not Reintroduce

- Cave Lurker/Spider evasion;
- Dire Wolf + Thorn Spitter mixed pack;
- Jungle pack/alpha mechanics;
- Jungle aggro-radius Marking Dart;
- Desert controller + 2 dealers;
- Desert dealer slows;
- Desert default +32–40% stacking vulnerability;
- Volcano blanket per-monster `rampOnCombat`;
- Tundra slow/ramp spam on nearly every hit;
- Wasteland universal plague;
- Trench universal 75–90% anti-heal;
- Leviathan kitchen sink of soft-cap + anti-heal + shield + every other mechanic;
- repeated in-combat stealth/hit-and-run loops for ordinary flyers/ambushers/chameleons;
- new monsters solely to fill lineage gaps.

---

# 15. Final Biome Reads

### Plains
> Simple swarm bodies, chargers, one pack caller, one uncomplicated flyer.

### Forest
> Frequent attacks and predator packs, with a small amount of ranged burst pressure.

### Swamp
> Poison attrition expressed through pure poison, sticking power, shell defense, support curses, and environmental ambush.

### Mountain
> Terrain-crossing caprines, huge readable slammers, positional artillery, and occasional flyers.

### Cave
> Predictable territorial brutes versus chaotic roaming predators, plus static ranged sentries.

### Jungle
> Terrain causes the swarm; ambushers arrive suddenly, Apes punish long fights, and Chameleons add concealed backline pressure.

### Desert
> Exact two-enemy tactical duos: Controller disables you, Dealer kills you. Target priority is the exam.

### Volcano
> High-density combat gets globally hotter and deadlier over time. Mobs create reasons the fight might not end quickly enough.

### Tundra
> Low-density elite combat gradually suppresses tempo through Chill. Monsters exploit that slowing clock in different ways.

### Wasteland
> Corpses and death persist as battlefield resources. Necromancers and selective death effects make kill order matter.

### Deep-Sea Trench
> Every enemy is almost a mini-boss. The real failure state is drawing a second elite while solving the first.

---

# 16. Final Design Principle

The intended progression is not:

> every later enemy has more mechanics.

It is:

> later enemies express the biome's rules more deliberately.

A good implementation may delete more fields than it adds.

Preserve clarity, lineage continuity, and idle-game solvability over raw complexity.
