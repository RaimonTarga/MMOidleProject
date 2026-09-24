# Subsystem patch candidate 01 — run-01

## Outcome

The frozen combined regression completed once, in the sealed order, with 24/24 fresh combat observations. All 24 rows ended by the 600,000 ms window; there were no deaths, entry or infrastructure failures, omissions, retries, or unstarted rows.

This is synthetic, fixed-build regression evidence only. The sealed manifest marks the run `synthetic=true` and `economyEligible=false`. No merge to `develop`, deployment, browser verification, or live-player verification was performed.

| Field | Result |
|---|---:|
| Planned / completed / new | 24 / 24 / 24 |
| Control / candidate cells | 12 / 12 |
| Deaths / failures / omitted / not-run | 0 / 0 / 0 / 0 |
| Seeds | 101009, 101033 |
| Tick / life cap / endpoints | 100 ms / 600,000 ms / 300,000 and 600,000 ms |
| Workers / retries | 1 / 0 |
| Wall elapsed | 572,487 ms |
| Terminal source commit | `fa72a310be573d167474f36b393edb38e747398d` |

`complete.json` reports `stopReason=null`, `combatObservations=24`, and no failure. The final run directory contains 24 child directories with terminal `complete.json` artifacts and no `failed.json`.

## Source and packet identity

| Source | Commit | Git tree |
|---|---|---|
| Starting `develop` | `2930d58fdd008329027e93be8564669bed461452` | `e552634994299644d1b81d306c1c6302a41c342d` |
| Frozen control | `48951bebb60400fc5a6a420f46fe96bb5cb2f546` | `8625e38c2d1f222596e61b2b6ccfebf22a06367c` |
| Frozen candidate | `fa72a310be573d167474f36b393edb38e747398d` | `209a6c855155d127e6018d78843937daec488dd7` |

The candidate source contains the Desert curve `20%/25%/30%`, the Swamp curve `25–40%`, `40–50%`, `50–60%`, Arcanist Technique Power `30%` with cooldown reduction unchanged at `20%`, and Blood Offering retirement/compatibility handling. The exact candidate diff is `candidate.diff` (SHA-256 `9CEBBEC23F767CCC69522F6CBCF2642779F7CFE709EA30E96643C7EA9D13BEEF`).

The sealed packet and receipts were not edited. The run manifest SHA-256 is `3CE974A42F40377E607F222EFF4054430FF5AEC99222CE1AFDDF5FB39E65D581`. The actual run `resolved-builds.json` SHA-256 is `15D9842F570CEDCFF52B4C9F090B3540905E79A5366D94862AD406A061A9B083`, matching the retained qualification/replay receipt identity.

## Equal-endpoint work

The table reports endpoint `work.kills` from the authoritative run stream. Both endpoints are retained in `results-summary.json`.

| Block | 300 s control → candidate | 600 s control → candidate |
|---|---:|---:|
| A — Arcanist | 47 → 47 | 99 → 101 |
| B — Desert mobility | 70 → 72 | 143 → 155 |
| C — Swamp slow exposure | 80 → 86 | 160 → 169 |

### Block A — Arcanist regression

At 600 s, delivered player-source AoE HP damage increased in all four matched pairs: Reverb seed `101009` `+6,351`, Reverb seed `101033` `+2,657`, Idolwright seed `101009` `+7,662`, and Idolwright seed `101033` `+3,821`. The aggregate was `262,120 → 282,611` (`+20,491`, about `+7.8%`). Completed kills were mixed by pair (`+5`, `-4`, `-1`, `+2`), for an aggregate `99 → 101`.

Power Strike cast starts were unchanged for Reverb; fires changed `+2` and `+1`, with aborts `-1` in both seeds. Idolwright had one extra fire in seed `101009` and two fewer in seed `101033` because its paired run had fewer starts. The delivered AoE counter is not exclusive Technique attribution. Reverb had no summon records. Idolwright had the expected single `summoner-colossus`/Idol buff at time 0 in each arm; no channel-delivery or summon-delivery anomaly was found in the event streams.

Aggregate sampled owner minimum HP was effectively unchanged (`328.00 → 328.18` mean across four observations), while recorded owner HP damage taken was lower overall (`12,298.05 → 11,099.30`). These are sampled/recorded measures, not a proof of general combat balance.

### Block B — Desert mobility regression

At 600 s, the four matched pairs produced `143 → 155` kills, while total HP damage was nearly unchanged (`654,665 → 653,176`). The prior desert-ranger package held sampled minimum HP at `304` in both seeds; kite samples changed `6 → 9` and `9 → 5`. The closing Flash package had sustained Keep Distance exposure: kite/away samples changed `328 → 291` in seed `101009` and `257 → 286` in seed `101033`. Target-contact samples decreased by `38` and `5` in those pairs.

The important counterexample is survival margin: Flash sampled minimum HP changed `270.69 → 195.97` in seed `101009` with recorded HP damage `1,201.88 → 2,669.88`, while seed `101033` changed `242.50 → 232.22` and damage `3,248.13 → 2,553.38`. No owner died. Kite/away samples are 100 ms samples, not continuous uptime, and the two seeds do not show a consistent direction.

### Block C — Swamp slow-resistance regression

The tested control/candidate values were T2 `+4: 0.56 → 0.48` and T3 `+3: 0.68 → 0.56`. At 600 s, aggregate kills changed `160 → 169`, while total HP damage was effectively flat (`187,726 → 187,571`). Sampled slow/root exposure increased as expected from the resistance compression: slow samples `182 → 194` and root samples `30 → 39`.

Per-seed survival was mixed. T2 seed `101009` changed minimum HP `135.00 → 125.89`, damage taken `7,463 → 7,883`, slow samples `96 → 99`, and roots `4 → 5`; its seed `101033` was identical. T3 seed `101009` changed minimum HP `243.40 → 211.31`, damage `1,578.40 → 2,372.30`, slow `4 → 14`, and roots `8 → 18`; seed `101033` improved minimum HP `247.99 → 259.70`, damage `1,524.30 → 1,366.20`, slow `10 → 9`, and roots `13 → 11`. Effective-motion samples while slowed are retained, but are sample-derived and unavailable for one paired T2 observation; they are not used as a standalone resistance verdict.

## Compatibility checks

At candidate commit `fa72a310`, the focused Rite tests, equipped-evolution test, `pnpm typecheck`, `pnpm build`, and `git diff --check` all passed. The build retained the existing Vite chunk-size warnings. The full test suite and browser/live-player checks were not run. `compatibility-tests.json` is the exact retained result (SHA-256 `A15472A89BD6CA321840448DE894E6FD3095CD44799D40D9434231B01316A470`).

## Evidence inventory and limits

Raw `events.jsonl`, `samples.jsonl`, guard streams, sustain transitions, conduit streams, per-cell summaries, and indexes remain external under `D:/mmo-idle/subsystem-patch-candidate-01/run-01`. `raw-inventory.json` records every retained path, byte count, and SHA-256 (file SHA-256 `710D989AD5CFAD1BF1353A2674D7AE03AFEE235185E7C201A0D0AEBA7E8B52A7`). No raw JSONL is copied into Git.

The derived summary preserves null endpoints and reports these limits: minimum HP and mobility exposure are 100 ms samples; slow/root classification is based on recorded status IDs; AoE damage is delivered player-source damage rather than exclusive Technique attribution; HP-damage gaps include recovery, travel, and non-damaging attacks; and owner HP damage excludes absorption. These observations do not establish economy eligibility, live-play behavior, or a universal winner.

## Recommendation

The four decisions are intentionally independent. See `PATCH_DECISION.md`: Arcanist is recommended for adoption, Swamp is recommended for adoption with its intended exposure tradeoff, Desert is recommended for revision because the 30% T4 endpoint has a material but seed-mixed Flash survival counterexample, and Blood Offering retirement is ready for designer review based on compatibility evidence only.
