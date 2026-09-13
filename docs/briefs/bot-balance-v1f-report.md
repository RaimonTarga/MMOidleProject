# V1f — atomic entry validation and interrupted T1 coverage

Status: stopped after the Phase C worker-phase failure; artifacts preserved.
This is the durable operator ledger for
`bot-balance-v1f-operator-packet.md`. It is a candidate study only: no broad
balance acceptance claim follows from these runs.

## Session ledger

| Field | Value |
|---|---|
| Frozen revision | `3426063e55954c162c92aaa499903c356fa3b96d` |
| Frozen source tree | `cf19fc0280d86afe24da96652c35fe3a911f1760` |
| Session started | 2026-09-13T09:43:38.9165814+02:00 |
| Hard session deadline | 2026-09-13T13:13:38.9165814+02:00 |
| Planned worker ceiling | 2h36m across 13 runs |
| Operator checkout | `C:\Users\osaif\Documents\Claude\Projects\MMO idle` (dirty; not used as experiment source) |
| Exact clean validation checkout | `C:\Users\osaif\AppData\Local\mmo-idle\validation\v1f-integrated` |
| Preflight | PASS on the exact frozen revision; harness validation only, not balance evidence |
| Docker capacity | PASS: three empty local bridge probes coexisted; exact probes removed afterward |

## Input provenance

Every phase is required to use the unchanged Night 1 kit snapshot. No phase
chains output from another phase and no boss reward is imported.

| Input | Value |
|---|---|
| Snapshot | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1\runs\001-striker-campaign-night-kit-t1-intended-r01\artifacts\striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2\snapshot-b.json` |
| Snapshot SHA-256 | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| State | Earned-but-accelerated T1, GM30, root-only, no boss clears; original canonical/eligibility taints retained |

## Capacity probe

Docker server `29.5.2` was available. Three uniquely named empty bridge
networks coexisted and were then removed by exact name; no historical network
or container was pruned, disconnected, or removed.

| Probe | Network ID | Result |
|---|---|---|
| `mmo-v1f-capacity-mtzibkdseg1g-1` | `db5b3ee5c4f2cde5f64e4e565aa34ec648309ea149956b38db402efe39145315` | bridge, local, 0 containers; removed |
| `mmo-v1f-capacity-mtzibkdseg1g-2` | `530e412b55eb76684b8bb412ecb2700811dd73502d7dd14d9aedf2f5e3ff1e59` | bridge, local, 0 containers; removed |
| `mmo-v1f-capacity-mtzibkdseg1g-3` | `1c4ca5c735cf573de13507f20c1c903405bf65021c1cebbf34e7282fb1d78405` | bridge, local, 0 containers; removed |

## Phase ledger

| Phase | Planned cases | Required gate | Manifest | Disposition |
|---|---:|---|---|---|
| A — exact earned entry | 3 | All three strict entry/build checks pass; zero boss attempts | `20260913t074440z-striker-campaign-night-kit-t1` |
| B — Swamp comparison | 6 | Only after A passes; order expose, dual, dual, expose, expose, dual | `20260913t074946z-striker-campaign-night-swamp-t` — completed 6/6 valid (3 deaths, 3 victories) |
| C — remaining T1 coverage | 4 | Only after B ends without infrastructure/treatment failure | `20260913t082249z-striker-campaign-night-forest` — stopped after Cave worker-phase failure; 3 boss cases valid, Plains interrupted before boss |

The active manifest, terminal records, interrupted cases, and never-started
slots will be appended here. Terminal records and never-started slots may
overlap and will be reported explicitly. No automatic retry, winner selection,
threshold relaxation, extra attempt, or strategy change is permitted.

### Phase A manifest sealing and result

The returned manifest was checked against the packet before its one launch.
All three cases completed and passed the entry gate:

| Field | Value |
|---|---|
| Created | 2026-09-13T07:45:39.567Z (09:45:39.567+02:00) |
| Source revision/tree | `3426063e55954c162c92aaa499903c356fa3b96d` / `cf19fc0280d86afe24da96652c35fe3a911f1760` |
| Invocation source | clean detached `v1f-integrated`; dirty files excluded |
| Image | `mmo-idle-experiment:3426063e5595-165579c7`, `sha256:3c695c2556b03395e82d99ede34fb0e92862c025d12c26f4f0f2a40ff9d06606` |
| Image labels | revision `3426063e55954c162c92aaa499903c356fa3b96d`; build `d6561f96f128d307ca34dd62` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `afd6218d68e2cdbc7fee4e14a6490816faa534f492935799a18146bc75ba95c8` (record matches `experiment.json`) |
| Input hash | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` (copied input matches kit) |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 3 queued runs, `maxRunMs=120000`, reward multiplier `25`, full gauntlet |
| Copied-host atomic write | exact frozen source contains bounded `EPERM`/`EACCES`/`EBUSY` retry through attempt 20 |

| Run | Terminal reason | Readiness/build evidence | Final loadout and +5 armor | Boss attempts |
|---|---|---|---|---:|
| `001` `…a5130345` | `bot_completed` | `night:kit-build`, `night:kit-ready`; profile/spawn pass; 11/11 assertions | Plains Vest equipped; Plains Vest +5 and Mountain Vest +5 present | 0 |
| `002` `…3093c5d8` | `bot_completed` | `night:kit-build`, `night:kit-ready`; profile/spawn pass; 11/11 assertions | Plains Vest equipped; Plains Vest +5 and Mountain Vest +5 present | 0 |
| `003` `…5ddf8c7f` | `bot_completed` | `night:kit-build`, `night:kit-ready`; profile/spawn pass; 11/11 assertions | Plains Vest equipped; Plains Vest +5 and Mountain Vest +5 present | 0 |

Phase A result: `3/3` completed, isolated and treatment-valid; route steps
`14/14` in each case; no boss attempts or kills. Durations were 557 ms,
563 ms, and 555 ms. This qualifies the unchanged earned entry for the next
phase but is not balance evidence.

### Phase B manifest sealing

Created and validated before launch:

| Field | Value |
|---|---|
| Manifest | `20260913t074946z-striker-campaign-night-swamp-t` |
| Created | 2026-09-13T07:49:51.234Z (09:49:51.234+02:00) |
| Source revision/tree | `3426063e55954c162c92aaa499903c356fa3b96d` / `cf19fc0280d86afe24da96652c35fe3a911f1760` |
| Image | `sha256:3c695c2556b03395e82d99ede34fb0e92862c025d12c26f4f0f2a40ff9d06606` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `80fd3691d8f3a2afadebf925c02e6c146fa5c036e5592245c1ada47002f23751` (record matches `experiment.json`) |
| Study hash | `2f5f7e0e2e7f65baaae3724d1152cc6c7c710d61518951e960a9d1794866d81d` |
| Input hash | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 6 queued runs, `maxRunMs=900000`, reward multiplier `25`, full gauntlet |
| Declared order | `1 expose-cleanse, 2 dual-guard, 3 dual-guard, 4 expose-cleanse, 5 expose-cleanse, 6 dual-guard` |
| Arm routes | expose-cleanse → `striker-campaign-night-swamp-t1`; dual-guard → `striker-campaign-night-swamp-dual-guard-t1` |

### Phase B terminal cases

The supervisor completed all six predeclared slots in the sealed order. Every
case was isolated, treatment-valid, profile/spawn-valid, and reached its
`night:swamp:ready` or `night:swamp-dual:ready` marker with `19/19` route
steps. There were no infrastructure, supervisor, reset, or evidence failures.
The three `bot_partial` outcomes below are valid gameplay deaths and did not
trigger a stop or retry.

| Slot | Arm and run | Disposition | Guardians; boss attempt | Boss result and authoritative clear | Player HP samples during boss | Abilities; run-wide combat scope |
|---|---|---|---|---|---|---|
| 001 | Expose/Cleanse; `…594a74e0` | `bot_partial`; death | `6/6` in `58,540 ms`; attempt `200,142 ms`, boss combat `52,032 ms` | Terminal boss HP `22.4762%`; death by `Grave Toadeater` (`isBoss=true`, 9 damage, 3 stacks); no named boss kill; progression empty | Max HP `179`; last and lowest sampled `6.8599%` (`12.279`) at `202,576 ms` | Expose 8, Cleanse 9; removed swamp poison 3 and boss poison 6; `6` kills, player damage `2,645`, damage taken `861` (`76` direct/`785` dot), healed `646`; top incoming boss `492` |
| 002 | Dual-Guard; `…88cae63c` | `bot_completed`; victory | `6/6` in `58,534 ms`; attempt `206,116 ms`, boss combat `57,530 ms` | Terminal boss HP `0%`; named kill at `208,871 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `swamp:1` | Max HP `179`; last `40.4865%` (`72.471`) at `207,587 ms`; lowest sampled `25.9138%` (`46.386`) at `199,587 ms` | Cleanse 9, Second Wind 4; removed swamp poison 3 and boss poison 6; `7` kills, player damage `3,111`, damage taken `978` (`85` direct/`893` dot), healed `798`; top incoming boss `597` |
| 003 | Dual-Guard; `…bc6794a5` | `bot_completed`; victory | `6/6` in `58,040 ms`; attempt `214,661 ms`, boss combat `66,555 ms` | Terminal boss HP `0%`; named kill at `217,630 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `swamp:1` | Max HP `179`; last `46.3576%` (`82.980`) at `217,565 ms`; lowest sampled `39.7127%` (`71.086`) at `211,564 ms` | Cleanse 10, Second Wind 5; removed swamp poison 3 and boss poison 7; `7` kills, player damage `3,111`, damage taken `1,074` (`91` direct/`983` dot), healed `907`; top incoming boss `684` |
| 004 | Expose/Cleanse; `…7a353be2` | `bot_partial`; death | `6/6` in `57,025 ms`; attempt `196,113 ms`, boss combat `49,534 ms` | Terminal boss HP `13.0476%`; death by `Grave Toadeater` (`isBoss=true`, 12 damage, 4 stacks); no named boss kill; progression empty | Max HP `179`; last and lowest sampled `4.8528%` (`8.687`) at `197,598 ms` | Expose 8, Cleanse 8; removed swamp poison 3 and boss poison 5; `6` kills, player damage `2,877`, damage taken `834` (`80` direct/`754` dot), healed `621`; top incoming boss `459` |
| 005 | Expose/Cleanse; `…e7ff4f20` | `bot_partial`; death | `6/6` in `61,036 ms`; attempt `198,624 ms`, boss combat `47,526 ms` | Terminal boss HP `16.9524%`; death by `Grave Toadeater` (`isBoss=true`, 12 damage, 4 stacks); no named boss kill; progression empty | Max HP `179`; last and lowest sampled `15.2046%` (`27.216`) at `199,555 ms` | Expose 7, Cleanse 8; removed swamp poison 3 and boss poison 5; `6` kills, player damage `2,832`, damage taken `823` (`87` direct/`736` dot), healed `608`; top incoming boss `462` |
| 006 | Dual-Guard; `…a2fb4042` | `bot_completed`; victory | `6/6` in `57,537 ms`; attempt `233,160 ms`, boss combat `85,054 ms` | Terminal boss HP `0%`; named kill at `235,765 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `swamp:1` | Max HP `179`; last and lowest sampled `22.0878%` (`39.537`) at `235,565 ms` | Cleanse 12, Second Wind 7; removed swamp poison 3 and boss poison 9; `7` kills, player damage `3,111`, damage taken `1,196` (`95` direct/`1,101` dot), healed `1,001`; top incoming boss `903` |

The arm build checks observed the expected final `Mountain Vest +5` in every
case. Expose/Cleanse used `17/22` RP with Expose Weakness and Cleanse; the
Dual-Guard arm used `16/22` RP with Second Wind and Cleanse. Run-wide damage
and healing include guardians and boss; the artifacts do not provide a
boss-only healing/damage attribution, so none is inferred. The boss telemetry
had no barrier or summon samples, and all six cases recorded zero in-reach and
`1.0` out-of-reach fraction in the sampled range window. The event stream
emits terminal boss HP but no independent boss HP sample series; player last
and lowest sampled HP are therefore kept separate above.

| Arm | Planned | Started | Valid gameplay | Victories | Deaths | Invalid/interrupted/unstarted |
|---|---:|---:|---:|---:|---:|---:|
| Expose/Cleanse | 3 | 3 | 3 | 0 | 3 | 0 |
| Dual-Guard | 3 | 3 | 3 | 3 | 0 | 0 |

Among these six valid Swamp cases, the candidate success fractions are
`0/3` for Expose/Cleanse and `3/3` for Dual-Guard. This is a small, reward
multiplier `25` smoke-isolated comparison, not a balance ranking or tuning
decision. Night 1's separate valid cases remain historical and are not pooled
into these fractions. Phase B ended without a stop condition, so Phase C may
open.

### Phase C manifest sealing

The four-route coverage manifest was created only after Phase B completed
without an infrastructure or treatment failure. It was checked against the
packet before its one launch; the four routes remain independent cases using
the unchanged kit snapshot.

| Field | Value |
|---|---|
| Manifest | `20260913t082249z-striker-campaign-night-forest` |
| Created | 2026-09-13T08:22:55.038Z (10:22:55.038+02:00) |
| Source revision/tree | `3426063e55954c162c92aaa499903c356fa3b96d` / `cf19fc0280d86afe24da96652c35fe3a911f1760` |
| Invocation source | clean detached `v1f-integrated`; dirty files excluded |
| Image | `mmo-idle-experiment:3426063e5595-165579c7`, `sha256:3c695c2556b03395e82d99ede34fb0e92862c025d12c26f4f0f2a40ff9d06606` |
| Image labels | revision `3426063e55954c162c92aaa499903c356fa3b96d`; build `d6561f96f128d307ca34dd62` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `1491b464685f74eabc91f21f45a91f57c3d7a9bf0fd3dd888907be44e54a7430` (record matches `experiment.json`) |
| Input hash | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 4 queued routes, `maxRunMs=900000`, reward multiplier `25`, full gauntlet |
| Route order | Forest → Mountain → Cave → Plains, exact route IDs in the manifest |

### Phase C stop and terminal cases

The exact manifest was launched once. Forest and Mountain completed as valid
gameplay victories. Cave entered worker phase `failed` at
`2026-09-13T08:37:13.052Z`, while the server heartbeat remained healthy. The
preserved Cave summary is complete and treatment-valid, so this is classified
as a valid gameplay death, not infrastructure or lost evidence. The exact C
manifest was then stopped; its final state is supervisor `completed` with
`2 completed`, `1 failed` (`bot_partial`), and `1 cancelled`.

The CLI has no supported same-manifest resume operation. No terminal case was
retried and no replacement manifest was created. The supervisor had already
started the declared Plains slot before the stop completed: it reached
`night:plains:ready` with `20/20` steps and passed `215/215` profile/spawn
checks, but received SIGTERM before a boss attempt. Plains is therefore an
interrupted/aborted started slot, not an unstarted slot; C has zero unstarted
slots but one slot without boss coverage.

| Slot | Route/run | Disposition | Guardians; boss attempt | Boss result and authoritative clear | Player HP samples during boss | Abilities; run-wide combat scope |
|---|---|---|---|---|---|---|
| 001 | Forest; `…7b313f0e` | `bot_completed`; victory | `9/9` in `48,022 ms`; attempt `206,636 ms`, boss combat `38,027 ms` | Terminal boss HP `0%`; named `Forest Sentinel` kill at `161,076 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `forest:1` | Max HP `179`; last `23.3293%` (`41.759`) at `207,583 ms`; lowest sampled `22.7897%` (`40.793`) at `205,583 ms` | Expose Weakness 7, Second Wind 2; `11` kills, player damage `3,385`, damage taken `608` (direct), healed `498`; top incoming boss `76` |
| 002 | Mountain; `…a5564ce5` | `bot_completed`; victory | `4/4` in `90,563 ms`; attempt `295,716 ms`, boss combat `83,062 ms` | Terminal boss HP `0%`; named `Stone Warden` kill at `205,450 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `mountain:1` | Max HP `179`; last `100%` (`179`) at `297,612 ms`; lowest sampled `67.2206%` (`120.325`) at `256,603 ms` | Expose Weakness 11, Second Wind 2; `5` kills, player damage `3,333`, damage taken `1,082` (direct), healed `977`; top incoming boss `408` |
| 003 | Cave; `…5ddbb73b` | `bot_partial`; valid gameplay death | `3/3` in `67,543 ms`; attempt `218,649 ms`, boss combat `31,524 ms` | Terminal boss HP `30.6286%`; death by `Obsidian Broodmother` (`isBoss=true`, 45 damage); no named boss kill; progression empty | Max HP `179`; last and lowest sampled `5.7121%` (`10.225`) at `220,565 ms` | Expose Weakness 6, Second Wind 6; `5` kills, player damage `2,575`, damage taken `1,042` (direct), healed `789`; top incoming boss `504` |
| 004 | Plains; `…a91a3564` | Cancelled by operator stop; `worker_received_sigterm`; aborted before boss | No boss attempt; entry-only artifact | `night:plains:ready`, `20/20` steps; no boss clear, boss kill, or death | No boss HP sample series | No ability activations; `0` kills, player damage `0`, damage taken `0`, healed `0` |

All three C boss cases were isolated, treatment-valid, and passed profile/spawn
validation with `215` checks and zero failures. Their final armor was Plains
Vest for Forest and Mountain Vest for Mountain/Cave; each observed `20/22`
RP. Run-wide combat totals include pre-boss guardians and the boss; the
artifacts do not provide a boss-only healing/damage attribution. Boss
telemetry recorded no barrier or summon samples, zero in-reach fraction, and
`1.0` out-of-reach fraction in the sampled range window:

| Boss case | Range samples; mean/max distance | Adds mean/max |
|---|---|---|
| Forest | `58`; `52.69` / `61` | `3.25` / `9` |
| Mountain | `52`; `52.73` / `64.03` | `1.57` / `4` |
| Cave | `48`; `51.20` / `60.17` | `1.42` / `3` |

The C boss-only valid success fraction is `2/3` (Forest and Mountain
victories; Cave gameplay death). This is partial coverage after the required
stop, not a balance ranking or a tuning decision. The Plains artifact and all
terminal state files remain preserved under the C artifact root.

## Evidence contract

For every started boss case, record readiness, deaths, guardians, attempt
duration versus boss duration, player and boss HP, authoritative boss-clear
progression, ability activations, and damage/healing with their measurement
scope. Keep last HP separate from lowest sampled HP. Preserve the raw kill
stream's hardcoded false boss flag; named boss kill, attempt victory, and
progression are the corroborating signals. Do not invent missing buff, source,
phase, or healing attribution.

Night 1's two valid Swamp cases remain historical and are not pooled into V1f
success fractions. Valid gameplay losses/timeouts permit the remaining
predeclared cases; invalid entry/build, missing reset acknowledgement,
isolation failure, supervisor failure, or lost evidence stops the active
manifest and the program.

## Durable artifact pointers

| Artifact | Path |
|---|---|
| Phase A root | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t074440z-striker-campaign-night-kit-t1` |
| Phase B root | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t074946z-striker-campaign-night-swamp-t` |
| Phase C root | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t082249z-striker-campaign-night-forest` |
| Phase C summary | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t082249z-striker-campaign-night-forest\cohort-summary.json` |
| Unchanged kit input | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1\runs\001-striker-campaign-night-kit-t1-intended-r01\artifacts\striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2\snapshot-b.json` |
