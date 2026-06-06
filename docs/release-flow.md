# Release Flow

## Branches

- `develop` is the in-flight integration branch. Merge feature, fix, and ops work here.
- `release-vX.Y.Z` branches are immutable release snapshots.
- `latest` points at the release currently deployed by Railway.

Railway should be configured to deploy from `latest`.

## Cutting a Release

1. Merge the intended changes into `develop`.
2. Check out `develop` and make sure it is up to date.
3. Run `pnpm release:prepare X.Y.Z`.
4. Edit `updates/vX.Y.Z/changelog.md` into player-friendly patch notes.
5. Run `pnpm release:cut X.Y.Z`.

`release:cut` runs typecheck, commits release metadata if needed, creates
`release-vX.Y.Z`, moves `latest` to the same commit, and pushes `develop`, the
new release branch, and `latest`.

## Safety Rules

- Do not commit normal development work directly to `latest`.
- Do not reuse an existing `release-vX.Y.Z` branch name.
- If `latest` cannot fast-forward to the new release commit, stop and fix the
branch history before cutting the release.
- Use `pnpm release:prepare X.Y.Z --dry-run` to preview generated notes without
writing files.
