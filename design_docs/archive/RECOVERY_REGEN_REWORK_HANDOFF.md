> **ARCHIVED — implemented 2026-08-22; live state in `docs/recovery-current-state.md`.**
> Kept for rationale. Two things shipped differently from this document:
> the passive keys were renamed into `defense.recovery-*` vocabulary rather than
> keeping the old `regen-burst`/`kill-burst` names, and **no item data was changed** —
> the §4 charm conversions and the numerical baseline's §9 tables are the separate
> item rework's job. `guard.recovery-on-fire-pct` was converted too, which this
> document does not mention.

# Recovery / Regen Rework — Implementation Handoff

**Status:** Design locked; numerical coefficients remain tunable  
**Scope:** Recovery stat semantics and conversion of existing fixed-% regen effects into Recovery-based effects  
**Parallel work:** Can be implemented alongside the Barrier rework, but Recovery and Barrier should remain separate systems.

---

## 1. Core Recovery definition

Rename/conceptualize the existing `hpRegen` stat as **Recovery**.

> **1 Recovery = 1% of max HP restored per second while 100% Recovery is active.**

Examples:

- 5 Recovery at 100% activity = 5% max HP/sec.
- 10 Recovery at 100% activity = 10% max HP/sec.
- 10 Recovery at 25% activity = 2.5% max HP/sec.

Current naked player baseline remains:

```ts
PLAYER_HP_REGEN: 10
```

This is therefore **10 Recovery**.

Out of combat, after the normal OOC recovery delay, the player receives **100% of Recovery**.

---

## 2. In-combat Recovery model

Effects that provide healing over time in combat should generally stop using independent fixed `% max HP` healing formulas.

Instead, they should activate a stated fraction of the player's Recovery rate.

Conceptual formula:

```text
healingPerSecond =
    maxHp
    × (Recovery / 100)
    × activeRecoveryFraction
```

Example:

```text
Recovery = 10
Effect grants 30% Recovery

10% max HP/sec × 0.30
= 3% max HP/sec
```

---

## 3. Stacking

Recovery-access effects from different sources should **add**.

Example:

```text
Squire passive:       10% Recovery
Plains charm:         30% Recovery
Second Wind:          50% Recovery
----------------------------------
Total:                 90% Recovery
```

Do not multiply these fractions together.

Do not impose a universal 100% cap for now. If highly specialized builds temporarily exceed 100% Recovery activity, evaluate that through balance tooling instead.

The same named/self-refreshing effect should not stack multiple copies unless explicitly designed to do so.

---

## 4. Effects to convert

### Squire

Squire already uses the desired model.

Its sustain should simply be expressed as:

> **A small fraction of Recovery remains active continuously during combat.**

No conceptual redesign required.

---

### Striker / Cadence regen pulse

Replace the current fixed `% max HP over 4 seconds` heal with:

> **Periodically activate a fraction of Recovery for a short duration.**

The previous behavior can be approximately preserved with a suitable Recovery fraction.

Example first-pass target:

```text
20% Recovery for 4 seconds
```

At baseline Recovery 10:

```text
10% × 0.20 × 4
= 8% max HP total
```

Exact interval/fraction remains tunable.

---

### Second Wind

Replace the fixed max-HP HoT with:

> **Activate a substantial fraction of Recovery for 4 seconds.**

Recommended first-pass seed:

```text
50% Recovery for 4 seconds
```

At baseline Recovery 10:

```text
10% × 0.50 × 4
= 20% max HP total
```

Second Wind should scale naturally with:

- Recovery;
- Recovery Skill Potency;
- future Recovery-focused equipment.

Its cooldown and future tier scaling are **not part of this implementation pass**.

---

### Plains charm

Replace instant `% max HP` healing on kill with:

> **On kill, activate a fraction of Recovery during combat for a short duration.**

Rules:

- suggested duration: 4 seconds;
- further kills refresh duration;
- the charm does not stack multiple copies of its own buff;
- intended for dense chain farming;
- intentionally weak against bosses / isolated enemies.

First-pass T1 range from the numerical baseline:

```text
+0: 20% Recovery for 4s
...
+5: 30% Recovery for 4s
```

---

### Swamp charm

Move the periodic regen-burst identity to Swamp.

Replace fixed `% max HP` burst healing with:

> **At a regular interval while in combat, activate a fraction of Recovery for a short duration.**

First-pass seed:

```text
Every 8 seconds:
activate 20% Recovery for 4 seconds
```

Upgrade progression can reach roughly:

```text
+5: 30% Recovery for 4 seconds
```

The effect should not stack overlapping copies of itself.

This is intended to counter sustained attrition and DoT pressure.

---

## 5. Recovery Skill Potency

Add/support a separate stat:

> **Recovery Skill Potency**

This modifies Recovery-tagged **skills**, not the Recovery stat globally.

Example:

```text
Second Wind activates 50% Recovery.
Player has +20% Recovery Skill Potency.

50% × 1.20
= 60% Recovery
```

This gives two separate build axes:

- **Recovery** = stronger overall healing engine.
- **Recovery Skill Potency** = stronger Recovery-tagged active skills.

Recovery Skill Potency should not improve:

- Squire passive Recovery access;
- Striker passive Recovery pulses;
- Plains charm;
- Swamp charm;
- Barrier;
- Absorb;
- Cleanse;
- damage reduction.

Unless a future design explicitly tags an effect as a Recovery **skill**.

---

## 6. Forest charm relationship

The Forest T1 charm becomes the foundational Recovery-investment charm.

Its intended structure is:

- comparatively high raw Recovery;
- Recovery Skill Potency.

First-pass numerical baseline:

```text
+0: +3 Recovery, +10% Recovery Skill Potency
...
+5: +5 Recovery, +15% Recovery Skill Potency
```

Do not hard-code it specifically to Second Wind.

Use a Recovery skill tag/category.

---

## 7. Systems that remain separate

### Barrier

Barrier is **not Recovery**.

Recovery does not improve by default:

- Barrier capacity;
- Barrier recharge rate;
- Barrier recharge delay.

Those belong to the separate Barrier system.

### Absorb

Absorb is also separate.

Absorb should scale from its incoming-damage mechanic, not from Recovery or max-HP healing formulas.

Do not make Recovery modify Absorb unless explicitly designed later.

### Cleanse

Cleanse is not part of this pass.

Its stack removal, cooldown, tier evolution, and item interactions will be handled in the dedicated skill/status pass.

---

## 8. Implementation guidance

Prefer a shared Recovery-access mechanism rather than bespoke healing code for every effect.

Useful conceptual representation:

```ts
type RecoverySource = {
  fraction: number;      // 0.30 = 30% of Recovery
  durationMs?: number;   // omitted for permanent access
  sourceId: string;
};
```

At runtime:

```text
activeRecoveryFraction =
    sum(all active compatible Recovery sources)
```

Then:

```text
healingPerSecond =
    maxHp
    × Recovery%
    × activeRecoveryFraction
```

Self-refreshing timed effects should refresh their own timer instead of adding another copy.

Implementation details may differ from this shape; the important part is that all Recovery-based effects share the same underlying semantics.

---

## 9. Known tuning unknowns

The design itself is considered locked.

The following values are intentionally **not** locked and should be balance-tested after implementation:

- Striker pulse fraction and interval;
- Second Wind fraction and cooldown;
- Plains charm fraction/duration;
- Swamp charm fraction/interval;
- exact Recovery values on charms;
- whether extreme Recovery stacking eventually needs a cap.

These are numerical balance questions, not architecture questions.

---

## 10. Final rule

> **Recovery is the canonical HP-restoration rate. In-combat regen effects activate some fraction of that rate instead of inventing separate fixed-% max-HP heals.**

This creates one scalable healing engine that can be shared by classes, skills, and items while keeping Barrier and Absorb as distinct defensive systems.
