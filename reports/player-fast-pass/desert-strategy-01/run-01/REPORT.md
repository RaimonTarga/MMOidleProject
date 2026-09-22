# Desert strategy 01 — run 01

## Short answer

The sealed one-shot run completed all 24 fresh observations in the prescribed order: 22 lives reached the 600,000 ms cap and two ended at first death. There were no process failures, retries, reused rows, omissions, or unstarted rows. The packet remains synthetic and `economyEligible=false`.

The low-HP targeting arm behaved as a policy change: across the 12 baseline rows, the mean owner dealer-target share was 25.6%; across the 12 low-HP rows it was 55.3%. For Champion, the formation target matched the owner selection in 99.9–100% of non-null samples. Combat effectiveness was mixed: low-HP won 4 of 12 matched lifetime-kill totals, baseline won 7, and one tied. The low-HP aggregate lead, 696 versus 646 kills, is driven by two baseline deaths; the median paired kill delta was -2.

## Five findings

1. The sealed execution contract completed cleanly: 24/24 combat observations, 22 cap outcomes, 2 gameplay deaths, 0 operational failures, 0 retries, 0 omitted rows, and 0 not-run rows.

2. Native targeting selection changed in the intended direction. Low-HP targeting increased owner dealer-target selection in every matched identity. Champion formation inherited that owner selection in the fixed source, with 99.9–100% formation/owner agreement whenever a formation target was present. This measures policy application, not exact path eligibility or guaranteed dealer-first damage.

3. Combat results do not support a universal low-HP throughput conclusion. Low-HP won 4 pairs, baseline won 7, and one tied; the matched lifetime-kill deltas were +1/-10/-2/0/+8/-7 for seed 101009 and +32/-10/-4/-2/+48/-4 for seed 101021 in Berserker/Avenger/Icebreaker/Melter/Champion/Voidwalker order.

4. Berserker and Champion are the strongest strategy-specific survival readbacks. Berserker low-HP reached 50 kills at seed 101021 while baseline died at 213.8 seconds with 18 kills. Champion low-HP reached 50 kills in both seeds; baseline reached 42 kills at seed 101009 and died at 42.9 seconds with 2 kills at seed 101021. These are fixture/package observations, not class-wide guarantees.

5. Cleanse was exercised in the raw guard streams: baseline recorded 367 actual activations removing 285 sampled `slow` effects and 137 `sundered` effects; low-HP recorded 543 activations removing 410 `slow` and 222 `sundered`. Position, control, damage, and replacement streams remain descriptive; no causal movement, source-specific healing, summon-damage, economy, or population claim is inferred.

## Three decisions / questions

1. Keep the formation inheritance fix canonical in the measured source and accept `native-owner-target-inheritance` as a Champion strategy reference. It is not a stat buff and is not deployed.

2. Leave all six packages and coefficients unchanged. Do not add Endure, a kiting arm, a coefficient change, or another rescue run from this packet. Low-HP targeting may remain a scoped reference for Berserker and Champion, but the matched combat evidence is not a universal policy win.

3. Designer question: if another packet is authorized, should it target the recorded no-exposure/exact-eligibility gap for dealer formation reach rather than adding another build or policy arm?

## Matched comparisons

`A` below means `arm=baseline-targeting`; `B` means `arm=lowhp-targeting`. The dispatcher's historical `block` field is not used as the policy dimension. Each result is `outcome / lifetime completedKills / work.kills at 300,000 ms / work.kills at 600,000 ms`; post-death endpoints are `null`, not zero. Interval columns are work kills in minutes 0–5 and 5–10.

| Root / path | Seed | A result | B result | Δ lifetime kills | Δ 0–5 / 5–10 | Dealer-first A → B |
|---|---:|---|---|---:|---:|---:|
| Striker / Berserker | 101009 | cap / 54 / 28 / 54 | cap / 55 / 26 / 55 | +1 | -2 / +3 | 1 → 28 |
| Striker / Berserker | 101021 | death 213.8s / 18 / null / null | cap / 50 / 23 / 50 | +32 | null / null | 0 → 25 |
| Squire / Avenger | 101009 | cap / 53 / 24 / 53 | cap / 43 / 21 / 43 | -10 | -3 / -7 | 16 → 22 |
| Squire / Avenger | 101021 | cap / 50 / 24 / 50 | cap / 40 / 21 / 40 | -10 | -3 / -7 | 16 → 20 |
| Apprentice / Icebreaker | 101009 | cap / 60 / 27 / 60 | cap / 58 / 30 / 58 | -2 | +3 / -5 | 13 → 12 |
| Apprentice / Icebreaker | 101021 | cap / 56 / 29 / 56 | cap / 52 / 26 / 52 | -4 | -3 / -1 | 8 → 8 |
| Slinger / Melter | 101009 | cap / 87 / 46 / 87 | cap / 87 / 46 / 87 | 0 | 0 / 0 | 13 → 18 |
| Slinger / Melter | 101021 | cap / 78 / 34 / 78 | cap / 76 / 38 / 76 | -2 | +4 / -6 | 7 → 8 |
| Conduit / Champion | 101009 | cap / 42 / 22 / 42 | cap / 50 / 25 / 50 | +8 | +3 / +5 | 1 → 25 |
| Conduit / Champion | 101021 | death 42.9s / 2 / null / null | cap / 50 / 25 / 50 | +48 | null / null | 1 → 25 |
| Spirit / Voidwalker | 101009 | cap / 74 / 37 / 74 | cap / 67 / 34 / 67 | -7 | -3 / -4 | 1 → 1 |
| Spirit / Voidwalker | 101021 | cap / 72 / 34 / 72 | cap / 68 / 34 / 68 | -4 | 0 / -4 | 0 → 1 |

The two deaths were both baseline rows: Berserker seed 101021 died to a ranged `sandspitter-cobra` hit for 151 at 213,800 ms; Champion seed 101021 died to a ranged `sandspitter-cobra` hit for 71 at 42,900 ms. Gameplay death continues to the next sealed case and is not an operational failure.

## Six-root evidence update

| Root / representative | Policy effectiveness | Combat effectiveness | Updated disposition |
|---|---|---|---|
| Striker / Berserker | Owner dealer share 22.6→38.5% at seed 101009 and 24.9→32.2% at seed 101021; dealer-first 1→28 and 0→25. | +1 kill at seed 101009; low-HP capped at 50 versus an 18-kill baseline death at seed 101021. | **Accepted as a scoped reference.** No stat change and no Endure add-back. |
| Squire / Avenger | Owner dealer share 16.5→39.4% and 15.6→38.9%; dealer-first increased, but target selection did not translate to more work. | -10 kills in both seeds; all four lives capped. | **Measured; leave unchanged.** |
| Apprentice / Icebreaker | Owner dealer share 31.3→73.0% and 36.0→77.4%; dealer-first was flat or slightly lower. | -2 and -4 kills; all four lives capped, with higher low-HP pressure in the paired readback. | **Measured; leave unchanged.** Retain the specialization reference. |
| Slinger / Melter | Owner dealer share 23.7→76.8% and 25.1→86.5%; dealer-first increased modestly. | Tie at seed 101009 and -2 at seed 101021; all four lives capped. | **Measured; leave unchanged.** Do not infer a nerf from historical strength. |
| Conduit / Champion | Owner dealer share 16.8→36.0% and 13.3→37.1%. Formation/owner agreement was 99.9–100% when non-null under the integrated inheritance fix. | +8 kills at seed 101009; low-HP capped at 50 versus baseline death at 42.9s/2 kills at seed 101021. Conduit payments remain separate from owner HP damage. | **Integrated and accepted as a strategy reference.** No stat buff, new arm, Endure add-back, or deployment. |
| Spirit / Voidwalker | Owner dealer share 40.2→61.4% and 40.9→66.7%; dealer-first remained rare. | -7 and -4 kills; all four lives capped. Barrier absorption and owner HP damage differed materially by arm. | **Measured; leave unchanged.** Retain the specialization reference. |

## Targeting, formation, Cleanse, and Conduit readback

The integrated source is `0cfa240338e364bcd7bccb499cb6301d3bdb96cb`. Active TARGETING rules consume the latest native owner selection within leash; invalid, concealed, invulnerable, other-node, or out-of-leash selections do not silently fall back to a nearest target. Explicit commands retain precedence and inactive rules retain the native formation policy. The recorder does not expose exact selector eligibility or path search, so target presence is not eligibility proof.

For Champion seed 101009, baseline selected dealers in 16.8% of owner samples and formation selected dealers in 3.1%; low-HP was 36.0% and 15.1%. For seed 101021 the corresponding values were baseline 13.3% and 0.2%, versus low-HP 37.1% and 14.8%. Formation/owner agreement was 99.9% and 100% respectively. This confirms inheritance behavior while leaving reach, persistence, cadence, and leash as measured limitations.

Champion Conduit delivery remained separate from owner damage:

| Seed / arm | Work kills | Live authored offense | Zero-summon exposure | Successful replacements / HP paid |
|---|---:|---:|---:|---:|
| 101009 baseline | 42 | 0.932 | 73,800 ms | 12 / 5,016 |
| 101009 low-HP | 50 | 0.984 | 17,700 ms | 3 / 1,254 |
| 101021 baseline | 2, death | 0.928 | 5,600 ms | 1 / 418 |
| 101021 low-HP | 50 | 0.995 | 5,600 ms | 1 / 418 |

These are authored-offense availability and replacement receipts, not delivered-DPS or owner-healing proof. The raw strategy stream also retains owner/minion positions, control, targets, pack IDs, and Cleanse activations; no causal movement credit or summon-damage attribution is added here.

## Frozen execution identity

| Field | Value |
|---|---|
| Experiment | `desert-strategy-01` |
| Execution source commit | `0cfa240338e364bcd7bccb499cb6301d3bdb96cb` |
| Source SHA-256 | `694ff2d3d04e78922638d5a1c57fc6bd1800b391f97e15962389223e5e9633bb` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Frozen checkout | `D:/mmo-idle/desert-strategy-01-r1/source` |
| Authoritative packet | `D:/mmo-idle/desert-strategy-01-r1/packet` |
| Worker / retries | 1 / 0 |
| Seeds | 101009 and 101021 |
| Fixture | `node-t4-desert-03` |
| World step / cap | 100 ms / 600,000 ms |
| Stop rule | First player death; otherwise cap |
| Synthetic / economy eligible | true / false |
| Packet seal | manifest `923d7f1b122e3070f7cf36b93052312eb09940639e08957401a9a9079ea9ff7e`; identity `7d35980c92eb38f53b895cc9822eae58c446a78b43376e99789ba218798c9ec6` |

The packet-specific verification passed before launch. The external dispatcher completed with exit code 0 and did not retry or alter any case. Qualification was 24/24 with zero combat observations. The preparation packet recorded a 261/275 full-suite result with 14 unrelated legacy failures reproduced on the pre-fix source; the other agent's suite repair remains separate from this frozen execution and was not a launch prerequisite.

## Ledger and aggregate work

| Metric | Value |
|---|---:|
| Planned / completed | 24 / 24 |
| New / reused | 24 / 0 |
| Failed / omitted / not run | 0 / 0 / 0 |
| Window-ended / player-died | 22 / 2 |
| Lifetime completed kills | 1,342 |
| Work HP damage | 6,707,737 |
| Work absorbed | 76,449 |
| Recorded incoming owner HP damage | 381,134.425 |

Endpoint values are same-life observations. The ten-minute cap is not thirty-minute endurance, sustainable throughput, economy proof, or a population survival probability. Boss outcomes, farming history, and older pre-fix Champion evidence remain separate from this packet.

## Evidence limits

- The cases use synthetic mature packages with declared gear, skills, and progression; they do not measure acquisition, economy, live-player behavior, multiplayer, or deployment.
- Exact dealer eligibility and path search are unavailable. Null eligibility carries the recorder's reason; it is not a zero.
- No both-engaged exposure is uninformative for strategy. Same-tick kills have no inferred order, and unfinished pairs are not treated as cleared.
- Formation targets and summon survival do not establish summon damage delivery. Conduit replacement payments are not owner incoming damage.
- Source-specific effective healing, overheal, and counterfactual damage lost are unavailable in the existing stream.

## Publication and raw evidence

Compact publication files in this directory are:

- [results-summary.json](results-summary.json) — dispatcher rows plus 12 paired comparisons, six-root assessment, Champion metadata, and publication limits.
- [resolved-builds.json](resolved-builds.json) — applied build and identity receipts.
- [identity.json](identity.json), [manifest.json](manifest.json), and [complete.json](complete.json) — execution identity and terminal receipt.
- [packet-seal.json](packet-seal.json), [packet-qualified.json](packet-qualified.json), and [qualification-complete.json](qualification-complete.json) — sealed packet and qualification references.
- [raw-inventory.json](raw-inventory.json) — retained external artifact inventory.
- [DESIGNER_DECISION.json](DESIGNER_DECISION.json) — approved formation-inheritance scope change.

The raw streams remain at `D:/mmo-idle/desert-strategy-01-r1/run-01` and were not copied into Git. Rehash validation found 0 missing paths and 0 mismatches across 386 inventory entries totaling 1,673,127,137 bytes. No deployment was performed. Publication is compact-only and does not alter the external dispatcher originals.
