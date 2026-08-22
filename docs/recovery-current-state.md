# Recovery — Current State

What the code does today. Paired with `design_docs/archive/RECOVERY_REGEN_REWORK_HANDOFF.md`
(the original design handoff, kept for rationale). Shipped 2026-08-22.

**This was a systems overhaul, not a balance pass.** Every coefficient below is a
first-pass value chosen to roughly preserve the old throughput; the numbers pass
is separate and unstarted — see §8.

## 1. The one rule

> **Recovery is the canonical HP-restoration rate. In-combat regen effects
> activate some fraction of that rate instead of inventing separate fixed-%
> max-HP heals.**

**1 Recovery = 1% of max HP restored per second while 100% Recovery is active.**
The stat lives on `HasHealth.recovery` (a persisted slice, but fully derived —
`recalculatePlayerStats` resets it to `GAME_CONFIG.PLAYER_RECOVERY` at the top of
every recalc, so nothing about it needs a migration). The naked baseline is 10.

```
healingPerSecond = maxHp × (recovery / 100) × activeFraction
```

Out of combat, past `GAME_CONFIG.COMBAT_REGEN_DELAY`, `activeFraction` is a flat
**1.0**. In combat it starts at **0** and each source switches on a share.

## 2. Sources, and how they combine

Fractions from different sources **add**. They are not multiplied, and there is
deliberately **no 100% cap** — a build that stacks past 100% is a balance question
to answer with tooling, not an invariant to clamp.

| Passive | Shape |
|---|---|
| `defense.recovery-active-pct` | Permanent while in combat (Squire root, Recuperating Stance) |
| `defense.recovery-pulse-pct` + `-interval-ms` + `-duration-ms` | Every interval, on for duration (Striker root, cave charms) |
| `defense.recovery-on-kill-pct` + `-ms` | A kill switches it on; further kills **refresh** (Slinger root, plains charm) |
| `defense.recovery-ramp-start-pct` / `-max-pct` / `-ramptime-ms` | Climbs start→max over a fight, resets on leaving combat (jungle charm) |
| `guard.recovery-on-fire-pct` + `-ms` | Firing any Guard ability switches it on (forest charm) |
| Recovery-tagged skills | Second Wind, via `activateRecovery(cs, 'skill', …)` |

A source that fires while its own window is still live **refreshes its timer
rather than stacking a second copy**, and the larger fraction wins. This is what
makes on-kill Recovery a chain-farming mechanic — dense packs keep the window
alive — and deliberately weak against a lone boss, where there is nothing to
refresh off.

Duration companions fall back to `GAME_CONFIG.RECOVERY_PULSE_MS` /
`RECOVERY_ON_KILL_MS` / `RECOVERY_ON_GUARD_MS` / `RECOVERY_SKILL_MS` (all 4000).

## 3. Where it lives

```
server/src/systems/defense/regen/
  recovery.ts        the engine: activateRecovery, activeRecoveryFraction,
                     recoveryPerSecond, resetRecoverySources, runRecovery
  recoveryOnKill.ts  the onKill combat listener
  healing.ts         applyHealToPlayer — the single heal funnel
  damageAbsorb.ts    NOT Recovery (see §6)
```

`runRecovery` is called once per player per tick from `updateDefensiveSystems`.
That single call covers OOC regen **and** every in-combat effect, because they are
all fractions of the same rate — applying them separately is exactly the bug this
rework removed.

Timed sources are two resources each on `TracksCombat`
(`recovery.<id>Ms` / `recovery.<id>Pct`). The fraction is **stored at activation**
rather than re-read from passives, so a skill resolved at fire time (tier-scaled,
potency-scaled) keeps the value it fired with even if gear changes mid-window.

Everything lands through `applyHealToPlayer`, so antiheal and the overheal ward
are handled in one place.

### Ordering trap

The pulse's cadence is a `TracksCombat` cooldown, and cooldowns are ticked by
`updateCombatState` **before** `updateDefensiveSystems` in the world tick. Any
test that calls `runRecovery` without `tickCooldowns` will wedge the pulse
permanently on its first interval. `server/test/recovery.test.ts` mirrors the real
order via its `advance()` helper.

## 4. `core.recovery-mult` applies exactly once

On the **stat**, in `shared/src/systems/stats.ts`. Never in `applyHealToPlayer`.

Because every in-combat regen effect is a fraction of the rate, scaling the rate
already covers all of them; re-applying it per-heal would compound it (a +25% core
landing as +56%). The tradeoff, taken deliberately: it no longer touches the heals
that are *not* Recovery-derived — the absorb drain and the post-cheat-death HoT —
which is correct, since those are separate systems (§6).

## 5. Recovery Skill Potency

`defense.recovery-skill-potency` scales the fraction activated by abilities
carrying the **`recovery` tag** (`AbilityTag` in `shared/src/abilities.ts`). Today
that is Second Wind alone.

It deliberately does **not** touch passive Recovery access — the Squire root, the
pulse, on-kill, the ramp, `guard.recovery-on-fire-pct` — nor Barrier, Ward, Absorb,
Cleanse or damage reduction. Tagging is the gate: an untagged ability gets nothing,
so adding a Recovery skill is a deliberate act, not an accident of effect kind.

The passive is wired end to end (key, label, stat panel row, item tooltip line)
but **no item authors it yet** — it exists as the design space the item rework
will fill, the same way `defense.barrier-recharge-pct` does.

## 6. What is NOT Recovery

- **Barrier / Ward** — a pool in front of HP, with its own recharge rules. See
  [barrier-ward-current-state.md](barrier-ward-current-state.md). Recovery does not
  improve capacity, recharge rate, or recharge delay.
- **Absorb** (`defense.absorb-pct`) — scales from *incoming damage*, drains from
  its own pool. Not max-HP healing, not Recovery-scaled.
- **Cleanse** — untouched by this pass.

## 7. Player-facing surface

- **Stat panel:** `Recovery` is the stat row (a bare number — it is a rate in
  points, not HP/s). Access passives get their own rows: Combat Recovery, Recovery
  Pulse, Recovery on Kill, Recovery Skill Potency.
- **Buff bar:** one `defense-recovery` tile, shown in combat only, whose stack
  count is the **summed** active percentage and whose detail line spells out the
  resulting `% max HP/s`. Since the fractions add invisibly, this is the only place
  a player can see what their sustain actually totals. Out of combat everyone is at
  a flat 100%, so there is nothing to show.
  - Its art still lives at `statuses/buffs/defense-burst.png`; `BUFF_ICON_ALIASES`
    in `client/src/ui/conceptIcons.ts` bridges the id to the file. The green regen
    icon was still right, so the id moved and the art did not.
- **HP bar ghost layer** (`hasStatus.pendingHeal`) no longer includes Recovery:
  a rate has no finite amount owed to draw past current HP. It still covers the
  absorb and post-cheat-death pools.

## 8. Deliberately left for the balance / item pass

- Every coefficient. The Striker pulse (20% for 4s every 6s), Slinger on-kill
  (20% for 4s) and Second Wind (50% for 4s) were picked to land near the old
  throughput at baseline Recovery 10, not because they are right.
- **All item data.** No charm changed identity here. The Plains/Forest/Swamp
  re-key and the +0…+5 tables in `design_docs/T1_ITEM_NUMERICAL_BASELINE.md` §9
  are the item rework's job — this pass only made the mechanics they need exist.
- Whether extreme Recovery stacking eventually needs a cap.
- `tools/ehp-report.ts` models Recovery access by duty cycle but **omits on-kill
  Recovery entirely** (it has no kill-cadence model). Charms carrying it are
  flagged `(on-kill Recovery undercounted)` rather than silently reading as dead
  weight — do not treat that column as a balance signal.
