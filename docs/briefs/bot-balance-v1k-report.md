# V1k — Swamp armor, Cave and Desert operator report

Status: complete. The V1k packet ran all eight planned slots exactly once across
three sequential one-worker manifests. The run ledger contains four Swamp
armor cases, two Cave cases and two Desert cases. All eight cases reached a
valid prepared build and ready marker. The observed outcomes are descriptive
only: Swamp produced four boss defeats, Cave produced two ordinary boss losses,
and Desert produced two boss defeats with safe post-clear tails.

The V1k contract does not permit ranking an arm, proposing a balance change or
starting downstream work. No gameplay source or balance files were changed for
this delivery. Existing unrelated working-tree changes were preserved.

## Session ledger

| Field | Value |
|---|---|
| Session clock recorded before setup | 2026-09-13T21:40:44.8416383+02:00 |
| Hard session deadline | 2026-09-14T01:40:44.8416383+02:00 |
| Frozen gameplay revision | `a419a7ff89728fcfdc4e98ebbe0e46709d7b9819` |
| Frozen source tree | `0f54eef3de4d43de1425184dbbce328238a55182` |
| Operator checkout | `C:/Users/osaif/Documents/Claude/Projects/MMO idle`, branch `develop` |
| Contract | Three sequential manifests, one worker, one active manifest |
| Planned / created / started / terminal | 8 / 8 / 8 / 8 |
| Worker ceilings | A: 25 minutes per case; B/C: 20 minutes per case; 3 hours total |
| Validation checkout | `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1k-integrated` |
| Validation state | Clean detached checkout at the exact frozen revision/tree; offline install, `pnpm typecheck` and `pnpm bot:preflight` passed |
| Create/launch source | Current operator checkout; `invocationDirty=true`; dirty working-tree contents excluded from images |
| Retry/extension disposition | No retries, extensions, fast boss retries or follow-on runs |
| Deadline disposition | All manifests completed and released before the hard deadline |

The validation checkout materialized its dependencies with
`pnpm install --offline --frozen-lockfile`. `pnpm bot:preflight` passed the
build, tier-entry, profile/spawn, loadout, choice, route, behavior, boss,
post-clear, snapshot, study, release and experiment harness suites. This report
does not claim a separate full repository test-suite run.

## Capacity probes and infrastructure handling

Before each create, a uniquely named empty bridge-network probe was created,
inspected by exact network ID, checked against `docker ps -a`, and removed by
that exact ID. Every probe was empty and passed.

| Probe | Network ID | Verification | Disposition |
|---|---|---|---|
| `mmo-v1k-capacity-20260913-214044-a` | `84701cd1e404e3e85a45638d1481340dc459b8cbf9aaf12ac9c93f0385ffaf59` | `Containers` empty; no attached containers in `docker ps -a` | removed exact ID |
| `mmo-v1k-capacity-20260913-220405-b` | `75b0aa590417de1ea9c2e922dcd4ede86a1465e6079f37acb145ada6fa3f9498` | `Containers` empty; no attached containers in `docker ps -a` | removed exact ID |
| `mmo-v1k-capacity-20260913-221315-c` | `1dc6ec722e9630d02c03c60361a0c538b922ef436806df39c102b0f78ce245ca` | `Containers` empty; no attached containers in `docker ps -a` | removed exact ID |

No global Docker prune, `experiment:clean`, historical network deletion,
container deletion, database reset, Redis reset or resume operation was used.
Each experiment supervisor completed, emitted its terminal infrastructure
release event, released its owned network and retained two data containers as
specified by the lifecycle contract.

## Frozen input and runtime provenance

Every case imported the same original V1h Spirit Snapshot B. No V1i, V1j or
V1k output was used as an input.

| Input | Value |
|---|---|
| Assessment read | `C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1j-assessment.md` |
| Spirit Snapshot B | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json` |
| Spirit Snapshot B SHA-256 | `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6` |
| V1k study | `C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1k-swamp-study.json` |
| V1k study SHA-256 | `c03c12287adb7eefc520a5e72c4fc36848fb242be03092dbb481f38f4c005097` |
| Prepared origin | Tier 2, GM72, Energy Heavy, strict prepared-T2 handoff, synthetic accelerated origin |

All manifests used the same verified immutable image and runtime:

| Field | Value |
|---|---|
| Image tag | `mmo-idle-experiment:a419a7ff8972-d90e6996` |
| Image digest | `sha256:1b8a4faee70ae80147022464bc1580edc74e93107420d94fd31466a71d7415b8` |
| Build ID | `ee57cd0b144df88aab75a137` |
| Tooling hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` |
| Runtime hash | `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f` |
| Copied `lib.mjs` SHA-256 | `18592507586967404e9c236d97bde0089765ed5589aa278996613fd9c0ec6b99`; equal to `scripts/experiment/lib.mjs` |
| Copied `release.mjs` SHA-256 | `f3247d6714b7d67dae8f31ee88626eea9a1c809d8ae4eb5b825ab14e060361c6`; equal to host release runtime |
| Copied `study.mjs` SHA-256 | `cf2946010a02c2a69e5b1869843c88e4c6b6edaffb5424b256824fc1254a7360` |
| Evidence taints | `SYNTHETIC_TIER_ENTRY`, `NON_CANONICAL_REWARD_MULTIPLIER` |
| Combat/economy eligibility | `false` for every run |

The synthetic prepared entry and 25x smoke reward multiplier are retained as
taints. The artifacts are harness and gameplay-observation evidence, not
canonical economy evidence.

## Manifest and release ledger

| Phase | Experiment ID | Created | Manifest SHA-256 | Configuration | Cohort summary SHA-256 |
|---|---|---|---|---|---|
| A | `20260913t194118z-spirit-campaign-swamp-cave-ves` | `2026-09-13T19:43:33.049Z` | `33ed2958621da43d992829b0f63d784b344e9cfb5cbfa94aff6e9cccc79ffe4e` | smoke-isolated; 1 worker; count 2 per arm; maxRunMs 1,500,000; reward 25; retries 0; fastBossRetry false | `c4eefa0a09ef2193481ee274160b10fdce31a9dfa32edc363cb6c80f8063bce1` |
| B | `20260913t200442z-spirit-campaign-cave-cave-vest` | `2026-09-13T20:04:51.067Z` | `75d1232bb41489ac19d20649795c23f5571a0d9e56cdde6b503fd1170a261008` | smoke-isolated; 1 worker; count 2; maxRunMs 1,200,000; reward 25; retries 0; fastBossRetry false | `ce56d859c3c631e267c06d6c1fb1179cc2fbf646b8d41cb556b5d8db5fd94381` |
| C | `20260913t201359z-spirit-campaign-desert-cave-ve` | `2026-09-13T20:14:08.366Z` | `4799321a28fbbc2ee3acba35d8886c1793efb293643ba7083d9ad89ddf22fd79` | smoke-isolated; 1 worker; count 2; maxRunMs 1,200,000; reward 25; retries 0; fastBossRetry false | `3dd47e6e49b5256e474534dd2e1f1662c0923f5740f62bf82435833fa5505604` |

| Phase | Routes / arm order | Release receipt SHA-256 | Receipt and event evidence |
|---|---|---|---|
| A | `spirit-campaign-swamp-cave-vest-t2-v1k`; `spirit-campaign-swamp-swamp-vest-t2-v1k`; order cave, swamp, swamp, cave | `9adf72849f8bdeb16d574c8b5bb008047fcf305e7c06a6360f9251e88bab48a2` | `network-release.json`: `released` at `2026-09-13T20:03:09.982Z`; network `mmoexp-70fce9a4cdbe-network`, ID `761b8cb1be41606c355c6354d2bf4f2834a1181fdf08d6a91e5704277020c664`; supervisor emitted `infrastructure-release` at `2026-09-13T20:03:12.509Z`, 2 containers retained |
| B | `spirit-campaign-cave-cave-vest-t2-v1k` | `dde89a476c2f7a99ea7b97d557923b19d52f08f88aadfb3c9a858b35ae5ee7cf` | `network-release.json`: `released` at `2026-09-13T20:13:10.454Z`; network `mmoexp-ca4844e9818b-network`, ID `377bcaea869f039899a30693a5f341112171cad109224eb1694db26fd8175e63`; supervisor emitted `infrastructure-release` at `2026-09-13T20:13:13.197Z`, 2 containers retained |
| C | `spirit-campaign-desert-cave-vest-t2-v1k` | `13bf0c77875eb9a691864890c0454a74f2e5e3ab7af06cd743b6513bdb77a906` | `network-release.json`: `released` at `2026-09-13T20:25:09.538Z`; network `mmoexp-d096eea45b90-network`, ID `ac1e3ff70ddd822ac51722d4b89353322239887301c5c4d03ac6e4af8950df8d`; supervisor emitted `infrastructure-release` at `2026-09-13T20:25:12.518Z`, 2 containers retained |

The three owned experiment networks were absent after their releases. No
supervisor or health exception stopped the session.

## Final build and readiness verification

All eight runs passed the treatment assertions, profile/spawn checks and final
build reconciliation before their marker. The exact prepared packages were:

| Phase / arm | Final build |
|---|---|
| A / cave armor | Ruinous Axe +5; Cave Vest +5; Bog Eye (`swamp-charm-t2`) +5; Plains Boots +5; Tempered Core; no relic; Expose Weakness; Second Wind and Cleanse; defensive stance; 26/30 RP |
| A / swamp armor | Ruinous Axe +5; Bog Wrappings +5; Bog Eye (`swamp-charm-t2`) +5; Plains Boots +5; Tempered Core; no relic; Expose Weakness; Second Wind and Cleanse; defensive stance; 26/30 RP |
| B / Cave | Ruinous Axe +5; Cave Vest +5; Mountain Charm (`mountain-charm-t2`) +5; Plains Boots +5; Tempered Core; no relic; no technique; Second Wind, Cleanse and Brace; defensive stance; 24/30 RP |
| C / Desert | Ruinous Axe +5; Cave Vest +5; Mountain Charm (`mountain-charm-t2`) +5; Plains Boots +5; Tempered Core; no relic; Expose Weakness; Second Wind and Cleanse; Brace learned but not attuned; defensive stance; 26/30 RP |

The authored movement rules were held constant: auto-path to the enemy,
step back inside a telegraph, keep distance/orbit in combat, avoid hazards and
recover first/wait for regeneration. The ready markers were exact and were not
treated as boss-entry snapshots.

## Run disposition ledger

| Phase / arm | Run key | Status / treatment validity | Ready marker | Boss result | Post-clear result | Route | Run duration |
|---|---|---|---|---|---|---:|---:|
| A / Cave Vest | `001-cave-armor-r1` | `failed` / valid | `v1k:spirit:swamp:cave-vest-t2:ready` | Boss attempt victory; Mire-Gorged Behemoth named kill; `swamp:2` | No safe tail: one post-kill DoT death; observation stalled | 50/51 | 284,929 ms |
| A / Bog Wrappings | `002-swamp-armor-r1` | `completed bot_completed` / valid | `v1k:spirit:swamp:swamp-vest-t2:ready` | Boss attempt victory; Mire-Gorged Behemoth named kill; `swamp:2` | Safe: 20-second tail completed with zero deaths | 51/51 | 237,912 ms |
| A / Bog Wrappings | `003-swamp-armor-r2` | `completed bot_completed` / valid | `v1k:spirit:swamp:swamp-vest-t2:ready` | Boss attempt victory; Mire-Gorged Behemoth named kill; `swamp:2` | Safe: 20-second tail completed with zero deaths | 51/51 | 251,384 ms |
| A / Cave Vest | `004-cave-armor-r2` | `completed bot_completed` / valid | `v1k:spirit:swamp:cave-vest-t2:ready` | Boss attempt victory; Mire-Gorged Behemoth named kill; `swamp:2` | Safe: 20-second tail completed with zero deaths | 51/51 | 225,350 ms |
| B / Cave | `001-spirit-campaign-cave-cave-vest-t2-v1k-intended-r01` | `failed bot_partial` / valid | `v1k:spirit:cave:cave-vest-t2:ready` | Ordinary boss loss; HP fraction 0.1643428571; no `cave:2` | Skipped after loss: prerequisite `bossCleared:cave:2` was permanently false | 45/45 | 221,860 ms |
| B / Cave | `002-spirit-campaign-cave-cave-vest-t2-v1k-intended-r02` | `failed bot_partial` / valid | `v1k:spirit:cave:cave-vest-t2:ready` | Ordinary boss loss; HP fraction 0.6825142857; no `cave:2` | Skipped after loss: prerequisite `bossCleared:cave:2` was permanently false | 45/45 | 200,817 ms |
| C / Desert | `001-spirit-campaign-desert-cave-vest-t2-v1k-intended-r01` | `completed bot_completed` / valid | `v1k:spirit:desert:cave-vest-t2:ready` | Boss attempt victory; Dune-Stalker Emperor named kill; `desert:2` | Safe: 20-second tail completed with zero deaths | 45/45 | 297,931 ms |
| C / Desert | `002-spirit-campaign-desert-cave-vest-t2-v1k-intended-r02` | `completed bot_completed` / valid | `v1k:spirit:desert:cave-vest-t2:ready` | Boss attempt victory; Dune-Stalker Emperor named kill; `desert:2` | Safe: 20-second tail completed with zero deaths | 45/45 | 290,597 ms |

The A1 terminal reason was `timed out waiting for swamp T2 boss cleared`, but
its durable events contain the named kill, a victorious boss-attempt outcome
and `swamp:2`. The post-kill death and stalled tail are retained; A1 is not
relabelled as a boss loss. Conversely, the two Cave deaths are ordinary
gameplay losses, not infrastructure failures, and their dependent tails were
correctly skipped.

## Preparation, guardian, boss and tail clocks

Times below are event-relative milliseconds from each run start. “Prep” is the
ready-marker time, “attempt” is the boss-attempt step, and “combat” is the
boss-combat window. The separate run duration is in the disposition ledger.

| Run | Prep to ready | Guardian phase | Boss attempt | Boss combat | Named kill / death | Post-clear tail |
|---|---:|---|---|---|---|---|
| A1 Cave Vest | 52,207 ms | 134,784–183,833 / 49,049 ms; 6 to 0 | 52,208–224,872 / 172,664 ms | 192,841–224,372 / 31,531 ms | kill 224,173; post-kill DoT death 224,741 | 224,873–284,928 / 60,056 ms; stalled at 284,929 |
| A2 Bog Wrappings | 54,199 ms | 126,781–176,838 / 50,057 ms; 6 to 0 | 54,200–216,883 / 162,683 ms | 185,849–216,382 / 30,533 ms | kill 216,179 | 216,883–237,906 / 21,023 ms; complete |
| A3 Bog Wrappings | 52,680 ms | 134,258–190,299 / 56,041 ms; 6 to 0 | 52,680–230,347 / 177,667 ms | 199,309–229,845 / 30,536 ms | kill 229,647 | 230,347–251,377 / 21,030 ms; complete |
| A4 Cave Vest | 52,181 ms | 124,247–169,286 / 45,039 ms; 6 to 0 | 52,182–204,319 / 152,137 ms | 177,798–203,818 / 26,020 ms | kill 203,684 | 204,319–225,342 / 21,023 ms; complete |
| B1 Cave | 9,155 ms | 105,753–163,306 / 57,553 ms; 3 guardians | 9,157–221,860 / 212,703 ms | 175,322–221,859 / 46,537 ms | death 221,836; melee; no kill | skipped at 221,860 after boss loss |
| B2 Cave | 9,126 ms | 107,225–169,281 / 62,056 ms; 3 guardians | 9,127–200,816 / 191,688 ms | 180,796–200,815 / 20,019 ms | death 200,451; melee; no kill | skipped at 200,817 after boss loss |
| C1 Desert | 9,125 ms | 163,775–221,829 / 58,054 ms; 3 guardians | 9,126–276,880 / 267,754 ms | 234,846–276,379 / 41,533 ms | kill 275,931 | 276,881–297,910 / 21,029 ms; complete |
| C2 Desert | 9,127 ms | 167,852–214,450 / 46,598 ms; 3 guardians | 9,128–269,536 / 260,408 ms | 226,969–269,035 / 42,066 ms | kill 268,959 | 269,537–290,573 / 21,036 ms; complete |

The tail is measured from the recorded boss-attempt close, not assumed to be
exactly 20,000 ms. A named kill before attempt close is the contract’s boss
defeat evidence; a tail death remains a post-clear safety failure.

## Phase A — Swamp armor comparison

Both Cave Vest cases and both Bog Wrappings cases reached the same Swamp
prepared route and were treatment-valid. Boss defeat was 2/2 in each arm. Safe
post-clear survival was 1/2 for Cave Vest and 2/2 for Bog Wrappings: A1’s only
death occurred after the named boss kill and was DoT-caused while the tail
stalled. This is a small descriptive contrast, not an arm ranking or a balance
decision.

The following measurements are run-wide totals, including preparation and
guardian phases; they are not boss-window-only mitigation measurements.

| Run | Damage taken / absorbed / healed / HP lost | Incoming direct / DoT | Cleanse removals | Boss diagnostics: samples; range mean/max; in/out; adds mean/max; barrier mean/recharge/depleted |
|---|---|---|---|---|
| A1 Cave Vest | 565.62 / 426.38 / 735.38 / 329.10 | 165.62 / 400.00 | Stalker venom 2; antiheal 1; Mire-Gorged venom 5 | 90; 100.38 / 193.75; 0.34 / 0.20; 1.97 / 6; 0.59 / 0.06 / 0.29 |
| A2 Bog Wrappings | 434.49 / 252.88 / 708.00 / 185.72 | 99.36 / 335.13 | Stalker venom 4; antiheal 1; Mire-Gorged venom 7 | 90; 100.52 / 187.11; 0.32 / 0.26; 2.08 / 6; 0.62 / 0.06 / 0.27 |
| A3 Bog Wrappings | 499.36 / 329.00 / 822.00 / 247.35 | 99.36 / 400.00 | antiheal 2; Mire-Gorged venom 7 | 96; 96.23 / 184.17; 0.30 / 0.21; 2.30 / 6; 0.63 / 0.07 / 0.20 |
| A4 Cave Vest | 408.38 / 315.62 / 682.00 / 163.93 | 56.00 / 352.38 | antiheal 2; Mire-Gorged venom 5 | 80; 112.16 / 189.62; 0.33 / 0.35; 2.51 / 6; 0.74 / 0.04 / 0.18 |

The two safe Bog Wrappings tails ended at runtime HP 237/237 and barrier
71/71, with zero incoming DoT and no pending heal in their Snapshot B states.
The safe Cave Vest tail ended at runtime HP 231/231 and barrier 69/69. A1 has
no Snapshot B because the observation stalled after its post-kill death.

## Phase B — Cave coverage

Both Cave cases were prepared and treatment-valid, but neither defeated the
boss. B1 ended at boss HP fraction `0.1643428571`; B2 ended at
`0.6825142857`. The durable death records were ordinary Chitinous Dreadbore
melee losses. Neither case emitted a Cave progression completion, and both
tails were skipped by the explicit `bossCleared:cave:2` prerequisite.

The boss telegraph evidence was:

| Run | Slam telegraphs | Step Back | Lethal evidence |
|---|---|---|---|
| B1 | 5; every recorded outcome `failure`; damages 12, 15, 12, 12, 98.7855 | 8 attempts; 3 successes; 5 failures; failure damage received 149.79 | Final failure at 218,237 ms; direct killing blow 98.7855; death at 221,836 ms |
| B2 | 2; every recorded outcome `failure`; damages 25.72825, 102.2355 | 5 attempts; 3 successes; 2 failures; failure damage received 127.96 | Final failure at 196,642 ms; direct killing blow 102.2355; death at 200,451 ms |

The T2 Cave effect was emitted as `plating-shred` in these artifacts and was
removed by Cleanse (six total removals in B1 and three in B2); slow was also
removed. No separate `corrosion`, `eruption`, `burrow`, `untargetable` or
`exposed` telemetry fields were emitted by these runs, so those states are
unobserved here rather than inferred from the loss.

Run-wide B mechanics totals, not boss-window-only values:

| Run | Damage taken / absorbed / healed / HP lost | Incoming direct / DoT | Cleanse removals | Diagnostics: samples; range mean/max; in/out; adds mean/max; barrier mean/recharge/depleted |
|---|---|---|---|---|
| B1 | 325.79 / 766.21 / 768.21 / 228.76 | 325.79 / 0 | slow 4; plating-shred 6 | 116; 137.78 / 186.08; 0.38 / 0.54; 1.03 / 3; 0.74 / 0.11 / 0.21 |
| B2 | 307.96 / 275.04 / 343.04 / 201.71 | 307.96 / 0 | slow 3; plating-shred 3 | 94; 122.73 / 191.47; 0.72 / 0.26; 1.38 / 3; 0.83 / 0.05 / 0.12 |

## Phase C — Desert coverage

Both Desert cases were prepared and treatment-valid. Each emitted a Dune-
Stalker Emperor named kill, a victorious boss attempt and `desert:2`, then
completed the bounded tail with zero deaths. Cleanse removed slow and sun-mark
instances. Step Back had five activations/attempts in each case, all recorded
as discarded with zero damage received. The artifacts do not support a claim
that sun-mark removal cancels Desert Execution; no separate execution
telemetry was emitted.

| Run | Damage taken / absorbed / healed / HP lost | Incoming direct / DoT | Cleanse removals | Diagnostics: samples; range mean/max; in/out; adds mean/max; barrier mean/recharge/depleted |
|---|---|---|---|---|
| C1 | 131.38 / 905.62 / 1,052.62 / 124.17 | 131.38 / 0 | slow 5; sun-mark 2 | 113; 131.63 / 195.01; 0.48 / 0.49; 1.07 / 3; 0.73 / 0.17 / 0.05 |
| C2 | 189.35 / 924.65 / 1,117.65 / 182.12 | 189.35 / 0 | slow 4; sun-mark 2 | 101; 142.63 / 197.22; 0.41 / 0.57; 0.99 / 3; 0.76 / 0.15 / 0.06 |

The terminal Snapshot B states after the safe tails were HP 231/231 and
barrier 129/129 in both Desert cases, with zero incoming DoT, zero pending
heal and `isDead=false`.

## Artifact hash ledger

All paths below are under the released experiment roots. `summary.json`,
`events.jsonl` and `deaths.jsonl` are retained for every slot. Snapshot B is
present only when the run captured it; the two Cave losses and A1’s stalled
observation have no Snapshot B artifact.

| Run key | Artifact directory | Summary SHA-256 | Events SHA-256 | Deaths SHA-256 | Snapshot B SHA-256 |
|---|---|---|---|---|---|
| `001-cave-armor-r1` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t194118z-spirit-campaign-swamp-cave-ves/runs/001-cave-armor-r1/artifacts/spirit-campaign-swamp-cave-vest-t2-v1k-intended-2026-09-13T19-45-19-926Z-0781661f` | `8e268557f969782b4ef7d8ec67e94dafdecfab1ec912b89f22d14587d0d045c9` | `5a58e90713dd94d8ce2d4d6de8676c09e12539f20ce6c48b74d9b1954a266fd5` | `7d1228a793858a2449e8f304361ba62b7b7fc7e6760cbb539abf23dc2f974fb9` | — |
| `002-swamp-armor-r1` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t194118z-spirit-campaign-swamp-cave-ves/runs/002-swamp-armor-r1/artifacts/spirit-campaign-swamp-swamp-vest-t2-v1k-intended-2026-09-13T19-50-24-584Z-dacec7af` | `64113b5dac68270056cf3d4a5e20c4193354ba9db56d2ecb7dba6a07d402dd8b` | `c28ec689aaf7bb5d16a12126a1c187bbdff829050469a569b77a8a2887cd2d2a` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `323fb6ffb455a69bd38e9388f7bd01eb49986309d404692c7c814b699b3c7c38` |
| `003-swamp-armor-r2` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t194118z-spirit-campaign-swamp-cave-ves/runs/003-swamp-armor-r2/artifacts/spirit-campaign-swamp-swamp-vest-t2-v1k-intended-2026-09-13T19-54-41-613Z-245dc60a` | `2a649f40855ca9051de4bf736aaac731cbd2ffea080bfa514483307c8b58d85b` | `62219cdc47e5525d97a1cf3b0f609c950b116960e92ec0a6ebc50d214c73c57e` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `19cf2bd2f80033b001619efc6ef2d9b995ad44f061f82cd5ccd626c8a562acdd` |
| `004-cave-armor-r2` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t194118z-spirit-campaign-swamp-cave-ves/runs/004-cave-armor-r2/artifacts/spirit-campaign-swamp-cave-vest-t2-v1k-intended-2026-09-13T19-59-11-952Z-41b2909d` | `c86b475d850b109b3851220c58dc7beb16d3093c9f6b8f31db1f206ef7e71a79` | `77da6bec6ef2e58b5f5d6013ae658686b41f63517db080ec74a4f4aeb40162da` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `0918781d9ac9799bd236209fd3c0e87decf9b091702033b80d8f91cb30d30468` |
| `001-spirit-campaign-cave-cave-vest-t2-v1k-intended-r01` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t200442z-spirit-campaign-cave-cave-vest/runs/001-spirit-campaign-cave-cave-vest-t2-v1k-intended-r01/artifacts/spirit-campaign-cave-cave-vest-t2-v1k-intended-2026-09-13T20-05-36-858Z-da0722e0` | `85912f637538eedf928a59ebdd8996699f4aaccad732a01f9ec1b939d081b726` | `2cb22a772125a89899f89829585717b5ac636ce9d1d787767fcd7a84c701b628` | `ab3084c32feae9bb05bbf33da79382484dfbe25f048955555793a0a49490dd05` | — |
| `002-spirit-campaign-cave-cave-vest-t2-v1k-intended-r02` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t200442z-spirit-campaign-cave-cave-vest/runs/002-spirit-campaign-cave-cave-vest-t2-v1k-intended-r02/artifacts/spirit-campaign-cave-cave-vest-t2-v1k-intended-2026-09-13T20-09-37-937Z-10c9e9fd` | `fe637f604b871a05b9b7e256ce531e5d0165b46e539fe698ba336262fe990eec` | `abf15ab68369eea5d3d513b02ebbdf95a5fec48b204adff70e162637184cb908` | `40fcf00a702a783b14467f4a09b97049de32e970b135e351d3e888d59b998ab7` | — |
| `001-spirit-campaign-desert-cave-vest-t2-v1k-intended-r01` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t201359z-spirit-campaign-desert-cave-ve/runs/001-spirit-campaign-desert-cave-vest-t2-v1k-intended-r01/artifacts/spirit-campaign-desert-cave-vest-t2-v1k-intended-2026-09-13T20-14-49-521Z-eaf9a303` | `d3f7153a428974a597bff3c7da85edf6d5e1447009f4c2a8c5d7068250408433` | `1827fe646d1cdb9adaebeed069b50cac739883bda3303950982ece90c79261b5` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `1eb8ccb32df567d2d82f02803d62930b593010aa21ee3abe0ea889e91ed807de` |
| `002-spirit-campaign-desert-cave-vest-t2-v1k-intended-r02` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t201359z-spirit-campaign-desert-cave-ve/runs/002-spirit-campaign-desert-cave-vest-t2-v1k-intended-r02/artifacts/spirit-campaign-desert-cave-vest-t2-v1k-intended-2026-09-13T20-20-06-080Z-27dc1dc3` | `f4245561117504c216977b3930122e15bf50b85b3a3477d916e6c62d5a780aeb` | `f5cf861ab25ff9b262e317a30d5b4eb7e2fcfde02a1e1314df700d2233255a43` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `777966dab4f3e9d890c71d09d3aa7a55bc4d080fa23965afe51367757e440f61` |

## Evidence limits and handoff

- All eight cases are synthetic prepared-entry, 25x reward smoke runs. Their
  treatment validity and combat observations are retained, but their
  `canonicalAtCapture`/economy eligibility is false.
- Boss defeats in Swamp and Desert use a raw named-kill event whose entity-style
  record has `isBoss=false`; each is reported only because it is corroborated
  by a victorious boss-attempt outcome and the matching progression event.
- Incoming direct/DoT totals are run-wide. No boss-only mitigation, equal-stack
  tick comparison, hit-to-DoT conversion/deferred damage/debt, pool-specific
  empowerment, barrier-break or kiting-quality telemetry was emitted.
- Snapshot B is terminal-tail evidence, not a dedicated boss-entry snapshot.
  Failed Cave cases have no Snapshot B, and A1’s post-kill stall has no Snapshot
  B. No absent state is inferred from those gaps.
- The four Swamp boss defeats, two Cave losses and two Desert defeats are kept in
  their original terminal classifications. The A1 post-clear DoT death is not
  converted into a boss loss; the Cave deaths are not converted into harness
  failures.
- No automatic winner, balance proposal, rerun, retry or downstream experiment
  was created from these observations.
