# V1d execution report — repaired transit recovery

2026-09-13 local time; the sealed run executed on 2026-09-12 UTC. This is the
one exact execution required by the [V1d operator packet](</C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1d-operator-packet.md>).
No source, route, manifest, runtime, economy, assertion, retry, resource
injection, tactical intervention, ceiling extension, cleanup, snapshot import,
boss attempt, or follow-on run was made.

## Result

**Disposition: preparation complete; repaired transit recovered after one natural death.**

The fresh intended Striker reached Tier 1, GM30, all five Tier-1 biome level-6
milestones, and the complete requested four-piece +5 kit. It entered the
Plains Vest +5 supplier journey, died once in Forest 04 while the vest
objective was active, returned through Clearing and Swamp, reached the Plains
Alacrity supplier, farmed the missing catalyst, and completed every route step
and readiness assertion. The route emitted `v1c:verified-plains-build`,
`v1c:preparation-complete`, and `v1c:final-readiness`.

The runtime event stream contains dead samples but no explicit `respawn` event.
Therefore the exact live respawn timestamp is unobserved. The first
post-death node arrival was Clearing at 794,466 ms, followed by Swamp 06,
Swamp 04, and Plains 01; this is recovery/arrival evidence, not an inferred
navigation-intent or exact respawn timestamp. The V1c post-death arrival stall
did not recur in this run.

This is one treatment validation, not a universal guarantee for every dangerous
crossing. The accelerated run remains noncanonical and is not evidence for 1x
economics, class-wide viability, or boss balance.

## Sealed provenance and setup

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t214718z-striker-campaign-preparation-t` |
| Route / version | `striker-campaign-preparation-t1` / `1.0.0` |
| Run | `001-striker-campaign-preparation-t1-intended-r01` |
| Character | `Bot striker-campaign-pre` / `bba35aa4-234b-4625-a7a6-5210233fa3c8` |
| Requested / executed revision | `028e8933118364e6b5e7129e57acb4c4fb7cd23d` |
| Source tree | `2d5b94e8848332c987765316967ed74923eca0f7` |
| Immutable image | `sha256:c0e24e39c497b881bb0fba353842be71f8ae8a075aff22552ebebadfa805d8f8` |
| Image tag / build identity | `mmo-idle-experiment:028e89331183-d90e6996` / `fac6baa17fb4eb59b39ce05e` |
| Manifest SHA-256 | `2391dcd07bb9ea8a080d533ed918abdb49232c2ce8edf0414452aba4ae506622` |
| Tooling / copied-runtime tree hashes | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Invocation | `develop`; dirty only because one unrelated human-playtest file was untracked and excluded |
| Mode / policy / workers | `smoke-isolated` / `intended` / one worker and one run |
| Entry | fresh clean entry; `tierEntrySnapshot=null` |
| Reward / boss retry | `rewardMultiplier=25`; `fastBossRetry=false` |
| Limits / retries | `maxRunMs=1800000`; automatic retries `0`; manual retries `0` |
| Treatment validity | `valid`; isolation grade `isolated`; canonical `false` |

The [sealed experiment manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/experiment.json>)
and [manifest hash](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/experiment.sha256>)
were checked before launch. The source tree matched the frozen revision's Git
tree, the Docker image ID matched the manifest, and the generated runtime tree
matched its manifest hash. The copied [runtime](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runtime/lib.mjs:70>)
retains the unique temporary filename using `randomBytes(6)` and the bounded
rename retry through `attempt >= 20`. `pnpm bot:preflight` passed, including the
campaign executor observation and transit recovery regressions; preflight is
harness validation, not balance evidence.

The worker started at 21:50:15.870Z, the bot run artifact began at
21:50:24.240Z, and the worker ended at 22:09:06.560Z. The run-relative duration
was 1,122,116 ms (18m42.116s). Supervisor finalization ended at 22:09:18.535Z.
Neither the ten-minute arrival timeout nor the 30-minute run ceiling fired.

The preserved [experiment state](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/state.json>)
records game database `g_11216807ab374ae1`, log database `l_11216807ab374ae1`,
and the owned infrastructure prefix `mmoexp-83611b05e84c`. The PostgreSQL
volume is `mmoexp-83611b05e84c-postgres-data`; the run's event stream, logs,
snapshots, and database volume remain preserved. Runtime secrets and the
credential-bearing run configuration are intentionally not linked.

## Terminal agreement

| Evidence source | Terminal observation |
|---|---|
| Supervisor state | `completed` |
| Run state / reason | `completed` / `bot_completed` |
| Worker result | `completed` / `bot_completed` |
| Final heartbeat | `phase=completed`, `lastHealth.status=ok`, zero consecutive health failures |
| Run summary | `completion=completed`, 105/105 route steps |
| Cohort summary | one run, `completed=1`; max memory 185.6 MiB, CPU 48.4%, event-loop p99 37.5 ms |

The [supervisor terminal event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/supervisor-events.jsonl:4>)
and [supervisor completion event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/supervisor-events.jsonl:5>)
agree with the [worker result](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/worker-result.json>),
[final heartbeat](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/worker-heartbeat.json>),
[authoritative summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/summary.json>),
and [cohort summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/cohort-summary.json>).

## Preparation progression

The run began at Clearing with empty inventory, recipes, essences, catalysts,
abilities, and no imported tier-entry snapshot. It remained Tier 1 and never
acquired a frame.

| Run-relative time | Observed progression | Event evidence |
|---:|---|---|
| 115,614 ms | Tier 1 entered | [tier-up](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:186>) |
| 116,411 ms | Tier-0 quest complete | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:191>) |
| 124,434 ms | Clearing set complete | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:251>) |
| 172,515 ms | Plains level 6 / `plains-maxed` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:397>) |
| 229,591 ms | Forest level 6 / `forest-maxed` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:534>) |
| 273,655 ms | Swamp level 6 / `swamp-maxed` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:666>) |
| 378,285 ms | Mountain level 6 / `mountain-maxed` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:895>) |
| 408,336 ms | Cave level 6, GM30 / `all-biomes-maxed` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:987>) |
| 719,682 ms | Chaotic Axe +5 | [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1563>) |
| 1,119,579 ms | Plains Vest T1 +5 | [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2296>) |
| 1,120,081 ms | Swamp Charm T1 +5 | [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2300>) |
| 1,120,583 ms | Plains Boots T1 +5 | [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2306>) |
| 1,121,085 ms | `gear-plus-5` | [milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2309>) |
| 1,122,099 ms | verified final build, `v1c:preparation-complete`, and `v1c:final-readiness` | [final build](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2348>), [completion marker](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2351>), [final readiness assertion](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2356>) |

The final [Snapshot B](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/snapshot-b.json>)
was captured at 1,122,102 ms in Plains 01. It is a preserved, noncanonical
`tier2-handoff` capture, not a boss-ready or canonical export. The earlier
[Snapshot A](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/snapshot-a.json>)
was captured at 408,337 ms in Cave 05 at GM30 and is likewise noncanonical and
not an input.

## Final state and exact build

| Field | Observed final value |
|---|---|
| Player tier / class root / frame | Tier 1 / `cadence-root` / `null` |
| Level / global mastery | 127 / 30 |
| Biome levels | Clearing 4; Plains, Forest, Swamp, Mountain, Cave 6 |
| Final equipped kit | Chaotic Axe +5; Plains Vest T1 +5; Swamp Charm T1 +5; Plains Boots T1 +5 |
| Other upgrade levels | Iron Broadsword +1; Plains Charm T1 +2; Flash Rapier +4; Mountain Vest T1 +4 |
| Technique / Guard | Sweep / Second Wind |
| Ordered Rune rules | `always → auto-path-enemy`; `inside-telegraph → step-back`; `in-combat → chase-enemy`; `always → avoid-hazards`; `always → wait-for-regen` |
| Rune points | 19 / 22 |
| Stance / Rite / Core / Relic | none / none / none / none |
| Known but not attuned | Expose Weakness and Cleanse are known; only Sweep and Second Wind are attuned |
| Final runtime | Plains 01, alive, full 164/164 HP, no active target |

The final build was verified authoritatively at 1,122,099 ms with all five Rune
rules and 19 RP ([verified build event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2348>)).
All ten tier/mastery/kit assertions and the final readiness assertion completed
successfully ([assertion sequence](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2317>)).

## Acquisition blocks and supplier evidence

The route-level block durations include travel while the objective remained
active. The summary's direct `purpose=blocked` accounting is 550,073 ms; it is
not added to activity time. `purpose=travel`, `purpose=blocked`, and activity
(`travel`, `combat`, `idle`, `dead`) are separate observations.

| Objective | Wall-clock block | Missing at block start | Supplier / result |
|---|---:|---|---|
| `avoid-hazards` Rune | 242,604–264,122 ms (21,518 ms) | 25 Purple essence and Swamp level 2 | Swamp 03 arrived at 243,372 ms; resource block resolved and Rune was crafted ([start/end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:563>)) |
| Plains Boots +4 | 366,770–377,783 ms (11,013 ms) | 31 Might essence | Plains 05 Fortified arrived at 367,382 ms; 40 yellow essence was earned and the upgrade completed ([start/end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:868>)) |
| Chaotic Axe +5 | 408,361–719,680 ms (311,319 ms) | 11 Deep essence and one Swarming catalyst | Cave 03 Swarming arrived at 462,400 ms; catalyst gained at 719,447 ms and Axe +5 completed at 719,682 ms ([catalyst](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1559>), [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1563>)) |
| Plains Vest +5 | 720,183–1,119,577 ms (399,394 ms) | One Alacrity catalyst; yellow essence was sufficient | After the natural death and recovery, Plains 01 Alacrity arrived at 860,478 ms; catalyst gained at 1,119,506 ms and Vest +5 completed at 1,119,579 ms ([block](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1566>), [catalyst](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2292>), [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:2296>) |

The run gained one Swarming and one Alacrity catalyst and spent both. Final
essences were 11,502 Red, 20 Blue, 1,559 Green, 10,601 Yellow, and 303 Purple;
final catalyst wallet was empty. The summary records 12,043 Red from Cave,
11,211 Yellow from Plains, 250 Green from Clearing, 571 Purple from Swamp,
1,643 Green from Forest, and 312 Blue from Mountain. These values are
25x-pipeline observations under the recorded economy candidate, not 1x rates.

| Biome | Zone time | Travel activity | Combat activity | Dead | Direct resource block |
|---|---:|---:|---:|---:|---:|
| Clearing | 189,356 ms | 65,009 ms | 41,333 ms | 0 ms | 0 ms |
| Plains | 309,033 ms | 6,002 ms | 154,024 ms | 0 ms | 271,027 ms |
| Forest | 80,022 ms | 57,017 ms | 67,012 ms | 2,001 ms | 0 ms |
| Swamp | 93,009 ms | 62,010 ms | 15,006 ms | 0 ms | 20,999 ms |
| Mountain | 20,009 ms | 8,003 ms | 10,004 ms | 0 ms | 0 ms |
| Cave | 430,078 ms | 152,028 ms | 145,030 ms | 0 ms | 258,047 ms |

The [summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/summary.json>)
keeps these partitions separate; overlapping route blocks and activity labels
must not be summed as independent elapsed time.

## Natural transit death and recovery

| Observation | Evidence |
|---|---|
| Death | One ordinary melee death recorded at 791,485 ms (record payload 791,484 ms) in Forest 04, Fortified; route label `upgrade plains-vest-t1 to +5`. |
| Cause / attackers | Direct killer `Wolf`; killing blow 10 damage; dominant incoming source `Young Wolf` with 140 damage; maximum concurrent attackers 9. No boss. |
| Loadout at death | Chaotic Axe, Mountain Vest T1, Swamp Charm T1, Plains Boots T1; Axe +5 and the other three pieces +4. |
| Dead interval evidence | `purpose=travel`, `activity=dead` samples at 792,464 and 793,465 ms; summary Forest `deadMs=2,001`. |
| Exact live respawn | No `respawn` event exists in `events.jsonl` or `deaths.jsonl`; exact timestamp and node are unobserved. |
| First post-death arrival | Clearing at 794,466 ms, 2,982 ms after the recorded death; travel activity resumed. |
| Subsequent arrivals | Swamp 06 at 810,469 ms; Swamp 04 at 844,478 ms; Plains 01 Alacrity at 860,478 ms. |
| Destination outcome | Plains 01 was reached 68,994 ms after the death and 66,012 ms after the first post-death arrival; supplier farming then completed the Vest +5 block. |

The [death record](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1684>)
and preserved [deaths stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/deaths.jsonl>)
show the death during observed travel activity. The [dead samples](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1685>)
are followed by [Clearing](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1688>),
[Swamp 06](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1713>),
[Swamp 04](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1766>),
and [Plains 01](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/events.jsonl:1789>).
No outbound navigation intent event is emitted in the preserved telemetry, so
the route label and travel-purpose samples are not treated as proof of a
specific intent message. There was no repeated dangerous crossing after
recovery and no supplier-farming classification before the Plains arrival.

## Combat and encounter boundary

The run recorded 127 ordinary kills, 3,453 damage taken, 3,218 healing, and
15,951 player damage dealt. Sweep activated 70 times and Second Wind 10 times.
Step Back activated 9 times with 9 attempts, 9 successes, and zero damage
received; hazard escape telemetry recorded no separate hazard-escape attempt.
These are acquisition observations from the [mechanics summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/summary.json>),
not a boss benchmark.

The route contains no dungeon or boss step. The authoritative summary records
`bosses.attempts=0`, `bosses.victories=0`, and `bossesCleared=[]`; no encounter,
boss HP, phase, boss death, or boss victory event exists. The natural Wolf
death is ordinary transit/combat evidence and is not a boss failure.

## Evidence disposition and next boundary

| Evidence class | Disposition |
|---|---|
| Preparation | Complete for this run: GM30, all five biome level-6 milestones, full requested +5 kit, exact build, all 105 route steps, and final readiness assertions. |
| Transit recovery | Valid one-run observation: one natural Forest death recovered through Clearing/Swamp to Plains 01, with no repeated arrival stall. Exact live respawn event and navigation intent remain unobserved. |
| Supplier acquisition | Valid observed completion of Swarming and Alacrity catalyst blocks under the route; supplier farming began only after the corresponding node arrivals. |
| Gameplay / boss balance | Untested; no encounter step and zero boss attempts. |
| Economy | Inadmissible for 1x balance: `rewardMultiplier=25`, `NON_CANONICAL_REWARD_MULTIPLIER`, and economy candidate arm F. |
| Infrastructure | Valid finalization; supervisor, worker, heartbeat, summary, and cohort agree, with no infrastructure failure. |

The narrow V1d result is that the repaired executor recovered a natural transit
death sufficiently for this fresh run to reach the Plains supplier and complete
preparation. It does not establish a death rate, universal transit safety,
1x economy, boss viability, class-wide tuning, or checkpoint restoration.
Preserve the [final summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/summary.json>),
events, character identity, snapshots, logs, database identifiers, and volume.
Do not resume the character, relabel or import Snapshot A/B, attempt a boss, or
create a downstream experiment automatically; return to Astra for the next
decision.
