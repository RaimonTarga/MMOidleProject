# Tier 2 Overnight Experiment - Night 2

**Date:** 2026-09-08
**Status:** complete; all four cohorts terminal
**Scope:** exploratory Tier-2 progression/build experiment; non-canonical and not an economy experiment

## A. Executive summary

Night 2 completed 31 isolated runs: six corrected controls, twelve frame variants, six weapon challengers, and seven Jungle/system/repeatability arms. The result was **21 completed and 10 non-completed**. All ten non-completions occurred in Jungle; no container, server, lease, event-log, or runner failure was observed.

The two Night 1 bot fixes held:

- The Jungle encounter kit was equipped before the Jungle `core-survivalist` gate. The corrected control logs show the intended Jungle kit active before that farm.
- The stale-slot acquisition guard did not evict an unrelated live weapon. Wave A Slinger completed with `jungle-stinger-rapier`, and no post-evolution weaponless state appeared. The later weapon challenger intentionally ended with `swamp-mirebrand`.

The most useful new findings are provisional:

1. Jungle remains the common progression bottleneck, but it is not universally impassable: 21 runs reached GM72, including all Apprentice, Slinger, Spirit, and most Squire/Conduit frame arms.
2. The Apprentice Quake Hammer challenger completed faster and with fewer deaths than its single control run. The Spirit Ruinous-only challenger also completed faster with zero deaths. Both are one-run hypotheses, not balance conclusions.
3. Frame results are mixed. Heavy Squire, Light/Heavy Spirit, and both Slinger frames completed; both Striker frame arms and Heavy Conduit stalled.
4. The valid Contagion result is Apprentice only: one cast produced one spread event affecting one target with two copied effects. The Slinger Contagion arm had zero Contagion casts because its route did not actually equip a DoT weapon.
5. No Core A/B conclusion was obtained. Every bossless run ended on GM72 before the post-gate `core-force` craft/equip steps, and the Jungle system routes did not equip `core-survivalist` for farming. Final cores were therefore `core-tempered` throughout.

Nothing in this report is a numeric balance recommendation.

## B. Experimental constants and provenance

All runs used the fixed biome spine **Plains -> Forest -> Swamp -> Mountain -> Cave -> Jungle -> Desert**, isolated workers, a maximum of four workers, `smoke-isolated`, `full-gauntlet`, `catalyst-primed` entry state, and 25x rewards. The configured hard cap was 4,500,000 ms (75 minutes); the observed no-progress termination in these artifacts was 12 minutes. Automatic retries were disabled.

The entry state was synthetic Tier-2 entry. Every run is tainted `SYNTHETIC_TIER_ENTRY` and `NON_CANONICAL_REWARD_MULTIPLIER`; results are progression/combat evidence only, not economy evidence.

| Wave | Experiment id | Runs | Result | Frozen SHA | Image |
|---|---|---:|---|---|---|
| A - controls | `20260907t220115z-t2-night2-wave-a-controls` | 6 | 5 complete / 1 stalled | `b086bc2831f1e548a0d81c99df125fa415954843` | `sha256:16d198d0e36994bcbef5e44cbf72d308b7b5dcdb14434f808a0cb95f19065941` |
| B - frames | `20260907t231941z-t2-night2-wave-b-frames` | 12 | 9 complete / 3 stalled | `a649d2250514b3c98fae8444557504b4b691b20b` | `sha256:6904161930fbda1b3a40b72ca696c72e17bb7b9ff022ce5fe9e05b76c0dfc666` |
| C - weapons | `20260907t233033z-t2-night2-wave-c-weapons` | 6 | 2 complete / 4 non-complete | `a649d2250514b3c98fae8444557504b4b691b20b` | `sha256:6904161930fbda1b3a40b72ca696c72e17bb7b9ff022ce5fe9e05b76c0dfc666` |
| D - systems/repeat | `20260907t233046z-t2-night2-wave-d-systems-repeat` | 7 | 5 complete / 2 stalled | `a649d2250514b3c98fae8444557504b4b691b20b` | `sha256:6904161930fbda1b3a40b72ca696c72e17bb7b9ff022ce5fe9e05b76c0dfc666` |

The cohort manifests and per-run summaries remain under:

`%LOCALAPPDATA%\mmo-idle\experiments\<experiment-id>\`

## C. Corrected baseline table

The frame shown is the live Tier-2 entry frame. Final builds list the worn weapon, armor, recovery, mobility, and Core.

| Class / frame | Result | Runtime | Deaths | Bottleneck | Final build |
|---|---|---:|---:|---|---|
| Striker / `cadence-balanced` | COMPLETE, GM72 | 32.07 min | 0 | None | `ruinous-axe`; `cave-vest-t2`; `plains-charm-t2`; `plains-boots-t2`; `core-tempered` |
| Squire / `cooldown-heavy` | STALLED, GM64, Jungle 4/6 | 37.22 min | 1 | No progress for 12m at `core-survivalist` | `quake-hammer`; `mountain-vest-t2`; `swamp-charm-t2`; `plains-boots-t2`; `core-tempered` |
| Apprentice / `dot-balanced` | COMPLETE, GM72 | 33.39 min | 5 | None | `swamp-mirebrand`; `swamp-vest-t2`; `plains-charm-t2`; `plains-boots-t2`; `core-tempered` |
| Slinger / `reload-heavy` | COMPLETE, GM72 | 32.35 min | 6 | None | `jungle-stinger-rapier`; `forest-vest-t2`; `plains-charm-t2`; `plains-boots-t2`; `core-tempered` |
| Spirit / `energy-heavy` | COMPLETE, GM72 | 23.19 min | 2 | None | `ruinous-axe`; `cave-vest-t2`; `mountain-charm-t2`; `plains-boots-t2`; `core-tempered` |
| Conduit / `summoner-balanced` | COMPLETE, GM72 | 44.37 min | 6 | None | `ruinous-axe`; `cave-vest-t2`; `plains-charm-t2`; `plains-boots-t2`; `core-tempered` |

The Squire stall is not an infrastructure failure. It is a single-run progression result and is contradicted by both Squire frame arms completing, so it needs replication before being called a stable build wall.

## D. Frame matrix

Cell format is `result / runtime / deaths / final GM`; stalled cells include final Jungle level.

| Class | Light | Balanced control | Heavy |
|---|---|---|---|
| Striker | STALLED / 36.78m / 2d / GM64 J4 | COMPLETE / 32.07m / 0d / GM72 | STALLED / 33.72m / 1d / GM61 J1 |
| Squire | COMPLETE / 30.32m / 4d / GM72 | STALLED / 37.22m / 1d / GM64 J4 | COMPLETE / 26.76m / 1d / GM72 |
| Apprentice | COMPLETE / 32.76m / 6d / GM72 | COMPLETE / 33.39m / 5d / GM72 | COMPLETE / 34.43m / 6d / GM72 |
| Slinger | COMPLETE / 36.15m / 10d / GM72 | COMPLETE / 32.35m / 6d / GM72 | COMPLETE / 29.73m / 2d / GM72 |
| Spirit | COMPLETE / 21.01m / 1d / GM72 | COMPLETE / 23.19m / 2d / GM72 | COMPLETE / 22.16m / 1d / GM72 |
| Conduit | COMPLETE / 37.18m / 5d / GM72 | COMPLETE / 44.37m / 6d / GM72 | STALLED / 44.82m / 5d / GM64 J4 |

This is evidence of candidate frame/seed interactions, not a ranking. In particular, the two Striker stalls and Heavy Conduit stall all stopped at the same Jungle core gate.

## E. Weapon A/B results

These are one challenger per class. A control or challenger that stalled at the shared Jungle gate does not establish a weapon DPS result.

| Class | Corrected control | Weapon challenger | Provisional read |
|---|---|---|---|
| Striker | 32.07m, 0d, GM72; early `gale-needle`, final `ruinous-axe` | 43.17m, 18d, GM62 J2; Ruinous-only | Removing the early fast weapon looks harmful in this replicate; confounded by the Jungle wall and high variance. |
| Squire | 37.22m, 1d, GM64 J4; final `quake-hammer` | 38.19m, 3d, GM62 J2; final `ruinous-axe` | Neither arm completed; no weapon conclusion. |
| Apprentice | 33.39m, 5d, GM72; final `swamp-mirebrand` | 30.61m, 2d, GM72; adopted `quake-hammer` | Quake is a promising challenger; replicate from an identical checkpoint. |
| Slinger | 32.35m, 6d, GM72; final `jungle-stinger-rapier` | 39.49m, 10d, GM65 J5; final `swamp-mirebrand` | Stinger route completed while the DoT challenger stalled; useful hypothesis, not proof. |
| Spirit | 23.19m, 2d, GM72; early `gale-needle`, final `ruinous-axe` | 21.60m, 0d, GM72; Ruinous-only | Fast completion repeated; early Gale value remains unresolved. |
| Conduit | 44.37m, 6d, GM72; final `ruinous-axe` | 58.69m, 11d, GM63 J3; no final weapon | The route timed out before its Jungle fast-weapon acquisition, so this is not a valid fast/on-hit comparison. |

## F. Jungle, Technique, stance, and Core findings

### Contagion

Current source identifies the ability as `contagion` / **Contagion**, a Tier-2 Technique learned from `ability-recipe-contagion` at Swamp level 9. It copies spreadable player DoTs from the primary target to nearby enemies; at rank 1 the effect is capped at two targets. Because T2 has one Technique slot, it competes directly with Sweep.

| Route | Intended treatment | Live evidence | Interpretation |
|---|---|---|---|
| `apprentice-t2-jungle-contagion` | Contagion plus Apprentice DoT weapon | COMPLETE, 32.30m, 2d, GM72; 1 Contagion cast, 1 spread event, 1 target, 2 copied effects; final `swamp-mirebrand` | Valid but very small sample. It completed faster and with fewer deaths than the control's 33.39m / 5d. |
| `slinger-t2-jungle-contagion-venom` | Contagion plus retained DoT weapon | COMPLETE, 37.30m, 12d, GM72; **0 Contagion casts/spreads**, final `gale-needle` | Invalid intended interaction. The route evolved `swamp-mirebrand` but never equipped it; this is a route-authoring composition error, not recurrence of the stale-slot bot bug. |

The Slinger route should not be used as evidence for or against Contagion.

### Survival/control policies

- Striker safe-policy: stalled at GM63/Jungle 3 while trying to unlock `bramble-guard`; the intended defensive treatment never became active.
- Squire safe-policy: stalled at GM63/Jungle 3 at the same Bramble Guard gate; no survival conclusion.
- Conduit safe-policy: completed in 37.72m with 2 deaths using the defensive stance/Bramble Guard route policy. This is encouraging but unpaired and not enough to attribute the improvement to any one component.
- The stance changes are therefore exploratory route evidence only; they are not isolated stance measurements.

### Cores

No intended Core comparison completed. The route's normal farming policy kept `core-tempered` in Jungle, and the bossless completion condition fired as soon as Desert reached GM72 while the route was still inside the `farm desert until core-force unlocks` step. The subsequent `craft core-force` and `equip core-force` steps never ran. All completed run summaries therefore end with `core-tempered`; no run provides a Survivalist-versus-Tempered or Force-versus-Tempered result.

### Repeatability

`spirit-t2-repeat-control` completed in 21.23m with 0 deaths, versus the corrected control's 23.19m and 2 deaths. This supports repeatable Spirit completion, but not a precise runtime or death-rate estimate from two seeds.

## G. Bugs and validity findings

### Fixed Night 1 bot defects verified

1. `bot/src/routes/t2RouteBuilder.ts` now emits the leg's ability/stance kit before the core-gate farm. The focused semantic test passed, and live Jungle logs show the corrected kit before the Jungle farm.
2. `bot/src/routes/t2Acquisition.ts` carries `expectedDefinitionId` on stale-slot unequip steps. The focused tests passed, and Wave A Slinger retained a valid weapon through the evolution path and completed the full gauntlet.

Verification completed after the runs:

- five focused bot tests: PASS;
- `pnpm experiment:test`: PASS;
- `pnpm typecheck`: PASS;
- all 31 worker summaries and four cohort summaries terminal;
- no `INFRA_ERROR`, silent hang, or automatic retry.

### New route/experiment issues

1. The Slinger Contagion arm's `learnContagion` patch did not merge an `adopt: swamp-mirebrand` weapon policy. Its name and hypothesis claimed a Venom/DoT interaction that the live build did not have. Classify as `ROUTE_ERROR`.
2. The bossless terminal condition prevents Desert Core testing by ending at GM72 before Force acquisition. Classify as `ROUTE_ERROR` / experiment-design gap.
3. The Striker/Squire safe arms stall while acquiring Bramble Guard, so they do not test their intended survival policy. Classify as `STALLED` before treatment activation.

These findings do not indicate a game-balance defect by themselves.

## H. Recommended next experiments

1. Correct the Slinger Contagion route so the DoT weapon is actually adopted, and add a route assertion that the intended weapon is equipped before the Jungle Contagion block.
2. Add checkpointed Jungle runs that explicitly compare `core-tempered` versus `core-survivalist`; do not rely on the bossless GM72 terminal route.
3. Add a checkpointed Desert comparison that forces `core-force` acquisition/equip before declaring completion.
4. Re-run the six corrected controls, or at minimum Striker, Squire, and Conduit, to determine whether the shared Jungle gate is seed-sensitive or a stable build/encounter wall.
5. Repeat the Apprentice-Quake, Spirit-Ruinous-only, and Slinger weapon arms from identical pre-Jungle states before drawing weapon conclusions.
6. Revisit Bramble Guard and defensive stance only after the acquisition gate is separated from the Jungle combat treatment.
7. Do not change monster, class, weapon, Technique, stance, Core, progression, or reward balance until these route and checkpoint confounds are removed.

## Per-run evidence ledger

The seven slash-separated times are summed minutes in **Plains / Forest / Swamp / Mountain / Cave / Jungle / Desert** from each run's `summary.json`. `-` means the run never entered that biome. Full final armor, recovery, mobility, abilities, runes, unlock milestones, and resource metrics remain in the referenced per-run summaries.

### Wave A

| Route | Result | Runtime | GM / Jungle | Deaths | Time by biome (min) | Final weapon / Core |
|---|---|---:|---:|---:|---|---|
| `striker-t2-progression` | COMPLETE | 32.07 | 72 / 6 | 0 | 4.24 / 3.05 / 4.32 / 3.07 / 2.90 / 11.00 / 3.48 | `ruinous-axe` / `core-tempered` |
| `squire-t2-progression` | STALLED | 37.22 | 64 / 4 | 1 | 5.71 / 2.52 / 9.65 / 2.63 / 1.87 / 14.50 / - | `quake-hammer` / `core-tempered` |
| `apprentice-t2-progression` | COMPLETE | 33.39 | 72 / 6 | 5 | 4.74 / 2.83 / 5.72 / 4.02 / 3.00 / 4.83 / 5.97 | `swamp-mirebrand` / `core-tempered` |
| `slinger-t2-progression` | COMPLETE | 32.35 | 72 / 6 | 6 | 5.59 / 3.22 / 6.75 / 3.63 / 3.20 / 5.25 / 3.20 | `jungle-stinger-rapier` / `core-tempered` |
| `spirit-t2-progression` | COMPLETE | 23.19 | 72 / 6 | 2 | 4.58 / 2.72 / 5.15 / 2.85 / 2.05 / 2.65 / 2.67 | `ruinous-axe` / `core-tempered` |
| `conduit-t2-progression` | COMPLETE | 44.37 | 72 / 6 | 6 | 7.16 / 3.98 / 11.97 / 3.88 / 4.80 / 3.97 / 6.12 | `ruinous-axe` / `core-tempered` |

### Wave B

| Route | Result | Runtime | GM / Jungle | Deaths | Time by biome (min) | Final weapon / Core |
|---|---|---:|---:|---:|---|---|
| `striker-t2-frame-light` | STALLED | 36.78 | 64 / 4 | 2 | 5.19 / 2.97 / 6.72 / 3.65 / 2.45 / 15.33 / - | `ruinous-axe` / `core-tempered` |
| `striker-t2-frame-heavy` | STALLED | 33.72 | 61 / 1 | 1 | 5.09 / 3.32 / 6.72 / 3.13 / 2.75 / 12.42 / - | `ruinous-axe` / `core-tempered` |
| `squire-t2-frame-light` | COMPLETE | 30.32 | 72 / 6 | 4 | 5.31 / 3.08 / 6.77 / 3.87 / 2.77 / 3.40 / 4.02 | `quake-hammer` / `core-tempered` |
| `squire-t2-frame-heavy` | COMPLETE | 26.76 | 72 / 6 | 1 | 5.09 / 2.68 / 5.53 / 2.92 / 1.90 / 3.22 / 4.07 | `quake-hammer` / `core-tempered` |
| `apprentice-t2-frame-light` | COMPLETE | 32.76 | 72 / 6 | 6 | 5.16 / 2.70 / 6.45 / 3.27 / 2.83 / 5.08 / 5.77 | `swamp-mirebrand` / `core-tempered` |
| `apprentice-t2-frame-heavy` | COMPLETE | 34.43 | 72 / 6 | 6 | 4.53 / 3.37 / 6.63 / 4.38 / 2.37 / 5.27 / 6.22 | `swamp-mirebrand` / `core-tempered` |
| `slinger-t2-frame-light` | COMPLETE | 36.15 | 72 / 6 | 10 | 6.16 / 3.93 / 7.33 / 3.48 / 3.85 / 5.40 / 2.82 | `jungle-stinger-rapier` / `core-tempered` |
| `slinger-t2-frame-heavy` | COMPLETE | 29.73 | 72 / 6 | 2 | 5.53 / 2.95 / 6.33 / 3.38 / 2.97 / 5.15 / 2.93 | `jungle-stinger-rapier` / `core-tempered` |
| `spirit-t2-frame-light` | COMPLETE | 21.01 | 72 / 6 | 1 | 3.46 / 2.12 / 5.40 / 2.67 / 2.08 / 2.37 / 2.72 | `ruinous-axe` / `core-tempered` |
| `spirit-t2-frame-heavy` | COMPLETE | 22.16 | 72 / 6 | 1 | 4.78 / 2.00 / 4.40 / 2.58 / 1.62 / 2.68 / 2.83 | `ruinous-axe` / `core-tempered` |
| `conduit-t2-frame-light` | COMPLETE | 37.18 | 72 / 6 | 5 | 6.79 / 4.90 / 7.07 / 3.37 / 3.57 / 3.67 / 5.65 | `ruinous-axe` / `core-tempered` |
| `conduit-t2-frame-heavy` | STALLED | 44.82 | 64 / 4 | 5 | 6.83 / 4.98 / 7.57 / 4.52 / 5.10 / 14.52 / - | `ruinous-axe` / `core-tempered` |

### Wave C

| Route | Result | Runtime | GM / Jungle | Deaths | Time by biome (min) | Final weapon / Core |
|---|---|---:|---:|---:|---|---|
| `striker-t2-weapon-ruinous-only` | STALLED | 43.17 | 62 / 2 | 18 | 6.96 / 2.87 / 7.72 / 4.07 / 4.32 / 12.73 / - | `ruinous-axe` / `core-tempered` |
| `squire-t2-weapon-ruinous-axe` | STALLED | 38.19 | 62 / 2 | 3 | 6.76 / 3.17 / 6.90 / 4.67 / 2.80 / 12.88 / - | `ruinous-axe` / `core-tempered` |
| `apprentice-t2-weapon-quake-hammer` | COMPLETE | 30.61 | 72 / 6 | 2 | 5.33 / 2.90 / 5.55 / 3.42 / 2.53 / 4.47 / 4.90 | `quake-hammer` / `core-tempered` |
| `slinger-t2-weapon-venom-knife` | STALLED | 39.49 | 65 / 5 | 10 | 4.94 / 3.37 / 4.85 / 2.83 / 3.83 / 16.18 / - | `swamp-mirebrand` / `core-tempered` |
| `spirit-t2-weapon-ruinous-only` | COMPLETE | 21.60 | 72 / 6 | 0 | 4.36 / 2.65 / 3.83 / 2.55 / 2.28 / 2.93 / 2.98 | `ruinous-axe` / `core-tempered` |
| `conduit-t2-weapon-fast-onhit` | TIMEOUT | 58.69 | 63 / 3 | 11 | 5.51 / 4.65 / 17.34 / 3.48 / 5.88 / 19.17 / - | `null` / `core-tempered` |

### Wave D

| Route | Result | Runtime | GM / Jungle | Deaths | Time by biome (min) | Final weapon / Core |
|---|---|---:|---:|---:|---|---|
| `apprentice-t2-jungle-contagion` | COMPLETE | 32.30 | 72 / 6 | 2 | 4.48 / 3.03 / 6.53 / 3.83 / 2.63 / 4.22 / 6.93 | `swamp-mirebrand` / `core-tempered` |
| `slinger-t2-jungle-contagion-venom` | COMPLETE | 37.30 | 72 / 6 | 12 | 5.51 / 3.28 / 5.78 / 3.40 / 4.55 / 5.33 / 6.47 | `gale-needle` / `core-tempered` |
| `striker-t2-jungle-safe-policy` | STALLED | 33.62 | 63 / 3 | 3 | 5.58 / 2.67 / 5.43 / 3.47 / 2.72 / 13.05 / - | `ruinous-axe` / `core-tempered` |
| `squire-t2-jungle-tempered-safe` | STALLED | 31.78 | 63 / 3 | 1 | 5.51 / 2.73 / 6.20 / 2.38 / 1.73 / 12.87 / - | `quake-hammer` / `core-tempered` |
| `conduit-t2-jungle-tempered-safe` | COMPLETE | 37.72 | 72 / 6 | 2 | 7.81 / 3.58 / 8.15 / 4.23 / 3.25 / 3.92 / 6.28 | `ruinous-axe` / `core-tempered` |
| `spirit-t2-desert-tempered-core` | COMPLETE | 21.54 | 72 / 6 | 1 | 4.48 / 2.05 / 5.43 / 2.23 / 1.98 / 2.58 / 2.45 | `ruinous-axe` / `core-tempered` |
| `spirit-t2-repeat-control` | COMPLETE | 21.23 | 72 / 6 | 0 | 4.21 / 2.35 / 4.57 / 2.48 / 1.67 / 2.97 / 2.98 | `ruinous-axe` / `core-tempered` |
