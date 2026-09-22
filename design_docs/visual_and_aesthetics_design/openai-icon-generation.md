# OpenAI Icon Generation and Integration

This document records the workflow used for the concept-icon pass currently
shipped from `client/public/assets/concept-icons/`. It is intended to keep later
iterations visually consistent and, equally importantly, to make sure new art is
wired to the runtime identifier that the game actually renders.

## Source and output locations

- Full-resolution working images: `art/candidates/openai-icons/`
- Shipped client images: `client/public/assets/concept-icons/`
- Runtime lookup and aliases: `client/src/ui/conceptIcons.ts`
- Shared renderer: `client/src/ui/GameIcon.tsx`
- Resize and review-sheet script: `tools/prepare-openai-icon-previews.cjs`

`art/candidates/` is intentionally ignored by Git. It is a local review area,
not a durable source archive. The accepted 48-96 px derivatives under
`client/public/assets/concept-icons/` are the committed game assets. Preserve a
valuable full-resolution source outside the repository if future repainting is
likely.

## Generation method

Use Codex's built-in OpenAI image-generation tool. Generate one distinct asset
per call; do not ask a single image to contain a sheet of unrelated icons. For a
revision, use the existing full-resolution image as the edit target and state
exactly which properties may change.

Every prompt starts with a mechanic-specific subject and then applies this
shared direction:

> Modern semi-painterly fantasy game UI icon with contemporary, original MMO
> readability. One centered, bold silhouette; dark charcoal or near-black
> full-square backdrop; strong value separation; readable at 32-52 pixels. No
> words, letters, numbers, logo, watermark, border, UI frame, or transparent
> checkerboard.

Do not use franchise names or request copies of existing game artwork. Describe
the desired readability, materials, lighting, and silhouette directly.

Use this prompt structure:

```text
Use case: stylized-concept (or precise-object-edit for a revision)
Asset type: fantasy MMO <ability/buff/debuff/rune/stance> icon displayed at <N>px
Primary request: <one concrete visual metaphor for the mechanic>
Composition: one centered silhouette, generous padding, readable when reduced
Color palette: <dominant mechanic color and restrained supporting colors>
Style: concise semi-painterly game icon, broad forms, strong value separation
Constraints: no text, border, frame, watermark, tiny filigree, or background scene
Avoid: <colors or motifs that conflict with the mechanic>
```

For an edit, add an explicit invariant block:

```text
Change only <palette/object/detail>. Preserve the silhouette, geometry,
proportions, framing, background, and visual identity. Add no new objects.
```

## Class-tree emblem pass: ranges and paths

The skill-tree code uses zero-based tier numbers, so the product language and
the code language differ by one at this point:

- Product Tier 3 is the range choice (close, medium, or far), represented by
  `SkillNode.tier === 2` and IDs such as `cadence-range-close`.
- Product Tier 4 is the path specialization, represented by
  `SkillNode.tier === 3` and IDs such as `cadence-light-t3-a`.
- Later product tiers are path-locked progression and remain intentionally
  unillustrated until their own art is authored.

This pass generated one 1254 x 1254 square image per approved node with one
Codex built-in image-generation call per asset. The accepted full-resolution
working copies live locally in the ignored review folders
`art/candidates/openai-icons/ranges/classes/` and
`art/candidates/openai-icons/paths/`; the committed runtime derivatives are
96 x 96 PNGs in `client/public/assets/concept-icons/ranges/classes/` and
`client/public/assets/concept-icons/paths/`. Run
`node tools/prepare-openai-icon-previews.cjs` after adding or replacing a
candidate. The script now prepares both class-specific groups alongside the
older generic icon groups.

### Visual recipe

Start every emblem with the shared semi-painterly fantasy game-icon direction
above: one centered heraldic silhouette, dark charcoal full-square backdrop,
strong value separation, broad readable forms, dramatic material lighting, and
no text, frame, watermark, or tiny decorative noise.

For a range emblem, use the class-root crest as the lineage anchor and make
the range fantasy the subject. The approved examples established the pattern:
Striker keeps its blade-and-impact identity while close becomes a brawler,
medium becomes a lancer, and far becomes an arcane phantom-blade. Apply the
same translation to each other class. Apprentice's three range emblems are
element-agnostic because poison, flame, and frost share the same DoT-range
nodes. These are deliberately class-specific replacements for the older
generic `ranges/close.png`, `medium.png`, and `far.png` assets.

For a path emblem, the Tier 2 frame is a lineage reference for material,
palette, and visual weight, but the path name and specialization fantasy are
the primary subject. This is the divergence point: move clearly beyond the
root/frame identity, give each path its own silhouette and symbolism, and
increase ornament and complexity one step without treating Tier 4 as the
finished maximum. There should still be room for Tiers 5-8 to become more
ornate and prestigious.

Conduit is the reference-driven exception. Each path emblem uses its matching
unique summon sprite from `art/src/sprites/monsters/` as a subject reference
while preserving the overall emblem palette and semi-painterly drawing style.
The two Covenanter summon sprites are both relevant to that emblem. This keeps
the summon silhouettes legible instead of inventing generic summoner symbols.

Other deliberate exceptions are narrow and explicit: Apprentice/Cultist uses
deep purple Doom imagery rather than the normal poison language; Spirit's
Voidwalker uses a dark void treatment; Slinger may use arcane or lightly
steampunk low-tech firearms, never modern assault rifles or SMGs. These
exceptions should not become the default for later nodes.

### Naming and wiring

Use the exact canonical skill-node ID as the filename. Do not use the visible
class label: labels can be renamed, while IDs are persisted and rendered by
the live tree. The resolver in `client/src/ui/conceptIcons.ts` maps:

| Product tier | Runtime directory | Revision | Example |
| --- | --- | --- | --- |
| Tier 3 range | `concept-icons/ranges/classes/` | `class-range-crests-v1` | `cadence-range-close.png` |
| Tier 4 path | `concept-icons/paths/` | `class-path-crests-v1` | `cadence-light-t3-a.png` |

The query-string revisions are intentional cache busters. Bump the relevant
revision when replacing an already-shipped crest. Keep the generic
`concept-icons/ranges/` files available for non-class-specific vocabulary;
only the passive-tree resolver switches to the class-specific set.

### Reusable prompt skeleton

For future Tier 5 work, start from the approved Tier 4 path emblem and the
matching Tier 2 frame, then add the next specialization's mechanic or sprite
reference. Keep the lineage explicit and keep the tier ladder in mind:

```text
Use case: stylized-concept
Asset type: heraldic fantasy MMO class-tree emblem displayed at 96px
Input images: Image 1 = matching Tier 2 frame lineage; Image 2 = approved
prior-tier emblem for continuity; Image 3 = mechanic/summon reference when
the path has a specific subject
Primary request: an original emblem for <canonical node id and class fantasy>
Composition: one centered bold silhouette, generous padding, readable at 32px
Style: semi-painterly fantasy game emblem, richer and more ornate than the
prior tier but still a single clean silhouette
Color palette: inherit the frame lineage, with <path-specific accent>
Constraints: no text, letters, numbers, logo, watermark, border, UI frame,
transparent checkerboard, modern firearm, or unrelated extra objects
Avoid: generic range symbolism when this is a path emblem; visual sameness
with the parent frame; detail so fine that it disappears at 96px
```

Inspect both the generated 1254 px image and the prepared 96 px derivative.
The 96 px result is the acceptance target. The first Striker Tier 4 batch and
the first four Apprentice attempt images were review-only variants and are not
part of the shipped set; do not resurrect them when using this pass as a
reference.

## Visual language

The icon should communicate one mechanic before it communicates atmosphere.

- Regeneration and healing: emerald, forest, and leaf green. Pale highlights
  must remain green rather than drifting into yellow, gold, cyan, or blue.
- Poison and venom: acid/leaf green with a droplet, fang, or similarly direct
  motif. Keep it distinct from healthy regeneration through sharper shapes and
  darker hostile contrast.
- Fire and burning: orange-red with a compact flame or ember silhouette.
- Frost and freezing: pale cyan/ice blue with crystalline shapes.
- Void and doom: violet or purple with a heavy, unnatural silhouette.
- Decay and rot: desaturated brown-green rather than clean healing green.
- Rune intent: cyan for player movement/intent, red for enemies/danger, amber
  for conditions, with dark carved-stone grounding.

Status icons need fewer details than ability or class icons. Prefer one main
symbol, two or three broad value groups, and no peripheral particles. The HUD
supplies timing sweeps, stack badges, glows, and layout; the bitmap should not
contain its own square, circle, diamond, bevel, or ornamental frame.

## Naming and runtime wiring

Name the image after the canonical game identifier, not the visible label. A
label can be misleading: the player buff labeled `Regen` is runtime ID
`defense-burst`, while a boss regeneration effect is `boss-regen` through the
`regen` alias.

Before generating or wiring an icon:

1. Trace the server/client payload to find the actual `id` or `iconKey`.
2. Search all authored variants rather than making a biome-specific list.
3. Add the canonical ID to the appropriate set or alias in
   `client/src/ui/conceptIcons.ts`.
4. When several runtime effects share artwork, send the shared `iconKey` and
   retain a stable `instanceKey` so simultaneous entries do not collide.
5. If an existing public URL is replaced and long-running clients may cache it,
   add or update a small query-string revision in the lookup.

Examples from this pass:

- `regen` boss effect -> `boss-regen`
- `defense-burst` player buff -> its green regeneration artwork
- all poison-flavored `monster-dot:*` effects -> `debuff-poison`
- poison weapon reservoirs -> `debuff-poison`
- fire/frost DoTs -> their fire/frost status art

Flavor-based families should be resolved from shared gameplay metadata, not by
checking whether an ID happens to contain words such as `poison` or `venom`.
This is why cave spider venom, swamp hexes, jungle darts, and future poison mobs
can share the same artwork without maintaining parallel client lists.

## Preparing shipped assets

Place the full-resolution PNG at the matching candidate path, then run:

```powershell
node tools/prepare-openai-icon-previews.cjs
```

The script writes the client derivatives and rebuilds
`art/candidates/openai-icons/contact-sheets/downscale-review.png`. Current output
sizes are:

| Group | Shipped size | Typical in-game display |
| --- | ---: | ---: |
| Classes, frames, ranges | 96 px | 54-80 px |
| Abilities, stances, rites | 64 px | 22-44 px |
| Rune conditions/actions | 48 px | 32 px |
| Buffs and debuffs | 48 px | 22-48 px |

All groups resize directly from the full-resolution source with Lanczos and a
256-color PNG palette. Do not add a lower-resolution intermediate for status
icons; that experiment made the buff/debuff art visibly soft and was reverted.

## Review checklist

1. Inspect the full-resolution result for the requested subject and palette.
2. Inspect the shipped PNG at its original 48/64/96 px size, not enlarged.
3. Inspect the exact-size review sheet for consistency across the group.
4. Confirm the bitmap has no baked frame, text, watermark, or accidental extra
   objects.
5. Confirm the lookup resolves the live runtime ID, not merely a similarly
   named asset.
6. For dynamic families such as monster poison, audit all definitions and add a
   regression test covering representative out-of-biome cases.
7. Run the client build:

   ```powershell
   pnpm --filter @mmo-idle/client build
   ```

8. If shared/server icon metadata changed, also run the relevant focused test,
   shared build, and server typecheck.

The acceptance criterion is the in-game size. A beautiful 1254 px painting that
turns into noise at 48 px is not a successful icon.
