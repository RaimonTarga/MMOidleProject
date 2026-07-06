> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/charms-current-state.md`. Kept for design rationale — do not treat as current.

# Step 8 — Charms & Recovery Layers — Plan

Paired with `docs/charms-current-state.md`. Source: `docs/system-rework-roadmap.md` Step 8 +
`design_docs/archive/system-rework-brainstorming-final.md` §8.

## Goal

Charm becomes **recovery engine + recovery specialization + Guard-skill amplifier**. The first two
already exist on the `recovery` equipment slot; the only net-new piece is the **Guard-ability
amplifier**. Also: rename the charm items currently named "X Core" so "Core" is free for Step 9.

## What already exists (no work)

- **Charm = the `recovery` slot.** Items carry `hpRegen` + recovery `mechanicEffects`
  (`defense.kill-burst-pct`, `defense.regen-burst-*`, `defense.shield-*`, `defense.absorb-pct`,
  `defense.cleanse-*`). Per-biome identities authored (Plains kill-burst, Forest OOC regen, Swamp
  absorb, Mountain shield, Cave burst…).
- **The mechanicEffects → passives pipeline.** `stats.ts` (`recalculatePlayerStats`) loops
  `EQUIPMENT_SLOTS` and merges each equipped item's `mechanicEffects` (+ upgrade-step deltas) into
  `player.usesSkills.passives`. **Any new `guard.*` key auto-accumulates** — no merge code to add.
- **Class baseline recovery** (Squire OOC-in-combat, Striker burst heal, Reload heal-on-kill, etc.) —
  untouched per the brainstorm.

## The Guard ability shape we amplify (from Step 7)

Guard abilities fire in `server/src/systems/player/abilities/abilityFiring.ts` (`maybeFireGuard` →
`applyGuardEffect`), which sets a per-ability cooldown (`ability.cooldownMs` on `TracksCombat` key
`ability.guard.cd`) and applies the `ability-guard` status effect (`{ totalMs, drPct }`). The
`onDamageTaken` reader in `abilityEffects.ts` consumes `drPct` (capped at `GUARD_DR_CAP` 0.9). A buff
descriptor projects it to the buff bar.

## Amplifier levers (all four — user choice)

New `guard.*` passive keys, carried by charms, only meaningful while a Guard ability is equipped:

| Key | Effect | Read site |
|---|---|---|
| `guard.cooldown-reduction-pct` | shorten Guard cooldown: `cd × (1 − pct)` (clamped 0.9) | `maybeFireGuard` |
| `guard.potency-pct` | scale guard effect magnitude: `drPct × (1 + pct)`, capped 0.9 | `applyGuardEffect` |
| `guard.duration-pct` | extend buff: `durationMs × (1 + pct)` (set `remainingMs` AND `data.totalMs`) | `applyGuardEffect` |
| `guard.heal-on-fire-pct` | on fire, heal `maxHp × pct` into the recovery `BURST_POOL_KEY` (antiheal applies) | `maybeFireGuard` |

Design notes: potency is intentionally generic (scales whatever the guard effect's magnitude is — only
`drPct` exists in v1). `applyGuardEffect` already receives `player`; it reads `player.usesSkills.passives`
directly. The `onDamageTaken` reader needs **no change** (reads the amplified stored `drPct`).

## Type wiring

`guard.*` keys must be registered as `PassiveKey`s (the type is a closed union from
`shared/src/passives.ts`). Add a new `GUARD_KEYS` `as const` array (one-namespace-per-array convention),
derive `GuardPassiveKey`, fold into `PassiveKey` + `ALL_PASSIVE_KEYS`. Document the keys in the
`ItemDefinition.mechanicEffects` JSDoc in `items.ts`.

## Rename (free "Core" for Step 9)

Only **7 items** are named "X Core" (slot stays `recovery`; only display `name` changes):

| id | from | to |
|---|---|---|
| `plains-charm-t1` | Plains Core | Plains Stone |
| `plains-charm-t2` | Stalwart Core | Stalwart Heart |
| `desert-charm-t2` | Mirage Core | Mirage Talisman |
| `desert-charm-t3` | Oasis Core | Oasis Heart |
| `mountain-charm-t4` | Fortress Core | Fortress Heart |
| `volcanic-charm-t3` | Magmaheart Core | Magmaheart Stone |
| `volcanic-charm-t4` | Inferno Core | Inferno Heart |

## Worked examples (placeholder numbers → user balance pass)

Add a `guard.*` amplifier to two T1 charms (mirroring how Sweep/Brace shipped):
- `forest-charm-t1` (Heartroot Amulet) — `guard.cooldown-reduction-pct` + `guard.heal-on-fire-pct`
  (recovery-themed; pairs with the forest Guard ability Brace).
- `plains-charm-t1` (Plains Stone) — `guard.potency-pct` (contrasting identity).

Each keeps its existing recovery `mechanicEffects` (charms now do recovery **and** Guard amplification).

## File touch list

- `shared/src/passives.ts` — `GUARD_KEYS` + union/aggregate wiring.
- `shared/src/items.ts` — document the four `guard.*` keys.
- `shared/src/data/recipes/{plains,desert,mountain,volcanic,forest}.recipes.ts` — 7 renames + amplifier
  on the 2 worked charms.
- `server/src/systems/player/abilities/abilityFiring.ts` — read the four passives.
- *(no change to `abilityEffects.ts`.)*

## Cross-cutting checklist

- **Persistence/migration:** none (passives are runtime-rebuilt; rename is display-only).
- **Networked slices / dev-boot invariants:** none.
- **Protocol/PlayerView:** none (guard buff already projects).
- **combatBootstrap parity:** no new listeners.
- **Admin / rune-action catalog:** untouched.

## Verification

`pnpm --filter @mmo-idle/shared build` → `pnpm typecheck` (4 pkgs); `targetPriority` +
`runeMaintenance` tests; `autoCombatSameNode` bench (5 players).

## Deferred

- Per-biome charm amplifier identities for the ~30 remaining charms (user content pass).
- All numbers/balance (user).
