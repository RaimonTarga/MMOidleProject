# Character Select & Discord Login — Implementation Plan

Status: COMPLETE AND ARCHIVED 2026-08-04. Phases 1–5 implemented. The optional
spectator landing page was extracted to `docs/archive/spectator-landing-plan.md`.
Lifecycle: implement → fold anything still true into a current-state doc → archive this file.

Implementation note: migration numbering advanced while this plan was being written,
so the character-select foundation is migration `0004`, not `0003`. The old
single-character auto-enter path and trusted anonymous client handshake are now
removed. Session and explicit dev-bypass sockets remain in the lobby until
`character:select`; all saves are keyed by character id.

## Settled decisions (user)

| Decision | Choice |
| --- | --- |
| Auth | **Real login, Discord OAuth only** (no password path; `accounts.discord_id` finally gets used) |
| Character slots | **Unlimited** per account |
| Shared account state | **None** — characters fully isolated (own essences, items, recipes, biome XP) |
| Concurrency | **One character in-world per account** (extends the existing duplicate-session kick) |
| Old anonymous accounts | **Fresh start** — no claim/migration flow; playtest DB reset on ship is fine |
| Creation | **Name only** — class stays the in-game T1 skill-tree choice; classless tier-0 start unchanged |
| Select flow | **Always show the select screen** after login; entering the world is always an explicit click |
| Landing spectate | **Yes** — pre-login landing page shows a live view of a random player's gameplay (Phase 6) |
| Spectate fallback | **Clearing-cam** — nobody online → camera on the thawed T0 clearing (the node new characters spawn into), mobs wandering. No canned video, no bots |

## Calls made by this plan (flag if wrong)

- **Deletion**: allowed, **soft delete** (`deleted_at` column, admin-recoverable), type-the-name confirm. Unlimited slots make deletion mandatory hygiene.
- **Names**: per-character, **not** unique server-wide, validated 2–24 chars. Account `display_name` becomes the Discord name (social/admin only).
- **Session tokens**: opaque random token, SHA-256 hash stored server-side, ~30-day expiry, kept in localStorage and presented in the Socket.IO handshake `auth.token`. Not cookies — the existing `cors({ origin: true })` stance (index.ts:88 comment) stays valid.
- **Switch character (v1)**: menu button → `location.reload()`. Token persists → lands on the select screen (which is the chosen UX anyway); the disconnect handler already saves. No Phaser scene teardown risk. Seamless in-client switch is out of scope.
- **Select screen (v1)**: styled per the UI style spec (Cinzel titles, gradient-conduit accents) but with static class-root icons — no animated sprite showcase.

## Current seam (what gets replaced)

- Identity: localStorage UUID + `window.prompt` name (`client/src/clientAuth.ts`), sent as `handshake.auth = { accountId, displayName }`.
- `server/src/index.ts:510-608` — the connection handler does *everything* inline: `findOrCreateAccount` → duplicate-session kick → `getOrCreateCharacter` → thaw → `attachPlayerEntity(player, socket.id)` → recalc → analytics → `state:sync` → `registerPlayerHandlers`.
- One character per account is **implicit**: `getOrCreateCharacter` takes `.limit(1)` and `saveCharacter` updates `WHERE account_id = …` (`server/src/db/playerRepo.ts:86-137`). The `characters` table already has its own `id` PK + `account_id` FK — the schema is ready, the code is not.
- Runtime entity id is `socket.id` (broadcast loop uses `player.isPlayer.id` to find the socket); the character row id only exists at load/save time.
- Client: `sceneSetup.ts:443` connects the socket during Phaser scene boot; there is no menu/lobby of any kind.

## Target flow

```
page load
  └─ no session token → spectator socket connects ({ spectate: true }, no auth)
       → landing split view: pitch/login panel + live canvas
         (random player's node, or clearing-cam when nobody's online)
       → GET /auth/discord/login
       → Discord → GET /auth/discord/callback → upsert account by discord_id,
         mint session → redirect CLIENT_URL/#session=<token> → client stores token, strips fragment
  └─ token → Phaser boots + socket connects with { token }
       → server validates → duplicate-session kick → emit account:characters   (LOBBY, no entity)
       → Character Select screen (list / create / delete)
       → character:select { characterId }
       → server: loadCharacter → thaw → attach → recalc → state:sync           (IN WORLD)
```

Every in-world intent handler already no-ops when `getPlayerEntity(socket.id)` is undefined, so the lobby phase is safe against early intents by construction.

## Phase 1 — DB + repo multi-character rework (~1 session)

The critical correctness change; must land before any account can own two rows.

1. Migration `0004`:
   - `sessions` table: `token_hash` text PK, `account_id` FK, `created_at`, `expires_at`, `last_seen_at` (bigints).
   - `characters`: add `deleted_at` bigint (nullable), `last_played_at` bigint default 0.
   - `accounts`: unique index on `discord_id` (Postgres nullable-unique is fine for legacy rows).
   - Character name stays inside the `isPlayer` JSON slice (no new column); listing parses slices exactly as `listCharacters` already does.
2. `playerRepo.ts` rework:
   - **Re-key `saveCharacter` by character id, not account id.** Today's `WHERE account_id` would overwrite every character an account owns with the active one's state.
   - Replace `getOrCreateCharacter` with: `listAccountCharacters(db, accountId)` (excludes deleted, ordered by `last_played_at` desc, returns summary DTOs), `createCharacter(db, accountId, name)`, `loadCharacter(db, accountId, characterId)` (ownership + not-deleted check), `softDeleteCharacter(db, accountId, characterId)`.
   - `loadCharacter` forcibly sets `isPlayer.id` = row id before returning (runtime re-keys it to socket.id on attach, and that leaks back into saved JSON today — the row PK is authoritative, so normalize on load).
   - Touch `last_played_at` on select and save.
3. Shared additions (`shared/src/protocol/characters.ts`):
   - `CharacterSummary` DTO: `{ id, name, level, playerTier, combatArchetype, selectedClass, nodeId, lastPlayedAt }`.
   - Pure `validateCharacterName(name): { ok: true; name: string } | { ok: false; reason: string }` (trim/collapse whitespace, 2–24 chars, letters/digits/space/'/-). Pure + shared so client forms and server validation use one rule, and it's CI-testable without a DB.
   - Pure `buildCharacterSummary(slices, row)` helper next to it, same reason.

## Phase 2 — Discord OAuth + sessions (~1–2 sessions)

1. **User task first**: create a Discord application; register redirect URIs for `http://localhost:4000/auth/discord/callback`, the LAN-IP variant used for phone playtests, and the Railway URL. Env vars: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `CLIENT_URL`.
2. New `server/src/auth/` module, routes mounted on the existing Express app (index.ts:87):
   - `GET /auth/discord/login` → 302 to Discord authorize (scope `identify` only) with a random `state` nonce (short-lived in-memory map).
   - `GET /auth/discord/callback` → verify state, exchange code, fetch `/users/@me`, upsert account by `discord_id` (new accounts: `id = randomUUID()`, `display_name = global_name ?? username`, refreshed every login), mint session (random 32 bytes; store SHA-256 hash; 30-day expiry), redirect to `CLIENT_URL/#session=<token>`.
   - `POST /auth/logout` → delete the session row.
   - `validateSessionToken(db, token): accountId | null`, with a throttled `last_seen_at` touch; prune expired sessions at boot (next to log retention).
3. Socket auth middleware (`io.use`): `auth.token` → validate → `socket.data.accountId`; reject with `connect_error` reason `unauthorized` otherwise. The handshake no longer trusts client-supplied `accountId`/`displayName` — delete that path.
4. **Dev bypass**: `AUTH_DEV_BYPASS=1` (refused when `NODE_ENV === "production"`, same pattern as debug events) accepts `auth.devAccountId` so offline dev and LAN sessions without Discord reachability still work.
5. `findOrCreateAccount` shrinks to `touchAccountLogin(db, accountId)` preserving the `previousLoginAt` contract the release-announcement gate uses (index.ts:585-591). Account creation now only happens in the OAuth callback.
6. Fresh start: no data migration; ship with `pnpm db:reset` (or let orphaned anonymous rows rot — they're unreachable).

## Phase 3 — Socket lobby protocol (~1 session)

1. Protocol (`shared/src/protocol/socketEvents.ts` — shared first, per the axiom):
   - S2C: `account:characters (payload: { characters: CharacterSummary[] })` — sent on connect and re-sent after create/delete; `character:createResult { success, characterId?, reason? }`; `character:deleteResult { success, reason? }`; `character:selectResult { success, reason? }` (success is implied by the `state:sync` that follows; the event exists for failure paths).
   - C2S: `character:create { name }`, `character:select { characterId }`, `character:delete { characterId }`.
   - No `character:logout` in v1 — switch is a page reload, and disconnect already saves.
2. Rework the connection handler (index.ts:510-608):
   - Keep at connect: account touch, duplicate-session kick (account-level — a second tab kicks the old socket **even if either side is only in the lobby**), announcement emit.
   - Replace the two socket maps' semantics with one per-socket session record `{ accountId, characterId: null | string }` (keep an accountId→socketId index for the kick). `accountIdForSocket`, autosave, analytics, world-log viewer lookups all read this record.
   - Everything from `getOrCreateCharacter` through `state:sync` (lines 541-595) moves into the `character:select` handler: guard (no entity already attached; id owned + not deleted), `loadCharacter`, thaw + `node:preparing`, attach, recalc, full-HP, analytics `session-start`/`node-enter` (add `characterId` to meta — meta is JSON, no logdb migration), `state:sync`, bossFelled/telemetry emits, `last_played_at` touch.
   - `character:create`: shared name validation → `createCharacter` → result + re-emit list. No auto-select; the client clicks Enter.
   - `character:delete`: refuse while that character is attached (must be in lobby), soft delete, result + re-emit list.
   - Disconnect handler + 30s autosave loop: save by **character id** from the session record; skip sockets idling in the lobby.
   - `registerPlayerHandlers` still registers immediately after connect (handlers already no-op without an entity); pass the session record through `PlayerHandlerDeps` instead of bare `accId`.
   - `debug:renameCharacter` keeps working unchanged (renames the attached character's `isPlayer.name`).

## Phase 4 — Client (~2 sessions)

1. `client/src/net/session.ts` replaces `clientAuth.ts`: on boot read `#session=` fragment → store `mmo_session_token` in localStorage → strip fragment via `history.replaceState`; expose `getSessionToken()`, `loginWithDiscord()` (navigate to `SERVER_URL/auth/discord/login`), `clearSession()`. Delete the `window.prompt` name flow and `mmo_account_id`.
2. New full-screen React overlay root in `main.ts` (sibling of `death-overlay` etc.): `AuthGate` with phases `login → select → entering → in-world`, state in Jotai atoms fed through the existing `wireSocketHandlers`/hudBus path:
   - **Login screen**: title + "Sign in with Discord". Shown when no token, or on `connect_error: unauthorized` (clear token first).
   - **Character select**: scrollable card list (name, class-root icon or "Classless", level/tier, biome name from `nodeId`, relative last-played), Enter World per card, create form (shared `validateCharacterName` for instant feedback; server remains authoritative), delete with type-the-name confirm. Newest-played first. Styled on the UI style spec.
   - Overlay dismisses on first `state:sync`.
3. `sceneSetup.ts:443`: connect with `{ token: getSessionToken() }`. Phaser boots behind the overlay and idles until `state:sync` — audit that nothing in the scene or HUD assumes sync-arrives-promptly-after-connect (NodeLoadingOverlay, TabResyncOverlay timers).
4. "Switch Character" button in the menu/settings sheet → `location.reload()`.
5. `session:kicked` overlay: unchanged.

## Phase 5 — Admin/ops + docs (~0.5 session)

- `listCharacters`: exclude (or badge) soft-deleted rows; Characters tab now naturally shows multiple rows per account grouped by Discord display name.
- Player summaries / world-log viewer entries: carry `characterId` alongside the account id where cheap.
- Docs: update CLAUDE.md's socket-surface list + runtime env vars; deployment doc gains the Discord env vars. **Explicit note: this auth does NOT protect `/admin`** — admin auth remains its own TODO.
- Archive this plan per the docs lifecycle.

## Phase 6 — Landing-page spectator view (~1–1.5 sessions)

Pre-login landing page shows real gameplay: a live stream of a random player's node,
rendered by the normal game client in a read-only mode. Cheap because both halves
already exist: the server caches one snapshot per occupied node per tick
(`nodeSnaps`, index.ts broadcast loop), and the client already renders *other*
players purely from deltas — a spectator socket matches no entity, so everything
takes the existing remote-render path, combat FX included (`world.pushEvent`
events ride in the snapshot).

Server:

1. **Handshake**: amend the Phase 2 auth middleware — `auth.spectate === true` is
   admitted without a token and flagged `socket.data.spectator`. Spectator sockets
   never attach an entity; in-world intents already no-op without one, and the
   `character:*` handlers must additionally refuse spectator sockets.
2. **Slim snapshot**: the shared node snapshot broadcasts `tracksProgression`,
   `holdsInventory`, `usesSkills` for every player — full inventory/essences/quest
   progress. Node-mates seeing that is fine; anonymous internet visitors is not.
   Add `SPECTATOR_PLAYER_KEYS` (and reuse monster/minion keys as-is) in
   `shared/src/protocol/networkedEntity.ts`: position, hitbox, motion, attack
   target, health, attack, status, emote, channeling, dead, party — plus whatever
   the render layer actually reads to pick the player body (likely
   `usesSkills.selectedClass` + `tracksProgression.playerTier`; verify, and send a
   trimmed projection of just those fields rather than the whole slices).
   Build the slim variant once per *watched* node per tick, only while spectators
   are connected.
3. **Spectator manager** (small module beside the broadcast loop):
   - Pick a random eligible target: live, connected, tab active (not in
     `inactiveSockets`); prefer one in combat if easy. Re-pick on target
     disconnect/death/idle. Follow across node transitions (emit a resync-shaped
     slim snapshot on node change, same as a real player's transition).
   - **Clearing-cam fallback**: no eligible target → stream the clearing node with
     no followed player. This is a *scoped exception* to "spectators never thaw
     nodes": while ≥1 spectator is connected and fallback is active, keep the
     clearing thawed and ticking so monsters exist and wander. One node, only
     while watched. (Deliberate continuity: `CLEARING_NODE_ID` is where fresh
     characters spawn — the landing view is the exact place a new player enters
     after login.)
   - Emit `spectate:status { mode: 'player' | 'clearing', targetName?, nodeId }`
     on subscribe and on every retarget/node change — this is the UI's labeling
     and camera-drive hook.
4. **Guardrails**: concurrent spectator cap (~16), per-IP cap (~2), idle timeout
   (pause the stream after ~10 min until a click), all before this ships — these
   are unauthenticated sockets.

Client:

5. Boot with no token → connect as spectator instead of not connecting. Landing
   layout: split view — pitch/login panel + live canvas. GameScene spectator mode:
   inputs disabled, HUD roots stay hidden (AuthGate covers them), camera follows
   the target entity from `spectate:status`, or rests on the node center
   (`NODE_WIDTH/2, NODE_HEIGHT/2`) in clearing mode.
6. Login click → normal OAuth redirect; the spectator socket dies with the page
   navigation. Nice-to-have, not v1: let lobby (post-login) sockets opt into the
   same stream so the world plays behind the character-select cards.
7. **Presentation is an OPEN design item owned by the user**: how the page makes
   "you are watching someone else's live gameplay" unmistakable. The protocol
   deliberately carries the raw ingredients (mode, target name); do not invent
   the visual treatment ad-hoc during implementation — leave a labeled placeholder
   (e.g. plain "LIVE — watching {name}" text) for the user to art-direct.

## Testing

CI has no Postgres, so keep DB code thin and logic pure:

- Unit (shared, CI-safe): `validateCharacterName` cases, `buildCharacterSummary` from constructed slices, `SPECTATOR_PLAYER_KEYS ⊆ NETWORKED_PLAYER_KEYS` invariant.
- World wiring (existing pattern, no DB): attach two players built from separate fresh-slice sets, tick, assert independent state + clean detach of one leaves the other untouched. For Phase 6: build a slim spectator snapshot from a constructed `World` and assert `holdsInventory` / full `tracksProgression` / full `usesSkills` never appear in it.
- Manual QA script: fresh browser → login → empty list → create → enter → play → refresh lands on select with updated card → create second → enter → switch back → duplicate tab kicks the first → delete with confirm → `AUTH_DEV_BYPASS` boot with Discord unreachable → phone on LAN through the full OAuth loop.
- Phase 6 manual QA: landing with a player online (follows them, survives their node transition, retargets on their logout) → landing with empty world (clearing thawed, mobs wandering, world re-freezes after the last spectator leaves) → spectator caps + idle timeout.

## Risks / verify during implementation

1. **`saveCharacter` re-key is load-bearing** — Phase 1 must ship atomically with (or before) anything that lets an account own two rows.
2. `attachPlayerEntity` mutates `isPlayer.id` to the socket id, which today gets saved back into the row JSON. The load-time normalization in Phase 1 covers it, but verify no other consumer reads persisted `isPlayer.id`.
3. Discord redirect URIs for **LAN phone playtests**: confirm Discord accepts a `http://192.168.x.x:4000` callback; if not, the dev bypass or a tunnel is the fallback.
4. Token in the URL fragment lands in browser history. Acceptable at playtest tier (fragment never reaches server logs, stripped immediately); a one-time-code exchange endpoint is the upgrade if it ever matters.
5. Release announcement currently emits right after connect — it will now display over the select screen; verify the overlay renders without world state (it should — it's markdown).
6. `character:select` edge timing: double-click double-select, select during a slow thaw, select racing the duplicate-session kick. Guard with the session record (`characterId !== null` → ignore).
7. Benches (`bench:server`, `bench:balance`) construct `World` directly and never touch sockets/auth — should be untouched; confirm.
8. **Clearing-cam lifecycle**: the spectator-driven thaw must release cleanly — when the last spectator disconnects (or a real target appears), the clearing must be allowed to freeze again. Check the freeze logic's occupancy definition accounts for spectator-watched nodes without leaking a permanently-hot node.
9. **Clearing content**: confirm the clearing actually spawns wandering monsters when thawed with no players present. If it's authored as a safe/empty hub, the fallback shows an empty meadow — a content tweak (a few ambient T0 critters), not a plan change.

## Out of scope (deliberate)

- Seamless in-client character switch (needs `character:logout` + Phaser scene reset) — v1 reloads.
- Account-shared wallet/stash, slot caps, parallel idling characters (rejected), guest mode / anonymous claim flow (fresh start chosen), server-wide name uniqueness, character appearance or class choice at creation, admin auth.
- Spectate extras: choosing whom to watch, spectating behind the character-select screen (nice-to-have noted in Phase 6), spectator chat/social anything. The spectate presentation/visual design is deferred to the user, not dropped.
