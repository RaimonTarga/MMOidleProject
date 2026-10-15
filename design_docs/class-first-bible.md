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
| 8 | Squire | **Locked** (2026-10-14) |
| 9 | Apprentice | **Locked** (2026-10-14) |
| 10 | Slinger | **Locked** (2026-10-14) |
| 11 | Spirit | **Locked** (2026-10-14) |
| 12 | Striker | **Locked** (2026-10-14) |
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
  Execute / Shatter) was placed in the Striker's dive: finisher forms are boss trophies
  (§12.9), and Shatter stays the Apprentice's. *Decided.*
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
- **No abilities outside the class system.** Anything outside it (gear lines, relic
  effects, leaves) is passive, never an ability with its own button or callout; callouts
  belong to the class's own announced moves. *Decided (Striker, 2026-10-13) / Proposed
  (every class).* The Conduit already fits: its abilities are its summons', and Recall is
  part of Formation.
- **Rules cost nothing.** Make the character as smart as you want; what limits power is
  which pieces you own and how much room the system has. *Decided (2026-10-13).*
- **Each class has its own budget system** in place of the runic budget. The Conduit's is
  how many summons it fields and how powerful they are (§7). *Decided.*
- **Room grows with tier** (more beats, more rules, more formation slots…). *Proposed.*
- **Universal standing orders are free for every class:** Flee, Recover First, Avoid
  Hazards, Keep Distance (kiting), target focus, travel. *Proposed (the list) / Decided
  (Keep Distance, 2026-10-14, Slinger dive: today a rune; every ranged class needs it, and
  it decides where the Slinger stands for its stationary reload).*
- **Fire rate is not attack speed.** The Slinger's fire rate is its own stat (§10.2): no
  other class's attack-speed effect touches it unless the effect says so. *Decided
  (2026-10-14, Slinger dive).*
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
| Armor, charm | Shared bases, class lines. A base carries a defensive mechanic; its class line is fixed per recipe, so the same base does different things per class (Conduit armor shifts who tanks: the summons or the Conduit). Choosing a line at an upgrade step is a later option. **No shared base carries a recharging barrier:** a standing shield is the Spirit's storm (§11.10); timed wards stay (XC1, Spirit dive). **The Mountain and Tundra charm bases carry a timed ward instead of their barrier** (after a hit over a quarter of your HP / when the Chill freezes you, a ward absorbs part of the next blow for a few seconds; build decision 2026-10-15). **A retired biome's armor and charm lines move with its jobs on second bases:** the receiving biome gets a second armor and charm recipe carrying the moved lines for every class (2026-10-15). | Decided (shared bases) / Tentative (fixed lines) / Decided (no barrier on bases, 2026-10-14) / Decided (timed ward on Mountain and Tundra charms, second bases for moved lines, 2026-10-15) |
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

Known so far: Squire: §8.10 (the one class whose class system holds defense: guards are
responses paid in Resolve and refunded when they land; no Resolve shield; equipment
carries the baseline); Spirit: §11.10 (the storm is one bar, damage and shield, filled by
a constant flow and drained by hits and spending; armor lines change what it absorbs,
charm lines are flow lines bound to a state; the recharging barrier leaves shared bases
and its runtime becomes the storm, XC1); Striker: §12.10
(armor and charm lines plus T4 resilience leaves, nothing on finisher triggers; the brief's
finisher shield/heal is dropped); Conduit: §7.10 (who tanks is the armor line; rebuilds
cost HP; no default redirection). Flat
Recovery stays as the baseline. **Every class has a small always-on in-combat Recovery share;**
lines that say Recovery "doubles" or "triples" multiply it, and lines like the Squire's Old Guard
add to it (*Decided, 2026-10-15, build decision S4; the share is a placeholder*). Each class deep
dive fills in its own row.
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
the enemy hitting the back row). **Bonecrusher** (named Juggernaut until 2026-10-14, when
the name went to the Squire's discipline, §8.12), a summon whose damage scales off its HP,
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
12. Names are placeholders. The Cave heavy's T2 variant is **Bonecrusher** (2026-10-14):
    "Juggernaut" went to the Squire's discipline (§8.12).

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
| Cave | Eruptions from below | **Bonecrusher** (heavy): its hits scale off its own max HP (*Decided*) | Fewer, stronger summons, stronger | You tank, stronger | Dreadbore ranks up |
| Jungle (new) | Fleeing prey, ambushers from cover | **Bloomtender** (support): the first true healer; heals the most hurt ally, the Conduit included | **New job: First Strike:** each summon's first hit on a new target hits much harder | **New: Sentinel:** the first hit each enemy lands on the Conduit is taken by the nearest summon (anti-ambush) | New Soul (Dread-Gorger) |
| Desert (new) | Mark, slow, execute; ranged kiters | **Executioner** (ranged damage): marks its target; below a threshold its shots hit twice as hard (a threshold, not an on-kill) | **New job: Longshot:** ranged summons fire from much further back and hit harder at range; melee summons hit softer | **New: Sandveil:** ranged hits deal less to you and your summons (*Decided*; replaces Decoy, which was too narrow) | New Soul (Dune-Stalker Emperor) |

By the end of T2 the roster is 12 specialists plus the Thrall: 2 tanks (the Plains tank,
Ironhorn), 2 heavies (the Cave heavy, Bonecrusher), 5 damage dealers (the Forest bruiser,
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
Bonecrusher (damage), T3 Warhorn (support), T4 the Obsidian Tortoise (tank) and Avalanche
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

## 8. Squire — Locked (2026-10-14)

**Locked by the designer on 2026-10-14: build authority.** Every item the walk-through
reached was accepted; **Playtest** questions stay open (§8.15), and the flake check comes
first. Outside the lock, each for its own session: names (placeholders throughout),
leaves after T4 and the T7–T8 capstone, components (§4), farming efficiency (§13),
per-class stats (§5).

Written to the class template (§6) from the 2026-10-14 deep dive. Every call in order, the
reasoning and the ideas that were dropped are in
[squire-deep-dive-log-2026-10-14.md](../docs/briefs/squire-deep-dive-log-2026-10-14.md);
the prep is [squire-deep-dive-prep-2026-10-14.md](../docs/briefs/squire-deep-dive-prep-2026-10-14.md).
No mockup. Tags as everywhere in this bible; **Playtest** marks a question only the game can
answer (§8.15). Names are placeholders throughout.

**The designer's standing doubt:** of the six classes, this is the one the designer is
least convinced about; the risk is a class that flakes against enemies that don't hit back
much. The design answers it in several places (§8.2, §8.5, §8.7), and the first playtest
question is whether those answers hold (§8.15). *Decided (the doubt is on record).*

### 8.1 Fantasy

The shield that hits back: "I take the blows, and every one comes back as a slam", with
some of the guardian who reads the fight and answers what is coming. *Decided.*

### 8.2 Core mechanic

- **Resolve fills from three sources:** how hard you are hit (the raw hit, whatever your
  armor, into a capped bar; *Decided*); **defending properly**, a landed answer such as
  a guard catching a telegraph or a bash interrupting a wind-up (*Decided*); and a
  **pressure trickle**: every enemy engaged with you feeds a little each second, hit or
  not, a boss counting as several (*Decided*). Damage over time on you doesn't fill it;
  the Swamp trophy changes that (§8.9). *Decided.*
- **Resolve is one currency:** responses spend it, and the slam spends what is left.
  *Decided.*
- **The slam fires at a full bar.** Rules can hold it (don't waste it on a nearly dead
  target), never fire it early; the Relentless and Executioner's Oath trophies are the only
  early slams. A plain slam until the first boss kill. *Decided.*
- **Resolve never absorbs damage by itself;** only spending it through a response defends.
  That keeps it clear of the Spirit, whose energy is both damage and shield. *Decided.*
  Kept apart from the Striker's Momentum by source and moment: Momentum comes from the
  Striker's own swings and is spent at the end of its combo; Resolve comes from the enemy's
  hits and is spent in answer to them. *Decided (note).*
- **The cap is the guard against enemy tuning.** Today's Avenger path banked raw boss
  damage and grew 1.42–1.49× the median specialization when T4 boss offense was resized
  (cut 2026-09-28). Harder hits fill the bar faster; they never make a slam bigger without
  limit. *Decided (note).*
- **The framing:** plain swings carry easy trash; Resolve makes the Squire strongest when
  the fight is hardest. *Decided.* The heaviest chassis (slow hands, an iron body) stays
  in spirit; per-class stats are §5's question. *Decided.*
- **The budget is Resolve's size:** each Global Mastery step adds a pip, shown in class
  terms ("Resolve 6, next at Mastery 24"); you carry every response you own and the bar
  limits how often you answer. *Decided.* Illustrative: T1 4 → 5 at Mastery 15 → 6 at 30;
  later tiers in steps like Command's. *Decided (illustrative).*
- **HUD:** Resolve as pips (the old cooldown dial's successor), a pulse when an answer
  refunds. *Decided.* **Callouts** only for answers that land on a telegraph or cast
  ("GUARDED", "INTERRUPTED") and for the relic slam; ordinary ripostes never call out.
  *Decided.*

### 8.3 The class system: Response rules

**What you configure:**

- **The rules:** every response you own is carried and comes with its natural trigger and a
  default rule. Rules cost nothing (§3): add conditions (only on bosses, only with N pips in
  the bar, Bash only what can be interrupted), choose to **hold or step out** of each
  ground telegraph, and hold the slam. *Decided.*
- **The relic:** the slam's twist or a change to how Resolve flows (§8.9).

**How a response works** *(Decided)*:

1. It answers one specific enemy action (a telegraph, a cast, a debuff landing, control, a
   big hit), never a standing buff on a cooldown.
2. It costs Resolve and refunds more than it cost when it lands; a wasted one loses its
   cost. Good rules are profit and sloppy rules a drain: the automation produces power.
3. Guards catch telegraphs and big hits only; ordinary chip damage always lands and fills
   Resolve, so weak hitters stay relevant.
4. Nothing triggers on your hits or scales with attack speed.
5. Resolve never absorbs damage by itself (§8.2).

**Where the decisions are** *(Decided)*: Bash or Guard on a cast (a Bash that interrupts
refunds more and staggers but fails on an uninterruptible step; a Guard always works and
returns less); Parry or Guard on a melee telegraph (Avenger); spend now or save for the
slam; hold or step out of a ground telegraph (guard it and keep swinging, paying Resolve
and part of the damage, or walk out like every other class).

**Three families** *(Decided)*: **guards** (take it better), **counters** (hit back),
**holds** (move enemies). Each tier spreads its lessons across the three.

**Not in it** *(Decided)*: standing buffs; dodges (Sidestep and Disengage are dropped: the
Squire doesn't dodge); recovery skills (Second Wind and Recuperate go; Last Breath is the
one emergency answer, and it spends the whole bar); abilities outside the class system
(§3, confirmed for the Squire).

**Three editors, never the same** (§3): the Striker's Order is a short sequence authored
beat by beat, the Conduit's Formation a roster, the Squire's Response rules a list of "when
the enemy does X, I do Y". *Decided (note).* Default configuration: §8.13.

### 8.4 The T1 form

- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain sword and shield, Resolve 4 pips filling as you are hit (plus the trickle) and one
  default rule, bar full → slam. The Plains teaches Shove around minute 6 with its default
  rule (three or more enemies on me → Shove). The first boss is won with the base kit and
  gives Muster. By the end of T1 the Squire carries five responses, Resolve 4 → 6.
- **Each T1 biome's threat teaches its answer:** a response (that zone's level, before its
  boss), a weapon, an armor and a charm; its boss gives a trophy. *Decided.*
- **What each slot asks** *(Decided)*: the weapon, **"how do you hit back?"** (how heavy
  the plain swings are, how big the slam is, plus one job); the armor, **"what does the
  threat give you?"** (a shared base plus a Squire line that makes its biome's threat feed
  Resolve, or its answer cheaper or sturdier); the charm, **"what does an answer give
  back?"** (recovery paid when an answer lands: enemy-paced, so attack speed can't farm it).

| Biome | Threat | Response | Weapon | Armor (base + Squire line) | Charm | Trophy |
|---|---|---|---|---|---|---|
| Plains | swarms | **Shove:** when three or more enemies are on you, shove them all back a step with the shield (lands if it moves three or more) | **Flanged Mace:** the slam's circle is wider | Plating + **Rampart:** enemies you shoved deal less damage for a few seconds | **Breather:** each Shove that lands heals a little per enemy shoved | Tusked Razorback, **Muster** |
| Forest | fast packs | **Riposte:** the third hit one enemy lands on you, you strike it back at once (Brawler's counter on hit) | **Arming Sword:** quick, light swings; counters hit harder | Evasion + **Turn Aside:** a dodged hit fills Resolve as if it had landed | **Counterbalance:** after a Riposte, Recovery doubles for a few seconds | Gnarled Greatbear, **Relentless** |
| Swamp | attrition | **Steel Will:** when a poison or bleed lands, spend Resolve to shake it off | **Spiked Flail:** the slam leaves a bleed on everything it hits | DoT resistance + **Iron Gut:** Steel Will costs half | **Purifying Breath:** a poison or bleed you shake off heals you for part of the damage it had left | Grave Toadeater, **Rot-Eater** |
| Mountain | the hardest hits | **Guard:** brace against the telegraphed blow aimed at you; it deals much less and, caught, refunds (Brace's reactive window) | **Warhammer:** slow, heavy swings, a bigger slam; a slam soon after a caught telegraph hits much harder | Damage cap + **Planted:** while guarding you can't be knocked back or stunned | **Stone Patience:** after a caught telegraph, Recovery triples for a few seconds | Crag Behemoth, **Faultline** |
| Cave | elites, casters, corrosion | **Shield Bash:** when the enemy you fight starts a wind-up, bash it; the stun interrupts it | **Tower Shield:** you fight with the shield; lighter swings; Shield Bash costs half and stuns longer | Bulk + **Reforged:** stripped plating comes back faster, and each stack stripped fills Resolve | **Old Guard:** part of your Recovery stays on in combat (the old root's share) | Obsidian Broodmother, **Corrode** |

Responses, gear and trophies *Decided (direction; names and numbers open)*. Boots stay
generic (§4). Challenge, the old Taunt rune's successor, is the Desert's T2 lesson: every
Plains mob is melee, so solo a pull adds little, and pulling more at the Plains entry spike
makes it worse. *Decided.* The Toadeater, the Squire's worst T1 boss, meets three answers
before its fight (Steel Will, Iron Gut, Purifying Breath).

### 8.5 Disciplines (T2)

A considerable power step (§2). The base stays (Resolve from hits, answers and the trickle;
the slam at a full bar); each discipline tilts where Resolve comes from, how it is spent,
and unlocks one piece. They are the old frames' successors: Warrior → Avenger, Knight →
Bulwark, the old heavy frame (named Bulwark until now) → Juggernaut. *Decided.*

| | Avenger (light): the answer | Bulwark (balanced): the anchor | Juggernaut (heavy): the weapon |
|---|---|---|---|
| Fantasy | "I read every blow and answer it." | "Everything comes to me, and nothing gets past." | "My armor is my weapon." |
| Resolve | landed answers fill much more; plain hits less | every enemy on you counts more (its hits and its trickle) | a steady fill from armor and max HP, hit or not; hits fill less |
| Spending | a counter after every landed answer (a quick strike at the attacker, paid from Resolve); slams are rarer | slams that hold: everything hit turns on you; the circle grows with the enemies on you | one huge slam, the class's biggest hit |
| Piece | **Parry** (counter): a telegraphed melee blow aimed at you is negated and countered at once; costs more than Guard and fails on ground telegraphs and ranged shots | **Intercept** (hold): step in front of an ally under a telegraph or at low HP and take the blow | **Unbowed** (guard): when an untelegraphed blow over a quarter of your HP lands, spend Resolve to take it on your armor (plating counts twice) |
| Damage (illustrative) | ~40 counters / ~40 swings / ~20 slam | ~50 swings / ~50 slam | ~25 swings / ~75 slam |
| Look | a silver flash on every landed answer | a blue ward that thickens with each enemy held | iron glowing ember-orange as the bar fills; the slam lands as a crater |
| Weapons | Arming Sword, Tower Shield, Warhammer | Flanged Mace, Tower Shield, Bone Maul | Warhammer, Spiked Flail, Forge Hammer, Pressure Hammer |
| Best at | bosses, elites | packs, parties | farming and bosses alike: it never flakes |
| Weak at | trash without telegraphs (Plains, Forest) | low pressure (kiters, shells) | swarms (their hits are just damage to it) |

Concepts, pieces and tilts *Decided*; damage shares and looks *Decided, illustrative*.
**Guardrail on Juggernaut** (§1): its conversion runs one way, defense into damage, and an
item that converts never also carries above-curve defense. *Decided.* Juggernaut grows
mainly through gear, not lessons (its Resolve comes from bulk). *Decided.*

### 8.6 Specializations (T3)

**Ownership** *(Decided)*: responses own what each answer does; the relic owns the slam's
twist or the change to Resolve's flow; the discipline owns where Resolve comes from and how
it is spent; a specialization bends Resolve or the slam's delivery.

| Bulwark | Avenger | Juggernaut |
|---|---|---|
| **Reverb** (old Reverb): the slam lands, then rings out again at half strength a few seconds later | **Measure for Measure** (old Avenger, reshaped): every counter returns a capped share of what its answer prevented; the bigger the blow you caught, the harder you hit back | **Destroyer:** the slam becomes a charge; you crash into your next target from range |
| **Bastion:** each enemy on you adds a pip to the bar's cap, up to double; a boss counts as several | **Second Nature** (Warrior's tempo): for a few seconds after a counter lands, answers cost nothing | **Inexorable:** your bulk keeps filling the bar between fights and while you walk, so every fight opens with a slam |
| **Consecrate** (old Devout Priest): the slam becomes a 3 s channel; everything around you is struck again and again, and you can't be moved | **Sunderer:** counters ignore plating and crack shells | **Rampage** (old Assassin): each slam starts a burst of faster swings |

*Decided (concepts; names and numbers open).* Watch three against content-neutrality
(§12.6): Bastion leans to packs, Inexorable to farming, Sunderer to shells. Measure for
Measure grows with enemy damage, so it is capped (§8.2). *Decided (notes).*

### 8.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Squire's T4 asks **"what happens when you can't
answer?"**: the bar is empty when something comes, you paid for an answer that hit
nothing, or nothing is attacking you at all. The empty-bar column carries the melee
resilience the bible wants at T4; the quiet column answers the designer's doubt.
*Decided (names and numbers open).*

| | Empty bar | Wasted answer | Quiet |
|---|---|---|---|
| Avenger | **Last Word:** with an empty bar, Parry still fires once every so often, at no cost | **Read Again:** a wasted answer refunds half its cost, and your next answer of the same kind costs less | **Seize the Opening:** an enemy that hasn't attacked you for a few seconds is open; your next swing on it counts as a counter |
| Bulwark | **Second Line:** when the bar empties, it refills a pip for every enemy on you, once every so often | **No Wasted Effort:** a wasted answer's cost goes into the next slam instead of being lost | **Goad:** when nothing has hit you for a few seconds, a free Challenge pulls the nearest enemies onto you |
| Juggernaut | **Last Rampart:** with an empty bar, Unbowed still fires once every so often, at no cost | **Focused Weight:** a slam that hits only one enemy refunds a quarter of the bar | **Siege Engine:** while nothing has hit you for a few seconds, your swings hit harder |

Spare ideas for later leaf tiers *(Decided: kept as spares)*: Grudge (counters go to whoever hurt you
most); **response transformations** (Shove knocks down, Guard also covers an ally behind
you, Challenge pulls from twice as far); Overrun (a slam's damage beyond the kill carries
into the next enemy; close to on-kill, to review).

### 8.8 Responses, and where every piece comes from

| Piece | Comes from | Status |
|---|---|---|
| Responses | A zone's level teaches a lesson, before its boss, every tier: a new response, a **sidegrade** (the same idea in a new shape) or a **rank-up** (stronger, one visible twist per rank). Through T4: 16 new and 2 sidegrades | Decided |
| Response scaling | Every response scales with the Squire's tier, so a T1 favourite stays fieldable (as the Striker's techniques, §12.8) | Decided |
| Discipline pieces | Parry, Intercept, Unbowed: the T2 pick | Decided |
| Last Breath | Every Squire learns it with its T2 pick | Decided |
| Trophies | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| Resolve pips | Global Mastery steps | Decided |
| Specialization, leaves | The T3 pick; T4 onward | Decided |

**Every response through T4** *(Decided: names and numbers open)*:

| Response | Family | Answers | From |
|---|---|---|---|
| Shove | hold | three or more enemies on you | Plains T1 |
| Riposte | counter | the third hit one enemy lands on you | Forest T1 |
| Steel Will (II: also Corrosion and slows) | guard | a poison or bleed landing | Swamp T1 (II Swamp T2) |
| Guard (II: a second telegraph within a few seconds; III: staggers the attacker) | guard | a telegraphed blow at you | Mountain T1 (II T3, III T4) |
| Shield Bash | counter | an interruptible wind-up | Cave T1 |
| Stand Fast (sidegrade of Guard) | guard | a charge: it stops dead and the charger staggers | Plains T2 |
| Unshaken | guard | a stun, root or knockdown on you | Forest T2 |
| Splitting Blow (II: breaks Ice Armor in one blow) | counter | a shield or barrier raised: a blow that hits barriers double | Mountain T2 (II Tundra T4) |
| Earthstamp (II: knocks down everything around) | hold | a burrow or unseen dash: it surfaces at your feet, staggered | Cave T2 (II Cave T3) |
| Watchful (II: the ambusher is staggered) | guard | an ambusher's first hit: caught on the shield, at no cost, fills Resolve | Jungle T2 (II Jungle T4) |
| Challenge (II: the pulled enemy can't move away for a moment) | hold | ranged and kiting enemies, or enemies on an ally: pulled onto you | Desert T2 (II Desert T3) |
| Anchor (II: even into a hazard) | guard | a drag or push: you don't move, and it fills Resolve | Swamp T3 (II Volcanic T4) |
| Chain Hook | hold | a fleeing enemy: hooked and dragged back | Jungle T3 |
| Frostward | guard | the Chill at its threshold: held there a few seconds, no freeze | Tundra T3 |
| Backdraft | counter | a fire attack or burning shot: the heat thrown back at its source | Volcanic T3 |
| Disarm (sidegrade of Shield Bash) | counter | a big attack starting: it lands at half; not a stun, so it works on bosses that accept no control | Desert T4 |
| Lay to Rest | hold | a fallen enemy rising near you: struck down before it stands | Wasteland T4 |
| Lie in Wait | counter | a dive out of reach: the held slam lands double when it resurfaces | Trench T4 |
| Parry | counter | a telegraphed melee blow: negated and countered | Avenger |
| Intercept | hold | an ally under a telegraph or at low HP | Bulwark |
| Unbowed | guard | an untelegraphed blow over a quarter of your HP | Juggernaut |
| Last Breath | — | low HP: spend the whole bar to heal | every Squire (§8.10) |

Families through T4: guards 8, counters 7, holds 6 (discipline pieces included). Costs and
refunds are numbers for the bots; illustratively a guard or hold costs 1 pip, Parry and
Intercept 2, and a landed answer refunds about double. *Decided (illustrative).*

### 8.9 Items

| Slot | The Squire's version | Status |
|---|---|---|
| Weapon | **"How do you hit back?"**: how heavy the plain swings are, how big the slam is, plus one job. A job follows you up: every tier has a stronger recipe for each job you know; new biomes add jobs; a retiring biome's jobs move to a biome of the next tier | Decided |
| Relic | The boss trophy. **Slam relics** change what the slam does; **Resolve relics** change how you gain or spend Resolve. One twist each, no per-discipline versions; relics never grant or change responses (zones teach responses, bosses give trophies) | Decided |
| Armor | A shared base plus a Squire line: **"what does the threat give you?"** | Decided |
| Charm | A shared recovery base plus a Squire line: **"what does an answer give back?"** | Decided |
| Boots | Generic | Proposed (§4) |
| Components | §4's own session | Under review |

**The eleven trophies** *(Decided: concepts; names and numbers open)*:

| Lineage | Trophy (kind) | Twist | Ranks |
|---|---|---|---|
| Plains (T1–2) | **Muster** (Resolve, gain) | every enemy that joins the fight against you fills a chunk of Resolve, hit or not | II: a rally's whole wave fills double |
| Forest (T1–2) | **Relentless** (Resolve, spend) | the slam fires at a third of the bar, a third the size; each one fired soon after the last is a bit bigger | II: the chain ramps faster |
| Swamp (T1–3) | **Rot-Eater** (Resolve, gain) | poison and bleed ticks on you fill Resolve as if they were hits | II: every debuff landing on you also fills; III: the last rank |
| Mountain (T1–4) | **Faultline** (slam) | the slam runs as a shockwave down a line through the target and everything behind it, reaching the ranged enemies | II: hits barriers double; III: a longer line; IV: aftershocks along it |
| Cave (T1–3) | **Corrode** (slam) | each slam strips plating from what it hits, stacking (the plating strip moved here from the old heavy frame) | II: a higher stack cap; III: the last rank |
| Jungle (T2–4) | **Strangler Vine** (slam) | the slam pulls every enemy in a wide ring to you before it lands, fleeing ones included | II: a wider ring; III |
| Desert (T2–4) | **Executioner's Oath** (Resolve, spend) | the slam can fire early on an enemy below a third of its HP, with whatever Resolve you have | II: a higher threshold; III |
| Tundra (T3–4) | **Deep Winter** (Resolve, spend) | the bar can fill past full, up to double; an overfull slam hits as hard as two | II: up to triple |
| Volcanic (T3–4) | **Kindling** (Resolve, gain) | every gain fills a bit more for each 10 s the fight has lasted | II |
| Wasteland (T4) | **Charnel Ring** (slam) | the slam's circle widens with every enemy in the fight | — |
| Trench (T4) | **Undertow** (slam) | for a few seconds after the slam, the target can't dive, burrow or flee | — |

Six Resolve relics, five slam relics. Juggernaut leans to slam relics; Avenger and Bulwark
to Resolve relics. A retired lineage's trophy keeps working and scaling; it only stops
ranking up. The armor and charm lines by tier are in §8.4 and §8.16.

### 8.10 Defense and recovery

- **The Squire is the one class whose class system holds defense:** the brief sets Resolve
  as its defense answer, and its guards are responses. Equipment still carries the
  baseline (the shared armor and charm bases). *Decided.*
- **The response rules** (§8.3) are its defensive rules: one specific enemy action each,
  paid in Resolve and refunded when they land; chip damage always lands; nothing on your
  hits or on attack speed; no Resolve shield. *Decided.*
- **The old root's in-combat Recovery share** moves to the Cave charm line, Old Guard.
  *Decided.*
- **Last Breath:** at low HP, spend the whole bar to heal. Kept with a flag: the Striker
  dive found Second Wind unhealthy; here it costs your slam. *Decided / Playtest.*
- **The measured weak spots and their answers:** attrition, the Toadeater (Steel Will,
  Iron Gut, Purifying Breath, then Rot-Eater) *Decided*; the Plains entry spike (Shove,
  Rampart, Breather; the bar fills fast in a swarm) *Decided (bots to check)*; enemies
  that don't hit back (the trickle, Juggernaut and Inexorable, the quiet leaves) *Decided
  / Playtest*.

### 8.11 Stance-like modes, rite-like passives

None. Hold-or-step-out is a rule, not a stance; the bar and the responses are the class's
states. *Decided.*

### 8.12 Party role

The party's tank. It holds enemies (Challenge, Bulwark's slams that hold, Goad), breaks
what threatens the party (Shield Bash and Disarm stop big attacks, Splitting Blow breaks
barriers, Corrode strips plating), and with Bulwark takes blows meant for allies
(Intercept). No buffs for allies and no Bulwark aura. An intercepted blow is a hit on you
that lands an answer, so a party keeps the Squire's bar full. *Decided.*

- **Taunts lock and players come first:** a taunt holds for its whole duration and nobody
  can take the enemy until it ends; a player's taunt outranks a summon's, so a Squire can
  take an enemy from a Conduit's tank summon, never the reverse. The natural split: the
  Squire holds the boss, the Conduit's tanks hold the adds. *Decided.*
- **The same debuff from two Squires doesn't stack;** the strongest copy applies (§7.12,
  §12.12). *Decided.*
- **"Juggernaut" is the Squire's:** the Conduit's Cave T2 summon is renamed **Bonecrusher**
  (a name change doesn't reopen §7); the Stoneplate Juggernaut boss keeps its name.
  *Decided.*

### 8.13 Bot plan

*Decided (accepted at the lock; defaults and test arms tuned by the bots).* Bots can't press buttons; every lever is a setting the harness writes.

- **Harness intents:** set the response rules (conditions, hold or step out, holding the
  slam); equip the relic. The Taunt and Ready Execution runes and the shared guards go.
- **Defaults:** T1: bar full → slam; each response on its natural trigger as it is learned
  (Shove on three or more; Guard on a telegraph at you; Shield Bash on an interruptible
  cast, Guard otherwise; Steel Will on a poison or bleed; Riposte always on). Avenger: Parry
  the melee telegraphs, Guard the rest, Bash what can be interrupted, a Resolve relic.
  Bulwark: Shove and Challenge early, hold the slam until three or more enemies stand in
  its circle, a Resolve relic. Juggernaut: Unbowed on big hits, hold the slam only on a
  nearly dead target, a slam relic.
- **Metrics:** Resolve gained by source (hits, answers, trickle, bulk), answers landed and
  wasted, slams per minute, time to kill, deaths, HP lows (the Plains entry spike, the
  Toadeater), the share of time with an empty bar.
- **Test arms the design already asks for:** **the flake check** (the Squire's time to kill
  on easy trash, kiters and shells against the other classes); the trickle's size; the
  refund ratio; Juggernaut's bulk fill against farming speed; Measure for Measure's cap;
  Last Breath; Relentless against full slams; Bastion, Inexorable and Sunderer against
  content-neutrality.

### 8.14 Salvage

| Keep | Where |
|---|---|
| The empowered-attack machinery (arm the big hit, its multiplier) for the slam | `server/src/systems/classes/archetypes/cooldown/cooldownPrototype.ts`, `combat/engine/empoweredAttacks.ts` |
| The frame loop's bank (Juggernaut's huge slam, Deep Winter's overfill) | `cooldown/frameLoop.ts`, `classes/shared/frameLoop` |
| The raw incoming hit on `onDamageTaken` (`ctx.metadata.incomingGross`) and Avenger's tracking: Resolve from hits, Measure for Measure's prevented share | `cooldown/t3/ticks/cooldownState.ts` |
| Old path mechanics: Reverb's echo (Reverb), Devout Priest's channel (Consecrate), Assassin's burst (Rampage), Sunderer's plating bypass (Sunderer); Destroyer's charge uses the player charge (the Striker's salvage) | `cooldown/t3/` |
| Taunt (Challenge, Goad, Bulwark's slams), plus the new lock and player priority | `server/src/systems/combat/ai/taunt.ts`, `monsterTargeting.ts` |
| The monster wind-up interrupt (Shield Bash, Earthstamp, Stand Fast), uninterruptible steps, boss patterns ending as interrupted or staggered | `combat/engine/monsterMechanics.ts`, `combat.ts`, `ai/bossPatterns.ts` |
| Rune conditions as triggers: an enemy casting at you, standing in a telegraph, melee contact, three or more on you, a debuff, three debuffs, controlled, a boss escaping, a shielded target, in a party, HP below 25% | `shared/src/runeDatabase.ts` |
| Guard buffs' plumbing (buff-bar identities, the multiplicative 90% cap) | [abilities-current-state.md](../docs/abilities-current-state.md) |
| Callouts | `client/src/render/skillCallouts.ts` |
| The `squireSlam` effect, bespoke `fx/bespoke/squire.ts`, the brace pose, the mechanic flash; the cooldown dial becomes the Resolve pips | the client's fx |
| Squire bodies through T3 (iron great helm, plate and tabard; mobile → knight → fortress) | the atlases |
| The Passive Tree's panel, unlock gate, reset and layers | §2 |

| Remove or rework | Why |
|---|---|
| The 7 s execution clock | Resolve |
| Frames, range nodes and the nine paths as data | Disciplines and specializations |
| The root's in-combat Recovery share | The Old Guard charm line |
| Shared guards (Brace, Endure, Bramble Guard, Sidestep, Break Free, Cleanse, Second Wind, Recuperate); the Taunt and Ready Execution runes | Squire responses (§3) |
| Destroyer's delivery by Techniques | Techniques are the Striker's |
| Stalwart and Transcendant | Dropped (Stalwart was a T4 outlier) |

**Build tasks** *(Decided)*: triggers the rune engine lacks (an ally low or under a
telegraph, an enemy joining the fight, a fallen enemy rising, a dive out of reach, a drag
or push, the Chill at its threshold, a fire attack); "landed" detection per response (the
refund); the taunt lock and player priority; damage over time kept out of the base fill;
Parry's negate and Disarm's halving of a boss attack.

### 8.15 Open questions

**Playtest:**

1. **The flake check:** does the Squire flake against enemies that don't hit back (easy
   trash, kiters, shells)? The designer's main doubt; measure it first.
2. Every number: the trickle, the pips, response costs and refunds, the discipline tilts,
   Resolve per hit.
3. Last Breath's health.
4. The Avenger warning: Resolve from raw hits and Measure for Measure grow with enemy
   damage; the cap must hold.
5. Avenger in telegraph-poor content (Plains and Forest trash).
6. Bastion, Inexorable and Sunderer against content-neutrality.

**Design, later:**

7. Names: placeholders throughout (the Conduit's Cave T2 summon is now Bonecrusher;
   Juggernaut is the Squire's).
8. Leaves after T4 (spare theme: response transformations) and the T7–T8 capstone.
9. Components (§4), farming efficiency (§13), per-class stats (§5).

**Collisions, as settled** *(Decided, notes)*: Resolve and the Spirit (no Resolve shield);
Resolve and the Striker's Momentum (source and moment, §8.2); countering and the Striker's
reactive pieces (Read the Blow is passive mitigation, the Striker's control techniques sit
in a sequence; the Squire's answers are reactive, cost Resolve and refund); holding on
(Last Word and Last Rampart fire a free answer when you can't pay, never cheat-death, which
is the Striker's Unbreakable); thorns stays the Conduit's Bramble (the Squire's retaliation
is a counter, Riposte); redirection (Intercept between players is the Squire's; the
Conduit's gear lines between a Conduit and its summons).

### 8.16 Tier by tier: what each biome gives the Squire

T1 is §8.4. Every later tier, each biome teaches a lesson (§8.8: a new response, a
sidegrade or a rank-up), has a weapon, an armor and a charm recipe (its jobs, stronger),
and its boss gives a trophy or ranks one up. **Jobs move when a biome retires:** after T2
the Forest's (Arming Sword, Turn Aside, Counterbalance) to the Jungle and the Plains'
(Flanged Mace, Rampart, Breather) to the Volcanic; after T3 the Swamp's (Spiked Flail, Iron
Gut, Purifying Breath) to the Wasteland and the Cave's (Tower Shield, Reforged, Old Guard)
to the Trench. *Decided on paper, to judge in the game; names and numbers open.*

**T2** (the disciplines arrive at the same tier)

| Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Plains | stampedes | **Stand Fast** (guard, sidegrade of Guard) | — | Gorging Razortusk: Muster II |
| Forest | cadence duel, stuns | **Unshaken** (guard, new) | — | Apex Timberclaw: Relentless II |
| Mountain | heavy plating, the breakable barrier, charges | **Splitting Blow** (counter, new) | — | Stoneplate Juggernaut: Faultline II |
| Swamp | pools, rain, the rising mire; Corrosion | **Steel Will II** (guard, rank-up) | — | Mire-Gorged Behemoth: Rot-Eater II |
| Cave | eruptions from below | **Earthstamp** (hold, new) | — | Chitinous Dreadbore: Corrode II |
| Jungle (new) | fleeing prey, ambushers from cover | **Watchful** (guard, new) | Weapon **Hooked Glaive:** longer reach; the slam hooks fleeing enemies back into its ring. Armor: anti-ambush base + **Unflinching:** an ambush can't stun or knock you down. Charm **Watchman's Ease:** an ambush Watchful catches heals you for the hit it stopped | Jungle Dread-Gorger, **Strangler Vine** |
| Desert (new) | mark, slow, execute; ranged kiters | **Challenge** (hold, new; moved from the Plains) | Weapon **Throwing Shield:** when your target is out of reach, your swing throws the shield instead (lighter). Armor: ranged-hit base + **Arrow Catcher:** ranged hits on you fill double Resolve. Charm **Called Out:** each enemy a Challenge pulls heals you a little | Dune-Stalker Emperor, **Executioner's Oath** |

How the T2 bosses test the Squire: the Jungle boss's Escape Guard is a barrier Splitting
Blow breaks, its ambush what Watchful catches; the Desert boss's mark is what Steel Will
shakes off and its Execution what Guard catches; the Forest's stuns are Unshaken's. Stand
Fast is the same lesson as the Conduit's Ironhorn (a theme crossing, §3).

**T3** (the Plains and Forest have retired)

| Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain | the double charge | **Guard II** (guard, rank-up) | — | Crag-Gorged Horn-Behemoth: Faultline III |
| Cave | the tunnel chase | **Earthstamp II** (hold, rank-up) | — | Deep-Core Burrow-Gorger: Corrode III |
| Swamp (last tier) | spores, detonating pools, the drag | **Anchor** (guard, new) | — | Rot-Spore Croc-Behemoth: Rot-Eater III |
| Jungle (+ the Forest's jobs) | pursuit, flight | **Chain Hook** (hold, new) | The Forest's jobs | Apex Bramble-Slasher: Strangler Vine II |
| Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Challenge II** (hold, rank-up) | — | Dune-Carapace Monarch: Executioner's Oath II |
| Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Frostward** (guard, new) | Weapon **Glacier Mace:** the slam leaves frozen ground that slows enemies on it. Armor: chill base + **Frozen Resolve:** the Chill building on you fills Resolve. Charm **Hearth:** while Frostward holds, you heal a little each second | Frost-Plated Rime-Mammoth, **Deep Winter** |
| Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, Obsidian shells, hound swarms, burning gunners | **Backdraft** (counter, new) | Weapon **Forge Hammer:** each step of the fight's Heat makes the slam bigger. Armor: heat base + **Stoked:** the Heat's extra damage on you fills extra Resolve. Charm **Cooling Breath:** each Backdraft that lands heals you a little | Cinder-Shell Magma-Salamander, **Kindling** |

**T4** (the Swamp and Cave have retired)

| Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain (last tier) | Earthshatter, delayed fault lines | **Guard III** (guard, rank-up) | — | Iron-Crest Titan: Faultline IV |
| Tundra | Ice Armor at its heaviest | **Splitting Blow II** (counter, rank-up) | — | Glacial Patriarch: Deep Winter II |
| Jungle | hard to catch, then it commits | **Watchful II** (guard, rank-up) | — | Verdant-Crown Predator: Strangler Vine III |
| Desert | three acts: melee, kiter, cornered | **Disarm** (counter, sidegrade of Shield Bash) | — | Dune-Throne Sovereign: Executioner's Oath III |
| Volcanic | the Heat race, Magma Shove | **Anchor II** (guard, rank-up) | — | Caldera Sovereign: Kindling II |
| Wasteland (new; + the Swamp's jobs) | the dead rise; area matters | **Lay to Rest** (hold, new) | Weapon **Bone Maul:** the slam hits harder for every enemy in its circle. Armor: base (risen enemies hit softer) + **Grave Plate:** risen enemies' hits fill double Resolve. Charm **Rest Eternal:** each Lay to Rest that lands heals you a little | Charnel-Crown Sovereign, **Charnel Ring** |
| Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Lie in Wait** (counter, new) | Weapon **Pressure Hammer:** the slam hits harder for each different debuff on you. Armor: debuff-resistance base + **Abyssal Plate:** while you carry three or more debuffs, guards cost nothing. Charm **Brine Will:** each debuff you shake off raises Recovery for a few seconds, stacking | Elder Trench Serpent, **Undertow** |

How T3 and T4 test the Squire: the Tundra and Volcanic bosses accept no control, so Shield
Bash, Earthstamp and Stand Fast's stagger do nothing there and Guard, Splitting Blow,
Frostward and Backdraft carry (Disarm is the T4 answer that isn't a stun); the Heat makes
every hit bigger, so more Resolve as well as more damage (the Squire likes the Volcanic);
Deep Winter and Kindling are the Final Eruption's tools; Steel Will, Abyssal Plate and Brine
Will answer the Trench's debuff pile, Lie in Wait and Undertow its dives.

**Totals through T4:** 16 new lessons and 2 sidegrades plus 8 rank-ups; with the three
discipline pieces, guards 8, counters 7, holds 6. Eleven trophies: six Resolve relics, five
slam relics.

## 9. Apprentice — Locked (2026-10-14)

**Locked by the designer on 2026-10-14: build authority.** Every proposal the walk-through
reached was accepted; items still tagged *Proposed* are notes or wait on another section
(§4's boots; the cross-class proposals XC1 and XC2 in the log) and may change without
reopening this one; **Playtest** questions stay open (§9.15), and whether the Apprentice is
still the slowest farmer comes first. Outside the lock, each for its own session: names
(placeholders throughout), the second element and reactions (T5–T6, §13), leaves after T4
and the T7–T8 capstone, components and rule-benders (§4), farming efficiency (§13),
per-class stats (§5). The lock archives nothing: no design doc is the Apprentice's alone,
and `docs/dot-systems-current-state.md` and `docs/frames-current-state.md` stay the code's
truth until the build replaces them.

Written to the class template (§6) from the 2026-10-14 deep dive, run in parallel with the
Slinger and Spirit dives. Every call in order, the reasoning and the ideas that were dropped
are in [apprentice-deep-dive-log-2026-10-14.md](../docs/briefs/apprentice-deep-dive-log-2026-10-14.md);
the prep is [apprentice-deep-dive-prep-2026-10-14.md](../docs/briefs/apprentice-deep-dive-prep-2026-10-14.md).
No mockup. Tags as everywhere in this bible; **Playtest** marks a question only the game can
answer (§9.15). Names are placeholders throughout.

**The main risks, on record:** the Apprentice is the slowest class through T1 in every bot
tutorial sweep (69–77 min against 47–68), suspected to be damage still owed on trash that
dies first; it leaned on Second Wind (without it, the Razorback went from 100% to 3%); and
its payoffs are the explosive numbers (one 5× Detonate made T4 Apprentice specs 2–3× the
tier median; Contagion's copies multiply). The answers: Detonate from minute one and
Poison's no-waste (§9.2), Siphon (§9.10), and caps on every chain (§9.5). *Decided (the
risks are on record).*

### 9.1 Fantasy

The student of three schools who masters one, and the chain reaction: "one spark and the
whole pack goes up." The arc lives in the kit: raw magic at T1, an element at T2, and the
basics of every school kept. *Decided.*

### 9.2 Core mechanic

- **Sigils:** the Apprentice's hits lay sigils on the enemy (placeholder name; not "Hex",
  which the T4 Charnel-Crown boss casts). Sigils tick as damage over time under the usual
  rules (they skip plating, pay half of DR, meet monster DoT resistance; a full evade blocks
  them). *Decided.*
- **Raw magic at T1, an element at T2:** one neutral kind of sigil, violet, until the
  discipline gives the sigils its element and colour (§9.5). *Decided.*
- **The weapon sets how sigils build** (the fix for the DoT-weapon trap, where attack
  conversion made slow, heavy weapons strictly better): sigil damage comes from the
  weapon's potency and the Apprentice's tier, never from the hit; fast weapons fill and
  spread (breadth), heavy weapons lay more sigils per hit and hit harder directly (depth),
  so neither wins at the cap. Direct hits still deal the weapon's damage. *Decided.*
- **The front-loaded stack curve goes:** sigils tick linearly. Short fights are answered
  by payoffs (Detonate from minute one) and by Poison's no-waste rule, not by a hidden
  curve. *Decided.*
- **Payoffs spend sigils at moments** (§9.3). Detonate is the starting payoff; a plain
  payoff set until the first boss kill, which the base kit must win (no starter trophy, as
  every class). *Decided.*
- **The budget is the sigil cap:** Global Mastery's steps raise how many sigils every enemy
  can hold, so every payoff grows with it. Shown in class terms ("Sigils 5, next at Mastery
  24"). The one class whose room shows on the enemies. *Decided.* Illustrative: 4 at the
  start, 5 at Mastery 15, 6 at Mastery 30. *Decided (illustrative; bots tune it).*
- **No resource on the Apprentice itself:** its state lives on the enemies. *Decided.*
- **One range for all:** every Apprentice fights at the class's reach; the discipline
  changes what sigils do, not where you stand (the Spirit's disciplines move it). *Decided.*
  Base reach: today's Apprentice reach. *Decided.*
- **HUD:** sigils as pips in a ring at the enemy's feet, coloured by the element, the ring
  sized by the cap; "Sigils N" in class terms. **Callouts** only for the trophy's payoff
  (by name) and the discipline's signature moments (a chain of three or more, a Shatter);
  plain ticks and spreads never call out. *Decided.*

### 9.3 The class system: Payoff rules

**What you configure** *(Decided)*:

- **Moments on the enemy:** an enemy card with its sigil ring and the moments around it:
  **full, winds up, low, shell up, frozen, dies, out of reach** (the seventh added by Seep,
  §9.16). You drop a payoff on a moment and may add a condition ("only with three or more
  enemies near", "only when my HP is low", "only on an elite"). Rules are free (§3). A
  moment shows on the card only once you own a lesson that uses it, so a fresh character
  sees only "full"; "winds up" arrives with Seize, "out of reach" with Seep. *Decided (the
  list open to additions).*
- **The relic:** a payoff relic or a sigil relic (§9.9).

**Not in it** *(Decided)*: abilities outside the class system (§3, confirmed for the
Apprentice: Contagion, Detonate and Imbue become payoffs or go), and defense beyond Siphon
(equipment and leaves, §9.10).

**Never the same editor** (§3): the Payoff rules read **the enemy's state** (its sigils,
frozen, low, casting, shelled, out of reach); the Spirit's Thresholds read its own gauge;
the Squire's Response rules answer enemy actions aimed at the Squire; the Order is a
sequence; the Loadout picks ammunition at the reload. *Decided.*

**Ownership** *(Decided)*: the payoffs (lessons) own what happens at each moment; the
weapon owns how sigils build; the relic twists one payoff or the sigils; the discipline
owns the element and its signature; a specialization bends the signature or the chain's
delivery (where, when, who it reaches), never what a payoff does; leaves are small turns on
all of it. **Lessons are payoffs:** everything a lesson does happens at a moment; how
sigils behave between moments belongs to the weapon and to sigil relics. *Decided.*

**The decisions live in the rules:** at full sigils, spread or detonate; on a boss, let the
sigils tick or cash in when its shell goes up; spend frost on a wind-up or save it for the
shatter. *Decided.* Default configuration: §9.13.

### 9.4 The T1 form

- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain wand, Sigils 4 shown as pips on enemies, and one moment filled (full → Detonate).
  The Plains teaches Spread around minute 6 with its default (full and two or more enemies
  near → Spread, otherwise Detonate): the first real choice, and the answer to the Plains
  entry spike playtest 3 measured (15 of 177 HP). The first boss is won with the base kit
  and gives the first trophy. By the end of T1 the Apprentice owns six payoffs.
- **Each T1 biome's threat hands you its answer:** a lesson (that zone's level, before its
  boss), a weapon, an armor and a charm; its boss gives a trophy. **T1 seeds every school
  twice:** Fire (Detonate, Converge), Frost (Numb, Seize), Poison (Spread, Siphon).
  *Decided.* The gear slots' questions (§9.9): the weapon **"how do your sigils build?"**,
  the armor **"what buys you the time?"**, the charm **"what does the affliction give
  back?"**.

| Biome | Threat | Lesson (school) | Weapon | Armor (shared base + Apprentice line) | Charm (Apprentice line) | Trophy |
|---|---|---|---|---|---|---|
| Plains | swarms | **Spread** (Poison): a full target passes a sigil to its nearest neighbour every second | **Branching Wand:** fast, light; each hit also lays a sigil on the nearest other enemy | Plating + **Warding Sigils:** each enemy carrying your sigils deals a little less damage to you (capped) | **Feeding Swarm:** Recovery rises a little for each enemy carrying your sigils (capped) | Tusked Razorback, **Outbreak** (payoff): a Spread passes to two neighbours |
| Forest | fast packs; the Greatbear's attack-speed race | **Numb** (Frost): spend a target's sigils to slow its attacks and movement for a few seconds, longer the more it carried | **Thornwood Rod:** fast; sigils tick twice as fast for half as long | Evasion + **Give Ground:** while an enemy carrying your sigils is in melee reach, you move faster | **Numbing Calm:** while two or more enemies near you are numbed, Recovery doubles | Gnarled Greatbear, **Firstbrand** (sigil): the first hit on an enemy carrying none of your sigils lays three |
| Swamp | attrition | **Siphon** (Poison): spend a target's sigils to heal yourself; a cooldown | **Bog Censer:** slow; sigils linger long after you stop; Siphon heals more | DoT resistance + **Bitter Blood:** poison and bleed on you tick slower | **Bitter Tonic:** Siphon heals more and comes back sooner | Grave Toadeater, **Glut** (payoff): Siphon also drains every enemy near the target |
| Mountain | the hardest hits, telegraphed | **Seize** (Frost): spend a target's sigils to hold it for a moment, breaking its wind-up | **Runestone Staff:** slow, heavy; three sigils per hit and +1 to the cap (the brief's Frostbrand Staff) | Damage cap + **Stone Sigil:** part of a hit over a quarter of your HP arrives as damage over time instead (today's root mechanic) | **Still Mind:** after a Seize breaks a wind-up, Recovery triples for a few seconds | Crag Behemoth, **Petrify** (payoff): a Seize lasts longer and the held enemy takes more damage |
| Cave | elites, casters | **Converge** (Fire): pull the sigils of every enemy near the target onto it, past its cap | **Deep Grimoire:** payoffs pay more; sigils tick a bit weaker | Bulk + **Sigil Weight:** a winding-up enemy's blow is weaker for each sigil it carries (up to a third) | **Long Draw:** while an elite or boss carries a full bar of your sigils, Recovery rises | Obsidian Broodmother, **Brood Sigils** (sigil): an enemy carrying three or more of your sigils grows one more every 2 s |

Concepts *Decided*; names and numbers open. The measured weak spots each get three answers:
the Greatbear's race (Numb, Firstbrand, Numbing Calm), the Toadeater's attrition (Siphon,
Bitter Blood, Bitter Tonic), the Behemoth's one big blow (Seize, Sigil Weight, Still Mind;
its Crag Charge cast carries no `uninterruptible` flag, so Seize can break it). Seize is a
theme crossing with the Squire's Shield Bash (§3): it spends the sigils you built and works
from range. *Decided.*

### 9.5 Disciplines (T2)

A considerable power step (§2). The base kit stays (sigils, moments, the six T1 payoffs, the
cap as budget); each discipline gives the sigils an element, turns its school's T1 lesson
into the **signature**, keeps every other lesson working on the new element ("master one,
keep the basics"), and unlocks one piece that covers its weak content. Every discipline has
its own **chain reaction**; each enemy goes off at most once per chain. *Decided.*

| | Poison: the plague | Fire: the blast | Frost: the freeze |
|---|---|---|---|
| Fantasy | "I touch one, and the whole pack is already dying." | "One spark, and they go up one after another." | "I lock the giant in ice, then break it." |
| Sigils become | Small and many: the cap holds 2 more, ticks fast (Venom vessel) | Burn: hits into a full-burn target strike harder (Ember mage) | Few and heavy: the cap holds 1 fewer; each sigil slows a little (Rime-Bound) |
| Signature | **The walking plague:** Spread stops being a payoff and happens on its own (a full target passes a sigil each second; a dying one passes on what it still carried, adding no damage), freeing the "full" moment | **Chain Detonate:** a detonation throws burn onto every enemy around it; any pushed to full goes off too | **Freeze:** Seize becomes a real freeze; on a boss that accepts no control it makes the boss **Brittle** for a few seconds (no stop, more damage taken, still shatterable). A Detonate on a frozen or brittle target **Shatters**: a heavy hit whose cold chills its neighbours |
| Chain | creeps: the plague walks through the pack | blasts: detonations set off their neighbours | spreads cold: a shatter chills the next one |
| New piece | **Wither:** spend a target's sigils so it deals less damage for a few seconds (the boss floor) | **Fuse:** the target's sigils blow in 3 s, and everything laid meanwhile adds to the blast (shells, lone elites) | **Cold Snap:** spend a target's sigils to chill every enemy around it (the pack answer) |
| Damage, ticks / hits / payoffs | ~60 / 20 / 20 | ~30 / 20 / 50 | ~30 / 25 / 45 |
| Look | green motes creeping enemy to enemy | orange sigils that flare, then blow in sequence | pale frost creeping over the body; an ice shell; shards on the shatter |
| Weapons | Branching Wand, Thornwood Rod, Bog Censer | Deep Grimoire, Runestone Staff | Runestone Staff, Bog Censer |
| Best at / weak at | packs, farming / bosses alone, burst races (the Final Eruption), DoT-resistant families | clumped packs, elites, shells / spread-out kiters, long single-target fights between blasts | bosses, elites / swarms (one freeze at a time), its slower ramp |

Concepts and rules *Decided*; the cap shifts, damage shares and looks *Decided
(illustrative)*. The walking plague's pass-on at death is argued as no on-kill effect, since
it adds no damage (cross-class proposal XC1 in the log, for §1). Not taken: chains for Fire
only, losing the other schools' lessons at T2, Poison closer and Frost further. Note
*(Proposed)*: Fire's chain and Poison's plague both reach across packs; they stay apart by
speed and cost (the plague creeps for free, the chain spends sigils at once).

### 9.6 Specializations (T3)

Each bends its discipline's signature or the chain's delivery, never what a payoff does
(§9.3). Concepts *Decided*; names and numbers open.

| Poison (the plague) | Fire (the blast) | Frost (the freeze) |
|---|---|---|
| **Carrier:** the plague also walks from you: every enemy near you catches a sigil each second (where) | **Afterburn:** a detonation leaves half its sigils burning on the target, so the next blast comes sooner (what's left) | **Ice Tomb** (old Winter Warden): a frozen target stays frozen until you shatter it (up to ~6 s); a Brittle boss stays brittle until shattered, capped (when) |
| **Ripening** (old Cultist, reshaped): sigils darken as they age; one older than ~5 s ticks double; the walking plague passes on its ripest sigil (how the plague grows) | **Long Fuse:** every detonation waits 2 s and grows with everything laid meanwhile; the chain carries the extra (when) | **Creeping Frost:** a target reaching the cap freezes on its own, once every ~8 s per target; the freeze comes from the sigils, freeing the "winds up" moment (how the freeze arrives) |
| **Wasting:** Wither's weakening stays on any enemy carrying a full bar, so plagued packs and bosses hit softer (the plague as a defense) | **Hair Trigger:** the chain sets off any enemy carrying sigils, not only those it pushes to full; each pays what it carries (who it reaches) | **Shardstorm:** a shatter's shards fly to the 3 nearest enemies, laying frost sigils; a frozen one hit by a shard shatters too, once per chain (who it reaches) |

Notes *(Proposed)*: Hair Trigger and Shardstorm lean to packs and Ice Tomb to bosses (watch
them against content-neutrality, as §8 notes for Bastion and Inexorable); the other six
work in both. Ripening is the board's only ramp, visible and per sigil. Shardstorm and Hair
Trigger multiply: the bots watch them with the once-per-chain cap.

### 9.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Apprentice's T4 asks **"what reaches you?"**:
whatever gets past a ranged class's distance (the charger, the ambusher, the shooter),
answered in each discipline's style. They are the Apprentice's T4 resilience. Every leaf
triggers on an enemy's action, never on your hits, so attack speed can't farm them
(§12.10). *Decided (names and numbers open).*

| | The charger (closes the gap) | The ambusher (appears beside you) | The shooter (hits from range) |
|---|---|---|---|
| Poison: they catch it | **Thick Air:** an enemy that charges or leaps at you lands carrying a full bar, slowed for a moment | **Taint:** an ambusher's first hit on you is halved, and it arrives carrying a full bar | **Windborne:** your plague also walks to whoever hits you from range, however far |
| Fire: blast them back | **Fire Ward:** once every few seconds, an enemy reaching melee range sets off its own sigils and is knocked back a step | **Tinderbox:** once every so often, an enemy appearing beside you sets off your sigils on every enemy around you at once | **Smokescreen:** for 2 s after a detonation, the enemies it hit deal half damage to you with ranged hits |
| Frost: lock them out | **Frozen Step:** a charge that reaches you freezes the charger for a moment (Brittle if it accepts no control) | **Cold Shoulder:** the first hit an ambusher lands on you is halved and freezes it | **Frost Mirror:** each ranged hit on you lays a frost sigil on the shooter; a full shooter freezes |

Spare theme for a later leaf tier *(Decided: kept as a spare)*: **"what if there's no
time?"** (they die first: route a dying enemy's leftovers to whoever will live long enough
to pay them; they're on you; they won't hold sigils: shells, dives, DoT resistance).

### 9.8 Payoffs, and where every piece comes from

| Piece | Comes from | Status |
|---|---|---|
| Lessons (payoffs) | A zone's level teaches a lesson, before its boss, every tier: a new payoff, a **sidegrade** or a **rank-up**. Through T4: 6 at T1, then 9 new, 3 sidegrades and 9 rank-ups (§9.16) | Decided |
| Lesson scaling | Every payoff scales with the Apprentice's tier, so a T1 favourite stays fieldable (as the Striker's techniques, the Squire's responses, the Slinger's clips) | Decided |
| Trophies | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| The element, the signature and one piece | The T2 pick | Decided |
| Specialization | The T3 pick | Decided |
| Leaves | T4 onward | Decided |
| The sigil cap | Global Mastery steps | Decided |

**Three schools** *(Decided, vocabulary; the Squire's response families are the model)*:
**Poison** (Spread, Siphon, Wither, Seep, Recoil, Spore Burst, Transference), **Fire**
(Detonate, Converge, Fuse, Blast Back, Sear, Signal Fire, Melt, Cinderfall, Pyre), **Frost**
(Numb, Seize, Cold Snap, Snag, Frostcrack). Each tier spreads its lessons across the three.
Counting rank-ups, 30 payoffs through T4: Poison 11, Fire 10, Frost 9. Note *(Proposed)*:
Frost grows mostly through rank-ups (Numb II, Seize II–III, Snag II), so it has the fewest
distinct pieces; a later tier can even it out.

### 9.9 Items

| Slot | The Apprentice's version | Status |
|---|---|---|
| Weapon | **"How do your sigils build?"** Speed, sigils per hit, tick speed, duration, cap, plus one **job**. A job follows you up: every tier has a stronger recipe for each job you know; new biomes add jobs; a retiring biome's jobs move to a biome of the next tier | Decided (direction) |
| Relic | Two kinds, one twist each: **payoff relics** change what a payoff does; **sigil relics** change how sigils build or behave. No discipline-only relics | Decided |
| Armor | A shared base plus an Apprentice line. It asks **"what buys you the time?"**: the lines keep you alive while the sigils work | Decided |
| Charm | A shared recovery base plus an Apprentice line. It asks **"what does the affliction give back?"**: Recovery bound to a state of the enemies carrying your sigils, never to your hits | Decided |
| Boots | Generic | Proposed (§4) |
| Components | §4's own session. Waiting there: the brief's **Plague Censer** (spreading poison also spreads fire stacks), a two-element reaction for T5–T6 (§13) or a rule-bender | Under review |

The brief's **Frostbrand Staff** became the Mountain weapon job (the Runestone Staff, §9.4).
T1's pieces are in §9.4; T2–T4 in §9.16. **Eleven trophies**, one per lineage: payoff relics
Outbreak, Glut, Petrify, Dune Wind, Frostheart, Dirge, Pressure Fuse; sigil relics
Firstbrand, Brood Sigils, Scent, Magma Core. *Decided (T1 concepts) / Decided on paper
(T2–T4).*

### 9.10 Defense and recovery

- **Siphon is Second Wind's successor, inside the class system** (as the Squire's defense
  is): spend a target's sigils to heal yourself; a rule chooses when; a cooldown stops
  attack speed farming it. *Decided.*
- **Equipment carries the rest:** the armor's "what buys you the time?" and the charm's
  "what does the affliction give back?" (charm lines bound to enemy states, never to your
  hits), plus the T4 leaves (§9.7). *Decided.*
- **Today's root mechanic returns as gear:** 15% of incoming hits delayed into damage over
  time becomes the Mountain armor line, Stone Sigil. The root's 18% DoT resistance is per-
  class stats, §5's question. *Decided.*
- **Evidence the kit must answer:** without Second Wind the Apprentice lost almost every
  Razorback and Greatbear fight in the T1 boss pass; its incoming damage sits mid-pack
  (6.6 / 9.6 / 4.5 / 4.0 / 1.7 HP/s on the five T1 bosses). *Decided (on record).*

### 9.11 Stance-like modes, rite-like passives

None. The moments are the class's states. *Decided.*

### 9.12 Party role

The weakener and spreader: Wither and Wasting make enemies hit everyone softer, Brittle
makes a boss take more from everyone, Numb and chill slow enemies for the party. **Each
Apprentice keeps its own sigils** on an enemy (its damage adds like any player's); only the
debuffs (Wither's weakening, Brittle, Numb, chill) follow the strongest-copy rule (§7.12,
§12.12). Brittle and the Striker's Expose are different debuffs, so both apply. *Decided.*

### 9.13 Bot plan

*Decided (defaults and test arms tuned by the bots).* Bots can't press buttons; every lever
is a setting the harness writes.

- **Harness intents:** set each moment's payoff and condition; equip the relic. The
  Contagion, Detonate and Imbue runes go.
- **Defaults:** T1, full → Spread if two or more enemies are near, else Detonate; winds up
  → Seize; your HP low → Siphon. Poison: full → Detonate (the plague walks on its own), low
  → Wither. Fire: full → Detonate, shell up → Fuse. Frost: winds up → Seize, frozen →
  Detonate, three or more near → Cold Snap.
- **Metrics:** time to kill; **waste** (damage still owed on dead enemies, the measured
  slowness); chain lengths; payoffs fired; Siphon healing; deaths.
- **Test arms the design already asks for:** fast against heavy weapons at the cap (the W1
  fix); Hair Trigger and Shardstorm multiplication; Ripening; the cap steps; Brittle's
  strength; the first boss without a relic.

### 9.14 Salvage

*Decided (accepted at the walk-through).*

| Keep | Where |
|---|---|
| The DoT inventory: what is on a target, whose, what element, what it still owes; the Payoff rules' reader | `server/src/systems/combat/damage/dotInventory.ts` |
| The affliction toolkit: Contagion's copy and better-of-two merge, nearest-first (Spread, Spore Burst); Detonate's consume-and-pay, stripping before the damage lands, declining before it commits | `server/src/systems/player/abilities/abilityAffliction.ts` |
| The class DoT runtime: application on hit, ticking, `tickOnExpire`, the element per source, `dot-tick` events | `server/src/systems/classes/archetypes/dot/`, `combat/damage/dotTickEvent.ts` |
| The frame verbs as references: Venom vessel's opener (Firstbrand), Ember mage's intensify (Fire's burn), Rime-Bound's chill (Frost's sigils) | `dot/frameLoop.ts` |
| T3 tick drivers as references: Conflagration, Permafrost's bounded window, chill and Winter Warden's Frozen (Freeze, Brittle), Radiant | `dot/t3/ticks/` |
| Rule conditions: the target at max stacks, the target's HP (moments full, low) | `server/src/systems/combat/ai/runeConfig.ts` |
| A freeze interrupting a wind-up; the step-level `uninterruptible` flag; `controlImmune` | `combat/ai/bossPatterns.ts`, `shared/src/data/monsters/types.ts` |
| Element tints, DoT damage numbers, bespoke FX, Apprentice bodies through T3 | `shared/src/systems/dotElements.ts`, `client/src/fx/bespoke/apprentice.ts`, the atlases |
| The root's delayed hits | the Stone Sigil armor line |
| The Passive Tree's panel, unlock gate, reset and layers | §2 |

| Remove or rework | Why |
|---|---|
| Frames, range nodes and the nine paths as data | Replaced by disciplines and specializations |
| Stack damage from the hit's attack (`computeDotClassDamagePerStack`) | Sigil damage from weapon potency and tier (§9.2) |
| The front-loaded curve (`computeScaledDotDamage`) | Linear sigils and payoffs |
| One class `dot` record per monster, taken over by the last applier | One record per owner (§9.12) |
| Shared Contagion, Detonate and Imbue, and the runes driving them | Payoffs in the Payoff rules |
| DoT-conversion weapons for any class (`BURN_FAMILY` reservoirs) | Class weapons (§4); other classes' damage over time is their own pieces |
| The DoT stat panel in system language | Sigils on the enemy, the Payoff card |
| Recovery on kill from DoT kills | On-kill (§1); only the no-waste pass-on stays |

### 9.15 Open questions

**Playtest:**

1. Is the Apprentice still the slowest farmer? Waste is the metric.
2. Every number: sigil damage, tick speeds, the cap steps and the disciplines' shifts,
   payoff multipliers, chain caps, Siphon's cooldown, Brittle's strength.
3. Chain multiplication: Hair Trigger, Shardstorm, Outbreak, Dune Wind.
4. Ripening's ramp; Ice Tomb's hold.
5. The first boss without a relic.

**Design, later:**

6. Names: placeholders throughout ("Sigils" among them; "Seize" sits next to the Squire's
   Seize the Opening leaf).
7. Components and rule-benders (§4): the Plague Censer.
8. The second element and reactions (T5–T6, §13): keep one element per discipline through
   T4, built so a second can sit beside it.
9. Leaves after T4 (spare theme: "what if there's no time?") and the T7–T8 capstone.
10. Per-class stats (§5), the root's DoT resistance among them.
11. Cross-class proposals in the log: XC1 (§1: passing on what a dead enemy carried,
    adding no damage, is not on-kill), XC2 (marks never bank damage; the Slinger's lock
    satisfies it).
12. The T4 undead biome is "Graveyard" in §7.16 and "Wasteland" in §8, §12.16 and here.

**Build tasks, from the design:** one sigil record per owner (§9.12); the "out of reach"
moment; the Tundra Ice Armor's break renamed on screen ("breaks", "cracks"), so "shatter"
stays the Apprentice's. *Decided.*

**Collisions, as settled** *(Decided, notes)*: stack-then-detonate and freeze-then-shatter
stay the Apprentice's (the Slinger's Siege banks on the Slinger and Deathmark's marks only
designate; the Spirit's Chain Lightning leaps damage, never stacks that set each other
off); the Payoff rules read the enemy's state, Thresholds the Spirit's gauge (§9.3); theme
crossings (§3): Seize with the Squire's Shield Bash, Blast Back with the Squire's Stand Fast
and the Conduit's Ironhorn, Firstbrand with the Slinger's Carbine and the Striker's
Hunter's Blade, Pressure Fuse with the Squire's Lie in Wait and the Spirit's Depth Charge,
Transference with the Conduit's Abyssal Warden, Pyre with the Squire's Lay to Rest.
Renamed to avoid locked names: Flare → Signal Fire and Depth Charge → Pressure Fuse (the
Spirit's), Slip Away → Give Ground and Thaw → Melt (the Slinger's).

### 9.16 Tier by tier: what each biome gives the Apprentice

T1 is §9.4. Every tier, each biome teaches a lesson (§9.8), has a weapon, an armor and a
charm recipe (its jobs, stronger), and its boss gives a trophy or ranks one up. **Jobs move
when a biome retires:** after T2 the Forest's (Thornwood Rod, Give Ground, Numbing Calm) to
the Jungle and the Plains' (Branching Wand, Warding Sigils, Feeding Swarm) to the Volcanic;
after T3 the Swamp's (Bog Censer, Bitter Blood, Bitter Tonic) to the Wasteland and the
Cave's (Deep Grimoire, Sigil Weight, Long Draw) to the Trench. A retired lineage's trophy
keeps working and scaling; it only stops ranking up. *Decided on paper*, to judge in the
game; names and numbers open.

**T2**

| Biome | Threat | Lesson (school, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Plains | stampedes | **Blast Back** (Fire, sidegrade of Detonate): a detonation on a charging enemy stops its charge and knocks it back | — | Gorging Razortusk: Outbreak II, a Spread passes to three neighbours |
| Forest | cadence duel, stuns | **Numb II** (Frost, rank-up): a numbed enemy's wind-ups also take longer | — | Apex Timberclaw: Firstbrand II, the first hit lays half a bar |
| Mountain | heavy plating, the breakable barrier, charges | **Sear** (Fire, new): spend a shielded target's sigils to burn through its barrier at double (lands if the barrier breaks) | — | Stoneplate Juggernaut: Petrify II, a held enemy also takes more from your ticks |
| Swamp | pools, rain, the rising mire; Corrosion | **Siphon II** (Poison, rank-up): Siphon also washes a poison, bleed or Corrosion off you | — | Mire-Gorged Behemoth: Glut II, twice the drain reach |
| Cave | eruptions from below | **Seep** (Poison, new): when an enemy burrows or dives out of reach, its sigils keep ticking at double until it surfaces | — | Chitinous Dreadbore: Brood Sigils II, one every 1.5 s |
| Jungle (new) | fleeing prey, ambushers from cover | **Snag** (Frost, new): a fleeing or kiting enemy carrying a full bar is rooted for a moment | Weapon **Stalker's Rod:** sigils on a fleeing or kiting enemy tick double. Armor: anti-ambush base + **Second Skin:** the first hit each ambusher lands on you is a third weaker. Charm **Patient Hunter:** Recovery doubles while every enemy within your reach carries your sigils | Jungle Dread-Gorger, **Scent** (sigil): sigils on an enemy that flees or kites never fall off while it runs, and tick faster |
| Desert (new) | mark, slow, execute; ranged kiters | **Recoil** (Poison, new): when an enemy's mark, slow or curse lands on you, its caster catches a full bar | Weapon **Dune Staff:** longer reach; sigils last longer on far enemies. Armor: ranged-hit base + **Sun-Ward:** marks and slows on you are shorter for each enemy carrying your sigils (capped). Charm **Cool Draught:** a mark or slow ending on you heals you a little | Dune-Stalker Emperor, **Dune Wind** (payoff): a Spread or a chain can leap any distance to an enemy carrying your sigils |

Kiters are the Apprentice's natural prey (the sigils tick while they run), so the Desert is
about the debuffs that land on you.

**T3** (the Plains and Forest have retired)

| Biome | Threat | Lesson (school, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain | the double charge | **Seize II** (Frost, rank-up): Seize catches a second wind-up within a few seconds | — | Crag-Gorged Horn-Behemoth: Petrify III |
| Cave | the tunnel chase | **Seep II** (Poison, rank-up): when the enemy surfaces, its sigils burst onto every enemy near the spot | — | Deep-Core Burrow-Gorger: Brood Sigils III, the last rank |
| Swamp (last tier) | spores, detonating pools, the drag | **Spore Burst** (Poison, sidegrade of Spread): spend a target's sigils to burst them onto every enemy around it at once, half each | — | Rot-Spore Croc-Behemoth: Glut III, the last rank |
| Jungle (+ the Forest's jobs) | pursuit, flight | **Snag II** (Frost, rank-up): the root also holds every enemy near the snagged one | The Forest's jobs move here | Apex Bramble-Slasher: Scent II |
| Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Signal Fire** (Fire, new): a detonation on your target also sets off your sigils on the enemy furthest from you | — | Dune-Carapace Monarch: Dune Wind II |
| Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Melt** (Fire, new): when the Chill on you reaches its threshold, spend the nearest enemy's sigils to melt it off | Weapon **Glacial Wand:** sigils on a chilled or slowed enemy last twice as long. Armor: chill base + **Ice Veil:** when the Chill on you reaches its threshold, every enemy around you carrying your sigils is numbed. Charm **Cold Comfort:** Recovery doubles while an enemy carrying your sigils is frozen or brittle | Frost-Plated Rime-Mammoth, **Frostheart** (payoff): every Seize also leaves its target brittle for a few seconds after |
| Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, Obsidian shells, hound swarms, burning gunners | **Cinderfall** (Fire, sidegrade of Detonate): the detonation hits everything around the target, each paying a share | Weapon **Magma Censer:** sigils tick harder for each step of the fight's Heat. Armor: heat base + **Ashguard:** a burning hit on you lays a sigil on its shooter. Charm **Banked Coals:** Recovery rises with the Heat while three or more enemies carry your sigils. The Plains' jobs move here | Cinder-Shell Magma-Salamander, **Magma Core** (sigil): sigils on a shelled enemy keep ticking at full through the shell |

**T4** (the Swamp and Cave have retired)

| Biome | Threat | Lesson (school, kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain (last tier) | Earthshatter, delayed fault lines | **Seize III** (Frost, rank-up): a seized enemy's delayed attacks (fault lines) are cancelled too | — | Iron-Crest Titan: Petrify IV, the last rank |
| Tundra | Ice Armor at its heaviest | **Frostcrack** (Frost, new): a Seize on a shielded or shelled enemy cracks the shell open at once | — | Glacial Patriarch: Frostheart II |
| Jungle | hard to catch, then it commits | **Spread II** (Poison, rank-up): Spread and the plague reach a hiding or fleeing enemy anywhere within your reach | — | Verdant-Crown Predator: Scent III |
| Desert | three acts: melee, kiter, cornered | **Recoil II** (Poison, rank-up): the caster also suffers its own mark or slow | — | Dune-Throne Sovereign: Dune Wind III |
| Volcanic | the Heat race, Magma Shove | **Cinderfall II** (Fire, rank-up): each step of the Heat widens it | — | Caldera Sovereign: Magma Core II |
| Wasteland (new; + the Swamp's jobs) | the dead rise; area damage matters most | **Pyre** (Fire, new): a fallen enemy carrying your sigils burns and can't rise; its leftovers pass on (no damage added, XC1's shape) | Weapon **Charnel Rod:** your hits also lay a sigil on the nearest risen enemy. Armor: base (risen enemies hit softer) + **Gravewrap:** a risen enemy carrying your sigils can't hit you for its first seconds. Charm **Last Rites:** Recovery rises for each risen enemy carrying your sigils. The Swamp's jobs move here | Charnel-Crown Sovereign, **Dirge** (payoff): a Detonate also sets off your sigils on every risen enemy in the fight |
| Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Transference** (Poison, new): spend a target's sigils to move one of your debuffs onto it | Weapon **Abyssal Censer:** sigils tick harder for each different debuff on their carrier. Armor: debuff-resistance base + **Deep Ward:** while you carry three or more debuffs, each enemy carrying a full bar deals less damage to you. Charm **Tidal Draw:** each debuff you move or wash off heals you a little. The Cave's jobs move here | Elder Trench Serpent, **Pressure Fuse** (payoff): a Detonate on an enemy out of reach goes off, doubled, when it resurfaces |

**How T3 and T4 test the Apprentice:** shells waste damage over time, so Magma Core,
Frostcrack, Sear and Fuse are the answers and Fire is strongest there; the bosses that
accept no control meet Brittle, Frostheart and Numb (a slow still lands); the Final
Eruption is a race, Poison's weakest fight, where Cinderfall and Long Fuse matter; the
Wasteland is the area fight, home for the plague and the chain; the Trench's debuff pile
meets Siphon II, Transference and Recoil, its dives Seep and Pressure Fuse.

**Totals through T4:** 30 payoffs counting rank-ups (6 at T1, the 3 discipline pieces, then
9 new, 3 sidegrades and 9 rank-ups): Poison 11, Fire 10, Frost 9. Eleven trophies (§9.9).

## 10. Slinger — Locked (2026-10-14)

**Locked by the designer on 2026-10-14: build authority.** Every proposal the walk-through
reached was accepted; items still tagged *Proposed* are notes or wait on another section
(§4's boots) and may change without reopening this one; **Playtest** questions stay open
(§10.15), and whether the stationary reload bites comes first. Outside the lock, each for its own session: names (placeholders throughout), guns
drawn for the bodies, leaves after T4 and the T7–T8 capstone, components and rule-benders
(§4), farming efficiency (§13), per-class stats (§5). The lock archives nothing: no design
doc is the Slinger's alone, and `docs/frames-current-state.md` stays the code's truth until
the build replaces frames.

Written to the class template (§6) from the 2026-10-14 deep dive. Every call in order, the
reasoning and the ideas that were dropped are in
[slinger-deep-dive-log-2026-10-14.md](../docs/briefs/slinger-deep-dive-log-2026-10-14.md);
the prep is [slinger-deep-dive-prep-2026-10-14.md](../docs/briefs/slinger-deep-dive-prep-2026-10-14.md).
No mockup. Tags as everywhere in this bible; **Playtest** marks a question only the game can
answer (§10.15). Names are placeholders throughout.

**The main risk, on record:** ranged classes are the hardest to hurt. In the T1 boss pass
the Slinger won every T1 boss every time and took 1.2 HP/s on the Behemoth against the
Striker's 8.2, because an orbiting ranged class never stands in a telegraph. The stationary
reload is the design's answer (§10.2); the first playtest question is whether it bites
(§10.15). *Decided (the risk is on record).*

### 10.1 Fantasy

The gunslinger, with real guns: "I load the right rounds and empty the clip." Pistols and
flintlocks; clips, rounds and a hand cannon read literally. *Decided.* Today's Slinger
bodies carry no firearm (the art prompts avoided gun nouns), so guns must be drawn.
*Proposed (art task).*

### 10.2 Core mechanic

- **The clip:** the Slinger fires a clip of rounds at its gun's fire rate, then reloads.
  **Fire rate is its own stat;** "2× attack speed at 65% attack" is gone, and the fast feel
  comes from animation and sound. *Decided (brief).*
- **Every round in a clip is the same;** what the rounds are is the loaded **clip type**
  (§10.3). No per-bullet authoring. *Decided (§3).* Bullet properties are the Slinger's
  on-hit; there is no generic on-hit. *Decided (brief).* **The plain clip is the damage
  clip:** typed rounds trade some raw damage for their effect, so plain stays a real
  choice. *Decided.*
- **Per-round effects build to a cap,** so fire rate buys how fast you reach it, not how
  high it goes (above all for control: Snare, Stopping, Frost). *Decided.*
- **The last round is the relic:** the boss trophy is a special round loaded last in every
  clip. A plain last round until the first boss kill, which the base kit must win (no
  starter trophy, as the other classes). *Decided.*
- **The reload is stationary by default: the class's risk window.** Standing still for part
  of every clip is what makes the Slinger catchable, the class-level answer to the risk
  above. Gunslinger and gear lines may loosen it; no reload-triggered shield or heal
  (§10.10). *Decided.* Today the Slinger moves freely while it reloads in combat.
- **The reload is a readable moment:** the ring empties, a reload bar fills around it, the
  next clip's colour shows; each gun has its own reload pose and sound (a revolver's
  cylinder spin, a carbine's magazine, a flintlock's ramrod, the hand cannon's shell).
  *Decided.*
- **The gun sets the clip:** the weapon sets fire rate, clip size and reload time; the
  discipline shifts the clip (Gunslinger smaller, Siege bigger) by a flat amount, not a
  multiplier, so a small gun never drops to a handful of rounds. *Decided.*
- **The budget: rack slots, then double loads.** Each Global Mastery step adds a slot to the
  rack (§10.3); once the rack is full, a step lets one clip carry two properties (Venom +
  Breaching rounds: custom loads, the gunslinger's craft), paying the **higher** of the two
  prices. Shown in class terms ("Rack 3, next at Mastery 30"). *Decided.* Illustrative: one
  slot at the start, two at Mastery 15, three at Mastery 30, four by the end of T2, double
  loads from T3. *Decided (illustrative; bots tune it).*
- **HUD:** the ammo ring coloured by the loaded clip type, the last round marked gold, the
  next clip's colour beside it; twin guns show two half-rings; Siege's shell charge glows
  inside the ring; Trickshot marks the called shot's target when the last round chambers.
  *Decided.* **Callouts** only for the trophy round (by name, every discipline) and
  Siege's shell; clip switches show on the ring with no callout. *Decided.*

### 10.3 The class system: the Loadout

**What you configure** *(Decided)*:

- **The rack:** the clip types you carry, within your rack slots. The plain clip is always
  there and takes no slot.
- **Clip rules:** at each reload a free rule picks the next clip for the situation ("three
  or more enemies → Scatter", "an elite → Breaching", else plain).
- **Switch reloads:** a rule may dump the clip early to load a better one; you lose the
  rounds left and stand still. When a switch is worth it is the Loadout's decision.
- **The relic:** your last round.
- **Discipline rules,** free: Trickshot's called-shot rule (§10.5), Deadeye's hold (§10.6).
  Free reload rules: reload early when nothing threatens you; never start a reload inside a
  telegraph. *Decided (free, §3; those two are defaults).*

**Not in it** *(Decided)*: abilities outside the class system (§3, confirmed for the
Slinger), per-bullet authoring (§3) and defense (equipment, §10.10).

**Never the same editor** (§3): the Order is a short authored sequence, the Response rules
answer what the enemy does, the Loadout chooses **ammunition at the reload**: a rack, never
a sequence of rounds and never an instant answer to an enemy move. *Decided.*

**Ownership** *(Decided)*: clip types own every round; the relic owns the last round; the
discipline owns its rule (twin guns, the shell, the called shot) and the rhythm (clip size,
reload, where in the clip the damage lives); a specialization bends that rule or the
delivery of the shell or the last round, never what a clip or a trophy does; leaves are
small turns on all of it.

Default configuration: §10.13.

### 10.4 The T1 form

- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain pistol (8 rounds), the ammo ring and one preset rule (reload when empty); the
  reload is stationary. The Plains teaches Scatter around minute 6, in rack slot 1, with a
  default rule (three or more enemies → Scatter, else plain): the answer to the Plains
  entry spike playtest 3 measured (15 of 177 HP). The first boss is won with a plain last
  round and gives Stampede Round. By the end of T1 the Slinger owns five clip types and
  carries three.
- **Each T1 biome's threat hands you its answer:** a clip type (that zone's level, before
  its boss), a gun, an armor and a charm; its boss gives a trophy round. *Decided.* The gear
  slots' questions (§10.9): the gun **"which gun?"**, the armor **"what covers your
  reload?"**, the charm **"where are you safe?"**.

| Biome | Threat | Clip type | Gun (job) | Armor (shared base + Slinger line) | Charm (Slinger line) | Trophy (last round) |
|---|---|---|---|---|---|---|
| Plains | swarms | **Scatter:** each round bursts on impact, nicking up to two enemies beside the target | **Pepperbox:** fast fire, a big clip, light rounds; Scatter nicks one more | Plating + **Elbow Room:** while three or more enemies are near you, you reload faster | **Breathing Room:** Recovery rises with the distance to the nearest enemy | Tusked Razorback, **Stampede Round:** knocks the target and everything in a line behind it back |
| Forest | fast packs | **Snare:** each round slows the target's movement and attacks a little, up to a cap | **Carbine:** quick fire, a quick reload; the first rounds of each clip hit harder (the Scout's openers) | Evasion + **Quickdraw:** you can walk at half speed while reloading | **Fleet:** Recovery doubles while you move | Gnarled Greatbear, **Twin Round:** the last round fires twice |
| Swamp | attrition | **Venom:** each round adds a poison (damage over time) | **Snakebite Pistol:** slow fire, a small clip; your poison lasts longer and the last round hits a poisoned target harder | DoT resistance + **Oilskin:** damage over time on you is halved while you reload | **Snake Oil:** Recovery doubles while you carry poison or bleed and no enemy is near you | Grave Toadeater, **Rot Round:** the last round's wound rots, hitting again over a few seconds |
| Mountain | the hardest hits | **Stopping:** each round shoves the target back a little; a charger reaches you late | **Hand Cannon** (the brief's): slow fire, a 6-round clip, heavy rounds; the last round hits much harder | Damage cap + **Dig In:** while you reload, no single hit takes more than a fifth of your HP | **Regroup:** after a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds | Crag Behemoth, **Quake Round:** a heavy slug that hits everything around the target |
| Cave | elites, plating | **Breaching:** every round ignores most of the target's plating (today every Slinger shot pays half plating; that moves to this clip) | **Drum Gun:** a big drum, a slow reload; each round of a clip hits a bit harder than the last (the Artillerist ramp) | Bulk + **Hunker:** your plating doubles while you reload | **Bivouac:** much faster out-of-combat Recovery | Obsidian Broodmother, **Splinter Round:** the last round splits into three that strike the nearest other enemies |

Clip types, gear and trophies *Decided (direction; names and numbers open)*. Boots stay
generic (§4). Weapon fits: Gunslinger the Carbine and Pepperbox; Siege the Drum Gun and
Pepperbox; Trickshot the Hand Cannon and Snakebite Pistol. Notes *(Proposed)*: Snare and
Stopping are control that scales with fire rate, so both build to a cap and bosses may
shrug them off; Twin Round, Splinter Round and Ricochet all multiply the last round, so
watch them together; Rot Round crosses the Striker's Festering Cut (§3 allows it);
"Splinter" avoids "shatter" (the Apprentice's).

### 10.5 Disciplines (T2)

A considerable power step (§2): the discipline brings the Slinger's rule. The old frames'
successors, as for both melee classes. *Decided (rules); numbers and looks illustrative.*

| | Gunslinger (light, from Scout): the fast hand | Siege (heavy, from Artillerist): the emplacement | Trickshot (balanced, from Marksman): the showman |
|---|---|---|---|
| Fantasy | "Two guns, never still for long." | "I dig in and shell everything." | "Every clip ends with the impossible shot." |
| Clip and reload | The smallest clip, the quickest reload (a spin) | The biggest clip (a drum), the longest reload: the riskiest window | The gun's own clip and reload |
| Rule | **Twin guns:** two of whatever gun you hold, each with half the clip and its own clip type from the rack; shots alternate (Snare left, Venom right), so two clip types act at once; both reload together in a quick spin | **The shell:** every round charges a siege gun on your back; the reload fires it where the target stands, an area blast **made of what you fired** (Venom: a gas shell; Scatter: a cluster shell; Breaching: a bunker-buster). The bank lives on the Slinger, never on the target (stack-then-detonate is the Apprentice's, §3) | **Called shot:** the last round (your trophy) flies to a target a free rule picks (the enemy winding up, the lowest HP, the elite), anywhere in range, past whatever stands in the way, and hits harder (the Marksman's ×2.2, now Trickshot's) |
| Damage, rounds / payoff | ~85 / 15 (the last round) | ~50 / 50 (the shell) | ~60 / 40 (the last round) |
| Look | Each round coloured by its clip; a gun spin on the reload | A mortar on the back whose barrel glows as the shell charges | A gold glint as the last round chambers; a gold tracer |
| Best at / weak at | Mixed fights and farming (switching is cheap) / plating (light rounds) | Packs and bosses that hold still / kiters and telegraph-heavy fights (the long stationary reload) | Bosses, elites, casters / swarms (one big round on a dying mob is wasted) |

Siege's risk window is also its big moment: you plant and shell. Three classes bank toward
one big hit (the Striker's Momentum from its own swings, single target; the Squire's slam
from enemy hits; Siege's shell from rounds fired, an area blast in the reload); the area and
the clip's property keep Siege apart. *Proposed (note).* Twin guns overlap double loads
(both put two properties in play at once); a twin-gun double load is four. *Proposed
(note).*

### 10.6 Specializations (T3)

Ownership as §10.3; **specializations are content-neutral** (§12.6): weapon, clip types
and relic choose the content. *Decided.* Concepts *Decided*; names and numbers open.

| Gunslinger (twin guns) | Siege (the shell) | Trickshot (the called shot) |
|---|---|---|
| **Fan the Hammer:** after every reload spin, both guns' first three rounds fire at triple rate (the brief's reload triggers; Gunslinger reloads most, so it pays most) | **Deathmark** (the designer's): rounds mark the enemies they hit; at the reload the shell bursts on every marked enemy at once. One mark per enemy, never stacking; the charge lives on the Slinger and the marks only say where it lands: breadth, where the Apprentice's payoff is depth on one target | **Ricochet:** the called shot bounces on to two more enemies, each picked by your rule, each taking the trophy's twist |
| **Crossfire:** a target hit by both guns back to back takes both clips' effects at +50%; the pair you rack is the build (Snare + Venom, Breaching + Stopping) | **Entrenched:** the longer you stand your ground, the faster you fire and the bigger the shell, to a cap; moving resets it; the stationary reload counts as standing | **Pierce:** the called shot passes through every enemy between you and its target, each taking it in full |
| **Gun Kata:** you fight at arm's length; rounds hit much harder up close, and both guns fire at once at enemies in melee with you (a range commitment, not a dial) | **Rolling Fire:** the shell fires in small pieces, a small shell every few rounds, and the reload carries none: steady area instead of one big moment | **Deadeye:** the last round can be held; the clip waits on it until your rule's moment (an enemy winds up, an elite appears, the target drops below a third) or a few seconds pass; held, it hits much harder |

Mined from the old paths: Fan the Hammer (Desperado), Entrenched (Warmonger's carry),
Rolling Fire (the Cannoneer reversed), Deadeye (the Sniper). Spares: The Draw (each fight
opens with both guns emptying at triple rate), Airburst (the shell covers a wide circle,
weaker per enemy), Encore (the last two rounds are both called shots). Notes *(Proposed)*:
Ricochet, Pierce and Deathmark lean to packs, Deadeye and Entrenched to bosses (watch them
against content-neutrality); Gun Kata puts a ranged class in melee, where damage taken
doubles, so it needs its own armor answer; Deadeye's held round crosses the Striker's
Crescendo release and the Squire's held slam.

### 10.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Slinger's T4 asks **"what goes wrong?"**: you're
caught reloading, they reach you, or the wrong clip is loaded; one answer each per
discipline, in its style. The first two columns carry the resilience a stationary-reload
class needs (two of three, where melee classes get it throughout); the third keeps the
rack's choice interesting. Every defensive leaf is a state or enemy-paced, never triggered
by your shots (§12.10). *Decided (names and numbers open).*

| | Caught reloading | They reach you | The wrong clip |
|---|---|---|---|
| Gunslinger: footwork | **Light Hands:** while you reload, the first hit every few seconds deals half damage | **Slip Away:** while an enemy is in melee with you, you move a quarter faster | **Quick Swap:** switching clips early keeps the rounds you had left; they come back in the next clip |
| Siege: fortified | **Bunker:** while you reload, you take a quarter less damage | **Stakes:** an enemy that charges or rushes you is stopped dead at your feet for a moment, once per enemy every few seconds | **Fresh Powder:** the shell takes the property of the clip you're loading, not the one you fired, so a switch reload fires the right shell at once |
| Trickshot: composure | **Cool Reload:** telegraphed attacks aimed at you while you reload deal half damage | **Steady Nerve:** while an enemy is in melee with you, you can't be stunned or knocked back | **Improvise:** when the loaded clip does nothing to the called shot's target (control on a boss that accepts none, poison on the immune), the called shot hits a third harder |

Theme crossings *(Proposed, notes)*: Cool Reload with the Striker's Read the Blow; Stakes
with the Squire's Stand Fast and the Conduit's Ironhorn. Spare theme for later leaf tiers:
**clip transformations** (Scatter's bursts split again, Snare roots at its cap, Venom
lingers after the clip). *Decided (spare theme).*

### 10.8 Clip types, and where every piece comes from

| Piece | Comes from | Status |
|---|---|---|
| Clip types | A zone's level teaches a lesson, before its boss, every tier: a new clip type, a **sidegrade** (the same idea in a new shape) or a **rank-up** (stronger, one visible twist per rank). Through T4: 14 new, 3 sidegrades, 9 rank-ups (§10.16) | Decided |
| Clip scaling | Every clip type scales with the Slinger's tier, so a T1 favourite stays fieldable (as the Striker's techniques, §12.8, and the Squire's responses) | Decided |
| Trophy rounds | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| The discipline's rule | The T2 pick: twin guns, the shell, the called shot | Decided |
| Specialization | The T3 pick | Decided |
| Leaves | T4 onward | Decided |
| Rack slots and double loads | Global Mastery steps | Decided |

**Three clip families** *(Decided, vocabulary)*: **damage** (Scatter, Buckshot, Venom,
Acid, Breaching, Hollow-point, Incendiary, Thermite, Exploit, Hallowed), **control**
(Snare, Stopping, Frost, Tether) and **utility** (Shellbreaker, Tracer, Seeker). Every typed
clip pays the price (the plain clip is the damage clip). The T2–T4 clip types are in
§10.16.

### 10.9 Items

| Slot | The Slinger's version | Status |
|---|---|---|
| Weapon | **"Which gun?"** Fire rate, clip size and reload time, plus one **job**. A job follows you up: every tier has a stronger recipe for each job you know; new biomes add jobs; a retiring biome's jobs move to a biome of the next tier | Decided (direction) |
| Relic | The trophy round: your last round. One twist each, no per-discipline versions; Trickshot makes the most of it | Decided |
| Armor | A shared base plus a Slinger line. Slinger armor asks **"what covers your reload?"**: the lines protect the stationary window, always as a "while reloading" state, never a per-reload trigger | Decided |
| Charm | A shared recovery base plus a Slinger line. It asks **"where are you safe?"**: Recovery tied to distance, movement or being out of combat, never to the reload or your shots | Decided |
| Boots | Generic | Proposed (§4) |
| Components | §4's own session. Waiting there: the brief's **Hand Cannon legendary** (the last round deals bonus damage per round of this clip that hit) and the **Bandolier** (each reload adds marking rounds: a Deathmark rule-bender) | Under review |

The brief's **Glass Duster** is the Desert armor line (§10.16): an offense–defense trade
§1 allows. T1's pieces are in §10.4; T2–T4 in §10.16. **Eleven trophy rounds**, one per
lineage: Stampede, Twin, Rot, Quake, Splinter, Hunter's, Bounty, Rime, Cinder, Toll,
Harpoon. *Decided (T1 concepts) / Decided on paper (T2–T4).*

### 10.10 Defense and recovery

- **The stationary reload is the risk window,** on purpose (§10.2). Its answers live in
  equipment (the armor's "while reloading" lines, the charm's "where are you safe?") and
  two columns of T4 leaves (§10.7). *Decided.*
- **Never a per-reload trigger:** small clips and fast fire reload more often, so a
  reload-triggered shield or heal would let Gunslinger farm it (§12.10's first rule).
  *Decided.* A "while reloading" state is allowed, but its uptime also grows with fire rate
  (a bigger share of each cycle is reload): watch it. *Proposed (note).*
- **Gone:** the root's Recovery on kill (§1); every shot paying half plating (it moves to
  the Breaching clip). *Decided.*
- **Evasion:** today's root carries 30% evasion, worth little on a player (an evade is a
  graze: the Forest vest's 36% bought about 3.6% mitigation in the boss pass). Per-class
  stats are §5's question. *Open.*
- **Kiting:** today a rune (Keep Distance); now a free universal standing order for every
  class (§3). *Decided (2026-10-14).*
- **Gun Kata** fights in melee, where damage taken doubles: it needs its own armor answer.
  *Proposed (note).*

### 10.11 Stance-like modes, rite-like passives

None. The loaded clip is the mode, and the rack's rules switch it. *Decided.*

### 10.12 Party role

The party's ranged damage and spotter. Its debuffs help everyone: traced enemies can't hide
from anyone, Acid strips plating, Snare and Frost slow. Its buffs are self-only. The same
debuff from two Slingers doesn't stack; the strongest copy applies (§7.12, §12.12).
*Decided.*

### 10.13 Bot plan

*Decided (accepted at the lock; defaults and test arms tuned by the bots).* Bots can't press
buttons; every lever is a setting the harness writes.

- **Harness intents:** set the rack and its clip rules; the switch-reload rules; the reload
  rules (reload early when nothing threatens; never start a reload in a telegraph);
  Trickshot's called-shot rule; Deadeye's hold; equip the relic. The Reload Safely and Keep
  Distance runes go.
- **Defaults:** T1, plain, then each clip type on its natural rule as it is learned
  (Scatter on three or more enemies; Snare on a fast enemy closing; Venom on an elite or a
  boss; Stopping on a charge; Breaching on a plated target). Gunslinger: a damage clip and a
  control clip on the twin guns. Siege: a damage clip in the drum, switch reloads rare.
  Trickshot: called shot on the enemy winding up, else the elite, else the lowest HP.
- **Metrics:** time to kill, deaths, HP lows; **damage taken while reloading against while
  firing** (the risk window); time spent reloading; switch reloads per minute and rounds
  lost to them; the shell's and the last round's share of damage; incoming HP/s on the
  Behemoth and the Broodmother (the orbit finding).
- **Test arms the design already asks for:** the stationary reload against the orbit
  finding; the caps on Snare and Stopping at high fire rate; double loads and twin-gun double
  loads; Fan the Hammer against fire rate; Deathmark's breadth on packs; Gun Kata's
  survival; the first boss without a trophy.

### 10.14 Salvage

*Decided (accepted at the lock).*

| Keep | Where |
|---|---|
| The reload runtime: the ammo slice, the reload timer, the lifecycle hooks (`onStart`, `onComplete`), early completion, the manual-reload intent | `server/src/systems/classes/archetypes/reload/` (`reloadPrototype.ts`, `reloadLifecycle.ts`) |
| Every shot's place in the clip (`reloadClipIndex`): the last-round seam; the frame loop's three shapes (openers, the last round, the ramp) as references | `reload/frameLoop.ts` |
| Reload Safely's out-of-combat reload and hold | becomes free reload rules |
| Blunderbuss pellets and the shove per pellet | Buckshot, Stopping |
| The Cannoneer's bank fired at the reload | the Siege shell |
| The Bounty hunter's marks (the marks only; the damage moves to the shell) | Deathmark |
| Desperado, Warmonger's carry and the Sniper as references | Fan the Hammer, Entrenched, Deadeye |
| The ammo ring and its shot and refill animations | `client/src/hud/mechanics/ReloadMechanic.tsx` |
| Bespoke FX: Dualslinger's gold slug and blue round (the twin guns' coloured rounds), the Cannoneer blast and the barrel glow (the shell) | `client/src/fx/bespoke/slinger.ts` |
| Callouts | `client/src/render/skillCallouts.ts` |
| Slinger bodies through T3 (guns to draw) | the atlases |
| The Passive Tree's panel, unlock gate, reset and layers | §2 |

| Remove or rework | Why |
|---|---|
| Frames, range nodes and the nine paths as data | Replaced by disciplines and specializations |
| "Weapon Attack at 65% at this extreme cadence" | Fire rate is its own stat (brief) |
| Every shot paying half plating (`platingMult` 0.5) | Moves to the Breaching clip |
| Recovery on kill; the Duelist's kill chain | On-kill (§1) |
| Shared abilities and the runes driving them (Reload Safely, Keep Distance) | The Loadout's free rules; kiting a standing order (XC2) |
| Moving freely while reloading in combat | The reload is stationary (§10.2) |
| The Melter's heat laser | No home in the rework; parked |

### 10.15 Open questions

**Playtest:**

1. Does the stationary reload bite? The orbit finding (1.2 HP/s on the Behemoth) is the
   bar.
2. Every number: clip sizes, reload times, fire rates, the clip price, the rack steps, the
   caps on per-round effects, the shell's share, the called shot's multiplier.
3. Twin guns with double loads (four properties); Fan the Hammer against fire rate;
   Deadeye's hold length.
4. The first boss without a trophy.
5. Control clips at high fire rate (Snare, Stopping, Frost, Tether).

**Design, later:**

6. Names: placeholders throughout.
7. Guns drawn for the Slinger bodies (art).
8. Components and rule-benders (§4): the Hand Cannon legendary, the Bandolier.
9. Leaves after T4 (spare theme: clip transformations) and the T7–T8 capstone.
10. Per-class stats (§5), evasion among them.
11. The dive's two cross-class proposals were decided on 2026-10-14 and written into §3:
    fire rate is not attack speed (XC1); Keep Distance is a free universal standing order
    (XC2).

**Collisions, as settled** *(Decided, notes)*: stack-then-detonate stays the Apprentice's
(Siege's bank lives on the Slinger; Deathmark's marks only designate, which satisfies the
Apprentice dive's "marks never bank damage"); freezing and burning clips never freeze or
detonate (Frost, Incendiary, Thermite); Ricochet crosses the Conduit's Dartcaller,
Deathmark's split the Spirit's Overcast, Tether the Spirit's Dust Devil II (theme
crossings, §3); "Siege" sits next to the Squire's Siege Engine leaf; Tide's ebb moves the
Spirit away, the opposite of the Slinger's stand-still reload.

### 10.16 Tier by tier: what each biome gives the Slinger

T1 is §10.4. Every tier, each biome teaches a lesson (§10.8), has a gun, an armor and a
charm recipe (its jobs, stronger), and its boss gives a trophy round or ranks one up.
**Jobs move when a biome retires,** as for the other classes: after T2 the Forest's
(Carbine, Quickdraw, Fleet) to the Jungle and the Plains' (Pepperbox, Elbow Room, Breathing
Room) to the Volcanic; after T3 the Swamp's (Snakebite Pistol, Oilskin, Snake Oil) to the
Wasteland and the Cave's (Drum Gun, Hunker, Bivouac) to the Trench. A retired lineage's
trophy keeps working and scaling; it only stops ranking up. *Decided on paper, to judge in
the game; names and numbers open.*

**T2**

| Biome | Threat | Lesson (kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Plains | Stampedes | **Buckshot** (sidegrade of Scatter): each round sprays a cone of pellets, harder up close; the pellets stop a charging enemy in its tracks | — | Gorging Razortusk: Stampede Round II, the shove also knocks down |
| Forest | Cadence duel, stuns | **Snare II** (rank-up): builds faster, and at its cap the target's wind-ups take longer too | — | Apex Timberclaw: Twin Round II, both shots full strength |
| Mountain | Heavy plating, breakable barriers, charges | **Shellbreaker** (new): every round hits barriers and shields double | — | Stoneplate Juggernaut: Quake Round II, a wider blast that also cracks plating |
| Swamp | Pools, rain, the rising mire; Corrosion | **Venom II** (rank-up): deeper poison that lasts longer | — | Mire-Gorged Behemoth: Rot Round II, a bigger share |
| Cave | Eruptions from below | **Breaching II** (rank-up): ignores all plating | — | Chitinous Dreadbore: Splinter Round II, four splinters |
| Jungle (new) | Fleeing prey, ambush from cover | **Tracer** (new): each round tags its target, so it can't hide, vanish or break away from you; ambushers in cover are revealed (it designates, never stores damage) | Gun **Hunting Rifle:** long reach; rounds hit harder the farther the target. Armor: anti-ambush base + **Lookout:** an enemy that ambushes you while you reload is slowed and revealed. Charm **Undergrowth:** Recovery doubles while no enemy is targeting you | Jungle Dread-Gorger, **Hunter's Round:** the last round follows its target, can't miss a fleeing enemy, and hits harder the farther it flies |
| Desert (new) | Mark, slow, execute; ranged kiters | **Hollow-point** (new): every round hits a target below half HP harder | Gun **Long Rifle:** the longest reach in the game; outranges kiters. Armor: ranged-hit base + **Glass Duster** (the brief's): you reload faster and hit harder, and the base's defense is lower. Charm **Shade:** every few seconds a mark or slow on you ends | Dune-Stalker Emperor, **Bounty Round:** the last round executes a target below a threshold (a threshold, not an on-kill) |

**T3** (the Plains and Forest have retired)

| Biome | Threat | Lesson (kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain | The double charge | **Stopping II** (rank-up): a stopped charger is also staggered | — | Crag-Gorged Horn-Behemoth: Quake Round III, it knocks down |
| Cave | The tunnel chase | **Seeker** (new): rounds find a target that has burrowed, dived or gone out of sight, at reduced damage | — | Deep-Core Burrow-Gorger: Splinter Round III, the splinters split once more (the last rank) |
| Swamp (last tier) | Spores, detonating pools, the drag | **Acid** (sidegrade of Venom): instead of poison, each round eats a little plating, up to a cap | — | Rot-Spore Croc-Behemoth: Rot Round III (the last rank) |
| Jungle (+ the Forest's jobs) | Pursuit, flight | **Tracer II** (rank-up): a traced target also moves slower while it flees | The Forest's jobs move here | Apex Bramble-Slasher: Hunter's Round II |
| Desert | Postures; the Monarch turns kiter at half HP; a dash-escape | **Tether** (new): a target hit by several rounds in a row can't dash or teleport away for a moment | — | Dune-Carapace Monarch: Bounty Round II, a higher threshold |
| Tundra (new) | The Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Frost** (new): each round chills (slower attacks and movement), up to a cap; never freezes (shatter stays the Apprentice's) | Gun **Frostlock Rifle:** rounds hit harder against chilled, slowed or rooted enemies. Armor: chill base + **Warm Hands:** the Chill on you doesn't build while you reload. Charm **Thaw:** Recovery doubles while you're chilled or slowed | Frost-Plated Rime-Mammoth, **Rime Round:** the last round leaves frozen ground that slows enemies on it |
| Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, obsidian shells, hound swarms, burning gunners | **Incendiary** (new): each round sets the target burning, up to a cap; never detonates (the Apprentice's) | Gun **Firebrand Pistol:** each step of the fight's Heat makes every round hit harder. Armor: heat base + **Asbestos Coat:** the Heat's extra damage doesn't apply to you while you reload. Charm **Heatsink:** Recovery rises with the Heat while no enemy is near you. The Plains' jobs move here | Cinder-Shell Magma-Salamander, **Cinder Round:** the last round sets everything around the target burning |

**T4** (the Swamp and Cave have retired)

| Biome | Threat | Lesson (kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain (last tier) | Earthshatter, delayed fault lines | **Shellbreaker II** (rank-up): a barrier breaks in a few rounds | — | Iron-Crest Titan: Quake Round IV, aftershocks (the last rank) |
| Tundra | Ice Armor at its heaviest | **Frost II** (rank-up): builds twice as fast; Ice Armor takes it double | — | Glacial Patriarch: Rime Round II |
| Jungle | Hard to catch, then it commits | **Tracer III** (rank-up): rounds on a traced target hit harder while it flees or hides | — | Verdant-Crown Predator: Hunter's Round III |
| Desert | The three-act duel: melee, kiter, cornered | **Hollow-point II** (rank-up): the bonus doubles below a third | — | Dune-Throne Sovereign: Bounty Round III |
| Volcanic | The Heat race, Magma Shove | **Thermite** (sidegrade of Incendiary): the burn eats shells; obsidian and ice shells take it double | — | Caldera Sovereign: Cinder Round II |
| Wasteland (new; + the Swamp's jobs) | The dead rise again; area damage matters most | **Hallowed** (new): risen enemies take double from these rounds and rise weaker | Gun **Reaper's Repeater:** each round splashes a share of its damage to the enemies around the target. Armor: base (risen enemies hit softer) + **Hallowed Ground:** while you reload, risen enemies around you deal half damage. Charm **Vigil:** Recovery rises with the number of enemies in the fight while none is near you. The Swamp's jobs move here | Charnel-Crown Sovereign, **Toll Round:** the last round hits harder for every enemy in the fight |
| Trench (new; + the Cave's jobs) | One enormous duel; the debuff pile; dives out of reach | **Exploit** (new): each round hits harder for each different debuff on the target | Gun **Pressure Rifle:** rounds hit harder the more HP the target has left. Armor: debuff-resistance base + **Pressure Suit:** debuffs can't land on you while you reload. Charm **Ballast:** Recovery rises for each debuff on you. The Cave's jobs move here | Elder Trench Serpent, **Harpoon Round:** the last round harpoons the target; for a few seconds it can't dive, burrow or flee |

**Totals through T4:** 14 new clip types, 3 sidegrades (Buckshot, Acid, Thermite) and 9
rank-ups. By the end of T2 the Slinger owns 9 clip types, by T3 14, by T4 17 (rank-ups
counted once). Eleven trophy rounds (§10.9).

**How the later tiers test the build** *(Proposed, notes)*: the Tundra and Volcanic bosses
accept no control, so Snare, Stopping, Frost, Tether and Stampede Round do nothing there
(Improvise, Breaching, Thermite and the shell carry); shells want burst (the Siege shell,
the called shot, Thermite, Shellbreaker); the Heat and the Chill land during the stationary
reload (Asbestos Coat, Warm Hands); the Final Eruption is a damage race (Fan the Hammer,
Entrenched, Deadeye); the Wasteland is the area fight (Deathmark, Rolling Fire, Ricochet,
Pierce, Reaper's Repeater, Toll Round); the Trench is the duel (Exploit, Pressure Rifle,
Harpoon Round), and the Cave's Seeker rounds answer its dives. **Overlaps to judge:** the
Desert stacks execution (Hollow-point, Bounty Round), on purpose, as the execute lineage
for every class; Shellbreaker crosses the Squire's Splitting Blow and the Striker's
Icebreaker; Tracer is the Slinger's answer to fleeing prey (the Striker's is Charge, the
Squire's Chain Hook).

## 11. Spirit — Locked (2026-10-14)

**Locked by the designer on 2026-10-14: build authority.** Every item the walk-through
reached was accepted; **Playtest** questions stay open (§11.15), and the range check comes
first. Outside the lock, each for its own session: names (placeholders throughout), leaves
after T4 and the T7–T8 capstone, components (§4), farming efficiency (§13), per-class
stats (§5). The lock archives nothing: no design doc is the Spirit's alone, and
`docs/barrier-ward-current-state.md` and `docs/frames-current-state.md` stay the code's
truth until the build replaces them.

Written to the class template (§6) from the 2026-10-14 deep dive. Every call in order, the reasoning and the ideas that were dropped are in
[spirit-deep-dive-log-2026-10-14.md](../docs/briefs/spirit-deep-dive-log-2026-10-14.md);
the prep is [spirit-deep-dive-prep-2026-10-14.md](../docs/briefs/spirit-deep-dive-prep-2026-10-14.md).
No mockup yet. Tags as everywhere in this bible; **Playtest** marks a question only the
game can answer (§11.15). Names are placeholders throughout.

**The main risk, on record:** at range the Spirit barely gets hit (0.0 damage per second
from the Broodmother and 0.8 from the Behemoth in the T1 boss pass), so a shield it spends
would cost nothing. The design answers it with a short reach at T1 and a range set by each
discipline (§11.2, §11.5); the first playtest question is whether the trade bites at every
range (§11.15). *Decided (the risk is on record).*

### 11.1 Fantasy

The storm in a bottle: "I carry a storm. It shields me until I let it loose." It keeps
today's lightning look. *Decided (F1).*

### 11.2 Core mechanic

- **The storm is one bar, both damage and shield.** Hits on you drain it before your HP;
  spending drains it too. Enemies eat your storm, so you spend it before they do.
  *Decided.* A resource doubling as a shield is the Spirit's alone (§12.10; the Squire's
  Resolve never absorbs, §8.2). *Decided.*
- **It fills from a steady flow, never from your hits,** so attack speed never grows the
  shield. **The flow is constant:** taking damage never pauses it. The shield loses to
  pressure because heavy pressure drains it faster than it flows, so the flow's rate is set
  against the pool's size. *Decided.* Your hits add nothing to it; a later rule-bender may
  be the one exception. *Decided (2026-10-14, at the wrap-up).*
- **Damage over time eats the storm like any hit** (poison, bleed, burn ticks). *Decided.*
- **Spends are the damage.** Plain attacks are free small zaps; the spends (the Spirit's
  pieces, §11.8) carry most of the damage, and holding fire keeps your shield. *Decided.*
  The zaps are about a quarter of the damage, and attack speed only speeds them.
  *Decided (share illustrative).*
- **At full, the flow is wasted** (the bottle is full); lifting the cap is Overflow's
  (§11.5). Where a rule says "full", Overflow reads its brim. *Decided.*
- **The budget is the bottle's size:** each Global Mastery step adds a pip, shown in class
  terms ("Storm 6, next at Mastery 24"): a bigger shield and bigger bursts at once.
  Illustrative: T1 4 → 5 at Mastery 15 → 6 at 30. *Decided.* **Guardrail (§1): gear never
  grows the pool;** gear shapes how the storm fills, spends or absorbs. *Decided.*
- **Where it fights:** a short-reach caster at T1, between melee and today's 130, close
  enough that melee packs sometimes reach it; each discipline moves it (§11.5). *Decided.*
- **A plain storm until the first boss kill:** the base kit wins the first boss, whose kill
  gives the first trophy (no starter trophy, as the other classes). *Decided.*
- **HUD:** the gauge beside the HP bar, the floor and band marks drawn on it; the crackle
  around the character thins as the storm drains. **Callouts** only for the relic's moments
  and the disciplines' big ones (Reservoir's release, a Spring Tide); ordinary spends never
  call out. *Decided.*

### 11.3 The class system: Thresholds

**What you configure** *(Decided)*: a vertical gauge, the storm's bottle.

- **The floor:** you never spend below it; it is the shield you always keep, though hits
  can still eat it.
- **The bands:** you put spends in bands above the floor, the bigger ones higher up. Calm
  pieces sit at the floor (Eye of the Storm).
- **The phase:** **gather** to full, then break down to the floor (big bursts, then bare),
  or **hover** just above the floor (steady damage, a steady shield).
- **The relic** (§11.9).

All of it is free rules (§3); what limits power is which pieces you own and the bottle's
size.

**Each spend waits for its moment** *(Decided)*: in its band, a spend fires only when it has
something to do (Thunderclap only with an enemy touching you, Downpour only with a poison
or bleed on you). The bands decide when you are willing to spend; the gauge stays the only
screen.

**Three families** *(Decided, vocabulary)*: **strikes** (damage), **squalls** (control and
movement), **calms** (protection). Each tier spreads its lessons across them.

**Not in it** *(Decided)*: abilities outside the class system (§3, confirmed for the
Spirit); rules that answer enemy actions (the Squire's Response rules); cast bars (casts
are the Striker's, cast times the Wizard's, §13).

**Never the same editor** (§3): the Order is a sequence, Formation a roster, the Response
rules a list of "when the enemy does X", the Payoff rules moments on an enemy card, the
Loadout a rack of clips; **Thresholds are marks on your own gauge.** *Decided (note).*
Default configuration: §11.13.

### 11.4 The T1 form

- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain rod, Storm 4 pips and **Bolt** (lightning, the starter spend), set to a 30% floor,
  one Bolt band, gather. The Plains teaches Chain Lightning around minute 6, the answer to
  the Plains entry spike playtest 3 measured (15 of 177 HP). The first boss is won with the
  base kit and gives the first trophy. Storm 4 → 6 by the end of T1.
- **Each T1 biome's threat hands you its answer:** a piece (that zone's level, before its
  boss), a weapon, an armor and a charm; its boss gives a trophy. *Decided (concepts; names
  and numbers open).*

| Biome | Threat | Piece (weather) | Weapon | Armor (base + Spirit line) | Charm | Trophy |
|---|---|---|---|---|---|---|
| Plains | swarms | **Chain Lightning** (strike): leaps from the target to the 3 nearest enemies | **Forked Rod:** area spends reach one more enemy | Plating + **Static Skin:** an enemy that strikes your storm is charged (Static Web's charge); your next spend on it hits harder. No damage reflected: thorns stays the Conduit's Bramble (§8.15) | **Still Air:** the storm gathers much faster out of combat | Tusked Razorback, **Crosswind** (spend) |
| Forest | fast packs that reach you | **Thunderclap** (squall): staggers every enemy around you for a moment | **Quickening Wand:** spends cost less and hit less (smaller, more frequent breaks) | Evasion + **Slipstream:** after a dodge you glide a step away from the attacker | **Clear Sky:** while no enemy touches you, the storm gathers faster | Gnarled Greatbear, **Squall** (spend) |
| Swamp | attrition, poison | **Downpour** (calm): washes a poison or bleed off you | **Drenching Staff:** spends soak the target; lightning on a soaked target hits harder | DoT resistance + **Sealed Vessel:** poison and bleed ticks drain the storm at half cost | **Petrichor:** a Downpour heals you for part of what it washed off | Grave Toadeater, **Marsh Fire** (storm) |
| Mountain | the hardest hits | **Eye of the Storm** (calm, sits at the floor): while at or below your floor, hits drain the storm at half cost | **Summit Staff:** spends cost more and hit much harder | Damage cap + **Grounded:** while the storm is at or above your floor, hits can't knock you back or stun you | **Afterstorm:** after a hit over a quarter of your HP, the storm gathers three times as fast for a few seconds | Crag Behemoth, **Thunderhead** (storm) |
| Cave | elites, casters | **Thunderbolt** (strike): one costly single-target bolt that hits very hard and staggers | **Lodestone Orb:** single-target spends hit harder, area spends softer | Bulk + **Ironbound:** while your storm is empty, your plating doubles | **Capacitor:** while the storm is full, the flow that would be wasted heals you | Obsidian Broodmother, **Static Web** (spend) |

The trophies' twists are in §11.9. The two measured weak spots get three answers each: the
Forest (Thunderclap, Slipstream, Clear Sky) and the Swamp (Downpour, Sealed Vessel,
Petrichor). Gather wants the Summit Staff, Thunderhead, Marsh Fire, Ironbound; hover the
Quickening Wand, Squall, Static Web, Clear Sky. *Decided (notes).*

### 11.5 Disciplines (T2)

A considerable power step (§2), the frames' successors. The base storm stays; each
discipline tilts it, sets where the Spirit fights and unlocks one piece. *Decided (concepts
and rules; numbers and looks illustrative).*

| | Overflow (light): the storm spills over | Tide (balanced): the storm comes in waves | Reservoir (heavy): the storm held |
|---|---|---|---|
| Fantasy | "I'm crackling with more than I can hold, and it pours off me." | "I gather, I break over them, I pull back." | "A deep storm behind a dam; when it's enough, the dam breaks." |
| Rule | The bottle has a **brim, not a cap:** the flow keeps rising past it, and the excess **arcs off you into the nearest enemies**, faster the more you hold (the brief's accelerating decay, turned into damage). The overflow is shield too | The phase becomes a **tide:** in the **ebb** you can't spend, the flow runs fast and you drift back; in the **surge** you can't gather, spends cost less and you close in. You ebb to full and surge down to the floor | A much **deeper bottle.** A free rule fires **the whole bank when it's enough** to kill the target (or at your mark): release timing, no overkill. A full bank makes you nearly untouchable; releasing it leaves you bare |
| Range | close: the spill reaches only enemies near you | moves with the tide: in on the surge, out on the ebb | far: one bolt from afar |
| Piece | **Ball Lightning:** a slow orb that drifts through the pack, zapping all it passes | **Storm Surge:** the surge opens with a wave that rolls through the enemies in front of you | **Cloudburst:** everything above your floor in one bolt, sized by what you spend |
| Look | white-blue arcs jumping off you, brighter as you overflow | the storm rising and falling around you | a dark cloud thickening overhead; the release falls from the sky |
| Wants | strikes with reach; spend relics | squalls (it moves) | big strikes and calms (it holds); storm relics |
| Best at / weak at | packs, farming / kiters and ranged enemies (outside the spill), shells | mixed content, parties / enemies that chase you through the ebb, stuns that break a surge | bosses, elites, shells / swarms (long waits between bolts), fast packs that reach it |

Notes *(Decided)*: at range Reservoir is the safest Spirit; its trade bites against ranged
enemies, area attacks and kiters, which fill T2–T4 (§11.15). Overflow's overfill stays
apart from the Squire's Deep Winter because its spill is automatic damage and its overflow
is shield. Tide's ebb moves the Spirit away, the opposite of the Slinger's stand-still
reload. Reservoir's release is timing, never "+damage below X%" (execution pieces are the
Striker's, the Squire's and the Conduit's). Reservoir's bank stays its shield, which keeps
it apart from the Striker's Crescendo (offense only) and the Slinger's Siege bank.

### 11.6 Specializations (T3)

**Ownership** *(Decided, as §12.6 and §8.6)*: pieces own what each spend does; the relic
owns one twist (a spend or the storm); the discipline owns the storm's shape (brim, tide,
bank) and where it fights; a specialization bends that shape or changes its delivery, and
stays content-neutral; leaves are small turns on all of it.

| Overflow (the spill) | Tide (the waves) | Reservoir (the bank) |
|---|---|---|
| **Stormdancer** (old Stormdancer's Flash): while overflowing you blink between enemies; each landing lets loose a burst of the spill. Mobile; reaches kiters | **Spring Tide:** every third tide runs twice as high: that ebb fills the bottle to double and the surge spends it all | **Gathering Dark:** while the bank is full it keeps darkening: the release grows each second you hold it, up to double; the shield doesn't grow |
| **Spillway:** spends made while overflowing carry the spill to their target, wherever the bolt lands. Answers the kiter weakness | **Slack Water:** you stand your ground instead of moving with the tide; during the ebb, hits drain the storm at half cost. The steady, tanky Tide | **Overcast:** the release splits into one bolt per enemy around the target, the bank shared between them |
| **Lightning Rod:** the spill stops arcing around; all of it strikes your target | **Breakwater:** each surge ends in a wave that crashes over everything in front of you, sized by what the surge spent (Storm Surge opens the surge, Breakwater closes it) | **Deep Well:** each release keeps a third of the bank back as your shield: smaller bolts, never bare |

*Decided (concepts; names and numbers open).* Notes *(Decided)*: Overcast leans to packs,
Gathering Dark and Lightning Rod to bosses; each is a delivery change, not a spec for one
kind of content. Gathering Dark is the board's one time ramp. Tempest's old storm brand
stays dropped (damage over time stacked on the target is the Apprentice's ground).

### 11.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Spirit's T4 asks **"what empties your storm?"**:
the spike, the swarm or the slow drain, one answer each per discipline in its style. Every
leaf triggers on enemy hits or your own states, never on your hits. *Decided (names and
numbers open).*

| | The spike | The swarm | The slow drain |
|---|---|---|---|
| Overflow: the spill takes it | **Shunt:** once every few seconds, a hit worth over a quarter of your storm goes into the spill instead: it costs nothing and arcs back out at enemies | **Static Field:** hits from enemies caught in your spill drain the storm a third less | **Burn Off:** while you overflow, poisons and bleeds on you end twice as fast |
| Tide: the turn saves you | **Turn of the Tide:** a hit over a quarter of your HP during a surge turns the tide at once: you ebb, pulling back and gathering fast | **Wading:** enemies that follow you through the ebb are slowed | **Cleansing Tide:** every turn of the tide washes one debuff off you |
| Reservoir: the dam holds | **Dam:** while the bank is above your floor, no single hit drains more than a quarter of the bottle; the rest of that hit is lost | **Levee:** while three or more enemies are around you, hits drain the storm a fifth less | **Calm Depths:** while the bank is full, debuffs on you last half as long |

Spare theme for later leaf tiers: **weather transformations** (Chain Lightning leaps once
more, Thunderclap knocks down, Downpour also heals, Thunderbolt splits). *Decided (as a
spare theme).*

### 11.8 Pieces, and where every piece comes from

| Piece | Comes from | Status |
|---|---|---|
| Pieces (the spends and calms) | A zone's level teaches a lesson, before its boss, every tier: a **new piece**, a **sidegrade** or a **rank-up** with one visible twist. Through T4: Bolt and 5 at T1, then 12 new and 3 sidegrades (§11.16) | Decided (T1) / Decided on paper (T2–T4) |
| Piece scaling | **Every piece scales with the Spirit's tier,** so a T1 favourite stays fieldable (as §7.2, §12.8) | Decided |
| Discipline pieces | Ball Lightning, Storm Surge, Cloudburst: the T2 pick | Decided |
| Trophies | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| The storm's shape (brim, tide, bank) and range | The T2 discipline | Decided |
| Specialization | The T3 pick | Decided |
| Leaves | T4 onward | Decided |
| The bottle's size | Global Mastery steps | Decided |

By family through T4 *(Decided on paper)*: strikes 8 plus the 3 discipline pieces (Bolt, Chain
Lightning, Thunderbolt, Hailstorm, Forked Bolt, Ash Lightning, Sleet, Thunderstorm),
squalls 8 (Thunderclap, Gale, Flare, Dust Devil, Downburst, Ground Charge, Dust Wall,
Maelstrom), calms 5 (Downpour, Eye of the Storm, Updraft, Foehn, Tailwind). Calms grow slowest: Reservoir's defense leans on its leaves and gear.

### 11.9 Items

| Slot | The Spirit's version | Status |
|---|---|---|
| Weapon | **"How does your storm break?"**: the shape of your spends (bigger and rarer, smaller and more often, wider, focused) plus one job. A job follows you up: every tier has a stronger recipe for each job you know; new biomes add jobs; a retiring biome's jobs move to a biome of the next tier. Never grows the pool | Decided |
| Relic | The boss trophy. **Spend relics** twist every spend; **storm relics** twist the gauge (how it gathers, holds, breaks or empties). One twist each, working in any setup, no per-discipline versions | Decided |
| Armor | A shared base plus a Spirit line: **"what happens when they hit your storm?"** (what it absorbs and at what cost) | Decided |
| Charm | A shared recovery base plus a Spirit line: **"what brings your storm back?"**, a flow line bound to a state, never a flat faster flow (which would grow offense and defense at once) | Decided |
| Boots | Generic | Proposed (§4) |
| Components, rule-benders | §4's own session | Under review |

**The eleven trophies** *(Decided: T1 concepts; T2–T4 on paper; names and numbers open)*:

| Lineage | Trophy (kind) | Twist | Ranks |
|---|---|---|---|
| Plains (T1–2) | **Crosswind** (spend) | every spend also strikes the 2 enemies nearest its target, weaker | II: three enemies |
| Forest (T1–2) | **Squall** (spend) | each spend soon after the last costs a little less | II: the discount builds faster |
| Swamp (T1–3) | **Marsh Fire** (storm) | when hits empty your storm, it bursts, striking everything around you | II: also washes a debuff off you; III: a bigger burst |
| Mountain (T1–4) | **Thunderhead** (storm) | a full storm makes your next spend twice as big | II: it also ignores part of the plating; III: four-fifths counts as full; IV: it also staggers |
| Cave (T1–3) | **Static Web** (spend) | enemies hit by a spend are charged for a few seconds; your plain zaps hit them twice as hard | II: longer; III: a charged enemy passes its charge to one enemy touching it |
| Jungle (T2–4) | **Running Storm** (spend) | a spend whose target flees follows it and lands harder the farther it ran | II; III |
| Desert (T2–4) | **Sandstorm** (storm) | while you're above your floor, a ring of blowing sand slows the enemies inside it | II: a wider ring; III |
| Tundra (T3–4) | **Ice Storm** (spend) | every spend glazes the ground under its target; enemies on it are slowed (bosses that accept no control ignore it) | II |
| Volcanic (T3–4) | **Pyrocumulus** (storm) | a full storm boils over: while you stay full, a burst strikes around you every few seconds | II |
| Wasteland (T4) | **Stray Bolts** (spend) | every spend also strikes a random enemy elsewhere in the fight | — |
| Trench (T4) | **Depth Charge** (storm) | while your target is out of reach, the storm gathers double; your first spend when it resurfaces is doubled | — |

Six spend relics, five storm relics. Gather and Reservoir lean to storm relics; hover and
Overflow to spend relics. A retired lineage's trophy keeps working and scaling; it only
stops ranking up. Known non-fit *(Decided, note)*: Capacitor does nothing for Overflow
(nothing is wasted), as Bloodtithe does nothing for the Conduit's Swarm.

### 11.10 Defense and recovery

- **The storm is the Spirit's defense:** one bar that absorbs before HP and that you spend
  to deal damage; the trade between the two is the class (§1 allows it; the guardrail is
  that gear never grows the pool, §11.2). *Decided.*
- **It must lose to sustained pressure:** the constant flow is sized against the pool, so
  weak hitters still matter (the Striker's "no shield you can keep up forever", met by
  rate). *Decided / Playtest.*
- **Equipment:** armor lines change what the storm absorbs and its cost; charm lines are
  flow lines bound to a state; flat Recovery stays the HP baseline. Resilience leaves at T4
  (§11.7). *Decided.*
- **The recharging barrier leaves shared gear** (cross-class proposal XC1, accepted by the
  designer 2026-10-14): today the Mountain and Tundra charms give any class one. The
  Spirit's storm takes over that runtime; shared bases protect in other shapes (wards that
  expire, damage caps, plating, resistances). Timed wards stay. *Decided; written into §4
  and §5.*
- **The measured weak spots and their answers:** the Forest's fast packs (Thunderclap,
  Slipstream, Clear Sky), the Swamp's attrition and the Toadeater (Downpour, Sealed
  Vessel, Petrichor, then Marsh Fire), the range check (§11.15). *Decided (bots to check).*

### 11.11 Stance-like modes, rite-like passives

None as a system of their own. Gather or hover is a rule; Tide's ebb and surge are that
discipline's states. *Decided.*

### 11.12 Party role

Damage, plus a shared storm: mainly damage (Overflow's spill and Overcast for packs,
Reservoir for bosses), and one shared defense: allies standing in your Overflow spill or
your Tide's ebb take a little less damage. No healer, no shields lent to allies (the
Conduit's Icewarden and the Squire's Intercept own those). The same buff from two Spirits
doesn't stack; the strongest copy applies (§7.12). *Decided.* Reservoir shares nothing;
its party value is boss damage. *Decided (note).*

### 11.13 Bot plan

*Decided (accepted at the lock; defaults and test arms tuned by the bots).* Bots can't
press buttons; every lever is a setting the harness writes.

- **Harness intents:** set the floor, the bands (a spend per band) and the phase; equip the
  relic. The energy runes and shared abilities go.
- **Defaults:** T1: a 30% floor, Bolt above it, gather; Chain Lightning in the top band once
  learned; Thunderclap and Downpour in a band above the floor (they wait for their moment);
  Eye of the Storm at the floor; Thunderbolt in the top band. Overflow: the floor at the
  brim, hover, Ball Lightning and area strikes, a spend relic. Tide: a 20% floor, Storm
  Surge, squalls, a spend relic. Reservoir: a 40% floor, Cloudburst on the "enough" rule,
  calms at the floor, a storm relic.
- **Metrics:** storm drained by source (hits, damage over time, spending), time bare, wasted
  flow at full, spends per minute, damage taken per second by discipline and range, time
  to kill, deaths, HP lows (the Plains entry spike, the Forest packs, the Toadeater).
- **Test arms the design already asks for:** **the range check** (does the trade bite at
  each discipline's range; Reservoir far); the flow against the pool (weak hitters must
  still matter); the zap share; Overflow's spill rate and where it settles; Tide's cycle
  length; Reservoir's "enough" release against full releases; Gathering Dark's cap; Spring
  Tide; the strength of Eye of the Storm, Dam, Deep Well and Slack Water; the first boss
  without a relic.

### 11.14 Salvage

| Keep | Where |
|---|---|
| The barrier runtime as the storm pool: `HasBarrier`, the absorb listener, sizing in one place, the per-tick refill, its HUD conduit (the delay accumulator goes: the flow is constant) | `server/src/systems/defense/barrier/`, [barrier-ward-current-state.md](../docs/barrier-ward-current-state.md) |
| The energy slice and its single accrual point, which becomes the flow | `server/src/systems/classes/archetypes/energy/energyPrototype.ts`, `usesEnergy` |
| One multiplier per hit, for every spend | `combat/engine/empoweredAttacks.ts` |
| Old frame and path mechanics: Spark's chain (Chain Lightning, Overflow's spill), Phantasm's bank and stagger (Reservoir, Thunderbolt), Voidwalker's kill-timed early discharge (Reservoir's "enough"), Equinox's two states (Tide), Channeler's ramping decay (Overflow), Stormdancer's Flash (Stormdancer), Wisp's all-on-one-target (Lightning Rod) | `energy/frameLoop.ts`, `energy/t3/` |
| Rune conditions as the spends' moments: melee contact, a debuff on you, three or more enemies, an elite, a shielded target | `shared/src/runeDatabase.ts` |
| Stun and control immunity for the squalls | `combat/status/stun.ts`, `controlImmunity.ts` |
| The lightning effects (`fxLightning`, `arcDischarge`, `lightningDagger`, `equinoxArc`) and bespoke `fx/bespoke/spirit.ts` (Channeler's stream for the spill) | the client's fx |
| Robed Spirit bodies through T3 | the atlases |
| The Passive Tree's panel, unlock gate, reset and layers | §2 |

| Remove or rework | Why |
|---|---|
| Energy per hit | The flow |
| The discharge at a full bar | Spends placed by Thresholds |
| The root's 30% barrier, Haunt's 40%, barrier on the Mountain and Tundra charms; the barrier's 4 s delay | The storm (XC1); the flow is constant |
| Frames, range nodes and the nine paths as data | Disciplines and specializations |
| Tempest's storm brand | Damage over time stacked on a target is the Apprentice's |
| The energy relic ratings | Trophies |

**Build tasks** *(Decided)*: the storm as the absorb pool with two drains (hits, spending)
and a constant flow; the Thresholds screen (floor, bands, phase) on the rule engine, plus
each spend's moment; Overflow's brim and spill; Tide's movement with the tide (steering);
Reservoir's "enough to kill" release (Voidwalker's projected-damage check); range per
discipline; the soaked and charged states; the party storm (spill and ebb) under the
same-buff rule.

### 11.15 Open questions

**Playtest:**

1. **The range check:** does the shield trade bite at every discipline's range? At range
   the Spirit took 0.0 damage per second from the Broodmother; Reservoir far is the safest
   Spirit. Measure it first.
2. The flow against the pool: weak hitters must still matter.
3. Every number: the pips, the flow, the zap share, piece costs, the default floor,
   Overflow's spill rate, Tide's cycle, Reservoir's depth, Gathering Dark's cap.
4. The first boss without a relic.
5. Too safe? Eye of the Storm, Dam, Deep Well, Slack Water.

**Design, later:**

6. Names: placeholders throughout.
7. Leaves after T4 (spare theme: weather transformations) and the T7–T8 capstone.
8. Components and rule-benders (§4), farming efficiency (§13), per-class stats (§5).

**Collisions, as settled** *(Decided, notes)*: the resource as a shield is the Spirit's
(the Striker's lines and the Squire's Resolve never absorb); Thresholds read your own
gauge, the Apprentice's Payoff rules moments on the enemy; Reservoir is shield-linked
(Crescendo offense only, the Slinger's Siege bank fired on reload); Overflow's spill is
not the Squire's Deep Winter overfill; Chain Lightning is damage leaping between enemies,
never stacks setting each other off (the Apprentice's chain reaction); Tide moves away
where the Slinger's reload stands still, and the Spirit has no cast bars (the Striker's
casts, the Wizard's cast times); Reservoir's release is timing, not execution.

### 11.16 Tier by tier: what each biome gives the Spirit

T1 is §11.4. The agent's extension, approved by the designer for now (*Decided on paper*,
to judge in the game; names and numbers open). Every tier, each biome teaches a lesson
(§11.8), has a weapon, an armor and a charm recipe (its jobs, stronger), and its boss gives
a trophy or ranks one up (§11.9). **Jobs move when a biome retires,** as for the other
classes: after T2 the Forest's (Quickening Wand, Slipstream, Clear Sky) to the Jungle and
the Plains' (Forked Rod, Static Skin, Still Air) to the Volcanic; after T3 the Swamp's
(Drenching Staff, Sealed Vessel, Petrichor) to the Wasteland ("Graveyard" in §7.16) and
the Cave's (Lodestone Orb, Ironbound, Capacitor) to the Trench.

**T2**

| Biome | Threat | Lesson (family, kind) | New gear jobs |
|---|---|---|---|
| Plains | stampedes | **Gale** (squall, new): a gust in front of you blows enemies back a few steps; a charge caught in it stops dead | — |
| Forest | cadence duel, stuns | **Thunderclap II** (squall, rank-up): what the clap staggers also attacks slower for a few seconds | — |
| Mountain | heavy plating, the breakable barrier, charges | **Hailstorm** (strike, new): hail pelts the area around the target for a few seconds; hailstones hit shields and barriers double | — |
| Swamp | pools, rain, the rising mire; Corrosion | **Downpour II** (calm, rank-up): also washes off Corrosion and slows | — |
| Cave | eruptions from below | **Updraft** (calm, new): when the ground is about to erupt under you, a gust lifts you clear | — |
| Jungle (new) | fleeing prey, ambushers from cover | **Flare** (squall, new): a flash around you reveals hidden ambushers and staggers them | Weapon **Lurker's Rod:** your first spend on each new target costs nothing. Armor: anti-ambush base + **Stormsense:** an ambush can't drain your storm below your floor. Charm **Monsoon:** after an ambush hits you, the storm gathers three times as fast for a few seconds |
| Desert (new) | mark, slow, execute; ranged kiters | **Dust Devil** (squall, new): a whirlwind runs down the farthest enemy attacking you and drags it toward you | Weapon **Sirocco Staff:** your spends reach much farther. Armor: ranged-hit base + **Sandshroud:** ranged hits drain the storm at half cost. Charm **Oasis:** while you're marked or slowed, the storm gathers faster |

**T3** (the Plains and Forest have retired)

| Biome | Threat | Lesson (family, kind) | New gear jobs |
|---|---|---|---|
| Mountain | the double charge | **Downburst** (squall, new): a column of wind slams down on a charging enemy and pins it for a moment | — |
| Cave | the tunnel chase | **Updraft II** (calm, rank-up): the gust also throws the surfacing enemy off its feet | — |
| Swamp (last tier) | spores, detonating pools, the drag | **Tailwind** (calm, new): when something drags or shoves you, a gust carries you back | — |
| Jungle (+ the Forest's jobs) | pursuit, flight | **Forked Bolt** (strike, sidegrade of Chain Lightning): splits toward the two enemies farthest from you, catching the fleeing ones | The Forest's jobs move here |
| Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Dust Devil II** (squall, rank-up): the dragged enemy can't move away for a moment | — |
| Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Foehn** (calm, new): when the Chill on you nears its threshold, a warm wind melts it back down | Weapon **Rime Staff:** your spends hit shelled targets (Ice Armor, obsidian, barriers) harder. Armor: chill base + **Insulated:** the Chill builds on you slower while your storm is above the floor. Charm **Aurora:** while you're chilled, the storm gathers faster |
| Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, obsidian shells, hound swarms, burning gunners | **Ash Lightning** (strike, new): the volcano's own lightning; hits harder for each step of the fight's Heat | Weapon **Ember Rod:** the emptier your storm, the harder your spends hit. Armor: heat base + **Flash Steam:** fire damage drains the storm at half cost. Charm **Thermal:** each step of the Heat makes the storm gather a little faster. The Plains' jobs move here |

**T4** (the Swamp and Cave have retired)

| Biome | Threat | Lesson (family, kind) | New gear jobs |
|---|---|---|---|
| Mountain (last tier) | Earthshatter, delayed fault lines | **Downburst II** (squall, rank-up): pins every enemy in a line | — |
| Tundra | Ice Armor at its heaviest | **Sleet** (strike, sidegrade of Hailstorm): a narrow sheet of sleet on one target; breaks shells three times as fast | — |
| Jungle | hard to catch, then it commits | **Ground Charge** (squall, new): a charged patch under you; the first enemy to leap at you is thrown back and stunned | — |
| Desert | three acts: melee, kiter, cornered | **Dust Wall** (squall, sidegrade of Gale): a wall of dust rolls out from you in every direction, pushing everything back | — |
| Volcanic | the Heat race, Magma Shove | **Ash Lightning II** (strike, rank-up): also strikes the enemies around the target | — |
| Wasteland (new; + the Swamp's jobs) | the dead rise; area matters most | **Thunderstorm** (strike, new): for a few seconds, lightning strikes at random among every enemy around you | Weapon **Tempest Staff:** area spends hit harder for each enemy they hit. Armor: base (risen enemies hit softer) + **Gravecloth:** risen enemies' hits drain the storm at half cost. Charm **Wake:** each enemy that rises near you makes the storm gather a burst. The Swamp's jobs move here |
| Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Maelstrom** (squall, new): when the enemy you fight dives out of reach, a whirlpool drags it back to the surface | Weapon **Abyssal Lantern:** your spends hit harder for each different debuff on you. Armor: debuff-resistance base + **Deep Seal:** while you carry three or more debuffs, hits drain the storm a third less. Charm **Abyssal Calm:** each debuff on you makes the storm gather a little faster. The Cave's jobs move here |

**How T3 and T4 test the Spirit:** shells reward burst (Reservoir, Thunderhead, Hailstorm,
Sleet, the Rime Staff); the Tundra and Volcanic bosses accept no control, so the squalls'
control (Thunderclap, Gale, Downburst, Ice Storm, Sandstorm) does nothing there and the
strikes and calms carry; the Heat makes every hit bigger, so the storm drains faster
(Flash Steam, Thermal); the Final Eruption is a damage race (Thunderhead, Gathering Dark,
Spring Tide, Ash Lightning); the Wasteland is the area fight (Thunderstorm, Overcast,
Overflow's spill, the Tempest Staff, Stray Bolts); the Trench piles debuffs (Downpour,
Cleansing Tide, Calm Depths, Deep Seal) and dives (Maelstrom, Depth Charge).

**Overlaps to judge** *(notes)*: the Ember Rod trades defense for damage inside the kit
(§1); Ash Lightning and Thermal both ride the Heat; Downpour II has the shape of the
Squire's Steel Will II, Depth Charge sits near its Lie in Wait, Petrichor near its
Purifying Breath; Crosswind near the Striker's Wide Arc; Ground Charge's stun does nothing
on the control-immune bosses (a counter, as for every class's control). Static Skin
charges, never reflects: thorns stays the Conduit's Bramble (§8.15).

## 12. Striker — Locked (2026-10-14)

**Locked by the designer on 2026-10-14: build authority.** Items still tagged *Proposed*
may change without reopening the section; **Playtest** questions stay open (§12.15).
Outside the lock, each for its own session: names (the designer will rename), Afterglow,
Cascade and Crescendo (kept until something better turns up), leaves after T4 and the
T7–T8 capstone, components (§4), farming efficiency (§13), per-class stats (§5).

Written to the class template (§6) from the 2026-10-13/14 deep dive. Every call in order,
the reasoning and the ideas that were dropped (Momentum for every Striker, the Duelist as a
discipline, the afterimage echo, Flow, Whetstone, Rally as a baseline, Brace, Flashpoint,
Earthshaker, combo-recovery leaves, dual-purpose relics) are in
[striker-deep-dive-log-2026-10-13.md](../docs/briefs/striker-deep-dive-log-2026-10-13.md);
the prep is [striker-deep-dive-prep-2026-10-13.md](../docs/briefs/striker-deep-dive-prep-2026-10-13.md).
No mockup (the designer's call). Tags as everywhere in this bible; **Playtest** marks a
question only the game can answer (§12.15). Names are placeholders throughout: the designer
wants cooler, technique-style names.

The designer's standard class: the game is measured by it and it is the most playtested.

### 12.1 Fantasy

The combo fighter: "I write my combo and watch every hit land, building to a big
finisher." Every boss it beats hands it a new finisher. *Decided.*

### 12.2 Core mechanic

- **A beat is a swing.** The combo is a short loop of beats and you set what each one does:
  a plain swing, a technique, the finisher. Each beat has its own animation, so the player
  watches the combo play out. *Decided.* "Swings" in any rule means every beat, techniques
  included: by late game every beat is a technique. *Decided.*
- **Setups feed the next beat:** a setup changes the beat after it (Feint: the next beat
  crits), so the best setup sits right before the finisher. *Decided.*
- **Casts** sit at two positions, at most one of each per combo, for every Striker: the
  **opener** (first beat; speeds up or strengthens the combo: Focus) and the **wind-up**
  (the beat before the finisher; prepares it: Coil). A cast is a setup paid in time:
  attack speed shortens swings, never casts, so the strongest moves carry a cast and pure
  attack-speed spam can't reach them. Casts are the combo's punctuation and make it
  flashier and weightier. *Decided.*
- **The finisher is the relic,** the boss trophy (§12.9). A plain finisher until the first
  boss kill: the first boss is beaten with the base kit, and the first trophy is the reward
  moment (no starter trophy). *Decided.*
- **A technique's price:** a technique beat deals less swing damage than a plain swing;
  mastering removes the price (§12.3). *Decided.*
- **No resource at T1;** the discipline brings it at T2 (§12.5): the shine, the edge or
  Momentum. *Decided.* **A break** (a stun, a few seconds with no target, the walk) costs
  each discipline its resource: the shine goes out, the edge resets, Momentum drains.
  *Decided.*
- **HUD:** the strip of beats (landed, next, to come) with each beat's technique; from T2,
  the discipline's resource on the strip. **Callouts** only for the announced moves: a
  cast (when it arms, with a cast bar during the wind-up) and the relic finisher, by name;
  ordinary beats never call out. *Decided.*
- The Recovery pulse is gone, and nothing defensive rides the finisher (§12.10). *Decided.*

### 12.3 The class system: the Order

**What you configure** *(Decided)*:

- **The beats:** which technique sits on each beat, and the casts at the two ends, within
  the slots you have.
- **The relic:** your finisher.
- **Rules,** free (§3): Heavy's "don't spend the finisher on a nearly dead target"
  (*Decided*), Crescendo's release rule (§12.6), the universal standing orders.

**Not in it:** abilities outside techniques (no Brace, no Second Wind; §3) and defense
(equipment, §12.10). *Decided.* The Order is short and authored beat by beat; the Slinger
loads whole clips and the Squire answers with response rules, so the three never feel like
the same editor (§3). *Decided.*

**The budget: open, then master.** Each Global Mastery step **opens a slot** (a plain beat
can now carry a technique, paying its price) or, once every beat is open, **masters** one
(that technique pays no price: full effect and full damage). The strip reads grey →
coloured → gold: plain punches, special moves, signature moves. Heavy's short combo runs
out of beats sooner and masters sooner; Light opens longer; the same number of steps gives
each discipline the same growth in a different shape. Combo length is the discipline's,
not the budget's. Shown in class terms ("Techniques 3, next at Mastery 30"). *Decided.*
Illustrative T1: one slot at the start, two at Mastery 15, three at Mastery 30. *Proposed.*

Default configuration: §12.13.

### 12.4 The T1 form

- **Start (Clearing):** a 5-beat combo, four plain swings and a plain finisher, no
  resource. The first ten minutes teach the strip and the finisher. *Decided (shape) /
  Proposed (length).*
- **Each T1 biome's threat teaches its answer:** a technique (that zone's level, before its
  boss), a weapon, an armor and a charm; its boss gives a finisher. *Decided.*

| Biome | Threat | Technique | Weapon | Armor (shared base + Striker line) | Charm (Striker line) | Trophy |
|---|---|---|---|---|---|---|
| Plains | swarms | **Sweep:** hits everything around you (no knockdown at T1) | **Broadblade:** every beat also nicks the nearest other enemy | Plating + **Shoulder Through:** each extra enemy around you adds a little plating | **Grit:** part of every hit you take heals back over a few seconds while you keep attacking; stop and it's lost | Tusked Razorback, **Wide Arc** (spark): the next combo's beats each also strike one enemy beside the target |
| Forest | fast packs | **Hamstring:** the target attacks and moves slower (single target, short) | **Twin Fangs:** fast, light hits, each with a small extra strike | Evasion + **Unbroken:** stuns, knockdowns and slows are shorter and never break your resource | **Rhythm:** Recovery rises the longer you fight without a break, to double after ~10 s | Gnarled Greatbear, **Double Slash** (spark): every beat of the next combo strikes twice, each a bit over half damage |
| Swamp | attrition | **Rend:** a bleed | **Hooked Sickle:** your damage over time lasts longer; the finisher hits a bleeding or rotting target harder | DoT resistance + **Bloodless:** while you keep attacking, damage over time can't take you below a quarter of your HP | **Antidote:** every few seconds, the poison or bleed on you with the most time left ends | Grave Toadeater, **Festering Cut** (weight): the finisher's wound rots, dealing part of its damage again |
| Mountain | the hardest hits | **Coil** (wind-up cast): the finisher hits much harder | **Maul:** slow, heavy beats; a much bigger finisher; faster wind-ups | Damage cap + **Braced Cast:** nothing interrupts your casts; the cap is lower while you cast | **Cairnstone:** after a hit over a quarter of your HP, Recovery triples for a few seconds | Crag Behemoth, **Skyfall** (weight): the finisher becomes a cast, a longer wind-up and a blow about twice as big |
| Cave | elites | **Focus** (opener cast): an efficient attack-speed buff for the combo | **Bastard Sword:** damage techniques and the finisher hit harder; setups wear off sooner | Bulk + **Weighty:** more bulk, slower beats | **Deep Breath:** much faster out-of-combat Recovery | Obsidian Broodmother, **Sunder** (weight): Expose, the target takes more damage from everyone for a few seconds |

Techniques *Decided (shape; Sweep and Hamstring kept modest at T1)*; gear *Decided
(direction)*; trophies *Decided*. Boots stay generic (§4).

- **The first ten minutes:** the plain strip; Sweep around minute 6 in the Plains, the
  answer to the entry spike playtest 3 measured (15 of 177 HP); the first finisher from
  the first boss kill, which the base kit must win without one (*Decided*). By the end of
  T1 a Striker owns five techniques and fields three (the T1 choice), with both casts
  available. *Proposed (pacing illustrative).*

### 12.5 Disciplines (T2)

A considerable power step (§2): the discipline brings the Striker's resource, and they
differ in where the damage lives. *Decided.*

| | Light: the shine | Balanced: the edge | Heavy: Momentum |
|---|---|---|---|
| Fantasy | A storm of blades; the finisher is a flourish that lights the next combo | The technique fighter; the blade sharpens through the combo | Every swing a wind-up for one blow |
| Combo | 7 beats (6 + finisher) | 5 | 4 (3 + finisher) |
| Damage, combo / finisher | ~75 / 25 | ~50 / 50 | ~25 / 75 |
| Rule | The finisher **lights the next combo**: its beats hit harder and carry a spark relic's twist. The shine lasts the next combo's beats, not seconds (today's frame window let attack speed pay twice) | **Rising Edge, by position:** the edge rises a step with every beat; damage techniques and the finisher cut with the current step, so damage placed late hits harder and setups placed early cost nothing; resets at the finisher | **Soft beats build Momentum,** setups multiply it, and the finisher spends it all as the class's biggest hit. Momentum is Heavy's alone and lives on the Striker, never stored on the target (stack-then-detonate is the Apprentice's) |
| Look | A blue sheen on lit beats | A gold edge brightening through the combo, flashing on damage techniques and the finisher | A red crackle on the charged finisher |
| Wants | Attack setups and on-hit (its home) | Damage techniques | Finisher setups and control |
| Relics | Spark relics ride its lit beats | Weight relics land at its peak | Weight relics land on its huge finisher |
| Stat | Attack speed | — | Finisher power, cast speed |
| Leans to | The opener | Either cast | The wind-up |
| Weak at | Plating and shells (small hits) | Builds short of damage techniques | Packs (a huge finisher on a dying mob is wasted) |

Concepts and rules *Decided*; combo lengths, damage shares and Balanced's step (about +15%
per step, the finisher at about +60%) *Proposed, illustrative*.

### 12.6 Specializations (T3)

**Ownership** *(Decided)*: techniques own what each beat does; the relic owns what the
finisher does; the discipline owns the resource that links them; a specialization bends
that resource and may change the finisher's **delivery** (where, when, how often), never
its content; leaves are small turns on all of it. **Specializations are content-neutral:**
no specialization built around one kind of content; weapon, techniques and relic choose
the content. *Decided.*

| Light (the shine) | Balanced (the edge) | Heavy (Momentum) |
|---|---|---|
| **Thousand Cuts:** lit beats fire their on-hit twice. *Decided* | **Iaido** (to rename): every cast sharpens the edge two extra steps; cast damage techniques cut with double the edge. *Decided (concept)* | **Subjugator:** control techniques build double Momentum; the finisher hits a controlled enemy much harder (counter: the T3 Tundra and Volcanic bosses accept no control). *Decided* |
| **Afterimage:** beats hold back part of their damage; the finisher arrives as a multi-cut replaying every slash with its share, then the relic's twist. Replays don't fire on-hit: Thousand Cuts is the proc build, Afterimage the burst build. *Decided; Playtest (the share)* | **Tempered:** the edge falls to half its peak at the finisher instead of resetting; a stun or a drain still resets it. *Decided* | **Frenzy:** as the fight goes on, a second, lighter finisher joins the combo; techniques stay where you put them. *Decided* |
| **Afterglow:** the shine also lights the finisher and lasts one combo more; the Light build for weight relics. *Tentative* | **Cascade:** each damage technique raises the edge an extra step. *Tentative* | **Crescendo:** Momentum stops capping and carries across combos; the finisher fires on a release rule (the target staggered, a shell up, below a share of its HP); purely offensive. *Tentative* |

Afterglow, Cascade and Crescendo stay until something better turns up. *Decided.* Four of
the nine carry across combos or ramp over a fight (Afterglow, Tempered, Crescendo,
Frenzy): watch for one flavour crowding out the rest. *Proposed (note).*

### 12.7 Leaves (T4 onward)

Three per discipline per tier (§2). The Striker's T4 asks **"what kills you?"**: the
spike, the swarm or the slow bleed, one answer each per discipline in its style. Melee
classes get some resilience at T4 (§12.10). *Decided (kept as drafted).*

| | The spike | The swarm | The slow bleed |
|---|---|---|---|
| Light: not being there (blue blur) | **Ghoststep:** once every few seconds, a hit bigger than a quarter of your HP misses | **Slip Through:** the more enemies around you, the more of their hits miss (up to 1 in 3) | **Shake It Off:** debuffs on you wear off twice as fast |
| Balanced: composure (gold) | **Read the Blow:** telegraphed attacks aimed at you deal half damage; mitigation, not a counter | **Centered:** while three or more enemies attack you, you take a fifth less damage | **Poise:** below half HP, your Recovery doubles |
| Heavy: endurance (red) | **Unbreakable:** once per fight, a killing hit leaves you at 1 HP and nothing hurts you for 2 s | **Immovable:** ordinary mobs can't knock you back, slow or stun you | **Thick Blood:** damage over time on you is halved |

Unbreakable brings back cheat-death (its dead code was removed on 2026-09-27) as a
deliberate pick. **Rejected for T4** *(Decided)*: combo-recovery leaves, and long-fight
resilience against farming efficiency (the content split the specializations ruled out;
farming efficiency is §13's). Spare theme for later leaf tiers: **technique
transformations** (Sweep's knockdown, Hamstring spreading, Coil uninterruptible).
*Proposed.*

### 12.8 Techniques, and where every piece comes from

| Piece | Comes from | Status |
|---|---|---|
| Techniques | A zone's level teaches a lesson, before its boss, every tier. A new biome teaches a **new technique**; a returning biome teaches a new technique where a family needs one, a **sidegrade** (the same idea in a new shape: the cast, area or single-target version; you keep both and choose) where its threat changes shape, or a **rank-up** (the earlier technique stronger, with one visible twist per rank, like the trophies). Through T4: 5 at T1, then 19 new and 6 sidegrades in all (§12.16) | Decided (2026-10-14) |
| Technique scaling | **Every technique scales with the Striker's tier**, so a T1 favourite stays fieldable and new lessons add choices instead of replacing old ones (as the Conduit's summons do, §7.2). The Striker fields a handful of beats, not a roster: its variety is choice inside each family, not a large count | Decided (2026-10-14) |
| Technique changes | Picks transform techniques (T3, leaves) | Decided |
| Finishers | Boss trophies in the relic slot; the same lineage's next-tier boss ranks one up | Decided |
| The resource | The T2 discipline | Decided |
| Specialization | The T3 pick | Decided |
| Leaves | T4 onward | Decided |
| Slots and mastery | Global Mastery steps | Decided |

**Three technique families** (the designer's vocabulary): **attack setups** (buffs and
debuffs that make your beats faster or harder), wanted most by Light; **finisher setups
and control**, by Heavy; **damage techniques**, by Balanced. Each tier spreads its
techniques across the three, so every discipline gains from every tier. *Tentative.* The
T2–T4 techniques are in §12.16.

### 12.9 Items

| Slot | The Striker's version | Status |
|---|---|---|
| Weapon | Sets **tempo** (swing speed) and **weight** (hit size), plus one **job**. A job follows you up: every tier has a stronger recipe for each job you know; new biomes add jobs; a retiring biome's jobs move to a biome of the next tier | Decided (direction) |
| Relic | The finisher. One twist each: **spark** relics ride the next combo, **weight** relics land on the finisher. Some relics suit some builds better; no per-discipline versions | Decided |
| Armor | A shared base plus a Striker line. Striker armor asks **"what keeps you swinging?"**: the lines protect the unbroken combo and never trigger on your hits | Decided (direction) |
| Charm | A shared recovery base plus a Striker line. The Conduit's charm asks who recovers; the Striker's asks **"when do you recover?"** | Decided (direction) |
| Boots | Generic | Proposed (§4) |
| Components | §4's own session | Under review |

T1's pieces are in §12.4; T2–T4 in §12.16.

### 12.10 Defense and recovery

- **Defense and recovery live in equipment** (armor and charm) **plus some resilience in
  the T4 leaves; never on combo or finisher triggers.** A shield or heal on the finisher
  would scale with attack speed and push every build into stacking attack speed for both
  offense and defense. *Decided.*
- **Every Striker defensive line follows four rules** *(Decided)*: nothing triggers on your
  hits or finisher; nothing scales with attack speed; nothing makes weak hitters
  irrelevant (no shield you can keep up forever); no resource doubling as a shield (the
  Spirit's identity). "While you keep attacking" is a state, not a trigger, and is allowed.
- **The measured weak spots each have T1 answers:** Plains chip (Shoulder Through, Grit,
  Sweep); Forest pressure (evasion, Unbroken, Rhythm, Hamstring); Swamp poison (Bloodless,
  Antidote; the Striker won 15 of 30 there); the Mountain sawtooth (Braced Cast,
  Cairnstone). *Proposed (bots to check).*
- **Kiting is the class's weakness, on purpose:** Grit, Rhythm and the resources stop
  working when you can't reach the target. The answers are Charge, the Jungle's gear and
  the Desert's Pin (§12.16). *Decided (the designer likes the weakness).*
- Dropped *(Decided)*: Rally as a class baseline (it lives on as the Grit charm line),
  Brace and Second Wind, and the finisher's shield or heal from the brief.

### 12.11 Stance-like modes, rite-like passives

None. The disciplines' resources (the shine, the edge, Momentum) are the class's states.
*Decided.*

### 12.12 Party role

The party's damage dealer and enemy debuffer: Sunder's Expose (everyone deals more), Armor
Break, Hamstring and Subjugator's control help the whole party. Its buffs are self-only.
*Decided (accepted at the lock).* The same debuff from two Strikers doesn't stack: the
strongest copy applies, as for the Conduit's buffs (§7.12). *Decided.*

### 12.13 Bot plan

*Decided (accepted at the lock; defaults and test arms tuned by the bots).* Bots can't
press buttons; every lever is a setting the harness writes.

- **Harness intents:** set the Order (the technique on each beat, the casts); equip the
  relic; set the free rules (Heavy's finisher saving, Crescendo's release).
- **Defaults:** T1, the techniques in family order (a setup early, damage late), Coil once
  owned. Light: Focus, attack setups, a spark relic. Balanced: setups early, damage
  techniques late, a weight relic. Heavy: control and setups, Coil, a weight relic.
- **Metrics:** time to kill, deaths, HP lows (the Plains entry spike), proc counts, the
  share of fight time spent casting.
- **Test arms the design already asks for:** on-hit stacking (Thousand Cuts × Double Slash
  × Twin Fangs); Afterimage's held-back share; Balanced's step size; Frenzy's timing; cast
  lengths against attack speed; the first boss without a relic.

### 12.14 Salvage

| Keep | Where |
|---|---|
| The cadence runtime: beats counted, the finisher on its beat | `server/src/systems/classes/archetypes/cadence/` |
| The frame loop's containers: the window (Light's shine), the bank (Heavy's Momentum, today's Breaker charge) | `cadence/frameLoop.ts` |
| The player cast machine (arm → wind-up → resolve; a stun aborts it; `technique.cast-speed-pct` capped at 60%) for the casts | [abilities-current-state.md](../docs/abilities-current-state.md) |
| The player charge (a short wind-up, then a real rush) for Charge | same |
| Callouts and cast bars | `client/src/render/skillCallouts.ts`, `castBars.ts` |
| The Striker slash (liked), its bespoke effects and the flair stages; the elemental tint layering for blue, gold and red | `client/src/fx/strikerSlash.ts`, `fx/bespoke/striker.ts`, `fx/attackFlair.ts` |
| The rhythm readout's hit pips | become the strip |
| Player bodies through T3 | the atlases |
| The Passive Tree's panel, unlock gate, reset and layers | §2 |
| Old path ideas as references: Shockblade (Thousand Cuts), Justicar (Verdict), Berserker (Frenzy), the old Juggernaut ramp (Crescendo), Phantom-Blade's opener (Charge) | `shared/src/data/skillTree/t3CombatA.ts`, `rootsAndFrames.ts` |

| Remove or rework | Why |
|---|---|
| Frames, range nodes and the nine paths as data | Replaced by disciplines and specializations |
| The Recovery pulse | Dropped |
| Shared abilities with class adapters, and the runes that drive them | Techniques in the Order |
| A frame window counted in seconds | The shine lasts beats |

### 12.15 Open questions

**Playtest:**

1. Every number: combo lengths, damage shares, Balanced's step, the slot steps, technique
   prices, cast lengths.
2. On-hit stacking and turbo (Thousand Cuts, Double Slash, Twin Fangs, Triple Cut).
3. Afterimage's held-back share, Frenzy's timing, Tempered's carry.
4. The first boss without a relic: the base kit must win it (the T1 boss lab once had the
   Striker at 0 of 875 builds on the Plains boss, before the boss passes).
5. The strength of Grit, Bloodless, Ghoststep and Unbreakable.

**Design, later:**

6. Names: cooler and technique-style (trophies, Iaido, many techniques).
7. Afterglow, Cascade and Crescendo: kept until something better turns up.
8. Leaves after T4 (spare theme: technique transformations) and the T7–T8 capstone.
9. Components (§4), farming efficiency (§13), per-class stats (§5).
10. Collisions: marks and Deathmark are the Slinger's; Shatter is the Apprentice's;
    "Juggernaut" is the Squire's discipline (§8.12; the Conduit's summon became Bonecrusher),
    not a Striker piece.

### 12.16 Tier by tier: what each biome gives the Striker

T1 is §12.4. The designer asked for the T1 shapes to be extended to every biome
(2026-10-14); this is the agent's extension, approved by the designer for now
(*Decided on paper*, to judge in the game; names and numbers open). Every tier, each biome
teaches a lesson (§12.8: a new technique, a sidegrade or a rank-up), has a weapon, an
armor and a charm recipe (its jobs, stronger), and its boss gives a trophy or ranks one
up. **Jobs move when a biome retires,** as for the Conduit: after T2 the
Forest's (Twin Fangs, Unbroken, Rhythm) to the Jungle and the Plains' (Broadblade,
Shoulder Through, Grit) to the Volcanic; after T3 the Swamp's (Hooked Sickle, Bloodless,
Antidote) to the Wasteland and the Cave's (Bastard Sword, Weighty, Deep Breath) to the
Trench. A retired lineage's trophy keeps working and scaling; it only stops ranking up.

**T2**

| Biome | Threat | Technique (family) | New gear jobs | Trophy |
|---|---|---|---|---|
| Plains | Stampedes | **Whirlwind** (damage, cast; sidegrade of Sweep): spin through everything around you three times | — | Gorging Razortusk: Wide Arc II, two extra enemies |
| Forest | Cadence duel, stuns | **Feint** (attack setup): no damage; the next beat crits | — | Apex Timberclaw: Double Slash II, each strike stronger |
| Mountain | Heavy plating, charges | **Armor Break** (attack setup): the target's plating cracks for a few seconds | — | Stoneplate Juggernaut: Skyfall II, the blow also ignores part of the plating |
| Swamp | Pools, rain, the rising mire | **Rend II** (rank-up): the bleed lasts longer and cuts deeper | — | Mire-Gorged Behemoth: Festering Cut II, a bigger share |
| Cave | Eruptions from below | **Concuss** (control): a brief stun | — | Chitinous Dreadbore: Sunder II, Expose also cracks plating |
| Jungle (new) | Fleeing prey, ambush from cover | **Charge** (opener cast; the designer's): dash to the target and strike, catching enemies that flee or kite | Weapon **Hunter's Blade:** your first beat on a new target hits much harder. Armor: anti-ambush base + **Watchful:** an ambush can't interrupt a cast or break your combo. Charm **Chase:** Recovery doubles while you close on a target | Jungle Dread-Gorger, **Pounce** (weight): the finisher leaps to the target, reaching it even if it fled, harder the farther it leapt |
| Desert (new) | Mark, slow, execute; ranged kiters | **Pin** (control): roots the target, so it can't kite away | Weapon **Executioner's Blade:** damage techniques and the finisher hit harder against a target below half HP. Armor: ranged-hit base + **Close In:** while a ranged enemy hits you, you move faster toward it. Charm **Shake Off:** every few seconds a mark or slow on you ends | Dune-Stalker Emperor, **Verdict** (weight): the finisher executes a target below a threshold |

**T3** (the Plains and Forest have retired)

| Biome | Threat | Technique (family) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain | The double charge | **Earthsplitter** (damage, wind-up cast): a slam down a line of enemies | — | Crag-Gorged Horn-Behemoth: Skyfall III, a shorter wind-up |
| Cave | The tunnel chase | **Upheaval** (control; sidegrade of Concuss): the ground erupts under the target, knocking it and those touching it down (Sweep's old knockdown arrives here) | — | Deep-Core Burrow-Gorger: Sunder III, longer |
| Swamp (last tier) | Detonating pools, the drag | **Hemorrhage** (damage over time; sidegrade of Rend): a deep bleed that outlasts Rend | — | Rot-Spore Croc-Behemoth: Festering Cut III, the last rank |
| Jungle (+ the Forest's jobs) | Pursuit, flight | **Triple Cut** (damage): three quick hits, three times the on-hit | The Forest's jobs move here | Apex Bramble-Slasher: Pounce II, the landing also hits enemies around it |
| Desert | Postures, the standoff, a dash-escape | **Shadowstep** (opener cast, attack setup): step behind the target; the next beat surely crits | — | Dune-Carapace Monarch: Verdict II, a higher threshold |
| Tundra (new) | The Chill clock, ice armor shells, root casters; bosses accept no control | **Icebreaker** (damage): much harder against a shielded or shelled target (no freeze consumed: shatter stays the Apprentice's) | Weapon **Rimeblade:** beats hit harder against slowed, rooted or chilled enemies. Armor: chill base + **Winter Coat:** the Chill builds on you slower while you keep attacking. Charm **Frostbite Mend:** Recovery doubles while you're chilled or slowed | Frost-Plated Rime-Mammoth, **Hoarfrost** (spark): every beat of the next combo slows the target a little more (bosses that accept no control ignore it) |
| Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, obsidian shells, hound swarms | **Overheat** (opener cast, attack setup): the combo swings much faster, and you take more damage until the finisher | Weapon **Bloodfire Axe:** the lower your HP, the harder your beats hit. Armor: heat base + **Cinderskin:** the Heat's extra damage taken doesn't apply to you while you keep attacking. Charm **Fuel:** your Recovery rises with the Heat. The Plains' jobs move here | Cinder-Shell Magma-Salamander, **Eruption** (weight): the finisher hits the target and everything around it, harder against a shelled target |

How the T3 biomes test the build: shells reward burst (Afterimage, Icebreaker, Eruption,
Skyfall); the Heat lands on you (Overheat's trade, Cinderskin); the Tundra and Volcanic
bosses accept no control (Subjugator's counter; Pin and Hoarfrost do nothing there); the
Final Eruption is a damage race (Frenzy, Coil, Iaido).

**T4** (the Swamp and Cave have retired)

| Biome | Threat | Technique (family) | New gear jobs | Trophy |
|---|---|---|---|---|
| Mountain (last tier) | Every charge answer at once | **Avalanche** (control, wind-up cast; sidegrade of Earthsplitter): a charge through a line that knocks everything down | — | Iron-Crest Titan: Skyfall IV, the last rank |
| Tundra | Ice Armor at its heaviest | **Frostbind** (control; sidegrade of Pin): ice roots everything around the target for a moment (bosses that accept no control ignore it) | — | Glacial Patriarch: Hoarfrost II |
| Jungle | Hard to catch, then it commits | **Bloodrush** (attack setup; sidegrade of Focus, no cast): your beats come faster for the rest of the combo | — | Verdant-Crown Predator: Pounce III |
| Desert | The three-act duel | **Coup de Grâce** (damage): much harder against a target below a third of its HP | — | Dune-Throne Sovereign: Verdict III |
| Volcanic | The Heat race, Magma Shove | **Magma Breaker** (damage, wind-up cast): a blow on the target and everything around it, harder against shells | — | Caldera Sovereign: Eruption II |
| Wasteland (new; + the Swamp's jobs) | The dead rise again; area damage matters most | **Reaping Arc** (damage): a wide cut through every enemy around you | Weapon **Reaper's Scythe:** every beat splashes part of its damage to the enemies around the target. Armor: base (risen enemies hit softer) + **Deathward:** below a quarter of your HP, you take a third less damage. Charm **Requiem:** Recovery rises with the number of enemies around you. The Swamp's jobs move here | Charnel-Crown Sovereign, **Grave Toll** (spark): the next combo's beats hit harder for every enemy in the fight; Light's area-fight trophy (*Tentative: the designer agrees, to confirm in playtests*) |
| Trench (new; + the Cave's jobs) | One enormous duel; the debuff pile; dives out of reach | **Pressure Point** (finisher setup): your next finisher hits this target much harder | Weapon **Exploit:** beats hit harder for each different debuff on the target. Armor: debuff-resistance base + **Clear Mind:** debuffs can't break your combo or interrupt your casts. Charm **Brine Mend:** each debuff on you raises your Recovery a little. The Cave's jobs move here | Elder Trench Serpent, **Deep Pressure** (weight): the finisher deals more the more HP the target has left |

How the T4 biomes test the build: the Wasteland is the area fight (Reaping Arc, Reaper's
Scythe, Wide Arc, Eruption, Grave Toll); the Trench is one enormous duel (Deep Pressure,
Pressure Point, Exploit, Tempered, Crescendo) whose dives, like Magma Shove and the Tundra's
freezes, break combos (Unbroken, Clear Mind, the T4 leaves); Verdict and Coup de Grâce
finish what Deep Pressure opens.

**Totals through T4:** 19 new techniques and 6 sidegrades, plus a rank-up (Rend II),
instead of 26 uniques. By lesson: T2 new Feint, Armor Break, Concuss, Charge, Pin;
sidegrade Whirlwind; rank-up Rend II. T3 new Earthsplitter, Triple Cut, Shadowstep,
Icebreaker, Overheat; sidegrades Upheaval, Hemorrhage. T4 new Coup de Grâce, Magma
Breaker, Reaping Arc, Pressure Point; sidegrades Avalanche, Bloodrush, Frostbind
(*Decided*: the Tundra's T4 rank-up became a control sidegrade so Subjugator has more to
feed on). Every family grows each tier: damage 4 by T2, 11 by T4; attack setups 4 by T2,
7 by T4; finisher setups and control 3 by T2, 7 by T4. Eleven trophies, one per lineage:
spark Wide Arc, Double Slash, Hoarfrost, Grave Toll; weight Festering Cut, Skyfall, Sunder,
Pounce, Verdict, Eruption, Deep Pressure. Afterglow is how Light uses weight ones.

**Overlaps to judge** *(Proposed, notes)*: the Desert stacks execution (Executioner's Blade,
Verdict, Coup de Grâce), on purpose, as the execute lineage; Rimeblade's bonus against
controlled enemies stacks with Subjugator's; Overheat trades defense for speed (§1 allows
trades).

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
The Striker's lock (§12, 2026-10-14) archives nothing: no design doc is the Striker's
alone, and `docs/frames-current-state.md` stays the code's truth until the build replaces
frames. The Squire's lock (§8, 2026-10-14) archives nothing either, for the same reasons.
The Spirit's lock (§11, 2026-10-14) archives nothing either; `docs/barrier-ward-current-state.md`
stays the code's truth until the build turns the barrier into the storm.
