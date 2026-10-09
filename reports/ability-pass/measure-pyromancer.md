# The T4 Pyromancer Apprentice (design §22.13, measurement 2)

A measurement for the designer; nothing moved. Branch `feat/ap-measure` off
`feat/ability-pass-calls-2` (`12d2b1f1`). Commands: README §10.

- **Package:** the Apprentice's boss5Spec tier-3/4 reference rows, exactly as
  `_abilityPassStacking.ts --boss5-plan` writes them (Slam + Second Wind/Brace, defensive
  stance, the five rules, the tier kit, core and relic, the fixed spawn), on the package's
  seed 99011 plus nine more (173, 947, 2027, 3331, 4409, 5501, 6607, 7717, 8821): **10
  seeds**, 70 T3 and 60 T4 fights per arm. The spawn stays fixed (no `jitter`), so a boss
  that rolls nothing gives 10 identical fights: **84 of the 124 arm × boss cells are
  seed-invariant**.
- **No T3 path at T3.** A T3 path is skill tier 3, worn from player tier 4; the package's T3
  row is `dot-root, dot-balanced, dot-range-mid`. So the T3 columns are the frame alone, and
  arms (a), (b) and the Ember Mage (c) arms share one T3 row.
- **Arms.** (a) the package's T4 row, the Pyromancer as built (no refresh at max, Radiant);
  (b) the same row with no T3 path (the lab's new optional `skillPath`, the one lever the
  frame/spec derivation could not state); (c) every other Apprentice T3 path the package
  can wear: the Ember Mage's Firebrand and Cinder Lord through `spec`, and the light and
  heavy frames' three paths each through `frame` + `spec`, each with its own frame-alone
  row (a frame swap changes the element: poison, fire, frost); (d) the same balanced-frame
  arms on a detached checkout of `e56d530e` (develop before the pass) in
  `%LOCALAPPDATA%/mmo-idle/ap-measure-e56d530e`, with no install (node_modules junctioned to
  the donor store, `@mmo-idle/shared` repointed at the checkout). Slam is held at the tip's
  numbers there (`ap` damageMult `[2.45, 2.7, 2.95]` over e56d530e's three ranks: T3 casts
  2.7, T4 2.95; cooldown 10 s, wind-up 1.6 s and radius 150 are equal on both commits).
- **Run:** 930 tip fights (793 s, 4 shards) + 310 at e56d530e (569 s, 2 shards), 0 error
  rows, concurrently with measurement 1. Files: `plan-measure-pyro.json`,
  `plan-measure-pyro-old.json`, `measure-pyro.jsonl`, `measure-pyro-old.jsonl`; every cell
  in `measure-pyro-cells.md`.
- **e56d530e fights every other arm identically to the tip:** the frame alone, Firebrand
  and Cinder Lord at T4 and the T3 row, 250/250 rows identical (`wallMs` dropped). Only the
  Pyromancer rows differ. The tip's seed-99011 T3 rows are also identical to W4-A's
  `w4a-boss5.jsonl`.


### Per arm (T3: 7 bosses × 10 seeds = 70 fights; T4: 6 bosses × 10 seeds = 60 fights)

| arm | frame | T3 path (worn at T4) | T3 dps | T3 wins | T4 dps | T4 wins | T4 Δ vs (a) | T4 Δ vs (b) | T4 Δ vs own frame alone |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| (a) Pyromancer, as built | balanced | dot-balanced-t3-a | 126.5 | 28/70 | 191.5 | 41/60 | 0.0% | −32.7% | −32.7% |
| (b) Ember Mage frame, no T3 path | balanced | — | 126.5 | 28/70 | 284.7 | 42/60 | +48.7% | 0.0% | 0.0% |
| (c) Firebrand | balanced | dot-balanced-t3-b | 126.5 | 28/70 | 295.9 | 42/60 | +54.5% | +3.9% | +3.9% |
| (c) Cinder Lord | balanced | dot-balanced-t3-c | 126.5 | 28/70 | 330.6 | 42/60 | +72.6% | +16.1% | +16.1% |
| (c) light frame, no T3 path | light | — | 104.7 | 28/70 | 253.2 | 41/60 | +32.2% | −11.1% | 0.0% |
| (c) Venomslinger | light | dot-light-t3-a | 104.7 | 28/70 | 398.8 | 43/60 | +108.2% | +40.1% | +57.5% |
| (c) Cultist | light | dot-light-t3-b | 104.7 | 28/70 | 387.6 | 41/60 | +102.4% | +36.1% | +53.1% |
| (c) Zealot | light | dot-light-t3-c | 104.7 | 28/70 | 319.0 | 46/60 | +66.5% | +12.0% | +26.0% |
| (c) heavy frame, no T3 path | heavy | — | 136.2 | 29/70 | 317.1 | 45/60 | +65.6% | +11.4% | 0.0% |
| (c) Icebreaker | heavy | dot-heavy-t3-a | 136.2 | 29/70 | 321.8 | 44/60 | +68.0% | +13.0% | +1.5% |
| (c) Winter Warden | heavy | dot-heavy-t3-b | 136.2 | 29/70 | 283.6 | 47/60 | +48.1% | −0.4% | −10.6% |
| (c) Wind Spirit | heavy | dot-heavy-t3-c | 136.2 | 29/70 | 299.2 | 48/60 | +56.2% | +5.1% | −5.7% |
| (d) Pyromancer before the pass (e56d530e) | balanced | dot-balanced-t3-a (old) | 126.5 | 28/70 | 365.1 | 41/60 | +90.6% | +28.2% | +28.2% |
| (d) Ember Mage frame, no T3 path (e56d530e) | balanced | — | 126.5 | 28/70 | 284.7 | 42/60 | +48.7% | 0.0% | 0.0% |
| (d) Firebrand (e56d530e) | balanced | dot-balanced-t3-b | 126.5 | 28/70 | 295.9 | 42/60 | +54.5% | +3.9% | +3.9% |
| (d) Cinder Lord (e56d530e) | balanced | dot-balanced-t3-c | 126.5 | 28/70 | 330.6 | 42/60 | +72.6% | +16.1% | +16.1% |

### T4 per boss: mean dps (wins / 10)

| arm | dune-throne | verdant-crown | iron-crest | elder-trench | glacial | caldera |
|---|---:|---:|---:|---:|---:|---:|
| (a) Pyromancer, as built | 172.7 (10/10) | 232.2 (10/10) | 133.1 (10/10) | 204.6 (0/10) | 180.6 (10/10) | 225.9 (1/10) |
| (b) Ember Mage frame, no T3 path | 267.6 (10/10) | 319.0 (10/10) | 261.7 (10/10) | 302.0 (0/10) | 260.1 (10/10) | 297.9 (2/10) |
| (c) Firebrand | 247.6 (10/10) | 374.3 (10/10) | 257.5 (10/10) | 323.3 (0/10) | 255.6 (10/10) | 317.0 (2/10) |
| (c) Cinder Lord | 301.0 (10/10) | 328.0 (10/10) | 316.6 (10/10) | 377.2 (0/10) | 322.8 (10/10) | 338.0 (2/10) |
| (c) light frame, no T3 path | 223.2 (10/10) | 310.2 (10/10) | 225.3 (10/10) | 257.9 (0/10) | 232.2 (10/10) | 270.2 (1/10) |
| (c) Venomslinger | 365.5 (10/10) | 471.0 (10/10) | 344.7 (10/10) | 507.2 (0/10) | 321.6 (10/10) | 382.7 (3/10) |
| (c) Cultist | 456.6 (10/10) | 392.3 (10/10) | 403.0 (10/10) | 433.2 (0/10) | 270.8 (10/10) | 369.9 (1/10) |
| (c) Zealot | 292.1 (10/10) | 369.7 (10/10) | 304.8 (10/10) | 320.4 (0/10) | 309.3 (10/10) | 317.4 (6/10) |
| (c) heavy frame, no T3 path | 292.7 (10/10) | 344.6 (10/10) | 327.3 (10/10) | 309.0 (0/10) | 329.3 (10/10) | 299.8 (5/10) |
| (c) Icebreaker | 293.9 (10/10) | 346.5 (10/10) | 324.3 (10/10) | 345.8 (0/10) | 297.4 (10/10) | 322.8 (4/10) |
| (c) Winter Warden | 267.7 (10/10) | 291.6 (10/10) | 293.6 (10/10) | 280.3 (0/10) | 289.6 (10/10) | 278.5 (7/10) |
| (c) Wind Spirit | 271.1 (10/10) | 305.4 (10/10) | 320.2 (10/10) | 292.6 (0/10) | 314.6 (10/10) | 291.3 (8/10) |
| (d) Pyromancer before the pass (e56d530e) | 326.6 (10/10) | 415.6 (10/10) | 211.1 (10/10) | 529.7 (0/10) | 315.3 (10/10) | 392.3 (1/10) |
| (d) Ember Mage frame, no T3 path (e56d530e) | 267.6 (10/10) | 319.0 (10/10) | 261.7 (10/10) | 302.0 (0/10) | 260.1 (10/10) | 297.9 (2/10) |
| (d) Firebrand (e56d530e) | 247.6 (10/10) | 374.3 (10/10) | 257.5 (10/10) | 323.3 (0/10) | 255.6 (10/10) | 317.0 (2/10) |
| (d) Cinder Lord (e56d530e) | 301.0 (10/10) | 328.0 (10/10) | 316.6 (10/10) | 377.2 (0/10) | 322.8 (10/10) | 338.0 (2/10) |

### T3 per boss: mean dps (wins / 10). A T3 Apprentice wears no T3 path, so this is the frame alone

| T3 row | deep-core | dune-carapace | apex-bramble | crag-gorged | rot-spore | frost-plated | cinder-shell |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ember Mage (balanced): the package's T3 row | 114.1 (0/10) | 135.8 (0/10) | 147.0 (0/10) | 139.0 (10/10) | 71.2 (0/10) | 144.3 (10/10) | 134.3 (8/10) |
| light frame | 85.0 (0/10) | 109.0 (0/10) | 132.3 (0/10) | 112.0 (10/10) | 55.8 (0/10) | 118.8 (10/10) | 119.7 (8/10) |
| heavy frame | 124.4 (0/10) | 138.1 (0/10) | 157.6 (0/10) | 148.1 (10/10) | 100.1 (0/10) | 149.8 (10/10) | 135.4 (9/10) |
| Ember Mage (balanced), e56d530e | 114.1 (0/10) | 135.8 (0/10) | 147.0 (0/10) | 139.0 (10/10) | 71.2 (0/10) | 144.3 (10/10) | 134.3 (8/10) |

Seed 99011 alone (the package's one seed), the T4 Pyromancer: 189.3 dps, 4/6 wins at this tip, against 224.3 dps, 5/6 in W4-A's `../reports/ability-pass/w4a-boss5.jsonl` (the same rows before W4-E's "no refresh at max"): −15.6%.

At seed 99011 alone, the T4 Pyromancer goes 368.3 dps at e56d530e → 224.3 in W4-A (the
max-burn bonus hit gone, Radiant in, the burn still refreshing) → 189.3 at the tip (no
refresh at max). That is −39.1% for the reworked payoff and a further −15.6% for "no
refresh", −48.6% in all. The frame alone is 282.3 at that seed.

## What this says

1. **The Pyromancer is now a net loss against its own frame at T4.** It deals 191.5 dps
   against 284.7 for the Ember Mage frame with no T3 path (−32.7%), and it is below the
   frame on every one of the six T4 bosses (−24% to −49%). Before the pass it was +28.2%
   over the frame (365.1). The path itself lost 47.5%.
2. **It is the weakest dot T3 path by a wide margin.** The same frame's other paths are
   above the frame: Firebrand +3.9%, Cinder Lord +16.1%. The Pyromancer trails them by 35%
   and 42%. Across all nine dot paths, the T4 range is 283.6 (Winter Warden) to 398.8
   (Venomslinger); the Pyromancer's 191.5 is 24% below even the weakest frame alone (the
   light frame, 253.2).
3. **Why, from the path's code** (`dot/t3/paths/fire.ts`, read, not measured separately):
   a hit below the cap lays 2 stacks at 55% value, up to the frame's own cap. So a full
   burn is 55% of the frame's full burn on one target. The two-per-hit climb only gets
   there sooner. A hit at max lays nothing and refreshes nothing, so the bar lapses and has
   to be rebuilt. Radiant pays only with a second body adjacent, and these are lone-boss
   fights. The old 1.5× max-burn bonus hit was what paid for the 55%.
4. **Wins hide it.** The T4 package beats four bosses at every arm and loses the Elder
   Trench Serpent at every arm. The Pyromancer's 41/60 is one win off the frame's 42/60.
   The only contested boss is the Caldera Sovereign: Pyromancer 1/10, frame 2/10, Zealot
   6/10, Winter Warden 7/10, Wind Spirit 8/10.
5. **T3 is untouched by the pass.** The Apprentice's T3 row (no path) is 126.5 dps, 28/70,
   identical at e56d530e. The light frame is 17% lower at T3 (104.7) and the heavy frame 8%
   higher (136.2).
6. **Seed caveat.** With the package's fixed spawn, 84 of 124 cells are seed-invariant, so
   most T4 numbers are one fight repeated. The arm-to-arm comparisons are exact (same
   fights), but the absolute numbers rest on few distinct fights per boss.
