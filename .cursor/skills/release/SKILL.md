---
name: release
description: Cut MMO Idle releases. Use when the user says /release, asks to release a version, advance master, create a release snapshot, or generate patch notes from commit history and updates/develop notes.
---

# Release

Use this skill for `/release X.Y` and equivalent requests.

## Workflow

1. Confirm the target version is major.minor format `X.Y`; patch releases are rolled into the next minor release.
2. Ensure the repo is on `develop`; release commands must not run from any other branch.
3. Run `pnpm release:prepare X.Y`.
4. Read `updates/vX.Y/changelog.md` and every file under `updates/develop/**/*`.
5. Rewrite the TODO sections into concise player-facing patch notes using both the generated commit list and the `updates/develop` notes as source material.
6. After folding the `updates/develop` information into `updates/vX.Y/changelog.md`, delete the no-longer-needed branch note files/directories under `updates/develop/`.
7. Run `pnpm typecheck`.
8. Show the user the generated patch notes and ask for confirmation before publishing.
9. After confirmation, run `pnpm release:cut X.Y`. This commits release metadata on `develop`, creates `release-vX.Y`, fast-forwards `master` to the release commit, and pushes `develop`, `master`, and the snapshot branch.

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
- Do not leave folded `updates/develop` branch notes behind after creating the version changelog.
