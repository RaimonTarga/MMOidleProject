# Visual & Flavor Overhaul Roadmap v1

**Purpose:** Phase-by-phase execution plan for the full visual/flavor overhaul.
Applies the six bibles in this directory using the PixelLab pipeline
(`tools/pixellab/README.md`, commands `pnpm art:*`).

Order of work: **style discovery → biome slices (mobs + areas) → player → UI.**

## Locked Decisions (2026-07-10)

- **Style anchor:** discovered fresh, not inherited. First session generates
  style candidates and promotes a winner to `art/style/creatures.png`; all
  later batches anchor on it.
- **Budget:** PixelLab Apprentice tier subscription. Batches are planned
  against `pnpm art:status --balance`; upgrade only if a mass batch would
  stall on the monthly allowance.
- **Phase 1 shape:** depth-first — one complete biome (mobs, renames, terrain,
  background) proven in-game before scaling to the rest.
- **Animation:** monsters stay static single-frame; engine-driven motion
  (Phaser lunge/recoil) carries combat feel. A frame-animation pass is a
  possible far-future layer, not part of this overhaul.

## Standing Rules (every phase)

1. `--dry-run` before every paid batch; cap paid runs with `--budget`.
2. Review in the gallery (`pnpm art:review`), judge **in-game at gameplay
   scale** before accepting, then `pnpm art:pack`.
3. Keep monster IDs stable; change display names and sprites
   (creature-roster-visual-pass §2).
4. **Reconceptualized mobs get a new frame name** (e.g. `field-hare.png`) plus
   a one-line `spriteKey` update in the monster DB — do not hide hare art
   inside `greenslime.png`. Straight reskins keep their frame name.
5. Renames/flavor land in the same slice as their new sprite, per biome, so a
   renamed mob never ships wearing its old placeholder sprite.
6. Never edit packed atlases by hand; `art/src/` is the source of truth.
7. Each phase ends with a short retro: fold prompt/param learnings back into
   the manifests before the next batch.

---

## Phase 0 — Style Discovery — DONE (2026-07-10)

Goal: one winning creature style anchor, chosen in-game. Budget ~10–15
generations (actual: ~30, mostly the brute humanoid proportion fight — see
below).

1. ~~`pnpm art:status --balance` — confirm the subscription landed.~~
2. ~~Pick two probe subjects with different bodies: **wolf** (organic
   quadruped) and **cave-brute or bog-witch** (humanoid vessel).~~
3. ~~Author 3–4 style directions as prompt/param variants per subject.~~ Ended
   up 4 directions on wolf, 8 rounds on brute (proportion tuning took far
   longer than style direction — see `art/style/README.md` "Phase 0 verdict").
4. **Skipped the in-game gameplay-scale check** by explicit call — gallery
   judgment was trusted instead, since the brute round already anchored
   against the real production `brute.png` throughout. Revisit at gameplay
   scale naturally in Phase 1 when real production sprites replace these.
5. ~~Promote the winner to `art/style/creatures.png`.~~ Done —
   `wolf-painterly`; humanoids additionally reference `brute-v8`. Winning
   params + what-to-avoid written in `art/style/README.md`.
6. ~~Optional same-session tail: one terrain probe.~~ Done —
   `plains-ground-probe` (4 rounds) + `plains-prop-probe` accepted, promoted
   to `art/style/terrain.png`.

Exit criteria met: `creatures.png` and `terrain.png` committed; the style
verdict written down (what won, what to avoid — see `art/style/README.md`).

## Phase 1 — Vertical Slice: Plains + T0 Tutorial

Goal: one biome that fully looks like the new game. Plains is the slice —
most grounded biome, simplest terrain ("terrain should mostly stay out of the
way"), and it carries the flagship slime replacement. T0 rides along because
it is one mob and shares the wisp concept.

**Flavor pass (free, code-only, lands with the sprites):**

- `plains-slime` → display **Field Hare**, new frame `field-hare.png`.
- `tinyslime` → display **Tiny Wisp**, new frame `tiny-wisp.png`.
- ✅ DONE 2026-08-05. Summoner minions no longer borrow wildlife at all: they
  use the Conduit's own conjured body (`conduit-summon`). See
  `docs/conduit-current-state.md` §6.

**Sprite batch (~7 mobs × up to 3 candidate rounds):**

Tiny Wisp, Field Hare, Boar, Prairie Wolf, Stampede Bull, Savanna Hawk,
Plains boss(es). Sprite directions per creature-roster-visual-pass §5.

**Environment batch (environment-visual-rules §6 Plains + §7):**

The single AI-painted `biome_plains.png` was replaced by a **Wang-tileset
autotiled ground** — the single image never tiled/looped. Client renderer:
`client/src/render/wangGround.ts` (+ `overlays.ts` two ground paths, camera
`roundPixels`). Scattered decor props (grass tufts, pebbles, shrubs, flowers)
layer on top. Full detail + the ground-system rules live in the
`project-pixellab-plains-ground` agent memory.

Ground status (2026-07-11, UNCOMMITTED): canonical Plains ground = pale-wheat
"even-blades" **@64px `mode:'pro'`** tileset (pro works on the current
Apprentice sub — the tooling just needed to send the `mode` param; `generate.ts`
now auto-sends it for tiles >32px). A Wang tileset costs ~16 generations (one
per tile), so grounds are the expensive asset — generate one at a time.

Ground open items (next session): tune dirt-patch count/radii
(`WANG_GROUND.plains.dirt`); explore dirt patches forming **paths/roads**
(line-based dirt field, not just discs); refine props; decide whether the green
shrub/tree leaves clash with the wheat grass or read as nice contrast; optional
structural de-repeat = 2-3 grass **variant** tiles to scatter.

**Validation:** play the Plains slice; check silhouette readability, elite
tint compatibility, hitbox bake (`bake:hitboxes` rebakes on boot),
`pnpm art:pack --check` and `pnpm size:check` clean.

Exit criteria: Plains + tutorial fully on new art in-game; retro folded into
manifests.

## Phase 2 — Remaining Starter Biomes (Forest, Mountain, Swamp, Cave)

Repeat the Phase 1 loop per biome, one biome per session-or-two, including
each biome's bosses and its terrain/background set.

Key renames land with their biome (creature-roster-visual-pass §11):

- Forest: `forest-slime` → **Bramble Hare** (name still flexible), Ancient
  vs. Alpha Wolf decision checked against actual tier placement.
- Mountain: `ridge-archer` → **Ridge Ambusher** (+ reskin away from
  medieval-archer look).
- Swamp: `bog-slime` → **Mire Ooze** (the one surviving ooze; sprite goes
  viscous/muddy, not jelly). Bog Witch reskinned masked/faceless.
- Cave: names keep; this biome needs sprites, not concepts.

Exit criteria: all T0/T1 content on new art; the 12-monster starter roster
from creature-roster-visual-pass §12 is complete.

## Phase 3 — T2+ Biomes and Later-Tier Roster

All remaining authored biomes (jungle, desert, volcano, tundra, trench, …),
same per-biome loop: roster audit against the bibles → renames → sprites →
terrain → bosses → in-game check.

Gates to resolve before their art is generated:

- **Graveyard/T4 direction** (biome-and-creature-bible §11, Option A/B/C) —
  decide before any graveyard asset is prompted.
- Later-tier name audit (creature-roster-visual-pass §10) per biome as it
  comes up.

This is the volume phase (~100+ monster entries total). If the monthly
allowance throttles it, either pace one biome per month or temporarily
upgrade the tier for a mass-production month, then drop back.

## Phase 4 — Player Aesthetics

Gated on the composite-sprite decision; `players` manifest stays draft until
then. Scope per player-visual-identity-bible:

1. Decide the layering model (bible §9/§24: body base + big overlays only).
2. Style-discovery mini-session for `art/style/characters.png` (player bodies
   may need a different anchor than creatures).
3. Stage 0 vagrant spirit sprite.
4. **18 class-frame bodies** (6 classes × light/balanced/heavy) — the main
   production anchor. Faceless, genderless, weaponless prompts.
5. Path/tier overlays + range-as-VFX (client work: collapse the 15
   range-variant PLAYER_FRAMES into VFX accents).
6. ✅ Summoner/Conduit identity pass — DONE 2026-08-05. Summons carry the class
   identity (bone skull, range as tint + scale + attack FX); the Conduit body
   itself is deliberately NOT recoloured per spec, so it is the one class with
   no tier-4 player body. `docs/conduit-current-state.md`.
7. Rare full-body spec exceptions only where the bible's §25 rule justifies.

## Phase 5 — UI Overhaul

Last, because item/UI iconography depends on the settled world style.

1. Icon style discovery → `art/style/icons.png`.
2. Item icons per item-aesthetic-bible §5 (literal object + mechanic symbol),
   slot object language per §8.
3. UI icons and elements (buttons, panels, frames — `generate-ui` endpoint).
4. Layout redesign as its own code milestone (ties into the mobile-HUD work:
   panel internals are still desktop-styled).
5. Flavor-text pass on items (mechanic line vs. flavor line split, §4/§15).

---

## Model Plan Per Session (token economy)

Extends the prompt-delegation table in `docs/archive/pixellab-pipeline-plan.md` to
whole sessions. Rule of thumb: Fable only for one-off taste/architecture
decisions, Opus for novel code wiring, Sonnet for proven repetitive loops.

| Session | Model |
|---|---|
| Phase 0 style discovery | Fable — small session, every later batch inherits its verdict |
| Phase 1 Plains slice | Opus — novel wiring (frame names, spriteKey, minion swap); becomes the template |
| Phase 2 per-biome slices | Sonnet — repeat of Phase 1 with different nouns; escalate to Opus only for structural oddities |
| Phase 3 volume batches | Sonnet batch-authors prompts; Fable/Opus reviews a ~5-prompt sample per category before paid runs. Graveyard A/B/C decision → Fable |
| Phase 4 layering/composite decision | Fable; then Opus for implementation, Sonnet for the 18-body prompt batch |
| Phase 5 UI layout redesign | Opus (real client code, mobile-HUD adjacent); Sonnet for icon prompt batches |

Token rules: no model ever Reads generated PNGs to judge them — accept/reject
is the human review gallery. Cheap sessions bootstrap from this doc + the
manifests, not prior conversation context.

## Open Questions (tracked, not blocking Phase 0)

- Graveyard/T4 direction (blocks Phase 3 graveyard art only).
- Bramble Hare final name (blocks Forest slice only).
- Ancient vs. Alpha Wolf (blocks Forest slice only).
- Canopy Sprite keep-or-rename (Forest slice).
- Composite-sprite/layering decision (blocks Phase 4).
- Relic and core flavor passes (blocks late Phase 5 icon work only).
