# Mitigation Rebalance — Fresh-Session Handoff

**Prepared:** 2026-08-18
**Branch:** `feat/biome-ecology-pass2` (HEAD `f8b71e5`, **substantial uncommitted worktree**)
**Predecessor work:** the T1 monster balance pass and the node-modifier rework, both in the
same uncommitted tree. Full data context: `docs/briefs/t1-balance-context-2026-08-18.md`.

---

## 1. The finding this session ends on

T1 biome armour provides **wildly unequal counterplay**, and that — not monster tuning — is
what makes the tier's difficulty curve span 16× instead of the intended ~2×.

| biome | native T1 armour | vs its monsters' attacks | mitigation |
|---|---|---|---:|
| Plains | plating 9 | 12, 18 | **60%** |
| Forest | plating 4 + evasion 0.18 | 17, 20, 14 | **38%** |
| Swamp | plating 6 | 10, 13 (+75% of output is DoT) | **21%** |
| Mountain | plating 7 | 82, 82 | **8.5%** |
| Caverns | plating 2 + DR 6% | 31, 118 | **8.5%** |

The cause is structural: **plating is a flat subtract**, so it is spectacularly good against
small hits and nearly useless against large ones. Nine plating erases 60% of a 12-damage
Field Hare hit; seven plating removes 8.5% of an 82-damage Cliff Hopper hit. Caverns' stated
"answer" — 6% damage reduction — removes 6% of a 118-damage slam, which is not counterplay
in any meaningful sense. Swamp's plating does not touch the poison that is three quarters of
its damage.

Each biome is *supposed* to teach one mitigation (design intent, `cave.monsters.ts` header):

```
PLAINS    swarm of small fast hits      -> answered by PLATING (flat subtract)
FOREST    fast, FREQUENT attacks        -> answered by EVASION (scales w/ hit count)
MOUNTAIN  rare, HUGE hits (trip the cap)-> answered by DAMAGE-CAP
SWAMP     low direct dmg, heavy DoT     -> answered by DOT-RESIST
CAVE      few ELITE, MIXED shapes       -> answered by %DR
```

The intent is sound. The *implementation* only works for Plains and partially for Forest.
Mountain's armour offers plating, not the damage-cap it is meant to teach. Caverns' 6% DR is
an order of magnitude too small for the hits it faces. Swamp offers no DoT-resist at all.

**Measured consequence** (farm bench, gear +3, 6 builds averaged, each biome in its own
native gear — HP lost per hour, indexed to Plains):

```
plains 1.0x | forest 4.7x | swamp 7.1x | mountain 14.7x | caverns 16.4x
target      1.00 -> 1.20 -> 1.44 -> 1.73 -> 2.07
```

---

## 2. Why this was deliberately NOT fixed this session

The user's standing rule for the monster pass: *"Do not rebalance classes or items inside
this monster pass. They are reference inputs and possible later balance subjects, not
simultaneous moving targets."* Widening scope mid-pass would have left neither the monster
numbers nor the item numbers trustworthy.

That rule still holds. This is its own session.

---

## 3. Recommended sequencing

**Armour first, re-measure, then monsters.** Any monster numbers set before the mitigation
fix would be compensating for gear that is about to change. Concretely:

1. Decide what "comparable counterplay" means numerically — e.g. every biome's native armour
   removes roughly 35–50% of that biome's damage when worn against it.
2. Fix the two armours that do almost nothing (Caverns %DR, Mountain damage-cap) and give
   Swamp an actual DoT-resist. Check whether `defense.max-hit-pct` is even reachable on T1
   gear; if not, Mountain has no authored answer at all.
3. Re-run the farm bench (§5) and re-read the hpLost curve.
4. Only then re-tune monster stats onto the target curve.

**Open question to settle first:** should mitigation be measured against the biome you are
*in*, or should each armour be globally comparable? A plating build entering Caverns should
presumably suffer; the question is how much. That is a design call, not a derivable number.

---

## 4. What already exists (built this session, uncommitted)

### `tools/tier-table.ts` — the vacuum analysis instrument
`pnpm tier:table --tier=N` → `reports/tier-N-table.md`. Player-free monster/biome analysis:
authored stats, tier-anchored eHP probes, the encounter model, target-vs-current, a
biome×modifier cross-table, and a railroad ordering check. Its `CONCURRENCY` constants are
now **known to be wrong** — see §6.

### `server/bench/balance/concurrency.ts` — the measurement instrument
Per-tick sampler on the farm bench. Records mean attackers (all-tick and in-combat),
peak, a 0–6+ histogram, combat/contact uptime, `aggro_per_kill`, and total HP lost.
Uses the authoritative hitbox-aware `inAttackRange`, the same predicate combat uses.

`--gear-sweep 0,3,5` re-runs every pair at each upgrade level (`materializeBot` now takes an
optional `upgradeLevel`). Concurrency depends on kill speed, so a single power level biases it.

Covered by `server/test/concurrencySampler.test.ts`, which drives the sampler against a
hand-built `World` and needs no database.

### Two real bugs fixed
- **`metrics.damageTaken` missed all DoT, AoE and environmental damage.** It hooks the
  `onDamageTaken` combat pipeline, but monster DoT applies `hasHealth.hp -= hpDamage`
  directly (`dotPrototype.ts`) and never enters it. Swamp measured as *safer than Plains*
  until this was found; its true figure is **27× higher**. The new `hp_lost_per_hr` column
  sums per-tick HP decreases and therefore catches every damage path by construction. **The
  old `damage_taken` column is still pipeline-only — do not use it for cross-biome
  comparison.**
- **The farm CSV header declared a dead `density` column**, shifting every field after it.
  Left over from the `pace`→`modifier` rename. Any farm CSV produced between that rename and
  this fix is mislabelled.

---

## 5. How to reproduce the measurements

```bash
pnpm db:up      # bench needs Postgres for the baked hitbox cache; it feeds inAttackRange
pnpm bench:balance -- --mode farm --tier 1 --time-scale 1 --max-seconds 300 --gear-sweep 3
```

- **`--time-scale 1` is required.** The farm bench has a measured fidelity ceiling of 2, and
  concurrency is pathing-sensitive; anything faster distorts pull shapes.
- `--biome` takes a **single** value, not a comma list. Use `--tier 1` for all five.
- One tier at 300s × 6 builds ≈ 15 minutes.
- Output is CSV on stdout; rows match `^[a-z].*-root,`.

---

## 6. Things a fresh session must not trust

- **`CONCURRENCY` in `tools/tier-table.ts` is wrong.** It asserts `plains 5, forest 3,
  swamp 2, mountain 2, cave 2`. Measured in-combat values are `2.48 / 1.40 / 0.84 / 1.07 /
  1.00` (Plains and Forest only reach those after this session's pull-range change; they
  were 1.01 and 1.29 before). Swamp/Mountain/Caverns sitting at ~1.0 is *correct* — they are
  duel biomes by design, and only looked wrong against the invented 2.
- **The T1 monster DPS targets were derived from those wrong values** via
  `DPS = sustained / ((N+1)/2)`. Plains was divided by 3 for a swarm that did not exist, so
  its monsters are roughly 3× weaker than the intended sustained pressure implies. Every
  per-biome DPS number in the current T1 data inherits this.
- **`sustained = d·(N+1)/2` compares raw monster DPS and ignores player mitigation.** Given
  the finding in §1, it cannot rank biome difficulty on its own. It remains useful for
  monster-vs-monster shape *within* a biome.
- **The modifier reward multipliers are stale** — set when Dominion removed 30% of bodies
  rather than 15%, and priced per kill while players optimise per hour. Parked for a separate
  economy session.
- **Catalyst icons are borrowed art.** Fortified wears the green crystal while its badge is
  steel; `TODO(art)` in `client/src/ui/economyIcons.ts`.

---

## 7. The encounter model (still valid, still useful)

Autocombat focus-fires, so a pull of N monsters burns down one at a time:

```
monster k dies at   t_k = k·h/P
damage taken        = d · (h/P) · N(N+1)/2

sustained   = d · (N+1)/2      attrition rate; monster eHP and player DPS both cancel
costPerKill = d · h · (N+1)/2  punishment per unit of progress
pullLoad    = d · h · N(N+1)/2 the spike of one pull — QUADRATIC in N
```

Two results worth carrying forward:

1. **Monster eHP cancels out of sustained pressure.** Durability makes a biome slower, not
   more dangerous. A difficulty curve led by HP reads as tedium.
2. **Damage taken is quadratic in concurrency**, so `density × mean DPS` is wrong in the
   *exponent*. Population is a far more sensitive lever than any stat multiplier — which is
   why the Swarming/Dominion modifiers had to be tuned to a timid 1.2 / 0.85.

The time-weighted mean attacker count **is** `(N+1)/2`, so the bench measures the term the
model consumes directly rather than measuring N and inferring it.

---

## 8. Uncommitted worktree

53 modified files, ~1,230 insertions. Three overlapping bodies of work, none committed:

1. **T1 monster rebalance** — `shared/src/data/monsters/{plains,forest,swamp,mountain,cave}.monsters.ts`
2. **Node-modifier rework** — five modifiers (`alacrity, heavy, swarming, dominion,
   fortified`), the `pace`→`modifier` rename across ~15 files, catalyst re-key across 66
   recipe entries, `PaceIcon`→`ModifierIcon`
3. **Bench concurrency telemetry** — `server/bench/**`, plus the two bug fixes

Untracked: `tools/tier-table.ts`, `server/bench/balance/concurrency.ts`,
`server/test/concurrencySampler.test.ts`, `client/src/ui/map/ModifierIcon.tsx`,
`docs/briefs/t1-balance-context-2026-08-18.md`, `reports/tier-*-table.md`.

**Verification at handoff:** `pnpm typecheck` clean, `pnpm test` **81/81**, `pnpm build`
clean. Run `git status` before editing — the user may have committed since.

⚠ **The node-modifier list controls the map's node count.** `buildRegionNodes` emits one node
per non-banned modifier plus one extra for the biome's native, and region masks are hand-cut
to fit exactly. Changing `MODIFIER_BANS`, `NATIVE_MODIFIER`, or the modifier count breaks
the masks. Totals: 144 non-dungeon nodes, 140 carrying a modifier, 26 dungeons, 170 all in.

---

## 9. Suggested opening prompt

> Read `CLAUDE.md`, `docs/briefs/mitigation-rebalance-handoff-2026-08-18.md`, and
> `docs/briefs/t1-balance-context-2026-08-18.md`. We are fixing T1 biome armour so each
> biome's intended mitigation actually answers that biome's damage shape. Start by auditing
> what mitigation T1 gear can currently provide per slot — especially whether
> `defense.max-hit-pct` is reachable at all on T1 items, and whether any DoT-resist exists.
> Do not change monster stats yet. Preserve the existing dirty worktree.
