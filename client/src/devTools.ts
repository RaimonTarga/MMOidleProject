/**
 * Whether in-client dev tooling is shown: the test-room button, the dev loadout
 * button, the map shift-click teleport, and client-side dev item registration.
 *
 * True in a Vite dev server (`import.meta.env.DEV`), or in a production build
 * baked with `VITE_DEV_TOOLS=true` — e.g. the `pnpm docker:up:dev` image, which
 * is a production build but wants the test room available for debugging. Keep
 * this separate from `import.meta.env.DEV` so genuinely dev-only wiring (like the
 * localhost socket URL) is not affected.
 */
export const DEV_TOOLS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true';
