# Boss Design Audit and Redesign Preparation

**Date:** 2026-09-03  
**Scope:** Active MMO Idle guarded-altar dungeon bosses, T1-T4  
**Method:** Read-only inspection of the checked-out code/data and current design notes.  
**Explicit exclusion:** `void-overlord`, `elder-trench-serpent-warden`, `void-horror`, and `void-hulk` are excluded entirely as requested.

## How to read this document

`FACT` means the current implementation/data does this. `PROPOSAL` means an exploratory design direction only; it is not a balance recommendation or implementation specification.

The source of truth for this audit is the active `DUNGEON_DEFS` mapping and `MONSTER_DATABASE`, not prose comments or older reports. The main data files are [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts), [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts), [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts), and [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts). The common runtime is [bossScripts.ts](../server/src/systems/combat/ai/bossScripts.ts), [combat.ts](../server/src/systems/combat/engine/combat.ts), [monsterMechanics.ts](../server/src/systems/combat/engine/monsterMechanics.ts), [ai.ts](../server/src/systems/combat/ai/ai.ts), and [dungeon.ts](../server/src/systems/world/dungeons/dungeon.ts).

## 1. Executive summary

### Overall conclusion

**FACT - The roster is healthier than a generic “one slam per boss” reading suggests, but it is uneven.** The T3-T4 lineages now contain several genuinely specific encounters: Mountain fault lines, Cave corrosion thresholds, Swamp detonation/arena denial, Desert stance changes, Jungle Hunt-to-Frenzy, Tundra Ice Armor/Shatter, and Volcanic Shell/Heat. The weak point is the T2 bridge: some T2 bosses establish a real identity, while others are still a basic melee loop with a temporary stat increase or a defensive pause.

There are **26 active dungeon bosses across 11 biome lineages**. Every active boss is spawned at a guarded altar after the altar is activated and a 7-second awakening delay. Dungeon guardians are separate pre-boss encounter bodies; they are not boss summons.

The strongest design health is currently in:

- Mountain T3-T4: the charge-lock-to-slam line culminates in delayed radial fault lines.
- Swamp T3: the DoT, short-lived pool, vulnerability, detonation, and late Rot Bloom all reinforce one idea.
- Tundra T3-T4: the armor/shatter loop is meaningful, and T4 connects the boss to the node Chill ramp.
- Volcanic T3-T4: Shell Up and the Heat race are distinct from ordinary enrage design.
- Desert T3-T4 and Jungle T3-T4: both have structural state changes rather than only larger numbers.

The most urgent design work is:

1. **T2 Jungle - Jungle Dread-Gorger:** currently an opening strike followed by a 7-second speed/attack-speed buff. It has no charged signature, no evasion, no terrain interaction, and no add mechanic in current code.
2. **T4 Wasteland - Charnel-Crown Sovereign:** the corpse tide is thematically strong, but it is the only active non-Plains mechanic that creates additional enemy bodies. It therefore requires an explicit ruling under the Plains-only summon policy.
3. **T2 Forest - Apex Timberclaw:** it is substantially the T1 Greatbear fight repeated: two-hit basics plus the same permanently stacking Bestial Frenzy, with a stun swipe and a numeric phase added.
4. **T2 Mountain - Stoneplate Juggernaut:** its core slam is good, but the fight currently combines a long-reach melee profile, a slam, an uncast defensive shield, and a casted plating buff without a strong player-facing positional decision.
5. **T2 Desert - Dune-Stalker Emperor:** the mark/cash-out idea is promising, but it is too opaque in practice and has no structural phase beyond speed and charged-attack acceleration.

### Roster-wide findings

**FACT - Repetition is real, but not uniform.** Current active counts are:

- 26/26 have a boss script and `targeting.prefersPlayers`.
- 22/26 have a charged attack; 17/26 have at least one `empower-charged` phase action.
- 18/26 have `chargeOnAggro`.
- 6/26 have a direct DoT-on-hit package, 3/26 have plating shred, 3/26 have marks, 3/26 have an enemy shield, 2/26 have evasion, and 2/26 have a charge-lock engage sequence.
- Conventional `spawn-adds` is used by exactly 2 bosses, both Plains bosses.
- `raise-dead` is used by exactly 1 active non-Plains boss, Charnel-Crown.
- The Trench Serpent is the only active boss retaining generic basic-attack splash (`aoeAttack`).

The common pattern is still **melee basic attacks -> a cast-time circle or special -> an HP-threshold modifier**. This is a sound foundation for an idle-combat game, but a modifier that only changes damage, cooldown, range, or defense is not automatically a new encounter decision.

**FACT - Tiers do become more structurally complex, but the curve is not consistent.** T1 is mostly one clean exam. T3 and T4 often introduce a second system or a state change. T2 is mixed: Plains and Swamp are coherent; Jungle is thin; Forest is repetitive; Mountain and Cave are mechanically valid but defensive/generic. Biomes also enter and leave the game at different tiers, so “T4” does not mean every lineage has had the same number of lessons.

**FACT - Several notes are stale or internally contradictory.** The most important conflicts are the old “T1 has no phase” language, the current-state text that still describes removed T2 Mountain/Cave/Jungle adds and a removed Wasteland opener entourage, and the 2026-09-02 readability handoff that still describes those adds. These are documented in section 8.

## 2. Encounter contract and shared runtime behavior

### Common dungeon structure

**FACT:** Every active boss row below is a guarded-altar dungeon encounter. `buildDungeonDef` assigns the boss with `spawnAt: "altar"`; activating the altar engages surviving guardians and starts the 7-second boss awakening. The boss is then spawned at the altar and force-aggros the nearest player. On boss death, remaining guardians and boss-owned encounter bodies are cleaned up. A player wipe resets the dungeon.

Relevant source: [dungeonDatabase.ts](../shared/src/dungeons/dungeonDatabase.ts), [dungeon.ts](../server/src/systems/world/dungeons/dungeon.ts), and [dungeonTypes.ts](../shared/src/dungeons/dungeonTypes.ts).

### Common combat rules that affect design readings

**FACT:**

- All 26 active bosses prefer players while a player is inside pull range. Minions can still become the target when no player is available, but sending a minion first does not permanently body-block a boss.
- A normal `chargedAttack` arms on its own timer but starts at the next ordinary attack opportunity. It has a visible cast bar. An AoE charge plants its circle at the target's cast-start position, so walking out is the primary counterplay; the impact does not chase the player. Stun, freeze, target loss, range loss for non-committed charges, or monster knockback can abort a wind-up.
- A generic scripted `cast` roots the boss and suppresses its attacks during the cast, then applies its nested actions. These scripted casts are visible, but the boss-script tick itself does not cancel a live scripted cast when the boss is stunned or frozen. This is different from charged attacks and generic monster abilities, which do cancel on stun/freeze.
- `empower-charged` and `empower-shred` mutate server-only runtime overrides. They do not create a normal named player-facing status by themselves.
- Permanent or timed `stat-buff` actions create boss effects, while permanent `morph` changes are applied immediately and are not retained as a timed active effect. This matters for phase readability.
- Pools are node-scoped ground zones. T1/T2 Swamp pools last 600,000 ms and are effectively fight-long; T3 Spore Pool lasts 9,000 ms and detonates on expiry; Volcanic pools have authored finite durations. Pools are removed with their owner or when the node freezes.
- Bosses and normal dungeon guardians use separate spawning paths. Boss-created adds, when present, inherit the boss target and are removed when the boss dies; the current `spawn-adds` implementation still uses normal monster leash behavior rather than a boss-specific leash.

## 3. Current boss roster

Profile notation: `HP / attack / plating / DR / attack range / basic cooldown`. “Melee” is the authored base behavior; Desert T3-T4 morphs to ranged/kiting during phases.

| Tier | Dungeon node | Biome | Boss | Base profile | Signature mechanics | Design read |
|---|---|---|---|---|---|---|
| T1 | `node-t1-plains-dungeon` | Plains | Tusked Razorback | 1,700 / 34 / 4 / 2% / 15 / 2.0s | Tracked slime/boar rallies; roar | Strong identity |
| T1 | `node-t1-forest-dungeon` | Forest | Gnarled Greatbear | 1,800 / 24 / 0 / 0% / 15 / 1.9s | Two-hit basics; repeating permanent Frenzy stacks | Adequate; minor polish |
| T1 | `node-t1-mountain-dungeon` | Mountain | Crag Behemoth | 2,100 / 56 / 0 / 0% / 18 / 3.5s | Charge opener; 1.9x Ground Slam, radius 155 | Strong identity |
| T1 | `node-t1-swamp-dungeon` | Swamp | Grave Toadeater | 2,100 / 13 / 2 / 2% / 15 / 2.6s | Poison stacks; fight-long Bile Pools | Strong identity |
| T1 | `node-t1-cave-dungeon` | Cave | Obsidian Broodmother | 1,750 / 47 / 6 / 10% / 18 / 2.8s | Plating shred; 1.8x Obsidian Slam | Strong/adequate |
| T2 | `node-t2-plains-dungeon` | Plains | Gorging Razortusk | 4,000 / 96 / 8 / 5% / 15 / 2.2s | Repeated rally waves, boars/slimes, roars | Strong identity |
| T2 | `node-t2-forest-dungeon` | Forest | Apex Timberclaw | 3,750 / 64 / 0 / 0% / 18 / 1.5s | Two-hit basics; Stunning Swipe; Frenzy; 50% enrage | Improve: repetitive |
| T2 | `node-t2-mountain-dungeon` | Mountain | Stoneplate Juggernaut | 5,000 / 128 / 10 / 5% / 72 / 4.2s | 2.0x Earthshatter; plating lock; repeating DR shield | Improve |
| T2 | `node-t2-swamp-dungeon` | Swamp | Mire-Gorged Behemoth | 3,375 / 38 / 6 / 8% / 15 / 2.8s | Venom; fight-long Corrosive Pools with vulnerability | Adequate/strong |
| T2 | `node-t2-cave-dungeon` | Cave | Chitinous Dreadbore | 4,375 / 139 / 12 / 12% / 72 / 3.6s | Plating shred; Chitin Slam; Carapace Seal | Improve |
| T2 | `node-t2-desert-dungeon` | Desert | Dune-Stalker Emperor | 3,750 / 85 / 12 / 8% / 40 / 2.6s | Opener; slow; mark/cash-out; Sandburst | Improve: opaque |
| T2 | `node-t2-jungle-dungeon` | Jungle | Jungle Dread-Gorger | 3,625 / 85 / 0 / 3% / 18 / 2.4s | Opening strike; 50% Canopy Hunt haste/speed | Weak |
| T3 | `node-t3-mountain-dungeon` | Mountain | Crag-Gorged Horn-Behemoth | 12,418 / 204 / 12 / 5% / 72 / 4.2s | Charge-lock opener; 2.0x Cragbreaker Slam | Strong/adequate |
| T3 | `node-t3-cave-dungeon` | Cave | Deep-Core Burrow-Gorger | 12,895 / 196 / 16 / 15% / 72 / 4.5s | Corrosion thresholds; Deep Burrow shell | Strong identity |
| T3 | `node-t3-swamp-dungeon` | Swamp | Rot-Spore Croc-Behemoth | 11,940 / 52 / 8 / 10% / 18 / 3.4s | DoT; Spore Pool vulnerability/detonation; Rot Bloom | Strong, readability work |
| T3 | `node-t3-desert-dungeon` | Desert | Dune-Carapace Monarch | 11,940 / 196 / 10 / 8% / 20 / 3.0s | Mark/slow; permanent melee-to-ranged morph | Strong concept, improve tell |
| T3 | `node-t3-jungle-dungeon` | Jungle | Apex Bramble-Slasher | 11,701 / 104 / 0 / 3% / 18 / 1.5s | Evasion; Bramble Pounce; temporary evasion surge | Adequate/strong |
| T3 | `node-t3-volcanic-dungeon` | Volcanic | Cinder-Shell Magma-Salamander | 11,462 / 179 / 8 / 4% / 18 / 3.0s | Repeating Shell Up; magma pools; Eruption | Strong identity |
| T3 | `node-t3-tundra-dungeon` | Tundra | Frost-Plated Rime-Mammoth | 12,895 / 204 / 12 / 12% / 20 / 4.2s | Chill debuff; Ice Armor/Shatter; Permafrost Slam | Strong identity |
| T4 | `node-t4-mountain-dungeon` | Mountain | Iron-Crest Titan | 19,499 / 228 / 14 / 6% / 20 / 4.2s | Charge-lock; Earthshatter; delayed fault lines; 4th-hit finisher | Strongest |
| T4 | `node-t4-desert-dungeon` | Desert | Dune-Throne Sovereign | 17,893 / 185 / 8 / 8% / 20 / 2.8s | Three acts: melee setup, ranged punishment, melee execution | Strong concept |
| T4 | `node-t4-jungle-dungeon` | Jungle | Verdant-Crown Predator | 18,352 / 117 / 0 / 4% / 20 / 1.4s | Hunt evasion/venom -> exposed Frenzy | Strong identity |
| T4 | `node-t4-tundra-dungeon` | Tundra | Glacial Patriarch | 22,940 / 189 / 22 / 14% / 20 / 4.5s | Chill; ambient-fed Collapse; stronger Ice Armor/Shatter | Strong, dense |
| T4 | `node-t4-volcanic-dungeon` | Volcanic | Caldera Sovereign | 20,646 / 130 / 10 / 5% / 20 / 2.6s | Heat race; stoke-ramp; Burn; Caldera Vent | Strong concept, tune/readability |
| T4 | `node-t4-graveyard-dungeon` | Wasteland | Charnel-Crown Sovereign | 19,499 / 115 / 14 / 8% / 20 / 2.3s | Corpse resurrection; Mass Resurrection; Deathless Tide | Redesign decision needed |
| T4 | `node-t4-trench-dungeon` | Trench | Elder Trench Serpent | 21,793 / 143 / 20 / 22% / 22 / 3.2s | Splash basics; three generic abilities; Devour/heal | Strong but busy |

## 4. Individual boss dossiers

The data source named in each dossier is the relevant boss file. The shared runtime links in section 2 apply to all dossiers.

### Tier 1 reference set

#### T1 Plains - Tusked Razorback (`tusked-razorback`) - strong

**FACT - Identity/location:** Plains swarm commander at `node-t1-plains-dungeon`, sourced from [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts#L59). It is a melee impact boss with a relatively weak personal hit because the herd is intended to supply much of the encounter pressure.

**FACT - Mechanics and flow:** After the altar encounter starts, a `Rallying Cry` repeats every 10 seconds after a 4-second initial delay. The 2-second blocking cast spawns two `plains-slime` adds, capped at five tracked adds for that action. At 50% HP, another 2-second Rallying Cry spawns four slimes and one `boar`, capped at six, then applies a 20% attack-speed roar to nearby living monsters for 8 seconds within 320 px. Adds inherit the boss target and are removed when the boss dies. The sequence is **basic melee -> slime trickle -> 50% rally -> continuing swarm**.

Walking away from a planted add location does not prevent the adds from existing; killing or ignoring them is the decision. The roar makes leaving the adds alive increasingly costly. The boss does not have a charged slam or a personal burst attack. This is a clean example of Plains owning concurrency rather than self-enrage.

#### T1 Forest - Gnarled Greatbear (`gnarled-greatbear`) - adequate; keep with minor polish

**FACT - Identity/location:** Forest cadence duel at `node-t1-forest-dungeon`, sourced from [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts#L97). It is melee, fast, and has no armor or spike attack.

**FACT - Mechanics and flow:** Every ordinary attack beat delivers two full-pipeline hits. Beginning 5 seconds into combat and then every 6 seconds, the boss performs a visible 1.5-second `Bestial Frenzy` cast. Completion permanently adds 20% attack speed and 10% movement speed; there is no `maxStacks`, so the buff stacks without an authored cap. The fight is **two-hit cadence -> recurring permanent Frenzy -> increasingly short attack interval**.

The intended behavior is to pressure recovery and reward killing the boss before the ramp becomes severe. There is no positional choice beyond ordinary melee spacing, no DoT, no AoE, and no charged attack. The identity is coherent enough for T1, but the uncapped permanent stack is a clear design/tuning decision rather than a finished progression rule. The scripted cast is readable but is not the same interruptible cast contract as a charged attack.

#### T1 Mountain - Crag Behemoth (`crag-behemoth`) - strong

**FACT - Identity/location:** Mountain catastrophic-impact exam at `node-t1-mountain-dungeon`, sourced from [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts#L151). It has a 3x aggro charge, 18 px melee reach, and a slow 3.5-second ordinary cadence.

**FACT - Mechanics and flow:** The signature `Ground Slam` arms after 4.5 seconds and recurs every 10 seconds. It has a 2.4-second cast, 1.9x hit multiplier, and a 155 px committed AoE circle planted at the target's cast-start position. At 50% HP, the slam becomes 15% stronger and its cooldown is multiplied by 0.80. The encounter is **ordinary hits -> long readable circle -> walk out or interrupt -> harder/faster circles after 50%**.

Walking out of the planted circle is the primary counterplay; stun/freeze/knockback can interrupt the cast. It tests burst mitigation and movement without needing a second unrelated mechanic.

#### T1 Swamp - Grave Toadeater (`grave-toadeater`) - strong

**FACT - Identity/location:** Swamp rot/attrition exam at `node-t1-swamp-dungeon`, sourced from [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts#L183). Direct attacks are intentionally light: 13 attack, 2 plating, 2% DR.

**FACT - Mechanics and flow:** Each landed hit applies one stack of Toad Poison, 3 damage per stack per second, up to four stacks, with a 7-second duration refreshed by hits. `Bile Pool` begins after 4 seconds and repeats every 8.5 seconds: a 1.2-second cast plants a 105 px pool that lasts 600 seconds, deals 3 per second, and slows movement to 65%. At 50%, the pool cooldown is multiplied by 0.60 and its radius by 1.15. The fight is **poison ramp -> committed pool -> shrinking safe space -> faster/wider rot after 50%**.

The player is encouraged to cleanse/resist the poison and leave pool space early. The boss never suddenly becomes a direct burst attacker, so the biome read remains consistent.

#### T1 Cave - Obsidian Broodmother (`obsidian-broodmother`) - strong/adequate

**FACT - Identity/location:** Cave endurance and defensive erosion at `node-t1-cave-dungeon`, sourced from [bossesT1.ts](../shared/src/data/monsters/bossesT1.ts#L220). It opens with a 2.5x aggro charge and carries 6 plating plus 10% DR.

**FACT - Mechanics and flow:** Each landed attack applies one permanent plating-shred stack, up to six, reducing the player's plating by one per stack. `Obsidian Slam` is a 1.7-second cast every 9.5 seconds after a 4.5-second initial delay, with a 1.8x multiplier and 125 px AoE. At 50%, `empower-shred` raises the stack ceiling by three. The flow is **basic corrosion -> periodic slam -> at 50%, deeper corrosion**.

This is a useful build/mitigation check: the player can prioritize burst, cleanse/defensive responses, or accept worsening direct damage. The phase is partly numeric, but it deepens the one Cave idea rather than changing identity.

### Tier 2

#### T2 Plains - Gorging Razortusk (`gorging-razortusk`) - strong

**FACT - Identity/location:** Plains swarm commander at `node-t2-plains-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L34). Its personal melee cadence is not the whole fight; its script supplies the population pressure.

**FACT - Mechanics and flow:** A 2-second Rallying Cry repeats every 10 seconds after 6 seconds, spawning two slimes and roaring nearby monsters for 25% attack speed over 6 seconds within 300 px. At 50%, it spawns five slimes and one boar, then roars for 8 seconds within 320 px. At 25%, it spawns two boars and four slimes, then roars for 6 seconds within 300 px. Unlike T1's capped actions, these T2 `spawn-adds` entries do not specify `maxAlive`, so the swarm can accumulate over a long fight.

The flow is **melee -> recurring slime reinforcement -> 50% mixed wave -> 25% heavier mixed wave**. The intended decision is target priority and concurrency management. It is one of the clearest current examples of the Plains-only rule, though the lack of an explicit T2 population cap should be confirmed as intentional.

#### T2 Forest - Apex Timberclaw (`apex-timberclaw`) - improve

**FACT - Identity/location:** Forest cadence duel at `node-t2-forest-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L76). It is melee with 60 speed, a 1.5-second basic cooldown, and two full-pipeline hits per ordinary beat.

**FACT - Mechanics and flow:** `Bestial Frenzy` is a 1.5-second cast every 5 seconds after an initial 5 seconds and permanently adds 20% attack speed plus 10% movement speed, again with no cap. `Stunning Swipe` is a 700 ms charged cast on an 8-second cooldown after 3.5 seconds, with a 1.25x multiplier, 90 px AoE, and 900 ms stun. At 50%, a numeric enrage multiplies attack by 1.15 and cooldown by 0.70. The flow is **T1's two-hit Frenzy duel -> compact stun circle -> faster Frenzy -> numeric frequency surge**.

The swipe provides real movement/interrupt counterplay. The problem is differentiation: changing the Greatbear's sprite to the Timberclaw's still leaves most of the fight intact, with additional haste layered on top. Its main redesign need is not more numbers; it is a more specific forest choice.

#### T2 Mountain - Stoneplate Juggernaut (`stoneplate-juggernaut`) - improve

**FACT - Identity/location:** Mountain impact boss at `node-t2-mountain-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L114). The definition says `behavior: 'melee'` but gives it a 72 px attack range, which is unusually long for a melee boss and should be treated as a deliberate-or-accidental data question.

**FACT - Mechanics and flow:** `Stunning Earthshatter` is a 2.3-second cast every 10 seconds after 4.5 seconds, with a 2.0x multiplier, 180 px AoE, and a 450 ms precast stun. At 50%, it becomes 15% stronger, 20% faster, and 15% wider, then performs a 1.4-second `Stoneplate Lock` cast that applies a 1.5x plating buff for 5 seconds. Separately, a plain script `shield` starts after 9 seconds and repeats every 14 seconds, adding 25 percentage points of DR for 4 seconds with a shield cue but no cast wind-up.

The flow is **long-reach melee -> Earthshatter -> periodic instant DR window -> 50% plating lock plus stronger/wider slam**. The intended purpose is a guarded mountain position and a burst/spacing exam. In current code the removed Peak Archer adds are not present. The remaining question is whether the defensive layers create a player decision or merely extend the stat check.

#### T2 Swamp - Mire-Gorged Behemoth (`mire-gorged-behemoth`) - adequate/strong

**FACT - Identity/location:** Swamp attrition boss at `node-t2-swamp-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L150). It is a slower melee attacker with 6 plating and 8% DR.

**FACT - Mechanics and flow:** Each landed hit applies Gorged Venom, 9 damage per stack per second, up to four stacks for 8 seconds. `Corrosive Pool` is a 1.1x charged attack with a 1.1-second cast, 8.5-second cooldown, 115 px AoE, and a 600-second pool that deals 5 per second, slows to 60%, and applies 12% damage taken vulnerability for 1.5 seconds while inside. At 50%, ordinary attack cooldown is multiplied by 0.70 and the pool becomes 30% faster and 15% wider.

The flow is **venom stacking -> persistent pool placement -> vulnerability while standing in rot -> faster poison and pools at 50%**. It is a good T1-to-T2 escalation, although the persistent-pool pattern is shared with T1 and can become repetitive across the Swamp line.

#### T2 Cave - Chitinous Dreadbore (`chitinous-dreadbore`) - improve

**FACT - Identity/location:** Cave defensive erosion boss at `node-t2-cave-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L184). It retains a 2.0x aggro charge and the unusual 72 px melee range, with 12 plating and 12% DR.

**FACT - Mechanics and flow:** Attacks apply two plating-shred points per stack up to six. `Chitin Slam` is a 1.6-second cast every 9 seconds after 4 seconds, with a 1.6x multiplier and 140 px AoE. At 50%, the live corrosion becomes one plating point deeper per stack, and a 1.4-second `Carapace Seal` cast applies a 15 percentage-point DR shield for 5.5 seconds. The flow is **corrosion and slam -> deeper corrosion plus a defensive cast**.

The seal is readable and preserves the Cave shell theme, but the player decision is mostly “burst before or wait through the seal.” It needs a stronger relationship between erosion and the defensive window if this tier is meant to be more than T1 with a larger shell.

#### T2 Desert - Dune-Stalker Emperor (`dune-stalker-emperor`) - improve

**FACT - Identity/location:** Desert setup/control boss at `node-t2-desert-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L229). It is authored as melee but has 40 px attack range, 12 plating, 8% DR, and a 2.5x opening strike on the first landed attack of each aggro session.

**FACT - Mechanics and flow:** Each landed hit slows the player to 60% speed for 2 seconds and paints a cleansable Sun Mark for 4 seconds. The next landed hit on a marked player consumes the mark and is multiplied by 2.0; self-marking alternates paint/cash rather than amplifying every hit forever. `Scouring Sandburst` is a 1.3-second charged AoE cast every 9 seconds after 4.5 seconds, with a 1.5x multiplier and 150 px radius; if it cashes a mark, the charged multiplier and marked-strike multiplier stack. At 50%, the boss gains permanent 1.3x speed and the Sandburst becomes 15% stronger and 25% faster.

The flow is **opener -> slow/mark -> cash-out -> Sandburst punctuation -> faster setup after 50%**. Its intended purpose is to create cleanse, mitigation, and timing decisions. The concept is good, but the mark state, charged interaction, and phase change need stronger persistent feedback before the player can reliably understand the choice.

#### T2 Jungle - Jungle Dread-Gorger (`jungle-dread-gorger`) - weak

**FACT - Identity/location:** Jungle ambush boss at `node-t2-jungle-dungeon`, sourced from [bossesT2.ts](../shared/src/data/monsters/bossesT2.ts#L266). It is a 56-speed melee attacker with a 2.4-second cadence, 3% DR, and a 2.5x first landed attack.

**FACT - Mechanics and flow:** There is no charged attack, evasion, DoT, AoE, terrain action, or add action. At 50%, a 1.4-second `Canopy Hunt` scripted cast applies 1.25x movement speed and 1.25x attack speed for 7 seconds. The flow is **opening strike -> ordinary melee -> one blocking haste/speed cast at 50% -> ordinary melee**.

The intended purpose is an ambush followed by pursuit, but the current implementation expresses pursuit only as two temporary stat multipliers. It does not use the Jungle's most distinctive existing space: dense thickets in the open world, high-density ambush ecology, or target/route pressure. This is the clearest placeholder-like T2 boss.

### Tier 3

#### T3 Mountain - Crag-Gorged Horn-Behemoth (`crag-gorged-horn-behemoth`) - strong/adequate

**FACT - Identity/location:** Mountain impact lineage at `node-t3-mountain-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L45). It has a 3.0x charge-lock engage sequence, 72 px melee reach, and a slow 4.2-second basic cadence.

**FACT - Mechanics and flow:** The engage sequence accelerates toward the player, locks the player to movement for 500 ms on contact, and hands off to the committed `Cragbreaker Slam`. The Slam is a 2.4-second cast, 2.0x multiplier, 205 px radius, 9-second cooldown, and 4.5-second initial delay. At 50%, it is 20% stronger and 15% wider; at 25%, it comes 30% sooner and the boss gains 1.25x speed. The flow is **charge -> movement lock -> planted Slam -> wider Slam -> faster Slam and faster boss**.

This is a good structural escalation from T1. The phase numbers are not themselves interesting, but the engage sequence changes when the first major decision occurs and gives the lineage a real T3 step.

#### T3 Cave - Deep-Core Burrow-Gorger (`deep-core-burrow-gorger`) - strong

**FACT - Identity/location:** Cave corrosion capstone at `node-t3-cave-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L83). It is slow, heavily plated, and keeps the 72 px melee reach.

**FACT - Mechanics and flow:** Each landed attack applies two plating-shred points up to eight stacks. At 3 and 6 corrosion stacks, it applies Corrosive Venom at 16 damage per stack per second, up to two stacks for 6 seconds. `Deep-Core Slam` is a 1.5-second cast every 8.5 seconds after 4 seconds with a 1.7x multiplier and 155 px AoE. At 50%, the corrosion ceiling rises by four and thresholds at 9 and 12 are added. At 25%, each stack strips one more plating point and a 1.6-second `Deep Burrow` cast applies 18 percentage points of DR for 6 seconds.

The flow is **corrosion ladder -> threshold poison payoffs -> expanded ladder -> deeper bite plus shell**. The player's decision is whether to race, cleanse/mitigate the threshold poison, or plan burst around the defensive cast. This is one of the strongest examples of a phase deepening an existing mechanic.

#### T3 Swamp - Rot-Spore Croc-Behemoth (`rot-spore-croc-behemoth`) - strong; improve readability

**FACT - Identity/location:** Swamp attrition capstone at `node-t3-swamp-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L143). It has a modest 52 attack because the DoT and floor hazards carry the pressure.

**FACT - Mechanics and flow:** Basic hits apply Rot Spores at 13 damage per stack per second, up to six for 9 seconds. `Spore Pool` is a 1-second cast every 8 seconds after 3.5 seconds, with a 1.2x impact and 130 px radius. Its 9-second pool deals 8 per second, slows to 55%, applies 16% damage vulnerability for 1.8 seconds while inside, and detonates at expiry at 2.25x. At 50%, attack cadence and pool cadence accelerate and the pool widens by 15%. At 25%, the DoT morphs to 17 damage and eight stacks, and an immediate radius-260 pool lasting 600 seconds is placed at the boss.

The flow is **DoT -> short-lived pool -> leave or accept vulnerability -> expiry detonation -> late persistent Rot Bloom**. It has excellent Swamp identity and multiple decisions. The late pool is currently applied immediately on the threshold with no dedicated phase cast, so the mechanic is structurally strong but has a high readability risk.

#### T3 Desert - Dune-Carapace Monarch (`dune-carapace-monarch`) - strong concept; improve tell

**FACT - Identity/location:** Desert setup-to-punishment boss at `node-t3-desert-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L200). It carries 10 plating, 8% DR, a 2.5x aggro charge, and 42 base speed.

**FACT - Mechanics and flow:** It slows on landed hits, paints a 4.5-second Sun Mark, and cashes a marked hit at 1.9x. `Sandburst` is a 1.3-second charged AoE every 9 seconds after 4.5 seconds, with a 1.6x multiplier and 155 px radius. At 50%, a permanent morph changes it to ranged sandblast with 240 px attack range and kiting, while the charged attack becomes 20% stronger and 20% faster. At 25%, the charged cooldown is multiplied by 0.65 again. The flow is **melee controller setup -> permanent ranged punishment -> accelerated cash-out**.

The mark survives the morph, which creates a good throughline. The current morph is applied immediately and the empowered Sandburst has no dedicated phase callout, so the player may experience a new fight without understanding why.

#### T3 Jungle - Apex Bramble-Slasher (`apex-bramble-slasher`) - adequate/strong

**FACT - Identity/location:** Jungle predator at `node-t3-jungle-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L245). It is fast, has 15% deterministic evasion, and opens with a 2.5x first strike.

**FACT - Mechanics and flow:** `Bramble Pounce` is a 900 ms cast every 11 seconds after 6 seconds, with a 2.2x multiplier, 110 px AoE, and 140 px knockback. At 50%, evasion doubles for 5 seconds and the Pounce becomes 20% stronger and 45% faster. The flow is **ambush -> difficult-to-pin melee -> visible pounce -> brief evasion surge -> harder/faster pounce**.

The boss encourages hit reliability, burst timing, and recovery from knockback. It is a real T2-to-T3 Jungle step, although the evasion window is still mostly a combat-stat event rather than a positional hide/reposition event.

#### T3 Volcanic - Cinder-Shell Magma-Salamander (`cinder-shell-magma-salamander`) - strong

**FACT - Identity/location:** Volcanic shell-cycle boss at `node-t3-volcanic-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L291). It is a fire melee boss with 8 plating and 4% DR.

**FACT - Mechanics and flow:** The first Shell Up triggers at 85% HP and then repeats every 16 seconds while engaged. Shell Up lasts 3.8 seconds, stops movement and attacks, and reduces direct player damage to 30%; DoTs continue through the shell. Closing the shell creates a radius-190 magma pool lasting 8 seconds, dealing 12 per second and slowing to 70%. `Eruption` is a 1.4-second cast every 7 seconds after 3.5 seconds, with a 1.6x multiplier and 175 px radius. At 50%, Eruption is 20% stronger and 15% wider; at 25%, Eruption comes 40% sooner and a 1.3-second `Vent Rupture` cast creates a radius-240 pool for 16 seconds at 16 damage per second.

The flow is **ordinary fire -> recurring shell pause -> magma space denial -> Eruption -> late Vent Rupture**. The shell's direct/DoT asymmetry creates a meaningful build choice. The 25% Vent is casted and readable; the 50% changes are still mostly invisible numeric upgrades.

#### T3 Tundra - Frost-Plated Rime-Mammoth (`frost-plated-rime-mammoth`) - strong

**FACT - Identity/location:** Tundra Chill and Ice Armor boss at `node-t3-tundra-dungeon`, sourced from [bossesT3.ts](../shared/src/data/monsters/bossesT3.ts#L342). The node itself carries a global Tundra Chill ramp; the boss also has a hit-built frost ramp.

**FACT - Mechanics and flow:** Each landed hit adds movement slow up to 40% and attack slow up to 30%, with stacks decaying after 4 seconds without a hit. An enemy shield of 18% max HP appears every 12 seconds for 6 seconds. Breaking it causes 8% max-HP self-damage and 20% increased damage taken for 4 seconds. `Permafrost Slam` is a 1.9-second cast every 8.5 seconds after 4.5 seconds, with a 1.7x multiplier and 195 px radius. At 50%, the Slam is 20% stronger and 10% wider; at 25%, the shield becomes 24% with a 9-second interval, 6.5-second duration, 10% self-damage shatter, and 25% vulnerability for 4.5 seconds.

The flow is **chill suppression -> timed Ice Armor -> break the armor for a damage window -> Slam -> rarer but richer armor windows late**. Burst is rewarded, DoT bypasses the enemy shield, and the player has an explicit reason to interact with the barrier rather than simply wait.

### Tier 4

#### T4 Mountain - Iron-Crest Titan (`iron-crest-titan`) - strong

**FACT - Identity/location:** Mountain apex at `node-t4-mountain-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L67). It uses the T3 charge-lock opener and has a 4.2-second ordinary cadence.

**FACT - Mechanics and flow:** `Titan Earthshatter` is a 2.6-second cast every 9 seconds after 4.5 seconds, with a 2.2x multiplier and 240 px radius. 900 ms after impact, six radial fault-line rays resolve from the planted point; rays extend to 330 px, have a 24 px line radius, and deal 1.35x damage. Every fourth ordinary attack beat is a deterministic 2.0x cadence finisher. At 50%, the main attack is 15% stronger, the aftershock gains three rays and 15% damage; at 25%, the charged cooldown is 30% shorter, radius 10% wider, and the boss gains 1.35x speed.

The flow is **charge-lock -> Earthshatter circle -> delayed fault-line reading -> ordinary beats with a fourth-hit spike -> more rays -> faster/wider sequence**. The player must leave both the first circle and the later lines. This is a strong apex because the added layer changes movement timing rather than merely adding defense.

#### T4 Desert - Dune-Throne Sovereign (`dune-throne-sovereign`) - strong concept

**FACT - Identity/location:** Desert three-act boss at `node-t4-desert-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L118). It begins as a melee controller with 20 px range, a 0.45 slow for 3 seconds, and a 5-second Sun Mark.

**FACT - Mechanics and flow:** Marked hits are multiplied by 2.0. `Sandstorm Rupture` is a 1.5-second charged AoE every 9 seconds after 4.5 seconds, with a 1.8x multiplier and 180 px radius. At 50%, the boss permanently morphs to ranged 250 px kiting, and the Rupture becomes 25% stronger, 25% faster, and 10% wider. At 25%, it morphs back to melee, gains 1.35x speed, and accelerates the charged cooldown again. The flow is **Act I melee setup -> Act II ranged cash-out -> Act III melee execution**.

The mark carrying through both morphs is the encounter's strongest relationship. The two morphs are currently threshold mutations rather than casted transitions, so the concept needs clear phase communication and careful target/range reacquisition during any redesign.

#### T4 Jungle - Verdant-Crown Predator (`verdant-crown-predator`) - strong

**FACT - Identity/location:** Jungle apex at `node-t4-jungle-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L167). It is very fast, has 25% deterministic evasion, opens at 2.6x, and applies Crown Venom at 8 damage per stack up to five for 3.5 seconds.

**FACT - Mechanics and flow:** `Killing Leap` is an 850 ms cast every 12 seconds after 7 seconds, with a 2.3x multiplier, 120 px AoE, and 150 px knockback. At 50%, evasion becomes zero permanently, attack becomes 1.4x, speed 1.25x, and Leap cooldown becomes 45% of its previous value. At 25%, ordinary attack cadence accelerates by another 25%. The flow is **hard-to-hit Hunt -> exposed but much more lethal Frenzy -> Frenzy peak**.

This creates a clear trade: the boss becomes easier to damage at exactly the point where its attacks become more dangerous. It is one of the better examples of a state change creating a new player priority without adding enemy bodies.

#### T4 Tundra - Glacial Patriarch (`glacial-patriarch`) - strong, but dense

**FACT - Identity/location:** Tundra apex at `node-t4-tundra-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L220). It has 22 plating and 14% DR, hit-built slow caps, and a node-wide Chill ramp that also slows player attack cadence.

**FACT - Mechanics and flow:** Player hits build movement slow up to 40% and attack slow up to 30%. `Glacial Collapse` is a 2.2-second cast every 9.5 seconds after 5 seconds, with a 1.9x multiplier and 250 px radius. Its damage scales only on charged hits with the target's ambient ramp, up to an additional 42% at seven 7% stacks. The enemy shield is 20% every 13 seconds for 6.5 seconds; breaking it deals 8% max-HP self-damage and gives 22% vulnerability for 4.5 seconds. At 50%, the barrier becomes 28% every 10 seconds for 7 seconds with an 11% shatter and 30% vulnerability for 5.5 seconds. At 25%, Collapse becomes 20% stronger, 25% faster, and 10% wider.

The flow is **room Chill plus hit Chill -> Ice Armor -> shatter window -> Collapse fed by the Chill carried by the player**. It is mechanically rich and thematically specific. The risk is suppression density: ambient Chill, boss ramp slow, armor timing, and charged-only scaling all need a clear hierarchy in the player-facing read.

#### T4 Volcanic - Caldera Sovereign (`caldera-sovereign`) - strong concept; tune/readability

**FACT - Identity/location:** Volcanic Heat-race apex at `node-t4-volcanic-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L287). The node-wide Heat ramp gives players more damage dealt and more damage taken; the boss feeds on the same ramp on every direct hit.

**FACT - Mechanics and flow:** The boss applies Caldera Burn at 10 damage per stack, up to five for 3 seconds. `Caldera Eruption` is a 1.3-second cast every 7 seconds after 3.5 seconds, with a 1.8x multiplier and 200 px radius. At 50%, `stoke-ramp` makes Heat accumulate 35% faster and floors it at two stacks; the charged attack is 15% stronger and 15% faster. At 25%, Heat is accelerated again, floors at four stacks, and its ceiling increases by three; Eruption becomes 30% faster and 15% wider; a 1.5-second `Caldera Vent` cast creates a radius-260 pool for 20 seconds at 20 damage per second and 70% movement speed.

The flow is **Heat race -> Burn/Eruption -> boss damage grows with player Heat -> floor/cap escalation -> Vent hazard**. It encourages decisive damage and makes stalling self-defeating. The node-wide changes are not inherently positional and are not all represented by a dedicated phase state, so the fight can feel like an unexplained difficulty jump unless the Heat and stoke feedback is explicit.

#### T4 Wasteland - Charnel-Crown Sovereign (`charnel-crown-sovereign`) - redesign decision needed

**FACT - Identity/location:** Wasteland/graveyard necromancer at `node-t4-graveyard-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L345). It has a light Crown Decay package (5 damage per stack, up to four for 4 seconds) because the intended pressure is the corpse tide.

**FACT - Mechanics and flow:** `raisesDead` checks the node corpse registry. It raises recent non-boss monsters killed by players, one at a time every 8 seconds after a 5-second initial delay, within 520 px, with up to four living risen bodies at 75% HP and 80% damage. Raising has a 1.3-second cast and is canceled by stun/freeze. At 50%, `Mass Resurrection` is a blocking 1.8-second cast that attempts to raise three corpses and adds two to the alive ceiling. At 25%, `Deathless Tide` is a blocking 2-second cast that attempts to raise four, adds two more to the ceiling, and gives nearby monsters 30% attack speed for 12 seconds within 420 px.

Risen units are renamed `Risen <Name>`, award no rewards, leave no corpses, and crumble when the boss dies. The actual current data has no boss-authored `hpPct: 1.0` opener entourage; the dungeon guardians and ambient Wasteland monsters are separate. The flow is **kill surrounding bodies -> corpse registry -> resurrected pressure -> threshold bursts**.

The gameplay purpose is excellent target/kill-order pressure, but it creates extra enemy bodies outside Plains. It is therefore a rules-level redesign candidate even though the fantasy is stronger than the old generic poison/add version.

#### T4 Trench - Elder Trench Serpent (`elder-trench-serpent`) - strong but busy

**FACT - Identity/location:** Trench one-enormous-duel boss at `node-t4-trench-dungeon`, sourced from [bossesT4.ts](../shared/src/data/monsters/bossesT4.ts#L415). It is very durable with 20 plating and 22% DR, and is the only active boss with generic basic-attack splash.

**FACT - Mechanics and flow:** A basic hit splashes 50% of the boss attack to other players and enemy summons within 130 px of the primary target. A 28% max-HP enemy shield appears every 15 seconds for 6 seconds; it has no Shatter payoff. Three independent cast-time abilities run in priority order: `Abyssal Pressure` (1.0s cast, first at 3.5s, then every 7s) hits the captured player for 1.15x and applies 18% anti-heal for 4.5s; `Crushing Tide` (1.2s, first at 6.5s, then every 10s) resolves around the caster for 0.60x, 175 px, and a 65% slow for 2.5s; `Undertow Current` (1.1s, first at 7s, then every 12s) grants the boss 25% attack speed for 4.5s. `Devour` is a 2.6-second single-target charged attack every 12 seconds after 6.5 seconds, with a 2.7x multiplier and a 6% max-HP heal when it lands. At 50%, Devour becomes 20% stronger and 20% faster; at 25%, the shield definition becomes 34% every 11 seconds for 6.5 seconds and Devour is accelerated again.

The flow is **heavy basics plus ability rotation -> body-sweep zone/anti-heal/current -> long Devour tell -> heal if it lands -> stronger Devour and armor late**. Walking out of Crushing Tide or Devour, interrupting casts, and avoiding clustering are meaningful. The main risk is opacity from four separate cast systems plus a periodic shield rather than lack of identity.

## 5. Mechanic and repetition taxonomy

### Shared primitives

| Pattern | Current footprint | What it accomplishes | Audit read |
|---|---|---|---|
| Player-priority targeting | 26/26 | Prevents minion body-blocking from becoming the boss's main counter | Good systemic replacement for the old anti-summon cleave |
| `chargeOnAggro` | 18/26 | Makes slow bosses connect; creates an opening threat | Common and mostly invisible as a design identity |
| Charged signature attack | 22/26 | Periodic spike, AoE, or hazard; supplies a cast bar and movement answer | Useful shared foundation; overused when the payload is only “another circle” |
| HP-threshold script | 26/26 | Marks progression and changes pressure | Threshold presence alone is not encounter evolution |
| `empower-charged` | 17 bosses / 24 actions | Makes an existing signature harder, wider, or more frequent | Often a numeric phase; good when paired with a structural mechanic |
| Generic stat buff/enrage | 10 bosses / 13 actions | Raises cadence, speed, attack, or evasion | Highest repetition risk; does not automatically add a decision |
| Blocking scripted cast | 11 bosses / 15 actions | Gives a phase or buff a visible wind-up and costs boss pressure | Good readability primitive, but unlike charged casts it is not interrupted by stun/freeze |

### Repeated encounter shapes

1. **Basic melee -> planted circle -> stronger/faster circle.** This is the dominant shape across Mountain, Cave, Swamp, Desert, Volcanic, Tundra, and the Trench charged attack. It is strongest when the circle has a second consequence: fault lines, detonation, vulnerability, shatter, or persistent space denial.

2. **Fast melee -> permanent haste stack.** Greatbear and Timberclaw share two-hit basics and permanent Bestial Frenzy. Timberclaw adds a stun swipe and enrage, but a sprite/name swap would preserve most of the fight.

3. **Defensive window.** Stoneplate uses a repeating flat DR shield plus a timed plating buff; Chitinous and Deep-Core use casted flat DR shells; Tundra uses absorb shields with Shatter payoffs; Trench uses an absorb shield with no payoff. The Tundra version is the most distinct because cracking the barrier is a reward, not only a delay.

4. **Poison/DoT plus ground hazard.** All three Swamp bosses have a DoT and pool. The lineage differentiates itself through pool persistence, vulnerability, detonation, and Rot Bloom, but the base “stand in melee while a pool appears” loop remains repeated.

5. **Mark and cash-out.** All three Desert bosses paint and consume the same Sun Mark. The lineage has good escalation through T2 self-mark alternation, T3 ranged morph, and T4 three acts; however, a mark that is not clearly surfaced is functionally just a hidden damage multiplier.

6. **Ambush/opening spike.** Dune-Stalker, Jungle Dread, Bramble-Slasher, and Verdant Predator all use an opening strike. On its own this is an opener check, not a full encounter identity. It becomes meaningful when connected to later evasion, marks, pursuit, or a state trade.

7. **Evasion as a state.** Bramble-Slasher has 15% base evasion and a temporary 30% window; Verdant-Crown has 25% Hunt evasion and permanently drops to zero in Frenzy. The T4 version makes the evasion trade legible; the T3 version is closer to a hit-rate texture.

8. **Ambient node ramp as boss material.** Glacial Patriarch consumes Tundra Chill only on its charged hit. Caldera Sovereign consumes Volcanic Heat on all direct hits and also changes the room's ramp cadence/floor/ceiling. This is a promising progression axis because the boss and environment share a state, but it requires explicit feedback.

9. **Adds and additional bodies.** Plains owns true `spawn-adds`. Charnel-Crown owns corpse resurrection. No other active boss creates ordinary additional enemy entities.

### Closest “sprite/name swap” cases

| Pair/group | Why they overlap | What currently saves the distinction |
|---|---|---|
| Greatbear / Apex Timberclaw | Same two-hit melee cadence and uncapped Frenzy stack | Timberclaw's Stunning Swipe and 50% frequency enrage |
| Crag Behemoth / Stoneplate / Mountain T3 | Same slow melee plus committed circular slam | T3 charge-lock; T2 defensive position; T4 fault lines |
| Obsidian Broodmother / Chitinous / Deep-Core | Same plating erosion plus slam | T3 threshold poison and extended corrosion ladder; T2/T3 shells are less distinct |
| Grave Toadeater / Mire-Gorged / Rot-Spore | Same DoT plus persistent/temporary pool | Vulnerability and detonation at T3; otherwise arena shrink is repeated |
| Dune-Stalker / Dune-Carapace / Dune-Throne | Same mark/cash-out, slow, and Sandburst | T3 ranged morph and T4 three-act morph are strong structural differences |
| Jungle Dread / generic fast melee | Opening strike plus temporary haste is the entire current design | Nothing structural in current T2 data; highest redesign need |

## 6. Tier-by-tier complexity and progression

### T1: generally clear, but the source comments are not current

**FACT:** T1 ranges from 1,700-2,100 HP and uses one primary exam per boss: concurrency, cadence, burst, attrition, or armor erosion. Four of five T1 bosses currently have a 50% phase action: Razorback, Crag Behemoth, Grave Toadeater, and Obsidian Broodmother. Greatbear has no HP phase but has a repeating Frenzy ramp.

The T1 fights are comparatively legible because each phase generally deepens the same idea. T1 is a reasonable quality bar for structural clarity. Do not redesign it by default. The obvious action is to reconcile the design contract and re-measure the numbers after the old shields/cleave were removed; the current T1 comments and old benchmark assumptions do not describe the live data.

### T2: the least consistent tier

**FACT:** T2 ranges from 3,375-5,000 HP. It is intended to add one meaningful escalation, but the actual budget varies:

- Plains adds composition and rally timing.
- Swamp adds pool vulnerability and faster rot cadence.
- Desert adds the mark/cash-out package and opener.
- Forest repeats the T1 cadence package with a stun and enrage.
- Mountain adds two defensive layers around the same slam.
- Cave adds deeper shred and a defensive shell.
- Jungle adds only opening damage plus temporary speed/attack speed.

This is why T2 currently feels uneven rather than uniformly underdesigned. A good T2 boss needs one new player decision, not merely one more action in the data.

### T3: structural mechanics mostly arrive

**FACT:** T3 ranges from 11,462-12,895 HP and introduces the largest set of real structural changes: Mountain's charge-lock, Cave's threshold ladder, Swamp's detonation and late bloom, Desert's range morph, Jungle's evasion state, Volcanic's recurring shell, and Tundra's armor/shatter loop.

T3 is the point where the roster starts to fulfill the requested “mechanic changes normal combat behavior” goal. The remaining weakness is that several phase transitions are silent: DoT morph, Desert morph, and some hazard/ramp changes are applied without a dedicated phase cast or persistent state callout.

### T4: strong apexes, with a risk of system stacking

**FACT:** T4 ranges from 17,893-22,940 HP. It is not a single template: Mountain uses delayed geometry, Desert uses three acts, Jungle uses a trade between evasion and damage, Tundra/Volcanic use node-wide ramps, Wasteland uses corpses, and Trench uses a multi-ability rotation.

This is generally the right direction. The risk is no longer thinness for most T4 bosses; it is cognitive density, hidden state, and cooldown overlap. T4 should not be made harder by adding another independent keyword to every boss. The best existing T4 examples deepen one system and make the new state visible.

### Numeric progression versus design progression

**FACT:** Average boss HP rises from about 1,890 in T1 to 3,982 in T2, 12,179 in T3, and 20,089 in T4. That is a large numerical jump, but numerical growth alone does not establish a new encounter lesson.

The current roster does contain a meaningful structural progression in many lineages. It is not globally uniform because Plains and Forest retire after T2, Cave and Swamp retire after T3, and Wasteland/Trench debut at T4. A designer should judge progression by the number and quality of player decisions in each lineage, not by the number of script actions or HP thresholds.

## 7. Plains-only summon/add-rule audit

### Compliant Plains ownership

**FACT - T1 Tusked Razorback:** uses `spawn-adds` for Plains Slimes and Boars. The repeating action adds two slimes with a tracked cap of five. The 50% Rally adds four slimes and one boar with a tracked cap of six, then hastens nearby monsters. Adds inherit the boss target, use the normal AI leash, and are removed on boss death.

**FACT - T2 Gorging Razortusk:** uses `spawn-adds` for Slimes and Boars in three rally beats. It spawns five slimes plus one boar at 50%, two boars plus four slimes at 25%, and two slimes every 10 seconds. The phase/repeating actions do not specify `maxAlive`, so this may create an uncapped accumulation over long encounters. It is still the correct biome ownership under the stated rule.

### Non-Plains exception/violation

**FACT - T4 Charnel-Crown Sovereign:** uses `raise-dead`, not `spawn-adds`. It does not invent bodies from nothing; it consumes recent corpses created by player kills in the same node. The registry keeps corpses for 30 seconds, caps the node at 16, and the boss searches within 520 px. Risen bodies are diminished, give no rewards, leave no corpse, and are removed when the boss dies. The practical gameplay result is still additional enemy bodies during the boss encounter.

**AUDIT DECISION:** Under a literal rule that “boss add/summon mechanics belong to Plains,” Charnel-Crown is a violation and a redesign candidate. Under a semantic rule that “Plains owns new creature arrival while Wasteland owns corpse reuse,” it is a deliberate exception. The designer should choose one policy before redesign work starts; the current code does not make the policy explicit.

### No other active violations found

**FACT:** The other 23 active bosses have no `summon`, `spawn-adds`, or `raise-dead` action. The dungeon guardian groups are authored encounter setup, not boss-created adds. The excluded Void encounter contains additional bodies but is outside this audit by instruction.

## 8. Legacy and stale mechanics

### Active code/data findings

**FACT:** The generic runtime still supports older or dormant actions/fields including `summon`, `apply-soft-cap`, `shed-defense`, and `modify-ramp-debuff`. None is used by the 26 active dungeon bosses. They are live engine capabilities, not current active boss mechanics.

**FACT:** `enemySoftCap` remains on the excluded Void/warden data and on some non-boss monster data. It is not part of the active boss roster. Do not use it as a current boss design reference.

**FACT:** `aoeAttack` survives on the active Elder Trench Serpent only. The current comments describe this as intentional arena-scale splash rather than the retired anti-summon workaround. It is the one active exception to the “prefer players, use encounter-specific AoE” pattern.

**FACT:** `cadenceFinisher` survives on Iron-Crest Titan only among active bosses. It is intentionally tied to the Mountain T4 fault-line reading. The same field on excluded Void/warden data is legacy and out of scope.

**FACT:** `spawn-adds` still carries a TODO that boss adds use normal AI leash rather than a boss-specific leash. This is currently relevant only to the Plains boss family.

### Documentation conflicts

1. **T1 no-phase language is stale.** The header in `bossesT1.ts` says “pure shape, no phase,” and [design_docs/boss-design.md](../design_docs/boss-design.md) still describes T1 as no phase. Live T1 data has a 50% phase on Razorback, Crag Behemoth, Grave Toadeater, and Obsidian Broodmother.

2. **T2 one-phase language is incomplete.** The T2 file header says “+ one phase @50%,” but Gorging Razortusk has both 50% and 25% phases.

3. **The current-state boss document contradicts itself.** Its add-to-cast table correctly says T2 Mountain, T2 Cave, T3 Cave, and T2 Jungle had their adds replaced. Later lineage prose still describes T2 Jungle's mid-fight pack wave, and its Mountain table still describes the old archer position. Its Wasteland section still describes an opener entourage that the current Charnel data does not implement.

4. **The 2026-09-02 readability handoff is behind the current T2 branch.** It still describes Peak Archers for T2 Mountain, a Cave Troll for T2 Cave, a Cavern Troll for T3 Cave, and Jungle Snake/Ape additions for T2 Jungle. Current code has Stoneplate Lock, Carapace Seal, Deep Burrow, and Canopy Hunt instead.

5. **The ecology document under-describes current Tundra Chill.** The live `tundraChill()` payload includes both movement slow and attack slow per stack; the prose primarily describes movement slow. Code is authoritative.

6. **Some comments retain historical benchmark math.** Greatbear's comments still discuss the removed T1 50% enrage and old cadence values. The comments are useful history, but should not be read as current tuning or a current encounter contract.

### Readability risks that are current, not merely documentation

**FACT:** `empower-charged`, `empower-shred`, and `stoke-ramp` do not themselves create a named persistent boss effect. Permanent Desert morphs and the T3 Swamp DoT morph are applied immediately at thresholds. The T3 Swamp Rot Bloom is also currently an immediate `spawn-pool`, while the T3/T4 Volcanic late pools are wrapped in casts. The 2026-09-02 handoff correctly identified these as the highest remaining “the floor changed under me” cases, even though its T2 add descriptions are stale.

## 9. Bosses ranked by design health

This is a qualitative health ranking, not a balance ranking. “Health” means distinctiveness, decisions, counterplay, evolution, and thematic fit in the current implementation.

| Rank | Boss | Health | Classification | Reason |
|---:|---|---|---|---|
| 1 | Iron-Crest Titan | Strong | Keep / minor polish | Multi-step spatial signature with fault lines and a restrained finisher |
| 2 | Rot-Spore Croc-Behemoth | Strong | Keep / readability polish | DoT, pools, vulnerability, detonation, and Rot Bloom all share one idea |
| 3 | Cinder-Shell Magma-Salamander | Strong | Keep / minor polish | Shell is a real state with asymmetric counterplay and space denial |
| 4 | Frost-Plated Rime-Mammoth | Strong | Keep / minor polish | Armor break is a meaningful reward, not just a shield |
| 5 | Verdant-Crown Predator | Strong | Keep / minor polish | Hunt-to-Frenzy trade is clear and biome-specific |
| 6 | Gorging Razortusk | Strong | Keep / cap review | Plains concurrency escalates composition and timing |
| 7 | Deep-Core Burrow-Gorger | Strong | Keep / readability polish | Best Cave threshold ladder; shell supports the corrosion theme |
| 8 | Dune-Throne Sovereign | Strong | Keep / transition polish | Three-act range structure and mark persistence are high-value |
| 9 | Caldera Sovereign | Strong concept | Improve / tune and telegraph | Excellent Heat race; node-wide phase changes are easy to miss |
| 10 | Crag-Gorged Horn-Behemoth | Strong/adequate | Keep / minor polish | Charge-lock makes the Mountain slam a real progression |
| 11 | Elder Trench Serpent | Strong/adequate | Improve / simplify/readability review | Rich duel with clear Devour purpose; many simultaneous cast systems |
| 12 | Grave Toadeater | Strong/adequate | Keep | Clean T1 attrition identity and direct-vs-rot split |
| 13 | Tusked Razorback | Strong/adequate | Keep | Best simple add/rally exam; verify T1 numbers after old-mechanic removal |
| 14 | Crag Behemoth | Strong/adequate | Keep / minor polish | Clean Mountain burst/spacing foundation; later Mountain bosses add charge structure and geometry |
| 15 | Obsidian Broodmother | Adequate/strong | Improve | Good corrosion identity; phase is mostly a ceiling increase |
| 16 | Apex Bramble-Slasher | Adequate/strong | Improve | Predator state exists, but evasion is still mostly a stat event |
| 17 | Dune-Carapace Monarch | Adequate/strong | Improve | Strong morph concept; needs visible transition and mark feedback |
| 18 | Glacial Patriarch | Adequate/strong | Improve | Excellent systemic fusion, but high suppression/coupling risk |
| 19 | Mire-Gorged Behemoth | Adequate | Improve | Good Swamp escalation, but shared persistent-pool shape repeats |
| 20 | Stoneplate Juggernaut | Adequate | High-value redesign | Slam identity is good; current defense layers do not yet create a clear choice |
| 21 | Chitinous Dreadbore | Adequate | Improve | Corrosion plus shell is coherent but close to a numeric T1 extension |
| 22 | Dune-Stalker Emperor | Adequate | High-value redesign | Mark/cash-out is promising but opaque and structurally thin after the opener |
| 23 | Gnarled Greatbear | Adequate | Minor polish | Coherent T1 cadence exam, but uncapped permanent Frenzy needs an explicit intent |
| 24 | Apex Timberclaw | Weak/adequate | Redesign | Greatbear duplication plus more haste; needs a distinct T2 forest decision |
| 25 | Charnel-Crown Sovereign | Strong theme / rules risk | Redesign decision | Corpse tide is good, but it is the sole non-Plains extra-body mechanic |
| 26 | Jungle Dread-Gorger | Weak | Redesign | Opening hit plus temporary haste is not a complete Jungle encounter |

## 10. Redesign priority

### First five recommended targets

1. **Jungle Dread-Gorger (T2):** highest leverage weak boss; a redesign establishes what Jungle means before T3/T4 and fixes the T2 bridge.
2. **Apex Timberclaw (T2):** resolving the Greatbear/Timberclaw duplication improves an entire lineage rather than one isolated fight.
3. **Charnel-Crown Sovereign (T4):** forces the Plains-only add policy to become explicit while preserving or replacing an otherwise strong corpse-economy fantasy.
4. **Stoneplate Juggernaut (T2):** a better positional Mountain layer would make the T1-to-T3 Mountain arc read as intentional instead of “slam plus defense.”
5. **Dune-Stalker Emperor (T2):** turning the mark loop into a clearly surfaced player choice would give the Desert lineage a strong foundation for its later morphs.

### Classification

**Keep / minor polish:** Tusked Razorback, Gnarled Greatbear, Crag Behemoth, Grave Toadeater, Gorging Razortusk, Crag-Gorged Horn-Behemoth, Deep-Core Burrow-Gorger, Rot-Spore Croc-Behemoth, Cinder-Shell Magma-Salamander, Frost-Plated Rime-Mammoth, Iron-Crest Titan, Dune-Throne Sovereign, Verdant-Crown Predator.

**Improve:** Obsidian Broodmother, Mire-Gorged Behemoth, Chitinous Dreadbore, Dune-Carapace Monarch, Apex Bramble-Slasher, Glacial Patriarch, Caldera Sovereign, Elder Trench Serpent. These have good cores but need readability, interaction, or density tuning.

**Redesign / explicit decision:** Jungle Dread-Gorger, Apex Timberclaw, Stoneplate Juggernaut, Dune-Stalker Emperor, Charnel-Crown Sovereign. These are the highest-value structural targets, with Charnel included for the rule question even though its fantasy is strong.

## 11. Exploratory redesign directions

These are intentionally directions, not locked designs or numeric specs.

### Jungle Dread-Gorger

**PROPOSAL A - Make the hunt a route/spacing problem.** Replace the generic haste phase with a short stalking state that selects a landing lane or target approach, then commits to a telegraphed leap or crossing attack. The player chooses whether to stay near the boss for uptime, move through the lane, or disengage and make the boss spend its pursuit window.

**PROPOSAL B - Use scent as a readable setup/cash-out.** The opener marks a prey target or leaves a visible trail. The boss's next attack becomes more dangerous if the marked target stays in a predictable lane, while Cleanse, target switching, or deliberate movement breaks the setup. This gives Jungle a decision without creating adds.

**PROPOSAL C - Make the canopy state alter contact, not only speed.** During Canopy Hunt, the boss could briefly disappear from ordinary contact and reappear from a marked offset, with a cast bar and a safe response window. The design goal is “where will it land?” rather than “its two multipliers are now larger.”

### Apex Timberclaw

**PROPOSAL A - Keep the two-hit cadence, add a third-beat commitment.** Bestial Frenzy could prepare a clearly telegraphed follow-up swipe/cone or short lunge. The player reads whether to hold position for uptime or create space before the third beat.

**PROPOSAL B - Turn the stun swipe into a forest pressure choice.** The swipe could create a short-lived narrow zone or pin the boss to a line, making the player decide between staying in melee to punish the miss or moving away from the next combo.

**PROPOSAL C - Replace uncapped haste with a wounded-predator trade.** Frenzy could make the boss more mobile and dangerous while exposing a specific counter-window after its two-hit combo. This preserves pursuit while separating Timberclaw from Greatbear's permanent stacking cadence.

### Charnel-Crown Sovereign

**PROPOSAL A - Preserve corpse resurrection, explicitly choose it as a rules exception.** Make corpse sites visible and limited, so the player's decision is which bodies to kill, where to fight, and whether to allow a corpse cluster near the boss. This is viable only if the designer declares corpse reuse an intentional Wasteland exception to the Plains-only “new enemies” rule.

**PROPOSAL B - Preserve corpse memory without creating enemy entities.** Killed monsters could leave temporary grave hazards, attack pulses, or slowing remains that the boss reactivates. The gameplay purpose - previous kills remain relevant - survives without violating a strict no-add policy.

**PROPOSAL C - Make corpses a boss resource instead of adds.** The Sovereign could consume nearby corpses to gain a temporary ward, heal, or area denial state. The player then chooses whether to finish the boss quickly, pull it away from corpses, or spend damage clearing the resource field. This keeps Wasteland's “death has a cost” identity while removing extra combatants.

### Stoneplate Juggernaut

**PROPOSAL A - Turn the defensive window into a positional fortress.** Stoneplate Lock could establish a short-lived rock footprint or protected facing with an obvious weak side/safe gap. The player decides whether to move around it, wait, or commit burst into the opening rather than simply fighting a higher DR value.

**PROPOSAL B - Make Earthshatter alter the mountain floor.** A slam could leave one or more delayed rockfall lanes or split safe routes, using the existing Mountain ledge/chokepoint language. The goal is to make the second tier teach navigation through constrained geometry.

**PROPOSAL C - Give the repeating shield a condition.** The shield could be strongest while the Juggernaut remains planted and become breakable or weaker after it moves. This would connect defense to the Mountain “hold a position” identity and create an answer beyond waiting out DR.

### Dune-Stalker Emperor

**PROPOSAL A - Make the mark cycle the entire readable loop.** Paint and cash-out should have unmistakable state feedback, with a clear choice between cleansing, guarding the cash-out, or accepting the mark to maintain damage uptime. The Sandburst should be the visible cash-out beat, not a hidden multiplier stack.

**PROPOSAL B - Make the opener create a target/space decision.** The opening strike could establish a temporary “favored prey” relationship or sand line that changes where the player wants to stand. This retains the alpha-strike fantasy without adding Desert summons.

**PROPOSAL C - Introduce a light mirage/stance beat before the 50% speed phase.** A short cast could announce whether the boss is closing distance or preparing a ranged sandburst. The later Desert morphs would then feel like a progression of a taught language rather than the first time the player learns that the boss can change range.

## 12. Important designer decisions

1. **Summon policy:** Is the rule absolute for any additional enemy entity, or does Wasteland corpse reuse qualify as a deliberate non-Plains exception? If absolute, choose entity-free corpse hazards, boss resource consumption, or another replacement.
2. **T2 complexity budget:** Should every T2 boss add one new player decision, or is a numeric cadence/defensive phase acceptable when it reinforces the lineage? The current T2 roster mixes both approaches.
3. **Phase readability contract:** Should every permanent `morph`, `empower-charged`, `empower-shred`, and ambient-ramp change receive a blocking cast, a non-locking callout, a persistent boss state, or some combination?
4. **Cast interruption consistency:** Current scripted boss casts are visible but continue through stun/freeze, while charged and generic monster-ability casts can abort. Is that distinction intentional?
5. **Persistent hazard budget:** How much of a Swamp or Volcanic dungeon arena may become hazardous before movement stops being meaningful? T1/T2 pools are effectively fight-long; T3 Rot Bloom is a large late pool.
6. **Forest Frenzy cap:** Is Greatbear/Timberclaw's uncapped permanent stacking intended as a finite-fight race, or should the design have a readable cap/terminal state?
7. **Plains T2 add ceiling:** Gorging Razortusk's phase and repeating `spawn-adds` actions have no explicit `maxAlive`. Is indefinite accumulation intentional, or should the boss own a visible swarm ceiling?
8. **Long melee reach:** Stoneplate Juggernaut, Chitinous Dreadbore, Deep-Core Burrow-Gorger, and the Mountain T3 line are authored as melee with 72 px reach. Is this a deliberate heavy-body contact distance or stale data from an older ranged/position design?
9. **Environment in dungeons:** Jungle dungeons currently have no authored thickets, while open-world Jungle uses thicket detection/slow features. Should the Jungle boss arena express the biome through authored geometry, or should the boss carry that expression alone?
10. **T4 density ceiling:** Should T4 prefer one deeply coupled system per boss, or is the Trench-style multi-ability rotation the intended upper bound? This determines whether future T4 redesigns add mechanics or consolidate them.
11. **T1 contract:** Do the live T1 phase actions remain the intended quality bar, or should the old “pure shape/no phase” statement be restored? This is a design-contract/documentation decision, not a request to redesign T1 now.
12. **Balance pass ownership:** The current boss comments and current-state document explicitly say many numbers are inherited or placeholder. Which bosses should receive a structural redesign first, and which should be re-pitched only after the new encounter shapes are approved?

## 13. Audit handoff

**FACT:** This document was produced without changing code, balance values, server state, bot experiments, or tests. The workspace had pre-existing uncommitted changes; they were preserved. The only intended artifact from this task is this report.

The next safe design step is a designer review of the five priority bosses and the summon policy, followed by a separate structural proposal pass. Balance changes should wait until those decisions are locked and the stale current-state notes are reconciled with the live data.
