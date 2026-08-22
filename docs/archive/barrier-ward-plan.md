# Barrier & Ward — implementation plan

> **ARCHIVED (2026-08-22) — implemented; live state in `docs/barrier-ward-current-state.md`.**
>
> Kept for the rationale: SS2 records the four locked decisions and why, SS5 the
> traps, and SS6 why the rebalance had to be a separate pass. The phase-by-phase
> file list in SS4 is history — read the current-state doc for what the code does.

## 1. Intent

Today's player shield is a *periodic timed buff*: every `shield-interval-ms` while
in combat you gain a pool worth `shield-pct × maxHp` that expires after
`shield-duration-ms`. Spirit runs 30% / 10s / 10s, which is continuous absorb
throughput of ~3% max HP per second, forever, including through a whole boss fight.

The new model is Path of Exile's energy shield:

- **Barrier** — a permanent pool worth `barrier-pct × maxHp`. No duration. It sits
  in front of HP at all times. When it has not been damaged for `barrier-delay-ms`
  (4 s default) it refills at `barrier-recharge-pct` of its **max** per second
  (25% default → 4 s from empty to full). Any damage — direct hit *or* DoT tick —
  restarts the delay.
- **Ward** — the old temporary shield, kept as a distinct, explicitly-timed pool
  for effects that want a burst of absorb. Currently only overheal feeds it.

Both absorb before HP. **Wards drain first**, because they are use-it-or-lose-it;
the barrier is the standing layer underneath.

## 2. Decisions (locked 2026-08-22)

| # | Decision |
|---|---|
| D1 | **Strict PoE recharge.** No mid-fight trickle, no shortened delay. The barrier is a per-engagement buffer that refills while travelling between packs. The sustained-combat nerf is accepted; a numbers pass follows separately. |
| D2 | **Full rename to `defense.barrier-*`.** The interval/duration companion keys are deleted outright from all item data. `max-hit-rearms-shield` and the two break-heal keys are renamed too. No `shield` vocabulary survives on the player side. |
| D3 | **Break riders survive, on a cooldown.** Barrier reaching zero fires the break-heal; the damage-cap rider becomes "instantly refill the barrier". Both are gated by an internal cooldown so a barrier that flickers at zero cannot chain-farm them. |
| D4 | **Never persisted, always starts full.** Barrier is runtime-only and set to max on spawn, respawn, node entry and login. |

### Defaults I am taking unless told otherwise

- A **fully** evaded hit (0 damage after evade mitigation) does **not** restart the
  recharge delay. A graze (partial evade, damage > 0) does.
- A `bypassShield` DoT still **restarts the delay** — you were hit — it just does
  not drain the barrier. The flag is renamed `bypassBarrier`.
- **Monster `enemyShield` is untouched.** It stays a periodic timed monster shield;
  it is a burst-check mechanic and works as-is. Only its user-facing label changes
  if the vocabulary needs to match.
- `barrier-recharge-pct` and `barrier-delay-ms` become real, item-modifiable
  passives even though no item uses them on day one — they are the natural upgrade
  axes replacing the deleted interval/duration companions.
- Minions and the summoner damage sponge get no barrier.

## 3. Model

```
HasBarrier   { current, max, recharging }        networked; attached iff barrier-pct > 0
HoldsWards   { wards: WardState[] }              networked; attached iff ≥1 live ward
WardState    { amount, maxAmount, remainingMs }  (today's ShieldState, renamed)
```

- `max = barrierPct × maxHp`, recomputed in `recalculatePlayerEntityStats`;
  `current` is clamped to the new max and the component is attached/detached there
  as `barrier-pct` crosses zero. Component presence gates behaviour — no
  zero-valued sentinel component.
- `lastDamagedAt` lives on `TracksCombat` as a resource, **not** on the networked
  slice, so a stamp on every hit does not dirty the slice. Only the derived
  `recharging` boolean is networked, and only when it flips.
- Recharge is dt-scaled (`max × rate × dt/1000`), so it is tick-rate independent.
  Writes go through `mutateSlice`, and only when the value actually changed.

Pipeline order in `onDamageTaken` is unchanged except for the split:

```
evasion → damage cap → wards → barrier → hit-to-DoT → cheat death → absorb
```

## 4. Phases

### Phase 1 — shared contract

| File | Change |
|---|---|
| `shared/src/types/combat.ts` | `ShieldState` → `WardState`; add `BarrierState`. |
| `shared/src/components/combat/holdsShields.ts` | Split into `hasBarrier.ts` + `holdsWards.ts`. |
| `shared/src/components/index.ts` | Re-export both. |
| `shared/src/protocol/networkedEntity.ts` | Swap `holdsShields` for `hasBarrier` + `holdsWards` in the monster and player allowlists and the `NetworkedEntity` interface. |
| `shared/src/protocol/views.ts` (~:304) | Expose `barrier`, `maxBarrier`, `barrierRecharging`, `wards`. |
| `shared/src/passives.ts` | Retire `defense.shield-pct/-interval-ms/-duration-ms`. Add `defense.barrier-pct`, `defense.barrier-recharge-pct`, `defense.barrier-delay-ms`. Rename `max-hit-rearms-shield` → `defense.max-hit-refills-barrier`, `shield-break-heal-pct` → `defense.barrier-break-heal-pct`, `shield-break-hp-recovery-pct` → `defense.barrier-break-hp-recovery-pct`, `overheal-shield-pct` → `defense.overheal-ward-pct`. |
| `shared/src/data/mechanicLabels.ts` | New labels; `barrier-recharge-pct` / `barrier-delay-ms` are companions of `barrier-pct`. |
| `shared/src/items.ts` | Update the mechanic-key doc block (~:158). |

Defaults land in `GAME_CONFIG`: `BARRIER_RECHARGE_PCT = 0.25`,
`BARRIER_DELAY_MS = 4000`, `BARRIER_BREAK_RIDER_CD_MS` (pick a number, ~8 s).

### Phase 2 — server engine

`server/src/systems/defense/shields/` → `server/src/systems/defense/barrier/`:

- **`barrier.ts`** (new) — `syncBarrierMax`, `drainBarrier`, `stampBarrierHit`,
  `runBarrierRecharge`, `refillBarrier`. Owns the `onDamageTaken` absorb listener.
- **`wards.ts`** — today's `shields.ts` minus the barrier concerns: `applyWard`,
  `applyWardPercent`, `drainWards`, `updateWards`.
- **`barrierBreakHeal.ts`** — today's `shieldBreakHeal.ts`, now cooldown-gated and
  triggered by barrier depletion as well as ward break.
- **`periodicShield.ts`** — deleted.

| File | Change |
|---|---|
| `server/src/systems/defense/index.ts` | Registration order + tick: `runPeriodicShield` out, `runBarrierRecharge` in; `updateShields` → `updateWards`; re-exports. |
| `server/src/world/World.ts` (:227, :369) | `shieldedPlayers` → `barrierPlayers` / `wardedPlayers`; tick call rename. |
| `server/src/ecs/entity.ts` (:182) | Component keys. |
| `server/src/ecs/markerInvariants.ts` (:128) | Empty-ward invariant; add a barrier invariant (`current ≤ max`, `max > 0`). |
| `server/src/ecs/playerEntityFormulas.ts` | Recompute `max`, clamp `current`, attach/detach on the barrier-pct threshold. |
| `server/src/systems/classes/archetypes/dot/dotPrototype.ts` (:217) | Drain wards → barrier; stamp `lastDamagedAt`; `bypassShield` → `bypassBarrier`. |
| `server/src/systems/defense/mitigation/damageCap.ts` (:31) | Rider now refills the barrier, cooldown-gated. |
| `server/src/systems/defense/mitigation/evasion.ts` | No change needed if the stamp keys off post-mitigation damage > 0 — verify. |
| `server/src/systems/defense/regen/healing.ts` (:61) | Overheal produces a **Ward**. |
| `server/src/systems/defense/core/buffs.ts` | Barrier descriptor (pool + recharging state) and ward descriptor. |
| `server/src/systems/combat/status/monsterDot.ts` | `bypassShield` data key rename. |
| `server/src/admin/gameActions.ts` (:235), `systems/world/playerIncapacitation.ts` (:60), `systems/world/spawning/index.ts` (:954) | Detach wards; **refill** the barrier rather than detaching it (D4). |
| `server/src/world/worldLog.ts` + `shared/src/protocol/worldLogEvents.ts` | `shield-gain` fires for wards only. Barrier recharge is silent; add a `barrier-broken` event if the combat log wants it. |

### Phase 3 — data migration

- `shared/src/data/skillTree/rootsAndFrames.ts` — `energy-root` (:143) and
  `energy-range-close` (:587) mechanic effects **and** their prose descriptions
  (:137, :581, :603 all describe a periodic shield).
- `shared/src/data/recipes/mountain.recipes.ts` — 30 lines: the Granite Barrier
  charm line T1–T4 plus the break-heal and rearm items. The name already fits.
- `shared/src/data/recipes/tundra.recipes.ts` — 18 lines: `tundra-charm-t3`,
  `-t4`, `-t4-deepfreeze`.
- `shared/src/data/recipes/jungle.recipes.ts` (:210) — overheal key rename.
- `shared/src/data/monsters/types.ts` — `bypassShield` → `bypassBarrier` on the
  DoT definitions (3 sites); `enemyShield` itself stays.
- `shared/src/systems/balanceLab.ts` (:641) — item-value heuristic key.

Every deleted `shield-interval-ms` / `shield-duration-ms` companion is a straight
removal. Barrier percentages carry over 1:1 as placeholders — **the rebalance is a
separate pass** (see §6).

### Phase 4 — client

| File | Change |
|---|---|
| `client/src/hud/atoms.ts` | `shieldsAtom` → `barrierAtom` + `wardsAtom`. |
| `client/src/hud/stat/StatPanel.tsx`, `StatPlate.tsx` | Barrier as a real standing segment with a known max, not a variable-width strip; recharging pulse. |
| `client/src/hud/MobileHUD.tsx` | Same, `hp-shield-strip` → barrier segment. |
| `client/src/hud/stat/components.tsx` (:19), `statHelp.ts` (:45) | New rows and help text — pool %, recharge rate, delay. |
| `client/src/ui/crafting/itemDisplay.ts` (:266, :455), `ui/describe/passiveText.ts` | Item tooltip lines. |
| `client/src/render/healthBars.ts` | Overhead bar: barrier segment + ward segment. |
| `client/src/render/damageNumberStyle.ts`, `players.ts`, `monsters.ts`, `net/deltaApplier.ts` | Absorb floaters — decide whether ward and barrier absorb read differently or share the blue number. |
| `client/src/ui/conceptIcons.ts` (:251) | Icon mapping. |

### Phase 5 — tools & tests

- `tools/ehp-report.ts` (:539, :630) — the current model is
  `recovery += maxHp × pct / interval`, i.e. flat HP/s throughput. That is exactly
  the wrong shape now. Replace with: barrier adds a **flat buffer** to the eHP pool
  (it does not recharge inside a modelled fight under D1), and update the
  methodology section (:1539, :1615, :1653).
- `tools/mob-report.ts` (:483) — recovery-item pick heuristic key.
- `server/test/barrier.test.ts` (new) — wiring smoke test: attach `HasBarrier`,
  land a hit, assert the pool drains and `recharging` is false; advance past the
  delay, assert refill; land a DoT tick, assert the delay restarts.
- `server/test/describeText.test.ts` (:77–120), `shared/src/data/mechanicLabels.test.ts`
  (:154) — key renames and the new companion collapse.

## 5. Risks / traps

1. **Networked-slice churn.** `current` changes every tick for 4 s while
   recharging (40 ticks at 10 Hz → 20 broadcasts). Guard every write with an
   actual-change check and go through `mutateSlice`.
2. **`max` moves under you.** Gear swaps, level-ups and class affinities all move
   `maxHp`. Recompute and clamp in one place (`recalculatePlayerEntityStats`) or
   the pool silently desyncs from its percentage.
3. **World-log spam.** `shield-gain` currently fires on every periodic application.
   A barrier that refills after every pack would flood the combat log. Wards only.
4. **Two drain call sites.** Direct hits and DoT ticks both drain, and both must
   stamp `lastDamagedAt`. Missing the DoT stamp makes a burning player recharge
   through the burn.
5. **Bench parity.** Combat listeners must be registered in `initCombatSystems()`
   so `pnpm bench:balance` and the live server behave identically.

## 6. Follow-up: the numbers pass

D1 is knowingly a large nerf. Spirit's 30% / 10 s / 10 s is ~3% max HP per second
of absorb sustained indefinitely; under the barrier it is a flat 30–40% max HP
buffer per engagement and nothing thereafter in a long fight. Mountain and tundra
charm lines were costed against the old throughput.

Do not tune during the mechanic change. Ship the mechanic with percentages carried
over 1:1, then run `pnpm bench:balance` and the eHP report and rebalance the Spirit
chassis, the Haunt frame and both charm families in one pass. Expect to raise the
percentages substantially, and expect the barrier's value to become strongly
node-modifier dependent (dense/swarming nodes never open the recharge window).
