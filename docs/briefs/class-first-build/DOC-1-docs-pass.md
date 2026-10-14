# DOC-1: the docs pass for the removed systems

**Agent:** Grok · **Worktree:** `../mmo-rw-doc-1` · **Branch:** `rw/doc-1` (from
`rework/class-first` after D2) · **Size:** M · **Docs only: never edit code.**

**Read first:** `AGENT-RULES.md` (this folder); `CLAUDE.md`'s "Docs" section (the archive
lifecycle); `docs/README.md` (the index); `design_docs/class-first-bible.md` §0–§4 and §14 (what
replaces what). The reports in `docs/briefs/class-first-build/reports/` (D1, D2, D5, F5) say
exactly what each removal took out.

## Why

The rework branch has deleted whole systems: item lineage trees, shards and ability node rows
(D1); Runic Points, crafted runes, stances, rites and the core slot (D2); the bot's class and
campaign routes (D5); relic items (F5: the relic slot now holds the boss trophy). The repo rule
is that code wins and docs follow: their living docs now describe things that no longer exist.

## 1. Archive the docs whose system is gone

`git mv` each into its folder's `archive/` subfolder (create `docs/archive/` or
`design_docs/archive/` entries as the existing ones are), and put this header as the first line:

```markdown
> **ARCHIVED (2026-10-15): the class-first rework removed this system (<task id>).** Design authority: [class-first-bible.md](<relative path>/design_docs/class-first-bible.md). Kept for history only.
```

| File | Removed by |
|---|---|
| `docs/lineages-current-state.md` | D1 |
| `docs/relics-current-state.md` | F5 |
| `docs/cores-current-state.md`, `docs/core-rework-design-balance-handoff.md` | D2 |
| `docs/stances-current-state.md`, `docs/stances-authoring-guide.md`, `docs/stances-future-design-notes.md` | D2 |
| `docs/rites-current-state.md`, `docs/rites-authoring-guide.md` | D2 |
| `design_docs/CORE_DESIGN_PHILOSOPHY.md`, `design_docs/CORE_T4_CAST.md`, `design_docs/CORE_CAST_REVIEW_DRAFT.md` | bible §4 (the core slot is gone) |
| `design_docs/relics-design.md` | bible §4 (the relic slot holds the boss trophy) |

Fix every relative link inside a moved file (it is one folder deeper now) and every link to it
from a living doc (grep the repo's `*.md` for the filename).

## 2. The bot docs (D5)

`docs/t2-bot-testing-infrastructure.md`, `docs/bot-harness-capability-audit.md`,
`docs/bot-experiment-runner-current-state.md`, `docs/bot-experience-command-center.md`: compare
each with the code in `bot/` today (and the D5 report). If most of it describes removed routes,
lanes or step kinds, archive it as above (removed by D5). Otherwise cut the removed parts and
add one line at the top: `> Class-first rework (2026-10-15): the class and campaign routes were
removed (D5); class routes return per class.` Say in your report which you did and why.

## 3. Fix the living docs that still describe removed things

Grep `docs/*.md`, `design_docs/*.md` (not `archive/`) and `CLAUDE.md` for: lineage, evolve,
reconstruct, shard, node row, Runic Point, `RP`, stance, rite, core slot, `core.`, relic item,
crafted rune, rune recipe. For each hit that describes a removed thing as present:

- In a current-state doc: delete or rewrite the sentence so it is true of the code today (check
  the code). Add one line under the title: `> Class-first rework (2026-10-15): <what was
  removed> removed; see the bible.` once per doc.
- `docs/README.md`: move the archived docs to its archive list, with the one-line reason.
- `docs/system-rework-status.md`: mark the removed systems' rows "Removed (class-first rework)".
- `CLAUDE.md`: only make it true. Its "Socket Surface" lists must match
  `shared/src/protocol/socketEvents.ts` (drop removed events such as `rune:setLoadout` if they
  are gone; add `class:setConfig` / `class:configResult`). Its "Combat And Mechanics" and
  "Data Authoring" bullets must not name removed systems. Nothing else in `CLAUDE.md`.
- "stance" also means a monster or boss posture: leave those.

**Leave alone** (other tasks own them): `docs/abilities-current-state.md`,
`docs/runic-attunement-current-state.md` (D3 removes the abilities next),
`docs/frames-current-state.md`, `docs/barrier-ward-current-state.md`,
`docs/conduit-current-state.md` (the class tracks replace those), `design_docs/class-first-bible.md`,
`design_docs/design-bible.md`, everything under `docs/briefs/`, `progression-rework-design.md`,
`T1_ITEM_*.md` and `ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md` (the designer decides when those
archive).

## Checks

- Every link you touched resolves: for each edited file, check every `](...)` relative path
  exists.
- `git diff --numstat`: no file shows every line changed (line endings kept).
- No code file in your diff (`git diff --stat rework/class-first` lists only `.md` files).

## Commit and report

Commit in three steps (archive moves; bot docs; living-doc fixes). Report at
`docs/briefs/class-first-build/reports/DOC-1.md`: each archived file, each edited file with a
one-line summary of the change, and every hit you weren't sure about (left unedited).
