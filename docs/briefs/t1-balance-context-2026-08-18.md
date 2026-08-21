# Tier 1 Balance — Full Context Pack

**Prepared:** 2026-08-18
**Purpose:** self-contained context for discussing the Tier 1 monster/zone balance pass
with someone (or something) that has no access to the codebase. Everything needed to
reason about the pass is inline: combat formulas, the balance method, biome data, node
modifiers, and every monster's full stat block and kit.

Generated figures come from `pnpm tier:table --tier=1` (`tools/tier-table.ts`). Authored
values are transcribed from `shared/src/data/monsters/` and `shared/src/world/`.

---

## 1. The game, in one page

**MMO Idle** is an automatic-combat idle RPG. The player picks a build (class, skills,
gear, runes, party, traversal strategy) and the server resolves all combat. The player
does not aim or time attacks; they choose *what to bring* and *where to stand*.

Relevant consequences for balance:

- **Autocombat focus-fires.** Facing a group, the player's damage goes into one target
  until it dies, then the next. This drives the whole encounter model in §3.
- **The world is a node grid.** Each node is a self-contained combat zone with its own
  monster population that respawns to a target headcount. Players travel node to node.
- Nodes are grouped into **biomes** (Plains, Forest, Swamp, …) and **tiers** (T1–T4).
  A biome appears at several tiers with a different monster roster at each.
- **Dungeon nodes** hold a single respawning boss and are hand-designed "exams". They are
  excluded from the modifier system entirely.
- Progression currencies: **essence** (crafting), **biome XP** (per-biome level),
  **catalysts** (a second crafting currency, one type per node modifier).

### Tier 1 progression intent ("the railroad")

The intended order through T1 is:

```
Plains → Forest → Swamp → Mountain → Caverns
```

This is a **soft gate, not a lock**. A player may walk into Caverns first and will have a
rough time; farming earlier biomes makes later ones reliable. The design goal is that
skipping ahead feels *dangerous*, not merely *slow* — a distinction that turns out to
matter a great deal (§3).

---

## 2. Combat formulas

### Direct hit damage

```
damage = max(1, round(max(0, attack − plating) × (1 − damageReduction)))
```

Plating is a **flat subtract**, damage reduction is a **multiplicative** fraction, and
there is a **hard floor of 1**. Consequences:

- Effective HP depends on the attacker's hit size. Plating 8 halves a 16-damage hit and
  barely dents a 160-damage one.
- Against high plating, a fast low-per-hit attacker is floored to 1 damage per swing. This
  is a real cliff, not a gentle curve.

### Damage over time (DoT)

A monster with `dotEffect` applies one stack per landed hit:

```
DoT DPS at capped stacks = damagePerStack × maxStacks × (1000 / tickIntervalMs)
time to reach cap        = (maxStacks − 1) × attackCooldown
```

DoT is absorbed by shields like any other damage unless flagged `bypassShield`. It does
**not** care about plating or damage reduction.

### Evasion

A deterministic per-hit dodge *fraction*, not RNG: `0.2` means every 5th incoming hit is
skipped. An evaded hit applies no on-hit riders (no DoT, no slow, no debuff).

### Player damage cap

An **opt-in gear stat** (`defense.max-hit-pct`, default 0) and a **soft** cap:

```
damage = threshold + (excess × max-hit-mult)     where threshold = maxHp × max-hit-pct
```

A typical investment is 25% of max HP with a 0.5 multiplier on the excess. Big monster
hits therefore stay big; players who build for it halve the overflow. This is the intended
counterplay to Mountain/Caverns spike damage.

---

## 3. The balance method and the encounter model

### The "vacuum" method

This pass balances monsters **without reference to any player**. No gear, no class, no
upgrade level. Difficulty is defined only as:

- monster vs monster within a tier,
- biome vs biome along the railroad.

**Why:** player power is a moving target across six classes, +0…+5 upgrade levels, global
mastery, runes, stances and rites — all themselves unbalanced. Requiring a reference-player
model *before* touching monsters blocks the work indefinitely. Relative difficulty is what
the railroad actually encodes, so it can be fixed first.

**Accepted limitation:** the vacuum fixes the *shape* of a tier. It cannot say whether the
tier is too hard or too easy in absolute terms. That needs one check against a real player,
run at tier close rather than as a prerequisite.

### The encounter model

The key derivation. A pull of **N** identical monsters, each with effective HP `h` and DPS
`d`, focus-fired by a player of DPS `P`:

```
monster k dies at   t_k = k·h / P
total damage taken  = d · (h/P) · N(N+1)/2
```

Three distinct quantities fall out, and they measure genuinely different things:

| quantity | formula | meaning |
|---|---|---|
| **Sustained pressure** | `d · (N+1)/2` | Incoming DPS the player must out-sustain. `(N+1)/2` is the mean number of live attackers as the pull burns down from N to 1. |
| **Cost per kill** | `d · h · (N+1)/2` | Punishment per unit of progress. The farming-viability metric. |
| **Pull load** | `d · h · N(N+1)/2` | The spike of walking into a group. **Quadratic in N.** |

`P` cancels from every biome-vs-biome *ratio*, which is what keeps all three valid in a
vacuum.

**Two results that drove every decision in this pass:**

1. **Monster eHP cancels out of sustained pressure entirely.** Durability does not make a
   biome more dangerous — it makes it *slower*. A difficulty curve led by HP reads as
   tedium, not threat. This is why T1 was reshaped to gate with lethality.

2. **Damage taken from a pull is quadratic in N.** So `density × mean DPS` is wrong in the
   *exponent*, not just the magnitude. Population is a far more sensitive lever than any
   stat multiplier, which is why the node modifiers that change headcount had to be tuned
   much more timidly than they first appear to need.

Perfect AoE would collapse the `(N+1)/2` term toward 1 (everything dies at once); real
builds sit between focus-fire and AoE, which is where class matchup texture lives.

### Concurrency (N) is a design input, not a derived value

`N` is **not** the node's monster count. Density says how many monsters exist in a node;
`N` says how many are typically hitting the player at once, after pull radius, aggro
chaining, leash range and player movement. It is asserted by the designer and is currently
**unvalidated against simulation** — see §9.

### Effective HP probes

Because eHP depends on hit size (§2), it is reported as a curve over **probe hit sizes
anchored to the tier's own median monster attack** — a player-free anchor. For T1 the
median authored attack is 19, so probes are 10 / 19 / 38 / 76 damage.

- `eHP@10` is the chip-weapon reading, `eHP@76` the heavy-weapon reading.
- **spread** = `eHP@10 ÷ eHP@76` is the monster's *armour character*: 1.0 is
  armour-neutral, above 1.5 means it punishes fast chip damage.
- Because probes are tier-anchored, eHP compares **within a tier only**. Use raw HP for
  cross-tier scale.

---

## 4. Locked design targets for T1

| target | value | rationale |
|---|---|---|
| Progression order | Plains → Forest → Swamp → Mountain → Caverns | designer intent |
| Sustained pressure | **×1.20 per stage** | the danger axis; makes skipping ahead rough |
| Effective HP | **×1.41 per stage** | lands Caverns at ~4× Plains — chunky but not a slog |
| Cost per kill | ×1.70 per stage (derived) | compounds from the two above |
| Roster size | 2 monsters per biome | T1 is introductory; stat-block monsters are fine here |
| Baseline | Plains, unmodified | measured, not targeted — everything indexes to it |

Plains is the anchor and was left untouched by the pass.

---

## 5. Biomes

| biome | order | density | **N** | identity | mitigation it teaches |
|---|---:|---:|---:|---|---|
| Plains | 1 | 48 | 5 | swarm of small fast hits; volume is the threat | plating (flat subtract) |
| Forest | 2 | 36 | 3 | fast, frequent attacks; low per-hit, no armour | evasion (scales with hit count) |
| Swamp | 3 | 20 | 2 | low direct damage, heavy DoT, attrition | DoT-resist |
| Mountain | 4 | 24 | 2 | rare, huge, cap-tripping hits | damage cap |
| Caverns | 5 | 16 | 2 | few elite monsters, mixed shapes | %damage reduction (universal) |

Note density and N move in the **same** direction here but are not proportional: Plains has
3× Caverns' density but only 2.5× its concurrency.

### Reward scale (unreconciled — see §9)

| biome | mean essence/kill | mean biome XP/kill |
|---|---:|---:|
| Plains | 2.5 | 14 |
| Forest | 2.8 | 17 |
| Swamp | 5.5 | 39 |
| Mountain | 6.7 | 45 |
| Caverns | 11.5 | 80 |

All five T1 bosses grant 100–110 essence, 150–165 biome XP, and a one-time bundle of 5
catalysts on first clear.

---

## 6. Node modifiers

Every non-excluded node carries **exactly one** of five modifiers. It is both the node's
personality and its catalyst key — kills in an Alacrity node grant Alacrity Catalyst
regardless of biome.

**Design stance:** all five are **net difficulty increases**. There is no neutral modifier,
so the unmodified baseline in §8 is a reference the player never actually plays. (The
previous system was threat-budget-neutral — every modifier traded something away — and was
deliberately abandoned.)

**Excluded from modifiers:** the starting Clearing, sanctuaries, the dev test room, and all
dungeon nodes. Bosses are immune to modifier stat changes even on a modified node, though
the node's catalyst identity still applies to them.

### Magnitude

A single scalar `M` drives everything, rising by tier:

```
T1 M = 0.15    T2 M = 0.20    T3 M = 0.25    T4 M = 0.30
```

### The five modifiers

| | formula | at T1 (M = 0.15) |
|---|---|---|
| **Alacrity** | cadence ×(1−M), move ×(1+M), attack unchanged | cadence ×0.85, move ×1.15 |
| **Heavy** | attack ×(1+2M), cadence ×(1+M) | attack ×1.30, cadence ×1.15 |
| **Swarming** | population ×1.2, no stat change at all | count ×1.20 |
| **Dominion** | population ×0.85, attack ×(1+2M), HP/plating ×(1+M), move ×(1+M/2), damage taken ×(1−M/2) | count ×0.85, attack ×1.30, HP ×1.15 |
| **Fortified** | plating ×(1+2M), damage taken ×(1−M), offence untouched | plating ×1.30, damage taken ×0.85 |

Full multiplier matrix at T1:

```
              attack  cadence   move     HP  plating  dmg taken  count   DoT
alacrity        1.00     0.85   1.15   1.00     1.00       1.00   1.00  1.18
heavy           1.30     1.15   1.00   1.00     1.00       1.00   1.00  1.13
swarming        1.00     1.00   1.00   1.00     1.00       1.00   1.20  1.00
dominion        1.30     1.00   1.07   1.15     1.15       0.93   0.85  1.30
fortified       1.00     1.00   1.00   1.00     1.30       0.85   1.00  1.00
```

### Three implementation details that carry design weight

**Damage reduction is folded multiplicatively**, not scaled directly:

```
DR' = 1 − (1 − DR) × incomingDamageMult        clamped to [0, 0.95]
```

This works from `DR = 0` (which a naive `DR × k` cannot) and can never reach immortality.

**DoT scales on the modifier's net damage multiplier** (`attack ÷ cadence`), not on attack
alone. The rule is "a modifier multiplies the monster's total damage output"; direct damage
realises it through attack and cadence together, DoT through damage-per-stack. Scaling DoT
on attack alone gave Heavy its full +30% on poison while the −15% cadence penalty that
offsets it applied only to direct hits — making a Heavy Swamp ×1.30 where a Heavy Plains
was ×1.13. The trade is a little physical nuance (capped DoT throughput does not really
depend on how fast the stacks were applied), bought in exchange for uniform modifier
strength across every biome.

**Dominion's attack is ×(1+2M), not ×(1+M).** Removing bodies drags sustained pressure
*down* on its own, and at the smaller multiplier Dominion was the **safest** modifier in
the game — quietly below an unmodified node, the opposite of its intent.

### Bans and natives

Each biome bans at most one modifier and has one "native" modifier that appears on an extra
node, making it that biome's most common flavour and its catalyst identity.

| biome | bans | native |
|---|---|---|
| Plains | — | *(none — deliberately neutral)* |
| Forest | Heavy | Alacrity |
| Swamp | — | Fortified |
| Mountain | Alacrity | Heavy |
| Caverns | — | Dominion |
| Jungle | Heavy | Alacrity |
| Desert | Alacrity | Dominion |
| Tundra | Alacrity | Heavy |
| Volcanic | — | Swarming |
| Wasteland | — | Swarming |
| Trench | — | Dominion |

> **Structural constraint worth knowing.** The map generator emits one node per non-banned
> modifier plus a second node for the native, so
> `nodes per biome = (5 − bans) + (native ? 1 : 0)`. Region layouts are hand-cut to fit
> exactly. Adding or removing a ban changes how many map cells a biome needs. Biomes with
> no ban host all five modifiers — which is why a Swarming Caverns exists despite Caverns
> being the low-density biome. That pairing was accepted deliberately, preferring variety
> over thematic purity.

### Reward multipliers (per kill)

Alacrity 1.15 · Heavy 1.15 · Swarming 1.05 · Dominion 1.40 · Fortified 1.25.

**These are stale** — see §9.

---

## 7. The Tier 1 roster

Authored values, before any modifier. `w` is spawn-pool weight (a duplicated pool entry
spawns proportionally more often).

### Plains — N 5, density 48

**Field Hare** `plains-slime` · w×1
```
HP 50    attack 12    cooldown 2000ms    DPS 6.0
plating 0   DR 0   speed 46   range 12   pull 190
eHP@10 48   spread 1.0
rewards: 2 essence (yellow), 10 biome XP
```
- `swarm { cohesion 0.1, separation 40 }` — steers as a converging group when chasing.
- `pack { role: follower, callRange 280 }` — joins a caller's assist net.
- *No other mechanics. Swarm filler; dangerous only in numbers.*

**Boar** `boar` · w×1
```
HP 100   attack 18    cooldown 1900ms    DPS 9.5
plating 0   DR 0   speed 50   range 12   pull 205
eHP@10 95   spread 1.0
rewards: 3 essence (yellow), 18 biome XP
```
- `chargeOnAggro { speedMult 2.5, durationMs 1000 }` — bursts to contact on first aggro.
- `swarm { cohesion 0.08, separation 56 }`
- *Swarm-catcher: charges in so the player cannot simply walk away from the pack.*

**Tusked Razorback** `tusked-razorback` — **BOSS**
```
HP 1500  attack 42    cooldown 2000ms    DPS 21.0
plating 4   DR 2%   speed 50   range 15   pull 280
rewards: 100 essence, 150 biome XP, 5-catalyst bundle on first clear
```
- At 50% HP: spawns 4 Field Hares + 1 Boar (cap 6 alive), and enrages (attack ×1.1,
  cooldown ×0.9).
- Every 10s from 4s in: tops the swarm back up with 2 Field Hares (cap 5 alive).

### Forest — N 3, density 36

**Moss Rat** `forest-slime` · w×1
```
HP 160   attack 17    cooldown 1400ms    DPS 12.1
plating 0   DR 0   speed 54   range 12   pull 210
eHP@10 152   spread 1.0
rewards: 3 essence (green), 18 biome XP
```
- *No mechanics at all — the only such monster in the tier, and intentional. T1 is the
  introductory tier and Forest's texture comes from the wolf pack instead.*

**Wolf** `wolf` · w×1
```
HP 130   attack 20    cooldown 1100ms    DPS 18.2
plating 0   DR 0   speed 82   range 12   pull 255
eHP@10 124   spread 1.0
rewards: 4 essence (green), 25 biome XP
```
- `pack { role: alpha, callRange 320, followers: [young-wolf ×2] }` — spawns as a group of
  three and calls its mates onto whatever it engages.
- *Fast baseline speed IS its anti-kite; no charge needed.*

**Young Wolf** `young-wolf` · effective weight ×2
```
HP 70    attack 14    cooldown 1150ms    DPS 12.2
plating 0   DR 0   speed 86   range 12   pull 230
eHP@10 67   spread 1.0
rewards: 2 essence (green), 12 biome XP
```
- `pack { role: follower, callRange 300 }`
- **Never appears in any spawn pool** — it exists only as two-thirds of every wolf pack.
  Counting pooled IDs alone understates Forest by about a third.

**Gnarled Greatbear** `gnarled-greatbear` — **BOSS**
```
HP 1250  attack 36    cooldown 1400ms    DPS 25.7
plating 0   DR 0   speed 60   range 15   pull 300
rewards: 100 essence, 150 biome XP, 5-catalyst bundle
```
- `chargedAttack "Savage Maul"` — 1200ms wind-up, ×2.4 damage (= 86), 6.5s cooldown,
  knockback 130, marks the target for 1800ms.
- At 50% HP: enrage (attack ×1.1, cooldown ×0.85).

### Swamp — N 2, density 20

Roughly **75% of Swamp's damage output is poison** (78% for the Ooze, 72% for the Toad),
which makes it the biome least sensitive to anything that scales direct damage.

**Mire Ooze** `bog-slime` · w×1 — *the dealer*
```
HP 140   attack 10    cooldown 2000ms    direct DPS 5.0
DoT 18.0 DPS at cap (reached in 4.0s)    total 23.0
plating 0   DR 0   speed 28   range 12   pull 165
eHP@10 133   spread 1.0
rewards: 5 essence (purple), 35 biome XP
```
- `dotEffect { damagePerStack 6, maxStacks 3, tickIntervalMs 1000, durationMs 4000 }`
- *A weak slap; the toxin does all the work. Direct mitigation barely helps here.*

**Mud Toad** `mud-toad` · w×1 — *the controller*
```
HP 120   attack 13    cooldown 2200ms    direct DPS 5.9
DoT 15.0 DPS at cap (reached in 4.4s)    total 20.9
plating 2   DR 0   speed 30   range 12   pull 180
eHP@10 143   spread 1.2
rewards: 6 essence (green), 42 biome XP
```
- `dotEffect { damagePerStack 5, maxStacks 3, tickIntervalMs 1000, durationMs 4000 }`
- `slowEffect { speedMult 0.6, durationMs 2000 }` — a 40% movement slow, refreshed on
  every landed hit.
- *Its job is to stop you leaving, so the Ooze's poison keeps stacking. The answer to
  Swamp is "cleanse and disengage"; the failure state is being unable to.*

**Grave Toadeater** `grave-toadeater` — **BOSS**
```
HP 1150  attack 12    cooldown 2600ms    direct DPS 4.6   DoT 9.0   total 13.6
plating 2   DR 2%   speed 28   range 15   pull 260
rewards: 100 essence, 150 biome XP, 5-catalyst bundle
```
- `dotEffect { damagePerStack 3, maxStacks 3, tick 1000ms, duration 4000ms }`
- `aoeAttack { radius 120, damageMult 0.6 }` — attacks splash at 60% damage.
- At 50% HP: enrage (attack ×1.15, cooldown ×0.85).

### Mountain — N 2, density 24

**Cliff Hopper** `cliff-hopper` · **w×2** (two pool slots — two thirds of Mountain spawns)
```
HP 190   attack 82    cooldown 3000ms    DPS 27.3
plating 0   DR 0   speed 28   range 12   pull 420
eHP@10 181   spread 1.0
rewards: 6 essence (yellow), 42 biome XP
```
- `chargeOnAggro { speedMult 3.0, durationMs 1200 }`
- `chargedAttack "Strong Kick"` — 1100ms wind-up, ×1.5 (= 123 damage), 9s cooldown,
  knockback 180.
- `patrol` — pingpong along a fixed 320px line, holding 1.5–3.5s at each end.
- `vaultsMountainLedges: true` — can cross ledge terrain features.

**Ridge Ambusher** `ridge-archer` · w×1
```
HP 240   attack 82    cooldown 3100ms    DPS 26.5
plating 0   DR 0   speed 26   range 210 (RANGED)   pull 350
eHP@10 228   spread 1.0
rewards: 8 essence (blue), 52 biome XP
```
- `chargedAttack "Power Shot"` — 2000ms wind-up, ×1.8 (= 148 damage), 8s cooldown, first
  armed 3.5s into the fight.
- `holdsChokepoints: true` — spawns on a terrain chokepoint and holds it rather than
  roaming.

**Crag Behemoth** `crag-behemoth` — **BOSS**
```
HP 1400  attack 60    cooldown 3500ms    DPS 17.1
plating 0   DR 0   speed 22   range 18   pull 280
rewards: 105 essence, 158 biome XP, 5-catalyst bundle
```
- `chargeOnAggro ×3.0` · `aoeAttack { radius 120, damageMult 0.6 }`
- At 50% HP: +30% damage reduction for 5s.

### Caverns — N 2, density 16

**Cave Lurker** `cave-lurker` · w×1
```
HP 200   attack 31    cooldown 1400ms    DPS 22.1
plating 1   DR 5%   evasion 10%   speed 68   range 12   pull 200
eHP@10 264   spread 1.1
rewards: 10 essence (red), 70 biome XP
```
- `evasion 0.10` — deterministically dodges every 10th incoming hit.
- *Fast, lightly armoured, relentless, hard to pin down.*

**Cave Brute** `cave-brute` · w×1 · **ELITE**
```
HP 220   attack 118   cooldown 2800ms    DPS 42.1
plating 1   DR 10%   speed 18   range 12   pull 240
eHP@10 261   spread 1.1
rewards: 13 essence (red), 90 biome XP
```
- `chargeOnAggro { speedMult 2.5, durationMs 1200 }`
- `chargedAttack "Ground Slam"` — 1800ms wind-up, ×1.5 (= 177 damage), AoE radius 110,
  12s cooldown, first armed 9s in. *Meant to be dodged, not tanked — footwork is the
  answer, not mitigation.*
- `patrol` — a fixed 3-point loop around its territory.
- `elite: true` — draws a yellow client outline and is prioritised by the `focus-elites`
  targeting rune. A classification tag only; grants no stats.

**Obsidian Broodmother** `obsidian-broodmother` — **BOSS**
```
HP 1050  attack 40    cooldown 2800ms    DPS 14.3
plating 6   DR 10%   speed 24   range 18   pull 240
rewards: 110 essence, 165 biome XP, 5-catalyst bundle
```
- `chargeOnAggro ×2.5` · `aoeAttack { radius 120, damageMult 0.6 }`
- At 50% HP: +25% damage reduction for 5s.

---

## 8. Derived results

### Unmodified baseline

| biome | N | density | mean eHP@10 | mean DPS | sustained | cost/kill | pull load |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plains | 5 | 48 | 71 | 7.7 | 23.2 | 1.00 | 1.00 |
| Forest | 3 | 36 | 102 | 13.7 | 27.3 | 1.69 | 1.01 |
| Swamp | 2 | 20 | 138 | 22.0 | 32.9 | 2.74 | 1.10 |
| Mountain | 2 | 24 | 196 | 27.0 | 40.6 | 4.82 | 1.93 |
| Caverns | 2 | 16 | 263 | 32.1 | 48.2 | 7.66 | 3.06 |

Indexed progression curves (Plains = 1.00):

```
sustained pressure   1.00 → 1.18 → 1.42 → 1.75 → 2.08     (target 1.20/stage)
cost per kill        1.00 → 1.69 → 2.74 → 4.82 → 7.66     (target ~1.70/stage)
pull load            1.00 → 1.01 → 1.10 → 1.93 → 3.06
```

All five biomes sit on their targets within ~2%.

### With modifiers applied

Sustained pressure, indexed to an unmodified Plains node. `—` = banned in that biome.

| biome | unmodified | Alacrity | Heavy | Swarming | Dominion | Fortified | spread |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plains | 1.00 | 1.18 | 1.13 | 1.17 | 1.14 | 1.00 | ×1.18 |
| Forest | 1.18 | 1.39 | — | 1.35 | 1.35 | 1.18 | ×1.18 |
| Swamp | 1.42 | 1.67 | 1.66 | 1.61 | 1.72 | 1.42 | ×1.21 |
| Mountain | 1.75 | — | 1.98 | 1.98 | 2.05 | 1.75 | ×1.17 |
| Caverns | 2.08 | 2.44 | 2.34 | 2.35 | 2.42 | 2.08 | ×1.18 |

Cost per kill, same indexing:

| biome | unmodified | Alacrity | Heavy | Swarming | Dominion | Fortified | spread |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plains | 1.00 | 1.18 | 1.13 | 1.17 | 1.45 | 1.25 | ×1.28 |
| Forest | 1.69 | 1.99 | — | 1.94 | 2.48 | 2.11 | ×1.28 |
| Swamp | 2.74 | 3.24 | 3.21 | 3.11 | 4.32 | 3.55 | ×1.39 |
| Mountain | 4.82 | — | 5.46 | 5.46 | 7.22 | 6.02 | ×1.32 |
| Caverns | 7.66 | 9.01 | 8.62 | 8.68 | 11.72 | 8.75 | ×1.36 |

### Ordering check

A railroad step is *clean* when the **easiest** node of the later biome is still harder
than the **hardest** node of the earlier one — i.e. modifier variance stays inside the
progression step.

| step | axis | hardest earlier | easiest later | result |
|---|---|---:|---:|---|
| Plains → Forest | sustained | 1.18 | 1.18 | clean |
| Plains → Forest | cost/kill | 1.45 | 1.94 | clean |
| Forest → Swamp | sustained | 1.39 | 1.42 | clean |
| Forest → Swamp | cost/kill | 2.48 | 3.11 | clean |
| Swamp → Mountain | sustained | 1.72 | 1.75 | clean |
| Swamp → Mountain | cost/kill | 4.32 | 5.46 | clean |
| Mountain → Caverns | sustained | 2.05 | 2.08 | clean |
| Mountain → Caverns | cost/kill | 7.22 | 8.62 | clean |

All ten pass. **The margins at the top of the tier are thin** — 1–2% at Plains→Forest and
Mountain→Caverns — so any future change to Mountain or Caverns numbers must be re-checked
against this table.

### How this got here

For context on why the numbers are what they are, the pass found and fixed:

1. **T1 gated with durability, not lethality.** eHP spanned 8.8× across the tier while DPS
   spanned only 1.4×. Walking into Caverns early did not kill you; it made kills take 8×
   longer. Tedium is not a gate.
2. **Biome-level pressure ran backwards** along the railroad, because density fell faster
   than per-mob power rose.
3. **Swamp was one monster twice** — `bog-slime` and `mud-toad` had identical DoT blocks
   and near-identical stats, in the biome whose identity is attrition. Its DoT also needed
   6.6–7.2s to reach cap, longer than the monsters lived, so the authored sustained DoT was
   a number players never met.
4. **Two monsters had no mechanics at all**; `cave-lurker` was one of only two monsters in
   its biome.
5. **Modifier population factors were far too wide.** At ×1.4/×0.7 they spanned ×1.51 of
   pressure inside a single biome against a ×1.20 step between biomes, so every railroad
   step overlapped. The three *stat* modifiers already fit; population was the entire
   problem.
6. **Dominion was the safest modifier in the game** despite being "stronger in every
   respect", because losing bodies beat its stat gain.

---

## 9. Open threads and known limitations

**Rewards are unreconciled.** The per-kill modifier multipliers (§6) were set when Dominion
removed 30% of bodies rather than 15%, and were priced per *kill* while players optimise
per *hour*. At the earlier numbers, Swarming paid ~1.47× essence/hour and Dominion ~0.78×,
which would have made Swarming strictly dominant. This is deliberately parked for a
separate economy pass and the figures above should not be trusted as final.

**Concurrency is asserted, not measured.** The N values (5/3/2/2/2) are the load-bearing
term in essentially every number in this document, and they are designer intent rather than
simulation output. Validating them against the farm simulation is the single highest-value
open task.

**Not modelled, by construction:** player stats, movement, pathing, aggro chaining, real
concurrency dynamics, healing and sustain, party effects, AI decision-making, and boss
scripts beyond their opening state. Pack and swarm sizes are authored intent, not simulated
pulls — a "pack of 3" is what the data declares, not necessarily what a player ends up
fighting.

**The vacuum cannot judge absolute difficulty.** Everything here is a ratio. Whether T1 as a
whole is correctly pitched needs one check against a real player build, best run at tier
close.

**Tiers 2–4 have not had this pass.** Their monster rosters, biome orders and concurrency
values are unreviewed. T2 has seven biomes rather than five and its order is not yet
settled.

---

## 10. Useful questions to interrogate this with

- Is a ×1.20/stage danger curve the right steepness for a five-biome tier, given the player
  also gains power across it? (T1 spans ×2.08 sustained end to end.)
- Should cost-per-kill really compound at ×1.70/stage — Caverns costs 7.7× a Plains kill
  while paying 4.6× the essence. Is that the right risk/reward direction?
- The margins at Plains→Forest and Mountain→Caverns are ~1%. Is a strictly clean ordering
  even the right goal, or is some overlap between adjacent biomes healthy variety?
- Is it a problem that Fortified never changes sustained pressure at all (it is always
  exactly ×1.00 on that axis, and only shows up in cost per kill)?
- Swarming and Dominion move population, which is quadratic in effect. Is expressing
  difficulty through headcount worth the sensitivity it introduces?
- Two monsters per biome with one of them mechanically empty — is that too thin for an
  introductory tier, or correctly restrained?
- Concurrency N drives everything and is unvalidated. What would change if Plains were
  really 4 or 6 rather than 5?
