# V1j — Mountain coverage and Swamp recovery comparison operator report

Status: retry complete. The fresh V1j session created and ran both sealed
manifests to terminal state: two valid Mountain wins and four valid Swamp
cases (one barrier death, one recovery death, one recovery win, one barrier
win). The two-arms-per-condition result is descriptive only; it does not
select a winning charm or authorize a balance change.

No gameplay source or balance files were changed. The only project edits for
this delivery are this report and its README index entry; unrelated existing
working-tree changes were preserved.

## Retry session ledger

| Field | Value |
|---|---|
| Retry timestamp | 2026-09-13T20:10:40.5253390+02:00, recorded before setup |
| Hard session deadline | 2026-09-13T23:40:40.5253390+02:00 |
| Frozen gameplay revision | 6365651b5fcbcd0b32284343df29d01121ceb5d3 |
| Frozen source tree | 11a5298b9a2ce6a32c374979108f1fa6ddd10841 |
| Operator checkout | C:/Users/osaif/Documents/Claude/Projects/MMO idle, branch develop |
| Contract | 6 runs, two sequential manifests, one worker, one active manifest |
| Planned / created / started / terminal | 6 / 6 / 6 / 6 |
| Worker ceilings | A: 20 minutes per case; B: 25 minutes per case; 140 minutes total |
| Validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1j-integrated |
| Validation state | exact frozen revision/tree, clean checkout; bot-local TypeScript was materialized and `pnpm bot:preflight` passed |
| Create/launch source | current operator checkout, with `invocationDirty=true`; uncommitted changes excluded from the image |
| Retry disposition | completed before the hard deadline; both supervisors released terminal infrastructure automatically |

The first offline dependency setup in the validation checkout did not
materialize the bot-local compiler; rerunning the same offline install did.
The subsequent frozen `pnpm bot:preflight` passed all gates, including build,
profile/spawn, tier-entry, route, behavior, boss, snapshot, study and harness
checks. No experiment artifact was produced by the setup-only attempt.

## Capacity recovery and preflight

The two fresh empty probes required before creation passed after exact
inspection and were removed by exact network ID:

| Probe | Network ID | Verification | Disposition |
|---|---|---|---|
| mmo-v1j-capacity-20260913-201040-retry1 | 1d40aec4629b75af18678e19539f412b7cea90b541b613e06d6c6112481c5da3 | `docker network inspect` had an empty `Containers` object and `docker ps -a --filter network=<id>` was empty | removed exact ID |
| mmo-v1j-capacity-20260913-201040-retry2 | 6753147f56fa1f12a96e5d38d8d18e0618e70fbf5812669368587f890ca15b2f | empty `Containers` object and no attached containers | removed exact ID |

The first retry probe's initial endpoint counter was a PowerShell inspection
mistake; exact Docker inspection confirmed it was empty before removal. No
historical network, container, database, Redis instance or experiment was
pruned, resumed or deleted. After Phase A, the same two-empty-probe gate was
repeated and passed:

| Post-A probe | Network ID | Disposition |
|---|---|---|
| mmo-v1j-capacity-20260913-182900-after-a-1 | 0722feddf9bf7f2a91a5bd2954db142ad8270ac3825d54e2db8bd82092c027f5 | exact empty probe removed |
| mmo-v1j-capacity-20260913-182900-after-a-2 | 35686c49e404876560c7ed821ecf5275add6f44349630c239a8cd3a3db6a2789 | exact empty probe removed |

The host atomic-write retry is in `scripts/experiment/lib.mjs`; the host
`release.mjs` SHA-256 is
`f3247d6714b7d67dae8f31ee88626eea9a1c809d8ae4eb5b825ab14e060361c6` and the
copied release runtime matched it in both manifests.

## Frozen input and runtime provenance

Every case imported the original V1h Spirit Snapshot B, never a V1i or V1j
output:

| Input | Value |
|---|---|
| Assessment read | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1i-assessment.md |
| Spirit Snapshot B | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json |
| Spirit Snapshot B SHA-256 | 4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6 |
| Study | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1j-swamp-study.json |
| Study SHA-256 | 1ae42fa85e0e83bfc9d6ceed616a8fa047d355d6338c4d33b5faac809b0ba8d7 |
| Prepared origin | Tier 2, GM72, Energy Heavy, prepared-t2 handoff, synthetic accelerated origin |

Both manifests sealed the same immutable runtime:

| Field | Value |
|---|---|
| Image tag | mmo-idle-experiment:6365651b5fcb-d90e6996 |
| Image ID / digest | sha256:b8ec56ea78268e025b9263a6d34d9715e41ceebf9ba2a248dab706c3ab4a0366 |
| Build ID | fe992f1bcfa6ead3569e2fa0 |
| Tooling hash | d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1 |
| Runtime hash | f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f |
| Copied `release.mjs` hash | f3247d6714b7d67dae8f31ee88626eea9a1c809d8ae4eb5b825ab14e060361c6; equal to host hash |
| Evidence taints | `SYNTHETIC_TIER_ENTRY`, `NON_CANONICAL_REWARD_MULTIPLIER` |
| Combat/economy eligibility | false by the supplied synthetic entry and 25× smoke reward contract |

## Phase A — Mountain manifest

| Field | Value |
|---|---|
| Experiment ID | 20260913t181549z-spirit-campaign-mountain-mount |
| Created | 2026-09-13T18:17:18.272Z |
| Manifest SHA-256 | c7e48766bd7e5dabdb1115d7b09affadd872e66f1f1ecdb6fdfba7572146279e |
| Config | smoke-isolated; one worker; count 2; maxRunMs 1200000; reward 25; retries 0; fastBossRetry false |
| Routes | spirit-campaign-mountain-mountain-charm-t2-v1j |
| Artifact root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t181549z-spirit-campaign-mountain-mount |
| Cohort report | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t181549z-spirit-campaign-mountain-mount/cohort-summary.json |
| Release | `network-release.json` status `released`; supervisor event recorded infrastructure-release with 2 retained containers |

| Run key | Run ID | Status / validity | Boss corroboration | Summary SHA-256 | Artifact directory |
|---|---|---|---|---|---|
| 001-spirit-campaign-mountain-mountain-charm--intended-r01 | spirit-campaign-mountain-mountain-charm-t2-v1j-intended-2026-09-13T18-18-58-479Z-95b3270f | completed / valid | Stoneplate Juggernaut named kill, attempt victory, `mountain:2` | f60569745683be27c4c2dd14c16f956864fb4f69bacae219bf50aa03d7964ebb | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t181549z-spirit-campaign-mountain-mount/runs/001-spirit-campaign-mountain-mountain-charm--intended-r01/artifacts/spirit-campaign-mountain-mountain-charm-t2-v1j-intended-2026-09-13T18-18-58-479Z-95b3270f |
| 002-spirit-campaign-mountain-mountain-charm--intended-r02 | spirit-campaign-mountain-mountain-charm-t2-v1j-intended-2026-09-13T18-24-02-533Z-b66d042a | completed / valid | Stoneplate Juggernaut named kill, attempt victory, `mountain:2` | 391bacea3ae7b024422d728834b967a2bce39345e1e487941783ac129ed96059 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t181549z-spirit-campaign-mountain-mount/runs/002-spirit-campaign-mountain-mountain-charm--intended-r02/artifacts/spirit-campaign-mountain-mountain-charm-t2-v1j-intended-2026-09-13T18-24-02-533Z-b66d042a |

Phase-A event artifact SHA-256 values are r01 `01aab61d89a8928998ebcd6237ffe51965a32b4bd6fe0554910d2c3aa1a11192`
and r02 `ed5f752c719800911ffeb859b367fa1ce1c496a7187f2ee43b52f5019de69d3e`.
The Snapshot B SHA-256 values are listed in the run table's corresponding
artifact records: r01 `9324759559aa2db67b7cca2f0281418edf339b1356cb57500c1958712a57cc89`
and r02 `ded90437fe23d812aa9ec0dbdec962167189b807b2db845d6567349adeffd446`.

Both final builds were Ruinous Axe +5, Cave Vest T2 +5, Mountain Charm T2
+5, Plains Boots T2 +5, Tempered Core, no relic; Expose Weakness; Second
Wind and Brace; defensive stance; no Rite; and the five authored movement
rules. Both completed 39/39 route steps at GM72 with zero deaths.

The first Mountain boss attempt lasted 275250 ms, including 61053 ms of boss
combat. Its boss diagnostics were 120 samples, mean range 156.59, max range
199.01, in-reach 0.29, out-of-reach 0.71, mean other actors 1.25, max 4,
barrier mean fraction 0.98, recharge 0.02, depleted 0. The second lasted
273714 ms, including 62545 ms of boss combat; diagnostics were 118 samples,
mean range 155.44, max 192.75, in-reach 0.20, out-of-reach 0.80, mean other
actors 1.23, max 4, barrier mean fraction 0.95, recharge 0.02, depleted
0.04. Step Back was activated 6/6 times in each case, with 0 successes,
6 discarded and 0 damage received. No explicit charge-cast/impact,
plate-break, stagger or recovery telemetry was emitted.

The raw boss kill event uses `isBoss=false` and an entity-style type ID in
both runs. Victory is therefore reported only from the combined named kill,
boss-attempt outcome and `mountain:2` progression evidence.

## Phase B — Swamp study manifest

| Field | Value |
|---|---|
| Experiment ID | 20260913t183317z-spirit-campaign-swamp-mountain |
| Created | 2026-09-13T18:33:25.840Z |
| Manifest SHA-256 | 08586b2499ba145e3876ba4cd1cb2ee7b9d1620f03de2bfcc4ed4ea38287a70a |
| Config | smoke-isolated; one worker; count 2 per arm; maxRunMs 1500000; reward 25; retries 0; fastBossRetry false |
| Arm order | barrier, recovery, recovery, barrier; independent RNG; not paired seeds |
| Routes | spirit-campaign-swamp-mountain-charm-t2-v1j; spirit-campaign-swamp-swamp-charm-t2-v1j |
| Artifact root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain |
| Cohort report | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain/cohort-summary.json |
| Release | `network-release.json` status `released`; supervisor event recorded infrastructure-release with 2 retained containers |

All four B rows had 28 treatment assertions with 0 failures, profile/spawn
checks passing, empty `issues` at final configureBuild verification, and a
completed preparation sequence: Axe, Cave Vest, Mountain Charm and Plains
Boots to +5; learn Brace; learn Cleanse; reconstruct `swamp-charm-t2`; and
upgrade it to +5. The final verified build was Expose Weakness; Second Wind
and Cleanse; defensive stance/default; no Rite; the five authored movement
rules; 26/30 RP. The route step for learning Brace completed, while final
observed guards correctly omitted it as unattuned.

| Run key | Run ID | Final charm | Status / validity | Ready marker | Boss result | Summary / artifact |
|---|---|---|---|---|---|---|
| 001-barrier-r1 | spirit-campaign-swamp-mountain-charm-t2-v1j-intended-2026-09-13T18-34-23-042Z-717a9a65 | Mountain Charm T2 | failed `bot_partial` / valid | `v1j:spirit:swamp:mountain-charm-t2:ready` | valid death; boss HP fraction 0.0177777778 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain/runs/001-barrier-r1/artifacts/spirit-campaign-swamp-mountain-charm-t2-v1j-intended-2026-09-13T18-34-23-042Z-717a9a65/summary.json |
| 002-recovery-r1 | spirit-campaign-swamp-swamp-charm-t2-v1j-intended-2026-09-13T18-37-52-774Z-2e0406a7 | Bog Eye T2 | failed `bot_partial` / valid | `v1j:spirit:swamp:swamp-charm-t2:ready` | valid death; boss HP fraction 0.1045925926 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain/runs/002-recovery-r1/artifacts/spirit-campaign-swamp-swamp-charm-t2-v1j-intended-2026-09-13T18-37-52-774Z-2e0406a7/summary.json |
| 003-recovery-r2 | spirit-campaign-swamp-swamp-charm-t2-v1j-intended-2026-09-13T18-41-27-943Z-8130ad58 | Bog Eye T2 | completed `bot_completed` / valid | `v1j:spirit:swamp:swamp-charm-t2:ready` | named Mire-Gorged Behemoth kill, victory, `swamp:2` | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain/runs/003-recovery-r2/artifacts/spirit-campaign-swamp-swamp-charm-t2-v1j-intended-2026-09-13T18-41-27-943Z-8130ad58/summary.json |
| 004-barrier-r2 | spirit-campaign-swamp-mountain-charm-t2-v1j-intended-2026-09-13T18-44-59-243Z-06574538 | Mountain Charm T2 | completed `bot_completed` / valid | `v1j:spirit:swamp:mountain-charm-t2:ready` | named Mire-Gorged Behemoth kill, victory, `swamp:2` | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t183317z-spirit-campaign-swamp-mountain/runs/004-barrier-r2/artifacts/spirit-campaign-swamp-mountain-charm-t2-v1j-intended-2026-09-13T18-44-59-243Z-06574538/summary.json |

The Phase-B summary/event artifact SHA-256 pairs are: barrier r1
`b7421556ca6af5bc30c9b005d1c267352321f4622ea5f15387fd0de37fb05e08` /
`9405a06680522beb64db8ef9ada73daa660f0d262995e91d2e0289365d0732b0`,
recovery r1
`6422e700aee1a1b22ad51c0a429eb32c30bf85cda53a55857183696cea7c6dcc` /
`9d3f93f526ce99b03220444586b1db579ef028aceb296a3365758f4803d19d0a`,
recovery r2
`2612ef14ec3599bef49e716b53f0bc83ec5945eec83d4d634c611f063357c121` /
`3594293ce9587c0664ce8f455fbd221c9fe97e72c94259885ef5bf2704a2e574`,
and barrier r2
`c881bc72d9ec128b91cd27efb11cd9d6c2695052f4dd1fdef794fdc5dbea6fd7` /
`95ca19c672d44b7c058219a10aac0d448becdb09c64c4b9040e23e97aa352542`.

### Guardian and boss clocks

| Run | Ready marker | Guardian phase | Boss attempt / boss combat | Boss death or kill evidence |
|---|---:|---:|---:|---|
| barrier r1 | 12177 ms | start 110282; end 153816; 6/6 to 0; 43534 ms | 178175 ms total; 27525 ms boss combat | Mire-Gorged Behemoth DoT death at 190109 ms; 22 damage, 3 stacks; plating 18, damage reduction 0.19; `boss-step-exhausted` ended the dependent route |
| recovery r1 | 13183 ms | start 112770; end 154813; 6/6 to 0; 42043 ms | 181664 ms total; 31026 ms boss combat | Mire-Gorged Behemoth DoT death at 194200 ms; 30 damage, 4 stacks; plating 18, damage reduction 0.19; `boss-step-exhausted` ended the dependent route |
| recovery r2 | 13175 ms | start 111300; end 154894; 6/6 to 0; 43594 ms | 179262 ms total; 28027 ms boss combat | Named kill at 191660 ms; raw `isBoss=false`, type `node-t2-swamp-dungeon_monster-7`; boss attempt victory and `swamp:2` corroborate |
| barrier r2 | 12143 ms | start 115240; end 166796; 6/6 to 0; 51556 ms | 193190 ms total; 29529 ms boss combat | Named kill at 204438 ms; raw `isBoss=false`, type `node-t2-swamp-dungeon_monster-7`; boss attempt victory and `swamp:2` corroborate |

Barrier r2 also emitted one death at 205291 ms, after the named kill but
before the boss-attempt closed at 205334 ms. Its record names an `Unknown`
non-boss DoT source for the 22-damage killing blow, while the dominant source
and the boss window remain Mire-Gorged Behemoth. The run still finalized as a
completed, valid victory. This post-kill death is retained rather than
silently discarded.

### Swamp combat and mechanic evidence

The following are run-wide totals unless explicitly labelled diagnostics; they
must not be read as boss-window-only measurements.

| Run | Damage taken / absorbed / healed / HP lost | Incoming direct / DoT | Activations | Cleanse removals | Boss diagnostics: range mean/max; in/out; adds mean/max; barrier mean/recharge/depleted |
|---|---|---|---|---|---|
| barrier r1 | 319 / 240 / 219 / 210.84 | 56 / 263 | Expose 6; Cleanse 5; Second Wind 1 | antiheal 2; Mire-Gorged venom 5 | 107.43 / 187.04; 0.62 / 0.22; 2.42 / 6; 0.77 / 0.01 / 0.15 |
| recovery r1 | 451 / 165 / 370 / 252.05 | 84 / 367 | Expose 6; Cleanse 6; Second Wind 1 | antiheal 2; Stalker venom 2; Mire-Gorged venom 5 | 101.18 / 193.66; 0.41 / 0.24; 2.26 / 6; 0.63 / 0.06 / 0.23 |
| recovery r2 | 401 / 180 / 352 / 256.35 | 70 / 331 | Expose 6; Cleanse 5; Second Wind 1 | antiheal 2; Mire-Gorged venom 5 | 107.70 / 189.21; 0.35 / 0.28; 2.38 / 6; 0.69 / 0.05 / 0.20 |
| barrier r2 | 472.76 / 608.24 / 751.24 / 400.57 | 238.76 / 234 | Expose 6; Cleanse 6; Second Wind 1 | antiheal 2; Stalker venom 2; Mire-Gorged venom 5 | 105.92 / 183.11; 0.35 / 0.27; 2.40 / 6; 0.74 / 0.04 / 0.14 |

Step Back was 3/3/3/0/0/0 (activations/attempts/successes/failures/
discarded/damage received) in every B case. `hazardEscape` was 0/0/0/0/0
and `persistentHazards` was empty. No pool-specific exposure/avoidance field
was emitted, so pool handling remains unknown. No comparative empowerment,
dead-swing, kiting-quality or mitigation claim is inferred from these
aggregates.

The actual boss-entry HP/barrier was not emitted as a dedicated entry
snapshot. The 223/223 HP in the run header is the prepared sanctuary start,
not a measured boss-entry state. The records do emit the following separate
terminal Snapshot B states:

| Run | Snapshot B SHA-256 | Snapshot state at capture |
|---|---|---|
| recovery r2 | f9fea289c5c8f961a4b50663a51281684a132b12e1c64b91d40ae9d6e8109255 | elapsed 192439 ms; runtime HP 30.877968/231; barrier 0/69; incomingDot 154; Poison 3; pendingHeal 0; `isDead=false`; `canonicalAtCapture=false` |
| barrier r2 | 3a14ffa0e11170a9a8c44c85937cdc49b480e540d0c2b58875fd0d3d99d723d4 | elapsed 205335 ms; runtime HP 2.198126/231; barrier 0/129; incomingDot 132; Poison 3; pendingHeal 0; `isDead=false`; `canonicalAtCapture=false` |

The corresponding Snapshot B files are `snapshot-b.json` in the run artifact
directories above. The partial deaths emitted no Snapshot B; their emitted
boss HP fractions are recorded in the run table and their death records retain
the cause, stacks, plating and damage-reduction fields.

## Validity and mandatory disposition

All six cases are treatment-valid. There were no prep-time timeout/death
invalidations, profile/spawn failures, configureBuild regressions, isolation
failures, missing terminal evidence or worker exceptions. The two B rows
labelled `failed` are ordinary valid gameplay partials after the ready marker,
not infrastructure failures. There were no retries, extensions, automatic
follow-ons, fast-boss retries, manual worker interventions or unstarted slots.

The final B disposition is therefore:

| Arm | Valid cases | Boss wins | Valid boss deaths | Descriptive result |
|---|---:|---:|---:|---|
| Mountain Charm barrier | 2 | 1 | 1 | 1/2 wins in this tiny sample |
| Bog Eye recovery | 2 | 1 | 1 | 1/2 wins in this tiny sample |

This is not evidence for a winning template, a passive-specific effect, or a
balance proposal. The experiment used a synthetic Tier-2 entry and 25× smoke
rewards, so its valid gameplay outcomes remain non-canonical and ineligible
for economy/combat claims. Return to Astra for the next selection.

## Historical first attempt — capacity-blocked session

This preserves the earlier report history. That session stopped before create
exactly at the packet's capacity boundary and produced no gameplay evidence.

| Field | Value |
|---|---|
| Session timestamp | 2026-09-13T20:01:02.3892984+02:00 |
| Hard deadline | 2026-09-13T23:31:02.3892984+02:00 |
| Planned / created / started / terminal | 6 / 0 / 0 / 0 |
| Validation/preflight | not run; capacity stop preceded checkout and create |
| Stop reason | Docker daemon: all predefined address pools have been fully subnetted |

| Probe | Result |
|---|---|
| mmo-v1j-capacity-20260913-200102-1 | first unique probe failed; no network allocated |
| mmo-v1j-capacity-20260913-200102-2 | not attempted after the required immediate stop |

A read-only audit observed 28 mmoexp-prefixed local bridge networks with 31
attached endpoints, including still-running V1i resources. No old network,
container, database, Redis instance or historical experiment was stopped,
pruned, resumed or deleted. The capacity error was not evidence about
Mountain, Swamp, either boss, Mountain Charm or Bog Eye. The blocked attempt
had no V1j manifest, image, worker, summary, snapshot or gameplay artifact.
