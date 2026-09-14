# V1l — Spirit bridge after static-hazard escape fix operator report

Status: the single frozen case reached all three intended T2 seal milestones
and natural T3, then stopped at the packet's declared first-death condition
during T3 Sanctuary travel. It did not reach a recovered T3 Sanctuary
checkpoint. There was no retry, replicate, source edit, balance edit or
downstream experiment.

The V1l question is therefore not a demonstrated success: the unchanged
Night2-C Spirit preparation earned the three seals and T3, but died in
Volcanic transit. This case does not validate or falsify the static-hazard
escape fix because no static-hazard contact or hazard-escape record was
emitted before the death.

## Session ledger

| Field | Value |
|---|---|
| Recorded packet clock | 2026-09-14T07:28:38.7400116+02:00, before the final capacity probe |
| Launch deadline from that clock | 2026-09-14T08:03:38.7400116+02:00 |
| Hard packet deadline | 2026-09-14T08:58:38.7400116+02:00 |
| Frozen gameplay revision | 6e1f1ee11cb9c8732468b68c97ddffddd2226b41 |
| Frozen source tree | ee98c5efe2c1d9a0d5de5308072346f46e6d3df6 |
| Validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1l-spirit-20260914 |
| Manifest | 20260914t052919z-spirit-travel-t2-bridge-night2 |
| Operator contract | smoke-isolated, one worker, one route, one case, automatic retries 0 |

The offline dependency install and clean exact-revision bot preflight completed
before the recorded final-gate clock. Their individual start times were not
captured separately; the durable experiment, worker and release clocks below
are exact.

| Phase | UTC clock |
|---|---|
| Manifest created | 2026-09-14T05:30:38.304Z |
| Supervisor started | 2026-09-14T05:31:51.919Z |
| Worker run started | 2026-09-14T05:31:51.925Z |
| Telemetry run start | 2026-09-14T05:31:59.122Z |
| Authoritative death / run end | 2026-09-14T05:50:08.323Z / 2026-09-14T05:50:08.394Z |
| Supervisor completed | 2026-09-14T05:50:19.486Z |
| Terminal release receipt | 2026-09-14T05:50:20.349Z |
| Supervisor release event | 2026-09-14T05:50:22.667Z |

Telemetry duration was 1,089,201 ms, or 18m09.201s. The 45-minute run cap was
not reached because the first-death stop fired.

## Frozen provenance and gates

- The original Spirit Snapshot B was
  C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json.
  Its SHA-256 was
  4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6.
- The copied manifest input was
  C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t052919z-spirit-travel-t2-bridge-night2/inputs/tier-entry/snapshot-b.json
  with the same SHA-256.
- The detached checkout was clean at the frozen revision. The original
  project checkout's unrelated modified V1g report and untracked human
  playtest run were preserved.
- pnpm install --offline --frozen-lockfile passed in setup and materialized
  448 packages without changing the lockfile.
- pnpm bot:preflight passed on the clean exact checkout. This is harness and
  route validation, not balance evidence.
- The one empty bridge capacity probe was named
  mmo-v1l-capacity-20260914-052838-231c66f4. Exact network ID
  d14f58e4e5fb02dc9ca29ac856668af48194a6c89616efba5d44a1e65f78b9de had
  driver bridge, subnet 192.168.80.0/20, zero endpoints and no attached
  containers; it was removed by that exact ID.

One stale historical artifact was found during the conflict check:
20260912t194203z-striker-campaign-plains-boss-t had a failed supervisor and a
stale running row caused by an earlier EPERM state-file rename. Its worker and
service containers were exited and its network had zero endpoints. It was not
stopped, cleaned or otherwise modified.

## Manifest and immutable runtime

The sealed manifest used smoke-isolated mode, one worker, one intended route,
one replica, reward multiplier 25, maxRunMs 2700000, completion full-gauntlet,
entryEconomy clean, fastBossRetry false and automaticRetries 0. Its manifest
checksum file matched experiment.json.

| Field | Value |
|---|---|
| Image tag | mmo-idle-experiment:6e1f1ee11cb9-165579c7 |
| Image ID / digest | sha256:5f160c1b9bf02da51831231ee76608d99441a9b3068d950ea2d66976e04c98ec |
| Build ID | e3792bdf2a3f7afc9d1be098 |
| Image revision label | 6e1f1ee11cb9c8732468b68c97ddffddd2226b41 |
| Image build ID label | e3792bdf2a3f7afc9d1be098 |
| Build tooling hash | 165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f |
| Copied runtime hash | eb51708fcfeebcd2cc7ce1cce2d5e0edcd5b5d4017cacfd5c49086a1bd1200e6 |

The copied host runtime files matched their host counterparts:

| File | SHA-256 |
|---|---|
| scripts/experiment/lib.mjs | 43c50ce10d4bebffbac63a82bc54f6f6f5f327896771f45b9d3458fb7b504d12 |
| scripts/experiment/study.mjs | 22bf52d4d55303dbb39edb8070196e51fa2005657260ac8003517494fce5ba8f |
| scripts/experiment/release.mjs | b312734e0435f1331620b90b599f379200a989e1b70a70ab9a0b7ff44e852838 |
| scripts/experiment/supervisor.mjs | b57c11916daabfc14cbc366430501da4f695896c8040d8552f445f6e62b7543e |
| scripts/experiment/worker.mjs | c234045557806cbc3b63c8c05ff603b2a54a33ced2ba2593c1cca87ec2cc290f |
| scripts/experiment/Dockerfile | 89a9b844832bc7082b43ceeb46aa5a0f79069106f3a9deb2f661166603b9549d |

## Progression and build convergence

The imported entry was T2, GM72, Energy Heavy, at T2 Sanctuary with the
Ruinous Axe, Cave Vest, Mountain Charm and Plains Boots at+4, plus Tempered
Core (not on the upgrade track). No relic was equipped. The supplied state had HP 223/223, no selected
range and the original five T1 boss clears. The route template and profile
checks passed; treatment validity was valid and the template validator checked
339 conditions with no failures.

| Route point | Telemetry time | Verified build | Observed RP |
|---|---:|---|---:|
| Common T2 post-upgrade build | 00:03.590 | Sweep + Expose Weakness; Second Wind; defensive stance; auto-path-enemy, Step Back, orbit, Avoid Hazards, wait-for-regen | 29 |
| Plains ready | 00:06.105 | Same common T2 build | 29 |
| Forest ready | 06:30.426 | Expose Weakness; Second Wind + Brace; defensive stance; common rules | 28 |
| Desert ready | 12:22.740 | Expose Weakness; Second Wind + Cleanse; defensive stance; common rules | 26 |
| T3 travel build verified | 17:19.011 | Sweep; Second Wind + Brace; defensive stance; common rules plus While Traveling -> Avoid Enemies and While Traveling -> Fight Back | 28 |

The final configured loadout retained Ruinous Axe +5, Cave Vest +5, Mountain
Charm +5, Plains Boots +5, Tempered Core and no relic. The final configured
abilities were Sweep, Second Wind and Brace. The configured recovery rule is
the observed Always -> wait-for-regen action; the configured hazard rule is
Always -> avoid-hazards.

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
node-t3-volcanic-05 (fortified).

## Seals, bosses and recovery timing

| Attempt | Full attempt window | Boss-only window | Outcome / corroborating named kill |
|---|---:|---:|---|
| Plains T2 | 00:06.106–03:57.807, 231.701s | 03:07.265–03:57.306, 50.041s | Victory; Gorging Razortusk at 03:56.840; progression plains:2 |
| Forest T2 | 06:30.426–10:01.609, 211.183s | 09:34.084–10:01.108, 27.024s | Victory; Apex Timberclaw at 10:00.928; progression forest:2 |
| Desert T2 | 12:22.740–17:16.001, 293.261s | 16:33.465–17:15.500, 42.035s | Victory; Dune-Stalker Emperor at 17:15.481; progression desert:2 |

The raw named-kill events identify each entity with isBoss false. Each is
reported as a boss victory only because it is corroborated by the matching
boss-attempt victory and progression event.

The route recovery steps completed at 00:06.104, 06:27.418 and 12:19.731
with zero route-step duration because their recovery predicates were already
satisfied. After the third seal, the travel recovery step ran from
17:19.012 to 17:20.514, 1.502 seconds, followed by
night2:travel:ready at 17:20.515. These route-step timings are not terminal
HP snapshots.

The progression milestones were:

- night2:bridge:plains:ready at 6,105 ms, T2, GM72.
- night2:bridge:forest:ready at 390,426 ms, T2, GM72.
- night2:bridge:desert:ready at 742,740 ms, T2, GM72.
- tier-up to T3 at 1,035,481 ms.
- night2:travel:ready at 1,040,515 ms, T3, GM72, with plains:2, forest:2
  and desert:2 added to the imported clears.

The final progression summary was player tier 3, GM76, biome levels
Plains12/Forest12/Swamp12/Mountain12/Cave12/Clearing4/Jungle6/Desert6/
Volcanic4, three new T2 seal facts and 57 of 59 route steps completed.
Volcanic reached level 4 during the accelerated transit run after one
Ember Scuttler kill; this is not normal-economy evidence.

## T3 transit death and mechanic telemetry

The travel route entered node-t3-volcanic-05, Fortified, at 1,049,683 ms and
spent 40,011 ms there. The run was still on route step label
travel node-t3-sanctuary. At 1,089,200 ms the authoritative death record
classified the cause as ranged damage 93 from Ash Salamander, monster type
ash-slinger, with one concurrent attacker. The death record's dominant source
was Ash Salamander and the death biome was volcanic.

The death record retained max HP 231, plating 18 and damage reduction 0.19.
Its diagnostic window includes a largest direct hit of 88 at 1,085,362 ms and
a killingBlow field for a direct 48-damage record at 1,087,365 ms. Those
window fields do not occur at the authoritative death timestamp; the
authoritative cause and time above are used for classification. No position
coordinates, terminal HP value or active-hazard contact state were emitted.

The run-wide combat summary recorded 74 kills, 40,837 player damage dealt,
961.45 incoming damage, 2,168.55 absorbed, 3,018.55 healed and 844.21 HP
lost. Incoming damage was recorded as direct only; no incoming DoT category
was present. This does not establish a final no-DoT state because no final
checkpoint was captured.

Ability activations were run-wide: Sweep 17, Expose Weakness 22, Second Wind
7, Brace 2 and Cleanse 7. Cleanse removed 5 slow effects and 2 sun-mark
effects. Step Back emitted 8 activations/attempts, with 2 successes, 6
discarded attempts, zero failures and zero damage received. These are
telegraph-dodge observations, not persistent-terrain escape observations.

The static-hazard telemetry was absent:

- summary mechanics.persistentHazards was empty.
- summary mechanics.hazardEscape was attempts 0, successes 0, failures 0,
  expired 0 and interrupted 0.
- No event with kind hazard-escape was present.
- No static feature ID, contact band, contact timestamp, escape destination or
  hazard result was present for the Volcanic crossing.

Therefore the Volcanic node entry and Ash Salamander death cannot be used as
lava-specific validation. Reaching a Volcanic node is not evidence that the
static-hazard escape fix was exercised.

No Snapshot B or checkpoint was produced:
snapshot-index.json records snapshotA null, snapshotB null and checkpoint
null. There is consequently no final T3 Sanctuary path/hash, no authoritative
20-second full-HP/no-DoT Sanctuary observation and no final skill-point
checkpoint to hand off.

## Validity and economy limits

The run summary marks treatmentValidity valid and isolationGrade isolated, but
canonical is false. It carries SYNTHETIC_TIER_ENTRY and
NON_CANONICAL_REWARD_MULTIPLIER taints; soloBaselineEligible,
combatEvidenceEligible and economyEvidenceEligible are all false. The final
run-end wallet was red 1,741, blue 1,007, green 5,209, yellow 13,994,
purple 1,522, with catalysts alacrity 31, heavy 33, swarming 49, dominion 18
and fortified 37. These values are retained as artifact observations only,
not balance or economy evidence.

The run had executionMode single, maximum concurrency 1, no other players,
no contested samples, no contamination and no stalls. The cohort report's
resource maxima were 181.5 MiB memory, 33.3% container CPU and 69.1 ms
event-loop p99.

## Artifact hash ledger

The run artifact directory is:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t052919z-spirit-travel-t2-bridge-night2/runs/001-spirit-travel-t2-bridge-night2-intended-r01/artifacts/spirit-travel-t2-bridge-night2-intended-2026-09-14T05-31-59-116Z-35cff954

Filename/hash pairs were generated from the retained files:

| File | SHA-256 |
|---|---|
| experiment.json | 712e3c47a11c7e03932c9bbfc901173fda3aef1157987b61c678b386239b0bb0 |
| experiment.sha256 | d3eb5ddaca91f3191f0e6b8d9dd614608a9c963b6ac2f10d957fec74c296eb41 |
| cohort-summary.json | ec6d640bb9ecc078db00d4cd4561297dd799c27391c61d83c2bb063b7724b6ef |
| network-release.json | 8c5ba852266fabf270b3ead126dcfab2f6dd7ad517774b8bb7eb15b5f3422459 |
| supervisor-events.jsonl | 260186d6b870269c0473a0a0af307c2c4533e213e8990aa57cf4f0eb078ecae0 |
| run-config.json | 95cb5485be92ab71d1304821e8c43f0c8dffe9da63dbb0d64ed81e036e3f012b |
| resource-samples.jsonl | 64c93b2b55dddddc488a19d427d3e3642b6392e8b1eb165c4b406059714956ae |
| summary.json | a60377d3781155d1080248aec3b473e4acba1c512cd7dd6cfca4596050b1f58a |
| events.jsonl | e11e47a83b1dc16858c7786a7474014d60858a1d97493e7e4b4c80bb8c03b0ca |
| deaths.jsonl | 326882e671d7184e51fcba1c61bde0fb4b3a90b8436666c33937c7567f9507c4 |
| snapshot-index.json | 4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d |

The original and copied input SHA-256 is
4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6.

## Terminal release

The supervisor reached completed after the run became terminal and emitted an
infrastructure-release event with status released. The receipt retained the
two service containers and their mounts. The released network was
mmoexp-88b1f7a5a045-network, ID
28025cb5480f3b2162aa84377f5d110767a881b9ed1d0f92157ed93e6258831c. A
post-release exact inspection confirmed that network was absent. The retained
service containers were:

- mmoexp-88b1f7a5a045-redis, exited 0, container ID
  cb073a68e1691633d83d0cf60ddc1421cbdc5518a17ba21368bec0302635450f.
- mmoexp-88b1f7a5a045-postgres, exited 0, container ID
  d5ca499911174a9de7a6f63f42197a1239b78f7c54daed1f147c0cf3a09993aa.

The database volume mmoexp-88b1f7a5a045-postgres-data remains present. No
manual release fallback was needed. experiment:clean was not used, and no
historical resources or unrelated services were pruned, deleted or stopped.

## Decision gate

V1l did not demonstrate a recovered T3 Sanctuary. It did demonstrate that the
unchanged Spirit preparation can complete the three intended T2 attempts and
reach natural T3 before dying in Volcanic transit. Because the death was
authoritatively attributed to Ash Salamander ranged damage and no static
hazard record exists, this case supplies no before/after survival conclusion
for the static-hazard fix and no balance recommendation. Stop here; no T3
probe or automatic winner is authorized by this packet.

## Astra review

Verified manifest/cohort/release and summary/events/deaths/snapshot-index
hashes against retained files. Raw loadout convergence at1039011ms confirms
While Traveling→Avoid Enemies and Fight Back were both equipped, alongside
Avoid Hazards and Recover First,28RP. Avoid Enemies is a starter response
in STARTER_RUNE_IDS; its condition is also starter-owned and the rule costs1RP.
No acquisition was missing.

Current Avoid Enemies implementation chooses a less exposed exit-edge target
among five candidates using unengaged enemies as soft costs. It retains the
node route and ordinary A* path; it does not guarantee avoidance along the
whole path or prevent an already-engaged enemy attacking. This is important
when interpreting an unavoidable-looking ranged encounter.

Authoritative death: Ash Salamander ranged93, one attacker. The retained
sequence includes78 absorbed,27HP+51absorbed,83HP,88HP,48HP, then the later
lethal93. Sweep, Second Wind and Brace did activate during transit. There is
no recorded lava DoT or escape/contact event, so this is not evidence of a
repeat lava recovery trap. Exact positioning and attack delivery remain
unobserved. The newly earned range point was deliberately unspent; assess
ordinary branch selection and the ranged matchup before calling the entry
optimally prepared or recommending a Volcano damage nerf. No new run launched.
