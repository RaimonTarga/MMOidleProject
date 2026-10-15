# Docs cleanup: move finished briefs and reports to the archive (mechanical, nothing deleted)

Branch `docs/cleanup`, worktree `../mmo-rw-docs-cleanup` (created off `rework/class-first`). A
parallel overnight session is working in `../mmo-rework` and writes only inside
`docs/briefs/class-first-build/` and a few `docs/*-current-state.md` files. **Do not touch
`docs/briefs/class-first-build/` at all, nor any `*-current-state.md`, `docs/README.md` excepted
(see step 4).** The conductor merges your branch later, after the overnight session ends.

## Rule (no judgment about truth is needed)

A file under `docs/briefs/` (not `class-first-build/`) is **historical**: it is a dated brief,
plan, run report, study, handoff or experiment packet for work that has shipped or been dropped.
Move it with `git mv` to `docs/archive/briefs/<same filename>` and add, as the first line,
`> ARCHIVED 2026-10-16 (moved from docs/briefs/). Historical evidence; the code and the
current-state docs win.` Keep its content unchanged otherwise.

**Exceptions that stay put** (still referenced as live): any file that `docs/README.md`, `CLAUDE.md`,
`design_docs/architecture.md` or a `*-current-state.md` file links to as a current or active
document (check with `grep -rl "<filename>"`); and anything whose own text says it is the living
procedure. If a file is linked only from other archived files, it moves. If you are unsure whether
a file is live, **leave it** and list it in your report.

Non-markdown files in `docs/briefs/` (the `bot-balance-*-study.json` files, the lineage mockup
`.html`) move to `docs/archive/briefs/data/` with `git mv`, unless something in `server/`,
`bot/`, `tools/` or `scripts/` reads them (grep first; leave those in place and list them).

`docs/archive/` itself: leave as is. Do not delete anything.

## Steps

1. `git branch --show-current` must be `docs/cleanup`. Never `pnpm install`.
2. List `docs/briefs/*` (top level only); classify with the rule; write the list of moves and the
   list of stays (with the reason) to `docs/briefs/DOCS-CLEANUP-REPORT.md`.
3. Do the moves in batches of about 50 (`git mv`), committing each batch.
4. Fix references: for every moved file, find links or mentions in living docs
   (`docs/*.md` other than archive, `design_docs/*.md`, `CLAUDE.md`, `README.md`) and in source
   comments (`grep -rn "docs/briefs/<name>"` over `*.ts`, `*.tsx`, `*.mjs`); update each path to
   `docs/archive/briefs/<name>`. In `docs/README.md` rewrite the "Start here" and any briefs
   entries so every link resolves, and set **Last audited** to 2026-10-16. Do not edit anything
   else in living docs. Source-comment path edits are the only code changes allowed (comments only).
5. Verify: no broken relative links in `docs/README.md` and `CLAUDE.md` (write a small throwaway
   script in your scratchpad, not in the repo); `pnpm typecheck` clean (comment edits only).
6. Report counts: moved, stayed (with reasons), references fixed. Commit. Do not merge or push.
