# SP5-UI report
**Agent:** Codex   **Branch:** rw/sp5-ui   **Last commit:** 99c61c5a

## Done

- Added `client/src/ui/class/ThresholdsEditor.tsx`, dispatched by `ClassSystemEditor` for Thresholds. The editor renders the vertical storm bottle, Storm budget pips, all owned pieces with family/rank/text and the view's waits-for wording, the relic's name/text/icon, and validator problems unchanged.
- The floor slider previews the line from 0–95%; **Set floor** sends `withFloor`. Each non-floor piece has 30/50/80/100% band choices and an Off choice through `withBand`. Floor calms follow the floor line and have no placement controls. Gather and Hover send `withPhase`. Every edit goes through `hudBus.requestSetClassConfig`; accepted configuration remains server-owned.
- Added `useThresholdsView.ts`, following `useOrderView`, so the editor and HUD read the same composed view and authoritative config.
- Added `client/src/hud/StormGauge.tsx` and its styles. The bottle groups pieces at the same height into scrollable chip rows; nearby labels have separate space while the marks retain their exact positions. The HUD conduit fills from `energyCountAtom / energyMaxAtom`, shows the current/max and floor, and draws floor and band marks, including floor calms. It remains visible at zero. Its accessible description includes the phase, absorption rule and named marks.
- Reused the existing shield location beside HP in desktop `hud/stat/StatPlate.tsx` and mobile `hud/MobileHUD.tsx` for the storm. `ArchetypeMechanics.tsx` suppresses the separate desktop/mobile Energy widget while Thresholds are present. Non-Thresholds Energy and non-Spirit barrier displays keep their existing paths.
- Piece and relic images use the existing `classPieceIconSource` / `trophyIconSource` lookups and fallbacks. No art, shared contracts, server behavior, callouts, routes or cleanup changes.

## Checks

- `pnpm typecheck`: clean, including bench and test projects.
- `pnpm --filter @mmo-idle/client build`: succeeded (`tsc && vite build`; only the existing chunk-size warning).
- `pnpm test -- thresholdsView classScreenView orderView spiritStorm`:

```text
PASS  shared/src/classKits/orderView.test.ts  (2.7s)
PASS  shared/src/classKits/thresholdsView.test.ts  (2.8s)
PASS  shared/src/classKits/classScreenView.test.ts  (2.8s)
PASS  server/test/spiritStorm.test.ts  (32.5s)
4/4 passed in 32s
```

- In-memory React server-render smoke: passed against the worktree's shared source, real Jotai store and actual components. Covered editor dispatch/content, floor calm placement controls, empty storm with visible floor, 160/200 rendered as 80%, removed bands, a moved floor with its calm, no duplicate desktop/mobile Energy display, the HP crown's storm conduit, legacy Energy fallback, and the starter's Storm 4/plain relic. This is static render evidence, not browser or live-play evidence.
- `git diff --check` and staged diff check: clean. Existing files retained LF endings; diff sizes were checked for accidental conversions.

## Not done, or unsure

- Browser and by-eye verification: unverified. No game/client server or bot was started, following AGENT-RULES. Mobile sizing, pointer/keyboard interactions, live config acknowledgements and combat animation remain unverified in a browser.
- Optional character crackle thinning was skipped. This task changes no aura/FX behavior and adds no spend callouts.
- No design or shared-data blocker was found.

## Files outside the brief I needed (not edited)

- None. Desktop and mobile HP renderers were edited only to reuse their shield display for the storm, as SP5-UI requests.
