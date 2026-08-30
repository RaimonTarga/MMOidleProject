> **ARCHIVED — fulfilled 2026-08-23; live state in `docs/tier-balance-current-state.md`.**
> Kept for its measurement of where T2-T4 sat before the pass and the instrument-gap list it set.

# T2–T4 Numerical Baseline — Fresh-Session Handoff

> **FULFILLED 2026-08-23 — live state in [`../tier-balance-current-state.md`](../tier-balance-current-state.md).**
> Kept for the pre-pass measurements in §4 and the instrument-gap list in §5, both of which
> are still the record of what was wrong. Two things here were overtaken by the work:
> §3's ordering questions are all answered, and §2's "first biome is the measured anchor"
> method does **not** generalise past T1 — T2–T4 anchor by chaining from T1's floor instead.

**Prepared:** 2026-08-23
**Purpose:** establish a numerical baseline for tiers 2–4, the way
[`t1-balance-context-2026-08-18.md`](t1-balance-context-2026-08-18.md) did for T1.
**Scope:** baseline only. This is **not** a taste/balance pass — it sets the ladder the
later tuning pass will tune against.
**Prerequisite shipped:** the T1–T4 monster combat rework
([`monster-combat-rework-current-state.md`](../monster-combat-rework-current-state.md),
commits `952e528` + `de4ea14` on `develop`). Structure is settled, so measuring now
measures what will ship.

---

## 1. Starting prompt for the next session

> Read `CLAUDE.md`, `design_docs/architecture.md`, this brief, and
> `docs/briefs/t1-balance-context-2026-08-18.md` completely. We are establishing the
> T2–T4 numerical baseline using the same method T1 used. Do NOT change any monster
> stats until §3's ordering questions are answered and the resulting target table is
> reviewed. Start by fixing the instrument gap in §5, then regenerate the tier tables.

Supporting reads: `design_docs/player-power-curve.md`,
`docs/briefs/tier-by-tier-monster-balance-handoff-2026-08-13.md` (§2 locked decisions,
§8 collaboration gates), `tools/tier-table.ts`.

---

## 2. The method, as locked for T1

Two per-stage multipliers along an agreed biome order, with the **first biome measured,
not targeted** — it is the anchor and stays untouched.

| axis | T1 target | what it is |
|---|---|---|
| Sustained pressure | **×1.20 / stage** | `d(N+1)/2` — incoming DPS the player must out-sustain. eHP and player DPS both cancel out, so this is purely a per-mob-DPS and concurrency statement. This is the "20% stronger" axis. |
| Effective HP | **×1.41 / stage** | how chunky a mob is; lands the last biome at ~4× the anchor |
| Cost per kill | ×1.70 / stage | *derived*, compounds from the two above — do not set it directly |

**T1 achieved this cleanly.** Current measured ladder (from `reports/tier-1-table.md`):

| biome | sustained | step | eHP@13 | step |
|---|---:|---:|---:|---:|
| Plains (anchor) | 23.2 | — | 71 | — |
| Forest | 27.3 | ×1.18 | 102 | ×1.44 |
| Swamp | 32.9 | ×1.21 | 138 | ×1.35 |
| Mountain | 40.6 | ×1.23 | 196 | ×1.42 |
| Caverns | 48.2 | ×1.19 | 249 | ×1.27 |

Geometric mean ×1.20 sustained / ×1.37 eHP over four steps. That is the shape to
reproduce at T2, T3 and T4.

---

## 3. ⚠ BLOCKING INPUT — the ordering is yours to set

Per [tier-by-tier handoff §2.3](tier-by-tier-monster-balance-handoff-2026-08-13.md):
*"the exact biome ordering and exact checkpoint assigned to each T2 biome are **not
locked yet** … Do not silently infer a canonical seven-biome order from map or database
iteration order."* §8 lists it under **Must return to the user**.

Each tier has seven biomes. The **placeholder** orders currently in
`tools/tier-table.ts` (`PROGRESSION`, line 90) are explicitly marked as such:

```
2: plains, forest, swamp, mountain, cave, jungle, desert
3: jungle, swamp, mountain, desert, tundra, volcanic, cave
4: jungle, volcanic, graveyard, mountain, desert, tundra, trench
```

Three questions to settle before any numbers move:

1. **The order itself**, per tier. New arrivals are Jungle + Desert (T2), Tundra +
   Volcanic (T3), Wasteland + Trench (T4).
2. **Does each tier re-anchor, or does the ×1.20 chain run continuously?** i.e. does T2
   Plains restart the ladder at 1.00, or does it continue from T1 Caverns? This decides
   whether tier boundaries are a step up or a reset.
3. **Do returning biomes keep their T1 relative positions?** Or may Jungle slot between
   Swamp and Mountain, reordering the veterans?

---

## 4. Where the tiers actually sit today

Measured from the post-rework roster (`pnpm tier:table --tier N`). Rows are in the
tool's current placeholder order, so read the **values**, not the sequence.

### T2 — unordered, and Desert is the softest thing in the tier

| biome | density | N | sustained | eHP@13 | cost/kill |
|---|---:|---:|---:|---:|---:|
| Plains | 48 | 5 | 40.3 | 109 | 4 416 |
| Forest | 36 | 3 | 33.9 | 138 | 4 661 |
| Swamp | 20 | 2 | 29.1 | 531 | 15 439 |
| Mountain | 24 | 2 | 26.7 | 340 | 9 082 |
| Caverns | 16 | 2 | 29.1 | 822 | 23 956 |
| **Jungle** | 40 | 4 | **66.9** | 213 | 14 269 |
| **Desert** | 16 | 2 | **23.0** | 313 | 7 203 |

Sustained pressure currently reads `1.00 → 0.84 → 0.72 → 0.66 → 0.72 → 1.66 → 0.57`
against the placeholder order — i.e. **descending, then a 2.9× spike at Jungle**. Jungle
is nearly 3× Desert. T2 has never had a ladder.

### T3 — also unordered

| biome | N | sustained | eHP@? | cost/kill |
|---|---:|---:|---:|---:|
| Jungle | 4 | 53.3 | 473 | 25 219 |
| Swamp | 2 | 54.1 | 1 398 | 75 636 |
| Mountain | 2 | 35.9 | 730 | 26 221 |
| Desert | 2 | 30.8 | 685 | 21 067 |
| Tundra | 2 | 25.9 | 783 | 20 278 |
| Volcanic | 3 | 36.9 | 643 | 23 717 |
| Caverns | 2 | 47.6 | 1 643 | 78 221 |

### T4 — inverted: the apex biome is the *softest* on sustained

| biome | density | N | sustained | eHP@44 | cost/kill |
|---|---:|---:|---:|---:|---:|
| Jungle | 40 | 4 | **135.2** | 1 100 | 148 748 |
| Volcanic | 36 | 3 | 105.1 | 1 591 | 167 165 |
| Wasteland | 28 | 4 | 119.6 | 617 | 73 767 |
| Mountain | 24 | 2 | 59.9 | 2 078 | 124 458 |
| Desert | 16 | 2 | 57.0 | 1 662 | 94 631 |
| Tundra | 16 | 2 | 45.7 | 2 867 | 130 882 |
| **Deep-Sea Trench** | 10 | 1 | **42.1** | 7 790 | 328 298 |

Trench is intended as the T4 ceiling but carries the **lowest** sustained pressure in the
tier, because `N=1` collapses `d(N+1)/2`. Its eHP (7 790) and cost/kill (328k) are by far
the highest, so it is *long* rather than *dangerous*. Whether that is the intent for an
"every enemy is a mini-boss" biome is a design question, not a tuning one — the encounter
model may simply not describe a 1-at-a-time biome the way it describes a swarm.

---

## 5. ⚠ Fix the instrument BEFORE trusting these numbers

`tools/tier-table.ts` predates the monster rework and **does not see the new
primitives**. Monsters that carry a real mechanic are being reported under *"carrying no
mechanic at all — pure stat blocks"*:

| monster | actually carries | tool sees |
|---|---|---|
| Thorn Spitter | `cadenceVolley` (2 hits every 3rd beat) | nothing |
| Canopy / Thornback Chameleon | `openingVolley` (2 / 3 hits) | nothing |
| Bog Witch | Wither (`chargedAttack` + `appliesAntiheal`) | nothing |
| Mire Hexer | Wither + Plague Hex (`refreshesPlayerDots`) | nothing |
| Carrion Vulture | `empowersAllies` (+25% ally attack speed) | nothing |

Consequences for the baseline:

- **DPS is understated** for every volley mob — a `cadenceVolley` beat is 2–3 full
  pipeline hits, so Forest/Jungle per-mob DPS is low by a real margin.
- **Wasteland is understated twice**: the Vulture's ally haste is uncounted, and its
  density already dropped 40 → 28 in the rework.
- Charged attacks with `multiplier: 1.0` (the pure-control abilities — Gaze, Wither,
  Frostbind) register as neither a spike nor a mechanic, so **Desert and Tundra's
  control pressure is entirely invisible** to the table.

The tool also needs, once the order is agreed:
- `PROGRESSION` (line 90) updated with the real orders;
- `TARGETS` (line 129) extended — it currently has **only** tier 1:
  `1: { sustainedPerStage: 1.20, ehpPerStage: 1.41 }`. Adding tiers 2–4 is the literal
  hook for this work;
- `CONCURRENCY` (line 107) validated. Only the T1 values are locked with you
  (2026-08-17); `jungle: 4, desert: 2, tundra: 2, volcanic: 3, graveyard: 4, trench: 1`
  are **unvalidated design intent**. N is the single most load-bearing term here —
  `sustained` and `pull load` are linear and quadratic in it respectively.

⚠ **Known trap:** the concurrency input was measured wrong once already (2026-08-18).
The farm bench is the validation path, but it has a time-scale fidelity ceiling of 2 and
a permanent auto-combat wedge on mountain nodes. Validate N deliberately, and do not
take a single bench run as authoritative.

⚠ **Do not use the balance vacuum to rank biomes.** Flat plating makes armour answer
different biomes unequally (~16× spread), so the vacuum cannot produce a difficulty
ordering. That is what the encounter model in `tier-table.ts` (`sustained` /
`cost/kill` / `pull load`) is for; those are valid **only** as biome-vs-biome ratios.

---

## 6. What the rework moved — read before treating today's numbers as intent

The monster rework was mostly structural, but its removals were concentrated in exactly
the T3/T4 biomes being baselined, and are nearly all net difficulty *reductions*. **A
baseline computed from today's roster without this context will bake the drop in as if
it were designed.**

| biome | change | direction |
|---|---|---|
| Volcanic | 9 mobs lost `rampOnCombat`; caps ran **+50% to +80% attack** at full ramp | ↓↓ large |
| Wasteland | 5 of 6 DoTs removed; density **40 → 28**; `charnel-brute` (tanky anchor) deferred out of the pool | ↓↓↓ largest |
| Desert | controllers pull **1 dealer, not 2** (≈ halves dealer DPS); sunder **+32%/+40% → +12%/+18%**; all dealer slows removed; scorpion attack **32→14, 38→18, 78→30** with HP roughly doubled | ↓↓ damage collapses, kill time rises |
| Trench | anti-heal **75–90% → one 28% debuff on the Serpent only**; Leviathan soft-cap removed; Stalker HP 2500→2000, DR .16→.10, plating 15→20, now a ranged kiter | ↓↓ |
| Jungle | evasion (2 mobs), DR (3 mobs), opening strikes (3 mobs) removed; volleys add some back | ↓ moderate |
| Tundra | slows + `rampDebuff` + soft-cap removed and shatter now *helps* the player, but Chill gained an attack-slow and Frostbind is a new root | ↔ genuinely mixed |

Two of these were agent judgment calls rather than the design doc's instruction, and
they are the sharpest movers — **Wasteland density 40 → 28** and the **scorpion restat**.
Revisit both explicitly during the baseline; either is a legitimate thing to undo.

Also unresolved from the rework: Volcano's lava-pool scaling was never measured against
the biome's total damage, and every magnitude the rework added is a placeholder
(shell-up thresholds, volley counts, root durations, Wither/Bite suppression, Chill's
new 4%/stack attack term).

---

## 7. Suggested order of work

1. Answer §3 (ordering). Nothing else can start.
2. Fix §5's instrument gaps — volley hit counts in DPS, control-only charged attacks as
   mechanics, `empowersAllies`. Regenerate all four tier tables.
3. Validate `CONCURRENCY` for the six non-T1 biomes; treat N as the primary lever.
4. Produce the target table: for each tier, anchor biome measured, then ×1.20 sustained
   and ×1.41 eHP per stage. **Review with the user before touching monster data.**
5. Apply per-biome, one biome at a time, re-running `pnpm tier:table` after each.
6. Reconcile rewards last — T1's reward scale is still flagged unreconciled in its own
   brief, and cost/kill compounding at ×1.70 will move what a fair payout looks like.

Verification each step: `pnpm typecheck`, then `pnpm test` after shared/server changes.

---

## 8. Commands

```bash
pnpm tier:table --tier 2      # writes reports/tier-2-table.md (also 1, 3, 4)
pnpm mob:report               # monsters vs reconstructed reference players
pnpm bench:balance            # farm bench — concurrency validation (see §5 traps)
```
