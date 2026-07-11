# Style anchors

## Phase 0 verdict (2026-07-10)

`creatures.png` = `wolf-painterly` (organic quadruped default). Humanoid
subjects should additionally reference
`art/src/sprites/style-probes/brute-v8.png` for armor/proportion handling —
see the standing rules below.

**What won**, as locked-in `params` for every creature batch:

```json
{
  "outline": "lineless",
  "shading": "highly detailed shading",
  "detail": "highly detailed"
}
```

Painterly, soft volumetric shading, no hard outline — beat both the
thick-black-outline "chunky" direction and every anchored/style-image attempt
across 8+ rounds. For humanoids specifically, add `"view": "low top-down",
"direction": "east"` (three-quarter facing right — see standing rules).

**What to avoid:**

- BitForge / `style_image` anchoring — dead, see below.
- Thick black outline + flat cel shading ("chunky" direction) — consistently
  lost to painterly across both probe subjects.
- Naming background/biome colors in the body-color clause — bleeds into
  fur/skin (round 1: "moss green" put a green patch on the wolf).
- For humanoids: relying on adjectives alone ("massive", "top-heavy") to hit
  extreme/specific proportions. Pixflux has a real soft prior toward
  balanced/readable humanoid silhouettes at 64×64 — pure text asymptotically
  approaches a target but may not fully reach it. When a creature needs a
  proportion far from that prior, use img2img (`params.initImage` +
  `initImageStrength`, 1–999) against an existing sprite that already has the
  target silhouette, and let the prompt drive surface detail instead of
  shape. This is how `brute-v8` closed out — 8 rounds of pure-text prompting
  plateaued, one img2img round against the original `brute.png` landed it.

`terrain.png` = `plains-ground-probe` (4 rounds: barren→grassy rebalance,
brightness/saturation pulled back to the same muted painterly palette as
creatures, shrubs named explicitly with "clustered leaf clumps and visible
branching structure" after an early pass rendered them as a blobby,
shapeless mass). Ground textures use the same `outline`/`shading`/`detail`
params as creatures, plus `"view": "high top-down"` (no `direction` —
non-directional) and `"noBackground": false` (ground must not be
transparent). `plains-prop-probe` (a grass tuft accent) was accepted
alongside it — ground is short/base grass, the prop is a taller clump for
height variation, not a second grass "layer" competing with the base.

## Standing prompt rules (apply to every creature batch)

- **All creature sprites face right in three-quarter view** — params
  `"view": "low top-down"`, `"direction": "east"`, plus "three-quarter view
  facing right" in the prompt and "front view, facing camera" in the
  negative. Strict profile (`"view": "side"`) does NOT fit the artstyle
  (Phase 0 round 2 verdict).
- **Humanoids never show a face** — mask, hood, helmet, faceplate, or
  featureless; negatives include "human face, eyes, mouth". See
  biome-and-creature-bible §7 "Covered Faces".
- **Humanoids are vessels, not people** (bible §7 "Vessels, Not People"):
  skin in the biome's material color (rock-brown, bog-gray, ash — never
  flesh tones; negatives include "human skin, flesh tone"), exaggerated
  inhuman proportions without going cartoonish. Golem before person.
- Don't name colors that shouldn't appear on the creature's body — palette
  words bleed into fur/skin (round 1: "moss green" put a green patch on the
  wolf). Name body colors for the body, background/biome colors nowhere.
- **BITFORGE IS DEAD for this project** (Phase 0 verdict, 6/6 incoherent at
  64×64 with both dirty and clean `style_image` anchors — it is PixelLab's
  legacy "S-M" model). Everything generates on **pixflux**. Cross-batch
  consistency comes from: locked params (outline/shading/detail/view/
  direction), a standard prompt template, and per-biome forced palettes via
  pixflux `color_image`. The anchor PNGs in this directory are reference
  images for prompt authors and reviewers, not API inputs.

The category manifests expect these filenames (see `styleRef` in
`art/manifests/*.json`):

| File | Used by | Suggested source |
|---|---|---|
| `creatures.png` | monsters | your favorite existing monster sprite |
| `characters.png` | players (deferred) | your favorite existing class sprite |
| `icons.png` | items, ui-icons | your favorite existing item icon |
| `terrain.png` | environment, backgrounds | a representative background crop |

## How to set them

Existing sprites make perfect anchors — copy the cleanest ones straight from
`art/src/` (zero API cost), e.g.:

```powershell
Copy-Item art/src/sprites/monsters/wolf.png art/style/creatures.png
Copy-Item art/src/items/weapons/sword-3.png art/style/icons.png
```

Or generate fresh candidates once and promote a winner here.

Notes:

- Any entry can override its category anchor with its own `styleRef`
  (e.g. slimes referencing your best existing slime).
- Changing an anchor changes the request hash, so affected pending entries
  regenerate on the next `art:generate` instead of being skipped as cached.
- `art:generate` fails fast with a clear error if a referenced anchor is
  missing — set these up before the first batch run.
