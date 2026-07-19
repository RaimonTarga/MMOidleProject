# Player Sprites — Current State

Decision landed 2026-07-12. This is the living truth for how player character
visuals are produced and rendered. Design rationale/constraints live in
`docs/visual_and_aesthetics_design/player-visual-identity-bible.md`; the
superseded bake-time composite idea is preserved in
`docs/pixellab-pipeline-plan.md` (its "Player composite" section carries a
superseded note pointing here).

## The decision

**Evolving flat sprites + runtime identity accents.** Not bake-time part
compositing, not a paper-doll.

- **Bodies are full flat 64×64 sprites** produced as PixelLab **img2img
  evolution chains**: vagrant → class root → the three frame variants (and,
  later, rare full-body paradigm-shift specs). Each link feeds its
  predecessor's accepted art as `initImage`, which preserves silhouette DNA —
  the "same character, evolved" behavior img2img is actually good at (proven
  by the brute-v8 proportions fix in Phase 0).
- **Range, path, and tier identity render as identity accents** — persistent
  overlay sprites (halo, glyph, hand glow) layered on the body at runtime.
  Accents are alignment-insensitive (they center on the body), so they dodge
  the part-alignment problem entirely. They never swap the body.
- **Why not diff-extracted parts:** the tooling does whole-canvas img2img, not
  masked inpainting — every pixel regenerates, so a diff against the base is
  full-sprite noise, not a clean part layer. `art:bake-players` stays unbuilt
  unless a future case truly needs pixel-aligned parts.

## Production inventory (Stages 0–2)

1 vagrant + 5 class roots + 15 class-frames = **21 bodies** (Summoner/Conduit
deferred until its class identity pass; it renders the classless vagrant
meanwhile). Range bodies (in-fighter, lancer, phantom-blade, vanguard, …) are
**retired**: `PLAYER_FRAMES` no longer maps them and `resolvePlayerFrame`
dropped its range tier, so the class-frame body stays visible after a range
choice. The old range PNGs still sit in `art/src/sprites/classes/` —
unreferenced; delete whenever.

## Chain recipe (per class)

Manifest: `art/manifests/players.json` (**pixflux, prompt-only** — no style
anchor; 64×64, `view: low top-down`, `direction: east`). v1 lesson
(2026-07-12): bitforge with `style/creatures.png` — a wolf — as style anchor
made the vagrant animalistic/furry. Every accepted monster shipped through
pixflux with style carried by the prompt language ("painterly pixel art, soft
volumetric shading, minimal outline"); players now do the same, with character
consistency coming from the initImage chain. Player prompts must also spell
out: **human** figure, upright straight-backed posture, no skin visible
(cloth gloves/boots/tunic/hood), hood interior a pure black void, plus an
animal negative cluster (animal, furry, fur, tail, muzzle, paws, quadruped,
hunched…).

1. **Vagrant first.** `classless` is `pending` with a full prompt; it is the
   root of every chain. Generate → review → accept.
2. **Class root.** Flip the class entry (e.g. `cadence`) to `pending` only
   after its `initImage` predecessor is accepted — before that, img2img would
   run against the old placeholder art. Prompt pattern: *"the same hooded
   faceless spirit taking form as …"*; `initImageStrength` 250 (evolve, not
   copy — raise toward 350 if off-model, lower toward 180 if it barely
   changes).
3. **Frames.** Three entries img2img from the accepted class root at strength
   300 (closer to source). Prompt pattern: *"the same faceless … fighter
   with/as …"*.
4. Repeat per class. The Cadence/Striker chain is fully prompt-authored as the
   vertical slice; validate it in-game before authoring the other four.

Prompt guardrails (bible-locked): faceless (void under hood), genderless, **no
visible weapons ever**, painterly pixel art / soft volumetric shading /
minimal outline, class accent colors from bible §13.

## Identity accents (wired, no art yet)

- `PLAYER_ACCENTS` + `resolvePlayerAccent` in
  `shared/src/sprites/frameMaps.ts`. Registry keys are **skill node ids**
  (range choice, T3 path node, spec node); value = atlas frame + optional
  tint. Most recently unlocked registered skill wins, so deeper choices
  naturally take precedence.
- Client layer: `client/src/fx/identityAccent.ts` (sibling of `fx/aura.ts` —
  auras are transient combat-state glows driven by the networked `aura` id;
  accents are persistent and derived from skills). Ticked in
  `sceneSetup.ts` next to `updatePlayerAuras`; tracks the y-sorted body,
  additive blend, hidden on death.
- Adding an accent is data-only: author a small near-white overlay sprite
  (new `sprites/accents/` frames via the normal pipeline), register it in
  `PLAYER_ACCENTS` with a color. Zero further code.

## Stage 0 production log (2026-07-12, 9 iterations)

The vagrant is **accepted and packed** (green + 1.25×-widened retouch of the
v6 generation), pending one final in-game width check. Hard-won lessons that
apply to every future player sprite:

- **Never bitforge with the creature anchor** — v1 style-transferred a wolf
  onto the vagrant. Players are pixflux prompt-only.
- **`direction` param**: `east` = literal profile; front-right 3/4 is
  `south-east`. Don't also fight it in prose ("turned toward the right side
  of the frame" reads as profile).
- **Game-y-ness is style, not subject**: "clean readable game sprite" works;
  "a videogame player character" as the subject produces mascots. Head size
  ~3.5 heads was the sweet spot; "chunkier/wider" prompts produce muscles,
  not width.
- **img2img (`initImage: "self"`) anchors composition but also anchors
  palette** — recolor requests mostly lose at strength ≥250.
- **Palette and geometry are code, not generation**: hue-shift + figure
  widen live in `art/workbench/classless/retouch.mjs`. Raw generations put
  the figure at ~44% canvas width; the game's old sprites sit at 59–64% —
  measure occupancy and correct it deterministically.
- Rejecting in the gallery **deletes the candidates** — copy keepers to
  `art/workbench/` first if they might seed an img2img round.

## Deferred

- Summoner/Conduit chain — after its class identity pass.
- Accent art (range/path/tier) — registry is empty; the render path is live.
- T3+ refinement bodies — `resolvePlayerFrame` still honors
  `{archetype}-{variant}-t3` keys when frames appear.
- Paradigm-shift full-body specs (bible §25) — same chain mechanism, img2img
  from the class-frame body.
