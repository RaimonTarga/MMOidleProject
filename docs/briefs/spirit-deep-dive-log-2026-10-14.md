# Spirit deep dive: decision log (2026-10-14)

> The working record of the Spirit deep dive of the class-first rework (2026-10-14), run in
> parallel with the Apprentice and Slinger dives (and the Squire's). §11 of the
> [class-first bible](../../design_docs/class-first-bible.md) was rewritten to the class
> template from these calls and **locked on 2026-10-14**: §11 is the design; this file is how
> it got there (eleven reviews: the tenth the lock, the eleventh the wrap-up; the reasoning,
> the ideas not taken, the cross-class proposal XC1). "§N" means the bible's section N. Read top to bottom: later reviews override
> earlier entries. Tags: *Decided*, *Tentative* (open to challenge), *Proposed* (the agent's,
> not yet answered).

Prep: [spirit-deep-dive-prep-2026-10-14.md](spirit-deep-dive-prep-2026-10-14.md).

**Carried in (decided before the dive):**

- **Core mechanic:** energy is both the damage resource and the shield; spending it lowers
  defense. *Tentative (brief).* The Spirit's energy shield is its answer to defense (§5).
- **The class system is Thresholds:** rules by energy level and phase. *Tentative (brief).*
  It must not feel like the same editor as the Apprentice's Payoff rules (§3). *Decided
  (distinct editors).*
- **Disciplines:** Overflow (uncapped, buffs, accelerating decay), Reservoir (big bank,
  execute threshold, shield-linked), Tide (surge/ebb cycles). *Tentative (brief).*
- **A resource doubling as a shield is the Spirit's identity:** the Striker's defense rules
  forbid it (§12.10) and the Squire's Resolve never absorbs damage by itself (§8, DR5).
  *Decided.* The Striker's Crescendo stays purely offensive so it doesn't blur with
  Reservoir. *Decided (brief).*
- **The Spirit keeps Tide;** a future Wizard would own cast times instead (§13). *Proposed.*
- From the earlier dives, for every class: rules cost nothing and each class has its own
  budget, grown by Global Mastery in steps (§2, §3); T2 discipline, T3 specialization, T4+
  leaves (§2); offense–defense trades allowed, guardrail *Proposed* (§1); the relic is the
  boss trophy (§4); prefer triggers that work in every fight (§1); the same buff from two
  players doesn't stack (§7.12, §12.12). No abilities outside the class system: Decided for
  the Striker and the Squire, Proposed for every class (§3), to confirm here.

### Review log

*(The designer's calls, in order, as the dive makes them.)*

**First review (2026-10-14):** asked with the question pop-up.

- **Fantasy: F1, the storm in a bottle.** "I carry a storm. It shields me until I let it
  loose." Keeps today's lightning look. *Tentative.*
- **Where it fights: the discipline decides.** *Decided (direction).* The brief scrapped the
  range node ("melee is a commitment, not a dial"); a range set by the discipline is one
  commitment per discipline, not a dial. Still open: where a fresh Spirit fights before T2
  (most players never reach T2), and which discipline fights where.
- **Energy fills from a steady flow,** like breath or mana, not from your hits. *Decided
  (direction).* So attack speed never grows the shield (prep collision 2), and the Spirit's
  decision is when to spend. Whether your hits add a little: *Open.*
  - Agent's note (*Proposed*): a flow refills the shield even under pressure; if it
    outpaces chip damage, weak hitters stop mattering (prep collision 3). The flow must lose
    to sustained pressure, so its rate is set against the shield's size.

**Second review (2026-10-14):** asked with the question pop-up; all three as recommended.

- **Before T2 the Spirit is a short-reach caster:** between melee and today's 130, close
  enough that melee packs sometimes reach it, so the shield matters from the first minute.
  Each discipline then moves it closer or further. *Decided (direction; reach a number to
  set).*
- **The shield is the pool (E1):** hits on you drain the energy bar before your HP, and
  spending drains the same bar. One bar is both. Enemies eat your storm, so you spend it
  before they do. *Decided.* Today's barrier runtime (pool, absorb listener, HUD conduit)
  is the salvage.
- **Spends are the damage:** plain attacks are free but weak; what you let loose from the
  bar carries most of the damage, and holding fire keeps your shield. The spends are the
  Spirit's pieces, and Thresholds place them on the bar. *Decided (direction; the damage
  share is a number to set).*
- Parallel check: the [Apprentice prep](apprentice-deep-dive-prep-2026-10-14.md) leads the
  same split (its Payoff rules read the enemy's stacks, on a stack ring; the Spirit's read
  its own gauge). The [Slinger log](slinger-deep-dive-log-2026-10-14.md) has no calls yet.

**Third review (2026-10-14): the class system, the pieces, the budget.** Pop-up; all as
recommended.

- **Thresholds is a gauge with a floor and bands** *(Decided)*: a vertical gauge, the
  storm's bottle. You set a **floor** (S1: you never spend below it; the shield you always
  keep, though hits can still eat it), put **spends in bands** above it (S2), and pick the
  **phase** (S3): **gather** to full, then break down to the floor (big bursts, then bare),
  or **hover** just above the floor (steady damage, a steady shield). All three are free
  rules (§3). Nothing like the Apprentice's stack ring or the Squire's response list.
- **The pieces are one storm's weathers** *(Decided)*: each biome teaches an aspect of the
  storm: lightning (damage), thunder (stagger, knockback), wind (push, speed), rain or hail
  (area), the eye (calm: the shield). Hail stays a theme, never freeze-then-shatter (the
  Apprentice's, §3).
- **The budget is the bottle's size** *(Decided)*: Global Mastery adds pool pips ("Storm 6,
  next at Mastery 24"), a bigger shield and bigger bursts at once. **Guardrail: gear never
  grows the pool;** gear shapes how the storm fills, spends or absorbs (prep collision 4).
  *Decided.*
- **No abilities outside the class system** holds for the Spirit too (§3): anything else is
  passive, without a callout. *Decided.*

**Fourth review (2026-10-14): the storm under pressure, and the trophies.** Pop-up; all as
recommended.

- **The flow is constant;** taking damage never pauses it. The shield loses to pressure
  because heavy pressure drains it faster than it flows, so the flow's rate is set against
  the pool's size. *Decided.*
- **Damage over time eats the storm like any hit** (poison, bleed, burn ticks). Attrition
  eats your damage resource; the Swamp's threat is real for the Spirit, answered by a rain
  piece and gear lines. *Decided.*
- **Trophies come in two kinds,** one twist each, working in any setup: **spend relics**
  twist every spend; **storm relics** twist the gauge (how it gathers, holds, breaks or
  empties). *Decided.*
- **Base rules, assumed unless the designer objects** *(Proposed)*: BS1 plain attacks are
  free small zaps (about a quarter of the damage; attack speed only speeds them; not called
  "sparks", the Striker's relic kind); BS2 at
  full the flow is wasted (lifting the cap is Overflow's); BS3 the gauge sits beside the HP
  bar with the floor and band marks drawn on it, and the crackle around the character thins
  as the storm drains; BS4 the T1 default is a 30% floor, one Bolt band, gather.
- Parallel check *(notes)*: the Slinger's Siege now banks on the Slinger and fires the bank
  on reload (its log, second review): a second bank-and-release next to Reservoir, kept
  apart if Reservoir's bank stays its shield. The Apprentice's fantasy is the chain
  reaction (detonations that spread); a Spirit chain lightning is a theme crossing (damage
  leaping between enemies), never stacks that set each other off. No other dive uses storm,
  thunder or weather pieces.

**Fifth review (2026-10-14): T1 accepted as drafted.** Pop-up.

- **What each gear slot asks** *(Decided)*: the weapon, **"how does your storm break?"**
  (the shape of your spends: bigger and rarer, smaller and more often, wider, focused, plus
  one job); the armor, **"what happens when they hit your storm?"** (a shared base plus a
  Spirit line on what the storm absorbs and at what cost); the charm, **"what brings your
  storm back?"** (a shared recovery base plus a Spirit flow line bound to a state, never a
  flat faster flow, which would grow offense and defense at once).
- **BS6, each spend waits for its moment:** in its band, a spend fires only when it has
  something to do (Thunderclap only with an enemy touching you, Downpour only with a poison
  or bleed on you); bands still decide when you are willing to spend, and the gauge stays
  the only screen. *Decided.*
- **T1, biome by biome** *(Decided: concepts; names and numbers open)*:

  | Biome | Threat | Piece (weather) | Weapon | Armor (base + Spirit line) | Charm | Trophy |
  |---|---|---|---|---|---|---|
  | Plains | swarms | **Chain Lightning** (lightning): leaps from the target to the 3 nearest enemies | **Forked Rod:** area spends reach one more enemy | Plating + **Static Skin:** an enemy that strikes your storm takes a small shock | **Still Air:** the storm gathers much faster out of combat | Tusked Razorback, **Crosswind** (spend): every spend also strikes the 2 enemies nearest its target, weaker |
  | Forest | fast packs that reach you | **Thunderclap** (thunder): staggers every enemy around you for a moment | **Quickening Wand:** spends cost less and hit less (smaller, more frequent breaks) | Evasion + **Slipstream:** after a dodge you glide a step away from the attacker | **Clear Sky:** while no enemy touches you, the storm gathers faster | Gnarled Greatbear, **Squall** (spend): each spend soon after the last costs a little less |
  | Swamp | attrition, poison | **Downpour** (rain): washes a poison or bleed off you | **Drenching Staff:** spends soak the target; lightning on a soaked target hits harder | DoT resistance + **Sealed Vessel:** poison and bleed ticks drain the storm at half cost | **Petrichor:** a Downpour heals you for part of what it washed off | Grave Toadeater, **Marsh Fire** (storm): when hits empty your storm, it bursts, striking everything around you |
  | Mountain | the hardest hits | **Eye of the Storm** (the eye, a calm piece that sits at the floor): while at or below your floor, hits drain the storm at half cost | **Summit Staff:** spends cost more and hit much harder | Damage cap + **Grounded:** while the storm is at or above your floor, hits can't knock you back or stun you | **Afterstorm:** after a hit over a quarter of your HP, the storm gathers three times as fast for a few seconds | Crag Behemoth, **Thunderhead** (storm): a full storm makes your next spend twice as big |
  | Cave | elites, casters | **Thunderbolt** (lightning): one costly single-target bolt that hits very hard and staggers | **Lodestone Orb:** single-target spends hit harder, area spends softer | Bulk + **Ironbound:** while your storm is empty, your plating doubles | **Capacitor:** while the storm is full, the flow that would be wasted heals you | Obsidian Broodmother, **Static Web** (spend): enemies hit by a spend are charged for a few seconds; your plain zaps hit them twice as hard |

  Notes: the two measured weak spots get three answers each (the Forest: Thunderclap,
  Slipstream, Clear Sky; the Swamp: Downpour, Sealed Vessel, Petrichor). Gather wants the
  Summit Staff, Thunderhead, Marsh Fire, Ironbound; hover wants the Quickening Wand, Squall,
  Static Web, Clear Sky. Crossings (themes, allowed by §3): Static Skin and the Conduit's
  Bramble thorns; Petrichor and the Squire's Purifying Breath; Crosswind and the Striker's
  Wide Arc; Thunderclap's stagger near the Squire's Shove and the Striker's Concuss.
- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain rod, Storm 4 pips and **Bolt** (lightning, the starter spend), set to a 30% floor,
  one Bolt band, gather; the Plains teaches Chain Lightning around minute 6, the answer to
  the Plains entry spike playtest 3 measured (15 of 177 HP); the first boss is won with the
  base kit and gives the first trophy; Storm 4 → 5 at Mastery 15 → 6 at Mastery 30.
- **Next: the disciplines (fantasies first), including where each one fights.** *(Agent's
  agenda.)*

**Sixth review (2026-10-14): the disciplines.** Pop-up; all as recommended.

- **The disciplines, the frames' successors** *(Decided: concepts and rules; numbers and
  looks illustrative)*. The base storm stays (flow, the pool as the shield, spends as the
  damage, floor, bands, phase); each discipline tilts it, sets where the Spirit fights and
  unlocks one piece (§2):

  | | Overflow (light): the storm spills over | Tide (balanced): the storm comes in waves | Reservoir (heavy): the storm held |
  |---|---|---|---|
  | Fantasy | "I'm crackling with more than I can hold, and it pours off me." | "I gather, I break over them, I pull back." | "A deep storm behind a dam; when it's enough, the dam breaks." |
  | Rule | The bottle has a **brim, not a cap:** the flow keeps rising past it, and the excess **arcs off you into the nearest enemies**, faster the more you hold (the brief's accelerating decay, turned into damage). The overflow is shield too | The phase becomes a **tide:** in the **ebb** you can't spend, the flow runs fast and you drift back; in the **surge** you can't gather, spends cost less and you close in. You ebb to full and surge down to the floor | A much **deeper bottle**. A free rule fires **the whole bank when it's enough** to kill the target (or at your mark): release timing, no overkill. A full bank makes you nearly untouchable; releasing it leaves you bare |
  | Range | close (the spill reaches only enemies near you) | moves with the tide: in on the surge, out on the ebb | far: one bolt from afar |
  | Piece | **Ball Lightning:** a slow orb that drifts through the pack, zapping all it passes | **Storm Surge:** the surge opens with a wave that rolls through the enemies in front of you | **Cloudburst:** everything above your floor in one bolt, sized by what you spend |
  | Look | white-blue arcs jumping off you, brighter as you overflow | the storm rising and falling around you | a dark cloud thickening overhead; the release falls from the sky |
  | Old material | Channeler, Surge | Equinox, Aetherist's wave | Voidwalker, Phantasm |
  | Best at / weak at | packs, farming / kiters and ranged enemies (outside the spill), shells | mixed content, parties / enemies that chase you through the ebb, stuns that break a surge | bosses, elites, shells / swarms (long waits between bolts), fast packs that reach it |

- Not taken: Reservoir at the T1 short reach; Overflow's excess as buffs that bleed away
  (the brief's literal reading); Tide's halves as numbers only, standing still; Reservoir
  as just a bigger bottle.
- Notes *(Proposed)*: at range Reservoir is the safest Spirit (prep Evidence 1); its trade
  bites against ranged enemies, area attacks and kiters, which fill T2–T4. Overflow's
  overfill sits near the Squire's Deep Winter trophy (the bar overfills to double); they
  stay apart because Overflow's spill is automatic damage and its overflow is shield.
  Tide's ebb moves the Spirit away, the opposite of the Slinger's stand-still reload.
  Reservoir's release is timing, never "+damage below X%" (the execution pieces are the
  Striker's, the Squire's and the Conduit's).
- **Next: the T3 board.** *(Agent's agenda.)*

**Seventh review (2026-10-14): the T3 board accepted as drafted.** Pop-up.

- **Ownership** *(Decided, as §12.6 and the Squire)*: pieces own what each spend does; the
  relic owns one twist (a spend or the storm); the discipline owns the storm's shape (brim,
  tide, bank) and where it fights; a specialization bends that shape or changes its
  delivery, and stays content-neutral; leaves are small turns on all of it.
- **The T3 board** *(Decided: concepts; names and numbers open)*:

  | Overflow (the spill) | Tide (the waves) | Reservoir (the bank) |
  |---|---|---|
  | **Stormdancer** (old Stormdancer's Flash): while overflowing you blink between enemies; each landing lets loose a burst of the spill. Mobile; reaches kiters | **Spring Tide:** every third tide runs twice as high: that ebb fills the bottle to double and the surge spends it all | **Gathering Dark:** while the bank is full it keeps darkening: the release grows each second you hold it, up to double; the shield doesn't grow |
  | **Spillway:** spends made while overflowing carry the spill to their target: it reaches wherever the bolt lands. Answers the kiter weakness | **Slack Water:** you stand your ground instead of moving with the tide; during the ebb, hits drain the storm at half cost. The steady, tanky Tide | **Overcast:** the release splits into one bolt per enemy around the target, the bank shared between them |
  | **Lightning Rod:** the spill stops arcing around; all of it strikes your target | **Breakwater:** each surge ends in a wave that crashes over everything in front of you, sized by what the surge spent (Storm Surge opens the surge, Breakwater closes it) | **Deep Well:** each release keeps a third of the bank back as your shield: smaller bolts, never bare |

- Old material used: Stormdancer's Flash and Channeler's ramp (Overflow), Equinox's two
  states (Tide), Voidwalker's deep pool and kill-timed release (Reservoir). Tempest's storm
  brand stays dropped (damage over time stacked on the target: the Apprentice's ground).
- Notes *(Proposed)*: Overcast leans to packs, Gathering Dark and Lightning Rod to bosses;
  each is a delivery change, not a spec for one kind of content (as the Squire's board
  noted for Bastion and Inexorable). Gathering Dark is the board's one time ramp.
- **Next: the T4 leaves.** *(Agent's agenda.)*

**Eighth review (2026-10-14): the T4 leaves and the party role.** Pop-up; both as drafted.

- **The Spirit's T4 asks "what empties your storm?"**: the spike, the swarm, the slow drain;
  one answer each per discipline, in its style. Every leaf triggers on enemy hits or your
  own states, never on your hits. *Decided (names and numbers open).* (The Striker asks
  "what kills you?", the Squire "what happens when you can't answer?".)

  | | The spike | The swarm | The slow drain |
  |---|---|---|---|
  | Overflow: the spill takes it | **Shunt:** once every few seconds, a hit worth over a quarter of your storm goes into the spill instead: it costs nothing and arcs back out at enemies | **Static Field:** hits from enemies caught in your spill drain the storm a third less | **Burn Off:** while you overflow, poisons and bleeds on you end twice as fast |
  | Tide: the turn saves you | **Turn of the Tide:** a hit over a quarter of your HP during a surge turns the tide at once: you ebb, pulling back and gathering fast | **Wading:** enemies that follow you through the ebb are slowed | **Cleansing Tide:** every turn of the tide washes one debuff off you |
  | Reservoir: the dam holds | **Dam:** while the bank is above your floor, no single hit drains more than a quarter of the bottle; the rest of that hit is lost | **Levee:** while three or more enemies are around you, hits drain the storm a fifth less | **Calm Depths:** while the bank is full, debuffs on you last half as long |

  Spare idea for later leaf tiers *(Proposed)*: **weather transformations** (Chain
  Lightning leaps once more, Thunderclap knocks down, Downpour also heals, Thunderbolt
  splits).
- **Party role: damage, plus a shared storm.** Mainly damage (Overflow's spill and Overcast
  for packs, Reservoir for bosses), and one shared defense: allies standing in your
  Overflow spill or your Tide's ebb take a little less damage; the same buff from two
  Spirits doesn't stack (§7.12). No healer, no shields lent to allies (the Conduit's
  Icewarden and the Squire's Intercept own those). *Decided.* Note *(Proposed)*: Reservoir
  shares nothing; its party value is boss damage.
- Parallel check: the Squire's dive converged (its log, ninth review); its T4 question,
  leaves and party role don't touch the Spirit's.
- **Next: T2–T4 biome by biome** (the agent's extension, as the Striker's §12.16).

**Ninth review (2026-10-14): T2–T4 approved for now; XC1 accepted; the dive converges.**
Pop-up.

- **T2–T4, biome by biome:** the agent's extension below, approved by the designer for now
  (*Decided on paper*, to judge in the game; names and numbers open), as the Striker's
  §12.16.
- **XC1 accepted** by the designer (see Cross-class proposals): the recharging barrier
  leaves shared gear. It touches §4 and §5, which this dive doesn't edit: to be written
  there by the session that owns them.
- **Next: rewrite §11 to the class template, then walk the unconfirmed proposals before
  the lock.** *Decided (agenda).*

**Tenth review (2026-10-14): the walk-through; §11 locked.** §11 was rewritten to the
class template (§6) in one edit; the designer was walked through every item still
*Proposed* there (pop-up):

- **Base rules accepted** *(Decided)*: the zaps are about a quarter of the damage and attack
  speed only speeds them; at full the flow is wasted, and where a rule says "full",
  Overflow reads its brim; the gauge beside the HP bar with the floor and band marks, the
  crackle thinning as the storm drains; callouts only for the relic's moments and the
  disciplines' big ones (Reservoir's release, a Spring Tide).
- **Static Skin reshaped to a charge** *(Decided)*: an enemy that strikes your storm is
  **charged** (the same charge as the Static Web trophy), and your next spend on it hits
  harder. No damage reflected: thorns stays the Conduit's Bramble (§8.15). In a swarm it
  charges the pack for Chain Lightning. Not taken: keeping the shock as a theme crossing.
- **The rest accepted as drafted** *(Decided)*: the three families (strikes, squalls,
  calms); every piece scales with the Spirit's tier; no rules that answer enemy actions
  and no cast bars; no stance system of its own; Reservoir shares nothing in a party; the
  bot plan and the build tasks (defaults and test arms tuned by the bots); the notes.
- **Fantasy F1 is Decided,** and **§11 is locked** by the designer: build authority. Still
  *Open* by design: whether your hits add a little flow (the base says no).

**Eleventh review (2026-10-14): the wrap-up.** Pop-up.

- **Your hits never add to the flow:** the flow is the only source, so attack speed never
  grows the shield; a later rule-bender may be the one exception. *Decided* (closes the
  last open item; §11.2).
- **Edits outside §11, approved by the designer:** XC1 written into §4 (the armor and charm
  row: no shared base carries a recharging barrier; timed wards stay) and §5 (the Spirit's
  entry now points to §11.10 and records XC1); a §14 line (the Spirit's lock archives
  nothing). *Decided.*
- **Commit:** only the Spirit's changes (§4, §5, the §11 status row, §11, §14, its two
  README lines, the prep and this log), staged hunk by hunk; the Apprentice session's
  uncommitted §9 lock stays in the working tree for its own commit. *Decided.*

**T2–T4 biome by biome** *(the agent's extension; names placeholders)*. Every tier, each biome teaches a lesson (a new piece, a sidegrade or
a rank-up with one visible twist), has a weapon, an armor and a charm recipe (its jobs,
stronger), and its boss gives a trophy or ranks one up. Every piece scales with the
Spirit's tier, so a T1 favourite stays fieldable (as §7.2, §12.8). **Jobs move when a biome
retires:** after T2 the Forest's (Quickening Wand, Slipstream, Clear Sky) to the Jungle
and the Plains' (Forked Rod, Static Skin, Still Air) to the Volcanic; after T3 the Swamp's
(Drenching Staff, Sealed Vessel, Petrichor) to the Wasteland ("Graveyard" in §7.16) and
the Cave's (Lodestone Orb, Ironbound, Capacitor) to the Trench.

**Piece families** (vocabulary): **strikes** (damage), **squalls** (control and movement),
**calms** (protection). Overflow wants strikes with reach, Tide squalls (it moves), and
Reservoir big strikes and calms (it holds).

- **T2**

  | Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Plains | stampedes | **Gale** (squall, new): a gust in front of you blows enemies back a few steps; a charge caught in it stops dead | — | Gorging Razortusk: Crosswind II, three enemies |
  | Forest | cadence duel, stuns | **Thunderclap II** (squall, rank-up): what the clap staggers also attacks slower for a few seconds | — | Apex Timberclaw: Squall II, the discount builds faster |
  | Mountain | heavy plating, the breakable barrier, charges | **Hailstorm** (strike, new): hail pelts the area around the target for a few seconds; hailstones hit shields and barriers double | — | Stoneplate Juggernaut: Thunderhead II, the doubled spend also ignores part of the plating |
  | Swamp | pools, rain, the rising mire; Corrosion | **Downpour II** (calm, rank-up): also washes off Corrosion and slows | — | Mire-Gorged Behemoth: Marsh Fire II, the burst also washes a debuff off you |
  | Cave | eruptions from below | **Updraft** (calm, new): when the ground is about to erupt under you, a gust lifts you clear | — | Chitinous Dreadbore: Static Web II, the charge lasts longer |
  | Jungle (new) | fleeing prey, ambushers from cover | **Flare** (squall, new): a flash around you reveals hidden ambushers and staggers them | Weapon **Lurker's Rod:** your first spend on each new target costs nothing. Armor: anti-ambush base + **Stormsense:** an ambush can't drain your storm below your floor. Charm **Monsoon:** after an ambush hits you, the storm gathers three times as fast for a few seconds | Jungle Dread-Gorger, **Running Storm** (spend): a spend whose target flees follows it and lands harder the farther it ran |
  | Desert (new) | mark, slow, execute; ranged kiters | **Dust Devil** (squall, new): a whirlwind runs down the farthest enemy attacking you and drags it toward you | Weapon **Sirocco Staff:** your spends reach much farther. Armor: ranged-hit base + **Sandshroud:** ranged hits drain the storm at half cost. Charm **Oasis:** while you're marked or slowed, the storm gathers faster | Dune-Stalker Emperor, **Sandstorm** (storm): while you're above your floor, a ring of blowing sand slows the enemies inside it |

- **T3** (the Plains and Forest have retired)

  | Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain | the double charge | **Downburst** (squall, new): a column of wind slams down on a charging enemy and pins it for a moment | — | Crag-Gorged Horn-Behemoth: Thunderhead III, a storm at four-fifths counts as full |
  | Cave | the tunnel chase | **Updraft II** (calm, rank-up): the gust also throws the surfacing enemy off its feet | — | Deep-Core Burrow-Gorger: Static Web III (last rank), a charged enemy passes its charge to one enemy touching it |
  | Swamp (last tier) | spores, detonating pools, the drag | **Tailwind** (calm, new): when something drags or shoves you, a gust carries you back | — | Rot-Spore Croc-Behemoth: Marsh Fire III (last rank), a bigger burst |
  | Jungle (+ the Forest's jobs) | pursuit, flight | **Forked Bolt** (strike, sidegrade of Chain Lightning): splits toward the two enemies farthest from you, catching the fleeing ones | The Forest's jobs | Apex Bramble-Slasher: Running Storm II |
  | Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Dust Devil II** (squall, rank-up): the dragged enemy can't move away for a moment | — | Dune-Carapace Monarch: Sandstorm II, a wider ring |
  | Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Foehn** (calm, new): when the Chill on you nears its threshold, a warm wind melts it back down | Weapon **Rime Staff:** your spends hit shelled targets (Ice Armor, obsidian, barriers) harder. Armor: chill base + **Insulated:** the Chill builds on you slower while your storm is above the floor. Charm **Aurora:** while you're chilled, the storm gathers faster | Frost-Plated Rime-Mammoth, **Ice Storm** (spend): every spend glazes the ground under its target; enemies on it are slowed (bosses that accept no control ignore it) |
  | Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, obsidian shells, hound swarms, burning gunners | **Ash Lightning** (strike, new): the volcano's own lightning; hits harder for each step of the fight's Heat | Weapon **Ember Rod:** the emptier your storm, the harder your spends hit. Armor: heat base + **Flash Steam:** fire damage drains the storm at half cost. Charm **Thermal:** each step of the Heat makes the storm gather a little faster. The Plains' jobs move here | Cinder-Shell Magma-Salamander, **Pyrocumulus** (storm): a full storm boils over: while you stay full, a burst strikes around you every few seconds |

- **T4** (the Swamp and Cave have retired)

  | Biome | Threat | Lesson (family, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain (last tier) | Earthshatter, delayed fault lines | **Downburst II** (squall, rank-up): pins every enemy in a line | — | Iron-Crest Titan: Thunderhead IV (last rank), the doubled spend also staggers |
  | Tundra | Ice Armor at its heaviest | **Sleet** (strike, sidegrade of Hailstorm): a narrow sheet of sleet on one target; breaks shells three times as fast | — | Glacial Patriarch: Ice Storm II |
  | Jungle | hard to catch, then it commits | **Ground Charge** (squall, new): a charged patch under you; the first enemy to leap at you is thrown back and stunned | — | Verdant-Crown Predator: Running Storm III |
  | Desert | three acts: melee, kiter, cornered | **Dust Wall** (squall, sidegrade of Gale): a wall of dust rolls out from you in every direction, pushing everything back | — | Dune-Throne Sovereign: Sandstorm III |
  | Volcanic | the Heat race, Magma Shove | **Ash Lightning II** (strike, rank-up): also strikes the enemies around the target | — | Caldera Sovereign: Pyrocumulus II |
  | Wasteland (new; + the Swamp's jobs) | the dead rise; area matters most | **Thunderstorm** (strike, new): for a few seconds, lightning strikes at random among every enemy around you | Weapon **Tempest Staff:** area spends hit harder for each enemy they hit. Armor: base (risen enemies hit softer) + **Gravecloth:** risen enemies' hits drain the storm at half cost. Charm **Wake:** each enemy that rises near you makes the storm gather a burst | Charnel-Crown Sovereign, **Stray Bolts** (spend): every spend also strikes a random enemy elsewhere in the fight |
  | Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Maelstrom** (squall, new): when the enemy you fight dives out of reach, a whirlpool drags it back to the surface | Weapon **Abyssal Lantern:** your spends hit harder for each different debuff on you. Armor: debuff-resistance base + **Deep Seal:** while you carry three or more debuffs, hits drain the storm a third less. Charm **Abyssal Calm:** each debuff on you makes the storm gather a little faster | Elder Trench Serpent, **Depth Charge** (storm): while your target is out of reach, the storm gathers double; your first spend when it resurfaces is doubled |

- **How T3 and T4 test the Spirit:** shells reward burst (Reservoir, Thunderhead,
  Hailstorm, Sleet, the Rime Staff); the Tundra and Volcanic bosses accept no control, so
  the squalls' control (Thunderclap, Gale, Downburst, Ice Storm, Sandstorm) does nothing
  there and the strikes and calms carry; the Heat makes every hit bigger, so the storm
  drains faster (Flash Steam, Thermal); the Final Eruption is a damage race (Thunderhead,
  Gathering Dark, Spring Tide, Ash Lightning); the Wasteland is the area fight
  (Thunderstorm, Overcast, Overflow's spill, the Tempest Staff, Stray Bolts); the Trench's
  debuff pile (Downpour, Cleansing Tide, Calm Depths, Deep Seal) and dives (Maelstrom,
  Depth Charge).
- **Totals through T4:** 6 T1 pieces (Bolt and five lessons) and 3 discipline pieces; T2
  five new (Gale, Hailstorm, Updraft, Flare, Dust Devil) and two rank-ups; T3 four new
  (Downburst, Tailwind, Foehn, Ash Lightning), one sidegrade (Forked Bolt), two rank-ups;
  T4 three new (Ground Charge, Thunderstorm, Maelstrom), two sidegrades (Sleet, Dust
  Wall), two rank-ups. By family: strikes 8 + 3 discipline pieces, squalls 8, calms 5
  (Tailwind counted as a calm).
  Eleven trophies: spend relics Crosswind, Squall, Static Web, Running Storm, Ice Storm,
  Stray Bolts; storm relics Marsh Fire, Thunderhead, Sandstorm, Pyrocumulus, Depth Charge.
- **Overlaps to judge** *(notes)*: Ember Rod trades defense for damage (the emptier the
  storm, the harder you hit): a trade inside the kit (§1); Ash Lightning and Thermal both
  ride the Heat; Downpour II and the Squire's Steel Will II have the same shape; Depth
  Charge sits near the Squire's Lie in Wait; Ground Charge's stun does nothing on the
  control-immune bosses (a counter, as for the Striker's and Squire's control).

### Cross-class proposals

*(Proposals that touch §1–§6, §13 or another class's section. The designer decides; this
dive never edits them.)*

- **XC1, the recharging barrier leaves shared gear** (*Accepted by the designer
  2026-10-14, ninth review; written into §4 and §5 with the designer's approval at the
  wrap-up*): today
  the Mountain and Tundra charms give any class a barrier that recharges between fights
  (`defense.barrier-pct`, [barrier-ward-current-state.md](../barrier-ward-current-state.md)).
  In the rework the Spirit's storm takes over that runtime as its pool, and shared armor and
  charm bases protect in other shapes (wards that expire, damage caps, plating, DoT
  resistance), so only the Spirit carries a standing shield. Why: a standing shield on every
  class blurs the Spirit's identity, and on the Striker it breaks "no shield you can keep up
  forever" (§12.10). Timed wards (overheal, the Conduit's Icewarden shells) are a different
  shape and stay.
