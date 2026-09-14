# V1m — Earn Wisp before Spirit T3 travel operator report

Status: the single frozen case completed the V1m success gate. Spirit earned
the three intended T2 seals, reached natural T3, unlocked the ordinary
energy-range-far branch before travel, converged on the 28RP travel build and
arrived at T3 Sanctuary for the required recovered tail. There were zero
deaths and no infrastructure failure. The case was not retried or replicated.

This is an observed result for one isolated smoke run. It is not a causal
survival estimate, reliability result or balance evidence: the run used a
synthetic T2 entry and reward multiplier 25, and the final snapshot is
non-canonical. No balance change, automatic winner or downstream probe is
authorized by the packet.

## Session ledger

| Field | Value |
|---|---|
| Recorded setup start | 2026-09-14T08:36:24.2431867+02:00 |
| Launch deadline from setup start | 2026-09-14T09:11:24.2431867+02:00 |
| Hard setup/run/report/release deadline | 2026-09-14T10:06:24.2431867+02:00 |
| Frozen execution revision | 38116567012374bcaef51f10fba60d27d1ed2d15 |
| Frozen source tree | 1ded4d2c0928515e37a3a4ca3a39949a46420fee |
| Validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1m-spirit-wisp-20260914 |
| Manifest | 20260914t064043z-spirit-wisp-travel-t2-bridge-v |
| Route / run key | spirit-wisp-travel-t2-bridge-v1m / 001-spirit-wisp-travel-t2-bridge-v1m-intended-r01 |
| Operator contract | smoke-isolated, one worker, one case, intended policy, automatic retries 0 |

The durable execution clocks are UTC:

| Phase | UTC clock |
|---|---|
| Manifest created | 2026-09-14T06:42:06.298Z |
| Supervisor-started event | 2026-09-14T06:42:54.563Z |
| Worker run starting | 2026-09-14T06:42:56.078Z |
| Worker container running | 2026-09-14T06:42:58.256Z |
| Telemetry run start | 2026-09-14T06:43:03.636Z |
| Telemetry run end | 2026-09-14T07:01:38.114Z |
| Worker result terminal | 2026-09-14T07:01:38.177Z |
| Supervisor terminal event | 2026-09-14T07:01:49.224Z |
| Supervisor completed | 2026-09-14T07:01:49.465Z |
| Terminal release receipt | 2026-09-14T07:01:50.277Z |
| Supervisor release event | 2026-09-14T07:01:52.620Z |
| Cohort report generated | 2026-09-14T07:01:59.347Z |

Telemetry duration was 1,114,478 ms, or 18m34.478s. The 45-minute run cap
was not reached because the route completed.

## Frozen provenance and setup gates

The unchanged input was:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json

Its SHA-256 was
4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6. The
manifest copy has the same hash and was used at
/inputs/tier-entry/snapshot-b.json. The entry was prepared T2, energy-root /
energy-heavy, GM72, no selected range, no T2 seals, zero skill points and the
Ruinous Axe, Cave Vest, Mountain Charm and Plains Boots at +4 with Tempered
Core and no relic.

The clean detached checkout was used for creation and launch; the original
dirty checkout was not used as experiment source. pnpm install
--offline --frozen-lockfile passed and materialized 448 packages. The clean
exact-revision pnpm bot:preflight passed, including harness, tier-entry,
route, progression-gate, telemetry and release tests. These are tooling and
semantic checks, not balance evidence.

The pre-create disk check recorded about 19.8 GB free on C:. The one empty
bridge capacity probe was:

| Field | Value |
|---|---|
| Probe name | mmoexp-v1m-capacity-probe-20260914-0839 |
| Probe clock | 2026-09-14T08:40:13.6596090+02:00 to 2026-09-14T08:40:14.2207989+02:00 |
| Exact network ID | b46814092ab2458c262bbd57ee36b894953e31ff6d13882b1c14f02147230ef1 |
| Driver / endpoints | bridge / empty Containers map |
| Attached containers | none |
| Disposition | removed by exact ID; follow-up inspect confirmed absence |

No live experiment worker was running before creation. The unrelated dev
stack and historical experiment artifacts/resources were preserved. A stale
historical row was not resumed, cleaned or modified.

## Manifest and immutable runtime

The sealed manifest used smoke-isolated mode, one worker, one route, one
replica, reward multiplier 25, maxRunMs 2700000, full-gauntlet completion,
clean entry economy, intended policy, count 1, fastBossRetry false and
automaticRetries 0. The manifest checksum file contains the experiment.json
hash.

| Field | Value |
|---|---|
| Image tag | mmo-idle-experiment:381165670123-165579c7 |
| Image ID / digest | sha256:bc9c102fddacfddda1e64acdc8fdca46534c28e5b386022202d3c13796b75384 |
| Image revision label | 38116567012374bcaef51f10fba60d27d1ed2d15 |
| Image build ID label | d2b0c5045467cb1b48f4627b |
| Manifest build ID | d2b0c5045467cb1b48f4627b |
| Manifest tooling hash | 165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f |
| Manifest copied runtime hash | eb51708fcfeebcd2cc7ce1cce2d5e0edcd5b5d4017cacfd5c49086a1bd1200e6 |
| experiment.json SHA-256 | 88288378ca24524ba509806e623f6a19113262b26d30ef5d95171e4f80942f82 |
| experiment.sha256 content | 88288378ca24524ba509806e623f6a19113262b26d30ef5d95171e4f80942f82 |

The host tooling sources in the clean checkout were mechanically hashed as
follows; the first four also appear in the retained runtime directory.

| Host tooling file | SHA-256 |
|---|---|
| scripts/experiment/lib.mjs | 43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12 |
| scripts/experiment/study.mjs | 22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f |
| scripts/experiment/release.mjs | b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838 |
| scripts/experiment/supervisor.mjs | b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e |
| scripts/experiment/worker.mjs | c234045557806cbc3b63c8c05ff603b2a54a33ced2ba2593c1cca87ec2cc290f |
| scripts/experiment/Dockerfile | 89a9b844832bc7082b43ceeb46aa5a0f79069106f3a9deb2f661166603b9549d |

## Progression and Wisp branch

The route completed all 61 of 61 steps. The imported five T1 clears were
preserved. The three new T2 seals and natural T3 transition were observed as:

| Route point | Telemetry time | Evidence |
|---|---:|---|
| Plains ready | 00:06.099 | Imported five T1 clears, T2, GM72 |
| Plains T2 seal | 04:04.287 | Boss attempt victory; plains:2 appears in the next ready milestone |
| Forest ready | 06:15.913 | plains:2 present; T2, GM72 |
| Forest T2 seal | 09:43.067 | Boss attempt victory; forest:2 appears in the next ready milestone |
| Desert ready | 12:08.672 | plains:2 and forest:2 present; T2, GM72 |
| Natural T3 / Desert T2 seal | 17:01.182 / 17:01.874 | Tier-up at 17:01.182; boss victory and desert:2 at 17:01.874 |
| Wisp unlock step | 17:01.874 to 17:02.876 | Ordinary unlockSkill step, duration 1,002 ms |
| v1m:wisp:applied | 17:02.876 | build-change system skills, skillId energy-range-far; marker passed |
| Travel build verified | 17:05.885 | 28RP build, seven travel/build rules |
| T3 Sanctuary arrival | 18:13.451 | travel node-t3-sanctuary completed |
| Recovered T3 Sanctuary tail | 18:13.451 to 18:34.471 | 21,020 ms farm tail |

The packet-authored branch package was the ordinary energy-range-far/Wisp
unlock: +80 attack range, +12% movement, +3% attack, +3% max HP and +2%
attack speed in authored stat effects. The authoritative event at 1,022,876 ms
records build-change system skills with skillId energy-range-far and the
v1m:wisp:applied milestone at the same time. There was no debug grant, reset
or inventory substitution.

The final snapshot records selectedRange energy-range-far, unlockedSkills
energy-root, energy-heavy and energy-range-far, currentSkillTier 3, player
tier 3 and zero unspent skill points. Available final derived stats were
attack 102, attackRange 222, speed 187, maxHp 236, recovery 13, plating 18
and damageReduction 0.19. Attack speed was not emitted as a separate final
snapshot field.

The post-Wisp travel build converged through the requested ordinary sequence:

- Sweep technique.
- Second Wind and Brace guards.
- Defensive stance.
- Always -> Auto Path Enemy, Inside Telegraph -> Step Back, In Combat ->
  Orbit, Always -> Avoid Hazards, Always -> Wait for Regen.
- While Traveling -> Avoid Enemies and While Traveling -> Fight Back.

The final run event records the seven equipped rune rules, and the verified
build-change records observed RP 28. The explicit night2:travel:recover step
completed in 1 ms because its predicate was already satisfied. The terminal
T3 Sanctuary tail, rather than that zero-duration recovery step, is the
authoritative recovery observation.

The exact node-enter sequence was:

node-t2-sanctuary -> node-t2-plains-05 (fortified) -> node-t2-plains-03
(swarming) -> node-t2-plains-02 (heavy) -> node-t2-plains-01 (alacrity) ->
node-t2-plains-dungeon -> node-t2-mountain-05 (heavy) ->
node-t2-mountain-04 (fortified) -> node-t2-mountain-02 (swarming) ->
node-t2-swamp-06 (fortified) -> node-t2-plains-04 (dominion) ->
node-t2-sanctuary -> node-t2-forest-05 (alacrity) -> node-t2-forest-03
(dominion) -> node-t2-forest-02 (swarming) -> node-t2-forest-01 (alacrity) ->
node-t2-forest-dungeon -> node-t2-plains-01 (alacrity) ->
node-t2-mountain-04 (fortified) -> node-t2-mountain-02 (swarming) ->
node-t2-swamp-06 (fortified) -> node-t2-plains-04 (dominion) ->
node-t2-sanctuary -> node-t2-cave-03 (swarming) -> node-t2-cave-02 (heavy) ->
node-t2-cave-01 (alacrity) -> node-t2-swamp-01 (alacrity) ->
node-t2-desert-05 (dominion) -> node-t2-desert-dungeon ->
node-t3-volcanic-05 (fortified) -> node-t3-swamp-05 (fortified) ->
node-t3-sanctuary.

## T2 seals, boss attempts and recovery

Each attempt was guardian-inclusive; the boss-only interval is reported
separately. The named kill event isBoss field was false, so each named kill is
used only as corroboration for the authoritative boss-attempt victory and
matching progression fact.

| Attempt / earned seal | Full attempt window | Boss-only window | Outcome / corroborating kill |
|---|---:|---:|---|
| Plains T2 / plains:2 | 00:06.100–04:04.287 (238.187s) | 03:12.243–04:03.786 (51.543s) | Victory; Gorging Razortusk at 04:03.389 |
| Forest T2 / forest:2 | 06:15.913–09:43.067 (207.154s) | 09:11.544–09:42.565 (31.021s) | Victory; Apex Timberclaw at 09:42.375 |
| Desert T2 / desert:2 | 12:08.672–17:01.874 (293.202s) | 16:18.852–17:01.373 (42.521s) | Victory; Dune-Stalker Emperor at 17:01.182 |

The summary records three boss attempts, three victories and success rate 1.
The progression milestones pair the seals as follows:

- forest-ready contains newly earned plains:2.
- desert-ready contains newly earned forest:2.
- v1m:wisp:applied and night2:travel:ready contain newly earned desert:2.

## Combat, health and mechanics

The run-wide summary records 77 kills, 40,737 player damage dealt, 1,011.77
incoming damage, 2,272.33 absorbed, 3,327.33 healed and 867.23 HP lost.
Incoming damage was direct only. The largest incoming sources were Gorging
Razortusk 337.15, Cinder Hound 241, Apex Timberclaw 223.02,
Dune-Stalker Emperor 114.6, Cave Troll 55 and Ember Scuttler 35.

Ability activations were Sweep 19, Expose Weakness 22, Second Wind 8, Brace 3
and Cleanse 7. Cleanse removed five slow effects and two sun-mark effects.
Step Back emitted nine activations/attempts: two successes, one failure and
six discarded attempts, with 1.94 damage received.

There were zero deaths; deaths.jsonl is empty and summary.deaths.total is 0.
No respawn acknowledgement occurred. The final runtime state is alive at
full HP with incomingDot 0. The final 21,020 ms Sanctuary tail had no
attackers and repeated hpFraction 1 observations. No final DoT was inferred
from the lack of deaths alone; it is directly recorded in the final snapshot.

Static-hazard evidence remains unobserved. persistentHazards is empty,
hazardEscape is attempts 0, successes 0, failures 0, expired 0 and
interrupted 0, and no event with kind hazard-escape or a static contact/lava
feature ID was emitted. The run reached and survived the Volcanic node, but
there was no live lava contact, so this case gives no lava-fix verdict.
Telegraph-dodge telemetry is separate: 43 telegraph-dodge events were
recorded.

Resource reporting for the one completed run was maximum memory 194.8 MiB,
maximum container CPU 36.8%, event-loop p99 33.2 ms across 224 resource
samples. Execution mode was single, maximum concurrency 1, other players
seen 0, no contested samples and no contamination.

## Final Snapshot B

The exact final snapshot is:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json

Its SHA-256 is
c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144.
snapshot-index.json records snapshotA null, this Snapshot B and checkpoint
null; its SHA-256 is
d60017202e23f294f705d3d7ad51258c6069176c6add0701ff7945dd3b995322.

| Field | Final observation |
|---|---|
| Snapshot ID | spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09-b |
| Captured / elapsed | 2026-09-14T07:01:38.108Z / 1,114,472 ms |
| Canonical flag | false |
| Node / life | node-t3-sanctuary / alive |
| HP / max HP | 236 / 236 |
| Barrier / max barrier | 132 / 132 |
| Incoming DoT | 0 |
| Player tier / current skill tier | 3 / 3 |
| Global mastery | 78 |
| Selected range | energy-range-far |
| Unlocked skills | energy-root, energy-heavy, energy-range-far |
| Unspent skill points | 0 |
| Active stance | defensive-stance |
| Loadout | Ruinous Axe +5, Cave Vest +5, Mountain Charm +5, Plains Boots +5, Tempered Core, no relic |

Final biome levels were Plains 12, Forest 12, Swamp 12, Mountain 12, Cave
12, Clearing 4, Jungle 6, Desert 6 and Volcanic 6. Final essences were red
2,873, blue 1,020, green 5,342, yellow 13,712 and purple 1,522. Final
catalysts were alacrity 37, heavy 31, swarming 46, dominion 18 and fortified
50. These accelerated-run wallet values are retained as observations only.

The final summary marks treatmentValidity valid and isolationGrade isolated,
but canonical false, soloBaselineEligible false, combatEvidenceEligible false
and economyEvidenceEligible false. Taints are SYNTHETIC_TIER_ENTRY and
NON_CANONICAL_REWARD_MULTIPLIER.

The current strict T3 importer accepts only an unbranched checkpoint with one
unspent point. This successful V1m branched Snapshot B is therefore not yet
qualified for reuse by that importer. It is preserved unchanged; it must not
be edited, refunded or relabeled to satisfy the old importer.

## Artifact hash ledger

The retained artifact root is:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v

Filename/hash pairs were generated mechanically from every retained file under
that root:

| File | SHA-256 |
|---|---|
| cohort-summary.json | e661728fe4a0dcb5855e00f215db436fdc811bbe6e4d82a43df35672f9536a60 |
| experiment.json | 88288378ca24524ba509806e623f6a19113262b26d30ef5d95171e4f80942f82 |
| experiment.sha256 | 2e176b10625be3d6ae66c827397b5469edbbeffcd3c4baaac1b6553ae2754e7a |
| inputs/tier-entry/snapshot-b.json | 4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6 |
| network-release.json | cd279dd53509558172441cb114273999aa5b5dfd37b18c719a1f13bb1a2d8b59 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/deaths.jsonl | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/events.jsonl | b13fd59526a05b3ee88a9da0ac036679da54409fa5f26bcaaa400fde77b6372a |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json | c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-index.json | d60017202e23f294f705d3d7ad51258c6069176c6add0701ff7945dd3b995322 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/summary.json | 40042c426e10c3dcb93c759c9f0004ce1d5382ef416511acb55dbd7c43ec4504 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/bot.log | efb8cbef35f2c6d153a1a20506bcfe1eebd7fe16dfdcc4331b925ae9e2e217cf |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/resource-samples.jsonl | 525f7825ce66f84bdfe3b7ae7310ffce330aef8a8dc47a1f14e3b98c0bd5d3c7 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/run-config.json | 94fc3818dcbc0124bc81d8a85fe792e979b6ec5641734a3819d10d5b245f55e3 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/server.log | eda69480532d60990854b209cbcf4d3b6c23a55293ef43ff2c652ede9dc377ac |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/worker-heartbeat.json | 2b28b5333bc85b9e3c793c10f64278b78d779efb5ede91e93e703e7e48a0a8e7 |
| runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/worker-result.json | e63f9bdd927f61f46efbf3697e589f22214275af8dc1d389961df161e86ca5de |
| runtime-secrets.json | 8e12670bfaec399fd9fbaafab5bd7431e38810f1feacf39ff5ca86314665d1ed |
| runtime/lib.mjs | 43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12 |
| runtime/release.mjs | b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838 |
| runtime/study.mjs | 22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f |
| runtime/supervisor.mjs | b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e |
| state.json | 11770c2475e686010f37da12d3dfa0f0cdb6635496001b6acb3e99954d0971e4 |
| supervisor-events.jsonl | 30b5e4c6d2bf2c7ad857afc41035672eae5f90a10823da80e3008a33362ddbce |
| supervisor.log | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| supervisor.pid | f241299c8eea5d232afc28c2f2c46cc664903207ba3e9cf575abce73b5c3f251 |

## Terminal release

The supervisor reached completed after the bot became terminal and emitted a
released infrastructure receipt. The released network was
mmoexp-2d729c184a25-network, exact ID
8f38dc676d8574f5ad6cddbd17c598dd2d9034a2cfcc041c8e3650a3bc83cba1. A
post-release exact inspection returned exit code 1 and network listing returned
no match, confirming absence.

The release receipt retained two service containers:

- mmoexp-2d729c184a25-redis, container ID
  1d64e9fde2295d84573e3e6b0a41c24000ab2bfd2706c3487b01b1be8933674b, exited
  0.
- mmoexp-2d729c184a25-postgres, container ID
  903c5c301912560040530bc5c0ba91a47b80dd145d6b4a237fdb9cdbfed422aa, exited
  0.

The database volume mmoexp-2d729c184a25-postgres-data remains present. No
manual release fallback was needed. experiment:clean was not used; no
historical resources or unrelated services were pruned, deleted or stopped.

## Decision gate

V1m passes the packet's single-case success gate: actual T3/currentSkillTier3,
three earned T2 seals, selectedRange energy-range-far, the Wisp skill
unlocked with zero unspent points, and a recovered T3 Sanctuary tail are all
present in the retained evidence.

The result is still one non-canonical smoke-isolated run with reward
multiplier 25 and synthetic tier entry. It shows that this prepared Wisp
branch can complete this route under the packet conditions; it cannot
establish a causal survival effect, reliability or economy conclusion. The
absence of lava contact also means no live static-hazard-fix verdict. Stop
after this report for review; no downstream case was started.
