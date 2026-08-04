# Authentication and Characters — Current State

Last updated: 2026-08-04

## Player flow

The landing page offers one-click guest play as the primary path and Discord OAuth as
the secondary path. `POST /auth/guest` creates a real account with `discord_id = null`
and an opaque non-expiring session. Before creating the account, the landing panel
asks for an optional first-character name; leaving it blank uses the adjective +
soul-synonym generator. The client stores the token as `mmo_session_token`, reloads
out of spectator mode, creates that first character, and selects it immediately.
Later sessions show Character Select normally, including for unlinked guests.

`GET /auth/discord/login` starts the authorization-code flow with the `identify`
scope. The callback upserts the Discord account, creates an opaque 30-day session,
and redirects to `CLIENT_URL/#session=<token>`. Both authentication paths present the
stored token as `handshake.auth.token` on the player Socket.IO connection.

Guests can start linking through authenticated `POST /auth/discord/link/start`; the
session token is sent as a bearer header and never placed in the link URL. An
unclaimed Discord identity upgrades the guest account in place and converts its
permanent sessions to ordinary 30-day sessions. If that Discord identity already
owns an account, live sockets for both accounts are saved and kicked, the guest
characters are moved to the Discord account transactionally, the guest account and
sessions are retired, and the callback returns a fresh target-account session. Link
outcomes are returned in the URL fragment and shown as a toast.

An authenticated socket begins in the lobby and receives `account:characters` with
both the roster and `{ displayName, isGuest }` account metadata.
Creating, selecting, and soft-deleting characters use the shared `character:*`
protocol. The client always shows Character Select after login or reload, and only
dismisses its full-screen gate after the selected character receives `state:sync`.
Settings → Switch Character reloads the page; disconnect saves the active character.
Roster cards show the character's resolved in-world class sprite, Global Mastery,
current biome, and last-played time. The displayed class follows the latest
named identity in the unlocked path (root, frame, range class, then specialization),
while later perk tiers retain the specialization name. Legacy progression level is
not used as a roster stat.

## Identity and persistence

- Accounts are keyed independently from characters and linked to Discord by a unique
  nullable `discord_id`.
- A null `discord_id` denotes a guest account. Guest and Discord players otherwise use
  the same session, socket, roster, character, persistence, and duplicate-login paths.
- Guest session rows have `expires_at = null`; Discord session rows expire after 30
  days. Losing an unlinked guest token loses access to that progress by design.
- Accounts may own unlimited characters. Names are account-local, 2–24 characters,
  and validated by the shared `validateCharacterName` helper.
- Characters are fully isolated: progression, inventory, equipment, recipes, build,
  health, and position are stored per character row.
- Saves and loads are keyed by character ID. `isPlayer.id` is normalized from the row
  ID on load, then temporarily re-keyed to the socket ID while attached to the world.
- Deletes are soft deletes (`deleted_at`) and hidden from player/admin lists.
- Only one socket per account may be connected. A newer lobby or in-world connection
  emits `session:kicked` to the previous socket.

Runtime identity therefore has three distinct values:

| Identity | Lifetime | Use |
|---|---|---|
| Account ID | Stable | authentication, duplicate-session ownership |
| Character ID | Stable | persistence, roster and per-character ops/log filters |
| Socket/entity ID | Connection | live world entity and admin action target |

## Operations

The Characters admin tab excludes soft-deleted rows, groups characters by account
display name, and marks never-linked guest accounts. The Players tab shows account,
character, and socket IDs.
New persisted world-log entries store all three viewer identities, so reconnecting no
longer prevents per-character filtering. Older rows display an unknown/legacy
character ID because it was not recorded before log migration `0003`.

There is no automated guest pruning. Any manual cleanup must be conservative and
limited to never-linked accounts with zero characters and a stale `last_login_at`;
deleting a guest account that owns characters permanently destroys player progress.

## Configuration

Required to offer Discord sign-in/linking (guest play itself needs no new variables):

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | Discord application secret; server-side only |
| `DISCORD_REDIRECT_URI` | Exact registered callback ending in `/auth/discord/callback` |
| `CLIENT_URL` | Player URL that receives the session fragment |

For explicit offline development only, set server `AUTH_DEV_BYPASS=1` and client
`VITE_AUTH_DEV_ACCOUNT_ID` to the same account ID. The bypass is refused when
`NODE_ENV=production`. Guest mode now covers ordinary offline development, so bypass
retirement can be handled as a separate cleanup.

Discord authentication protects player sessions only. It does **not** protect
`/admin` or the `/admin` Socket.IO namespace; admin authentication remains a separate
deployment blocker and those surfaces must stay behind trusted access.

## Primary seams

- OAuth routes: `server/src/auth/discordOAuth.ts`
- Guest creation/rate limiting: `server/src/auth/guestAuth.ts`
- Session storage/validation: `server/src/auth/sessionRepo.ts`
- Socket authentication: `server/src/auth/socketAuth.ts`
- Lobby and world entry: `server/src/index.ts`
- Character persistence: `server/src/db/playerRepo.ts`
- Shared protocol: `shared/src/protocol/characters.ts`, `socketEvents.ts`, `admin.ts`
- Client session/gate: `client/src/net/session.ts`, `client/src/auth/`

Unauthenticated visitors use the isolated live spectator landing flow; see
`docs/spectator-landing-current-state.md`. Spectator sockets never become player
sessions or attach characters.
