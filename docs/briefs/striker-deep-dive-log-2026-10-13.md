# Striker deep dive: decision log (2026-10-13/14)

> The working record of the second class deep dive of the class-first rework, moved out of
> §12 of the [class-first bible](../../design_docs/class-first-bible.md) when §12 was
> rewritten to the class template (2026-10-14). The bible's §12 is the design; this file
> is how it got there: every call in order (twenty-two reviews), the reasoning, and the
> ideas that were dropped (Momentum for every Striker, the Duelist as a discipline, the
> afterimage echo, Flow, Whetstone, the Pivot, Rally as a class baseline, Brace and other
> abilities outside techniques, Flashpoint, Earthshaker, combo-recovery leaves,
> dual-purpose relics). "§N" means the bible's section N. Read top to bottom: later
> reviews override earlier entries.

Prep: [striker-deep-dive-prep-2026-10-13.md](striker-deep-dive-prep-2026-10-13.md).
The designer stopped using the question pop-ups mid-dive (their formatting didn't read
well); later questions were asked inline.

**Carried in (decided before the dive):**

- **Core mechanic:** hits build **Momentum**, which decays when you stop attacking; the
  **finisher** spends it and grants a small shield or heal. *Tentative (brief).*
- **The class system is the Order:** you choose what each beat of the combo does (buff,
  debuff, setup, crowd control, finisher). Striker authors a short sequence beat by beat;
  the Slinger loads whole clip types, so the two never feel like the same editor.
  *Tentative (concept) / Decided (beat by beat, §3).*
- **Disciplines:** Flurry (frequent finishers, on-hit, packs), Crescendo (uncapped stacks,
  release timing, bosses; purely offensive tempo, never the Spirit's Reservoir), a third
  open (a mobile duelist that marks a target?). *Tentative / Decided (Crescendo offense
  only).*
- **Countering is the Squire's;** Brawler leaves Striker. Melee survivability lives in the
  class kit. *Decided.*
- **The relic is the boss trophy:** a boss's Striker trophy modifies the empowered attack or
  finisher, so a new boss gives a finisher that does something different or stronger,
  swappable (§4). *Decided (direction).*
- From the Conduit dive, for every class: automation is free and each class has its own
  budget (§3); Global Mastery grows it in steps (§2); T2 discipline, T3 specialization, T4+
  leaves (§2); prefer triggers that work in every fight (§1); signature payoffs stay with
  their class (§3), so the brief's "Shatter" finisher form is the Apprentice's.

### Review log

*(The designer's calls, in order, as the dive makes them.)*

**First review (2026-10-13):**

- **Fantasy: the combo fighter.** "I write my combo and watch every hit land, building to a
  big finisher." The Order is the centre; Momentum is the fuel. *Decided.*
- **Momentum measures this combo**, not the whole fight: hits build it, the finisher spends
  all of it, idle drains it. The finisher's size and its shield or heal follow the
  Momentum spent. *Decided.* Chosen with the agent's addition: **every beat is a trade**,
  since a plain beat builds more Momentum than an effect beat (a bleed, a slow, a stun), so
  utility costs finisher size. *Tentative (numbers open).* Flurry spends small and often;
  Crescendo banks uncapped and picks the release. *Tentative.*
- **A beat is a swing.** The combo is your next few swings (4–5 at T1, *Proposed*) and you
  set what each one does: a plain swing, an effect, the finisher. It loops. Each beat has
  its own swing animation, so the player watches the combo play out. *Decided.*

**Second review (2026-10-13):**

- **Order matters because setups feed the next beat:** a setup changes the beat after it (a
  Feint makes the next swing crit; a Sweep knocks down and the next swing hits the downed
  enemy harder), so the best setup goes right before the finisher. *Decided.*
- **Techniques are the building blocks of the Order. Finishers are the relic:** the boss
  trophy *is* the finisher, swapped in the relic slot. *Decided.*
- **The Recovery pulse is dropped.** *Decided.*
- **The finisher's shield or heal needs care** (designer): sustain tied to attack speed
  makes attack speed king unless a cooldown limits it; a non-stacking shield refreshed by
  the finisher still gains from attack speed and, if it can always be kept up, makes any
  enemy too weak to break it irrelevant. *Decided (constraint: Striker sustain must not
  scale with attack speed or erase weak hitters) / Open (mechanism).*
- **The budget is open:** discuss alternatives now that techniques are the building
  blocks. *Open.*
- **A built-in plain finisher until the first boss kill**, since relics arrive with the
  first T1 boss (§4). *Proposed.*

**Third review (2026-10-13), the designer steps back:**

- **The alternatives are not either/or.** The agent's options so far (Momentum per combo
  or across the fight, every swing or techniques at marks, setups or the finisher reading
  the target, shield or heal, budget shapes) mark out enough design space that most of
  them become different disciplines and specializations rather than rejected answers.
  *Decided (method).* The first two reviews' picks stand as the class's baseline.
- **Cast-time techniques, the designer's idea.** The Striker never wants to stop attacking
  (faster attacks, more damage), so a technique with a cast time must earn its pause. It
  sits **at the first beat or the last beat before the finisher**: an opening cast
  prepares you and juices up the whole combo, or a closing wind-up prepares the finisher to
  deal a lot more damage. *Tentative (concept).* Salvage: player casts already run the
  monster charged-attack machine (arm → wind-up → resolve, a stun aborts it; Slam 600 ms;
  `technique.cast-speed-pct` shortens a wind-up by at most 60%; `docs/abilities-current-state.md`).

**Fourth review (2026-10-13): the disciplines, and the dive's agenda.**

- **Agenda (designer):** first the base design and what the three T2 disciplines do; then
  the specializations, defense and recovery, how the class evolves, and the items.
  *Decided.*
- **The T2 disciplines are the old frames' successors: light, balanced, heavy, split by
  where the damage lives.** *Decided (direction).*
  - **Light:** the combo does most of the damage; the finisher empowers the next cycle
    (or otherwise makes the swings stronger).
  - **Heavy:** the finisher deals most of the damage; the strikes before it set it up to
    deal as much as possible.
  - **Balanced:** combo and finisher share the damage, roughly 50/50.
- **Invert today's cycle lengths:** Light has the **longer** combo, doing more damage by
  itself with the finisher buffing the rest; Heavy has the **shorter** one, built around the
  payoff, its opening beats buffing the final strike. (Today Breaker runs 6 hits, Flurry 4.)
  *Decided.*
- **Casts:** the designer wants cast-time techniques to have a setup role, and sees them as
  the **announced** abilities, the ones with a call-out. The designer liked today's callout
  system (`client/src/render/skillCallouts.ts`, the "SKILL!" text over a player when an
  ability fires or arms) and asks what happens to it. *Open.*

**Fifth review (2026-10-13):**

- **Balanced is the duel: a loop that climbs.** The combo sets up the finisher (Heavy's job)
  and the finisher lights the next combo (Light's job), each at about half strength.
  Because the loop closes, each cycle on the same target is a step stronger, up to a cap
  shown on the target; a new target or a stun starts it over. Niche: long single-target
  fights. It is the brief's duelist. *Decided (concept).* Agent's note: the cap keeps it
  clear of Crescendo's uncapped bank.
- **Casts: every Striker, both positions.** Any discipline may slot an opener (first beat)
  and a wind-up (the beat before the finisher), at most one of each per combo; each
  discipline leans to one: Light the opener (one pause spread over a long combo), Heavy
  the wind-up (its payoff). A cast is a setup paid in time instead of Momentum: the one
  power source attack speed can't scale. *Decided.*
- **Agent's details for the three** (*Proposed*, numbers illustrative): combo at T2 Light
  6–7 beats, Balanced 5, Heavy 3–4; damage combo/finisher ~75/25, ~50/50, ~25/75; Light's
  finisher buff lasts the next combo's **beats**, not seconds (today's Flurry window lets
  attack speed pay twice); the relic finisher lands once in Heavy and rides the next combo
  in Light, so each relic's twist must read both ways (authoring cost for 11 lineages);
  Light is best at packs and weak to plating and shells, Heavy the reverse; attack speed is
  everything for Light and worth less for Heavy (the wind-up is fixed time), which gives
  each discipline's weapons a stat identity; a free "don't spend the finisher on a nearly
  dead target" rule is where Heavy's automation produces power; Crescendo (uncapped bank,
  release on a rule) reads as a Heavy specialization.
- **Callouts only for announced moments** (*Proposed*): a cast (callout when it arms, a
  cast bar during the wind-up, as monsters show theirs) and the relic finisher, named for
  its boss. Plain beats and ordinary techniques fire about once a second and never call
  out, or the big moments drown.

**Sixth review (2026-10-13):**

- **Zones teach techniques; picks transform them; bosses give finishers.** Each biome's
  level teaches a technique that answers its threat, before its boss (the Striker's
  counterpart of the Conduit's specialists); the T2, T3 and leaf picks add discipline
  techniques or change existing ones. *Decided.*
- **The budget, still open.** The designer leans to **technique slots** but isn't sure,
  and wants the budget to raise **how much you get for your buck** from your techniques.
  **Combo length is not necessarily a positive** (a longer combo delays the finisher), so
  it isn't the budget. *Open (discussion) / Decided (not combo length).*

**Seventh review (2026-10-13): the budget is "open, then master".**

- **Global Mastery grows the combo one beat at a time.** Each step **opens a slot** (a plain
  beat can now carry a technique, paying the Momentum trade) or, once every beat is open,
  **masters a slot** (the technique there no longer pays the trade: full effect and full
  Momentum, "more bang for your buck"). Order automatic: open first, then master.
  *Decided.* The combo strip reads grey (plain) → coloured (technique) → gold (mastered):
  plain punches, special moves, signature moves. Heavy's short combo runs out of beats
  sooner and masters sooner; Light keeps opening longer; the same number of steps gives
  each discipline the same total growth in a different shape. Combo length belongs to the
  discipline, not the budget. *Decided.*
- **T1 numbers** (*Proposed*, illustrative, mirroring Command's steps): one slot at the
  start, two at Mastery 15, three at Mastery 30. Five T1 zones teach five techniques, so a
  T1 Striker owns five and fields three: the T1 choice.

**Eighth review (2026-10-13): the disciplines' rules.**

- **Light's finisher lights the next combo with both heat and the twist:** the next
  combo's swings hit harder (sized by the Momentum spent) and carry the relic finisher's
  twist at reduced strength (a knockdown finisher: the next combo's swings stagger). Light
  is the discipline where a boss trophy changes the whole combo. *Decided.* Authoring
  cost accepted with it: every relic's twist must work on a swing too.
- **Heavy: soft swings, more Momentum.** Heavy's swings hit softer but each builds extra
  Momentum, so the damage moves into the finisher; setup techniques multiply it. The bank
  stays on the Striker's bar, never stored on the target (stack-then-detonate is the
  Apprentice's). *Decided.*
- **The T1 baseline and the T2 table** (*Proposed*, numbers illustrative): every Striker
  before T2 runs a 5-beat combo (4 swings + the finisher), the finisher about a third of
  the damage. T2: Light 7 beats (6 + finisher), Balanced 5, Heavy 4 (3 + finisher). T2
  power steps: Light, the lit combo; the duel, the climb (3 steps at T2, shown on the
  target); Heavy, the finisher becomes the class's biggest hit.

**Ninth review (2026-10-13): the designer is still exploring the class's picture.**

- **No mockup for now:** the designer visualizes the class more easily without one.
  *Decided.*
- **The T1 technique draft has the right shape** (each zone's threat teaches a technique).
  *Decided (shape).* Sweep's **area knockdown** seems very strong and may not belong at T1.
  *Open.* **Hamstring** seems strong but right for a melee class. *Tentative.*
- **Focus, the opener, buffs the combo's attack speed**, and it must be efficient: it has
  to pay for its pause. *Decided.*
- **Casts stylize the combo and keep its pacing in check.** They make it flashier and
  weightier; the Striker leans to attack speed, and turbo swing-spam would be too much, so
  the stronger abilities carry a cast time. *Decided (principle).* The opener speeds up or
  strengthens the combo; the wind-up prepares the finisher. *Decided.*
- **The relic is how the player specializes the finisher:** a relic that makes the
  finisher weightier, or one whose finisher empowers the next combo, and so on.
  *Decided (direction).* How this sits with the disciplines' finisher jobs (eighth review):
  *Open.*
- **On-hit is a key Striker niche, and Light's avenue:** very fast attacks that proc on-hit
  effects very often. *Decided (direction).*

**Tenth review (2026-10-13): the designer reviews the agent's whole-design overview.**

- **No abilities outside techniques.** No Brace, no Second Wind; they were never very
  healthy. Brace's one good part, a reactive window, probably belongs to the Squire.
  *Decided.*
- **Defense and recovery live in the equipment (armor and charm), never on finisher or
  combo triggers.** A shield or heal on the empowered attack would scale with attack speed
  and push every build into stacking attack speed for both offense and defense. *Decided.*
  Agent agrees: the class lines on armor and charm are the class kit the brief puts melee
  survivability in.
- **Rally** (the agent's: damage taken leaves a band the finisher wins back): not bad and
  doesn't super-scale with attack speed, but Bloodborne's risk/reward is missing in an idle
  game, where you always hit when you can. Its weakness is interesting: a kited Striker
  can't win anything back, which makes mobility worth building. *Open (explore).* Agent:
  if kept, it becomes an equipment line (§ defense above), not a class baseline.
- **Is Momentum Heavy's alone?** The designer's idea: making Momentum Heavy's (maybe
  partly Balanced's) would set Heavy apart. *Open (exploring).*
- **Light's lit combo shows as a shine on the weapon.** *Decided.*
- **Some techniques are main damage dealers** (Triple Cut and the like), not only utility.
  *Decided (direction).*
- **A Charge technique for the opener** catches up to enemies that kite and gives the
  class mobility. *Decided (direction).* Salvage: today's player charge (a 400 ms wind-up,
  then a real rush; `docs/abilities-current-state.md`).
- **Control techniques**, and maybe a Heavy playstyle built on big damage bonuses against
  controlled enemies. *Tentative (option).* Note: the T3 Tundra and Volcanic bosses accept
  no control, a fair counter.
- **The disciplines mostly make sense.** The Duelist is interesting and strong against
  bosses but probably weak at farming outside elites; explore other Balanced concepts.
  *Open.*
- **On-hit and damage over time are two different things.** The agent's "on-hit bleed"
  (the Swamp weapon in the overview) mixed them up; withdrawn. *Decided.*
- **The specializations need their own review, later.** *Open.*
- **Next: the T1 bosses' trophies**, the empowered finishers they give; the rest follows
  from them. *Decided (agenda).*

**Eleventh review (2026-10-13): the T1 trophies.**

- **The five T1 trophies are liked and stay close to the agent's draft** (each the boss's
  signature turned into a finisher, ranked up by the same lineage's T2 boss):
  *Decided (concepts R1–R4) / Open (R5).*
  - R1 Plains, Tusked Razorback: the next combo's swings each also strike one enemy beside
    the target (spark). Rank II: two extra enemies.
  - R2 Forest, Gnarled Greatbear: every swing of the next combo strikes twice, each a bit
    over half damage; twice the on-hit (spark).
  - R3 Swamp, Grave Toadeater: the finisher's wound rots, dealing part of its damage again
    over a few seconds; damage over time, not on-hit (weight).
  - R4 Mountain, Crag Behemoth: the finisher becomes a cast, a longer wind-up and a blow
    about twice as big (weight).
  - R5 Cave, Obsidian Broodmother: the agent's Undermine (the next combo ignores the
    target's plating) is not convincing; **rather a debuff**. *Open.*
- **Names: cooler, technique-style** ("Double Slash", a "killer move"), not names tied to
  the boss lineage. The designer may rename. *Decided (direction).*
- **No abilities outside the class system** (now in §3): any such effect is passive, never
  an ability with a callout. *Decided (Striker) / Proposed (every class).*
- **Brainstorm Balanced** before choosing. *Open.*

**Twelfth review (2026-10-13):**

- **Momentum is Heavy's alone, for now.** Light's resource is the shine; a T1 Striker has
  neither (a plain strip and a plain finisher). What Balanced uses is reviewed with
  Balanced. *Decided (for now).* Following from it: a technique's price becomes **swing
  damage** (a technique beat deals less than a plain swing), and mastering removes the
  price. *Tentative.*
- **Relic kinds, weight vs spark, are fine for now;** later biomes will bring more ideas.
  The Plains trophy stays spark. *Decided (for now).*
- **The Cave trophy is Expose:** the finisher leaves the target taking more damage from
  everyone for a few seconds; rank II (Dreadbore) also cracks its plating. *Decided.* Note:
  the proposed Heavy specialization Sunder (S9) now needs a different idea.
- **Balanced, still open.** The designer's own first idea (the swings buff, a mix of the
  shine and Momentum) is "all right but boring": both mechanics mixed, nothing unique. The
  agent's Encore (the finisher replays the combo's techniques) is liked and gives the class
  a different lean, but the designer pictures it more like the afterimages, and worries the
  finisher stops mattering. The Duelist is not disliked. The brainstorm's ideas are kept as
  material (specializations, future techniques). Wanted: an interesting 50/50 between
  regular and empowered attacks, thinking ahead to the techniques added later. *Open.*

**Thirteenth review (2026-10-13): Balanced is the Afterimage.**

- **Balanced, for now: the finisher leaves an afterimage.** Through the next combo it
  repeats every technique you use, beat for beat, at half strength (not plain swings, not
  self-buffs such as Focus), then performs your finisher with you at half strength and
  fades as your finisher makes the next one. Half the damage is you; half is the
  finisher's power, delivered as the finisher and then through the afterimage. The
  discipline of the repertoire: every technique a biome teaches is also a new move for the
  afterimage. Its resource is the afterimage, not Momentum. *Decided (for now).* It will
  probably deal a lot of damage and may be very strong; its strength (half) is the main
  lever; judge in the game. *Playtest.*
- **No drawn copy of the player:** the afterimage replays the attack animations as an
  echo, nothing more. *Decided.* (It can't be hit, has no HP and never moves on its own:
  not a summon.)
- **The agent's Balanced specializations** (Duel, Split, Twin Shadows): the designer is
  not sure. *Open.*
- **What do specializations change?** Techniques own what the swings do and relics own
  what the finisher does, so a specialization needs its own ground. The designer's lead:
  each discipline's resource: the shine for Light, the afterimage for Balanced, Momentum
  for Heavy. *Tentative.*

**Fourteenth review (2026-10-14): the specializations, first pass.**

- **Ownership:** techniques own what each beat does; the relic owns what the finisher does;
  the discipline owns the resource linking them (shine, afterimage, Momentum); a
  specialization changes how that resource behaves and may change the finisher's delivery
  (where, when, how often), never its content; leaves are small turns on all of it.
  *Decided (for now).*
- **Specializations should be content-neutral.** No specialization built around one kind of
  content (a whole specialization for area damage); you pick weapon, techniques and relic
  for what you're going to do. *Decided.*
- **Light:** Thousand Cuts (lit swings fire their on-hit twice) *Decided*; Flashpoint
  (each lit swing marks the enemy it hits, the next finisher strikes every marked enemy)
  *Decided*; Afterglow (the shine also lights the finisher and carries on one combo more)
  *Tentative ("probably keep": it shifts the damage share a little, but is playable).*
- **Balanced:** Split disliked; Encore unconvincing; Duel okay but not very interesting.
  *Open.* And the afterimage itself is in doubt again: cool and flashy, but a very strong,
  polarizing identity for such an early pick. *Open.*
- **Heavy:** Subjugator liked *Decided*; Crescendo okay *Tentative*; Earthshaker out (a
  whole specialization for area damage) *Decided*.
- **Old concepts raised by the designer:** Berserker (empowered attacks come more and more
  often; but what happens to the techniques, do they get pushed out?) and Juggernaut
  (scaling with fight duration, which leans toward the Duelist). *Open.*
- **Question raised:** do relics have specific effects for the shine? *Open.*

**Fifteenth review (2026-10-14):**

- **Not Flow** (the agent's Balanced: completed combos raise a streak that strengthens
  swings and finisher alike): too vanilla, "the attack grows as the combo goes and the
  finisher cashes out"; its specializations would have to be very attractive to carry it.
  *Decided (not chosen).*
- **Heavy's third specialization is Frenzy:** the old Berserker as a double finisher. As
  the fight goes on a second, lighter finisher joins the combo; the techniques stay where
  you put them. *Decided.* Heavy: Subjugator, Crescendo, Frenzy.
- **Flashpoint:** the concept is liked, but it is close to a Slinger specialization the
  designer has planned, **Deathmark**. Here or there? *Open.*
- **Relics stay simple: one twist each, no per-discipline versions.** The designer floated
  a dual or triple purpose (a relic doing something different with Light's shine and
  Heavy's Momentum) and withdrew it the same message: some relics simply suit some builds
  better, and that's fine; don't overthink it. The weight/spark kinds stand. *Decided.*
- **Light and Heavy are in the right place overall;** polish left. *Decided.*
- **Balanced, still not settled;** the designer may sleep on it. The designer's new idea:
  Balanced focuses on **techniques that deal pure damage**, and since the finisher is a
  technique too it is boosted the same way: the afterimage's payoff without the fanfare.
  *Open.* The designer's three technique families: techniques that set up your attacks
  (faster, harder: temporary buffs and debuffs), techniques that set up your empowered
  attack, and techniques that deal pure damage. *Tentative (vocabulary).*

**Sixteenth review (2026-10-14):**

- **No echo for Balanced** (damage techniques landing twice): too flashy, hard to convey.
  Balanced's damage techniques and its finisher (a technique too) are simply **buffed in
  some way**: a percentage, a progressive buff, or a state. *Decided (not the echo) / Open
  (shape).*
- **Each discipline's state has its own look:** Light's lit attacks a **blue sheen**;
  Heavy's Momentum-buffed finishers a **red crackle**; Balanced's to find. *Decided (Light,
  Heavy).*
- **A new Light specialization replaces Flashpoint:** you slash many times, then the
  finisher becomes a **multi-cut that replays all those slashes** (the afterimage idea, now
  Light's). The designer likes it a lot; it needs tight balancing. *Decided (concept) /
  Playtest (balance).* Flashpoint is dropped; **Deathmark stays the Slinger's**. *Decided.*
  Slinger note: its Cannoneer will probably be replaced.
- **Wanted next:** Balanced's specializations under the new idea. *Open.*

**Seventeenth review (2026-10-14): Balanced is Rising Edge.**

- **Balanced's buff is Rising Edge:** damage techniques ramp through the combo and the
  finisher lands at the peak; it resets every combo. You open with setups, and the closer
  you get to the finisher the harder you hit. *Decided.* Not Whetstone (plain swings hone,
  techniques spend): by the end of the game every beat is a technique and no plain swings
  are left to hone with. *Decided (reason).*
- **One Balanced specialization should give cast techniques more juice** (close to the
  agent's Iaido). *Tentative.* Virtuoso and Perfect Form: unconvinced. *Open.* The
  specializations get their own review after Balanced is locked.
- **Light's Afterimage specialization has the right shape:** swings hold back part of their
  damage; the finisher arrives as a multi-cut replaying every swing with its held-back
  share, then the relic's twist; the replayed slashes don't fire on-hit (Thousand Cuts is
  the proc build, Afterimage the burst build). *Decided.*
- **Afterglow:** probably keep. *Tentative.*
- **Next: lock Balanced, exactly what it does.** *Decided (agenda).*

**Eighteenth review (2026-10-14): Balanced locked (for now).**

- **Balanced, Rising Edge, by position:** the edge rises one step with every beat of the
  combo, whatever the beat is; **damage techniques** (Sweep, Rend, Triple Cut and every
  later technique whose job is damage, casts included) and **the finisher** cut with the
  current step, so damage placed late hits harder and setups placed early cost nothing.
  Setups and tempo techniques (Coil, Focus, Hamstring) don't hit harder with it. Resets at
  every finisher and when you stop attacking long enough to drain. 5 beats; about 50/50
  between regular attacks and empowered ones; a **gold edge** on the blade, brightening
  through the combo and flashing on damage techniques and the finisher; the HUD strip
  fills gold toward the finisher. Resource: the edge only (no Momentum, no shine). Weight
  relics suit it best (the finisher lands at the peak). Content-neutral: area damage
  techniques for packs, single-target ones for bosses. *Decided (for now).* Numbers:
  about +15% per step, the finisher at about +60% (*Proposed, illustrative*).
- **"Swings" in any discipline rule means every beat, techniques included,** since by late
  game every beat is a technique: Light's lit swings are every beat of the lit combo;
  Heavy's soft swings are every beat before the finisher. *Proposed (clarification).*
- **Next: Balanced's specializations, then all nine together.** *Decided (agenda).*

**Nineteenth review (2026-10-14): the nine, second pass.**

- **Balanced:** Iaido (every cast sharpens the edge two extra steps; cast damage
  techniques cut with double the edge) kept, needs a better name *Decided (concept)*;
  **Tempered** (the edge falls to half its peak at the finisher instead of resetting; a
  stun or a drain still resets it) liked *Decided*; Cascade (each damage technique raises
  the edge an extra step) unsure *Open*. Virtuoso and Perfect Form dropped (Virtuoso a
  possible leaf). *Decided.*
- **Heavy:** Crescendo unsure. *Open.*
- **Light:** Afterglow unsure. *Open.*
- **The designer's read:** the ideas are in a decent place now; to double-check how it all
  works together. *Decided (state).*
- Board after this pass: Light Thousand Cuts, Afterimage, (Afterglow?); Balanced Iaido,
  Tempered, (Cascade?); Heavy Subjugator, Frenzy, (Crescendo?).

**Twentieth review (2026-10-14): what we have is locked in; the rest of the agenda.**

- **The design so far is locked in:** the core, the three disciplines and the nine
  specializations as they stand. *Decided.* Agent's reading: Afterglow, Cascade and
  Crescendo stay as drafted until something better turns up.
- **Left to design:** the items (weapons, armor and charm lines; relics beyond T1), the T4
  leaves, and the techniques and boss trophies beyond T1. *Decided (agenda).*

**Twenty-first review (2026-10-14): T1 items accepted; T4 leaves redirected.**

- **T1 items accepted as drafted** ("everything else seemed fine"). *Decided (direction;
  names and numbers open).*
  - **Weapons** (a weapon sets tempo and weight plus one job; jobs follow you up the
    tiers): Plains **Broadblade** (every beat also nicks the nearest other enemy for a
    share); Forest **Twin Fangs** (fast, light hits, each carrying a small extra strike);
    Swamp **Hooked Sickle** (your damage over time lasts longer; the finisher hits a
    bleeding or rotting target harder); Mountain **Maul** (slow heavy beats, a much bigger
    finisher, casts wind up faster); Cave **Bastard Sword** (damage techniques and the
    finisher hit harder; setups wear off sooner).
  - **Armor** (a shared base plus a Striker line; the lines protect the unbroken combo and
    never trigger on your hits): Plains plating + **Shoulder Through** (each extra enemy
    around you adds a little plating); Forest evasion + **Unbroken** (stuns, knockdowns
    and slows are shorter and never break your shine, edge or Momentum); Swamp DoT
    resistance + **Bloodless** (while you keep attacking, damage over time can't take you
    below a quarter of your HP); Mountain damage cap + **Braced Cast** (nothing interrupts
    your casts; the cap is lower while casting); Cave bulk + **Weighty** (more bulk, slower
    beats).
  - **Charms ask "when do you recover?"**: Plains **Grit** (part of every hit you take heals
    back over a few seconds while you keep attacking; stop and it's lost: Rally reshaped,
    no finisher trigger); Forest **Rhythm** (Recovery rises the longer you fight without a
    break, to double after ~10 s); Swamp **Antidote** (every few seconds the poison or bleed
    on you with the most time left ends); Mountain **Cairnstone** (after a hit over a
    quarter of your HP, Recovery triples for a few seconds); Cave **Deep Breath** (much
    faster out-of-combat Recovery).
  - Boots stay generic.
- **A break costs each discipline its resource** (a stun, a few seconds with no target, the
  walk): the shine goes out, the edge resets, Momentum drains. *Decided.*
- **T4 leaves: not combo recovery.** The agent's "what happens when your combo is broken?"
  nine (hold / resume / carry) are rejected. *Decided.* The designer's own alternative,
  long-fight resilience vs farming efficiency, is doubtful: it sounds like the content
  split the designer didn't want. *Open.*
- **Melee classes should get some resilience at T4.** *Decided (direction).* This amends
  the tenth review: equipment stays the main defense budget, and T4 leaves may add some,
  under the same rules (nothing on your hits or finisher, nothing scaling with attack
  speed). *Decided (amendment).*

**Twenty-second review (2026-10-14): T4 leaves; the dive converges.**

- **T4 leaves ask "what kills you?"**: the spike, the swarm or the slow bleed, one answer
  each per discipline, in its style (Light dodges, Balanced keeps its composure, Heavy
  endures). Kept as drafted. *Decided.*
  - Light: **Ghoststep** (once every few seconds, a hit bigger than a quarter of your HP
    misses), **Slip Through** (the more enemies around you, the more of their hits miss,
    up to 1 in 3), **Shake It Off** (debuffs on you wear off twice as fast).
  - Balanced: **Read the Blow** (telegraphed attacks aimed at you deal half damage;
    mitigation, not a counter), **Centered** (while three or more enemies attack you, you
    take a fifth less damage), **Poise** (below half HP, your Recovery doubles).
  - Heavy: **Unbreakable** (once per fight, a killing hit leaves you at 1 HP and nothing
    hurts you for 2 s; cheat-death returns as a pick), **Immovable** (ordinary mobs can't
    knock you back, slow or stun you), **Thick Blood** (damage over time on you is halved).
- **The item designs extend to the other biomes, and that wraps up the Striker dive.**
  *Decided.* The agent extends the T1 shapes to T2–T4 (techniques, trophies, gear jobs) in
  the rewritten §12 as *Proposed*, for the walk-through before the lock.


**Twenty-third review (2026-10-14), after the rewrite:**

- **§12 as rewritten (including the T2–T4 tables) is fine for now.** *Decided.* Keep
  enough different options at every tier. *Decided (direction).*
- **Do returning biomes teach new techniques?** The designer finds it interesting but sees
  that 26 is a lot; returning visits could bring small sidegrades, straight upgrades,
  vanilla or utility pieces instead. The Conduit got new summons each tier because the
  roster is its whole fantasy. *Open (agent's opinion asked).*

**Twenty-fourth review (2026-10-14):**

- **Returning biomes teach a lesson every tier, not always a new technique:** a new
  technique where a family needs one, a sidegrade (the same idea in a new shape) where the
  threat changes shape, or a rank-up (stronger, one visible twist per rank). Every
  technique scales with the Striker's tier, so old favourites stay fieldable. The agent's
  reasoning, accepted: the Striker fields a handful of beats, not a roster, so 26 uniques
  would mostly arrive with nowhere to go or as bigger numbers replacing old ones (the
  brief's "linear power path"); the variety it needs is choice inside each family.
  *Decided.* Applied to §12.8 and §12.16: Gut replaced by Rend II, Glacial Lock by
  Icebreaker II; Whirlwind, Upheaval, Hemorrhage, Avalanche and Bloodrush tagged as
  sidegrades; 19 new and 5 sidegrades through T4.
- **The designer is happy with the design overall;** next, the questions left before the
  lock. *Decided (state).*

**Twenty-fifth review (2026-10-14), the lock:**

- **The technique price stays:** a technique beat deals less swing damage than a plain
  swing; mastering removes it. *Decided.*
- **No starter trophy:** a plain finisher until the first boss kill; the base kit must win
  the first boss. *Decided.*
- **Grave Toll turns spark** (the next combo's beats hit harder for every enemy in the
  fight), giving Light an area-fight trophy; four spark trophies of eleven. The designer
  agrees but wants to think about it and see it in playtests. *Tentative.*
- **Frostbind replaces Icebreaker II** at the Tundra's T4: a control sidegrade of Pin
  (ice roots everything around the target for a moment), so Subjugator has more to feed
  on. *Decided.*
- **The same debuff from two Strikers doesn't stack;** the strongest copy applies.
  *Decided.*
- Accepted at the lock: callouts only for casts and the relic finisher, "swings" meaning
  every beat, Heavy's finisher-saving rule, the party role, the bot plan and the salvage.
- **§12 locked** and committed to develop (not pushed), as the Conduit's was. No doc is
  archived: none is the Striker's alone. *Decided.*
