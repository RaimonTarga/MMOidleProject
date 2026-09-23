# Encounter counterplay 01 — run 01

## Short answer

The frozen one-shot combat run completed all 24 planned observations: 24/24 completed, 21 gameplay deaths, two authoritative Mountain boss kills, one ten-minute Jungle farming survivor, and zero operational failures, omissions, or not-run rows. The execution used source SHA `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`, Node `v22.16.0`, one worker, two seeds, and `100 ms` steps. It is synthetic evidence with `economyEligible=false`; it is not live-play or acquisition evidence.

The strongest bounded responses were Mountain armor for the Light Striker Jungle package, Defensive Stance for the Light Striker Volcano arrival, and native Endure for the Balanced Apprentice Mountain boss. Mountain armor did not generalize to the Balanced Apprentice Jungle package. Brace was legally equipped and fired in Plains, but both lives died before an add kill. Detonate was legally equipped and resolved three times in Volcano, but the treatment died before Final Eruption and did not establish useful counterplay.

Conduit remained the current baseline. No enemy or ability coefficient was changed, no rescue arm was added, and no T4 combat was launched.

## Five findings

1. **J1/J2 whole-armor comparison — class-specific response.** Mountain armor was legally applied at the same +3 upgrade and the same 22/36 RP cost for J1, changing the Light Striker readback from 340/23 HP/plating to 354/29; J2 changed 330/22 to 344/29 at 25/36 RP. J1 treatment survived the full 600,000 ms window with 52 kills in seed `101009` versus control death at 129.2 s with 11 kills, and lasted 209.5 s with 16 kills in seed `101033` versus control death at 140.9 s with 10 kills. J2 did not reproduce that result: in seed `101009` control reached the 300 s endpoint with 23 kills and died at 368.2 s while treatment died at 294.0 s with 23 lifetime kills; in seed `101033` both died at about 20.5–20.7 s with one kill. **Disposition: retain the Light Striker Mountain-armor package as a credible arrival reference; do not generalize it to Balanced Apprentice.**

2. **V1 Defensive Stance — credible arrival mitigation.** The treatment was active in both seeds, with the same 24/36 RP package and the authored plating readback rising from 29 to 35. Survival extended from 16.7 s to 67.0 s in seed `101009` and from 56.8 s to 127.1 s in seed `101033`; lifetime work before death rose from 3 to 12 and from 12 to 20 kills respectively. Both treatments still died before a farming endpoint, so the result is an arrival niche rather than a ten-minute certification. **Disposition: retain Defensive Stance as a credible Light Striker Volcano reference, with its pressure tradeoff and matchup scope explicit.**

3. **M1 Endure — useful Mountain boss response.** Endure cost 34/37 RP versus 28/37 control and fired on its native behavior at 26.0, 40.0, 64.8, and 78.8 s in the treatment. In both seeds, control died at 72.4 s to the Cragbreaker impact with 87.107% boss HP removed and 1,601/12,418 HP remaining. In both treatment lives, Endure was active at the 72.4 s Cragbreaker impact (it expired at 72.8 s); the recorded hit was 195 versus the control's lethal 278.1, and the treatment killed Crag-Gorged Horn-Behemoth at 80.5 s with 256.3 owner HP remaining. **Disposition: retain Endure as a credible Balanced Apprentice Mountain-boss response; preserve the 6 RP and Guard-priority tradeoff.**

4. **P1 Brace — legal use did not open the add-sustain bridge.** Brace cost 22/30 RP versus 17/30 control and activated at 3.6 s in both treatment lives. It was therefore legally equipped and actually used, but neither arm recorded a first add kill. Treatment lived 11.5 s versus 9.7 s and removed 24.625% versus 19.075% of the Gorging Razortusk's HP; both treatment lives still ended before the designed add recovery could operate. **Disposition: ask one designer question—should the Plains opening expose a reachable add/recovery window before first death, or is this early Squire failure intended?**

5. **E1 Detonate — trigger resolution without useful encounter control.** The treatment legally owned six DoT stacks (`dot.max-stacks=6`) and the `target-max-stacks -> detonate` rule. Detonate actually resolved at 6.9, 23.9, and 40.9 s; each external adapter receipt consumed one effect for 331 damage. The treatment nevertheless died at 47.7 s with 63.322% boss HP removed and 4,204/11,462 HP remaining, before any Final Eruption cast. Control reached Final Eruption at 61.8 s, took a recorded 348 hit at 62.2 s while Endure was active, and died to 11 debt damage at 62.7 s after 87.803% HP removal. **Disposition: ask one designer question—should E1 be expected to make the Final Eruption window reachable for a Detonate package before any further numerical change is considered?**

## Legality, actual use, and useful effect

| Pair | Legally equipped | Actually used | Useful measured effect |
| --- | --- | --- | --- |
| J1 | Mountain armor +3 applied; 22/36 RP | Passive equipment present in effective readback | Yes for Light Striker: one cap survivor and longer survival in the other seed |
| J2 | Mountain armor +3 applied; 25/36 RP | Passive equipment present in effective readback | No clear Apprentice benefit: no treatment endpoint and one earlier death |
| V1 | Defensive Stance applied; 24/36 RP | Active stance in both treatment readbacks | Yes for early survival/work, but neither row reached the ten-minute cap |
| P1 | Brace applied; 22/30 RP | Native Brace activation at 3.6 s in both seeds | Not enough for the intended add sustain; first add kill remained null |
| M1 | Endure applied; 34/37 RP | Native Endure activations and active buff at Cragbreaker impact | Yes: both treatment lives killed the boss; both controls died to the same mechanic |
| E1 | Detonate plus native Brace timing; 36/37 RP | Three Detonate resolutions; Brace and Endure also activated | Partial only: the trigger fired, but the treatment died before Final Eruption |

## Matched outcome ledger

Farm lifetime kills are shown only as context for death-shortened lives. Equal-window work uses the recorded endpoints; missing post-death endpoints remain `null` and are never treated as zero.

| Pair / seed | Control | Treatment (`candidate`) |
| --- | --- | --- |
| J1 / 101009 | player-died at 129.2 s; 11 lifetime kills | window-ended at 600.0 s; 52 lifetime kills; endpoint work 25 / 52 at 300 / 600 s |
| J1 / 101033 | player-died at 140.9 s; 10 lifetime kills | player-died at 209.5 s; 16 lifetime kills |
| J2 / 101009 | player-died at 368.2 s; 23 kills at the 300 s endpoint, 27 lifetime | player-died at 294.0 s; 23 lifetime kills; no endpoint |
| J2 / 101033 | player-died at 20.5 s; 1 lifetime kill | player-died at 20.7 s; 1 lifetime kill |
| V1 / 101009 | player-died at 16.7 s; 3 lifetime kills | player-died at 67.0 s; 12 lifetime kills |
| V1 / 101033 | player-died at 56.8 s; 12 lifetime kills | player-died at 127.1 s; 20 lifetime kills |
| P1 / 101009 | bot-died at 9.7 s; 19.075% boss HP removed; no first add kill | bot-died at 11.5 s; 24.625% boss HP removed; no first add kill |
| P1 / 101033 | bot-died at 9.7 s; 19.075% boss HP removed; no first add kill | bot-died at 11.5 s; 24.625% boss HP removed; no first add kill |
| M1 / 101009 | bot-died at 72.4 s; 87.107% removed; 1,601/12,418 HP remained | boss-killed at 80.5 s; 100% removed; 256.3 owner HP remained |
| M1 / 101033 | bot-died at 72.4 s; 87.107% removed; 1,601/12,418 HP remained | boss-killed at 80.5 s; 100% removed; 256.3 owner HP remained |
| E1 / 101009 | bot-died at 62.7 s; 87.803% removed; 1,398/11,462 HP remained | bot-died at 47.7 s; 63.322% removed; 4,204/11,462 HP remained |
| E1 / 101033 | bot-died at 62.7 s; 87.803% removed; 1,398/11,462 HP remained | bot-died at 47.7 s; 63.322% removed; 4,204/11,462 HP remained |

The identical boss readbacks across the two fixed seeds are preserved as observed, not treated as broader statistical certification. The farming lives show ordinary enemy exposure and authored recovery behavior in the external streams; source-specific healing, overheal, and exclusive overkill attribution remain unavailable.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `encounter-counterplay-01` |
| Frozen execution source | `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad` |
| Source tree SHA-256 | `f81d3cc90c097c0539fc17216616f1e17bdf84d7f221a0d93a0105e6d2f75f7b` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Frozen checkout | `D:/mmo-idle/encounter-counterplay-01/source` |
| Packet | `D:/mmo-idle/encounter-counterplay-01/packet` |
| Run root | `D:/mmo-idle/encounter-counterplay-01/run-01` |
| Runtime / step | Node `v22.16.0` / `100 ms` |
| Farming / boss caps | `600,000 ms` / `300,000 ms` |
| Stop rule | first player death or authoritative boss kill; otherwise fixed cap |
| Seeds / workers / retries | `101009`, `101033` / `1` / `0` |
| Watchdogs | 5 GiB disk floor; 1 GiB host-RAM floor; 2 GiB child RSS ceiling; 5 s polling; 120 s heartbeat timeout |
| Integrated Spirit SHA | `d073dc19c4f9df9c90b4661899d2454972b2c5b3` |
| Conduit | Current baseline retained; no new combat |
| Synthetic / economy eligible | `true` / `false` |

The fixed source is the current committed baseline. Active uncommitted Heat, Hamstring, UI, and related worktree edits did not enter the execution checkout. No enemy or ability values were changed for this packet.

## Reconciliation and evidence limits

| Count | Value |
| --- | ---: |
| Planned combat observations | 24 |
| Completed combat observations | 24 |
| Gameplay deaths | 21 |
| Window-ended farm survivors | 1 |
| Authoritative boss kills | 2 |
| Operational failures | 0 |
| Omitted | 0 |
| Not run | 0 |
| Qualification packages | 24/24, zero World ticks |
| Exact receipt replays | 24/24, zero World ticks |
| Raw inventory entries | 290 |
| Raw inventory missing/byte/hash mismatches | 0 / 0 / 0 |

`complete.json` is the terminal execution receipt. Qualification and receipt replay establish construction and identity, not combat success. All large `events.jsonl`, `samples.jsonl`, and per-life streams remain outside Git at the run root; `raw-inventory.json` records and hashes them.

The experiment uses synthetic prior paid ownership and fixed progression snapshots. It does not measure acquisition time, normal affordability, live server behavior, or economy. Two seeds do not certify sibling classes or an entire biome. Ten-minute survival is not twenty-minute certification. The P1 candidate never reached an add kill, and the E1 candidate never reached Final Eruption, so those intended downstream mechanics remain unresolved rather than inferred.

## Three next decisions

1. **Retain bounded references:** carry J1 Mountain armor for Light Striker, V1 Defensive Stance for Light Striker Volcano arrival, and M1 Endure for Balanced Apprentice Mountain boss as matchup-specific references with their RP and timing costs. Do not promote them to universal winners; keep the J2 counterexample attached.
2. **Resolve P1's opening question:** decide whether the Plains encounter should expose a reachable first-add recovery window before the Squire dies, or whether the failed opening is an accepted matchup limitation. No second rescue arm is implied.
3. **Resolve E1's trigger question:** decide whether a Detonate package is expected to reach and answer Final Eruption in this fixture. If yes, authorize one exact supported encounter/automation correction for review before considering numerical changes; do not infer one from this run.

## Integrity and publication files

Raw JSONL histories are external. The compact publication bundle contains only the report, receipts, results, and the bundle-local line-ending policy.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `.gitattributes` | 74 | `39769418d3f458ffa7a06ea4005517fbdc1bafc243a9e7f21d8fe43422f1261d` |
| `complete.json` | 251 | `a795bd6c9c732028539fa35f9e75bf44002a6575ad547fbadf5a8d3f980857a7` |
| `identity.json` | 147521 | `044b8c205169d42558047f4eeaf1cb65ab1d58db9bd5cbd49bfa317e81e1d083` |
| `manifest.json` | 67312 | `226b8e2f832b3ad9cd2f8068d146ec6025bf8267ce8ea6d853a4d87699d81e12` |
| `raw-inventory.json` | 68368 | `aa21cfdf41e66e71980d372c0f6123965a3cbd11c0d31b308f90364acff6ca6f` |
| `resolved-builds.json` | 803775 | `c14add1468d954dd993329997d1957f3b74a0b732cdfe9be2c588ff6003c33b3` |
| `results-summary.json` | 64091 | `a002f54c21c21054cb7bf3e1f6b9f931fb2e2b17bb58cca6174dfcee6b7dbc7d` |
| `seal.json` | 369 | `c7f310154db635044290f0a20412aee03ef4bb7c7115679daa567bc766dcc3b7` |

Publication branch: `codex/encounter-counterplay-01-packet`. The publication checkout is separate from the frozen execution checkout; no merge, release, deployment, or force-push is authorized by this packet.
