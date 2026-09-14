# V1n — Independent Volcano and Tundra T3 pressure screens

Status: both independent, sequential V1n cases reached their intended T3
target node and stopped on the first authoritative gameplay death. Neither
case completed the required 300-second farm or the recovered return. The
runner classified both terminal states as `failed` with reason `declared
first-death stop`; both supervisors and reports completed normally, and both
experiment networks were released. There was no harness or infrastructure
failure, no retry, no replication, no source/build change and no downstream
experiment.

These are one-run, smoke-isolated observations under synthetic T2 entry and
`rewardMultiplier=25`. They are not causal survival estimates, reliability
results, normal-speed economy evidence, or balanced T3 viability conclusions.
The run summaries retain `canonical=false`, `SYNTHETIC_TIER_ENTRY`,
`NON_CANONICAL_REWARD_MULTIPLIER`, `combatEvidenceEligible=false` and
`economyEvidenceEligible=false`, with `treatmentValidity=not-asserted`.

## Session ledger

| Field | Value |
|---|---|
| Recorded setup start | 2026-09-14T09:34:43.6244894+02:00 |
| Packet ceiling | 90 minutes from recorded setup start |
| Hard setup/run/report/release deadline | 2026-09-14T11:04:43.6244894+02:00 |
| Frozen execution revision | `1cb668fd0b3c0a2720bed5d963831f32073025d7` |
| Frozen source tree | `9db57fdc910c8a67f62cded56cc9182e3167883c` |
| Validation checkout | `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1n-volcano-tundra-20260914` |
| Input Snapshot B | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json` |
| Input SHA-256 | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Operator contract | Two separate manifests, sequential; one worker/case; `smoke-isolated`; intended policy; count 1; automatic retries 0 |

The initial setup check recorded about 17.0 GB free on C:. No experiment worker
container was running before creation. The existing development stack,
historical experiment networks/resources and unrelated dirty checkout changes
were preserved.

The clean checkout passed `pnpm install --offline --frozen-lockfile` with 448
packages, `pnpm bot:preflight` and `pnpm typecheck`. Preflight included the
authoritative earned-T3 checkpoint spawn qualification, route/policy
semantics, progression gates, telemetry and release checks. The packet's
optional full repository suite was not run to completion and no full-suite
pass is claimed.

The one empty bridge-capacity probe was:

| Field | Value |
|---|---|
| Probe name | `mmoexp-v1n-capacity-20260914-094238-9b38b89f` |
| Exact network ID | `bf806cb8c604ecc35bcd67439a992c07e1477a05d3b070ea50bdb5500b109063` |
| Driver / endpoints | `bridge` / empty `Containers` map |
| Attached containers | none |
| Disposition | removed by exact ID; follow-up inspect exit 1 and network listing empty |

## Frozen input and profile validation

The same unchanged input was copied into each manifest and verified against the
packet hash. It is an earned-T3 handoff captured at T3 Sanctuary with
`canonicalAtCapture=false`, class root `energy-root`, frame `energy-heavy` and
the inherited Wisp branch `energy-range-far`. The entry has current skill tier
3, player tier 3, zero unspent skill points, GM78, full HP 236/236, full
barrier 132/132, incoming DoT 0, defensive stance, the Plains/Forest/Desert
T2 seals, Volcano mastery level 6 and the following unchanged loadout:

`Ruinous Axe +5 / Cave Vest +5 / Mountain Charm +5 / Plains Boots +5 /
Tempered Core / no relic`.

Both runs reported the same profile ID, `profilePass=true`, `spawnPass=true`,
360 checks and no failures. The observed build converged at 28RP: Sweep
technique; Second Wind and Brace guards; Defensive stance; and the inherited
rules `Always -> Auto Path Enemy`, `Inside Telegraph -> Step Back`,
`In Combat -> Orbit`, `Always -> Avoid Hazards`, `Always -> Wait for Regen`,
`While Traveling -> Avoid Enemies`, and `While Traveling -> Fight Back`.
Observed RP was 17 ability + 1 stance + 10 logic = 28, within the budget of
31. No purchases, upgrades, refund, branch reset or inventory substitution
occurred. Wisp was inherited; no V1n Wisp unlock mutation was performed.

The original entry was synthetic and accelerated. Its recorded final wallets
are retained as observations only, not economy evidence.

## Sealed manifests and immutable runtime

Both manifests were created from the same exact revision and verified before
launch. Each used `maxRunMs=900000` (15 minutes), full-gauntlet completion,
clean entry economy, reward multiplier 25, one worker, one case, intended
policy, `fastBossRetry=false` and `automaticRetries=0`.

| Case | Manifest | Run key | Manifest SHA-256 | Image |
|---|---|---|---|---|
| A | `20260914t074300z-spirit-volcanic-t3-v1n` | `001-spirit-volcanic-t3-v1n-intended-r01` | `dfd599e565fc350f04977d28a6ced6d9696659a5cac51353c597c41f22eb5f0b` | `sha256:cb88a7e1eb007b75f37d90776abb69ebf9eac079212a87058c660f68b685016f` |
| B | `20260914t074825z-spirit-tundra-t3-v1n` | `001-spirit-tundra-t3-v1n-intended-r01` | `cf2acc09f2baec8ad83b927da414e708fc722006731e9a338b2d3d7252e49b14` | same immutable image |

The manifest `experiment.sha256` content matched the corresponding
`experiment.json` hash in both cases: A
`dfd599e565fc350f04977d28a6ced6d9696659a5cac51353c597c41f22eb5f0b`; B
`cf2acc09f2baec8ad83b927da414e708fc722006731e9a338b2d3d7252e49b14`. The
immutable image was `mmo-idle-experiment:1cb668fd0b3c-165579c7` with labels:

| Field | Value |
|---|---|
| Image revision label | `1cb668fd0b3c0a2720bed5d963831f32073025d7` |
| Image build ID label | `77f76954e56086e2eae10861` |
| Manifest build ID | `77f76954e56086e2eae10861` |
| Manifest tooling hash | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` |
| Manifest copied runtime hash | `eb51708fcfeebcd2cc7ce1cce2d5e0edcd5b5d4017cacfd5c49086a1bd1200e6` |

Host/runtime tooling was Node `v22.16.0`, pnpm `8.15.1`, Docker client/server
`29.5.2`, with `pnpm-lock.yaml` SHA-256
`513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10`.

| Tooling file | SHA-256 |
|---|---|
| `scripts/experiment/lib.mjs` | `43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12` |
| `scripts/experiment/study.mjs` | `22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f` |
| `scripts/experiment/release.mjs` | `b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838` |
| `scripts/experiment/supervisor.mjs` | `b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e` |
| `scripts/experiment/worker.mjs` | `c234045557806cbc3b63c8c05ff603b2a54a33ced2ba2593c1cca87ec2cc290f` |
| `scripts/experiment/Dockerfile` | `89a9b844832bc7082b43ceeb46aa5a0f79069106f3a9deb2f661166603b9549d` |

## Durable execution clocks

All execution clocks below are UTC. Relative telemetry begins at each run's
`run-start` event.

| Phase | Case A: Volcano | Case B: Tundra |
|---|---|---|
| Manifest created | 2026-09-14T07:44:23.191Z | 2026-09-14T07:48:33.552Z |
| Supervisor started | 2026-09-14T07:44:58.153Z | 2026-09-14T07:48:59.685Z |
| Worker run starting | 2026-09-14T07:44:59.679Z | 2026-09-14T07:49:01.260Z |
| Worker container running | 2026-09-14T07:45:01.930Z | 2026-09-14T07:49:03.248Z |
| Telemetry run start | 2026-09-14T07:45:07.314Z | 2026-09-14T07:49:08.120Z |
| Telemetry run end | 2026-09-14T07:46:52.123Z | 2026-09-14T07:52:36.689Z |
| Worker result terminal | 2026-09-14T07:46:52.187Z | 2026-09-14T07:52:36.741Z |
| Supervisor run-terminal event | 2026-09-14T07:47:02.765Z | 2026-09-14T07:52:47.291Z |
| Supervisor completed | 2026-09-14T07:47:03.038Z | 2026-09-14T07:52:47.568Z |
| Terminal release receipt | 2026-09-14T07:47:03.859Z | 2026-09-14T07:52:48.377Z |
| Supervisor release event | 2026-09-14T07:47:06.226Z | 2026-09-14T07:52:50.841Z |
| Cohort report generated | 2026-09-14T07:47:47.524Z | 2026-09-14T07:53:58.263Z |
| Telemetry duration | 104.809 s | 208.569 s |

The continuation gate for B was checked at creation with 76.33 minutes
remaining in the packet window, well above the required 25 minutes.

## Case A — Volcano

### Arrival, resolved target and route

The route reached `v1n:volcanic:ready` at relative 0.569 s, then completed the
Volcano T3 travel step in 89.076 s. The arrival milestone resolved to
`node-t3-volcanic-01`; the authoritative target-node enter was at relative
90.580 s with modifier `alacrity`.

Node-enter sequence, including transit nodes, was:

`node-t3-sanctuary` -> `node-t3-swamp-06 (fortified)` ->
`node-t3-swamp-04 (dominion)` -> `node-t3-swamp-03 (swarming)` ->
`node-t3-swamp-02 (heavy)` -> `node-t3-volcanic-01 (alacrity)`.

| Window | Relative clock | Observation |
|---|---:|---|
| Exact build configure | 0.567–0.568 s | 28RP verified; no issues |
| Sanctuary recovery/readiness | 0.569 s | full HP/no incoming DoT predicate already satisfied |
| Volcano arrival milestone | 89.645 s | T3, GM78, target resolved to `node-t3-volcanic-01` |
| Target node enter | 90.580 s | `node-t3-volcanic-01`, `alacrity` |
| Farm survival | 15.003 s accounted in Volcanic | 3.001 s idle + 12.002 s combat; 1 kill |
| Farm completion | not reached | required 300 s alive/auto target-area time; 420 s step cap |
| Recovered return | not observed | no return transit and no 20 s Sanctuary tail |

The run completed 6 of 10 route steps before the first death. There was no
farm-completion marker, full-recovery-at-farm-end marker or return marker.

### Combat and progression

The run recorded 1 kill for 1,935 player damage dealt. The kill was one Ember
Scuttler at relative 102.831 s; no boss was scheduled or attempted. Incoming
damage was direct only: 265 total, with no DoT. Summary source totals were
Ember Scuttler 233 and Cinder Hound 32. Total absorbed was 132, total healed
206 and reported HP lost 171.27. The minimum concurrency-sample HP was 64.73;
the retained pre-terminal death window reached 47.57 HP. Maximum simultaneous
attackers was 5, with 39 monsters in the largest node sample.

The authoritative death record is relative 104.808 s / absolute
2026-09-14T07:46:52.122Z: melee, Cinder Hound, damage 59, in
`node-t3-volcanic-01`, modifier `alacrity`, route step `v1n:volcanic:farm`.
The record's dominant accumulated source was Ember Scuttler, and its retained
`killingBlow`/`largestHit` subfields identify earlier Ember Scuttler hits (the
largest reported pre-terminal hit was 33 direct damage at relative 99.409 s);
those subfields are retained but not substituted for the authoritative cause.

Observed controls were Sweep x2, Second Wind x1 and Brace x1. There were no
Cleanse activations or removals, no Step Back activations, no hazard-escape
events, no persistent-hazard telemetry and no stance switches. There was no
lava contact, so this case provides no live verdict on the static-lava fix.
No enemy-specific TTK interval was emitted; the 12.002 s aggregate combat
window and whole-node timing must not be treated as enemy TTK.

Progression remained GM78 and Volcanic level 6. The run gained 503 red essence
and 7 Alacrity catalysts, with no craft, purchase or upgrade. These values are
reward-25 progression observations only.

## Case B — Tundra

### Arrival, resolved target and route

The route reached `v1n:tundra:ready` at relative 0.570 s, then completed the
Tundra T3 travel step in 195.673 s. The arrival milestone resolved to
`node-t3-tundra-01`; the authoritative target-node enter was at relative
196.581 s with modifier `heavy`.

Node-enter sequence, including transit nodes, was:

`node-t3-sanctuary` -> `node-t3-swamp-06 (fortified)` ->
`node-t3-tundra-05 (heavy)` -> `node-t3-cave-06 (dominion)` ->
`node-t3-mountain-04 (fortified)` -> `node-t3-mountain-03 (dominion)` ->
`node-t3-tundra-01 (heavy)`.

| Window | Relative clock | Observation |
|---|---:|---|
| Exact build configure | 0.567–0.569 s | 28RP verified; no issues |
| Sanctuary recovery/readiness | 0.569–0.570 s | full HP/no incoming DoT predicate satisfied |
| Tundra arrival milestone | 196.244 s | T3, GM90, target resolved to `node-t3-tundra-01` |
| Target node enter | 196.581 s | `node-t3-tundra-01`, `heavy` |
| Farm survival | 11.999 s in target node | 1.000 s idle + 10.999 s combat; 0 kills |
| Farm completion | not reached | required 300 s alive/auto target-area time; 420 s step cap |
| Recovered return | not observed | no return transit and no 20 s Sanctuary tail |

The run completed 6 of 10 route steps before the first death. The aggregate
Tundra zone accounting was 37.000 s: 25.001 s during travel and 11.999 s in
the target node. The summary reports zero resource blocking and no stall
record; the target node itself included 1.000 s idle and 10.999 s combat.
Death stopped the farm before its completion predicate, so no recovery/return
window was observed.

### Combat and progression

The run recorded 5 kills and 6,350 player damage dealt before target-node
entry: Cavern Troll x2, Crag Mortar x2 and Mountain Colossus x1. The Tundra
target produced no kill. Incoming damage was direct only: 334.53 total, with
no DoT. Summary source totals were Glacier Bear 174.2, Crag Mortar 83.33 and
Cavern Troll 77. Total absorbed was 554.47, total healed 790.47 and reported
HP lost 332.36. The minimum concurrency-sample HP was 85.47; the retained
pre-terminal death window reached 63.97 HP. Maximum simultaneous attackers was
1, with 24 monsters in the largest node sample.

The authoritative death record is relative 208.568 s / absolute
2026-09-14T07:52:36.688Z: melee, Glacier Bear, damage 149.767, in
`node-t3-tundra-01`, modifier `heavy`, route step `v1n:tundra:farm`.
The dominant accumulated source was Glacier Bear. The retained
`killingBlow`/`largestHit` subfields identify an earlier Glacier Bear hit of
143.2 direct damage with 19.8 absorbed at relative 204.460 s; those fields are
retained separately because they may be stale relative to the authoritative
death cause.

Observed controls were Sweep x12, Second Wind x1 and Brace x1. Ten Sweep
activations occurred during transit combat and two in the target farm. There
were no Cleanse activations or removals, no Step Back activations, no
hazard-escape events, no persistent-hazard telemetry and no stance switches.
Ambient Tundra Chill was not isolated in the emitted telemetry, so no failure
is attributed to missing Cleanse or to a discrete root/slow effect. No
enemy-specific TTK interval was emitted; the 10.999 s target combat window and
whole-node timing must not be treated as enemy TTK.

Reward-25 transit progression moved GM78 to GM90 and raised Mountain and Cave
from level 12 to level 18. The run gained 4,062 blue essence, 3,776 red
essence, 58 Fortified catalysts and 54 Dominion catalysts. This rapid
progression is part of the observed accelerated state, not normal-speed
economy evidence. Tundra was new at entry, while Volcano began at mastery 6;
these raw outcomes are not an equal-mastery biome ranking.

## Cross-case result and interpretation

| Case | Gameplay terminal | Target node | Farm survival | Farm complete | Safe return | Run-level snapshot |
|---|---|---|---:|---:|---:|---|
| A Volcano | first death: Cinder Hound melee | `node-t3-volcanic-01 / alacrity` | 15.003 s | no | no | none; index all null |
| B Tundra | first death: Glacier Bear melee | `node-t3-tundra-01 / heavy` | 11.999 s | no | no | none; index all null |

Both cases validated entry/profile/build convergence and reached their actual
resolved target node. Neither was a clear under the packet's viability gate.
Both died during target-area farming before the 300-second accumulation
requirement. The lack of a return window means no conclusion can be drawn
about safe return or recovered Sanctuary behavior.

The two cases must not be ranked as an equal-mastery comparison: Volcano began
with level-6 mastery, Tundra was new, and B gained substantial Mountain/Cave
progression during accelerated transit. A zero-kill window is not farm
viability, and the short target windows do not estimate ordinary T3 survival.

No boss was scheduled in either case. No live lava contact occurred. No
Tundra ambient Chill or discrete root/slow attribution was supported. The
authoritative death causes and available casts/attacker data are retained;
`killingBlow` fields are not used to rewrite those causes. No balance proposal
or source fix follows from this packet, and no downstream experiment is
started.

The supplied Snapshot B was not edited, refunded, relabeled or replaced. Both
run `snapshot-index.json` files contain `snapshotA=null`, `snapshotB=null` and
`checkpoint=null` because the first-death stop occurred before a run-level
final snapshot. The input checkpoint remains the only preserved Snapshot B and
retains the verified hash above.

## Terminal release

Both cases reached supervisor `completed`, generated a cohort report, emitted
a `released` receipt and had their exact experiment network removed. Owned
service containers and database volumes were retained; no `experiment:clean`,
global prune, volume deletion, historical resume or unrelated service stop was
used.

| Case | Released network / exact ID | Receipt | Post-release verification | Retained service containers |
|---|---|---|---|---|
| A | `mmoexp-bf6a12e8f761-network` / `13df949e8364447ccc7936fadb2ca10457f977129c1b743f39c05f1d1da9b210` | `2026-09-14T07:47:03.859Z`, `released` | exact inspect exit 1; no network listing | `mmoexp-bf6a12e8f761-redis` exited 0; `mmoexp-bf6a12e8f761-postgres` exited 0; volume `mmoexp-bf6a12e8f761-postgres-data` retained |
| B | `mmoexp-137ccb7432eb-network` / `ff8436b8fe03f8c97321a131240c1d60b51c0de1097a77735705a995415fbc05` | `2026-09-14T07:52:48.377Z`, `released` | exact inspect exit 1; no network listing | `mmoexp-137ccb7432eb-redis` exited 0; `mmoexp-137ccb7432eb-postgres` exited 0; volume `mmoexp-137ccb7432eb-postgres-data` retained |

Resource maxima were 145.8 MiB / 36.6% CPU / 22.8 ms event-loop p99 across
22 samples for A, and 158.4 MiB / 37.0% CPU / 46.3 ms p99 across 42 samples
for B. Both runs were single-worker, uncontested, saw zero other players and
reported no contamination or stalls.

## Artifact hash ledger

All retained files under each artifact root were hashed mechanically after the
case report was generated. `A/` and `B/` below refer to these roots:

- `A/` = `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t074300z-spirit-volcanic-t3-v1n`
- `B/` = `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t074825z-spirit-tundra-t3-v1n`

### Case A

| File | SHA-256 |
|---|---|
| `A/cohort-summary.json` | `aa03431ff51831fce3d8d7c8ea0518ba1f7a0346b83e9158b7868b87bec27698` |
| `A/experiment.json` | `dfd599e565fc350f04977d28a6ced6d9696659a5cac51353c597c41f22eb5f0b` |
| `A/experiment.sha256` | `338168cd12f6c5e4af10f2c3dafd353d8d6712e577ae4f1b7fe713e077342e79` |
| `A/inputs/tier-entry/snapshot-b.json` | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| `A/network-release.json` | `d5f2d6e6c536046b02de1792c47aed2c9a68847f1200f537e2c621aab0aa6914` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/artifacts/spirit-volcanic-t3-v1n-intended-2026-09-14T07-45-07-307Z-726f99b1/deaths.jsonl` | `c2f4978d85fabc557f7fcb6ab5d1a7cde1cdd57dd1a89d9b274cad6c8d78968f` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/artifacts/spirit-volcanic-t3-v1n-intended-2026-09-14T07-45-07-307Z-726f99b1/events.jsonl` | `e9093120d9a8176642cb6927f6e099611e930eedddf81cee08b3fa5c058b2eee` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/artifacts/spirit-volcanic-t3-v1n-intended-2026-09-14T07-45-07-307Z-726f99b1/snapshot-index.json` | `4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/artifacts/spirit-volcanic-t3-v1n-intended-2026-09-14T07-45-07-307Z-726f99b1/summary.json` | `dd5be1f8b2011d9d57d9ca83bab2b0de5f7820854376ccdfc045302e1c0c5a7e` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/bot.log` | `543bf22a7eeb362f59d3f843420919e4faa44db598e7a2b0dad410b677c5b03f` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/resource-samples.jsonl` | `ae028539ea4d4c2ff83f73fbd50cc0f76b5c136b64d82a13cfa65ae8e975e204` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/run-config.json` | `75e3928470d9d6fa8d06afc1eaa11355fcc08d70253233364723b0aa12f89d4a` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/server.log` | `e5892e08105e3ef17338d9503b803d0e6971c4a15c38116cd95a75fca5307341` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/worker-heartbeat.json` | `4b80382bf2ce0a90488e583b8d6730e9c2df8a38368bdb05f9a4452ab3d4f54c` |
| `A/runs/001-spirit-volcanic-t3-v1n-intended-r01/worker-result.json` | `045ad59682931c4b825224155644de740d57f77d1d4148d4b527ea6434189059` |
| `A/runtime-secrets.json` | `cf4af4e1355b76368acfd7a72e536b00f69736333a2b146fc36c7e770bad122b` |
| `A/runtime/lib.mjs` | `43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12` |
| `A/runtime/release.mjs` | `b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838` |
| `A/runtime/study.mjs` | `22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f` |
| `A/runtime/supervisor.mjs` | `b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e` |
| `A/state.json` | `f2d22e31cda253671f5a3521e7001217c6c4c23b3c0fb13fd98d56b176dbe495` |
| `A/supervisor-events.jsonl` | `614b3375317c5c738907d176d863a71ccacdd90bbe6de33d790f6eda291082f9` |
| `A/supervisor.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `A/supervisor.pid` | `40abc54785602f133416aad7b793f8700eb4a17df7ae70d72cad1448f63e6ae4` |

### Case B

| File | SHA-256 |
|---|---|
| `B/cohort-summary.json` | `62c223ccb4f0cd5cc06e7ff44b3bc9016ecf5a2b7fb308e08b09b30a1f84b869` |
| `B/experiment.json` | `cf2acc09f2baec8ad83b927da414e708fc722006731e9a338b2d3d7252e49b14` |
| `B/experiment.sha256` | `8aa48df0231c3316b00d326d0db3978122135320487e8dfd3a60bc27807dd05d` |
| `B/inputs/tier-entry/snapshot-b.json` | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| `B/network-release.json` | `040fa93a73beac3f567188cab68572f80bd805c93b5d5536f36650f08d25f988` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/artifacts/spirit-tundra-t3-v1n-intended-2026-09-14T07-49-08-111Z-1f971a87/deaths.jsonl` | `4e2f533693ad48b3dae9c69af7d192c2ea707d0894ede95c0f410101c741e826` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/artifacts/spirit-tundra-t3-v1n-intended-2026-09-14T07-49-08-111Z-1f971a87/events.jsonl` | `798a0cc46cb7483a6ff7d3a89dd0bf5b77c3437c4e3710f02e0b6ae9fa08db73` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/artifacts/spirit-tundra-t3-v1n-intended-2026-09-14T07-49-08-111Z-1f971a87/snapshot-index.json` | `4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/artifacts/spirit-tundra-t3-v1n-intended-2026-09-14T07-49-08-111Z-1f971a87/summary.json` | `803d3007b55ad0f8769ca3eae85ddee5073f6b73596f2d4a5326bb043627d776` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/bot.log` | `ce1129440370997eb7b4c3d870ee0885353a66b8ce14ad172b40047fcb2ee998` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/resource-samples.jsonl` | `6cfa5881773a64e4b8cae67be276742dc45cf34b00996e35363a4a8bff6bea87` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/run-config.json` | `e527c772de762982b341ea452945831df3555e66bc65ca733a45fbbf0fe7f528` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/server.log` | `9d447a8b51e28242f2689d629607a97cac166fa4605527f44478cf32804547ba` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/worker-heartbeat.json` | `9a6bd7bd8f1531509dc5b4184f0479ee5753e0293558baa504111825a57970c7` |
| `B/runs/001-spirit-tundra-t3-v1n-intended-r01/worker-result.json` | `0075487648d8098777d39b85110bb2c1e168a16be1cb35a1f23f9560e029a0ee` |
| `B/runtime-secrets.json` | `f1a73e29b7fdc604af534308e47b717f309761b9eb5414344253435b1abc9542` |
| `B/runtime/lib.mjs` | `43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12` |
| `B/runtime/release.mjs` | `b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838` |
| `B/runtime/study.mjs` | `22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f` |
| `B/runtime/supervisor.mjs` | `b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e` |
| `B/state.json` | `d721aa2d5602ec5a0143fac563e8f60e576abac6d8236d1771d430792dfecee3` |
| `B/supervisor-events.jsonl` | `8503ce11735d16129cd63a637506a07bbe281f4a7f3246f4a722eb5dcd3aea22` |
| `B/supervisor.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `B/supervisor.pid` | `52cc9cf856b5b248e4e4d150c1cceb7fbd8ea27d44ea3818af5e838687fc4a80` |

## Disposition

The V1n packet is complete and closed at the required evidence boundary.
Retain both manifests, reports, logs, volumes and service containers for
review. No winner, balance adjustment, lava-fix verdict, Cleanse attribution,
or follow-on experiment is authorized by these two bounded first-death
observations.
