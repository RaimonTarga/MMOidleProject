---
name: release
description: Cut MMO Idle releases. Use when the user says /release, asks to release a version, cut a release branch, move latest, or generate patch notes from commit history.
---

# Release

Use this skill for `/release X.Y.Z` and equivalent requests.

## Workflow

1. Confirm the target version is semantic version format `X.Y.Z`.
2. Ensure the repo is on `develop` and the intended work is merged there.
3. Run `pnpm release:prepare X.Y.Z`.
4. Read `updates/vX.Y.Z/changelog.md`, then rewrite the TODO sections into concise player-facing patch notes using the generated commit list as source material.
5. Run `pnpm typecheck`.
6. Show the user the generated patch notes and ask for confirmation before cutting branches.
7. After confirmation, run `pnpm release:cut X.Y.Z`.

## Branch Model

- `develop` is the in-flight integration branch.
- `release-vX.Y.Z` is the immutable release snapshot.
- `latest` points at the release Railway deploys.

## Rules

- Do not hand-create release branches when `scripts/release.mjs` can do it.
- Do not cut a release with unrelated working tree changes.
- Do not skip checks unless the user explicitly requests it.
- Do not move `latest` if the release script reports it cannot fast-forward.
- Do not edit `.cursor/plans/*.plan.md` files as part of a release.
