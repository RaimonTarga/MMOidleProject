# Squire deep dive: decision log (2026-10-14)

> The working record of the third class deep dive of the class-first rework, moved out of
> §8 of the [class-first bible](../../design_docs/class-first-bible.md) when §8 was
> rewritten to the class template (2026-10-14). The bible's §8 is the design; this file is
> how it got there: every call in order (ten reviews), the reasoning, and the ideas that
> were dropped (other sources of Resolve, a clock under the slam, carry-over in the base,
> defensive responses on cooldowns or as passive gear only, Challenge as the Plains lesson,
> Perfect Guard, Dynamo and Unyielding as specializations, Grudge, Bull Rush, the last
> taunt winning, a Bulwark aura). "§N" means the bible's section N. Read top to bottom:
> later reviews override earlier entries.

Prep: [squire-deep-dive-prep-2026-10-14.md](squire-deep-dive-prep-2026-10-14.md). The first
two reviews were asked inline; from the third on, with the question pop-up (the designer
reverted an earlier "no pop-ups" note on 2026-10-14). The option ids the reviews mention
(F1, R2, S2, K1–K6, L1–L4, DR1–DR5, SL1, BU1, TP1, JN1…) are the ones the agent offered in
the conversation; each review spells out what was chosen.

**Carried in (decided before the dive):**

- **Core mechanic:** the Squire builds **Resolve** from damage blocked or absorbed; a
  **retaliation slam** spends it. Resolve is the Squire's answer to defense and recovery
  (§5). *Tentative (brief).*
- **The class system is Response rules:** react to what the enemy does (a telegraph →
  guard; adds → taunt + slam; an ally low → intercept). It must never feel like the
  Striker's Order or the Slinger's Loadout (§3). *Tentative (concept) / Decided (distinct
  editors).*
- **Disciplines:** Bulwark (pure tank, group anchor), Juggernaut (armor and HP convert to
  damage), Avenger (parry and counter telegraphs). *Tentative (brief).*
- **Countering belongs to the Squire;** Brawler (counter on hit) left the Striker. Melee
  survivability lives in the class kit. The redesigned bosses are the stage for its
  responses. *Decided (brief).*
- **Reactive windows probably belong to the Squire** (Brace's one good part; Striker dive,
  tenth review). *Tentative.*
- From the Conduit and Striker dives, for every class: rules cost nothing and each class
  has its own budget, grown by Global Mastery in steps (§2, §3); T2 discipline, T3
  specialization, T4+ leaves (§2); offense–defense trades allowed, Juggernaut named as an
  example (§1); defense and recovery in equipment, never on triggers that scale with attack
  speed, some resilience in melee T4 leaves (§12.10); the relic is the boss trophy (§4);
  prefer triggers that work in every fight (§1); the same buff from two players doesn't
  stack (§7.12, §12.12). No abilities outside the class system: Decided for the Striker,
  Proposed for every class (§3), to confirm here.

### Review log

*(The designer's calls, in order, as the dive makes them.)*

**First review (2026-10-14):**

- **The designer's main doubt:** of all the classes, this is the one the designer is least
  convinced about. Main risk: **the class flakes against enemies that don't hit back much**,
  since its fuel is the enemy's pressure. *Open (the dive must answer it).*
- **No abilities outside the class system** holds for the Squire too (§3). *Decided.*
- **Fantasy:** mostly "the shield that hits back" (F1: I take the blows, and every one comes
  back as a slam), with some of "the guardian who reads the fight" (F2). *Tentative.*
- **Resolve fills from how hard you're hit** (R2: the raw hit, whatever your armor, into a
  capped bar), *Tentative*, **and from defending properly:** adequately blocking an attack
  or interrupting an enemy also gives Resolve. *Decided (direction).* The designer's note:
  the different sources hint at the class's different identities.
- **Resolve is one currency** (S2): responses and the slam both spend it. *Decided
  (generally).* How defensive abilities work inside it: *Open.*
- **Next (agenda):** how all of this works; what the frames become at T2; T3
  specialization ideas; what the old class keeps and what changes. *Decided.*

**Second review (2026-10-14): the agent's second pass "mostly seems fine".** *Tentative
(all items below, as drafted):*

- **Against enemies that don't hit back:** a pressure trickle (every enemy engaged with you
  feeds a little Resolve each second, hit or not; a boss counts as several) as the class
  floor (K1); Juggernaut fills from its own bulk and never flakes (K4); a taunt that pulls
  stragglers and ranged enemies in, the Plains lesson (K5); the framing: plain swings carry
  easy trash, Resolve makes the Squire strongest when the fight is hardest (K6). Carry-over
  between fights is a specialization, not the base (K2 → B2). No clock under the slam (K3
  not taken).
- **Defensive responses pay for themselves when they land** (L1): a response costs Resolve;
  landed right (a guard catching a telegraph, a bash interrupting a wind-up) it returns more
  than it cost; wasted, it loses the cost. The Squire is the one class whose class system
  holds defense (the brief sets Resolve as its defense answer); equipment still carries the
  baseline. The in-combat Recovery share moves to a charm line (L4).
- **Disciplines, the frames' successors, each with its own main Resolve source:**
  **Avenger** (from Warrior, light: Resolve from answers; spends it on quick counters after
  each answer; bosses and elites), **Bulwark** (from Knight, balanced: Resolve from pressure,
  more per enemy on you; slams that hold; packs and parties), **Juggernaut** (from today's
  Bulwark frame, heavy: Resolve from its own armor and HP; one huge slam; never flakes). The
  name Bulwark moves from today's heavy frame to the anchor.
- **Ownership** (as the Striker's): responses own what each answer does; the relic owns the
  slam's twist; the discipline owns where Resolve comes from and how it is spent; a
  specialization bends Resolve or the slam's delivery.
- **The T3 board, first draft:** Bulwark: Reverb (the slam rings out again at half
  strength), Unyielding (Resolve carries between fights, its cap grows), Consecrate (old
  Devout Priest: the slam becomes a 3 s channel, you can't be moved). Avenger: Grudge (old
  Avenger's bank: the counter hits whoever hurt you most and adds a capped share of it),
  Perfect Guard (a caught telegraph is negated and the counter lands double; a mistimed
  guard costs double), Sunderer (counters ignore plating and crack shells). Juggernaut:
  Destroyer (the slam becomes a charge into your next target), Dynamo (Resolve fills each
  second, faster the heavier your armor), Rampage (old Assassin: each slam starts a burst of
  faster swings).
- **Kept from the old class:** the heaviest chassis; the big empowered hit (now the slam),
  its effect, the brace pose and the dial; the heavy frame's bank and Warrior's tempo; the
  ideas of Reverb, Avenger, Destroyer, Dynamo, Sunderer, Devout Priest and Assassin; Taunt
  (now the Squire's); Brace's reactive window (now Guard); Cleanse's idea (a Swamp
  response); the great-helm bodies. **Changed:** the 7 s clock becomes Resolve; shared
  guards and runes become Squire responses; range nodes go; Destroyer's delivery by
  Techniques goes; Stalwart and Transcendant are dropped.
- **Asked next:** how relics work (the designer's assumption: mostly the slam, possibly how
  Resolve is gained or spent) and how the defensive abilities work, since the Squire is
  the class that keeps Brace and its kind. *Open.*

**Third review (2026-10-14): relics, defensive responses, the budget.** Asked with the
question pop-up (the designer reverted the earlier "no pop-ups" note the same day).

- **Relics come in two kinds:** **slam relics** change what the slam does; **Resolve
  relics** change how you gain or spend Resolve. One twist each, no per-discipline
  versions, ranked up by the same lineage's next-tier boss; relics never grant or change
  responses (zones teach responses, bosses give trophies). *Decided.*
- **A plain slam until the first boss kill** (no starter trophy). *Decided.*
- **The T1 trophies, as drafted** *(Decided: concepts; names and numbers open)*:
  - Tusked Razorback (Plains), **Muster** (Resolve, gain): every enemy that joins the fight
    against you fills a chunk of Resolve, hit or not.
  - Gnarled Greatbear (Forest), **Relentless** (Resolve, spend): the slam fires at a third
    of the bar, a third the size, and each one fired soon after the last is a bit bigger.
  - Grave Toadeater (Swamp), **Rot-Eater** (Resolve, gain): poison and bleed ticks on you
    fill Resolve as if they were hits (the base doesn't count damage over time).
  - Crag Behemoth (Mountain), **Faultline** (slam): the slam runs as a shockwave down a line
    through the target and everything behind it, reaching the ranged enemies.
  - Obsidian Broodmother (Cave), **Corrode** (slam): each slam strips plating from what it
    hits, stacking. The plating crack moves off Juggernaut onto this trophy. *Decided.*
- **Defensive responses: the rules** *(Decided)*: each answers one specific enemy action (a
  telegraph, a cast, a debuff landing, control, a big hit), never a standing buff on a
  cooldown (DR1); it costs Resolve and refunds more when it lands, a miss costs (DR2);
  guards catch telegraphs and big hits only, so ordinary chip damage always lands and
  fills Resolve (DR3); nothing triggers on your hits or scales with attack speed (DR4);
  Resolve never absorbs damage by itself, only spending it through a response defends,
  which keeps it clear of the Spirit (DR5).
- **The responses** *(Decided: shape; names and numbers open)*: **Guard** (brace against
  the telegraphed blow aimed at you; caught, it refunds; Brace and Endure's successor,
  Mountain), **Steel Will** (when a poison or bleed lands, spend Resolve to shake it off;
  Cleanse's successor, Swamp), **Unshaken** (when stunned, rooted or knocked down, spend
  Resolve to break free; Break Free's successor, a T2 lesson), **Riposte** (the third hit
  one enemy lands on you, you strike it back; Brawler's counter, Forest), **Challenge**
  (pull stragglers and ranged enemies onto you; the Taunt rune's successor, Plains),
  **Shield Bash** (interrupt a wind-up, Cave), **Intercept** (step in front of an ally under
  a telegraph or at low HP and take the blow; Bulwark's T2 piece). Sidestep and Disengage
  are dropped (the Squire doesn't dodge).
- **Hold or step out:** on a ground telegraph, the Squire's rules choose: guard it and keep
  swinging (it costs Resolve and part of the damage lands), or walk out like everyone
  else. *Decided.*
- **Last Breath:** at low HP, spend the whole bar to heal. Kept, with the flag that the
  Striker dive found Second Wind unhealthy; here it has a real cost (your slam).
  *Decided / Playtest.*
- **Where the decisions come from** *(Proposed, accepted with the table)*: Bash or Guard on
  a cast (a Bash that interrupts refunds more and staggers but fails on an uninterruptible
  step; a Guard always works and returns less); spend now or save for the slam; hold or
  step out. Callouts only for answers that land on a telegraph or cast and for the relic
  slam.
- **The budget is Resolve's size:** Global Mastery adds Resolve pips ("Resolve 6, next at
  Mastery 24"); you carry every response you own; the bar limits how often you answer.
  *Decided.*
- **Next: T1 biome by biome.** *Decided (agenda).*

**Fourth review (2026-10-14): T1 accepted as drafted.**

- **Challenge moves to the Desert** (T2: its solo value is dragging in ranged kiters; every
  Plains mob is melee, solo every aggroed enemy already comes to you, and pulling more at
  the Plains entry spike makes it worse). **The Plains teaches Shove** instead. *Decided.*
- **What each gear slot asks** *(Decided)*: the weapon, **"how do you hit back?"** (how
  heavy the plain swings are, how big the slam is, plus one job); the armor, **"what does
  the threat give you?"** (a shared base plus a Squire line that makes its biome's threat
  feed Resolve, or its answer cheaper or sturdier); the charm, **"what does an answer give
  back?"** (recovery paid when an answer lands: enemy-paced, so attack speed can't farm it).
- **T1, biome by biome** *(Decided: direction; names and numbers open)*:

  | Biome | Threat | Response | Weapon | Armor (base + Squire line) | Charm | Trophy |
  |---|---|---|---|---|---|---|
  | Plains | swarms | **Shove:** when three or more enemies are on you, shove them all back a step with the shield (lands if it moves three or more) | **Flanged Mace:** the slam's circle is wider | Plating + **Rampart:** enemies you shoved deal less damage for a few seconds | **Breather:** each Shove that lands heals a little per enemy shoved | Muster |
  | Forest | fast packs | **Riposte** | **Arming Sword:** quick, light swings; counters hit harder | Evasion + **Turn Aside:** a dodged hit fills Resolve as if it had landed (evasion would otherwise starve Resolve) | **Counterbalance:** after a Riposte, Recovery doubles for a few seconds | Relentless |
  | Swamp | attrition | **Steel Will** | **Spiked Flail:** the slam leaves a bleed on everything it hits | DoT resistance + **Iron Gut:** Steel Will costs half | **Purifying Breath:** a poison or bleed you shake off heals you for part of the damage it had left | Rot-Eater |
  | Mountain | the hardest hits | **Guard** | **Warhammer:** slow, heavy swings, a bigger slam; a slam soon after a caught telegraph hits much harder | Damage cap + **Planted:** while guarding you can't be knocked back or stunned | **Stone Patience:** after a caught telegraph, Recovery triples for a few seconds | Faultline |
  | Cave | elites, casters, corrosion | **Shield Bash** | **Tower Shield:** you fight with the shield; lighter swings; Shield Bash costs half and stuns longer | Bulk + **Reforged:** stripped plating comes back faster, and each stack stripped fills Resolve | **Old Guard:** part of your Recovery stays on in combat (the old root's share) | Corrode |

  Weapon fits: Avenger the Arming Sword, Tower Shield and Warhammer; Bulwark the Flanged
  Mace and Tower Shield; Juggernaut the Warhammer and Spiked Flail. The Toadeater
  weakness gets three answers before its fight (Steel Will, Iron Gut, Purifying Breath).
- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain sword and shield, Resolve 4 pips filling as you are hit (plus the trickle) and one
  default rule, bar full → slam; the Plains teaches Shove around minute 6 with its default
  rule (three or more on me → Shove); the first boss is won with the base kit and gives
  Muster; by the end of T1 the Squire carries five responses, Resolve 4 → 5 at Mastery 15
  → 6 at Mastery 30.
- **Next: T2 biome by biome.** *Decided (agenda).*

**Fifth review (2026-10-14): T2 accepted as drafted.**

- **T2, biome by biome** *(Decided on paper, to judge in the game; names and numbers
  open)*. A returning biome teaches a new response, a sidegrade or a rank-up, and its gear
  jobs return stronger; the new biomes add jobs and trophies:

  | Biome | T2 threat | Lesson (kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Plains | stampedes | **Stand Fast** (sidegrade of Guard): a charge that hits you stops dead and the charger staggers | — | Gorging Razortusk: Muster II, a rally's whole wave fills double |
  | Forest | cadence duel, stuns | **Unshaken** (new): when stunned, rooted or knocked down, spend Resolve to break free | — | Apex Timberclaw: Relentless II, the chain ramps faster |
  | Mountain | heavy plating, the breakable barrier, charges | **Splitting Blow** (new): when the enemy you fight raises a shield or barrier, a heavy blow that hits barriers double (lands if it breaks it) | — | Stoneplate Juggernaut: Faultline II, the line hits barriers double |
  | Swamp | pools, rain, the rising mire; Corrosion | **Steel Will II** (rank-up): also shakes off Corrosion and slows | — | Mire-Gorged Behemoth: Rot-Eater II, every debuff landing on you also fills Resolve |
  | Cave | eruptions from below | **Earthstamp** (new): when an enemy burrows or dashes at you unseen, stamp: it surfaces at your feet, staggered | — | Chitinous Dreadbore: Corrode II, a higher stack cap |
  | Jungle (new) | fleeing prey, ambushers from cover | **Watchful** (new): the first hit an ambusher lands on you is caught on the shield, at no cost, and fills Resolve | Weapon **Hooked Glaive:** longer reach; the slam hooks fleeing enemies back into its ring. Armor: anti-ambush base + **Unflinching:** an ambush can't stun or knock you down. Charm **Watchman's Ease:** an ambush Watchful catches heals you for the hit it stopped | Jungle Dread-Gorger, **Strangler Vine** (slam): the slam pulls every enemy in a wide ring to you before it lands, fleeing ones included |
  | Desert (new) | mark, slow, execute; ranged kiters | **Challenge** (moved from the Plains): pull ranged and kiting enemies onto you (lands if it pulls one into reach) | Weapon **Throwing Shield:** when your target is out of reach, your swing throws the shield instead (lighter). Armor: ranged-hit base + **Arrow Catcher:** ranged hits on you fill double Resolve. Charm **Called Out:** each enemy a Challenge pulls heals you a little | Dune-Stalker Emperor, **Executioner's Oath** (Resolve, spend): the slam can fire early on an enemy below a third of its HP, with whatever Resolve you have |

  The disciplines arrive at the same tier (Intercept is Bulwark's piece). Notes: Stand Fast
  is the same lesson as the Conduit's Ironhorn (a theme crossing, allowed by §3);
  "Juggernaut" also names the T2 Mountain boss (Stoneplate Juggernaut).
- **Rules can hold the slam, never fire it early** (SL1): the slam fires at a full bar;
  a rule may save it (don't waste it on a nearly dead target). Relentless and
  Executioner's Oath are the only ways to slam early. *Decided.*
- **Response families** as vocabulary: **guards** (take it better: Guard, Stand Fast,
  Watchful, Steel Will, Unshaken), **counters** (hit back: Riposte, Shield Bash, Splitting
  Blow), **holds** (move enemies: Shove, Challenge, Earthstamp, Intercept). Each tier
  spreads its lessons across the three; Avenger wants counters and guards, Bulwark holds
  and guards. **Juggernaut grows mainly through gear** (its Resolve comes from bulk), not
  through lessons. *Decided.*
- **Next: T3 and T4 biome by biome.** *Decided (agenda).*

**Sixth review (2026-10-14): T3 and T4 accepted as drafted.** *Decided on paper, to judge
in the game; names and numbers open.* Jobs move when a biome retires: after T2 the
Forest's (Arming Sword, Turn Aside, Counterbalance) to the Jungle and the Plains' (Flanged
Mace, Rampart, Breather) to the Volcanic; after T3 the Swamp's (Spiked Flail, Iron Gut,
Purifying Breath) to the Wasteland and the Cave's (Tower Shield, Reforged, Old Guard) to
the Trench.

- **T3:**

  | Biome | T3 threat | Lesson (family, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain | the double charge | **Guard II** (guard, rank-up): Guard catches a second telegraph within a few seconds | — | Crag-Gorged Horn-Behemoth: Faultline III, a longer line |
  | Cave | the tunnel chase | **Earthstamp II** (hold, rank-up): the stamp also knocks down everything around the surfacing enemy | — | Deep-Core Burrow-Gorger: Corrode III, the last rank |
  | Swamp (last tier) | spores, detonating pools, the drag | **Anchor** (guard, new): when something drags or pushes you, plant your feet: you don't move, and it fills Resolve | — | Rot-Spore Croc-Behemoth: Rot-Eater III, the last rank |
  | Jungle (+ the Forest's jobs) | pursuit, flight | **Chain Hook** (hold, new): when the enemy you fight flees, hook it and drag it back | The Forest's jobs | Apex Bramble-Slasher: Strangler Vine II, a wider ring |
  | Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Challenge II** (hold, rank-up): a pulled enemy can't move away for a moment | — | Dune-Carapace Monarch: Executioner's Oath II, a higher threshold |
  | Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Frostward** (guard, new): when the Chill on you reaches its threshold, spend Resolve to hold it there for a few seconds, with no freeze | Weapon **Glacier Mace:** the slam leaves frozen ground that slows enemies on it. Armor: chill base + **Frozen Resolve:** the Chill building on you fills Resolve. Charm **Hearth:** while Frostward holds, you heal a little each second | Frost-Plated Rime-Mammoth, **Deep Winter** (Resolve, spend): the bar can fill past full, up to double; an overfull slam hits as hard as two |
  | Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, Obsidian shells, hound swarms, burning gunners | **Backdraft** (counter, new): when a fire attack or a burning shot hits you, throw the heat back at its source | Weapon **Forge Hammer:** each step of the fight's Heat makes the slam bigger. Armor: heat base + **Stoked:** the Heat's extra damage on you fills extra Resolve. Charm **Cooling Breath:** each Backdraft that lands heals you a little | Cinder-Shell Magma-Salamander, **Kindling** (Resolve, gain): every gain fills a bit more for each 10 s the fight has lasted |

- **T4:**

  | Biome | T4 threat | Lesson (family, kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain (last tier) | Earthshatter, delayed fault lines | **Guard III** (guard, rank-up): a caught telegraph also staggers its attacker | — | Iron-Crest Titan: Faultline IV, aftershocks along the line (the last rank) |
  | Tundra | Ice Armor at its heaviest | **Splitting Blow II** (counter, rank-up): breaks Ice Armor in one blow | — | Glacial Patriarch: Deep Winter II, up to triple |
  | Jungle | hard to catch, then it commits | **Watchful II** (guard, rank-up): a caught ambusher is staggered | — | Verdant-Crown Predator: Strangler Vine III |
  | Desert | three acts: melee, kiter, cornered | **Disarm** (counter, sidegrade of Shield Bash): when the enemy you fight starts its big attack, strike its weapon arm: it lands at half. Not a stun, so it works on bosses that accept no control | — | Dune-Throne Sovereign: Executioner's Oath III |
  | Volcanic | the Heat race, Magma Shove | **Anchor II** (guard, rank-up): a shove can't move you at all, even into a hazard | — | Caldera Sovereign: Kindling II |
  | Wasteland (new; + the Swamp's jobs) | the dead rise; area matters | **Lay to Rest** (hold, new): when a fallen enemy starts to rise near you, strike it down before it stands | Weapon **Bone Maul:** the slam hits harder for every enemy in its circle. Armor: base (risen enemies hit softer) + **Grave Plate:** risen enemies' hits fill double Resolve. Charm **Rest Eternal:** each Lay to Rest that lands heals you a little | Charnel-Crown Sovereign, **Charnel Ring** (slam): the slam's circle widens with every enemy in the fight |
  | Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach | **Lie in Wait** (counter, new): when an enemy dives out of reach, hold the slam: it lands double the instant the enemy resurfaces | Weapon **Pressure Hammer:** the slam hits harder for each different debuff on you. Armor: debuff-resistance base + **Abyssal Plate:** while you carry three or more debuffs, guards cost nothing. Charm **Brine Will:** each debuff you shake off raises Recovery for a few seconds, stacking | Elder Trench Serpent, **Undertow** (slam): for a few seconds after the slam, the target can't dive, burrow or flee |

- **Totals through T4:** 19 responses: guards 7 (Guard, Stand Fast, Watchful, Steel Will,
  Unshaken, Frostward, Anchor), counters 6 (Riposte, Shield Bash, Splitting Blow,
  Backdraft, Disarm, Lie in Wait), holds 6 (Shove, Challenge, Earthstamp, Chain Hook, Lay
  to Rest, Intercept). Eleven trophies: Resolve relics Muster, Relentless, Rot-Eater,
  Executioner's Oath, Deep Winter, Kindling; slam relics Faultline, Corrode, Strangler
  Vine, Charnel Ring, Undertow.
- **How T3 and T4 test the Squire:** the Tundra and Volcanic bosses accept no control, so
  Shield Bash, Earthstamp and Stand Fast's stagger do nothing there and Guard, Splitting
  Blow, Frostward and Backdraft carry (Disarm is the T4 answer that isn't a stun); the
  Heat makes every hit bigger, so more Resolve as well as more damage (the Squire likes the
  Volcanic); Deep Winter and Kindling are the Final Eruption's tools; Steel Will, Abyssal
  Plate and Brine Will answer the Trench's debuff pile, Lie in Wait and Undertow its dives.
- **Next: the disciplines in detail, then a second pass on the T3 board.** *Decided
  (agenda).*

**Seventh review (2026-10-14): the disciplines and the T3 board accepted as drafted.**

- **The disciplines in detail** *(Decided; numbers and looks illustrative)*. The base
  stays (Resolve from hits, answers and the trickle; the slam at a full bar); each
  discipline tilts where Resolve comes from, how it is spent, and unlocks one piece (§2):

  | | Avenger (light): the answer | Bulwark (balanced): the anchor | Juggernaut (heavy): the weapon |
  |---|---|---|---|
  | Fantasy | "I read every blow and answer it." | "Everything comes to me, and nothing gets past." | "My armor is my weapon." |
  | Resolve | landed answers fill much more; plain hits less | every enemy on you counts more (its hits and its trickle) | a steady fill from armor and max HP, hit or not; hits fill less |
  | Spending | a counter after every landed answer (a quick strike at the attacker, paid from Resolve); slams are rarer | slams that hold: everything hit turns on you; the circle grows with the enemies on you | one huge slam, the class's biggest hit |
  | Piece | **Parry** (counter): a telegraphed melee blow aimed at you is negated and countered at once; costs more than Guard, fails on ground telegraphs and ranged shots | **Intercept** (hold): step in front of an ally under a telegraph or at low HP and take the blow | **Unbowed** (guard): when an untelegraphed blow over a quarter of your HP lands, spend Resolve to take it on your armor (plating counts twice) |
  | Damage (illustrative) | ~40 counters / ~40 swings / ~20 slam | ~50 swings / ~50 slam | ~25 swings / ~75 slam |
  | Look | a silver flash on every landed answer | a blue ward that thickens with each enemy held | iron glowing ember-orange as the bar fills; the slam lands as a crater |
  | Weapons | Arming Sword, Tower Shield, Warhammer | Flanged Mace, Tower Shield, Bone Maul | Warhammer, Spiked Flail, Forge Hammer, Pressure Hammer |
  | Best at / weak at | bosses, elites / trash without telegraphs | packs, parties / low pressure (kiters, shells) | farming and bosses (never flakes) / swarms (their hits are just damage) |

  Guardrail on Juggernaut (§1): its conversion runs one way, defense into damage; an item
  that converts never also carries above-curve defense. *Proposed.*
- **The T3 board** *(Decided: concepts; names and numbers open)*:

  | Bulwark | Avenger | Juggernaut |
  |---|---|---|
  | **Reverb** (old Reverb): the slam lands, then rings out again at half strength a few seconds later | **Measure for Measure** (old Avenger, reshaped): every counter returns a capped share of what its answer prevented | **Destroyer:** the slam becomes a charge; you crash into your next target from range |
  | **Bastion:** each enemy on you adds a pip to the bar's cap, up to double; a boss counts as several | **Second Nature** (Warrior's tempo): for a few seconds after a counter lands, answers cost nothing | **Inexorable:** your bulk keeps filling the bar between fights and while you walk, so every fight opens with a slam |
  | **Consecrate** (old Devout Priest): the slam becomes a 3 s channel; everything around you is struck again and again, and you can't be moved | **Sunderer:** counters ignore plating and crack shells | **Rampage** (old Assassin): each slam starts a burst of faster swings |

  Dropped from the first board: Perfect Guard (Parry does it), Dynamo (now Juggernaut's
  base rule), Unyielding (carry-over is Inexorable now), Grudge (a targeting choice, and
  rules are free; a possible leaf). Notes: Bastion leans to packs, Inexorable to farming,
  Sunderer to shells (watch them against content-neutrality); Measure for Measure grows
  with enemy damage, so it is capped (the Avenger warning). *Proposed (notes).*
- **Next: the T4 leaves.** *Decided (agenda).*

**Eighth review (2026-10-14): the T4 leaves accepted as drafted.**

- **The Squire's T4 asks "what happens when you can't answer?"**: the bar is empty when
  something comes, you paid for an answer that hit nothing, or nothing is attacking you at
  all (the flaking worry). One leaf per case per discipline; the empty-bar column carries
  the melee resilience the bible wants at T4. *Decided (names and numbers open).*

  | | Empty bar | Wasted answer | Quiet |
  |---|---|---|---|
  | Avenger | **Last Word:** with an empty bar, Parry still fires once every so often, at no cost | **Read Again:** a wasted answer refunds half its cost, and your next answer of the same kind costs less | **Seize the Opening:** an enemy that hasn't attacked you for a few seconds is open; your next swing on it counts as a counter |
  | Bulwark | **Second Line:** when the bar empties, it refills a pip for every enemy on you, once every so often | **No Wasted Effort:** a wasted answer's cost goes into the next slam instead of being lost | **Goad:** when nothing has hit you for a few seconds, a free Challenge pulls the nearest enemies onto you |
  | Juggernaut | **Last Rampart:** with an empty bar, Unbowed still fires once every so often, at no cost | **Focused Weight:** a slam that hits only one enemy refunds a quarter of the bar | **Siege Engine:** while nothing has hit you for a few seconds, your swings hit harder |

  Spare ideas for later leaf tiers *(Proposed)*: Grudge (counters go to whoever hurt you
  most); response transformations (Shove knocks down, Guard also covers an ally behind
  you, Challenge pulls from twice as far); Overrun (a slam's damage beyond the kill
  carries into the next enemy; close to on-kill, to review).
- **Next: the party role, then the rewrite to the template.** *Decided (agenda).*

**Ninth review (2026-10-14): the party role; the dive converges.**

- **The Squire is the party's tank:** it holds enemies (Challenge, Bulwark's slams that
  hold, Goad), breaks what threatens the party (Shield Bash and Disarm stop big attacks,
  Splitting Blow breaks barriers, Corrode strips plating), and with Bulwark takes blows
  meant for allies (Intercept). No buffs for allies. An intercepted blow is a hit on you
  that lands an answer, so a party keeps the Squire's bar full. The same debuff from two
  Squires doesn't stack; the strongest copy applies. *Decided.*
- **Taunts lock and players come first:** a taunt holds for its whole duration and nobody
  can take the enemy until it ends; a player's taunt outranks a summon's, so a Squire can
  take an enemy from a Conduit's tank summon, never the reverse. The natural split: the
  Squire holds the boss, the Conduit's tanks hold the adds. *Decided.*
- **"Juggernaut" is the Squire's:** the discipline keeps the name; the Conduit's Cave T2
  summon is renamed (its names are placeholders, so §7's lock holds); the Stoneplate
  Juggernaut boss keeps its name (a creature, not a mechanic). *Decided.*
- **No Bulwark aura:** Bulwark protects by holding and Intercept; no standing buffs in a
  class built on answers. *Decided.*
- **Next: rewrite §8 to the class template, move this log out, walk the unconfirmed
  proposals, then the lock.** *Decided (agenda).*

**Tenth review (2026-10-14), after the rewrite: the lock.**

- **§8 rewritten to the class template** (8.1–8.16); this log moved out of the bible.
- **The walk-through:** every item still open was accepted. The tentative core calls (the
  fantasy; Resolve from raw hits into a capped bar plus the pressure trickle; the framing,
  strongest when the fight is hardest; the heaviest chassis in spirit; the ownership rule;
  the class system holding the Squire's defense) and the agent's proposals (Resolve pips in
  Command-like steps and a refund pulse on the HUD; the rules screen, every owned response
  carried with its natural trigger and a default rule; responses scaling with the Squire's
  tier; Last Breath learned with the T2 pick; no stance-like modes; the illustrative costs,
  damage shares and looks; the Juggernaut guardrail; the bot plan with the flake check
  first; the salvage and build tasks; the collisions as settled; the things to watch; the
  spare leaf ideas). *Decided.*
- **§8 locked** (build authority), not committed. No doc is archived: none is the Squire's
  alone. *Decided.*

**Eleventh review (2026-10-14): wrap-up.**

- **The Conduit's Cave T2 summon is renamed Bonecrusher** (it was Juggernaut; the name is
  the Squire's discipline). Applied to §7.8, §7.15 and §7.16 (a name change doesn't reopen
  §7's lock) and to the collision note in §12.15. *Decided.*
- **The Squire's line in §5 stays** (§5 asks each dive to fill its own row). *Decided.*
- **Committed:** the Squire's prep and log, the bible and the docs index, to develop (not
  pushed). The bible also carries the parallel dives' §9–§11 stubs and status rows; their
  preps and logs stay uncommitted for their own sessions. *Decided.*
