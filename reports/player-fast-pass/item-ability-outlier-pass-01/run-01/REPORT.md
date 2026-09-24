# Item and ability outlier pass 01 — run 01

Status: terminal and reconciled on 2026-09-24. The sealed matrix ran exactly once, sequentially, in the prescribed order. No source, packet, dependency, retry, extension, adaptive balance, live-source import, or repair change was made during execution. Nothing is adopted or merged by this packet.

This is synthetic mature-package farming evidence. It is not acquisition, economy, universal balance, browser/live-play, or production-deployment evidence.

## Scope and identity

- Execution source: `D:/mmo-idle/item-ability-outlier-pass-01/source`, commit `0d392fdddaec7ed31876699589f291c8c840a5e5`.
- Execution source tree SHA-256: `5e75853f8c701178096c1d7dfb91bde01c2e1800034e5342e9e5a324104b23b1`.
- Gameplay baseline: `1980a6b06d6b483c0310ee86d9e2d464dedba8df`.
- Packet: `D:/mmo-idle/item-ability-outlier-pass-01/packet`.
- Qualification and receipt replay: `D:/mmo-idle/item-ability-outlier-pass-01/qualification` and `D:/mmo-idle/item-ability-outlier-pass-01/receipt-check`.
- Fresh run: `D:/mmo-idle/item-ability-outlier-pass-01/run-01`.
- Hitboxes SHA-256: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`.
- World step: 100 ms; observation cap: 600,000 ms; endpoints: 300,000 and 600,000 ms; seeds: 101009 and 101033.
- Publication checkout: `D:/iaop1pub`, branch `codex/item-ability-outlier-pass-01-packet`.

The run completed 44/44 primary rows: 44 completed, 0 deaths, 0 failed, 0 omitted, 0 not-run, and 0 retries. Every row ended at the fixed window boundary with `outcome=window-ended`; there were no boss lives. Launch was `2026-09-24T09:23:46.889Z`; runner wall time was 1,054,371 ms (17m 34.371s). The external raw inventory contains 674 hashed entries. Raw JSONL remains outside this compact publication at the fresh run path.

## Findings

### Mobility candidates D and S

The matched endpoint work below is `kills at 300,000 / kills at 600,000`; the final damage column is HP damage at 600,000 ms.

| Comparison | Seed | Control work | Candidate work | Control → candidate HP damage | Control → candidate min HP | Control → candidate active fraction |
|---|---:|---:|---:|---:|---:|---:|
| D, desert-ritualist | 101009 | 21 / 44 | 21 / 44 | 204,386 → 204,386 | 0.9388 → 0.9388 | 0.1858 → 0.1858 |
| D, desert-ritualist | 101033 | 21 / 40 | 21 / 40 | 206,064 → 206,064 | 0.9388 → 0.9388 | 0.1730 → 0.1730 |
| D, desert-ranger | 101009 | 24 / 47 | 23 / 49 | 216,195 → 219,073 | 0.7070 → 0.7070 | 0.2318 → 0.2372 |
| D, desert-ranger | 101033 | 25 / 51 | 27 / 55 | 220,829 → 213,278 | 0.7070 → 0.7070 | 0.2217 → 0.2509 |
| S, swamp-t2 | 101009 | 18 / 36 | 18 / 37 | 34,675 → 35,715 | 0.4963 → 0.4628 | 0.4907 → 0.4864 |
| S, swamp-t2 | 101033 | 18 / 37 | 18 / 37 | 35,892 → 35,892 | 0.4884 → 0.4884 | 0.4585 → 0.4585 |
| S, swamp-t3 | 101009 | 21 / 44 | 27 / 54 | 61,161 → 60,303 | 0.7871 → 0.6997 | 0.4088 → 0.4164 |
| S, swamp-t3 | 101033 | 23 / 43 | 23 / 41 | 55,998 → 55,661 | 0.7852 → 0.8373 | 0.4671 → 0.4654 |

D is exact on both Ritualist pairs and mixed on both Slinger/Duelist pairs. S is near-neutral on T2 and mixed on T3: the +10-kill T3 result at seed 101009 is opposed by −2 at seed 101033. These are not universal mobility or resistance effects.

The candidate values were the sealed D curve `.20/.30/.40 -> .20/.25/.30` for Desert T2/T3/T4 kiting, and the sealed S curve `T1 unchanged; T2 .45 -> .40 with upgrade deltas .03/.03/.02/.03/.02 -> .02 each; T3 .62 -> .50 with deltas unchanged`. At +5 the declared T1/T2/T3 values are `.40/.50/.60`. The consumer is the mobility passive, not base speed or root/control duration.

Mobility exposure was measured from 1,000 ms samples, not inferred from the passive ratio. The T4 desert-ranger rows had 571/575 seconds of sampled Tundra Chill at seed 101009 and 580/573 seconds at seed 101033, with no sampled `Careful Footing` rows. Swamp T2 had 100/104 and 77/77 seconds of sampled root/slow exposure. Swamp T3 had 10/24 and 17/14 seconds of sampled root/slow exposure, with `Careful Footing` sampled for 26/31 and 34/36 seconds. This is sampled uptime; it is not continuous contact or exact counterfactual damage lost.

### Arcanist candidate A

A changed Technique power `.20 -> .30`; cooldown reduction remained `.20`. The table is `k600 / HP damage600 / minimum HP fraction`.

| Cell | Seed | Current | Candidate A | Tempered |
|---|---:|---:|---:|---:|
| Reverb | 101009 | 20 / 108,979 / 0.7050 | 25 / 119,276 / 0.7050 | 21 / 114,675 / 0.7242 |
| Reverb | 101033 | 23 / 110,343 / 0.7050 | 19 / 114,604 / 0.7050 | 22 / 109,318 / 0.7242 |
| Idolwright | 101009 | 28 / 146,378 / 0.5501 | 27 / 156,803 / 0.5501 | 25 / 141,970 / 0.5499 |
| Idolwright | 101033 | 28 / 152,208 / 0.5501 | 30 / 153,892 / 0.5501 | 29 / 142,306 / 0.5499 |

Candidate A increased actual player-source AOE HP damage over current in all four matched rows: Reverb 53,968/50,639 versus 47,617/47,982, and Idolwright 88,220/89,784 versus 80,558/85,963. Candidate cast delivery was 56/54 fired with 9/11 aborts for Reverb and 57/57 fired with 6/2 aborts for Idolwright. The delivered AOE totals are event-stream totals, not exclusive Technique attribution; Idolwright did not emit labeled empowered player hits. A therefore has a delivered-effect signal, but no uniform completed-work signal: Reverb is +5 then −4 kills versus current, while Idolwright is −1 then +2.

### Ability choice

Power Strike and Quick Strike are whole-ability opportunity arms, not equal-budget optimal-loadout claims. The Quick arm retained one additional free RP. Values are `k600 / HP damage600`.

| Cell | Seed | Power Strike | Quick Strike | Delivered-event readout |
|---|---:|---:|---:|---|
| Reverb | 101009 | 20 / 100,701 | 22 / 106,618 | Power 56 fired/10 aborted, 44,508 AOE HP; Quick 238 armed, 72 empowered hits |
| Reverb | 101033 | 25 / 104,075 | 25 / 108,486 | Power 60/3, 48,968 AOE HP; Quick 232 armed, 71 empowered hits |
| Idolwright | 101009 | 23 / 131,745 | 19 / 112,589 | Power 47/10, 55,783 AOE HP; Quick 186 armed, no labeled empowered hits |
| Idolwright | 101033 | 21 / 128,025 | 16 / 109,880 | Power 46/16, 54,636 AOE HP; Quick 183 armed, no labeled empowered hits |

Quick wins both Reverb work rows; Power wins both Idolwright work rows. The native formation/summon delivery and missing exclusive attribution prevent turning the activation totals into a general ability ranking. No ability-number patch is supported by this contrast.

### Rites

The fresh transition streams contain real opportunity. Counts below are true phase changes, not sustain-log row counts. `OOC entries / joins` is followed by total OOC milliseconds and median OOC episode duration.

| Rite contrast | Seed | No Rite work/damage | Rite work/damage | No Rite OOC | Rite OOC |
|---|---:|---:|---:|---:|---:|
| Swift Repose | 101009 | 20 / 100,701 | 19 / 102,450 | 20/21; 68,900 ms; med 2,700 | 19/20; 72,200 ms; med 2,900 |
| Swift Repose | 101033 | 25 / 104,075 | 20 / 102,310 | 23/24; 74,900 ms; med 2,700 | 20/21; 82,000 ms; med 3,900 |
| Ability Reprieve | 101009 | 20 / 100,701 | 21 / 102,660 | 20/21; 68,900 ms; med 2,700 | 18/19; 68,800 ms; med 2,900 |
| Ability Reprieve | 101033 | 25 / 104,075 | 21 / 103,929 | 23/24; 74,900 ms; med 2,700 | 20/21; 59,700 ms; med 3,100 |

All measured entries into `OUT_OF_COMBAT` had zero switch cooldown. Remaining switch cooldown at a join was 0–200 ms in seed 101009 and 0 ms in seed 101033. Player-source Power Strike delivery was 56/57 fired with 10/12 aborts for Swift at seed 101009, 60/57 with 3/9 at seed 101033, and 56/57 with 10/15 for Ability Reprieve at seed 101009, 60/60 with 3/11 at seed 101033. The work outcomes are mixed or negative despite a real opportunity, so no Rite tuning is proposed.

## Decisions

1. Keep D, S, and A as reviewable candidate proposals only; do not merge, deploy, or adopt them from this run.
2. Do not select a universal Power Strike/Quick Strike winner. Preserve the fixture-specific result and the budget/opportunity distinction.
3. Do not tune Swift Repose or Ability Reprieve from these rows. Their boundary opportunities were measured, but the contrasts do not support a general change.
4. Blood Offering remains the separate prior retirement proposal; this run did not re-open or alter it.

The selective dispositions, current/candidate values, consumers, counterexamples, source identities, and adoption risks are in `PATCH_PROPOSALS.md`. No automatic follow-on experiment is authorized by this publication.

## Limits and integrity

- Death is an observation in this protocol; there were no deaths, so post-death endpoint-null behavior was not exercised. A window-ended row can still contain censored/unfinished final targets; endpoint work is not silently converted to uninterrupted throughput.
- The run is two seeds, a fixed 600-second farming window, synthetic mature ownership, no boss, no Wasteland/Volcano/economy, and no browser/live-play or full-suite claim.
- World simulation ticks are 100 ms, while samples are 1,000 ms post-tick observations. Slow and away-motion exposure is therefore resolution-limited; transition times may fall within a tick.
- Existing telemetry does not provide source-specific Recovery healing, overheal, or counterfactual damage lost. Aggregate event totals are not exclusive Technique attribution.
- Qualification and receipt replay were zero-combat preparation checks. The terminal run itself is the only fresh combat evidence here.
- The raw JSONL histories remain external under `D:/mmo-idle/item-ability-outlier-pass-01/run-01`; `raw-inventory.json` is an inventory, not a raw archive.

The compact publication includes the terminal, source, and applied receipts, copied immutable identity/manifest/complete files, and the 674-entry external raw inventory.
