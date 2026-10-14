# Apprentice deep dive: decision log (2026-10-14)

> The working record of the Apprentice's class deep dive in the class-first rework. The
> design itself is §9 of the [class-first bible](../../design_docs/class-first-bible.md),
> rewritten to the class template (§6) in one edit and **locked on 2026-10-14**; this file
> is how it got there: every call in order (twelve reviews, then the lock), the reasoning,
> and the ideas not taken. "§N" means the bible's section N. Read top to bottom: later
> reviews override earlier entries.

Prep: [apprentice-deep-dive-prep-2026-10-14.md](apprentice-deep-dive-prep-2026-10-14.md).
Tags: *Decided*, *Tentative* (open to challenge), *Proposed* (the agent's, unanswered).

**Carried in (decided before the dive):**

- **Core mechanic:** attack converts to element stacks. *Tentative (brief).*
- **The class system is Payoff rules:** where stacks go on death, when to detonate, what
  triggers spread. *Tentative (brief).*
- **Disciplines:** Poison (spreads; packs), Fire (detonate for burst), Frost (slow → freeze
  → shatter; bosses); a second element and reactions around T5–T6 (§13). *Tentative
  (brief).*
- **Freeze-then-shatter and stack-then-detonate are the Apprentice's signature payoffs;**
  other classes may use the elements, not those payoffs. *Decided (§3).*
- **DoT weapons were a trap** (attack conversion favoured slow, heavy weapons); class DoT
  weapons (stacks, tick speed, spread) fix it. The front-weighted stack curve goes.
  *Known issue (brief) / Tentative (curve).*
- From the earlier dives, for every class: rules cost nothing and each class has its own
  budget, grown by Global Mastery (§2, §3); T2 discipline, T3 specialization, T4+ leaves
  (§2); the relic is the boss trophy (§4); prefer triggers that work in every fight (§1);
  defense in equipment, never on attack-speed triggers (§12.10); the same debuff from two
  players doesn't stack (§7.12). No abilities outside the class system: *Decided* for the
  Striker and the Squire, *Proposed* for every class.

### Review log

*(The designer's calls, in order, as the dive makes them.)*

**First review (2026-10-14), asked with the question pop-up:**

- **Fantasy: the student of three schools (F2) and the chain reaction (F3).** The arc: an
  apprentice who learns every school and masters one. The moment: one spark and the whole
  pack goes up. *Decided (both; no weighting given).* Not taken: F1, the patient killer.
- **T1 is raw magic; the element comes at T2 (T1-C).** One neutral kind of stack at T1,
  and every T1 lesson works on it. The T2 discipline gives the stacks an element and turns
  its school's lesson into the signature payoff. *Decided (direction).* Not taken: T1-A
  (three schools, the weapon sets the element) and T1-B (one element from the start).
- **Poison spreads over time, with no waste.** A target at full stacks passes one stack to
  its nearest neighbour every second (time, not kills). Separately, a dying enemy's leftover
  stacks pass on: this adds no damage, it only stops waste, so it is argued as an
  exception to §1 rather than an on-kill power. *Decided (direction; numbers open).* Not
  taken: time spread alone, overflow past the cap, on-death spread as the brief wrote it.
  The §1 wording is a cross-class proposal (XC1).

**Second review (2026-10-14), asked with the question pop-up:**

- **No abilities outside the class system** holds for the Apprentice (§3): every
  Apprentice action is a payoff piece inside the Payoff rules; Contagion, Detonate and
  Imbue become pieces or go; gear, relics and leaves stay passive. *Decided.* Not taken: a
  manual Detonate button.
- **Master one school, keep the basics of all three (A3).** At T2 the sigils take the
  discipline's element and every T1 lesson keeps working on them; only the discipline's own
  school turns its lesson into the signature: Poison's Spread becomes the walking plague,
  Fire's Detonate a chain, Frost's Bind a real Freeze, and a Detonate on a frozen target
  Shatters. *Decided.* Not taken: losing the other schools' lessons at T2, or keeping one.
- **Every discipline has its own chain reaction (A4):** Poison creeps (the plague walks
  through the pack on its own), Fire blasts (a detonation throws burn onto the enemies
  around it; a neighbour pushed to full goes off too), Frost spreads cold (a shatter chills
  its neighbours, setting up the next freeze). Each enemy goes off at most once per chain.
  *Decided (concepts; numbers open).* Not taken: chains for Fire only, or as T3
  specializations.
- Shown alongside, not asked separately *(Proposed)*:
  - **A1, Sigils** (placeholder name): the raw-magic stack, drawn on the enemy, violet at
    T1, the element's colour from T2. Not "Hex": the T4 Charnel-Crown boss casts Hexes.
  - **A2, five T1 lessons, none tied to an element**, a draft for the T1 round: Spread
    (Plains), Sap (Forest: each sigil slows a little), Siphon (Swamp: your ticks heal you,
    capped per second; Second Wind's job), Bind (Mountain: when the target winds up, spend
    its sigils to seize it and break the blow), Detonate (Cave: cash in every sigil at once).
    Note: Bind and the Squire's Shield Bash both break a wind-up; Bind spends the sigils it
    built and works from range. Check against the Squire's T1 before the T1 round.
  - **A5, the decisions live in the rules:** at full sigils, spread or detonate; on a boss,
    let them tick or cash in when its shell goes up; spend frost on a wind-up or save it for
    the shatter.

**Third review (2026-10-14), asked with the question pop-up:**

- **The budget is the sigil cap (B1):** Global Mastery's steps raise how many sigils every
  enemy can hold ("Sigils 5, next at Mastery 24"), so every payoff grows with it. The
  Apprentice is the one class whose room is visible on the enemies. *Decided (numbers
  open).* Risk noted: a bigger bar takes longer to fill; weapons that lay more sigils per hit
  offset it. Not taken: prepared lessons (B2), Focus charges (B3).
- **The Payoff screen is moments on the enemy (P1):** an enemy card with its sigil ring and
  six moments around it (full, winds up, low, shell up, frozen, dies); the player drops a
  lesson on a moment and may add a condition ("only with 3+ enemies near"). Rules are free
  (§3). *Decided (concept; the moment list open).* Not taken: an if-then list (P2), a
  trigger on each lesson (P3).
- **The weapon sets how sigils build (W1),** the fix for the DoT-weapon trap: sigil damage
  comes from the weapon's potency and the Apprentice's tier, never from the hit; fast
  weapons fill and spread (breadth), heavy weapons lay more sigils per hit and hit harder
  directly (depth), so neither wins at the cap. *Decided (direction; numbers open).* Not
  taken: pure sigils with no direct damage (W2), today's conversion capped per hit (W3).

**Fourth review (2026-10-14), asked with the question pop-up:**

- **Frost on bosses that accept no control: Brittle (FZ1).** A freeze stops ordinary
  enemies (and breaks their wind-ups); on a boss that accepts no control (the T3–T4 Tundra
  and Volcanic bosses) it makes the boss Brittle for a few seconds instead: no stop, more
  damage taken, still shatterable. Frost keeps its boss role everywhere. *Decided
  (concept; numbers open).* Not taken: accepting the counter (FZ2), freeze never being
  control (FZ3).
- **Trophies come in two kinds (R1):** payoff relics change what a payoff does; sigil relics
  change how sigils build or behave. No discipline-only relics; plain payoffs until the
  first boss kill (no starter trophy), as for the other classes. *Decided.* Not taken:
  payoff relics only (R2), school relics (R3).
- **Siphon is a payoff (D1):** spend a target's sigils to heal yourself instead of
  damaging it; a rule chooses when (e.g. at low HP); a cooldown stops attack speed farming
  it. Second Wind's job moves inside the class system, as the Squire's defense does.
  *Decided (concept; numbers open).* Not taken: a passive drain (D2), gear only (D3).

**Fifth review (2026-10-14): T1 accepted as drafted.** Pop-up; all as recommended.

- **What each gear slot asks** *(Decided)*: the weapon, **"how do your sigils build?"**
  (W1: speed, sigils per hit, tick speed, duration, cap, plus one job); the armor, **"what
  buys you the time?"** (a shared base plus an Apprentice line that keeps you alive while
  the sigils work); the charm, **"what does the affliction give back?"** (a shared recovery
  base plus a line bound to a state of the enemies carrying your sigils, never to your
  hits).
- **Detonate is the starting payoff** (moved from the Cave, which now teaches Converge), as
  the Squire's plain slam, the Spirit's Bolt and the Slinger's plain clip. So T1 seeds every
  school twice: Fire (Detonate, Converge), Frost (Numb, Seize), Poison (Spread, Siphon).
  *Decided.*
- **Seize stays,** a theme crossing with the Squire's Shield Bash (§3): it spends the
  sigils you built, works from range and sits on the enemy's "winds up" moment. *Decided.*
- **Lessons are payoffs:** everything a lesson does happens at a moment on the Payoff
  screen. How sigils behave between moments belongs to the weapon and to sigil relics.
  *Decided (follows from the table).*
- **T1, biome by biome** *(Decided: concepts; names and numbers open)*:

  | Biome | Threat | Lesson (school) | Weapon | Armor (base + Apprentice line) | Charm | Trophy |
  |---|---|---|---|---|---|---|
  | Plains | swarms | **Spread** (Poison): a full target passes a sigil to its nearest neighbour every second | **Branching Wand:** fast, light; each hit also lays a sigil on the nearest other enemy | Plating + **Warding Sigils:** each enemy carrying your sigils deals a little less damage to you (capped) | **Feeding Swarm:** Recovery rises a little for each enemy carrying your sigils (capped) | Tusked Razorback, **Outbreak** (payoff): a Spread passes to two neighbours |
  | Forest | fast packs; the Greatbear's attack-speed race | **Numb** (Frost): spend a target's sigils to slow its attacks and movement for a few seconds, longer the more it carried | **Thornwood Rod:** fast; sigils tick twice as fast for half as long | Evasion + **Slip Away:** while an enemy carrying your sigils is in melee reach, you move faster | **Numbing Calm:** while two or more enemies near you are numbed, Recovery doubles | Gnarled Greatbear, **Firstbrand** (sigil): the first hit on an enemy carrying none of your sigils lays three |
  | Swamp | attrition | **Siphon** (Poison): spend a target's sigils to heal yourself; a cooldown | **Bog Censer:** slow; sigils linger long after you stop; Siphon heals more | DoT resistance + **Bitter Blood:** poison and bleed on you tick slower | **Bitter Tonic:** Siphon heals more and comes back sooner | Grave Toadeater, **Glut** (payoff): Siphon also drains every enemy near the target |
  | Mountain | the hardest hits, telegraphed | **Seize** (Frost): spend a target's sigils to hold it for a moment, breaking its wind-up | **Runestone Staff:** slow, heavy; three sigils per hit and +1 to the cap (the brief's Frostbrand Staff) | Damage cap + **Stone Sigil:** part of a hit over a quarter of your HP arrives as damage over time instead (today's root mechanic) | **Still Mind:** after a Seize breaks a wind-up, Recovery triples for a few seconds | Crag Behemoth, **Petrify** (payoff): a Seize lasts longer and the held enemy takes more damage |
  | Cave | elites, casters | **Converge** (Fire): pull the sigils of every enemy near the target onto it, past its cap | **Deep Grimoire:** payoffs pay more; sigils tick a bit weaker | Bulk + **Sigil Weight:** a winding-up enemy's blow is weaker for each sigil it carries (up to a third) | **Long Draw:** while an elite or boss carries a full bar of your sigils, Recovery rises | Obsidian Broodmother, **Brood Sigils** (sigil): an enemy carrying three or more of your sigils grows one more every 2 s |

  The measured weak spots each get three answers: the Greatbear's race (Numb, Firstbrand,
  Numbing Calm), the Toadeater's attrition (Siphon, Bitter Blood, Bitter Tonic), the
  Behemoth's one big blow (Seize, Sigil Weight, Still Mind; its Crag Charge cast carries no
  `uninterruptible` flag in `bossesT1.ts`, so Seize can break it). Crossings (themes,
  allowed by §3): Firstbrand with the Slinger's Carbine openers and the Striker's Hunter's
  Blade; Still Mind with Cairnstone (it triggers on a Seize instead of a big hit).
- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain wand, Sigils 4 shown as pips on enemies, and one moment filled (full → Detonate);
  the Plains teaches Spread around minute 6 with its default (full and two or more enemies
  near → Spread, otherwise Detonate), the player's first real choice and the answer to the
  Plains entry spike; the first boss is won with the base kit and gives the first trophy;
  Sigils 4 → 5 at Mastery 15 → 6 at Mastery 30. By the end of T1 the Apprentice owns six
  payoffs.
- **Next: the disciplines in detail.** *(Agent's agenda.)*

**Sixth review (2026-10-14): the disciplines accepted as drafted.** Pop-up; all as
recommended.

- **The disciplines, the frames' successors** *(Decided: concepts and rules; numbers and
  looks illustrative)*. The base kit stays (sigils, moments, the six T1 payoffs, the cap as
  budget); each discipline gives the sigils an element, turns its school's lesson into the
  signature (A3) and unlocks one piece (§2) that covers its weak content:

  | | Poison: the plague | Fire: the blast | Frost: the freeze |
  |---|---|---|---|
  | Fantasy | "I touch one, and the whole pack is already dying." | "One spark, and they go up one after another." | "I lock the giant in ice, then break it." |
  | Sigils become | Small and many: the cap holds 2 more, ticks fast (Venom vessel) | Burn: hits into a full-burn target strike harder (Ember mage) | Few and heavy: the cap holds 1 fewer; each sigil slows a little (Rime-Bound) |
  | Signature | **The walking plague:** Spread stops being a payoff and happens on its own (a full target passes a sigil each second; a dying one passes on what's left), freeing the "full" moment | **Chain Detonate:** a detonation throws burn onto every enemy around it; any pushed to full goes off too, each once per chain | **Freeze:** Seize becomes a real freeze (Brittle on bosses that accept no control); a Detonate on a frozen or brittle target **Shatters**, a heavy hit whose cold chills its neighbours |
  | New piece | **Wither:** spend a target's sigils so it deals less damage for a few seconds (the boss floor) | **Fuse:** the target's sigils blow in 3 s, and everything laid meanwhile adds to the blast (shells, lone elites) | **Cold Snap:** spend a target's sigils to chill every enemy around it (the pack answer) |
  | Damage, ticks / hits / payoffs (illustrative) | ~60 / 20 / 20 | ~30 / 20 / 50 | ~30 / 25 / 45 |
  | Look | green motes creeping enemy to enemy | orange sigils that flare, then blow in sequence | pale frost creeping over the body; an ice shell; shards on the shatter |
  | Old material | Venom vessel, Venomslinger, Cultist, Warlock's neighbour stack | Ember mage, Pyromancer's Radiant, Cinder Lord, Firebrand | Rime-Bound, Winter Warden, Icebreaker, Wind Spirit |
  | Weapons | Branching Wand, Thornwood Rod, Bog Censer | Deep Grimoire, Runestone Staff | Runestone Staff, Bog Censer |
  | Best at / weak at | packs, farming / bosses alone, burst races (the Final Eruption), DoT-resistant families | clumped packs, elites, shells / spread-out kiters, long single-target fights between blasts | bosses, elites / swarms (one freeze at a time), its slower ramp |

- **Ownership** *(Decided)*: the lessons own what happens at each moment; the weapon owns
  how sigils build; the relic twists one payoff or the sigils; the discipline owns the
  element; a specialization bends the signature or the chain's delivery, never what a
  lesson does.
- **One range for all three disciplines:** the discipline changes what sigils do, not where
  the Apprentice stands, which keeps it clear of the Spirit's range by discipline.
  *Decided.* Not taken: Poison closer and Frost further.
- Note *(Proposed)*: Fire's chain and Poison's plague both reach across packs; they stay
  apart by speed and cost (the plague creeps for free, the chain spends sigils at once).
- **Next: the T3 board.** *(Agent's agenda.)*

**Seventh review (2026-10-14): the T3 board accepted as drafted.** Pop-up.

- **The specializations** *(Decided: concepts; names and numbers open)*. Each bends its
  discipline's signature or the chain's delivery (where, when, who it reaches), never what a
  lesson does:

  | Poison (the plague) | Fire (the blast) | Frost (the freeze) |
  |---|---|---|
  | **Carrier:** the plague also walks from you: every enemy near you catches a sigil each second (where) | **Afterburn:** a detonation leaves half its sigils burning on the target, so the next blast comes sooner (what's left) | **Ice Tomb** (old Winter Warden): a frozen target stays frozen until you shatter it (up to ~6 s); a Brittle boss stays brittle until shattered, capped (when) |
  | **Ripening** (old Cultist, reshaped): sigils darken as they age; one older than ~5 s ticks double; the walking plague passes on its ripest sigil (how the plague grows) | **Long Fuse:** every detonation waits 2 s and grows with everything laid meanwhile; the chain carries the extra (when) | **Creeping Frost:** a target reaching the cap freezes on its own, once every ~8 s per target; the freeze comes from the sigils, freeing the "winds up" moment (how the freeze arrives) |
  | **Wasting:** Wither's weakening stays on any enemy carrying a full bar, so plagued packs and bosses hit softer (the plague as a defense) | **Hair Trigger:** the chain sets off any enemy carrying sigils, not only those it pushes to full; each pays what it carries (who it reaches) | **Shardstorm:** a shatter's shards fly to the 3 nearest enemies, laying frost sigils; a frozen one hit by a shard shatters too, once per chain (who it reaches) |

- Notes *(Proposed)*: Hair Trigger and Shardstorm lean to packs and Ice Tomb to bosses
  (watch them against content-neutrality, as the Squire noted Bastion and Inexorable); the
  other six work in both kinds of fight. Ripening is the board's only ramp: visible (the
  sigils change colour) and per sigil, not a vanilla percentage. Shardstorm and Hair
  Trigger multiply, so the bots watch them with the once-per-chain cap. Old paths not
  used: Zealot (attack speed at full), Firebrand (Firstbrand has its opener), Icebreaker
  (now a Striker technique's name), Wind Spirit (a vanilla multiplier).
- **Next: the T4 leaves.** *(Agent's agenda.)*

**Eighth review (2026-10-14): the T4 leaves accepted as drafted.** Pop-up.

- **The Apprentice's T4 asks "what reaches you?":** whatever gets past a ranged class's
  distance (the charger, the ambusher, the shooter), answered in each discipline's style.
  These are the Apprentice's T4 resilience. Every leaf triggers on an enemy's action (its
  charge, its arrival, its shot), never on your hits, so attack speed can't farm them
  (§12.10). *Decided (names and numbers open).*

  | | The charger (closes the gap) | The ambusher (appears beside you) | The shooter (hits from range) |
  |---|---|---|---|
  | Poison: they catch it | **Thick Air:** an enemy that charges or leaps at you lands carrying a full bar, slowed for a moment | **Taint:** an ambusher's first hit on you is halved, and it arrives carrying a full bar | **Windborne:** your plague also walks to whoever hits you from range, however far |
  | Fire: blast them back | **Fire Ward:** once every few seconds, an enemy reaching melee range sets off its own sigils and is knocked back a step | **Tinderbox:** once every so often, an enemy appearing beside you sets off your sigils on every enemy around you at once | **Smokescreen:** for 2 s after a detonation, the enemies it hit deal half damage to you with ranged hits |
  | Frost: lock them out | **Frozen Step:** a charge that reaches you freezes the charger for a moment (Brittle if it accepts no control) | **Cold Shoulder:** the first hit an ambusher lands on you is halved and freezes it | **Frost Mirror:** each ranged hit on you lays a frost sigil on the shooter; a full shooter freezes |

- **Spare theme for a later leaf tier** *(Decided: kept as a spare)*: "what if there's no
  time?" (they die first: route a dying enemy's leftovers to whoever will live long enough
  to pay them; they're on you; they won't hold sigils: shells, dives, DoT resistance).
- **Next: the party role, the bot plan and the open odds and ends, then T2–T4 biome by
  biome.** *(Agent's agenda.)*

**Ninth review (2026-10-14): party, the word "shatter", the bot plan.** Pop-up; all as
recommended.

- **Own sigils, shared debuffs:** each Apprentice keeps its own sigils on an enemy (its
  damage adds like any player's); only the debuffs (Wither's weakening, Brittle, Numb,
  chill) follow the strongest-copy rule (§7.12, §12.12). **Build task:** today one class
  `dot` record per monster is taken over by the last applier; it becomes one record per
  owner. *Decided.* Not taken: one shared bar.
- **Party role** *(Decided)*: the weakener and spreader. Wither and Wasting make enemies hit
  everyone softer, Brittle makes a boss take more from everyone, Numb and chill slow
  enemies for the party. Brittle and the Striker's Expose are different debuffs, so both
  apply.
- **The Apprentice keeps "shatter."** The Tundra Ice Armor's break gets another word on
  screen ("breaks", "cracks"): a display rename in monster data, done in the build, not a
  bible edit (no other class's section calls it a shatter). *Decided.*
- **The bot plan** *(Decided; defaults and test arms tuned by the bots)*:
  - Harness intents: set each moment's payoff and condition; equip the relic.
  - Defaults: T1, full → Spread if two or more enemies are near, else Detonate; winds up →
    Seize; your HP low → Siphon. Poison: full → Detonate (the plague walks on its own), low
    → Wither. Fire: full → Detonate, shell up → Fuse. Frost: winds up → Seize, frozen →
    Detonate, three or more near → Cold Snap.
  - Metrics: time to kill; **waste** (damage still owed on dead enemies, the measured
    slowness); chain lengths; payoffs fired; Siphon healing; deaths.
  - Test arms: fast vs heavy weapons at the cap (the W1 fix for the DoT-weapon trap); Hair
    Trigger and Shardstorm multiplication; Ripening; the cap steps; Brittle's strength; the
    first boss without a relic.
- **No stance-like modes or rite-like passives:** the moments are the class's states.
  *Decided.*
- **Next: T2 biome by biome.** *(Agent's agenda.)*

**Tenth review (2026-10-14): T2 accepted as drafted.** Pop-up.

- **T2, biome by biome** *(Decided on paper, to judge in the game; names and numbers
  open)*. A returning biome teaches a new lesson, a sidegrade or a rank-up, and its gear
  jobs return stronger; the new biomes add jobs and trophies. Every lesson carries its
  school as vocabulary (as the Squire's response families): this tier Poison 3, Fire 2,
  Frost 2, besides the three discipline pieces.

  | Biome | T2 threat | Lesson (school, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Plains | stampedes | **Blast Back** (Fire, sidegrade of Detonate): a detonation on a charging enemy stops its charge and knocks it back | — | Gorging Razortusk: Outbreak II, a Spread passes to three neighbours |
  | Forest | cadence duel, stuns | **Numb II** (Frost, rank-up): a numbed enemy's wind-ups also take longer | — | Apex Timberclaw: Firstbrand II, the first hit lays half a bar |
  | Mountain | heavy plating, the breakable barrier, charges | **Sear** (Fire, new): spend a shielded target's sigils to burn through its barrier at double (lands if the barrier breaks) | — | Stoneplate Juggernaut: Petrify II, a held enemy also takes more from your ticks |
  | Swamp | pools, rain, the rising mire; Corrosion | **Siphon II** (Poison, rank-up): Siphon also washes a poison, bleed or Corrosion off you | — | Mire-Gorged Behemoth: Glut II, twice the drain reach |
  | Cave | eruptions from below | **Seep** (Poison, new): when an enemy burrows or dives out of reach, its sigils keep ticking at double until it surfaces | — | Chitinous Dreadbore: Brood Sigils II, one every 1.5 s |
  | Jungle (new) | fleeing prey, ambushers from cover | **Snag** (Frost, new): a fleeing or kiting enemy carrying a full bar is rooted for a moment | Weapon **Stalker's Rod:** sigils on a fleeing or kiting enemy tick double. Armor: anti-ambush base + **Second Skin:** the first hit each ambusher lands on you is a third weaker. Charm **Patient Hunter:** Recovery doubles while every enemy within your reach carries your sigils | Jungle Dread-Gorger, **Scent** (sigil): sigils on an enemy that flees or kites never fall off while it runs, and tick faster |
  | Desert (new) | mark, slow, execute; ranged kiters | **Recoil** (Poison, new): when an enemy's mark, slow or curse lands on you, its caster catches a full bar | Weapon **Dune Staff:** longer reach; sigils last longer on far enemies. Armor: ranged-hit base + **Sun-Ward:** marks and slows on you are shorter for each enemy carrying your sigils (capped). Charm **Cool Draught:** a mark or slow ending on you heals you a little | Dune-Stalker Emperor, **Dune Wind** (payoff): a Spread or a chain can leap any distance to an enemy carrying your sigils |

- **Seep adds a seventh moment, "out of reach"** (the Trench's dives use it too).
  *Decided (follows from the table).*
- Notes *(Proposed)*: Blast Back crosses the Squire's Stand Fast and the Conduit's Ironhorn
  (three classes stop a stampede; a theme crossing, §3); kiters are the Apprentice's
  natural prey (the sigils tick while they run), so the Desert is about the debuffs that
  land on you.
- **Next: T3 and T4 biome by biome.** *(Agent's agenda.)*

**Eleventh review (2026-10-14): T3 and T4 accepted as drafted.** Pop-up. *Decided on
paper, to judge in the game; names and numbers open.* Jobs move when a biome retires:
after T2 the Forest's (Thornwood Rod, Slip Away, Numbing Calm) to the Jungle and the
Plains' (Branching Wand, Warding Sigils, Feeding Swarm) to the Volcanic; after T3 the
Swamp's (Bog Censer, Bitter Blood, Bitter Tonic) to the Wasteland and the Cave's (Deep
Grimoire, Sigil Weight, Long Draw) to the Trench. (§7.16 calls the T4 undead biome the
Graveyard; §8 and §12.16 the Wasteland.) Two names were changed before drafting because
the Spirit already uses them: Flare → Signal Fire, Depth Charge → Pressure Fuse.

- **T3:**

  | Biome | T3 threat | Lesson (school, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain | the double charge | **Seize II** (Frost, rank-up): Seize catches a second wind-up within a few seconds | — | Crag-Gorged Horn-Behemoth: Petrify III |
  | Cave | the tunnel chase | **Seep II** (Poison, rank-up): when the enemy surfaces, its sigils burst onto every enemy near the spot | — | Deep-Core Burrow-Gorger: Brood Sigils III, the last rank |
  | Swamp (last tier) | spores, detonating pools, the drag | **Spore Burst** (Poison, sidegrade of Spread): spend a target's sigils to burst them onto every enemy around it at once, half each | — | Rot-Spore Croc-Behemoth: Glut III, the last rank |
  | Jungle (+ the Forest's jobs) | pursuit, flight | **Snag II** (Frost, rank-up): the root also holds every enemy near the snagged one | The Forest's jobs | Apex Bramble-Slasher: Scent II |
  | Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Signal Fire** (Fire, new): a detonation on your target also sets off your sigils on the enemy furthest from you | — | Dune-Carapace Monarch: Dune Wind II |
  | Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Thaw** (Fire, new): when the Chill on you reaches its threshold, spend the nearest enemy's sigils to burn it off | Weapon **Glacial Wand:** sigils on a chilled or slowed enemy last twice as long. Armor: chill base + **Ice Veil:** when the Chill on you reaches its threshold, every enemy around you carrying your sigils is numbed. Charm **Cold Comfort:** Recovery doubles while an enemy carrying your sigils is frozen or brittle | Frost-Plated Rime-Mammoth, **Frostheart** (payoff): every Seize also leaves its target brittle for a few seconds after |
  | Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, Obsidian shells, hound swarms, burning gunners | **Cinderfall** (Fire, sidegrade of Detonate): the detonation hits everything around the target, each paying a share | Weapon **Magma Censer:** sigils tick harder for each step of the fight's Heat. Armor: heat base + **Ashguard:** a burning hit on you lays a sigil on its shooter. Charm **Banked Coals:** Recovery rises with the Heat while three or more enemies carry your sigils | Cinder-Shell Magma-Salamander, **Magma Core** (sigil): sigils on a shelled enemy keep ticking at full through the shell |

- **T4:**

  | Biome | T4 threat | Lesson (school, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain (last tier) | Earthshatter, delayed fault lines | **Seize III** (Frost, rank-up): a seized enemy's delayed attacks (fault lines) are cancelled too | — | Iron-Crest Titan: Petrify IV, the last rank |
  | Tundra | Ice Armor at its heaviest | **Frostcrack** (Frost, new): a Seize on a shielded or shelled enemy cracks the shell open at once | — | Glacial Patriarch: Frostheart II |
  | Jungle | hard to catch, then it commits | **Spread II** (Poison, rank-up): Spread and the plague reach a hiding or fleeing enemy anywhere within your reach | — | Verdant-Crown Predator: Scent III |
  | Desert | three acts: melee, kiter, cornered | **Recoil II** (Poison, rank-up): the caster also suffers its own mark or slow | — | Dune-Throne Sovereign: Dune Wind III |
  | Volcanic | the Heat race, Magma Shove | **Cinderfall II** (Fire, rank-up): each step of the Heat widens it | — | Caldera Sovereign: Magma Core II |
  | Wasteland (new; + the Swamp's jobs) | the dead rise; area damage matters most | **Pyre** (Fire, new): a fallen enemy carrying your sigils burns and can't rise; its leftovers pass on (no damage added, XC1's shape) | Weapon **Charnel Rod:** your hits also lay a sigil on the nearest risen enemy. Armor: base (risen enemies hit softer) + **Gravewrap:** a risen enemy carrying your sigils can't hit you for its first seconds. Charm **Last Rites:** Recovery rises for each risen enemy carrying your sigils | Charnel-Crown Sovereign, **Dirge** (payoff): a Detonate also sets off your sigils on every risen enemy in the fight |
  | Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Transference** (Poison, new): spend a target's sigils to move one of your debuffs onto it | Weapon **Abyssal Censer:** sigils tick harder for each different debuff on their carrier. Armor: debuff-resistance base + **Deep Ward:** while you carry three or more debuffs, each enemy carrying a full bar deals less damage to you. Charm **Tidal Draw:** each debuff you move or wash off heals you a little | Elder Trench Serpent, **Pressure Fuse** (payoff): a Detonate on an enemy out of reach goes off, doubled, when it resurfaces |

- **How T3 and T4 test the Apprentice:** shells waste damage over time, so Magma Core,
  Frostcrack, Sear and Fuse are the answers and Fire is strongest there; the bosses that
  accept no control meet Brittle, Frostheart and Numb (a slow still lands); the Final
  Eruption is a race, Poison's weakest fight, where Cinderfall and Long Fuse matter; the
  Wasteland is the area fight, home for the plague and the chain; the Trench's debuff pile
  meets Siphon II, Transference and Recoil, its dives Seep and Pressure Fuse.
- **Totals through T4:** 30 payoffs counting rank-ups: 6 at T1, the 3 discipline pieces,
  then 9 new, 3 sidegrades and 9 rank-ups. By school: Poison 11, Fire 10, Frost 9 (the
  agent first said 9 each; corrected after the call). Distinct pieces: Poison 7, Fire 9,
  Frost 5. Eleven trophies: payoff relics Outbreak, Glut, Petrify, Dune Wind, Frostheart,
  Dirge, Pressure Fuse; sigil relics Firstbrand, Brood Sigils, Scent, Magma Core.
- Notes *(Proposed)*: Frost grows mostly through rank-ups (Numb II, Seize II–III, Snag
  II), so it has the fewest distinct pieces; a T5 lesson or a later tier can even it out.
  Crossings (themes, §3): Pressure Fuse with the Squire's Lie in Wait and the Spirit's Depth
  Charge; Transference with the Conduit's Abyssal Warden; Pyre with the Squire's Lay to Rest.
- **Next: §9 rewritten to the class template in one edit; the agent walks the designer
  through the unconfirmed proposals before the lock.** *(Agent's agenda.)*

**§9 rewritten to the class template (2026-10-14),** in one edit, status "Draft (written to
the template; awaiting the lock)". The Slinger (§10) and Spirit (§11) had locked by then.
Two more names changed because the locked Slinger section already uses them: the Forest
armor line Slip Away → **Give Ground** (the Slinger's Gunslinger leaf is Slip Away, with
nearly the same effect) and the Tundra lesson Thaw → **Melt** (the Slinger's Tundra charm
is Thaw). "Seize" sits next to the Squire's Seize the Opening leaf; kept, noted in §9.15.
Unconfirmed items carried into §9 as *Proposed*, for the walk-through: the front-loaded
curve goes (linear sigils); no resource on the Apprentice itself; base reach = today's;
the HUD and callouts; the moment list; payoffs scaling with tier; Stone Sigil as the root's
delayed hits (DoT resistance to §5); the salvage tables; the notes; illustrative numbers.

**Twelfth review (2026-10-14): the walk-through, every proposal accepted.** Pop-up.

- **Core rules** *(Decided)*: C1 the front-loaded curve goes (sigils tick linearly; short
  fights are answered by Detonate from minute one and Poison's no-waste); C2 no resource on
  the Apprentice itself (its state lives on the enemies); C3 base reach is today's; C4
  payoffs scale with the Apprentice's tier.
- **HUD and callouts** *(Decided)*: a sigil pip ring at the enemy's feet, sized by the cap;
  callouts only for the trophy's payoff and the signature moments (a chain of three or more,
  a Shatter). Not taken: the trophy payoff only.
- **The moment list** *(Decided; open to additions)*: seven moments, each shown on the card
  only once you own a lesson that uses it (a fresh character sees only "full"). Not taken:
  the whole card from minute one.
- **The rest** *(Decided)*: Stone Sigil carries the root's delayed hits (DoT resistance to
  §5); the salvage tables; the notes stay *Proposed* notes; the numbers stay illustrative.
- §9's tags updated to match (targeted edits, §9 only).

**The lock (2026-10-14):** the designer locked §9 as build authority. Edits: §9's header
and lock paragraph, §9's row in the bible's status table, and the prep and this log added
to `docs/README.md`. Items still tagged *Proposed* are notes or wait on another section
(§4's boots, XC1, XC2); Playtest questions stay open (§9.15). Nothing committed.

### Cross-class proposals

*(For the designer; never edited into §1–§6 or another class's section by this dive.)*

- **XC1, §1: passing on leftovers is not on-kill** (*Proposed*). Suggested wording: "A
  death that only passes on what the dead enemy still carried, adding no damage, is not an
  on-kill effect." It covers the Apprentice's no-waste rule only; the Conduit's
  Infestation and Graveyard raiser add bodies on a kill, so they stay on §7.15's review.
- **XC2, marks never bank damage** (*Proposed*, for the Slinger dive). Damage banked on a
  target and cashed in by a rule is the Apprentice's stack-then-detonate (§3); a Slinger
  mark designates a target and never stores damage. All three of the
  [Slinger prep](slinger-deep-dive-prep-2026-10-14.md)'s leads (M1–M3) satisfy it; today's
  Bounty hunter would not.
