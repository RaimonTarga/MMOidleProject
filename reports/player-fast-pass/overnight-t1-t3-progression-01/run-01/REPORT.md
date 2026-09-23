# Overnight T1–T3 progression 01 — run 01

## Short answer

The sealed 720-case campaign completed successfully: 720/720 new combat observations, with 0 failed, omitted, or not-run cases. All 720 rows have `status: complete`; the 89 farm deaths and 59 boss deaths are gameplay terminal outcomes, not operational failures. Farm survival to the 20-minute cap was 463/552 (83.9%). Bosses were killed in 109/168 cases (64.9%).

For farm work, endpoint observations were available for 483 rows at 5 minutes, 470 rows at 10 minutes, and 463 rows at 20 minutes. Using cumulative endpoint `work.kills` and retaining null post-death windows, the pooled interval work was 12,173 kills in 0–5 minutes (2,434.6/min), 11,772 in 5–10 (2,354.4/min), and 22,476 in 10–20 (2,247.6/min). These are exposure-conditioned pooled rates, not a universal class or biome leaderboard.

The direct answers are mixed. T1 Conduit is already a low-useful-output package before frames: 18/20 farm lives reached cap and its 10–20-minute pooled rate was 117.8 kills/min, below every other T1 root in this packet; its T1 boss result was nevertheless 4/4 kills. Spirit remains a strong farmer, but its boss frames specialize: T1 Spirit farmed 23/24 lives to cap, while T1 Spirit killed 2/4 bosses and the heavy frame was 2/4 in both D2 and D3. The actual entry snapshots are not blanket blockers—Desert arrival was 45/48 and established was 48/48; Jungle arrival was 32/36 and established was 31/36—but T3 developed Jungle and Volcanic were severe content-specific bottlenecks at 4/36 and 3/36 survivors.

## Five prioritized findings

1. **The queue is complete and the exposure is interpretable.** Farm deaths were 69 before five minutes, 13 in minutes 5–10, and 7 in minutes 10–20. Later-window cells are absent after death rather than filled with zero work. The 552 farm rows produced 47,349 completed kills before their terminal window/death, 42,554,859 HP damage, and 1,238,555 absorbed damage; these totals include short lives and are not a sustainability ranking.

2. **T3 Jungle and Volcanic are encounter bottlenecks, not evidence for one global root coefficient.** In block C, Cave, Mountain, and Swamp were 36/36 survivors; Desert was 34/36; Tundra arrival was 33/36. Jungle was 4/36 and Volcanic 3/36. The leading recorded farm killers in those cells were Silverback (20 Jungle deaths), Jungle Stalker (6), Ash Salamander (14 Volcanic deaths), Ember Scuttler (8), and Magma Tortoise (6). Boss pressure shows the same fixture split: D3 Mountain was 24/36 kills, while D3 Volcanic was 10/36. This points to targeted encounter/content review before any broad class adjustment.

3. **The T1 Conduit concern exists before frames, with delivered work degraded by body loss.** T1 Conduit farmed 18/20 lives to cap at 117.8 kills/min in the 10–20-minute interval, versus 136.8 for Apprentice, 170.5 for Squire, 197.5 for Slinger, 207.2 for Striker, and 212.0 for Spirit. Across its 20 external `conduit.json` summaries, median live-body/authored-offense fraction was 0.724, median time at or below half authored offense was 328,850 ms, and there were 3,451 successful replacements consuming 32,179 HP of paid replacement cost. Delivery was real rather than absent: 10,967 intact-body attempts produced 114,793 observed primary HP decrease and 19,868 depleted-body attempts produced 202,198.48; authored availability is not treated as delivered DPS. T1 Conduit still killed 4/4 bosses, so the result is a farming-delivery issue, not a universal combat failure.

4. **Spirit is a strong farming specialization whose boss result does not transfer automatically.** T1 Spirit reached the 20-minute cap in 23/24 cases and produced 212.0 kills/min in its 10–20-minute interval. The T2 Spirit frames reached cap in 8/8 light, 8/8 balanced, and 5/8 heavy farm rows; the D2 boss results were 4/4, 4/4, and 2/4 respectively. In D3, Spirit was 4/4 light, 4/4 balanced, and 2/4 heavy. The measured packet supports retaining Spirit as a farm candidate and reviewing boss frames separately; it does not prove Heavy overkill or an exact damage-source attribution.

5. **Arrival packages are viable in the tested T2 cells, while the Cave charm did not improve the matched Desert packages.** Desert arrival survived 45/48 and established 48/48; Jungle arrival survived 32/36 and established 31/36. Because these are complete progression packages, the established-vs-arrival difference cannot be assigned to one weapon, Rune, or charm. In the 24 matched Cave-charm pairs, Cave survived 23/24 versus 24/24 primary controls; among the 23 pairs with both 20-minute endpoints, Cave completed 1,754 kills versus 1,844 for the primary arm (−90), with every identity aggregate lower for Cave. The arm is not a general recovery recommendation from this run.

## Three actionable decisions

1. Route the next design review to T3 Jungle/Volcanic encounter mechanics and the D2 Plains/D3 Volcanic boss matchups. Preserve the distinction between fixture pressure and root/frame performance; do not apply a global damage, defense, or Spirit change from these rows alone.

2. Keep T1 Conduit as a narrow delivery/reconstruction diagnosis. Review body survival, replacement timing, and target-reaching work using the external Conduit streams; do not convert authored weights into DPS or introduce a broad Conduit multiplier from this report.

3. Keep the primary packages as the declared controls and do not adopt the Cave charm as the Desert default. No replay, extra seed, tuning pass, deployment, or automatic follow-up campaign is authorized by this run.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `overnight-t1-t3-progression-01` |
| Execution source commit | `c14d62afa2267b57207e1ef8b65c3fd90144c0a6` |
| Execution source SHA-256 | `0eba7df7facfbfb6454b6cc0e9e8a1930ba0b16d0e1bf64c8bed52e130ba91b4` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Fixed execution checkout | `D:/mmo-idle/overnight-t1-t3-progression-01/source` |
| Raw artifact root | `D:/mmo-idle/overnight-t1-t3-progression-01/run-01` |
| Runtime | Node `v22.16.0` |
| World step / farm cap / boss cap | `100 ms / 1,200,000 ms / 300,000 ms` |
| Farm endpoints | `300,000 / 600,000 / 1,200,000 ms` |
| Stop rule | First player death, authoritative boss kill, or cap |
| Seeds | `101009` and `101033` |
| Synthetic / economy eligible | `true / false` |
| Dispatch | Sequential, one direct child at a time; retries `0` |
| Watchdogs | 5 s poll; 120 s heartbeat; 5 GiB disk; 1 GiB host RAM; 2 GiB child RSS; one child |
| Qualification | Packet qualified 720/720 zero-tick cases; no combat launched during qualification |

The packet was verified against the frozen source before launch. The run used the execution checkout only; publication is a separate checkout. Resources recorded at seal were 658,371,125,248 free disk bytes and 6,770,167,808 free memory bytes out of 34,282,242,048 total.

## Ledger and coverage

| Block | Coverage | Planned | Completed | Failed | Omitted | Not run |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A | T1: six roots × five biomes × two snapshots × two seeds | 120 | 120 | 0 | 0 | 0 |
| A-W | T1 Flash Rapier alternatives for Striker, Slinger, Spirit in Plains/Mountain at developed snapshot | 12 | 12 | 0 | 0 | 0 |
| B | T2: 18 root/frame identities × Jungle/Desert × arrival/established × two seeds | 144 | 144 | 0 | 0 | 0 |
| B-C | T2 six melee identities × both Desert snapshots × Cave charm × two seeds | 24 | 24 | 0 | 0 | 0 |
| C | T3: 18 root/frame identities × seven ordinary biomes × two seeds | 252 | 252 | 0 | 0 | 0 |
| D1 | T1 Plains/Mountain bosses | 24 | 24 | 0 | 0 | 0 |
| D2 | T2 Plains/Swamp bosses | 72 | 72 | 0 | 0 | 0 |
| D3 | T3 Mountain/Volcanic bosses | 72 | 72 | 0 | 0 | 0 |
| **Total** | **All sealed controls** | **720** | **720** | **0** | **0** | **0** |

| Setting | N | Gameplay outcome |
| --- | ---: | --- |
| Farm | 552 | 463 `window-ended`; 89 `player-died` |
| Boss | 168 | 109 `boss-killed`; 59 `bot-died` |
| **All** | **720** | **720 operationally complete** |

## Endpoint survival and work

Endpoint values are cumulative `work.kills` read at the sealed endpoints. Interval work is calculated from endpoint differences only among rows that reached both endpoints. A post-death interval is null/unobserved, not zero.

| Farm interval | Rows with observed interval | Completed kills in interval | Pooled rate |
| --- | ---: | ---: | ---: |
| 0–5 minutes | 483/552 | 12,173 | 2,434.6 kills/min |
| 5–10 minutes | 470/552 | 11,772 | 2,354.4 kills/min |
| 10–20 minutes | 463/552 | 22,476 | 2,247.6 kills/min |

| Snapshot | N | Full-life survivors | 0–5 observed / kills | 5–10 observed / kills | 10–20 observed / kills |
| --- | ---: | ---: | ---: | ---: | ---: |
| `t1-complete` | 60 | 59 | 60 / 2,679 | 59 / 2,628 | 59 / 5,162 |
| `t1-developed` | 72 | 66 | 69 / 2,793 | 67 / 2,678 | 66 / 5,256 |
| `t2-desert-arrival` | 48 | 45 | 46 / 874 | 45 / 861 | 45 / 1,717 |
| `t2-desert-established` | 48 | 48 | 48 / 970 | 48 / 1,028 | 48 / 2,017 |
| `t2-jungle-arrival` | 36 | 32 | 34 / 746 | 33 / 658 | 32 / 1,088 |
| `t2-jungle-established` | 36 | 31 | 33 / 773 | 31 / 663 | 31 / 1,089 |
| `t3-developed` | 216 | 149 | 159 / 2,938 | 153 / 2,792 | 149 / 5,238 |
| `t3-tundra-arrival` | 36 | 33 | 34 / 400 | 34 / 464 | 33 / 909 |

## Farm root/frame profiles

The three rate columns are pooled endpoint-derived work/min for the stated interval. Full-life survival is the number of rows that reached the 20-minute farm cap.

### T1

| Identity | N | Full-life survival | 0–5 / 5–10 / 10–20 kills/min |
| --- | ---: | ---: | --- |
| `t1-apprentice` | 20 | 19/20 | 152.0 / 143.0 / 136.8 |
| `t1-conduit` | 20 | 18/20 | 121.2 / 126.6 / 117.8 |
| `t1-slinger` | 24 | 24/24 | 212.2 / 199.0 / 197.5 |
| `t1-spirit` | 24 | 23/24 | 218.6 / 210.6 / 212.0 |
| `t1-squire` | 20 | 18/20 | 178.0 / 170.0 / 170.5 |
| `t1-striker` | 24 | 23/24 | 212.4 / 212.0 / 207.2 |

### T2

| Identity | N | Full-life survival | 0–5 / 5–10 / 10–20 kills/min |
| --- | ---: | ---: | --- |
| `t2-apprentice-light` | 8 | 7/8 | 29.2 / 30.0 / 27.4 |
| `t2-apprentice-balanced` | 8 | 8/8 | 33.2 / 31.0 / 28.3 |
| `t2-apprentice-heavy` | 8 | 8/8 | 31.8 / 31.8 / 28.3 |
| `t2-conduit-light` | 8 | 5/8 | 21.8 / 16.8 / 16.6 |
| `t2-conduit-balanced` | 8 | 7/8 | 26.4 / 28.0 / 25.5 |
| `t2-conduit-heavy` | 8 | 6/8 | 15.6 / 12.6 / 12.5 |
| `t2-slinger-light` | 8 | 8/8 | 38.6 / 35.8 / 34.2 |
| `t2-slinger-balanced` | 8 | 7/8 | 32.8 / 32.2 / 26.5 |
| `t2-slinger-heavy` | 8 | 8/8 | 35.6 / 38.6 / 33.3 |
| `t2-spirit-light` | 8 | 8/8 | 45.4 / 42.6 / 40.9 |
| `t2-spirit-balanced` | 8 | 8/8 | 41.0 / 41.4 / 36.1 |
| `t2-spirit-heavy` | 8 | 5/8 | 26.8 / 21.2 / 20.9 |
| `t2-squire-light` | 12 | 12/12 | 44.6 / 44.0 / 40.9 |
| `t2-squire-balanced` | 12 | 12/12 | 44.6 / 43.4 / 40.3 |
| `t2-squire-heavy` | 12 | 12/12 | 48.8 / 48.8 / 43.8 |
| `t2-striker-light` | 12 | 11/12 | 51.4 / 45.2 / 41.9 |
| `t2-striker-balanced` | 12 | 12/12 | 53.0 / 49.4 / 46.8 |
| `t2-striker-heavy` | 12 | 12/12 | 52.0 / 49.2 / 46.9 |

### T3

| Identity | N | Full-life survival | 0–5 / 5–10 / 10–20 kills/min |
| --- | ---: | ---: | --- |
| `t3-apprentice-light` | 14 | 9/14 | 34.0 / 37.0 / 32.8 |
| `t3-apprentice-balanced` | 14 | 10/14 | 42.2 / 38.8 / 39.9 |
| `t3-apprentice-heavy` | 14 | 10/14 | 38.0 / 28.4 / 31.7 |
| `t3-conduit-light` | 14 | 10/14 | 31.4 / 31.4 / 33.4 |
| `t3-conduit-balanced` | 14 | 10/14 | 28.6 / 31.6 / 29.3 |
| `t3-conduit-heavy` | 14 | 10/14 | 17.6 / 21.6 / 20.2 |
| `t3-slinger-light` | 14 | 10/14 | 33.0 / 37.6 / 37.4 |
| `t3-slinger-balanced` | 14 | 9/14 | 30.2 / 27.2 / 27.6 |
| `t3-slinger-heavy` | 14 | 10/14 | 30.6 / 32.2 / 28.3 |
| `t3-spirit-light` | 14 | 8/14 | 50.0 / 31.4 / 28.9 |
| `t3-spirit-balanced` | 14 | 11/14 | 48.8 / 47.6 / 48.9 |
| `t3-spirit-heavy` | 14 | 9/14 | 32.2 / 31.4 / 29.7 |
| `t3-squire-light` | 14 | 11/14 | 39.6 / 40.8 / 35.3 |
| `t3-squire-balanced` | 14 | 12/14 | 44.8 / 40.8 / 36.5 |
| `t3-squire-heavy` | 14 | 12/14 | 45.6 / 49.0 / 45.7 |
| `t3-striker-light` | 14 | 10/14 | 33.6 / 37.6 / 34.9 |
| `t3-striker-balanced` | 14 | 10/14 | 43.8 / 44.2 / 35.5 |
| `t3-striker-heavy` | 14 | 11/14 | 43.6 / 42.6 / 38.7 |

The fixture profile matters more than a cross-tier root ordering in block C: T3 Jungle was 4/36, while T3 Cave/Mountain/Swamp were 36/36. The same root/frame can therefore be healthy in one fixture and terminal in another.

## Boss profiles

Boss progress is read from each external `summary.json`; adds and boss progress are separate. A failed case is reported with its observed `bossHpFractionRemoved`, not as a slow kill.

| Block / fixture | N | Boss kills | Bot deaths | Median kill time | Median progress at death |
| --- | ---: | ---: | ---: | ---: | ---: |
| D1 T1 Plains | 12 | 9 | 3 | 80.1 s | 84.7% removed |
| D1 T1 Mountain | 12 | 12 | 0 | 79.4 s | — |
| D2 T2 Plains | 36 | 18 | 18 | 46.6 s | 28.1% removed |
| D2 T2 Swamp | 36 | 36 | 0 | 31.1 s | — |
| D3 T3 Mountain | 36 | 24 | 12 | 140.4 s | 72.5% removed |
| D3 T3 Volcanic | 36 | 10 | 26 | 60.6 s | 87.5% removed |

Root/frame boss results (each cell is kills/4 within that root/frame identity):

| Tier | Apprentice | Conduit | Slinger | Spirit | Squire | Striker |
| --- | --- | --- | --- | --- | --- | --- |
| T1 D1 | 4/4 | 4/4 | 4/4 | 2/4 | 4/4 | 3/4 |
| T2 D2 light | 4/4 | 4/4 | 4/4 | 4/4 | 2/4 | 2/4 |
| T2 D2 balanced | 3/4 | 4/4 | 4/4 | 4/4 | 2/4 | 2/4 |
| T2 D2 heavy | 3/4 | 2/4 | 4/4 | 2/4 | 2/4 | 2/4 |
| T3 D3 light | 0/4 | 2/4 | 2/4 | 4/4 | 2/4 | 2/4 |
| T3 D3 balanced | 0/4 | 2/4 | 2/4 | 4/4 | 2/4 | 0/4 |
| T3 D3 heavy | 0/4 | 2/4 | 4/4 | 2/4 | 2/4 | 2/4 |

The strongest boss distinctions are fixture-specific: D2 Plains accounts for all 18 D2 deaths, and D3 Volcanic accounts for 26 of 38 D3 deaths. D3 Apprentice was 0/12 across frames; D3 Slinger Heavy was 4/4 and D3 Spirit Light/Balanced were 4/4, which is useful specialization evidence but not a global frame ranking.

## Matched alternatives

### Flash Rapier versus T1 primary

The 12 A-W pairs used the same fixture, snapshot, seed, and source. Flash Rapier survived 11/12 pairs versus 12/12 primary. On the 11 pairs where both arms reached the 20-minute endpoint, Flash Rapier completed 2,322 kills versus 2,179 for primary: +143 pooled kills, survivor-conditioned. The per-root deltas were Slinger +31 across four pairs, Spirit +95 across four pairs, and Striker +17 across three completed pairs; one Striker Flash Rapier Mountain/101009 life died at 480.7 s while its primary pair survived.

### Cave charm versus T2 Desert primary

The 24 B-C pairs used the same fixture, snapshot, seed, source, and complete progression package except for the declared charm arm. Cave charm survived 23/24 versus 24/24 primary. On the 23 pairs with both 20-minute endpoints, Cave completed 1,754 kills versus 1,844 for primary (−90). The paired identity deltas were Squire Light −13, Balanced −14, Heavy −12, and Striker Light −14, Balanced −24, Heavy −13. These are package-level observations; they do not identify exclusive charm healing or prove a general recovery ordering.

## Conduit, Guard, sustain, and delivery diagnostics

The external summaries retain Guard and sustain readbacks beside the event streams. In the representative T1 Conduit Plains/developed/101009 farm summary, the Guard observer recorded 0 ms Brace, Endure, and overlap active time; this is a descriptive package readback, not proof that every Guard opportunity was absent. Its sustain observer recorded mean active fraction 0.25983, minimum HP 119.104/144, and no source-specific healing or counterfactual damage-lost field. The observer explicitly cautions that 100 ms samples are not exact firing decisions and that non-pipeline damage may bypass it.

Across the 20 T1 Conduit farm `conduit.json` summaries:

| Measure | Result |
| --- | ---: |
| Median live body/authored offense fraction | 0.724 |
| Median zero-summon time | 26,250 ms |
| Median time at or below half authored offense | 328,850 ms |
| Successful replacements / HP paid | 3,451 / 32,179 |
| Delivery exposure with intact / depleted bodies | 5,389,500 / 11,299,700 ms |
| Intact attempts / observed primary HP decrease | 10,967 / 114,793 |
| Depleted attempts / observed primary HP decrease | 19,868 / 202,198.48 |

The delivery observer defines primary HP decrease during synchronous summon attacks; it is not predicted DPS. Some target-phase entries have no attempt or no supported rate. The report therefore distinguishes owner danger, lost bodies, paid reconstruction, delayed replacement, and attacks that reach targets; it does not infer exact overkill, exclusive charm healing, or average authored-weight output.

## Package receipts and accessibility boundaries

`resolved-builds.json` contains one applied package readback for each of the 720 observations, including the snapshot, actual biome mastery, GM/RP, equipment and per-slot upgrades, abilities and Guards, Rune rules, stance, Runic Point budget/cost/free headroom, initial stats, and initial roster hashes. The packages are synthetic fixed route checkpoints with prior paid ownership; acquisition time, economy pacing, live-player performance, and a typical route are not measured.

The execution manifest records the held snapshots: T1 developed/complete, T2 Jungle and Desert arrival/established, T3 developed, and T3 Tundra arrival. It also records `synthetic: true`, `economyEligible: false`, fixed 100 ms steps, no retries, and the declared resource watchdogs.

## Evidence and publication

Compact publication files:

- [REPORT.md](REPORT.md) — this readable report.
- [results-summary.json](results-summary.json) — one compact row per planned observation.
- [resolved-builds.json](resolved-builds.json) — applied package and gate receipts.
- [raw-inventory.json](raw-inventory.json) — hashes for retained external raw artifacts.
- [identity.json](identity.json), [manifest.json](manifest.json), and [complete.json](complete.json) — execution identity, sealed cases, and terminal run receipt.
- [packet-seal.json](packet-seal.json), [packet-qualified.json](packet-qualified.json), and [qualification-complete.json](qualification-complete.json) — packet seal and zero-tick qualification receipts.
- [publication-receipt.json](publication-receipt.json) — measured result digest, inventory validation, and publication scope.

The raw event histories, samples, full target histories, and ready receipts remain under `D:/mmo-idle/overnight-t1-t3-progression-01/run-01`; they were not copied into normal Git history. Rehash validation found 0 missing files and 0 mismatches across 10,061 external files and 11,849,121,912 bytes. No deployment, replay, force-push, or automatic follow-up campaign was performed.
