# Class balance candidate 01 — run 01

## Short answer

The sealed comparison completed once, sequentially, with **56/56 fresh observations**, zero operational failures, zero omissions, and zero unstarted rows. The result set contains 33 fixed-window farm lives, 22 authoritative boss kills, and one valid gameplay death. This is synthetic bounded combat evidence (`economyEligible=false`), not live-play, economy, or production evidence.

The treatment effects are separable:

- **S — Spirit frame offense:** the candidate lowered the declared Light/Balanced frame offense and cadence in the readbacks. All 16 Spirit boss lives killed their bosses. Light Desert farm work fell by 9–10 lifetime kills in the two matched pairs, while T3 Swamp Light was mixed (+7 and 0 lifetime kills); both Balanced farm pairs were exact matches. The candidate therefore narrows the tested boss offense without a new boss failure, but does not produce a uniform farm result.
- **C — root-only Conduit reconstruction:** the candidate improved formation availability and most C1 farm work, and both C2 bosses were killed. It also produced one serious counterexample: the developed Cave candidate died at 986.4 s after 48 kills while its control reached the 20-minute endpoint with 52 kills. The unchanged framed N2 negative control matched exactly.
- **N1/N2:** unchanged Heavy Spirit and framed Balanced Conduit controls matched within their deterministic settings. These are regression controls, not a universal census.

No candidate is merged, deployed, or adopted by this report. The separate S/C proposals at the end are tested-candidate recommendations awaiting designer approval.

## Scope and exact treatment

S changed only the four declared frame fields in `shared/src/data/skillTree/rootsAndFrames.ts`:

| Skill | Field | Control | Tested candidate |
| --- | --- | ---: | ---: |
| `energy-light` | `attackPct` | 0.07 | 0.02 |
| `energy-light` | `attackSpeedPct` | 0.12 | 0.04 |
| `energy-balanced` | `attackPct` | 0.08 | 0.03 |
| `energy-balanced` | `attackSpeedPct` | 0.06 | 0.00 |

C changed only the root-only reconstruction tuning in `shared/src/data/summoner.ts`: effective no-frame reconstruction interval **3,500 ms → 2,500 ms**, represented by the root factor `1 → 2500/3500`. Summon offense, HP, payment ratio, safety floor, queue behavior, and all framed profiles remained unchanged.

The packet used the fixed build and initial-state inputs from the qualification receipts. It did not grant later unlocks, change gear, add Guard, add a rapier, add Wait It Out, adapt a loadout, extend a cap, add seeds, or retry a life.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `class-balance-candidate-01` |
| Control checkout | `D:/mmo-idle/class-balance-candidate-01/control` |
| Control git SHA | `dd2c06f2bca8380323bdcfe2f65add2d7d51989d` |
| Control source-tree SHA-256 | `f7f2a3fb7f2b52662a439ac027b43109b7c9750a5b0126b9d4dfd86bd4e7f957` |
| Candidate checkout | `D:/mmo-idle/class-balance-candidate-01/candidate` |
| Candidate git SHA | `5ffbfb414b62d3addc8cb485d5b149b14e7de7ca` |
| Candidate source-tree SHA-256 | `2d71fefb9922285d98971dad510089765fceaf4f282e05dbe578d9c6766c895b` |
| Runtime | Node `v22.16.0` |
| Hitbox SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Packet | `D:/mmo-idle/class-balance-candidate-01/packet-r2` |
| Qualification | `D:/mmo-idle/class-balance-candidate-01/qualification-r2` |
| Run root | `D:/mmo-idle/class-balance-candidate-01/run-01` |
| World step / stop rule | `100 ms`; first player death or authoritative boss kill |
| Farm / boss caps | `1,200,000 ms` / `300,000 ms` |
| Workers / retries | `1 / 0` |
| Watchdogs | 5 GiB disk floor; 1 GiB host-RAM floor; 2 GiB child RSS ceiling; 5 s polling; 120 s heartbeat limit |
| Synthetic / economy eligible | `true / false` |
| Publication checkout | `D:/cbc1pub`, branch `codex/class-balance-candidate-01` |
| Publication checkout baseline HEAD | `e41031ac4c8f7863117eb8f62b7ee633dab0d041` |

The packet-specific verify command passed before launch: `56 cases, source, runtime and hitboxes verified.` Qualification had already completed all 56 cases at zero World ticks; qualification was not counted as combat.

## Terminal receipt and integrity

`complete.json` is the terminal run receipt. The run summary reconciles as follows:

| Count | Value |
| --- | ---: |
| Planned | 56 |
| New completed | 56 |
| Boss-killed | 22 |
| Window-ended | 33 |
| Player-died | 1 |
| Failed | 0 |
| Omitted | 0 |
| Not run | 0 |
| Qualification rows | 56, separate zero-tick construction evidence |

The one death is `cbc-C1-op-t1-conduit-cave-t1-developed-s101009-candidate`: first death at `986,400 ms`, Cave Brute melee for 56 HP. It is a valid gameplay result, not an operational failure, and was not retried.

The raw inventory was independently rechecked after completion: **760 files, 609,148,596 bytes, 0 missing paths, 0 byte mismatches, and 0 SHA-256 mismatches**. Raw JSONL streams remain external under the run root; this publication contains compact receipts only.

The compact publication file hashes are:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `complete.json` | 251 | `d8c68d282426fbaffdd49f4f2de93c1c204a0338ca19869499efcffa653421e7` |
| `results-summary.json` | 191890 | `720953932d6fe3f43016f043323f6e9a208648ab437a3299f17500f605b18a9b` |
| `raw-inventory.json` | 226173 | `805db28520cb9d1098b833b28509005ed5768810ca1e3eb060dd3c92689dba67` |
| `resolved-builds.json` | 1704043 | `1b6dd1e1c6abd7fa98f8eedc4d098b040436b007ec34466a72d0a5e16cd2a2dc` |
| `control-identity.json` | 147821 | `fa1a412c81506fa43f72d57202d7ac0c03ef05e1561dfb4ff8723399993dc319` |
| `candidate-identity.json` | 147821 | `3de5361234cf5eea3fc51af9f0b8165839fda6cbf157cf694e37f0681dd03c05` |
| `packet-manifest.json` | 147585 | `876d247c6adda28642f2838accd53e55aac4e11268b0dd7053746d02ca1d5441` |
| `qualification-complete.json` | 253 | `7a396c70f49e73b02c0d221eaa0e874214145385a36bb577029e0fe37eefcc84` |

Every completed row retains its exact `externalSummary` path in `results-summary.json`. For raw event, sample, Conduit, and target evidence, resolve that summary's sibling artifact directory under `D:/mmo-idle/class-balance-candidate-01/run-01/<observationId>/artifacts/`. The applicable Conduit directories retain `conduit.json`, `conduit-events.jsonl`, and `conduit-snapshots.jsonl`; the inventory hashes those streams without tracking them in Git.

## Measures and interpretation rules

- Farm `work @5/@10/@20` is cumulative endpoint `work.kills` at 300,000 / 600,000 / 1,200,000 ms. The `0-5/5-10/10-20` column is derived from those endpoints; a missing post-death or beyond-cap endpoint is `—`, never zero.
- Lifetime kills are reported separately from endpoint work. A death-row lifetime total is not late-window survival evidence.
- Boss rows use authoritative boss-kill evidence and kill time. All boss rows in this packet killed their named boss; the boss progress column is therefore 1.0 for those rows.
- Owner HP/barrier is a terminal or last observed owner readback. `min HP` is the lowest sampled HP fraction. Samples are 100 ms post-tick observations.
- Conduit `HP work` is actual landed HP progress reported by the production summary. `no-summon`, `<=half-offense`, replacements, payment, and ready-HP-blocked time come from the retained `conduit.json`; they are availability and payment observations, not damage attribution or healing proof.
- No pooled class ranking, significance claim, economy conclusion, or T4 combat certification is made. The two seed labels are retained as packet labels and are not treated as guaranteed independent boss realizations.

## Coverage

| Block | Lives | Fixture and cap |
| --- | ---: | --- |
| S1 | 8 | Mature T2 Spirit Light/Balanced Forest and Mountain bosses, 5 min |
| S2 | 8 | T2 Desert-arrival Spirit Light/Balanced farm, 10 min |
| S3 | 8 | T3 Swamp Spirit Light/Balanced farm, 10 min |
| S4 | 8 | T3 Mountain-boss Spirit Light/Balanced, 5 min |
| C1 | 16 | T1 root-only Conduit Plains/Cave developed and complete, 20 min |
| C2 | 4 | T1 root-only Conduit Plains/Mountain bosses, 5 min |
| N1 | 2 | Mature Heavy Spirit Forest boss, 5 min |
| N2 | 2 | Framed Balanced Conduit Desert farm, 10 min |

## Spirit S — readback and combat result

The zero-tick readbacks show the authored frame candidate was applied once. Root T1, Heavy, energy state, discharge constants, and other mechanics remained equal. The measured composed Spirit values were:

| Path | Attack control → candidate | Attack cooldown control → candidate |
| --- | ---: | ---: |
| T2 Light | 57 → 55 | 678 → 721 ms |
| T2 Balanced | 58 → 55 | 710 → 745 ms |
| T3 Light | 60 → 58 | 659 → 699 ms |
| T3 Balanced | 61 → 58 | 689 → 721 ms |
| T4 Light readback | 60 → 58 | 659 → 699 ms |
| T4 Balanced readback | 61 → 58 | 689 → 721 ms |

S1 and S4 produced 16/16 boss kills. The mature S1 Light pairs slowed from 18.8 → 22.8 s on Forest and 43.0 → 49.7 s on Mountain; Balanced slowed from 22.2 → 22.8 s and 45.5 → 50.4 s. The T3 S4 Light pairs slowed 107.7 → 126.5 s on both seeds; Balanced slowed 85.9 → 92.9 s on both seeds. These are measured timing effects, not a universal class balance result.

The relevant encounter counterexamples remained intact rather than being hidden by the treatment:

- Stoneplate Mountain rows emitted `Stoneplate` and `Stoneplate Charge` in both arms, crossed half HP, and killed the boss. The Light control/candidate crossed half at 23.3/26.0 s and killed at 43.0/49.7 s; Balanced crossed half at 25.6/26.1 s and killed at 45.5/50.4 s. There is no measured plate-break failure.
- Crag-Gorged Horn-Behemoth rows emitted `Cragbreaker Charge` and `Cragbreaker` in both arms, and all eight S4 rows killed the boss. The candidate delay is a timing counterexample, not evidence that the candidate loses the boss counterplay.
- N1 Heavy was an exact boss-control match at 25.0 s in both arms. It does not certify every Heavy route.

S2 showed the main farm tradeoff. Light candidate lifetime work changed 51 → 41 and 50 → 41 in the two Desert seeds, with corresponding first/second five-minute work changes of 25/26 → 20/21 and 26/24 → 20/21. Balanced was identical in both seeds: 42 → 42 and 45 → 45, including endpoint work and sampled minimum HP. S3 Light was mixed: 59 → 66 in seed 101009 and 59 → 59 in seed 101033; Balanced was identical at 72 → 72 and 59 → 59. No Spirit farm row died.

### Proposed S decision

**Tested patch:** keep the exact four authored values shown at the top of this report: Light `attackPct 0.07 → 0.02`, Light `attackSpeedPct 0.12 → 0.04`, Balanced `attackPct 0.08 → 0.03`, and Balanced `attackSpeedPct 0.06 → 0.00`.

**Disposition:** propose adopting the tested S values for designer review, without merging them into `develop`. The paired effect is a bounded reduction in tested Spirit boss speed with no new boss death; the counterexamples are mixed Light farm work, identical Balanced farm rows, and unmeasured later-tier combat. The affected scope is Light/Balanced frame inheritance wherever those nodes remain selected. Remaining risk is long-window and later-frame interaction outside this 32-row Spirit allocation.

## Conduit C — availability, payment, and owner-pressure result

The readbacks changed only the root profile. The no-frame effective interval resolved 3,500 → 2,500 ms. Framed profiles remained equal; far-range root pre-floor math changed 2,975 → 2,125 ms but stayed floor-clamped at an effective 2,500 ms. No summon HP, authored offense, payment ratio, safety floor, or first-death logic changed.

C1 had 15 window-ended lives and one candidate death. In the seven surviving matched C1 pairs, candidate work was generally higher by the 20-minute endpoint; the developed Cave candidate still shows the risk boundary. It had less no-summon time and higher live authored offense than its control, but died at 986.4 s with 48 lifetime kills, zero owner HP, and 2,200 ms of ready-HP-blocked time, while the control reached 1,200 s with 52 kills and 101 HP. The terminal killer was a Cave Brute melee hit; no payment or replacement total by itself is treated as the cause.

Candidate replacement/payment effects were not uniformly free: in C1 the candidate often had more successful replacements and higher HP paid, although some Plains rows paid less than their controls. The useful result is availability/work in the fixed packages, not a general healing or throughput guarantee.

C2 killed both bosses in both arms. Plains was nearly unchanged in time (93.4 → 94.5 s) and ended at lower candidate HP (74.0 → 63.7); Mountain improved in time (156.4 → 120.6 s) and ended at higher candidate HP (95.8 → 151.1). This is a two-fixture bounded contrast, not universal Conduit boss evidence. N2 was an exact framed negative-control match: 29 lifetime kills, 13/29 endpoint work, 36.3 s no-summon, 176.9 s at/below half authored offense, 137 replacements, 1,918 HP paid, and 182/240 terminal HP in both arms.

### Proposed C decision

**Tested patch:** root-only reconstruction factor `1 → 2500/3500`, effective no-frame interval `3,500 → 2,500 ms`; no new value is proposed here.

**Disposition:** reject this tested C value for adoption in its current form because the developed Cave candidate is a serious owner-health counterexample despite improved early availability. If the designer wants to continue the shorter-reconstruction hypothesis, it requires a separately authorized revision packet; this report does not invent or auto-run a replacement number. The framed N2 match and mixed replacement/payment receipts remain useful constraints for that future decision.

## Per-case ledger

`Work @5/@10/@20` is cumulative endpoint work; the next column is the derived interval work. For boss rows, the lifetime column is the named boss-kill count.

| Pair / arm | Block | Fixture / seed | Outcome | Elapsed | Lifetime / boss kills | Work @5/@10/@20 | Intervals 0-5/5-10/10-20 | Min HP | End HP/barrier | Boss / death |
|---|---|---|---|---:|---:|---|---|---:|---|---|
| `S1-sbc-spirit-light-forest-s101009` / control | S1 | t2-forest-dungeon/101009 | boss-killed | 18.8s | 1 | —/—/— | —/—/— | 100.0% | 221/221/46 | Apex Timberclaw @ 18.8s |
| `S1-sbc-spirit-light-forest-s101009` / candidate | S1 | t2-forest-dungeon/101009 | boss-killed | 22.8s | 1 | —/—/— | —/—/— | 100.0% | 221/221/124 | Apex Timberclaw @ 22.8s |
| `S1-sbc-spirit-light-mountain-s101009` / control | S1 | t2-mountain-dungeon/101009 | boss-killed | 43.0s | 1 | —/—/— | —/—/— | 100.0% | 221/221/124 | Stoneplate Juggernaut @ 43.0s |
| `S1-sbc-spirit-light-mountain-s101009` / candidate | S1 | t2-mountain-dungeon/101009 | boss-killed | 49.7s | 1 | —/—/— | —/—/— | 100.0% | 221/221/124 | Stoneplate Juggernaut @ 49.7s |
| `S1-sbc-spirit-balanced-forest-s101009` / control | S1 | t2-forest-dungeon/101009 | boss-killed | 22.2s | 1 | —/—/— | —/—/— | 100.0% | 230/230/24.2 | Apex Timberclaw @ 22.2s |
| `S1-sbc-spirit-balanced-forest-s101009` / candidate | S1 | t2-forest-dungeon/101009 | boss-killed | 22.8s | 1 | —/—/— | —/—/— | 100.0% | 230/230/24.2 | Apex Timberclaw @ 22.8s |
| `S1-sbc-spirit-balanced-mountain-s101009` / control | S1 | t2-mountain-dungeon/101009 | boss-killed | 45.5s | 1 | —/—/— | —/—/— | 100.0% | 230/230/129 | Stoneplate Juggernaut @ 45.5s |
| `S1-sbc-spirit-balanced-mountain-s101009` / candidate | S1 | t2-mountain-dungeon/101009 | boss-killed | 50.4s | 1 | —/—/— | —/—/— | 100.0% | 230/230/129 | Stoneplate Juggernaut @ 50.4s |
| `N1-sbc-spirit-heavy-forest-s101009` / control | N1 | t2-forest-dungeon/101009 | boss-killed | 25.0s | 1 | —/—/— | —/—/— | 59.3% | 167.5/244/0 | Apex Timberclaw @ 25.0s |
| `N1-sbc-spirit-heavy-forest-s101009` / candidate | N1 | t2-forest-dungeon/101009 | boss-killed | 25.0s | 1 | —/—/— | —/—/— | 59.3% | 167.5/244/0 | Apex Timberclaw @ 25.0s |
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101009` / control | S2 | t2-desert-01/101009 | window-ended | 600.0s | 51 | 25/51/— | 25/26/— | 15.6% | 213.4/214/41.0 | — |
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101009` / candidate | S2 | t2-desert-01/101009 | window-ended | 600.0s | 41 | 20/41/— | 20/21/— | 25.3% | 214/214/48 | — |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101009` / control | S2 | t2-desert-01/101009 | window-ended | 600.0s | 42 | 19/42/— | 19/23/— | 19.7% | 222/222/53 | — |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101009` / candidate | S2 | t2-desert-01/101009 | window-ended | 600.0s | 42 | 19/42/— | 19/23/— | 19.7% | 222/222/53 | — |
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101033` / candidate | S2 | t2-desert-01/101033 | window-ended | 600.0s | 41 | 20/41/— | 20/21/— | 29.7% | 136.6/214/0 | — |
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101033` / control | S2 | t2-desert-01/101033 | window-ended | 600.0s | 50 | 26/50/— | 26/24/— | 30.2% | 214/214/13.8 | — |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101033` / candidate | S2 | t2-desert-01/101033 | window-ended | 600.0s | 45 | 23/45/— | 23/22/— | 29.0% | 222/222/121 | — |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101033` / control | S2 | t2-desert-01/101033 | window-ended | 600.0s | 45 | 23/45/— | 23/22/— | 29.0% | 222/222/121 | — |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101009` / control | S3 | t3-swamp-03/101009 | window-ended | 600.0s | 59 | 36/59/— | 36/23/— | 83.3% | 290/290/104 | — |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101009` / candidate | S3 | t3-swamp-03/101009 | window-ended | 600.0s | 66 | 38/66/— | 38/28/— | 59.2% | 290/290/139.6 | — |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101009` / control | S3 | t3-swamp-03/101009 | window-ended | 600.0s | 72 | 32/72/— | 32/40/— | 59.3% | 224.9/300/0 | — |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101009` / candidate | S3 | t3-swamp-03/101009 | window-ended | 600.0s | 72 | 32/72/— | 32/40/— | 59.3% | 224.9/300/0 | — |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101033` / candidate | S3 | t3-swamp-03/101033 | window-ended | 600.0s | 59 | 28/59/— | 28/31/— | 86.1% | 290/290/0 | — |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101033` / control | S3 | t3-swamp-03/101033 | window-ended | 600.0s | 59 | 30/59/— | 30/29/— | 36.7% | 290/290/141 | — |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101033` / candidate | S3 | t3-swamp-03/101033 | window-ended | 600.0s | 59 | 32/59/— | 32/27/— | 78.9% | 300/300/166 | — |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101033` / control | S3 | t3-swamp-03/101033 | window-ended | 600.0s | 59 | 32/59/— | 32/27/— | 78.9% | 300/300/166 | — |
| `S4-op-t3-spirit-light-mountain-boss-s101009` / control | S4 | t3-mountain-dungeon/101009 | boss-killed | 107.7s | 1 | —/—/— | —/—/— | 75.5% | 237/314/196 | Crag-Gorged Horn-Behemoth @ 107.7s |
| `S4-op-t3-spirit-light-mountain-boss-s101009` / candidate | S4 | t3-mountain-dungeon/101009 | boss-killed | 126.5s | 1 | —/—/— | —/—/— | 100.0% | 314/314/196 | Crag-Gorged Horn-Behemoth @ 126.5s |
| `S4-op-t3-spirit-balanced-mountain-boss-s101009` / control | S4 | t3-mountain-dungeon/101009 | boss-killed | 85.9s | 1 | —/—/— | —/—/— | 30.9% | 233.5/325/84 | Crag-Gorged Horn-Behemoth @ 85.9s |
| `S4-op-t3-spirit-balanced-mountain-boss-s101009` / candidate | S4 | t3-mountain-dungeon/101009 | boss-killed | 92.9s | 1 | —/—/— | —/—/— | 100.0% | 325/325/165.2 | Crag-Gorged Horn-Behemoth @ 92.9s |
| `S4-op-t3-spirit-light-mountain-boss-s101033` / candidate | S4 | t3-mountain-dungeon/101033 | boss-killed | 126.5s | 1 | —/—/— | —/—/— | 100.0% | 314/314/196 | Crag-Gorged Horn-Behemoth @ 126.5s |
| `S4-op-t3-spirit-light-mountain-boss-s101033` / control | S4 | t3-mountain-dungeon/101033 | boss-killed | 107.7s | 1 | —/—/— | —/—/— | 75.5% | 237/314/196 | Crag-Gorged Horn-Behemoth @ 107.7s |
| `S4-op-t3-spirit-balanced-mountain-boss-s101033` / candidate | S4 | t3-mountain-dungeon/101033 | boss-killed | 92.9s | 1 | —/—/— | —/—/— | 100.0% | 325/325/165.2 | Crag-Gorged Horn-Behemoth @ 92.9s |
| `S4-op-t3-spirit-balanced-mountain-boss-s101033` / control | S4 | t3-mountain-dungeon/101033 | boss-killed | 85.9s | 1 | —/—/— | —/—/— | 30.9% | 233.5/325/84 | Crag-Gorged Horn-Behemoth @ 85.9s |
| `C1-op-t1-conduit-plains-t1-developed-s101009` / control | C1 | t1-plains-03/101009 | window-ended | 1200.0s | 202 | 50/110/202 | 50/60/92 | 82.7% | 144/144/0 | — |
| `C1-op-t1-conduit-plains-t1-developed-s101009` / candidate | C1 | t1-plains-03/101009 | window-ended | 1200.0s | 221 | 55/109/221 | 55/54/112 | 85.7% | 144/144/0 | — |
| `C1-op-t1-conduit-cave-t1-developed-s101009` / control | C1 | t1-cave-02/101009 | window-ended | 1200.0s | 52 | 12/25/52 | 12/13/27 | 54.3% | 101.0/156/0 | — |
| `C1-op-t1-conduit-cave-t1-developed-s101009` / candidate | C1 | t1-cave-02/101009 | player-died | 986.4s | 48 | 15/28/— | 15/13/— | 0.0% | 0/156/0 | death 986.4s |
| `C1-op-t1-conduit-plains-t1-complete-s101009` / control | C1 | t1-plains-03/101009 | window-ended | 1200.0s | 264 | 71/133/264 | 71/62/131 | 86.9% | 150/150/0 | — |
| `C1-op-t1-conduit-plains-t1-complete-s101009` / candidate | C1 | t1-plains-03/101009 | window-ended | 1200.0s | 271 | 67/133/271 | 67/66/138 | 88.5% | 150/150/0 | — |
| `C1-op-t1-conduit-cave-t1-complete-s101009` / control | C1 | t1-cave-02/101009 | window-ended | 1200.0s | 52 | 13/26/52 | 13/13/26 | 57.5% | 164/164/0 | — |
| `C1-op-t1-conduit-cave-t1-complete-s101009` / candidate | C1 | t1-cave-02/101009 | window-ended | 1200.0s | 64 | 16/32/64 | 16/16/32 | 41.4% | 155.7/164/0 | — |
| `C1-op-t1-conduit-plains-t1-developed-s101033` / candidate | C1 | t1-plains-03/101033 | window-ended | 1200.0s | 212 | 56/108/212 | 56/52/104 | 81.5% | 144/144/0 | — |
| `C1-op-t1-conduit-plains-t1-developed-s101033` / control | C1 | t1-plains-03/101033 | window-ended | 1200.0s | 204 | 51/104/204 | 51/53/100 | 66.6% | 144/144/0 | — |
| `C1-op-t1-conduit-cave-t1-developed-s101033` / candidate | C1 | t1-cave-02/101033 | window-ended | 1200.0s | 55 | 15/28/55 | 15/13/27 | 57.8% | 156/156/0 | — |
| `C1-op-t1-conduit-cave-t1-developed-s101033` / control | C1 | t1-cave-02/101033 | window-ended | 1200.0s | 54 | 11/27/54 | 11/16/27 | 49.8% | 156/156/0 | — |
| `C1-op-t1-conduit-plains-t1-complete-s101033` / candidate | C1 | t1-plains-03/101033 | window-ended | 1200.0s | 269 | 70/139/269 | 70/69/130 | 90.8% | 150/150/0 | — |
| `C1-op-t1-conduit-plains-t1-complete-s101033` / control | C1 | t1-plains-03/101033 | window-ended | 1200.0s | 248 | 63/131/248 | 63/68/117 | 91.6% | 150/150/0 | — |
| `C1-op-t1-conduit-cave-t1-complete-s101033` / candidate | C1 | t1-cave-02/101033 | window-ended | 1200.0s | 66 | 16/32/66 | 16/16/34 | 57.6% | 164/164/0 | — |
| `C1-op-t1-conduit-cave-t1-complete-s101033` / control | C1 | t1-cave-02/101033 | window-ended | 1200.0s | 53 | 12/26/53 | 12/14/27 | 50.8% | 138.2/164/0 | — |
| `C2-op-t1-conduit-plains-boss-s101009` / control | C2 | t1-plains-dungeon/101009 | boss-killed | 93.4s | 23 | —/—/— | —/—/— | 41.1% | 74.0/144/0 | Tusked Razorback @ 93.4s |
| `C2-op-t1-conduit-plains-boss-s101009` / candidate | C2 | t1-plains-dungeon/101009 | boss-killed | 94.5s | 23 | —/—/— | —/—/— | 40.6% | 63.7/144/0 | Tusked Razorback @ 94.5s |
| `C2-op-t1-conduit-mountain-boss-s101009` / control | C2 | t1-mountain-dungeon/101009 | boss-killed | 156.4s | 1 | —/—/— | —/—/— | 23.6% | 95.8/156/0 | Crag Behemoth @ 156.4s |
| `C2-op-t1-conduit-mountain-boss-s101009` / candidate | C2 | t1-mountain-dungeon/101009 | boss-killed | 120.6s | 1 | —/—/— | —/—/— | 21.1% | 151.1/156/0 | Crag Behemoth @ 120.6s |
| `N2-op-t2-conduit-balanced-desert-t2-desert-established-s101009` / control | N2 | t2-desert-01/101009 | window-ended | 600.0s | 29 | 13/29/— | 13/16/— | 57.5% | 182.0/240/0 | — |
| `N2-op-t2-conduit-balanced-desert-t2-desert-established-s101009` / candidate | N2 | t2-desert-01/101009 | window-ended | 600.0s | 29 | 13/29/— | 13/16/— | 57.5% | 182.0/240/0 | — |

## Paired farm comparisons

| Pair | Block / identity | Fixture / seed | Control: outcome; life; work @5/@10/@20; intervals; min HP | Candidate: outcome; life; work @5/@10/@20; intervals; min HP |
|---|---|---|---|---|
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101009` | S2 / `t2-spirit-light` | t2-desert-01/101009 | window-ended; life 51; 25/51/—; 25/26/—; min 15.6% | window-ended; life 41; 20/41/—; 20/21/—; min 25.3% |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101009` | S2 / `t2-spirit-balanced` | t2-desert-01/101009 | window-ended; life 42; 19/42/—; 19/23/—; min 19.7% | window-ended; life 42; 19/42/—; 19/23/—; min 19.7% |
| `S2-op-t2-spirit-light-desert-t2-desert-arrival-s101033` | S2 / `t2-spirit-light` | t2-desert-01/101033 | window-ended; life 50; 26/50/—; 26/24/—; min 30.2% | window-ended; life 41; 20/41/—; 20/21/—; min 29.7% |
| `S2-op-t2-spirit-balanced-desert-t2-desert-arrival-s101033` | S2 / `t2-spirit-balanced` | t2-desert-01/101033 | window-ended; life 45; 23/45/—; 23/22/—; min 29.0% | window-ended; life 45; 23/45/—; 23/22/—; min 29.0% |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101009` | S3 / `t3-spirit-light` | t3-swamp-03/101009 | window-ended; life 59; 36/59/—; 36/23/—; min 83.3% | window-ended; life 66; 38/66/—; 38/28/—; min 59.2% |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101009` | S3 / `t3-spirit-balanced` | t3-swamp-03/101009 | window-ended; life 72; 32/72/—; 32/40/—; min 59.3% | window-ended; life 72; 32/72/—; 32/40/—; min 59.3% |
| `S3-op-t3-spirit-light-swamp-t3-developed-s101033` | S3 / `t3-spirit-light` | t3-swamp-03/101033 | window-ended; life 59; 30/59/—; 30/29/—; min 36.7% | window-ended; life 59; 28/59/—; 28/31/—; min 86.1% |
| `S3-op-t3-spirit-balanced-swamp-t3-developed-s101033` | S3 / `t3-spirit-balanced` | t3-swamp-03/101033 | window-ended; life 59; 32/59/—; 32/27/—; min 78.9% | window-ended; life 59; 32/59/—; 32/27/—; min 78.9% |
| `C1-op-t1-conduit-plains-t1-developed-s101009` | C1 / `t1-conduit` | t1-plains-03/101009 | window-ended; life 202; 50/110/202; 50/60/92; min 82.7% | window-ended; life 221; 55/109/221; 55/54/112; min 85.7% |
| `C1-op-t1-conduit-cave-t1-developed-s101009` | C1 / `t1-conduit` | t1-cave-02/101009 | window-ended; life 52; 12/25/52; 12/13/27; min 54.3% | player-died; life 48; 15/28/—; 15/13/—; min 0.0% |
| `C1-op-t1-conduit-plains-t1-complete-s101009` | C1 / `t1-conduit` | t1-plains-03/101009 | window-ended; life 264; 71/133/264; 71/62/131; min 86.9% | window-ended; life 271; 67/133/271; 67/66/138; min 88.5% |
| `C1-op-t1-conduit-cave-t1-complete-s101009` | C1 / `t1-conduit` | t1-cave-02/101009 | window-ended; life 52; 13/26/52; 13/13/26; min 57.5% | window-ended; life 64; 16/32/64; 16/16/32; min 41.4% |
| `C1-op-t1-conduit-plains-t1-developed-s101033` | C1 / `t1-conduit` | t1-plains-03/101033 | window-ended; life 204; 51/104/204; 51/53/100; min 66.6% | window-ended; life 212; 56/108/212; 56/52/104; min 81.5% |
| `C1-op-t1-conduit-cave-t1-developed-s101033` | C1 / `t1-conduit` | t1-cave-02/101033 | window-ended; life 54; 11/27/54; 11/16/27; min 49.8% | window-ended; life 55; 15/28/55; 15/13/27; min 57.8% |
| `C1-op-t1-conduit-plains-t1-complete-s101033` | C1 / `t1-conduit` | t1-plains-03/101033 | window-ended; life 248; 63/131/248; 63/68/117; min 91.6% | window-ended; life 269; 70/139/269; 70/69/130; min 90.8% |
| `C1-op-t1-conduit-cave-t1-complete-s101033` | C1 / `t1-conduit` | t1-cave-02/101033 | window-ended; life 53; 12/26/53; 12/14/27; min 50.8% | window-ended; life 66; 16/32/66; 16/16/34; min 57.6% |
| `N2-op-t2-conduit-balanced-desert-t2-desert-established-s101009` | N2 / `t2-conduit-balanced` | t2-desert-01/101009 | window-ended; life 29; 13/29/—; 13/16/—; min 57.5% | window-ended; life 29; 13/29/—; 13/16/—; min 57.5% |

## Paired boss comparisons

| Pair | Block / identity | Fixture / seed | Control: result; boss kill; end HP/barrier | Candidate: result; boss kill; end HP/barrier |
|---|---|---|---|---|
| `S1-sbc-spirit-light-forest-s101009` | S1 / `breadth-t2-spirit-light` | t2-forest-dungeon/101009 | boss-killed; Apex Timberclaw @ 18.8s; HP/barrier 221/221/46 | boss-killed; Apex Timberclaw @ 22.8s; HP/barrier 221/221/124 |
| `S1-sbc-spirit-light-mountain-s101009` | S1 / `breadth-t2-spirit-light` | t2-mountain-dungeon/101009 | boss-killed; Stoneplate Juggernaut @ 43.0s; HP/barrier 221/221/124 | boss-killed; Stoneplate Juggernaut @ 49.7s; HP/barrier 221/221/124 |
| `S1-sbc-spirit-balanced-forest-s101009` | S1 / `breadth-t2-spirit-balanced` | t2-forest-dungeon/101009 | boss-killed; Apex Timberclaw @ 22.2s; HP/barrier 230/230/24.2 | boss-killed; Apex Timberclaw @ 22.8s; HP/barrier 230/230/24.2 |
| `S1-sbc-spirit-balanced-mountain-s101009` | S1 / `breadth-t2-spirit-balanced` | t2-mountain-dungeon/101009 | boss-killed; Stoneplate Juggernaut @ 45.5s; HP/barrier 230/230/129 | boss-killed; Stoneplate Juggernaut @ 50.4s; HP/barrier 230/230/129 |
| `N1-sbc-spirit-heavy-forest-s101009` | N1 / `breadth-t2-spirit-heavy` | t2-forest-dungeon/101009 | boss-killed; Apex Timberclaw @ 25.0s; HP/barrier 167.5/244/0 | boss-killed; Apex Timberclaw @ 25.0s; HP/barrier 167.5/244/0 |
| `S4-op-t3-spirit-light-mountain-boss-s101009` | S4 / `t3-spirit-light` | t3-mountain-dungeon/101009 | boss-killed; Crag-Gorged Horn-Behemoth @ 107.7s; HP/barrier 237/314/196 | boss-killed; Crag-Gorged Horn-Behemoth @ 126.5s; HP/barrier 314/314/196 |
| `S4-op-t3-spirit-balanced-mountain-boss-s101009` | S4 / `t3-spirit-balanced` | t3-mountain-dungeon/101009 | boss-killed; Crag-Gorged Horn-Behemoth @ 85.9s; HP/barrier 233.5/325/84 | boss-killed; Crag-Gorged Horn-Behemoth @ 92.9s; HP/barrier 325/325/165.2 |
| `S4-op-t3-spirit-light-mountain-boss-s101033` | S4 / `t3-spirit-light` | t3-mountain-dungeon/101033 | boss-killed; Crag-Gorged Horn-Behemoth @ 107.7s; HP/barrier 237/314/196 | boss-killed; Crag-Gorged Horn-Behemoth @ 126.5s; HP/barrier 314/314/196 |
| `S4-op-t3-spirit-balanced-mountain-boss-s101033` | S4 / `t3-spirit-balanced` | t3-mountain-dungeon/101033 | boss-killed; Crag-Gorged Horn-Behemoth @ 85.9s; HP/barrier 233.5/325/84 | boss-killed; Crag-Gorged Horn-Behemoth @ 92.9s; HP/barrier 325/325/165.2 |
| `C2-op-t1-conduit-plains-boss-s101009` | C2 / `t1-conduit` | t1-plains-dungeon/101009 | boss-killed; Tusked Razorback @ 93.4s; HP/barrier 74.0/144/0 | boss-killed; Tusked Razorback @ 94.5s; HP/barrier 63.7/144/0 |
| `C2-op-t1-conduit-mountain-boss-s101009` | C2 / `t1-conduit` | t1-mountain-dungeon/101009 | boss-killed; Crag Behemoth @ 156.4s; HP/barrier 95.8/156/0 | boss-killed; Crag Behemoth @ 120.6s; HP/barrier 151.1/156/0 |

## Conduit paired measurements

`ZS/half` is no-summon milliseconds / at-or-below-half-authored-offense milliseconds. `off` is live authored offense fraction. `HP` is actual landed HP work. The underlying `conduit.json`, formation/replacement streams, and payment streams remain in the external raw artifacts and are inventory-hashed.

| Pair | Fixture / seed | Control: outcome; work @5/@10/@20; HP work; ZS/half; live offense; replacements / HP paid; ready-HP-blocked; end HP | Candidate: outcome; work @5/@10/@20; HP work; ZS/half; live offense; replacements / HP paid; ready-HP-blocked; end HP |
|---|---|---|---|
| `C1-op-t1-conduit-plains-t1-developed-s101009` | t1-plains-03/101009 | window-ended; 50/110/202; HP 18185; ZS/half 54900/389800; off 70.9%; repl/pay 215/1935; blocked 0; end 144/144 | window-ended; 55/109/221; HP 19124; ZS/half 28700/307600; off 77.5%; repl/pay 241/2169; blocked 0; end 144/144 |
| `C1-op-t1-conduit-cave-t1-developed-s101009` | t1-cave-02/101009 | window-ended; 12/25/52; HP 12770; ZS/half 114500/543000; off 61.5%; repl/pay 251/2259; blocked 0; end 101.0/156 | player-died; 15/28/—; HP 11690; ZS/half 39500/364000; off 68.2%; repl/pay 257/2313; blocked 2200; end 0/156 |
| `C1-op-t1-conduit-plains-t1-complete-s101009` | t1-plains-03/101009 | window-ended; 71/133/264; HP 20802; ZS/half 36000/343000; off 75.7%; repl/pay 185/1665; blocked 0; end 150/150 | window-ended; 67/133/271; HP 21504; ZS/half 18800/224200; off 82.3%; repl/pay 202/1818; blocked 0; end 150/150 |
| `C1-op-t1-conduit-cave-t1-complete-s101009` | t1-cave-02/101009 | window-ended; 13/26/52; HP 12719; ZS/half 221600/643300; off 52.4%; repl/pay 281/2810; blocked 0; end 164/164 | window-ended; 16/32/64; HP 15527; ZS/half 70700/599200; off 59.9%; repl/pay 371/3710; blocked 0; end 155.7/164 |
| `C1-op-t1-conduit-plains-t1-developed-s101033` | t1-plains-03/101033 | window-ended; 51/104/204; HP 17896; ZS/half 45200/409200; off 71.0%; repl/pay 208/1872; blocked 0; end 144/144 | window-ended; 56/108/212; HP 18284; ZS/half 44800/265900; off 77.9%; repl/pay 236/2124; blocked 0; end 144/144 |
| `C1-op-t1-conduit-cave-t1-developed-s101033` | t1-cave-02/101033 | window-ended; 11/27/54; HP 13220; ZS/half 131800/573400; off 59.1%; repl/pay 264/2376; blocked 0; end 156/156 | window-ended; 15/28/55; HP 13280; ZS/half 51200/466700; off 67.6%; repl/pay 310/2790; blocked 0; end 156/156 |
| `C1-op-t1-conduit-plains-t1-complete-s101033` | t1-plains-03/101033 | window-ended; 63/131/248; HP 20655; ZS/half 43400/407300; off 71.4%; repl/pay 204/1836; blocked 0; end 150/150 | window-ended; 70/139/269; HP 21049; ZS/half 15300/189900; off 84.3%; repl/pay 185/1665; blocked 0; end 150/150 |
| `C1-op-t1-conduit-cave-t1-complete-s101033` | t1-cave-02/101033 | window-ended; 12/26/53; HP 13016; ZS/half 163900/603300; off 56.8%; repl/pay 267/2670; blocked 0; end 138.2/164 | window-ended; 16/32/66; HP 15664; ZS/half 70300/590000; off 60.2%; repl/pay 368/3680; blocked 0; end 164/164 |
| `C2-op-t1-conduit-plains-boss-s101009` | t1-plains-dungeon/101009 | boss-killed; —/—/—; HP —; ZS/half 0/7700; off 91.0%; repl/pay 7/63; blocked 0; end 74.0/144 | boss-killed; —/—/—; HP —; ZS/half 0/2100; off 94.8%; repl/pay 7/63; blocked 0; end 63.7/144 |
| `C2-op-t1-conduit-mountain-boss-s101009` | t1-mountain-dungeon/101009 | boss-killed; —/—/—; HP —; ZS/half 31800/140000; off 34.2%; repl/pay 42/378; blocked 0; end 95.8/156 | boss-killed; —/—/—; HP —; ZS/half 18400/83300; off 45.9%; repl/pay 43/387; blocked 0; end 151.1/156 |
| `N2-op-t2-conduit-balanced-desert-t2-desert-established-s101009` | t2-desert-01/101009 | window-ended; 13/29/—; HP 30319; ZS/half 36300/176900; off 69.4%; repl/pay 137/1918; blocked 0; end 182.0/240 | window-ended; 13/29/—; HP 30319; ZS/half 36300/176900; off 69.4%; repl/pay 137/1918; blocked 0; end 182.0/240 |

## Final approval gate

S and C remain separate proposed patches. The evidence supports a bounded S designer review and rejects the tested C numeric value for adoption because of the developed-Cave owner-death counterexample. Both decisions remain **tested candidate only; awaiting designer approval**. No additional number, loadout, retry, follow-on encounter campaign, merge, release, or deployment is authorized by this report.
