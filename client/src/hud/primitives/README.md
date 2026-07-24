# Desktop HUD primitives

These components provide presentation structure only. They do not own panel
content, gameplay state, intent dispatch, placement, or visibility policy.

- `HudPanel` is the opaque rail/panel material shell.
- `DisclosureHeader` owns the accessible title, summary, chevron, and expanded
  state layout.
- `HudDock` is a lightweight grouping surface; its caller owns anchoring.
- `GameDialog` owns portal/backdrop behavior, size variants, modal semantics,
  Escape, focus trapping, and focus return. Primary-dialog exclusivity remains
  a presentation-state policy in `input/overlayStack.ts`.
- `DialogHeader` provides the labelled title, optional icon/actions, and close
  control inside a `GameDialog`.
- `DialogTabs` / `DialogTab` provide compact icon-capable tabs with roving
  arrow-key focus.

Desktop visual rules require both `.desktop-hud` and the `min-width: 1101px`
media query. Shared components rendered inside `MobileHUD` therefore keep their
existing styles until the mobile adaptation phase.

Dialogs portal to `document.body`, outside `.desktop-hud`, so their desktop
presentation is breakpoint-scoped in `dialogs.css`. Mobile-compatible shell
styles preserve the existing full-overlay behavior until Phase 12.

Desktop rail text is content-sized: labels and values wrap and may increase a
panel's height. Truncation is reserved for deliberately fixed combat telemetry,
such as ability slots, where a tooltip preserves the full label.

Token families live in `tokens.css`:

- `--hud-material-*` describes surface depth and function, not player tier.
- `--hud-edge-*` forms raised, inset, and engraved boundaries.
- `--hud-space-*` is the compact HUD spacing scale.
- `--hud-focus-*` is the shared keyboard-focus treatment.
- `--hud-motion-*` controls short state transitions and readiness feedback, and
  collapses under reduced-motion preferences.
- `--hud-unlock-*` controls the duration, channel-flare opacity, and lift of
  authoritative system-reveal wakes without changing component geometry.

Phase 9 projects zero-indexed gameplay progression to `data-ui-tier="1"` through
`data-ui-tier="8"` on `document.documentElement`. The projection lives in
`hud/uiTier.ts`, outside any individual React root. Desktop token sets vary five
independent axes without changing component geometry:

- material depth (`--hud-material-*`) and engraved edges (`--hud-edge-*`);
- frame complexity and ornament density (`--hud-frame-*`,
  `--hud-ornament-opacity`);
- dormant and active apparatus energy (`--hud-energy-*`);
- accent strength (`--hud-primary-*`, `--hud-accent-shadow`);
- motion intensity (`--hud-motion-*`), still overridden by reduced motion.

Following visual-direction feedback, Phase 9 also establishes a progressive
apparatus axis in `tierApparatus.css`: frame cuts, secondary engraved frames,
rune traces, conduit density/speed, and tier-up ignition duration. T1 keeps its
channels dormant; later tiers progressively reveal and energize them. These are
paint-only layers and clipped corners, so the layout and input contracts remain
stable.

`installUiTierSync()` fires the ignition only for an authoritative upward tier
change after character hydration. It does not replay on login, downward/admin
resets, reduced motion, or while the document is hidden. Persistent CSS channel
motion pauses while hidden. The short activation state is exposed as
`data-ui-tier-activating` so independent React roots and the Phaser minimap can
join the same visual event without a gameplay protocol change.

Phase 11 adds `installUiUnlockSync()` alongside the tier projection. It compares
the existing Phase 5 visibility matrix for Mastery, Abilities, Stances, and
Rites, then briefly marks currently mounted matching
`data-ui-unlock-system` targets. Character hydration, reduced motion, hidden
documents, and unchanged visibility never replay the wake. Persistent
navigation can therefore acknowledge a reveal even when the Build dialog is
closed, while an already-open dialog can wake its newly mounted tab and summary
cards in the same event.

The Phaser minimap reads the resolved `--hud-minimap-*` colors through the same
tier projection. Tier overrides are deliberately inside `min-width: 1101px`;
mobile continues to receive the stable Tier 1 fallback until Phase 12.

Tier theming may replace token values later, but component contracts and layout
must remain stable.
