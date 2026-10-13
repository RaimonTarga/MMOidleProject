# Class-first design bible

**Status:** DRAFT, started 2026-10-13. Step 2 of the rework workflow in the
[brief](../docs/briefs/class-first-rework-brief-2026-10-13.md).
**What it is:** the design authority for the class-first rework, one section per system.
Each section carries its own status:

- **Locked**: build authority. Code may be written against it. Changing it needs new evidence.
- **Draft**: being discussed. No code against it.
- **Not started**.

Within a section, single items are tagged *Decided*, *Tentative* (open to challenge) or
*Proposed* (an agent's suggestion the designer has not answered yet).

**Precedence:** code is the truth for what exists; this bible is the truth for intent once
a section is Locked; until then the brief is. When this bible and an older design doc
disagree, this bible wins. The older docs it replaces are listed in §12 and get archived
when the section that replaces them locks. The read-only audit behind this draft is
[rework-audit-2026-10-13.md](../docs/briefs/rework-audit-2026-10-13.md).

| § | Section | Status |
|---|---|---|
| 1 | Principles and amended rules | Draft |
| 2 | Progression | Draft (shape Decided) |
| 3 | The class system contract | Draft |
| 4 | Items and loot | Draft |
| 5 | Defense and recovery | Not started |
| 6 | The class template | Draft |
| 7 | Conduit | **Locked** (2026-10-13) |
| 8 | Squire | Not started |
| 9 | Apprentice | Not started |
| 10 | Slinger | Not started |
| 11 | Spirit | Not started |
| 12 | Striker | Not started |
| 13 | Parked | — |
| 14 | Docs this bible supersedes | — |

---

## 1. Principles and amended rules — Draft

**The six principles (Decided, from the brief):** class-first; determinism where identity
lives, randomness where excitement lives; concrete beats numeric; automation must produce
power; big decisions, not small math; fewer, deeper classes (the current six).

**Prefer triggers that work in every fight.** On-kill effects go quiet on bosses and elite
fights, so a mechanic should fire on time alive, hits, damage taken, deaths of your own
pieces or similar, not on kills. *Decided (2026-10-13, Conduit dive).*

**Rules from the old bible that change.** Stated here so nobody "fixes" the new design back.

| Old rule ([design-bible.md](design-bible.md)) | New rule | Status |
|---|---|---|
| §1 "Deterministic. No RNG." | Combat and progression picks stay deterministic (the dodge counter, no damage rolls). Crafting stays deterministic; the random layer is component drops, each with a craft fallback (§4). | Decided (combat) / Tentative (rewards) |
| §1 Separated offense and defense budgets; the ability axiom "no defense scaling with offense" | Trades between offense and defense are allowed (Glass Duster, Juggernaut, Spirit's energy). The budget index (offense × defense) still prices them. Guardrail: a conversion lives in a class kit, runs one way, and an item that converts never also carries above-curve defense. | Decided (trades) / Proposed (guardrail) |
| §1 "Fully auto. Only lever is a charge/kite toggle." | Still fully automatic. The charge/kite toggle stays; a recall button probably stays for the Conduit. | Decided / Tentative (recall) |
| §3 "Biome = one theme expressed three times"; §6 the five shared weapon archetypes | Weapons and relics are class-specific. A mob family drops specific item bases; that is the new link between the world and the gear. | Decided |
| §9 Conduit weapon sets summon damage and cadence | The Conduit's weapon sets how the summon budget is split between summon types and which type it favors. | Tentative |
| §10 One shared Runic Point budget for runes, abilities, stances, rites | Gone. Automation is free; each class has its own budget system (§3). | Decided |

## 2. Progression — Draft (shape Decided)

| Tier | Pick | Count per class | Status |
|---|---|---|---|
| T1 | Class | 1 of 6 | Decided |
| T2 | Discipline: the main playstyle fork | 3 | Decided |
| T3 | Specialization: scoped to your discipline | 3 per discipline (9) | Decided (2026-10-13: moved from T4) |
| T4 onward | Leaf nodes: small picks, scoped to your discipline | 3 per discipline per tier (9) | Decided (2026-10-13) |

- **Changed 2026-10-13 (Conduit dive), for every class:** the build is fully branched by
  T3; T4 onward are leaf nodes. Reason: a T3 flat pick drafted for the Conduit came out at
  leaf scale (a minor farming boost) and broke the rhythm (T1, T2 big; T3 small; T4 big
  again). The old design held specialization for T4 partly because the T3 range pick was
  structural, and range is gone. The brief's Striker T3 example (finisher form Cleave /
  Execute / Shatter) is Striker's to place again, as a specialization or a leaf, in its
  own dive. *Decided.*
- **The power curve follows the picks:** T2's discipline is a considerable power step ("now
  your class is really getting started"); T3's specialization consolidates the build; from
  T4 the steps are more modest refinements. *Decided (2026-10-13).*
- **Leaves are scoped to the discipline: three per discipline per tier, nine per tier.**
  With one shared set of three, the right pick is obvious from your branch (an arrival
  stun is huge for a swarm and nothing for a few elites), so every leaf would be a trap
  for two of the three disciplines. More authoring, accepted. *Decided (2026-10-13).*
- 1 + 3 + 9 = 13 branching nodes per class through T3; leaves from T4. One more
  discipline-scoped capstone around T7–T8 stays. Branches never nest. Each pick also
  unlocks or upgrades abilities. *Decided.*
- **The current Passive Tree's frame → path layers carry discipline → specialization**
  (its shared range layer is dropped). Its unlock gate, reset, persistence and panel are
  reused; every node is new content with new ids (old names may return, old ids may not).
  *Decided (reuse is the audit's finding).*
- **The T1 class mechanics are new content too.** Four of the six change their core loop.
  *Decided by the class table in the brief.*
- **Zone (biome) levels stay.** They are each zone's progress clock: they unlock that
  zone's class recipes and gate upgrades of the items made there. *Decided (keep) /
  Tentative (jobs).*
- **Global Mastery stays, as a player level you can't reach by farming one biome**, and it
  grows the class's own budget in steps, shown in class terms ("Command 7, next at
  Mastery 24", never "Global Mastery 38"). Conduit: Command points. Each class's deep dive
  decides what its steps grow. *Decided (per class).* It no longer gates item upgrades;
  zone levels do. *Tentative (2026-10-13, confirm after the items mockup).*
- **The split:** tier picks decide what kinds of pieces you have; Global Mastery decides
  how much room they get; items shift or bend that room. *Proposed.*
- **Every class system has a T1 form**: something the player sees and sets in the first
  ten minutes, because most players have not reached T2 (25 of 38 in the Sep 24–27 live
  data). *Proposed.*

## 3. The class system contract — Draft

What every class's custom system (Order, Response rules, Payoff rules, Thresholds, Loadout,
Formation) must be.

- **One per class, and it is that class's automation.** Configuring it is the power
  decision. *Decided (brief: replaces the shared runic budget).*
- **Abilities are pieces that plug into it**, unlocked or upgraded by progression picks,
  never looted. *Decided.*
- **Rules cost nothing.** Make the character as smart as you want; what limits power is
  which pieces you own and how much room the system has. *Decided (2026-10-13).*
- **Each class has its own budget system** in place of the runic budget. The Conduit's is
  how many summons it fields and how powerful they are (§7). *Decided.*
- **Room grows with tier** (more beats, more rules, more formation slots…). *Proposed.*
- **Universal standing orders are free for every class:** Flee, Recover First, Avoid
  Hazards, target focus, travel. *Proposed.*
- **No shared stances or rites.** A class may have stance-like modes or rite-like passives
  of its own, inside its system. *Decided.*
- **Same engine, different surface.** One rule engine underneath (today's rune engine:
  condition → action); each class gets its own screen and vocabulary, so no two feel like
  the same editor. *Proposed.*
- **Signature payoffs stay with their class; themes may cross.** Freeze-then-shatter and
  stack-then-detonate are the Apprentice's; another class may use the same element without
  the same payoff. Some cross-pollination is fine: a Conduit playstyle built around damage
  over time is allowed. *Decided (2026-10-13).*
- **No two systems are "arrange your own sequence".** Striker authors a short sequence beat
  by beat; Slinger loads whole clip types (every bullet in a clip is the same; the last
  bullet is an extra modifier). *Decided.*
- **Bot-playable.** Every system has a sensible default configuration and a form the bot
  harness can set, because the bots are the balance pipeline. *Proposed.*

## 4. Items and loot — Draft

| Topic | Rule | Status |
|---|---|---|
| Slots | Five: weapon, relic, armor, charm, boots. The core slot is gone. | Decided |
| Weapon | Class-specific. | Decided |
| Relic: the boss trophy slot | Each boss drops your class's trophy, and the relic slot holds one. It is that class's boss piece and modifies its mechanic: Conduit, the Soul summon it fields; Striker, its empowered attack, made to do something special. Collected, swapped before a fight, upgraded by beating the same lineage's next-tier boss. Available from the first T1 boss kill. A specialization may grant a second relic slot (Conduit: Two Souls). | Decided (2026-10-13) |
| Armor, charm | Shared bases, class lines. A base carries a defensive mechanic; its class line is fixed per recipe, so the same base does different things per class (Conduit armor shifts who tanks: the summons or the Conduit). Choosing a line at an upgrade step is a later option. | Decided (shared bases) / Tentative (fixed lines) |
| Boots | Generic: mobility is universal. | Proposed |
| Item structure | A recipe makes exactly what its card says: nothing on an item is rolled. Upgrading (+N, paid in the zone's essence, gated by the zone's level) adds a small stat step, and some steps open a **socket**. Sockets open slowly: one in all of T1 (the weapon), about four by T2, eight by T3. | Tentative (2026-10-13) |
| Components | What fills a socket. Each one shows one visible effect, is typed by slot, and comes from one mob family: it **drops**, or you **craft** it from that family's material. Owned forever, moved between sockets for free, carried to later items, scaled by the tier of the item it sits in. Conduit components go into gear, not summons. **The least settled system: the designer is not yet sold on components or on which slots get sockets; to be scrutinised in its own session.** | Under review (2026-10-13) / Decided (Conduit: gear, not summons) |
| Smart loot | Drops and recipes only ever offer items and components for your class. No trading, now or planned. | Decided |
| Crafting | Stays, deterministic, with the essence economy. | Decided (stays) / Tentative (deterministic) |
| Target farming | Each mob family drops specific components and the material that crafts them. | Decided (families drive loot) / Tentative (components) |
| Pity | The family material is the pity: farm enough and you can always craft the component. A drop only gets you there early. No separate pity currency. | Tentative (2026-10-13) |
| Rule-benders | Legendary components: one line that bends a mechanic. Bosses drop them more often; boss materials craft them. | Proposed |
| Boss rewards | Bosses stay the tier gate and also give boss-specific rewards, held in the relic slot (above): a strong class piece per boss, so beating a boss is a real power step for every class, not only the Conduit. Conduit: a Soul summon (§7). Striker (designer's example): finishers or empowered attacks come from bosses as swappable abilities, each doing something different or stronger. Bosses should become more attractive to farm. | Direction Decided |
| Balance | Under ~50% power spread between classes, measured on the crafted (deterministic) schedule: drops only make a player early. | Decided / Proposed |
| Mockup | Conduit gear at T1 and T2, with a Tier 1 pacing strip: https://claude.ai/artifact/2ro6TRxK84x1KUa3MrEeNZ (all numbers illustrative). | — |

## 5. Defense and recovery — Not started

Known so far: Squire's Resolve and Spirit's energy shield are set (brief); Striker's
finisher grants a small shield/heal (brief); Conduit: §7.10 (who tanks is the armor line;
rebuilds cost HP; no default redirection). Flat
Recovery stays as the baseline. Each class deep dive fills in its own row.
**How stats work per class** (today: percentage class affinities applied after gear) is a
cross-class question, not yet reopened. *Open.* Cores are gone with the core slot (§4,
Decided); reviving them would need new evidence.

## 6. The class template — Draft

Every class section (§7–§12) answers the same questions, so classes can be compared and a
build agent can work from any of them.

1. **Fantasy.** One line a new player would say about it.
2. **Core mechanic.** The resource or loop, and what the player sees on the HUD.
3. **The class system.** What you configure, its vocabulary, its default configuration,
   how much room it has per tier, and a mockup of its screen.
4. **The T1 form.** What a fresh character sees and sets in the first ten minutes.
5. **Disciplines (3).** For each: the fantasy, what it changes, the content it is best at
   (packs, bosses, party).
6. **T3 specializations (9).** Three per discipline.
7. **Leaf nodes (T4 onward).** The small flat picks, and what else each tier gives the class.
8. **Abilities.** The pieces, and which pick unlocks or upgrades each one.
9. **Items.** Weapon bases, relics, the class's armor and charm affix pools, two or three
   rule-bender examples.
10. **Defense and recovery.**
11. **Stance-like modes or rite-like passives**, if the class has any.
12. **Party role.**
13. **Bot plan.** Default configuration per discipline; what the harness must set.
14. **Salvage.** Which existing code and art it reuses.
15. **Open questions.**

## 7. Conduit — Locked (2026-10-13)

**Locked by the designer on 2026-10-13: build authority.** Items still tagged *Proposed*
may change without reopening the section; **Playtest** questions stay open (§7.15).
Outside the lock, each for its own session: the Soul designs after T1's seeds, components
(§4), ground hazards and farming efficiency (§13), per-class stats (§5), T5–T6 (§13).

Written to the class template (§6) from the 2026-10-13 deep dive. Every call in order, the
reasoning and the ideas that were dropped are in
[conduit-deep-dive-log-2026-10-13.md](../docs/briefs/conduit-deep-dive-log-2026-10-13.md);
the prep is [conduit-deep-dive-prep-2026-10-13.md](../docs/briefs/conduit-deep-dive-prep-2026-10-13.md).
Mockups: the Formation screen, v1, partly superseded
(https://claude.ai/artifact/QZ3CmU3pZgqnb2Sqc5AZCF), and Conduit gear (§4). Tags as
everywhere in this bible; **Playtest** marks a question only the game can answer (§7.15).

### 7.1 Fantasy

A commander who binds the creatures of every land it crosses and the souls of the bosses
it beats, and fields them as a formation. It never strikes itself. *Decided.*

A fully resourced Conduit should feel a bit unfair: clunky when summons fall, and
overwhelming when the formation works. In an edge case it may be the strongest class.
*Decided.*

### 7.2 Core mechanic

- **Command is the budget.** Every summon costs Command, and the cost buys power: a 2-cost
  summon is worth about two 1-cost ones in its role. *Decided (budget) / Tentative (power
  follows Command; see Swarm, §7.5).*
- **Command grows with Global Mastery in steps** (§2): illustrative T1 4 → 6, T2 6 → 9. The
  weapon adds or removes some. Tier picks never add Command. *Decided.*
- **Rebuilding:** one queue, one summon at a time. It costs the Conduit HP proportional to
  the summon's HP and never takes the Conduit below a safety floor (today 20% of its HP).
  *Decided.* Faster out-of-combat rebuilding is a charm line, next to Recovery. *Decided.*
- **Every summon's stats scale with the Conduit's tier**, so an early favourite stays
  fieldable; new power arrives as new summons (§7.8). *Decided.*
- **The Soul** is a free boss summon held in the relic slot (§7.9). *Decided.* Named after its
  boss lineage (Crag Soul, Razorback Soul), not its biome: League of Legends already has a
  "Mountain Soul". It was called the Heart until 2026-10-13. *Decided (Soul) / Proposed
  (lineage naming).*
- **No design cap on summons**; a late-game army is wanted. *Decided.* Today's 9 is a
  tuning number (`hardEntityCap`), raised in measured steps. *Proposed.*
- **HUD:** Command as pips (used of total), the bodies in the formation, the rebuild queue
  with the next rebuild's HP cost. *Decided.*

### 7.3 The class system: Formation

**What you configure:**

- **The roster:** which summons you field, within Command. Each summon type does one job
  with a default behaviour. No per-summon AI editing. *Decided.*
- **The Soul** (two with Two Souls): which boss trophy sits in the relic slot. *Decided.*
- **Orders**, free and formation-wide: what to attack first (what attacks the Conduit,
  closest, weakest, elites and bosses); who the tanks guard (the Conduit, the back row);
  when to Recall; which role rebuilds first (tanks, damage, supports, or in the order they
  fell). *Decided.*
- **Recall:** a button and a free rule; the Conduit's only action of its own. *Decided.*

**Not in it:** tactics or stances (the roster already is the stance); Conduit casts
beyond Recall; damage redirection by default (§7.10). *Decided.*

**Roles** *(Decided)*:

- **Tank:** soaks damage and protects the Conduit and the formation. Its taunt is what
  holds a boss.
- **Damage:** from glass cannon to tanky; melee and ranged.
- **Support:** buffs summons, debuffs enemies, heals summons and the Conduit. Its buffs
  and debuffs reach the party too (§7.12).

Role sets the row: tanks in front, melee in the middle, ranged and supports at the back;
no free placement. *Decided.* Room per tier: the Command steps. Default configuration: §7.13.

### 7.4 The T1 form

- **Start (Clearing):** four **Thralls** (melee, decent bulk, okay damage, nothing special)
  and a generic weapon and armor from the tutorial that only add damage and defense.
  *Decided.*
- **Each T1 biome's threat hands you its answer:** a specialist (that zone's class
  recipe, bound at a zone level, before its boss), a weapon and an armor. *Decided
  (shape).*

| Biome | Threat | Specialist | Weapon | Armor (Conduit line) |
|---|---|---|---|---|
| Plains | swarms | Tank with plating; a short sweep taunts the enemies around it | More summons: the swarm weapon | Plating for the summons, some for you |
| Forest | fast packs | Fast melee bruiser, little HP | Fewer summons, faster attacks | **Bramble:** thorns; summons hit back a flat amount for every hit they take, so fast attackers hurt themselves (*Decided*; not evasion: a dodge counter reads for one target and is impossible to follow across a formation) |
| Swamp | DoT, attrition | Ranged support whose acid strips the target's plating | Summon hits stack poison: back-loaded single-target damage | Poison on you moves to a summon |
| Mountain | the hardest hits | Ranged power shot from the back row, little HP | Stronger summon abilities | A hit that would take over 30% of your HP goes to the nearest tank |
| Cave | elites | Heavy tank, 2 Command: the first multi-Command summon | Fewer, stronger summons | You tank: your HP and DR, so the summons can all deal damage |

The specialists and weapons are the designer's sketch (*Tentative pieces*). The Plains
sweep, the Swamp acid and the armor lines were agent proposals, approved 2026-10-13
(*Decided*; numbers open). The Forest
weapon loses to plated targets (small hits); the Swamp acid and poison are its answer.

- **The first ten minutes:** four Thralls, Command 4 as pips, the orders pre-set, Recall
  on R. The first specialist, the Plains tank, arrives around minute 6 of a guided run and
  answers the Plains entry spike playtest 3 measured (15 of 177 HP). The first Soul comes
  from the first boss kill. *Decided (pacing from the §4 mockup; minutes illustrative).*

### 7.5 Disciplines (T2)

A considerable power step (§2). Each discipline reshapes the same roster instead of
bringing its own summons. *Decided.*

| | Swarm: how many | Pack: how varied | Elite: how strong |
|---|---|---|---|
| Fantasy | A flood of cheap, disposable summons | A team where every member has a different job | A few champions |
| Rule | 1-cost summons cost half (two for the price of one) and rebuild for free. No temporaries in the baseline. *Tentative.* | A summon whose type the formation doesn't have yet costs 1 less (never below 1). **Pack Strike:** every 8 s, each different type uses its ability on the focus target at the same moment; a free order can fire it early, restarting the timer. *Tentative.* | Every summon costs +1 Command and gains modest bulk and stats plus an **elite extra**: an ability or passive that deepens its role. The extras are Elite's area damage. *Decided.* Starting numbers: +50% HP, +25% damage (about 1.4 summons of stats, plus the extra, for 2 Command). *Decided as a starting point; bots and playtests tune it.* Elite picks from the whole roster (12 summons at T2, 19 at T3, 26 at T4). |
| Best at | Packs | Mixed content, parties | Bosses |
| Weapon fit | Extra-Command weapons are worth the most here | | Worth the least (+2 Command is one summon) |
| Playtest | Half or full strength for the half-cost summons | | How often elites die |

**Never a single-summon Conduit:** the free Soul keeps company even in Elite. *Decided.*

### 7.6 Specializations (T3)

The build consolidates (§2). Concepts *Decided*; mechanics *Tentative* unless marked.

| Swarm | Pack | Elite |
|---|---|---|
| **Burn Bright:** summons arrive in waves, burning hot (faster attacks for their first seconds), then burn out. | **Shield Wall** (tanks): damage to any tank is split across all of them; each different tank type adds a layer. | **Colossus:** the double-down: summons cost another +1 Command, grow huge and share **one colossal twist** (e.g. their hits shake the ground around them), not a third trait per summon; +100% HP and +50% damage over the base summon as a starting point. *Decided (2026-10-13).* |
| **Legion:** more copies of the same summon make them all stronger, at visible thresholds (at 4 copies they do X, at 8 Y), never a percentage per copy. Which summon you mass is the build. | **The Hunt** (damage): each different damage type that hit the target in the last few seconds raises everyone's damage on it. | **Ascendant:** summons grow stronger the longer a fight lasts (time, not kills). It wants a healer keeping them alive. |
| **Infestation:** swarm hits infest the target, stacking damage over time; an infested enemy that dies bursts into short-lived summons. Ties the class to damage over time. | **Choir** (support): each support's ability echoes, weaker, through every other support type. | **Two Souls:** a second relic slot. Two Souls buff each other and the formation; the second costs Command (amount: **Playtest**). |

Pack's concept (*Decided*): each specialization significantly empowers one role group.

### 7.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Conduit's T4 asks: do your summons survive, or do
you want them to die, and if they survive, how? *Decided.*

| | Swarm | Pack | Elite |
|---|---|---|---|
| Die well | **Burst:** a dying summon explodes (with Burn Bright: waves that blow up as they burn out) | **Avenge:** when a summon dies, the rest strike its killer together | **Final Command:** a dying elite uses its extra one last time, at double strength |
| Come back well | **Grand Entrance:** every rebuilt summon lands with a short stun | **Fall Back:** a hurt summon retreats behind the tanks, recovers, rejoins | **Last Stand:** once per fight, an elite that would die holds at 1 HP for a few seconds |
| Survive | **Devour:** a summon that has lived a while starts stealing back HP | **Rally:** the Pack Strike patches up the whole formation | **Shared Burden:** damage to your elites is partly paid from your HP |

*Decided (kept as drafted).* Spare ideas for later leaf tiers: Second Focus (the formation
splits across two targets), Soul of the Pack (the Soul joins the Pack Strike and counts
as a type), Shockwave (elite hits splash), Reforge (rebuilt summons return shielded;
depends on how often they die), Soulbond (the Soul's bonus covers the Conduit),
Lingering Soul, Ossuary, Crown of Thralls.

### 7.8 Abilities, and where every piece comes from

The Conduit's abilities are its summons' abilities; the Conduit itself only Recalls.

| Piece | Comes from | Status |
|---|---|---|
| Specialists (one job and ability each) | A zone's level binds its summon, before its boss | Decided |
| Variants | A biome returning at a higher tier binds a new variant: ~26 specialists through T4 (5 at T1, then 5 variants + 2 new biomes per tier) | Decided |
| Souls | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| Discipline rule | The T2 pick | Decided |
| Specialization mechanic | The T3 pick | Decided |
| Leaves | T4+ picks | Decided |
| Elite extras | The Elite discipline, one per specialist (or per family, if authoring demands) | Decided (Elite) / Open (granularity) |
| Recall | Always | Decided |

**Seed specialists for the biomes after T1** (*Proposed*, the first summon of each; the
variants are still to design): Jungle healer (T2; the first healer, heals the most hurt
ally including the Conduit), Desert executioner (T2; marks a target and executes it below
a threshold), Tundra chiller (T3; enemies around it attack slower, for when kiting enemies
exist), Volcanic burner (T3; the first area damage, toward the T5 pack axis), Graveyard
raiser (T4; fallen enemies rise briefly, an on-kill to review), Trench hook tank (T4; hooks
the enemy hitting the back row). **Juggernaut**, a summon whose damage scales off its HP,
is a summon type: the Cave heavy's T2 variant. *Decided.*

**Seed Souls** (*Proposed*; the real designs come after every class settles, and Two
Souls means they are also designed as pairs). Each has its own sprite, never the boss's.

| Lineage (tiers) | Formation bonus | Leans |
|---|---|---|
| Plains (T1–2) | Every 10 s, all melee summons charge the focus target together | Pack |
| Forest (T1–2) | Summons slowly heal during a fight | Elite |
| Swamp (T1–3) | Every summon death leaves a bile pool that hurts enemies | Swarm |
| Mountain (T1–4) | A tank's taunt also shields it | Elite |
| Cave (T1–3) | Every 6 s a spiderling appears for 8 s | Swarm |
| Desert (T2–4) | Each different summon type that hits the marked target adds a stack | Pack |
| Jungle (T2–4) | The formation never loses a fleeing target and moves faster | Swarm |
| Tundra (T3–4) | Enemies near the Soul are chilled | Elite |
| Volcanic (T3–4) | The formation heats up over a fight: more damage every 10 s | Pack |
| Wasteland (T4) | Enemies the formation kills rise as temporary thralls (an on-kill to review) | Swarm |
| Trench (T4) | The longer the fight, the tougher the summons | Elite |

A retired lineage's Soul (Plains and Forest after T2) keeps working and scaling; it only
stops ranking up. The authoring load (~26 specialists, their elite extras, 11 Souls and
their ranks) is accepted. *Decided.*

### 7.9 Items

| Slot | The Conduit's version | Status |
|---|---|---|
| Weapon | Shapes the formation: potency (how hard summons hit), Command up or down, a role bonus. More damage costs utility. T1's five jobs per biome (§7.4) recur each tier as new recipes; new biomes add variants. | Decided (direction) |
| Relic | The Soul. Two with Two Souls. | Decided |
| Armor | Who tanks: the Conduit line moves defense between you and the summons (today's unused `conduitDefenseShare` becomes its consumer). | Tentative (§4's class lines) |
| Charm | Who recovers: the Conduit (whose HP is the rebuild fuel), the summons, or both. See the charm lines below. | Decided (the question) / Proposed (lines) |
| Boots | Generic. | Proposed (§4) |
| Components | Go into gear, never into summons. The component system itself is under review (§4). | Decided / Under review |

**Charm lines** (*Proposed*, 2026-10-13). The armor answers "who tanks?"; the charm
answers **"who recovers?"**, the Conduit or its summons. Each biome's charm is a shared
recovery base plus this Conduit line; returning biomes' lines grow stronger each tier.

| Biome | Line | Who recovers | Answers | Wanted by |
|---|---|---|---|---|
| Plains | **Herd:** fallen summons rebuild faster out of combat | Summons, between fights | Swarms that wipe the formation | Everyone farming (the decided out-of-combat line) |
| Forest | **Sapbark:** summons regenerate HP after a few seconds without being hit | Summons, in a fight | Fast packs that hit in bursts | Elite, Ascendant: few bodies kept alive |
| Swamp | **Bloodtithe:** when a summon dies, you get back part of the HP you paid to build it | You, from your losses | Attrition | Pack and Elite (costly rebuilds); nothing for Swarm's free cheap summons |
| Mountain | **Cairnstone:** after a big hit on you, your Recovery triples for a few seconds | You, after a spike | The hardest hits; bosses come for the Conduit | Every boss build |
| Cave | **Deep Reserve:** the rebuild queue works on two summons at once | Summons, throughput | Elites that kill several bodies | Swarm, Legion: many deaths at once |
| Jungle (T2) | **Bloomlink:** support summons' heals also heal you for half | Both, through supports | Ambushers that reach you | Pack, Choir |
| Desert (T2) | **Purge:** every few seconds, the most debuffed body (a summon or you) loses one debuff | Both, from debuffs | Marks, slows, poison (now landing on summons) | Debuff fights, everyone (*Decided*) |

The charm lines are *Decided* (2026-10-13; "good enough, don't overcook"). Bloomlink may be
too strong: check in the game.

### 7.10 Defense and recovery

- **How monsters choose targets (code, 2026-10-13):** every regular mob attacks the closest
  target in its pull range, player or summon. All 26 bosses go for the player whenever one
  is in reach (`prefersPlayers`). A taunt overrides both, and no monster ignores taunts.
  Nothing hunts the Conduit specifically; a `lowest-hp` targeting mode exists unused
  (`server/src/systems/combat/ai/monsterTargeting.ts`). On bosses, the tank's taunt is the
  Conduit's defense.
- **No damage redirection by default.** Today a share of hits aimed at the Conduit goes to
  a random living summon (`damageSponge.ts`, 8–55% by range). In the rework it exists only
  where a gear line grants it. *Decided (no default) / Tentative (gear only).*
- **Monster debuffs land on summons, the same as on players** (poison, slows, stuns, marks,
  chill, heat). *Decided (2026-10-13).* Today a monster's hit on a summon skips the combat
  pipeline and carries no on-hit effect at all ("damage sponges, not full combatants",
  `runMonsterAttackOnMinion` in `server/src/systems/combat/engine/combat.ts`), which is why
  the Conduit ignored debuff fights. Debuff biomes now test it like every class; a summon
  killed by poison costs rebuild HP; the answers are support summons and gear lines.
  **Build task:** summon hits carry on-hit effects.
- **Kept facts:** summons copy the Conduit's plating and DR (the armor line will set the
  share); summon hits pay half an enemy's plating; one area hit over N summons deals
  N^-0.5 to each.
- **The Conduit's HP is the formation's fuel:** it pays for rebuilds, so the Conduit's
  Recovery and its support summons' heals keep the formation standing.
- **Future (designer's direction):** mobs with different targeting, some of them
  opportunistic ambushers that go for the summoner. *Parked.*

### 7.11 Stance-like modes, rite-like passives

None. Tactics were considered and dropped: no meaningful idle decision, since the roster
already is the stance. Upkeep lives on the charm and the leaves. *Decided.*

### 7.12 Party role

The flexible party member: it tanks a swarm with bodies that absorb hits (taunts pull
enemies off allies, bosses included), supports (its support summons' buffs and debuffs
also affect the party), or simply deals damage. *Decided.* The same buff from two Conduits
doesn't stack (the strongest copy applies; different buffs still combine), so a party of
Conduits doesn't multiply. *Decided (2026-10-13).*

### 7.13 Bot plan

*Proposed.* Bots can't press buttons, so every lever is a setting the harness writes.

- **Harness intents:** set the roster; equip the relic(s); set the orders, including the
  Recall rule. The old manual commands and the Step Back / Taunt runes go.
- **Defaults:** T1, the bound specialists in role order (tank, damage, damage, support),
  then the Cave heavy once bound. Swarm: fill Command with half-cost summons, tank first.
  Pack: one of each type. Elite: a tank and two damage elites. Soul: the one the
  discipline leans to (§7.8).
- **Metrics:** `formationAttrition` (deaths, rebuild HP paid), time to kill, Conduit
  deaths. Measure the median build and the ceiling separately (§7.1, §4).
- **Test arms the design already asks for:** Swarm at half vs full strength; the second
  Soul's cost; elite death frequency; summon-cap steps (tick time, bandwidth).

### 7.14 Salvage

| Keep | Where |
|---|---|
| Minion runtime: full ECS entities, stable logical slots, leash, networked keys | `server/src/systems/classes/archetypes/summoner/` |
| The profile seam: one function turns inputs into the formation. Its inputs become roster, discipline, specialization, gear and Soul. | `shared/src/systems/summonerProfile.ts` |
| The rebuild queue: HP cost, safety floor, faster out of combat (that speed becomes the charm line) | `reconstruction.ts`, `SUMMONER_CORE_TUNING` |
| Area-hit sharing | `areaShareExponent` |
| Attack modes (melee 18, reach 96, ranged 190) and their FX, now per summon type | `SUMMONER_RANGE_TUNING` |
| Taunt and target selection | `server/src/systems/combat/ai/taunt.ts`, `monsterTargeting.ts` |
| A summon delivering an ability | `formationTechnique.ts` |
| Old spec mechanics as references: Iconoclast's detonations (Burst), Inquisitor's marks, Chorister's voices, Ritualist's empowered charges, the Consort line bonus | `specs/`, `lineHolds.ts` |
| `conduitDefenseShare` (authored, no consumer) | becomes the armor line's consumer |
| 13 summon bodies and the Conduit player bodies | the atlases |
| The Passive Tree's panel, unlock gate, reset and frame → path layers | §2 |

| Remove or rework | Why |
|---|---|
| Weapon Attack and cadence translated into summon damage | Reversed: the weapon shapes the formation |
| Frames, range nodes and the nine specs as data | Replaced by disciplines and specializations |
| The default damage sponge | No default redirection (§7.10) |
| `hardEntityCap: 9` | Raised in measured steps |
| Manual commands other than Recall; the Step Back and Taunt runes driving summons | Orders and summon behaviours |

### 7.15 Open questions

**Playtest:**

1. Swarm's half-cost summons: half or full strength?
2. The second Soul's Command cost.
3. Do elites die often enough for the death leaves (and Reforge)?
4. Every number: Command steps, summon costs, the rebuild HP ratio, the Pack Strike
   timer, Legion's thresholds.

**Design, later:**

5. The Souls: T1's five use the seed lines as written (*Decided*, so the T1 build has
   them); their ranks, the six later Souls and the pairs for Two Souls come after every
   class settles.
6. The variants: ~21 specialists after T1's five.
7. Elite extras per summon or per family (authoring).
8. On-kill review: Infestation's spread, the Graveyard raiser, the Wasteland Soul (§1).
9. The armor and charm Conduit lines after T1 (§4).
10. Components (§4's own session) and farming efficiency (§13).
11. Mob targeting variety: opportunistic mobs that go for the summoner.

### 7.16 Tier by tier: what each biome gives the Conduit

T1 is §7.4. Every later tier follows the same shape: each biome's threat hands you its
answer. Returning biomes bind a **new variant** (§7.8); new biomes bind their first
specialist; each biome has a weapon and an armor recipe; its boss gives or ranks up a Soul.

**How gear evolves** (*Proposed*): a weapon or armor **job follows you up**. Every tier
has a recipe for each job you already know, stronger; new biomes add new jobs. When a
biome retires (Plains and Forest after T2), its jobs move to a biome of the next tier.

**T2, biome by biome** (*Decided on paper, 2026-10-13*, to be judged in the game; names
are placeholders). First Strike's note: it suits short fights and farming, and it gains a
second life with builds whose summons keep arriving fresh (every new summon has its first
strike ready). Charms: §7.9.

| Biome | T2 threat | Summon | Weapon | Armor (Conduit line) | Soul |
|---|---|---|---|---|---|
| Plains | Stampedes: the herd charges | **Ironhorn** (tank): braces; a charge that hits it stops dead and the charger is stunned for a moment | More summons, stronger | Plating, stronger | Razortusk ranks up |
| Forest | Cadence duel, stuns | **Barkward** (support): every few seconds coats a summon in bark that absorbs the next stun or control and some damage | Faster attacks, stronger | Thorns, stronger | Timberclaw ranks up |
| Mountain | Heavy plating, charges | **Rockhurler** (ranged damage): lobs boulders that hit a small area; the class's first real area damage | Stronger summon abilities, stronger | Big-hit intercept, stronger | Stoneplate ranks up |
| Swamp | Area denial: pools, rain, rising mire | **Bog Leech** (damage, sustain): latches onto its target and drains it, sharing what it drains with the most hurt summon | Poison, stronger | Poison moves to a summon, stronger | Mire Behemoth ranks up |
| Cave | Eruptions from below | **Juggernaut** (heavy): its hits scale off its own max HP (*Decided*) | Fewer, stronger summons, stronger | You tank, stronger | Dreadbore ranks up |
| Jungle (new) | Fleeing prey, ambushers from cover | **Bloomtender** (support): the first true healer; heals the most hurt ally, the Conduit included | **New job: First Strike:** each summon's first hit on a new target hits much harder | **New: Sentinel:** the first hit each enemy lands on the Conduit is taken by the nearest summon (anti-ambush) | New Soul (Dread-Gorger) |
| Desert (new) | Mark, slow, execute; ranged kiters | **Executioner** (ranged damage): marks its target; below a threshold its shots hit twice as hard (a threshold, not an on-kill) | **New job: Longshot:** ranged summons fire from much further back and hit harder at range; melee summons hit softer | **New: Sandveil:** ranged hits deal less to you and your summons (*Decided*; replaces Decoy, which was too narrow) | New Soul (Dune-Stalker Emperor) |

By the end of T2 the roster is 12 specialists plus the Thrall: 2 tanks (the Plains tank,
Ironhorn), 2 heavies (the Cave heavy, Juggernaut), 5 damage dealers (the Forest bruiser,
the Mountain marksman, Rockhurler, Bog Leech, Executioner) and 3 supports (the Swamp
spitter, Barkward, Bloomtender): enough for Pack's variety and Legion's choice of what to
mass.

**T3, biome by biome** (*Decided on paper, 2026-10-13*, to judge in the game; names are
placeholders). Settled after review: the Tundra weapon is Icebound (not Planted), the
Volcanic charm is Emberglow (Phoenix dropped: odd and niche), and Firewalker is replaced
because ground hazards hurt only players (`groundZones.ts`) and stay that way for now (§13). The Cinderling's ramp is its own, not the Volcanic's Heat: it burns
everything around it and grows hotter the longer it fights, in every biome. *Decided.*
Hibernate may be too strong: check in the game.

T3 is where the build consolidates: the specialization pick, two new biomes (Tundra,
Volcanic), and the Plains and Forest retire. **Their gear jobs move** (*Proposed*): the
Forest's (faster attacks, Bramble thorns, Sapbark) to the **Jungle**, its successor biome
(the Jungle's families are written as the Forest's descendants; the T3 Jungle boss is the
Apex Bramble-Slasher); the Plains' (more summons, plating, Herd) to the **Volcanic**, whose
Swarm family is many fast, short-lived bodies and whose Anchor family is armored.

| Biome | T3 threat | Summon | Weapon | Armor (Conduit line) | Charm (Conduit line) |
|---|---|---|---|---|---|
| Mountain | Horn-Behemoth's charges | **Warhorn** (heavy support, 2 Command): a towering horn-beast; every few seconds its call gives every summon in a wide circle faster attacks for a few seconds; the first offensive buffer and the first support heavy (*Decided*) | Stronger abilities, stronger | Big-hit intercept, stronger | Cairnstone, stronger |
| Cave | Burrow-Gorger, from below | **Burrower** (melee damage): tunnels and erupts under its target, reaching the back-row casters and gunners | Fewer, stronger, stronger | You tank, stronger | Deep Reserve, stronger |
| Swamp (last tier) | Rot-Spore Croc, spores | **Sporecaller** (support): spores make the enemies around its target deal less damage | Poison, stronger | Poison moves, stronger | Bloodtithe, stronger |
| Jungle | Bramble-Slasher, pursuit, flight | **Prowler** (melee damage): strikes from hiding every few seconds and pounces on fleeing enemies | First Strike + the Forest's faster attacks | Sentinel + the Forest's Bramble thorns | Bloomlink + the Forest's Sapbark |
| Desert | Carapace Monarch's postures; fast-kill dealers | **Carapace Guard** (tank): raises a shield toward the strongest ranged attacker, blocking shots aimed at the summons behind it | Longshot, stronger | Sandveil, stronger | Purge, stronger |
| **Tundra** (new) | The Chill clock, Deep Freeze, Ice Armor shells, root casters; bosses accept no control | **Frostcaller** (support): enemies around it attack and move slower (slows matter now that kiters exist) | **New job: Icebound:** summons hit harder against slowed, rooted or chilled enemies (*Decided*; weak on the bosses that accept no control, a fair counter; replaced Planted) | **New: Permafrost:** tank summons can't be slowed, rooted or frozen, so they keep holding | **New: Hibernate:** a summon below a quarter of its HP encases itself in ice for 3 s: it can't act, takes no damage, regenerates (a cooldown per summon; may be too strong) |
| **Volcanic** (new) | Heat (everyone deals and takes more), vents, the Final Eruption damage check, Obsidian shells, hound swarms, burning gunners | **Cinderling** (melee damage): burns everything around it; hotter (stronger) as the fight's Heat rises | **New job: Berserk:** wounded summons hit harder (they glow) + the Plains' more summons | **New: Fireproof:** damage over time on you and your summons is halved (*Decided*; replaced Firewalker, since hazards stay player-only) + the Plains' plating | **New: Emberglow:** your Recovery also heals the summons near you (*Decided*; replaced Phoenix) + the Plains' Herd |

**Heavies (2+ Command by default), one per tier, roles rotating** (*Decided*, 2026-10-13;
the designer found T3 had none and no support heavy existed): T1 the Cave heavy (tank), T2
Juggernaut (damage), T3 Warhorn (support), T4 the Obsidian Tortoise (tank) and Avalanche
(damage, 3 Command).

Roster by the end of T3: 19 specialists plus the Thrall. Souls: Swamp and Cave reach their
last rank; Mountain, Desert and Jungle rank up; Tundra (Rime-Mammoth) and Volcanic (Magma
Salamander) bring new Souls.

**How the T3 biomes test the specializations** (picked at the same tier):

- **Shells reward burst** (Tundra's Ice Armor, Volcanic's Obsidian Shell waste chip damage
  and damage over time): hard for Infestation and a cheap Swarm; good for Colossus, the
  Executioner and the Pack Strike (every ability at once is a burst).
- **Heat lands on summons too:** Burn Bright's waves hit even harder and burn out even
  faster; Ascendant's long fights get more dangerous as they go.
- **Chill and freezes land on summons:** a Legion of one type freezes together; Purge,
  Permafrost and Hibernate are the answers.
- **Tundra and Volcanic bosses accept no control:** stuns and slows (Ironhorn, Grand
  Entrance, the Frostcaller) and the Icebound weapon do nothing on those two bosses; that
  is a counter, not a bug.
- **The Final Eruption is a damage race:** the Pack Strike's timing, Colossus and Berserk
  matter there.

**Kept clear of the Apprentice:** freeze-then-shatter and stack-then-detonate are the
Apprentice's Frost and Fire payoffs, so the Conduit's Tundra and Volcanic weapons avoid them
(Icebound, Berserk). A damage-over-time Conduit playstyle is still fine (§3).

**T4, biome by biome** (*Decided on paper, 2026-10-13*, to judge in the game; names are
placeholders)

T4 is the first leaf tier (§7.7). The Swamp and Cave retire after T3; **their jobs move**:
the Swamp's (poison, poison moves, Bloodtithe) to the **Graveyard** (its Plague family),
the Cave's (fewer and stronger, you tank, Deep Reserve) to the **Trench** (its Anchor
family, the deep). The Mountain has its last tier here.

| Biome | T4 threat | Summon | Weapon | Armor (Conduit line) | Charm (Conduit line) |
|---|---|---|---|---|---|
| Mountain (last tier) | Iron-Crest Titan | **Avalanche** (heavy, 3 Command, the first 3-cost summon): every few seconds charges through a line of enemies and knocks them down | Stronger abilities, stronger | Big-hit intercept, stronger | Cairnstone, stronger |
| Tundra | Glacial Patriarch, Ice Armor to break | **Icewarden** (support): wraps the most hurt summon in an ice shell that absorbs damage; the first shield-giver | Icebound, stronger | Permafrost, stronger | Hibernate, stronger |
| Jungle | Verdant-Crown Predator | **Dartcaller** (ranged damage): poison darts that ricochet to a second target | First Strike and faster attacks, stronger | Sentinel and thorns, stronger | Bloomlink and Sapbark, stronger |
| Desert | Dune-Throne Sovereign | **Mirage** (support): conjures a copy of the Conduit that draws attacks for a few seconds; bosses that go for the player chase it | Longshot, stronger | Sandveil, stronger | Purge, stronger |
| Volcanic | Caldera Sovereign: Simmering Burn, Magma Shove | **Obsidian Tortoise** (tank, 2 Command): every so often withdraws into its shell, taking almost no damage while it keeps taunting (the enemy's shell, now yours) | Berserk and more summons, stronger | Fireproof and plating, stronger | Emberglow and Herd, stronger |
| **Graveyard** (new) | The necromancer: adds, Bone Tithe, Harvest; area damage matters most | **Gravecaller** (support): when one of your summons dies, it rises once as a spectral husk for a few seconds before going to the rebuild queue (your own deaths, so it works on bosses) | **New job: Cleave:** summon hits splash part of their damage to enemies around the target + the Swamp's poison | **New: Grave Pact:** when a hit would kill you, a summon dies in your place (long cooldown) + the Swamp's poison moves | **New: Requiem:** when a summon dies, the others heal for part of its max HP + the Swamp's Bloodtithe |
| **Trench** (new) | The debuff pile (anti-heal, slow, damage taken), Depth, Devour per debuff on you, untargetable dives | **Abyssal Warden** (tank): every few seconds pulls one debuff off a nearby summon or the Conduit onto itself; the summoner's "summons tank the debuffs", now visible and active | **New job: Exploit:** summons hit harder for each different debuff on their target + the Cave's fewer and stronger | **New: Pressure Seal:** every few seconds each body (a summon or you) ignores the next debuff it would receive + the Cave's you tank | **New: Tidewater:** your Recovery doubles while you carry three or more debuffs + the Cave's Deep Reserve |

Roster by the end of T4: 26 specialists plus the Thrall: 5 tanks, 3 heavies, 9 damage
dealers, 9 supports. Souls: the Mountain reaches its last rank; Tundra, Jungle, Desert
and Volcanic rank up; the Graveyard (Charnel-Crown Sovereign) and Trench (Elder Trench
Serpent) bring new Souls.

**How the T4 biomes test the build:**

- **The Graveyard is the area-damage fight:** Cleave, Rockhurler, Dartcaller, Cinderling
  and Infestation (many adds dying at last pays its spread) shine; Bone Tithe punishes a
  single-target formation.
- **The Trench piles debuffs, and Devour counts the ones on you:** the Abyssal Warden,
  Purge and Pressure Seal keep the Conduit clean; Exploit turns the support summons'
  debuffs into damage.
- **The Trench boss dives out of reach:** summons idle while it is untargetable; leaves
  and Recovery carry the gap.
- **The Patriarch's Ice Armor wants burst** (as in T3), and the Caldera's Magma Shove
  pushes you into hazards (player-only for now; §13).

## 8.–12. Other classes — Not started

Order: **Conduit first** (the first slice; the most complex; the players who asked for it).
Proposed order after it: Squire (shares the "who tanks" and party questions with Conduit),
Apprentice, Slinger, Spirit, Striker. Each class's brief concept is in the
[brief](../docs/briefs/class-first-rework-brief-2026-10-13.md#class-reworks).

## 13. Parked

- Future classes: Rogue, Wizard (after the six are stable). If Wizard ships, cast times are
  its identity; Spirit keeps Tide. *Proposed.*
- Tiers 5–8 content. **T5–T6 will come into scope later** (players want new content); it
  needs its own session, starting with the T5–T6 world (biomes, families, threats, bosses).
  Direction in `t5-t8-endgame-suggestions.md`: T5 the pack tier (shared aggro, alphas,
  "sweep or kill the alpha"), T6 layered defenses and twin bosses. Conduit notes from the
  dive (*Proposed*): T5 is where the summon cap rises and the army arrives; new free orders
  "favor clustered targets" and "hunt the alpha"; T5 leaves "spread or focus", T6 leaves
  "coverage" (Second Focus fits twin bosses).
- What boss materials buy (§4).
- **Ground hazards** (pools, vents, burning ground): the designer finds them not very
  interesting; redesign in their own session. Until then they hurt only players, never
  summons. *Decided (for now).*
- **Farming-efficiency stats** (more loot, XP, essence). The designer likes the idea, for a
  separate session. Agent's caution: on a gear slot it becomes mandatory (everyone takes
  the bigger farming number), so it may want its own layer rather than a combat slot.
- The walking between seals (playtest 3). Real, but not part of this rework.

## 14. Docs this bible supersedes

Archived with a header when the section that replaces them locks:
`progression-rework-design.md`, `T1_ITEM_DESIGN_PHILOSOPHY.md`,
`T1_ITEM_NUMERICAL_BASELINE.md`, `ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`,
`CORE_DESIGN_PHILOSOPHY.md`, `CORE_T4_CAST.md`, `CORE_CAST_REVIEW_DRAFT.md`,
`summoner-overhaul-design-source.md` (**archived 2026-10-13**, §7 locked), `relics-design.md`. `design-bible.md` is amended
(§1, §3, §6, §9, §10) rather than archived: its world, biome and math sections still hold.
