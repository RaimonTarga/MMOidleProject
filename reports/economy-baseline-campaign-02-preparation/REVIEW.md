# Review of Economy V2 and revised experiment direction

## Verified changes

Reviewed delivery README, current-state and philosophy documents, candidate and static validation reports/JSON, baseline/live source exports, implementation manifest, verification receipt, and source diff from `ff98ba45` to `aa9f7d6c`. No production economy code was changed during this review.

The central pricing implementation applies tier scales once during public database registration, including reconstruction and non-equipment systems. Upgrade helpers read public item definitions; the generic fallback scales separately. Cumulative rounding preserves each colour's five-step total, while benefits and catalyst timing stay authored. Reward code preserves explicit zero essence/XP. The T2 helper considers equipped/bag predecessors, missing upgrades and existing mastery before selecting a per-currency-dominating top-up path. No direct combat/spawn change was found in the candidate diff.

Re-exporting committed source reproduced the delivered `live.json` apart from its historical base-SHA label. Re-running the independent audit reproduced its JSON exactly: 140 nodes, 108 checks, no static failures. Thus the report's source-label caveat is resolved for campaign 02 by recording the actual committed candidate SHA. Old and new denomination data are not mixed.

## What the static evidence does not answer

The 108 checks are aggregate work-model comparisons, not 108 simulated lives or exhaustive live node-pair observations. They use raw HP, DR work and H100 work with expanded expected follower pools. They omit survival, evasion, overkill, travel, spawning limits and class throughput. Their same-biome comparisons also hold modifier identity; a live best-node analysis must identify when a different modifier is more profitable or safer.

The weakest static margins merit priority: T4 essence current/lower ~1.336 versus target 1.25, T4 XP ~1.333 versus 1.25, and T4 catalysts ~1.162 versus 1.10. Modest recovery/ecology differences can consume that headroom. T2 catalyst margins are also comparatively narrow. These select experiments, not tuning proposals.

Primary-item affordability ratios compare gross mastery income against a single item's base/evolution and upgrades. They exclude predecessor preparation/reconstruction where applicable, competing systems and loadout purchases, colour travel, and gate waits. They do not prove a whole loadout is cheap or that a character can buy +3 in its first biome. Static full-route demand includes conditional and opportunistic actions from the old policy, so it is an envelope, not actual spending or the planned +3-first campaign budget.

The fresh-character decision removes old snapshots as candidate inputs. It also avoids interpreting historical wallets/XP under new denominations. Earn and preserve lineage at 1×; do not relabel the previously rejected snapshots as reusable because T1 values happen to match.

## Recommended experiment changes adopted in this plan

1. **Target static assumptions before full pacing.** Keep every audit endpoint plus normal biome controls/chains; 468 entry windows replace the 1,332-cell exhaustive opener. This keeps Mountain chains, Cave/Swamp, Jungle, Desert/Tundra/Volcanic and cross-colour/family alternatives while retaining T4 Graveyard/Trench rather than overlooking new-biome competition.
2. **Add earned stronger-character checks.** Entry characters can find current content difficult and later reverse the ordering once strong. Twelve fixed node pairs at an earned current primary +3 stage add 92 deduplicated windows across four actors. Snapshot boundaries must be specified from route milestones before acquisition, never selected by fastest outcomes. Capped XP is not tested in those arms; resource opportunity still is. Expand to mature +5 only if the tested +3 stage leaves a concrete unresolved risk.
3. **Separate essential progression from premium purchasing.** Retain T1 anchor; compile a T2+ +3-first core policy and a separate primary +5 continuation. Do not spend optional +4/+5 currency ahead of intended ability/stance/Core purchases and then diagnose the resulting delay as mandatory progression cost. Keep the original full-plan demand as a reference, not a second long A/B arm.
4. **Measure three clocks.** Mastery, affordability and legal adoption answer different questions. Preserve GM/local gates, actual debits and competing spend. A +5 bought late because of mastery is not automatically an expensive essence tail.
5. **Reconcile evolution plans with earned state.** The V2 helper is improved, but T2 routes still plan from the clean template. Snapshot-specific plan compilation and a forward inventory/consumption check are required. Count T1 top-up spend inside T2 acquisition effort.
6. **Use sequential stages, parallel independent tiers.** Stage 1 and confirmation/review precede the pacing freeze. Then reserve one of four qualified workers per tier; two replicas/classes run sequentially within that lane. The present registration-order queue does not guarantee this fairness and must not be used unchanged with one large T1 manifest first.

## Suggestions I would keep out of the opening campaign

- No new economy or combat tuning now. There is enough static support to justify measurement; actual exceptions should identify a node, class, recipe, gate or currency before any patch.
- No reward-multiplier A/B or synthetic rescue package. It would answer a different question and compromise fresh-character pacing.
- No exhaustive party factorial. Full same-node party rewards are an acknowledged risk, but the first packet is explicitly solo. If the human playtest expects routine parties, add a separately scoped earned two-person smoke before calling this multiplayer-economy acceptance.
- No T5+ duration claims. Holding T4 scales in fallback code does not author future-tier pacing.
- No automatic global PASS from a successful targeted screen. Report best-tested-node scope and class/stage exceptions; expand narrowly if the first screen exposes a credible omitted source or ecology effect.

The source change is coherent with the declared design direction. The main remaining work is valid fresh inputs, route/instrument qualification and measured safety-adjusted throughput, not another speculative reward curve.
