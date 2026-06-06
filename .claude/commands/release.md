# /release

Cut an MMO Idle release.

## Usage

`/release X.Y.Z`

## Instructions

1. Validate that `X.Y.Z` is a semantic version.
2. Verify the current branch is `develop` and the intended changes are merged.
3. Run `pnpm release:prepare X.Y.Z`.
4. Edit `updates/vX.Y.Z/changelog.md` into player-facing patch notes using the generated commit list.
5. Run `pnpm typecheck`.
6. Present the patch notes and ask for confirmation before branch creation.
7. Run `pnpm release:cut X.Y.Z` only after confirmation.

## Branch Model

- `develop` is in-flight work.
- `release-vX.Y.Z` is the release snapshot.
- `latest` is what Railway deploys.

Use `scripts/release.mjs` for branch creation and `latest` movement. Do not
manually duplicate the release script logic.
