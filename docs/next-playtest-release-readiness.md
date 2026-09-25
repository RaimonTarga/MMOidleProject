# v0.5 playtest release readiness

Updated 2026-09-24. [Player patch notes](../updates/v0.5/changelog.md).

## Approved release decisions

- Publish v0.5 from the current develop baseline, without waiting for economy experiments.
- Conduit is available in production. Client and server now enable it unconditionally;
  development tools and authentication bypass remain independently disabled in production.
- Previous playtest data is disposable. Retaining old saves or rehearsing their recovery
  is not a release gate for this attempt. No database wipe has been executed.
- Keep the running economy experiments and their source/data untouched. Future adopted
  economy changes will ship separately; current economy values remain provisional.
- Attempt the existing friend's Railway deployment first. If it remains broken, the
  owner can create a new Railway project; no direct access to the friend's project exists.

## Source and isolation

Baseline develop: `ff98ba4513cb9fcb1e5752acfd56495268aff416`.
Previous production: `ed7ae81ca7ee3ee852a6631ec605a64ec54d6930` (v0.4).
The baseline has 563 non-merge commits since production and is a valid fast-forward.

Release work is in `D:/mmo-release-0.5`, an isolated clone with its own dependencies
and build outputs. The original checkout and its uncommitted economy preparation are
not part of this release. The original checkout will need a deliberate reconciliation
with updated origin/develop after its active work finishes; do not reset it or overwrite
its preparation files to make it match this release.

The final versioned notes absorb `updates/develop/feat__ui-info-layer.md`. Its historical
validation counts do not represent this candidate. Draft notes are superseded by v0.5.

## Railway evidence and limits

> **Update 2026-09-25:** the live playtest deployment is `https://mmo-idle.up.railway.app`
> (healthy, `/healthz` returns `ok`). `the-project.up.railway.app` below is the older
> project; it still returned 502 on 2026-09-25 and is not production.

Before this release, both public probes returned HTTP 502, "Application failed to respond":

- `https://the-project.up.railway.app/` — request `S_a7BXIBR06jv5LrWVMv1w`.
- `https://the-project.up.railway.app/healthz` — request `4skIiKGuSsGakoc6nTga3g`.

This confirms a public outage, not its cause. GitHub CLI is signed out and Railway CLI
is unavailable. Git transport access is separate and is being used for publishing.
Without Railway project access, service settings, build/runtime logs and deployed SHA
cannot be inspected. A successful push proves publication only; a continuing 502 cannot
prove whether Railway attempted a deployment.

The user explicitly accepts attempting the release despite this outage and pending
balance work. Successful live login, persistence and gameplay remain unverified until
an application is reachable. Do not describe this candidate as production-certified.

## Candidate changes beyond develop

- Enable Conduit on both client and server without requiring Railway variable changes.
- Include the bot workspace manifest in the Docker dependency-install layer.
- Resolve player patch notes from the shipped package version, independently of the
  telemetry build identifier or Railway commit SHA.
- Include all six package versions in release preparation; reject duplicate preparation
  before writes and inconsistent/unwritten release metadata before publishing.
- Refresh remote refs before cutting, use the Windows-supported command invocation for
  typecheck, and publish develop/master/release-v0.5 in one atomic push. The publisher
  does not create local release refs when that push fails.

## Validation

- Offline frozen-lockfile install: passed for all six workspaces.
- Release publisher regression suite: 5/5 passed. Covers duplicate preparation,
  unfinished/mismatched metadata rejection, normal cut with real typecheck invocation,
  atomic push rejection, and divergent production rejection in disposable repositories.
- Release announcement regression: passed with both Railway SHA and telemetry override set.
- Full application suite: still running at publication preparation (69 test files
  completed without a reported failure). Publication is proceeding with this result
  explicitly pending, following the user's direction to attempt the playtest now.
  The run is in the isolated clone; output is `D:/mmo-release-0.5-tests.log`.
- Production application build: passed for shared/client/admin/server; Vite reports
  large bundle warnings, without build errors. Docker image build remains untested.
- Typecheck: final candidate passed, including benchmark sources.
- Compiled production smoke: Conduit enabled, development tools disabled, and v0.5
  announcement resolved successfully. This is a module check, not live gameplay.
- Docker image build, live service smoke and database migration execution: not performed.

## Runtime requirements and migration behavior

The app uses Node 22, the repository Dockerfile, `node server/dist/index.js`, and `/healthz`.
It listens on Railway's `PORT` on `0.0.0.0`. It needs `DATABASE_URL`, `LOG_DATABASE_URL`
for a separate log database, and `REDIS_URL`. Missing database configuration fails boot.

Discord login needs the client ID/secret, exact `/auth/discord/callback` redirect and
`CLIENT_URL`. Guest account creation is implemented independently of Discord settings.
Admin access requires a secret `ADMIN_TOKEN` of at least 32 characters; never put it in
client build variables. Keep `AUTH_DEV_BYPASS` and `DEV_TOOLS` disabled in production.

Migrations run at boot. Compared with v0.4, game migrations 0002–0007 include emptied
catalyst wallets, reset exploration/position, accounts and sessions, guest sessions,
summon reconstruction and telemetry identity. Log migrations 0003–0004 expand telemetry.
Old data is disposable by user decision, but no automatic DROP/TRUNCATE behavior was
added. If legacy state prevents migration, the service owner must reset the intended
playtest databases or deploy against fresh ones. Local bot databases must not be touched.

## After the push

Verify identical remote SHAs for develop/master/release-v0.5. Probe the public homepage
and health endpoint after allowing deployment time. If available, test the release notes,
guest/Discord entry, character selection, Conduit unlock, gameplay and reconnect/save.
If it still returns 502, report the failure and the lack of deployment-log access. A new
Railway deployment can use the same release branch with fresh game/log databases and Redis.
