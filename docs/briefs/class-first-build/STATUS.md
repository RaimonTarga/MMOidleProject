# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-14: F1, F2, K1–K3, D5 merged; F4 waits for T0's test sweep; D1 running; D2 ready for Grok. Codex hit rate limits, so D5 and K1–K3 run as
Claude subagents of the conductor (same briefs, same worktrees); ICONS-T1 stays with Codex.

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| D1 | [Remove the item lineage trees, ability node rows, shards](D1-lineage-trees-rows-shards.md) | Claude subagent | `../mmo-rw-d1-lineages` · `rw/d1-lineages` | running |
| D2 | [Remove stances, rites, Runic Points, the core slot](D2-stances-rites-runic-points-cores.md) | Grok | `../mmo-rw-d2-stances-rites` · `rw/d2-stances-rites` | ready to start |
| T0 | Test sweep after F4: tests built on frames, ranges and paths | Claude subagent | `../mmo-rw-f4-suite` · `rw/f4-tree` | running |
| ICONS-T1 | [Icons for every T1 piece and trophy](ICONS-T1.md) | Codex (image generation) | `../mmo-rw-icons-t1` · `rw/icons-t1` | running |
| D6 | [The tutorial keeps its engine and the seal route](D6-tutorial-engine.md) | Grok | `../mmo-rw-d6-tutorial-core` · `rw/d6-tutorial-core` | running |
| I3 | [The server bench fights again](I3-bench-repair.md) | Grok | `../mmo-rw-i3-bench` · `rw/i3-bench` | running |
| K4 | [Slinger kit data](K-kit-data.md) | Grok | `../mmo-rw-k4-slinger` · `rw/k4-slinger` | running |
| K5 | [Spirit kit data](K-kit-data.md) | Grok | `../mmo-rw-k5-spirit` · `rw/k5-spirit` | running |
| K6 | [Conduit kit data](K-kit-data.md) | Grok | `../mmo-rw-k6-conduit` · `rw/k6-conduit` | running |
| F4 | Passive Tree from the kits, discipline-scoped gate (`rw/f4-tree`, 6cf31cac) | Conductor | `../mmo-rework` | built; merges after T0 |

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

## Done

| ID | Task | Merged |
|---|---|---|
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
| D5 | Bot: class-agnostic harness, smoke-t1 route (subagent); server lane benches and setActive removed | `8c18ccbc`, `f8d6e40f` |
| F2 | The class config: `configuresClass`, `class:setConfig`, migration 0010, auto mode | `4d1cc6ea` |
| F3 | Lessons and trophies: derived from biome levels and boss clears inside F1/F2, nothing to grant; the "new" toast moves to F7 | (in F1, F2) |
| K1 | Striker kit (subagent): 26 pieces, 11 trophies, tree | `3073540a` |
| K2 | Squire kit (subagent): 23 pieces, 11 trophies, tree | `3c014363` |
| K3 | Apprentice kit (subagent): 21 pieces, 11 trophies, tree | `a66e443f` |
