# Slinger deep dive: decision log (2026-10-14)

> The working record of the Slinger's class deep dive in the class-first rework (twelve
> reviews: the eleventh the lock, the twelfth the wrap-up). The design itself is §10 of the
> [class-first bible](../../design_docs/class-first-bible.md), rewritten to the class
> template (§6) in one edit when the dive converged and **locked on 2026-10-14**; this file
> keeps every call in order, the reasoning and the dropped ideas. "§N" means the bible's
> section N. Read top to bottom: later reviews override earlier entries.

Prep: [slinger-deep-dive-prep-2026-10-14.md](slinger-deep-dive-prep-2026-10-14.md).
Tags: *Decided*, *Tentative* (open to challenge), *Proposed* (the agent's, unanswered).

**Carried in (decided before the dive):**

- **Core mechanic:** clip-based fire with its own fire rate; the reload is stationary by
  default. *Tentative (brief).*
- **The class system is the Loadout:** what goes in the clip, plus reload and last-bullet
  triggers. *Tentative (brief).* You load **clip types**; every bullet in a clip is the
  same; the last bullet is an extra modifier; no per-bullet authoring; the clip is long
  (around 20 rounds) and uniform, the Striker's Order short and authored. *Decided
  (addendum, §3).*
- **Disciplines:** Gunslinger (small clip, fast reload, reload triggers), Siege (big clip,
  marks detonate on reload), Trickshot (last bullet, ricochet, pierce). *Tentative (brief).*
- **Fire rate is its own stat;** "2× attack speed at 65% attack" is dropped; the fast feel
  comes from animation and sound. **Generic on-hit is cut:** bullet properties are the
  Slinger's on-hit. *Decided (brief).*
- **Marks and Deathmark are the Slinger's:** the Striker dropped Flashpoint because
  Deathmark is the designer's planned Slinger specialization (§12.15). *Decided.*
- From the earlier dives, for every class: rules cost nothing and each class has its own
  budget grown by Global Mastery (§2, §3); T2 discipline, T3 specialization, T4+ leaves
  (§2); defense and recovery in equipment under the Striker's four rules (§12.10); the
  relic is the boss trophy (§4); prefer triggers that work in every fight (§1);
  stack-then-detonate and freeze-then-shatter are the Apprentice's (§3); the same buff or
  debuff from two players doesn't stack (§7.12).

### Review log

*(The designer's calls, in order, as the dive makes them.)*

**First review (2026-10-14), asked with the question pop-up:**

- **Fantasy: the gunslinger, with real guns** (F1): "I load the right rounds and empty the
  clip." Pistols and flintlocks; clips, rounds and the Hand Cannon read literally.
  *Decided.* Follow-up for the art pipeline, not this dive: today's Slinger bodies carry
  no firearm (the prompts avoided gun nouns), so guns must be drawn. *Proposed (note).*
- **The Loadout is a rack of clip types; a free rule picks the next clip at each reload**
  (L1). The reload is the decision point: ammunition chosen for the situation, never a
  sequence of rounds and never an instant answer to an enemy move, which keeps it apart
  from the Order and the Response rules (§3). *Decided (shape).*
- **The stationary reload is the class's risk window** (R): standing still for part of
  every clip is what makes the Slinger catchable, the class-level answer to the boss
  pass's finding that an orbiting ranged class never stands in a telegraph. Gunslinger and
  gear lines may loosen it; no reload-triggered shields or heals (§12.10). *Decided.*

**Second review (2026-10-14), asked with the question pop-up:**

- **No abilities outside the class system** holds for the Slinger (§3): everything it does
  is in the Loadout (clip types, the last round, reload rules); gear, relic and leaves are
  passive, with no callout. *Decided.* With the Striker and the Squire, three classes of
  six have confirmed it.
- **The relic owns the last round:** the boss trophy is a special round loaded last in
  every clip; a plain last round until the first boss kill (no starter trophy, as the
  Striker and the Squire). Trickshot makes more of it. *Decided.* This settles the
  collision the old tree had (the Duelist's exploding last bullet duplicated the Marksman's
  last round): one owner.
- **Switching ammo costs a reload** (R4): a rule may dump the clip early to load a better
  one; you lose the rounds left and stand still. When a switch is worth it is the
  Loadout's decision. *Decided.*
- **Siege's marks become a bank on the Slinger** (M2): the clip charges something on the
  Slinger and the reload fires it, the Cannoneer's shape. Nothing is stored on the target,
  so it stays clear of the Apprentice's stack-then-detonate (§3), the same rule that keeps
  the Striker's Momentum on the Striker (§12.5). *Decided (shape).* **Deathmark** (the
  designer's planned specialization) was not described: *Open, to ask.*
- Still *Proposed* (presented, not answered): R5, the reload as a readable moment (the
  ring empties, a reload bar fills around it, the next clip's colour shows; each gun has
  its own reload pose and sound); P1, per-round effects build to a cap; P2, the gun sets
  fire rate, clip and reload and the discipline shifts the clip; O1, ownership (clip types
  own every round, the relic the last round, the discipline the rhythm, a specialization
  bends the rhythm or the last round's delivery); the discipline fantasies (Gunslinger the
  fast hand, Siege the emplacement, Trickshot the showman).
- Parallel check: the [Apprentice log](apprentice-deep-dive-log-2026-10-14.md) proposes XC2,
  "marks never bank damage": a Slinger mark designates a target and never stores damage.
  M2 satisfies it (Siege's bank lives on the Slinger). The
  [Spirit log](spirit-deep-dive-log-2026-10-14.md) has no collision (its energy is a pool
  and shield in one; holding fire keeps the shield).

**Third review (2026-10-14), asked with the question pop-up:**

- **Deathmark, in the designer's words:** "bullets mark the enemies they hit, reload
  detonates the marks all at once." The brief's Siege idea. *Decided (concept) / Open
  (where it lives, and its shape under XC2).*
- **Siege's shell is made of what you fired** (S1): every round of the big clip loads a
  charge into a siege gun on the Slinger; at the reload, while it stands still, the shell
  lands where the target stands, an area blast carrying the clip type's property (Venom: a
  gas shell; Scatter: a cluster shell; Breaching: a bunker-buster). Siege's risk window is
  also its big moment. *Decided.* Agent's note: three classes now bank toward one big hit
  (the Striker's Momentum from its swings, single target; the Squire's slam from enemy
  hits; Siege's shell from rounds fired, an area blast in the reload); S1's area and
  clip property keep Siege apart. *Proposed (note).*
- **The budget: rack slots, then double loads.** Global Mastery's steps add clip types to
  the rack (illustrative: one at the start, two at Mastery 15, three at Mastery 30); once
  the rack is full, a step lets one clip carry two properties (Venom + Breaching rounds):
  custom loads, the gunslinger's craft. Shown in class terms. *Decided.* Risk to watch:
  every pair is a combination to balance. *Proposed (note).*
- **A plain clip is always there and is the damage clip:** it is loaded when no rule
  fires and needs no rack slot; typed rounds trade some raw damage for their effect, so
  plain stays a real choice. *Decided.* Whether a double load pays both prices: *Open.*

**Fourth review (2026-10-14): Deathmark placed; T1 accepted as drafted.**

- **Deathmark is a Siege specialization: the shell splits** (DM1). Rounds mark the
  enemies they hit; at the reload the banked shell bursts on every marked enemy at once.
  The charge lives on the Slinger and the marks only say where it lands (one mark per
  enemy, never stacking), so it is breadth, where the Apprentice's stack-then-detonate is
  depth on one target, and it passes the Apprentice dive's XC2. *Decided.* Not taken: DM2
  (a Gunslinger spec detonating each clip's marks), a Trickshot version set off by the
  trophy round.
- **What each gear slot asks** *(Decided)*: the weapon, **"which gun?"** (fire rate, clip
  size and reload time, plus one job); the armor, **"what covers your reload?"** (a shared
  base plus a Slinger line that protects the stationary window, always as a "while
  reloading" state, never a per-reload trigger); the charm, **"where are you safe?"**
  (Recovery tied to distance, movement or being out of combat, never to the reload or your
  shots).
- **T1, biome by biome** *(Decided: direction; names and numbers open)*:

  | Biome | Threat | Clip type | Gun (job) | Armor (base + Slinger line) | Charm | Trophy (last round) |
  |---|---|---|---|---|---|---|
  | Plains | swarms | **Scatter:** each round bursts on impact, nicking up to two enemies beside the target | **Pepperbox:** fast fire, a big clip, light rounds; Scatter nicks one more | Plating + **Elbow Room:** while three or more enemies are near you, you reload faster | **Breathing Room:** Recovery rises with the distance to the nearest enemy | Tusked Razorback, **Stampede Round:** knocks the target and everything in a line behind it back |
  | Forest | fast packs | **Snare:** each round slows the target's movement and attacks a little, up to a cap | **Carbine:** quick fire, a quick reload; the first rounds of each clip hit harder (the Scout's openers) | Evasion + **Quickdraw:** you can walk at half speed while reloading | **Fleet:** Recovery doubles while you move | Gnarled Greatbear, **Twin Round:** the last round fires twice |
  | Swamp | attrition | **Venom:** each round adds a poison (damage over time) | **Snakebite Pistol:** slow fire, a small clip; your poison lasts longer and the last round hits a poisoned target harder | DoT resistance + **Oilskin:** damage over time on you is halved while you reload | **Snake Oil:** Recovery doubles while you carry poison or bleed and no enemy is near you | Grave Toadeater, **Rot Round:** the last round's wound rots, hitting again over a few seconds |
  | Mountain | the hardest hits | **Stopping:** each round shoves the target back a little; a charger reaches you late | **Hand Cannon:** slow fire, a 6-round clip, heavy rounds; the last round hits much harder | Damage cap + **Dig In:** while you reload, no single hit takes more than a fifth of your HP | **Regroup:** after a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds | Crag Behemoth, **Quake Round:** a heavy slug that hits everything around the target |
  | Cave | elites, plating | **Breaching:** every round ignores most of the target's plating (today every Slinger shot pays half plating; that moves to this clip) | **Drum Gun:** a big drum, a slow reload; each round of a clip hits a bit harder than the last (the Artillerist ramp) | Bulk + **Hunker:** your plating doubles while you reload | **Bivouac:** much faster out-of-combat Recovery | Obsidian Broodmother, **Splinter Round:** the last round splits into three that strike the nearest other enemies |

  Weapon fits: Gunslinger the Carbine and Pepperbox; Siege the Drum Gun and Pepperbox;
  Trickshot the Hand Cannon and Snakebite Pistol. Notes *(Proposed)*: Snare and Stopping
  are control that scales with fire rate, so both build to a cap (P1) and bosses may shrug
  them off; Twin Round, Splinter Round and Trickshot's ricochet all multiply the last
  round, so watch them together; Rot Round crosses the Striker's Festering Cut (a theme
  crossing, §3); "Splinter" avoids "shatter" (the Apprentice's).
- **The first ten minutes** *(Decided: shape; numbers illustrative)*: the Clearing gives a
  plain pistol (8 rounds), the ammo ring and one preset rule (reload when empty); the
  reload is stationary. The Plains teaches Scatter around minute 6, in rack slot 1 with a
  default rule (three or more enemies → Scatter, else plain). The first boss is won with a
  plain last round and gives Stampede Round. By the end of T1 the Slinger owns five clip
  types and carries three.

**Fifth review (2026-10-14): the disciplines accepted as drafted.** Asked with the question
pop-up. *Decided (rules); numbers and looks illustrative.* The old frames' successors, as
in both melee dives:

| | Gunslinger (light, from Scout): the fast hand | Siege (heavy, from Artillerist): the emplacement | Trickshot (balanced, from Marksman): the showman |
|---|---|---|---|
| Fantasy | "Two guns, never still for long." | "I dig in and shell everything." | "Every clip ends with the impossible shot." |
| Clip and reload | The smallest clip, the quickest reload (a spin) | The biggest clip (a drum), the longest reload: the riskiest window | The gun's own clip and reload |
| Rule | **Twin guns** (G1): two of whatever gun you hold, each with half the clip and its own clip type from the rack; shots alternate (Snare left, Venom right), so two clip types act at once; both reload together in a quick spin | **The shell** (S1): every round charges a siege gun on your back; the reload fires it where the target stands, an area blast carrying the clip's property; Deathmark is its specialization | **Called shot** (T1): the last round (your trophy) flies to a target a free rule picks (the enemy winding up, the lowest HP, the elite), anywhere in range, past whatever stands in the way, and hits harder (the Marksman's ×2.2, now Trickshot's). Ricochet and pierce become its specializations |
| Damage, rounds / payoff | ~85 / 15 (the last round) | ~50 / 50 (the shell) | ~60 / 40 (the last round) |
| Look | Each round coloured by its clip; a gun spin on the reload | A mortar on the back whose barrel glows as the shell charges (the Artillerist glow) | A gold glint as the last round chambers; a gold tracer |
| Best at / weak at | Mixed fights and farming (switching is cheap) / plating (light rounds) | Packs and bosses that hold still / kiters and telegraph-heavy fights (the long stationary reload) | Bosses, elites, casters / swarms (one big round on a dying mob is wasted) |

Not taken: G2 (every reload arms a fast burst of the new clip's first rounds; stays a
possible specialization or leaf), G3 (reload on the move: a removal, not a mechanic; the
Forest's Quickdraw armor keeps half of it); T2 (ricochet as the base rule: now a
specialization), T3 (the clip's tally: a fourth bank toward one big hit, after the
Striker's Momentum, the Squire's slam and the Siege shell). Notes *(Proposed)*: twin guns
overlap double loads (both put two properties in play at once); a twin-gun double load is
four properties, so watch it.

**Sixth review (2026-10-14): ownership and the T3 board accepted as drafted.**

- **Ownership** (O1) *(Decided)*: clip types own every round; the relic owns the last
  round; the discipline owns its rule (twin guns, the shell, the called shot); a
  specialization bends that rule or the delivery of the shell or the last round, never
  what a clip or a trophy does; leaves are small turns on all of it. **Specializations are
  content-neutral**, as the Striker's (§12.6).
- **The T3 board** *(Decided: concepts; names and numbers open)*. Mined from the old paths:
  Fan the Hammer (Desperado's reload trigger), Entrenched (Warmonger's carry), Rolling Fire
  (the Cannoneer reversed), Deadeye (the Sniper).

  | Gunslinger (twin guns) | Siege (the shell) | Trickshot (the called shot) |
  |---|---|---|
  | **Fan the Hammer:** after every reload spin, both guns' first three rounds fire at triple rate (the brief's reload triggers; Gunslinger reloads most, so it pays most) | **Deathmark:** rounds mark the enemies they hit; at the reload the shell bursts on every marked enemy at once | **Ricochet:** the called shot bounces on to two more enemies, each picked by your rule, each taking the trophy's twist |
  | **Crossfire:** a target hit by both guns back to back takes both clips' effects at +50%; the pair you rack is the build (Snare + Venom, Breaching + Stopping) | **Entrenched:** the longer you stand your ground, the faster you fire and the bigger the shell, to a cap; moving resets it; the stationary reload counts as standing | **Pierce:** the called shot passes through every enemy between you and its target, each taking it in full |
  | **Gun Kata:** you fight at arm's length; rounds hit much harder up close, and both guns fire at once at enemies in melee with you (a range commitment, not a dial) | **Rolling Fire:** the shell fires in small pieces, a small shell every few rounds, and the reload carries none: steady area instead of one big moment | **Deadeye:** the last round can be held; the clip waits on it until your rule's moment (an enemy winds up, an elite appears, the target drops below a third) or a few seconds pass; held, it hits much harder |

  Spares: The Draw (each fight opens with both guns emptying at triple rate), Airburst (the
  shell covers a wide circle, weaker per enemy), Encore (the last two rounds are both called
  shots). Notes *(Proposed)*: Ricochet, Pierce and Deathmark lean to packs, Deadeye and
  Entrenched to bosses (watch them against content-neutrality); Gun Kata puts a ranged
  class in melee, where damage taken doubles (the boss pass), so it needs its own armor
  answer; Deadeye's held round crosses the Striker's Crescendo release and the Squire's
  rule that holds the slam (a theme crossing).

**Seventh review (2026-10-14): the T4 leaves accepted as drafted.**

- **The Slinger's T4 asks "what goes wrong?"**: you're caught reloading, they reach you,
  or the wrong clip is loaded; one answer each per discipline, in its style (Gunslinger
  footwork, Siege fortification, Trickshot composure). The first two columns carry the
  resilience a stationary-reload class needs (the bible gives T4 resilience to melee; the
  Slinger takes it for its window, in two columns of three); the third keeps the rack's
  choice interesting. Every defensive leaf is a state or enemy-paced, never triggered by
  your shots (§12.10). Shaped after the Squire's "what happens when you can't answer?"
  (§8.7). *Decided (names and numbers open).*

  | | Caught reloading | They reach you | The wrong clip |
  |---|---|---|---|
  | Gunslinger | **Light Hands:** while you reload, the first hit every few seconds deals half damage | **Slip Away:** while an enemy is in melee with you, you move a quarter faster | **Quick Swap:** switching clips early keeps the rounds you had left; they come back in the next clip |
  | Siege | **Bunker:** while you reload, you take a quarter less damage | **Stakes:** an enemy that charges or rushes you is stopped dead at your feet for a moment, once per enemy every few seconds | **Fresh Powder:** the shell takes the property of the clip you're loading, not the one you fired, so a switch reload fires the right shell at once |
  | Trickshot | **Cool Reload:** telegraphed attacks aimed at you while you reload deal half damage | **Steady Nerve:** while an enemy is in melee with you, you can't be stunned or knocked back | **Improvise:** when the loaded clip does nothing to the called shot's target (control on a boss that accepts none, poison on the immune), the called shot hits a third harder |

  Theme crossings *(Proposed, notes)*: Cool Reload with the Striker's Read the Blow; Stakes
  with the Squire's Stand Fast and the Conduit's Ironhorn.

**Eighth review (2026-10-14): T2 accepted as drafted.** *Decided on paper, to judge in the
game; names and numbers open.* A returning biome teaches a lesson (a new clip type, a
sidegrade or a rank-up, as §12.8) and its T1 gear jobs come back stronger; the new biomes
add gun, armor and charm jobs and a trophy; the disciplines arrive at the same tier.

| Biome | T2 threat | Lesson (kind) | New gear jobs | Trophy |
|---|---|---|---|---|
| Plains | stampedes | **Buckshot** (sidegrade of Scatter): each round sprays a cone of pellets, harder up close; the pellets stop a charging enemy in its tracks | — | Gorging Razortusk: Stampede Round II, the shove also knocks down |
| Forest | cadence duel, stuns | **Snare II** (rank-up): builds faster, and at its cap the target's wind-ups take longer too | — | Apex Timberclaw: Twin Round II, both shots full strength |
| Mountain | heavy plating, breakable barriers, charges | **Shellbreaker** (new): every round hits barriers and shields double | — | Stoneplate Juggernaut: Quake Round II, a wider blast that also cracks plating |
| Swamp | pools, rain, the rising mire; Corrosion | **Venom II** (rank-up): deeper poison that lasts longer | — | Mire-Gorged Behemoth: Rot Round II, a bigger share |
| Cave | eruptions from below | **Breaching II** (rank-up): ignores all plating | — | Chitinous Dreadbore: Splinter Round II, four splinters |
| Jungle (new) | fleeing prey, ambushers from cover | **Tracer** (new): each round tags its target, so it can't hide, vanish or break away from you; ambushers in cover are revealed. It designates, never stores damage (XC2) | Gun **Hunting Rifle:** long reach; rounds hit harder the farther the target. Armor: anti-ambush base + **Lookout:** an enemy that ambushes you while you reload is slowed and revealed. Charm **Undergrowth:** Recovery doubles while no enemy is targeting you | Jungle Dread-Gorger, **Hunter's Round:** the last round follows its target, can't miss a fleeing enemy, and hits harder the farther it flies |
| Desert (new) | mark, slow, execute; ranged kiters | **Hollow-point** (new): every round hits a target below half HP harder | Gun **Long Rifle:** the longest reach in the game; outranges kiters. Armor: ranged-hit base + **Glass Duster** (the brief's): you reload faster and hit harder, and the base's defense is lower (an allowed trade, §1). Charm **Shade:** every few seconds a mark or slow on you ends | Dune-Stalker Emperor, **Bounty Round:** the last round executes a target below a threshold (a threshold, not an on-kill) |

- **The brief's other items re-homed** *(Decided)*: the Hand Cannon is the Mountain gun
  (§T1); its legendary ("bonus per round that hit this clip") is the clip's tally passed on
  in the fifth review, so it stays a rule-bender idea; the **Bandolier** ("each reload adds
  marking rounds") is a Deathmark rule-bender. Both go to the components and rule-benders
  session (§4).
- Notes *(Proposed)*: by the end of T2 the Slinger owns 9 clip types (Scatter, Buckshot,
  Snare, Venom, Stopping, Breaching, Shellbreaker, Tracer, Hollow-point; rank-ups counted
  once). Shellbreaker crosses the Squire's Splitting Blow and the Striker's Icebreaker; the
  Desert is the execute lineage for every class (Hollow-point, Bounty Round); Tracer is the
  Slinger's answer to fleeing prey (the Striker's is Charge, the Squire's Chain Hook).

**Ninth review (2026-10-14): T3 and T4 accepted as drafted.** *Decided on paper, to judge
in the game; names and numbers open.* Jobs move when a biome retires: after T2 the
Forest's (Carbine, Quickdraw, Fleet) to the Jungle and the Plains' (Pepperbox, Elbow Room,
Breathing Room) to the Volcanic; after T3 the Swamp's (Snakebite Pistol, Oilskin, Snake
Oil) to the Wasteland and the Cave's (Drum Gun, Hunker, Bivouac) to the Trench.

- **T3:**

  | Biome | T3 threat | Lesson (kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain | the double charge | **Stopping II** (rank-up): a stopped charger is also staggered | — | Crag-Gorged Horn-Behemoth: Quake Round III, it knocks down |
  | Cave | the tunnel chase | **Seeker** (new): rounds find a target that has burrowed, dived or gone out of sight, at reduced damage | — | Deep-Core Burrow-Gorger: Splinter Round III, the splinters split once more (the last rank) |
  | Swamp (last tier) | spores, detonating pools, the drag | **Acid** (sidegrade of Venom): instead of poison, each round eats a little plating, up to a cap | — | Rot-Spore Croc-Behemoth: Rot Round III (the last rank) |
  | Jungle (+ the Forest's jobs) | pursuit, flight | **Tracer II** (rank-up): a traced target also moves slower while it flees | The Forest's jobs | Apex Bramble-Slasher: Hunter's Round II |
  | Desert | postures; the Monarch turns kiter at half HP; a dash-escape | **Tether** (new): a target hit by several rounds in a row can't dash or teleport away for a moment | — | Dune-Carapace Monarch: Bounty Round II, a higher threshold |
  | Tundra (new) | the Chill clock, Deep Freeze, Ice Armor, root casters; bosses accept no control | **Frost** (new): each round chills (slower attacks and movement), up to a cap; never freezes (shatter is the Apprentice's) | Gun **Frostlock Rifle:** rounds hit harder against chilled, slowed or rooted enemies. Armor: chill base + **Warm Hands:** the Chill on you doesn't build while you reload. Charm **Thaw:** Recovery doubles while you're chilled or slowed | Frost-Plated Rime-Mammoth, **Rime Round:** the last round leaves frozen ground that slows enemies on it |
  | Volcanic (new; + the Plains' jobs) | Heat, vents, the Final Eruption, obsidian shells, hound swarms, burning gunners | **Incendiary** (new): each round sets the target burning, up to a cap; never detonates (the Apprentice's) | Gun **Firebrand Pistol:** each step of the fight's Heat makes every round hit harder. Armor: heat base + **Asbestos Coat:** the Heat's extra damage doesn't apply to you while you reload. Charm **Heatsink:** Recovery rises with the Heat while no enemy is near you | Cinder-Shell Magma-Salamander, **Cinder Round:** the last round sets everything around the target burning |

- **T4:**

  | Biome | T4 threat | Lesson (kind) | New gear jobs | Trophy |
  |---|---|---|---|---|
  | Mountain (last tier) | Earthshatter, delayed fault lines | **Shellbreaker II** (rank-up): a barrier breaks in a few rounds | — | Iron-Crest Titan: Quake Round IV, aftershocks (the last rank) |
  | Tundra | Ice Armor at its heaviest | **Frost II** (rank-up): builds twice as fast; Ice Armor takes it double | — | Glacial Patriarch: Rime Round II |
  | Jungle | hard to catch, then it commits | **Tracer III** (rank-up): rounds on a traced target hit harder while it flees or hides | — | Verdant-Crown Predator: Hunter's Round III |
  | Desert | three acts: melee, kiter, cornered | **Hollow-point II** (rank-up): the bonus doubles below a third | — | Dune-Throne Sovereign: Bounty Round III |
  | Volcanic | the Heat race, Magma Shove | **Thermite** (sidegrade of Incendiary): the burn eats shells; obsidian and ice shells take it double | — | Caldera Sovereign: Cinder Round II |
  | Wasteland (new; + the Swamp's jobs) | the dead rise; area matters | **Hallowed** (new): risen enemies take double from these rounds and rise weaker | Gun **Reaper's Repeater:** each round splashes a share of its damage to enemies around the target. Armor: base (risen enemies hit softer) + **Hallowed Ground:** while you reload, risen enemies around you deal half damage. Charm **Vigil:** Recovery rises with the number of enemies in the fight while none is near you | Charnel-Crown Sovereign, **Toll Round:** the last round hits harder for every enemy in the fight |
  | Trench (new; + the Cave's jobs) | the debuff pile, Devour, dives out of reach; one enormous duel | **Exploit** (new): each round hits harder for each different debuff on the target | Gun **Pressure Rifle:** rounds hit harder the more HP the target has left. Armor: debuff-resistance base + **Pressure Suit:** debuffs can't land on you while you reload. Charm **Ballast:** Recovery rises for each debuff on you | Elder Trench Serpent, **Harpoon Round:** the last round harpoons the target; for a few seconds it can't dive, burrow or flee |

- **Totals through T4:** 14 new clip types, 3 sidegrades (Buckshot, Acid, Thermite), 9
  rank-ups. Eleven trophies: Stampede, Twin, Rot, Quake, Splinter, Hunter's, Bounty, Rime,
  Cinder, Toll, Harpoon. Rack size illustrative: 3 by the end of T1, 4 by the end of T2,
  double loads from T3. *Proposed (numbers).*
- **How T3 and T4 test the Slinger** *(Proposed, notes)*: the Tundra and Volcanic bosses
  accept no control, so Snare, Stopping, Frost, Tether and Stampede Round do nothing there
  (Improvise, Breaching, Thermite and the shell carry); shells want burst (the Siege shell,
  the called shot, Thermite, Shellbreaker); the Heat and the Chill land during the
  stationary reload (Asbestos Coat, Warm Hands); the Final Eruption is a damage race (Fan
  the Hammer, Entrenched, Deadeye); the Wasteland is the area fight (Deathmark, Rolling
  Fire, Ricochet, Pierce, Reaper's Repeater, Toll Round); the Trench is the duel (Exploit,
  Pressure Rifle, Harpoon Round), and the Cave's Seeker rounds answer its dives.

**Tenth review (2026-10-14): the last calls before the rewrite.** Asked with the question
pop-up; all three as recommended.

- **Party role: ranged damage and spotter.** Its debuffs help the party: traced enemies
  can't hide from anyone, Acid strips plating, Snare and Frost slow. Its buffs are
  self-only; the same debuff from two Slingers doesn't stack, the strongest copy applies
  (§7.12, §12.12). *Decided.*
- **A double load pays the higher of its two prices,** so a double load is a real gain, as
  a budget step should be. *Decided.* This closes the third review's open item.
- **Callouts: the trophy round and the shell.** The trophy last round calls out by name in
  every discipline, and Siege's shell calls out; clip switches show on the ammo ring with
  no callout. *Decided.*
- Raised as a cross-class proposal (XC2 below): kiting as a free universal standing order.

**Eleventh review (2026-10-14): §10 rewritten and locked.** The agent rewrote §10 to the
class template in one edit (one replacement of the stub; no other section touched) and
walked the designer through its unconfirmed proposals. All twelve were accepted:

- **Core:** per-round effects build to a cap (P1); the reload as a readable moment (R5);
  the gun sets fire rate, clip and reload, and the discipline shifts the clip by a flat
  amount (P2); every clip type scales with the Slinger's tier. *Decided.*
- **Loadout and presentation:** the budget numbers (rack 1 → 2 at Mastery 15 → 3 at 30, 4
  by the end of T2, double loads from T3; illustrative, the bots tune them); the HUD
  (clip-coloured ring, gold last round, twin half-rings, the shell's glow, the called
  shot's target mark); the default reload rules (reload early when nothing threatens; never
  start a reload inside a telegraph); no stance-like modes (the loaded clip is the mode).
  *Decided.*
- **Plans and vocabulary:** the bot plan; the salvage, with the Melter's heat laser parked
  (no home in the rework); the clip families (damage, control, utility); clip
  transformations as the spare theme for later leaf tiers. *Decided.*
- **§10 locked** as build authority. Still *Proposed* inside it: notes, §4's generic boots,
  guns drawn for the bodies (art), and XC2. The lock archives nothing (no design doc is the
  Slinger's alone). Not committed (the designer's call). *Decided.*
- Left outside §10 for the designer: the bible's status table at the top still reads
  "Draft (deep dive started 2026-10-14)" for §10 (and for §11, also locked), since this
  dive edits only §10.

**Twelfth review (2026-10-14): wrap-up.** Asked with the question pop-up; all four as
recommended.

- **XC1 accepted and written into §3** (authorized outside §10): "Fire rate is not attack
  speed": no other class's attack-speed effect touches the Slinger's fire rate unless the
  effect says so. *Decided.*
- **XC2 accepted and written into §3:** Keep Distance (kiting) joins the free universal
  standing orders. *Decided* for Keep Distance; the rest of §3's list stays *Proposed*.
  §10.10 and §10.15 updated to match.
- **The status table's §10 row** now reads Locked (authorized). *Decided.*
- **The commit holds only this session's work:** the prep, this log, and the bible and
  `docs/README.md` built in the index as HEAD plus this dive's changes (§3's two lines, the
  §10 row, §10, the README's Slinger entries and lock note). Other sessions' uncommitted
  changes to the same files (the Spirit's §11 and its README entries) stay in the working
  tree for them. *Decided.*

### Cross-class proposals

*(For the designer; never edited into §1–§6 or another class's section by this dive.)*

*Both decided in the twelfth review and written into §3.*

- **XC1, fire rate and other classes' attack speed** (*Decided*): fire rate is the
  Slinger's own stat (brief), so no other class's attack-speed effect touches it unless it
  says so. Today every such effect is self-only (the Striker's) or summon-only (the
  Conduit's Warhorn), so nothing changes now; the rule matters if a party attack-speed
  buff ever appears.
- **XC2, kiting is a free universal standing order** (*Decided*, §3). Today Keep Distance
  is a rune (`RUNE_KEEP_DISTANCE_FLAG`, kiting "no longer automatic for ranged players").
  §3's free standing orders list Flee, Recover First, Avoid Hazards, target focus and
  travel, not kiting. All three ranged classes (Slinger, Spirit, Apprentice) need it, and
  with the Slinger's stationary reload it decides where the Slinger stands when it stops.
  Not to be confused with the Apprentice dive's XC2 (marks never bank damage), which the
  Slinger's design already satisfies.
