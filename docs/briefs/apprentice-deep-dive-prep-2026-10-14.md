# Apprentice deep dive — prep pack (2026-10-14)

**What this is:** the starting material for the Apprentice's class deep dive in the
class-first rework. The Conduit (§7) and the Striker (§12) are locked: worked examples, not
templates. The output is §9 of the [class-first bible](../../design_docs/class-first-bible.md),
written to the class template (bible §6). Nothing here is decided unless it says so.

**Running in parallel:** the Squire dive (§8) runs in another session; the Slinger and Spirit
dives run beside this one. The Slinger, Spirit and Apprentice are today's three ranged
classes. Every call goes to
[apprentice-deep-dive-log-2026-10-14.md](apprentice-deep-dive-log-2026-10-14.md); §9 stays a
stub until the dive converges; cross-class ideas go in the log's "Cross-class proposals".

## What the designer has already said

From the [brief](class-first-rework-brief-2026-10-13.md):

- **Core mechanic:** attack converts to **element stacks**. *Tentative.*
- **Custom system: Payoff rules:** where stacks go on death, when to detonate, what
  triggers spread. *Tentative.* The brief's principle 4 names the class's moment:
  "automation must produce power … well-timed releases, counters, **detonations**".
- **Disciplines:** **Poison** (spreads on death; packs) · **Fire** (detonate for burst) ·
  **Frost** (slow → freeze → shatter; bosses). A second element and reactions around T5–T6.
  *Tentative.* The redesigned bosses are the stage for "Frost/Execute builds". *Decided.*
- **Known issue to fix:** DoT weapons were a trap: attack conversion made slow, hard-hitting
  weapons strictly better. Class-specific DoT weapons (stacks, tick speed, spread) fix it.
- **The front-weighted stack curve is scrapped,** replaced by spread and detonate.
  *Tentative.*
- **Item examples** (*Tentative*, written before §4): Frostbrand Staff (+1 max frost stack;
  shatter scales with stacks); Plague Censer, a relic (spreading poison also spreads 50% of
  fire stacks). The relic slot is now the boss trophy (§4) and the Censer is a two-element
  reaction (T5–T6), so both are seeds at most.

From the bible: **freeze-then-shatter and stack-then-detonate are the Apprentice's
signature payoffs** (§3, *Decided*); themes may cross, and a Conduit damage-over-time
playstyle is allowed. The other dives steered clear: the Striker's Momentum lives on the
Striker, never on the target (§12.5); its Tundra technique consumes no freeze (§12.16); the
Conduit's Tundra and Volcanic weapons avoid both payoffs (§7.16); the brief's "Shatter"
finisher form stayed the Apprentice's (§2).

## Decided in the bible since (cross-class)

Read §1–§6 for the exact wording. In short:

- **No abilities outside the class system** (§3): *Decided* for the Striker and the Squire,
  *Proposed* for every class: **to confirm here.** Today's Contagion, Detonate and Imbue
  either become Apprentice payoffs or go.
- **Rules cost nothing; each class has its own budget,** grown by Global Mastery in steps
  and shown in class terms ("Command 7, next at Mastery 24"; the Squire's is Resolve's size,
  the Striker's opens then masters technique slots). The Apprentice's is this dive's question.
- **Progression** (§2): T2 discipline (a considerable power step), T3 specialization (three
  per discipline), T4 onward leaves (three per discipline per tier), a T7–T8 capstone.
- **The relic is the boss trophy** (§4); all three classes so far chose a plain payoff until
  the first boss kill (no starter trophy).
- **Prefer triggers that work in every fight;** avoid on-kill (§1).
- **Specializations are content-neutral** (Striker, *Decided*); disciplines may lean to
  content (the Conduit's Swarm to packs, Elite to bosses).
- **Defense and recovery live in equipment,** never on triggers that scale with attack
  speed (§12.10). The Striker's four rules: nothing on your hits; nothing scaling with
  attack speed; no shield you can keep up forever; no resource doubling as a shield.
- **Each biome's threat hands you its answer;** a returning biome teaches a new piece, a
  sidegrade or a rank-up; a retiring biome's gear jobs move up a tier (§7.16, §8, §12.16).
- **Party:** the same buff or debuff from two players doesn't stack (§7.12, §12.12).
- **Offense–defense trades are allowed,** one way, in the class kit (§1).
- **Every class system has a T1 form** (§2, *Proposed*): 25 of 38 live players never reached T2.

## What worked in the dives (method, not a template)

The designer's T1 sketch biome by biome, then T2–T4 at the end; fantasies before rules
(up-front structural rules were rejected twice); the designer stepping back so good
alternatives became disciplines and specializations. Turned down, as patterns: effects too
flashy to read, vanilla ramps, a specialization for one kind of content, abilities outside
the class system, defense riding offensive triggers, per-piece authoring sprawl, on-kill
triggers, unclear casts. Question pop-ups are welcome (the Squire dive uses them). IDs on
every proposal.

## What exists today, and what it might become

| Piece | Today | In the rework |
|---|---|---|
| Core loop | Each hit converts part of its damage into stacks of the frame's element on the target. Stack damage derives from the hit's attack; a front-loaded curve (√(stacks × cap)) makes a few stacks hit harder than linear. **No finisher:** "its mechanic is the stack bar itself" (`dot/frameLoop.ts`) | Element stacks with visible payoffs; the curve goes |
| Before T2 | A root-only Apprentice burns (the Fire profile is the fallback) | The T1 form is new work (Q3) |
| Chassis | The middle one: +10% attack, +12% HP, +8% DR, reach +60; 18% DoT resistance; 15% of incoming direct hits arrive as a DoT on itself ("delayed damage you can outlast") | Per-class stats are §5's question; the delayed hit is defense material |
| Frames (T2 today) = the brief's disciplines | **Venom vessel** (poison: 8 stacks, 30% conversion, 1 s ticks; opens hard: the first hit on a clean target lands 4 stacks) · **Ember mage** (fire: 6, 50%, 1.5 s; intensifies: hits into a full-burn target ×1.4) · **Rime-Bound** (frost: 3, 70%, 2 s; chills: 2% slow per stack) | Already Poison / Fire / Frost; the verbs are material |
| Range (T3 today) | **Hexblade** (close drain-tank) · **Warlock** (a stack on an enemy held at bay also lands on its nearest neighbour) · **Harbinger** (+1 stack, +35% duration, never spreads) | Scrapped as nodes; Warlock is a spread with no kill in it |
| T3 paths (T4 today) | Poison: **Venomslinger** (cap 10; at 10 detonates all for 10 ticks), **Cultist** (no cap, diminishing to 40), **Zealot** (full stacks → Frenzy). Fire: **Pyromancer** (2 stacks a hit; Radiant: at full burn, ticks also hit adjacent enemies), **Firebrand** (the first hit sears every stack at half, then hits land in full), **Cinder Lord** (at full, stacks become a fast 80% blaze). Frost: **Icebreaker** (at full, hits land in full + DR shred), **Winter Warden** (chill to 9 → Frozen 2 s: a severe slow, +35% damage taken), **Wind Spirit** (100% conversion; Frostbite) | Mine the ideas, don't port. Venomslinger and Cinder Lord already stack-then-detonate; Winter Warden's "Frozen" is already not hard control |
| Affliction toolkit (shared) | **Contagion** (armed: the next hit copies the target's afflictions, full strength, to nearby enemies) · **Detonate** (cast: consumes DoTs, pays what they still owed × 2.0 for class stacks) · both decline when there is nothing to act on | Become Apprentice payoffs (§3) |
| Rule conditions | Exist: the target at max stacks, the target's HP %, shielded, elite, a boss escaping, enemies on you | Payoff rules' vocabulary. Missing: stack counts below the cap, frozen or chilled, enemies around the target |
| HUD | A DoT stat panel in system language (conversion %, multiplier, tick, DPS estimate); target stacks as a badge on the target tile; `dot-tick` numbers coloured by element | Stacks shown on the enemy; callouts for payoffs |
| Art | Bespoke `fx/bespoke/apprentice.ts`; element tints (`dotElements.ts`); Apprentice bodies through T3 | Reused |

**Runtime seams worth knowing:**

- **The DoT inventory** (`combat/damage/dotInventory.ts`) answers "what is on this target,
  whose, what element, how much does it still owe" for every DoT family. Contagion, Detonate
  and the max-stacks condition read it: the Payoff rules' engine already exists.
- **Ownership is last-applier:** one class `dot` record per monster; two Apprentices on one
  target contest it.
- DoT ticks skip plating and pay half of DR; monster `dotResistance` stacks on top; a full
  evade blocks the debuff (CLAUDE.md). DoT kills fire `onKill`, so a death seam exists.
- **A freeze during a wind-up interrupts it;** some boss steps are uninterruptible; four
  bosses accept no control (`controlImmune`, below).
- **Shells:** the Snapper's shell-up lets DoTs tick at full strength on purpose; the
  Tundra's Ice Armor **shatters** when a burst breaks it (bonus damage, nearby monsters
  frozen); §7.16 says Ice Armor and Obsidian shells waste damage over time (verify).

Sources: `server/src/systems/classes/archetypes/dot/`, `shared/src/data/skillTree/rootsAndFrames.ts`,
`t3CombatB.ts`, `shared/src/systems/dotClassProfile.ts`,
[dot-systems-current-state.md](../dot-systems-current-state.md),
[abilities-current-state.md](../abilities-current-state.md) (the affliction toolkit).

## Evidence

- **No human playtest covers the Apprentice** (playtest 3 was a Striker); its evidence is
  bots and benches.
- **The slowest class through T1 in every tutorial sweep:** 77 min against 55–68; 69
  against 47–66; the first lean at 33 min against 11–27 for the others, "its farm pace, not
  the gate" ([guided-tutorial-current-state.md](../guided-tutorial-current-state.md)).
  Suspected, not verified: trash dies before its stacks pay out, so damage still owed on a
  dead mob is lost. That is the waste the brief's "where stacks go on death" answers, and
  why the front-loaded curve exists ("preserving class DoT pressure in short fights").
- **Races hurt a ramp:** the Greatbear (Bestial Frenzy, +20% attack speed every 6 s,
  uncapped) walled it 0/11 before the boss pass; 97% after
  ([t1-boss-pass-report-2026-10-02.md](t1-boss-pass-report-2026-10-02.md)).
- **The Second Wind crutch:** zeroing Second Wind took the Apprentice from 100% to 3% on the
  Razorback and from 97% to 0% on the Greatbear (same report). Second Wind is a shared
  ability the rework removes (§3), so the class's T1 survival needs its own answer.
- **Incoming damage sits mid-pack:** 6.6 / 9.6 / 4.5 / 4.0 / 1.7 HP/s on the five T1
  bosses, between the melee pair and the Slinger and Spirit.
- **Payoffs are the explosive numbers.** One 5× Detonate on class stacks made T4
  Apprentice specs 2–3× the tier median (cut to 2.0×, 2026-09-26). Contagion copies at full
  strength, so its target cap is the only bound on multiplication.
- **T4 outliers (2026-09-28):** Icebreaker 1.36× the median spec on T4 bosses (nerfed),
  Firebrand 0.83–0.86× (buffed); Pyromancer measured 33% below its own frame before §22.13.
- **The DoT-weapon trap, in numbers:** stack damage comes from the hit's attack and stacks
  are capped, so at the cap DoT damage per second ≈ per-hit attack × conversion, whatever
  the attack speed; attack speed only fills the cap sooner. Flat plating also favours big
  direct hits. Slow, heavy weapons win both (`computeDotClassDamagePerStack`).
- **Resistance on families** (provisional): Cave Brute 30%, Jungle Stalker and Ocelot 25%,
  Rockback Ram 25%, Grass Kite 15%.
- **Bosses that accept no control** (stuns and roots don't land): Frost-Plated Rime-Mammoth
  (Tundra T3), Glacial Patriarch (Tundra T4), Cinder-Shell Magma-Salamander (Volcanic T3),
  Caldera Sovereign (Volcanic T4).

## Collisions to resolve

1. **Poison "spreads on death" vs §1.** Options: (a) **spread over time** from a target at
   full stacks (Warlock's neighbour stack is a precedent); (b) **overflow**: stacks past the
   cap jump to the nearest enemy; (c) **death passes the leftovers on**, argued as an
   exception: it saves damage already paid for, adds none, and a boss loses nothing to it;
   (d) a mix. Lead: (a) for the power, (c) as plain "no waste". The Conduit's Infestation
   (an infested enemy bursts into summons on death) is already on §7.15's on-kill review.
2. **Payoff rules vs the Spirit's Thresholds** (and the Squire's Response rules): three
   if-then surfaces on one engine (§3). Lead: the Apprentice's rules read **the enemy's
   state** (its stacks, frozen, its HP, its cast, the pack around it); the Spirit's read its
   own energy; the Squire's answer enemy actions aimed at it. The
   [Spirit prep](spirit-deep-dive-prep-2026-10-14.md) leads the same split and gives the
   Spirit "marks on a vertical bar", so the Apprentice's screen must not be a gauge with
   marks either. Lead: an enemy with its stack ring, each payoff hooked to a moment (full,
   casting, low, frozen), not a list.
3. **The Slinger's Siege "marks detonate on reload" vs detonate.** Today's Bounty hunter is
   stack-then-detonate. The [Slinger prep](slinger-deep-dive-prep-2026-10-14.md) leads M1
   (breadth marks: one per enemy, never stacking, the reload volley hits them all), M2 (the
   bank lives on the Slinger) and M3 (marks draw shots; nothing detonates). Any of the three
   keeps clear **if a mark never banks damage**: damage banked on the target and cashed in
   by a rule stays the Apprentice's.
4. **Frost is "bosses", and four late bosses accept no control,** two of them the Tundra's
   own. A freeze is hard control. Options: on such a target the freeze becomes a state that
   is not control (brittle: takes more damage, can be shattered; Winter Warden's Frozen is
   already "a severe slow, not full CC"), or Frost takes the counter as the Squire and
   Striker did.
5. **"Shatter", the word:** Tundra Ice Armor already shatters when a burst breaks it. Two
   meanings of one verb in the same biome; pick one.
6. **Themes others use** (allowed, §3; none takes spread at scale, detonate or shatter):
   Striker bleeds (Rend, Hemorrhage, Hooked Sickle, Festering Cut), Hoarfrost, Frostbind,
   Eruption; Conduit the Swamp poison weapon, Infestation, Cinderling, Frostcaller,
   Icewarden, Dartcaller, Fireproof; Squire the Spiked Flail bleed, Glacier Mace,
   Frostward, Backdraft; Slinger (seeds) Venom rounds in the Swamp, freezing and burning
   clips at T3, all without spread, detonation or shatter.
7. **Names taken:** Icebreaker, Rend, Hemorrhage, Hoarfrost, Frostbind, Eruption, Rimeblade
   (Striker); Infestation, Burst, Permafrost, Hibernate, Fireproof, Emberglow, Cinderling,
   Icebound (Conduit); Kindling, Deep Winter, Frostward, Backdraft, Rot-Eater (Squire);
   Deathmark, Venom and Snare rounds (Slinger); Overflow, Reservoir, Tide, Surge (Spirit).
   Those two dives are live: search again before naming.
8. **Two Apprentices on one target:** today they contest one record; the party rule says
   the strongest copy applies; separate stacks per player would double a party's DoT.
9. **Second element and reactions** are T5–T6 (§13). Keep one element per discipline
   through T4, built so a second can sit beside it later (today: one class `dot` record).
10. **Old ids** (`dot-root`, `dot-light`…) may not return; names may (Pyromancer).
11. **For the designer, not this dive:** the T4 undead biome is "Graveyard" in §7.16 and
    "Wasteland" in §8 and §12.16 (same boss, the Charnel-Crown Sovereign).

## The questions, in order

Leads are seeds to argue with, not rules.

1. **Fantasy in one line.** Leads: **F1** the patient killer ("I mark them and they're
   already dead"); **F2** the student of three schools who masters one (the name's arc);
   **F3** the chain reaction ("one spark and the whole pack goes up").
2. **No abilities outside the class system:** confirm.
3. **The T1 shape.** **T1-A** dabbles in all three elements and commits at T2; **T1-B** one
   element from the start, set by the weapon; **T1-C** neutral stacks at T1, the discipline
   gives them an element.
4. **The stack.** What one stack is (the trap fix: stack damage from the weapon's potency
   and tier, so fast weapons apply and spread more, slow ones pack more into each); what
   replaces the curve; how stacks show on the enemy; whether the Apprentice carries a
   resource of its own (today none).
5. **Payoff rules.** What they read (the target at N stacks, frozen, low, casting,
   shielded, the pack around it), which payoffs exist (spread, detonate, freeze, shatter…),
   the defaults, and how the screen differs from Thresholds and Responses.
6. **The budget.** **B1** the stack cap ("Stacks 6, next at Mastery 24": every enemy's bar
   grows, and every payoff with it); **B2** how many payoffs you carry, like the Striker's
   slots; **B3** a pool of payoff charges. Lead: B1.
7. **Poison's trigger** (collision 1).
8. **Frost on bosses that accept no control** (collision 4).
9. **The T1 form:** the first ten minutes, then biome by biome: lesson, weapon, armor,
   charm, trophy. Seeds below.
10. **Disciplines:** Poison, Fire, Frost; fantasies first, then rules and content.
11. **Specializations (9).**
12. **Leaves (T4).** The Conduit's question was "do your summons survive?", the Striker's
    "what kills you?". Lead for the Apprentice: **"what buys you the time?"** (distance,
    slows, sustain while the stacks work).
13. **Trophies:** does the relic change the payoff, the stacks, or both kinds (as the
    Squire's slam and Resolve relics, the Striker's spark and weight)?
14. **Items.** Lead: the weapon asks "how do your stacks build?" (cap, tick speed, stacks
    per hit, potency); the armor and charm questions.
15. **Defense and recovery:** the Second Wind crutch, range as defense, the root's delayed
    hits, sustain from ticks (time-paced, so attack speed can't farm it).
16. **Stance-like modes.** Lead: none.
17. **Party role:** the debuffer; two Apprentices on one target; Frost's slows for allies.
18. **Bot plan:** default rules per discipline; what the harness must set.
19. **T2–T4 biome by biome**, as the other dives did.

### Seeds for question 9: the T1 biomes (*Proposed*, agent)

| Biome | Threat | A lesson it could teach | Note |
|---|---|---|---|
| Plains | swarms | **Spread:** a target at full stacks passes one stack to its nearest neighbour each second | Poison's seed; time, not kills |
| Forest | fast packs; the Greatbear's race | **Chill:** each stack slows the target's attacks and movement a little | Frost's first step; blunts an attack-speed ramp |
| Swamp | attrition | **Siphon:** your ticks heal you a little, capped per second | Second Wind's replacement candidate; paced by time |
| Mountain | the hardest hits, telegraphed | **Freeze:** when the target winds up a big blow, spend its frost to freeze it and break the blow | The interrupt seam; the densest regular-mob telegraphs |
| Cave | elites, casters | **Detonate:** cash in every stack on the target at once | Fire's seed; Detonate's successor |

With T1-A these are pieces of three schools before the choice; with T1-B or T1-C they are
element-neutral lessons. Shatter (detonating a frozen target) would wait for Frost at T2.

## Useful during the session

- A clickable mockup of the Payoff screen once questions 4–6 have answers, if wanted.
- Check every payoff number against the two warnings (copies multiply; detonate multiplies).
- Re-search names in the bible and `docs/briefs/*-deep-dive-*` before proposing one.
