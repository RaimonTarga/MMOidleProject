# Sprite Batch Methodology

**Purpose:** The proven per-biome workflow from the 2026-07 monster art
overhaul (11 biomes, ~140 sprites, ~$3.60 API spend, completed in one
campaign). Follow this loop for any future sprite batch — new biomes, mob
additions, the player-art phase, rework passes.

Companion docs: `tools/pixellab/README.md` (tooling mechanics),
`biome-palette-bible.md` (palettes), `art/style/README.md` (style anchor +
standing prompt rules). This doc is the *process*; those are the *inputs*.

---

## 1. The Loop (per biome / batch)

Run these stages in order. Do not skip the brainstorm or reorder the
review/generation separation.

1. **Gather** — read the monster data file (roles, mechanics, tiers), the
   bosses, `frameMaps.ts`, the manifest entries, and the palette bible
   section. Build the role-grid table (rows = archetype slots per tier).
2. **Brainstorm with the user** — present the grid with species drift
   exposed; ask 3–4 pointed questions (AskUserQuestion-style: concrete
   options, one recommended, always overridable). Ratify the palette
   explicitly every time, even when the bible already proposes one.
3. **Code flavor pass** — display renames + concept comments + frameMaps
   repoints. IDs never change; debuff IDs never change; buff *labels* may.
   Grep for the old display names everywhere (worldLogActors, fx comments,
   quests) and update. Typecheck + tests before any generation.
4. **Manifest authoring** — prompts + negatives + params per entry
   (template in §3). Supersede legacy entries with a note; add new id-named
   entries. Dry-run to confirm the queue and cost.
5. **Paid run** — user go-ahead on cost, then `art:generate
   --category=monsters --budget=N` **in the background** (foreground times
   out at 10 min). One run at a time.
6. **Gallery review** — ONLY after the run completes (see §5 concurrency
   rule). The user picks; the agent never accepts/rejects. Notes on
   rejects drive the next round.
7. **Regen rounds** — targeted: rewrite only the rejected entries, folding
   the user's notes into prompt + negative changes. Small rounds converge
   fast (most biomes needed 0–2; the hardest single sprite took 4).
8. **Close** — cross-check manifest statuses against `art/src` (see §5
   half-write bug), then `art:pack` → `bake:hitboxes` → `art:pack --check`
   → typecheck + tests. Update the campaign memory/notes.

Latterly biomes passed review with **zero regens** — the accumulated
template genuinely converges.

## 2. Design Principles (what made it coherent)

- **Species families with tier ladders.** Every archetype slot belongs to a
  family that escalates across tiers (Wolf → Dire Wolf; Glacier Bear →
  Dire-Bear → Patriarch boss). A biome is 3–4 families, not N one-offs.
  Boss names often already imply the family — read them before inventing.
- **Escalation levers, stated explicitly per ladder:** frame-fill % (e.g.
  70 → 85 → wall-to-wall), armor/plate density, accent spread (gilding,
  obsidian, ice), horns/crests/scars. Pick levers with the user; write
  them into each tier's prompt.
- **Role-names survive species changes.** "Mire Stalker", "Bog Lurker",
  "Cliff Hopper", "Rime Caster" can hold any creature that fits the role —
  prefer keeping them over churning names. Rename only when the name
  actively fights the new art ("Blowdarter" on a chameleon).
- **One accent per biome, and it must MEAN something.** The best accents
  visualize a mechanic: cyan ice = enemyShield, sun-disc glow = the mark
  painter, ember seams = ramp, biolume = the trench's readability itself.
  State the contrast axis (value / temperature / accent-carried) in the
  prompts' color clauses.
- **Frame naming:** a frame filename must not lie about its contents. New
  concept → new id-named frame + supersede note on the legacy entry
  ("Superseded by X — prune after it ships"); straight reskins overwrite in
  place. Prune superseded files+entries in a sweep once everything ships.
- **Humanoids are vessels** (faceless, no flesh tones) and each biome gets
  at most one humanoid line — most biomes ended all-beast.

## 3. Prompt Template

Locked params (every creature): `outline: lineless`, `shading: highly
detailed shading`, `detail: highly detailed`, `view: low top-down`,
`direction: east`. Candidates: 3. Endpoint: pixflux only.

Prompt structure, in order: **subject → build/anatomy → distinguishing
features → stance → TAIL boilerplate → body-color clause last.**

TAIL: `three-quarter view facing right, full body, isolated on an empty
background, painterly pixel art, soft volumetric shading, minimal outline,`

Negatives are accumulated ban-blocks, concatenated:
- **STD** (always): front view, facing camera, cartoon, chibi,
  anthropomorphic, human, blurry, 3d render, photograph, hard black
  outline, text, watermark. (Drop `anthropomorphic`/face bans only for
  naturally bipedal beasts like yetis.)
- **GROUND (hardened)** (always): ground, floor, terrain, dirt, rock
  underneath, stone platform, pedestal, base, perch, cast shadow, drop
  shadow, shadow under the creature, standing on anything, scenery,
  background elements, environment — plus biome-specific ground nouns
  (snowbank, dune, lava pool, tombstone…). The short version leaked;
  this long version + the TAIL's "isolated on an empty background" works.
- **TOON** (always): cartoony, cute, rounded soft shapes, toy-like, plush,
  mascot, smooth bubbly forms.
- **Biome palette bans**: whatever the bible's "avoid" line says, as words.
- **Shape-specific bans** as needed: UPRIGHT block for quadrupeds
  (standing upright, bipedal, on hind legs, rearing up), anti-creep block
  (eye cluster, many thin legs, fine segmentation…), anti-shrimp for
  scorpions, wolf pose bans (walking, mid-stride, raised paw), etc.

### Hard-won prompt lessons

- **Action poses fail at 64px.** Four rounds of archer poses proved it:
  whirling/drawing anatomy breaks. Sell the *identity* pose instead
  (crouched ambush-ready, low prowl, braced charge). Planted > dynamic.
- **Quadruped bosses drift bipedal + grow ground plates** unless "on all
  four legs / prowling low" leads the prompt AND the UPRIGHT + GROUND
  bans are present from round one.
- **Never name colors that shouldn't appear on the body** — palette words
  bleed into fur (Phase 0's "moss green" wolf).
- Words that backfired: "stylized fantasy game creature" → cartoony;
  "standing stones / monolith" → square slabs + a drawn henge *site*;
  "crown like antlers" on a cat → literal horns; "chunky compact" → fat;
  glowing eyes/core on constructs → robot. Metaphors render literally —
  describe the shape, not the simile.
- Flyers and floaters: "airborne, wings spread, nothing beneath it" +
  perch/folded-wings bans (moving sprites must not stand on rocks).

## 4. Techniques Beyond Plain Prompting

- **img2img (`params.initImage` + `initImageStrength: 250`)** — use when
  the *shape* is right and the surface must change:
  - preserving a beloved existing sprite (the Gemini frog);
  - in-family anchoring from an **accepted** sprite of the same species
    (T2 boss anchored on the accepted T3 fixed a humanoid drift);
  - self-anchoring to keep a picked silhouette.
  **Never anchor across biomes** — the cave brute-v8 anchor made mountain
  vessels read as recolored cave brutes at 250. brute-v8 is cave-only.
- **colorImage palette pin (`params.colorImage`)** — forces an accepted
  sprite's palette WITHOUT silhouette bleed. Use for family/biome color
  coherence when img2img would drag the shape (vessels pinned to the
  accepted Boulder Thrower; golems to the accepted mammoth).
- **Retro candidate swaps** — accepting archives *all three* candidates in
  `art/candidates/_finished/`; you can later copy a different candidate
  over the `art/src` file. Rejecting **deletes** candidates permanently —
  archive manually first if the user wants keepsakes.

## 5. Operational Rules (violate these and pay)

1. **NEVER run `art:generate` while the review gallery is open.** The
   generator saves the manifest it loaded at start, clobbering fresh
   gallery accepts back to pending; the next run then re-rolls
   already-accepted art. Sequence strictly: generate → complete → review.
2. **Always background the paid runs** (they exceed the 10-min foreground
   timeout). Interrupted runs resume safely via the request-hash cache;
   a partial candidates folder that ENOENTs the resume is fixed by
   `rm -rf art/candidates/monsters/<id>`.
3. **Cross-check manifest statuses against `art/src` after every review.**
   Accepts can half-apply (file lands, status write lost) — restore the
   status with a do-not-regenerate note rather than re-rolling.
4. `--category=monsters` on every run (stray pending entries from other
   categories ride the queue otherwise). Flags use `=` syntax. Cap with
   `--budget`.
5. Costs for planning: ~$0.007/call, 3 candidates/entry → a full biome
   (9–16 entries) runs $0.20–$0.40; regen rounds are cents.

## 6. Review Discipline

- The user reviews at their own pace and owns accept/reject; the agent
  prepares per-biome **checklists** of what to scrutinize: accent
  visibility (incl. vs the yellow elite outline), value vs the actual
  measured ground colors (sample the real tiles, don't trust the doc),
  family resemblance within lines, ladder rank readable at a glance,
  ground-plate leaks, and each biome's special rule (no white in tundra,
  glow-discipline in volcano, dirty-not-clean bone in wasteland…).
- Reject notes should say what's wrong AND (optionally) which candidate
  was closest — both feed the rewrite directly.
- Gallery note fields can truncate; restate long feedback in chat.

## 7. Closing a Batch

`art:pack` → `bake:hitboxes` → `art:pack --check` → `pnpm typecheck` →
`pnpm test`. Then update the campaign memory. Commit when the user says so
(one landing per campaign worked well). After everything ships, prune the
superseded entries + files in one sweep and delete emptied legacy folders.
