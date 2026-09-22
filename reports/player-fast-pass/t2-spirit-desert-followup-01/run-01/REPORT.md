# T2 Spirit and Desert follow-up 01 — run 01

## Short answer

The sealed one-shot run completed all 32 fresh observations in the declared order: 27 lives reached the 600,000 ms cap and five ended at first player death. There were no process failures, retries, reused rows, omissions, or not-run rows. The run is synthetic and economyEligible=false.

In block A, the whole Stinger weapon package beat the whole Ruinous Axe package in 11 of 12 matched comparisons and led 1,016 to 879 lifetime kills in aggregate. The one exception was Spirit Light / Mountain / seed 101021, where Axe led 59 to 58. This is a fixed-package observation, not a weapon coefficient or universal class conclusion.

In block B, all four native Striker lives died within 19.3 seconds with zero kills. The opening Focus Lowest HP candidate produced 112 kills, reached the cap in three of four cells, and had one valid death at 119.7 seconds after six kills. The candidate is therefore a useful package-local targeting reference, not a universal survival or throughput result.

## Five findings

1. **The sealed execution and evidence contract completed cleanly.** The terminal receipt reconciles 32 planned, 32 completed, 32 new, 0 reused, 0 failed, 0 omitted, and 0 not-run. Block A had 24 cap outcomes; block B had three cap outcomes and five gameplay deaths. The dispatcher exited 0 after the exact one-worker, zero-retry run. No source, gear, Guard, stance, seed, or timing repair was applied.

2. **Stinger was the stronger whole-weapon package in this A matrix.** Stinger won 11/12 paired lifetime-kill comparisons, tied none, and lost once. The matched 600,000 ms endpoint deltas (Stinger minus Axe) were +18/+24 on Light Spirit Swamp, +7/-1 on Light Spirit Mountain, +23/+4 on Balanced Spirit Swamp, +7/+6 on Balanced Spirit Mountain, +16/+25 on Light Slinger Swamp, and +6/+2 on Light Slinger Mountain for seeds 101009/101021 respectively. The axe drawback, cadence, on-hit effects, Sweep/Power Strike context, and fixed core were all part of the package; this is not an isolated proc test.

3. **Opening Focus Lowest HP changed the B policy and materially improved the tested Striker lives.** All four candidate rows recorded the declared time-zero crafted-and-equipped receipt: yellow 90 -> 0, ownership true, recipe rune-recipe-focus-lowest-hp, and the final 30-RP package. The candidate beat native on lifetime kills in all four pairs: 33/35/6/38 versus 0/0/0/0. Three candidate rows reached the cap; the Balanced seed 101009 candidate still died at 119.7 seconds after six kills. This result includes the opening craft/equip and the declared RP change, not a separately identified targeting coefficient.

4. **The B survival result is real gameplay evidence but remains package- and fixture-scoped.** Candidate minimum HP was 58.07, 47.10, 0, and 93.67 across Light/101009, Light/101021, Balanced/101009, and Balanced/101021. Candidate Brace activity was 25/31/6/27 casts and 75,000/93,000/18,000/81,000 sampled active milliseconds. Native ended at zero HP in all four cells before its first kill. The candidate death is preserved as an observation; no rescue, Endure arm, refill, or second run is authorized by this packet.

5. **Desert targeting evidence separates selection, eligibility, landed damage, and kill order.** The sampled selection source was Focus Lowest HP in 427/600, 93/120, 430/600, and 465/600 candidate samples; native samples used Nearest eligible target in 18/18, 20/20, 14/14, and 15/15 samples. Exact selector eligibility/path search was unavailable (eligibleDealer.value=null) in all eight B rows. Target-level indexes recorded candidate landed/killed counts of 34/33, 8/6, 36/35, and 38/38; native recorded one landed target and zero kills in each row. The first killed type was dust-djinn in every capped/death-shortened candidate row; the last killed type was dust-djinn, stone-basilisk, dust-djinn, and stone-basilisk in the same order. Actual pack membership is retained in the external strategy streams, but no B bond had a qualifying both-engaged interval and overlapping bond pressure was zero, so no owner-pressure or eligibility attribution is inferred.

## Three priority decisions

1. Retain Stinger-versus-Axe as a measured whole-weapon reference for these Spirit/Slinger packages. Do not change weapon coefficients or declare Stinger universally superior; preserve the Light Spirit Mountain seed 101021 Axe exception.

2. Retain opening Focus Lowest HP as a scoped Striker Desert reference for the declared mature package. Do not adopt it as a universal targeting or survival change from four pairs, and do not separate its effect from the declared craft, RP, and package context.

3. Return the Balanced Striker / Desert / seed 101009 candidate death with its raw evidence if further work is authorized. Any follow-up should be separately sealed around that observed failure or exact selector eligibility; this packet authorizes no rescue tuning, extra Guard, extra seed, numerical treatment, or combat replay.

## Fixed packages and scope

Block A used Light Spirit, Balanced Spirit, and Light Slinger on Swamp-03 and Mountain-03 with Stinger and Ruinous Axe. Block B used Light Striker and Balanced Striker on Desert-03 with Gale Needle, native targeting or opening Focus Lowest HP. All rows retained the declared mature T2 package: ordinary equipment +5, Tempered Core +0, fixed class abilities and Guards, no relic, no later-tier range or skills, and the declared support rules. B candidate crafting/equipping occurred before the first World tick; neither arm scheduled a midpoint edit. Historical rows were references only and none were reused.

The runner recorded 409 Cleanse casts, 103 Second Wind casts, 94 Brace casts, 282,000 sampled Brace-active milliseconds, and 0 Endure-active milliseconds across the 32 rows. recuperatingMs remained zero in the row summaries; this is a recorder readback, not source-specific healing proof. Dedicated Spirit discharge/energy events were not emitted in the retained Spirit summaries/events, so no discharge count or source-attributed damage claim is made.

## Matched A ledger

The table reports work.kills at the 300,000/600,000 ms endpoints. Every A life reached the 600,000 ms cap, so endpoint values are present.

| Identity | Fixture | Seed | Stinger @300/@600 | Axe @300/@600 | Δ @600 |
| --- | --- | ---: | ---: | ---: | ---: |
| Spirit Light | Swamp-03 | 101009 | 60/119 | 47/101 | +18 |
| Spirit Light | Swamp-03 | 101021 | 71/131 | 52/107 | +24 |
| Spirit Light | Mountain-03 | 101009 | 30/63 | 27/56 | +7 |
| Spirit Light | Mountain-03 | 101021 | 31/58 | 31/59 | -1 |
| Spirit Balanced | Swamp-03 | 101009 | 59/113 | 48/90 | +23 |
| Spirit Balanced | Swamp-03 | 101021 | 64/117 | 59/113 | +4 |
| Spirit Balanced | Mountain-03 | 101009 | 28/54 | 25/47 | +7 |
| Spirit Balanced | Mountain-03 | 101021 | 32/58 | 27/52 | +6 |
| Slinger Light | Swamp-03 | 101009 | 51/103 | 44/87 | +16 |
| Slinger Light | Swamp-03 | 101021 | 55/106 | 44/81 | +25 |
| Slinger Light | Mountain-03 | 101009 | 23/46 | 18/40 | +6 |
| Slinger Light | Mountain-03 | 101021 | 26/48 | 24/46 | +2 |

First-kill latency across A was 2.0–20.6 seconds. A lifetime totals were Stinger 1,016 and Axe 879; work hpDamage was 1,145,325 and work absorbed was 84,883 across the block.

## Matched B ledger

Native post-death endpoints are null, never zero. Candidate endpoint values are also null after its valid death at 119.7 seconds.

| Identity | Seed | Native result / kills | Opening candidate result / kills | Candidate work @300/@600 | Candidate first kill | Candidate min / terminal HP | Brace casts / active ms |
| --- | ---: | --- | --- | --- | ---: | ---: | ---: |
| Striker Light | 101009 | death / 0 at 17.6 s | cap / 33 | 17/33 | 14.2 s | 58.07 / 185.97 | 25 / 75,000 |
| Striker Balanced | 101009 | death / 0 at 19.3 s | death / 6 at 119.7 s | null/null | 14.4 s | 0 / 0 | 6 / 18,000 |
| Striker Light | 101021 | death / 0 at 13.5 s | cap / 35 | 17/35 | 10.0 s | 47.10 / 224.32 | 31 / 93,000 |
| Striker Balanced | 101021 | death / 0 at 14.7 s | cap / 38 | 19/38 | 9.9 s | 93.67 / 253.91 | 27 / 81,000 |

The candidate’s 600,000 ms work total was 112 kills; native’s was 0. The candidate first-kill range was 9.9–14.4 seconds. The four native rows have no first kill.

## Desert selection and target readback

Selection counts below are sampled samples.jsonl observations, not every simulation tick. Landed is the number of target-index records with damage events; clean kills requires the target’s clean terminal kill evidence. First -> last is target-level kill order and does not prove selector eligibility or bond causation.

| Identity / seed | Native selection | Candidate selection | Native landed / clean kills | Candidate landed / clean kills | Candidate first -> last |
| --- | --- | --- | ---: | ---: | --- |
| Light / 101009 | Nearest eligible 18/18 | Focus Lowest HP 427/600 | 1/0 | 34/33 | dust-djinn -> dust-djinn |
| Balanced / 101009 | Nearest eligible 20/20 | Focus Lowest HP 93/120 | 1/0 | 8/6 | dust-djinn -> stone-basilisk |
| Light / 101021 | Nearest eligible 14/14 | Focus Lowest HP 430/600 | 1/0 | 36/35 | dust-djinn -> dust-djinn |
| Balanced / 101021 | Nearest eligible 15/15 | Focus Lowest HP 465/600 | 1/0 | 38/38 | dust-djinn -> stone-basilisk |

All eight B rows report exact selector eligibility/path search as unavailable. The actual strategy recorder retained Desert pack IDs and member identities. Across these rows, no bond had bothEngagedMs > 0, all recorder bond statuses remained ambiguous, and overlapping bond exposure was zero. The report therefore does not sum overlapping pressure or convert target selection into eligibility, landed damage, or kill-order attribution.

## Reconciliation and evidence limits

| Count / metric | Value |
| --- | ---: |
| Planned / completed / combat observations | 32 / 32 / 32 |
| New / reused / failed / not-run | 32 / 0 / 0 / 0 |
| Window-ended / player-died | 27 / 5 |
| Lifetime completedKills | 2,007 |
| Work hpDamage | 1,262,345 |
| Work absorbed | 84,883 |
| Recorded incoming owner HP damage | 46,778.13 |
| Unfinished targets | 18 |
| Target regain count | 11 |
| Rows with a first kill / median first kill | 28 / 3.3 s |

complete.json is the authoritative terminal receipt. results-summary.json is the machine-readable row contract and points to each external case directory. Raw events.jsonl, samples.jsonl, guard-events.jsonl, strategy streams, indexes, and summaries remain at D:/mmo-idle/t2-spirit-desert-followup-01/run-01; they were not copied into Git. The retained raw inventory contains 483 hashed entries totaling 498,965,482 bytes.

This is synthetic combat evidence only. It is not live playtest, player acquisition, economy calibration, multiplayer evidence, deployment verification, or a universal balance proof. Whole-weapon comparisons include cadence, procs, on-hit effects, and the axe drawback. Source-specific healing, overheal, counterfactual damage lost, exact selector eligibility/path search, exact Spirit overkill/source attribution, and causal bond pressure remain unavailable. Post-death endpoints remain null.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | t2-spirit-desert-followup-01 |
| Measured source commit | 3e27da0bdecd442b0a40e2c2ab41afbf013f6fa6 |
| Source SHA-256 | f1dd63a98cb1031fd3c0005e7621bf18862f30bc68f096f7469f83474929f644 |
| Hitboxes SHA-256 | 6a75e0e8417e0936bdaffe389f1d5b73b06a78b49d163961e02cf18ecca166bf |
| Execution checkout | D:/mmo-idle/t2-spirit-desert-followup-01/source |
| Packet | D:/mmo-idle/t2-spirit-desert-followup-01/packet |
| Run root | D:/mmo-idle/t2-spirit-desert-followup-01/run-01 |
| Step / cap | 100 ms / 600,000 ms |
| Endpoints | 300,000 ms and 600,000 ms |
| Stop rule | first player death; otherwise cap |
| Workers / retries | 1 / 0 |
| Synthetic / economy eligible | true / false |
| Packet manifest seal | 7446623d08167f6a6a51951ef22ed5613b3becf0a4a0909eb567674390319974 |
| Packet identity seal | d6d60348e1ae6a15120fe35c40527eef023811508a2b14596aab659dccb3f134 |
| Launch receipt | D:/mmo-idle/t2-spirit-desert-followup-01/packet/run-launched.json |

## Compact publication integrity

The compact files below are copied from the measured run or sealed packet without JSON rewriting. The bundle-local .gitattributes contains * -text so Git cannot change evidence line endings.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| complete.json | 101 | 6269ee194cae79a50e3ab78d0303f28815062942ec5da577bb8787a87c38ac2a |
| identity.json | 147226 | d6d60348e1ae6a15120fe35c40527eef023811508a2b14596aab659dccb3f134 |
| manifest.json | 81978 | 7446623d08167f6a6a51951ef22ed5613b3becf0a4a0909eb567674390319974 |
| packet-qualified.json | 295 | 459023f9f60d7dc25eafb41206f0f4256fabcc81ae959e0377cf055359a74411 |
| packet-receipt-verified.json | 470 | bcfd59091cec23406460f9a83a53f221e40a5fef45e5ffd8e98a43a8fc5bdaeb |
| packet-seal.json | 177 | e41669b0a7a555bf5d906cb15a0df1b6386860bdc7a8ccc03582847428f77aec |
| raw-inventory.json | 133055 | ff11bf15a323eef3255ae21f029072bbc2e71b21422253e5788e2b34fec94a30 |
| resolved-builds.json | 654171 | 33f54434bbe2e1ac484a5695047e1d29ddfc9dedc50df26fe238eba9387e70a2 |
| results-summary.json | 549149 | 95aadb7a343a66ef4dca09ff2b6da17aff74a5e13c42f5cadff0ad9381dd4c9e |

Raw histories remain outside Git under the run root. No deployment, force-push, unrelated file change, or combat replay was performed.
