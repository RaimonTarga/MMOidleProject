---
name: release
description: Cut MMO Idle releases. Use when the user says /release, asks to release a version, advance master, create a release snapshot, or generate patch notes from commit history.
---

# Release

Use this skill for `/release X.Y` and equivalent requests.

## Workflow

1. Confirm the target version is major.minor format `X.Y`; patch releases are rolled into the next minor release.
2. Ensure the repo is on `develop`; release commands must not run from any other branch.
3. Run `pnpm release:prepare X.Y`.
4. Read `updates/vX.Y/changelog.md`, then rewrite the TODO sections into concise player-facing patch notes using the generated commit list as source material.
5. Run `pnpm typecheck`.
6. Show the user the generated patch notes and ask for confirmation before publishing.
7. After confirmation, run `pnpm release:cut X.Y`. This commits release metadata on `develop`, creates `release-vX.Y`, fast-forwards `master` to the release commit, and pushes `develop`, `master`, and the snapshot branch.

## Branch Model

- `develop` is the in-flight work for the next release.
- `master` is the latest production version and is what Railway deploys.
- `release-vX.Y` is the immutable release snapshot created during the release cut.

## Rules

- Do not hand-create release branches when `scripts/release.mjs` can do it.
- Do not cut a release with unrelated working tree changes.
- Do not skip checks unless the user explicitly requests it.
- Do not advance `master` if the release script reports it cannot fast-forward.
- Do not edit `.cursor/plans/*.plan.md` files as part of a release.
