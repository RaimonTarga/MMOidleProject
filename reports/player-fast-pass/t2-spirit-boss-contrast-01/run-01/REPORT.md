# T2 Spirit boss contrast 01 — run 01

## Short answer

The sealed one-shot run completed all 20 new boss observations in the declared order: 20/20 were authoritative boss kills, with no player deaths, dungeon resets, process failures, retries, reused rows, omissions, or not-run rows. The run is synthetic combat evidence with economyEligible=false.

Spirit Light was fastest on both bosses at 18.9 s in Forest and 43.1 s in Mountain. Spirit Balanced followed at 22.3 s and 45.6 s. Spirit Heavy was slower inside the Spirit set at 25.1 s and 50.8 s, but still finished ahead of the matched Slinger Light and Squire Heavy controls on both fixtures. Heavy paid for its late, high-value discharge with the only Spirit Forest HP loss: 59.3% minimum HP, barrier exhausted, and one Second Wind at 23.9 s.

No balance change was adopted. The evidence supports a separately sealed follow-up proposal for Heavy Spirit only: change energy per ordinary hit from 10 to 8, with the expected effect of bringing a second discharge into longer Mountain fights; the risk is over-rewarding Heavy's already large 6.0x discharge, especially with Quake's empowered multiplier bonus. This proposal is not implemented here.

## Five findings

1. **The sealed execution and evidence contract completed cleanly.** The terminal receipt reconciles 20 planned, 20 completed, 20 combat observations, 20 new, 0 reused, 0 failed, 0 omitted, and 0 not-run. Every row has an authoritative boss-specific kill event naming Apex Timberclaw or Stoneplate Juggernaut as the victim. There are no player-death or dungeon-reset events. The dispatcher exited 0 after the exact one-worker, zero-retry run.

2. **Spirit Light and Balanced have the clearest boss contrast advantage.** Across both retained seeds, Spirit Light took 18,900 ms in Forest and 43,100 ms in Mountain; Balanced took 22,300 ms and 45,600 ms. The controls took 25,600/52,700 ms for Slinger Light and 25,800/52,500 ms for Squire Heavy. Heavy Spirit took 25,100/50,800 ms, close to the controls but still faster in both fixtures. These are fixed-package TTK observations, not isolated class coefficients or universal rankings.

3. **The Spirit discharge tradeoff is visible and bounded.** Light landed 5 Forest discharges at 4.7 s and 9 Mountain discharges at 4.7 s; Balanced landed 3 at 7.0 s and 6 at 8.3 s. Heavy landed only one in each fixture, at 22.0 s in Forest and 26.6 s in Mountain, but its recorded whole-strike payload was 1,088 and 935 respectively. The Mountain plate absorbed 222 from Light's empowered hits and 139 from Balanced's; Heavy's single empowered Mountain hit was not absorbed. Recorded discharge HP damage is whole-strike payload after mitigation/shield, not useful damage, incremental discharge bonus, or overkill.

4. **Heavy's protection cost appears only in the Forest boss window.** All 12 Spirit rows reached the boss kill without a player death. Light and Balanced lost no HP; Heavy Forest reached 59.3% minimum HP after losing its full 137 barrier and used Second Wind once at 23.9 s in both seeds. Heavy Mountain stayed at full HP and barrier. Brace fired against a non-empty guardable-threat list every time it activated and produced the Brace buff: 1/2/2 casts for Spirit Light/Balanced/Heavy in Forest and 3/3/4 in Mountain. Second Wind did not activate in the other Spirit rows.

5. **The boss mechanics remained readable, but the Mountain charges did not reach impact.** Apex Timberclaw emitted Bestial Frenzy FX three times in the Light and Balanced Spirit rows and four times in Heavy Spirit and both controls, at the repeated 4.9/11.4/17.9 s beats and the later 24.4 s beat where the fight lasted. Stoneplate's barrier broke four times for Light and Balanced Spirit and five times for Heavy Spirit and both controls; each break emitted the stagger FX before the corresponding Stoneplate Charge could produce a charge-lane impact. No charge-hit damage was evidenced in the Spirit Mountain rows. The raw event stream retains telegraph-dodge events and all normal boss-hit evidence; no charge damage is inferred where the event did not identify one.

## Three priority decisions

1. Keep the current Spirit source unchanged. Do not adopt a winner, retune the class, or change boss values from this fixed two-boss synthetic screen.

2. Treat these rows as boss-contrast evidence only. Do not convert them into farming overkill, economy, live-play, multiplayer, or deployment conclusions, and do not pool them with unlike historical farming packages.

3. If a follow-up is authorized, seal one exact Heavy-only test around energy per ordinary hit 10 -> 8. The expected effect is an earlier second discharge in the 50.8 s Mountain fight; the risk is excessive burst from Heavy's 6.0x discharge and Quake empowered multiplier. No follow-up, replay, or source edit is authorized by this report.

## Fixed packages and scope

The matrix was five fixed mature T2 packages — Spirit Light, Spirit Balanced, Spirit Heavy, Slinger Light, and Squire Heavy — against Apex Timberclaw in Forest and Stoneplate Juggernaut in Mountain, with seeds 101009 and 101021. The exact queue alternated bosses within each identity and reversed identity order in the second seed block.

Every package used Power Strike II, Second Wind II, and Brace II with the declared rune rules, Offensive Stance, ordinary equipment +5, Tempered Core +0, no relics or rites, and the fixed 30-RP budget. The Spirit packages used the declared Mountain armor/charm; Heavy used Quake Hammer and Light/Balanced used Stinger. Guardian access, travel, prior clearing, acquisition, and economy were excluded. The accepted harness stripped guardians and invoked the production dungeon boss initialization with zero World ticks before combat. No treatment, loadout edit, refill, reroll, cap extension, or outcome-based optimization was applied.

The packet qualification and independent receipt check each passed 20/20 with zero World ticks and byte-identical applied/initial-state receipts. That verifies package construction and source identity; it is not combat evidence.

## Twenty-row ledger

TTK is the completed terminal tick time. Boss HP/barrier is initial -> supported terminal. Owner HP is start -> minimum percentage -> terminal. Owner barrier is start -> minimum -> terminal. PS is Power Strike cast start/fired; Hits is the canonical landed owner-hit count on the boss. Discharge is count @ first landed time, followed by recorded HP payload / barrier absorbed. Brace and 2W list event times in seconds. A dash means the mechanic was not applicable or did not activate.

| Case | Seed | Boss | Status | TTK ms | Boss HP/barrier | Owner HP start -> min% -> term | Barrier start -> min -> term | PS s/f | Hits | Discharge | Brace @ s | 2W @ s |
|---|---:|---|---|---:|---|---|---|---:|---:|---|---|---|
| Spirit Light / Forest | 101009 | Apex Timberclaw | kill | 18,900 | 3750/0 -> 0/0 | 221 -> 100 -> 221 | 124 -> 46 -> 46 | 2/2 | 31 | 5 @ 4.7; 675/0 | 4.9 | — |
| Spirit Light / Mountain | 101009 | Stoneplate Juggernaut | kill | 43,100 | 5000/0 -> 0/0 | 221 -> 100 -> 221 | 124 -> 124 -> 124 | 4/4 | 56 | 9 @ 4.7; 777/222 | 6.1, 17.1, 28.1 | — |
| Spirit Balanced / Forest | 101009 | Apex Timberclaw | kill | 22,300 | 3750/0 -> 0/0 | 230 -> 100 -> 230 | 129 -> 20.8 -> 24.2 | 2/2 | 31 | 3 @ 7.0; 513/0 | 4.3, 21.3 | — |
| Spirit Balanced / Mountain | 101009 | Stoneplate Juggernaut | kill | 45,600 | 5000/0 -> 0/0 | 230 -> 100 -> 230 | 129 -> 129 -> 129 | 4/4 | 55 | 6 @ 8.3; 695/139 | 6.1, 17.1, 28.1 | — |
| Spirit Heavy / Forest | 101009 | Apex Timberclaw | kill | 25,100 | 3750/0 -> 0/0 | 244 -> 59.3 -> 167.46 | 137 -> 0 -> 0 | 3/3 | 11 | 1 @ 22.0; 1088/0 | 4.2, 15.6 | 23.9 |
| Spirit Heavy / Mountain | 101009 | Stoneplate Juggernaut | kill | 50,800 | 5000/0 -> 0/0 | 244 -> 100 -> 244 | 137 -> 137 -> 137 | 6/5 | 20 | 1 @ 26.6; 935/0 | 6.1, 17.1, 28.1, 45.7 | — |
| Slinger Light / Forest | 101009 | Apex Timberclaw | kill | 25,600 | 3750/0 -> 0/0 | 253 -> 64.6 -> 206.72 | 0 -> 0 -> 0 | 3/3 | 43 | — | 4.8, 22.4 | — |
| Slinger Light / Mountain | 101009 | Stoneplate Juggernaut | kill | 52,700 | 5000/0 -> 0/0 | 231 -> 100 -> 231 | 60 -> 60 -> 60 | 7/5 | 74 | — | 6.1, 17.1, 28.1, 39.1 | — |
| Squire Heavy / Forest | 101009 | Apex Timberclaw | kill | 25,800 | 3750/0 -> 0/0 | 281 -> 40.6 -> 170.84 | 0 -> 0 -> 0 | 3/3 | 9 | — | 4.5, 16.0, 21.1 | 21.1 |
| Squire Heavy / Mountain | 101009 | Stoneplate Juggernaut | kill | 52,500 | 5000/0 -> 0/0 | 317 -> 45.7 -> 274.07 | 82 -> 0 -> 0 | 4/4 | 11 | — | 6.1, 17.1, 28.1, 33.5, 38.1 | 33.5 |
| Squire Heavy / Forest | 101021 | Apex Timberclaw | kill | 25,800 | 3750/0 -> 0/0 | 281 -> 40.6 -> 170.84 | 0 -> 0 -> 0 | 3/3 | 9 | — | 4.5, 16.0, 21.1 | 21.1 |
| Squire Heavy / Mountain | 101021 | Stoneplate Juggernaut | kill | 52,500 | 5000/0 -> 0/0 | 317 -> 45.7 -> 274.07 | 82 -> 0 -> 0 | 4/4 | 11 | — | 6.1, 17.1, 28.1, 33.5, 38.1 | 33.5 |
| Slinger Light / Forest | 101021 | Apex Timberclaw | kill | 25,600 | 3750/0 -> 0/0 | 253 -> 64.6 -> 206.72 | 0 -> 0 -> 0 | 3/3 | 43 | — | 4.8, 22.4 | — |
| Slinger Light / Mountain | 101021 | Stoneplate Juggernaut | kill | 52,700 | 5000/0 -> 0/0 | 231 -> 100 -> 231 | 60 -> 60 -> 60 | 7/5 | 74 | — | 6.1, 17.1, 28.1, 39.1 | — |
| Spirit Heavy / Forest | 101021 | Apex Timberclaw | kill | 25,100 | 3750/0 -> 0/0 | 244 -> 59.3 -> 167.46 | 137 -> 0 -> 0 | 3/3 | 11 | 1 @ 22.0; 1088/0 | 4.2, 15.6 | 23.9 |
| Spirit Heavy / Mountain | 101021 | Stoneplate Juggernaut | kill | 50,800 | 5000/0 -> 0/0 | 244 -> 100 -> 244 | 137 -> 137 -> 137 | 6/5 | 20 | 1 @ 26.6; 935/0 | 6.1, 17.1, 28.1, 45.7 | — |
| Spirit Balanced / Forest | 101021 | Apex Timberclaw | kill | 22,300 | 3750/0 -> 0/0 | 230 -> 100 -> 230 | 129 -> 20.8 -> 24.2 | 2/2 | 31 | 3 @ 7.0; 513/0 | 4.3, 21.3 | — |
| Spirit Balanced / Mountain | 101021 | Stoneplate Juggernaut | kill | 45,600 | 5000/0 -> 0/0 | 230 -> 100 -> 230 | 129 -> 129 -> 129 | 4/4 | 55 | 6 @ 8.3; 695/139 | 6.1, 17.1, 28.1 | — |
| Spirit Light / Forest | 101021 | Apex Timberclaw | kill | 18,900 | 3750/0 -> 0/0 | 221 -> 100 -> 221 | 124 -> 46 -> 46 | 2/2 | 31 | 5 @ 4.7; 675/0 | 4.9 | — |
| Spirit Light / Mountain | 101021 | Stoneplate Juggernaut | kill | 43,100 | 5000/0 -> 0/0 | 221 -> 100 -> 221 | 124 -> 124 -> 124 | 4/4 | 56 | 9 @ 4.7; 777/222 | 6.1, 17.1, 28.1 | — |

The authoritative kill event is at the tick start one 100 ms step before the reported completed TTK; this is the packet's event-time convention. All rows have bossHpFractionRemoved=1.0. Terminal boss body snapshots may contain the final whole-strike negative HP payload, but the supported terminal result remains 0 HP with the named boss kill event.

## Phase, guard, and barrier chronology

Forest's Bestial Frenzy was observed through boss-fx events at 4.9 s, 11.4 s, and 17.9 s in Light and Balanced Spirit. Heavy Spirit, Slinger Light, and Squire Heavy also reached the 24.4 s Frenzy event. These are recorded ramp events, not a reconstructed DPS curve.

Mountain's Stoneplate barrier broke before the charge could impact in every row. Spirit Light and Balanced each recorded four stagger/plate-break FX and four Charge starts; Spirit Heavy recorded five and five. Slinger Light and Squire Heavy also recorded five and five. The raw event streams show telegraph-dodge events and no Spirit Mountain owner damage from a charge impact. Normal Stoneplate boss damage and Squire control hits are retained separately; no unlabeled hit is reclassified as a charge.

Brace activation times in the ledger align with a non-empty threat list at the before-tick guard boundary and an ability-guard buff-gain event. The fixed rune was target-casting -> use-ability(Brace), not an extra default trigger. Second Wind was observed once in each Heavy Spirit Forest row and not in the remaining Spirit rows. Controls retain their own Second Wind events in the ledger for package comparison.

## Historical context — not pooled

The supplied historical context is descriptive only. Earlier matched farming references recorded Spirit Light Stinger Mountain work.kills of 63 and 58 at the 600-second endpoint, Spirit Balanced of 54 and 58, and Slinger Light of 46 and 48 for seeds 101009/101021. Earlier Heavy and Squire farming rows used unlike farming packages and support choices. Those rows are not controls for this boss matrix: no farming overkill, lifetime kill rate, or boss TTK conversion is inferred.

## Reconciliation and evidence limits

| Count / metric | Value |
|---|---:|
| Planned / completed / combat observations | 20 / 20 / 20 |
| New / reused / failed / not-run | 20 / 0 / 0 / 0 |
| Boss kills / player deaths / dungeon resets | 20 / 0 / 0 |
| Seeds | 101009: 10; 101021: 10 |
| Forest / Mountain rows | 10 / 10 |
| 60 s / 120 s / 300 s endpoints populated | 0 / 0 / 0 |
| Raw inventory entries / listed bytes | 200 / 23,035,978 |

The endpoint fields remain null after terminal completion; no post-terminal zero was substituted. Initial RNG state, initial boss body, roster hash, applied package, and resolved stats are retained per row in resolved-builds.json. The two seeds produced identical measured outcomes in this fixed harness, and both rows remain in the ledger rather than being deduplicated.

Preparation checks passed the packet-specific fixtures, typecheck including typecheck:bench, frozen verification, 20/20 zero-tick qualification, and 20/20 byte-identical receipt check. The full repository test suite, application build, and live browser playtest were not run for this packet. This is synthetic combat evidence only; it is not live playtest, player acquisition, economy calibration, multiplayer evidence, deployment verification, or a universal balance proof.

## Exact unimplemented Spirit proposal

For Spirit Heavy only, test energy per ordinary hit at 8 instead of the current 10. The expected effect is to move the first/second Heavy discharge cycle earlier, especially in the 50.8 s Mountain fight where only one landed discharge was observed at 26.6 s. The risk is that Heavy's 6.0x discharge, combined with the Quake empowered multiplier bonus, may turn an intended slow/high-payoff frame into an excessive burst package. This is a proposal for a separately sealed test, not a source change or adoption decision.

## Frozen execution identity

| Field | Value |
|---|---|
| Experiment | t2-spirit-boss-contrast-01 |
| Measured source commit | 3a1488a7c78bb47f4a90e20ec06db1652594fe16 |
| Source SHA-256 | 39110e1a573a22639c718487c653822e2f0ed87410f6bc1c16eb9905f9f04572 |
| Hitboxes SHA-256 | 6a75e0e8417e0936bdaffe389f1d5b73b06a78b49d163961e02cf18ecca166bf |
| Execution checkout | D:/mmo-idle/t2-spirit-boss-contrast-01/source |
| Packet | D:/mmo-idle/t2-spirit-boss-contrast-01/packet |
| Run root | D:/mmo-idle/t2-spirit-boss-contrast-01/run-01 |
| Step / cap | 100 ms / 300,000 ms |
| Endpoints | 60,000 ms, 120,000 ms, 300,000 ms |
| Stop rule | boss kill, first owner death, simultaneous terminal, or cap |
| Workers / retries | 1 / 0 |
| Synthetic / economy eligible | true / false |
| Packet manifest seal | 5ec4369864816d8921e37f47c45eb7f8c6353935b7c2177f71ea5e43b1da16d7 |
| Packet identity seal | 656e8bc2b2fc77890b7234ce01f43d74ede08fd3cb00a5167eef1e463eb23ef9 |
| Launch receipt | D:/mmo-idle/t2-spirit-boss-contrast-01/packet/run-launched.json |

## Compact publication integrity

The compact files below are copied from the measured run or sealed packet without JSON rewriting. The bundle-local .gitattributes uses * -text plus whitespace=cr-at-eol so Git cannot change evidence line endings. Per-tick events.jsonl and samples.jsonl remain external under the run root.

| File | Bytes | SHA-256 |
|---|---:|---|
| .gitattributes | 31 | 5d2c66adb84298fd3a0322767edd663cc96af4554d31257ad64fd2d4ddbd70c6 |
| complete.json | 101 | bfa011e21bc7ce43f9706a628490257fd60cf85894e7db31ee3bbe9213c02ff4 |
| identity.json | 147574 | 656e8bc2b2fc77890b7234ce01f43d74ede08fd3cb00a5167eef1e463eb23ef9 |
| manifest.json | 42056 | 5ec4369864816d8921e37f47c45eb7f8c6353935b7c2177f71ea5e43b1da16d7 |
| packet-qualified.json | 293 | 6c0c0a3b7291112160b5d13b21e330c874942595754266ac6e512792b5eba7a8 |
| packet-receipt-verified.json | 468 | c17087faba155bad958b8ace2ec7b8b3126039330929bbffd83a9ebb361f49bd |
| packet-run-launched.json | 162 | 32517eabfea92ab475d1cc0c423de9081d630b737fc87a9da673befb09726f61 |
| packet-seal.json | 177 | c5aee9a5fe011d631b62e0434f8b9d4448f6e4a2efeabcf4827455dab8e569d8 |
| PARTIAL.md | 2218 | 2961bc1eb083ff273db8b17a0eaa8628d53e2f04ff717df926fe9a32813ce674 |
| raw-inventory.json | 49537 | e3771bf756b424ce8240f49709265b5e6189c42a5bb6064e210828b4c3aa3e5a |
| resolved-builds.json | 322957 | 9fc163e1b213ff4826623083b2d545064ca18b5d5d93e9cd8332fa9d916da494 |
| results-summary.json | 156388 | 19e6ebce53c8989e4afc0f6ee1c5bf69a7f32d1cb7a480a78a90af4e5a5d46c3 |

No deployment, force-push, merge, source edit, combat replay, or automatic follow-up was performed.
