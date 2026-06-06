# Boss Design — philosophy, layer curve, stat anchors

The reference for all boss work (rebalancing earlier tiers + building new ones).
Companion to design-bible.md (combat invariants) and player-power-curve.md (numbers).

## Core philosophy

A boss is its **tier's trash theme concentrated into one unavoidable entity**, plus
**one new structural layer per tier** — and that layer mirrors what the *trash* of
that tier teaches. A boss can't lean on swarm volume, so it must threaten even a
tank alone: big per-hit + reach + a gap-closer, never a sponge.

All boss mechanics obey the combat invariants:
- **No-dodge / build-test, not reflex-test.** The player has no inputs but the
  charge↔kite toggle, so boss mechanics must test *gear coverage*, never execution.
  A phase changes *which mitigation matters*; a generalist sails through, a narrow
  specialist has a harder back half. That's a gear check, idle-compatible.
- **Deterministic.** Phases trigger on HP%; enrage on a combat timer; rhythm on hit
  counts. Never RNG.
- **Capped / winnable.** Enrage and any ramp are capped — no fight is unwinnable.
- **Separated budgets, no regression.** Nothing reduces player eHP; every tier's
  boss is strictly above the last.

## The per-tier layer curve

Each tier adds ONE layer on top of the previous. The layer echoes that tier's
trash theme, so bosses and trash teach the same lesson from different angles.

| Tier | Trash theme | New boss layer | Trigger | Tests |
|---|---|---|---|---|
| T1 | mitigation archetypes | pure shape (the floor) | — | handling the biome's one shape, solo |
| T2 | conditional/reactive + debuffs | **+1 HP-threshold PHASE** (a 2nd shape) | HP ≤ 50% | build *coverage*, not a single hard-counter |
| T3 | range & position | **phase FLIPS range stance** + **capped enrage ramp** | HP ≤ 50% + timer | positioning/toggle + soft DPS check |
| T4 | enemy defenses & weapon matchups | **+defense-break window** (brief harden/shield) | deterministic window | burst or armor-strip (brittle/Sunder) |
| T5 | packs / AoE | **+adds** | HP thresholds | AoE/cleave once it exists |

T4 and T5 layers are **future** — gated to when enemy-defenses and packs land, exactly
as on the trash side.

## Layer details

### T2 — the phase (start here)
At 50% HP the boss swaps to / adds a **second damage shape** (usually its biome's
secondary threat or a neighboring cross). One threshold, one shift. This is the
boss analog of the trash "+cross" and the cleanest way to teach players what a
phase is. Implemented via the phase-override system (HP threshold → stat/behavior
overrides: change attackStyle, start a dotEffect, change speed, add chargeOnAggro,
flip isRanged, etc.).

### T3 — range-flip + enrage
The phase now also **flips the boss's range stance** (e.g. P1 melee charger → P2
ranged/kiting, or vice-versa) so no single range pick is safe for the whole fight —
ties bosses to T3's range axis. On top, a **capped enrage** lights at the phase or
on a timer: attack (or attack-speed) ramps over the fight, clamped. Reuses the
Volcano `rampOnCombat` mechanic, boss-tuned. "Out-DPS or out-sustain." Add **one
layer at a time** — T2 is *just* the phase; enrage waits for T3.

## AoE / cleave on slow-heavy bosses (anti-summon guardrail)

**Problem:** a slow heavy single-target swing overkills a cheap, fast-respawning
summon. The summoner out-spawns the boss's cooldown, so every slam is wasted on a
1-HP body and never reaches the player — slow bosses get trivialized by body-blocking.

**Rule:** **slow/heavy bosses cleave** — one swing hits all targets (player +
summons) in a radius. Clears several bodies per swing and reaches the player behind
the wall. Scope it tightly:
- **Cleave:** the cap-tripper slammers — Mountain, Cave, Tundra, slow Volcano/Swamp
  bruisers. (Retrofit onto the existing slow T1/T2 bosses too.)
- **Single-target:** fast bosses (Forest, Jungle) — their swing rate already keeps
  pace with spawns; AoE on a fast boss would over-punish the summoner.

Reads thematically (giant's slam is wide, fast slasher's bite is not). Same
per-target damage, so it never increases the hit on the player or reduces eHP — it
only stops the boss being body-blocked. This is a *guardrail*, not the T5 AoE theme,
so it's allowed early. Interacts with the pending summoner rework but stands alone.
Also incidentally party-relevant (a cleaving boss can't be fully tank-walled).

Engine: `attackAoe: { radius }` — the attack applies to all boss-hostiles within
radius of the primary target.

## Stat anchors

Anchor to these, then sim/playtest. Trash medians from player-power-curve §3.

| metric | rule of thumb |
|---|---|
| boss HP | ~9–10× the tier's **median trash HP**, and ≥ ~2× the tier's **toughest elite** |
| boss HP growth | ~1.9–2×/tier (keeps boss TTK ~constant, ~30–45s) |
| boss per-hit | ~1.3–1.4× the biome's **biggest trash hit** |
| cap exam (Mountain/Cave/Tundra) | slam ≈ 40–50% of player pool (trips the damage cap hard) |
| anti-kite | **every** boss needs charge (if slow) or speed + reach — never kiteable to triviality |

### Per-tier values

| tier | median trash HP | toughest elite | boss HP | slammer atk |
|---|---|---|---|---|
| T1 | ~100 | ~350 | **~900–1100** (was 480–760 — bump; felt weaker than cave elites) | ~60–70 |
| T2 | ~200 | ~640 | ~2000–2400 (current ✓) | ~90 |
| T3 | ~440 | ~1400 | ~4000–4400 | **~120–130** (placeholders at ~100 are too soft) |

## Rebalance scope (what this implies for existing bosses)

- **T1 bosses:** HP bump ~1.8× (clearly above same-tier elites); add cleave to the
  slow ones (Mountain/Cave). No phase (T1 = pure shape).
- **T2 bosses:** add the one HP-threshold phase each; add cleave to the slow ones;
  numbers already roughly on-curve.
- **T3 bosses:** rebuild from scratch (placeholders are kiteable sponges with no
  biome mechanic). Phase + range-flip + capped enrage; cleave on the slow ones;
  attack bumped to ~1.3–1.4× trash big-hit; charge/reach so they aren't kiteable.

## New engine pieces

- **Phase-override system** — HP-threshold → apply overrides (attackStyle, dotEffect,
  speed, chargeOnAggro, isRanged, attackRange, start-enrage). *Skeleton already built.*
- **`attackAoe: { radius }`** — cleave for slow-heavy bosses. NEW.
- **Enrage** — reuses `rampOnCombat` (capped), no new system.
- Reused: chargeOnAggro, dotEffect, isRanged, attackRange, slowEffect.

Future (do not build yet): T4 defense-break window (needs enemy-defense axis),
T5 adds (needs packs).
