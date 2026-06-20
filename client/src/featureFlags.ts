/**
 * The Conduit (summoner) class is feature-incomplete and hidden from players in
 * production playtests: its class orb shows as unavailable. It stays selectable
 * in a Vite dev server (`import.meta.env.DEV`), or in a production build baked
 * with `VITE_ENABLE_CONDUIT=true`. Mirror of the server's `CONDUIT_ENABLED`
 * (server/src/env.ts) so both sides agree per environment.
 */
export const CONDUIT_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_CONDUIT === 'true';
