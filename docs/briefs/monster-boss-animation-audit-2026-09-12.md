# Monster & boss attack-animation audit — candidate list

**Date:** 2026-09-12 · **Status: IMPLEMENTED** — see §7 for what shipped, what
changed versus this plan, and what was deliberately left. The candidate list below is
kept as authored, because the reasoning behind each pick is still the reference.
**Zero visual verification: none of it has been seen in motion.** · **Scope:**
(A) mobs whose basic attack is a distinct enough *verb* to deserve its own
`attackStyle`, and (B) named abilities that still have no animation. Follows
[class-animation-pass-handoff-2026-09-12.md](class-animation-pass-handoff-2026-09-12.md).

Sibling doc: [monster-boss-ability-readability-handoff-2026-09-02.md](monster-boss-ability-readability-handoff-2026-09-02.md)
owns *readability* (whether a beat gets a cast, footprint, phase state). This doc owns
*what it draws*. Where they overlap, that doc decides the cast and this one the art.

---

## 0. Census correction — read before planning

The class handoff's starting figures were a raw grep and are wrong against the live
database:

| | Handoff claim | Actual (`MONSTER_DATABASE`) |
|---|---|---|
| Monster entries | 148 | **124** |
| `impact` users | 41 | **39**, of which **6 are testroom dummies** → **33 real** |

The gap is `shared/src/data/monsters/advancedBiomesB.ts`, whose import is **commented
out** at `shared/src/data/monsters/index.ts:14`. Those 18 monsters (`frost-giant`,
`lich`, `lava-titan`, `abyssal-titan`, …) are not in the game — do not author FX for them.

Two more exclusions used throughout: the 6 testroom dummies, and the **Void Overlord /
Void Horror / Void Hulk** trio, which the readability doc deprecates outright.

Also note the monster **ids are legacy** and do not match display names — Moss Rat is
`forest-slime`, Ironclaw Badger is `ironwood-golem`, Field Hare is `plains-slime`,
Boulder Thrower is `peak-archer`, Thorn Spitter is `canopy-sprite`. Always join on id.

---

## 1. How a monster attack is actually drawn — the levers available

Worth stating precisely, because the two parts below map onto different mechanisms.

**Basic attack.** `client/src/render/monsters.ts:365`, inside the `lastAttackAt` check,
calls `spawnAttackEffect(scene, monster.attackStyle, from, to)`, which resolves through the same
`ATTACK_FX_BY_STYLE` table the player uses. **A monster's `attackStyle` is its entire
basic-attack animation** — so Part A is exactly the right lever.

Two consequences of that call site passing **no flags**:

- Monsters cannot carry an element tint. `resolveAttackTint()` reads the *player's*
  equipped weapon, and `AttackFxArgs.tint` is simply never populated for a monster. Any
  "reuse an existing FX in a different palette" recommendation below needs one small
  plumbing change first — the `AttackTint`/`elementColor` infrastructure already exists.
- **Monsters never render the `empowered` / `execution` variants.** `spawnAttackEffect`
  accepts `empowered`, and `fxBearClaws`, `fxBite`, `fxSlash`, `fxArrow` and `fxGunshot`
  all already draw a bigger version when it is set — but for monsters it is always
  `false`. See §4; this is the cheapest unclaimed win in the audit.

**Charged attack.** Two separate slots: `chargedAttack.fx` (the cast/release cue) and
`chargedAttack.aoe.impactFx` (the landing). See **B1** — `impactFx` has exactly one user.

**Abilities and scripts.** `monsterAbilities[].fx`, `castedAttackSpeedBuff.fx`,
`engageSequence.fx`, `bossScript` cast `fx`, `bossPattern` step `fx`.

**And several mechanics have no `fx` field at all** — there is nowhere to put an
animation until the schema gains one. See **B4**.

---

## PART A — mobs that warrant their own `attackStyle`

Judgements are grounded in each mob's authored bestiary profile, not its name. The
"cost" column matters: a good share of these are a data edit plus a palette, not new art.

### A1. Mobs whose own bestiary text names a different verb than their style draws

The clearest cases — the copy and the animation disagree today.

| Mob | Biome | Current style | What the bestiary says | Proposed |
|---|---|---|---|---|
| **Cave Lurker** | cave | `impact` | "keep their pressure simple: **sharp claws**" | `bear-claws`, scaled down |
| **Ironclaw Badger** | forest | `impact` | "compact muscle and **iron-hard claws**" | `bear-claws`, scaled down |
| **Glacier Bear** | tundra | `frost` | a **bear**; "brittle-shell bruiser" | `bear-claws` + frost palette |
| **Glacial Dire-Bear** | tundra | `frost` | a **bear** | `bear-claws` + frost palette |
| **Abyssal Serpent** | trench | `impact` | "Abyssal **Bite** suppresses recovery" | `bite` + trench palette |
| **Elder Leviathan** | trench | `impact` | "the enormous **bite**" (Devour) | `bite` + trench palette |
| **Cinder Hound** | volcanic | `fire` | a **hound**; "charging volcanic hunter" | `bite` + fire palette |
| **Infernal Direhound** | volcanic | `fire` | a **direhound** | `bite` + fire palette |
| **Sand Viper** | desert | `poison` | a **viper** | `bite` + venom palette |
| **Jungle Snake** | jungle | `poison` | "opening **strike** arrives with extra venom" | `bite` + venom palette |
| **Bone Crawler** | graveyard | `poison` | "restless melee dead" — **and it has no DoT at all** | new `bone` |
| **Bone Rat** | graveyard | `poison` | "small graveyard scavenger" — **also no DoT** | new `bone` |
| **Carrion Vulture** | graveyard | `poison` | "its own **peck**" | new `peck` |
| **Vine Chameleon** | jungle | `poison` | "until the **dart** has already landed" (id: `jungle-blowdarter`) | new `dart` |

**Cost:** ten of these fourteen are existing FX plus the tint plumbing from §1 — no new
art. Only `bone`, `peck` and `dart` are genuinely new.

`bear-claws` today has two users, both Forest bosses, and the T2 source comment calls it
"the lineage's identity" — so scaling it onto a badger and a cave lurker needs a
size/weight knob rather than a straight reuse, exactly as the class side handled T1 frames.

Note the two graveyard skeletons are on `poison` while carrying **no `dotEffect`** — that
is a miscategorisation, not a style preference. Graveyard's actual poison carriers
(Plague Hound, Charnel Brute) are separate mobs.

### A2. Ranged mobs whose style FX draws no projectile

`fxPoison`, `fxFire` and `fxFrost` take only a target position
(`client/src/fx/poison.ts:5`, `fire.ts:5`, `frost.ts:5`) — they bloom on the victim and
draw nothing in between. Fine for a melee bite; for a `ranged` mob, damage arrives from
off-screen from an unseen source.

| Mob | Biome | Style | Proposed |
|---|---|---|---|
| Vine Chameleon | jungle | poison | `dart` (also A1) |
| Thornback Chameleon | jungle | poison | `arrow` — it fires **thorns**, and its sibling Canopy Chameleon already uses `arrow` |
| Ash Salamander | volcanic | fire | new `fire-spit` |
| Ashspitter Salamander | volcanic | fire | new `fire-spit` |
| Rime Caster | tundra | frost | new `frost-bolt` |
| Hoarfrost Yeti | tundra | frost | new `frost-bolt` |
| Carrion Vulture | graveyard | poison | `peck` (also A1) |

Two new FX (`fire-spit`, `frost-bolt`) plus two data-only reassignments cover all seven.
This is the most defensible item in Part A — the other ranged mobs (Gargoyles on
`stonespit`, archers on `arrow`, Hadal Stalker on `gunshot`) already draw travel, so this
is an inconsistency rather than a missing concept.

### A3. Splitting `impact` — 33 real mobs on one orange bloom

`impact` is both the largest style and the unrecognised-style fallback. Of the 33 real
users, the deprecated Void trio removes 3 and A1 moves 4 more out (Cave Lurker, Ironclaw
Badger, Abyssal Serpent, Elder Leviathan), leaving **26** that split cleanly into four new
families plus the cases where `impact` is already correct:

| Proposed style | Mobs | Why it is its own verb |
|---|---|---|
| **`gore`** (horn / tusk from a charging body) | 8 — Plains: Boar, Stampede Bull, *Tusked Razorback*, *Gorging Razortusk*; Mountain: Avalanche Ram, Avalanche Tyrant, Cragback Rhino, Granite Mammoth | The largest coherent family. "heavy **horn** strike", "a moving wall of **horn** and dust", and 22 mobs carry `chargeOnAggro` — the collision is the read |
| **`troll-fist`** | 3 — Cave Brute, Cave Troll, Cavern Troll | Heavy but organic; currently indistinguishable from a rock golem |
| **`ape-fist`** | 3 — Jungle Ape, Silverback, Apex Silverback | Already have `chest-beat`; the basic attack should belong to the same creature |
| **`reptile-tail`** | 4 — Stone / Desert / Dune Basilisk, Dune Tyrant | Reptiles whose *named* ability is a gaze; the basic attack needs to not be a punch |
| **`bite`** + trench palette | 2 — *Elder Trench Serpent*, Elder Trench Serpent Warden | The rest of the trench maw family; joins Abyssal Serpent and Elder Leviathan from A1, so all four serpents read alike |
| keep `impact` | 6 — Granite Titan, Mountain Colossus, Cliff Hopper, Moss Rat, Field Hare, Tiny Wisp | Genuine stone-slam and small-critter cases; `impact` is correct for these |

Per the class-side rule ("modulate scale/speed/palette, not three animations per class"),
lineages inside a family share one FX with a knob: Cave Troll → Cavern Troll, Silverback →
Apex Silverback, Avalanche Ram → Avalanche Tyrant.

### A4. Smaller style collisions worth a look

| Mobs | Shared style | Note |
|---|---|---|
| Mire Ooze, Mud Toad | `poison` | An amorphous ooze and a toad's "**sticky** blows" — an `ooze` style would separate the swamp's texture from a venom bite |
| Sand Scorpion, Dune Tyrant | `poison` / `impact` | A scorpion **sting** and a **pincer** smash; neither is a bite |
| Emerald Constrictor | `poison` | Its identity is the cadence **root**, not the venom (§4) |
| Sun / Gilded / Sunshield Scarab **vs** Gravewright | `magic` | Three sun-powered desert kiters share one style with a graveyard **necromancer** |
| Hadal Stalker | `gunshot` | The only `gunshot` user in the bestiary; its ability is a "Pressure **Lance**" |
| — | `void` | **`void` has zero live users.** `fxVoid` exists and is wired but unreachable; its only data users were in the dead `advancedBiomesB.ts` |

---

## PART B — named abilities with no animation

### B1. `aoe.impactFx` exists and has exactly one user

`chargedAttack.aoe.impactFx` lets an AoE charged attack draw its own landing. **Apex
Timberclaw is the only mob in the game that sets it**, and its source comment states the
intent plainly (`shared/src/data/monsters/bossesT2.ts:95-98`):

> *"Its own cue, not the generic shockwave every other AoE charge draws."*

Thirteen of fourteen AoE charged attacks take that generic shockwave:

| Biome | Mob | Ability | radius | release `fx` |
|---|---|---|---|---|
| swamp | *Grave Toadeater* | **Bile Pool** | 105 | `strong-kick` |
| swamp | *Mire-Gorged Behemoth* | **Corrosive Pool** | 115 | `strong-kick` |
| swamp | *Rot-Spore Croc-Behemoth* | **Spore Pool** | 130 | `strong-kick` |
| trench | Elder Leviathan | **Devour** | 170 | `savage-maul` |
| tundra | Permafrost Behemoth | **Glacial Slam** | 150 | `strong-kick` |
| tundra | Hoarfrost Yeti | **Deep Freeze** | 120 | `power-shot` |
| mountain | Crag Mortar | **Bombardment** | 130 | `power-shot` |
| mountain | Boulder Thrower | **Huge Boulder** | 83 | `huge-boulder` (unhandled — B3) |
| mountain | Granite Titan, Mountain Colossus | **Ground Slam** | 120 / 145 | `strong-kick` |
| cave | Cave Brute, Cave Troll, Cavern Troll | **Ground Slam** | 110 / 130 / 145 | `strong-kick` |

The three Swamp bosses are the standout: the lineage's entire signature is *creating
ground hazard*, and it lands as a stone impact. That is also the readability doc's #1
priority (Rot Bloom), so the footprint and the FX should be authored together.

### B2. Named abilities whose cue is generic or borrowed

`strong-kick` and `power-shot` are **not** neutral placeholders — their own source
comments name them the Cliff Hopper's stone-dust shove (the `fxStrongKick` header comment)
and the Ridge Ambusher's arrow release (the `fxPowerShot` header comment). `power-shot` is
additionally the `else` fallback, so most of its users were never assigned it.

**Non-AoE charged attacks on `power-shot` (15):**

| Biome | Mob(s) | Ability |
|---|---|---|
| desert | Stone / Desert / Dune Basilisk | **Petrifying Gaze** ×3 |
| desert | Sand Scorpion, Dune Stalker, Sand Viper | **Numbing Sting** ×3 |
| desert | Gilded Scarab | **Sunbeam** |
| swamp | Bog Witch | **Wither** |
| swamp | Mire Hexer | **Plague Hex** |
| tundra | Rime Caster | **Frostbind** |
| cave | Cave Gargoyle | **Stalactite Shot** |
| mountain | Crag Mortar | **Bombardment** |
| trench | Hadal Stalker | **Pressure Lance** |
| mountain | Ridge Ambusher | **Power Shot** ← the only correct user |

A **gaze**, a **beam**, a **hex**, a **frost bind** and a falling **stalactite** are five
different verbs drawing one arrow — and three of them (gaze / beam / bind) are *lines or
rays*, a shape the arrow tracer actively contradicts. 4–5 new FX retire all fifteen.

**Borrowed cues:**

| Cue | Borrowed by | Note |
|---|---|---|
| `fxDireHowl` | Carrion Vulture's **Necrotic Screech** | a vulture screeching with a wolf's howl |
| `fxDiveBomb` | Cave Troll & Cavern Troll's **Savage Rush** | a ground troll's charge drawn as a bird's dive. Frost Lurker's `rime-pounce` reuse *is* commented as deliberate; the troll reuse is not |
| `fxShieldUp` | `volcanic-guard`, `volcanic-shell`, `trench-carapace`, plus every **Burrow** and **Flee** step | one bubble for a molten shell, an obsidian shell, an abyssal carapace, going underground, and running away |
| `fxStrongKick` | `frost-tusk-impact`, `volcanic-eruption` | frost and lava both drawing stone dust |
| `fxBestialFrenzy` | **Cataclysm**'s 8s cast | see below |

**The worst single instance.** Caldera Sovereign's **Cataclysm** — 8 seconds,
uninterruptible, **radius 2000**, once per life, the largest moment in the game — casts
with `fx: 'frenzy'` (the Greatbear's bear-rage aura) and lands with `fx: 'strong-kick'`.

**Boss-pattern steps.** The 16 `bossPattern` encounters are the most elaborate content in
the game — charge lanes, burrows, feints, three-act stance duels, escape loops — and their
steps are almost entirely `strong-kick` and `shield`. Notable named steps with a borrowed
cue: Crag / Stoneplate / Cragbreaker / **Titan Charge** (lane charges, 620–820px),
**Burrow** and **Deep Burrow**, **Flee** ×3, **Death Sting → Numbing Sting → Execution**
×3 bosses, **Deep Freeze → Shatter / Glacial Collapse**, **Devour**. Iron-Crest Titan's
`fault-lines` step (6 rays, 330px) has **no `fx` field in the schema at all**.

### B3. Emitted and never drawn — two wiring bugs

**`stagger` is dropped.** `server/src/systems/combat/ai/bossPatterns.ts:257-262` pushes a
`boss-fx` with `fx: 'stagger'` every time a boss is staggered out of its pattern. The
client's `boss-fx` handler (the `boss-fx` branch of `client/src/render/combatFx.ts`, ~line 918 — that file is dirty, so search the branch rather than trusting the line) covers six ids —
`slam`, `summon`, `shield`, `morph`, `roar`, `frenzy` — so `stagger` falls off the end of
the `if` chain and draws nothing.

This is the worst miss in the audit, because the stagger *is* the payoff for the only
counterplay these encounters offer: breaking Stoneplate Juggernaut's plate, or breaking
the escape-guard on Dread-Gorger / Apex Bramble-Slasher / Verdant-Crown Predator. The
player does the hard thing and the screen says nothing. Affects 4 bosses via `onBreak`
plus every pattern's recovery step.

**`huge-boulder` is unhandled.** Boulder Thrower's **Huge Boulder**
(`shared/src/data/monsters/mountain.monsters.ts:142`) sets `fx: 'huge-boulder'`, which no
branch handles, so it hits `else → fxPowerShot` and renders as a yellow arrow-bolt.
`fxBoulder` already exists and already serves this same mob's *basic* attack — so its big
telegraphed version currently looks **less** like a boulder than its ordinary one. This is
the exact trap the class handoff warned about ("a typo falls through and TS cannot see it").

Also silent, by omission rather than by bug: the Plains **Rallying Cry** casts carry no
`fx`, so the 2-second cast itself draws nothing and only the nested `roar` action rings.

### B4. Mechanics with nowhere to put an animation

These have **no `fx` field in the schema**, so the animation cannot be authored until one
is added. Listed because they are the mechanics most often described as "having no tell":

| Mechanic | Mobs | What is invisible |
|---|---|---|
| `cadenceFinisher` | Granite Mammoth, Emerald Constrictor, Charnel Brute, Elder Trench Serpent Warden | every 4th hit at ×1.6–×2.4, one with a **root** |
| `cadenceVolley` | Crystal Gargoyle | a three-shot volley |
| `empoweredCooldown` | Cragback Rhino | a timed **×2.5** |
| `openingStrike` | Jungle Snake, Jungle Stalker, Hunting Panther | an amplified first hit (×1.75–×2.2) |
| `rampOnCombat` | Silverback, Apex Silverback | +3%/s attack up to +45% |
| `lowHealthWard` | Granite Titan, Mountain Colossus, Granite Mammoth | **Granite Barrier**, named in all three bestiary entries |
| `enemyShield` | Sunshield Scarab, Glacier Bear, Glacial Dire-Bear | the periodic barrier whose break is the whole "brittle-shell" lesson |
| `onDeath.spawnHazard` | Plague Hound | a toxic pool left on death |
| `onDeath.empowerAllies` | Charnel Brute | allies buffed by its death |

The readability doc asks for **one shared cadence-feedback feature** here, not seven
bespoke systems — and §4 below is most of the answer for the top four rows.

---

## 4. The cheapest unclaimed win: monsters never draw `empowered`

`spawnAttackEffect` already takes an `empowered` flag, and `fxBearClaws`, `fxBite`,
`fxSlash`, `fxArrow` and `fxGunshot` already draw a heavier variant when it is set. The
monster call site (`client/src/render/monsters.ts:365`) passes **no flags at all**, so for
every monster in the game it is permanently `false` — **those existing empowered variants
are unreachable code on the monster path.**

That single omission is why the armed beats in B4 have no tell. Passing `empowered: true`
on the armed beat would give Granite Mammoth, Cragback Rhino, Emerald Constrictor, Charnel
Brute and the Warden a real pre-impact read using art that already exists.

**Prerequisite:** `MonsterView` in `shared/src/protocol/views.ts` carries `lastAttackAt`
but no empowered bit, so the server has to publish one — the same shape of change as the
tint plumbing in §1, and worth doing once for both.

---

## 5. Suggested order

1. **B3** — handle `stagger`; handle `huge-boulder`. Two bugs, near-zero cost.
2. **A2** — `fire-spit` + `frost-bolt`, and move Thornback Chameleon to `arrow`. Seven
   ranged mobs currently fire nothing.
3. **§1 + §4 plumbing** — pass a tint and an `empowered` flag from the monster path. One
   change that unlocks ~10 Part A reuses and 5 cadence tells without new art.
4. **A1** — the fourteen mobs whose own copy names a different verb. Mostly data after (3).
5. **B1** — `impactFx` for the three Swamp pools first (pairs with the readability doc's
   top item), then the Ground Slam family.
6. **B2** — the ray/gaze/beam family (4–5 FX retire 15 misuses), then Cataclysm, then the
   charge lanes, burrows and the Desert three-act duel.
7. **A3** — the `impact` split, biggest family first: `gore` (8) → `troll-fist` (3) →
   `ape-fist` (3) → `reptile-tail` (4).
8. **A4 / B4** — the long tail, and the schema fields the remaining mechanics need.

---

## 6. Method

Census taken by importing `MONSTER_DATABASE` and `BESTIARY_TEXT` from a throwaway script
under `shared/src/` (removed afterwards), run via
`pnpm --filter @mmo-idle/server exec tsx --conditions=development ../shared/src/_flavor.ts`.

Two traps hit while producing this, both worth avoiding next time:

- **Do not grep the data files.** It counted the dead `advancedBiomesB.ts` and produced
  the wrong 148/41 figures in §0.
- **Do not regex-parse `bestiaryText.ts`.** Its keys are *inconsistently quoted* —
  `'desert-basilisk': {` but `sandweaver: {` — so a quoted-key pattern silently drops
  entries and shifts every following mob's text onto the previous mob. That produced a
  first draft in which several mobs were justified with the wrong creature's description.
  `BESTIARY_TEXT` is not re-exported from `shared/src/index.ts`, so import it by relative
  path from inside `shared/`.

Cross-checking emitted vs handled cue ids is worth repeating after any edit — it is how
B3 was found:

```bash
grep -rho "fx: '[a-z-]*'" shared/src/data/monsters/*.ts server/src/systems/combat/ai/*.ts | sort -u
grep -o 'ev.fx === "[a-z-]*"' client/src/render/combatFx.ts | sort -u
```

**Nothing in this document has been seen in motion**, and the class-side pass it follows
is also visually unverified.


---

## 7. What shipped (2026-09-12)

**69 monsters touched, 21 of them bosses** — 39 basic attacks and 56 ability cues.
15 new FX modules in `client/src/fx/`, 26 new exports. Full typecheck clean;
`monsterStyleCoverage` and `monsterEmpoweredBeat` added and both mutation-verified.
The per-mob playtest list is in the session hand-off, and regenerable from the data.

### Deviations from the plan above

1. **Palette variants, not `AttackTint` plumbing.** §1 suggested plumbing the class
   pass's `AttackTint` into the monster path. On implementation that turned out to be
   the wrong seam: `resolveAttackTint()` derives its tint from the *player's equipped
   weapon*, and monster definitions carry no element field at all, so "plumbing the
   tint" would have meant inventing a style→tint map client-side — which is just a
   worse spelling of a distinct style key. Instead `fxBearClaws` and `fxBite` gained
   optional `ClawVariant` / `BiteVariant` params (weight + palette + debris gravity)
   and the new keys pass them. This is how `conduit-beam`/`conduit-bolt` already
   work, and it keeps the choice explicit in data rather than inferred.

2. **`resolveCircle` now honours a pattern step's own `fx`.** Not in the plan, and
   required: boss-pattern `impact` steps resolved through a **hardcoded** generic
   `slam`, so Earthshatter, Shatter, Glacial Collapse, Deep-Core Eruption and
   Cataclysm's detonation were all literally unable to differ no matter what their
   step declared. The hook gained an optional `impactFx` that mirrors the rule
   `aoe.impactFx` already follows on charged attacks — a step that names a cue pays
   off with it, everything else keeps the generic shockwave byte-for-byte.

3. **Wind-up cues draw on `monster-cast-start`.** A pattern `cast` step emits no
   cast-end of its own, so a beat whose whole point IS the wind-up (a committed
   charge, a burrow, an escape) could only be drawn there. `monster-cast-start`
   already carried an optional `fx`, so this needed no protocol change.

4. **`empowered` needed a slice field after all.** §4 hoped the existing
   `monster-hit` event would carry it — it does, but that event has **no
   `monsterId`**, so the snapshot path that actually draws the attack cannot tell
   which monster it belongs to. `PerformsAttack.lastAttackEmpowered` was added and is
   written on **all three** paths that stamp `lastAttackAt`; writing it only on the
   amplified path would latch it and make every later swing read as empowered.

### Tests this pass had to update (and why that was correct)

Three suites encoded the OLD presentation and failed. In each case the behavioural
guarantee they exist to protect was preserved — only the event or id carrying it moved
— so they were updated rather than worked around:

- `caveGroundSlam` and `mountainT2ChargedDefenses` asserted a `boss-fx` `slam`. Setting
  `aoe.impactFx` suppresses that generic shockwave by a **pre-existing** server rule
  (`if (aoe.impactFx) return;`) which Apex Timberclaw already relied on; the tests had
  simply never covered a monster with `impactFx` set. Both still assert an impact FX
  exists, on the planted point, sized to the aoe radius — now on the `monster-cast-end`
  that carries the bespoke cue. The cave one now reads the cue id from the definition
  instead of hardcoding it.
- `tier2SkillPropagation` pinned `sting.fx === 'power-shot'` inside an assertion about
  Numbing Sting being "early and telegraphed". The telegraph guarantee comes from
  `castMs`/`cooldownMs`; the `fx` clause was pinning the *fallback* id the ability
  happened to carry. Repointed at the bespoke cue. (The Petrifying Gaze block directly
  below pins no `fx` at all, so the clause was already inconsistent within that file.)

**Unrelated pre-existing failure:** `hudStatusTooltips` fails on
`missing: cooldown-patience`. Both `shared/src/components/combat/buffs.ts` (which
declares the BuffId) and `client/src/hud/statusHelp.ts` (which lacks the copy) are
unmodified at HEAD, so this fails independently of this pass. It belongs to the
Cooldown-archetype work in flight and was deliberately left alone.

### Verified not to have changed

- **DoT flavours.** `attackStyle` doubles as a fallback element in
  `resolveMonsterDotFlavor`, so every monster's resolved DoT element was snapshotted
  before and after the style changes and diffed: **no flavour changed.** The three
  reassigned mobs that carry a DoT (Ashspitter Salamander, Vine Chameleon, Jungle
  Snake) all resolve by *biome*, which is checked before the attackStyle fallback.
- **The generic slam.** Un-cued pattern impacts still emit the identical `boss-fx`
  `slam` event they always did.
- No stat, damage, radius, cadence or duration was touched anywhere in this pass.

### Left undone, deliberately

- **Dune Tyrant's "Pincer Smash"** still uses `strong-kick`. It is a crushing blow
  with no AoE, so it fits none of the new cues without inventing a sixteenth module
  for one ability; the mob's *basic* attack did move to `reptile-tail`.
- **B4's schema gaps** — `cadenceVolley`, `openingStrike`, `rampOnCombat`,
  `lowHealthWard`, `enemyShield` and the on-death effects still have nowhere to put
  an animation. The `empowered` flag in (4) covers the cadence-finisher and
  timed-empower rows of that table, which was the largest part of it.
- **A4's smaller collisions** (ooze/sting texture, the scarab-vs-necromancer `magic`
  split) and the dead `void` style.
