# T3 Tundra class/frame recovery — run 02

## Short answer

The replacement sealed run completed all 52 new observations in the published order: 52/52 completed, 0 failed, 0 omitted, 0 not run, and 0 reused. Forty-eight lives reached the 600,000 ms cap; four ended in player death. The run recorded 1,806 completed kills, 3,897,164 HP damage, 66 unfinished targets, and 60 target-regain events.

This is synthetic, fixed-fixture combat evidence (`economyEligible=false`), not live-player, acquisition, economy, deployment, or universal balance evidence. A cap-ended life is finite survival through 600,000 ms, not indefinite sustain.

The 36 primary rows cover 18 identities over seeds 101009 and 101021. The 16 alternative rows are eight matched arms over the same two seeds. `run-01` remains separate: it has zero accepted observations, one operationally censored row, and 51 not run. Its preserved 42 kills are not reused here.

## Five findings

1. All four deaths were ranged Rime Caster deaths in `node-t3-tundra-03`. Three were primary observations and one was the A2 alternative. The deaths occurred at 36.2 s, 123.9 s, 453.9 s, and 534.5 s; the last used Rime Caster's `Frostbind`.

2. Primary survival was frame-sensitive in this fixed Tundra fixture: light was 12/12 cap-ended, heavy was 11/12, and balanced was 10/12. The two early deaths were `breadth-t3-apprentice-balanced`; `breadth-t3-spirit-heavy` lost one seed late at 534.5 s.

3. The primary rows produced 1,248 kills versus 558 for the alternatives. Within the primary set, `breadth-t3-spirit-light` produced 120 kills across the two seeds, followed by spirit-balanced at 100 and striker-light at 83. These are fixed two-seed package observations, not a universal class or frame ranking.

4. Alternatives were mostly cap-ended but materially package-specific: 15/16 alternatives reached the cap. W4, W6, A3, W2, W3, W1, and W5 had no deaths; A2 improved the apprentice-balanced seed-101009 life from 2 to 22 kills but still died at 453.9 s, while its seed-101021 row cap-ended at 34 kills.

5. The cap survivors retain delivery and terminal-pressure signals rather than an indefinite-sustain claim. Across all rows there were 66 unfinished targets and 60 target-regain events. Conduit primary rows all cap-ended but produced 42–57 kills per identity across two seeds; that is useful delivery context, not delivered-DPS, economy, or acquisition proof.

## Three decisions / designer questions

1. Do not select a universal class, frame, weapon, ability, charm, or alternative from this packet. Retain both primary and matched-alternative receipts as local Tundra references; keep Squire Slam excluded.

2. If a follow-up is authorized, review the Rime Caster/ranged-pressure path and the two `apprentice-balanced` primary deaths before changing coefficients. This report does not authorize a broad retune or a new crossed campaign.

3. Decide separately whether the Conduit delivery signal merits a narrow instrumentation or package question. Do not convert cap survival or the existing Conduit projection into indefinite sustain or economy evidence.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `t3-tundra-class-frame-01` |
| Attempt | `run-02` |
| Execution source commit | `7d0dadb2b4397141c5a654ab9bb658871c56147b` |
| Execution source SHA-256 | `202d007f010df4380680f420a540f63fc911fe98be6d03f800f20c47b164a18d` |
| Identity SHA-256 | `e7eb17a12715a19975de72a503b80df828a1aea1a64ef5658054276874d735e2` |
| Manifest SHA-256 | `5615531632c9604c8fb8d3be41a13fa3e852d80ebea5ef1cd4277dd62af34aef` |
| Seal SHA-256 | `6edfadb1cf018ff9f6318564c4030eef2bd5539eaa3b8bdbe104eaa8fe6a4240` |
| Qualification / receipt-check receipts SHA-256 | `36e04cbd8a26aa6855339fb0eb076ab84b97bd31d464bdc691dcb620f669a63f` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Frozen source | `D:/t3r/src` |
| Packet | `D:/t3r/packet` |
| Raw execution root | `D:/t3r/run-02` |
| Node | `v22.16.0` |
| Fixture | `node-t3-tundra-03` |
| Seeds | `101009`, `101021` |
| Step / cap | `100 ms` / `600,000 ms` |
| Stop rule | First player death; otherwise cap |
| Worker / retries | One worker / zero retries |
| Synthetic / economy eligible | `true` / `false` |
| Baseline boundary | Movement-only Hamstring; separate Heat work excluded |
| Excluded package | Squire Slam |

The exact Luna command first verified the fixed checkout, source, runtime, hitboxes, ledger, and receipt hashes, then launched the only combat run. The dispatcher exited 0 after all 52 rows. No source, packet, package, seed, retry, requalification, reseal, or adaptive change was made during execution.

## Reconciled ledger

| Scope | Planned | New completed | Failed | Omitted | Not run | Reused |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Primary rows | 36 | 36 | 0 | 0 | 0 | 0 |
| Alternative rows | 16 | 16 | 0 | 0 | 0 | 0 |
| Total | 52 | 52 | 0 | 0 | 0 | 0 |

| Outcome | Rows |
| --- | ---: |
| `window-ended` at 600,000 ms | 48 |
| `player-died` | 4 |

The run-level completion receipt is `complete.json`. The machine-readable row contract is `results-summary.json`; it retains the identity, arm, seed, measured source, outcome, elapsed time, endpoints, intervals, work, unfinished targets, target-regain count, minimum HP fraction, Runic Points, death evidence, Conduit projection where applicable, raw evidence directory, and initial ecology hash for every row.

## Primary identities

Each seed cell is `terminal @ elapsed; completed kills`. `cap` means `window-ended` at 600,000 ms; `death` means first player death. `unfinished/regain` is summed across the two seed rows. `min HP` is the minimum observed HP fraction across both rows. The full `work` object, including HP damage and progress gaps, remains in `results-summary.json`.

| Primary identity | Seed 101009 | Seed 101021 | Total kills | Unfinished / regain | Min HP |
| --- | --- | --- | ---: | ---: | ---: |
| `breadth-t3-apprentice-balanced` | death @ 36.2 s; 2k | death @ 123.9 s; 8k | 10 | 2 / 0 | 0.000 |
| `breadth-t3-apprentice-heavy` | cap @ 600.0 s; 39k | cap @ 600.0 s; 42k | 81 | 4 / 6 | 0.200 |
| `breadth-t3-apprentice-light` | cap @ 600.0 s; 43k | cap @ 600.0 s; 43k | 86 | 2 / 1 | 0.030 |
| `breadth-t3-conduit-balanced` | cap @ 600.0 s; 22k | cap @ 600.0 s; 24k | 46 | 2 / 0 | 0.714 |
| `breadth-t3-conduit-heavy` | cap @ 600.0 s; 18k | cap @ 600.0 s; 24k | 42 | 2 / 0 | 0.481 |
| `breadth-t3-conduit-light` | cap @ 600.0 s; 30k | cap @ 600.0 s; 27k | 57 | 2 / 0 | 0.969 |
| `breadth-t3-slinger-balanced` | cap @ 600.0 s; 28k | cap @ 600.0 s; 40k | 68 | 5 / 11 | 0.317 |
| `breadth-t3-slinger-heavy` | cap @ 600.0 s; 20k | cap @ 600.0 s; 24k | 44 | 10 / 18 | 0.189 |
| `breadth-t3-slinger-light` | cap @ 600.0 s; 45k | cap @ 600.0 s; 44k | 89 | 2 / 0 | 0.301 |
| `breadth-t3-spirit-balanced` | cap @ 600.0 s; 50k | cap @ 600.0 s; 50k | 100 | 1 / 0 | 0.262 |
| `breadth-t3-spirit-heavy` | death @ 534.5 s; 36k | cap @ 600.0 s; 40k | 76 | 2 / 0 | 0.000 |
| `breadth-t3-spirit-light` | cap @ 600.0 s; 59k | cap @ 600.0 s; 61k | 120 | 1 / 0 | 0.171 |
| `breadth-t3-squire-balanced` | cap @ 600.0 s; 31k | cap @ 600.0 s; 30k | 61 | 2 / 0 | 0.504 |
| `breadth-t3-squire-heavy` | cap @ 600.0 s; 33k | cap @ 600.0 s; 30k | 63 | 1 / 0 | 0.581 |
| `breadth-t3-squire-light` | cap @ 600.0 s; 36k | cap @ 600.0 s; 33k | 69 | 1 / 0 | 0.464 |
| `breadth-t3-striker-balanced` | cap @ 600.0 s; 41k | cap @ 600.0 s; 39k | 80 | 0 / 0 | 0.464 |
| `breadth-t3-striker-heavy` | cap @ 600.0 s; 36k | cap @ 600.0 s; 37k | 73 | 2 / 0 | 0.605 |
| `breadth-t3-striker-light` | cap @ 600.0 s; 42k | cap @ 600.0 s; 41k | 83 | 0 / 0 | 0.437 |

## Matched alternatives

The eight alternatives below are paired with their same-identity primary package. Seeds are shown separately; no alternative is treated as a universal control. The last two columns sum the two seed rows.

| Arm | Matched identity | Seed 101009 | Seed 101021 | Total kills | Unfinished / regain | Min HP |
| --- | --- | --- | --- | ---: | ---: | ---: |
| W1 | `breadth-t3-striker-light` | cap @ 600.0 s; 40k | cap @ 600.0 s; 38k | 78 | 1 / 0 | 0.494 |
| W2 | `breadth-t3-striker-balanced` | cap @ 600.0 s; 40k | cap @ 600.0 s; 46k | 86 | 2 / 0 | 0.410 |
| W3 | `breadth-t3-striker-heavy` | cap @ 600.0 s; 35k | cap @ 600.0 s; 36k | 71 | 2 / 0 | 0.605 |
| W4 | `breadth-t3-squire-heavy` | cap @ 600.0 s; 47k | cap @ 600.0 s; 49k | 96 | 0 / 0 | 0.581 |
| A2 | `breadth-t3-apprentice-balanced` | death @ 453.9 s; 22k | cap @ 600.0 s; 34k | 56 | 6 / 8 | 0.000 |
| W5 | `breadth-t3-slinger-balanced` | cap @ 600.0 s; 13k | cap @ 600.0 s; 15k | 28 | 11 / 14 | 0.295 |
| W6 | `breadth-t3-conduit-balanced` | cap @ 600.0 s; 23k | cap @ 600.0 s; 25k | 48 | 2 / 0 | 0.943 |
| A3 | `breadth-t3-spirit-balanced` | cap @ 600.0 s; 46k | cap @ 600.0 s; 49k | 95 | 1 / 2 | 0.542 |

## Death and terminal evidence

| Identity / arm | Seed | Time | Kills | Cause | Terminal owner | Unfinished / regain |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| apprentice-balanced / primary | 101009 | 36.2 s | 2 | Rime Caster, ranged, 148.5 damage | 0 / 344 HP | 1 / 0 |
| apprentice-balanced / primary | 101021 | 123.9 s | 8 | Rime Caster, ranged, 148.5 damage | 0 / 344 HP | 1 / 0 |
| apprentice-balanced / A2 | 101009 | 453.9 s | 22 | Rime Caster, ranged, 148.5 damage | 0 / 344 HP | 2 / 3 |
| spirit-heavy / primary | 101009 | 534.5 s | 36 | Rime Caster `Frostbind`, ranged, 143 damage | 0 / 358 HP | 1 / 0 |

For cap-ended rows, the terminal owner and minimum HP fraction are available per observation in `results-summary.json`; a cap is not evidence that HP pressure disappeared or that the package can run indefinitely.

## Evidence boundaries and publication

`run-01` is not pooled with this recovery. It used the old failed execution boundary and its accepted-observation count remains zero. Run-02 uses movement-only Hamstring, excludes Squire Slam, preserves production Conduit R2/session-continuity/native owner-target inheritance, and excludes the separate Heat work.

The raw case streams remain at `D:/t3r/run-02`. `raw-inventory.json` records 734 raw files totaling 247,246,889 bytes with per-file SHA-256 values. The compact publication contains the required report, result rows, resolved build receipts, source identity, manifest, seal, completion receipt, and raw inventory, plus the qualification and receipt-check completion markers. No raw stream was copied into Git.

The result is synthetic and economy-ineligible. It does not establish live-player behavior, item acquisition, economy impact, deployment readiness, or a universal ranking. No browser/live playtest, full repository suite, deployment, Heat test, or automatic follow-on campaign was performed.
