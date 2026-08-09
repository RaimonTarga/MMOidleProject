> **ARCHIVED (2026-08-09) — tooling shipped 2026-07-10.** Live usage docs: `tools/pixellab/README.md`.
> The art overhaul itself is planned and tracked in
> `design_docs/visual_and_aesthetics_design/overhaul-roadmap.md`; player sprites in
> `docs/player-sprites-current-state.md`. Kept for the original pipeline design and the superseded
> bake-time composite rationale (dropped 2026-07-12).

# PixelLab Asset Pipeline Plan

Full-art-overhaul pipeline: generate every game sprite, icon, UI element,
environment piece, and background through the PixelLab API, curate via a local
candidate gallery, and consolidate all art into one in-repo source tree that
compiles into the existing atlases.

Status: TOOLING SHIPPED (2026-07-10) — the full CLI suite in `tools/pixellab/`
is implemented and verified (see its README for usage); no art has been
generated yet. Next: style anchors, then monster prompts.
Absorbs `docs/future-plans.md` §1 (composite player sprites — SUPERSEDED
2026-07-12: players use flat img2img evolution chains + runtime identity
accents, see `docs/player-sprites-current-state.md`) and the icon bullet of
§2 (tier-evolving UI).

Implementation notes that superseded the plan below:
- `art:import` was added (not in the original plan): it slices the shipped
  atlases into `art/src/**`, which bootstrapped the committed source tree and
  was verified pixel-identical on repack (294/294 frames).
- `art:seed` was split out of `art:status`: it builds/refreshes draft manifest
  entries from MONSTER_FRAMES/PLAYER_FRAMES/ITEM icons/asset files.
- No new dependencies: packing is a hand-rolled deterministic shelf packer
  (sharp raw-copy, no alpha-rounding) emitting the same JSON shape free-tex-packer
  produced; the gallery is a dependency-free node http server.
- `art:bake-players` is NOT built and stays unbuilt: the composite/paper-doll
  scheme was dropped 2026-07-12 in favor of flat img2img evolution chains +
  runtime identity accents (`docs/player-sprites-current-state.md`). The
  "Player composite" material below is historical.
- Verified API facts: auth `Bearer`, pixflux ≤400², bitforge ≤200² with
  `style_image`, generate-ui ≤792×688 and animate-with-text-v3 are async
  background jobs. The current key is a trial subscription (40 generations,
  quota-based → per-call `usage.usd` may be null; budget falls back to estimates).

---

## Decisions locked with the user (2026-07-10)

- **Static frames, better art.** 1:1 replacement of every sprite; no animation
  system rework. Animations for key entities can be a later phase on the same
  pipeline (PixelLab animate endpoints output ≤16-frame sheets, which the
  client's existing spritesheet loading already handles).
- **Composite (paper-doll) player sprites** instead of one unique sprite per
  class×variant×range×tier. Direction already designed in future-plans §1:
  **bake-time compositing, not runtime layering** — runtime keeps seeing one
  flat frame per player.
- **Scope: everything.** Entity sprites, item + UI icons, stylized UI elements
  (buttons/panels/bars), biome backgrounds, environment & effects.
- **Manifest-driven CLI** for generation (reproducible, resumable, cached).
- **Candidate gallery curation**: 2–4 candidates per asset, human picks the
  winner in a local gallery before anything ships.

## PixelLab facts (verified 2026-07-10, re-verify at implementation)

- API v2 at `api.pixellab.ai/v2/*`; per-call pricing (~$0.002–$0.185 by
  operation/size). Official JS client: `pixellab-code/pixellab-js`. An MCP
  server also exists for interactive sessions.
- Endpoints relevant to us: text→image (PixFlux for medium/large, BitForge for
  small/medium **with style reference images**), character generation,
  animate-with-text / animate-with-skeleton (≤16 frames), rotation, inpainting,
  background removal, image→pixel-art conversion, tilesets, and **UI elements**
  (buttons, health bars, menus).
- **No audio.** Sound generation needs a different service (e.g. ElevenLabs
  SFX). Out of scope here; the manifest/curation pattern below is reusable for
  an audio pipeline later, feeding the existing sound engine's file loading.
- Generation sizes top out well below our 1254px backgrounds (~400px class);
  pixel art upscales losslessly with nearest-neighbor, see Backgrounds below.

## Current state (what we're replacing)

| Asset | Packed output | Frames | Notes |
|---|---|---|---|
| Entities | `client/public/assets/sprites.png/.json` (960×1024) | ~128px singles | free-tex-packer output; names like `sprites/monsters/boar.png` resolved via `shared/src/sprites/frameMaps.ts` |
| Item icons | `icons.png/.json` (512×256) | 32×32 | fetched by React `ItemIcon` |
| UI icons | `UI_icons.png/.json` (202×128) | small | `uiAtlas.ts` |
| Backgrounds | 13 loose `biome_*.png` | 1254×1254 | one per biome + old_backgrounds/ junk |
| Environment | loose PNGs (trees 2048×2048 + hitbox sheet, decor, thrones, graves) | mixed | trees pair with `bake:hitboxes` |
| Effects/emotes | loose spritesheets (`animations/`, `emotes/`) | strips | already sheet-based |

**Key problem this fixes:** the raw pre-pack PNGs are NOT in the repo — only
packed outputs are. The pipeline establishes the in-repo source of truth.

## Architecture

### Source tree (new, committed)

```text
art/
  manifests/            # generation manifests, one JSON per category
    monsters.json
    player-parts.json   # base bodies + part layers, NOT permutations
    items.json
    ui.json             # icons + buttons/panel-borders/bars
    environment.json
    effects.json
    backgrounds.json
  style/                # accepted style-anchor images (BitForge refs)
  src/                  # ACCEPTED assets — the single source of truth
    sprites/monsters/…  #   paths mirror atlas frame names exactly
    sprites/classes/…   #   (baked player frames land here)
    parts/…             #   player base bodies + diff-extracted part layers
    items/…
    ui/…
    environment/…
    backgrounds/…
  candidates/           # GITIGNORED — raw API outputs awaiting review
  pixellab.lock.json    # request-hash → output-hash cache + spend log
tools/pixellab/         # the CLI scripts (tsx, like existing tools/)
```

### Manifest entry shape

```jsonc
{
  "id": "boar",
  "category": "monster",
  "out": "sprites/monsters/boar.png",   // == atlas frame name, unchanged
  "size": { "w": 128, "h": 128 },
  "prompt": "stocky wild boar, side view, transparent background",
  "styleRef": "style/creatures.png",
  "endpoint": "bitforge",
  "candidates": 3,
  "status": "pending"                    // pending | accepted | regen
}
```

`status: regen` plus a `notes` field is how gallery rejections feed prompt
tweaks back into the next batch.

### CLI commands (root package.json scripts)

- `pnpm art:generate [--category X] [--id Y] [--dry-run] [--budget $N]`
  Reads manifests, calls PixelLab (thin wrapper or pixellab-js) for every
  `pending`/`regen` entry, writes candidates. Skips anything whose
  prompt+params hash is already in `pixellab.lock.json`. `--dry-run` prints
  estimated cost from a per-endpoint price table; `--budget` hard-stops a run.
- `pnpm art:review`
  Serves a tiny local gallery (static HTML + JSON, no framework): candidates
  side-by-side with the current live sprite at in-game scale, on light/dark
  ground. Click winner → moved to `art/src/`, manifest → `accepted`.
  Reject-with-note → manifest → `regen`.
- `pnpm art:pack`
  Packs `art/src/` into the four atlases using `free-tex-packer-core` (dev
  dep; config committed), preserving today's frame names so
  `frameMaps.ts`, `ItemIcon`, `uiAtlas` need **zero changes** for the swap.
  Copies loose-file categories (backgrounds, environment, effects) into
  `client/public/assets/` verbatim.
- `pnpm art:bake-players`
  The future-plans §1 composite bake (sharp is already a server dep): base
  body + parts + palette-remap JSON → flat per-permutation frames into
  `art/src/sprites/classes/` → picked up by `art:pack`. Includes the
  ~30-line diff-extract script (part = pixels that differ from base).
- `pnpm art:status`
  Coverage report: manifests cross-checked against `MONSTER_DATABASE`, item
  DB, and `frameMaps.ts` so no entity ships without accepted art and no
  manifest entry is orphaned.

### API key

`PIXELLAB_API_KEY` in root `.env` (already gitignored). Add `.env.example`
documenting it. Tools fail fast with a clear message if unset; the key is
never logged and never committed. **Never paste the key into chat.**

## Per-category approach

- **Style anchors (phase 0, do first).** Interactively generate and hand-pick
  ~5 anchors: one creature, one character, one item icon, one UI panel, one
  terrain. Every batch generation passes the category's anchor as BitForge
  style reference — this is what makes 200+ assets read as one game.
- **Monsters (~50).** 128px, transparent background, consistent facing.
  Pure atlas swap; validates the whole pipeline end-to-end.
- **Player composite.** Per future-plans §1: hand-polish 6 base bodies first
  (interactive, not batch); author parts by inpainting over the base
  ("same character, now with iron pauldrons") then diff-extract; palette
  remaps are data (JSON), applied at bake — never Phaser tint. Manifest
  tracks parts; permutations are bake output. `resolvePlayerFrame` learns the
  new naming scheme — the only client code change in the whole plan.
- **Item icons.** 32×32 batch via BitForge + icon anchor. Largest count,
  lowest risk.
- **UI elements.** Icons like items; plus 9-slice border strips, buttons, and
  bars sized for the future-plans §2 primitives (`Panel`/`Button`/`Slot`/
  `Bar`/`TabStrip`). Generate the tier-1 skin now; further tier skins are
  palette-remap output reusing the bake tooling.
- **Environment & effects.** Decor as one-off generations (rotation endpoint
  helps for multi-variant trees). Regenerated trees require a
  `bake:hitboxes` + trees_hitbox rebake — silhouettes change. Effects via
  animate-with-text (≤16 frames) → strips matching the existing
  `animations/*.png` pattern.
- **Backgrounds.** Generate at max native size (~314–420px), nearest-neighbor
  upscale ×3–4 to 1254×1254 (lossless for pixel art, and chunky pixels at
  game zoom is the aesthetic anyway). Tileset-based nodes are explicitly out
  of scope (renderer change); note it in future-plans if wanted later.

## Rollout order

1. Phase 0: key setup, `tools/pixellab` skeleton, style anchors.
2. Monsters — proves generate→review→pack end-to-end, biggest visual delta.
3. Item + UI icons.
4. Environment + effects (+ hitbox rebake).
5. Backgrounds.
6. Player composite (base bodies → parts → bake) — last because it has the
   most novel tooling and the only code change.

Each phase ships independently; atlases regenerate additively so the game is
playable with mixed old/new art between phases.

## Model delegation (token economy vs task complexity)

Which Claude model to use per work item. Rule of thumb: high-volume
mechanical work → Sonnet; self-contained tooling with a clear spec → Opus;
cross-cutting design, art direction, or the one code change that touches
shared resolution logic → Fable.

| Work item | Model | Rationale |
|---|---|---|
| Phase 0: `tools/pixellab` skeleton (env loading, manifest schema, lockfile, price table, dry-run) | Opus | Greenfield but fully specified here; self-contained, no game code touched |
| Style anchor sessions | Fable | Low token volume, all judgment: prompt-craft, style vocabulary, taste calls with the user |
| `art:generate` implementation | Sonnet | API loop + hash caching + budget stop, spec'd in detail above |
| `art:review` gallery | Sonnet | Isolated static-HTML tool, no game integration |
| `art:pack` | Opus | Must reproduce exact existing frame names across 4 atlases; silent mismatch = broken sprites everywhere |
| `art:status` | Sonnet | Mechanical cross-check against registries |
| Manifest prompt authoring (~50 monsters, 100+ icons) | Sonnet | Highest token volume, lowest complexity; Fable spot-reviews a sample per category before batch runs |
| Environment phase (+ `bake:hitboxes` / trees_hitbox rebake) | Opus | Touches the existing hitbox bake pairing; needs care, not design |
| Backgrounds NN-upscale script | Sonnet | Trivial sharp script |
| Player composite: `art:bake-players`, diff-extract, palette remap | Opus | Self-contained scripts (future-plans §1 already rated this Opus-suitable) |
| Player composite: permutation naming scheme + `resolvePlayerFrame` change | Fable | The plan's only shared/client code change; cross-cutting, cheap in tokens, expensive if wrong |

## Guardrails

- `scripts/size-check` allowlist will need updating as atlases grow; treat
  size-check failures as a review gate, not a nuisance.
- `pixellab.lock.json` records every paid call (endpoint, params hash, cost
  estimate) — doubles as a spend ledger.
- No server involvement anywhere: this is entirely `art/` + `tools/` +
  `client/public/assets/` + one shared frame-map naming change at the end.
