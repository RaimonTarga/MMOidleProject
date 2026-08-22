# Step 8 — Charms & Recovery Layers — Current State

Paired with `docs/archive/charms-plan.md`. Reflects what shipped: the **Guard-ability amplifier machinery +
2 worked charms + the "X Core" rename**. Per-biome charm amplifier identities and all numbers are a
later user pass.

> The recovery **engine** and per-biome recovery **identities** were already built on the `recovery`
> slot before this step. Step 8 added only the third charm role from the brainstorm: the **Guard-skill
> amplifier**. Class baseline recovery rhythms are untouched.

## Amplifier — `guard.*` passives (shared)

`shared/src/passives.ts` — new **`GUARD_KEYS`** namespace (`as const`), `GuardPassiveKey` type, folded
into `PassiveKey` and `ALL_PASSIVE_KEYS`:

- `guard.cooldown-reduction-pct` — shorten the Guard ability cooldown by this fraction.
- `guard.potency-pct` — scale the Guard effect magnitude (e.g. `drPct`) by `(1 + X)`.
- `guard.duration-pct` — extend the Guard buff duration by `(1 + X)`.
- `guard.recovery-on-fire-pct` — activate `X%` of the player's **Recovery rate** when the Guard fires,
  for `guard.recovery-on-fire-ms` (default `GAME_CONFIG.RECOVERY_ON_GUARD_MS`). Not a flat `% maxHp`
  heal — see [recovery-current-state.md](recovery-current-state.md).

Documented in the `ItemDefinition.mechanicEffects` JSDoc (`items.ts`) alongside the `defense.*` keys.

**Pipeline reuse (no new state).** Charm `mechanicEffects` already accumulate into
`player.usesSkills.passives` via the `EQUIPMENT_SLOTS` loop in `recalculatePlayerStats` (`stats.ts`).
The `guard.*` keys ride that path unchanged — **no new component, slice, persistence, migration, dev-boot
invariant, protocol field, or combat listener.** They are dead stats unless a Guard ability is equipped
(intended conditional value: charms now reward running a Guard ability).

## Reads — `abilityFiring.ts`

In `maybeFireGuard(player, abilityId, fctx)`:

- After a successful fire, read `player.usesSkills.passives`.
- **recovery-on-fire:** `activateRecovery(tracksCombat, 'guard', pct, ms)`. The Recovery engine
  (defense tick) pays it out — antiheal applies, and it adds into the Recovery buff tile alongside
  every other source. It is a charm rider, **not** a Recovery *skill*, so
  `defense.recovery-skill-potency` deliberately does not scale it.
- **cooldown-reduction:** `effectiveCd = ability.cooldownMs × (1 − clamp(pct, 0, 0.9))`, passed to
  `setCooldown(GUARD_CD_KEY, …)`.

In `applyGuardEffect(player, ability, passives)` (for the `damage-reduction` effect kind):

- **potency:** `drPct = min(GUARD_DR_CAP 0.9, effect.drPct × (1 + max(0, potency)))`.
- **duration:** `durationMs = round(effect.durationMs × (1 + max(0, durationBonus)))`; set on **both**
  `remainingMs` and `data.totalMs` so the buff-bar clock matches.

`abilityEffects.ts` `onDamageTaken` reader is **unchanged** — it reads the (now amplified) `drPct` from
the stored `ability-guard` status effect.

## Rename — "X Core" → thematic (display only)

7 charm items renamed; **`slot` key stays `recovery`**, only the display `name` changed. Frees "Core"
for Step 9's 5th-slot Core system.

| id | new name |
|---|---|
| `plains-charm-t1` | Plains Stone |
| `plains-charm-t2` | Stalwart Heart |
| `desert-charm-t2` | Mirage Talisman |
| `desert-charm-t3` | Oasis Heart |
| `mountain-charm-t4` | Fortress Heart |
| `volcanic-charm-t3` | Magmaheart Stone |
| `volcanic-charm-t4` | Inferno Heart |

(A stale comment in `volcanic.recipes.ts` referencing "Inferno Core" was also updated. Generated
artifacts under `reports/` and reference docs under `design_docs/` still mention old names; they
regenerate and were left.)

## Worked content — SUPERSEDED by the T1 item rework

The two worked charms this step shipped (`forest-charm-t1` with `guard.cooldown-reduction-pct` +
`guard.recovery-on-fire-pct`, and `plains-charm-t1` with `guard.potency-pct`) were **re-authored**
by the T1 item rework. Forest's charm is now raw Recovery + `defense.recovery-skill-potency`;
Plains' is on-kill Recovery only, and the Guard-potency rider moved to Mountain's armor, where
defensive-skill amplification is the locked identity. See
[t1-item-rework-current-state.md](t1-item-rework-current-state.md).

The `guard.*` MACHINERY documented above is unchanged and still the authority — only which items
author which keys moved.

## Verified

4-pkg typecheck clean (after `shared` rebuild); `targetPriority` + `runeMaintenance` server tests pass;
`autoCombatSameNode` bench (5 players) runs clean.

## Deferred (not this step)

- Per-biome charm amplifier identities for the remaining ~30 charms (user content pass).
- All numbers/balance (user).
- Step 9 reuses the freed "Core" noun for the 5th equipment slot.
