9. **Bench criterion, replacing §9's bands (from the 2026-10-01 day-run bench).** "±10% of the
   median" shrinks as lanes weaken (+3.9% to +4.7% at a +4.3% median) and "favoured lane
   wins by ~30%" was never met. New reading: **lane budget** = every packet's mean uplift
   over its lane-less control lies within **±3 percentage points** of the median uplift at
   T1 (the band is authored per tier in the magnitude table, next to TIER_SCALAR).
   **Encounter check** = on a family's own node the favoured lane ranks **first** of the
   lanes measured there and the punished lane ranks **last**; the margin is reported, not
   required. A family whose favoured lane is *negative* on its own node (Cave Deep −17.6%,
   Plains Herd −7.5% on 2026-10-01) is a **monster-shape** finding for the Phase 4 monster
   pass, never a reason to tune that lane's cards per node.
10. **Frames column.** The bench needs three reference profiles per root (one per frame,
   18 rows) to show Light / Balanced / Heavy uplift. Approved as its own follow-up task;
   it roughly triples the run.
# Progression Rework — Design Bible
11. **Band gating follows the worn form (2026-10-01).** A band of tier N gates on the biome
   of the form worn at tier N, its door biome, not the lineage's home biome. The Rapier's T3
   band is earned in the Jungle. Without this every T3/T4 card on a lineage whose home
   biome retires (Plains and Forest at T2, Cave at T3) was unreachable.
12. **Monster pass delegated (2026-10-01).** The run-3 proposal table is applied by run 4,
   one provisional commit per family, for the designer to revert row by row. Families must
   carry the stats their contracts name: `dotResistance` was on no monster, `evasion` on two.
   Locked comments in monster files lose to a family contract and are rewritten.
13. **Consort loop decided: "the line holds."** Formation plating and DR while all five
   slots live; a death breaks it; a reconstruction restores it. Frame brief §1 is closed.

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
- **Keystone** — changes a rule. **Amended 2026-10-01: one keystone per packet, eight in
  all, shared by every lineage that carries the lane in any slot** (not one per lane per
  slot). Tempo *Chain*: the echo keeps re-triggering until a miss or no fresh target.
  Empowered *Shockwave*: the mechanic's hit becomes an area hit. Affliction *Festering*:
  stacks do not expire while you keep hitting. Control *Ladder*: slow, then root, then stun
  on hit, once per step per target. Kill chain *Refund*: a kill readies the mechanic.
  Engagement *Always First*: every new target's first hit counts as the mechanic firing.
  Bulwark *Immovable*: stationary DR and plating stacks persist 2 s after moving; no
  displacement. Barrier tempo *Unbroken*: the barrier keeps recharging through hits above
  half HP. These are the "this changes how my character plays" moments. The T3 class paths
  are tagged with a packet so the item keystone and the class path name the same lane; the
  paths themselves are reviewed after the rework.
- **Cross-lane** — take a second lane's payoff at ~50%. Hybrids appear late, when the
  player has earned the vocabulary. Never before T4.

Non-weapon slots run one row fewer per tier (no stat row; base stats come from the form).

**Old bands collapse.** Paying a gate folds the previous band into a summary line
("T1: Keen Edge, Rend"), expandable to reslot. The panel always shows one lit band and
one silhouette. The stat row's value folds into the next form's base stats at the gate,
so the visible stat row is always the current tier's.

**Global Mastery keeps its role (re-confirmed 2026-10-01).** Rows unlock on the same per-tier
Global Mastery band that +1..+5 used, with the gate where +5 sat: full mastery of the tier.
At T1 that means the payoff row needs roughly three biomes mastered and the gate all five.
The tree is a **tier-wide** reward, not a biome one: a Forest rapier's working row is earned
across the tier, and a bot or player who farms only the home biome stalls by design (the
2026-10-01 live-bot run did, holding 13k essence). Harnesses must name that stall, not farm
silently. Mastery gates *when* you can buy, shards gate *whether*, the boss gates the
*transformation*.

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
`ward`, `cleanse`, `plating-stack`, `engagement-dr`, `contagion`, `evasion-window`
(added 2026-10-01 so the avoid face has a real effect).

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

- **Lane budget.** At full rows for a tier, each lane's **uplift over the lineage's own
  lane-less control, on the lane's favoured node**, lands within ±10% of the tier median.
  Off-lane on an unfavourable variant may fall to ~70%. Amended 2026-10-01 (§18.3): the
  older form compared absolute throughput across rows measured on DIFFERENT nodes, whose
  mob HP differs by more than 2×, so the band could not be met by construction — and the
  lane-less controls themselves span +21% to −14%, so an absolute reading is mostly class.
  Payoff magnitudes are normalised by trigger rate, so the comparison is per-pull value.
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

The *rows* are shared by both T2 forms; the *biome they are earned in* is not. Per §21 the
band gates on the worn form's door: L2/L3/L5 of the Forest's T2 content behind the Gale
Needle (Forest levels 8/9/11), the same three steps of the Jungle's T2 content behind the
Stinger (Jungle levels 2/3/5, because the Jungle debuts in T2 and counts its own levels
from 1). Swapping between two owned forms re-resolves the band and costs nothing.

**T3 band (Jungle)** keystone: Tempo's echo chains until it misses; Affliction stacks stop
expiring while hitting; Engagement's opening window becomes a stun. Venomthorn is the only
T3 rapier, so the band is Jungle work — Jungle levels 8/9/10/11, not the Forest 14–17 a
home-biome gate would have asked of a Forest that stops at 12. Handoff to the Striker T3
paths.

**T4 band (Jungle)** cross-lane: borrow one other lane's payoff at 50%. Deathfang form,
Jungle levels 13–17.

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

1. ~~Frame loop containers and the Mid-range mechanic, per root.~~ **Decided 2026-10-01**, see
   `docs/briefs/frame-loops-2026-10-01.md`. Still OPEN inside it: the Consort (balanced
   Conduit) loop. The T3 class paths it displaces (Pyromancer, Warmonger) are reviewed as a
   whole after the rework.
2. ~~Mountain, Cave and Swamp family tables.~~ **Approved as authored 2026-10-01.** Engagement
   has family sources since the T1 third mobs.
3. Where Bulwark and Barrier tempo shards drop at T1 (defensive families or boss secondary
   drop). Needed before Phase 4.
3b. **Drops versus favours, per family (from the 2026-10-01 bench).** Eight of nine encounter
   failures were a family's own 70/20/10 node: the declared lane loses on the purest sample.
   Per family, Phase 4 decides between *the monsters do not express the shape yet* (likely Deep,
   Brute: slow bodies that should reward big hits) and *the shard was assigned by theme, not by
   what beats the family* (likely Brood: three short-lived bodies are Tempo's best case and
   Affliction's worst). The rule stands — a family drops the shard of the lane that beats it —
   so where the bench is clear the drop moves to the earned lane and the theme stays flavour.
   Decide after the frames column exists.
4. ~~Re-homing table for later-biome debut roots into forms.~~ **Approved 2026-10-01**: the
   fourteen-row table in `docs/briefs/day-run-progression-2026-10-01.md`. T2 families for
   Jungle (Ape, Undergrowth, Stalker) and Desert (Basilisk, Scorpion, Stalker from T3)
   approved the same day.

Decided 2026-09-30 during the proposal review: row thresholds, defensive faces, the T1
weapon lane matrix, Plains and Forest families, shards by packet (every kill, essence-
style tier scaling), boss capstone as the gate cost, any slot may complete a packet,
50% switch discount on rows, range stays a leaf, keystones hand off to the T3 paths.

---

## 17. Non-weapon lane matrices (proposed 2026-09-30, for review with the tree in hand)

Authored in the overnight run so the trees exist to playtest; **not approved**. Lane A is
each biome's existing mechanic. Coverage rule for defensive slots: every packet completes
on at least two non-weapon lineages **across the three slots** (45 lane slots for eight
packets), not two per slot; "any slot may complete a packet" (§7) is what makes that legal.

Face per packet (§3.1), so a card's `face` is derived, not authored:
Avoid = Engagement, Tempo, Control · Sustain = Kill chain, Barrier tempo, Affliction ·
Endure = Bulwark, Empowered.

| Slot | Plains | Forest | Mountain | Cave | Swamp |
|---|---|---|---|---|---|
| armor | Bulwark, Empowered, Tempo | Engagement, Tempo, Affliction | Bulwark, Barrier tempo, Control | Bulwark, Kill chain, Engagement | Affliction, Control, Barrier tempo |
| recovery | Kill chain, Tempo, Engagement | Barrier tempo, Affliction, Engagement | Barrier tempo, Bulwark, Empowered | Bulwark, Affliction, Control | Affliction, Control, Kill chain |
| mobility | Kill chain, Tempo, Empowered | Engagement, Tempo, Affliction | Engagement, Empowered, Control | Engagement, Kill chain, Control | Control, Affliction, Bulwark |

Completion count across the three slots: Tempo 5, Empowered 4, Affliction 7, Control 7,
Kill chain 5, Engagement 7, Bulwark 6, Barrier tempo 4 = 45. Every packet ≥ 2.

Non-weapon bands have no stat row (§4): T1 is one payoff row (L4) and the gate (L6); T2
adds the amplifier. Payoff vocabulary per slot: armor fires on `evade`, `hit-taken`,
`standing`; recovery on `kill`, `guard-cast`, `pulse`, `barrier-break`; mobility on
`kill`, `first-hit`, `standing`. Capstones per the existing T2 forms of each line.

Shard sourcing gaps this exposes (open decision 3): Bulwark and Barrier tempo cards cost
shards no T1 family drops. Until Phase 4 reviews the families, the boss capstone of each
biome also drops **two shards of its lineage's Lane A packet** on every kill, so a Mountain
player can buy Bulwark cards from Behemoth kills. Provisional; remove when a family covers it.

---

## 18. Decisions from the overnight report (2026-10-01)

Answers to the report's open design questions. Locked unless marked otherwise.

1. **Card debuffs never compose with a class mechanic's debuff of the same kind.**
   Multiplier-type payoffs (`vulnerability`, `plating-shred`) share the class record and
   obey "never lower the multiplier, never shorten the duration, never reduce the stack
   count": the stronger source wins and the longer window stands. This is the same max-
   wins rule `activateRecovery` uses, and it keeps the bible's single multiplicative layer
   (§7) where it is. Stacking a card on top of a finisher is not a second layer.
   DoT-type payoffs (`hemorrhage`, `poison-stack`) get their **own ids** (`lineage.*`) and
   ordinary per-stack refresh semantics through the DoT inventory, which already sums
   sources. The ratchet (a chip hit maintaining a finisher's bleed forever) goes.
2. **One lane colour, owned by `packetDefinition().color`.** Combat FX read it; the
   brief's palette is retired.
3. **Magnitudes are normalised by trigger rate.** The table gains a per-trigger expected
   fires-per-pull column (`hit-nth` at n, `first-hit` once, `kill` per body, `standing`
   and `pulse` by their cadence), and a payoff's resolved magnitude is divided by it, so
   `PACKET_BUDGET` compares per-pull value and starts at parity for real. The bench
   metric in §9 changes to match: **uplift over the lineage's own lane-less control on
   the lane's favoured node**, since the ±10%-of-median band compares rows measured on
   different nodes and cannot be read.
4. **`standing`, `pulse`, contagion reach, bleed tick, cleanse counts, engagement idle**
   get authored homes as units in the magnitude table. No constants in the runtime.
5. **Weapon reachability: author the T3 and T4 forms now**, from the existing
   `evolvesFrom` graph, one capstone each, with empty bands above T2 until Phase 5. No
   interim evolve exception.
6. **Boss shard stopgap price:** the boss pays **four** shards of the lineage's Lane A
   packet plus the capstone, so a boss-only lane buys a payoff card in two kills.
   Provisional until every biome fields three T1 families.
7. **`drops` stays the definition of "favours".** Plains Herd measurably rewarding Tempo
   is the mobs not yet expressing the family's shape, which is the monster pass in
   Phase 4, not a reason for a second field.
8. **The T1 map needs a third mob per biome.** Designer's authoring. Candidates, each the
   biome's T2 member of the missing family pulled down with T1 numbers: Plains
   `savanna-hawk` (Sky), Forest `canopy-sprite` (Canopy), Mountain `granite-titan` (Crag,
   as a slow anchor), Cave `giant-spider` (Brood), Swamp `bog-witch` (Coven) and
   `mire-stalker` (Stalker).
   *Shipped 2026-10-01* as `grass-kite`, `bramble-pod`, `rockback-ram`,
   `brood-spiderling`, `fen-hexer`, plus Mud Toad re-familied Mire → Stalker. All 27
   authored T1 blends now resolve exactly as authored, and Engagement's shards are
   earned rather than credited in-harness.

9. **The bench criterion is ±3 PERCENTAGE POINTS, and the encounter check is ordinal.**
   Replaces §9's "±10% of the tier median", which was unreadable twice over: it is a
   proportion OF a number that is itself small, so the band narrows as lanes weaken
   (at a +4.3% median it reads +3.9% to +4.7%, tighter than the measurement noise),
   and no lane could ever sit inside it by construction. The band is now the median
   uplift ±3pp, absolute.

   The encounter check drops "~30%" for a ranking: **does the favoured lane out-uplift
   the punished lane on that family's own node, and by what margin?** The margin is
   reported, never thresholded. A family whose favoured lane ranks BELOW its punished
   lane is a monster-shape finding for Phase 4 (§18.7 — `drops` stays the definition of
   "favours", so the mobs are what must move), not a magnitude to tune.

10. **The frames column is its own task.** Light / Balanced / Heavy uplift per root is
    not a column the lane matrix can grow: `LINEAGE_LANE_REFERENCES` does not vary frame,
    so it needs three new reference profiles per root (18 rows in
    `bot/src/tierEntry/profiles.ts`) and roughly triples a 35-minute run. Deliberately
    deferred out of the 2026-10-01 day run rather than approximated.

---

## 19. Ability nodes keyed to packets (locked 2026-10-01, promoted from future-plans)

A generic tree keyed to packets, not per-class trees. One node per tier per ability, three
options each, the same row shape as lineage cards. **Shipping now: the T1 packet node and
the T2 amplifier node** for all 22 abilities, data-only: a node means "this ability also
fires the chosen packet's payoff at a share when it lands (Technique) or casts (Guard)",
resolved through the lineage payoff runtime; the amplifier applies an axis. Techniques
offer three of the six offensive packets fitted to the ability; Guards offer the three
defensive faces, so defence never scales with offence. Keystone and cross rows for
abilities come after the T3 class review. Runes decide *when* an ability fires; nodes
decide *what* it does. Unlock on the ability's home tier band with Global Mastery, like
lineage rows; cost essence plus the packet's shard.

## 20. Player pool raise (locked 2026-10-01)

Phase 0 call four is executed as `PLAYER_POOL_FACTOR_BY_TIER` on base max HP and armor
max HP, seeded 1.25 / 1.30 / 1.35 / 1.40 for T1 to T4, benched at three factors per tier
against bosses (time-to-death versus kill time per lane) and committed **provisional** at
the bench's pick so the playtest includes it. The recovery reference pools do not scale
with it; that separation is the point of §15.

## 21. Band gating by door biome (locked 2026-10-01)

A lineage band of tier N resolves its biome-level requirement against the biome of the
form worn at that tier. T1 and T2 are unchanged in practice; T3 and T4 become reachable
on every lineage because their forms come from biomes that are alive at those tiers. The
Global Mastery band keeps its meaning (§4). Switching between two owned forms of one tier
from different biomes re-resolves the band against the worn one.

"Unchanged in practice" is exact about what does and does not move. A row's unlock is a
position *within* its tier's six levels, and that position is a property of the row, never
of the door: the T2 stat row is the second level of the tier whether the tier is spent in
the Plains (level 8 of 12) or the Desert (level 2 of 6). The door decides **where** the
levels are earned; it never decides how far in. So the number on a card changes for a door
whose biome debuts above T1 — because that biome counts its own levels from 1 — while the
amount of play behind it does not. The gate at the bottom of a band reads in the biome of
the form it opens, the same way, which has one consequence worth stating: a door into a
biome that debuts at the *new* tier (Jungle at T2, Tundra at T3, Graveyard at T4) has no
level requirement to speak of, because that biome has no content at the tier below. The
boss capstone is the whole gate there, which is §5's intent anyway.

## 22. Ability pass and the Technique packet (decided 2026-10-01; Technique pulled into run 4, the pass after the playtest)

**Technique becomes the ninth packet.** It wants technique cooldown reduction and technique
power (the stat the Plains Broadsword and the Desert staff/cross line already carry), fires
on a new trigger kind `technique-cast`, and pays with a cooldown refund or a window that
empowers the next Technique. Its keystone: a landed Technique counts as the class mechanic
firing. The Broadsword's lanes become Kill chain, Empowered, Technique; the Desert forms
crown Technique. Adding it touches shards, families, coverage and the bench, which the packet union
enumerates at typecheck; it ships in run 4 (W1-G) so the playtest sees the real wallet.
Plains Swarm drops Technique (area and control Techniques beat many weak bodies); Tempo
keeps Forest Pack and Mountain Hopper.

**The ability pass** (design session with the designer, then one run), paired with the T3
class path review since both use the packet tags:

1. **Roster audit against the lanes.** Abilities that are now a lane's payoff are cut or
   merged: Expose Weakness (Empowered vulnerability), Hamstring (Control slow), Power
   Strike / Quick Strike / Frenzy (damage multipliers at three cadences, which frames and
   the Tempo and Empowered lanes now own). Shapes stay: Slam, Sweep, Snipe, Charge,
   Disengage, Stunning Strike, Binding Strike, Detonate, Contagion, Imbue; and the Guards,
   which are the three faces.
2. **Offers reauthored** per surviving ability: three packet offers are its routes (Slam
   with Empowered, Control or Technique is three builds).
3. **One bespoke keystone per surviving ability** (about a dozen): the flashy verb, the
   answer to "no ability feels great to use". Cross rows follow the same cross scalar.
4. **Runes stay the when; nodes stay the what.** Not reopened.
5. **T3 class paths**: Pyromancer and Warmonger re-homed; every path's provisional packet
   tag confirmed or moved; a path that duplicates a lane keystone is redesigned.
