# Overnight player balance 01 — endurance and sustain coverage

## Give this document to Astra

**Assignment:** prepare one finite, unattended experiment packet for Luna. This is the next experiment, not a report-only task, and this document is a preparation brief rather than an executable manifest.

**Main allocation:** 336 observations. **Optional, separately sealed Conduit comparison:** at most 16 observations. **Total ceiling: 352.** Each main observation allows 1,800,000 ms (30 minutes) of simulated farming at the normal 100 ms World step, stopping at the first player death. These are simulated durations, not estimates of wall-clock runtime. Finishing early is acceptable; do not invent more work to fill the night.

Astra prepares and qualifies; Luna runs the fixed packet, writes a readable report, and commits AND pushes the scoped publication. No further command-center approval is required for routine preparation choices within this brief. Do not run the main campaign during preparation or adopt new gameplay changes during unattended execution.

## 1. What the latest experiment supports

Source: attached `REPORT.md`, titled **Farming sustain 01 — run 01**.

- Measured revision: `d056896dffd62dc24f0d13ead7b887e61d357006`.
- Source SHA-256: `75dc1afaaed8a676568d1efedf4895540ebd1fadff56c9e8e6f063c6eb59ed77`.
- Seed 101003, 100 ms steps, 300,000 ms windows; 20 completed, zero failed or unrun.
- In Volcanic, Skirmisher / Knight / Ember mage Mountain-charm packages died at 105.0 / 29.9 / 118.0 seconds. Volcanic-charm partners completed 76 / 60 / 56 kills over the full window, with minimum HP 33.0 / 35.3 / 40.5 percent.
- In Tundra, all six T3 rows survived. Skirmisher's charm swap did not increase kills and lowered its minimum HP; the result is not a universal charm ranking.
- T4 Avenger's Volcanic charm survived with 51 kills; Mountain static and temporary Recuperating partners both died with 36 kills.
- The T4 row named `Conduit` survived with either charm and completed 35 versus 40 kills. Its live authored offense remained above 95 percent. This is one package, not evidence that all Conduit paths are fixed.
- Recuperating triggered in only one of four policy rows, briefly, without preventing death. Do not promote this particular policy or treat the three untriggered rows as independent evidence of its effectiveness.
- The report does not provide the earlier optional Conduit delivery investigation or a C-treatment result. That work is **not established as completed** by this attachment.

The report is the evidence reviewed here; its raw hashes and outcome checks are reported by the operator, not independently recomputed by the command center. Its publication status remains local/unpublished.

## 2. Decisions this overnight packet should support

1. Do credible farming packages remain productive beyond the first five minutes, across different encounter realizations?
2. Does the Mountain-to-Volcanic charm tradeoff generalize beyond the three tested T3 balanced frames and two T4 packages, including already-strong packages?
3. Which substantial failures remain after using the available sustain tools, and are they attrition, stalled delivery, owner survival, or encounter-specific limitations?

This is an expanded endurance and package screen, not a restart of the original harness validation. It is not a complete item/ability optimization, progression/economy simulation, or live playtest. T2 and the completed Mountain-boss screen are not replayed wholesale tonight.

## 3. Fixed source and environment

Use the local production-R2 line underlying the latest sustain report, or a clearly identified compatible descendant. Inspect relevant intervening changes once, record the actual execution SHA, and retain a fixed source checkout throughout. Do not substitute an older remote R1 checkout because recent work is unpublished. Do not re-adopt R2 or apply its old experimental overlay twice.

All enemy values, pack AI, items, abilities, stances, progression rules, and class mechanics remain unchanged in the main screen. Parameterizing experiment duration, seeds, manifests, and read-only reporting is allowed; building another combat harness is not.

Verify the **actual child** resolves the intended shared modules, source, hitboxes, arm, seed, and duration. The historical outer/child commit mismatch must not recur. A publication-only descendant is not silently interchangeable with a child requiring exact HEAD. Run from the sealed source checkout and publish through a separate working directory when needed.

Keep synthetic mature-tier preparation, legal maximum upgrades up to +5, actual item limits, reachable mastery/RP, full starting owner HP and legitimate barrier, and normal initial summon preparation. No acquisition/travel campaign. Use actual production spawn/repopulation and AI. Do not force rest, refill health/summons between pulls, respawn the player after death, restart the World at five-minute boundaries, or introduce artificial enemy replenishment.

## 4. Block A — full T3/T4 endurance coverage: 288 observations

Catalogue:
- T3: all 18 root/frame identities, keeping the existing intended close/mid range policy.
- T4: all 54 implemented root/frame/path identities, preserving declared range/path exceptions.
- Exactly one primary farming package per identity, two ordinary fixtures, two seeds.

Count: **(18 + 54) × 2 fixtures × 2 seeds = 288**.

Fixtures:
- T3: `node-t3-volcanic-03` and the exact Tundra node used in `farming-stance-01`.
- T4: `node-t4-graveyard-03` and the exact Desert node used in `farming-stance-01`.
- Read the existing manifests for the contrast node IDs. Do not guess suffixes, pick easier nodes by outcomes, or multiply the screen across additional biomes.

Seeds: **101009 and 101021**, fixed in advance. They are new relative to the supplied reports. Apply each through the production-backed RNG/fixture path; changing only a label does not create a new scenario. Record actual roster/encounter identity. If two cases prove identical, preserve that and do not claim independent evidence or search for a more favorable seed.

Primary package rule:
- Reuse the current qualified breadth/farming packages with production R2 and the already accepted AoE/range/automation preparation.
- For the 12 identities explicitly paired in Block B, use the Volcanic charm at +5 as Block A's primary arm. Keep the rest of the inherited package fixed and use Offensive as the static stance in both charm arms. These are declared trial packages, not already-proven global upgrades.
- For other identities, preserve the most recent clearly documented, legal farming reference. Do not silently change equipment, core/relic, stance, ability priority, or Rune policy to make the roster greener.
- No permanent Recuperating or blanket addition of the unsuccessful HP <=25 percent policy. Do not replace that policy with a new threshold search.
- Do not consume spare RP merely for cosmetic budget equality. Identify it and preserve acquisition costs.
- Each row must show stable identity ID, actual skill path, display name, frame/range, equipment/upgrades, core/relic, ordered abilities, stance, Rune rules and used/free RP. Resolve the latest report's generic `Conduit` label from its actual receipts, not an assumption that it denotes Covenanter or Marshal.

These are comparisons of complete declared packages. They are not a tier list of isolated class coefficients, and the catalogue is not claimed to be optimized.

## 5. Block B — additional paired Mountain controls: 48 observations

The Volcanic arms are already counted in Block A. Add Mountain charm +5 controls for these 12 identities, in both fixtures and both seeds. Nothing else changes within a pair, including Offensive Stance, weapon, armor, core, relic, abilities, Rune behavior, upgrades or mastery. The swap must actually remove the old barrier and recompute Recovery. Never give both charms' benefits.

T3 identities:
1. `breadth-t3-striker-balanced` — source mapping for Skirmisher.
2. `breadth-t3-squire-balanced` — source mapping for Knight.
3. `breadth-t3-apprentice-balanced` — source mapping for Ember mage.
4. `breadth-t3-striker-heavy`.
5. `breadth-t3-squire-light`.
6. `breadth-t3-apprentice-light`.

T4 identities:
7. The exact `Conduit` identity from the sustain run's resolved receipt.
8. The exact `Avenger` identity from that receipt (prior brief proposed `breadth-t4-squire-heavy-a`; verify rather than relabel).
9. `breadth-t4-striker-heavy-b`.
10. `breadth-t4-squire-heavy-b`.
11. `breadth-t4-slinger-heavy-a` — deliberately include an earlier strong farming package.
12. `breadth-t4-spirit-balanced-a` — a second strong reference rather than testing only failures.

If a current identity rename or duplicate is found, use its stable skill path to resolve it before sealing. One justified replacement is permitted to preserve 12 distinct identities; explain the mapping without selecting by new combat results.

Count: **12 × 2 fixtures × 2 seeds = 48 additional observations**, yielding 48 matched charm pairs across A/B.

Use `volcanic-charm-t3` / `volcanic-charm-t4` and corresponding Mountain charms from the actual source. Confirm reachable evolution/mastery requirements; mature synthetic ownership is not an entry-tier accessibility claim. The comparison includes all item-stat and mechanic differences. Do not attribute its result exclusively to on-kill access when flat Recovery and continuous access changed too.

## 6. Block C — independent Conduit delivery investigation; up to 16 observations

Do not hold A/B behind an exhaustive Conduit review. First locate any existing C-review note, then inspect the original stance traces for:
- T3 Balanced/mid Defensive Tundra: 0 kills, 1 unfinished damaged target, high live authored offense, no zero-body exposure.
- T3 Heavy/mid Defensive Volcanic: death despite approximately 95 percent live authored offense.

Return a short `CONDUIT_DIAGNOSIS.md`: exact stalled target and HP timeline; attacks attempted versus useful damage delivered; targeting/range/leash/mitigation evidence; formation loss versus intact exposure; owner damage and actual reconstruction payments. Missing measurements remain unavailable. Alive offense weights are not delivered DPS. Nearly zero unaffordable-queue time does not prove successful HP payments were harmless.

If a prior justified candidate exists, reuse it after source reconciliation. Otherwise prepare **at most one** evidence-supported correctness repair, legal delivery/loadout alternative, or narrow Conduit mechanic adjustment. No automatic R3 interval reduction, global damage multiplier, or parallel respawn redesign. A real class buff remains an option when supported; one working item package does not rule one out.

Optional comparison:
- T3 Conduit Balanced/mid and Heavy/mid.
- Existing Volcanic/Tundra fixtures.
- Two arms: production R2 control and that one candidate.
- Seeds 101009 and 101021.
- 1,800,000 ms maximum; first death stops the row.
- Preserve the original Defensive stance and remaining original stance-run support in both arms, except the explicitly declared candidate change.

**2 identities × 2 fixtures × 2 arms × 2 seeds = 16**, including dedicated controls. Do not reuse Block A controls unless every material preparation field matches; the allocation already funds the separate controls.

Astra must decide and seal inclusion before Luna launches. If no candidate is justified, omit C combat and publish the diagnosis and reason. Do not replace an unresolved diagnosis with another redundant timer sweep. No unattended numerical adoption; bring the recommendation back to the command center.

## 7. Run contract and unattended operation

- Fixed 100 ms World step; 30-minute simulated cap; first death stops; no artificial real-time sleeping.
- Capture cumulative endpoints at 300,000 / 900,000 / 1,800,000 ms from each continuous life. Endpoints are not separate trials or independent replications.
- Use the existing natural ecology. A no-kill/stalled survivor must remain distinguishable from productive survival. No exposure is not balance evidence.
- One deterministic dispatcher is the default. Use existing supported process isolation. Avoid adding parallelism as another engineering project or mixing multiple players into the same World.
- Qualify the changed duration/seed and package path once. Prefer pure checks. Any short execution check must be a prefix of a scheduled case that continues without resetting, or be separately identified within the allocation; no hidden qualification campaign.
- Schedule paired charm arms adjacent, with A/B order alternating across seed blocks. Interleave roots/tiers so interruption does not leave an entire family uncovered. Write receipts and a compact partial table after every case.
- Ordinary deaths, low kills, caps, and untriggered mechanics are not reasons to stop other scheduled work, retune, or rerun.
- On a shared source/readback/runtime failure, preserve evidence and stop the affected family, not hundreds of identical failing children. Independent sealed blocks may proceed. A process crash or watchdog timeout is operationally censored, not a player death. No silent repair, resealing or automatic retry while the designer is away.
- Set practical disk/memory/heartbeat watchdogs from the runner's existing behavior and available machine resources. Surface configured thresholds in the manifest. Never classify a slow but advancing simulation as a gameplay stall. If storage or execution safety is at risk, stop safely and publish partial results.
- Do not consume model reasoning for every tick, pull or case. Let the dispatcher run; inspect compact progress at block boundaries or operational exceptions. Summarize once at completion or failure. Do not read all raw streams into the model context.
- Finish and stop after the sealed ledger. No autonomous next campaign, extra seeds, cap extension or patch adoption just because unattended time remains.

## 8. Measurements and interpretation

Primary: survival to 5/15/30 minutes; first-death time and cause; completed kills; unfinished targets; longest kill/progress gaps; target HP regain; minimum/terminal HP and barrier; per-window kill counts and real recovery/inactivity where observable. Report first-kill latency and stalled-target identity/progress in zero-kill rows.

For charm pairs, show matched outcomes, total completed work and the 0–5 / 5–15 / 15–30 minute intervals. A row ending at death has no later observations: do not fill those windows as measured zero combat or average it with survivors as though it ran the full duration. An optional kills-per-assigned-horizon statistic must be explicitly labeled as counting no post-death work, not as an observed ongoing farm rate. Late-window rates are conditional on survival and must carry the survivor count.

Two seeds give limited robustness evidence, not reliable rare-death probabilities or a precise class ranking. Report both results and ranges; do not pool across biomes, changed packages or durations into a universal score. Preserve the barrier-versus-Recovery tradeoff and cases where the Mountain charm is better.

For sustain, retain actual Recovery, active-fraction/kill-window exposure and available heal applications. Source-specific effective healing, overheal, and hypothetical damage lost were unavailable in the last report; do not relabel them as measured now unless a narrow implementation actually records them. That extra instrumentation is not a prerequisite for the main screen.

For Conduit, retain live authored weights, zero-body exposure, replacement timer/HP-blocked time, HP paid and actual owner healing where supported, plus useful target progress. Use existing counters and selected traces to distinguish availability from delivery. Report denominators and partial attribution honestly.

Long runs increase evidence size. Stream raw events externally and aggregate summaries rather than embedding full histories in the report/JSON. Retain compact state checkpoints and terminal diagnostics. No counterfactual DPS/EHP estimator or new observability platform.

## 9. Morning deliverables — mandatory

Astra provides one exact manifest, fixed source(s), ordered case ledger, qualified complete builds, supported verify/run commands and one `LUNA_RUN.md`. No guessed CLI flag is a runnable command. Clearly state prepared versus executed status.

Luna's completion, even for partial failure:
1. Write `REPORT.md`, led by a short answer and at most five prioritized findings / three actionable decisions. Include class/frame/path coverage, 5/15/30-minute survival and work, charm pair results including losses, Conduit status, omissions and limitations. Do not return only file locations.
2. Write a small `results-summary.json` (one row per observation, no per-tick arrays), identity/manifest/completion receipts, resolved-build references, and a raw artifact inventory. Large streams remain external with hashes and locations.
3. Suggested publication directory: `reports/player-fast-pass/overnight-endurance-01/run-01/`. Keep execution and publication SHAs separate. Include the prior sustain report in a clearly separate publication path if it still needs publishing, without making it a gate for this run.
4. **Commit and push the scoped report and compact evidence.** No force-push, unrelated changes, history rewrite or deployment. Confirm the report exists remotely and return its branch, publication SHA, repository path and measured SHA. If pushing is blocked, name the actual error and publish the readable local report; do not simply state local-unpublished as a completed publishing step.
5. Finish with the actual planned/completed/failed/not-run counts and proposed adoption/build-reference decisions. No automatic next experiment.

## 10. Campaign judgment and boundaries

The overnight priority is to learn whether practical sustain configurations hold up, not to make every cell green. Keep the tested Volcanic options as candidates without making the charm compulsory for every class or every encounter. Do not spend the night tuning the rarely activated Recuperating policy.

The earlier broad roster screen and Conduit R2 comparisons remain evidence; this packet addresses longer exposure, new seed realizations and a selected item tradeoff. It does not close all weapons, abilities, stances, cores, relics, progression gates, multiplayer, economy, or live playtesting.

The next command-center review should select the remaining consequential problems and stop marginal work. It should not automatically request another fully crossed matrix.

## Sources and status of this document

Report basis: attached `REPORT.md`, **Farming sustain 01 — run 01**, revision `d056896d...`; prior **Farming stance 01 — run 01**, revision `f9dcde59...`; completed breadth farming `results.json`, historical source `5024be69...`. Prior preparation details are in `FARMING_SUSTAIN_AND_CONDUIT_NEXT_EXPERIMENT_ASTRA.md` and the repository's existing breadth/farming manifests.

The overnight counts, seeds, duration, package-selection policy and comparison design are new command-center instructions, not results already measured. The command center has not run combat, edited gameplay or independently fetched the unpublished latest raw records for this brief.
