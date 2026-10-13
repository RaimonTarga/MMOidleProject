# Conduit deep dive: decision log (2026-10-13)

> The working record of the first class deep dive of the class-first rework, moved out of
> §7 of the [class-first bible](../../design_docs/class-first-bible.md) when §7 was
> rewritten to the class template (2026-10-13). The bible's §7 is the design; this file is
> how it got there: every call in order, the reasoning, and the ideas that were dropped.
> "§N" means the bible's section N. Read top to bottom: later reviews override earlier
> entries.


Prep: [conduit-deep-dive-prep-2026-10-13.md](conduit-deep-dive-prep-2026-10-13.md).
Written to the class template (§6) once the conversation converges; until then this holds
the designer's calls as they are made.

**The designer's calls (session 1, 2026-10-13):**

- **The Conduit is a Commander: a pure summoner with no direct attack.** *Decided.* It may
  cast a few abilities of its own, but most of its power sits in the summons. *Tentative.*
- **The Conduit's budget is how many summons it fields and how powerful they are** (the
  summon limit). *Decided.* At T1 it reads as plain slots, with costs per summon type
  appearing later. *Tentative.* **Command grows with Global Mastery in steps** (§2); tier
  picks add kinds of pieces, not Command. Illustrative steps from the §4 mockup: T1 starts
  at 4, +1 at Mastery 15 and 30; T2 starts at 6, +1 at 44, 58, 72. The weapon still adds or
  removes Command. *Decided (§2) / numbers illustrative.*
- A fresh Conduit starts with **four generic summons**: average at everything, good at
  nothing. *Decided.*
- **Through T1, clearing zones unlocks specialist summons** for the different roles; the
  player is offered options per role, and by the end of T1 the formation is specialized to
  what the player needs. *Decided.*
- **Three summon roles.** *Decided.*
  - **Tank:** soaks damage; protects the Conduit and the rest of the formation.
  - **Damage:** deals the damage. Ranges from glass cannon to tanky; both melee and ranged.
  - **Support:** buffs the summons (offense or defense), debuffs enemies, possibly heals
    the formation or the Conduit.
- **The class weapon enhances the formation:** it buffs one role over another (tanks or
  damage dealers), can raise the summon limit, and sets how much damage the summons deal.
  More damage costs utility. *Decided (direction).*
- **One class system should hold everything the shared systems used to:** the summons,
  the few Conduit abilities, stance-like **tactics** (a formation-wide mode switched per
  fight; designer's example: Aggressive = more damage dealt and taken) and rite-like
  **upkeep** (how fast summons rebuild in and out of combat, how the formation is
  maintained). Whether summons and abilities share one budget is open. *Decided (one
  system) / Open (how).*
- **Different summons carry different abilities.** *Decided (designer likes it).*
- **Specialists are bound from the zones you clear** (players suggested the same). They
  take a zone creature's look, but what they do is designed for the Conduit, never copied
  from how the creature behaves in the wild. *Decided.*
- **No extensive per-summon AI customization.** A tank is never configured to stop tanking,
  so per-summon behavior editing buys nothing. *Tentative (designer leaning).*
- **No tactics system.** The stance translation adds no meaningful idle decision; the
  roster already is the stance. *Decided.*
- **Specialists are obtained in the zone, before its boss.** The zone grows the character
  and hands it the tools; the boss tests them. *Decided.*
- **Bosses stay the tier gate and should also give boss-specific rewards.** *Decided
  (direction).* For the Conduit, the designer's idea: each boss gives a different
  signature **Heart** summon; only one can be fielded; it gives the whole formation a
  bonus, so the player enters T2 with a coherent strategy. *Tentative.*
- **Never a single-summon summoner.** The few-and-strong end of the disciplines must not
  collapse to one body. *Decided.*
- **Swarm direction:** many disposable, temporary summons with a duration, more of them at
  once, constantly re-summoned; later they explode on death. *Decided (direction).* The
  opposite end: fewer, stronger summons with more complex behavior and more abilities.
  *Tentative (designer: trickier).*
- **Rebuilding costs the Conduit HP** (the original design): summons are bodies that tank
  for you, and free rebuilds would be a free extra HP pool. *Tentative (designer
  leaning).* How rebuilding works (one by one, cost, out-of-combat speed, whether any of
  it is a pick) is *Open*.
- **Summon defensive stats** — resolved by §4: the weapon keeps role bonuses (Warden's
  Idol: tank HP and thorns); who takes the hits is the armor's Conduit line; recovery and
  rebuilding are the charm's Conduit line. *Tentative (follows §4's fixed class lines).*
- **Components go into gear, not summons** (§4). Summons deepen through tier picks,
  specialists and Hearts, never through sockets. *Decided.*
- **Specialists are their zone's class recipes**, unlocked by that zone's level (§2), so
  each one is bound while working through its zone, before its boss (the §4 mockup's T1
  pacing strip binds one per zone between minutes 6 and 27). What a bind costs follows the
  §4 recipe pattern. *Tentative (follows §2's zone-level jobs).*
- **Hearts: one per biome boss lineage.** To keep using a Heart in the next tier, upgrade it
  by beating the same lineage's next-tier boss. *Decided.*
- **A Heart is its own summon: the Conduit's core companion.** One fielded at a time, with
  its own boss identity; it is the pet, the main companion. Infusing it into another summon
  and a plain modifier were considered and dropped (an all-temporary Swarm would have no
  carrier; a modifier loses the "summon for killing a boss"). *Decided.* **Art: eleven new
  Heart sprites, one per lineage, not reused boss sprites.** *Decided.* It costs no Command
  and counts toward the 9-body cap. *Proposed.*
- **Rebuilding costs the Conduit HP proportional to the summon's HP** (the original rule).
  *Decided (2026-10-13).*
- **Faster out-of-combat rebuilding belongs on charms**, next to Recovery. *Decided.*
- **Two clashes to settle (found reconciling with §4, 2026-10-13):** *Open.*
  - **Body cap vs Command** — answered: **no design cap on summons**; a late-game army is
    a wanted fantasy. *Decided.* Today's 9 is a tuning number, not an engine limit:
    `hardEntityCap: 9` in `shared/src/data/summoner.ts` only clamps the formation count in
    `summonerProfile.ts`. Summons are ordinary networked entities (ten networked keys,
    like a monster's), and a node already keeps 20–36 monsters alive with AI. Raising it
    is a measured change (`pnpm bench:server` for tick cost; bandwidth, since every moving
    summon streams its position to everyone in the node; readability). *Proposed.*
  - **Out-of-combat rebuilding** — answered: it stays a charm line (the §4 mockup's
    version). *Decided.*
- **The middle discipline needs its own niche.** A "balanced" option between Swarm and
  Elite loses to the two with clear fantasies. *Decided (constraint).*
- **The three disciplines are Swarm, Pack and Elite.** Swarm: many weak, disposable
  summons. Elite: a few really strong ones. **Pack: variety**, a diverse cast (a tank,
  damage dealers, supports, some weaker, some stronger), with extra capacity that can only
  be spent on summon types the formation doesn't already have. *Decided.*
- **T1 sketch (designer, 2026-10-13).** Each biome's threat hands you its answer: a
  specialist, a weapon and an armor. *Decided (shape) / Tentative (pieces).*

  | Biome | Threat | Specialist | Weapon | Armor |
  |---|---|---|---|---|
  | Clearing | tutorial | four Thralls: melee, decent bulk, okay damage, nothing special | generic: more damage | generic: more defense |
  | Plains | swarms | tank built for swarms (plating, an area hit, or thorns) | more summons: the swarm weapon | plating for the summons, some for you |
  | Forest | fast packs | fast melee bruiser: quick, less HP | fewer summons, faster attacks: more damage, less bulk | open (the old one gave evasion) |
  | Swamp | DoT, attrition | ranged support: a DoT and/or a debuff that helps the formation (slows wait for kiting enemies) | DoT on summon hits: best single-target, back-loaded | open (the old one resisted DoT) |
  | Mountain | the hardest hits | ranged power-shot summon: big hits from the back, little HP | amplifies summon abilities (not slower-but-harder numbers) | open (the old one answered big hits) |
  | Cave | elites | a big summon that costs several Command | fewer, stronger summons | open (the old one was premium HP and DR) |

  Bosses are designed later.
- **Runtime facts (checked 2026-10-13):** monster DoTs only land on players, so summons never
  take them (`docs/dot-systems-current-state.md`, guard "Defender is a player"). Summon hits
  pay half of an enemy's plating. A share of hits aimed at the Conduit is redirected to a
  living summon (`damageSponge.ts`), and summons copy the Conduit's full plating and DR.
- **Tier structure and power stay roughly level with the other classes**, even though the
  Conduit's power sits in its summons. *Decided (direction).*

**Mockup v1 (2026-10-13):** https://claude.ai/artifact/QZ3CmU3pZgqnb2Sqc5AZCF (source in
the session scratchpad). Shows the Proposed Command model: summons cost Command and the
cost buys power; spare Command speeds rebuilding (no Conduit HP cost); abilities ride on
support summons; three free formation-wide orders; no tactics; weapons trade potency,
Command and a role bonus; five T1 specialists bound one per T1 boss; T2 disciplines Swarm /
Bond / Host; tier ladder T1 Bind, T2 Shape, T3 Upkeep, T4 Signature. All *Proposed*;
every number illustrative. The designer accepted it as the direction for now
(2026-10-13); tactics are now dropped and the rebuild rule is under review. Superseded
by §2/§4: its tier ladder's Command numbers (Command now grows with Global Mastery) and
"one specialist per T1 boss" (specialists bind in the zone, before its boss).

### Pass 1: the ladder, one line per piece (*Proposed*, 2026-10-13)

Written to see how the class grows past T1 before T1 is detailed. Nothing here has numbers
that matter; every line is for the designer to keep, change or cut.

**How the Conduit's power is built.** Command (Global Mastery steps, §2) × the roster
(specialists from zones, Hearts from bosses) × gear (the weapon picks the role and
potency, the armor who tanks, the charm upkeep; components in all three). Tier picks change
what kinds of pieces exist, never Command.

**Summons across tiers.** Every summon's stats scale with the Conduit's tier, the way a
component scales with the item it sits in, so a T1 favourite stays fieldable. New biomes
add new types. This replaces the "upgrade or replace?" question: neither, because biomes
retire (Plains and Forest end at T2) and their summons must not die with them.

**Specialists: one per biome, eleven in all.** *(Superseded by the fourth review: a
higher-tier biome binds a new variant, about 26 specialists through T4. The table keeps the
first summon of each biome.)*

| Biome (tiers) | Role | One line |
|---|---|---|
| Plains (T1–2) | Tank | Plating; a short sweep taunts the enemies around it |
| Forest (T1–2) | Damage, melee | Fast bruiser; little HP |
| Swamp (T1–3) | Support, ranged | Acid strips the target's plating |
| Mountain (T1–4) | Damage, ranged | Power shot from the back row; little HP |
| Cave (T1–3) | Heavy (2 Command) | Big, tough, hits hard |
| Jungle (T2–4) | Support | The first healer: heals the most hurt ally, the Conduit included |
| Desert (T2–4) | Damage, ranged | Marks a target and executes it below a threshold |
| Tundra (T3–4) | Support | Chills: enemies around it attack slower; slows matter once kiting enemies exist |
| Volcanic (T3–4) | Damage, melee | Burns everything around it: the first area damage, toward the T5 pack axis |
| Graveyard (T4) | Support | Raises fallen enemies as short-lived thralls |
| Trench (T4) | Tank | Hooks the enemy that is hitting the back row; tougher the lower its HP |

Roles through T4: 3 tanks, 4 damage, 4 support, plus the Thrall.

**Hearts: one per boss lineage, eleven in all.** Each gives the formation one bonus and
leans toward a discipline.

| Lineage (tiers) | Formation bonus | Leans |
|---|---|---|
| Plains (T1–2) | Every 10 s, all melee summons charge the focus target together | Pack |
| Forest (T1–2) | Summons slowly heal during a fight | Elite |
| Swamp (T1–3) | Every summon death leaves a bile pool that hurts enemies | Swarm |
| Mountain (T1–4) | A tank's taunt also shields it | Elite |
| Cave (T1–3) | Every 6 s a spiderling appears for 8 s | Swarm |
| Desert (T2–4) | Each different summon type that hits the marked target adds a stack | Pack |
| Jungle (T2–4) | The formation never loses a fleeing target and moves faster | Swarm |
| Tundra (T3–4) | Enemies near the Heart are chilled | Elite |
| Volcanic (T3–4) | The formation heats up over a fight: more damage every 10 s | Pack |
| Wasteland (T4) | Enemies the formation kills rise as temporary thralls | Swarm |
| Trench (T4) | The longer the fight, the tougher the summons | Elite |

A retired lineage's Heart (Plains and Forest after T2) keeps working and keeps scaling with
tier; it only stops ranking up.

**T1: Bind (class).** The designer's T1 sketch above: four Thralls, five specialists,
five weapons, five armors, five Hearts. Command 4 → 6. The Conduit's own piece: **Recall**
(a button and a free rule).

**T2: Discipline (1 of 3).** Each discipline reshapes the same roster rather than adding
its own summons, and unlocks one Conduit cast.

| | Swarm: how many | Pack: how varied | Elite: how strong |
|---|---|---|---|
| Rule | Every 1-cost summon comes as a **pair of temporaries**: half HP each, 12 s, re-summoned automatically for free. Bigger summons stay permanent. | **Variety Command:** +2 Command that only pays for a type the formation doesn't have yet. **Pack Strike:** every 8 s, each different type uses its ability at the same moment on the focus target. | **Promote:** any specialist can be fielded in its Elite form: +1 Command, double HP and damage, bigger, and a **second ability**. Never fewer than two bodies. |
| Best at | Packs | Elites, priority targets, mixed content | Bosses |
| Conduit cast | Call the Horde: six extra temporaries for 8 s | The Pack Strike, fired early by a rule (an elite appears) | Empower: one elite +50% for 6 s, aimed by a rule |
| Needs | Bodies past today's 9-cap | A wide roster (all five T1 types by T2) | An authored second ability per specialist (eleven) |

**Relic: superseded.** The relic slot is now the boss trophy slot, and for the Conduit
the trophy is the Heart (§4). The rule-bending examples drafted here (Ossuary: a death
grants Command for 10 s; Crown of Thralls: free Thralls that expire) are spare ideas for
leaves or rule-benders.

**Superseded (§2 change): no T3 flat pick.** Burst (was Sacrifice) / Reforge / Harvest are
leaf-sized and become T4 leaf candidates. **Formerly T3: how summons die and come back.**

| | Swarm | Pack | Elite |
|---|---|---|---|
| **Sacrifice:** a summon about to die bursts instead | Temporaries burst when they expire too: constant explosions | Each role bursts differently (a tank's burst taunts, a support's heals) | A rare, huge burst; the rebuild hurts |
| **Reforge:** rebuilt summons return shielded | Every re-summon arrives shielded | Fresh pieces rejoin the next Pack Strike at once | An elite comes back safely |
| **Harvest:** kills feed the rebuild queue | Kills extend the temporaries | Kills bring the next Pack Strike forward | Kills heal the elites |

**Now T3: Specialization (3 per discipline), to be reimagined for the new mould.** The
pass-1 draft, mined from the nine current specializations:

| Swarm | Pack | Elite |
|---|---|---|
| **Iconoclast:** temporaries explode when they die or expire, for a share of their max HP | **Marshal:** Pack Strike every 5 s, and every fight opens with one | **Idolwright:** one elite may go Colossal: +2 Command, triple size, a third ability |
| **Kilnmaster:** pairs become trios; faster re-summoning | **Chorister:** each type in a Pack Strike leaves its own lasting effect on the target | **Covenanter:** elites come as bonded twins that share damage taken |
| **Inquisitor:** every swarm hit marks the target; marks stack damage taken (the Swarm's boss answer) | **Ritualist:** between Pack Strikes, each type gets two empowered uses of its ability | **Champion:** elites rank up during a fight (every 15 s alive or each kill, up to 3 ranks) |

**Weapons and armor past T1.** The five T1 weapon jobs (more bodies, faster attacks,
poison, stronger abilities, fewer and stronger) recur each tier as new recipes; new biomes
add variants (a Jungle weapon that favours healers). Armor keeps spreading along the
who-tanks dial each tier.

**Not in pass 1, and why:** numbers (bots and the designer's balance passes); boss fights
(designed later); the party role and bot plan (written with pass 2).

**Pass 1 open questions:**
1. Swarm's pairs of temporaries apply to 1-cost summons only. Right line?
2. Elite needs eleven authored second abilities, one per specialist. Acceptable authoring?
3. Pack's Variety Command: +2 at T2; does it grow at T4?
4. The Cave Heart (spiderlings) overlaps the §4 mockup's Broodmother's Egg component
   (dying summons hatch broodlings). Which keeps the idea?
5. Still open from before: rebuild HP cost (summon HP vs Command; this draft assumes
   summon HP) and out-of-combat rebuilding (charm line vs free by default).

**The designer's review of pass 1 (2026-10-13):**

- **Swarm:** a cool fantasy; watch that it doesn't escalate. Temporary pairs for 1-cost
  summons only is good on paper. Swarm should push you to run cheap summons and to
  maximise Command. Open: are there real decisions inside it (does a support make sense
  in a swarm)? *Tentative.*
- **Elite:** not sold on Promote (too much authoring). Designer's alternatives: promote one
  summon to a bigger, beefier form; or raise the cost floor to 2 and grant more Command for
  the bigger summons, which discourages 1-cost ones. *Open.*
- **Pack:** not a flat +2. Something dynamic, e.g. a summon costs less when the formation
  doesn't already have its type. *Decided (direction) / Open (rule).*
- **T3:** needs to be explained by what each option changes and which builds want it.
  *Open.*
- **T4 masteries will be reimagined.** Many old ideas may still apply, but the old nine
  are not a constraint. *Decided.*
- **This dive is the template** for the other five classes' sessions. *Decided.* Writing
  the template comes later; this session only makes the Conduit work.

**Second review (2026-10-13):**

- **The T3 flat pick doesn't work as drafted.** Burst / Reforge / Harvest is narrow, a
  minor farming boost at the scale of a T5+ leaf node, and it breaks the rhythm: T1 and T2
  big, T3 small, T4 big again. *Decided (diagnosis).* The designer's alternative: **move
  the specialization (mastery) to T3**, so the build is fully branched by T3, and make T4
  onward leaf nodes (smaller flat decisions). The old design deferred specialization to T4
  for gradual complexity and because the T3 range pick was itself structural; range no
  longer exists. *Open, cross-class (changes §2 for every class).*
- **Elite direction:** the higher cost exists to discourage cheap summons and push you to
  field only elite ones. Each elite summon gains an extra ability or passive that deepens
  its role or lets it do something special; it doesn't need to just get stronger. Elite
  should have the least effective Command, so its picks are constrained. Designer's lean:
  every summon costs +1 Command in Elite. Worry: Elite would then chase the weapons that
  add the most Command. *Decided (direction) / Tentative (+1 rule).*
- **Whether a Heart costs Command** is not established. *Open.*

**Third review (2026-10-13):**

- **Structure change applied to every class** (§2): specialization at T3, leaf nodes from
  T4. *Decided.* Open for the Conduit: what each tier now gives the class, and the nine
  specializations reimagined for the new mould.
- **Elite:** an elite summon gets some extra bulk and stats (modest, not double) plus an
  extra ability **or passive** that deepens its role or lets it do something special.
  *Decided.* Some drafted examples are too strong (the line-piercing shot). The extras are
  where Elite gets its area damage, which it needs with fewer bodies working. *Decided
  (direction).*
- **The Heart costs no Command.** *Decided.* Its power gap is intended: every class gets
  a strong boss piece (§4). How strong it is gets measured.
- **What does a higher-tier version of a biome you already have a summon from give you?**
  Scaling with tier alone is not enough. More specialization, or a new variant? *Open.*

**Fourth review (2026-10-13):**

- **A higher-tier biome binds a new variant summon.** A summoner is supposed to have many
  possible summons to field against its enemies. Roughly 26 specialists through T4 (5 at
  T1, then 5 variants + 2 new biomes per tier), plus 11 Hearts. The designer accepts the
  authoring load (~60+ designs, written together). *Decided.*
- **Method: fantasies and concepts first; rules only when out of ideas.** The proposed rule
  "each discipline's three specializations cover packs / bosses / sustain" was rejected.
  *Decided.*
- **Specialization concepts (designer):** *Tentative.*
  - Swarm, **burn bright:** temporaries arrive with a burst (more attack speed for their
    first seconds), then burn down. A T4 leaf that makes them explode (Burst) turns it into
    a T3 + T4 combo: bursty summons that blow themselves up.
  - Swarm, **duplicates:** bonuses for fielding more copies of the same summon, compounding,
    so you aim for as many identical summons as possible.
  - Pack: each specialization **significantly empowers one role group**: tanks; damage
    dealers; utility (buffers, debuffers, healers).
  - Elite: **double down on heavy:** summons cost even more and are even stronger.
  - The old Champion (the Conduit fights beside its summons): doubtful.

**Fifth review (2026-10-13):**

- **Burn bright arrives in waves.** *Decided.*
- **Leaves: three per discipline per tier** (§2). *Decided.*
- **Specializations kept:** Swarm: *Burn Bright*, *Legion* (duplicates), *Infestation* (it
  ties the class to damage over time). Pack: the three role stars (*Shield Wall*, *The
  Hunt*, *Choir*). Elite: *Colossus* (the big double-down) and *Ascendant* (summons grow
  stronger the longer a fight goes on, not from kills; it wants a healer keeping them
  alive). *Decided (concepts).* Champion is dropped. *Decided.*
- **Elite's third specialization is open.** Warlord's retinue is too much, and elite
  pairs overlap Swarm. *Open.*
- **Swarm's T2 baseline is not locked.** Temporary pairs are a fair idea, but whether it
  achieves the swarm identity needs seeing in the game. *Open.*
- **Pass 2 is not needed now:** the T1 summons are as sketched. The Hearts get designed
  once what every class does is settled. *Decided.*

**Sixth review (2026-10-13):**

- **Juggernaut belongs to the summon layer:** a summon type whose damage scales off its
  HP, not a specialization. *Decided.* (A natural variant for the Cave heavy. *Proposed.*)
- **Swarm's T2 baseline, for now: cheap permanents.** 1-cost summons cost half, so you get
  two for the price of one, and they rebuild for free. No temporaries in the baseline:
  temporaries come from Burn Bright, Infestation and the later explosions. *Tentative
  (may change after seeing it in the game).* Note: under "power follows Command", a
  half-cost summon is a half-strength one; the gain is bodies, free rebuilds and spreading
  across area hits. *Proposed.*
- **T4 leaves:** liked overall. Reforge (rebuilt elites return shielded) depends on how
  often elites actually die; Shockwave is a different layer (area damage) and doesn't
  belong. The Conduit's T4 reads as **"do your summons survive, or do you want them to
  die, and if they survive, how?"** *Decided (theme).*
- **Elite's third specialization, the designer's two ideas:** *Open.*
  - **Two Hearts:** the specialization lets you field two different boss Hearts that buff
    each other and the whole formation. Risky until the Hearts are designed.
  - **Cheaper elites:** a small group of elites, "a swarm of elites". It may contradict
    Elite's identity.
- **Relics are in question.** The weapon now expresses what Conduit relics were meant to
  (summon count and strength), and the armor and charm carry class lines. Does a slot
  that modifies class mechanics still make sense, or is a slot or stat missing? Not
  married to relics. *Open, cross-class.*

**Seventh review (2026-10-13):**

- **The relic slot is the boss trophy slot** (§4): the Conduit's relic *is* its Heart.
  *Decided, cross-class.*
- **Elite's third specialization: Two Hearts**, which grants a second relic slot: two
  Hearts that buff each other and the formation. *Decided.* Whether the second Heart costs
  Command: *Proposed* (yes, so it is a trade in the discipline where Command is scarcest).
- **T4 leaves: the nine life-and-death leaves are kept**, without overthinking them.
  *Decided.* Devour changes: a summon that has lived for a while starts stealing back HP,
  so it works on bosses too. *Decided.* No on-kill triggers where avoidable (§1).
- **Swarm strength (half vs full) is a playtest question.** The designer considered
  full-strength half-cost summons; the agent warned it doubles power per Command. *Open:
  test both.*
- **Power curve:** T2 a considerable step, T3 consolidates, then modest (§2). *Decided.*
- **To review for on-kill triggers:** Infestation's spread (it keeps a boss half as a DoT),
  the Wasteland Heart (enemies killed rise), Harvest. *Proposed.*

**Eighth review (2026-10-13):**

- **Recall stays** (a button and a free rule). *Decided.* The per-discipline Conduit casts
  drafted in pass 1 (Call the Horde, Empower) were unclear and are under review; agent's
  lean: drop them. *Open.*
- **The second Heart costs Command.** How much is a playtest question. *Decided.*
- **Party role: the Conduit is the flexible party member.** It can tank a swarm through
  bodies that absorb hits, support through its support summons, or simply deal damage.
  **Support summons' buffs and debuffs also affect the party.** Possibly strong; worry
  about it later. *Decided.*
- **A fully resourced summoner should feel a bit unfair.** It has clunky moments (summons
  dying, unavoidably) and moments where everything works very well, which is what
  summoner players want. In an edge case it may be the strongest class. *Decided.*
  Agent's notes (*Proposed*): measure the Conduit at the median (it must not be the
  weakest there) and its ceiling separately, as §4 already does for rule-benders; the
  same buff from two Conduits does not stack, so a party of Conduits doesn't multiply;
  the clunky moments must stay readable (you see the slam that killed them) and
  recoverable (Recall, rebuilds).
- **Additions (agent, 2026-10-13):** *Proposed.*
  - Swarm, **infestation:** swarm hits infest the target; an infested enemy that dies bursts
    into new temporaries (chains through packs), and infestation stacks a DoT on bosses.
  - Duplicates escalate (compounding × Command growth). Guard: visible thresholds (at 4
    copies they do X, at 8 they do Y), not a per-copy percentage.
  - Pack's role specializations as mechanics, not percentages: *Shield Wall* (damage to any
    tank is split across all tanks; each different tank type adds a layer); *The Hunt*
    (each different damage type that hit the target in the last few seconds raises
    everyone's damage on it); *Choir* (a support's ability echoes, weaker, through every
    other support type). Variety within the favoured role keeps Pack's identity.
  - Elite candidates beside the double-down (*Colossus*): *Ascendant* (elites rank up
    during a fight), *Warlord* (each elite leads a small retinue of temporary copies, which
    covers packs, Elite's weak spot). Drop Champion: the Commander identity is Decided.

**Runtime fact behind the tank role:** all 26 bosses carry `targeting.prefersPlayers`, so
they skip summons for the Conduit whenever it is in reach; no monster carries
`ignoresTaunts`, and a taunt overrides target selection. A tank summon holds a boss through
its taunt, not its HP (`server/src/systems/combat/ai/monsterTargeting.ts`, `taunt.ts`).

**Ninth review (2026-10-13), the last before the rewrite:**

- **No damage redirection by default.** Today's sponge (a share of hits aimed at the
  Conduit goes to a random living summon) exists only where a gear line grants it.
  *Decided.*
- **How monsters choose targets (code):** regular mobs attack the closest target in pull
  range, player or summon; bosses prefer players when in reach; a taunt overrides both.
  Nothing hunts the Conduit specifically; a `lowest-hp` targeting mode exists unused.
- **Later:** mobs with different targeting, some opportunistic ones ambushing the
  summoner. *Parked (designer's direction).*
- **No Conduit casts beyond Recall.** Call the Horde and Empower are dropped; the Pack
  Strike was never a cast but Pack's T2 rule. *Decided.*
- The designer is happy with the result: §7 rewritten to the class template, ready to
  lock.

**Tenth review (2026-10-13), after the rewrite:**

- **No evasion on the Conduit's Forest armor.** A dodge counter is trackable when you are
  the only target and becomes a nightmare to follow across many summons. The Forest armor
  line is open again. *Decided.*
- Next: confirm the proposals left in §7, then design the tiers after T1 (what each new
  biome gives the class, how the gear evolves) and the Hearts (name open too).
- **Forest armor: Bramble (thorns).** *Decided.*
- **The Heart is renamed the Soul** (the designer liked Aspect too; Soul won). Agent:
  name each Soul after its boss lineage (Crag Soul), since League of Legends has a
  "Mountain Soul". This log keeps the old name. *Decided.*
- Lock approach: walk through the agent's proposals in §7 first. Then T2, biome by biome.

**Eleventh review (2026-10-13):** the agent's §7 proposals were walked through; approved as
written: role rows, the three orders plus "rebuild first", the HUD, the Plains sweep-taunt,
the Swamp acid, the ~minute-6 first specialist, Juggernaut as the Cave variant, the Swamp /
Mountain / Cave armor lines, Pack's role mechanics, Legion's thresholds, summons scaling
with tier. **Not approved:** "the same buff from two Conduits doesn't stack" (to discuss).
Next: T2 biome by biome; the agent's draft is §7.16.

**Twelfth review (2026-10-13):**

- T2 biome by biome: approved on paper, to judge in the game. First Strike also suits
  builds whose summons keep arriving fresh. *Decided.*
- Decoy is too specific. The designer's insight: the summoner ignores debuff fights
  because its summons tank the debuffs. Code check: a monster's hit on a summon bypasses
  the pipeline and carries no on-hit effect. **Debuffs now land on summons like on
  players.** *Decided.*
- Party buffs: the same buff from two Conduits doesn't stack (strongest copy). *Decided.*
- Desert: **Sandveil** armor (ranged hits deal less to you and your summons) and **Purge**
  charm (periodic cleanse of the most debuffed body). *Decided.*
- Charms were forgotten: they need Conduit lines answering a mix of "how do your summons
  recover" and "how do you recover". Agent's pass: §7.9's charm table. *Proposed.*

**Thirteenth review (2026-10-13):** charm lines approved ("good enough; don't overcook";
Bloomlink may be too strong). Next: T3 biome by biome; agent's draft in §7.16 (Plains' jobs
to the Volcanic, the Forest's to the Jungle; new Tundra and Volcanic jobs that avoid the
Apprentice's shatter and detonate).

**Fourteenth review (2026-10-13):** T3 approved on paper (to judge in the game), except: the
Tundra weapon's basis (Planted) is uncertain; Phoenix is dropped (odd, niche); Firewalker is
questioned, and the code confirms ground hazards hurt only players. The Cinderling's ramp is
universal, its own heat, not the Volcanic's. Hibernate may be too strong. Next: T4; the
agent's draft is in §7.16 (the Swamp's jobs to the Graveyard, the Cave's to the Trench).

**Fifteenth review (2026-10-13):** hazards stay player-only; the whole hazard question goes
to its own session, and the Volcanic armor needs a different bonus (agent: Fireproof,
damage over time halved on you and your summons). Tundra weapon: **Icebound**. Volcanic
charm: **Emberglow**. Signature payoffs stay exclusive to their class, but some
cross-pollination is fine (a damage-over-time Conduit playstyle is allowed). *Decided.*

**Sixteenth review (2026-10-13):** T4 approved on paper. Colossus gets one shared twist,
not a third trait per summon. Elite starting numbers +50% HP / +25% damage (Colossus
+100% / +50%), to tune after bots and playtests. Fireproof taken. T5–T6: a future session
(players want content), not now. The designer found T3 has no heavy and no support heavy
exists: agent proposes the Warhorn as the T3 heavy support and the Cave heavy as a tank,
so every tier adds a heavy with rotating roles.

**Seventeenth review (2026-10-13), the lock:** the Warhorn is the T3 heavy support and the
Cave heavy a tank (every tier adds a heavy, roles rotating). T1's five Souls use the seed
lines so the T1 build has them. **§7 locked.** `summoner-overhaul-design-source.md`
archived per §14. Committed to develop.

