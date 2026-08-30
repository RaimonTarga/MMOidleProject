> **ARCHIVED — superseded 2026-08-30.** The numerical balance work this audit was scoping
> for was carried out instead through the T1-T4 progression-economy passes (see
> `docs/briefs/T4_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md` and its T1-T3
> predecessors) and `docs/tier-balance-current-state.md`. Kept for the instrument verdict
> table, confirmed bug list, and combat formula map.

# Balance Tool Audit — Handoff for the Numerical Balance Planner

**Audience:** the AI that will write the numerical balance roadmap. Not written for human presentation.
**Date:** 2026-08-23. **Scope:** numerical combat balance only. Structural design frozen.
**Predecessor:** `docs/briefs/balance-instrument-inventory-2026-08-23.md` (what the tools *claim* to do).
This document is what the repository *actually* does, verified against source.

> **Contract note.** `BALANCE_PHASE_KICKOFF_2026-08-23.md` does not exist anywhere in the
> repo, working tree, or git history. The working contract used here is the task brief as
> stated by the user: no rebalancing, no redesign, no economy/reward/crafting changes,
> numerical combat parameters only. If a kickoff document exists elsewhere, re-check
> §9 and §11 against it before acting.

---

## 1. Executive findings

1. **Every instrument runs.** `pnpm typecheck` (incl. `typecheck:bench`) exits 0;
   `test:balance-instruments` passes; all reports regenerate. One script (`monster:ref`)
   was dead on arrival and has been repaired (§3.1).

2. **The analytical layer models a different player than the simulation layer does.** The
   four analytical instruments build a `PlayerStatsTarget` carrying weapon + armour +
   charm + mobility and nothing else — **no core, no relic, no rune, no rite, no stance,
   no ability**. The bench equips all of them. Neither family documents the divergence.
   Absolute comparisons between the two are invalid today.

3. **Two concrete formula divergences from runtime were found** (§3.3, §3.4), not just
   omissions. Both affect the "worst spike" columns that a balance pass uses to find
   one-shot risk, and they push in *opposite directions* on different monsters, so spike
   is not comparable across the roster.

4. **`ehp-report` documents three mitigation approximations it does not implement**
   (hardening / stationary-DR / sustained-fight-DR). Four of seven T3/T4 armour lineages
   are scored with zero credit for their signature mechanic (§3.2).

5. **`tier:table` is the healthiest instrument** and reads essentially every monster-rework
   primitive. The inventory's suspicion against it is rejected.

6. **The game is currently unclearable at T1 by the bench's account.** A full boss exam
   returns **150/150 `bot_died`, every boss 0/30**. Tier advance needs two T1 seals, so
   this is a hard gate. This is not an instrument fault — the instruments are working.

7. **Recommended posture:** three small repairs (§10) unlock trustworthy measurement.
   Do not build an absolute-pitch instrument, a T0→cap runner, or a tuning overlay for
   this pass — §7 argues each is not worth its cost here.

8. **STATUS 2026-08-23: every required repair is done (§3.8).** Findings 3 and 4 above are
   now historical — read them for what the old outputs mean, not for what the tools do.
   Finding 2 (the loadout gap) is disclosed in every report but NOT closed; it needs
   designer decision **D4**. Findings 5 and 6 stand unchanged. The repair moved the T1
   biome threat ORDER, so any conclusion drawn from a pre-repair `mob-report` is void.

---

## 2. Instrument verdict table

| Instrument | Actual measurement | Current trust | Important omissions / staleness | Verdict | Intended role |
|---|---|---|---|---|---|
| `tools/tier-table.ts` (`pnpm tier:table`) | Player-free monster description; sustained pressure `d·(N+1)/2`; eHP curve over probes at 0.5/1/2/4× tier median attack; node modifiers applied | High, **within a tier only** | eHP probes differ per tier → no cross-tier comparison; ignores `targeting`; reaches `chargedAttack` through an `as unknown as` cast (rename-fragile) | **KEEP** | The monster **relative ladder**. Sole authority on "is biome A harder than biome B at tier N". |
| `tools/monster-ref.ts` (`pnpm monster:ref`) | Verbatim authored dump, incl. boss scripts/phases/ultimates | High (nothing to be wrong) | Was **completely broken** until this audit; now fixed | **KEEP** | Ground truth on what is authored. First stop before changing any monster number. |
| `tools/mob-report.ts` (`pnpm mob:report`) | Monster threat vs reconstructed reference players (entry +3) | Medium **(repaired §3.8)** | ~~charged/consecutive blindness~~ and ~~pre-mitigation spike~~ FIXED. Remaining: reference DPS still comes from the character-**panel** estimator (excludes T4 specs/abilities/relics); no fully-geared profile; no core/relic/rune/rite/stance | **NARROW** | Sustained incoming-pressure and spike cross-check. `tier:table` remains the ladder authority. |
| `tools/dps-report.ts` (`pnpm dps:report`) | Class build × weapon offensive output over 60 s, full upgrade | Medium-high **for relative weapon/class ranking**; low for absolute | No cores/relics/runes/rites/stances/abilities; models monster `enemySoftCap`/`enemyShield`/shatter but not `shellUp` | **NARROW** | Relative offensive comparison **within** the equipped subset. Not an absolute DPS oracle. |
| `tools/ehp-report.ts` (`pnpm ehp:report`) | Class build × armour × charm survivability, eHP/TTL/sustain | Medium **(repaired §3.8)** | ~~3 unimplemented DR ramps~~ and ~~pre-multiplied spike~~ FIXED; reactive plating added. Remaining: no stance/core/relic; on-kill Recovery and barrier recharge still unmodelled (both disclosed in row notes) | **KEEP** | The defensive equipment comparator. Read the ramp assumptions in §3.8 before trusting Tundra/Volcanic rows. |
| Admin **Balance Lab** (`shared/src/systems/balanceLab.ts`) | Live game-wide view; `encounter-burden-v1`; progression policy assessment | Inherits `mob:report`'s model | Same reference-player gap as §3.5; same +3 anchor; read-only | **NARROW** | Browsing and discovery. Its indices are explicitly not gates — keep it that way. |
| `bench:balance --mode farm` | Real world, real repopulation, ledger-diffed income + deaths + concurrency | **High** | Time-scale ceiling 2; economy out of scope this phase — read it for **deaths/concurrency/TTK**, not payouts | **KEEP** | Runtime truth for concurrency, death rate, and open-world pressure. |
| `bench:balance --mode boss` | Dungeon **guard** fights (not bosses) | Zero for bosses | Never activates the altar; every historical "boss" row is a guard row | **RETIRE** (for boss work) | Delete from the balance vocabulary. Use `bossExam`. |
| `bench:balance --mode overlord` | 4-bot party vs Void Overlord | Medium | Abyss has no craftable gear → fallback loadout; huge sample space | **NARROW** | T4 endgame only. Out of scope until T1–T4 is sane. |
| `server/bench/bossExam.ts` (`pnpm boss:exam`) | Isolated boss encounter, guard stripped, boss force-woken | **High** | `ttk` extrapolated on death (optimistic vs hardening phases) | **KEEP** | The boss tuning instrument. |
| `tools/balance-tui/` (`pnpm bench:tui`) | Parallel driver + difficulty scoring over the bench CLI | Inherits its CLI | Its balance score is tuned for **boss/overlord** windows (60–180 s / 1080–1200 s) | **KEEP** | Throughput driver. Its score is a triage bucket, not a target. |
| `bench:server` (`pnpm bench:server`) | Tick/broadcast percentiles | n/a | — | **NON-BALANCE** | Performance only. Must not enter balance conclusions. |
| `shared/src/systems/dpsEstimate.ts` | Character-panel planning DPS | n/a for balance | Self-documented as non-authoritative; excludes T4 specs, abilities, relics | **NON-BALANCE** | Player-facing UI. It leaks into `mob:report` (§3.5) — that is the problem, not the file. |
| `shared/src/systems/combatEstimates.ts` | Mirror of the runtime direct-hit formula | Medium, **now guarded** | Still a reimplementation, but F1/F2/F3 pin it to the runtime | **NON-BALANCE** (but load-bearing) | Shared kernel under three instruments. |
| `pnpm test:balance-instruments` | Bench loadout honesty | High | Covers bench only, not the reports | **KEEP** | Regression guard. Extend it with §8 fixtures. |

---

## 3. Confirmed stale assumptions / bugs

### 3.1 `monster:ref` was completely broken — FIXED

* **Problem.** `pnpm monster:ref` and `monster:ref:md` died with `MODULE_NOT_FOUND`;
  `@mmo-idle/shared` never resolved.
* **Source.** `package.json:41-42` used `pnpm --dir server exec tsx …` and omitted
  `--tsconfig ../tools/tsconfig.json`.
* **Effect.** `reports/monster-ref.md` / `.html` had **never existed on disk**. This is
  the identical defect W5a fixed in `mob:report` on 2026-08-11, never applied to its sibling.
* **Repair.** Applied. Both lines now match the working tools; both outputs verified.
* **Historical outputs.** None existed. Nothing invalidated.

### 3.2 `ehp-report` claims mitigation approximations it does not implement — **FIXED 2026-08-23**

* **Problem.** The methodology text states *"Cheat-death, hardening/stationary/sustained-fight
  DR ramps use mid-point or one-shot approximations."* Cheat-death is real. The three DR
  ramps are **absent** — `defense.hardening-*`, `defense.stationary-dr-*` and
  `defense.sustained-fight-*` appear nowhere in the file. `evaluateSurvivability()` reads
  only `stats.mitigatesDamage.plating` and `.damageReduction`.
* **Source.** `tools/ehp-report.ts:565` (`evaluateSurvivability`), claim at `:1638`.
* **Effect.** 30 of 48 authored `defense.*` keys are unread. The ones carrying real values
  are concentrated in the late-tier armours whose identity they are:

  | lineage | key | authored | credited |
  |---|---|---|---|
  | Volcanic | `hardening-per-sec` / `-max` | +3/s → +24 plating | 0 |
  | Tundra | `stationary-dr-pct` | 0.15 – 0.20 DR | 0 |
  | Trench | `sustained-fight-dr-bonus` / `-max` | → +0.05 DR | 0 |
  | Wasteland | `hit-plating-per-stack` | +1 × 5 stacks / 4 s | 0 |
  | Jungle / Volcanic | `overheal-ward-pct` | 0.25 / 0.50 | 0 |
  | Plains charm | `recovery-on-kill-pct` | 0.20 for 4 s | 0 (documented blind spot) |

  In an idle game whose auto-combat player stands and fights, Tundra's stationary DR is
  close to permanently active and reads as zero. Four of seven T3/T4 armour lineages are
  mis-ranked against each other.
* **Repair.** Implement the three ramps as duty-cycle/mid-point averages exactly as the
  text already claims, **or** delete the claim and add them to the omissions list. The
  former is ~40 lines and is the recommendation. Follow the working principle: a
  conditional defence must not be valued as permanently active — `stationary-dr` should be
  parameterised by an assumed stationary fraction, not assumed 100%.
* **Historical outputs.** Every `ehp-report` / `ehp-llm-packet` ever produced mis-ranks
  T3/T4 armour. T1/T2 rows are largely unaffected (those lineages author none of these keys).

### 3.3 Spike damage is computed in the wrong order vs runtime — **FIXED 2026-08-23**

* **Problem.** Runtime multiplies the empowered/charged multiplier **after** mitigation.
  Both `mob-report` and `ehp-report` multiply the attack **before** plating subtraction.

  ```
  runtime : dmg = max(1, round( max(0, A − P) × (1−DR) × (1−drLayer2) )) × M
  reports : dmg = max(1, round( max(0, A×M − P) × (1−DR) ))
  ```
* **Source.** Runtime `server/src/systems/combat/engine/combat.ts:697-762`.
  Reports: `tools/mob-report.ts:530`, `tools/ehp-report.ts:641-646`.
* **Effect.** `(A−P)·M < (A·M−P)` whenever `P>0` and `M>1`. Example A=100, P=20, M=3:
  runtime 240, reports 280 → **+17% overstatement**, and the error grows with plating
  share. Combined with §3.4 the two errors run in opposite directions on different
  monsters, so the "worst spike" column cannot be compared across the roster.
* **Repair.** Move the multiplier outside `estimateMonsterHitDamage`: compute the mitigated
  base hit first, then multiply. Three call sites.
* **Historical outputs.** All spike / one-shot-risk columns in every `mob-report` and
  `ehp-report` are wrong by a plating-dependent factor. Sustained-DPS columns are unaffected.

### 3.4 `mob-report` is blind to charged attacks and consecutive hits — **FIXED 2026-08-23**

* **Problem.** `rawDirectDps()` is `attack × attacksPerSecond` and nothing else.
  `monsterSpikeMult()` checks `cadenceFinisher`, `empoweredCooldown`, `aoeAttack`,
  `rampOnCombat` and boss-script enrage/stat-buff/slam — **never `chargedAttack`**. The
  strings `chargedAttack` and `consecutiveHits` do not appear in the file.
* **Source.** `tools/mob-report.ts:120` and `:137`.
* **Effect.** **47 of 134 monsters (35%) carry a `chargedAttack`** — 22 bosses, 25 normal
  mobs. The charged cast is the centrepiece of the boss encounter rework and the single
  largest telegraphed hit in the game. Their spike reads as `×1`. `tier-table` was taught
  to price charged attacks on 2026-08-23; `mob-report` never was, so the two monster
  instruments now disagree by construction.
* **Repair.** Port `tier-table`'s charged-attack cycle model (`tools/tier-table.ts:404-431`,
  which correctly amortises `castMs` against `cooldownMs`) and add `consecutiveHits` to
  `rawDirectDps`. Fix §3.3 at the same time — they touch the same lines.
* **Historical outputs.** Every `mob-report` and `mob-llm-packet` understates threat for a
  third of the roster, concentrated in exactly the encounters a balance pass cares most about.

### 3.5 The analytical reports model four of nine player power sources — **DISCLOSED 2026-08-23** (still a modelling gap)

* **Problem.** `dps-report`, `ehp-report`, `mob-report` and `balanceLab.ts` import only
  `ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `SKILL_TREE`, `GAME_CONFIG`. No
  core / relic / rune / rite / stance / ability database. None ever sets `activeStance`.

  | power source | analytical | bench |
  |---|---|---|
  | weapon / armour / charm / mobility | ✅ | ✅ |
  | class affinities | ✅ (free via `recalculatePlayerStats` §3d) | ✅ |
  | cores | ❌ | ✅ |
  | relics | ❌ | ✅ (T4+) |
  | rites | ❌ | ✅ |
  | runes | ❌ | ✅ |
  | stances | ❌ | ✅ (`perfection-stance`, T2+) |
  | abilities (Technique/Guard) | ❌ | ✅ |
* **Source.** Import blocks of all four files; `shared/src/systems/stats.ts:221` (stance
  step 2a), `:290` (stance step 3e), `:379` (core step 3c) — the code paths exist and are
  simply never fed.
* **Effect.** Two independent problems.
  (a) **Magnitude.** Stance modifiers reach ±40% attack, ±40% plating, ±25% damage-taken,
  ±35% move speed (`shared/src/stances.ts:154-297`, 11 stances). Cores are a final
  multiplicative layer on attack/maxHp/plating/speed/recovery/attack-speed. These are
  first-order, not rounding.
  (b) **Composition.** Because the omission is uniform across rows, *relative* weapon-vs-weapon
  and armour-vs-armour ranking survives. Absolute pitch, and any comparison against bench
  numbers, does not.
* **Repair.** Two options, and this is a **designer call** (§9-D4): either feed the reports
  a declared canonical loadout matching the bench (`perfection-stance`, tier-legal core, no
  relic below T4), or leave them bare and print a loud banner. Do **not** leave it undocumented.
* **Historical outputs.** Not invalidated for relative ranking. Invalid for any absolute claim.

### 3.6 `combatEstimates.ts` is a hand-mirrored reimplementation — **GUARDED 2026-08-23**

* **Problem.** Its own header says it *"intentionally mirror[s] the server's authoritative
  direct-hit formulas in `server/src/systems/combat/engine/combat.ts`"*. It is a second
  copy, and it already lags: it omits `shared.damage-mult`, `playerOutgoingDamageMult`,
  `core.onhit-mult`, formation weights, partial-evade scaling, `shellUp`, shatter
  vulnerability, `enemySoftCap`, `enemyShield`, `drPierce` and brittle.
* **Source.** `shared/src/systems/combatEstimates.ts` vs `combat.ts:355-460`.
* **Effect.** It is the shared kernel under `dps-report`, `ehp-report` and `mob-report`.
  `dps-report` re-adds soft-cap / shield / shatter / `shared.damage-mult` itself; the other
  two do not. Silent drift, invisible to typecheck.
* **Repair.** Do not refactor. Add parity fixture **F1** (§8) so drift becomes a test failure.
* **Historical outputs.** Not separately invalidated — the omissions are the ones already
  itemised above.

### 3.7 Suspicions investigated and **REJECTED**

| Suspicion | Verdict | Evidence |
|---|---|---|
| `mob:report` uses upgrade 3 while others use max 5, i.e. a stale literal | **FALSE** — deliberate | `tools/mob-report.ts:55` + `shared/src/systems/balanceLab.ts:152` both use +3 and **label it** (`Entry (prev-tier +3)`, `Same-tier +3`). `design_docs/player-power-curve.md §5` documents `+3` as the intended gear budget anchor. It models an *entry* player by design. **Residual issue:** that doc was written when +3 *was* the cap, and `mob-report` therefore has **no fully-geared profile at all** — see §9-D3. |
| `tier:table` misses monster-rework mechanics | **FALSE** | It reads `appliesAntiheal`, `appliesMark`, `appliesPlatingShred`, `appliesVulnerability`, `cadenceFinisher`, `cadenceVolley`, `chargedAttack` (+riders), `consecutiveHits`, `empoweredCooldown`, `empowersAllies`, `enemyShield`, `enemySoftCap`, `markedStrike`, `openingStrike`, `openingVolley`, `raisesDead`, `shellUp`, `swarm`, `pack`. Best-maintained instrument in the set. Only `targeting` is unread. |
| T1 `bossExam` results merely "stale" | **UNDERSTATED, not false** | Re-run 2026-08-23: 5 bosses × 5 armour sets × 6 roots, gear +max, time-scale 1 → **150/150 `bot_died`, every boss `0/30`**. Cost 3.4–5.0 full health pools/fight; best HP removed anywhere 48.1%. Corroborated by farm bench: fully-upgraded cadence bot, T1 cave node, **8 deaths / 300 sim-seconds**. Not an instrument fault. |
| `player-power-curve.md` "Cadence damage cap" is stale invention | **FALSE** | `cadence-root` genuinely authors `defense.max-hit-pct: 0.25, defense.max-hit-mult: 0.5` (`rootsAndFrames.ts:102`). The doc's shorthand is loose (it halves the excess, not a hard clamp) but the mechanic is real. |
| `ehp-report`'s no-recharge barrier is a bug | **FALSE — stated limitation, and aligned with intent** | `energy-root` description: *"It recharges between fights, not during them."* Within-fight treatment as a one-time buffer is correct. It only understates multi-pack farm throughput, which the file says in three places. |

---

## 3.8 Repair log — 2026-08-23

All five "required before trusting the tools" items from S10 are done. `pnpm typecheck`
(incl. `typecheck:bench`) is clean and the full suite passes.

| # | Change | Files |
|---|---|---|
| R1 | `monster:ref` script repaired (`-C server` + `--tsconfig`) | `package.json` |
| R2 | Spike now mitigates FIRST, then multiplies | `tools/mob-report.ts::mitigatedSpike`, `tools/ehp-report.ts::evaluateSurvivability` |
| R3 | `mob-report` learned `consecutiveHits`, `cadenceVolley`, `cadenceFinisher`, the charged-attack cycle and `empoweredCooldown`; `monsterSpikeMult` learned `chargedAttack`, `openingStrike`, `markedStrike` | `tools/mob-report.ts::beatMultiple`, `::directDpsWith`, `::monsterSpikeMult` |
| R4 | The three DR ramps + reactive plating are now modelled as duty-cycle averages | `tools/ehp-report.ts::rampedMitigation` |
| R5 | Loadout-gap banner on all three reports, both packet families, and the Lab | `tools/balance-data.ts::LOADOUT_MODEL_NOTE`, `shared/src/systems/balanceLab.ts` |
| R6 | Parity fixtures F1, F2, F3, F7, F8, F9 | `server/test/instrumentParity.test.ts` |
| R7 | `bossExam` promoted to `pnpm boss:exam` | `package.json` |

### What the corrections actually moved

Measured by regenerating the T1 packet with the pre-fix tool and the post-fix tool against
**identical authored data**, so this isolates the repair from unrelated data drift.

**These are instrument corrections, not balance changes. No game number was touched.**

| reading | pre-fix | post-fix |
|---|---:|---:|
| T1 avg total monster DPS | 17.6 | **21.3** |
| Caverns mean / max incoming DPS | 21.1 / 27.4 | **25.4 / 36.0** |
| Mountain mean / max incoming DPS | 12.6 / 12.8 | **20.5 / 21.3** |
| Caverns worst spike (%HP, entry player) | 45.7% | **91.5%** |
| Mountain worst spike | 22.9% (Cliff Hopper) | **57.2% (Ridge Ambusher)** |

Two consequences the roadmap must absorb:

1. **The T1 biome threat ORDER changed.** Pre-fix `Caverns > Swamp > Mountain > Forest >
   Plains`; post-fix `Caverns > Mountain > Swamp > Forest > Plains`. Mountain and Swamp
   swap. Any prior conclusion drawn from `mob-report`'s biome ranking is void.
2. **The worst-spike monster changed identity in Mountain** — the tool had been naming
   Cliff Hopper while Ridge Ambusher's charged cast is more than twice as large. Spike
   conclusions from old packets named the wrong monster, not merely the wrong number.

Note that `tier:table`'s ladder is **unaffected** — it already priced these mechanics, which
is why it and `mob-report` disagreed. They now agree in direction.

### NEW FINDING — `tools/` has no compile-time safety net at all

Found while making these repairs: an unescaped backtick — a hard syntax error — passed
`pnpm typecheck` cleanly and was caught only when esbuild tried to run the tool.

* `server/tsconfig.bench.json` includes `["src", "bench"]`. **Not `tools/`.**
* `tools/` is not a pnpm workspace package (`pnpm-workspace.yaml` lists client, admin,
  server, shared), so `pnpm -r exec tsc` never visits it.
* `tools/tsconfig.json` exists but has no `include` — it is only a `--tsconfig` argument
  passed to tsx at runtime for path mapping.

So `dps-report`, `ehp-report`, `mob-report`, `tier-table`, `monster-ref` and
`balance-data` — every analytical instrument — are verified by nothing except someone
running them. A rename in `shared/` breaks them silently. This is the mechanism behind
§3.6's silent-drift risk, and it is worse than §5.6 of the inventory claimed.

**Not fixed here, deliberately.** `tsc -p tools/tsconfig.json` currently reports a large
pre-existing backlog: no `@types/node` wired in, a `module`/`import.meta` mismatch, plus
real type errors (`EvadesHits.charge` missing, `StatusEffect` literals missing
`refreshable`/`instanced`). That is the same situation `server/test/` is in and is its own
cleanup job, not part of a balance-tool repair.

Two options for the roadmap, cheapest first:
1. **Parse-only guard** (~10 lines): run esbuild's transform over `tools/*.ts` in `pnpm test`.
   Catches exactly the class of error that bit this session; ignores the strictness backlog.
2. **Full coverage**: wire `@types/node`, fix `module`, clear the backlog, add
   `typecheck:tools`. Real safety, real effort.

---

### Modelling choices that need a designer eye

`rampedMitigation` had to assume two things the repo does not state. Both are named
constants at the top of `tools/ehp-report.ts`, both are printed in every affected row note,
and neither is credited at 100%:

* `STATIONARY_FRACTION = 0.5` — anchored to the farm bench's **measured** `contact_uptime`
  (0.50 for a fully-upgraded cadence bot on a T1 cave node, 2026-08-23), not invented.
  Overridable with `--stationary-fraction` for sweeps. Tundra's 15% stationary DR therefore
  reads as +8%, not +15%.
* `HARDENING_SPIKE_INTERVAL_SEC = 12` — assumed gap between hits large enough to trip
  `hardening-reset-pct` when only the attacker's spike crosses it. Volcanic's +24 plating
  reads as +22.4 averaged against an attacker that never trips the reset.

If D2 (encounter duration) or D5 (intentional matchup spread) lands differently, revisit
both. They are the only judgement calls in the repair.

---

## 4. Authoritative combat formula map

Format: **formula → authoritative source → which instrument reproduces it.**

### 4.1 Player stat pipeline (single authority)

`shared/src/systems/stats.ts :: recalculatePlayerStats(p)` — ordered, and the order is load-bearing:

```
1   base            ← GAME_CONFIG (ATTACK 15, PLATING 2, MAX_HP 100, RECOVERY 10, COOLDOWN 3000ms)
1b  weapon APS      ← effectiveAttacksPerSecond(weapon, plus)  → attackCooldown = 1000/aps
2   skill nodes     ← flat adds; attackSpeedPct and evasion accumulate, do not apply yet
2a  stance          ← attackSpeedPct += , evasion += , mechanicEffects merged
3   equipment       ← statModifiers + mechanicEffects + upgrade deltas (per slot)
                      core slot skipped entirely unless coreIsActive(eligibility, selectedRange)
3d  class affinity  ← applyClassAffinities()   percentages, ONCE, after gear
3e  stance pct      ← applyStanceModifiers()   attackPct/platingPct/moveSpeedPct multiplicative
    cadence profile ← resolveCadenceRelicProfile(threshold, mult, relicRatings)
3a/3b on-hit/tier   ← Shockblade / Dualslinger per-tier on-hit adds
    DR clamp        ← min(0.9, max(0, DR))
    evasion         ← dodgeRate = evasionDodgeRate(Σevasion); evadeMitigation = 0.5 + defense.evade-mitigation
3b  reload layer    ← if !snipe && !laser: attack = max(1, floor(attack × 0.65))
                      if !snipe: cooldown = max(200, round(cooldown × 0.5)); gatling halves again (floor 100)
                      if snipe : attack += round(attack × attackSpeedPct × snipe-as-to-dmg); cooldown = snipe-cadence-ms
3c  core layer      ← attack/maxHp/plating/speed/recovery ×(1+mult); cooldown ÷(1+atkSpeedMult)
4   range floor
5   hp clamp
```

Reproduced by: **all four analytical tools call this function directly** — so base stats,
skills, equipment, upgrades, affinities and the reload layer are *correct by construction*.
They diverge only by **what they put into `p`**: no `activeStance`, no core/relic/rune in
`equipment`, so steps 2a / 3e / 3c and the cadence relic profile are silently inert (§3.5).

**Attack speed convention:** sum `attackSpeedPct` additively, apply **once** at
`cooldown /= (1 + Σ)`. Never apply twice.

### 4.2 Player → monster hit (authoritative)

`server/src/systems/combat/engine/combat.ts :: runPlayerAttack` (~:355-460)

```
effP   = effectivePlatingAfterShred(target.plating, cs, ctx.metadata.platingShred)
effDR  = effectiveDamageReductionAfterBrittle(target.DR, cs) × (1 − clamp(ctx.drPierce))
dmg    = max(1, round( max(0, attack×minionDamageMult − effP×ctx.platingMult) × (1−effDR) ))
dmg   ×= (1 + shared.damage-mult)
dmg   ×= playerOutgoingDamageMult(cs)                    // e.g. Volcano heat
dmg   += round(onHitDamage × onHitMult × (1+core.onhit-mult) × formationOnHitWeight)
dmg   ×= (1 − evadeMult) if partially evaded ; = 0 if chaoticMiss
dmg   ×= shellDamageMult(target)                          // Snapper retracted
dmg   ×= monsterShatterVulnerabilityMult(target)
dmg    = applyEnemySoftCap(...) ; then applyEnemyShield(...)
```

`ctx.platingMult = 0.5` for reload (set in its `beforeAttack` listener) — this is the
**reload plating-bypass**, distinct from the 0.65 damage layer in §4.1.

Reproduced by: `shared/src/systems/combatEstimates.ts::estimatePlayerHitDamage` — **only
the first line plus `+onHitDamage`**. `dps-report` re-adds `shared.damage-mult`, shatter,
`enemySoftCap`, `enemyShield` on top (4-5 refs each); `mob-report` re-adds soft-cap/shield
only; `ehp-report` none. Nobody models `shellUp`.

### 4.3 Monster → player hit (authoritative)

`combat.ts :: runMonsterAttack` (~:690-780)

```
drLayer2 = clamp(target.passives['core.dr-layer-pct'], 0, 0.9)
dmg = max(1, round( max(0, mAttack − platingAfterShred(target.plating)) × (1−DR) × (1−drLayer2) ))
dmg ×= monsterDeathEmpowerMult(monster)                       // wasteland
dmg ×= ambientRampScalingMult(scalesWithAmbientRamp, cs)      // tundra chill feed
empoweredMult = monsterEmpoweredMultiplier(cadenceFinisher | empoweredCooldown | openingStrike)
              × chargeMult                                    // chargedAttack
              × markedStrike.multiplier (consumes Sun Mark)
dmg ×= empoweredMult                                          // ← AFTER mitigation
→ onHit → onDamageTaken listeners
```

**Defense listener order** (registered in `initDefenseSystems()`, `server/src/systems/defense/index.ts`):
`evasion → damage cap → wards → barrier → barrier-break heal → hit-to-DoT → cheat death → absorb`.

Reproduced by: `estimateMonsterHitDamage` (first line only, no `drLayer2`). `ehp-report`
adds damage-cap, hit-to-DoT, DoT-resist, cheat-death, barrier-as-pool. **§3.3 order bug lives here.**

### 4.4 Defensive subsystems

| Layer | Formula | Source | Modelled by |
|---|---|---|---|
| Plating | flat subtract **before** DR, 1-dmg floor | `combat.ts`, `damage/effectivePlating.ts` | all (correct) |
| % DR | `×(1−DR)`, clamped 0.9 in `stats.ts`, re-clamped in place | `stats.ts:~333` | all (correct) |
| Core DR layer 2 | separate multiplicative `×(1−core.dr-layer-pct)`, clamp 0.9 | `combat.ts:696` | **none** |
| Recovery | `hp/s = maxHp × (recovery/100) × activeFraction`; fractions from different sources **add**, same-source takes `max` | `defense/regen/recovery.ts:143` | `ehp-report` **faithfully** |
| Barrier | pool `= defense.barrier-pct × maxHp`; refills `BARRIER_RECHARGE_PCT 0.25`/s of max after `BARRIER_DELAY_MS 4000` undamaged; sized once in `syncBarrier` | `defense/barrier/barrier.ts` | `ehp-report` as one-time buffer (stated, intent-aligned) |
| Wards | absorb **first**, before barrier; from `defense.overheal-ward-pct` | `defense/barrier/wards.ts` | **none** |
| Absorb | fraction of incoming repaid as HoT | `defense/regen/damageAbsorb.ts` | `ehp-report` as steady HP/s |
| Damage cap | `> max-hit-pct×maxHp` → `threshold + excess × max-hit-mult` | `defense/mitigation/damageCap.ts` | `ehp-report` **exactly** |
| Evasion | deterministic accumulator, `dodgeRate` × `evadeMitigation (0.5 + bonus)`; **full evade applies no debuffs/DoT** (`evadeBlocksDebuffs`) | `defense/mitigation/evasion.ts`, `stats.ts` | `ehp-report` as `1 − dodge×mitigation` |
| Hardening / Stationary DR / Sustained-fight DR | ramping DR & plating | `defense/mitigation/{hardening,stationaryDr,sustainedFightDr}.ts` | **none** — §3.2 |
| Reactive plating | on-hit plating stacks | `defense/mitigation/reactivePlating.ts` | **none** |
| Hit-to-DoT | redirect fraction to a debt pool draining with `dot-resistance` | `defense/mitigation/hitToDot.ts` | `ehp-report` |
| Cheat death | one extra bar + post-heal | `defense/mitigation/cheatDeath.ts` | `ehp-report` |
| Cleanse | interval heal, empty-branch | `defense/mitigation/debuffCleanse.ts` | `ehp-report` (empty branch only) |

### 4.5 Offensive archetypes

| Mechanic | Authority | Analytical coverage |
|---|---|---|
| Cadence empowered | `engine/empoweredAttacks.ts`, `shared/systems/empoweredMult.ts`, threshold via `resolveCadenceRelicProfile` | `dps-report` ✅ (relic profile ❌) |
| Cooldown spike | `empoweredAttacks.ts` | `dps-report` ✅ |
| Reload 0.65/×0.5, snipe, gatling, laser | `stats.ts:344-378` + `classes/archetypes/reload/*` | `dps-report` ✅ (documented at `:2324-2327`) |
| Energy | `shared/systems/energyMax.ts`, `energyUpkeep.ts`, `upkeepOnHitBonus` | `dps-report` ✅ |
| DoT conversion / stacking | `shared/systems/dotClassProfile.ts`, `debuffScaling.ts`; ticking in `combat/status/dotPrototype.ts` (**writes `hp -=` directly, bypasses `onDamageTaken`**) | `dps-report` ✅ |
| Summoner formation | `shared/systems/summonerProfile.ts`, `classes/archetypes/summoner/*`; `ctx.formation` weights | `dps-report` ✅ |
| Abilities (Technique/Guard) | `shared/abilities.ts` (18 abilities, 2 slots), `player/abilities/abilityCasting.ts` | **none** |
| Stances (11) | `shared/stances.ts`; `damageTakenPct` read at hit time by the stance listener | **none** |
| Cores | `shared/systems/cores.ts` + `stats.ts:379` | **none** |
| Relics | `shared/systems/relics.ts`, `relicEquipment.ts` | **none** |

### 4.6 Encounter / world

| Subject | Authority | Coverage |
|---|---|---|
| Boss phases / repeating actions / adds / pools / shields | `combat/ai/bossScripts.ts`; 26 authored `bossScript`s | `tier-table` opener only; `mob-report` enrage/stat-buff/slam only; **`bossExam` fully (it runs them)** |
| Charged attacks | `combat/ai/ai.ts` + `combat.ts` | `tier-table` ✅ · `mob-report` ❌ |
| Monster DoT | `combat/status/dotPrototype.ts` | `tier-table` ✅ · `mob-report` ✅ · `ehp-report` (as incoming DoT DPS) |
| AoE | `combat/damage/aoeDamage.ts` | `tier-table` flags it; nobody prices target count |
| Aggro / concurrency | `combat/ai/ai.ts`; **measured** by `bench/balance/concurrency.ts` | `tier-table` assumes `(N+1)/2`; farm bench measures the same quantity directly |
| Spawn / population | `server/src/systems/world/spawning/` | `tier-table` via `modifierSpawnFactor`; farm bench for real |
| Node modifiers | `shared/src/world/nodeModifiers.ts` — `M = {T1 0.05, T2 0.10, T3 0.15, T4 0.20}`; 5 families; `heavy`/`dominion` attack factor ×2M; `fortified` plating ×2M; DoT scales on **net damage** `attackMult/cooldownMult` | `tier-table` ✅ · everything else ❌ |
| Elite | **a boolean flag only** — no systemic stat scalar; every elite is hand-authored | n/a |

---

## 5. Current progression / model summary

*Authored intent is marked **[A]**. Relationships inferred from data are marked **[I]**.*

### 5.1 Tiers and biome order **[A]** — `docs/tier-balance-current-state.md §2`, locked with the user 2026-08-23

| tier | order, easiest → hardest |
|---|---|
| T1 | plains → forest → swamp → mountain → cave |
| T2 | plains → forest → swamp → mountain → cave → **jungle** → **desert** |
| T3 | swamp → mountain → cave → jungle → desert → **tundra** → **volcanic** |
| T4 | mountain → jungle → desert → tundra → volcanic → **wasteland** → **trench** |

Rule **[A]**: every tier keeps five and swaps two; departures always leave from the bottom,
arrivals always enter at the top; returning biomes keep relative order for the life of the game.

### 5.2 The two authored ladder axes **[A]**

| axis | T1 | T2 | T3 | T4 | meaning |
|---|---|---|---|---|---|
| Sustained danger | ×1.20 | ×1.20 | ×1.27 | ×1.32 | `d·(N+1)/2` — incoming DPS to out-sustain |
| Effective HP | ×1.41 | ×1.26 | ×1.26 | ×1.26 | chunkiness |
| Cost per kill | — | — | — | — | **never targeted**; exactly `sustained × eHP` |

Measured result, 0 overlaps at every tier (Trench T4 exempt):
`T1 1.00→2.08 · T2 1.00→3.03 · T3 1.00→4.16 · T4 1.00→4.02`.
**This is shape only.** The pass explicitly did not decide absolute pitch.

### 5.3 Cross-tier enemy curve **[A]** — `design_docs/player-power-curve.md §3`

Growth ≈ **1.9× / tier**. Bosses sit above `H_big`, single hits **0.3–0.6× player maxHp**,
**5–15× mob HP**. Doc status is self-declared *"TARGET / partially-verified"* — structure and
ratios durable, absolute scalars "right order of magnitude" only.

### 5.4 Equipment tiers and upgrades **[A]** — `shared/src/systems/itemUpgrades.ts`

* `MAX_UPGRADE = 5` (raised 3→5 in rework Step 6). Semantics: **+3 = evolution-ready,
  +4 = comfort, +5 = premium**.
* `MAX_ITEM_TIER = 4`; tier-0 starter shares tier 1's band.
* Upgrade level is gated by **Global Mastery**: each item tier owns a GM band, +1…+5 spread
  evenly, so a tier's +5 opens exactly when every biome available at that tier is mastered
  (T1 band 0–30: +1@6 … +5@30; T2 band 31–72: +1@38 … +5@72).
* Per-slot upgrade stat: weapon→attack, armor→damageReduction, mobility→speed.
  **Cores never upgrade.**
* T1 has a complete authored +0…+5 numerical cast in `design_docs/T1_ITEM_NUMERICAL_BASELINE.md`
  (per-weapon attack/APS/DPS tables). T2–T4 do not have an equivalent doc.
* **Gear budget [A]:** `player-power-curve.md §5` — `+3` ≈ **×1.8 on armour/charm stats,
  ×2.2 on weapon attack** vs the base craft. ⚠ Written when +3 was the cap; **there is no
  authored statement of what +5 should be worth**, nor of the `next-tier +0` vs
  `prior-tier +5` relationship. See §9-D3.

### 5.5 Class structure **[A]**

6 roots × 3 frames = 18 frames, plus range node (close/mid/far) and 3 T3 choices.

| root | name | archetype | affinity signature (`statEffects`) | root mechanic |
|---|---|---|---|---|
| `cadence-root` | Striker | cadence | atk+8% hp+18% plate+15% as+6% ms+4% DR+2% | recovery pulse 20%/6s for 4s; damage cap 25% maxHp, excess ×0.5 |
| `cooldown-root` | Squire | cooldown | — | — |
| `reload-root` | Slinger | reload | — | 0.65 damage / ×0.5 cadence layer |
| `energy-root` | Spirit | energy | atk+15% hp+3% as+12% ms+12% range+130 | `defense.barrier-pct 0.30` |
| `dot-root` | Apprentice | dot | atk+10% hp+12% plate+8% as+2% ms+3% range+60 | `dot-resistance 0.18`, `hit-to-dot-pct 0.10` |
| `summoner-root` | Conduit | summoner | — | 4 persistent summons; weapon sets their damage/cadence |

Frames: Splinter/Consort/Effigy · Flurry/Skirmisher/Breaker · Warrior/Knight/Bulwark ·
Venom-vessel/Ember-mage/Rime-Bound · Scout/Marksman/Artillerist · Spark/Wraith/Phantasm.
**Class affinities are percentages applied once after gear** (rework 2026-08-21); no class
grants flat stats any more.

### 5.6 Stances **[A]** — 11, `shared/src/stances.ts`

Structure frozen, **numbers explicitly seeds**. Percentages only; no stance touches maxHp;
`damageTakenPct` is a stance-local multiplier read at hit time. Observed range:
attack ±0.50, attackSpeed ±0.30, plating ±0.40, damageTaken ±0.25, moveSpeed +0.35,
evasion +0.15. Recipe-gated.

### 5.7 Abilities **[A]** — 18, two slots (`technique`, `guard`), `MAX_ABILITY_SLOTS = 2`

Wave 1 shipped (multi-slot engine + cast lifecycle + T2 trio). T3/T4 rosters not started.
Design axioms **[A]** (`feedback_ability_design_axioms`): no defence scaling with offence;
no range/class exclusivity; Technique = consume-on-hit, Guard = duration shape; Biome Mastery gating.

### 5.8 Monsters **[A/I]**

134 authored monsters; 26 boss scripts; 47 carry `chargedAttack`; 14 normal-mob `dotEffect`s;
7 `openingStrike`; 2 each `consecutiveHits` / `cadenceVolley`. **Elite is a flag, not a
scalar** — every elite is hand-authored, so there is no "elite progression" to audit **[I]**.
Monster `evasion` is a per-hit dodge fraction, authored ≤0.25 **[A]**.

### 5.9 Node modifiers **[A]** — magnitudes marked *PLACEHOLDER — user tunes here*

`M = 0.05 / 0.10 / 0.15 / 0.20` by tier. Five all-upside families
(alacrity, heavy, swarming, dominion, fortified). `heavy`/`dominion` get attack ×(1+2M);
`fortified` plating ×(1+2M); `dominion` also HP ×(1+M), speed ×(1+M/2). Deliberately
"barely noticeable at T1, plan-around at T4" **[A]**.

### 5.10 Seals **[A]** — the progression gate

T1→2 needs **2** seals, T2→3 **3**, T3→4 **4**, T4→5 **5**, plateauing at five. A seal is a
first-clear of a *distinct* biome boss at the current tier. **This is why §3.7's 0/30 boss
result is a hard content gate, not a difficulty complaint.**

---

## 6. Representative build matrix

Purpose: a tractable test set, not a metagame solution. 12 rows. Range node and frame chosen
to represent the archetype cleanly, not to optimise it.

| # | Archetype | Class / frame / range | Natural gear | Mechanics that materially move the result | Analytical coverage |
|---|---|---|---|---|---|
| B1 | **Fast-hit baseline** | `cadence-root` / Flurry (`cadence-light`) / close | fast low-attack weapon; balanced armour | empowered threshold (relic-modified), attack-speed sum, damage cap 25%, recovery pulse | `dps` ✅ · `ehp` ✅ · cadence relic profile ❌ |
| B2 | **Slow/heavy-hit** | `cadence-root` / Breaker (`cadence-heavy`) / close | high-attack slow weapon; heavy armour | **plating piercing** (hit size ≫ plating), `enemySoftCap` at T4, empowered spike | `dps` ✅ incl. soft-cap · `ehp` ✅ |
| B3 | **Cooldown burst** | `cooldown-root` / Knight (`cooldown-balanced`) / close | mid weapon; heavy armour | cooldown spike timing, execution flag | `dps` ✅ · ⚠ **`cooldown-heavy` T3 has no server logic** (`UNIMPLEMENTED_T3_IDS`) — exclude that frame |
| B4 | **Defensive / bulky** | `cooldown-root` / Bulwark (`cooldown-heavy`) / close | max-plating armour + DR charm | plating floor vs hit size, DR clamp 0.9, `core.dr-layer-pct` | `dps` ✅ · `ehp` ⚠ **misses hardening/stationary/sustained ramps — §3.2** |
| B5 | **DoT** | `dot-root` / Ember mage (`dot-balanced`) / mid | DoT-converting weapon | conversion %, max stacks, tick rate, diminishing returns; **evade blocks debuffs** | `dps` ✅ (best-modelled archetype) |
| B6 | **DoT-tanky** | `dot-root` / Rime-Bound (`dot-heavy`) / mid | plating armour | `dot-resistance 0.18` + `hit-to-dot-pct 0.10` interaction with incoming DoT | `ehp` ✅ (both keys read) |
| B7 | **Reload / ranged sustained** | `reload-root` / Marksman (`reload-balanced`) / far | ranged weapon | **0.65 damage / ×0.5 cadence**, `platingMult 0.5` bypass, magazine + reload dead time | `dps` ✅ and correctly documented |
| B8 | **Reload / slow sniper** | `reload-root` / Artillerist (`reload-heavy`) / far, snipe path | high-attack ranged | hard-set `snipe-cadence-ms 2000`, attackSpeed→damage conversion, full-HP multiplier | `dps` ✅ |
| B9 | **Energy** | `energy-root` / Wraith (`energy-balanced`) / mid | glass weapon; light armour | `resolveEnergyMax`, upkeep on-hit bonus, **`barrier-pct 0.30` is its entire defence** | `dps` ✅ · `ehp` ⚠ barrier as one-time buffer only |
| B10 | **Summoner** | `summoner-root` / Consort (`summoner-balanced`) / mid | weapon sets minion damage/cadence | formation `directDamageWeight` / `onHitMagnitudeWeight`, `summoner.minion-damage-mult`, rebuild HP cost | `dps` ✅ (full formations) — but **dominates tables; run `--exclude-conduit` too** |
| B11 | **Sustain-oriented** | `cadence-root` / Skirmisher / close | recovery charm + recovery armour | `maxHp × recovery/100 × Σfractions`, pulse duty cycle, **on-kill recovery unmodelled** | `ehp` ✅ except on-kill |
| B12 | **Generalist** | `dot-root` / Apprentice root only / mid | tier-native balanced set | the "no extreme" chassis — the control row | ✅ |

**Matrix guidance.** Cross these 12 against: tier {1,2,3,4} × gear {+0, +3, +5} × the
tier-appropriate biome ladder. Do **not** cross against every weapon — use `dps-report`'s
exhaustive sweep for weapon ranking and reserve the bench for these 12.

**Two hazards.**
(a) Equal tooltip DPS ≠ equal value: B2/B8 buy plating-piercing and burst; B1/B7 buy
consistency. `player-power-curve.md §6.3` records that fast weapons win vs trash and slow
weapons win vs walls, and that this is **intended**.
(b) No single mob profile threatens both B4 and B9 — `§6.2` states this explicitly. Do not
try to tune one mob to challenge both.

---

## 7. Measurement gaps

| # | Question that cannot be answered reliably | Class | Worth doing now? |
|---|---|---|---|
| G1 | "How dangerous is a charged-attack monster to a real player?" | **small repair** (§3.4 + §3.3) | **YES — do first.** 35% of the roster; two functions. |
| G2 | "Which T3/T4 armour is actually better?" | **small repair** (§3.2) | **YES.** Item numbers are in scope; the tool is currently misleading. |
| G3 | "Is the analytical player the same player as the bench player?" | **decision + small extension** (§3.5) | **YES — cheapest is the banner.** Full loadout parity is a bigger job; see §10. |
| G4 | "How much do stances/cores/abilities move a build?" | **use the bench** | Partially answered already — bench equips them. Use B1–B12 through `bossExam`/farm rather than extending the reports. |
| G5 | "Is the game correctly pitched in absolute terms?" | live/manual playtest + bench | **Do not build an instrument.** §3.7 shows the bench already answers it loudly (0/150). An "absolute-pitch instrument" would encode a designer opinion as a metric — that opinion is §9-D1, not a tool. |
| G6 | "Does the whole T0→cap route hold together?" | substantial new infrastructure | **DEFER.** The reward multiplier already lets a human reach late content by hand. Route bots are the parked W5d item; not needed to remove outliers. |
| G7 | "What if I try number X?" (reversible tuning overlay) | substantial new infrastructure | **DEFER.** The seam exists (`tools/balance-data.ts`) but edit-and-regenerate takes ~30 s per tier table. An overlay is a platform, not a balance pass. |
| G8 | "Boss phase-by-phase contribution" | small extension to `bossExam` | **Optional.** `bossExam` already reports cost-bars/burst/HP-lost per boss. Per-phase attribution would help but is not blocking. |
| G9 | "Are cores/relics/mobility balanced against each other?" | small extension (feed them to `dps`/`ehp`) | **Optional, after G3.** The bench's `resolveGearLoadout` already picks them; a report sweep would be new work. |
| G10 | "How many monsters are actually on the player?" | **already solved** | `bench/balance/concurrency.ts` measures the exact `(N+1)/2` term `tier-table` consumes. Use it; don't rebuild it. |
| G11 | "Do abilities matter numerically?" | live/manual + bench | **Not worth instrumenting.** 18 abilities, 2 slots, T3/T4 rosters unwritten. Judge in playtest. |
| G12 | "Ward / barrier-recharge value in farm rhythm" | small extension to `ehp-report` | **Probably not worth it** — only 2 items author `overheal-ward-pct`, 0 author the barrier companions. Revisit if authoring grows. |

**Net recommendation:** three repairs (G1, G2, G3-as-banner). Everything else either already
has an instrument or should wait for playtest.

---

## 8. Validation fixtures

Deterministic runtime-vs-tool parity cases. Add as `server/test/instrumentParity.test.ts`
using the existing plain-tsx `assert` convention. **These are correctness fixtures, not
balance targets** — none of them asserts that a number is *good*.

| # | What it tests | Runtime result to compare | Validates | Unacceptable discrepancy |
|---|---|---|---|---|
| **F1** | Bare direct hit. Player attack 100, target plating 20, DR 0.25, `platingMult 1` | `runPlayerAttack` `ctx.damage` on a hand-built world vs `estimatePlayerHitDamage` | `combatEstimates` ↔ `combat.ts` kernel (§3.6) | **any** difference — both are integer formulas |
| **F2** | Plating cliff. Same target probed with a **light** hit (attack 22) and a **heavy** hit (attack 200) | runtime damage for both | `tier-table` eHP probe curve; the `max(1,…)` floor | >1 HP, or wrong side of the 1-damage floor |
| **F3** | Charged spike ordering. Monster attack 100, `chargedAttack.multiplier 3`, player plating 20, DR 0 | `runMonsterAttack` damage on the charged beat | **§3.3 order bug** in `mob-report` / `ehp-report` | >2% (currently ~17%) |
| **F4** | Reload layer. Reload build, non-snipe non-laser, known weapon | `recalculatePlayerStats` → `attack`, `attackCooldown`; assert `floor(pre×0.65)` and `round(cd×0.5)` | `dps-report` reload documentation at `:2324` | any |
| **F5** | Cadence empowered cycle. Threshold 5, mult 2 over 10 hits | total damage from the pipeline vs `(4+2)/5` time-average | `dps-report` cadence mechFactor | >3% (cycle-boundary rounding allowed) |
| **F6** | DoT tick. One monster `dotEffect` at capped stacks for 10 s | **`hasHealth.hp` delta**, not `damageTaken` (DoT bypasses the pipeline) | `mob-report` / `tier-table` DoT DPS; also guards the bypass trap | >5% |
| **F7** | Recovery. maxHp 500, recovery 20, one source at 0.5 for 4 s | HP restored per `runRecovery` vs `maxHp×(recovery/100)×0.5` | `ehp-report::recoveryPerSec` | >2% |
| **F8** | Barrier + ward order. Ward 30 + barrier 100, single 200 hit | ward drains first, then barrier, then HP | `ehp-report` pool model; listener order in `defense/index.ts` | any ordering inversion |
| **F9** | Damage cap. maxHp 400, `max-hit-pct 0.25`, `max-hit-mult 0.5`, incoming 300 | `100 + (300−100)×0.5 = 200` | `ehp-report::applyDamageCap` | any |
| **F10** | Stationary DR. Tundra armour equipped, target stationary past ramptime | effective DR from the runtime listener | **§3.2 repair** — fails today by construction | any (this fixture is the acceptance test for the repair) |
| **F11** | Stance parity. Same build with `activeStance = null` vs `perfection-stance` | `recalculatePlayerStats` attack/plating/cooldown delta | **§3.5** — proves the reports' player ≠ the bench's player | none; this is a *documentation* fixture — assert the delta is non-zero and print it |
| **F12** | Node modifier. `dominion` at T4 on a known monster | `modifierStatScalars` + runtime spawned stats | `tier-table` modifier application | any |

F1–F3 and F7–F9 are the minimum set. F10/F11 exist to make §3.2 and §3.5 impossible to
forget.

---

## 9. Human decisions still required

Only questions the repository genuinely cannot answer.

* **D1 — Absolute difficulty anchor.** Which existing encounter is "correctly pitched"?
  The vacuum ladder sets *shape* only, and the bench currently says everything at T1 is
  unclearable. Without a named anchor there is no scale to hang the ladder on. Suggested
  form of answer: *"a tier-appropriate player in tier-native +3 gear should clear
  [named boss] with N% HP remaining in M seconds."*

* **D2 — Healthy encounter durations.** `bench:tui` currently assumes dungeon boss 60–180 s
  and overlord 1080–1200 s. Are those still the intended windows post-boss-rework? They
  drive the `attrition` axis of every difficulty score. Also: target trash TTK.
  (`player-power-curve.md §6.3` notes trash TTK should sit ~1–2 s for fast builds and 3–10 s
  for slow ones — confirm or replace.)

* **D3 — What is `+5` worth, and what does `next-tier +0` succeed?**
  `player-power-curve.md §5` gives a `+3` budget (×1.8 armour/charm, ×2.2 weapon) written
  when +3 was the cap. There is **no authored statement** of the +5 budget, nor of the
  intended `tier N +5` → `tier N+1 +0` relationship. This determines whether
  `mob-report`'s +3 reference player is still the right one and whether it needs a
  fully-geared profile added.

* **D4 — Canonical analytical loadout.** Should the reports equip a stance/core/relic set
  matching the bench (§3.5), or stay bare with a banner? This is a modelling-philosophy
  call: bare keeps the reports a clean *item* comparator; equipped makes them comparable to
  runtime but bakes in a loadout opinion.

* **D5 — Intentional extreme matchups.** `player-power-curve.md §6.2` asserts no single mob
  can threaten both a glass and a tank build, and §6.3 asserts fast/slow weapon asymmetry is
  intended. Confirm both are still policy, and state the acceptable spread — otherwise the
  audit's outlier signals cannot be triaged.

* **D6 — Stance power budget.** Stance numbers are explicitly "seeds" and reach ±40-50%.
  How much is a stance *supposed* to be worth relative to a gear slot? Nothing in the repo
  says.

* **D7 — Node modifier magnitude curve.** `MODIFIER_MAGNITUDE_BY_TIER` is labelled
  *PLACEHOLDER — user tunes here*. The 0.05→0.20 ramp and the ×2M attack/plating factors are
  a designer choice, not a derivable one.

* **D8 — Conduit's role in the tables.** Conduit dominates `dps-report` badly enough that a
  `--exclude-conduit` variant exists. Is Conduit intended to be the top-output class, or is
  the formation model over-crediting it? Affects whether the main table or the excluded one
  is the reference.

**Explicitly NOT asked** (answerable from the repo, already answered above): biome ordering
(§5.1), tier ladder multipliers (§5.2), upgrade gating (§5.4), seal requirements (§5.10),
which frames lack server logic (§6, B3), the reload constants (§4.1).

---

## 10. Recommended infrastructure work before balancing

### Required before trusting the tools — ✅ ALL DONE 2026-08-23 (see §3.8)

1. **Fix the spike ordering** (§3.3). Move the empowered/charged multiplier outside
   `estimateMonsterHitDamage` at 3 call sites. Land fixture **F3**.
2. **Teach `mob-report` charged attacks + `consecutiveHits`** (§3.4). Port `tier-table`'s
   existing cycle model — do not invent a second one. Same PR as (1).
3. **Reconcile `ehp-report`'s claims with its code** (§3.2). Implement the three DR ramps
   as duty-cycle averages (parameterise stationary-DR by an assumed stationary fraction —
   do **not** assume 100%), or delete the claim. Land fixture **F10**.
4. **State the loadout gap** (§3.5). At minimum a banner in all four reports and the Lab:
   *"models weapon/armour/charm/mobility + class affinities only; no core, relic, rune,
   rite, stance or ability."* Land fixture **F11**.
5. **Land parity fixtures F1, F2, F7, F8, F9** — the kernel and defensive layers. Cheap,
   and they stop §3.6-class drift permanently.

*Total: roughly one focused session. Everything above is repair, not new capability.*

### Useful but optional

6. ~~Promote `bossExam` to `pnpm boss:exam`~~ — **done 2026-08-23.**
7. Add a fully-geared (+5) reference profile to `mob-report` alongside the +3 entry profile
   — blocked on **D3**.
8. Fixtures F4, F5, F6, F12.
9. Per-phase attribution in `bossExam` (G8).

### Explicitly defer

10. **Absolute-pitch instrument** — encodes a designer opinion; that opinion is **D1**.
11. **T0→cap route runner** — the reward multiplier covers content reach by hand.
12. **Reversible tuning overlay** — regenerate is ~30 s; an overlay is a platform.
13. **Core/relic/mobility report sweeps** — revisit after D4.
14. **Retire `--mode boss`** from all balance documentation and scripts (it measures guards).
    Cheap, but do it as cleanup, not as a blocker.

---

## 11. Proposed trustworthy measurement stack

| Balance question | Use | Do **not** use | Notes |
|---|---|---|---|
| Weapon-vs-weapon offensive ranking | `pnpm dps:report` (+`:no-conduit`) | bench (too slow, samples too few weapons) | Valid **within** the modelled subset. Relative only. |
| Class-vs-class offensive ranking | `dps:report` **and** B1–B12 through the farm bench | `dpsEstimate.ts` | Reports miss stances/cores; bench has them. Agreement = confidence; disagreement = investigate. |
| Defensive equipment comparison | `pnpm ehp:report` **after repair §3.2** | `ehp:report` today for T3/T4 | Until repaired, T1/T2 rows only. |
| Monster relative ladder (within a tier) | `pnpm tier:table --tier N` | `mob:report` | Sole authority. Never compare eHP across tiers — read raw HP for that. |
| Monster absolute difficulty | `bench:balance --mode farm` (deaths, concurrency, TTK) + playtest | `tier:table`, any threat index | §5.4/§3.7. The vacuum structurally cannot answer this. |
| Monster threat vs a player (sustained) | `mob:report` **after repair** | `mob:report` spike columns | Spike stays untrustworthy until §3.3+§3.4 both land. |
| Boss tuning | `bench/bossExam.ts` | `bench:balance --mode boss` (guards only) | Read `cost bars` and `burst %pool`; treat extrapolated `ttk` as optimistic. |
| Node modifier magnitudes | `tier:table` (applies them) + farm bench on a modified node | `dps`/`ehp` reports (blind to modifiers) | — |
| Concurrency / population | `bench/balance/concurrency.ts` via farm mode | any analytical assumption | It measures the exact `(N+1)/2` term the ladder consumes. |
| Progression sanity (tier→tier) | `tier:table` shape + `bossExam` per tier + seal requirements (§5.10) | route runner (does not exist) | The seal gate makes boss clearability the progression bottleneck. |
| Stance / core / relic / ability value | bench only (B1–B12) | all four analytical reports | They are invisible to the analytical layer. |
| Live-feel confirmation | manual play with the dev reward multiplier | any instrument | Content reach only; not a measurement. |
| Performance | `pnpm bench:server` | — | **NON-BALANCE.** Never let a tick-budget number enter a balance argument. |

**Standing rule for the roadmap:** where simulation and analysis disagree, simulation wins.
Where a historical report predates 2026-08-23, re-generate it — §3.2/§3.3/§3.4 invalidate
specific columns of every `mob-report` and `ehp-report` on disk, and §5.5 of the inventory
invalidates every bench matrix collected before 2026-08-11.
