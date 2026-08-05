# Player Visual Identity Bible v0

**Purpose:** Baseline rules for player character visuals, class silhouettes, frame/body variation, progression readability, animation scope, and sprite production.

This document supports:

- `world-and-presentation-bible.md`
- `biome-and-creature-bible.md`

It is not a final art style guide.  
It is not a PixelLab prompt pack.  
It is not an implementation spec.

Its job is to define how player characters should look, how they should visually progress, and how to keep the sprite workload sustainable.

---

## 1. Core Player Visual Premise

Player characters are **faceless, genderless vessels**.

They begin as unformed spirits and gradually gain identity through class, frame, path, tier, aura, and cultivated power.

The player character should not read as a normal human adventurer with a fixed face, sex, backstory, or social role. The character is a spirit taking form.

The core fantasy:

> A ragged, faceless soul becomes a defined combat vessel through cultivation.

Visual identity should come from:

- silhouette,
- body weight,
- armor mass,
- robe/cloak shape,
- masks/hoods/helms,
- aura,
- class VFX,
- path ornaments,
- tier refinement,
- and attack expression.

Visual identity should **not** come from:

- visible equipped weapons,
- human facial features,
- male/female body coding,
- conventional fantasy faction uniforms,
- or highly specific personal identity.

---

## 2. Faceless Rule

Player characters should remain faceless at all stages.

Faces may be hidden by:

- hoods,
- helmets,
- masks,
- shadow,
- glowing voids,
- painted/false eyes,
- veils,
- abstract faceplates,
- or light.

Even high-tier ascended forms should remain faceless or masked.

The character can become more elaborate, divine, monstrous, or abstract over time, but should not become more conventionally human.

This preserves:

- player projection,
- sprite consistency,
- gender neutrality,
- the unbound soul fantasy,
- and the game's spiritual/dreamlike identity.

---

## 3. Progression Stages

The visual bible should use **player-facing visual stages**, not internal code tiers.

Internal implementation may start at `tier: 0`, but visually and player-facing progression is easier to understand as stages.

| Visual Stage | Meaning | Approx. Mechanical Mapping | Visual Change |
|---:|---|---|---|
| Stage 0 | Unformed | tutorial / no class | ragged vagrant spirit |
| Stage 1 | Class Identity | class/root selection | major class silhouette appears |
| Stage 2 | Frame Identity | light / balanced / heavy | body weight and armor mass change |
| Stage 3 | Range Identity | close / mid / far | small VFX, stance, or posture accent |
| Stage 4 | Path Identity | T3 path / deeper specialization | accent overlays, aura, glyphs, material changes |
| Stage 5+ | Spec / Ascension Refinement | T4+ specs and later tiers | stronger overlays, aura, rare full-body exceptions |

This document uses the stage terminology above.

---

## 4. Production Scope Rule

Do not generate a completely unique full-body sprite for every class/path/tier combination.

That approach scales badly.

The sustainable direction is a **hybrid layered sprite system**:

1. **Core body sprites** define class + frame.
2. **Small overlays** define range, path, tier, and specializations.
3. **VFX** define attacks, damage profile, aura, and active class fantasy.
4. **Rare full-body exceptions** are allowed only for major paradigm-shift specs.

The main production anchor should be:

> **6 classes × 3 frames = 18 class-frame body bases.**

These 18 bodies carry most of the readable player identity.

Additional assets should mostly be overlays, auras, masks, hoods, shoulders, glyphs, glows, or VFX rather than full replacement sprites.

---

## 5. Root Sprite Rule

Stage 1 class identity should exist visually, but the 18 class-frame bodies are the main production anchor.

Recommended approach:

- Stage 0: one shared unformed/vagrant sprite.
- Stage 1: one simple root silhouette per class, or a light/default version of the class body.
- Stage 2: one full base body per class-frame combination.

If class choice and frame choice happen very close together in gameplay, Stage 1 root sprites can be lower priority or represented with temporary/simple variants.

If there is meaningful time between choosing class and choosing frame, Stage 1 should have distinct root silhouettes.

Priority order:

1. Stage 0 vagrant sprite.
2. 18 class-frame base sprites.
3. 6 class-root sprites if needed.
4. Path/tier overlays.
5. Rare full-body spec exceptions.

---

## 6. Weapon-Agnostic Rule

Player sprites should not display equipped weapons.

This is a locked visual direction.

Weapons in this game are not literal held objects. They are combat modifiers, attack expressions, or cultivated methods.

A character can use a sword item and still attack at range. A Slinger can reload without holding a gun. A Spirit can discharge energy without a staff. A DoT class can apply poison, fire, or frost without needing a visible wand.

This protects the art pipeline and supports the game's abstract/dreamlike identity.

Weapon effects should be expressed through:

- attack VFX,
- projectile VFX,
- hit effects,
- sound effects,
- class animation,
- damage profile,
- and UI/item iconography.

Not through the player sprite holding the weapon.

---

## 7. Equipment Visibility Rule

Equipped items should generally not appear on the player sprite.

Default rule:

> Class, frame, path, tier, and spec define the player body's appearance. Gear modifies mechanics and attack expression, not the visible outfit.

Possible future exception:

- very special items may grant aura, glow, trail, halo, shadow, or elemental overlay effects.

But normal weapons, armor, charms, and boots should not require visible sprite changes.

Avoid building a full paper-doll equipment system.

---

## 8. Animation Scope Rule

Player sprites should remain simple.

The game should rely mostly on engine-driven animation and VFX rather than bespoke sprite animation frames.

Recommended baseline:

- static or near-static character sprite,
- engine-driven movement,
- engine-driven melee lunge,
- engine-driven recoil/impact,
- projectile/VFX for ranged attacks,
- class/path hit effects,
- optional simple hover/bob for floating classes.

Avoid requiring every class and frame to have full idle/walk/attack animations.

The Phaser lunge-style attack animation is a strength and should be preserved.

It gives combat feel without multiplying sprite workload.

---

## 9. Layering Model

The preferred visual stack:

```text
base shadow / ground marker
body base sprite
frame/body silhouette details
path overlay
tier refinement overlay
aura / glow
attack VFX
status VFX
```

Potential overlay categories:

- hood,
- helmet,
- mask,
- pauldrons,
- cloak/backpiece,
- chest emblem,
- gauntlets,
- boots shape,
- floating glyph,
- halo,
- hand glow,
- eye/faceplate mark,
- aura ring,
- trailing particles.

Avoid trying to separate every armor component from the start.

The goal is not a fully modular armor doll.  
The goal is readable progression with a manageable number of reusable parts.

---

## 10. Frame Visual Language

Frames are the main body-weight axis.

Every class should have light, balanced, and heavy visual variants.

### Light Frame

Reads as:

- faster,
- narrower,
- more agile,
- less armored,
- more cloth/leather,
- more motion/aura,
- smaller shoulder mass,
- lighter feet,
- sharper silhouette.

Should not look weak or regressive.  
It is still a tier-up; it simply allocates visual budget toward speed.

### Balanced Frame

Reads as:

- stable,
- clear class fantasy,
- medium armor/cloth,
- readable default silhouette,
- neither fragile nor bulky.

This is the class's most neutral identity.

### Heavy Frame

Reads as:

- slower,
- bulkier,
- tougher,
- more armored,
- more grounded,
- larger shoulders/chest,
- stronger helmet/hood/robe mass,
- less exposed motion.

Should not become a generic tank unless the class fantasy supports it.

A heavy Spirit should not look like a Squire.  
A heavy Slinger should not look like a Squire.  
Frame changes body weight, but class identity stays primary.

---

## 11. Range Visual Language

Range choice should not create a new body sprite.

Range should be expressed through small VFX, posture, or attack presentation.

### Close

Possible visual cues:

- tighter stance,
- stronger lunge,
- denser aura near hands/body,
- shorter attack trail,
- impact-heavy hit VFX.

### Mid

Possible visual cues:

- default attack range,
- neutral aura,
- standard hit/projectile effects.

### Far

Possible visual cues:

- longer projectile trail,
- extended hand glow,
- more distant slash/shot effect,
- lighter body movement,
- subtle targeting glyph.

Range is mechanically important, but it should not multiply sprite production.

---

## 12. Path and Spec Visual Language

Paths should mostly use overlays and VFX.

A path may change:

- aura color,
- glyph shape,
- mask/hood details,
- shoulder ornament,
- cloak trim,
- hand glow,
- particle effect,
- projectile/hit VFX,
- body material accent.

Most paths should not require full new body sprites.

### T4+ Paradigm Shift Exception

Some later specializations may represent a genuine identity break.

Examples:

- Squire branch becoming assassin-like.
- Squire branch becoming devout beam-priest-like.
- Spirit branch becoming more phantasmal or singularity-like.
- Summoner branch becoming undead- or elemental-focused.

For these cases, full-body sprite exceptions are allowed.

Rule:

> A full-body exception is allowed when the specialization meaningfully breaks the existing class-frame silhouette.

This should be used sparingly.

Inconsistency is acceptable if the spec fantasy justifies it. A paradigm shift should feel special.

---

## 13. Class Color and Icon Rule

Each class should have a subtle identity color and an icon.

Class colors should help UI readability and VFX identity, but should not rigidly override biome, path, or tier effects.

Class icons are recommended for:

- skill tree nodes,
- class selection,
- HUD badges,
- tooltips,
- party UI,
- future class guides,
- and PixelLab prompt consistency.

Class colors should be treated as accents, not uniforms.

Possible direction:

| Class | Working Name | Accent Direction |
|---|---|---|
| Cadence | Striker | steel, red, warm gold, slash-white |
| Cooldown | Squire | iron, white, blue, pale gold |
| Reload | Slinger | amber, yellow, ivory, targeting-eye accent |
| Energy | Spirit | cyan, violet, pale blue, spectral white |
| DoT | Apprentice | poison green, ember red, frost blue depending path |
| Summoner | Conduit | teal, pale green, ghost-light, lantern tones |

These are not locked final palettes. They are directional identity notes.

---

## 14. Stage 0 — Vagrant Spirit

The starting character is a **vagrant spirit**.

Visual identity:

- ragged hooded figure,
- faceless,
- genderless,
- small/simple silhouette,
- worn cloth,
- dim inner glow,
- no visible weapon,
- minimal ornament,
- weak but not pathetic.

The vagrant should feel like an unformed vessel, not a peasant or adventurer.

It should be simple enough that later class forms feel like a clear visual upgrade.

---

## 15. Class Identity Rules

Each class should be visually distinct even when weapon-agnostic.

Class visuals should express the combat pattern first, fantasy label second.

The original class design is top-down: mechanic first, label/fantasy after. The visual design should preserve that.

---

## 16. Cadence / Striker

**Mechanic identity:** hit rhythm, repeated buildup, empowered finisher.  
**Visual fantasy:** medium-armored rhythm fighter.

The Striker should not be just a generic warrior. It should look like a vessel trained around timing, repeated impact, and controlled aggression.

Visual language:

- medium armor,
- leather + light metal,
- chainmail hints,
- banded armor,
- hood/helm or masked face,
- slash-like aura,
- rhythmic markings,
- balanced stance,
- clean attack trails.

Frame notes:

- Light: faster duelist/flurry silhouette.
- Balanced: skirmisher, clean medium armor.
- Heavy: breaker, bigger shoulders/gauntlets, slower finisher energy.

Attack expression:

- slashes,
- impact arcs,
- rhythm pulses,
- finisher flash.

No visible sword is required.

---

## 17. Cooldown / Squire

**Mechanic identity:** patience, preparation, timed execution.  
**Visual fantasy:** heavy armored vessel / knightlike ascendant.

The Squire is the most visibly armored root.

It can carry knightly language, but should not feel like a soldier in a kingdom.

Visual language:

- plate armor,
- heavy helm or hooded helm,
- large chest/shoulder mass,
- grounded stance,
- cloak or tabard-like shapes,
- shield-like body,
- pale light or iron glow,
- patient weight.

Frame notes:

- Light: still armored, but more aggressive and mobile.
- Balanced: classic knight/squire identity.
- Heavy: fortress/bulwark silhouette.

T4+ paradigm shifts are allowed.

Examples:

- assassin-like light spec,
- devout beam-priest heavy/spec,
- executioner,
- sanctuary knight,
- armored channeler.

These can break the base silhouette when justified.

Attack expression:

- delayed burst,
- execution flash,
- heavy impact,
- channeled beam for specific specs.

No visible weapon is required.

---

## 18. Reload / Slinger

**Mechanic identity:** clip rhythm, burst window, reload pause, ranged pressure.  
**Visual fantasy:** hooded ranged vessel with targeting/volley symbolism, but no guns.

The Slinger should not look high-tech.

It can use shot, reticle, and reload language, but filtered through dreamlike fantasy.

Current strong motif to preserve:

- hooded figure,
- covered face,
- mask with one painted/false eye,
- divine or ritual archer-like armor,
- scope/reticle symbolism without technology.

Visual language:

- light-to-medium armor,
- hood,
- mask,
- single-eye motif,
- targeting glyph,
- wrist/hand shot effects,
- floating shot motes,
- quick cloak/scarf shapes,
- evasive silhouette.

Frame notes:

- Light: scout, sharp and mobile.
- Balanced: marksman, steady and composed.
- Heavy: artillerist, broader and more anchored, but still not a gunner.

Attack expression:

- gunshot-like VFX is allowed,
- force shot,
- bright dart,
- glyph bullet,
- spectral bolt,
- volley particles,
- reload pulse.

No visible gun, bow, or crossbow is required.

The class can feel like it is shooting because the world is dreamlike and combat expressions do not need literal physical weapons.

---

## 19. Energy / Spirit

**Mechanic identity:** energy buildup, discharge, shield, spectral force.  
**Visual fantasy:** floating robe / faceless spirit.

This is the most non-physical class identity and should stay visually distinct.

Visual language:

- floating robe,
- no visible feet,
- hidden hands or glowing sleeves,
- hooded void face,
- smooth silhouette,
- energy core,
- shield aura,
- spectral glow,
- minimal armor unless heavy frame.

Frame notes:

- Light: Spark, fast and small, high motion/glow.
- Balanced: Wraith, clean spectral body.
- Heavy: Phantasm, denser robe/armor mass, heavier aura, slower but more powerful.

Attack expression:

- energy pulse,
- discharge burst,
- shield flash,
- spectral projectile,
- AoE ripple.

No staff or weapon required.

---

## 20. DoT / Apprentice

**Mechanic identity:** lingering wounds, poison/fire/frost profiles, damage over time.  
**Visual fantasy:** hooded wound/curse/element vessel.

The Apprentice can use mage/warlock language, but should avoid becoming a generic wizard.

It should look like a vessel that marks enemies with lasting damage.

Visual language:

- hooded robe or light armor,
- stained cloth,
- sigils,
- sealed sleeves,
- elemental wound marks,
- poison/fire/frost accents,
- ritual but not scholarly,
- faceless mask/hood.

Frame/path notes:

- Poison / Venom Vessel: agile, green/toxic accents, small sharp markings.
- Fire / Ember Mage: warmer glow, ember cracks, medium robe/armor.
- Frost / Rime-Bound: heavier, pale/blue, frozen edges, slower silhouette.

Attack expression:

- poison trails,
- ember wounds,
- frost marks,
- lingering particles,
- stack build-up VFX.

No wand, staff, or visible weapon required.

---

## 21. Summoner / Conduit

**Mechanic identity:** minions, splitting pressure, damage redirection, command through summoned bodies.  
**Visual fantasy:** spirit conductor / echo binder / vessel that projects lesser forms.

**LOCKED 2026-08-05.** The identity pass this section asked for has happened.
Live state: `docs/conduit-current-state.md`. What follows the lock note is the
original exploratory direction, kept for rationale.

Settled:

- **Summons are floating human skulls** — pure bone, no glow, 1px `#14181a`
  outline for legibility on pale biomes. Masks were the first proposal and lost
  a three-round bake-off: the generator reads "ceramic mask" as a sculpted human
  face, and stripping the facial landmarks yields a featureless egg. At 64px
  this object is only legible with skull geometry.
- **The bearer never changes.** The Conduit is the one class with no tier-4
  player body, and that is deliberate — it does not fight, so its specialization
  reads on what it sends out. It is excluded from `art/workbench/roster/t3.mjs`
  by decision, not by omission.
- **Range is tint + scale + attack FX, never a body swap** — the same rule the
  player bodies follow. Vigil warm/×1.5/melee, Procession violet/×1.25/red bolt,
  Harrier teal/×1.0/red beam.
- The deep red robe, white ceramic mask, and teal accent (`0x4ad4c8`) on the
  player body are unchanged and remain locked.

Undead was permitted below only as a tier-4 paradigm-shift exception; in
practice the baseline is now bone, so that card is spent. Iconoclast remains the
candidate if a genuine full-body break is ever wanted.

Original recommended direction (superseded, kept for rationale):

> The Conduit begins by summoning wisps or lesser vessels, then later specializes into different summoned families.

Possible summon families:

- wisps,
- bound motes,
- lesser vessels,
- spirit fragments,
- masks,
- tiny echo-bodies,
- undead,
- elementals,
- reused creature concepts from the player's current tier or path.

Summons may later specialize by path, tier, or spec.

Visual language for the player:

- faceless hooded vessel,
- orbiting motes,
- tether lines,
- lantern-like glow,
- small mask/glyph companions,
- ritual knots,
- open cloak shape,
- hand/heart projection effects.

Frame notes:

- Light: more small orbiting spirits, swarm-like.
- Balanced: stable three-spirit identity.
- Heavy: fewer larger bound spirits, heavier conductor body.

Attack expression:

- minion command pulse,
- tether flash,
- summon respawn shimmer,
- spirit-body projection.

Do not lock Summoner into slimes as its long-term visual identity.
(Resolved: it is not. Summons are the Conduit's own conjured bone, not borrowed
wildlife of any kind.)

---

## 22. Minion Visual Rules

Summoned minions should support the same world logic as player characters.

Early minions can be simple and readable.

Recommended early minion type:

- Tiny Wisp
- Bound Wisp
- Lesser Vessel
- Spirit Mote

Later minions can branch into:

- undead,
- elementals,
- beast echoes,
- masked vessels,
- domain spirits,
- or other creature families.

Potential rule:

> Summoner minions can reuse or reinterpret monster concepts, but should look bound to the player rather than like wild enemies.

For example:

- a tiny trench predator spirit at a later tier,
- a small bone minion for an undead path,
- an ember elemental for a fire path,
- a frost mote for a rime path.

This creates visual variety without inventing every summon from scratch.

---

## 23. PixelLab / AI Production Rules

AI generation should be used to create coherent source sprites, but the pipeline should not depend on AI perfectly separating every component.

Recommended strategy:

1. Generate full class-frame body sprites first.
2. Generate path/tier overlays separately only when simple and reusable.
3. Use manual or tool-assisted cleanup/cropping.
4. Avoid expecting AI to output perfect helmet/pauldron/gauntlet/boot layers.
5. Prefer larger, readable overlays: hood, mask, shoulders, cloak, aura, glyph, halo.
6. Test sprites in-game early at actual gameplay scale.
7. Build a small vertical slice before mass production.

Do not mass-generate hundreds of sprites before the style and pipeline are proven.

---

## 24. Composite Sprite Rule

> **DECIDED 2026-07-12 — see `docs/player-sprites-current-state.md`.**
> Bodies are full flat sprites produced as img2img **evolution chains**
> (vagrant → class root → frame), not composited parts; range/path/tier
> identity renders as runtime **identity accents** (halo/glyph overlays,
> alignment-insensitive). Bake-time part compositing was dropped because the
> tooling does whole-canvas img2img, not masked inpainting — diff-extracted
> parts come out as noise. The layer guidance below is kept as the accent
> palette to draw from.

Composite sprites are useful, but the system should be modest.

Recommended composite layers:

- body base,
- head/hood/mask overlay,
- shoulder/cloak overlay,
- aura/glow layer,
- path glyph or emblem,
- attack VFX separate from sprite.

Avoid starting with:

- separate gloves,
- separate boots,
- separate pants,
- separate chest,
- separate weapon,
- tiny armor fragments.

Small parts are hard to generate consistently and may not read at gameplay scale.

Composite sprites should solve the progression problem, not create a paper-doll complexity problem.

---

## 25. Full Sprite Exception Rule

Full new sprites are allowed when:

- the spec is a true paradigm shift,
- the old silhouette would miscommunicate the new identity,
- the branch fantasy is important enough to justify production cost,
- and the new form will be used long enough to matter.

Full new sprites should not be used just because a tier number increased.

Examples of justified exceptions:

- armored Squire becoming assassin-like,
- Squire becoming devout beam channeler,
- Spirit becoming a dramatically different phantasm/singularity form,
- Summoner becoming a necromantic or elemental conductor.

Examples of unjustified exceptions:

- minor stat increase,
- small range change,
- ordinary tier-up,
- weapon swap,
- basic gear upgrade.

---

## 26. Visual Progression Checklist

When designing a new player visual stage, ask:

1. Is the character still faceless?
2. Is the character still gender-neutral?
3. Is the class readable without a visible weapon?
4. Is the frame/body weight readable?
5. Is the visual change worth the sprite cost?
6. Could this be an overlay or VFX instead of a full body?
7. Does it work at actual gameplay scale?
8. Does it preserve the dreamlike ascension identity?
9. Does it avoid generic fantasy class clichés?
10. Does it support the mechanic first, fantasy label second?

If the answer is unclear, simplify.

---

## 27. Current Locked Defaults

- Player characters are faceless, genderless vessels.
- Bodies are flat sprites from img2img evolution chains; range/path/tier use
  runtime identity accents, never body swaps (2026-07-12,
  `docs/player-sprites-current-state.md`).
- Stage terminology is visual/player-facing, not internal tier numbering.
- Stage 0 is the unformed vagrant spirit.
- Class identity appears at Stage 1.
- Frame identity appears at Stage 2.
- The main production target is 18 class-frame body bases.
- Range choice should use small VFX/posture changes, not full body sprites.
- Weapons are not visually shown on player sprites.
- Normal equipment does not visually change the player.
- Special items may later grant aura/VFX exceptions.
- Engine-driven animation and VFX are preferred over bespoke sprite animation.
- T4+ paradigm-shift specs may receive full-body exceptions.
- Class colors and class icons are recommended.
- Reload/Slinger may use shot/reticle/gunshot-like VFX without visible guns.
- Summoner/Conduit should begin with wisps or lesser vessels, not be permanently defined by slimes.
- Summoner can later specialize into undead, elementals, or other bound forms.
