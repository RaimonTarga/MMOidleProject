# T2 Post-Fix Revalidation - 2026-09-10

## Result

The `node-t2-jungle-04` engagement collapse was an engine softlock, not a
spawn, geometry, monster, modifier, or target-selection defect. The generic
node-feature contact flag suppressed out-of-combat Recovery while the player
stood in a harmless Jungle `denseBush`. The `wait-for-regen` Rune then stopped
the player before target acquisition until full HP, producing a permanent
fixed point: no movement, no new target, no attackers, and no deaths.

The convergence on node-04 was routing-related. It is the only T2 Jungle node
bordering Swamp, and `autoTraverse` keeps a player on the current regular node
while the target biome still has unlock work. Swamp-to-Jungle routes therefore
parked all affected runs on node-04. The node itself has ordinary geometry,
population, composition, aggro, leash, and movement behavior.

The fix is in commit `0075d844bf1cd204e71e90633899f678ca091bbd` (`Fix Jungle
recovery softlock`). No class, item, Technique, Core, monster, node-balance, or
reward values were changed.

## 1. Configuration and validity

- Branch: `develop`; frozen source revision:
  `0075d844bf1cd204e71e90633899f678ca091bbd`.
- Experiment image: `sha256:47ee54ea1bfe81ded0137be057dea25d0133b79b3515ae44ee8d9a45783160c4`.
- J0 source: `20260908t200706z-t2-day-j0-prep-2026-09-08-rerun/runs`, snapshot
  SHA `8991de9c3f942e42fd59927a732267e73eedf90f946175fd74c16bb88baeffb8`.
- Real isolated bot harness, `full-gauntlet`, `catalyst-primed`, 25x rewards,
  900,000 ms watchdog, 768 MiB workers, global queue controller, maximum four
  simultaneous workers, and no automatic retries.
- The snapshot's canonical-at-capture flag required
  `requireTierEntrySnapshot=false`; every run still passed the J0 profile and
  spawn validation and the route's pre-combat assertions. The resulting data
  is synthetic/non-canonical combat and progression diagnostics, not 1x
  economy evidence.
- Primary matrix: 26 terminal runs (Striker 9, Squire 9, corrected Balanced
  Squire weapon A/B 8). Twenty-five completed; one Squire Balanced run was a
  valid gameplay stall. Optional Slinger follow-up: 8/8 completed.
- All 484 treatment assertions passed (14 per frame/weapon run, 15 per
  Slinger run); there were no `INVALID_TREATMENT` failures. The one Squire
  stall had valid treatment assertions and was classified by the gameplay
  no-progress guard, not by the harness.

Authoritative artifacts are under
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260909t-postfix-revalidation-primary`:

- Phase A: `20260909t165711z-t2-postfix-striker-frames-retry`
- Phase B: `20260909t165731z-t2-postfix-squire-frames-retry`
- Corrected Phase C: `20260909t180526z-t2-postfix-squire-balanced-weapons`
- Phase D: `20260909t174417z-t2-postfix-slinger-contagion`

The earlier `20260909t165731z-t2-postfix-squire-weapons-retry` batch is retained
as an extra diagnostic only. Its authored weapon routes use the default
`cooldown-heavy` frame, so it is excluded from the Balanced Squire A/B result.

## 2. Diagnosis and technical fix

The node audit found:

- 40 live monsters in node-04, matching normal T2 Jungle density. Node-03's
  37 was explained by its `dominion` spawn factor; node-05 also held 40.
- A six-thicket ring and ten small tree trunks, with no blocking wall,
  dead-end pocket, invalid spawn placement, or special dormant state.
- The `fortified` modifier only changes defensive combat values. It does not
  change spawn count, aggro range, movement, or leash behavior.
- Ordinary pull/leash/wander values and successful in-process target/path
  selection. Post-fix runs repeatedly switched targets while 39-40 monsters
  remained in node-04.

The live wedge was traced as:

1. The player took damage, stopped below full HP inside a harmless `denseBush`.
2. `RUNE_WAIT_FOR_REGEN_FLAG` stopped the auto-combat loop before target
   acquisition.
3. `runRecovery` received the generic `hasNodeFeatureEffect` marker as
   `oocSuppressed`, even though the thicket has no damage effect.
4. HP never recovered, so the player never left the stop condition.

The fix adds
[`isPlayerInHazardousNodeFeature`](../../server/src/systems/world/nodeFeatures.ts:381),
which only suppresses Recovery for an active feature with a player-targeted
damage effect. [`updateDefensiveSystems`](../../server/src/systems/defense/index.ts:98)
now uses that helper. The focused regression test
[`nodeFeatureRegenSuppression.test.ts`](../../server/test/nodeFeatureRegenSuppression.test.ts:94)
pins safe-thicket Recovery and continued suppression in a real hazardous
Swamp feature.

The standard bot artifact has no per-sample movement-state or
reachable/targetable-monster field. The diagnosis therefore combines the
geometry/runtime trace with the available authoritative signals: live monster
count, attacker count, target switches, kills, HP/recovery state, and the
post-fix pathing audit. Those signals do not support an unreachable-spawn or
target-acquisition failure.

## 3. Before versus after

| Check | Node-04 engagement result |
|---|---|
| Pre-fix focused campaign, 15 valid stalls | 89.6-96.0% unengaged, median 94.7%; full population; essentially no deaths; no progress |
| Post-fix direct node A/B, 3 reps | 40 live mobs; 46.2-47.5% zero attackers; 534-546 kills/hour; 0 deaths |
| Post-fix real J0 validation, Squire Balanced 3 reps | 318 node-04 samples; 39.6% weighted zero attackers; 3/3 complete; 1 death total |
| Post-fix real J0 validation, Striker Balanced 3 reps | 312 node-04 samples; 46.5% weighted zero attackers; 3/3 complete; 9 deaths total |
| Revalidation campaign | Raw node-04 samples held 37-40 monsters (normally 39-40); normal runs ranged 23.4-60.4% zero attackers, and the engaged Squire stall was 3.3%; no 90-96% collapse recurred |

The direct post-fix node comparison was ordinary: node-03 had 37 live mobs,
45.7-48.6% zero attackers, and 510-522 kills/hour; node-04 had 40,
46.2-47.5%, and 534-546; node-05 had 40, 51.4-55.6%, and 516-552.

## 4. Striker frame revalidation

Node-04 metrics are raw `concurrency-sample` events filtered to node-04.
Mastery/minute is the available XP-like progression telemetry. J0->J6 is the
time from run start to the Jungle level-6 event.

| Frame (n) | Completion | J0->J6 median (range, sec) | Node-04 samples | Target switches (per run) | Zero attackers (weighted; range) | Kills/min (median; range) | Mastery/min (median; range) | Deaths |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Light / Flurry | 3/3 | 605.1 (440.6-787.8) | 98-113; 310 total | 2-4 | 46.1%; 44.4-48.0% | 4.44; 4.28-4.70 | 6319; 5968-6545 | 12 |
| Balanced / Skirmisher | 3/3 | 636.1 (276.4-742.8) | 96-184; 398 total | 0-4 | 40.7%; 23.4-56.3% | 4.11; 2.58-4.68 | 5676; 3587-6658 | 7 |
| Heavy / Breaker | 3/3 | 286.9 (277.3-402.6) | 93-106; 297 total | 2-5 | 58.9%; 57.0-60.4% | 4.64; 4.53-5.18 | 6533; 6087-7209 | 1 |

Replicate J0->J6 seconds/deaths were Light `440.6/2, 605.1/4, 787.8/6`,
Balanced `742.8/5, 276.4/0, 636.1/2`, and Heavy `277.3/0, 402.6/1,
286.9/0`. Balanced Striker still looks slower and more death-prone than
Heavy under normal engagement, but this is a small post-fix follow-up signal,
not the former node wall.

## 5. Squire frame revalidation

| Frame (n) | Completion | J0->J6 median (range, sec) | Node-04 samples | Target switches (per run) | Zero attackers (weighted; range) | Kills/min (median; range) | Mastery/min (median; range) | Deaths |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Light / Warrior | 3/3 | 282.0 (279.0-349.8) | 84-97; 275 total | 2-6 | 46.9%; 42.9-50.0% | 5.02; 4.95-5.60 | 6895; 6872-7734 | 1 |
| Balanced / Knight | 2/3; 1 valid stall | 290.8 (289.1-292.5) for clears | 95-362; 553 total | 0-2 | 15.9%; 3.3-41.7% | 4.95 for clears; 0.31-5.02 | 6895 for clears; 422-6934 | 0 |
| Heavy / Bulwark | 3/3 | 255.5 (235.8-378.7) | 64-135; 276 total | 1-5 | 33.7%; 23.7-44.2% | 6.37; 3.63-6.91 | 8956; 4964-9821 | 0 |

The Balanced stall lasted 851.2 seconds, produced 4 Jungle kills, and reached
only 422 mastery/minute. It had 362 node-04 samples with 39-40 monsters;
only 12 samples had zero attackers, 340 had one, 9 had two, and 1 had three.
That is normal engagement with low progression throughput, not the old
softlock. It is therefore a genuine class/build progression signal to revisit
later, subject to canonical follow-up, rather than node-confounded evidence.

Individual J0->J6 seconds/deaths were Light `279.0/0, 282.0/0, 349.8/1`,
Balanced `289.1/0, 292.5/0, stall 851.2/0`, and Heavy `235.8/0, 378.7/0,
255.5/0`.

## 6. Clean Balanced Squire weapon A/B

This is the corrected Phase C batch
`20260909t180526z-t2-postfix-squire-balanced-weapons`; both arms use
`cooldown-balanced`, the same Core/equipment/abilities/stance, and the same J0
snapshot.

| Weapon (n) | Completion | J0->J6 median (range, sec) | Node-04 samples | Target switches (per run) | Zero attackers (weighted; range) | Kills/min (median; range) | Mastery/min (median; range) | Deaths |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Quake Hammer | 4/4 | 297.0 (281.9-299.1) | 90-100; 390 total | 0-4 | 45.9%; 42.2-50.0% | 4.67; 4.55-5.20 | 6569; 6469-7246 | 0 |
| Ruinous Axe | 4/4 | 319.8 (308.3-430.1) | 104-113; 436 total | 0-4 | 47.0%; 44.2-51.4% | 4.30; 4.21-4.51 | 6070; 5922-6263 | 1 |

Replicate J0->J6 seconds/deaths were Quake `296.6/0, 299.1/0, 297.4/0,
281.9/0` and Ruinous `430.1/1, 313.2/0, 308.3/0, 326.4/0`. On this small
post-fix diagnostic, Ruinous does not outperform Quake; Quake is faster and
has higher throughput with no deaths. This is not yet a 1x economy or final
balance verdict.

## 7. Slinger Contagion replication

The optional 8-run cohort used `swamp-mirebrand` on both arms. All 8/8 runs
passed the DoT-weapon assertion and completed.

| Technique (n) | J0->J6 median (range, sec) | Node-04 samples | Target switches (per run) | Zero attackers (weighted; range) | Kills/min (median; range) | Mastery/min (median; range) | Deaths |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sweep | 445.8 (438.4-537.2) | 132-137; 536 total | 6-9 | 36.4%; 34.8-38.0% | 3.41; 3.30-3.53 | 4872; 4778-4958 | 5 |
| Contagion | 473.7 (328.6-551.3) | 122-154; 562 total | 4-14 | 41.8%; 38.5-44.8% | 3.15; 2.92-3.73 | 4475; 4188-5262 | 4 |

Sweep replicate J0->J6 seconds/deaths were `449.3/1, 438.4/1, 537.2/2,
442.4/1`. Contagion was `460.6/1, 328.6/0, 551.3/2, 486.8/1`.
Contagion activated 5, 1, 3, and 2 times respectively (11 total). The raw
adapter telemetry recorded 8 spread events affecting 8 targets and 8 effects;
there was no separate copied-effects field. This replication does not support
a Contagion advantage: Sweep was faster and had higher median throughput,
while Contagion had one fewer death. The result remains a small, noncanonical
class-synergy signal rather than a balance conclusion.

## 8. Conduit replication

Phase E was not run. Capacity was used to correct the Balanced Squire weapon
route and complete the requested Slinger follow-up. The prior Conduit result
that Ruinous Axe substantially outperformed Quake Hammer remains a separate,
unaffected secondary finding and was not re-tested here.

## 9. Before-vs-after interpretation

- **Confounded and to be re-tested:** the prior Squire 65% Jungle stall rate,
  the prior Striker Balanced/other frame stall interpretations, and the prior
  Squire frame/weapon combo reads based on node-04 no-progress runs. They were
  measured while the Recovery softlock could occur and must not be combined
  with these post-fix completion rates.
- **Confirmed technical result:** node-04 is not an insufficient-spawn,
  unreachable, pathing-broken, aggro-broken, or modifier-driven node. The
  90-96% unengaged signature disappeared after the Recovery gate fix in both
  direct diagnostics and the real bot harness.
- **Current gameplay signals with normal engagement:** Balanced Striker is
  slower and more death-prone than Heavy in this n=3 sample; one Balanced
  Squire run still stalled despite sustained attackers; and Quake beat Ruinous
  in the corrected Balanced Squire A/B. These are follow-up hypotheses, not
  numeric balance instructions.
- **Slinger:** the new n=4 replication did not reproduce a Contagion advantage;
  keep the earlier possibility open but do not promote it to a settled result.
- **Still valid from the prior work:** Conduit Ruinous-vs-Quake separation,
  the current Desert Survivalist-vs-Tempered lack of separation, and the
  Apprentice Contagion/Sweep signal were not affected by this Jungle defect.

## 10. Next recommendation

The fixed engine and real bot harness are clean enough to resume targeted T2
class/frame/weapon experiments. Do not launch the full 164-run campaign yet.
First run a focused canonical/normal-reward follow-up for Balanced Squire and
Balanced Striker (and use the explicit node-04 engagement gate), then expand
the class matrix if the normal-engagement results persist. Keep 1x economy
experiments separate: this campaign used synthetic J0 entry and 25x rewards,
so it validates combat/progression behavior and the absence of the softlock,
not economy values.

No balance changes were made during this campaign.
