# Release Flow

## Branches

- `develop` holds in-flight work.
- `master` is the production branch Railway is expected to deploy.
- `release-vX.Y` is an immutable release snapshot.

Versions use X.Y semantics. The v0.5 [readiness record](next-playtest-release-readiness.md)
and [patch notes](../updates/v0.5/changelog.md) document the current playtest decisions.

## Preparation and publication

1. Read CLAUDE.md, inspect status, and identify the intended source revision. Preserve
   concurrent changes. Use an isolated clone with its own dependencies/build outputs if
   active experiments depend on the current checkout; do not switch or reset their source.
2. Refresh remote refs and compare develop against master. Audit release scripts, package
   layout, migrations, production flags and actual service availability.
3. Settle version and playtest scope. Write concise highlights and detailed system notes.
   Respect explicit user decisions about provisional economy, disposable saves and
   attempting deployment despite an existing outage; record the resulting limitations.
4. On the isolated develop branch run `pnpm release:prepare X.Y`. This changes all six
   package versions and the announcement manifest; dry-run is available for preview.
   Edit the resulting changelog rather than re-running prepare for the same version.
5. Fold in relevant `updates/develop` notes. Commit absorbed-note deletions and ordinary
   source/documentation fixes separately before cut, preserving unrelated work.
6. Run typecheck, the full test suite, production build, `node --test scripts/release.test.mjs`
   when changing publishing logic, and diff checks. Record failures and any checks that
   cannot run. Live smoke requires a reachable service; a healthcheck is not gameplay proof.
7. Present the concrete notes and findings. Obtain publishing approval if the user has
   not already explicitly authorized this release. Current-session authorization persists.
8. Run `pnpm release:cut X.Y`. It refreshes remote refs, validates metadata and production
   ancestry, runs typecheck, commits release metadata, and atomically pushes develop,
   master and release-vX.Y. A rejected push leaves remote refs unchanged. `--skip-checks`
   is only appropriate when the same candidate was already typechecked and results recorded.
9. Verify all three remote SHAs and the live service. Record publication and deployment
   separately. If the push succeeds but local ref updates fail, reconcile from verified
   remote refs; do not blindly repeat cut or overwrite a published snapshot.

## Railway runtime

Use the repository Dockerfile with `node server/dist/index.js`, the assigned `PORT`, and
`/healthz`. Required services are game PostgreSQL (`DATABASE_URL`), separate log PostgreSQL
(`LOG_DATABASE_URL`), and Redis (`REDIS_URL`). Migrations run during boot.

Discord needs `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` (public
origin + `/auth/discord/callback`), and `CLIENT_URL`. Register the exact callback in Discord.
Guest mode does not require Discord OAuth. `/admin` uses separate token authentication:
set a secret `ADMIN_TOKEN` of at least 32 characters; production admin fails closed without it.
Keep production dev authentication bypass and `DEV_TOOLS` disabled.

Conduit is enabled in client and server as of v0.5; no environment overrides are needed.
Gameplay telemetry configuration and retention are described in
[gameplay telemetry](gameplay-telemetry-current-state.md). Announcement lookup uses the
package release version even when telemetry identifies a Railway deployment by commit SHA.

Check actual Railway branch/environment wiring and logs whenever access exists. Repository
config does not prove that a friend's deployment is connected. A Git push can be attempted
with user authorization when that access is unavailable; report the public response without
claiming to know its underlying failure cause.

## Data policy

For retained production saves, back up both databases and rehearse migration/restore before
release. For explicitly disposable playtest data, record that decision and use an intentional
reset or fresh databases if needed; never add an unconditional wipe to application boot.
No app rollback reverses a database migration automatically. Never reuse local experiment
volumes as release databases or interrupt experiment workloads during deployment work.
