> **ARCHIVED — implemented 2026-08-08.** Live state: [`../conduit-current-state.md`](../conduit-current-state.md).

# Conduit Flavor Pass — Plan

Naming and art pass for the Summoner/Conduit. The mechanical overhaul shipped
already (`docs/archive/summoner-overhaul-plan.md`); the design source deliberately
excluded "final names, visuals, or sprite prompts" (§ line 65), and this is that
pass.

Revision 4 (2026-08-05). Phases 1-3 and the range layer have SHIPPED, in three
commits on `feat/conduit-flavor-pass`. Section 3's mask recommendation was
tested and LOST — see §3 for what actually happened and why. Only the 13
per-frame/per-spec bodies remain.

Live state is `docs/conduit-current-state.md`; this doc is the plan and the
record of how the decisions were reached.

## 1. Problem

### 1.1 Every branch name is a placeholder

The Conduit is the only class whose skill tree still reads like a spec sheet:

| Class | Tier 1 (frames) | Tier 2 (ranges) |
|---|---|---|
| Striker (cadence) | Flurry / Skirmisher / Breaker | In-Fighter / Lancer / Phantom-Blade |
| Squire (cooldown) | Warrior / Knight / Bulwark | Vanguard / Phalanx / Sentinel |
| Apprentice (dot) | Venom vessel / Ember mage / Rime-Bound | Hexblade / Warlock / Harbinger |
| Slinger (reload) | Scout / Marksman / Artillerist | Breacher / Enforcer / Deadeye |
| Spirit (energy) | Spark / Wraith / Phantasm | Haunt / Shade / Wisp |
| **Conduit (summoner)** | **Light / Balanced / Heavy Frame** | **Close / Mid / Far Range** |

At tier 4 the roster convention is **professions and titles** — Scrapper,
Maestro, Justicar, Berserker, Juggernaut, Assassin, Sunderer, Stalwart, Avenger,
Destroyer, Devout Priest, Duelist, Desperado, Sniper, Bounty hunter, Cannoneer,
Channeler, Aetherist, Invoker, Venomslinger, Cultist, Zealot, Pyromancer,
Firebrand, Icebreaker. The Conduit's nine are concepts instead.

### 1.2 Every summon is borrowed wildlife

`resolveMinionType` in
[spawn.ts:119-133](../server/src/systems/classes/archetypes/summoner/spawn.ts#L119-L133)
resolves the summon sprite. Today a Conduit's formation is a hare, a boar, a
frog, a goat, an ambusher, and a tier-1 boss:

| Condition | `monsterTypeId` | Sprite actually shown |
|---|---|---|
| default (close range) | `slime` | Tiny Wisp |
| mid range | `plains-slime` | **Field Hare** |
| far range | `ridge-archer` | **Ridge Ambusher** |
| bonded (Battle Bond) | `boar` / `ridge-archer` | **Boar** / Ridge Ambusher |
| offense twin | `cliff-hopper` | **Cliff Hopper** (mountain goat) |
| defense twin | `mud-toad` | **Frog** |
| colossus | `crag-behemoth` | **the T1 mountain boss sprite** |

This breaks the rule the visual bible already states (§22): *"Summoner minions
can reuse or reinterpret monster concepts, but should look bound to the player
rather than like wild enemies."*

### 1.3 The Conduit is the only class with no tier-4 player body

[frameMaps.ts:37-46](../shared/src/sprites/frameMaps.ts#L37-L46) documents 45
tier-4 bodies (5 classes × 3 frames × 3 specs), produced **deterministically in
code** by `art/workbench/roster/t3.mjs` — no generation, no gallery, no API
spend. The script excludes one class:

> Conduit is EXCLUDED on purpose: the class is a placeholder pending a major
> rework, so no T3 art is produced for it.

That rework has shipped, so the exclusion is stale. See §5.4.

### 1.4 Dead code on top of the sprite resolver

`MINION_TYPE_PASSIVE_MAP` ([spawn.ts:108-116](../server/src/systems/classes/archetypes/summoner/spawn.ts#L108-L116))
is checked before anything else and keys off `summoner.minion-as-*` passives.
**No skill node authors those any more** — every tier 4 node in `t3Summoner.ts`
ships `mechanicEffects: {}`. Unreachable.

Same one level up: the entire pre-overhaul path system
(`server/src/systems/classes/archetypes/summoner/t3/`) is still registered in
`initSummonerT3()` and still ticks every frame, gated on passives nothing sets.
Removal is in scope — §6.3.

## 2. Locked identity (not up for revision)

From `art/manifests/players.json`, shipped 2026-07-25:

> hooded ritual figure in a **deep red robe** … the whole face covered by a
> **large plain white ceramic mask** … **small white masks hanging behind the
> shoulders**

The hanging mask count already tracks the frame:

| Frame | Player sprite carries | Summon count |
|---|---|---|
| root | two small white masks | 4 |
| Light | **three** small white masks | 6 |
| Balanced | **two** small white masks | 5 |
| Heavy | **one large** white mask | 2 |

Accent hue locked: deep red body, **teal lantern light** (`0x4ad4c8`), the
roster's one deliberate two-tone class, chosen so it does not collide with the
Striker's crimson ([frameMaps.ts:373-376](../shared/src/sprites/frameMaps.ts#L373-L376)).

## 3. Masks vs skulls — RESOLVED: skulls

**Outcome: skulls, over three bake-off rounds and ~$0.18.** The mask
recommendation below was mine, was tested properly, and lost. What the rounds
established, in order:

- **Round 1 (mask on prompt / mask chained / skull control).** Skulls worked
  first try, all three candidates usable. Prompt-only masks came back as
  sculpted human faces. The chained arm was worst: the accepted Conduit body's
  deep red robe became long red hair.
- **Round 2 (blank faceplate / funerary plate / ceramic skull-mask).** Stripping
  every facial landmark — the fix for round 1 — produced featureless eggs with
  two gems. "Funerary plate" produced bathtubs and a sink.
- **Round 3 (human skull, bone / skull-mask / no glow).** All three clean. The
  user picked the no-glow bone skull.

Three transferable lessons, recorded in `art/manifests/conduit-bakeoff.json`:

1. **A mask is not a reachable silhouette at 64px in this style.** Face anatomy
   makes it a face; zero anatomy makes it a blob. Only skull geometry carries a
   three-quarter facing for free (sockets, nasal void, jaw) — which is exactly
   what the players-manifest round-11 note said a blank oval lacks.
2. **The chaining rule has a limit.** "Chain from whichever accepted sibling
   already has the property you keep failing to get" only holds when that
   property is the SUBJECT of the source image. The mask is a small feature on a
   robed body, so the chain asserted the body. Not fixable by lowering strength.
3. **Do not name an object after a household form.** "Plate" won over every
   other term in the prompt.

Consequences accepted: the undead paradigm-shift card is spent at baseline, and
the masks hanging on the player sprite no longer pay off as a promise. The nine
tier-4 names are noun-agnostic and needed no change.

The original argument for masks is kept below, because the reasoning was sound
even though the generator disagreed.

---

Original recommendation: **masks**, de-risked by a bakeoff at phase 3.

The concern that a mask is harder to generate than a skull is correct and
**already measured in this repo**. The Conduit class sprite took eleven rounds,
and round 11's note names the failure mode:

> **A FEATURELESS OVAL MASK CARRIES NO FACING INFORMATION.** Every other class
> signals its turn through head geometry (hood cavity, angled helm front, the
> Slinger's painted eye); a blank oval has no front, so the head defaults to
> face-on however hard the prompt pushes 'south-east'.

Three levers, all proven on this exact object:

1. **Give the mask a front in the prompt** — the round-11 fix: *"seen at a three
   quarter angle, offset toward the right of the head, its right edge catching
   the light and its left side in soft shadow"*, plus negatives `mask facing the
   viewer`, `flat round mask`.
2. **Chain from the accepted Conduit body.** The manifest's own rule: *"chain
   from whichever accepted sibling already has the property you keep failing to
   get — the chain is a structure lever, not just a style lever."*
   `sprites/classes/summoner.png` already contains a correctly turned white
   ceramic mask in the right style. Use it as `initImage`.
3. **Break the oval.** A skull reads because it has sockets, a nasal void and a
   jaw. Give the mask the same landmark budget — deep sockets with teal light
   inside, a defined brow, a mouth aperture, a chipped edge. The per-entry
   differentiators in §5.3 all do this.

Phase 3 is a bakeoff, not a commitment: one entry, mask candidates vs skull
candidates side by side, ~6 images. Precedent: `art/manifests/plains-bakeoff.json`,
`style-probes.json`. **If masks lose, swap the noun — every other part of this
plan (names, matrix, tint, scale, code) stands unchanged.**

Undead stays available: the visual bible permits *"Summoner becoming a
necromantic conductor"* as a **tier-4 paradigm-shift exception**. That is a card
worth one spec (Iconoclast), not the baseline, and not this pass.

## 4. Naming — settled

Fiction: **the Conduit is a mask-bearer. Each summon is one of his masks, worn
by nothing, given a voice.**

### 4.1 Tier 1 — Frames

| Id (unchanged) | Now | New |
|---|---|---|
| `summoner-light` | Light Frame | **Splinter** |
| `summoner-balanced` | Balanced Frame | **Consort** |
| `summoner-heavy` | Heavy Frame | **Effigy** |

`Retinue` was approved first, then displaced when `Procession` won tier 2 (§4.2)
— both mean "group in attendance", so a Retinue/Procession build read mushy.
**Consort** is a musical ensemble (*a consort of viols*), which lands inside the
choir fiction and separates cleanly: Consort is *what the formation is*,
Procession is *how it moves*. Revert to Retinue if the musical reading does not
carry.

### 4.2 Tier 2 — Ranges

| Id (unchanged) | Now | New |
|---|---|---|
| `summoner-range-close` | Close Range | **Vigil** |
| `summoner-range-mid` | Mid Range | **Procession** |
| `summoner-range-far` | Far Range | **Harrier** |

Vigil = a watch kept at your side (melee interception, 55% redirect).
Procession = masks moving with you in ordered formation (the `escort` policy).
Harrier = the code's own word for the policy.

`Guardian` and `Warden` were both rejected as taken: `Abyssal Guardian` is the
trench gauntlet boss and **"Guardians" is the gauntlet UI label for the whole
mechanic** (`gauntletDatabase.ts:525`); `Warden` names five gauntlet bosses
(Stone/Jungle/Frost/Ember/Grave), the `Winter Warden` tier-4 spec, and the Void
Wardens. `Harrier` is free as display text — its 16 code hits are the summoner's
own `SummonerFormationPolicy = 'harrier'` and the spec renamed in §4.3, plus
`canopy-harrier`, an internal id whose player-facing name is "Canopy Chameleon".

### 4.3 Tier 4 — Specializations, as professions

Internal ids unchanged (§6.1 — this is what keeps the change migration-free).
Display strings only. Buff labels are capped at ~6 characters
(`fontSize: 10, whiteSpace: nowrap` in `BuffBar.tsx`).

| Frame | Id (unchanged) | Now | New | Label | Why |
|---|---|---|---|---|---|
| Splinter | `harrier-brood` | Harrier Brood | **Inquisitor** | `ACCUSE` | each unique mask marks the target once; a full brood holds the strongest mark |
| Splinter | `endless-swarm` | Endless Swarm | **Kilnmaster** | `KILN` | a kiln fires many pieces in one batch — eight bodies, one budget spread wider |
| Splinter | `volatile-brood` | Volatile Brood | **Iconoclast** | `SHARD` | literally "image-breaker" — the profession of destroying sacred masks |
| Consort | `coordinated-hunt` | Coordinated Hunt | **Marshal** | `ORDER` | drills the formation into one deterministic coordinated strike |
| Consort | `withering-chorus` | Withering Chorus | **Chorister** | `WITHER` | each unique slot establishes one withering voice |
| Consort | `grand-ritual` | Grand Ritual | **Ritualist** | `RITUAL` | also drops the collision with the live Rites system |
| Effigy | `twin-covenant` | Twin Covenant | **Covenanter** | `TWINS` | binds the offense and defense twins under one covenant |
| Effigy | `battle-bond` | Battle Bond | **Champion** | `BOND` | stops conducting and fights personally beside one bonded mask |
| Effigy | `colossus` | Colossus | **Idolwright** | `IDOL` | maker of one enormous venerated mask |

All nine verified free of collisions across `shared/`, `server/`, `client/`.

`Choirmaster` was displaced by `Chorister` winning `withering-chorus` — the two
rhymed one frame apart, and the choir word belongs to the spec whose mechanic
*is* voices. `Kilnmaster` takes the count spec instead and stays on-fiction for
fired clay.

`Iconoclast` (breaks masks) and `Idolwright` (builds one) are a deliberate
mirror across the light and heavy frames.

## 5. Art

### 5.1 Range is hue + scale, not sprites

This lands summons on the visual grammar `t3.mjs` already documents for player
bodies:

| | Player body (shipped) | Summon (this pass) |
|---|---|---|
| silhouette | class + frame | frame + spec |
| colour | class hue, rotated per spec | **range** |
| discrete prop | head ring = range | — |
| aura | live combat state only | live combat state only |

**Hue.** Mid is the untinted reference. Close warms toward the deep red robe (he
keeps them close); far cools toward the teal lantern light (he casts them out).
Starting values, to tune on sight:

| Range | Tint | Reading |
|---|---|---|
| Vigil (close) | `0xffd0bc` warm | held close, lit by the bearer |
| Procession (mid) | `0xffffff` none | the reference mask |
| Harrier (far) | `0xa8e8e0` cool teal | cast far out, lit only by its own light |

**Scale.** `×1.25 / ×1.0 / ×0.75`, folded into `SUMMONER_RANGE_TUNING`.

**This is an accepted gameplay change, not a cosmetic one.** `sizeMult` drives
the hitbox as well as the sprite —
`resolveMinionHitbox(monsterTypeId, sizeMult)` at
[spawn.ts:165](../server/src/systems/classes/archetypes/summoner/spawn.ts#L165)
and `syncMinionHitbox` — so larger summons are easier for monster AoE and
targeting to catch. It tells the story the tuning already tells: Vigil is
`summonHpMult 1.25` / `redirect 0.55` (built to soak, so a bigger body fits),
Harrier is `0.7` / `0.08` (fragile kiters, so smaller fits). Flag it in the
playtest notes as a live balance variable rather than a settled number.

Clamp at the extremes: Kilnmaster at Harrier range compounds to
`0.72 × 0.72 × 0.75 = 0.39` → **18.7 px**, near the readability floor;
Idolwright at Vigil range hits `2.625 × 1.25 = 3.28` → **157 px** against a
128 px source. Clamp the product to `[0.45, 3.0]`.

### 5.2 Summon sprites — 13

| # | Manifest id | Shown when | Source | Display (mid range) |
|---|---|---|---|---|
| 1 | `conduit-mask-splinter` | Splinter, no spec | 64 | 34.6 px |
| 2 | `conduit-mask-consort` | Consort, no spec | 64 | 48 px |
| 3 | `conduit-mask-effigy` | Effigy, no spec | 96 | 84 px |
| 4 | `conduit-mask-inquisitor` | Inquisitor | 64 | 34.6 px |
| 5 | `conduit-mask-kilnmaster` | Kilnmaster | 64 | 24.9 px |
| 6 | `conduit-mask-iconoclast` | Iconoclast | 64 | 34.6 px |
| 7 | `conduit-mask-marshal` | Marshal | 64 | 48 px |
| 8 | `conduit-mask-chorister` | Chorister | 64 | 48 px |
| 9 | `conduit-mask-ritualist` | Ritualist | 64 | 48 px |
| 10 | `conduit-mask-covenanter-offense` | Covenanter, offense slot | 96 | 77.3 px |
| 11 | `conduit-mask-covenanter-defense` | Covenanter, defense slot | 96 | 90.7 px |
| 12 | `conduit-mask-champion` | Champion, bonded slot | 96 | 84 px |
| 13 | `conduit-mask-idolwright` | Idolwright | 128 | 126 px |

Display = `MINION_BASE_DISPLAY_SIZE` (48) × profile `sizeMult`, before the range
multiplier. Heavy family authored at 96 and Idolwright at 128 so nothing
upscales past ~1.1×.

### 5.3 Style and prompts

Summons render through the **monster** pipeline (`resolveMonsterFrame`,
`MINION_BASE_DISPLAY_SIZE`, monster hitbox bake), so they must sit at creature
fidelity. Creature recipe from `art/manifests/monsters.json`:

```
endpoint: pixflux, styleRef: style/creatures.png, noBackground: true
params: { outline: lineless, shading: highly detailed shading,
          detail: highly detailed, view: low top-down, direction: east,
          initImage: sprites/classes/summoner.png }   ← §3 lever 2
```

…carrying the **player** palette so they read as his: white ceramic, deep-red
cord and cloth scraps, teal light in the sockets. That satisfies bible §22's
"bound to the player rather than like wild enemies".

Invariants restated in **every** prompt (the players manifest established that
invariants must be repeated per entry, never inherited from the chain):
floating with no legs and no ground contact, no body below the mask beyond
trailing cloth, teal-lit sockets, plain fired ceramic, three-quarter view, mask
seen at a three-quarter angle with one edge lit and one side shaded.

Negatives, every entry: `mask facing the viewer`, `flat round mask`, `person`,
`head`, `body`, `hands`, `standing`, `ground`, `shadow`, `pedestal`.

Per-entry differentiators — each is also a landmark that breaks the blank oval
(§3 lever 3):

- **Splinter** — small, thin, keen; a fragment rather than a whole mask.
- **Consort** — the canonical whole mask, calm and symmetrical.
- **Effigy** — large, thick-walled, heavy-browed; more weight than face.
- **Inquisitor** — a judging cast; one socket lit far brighter than the other.
- **Kilnmaster** — smallest and simplest, kiln-scorched; must read at 25 px.
- **Iconoclast** — hairline cracks, a chipped edge, light leaking from the fractures.
- **Marshal** — parade-formal, rigid symmetry, a drill face.
- **Chorister** — a wide open mouth aperture; the voice is the mechanic.
- **Ritualist** — inscribed rim, gilded markings, ceremonial.
- **Covenanter offense / defense** — sharp narrow vs. broad blunt; same family, opposite build.
- **Champion** — a half-mask; the matching half implied on the Conduit himself.
- **Idolwright** — monumental, weathered, a carved votive face rather than a worn one.

### 5.4 The Conduit's own body is NOT recoloured

**Decision: hue shifts apply to summons only. The Conduit body stays exactly as
shipped — deep red robe, white ceramic mask, three frame bodies.**

The other five classes carry their tier-4 identity on their own body:
`t3.mjs` colourises each tier-2 body to an absolute per-spec hue and produces
45 frames in code. The Conduit is excluded from that script and **stays
excluded**.

Two reasons this is right rather than merely cheap:

1. **It is what the class is.** A Striker's spec shows on their body because
   they swing the sword. The Conduit does not fight — `recalculatePlayerStats`
   returns `cannotAttack: true` and the masks do all of it. Putting spec
   identity on the masks and leaving the bearer unchanged says exactly that: the
   man in the red robe is the constant, and what he sends out is the choice.
2. **It removes the one real risk in this plan.** §5.4 of revision 3 flagged
   that `t3.mjs` only skips pixels above `v > 0.95`, so the **shaded side of the
   white ceramic mask would take the spec hue** — nine Conduits with tinted
   masks, breaking the identity §2 locks. Not recolouring the body deletes that
   failure mode instead of guarding against it.

Consequence to accept: the Conduit is the only class whose player body does not
change at tier 4. If that reads as too static in play, the fix is **bespoke
generated bodies** for the specs that genuinely break the class silhouette —
the same exception `t3.mjs` already reserves for Assassin, Devout Priest and
Voidwalker, with Iconoclast as the Conduit's candidate if the undead
paradigm-shift card (§3) is ever spent. That is a separate, priced pass, not
this one.

Spec is already the **strongest** channel the summons have — a bespoke
silhouette each (§5.2), which outranks any recolour. So no per-spec hue is
needed on summons either; their hue channel stays allocated to range (§5.1),
and the two never compete.

## 6. Code changes

### 6.1 Naming — display strings only

Every id stays. Ids carry persistence, tuning keys, buff ids, concept-icon
filenames and tests, so leaving them alone makes this migration-free.

| File | Change |
|---|---|
| `shared/src/data/skillTree/rootsAndFrames.ts` | `name:` on 3 frame + 3 range nodes; refresh `description:` |
| `shared/src/data/skillTree/t3Summoner.ts` | `name:` on all 9 spec nodes; refresh `description:` |
| `server/src/.../summoner/specs/buffs.ts` | `logSourceName` + `label` per spec, in both the projection and the `defineBuff` descriptor default |
| `client/src/hud/BuffBar.tsx` | verify only — 6-char budget at `fontSize: 10, whiteSpace: nowrap` |

Untouched: `SummonerSpecialization` union, `SUMMONER_SPECIALIZATION_BY_SKILL_ID`,
`SUMMONER_SPECIALIZATION_TUNING`, buff ids, `conceptIcons.ts`, the generated
`summoner-*.png` concept icons, and all three summoner tests.

### 6.2 Sprites, tint, scale

| File | Change |
|---|---|
| `art/manifests/monsters.json` | 13 entries under a `── Conduit summons ──` block, `status: pending` |
| `shared/src/components/archetypes/summoner/isMinion.ts` | replace the `MinionMonsterType` union with the `conduit-mask-*` ids |
| `shared/src/sprites/frameMaps.ts` | new `MONSTER_FRAMES` entries; retire the `slime` alias (keep `tiny-slime` → tiny-wisp, the unrelated T0 tutorial monster); add `SUMMON_RANGE_TINT` beside `PLAYER_ACCENTS`. **No `PLAYER_FRAMES` tier-4 entries** — §5.4 |
| `shared/src/data/summoner.ts` | add `sizeMult` to `SummonerRangeTuning` (1.25 / 1.0 / 0.75) |
| `shared/src/systems/summonerProfile.ts` | fold the range multiplier into slot `sizeMult`; clamp the product to `[0.45, 3.0]` |
| `server/src/.../summoner/spawn.ts` | delete `MINION_TYPE_PASSIVE_MAP` (dead, §1.4); rewrite `resolveMinionType` off `profile.frame` + `profile.specialization` + slot role |
| `server/src/.../summoner/spawn.ts` | `attackStyle` currently resolves via `MONSTER_DATABASE.get(monsterTypeId)`, which misses for every new id and silently lands on `'impact'` — replace with an explicit style per `attackMode` |
| `client/src/render/minions.ts` | apply the range tint; comments still say "slime"/"Slimes are anonymous"; `fallbackColor: 0x55cc66` (green) → `0x4ad4c8` (Conduit teal) |
| `art/workbench/roster/t3.mjs` | **not touched.** Its Conduit exclusion comment gets one line updated in §6.4 to say the exclusion is now deliberate, not pending |

**Tint is derived client-side, no protocol change.** `MinionView` carries
`ownerPlayerId` and `PlayerView` already carries `unlockedSkills`
([views.ts:85](../shared/src/protocol/views.ts#L85), populated at
[:325](../shared/src/protocol/views.ts#L325)), so the renderer resolves the
owner's range locally. Tint is pure presentation, so client-side resolution is
architecturally correct. Fall back to no tint when the owner view is absent.

**Scale is server-side**, because `sizeMult` is networked and drives the hitbox.

`MinionMonsterType` is a networked field, but **minions are never persisted**
(CLAUDE.md: *"Never persist … or minions"*), so the union change needs no
migration — only client and server deployed together.

After packing, `pnpm bake:hitboxes` must run so `resolveMinionHitbox` picks up
the new frames. Never hand-edit the packed atlas.

### 6.3 Dead code removal

- `server/src/.../summoner/t3/` entire directory (`paths/cave.ts`,
  `paths/plains.ts`, `paths/mountain.ts`, `core/*`) — the pre-overhaul
  Predator's Howl / Swarm / Acid Brood / Grazing Field / Trampled Path / Vital
  Burst / Stone Sentinel / Rockslide Cover / Mountain Guardian paths
- `initSummonerT3()` / `updateSummonerT3()` and their `combatBootstrap` wiring
- `sentinelPlacement.ts` and the Stone Sentinel branches in `spawn.ts` and
  `relocateMinionsForOwner`
- `pickLivingMinionOfType` in `damageSponge.ts` if the paths are its only caller
- orphaned `summoner.*` passive keys in `shared/src/passives.ts`
- `summoner-howl-banner` / `summoner-trample-boon` / `summoner-debuff-immune`
  concept icons and their `conceptIcons.ts` entries
- stale references in `shared/src/systems/summonerHud.ts`

Land as **its own commit**, before the naming commit, so a bisect can tell a
deletion regression from a rename regression.

### 6.4 Docs

| File | Change |
|---|---|
| `docs/conduit-current-state.md` | **badly stale** — its entire "Tier 3" section documents the paths §6.3 deletes, and its tier 0-2 numbers predate the overhaul. Rewrite against the shipped code. |
| `design_docs/.../player-visual-identity-bible.md` | §21 says *"Summoner is not fully locked and needs its own identity pass later"* — this is that pass. Lock the mask family; record range = hue + scale. |
| `design_docs/.../overhaul-roadmap.md` | lines 78 and 163 track "swap minion visuals" and "Summoner/Conduit identity pass" — mark done |
| `art/workbench/roster/t3.mjs` | its exclusion comment says Conduit is skipped because the class is "a placeholder pending a major rework" — the rework shipped, so restate it as the deliberate §5.4 decision |
| `docs/system-rework-status.md` | scoreboard row |

## 7. Sequencing

| Phase | Work | Cost | Status |
|---|---|---|---|
| 1 | Dead code removal (§6.3) | — | ✅ `c8e419c` |
| 2 | Naming (§6.1) | — | ✅ `7e40cba` |
| 3 | Mask-vs-skull bake-off | $0.18 | ✅ 3 rounds, skulls won (§3) |
| 4-6 | **13 per-frame/per-spec bodies** | ~$0.27 | ⬜ **the only work left** |
| 7 | Wire sprites, tint, scale | — | ◐ range layer + one shared body shipped (`fa4514a`); per-spec bodies pending phase 4-6 |
| 8 | Docs (§6.4) | — | ✅ |

Phases 1-2 landed playable before any art existed. The tier-4 player-body phase
from revision 3 is removed — §5.4.

### Shipped beyond the original plan

Things the plan did not anticipate, all in `fa4514a` unless noted:

- **Base display size 48 → 32 → 28.** Two user-driven passes. Shrinks hitboxes
  too, since `MINION_BASE_DISPLAY_SIZE` feeds `resolveMinionHitbox`.
- **1px `#14181a` outline**, baked deterministically by
  `art/workbench/outline-summons.mjs` from preserved raw art. Colour chosen by
  testing against the eight real wang ground colours (`#bea581` desert down to
  `#212b1f` jungle): a pale skull only fails to read on the LIGHT biomes, so a
  dark outline works where it is needed and vanishes where it is not. The
  Conduit's own accent teal was tested and rejected — at luminance ~0.75 it
  barely separates from desert or tundra.
- **Per-range attack FX** (`client/src/fx/conduitSummon.ts`): Procession fires a
  fast red orb (120ms), Harrier a red beam (140ms), Vigil the melee thump. Both
  ranged styles share one red ramp — shape separates them better than hue.
- **Lunge gate.** Summons lunged unconditionally because `minions.ts` hardcoded
  `monsterIsRanged: false`. Now derived from attack style via a shared
  predicate, refreshed every tick because unlocking a range does not respawn
  live summons.
- **DEV skin switcher**, Shift+[ / Shift+] (`client/src/render/summonSkins.ts`).
  Plain brackets stay on the ground bake-off. The two losing round-3 candidates
  stay in the atlas, reachable only here, until a winner is picked.
- **Clamp floor raised 0.45 → 0.6.** The planned floor assumed a 48px base; at
  28px it landed at 12.6px. 0.6 gives ~17px.
- **Range size multipliers shifted up one step** (1.25/1.0/0.75 →
  1.5/1.25/1.0) after playtest.

Standing rule throughout: I generate and hand off to the gallery; I never accept
or reject candidates myself. `art:generate` spends real credits — always
`--dry-run` first, never generate while the review gallery is open.

## 8. Cost

**Spent so far: ~$0.18** across three bake-off rounds (27 images). Estimates
from `art:generate --dry-run` ran ~9x high — it quoted $0.54 per round against
$0.06 actual — so price from the lock file, not the estimate.

**Remaining: ~$0.27** for 13 entries × 3 candidates at roughly $0.007/image,
plus regen rounds. Balance was $1.94 after round 3.

## 9. Decisions on record

| # | Decision | Date |
|---|---|---|
| 1 | Masks, not skulls — with a bakeoff escape hatch at phase 3 | 2026-08-05 |
| 2 | No per-range sprites; range = hue tint + ±25% scale | 2026-08-05 |
| 3 | Range scale accepted as a **real** change including the hitbox | 2026-08-05 |
| 4 | Frames: Splinter / Consort / Effigy (Consort displaced Retinue, §4.1) | 2026-08-05 |
| 5 | Ranges: Vigil / Procession / Harrier | 2026-08-05 |
| 6 | Specs renamed to professions, all nine (§4.3) | 2026-08-05 |
| 7 | Dead `t3/` path system removed | 2026-08-05 |
| 8 | **Recolours/hue shifts affect summons only.** The Conduit body is never recoloured; no tier-4 player bodies (§5.4) | 2026-08-05 |
| 9 | 13 summon sprites (frame × spec, +1 for the Covenanter split) | 2026-08-05 |
| 10 | **Skulls, not masks** — decision 1 reversed by three bake-off rounds (§3) | 2026-08-05 |
| 11 | Base display size 28px; range multipliers 1.5 / 1.25 / 1.0; clamp floor 0.6 | 2026-08-05 |
| 12 | Outline `#14181a`, chosen against real ground colours, not the class accent | 2026-08-05 |
| 13 | Procession tint `#cdbde8` — a warm/violet/cool triad, separable at 20px | 2026-08-05 |

Decision 8 supersedes revision 3's tier-4 player-body phase and its per-spec hue
table. Summon hue stays allocated to **range**; summon spec identity is carried
by bespoke silhouettes, which is the stronger channel anyway.
