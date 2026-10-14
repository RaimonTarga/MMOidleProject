# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-14: F1, F2, F4 (+T0), F5, F8, K1–K3, D5, D1 merged; D2 ready for Grok.
**Baseline:** `rework/class-first` at `1a89670a` (D1, F5, F8 merged): full suite **339/339**, typecheck clean (verified in `../mmo-rw-verify`). Codex hit rate limits, so D5 and K1–K3 run as
Claude subagents of the conductor (same briefs, same worktrees); ICONS-T1 stays with Codex.

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| D2 | [Remove stances, rites, Runic Points, the core slot](D2-stances-rites-runic-points-cores.md) | Grok | `../mmo-rw-d2-stances-rites` · `rw/d2-stances-rites` | ready to start |
| ICONS-T1 | [Icons for every T1 piece and trophy](ICONS-T1.md) | Codex (image generation) | `../mmo-rw-icons-t1` · `rw/icons-t1` | running |
| D6 | [The tutorial keeps its engine and the seal route](D6-tutorial-engine.md) | Grok | `../mmo-rw-d6-tutorial-core` · `rw/d6-tutorial-core` | running |
| I3 | [The server bench fights again](I3-bench-repair.md) | Grok | `../mmo-rw-i3-bench` · `rw/i3-bench` | running |
| K4 | [Slinger kit data](K-kit-data.md) | Grok | `../mmo-rw-k4-slinger` · `rw/k4-slinger` | running |
| K5 | [Spirit kit data](K-kit-data.md) | Grok | `../mmo-rw-k5-spirit` · `rw/k5-spirit` | running |
| K6 | [Conduit kit data](K-kit-data.md) | Grok | `../mmo-rw-k6-conduit` · `rw/k6-conduit` | running |

Every open task touches its own folder, so any number can run at once, one agent session per
task. If you'd rather run them a few at a time, a good order is D5 and D6 first (they unblock
D1 and D2), then the K tasks, then I3; ICONS-T1 any time.

## Paste-ready prompts

Open the agent **in the task's worktree folder** and paste its prompt.

**D2 (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-d2-stances-rites`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/d2-stances-rites. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the
task in docs/briefs/class-first-build/D2-stances-rites-runic-points-cores.md. Work only in
this folder; never run pnpm install. When you're done, commit on your branch, write your
report where the brief says, and tell me.
```

**D5 (Codex, done)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-d5-bot-core`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch rw/d5-bot-core.
First read docs/briefs/class-first-build/AGENT-RULES.md, then do the task in
docs/briefs/class-first-build/D5-bot-harness-core.md. Work only in this folder; never run
pnpm install. When you're done, commit on your branch, write your report where the brief
says, and tell me.
```

**ICONS-T1 (Codex, image generation)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-icons-t1`:

```text
You're making game icons for the MMO Idle class-first rework, in this folder, on branch
rw/icons-t1. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the task in
docs/briefs/class-first-build/ICONS-T1.md with your built-in image generation, one image per
call. The new icons must look like they belong to the set the game already ships: the same
semi-painterly style, rim lighting, level of detail and near-black backdrop as the existing
icons in client/public/assets/concept-icons/ (abilities, stances, rites, statuses). Follow
design_docs/visual_and_aesthetics_design/openai-icon-generation.md, and attach the four
reference icons the brief lists to every generation. Check every icon at its in-game size
(44 px) and regenerate any that don't read. When you're done, commit on your branch, write
your report where the brief says, and tell me.
```

**D6 (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-d6-tutorial-core`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/d6-tutorial-core. First read docs/briefs/class-first-build/AGENT-RULES.md, then do the task
in docs/briefs/class-first-build/D6-tutorial-engine.md. Work only in this folder; never run
pnpm install. When you're done, commit on your branch, write your report where the brief
says, and tell me.
```

**I3 (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-i3-bench`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch rw/i3-bench.
First read docs/briefs/class-first-build/AGENT-RULES.md, then do the task in
docs/briefs/class-first-build/I3-bench-repair.md. Work only in this folder; never run pnpm
install. When you're done, commit on your branch, write your report where the brief says, and
tell me.
```

**K1–K6** (Codex: K1 Striker, K2 Squire, K3 Apprentice · Grok: K4 Slinger, K5 Spirit,
K6 Conduit), folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-k<n>-<class>` (for
example `mmo-rw-k4-slinger`). Replace `<n>` and `<class>` in the prompt:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch rw/k<n>-<class>.
First read docs/briefs/class-first-build/AGENT-RULES.md, then do section K<n> of
docs/briefs/class-first-build/K-kit-data.md (the shared parts of that brief apply too). Work
only in this folder; never run pnpm install. When you're done, commit on your branch, write
your report where the brief says, and tell me.
```

## Queued (briefs written when their inputs land)

| ID | Task | Agent | Waits for |
|---|---|---|---|
| F5–F8, D3, T0 | The rest of Phase 0 | Conductor, then delegates | see plan §4 |

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
- **Squire moments:** Challenge also answers "an enemy attacking an ally" and Unbowed only
  untelegraphed blows; neither has its own moment yet (Squire track).

## Done

| ID | Task | Merged |
|---|---|---|
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
| D5 | Bot: class-agnostic harness, smoke-t1 route (subagent); server lane benches and setActive removed | `8c18ccbc`, `f8d6e40f` |
| D1 | Item lineage trees, ability node rows, shards removed (subagent): 165 files, −53k lines; bot shims dropped | `9164b024`, `b1a4962a` |
| F5 | Class gear: smart loot (`classes`), class lines on shared bases, relic items and the T4 gate gone | `98eec7e3` |
| F8 | Bot: `classConfig` step, `pieceLearned` / `trophyHeld` conditions; shared `classConfigContextFromState` | `cd81e3bb` |
| F4 + T0 | Passive Tree from the kits; tests swept (subagent); root-only fixes (empowered default, balance lab, tier entry) | `b5ce4436`, `2d43e779` |
| F2 | The class config: `configuresClass`, `class:setConfig`, migration 0010, auto mode | `4d1cc6ea` |
| F3 | Lessons and trophies: derived from biome levels and boss clears inside F1/F2, nothing to grant; the "new" toast moves to F7 | (in F1, F2) |
| K1 | Striker kit (subagent): 26 pieces, 11 trophies, tree | `3073540a` |
| K2 | Squire kit (subagent): 23 pieces, 11 trophies, tree | `3c014363` |
| K3 | Apprentice kit (subagent): 21 pieces, 11 trophies, tree | `a66e443f` |
