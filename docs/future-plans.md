# Future Plans / Feature Backlog

Parking lot for features that are decided-in-spirit but not yet scheduled.
Each entry captures the feasibility verdict and the chosen direction so a future
session doesn't re-derive it. When an entry gets scheduled, promote it to a full
`docs/<feature>-plan.md` and mark the entry here as promoted.

Status: current as of 2026-07-05.

---

## 1. Composite (paper-doll) character sprites

**Verdict: very feasible.** Touches zero server code, zero protocol, almost zero
render code. Grounding facts (verified 2026-07-05): player appearance is derived
client-side from networked `combatArchetype` + `unlockedSkills`
(`client/src/sprites.ts` → `resolvePlayerFrame`); characters are static
single-frame images (`scene.add.image`, no anims except Void Overlord sheet).

**Chosen direction: bake-time compositing, NOT runtime layering.**

- New `bake:sprites` script (precedent: `bake:hitboxes`; `sharp` is already a
  server dependency) composes `base body + boots + gloves + pauldrons + helmet +
  palette remap` into flat frames packed into the sprites atlas. Runtime stays
  identical — one image, one frame name; only `resolvePlayerFrame` learns the
  new naming scheme.
- Part library: ~6 class base bodies + one shared part set per tier + per-class
  palette remap tables. 6x3x3 = 54 variants/tier baked from ~a dozen part
  canvases per tier.
- Color schemes are DATA: exact palette remap tables (JSON next to part defs),
  applied at bake time. Never use Phaser tint for this (multiplicative, muddy).
- Composition is PLAYER-ONLY. Monsters (incl. bog slime) stay plain sprites.

**AI-generation workflow for parts** (generators can't produce standalone
aligned part layers directly):

1. Lock a hand-polished base body per class first — foundation of everything.
2. Author a part by editing/inpainting over the base ("same character, now with
   iron pauldrons") in Pixellab.
3. Diff-extract script (sharp, ~30 lines): pixels identical to base are
   deleted; the difference IS the part layer, aligned by construction.
4. Edge-pixel cleanup in Aseprite (Pixellab plugin exists).

**Decision to lock BEFORE authoring the new sprite set:** animation ambition.
Static sprites → parts are single canvases, plan is nearly free. Tibia-style
2-frame walk / facing directions → every part multiplies by frames x facings;
still viable but the part library must be designed for it from day one.

**Sequencing:** build the part pipeline when the full sprite-replacement art
pass begins (all current sprites are slated for replacement; fewer humanoid
monsters). Delegation: bake + diff-extract scripts are self-contained
(Opus-suitable); base-body art direction is not delegable.

---

## 2. Tier-evolving UI (Tibia-style reskin + per-tier skins + ascension animation)

**Verdict: easier of the two; piggybacks on the planned mobile-HUD
panel-internals milestone — do the reskin AS that migration, not after,
or every panel gets restyled twice.**

**Chosen direction:**

- **5 primitives, not 40 panel restyles:** `Panel` (framed container), `Button`,
  `Slot` (inventory cell), `Bar` (HP/XP), `TabStrip`. All theming flows through
  them. Migrate panel internals onto these primitives (same work the mobile
  milestone already requires).
- **Tier theming:** `data-ui-tier={tier}` on the HUD root (tier already known
  client-side); CSS custom properties scoped per tier value. The Tibia look =
  9-slice `border-image` (one border-strip PNG per tier skins every panel and
  button at once) + slot grids + `image-rendering: pixelated` with integer
  scaling + bitmap-style pixel font.
- **Icons:** Pixellab batch-generation of the icon set in one consistent style
  (replaces the current generic look faster than any CSS work).
- **Additional tier skins are art-only:** recolored border strip + token values.
  The palette-remap tooling from feature 1 can generate tier variants of UI
  assets — shared infrastructure.
- **Tier-up transformation animation:** full-screen DOM overlay portal
  triggered by the existing `player:ascended` event; crackle/sweep effect, swap
  `data-ui-tier` mid-sweep so the new skin is revealed by the effect. V1 = glow
  sweep + crossfade (a day); layer polish forever. Zero server involvement.

**Sequencing:** primitives + tier-1 skin during the panel-internals milestone
→ tier skins 2+ and ascension animation as ongoing polish. Delegation: the
primitive MIGRATION is Sonnet-able once one exemplar panel is hand-built;
primitive design + art direction are not.

---

## 3. (reserved)

User had a third idea, not yet recalled. Placeholder so it lands here.
