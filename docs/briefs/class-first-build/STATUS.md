# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-14: wave A handed out; F1 merged; K1–K6 ready.

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| D5 | [The bot becomes a class-agnostic harness](D5-bot-harness-core.md) | Codex | `../mmo-rw-d5-bot-core` · `rw/d5-bot-core` | ready to start |
| ICONS-T1 | [Icons for every T1 piece and trophy](ICONS-T1.md) | Codex (image generation) | `../mmo-rw-icons-t1` · `rw/icons-t1` | ready to start |
| D6 | [The tutorial keeps its engine and the seal route](D6-tutorial-engine.md) | Grok | `../mmo-rw-d6-tutorial-core` · `rw/d6-tutorial-core` | ready to start |
| I3 | [The server bench fights again](I3-bench-repair.md) | Grok | `../mmo-rw-i3-bench` · `rw/i3-bench` | ready to start |
| K1 | [Striker kit data](K-kit-data.md) | Codex | `../mmo-rw-k1-striker` · `rw/k1-striker` | ready to start |
| K2 | [Squire kit data](K-kit-data.md) | Codex | `../mmo-rw-k2-squire` · `rw/k2-squire` | ready to start |
| K3 | [Apprentice kit data](K-kit-data.md) | Codex | `../mmo-rw-k3-apprentice` · `rw/k3-apprentice` | ready to start |
| K4 | [Slinger kit data](K-kit-data.md) | Grok | `../mmo-rw-k4-slinger` · `rw/k4-slinger` | ready to start |
| K5 | [Spirit kit data](K-kit-data.md) | Grok | `../mmo-rw-k5-spirit` · `rw/k5-spirit` | ready to start |
| K6 | [Conduit kit data](K-kit-data.md) | Grok | `../mmo-rw-k6-conduit` · `rw/k6-conduit` | ready to start |
| F2 | `holdsClassKit`, the config intent, persistence | Conductor | `../mmo-rework` | next |

Every open task touches its own folder, so any number can run at once, one agent session per
task. If you'd rather run them a few at a time, a good order is D5 and D6 first (they unblock
D1 and D2), then the K tasks, then I3; ICONS-T1 any time.

## Paste-ready prompts

Open the agent **in the task's worktree folder** and paste its prompt.

**D5 (Codex)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-d5-bot-core`:

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
| D1 | Item lineage trees, ability node rows, shards | Codex | D5, D6 merged |
| D2 | Stances, rites, Runic Points, cores | Grok | D5, D6 merged |
| F2–F8, D3, T0 | The rest of Phase 0 | Conductor, then delegates | see plan §4 |

## Done

| ID | Task | Merged |
|---|---|---|
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
