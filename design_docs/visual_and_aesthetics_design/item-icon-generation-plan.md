# Item Icon Generation Plan (Phase 2)

**Status:** proposed; not started. Follows the locked `item-identity-audit.md` (Phase 1,
shipped). This is the original goal of the item overhaul: replace every hand-drawn item
icon with a coherent PixelLab-generated family.

**Depends on:** the settled roster (names, slots, damage-profile motifs) from the audit —
those are locked, so no icon generated here will need to be redone for an identity change.

**Pipeline references (read before executing):** `tools/pixellab/README.md`,
`design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md`, the
`item-aesthetic-bible.md` icon rules (§5 literal object + mechanic symbol; §8 slot object
language), and `biome-palette-bible.md`. The `art/manifests/ability-icons.json` +
`client/src/ui/abilityIcons.ts` pair is the proven UI-icon template to mirror.

---

## What exists today

- **~101 unique item icon frames** referenced by recipes via each recipe's `icon:` field
  (e.g. `items/weapons/rune-sword-hot-1.png`), pointing at the old hand-drawn atlas frames
  in `client/public/assets`. Several are semantically wrong for the reworked items (the new
  Poison Dagger still points at a fire-rune sword frame).
- **The pipeline** (`art:import|seed|generate|review|pack|status`): `art/src/` is the
  committed source of truth; `art/manifests/*.json` holds one entry per asset;
  `client/public/assets` atlases are build output of `art:pack`. `art:generate` spends real
  credits — **always `--dry-run` first**.
- **Frame-name invariant** (pipeline rule): a frame name never changes without touching the
  `icon:` field. Art is regenerated *at a frame path*; the path is the contract.
- **Review constraint** (established workflow): candidates are generated, then the user
  accepts/rejects them in the `art:review` gallery. I generate and hand off — I never
  self-accept. Never run `art:generate` while the gallery is open.

---

## Key decision: frame naming

Two ways to attach the new art:

- **A — Keep old frame names, regenerate art in place.** Zero recipe edits; the Poison
  Dagger keeps `icon: 'items/weapons/rune-sword-hot-1.png'` but that path now holds a green
  venom dagger. Fastest, zero code risk, but frame names stay misleading forever and shared
  frames (many items reuse `rune-sword-hot-1`) force shared art.
- **B — Clean identity-matching frame names (recommended).** Give each item its own frame
  (`items/weapons/poison-dagger.png`, `items/armor/mire-wraps.png`, …) and update its
  `icon:` field. `art:seed` then generates draft manifest entries straight from the
  registry. Clean, one-icon-per-item, and the `icon:` edits are cheap data changes we're
  already comfortable making. Costs a recipe-wide `icon:` pass and more total icons (no
  shared frames).

Recommendation: **B.** It's a full overhaul; the frame namespace should read like the
items. The `icon:` pass is mechanical and typecheck-guarded.

---

## Visual family (prerequisite — lock before batch generation)

Before generating at scale, lock ONE item-icon style spec (a High-effort design pass, like
the ability-icon family). It must define, as a reusable prompt template:

- **Base style:** bold flat pixel-art, hard chunky outline, flat colors, limited palette,
  readable at ship size, consistent framing/scale, background policy (`noBackground`), and
  endpoint (`pixflux`, mirroring ability icons).
- **Slot object language** (bible §8): weapon = blade/dagger/hammer/axe/brand; armor =
  wrap/plate/hide/mantle; charm = amulet/eye/idol/gem; boots = boots/treads/greaves; core =
  gem/seal/heart/lens. Each slot gets a template skeleton.
- **Mechanic symbol overlay** (bible §5): the icon shows the object + a hint of function —
  poison drip (green), ember/heat (fire), rime/frost (cold), speed streak, threshold/impact
  crack, pulse ring, etc.
- **Biome palette hook** (biome-palette-bible): tint per biome group.
- **Tier intensity:** early = grounded/mundane; late = stranger/ornate/glowing (bible §2),
  driven by prompt modifiers, not eight separate styles.

Deliverable of this step: a locked prompt-template doc + 1–2 style-anchor images in
`art/style/`, validated by the pilot batch below.

### Prompt template system (drafted)

Every item prompt = **object clause** + **mechanic-symbol clause** + shared **style tail**;
every negative = shared **base ban-list** + **per-slot** + **per-item** bans. Ship size
32×32 (matches the existing item frames and the ability icons).

**Style tail** (append to every prompt):
> …, the OBJECT is centered and fills about 85 percent of the frame on a slight diagonal,
> pure black background, bold flat pixel-art inventory icon readable instantly at 32x32,
> 64x64 pixel art, limited palette of PALETTE, crisp intentional pixel clusters, hard chunky
> outline, flat colors only, no gradient, no gloss, no shading, minimal detail

**Base negative** (every entry):
> photograph, 3d render, realistic, painterly, smooth vector art, gradient, glow, soft blur,
> ornate decorative frame, badge, banner, ribbon, text, letters, numbers, watermark, drop
> shadow, cast shadow, checkerboard, multiple objects, duplicate, hand, arm, character,
> humanoid figure, face, logo, clipart, background scenery, ground, floor, sky

**Per-slot object skeleton** (bible §8) + its extra bans:

| Slot | Object clause seed | Extra negatives |
|---|---|---|
| weapon | "a OBJECT (blade/dagger/hammer/axe/brand/falchion), held point-up" | the other weapon types; "hand, sheath" |
| armor | "a chest OBJECT (vest/plate/hide/mantle/wrap), front-facing, empty" | "person wearing it, full body, helmet, weapon" |
| charm | "a small OBJECT (amulet/eye/idol/gem/pendant) on a short cord" | "weapon, armor, large object, full necklace chain" |
| boots | "a pair of OBJECT (boots/treads/greaves/wraps), side view" | "single boot, legs, person, full body" |
| core | "a glowing OBJECT (gem/seal/heart/lens/sigil), floating" | "weapon, armor, wearable, jewellery chain" |

**Mechanic-symbol vocabulary** (bible §5 — the "+ what it does" hint):

| Motif | Symbol cue |
|---|---|
| poison DoT | green venom sheen + 2–3 dripping green droplets |
| fire DoT | molten cracks + smouldering ember sparks |
| frost DoT | pale-blue ice sheath + frost-cracks + cold vapour |
| heavy/impact | broad blunt head + faint impact crack |
| fast | slender blade + one faint motion streak |
| irregular (axe) | one chipped notch missing from the edge |
| evasion | light cloth + faint afterimage/wind slash |
| damage cap / plate | thick threshold line / reinforced band |
| regen/shield charm | soft pulse ring / carved ward glyph |

**Per-biome palette** (biome-palette-bible): plains = steel/warm-brown/dull-gold · forest =
pale-silver/forest-green/muted-brown · mountain = iron-grey/stone-grey/weathered-brown ·
swamp = dull-steel/swamp-purple/toxic-green · cave = dark-iron/deep-red-brown/cave-grey ·
tundra = ice-blue/frost-white/cold-steel · desert = gold/warm-sand/pale-steel · volcanic =
dark-steel/ember-red/hot-orange · graveyard = bone-white/necrotic-purple/grave-grey · jungle
= vivid-green/bark-brown/thorn-red.

Batch 0 entries in `art/manifests/items.json` instantiate this template (weapons). They run
on `pixflux` with `styleRef: null` (no anchor needed for the probe) and are left `status:
"draft"` — the generator only touches `pending`/`regen`, so they cannot spend until flipped.

---

## Consistency methodology (two axes)

Icon coherence is two separate problems, each with its own tool. img2img belongs to only
one of them.

**Horizontal — the whole set reads as one game's icons** (line weight, shading, framing,
palette). Tools: **locked `params`** (outline/shading/detail/textGuidanceScale/
generationScale), the **standard prompt template** below, and **per-biome palette pinning
via `params.colorImage`**. Always-on for every entry; **not img2img**. Makes everything
cohere without forcing different objects to resemble each other.

> ⚠️ **Do NOT use bitforge or `styleRef` style-image anchoring.** `art/style/README.md`
> records the Phase 0 verdict: bitforge was 6/6 incoherent at 64×64 with both dirty and
> clean style anchors and is **dead for this project** — everything generates on
> **pixflux**. The anchor PNGs in `art/style/` are reference images for prompt authors and
> reviewers, **not API inputs**. Cross-batch consistency comes from locked params + prompt
> template + `colorImage` palettes, not from a style anchor.

**Vertical — one item line reads as "the same object, escalated" across tiers** (e.g.
Poison Dagger → Venom Knife → Plague Fang; Heavy Hammer → Quake Hammer → Avalanche Maul →
Earthsunder Maul). Tool: **img2img evolution chain** — each tier's `initImage` is its
accepted predecessor's art (the technique the `players` category already uses). This is the
one place img2img is worth it; cross-item *families* rely on the horizontal tools above
instead, because img2img across genuinely different objects fights the object change.
`art/style/README.md` independently endorses img2img for exactly this purpose: when a
subject needs a silhouette far from pixflux's text prior, seed from art that already has
the target shape and let the prompt drive surface detail rather than shape.

Rules for the vertical chains:

- **`initImageStrength` ≈ 60–70 (calibrated).** Measured, not guessed: Batch 1 ran the
  seeded entries at **200 and 10 of 12 were rejected** — every note some form of "too
  similar to the original." The seed must be only a *light silhouette nudge*; the prompt
  has to drive shape and tier escalation. Treat 65 as the default for item tier chains and
  the 300 API default as far too strong for this use.
- **Watch sibling convergence, not just root convergence.** Two branches seeded from the
  same root can collapse into each other (Batch 1: `thorn-needle` was rejected as "too
  similar to the other one", i.e. to `gale-needle`, not to `flash-rapier`). Fix by banning
  the sibling's distinguishing look in the `negative`, not only by lowering strength.
- **Dependency:** an img2img link can't generate until its predecessor is accepted. Each
  line runs strictly tiered: T1 accepted → T2 from T1 → T3 from T2 (mirrors the `players`
  category rule that links stay `draft` until the predecessor lands).

**Line roots** are the T1 (earliest-tier) item of each biome+slot line. They generate first,
**without** img2img, against the locked params + template; once accepted, each root both
validates the horizontal family and becomes the img2img seed for its line's higher tiers.
**A line's higher tiers cannot generate in the same batch as their root** — img2img needs
the predecessor's *accepted* art on disk, so chains span batches.

## Batch sequencing

- **Batch 0 — pilot / style-lock (~8–12 icons), line roots, no img2img.** The motif-changed
  items whose current in-game icon is now actively wrong, so they're both highest-value and
  the ideal style probe: **Poison Dagger, Venom Knife, Plague Fang** (green venom daggers —
  note Venom Knife/Plague Fang are higher tiers of the swamp dagger line, so in a strict
  roots-only pilot only Poison Dagger is a true root; the other two can either seed from it
  via img2img or be generated flat here to stress the style), **Rimebrand** (frost brand),
  **Cinderbrand** (fire brand), **Sunsteel/Solar/Zenith Falchion** (curved blades).
  Optionally add one clean T1 root (plains broadsword, forest rapier) to exercise a non-DoT
  weapon. **Gate: user reviews the pilot in the gallery and signs off on the family (and the
  style anchor) before any further generation.**
- **Then roll out by slot family**, one reviewable batch each (weapons → armor → charms →
  boots → cores), covering all biomes/tiers within the slot. Within a slot batch, generate
  each line's root first, then walk that line upward via img2img (respecting the tier
  dependency). Slot-family batches (rather than the per-biome monster methodology) keep one
  object-language template per batch; biome palette varies inside it. Each slot batch is its
  own review gate.
- **Relics/ultimates last** — relic identity is still unlocked (bible §14) and the abyss
  ultimate is WIP; icon them only once their concepts settle.

Rough scale: ~100–110 distinct icons × 3 candidates ≈ ~300+ generations. Budget with
`--budget=$` / `--limit=N`, always `--dry-run` first, and spread across sessions to respect
the subscription cap. Pilot (~30 generations) proves the template before the bulk spend.

---

## Wiring & verification (per batch, after `art:review` acceptances)

1. `art:pack` to compile accepted art into the shipped atlas (`--check` first to see drift).
2. If naming option B: update the batch's recipe `icon:` fields to the new frame paths.
3. `pnpm typecheck` + a grep that every recipe `icon:` resolves to a packed frame (no
   missing-frame fallbacks). Items already render through `UIIcon`/`ItemIcon`, so no
   component changes are expected.
4. Spot-check in-app that the inventory/forge/tooltip icons render.

---

## Open decisions (for the user, before Batch 0)

1. **Frame naming:** option A (keep names) or B (clean names, recommended).
2. **Icon ship size:** match the existing item frame size, or standardize (e.g. 48×48) for
   more detail than the 32×32 ability icons. Needs a look at the current item frame size.
3. **Style direction:** same flat bold pixel-art language as the ability/monster work, or a
   distinct inventory-icon treatment. (Recommend same language for one coherent UI.)
4. **Batch order:** slot-family rollout (recommended) vs per-biome.
5. **Scope of this phase:** weapons + armor + charms + boots now; cores/relics deferred?

---

## Downstream

This phase produces the packed item-icon atlas and the wired `icon:` fields. It closes the
front-to-back item overhaul (identity → art) and feeds the UI redesign plan's Phase 10
(`docs/ui-redesign-plan.md`, 10B/10C asset hookup), where the icon-source contract consumes
the new frames.
