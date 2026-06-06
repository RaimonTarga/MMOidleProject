# /mmo_pr

Commit current MMO Idle work, add a develop changelog note, and open a PR against `develop`.

## Usage

`/mmo_pr [optional branch or PR title hint]`

## Instructions

1. Inspect the working tree and current branch with `git status --short --branch`.
2. If there are no changes to commit, stop and tell the user there is nothing to PR.
3. If the current branch is `master`, stop with an error. Never create MMO PRs from `master`.
4. If the current branch is `develop`, create a working branch before committing. Use the optional user hint when provided; otherwise choose a concise branch name from the diff, such as `feature/<slug>`.
5. If the current branch is neither `develop` nor `master`, treat it as the existing working branch. Do not checkout, rename, or create another branch.
6. Add a changelog note before committing:
   - Put it under `updates/develop/`.
   - Derive the filename from the working branch by replacing `/` with `__`.
   - Use `updates/develop/<branch-name>.md`.
   - Summarize player-facing changes first, followed by technical notes and validation.
7. Review staged and unstaged changes. Do not include unrelated files, secrets, local credentials, logs, or generated debug artifacts.
8. Commit the implementation and changelog note together with a concise message.
9. Push the working branch to `origin`, setting upstream tracking if needed.
10. Open a GitHub PR from the working branch against `develop` with `gh pr create --base develop`.
11. Report the PR URL, branch name, commit hash, changelog path, and checks run.

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

- Never commit directly on `develop`; branch first.
- Error if the current branch is `master`.
- Never open the PR against `master`; MMO Idle feature PRs target `develop`.
- Do not skip the changelog note unless the user explicitly asks.
