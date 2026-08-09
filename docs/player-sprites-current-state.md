# Player Sprites — Current State

Decision landed 2026-07-12. This is the living truth for how player character
visuals are produced and rendered. Design rationale/constraints live in
`design_docs/visual_and_aesthetics_design/player-visual-identity-bible.md`; the
superseded bake-time composite idea is preserved in
`docs/archive/pixellab-pipeline-plan.md` (its "Player composite" section carries a
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

## Identity accents — SHIPPED 2026-07-25 (Stage 3)

Range identity renders as a small forged **ring seated on the head**, one per
class per range: **18 props**, all drawn in code by
`art/workbench/accents/build.mjs`.

**How it renders.** `resolvePlayerAccent` (`shared/src/sprites/frameMaps.ts`)
maps a skill node id to `{ frame, color }`; the most recently unlocked
registered skill wins, so a future T3 path will outrank a range pick with no
code change. `client/src/fx/identityAccent.ts` draws it as a **separate Phaser
image** from the same atlas — never composited into the body — tinted per class
(props are authored near-white so the multiply produces the hue), positioned by
the baked head anchor, mirrored with the body's flip, at `depth + 0.5` (above
the body, below HUD), and destroyed on death or when no accent applies. Nothing
new crosses the wire: it derives from `unlockedSkills`, already networked.

**Head anchors are baked, not guessed.** `art/workbench/accents/anchors.mjs`
scans each body's alpha for its crown and writes
`shared/src/sprites/headAnchors.ts` (25 entries; head centre spread 3px, crown
spread 3px, because every body came from the same chain at the same framing).
Props are drawn with their base on the frame's bottom row, so putting the
frame's bottom-centre on the anchor seats them — no per-body offsets. **Re-run
that script after adding bodies.**

**The model: shape language (class) × treatment (range).**

| | close | mid | far |
|---|---|---|---|
| treatment | heavy solid band | open notched ring | shattered ring |

Class drives the *outline itself*: Striker geometric (hexagonal facets), Squire
squared (hard corners, extra-heavy band), Apprentice wild (regular ring with
uneven spikes and dents punched inward), Slinger regular (true ellipse, even
ticks), Spirit spiky (radiating thorns), Conduit solemn (plain, unadorned).
An earlier version made class a small mark stuck on a shared ring; that read as
texture, not identity.

### What Stage 3 established (three designs were rejected first)

- **Generation has a hard floor at part-scale assets.** PixelLab produced all 24
  bodies, then could not produce a 32px ornament: asked for a "crest" with
  *helmet, head, face* banned, all six candidates were complete horned helmets.
  **Asking for a part of a character summons the whole character.** These props
  are drawn in code instead; `art/manifests/accents.json` is retired and records
  the limit. Bespoke per-class art then costs the same as shared art.
- **Do not use the body-glow channel.** `fx/aura.ts` owns glow+tint on the body
  for transient combat state (surge, channel stages, equinox, storm). A
  permanent glow competes with the vocabulary for "something is happening now" —
  and it covers the bodies this overhaul exists to show off. *(Rejected design 1:
  glowing overlay.)*
- **At ~20px only silhouette CLASS reads** — solid vs open vs broken. Attempts
  to differentiate by detail all collapsed: a 3px sighting ring rendered as a
  plain T, a shallow crescent quantised into a flat bar. Curves need pixels; an
  ellipse is legible, a small arc is not.
- **The 0°/180° antenna trap.** Anything protruding horizontally at the ring's
  sides reads as insect antennae. Additions there must go *downward* (mass — the
  close ring's clamp fangs) or stay *flush* (surface detail). Three separate
  designs failed on this before it was named.
- **Ground decals read as clutter.** *(Rejected design 2: stance rings under the
  feet — unobtrusive, but too easy to miss.)*
- **Deform by damage, not by geometry.** Making the Apprentice's ring irregular
  looked like a badly drawn ellipse; keeping the ring regular and applying dents
  and uneven spikes read as chaos.

Adding an accent is still data-only: draw a prop, register it in
`PLAYER_ACCENTS` under a skill node id with a colour. T3 path accents are the
natural next use of the registry.

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

## Tier 3 — SHIPPED 2026-08-01

**45 T3 bodies, zero generation.** `art/workbench/roster/t3.mjs` recolours each
accepted tier-2 frame to a per-spec hue: 5 classes × 3 frames × 3 specs. One
contact sheet to review instead of ~90 gallery candidates.

**Why not generate 15 T3 bodies.** A generated T3 body would be img2img from its
own T2 frame, and we measured what that does: at the strength that keeps a body
recognisable (~150) it reprints the source. Hours of review for a delta nobody
would see at 64px, on a character whose T2 and T3 selves are never side by side.

**Rules the recolour follows:**

- **Colourise, don't rotate.** v1 rotated each sprite's hue by a delta; the
  middle spec (delta 0) barely changed, and the Squire — 41% neutral steel — had
  nothing to rotate. Assigning the hue outright makes every spec deliberate.
- **Saturation only rises** (`max(existing, floor)`), so garment/trim contrast
  survives; **value is never rewritten**, so silhouette and shading survive.
- **T3 reads darker and richer, not brighter.** Lifting value produced pastels
  that looked toy-like against a muted roster.
- **Two exceptions prove the rule.** The Spirit keeps a high value ceiling —
  darkening a spirit toward mid-grey fights its "barely material" identity. The
  Apprentice's *ember* frame needs its own high value and saturation, because
  **orange at 80% value is brown by definition** and fire must be bright to read
  as fire; its hues are also spread wider, since reds-through-oranges are where
  hue discrimination is weakest.
- **Apprentice hues stay inside the frame's element** (venom / ember / rime),
  because the colour pass already made its frames elemental.
- **Conduit is excluded entirely** — placeholder class pending a major rework.

`resolvePlayerFrame` now resolves T3 by **full spec node id**
(`{archetype}-{variant}-t3-{a|b|c}`) before the generic
`{archetype}-{variant}-t3` key, so two specs on the same class-frame (Berserker
vs Hemomancer, both Striker heavy) can differ. A class with no T3 art falls
through to its root body.

**Berserker Rampage aura** (`rampage-1/2/3`, staged by stack count like the
Channeler's upkeep stages) establishes the channel split that the whole system
now follows:

| channel | expresses |
|---|---|
| body silhouette | class + frame |
| body colour | class hue, per-spec at T3 |
| head ring | range |
| aura | live combat state only |

## Tier 3 bespoke bodies — SHIPPED 2026-08-01 (all 45)

The 45 recolours above were **fully replaced by generated bodies**. Every T3
spec now has bespoke art, produced in five batches for ~$3.10 and packed.
Conduit/Summoner remains excluded (placeholder class pending rework).

**The grammar evolved rather than breaking:** T1/T2 silhouette encodes
**class + frame** (24 bodies); T3 silhouette encodes **spec**. Class family
resemblance survives for free because every T3 body is an img2img chain from
its own class-frame parent, and the palette stays in the class band.

**The recipe, validated across 45 bodies:**

```jsonc
"params": {
  "outline": "selective outline", "shading": "flat shading",
  "detail": "low detail", "view": "low top-down", "direction": "south-east",
  "initImage": "sprites/classes/<frame>_<class>.png",  // T2 frame, ORIGINAL colours
  "initImageStrength": 75
}
```

- **Chain from the T2 frame, never the recolour.** Palette is authored in the
  prompt; `t3.mjs` does not touch these.
- **75 is the floor.** 65 let the frame's build drift; **below ~75 the garment
  loses its anchor entirely** — the Duelist at 68 returned bare heads and two
  effectively nude figures. 85 over-anchors and kills the concept (Berserker).
- **Design rule: spec archetype first.** Each spec is its own character concept;
  class DNA rides on the chain and the palette.
- **Batch by class**, reviewing each trio against its own siblings — collisions
  happen inside a trio, and colour reads faster than construction at 64px.

### Prompt rules this pass established

- **Bare skin is the #1 failure and negatives never fix it.** Any wording implying
  reduced/improvised/minimal clothing ("brawler", "minimal kit", "torn rags")
  returns bare arms and chests regardless of ban-list length. The fix is a
  **positive coverage clause** in every prompt — "garment covering the entire body
  with no exposed skin anywhere". Once added, the Squire batch came back clean
  across all 30 candidates.
- **`bare hands` must stay in every negative list**, and gloves stated positively.
  Dropping it left gloves unenforced for a whole wave.
- **Archetype nouns summon their props.** Three Slinger specs are named after guns;
  none of those words appear in their prompts, and no firearms were generated.
- **Removing what the parent body has is the most expensive ask in the pipeline.**
  Berserker (bare skin, 4 rounds) and Duelist (no hood, 3 rounds) were the only
  two specs asked to subtract, and burned the most rounds by far. Banning a
  material doesn't work either — Juggernaut banned `plate` and got plate knights.
  Give a **positive substitute** or redesign the spec to keep the feature.
- **An abstract mechanic works when it becomes one bold object, and fails when it
  becomes surface texture.** Dynamo's glowing core disc read instantly; Reverb's
  ring embossing, Avenger's cracks and Warmonger's pennants washed out.
- **A two-colour split needs two hues, not two values.** Dualslinger's
  violet/amber split landed cleanly; Equinox's white/black split mostly didn't.

**Head anchors:** `art/workbench/accents/anchors.mjs` now bakes **70** anchors
(25 base + 45 T3). Its file list was hardcoded to the original 25, so every T3
body silently fell back to the roster average — re-run it after adding bodies,
and extend the list when a new family appears.

## Next up

Stages 0–3, the colour pass, and all 45 T3 bodies are done.

1. **Prune the retired range bodies** (`in-fighter`, `lancer`, `phantom-blade`,
   `vanguard`, …) and the loose `summoner-variant-*` frames kept as spares — all
   unreferenced, all still packed into the atlas.
2. **T5/T6 will be additive accents**, in the same vein as the T2 range rings —
   overlay props drawn in code, never new bodies. See "Accent slots" below.
3. ~~Conduit/Summoner bodies~~ — **DONE 2026-08-08**, all nine specializations.
   They needed `initImageStrength` **65** rather than 75, because the Conduit parents
   are a plain robe column with no internal parts to reinterpret; see
   `docs/conduit-current-state.md` §10b. All six classes now have full T3 coverage:
   **54 bespoke T3 bodies**.

## Deferred

- T3+ refinement bodies — `resolvePlayerFrame` still honors
  `{archetype}-{variant}-t3` keys when frames appear.
- Paradigm-shift full-body specs (bible §25) — same chain mechanism, img2img
  from the class-frame body.

## Accent slots — design space for T5/T6 (not built)

T5/T6 are planned as **additive accents** in the same vein as the T2 range rings:
overlay props drawn in code, layered on the body at runtime, never new bodies.
This section records the design space and the constraints, so the next pass
doesn't rediscover them.

### What real estate is already spoken for

| Channel | Owner |
|---|---|
| body silhouette | class + frame (T1/T2), spec (T3) |
| body colour | class hue; per-spec at T3 |
| crown of the head | **range** (T2 rings) |
| body glow / tint | **live combat state only** (`fx/aura.ts`) — keep it free |
| ground under the feet | rejected: ground decals read as clutter |

Free: **shoulders**, **behind the body**, and **the orbit around the body**.

### The proposal: the accent stack grows OUTWARD as tier rises

crown (T2) → shoulder (T5) → trailing/orbit (T6). Spatially non-overlapping,
each independently readable, and a maxed character reads as decorated in three
distinct places without any of them fighting.

1. **Shoulder mantle / pauldron (T5).** The second-most readable location after
   the head, and inherently **asymmetric**, which may also help the persistent
   front-on facing drift. Same technique as the head rings: bake a shoulder
   anchor by alpha-scanning, draw props in code.
   *Risk:* the shoulder line varies more across bodies than the crown does
   (crown spread is 4px across 70 bodies; shoulders will be worse). **Measure
   the spread before committing** — if it is large, the prop needs to sit on a
   measured shoulder box rather than a single point.
2. **Trailing back element (T6)** — banner, pennon, tail, or wing, rendered
   *behind* the body at `depth - 0.5`. Its unique property: it **changes the
   outline**, and outline is the only thing that reliably reads at ~20px —
   every accent so far has been interior detail. Rendering behind also means it
   never occludes the bodies this overhaul exists to show off.
3. **Orbiting motes** — 1–3 discrete satellites on a slow orbit. Countable, so
   it encodes a tier count with no new art per tier.
   *Risk:* competes with combat VFX. Only viable if the motion is **slow and
   steady** where combat VFX is fast and transient.

### Constraints any accent pass must respect

- **Draw props in code** (`art/workbench/accents/build.mjs`). Generation has a
  hard floor at part-scale assets — asking for a 32px ornament returns a whole
  character. `art/manifests/accents.json` is retired and records this.
- **Bake anchors, don't guess**, and remember to extend the file list in
  `anchors.mjs` — it was hardcoded to 25 bodies and silently gave all 45 T3
  bodies the fallback anchor.
- **~3 accent slots is the budget** at 64px before the sprite reads as noise.
  The proposal above lands at exactly 3.
- **Props are authored near-white** so a per-slot tint multiplies to the hue.

### The one real code change required

`resolvePlayerAccent` currently returns a **single** accent — it walks
`unlockedSkills` backwards and the most recent match wins. That was correct when
range was the only accent, but it means a T5 accent would **replace** the range
ring rather than stack with it. Supporting simultaneous slots needs the resolver
to return a **slot-keyed set** (`{ head, shoulder, trail }`) and
`fx/identityAccent.ts` to manage one sprite per slot. Everything else — atlas
frames, tinting, mirroring with body flip, depth ordering, destroy-on-death — is
already in place and generalises.

### A design caution worth more than the mechanics

The range rings work because they encode a **choice** — they tell you something
about how that player plays. An accent that only encodes *tier* says merely
"this player is far along", which is weaker. If T5/T6 involve a real branch,
encode the branch. If they are pure progression, consider spending the slot on
**spec identity instead**: all 45 T3 specs currently have zero accent
representation, so a shoulder prop keyed to the spec family would add
information rather than decoration.
