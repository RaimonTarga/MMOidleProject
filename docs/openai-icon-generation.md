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
