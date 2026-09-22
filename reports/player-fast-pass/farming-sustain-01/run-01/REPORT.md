# Farming sustain 01 — run 01

## Scope and status

This is the sealed A/B run from `farming-sustain-01`, executed once and sequentially at:

- execution source: `d056896dffd62dc24f0d13ead7b887e61d357006`
- source SHA-256: `75dc1afaaed8a676568d1efedf4895540ebd1fadff56c9e8e6f063c6eb59ed77`
- seed: `101003`
- World step: `100 ms`
- cap: `300,000 ms`
- planned/completed/failed/not-run: `20 / 20 / 0 / 0`

All rows have terminal completion markers, child process status `0`, no signal, and no child error. The raw inventory contains 60 hashed evidence files; all 60 paths exist and recompute to the recorded SHA-256 values. This is synthetic mature-package combat evidence, `economyEligible=false`, and remains local/unpublished.

## Measured rows

`window-ended` means the fixed 300-second window ended; it is not a claim of sustainable economy throughput. `player-died` rows stop at the first player death as specified.

| Identity / fixture | Mountain arm | Volcanic arm |
| --- | --- | --- |
| Skirmisher / Volcanic | 24 kills, death at 105.0 s | 76 kills, window-ended; min HP 33.0% |
| Skirmisher / Tundra | 24 kills, window-ended; min HP 27.2% | 24 kills, window-ended; min HP 17.7% |
| Knight / Volcanic | 6 kills, death at 29.9 s | 60 kills, window-ended; min HP 35.3% |
| Knight / Tundra | 17 kills, window-ended; min HP 28.2% | 18 kills, window-ended; min HP 45.8% |
| Ember mage / Volcanic | 23 kills, death at 118.0 s | 56 kills, window-ended; min HP 40.5% |
| Ember mage / Tundra | 15 kills, window-ended; min HP 6.1% | 19 kills, window-ended; min HP 31.3% |
| Conduit / Graveyard | 35 kills, window-ended | 40 kills, window-ended |
| Avenger / Graveyard | 36 kills, death at 182.1–184.3 s* | 51 kills, window-ended |

There were 15 window-ended rows and 5 death-shortened rows. The three T3 Mountain arms all died on the Volcanic fixture; their paired Volcanic arms reached the cap. On Tundra, all six T3 rows reached the cap, with Volcanic arms producing 0/1/4 additional kills for Skirmisher/Knight/Ember mage respectively. `*` Avenger Mountain static died at 182.1 s and the Recuperating policy row at 184.3 s; both completed 36 kills.

The T3 Volcanic arms also showed observed kill-window time while the paired Mountain arms showed none: 184.8/178.7/157.8 seconds on Volcanic for Skirmisher/Knight/Ember mage on the Volcanic fixture, and 91.2/70.2/74.1 seconds on Tundra. These are observed posture-window measurements, not counterfactual productive damage.

## Charm, barrier, and RP readback

The Volcanic charm raised recorded Recovery while replacing the Mountain barrier slot:

| Package | Mountain Recovery → Volcanic Recovery | Mountain initial barrier → Volcanic initial barrier | Static unused RP | Policy unused RP |
| --- | ---: | ---: | ---: | ---: |
| T3 Skirmisher | 15 → 21 | 146 → 0 | 5 | n/a |
| T3 Knight | 15 → 21 | 132 → 0 | 5 | n/a |
| T3 Ember mage | 15 → 21 | 134 → 0 | 2 | n/a |
| T4 Conduit | 25 → 34 | 246 → 0 | 11 | 6 |
| T4 Avenger | 19 → 26 | 259 → 0 | 7 | 2 |

The barrier figures above are initial owner barrier readbacks, not cumulative absorption totals. Terminal owner barrier was zero for every Volcanic arm, for both T4 Mountain arms, and for the three T3 Mountain deaths; the surviving Tundra Mountain rows ended at 146 (Skirmisher), 0 (Knight), and 97.1 (Ember mage).

## Recuperating policy

There were four policy rows: Conduit and Avenger for Mountain and Volcanic. Only one row crossed the native `HP <= 25%` trigger: T4 Avenger Mountain Recuperating. It spent 1,800 ms in Recuperating and recorded 700 ms of cooldown-delayed return exposure, still dying at 184.3 s with the same 36 kills as static. The death cause changed from a Gravewright ranged hit in static to a five-stack Plague Hound DoT in the policy row; this single paired observation does not establish a survival improvement.

The other three policy rows had no trigger opportunity. Conduit Mountain and Volcanic stayed above roughly 49% minimum owner HP; Avenger Volcanic stayed above 41%. Their static and policy rows were identical in observed kills, survival, and sustain metrics. The policy cost reserved 5 additional RP, reducing unused RP from 11 to 6 for Conduit and from 7 to 2 for Avenger.

## Conduit evidence

Conduit static and policy arms were identical within each charm because Recuperating never activated. The Volcanic arms completed 40 kills versus 35 for Mountain, with 97.21% versus 95.17% live authored offense fraction. Volcanic recorded two successful replacements and 344 HP paid; Mountain recorded four replacements and 688 HP paid. Volcanic had 0 seconds of zero-summon exposure versus 4.4 seconds for Mountain, and 9.3 versus 15.6 seconds at or below half authored offense. These are formation availability and replacement receipts, not delivered-DPS or owner-healing proof.

## Limits and disposition

- The run uses one sealed seed and synthetic mature ownership; it is not acquisition, economy, or live-play evidence.
- Sustain samples are 100 ms post-tick samples. Transition times can fall within a tick and kill-window refresh counts are lower bounds.
- Source-specific Recovery healing, overheal, and counterfactual damage lost are unavailable. Existing heal totals are recorded applications only.
- Contact indicators are limited to recorded static-feature sample contacts; they do not provide continuous contact duration or complete incoming-target contact.
- A fixed-window cap and a death-shortened kill rate are not sustainable-throughput proofs.

Measured next decisions, without automatic follow-on:

1. Treat the Volcanic charm as a strong node-specific T3 sustain/throughput signal in this seed, while keeping the barrier tradeoff explicit and avoiding a universal charm ranking.
2. Do not promote the low-HP Recuperating policy as a general fix: it activated once, consumed 5 RP, added no kills, and did not prevent the paired Avenger death.
3. Keep the Conduit result focused on continuous formation availability and replacement cost; the policy itself was not exercised in this run, so no C treatment or balance edit is justified by these rows.
