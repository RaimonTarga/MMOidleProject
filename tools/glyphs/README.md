# Hand-authored UI glyphs

Small abstract UI symbols are authored here as pixel maps, not generated. They
render into `art/src/UI_icons/**` and ship through the normal
`pnpm art:pack --atlas=UI_icons` step, so nothing downstream knows or cares that
they skipped the PixelLab pipeline.

```bash
pnpm art:glyphs                    # render every glyph into art/src
pnpm art:glyphs --check            # validate the maps, write nothing
pnpm art:glyphs --sheet=out.png    # also write a review contact sheet
pnpm art:pack --atlas=UI_icons     # ship them
```

## Why these are not generated

At icon size the entire glyph is ~256 meaningful pixels. Every diffusion tool —
PixelLab, Retro Diffusion, and the rest — generates larger and downscales, and
the downscale is exactly where a deliberate 1px edge becomes three ambiguous grey
pixels.

This repo has now hit that wall three times:

1. The 16px pace-family modifier badges were generated, failed, regenerated,
   failed again, and were replaced with two-letter typography (2026-07-24).
2. The Wave 3 V0b batch — 22 entries, 66 candidates, $0.47 — came back legible at
   64px and unreadable at the 18px HUD footprint, in a glossy teal palette
   nothing like the approved family (2026-07-26).
3. Measuring the *approved* family explains why it was never reproducible: those
   eight 32x32 navigation icons contain **1041 distinct colours**, because they
   too are downscaled generated art. There was no palette to match, only noise
   that happened to land well.

PixelLab remains the right tool for what it is good at — roughly 1,280 successful
generations here across monsters, players, environment, and item icons. Those are
64px+ organic subjects where a diffusion prior helps. Abstract symbols at icon
size are the case where it structurally cannot.

The rejected candidates stay in the (gitignored) `art/candidates/ui-icons/`, and
their manifest entries are `draft` with the rejection recorded, so generation
never re-arms over authored art.

## Reviewing — not through `art:review`

`art:review` is for choosing between *generated candidates*: Accept copies the
winner into `art/src`. Authored glyphs are already the art in `art/src`, so there
is nothing to choose, and pressing Accept on one of these entries would overwrite
the authored PNG with a rejected AI candidate — which the next `art:glyphs` run
would then silently overwrite back. Two sources of truth, fighting.

The gallery lists every manifest entry regardless of status, so those entries do
appear there with the authored art shown as "current". They are safe to look at,
but the rejected V0b candidates were moved to
`art/candidates/_rejected-ui-icons-2026-07-26/` so the gallery cannot offer an
Accept for them at all.

Review these with the contact sheet instead:

```bash
pnpm art:glyphs --sheet=art/candidates/glyph-sheet.png
```

Left column is 4x for judging placement, right column is the literal 16px the HUD
draws. Judge the right one. Name a glyph and what's wrong with it; the fix is a
character edit in `glyphs.ts` and a re-run.

## Authoring

`glyphs.ts` holds one entry per glyph: an atlas `out` path and a square pixel
map. **The map's size is the shipped size — nothing is ever resampled.**

| Grid | Used by | Why |
|---|---|---|
| 16×16 | stat glyphs, action glyphs | The HUD draws these at 16px in a `GlyphTile` or `ActionChip`. |
| 32×32 | class root sigils | The passive tree renders them on 88px nodes; 16 starves a three-part cycle or a figure with three skulls. |

`palette.ts` holds the seven tones, sampled from the approved navigation icons:

| Key | Tone | Use |
|---|---|---|
| `.` | transparent | |
| `K` | `#0a0b0b` | near-black outline |
| `D` | `#2c2f2f` | charcoal body |
| `L` | `#484e4e` | charcoal lit face |
| `b` | `#6c562c` | bronze shadow |
| `B` | `#ab8543` | bronze detail |
| `C` | `#b5f9fb` | pale cyan accent |
| `c` | `#6eebf4` | cyan deep |

Rules that keep the set coherent:

- **Judge at the small size.** The contact sheet's right column is the literal
  16px render. A glyph that only works at 4x does not work.
- **Silhouette carries meaning, not colour.** Class roots are deliberately not
  class-tinted — the passive tree puts the class tone on the orb behind the node,
  and navigation art is a transparent symbol layer.
- **Cyan is the energised element**, used sparingly; bronze is wear and
  mechanism. A glyph that is mostly cyan has lost the family.
- **Ragged maps throw.** `validateGlyphs()` fails on any map that is not square
  at a supported size, because a miscounted row silently shifts the whole glyph.

Iteration is a character edit and a re-run. That is the entire argument for this
approach over a generated batch: fixing a wrong pixel costs a keystroke rather
than a re-roll, a review round, and a credit.
