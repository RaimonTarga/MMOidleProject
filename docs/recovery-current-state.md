# Recovery — Current State

What the code does today. Paired with `design_docs/archive/RECOVERY_REGEN_REWORK_HANDOFF.md`
(the original design handoff, kept for rationale). Shipped 2026-08-22; moved to the
flat HP/s model on 2026-09-30 (progression rework Phase 0b, design bible §15).

**This was a systems overhaul, not a balance pass.** Every coefficient below is a
first-pass value chosen to roughly preserve the old throughput; the numbers pass
is separate and unstarted — see §8.

## 1. The one rule

> **Recovery is the canonical in-combat HP-restoration rate, and it is flat.
> In-combat regen effects activate some fraction of that rate instead of
> inventing separate heals.**

**1 Recovery = 1 HP restored per second while 100% Recovery is active.** It does
not scale with max HP: the pool is a budget, the rate is a choice (design bible
§15; progression rework Phase 0b, 2026-09-30). The stat lives on
`HasHealth.recovery` (a persisted slice, but fully derived — `recalculatePlayerStats`
reseeds it at the top of every recalc, so nothing about it needs a migration).

```
inCombat:   healingPerSecond = recovery × activeFraction
outOfCombat: healingPerSecond = maxHp × GAME_CONFIG.OOC_RECOVERY_PCT      (0.10)
```

The naked base is **per player tier**: `baseRecoveryForTier(tier)` =
`RECOVERY_BASE_FRACTION` (0.05) × `RECOVERY_REFERENCE_POOL_BY_TIER[tier]`
(100 / 130 / 200 / 330 / 560 for a fresh character and T1–T4), i.e. 5 / 6.5 / 10 /
16.5 / 28 HP/s. A naked character at tier entry therefore recovers the same 5% of
its reference pool per second it did under the old percentage model, and the pool
outgrows the rate within the tier.

Out of combat, past `GAME_CONFIG.COMBAT_REGEN_DELAY`, healing is **not Recovery**: a
fixed 10% of max HP per second regardless of the stat, so empty-to-full is 10 s at
every tier and downtime never depends on in-combat tuning. In combat the active
fraction starts at **0** and each source switches on a share.

## 2. Sources, and how they combine

Fractions from different sources **add**. They are not multiplied, and there is
deliberately **no 100% cap** — under a flat rate the fractions multiply an authored
HP/s number, so stacking is bounded by what the tier's gear adds up to rather than
by a clamp.

| Passive | Shape |
|---|---|
| `defense.recovery-active-pct` | Permanent while in combat (Squire root, Recuperating Stance) |
| `defense.recovery-pulse-pct` + `-interval-ms` + `-duration-ms` | Every interval, on for duration (Striker root, swamp charms) |
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
That single call covers OOC healing **and** every in-combat effect: in combat it
pays the summed fraction of the flat rate (`recoveryPerSecond`), out of combat the
fixed pool share (`oocRecoveryPerSecond`). Applying sources separately is exactly the
bug the 2026-08 rework removed. `activeRecoveryFraction` is in-combat access only and
reads 0 out of combat.

Minions (Conduit) carry their own `hasHealth.recovery` = the owner's flat rate ×
(minion max HP / owner max HP), set at spawn and resynced per tick
(`minionRecoveryFor` in `summoner/spawn.ts`), so a small body refills on the owner's
clock. Reconstruction's in-combat queue heal is a share of the owner's flat rate.

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
that are *not* Recovery-derived — the absorb drain —
which is correct, since that is a separate system (§6).

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
- **Absorb** (`defense.absorb-pct`) — scales from *incoming damage* that reaches HP
  (after shields and summon redirection, capped at current HP), drains from its own
  pool. Not max-HP healing, not Recovery-scaled.
- **Cleanse** — untouched by this pass.

## 7. Player-facing surface

- **Stat panel:** `Recovery` is the stat row, in **HP/s**. Access passives get their
  own rows: Combat Recovery, Recovery Pulse, Recovery on Kill, Recovery Skill Potency.
- **Buff bar:** one `defense-recovery` tile, shown in combat only, whose stack
  count is the **summed** active percentage and whose detail lines spell out the
  resulting `HP/s` and its share of max HP. Since the fractions add invisibly, this
  is the only place a player can see what their sustain actually totals. Out of
  combat healing is the fixed pool share, so there is nothing to show.
  - Its art still lives at `statuses/buffs/defense-burst.png`; `BUFF_ICON_ALIASES`
    in `client/src/ui/conceptIcons.ts` bridges the id to the file. The green regen
    icon was still right, so the id moved and the art did not.
- **HP bar ghost layer** (`hasStatus.pendingHeal`) no longer includes Recovery:
  a rate has no finite amount owed to draw past current HP. It still covers the
  absorb pool.

## 8. Deliberately left for the balance / item pass

### Progression rework Phase 0 (2026-09-30) — provisional pending progression rework

The coarse HP/recovery pass from `progression-rework-plan.md` Phase 0. One change:
**`GAME_CONFIG.PLAYER_RECOVERY` 10 → 5.** Base max HP, the in-combat fractions, Second
Wind/Brace ranks and charm values were left alone. Everything below is from the
in-process bench `server/bench/phase0Recovery.ts` (Docker was down, so the live-bot
`combat.fights` column — the real phase gate — is still unmeasured): ttkSurvey reference
bot, +3 gear, capped mastery, reference ability wiring, 300 s per cell × 2 seeds, T1 root
and T2 light/heavy frames per root on `node-t1/t2-plains-03` and `-forest-03`. Deaths
revive in place. Reports: `reports/progression-phase0/baseline` and `recovery-5`.

Metric per fight: HP fraction at fight end and share of fight time inside 20–80% HP
(target: median end 0.40–0.60, time in band > 0.50).

| | baseline (Recovery 10) | Recovery 5 |
|---|---|---|
| Plains, every class, T1 and T2 | median end 0.98–1.00, in band 0.00–0.03 | 0.93–1.00, 0.00–0.07 |
| Forest T1 roots (melee: Striker, Squire, Conduit) | 0.80–0.90 / 0.23–0.31 | 0.74–0.89 / 0.14–0.42 |
| Forest T1 roots (ranged: Apprentice, Slinger, Spirit) | 0.00–0.81 with 5–8 deaths each | 0.34–0.56 / 0.29–0.49, 4–7 deaths |
| Forest T2 frames (12 cells) | 0.44–0.97 / 0.18–0.52 | 0.60–0.85 / 0.20–0.53; Striker heavy 0.60/0.53, Squire light 0.64/0.48, Striker light 0.67/0.50 |

What the sweep established (single-seed lever sweeps, deleted; the two runs above are kept):

- **Plains cannot reach the metric with player-side levers.** Intake per fight is 0.1–0.4 of
  max HP for every class at both tiers; even base max HP 50 left Plains at 0.83–1.00 while it
  made Forest T2 lethal. This is the monster-side Plains/Forest spread, carried to Phase 4.
- **Base max HP is the lethal lever, Recovery the safe one.** Forest intake is 0.4–0.9 of max
  HP per fight and in-fight healing covered 40–65% of it at Recovery 10. HP 60–80 produced
  6–11 deaths per 5-minute cell on Forest T2; Recovery 5 moved the same cells 0.1–0.3 down
  the HP scale with 0–2 deaths.
- **No burst.** The largest single hit anywhere was 19% of max HP (T2 Thorn Spitter on Spirit
  and Slinger light frames; T1 Wolf 10–14%). Forest deaths are pack attrition. The Phase 4
  "burst-lethal" list is therefore empty; the list that matters is Plains under-pressure.
- **Ranged roots die in Forest T1 at baseline too** (Slinger 8, Apprentice 5 deaths per 5 min
  at Recovery 10). Bot fidelity (orbit/kite against wolf packs) or a real T1 problem — flagged,
  not fixed here.
- **Second Wind.** At Recovery 5 rank I restores ~10% of max HP (was ~20%). Doubling
  `recoveryPct` with the bot's reference wiring (fires off cooldown in combat, i.e. at full HP)
  cancelled the Recovery cut on Forest, so the ranks were left alone; whether the button is now
  a timing decision is the human playtest's call, and if it reads too weak the fix is the ability
  rank, not the base rate.
- **Bench trap fixed on the way:** `reviveInFarmNode` never re-enabled auto-combat after a death
  (the live server clears it until the player acknowledges), so every farm bench went idle for
  good after its first death. Historical `--mode farm` income with deaths > 0 is suspect.

Fidelity caveats: the Conduit registers few "fights" because its summons engage while the
owner is untargeted; the bot's Recovery-on-kill and kiting behaviour are not a player's; +3
gear at capped mastery is a mature character, not a first arrival.

### Progression rework Phase 0b (2026-09-30) — flat Recovery, provisional

Same session, after the designer's call (bible §15, plan Phase 0b): Recovery became a
flat HP/s rate with a per-tier base and a fixed out-of-combat rate (§1). Charm
`stats.recovery` values (30 recipes, base and upgrade steps) were converted by each
tier's reference-pool factor (×1.3 / ×2 / ×3.3 / ×5.6 for T1–T4, ×1 for the Clearing
charm), so a character at exactly the reference pool heals what it did before; e.g.
Heartroot Amulet 3 → 3.9 HP/s, T2 charms 4–5 → 8–10, T3 7–10 → 23–33, T4 14 → 78.4.
Nothing else was retuned.

Same bench and cells as 0a (plus T3 cave/volcanic and T4 graveyard/tundra light/heavy
frames), 2 seeds, +3 gear; reports `recovery-flat`, `recovery-flat-seeds2`, `t34-after`.
(The T3/T4 "before" run taken at this point was invalid — it picked up the config edit
mid-flight and ran with base Recovery 0 — and was deleted; the pre-0b reference for
T3/T4 is the emulated `pre0b-*` runs of the charm sweep below.)

- **Healing rate vs the percentage model.** The bench bots sit 15–40% above the
  reference pools (T1 139–179 HP vs 130; T2 196–286 vs 200), so their in-combat healing
  fell to 0.70–1.02× of before — least on light frames (0.87–1.0), most on heavy frames
  and Squire (0.70–0.80). That is the intended shape (the pool no longer buys healing);
  it is not "unchanged within noise" for these bots, only for a character at the
  reference pool. (The T3/T4 ratios first recorded here were against the invalid
  baseline; see the charm sweep below for the real ones.)
- **Fight-end HP / time in band.** Plains: unchanged (0.90–1.00, ≤ 0.09 in band).
  Forest medians moved within seed noise for melee roots (Striker T1 0.72 → 0.83 / 0.63
  on fresh seeds; Squire light T2 0.64 → 0.57 / 0.56). Deaths rose where the bot was
  already marginal: Slinger T1 Forest 4 → 12 / 19, Striker T2 Forest 1–2 → 5–11. Death
  counts for the ranged roots swing by ±10 between seed pairs (Spirit T1 Forest 16 vs
  6), so only the Slinger T1 and Striker T2 Forest rises read as real.
- **OOC.** Empty-to-full is 10 s at every tier and ignores the stat (`recovery.test.ts`).

### Phase 0b charm sweep against the +3 pool (2026-09-30) — provisional

Per the plan's amended charm rule: the pool-factor conversion above preserved
*naked-equivalent* healing, but the charm's job under the flat model is to cover the gap
between the tier's entry pool and the pool a geared character carries. Every tiered
charm (30 recipes; the Clearing charm stays at 2) was re-derived against the **median
+3 pool** of the bench bots at its tier:

```
P3 = 156 / 234.5 / 446 / 755                  (T1–T4; every +3 bench bot, all classes and frames)
newBase = oldPct × P3/100 + 0.05 × (P3 − referencePool)     newStep = oldStepPct × P3/100
```

so a geared character with the charm heals what it did before at the median pool, the
reference pools are untouched, and a geared character without a charm heals less by
design. Results: T1 2.9–6 HP/s (Plains 2.9, Forest 6), T2 6.4–13.4, T3 19.2–50.4,
T4 55–115.4. Upgrade steps ×P3/100 (T1 0.8–1.6, T4 3.8–11.3). Derivation table:
`reports/progression-phase0/charm-derivation.json`; pre-0b values:
`old-charm-pct.json`.

**Time-to-death** (`server/bench/phase0Ttd.ts`): the bot fights in the charm's home
node with a constant pull of 1/2/3/4 aggroed monsters (T1–T4), cap 600 s, 2 seeds,
Striker and Slinger; pre-0b is emulated in the same world by writing
`maxHp × (5 + oldCharmPct)/100` into the stat every tick (report `ttd-plus3`; the
pool-factor values before the sweep are in `ttd-poolfactor`).

| arm | measurable cells (not capped both sides) | TTD new/old median | within ±10% |
|---|---|---|---|
| geared +3 with the tier's charm | 36 of 60 | **1.00** at every tier | 30 / 36 |
| geared +3, no charm | 52 of 52 | 0.93 / 0.99 / 0.92 / 0.94 (T1–T4) | lower by design |
| naked at entry | 8 of 8 | 1.02 / 1.09 / 1.19 / 1.15 | T1 yes; T3/T4 no |

Charm-arm outliers are the class-pool spread around the tier median: Striker (bigger
pool) on T3 Desert/Tundra 0.78/0.71 and T2 Slinger Mountain 0.67; Slinger (smaller pool)
on T4 Jungle 1.43–1.49. Naked-at-entry heals *more* at T3/T4 under the reference-pool
base (16.5 / 28 HP/s against a 120–140 HP naked pool, was 6–7 HP/s) — the table's
seeds assume entry gear; recorded, not tuned.

**Fight-end metric, all 84 open-node cells, 2 seeds** (`final-charm` / `final-geared`
vs the emulated `pre0b-charm` / `pre0b-geared`; `final-naked` dies every fight at T3/T4
and is uninformative): with the charm, healing new/old median 1.05 / 1.04 / 1.03 / 0.99
(T1–T4), deaths 26→27, 19→15, 1→0, 28→23, median fight-end HP unchanged (0.93/0.92,
0.92/0.92, 0.97/0.98, 0.93/0.94). Without the charm, healing 0.87 / 0.88 / 0.76 / 0.73
and deaths 27→52, 49→56, 21→18, 199→238.

**Live bot, once, Docker up** (`live-t1-striker`, `live-t2-striker`; 40 min each,
25× rewards, non-canonical, both bots on one server in different tiers, run at the 0b
pool-factor charm values because the server booted before the sweep landed):

| | fights | median end HP | time in band | deaths |
|---|---|---|---|---|
| T1 Plains (route incl. the dungeon) | 30 | 0.82 | 0.45 | 6 |
| T1 Forest | 7 | 0.58 | 0.52 | 2 |
| T2 Plains | 29 | 0.93 | 0.26 | 4 |
| T2 Forest | 18 | 0.41 | 0.55 | 6 |

The Forest columns sit on the Phase 0 target (0.40–0.60, >0.50); Plains stays high as
the bench predicted. This is the first live `combat.fights` reading; it is not a
canonical run.

Open from the sweep: the naked-at-entry T3/T4 over-heal (a reference-pool question,
deliberately not touched); the class-pool spread the median-P3 derivation cannot fix
(per-class charm values would); the bot's charm pick was not re-checked (routes use
fixed gear plans); then the player pool raise, bosses first.

### Still open

- Every coefficient. The Striker pulse (20% for 4s every 6s), Slinger on-kill
  (20% for 4s) and Second Wind (50% for 4s) were picked to land near the old
  throughput at baseline Recovery 10, not because they are right; Phase 0 halved
  the base rate under them without retuning any of them.
- **All item data.** No charm changed identity here. The Plains/Forest/Swamp
  re-key and the +0…+5 tables in `design_docs/T1_ITEM_NUMERICAL_BASELINE.md` §9
  are the item rework's job — this pass only made the mechanics they need exist.
- Whether extreme Recovery stacking eventually needs a cap.
- `tools/ehp-report.ts` models Recovery access by duty cycle but **omits on-kill
  Recovery entirely** (it has no kill-cadence model). Charms carrying it are
  flagged `(on-kill Recovery undercounted)` rather than silently reading as dead
  weight — do not treat that column as a balance signal.
