# Read-only telemetry MCP

This standalone service connects Codex to the gameplay tables in Railway
**Postgres-ApNQ** (`0c7b6d3c-bec3-44c3-8419-0bdca8f31370`). Deployed and verified
against production on 2026-09-24 at 22:14 UTC (September 25 in Madrid).

## Current deployment

- Service: `telemetry-mcp` (`9a4e4cc9-e9fd-4a88-8cf8-0662f2816695`).
- Endpoint: `https://telemetry-mcp-production.up.railway.app/mcp`.
- Deployment: `4f13c297-a274-451e-a66e-4caa7a58fa9d`, uploaded from this local
  package with `railway up tools/telemetry-mcp --path-as-root`. It is not connected
  to GitHub autodeploys. Root directory is `/` for this package-only upload.
- Database role created and verified by the service's startup permission check.
  Password and MCP token are stored in the new service's Railway variables.
- Codex connection added to the user's `.codex/config.toml`; token saved in the
  Windows user environment. A full Codex restart is needed to load the new tools.
- Actual MCP SDK handshake, discovery, and all three tools passed against the
  deployed endpoint. Unauthenticated POST returned 401. The check observed
  23,473 human-cohort events in the preceding 24 hours, across multiple versions;
  this is a connectivity receipt, not a balance study or unique-player count.
- The game deployment was not changed by this setup.

Administrator setup used a dedicated local SSH key at
`C:\Users\osaif\.ssh\railway_telemetry`, registered with Railway as
`telemetry-setup`. This key is for Railway administration; the MCP service does
not use it. It can be managed separately through Railway's account SSH keys.

The remaining sections describe rebuilding or reproducing the setup. Do not
rerun the role-creation SQL against the existing role.

Source: [`tools/telemetry-mcp`](../tools/telemetry-mcp/). It has its own pinned
dependencies and lockfile; it is not part of the game workspace or game image.

## 1. Create the restricted login

An administrator must connect to the database referenced by the game server's
`LOG_DATABASE_URL`, not the game-save database. Use a trusted SQL client or psql.
Do not paste the administrator connection string into chat or commit it.

Execute [`setup-reader.sql`](../tools/telemetry-mcp/setup-reader.sql). It creates
`telemetry_reader`, grants SELECT on `public.gameplay_events` and
`public.gameplay_daily`, and sets timeout/read-only defaults. It intentionally
fails if the role already exists; investigate the existing role before proceeding.
It does not run migrations or grant access to future tables.

In an interactive psql session, set its password securely:

```text
\password telemetry_reader
```

Use a generated password stored in your password manager. If using a GUI instead,
set the role password through that client's secure credential interface.
The MCP service checks the login, role memberships, elevated role flags, and
effective table grants at startup. Unexpected table grants inherited through
PUBLIC cause startup to fail; review those grants instead of broadening access.

## 2. Deploy a separate Railway service

Publish only the reviewed MCP package files to a deployable repository/branch.
Do not push unrelated worktree changes. Then create a separate service in the
existing **MMO-idle / production** project/environment:

Alternatively, upload only this directory with the CLI, as used for the current
deployment. This requires no repository push and uses `/` as the service root:

```powershell
railway up tools/telemetry-mcp --path-as-root --project e224b681-108f-40a6-92e7-7921f07efc6d --service 9a4e4cc9-e9fd-4a88-8cf8-0662f2816695 --environment production --detach
```

The following root-directory setting applies to the GitHub monorepo alternative:

| Setting | Value |
| --- | --- |
| Service name | `telemetry-mcp` |
| Source root directory | `/tools/telemetry-mcp` |
| Builder | Dockerfile, using this directory's `Dockerfile` |
| Healthcheck path | `/health` |
| Replicas | 1 |
| Port | Railway's `PORT`, or 8080 |

Generate an HTTPS domain for this service. Set these variables in its Railway
Variables panel:

| Variable | Value |
| --- | --- |
| `TELEMETRY_DATABASE_URL` | `postgresql://telemetry_reader:ENCODED_PASSWORD@PRIVATE_HOST:5432/DATABASE_NAME` |
| `TELEMETRY_MCP_TOKEN` | A new random secret, at least 32 characters; 32 random bytes encoded as hex is suitable |
| `TELEMETRY_MCP_HOST` | Exact generated hostname, without `https://` or a path |

Use Postgres-ApNQ's private host, actual database name and port. URL-encode the
database password when constructing the URL. **Do not use a reference to its
administrator DATABASE_URL unchanged:** that would select the wrong login and
the service will reject it. Keep the database private; only the authenticated
MCP endpoint needs a public HTTPS domain. No game-server environment changes are
required. The MCP token is separate from the game's ADMIN_TOKEN.

The service validates database permissions before listening. `/health` is a
public process-liveness check, not a continuing database or telemetry-writer
health check. A later database outage causes tool errors without exposing secrets.

## 3. Connect Codex on Windows

Set a Windows **user environment variable** named `MMO_TELEMETRY_MCP_TOKEN` to the
same token. Use Windows' Environment Variables editor so the value need not be
placed in shell history. Fully exit and reopen Codex so it inherits the variable.

Merge this section into `C:\Users\osaif\.codex\config.toml`, preserving other settings:

```toml
[mcp_servers.mmo_telemetry]
url = "https://YOUR-SERVICE-DOMAIN/mcp"
bearer_token_env_var = "MMO_TELEMETRY_MCP_TOKEN"
```

The spelling is `mcp_servers`. This package uses bearer-token authentication,
not an OAuth login flow. No OpenAI API key is needed by the telemetry service.
After restarting, ask Codex to list telemetry tools and check the most recent
24-hour data coverage. The connection is established only after a successful
authenticated tool call against production.

## Available tools and limits

- `telemetry_coverage`: event counts and first/last timestamps by version and
  event kind in a supplied window. Up to 500 groups; reports truncation.
- `telemetry_events`: detailed gameplay events, including builds and outcomes.
  Up to 200 events per page with a `(ts, id)` continuation cursor.
- `telemetry_daily`: stored additive daily metrics, up to 500 rows per page.
  UTC midnight boundaries are required. Counts are returned as decimal strings
  to avoid bigint precision loss; values are metric-specific sums.

All tools require `from` inclusive and `to` exclusive UTC ISO timestamps. Human
cohort is the default; test data requires an explicit selection. Optional
version, class, tier and node filters apply to all tools. Detailed events also
accept kind/character filters; daily rows accept a metric filter.

For pagination, preserve every filter and time bound. Detailed events order by
timestamp then stable ID (not per-session sequence); use the recorded sequence
for causal ordering within a session. Late telemetry inserts can require a fresh
export. Daily offset pagination is not a transactionally frozen export; prefer
closed days and avoid interpreting a changing live total as a fixed study.

Max windows are 90 days for detail and 365 days for daily data. There is no
arbitrary SQL tool, admin action, write tool or identity-mapping lookup. Each
query runs in a read-only transaction with a five-second statement timeout.
The pool has two connections, HTTP requests are limited to eight concurrent
authenticated requests, and response payloads are capped at 2 MB. Narrow the
window or page size if a query times out or exceeds that cap.

Study interpretation remains governed by [gameplay telemetry semantics](gameplay-telemetry-current-state.md).
Stored coverage does not prove writer completeness or report its in-memory
queue/drop counters. Pseudonymous characters are not unique people. Do not pool
versions or test/human cohorts for balance conclusions.

## Local validation

From the repository root:

```powershell
pnpm --dir tools/telemetry-mcp --ignore-workspace install --frozen-lockfile
pnpm --dir tools/telemetry-mcp test
docker build -t mmo-telemetry-mcp:local tools/telemetry-mcp
```

The test uses Docker's `postgres:16-alpine` image and a fresh disposable container
with a random name, loopback-only ephemeral port, random credentials, and the
actual gameplay migration. It does not use production credentials. It verifies
database grants, authentication, MCP handshake/discovery/tool calls, pagination,
filter isolation, SQL-injection handling, input bounds, and sanitized errors;
the container is stopped and removed on completion.

To repeat the read-only production connectivity check from PowerShell without
printing the token or event payloads:

```powershell
$env:MMO_TELEMETRY_MCP_TOKEN = [Environment]::GetEnvironmentVariable('MMO_TELEMETRY_MCP_TOKEN', 'User')
node tools/telemetry-mcp/check-live.mjs
```

References: [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x),
[Railway private networking](https://docs.railway.com/guides/private-networking).
