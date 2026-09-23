# Corrected baseline follow-up 01 — run 01

## Short answer

The sealed one-shot combat run completed all 32 planned observations: 32/32 completed, 0 operational failures, 0 omitted, and 0 not-run. Eleven observations ended in gameplay death; they are observations, not harness failures. The run is synthetic and economy-ineligible.

The correction set improved the T1 Plains Conduit result, left T1 Cave unchanged, and left all eight T4 Mountain boss outcomes unchanged. T4 Tundra farm throughput was mixed. The T4 Volcanic breadth block remains the unresolved setup question: 11/12 packages died, and the retained telemetry shows sampled disengagement opportunities but does not isolate enough Heat cooling to support a numerical patch. No class, balance, or numerical change is automatically adopted from this run.

## Findings

1. **Coverage and integrity.** C4 completed 16/16 observations: eight Tundra farm caps and eight Mountain boss kills. C1 completed 4/4 20-minute caps. V4 completed 12/12 observations: 11 gameplay deaths and one 10-minute cap. The run used the sealed source once, in fixed preparation order, with one worker, 100 ms ticks, seeds 101009 and 101033, and no retry or adaptive intervention.

2. **C1 Root Conduit.** Plains completed 228 and 225 lifetime kills versus historical 202 and 204, with 300/600/1200-second endpoint work of 61/122/228 and 61/126/225. Cave was exactly unchanged at 12/25/52 and 11/27/54. The retained event stream records 317 Sweep activations, 718 conduit-arm events across C1/C4, 2,412 conduit deliveries across C1/C4, and 964 C1 Plains secondary-damage events totaling 8,059 splash damage. Cave exercised no offensive Technique or Technique adapter.

3. **C4 Conduit.** All eight Mountain bosses were killed with no player death at 293.3 s, 245.7 s, 111.7 s, and 109.4 s for Ritualist, Iconoclast, Idolwright, and Champion respectively; the same package results repeated under both seed labels, so they are not independent robustness evidence. Tundra farm totals were 18/23/6/28 kills for seed 101009 and 23/28/8/28 for seed 101033 for Ritualist/Iconoclast/Idolwright/Champion. Expose Weakness activated 516 times. Champion exercised the recorded owner-attacking exception: Expose activity was present, but no conduit arms were recorded in those cases. C4 farm authored offense averaged about 0.89 while boss authored offense averaged about 0.60; zero-summon and at-or-below-half-offense intervals remain evidence of availability pressure, not a universal class throughput result.

4. **V4 breadth and death causes.** Lifetime kills were 327 across the block; only Duelist seed 101033 reached its cap at 35/35 endpoint work. The 11 deaths were four ranged hits from Ashspitter Salamanders, three melee hits from Magma Salamanders, two DoT deaths from Ashspitter Salamanders, and two DoT deaths from Ember Skinks. No V4 death was attributed to a hazard. The recorder retained 1,677 Heat-present samples, including 709 with no target (70.9 s at 100 ms sampling); 329 were POST_COMBAT and 301 OUT_OF_COMBAT. It recorded 202 recovery intervals, 36 completed recoveries, and 155 intervals interrupted by the next pull. This demonstrates sampled disengagement but not isolated cooling sufficiency.

5. **Interpretation boundary.** All 32 rows pass the prepared fixed-input and initial-roster compatibility checks, but this is a correction-set comparison, not an ablation. Matching seed labels do not preserve later exposure. Historical T4 rows use source `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`; historical T1 rows use source `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`. Post-death endpoint work is `null`, not zero. The run reports synthetic combat behavior only: it does not prove economy pacing, live-play robustness, or universal class efficacy.

## Decisions

1. **Measured baseline retained.** Retain the corrected source as the measured baseline for this packet. Do not rerun, retry, reseed, repair, or add a rescue build to this sealed attempt. The C1 Plains improvement is evidence for the correction set in that fixed setup; C1 Cave and C4 boss parity are also retained as explicit non-improvements.

2. **Designer question before any rescue experiment.** The weakest repeatable C4 farm path was Idolwright / Root Conduit heavy-c at T4 GM148, +4, 45 RP: Jungle Deathfang Rapier +4, Mountain Vest/Charm/Boots T4 +4, Survivalist core, Colossus Heart relic, Defensive Stance, Expose Weakness, Second Wind, Brace, Cleanse, Break Free, and the fixed Auto-path / Step-back / Avoid-hazards / Wait-for-regen / Orbit rules. It produced 6 and 8 kills in the two 10-minute farms, with extended zero-summon or at-or-below-half-offense intervals. **Which items and setup would you use for this path in this encounter at this gear stage, and why?** That answer must be provided before a separate, explicitly approved rescue packet.

3. **No numerical patch target.** This run does not justify changing Heat decay, the 2x Heat cooling multiplier, Conduit reconstruction timing, enemy damage, or any class coefficient. The event stream has Heat gains but no separate ambient-stack-loss event, and the deaths mix melee, ranged, and DoT causes. A future patch candidate must name one field, current value, proposed value, scope, inheritance behavior, and tradeoff; this run supplies no such supported target.

## Additive class decision register

- Root Conduit: the corrected 3,500 ms reconstruction baseline is exercised here; T1 Plains Sweep delivery is measurable, while T1 Cave has no offensive Technique. No universal Root Conduit adoption follows.
- T4 Conduit: native Expose Weakness engagement and the Champion owner-attacking exception are recorded as exercised mechanisms. Boss success is retained as block evidence, not as a general throughput claim.
- V4 Heat: cooling remains a diagnostic question. No new class adoption, class exclusion, or numerical balance decision is recorded from the mixed death causes.

## Frozen execution identity

| Field | Value |
|---|---|
| Experiment / attempt | `corrected-baseline-followup-01` / `run-01` |
| Execution source | `D:/mmo-idle/corrected-baseline-followup-01/source` |
| Source commit | `22a349bf7dab6e42a412a231444fa4b8df41f28e` |
| Source tree SHA-256 | `b24ec13fc716c3a69bace754745819166569ea25499d63c1225719f65bebad68` |
| Output identity SHA-256 | `0023518c22ccdb718439d64377ca68d2a467856db0f7a135f38ce7c0e34c9a92` |
| Output manifest SHA-256 | `1235a82423b1632d4e11bda53f384c51132424e500cb10ed41cdddf08ab43a48` |
| Packet | `D:/mmo-idle/corrected-baseline-followup-01/packet` |
| Node | `v22.16.0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Seeds | `101009`, `101033` |
| Tick / worker | `100 ms` / `1` |
| Farming / boss caps | `600,000 ms` / `600,000 ms` |
| Synthetic / economy eligible | `true` / `false` |
| Retry policy | `0`; no retry or adaptive intervention |
| Terminal receipt | `planned=32, completed=32, newCompleted=32, dead=11, failed=0, omitted=0, notRun=0, qualified=0` |

The packet seal is preserved separately as `packet-seal.json`; `seal.json` seals the measured output identity and manifest. Qualification and receipt replay remain construction receipts; this run is the combat observation.

## Coverage ledger

| Block | Scope | Planned | Completed | Gameplay deaths | Operational failures | Endpoint result |
|---|---|---:|---:|---:|---:|---|
| C4 | Tundra farms + Mountain bosses | 16 | 16 | 0 | 0 | 8 farm caps; 8 boss kills |
| C1 | Plains + Cave Conduit | 4 | 4 | 0 | 0 | 4 farm caps |
| V4 | Volcanic breadth | 12 | 12 | 11 | 0 | 1 farm cap; 11 deaths |
| **Total** |  | **32** | **32** | **11** | **0** | **32 fresh observations** |

## Block summaries

### C4 — T4 Conduit breadth

The eight Tundra farms reached their ten-minute caps. Current endpoint work was:

| Package | Seed 101009 | Seed 101033 | Historical comparison |
|---|---:|---:|---|
| Ritualist / balanced-c | 9/18 | 11/23 | 9/18 and 11/25 |
| Iconoclast / light-c | 11/23 | 14/28 | 13/26 and 14/25 |
| Idolwright / heavy-c | 3/6 | 2/8 | 1/4 and 1/1 |
| Champion / heavy-b | 13/28 | 15/28 | 13/27 and 15/31 |

The eight bosses were all killed: Ritualist 293.3 s, Iconoclast 245.7 s, Idolwright 111.7 s, and Champion 109.4 s, repeated for both seed labels. C4 farm lifetime kills totaled 162. The mechanism stream recorded 516 Expose Weakness activations, 401 C4 conduit-arm events, and 1,448 C4 conduit deliveries. No ready-HP gate blocked a recorded replacement. Mean authored-offense/body/proc live fractions were approximately 0.89/0.89/0.89 for farms and 0.60/0.59/0.60 for bosses; these are availability measurements, not direct player DPS multipliers.

### C1 — Root Conduit

All four cases reached the 20-minute cap. Plains produced 61/122/228 and 61/126/225 work kills at 300/600/1200 seconds, versus historical 50/110/202 and 51/104/204. Cave produced exactly 12/25/52 and 11/27/54, matching historical endpoints. The run exercised Sweep 317 times, with 317 C1 conduit arms, 964 C1 conduit deliveries, and 964 secondary-damage events totaling 8,059 splash damage. Aggregate C1 authored live fractions were approximately 0.689; the C1 stream retained 307.4 seconds of zero-summon time and 1,697.9 seconds at or below half authored offense. These measurements do not convert to economy eligibility.

### V4 — Volcanic breadth

| Package | Seed 101009 | Seed 101033 |
|---|---|---|
| Swiftblade / Striker light-c | death at 30.5 s; 7 lifetime kills | death at 41.1 s; 9 lifetime kills |
| Avenger / Squire heavy-a | death at 131.2 s; 13 lifetime kills | death at 51.1 s; 7 lifetime kills |
| Pyromancer / Apprentice balanced-a | death at 70.8 s; 9 lifetime kills | death at 85.1 s; 15 lifetime kills |
| Melter / Slinger heavy-a | death at 87.3 s; 21 lifetime kills | death at 36.5 s; 8 lifetime kills |
| Duelist / Slinger light-a | death at 576.4 s; 117 lifetime kills | cap; 35/35 endpoint work |
| Aetherist / Spirit balanced-c | death at 52.0 s; 9 lifetime kills | death at 348.2 s; 77 lifetime kills |

Across the 12 cases, Heat reached a maximum observed stack of 39. The recorder retained 709 Heat-present/no-target samples, but sampled no-target time is not an isolated cooling experiment. Of 202 recovery intervals, 155 were interrupted by the next pull. Ambient Heat-gain events were retained; no separate ambient-stack-loss event was emitted, so exact decay attribution is unavailable.

## Full matched outcome ledger

`e=` is endpoint work kills at 300/600 seconds, or 300/600/1200 seconds for C1. A post-death endpoint is shown as `—`; it is unavailable, not zero. `life=` is lifetime kills from the raw per-observation summary. The comparison column means the fixed-input/initial-roster comparison is compatible; it does not mean the outcomes are equal.

| # | Case | Seed | Current outcome | Historical comparison |
|---:|---|---:|---|---|
| 1 | C4 Ritualist farm / balanced-c F2 | 101009 | cap at 600 s; e=9/18; life=18 | compatible; historical cap e=9/18 |
| 2 | C1 Root Conduit Plains | 101009 | cap at 1200 s; e=61/122/228; life=228 | compatible; historical cap e=50/110/202 |
| 3 | V4 Swiftblade / Striker light-c | 101009 | death at 30.5 s; e=—; life=7 | compatible; historical death |
| 4 | C4 Iconoclast farm / light-c F2 | 101009 | cap at 600 s; e=11/23; life=23 | compatible; historical cap e=13/26 |
| 5 | C1 Root Conduit Cave | 101009 | cap at 1200 s; e=12/25/52; life=52 | compatible; historical cap e=12/25/52 |
| 6 | V4 Avenger / Squire heavy-a | 101009 | death at 131.2 s; e=—; life=13 | compatible; historical death |
| 7 | C4 Idolwright farm / heavy-c F2 | 101009 | cap at 600 s; e=3/6; life=6 | compatible; historical cap e=1/4 |
| 8 | V4 Pyromancer / Apprentice balanced-a | 101009 | death at 70.8 s; e=—; life=9 | compatible; historical death |
| 9 | C4 Champion farm / heavy-b F2 | 101009 | cap at 600 s; e=13/28; life=28 | compatible; historical cap e=13/27 |
| 10 | V4 Melter / Slinger heavy-a | 101009 | death at 87.3 s; e=—; life=21 | compatible; historical death |
| 11 | C4 Ritualist boss / balanced-c B1 | 101009 | boss kill at 293.3 s | compatible; historical boss kill at 293.3 s |
| 12 | V4 Duelist / Slinger light-a | 101009 | death at 576.4 s; e=61 at 300 s; life=117 | compatible; historical death |
| 13 | C4 Iconoclast boss / light-c B1 | 101009 | boss kill at 245.7 s | compatible; historical boss kill at 245.7 s |
| 14 | V4 Aetherist / Spirit balanced-c | 101009 | death at 52.0 s; e=—; life=9 | compatible; historical cap e=64/124 |
| 15 | C4 Idolwright boss / heavy-c B1 | 101009 | boss kill at 111.7 s | compatible; historical boss kill at 111.7 s |
| 16 | C4 Champion boss / heavy-b B1 | 101009 | boss kill at 109.4 s | compatible; historical boss kill at 109.4 s |
| 17 | C4 Ritualist farm / balanced-c F2 | 101033 | cap at 600 s; e=11/23; life=23 | compatible; historical cap e=11/25 |
| 18 | C1 Root Conduit Plains | 101033 | cap at 1200 s; e=61/126/225; life=225 | compatible; historical cap e=51/104/204 |
| 19 | V4 Swiftblade / Striker light-c | 101033 | death at 41.1 s; e=—; life=9 | compatible; historical death |
| 20 | C4 Iconoclast farm / light-c F2 | 101033 | cap at 600 s; e=14/28; life=28 | compatible; historical cap e=14/25 |
| 21 | C1 Root Conduit Cave | 101033 | cap at 1200 s; e=11/27/54; life=54 | compatible; historical cap e=11/27/54 |
| 22 | V4 Avenger / Squire heavy-a | 101033 | death at 51.1 s; e=—; life=7 | compatible; historical death |
| 23 | C4 Idolwright farm / heavy-c F2 | 101033 | cap at 600 s; e=2/8; life=8 | compatible; historical cap e=1/1 |
| 24 | V4 Pyromancer / Apprentice balanced-a | 101033 | death at 85.1 s; e=—; life=15 | compatible; historical death |
| 25 | C4 Champion farm / heavy-b F2 | 101033 | cap at 600 s; e=15/28; life=28 | compatible; historical cap e=15/31 |
| 26 | V4 Melter / Slinger heavy-a | 101033 | death at 36.5 s; e=—; life=8 | compatible; historical death |
| 27 | C4 Ritualist boss / balanced-c B1 | 101033 | boss kill at 293.3 s | compatible; historical boss kill at 293.3 s |
| 28 | V4 Duelist / Slinger light-a | 101033 | cap at 600 s; e=35/35; life=35 | compatible; historical cap e=67/127 |
| 29 | C4 Iconoclast boss / light-c B1 | 101033 | boss kill at 245.7 s | compatible; historical boss kill at 245.7 s |
| 30 | V4 Aetherist / Spirit balanced-c | 101033 | death at 348.2 s; e=65 at 300 s; life=77 | compatible; historical cap e=67/124 |
| 31 | C4 Idolwright boss / heavy-c B1 | 101033 | boss kill at 111.7 s | compatible; historical boss kill at 111.7 s |
| 32 | C4 Champion boss / heavy-b B1 | 101033 | boss kill at 109.4 s | compatible; historical boss kill at 109.4 s |

The full structured comparison, including exact observation IDs, fixed-input checks, current outcome objects, historical outcome objects, and source references, is in `historical-comparison.json`.

## Evidence and publication limits

- The raw streams remain external under `D:/mmo-idle/corrected-baseline-followup-01/run-01`. The raw inventory contains 467 entries totaling 332,980,288 bytes. No JSONL stream is committed here.
- `complete.json` is the terminal execution receipt. The receipt reports `qualified=0`; qualification is not being used as combat evidence.
- Owner HP/barrier, endpoint work, and lifetime work are distinct measurements. Boss rows have boss-kill evidence rather than farm endpoints.
- The run did not measure economy rewards, acquisition time, live-player behavior, or a controlled Heat-decay intervention. Full-suite status is unchanged from preparation; no full suite was rerun as part of this sealed attempt.
- The duplicate boss timings under the two seed labels are retained as observed and should not be treated as two independent robustness samples.
