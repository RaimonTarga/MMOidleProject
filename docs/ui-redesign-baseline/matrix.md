# Phase 0 Baseline — State Matrix

Captured 2026-07-20 against the working tree as-is (including the in-progress
desktop ability dock changes already in `client/src/hud/AbilityBar.tsx`,
`AutoCombatButton.tsx`, `hud.css`, `StatPanel.tsx` — Phase 1 treats that draft
as its starting point, so this baseline intentionally includes it).

Captured with a scripted Chromium session (Playwright) driving a fresh dev
account against a local `pnpm --filter @mmo-idle/server dev` +
`pnpm --filter @mmo-idle/client dev` stack. The capture script lives outside
the repo (session scratchpad) — it is a one-off tool, not a committed part of
this codebase. Re-run manually or ask an agent to reconstruct it for later
phase review gates.

## Desktop widths

| Width | File | Notes |
|---|---|---|
| 1366x768 | `desktop-1366x768.png` | |
| 1440x900 | `desktop-1440x900.png` | |
| 1920x1080 | `desktop-1920x1080.png` | |
| 1101px (boundary, still desktop) | `desktop-1101px-boundary.png` | Rails + Auto Combat still visible. |
| 1100px (boundary, mobile takeover) | `mobile-1100px-boundary.png` | `MobileHUD` takes over per the `max-width: 1100px` breakpoint in `client/index.html`; not modified. |

## Combat / HUD states

| State | File | Notes |
|---|---|---|
| Auto Combat OFF | `auto-combat-off.png` | Default state on a fresh character. |
| Auto Combat ON | `auto-combat-on.png` | Toggled via `.combat-auto-button`. |
| Character panel compact | `character-compact.png` | Default disclosure state. |
| Character panel expanded | `character-expanded.png` | Via the `panel-title--collapsible` header. |
| Intent panel compact | `intent-compact.png` | Default disclosure state. |
| Intent panel expanded | `intent-expanded.png` | Copy is hard-coded (`'Attacking Field Hare'`, `'Nearest hostile in range'`, etc.) — matches the known gap in plan section 3, to be fixed in Phase 5. |
| Inventory modal open | `modal-inventory-open.png` | Via the right-rail nav button; shows current backdrop/frame/header styling this phase will replace. |
| Death — economy controls disabled | `death-disabled-economy.png` | Forced via the admin `killPlayer` action (dev-only `/admin` namespace, no auth — see `CLAUDE.md` admin-auth gap). Inventory/Crafting/Passive Tree/etc. nav buttons are visibly disabled behind the death overlay. |

## Ability dock states (ready/cooling/active/triggered) — NOT CAPTURED

A fresh dev character has no Technique/Guard equipped
(`emptyEquippedAbilities()` on character creation), so
`client/src/hud/AbilityBar.tsx` renders nothing (`hasAny` is false) even after
the debug panel's "GO TO TEST ROOM" + "EQUIP DEV LOADOUT" actions — those only
grant a weapon/armor (400 dmg + invuln), not a class/spec or ability loadout.

Reaching `ready` / `cooling` / `active` / `triggered` on the ability dock
needs a real class pick (radial skill tree root) plus enough skill-tree
unlocks to equip a Technique and a Guard — a multi-step gameplay flow, not a
one-click dev shortcut today.

**Recommendation for Phase 1** (which redesigns this exact dock): either walk
a real build through the skill tree once and reuse that saved character for
future baseline passes, or add a dev-only "equip test build" debug button
(class + minimal skill unlocks) alongside the existing "EQUIP DEV LOADOUT" —
the latter is the more reusable fix and directly serves every future phase
that needs to screenshot the ability dock.

## Typecheck

```
pnpm --filter @mmo-idle/client exec tsc --noEmit
```

Result: clean, no errors.

## Incidental finding (not in scope for this phase)

The client console logged a React warning during this session:

```
Each child in a list should have a unique "key" prop... Check the render
method of `div`. It was passed a child from StatSheet.
```

Not investigated further — flagging for whoever next touches `StatSheet` /
the character stat rendering, since Phase 0 is verification-only.
