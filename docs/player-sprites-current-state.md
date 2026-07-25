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

1 vagrant + 6 class roots + 18 class-frames = **25 bodies**. Range bodies
(in-fighter, lancer, phantom-blade, vanguard, …) are **retired**:
`PLAYER_FRAMES` no longer maps them and `resolvePlayerFrame` dropped its range
tier, so the class-frame body stays visible after a range choice. The old range
PNGs still sit in `art/src/sprites/classes/` — unreferenced; delete whenever.

**Stage 1 is COMPLETE as of 2026-07-25** — all six class roots are accepted,
packed, and mapped in `PLAYER_FRAMES`:

| Entry | Class | Read |
|---|---|---|
| `cadence` | Striker | dark hooded fighter, chainmail, shoulder guards |
| `cooldown` | Squire | full-face iron great helm, **no hood**, plate + tabard |
| `dot` | Apprentice | stained ragged robe, sealed sleeves, sigils |
| `reload` | Slinger | hood over pale mask, short cloak, amber sash |
| `energy` | Spirit | pale grey/white robe, no feet, no hands, smoke hem |
| `summoner` | Conduit | deep red robe, blank off-white mask, **no hood**, spare masks |

Summoner/Conduit was **un-deferred** at the user's call — the bible still says
its identity pass is pending, but the body is now authored (mask-bearer
direction, chosen from four pitched options). Summon-family lore stays open,
and its minions still alias to the Tiny Wisp placeholder. Its three tier-2
frame entries do not exist yet in the manifest; `resolvePlayerFrame` falls back
from `summoner-{variant}` to the root, so this renders correctly meanwhile.

## Chain recipe (per class) — CORRECTED 2026-07-25

Manifest: `art/manifests/players.json` (**pixflux, prompt-only** — no style
anchor; 64×64, `view: low top-down`, `direction: south-east`). v1 lesson
(2026-07-12): bitforge with `style/creatures.png` — a wolf — as style anchor
made the vagrant animalistic/furry. Players use pixflux with style carried by
the prompt language and params.

> **This section previously documented a painterly / `lineless` /
> `detailed shading` / strength-250–300 recipe. That recipe never shipped a
> single accepted player sprite.** The six accepted roots all use the recipe
> below, extracted from the accepted `cadence` entry. The 18 tier-2 frame stubs
> in the manifest still carry the old painterly params — **repoint them before
> generating any frame**, or Stage 2 will not match Stage 1.

**The recipe that works:**

```jsonc
"params": {
  "outline": "selective outline",
  "shading": "flat shading",
  "detail":  "low detail",
  "view":    "low top-down",
  "direction": "south-east",
  "initImage": "sprites/classes/classless.png",  // the accepted vagrant
  "initImageStrength": 70                        // 90 if breaking the head silhouette
}
```

Prompts are **short and identity-only** — subject, materials, 2–3 color
blocks, stance, "empty hands with no weapon". No style adjectives in the
prompt; style comes from the params and the chain. Guardrails (bible-locked):
faceless, genderless, **no visible weapons ever**, class accent colors from
bible §13.

1. **Vagrant first.** `classless` is the root of every chain. (Its own entry
   references `classless_reference.png`, which no longer exists — the vagrant
   is not regenerable as authored. Harmless unless it is ever re-rolled.)
2. **Class root.** Flip the entry to `pending` only after its `initImage`
   predecessor is accepted. Strength **70**; go to **90** only when the class
   must break the shared head silhouette.
3. **Frames.** Three entries img2img from the accepted class root — same
   params, higher strength (they should stay close to their root).
4. Stash candidate sets to `art/workbench/<id>/` **before** review. Rejecting
   in the gallery deletes the candidates, and "candidate 3 was best" is
   worthless if candidate 3 is gone.

### Prompt-engineering lessons (2026-07-25 Stage 1 run)

Hard-won across ~$0.30 and six rounds; they generalize to every future body.

- **An `initImage` asserts structure that negatives cannot outvote.** The
  Spirit kept growing feet and hands through three escalating ban-lists,
  because `classless.png` is a booted, gloved, grounded human. The fix was
  leaving the chain, not a better negative list. Same failure mode as the
  vagrant's inherited hunch.
- **Describe what IS there, not what is absent.** "No feet" loses; "the robe
  ends in a ragged torn fringe of smoke" wins. Negation is the weakest tool
  these models have. Give a floating thing a physical reason to float (gap of
  air, ground shadow).
- **Beware the overcorrection.** Deleting the body to guarantee footlessness
  ("an empty robe with nobody inside", bell silhouette) produced a figure that
  no longer matched the roster. The body had to go back in as positive terms —
  square shoulders, upper arms, hem at ankle height — with hands/feet still
  banned.
- **Classes become distinct by breaking the shared silhouette at the head**,
  not by adding accessories to it. Five hooded cloaked figures left the sixth
  nowhere to stand. Squire = great helm; Conduit = blank mask, no hood. A great
  helm survives a plain chain because it occupies the same head volume as a
  hood; a bare masked head does not, which is why the Conduit needed strength
  90 and lost its mask entirely at 110.
- **Palette is only free off-chain.** img2img anchors color as well as
  structure. The Spirit's dark→pale-grey recolor was possible because that
  entry carries no `initImage`.
- **`generationScale: 2` changes more than resolution.** It shifted framing to
  half-body crops and raised detail past the flat 64px house style. Use it only
  when fine detail genuinely needs the pixels, and expect to re-roll at native
  scale afterward.

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

## Next up

- **Stage 2: the 18 tier-2 frame bodies.** Before generating any of them,
  repoint the manifest stubs from the stale painterly params to the corrected
  recipe above — the stubs were written before Stage 1 proved the recipe and
  would produce off-style frames. Summoner has no frame entries yet; author
  three (`summoner-light/-balanced/-heavy`) and add their `PLAYER_FRAMES` keys
  once the art exists.
- **In-game check** of all six roots at gameplay scale — occupancy/width
  against each other, and the Spirit's pale robe against light biome ground.

## Deferred

- Accent art (range/path/tier) — registry is empty; the render path is live.
- T3+ refinement bodies — `resolvePlayerFrame` still honors
  `{archetype}-{variant}-t3` keys when frames appear.
- Paradigm-shift full-body specs (bible §25) — same chain mechanism, img2img
  from the class-frame body.
