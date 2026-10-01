# Monster stat proposals — from the run-3 lane bench (2026-10-01)

> **NOTHING HERE IS APPLIED.** The designer owns monster numbers. This file is a
> proposal table and the evidence for it, produced by W2-A step 4; the branch it
> sits on changes no monster stat, no ability rank and no magnitude. Every
> `from → to` below is a suggestion with its reasoning attached, to be accepted,
> altered or refused one row at a time.

Evidence: two runs of `server/bench/lineageLaneMatrix.ts`.

- **`lane-matrix-run3.md`** — 20 lane references x 60 distinct T1+T2 blends x 2 seeds,
  90 s of sim per cell per seed; 2832 runs, 44.7 min.
- **`lane-matrix-run3-slow.md`** — the same 20 references over the **nine decisive
  T1 own-nodes** at a **270 s** cap, 2 seeds; 360 runs, 23.5 min. Added because Cave and
  Mountain produce only 8–10 kills per seed in 90 s, which is at the bench's own ranking
  floor, and Cave Brute's node produced no rankable lane at all in the first run. At
  270 s every one of the nine nodes gives 21–57 kills per profile per seed.

Read under design §18.9: the encounter check is **ordinal** (does the favoured lane
out-uplift the punished lane on that family's own node?) and §18.7 settles that `drops`
**is** the definition of "favours" — so where a family does not reward its declared lane,
**the mobs are what must move**, not the magnitude.

Step 3 of this task moved **no** `drops` field: design §18 3b's test (favoured lane last
on the family's own node with both seeds agreeing, and one other lane first with both
seeds) was met by no family in either run. Everything the bench found therefore arrives
here.

---

## 1. The finding that explains most of the others

**Two of the stats that implement "punishes" are unused across the entire bestiary.**

| stat | what it punishes | monsters that set it, in the whole game |
|---|---|---|
| `dotResistance` | Affliction ("weak against dot-resistant mobs") | **none — zero monsters, T1 to T4** |
| `evasion` | Empowered ("weak against swarms, evasive mobs") | **two**: `mire-stalker` 0.20, `bog-lurker` 0.25 |
| `plating` | Tempo ("weak against fortified plating") | four at T1: `rockback-ram` 3, `mud-toad` 2, `cave-brute` 1, `cave-lurker` 1 |

Against the family table that means:

- **Four families declare they punish Affliction** (Plains Sky, Mountain Crag, Cave
  Brute, Jungle Stalker) and not one of their monsters resists a DoT at all.
- **Four declare they punish Empowered** (Plains Swarm, Forest Pack, Mountain Hopper,
  Swamp Mire) and only Swamp Mire has an evading body — `bog-lurker`, which is T3+, so
  never at the tier the family is measured at.
- **Six declare they punish Tempo** (Plains Herd, Forest Grove, Cave Brood, Swamp Coven,
  Jungle Ape, Desert Basilisk) and **none of their T1/T2 bodies carries any plating**:
  `boar` 0, `forest-slime` 0, `brood-spiderling` 0, `fen-hexer` 0, `jungle-ape` 0,
  `stone-basilisk` 0.

Fourteen of the eighteen family contracts therefore declare a punishment with no stat
behind it. This is the one finding in this file that needs no statistics: it is read off
the data files, not measured. It is also upstream of almost everything else — a family
cannot punish a lane it has no mechanism to punish, and the bench duly measures it
punishing nothing.

**One design conflict the designer has to settle before accepting the `plating` rows.**
`plains.monsters.ts`'s own header says "Squishy biomes (plains/forest) carry NO
plating/DR (fast weapons shred them — intended)". The monster refactor's per-biome
mitigation lesson and the family system's per-family punishment contract want opposite
things from the same stat on the same mobs. Either Plains/Forest's tempo-punishing
families get plating (breaking the biome rule), or those two families should punish
something their shape can actually punish. The bench cannot choose this.

---

## 2. The instrument's own limit, which bounds everything below

**With 21–57 kills per profile per seed, the ordinal lane ranking at Tier 1 still does
not reproduce between the two seeds for seven of nine families.** This is the most
important caveat in the file and it was only visible because of the 270 s re-run.

| family | own node | 90 s rank | 90 s margin | 270 s rank | 270 s margin | 270 s rank, seed by seed |
|---|---|---:|---:|---:|---:|---|
| Swamp Mire | `swamp-01` | 6/6 | −12.0pp | **6/6** | **−18.7pp** | **6 and 6 — agrees** |
| Mountain Hopper | `mountain-03` | 5/6 | +0.0pp | 4/6 | +0.0pp | 4 and 4 — agrees |
| Cave Brute | `cave-02` | not rankable | — | 6/6 | −7.9pp | 1 and 6 |
| Cave Deep | `cave-03` | not rankable | — | 6/6 | −3.7pp | 1 and 6 |
| Cave Brood | `cave-01` | 3/6 | +7.2pp | 3/6 | −3.9pp | 2 and 6 |
| Mountain Crag | `mountain-01` | 2/6 | +3.1pp | 4/6 | −1.5pp | 5 and 1 |
| Mountain Ridge | `mountain-02` | 3/5 | +10.5pp | 2/6 | +5.9pp | 4 and 2 |
| Forest Canopy | `forest-03` | 6/6 | −3.8pp | 5/6 | −0.7pp | 3 and 5 |
| Plains Sky | `plains-03` | 6/6 | −11.3pp | **1/6** | **+3.8pp** | 2 and 1 |

Two readings to take from that table.

1. **Plains Sky inverts between caps.** Engagement was last of six and 11.3pp below its
   declared victim at 90 s; at 270 s it is **first of six and 3.8pp above**. The 90 s
   reading was the under-sampled one, so Plains Sky's contract **holds** and the
   overnight report's Sky finding, and the first run's, are both artefacts. Nothing should
   be done to `grass-kite` on the strength of a rank.
2. **The margins move by 7–15pp for the same family between caps**, which is larger than
   the §18.9 band itself (±3pp). At Tier 1 the lane differences are smaller than the
   between-seed variance of the measurement. The band and the ranking are both, today,
   below the instrument's resolution on every family except one.

**Consequence for this file.** Only Swamp Mire's inversion is a measured finding
(§3). Everything else is proposed either from the **contract** — a declared punishment
with no stat behind it, §1 and §4 — or from a quantity that *is* reproducible, namely
deaths and kill counts (§5). No row below is justified by a rank alone.

**Consequence for the next bench.** Three seeds is not the fix; the 270 s run already
tripled the samples per seed and the ranks still swing. The fix is to stop ranking six
lanes against each other on one node and instead compare **one lane against one lane** on
its own favoured node, pooled across all three lineages that carry it, with enough seeds
to put a confidence interval on that single difference.

---

## 3. The one measured finding — Swamp Mire

Drops Affliction, punishes Empowered. Fielded T1 body: `bog-slime`
(hp 140, attack 10, plating 0, speed 28, cooldown 2000, no evasion, no dotResistance).

Affliction ranks **last of six on `node-t1-swamp-01` in both seeds at both caps**, and the
margin against its declared victim *widens* as sampling improves (−12.0pp at 90 s,
−18.7pp at 270 s). Empowered — the lane Mire is supposed to punish — ranks 2nd and 4th.
This is the only family inversion in the game that survives a sampling change.

Both halves of the contract have a cause, and both causes are the unused stats of §1.

| mob | stat | from | to | why |
|---|---|---:|---:|---|
| `bog-slime` | `hp` | 140 | 300 | Affliction is "weak against … **short fights**" and fires on stacks reaching cap. At 140 HP a Mire body dies in three to five hits, so the stack ladder never reaches its payoff on the one node that is seven-tenths Mire. The family's own T3 body `bog-lurker` is already 490, so this also removes an internal inconsistency rather than inventing a number. |
| `bog-slime` | `evasion` | (unset) | 0.15 | The family declares it punishes Empowered and has no mechanism to do so. Evasion is that mechanism — a multiplied hit that misses is the entire punishment. 0.15 is inside the ≤0.25 ceiling and below `bog-lurker`'s 0.25, so the line still escalates by tier. |
| `bog-slime` | `attack` | 10 | 10 | **Unchanged on purpose.** Mire is the low-direct-damage DoT body by design; more HP must not become more pressure by accident. |

A second, cheaper option if the designer would rather not touch `hp`: give `bog-slime` a
DoT of its own so a Mire fight has a reason to last, which is what Swamp's stated lesson
("low direct damage, heavy DoT, answered by DOT-RESIST") already implies. That is an
ability change rather than a stat change, so it is out of this table's scope.

---

## 4. Contract-completion proposals — the declared punishments with no mechanism

Justified by §1, not by any rank. Each row gives a family the stat its own `punishes`
field already promises. Ordered by confidence.

| family | punishes | mob | stat | from | to | why |
|---|---|---|---|---:|---:|---|
| Mountain Crag | affliction | `rockback-ram` | `dotResistance` | (unset) | 0.25 | A stone-plated ram shrugging off poison is the cheapest possible fiction, and Crag is the one family whose favoured side (Empowered) its shape already supports — slow, plated, big single bites. |
| Cave Brute | affliction | `cave-brute` | `dotResistance` | (unset) | 0.30 | The biome's elite, and the mob a DoT build ought to have to think about. Cave is also the %DR biome, so a second mitigation axis on its elite is in character. |
| Forest Pack | empowered | `wolf` | `evasion` | (unset) | 0.12 | The one stat that punishes Empowered, unset on every Pack body. A wolf dodging one swing in eight is the Pack's own fiction, and 0.12 is deliberately the gentlest value in this file. |
| Mountain Hopper | empowered | `cliff-hopper` | `evasion` | (unset) | 0.15 | A leaping goat is the most natural evader in the bestiary, and Hopper is the only Mountain family with no plating to fall back on. Hopper is also the one family besides Mire whose rank agreed across seeds (4th of 6, both seeds) — a stable mid-field, i.e. a family with no measurable shape in either direction. |
| Plains Swarm | empowered | `plains-slime` | `swarm.maxMembers` | 4 | 6 | Empowered is weak to swarms **as a count**: a mechanic that fires on one body while five others chew you is the punishment. On-theme and cheaper than evasion for the biome whose whole identity is volume. Doubles as a Plains pressure row (§5). |
| Forest Grove | tempo | `forest-slime` | `plating` | 0 | 4 | Plating is the stat Tempo is weak to, and the Grove is the only Forest family whose shape is "stand and absorb". **Blocked on the squishy-biome conflict in §1** — do not apply without settling that rule first. |
| Jungle Stalker | affliction | `jungle-stalker` | `dotResistance` | (unset) | 0.25 | Lowest-confidence row in the file: Jungle is unmeasured (§6), so this is proposed purely from the contract. |

Two families need **nothing**: Swamp Coven (control) and Mountain Ridge (control) are the
only two whose favoured lane sat above its punished lane in both runs, and their shapes
already implement their punishments — Coven and Ridge both punish a lane (Tempo,
Kill chain) that a slow ranged backline genuinely does punish.

---

## 5. Plains under-pressure

The brief asks for this separately, and unlike the rank columns it rests on a quantity
that does not move with the seed: **a death count of zero.**

**Across 118 measured cells per T1 biome — about four and a half hours of simulated
combat each — Plains, Mountain, Cave and Swamp killed the reference build ZERO times.**
Only Forest ever killed it (96 deaths). Plains is also the fastest biome to farm, so it
has the lowest pressure per unit of reward in the game.

| T1 biome | kills per cell | deaths per cell | mean per-mob DPS (attack ÷ cooldown) | T1 attack cooldowns |
|---|---:|---:|---:|---|
| plains | **44.8** | **0.00** | 7.6 | 1900 / 2000 / 2200 |
| forest | 34.6 | 0.81 | 11.9 | 1100 / 1400 / 2600 |
| swamp | 21.4 | 0.00 | 5.7 (plus DoT) | 2000 / 2200 / 2400 |
| cave | 20.6 | 0.00 | 19.6 | 1400 / 1500 / 2800 |
| mountain | 16.8 | 0.00 | 12.3 | 3000 / 3100 / 3200 |

The shape of the problem is **cadence, not damage**. Plains' three T1 mobs have among the
slowest attack cooldowns at Tier 1 — 1900, 2000 and 2200 ms — while
`plains.monsters.ts`'s own header describes the biome as a "swarm of small, **fast**,
low-per-hit mobs" whose answer is **plating**. Both halves of that sentence are currently
false: the hits are not fast, and plating is a flat per-hit subtraction, so it is only a
legible lever when hits are frequent and small. Today a Plains node teaches neither
pressure nor the mitigation it was built to teach.

So the proposal raises frequency and **lowers** per-hit damage, which raises pressure
while making plating read for the first time:

| mob | stat | from | to | DPS effect | why |
|---|---|---:|---:|---:|---|
| `plains-slime` | `attackCooldown` | 2000 | 1100 | 6.0 → 8.2 | The swarm body should be the fastest, smallest hit in the game; it is currently among the slowest. |
| `plains-slime` | `attack` | 12 | 9 | — | Per-hit down as cadence goes up: against plating 4 a 9-damage hit is cut 44% and a 12-damage hit 33%, so the player's own plating becomes visible for the first time. |
| `plains-slime` | `swarm.maxMembers` | 4 | 6 | — | Volume is the stated threat, and this is the same row as Plains Swarm's Empowered punishment (§4). |
| `boar` | `attackCooldown` | 1900 | 1400 | 9.5 → 10.7 | The swarm-catcher should still be the heavier hit of the two, just not the slower one. |
| `boar` | `attack` | 18 | 15 | — | As above; keeps the charge opener as the spike. |
| `grass-kite` | `attackCooldown` | 2200 | 1500 | 7.3 → 8.7 | The Sky body joins the biome's cadence. **Note:** this is a *pressure* row only — §2 shows Plains Sky's lane contract already holds, so nothing else about the kite should change. |
| `grass-kite` | `attack` | 16 | 13 | — | As above. |

That is roughly **+25% biome DPS with every per-hit number going down**, and `hp` is
untouched, so the economy and the XP curve do not move. If the designer wants more than
+25%, the next lever is `swarm.maxMembers` on `boar` (4 → 6), not per-hit attack: raising
per-hit damage would undo the plating lesson again.

**A caution on scope.** Four of five T1 biomes kill nobody, so Plains is a symptom rather
than the disease. Mountain, at 16.8 kills per cell, zero deaths and the slowest attack
cadence in the game (3000–3200 ms), is arguably further from its own stated intent ("rare,
HUGE hits that trip the damage cap") than Plains is from its. Nothing here should be read
as "Plains is the outlier".

---

## 6. What is NOT proposed, and why

- **`grass-kite`'s pull geometry, HP, or anything else aimed at Plains Sky's lane.** An
  earlier draft of this file proposed cutting `pullRange` 380 → 220 and `leashRange`
  1000 → 560 on the strength of the 90 s reading. The 270 s run reverses that reading
  entirely (§2). Withdrawn.
- **Every Jungle and Desert family.** A Tier-1 band on Tier-2 Desert scores **1.6 kills
  and 7.0 deaths per cell**; on Jungle 4.2 and 4.6. Those are not measurements of a lane
  or of a family shape — they measure the gear gap at the Tier-2 gate — so no Jungle or
  Desert row can be justified from this bench. The one Jungle row in §4 is proposed from
  the contract and says so.
- **Swamp Stalker.** It declares it punishes Bulwark, which no weapon lineage carries, so
  the punished half is unmeasurable until the defensive lineages are benched. Its
  favoured half reads mid-field.
- **`swamp-mire` and `jungle-stalker` at tier 2.** Neither family has a tier-2 member, so
  nine of the T2 blends do not resolve as authored and Jungle's authored Stalker node
  collapses into an Ape node. That is design §18.8's "third mob per biome" gap one tier
  up. It is a **pool** fix — pull a T3 member down with T2 numbers — rather than a stat
  edit, so it is not in the tables above; but it has to happen before any T2 family
  contract can be measured at all.
- **Any magnitude, ability rank or card number.** Per §18.7 and §18.9, a family that does
  not reward its declared lane is a monster-shape finding.

---

## 7. If only three rows are taken

In confidence order, independent of each other:

1. `bog-slime` `hp` 140 → 300 — the only family inversion that survives resampling.
2. `rockback-ram` `dotResistance` (unset) → 0.25 — the first use of the stat in the game,
   on the family whose favoured side already works.
3. `plains-slime` `attackCooldown` 2000 → 1100 with `attack` 12 → 9 — the biome that
   killed nobody in 118 cells, fixed on the axis its own design document names.
