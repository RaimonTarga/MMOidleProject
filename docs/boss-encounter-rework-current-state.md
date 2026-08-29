# Boss Encounters (T1–T4) — Current State

**Status:** IMPLEMENTED 2026-08-23 — structure and mechanics only. Numbers are inherited,
not re-pitched.
**Design authority:** [`design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md`](../design_docs/BOSS_ENCOUNTER_REWORK_HANDOFF_T1_T4_2026-08-23.md)
**Code:** `shared/src/data/monsters/bossesT1..T4.ts`
**Tests:** `server/test/bossEncounterRework.test.ts` (new seams + per-lineage identity),
`server/test/bossRework.test.ts` (the earlier structural pass, updated).

If this doc and the code disagree, the code wins.

---

## 1. What changed, in one sentence

Every dungeon boss was rebuilt around **one biome idea that deepens across its tiers**,
the shared T2/T3/T4 phase template was deleted, and the anti-summon cleave that every
slow boss carried was replaced by a targeting rule.

The guiding principle from the handoff: *do not make bosses more complicated, make them
more specific.*

---

## 2. The active roster

26 dungeon bosses across 11 lineages. `void-overlord` (and its wardens / void adds) is
soft-discarded legacy and was **not** touched.

| Biome | Identity in one sentence | Tiers |
|---|---|---|
| Plains | Swarm commander — the herd is half the encounter | T1–T2 |
| Forest | Relentless cadence duel | T1–T2 |
| Swamp | Rot / attrition / hazardous arena | T1–T3 |
| Mountain | Telegraphed catastrophic impacts | T1–T4 |
| Cave | Endurance — your defensive shell erodes | T1–T3 |
| Desert | Setup / control → punishment | T2–T4 |
| Jungle | Hard to catch, then it commits | T2–T4 |
| Tundra | Chill + Ice Armor / Shatter — tempo control | T3–T4 |
| Volcanic | The shared Heat race | T3–T4 |
| Wasteland | The dead refuse to stay dead | T4 |
| Trench | One enormous Devour-focused duel | T4 |

---

## 3. Global changes

### 3.1 The anti-summon cleave is gone

Every slow boss used to carry `aoeAttack` for exactly one reason: a wall of summons could
body-block it, so the boss needed to periodically wipe them to reach its intended target.
That was a technical workaround wearing a mechanic's clothes.

Replaced by **`MonsterDefinition.targeting.prefersPlayers`** (`shared/src/data/monsters/types.ts`,
consumed in `server/src/systems/combat/ai/monsterTargeting.ts`):

- while **any player** is inside the monster's pull range, minions are not aggro
  candidates at all;
- with no player in reach it falls back to minions normally;
- a `prefersPlayers` boss that was pulled by a scouting minion **re-acquires** the moment
  a player comes into range (`server/src/systems/combat/ai/ai.ts`) — otherwise the whole
  rule is defeated by sending the summons in first;
- minions are still hit by anything area-shaped the boss does.

All 26 active bosses carry the flag. Exactly one keeps `aoeAttack`: the **Elder Trench
Serpent**, because it is the size of the arena and a body slam from it plausibly catches
everything nearby. Every other boss's AoE now lives in a charged attack, a pool, or an
aftershock — i.e. it exists because the encounter wants it.

**The "periodic sweep" contract.** The user's chosen policy was *prefer players, but
periodically sweep* — the boss stays on its target and still has a beat that punishes a
summon wall for standing in it. In practice each boss's charged attack is that beat, and
the two bosses that had none (Desert T2, Jungle T3) gained one as part of their identity
work (Scouring Sandburst, Bramble Pounce).

### 3.2 The generic phase template is gone

Removed tier-wide, with no replacement:

| Removed | Where it was | Why |
|---|---|---|
| `apply-soft-cap` + `shed-defense` | Mountain T4, Tundra T4, Volcanic T4, Trench T4 | Existed because "T4 needs a defensive layer". The Tundra case actively fought its own design — a generic anti-burst clip in the one encounter that is explicitly about rewarding burst. |
| `modify-ramp-debuff` to 85% move / 70% attack | Tundra T4 | The player should feel increasingly suppressed, never functionally unable to play. |
| `rampOnCombat` | Volcanic T4 | A private damage ramp running in parallel with the biome-level Heat that is now the encounter. |
| `attack ×4` at 25% | Swamp T3 | Turned the tier's attrition boss into its biggest direct hitter for the last quarter. |
| `cadenceFinisher` | Jungle T4, Trench T4 | Tier-template pressure that said nothing about a predator or a leviathan. Kept on Mountain T4 (see §5). |
| self-`enrage` | Plains T1 + T2 | Plains escalates by concurrency, never by the boss becoming a better duellist. |
| timed `shield` at 50% | Mountain T1, Cave T1 | A generic stall that taught nothing about either encounter. |
| `spawn-adds` | Desert T2 | Desert compresses the biome's controller/dealer pairing into ONE duellist; outsourcing to adds made it a weaker Plains fight. |
| self-`enrage` | Forest T1 (added 2026-08-29, after the rework shipped) | Designer call: the pre-50% attack-speed ramp alone carries the T1 fight's identity; T2 `apex-timberclaw` keeps its own frequency-surge enrage. |

The default replacement is **escalate the thing the encounter is already about** — see
`empower-charged` and `empower-shred` below.

---

## 4. New runtime seams

All five are generic data-driven actions/fields. No boss-ID hardcoding was added.

### `targeting.prefersPlayers` — anti-body-block
See §3.1.

### `empower-charged` (boss action)
Scales the boss's `chargedAttack` at runtime: `multiplierMult`, `cooldownMult`,
`radiusMult`, `castMsMult`, `aftershockRayCountAdd`, `aftershockDamageMult`.

Stored as **multipliers** on `ScriptsBoss.chargedOverride`, so:
- repeated phases **compose** (two phases each passing `cooldownMult: 0.8` land at 0.64);
- the authored definition remains the single source of the base numbers.

Read by `effectiveChargedAttack()` in `server/src/systems/combat/engine/combat.ts` — one
lookup site, so every downstream consumer (slam resolution, aftershock, telegraph, cast
bar) sees the scaled version for free.

### `empower-shred` (boss action) — Cave
Deepens `appliesPlatingShred` mid-fight: `platingPerStackAdd`, `maxStacksAdd`,
`extraThresholds` (additional stack counts at which the threshold poison fires).

⚠ **Trap handled:** `applyStatusEffect` keeps an *existing* effect's cap and data, so a
deepening that lands mid-corrosion has to be written onto the live stack before the
increment. Otherwise a raised ceiling would only take effect on a fresh pull. The test
covers exactly this.

### `raise-dead` (boss action) — Wasteland
Burst resurrection: claims up to `count` corpses within `corpseRange` from the node's
corpse registry and raises each as a risen copy. `maxAliveAdd` permanently lifts the
boss's `raisesDead.maxAlive` ceiling.

Built on the existing necromancy system (`server/src/systems/combat/ai/raiseDead.ts`),
so all its invariants come along unchanged: risen units are worth **zero rewards**, leave
**no corpse of their own** (the tide cannot feed itself), are population-capped, and
**crumble the instant the raiser dies**.

It can only ever give back what the player already killed — an empty registry raises
nothing.

`CORPSE_TTL_MS` was raised **15s → 30s**. Mass Resurrection fires on an HP threshold, not
a timer, so at 15s a phase burst routinely found an empty registry and did nothing at all.
30s still cannot bank a pile from a previous pull.

### `stoke-ramp` (boss action) — Volcanic
Bends the node's ambient ramp (`NodeFeatureSpec.ambientRamp`) for **everyone in the node**:
`rampMsMult` (accumulate *and* decay cadence), `minStacks` (a floor it can no longer cool
below), `maxStacksAdd` (a raised ceiling).

Node-scoped rather than per-player, held in `world.ambientRampOverrides`, so someone
arriving late walks into the same caldera. Merged multiplicatively so phases compose.
Cleared when the boss dies (`monsterDeathEffects.ts`) and on node freeze
(`nodeLifecycle.ts`) — the room cools with it.

### `spawn-pool` (boss action)
Lays a hazard pool centred on the boss, publishing the same ground zone the charged-attack
`pool` rider and `onDeath.spawnHazard` already use. Used for Swamp's Rot Bloom and
Volcanic's floor collapse. Like the charged-attack rider it stamps an `ownerId`, so the
pool is cleared when the boss leaves the world; only `onDeath.spawnHazard` corpse pools
stay ownerless and outlive their maker.

### `apply-shield.shatter` (boss action rider)
The runtime barrier granted mid-fight can now carry the brittle-shell `shatter` rider, so
Tundra's Ice Armor is *thickened by a phase* rather than needing a second definition.
`applyIceShatter` reads the override first, then the static def.

### `chargedAttack.healsSelfPct` — Trench
The caster restores this fraction of its own maxHp when the charged hit **lands**. Never on
a miss, an evade, or an aborted wind-up.

⚠ Only resolves on the **direct-hit** path: a charged attack with an `aoe` goes through
`resolveChargedSlam` and returns before the heal. That is why Devour is authored without
`aoe` — which is also correct for a bite.

### `shellUp.repeatIntervalMs` — Volcanic T3
Turns the once-per-life retract into a cycle: after the shell opens it re-arms, and every
shell after the first ignores `atHpPct` and simply returns on the clock. Gated on holding
an aggro target, so it never spends its life retracted in an empty room.

---

## 5. Per-lineage state

### Plains — swarm commander (T1–T2)
- **T1** `tusked-razorback`: repeating slime trickle + a 50% RALLY (wave + `roar`).
  The old self-enrage is gone.
- **T2** `gorging-razortusk`: trickle plus two rally beats (50% wave + boar, 25% boar pair
  + slimes), all with roars. No self-enrage at either tier.

Contrast Wasteland deliberately: here new creatures keep **arriving**.

### Forest — relentless cadence duel (T1–T2)
Two-hit claw combo and attack-speed ramp, apart from `prefersPlayers`. At T2 a compact
stunning swipe. Forest retires after T2.

> **2026-08-29 — T1 enrage removed.** The T1 `gnarled-greatbear`'s 50% enrage (a
> frequency surge) was previously LOCKED as surviving the generic-enrage cull because
> it read as this boss's whole idea. Designer direction removed it entirely at T1:
> the pre-50% attack-speed ramp alone carries the fight's identity now, and no phase
> fires at 50%. T2 `apex-timberclaw` is unaffected and still carries its own 50%
> frequency-surge enrage (`bossesT2.ts`) — this change is T1-only.

### Swamp — rot / attrition (T1–T3)
Swamp pools are **fight-length hazards**: `durationMs` is 600 000 (10 min) on T1's Bile
Pool, T2's Corrosive Pool and T3's Rot Bloom, so the arena only ever shrinks during an
encounter. They are retired by `clearToxicPoolsByOwner` when the owning boss dies or
despawns (`removeMonsterEntity`), never by expiry. T3's *Spore Pool* is the deliberate
exception — it keeps a short duration because its payoff is the detonation on expiry.
- **T1** `grave-toadeater`: 50% → pools come far sooner and wider (`empower-charged`). The
  slap stays trivial.
- **T2** `mire-gorged-behemoth`: pool leaves Corrosion. 50% → cadence-only enrage (venom
  stacks faster) + pool escalation.
- **T3** `rot-spore-croc-behemoth`: pools carry vulnerability + detonation. 50% → cadence +
  pool escalation; **25% → ROT BLOOM**: the spores thicken (`morph` on the DoT: 13×6 → 17×8)
  and a large long-lived pool floods the arena. This replaces the `attack ×4`.

### Mountain — telegraphed catastrophic impact (T1–T4)
The lineage arc the handoff asked for, intact:

| Tier | Shape | Phases |
|---|---|---|
| T1 `crag-behemoth` | circle Slam | 50% slam harder + sooner |
| T2 `stoneplate-juggernaut` | stronger Slam + defended position (archers, repeating dig-in) | 50% archers + slam wider/sooner |
| T3 `crag-gorged-horn-behemoth` | charge → lock → Slam (`engageSequence`) | 50% harder/wider, 25% sooner + faster |
| T4 `iron-crest-titan` | charge-lock-Earthshatter → delayed radial fault lines | 50% +3 rays & harder aftershock, 25% whole sequence sooner |

`cadenceFinisher` is **kept on T4 only**: a deterministic every-4th heavy hit is the small
version of the same reading skill the Earthshatter tests, and it is the only pressure
between slams on a 4.2s swing timer.

### Cave — endurance / defensive erosion (T1–T3)
Every phase is the corrosion going further:
- **T1** `obsidian-broodmother`: 50% → `empower-shred maxStacksAdd: 3`.
- **T2** `chitinous-dreadbore`: 50% → `platingPerStackAdd: 1` + a Cave Troll (armoured
  support is the sanctioned Cave escalation).
- **T3** `deep-core-burrow-gorger`: threshold poison at 3 and 6; 50% → ceiling +4 with new
  threshold rungs at 9 and 12; 25% → deeper bite + a Cavern Troll.

### Desert — setup / control → punishment (T2–T4)
All three tiers now paint **and** cash their own Sun Mark (`appliesMark` + `markedStrike`),
so the duel alternates setup / punishment without depending on adds, and all three
telegraph the cash-out with a charged attack.

- **T2** `dune-stalker-emperor`: opening alpha strike, mark cycle, slow, and the new
  **Scouring Sandburst**. Dust Djinn adds removed.
- **T3** `dune-carapace-monarch`: melee CONTROLLER → at 50% ranged PUNISHER. The mark
  carries through the morph; the Sandburst becomes the cash-out. 25% → cash-out ~twice as
  often.
- **T4** `dune-throne-sovereign`: three acts — Setup (melee, slow + mark) → Punishment
  (50%, ranged kiter, Rupture empowered) → Execution (25%, drops the kite and commits).

### Jungle — hard to catch, then it commits (T2–T4)
- **T2** `jungle-dread-gorger`: ambush only — opening pounce + one mid-fight pack wave.
  The 50% enrage was dropped (it read as a Forest fight).
- **T3** `apex-bramble-slasher`: gains the predator half — `evasion 0.15`, a strong opening
  strike, and a **Bramble Pounce**. At 50% it melts into the undergrowth (evasion ×2 for
  5s) and comes back with the pounce re-armed harder and far more frequent.
- **T4** `verdant-crown-predator`: two formal states.
  **HUNT** (100–50%): evasion 0.25, very fast, venom chip, rare huge **Killing Leap**.
  **FRENZY** (<50%): evasion → 0 permanently, attack ×1.4, speed ×1.25, leap cooldown ×0.55.
  25% is the frenzy **peaking** (cadence only), not a third idea.

### Tundra — Chill + Ice Armor / Shatter (T3–T4)
- **T3** `frost-plated-rime-mammoth`: moderate `rampDebuff`, periodic Ice Armor with a
  `vulnerability` shatter payoff, big Permafrost Slam. 50% → slam grows; 25% → armour
  thickens and returns sooner (`apply-shield` with a richer shatter).
- **T4** `glacial-patriarch`: `rampDebuff` trimmed to 40%/30% so it leaves room for the
  node Chill (up to 30% move / 24% attack) without compounding into an unauthored root.
  **Glacial Collapse feeds on the Chill you are carrying** (`scalesWithAmbientRamp`,
  `chargedOnly`) — the tell the handoff asked for. 50% → much thicker Ice Armor with a much
  richer shatter (fewer windows, each worth far more); 25% → Collapse wider and sooner.

The T3 boss deliberately does **not** carry chill-scaling: T3 teaches the loop, T4 fuses
the environment into the signature attack.

### Volcanic — the shared Heat race (T3–T4)
- **T3** `cinder-shell-magma-salamander`: the **shell cycle** its name always promised.
  First shell at 85% HP, then every 16s while engaged; while shelled it cannot attack and
  takes 30% direct damage (not the roster's 15% — it repeats, so it must never stall the
  fight), and the shell closing **floods the ground with magma**. Counterplay is authored:
  DoTs tick through at full strength and the cycle is on a clock.
- **T4** `caldera-sovereign`: the Heat race.
  - 100–50%: normal Heat rules, Eruption + Caldera Burn.
  - ~50%: `stoke-ramp` — Heat accumulates ~35% faster and can no longer cool below 2 stacks.
  - ~25%: Heat faster still, floors at 4, ceiling 6 → 9; the floor gives way (`spawn-pool`).

  The Sovereign **feeds on the same ramp** (`scalesWithAmbientRamp`, all hits, not just
  charged). Since the node's Heat payload gives the player *more damage dealt* as well as
  *more damage taken*, the player's own bonus is what arms the boss. That is the race.

### Wasteland — the dead refuse to stay dead (T4)
`charnel-crown-sovereign`, rebuilt:
- arrives with a **small controlled entourage** (3 bone-crawlers + 1 plague-hound,
  `maxAlive: 5`) via a `hpPct: 1.0` phase that fires on engage;
- `raisesDead` on an 8s cadence, `maxAlive: 4`, 520 reach, risen at 0.75 HP / 0.80 damage;
- **50%** Mass Resurrection (`raise-dead count: 3`, ceiling +2) plus a small top-up so
  there are bodies to raise later;
- **25%** a final wave (`raise-dead count: 4`, ceiling +2) driven by a necrotic `roar`;
- personal DoT cut from 9×6 to 5×4 — the entourage is the attrition now.

### Trench — one enormous duel (T4)
`elder-trench-serpent`: slow, enormously durable, heavy ordinary pressure, periodic
`enemyShield`, and one colossal **DEVOUR** — 2.6s cast, 12s cooldown, ×2.7, single-target,
and it **heals the serpent 6% of maxHp** when it lands. Eating it hands the fight back.

- 50% → the bite lands harder and comes sooner.
- 25% → it **armours up** (`apply-shield` 0.34) rather than shedding: this fight ends by
  out-damaging a wall, not by waiting for the wall to fall off.

Removed: `cadenceFinisher`, the 50% enrage, the 25% `shed-defense`.

---

## 6. Known gaps / next steps

1. **Numbers are not re-pitched.** Stat blocks are inherited. Several bosses *lost* a
   source of pressure in this pass (Jungle's cadence finisher, Volcanic's private ramp,
   Wasteland's DoT package, every anti-summon cleave) and several *gained* one (Mountain
   T1/Cave T1 traded a defensive 50% beat for an offensive one). Raw-stat compensation is
   the balance pass's call.
2. **The T1 band is stale.** `docs/briefs/t1-boss-numbers-2026-08-21.md` measured all five
   T1 bosses to one difficulty band *with* the old 50% shields and *with* cleave. Re-run
   `server/bench/bossExam.ts` before trusting it.
3. **`bench/bossExam.ts` still cannot judge absolute pitch** — the reference player
   regressed to 0/30 wins on unchanged T1 bosses after the 2026-08-22 affinity / Barrier /
   Recovery / item / ability commits. See `docs/tier-balance-current-state.md`.
4. **Corpse supply for Mass Resurrection is untuned.** `CORPSE_TTL_MS` (30s),
   `MAX_CORPSES_PER_NODE` (16), the Sovereign's `corpseRange` (520) and `maxAlive` (4)
   together decide how big the tide actually gets. Nobody has measured it.
5. **`spawn-adds` still does not leash to the boss** — pre-existing TODO in
   `bossScripts.ts`; adds use normal AI leash. It matters more now that Wasteland and Cave
   lean on adds.
6. **Volcanic Heat magnitudes are placeholders** (`nodeFeatures.ts`: 6 stacks, 3s, +5%
   out / +8% in). The T4 stoke multiplies a number nobody has balanced yet.
7. **`void-overlord` is untouched legacy.** Not redesigned, not rebalanced, not part of the
   active design table.
