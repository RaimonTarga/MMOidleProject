> ARCHIVED — implemented; live state in `docs/auth-and-characters-current-state.md`.
> The shipped link flow uses authenticated `POST /auth/discord/link/start` instead of
> placing a session token in a GET query string.

# Guest Mode — Implementation Plan

Status: PLANNED 2026-08-04 (playtester feedback). Decisions settled with the user; not implemented.
Builds on the shipped auth/roster system — read `docs/auth-and-characters-current-state.md` first.
Lifecycle: implement → fold into that current-state doc → archive this file.

## Settled decisions (user)

| Decision | Choice |
| --- | --- |
| Guest mode | **Yes** — one-click play without Discord. *(Revises the shipped "Discord only" decision on playtester feedback.)* |
| Identity shape | Guest = **real account on the same session-token rail** (`discord_id IS NULL`), NOT a revival of the old localStorage-`accountId` handshake. The fork exists only at the auth endpoints; sockets, lobby, characters, kick logic stay single-path |
| Upgrade path | **Link Discord** button stamps `discord_id` onto the guest account; characters ride along |
| Link clash | Discord ID already owns another account → **merge**: guest's characters re-pointed to the existing account, guest row retired. Conflict-free by construction (isolated characters, unlimited slots) |
| First run | **Instant drop-in** — "Play now" mints the account, auto-creates a generated-name character, lands straight in the clearing. One click. Scoped exception to always-show-select; the select screen appears from the second session on |

## Server (~0.5 session)

1. **`POST /auth/guest`** (beside the OAuth routes in `server/src/auth/`): create an
   account row (`discord_id = null`, generated display name e.g. `Guest-xxxx`), mint a
   session via the existing `sessionRepo`, return the token (JSON — no redirect dance
   needed; the client calls it with `fetch`).
   - **Guest sessions never expire.** The token is the account's only credential; a
     30-day expiry would silently orphan progress. Nullable `expires_at` (or equivalent)
     in `sessionRepo`, and make sure the sliding-touch path doesn't reimpose an expiry.
   - Light per-IP rate limit (~5/hour, in-memory) — this is unauthenticated account creation.
2. **Guest visibility in the lobby**: extend the `account:characters` payload (shared
   protocol first) with an account summary `{ displayName, isGuest }` so the client can
   render the guest badge and Link nudge. `isGuest` ≡ `discord_id IS NULL` — no new column.
3. **Link flow** (`server/src/auth/discordOAuth.ts`):
   - `GET /auth/discord/link?session=<token>`: validate the token, store
     `{ mode: 'link', accountId }` on the state nonce, redirect to Discord authorize.
   - Callback with a link nonce, Discord ID **unclaimed** → stamp `discord_id` +
     Discord display name onto the guest account. Existing sessions remain valid
     (same account). Redirect back with a success flag.
   - Callback with a link nonce, Discord ID **already owned** → merge:
     save-and-kick any live socket of *both* accounts first (existing duplicate-session
     machinery, per account), then `UPDATE characters SET account_id = <target>`,
     retire the guest account row, invalidate its sessions, mint a fresh session for the
     target account and redirect with it in the `#session=` fragment.
   - Already linked / self-link → no-op redirect.

## Client (~0.5–1 session)

4. Auth gate: **"Play now"** as the primary button, "Sign in with Discord" secondary.
   Play now → `fetch POST /auth/guest` → store token (`mmo_session_token`, same slot) → connect.
5. **First-run orchestration** (client-side, zero new lobby protocol): guest connects,
   `account:characters` arrives empty → auto-send `character:create` with a generated
   name → on success auto-send `character:select` → world. Shared `generateGuestName()`
   helper whose output always passes `validateCharacterName` (unit-test that). From the
   second session on, the normal select screen shows.
6. **Honest guest badge**: persistent, subtle — "Guest — progress lives in this
   browser. Link Discord to keep it." Link Discord button in Settings and on the select
   screen (navigates to `/auth/discord/link?session=…`). Success/merge outcome surfaces
   as a toast after the redirect lands.

## Ops / docs (~0.25 session)

7. Admin: guests group under their `Guest-xxxx` display name already; add an `isGuest`
   badge if cheap. **No automated pruning** of abandoned guest rows in v1 — deleting a
   guest account destroys real progress; leave a conservative manual ops note
   (never-linked + zero characters + stale `last_login_at`).
8. Update `docs/auth-and-characters-current-state.md` on ship. No new env vars.
   `AUTH_DEV_BYPASS` is largely obviated by guest mode (offline dev = guest) — flag for
   retirement as a separate cleanup, don't bundle it here.

## Testing

- Unit (CI-safe): `generateGuestName()` × `validateCharacterName`; link-decision logic
  (stamp vs merge vs no-op) extracted pure if cheap.
- Manual QA: one click → in world as a named character → refresh lands on select with
  that character → link with an unclaimed Discord (account upgraded, token still valid)
  → merge with a claimed Discord holding its own characters (rosters union on the
  target account, fresh token, both old sockets kicked) → link while in-world →
  guest token survives browser restart → same guest token on a second device kicks the
  first → `/auth/guest` rate limit trips.

## Risks

1. **Merge ordering**: live characters of either account must be saved (and their
   sockets kicked) *before* the `characters` re-point, or an autosave keyed to the old
   account's row could race the merge.
2. **Guest token loss = progress loss** — by design; the badge sets the expectation.
   Don't add recovery machinery; linking Discord *is* the recovery story.
3. **Expiry divergence**: one session table now holds expiring (Discord) and
   non-expiring (guest) rows — boot-time pruning must respect that.
4. LAN phones can now play without Discord reachability (nice side effect), but
   *linking* from a LAN device still requires a registered redirect URI — linking later
   from desktop is the answer, not more URIs.

## Out of scope

- Claiming pre-rework anonymous accounts (fresh-start decision stands — guest mode is
  new accounts, not resurrection).
- Automated guest pruning, guest-to-guest device transfer, any second link provider.
