# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-15 (overnight): D2, D3, G-GEAR-A/B merged; F6, S1, S3 and the F7 view model done by the conductor. Phase 0 is complete but for the F7 panel (Grok) and DOC-1; the Striker track starts next.
**Baseline:** `rework/class-first` at `c0b3fda9` (D3 merged): full suite **332/332**, typecheck clean (verified in `../mmo-rw-verify2`).
Codex hit rate limits on 2026-10-14, so D5, K1–K3, D1, T0 and D2 ran as Claude subagents of the conductor (same briefs, same worktrees).

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| F7-PANEL | [The class screen's shell (client)](F7-class-screen-panel.md) | Grok | `../mmo-rw-f7-panel` · `rw/f7-panel` | ready |
| ICONS-2A | [Striker, Squire, Apprentice T2–T4 pieces + discipline crests](ICONS-2.md) | Codex (image generation) | `../mmo-rw-icons-2a` · `rw/icons-2a` | running |
| ICONS-2B | [Slinger, Spirit T2–T4 pieces + every T2–T4 trophy](ICONS-2.md) | Codex (image generation) | `../mmo-rw-icons-2b` · `rw/icons-2b` | running |
| DOC-1 | [Docs pass for the removed systems](DOC-1-docs-pass.md) | Grok | `../mmo-rw-doc-1` · `rw/doc-1` | running |

They touch disjoint files, so all can run at once. DOC-1 branched before D3: its `CLAUDE.md`
socket list will still name the ability events, which the conductor fixes at merge.

## Paste-ready prompts

Open the agent **in the task's worktree folder** and paste its prompt.

**F7-PANEL (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-f7-panel`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/f7-panel. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the
task in docs/briefs/class-first-build/F7-class-screen-panel.md. Work only in this folder;
never run pnpm install. When you're done, commit on your branch, write your report
where the brief says, and tell me.
```

**ICONS-2A (Codex, image generation)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-icons-2a`:

```text
You're making game icons for the MMO Idle class-first rework, in this folder, on branch
rw/icons-2a. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the part
marked ICONS-2A in docs/briefs/class-first-build/ICONS-2.md with your built-in image
generation, one image per call. The new icons must look like they belong to the set the
game already ships, above all the Tier 1 class icons in
client/public/assets/concept-icons/class-pieces/ and .../trophies/: the same
semi-painterly style, rim lighting, level of detail and near-black backdrop. Follow
ICONS-T1.md's style rules and design_docs/visual_and_aesthetics_design/openai-icon-generation.md,
and attach the reference icons the brief lists to every generation. Check every icon at
its in-game size and regenerate any that don't read. When you're done, commit on your
branch, write your report where the brief says, and tell me.
```

**ICONS-2B (Codex, image generation)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-icons-2b`:

```text
You're making game icons for the MMO Idle class-first rework, in this folder, on branch
rw/icons-2b. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the part
marked ICONS-2B in docs/briefs/class-first-build/ICONS-2.md with your built-in image
generation, one image per call. The new icons must look like they belong to the set the
game already ships, above all the Tier 1 class icons in
client/public/assets/concept-icons/class-pieces/ and .../trophies/: the same
semi-painterly style, rim lighting, level of detail and near-black backdrop. Follow
ICONS-T1.md's style rules and design_docs/visual_and_aesthetics_design/openai-icon-generation.md,
and attach the reference icons the brief lists to every generation. Check every icon at
its in-game size and regenerate any that don't read. When you're done, commit on your
branch, write your report where the brief says, and tell me.
```

**DOC-1 (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-doc-1`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/doc-1. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the
task in docs/briefs/class-first-build/DOC-1-docs-pass.md. Work only in this folder;
never run pnpm install. When you're done, commit on your branch, write your report
where the brief says, and tell me.
```

## Queued (briefs written when their inputs land)

| ID | Task | Agent | Waits for |
|---|---|---|---|
| CS.1–CS.4 | [The Striker's T1 track](C-striker.md): the Order runtime, T1 pieces, gear lines | Conductor | — |
| S2 | The rest of the T1 moments: enemy-casts, telegraph-at-me, target-closing-fast | Conductor | — |
| S4 | Recovery and flow bound to a state (the charm-line mechanism) | Conductor | F6 (done) |
| S7 | XC1: the recharging barrier leaves the shared charms | Grok | the designer: what the Mountain and Tundra charm bases carry instead |

## Known follow-ups (not yet a task)

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
- **Icons to review (designer):** five of the eight REUSED old icons are flatter than the new
  set: `squire-shield-bash` (a yellow bolt), `striker-hamstring` (a flat green arc),
  `apprentice-detonate`, `apprentice-spread`, `squire-slam`. Regenerating them in the new style
  is a small Codex task if wanted.
- **Gear (designer):** 12 moved armor/charm lines per class aren't on any base (a base holds one
  line per class): second bases, or drop them? Lists in reports G-GEAR-A/B. Also: Clearing
  starters are tier 1 over the tier-0 club; Jungle weapons copied the rapier's `onHitDamage`;
  where a biome-tier had two generic weapons the first was copied.
- **From D3:** nothing calls `fireTechnique` / `fireGuard` until the class runtimes do; nine
  rune conditions only Use Ability accepted now have no action (they seed the moments); the
  Auto Combat / Fight Back gate on ability firing went with the loop (class runtimes decide);
  bench bots fire no abilities; scripts outside typecheck (`server/scripts/*Preflight`, the root
  `boss*.mjs`, `tools/uishot/mobile-audit.mjs`) still name removed things.
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
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
| D5 | Bot: class-agnostic harness, smoke-t1 route (subagent); server lane benches and setActive removed | `8c18ccbc`, `f8d6e40f` |
| D6 | Tutorial: engine, opening, class-agnostic seal route, per-class seam (Grok); merged with D1's removals | `e9b9af41` |
| I3 | Bench fights real T1 nodes; `bench:summon-cap` (Grok) | `d1ba3b3b` |
| K4–K6 | Slinger, Spirit, Conduit kits through T4 (Grok); 11 undesigned trophy ranks given placeholders | `07e6d86f`, `68711dd9`, `29b72c28`, `78d2fbb4` |
| ICONS-T1 | 60 Tier 1 icons, 52 generated (Codex image generation); full-res sources kept in the main checkout's `art/candidates/openai-icons/` | `d04a6a85` |
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
