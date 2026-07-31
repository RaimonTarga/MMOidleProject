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

**Stages 1 AND 2 are COMPLETE as of 2026-07-25.** All 6 roots and all 18
tier-2 frames are accepted, packed, and mapped — every one of the 25
`PLAYER_FRAMES` targets resolves to a real atlas frame.

| Entry | Class | Root read | Frame axis (light → balanced → heavy) |
|---|---|---|---|
| `cadence` | Striker | dark hooded fighter, chainmail, shoulder guards | lean duelist → skirmisher → breaker |
| `cooldown` | Squire | iron great helm, **no hood**, plate + tabard | mobile → knight → fortress (heavy gets the solid faceplate) |
| `dot` | Apprentice | stained ragged robe, sealed sleeves, sigils | venom → ember → rime |
| `reload` | Slinger | hood over pale mask w/ painted eye, amber sash | scout → marksman → artillerist |
| `energy` | Spirit | **monochrome** hooded tunic, void hood, mist hem | **white → grey → black** value ramp |
| `summoner` | Conduit | deep red robe, blank white mask, **no hood** | swarm → stable → conductor |

Two classes deliberately break the shared hooded silhouette at the head — the
Squire (great helm) and the Conduit (blank mask). That is what makes them
readable next to four hooded classes; see the lessons below.

Summoner/Conduit was **un-deferred** at the user's call. The body is authored
(mask-bearer direction, chosen from four pitched options), but summon-family
lore stays open and its minions still alias to the Tiny Wisp placeholder.

### The Spirit rebuild (why it cost the most rounds)

The original Spirit root encoded its identity as **absence** — no feet, no
hands, no colour, no parts — and every downstream failure traced back to that:

- Absence fought the chain. `classless.png` asserts a booted, gloved body, so
  the entry had to go off-chain to lose them, which cost it roster proportions.
- A smooth featureless robe column gave its **frames nothing to modify**, so
  light/balanced/heavy came out identical no matter how the adjectives changed.

It was rebuilt as a **garment with parts** (tunic, short cloak, sash, wrapped
arms) whose ghostliness lives on the **surface** — monochrome palette, rim
glow, hem dissolving into mist — rather than in the silhouette. That let it
chain from the vagrant like every other root, and gave the frames the
white/grey/black value ramp. Value contrast is the strongest differentiator at
64px, far stronger than shape detail.

**Legibility guard, deliberate:** the white frame keeps dark charcoal wraps and
sash; the black frame keeps a white rim glow and lit seams. Each holds anchor
pixels of the opposite value so the body stays readable on tundra snow and cave
floor alike. **This has not yet been verified in-game — do it before trusting
it.**

## Chain recipe (per class) — CORRECTED 2026-07-25

Manifest: `art/manifests/players.json` (**pixflux, prompt-only** — no style
anchor; 64×64, `view: low top-down`, `direction: south-east`). v1 lesson
(2026-07-12): bitforge with `style/creatures.png` — a wolf — as style anchor
made the vagrant animalistic/furry. Players use pixflux with style carried by
the prompt language and params.

> **This section previously documented a painterly / `lineless` /
> `detailed shading` / strength-250–300 recipe. That recipe never shipped a
> single accepted player sprite.** Everything accepted uses the recipe below,
> extracted from the accepted `cadence` entry. (The tier-2 stubs carried the
> stale painterly params too; they were repointed during the Stage 2 run.)

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
3. **Frames.** Three entries img2img from the accepted class root at
   **strength 80** — *not* higher. This was measured, and the original stubs
   had it backwards: 150 simply reprints the root, 70 gives good silhouette
   variation but lets faces and palette drift, **80 holds both**. Exceptions
   are per-frame and principled, not recipe changes:
   - **Balanced frames may go to ~120** — balanced is defined as the class's
     most neutral identity, so inheriting the root closely is correct. This is
     how the Squire's stubborn face-on angle was finally fixed.
   - **Big palette moves need 30–55 or no chain at all.** Palette is
     chain-anchored as hard as structure. The Spirit's white frame had to drop
     to 55 (30 lost framing entirely) while its black frame stayed at 80,
     because black is where the root already was.
4. Stash candidate sets to `art/workbench/<id>/` **before** review. Rejecting
   in the gallery deletes the candidates, and "candidate 3 was best" is
   worthless if candidate 3 is gone.
5. **At frame strength the chain no longer enforces identity.** Anything that
   must be true of every frame — faceless void, great helm, painted eye,
   turned mask, class palette, no weapons — has to be **restated in each
   frame's prompt**. At 150 the chain gave it for free, which is why the
   original stubs never mentioned any of it.

### Prompt-engineering lessons (2026-07-25 Stage 1 + 2 run)

Hard-won across ~$2.20 and roughly forty rounds; they generalize to every
future body.

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
- **Palette is chain-anchored; big colour moves need low strength or no chain.**
  Small moves ride along fine (the Spirit's black frame kept the root's
  darkness at 80 because that is where it was already going); large ones do
  not (its white frame needed 55, and monochrome only took hold once the root
  itself was regenerated low). Corollary: **negatives must ban the value, not
  just the hue** — banning colours while leaving black/charcoal unbanned let
  the root's darkness walk straight into a frame that was supposed to be white.
- **Use the chain as a structure lever, not just a style anchor.** When an
  entry keeps failing to acquire a property, chain it from whichever accepted
  sibling already *has* that property. The Conduit's face kept rendering
  face-on because a featureless oval mask carries no facing information; the
  fix was chaining it off `cadence.png`, which already had the 3/4 turn. This
  is the single highest-leverage trick in the whole run.
- **Framing is not held by params.** `view`/`direction` alone produced the
  Squire's flat elevation and, at low strength, half-body crops. The framing
  sentence has to live in the prompt, as it does in the accepted vagrant's.
- **Differentiate by naming different PARTS, not by intensifying adjectives.**
  "Bulkier"/"slimmer" produced nothing across two rounds; "pauldrons wider than
  the hips, a banded plate skirt" produced it immediately.
- **Never subtract on more than one axis at once.** The Spirit's light frame
  got a plainer garment *and* a paler value *and* a lower strength, and came
  back a featureless blob. At 64px absence reads as "unfinished", not as
  "light". Light means a lighter *build*, not a less *designed* one.
- **When a prompt drifts off-style, SHORTEN it before adding to it.** Three
  rounds of individually reasonable additions grew the Conduit prompt to ~120
  words and produced a complete miss; cutting it back to the short
  identity-only shape recovered the style in one round.
- **`generationScale: 2` changes more than resolution.** It shifted framing to
  half-body crops and raised detail past the flat 64px house style. Use it only
  when fine detail genuinely needs the pixels, and expect to re-roll at native
  scale afterward.
- **Batch size: 6 for taste rounds, 3 while direction-finding.** Every failure
  in this run was systematic rather than stochastic — all candidates failed
  identically — so extra candidates only pay off once the recipe is right and
  the remaining choice is preference.

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

## Colour pass — DONE 2026-07-25

Applied deterministically in code, **no regeneration**. Tools live in
`art/workbench/roster/`:

- `sheet.mjs` — renders the whole roster as one contact sheet (rows = classes,
  columns = root/light/balanced/heavy) at 4× plus a palette report (neutral /
  dark / light coverage and dominant hues per sprite). `--src=` points it at a
  preview dir. Run it before and after any palette work.
- `recolour.mjs` — per-class **or per-file** hue rules; `--preview` writes to
  `preview/`, `--apply` edits `art/src` after backing originals up to
  `pre-colourpass/`. Generalises the old one-off `classless/retouch.mjs`.

**Why it was needed:** the contact sheet showed five of six classes sitting in
the same cool blue-violet band (Striker 65% blue, Squire 66%, Slinger 49%
violet, Spirit 83% blue, Apprentice 42% violet). Class colour identity was
effectively absent — invisible in-game, where classes are rarely seen side by
side, and obvious the moment they are.

| Class | Change |
|---|---|
| Striker | untouched — steel + crimson was already on-identity |
| Squire | untouched — iron *is* its identity |
| Apprentice | root → poison green; **frames are elemental** (bible §20 paths): light Venom, balanced Ember, heavy Rime |
| Slinger | → amber/ivory; the amber was previously only trim |
| Spirit | → true neutral; the monochrome intent had leaked blue |
| Conduit | → deeper crimson, pulling magenta back toward red |

Striker and Conduit both carry red and stay distinct **by area** — steel body
with a red sash vs a fully red robe.

**The lesson worth reusing:** the Apprentice's three frames now differ by hue
alone and are the most instantly distinguishable set in the roster — more so
than the Striker's or Squire's, which cost many generation rounds to separate
by silhouette. Prefer to spend generation on silhouette and let a code pass do
the colour identity afterward.

## Next up

Stages 0–2 and the colour pass are done. In rough priority order:
2. **Stage 3: identity accents** (see below) — the registry is empty and the
   render path is live, so this is data-only work.
4. **Prune the retired range bodies** (`in-fighter`, `lancer`,
   `phantom-blade`, `vanguard`, …) and the loose `summoner-variant-*` frames
   kept as spares — all unreferenced, all still packed into the atlas.

## Deferred

- Accent art (range/path/tier) — registry is empty; the render path is live.
- T3+ refinement bodies — `resolvePlayerFrame` still honors
  `{archetype}-{variant}-t3` keys when frames appear.
- Paradigm-shift full-body specs (bible §25) — same chain mechanism, img2img
  from the class-frame body.
