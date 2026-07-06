> **HISTORICAL (archived 2026-07-07).** T4 authoring prompt; T4 shipped. Kept for rationale. Not current.

# Claude Code Task: T4 Monster Mechanics

## Context
We're adding Tier 4 monsters. Most of the damage/effect mechanics they need **already exist for the player side** — the work is largely porting those mechanics so monsters can use them against the player, plus adding four genuinely new monster-side fields. Monster definitions live in the per-biome monster files (same structure as the existing T3 biome monster files). The `MonsterDefinition` type needs new optional fields.

**Before writing code:** read the existing player-side implementations of these mechanics (cadence empowered attack, cooldown empowered attack, the energy/Mountain shield, and the damage-cap/`max-hit` logic) and reuse that math rather than reinventing it. The goal is symmetry — a monster's "cadence finisher" should resolve through the same damage pipeline as a player's empowered attack, just sourced from the monster.

---

## 1. New `MonsterDefinition` fields (add to the type)

All four are optional. Add them to the `MonsterDefinition` interface/type.

```ts
// Every Nth basic attack is multiplied. Deterministic counter, resets after firing.
cadenceFinisher?: { everyNAttacks: number; multiplier: number };

// On a fixed timer, the next attack is multiplied. Timer starts on combat entry.
empoweredCooldown?: { cooldownMs: number; multiplier: number };

// Periodic absorb barrier on the MONSTER (mirrors player shield mechanic).
enemyShield?: { shieldPct: number; intervalMs: number; durationMs: number };

// Clips the PLAYER's large hits against this monster (mirrors player max-hit/damage-cap).
enemySoftCap?: { capPct: number; capMult: number };
```

---

## 2. `cadenceFinisher` — port of player cadence empowered attack

**Reuse the player cadence mechanic.** The player already has "every N attacks, next attack is empowered ×mult" (cadence root + `cadence.empowered-threshold` / `cadence.empowered-mult`). Apply the same logic to a monster:

- Maintain a per-monster attack counter (increment on each basic attack that lands/fires).
- When `counter % everyNAttacks === 0`, that attack's outgoing damage is `baseDamage × multiplier`.
- Deterministic — no RNG. Counter persists for the monster's combat lifetime; reset on leash/despawn is fine.
- The multiplied hit goes through the **normal player damage pipeline** (so the player's damage-cap armor, shields, DR, plating all apply to it correctly). This is the whole point — these spikes are what the player's damage-cap armor is meant to answer.

**Used by:** granite-mammoth (4, ×2.0), emerald-constrictor (4, ×2.0), rime-tusk-mastodon (4, ×2.0), obsidian-tortoise (4, ×2.2), charnel-brute (4, ×2.4), hadal-stalker (5, ×2.8).

---

## 3. `empoweredCooldown` — port of player cooldown empowered attack

**Reuse the player cooldown mechanic.** The player's cooldown class fires an empowered attack every N seconds (`cooldown.empowered-cd-ms` / `cooldown.empowered-mult`). Apply to a monster:

- Start a timer when the monster enters combat.
- When `cooldownMs` elapses, the monster's **next** basic attack is multiplied by `multiplier`, then the timer resets.
- If the monster isn't able to attack the instant the timer expires, the empowered state should "wait" and apply to the next actual attack (don't waste it on a tick where no attack happens).
- Deterministic. Goes through the normal player damage pipeline (cap/shield/DR/plating apply).

**Used by:** cragback-rhino (10000ms, ×3.2), dune-tyrant (10000ms, ×2.8 — note this one ALSO applies its `slowEffect` on the empowered hit), permafrost-behemoth (9000ms, ×3.0), abyssal-serpent (10000ms, ×3.4), elder-leviathan (12000ms, ×3.0).

**Note on dune-tyrant:** the existing `slowEffect` on that monster should be applied specifically on the empowered slam, not on every basic attack. If that's awkward with the current effect system, flag it — a simpler fallback is applying the slow on every hit, which is acceptable.

---

## 4. `enemyShield` — port of the player shield mechanic onto monsters

**Reuse the player shield mechanic** (the periodic `defense.shield-pct` barrier used by Energy root / Mountain charm). Apply it to a monster as a self-buff:

- Every `intervalMs`, the monster gains a shield equal to `shieldPct × monster.maxHp`, lasting `durationMs`.
- The shield absorbs incoming player damage before the monster's HP (same as the player's shield absorbs before HP).
- While the shield is up, the monster takes no HP damage until the shield is depleted.
- This is the "rewards burst, punishes DoT/chip" mechanic — a big burst hit pops the shield in one go; chip/DoT wastes ticks against it.

**Used by:** sandspitter-cobra (0.22, 12000ms, 6000ms), magma-salamander (0.28, 14000ms, 5000ms), elder-leviathan (0.30, 16000ms, 6000ms).

---

## 5. `enemySoftCap` — port of the player damage-cap (`max-hit`) onto monsters

**Reuse the player damage-cap logic** (`defense.max-hit-pct` / `defense.max-hit-mult` — the Mountain/Cadence mechanic where a hit above X% of maxHP is multiplied down). Apply the same clipping to **player hits landing on the monster**:

- When the player deals a single hit to a monster with `enemySoftCap`, if that hit exceeds `capPct × monster.maxHp`, the portion is multiplied by `capMult` (i.e. the hit is clipped down).
- This is the mirror of the player's own damage cap, just protecting the monster.
- Effect: punishes slow/empowered single-big-hit builds, rewards fast consistent damage (and pierce). Partial only — never reduces a hit to zero.

**Used by:** cragback-rhino (0.25, 0.5), permafrost-behemoth (0.25, 0.5), elder-leviathan (0.25, 0.5).

---

## 6. Reused fields that already work (no new code, just populate)

These already exist in the engine from T3 and earlier. The T4 monsters use them; just make sure the new biome monster files are wired in the same way the T3 files are:

- `chargeOnAggro`, `kite`, `isRanged`, `slowEffect`, `dotEffect`, `rampOnCombat`, `rampDebuff`, `evasion` — all already implemented. T4 monsters reuse them unchanged.

**One thing to verify:** `evasion` on a monster (silverback, emerald-constrictor use 0.25) — confirm monster-side evasion uses the same deterministic 1-in-N counter as the player's evasion (dodge the player's every-Nth hit), NOT a random roll. If monster evasion doesn't exist yet, port the player's deterministic evasion counter.

---

## 7. Wiring / integration

- Register the new biome monster files (graveyard, trench) the same way existing biome files are registered (e.g. the `index.recipes.ts`-equivalent for monsters).
- Trench and Graveyard are new biomes — ensure their `biome` keys are recognized.
- The biome spawn pools / densities are a SEPARATE task (not in this prompt) — this task is just the monster definitions + mechanics.

---

## 8. Determinism requirement (applies to everything above)

All four new mechanics must be fully deterministic — countable conditions, no RNG. Cadence uses an attack counter, cooldown uses a timer, shield uses a timer, soft-cap is a threshold check. This matches the game's core "no RNG" invariant. Do not introduce any random rolls.

---

## 9. Suggested implementation order

1. Add the four new fields to `MonsterDefinition`.
2. `cadenceFinisher` + `empoweredCooldown` (both reuse player empowered-attack math; do them together).
3. `enemySoftCap` (small — threshold check on incoming player damage; reuses player damage-cap math).
4. `enemyShield` (reuses player shield math, applied to monster HP pool).
5. Verify monster `evasion` is deterministic (port from player if missing).
6. Wire in the new biome files and confirm the existing reused fields work on the new monsters.

Do NOT tune numbers — the values in the monster files are already balanced. This task is mechanics implementation only.
