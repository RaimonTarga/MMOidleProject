---
name: mmo-pr
description: Prepare MMO Idle pull requests. Use when the user says /mmo_pr, asks to commit current work, add a develop changelog entry, and open a PR against develop.
---

# MMO PR

Use this skill for `/mmo_pr` and equivalent requests.

## Workflow

1. Inspect the working tree and current branch with `git status --short --branch`.
2. If there are no changes to commit, stop and tell the user there is nothing to PR.
3. If the current branch is `master`, stop with an error. Never create MMO PRs from `master`.
4. If the current branch is `develop`, create a working branch before committing. Use a concise branch name from the change, such as `feature/<slug>` or ask the user if the intent is unclear.
5. If the current branch is neither `develop` nor `master`, treat it as the existing working branch. Do not checkout, rename, or create another branch.
6. Create a changelog note for the work under `updates/develop/` before committing:
   - Derive a changelog filename from the branch name by replacing `/` with `__`.
   - Use `updates/develop/<branch-name>.md`.
   - Summarize what changed in player-facing language first, then include technical notes when useful.
7. Review the diff and commit the implementation plus changelog note together. Use a concise commit message focused on why the change matters.
8. Push the working branch to `origin` with upstream tracking if needed.
9. Open a GitHub PR from the working branch against `develop` with `gh pr create --base develop`.
10. Return the PR URL, branch name, commit hash, changelog path, and any checks run.

## Changelog Template

```markdown
# <Short Change Title>

## Player-facing changes

- <What players or operators will notice.>

## Technical notes

- <Important implementation, migration, balance, or ops details.>

## Validation

- <Checks run, or "Not run" with a brief reason.>
```

## Rules

- Do not commit directly on `develop`; branch first.
- Error if the current branch is `master`.
- Do not include unrelated changes in the commit.
- Do not commit secrets, local credentials, logs, or generated debug artifacts.
- Do not open the PR against `master`; MMO Idle feature PRs target `develop`.
- Do not skip the changelog note unless the user explicitly asks.
