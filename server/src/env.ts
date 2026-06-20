// Dev tooling (test room, dev items, boot invariant checks) is on whenever the
// server isn't running in production. The `DEV_TOOLS=true` escape hatch forces
// it on regardless of NODE_ENV — used by the dev Docker run, whose `start`
// script boots with NODE_ENV=production but still wants the test room available.
export const IS_DEV =
  process.env.DEV_TOOLS === 'true' || process.env.NODE_ENV !== 'production';

// The Conduit (summoner) class is feature-incomplete and hidden from players in
// production playtests. It stays available in dev; `CONDUIT_ENABLED=true`
// force-enables it in production once it is ready, without a code change. The
// client mirrors this flag in `client/src/featureFlags.ts`.
export const CONDUIT_ENABLED =
  process.env.CONDUIT_ENABLED === 'true' || IS_DEV;
