# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-15 (afternoon): S4, S7, Planted and the Striker FX delete done; F7-PANEL, CS6, CQ6, CQ7 merged; CS5-UI and CQ5-UI are the open delegate tasks.
**Baseline:** `rework/class-first` after the CQ7 merge: full suite **342/342** (biomeEcology flakes under load), typecheck clean.
Codex hit rate limits on 2026-10-14, so D5, K1–K3, D1, T0 and D2 ran as Claude subagents of the conductor (same briefs, same worktrees).

## Designer decisions (2026-10-15)

Recorded in the bible (§4 Armor/charm row, §5) where they are design.

| Call | Decision | Work it creates |
|---|---|---|
| S4: what "Recovery doubles/triples" multiplies | **A small always-on in-combat Recovery share for every class**; such lines multiply it; Old Guard-style lines add to it | S4 (conductor): the baseline (placeholder share) + Rhythm, Cairnstone, Counterbalance, Stone Patience |
| S7: Mountain and Tundra charm bases without the barrier | **A timed ward**: Mountain after a hit over a quarter of your HP, Tundra when the Chill freezes you; it absorbs part of the next blow for a few seconds | S7 (conductor or Grok) |
| Moved gear lines (12 per class) | **Second bases**: the receiving biome gets a second armor and charm recipe carrying the moved lines, for every class | G-GEAR-C (brief by the conductor; data for Grok) |
| Art | **Redraw** the three Striker crests and the five flat T1 icons | ICONS-3 (Codex), ready |
| Planted | **No knockback at all** while braced: lift the forced-movement cap for it | conductor, small |
| The Striker's old special-move FX | **Delete** (`client/src/fx/bespoke/striker.ts` path entries, the Swiftblade branch; lower `attackProgression.test`'s count) | conductor or a delegate, small |

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| CS5-UI | [The Order editor and beat strip](CS5-striker-ui.md) | Grok | `../mmo-rw-cs5-ui` · `rw/cs5-ui` | ready (worktree made 2026-10-15) |
| CQ5-UI | [The Response rules editor, Resolve pips, callouts](CQ-squire-delegates.md) | Grok | `../mmo-rw-cq5-ui` · `rw/cq5-ui` | ready (worktree made 2026-10-15) |
| G-GEAR-C | [Every class's moved lines on second bases](G-GEAR-C-moved-lines.md) | Grok | `../mmo-rw-gear-c` · `rw/gear-c` | ready (plumbing done: `movedLines`, `<base>-b`) |
| ICONS-3 | Redraw the Striker crests and flat T1 icons | the designer, via Codex | `../mmo-rw-icons-3` · `rw/icons-3` | **not merged**; the designer handles art themselves. Keep old art, add icons only where needed |

## Paste-ready prompts

Open the agent **in the task's worktree folder** and paste its prompt.

**CS5-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cs5-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cs5-ui. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the
task in docs/briefs/class-first-build/CS5-striker-ui.md. Work only in this folder;
never run pnpm install. When you're done, commit on your branch, write your report
where the brief says, and tell me.
```

**CQ5-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cq5-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cq5-ui. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS5-striker-ui.md, then do the task marked CQ5-UI in
docs/briefs/class-first-build/CQ-squire-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**G-GEAR-C (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-gear-c`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/gear-c. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the
task in docs/briefs/class-first-build/G-GEAR-C-moved-lines.md. Work only in this folder;
never run pnpm install. When you're done, commit on your branch, write your report
where the brief says, and tell me.
```

## Queued (briefs written when their inputs land)

| ID | Task | Agent | Waits for |
|---|---|---|---|
| Next class | The Conduit ([C-conduit](C-conduit.md), plan written 2026-10-15; CD.1 next), then Slinger, Spirit, Apprentice | Conductor | — |

## Known follow-ups (not yet a task)

- **S7 follow-ups:** the ward is `defense.ward-hit-pct` (Mountain, a hit over `CHARM_WARD_BIG_HIT_PCT` of max HP) and `defense.ward-freeze-pct` (Tundra, the rising edge of the Frozen status on you, whoever applied it); size, 5 s window and 10 s gap between raises are placeholders (`GAME_CONFIG.CHARM_WARD_*`). The barrier engine, its Guard hooks and the Mountain armor-branch barrier recipes stay for the Spirit (XC1). `barrier.test` and `charmHooks.test` lend the T4/T1 charms the old barrier lines in-test. The 6 charm entries in `nonWeaponLadders.fixture.ts` were repointed to the ward values.

- **S4 follow-ups:** the always-on share (`RECOVERY_COMBAT_BASE_SHARE` 0.05), the boost window (`RECOVERY_BOOST_MS` 4 s), Rhythm's 20 s build-up and the x2/x3 factors are placeholders. Multipliers apply to the always-on share only (base + Old Guard), not to pulse/kill/skill sources. Conduit's Cairnstone carries the same big-hit keys (threshold a quarter of max HP). The other classes' Recovery lines are wired when their gear lines land.

- **Bench specs throw on import:** `server/bench` specs and studies built on frame and path
  builds (`playerBreadthSpec.ts` and everything importing it). Typecheck passes; running them
  fails. A bench cleanup task, after D1 and D2.
- **Apprentice:** `dotClassProfile.ts` still looks up the removed `dot-*` frames, so all three
  elements share the fire defaults until the Apprentice track replaces it.
- **Bot leftovers from D5:** the stale generated `reports/bot-route-reference.md`, the
  `scripts/experiment` flags the bot now ignores, `server/scripts` diagnostics that import
  deleted bot modules, and three bot docs (`docs/t2-bot-testing-infrastructure.md`,
  `docs/bot-harness-capability-audit.md`, `docs/bot-experiment-runner-current-state.md`).
  `attemptBoss.repeat` is gone: repeated boss kills for trophy ranks need a new signal when
  the class routes return.
- **From D1:** `Recipe.lineageId` survives only on the 12 core recipes (goes with the core
  slot in D2, with `coreAuthoring.test.ts`); the Guard keystones' statuses
  (`ability-unyielding`, `ability-immunity`, `ability-entangled`) are dormant but still read by
  boss AI and status code (goes with the abilities in D3); unused pipeline hooks
  (`applyMechanicProxy`, the reload's "readied without a reload" path, `applyPlayerAoeTo`, the
  contagion copy's `stackFraction`); `'evolve'` / `'reconstruct'` in `gameplayRecorder.ts`'s
  kinds; living docs still describe lineages, shards and node rows (docs pass at M0 exit).
- **Gear:** Clearing starters are tier 1 over the tier-0 club; Jungle weapons copied the rapier's
  `onHitDamage`; where a biome-tier had two generic weapons the first was copied. The moved
  lines (listed in reports G-GEAR-A/B) get second bases (decided, G-GEAR-C).
- **From D3:** nothing calls `fireTechnique` / `fireGuard` until the class runtimes do; nine
  rune conditions only Use Ability accepted now have no action (they seed the moments); the
  Auto Combat / Fight Back gate on ability firing went with the loop (class runtimes decide);
  bench bots fire no abilities; scripts outside typecheck (`server/scripts/*Preflight`, the root
  `boss*.mjs`, `tools/uishot/mobile-audit.mjs`) still name removed things.
- **Striker numbers (designer):** every T1 technique and trophy number is a placeholder in
  `shared/src/classKits/striker/kit.ts` (`params`), the price in `configs/striker.ts`
  (`STRIKER_TECHNIQUE_SWING`). Mastery picks the first techniques in beat order (stand-in: the
  Order doesn't say which one a step masters; T1 never masters). Sunder II's plating loss has no
  number yet.
- **From S1:** monster-ability effects (generic slow/antiheal/sunder) and ambient ramps still
  reach players only; summons show no statuses on the client yet (the Conduit HUD decides).
- **From D2:** `CrestDiamond` (primitive + CSS) is unused; `resolveFinalDamageMultipliers`
  always returns `taken: 1` (kept: the HP forecast reads it); `attunementCost` and RP comments
  in `abilities.ts` go with D3; `tutorial/scripts/runes.ts` (one "2 RP" comment) goes with D3;
  `volcanoHeatCases.json`/`volcanoHeatReferences.json` and the `v1d-earned-t1-state.json`
  fixture still name cores and stances (only manual scripts read them).
- **Squire moments:** Challenge also answers "an enemy attacking an ally" and Unbowed only
  untelegraphed blows; neither has its own moment yet (Squire track).

## Done

| ID | Task | Merged |
|---|---|---|
| F7-PANEL, CS6-ROUTE, CQ6-ROUTE, CQ7-CLEANUP | The class screen shell; the Striker's and Squire's tutorials and bot routes; the Squire's frame loop and T3 paths deleted (Grok) | merges `093c1050`, `84a63cc5`, `a15f697f`, then CQ7; 342/342 |
| S7 | The timed ward on the Mountain (big hit) and Tundra (frozen) charm bases, replacing their barrier; `charmWards.test.ts` | next commit |
| S4 | The always-on in-combat Recovery share for every class; Recovery-multiplier lines (Rhythm, Cairnstone, Counterbalance, Stone Patience); `recoveryBoost.test.ts` | `76ae8143` + test fix |
| Planted, Striker FX | Braced Squire takes no forced movement at all; Striker special-move FX and Swiftblade branch deleted (`attackProgression` count 36) | `bb1a196e` |
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
| D5 | Bot: class-agnostic harness, smoke-t1 route (subagent); server lane benches and setActive removed | `8c18ccbc`, `f8d6e40f` |
| D6 | Tutorial: engine, opening, class-agnostic seal route, per-class seam (Grok); merged with D1's removals | `e9b9af41` |
| I3 | Bench fights real T1 nodes; `bench:summon-cap` (Grok) | `d1ba3b3b` |
| K4–K6 | Slinger, Spirit, Conduit kits through T4 (Grok); 11 undesigned trophy ranks given placeholders | `07e6d86f`, `68711dd9`, `29b72c28`, `78d2fbb4` |
| ICONS-T1 | 60 Tier 1 icons, 52 generated (Codex image generation); full-res sources kept in the main checkout's `art/candidates/openai-icons/` | `d04a6a85` |
| CS7-CLEANUP | The Striker's frame loop and nine T3 paths deleted (subagent): 55 files, −2k lines; the bleed driver moved to `combat/damage/bleedTicks.ts` | `rw/cs7-cleanup` merge |
| CQ.1, CQ.2, CQ.4 | The Squire: Resolve (raw hits, trickle, refunds), the slam and its hold rule, the five T1 responses, the five T1 trophies, the T1 gear lines; `C-squire.md` | `8d9ca7b1`, `3fccd177`, `e6cb72ed` |
| CQ.5 (view model) | `composeResponsesView`, `withRule`, `withGroundTelegraphs`, `withHoldSlam`; Resolve on the player view | `bd30623b`, `2f5db102` |
| CS.4 | The Striker's T1 gear: weapon jobs, armor and charm lines (`striker.*` keys, three generic `defense.*` keys) | `216e27c3` |
| S2 | The last T1 moments: enemy-casts, telegraph-at-me, target-closing-fast | `c619c262` |
| ICONS-2A | 52 Striker/Squire/Apprentice T2–T4 pieces, 15 discipline crests (Codex) | `rw/icons-2a` merge |
| CS.1, CS.2 | The Striker's Order at runtime with its T1 techniques (Sweep, Hamstring, Rend, Coil, Focus) and trophies (Wide Arc, Double Slash, Festering Cut, Skyfall, Sunder); class casts on the cast machine; the root's Recovery pulse removed | `8dc3fa6a`, `a311329f` |
| CS.5 (view model) | `composeOrderView`, `withBeat`, `withRelic` | `eb43c183` |
| DOC-1 | 15 docs archived, ~30 living docs corrected (Grok); runic attunement archived after D3 | `rw/doc-1` merge, `6be2ae0f` |
| ICONS-2B | 30 Slinger/Spirit T2–T4 pieces, 36 T2–T4 trophies (Codex) | `rw/icons-2b` merge |
| D3 | The shared abilities' player surface removed (subagent): learning, attunement, the hotbar, Use Ability, the panels; the engine kept behind `fireTechnique` / `fireGuard`. 265 files, −5.3k lines | `rw/d3-abilities` merge |
| G-GEAR-A/B | Every class's weapons (33 each) and lines (52 each) through T4 (Grok ×2); weapon-curve, slot and economy suites taught about class gear | `rw/gear-a`, `rw/gear-b` merges, `6d81a93d`, `181364ee` |
| F7 (view model) | `composeClassScreenView`, `classUnlockNotices` | `e97f7bde` |
| S1 | Monster debuffs land on summons: one rider table (`monsterRiders.ts`) behind a player/summon adapter; summon statuses, DoTs, stuns, slows | `acbe38be` |
| S3 | Taunts lock, players come first (`applyTaunt`, `heldByTaunt`); strongest copy already existed (`applySharedDebuffMaxWins`) | `8f9a95fb` |
| F6 | The moments registry: fight snapshot, states, edge and pipeline events, `conditionsHold`; runeConfig reads the snapshot | `a421fd86` |
| D2 | Runic Points, crafted runes, stances, rites, the core slot removed (subagent): 406 files, −10k lines; old saves drop the keys; 4 bot files edited for typecheck | `f3513f9d` |
| D1 | Item lineage trees, ability node rows, shards removed (subagent): 165 files, −53k lines; bot shims dropped | `9164b024`, `b1a4962a` |
| F5 | Class gear: smart loot (`classes`), class lines on shared bases, relic items and the T4 gate gone | `98eec7e3` |
| F8 | Bot: `classConfig` step, `pieceLearned` / `trophyHeld` conditions; shared `classConfigContextFromState` | `cd81e3bb` |
| F4 + T0 | Passive Tree from the kits; tests swept (subagent); root-only fixes (empowered default, balance lab, tier entry) | `b5ce4436`, `2d43e779` |
| F2 | The class config: `configuresClass`, `class:setConfig`, migration 0010, auto mode | `4d1cc6ea` |
| F3 | Lessons and trophies: derived from biome levels and boss clears inside F1/F2, nothing to grant; the "new" toast moves to F7 | (in F1, F2) |
| K1 | Striker kit (subagent): 26 pieces, 11 trophies, tree | `3073540a` |
| K2 | Squire kit (subagent): 23 pieces, 11 trophies, tree | `3c014363` |
| K3 | Apprentice kit (subagent): 21 pieces, 11 trophies, tree | `a66e443f` |
