# V1h — current T1 counterplay and corrected T2 acceleration

Status: complete. The three sequential supervisors completed all 13 planned
slots by 2026-09-13T15:28:05.333Z (17:28:05.333+02:00). This is the durable
operator ledger for bot-balance-v1h-operator-packet.md. Gameplay and balance
remain frozen; reward multiplier 25 makes A/B noncanonical, and C is a
synthetic progression screen rather than economy evidence.

## Session ledger

| Field | Value |
|---|---|
| Frozen revision | 3145246a1db79f3848bef7270f6e0f205ea94bd9 |
| Frozen source tree | 576d0efae1d961f3733ab85800ac6c0af06875d3 |
| Session started before setup | 2026-09-13T15:16:08.2133028+02:00 |
| Hard session deadline | 2026-09-13T20:16:08.2133028+02:00 |
| Worker ceiling | 4h00m; one worker and one active manifest |
| Operator checkout | C:/Users/osaif/Documents/Claude/Projects/MMO idle |
| Exact clean validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1h-integrated (detached, clean) |
| Preflight | PASS on the exact frozen revision; tooling and harness validation only |
| Planned / started / terminal | 13 / 13 / 13 |
| Session disposition | complete; no unstarted slots, supervisor failure, worker exception, infrastructure stop, or evidence-loss stop |

The session stopped naturally after the last declared C run. No queue,
automatic retry, manifest rewrite, state rewrite, edit, extension, fast boss
retry, or downstream T3/T4 work was used.

## Input provenance

Phases A and B use the unchanged original Night 1 kit. Phase A uses the
prepared Cave study. The clean validation checkout converted the study to
CRLF, so both hashes are retained; normalized text and the packet arm order
matched exactly.

| Input | Value |
|---|---|
| Original kit snapshot | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t233824z-striker-campaign-night-kit-t1/runs/001-striker-campaign-night-kit-t1-intended-r01/artifacts/striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2/snapshot-b.json |
| Kit SHA-256 | 1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755 |
| Operator-prepared Cave study SHA-256 | bb8143dd915e018b2909565d4d889311abb48a248071073bddb288489b099246 |
| Clean-checkout Cave study SHA-256 | 2018f86f0ced53cb1f221dc4977661c74ed417adf9910c51fa1207951a7c4f37 |
| Study normalization check | equal after line-ending normalization; operator 609 bytes, validation 620 bytes, 11 CRLF lines in validation copy |
| Source state | exact frozen tree; no imported boss clears for A/B; C synthetic clean T2 entry |

## Infrastructure and frozen runtime

Preflight ran once after the clean validation checkout was installed offline
and passed all harness, route, profile, loadout, choice, experience, study,
timeline, pairing, calibration, and semantic checks. It did not establish
balance evidence.

Docker server 29.5.2 passed the three-slot capacity check. The temporary
probes were uniquely named, confirmed as empty local bridge networks, and
removed by exact ID; historical resources were untouched.

| Probe | Network ID | Result |
|---|---|---|
| mmo-v1h-capacity-20260913-1517-1 | cebba72f3d762b14a67262c552f5b924d61d8ac6a3d1ce2c92f635a0f8189050 | bridge, local, 0 containers; removed |
| mmo-v1h-capacity-20260913-1517-2 | a05c199436d6ff3f3802127ff7de9ae021f73161d37ed886f5cdd78114bf02e8 | bridge, local, 0 containers; removed |
| mmo-v1h-capacity-20260913-1517-3 | c4d51d3b35492d24ffa87dc8b27b7e213800740d61bc37fbc316dc2f1e88d194 | bridge, local, 0 containers; removed |

All manifests used the same frozen image and runtime:

| Field | Value |
|---|---|
| Image | mmo-idle-experiment:3145246a1db7-165579c7 |
| Image digest | sha256:40ede91f1334c283c2354ff59e0bf0ec5c1add1f76d975b01e05f7a4bbe8f8d3 |
| Image build ID | 4e49a0f262f00162fc2e8d64 |
| Tooling hash | 165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f |
| Runtime hash | f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472 |
| Docker build note | warning only: SecretsUsedInArgOrEnv AUTH_DEV_BYPASS |
| Runtime write fix | frozen lib.mjs atomic JSON writer verified with EPERM/EACCES/EBUSY retry through attempt 20 |

The final audit found the expected healthy experiment Postgres/Redis
containers and mmoexp-0fddc658a7c5-network still retained, with no active
worker. They were not stopped or pruned because the packet reserves direct
resource stopping for a verified supervisor-fatal condition and forbids
stopping DB/Redis as cleanup.

## Manifest ledger

| Phase | Manifest; created | Supervisor | Sealed configuration | Manifest SHA-256 | Terminal |
|---|---|---|---|---|---|
| A — current Cave study | 20260913t131702z-striker-campaign-night-cave-t1; 2026-09-13T13:18:24.772Z | PID 39004; 13:19:23.275Z–13:57:24.322Z | smoke-isolated, one worker, 4 routes, 2 replicates each, maxRunMs 900000, reward 25, intended, no automatic retries | 9dddb5558e7ca3487bd9707df4ac606da278a909767f58b03925aea6c782c0c6 | completed 8/8 |
| B — Mountain check | 20260913t135815z-striker-campaign-night-mountai; 2026-09-13T13:58:24.106Z | PID 39488; 13:58:59.543Z–14:09:12.755Z | smoke-isolated, one worker, current original kit, maxRunMs 900000, reward 25, intended, no automatic retries | dd21c9cee74562b4b24e1f7bf2045d6d67a0f64109a7698f6f371aa5a75d879e | completed 2/2 |
| C — targeted T2 progression | 20260913t141015z-striker-t2-progression-squire; 2026-09-13T14:10:24.003Z | PID 37536; 14:10:54.393Z–15:28:05.333Z | smoke-isolated, one worker, Striker/Squire/Spirit, synthetic clean T2 entry, maxRunMs 1800000, reward 25, intended, no automatic retries | e8b42d40806623f058e834c664c271677ab77d2389f690622f2271ca41016422 | completed 3/3 |

Each manifest was launched once. The report and cohort-summary.json were
generated after the corresponding terminal artifacts were available.

## Phase A — Cave study

The sealed planner order was expose-wind, dual-swamp, dual-cave,
triple-cave, dual-swamp, dual-cave, triple-cave, expose-wind. Every case
retained the Axe, Mountain Vest, Plains Boots +5, and ordered rune rules.
The four packages were:

| Arm | Recovery / ability package | Charm | RP marker |
|---|---|---|---|
| expose-wind | Expose Weakness + Second Wind | Swamp Charm +5 | 20/22; night:cave:ready |
| dual-swamp | Second Wind + Cleanse | Swamp Charm +5 | 16/22; v1g:cave-dual:ready |
| dual-cave | Second Wind + Cleanse | Cave Charm +5, crafted normally | 16/22; v1h:dual-cave-charm:ready |
| triple-cave | Second Wind + Brace + Cleanse | Cave Charm +5, crafted normally | 21/22; v1h:triple-cave-charm:ready |

All eight cases passed profile/spawn validation with 215 checked assertions,
zero errors, and zero warnings; reached the exact marker; completed the
ordinary guardian-inclusive route; and ended completed/bot_completed. The
Cave boss was Obsidian Broodmother and the guardian was Cave Sentinel.
Boss-attempt victory plus progression cave:1 is the authoritative clear
corroboration; the raw kill.isBoss flag was false in these artifacts.

### A terminal run ledger

The timing column reports pre-guardian interval from the boss-attempt wrapper,
guardian duration, and named-boss combat duration. The route and biome clocks
are independent telemetry: Cave total is followed by travel/fight.

| Slot / arm | Run ID | Terminal; route | Timing ms | HP samples; boss HP | Authoritative outcome |
|---|---|---|---|---|---|
| 001 expose-wind r1 | striker-campaign-night-cave-t1-intended-2026-09-13T13-19-30-850Z-197dce2d | completed/bot_completed; 19/19; night:cave:ready | pre→guardian 110581; guardian 92562; boss 44532; Cave 243039 (96019/76010) | max 179; lowest 37.994%; last 52.5165%; Snapshot B 100.297883/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 002 dual-swamp r1 | striker-campaign-cave-dual-guard-t1-intended-2026-09-13T13-24-11-524Z-22b46747 | completed/bot_completed; 19/19; v1g:cave-dual:ready | pre→guardian 111581; guardian 93565; boss 46521; Cave 245038 (95026/89008) | max 179; lowest 36.8071%; last 60.0519%; Snapshot B 107.492967/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 003 dual-cave r1 | striker-campaign-cave-dual-cave-charm-t1-intended-2026-09-13T13-28-54-782Z-7ed2acb5 | completed/bot_completed; 22/22; v1h:dual-cave-charm:ready | pre→guardian 111593; guardian 93077; boss 48031; Cave 246035 (95019/86008) | max 179; lowest 14.5068%; last 20.5446%; Snapshot B 8.646895/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 004 triple-cave r1 | striker-campaign-cave-triple-cave-charm-t1-intended-2026-09-13T13-33-44-619Z-e0fb38b1 | completed/bot_completed; 23/23; v1h:triple-cave-charm:ready | pre→guardian 110591; guardian 93070; boss 48034; Cave 245022 (95009/93005) | max 179; lowest 31.2156%; last 41.9686%; Snapshot B 83.076916/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 005 dual-swamp r2 | striker-campaign-cave-dual-guard-t1-intended-2026-09-13T13-38-32-153Z-6ba2f554 | completed/bot_completed; 19/19; v1g:cave-dual:ready | pre→guardian 110598; guardian 93068; boss 48030; Cave 245043 (94012/92015) | max 179; lowest 35.5669%; last 59.6743%; Snapshot B 92.618523/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 006 dual-cave r2 | striker-campaign-cave-dual-cave-charm-t1-intended-2026-09-13T13-43-14-996Z-915e0bb7 | completed/bot_completed; 22/22; v1h:dual-cave-charm:ready | pre→guardian 112112; guardian 92560; boss 48034; Cave 247026 (97009/84019) | max 179; lowest 12.2704%; last 20.0514%; Snapshot B 9.382727/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 007 triple-cave r2 | striker-campaign-cave-triple-cave-t1-intended-2026-09-13T13-48-03-069Z-9d3e1e11 | completed/bot_completed; 23/23; v1h:triple-cave-charm:ready | pre→guardian 109587; guardian 93076; boss 48038; Cave 244033 (94018/105007) | max 179; lowest/last 27.1244%; Snapshot B 52.404937/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |
| 008 expose-wind r2 | striker-campaign-night-cave-t1-intended-2026-09-13T13-52-50-719Z-9ee9eaae | completed/bot_completed; 19/19; night:cave:ready | pre→guardian 111589; guardian 92081; boss 44539; Cave 242044 (95017/90019) | max 179; lowest 38.5848%; last 54.2214%; Snapshot B 99.150672/179; terminal boss 0% | Obsidian Broodmother victory; cave:1 |

Player HP samples are concurrency-sample telemetry and are kept separate
from the end-of-run Snapshot B value. The lowest sample is not a claim that
every frame or every damage event was sampled.

### A abilities, corrosion, counterplay, and combat scope

| Slot | Final loadout; abilities | Actual effect telemetry | Counterplay | Run-wide combat |
|---|---|---|---|---|
| 001 expose-wind r1 | chaotic-axe / mountain-vest-t1 / swamp-charm-t1 / plains-boots-t1; Expose Weakness 7, Second Wind 6 | no Cleanse; no corrosion-removal claim | Step Back 3/3 successes; three slam-telegraph results successful, damage 0 | 5 kills; player damage 2885; taken 1038; healed 883; top incoming Broodmother 533, Sentinel 504 |
| 002 dual-swamp r1 | chaotic-axe / mountain-vest-t1 / swamp-charm-t1 / plains-boots-t1; Second Wind 6, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; three slam results success, damage 0 | 4 kills; player damage 2927; taken 1100; healed 944; top incoming Sentinel 567, Broodmother 533 |
| 003 dual-cave r1 | chaotic-axe / mountain-vest-t1 / cave-charm-t1 / plains-boots-t1; Second Wind 7, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; three slam results success, damage 0 | 4 kills; player damage 2879; taken 1133; healed 801; top incoming Sentinel 567, Broodmother 565 |
| 004 triple-cave r1 | chaotic-axe / mountain-vest-t1 / cave-charm-t1 / plains-boots-t1; Second Wind 7, Brace 6, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; Brace activations 6; direct Brace mitigation amount not emitted; three slam results success, damage 0 | 5 kills; player damage 3124; taken 1117; healed 776; top incoming Broodmother 490, Sentinel 483 |
| 005 dual-swamp r2 | chaotic-axe / mountain-vest-t1 / swamp-charm-t1 / plains-boots-t1; Second Wind 7, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; three slam results success, damage 0 | 5 kills; player damage 3112; taken 1276; healed 1092; top incoming Sentinel 567, Broodmother 565 |
| 006 dual-cave r2 | chaotic-axe / mountain-vest-t1 / cave-charm-t1 / plains-boots-t1; Second Wind 7, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; three slam results success, damage 0 | 4 kills; player damage 2879; taken 1133; healed 807; top incoming Sentinel 565, Broodmother 565 |
| 007 triple-cave r2 | chaotic-axe / mountain-vest-t1 / cave-charm-t1 / plains-boots-t1; Second Wind 7, Brace 6, Cleanse 5 | plating-shred removed 5 | Step Back 3/3; Brace activations 6; direct Brace mitigation amount not emitted; three slam results success, damage 0 | 6 kills; player damage 3344; taken 1185; healed 793; top incoming Broodmother 522, Sentinel 483 |
| 008 expose-wind r2 | chaotic-axe / mountain-vest-t1 / swamp-charm-t1 / plains-boots-t1; Expose Weakness 7, Second Wind 6 | no Cleanse; no corrosion-removal claim | Step Back 3/3; three slam results success, damage 0 | 5 kills; player damage 3118; taken 1133; healed 971; top incoming Broodmother 533, Sentinel 504 |

Each Cave run emitted 18 telegraph-dodge events and three successful
slam-telegraph result events with zero damage. The triple-arm Brace count is
an activation count only; no effectiveness or mitigation value is inferred.
Damage and healing are run-wide, including guardians and the boss. No healing
is attributed to Second Wind without an effect-specific field.

| Arm | Planned | Started | Valid gameplay | Victories | Boss deaths | Invalid/interrupted/unstarted |
|---|---:|---:|---:|---:|---:|---:|
| expose-wind | 2 | 2 | 2 | 2 | 0 | 0 |
| dual-swamp | 2 | 2 | 2 | 2 | 0 | 0 |
| dual-cave | 2 | 2 | 2 | 2 | 0 | 0 |
| triple-cave | 2 | 2 | 2 | 2 | 0 | 0 |

These eight cases are valid T1 gameplay observations only. With two
replicates per arm, they are not a win-rate ranking or a balance verdict.

## Phase B — current Mountain check

Phase B reused the original kit with Axe +5, Mountain Vest +5, Swamp Charm
+5, Plains Boots +5, Expose Weakness + Second Wind, 20/22 RP, and the
night:mountain:ready marker. The Mountain boss was Crag Behemoth and the
guardian was Stone Warden. Both cases passed profile/spawn validation with
215 checked assertions, completed 19/19 route steps, and ended
completed/bot_completed.

| Run | Terminal and route | Timing ms | HP samples; boss HP | Abilities and counterplay | Authoritative outcome |
|---|---|---|---|---|---|
| striker-campaign-night-mountain-t1-intended-2026-09-13T13-59-07-077Z-859d437e | completed/bot_completed; GM30; mountain:1; mountain 207022 (32002/108014); Cave 63008 (63008/12002) | pre→guardian 111590; guardian 90573; boss combat 73547; total 289806 | max 179; lowest 24.4418%; last 97.7041%; Snapshot B 179/179; terminal boss 0% | Expose Weakness 11, Second Wind 4; Step Back 8 activations/attempts, 0 successes, 0 damage | Crag Behemoth victory; progression mountain:1 |
| striker-campaign-night-mountain-t1-intended-2026-09-13T14-04-16-741Z-682039c9 | completed/bot_completed; GM30; mountain:1; mountain 201018 (31003/109007); Cave 63012 (63012/0) | pre→guardian 110083; guardian 90570; boss combat 69048; total 283813 | max 179; lowest 30.6382%; last 65.6109%; Snapshot B 117.443533/179; terminal boss 0% | Expose Weakness 10, Second Wind 4; Step Back 8 activations/attempts, 0 successes, 0 damage | Crag Behemoth victory; progression mountain:1 |

The eight charge-corridor result events, four per run, were all discarded and
recorded damageReceived 0. There was no charge-hit telemetry and no Instinct
telemetry. The current result therefore does not reproduce or invalidate the
historical uncapped-Instinct Mountain success. Range aggregates and add
counts were not used to infer endless kiting: they include non-boss periods
and omit hitbox reach.

| Run | Run-wide combat scope |
|---|---|
| r1 | 5 kills; player damage 3364; taken 1153; healed 1078; top incoming Crag Behemoth 657, Stone Warden 408 |
| r2 | 5 kills; player damage 3406; taken 1174; healed 1041; top incoming Crag Behemoth 657, Stone Warden 408 |

Both are valid current T1 gameplay observations, not economy evidence and not
a basis for changing the Mountain build.

## Phase C — corrected-25x T2 progression screen

Phase C used independent synthetic clean T2 entry, no tier-entry snapshot,
corrected 25x catalyst rewards, and one run each for Striker Balanced, Squire
Heavy, and Spirit Heavy. No T2 boss or T3 ascent was authorized.

The summaries actually contain templateValidation objects with passing
profile/spawn checks (224, 224, and 225 checked respectively), rather than
null. The actual summary value is reported here. All three have
treatmentValidity not-asserted, isolationGrade isolated,
soloBaselineEligible false, combatEvidenceEligible false, and
economyEvidenceEligible false; all are tainted SYNTHETIC_TIER_ENTRY and
NON_CANONICAL_REWARD_MULTIPLIER.

### C terminal screens

| Class | Terminal; progress | Final levels / GM | Final loadout and upgrade screen | Abilities; deaths | Blocked time |
|---|---|---|---|---|---:|
| Striker | timed_out: run exceeded maxRunMs (1800000ms); 109/129; last jungle-t2-maxed; no T2 boss | Plains/Forest/Swamp/Mountain/Cave 12, Clearing 4, Jungle 6; GM66 | ruinous-axe / cave-vest-t2 / plains-charm-t2 / plains-boots-t2 / core-tempered / no relic; 2 crafts, 22 upgrades, 7 evolutions, 2 stance crafts, 7 equips; final T2 targets mostly +4, axe +3, cave vest +3 | Expose 23, Sweep 116, Second Wind 20, Cleanse 6; 3 deaths | 1107156 ms |
| Squire | timed_out: run exceeded maxRunMs (1800000ms); 109/129; last jungle-t2-maxed; no T2 boss | Plains/Forest/Swamp/Mountain/Cave 12, Clearing 4, Jungle 6; GM66 | quake-hammer / mountain-vest-t2 / swamp-charm-t2 / plains-boots-t2 / core-tempered / no relic; 2 crafts, 23 upgrades, 7 evolutions, 2 stance crafts, 7 equips; final T2 targets mostly +4, hammer +4, mountain vest +3 | Expose 22, Sweep 121, Second Wind 13, Cleanse 3; 2 deaths | 1058216 ms |
| Spirit | completed/bot_completed; 119/133; last gm-72-all-t2-maxed; no T2 boss | Plains/Forest/Swamp/Mountain/Cave 12, Clearing 4, Jungle 6, Desert 6; GM72 | ruinous-axe / cave-vest-t2 / mountain-charm-t2 / plains-boots-t2 / core-tempered / no relic; 3 crafts, 28 upgrades, 8 evolutions, 2 stance crafts, 8 equips; final T2 targets reached through +4 screen | Expose 24, Sweep 32, Second Wind 6, Cleanse 4; 3 deaths | 23007 ms |

Striker and Squire reached the fixed 30-minute farming/upgrade cap with an
open final upgrade block. Spirit completed after reaching GM72 and emitted a
noncanonical Snapshot B. These are progression observations, not class
rankings and not evidence that GM72 is sufficient for +5 or boss readiness.

### C biome accounting

Times are total (travel / fight / dead / blocked) in milliseconds. Essence
and catalyst entries are the emitted per-biome totals; omitted fields were
zero or absent.

| Class | Biome | Time ms | Kills / deaths | Essence | Catalyst progress |
|---|---|---:|---:|---|---|
| Striker | Jungle | 1023137 (55009/458077/2000/925120) | 100 / 1 | green 15868 | fortified 10, swarming 177 |
| Striker | Cave | 230041 (54007/83004/4002/132028) | 4 / 2 | red 1499 | swarming 12, dominion 5 |
| Striker | Swamp | 200012 (125005/66005/0/0) | 4 / 0 | purple 1176 | fortified 14 |
| Striker | Plains | 185583 (167582/61014/0/6999) | 12 / 0 | yellow 1366 | dominion 2, fortified 1, heavy 6, alacrity 4 |
| Striker | Mountain | 65007 (43000/36010/0/0) | 3 / 0 | blue 780 | swarming 9 |
| Striker | Forest | 53005 (10000/31002/0/0) | 8 / 0 | green 794 | alacrity 9 |
| Striker | Sanctuary | 43009 (0/0/0/43009) | 0 / 0 | — | — |
| Squire | Jungle | 961209 (4001/468093/2001/914197) | 96 / 1 | green 16896 | fortified 199 |
| Squire | Swamp | 276049 (156030/38016/0/75008) | 8 / 0 | purple 2296 | fortified 13, heavy 14 |
| Squire | Plains | 241678 (211670/126029/0/19003) | 24 / 0 | yellow 2763 | dominion 2, fortified 5, swarming 1, heavy 10, alacrity 12 |
| Squire | Cave | 145014 (88008/42004/2001/31003) | 5 / 1 | red 1759 | swarming 15, dominion 5 |
| Squire | Mountain | 84020 (54010/28005/0/0) | 5 / 0 | blue 1365 | swarming 16 |
| Squire | Forest | 54008 (20004/15000/0/0) | 5 / 0 | green 607 | alacrity 7 |
| Squire | Sanctuary | 38005 (19000/0/0/19005) | 0 / 0 | — | — |
| Spirit | Plains | 244656 (195647/159635/0/9002) | 32 / 0 | yellow 4001 | dominion 13, fortified 3, swarming 1, heavy 14, alacrity 13 |
| Spirit | Swamp | 225034 (169024/54013/0/0) | 5 / 0 | purple 1522 | fortified 15, heavy 3 |
| Spirit | Cave | 126028 (81017/37005/0/13004) | 9 / 0 | red 3729 | swarming 27, heavy 11, alacrity 7 |
| Spirit | Sanctuary | 106024 (90021/0/0/0) | 0 / 0 | — | — |
| Spirit | Jungle | 88008 (51003/41004/2000/1001) | 6 / 1 | green 1080 | fortified 12 |
| Spirit | Desert | 62004 (30000/29003/0/0) | 4 / 0 | yellow 677 | dominion 2, swarming 6 |
| Spirit | Mountain | 61006 (15001/38004/4001/0) | 3 / 2 | blue 802 | swarming 10 |
| Spirit | Forest | 49019 (11011/19002/0/0) | 8 / 0 | green 841 | alacrity 10 |

The final emitted catalyst totals were Striker dominion 7, fortified 25,
heavy 6, alacrity 13, swarming 198; Squire dominion 7, fortified 217,
heavy 24, alacrity 19, swarming 32; Spirit dominion 15, fortified 30,
heavy 28, alacrity 30, swarming 44. No explicit prior-catalyst-gate assertion
was emitted, so these gains are not treated as proof that a canonical prior
gate was cleared.

### C resource blocks

The open spans at the fixed cap are censored at the cap and are not converted
into completed acquisition times.

| Class | Block span and reason | Duration ms | Interpretation |
|---|---|---:|---|
| Striker | 1076→114189 stance:offensive-stance | 113113 | preparation wait |
| Striker | 479580→609687 craft:core-tempered | 130107 | resource/craft wait |
| Striker | 617707→630718 upgrade:cave-vest-t2+1 | 13011 | upgrade wait |
| Striker | 758834→1800541 upgrade:ruinous-axe+4 | 1041707 | open and censored at cap |
| Squire | 1135→153416 stance:offensive-stance | 152281 | preparation wait |
| Squire | 160461→170983 reconstruct:plains-charm-t2 | 10522 | recovery/reconstruction wait |
| Squire | 530542→609637 craft:core-tempered | 79095 | resource/craft wait |
| Squire | 770872→1800594 upgrade:mountain-vest-t2+4 | 1029722 | open and censored at cap |
| Spirit | 1096→119857 stance:offensive-stance | 118761 | preparation wait |
| Spirit | 616140→624654 upgrade:ruinous-axe+1 | 8514 | upgrade wait |
| Spirit | 626159→631685 upgrade:cave-vest-t2+1 | 5526 | upgrade wait |
| Spirit | 732322→900008 upgrade:ruinous-axe+4 | 167686 | completed progression wait |

Total blocked time is 1107156 ms for Striker, 1058216 ms for Squire, and
23007 ms for Spirit. The final Striker wallet was at node-t2-cave-02 and the
final Squire wallet at node-t2-jungle-04, both timed out. Spirit completed at
node desert02 with GM72.

### C death records

These are authored death artifacts, not boss losses. Killer names and route
steps are reported exactly where emitted; Squire's second killer was
unidentified in the record.

| Class | At ms | Biome / node / modifier | Route step and label | Killer; cause / damage | Max HP; plating; reduction |
|---|---:|---|---|---|---|
| Striker | 517173 | Cave / node-t2-cave-04 / dominion | 75, craft core-tempered | Cave Troll; melee / 75 | 193; 25; 0.02 |
| Striker | 555815 | Cave / node-t2-cave-04 / dominion | 75, craft core-tempered | Giant Spider; melee / 15 | 193; 25; 0.02 |
| Striker | 1736645 | Jungle / node-t2-jungle-02 / swarming | 109, upgrade ruinous-axe as far as Global Mastery allows | Jungle Snake; dot / 21 | 236; 15; 0.18 |
| Squire | 555765 | Cave / node-t2-cave-03 / swarming | 79, craft core-tempered | Cave Troll; melee / 161 | 257; 24; 0.07 |
| Squire | 1139991 | Jungle / node-t2-jungle-04 / fortified | 109, upgrade mountain-vest-t2 as far as Global Mastery allows | Unknown; dot / 22 | 298; 22; 0.07 |
| Spirit | 237039 | Mountain / node-t2-mountain-02 / swarming | 42, travel swamp T2 | Stone Eagle; melee / 108 | 172; 18; 0.02 |
| Spirit | 432344 | Mountain / node-t2-mountain-02 / swarming | 63, farm mountain T2 to level 12 | Stone Eagle; melee / 46 | 177; 23; 0.02 |
| Spirit | 753367 | Jungle / node-t2-jungle-04 / fortified | 112, upgrade ruinous-axe as far as Global Mastery allows | Jungle Snake; dot / 21 | 216; 13; 0.18 |

### C combat and telemetry scope

There were no bosses in C. Combat totals are run-wide and therefore include
all farming and recovery periods. Striker recorded 131 kills, 10923 incoming
damage, 10671 healed, 69690 player damage, and three deaths. Squire recorded
143 kills, 8795 incoming damage, 6487 healed, 84617 player damage, and two
deaths. Spirit recorded 67 kills, 1809.12 incoming damage, 3291.37 healed,
32974 player damage, and three deaths. These totals are not class power
comparisons because entry, cadence, frame, route completion, and terminal
state differ.

The C carried catalyst totals, level transitions, and GM values are
noncanonical reward-multiplier outputs. No T2 boss-ready conclusion is
supported. The Spirit Snapshot B was captured at 962603 ms with GM72 at
desert02, canonicalAtCapture false; last HP was 223/223. Striker and Squire
emitted no Snapshot B before their fixed caps. No C artifact emits a complete
lowest-HP series.

## Durable artifacts

| Phase | Cohort report | State | Per-run summary evidence |
|---|---|---|---|
| A | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/state.json | Eight summary.json files under runs 001–008; Snapshot B hashes are recorded below |
| B | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t135815z-striker-campaign-night-mountai/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t135815z-striker-campaign-night-mountai/state.json | Two summary.json files under runs 001–002; Snapshot B hashes are recorded below |
| C | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/state.json | Striker: C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/001-striker-t2-progression-intended-r01/artifacts/striker-t2-progression-intended-2026-09-13T14-11-01-876Z-d15e7381/summary.json; Squire: C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/002-squire-t2-progression-intended-r01/artifacts/squire-t2-progression-intended-2026-09-13T14-41-28-714Z-f05b3901/summary.json; Spirit: C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/summary.json |

### Snapshot B hashes

| Phase / slot | Snapshot B path | SHA-256 | Last HP / max HP |
|---|---|---|---|
| A / 001 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/001-expose-wind-r1/artifacts/striker-campaign-night-cave-t1-intended-2026-09-13T13-19-30-850Z-197dce2d/snapshot-b.json | 8ca7eb6a5a1a4b07c910a5b20b9ec1809611a3deb32bb7cbc2f27d6cab9c8af5 | 100.297883 / 179 |
| A / 002 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/002-dual-swamp-r1/artifacts/striker-campaign-cave-dual-guard-t1-intended-2026-09-13T13-24-11-524Z-22b46747/snapshot-b.json | 56104104056e3cf8d6fd0ce4587e0207a436a2d19fb1ede4438adfbc85c4b83e | 107.492967 / 179 |
| A / 003 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/003-dual-cave-r1/artifacts/striker-campaign-cave-dual-cave-charm-t1-intended-2026-09-13T13-28-54-782Z-7ed2acb5/snapshot-b.json | c094549b87e235aa45567fab02aaef1616b794520659dbd559e930d34688aba7 | 8.646895 / 179 |
| A / 004 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/004-triple-cave-r1/artifacts/striker-campaign-cave-triple-cave-charm-t1-intended-2026-09-13T13-33-44-619Z-e0fb38b1/snapshot-b.json | 74c2dde3566079ad6254e69cf473d882d7dbbc80b8aedf1fca2a937d994e7216 | 83.076916 / 179 |
| A / 005 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/005-dual-swamp-r2/artifacts/striker-campaign-cave-dual-guard-t1-intended-2026-09-13T13-38-32-153Z-6ba2f554/snapshot-b.json | 2547d98a8f6fb2c256ef2de4b0a8f331f9d7d65056d8e5a52487f5e21bcf5d05 | 92.618523 / 179 |
| A / 006 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/006-dual-cave-r2/artifacts/striker-campaign-cave-dual-cave-charm-t1-intended-2026-09-13T13-43-14-996Z-915e0bb7/snapshot-b.json | 8ed49a39decb3de67f06e78555141c6a36868bffe1b13d35789b43777beb920d | 9.382727 / 179 |
| A / 007 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/007-triple-cave-r2/artifacts/striker-campaign-cave-triple-cave-t1-intended-2026-09-13T13-48-03-069Z-9d3e1e11/snapshot-b.json | 00c910eb6310fc566a234fa3a58a58761758949272be944eca80da11c15864a6 | 52.404937 / 179 |
| A / 008 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t131702z-striker-campaign-night-cave-t1/runs/008-expose-wind-r2/artifacts/striker-campaign-night-cave-t1-intended-2026-09-13T13-52-50-719Z-9ee9eaae/snapshot-b.json | 19dc7d15b6884c62eaee926e9adaa6916d2790ab92c67bff1d221cb764cf8dce | 99.150672 / 179 |
| B / 001 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t135815z-striker-campaign-night-mountai/runs/001-striker-campaign-night-mountain-t1-intended-r01/artifacts/striker-campaign-night-mountain-t1-intended-2026-09-13T13-59-07-077Z-859d437e/snapshot-b.json | c737268b9110f7cbdcf72d16d1c14bfe9e6b3831776d4ebdd4f639d0932f871e | 179 / 179 |
| B / 002 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t135815z-striker-campaign-night-mountai/runs/002-striker-campaign-night-mountain-t1-intended-r02/artifacts/striker-campaign-night-mountain-t1-intended-2026-09-13T14-04-16-741Z-682039c9/snapshot-b.json | 847334df82b87e0358ce1c0ea4c1d52276dcd1b2472c93a7f720976130e0a7d9 | 117.443533 / 179 |
| C / Spirit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json | 4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6 | 223 / 223 |

The B and C cohort resource envelopes were healthy: A runs used about
146–153 MiB, B about 160–164 MiB, and C about 189–191 MiB. The generated
cohort reports contain the per-run CPU and event-loop P99 measurements; no
resource or supervisor-health stop was indicated.

## Mandatory outcome classification and disposition

All 13 planned slots were started and reached a terminal artifact:

| Evidence class | Result | Boundary |
|---|---|---|
| A Cave | 8 valid isolated current T1 boss victories, 2 per arm | gameplay only; 25x, two replicates, no arm ranking or economy conclusion |
| B Mountain | 2 valid isolated current T1 boss victories | current check only; no Instinct/charge-hit evidence and no historical-result relabeling |
| C T2 | Striker and Squire valid timed-out progression screens; Spirit valid completed screen | synthetic clean T2 entry, 25x, treatment not-asserted; no canonical economy, class ranking, T2 boss, or T3 inference |

The C timeouts were classified from the exact terminal reason and durable
summary, not from status alone. They were normal capped progression behavior;
the supervisor, worker, server, isolation, treatment harness, and evidence
artifacts remained healthy. No stop rule fired, so no manifest was
prematurely stopped and no run was retried or extended.

No balance edits, source edits, T3/T4 tests, boss tuning, or automatic
downstream action were authorized or performed. Finish the V1h packet by
returning to Astra for T2 boss selection or a targeted farm-build correction.
