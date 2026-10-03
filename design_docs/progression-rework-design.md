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
| Technique | technique power, technique CDR | a Technique lands | cooldown refund, a window empowering the next Technique | fights shorter than a cooldown |

Weapons draw from the seven offensive packets (the first six plus Technique, §22);
Bulwark and Barrier tempo are defensive-only. Armor, charm, and boots draw from all of
them but express offensive packets through their **defensive face** (§3.1). Coverage rule
(§9): every packet must appear on at least two lineages per slot per tier.

*Technique shipped in run 4 at one weapon lineage and no non-weapon one, with a
self-cleaning exemption in `coverage.test.ts`; the ability pass (§22) closes both.*

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
| Plains Broadsword | **Technique** | Kill chain | Empowered | technique CDR/power made a lane (§22), swarm biome, generalist floor |
| Forest Rapier | Tempo | Affliction | Engagement | 1.50 aps, Jungle on-hit successor, duelist |
| Mountain Hammer | Empowered | Control | Engagement | empowered-mult bonus, stagger fantasy, approach boots |
| Cave Axe | Tempo | Kill chain | Empowered | dead-swing chaos, 1.10 aps, premium biome |
| Swamp Dagger | Affliction | Control | Kill chain | reservoir DoT, chill/slow, contagion on kill |

Coverage at T1 after §22: Tempo 2 (Rapier, Axe), Empowered 3, Kill chain 3, Affliction 2,
Control 2, Engagement 2, Technique 1 (Broadsword). Every packet but Technique on at least
two lineages; Technique's second carrier is the ability pass's.

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
- **Keystone** — changes a rule. **Amended 2026-10-01: one keystone per packet — eight,
  then nine once §22 added Technique — shared by every lineage that carries the lane in
  any slot** (not one per lane per slot). Tempo *Chain*: the echo keeps re-triggering until a miss or no fresh target.
  Empowered *Shockwave*: the mechanic's hit becomes an area hit. Affliction *Festering*:
  stacks do not expire while you keep hitting. Control *Ladder*: slow, then root, then stun
  on hit, once per step per target. Kill chain *Refund*: a kill readies the mechanic.
  Engagement *Always First*: every new target's first hit counts as the mechanic firing.
  Bulwark *Immovable*: stationary DR and plating stacks persist 2 s after moving; no
  displacement. Barrier tempo *Unbroken*: the barrier keeps recharging through hits above
  half HP. Technique *Signature* (§22): a landed Technique counts as the class mechanic
  firing. These are the "this changes how my character plays" moments. The T3 class paths
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

**Trigger kinds** (≤12): `hit-nth`, `mechanic-fired`, `first-hit`, `kill`, `evade`,
`hit-taken`, `guard-cast`, `standing`, `pulse`, `barrier-break`, `technique-cast`
(added 2026-10-01 with §22's Technique packet; fired from the one Technique resolution
seam, never from a Guard).

`mechanic-fired` is the one seam that does not exist yet: a class-agnostic "your mechanic
fired" event covering finisher, execution, full stacks, reload, energy burst, and a
summon command. The `empoweredMultiplier` metadata and `hasEmpoweredAttack` marker are
most of the way there.

**Payoff kinds** (≤18): `vulnerability`, `plating-shred`, `echo-hit`, `hemorrhage`,
`poison-stack`, `slow`, `stun`, `damage-window`, `speed-window`, `recovery-window`,
`ward`, `cleanse`, `plating-stack`, `engagement-dr`, `contagion`, `evasion-window`
(added 2026-10-01 so the avoid face has a real effect), `technique-refund`,
`technique-window` (added 2026-10-01 with §22's Technique packet).

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

**Key materials are shards, keyed by packet, not by biome.** One shard per packet for the
whole game — nine since §22 added Technique (Tempo shard, Empowered shard, …). Each family drops the shard of the packet it
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
  screen at T1: five essences, the nine shards, the capstones you have touched.
- Coverage: every packet has ≥2 families across biomes per tier, so no shard has a single
  source.

### 12.1 T1 families

Plains and Forest are **locked** (first slice). Mountain, Cave and Swamp are **proposed**
and reviewed before Phase 4.

| Biome | Family | Existing mobs | Drops (shard) | Punishes |
|---|---|---|---|---|
| Plains | Herd | boar, stampede-bull | Empowered | Tempo |
| Plains | Swarm | plains-slime, prairie-wolf | **Technique** (§22) | Empowered |
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

Shard sources at T1 with the whole table (after §22 moved the Swarm): Tempo 2, Empowered 4,
Affliction 3, Control 2, Kill chain 2, Technique 1, Engagement 1 (Plains Sky only, so
Engagement needs a second T1 source when Mountain is reviewed; Ridge is the candidate).
Technique's second source is the Plains boss, via §18.6's Lane-A stopgap, which run 4
widened to cover weapon lineages for exactly that reason. Bulwark and Barrier tempo have no T1
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
   `docs/briefs/frame-loops-2026-10-01.md`; the one row still open inside it, the Consort
   (balanced Conduit) loop, was closed later the same day (amendment 13). The T3 class
   paths it displaces (Pyromancer, Warmonger) are reviewed as a
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

## 22. Ability pass and the Technique packet (Technique shipped 2026-10-01 in run 4; the pass designed 2026-10-02)

*The Technique packet SHIPPED 2026-10-01 (run 4, W1-G); see the progress note in
`docs/archive/progression-rework-plan.md`. The ability pass below was designed with the
designer on 2026-10-02; every table is theirs. Run brief:
`docs/briefs/ability-pass-run-2026-10-02.md`. The run starts only after the T1 boss pass
(`docs/briefs/t1-boss-pass-2026-10-02.md`) has merged into `feat/lineage-data-model`.*

**Technique is the ninth packet.** It wants technique cooldown reduction and technique
power (the stat the Plains Broadsword and the Desert staff/cross line already carry), fires
on the trigger kind `technique-cast`, and pays with a cooldown refund or a window that
empowers the next Technique. Its keystone, *Signature*: a landed Technique counts as the
class mechanic firing. The Broadsword's lanes are Technique, Kill chain, Empowered; the
Desert forms crown Technique; Plains Swarm drops the Technique shard (area and control
Techniques beat many weak bodies); Tempo keeps Forest Pack and Mountain Hopper.

### 22.1 Principles of the pass (locked 2026-10-02)

- **An ability that is a lane's payoff is cut.** The lane fires it on the lane's trigger
  for whoever carries the lane; the roster keeps *shapes* (a cleave, a cast, a rush, a
  spread, a root, a detonation, a reposition, a long shot, a stun, a charge window) and the
  three Guard faces.
- **Nodes stay generic; keystones are the exception.** Packet and amplifier rows remain
  data over the closed vocabulary (§19). The keystone row is bespoke per ability, exactly
  as the lane keystone row is bespoke per packet (§4): a named server module that changes
  a rule, never a number. The cross row borrows one of the ability's other two offers at
  `ROW_SCALAR.cross`, derived, no authoring.
- **Row tiers: home tier + N** (clamp removed in §22.10; T5–T8 rows sketched in §22.11). Packet at the ability's home tier,
  amplifier +1, keystone +2, cross +3. A T1 ability reads 1/2/3/4; a T2 one 2/3/4/4; a T3
  one 3/4/4/4; a T4 ability's four rows spread across the T4 band, as §4 already spreads a
  lineage's T3/T4 bands. One rule, no new resolver logic.
- **Runes stay the when; nodes stay the what.** Not reopened.
- **Cast time is an axis** (§22.9): a cast iff the ability deals its own damage; cast speed
  is the Technique lane's stat and an amplifier axis; a cast is never removed or added.
- **Defence never scales with offence.** A Guard keystone may grant immunity, control the
  attacker, or share a mend; it never deals damage.
- **Net reference-wiring DPS at T1 moves by at most ±5%** (per class, per T1 boss, the
  lab's `dps` column, same seeds), because the T1 boss pass is tuned against today's
  tutorial kit. The one T1 change that touches DPS is the Expose Weakness cut, and Slam at
  T1 is authored to hold parity (§22.2).

### 22.2 Roster audit (locked 2026-10-02)

Fifteen Techniques and seven Guards in; ten Techniques and seven Guards out of the audit, then two additions and one more re-home in §22.8 (final roster 19).

| Ability | Was | Verdict | Who owns the job now |
|---|---|---|---|
| Sweep | T1 Plains 2, armed cleave | **keep** | — |
| Expose Weakness | T1 Cave 3, armed vulnerability | **cut** | Empowered lane `vulnerability` payoff; Snipe/Charge/Binding Strike/Detonate/Imbue offer it on any build |
| Power Strike | T1 Mountain 5, cast 3× | **merge into Slam** | Slam re-homes to T1 Mountain 5 as the burst cast; rank I is the single-target-leaning rank |
| Second Wind | T1 Forest 3 | keep | — |
| Cleanse | T1 Swamp 3 | keep | — |
| Brace | T1 Mountain 3 | keep | — |
| Hamstring | T2 Jungle 3, armed slow | **cut** | Control lane `slow` payoff; the melee at-bay slow on Mid range nodes (frame brief §2) |
| Charge | T2 Desert 3, rush | **keep, re-home to T1 Cave 3** | — |
| Contagion | T2 Swamp 9, cast spread | keep | — |
| Slam | T2 Mountain 9, cast area | **keep, re-home to T1 Mountain 5** (absorbs Power Strike) | — |
| Bramble Guard | T2 Jungle 5 | keep | — |
| Endure | T2 Desert 5 | keep | — |
| Binding Strike | T3 Tundra 3, armed root | **keep, re-home to T2 Jungle 3** (Hamstring's slot; root is the T2 control) | — |
| Frenzy | T3 Volcanic 3, instant attack speed | **cut** | Tempo and Kill chain `speed-window` payoffs; the light frames' windows |
| Quick Strike | T3 Volcanic 5, armed 1.25× every 3 s | **cut** | Tempo lane per-hit payoffs; frames |
| Detonate | T3 Swamp 17 | keep | — |
| Break Free | T3 Tundra 5 | keep | — |
| Disengage | T4 Trench 3 | keep | — |
| Snipe | T4 Graveyard 3 | **keep, re-home to T2 Desert 3** (§22.8: the ranged opener) | — |
| Stunning Strike | T4 Graveyard 5 | keep | — |
| Imbue Lightning | T4 Jungle 15, self-cast charge window | **keep, re-home to T3 Volcanic 3** | — |
| Recuperate | T4 Trench 5 | keep | — |

Roster after the audit alone (superseded by the final roster in §22.8), by home tier: **T1** Sweep (Plains 2), Charge (Cave 3), Slam
(Mountain 5); Second Wind, Cleanse, Brace. **T2** Binding Strike (Jungle 3), Contagion
(Swamp 9); Bramble Guard, Endure. **T3** Imbue Lightning (Volcanic 3), Detonate (Swamp 17);
Break Free. **T4** Disengage (Trench 3), Snipe (Graveyard 3), Stunning Strike (Graveyard 5);
Recuperate. Techniques 3/2/2/3, Guards 3/2/1/1.

A re-homed ability gains one authored rank at its new home tier (ranks are authored per
tier from the home tier; `abilities-current-state.md`, "AUTHORED, not scaled"); its recipe
moves to the new biome and level; the mid-band placement rule (level 3 and 5 of the
biome's own band) holds.

**The Expose Weakness cut and the T1 kit.** The tutorial boss kit wears Expose Weakness in
Forest, Mountain, Swamp and Cave (`plans.ts`), and the T1 boss pass is tuned against it;
its uptime-weighted value is roughly +5% single-target DPS. The kit swaps Expose
Weakness → Slam, and **Slam rank I is authored so the lab's per-class DPS on every T1
boss stays within ±5% of today's kit** (same seeds; the lab's `ap` override is the
instrument, the committed rank the result). The Cave tutorial beat teaches Charge in
Expose Weakness's place.

### 22.3 Packet offers (locked 2026-10-02)

The shipped tables (`shared/src/data/abilityNodes/offers.ts`) already express each
survivor's three routes and stay as they are (three more revisions in §22.10), with one swap: **Stunning Strike offers
Control / Tempo / Technique** (its Empowered plating-shred becomes Tempo echo-hit: a
stunned target eats a second hit), so that after the cuts every offensive packet sits on at
least three Techniques. Coverage across the ten Techniques: Tempo 3 (Sweep, Stunning
Strike, Imbue), Empowered 6, Affliction 4, Control 5, Kill chain 3, Engagement 3,
Technique 6, before the §22.8 additions (final coverage there). Guards are unchanged: one avoid, one sustain, one endure face each; Sidestep (§22.8) follows the same rule.

### 22.4 Ability keystones (locked 2026-10-02): the flashy verb

One per surviving ability, bespoke, on the keystone row (§22.10 makes the alternates a second row, Keystone II, and adds a delivery body to each). The alternates the designer did
not pick are recorded in the run brief for the next pass, not here.

| Ability | Keystone | Rule |
|---|---|---|
| Sweep | **Whirlwind** | Sweep becomes a one-second spin that cleaves every tick. |
| Slam | **Aftershock** | The ground erupts again at the same spot one second later. |
| Charge | **Trample** | The rush hits every body it passes through. |
| Contagion | **Outbreak** | A body Contagion infected passes its afflictions to its nearest neighbour when it dies. |
| Binding Strike | **Dragnet** | The root takes every body adjacent to the target. |
| Detonate | **Chain Reaction** | A Detonate kill detonates every afflicted body in reach. |
| Disengage | **Vanish** | Breaking contact drops you from every nearby monster's aggro until your next hit. |
| Snipe | **Pierce** | The shot passes through its target and hits everything in line behind it. |
| Stunning Strike | **Relay** | When the stun ends it jumps to the nearest body not yet stunned this fight. |
| Imbue Lightning | **Fork** | Every imbued hit arcs to the nearest other body. |
| Second Wind | **Shared Breath** | The mend also runs on your summons and same-node party. |
| Cleanse | **Immunity** | The affliction kind you stripped cannot be reapplied for a few seconds. |
| Brace | **Riposte** | A melee hit absorbed while Braced staggers the attacker. |
| Bramble Guard | **Entangle** | A body that hits you while brambled is slowed. |
| Endure | **Unyielding** | You cannot be hard-controlled while Endure is up. |
| Break Free | **Backlash** | Breaking free staggers every adjacent body. |
| Recuperate | **Overflow** | Healing past full becomes a ward. |
| Sidestep (§22.8) | **Afterimage** | A hit you dodge during the window leaves an afterimage the attacker keeps swinging at until it is struck. |
| Cull (§22.8) | **Harvest** | A Cull kill lands the same strike on the nearest body below the same health share, and keeps going while it keeps killing. |

Every rule reuses an existing seam: `applyPlayerAoe` (Whirlwind, Aftershock, Trample,
Pierce, Fork, Chain Reaction), the control ladder at its shortest rung for stagger
(Riposte, Backlash) and `monsterControl` for slows and roots (Entangle, Dragnet),
`setAggroTarget` (Vanish), the player hard-control list (Unyielding) and the cleanse and
affliction inventories (Immunity, Outbreak), the overheal ward (Overflow), the Recovery
engine's party and summon sources (Shared Breath). Durations and shares come from the
magnitude table at `ROW_SCALAR.keystone`; a keystone with no number (Vanish, Unyielding,
Immunity's kind lock) authors a payoff only because `coverage.test.ts` requires every
non-stat row to do something when bought, as the lane keystones already do. Names are
placeholders the designer may rename; the rules are locked.

### 22.5 T3 class path review (locked 2026-10-02)

Every path's provisional packet tag (run 3 W1-B) was read against the frame loops (frame
brief §1), the nine lane keystones and §22.4. Five paths are redesigned, one retagged, the
rest confirmed.

| Path | Was | Duplicates | Becomes |
|---|---|---|---|
| Reverb (Squire balanced-a) | attacks bank into the next execution | the Squire heavy frame's bank | **Empowered.** The execution echoes: it lands now and lands again at half strength when its cooldown reaches the halfway mark, on whatever you are hitting then. No bank, no window: a second beat on the clock. |
| Destroyer (Squire heavy-b) | normals deal no damage; execution on 5 s; first strike on a new target is an execution | Engagement keystone *Always First* | **Technique** (the lane had no path). Your execution is delivered by your Techniques: when ready it waits, primed, and the next Technique you land fires it with that Technique's shape (a Slam execution hits the area, a Snipe execution lands from range) at a higher multiplier. Regular hits deal normal damage. Distinct from *Signature* (a Technique counts as the mechanic); here the mechanic rides the Technique. |
| Duelist (Slinger light-a) | last bullet empowered with splash | the Marksman frame's end-of-clip; *Shockwave* | **Kill chain** (the lane had one path). Every kill adds a round above the clip's size until the next reload; a long chain is a long clip and the ammo counter climbs past max. Distinct from *Refund*, which readies the mechanic. |
| Warmonger (Slinger heavy-b) | attack speed ramps per shot, resets on reload | the Artillerist frame's ramp | **Tempo.** As agreed in the frame brief: half the ramp carries through a reload (a per-clip climb becomes a sustained one); the barrel glow persists while reloading. |
| Pyromancer (Apprentice balanced-a) | 2 stacks per hit at 55%; bonus direct damage at max burn | the Ember Mage frame's "intensifies" | **Affliction.** Keeps two stacks per hit at 55%. New payoff *Radiant*: burn ticks on a target at max stacks also strike every adjacent body for the tick. Fire radiates; no stacks spread, no direct bonus. |
| Justicar (Striker balanced-c) | Verdict execute, tagged Affliction | — | **Retag Empowered.** No effect change. |

Confirmed as compatible, with the reasoning the run must keep in the path comments:
Venomslinger, Winter Warden and Iconoclast per the frame brief; Scrapper pays Empowered
*payoffs* (vulnerability, plating shred) on the finisher, not the keystone; Marshal's
opening strike is an Engagement payoff, not *Always First*; Cultist's unlimited stacks are
not *Festering* (which is non-expiry while hitting); Shockblade and Swiftblade are echo
hits on the finisher, not *Chain*.

Lane coverage across the 54 paths after the review: Empowered 24 (Justicar in, Destroyer
out), Tempo 17, Affliction 11, Engagement 2, Control 2, Kill chain 2, Technique 1. The
remaining lopsidedness is recorded, not fixed: the next class review decides whether
Control and Engagement need paths of their own.

### 22.6 What the run does not touch

Magnitudes (`magnitudes.ts`, `ABILITY_NODE_SHARE`), except the one Slam rank I number
the parity rule produces. Lineage cards. Monster rows. Recovery. The tutorial beyond the
kit table and the Cave recipe line. T2+ boss numbers. The alternates the designer passed
over.

### 22.7 Flavor progression (locked 2026-10-02)

An ability's rows change what it does; without this section the ability would still be
called Sweep, wear the same icon and play the same swing until its keystone, and the
player would read the tree as different numbers with verbs attached. The designer's
principle: **as an ability deepens, its identity deepens**, in name, icon and animation,
so progression is visibly not a bigger number. This is §8's visual rule applied to the
ability's identity rather than to the fight.

- **Naming grows with the row** (grammar finalised in §22.10: payoff adjective, "of X", noun, "with Y"). The packet row prefixes the lane's own word: Bleeding
  Sweep, Echoing Sweep, Drilled Sweep (the nine lane words come from the packet
  definitions, so the prefix is derived, not authored per ability). The amplifier adds a
  second qualifier from its axis. The keystone **renames the ability outright**: the hotbar
  and the tooltip read *Whirlwind*, with "Sweep" as the lineage line beneath it. The cross
  row earns the compound name, which is where *Bleeding Whirlwind* appears. Rank numerals
  (Sweep III) stay, after the name.
- **Icons compose programmatically.** The base glyph is the one hand-made asset. The
  packet row adds the lane's colour as a tint or frame (the lane colours already exist,
  rose-magenta for Technique and so on); the amplifier adds a small overlay glyph for its
  axis; the keystone adds a border treatment and, where the keystone's silhouette differs
  from the base (a spin, a line, a fork), a second glyph layered over the base. Composited
  at runtime in the HUD from the existing atlases: no hand art per node, no PixelLab
  spend, and every step is visible on the bar.
- **Animation deepens rather than adds.** The packet row draws the lane's existing fx on
  top of the ability's own cast or swing (the node fx table already keys this). The
  amplifier scales or extends what the packet drew: a longer trail, a second echo. The
  keystone owns a bespoke animation, the one that reads from across the screen, in the
  premium grammar the boss and mob passes set: a readable wind-up, a visible payoff, a
  lasting mark where the rule leaves one (Aftershock's cracked ground, Vanish's fading
  outline).
- **Guards use the three faces as their colour language.** Avoid is a blur, Sustain a
  pulse or a shell, Endure chips, exactly as the node fx table keys them; the Guard's
  keystone animation is the face's grammar at full size (Riposte's stagger flash, Shared
  Breath's pulse running down the formation).

Rules that keep it cheap: the name, tint, overlay and border are all **derived from the
row and the lane**, so a new ability or a renamed keystone needs no new copy table and no
new art; only the keystone's second glyph and its animation are authored, one per
keystone, by the same pass that authors the keystone's rule. Numbers never appear in a
name.
### 22.8 Additions and the Snipe re-home (locked 2026-10-02)

Reading the roster by job rather than by tier found two holes, and one the roster already
answered in the wrong place.

- **Sidestep** (Guard, instant, **T1 Forest 5**): an evasion window plus a short burst of
  move speed. The Avoid face had no Guard of its own (Second Wind and Recuperate are
  Sustain; Brace, Endure and Bramble Guard are Endure; Cleanse and Break Free are removal),
  so a Light-frame player had none. It is not Disengage: Disengage moves you out of
  contact, Sidestep stays put and dodges. The `evasion-window` payoff from run 4 is its
  primitive. Offers: Engagement `evasion-window` / Kill chain `recovery-window` / Bulwark
  `plating-stack`. Keystone **Afterimage**: a hit you dodge during the window leaves an
  afterimage the attacker keeps swinging at until it is struck (the monster's target is a
  decoy marker; no damage, no displacement).
- **Cull** (Technique, cast, **T3 Tundra 3**, the slot Binding Strike vacates): a strike
  that hits harder the lower the target's health and refunds itself on a kill. No ability
  was kill-shaped although Kill chain is a lane on three lineages. Offers: Kill chain
  `speed-window` / Empowered `vulnerability` / Technique `technique-refund`. Keystone
  **Harvest**: a Cull kill lands the same strike on the nearest body below the same health
  share and keeps going while it keeps killing (each body once; the chain is the visible
  verb). Harvest and Chain Reaction are the two kill-chaining keystones and must stay
  distinct: Chain Reaction spends afflictions, Harvest spends health.
- **Snipe re-homes to T2 Desert 3** (Charge's old slot). Snipe is the ranged opener, and
  at T4 Graveyard a ranged build had no opener until the last tier while melee had Charge
  at T1. Its +300 reach, hold-position and Pierce keystone are unchanged; it gains an
  authored rank at T2. Graveyard keeps Stunning Strike at 5.

Roster after the additions: **19** (11 Techniques, 8 Guards). By home tier: **T1** Sweep,
Charge, Slam; Second Wind, Cleanse, Brace, Sidestep. **T2** Binding Strike, Contagion,
Snipe; Bramble Guard, Endure. **T3** Imbue Lightning, Detonate, Cull; Break Free. **T4**
Disengage, Stunning Strike; Recuperate. Techniques 3/3/3/2, Guards 4/2/1/1. Offer
coverage across the eleven Techniques: Tempo 3, Empowered 7, Affliction 4, Control 5,
Kill chain 4, Engagement 4, Technique 7. Neither addition enters the T1 tutorial kit, so
the T1 DPS budget is untouched; Sidestep is a Guard and Cull is T3.

### 22.9 Cast time is an axis, not flavor (locked 2026-10-02)

Casts used to be assigned by feel: flavor, or "strong things wind up". The rule now:

- **An ability has a cast time if and only if it deals its own damage.** A cast is a hit
  the ability lands by itself, scaled by Technique Power; the wind-up is the price of that
  magnitude. An armed ability is a rider on the next weapon hit: it waits for a swing
  instead of winding up, and it scales with the weapon. The fork is the build choice:
  weapon builds want armed, Technique builds want casts and the stats that shorten them.
  Charge is its own shape (a wind-up that becomes movement); Guards are instant.
- Sorted by the rule: Slam, Snipe, Stunning Strike, Detonate and Cull keep their casts;
  Sweep and Binding Strike stay armed. Two were arbitrary and are reshaped: **Contagion
  becomes armed** (your next hit spreads what the target carries; it deals no damage of
  its own) and **Imbue Lightning becomes instant** (a self-buff needs no telegraph; the
  shape Frenzy had). Neither touches T1 DPS.
- **Cast speed is the Technique lane's stat.** `technique.cast-speed-pct` already exists,
  capped at 60%, carried by the Desert staff line; it is shown beside Technique Power as
  the lane's own number, so the tree says which lane makes casts fast.
- **The amplifier row gains a cast axis.** For a cast ability "shorter wind-up" is a fourth
  amplifier axis beside duration, targets and magnitude, and the louder one.
- **A cast is never removed and never added.** The 60% cap holds against every source
  combined, so a cast never collapses into a bigger armed rider; no row turns a cast
  instant, and no row gives an armed ability a wind-up (that would be a number trade
  dressed as a verb). Keystones change what the cast is (Aftershock erupts twice), not
  whether it is one.
- Frames stay out of it. A heavier frame does not lengthen casts; frames are bias, and a
  slow caster on a heavy frame is slow already.
### 22.10 Second review: rows, names, fire-shapes, delivery (decided 2026-10-02; fire-shapes LOCKED later the same day)

The designer reviewed the mockup (the "Ability Trees" artifact) and changed five things.
Where a rule below contradicts an earlier subsection, this one wins.

**Row tiers: home + N, no clamp.** Packet at home, amplifier +1, keystone +2, cross +3,
and a fifth row, **Keystone II**, at +4. Nothing is retroactive: a row unlocks on the tier
that owns it, so late abilities grow into T5–T8 and the tree needs no new rows when those
tiers ship. Until a tier exists, the rows above the current cap **fold into the cap
band** (so today's game still reaches every row of every ability) and unfold when the
tier ships; what a player bought stays bought. §22.1's "clamped at T4" is superseded.

**Keystone II is the second verb** (SUPERSEDED by §22.11: three verbs on the keystone row at home + 2, no Keystone II row). The alternates recorded in the run brief's appendix
are no longer alternates: each is its ability's second keystone, a second rename the
player chooses between, unlocking at home + 4 (T5 for a T1 ability). They are designed
now and implemented in a later wave; the run ships the first verb. Sidestep's second is
*Flow* (every hit you dodge during the window extends it; the first that lands ends it);
Cull's is *Death Sentence* (a target Cull hits but does not kill is marked; your next kill
of any body also kills the marked one if it is below the threshold).

**The amplifier is a free choice of axis.** Any axis applies to the active route: second
body, longer window, bigger payoff, or shorter wind-up on a cast (§22.9). The amplifier
is no longer tied to one route's natural axis; `nodePayoffAxis` becomes the default, not
the only option.

**Kill chain routes fire on the kill.** A Kill chain offer on a Technique fires when the
ability's hit kills, not when it lands, and pays the table's partial share: Charge,
Contagion, Disengage and Snipe refund part of their cooldown on a kill; Cull, which
refunds natively, opens its speed window on the kill instead. Never a full reset.

**Every keystone names its delivery body**: `owner`, `delivering body` (the physical
summon or formation body that landed the ability on a Conduit; the owner elsewhere), or
`formation`. This is how the class adapters survive the pass: packet and amplifier
payoffs hang off the landed event and inherit whatever body the adapter delivered through;
keystones are bespoke rules and must say. Reload treats keystone echoes as first-hit-only.
Explicit calls: Trample on a Conduit runs along the summons' rush paths; Shared Breath is
formation; Vanish, Afterimage, Riposte, Backlash and every Guard keystone are owner;
Harvest and Relay chain from whichever body made the kill or stun.

**Names by row** (amends §22.7's packet-prefix rule): each row owns a grammatical slot,
and every word is derived from the payoff or the axis, never authored per ability.

| Row | Slot | Words |
|---|---|---|
| Packet | adjective, from the payoff | Echoing, Branding, Sundering, Bleeding, Venomed, Chilling, Opening, Quickening, Drilled, Braced, Mending, Warded, Plated, Fleet |
| Amplifier | "of X", from the axis | of Many, of the Lingering, of Weight, of Haste |
| Keystone / Keystone II | the noun: the keystone's name replaces the ability's | Whirlwind, Aftershock, … |
| Cross | "with Y", from the borrowed payoff's noun | with Echoes, with Brands, with Sundering, with Bleeding, with Venom, with Chill, with Opening, with Quickening, with Drill, with Bracing, with Mending, with Ward, with Plate, with Fleetness |

*Bleeding Sweep* → *Bleeding Sweep of Many* → *Bleeding Whirlwind of Many* →
*Bleeding Whirlwind of Many, with Echoes*. The hotbar shows the noun; the tooltip the
whole name. Adverbs for the cross were tried and read badly.

**Three offers revised** to cut the sameness (the Technique refund was on six of eleven
Techniques, the brand on seven): Binding Strike's Technique refund becomes an Affliction
bleed (a rooted body bleeds); Snipe's Technique refund becomes the Kill chain on-kill
refund; Detonate's Empowered brand becomes a Control chill. Refund now on four, brand on
four.

**Fire-shape (LOCKED 2026-10-02, every line approved by the designer in four groups).** The offers
table gains one column saying *where and when* the packet payoff fires, from a closed
list. Same payoffs, same magnitudes; this is where Brace and Endure stop being the same
card.

| Ability | Fires |
|---|---|
| Sweep | on every body the cleave hits |
| Charge | on the first body the rush touches, and the target on arrival |
| Slam | on every body the Slam hits |
| Second Wind | on cast |
| Cleanse | on strip, sized by what it removed |
| Brace | per hit absorbed while Braced |
| Sidestep | per hit dodged during the window |
| Binding Strike | on the rooted body |
| Contagion | on every body the spread reaches |
| Snipe | on the shot body |
| Bramble Guard | per thorn hit |
| Endure | per tick while held |
| Imbue Lightning | on each imbued hit |
| Detonate | on the detonated body |
| Cull | on the struck body |
| Break Free | on the break |
| Disengage | on the body you broke from |
| Stunning Strike | on the stunned body |
| Recuperate | per tick of the mend |

Kill chain routes override the fire-shape with "on the kill". The closed list is: on
land / on every body hit / on each hit of a window / on the kill / on cast / per hit
absorbed / per hit dodged / per tick while active / on strip / on the break. Every entry
maps to an existing trigger seam (hit, kill, guard-cast, hit-taken, evade, pulse,
cleanse, break-free).

**Deferred, recorded here**: an amplifier that is a *variation* of the ability's shape
(an armed rider lingers two hits, a cast becomes a line or an area or a held charge,
keyed by execution shape) was weighed as the way to make T2 feel different and parked;
it overlaps the keystones (Whirlwind is "cast becomes a channel") and must be designed
with them. Lives in `docs/future-plans.md` as "ability variation row".
### 22.11 Third review: three keystones per ability, T5–T8 as amplification (decided 2026-10-02)

Supersedes §22.10's "Keystone II" paragraph. The designer wanted the fork where the
flashy choice is, not a tier later, and later tiers to deepen what was chosen rather than
open new routes.

**The keystone row holds three verbs, pick one, at home + 2.** All three are designed now
(the trios below, with §22.4's first verbs and the former alternates); the run ships the
first verb of each trio, and the second and third land in a follow-up wave into the same
row, so the choice exists from the start as silhouettes. Trample is dropped: it needed a
path-sweep primitive and sat badly on a Conduit where the summons do the rushing.

**T5–T8 rows are amplification and utility, never new routes** (sketched, not locked, so
the tree is designed with eight tiers in mind): Amplifier II at home + 4 (a second axis
on the active route), Cross II at + 5 (the third route at half), Utility at + 6 (reach,
interruptibility, cost), Keystone amplifier at + 7 (the chosen verb grows). Numbers are
acceptable there: by T5 the player has the verbs and wants them bigger. Rows above the
current cap fold into the cap band until the tier ships, as §22.10 says.

**The trios.** Delivery body in parentheses where it is not the owner.

| Ability | First (this run) | Second | Third |
|---|---|---|---|
| Sweep | Whirlwind | Reap: a Sweep kill cleaves again from the body it killed (delivering body) | Momentum: a Sweep that hits three or more bodies re-arms at once (delivering body). **Flagged by the designer as probably broken; test before shipping.** |
| Charge | Breakthrough: arriving staggers the target (delivering body) | Rebound: **if the Charge kills**, the rush continues to the next body in reach and lands there (delivering body) | Impact: arrival also hits every body adjacent to the target (delivering body) |
| Slam | Aftershock | Tremor: every body hit is staggered (delivering body) | Crater: the Slam leaves a crater that slows anything standing in it (delivering body). Designer note: a slow alone is thin unless you are slamming distant bodies as a ranged build; may gain a burn later; leave as is and test. |
| Second Wind | Shared Breath (formation) | Deep Breath: no hard control while the mend runs | Clean Breath: the mend also strips one affliction |
| Cleanse | Immunity | Purge: the stripped affliction is thrown back onto its applier | Clarity: with nothing to strip, Cleanse raises a small ward instead of holding its cooldown |
| Brace | Riposte | Set: Brace also roots you and doubles its footing | Shield Wall: summons and same-node party behind you share the reduction (formation) |
| Sidestep | Afterimage | Flow: every hit dodged during the window extends it; the first that lands ends it | Grace: each dodge in the window also shakes off a slow or root on you |
| Binding Strike | Dragnet (delivering body) | Impale: a rooted target cannot attack you while you stand at max reach | Trapper: stays armed for two hits, rooting two bodies in a row (delivering body) |
| Contagion | Outbreak (delivering body) | Carrier: afflicted bodies infect what touches them (delivering body) | Plague Wind: spreads from every afflicted body in reach, not only the one you hit (delivering body) |
| Snipe | Pierce (delivering body) | Mark: the sniped body takes your next Technique as if from max reach | Overwatch: while you hold for the wind-up you cannot be interrupted, and the shot cannot be dodged |
| Bramble Guard | Entangle | Thicket: thorns also hit every body adjacent to the attacker | Deep Roots: holds as long as you stand still, drops when you move |
| Endure | Unyielding | Second Skin: the shell persists at half while you keep taking hits | Ironhide: nothing staggers or displaces you while it is up |
| Imbue Lightning | Fork (delivering body) | Static: an imbued hit that kills refunds its charge | Thunderclap: the last charge discharges in an area around the target (delivering body) |
| Detonate | Chain Reaction (delivering body) | Fuse: the detonation lands a second later, doubled on a body still afflicted (delivering body) | Smoulder: half the afflictions survive the detonation (delivering body) |
| Cull | Harvest (delivering body) | Death Sentence: a body Cull hits but does not kill is marked; your next kill of any body also kills it if below the threshold | Executioner's Eye: Cull targets the lowest-health body in reach, not the one you are fighting |
| Break Free | Backlash | Slip: untargetable for a moment after breaking free | Turn the Tables: the body that held you is rooted for as long as it held you |
| Disengage | Vanish | Parting Shot: also arms your next hit as an opening strike | Caltrops: the spot you left slows any body that crosses it |
| Stunning Strike | Relay (delivering body) | Concussion: an area stun, shorter (delivering body) | Long Night: the stun holds until the body is hit again, instead of a timer (delivering body). Watch for power. |
| Recuperate | Overflow | Battle Rest: full rate while you are hit | Steady Hand: your casts cannot be interrupted while it runs |

Terms: **stagger** is the control ladder's shortest stun rung, with post-stun immunity;
"staggers" and "stuns briefly" mean the same thing. **Ground patch** (Crater, Caltrops)
is one new shared seam: a short-lived marker at a position that pulses a status onto the
bodies inside it; two keystones use it and nothing else may until it has shipped.

**Class adapters, closed.** Packet and amplifier payoffs hang off the landed event and
inherit whichever body the adapter delivered through, with the owner's stats. Keystones
carry a delivery body. The Conduit casting its cast-shaped Techniques through a physical
summon is kept as it is (the designer likes it; it may be strong). **A node payoff on a
Conduit cast resolves once per cast, through the one physical summon, never once per
formation body**, exactly as the cast's own payload already does; a formation rider's node
payoff shares the rider's normalised budget. The armed-rider adapters that cover only
some abilities are untouched by the pass; Contagion, now armed, rides the formation rider
adapter Sweep already uses.

**Recorded, not acted on**: the party-facing variants (Shared Breath, Shield Wall) are
liked and are the seed of a party layer for later. The designer asked whether the game is
getting too complex; the answer this design gives is §4's: one question per row, the
screen never wider, and everything above T4 amplifies instead of branching. If the trios
play as too much, the row shrinks to two before it shrinks to one.

## 23. Forms are full power at the craft (locked 2026-10-02)

Run 4's boss walls had one cause: retiring the +1..+5 ladder removed every weapon's ladder
power while all monster, boss and node numbers stayed calibrated against a fully upgraded
weapon, and the stat row that was meant to replace it carries ~2% at T1 against a ladder
worth ~31% DPS. The fix (74ab24ac) folds each weapon's deleted ladder total into its base
stats, and that is now the rule:

- **A form is crafted or gated at its old +5 power.** One craft is full power. There is no
  within-tier number grind; that is the rework's thesis (§0: the drip was the problem).
- **Within a tier, growth is verbs**: payoff, amplifier, keystone, cross. The stat row stays
  modest and is the lane's cosmetic plus a small lean, not the tier's power curve.
- **The gate is the number step.** A T2 form must beat the T1 form the player arrives
  holding (Gale Needle 35 against the axe's 29), which the weapon ladder rules (floor,
  band) already encode in +5 terms. `weaponCurve.test.ts` pins both halves.
- Every absolute bench number taken at +0 weapons (lane matrix run 4, contract margins,
  T2 reference TTKs) is void; the comparisons survive because they are band-matched.

Tutorial consequences, for the tutorial pass: the guide teaches the tree on the Rapier and
then swaps every melee plan to the Chaotic Axe for the seals and the gate, so the one card
it buys is inert in every boss fight (a lineage pays only while its own form is worn); and
no tutorial character ever picks a frame, so the frame loops are untaught. Both belong to
the next tutorial beat pass, with the second-node-per-biome beat.


## 24. Course correction after the first playtest (decided 2026-10-03)

The designer played the merged rework (develop `9ccd9d3d`) on 2026-10-02. Verdict: the
structure works and the texture does not. Nothing below touches the backbone — a slot
holds a lineage, forms open at boss gates, cards are owned forever and active by choice,
the capstone is the gate's price, migration and persistence. Everything below is about
what a card feels like, where its currency comes from, and how the page explains it.

The complaints, verbatim in spirit: upgrades do not feel consequential at T1; the choices
are not cool; shards are all over the place (three currencies per node from mobs that look
alike); armour, charm and boots kept the +N ladder while weapons lost it; the tree panel is
a data-model viewer; card flavour text clutters the tiles.

### 24.1 Perceptibility is a shape rule, not a size rule

Run 2–4 balanced every card to within ±3 percentage points of its neighbours' DPS uplift.
A card balanced to be indistinguishable is, by construction, imperceptible; we rebuilt the
drip we set out to remove (§0). Two rules replace that:

- **A payoff is perceptible with the sound off, by a change in what bodies do, never by a
  damage number.** An echo is a whole second swing at full damage, not 30% folded into the
  first. A slow makes the target visibly crawl. A bleed ticks big and rarely. An evasion
  window leaves an afterimage. Event-shaped payoffs do not scale with base attack, so they
  feel the same at T1 as at T4; percent payoffs are the only kind small numbers starve.
- **Trade frequency for magnitude.** The trigger-rate normalisation keeps the expected value;
  the authored cadence moves to one firing every 4–6 s at reference attack speed (`hit-nth`
  n of 5–6 at T1), and the magnitude rises to a whole attack's worth or more.

The bench criterion (§18.9) changes job: it is a **viability floor** — no lane below 0.9×
the median uplift of its tier — and stops being a similarity target. Ordinal encounter
checks stay.

### 24.2 The T1 band is a lean and a verb

Two rows at T1. **Row 1, the lean**: a real stat move of 8–10% in the lane's stat, the
direction the player chooses; the headroom is the folded ladder (§23). **Row 2, the verb**:
one event-shaped payoff per lane, describable in one sentence, visible under 24.1. Rows
above are unchanged in kind (T2 amplifier, T3 keystone, T4 cross); an amplifier now moves
an EVENT's axis (every 6th → every 4th hit; one body → two; 2 s → 4 s), which is what
`AmplifiedAxis` already encodes.

Provisional verbs for the five T1 weapons, for the designer to edit (the existing payoff
vocabulary is reused where it fits; new kinds are marked *new*):

| Weapon (biome) | Lane | Verb | One sentence |
|---|---|---|---|
| Broadsword (Plains) | Technique | Drilled Form | Every 5th hit resets your Technique's cooldown; the ability icon flashes ready. (`technique-refund` at 100%) |
| | Kill chain | Momentum | A kill makes your next swing land twice. (`echo-hit` at 100%, `kill` trigger) |
| | Empowered | Breaker | Every 6th hit is a heavy swing that counts as your mechanic firing. (*new* `mechanic-proxy`, the Signature idea on a counter) |
| Rapier (Forest) | Tempo | Flurry | Every 6th hit strikes twice. (`echo-hit` at 100%) |
| | Affliction | Venom Point | Every 6th hit leaves a bleed worth a whole swing over 4 s. (`hemorrhage`) |
| | Engagement | Opening Lunge | Your first hit on each new target is a lunge for double damage, with an afterimage. (`first-hit` + *new* `big-hit` 2×) |
| Hammer (Mountain) | Empowered | Quake | Every 6th hit shakes the ground and hits every adjacent body for a full swing. (`echo-hit` with `targets`) |
| | Control | Stagger | Every 5th hit knocks the target down for 1.5 s. (`stun`) |
| | Engagement | Standfast | Stand still for 3 s and you plate up until you move. (`standing` + `plating-stack`) |
| Axe (Cave) | Tempo | Frenzy | Every 6th hit opens 3 s of doubled attack speed. (`speed-window` at 100%) |
| | Kill chain | Reaper | A kill heals a tenth of your pool and loads your next hit. (`heal` + `empower-next`) |
| | Empowered | Cleave | Every 6th hit splits onto a second body for full damage. (`echo-hit`, `targets` 2) |
| Dagger (Swamp) | Affliction | Fester | Every 5th hit doubles the poison on the target. (`poison-stack` burst) |
| | Control | Hamstring | Every 5th hit roots the target for 2 s. (`root`) |
| | Kill chain | Shadow Step | After a kill, your first hit on the next target is a backstab for triple. (`kill` latch + *new* `big-hit` 3×) |

Magnitudes are the designer's; the table fixes shape and cadence. Every verb needs its
own readable fx, not a tint.

### 24.3 One shard per node

The designer's proposal, adopted over §5's family-keyed drops: **every node is categorised
under its dominant family, and every kill in the node pays that family's shard**, minority
families included. Blends stay as composition and texture (the minority families still
punish differently); the drop seam reads the node, not the monster. The map and the arrival
banner name the family and the shard ("Pack territory · drops Tempo"). A player learns a
node's currency in one visit and never collects three currencies from one clearing.

Node authoring gets a brief from this: every node has a family identity, a shard, a
composition, and ideally one thing that makes it a place. That is the node variety §0 asked
for, by a different door than modifiers.

### 24.4 A biome's families are its weapon's lanes

So that "stay in the Forest to build Forest gear" is coherent without a lookup: **the three
families of a T1 biome drop exactly the three lanes of that biome's weapon.** Four moves,
`punishes` unchanged:

| Biome | Weapon lanes | Family → shard today | Change |
|---|---|---|---|
| Plains | technique / kill-chain / empowered | Herd empowered, Swarm technique, **Sky engagement** | Sky → **kill-chain** |
| Forest | tempo / affliction / engagement | Pack tempo, **Grove empowered**, Canopy affliction | Grove → **engagement** |
| Mountain | empowered / control / engagement | Crag empowered, Ridge control, **Hopper tempo** | Hopper → **engagement** |
| Cave | tempo / kill-chain / empowered | **Brood affliction**, Brute empowered, Deep kill-chain | Brood → **tempo** |
| Swamp | affliction / control / kill-chain | Mire affliction, Coven control, Stalker kill-chain | none |

T1 coverage after the moves: empowered 3, kill-chain 3, tempo 2, engagement 2, affliction
2, control 2, technique 1 (+ the Plains boss stopgap). Bulwark and Barrier-tempo have no T1
weapon lane and no T1 family, which is fine while non-weapon trees are parked (24.5). When
they return, a biome's non-weapon lineages pick their lanes from the biome's three.

### 24.5 Non-weapon slots are plain items; the ladder is retired everywhere

For the next playtest the weapon tree is the one thing made excellent. **Armour, charm and
boots trees are parked**: data kept, not reachable (no cards buyable, no page entry, no
shard cost anywhere), so nothing is deleted and the review's P4 (78 unreachable non-weapon
cards) is moot until they return. **The +N ladder and the evolve path are retired on every
slot**: a non-weapon item is crafted full power at its recipe (fold its ladder into base
per §23), and a T2 vest is a plain recipe gated by biome level, not an evolution of the
T1 vest. One rule for four slots.

### 24.6 The page, not the panel

The tree is reached by clicking the equipped weapon, and reads top to bottom:

1. the form's art and name — the thing you are growing;
2. one row per tier, each row **a choice of three cards in three lane colours, one lit**;
   "a row is a choice, a lane is a colour" is the whole mental model;
3. the gate at the bottom: boss portrait, capstone count, what it opens.

A card is **one sentence, no flavour text** (the `description` field stays authored and is
not rendered). Its number is shown as before → after on the real stat sheet for a lean,
and as the sentence for a verb. Shards appear where they drop — map and banner — and only
secondarily in a wallet. In combat, one **rhythm readout** near the HP bar, shared with the
frame loop's window/bank, shows a filling ring per active triggered card (at most three)
that flashes when the payoff is ready. Not buff tiles.

Mockup first, in the browser, like the original tree mockup; the run implements the
approved mockup.

### 24.7 Unchanged

Runtime and persistence; gates and capstones; the keystones at T3 and the cross at T4;
ability nodes (data-only) and the Technique packet; the families' `punishes` table and the
monster pass; the T1 boss pass; flat Recovery; the ability pass design (§22), which now
inherits 24.1's shape rule for its bespoke keystones.

### 24.8 Order

Mockup → the designer approves → one run (data, runtime seam, page, readout, bench floor,
tutorial kit) → second playtest. The ability run (§22) follows the second playtest.
