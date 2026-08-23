# Tier Balance — current state

**Living truth for the T1–T4 numerical baseline.** Established 2026-08-23.
Plan of record: [`briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md`](briefs/t2-t4-numerical-baseline-handoff-2026-08-23.md) (now fulfilled).
Method and formulas: [`briefs/t1-balance-context-2026-08-18.md`](briefs/t1-balance-context-2026-08-18.md).
Regenerate every figure here with `pnpm tier:table --tier N` → `reports/tier-N-table.md`.

If this doc and `tools/tier-table.ts` disagree, the tool wins.

---

## 1. What this pass was, and was not

It set the **shape** of the difficulty ladder: which biome is harder than which, by how
much, at every tier. It did **not** decide whether the game is correctly pitched in
absolute terms — the vacuum method cannot, and the one instrument that could is currently
broken (§8).

Before the pass, T2–T4 had no ladder at all. T2's sustained pressure ran
`1.00 → 0.84 → 0.72 → 0.66 → 0.72 → 1.66 → 0.57` against its intended order, and T4's
apex biome was its *softest*.

---

## 2. Progression order (locked with the user 2026-08-23)

| tier | order, easiest → hardest |
|---|---|
| T1 | plains → forest → swamp → mountain → cave |
| T2 | plains → forest → swamp → mountain → cave → **jungle** → **desert** |
| T3 | swamp → mountain → cave → jungle → desert → **tundra** → **volcanic** |
| T4 | mountain → jungle → desert → tundra → volcanic → **wasteland** → **trench** |

Every tier keeps five biomes and swaps two: the two that leave always leave from the
**bottom**, and the two that arrive always arrive at the **top**. Returning biomes keep
their relative order for the life of the game, so the railroad a player learns in T1 still
reads the same way in T4.

**That two-off-the-bottom rule is load-bearing** — see §4.

---

## 3. The two axes

| axis | T1 | T2 | T3 | T4 | what it is |
|---|---|---|---|---|---|
| Sustained danger | ×1.20 | ×1.20 | **×1.27** | **×1.32** | `d(N+1)/2` — incoming DPS to out-sustain. The "skipping ahead is rough" axis. |
| Effective HP | ×1.41 | ×1.26 | ×1.26 | ×1.26 | how chunky a mob is |
| Cost per kill | — | — | — | — | **never targeted.** Exactly `sustained × eHP`. |

Two deliberate departures from T1's values:

- **eHP softened to ×1.26** for the seven-biome tiers. At ×1.41 over six steps the tier
  ceiling lands at ×7.9 the anchor's durability. The T1 pass's central finding is that eHP
  cancels out of danger entirely — a curve led by durability reads as tedium, not threat —
  so ×1.26 reproduces T1's ~×4 end-to-end chunk over the longer ladder.
- **Danger widened at T3/T4** because node modifiers outgrow a fixed step. See §5.

Measured result:

| tier | sustained curve | overlaps |
|---|---|---|
| T1 | `1.00 → 1.18 → 1.42 → 1.73 → 2.08` | 0 |
| T2 | `1.00 → 1.16 → 1.46 → 1.70 → 2.04 → 2.37 → 3.03` | 0 |
| T3 | `1.00 → 1.25 → 1.58 → 2.04 → 2.58 → 3.27 → 4.16` | 0 |
| T4 | `1.00 → 1.31 → 1.74 → 2.30 → 3.04 → 4.02 → 2.26†` | 0 |

† Trench, exempt — see §6.

---

## 4. The tier boundary is TWO rungs, and that is arithmetic

```
tier N floor = tier (N-1) floor × TARGETS[N].sustainedPerStage ^ 2
```

Each tier drops exactly two biomes off the bottom, so **every returning biome slides down
two rungs at each boundary**. A one-rung boundary lift therefore leaves it a net rung
*lower* than it was a tier ago: at ×1.20 the entire returning cast softened by ×0.83 per
tier, which put T4 Jungle *below* the T3 Jungle above it and handed players softer content
with better rewards for advancing.

At two rungs nothing ever gets easier. A biome's difficulty becomes a property of that
biome; a tier extends the ladder upward through its new arrivals instead of sliding the
veterans down.

Resulting floors and ceilings (sustained):

| tier | floor | ceiling |
|---|---:|---:|
| T1 | 23.2 (measured) | 48.3 |
| T2 | 33.4 | 99.8 |
| T3 | 53.9 | 226.1 |
| T4 | 93.9 | 496.6 |

### Anchor modes

- **T1 = `first`.** Plains is genuinely the tier floor and was locked as the measured
  baseline, so T1's already-playtested biomes do not move.
- **T2–T4 = `chain`.** Their first biomes are *not* floors (T3 Swamp was the chunkiest
  biome in its tier), so anchoring on them and building upward would have turned a
  reshaping pass into a ×4–×10 difficulty increase.

**A per-tier geometric-mean fit was tried first and does not work.** Re-anchoring every
tier places all four in the same absolute band — measured GM sustained was T1 33 / T2 36 /
T3 44 / T4 92, and the fit collapsed all of them onto ~40. The ladder just restarts in
place; it produced a T2 Stampede Bull at attack 13 against T1's Boar at 18.

The **eHP axis is still geometric-mean fitted per tier**, because eHP probes are anchored
to each tier's own median monster attack — cross-tier eHP ratios are meaningless.
Sustained-exempt biomes are excluded from that fit.

---

## 5. Node modifiers outgrow a fixed ladder step

`MODIFIER_MAGNITUDE_BY_TIER` rises `0.05 → 0.10 → 0.15 → 0.20` while the ladder step did
not. Measured within-biome spread against the step:

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| modifier spread | ×1.06–1.12 | ×1.12–1.15 | ×1.18–1.25 | ×1.25–1.29 |
| ladder step | ×1.20 | ×1.20 | ×1.27 | ×1.32 |

At a flat ×1.20 the T4 spread **always** exceeded the step, so every railroad step
overlapped no matter how well the roster was tuned. Widening the step at T3/T4 is what
buys the zero-overlap result in §3.

> ⚠ The T1 context brief documents these magnitudes as 0.15–0.30. **That is stale** — the
> code says 0.05–0.20, and `d38625b` softened them.

---

## 6. Deep-Sea Trench is exempt from the sustained target

The encounter model was derived for a *pull*: `sustained = d(N+1)/2` is the mean number of
live attackers as a group burns down. At `N=1` that term collapses and the metric stops
describing the encounter — a solo mini-boss threatens through per-hit spike and the length
of the exchange, not through attrition from a crowd.

Trench is authored as exactly that (density 10, N=1, "every enemy is a mini-boss"), so it
is held to **cost per kill** instead, and excluded from both the sustained fit and the eHP
fit. That freedom is used deliberately: it sits at **7 269 eHP / 212 DPS** rather than the
3 097 / 497 the ladder would have demanded — long rather than frantic — while landing its
cost/kill target (1.544 M against 1.539 M).

---

## 7. Bosses

Premise inherited from the T1 pass (`91f0c85`): bosses are **end-of-tier exams**, not rungs
on the railroad. Biome decides mechanics, never progression level.

Calibrated **in the vacuum**, because the player-dependent instrument is broken (§8). Each
tier's bosses were scaled uniformly — preserving every in-tier relative position, which
encodes their mechanics — until the tier's boss mean matched T1's accepted ratios against
the tier's top **ladder** biome (T4 uses Wasteland, not Trench, since Trench is the
deliberate off-ladder outlier):

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| boss HP ÷ trash HP | ×8.13 | ×8.13 | ×8.13 | ×8.13 |
| boss DPS ÷ trash DPS | ×0.736 | ×0.739 | ×0.735 | ×0.734 |

The **Void Overlord** encounter (`void-overlord`, `void-horror`, `void-hulk`,
`elder-trench-serpent-warden`) was scaled by the same uniform T4 factors. It is not a tier
boss, but leaving it would have made the game's final encounter weaker than ordinary T4
trash. Its internal stage relationships are untouched; the encounter redesign owns its
shape.

---

## 8. ⚠ Open threads

**The reference player is broken, and this is the top blocker.** `server/bench/bossExam.ts`
run against unchanged T1 bosses:

| | 2026-08-21 (band accepted) | 2026-08-23 |
|---|---|---|
| win rate | 14–22 / 30 | **0 / 30, every boss** |
| cost bars | 1.18 – 3.89 | 4.09 – 13.17 |
| TTK | 30–77 s | 57–186 s |
| hp/s taken | 3.6–4.2 % pool | 5.5–8.9 % pool |

The reference player became **both weaker offensively and squishier**. Boss data did not
change; five commits on 2026-08-22 did — `45783e1` class→percentage affinities, `f0e101d`
Barrier & Ward, `b9e0e12` Recovery, `4cce01a` the T1 item cast rebuild, `ea7e74f` the
ability rework. T1 is currently unbeatable by all six class roots on all five armour sets.
Until this is resolved, **no absolute-pitch question can be answered** and `bossExam` cannot
be trusted. This is the natural next task.

**Absolute cross-tier pitch is unset by construction.** Everything here is a ratio. Whether
the game as a whole is correctly pitched needs one check against a real player build, at
tier close — the same check the T1 brief already defers to.

**Concurrency (`N`) is still asserted, not measured.** It remains the single most
load-bearing term (`sustained` is linear in it, `pull load` quadratic). Only the T1 values
are user-locked. Note that Wasteland's density reversion question (40 → 28) turned out to
be **moot**: density does not enter the model at all, `N` does, and Wasteland's pressure at
`N=4` was already within ×1.14 of target — its real defect was paper durability (×4.8 eHP).

**Rewards are unreconciled.** Cost per kill now compounds at up to ×1.66/stage; the reward
curve has not been re-derived against it.

**Not verified in-game.** Every number here is static analysis. Nothing has been played.

---

## 9. Instrument fixes shipped with this pass

`tools/tier-table.ts` predated the monster rework and could not see its primitives:

- **`directDps` now models the charged-attack cycle** — during `castMs` a monster neither
  moves nor auto-attacks, so a cast trades normal beats for one multiplied hit. This is
  what exposed T1 Mountain sitting **42% over its own target** and out-pressuring Caverns;
  the tier had been tuned against an instrument that could not see its two headline
  abilities. It also makes the pure-*control* charged attacks legible — Petrifying Gaze,
  Wither and Frostbind sit at `multiplier: 1.0` and now correctly read as a small sustained
  damage *loss*, which is exactly right: those monsters pay damage to buy control.
- `cadenceVolley`, `cadenceFinisher` and `empoweredCooldown` folded into the beat model.
- `openingVolley` / `openingStrike` reported as a new **opener** column, never folded into
  sustained (they fire once per combat session).
- **`empowersAllies`** as a biome-level haste term — the Carrion Vulture deals almost no
  damage itself and read as filler, while its actual job is making the rest of Wasteland
  attack 25% faster.
- Charged-attack riders (root / stun / antiheal / dot-extend / ambient gate) now report as
  control, so Desert and Tundra stopped reading as biomes with no mechanics.
- `modifiedDps` reuses the same rotation model, so the modifier cross-table no longer
  disagrees with the biome summary above it.

---

## 10. Two data defects found and fixed

- **Tier-leaking pack followers.** `prairie-wolf` (T2) called 3× `plains-slime` — the *T1*
  Field Hare — and `ancient-wolf` (T2) called 3× `young-wolf`, the T1 Wolf's follower. Half
  of each biome's effective spawn weight was a tier-1 monster that could not be retuned
  without silently moving T1. Fixed with dedicated followers, `prairie-yearling` and
  `dire-whelp`, which share their adult's sprite exactly as `young-wolf` once shared
  `wolf.png`. **An audit of every remaining pack is clean** — the Desert followers
  (`dust-djinn`, `sandweaver`, `sandspitter-cobra`) are each used within one tier only.
- **The Moss-Shell Snapper lost its shell.** An early cut took `swamp-hydra` from plating 8
  to 2 to fix an eHP outlier, stripping the armour identity of a monster named for it (and
  breaking `nodeModifiers.wiring.test`, which picked it precisely because its plating was
  large enough for rounding to bite). Corrected to plating 6 with HP cut instead — same
  biome target, identity intact.

Verification: `pnpm typecheck` clean, `pnpm test` **91/91**.
