# ICONS-T1 report
**Agent:** Codex   **Branch:** rw/icons-t1   **Last commit:** 807e94557843185054b3acacbb965c5eb0d3c488 (assets and review sheet; this report follows it)
**Date:** 2026-10-14

## Done

- Added all 60 requested 64 x 64 PNGs: 30 class pieces (22 generated, eight reused) and 30 generated trophies.
- Used built-in OpenAI image generation, one image per call: 52 initial generations and two targeted revisions, 54 calls total.
- Attached the full-resolution sweep, charge, brace and slam references to every call. Both revisions also attached the previous full-resolution target as image 5.
- Kept all generated sources at 1254 x 1254 in the local, ignored `art/candidates/openai-icons/class-pieces/` and `trophies/` folders. Sources were generated at that size, without upscaling.
- Exported directly with Lanczos and a 256-color PNG palette. Neither new group uses dark-backdrop flattening; every generated image already has an opaque near-black backdrop.
- Added `['class-pieces', 64, 44]` and `['trophies', 64, 44]` to the preview script. It skips absent source folders, creates the contact-sheet folder, and includes direct shipped-file copies in the sheet by reading the output filenames.
- Committed the exact-size review sheet: [icons-t1-review.png](icons-t1-review.png). All 60 icons appear at 44 px, with reused and generated class pieces together.
- Preserved existing icons, client code, atlas files and PixelLab manifests.

### Generated class pieces (22)

All are in `client/public/assets/concept-icons/class-pieces/<id>.png`.

| Class | IDs |
|---|---|
| Striker | `striker-finisher`, `striker-rend`, `striker-focus` |
| Squire | `squire-shove`, `squire-riposte`, `squire-steel-will` |
| Apprentice | `apprentice-numb`, `apprentice-siphon`, `apprentice-seize`, `apprentice-converge` |
| Slinger | `slinger-plain-clip`, `slinger-scatter`, `slinger-snare`, `slinger-venom`, `slinger-stopping`, `slinger-breaching` |
| Spirit | `spirit-bolt`, `spirit-chain-lightning`, `spirit-thunderclap`, `spirit-downpour`, `spirit-eye-of-the-storm`, `spirit-thunderbolt` |

### Generated trophies (30)

All are in `client/public/assets/concept-icons/trophies/<id>.png`.

| Class | IDs |
|---|---|
| Striker | `striker-relic-plains`, `striker-relic-forest`, `striker-relic-swamp`, `striker-relic-mountain`, `striker-relic-cave` |
| Squire | `squire-relic-plains`, `squire-relic-forest`, `squire-relic-swamp`, `squire-relic-mountain`, `squire-relic-cave` |
| Apprentice | `apprentice-relic-plains`, `apprentice-relic-forest`, `apprentice-relic-swamp`, `apprentice-relic-mountain`, `apprentice-relic-cave` |
| Slinger | `slinger-relic-plains`, `slinger-relic-forest`, `slinger-relic-swamp`, `slinger-relic-mountain`, `slinger-relic-cave` |
| Spirit | `spirit-relic-plains`, `spirit-relic-forest`, `spirit-relic-swamp`, `spirit-relic-mountain`, `spirit-relic-cave` |
| Conduit | `conduit-relic-plains`, `conduit-relic-forest`, `conduit-relic-swamp`, `conduit-relic-mountain`, `conduit-relic-cave` |

Every trophy uses the specified palette and a thin warm-gold glint on a key subject edge; no frame or badge.

### Copied icons (8)

| New ID | Existing ability | Copy method |
|---|---|---|
| `striker-sweep` | `sweep` | Full-resolution source copied, then exported to 64 px |
| `striker-hamstring` | `hamstring` | Shipped 64 px PNG copied unchanged |
| `striker-coil` | `charged-strike` | Full-resolution source copied, then exported to 64 px |
| `squire-slam` | `slam` | Full-resolution source copied, then exported to 64 px |
| `squire-guard` | `brace` | Full-resolution source copied, then exported to 64 px |
| `squire-shield-bash` | `stunning-strike` | Shipped 64 px PNG copied unchanged |
| `apprentice-detonate` | `detonate` | Shipped 64 px PNG copied unchanged |
| `apprentice-spread` | `contagion` | Shipped 64 px PNG copied unchanged |

### Regenerated icons (2)

| ID | Why the first attempt was rejected | Accepted revision |
|---|---|---|
| `slinger-relic-plains` | At 44 px, the bullet pointed left while the push chevrons pointed right, making its direction confusing. | Turned the bullet to align with the chevrons; retained the palette, dust wedge and edge glint. |
| `conduit-relic-cave` | At 44 px, the small spiderlings blended into ghost-fire and the central borer had too much internal texture. | Simplified fire and cracks, removed floating fragments, enlarged and separated the two spiderlings, and gave them broad leg shapes. |

The rejected full-resolution variants remain locally in `art/candidates/openai-icons/rejected/trophies/`; they are excluded from export and review.

### Prompts and provenance

The prompt set uses each brief row's subject, mechanic and palette, followed by this shared direction:

> Modern semi-painterly fantasy game UI icon with contemporary, original MMO readability. One centered bold silhouette, generous padding, strong value separation and broad forms readable at 44 px. Dark charcoal near-black full-square backdrop edge to edge in the #11161d family. Dramatic rim lighting and rich but broad material detail. Match the rendering, lighting, level of detail and backdrop of the reference icons exactly; a new icon from the same set.

Each prompt identifies images 1-4 as sweep, charge, brace and slam style references; requests one 1254 x 1254 square icon with an opaque backdrop; excludes words, letters, numbers, logos, watermarks, borders, UI frames, humanoid figures, tiny filigree and background scenes. Class anchors and the exact clip colours follow ICONS-T1. Trophy prompts add exactly one thin warm-gold glint on the subject's key edge. Mechanic-specific instructions keep counts and broad shapes readable (six cylinder rounds, four chain nodes, three diverging splinters, etc.).

Exact per-call prompts, tool output paths, acceptance/rejection reasons and source dimensions are recorded locally in `art/candidates/openai-icons/generation-ledger.json` and the per-ID JSON files beside the source images. The local audit summary is `art/candidates/openai-icons/validation.json`.

## Checks

- `pnpm typecheck`: clean, exit 0, including workspace, bench and test TypeScript checks. Run before each commit as required.
- `pnpm --filter @mmo-idle/client build`: passed, exit 0; Vite transformed 1116 modules and built successfully. It emitted a bundle-size warning, with no build error.
- `node tools/prepare-openai-icon-previews.cjs`: passed. Prepared 56 source-derived icons; the four direct shipped-file copies bring the total to 60 on the sheet.
- Asset audit: all 60 expected IDs, exactly 30 pieces and 30 trophies, all PNGs 64 x 64; all 52 generated sources 1254 x 1254; no extra or missing runtime files.
- Alpha audit: all 52 generated derivatives fully opaque. The four direct shipped-file copies match their originals byte for byte.
- Visual review: inspected every generated full-resolution result and every shipped icon at 44 px on the exact-size sheet; reviewed subject, silhouette, colour, backdrop, lack of text/frame and consistency with reused art. Rechecked both accepted revisions.
- Review-sheet copy matches the generated sheet byte for byte (924 x 848 PNG).
- `git diff --check`: clean. `git diff --numstat`: only new PNGs, this report and the preview script (eight lines added, one replaced); no line-ending conversion.
- No test substrings were named in the brief; no gameplay test suite, server, bot or browser play session was needed for this asset-only task.

## Not done, or unsure

- No unfinished work within the icon brief.
- Client lookup wiring and validation in the integrated game belong to the class tasks, as directed by the brief. The acceptance review here is the committed 44 px sheet.
- Full-resolution sources and provenance remain local and ignored, as directed; the accepted 64 px assets and review sheet are committed.

## Files outside the brief I needed (not edited)

- None needed editing. Read the bible, generation guide and PixelLab README, and inspected existing shipped icons.
- Read the four mandatory full-resolution style references and the specified reusable source images from the main checkout only; did not modify them.
