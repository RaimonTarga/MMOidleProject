# Night 2 packet C operator report

Executed the single frozen C case from the dispatched immutable checkout. The
case reached all three T2 bridge seals, earned natural T3, applied the 28 RP
travel build, and entered T3 Volcanic travel. It stopped at the first death
before T3 Sanctuary and was not retried.

## Frozen provenance and execution

- Manifest: `20260913t225153z-spirit-travel-t2-bridge-night2`
- Revision/tree: `ac14e2702f6f521cdc2658bbb2336cb5572bb713` /
  `bf8c31c6e9017868e475223faef22891990a7d81`
- Mode/config: `smoke-isolated`, reward multiplier 25, one worker, one case,
  `maxRunMs=2700000`, automatic retries 0, fast boss retry false.
- Original Spirit input: `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`
- Image: `sha256:f32813926d3003effb0987bfd60482220503cc8fba045bdd69968e3f4336c782`
- Image tooling/runtime hashes: `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` /
  `eb51708fcfeebcd2cc7ce1cce2d5e0edcd5b5d4017cacfd5c49086a1bd1200e6`
- Exact C setup-start clock was not preserved correctly in the initial report
  (it reused B's clock). Manifest state was created at22:52:33.026Z;
  worker started `2026-09-13T22:53:00.276Z`, ended `2026-09-13T23:11:05.607Z`.
  These worker clocks include startup; gameplay telemetry starts22:53:07.533Z.
- Clean exact checkout install and `pnpm bot:preflight` passed before creation.

Durable hashes:

| Artifact | SHA-256 |
|---|---|
| `experiment.json` | `8dc2454049b4b7cb91b8606ae0d5895f3e4beec95af44c3288bb52b459a467fe` |
| `experiment.sha256` | `3f6f9383690cfc5de632ccfd88e75c4d6a567949f59cbd57ec56ffb920a83a20` |
| `cohort-summary.json` | `cd2d49932aed0353b327fb41b20753aabcd6f3b4e5ae802482f7f83460372e96` |
| `network-release.json` | `18abcda9a75f381c3c992727d2feb4fb444f7564e9df5fe714d6f7fa4c744752` |
| run `summary.json` | `bed5aab9995ca2e0f60c2e265ec7e0ccb811dbe89071b6cd9bec6339207315f7` |
| run `events.jsonl` | `397af026b50da9457434df26ae147c6ba70d6f3b35e0b0b7d103fcf455f45c88` |
| run `deaths.jsonl` | `309634a15ee06ae889818182e4e2b0234d2fdd5ee95d652a178486c7d3929962` |
| run `snapshot-index.json` | `4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d` |

## Progression and treatment

The run completed the Plains, Forest, and Desert T2 boss windows with victory,
then recorded `night2:travel:ready` at 1,016,363 ms in the cleared T2 Desert
dungeon. Full attempts (including entry/guardians) lasted Plains220180ms,
Forest199135ms, Desert288700ms. Boss-only windows were185257–225788ms
(40.531s),542021–567536ms (25.515s),969336–1010852ms (41.516s).

The post-third-seal build verified Sweep, Second Wind, and Brace, defensive
stance, common ranged-orbit rules, and While Traveling -> Avoid Enemies plus
While Traveling -> Fight Back. The observed budget was 28 RP (17 abilities, 1
stance, 10 logic), with no range selection and the earned range point unspent.
Recovery in the cleared Desert dungeon completed in 2,002 ms before the travel
ready milestone. The run reached natural player tier 3, global mastery 76,
at run end, and bosses `plains:2`, `forest:2`, `desert:2` in addition to the original T1
clears. No final snapshot was exported because the run aborted on first death.

Transit entered `node-t3-volcanic-05` (Fortified) at 1,025,717 ms while
traveling toward T3 Sanctuary. Fight Back did engage ordinary combat: Sweep
activated at 1,053,648 and 1,059,651 ms; Second Wind at 1,064,053 and
1,076,056 ms; Brace at 1,064,253 and 1,074,255 ms. One Ember Scuttler was
killed at 1,065,454 ms. The maximum concurrent attacker count was 3.

The authoritative first-death cause was a14-damage, four-stack environmental
DoT at1078004ms in `node-t3-volcanic-05`. The raw killer name Tiny Wisp is a
source-attribution fallback, not a Tiny Wisp monster encounter: nodeFeatures.ts
uses `tiny-slime` when a normal node has no boss type. The latest recorded
damage was at 1,077,056 ms with HP moving from 23.066 to 9.066. The largest
direct hit was 36 from Ember Scuttler at 1,064,053 ms. The death window's
dominant source was Environment, 210 damage. Concurrent snapshots and
unchanged-HP absorb/heal records are reported as observations only and are not
summed as extra damage or effective healing.

## Release and evidence limits

The supervisor terminal state was `failed` with reason `declared first-death
stop`; the treatment itself is marked valid, while combat/economy evidence is
ineligible; synthetic prepared entry and reward25 provenance remain. The network
release receipt reports `released`, and `docker network inspect
mmoexp-a2388cf7987f-network` returned `network ... not found` after release.
Artifacts, volumes and two service containers were retained; their experiment
network was released at23:11:18.649Z. No source files or gameplay templates were changed,
and no downstream case was started.

## Astra interpretation

All eight listed hashes independently verified; the initial table had three
run filenames mismatched to hashes, corrected above without changing artifacts.
Build readiness was GM72; the one reward25 Ember Scuttler kill advanced Volcano
to level4 and GM76. Do not treat that accelerated unlock as normal economy.

Node residence before death was52.287seconds, versus8.704seconds in B. The
travel package visibly restored ability firing and killed one attacker, but
these one-case different exposures do not estimate a survival improvement.
The retained death window has repeated14-damage environmental ticks; zero
attackers are reported for the final sequence. Its last pre-death sample at
1077056ms is not the lethal hit at1078004ms.

Source diagnosis: normal Volcano uses positional `lava-burn` (5 damage/stack,
four stacks,1s tick,40px contact band). Ambient Heat is a separate ramp, not
this DoT. Recovery is suppressed while standing in damaging node features.
Recover First holds travel/target movement below full HP. The existing
`steerOutOfPersistentHazards` escape response covers runtime ground pools,
not authored static lava features. This is a concrete coverage gap consistent
with the observed environmental death; exact character positions/active intent
are absent from these bot artifacts, so the precise trajectory remains unproven.
Do not nerf mob attack to compensate or claim Cleanse fixes positional exposure.
The next diagnostic should reproduce static-lava escape with Recover First,
then compare an ordinary travel build without that recovery hold. A shared
player-movement fix requires a separately reviewed scope; none was applied.

Artifact root:
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t225153z-spirit-travel-t2-bridge-night2`

Run artifact directory:
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t225153z-spirit-travel-t2-bridge-night2\runs\001-spirit-travel-t2-bridge-night2-intended-r01\artifacts\spirit-travel-t2-bridge-night2-intended-2026-09-13T22-53-07-523Z-05006d29`
