# Progression Rework — Design Bible

**Status:** design authority, drafted 2026-09-30 from the post-v0.6.2 playtest review.
**Scope:** item lineage trees, biome variants and materials, frame loops, range nodes,
the visual-feedback rule, and the balance rules that keep all of it tractable.
**Out of scope here:** the HP/recovery pass (its own coarse pass, see the plan), ability
internals beyond wiring, T5+.
**Implementation plan:** [`docs/progression-rework-plan.md`](../docs/progression-rework-plan.md).
**Prototype UI:** the clickable mockup published 2026-09-30 (Rapier Lineage Tree artifact).

"Locked" = decided with the designer on 2026-09-30 (the proposal review happened the same
day; everything marked locked below survived it). "Proposed" = my assignment, not yet
reviewed. "Open" = needs a call before the phase that uses it.

---

## 0. Why (the playtest diagnosis)

Four complaints, two causes.

1. **Nothing is an event.** Essence is a fixed share of XP on every kill, catalysts mint
   silently, +3 to +4 is a few percent on a stat line. Deterministic is not the problem;
   the drip is. Rewards need discrete, visible units.
2. **Magnitudes sit below perception.** Node modifiers are authored at M = 0.05 at T1 so a
   new player "barely notices" (that goal was the bug). Recovery outpaces sustained damage,
   so HP sits at full until a burst empties it.

Consequences we accept:

- The +1..+5 ladder, catalysts, and node modifiers are **replaced**, not tuned (locked).
- Complexity is front-loaded to T1 (locked). Depth grows by adding rows, never systems.
- Every unlock must be visible in combat (locked, §8).

---

## 1. Core invariants (inherit design-bible.md §1, plus these)

- **Deterministic drops.** Every kill drops its family's shard; the boss drops its
  capstone material every kill. No rolls, no pity timers. Costs, not chance, gate pace.
- **Owned is forever, active is a choice.** Paying for a card or a form is permanent.
  Swapping which owned card is active, or which owned form is worn, is free and instant
  under the same rules as swapping gear today.
- **One row, one active card.** A row is a choice, not a shopping list.
- **Closed vocabulary.** Cards are data over a fixed set of trigger kinds and payoff kinds
  (§6). A card that needs bespoke code is a design bug, not an engineering task.
- **One magnitude table per tier.** Card numbers derive from a per-tier scalar and a lane
  budget (§9). Hand-authored numbers per card are forbidden.
- **Bias, never lock.** Frames bias lanes, lanes bias defenses, variants bias lanes. Every
  off-bias combination still works at reduced strength (target 80%, never 0%).

---

## 2. Lineages (locked: 5 per slot, one per T1 biome)

**The slot holds the lineage, not an item.** The weapon slot reads "Rapier". Its name,
art, and base stats are whatever *form* it currently wears (Flash Rapier at T1, Gale
Needle or Stinger Rapier at T2). Tiers are gates on the lineage's tree.

| Slot | Plains | Forest | Mountain | Cave | Swamp |
|---|---|---|---|---|---|
| weapon | Broadsword | Rapier | Hammer | Axe | Dagger |
| armor | Robe (plating) | Bindings (evasion) | Plate (guard) | Hide (%DR) | Wrappings (dot-resist) |
| recovery | Stone (on-kill) | Heartroot (potency) | Barrier | Pulse (absorb) | Eye (pulse) |
| mobility | Fleet (kill-speed) | Wraps (ooc-speed) | Treads (approach) | Wing (stealth) | Marsh (slow-resist) |

Cores and relics keep no tree. They stay single-purpose, one per biome, and become the
multiplicative layer on a lane (§7).

**Later-biome debut items become forms, not roots.** Jungle Stinger, Desert, Tundra,
Volcanic, Trench, Graveyard roots are re-homed as forms at the matching tier's gate of an
existing lineage (Stinger is the Jungle door at the Rapier's T1 gate). Nothing a player
earns at T1 dead-ends. Existing `lineageId`/`evolvesFrom` data is the seed for this
mapping; the plan lists the re-homing table as a review item.

**Switching lineages (locked).** A second lineage in the same slot is a second tree. Owned
cards on the old tree stay owned. Rows already owned at the same tier on any other
lineage of that slot are 50% off on the new tree, so a respec at T2 costs an afternoon,
not a restart. Gates are never discounted.

---

## 3. Packets and lanes (locked: lineage picks 3 of the packet list)

A **packet** is a stat the player scales, a trigger that fires, and a payoff. Each
lineage carries three packets as its three **lanes**, drawn from this list:

| Packet | Wants | Fires on | Pays with | Weak against |
|---|---|---|---|---|
| Tempo | attack speed, on-hit | every Nth hit | echo hits, speed windows, rampage | fortified plating, single big target |
| Empowered | attack %, empowered mult | class mechanic fires | vulnerability, plating shred, stagger | swarms, evasive mobs |
| Affliction | conversion %, stacks | stacks reach cap | hemorrhage, poison, Detonate, Contagion | dot-resistant mobs, short fights |
| Control | slow/chill | hit on slowed target | root, stun, bonus vs controlled | control-immune bosses |
| Kill chain | move speed, on-kill | kill | recovery burst, kill-speed, cooldown refund | single boss, no chain |
| Engagement | approach, first hit | fight start | engagement DR, opening burst, barrier refill | long attrition fights |
| Bulwark | plating, stationary DR | standing still / hit taken | plating stacks, absorb ramp, ward | mobility-demanding fights |
| Barrier tempo | barrier %, recharge | barrier breaks | break heal, refill on max hit | sustained chip |

Weapons draw from the first six. Armor, charm, and boots draw from all eight but express
offensive packets through their **defensive face** (§3.1). Coverage rule (§9): every
packet must appear on at least two lineages per slot per tier.

### 3.1 Frames name the defensive faces (locked)

The frame stat skews already exist and are unnamed. Name them:

| Frame | Defensive face | Native defenses |
|---|---|---|
| Light | **Avoid** | evasion, engagement DR, move |
| Balanced | **Sustain** | recovery, barrier, ward |
| Heavy | **Endure** | plating, %DR, absorb |

Defensive cards pay out fully on the matching frame and at ~80% off-frame. This is a
bias so that encounters which punish one face do not hard-counter a frame. Endure and
Sustain are only distinct faces once recovery is flat (§15); under the percentage model
they were one stat.

### 3.2 T1 weapon lane matrix (locked)

| Lineage | Lane A | Lane B | Lane C | Derived from |
|---|---|---|---|---|
| Plains Broadsword | Kill chain | Empowered | Tempo | technique CDR/power, swarm biome, generalist floor |
| Forest Rapier | Tempo | Affliction | Engagement | 1.50 aps, Jungle on-hit successor, duelist |
| Mountain Hammer | Empowered | Control | Engagement | empowered-mult bonus, stagger fantasy, approach boots |
| Cave Axe | Tempo | Kill chain | Empowered | dead-swing chaos, 1.10 aps, premium biome |
| Swamp Dagger | Affliction | Control | Kill chain | reservoir DoT, chill/slow, contagion on kill |

Coverage at T1: Tempo 3, Empowered 3, Kill chain 3, Affliction 2, Control 2,
Engagement 2. Every packet on at least two lineages.

Armor/charm/boots matrices are authored in Phase 4 of the plan using the same rule, with
each biome's existing mechanic as Lane A.

---

## 4. Rows: one question per tier (locked, thresholds included)

The tree is one band per tier. Each tier adds exactly one row, and each row asks a
different question. **The screen never gets wider.**

| Tier | Rows in the band | The question | Unlock (biome level within the tier's six) |
|---|---|---|---|
| T1 | Stat, Payoff, Gate | which lane? | stat L2, payoff L4, gate L6 |
| T2 | Stat, Payoff, Amplifier, Gate | how does it fire? | L2, L3, L5, gate L6 |
| T3 | + Keystone | what does it become? (rule change) | spread across the band, gate at cap |
| T4 | + Cross-lane | what do I borrow? (second lane at reduced strength) | same |

Row semantics:

- **Stat** — the lane's scaling stat. The one row that is a number. Gets a cosmetic
  (weapon trail colour/intensity), never an effect.
- **Payoff** — a trigger *and* its effect in one card. There is no standalone trigger
  row: a card must do something the moment it is bought.
- **Amplifier** — modifies the owned payoff: duration, second target, extra trigger.
- **Keystone** — changes a rule. Empowered's finisher becomes an area hit; Tempo's echo
  chains until it misses; Affliction stacks stop expiring while you keep hitting. This
  row hands off to the existing 45 T3 class paths: the item keystone and the class path
  name the same lane and complete each other. They do not duplicate.
- **Cross-lane** — take a second lane's payoff at ~50%. Hybrids appear late, when the
  player has earned the vocabulary. Never before T4.

Non-weapon slots run one row fewer per tier (no stat row; base stats come from the form).

**Old bands collapse.** Paying a gate folds the previous band into a summary line
("T1: Keen Edge, Rend"), expandable to reslot. The panel always shows one lit band and
one silhouette. The stat row's value folds into the next form's base stats at the gate,
so the visible stat row is always the current tier's.

**Global Mastery keeps its role.** Rows unlock on the same per-tier mastery band that
+1..+5 use today, with the gate where +5 sits (full mastery of the tier). Mastery gates
*when* you can buy, materials gate *whether*, the boss gates the *transformation*.

---

## 5. Forms and gates

A **gate** is the evolution. It sits at the bottom of a band, costs essence plus the
biome boss's capstone material, and transforms the item: new name, new art, base stats
jump to the next tier's form, next band lights up. It is the reward moment.

- A gate may offer **several forms** (Rapier T1 gate: Gale Needle from the Forest boss,
  Stinger from the Jungle boss). Both can be owned. Swapping worn form is free.
- Forms of the same lineage at the same tier **share the band**. Only base stats, art,
  and the **capstone** differ. A new form is one capstone plus art, cheap to author.
- **Capstones add a verb**, never a number. "Every finisher extends your Light window",
  "hits on afflicted targets echo", "kills leave a pool". They are also where a form may
  modify an ability ("Slam also roots"), which is how abilities get class-and-build
  flavour without per-class ability trees.
- The T1 form is crafted as today (essence only, from the Make tab). Everything after is
  the tree.

---

## 6. The closed vocabulary (locked principle, proposed lists)

Cards are data. Adding a card adds no code and no test.

**Trigger kinds** (≤10): `hit-nth`, `mechanic-fired`, `first-hit`, `kill`, `evade`,
`hit-taken`, `guard-cast`, `standing`, `pulse`, `barrier-break`.

`mechanic-fired` is the one seam that does not exist yet: a class-agnostic "your mechanic
fired" event covering finisher, execution, full stacks, reload, energy burst, and a
summon command. The `empoweredMultiplier` metadata and `hasEmpoweredAttack` marker are
most of the way there.

**Payoff kinds** (≤15): `vulnerability`, `plating-shred`, `echo-hit`, `hemorrhage`,
`poison-stack`, `slow`, `stun`, `damage-window`, `speed-window`, `recovery-window`,
`ward`, `cleanse`, `plating-stack`, `engagement-dr`, `contagion`.

Every payoff maps onto an existing server hook (cadence aftershock/hemorrhage/rampage,
cooldown rupture/overdrive, dot conflagration/chill, defense hit-plating/engagement-dr/
overheal-ward, the control ladder, the affliction toolkit). No new combat primitives for
the first slice. If a card cannot be expressed, the card changes.

**One multiplier per hit** still holds: `damage-window` and lane payoffs route through
the existing empowered multiplier metadata, never as a second multiplicative layer.

---

## 7. Synergy layers (locked: five, one multiplicative)

1. **Within an item** — the stat row feeds the payoff row of the same lane.
2. **Across slots** — the weapon payoff completes with an armor/charm/boots payoff of the
   same lane. This *is* the packet, and the layer players build toward. **Any slot may
   complete a packet** (locked); the coverage rule guarantees every packet completes on at
   least one non-weapon slot per tier, and the tree UI's build readout names where.
3. **Frame bias** — Flurry leans Tempo, Breaker leans Empowered, via the frame loop (§10).
4. **T3 path + core** — names a lane and deepens it. The only multiplicative layer.
5. **Abilities** — use-ability runes fire on lane events (Slam on `mechanic-fired`,
   Cleanse on full stacks). Existing rune machinery, no new system.

Range nodes are **not** a layer. They interact with the frame loop (§11), not the grid.

---

## 8. The visual rule (locked)

Every card the player buys adds one thing they can see in combat. A card with no
signature is a stat, and stats are what the old system had too many of.

| Row | Visual budget |
|---|---|
| Stat | weapon trail colour / intensity in the lane colour |
| Payoff | a new on-screen event: crack, ghost hit, stack pip, pulse |
| Amplifier | the event gets bigger or spreads: shake, second target, arc |
| Keystone | the event changes shape: shockwave, chain, persistent aura on the target |
| Gate | form art changes, plus a lasting aura in the lane colour on the player |

Lane grammar: **Tempo** = afterimages, speed lines, ghost strikes. **Empowered** = weapon
glow building with charge, crash with shake, plating cracks. **Affliction** = stack pips,
spread arcs, detonation bursts. Defensive faces: **Avoid** = blur/sidestep,
**Sustain** = pulses and ward shells, **Endure** = plating chips and a stance pose.

HUD: charge/stack counters and buff clocks are part of the feature, not polish. This
extends the "vanilla early, flashier with stage" player-sprite progression.

Acceptance test: two Strikers on the same pack, a watcher can name both builds from
across the room.

---

## 9. Balance and coverage rules (locked)

- **Lane budget.** At full rows for a tier, each lane's measured throughput (or eHP, for
  defensive faces) lands within ±10% of the tier median on the bench, on that lane's
  intended variant. Off-lane on an unfavourable variant may fall to ~70%.
- **Per-tier magnitude table.** One scalar per row per tier plus a lane budget drives
  every card's numbers, like the modifier `M` table. Tuning a tier is one row in one table.
- **Coverage matrix is a test.** For every tier: every packet appears on ≥2 lineages per
  slot; every lane has ≥1 form per slot whose capstone crowns it; every variant family maps
  to a packet; every packet has ≥1 variant that favours it and ≥1 that punishes it.
- **Pure lanes are the reference builds.** Three per frame, run by the bot harness against
  every variant. Hybrids are T4-only and measured last.
- **Encounters declare an answer.** Every variant family names the lane it favours and
  the lane it punishes. "Does the intended lane win by ~30%? Does the punished lane still
  clear?" is the pass/fail per node.
- **Ship one slot at one tier first** (locked): weapon tree, T1, Plains + Forest variants.
  Measure before authoring anything else.

---

## 10. Frame loops (direction locked, containers reviewed per root)

Frames today are "the same thing faster or slower" plus a stat skew. Give each a
feedback loop whose *container* encodes the skew, so the frame decides what the build
wants to scale. The table below is the cadence/cooldown shape; **each root is reviewed
class by class with the designer before authoring**, because dot, reload, energy and
summoner do not have a finisher to hang the loop on:

| Frame | Loop | Container | Skews toward |
|---|---|---|---|
| Light | finisher grants a damage window | **timed buff** shorter than one cycle (~1.5 s vs ~3 s cycle); uptime = duration / cycle, so attack speed pays twice | attack speed, on-hit |
| Balanced | hits add charge, finisher grants a short window | both, small, pointing at each other | neither; "the loop" |
| Heavy | hits add charge stacks, finisher spends them | **stacks**, capped at threshold−1, deterministic; plus a non-damage rider (stagger or plating shred) | attack %, empowered mult |

Rules: the window must be shorter than the cycle or it collapses into a flat stat. Route
through `empoweredMultiplier`, never a second multiplier. Stack counter and weapon glow on
the HUD are mandatory.

---

## 11. Range nodes (locked)

Players default to Mid because Mid has no cost and no mechanic. Two fixes, do both:

- **Mid gets a positional mechanic, authored per class** (pierce for one root, poise for
  another, and so on), so all three ranges are mechanics rather than two mechanics and a
  control group. The per-class list is written during the Phase 3 class-by-class review.
- **Range interacts with the frame loop**: Close builds charge faster on adjacent targets;
  Far extends the Light window on the first hit of an engagement.

**Range stays a leaf.** Nothing downstream (T3 paths, capstones) reads it; its own
mechanic plus the loop interaction is its whole value.

---

## 12. Biome variants and shards (locked)

Node modifiers are removed. In their place, each biome has **three mob families**, and
**each normal node is its own blend** of the three (a share vector, e.g. 70/20/10). The
blend list *is* the node list for that biome (it replaces the modifier list as the source
of node count; see the authoring trap in `map/authoring.ts`).

**Key materials are shards, keyed by packet, not by biome.** Eight shards for the whole
game (Tempo shard, Empowered shard, …). Each family drops the shard of the packet it
favours, so the material's name says what it buys and the map says where it drops. Biome
identity lives on the lineage, the form art, and the capstone material, not on the shard.

- **Every kill drops a small amount** of the mob family's shard, deterministically. Drop
  quantity and card cost scale by tier with the same kind of multiplier essence uses; there
  are no tiered shard variants. Lower-tier farming is a slow but legal route, as with
  essence.
- **Essence stays.** Shards gate the card, essence pays the bulk. The five-colour economy
  and its per-biome pacing are untouched.
- **The biome boss drops its capstone material every kill.** It is the gate cost, and
  paying the gate is the evolution into the next tier's form, so the boss is the only way
  up. One capstone material per biome.
- Wallet on `TracksProgression`: `shards: Record<PacketId, number>` and
  `capstones: Record<biome, number>` (replacing `catalysts`/`catalystProgress`). On
  screen at T1: five essences, eight shards, the capstones you have touched.
- Coverage: every packet has ≥2 families across biomes per tier, so no shard has a single
  source.

### 12.1 T1 families

Plains and Forest are **locked** (first slice). Mountain, Cave and Swamp are **proposed**
and reviewed before Phase 4.

| Biome | Family | Existing mobs | Drops (shard) | Punishes |
|---|---|---|---|---|
| Plains | Herd | boar, stampede-bull | Empowered | Tempo |
| Plains | Swarm | plains-slime, prairie-wolf | Tempo | Empowered |
| Plains | Sky | savanna-hawk | Engagement | Affliction |
| Forest | Pack | wolf, ancient-wolf | Tempo | Empowered |
| Forest | Grove | ironwood-golem, forest-slime | Empowered | Tempo |
| Forest | Canopy | canopy-sprite | Affliction | Control |
| Mountain | Crag | granite-titan | Empowered | Affliction |
| Mountain | Ridge | ridge-archer, peak-archer | Control | Kill chain |
| Mountain | Hopper | cliff-hopper, stone-eagle | Tempo | Empowered |
| Cave | Brood | giant-spider, deep-spider | Affliction | Tempo |
| Cave | Brute | cave-brute, cave-troll | Empowered | Affliction |
| Cave | Deep | cave-lurker, gargoyle | Kill chain | Engagement |
| Swamp | Mire | bog-slime, mud-toad | Affliction | Empowered |
| Swamp | Coven | bog-witch, hydra | Control | Tempo |
| Swamp | Stalker | mire-stalker | Kill chain | Bulwark |

Shard sources at T1 with the whole table: Tempo 3, Empowered 4, Affliction 3, Control 2,
Kill chain 2, Engagement 1 (Plains Sky only, so Engagement needs a second T1 source when
Mountain is reviewed; Ridge is the candidate). Bulwark and Barrier tempo have no T1
family source and are sourced from Phase 4's defensive families or, if none fits, from
the boss capstone as a secondary drop (open).

---

## 13. Worked lineage: the Rapier

**T1 band (Forest), lanes Tempo / Affliction / Engagement**

| Row | Tempo | Affliction | Engagement |
|---|---|---|---|
| Stat (L2) | Quick Wrist: attack speed | Envenomed: on-hit flat | Keen Edge: attack |
| Payoff (L4) | On Strike: every 3rd hit echoes | On Strike: a share of each hit becomes hemorrhage | First Blood: opening hit is a damage window |
| Gate (L6) | Gale Needle (Warden's Heart): every finisher extends the Light window | Stinger Rapier (Matriarch Fang): hits on afflicted targets echo | — |

Shards: Tempo (Forest Pack, Plains Swarm), Affliction (Forest Canopy), Engagement
(Plains Sky). Gate: Warden's Heart (Forest boss) or Matriarch Fang (Jungle boss).

**T2 band (shared by both forms)** adds the Amplifier row: Echo jumps to a second target;
hemorrhage spreads on kill; First Blood also fires on each new target. Third form door at
T2 gate: Venomthorn (Jungle).

**T3** keystone: Tempo's echo chains until it misses; Affliction stacks stop expiring while
hitting; Engagement's opening window becomes a stun. Handoff to the Striker T3 paths.

**T4** cross-lane: borrow one other lane's payoff at 50%. Deathfang form.

---

## 14. Three builds this produces (sanity check)

- **Executioner** — Striker/Breaker, Empowered. Charge glows, finisher cracks plating,
  ward flashes before the crash. Good vs Crag/Brute/Grove, bad vs Swarm/Pack.
- **Whirlwind** — Striker/Flurry, Tempo + Kill chain. Afterimages, ghost strikes, green
  pulse per kill. Good vs Swarm/Pack, bad vs a single fortified boss.
- **Plague** — Ember Mage, Affliction. Stack pips, arcs on kill, Detonate bursts. Good vs
  dense packs and long fights, bad vs Mire-resistant or short fights.

---

## 15. Flat recovery (locked 2026-09-30)

**Recovery is a flat rate: one point restores one HP per second while fully active.**
It no longer scales with max HP. Out of combat the player heals at a fixed percentage of
max HP per second regardless of the stat, so downtime is constant.

Why: under the percentage model max HP and recovery were the same stat in disguise.
Doubling the pool doubled healing, monster damage stayed fixed, and the bar moved less.
The Phase 0a bench confirmed that raising the pool moved the fight-end metric the wrong
way. A flat rate makes the pool a budget and the rate a choice, which:

- makes Endure (pool, plating) and Sustain (recovery, barrier) genuinely different faces
  (§3.1);
- gives recovery gear a job at every tier instead of coasting on the pool;
- turns a per-tier **player** pool raise into a real attrition lever for bosses, with no
  monster edits;
- bounds fraction stacking naturally, since fractions now multiply an authored number.

Rules: the base rate is per player tier, calibrated so a naked character at tier entry
recovers the same share of its pool as today; charms are authored in HP/s per tier; every
in-combat fraction key is unchanged. The player pool is raised only after the charm
values are re-derived under this model, bosses measured first. Implementation is Phase 0b
of the plan.

Consequence for the bible: the old "heal-throughput soft cap of 3–4% max HP per second"
is retired. The cap is now whatever the tier's authored HP/s adds up to.

---

## 16. Open decisions (in the order the plan needs them)

1. Frame loop containers and the Mid-range mechanic, **per root**, reviewed class by class
   with the designer. Needed before Phase 3.
2. Mountain, Cave and Swamp family tables (§12.1), plus a second T1 source for Engagement
   shards. Needed before Phase 4.
3. Where Bulwark and Barrier tempo shards drop at T1 (defensive families or boss secondary
   drop). Needed before Phase 4.
4. Re-homing table for later-biome debut roots into forms. Needed before Phase 5.

Decided 2026-09-30 during the proposal review: row thresholds, defensive faces, the T1
weapon lane matrix, Plains and Forest families, shards by packet (every kill, essence-
style tier scaling), boss capstone as the gate cost, any slot may complete a packet,
50% switch discount on rows, range stays a leaf, keystones hand off to the T3 paths.
