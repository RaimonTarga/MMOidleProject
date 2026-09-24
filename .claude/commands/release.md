# /release

Cut an MMO Idle release. Usage: `/release major | minor`.

1. Read CLAUDE.md and docs/release-flow.md. Inspect status and preserve unrelated work.
   If bots depend on this checkout, prepare in a separate clone with its own dependencies
   and build outputs. Do not switch, stash, reset, stop or rebuild their workspace.
2. Establish current remote master/develop refs and the intended candidate. Derive the
   next X.Y version from package.json and the user's major/minor choice. Record release
   scope, Conduit availability, save policy and any explicitly accepted provisional work.
3. Audit scripts/release.mjs and deployment configuration. Probe the actual public service;
   inspect deployment metadata/logs if accessible. Record unavailable access and distinguish
   a Git publication from a verified deployment. Follow explicit authorization to attempt
   a playtest despite an outage or unfinished economy experiments.
4. On develop in the isolated release clone, run `pnpm release:prepare X.Y` (or first use
   `--dry-run`). It writes all six package versions, the manifest and versioned notes.
   Re-running a prepared version is rejected; edit its notes directly.
5. Read the generated history, current source and updates/develop notes. Write player-facing
   highlights and detailed system sections, with operational findings in a separate record.
   After absorbing branch notes, delete those notes and commit their deletions separately
   from release metadata so the cut's unrelated-change check remains meaningful.
6. Run `pnpm typecheck`, `pnpm test`, `pnpm build` and `git diff --check` on the candidate.
   For publisher changes also run `node --test scripts/release.test.mjs`. Record exact
   failures and omitted checks. Add migration/restore and live smoke validation appropriate
   to the user's save policy and available environment; do not fabricate passed gates.
7. Present the concrete notes and unresolved findings. Ask for publication confirmation
   only if the user has not already authorized this release; do not ask again for a scope
   already approved in the current session.
8. Run `pnpm release:cut X.Y`: it fetches refs, validates metadata and ancestry, runs
   typecheck, commits release metadata and atomically pushes develop/master/release-vX.Y.
   Use --skip-checks only if this exact candidate was already typechecked and recorded.
9. Verify matching remote SHAs and check the public service after deployment time. If it
   remains unavailable, report that and the limits of diagnostic access. Never imply that
   a successful push proves Railway deployed the release.

Use scripts/release.mjs for publication; do not duplicate its branch/push logic by hand.
Release snapshots are immutable. Keep ongoing experiment results out until adopted.
