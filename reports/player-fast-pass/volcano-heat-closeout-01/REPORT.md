# Volcano Heat management correctness closeout 01

Date: 2026-09-24. Branch: `codex/volcano-heat-closeout-01`.

## Decision

Recommend adopting the unchanged optional **Always → Wait It Out / Manage Heat, 1 RP, 25/10, ordinary Volcano only**, with the observation correction in `cf62d2c6fa6b7115ba5e9276200286ea1ae8dc58`. This is a recommendation, not adoption, merge, or deployment approval.

The three flags are **normal late-tick threat arrivals plus mixed-phase reporting**, not demonstrated cooling-induced combat refusal. Both long H2 no-kill intervals are **shared hazard/approach stalls in this fixture**, not a latched Heat acquisition veto. They remain tracked below; full HP does not clear a farming stall.

No gameplay behavior, balance number, equipment, Rune policy, enemy, hazard, cooling formula, combat-exit delay, or boss rule changed. No fresh benchmark life was run (including diagnostic lives). Focused constructed tests and a zero-tick geometry readback are separate evidence. No Luna manifest is needed for this reporting-only correction.

## Evidence and identity

Started from candidate `25289e490d4bfb53dd440ba436a67f596e5b91c4`, with historical baseline `268148d269b87311eaa1ae4b053baeb6571c747a`. The successor worktree is `D:/mmo-idle/volcano-heat-closeout-01/source`. No unrelated source was imported.

Original packet: `D:/mmo-idle/volcano-heat-management-01/packet`. Original run: `D:/mmo-idle/volcano-heat-management-01/run-01`. Read the completed report at `D:/vh1pub/reports/player-fast-pass/volcano-heat-management-01/run-01/REPORT.md`, its candidate diff, manifest, resolved builds, results summary and raw inventory. The separately named uploaded `REPORT(2).md` was not present in Downloads; the retained published report contains the exact three flags and two gaps specified in the brief. Case paths were resolved against the retained inventory. Historical artifacts are unchanged.

`evidence-inventory.json` identifies 30 consulted inputs by path, byte length and SHA-256. The 23 selected case streams/summaries were checked against the original raw inventory with zero mismatches; the five run metadata inputs and published report/diff have current hashes. This is a targeted readback, not a claim to have revalidated all 374 original files. `identity-and-source.json` records selected manifest/build readbacks and shared source blob equality. H2 costs remain Striker 41/45 RP and Slinger 44/45 RP; the full historical mastery, upgrades, stances, abilities and Rune policies remain in the referenced resolved builds. No package was reconstructed for a new life.

Correcting the original report's scope: there were **26 observations total: 18 farming lives across H0/H1/H2, four non-Volcano and four boss boundaries; only six H2 farming lives**. All survived their caps or killed their boss. Four H2 lives added kills during minutes 30–40; two did not. Neither aggregate throughput nor survival establishes indefinite sustain or universal improvement.

## A. Three flagged samples

The original `ttkSurvey.ts` called `world.tick(100, now)`, then `heatObservation`. Its `state` and wait flags came from **start-of-tick Rune derivation**, but `phase`, threat counts, Heat and target came from **after the tick**. The transition recorder then stamped `atMs = elapsed + 100`; samples, guard records, stance transitions and combat events used `elapsed`. These are not identical timestamps. The old `blockedBy=existing-threats` also described a pending request even when the engagement had just ended.

All times below are elapsed milliseconds. Event tick time is the clock actually passed into `World.tick`, not the old transition interval-end label.

| Original flag label | Actual event tick | Heat / newly observed threats | Next decision/intent tick | First outgoing HP damage | Result |
| ---: | ---: | --- | ---: | ---: | --- |
| 1,608,700 | 1,608,600 | 17 / 1 | 1,608,700 | 1,608,800 | Ember Skink `monster-489`, 284 damage; killed at 1,609,200 |
| 1,616,000 | 1,615,900 | 15 / 1 | 1,616,000 | 1,616,000 | Ember Skink `monster-478`, 235 then 653 damage; killed at 1,616,300 |
| 2,290,300 | 2,290,200 | 24 / 5 | 2,290,300 | 2,290,400 | Pack `monster-675..679`; 22 to Skink 677 and 240 to Direhound 675 at first damage tick |

`flagged-windows.json` retains adjacent transition records and ±1.5-second event/guard/stance windows plus nearest one-second spatial samples. Aggro `sinceMs` confirms arrival at the actual event tick in each row. Prior spatial samples have no threats; next samples show movement and living engaged targets. The next decision changes `waiting → requested`, releases the hold, and publishes attack intent. Frenzy and Expose Weakness arm at 1,608,700; Sweep arms at 2,290,300. The retained windows contain no monster-cast start/end records, no incoming owner HP damage, no hard control, and owner HP remains 506. We do not invent unrecorded per-100-ms positions or exact casting internals from the one-second spatial samples.

The tested producer/consumer order in `World.tick` is:

1. Combat-state/ward updates; `updateRuneDerivedConfig` calls `updateHeatManagement`, latches the genuine owner/summon engagement set and derives holds.
2. Class mechanics (including summon and channel acquisition), boss systems, party/travel, then owner auto-target and ability selection/cast advancement.
3. Movement, ambient Heat and ground features, pack/ecology logic, monster AI, then combat resolution and defenses.
4. Combat transitions and displayed intent; benchmark records after `World.tick` returns.

Monster acquisition/pack wake-up occurs after owner action selection in these transitions. The following tick sees that aggro and yields to the engagement. `heatAllowsTarget` permits current engagement targets; auto-target safety checks (flee, telegraph, persistent hazard) precede maintenance; summon/channel acquisition retains the same veto/engagement rules. Range, cadence, casts and normal defense still govern the actual strike. The first/third rows' damage a tick after attack intent does not imply a skipped cooling response. No grace period was added and no late threat was written retroactively into an earlier decision.

## B. Two long H2 no-kill periods

| Exact H2 case | Last kill and last outgoing damage | No-kill remainder | Cause and attribution |
| --- | ---: | ---: | --- |
| `heat-striker-balanced-b-H2-s101033` | 193,900 | 2,206,100 | Shared hazard-rim/approach stall, not a Heat hold |
| `heat-slinger-light-a-H2-s101033` | 1,027,000 | 1,373,000 | Shared hazard-rim/approach stall, not a Heat hold |

Striker finishes `monster-36`, briefly completes native HP recovery, then selects `monster-11` at 195 s. At 197–198 s it reaches the north rim of a lava lake; at 199 s it switches to `monster-90` and its requested path remains near `(1478.7, 2320)` through the 300 s excerpt. Later it repeatedly selects `monster-11` and alternate living targets around that rim. The 30–40 minute samples select `monster-11` 526/600 times, plus 74 alternatives. Last outgoing damage never advances past 193.9 s.

Slinger finishes `monster-314`, selects `monster-11` at 1,028 s, reaches `(1314.3, 2270.5)` at 1,031 s, then alternates approach/skirt goals and other living targets. The 30–40 minute samples select `monster-11` 323/600 times and alternatives 277/600 times. Last outgoing damage never advances past 1,027 s.

In both cases the relevant recurring enemy is an idle, full-HP Ember Skink (720 HP), at `(1314, 2547.253866)`, inside the authored player-avoidance circle centered `(1316, 3033)`, radius 690. Its pull range is 230; the characters stay outside the lava, repeatedly requesting safe pull/skirt or alternative paths. The canonical safe radial pull goal is approximately `(1312.86, 2271.01)`. Enemy acquisition succeeds; approach/contact fails. This is not a long damage-dealing fight, lack of targets, or a resource recovery wait. There is no enemy HP progress after the last kills, as confirmed by damage records and the repeated `lastOutgoingDamageMs`, not merely by kill count.

Both H2 gaps have **zero `requested` and zero `waiting` samples** after last damage: every retained one-second sample is `resumed`, and subsequent 100-ms state-transition records do not re-enter a pending Heat request. Striker's post-kill Heat peaks at 22 and Slinger's at 24 before cooling to zero. Later 20/30/40-minute evidence has zero Heat, no owner threats, no wait hold, and no recovery hold. Consequently `heatAllowsTarget` is unconditionally permissive throughout these long stalls. Low waiting occupancy alone was not used to reach this conclusion.

Existing H0/H1 also cease outgoing damage: Striker H0 500.9 s, H1 388.7 s; Slinger H0 216.2 s, H1 814.0 s. H0/H1 frequently show the same lava-rim target/approach pattern; Slinger H0 stalls by a different lava circle `(3613,3422)`, radius 699. All these H arms were executed on the candidate source, **not** the historical baseline. However, the pre-candidate `autoTarget` hazard approach, `blockedApproach`, movement/path code and lava geometry are unchanged from the historical baseline; H0/H1 never enable managed acquisition, and both H2 gaps remain resumed. This establishes independence from the managed Heat veto, without claiming a fresh baseline reproduction.

`hazard-geometry.json` is a zero-tick projection of retained positions onto canonical hazard shapes. `stall-evidence.json` includes onset, 5/10/20/30/40-minute excerpts, post-damage states and late selection counts. The selector's blank `blockedApproach` string is not proof of a reachable fight: that scratch string is cleared by subsequent successful selection, while hazard steering and path advancement can still fail to establish contact.

### Tracked shared issue: HEAT-CLOSEOUT-HAZARD-APPROACH-01

The existing 15-second approach deferral and 30-second retry do not guarantee eventual contact; the retained traces include both safe-rim circling and alternate paths which do not advance. A full route/collision diagnosis of every alternate-path oscillation remains outside this small Heat closeout. No forced target death, aggro clearing, hazard suppression, rescue build or navigation redesign was applied.

Designer question: **When Avoid Hazards cannot establish contact with an idle enemy inside lava, should the character abandon that local encounter and seek a different region, or may it enter the hazard under an explicit policy?** The affected packages are exactly the historical Striker/Slinger 101033 builds above. This shared navigation/strategy question remains open, but does not warrant further Heat tuning or block the reporting correction.

## Corrections and focused verification

Implementation commit: `cf62d2c6fa6b7115ba5e9276200286ea1ae8dc58`.

- `server/src/systems/combat/ai/heatManagement.ts`: passive per-player decision/action receipts with tick, server time, named phase, engagement IDs, decision Heat/holds and selected action/target. Gameplay request logic is unchanged.
- `runeConfig.ts`: records the completed derivation. `autoTarget.ts`: records the actual selected branch, including higher-priority safety, maintenance and target/approach selection. An `attack` receipt means a selected target, not a guaranteed strike; range/cooldown/casting remain authoritative.
- `server/bench/balance/heatObservation.ts`: exposes separate decision, action-selection and end-of-tick observations; labels retained legacy fields; removes the misleading requested-state blocker label in favor of a pending reason; limits summon observations to living same-node minions.
- `server/scripts/ttkSurvey.ts`: transition `atMs` now shares the event/sample clock; `tickEndMs` explicitly preserves interval-end timing. Historical receipts remain unchanged.
- `server/test/heatManagement.test.ts`: adds receipt/timestamp assertions, summon-only readback, immutable earlier decisions, normal resumption/cancellation and a natural two-World-tick arrival/response test. Existing eligibility, boss/Tundra, generic wait, manual, owner/summon/channel and cooling-delay checks remain.

Commands executed from the successor root:

| Command | Actual result |
| --- | --- |
| `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/heatManagement.test.ts` | PASS, including natural late monster-AI arrival and next-decision response |
| `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/runeWaitItOut.test.ts` | PASS |
| `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/hazardPullApproach.test.ts` | PASS; existing checks do not establish clearance of the historical stall |
| `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/runeDynamicHazardAvoidance.test.ts` | PASS |
| `pnpm typecheck` | PASS, all packages and benchmark typecheck |
| `git diff --check` and staged diff check | PASS |

Regression sensitivity: temporarily substituting the exact historical observation adapter in this successor worktree makes the new receipt assertion fail (`undefined` versus required `false` at the summon decision hold assertion). Restoring the correction makes the complete focused Heat test pass. The original worktrees were not edited. This is an observation regression check, not evidence of a historical gameplay failure.

Full-suite tests, builds, browser/live-player checks and new long combat runs were not performed. They are not needed to regenerate known outcomes for a reporting-only closeout. Fresh benchmark count is **0**; no LUNA_RUN.md or fresh manifest is included. No parallel item/ability files, worktrees, queues, results or source were edited.

## Publication

Report path in Git: `reports/player-fast-pass/volcano-heat-closeout-01/REPORT.md`. This directory contains only compact derived evidence, source/identity readbacks and small read-only extraction helpers. Raw JSONL stays external under the original run root with hashes. The scoped code commit above and this report are published on `codex/volcano-heat-closeout-01`; the final response records the publication commit and remote verification. There is no merge to develop or deployment.
