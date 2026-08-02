# Item Icon Generation Plan (Phase 2)

**Status: COMPLETE for weapons + armor + charms + boots as of 2026-08-02.** 121 bespoke
icons generated, accepted, packed and wired — weapons 32/32, armor 30/30, charms 31/31,
boots 28/28. Total spend **$2.45**. The only crafted items still on borrowed hand-drawn
frames are the **5 cores**, deliberately deferred to their own pass (they are still being
designed), plus relics. Follows the locked `item-identity-audit.md` (Phase 1, shipped).

Decisions taken: **naming option B** (identity-matching frame names, one icon per item);
ship size **32×32**; same flat bold pixel-art language as the ability/monster work;
**slot-family** batch order. Frame slugs follow the item *name*, not the recipe id — the
swamp T1 recipe id stays `ashbrand-blade` while its frame is `poison-dagger.png`.

**Depends on:** the settled roster (names, slots, damage-profile motifs) from the audit —
those are locked, so no icon generated here will need to be redone for an identity change.

**Pipeline references (read before executing):** `tools/pixellab/README.md`,
`design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md`, the
`item-aesthetic-bible.md` icon rules (§5 literal object + mechanic symbol; §8 slot object
language), and `biome-palette-bible.md`. The `art/manifests/ability-icons.json` +
`client/src/ui/abilityIcons.ts` pair is the proven UI-icon template to mirror.

---

## What exists today

- **126 recipe `icon:` fields.** All 32 weapon fields now point at bespoke generated frames
  (`items/weapons/poison-dagger.png`, …). The remaining 94 armor/charm/boot fields still
  point at the old hand-drawn atlas frames in `client/public/assets`, and many are shared
  across several items (e.g. four mountain recipes on `hammer-2.png` before the weapon pass).
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
- **Weapons — DONE.** Batches 0–2 covered all 32 weapon recipes across the 12 biome groups;
  all accepted, packed, and wired. See "Phase 2b" below for the remaining slots.
- **Then roll out by slot family**, covering all biomes/tiers within the slot. Within a slot
  batch, generate each line's root first, then walk that line upward via img2img (respecting
  the tier dependency). Slot-family batches (rather than the per-biome monster methodology)
  keep one object-language template per batch; biome palette varies inside it.
- **Relics/ultimates last** — relic identity is still unlocked (bible §14) and the abyss
  ultimate is WIP; icon them only once their concepts settle.

Measured scale (from the weapon pass): **~$0.007 per generation**. 126 calls covered all 32
weapons including re-rolls — **$0.88 total**. Money is not the constraint; review bandwidth
is. Still `--dry-run` first and cap with `--budget=$` / `--limit=N` as a guard against a
runaway loop, not as a cost control.

---

## Phase 2b — armor, charms, boots (89 icons)

**Prerequisite already met:** the flavor/identity pass is DONE for these slots. The identity
audit tagged the large majority of the roster `keep` — names, mechanics and descriptions all
fit — and every armor/charm/boot recipe already carries a bespoke name and a mechanic-tied
description (*Bestial Hide*, *Duneplate of the Last Stand*, *Echo Geode*, *Gravewalker
Boots*). **No recipe rewriting is in scope. This is art + wiring only.**

The one open mechanical item, the **mountain armor damage-cap → defensive-cooldown
redesign**, is explicitly *not* an icon blocker: the stone-plate silhouette and the names
survive it, so those five icons generate against the current identity.

### Scope

| Recipe slot | Art folder | Count | Notes |
|---|---|---|---|
| `armor` | `art/src/items/armor/` | 30 | 12 line roots + 18 tier followers |
| `recovery` | `art/src/items/charms/` | 31 | 12 line roots + 19 followers |
| `mobility` | `art/src/items/boots/` | 28 | 12 line roots + 16 followers |
| `core` | — | *(5, excluded)* | **Cores are still being designed. Separate pass later.** |

⚠️ The recipe slot names and the art folder names differ: `recovery` → `charms/`,
`mobility` → `boots/`. A naive slot→folder mapper will create the wrong directories.

### What the art has to fix

Beyond "the icons are hand-drawn", **14 legacy frames are shared by 2–4 items each** — the
single most visible problem in the inventory today:

| Shared frame | Items collapsed onto it |
|---|---|
| `stone-hand-charm-2.png` | Iron Bulwark · Bastion Heart · Fortress Heart · Frostward Charm |
| `plate-armor-3.png` | Iron Crusader Plate · Summit Aegis · Titan's Keep |
| `plate-armor-1.png` | Fallen Knight Plate · Stormwall Plate · Deep Sea Carapace |
| `plate-boots-4.png` | Canopy Striders · Vanguard Stride · Glacier Striders |
| `stone-hand-charm-1.png` | Granite Barrier · Shieldmend Ward · Deepfreeze Ward |
| …9 more at ×2 | volcano-armor-1, volcano-crystal, wood-charm-2, leather-boots-6, … |

Option-B naming resolves all of these by construction: one item, one frame.

### Mechanic-symbol vocabulary for the new slots

Weapons drew their "+ what it does" hint from the damage profile. These slots draw it from
`mechanicEffects`, whose key prefixes give a clean symbol mapping:

| Effect family | Reads as | Symbol cue |
|---|---|---|
| `defense.max-hit-*`, `hardening-*` | damage cap / hardening | thick reinforced band, threshold line across the plate |
| `defense.hit-plating-*` | stacking plating | layered overlapping scales |
| `defense.stationary-dr-*`, `sustained-fight-*` | ramp while holding ground | creeping crust/ice/moss spreading from the edges |
| `defense.cheat-death`, `debt-cheat-death` | survive the killing blow | a single crack that stops short, faint second outline |
| `defense.dot-resistance`, `cleanse-*` | purge/resist rot | ward glyph, droplets beading off and falling away |
| `defense.regen-*`, `in-combat-regen-*` | steady mending | soft concentric pulse ring |
| `defense.shield-*`, `absorb-*` | ward/absorb | a thin hovering plate or ice sheet in front of the object |
| `guard.*` | Guard-ability amplifier | carved sigil on the charm face |
| `mobility.passive-speed`, `kite-*` | plain speed | one clean motion streak |
| `mobility.ramp-*`, `kill-stack-*` | accelerating | 2–3 stacked streaks, longest at the back |
| `mobility.stealth-*`, `suppress-*` | unseen | faded/ghosted heel, partial afterimage |
| `mobility.tenacity-*` | shrugs off slows | broken chain link or shattered ice at the sole |
| `mobility.aggro-pull-*` | loud/provoking | crushed ground, radiating impact marks |

Slot object language is bible §8: armor = wrap/vest/hide/plate/mantle/shell/ward/cuirass;
charm = amulet/charm/eye/gem/idol/knot/pouch/bell; boots = boots/wraps/treads/greaves/
sandals/steps. Everything else (style tail, base negative, per-biome palette, 32×32,
`pixflux`, locked `params`) is reused verbatim from the accepted weapon entries.

### Wave structure (7 review gates)

Waves are **tier-dependency-aware**: an img2img follower can never sit in the same wave as
its root, because the seed must be *accepted* art on disk. Roots therefore front-load.

| Wave | Contents | Items | Candidates |
|---|---|---|---|
| **P — pilot** | 3 armor + 3 charm + 3 boot roots, spread across contrasting biomes (e.g. mountain/swamp/jungle) | 9 | 27 |
| **A1** | remaining 9 armor roots + followers of the pilot's armor lines | ~15 | ~45 |
| **A2** | remaining armor followers | ~14 | ~42 |
| **C1** | remaining 9 charm roots + followers of the pilot's charm lines | ~15 | ~45 |
| **C2** | remaining charm followers | ~15 | ~45 |
| **B1** | remaining 9 boot roots + followers of the pilot's boot lines | ~14 | ~42 |
| **B2** | remaining boot followers | ~13 | ~39 |

**Pilot gate:** nothing past wave P generates until the pilot is reviewed and the three new
object languages are signed off. This exists because weapon Batch 1 ran img2img at strength
200 and **10 of 12 candidates were rejected** as "too similar to the original".

Total ≈ 89 items / ~267 candidates / **~$1.90**, or ~$2.50 with a 30% re-roll allowance.

### Naming: author frame names explicitly, wire off `sources`

Frame slugs follow the item *name*, but four names don't slug cleanly — author these by
hand in the manifest rather than letting a mechanical slugger decide:

| Item | Naive slug | Authored frame |
|---|---|---|
| Titan's Keep | `titan-s-keep` | `titans-keep.png` |
| Survivor's Robe | `survivor-s-robe` | `survivors-robe.png` |
| Duneplate of the Last Stand | `duneplate-of-the-last-stand` | `duneplate-last-stand.png` |
| Lava-Tempered Hide | `lava-tempered-hide` | `lava-tempered-hide.png` (fine as-is) |

Verified: **no slug collisions** across the 89 names.

**Wire off `sources`, not slugs.** Every manifest entry carries `sources: ["item:<recipeId>"]`
(all 32 weapons do, with zero gaps). That makes the wiring pass a deterministic
manifest-entry → recipe-id join instead of a name-slug guess — no apostrophe special-casing,
no fallback chain. This is the improvement over how the weapon pass was wired.

### How it actually ran (2026-08-02) — findings worth reusing

Five waves, not seven: pilot (9) → A1 (15) → overnight (49) → final (19), plus the weapon
wiring. What the campaign measured, as opposed to what it assumed:

- **img2img at strength 65 beats flat prompting for tier followers.** An explicit A/B in
  wave A1 (3 img2img vs 3 flat, same three lines) went 3/3 for img2img on line continuity;
  the flat controls drifted in palette and silhouette, and one (`plaguebound-shroud`)
  failed outright — a hooded robe in all three candidates despite `hood`, `cloak`,
  `humanoid figure` and `character` all being banned. Seed from the **nearest accepted
  predecessor**, not always the root.
- **Therefore the chain dependency is real and it, not budget, paces the campaign.** A
  follower cannot generate until its root is accepted, so waves must front-load roots.
- **Never use the word "chest" in an armor prompt.** `bark-wrap` rendered a literal
  treasure chest. Say "torso armour"/"torso vest" and ban `treasure chest, box, crate,
  container, barrel`. Equally, avoid garment-on-a-person nouns (shroud, robe, cloak) —
  they invite a wearer into an icon that should be an empty object.
- **Siblings sharing a seed converge.** Ban each other's signature feature explicitly
  (Titan's Keep bans storm seams, Stormwall Plate bans crenellations; Ancient Canopy bans
  the hardened shell, Overgrowth Pulse bans the bare gnarled knot).
- **The generator's cost estimate runs 6–8x high.** Real rate is ~$0.007/call. It quoted
  $11.76 for the 49-entry overnight batch that actually cost $1.39.
- **4 candidates instead of 3** is worth it whenever a rejection costs a round-trip
  measured in hours rather than minutes.

### Per-wave loop

1. Author manifest entries (`status: "draft"`, so they cannot spend), then flip to `pending`.
2. `pnpm art:generate --dry-run` → confirm the entry set and cost → run for real.
3. Hand off to `pnpm art:review`. **I never accept or reject candidates — the user picks.**
   Never run `art:generate` while the gallery is open.
4. `pnpm art:pack` (`--check` first).
5. Wiring pass: join accepted entries to recipes via `sources`, rewrite `icon:`.
6. `pnpm typecheck`, `pnpm test`, and the frame-resolution audit (every recipe `icon:`
   resolves to a packed frame — currently 126/126 with zero unresolved).

---

## Wiring & verification (per batch, after `art:review` acceptances)

1. `art:pack` to compile accepted art into the shipped atlas (`--check` first to see drift).
2. If naming option B: update the batch's recipe `icon:` fields to the new frame paths.
3. `pnpm typecheck` + a grep that every recipe `icon:` resolves to a packed frame (no
   missing-frame fallbacks). Items already render through `UIIcon`/`ItemIcon`, so no
   component changes are expected.
4. Spot-check in-app that the inventory/forge/tooltip icons render.

---

## Decisions (settled during the weapon batches)

1. **Frame naming:** option B — clean identity-matching frame names, slugged from the item
   *name*. Recipe ids are persisted and stay frozen where they diverge (`ashbrand-blade`).
2. **Icon ship size:** 32×32, matching the existing item frames and the ability icons.
3. **Style direction:** same flat bold pixel-art language as the ability/monster work.
4. **Batch order:** slot-family rollout.
5. **Scope of this phase:** weapons + armor + charms + boots. **Cores are excluded — they
   are still being designed and get their own pass later.** Relics likewise deferred.
6. **Review cadence** (2026-08-02): half-slot waves, ~15 items / ~45 candidates per gallery
   sitting; 7 gates total including the pilot.
7. **Pilot gate** (2026-08-02): a 9-icon cross-slot pilot precedes bulk generation.

---

## Downstream

This phase produces the packed item-icon atlas and the wired `icon:` fields. It closes the
front-to-back item overhaul (identity → art) and feeds the UI redesign plan's Phase 10
(`docs/ui-redesign-plan.md`, 10B/10C asset hookup), where the icon-source contract consumes
the new frames.
