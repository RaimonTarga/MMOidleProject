# Joint mastery, essence and upgrade proposal

2026-09-25 — **original proposal; superseded by the [executed results](RESULTS.md) for adoption decisions**. This extends the [initial audit](README.md). Player database validation is deliberately reserved for the next step after the Codex reset.

## Recommendation

Test a coordinated package: **larger mastery budgets, approximately 10% lower essence supply, and move some of the existing +4/+5 price into +1/+2/+3 while keeping the full +5 price unchanged**. This directly addresses both targets without halving essence income or halving the price of completed equipment.

| Tier | Target per biome | Current segment XP | Proposed search range | First candidate |
|---|---:|---:|---:|---:|
| T1 | 5 min | 1,750 | 5,000–6,500 | **6,000** |
| T2 | 15 min | 5,000 | 16,000–20,000 | **18,000** |
| T3 | 30 min | 7,000 | 35,000–52,500 | **42,000** |
| T4 | 60 min | 9,000 | 90,000–135,000 | **108,000** |

These are **incremental six-level segment budgets**, not cumulative character XP. The first candidate's cumulative reference thresholds at levels 6/12/18/24 would be 6,000 / 24,000 / 66,000 / 174,000. Late-starting biomes continue using the shared offset function.

The evidence differs by tier. T3/T4 midpoints follow directly from the user's approximate five-minute observation: 7,000 × 30/5 = 42,000 and 9,000 × 60/5 = 108,000. Their ranges assume a four-to-six-minute baseline. **T1/T2 values are back-calculated economic candidates, not measured timing corrections.** They need 1,200 effective XP/minute to hit their targets; T3 needs 1,400 and T4 1,800. If T1 currently already takes five minutes, 6,000 XP would instead make it about 17 minutes at unchanged throughput. In that case reject this T1 budget and adjust its cost/supply package separately.

I would prioritize **T3/T4 for the first test**, and keep T1/T2 as separate calibration arms. The existing six-level XP shares can remain initially; at constant income the first level takes 12% of target time, so T4's first new unlock waits 7.2 minutes. Confirm that entry equipment and defensive tools support that delay.

## What “a full set” means in this calculation

One weapon, armor, recovery item and mobility item from the biome's current-tier catalogue. Cost includes craft/evolution plus upgrades. For evolution, an eligible **+3 predecessor** is already owned; its prior-tier expenditure is sunk. The live evolution requirement is +3, not the historical +5. Reconstruction is calculated separately. Cores/relics do not have a +N track and are excluded, as are optional abilities, runes, stances and rites.

The inventory covers **117 gear recipes, 26 biome/tier groups, and all 46 native four-slot combinations**, not the cost of buying every alternative item. Medians describe catalogues, not player popularity. This assumes a per-biome replacement-set allowance. A player mastering seven biomes but buying just one mixed set spends much less than seven native sets: that can produce abundant wallets even when a single biome's fresh allowance is insufficient. Telemetry must distinguish these shopping patterns.

Cross-color costs are retained in the data. Summing colors gives an economic comparison, **not a claim a single-color wallet can purchase a hybrid item**. Some T2 items already have mixed costs despite the old philosophy text saying hybrids begin at T3.

## Current costs do not have a 50% tail

Typical values below are medians of native-set costs across biomes. Essence at cap is the median modeled supply across biomes, including node modifiers/rounding and expected pack composition.

| Tier | Essence at current mastery cap | Current acquisition through +3 | Current acquisition through +5 | Typical +5/+3 ratio |
|---|---:|---:|---:|---:|
| T1 | 255 | 475 | 1,235 | 2.60× |
| T2 | 596 | 1,071 | 3,133 | 2.89× |
| T3 | 813 | 2,254 | 6,418 | 2.85× |
| T4 | 826 | 4,487 | 12,734 | 2.83× |

At equal farming rates, the current +3→+5 tail is roughly **160–190% extra**, rather than 50%. Changing all essence rewards by one scalar cannot change that ratio. To fit the current prices into a 50% extra-time tail, post-+3 income would have to rise about **3.2–3.8×**. That is possible only with a major change in farming circumstances; it should not be assumed from two more gear upgrades.

The tiny current cap allowances also explain why “essence feels plentiful” does not establish a per-biome fresh-set surplus. Carried wallets, earlier farming, fewer selected items, party income and already-owned gear change that comparison. On a fresh allowance, the current code pays less than a complete native +3 set in every tier's median. Merely extending the XP clock reverses that: at 42,000/108,000 XP and unchanged essence drops, T3/T4 would pay roughly **4,875/9,915 essence**, over twice today's typical +3 cost.

## Proposed prices and essence

For every ordinary gear recipe, keep its base craft/evolution cost and total cost through +5 unchanged, by color. Let `A` be acquisition cost and `U` the sum of the five upgrade costs:

```text
lifetime = A + U
new acquisition-through-+3 = round(2 × lifetime / 3)
new +1..+3 pool = new acquisition-through-+3 − A
new +4..+5 pool = lifetime − new acquisition-through-+3
```

The generated concrete candidate splits the first pool evenly across three steps, and the tail evenly across two, conserving integer totals. The +3 endpoint is about two-thirds of lifetime price; +5 then costs about 50% more. All **117 proposed item schedules** are in [candidate-costs.json](candidate-costs.json). This is an actual price proposal, not just a desired ratio. Base crafts remain cheap. Stats, upgrade gates, evolution discounts and the total +5 essence price are unchanged in the candidate.

This deliberately replaces the old sharply escalating upgrade-price curve. Some later steps become cheaper than the early steps. If an always-increasing price curve is important, a near-flat five-step alternative gives roughly a 1.6× total-price ratio and could approximate a 1.5× time ratio with modest post-+3 income growth. I prefer the explicit two-thirds endpoint for the first diagnostic comparison; its shape is easy to inspect and its tradeoff is clear.

Example — T3 **Plague Fang**, purple essence:

| Payment | Current | Candidate |
|---|---:|---:|
| Evolution | 116 | 116 |
| +1 | 93 | 504 |
| +2 | 233 | 505 |
| +3 | 372 | 504 |
| +4 | 605 | 408 |
| +5 | 1,025 | 407 |
| Total through +3 | 814 | 1,629 |
| Total through +5 | 2,444 | 2,444 |

**The early-upgrade increase is substantial.** This is the price of preserving the lifetime total while shortening the tail. Cheap acquisition helps, but +1 feedback arrives later. Verify recovery and damage progression before adopting it. If that feels bad, use the alternative below rather than disguising the effect as a small price adjustment.

Reduce the existing essence tier multiplier by 10% for the first candidate:

| Tier | Current multiplier | Candidate |
|---|---:|---:|
| T1 | 2.00 | 1.80 |
| T2 | 0.85 | 0.765 |
| T3 | 0.70 | 0.63 |
| T4 | 0.55 | 0.495 |

The model recalculates integer payouts per monster, rather than simply multiplying the final wallet by 0.9. Small drops and the one-essence minimum mean the effective cut differs slightly from 10%.

## How the package lines up

At the candidate XP budgets and reduced drops:

| Tier | Modeled essence by cap | Proposed typical +3 set | Unchanged typical +5 set | Median modeled total farming time to fund +5 / mastery time |
|---|---:|---:|---:|---:|
| T1 | 782 | 823 | 1,235 | 1.61× |
| T2 | 1,924 | 2,089 | 3,133 | 1.62× |
| T3 | 4,398 | 4,279 | 6,418 | 1.46× |
| T4 | 8,912 | 8,489 | 12,734 | 1.43× |

Time ratios assume constant supply and ignore gate/route delays. Each median is computed separately, so dividing the displayed medians need not reproduce the median ratio exactly. If mastery actually meets 5/15/30/60 minutes, these imply approximate total +5 funding times of **8 / 24 / 44 / 86 minutes**. They are economic predictions conditional on the mastery clock, not simulated completion times.

Across native-set medians, T3 cap supply covers about **91–113%** of proposed +3 prices; T4 **92–115%**. That is a useful first match to a rough target. T1/T2 fit less evenly:

- T1 Plains is a clear exception: its cheap 950-essence +5 set is already funded by the modeled 1,000 essence at cap. It cannot have a 50% financial tail under this package. Decide whether cheap generalist gear is an intentional exception. If universal timing matters more, test a Plains-specific essence correction of roughly another one-third; measure rounded payouts before adopting it. Raising all T1 prices would penalize the other biomes.
- T1 Cave funds about 84% of candidate +3; T2 Desert about 79%. These are candidates for modest local price relief or a larger earning allowance, not evidence for another global cut. A 10–15% reduction to T2 Desert's lifetime price would bring its +3 coverage closer to the central band.
- T3/T4 Desert remains slightly more expensive than typical and Jungle cheaper. Preserve some specialization differences rather than forcing identical outcomes.

Optional tools spend part of the allowance. T3 abilities cost 150–210 and stances 210–230; T4 abilities 300–420 and stances 450–550. For example, a 320-essence ability plus a 475-essence stance consumes 795 of T4's allowance. The median 8,912 supply then leaves 8,117 for a typical 8,489 +3 set, about 96% coverage. This still looks plausible as a rough gear goal, but repeated purchases/reconstruction need their own budget. [ancillary-costs.json](ancillary-costs.json) contains the catalogue; buying every unlock is not assumed.

Reconstruction raises typical current +3 totals from approximately 1,071 to 1,527 in T2, 2,254 to 3,404 in T3, and 4,487 to 7,020 in T4. The proposed cheaper-evolution benchmark should not promise identical pacing to a fresh reconstruction player. Preserve that distinction in the data and show it in testing.

## Catalysts and gates must be included

The longer segment earns far more catalysts even with reduced essence drops, because catalyst progress reads base reward weight separately. At the proposed XP budgets with today's catalyst scalar, typical single-family farming yields about **24–27 catalysts in T2, 70 in T3, and 180 in T4** by cap. Ordinary complete +5 sets typically ask for around 14 total in T3 and 20 in T4. This would make that currency much easier.

Propose retaining T1's current 0.5 catalyst-progress scalar and adding **T2 5/18, T3 1/6, T4 1/12**. These preserve approximately today's per-segment T2–T4 catalyst supply despite the larger XP budgets: roughly **7 / 12 / 15** units by cap. Another half-segment of farming brings T3/T4 to about 18/22–23, broadly in line with +5 set demand. T1's larger segment at its retained scalar yields about 2–3 by cap, broadly matching its small asks after further farming. Keep the universal 100-point mint threshold unchanged.

These totals belong to the node's **modifier family**, not a fungible catalyst wallet. Mixed-family gear still requires visiting the relevant nodes; fractional expected units are not guaranteed minted counts. The candidate data retains each node's family and both old/proposed progress totals. This is a supply correction, not a proposal to remove family routing.

Global Mastery also gates upgrades. Even with every earlier tier mastered, completing the first new biome gives GM **6 / 36 / 78 / 120** at T1–T4, while +3 requires **18 / 55 / 97 / 139**. Thus the user's “enough essence” goal is achievable as an affordability target, but actual +3 purchases may still wait for other biomes. +5 requires all available mastery at that tier: GM **30 / 72 / 114 / 156**. Do not advertise a literal one-biome +5 completion time while those gates remain.

Mastering every active biome at the requested times implies approximately **25 / 105 / 210 / 420 minutes** of biome exposure per tier, before other delays. The 60-minute T4 target therefore implies seven hours for all seven T4 biomes. This is a consequence of the stated per-biome targets, not an extra recommendation to slow the whole tier.

## Alternative if today's +3 prices should stay accessible

Keep current +3 costs, reduce the +4/+5 combined price until lifetime cost is about 1.5× +3, and cut essence sufficiently to match those lower prices at the new mastery endpoint. In T3/T4 that means roughly **a 54–55% essence reduction**, plus approximately **a 73% cut to the +4/+5 tail** (roughly 47% lower lifetime +5 price). The ratio is calculated as `0.5 / (current +5/+3 ratio − 1)` for the tail.

This protects early-upgrade affordability and creates the requested time split, but substantially changes the overall currency scale and finished-item price. Because the user considers essence relatively close, I prefer the modest-drop-cut/lifetime-preserving package first. Neither option is a tiny change to early and late upgrade pacing; that is unavoidable when moving from a 2.8× to a 1.5× price ratio.

## Next step and verification

No production values changed. The generator checks five upgrade steps for every included item, preserves each candidate lifetime color cost exactly, and retains actual acquisition/reconstruction distinctions. `upgradeCostFor`/`upgradeCatalystCostFor` provide the current costs. The original 458 live reward-function checks underpin baseline XP/essence arithmetic. Candidate supply uses the same integer reward formula with the proposed essence multiplier. This is deterministic economic modeling, not an end-to-end combat run.

All **585 proposed upgrade steps** also passed the shared `checkUpgrade` validator at full tier mastery with sufficient catalysts, and every proposed upgrade essence wallet exhausted exactly. The [verification receipt](economy-verification.json) records this result. `git diff --check` passed.

Reproduce both inventories and candidate schedules with:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/reward-mastery-study-2026-09-25/economy.ts
```

After reset: match the deployed build/configuration, use the existing telemetry plan to validate baseline pacing and shopping behavior, and test T3/T4 midpoint/range candidates with actual acquired builds. Re-evaluate the early tiers separately. Measure changing income after +3; if it increases, the tail takes less time than the constant-rate table. Include cross-color spending, party sharing, survival/recovery, inherited wallets, recipes bought and catalyst family availability. Any later implementation needs an explicit saved-XP/progress policy and review of early upgrade access. This file and the generated JSON are the concrete proposal to carry into that step.

