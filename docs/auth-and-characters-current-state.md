# Authentication and Characters — Current State

Last updated: 2026-08-04

## Player flow

The player client uses Discord OAuth only. `GET /auth/discord/login` starts the
authorization-code flow with the `identify` scope. The callback upserts the Discord
account, creates an opaque 30-day session, and redirects to
`CLIENT_URL/#session=<token>`. The client stores that token as
`mmo_session_token`, removes the fragment from browser history, and presents it as
`handshake.auth.token` on the player Socket.IO connection.

An authenticated socket begins in the lobby and receives `account:characters`.
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

The Characters admin tab excludes soft-deleted rows and groups characters by Discord
account display name. The Players tab shows account, character, and socket IDs.
New persisted world-log entries store all three viewer identities, so reconnecting no
longer prevents per-character filtering. Older rows display an unknown/legacy
character ID because it was not recorded before log migration `0003`.

## Configuration

Required outside local bypass development:

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | Discord application secret; server-side only |
| `DISCORD_REDIRECT_URI` | Exact registered callback ending in `/auth/discord/callback` |
| `CLIENT_URL` | Player URL that receives the session fragment |

For explicit offline development only, set server `AUTH_DEV_BYPASS=1` and client
`VITE_AUTH_DEV_ACCOUNT_ID` to the same account ID. The bypass is refused when
`NODE_ENV=production`.

Discord authentication protects player sessions only. It does **not** protect
`/admin` or the `/admin` Socket.IO namespace; admin authentication remains a separate
deployment blocker and those surfaces must stay behind trusted access.

## Primary seams

- OAuth routes: `server/src/auth/discordOAuth.ts`
- Session storage/validation: `server/src/auth/sessionRepo.ts`
- Socket authentication: `server/src/auth/socketAuth.ts`
- Lobby and world entry: `server/src/index.ts`
- Character persistence: `server/src/db/playerRepo.ts`
- Shared protocol: `shared/src/protocol/characters.ts`, `socketEvents.ts`, `admin.ts`
- Client session/gate: `client/src/net/session.ts`, `client/src/auth/`

Unauthenticated visitors use the isolated live spectator landing flow; see
`docs/spectator-landing-current-state.md`. Spectator sockets never become player
sessions or attach characters.
