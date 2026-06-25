# MMO Idle — Game Overview & Gameplay Loop

**Purpose:** Current-state design reference. Describes what the game is and how it plays
*today*, as a baseline for evaluating design changes. Where mechanics are open or uncertain,
that's noted explicitly. Companion to `design-bible.md` (invariants), `player-power-curve.md`
(math), and `boss-design.md` (boss philosophy).

---

## 1. Elevator pitch

An automatic-combat idle RPG played in a browser with friends. You build a character and
set it loose in a monster-filled zone; the server resolves all fights without your input.
Your decisions — class, gear, skill tree, zone choice — determine whether you live and how
fast you progress. The game is cooperative, deterministic, and designed to run unattended
for long stretches.

Target scale: ~100 concurrent players, friends/small community. Not designed for thousands.

---

## 2. The game world

An **11×11 grid of nodes** (zones). The center node is the Clearing (T0 tutorial zone).
Chebyshev distance from the center determines tier:

| Distance | Tier | Biomes at this tier |
|---|---|---|
| 0 | T0 | Clearing |
| 1–2 | T1 | Plains, Forest, Mountain, Swamp, Cave |
| 3 | T2 | Plains, Forest, Mountain, Swamp, Cave + Jungle, Desert |
| 4 | T3 | Mountain, Swamp, Cave, Jungle, Desert + Tundra |
| 5 | T4 | Jungle, Desert, Tundra, Volcanic, Graveyard, Trench |

Each node has a biome type. Every biome has a distinct **damage shape** (what kind of
threat its monsters pose) and a matching **defensive answer** (what armor/charm mechanic
counters it). This is the core of the game's strategic depth — the right gear for one
biome can be very wrong for another.

**Dungeon nodes:** one per biome per tier. Same biome type, but monsters have ×2 HP /
×1.6 ATK, and a persistent boss spawns in the dungeon. Killing the boss is gated progress
(tier advancement quests require boss kills).

---

## 3. Biomes and their damage shapes

| Biome | Tier | Density | Damage shape | Defensive answer |
|---|---|---|---|---|
| Plains | T1–T2 | Highest | Many small fast hits | Plating (flat subtract) |
| Forest | T1–T2 | High | Frequent moderate hits | Evasion (counter-based dodge) |
| Mountain | T1–T4 | Low | Rare massive hits (trip the damage cap) | Damage cap |
| Swamp | T1–T3 | Medium | Low direct + heavy DoT | DoT-resistance + hit-to-DoT conversion |
| Cave | T1–T3 | Lowest | Mixed elites: fast + bruiser + ranged | Premium %DR (universal) |
| Jungle | T2–T4 | High | Fast on-hit, hardening | Evasion + hardening |
| Desert | T2–T4 | Very low | Few tough, debuff-laden | Last-stand + cleanse |
| Tundra | T3–T4 | Low | Slow big hitters + slowing debuffs | Hit-to-DoT debt + bulk |
| Volcanic | T4 | High | Sustained heat attrition | In-combat regen |
| Graveyard | T4 | Extreme high | Overwhelming weak undead (DoT contagion) | TBD |
| Trench | T4 | Extreme low | Rare abyssal terrors | TBD *(design under review)* |

A biome's enemies, its craftable weapon, and its armor+charm all express the same
theme. Picking gear from one biome and fighting in another is a deliberate trade-off.

---

## 4. Gameplay loop — one session

```
Spawn in the Clearing
  ↓
Enable AUTO COMBAT → character walks to nearest monster, attacks automatically
  ↓
Monsters drop essence (currency) and biome XP
  ↓
Biome XP → biome level → unlocks crafting recipes for that biome
  ↓
Spend essence at the Forge → craft gear (weapon, armor, recovery, mobility)
  ↓
Gear stronger → move to a higher-tier biome
  ↓
Kill quests → skill points → unlock skill tree nodes (class upgrades)
  ↓
Boss kills → advance player tier (T1 quest requires a T1 dungeon boss kill, etc.)
  ↓
Repeat up the tier ladder: T0 → T1 → T2 → T3 → T4 (current content ceiling)
```

This is the **main loop**. It's designed to run unattended: leave the tab open, come back
to crafted gear and progress.

---

## 5. The class system

Six archetypes, each with a different combat identity:

| Class | Core mechanic |
|---|---|
| Cadence | Hit counter → every Nth hit is a powerful finisher (×2 default) |
| Energy | 0–100 energy pool → full discharge hits → explodes in empowered damage |
| DoT | Attacks convert a fraction of damage into stacking poison/DoT over time |
| Cooldown | Countdown timer → big execution hit on cooldown expiry |
| Reload | Shots per "magazine" → burst window → forced reload pause |
| Summoner | Minions fight for the player; player commands them, they scale with player stats |

**Skill tree structure per class:**
- **T0 root:** pick a class (commits to the archetype's core mechanic)
- **T1 frame:** light / balanced / heavy (re-allocates budget between offense and defense; each frame changes how the mechanic behaves, not just the numbers)
- **T2 range node:** close or far range (changes engagement distance and attack style)
- **T3 path modifiers:** 9 options (3 per frame), each deepening the frame's identity
- **T4 specs:** in progress; 45 designed, partially implemented

One skill point per node. Points come from quest XP. You can reset your class for free,
but you spend the same points to re-buy your tree.

---

## 6. Equipment

Four slots: **weapon, armor, recovery, mobility (boots)**.

Each biome's crafting line produces a weapon archetype and an armor+charm pair that
expresses the biome's theme. Upgrade levels +0 through +3 scale stats significantly
(approximately ×1.8–2.2 on key stats at +3 vs +0).

**Biome lifespan:** each biome's recipe line caps at a certain tier, then retires. Its
mechanics carry forward as "crosses" inside richer later biomes. The active recipe
roster at any tier is ~5–6 biomes, not the full 11.

**Rune system:** rune loadout slots exist; `rune:setLoadout` is live. Rune design
(costs, RP budget, validation, fragment drops) is a near-term authoring task.

---

## 7. Defense model

Mitigation is split into archetypes, each suited to a different threat shape:

| Mechanic | Best against | Home biome |
|---|---|---|
| Plating (flat subtract) | Many small hits | Plains |
| Evasion (deterministic dodge) | Any hit size (flat % of hits) | Forest |
| Damage cap (max-hit clamp) | Rare massive hits | Mountain |
| DoT-resistance | Damage-over-time | Swamp |
| Premium %DR (multiplicative) | All shapes (universal) | Cave |
| Hit-to-DoT debt conversion | Big burst hits → spread DoT | Tundra |
| Last-stand (1× cheat-death) | Any killing blow | Desert |
| Hardening (ramping plating) | Long sustained fights | Jungle |

Recovery (charmed healing) is separate:
- Kill-burst (heal on kill): Plains charm
- Raw out-of-combat regen: Forest charm
- Periodic barrier/shield: Mountain charm
- Absorb (damage → heal-over-time): Swamp charm
- Regen-burst (periodic pulse): Cave charm
- In-combat regen: Volcanic charm

No single mitigation+recovery combination counters all threat shapes. A pure plating
tank is immune to Plains trash but vulnerable to DoT and massive hits. This is the
structural immortality cap — no hard stat limits needed.

---

## 8. Bosses

One boss per dungeon (per biome per tier). Boss philosophy:

- A boss is its tier's trash theme concentrated into one entity + one new structural
  layer per tier (tier's layer echoes what trash teaches).
- T1: pure single-phase fight testing one mitigation shape.
- T2: adds a 50% HP threshold phase (second damage shape).
- T3: phase also flips range stance + capped enrage ramp.
- T4: designed to add a defense-break window (not yet implemented).
- Bosses can't be kited to triviality: every boss has charge (if slow) or speed+reach.
- Slow/heavy bosses have AoE cleave to prevent summon body-blocking.

---

## 9. The Void Overlord

The Void Overlord is the world's optional raid-style encounter. Currently at the center
of the world or in a special node. It requires a party. Its respawn cooldown is persisted
through `worldStateRepo`. It's designed as a group challenge, not a solo requirement.

---

## 10. Party system

Parties are runtime-only (not persisted). Members in the same node share monster kill
rewards. The game is designed as solo-complete but party-incentivized:
- Solo: all content beatable, comfortable pace
- Party: faster rewards, required for optional hard bosses only

Party synergy (debuffs, auras, shared buffs) is implemented as item/class tags that
scale in value with party size. Solo players lose nothing by grouping with others.

---

## 11. Client experience

- **Auto combat:** the primary verb is toggling auto-combat on and setting a kite/charge
  preference. No other real-time input during combat.
- **Navigation:** click-to-move on the world map, or use auto-traverse to have the
  character path to a target zone automatically.
- **HUD (desktop):** left sidebar (stats, buffs, essence), right sidebar (skill tree,
  inventory, crafting, map, quests), floating AUTO COMBAT button.
- **HUD (mobile):** portrait-first fixed top strip + chips + tab bar + bottom sheets.
  Panel interiors are a pending redesign pass.
- **Persistence:** character is saved to PostgreSQL on disconnect and every 30 seconds.
  Server is fully authoritative; client only renders what it receives.

---

## 12. Open design questions (as of June 2026)

These are live design decisions, not settled:

- **Trench:** authored but under review. Extreme low density at T4. May be reshaped
  to carry a more distinct mechanic identity, or cut.
- **T4 boss intent pass:** defense-break windows, enrage scripts, and tuning not yet
  authored. Currently the T4 bosses are stat-only.
- **Rune wave 1:** rune costs, RP budget, starter fragments, and loadout validation
  need to be authored and balanced.
- **Summoner identity:** frames don't differentiate offense cleanly; a bespoke design
  pass is needed at T4. Currently the weakest-defined archetype.
- **Desert last-stand:** exact trigger (HP threshold? recover-to-X%? cooldown length?)
  not yet settled.
- **Gauntlet (dungeon gauntlet mode):** wave spawner piloted on Mountain T2; full
  rollout gated on T4 balance landing.
- **In-game information design:** how much stat preview / matchup info to surface to
  the player (mob side panels, damage shape tags) is an active design question.
- **Auth:** localStorage UUID only; Discord OAuth is a planned but unscheduled feature.
