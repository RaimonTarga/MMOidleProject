# /release

Cut an MMO Idle release.

## Usage

`/release major | minor`

## Instructions

1. Determine the next version number from `package.json`: increment the major segment and reset minor to `0` for a major release, or increment the minor segment for a minor release.
2. Validate that `X.Y` is a major.minor release version.
3. Verify the current branch is `develop`; release commands must not run from any other branch.
4. Run `pnpm release:prepare X.Y`.
5. Read `updates/vX.Y/changelog.md` and every file under `updates/develop/**/*`.
6. Edit `updates/vX.Y/changelog.md` into player-facing patch notes using both the generated commit list and the `updates/develop` notes.
7. After folding the `updates/develop` information into `updates/vX.Y/changelog.md`, delete the no-longer-needed branch note files/directories under `updates/develop/`.
8. Run `pnpm typecheck`.
9. Present the patch notes and ask for confirmation before publishing.
10. Run `pnpm release:cut X.Y` only after confirmation. This commits release metadata on `develop`, creates `release-vX.Y`, fast-forwards `master` to the release commit, and pushes `develop`, `master`, and the snapshot branch.

## Branch Model

- `develop` is in-flight work for the next release.
- `master` is the latest production version and is what Railway deploys.
- `release-vX.Y` is the immutable release snapshot created during the release cut.

Use `scripts/release.mjs` for branch creation and `master` advancement. Do not
manually duplicate the release script logic.

Do not leave folded `updates/develop` branch notes behind after creating the
version changelog.
