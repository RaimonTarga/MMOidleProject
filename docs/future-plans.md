# Future Plans / Feature Backlog

Parking lot for features that are decided-in-spirit but not yet scheduled.
Each entry captures the feasibility verdict and the chosen direction so a future
session doesn't re-derive it. When an entry gets scheduled, promote it to a full
`docs/<feature>-plan.md` and mark the entry here as promoted.

Status: current as of 2026-08-08.

---

## 1. Composite (paper-doll) character sprites

**PROMOTED (2026-07-10):** absorbed into `docs/pixellab-pipeline-plan.md`
(full-art-overhaul pipeline; this entry's bake-time design is carried over
unchanged as the "Player composite" category and `art:bake-players` step).

**SUPERSEDED (2026-07-12):** the bake-time composite mechanism was dropped —
players use flat img2img evolution chains + runtime identity accents instead.
Living truth: `docs/player-sprites-current-state.md`.

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

**PROMOTED (2026-07-20):** implementation sequencing, architecture guardrails,
review gates, and model-budget recommendations now live in
`docs/ui-redesign-plan.md`. This entry remains as the original feasibility and
direction record.

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
  (replaces the current generic look faster than any CSS work). *Icon/UI-asset
  generation is now covered by `docs/pixellab-pipeline-plan.md`; this entry
  keeps the primitives/theming work.*
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

## 3. Relics

**IMPLEMENTED (2026-08-04):** the settled philosophy and evolution direction
remain in `docs/relics-design.md`; shipped behavior and the eight-item base cast
live in `docs/relics-current-state.md`. The completed build plan is archived at
`docs/archive/relics-implementation-plan.md`.

---

## 4. Goal-driven agent playtesting harness

**DEFERRED (2026-08-08):** useful but non-essential, and operating LLM agents
through model APIs would add ongoing cost. Do not implement or schedule this
until that cost is explicitly accepted or a satisfactory no-cost/local-model
route is available. This supplements human playtesting; it never replaces it.

**Verdict: technically very feasible.** The server already exposes typed player
intents for navigation, auto-combat/traverse, dungeon altar activation,
equipment, crafting, skills, and death recovery. Authoritative deltas already
contain progression and inventory state, while `DungeonGauntletView` exposes
altar, guardian, phase, hazard, boss, and cooldown state. The existing bench
harness remains the preferred no-API-cost tool for numerical balance work.

**Chosen architecture if revisited:**

```text
infrequent LLM strategist
  -> durable run plan
  -> deterministic TypeScript executor
  -> headless typed Socket.IO client
  -> real authoritative server

server deltas/events
  -> local state reducer
  -> compact semantic observations / decision triggers
  -> strategist only when judgment is needed
```

- The model makes sparse strategic choices: zone order, farm/advance decisions,
  equipment/build choices, dungeon policy, and replanning after failures.
- A deterministic coordinator owns connections, waiting, navigation, auto mode,
  stop conditions, reconnection, death acknowledgement, dungeon movement, and
  logging. Ten minutes of uninterrupted farming must require zero model calls.
- The core is provider-neutral. A direct model SDK/API is the intended automated
  runtime; Codex or Claude Code are for building, debugging, trace review, and
  occasional manual exploration. An optional MCP adapter may expose the same
  tools, but MCP is not the core control layer.
- Agents receive a versioned player-visible briefing and semantic observations,
  not repository access, hidden formulas, raw tick streams, or privileged state
  mutation. All gameplay actions go through ordinary player intents.
- The minimal agent surface is `get_briefing`, `observe`, `submit_plan`, a narrow
  choice/action tool, and `get_run_report`.
- Equipment decisions receive compact player-visible comparisons. Keep a
  deterministic `equip_best` policy as a baseline rather than silently giving
  every reasoning agent an oracle.
- Dungeon execution composes normal navigation, movement, auto-combat, and altar
  intents. It may react mechanically to visible telegraphs, but must not expose
  a privileged `winDungeon` action.

**Concurrency and experiment modes:** one unique account, socket, reducer, plan,
and decision history per logical agent (the server permits only one live socket
per account). Support both isolated cohorts for fair strategy comparisons and a
shared-world mode for parties, competition, boss interactions, and load tests.

**Testing layers:** keep the existing accelerated bench for numbers; use semantic
socket agents for progression/economy/behavior; retain a small browser/Playwright
track for UI, visual telegraphs, and discoverability. Agent results are not a
proxy for fun, emotion, representative human behavior, or interface usability.

**Implementation order if unblocked:**

1. Build one no-LLM scripted headless client with JSONL tracing.
2. Add a compact reducer and durable condition-based plan executor.
3. Add sparse model decisions behind a provider-neutral adapter.
4. Add equipment summaries and the generic dungeon state machine.
5. Add concurrent run manifests, unique accounts, party coordination, and
   isolated/shared experiment modes.
6. Compare scripted, random, cautious, exploratory, and optimization policies
   against human playtest evidence.

Before trusting accelerated dungeon journeys, replace or inject the remaining
wall-clock `Date.now()` reads in dungeon runtime code so fast-forwarded ticks and
dungeon timers use one clock authority.
