# Release Flow

## Branches

- `develop` is the in-flight branch for the next release. Merge feature, fix, and ops work here.
- `master` is the latest production version and is what Railway deploys.
- `release-vX.Y` branches are immutable release snapshots created during release cuts.

Railway should be configured to deploy from `master`.

## Railway Runtime Configuration

The application service needs `DATABASE_URL`, `LOG_DATABASE_URL`, and `REDIS_URL`
pointing at the game Postgres, log Postgres, and Redis services. Discord player login
also requires:

| Variable | Railway value |
|---|---|
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | Discord application secret |
| `DISCORD_REDIRECT_URI` | Public Railway origin + `/auth/discord/callback` |
| `CLIENT_URL` | Public player origin, without a trailing fragment |

The redirect URI must be registered exactly in the Discord developer portal. Never
set `AUTH_DEV_BYPASS` in production. Discord player login does not secure `/admin`;
keep the dashboard and admin namespace behind trusted access until admin auth lands.

Release versions use `X.Y` major.minor semantics. Patch fixes are rolled into the
next minor release rather than cut as separate three-segment releases.

## Cutting a Release

1. Merge the intended changes into `develop`.
2. Check out `develop` and make sure it is up to date.
3. Run `pnpm release:prepare X.Y`.
4. Edit `updates/vX.Y/changelog.md` into player-friendly patch notes.
5. Run `pnpm release:cut X.Y`.

`release:cut` only runs from `develop`. It runs typecheck, commits release
metadata if needed, creates `release-vX.Y`, fast-forwards `master` to the same
release commit, and pushes `develop`, `master`, and the new release branch.

## Safety Rules

- Do not commit normal development work directly to `master`.
- Do not reuse an existing `release-vX.Y` branch name.
- If `master` cannot fast-forward to the new release commit, stop and fix the
branch history before cutting the release.
- Use `pnpm release:prepare X.Y --dry-run` to preview generated notes without
writing files.
