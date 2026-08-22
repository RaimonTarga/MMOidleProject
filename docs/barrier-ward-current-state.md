# Barrier & Ward — Current State

What the code does today. Paired with `docs/archive/barrier-ward-plan.md` (the
original plan, kept for rationale). Shipped 2026-08-22.

**Numbers here are placeholders carried over 1:1 from the old periodic shield.**
The rebalance is a separate, unstarted pass — see §7.

## 1. The two mechanics

| | **Barrier** | **Ward** |
|---|---|---|
| Component | `HasBarrier { current, max, recharging }` | `HoldsWards { wards: WardState[] }` |
| Lifetime | Permanent, never expires | Explicitly timed |
| Size | `defense.barrier-pct × maxHp` | Whatever the source grants |
| Refill | `defense.barrier-recharge-pct` of **max** per second, once undamaged for `defense.barrier-delay-ms` | None — spend it or lose it |
| Drain order | Second | **First** |
| Sources | Spirit chassis, Haunt frame, mountain + tundra charms | Overheal (`defense.overheal-ward-pct`) |

Both absorb before HP. Wards spend first precisely because they are
use-it-or-lose-it: a ward that expired unspent while the barrier soaked the damage
would be pure waste.

Defaults live in `GAME_CONFIG`: `BARRIER_RECHARGE_PCT` 0.25, `BARRIER_DELAY_MS`
4000, `BARRIER_BREAK_RIDER_CD_MS` 8000. The two per-item companions override the
first two; no item authors either yet, so they exist as design space.

## 2. Where it lives

```
server/src/systems/defense/barrier/
  barrier.ts           pool, recharge, absorb listener, syncBarrier, refillBarrier
  wards.ts             ward stack, timers, absorb listener
  barrierBreakHeal.ts  the cooldown-gated break riders
```

- **Sizing happens in exactly one place**: `syncBarrier`, called from
  `recalculatePlayerEntityStats` ([playerEntityFormulas.ts](../server/src/ecs/playerEntityFormulas.ts)).
  Gear, levels and class affinities all move `maxHp`; a second sizing site would
  desync the pool from its percentage. Presence of `HasBarrier` gates the whole
  mechanic, so nothing downstream re-reads the passive.
- **Recharge** runs per-tick in `updateDefensiveSystems`.
- Listener order in `onDamageTaken`:
  `evasion → damage cap → wards → barrier → break heal → hit-to-DoT → cheat death → absorb`.
  Registered in `initDefenseSystems()`, so live server and benches are identical.

## 3. The delay stamp

`barrierUndamagedMs` is a `TracksCombat` **accumulator**, not a timestamp: damage
resets it to 0, the tick adds `dt`. Deterministic and tick-rate independent, and
it keeps the recharge clock off the networked slice.

Three call sites set it, and all three matter:

1. The barrier absorb listener, whenever `ctx.damage > 0` reaches the defense layer.
2. The ward absorb listener, when a ward soaked the hit entirely (the barrier
   listener returns early on zero damage, so without this a fully-warded hit would
   look like no hit at all).
3. The DoT tick in `dotPrototype`, **unconditionally** — including for
   `bypassBarrier` DoTs. Missing this would let a burning player recharge straight
   through the burn.

A **fully evaded** hit (0 damage after evade mitigation) reaches none of them and
does not restart the delay. A graze does.

Only the derived `recharging` boolean is networked, and only when it flips.

## 4. Riders

`defense.barrier-break-heal-pct` (charm) + `defense.barrier-break-hp-recovery-pct`
(armor) heal a fraction of the emptied pool's max. `defense.max-hit-refills-barrier`
(Titan's Keep) refills the barrier when the damage cap trips.

All three share one cooldown, `BARRIER_RIDER_CD`. This is load-bearing: under the
recharge model a barrier sitting at zero is a routine state, not a rare event, so
every subsequent hit would "empty" it again. A hit that both empties the barrier
and breaks a ward pays out the larger basis, not both.

## 5. Presentation

- **Desktop** (`StatPlate`): the HP conduit carries a capping band for total
  absorb (barrier + wards, measured against max HP — the effective-HP read), and
  the barrier gets its **own conduit** below it on its own scale, so an empty
  barrier still shows the pool that is missing. Recharging is shown as motion.
- **Mobile** (`MobileHUD`): the strip above the HP bar is the barrier on its own
  scale; wards are a capping band on the HP track.
- **Overhead bars**: barrier and wards share one 32px band — splitting them would
  give each a sub-pixel sliver.
- **Buff tiles**: `defense-barrier` (fill % as the sweep, label flips to
  "Recharge") and `defense-ward`.
- **World log**: `ward-gain` fires for wards only. Barrier recharge is silent —
  logging it would flood the combat log after every pack. The absorb event is
  `absorb` (shared with the monster shield path).

## 6. What did NOT change

- **Monster `enemyShield` is untouched.** It stays a periodic, timed, cyclic
  monster shield — a burst-check mechanic that works. It is deliberately not the
  player's barrier, and `shared/src/data/monsters/types.ts` says so.
- The wire field for absorbed damage is now `absorbed` (was `shieldAbsorbed`),
  shared by the monster-shield and player-barrier paths.
- Item ids, names and icons were left alone (`mountain-charm-t4-shieldmend` /
  "Shieldmend Ward" keep their ids — those are persisted).

## 7. Open: the numbers pass

Not started. The old Spirit shield (30% / 10 s interval / 10 s duration) was ~3%
max HP per second of absorb sustained **indefinitely**. The barrier is a flat
per-engagement buffer that, under strict recharge, never refills inside a real
fight. Spirit, the Haunt frame and both charm families were costed against the old
throughput.

Also expect the barrier's value to become strongly node-modifier dependent — dense
and swarming nodes never open a 4-second window.

`tools/ehp-report.ts` now models the barrier as a one-time buffer added to the
effective pool rather than as HP/s throughput; its documented limitation is that
it ignores the between-pack recharge, so multi-pack farm throughput is understated.
