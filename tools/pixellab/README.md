# PixelLab Art Pipeline

Tooling for the full art overhaul (plan: `docs/archive/pixellab-pipeline-plan.md`).
Generates pixel art via the PixelLab API, curates it in a local gallery, and
compiles the committed `art/src/` source tree into the shipped client assets.

**Before running a sprite batch**, read
`design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md` — the
proven per-biome workflow (brainstorm → flavor pass → prompts → review →
regen → pack), the prompt template with its accumulated ban-lists, the
img2img/colorImage techniques, and the operational rules (notably: never
generate while the review gallery is open).

## Setup

`PIXELLAB_API_KEY` in the repo-root `.env` (see `.env.example`). Never commit it.

## Commands (run from repo root)

| Command | What it does |
|---|---|
| `pnpm art:import` | One-time bootstrap: slices the shipped atlases into `art/src/<frame>` and copies loose assets to `art/src/files/**`. Re-runnable; never overwrites without `--force`. |
| `pnpm art:seed` | Creates/refreshes draft manifest entries in `art/manifests/` from game registries + `art/src`. Never touches existing prompts/statuses. |
| `pnpm art:generate` | Generates candidates for `pending`/`regen` entries with prompts. Flags: `--dry-run`, `--category=`, `--id=`, `--budget=$`, `--limit=N`, `--force`, `--balance`. |
| `pnpm art:review` | Gallery at `http://localhost:4114`. Accept → `art/src/<out>` (NN-resized to ship size) + status `accepted`. Reject → status `regen` + note. |
| `pnpm art:pack` | Repacks atlases + copies `art/src/files/**` into `client/public/assets/`. `--check` = drift detector (writes nothing, exits 1 on diff); `--atlas=<sprites\|icons\|UI_icons>` limits work to one atlas and skips loose files. |
| `pnpm art:status` | Coverage report: manifests × registries × art files. `--balance` adds account balance. |
| `pnpm art:wire` | Items only: rewrites recipe `icon:` fields to the accepted frames, joining manifest→recipe via each entry's `sources: ["item:<recipeId>"]`. Dry run by default; `--apply` writes. Packing does **not** wire — this is the separate step. |

## Flow

```text
art:import → art:seed → [write prompts, flip status to pending]
   → art:generate --dry-run → art:generate → art:review → art:pack
   → art:wire --apply   (items only)
```

## Layout

```text
art/
  manifests/           committed — one JSON per category, entry = one asset
  style/               committed — style anchor images (bitforge style refs)
  src/                 committed — SOURCE OF TRUTH; paths mirror atlas frame names
  candidates/          gitignored — generated outputs awaiting review
  pixellab.lock.json   committed — per-call spend ledger + request-hash cache
```

## Rules

- Frame names never change: `art/src/sprites/monsters/boar.png` packs to frame
  `sprites/monsters/boar.png`. That's what keeps `frameMaps.ts`, `ItemIcon`,
  and `uiAtlas` working with zero code changes.
- Entry `status` lifecycle: `draft` (no prompt) → `pending` (queued/awaiting
  review) → `accepted`, or `regen` after a rejection (notes carry guidance).
- Atlas packing is deterministic (shelf pack, height-desc then name); the JSON
  is tab-indented to match the original free-tex-packer output.
- `UI_icons` frames receive a 2px transparent gutter during packing so
  fractional CSS/canvas scaling cannot sample neighboring icons.
- `shadows.json` is bake output, not art — `bake:hitboxes` rebakes it on server
  boot when the sprites.png hash changes.
- Endpoint size caps: bitforge 200², pixflux 400², generate-ui 792×688.
  Generation is proportionally clamped; accept NN-resizes to the manifest size.
- Useful entry `params` (camelCase, passed through to the API):
  `outline`, `shading`, `detail`, `view`, `direction`, `seed`,
  `textGuidanceScale`, `styleStrength` (Bitforge only; 0–100, default 65 with a style anchor),
  `colorPalette`, `frameCount`, `noBackground`, and for img2img:
  `initImage` (art/src-relative path, or `"self"` = this entry's current art —
  "same sprite, regenerated cleanly") with `initImageStrength` (1–999,
  default 300; higher follows the source more closely).
- `generationScale` generates candidates at an integer multiple of the final
  manifest size (for example, `2` generates a 32px icon at 64px). Review
  acceptance still nearest-neighbor resizes to the manifest's final size. Any
  img2img `initImage` is nearest-neighbor resized to that generation size too.
- Style anchors live in `art/style/` — see its README. Existing sprites copied
  from `art/src/` make free anchors.
- `players` category uses img2img EVOLUTION CHAINS (vagrant → class root →
  frame): each link's `initImage` is its predecessor's accepted art, so links
  stay `draft` until the predecessor lands. Recipe + rationale:
  `docs/player-sprites-current-state.md`.
- Audio is out of scope: PixelLab is visuals-only.
