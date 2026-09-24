# Idle MMO — Economy Philosophy

Updated 2026-09-24 for the economy v2 candidate. Numerical implementation and evidence: [economy current state](../docs/economy-current-state.md). Dynamic pacing acceptance is pending; fresh characters only, no save conversion.

## A new tier is an economic opportunity

Successfully farming current content should earn more than obsolete content. For an earned advanced character, target at least 25% more essence/hour from the best relevant same-colour source, at least 25% more uncapped mastery XP/hour in a shared biome, and around 10% more same-family catalyst/hour where comparable. Static reward/work ratios select the candidate; actual hourly rates decide adoption.

Higher tiers can still take longer: their purchases and mastery requirements rise faster than their rewards. Keep essence rewards, essence costs, XP rewards, XP budgets, catalyst progress and catalyst costs as independent curves. Preserve the measured T1 anchor. Keep old content available as a slower fallback, without adding a player/content-tier penalty.

## Mastery and purchasing

Mastery unlocks power; currency pays for it. The current per-zone mastery targets are approximately 5/15/30/60 minutes at T1/T2/T3/T4. Later tiers should support longer idle sessions; T5-T8 durations are not yet authored. Travel, deaths, bosses, gear choices and additional systems add time beyond mastery.

A primary item through +3 should be affordable during its zone's mastery progression. +4/+5 form an optional premium: target a total +5 funding time around 25-50% beyond mastery for that item, not for an entire loadout. Essence and catalyst affordability do not override upgrade gates. The existing global-mastery requirement means +5 unlocks only after mastering the tier's biomes.

The old design language describing +3 as the max and a mandatory post-cap grind is superseded. +3 is the evolution-ready baseline; +5 is premium. Cheap utility items may finish earlier, while optional systems and multiple item lines compete for income.

## XP is a separate clock

Every tier segment has six levels with incremental shares 12/14/16/18/19/21 percent. The candidate segment budgets are 1,750 / 32,000 / 168,000 / 1,080,000 XP and reward multipliers 2 / 8 / 12 / 30. Both can change together to make current content valuable while extending progression.

`biomeXpForLevel` is the reference cumulative threshold; `biomeXpForBiomeLevel` accounts for the biome's start-tier offset. Existing caps, retired-biome rules, Clearing tutorial thresholds and global-mastery gates remain. The 1.20 future-budget fallback is a placeholder, not an approved T5-T8 schedule.

## Essence and catalyst identity

Preserve authored monster reward differences, biome colour identity, boss rewards and node premiums. Do not enforce a universal essence-to-XP ratio: live authored rewards and independent tier scales determine income. Farming routes must consider actual colour and catalyst family, not total currency alone. Desert pays yellow; Trench pays green.

Catalysts remain separate family currencies minted at 100 progress, with the node modifier determining family. They are not interchangeable. Preserve their routing role; do not copy the essence multiplier onto catalyst progress.

## Prices and the upgrade premium

Centralize denomination scaling instead of individually rewriting hundreds of recipes. Preserve within-tier relative price identity and per-colour full-track totals. Apply the same priced databases to equipment, evolution, reconstruction, cores, relics, abilities, runes, stances and Rites so the UI and server agree.

The T2+ candidate distributes five-step upgrade essence 6/14/20/27/33 percent. The final two steps use 60% of upgrades, typically about 55-58% of base plus all upgrades. Catalyst step placement and all item benefits remain authored. T1 retains its existing track. Cross-colour costs retain each colour's lifetime total; they still require appropriate farming routes.

A genuinely owned and mastery-eligible predecessor should not be reconstructed when topping it up and evolving is cheaper in every required currency. Preserve reconstruction for absent or unavailable predecessors; route inefficiency must not masquerade as expensive economy design.

## Acceptance boundary

Measure independent fresh progression lives after a short current-versus-old opportunity check. Track mastery, intended +3, optional +5, family scarcity and time spent constrained by essence, catalysts or mastery. Full same-node party rewards and large displayed denominations are explicit considerations. Do not infer live pacing from static efficiency or accelerated combat evidence.
