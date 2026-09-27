# Authentication and Characters — Current State

**Audited:** 2026-09-27
**Authority:** server/src/auth/, server/src/index.ts,
server/src/db/playerRepo.ts, shared/src/protocol/characters.ts, and
client/src/auth/ plus client/src/net/session.ts.

## Player authentication flow

The landing page offers guest play and Discord OAuth.

- POST /auth/guest creates a real account with discord_id = null and a
  persistent-until-linked session. The first guest run can choose a character
  name; an omitted name uses the shared generated-name helper.
- GET /auth/discord/login starts the identify-scope OAuth flow. The callback
  upserts the Discord account, creates a 30-day session, and returns the
  session token in the client URL fragment.
- A guest can start linking from authenticated
  POST /auth/discord/link/start. The bearer session token stays in the request
  header rather than the link URL. Linking an unclaimed Discord identity keeps
  the guest account and characters and converts its sessions to the normal
  30-day lifetime. Linking to an existing Discord account moves the guest
  characters transactionally, retires the guest account/sessions, and returns a
  fresh session for the target account.
- Both player paths send the token as handshake.auth.token to the player
  Socket.IO namespace. Socket authentication is separate from admin
  authentication.

The client consumes a Discord session fragment, stores the credential under
mmo_session_token, and clears the fragment. Guest first-run state is held in
session storage so an existing guest can reload into the normal roster flow.
Unauthenticated visitors use the isolated spectator landing flow; spectator
connections never become player sessions or attach a character.

## Accounts, characters, and runtime identity

Accounts and characters are separate records:

- account identity owns authentication, Discord linking, and duplicate-login
  policy;
- character identity owns progression, inventory, equipment, build, health,
  position, and logs;
- socket/entity identity is the live connection target used by the world and
  admin actions.

An account may own multiple characters. Character names are account-local,
validated by validateCharacterName, and limited to 2–24 characters. Deletes are
soft deletes using deleted_at. Loading normalizes the persisted player ID to
the character row ID; while attached to a live socket, the ECS entity is
temporarily keyed for runtime routing.

Only one live socket per account is allowed. A newer lobby or in-world
connection saves and kicks the older socket. Disconnect and duplicate-session
paths save the active character.

## Character select and presentation

After authentication or reload, the client remains behind Character Select
until the selected character receives state:sync. Creating, selecting, and
soft-deleting characters use the shared character protocol. The roster shows
account metadata, guest status, resolved class identity, Global Mastery,
current biome, and last-played time.

The displayed class identity follows the latest named path selection (root,
frame, range, and specialization). Legacy progression level is not used as a
roster class label.

## Admin boundary

Admin access is implemented and is deliberately separate from player auth.

- The /admin HTTP surface and /admin Socket.IO namespace validate a token
  through server/src/admin/auth.ts.
- In production, ADMIN_TOKEN must exist, be at least 32 characters, and match
  the presented token using a timing-safe hash comparison. Missing or invalid
  production credentials are rejected.
- Non-production may allow the local admin surface without a configured token,
  but setting ADMIN_TOKEN is still recommended for shared development.
- ADMIN_TOKEN must remain server-side. It must never be exposed through a
  VITE_* variable or committed.

Player Discord authentication therefore does not grant admin access, and admin
authentication does not grant a player session.

## Persistence and cleanup

Guest session rows use expires_at = null. Discord session rows expire after
30 days. Losing an unlinked guest token loses access to that account by design.
There is no automated guest pruning. Any manual cleanup must be limited to
never-linked accounts with no characters and a deliberately stale
last_login_at; deleting an account with characters destroys player progress.

World-log rows preserve account, character, and socket/entity context where
available. Older rows may have an unknown character ID because that field was
added by the later log migration.

## Configuration

The committed .env.example is the variable checklist:

| Variable | Purpose |
| --- | --- |
| DISCORD_CLIENT_ID | Discord application client ID |
| DISCORD_CLIENT_SECRET | Server-side Discord application secret |
| DISCORD_REDIRECT_URI | Registered callback ending in /auth/discord/callback |
| CLIENT_URL | URL receiving the OAuth session fragment |
| AUTH_DEV_BYPASS | Explicit non-production identity bypass |
| VITE_AUTH_DEV_ACCOUNT_ID | Client half of the explicit dev bypass |
| ADMIN_TOKEN | Server-side admin credential; required in production |

Guest play needs no Discord configuration. AUTH_DEV_BYPASS is refused when
NODE_ENV=production. DEV_TOOLS/production spectator behavior is controlled by
the server environment and is not a production authentication path.

## Primary seams

- OAuth and link routes: server/src/auth/discordOAuth.ts
- Guest creation and rate limiting: server/src/auth/guestAuth.ts
- Session storage/validation: server/src/auth/sessionRepo.ts
- Player socket authentication: server/src/auth/socketAuth.ts
- Admin authentication/namespace:
  server/src/admin/auth.ts and server/src/admin/namespace.ts
- Lobby, character operations, and world entry: server/src/index.ts
- Character persistence: server/src/db/playerRepo.ts
- Shared character protocol: shared/src/protocol/characters.ts and
  shared/src/protocol/socketEvents.ts
- Client session and gate: client/src/net/session.ts and client/src/auth/
