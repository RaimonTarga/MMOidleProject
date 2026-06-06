# Player Power Curve — Target Guideline (T0–T4)

**Status: TARGET / forward-spec, not an audit of current state.**
Passives are pulled from the agreed `rootsAndFrames_balanced.ts`. Items are
**unfinished** — so all gear contribution below is a *budget the items should be
tuned to hit*, not a readout of what's in the item files today. When we do the
item re-spec pass, aim items at the gear budgets in §5 and the player should land
in the bands in §4.

This is the third pinned doc. Paste it alongside `design-bible.md` and
`content-roster-t0-t4.md` at the top of a session. Its job: turn monster tuning
into a **lookup** ("does this threat sit in the right band vs the player?") instead
of a re-derivation.

> **Honesty caveat.** Absolute numbers are model estimates from the formulas in §2
> plus *guessed* gear budgets (§5). What's durable here is the **structure, the
> ratios, and the findings in §6** — those hold even when the exact gear numbers
> move. Treat the scalars as "right order of magnitude," not gospel, until an
> engine sim confirms exact stacking.

---

## 1. Confirmed base stats (T0 character, no class)

| Stat | Value |
|---|---|
| HP | 100 |
| ATK | 15 |
| Plating (PLT) | 2 |
| Damage Reduction (DR) | 0 |
| HP regen | 10% of maxHP per second, **out of combat**, after a 4s delay |
| Move speed | 120 |
| Base attack range | 12 (melee) |

Total attack = `15 + root + frame + weapon`. APS = `weapon.attacksPerSecond × (1 + Σ attackSpeedPct)`.
Tree depth: **T0 = root, T1 = +frame, T2 = +range node.** The tree as written
**stops at T2** — so in this doc, T3–T4 player growth comes entirely from **gear**,
with the class tree frozen at the T2 node. (When we add T3+ tree nodes, this doc's
T3–T4 player side will need a bump.)

---

## 2. Formulas used

- **Damage taken per hit** = `max(1, H − plating) × (1 − DR)`
  → note the `max(1, …)`: once **plating ≥ the incoming hit H**, you take **1 per hit**.
  This floor is the whole ballgame (see §6.1).
- **Cadence damage cap** (Cadence root only): any single hit `> 25% of maxHP` is
  multiplied by `0.5` *before* plating/DR.
- **Energy shield** (Energy root): treated as a flat `+30%` effective-HP buffer
  (30% pool, ~100% uptime: 10s duration, 10s interval).
- **Hits-to-die @ H** = `pool / damage-taken-per-hit`, where `pool = maxHP × (1 + shield%)`.
- **DPS** = `ATK × APS × mechFactor`, mechFactor = time-averaged class burst
  (e.g. Cadence "every 5th hit ×2" → `(4 + 2)/5 = 1.2×`; DoT conversion folds in as
  `×(1 + conv × ~0.9 uptime)`).
- **Survival time** vs an incoming DPS = `pool / max(0, incomingDPS − healRate)`.
  Regen/in-combat-regen feed `healRate`; if `healRate ≥ incomingDPS` you don't die
  (the immortality risk the bible's heal-throughput soft-cap exists to bound).
- **TTK** vs a monster = `monsterHP / playerDPS`.

> **Evasion (confirmed model).** Deterministic counter: each hit adds `evasion` to a
> counter; when it reaches 1 it drains 1 and the next hit is *dodged* — mitigated by
> `0.50 + evade-mitigation` (so Reload's +0.20 → 70% reduction on a dodge). `evasion`
> is therefore the dodge **rate** (0.25 → every 4th hit). Both scale via gear;
> mitigation caps at 100% (full negate), rate soft-caps ~0.75–0.85 (you can't dodge
> everything).
>
> **eHP multiplier = `1 / (1 − rate × mitigation)`.** Unlike plating, this is a
> **flat % across all hit sizes** — it does *not* hit the plating cliff (§6.1) and
> answers big single hits as well as small ones (initial hit only; not DoT ticks).
> That makes evasion the **dodge-tank** defense, complementary to plating's
> small-fast-hit specialization.

---

## 3. Recalibrated enemy reference curve

From the real monster data (replacing my earlier 24/45 guess). `H_med` = median
trash hit, `H_big` = hardest single *trash* hit (cap/threat relevance), `mob HP` =
median trash HP (TTK target), `mob DPS` = sustained DPS of one typical mob engaged.
Growth ≈ **1.9×/tier**.

| Tier | H_med | H_big | mob HP | single-mob DPS |
|---|---|---|---|---|
| T0 | 6  | 10  | 40  | 4 |
| T1 | 12 | 18  | 90  | 9 |
| T2 | 23 | 36  | 200 | 18 |
| T3 | 44 | 70  | 440 | 34 |
| T4 | 84 | 135 | 950 | 64 |

**Bosses sit well above `H_big`** (single hits of 0.3–0.6× player maxHP) and have
5–15× `mob HP`. They're the only single entity that should reliably threaten a tank
or trip the damage cap — tune them as a separate pass.

---

## 4. Player power bands (the lookup)

Representative builds. eHP is shown as the **honest view**: pool, the damage you
take per hit at the median and heavy enemy hit, and hits-to-die vs the heavy hit.
"Glass" = Energy-light, "Balanced" = Cadence-balanced, "Tank" = Cooldown-heavy.

### Survivability — damage taken per hit / hits-to-die @ H_big

| Tier | Build | Pool (+0→+3) | take @ H_med | take @ H_big | hits-to-die @ H_big |
|---|---|---|---|---|---|
| **T1** | Glass    | 166 → 179 | 8 → 6   | 14 → 12 | ~12 → 14 |
|        | Balanced | 161 → 173 | ~1      | 6.5 → 2 | ~25 → 85 |
|        | Tank     | 190 → 196 | <1      | <1      | 200+ (immune to trash) |
| **T2** | Glass    | 203 → 226 | 15 → 12 | 28 → 25 | ~7 → 9 |
|        | Balanced | 189 → 209 | 5.5 → 1 | 17 → 10 | ~11 → 21 |
|        | Tank     | 222 → 234 | <1      | 2 → <1  | 100 → 300+ |
| **T3** | Glass    | 229 → 272 | 33 → 27 | 59 → 53 | ~4 → 5 |
|        | Balanced | 212 → 250 | 16 → 2.5| 8 → <1  | ~26 → 280 |
|        | Tank     | 237 → 261 | <1      | 15 → <1 | ~15 → 350 |
| **T4** | Glass    | 278 → 361 | 67 → 57 | 118 →108| ~2.4 → 3.4 |
|        | Balanced | 256 → 330 | 36 → 11 | 21 → <1 | ~12 → 380 |
|        | Tank     | 267 → 315 | 3.5 → <1| 40 → 3.4| ~7 → 92 |

Read the swings as **cliffs, not noise**: a band jumps to "hundreds of hits to die"
exactly when its plating crosses the hit size, or (for Balanced) when the Cadence cap
halves a hit below the plating line. That crossing is the design lever — see §6.1.

> **Reload/evasion (confirmed).** Reload carries ~0 plating and survives on dodge
> instead. Its evasion eHP multiplier is **~1.2× (root) → ~1.4–1.5× (with light frame
> or a close node)**, applied to a Glass-ish pool — so it survives a notch above Glass,
> well below Tank, but with a *flat* response that ignores hit size (the dodge-tank).
> Gear can push the rate/mitigation toward a hard **~5× ceiling**. Because it skips the
> plating cliff, Reload is the build to check against **big-hit** content (Mountain),
> where plating tanks rely on the cap and Reload relies on dodges landing on the big ones.

### Offense — sustained DPS / TTK vs median mob

"Fast" = high-APS build (fast weapon, ~2.0 effective APS). "Slow" = low-APS heavy
build (slow weapon ~0.34 APS, big empowered burst, plating-piercing).

| Tier | mob HP | Fast DPS (+0→+3) | Fast TTK | Slow DPS (+0→+3) | Slow TTK |
|---|---|---|---|---|---|
| T0 | 40  | 22 → 27   | 1.8 → 1.5s | 24 → 28   | 1.7 → 1.4s |
| T1 | 90  | 86 → 99   | 1.0 → 0.9s | 31 → 41   | 2.9 → 2.2s |
| T2 | 200 | 128 → 173 | 1.6 → 1.2s | 45 → 67   | 4.4 → 3.0s |
| T3 | 440 | 165 → 255 | 2.7 → 1.7s | 63 → 106  | 7.0 → 4.1s |
| T4 | 950 | 235 → 408 | 4.0 → 2.3s | 97 → 180  | 9.8 → 5.3s |

---

## 5. Target gear budget per tier (the item re-spec aims at this)

Total contribution of **all gear** (armor + charm + boots + weapon) at the **+0 base
craft** of that tier. `+3` ≈ **×1.8 on armor/charm stats, ×2.2 on weapon attack**
(DR stays flat). Split by build role.

| Tier | Glass armor (HP/PLT/DR) | Balanced armor | Tank armor | Weapon ATK (fast / slow) |
|---|---|---|---|---|
| T0 | 0 / 4 / 0   | 0 / 4 / 0    | 0 / 4 / 0     | 5 / 5 |
| T1 | 12 / 2 / 0  | 15 / 6 / .03 | 8 / 10 / .05  | 5 / 16 |
| T2 | 22 / 4 / 0  | 25 / 10 / .05| 15 / 18 / .08 | 16 / 32 |
| T3 | 42 / 7 / 0  | 48 / 19 / .07| 30 / 34 / .10 | 32 / 64 |
| T4 | 80 / 13 / 0 | 92 / 36 / .09| 60 / 64 / .12 | 62 / 124 |

These are deliberately set so plating roughly **tracks `H_med`** for balanced builds
and **exceeds `H_med` (approaches `H_big`)** for tanks — that's what makes a tank a
tank. If the re-spec wants glass builds to feel glassier or tanks tankier, move
these and re-run the curve.

---

## 6. What the math exposed (the durable findings)

### 6.1 The plating-vs-hit cliff — *the* monster-tuning constraint
Because damage taken is `max(1, H − plating) × (1 − DR)`, the relationship between a
build's plating and a mob's hit size is a **hard cliff**, not a gradient:

- plating **well below** H → mob does meaningful damage (gradient zone).
- plating **≈** H → mob does a trickle.
- plating **≥** H → mob does **1 per hit** → effectively *immune* to that mob.

So a mob's hit size must be tuned **relative to the plating of the builds it's meant
to threaten**, tier by tier. A T2 plating tank (~33 PLT) takes **1/hit** from a
23-damage T2 trash mob — it is *immune* to plains/forest trash by design. The only
ways to pressure it (straight from the threat matrix): **swarm volume** (many
1-damage hits still add up — density), **big hits** (H ≥ ~plating: Mountain),
**DoT / %-based** (bypasses plating: Swamp), or a **boss**. This is the structural
reason each biome owns a damage-shape — it's not flavor, it's the only way the
content threatens the full build spectrum.

### 6.2 You cannot threaten every build with one mob
Glass survival vs a single typical mob falls from "minutes" (T0) to **~5s (T4)** —
glass *should* feel knife-edge. The same mob does ~1/hit to a tank → tank survival is
effectively unbounded. **No single mob profile challenges both.** Trash must be tuned
to pressure the *squishy* builds via raw hit size, and rely on §6.1's levers
(density / big-hit / DoT, sorted by biome) to pressure tanks. Don't try to make one
mob "fair" to all five archetypes.

### 6.3 Fast weapons win vs trash; slow weapons win vs walls
Against unarmoured trash, the Fast build clears in **~1s** while the Slow build takes
**3–10s** (2–3× slower) — because slow weapons' value is *plating-piercing* and *big
empowered bursts*, neither of which matters against zero-plating trash. This is
**intended** (bible: don't equalize weapon DPS), but it means: **trash TTK should be
balanced around the Fast build** (or Fast trivializes everything), and **boss HP/
plating should be high enough that the Slow build's piercing+burst closes the gap**.
If Slow ever out-TTKs Fast on trash, slow weapons are overtuned.

### 6.4 Healing × the cliff = the immortality seam
A tank already at "1/hit" from trash, *plus* any in-combat regen/absorb, is unkillable
by that content — fine for trash, dangerous if it generalizes to bigger threats. This
is exactly what the bible's **heal-throughput soft cap (~3–4% maxHP/s)** and
**debt-conversion cap (≤~40–50%)** are there to bound. Keep them in the engine gate
(Phase 0) before the item re-spec, or absorb/regen charms stacked on a plating tank
will read as immortal in sim.

---

## 7. Monster-tuning lookup (use this when writing/checking a mob)

For a mob at tier T, check it against these targets:

1. **Trash hit size (`H_med`)** — set so it does *meaningful* damage to the **Glass**
   build's pool (a few % up to ~10% per hit), accepting it'll do ~1/hit to the Tank.
   That's correct; don't inflate it to hurt the tank (you'll one-shot the glass).
2. **Heavy/elite hit (`H_big`)** — if you want it to threaten **balanced/tank**, push
   the hit toward their **plating** (Mountain's job). Otherwise it's trash-tier.
3. **Mob HP** — set so the **Fast +0** build's TTK lands ~1–2s (trash) / longer for
   elites; verify **Slow** isn't faster (→ §6.3 overtune flag).
4. **Density** — the lever that pressures tanks who are immune per-hit. High-density
   biomes (Plains/Jungle/Graveyard) threaten via *stacked* 1-damage hits + on-hit
   effects; low-density (Cave/Desert/Trench) must threaten per-hit instead.
5. **Damage shape** — does the mob express its **biome's** assigned mechanic
   (big-hit / DoT / mixed / debuff)? If every mob is the same fast-medium-ranged trio,
   biomes don't teach their mitigations (the diagnosed problem).

| Tier | Glass takes/hit @H_med | Glass survival (single mob) | Fast +0 TTK (trash) | "threatens tank?" needs |
|---|---|---|---|---|
| T1 | ~8 (5–8% pool) | ~24s | ~1.0s | H_big≈20+ or DoT or swarm |
| T2 | ~15 (7% pool)  | ~17s | ~1.6s | H_big≈33+ or DoT or swarm |
| T3 | ~33 (14% pool) | ~9s  | ~2.7s | H_big≈50+ or DoT or swarm |
| T4 | ~67 (24% pool) | ~5s  | ~4.0s | H_big≈80+ or DoT or swarm |

(Glass "takes/hit" climbing to ~24% of pool at T4 is the edge of acceptable for a
squishy build with the Energy shield up — if it goes higher, T4 trash one-shots
glass through the shield. That's the ceiling on T4 `H_med`.)

---

## 8. Open items feeding back into other docs
- **Evasion model — RESOLVED** (§2): deterministic counter, eHP = `1/(1 − rate×mit)`,
  flat across hit sizes, ~5× gear ceiling. Reload band locked.
- **Plating cliff is intended, not a bug** (§6.1): plating is an early-game /
  small-fast-hit specialist that naturally goes obsolete as hit sizes outgrow it. No
  formula change — the only discipline required is tuning monster hit sizes *against*
  the cliff (which §7 enforces).
- **Gear budgets (§5)** are guesses — the item re-spec is where they get real; then
  re-run `power_curve.py` and replace §4.
- **T3–T4 tree nodes don't exist yet** — when added, player T3–T4 power rises and
  the enemy curve (§3) may need a matching nudge.
- **Heal-throughput soft cap + debt-conversion cap** must land in the Phase-0 engine
  gate before sim, per §6.4.
- Boss tuning is a **separate pass** (they're the only single entity meant to
  threaten a tank / trip the Cadence cap).
