# Conduit Player Specialization Sprites — Handoff

Written 2026-08-08 for continuation in the earlier Claude session that already
has the successful player-specialization sprite context.

Branch: **`feat/conduit-flavor-pass`**.

## 1. The corrected scope

The user wants unique **player-character bodies** for all nine Conduit tier-4
specializations, not only unique creatures summoned by those specializations.
This was misunderstood once: the 13 summon-creature sprites were completed and
the pass was incorrectly marked finished before the player bodies existed.

The remaining player bodies are:

| Frame | Specialization | Player frame output | Parent anchor |
|---|---|---|---|
| Splinter | Inquisitor | `sprites/classes/light_summoner_t3a.png` | `light_summoner.png` |
| Splinter | Kilnmaster | `sprites/classes/light_summoner_t3b.png` | `light_summoner.png` |
| Splinter | Iconoclast | `sprites/classes/light_summoner_t3c.png` | `light_summoner.png` |
| Consort | Marshal | `sprites/classes/medium_summoner_t3a.png` | `medium_summoner.png` |
| Consort | Chorister | `sprites/classes/medium_summoner_t3b.png` | `medium_summoner.png` |
| Consort | Ritualist | `sprites/classes/medium_summoner_t3c.png` | `medium_summoner.png` |
| Effigy | Covenanter | `sprites/classes/heavy_summoner_t3a.png` | `heavy_summoner.png` |
| Effigy | Champion | `sprites/classes/heavy_summoner_t3b.png` | `heavy_summoner.png` |
| Effigy | Idolwright | `sprites/classes/heavy_summoner_t3c.png` | `heavy_summoner.png` |

Range still affects the summons only. It must not recolor or swap the player
body.

## 2. What is already complete — do not redo

- The 13 unique summon-creature bodies are accepted, direction-correct,
  outlined, packed, wired, and covered by `server/test/summonerSprites.test.ts`.
- The original root summon `conduit-summon.png` remains the root baseline.
- Marshal and Effigy summon creatures were horizontally mirrored to face east.
- Covenanter correctly selects distinct offense/defense summon bodies by slot.
- The old DEV summon-skin override and teal/porcelain losing frames were retired.
- Accepted summon raws live in `art/workbench/conduit-summon-raw/`.
- `pnpm typecheck`, `pnpm test` (**64/64**), and `pnpm art:pack --check` were
  green before the player-body calibration was added.
- `tools/pixellab/generate.ts` was fixed so pixflux no longer receives the
  unsupported `style_strength`; the README now records that `styleStrength` is
  Bitforge-only.

Preserve the dirty worktree. It contains the accepted summon work and the
integration changes. Do not reset or discard it.

## 3. Failed player-body calibration

Three calibration entries were appended to `art/manifests/players.json`:

- `inquisitor-t3`
- `marshal-t3`
- `idolwright-t3`

Recipe used:

```jsonc
{
  "outline": "selective outline",
  "shading": "flat shading",
  "detail": "low detail",
  "view": "low top-down",
  "direction": "south-east",
  "initImageStrength": 75
}
```

Each entry chained from its accepted Conduit frame and generated 3 candidates.
The batch completed 9/9 with no API errors, cost about **$0.07**, and left a
live balance of **$0.94**.

The user rejected all three sets with the same note:

> too similar to the original

Current manifest state for all three is `regen`. Rejection consumed/deleted the
candidates, so their candidate directories are empty. **Do not rerun these
prompts unchanged.** The failure is conceptual/structural: strength 75 plus
mostly garment-surface changes preserved the parent too aggressively and did
not create specialization-level silhouettes.

The rejected calibration concepts were:

- Inquisitor: asymmetric high tribunal collar.
- Marshal: broad squared shoulder mantle with split tails.
- Idolwright: stacked blank faceplates as one oversized pauldron.

Even where these details appeared, the bodies still read as the original
Splinter/Consort/Effigy sprites.

## 4. Identity invariants

Keep the Conduit recognizable while making each specialization a genuinely new
character concept:

- deep-red full-body robe; no exposed skin;
- large white ceramic mask, visibly turned right/south-east;
- frame ancestry remains legible (Splinter slim, Consort stable, Effigy heavy);
- hanging-mask count remains frame-linked where practical: three / two / one;
- brown gloves and boots; no accidental weapons unless the user explicitly
  approves a specialization prop;
- every directional body faces right/east;
- range hue belongs to summons, never the player body;
- prioritize bold silhouette changes over trim, embossing, or other 64px detail.

The user is explicitly asking for **unique specialization sprites**. Family
resemblance is necessary, but a recolor or lightly modified parent is not a
successful result.

## 5. Recommended continuation in the rescued session

1. Read `CLAUDE.md`, `tools/pixellab/README.md`,
   `design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md`, and
   `docs/player-sprites-current-state.md` in full.
2. Use the rescued session's successful bespoke T3 reference context to redesign
   the three calibration concepts. The old strength-75 recipe is not sacred for
   Conduit; test a stronger structural departure while protecting the mask and
   palette invariants.
3. Keep the first retry to **Inquisitor / Marshal / Idolwright**, 3 candidates
   each. Always dry-run first and verify the gallery is closed.
4. The user is near their credit limit. Query `--balance` immediately before
   every paid run, use a hard `--budget`, and report if the balance or estimated
   actual cost becomes unsafe. The last known balance is **$0.94**.
5. After the three-frame grammar is approved, author the remaining six entries
   and generate them in one conservative batch or frame-by-frame if the balance
   is tight.
6. The user owns every accept/reject decision. Never accept candidates on their
   behalf.
7. Once all nine land:
   - add the nine `summoner-{frame}-t3-{a|b|c}` mappings to `PLAYER_FRAMES`;
   - extend and rerun `art/workbench/accents/anchors.mjs` so range rings use real
     head anchors for all nine bodies;
   - `pnpm art:pack` → `pnpm bake:hitboxes` → `pnpm art:pack --check`;
   - add resolver/frame-map coverage as appropriate;
   - run `pnpm typecheck` and `pnpm test`;
   - update `docs/conduit-current-state.md` and `docs/system-rework-status.md`,
     then archive this handoff.

## 6. Operational state at handoff

- No PixelLab generator is running.
- The review gallery was closed after recording the rejections.
- `art/manifests/players.json` contains exactly the three rejected calibration
  entries; the other six Conduit T3 player entries do not exist yet.
- `docs/biome-ecology-pass2-plan.md` is an unrelated untracked user file. Leave
  it untouched.
- Temporary logs may exist under `tmp/conduit-player-calibration/`; they are not
  source assets.

Useful seams:

- `art/manifests/players.json` — generation entries and rejection notes
- `art/src/sprites/classes/{light,medium,heavy}_summoner.png` — parent frames
- `shared/src/sprites/frameMaps.ts` — eventual `PLAYER_FRAMES` mappings
- `art/workbench/accents/anchors.mjs` — head-anchor bake
- `docs/player-sprites-current-state.md` — proven bespoke-T3 recipe/history
- `docs/conduit-current-state.md` — live Conduit truth
