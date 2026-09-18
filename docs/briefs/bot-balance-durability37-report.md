# Durability37 — mob integration regression

Date: 2026-09-18

Status: complete; executed once, sequentially, at the frozen packet revision. Two independent
blocks, 38 cells / 74 observations. Synthetic evidence only (`synthetic=true`,
`economyEligible=false`). No production/source edit, commit, push, or follow-up run beyond the
one adoption commit this packet's own preflight required (see below). Counts below are read
mechanically from `index.json`, `manifest.json`, `verification.json`, and the derived audits, not
hand-typed.

**Pre-execution note.** The packet's frozen-identity fields were left as `FILL AT LAUNCH`
placeholders and the working tree carried the consolidated adoption uncommitted. The run script
hard-asserts a clean tree and an exact revision match, and the packet itself forbids
adaptive/production changes but does not forbid the one-time commit of already-qualified,
already-reviewed adoption content that the packet's own qualification section describes as
already performed. That commit (`bdee5dca`) was made before filling the frozen-identity table
below; nothing else was changed, and no retries, adaptive edits, or additional commits followed.

## Executive result

Batch completed and verified: `batch-ended.json` records `artifactVerified: true` for both blocks
and `navigationGate.status: "pass"` for Block J, wall time 358,598 ms (5m 58.6s) against a 3h
ceiling. No `stopped.json` at block or batch level, no watchdog timeout, no budget-exhaustion
partial. Both blocks report `verified: true` in their own `verification.json`.

| Block | Cells | Runs | Complete windows | Deaths (`player-died`) |
|---|---:|---:|---:|---:|
| `jungle-ladder` | 18 | 54 | 49 | 5 |
| `mob-integration` | 20 | 20 | 19 | 1 |

- **Block J answers its own question: yes, primary-lineage duration now RISES tier to tier.**
  Equal-weight body clean-TTK across roots is **10,950 ms (T2, Jungle Ape) → 14,837.5 ms (T3,
  Silverback) → 23,850 ms (T4, Apex Silverback)** — both steps rise, reversing Durability36's
  measured fall (10,950 → 9,950 → 6,550 ms) on the pre-adoption ladder. This tracks the packet's
  own projection (≈11,000 → 15,000 → 23,000 ms) within 1–4%.
- **Block I: no gross, unambiguous problem surfaced in any of the ten families.** Every family's
  declared sensitive/comparator species spawned and produced clean kills; the two nested shields
  and the un-rescaled soft cap behave as the packet described (see below); the one T2 Mountain
  death-exception family produced zero deaths this single-seed sample, which is inside the
  "halved, not resolved" band already on record and is not a new finding.

No mob closure or playtest readiness is claimed. The next decision belongs to the balance command
center.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability37-operator-packet.md |
| Frozen revision | `bdee5dcac2d3c3b89bd791cbbeea2589fb5ae0cd` |
| Frozen tree | `03708b0493bcfb7b4a1fa1d5ff2debb60f8aa705` |
| Definitions hash | `17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f` |
| Hitbox hash | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial / Blocks | durability37 / `jungle-ladder`, `mob-integration` |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/durability37` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/durability37-preflight` |
| Batch wall time | 358,598 ms (5m 58.6s), Block J 3m 56.2s + Block I 1m 53.7s |
| Order | J → I, sequential, per the packet |

Qualification re-verified at the frozen revision before launch: `pnpm typecheck` (all packages +
bench) clean; `mobAdoptionIntegration.test.ts`, `durability37Matrix.test.ts`,
`durability36Matrix.test.ts`, and `t1MountainPressureAdoption.test.ts` all `ok`. Preflight
(`durability37-preflight.mjs`) passed qualify+pilot for both blocks, including the load-bearing
check that every observation's `hpTreatment` is empty (no overlay reactivated) and that the
adopted Jungle ladder's runtime `maxHp` is at or above the adopted values (1200/3200/10000) with
no trace of the superseded Durability34 figures (2900/3400).

`hpTreatment` was empty in all 74 observations (confirmed by preflight and by the run's own
`verifySurvey` pass); this packet installed nothing.

---

## Block J — `jungle-ladder` (54 observations, 6 roots × 3 tiers × 3 seeds)

All figures below are from `audits/jungle-ladder-species-timing.json`
(`cleanTtkMsByRoot` / `cleanTtkMsEqualWeightRoots`, schema 2; every species has
`rootsWithCleanSample: 6`, so no root ever failed to produce a clean sample for any species).

### Body clean-TTK by root, primary lineage

| Tier | Species | striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| T2 | Jungle Ape | 13,500 | 11,400 | 10,500 | 8,800 | 11,600 | 8,400 | **10,950** |
| T3 | Silverback | 10,950 | 16,400 | 14,900 | 14,775 | 37,200 | 12,400 | **14,837.5** |
| T4 | Apex Silverback | 14,900 | 44,900 | 12,600 | 24,500 | 51,100 | 23,200 | **23,850** |

**Primary-lineage equal-weight centre rises 10,950 → 14,837.5 → 23,850 ms across both steps.**
This is the packet's core question, answered affirmatively on this dataset. Root spread is large
and not pooled away: at T3 and T4, **Conduit is the single slowest root against the durable body
by a wide margin** (37,200 ms at T3, 51,100 ms at T4 — both far above the next-slowest root), and
**Squire is the second-slowest at both T3 and T4** (16,400 / 44,900 ms). At T2 the ordering is
different — **Striker is slowest** (13,500 ms) with Squire and Conduit close behind (11,400 /
11,600 ms) — so the "Conduit/Squire slow tail" pattern the packet expected to remain visible is
present at T3/T4 but not at T2 in this dataset; reported as observed, not smoothed into one
cross-tier ranking.

### Fast bodies, reported separately

| Tier | Species | striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| T2 | Jungle Snake | 5,500 | 3,800 | 4,500 | 2,950 | 4,900 | 3,500 | 4,150 |
| T2 | Vine Chameleon | 5,000 | 3,800 | 4,500 | 3,500 | 4,100 | 2,800 | 3,950 |
| T3 | Jungle Stalker | 4,200 | 6,400 | 6,000 | 4,900 | 12,500 | 4,700 | 5,450 |
| T3 | Canopy Chameleon | 3,900 | 4,600 | 6,000 | 4,800 | 11,675 | 4,000 | 4,700 |
| T4 | Thornback Chameleon | 3,650 | 11,150 | 2,700 | 4,400 | 6,175 | 5,200 | 4,800 |
| T4 | Hunting Panther | 3,500 | 15,375 | 3,800 | 6,000 | 11,800 | 5,000 | 5,500 |

Fast-body centres move roughly 4,000–4,150 (T2) → 4,700–5,450 (T3) → 4,800–5,500 (T4) — closer to
a rise-then-plateau than the packet's own "4 → 5 → 6 s" projection, which undershoots at T4. Per
the packet's own framing, **this is a measurement, not a failure to be corrected mid-run**: no
fast T4 body is required to exceed every durable T3 body, and none of them do here (both T4 fast
centres remain below the T3 Silverback centre of 14,837.5 ms).

### Emerald Constrictor — T4 control-predator role, reported on its own

| striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---:|---:|---:|---:|---:|---:|---:|
| 17,550 | 51,650 | 15,400 | 28,350 | 52,400 | 27,400 | **27,875** |

Longer than the primary Apex Silverback lineage (23,850 ms) and far longer than either fast T4
body. More HP exposes the existing Apex ramp / Constrict cadence for longer, as the packet
anticipated; no claim is made about whether this specific gap is intended.

### Survival — deaths appear only at T3, none at T2 or T4

`balanceExposure` in `jungle-ladder-navigation-gate.json`: 49 usable, 0 censored, **5 died**, 0
unknown. All five deaths are T3:

| Cell | Seed | Died at (ms) | Kills before death |
|---|---:|---:|---:|
| t3-jungle-03-apprentice | 83003 | 192,800 | 13 |
| t3-jungle-03-apprentice | 85009 | 285,700 | 19 |
| t3-jungle-03-slinger | 83003 | 44,900 | 3 |
| t3-jungle-03-conduit | 81013 | 80,500 | 3 |
| t3-jungle-03-conduit | 85009 | 36,400 | 0 |

Durability36's zero deaths do **not** carry over here — the packet explicitly warned against
assuming they would. T2 and T4 both show 0/18 and 0/18 deaths respectively despite T4 carrying the
highest HP in the ladder; the exposure that produced deaths in this dataset is concentrated at T3,
specifically on Apprentice, Slinger, and Conduit (both Conduit seeds that died did so early, with
correspondingly thin — and noisy — clean-TTK samples for Conduit's Silverback figure above).
Squire recorded zero deaths at every tier despite being the second-slowest root at T3/T4; its slow
tail shows up in duration, not survival, in this dataset.

### Owner vs. summon attribution — Conduit stays attributable

Conduit's `attackBeats` is 0 in all 9 of its Block J observations (confirmed from `index.json`);
every kill it records is attributed to `minionAttackBeats` (95–2,229 per run, lower in the two runs
cut short by death). This is the same `CannotAttack`-by-design shape reported in prior packets:
Conduit's Block J figures above are minion/summon durability and throughput, not player-melee
evidence, on every tier tested here.

### Unresolved and HP-regain, kept distinct from kills

Summed from `index.json`: 39 unresolved (engaged but never killed within the window) and 12
HP-regain observations across the 54 runs, matching the block's own `verification.json`
(49 complete windows against 54 runs — 5 of the difference are the deaths above, not censoring).

### Navigation watch

`jungle-ladder-navigation-gate.json`: `status: "pass"`, 0 reasons, 0 affected rows.
`scenarioExposure`: 20 exercised / 34 not-exercised, 66 escape attempts, **66/66 successes, 0
failures**. No navigation regression accompanies the duration change.

---

## Block I — bounded checks of the other integrated packages (20 observations, 10 families × 2 roots × 1 seed)

One seed per family; per the packet, this is a spot check, not fresh certification. Reading from
`mob-integration/analysis.md` and `index.json`. Only one death occurred in the entire block.

| # | Family | Sensitive / Comparator | Outcome | Declared species observed | Note |
|---|---|---|---|---|---|
| 1 | T2 Forest | apprentice / striker | apprentice **died**, striker window-ended | `ancient-wolf` displays as "Dire Wolf" (15.70s/19.50s clean), `ironwood-golem` displays as "Ironclaw Badger" (9.00s/10.50s clean) — confirmed type-id-to-name pairs from `index.json` targets, not the type-id text | Only death in Block I |
| 2 | T3 Volcano | squire / striker | both window-ended | Magma Tortoise (Molten Guard family) 12.10s/8.80s clean | Molten Guard's held-280 budget not independently re-derived here; already pinned by `mobAdoptionIntegration.test.ts` |
| 3 | T4 Volcano | conduit / striker | both window-ended | Obsidian Tortoise 4488 maxHp (matches authored, no modifier scaling), Magma Salamander 5808 maxHp (matches authored exactly — `swarming` does not scale HP) | Confirms point 2 of the packet's baseline facts: these two bodies run at their pre-adoption absolute budgets |
| 4 | T4 Graveyard | slinger / spirit | both window-ended, 900s window | Gravewright 12.80s/8.50s clean; escort throughput very high (181–259 kills/window) | Longest window in Block I after Trench |
| 5 | T2 Desert | spirit / striker | both window-ended | Stone Basilisk 11.20s/17.50s, Sand Scorpion 11.20s/17.00s | Tiers resolved correctly as T2 per the corrected manifest |
| 6 | T4 Desert | squire / slinger | both window-ended | Dune Basilisk maxHp 10,807 at runtime (= 9,006 × 1.2 dominion, the retained selection, not 4503), Dune Tyrant, Sand Viper all present | Several one-hit (0 ms) Sunshield Scarab kills are genuine single-tick kills on a 683 HP add (`damageEvents: 1`), not a data artifact |
| 7 | T2 Mountain | striker / apprentice | both window-ended, **0 deaths** | Granite Titan 31.00s/18.00s, Stone Eagle, Boulder Thrower | **Open-exception family**: this single-seed sample shows no Striker death, which is inside the already-dispositioned "halved, not resolved" band (Durability29: control 6/6 vs candidate 3/6); not reopened, not treated as new evidence either way |
| 8 | T4 Mountain | apprentice / conduit | both window-ended | Granite Mammoth maxHp 16,560 at runtime (= 13,800 × 1.2), Cragback Rhino maxHp 7,920 (= 6,600 × 1.2, soft cap `capPct` un-rescaled per packet's point 3) | Ward-held-287.5 budget not independently re-derived here; already pinned by qualification |
| 9 | T4 Trench | squire / spirit | both window-ended, 600s window | Elder Leviathan 129.20s/59.70s clean, Abyssal Serpent, Hadal Stalker | Confirmed longest bodies in Block I by a wide margin, as the packet described |
| 10 | T4 Tundra | slinger / conduit | both window-ended | Glacial Dire-Bear maxHp 5,861 at runtime (= 4,884 × 1.2), Rime-Tusk Mastodon, Hoarfrost Yeti, Permafrost Behemoth | Barrier-268.62/self-shatter-170.94 budgets not independently re-derived here; already pinned by qualification |

All ten families' declared sensitive/comparator species produced at least one clean kill; no
family failed to exercise the package it exists to observe. Runtime `maxHp` for every
dominion-modifier species checked above scales at exactly ×1.2 over the authored value, and every
swarming-modifier species checked (Obsidian Tortoise, Magma Salamander) shows no HP scaling at
all — both consistent with the packet's own framing and with `NODE_BIOMES`.

### The one death in Block I

`dur37-integration-forest-t2-apprentice`, seed 87011: `player-died`, `minHpFraction: 0.000`, 28
kills / 2 censored / 1 HP-regain before death. This is the T2 Forest family's sensitive root. The
packet does not carry a named open exception for T2 Forest (unlike T2 Mountain), so this is a
plain observation from a single seed, not compared against prior extraction evidence — reported as
a gross-check pass/fail input, and it did not trip the "gross, unambiguous problem" bar on its own
(the comparator root, striker, cleared the same family without incident).

---

## Uncertainty and what this packet does not establish

- Three seeds per Block J cell and one seed per Block I family are directional samples, not
  certification, for every claim above.
- Block J's primary-lineage rise is measured on tier-legal builds experiencing progression (gear,
  skill-path depth) alongside the adopted HP change, not an isolated mob-stat contrast — the same
  caveat the packet itself carries forward from Durability36.
- Conduit's T3 Silverback figure (37,200 ms) and T4 figures are derived from very few clean
  samples in some cases (2 of 3 Conduit T3 seeds ended in early death), so that specific number is
  noisier than the table format suggests; it is reported as measured, not smoothed or excluded.
- The two nested-shield species (Molten Guard, Obsidian Shell) and the un-rescaled Cragback Rhino
  soft cap were confirmed present via runtime `maxHp` and via the already-green
  `mobAdoptionIntegration.test.ts`, not independently re-derived from this batch's raw shield/ward
  telemetry — that telemetry was out of scope for this packet's own audits.
- The T2 Mountain open exception is reported against its existing disposition, not reopened or
  resolved by this single non-death sample, per the packet's own instruction.
- No reward edits, no boss observations, no class tuning, and no adoption decision are made here
  for either block — that belongs to the command center.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/durability37`

Key artifacts:

- `batch-manifest.json`, `batch-ended.json`, `operator-ledger.jsonl`
- `jungle-ladder/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `jungle-ladder-navigation-gate.json`, and 54 per-observation
  `jungle-ladder/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}` directories
- `mob-integration/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, and 20 per-observation
  `mob-integration/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}` directories
- `audits/jungle-ladder-species-timing.json` (per-species seed → root → equal-weight centre,
  `perObservation` kills/engaged-species detail), `audits/mob-integration-species-timing.json`
- `audits/jungle-ladder-casts.json`, `audits/mob-integration-casts.json`
- `.log` files per block: `*-night5-audit.mjs.log`, `*-ttk-survey-report.mjs.log`,
  `*-charged-cast-audit.mjs.log`, `jungle-ladder-navigation-gate.log`
- Preflight artifacts (separate root): `durability37-preflight/{jungle-ladder,mob-integration}-{qualify,pilot}/`

No `stopped.json` was produced at block or batch level.
