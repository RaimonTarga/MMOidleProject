# Rules for every agent on the class-first build

You are one of several agents (a Claude conductor, Codex, Grok, sometimes more Claude
sessions) rebuilding MMO Idle's classes on the design in
`design_docs/class-first-bible.md`. The overall plan is
`docs/briefs/class-first-build-plan-2026-10-14.md`; your own task is one brief in this
folder. Read `CLAUDE.md` (the repo's rules) before your first edit.

## Where you work

- **Only in the worktree your brief names** (a folder like `../mmo-rw-<id>`), on the branch it
  names (`rw/<id>`). Run `git branch --show-current` before every commit; if it is not your
  branch, stop.
- Never touch the main checkout (`MMO idle/`), the conductor's `../mmo-rework`, or any other
  worktree. Never `git checkout`/`switch` to another branch, `stash`, `reset --hard`, `rebase`,
  `push`, or delete branches.
- **Never run `pnpm install`, `npm install` or add a dependency.** `node_modules` here are
  junctions into the main checkout's store: never delete or edit anything inside them. If
  imports fail to resolve, stop and report.

## How you change things

- Edit only the paths your brief allows. If the task needs a file outside them, stop and
  say so in your report instead of editing it.
- **Line endings differ per file** (some LF, some CRLF). Keep each file's own endings. After
  your edits run `git diff --numstat`: a file showing every line changed means you converted
  its endings; fix that before committing.
- Don't invent design. The bible is the authority; when it and your brief disagree, or the
  bible doesn't say, stop and ask in your report. Every number you are not given is a
  placeholder: copy the brief's numbers exactly and invent none.
- New ids never reuse an old id. Ids are kebab-case and frozen once created.
- Follow the code's existing style: comment density, naming, idioms (`CLAUDE.md`).

## How you check

- `pnpm typecheck` (about 50 s) before every commit; it must be clean.
- Tests are plain tsx scripts (no framework). Run the ones your brief names:
  `pnpm test -- <substring>`. Don't run the full suite unless your brief says so (about
  5 minutes). If you do, read the `N/M passed` line: the exit code can lie.
- Tests never need Postgres or Redis. Don't start servers or bots unless your brief says to;
  when it does, use your own port and database, never port 4000.
- `server/test/biomeEcology.test.ts` is flaky under CPU load: if it fails, rerun it alone
  before treating it as yours.

## How you finish

- Commit in small, focused steps: `type(scope): summary`, a short body saying what and why,
  and a last line `Co-Authored-By: <your agent name> <noreply@...>`.
- Write your report to `docs/briefs/class-first-build/reports/<ID>.md` and commit it on your
  branch. Use this shape:

```markdown
# <ID> report
**Agent:** Codex | Grok | ...   **Branch:** rw/<id>   **Last commit:** <hash>
## Done
- what changed, by area
## Checks
- pnpm typecheck: clean
- pnpm test -- <substrings>: N/M passed (paste the summary lines)
## Not done, or unsure
- anything skipped, anything that needs the conductor's call
## Files outside the brief I needed (not edited)
```

- Then tell the designer: "Task <ID> is done on branch rw/<id>; the report is at
  docs/briefs/class-first-build/reports/<ID>.md". Don't merge anything yourself.
