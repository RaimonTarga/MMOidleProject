# ECONOMY V2 STATIC VALIDATION

Source baseline `ff98ba4513cb9fcb1e5752acfd56495268aff416`. Static candidate only: no measured hourly-rate acceptance and no dynamic campaign launched.

Targets: mastery per zone 5/15/30/60 minutes (T1–T4); a primary +3 during mastery and optional +5 around 25–50% extra farming. Future tiers are not authored. Old content remains a slower fallback; no reward penalty based on player level.

Curves are centralized. Preserve T0/T1. Essence cost scale divided by effective essence reward scale rises from 0.5 to 0.75 to 1.25 to 1.667. Catalyst costs and progress have their own curves. T2 mastery approximately preserves the old expected kill count (budget and XP both ×6.4); T3 doubles and T4 quadruples their old kill counts. Absolute 30/60-minute targets need earned-character validation; no static formula establishes them.

T2+ upgrades keep each item's full upgrade essence total and colour totals, but redistribute its five increments to 6/14/20/27/33%. Thus +4/+5 use 60% of upgrade spending, typically about 55–58% including base, versus approximately 65–70% before. Stat bonuses, gates, evolution rules, and catalyst step placement are unchanged.

Correction to the prior audit prose: Desert pays yellow, Trench green. Every comparison here reads monster reward colours from source.

## Exact curves

| Tier | Essence old→new | New E / T1 | XP old→new | Budget old→new | Catalyst old→new | Essence cost × | Catalyst cost × | XP/min needed for time target |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 → 2 | 1.000 | 2 → 2 | 1750 → 1750 | 0.5 → 0.5 | 1 | 1 | 350.000 |
| 2 | 0.85 → 8 | 4.000 | 1.25 → 8 | 5000 → 32000 | 1 → 1 | 6 | 2 | 2133.333 |
| 3 | 0.7 → 16 | 8.000 | 1 → 12 | 7000 → 168000 | 1 → 1.5 | 20 | 4 | 5600.000 |
| 4 | 0.55 → 48 | 24.000 | 1 → 30 | 9000 → 1080000 | 1 → 2 | 80 | 8 | 18000.000 |

These implied XP/hour targets grow by 6.095×, 2.625× and 3.214× between tiers, while intended duration grows 3×, 2× and 2×. They are required campaign throughput, not forecasts.

## Static opportunity checks

Raw HP, DR-adjusted work and H100 direct-hit work; same fixed hit size across tiers. Pool expansion includes followers and variants; body density is not a rewards/hour multiplier. H100 omits overkill, evasion, class effects, ecology, recovery, travel and deaths. Same-biome comparisons hold modifier identity; cross-colour/family comparisons use the best available node.

108 comparisons; 0 below target.

| T | Comparison | Work | Current/old | Target | Current node | Old node |
|---|---|---|---|---|---|---|
| 2 | same-biome E | hp | 1.737 | 1.250 | node-t2-forest-02 | node-t1-forest-02 |
| 2 | same-biome X | hp | 1.683 | 1.250 | node-t2-cave-03 | node-t1-cave-03 |
| 2 | E blue | hp | 2.138 | 1.250 | node-t2-mountain-04 | node-t1-mountain-04 |
| 2 | E red | hp | 2.092 | 1.250 | node-t2-cave-05 | node-t1-cave-05 |
| 2 | E green | hp | 1.888 | 1.250 | node-t2-jungle-04 | node-t1-forest-03 |
| 2 | E yellow | hp | 2.687 | 1.250 | node-t2-plains-05 | node-t1-plains-04 |
| 2 | E purple | hp | 2.996 | 1.250 | node-t2-swamp-05 | node-t1-swamp-01 |
| 2 | C alacrity | hp | 1.261 | 1.100 | node-t2-swamp-01 | node-t1-cave-01 |
| 2 | C heavy | hp | 1.314 | 1.100 | node-t2-swamp-02 | node-t1-cave-02 |
| 2 | C swarming | hp | 1.265 | 1.100 | node-t2-swamp-03 | node-t1-cave-03 |
| 2 | C dominion | hp | 1.328 | 1.100 | node-t2-swamp-04 | node-t1-cave-04 |
| 2 | C fortified | hp | 1.326 | 1.100 | node-t2-swamp-05 | node-t1-cave-05 |
| 2 | same-biome E | drWork | 1.699 | 1.250 | node-t2-cave-05 | node-t1-cave-05 |
| 2 | same-biome X | drWork | 1.442 | 1.250 | node-t2-cave-03 | node-t1-cave-03 |
| 2 | E blue | drWork | 2.140 | 1.250 | node-t2-mountain-01 | node-t1-mountain-01 |
| 2 | E red | drWork | 1.776 | 1.250 | node-t2-cave-01 | node-t1-cave-01 |
| 2 | E green | drWork | 1.899 | 1.250 | node-t2-jungle-01 | node-t1-forest-03 |
| 2 | E yellow | drWork | 2.644 | 1.250 | node-t2-plains-01 | node-t1-plains-04 |
| 2 | E purple | drWork | 2.923 | 1.250 | node-t2-swamp-01 | node-t1-swamp-01 |
| 2 | C alacrity | drWork | 1.366 | 1.100 | node-t2-swamp-01 | node-t1-cave-01 |
| 2 | C heavy | drWork | 1.423 | 1.100 | node-t2-swamp-02 | node-t1-cave-02 |
| 2 | C swarming | drWork | 1.371 | 1.100 | node-t2-swamp-03 | node-t1-cave-03 |
| 2 | C dominion | drWork | 1.361 | 1.100 | node-t2-swamp-04 | node-t1-swamp-04 |
| 2 | C fortified | drWork | 1.361 | 1.100 | node-t2-swamp-05 | node-t1-cave-05 |
| 2 | same-biome E | h100 | 1.694 | 1.250 | node-t2-cave-04 | node-t1-cave-04 |
| 2 | same-biome X | h100 | 1.445 | 1.250 | node-t2-cave-04 | node-t1-cave-04 |
| 2 | E blue | h100 | 2.140 | 1.250 | node-t2-mountain-01 | node-t1-mountain-03 |
| 2 | E red | h100 | 1.782 | 1.250 | node-t2-cave-01 | node-t1-cave-01 |
| 2 | E green | h100 | 1.889 | 1.250 | node-t2-jungle-01 | node-t1-forest-03 |
| 2 | E yellow | h100 | 2.630 | 1.250 | node-t2-plains-01 | node-t1-plains-04 |
| 2 | E purple | h100 | 2.845 | 1.250 | node-t2-swamp-01 | node-t1-swamp-01 |
| 2 | C alacrity | h100 | 1.332 | 1.100 | node-t2-swamp-01 | node-t1-cave-01 |
| 2 | C heavy | h100 | 1.388 | 1.100 | node-t2-swamp-02 | node-t1-cave-02 |
| 2 | C swarming | h100 | 1.337 | 1.100 | node-t2-swamp-03 | node-t1-cave-03 |
| 2 | C dominion | h100 | 1.307 | 1.100 | node-t2-swamp-04 | node-t1-swamp-04 |
| 2 | C fortified | h100 | 1.320 | 1.100 | node-t2-swamp-05 | node-t1-cave-05 |
| 3 | same-biome E | hp | 2.779 | 1.250 | node-t3-cave-03 | node-t2-cave-03 |
| 3 | same-biome X | hp | 2.124 | 1.250 | node-t3-cave-03 | node-t2-cave-03 |
| 3 | E blue | hp | 3.915 | 1.250 | node-t3-mountain-04 | node-t2-mountain-04 |
| 3 | E red | hp | 2.894 | 1.250 | node-t3-cave-05 | node-t2-cave-05 |
| 3 | E green | hp | 2.957 | 1.250 | node-t3-jungle-04 | node-t2-jungle-04 |
| 3 | E yellow | hp | 1.886 | 1.250 | node-t3-desert-04 | node-t2-plains-05 |
| 3 | E purple | hp | 3.255 | 1.250 | node-t3-swamp-05 | node-t2-swamp-05 |
| 3 | C alacrity | hp | 2.464 | 1.100 | node-t3-swamp-01 | node-t2-swamp-01 |
| 3 | C heavy | hp | 2.396 | 1.100 | node-t3-swamp-02 | node-t2-swamp-02 |
| 3 | C swarming | hp | 2.389 | 1.100 | node-t3-swamp-03 | node-t2-swamp-03 |
| 3 | C dominion | hp | 2.421 | 1.100 | node-t3-swamp-04 | node-t2-swamp-04 |
| 3 | C fortified | hp | 2.421 | 1.100 | node-t3-swamp-05 | node-t2-swamp-05 |
| 3 | same-biome E | drWork | 2.618 | 1.250 | node-t3-cave-05 | node-t2-cave-05 |
| 3 | same-biome X | drWork | 2.006 | 1.250 | node-t3-cave-05 | node-t2-cave-05 |
| 3 | E blue | drWork | 3.859 | 1.250 | node-t3-mountain-01 | node-t2-mountain-01 |
| 3 | E red | drWork | 3.052 | 1.250 | node-t3-volcanic-01 | node-t2-cave-01 |
| 3 | E green | drWork | 2.915 | 1.250 | node-t3-jungle-01 | node-t2-jungle-01 |
| 3 | E yellow | drWork | 1.656 | 1.250 | node-t3-desert-01 | node-t2-plains-01 |
| 3 | E purple | drWork | 3.225 | 1.250 | node-t3-swamp-01 | node-t2-swamp-01 |
| 3 | C alacrity | drWork | 2.464 | 1.100 | node-t3-swamp-01 | node-t2-swamp-01 |
| 3 | C heavy | drWork | 2.396 | 1.100 | node-t3-swamp-02 | node-t2-swamp-02 |
| 3 | C swarming | drWork | 2.389 | 1.100 | node-t3-swamp-03 | node-t2-swamp-03 |
| 3 | C dominion | drWork | 2.357 | 1.100 | node-t3-swamp-04 | node-t2-swamp-04 |
| 3 | C fortified | drWork | 2.287 | 1.100 | node-t3-swamp-05 | node-t2-swamp-05 |
| 3 | same-biome E | h100 | 2.546 | 1.250 | node-t3-cave-05 | node-t2-cave-05 |
| 3 | same-biome X | h100 | 1.950 | 1.250 | node-t3-cave-05 | node-t2-cave-05 |
| 3 | E blue | h100 | 3.859 | 1.250 | node-t3-mountain-01 | node-t2-mountain-01 |
| 3 | E red | h100 | 2.995 | 1.250 | node-t3-volcanic-01 | node-t2-cave-01 |
| 3 | E green | h100 | 2.915 | 1.250 | node-t3-jungle-01 | node-t2-jungle-01 |
| 3 | E yellow | h100 | 1.656 | 1.250 | node-t3-desert-01 | node-t2-plains-01 |
| 3 | E purple | h100 | 3.250 | 1.250 | node-t3-swamp-01 | node-t2-swamp-01 |
| 3 | C alacrity | h100 | 2.483 | 1.100 | node-t3-swamp-01 | node-t2-swamp-01 |
| 3 | C heavy | h100 | 2.414 | 1.100 | node-t3-swamp-02 | node-t2-swamp-02 |
| 3 | C swarming | h100 | 2.407 | 1.100 | node-t3-swamp-03 | node-t2-swamp-03 |
| 3 | C dominion | h100 | 2.385 | 1.100 | node-t3-swamp-04 | node-t2-swamp-04 |
| 3 | C fortified | h100 | 2.302 | 1.100 | node-t3-swamp-05 | node-t2-swamp-05 |
| 4 | same-biome E | hp | 1.773 | 1.250 | node-t4-mountain-02 | node-t3-mountain-02 |
| 4 | same-biome X | hp | 1.496 | 1.250 | node-t4-mountain-02 | node-t3-mountain-02 |
| 4 | E blue | hp | 3.411 | 1.250 | node-t4-tundra-04 | node-t3-mountain-04 |
| 4 | E red | hp | 4.179 | 1.250 | node-t4-volcanic-05 | node-t3-cave-05 |
| 4 | E green | hp | 3.445 | 1.250 | node-t4-trench-05 | node-t3-jungle-04 |
| 4 | E yellow | hp | 3.911 | 1.250 | node-t4-desert-04 | node-t3-desert-04 |
| 4 | E purple | hp | 1.346 | 1.250 | node-t4-graveyard-05 | node-t3-swamp-05 |
| 4 | C alacrity | hp | 1.272 | 1.100 | node-t4-volcanic-01 | node-t3-swamp-01 |
| 4 | C heavy | hp | 1.273 | 1.100 | node-t4-volcanic-02 | node-t3-swamp-02 |
| 4 | C swarming | hp | 1.239 | 1.100 | node-t4-volcanic-03 | node-t3-swamp-03 |
| 4 | C dominion | hp | 1.263 | 1.100 | node-t4-volcanic-04 | node-t3-swamp-04 |
| 4 | C fortified | hp | 1.290 | 1.100 | node-t4-volcanic-05 | node-t3-swamp-05 |
| 4 | same-biome E | drWork | 1.706 | 1.250 | node-t4-mountain-04 | node-t3-mountain-04 |
| 4 | same-biome X | drWork | 1.440 | 1.250 | node-t4-mountain-04 | node-t3-mountain-04 |
| 4 | E blue | drWork | 3.021 | 1.250 | node-t4-tundra-01 | node-t3-mountain-01 |
| 4 | E red | drWork | 4.878 | 1.250 | node-t4-volcanic-01 | node-t3-volcanic-01 |
| 4 | E green | drWork | 2.788 | 1.250 | node-t4-trench-01 | node-t3-jungle-01 |
| 4 | E yellow | drWork | 3.876 | 1.250 | node-t4-desert-01 | node-t3-desert-01 |
| 4 | E purple | drWork | 1.336 | 1.250 | node-t4-graveyard-01 | node-t3-swamp-01 |
| 4 | C alacrity | drWork | 1.252 | 1.100 | node-t4-volcanic-01 | node-t3-swamp-01 |
| 4 | C heavy | drWork | 1.253 | 1.100 | node-t4-volcanic-02 | node-t3-swamp-02 |
| 4 | C swarming | drWork | 1.220 | 1.100 | node-t4-volcanic-03 | node-t3-swamp-03 |
| 4 | C dominion | drWork | 1.210 | 1.100 | node-t4-volcanic-04 | node-t3-swamp-04 |
| 4 | C fortified | drWork | 1.196 | 1.100 | node-t4-volcanic-05 | node-t3-swamp-05 |
| 4 | same-biome E | h100 | 1.580 | 1.250 | node-t4-mountain-04 | node-t3-mountain-04 |
| 4 | same-biome X | h100 | 1.333 | 1.250 | node-t4-mountain-04 | node-t3-mountain-04 |
| 4 | E blue | h100 | 2.658 | 1.250 | node-t4-tundra-01 | node-t3-mountain-01 |
| 4 | E red | h100 | 4.785 | 1.250 | node-t4-volcanic-01 | node-t3-volcanic-01 |
| 4 | E green | h100 | 2.344 | 1.250 | node-t4-jungle-01 | node-t3-jungle-01 |
| 4 | E yellow | h100 | 3.600 | 1.250 | node-t4-desert-01 | node-t3-desert-01 |
| 4 | E purple | h100 | 1.375 | 1.250 | node-t4-graveyard-01 | node-t3-swamp-01 |
| 4 | C alacrity | h100 | 1.231 | 1.100 | node-t4-volcanic-01 | node-t3-swamp-01 |
| 4 | C heavy | h100 | 1.232 | 1.100 | node-t4-volcanic-02 | node-t3-swamp-02 |
| 4 | C swarming | h100 | 1.199 | 1.100 | node-t4-volcanic-03 | node-t3-swamp-03 |
| 4 | C dominion | h100 | 1.187 | 1.100 | node-t4-volcanic-04 | node-t3-swamp-04 |
| 4 | C fortified | h100 | 1.162 | 1.100 | node-t4-volcanic-05 | node-t3-swamp-05 |

## Mastery income and representative +3/+5

For each biome/tier, the first authored normal node is an illustrative income anchor, not a best-farm claim. Gross income assumes the entire fresh segment is farmed there. One primary weapon (armor when no weapon) is shown. Cross-colour costs require other farms; boss/entry/party income excluded. Full loadouts and optional systems cost extra.

| Biome | T | Primary item | Mastery E | Base→+3 E | Base→+5 E | +3/income | +5/income | Tail % |
|---|---|---|---|---|---|---|---|---|
| mountain | 1 | heavy-hammer | 252.641 | 167 | 447 | 0.661 | 1.769 | 62.640 |
| cave | 1 | chaotic-axe | 248.521 | 171 | 451 | 0.688 | 1.815 | 62.084 |
| forest | 1 | flash-rapier | 271.127 | 170 | 450 | 0.627 | 1.660 | 62.222 |
| plains | 1 | iron-broadsword | 291.667 | 80 | 215 | 0.274 | 0.737 | 62.791 |
| swamp | 1 | ashbrand-blade | 259.259 | 157 | 422 | 0.606 | 1.628 | 62.796 |
| forest | 2 | gale-needle | 5361.702 | 2616 | 6000 | 0.488 | 1.119 | 56.400 |
| plains | 2 | knight-steelsword | 5513.514 | 1890 | 4320 | 0.343 | 0.784 | 56.250 |
| mountain | 2 | quake-hammer | 5616.667 | 3120 | 7332 | 0.555 | 1.305 | 57.447 |
| cave | 2 | ruinous-axe | 5406.593 | 3010 | 6984 | 0.557 | 1.292 | 56.901 |
| swamp | 2 | swamp-mirebrand | 5610.619 | 3120 | 7332 | 0.556 | 1.307 | 57.447 |
| jungle | 2 | jungle-stinger-rapier | 5885.057 | 2706 | 6270 | 0.460 | 1.065 | 56.842 |
| desert | 2 | desert-sunsteel-cross | 5836.066 | 3300 | 7620 | 0.565 | 1.306 | 56.693 |
| tundra | 3 | tundra-permafrost-maul | 37298.396 | 21088 | 49000 | 0.565 | 1.314 | 56.963 |
| mountain | 3 | mountain-avalanche-maul | 37730.579 | 20944 | 48880 | 0.555 | 1.296 | 57.152 |
| cave | 3 | cave-cataclysm-axe | 37282.164 | 20064 | 46560 | 0.538 | 1.249 | 56.907 |
| jungle | 3 | jungle-venomthorn-rapier | 37109.272 | 18160 | 41800 | 0.489 | 1.126 | 56.555 |
| desert | 3 | desert-solar-cross | 37120.841 | 21712 | 50800 | 0.585 | 1.369 | 57.260 |
| volcanic | 3 | volcanic-cinderlash | 37150.171 | 22000 | 50800 | 0.592 | 1.367 | 56.693 |
| swamp | 3 | swamp-blightbrand | 37243.094 | 20944 | 48880 | 0.562 | 1.312 | 57.152 |
| mountain | 4 | mountain-earthsunder-maul | 287719.036 | 168704 | 391040 | 0.586 | 1.359 | 56.858 |
| tundra | 4 | tundra-glacial-tyrant-maul | 288124.475 | 169904 | 392000 | 0.590 | 1.361 | 56.657 |
| jungle | 4 | jungle-deathfang-rapier | 287952.085 | 146432 | 334400 | 0.509 | 1.161 | 56.211 |
| desert | 4 | desert-zenith-cross | 287410.345 | 174800 | 406400 | 0.608 | 1.414 | 56.988 |
| volcanic | 4 | volcanic-eruption-lash | 289120.393 | 177344 | 406400 | 0.613 | 1.406 | 56.362 |
| graveyard | 4 | graveyard-plague-axe | 288522.936 | 161952 | 372480 | 0.561 | 1.291 | 56.521 |
| trench | 4 | trench-abyssal-axe | 288000.000 | 161952 | 372480 | 0.562 | 1.293 | 56.521 |

## Primary-item catalyst burden

Each family income is the projected catalysts earned while filling an entire fresh mastery segment at that family node. Fraction sums the required share of a segment across families; it is not elapsed time or a full-loadout budget. Essence and catalysts accrue together. Base evolution/craft plus all five upgrades is included, reconstruction and other purchases excluded. Whole-catalyst minting can require a partial extra kill or carried progress.

| Biome | T | Primary item | Needed by family | Full segment income by family | Segment fraction |
|---|---|---|---|---|---|
| forest | 2 | gale-needle | alacrity:6 | alacrity:6.6383 | 0.904 |
| plains | 2 | knight-steelsword | — | — | 0 |
| mountain | 2 | quake-hammer | heavy:6 | heavy:7 | 0.857 |
| cave | 2 | ruinous-axe | swarming:6 | swarming:6.64688 | 0.903 |
| swamp | 2 | swamp-mirebrand | fortified:6 | fortified:7.06897 | 0.849 |
| jungle | 2 | jungle-stinger-rapier | alacrity:6 | alacrity:7.58621 | 0.791 |
| desert | 2 | desert-sunsteel-cross | dominion:6 | dominion:7.48768 | 0.801 |
| tundra | 3 | tundra-permafrost-maul | heavy:20 | heavy:34.8128 | 0.575 |
| mountain | 3 | mountain-avalanche-maul | heavy:20 | heavy:35.405 | 0.565 |
| cave | 3 | cave-cataclysm-axe | swarming:20 | swarming:34.9429 | 0.572 |
| jungle | 3 | jungle-venomthorn-rapier | alacrity:20 | alacrity:34.7682 | 0.575 |
| desert | 3 | desert-solar-cross | dominion:20 | dominion:34.8154 | 0.574 |
| volcanic | 3 | volcanic-cinderlash | swarming:20 | swarming:35.1 | 0.570 |
| swamp | 3 | swamp-blightbrand | fortified:20 | fortified:34.9067 | 0.573 |
| mountain | 4 | mountain-earthsunder-maul | heavy:56 | heavy:119.959 | 0.467 |
| tundra | 4 | tundra-glacial-tyrant-maul | heavy:56 | heavy:120.207 | 0.466 |
| jungle | 4 | jungle-deathfang-rapier | alacrity:56 | alacrity:120.106 | 0.466 |
| desert | 4 | desert-zenith-cross | dominion:56 | dominion:119.657 | 0.468 |
| volcanic | 4 | volcanic-eruption-lash | swarming:56 | swarming:120.766 | 0.464 |
| graveyard | 4 | graveyard-plague-axe | swarming:56 | swarming:120.333 | 0.465 |
| trench | 4 | trench-abyssal-axe | swarming:56 | swarming:119.912 | 0.467 |

## Canonical gross purchase demand

T0 separate; full declared T1/T2 purchase plans, not universal player spending. Subtract actual entry wallet when measuring waits. Tail is a subset of upgrades. Candidate projection retains old route choices; post-implementation data includes the predecessor top-up correction. T3/T4 authored checkpoint fragments remain incomplete and are exported separately in the snapshot; do not represent them as canonical full-tier budgets.

| Route | Tier | Essence | Catalysts | Base | Upgrades | Tail subset | Systems |
|---|---|---|---|---|---|---|---|
| striker-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| striker-t1 | 1 | yellow:650, green:320, purple:283, blue:447, red:571 | swarming:1, alacrity:1, heavy:1 | 136 | 1910 | 1170 | 225 |
| squire-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| squire-t1 | 1 | yellow:650, green:320, purple:283, blue:447, red:571 | swarming:1, alacrity:1, heavy:1 | 136 | 1910 | 1170 | 225 |
| slinger-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| slinger-t1 | 1 | yellow:270, green:740, purple:705, blue:492, red:120 | fortified:1, alacrity:1, heavy:1 | 152 | 1905 | 1155 | 270 |
| spirit-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| spirit-t1 | 1 | yellow:650, green:320, purple:283, blue:492, red:571 | swarming:1, alacrity:1, heavy:1 | 136 | 1910 | 1170 | 270 |
| apprentice-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| apprentice-t1 | 1 | yellow:650, green:320, purple:705, blue:492, red:571 | swarming:1, alacrity:1, heavy:1, fortified:1 | 158 | 2310 | 1435 | 270 |
| conduit-t1 | 0 | green:14 | — | 14 | 0 | 0 | 0 |
| conduit-t1 | 1 | yellow:650, green:320, purple:283, blue:492, red:571 | swarming:1, alacrity:1, heavy:1 | 136 | 1910 | 1170 | 270 |
| striker-t2-progression | 2 | yellow:14520, green:9000, blue:312, red:18048 | alacrity:18, fortified:10, dominion:16, swarming:16 | 12066 | 29094 | 17456 | 720 |
| striker-t2-progression | 1 | yellow:30 | — | 0 | 30 | 0 | 0 |
| squire-t2-progression | 2 | yellow:14940, purple:2964, blue:14796, red:3360, green:3000 | alacrity:12, fortified:12, heavy:16, dominion:16 | 12348 | 25992 | 15595 | 720 |
| squire-t2-progression | 1 | yellow:30 | — | 0 | 30 | 0 | 0 |
| apprentice-t2-progression | 2 | yellow:14520, purple:15186, blue:1092, red:3360, green:3540 | alacrity:12, fortified:26, heavy:4, dominion:16 | 12768 | 23670 | 14202 | 1260 |
| apprentice-t2-progression | 1 | yellow:30 | — | 0 | 30 | 0 | 0 |
| slinger-t2-progression | 2 | yellow:18336, green:20166, purple:312, red:4260 | alacrity:30, fortified:10, dominion:18, swarming:4 | 13230 | 29124 | 17474 | 720 |
| slinger-t2-progression | 1 | yellow:145 | — | 0 | 145 | 0 | 0 |
| spirit-t2-progression | 2 | yellow:14772, green:10338, blue:3438, red:18048 | alacrity:22, fortified:10, heavy:6, dominion:16, swarming:16 | 14226 | 31650 | 18990 | 720 |
| spirit-t2-progression | 1 | yellow:30 | — | 0 | 30 | 0 | 0 |
| conduit-t2-progression | 2 | yellow:17112, green:3360, blue:1092, red:18048 | alacrity:12, fortified:10, heavy:4, dominion:18, swarming:16 | 13194 | 25698 | 15418 | 720 |
| conduit-t2-progression | 1 | yellow:30 | — | 0 | 30 | 0 | 0 |

## All equipment prices

Base is craft/evolution; reconstruct is an alternative, never additive. Upgrades list exact incremental essence and catalysts. No core or relic +N track.

| Recipe | T/slot | Base E | Base C | Reconstruct E | Reconstruct C | +1 E/C | +2 E/C | +3 E/C | +4 E/C | +5 E/C |
|---|---|---|---|---|---|---|---|---|---|---|
| primordial-club | 0/weapon | green:4 | — | — | — | — | — | — | — | — |
| clearing-vest-t1 | 0/armor | green:4 | — | — | — | — | — | — | — | — |
| clearing-charm-t1 | 0/recovery | green:3 | — | — | — | — | — | — | — | — |
| clearing-boots-t1 | 0/mobility | green:3 | — | — | — | — | — | — | — | — |
| chaotic-axe | 1/weapon | red:26 | — | — | — | red:25 / — | red:45 / — | red:75 / — | red:125 / — | red:155 / swarming:1 |
| cave-vest-t1 | 1/armor | red:22 | — | — | — | red:30 / — | red:60 / — | red:95 / — | red:155 / — | red:195 / swarming:1 |
| cave-charm-t1 | 1/recovery | red:18 | — | — | — | red:10 / — | red:25 / — | red:40 / — | red:60 / — | red:75 / — |
| cave-boots-t1 | 1/mobility | red:18 | — | — | — | red:10 / — | red:15 / — | red:25 / — | red:40 / — | red:55 / — |
| ruinous-axe | 2/weapon | red:360 | — | red:1260 | swarming:4 | red:397 / — | red:928 / — | red:1325 / — | red:1788 / swarming:2 | red:2186 / swarming:4 |
| cave-vest-t2 | 2/armor | red:324 | — | red:1134 | swarming:4 | red:416 / — | red:970 / — | red:1386 / — | red:1871 / swarming:2 | red:2287 / swarming:4 |
| cave-charm-t2 | 2/recovery | red:264 | — | red:924 | swarming:4 | red:165 / — | red:386 / — | red:551 / — | red:743 / — | red:909 / swarming:2 |
| cave-boots-t2 | 2/mobility | red:198 | — | red:696 | swarming:4 | red:108 / — | red:252 / — | red:360 / — | red:486 / — | red:594 / swarming:2 |
| cave-cataclysm-axe | 3/weapon | red:2400 | — | red:8400 | swarming:12 | red:2650 / — | red:6182 / — | red:8832 / — | red:11923 / swarming:8 | red:14573 / swarming:12 |
| cave-vest-t3 | 3/armor | red:2320, yellow:580 | — | red:8120, yellow:2040 | swarming:12 | red:2183, yellow:545 / — | red:5093, yellow:1271 / — | red:7276, yellow:1816 / — | red:9823, yellow:2452 / swarming:8 | red:12005, yellow:2996 / swarming:12 |
| cave-charm-t3 | 3/recovery | red:2000, green:500 | — | red:7000, green:1760 | swarming:12 | red:845, green:212 / — | red:1971, green:496 / — | red:2816, green:708 / — | red:3802, green:956 / — | red:4646, green:1168 / swarming:8 |
| cave-boots-t3 | 3/mobility | red:2000 | — | red:7000 | swarming:12 | red:679 / — | red:1585 / — | red:2264 / — | red:3056 / — | red:3736 / swarming:8 |
| core-tempered | 2/core | red:3000 | dominion:8 | — | — | — | — | — | — | — |
| core-duelist | 3/core | red:27000 | dominion:24 | — | — | — | — | — | — | — |
| flash-rapier | 1/weapon | green:20 | — | — | — | green:25 / — | green:50 / — | green:75 / — | green:125 / — | green:155 / alacrity:1 |
| forest-vest-t1 | 1/armor | green:20 | — | — | — | green:20 / — | green:45 / — | green:70 / — | green:115 / — | green:150 / alacrity:1 |
| forest-charm-t1 | 1/recovery | green:15 | — | — | — | green:10 / — | green:20 / — | green:35 / — | green:60 / — | green:75 / — |
| forest-boots-t1 | 1/mobility | green:10 | — | — | — | green:10 / — | green:15 / — | green:25 / — | green:40 / — | green:45 / — |
| gale-needle | 2/weapon | green:360 | — | green:1260 | alacrity:4 | green:338 / — | green:790 / — | green:1128 / — | green:1523 / alacrity:2 | green:1861 / alacrity:4 |
| thorn-needle | 2/weapon | green:270, purple:90 | — | green:942, purple:318 | alacrity:4 | green:280, purple:94 / — | green:655, purple:219 / — | green:935, purple:313 / — | green:1262, purple:423 / alacrity:2 | green:1542, purple:517 / alacrity:4 |
| forest-vest-t2 | 2/armor | green:288, yellow:72 | — | green:1008, yellow:252 | alacrity:4 | green:259, yellow:65 / — | green:605, yellow:151 / — | green:864, yellow:216 / — | green:1166, yellow:292 / alacrity:2 | green:1426, yellow:356 / alacrity:4 |
| forest-charm-t2 | 2/recovery | green:300 | — | green:1050 | alacrity:4 | green:162 / — | green:378 / — | green:540 / — | green:729 / — | green:891 / alacrity:2 |
| forest-boots-t2 | 2/mobility | green:240 | — | green:840 | alacrity:4 | green:108 / — | green:252 / — | green:360 / — | green:486 / — | green:594 / alacrity:2 |
| jungle-stinger-rapier | 2/weapon | green:330 | — | — | — | green:356 / — | green:832 / — | green:1188 / — | green:1604 / alacrity:2 | green:1960 / alacrity:4 |
| jungle-vest-t2 | 2/armor | green:288, yellow:72 | — | — | — | green:280, yellow:71 / — | green:655, yellow:164 / — | green:935, yellow:235 / — | green:1262, yellow:318 / alacrity:2 | green:1542, yellow:388 / alacrity:4 |
| jungle-charm-t2 | 2/recovery | green:270 | — | — | — | green:165 / — | green:386 / — | green:551 / — | green:743 / — | green:909 / alacrity:2 |
| jungle-boots-t2 | 2/mobility | green:180 | — | — | — | green:108 / — | green:252 / — | green:360 / — | green:486 / — | green:594 / alacrity:2 |
| jungle-venomthorn-rapier | 3/weapon | green:2400 | — | green:8400 | alacrity:12 | green:2364 / — | green:5516 / — | green:7880 / — | green:10638 / alacrity:8 | green:13002 / alacrity:12 |
| jungle-vest-t3 | 3/armor | green:1800, yellow:600 | — | green:6300, yellow:2100 | alacrity:12 | green:1756, yellow:584 / — | green:4096, yellow:1364 / — | green:5852, yellow:1948 / — | green:7900, yellow:2630 / alacrity:8 | green:9656, yellow:3214 / alacrity:12 |
| jungle-charm-t3 | 3/recovery | green:2000 | — | green:7000 | alacrity:12 | green:1090 / — | green:2542 / — | green:3632 / — | green:4903 / — | green:5993 / alacrity:8 |
| jungle-boots-t3 | 3/mobility | green:1800 | — | green:6300 | alacrity:12 | green:684 / — | green:1596 / — | green:2280 / — | green:3078 / — | green:3762 / alacrity:8 |
| jungle-deathfang-rapier | 4/weapon | green:21120 | — | green:73920 | alacrity:32 | green:18797 / — | green:43859 / — | green:62656 / — | green:84586 / alacrity:24 | green:103382 / alacrity:32 |
| jungle-vest-t4 | 4/armor | green:17600, yellow:4400 | — | green:61600, yellow:15440 | alacrity:32 | green:14842, yellow:3710 / — | green:34630, yellow:8658 / — | green:49472, yellow:12368 / — | green:66787, yellow:16697 / alacrity:24 | green:81629, yellow:20407 / alacrity:32 |
| jungle-charm-t4 | 4/recovery | green:16000 | — | green:56000 | alacrity:32 | green:8717 / — | green:20339 / — | green:29056 / — | green:39226 / — | green:47942 / alacrity:24 |
| jungle-charm-t4-overgrowth | 4/recovery | green:16000 | — | green:56000 | alacrity:32 | green:8717 / — | green:20339 / — | green:29056 / — | green:39226 / — | green:47942 / alacrity:24 |
| jungle-boots-t4 | 4/mobility | green:15840 | — | green:55440 | alacrity:32 | green:5386 / — | green:12566 / — | green:17952 / — | green:24235 / — | green:29621 / alacrity:24 |
| core-survivalist | 2/core | green:3000 | fortified:8 | — | — | — | — | — | — | — |
| core-bruiser | 3/core | green:27000 | alacrity:24 | — | — | — | — | — | — | — |
| core-accelerant | 3/core | green:23000 | alacrity:20 | — | — | — | — | — | — | — |
| relic-verdant-flywheel | 4/relic | green:240000 | alacrity:64 | — | — | — | — | — | — | — |
| heavy-hammer | 1/weapon | blue:22 | — | — | — | blue:25 / — | blue:45 / — | blue:75 / — | blue:125 / — | blue:155 / heavy:1 |
| mountain-vest-t1 | 1/armor | blue:22 | — | — | — | blue:25 / — | blue:45 / — | blue:75 / — | blue:125 / — | blue:155 / heavy:1 |
| mountain-charm-t1 | 1/recovery | blue:18 | — | — | — | blue:10 / — | blue:25 / — | blue:40 / — | blue:60 / — | blue:75 / — |
| mountain-boots-t1 | 1/mobility | blue:18 | — | — | — | blue:10 / — | blue:15 / — | blue:25 / — | blue:40 / — | blue:55 / — |
| quake-hammer | 2/weapon | blue:312 | — | blue:1092 | heavy:4 | blue:421 / — | blue:983 / — | blue:1404 / — | blue:1895 / heavy:2 | blue:2317 / heavy:4 |
| mountain-vest-t2 | 2/armor | blue:312 | — | blue:1092 | heavy:4 | blue:382 / — | blue:892 / — | blue:1275 / — | blue:1720 / heavy:2 | blue:2103 / heavy:4 |
| mountain-charm-t2 | 2/recovery | blue:252 | — | blue:882 | heavy:4 | blue:153 / — | blue:358 / — | blue:511 / — | blue:691 / — | blue:843 / heavy:2 |
| mountain-boots-t2 | 2/mobility | blue:252 | — | blue:882 | heavy:4 | blue:103 / — | blue:241 / — | blue:345 / — | blue:465 / — | blue:568 / heavy:2 |
| mountain-avalanche-maul | 3/weapon | blue:2320 | — | blue:8120 | heavy:12 | blue:2794 / — | blue:6518 / — | blue:9312 / — | blue:12571 / heavy:8 | blue:15365 / heavy:12 |
| mountain-vest-t3 | 3/armor | blue:2320, red:580 | — | blue:8120, red:2040 | heavy:12 | blue:1999, red:500 / — | blue:4665, red:1168 / — | blue:6664, red:1668 / — | blue:8996, red:2252 / heavy:8 | blue:10996, red:2752 / heavy:12 |
| mountain-charm-t3 | 3/recovery | blue:2000, red:500 | — | blue:7000, red:1760 | heavy:12 | blue:780, red:193 / — | blue:1820, red:451 / — | blue:2600, red:644 / — | blue:3510, red:869 / — | blue:4290, red:1063 / heavy:8 |
| mountain-boots-t3 | 3/mobility | blue:2000 | — | blue:7000 | heavy:12 | blue:670 / — | blue:1562 / — | blue:2232 / — | blue:3013 / — | blue:3683 / heavy:8 |
| mountain-earthsunder-maul | 4/weapon | blue:20480 | — | blue:71680 | heavy:32 | blue:22234 / — | blue:51878 / — | blue:74112 / — | blue:100051 / heavy:24 | blue:122285 / heavy:32 |
| mountain-warmaul | 4/weapon | blue:19200 | — | blue:67200 | heavy:32 | blue:22310 / — | blue:52058 / — | blue:74368 / — | blue:100397 / heavy:24 | blue:122707 / heavy:32 |
| mountain-vest-t4 | 4/armor | blue:20480, red:5120 | — | blue:71680, red:17920 | heavy:32 | blue:15883, red:3970 / — | blue:37061, red:9262 / — | blue:52944, red:13232 / — | blue:71474, red:17863 / heavy:24 | blue:87358, red:21833 / heavy:32 |
| mountain-vest-t4-stormwall | 4/armor | blue:20480, red:5120 | — | blue:71680, red:17920 | heavy:32 | blue:15883, red:3970 / — | blue:37061, red:9262 / — | blue:52944, red:13232 / — | blue:71474, red:17863 / heavy:24 | blue:87358, red:21833 / heavy:32 |
| mountain-charm-t4 | 4/recovery | blue:17600, red:2400 | — | blue:61600, red:8400 | heavy:32 | blue:6850, red:936 / — | blue:15982, red:2184 / — | blue:22832, red:3120 / — | blue:30823, red:4212 / — | blue:37673, red:5148 / heavy:24 |
| mountain-charm-t4-shieldmend | 4/recovery | blue:17600, red:2400 | — | blue:61600, red:8400 | heavy:32 | blue:6850, red:936 / — | blue:15982, red:2184 / — | blue:22832, red:3120 / — | blue:30823, red:4212 / — | blue:37673, red:5148 / heavy:24 |
| mountain-boots-t4 | 4/mobility | blue:17600 | — | blue:61600 | heavy:32 | blue:5261 / — | blue:12275 / — | blue:17536 / — | blue:23674 / — | blue:28934 / heavy:24 |
| core-juggernaut | 4/core | blue:176000 | heavy:56 | — | — | — | — | — | — | — |
| core-arcanist | 3/core | blue:24000 | swarming:20 | — | — | — | — | — | — | — |
| relic-colossus-heart | 4/relic | blue:264000 | heavy:80 | — | — | — | — | — | — | — |
| relic-equilibrium-shard | 4/relic | blue:200000 | heavy:64 | — | — | — | — | — | — | — |
| iron-broadsword | 1/weapon | yellow:10 | — | — | — | yellow:10 / — | yellow:25 / — | yellow:35 / — | yellow:60 / — | yellow:75 / — |
| plains-vest-t1 | 1/armor | yellow:20 | — | — | — | yellow:20 / — | yellow:45 / — | yellow:70 / — | yellow:115 / — | yellow:150 / alacrity:1 |
| plains-charm-t1 | 1/recovery | yellow:10 | — | — | — | yellow:10 / — | yellow:20 / — | yellow:30 / — | yellow:45 / — | yellow:55 / — |
| plains-boots-t1 | 1/mobility | yellow:10 | — | — | — | yellow:10 / — | yellow:15 / — | yellow:25 / — | yellow:40 / — | yellow:45 / — |
| knight-steelsword | 2/weapon | yellow:270 | — | yellow:1080 | — | yellow:243 / — | yellow:567 / — | yellow:810 / — | yellow:1094 / — | yellow:1336 / — |
| plains-vest-t2 | 2/armor | yellow:360 | — | yellow:1260 | alacrity:4 | yellow:324 / — | yellow:756 / — | yellow:1080 / — | yellow:1458 / alacrity:2 | yellow:1782 / alacrity:4 |
| plains-charm-t2 | 2/recovery | yellow:300 | — | yellow:1050 | alacrity:4 | yellow:162 / — | yellow:378 / — | yellow:540 / — | yellow:729 / — | yellow:891 / alacrity:2 |
| plains-boots-t2 | 2/mobility | yellow:240 | — | yellow:840 | alacrity:4 | yellow:108 / — | yellow:252 / — | yellow:360 / — | yellow:486 / — | yellow:594 / alacrity:2 |
| ashbrand-blade | 1/weapon | purple:22 | — | — | — | purple:20 / — | purple:45 / — | purple:70 / — | purple:115 / — | purple:150 / fortified:1 |
| swamp-vest-t1 | 1/armor | purple:22 | — | — | — | purple:20 / — | purple:45 / — | purple:70 / — | purple:115 / — | purple:150 / fortified:1 |
| swamp-charm-t1 | 1/recovery | purple:18 | — | — | — | purple:10 / — | purple:25 / — | purple:40 / — | purple:60 / — | purple:75 / — |
| swamp-boots-t1 | 1/mobility | purple:18 | — | — | — | purple:10 / — | purple:15 / — | purple:25 / — | purple:40 / — | purple:55 / — |
| swamp-mirebrand | 2/weapon | purple:312 | — | purple:1092 | fortified:4 | purple:421 / — | purple:983 / — | purple:1404 / — | purple:1895 / fortified:2 | purple:2317 / fortified:4 |
| swamp-vest-t2 | 2/armor | purple:324 | — | purple:1134 | fortified:4 | purple:405 / — | purple:945 / — | purple:1350 / — | purple:1823 / fortified:2 | purple:2227 / fortified:4 |
| swamp-charm-t2 | 2/recovery | purple:264 | — | purple:924 | fortified:4 | purple:162 / — | purple:378 / — | purple:540 / — | purple:729 / — | purple:891 / fortified:2 |
| swamp-boots-t2 | 2/mobility | purple:264 | — | purple:924 | fortified:4 | purple:108 / — | purple:252 / — | purple:360 / — | purple:486 / — | purple:594 / fortified:2 |
| swamp-blightbrand | 3/weapon | purple:2320 | — | purple:8120 | fortified:12 | purple:2794 / — | purple:6518 / — | purple:9312 / — | purple:12571 / fortified:8 | purple:15365 / fortified:12 |
| swamp-vest-t3 | 3/armor | purple:2800 | — | purple:9800 | fortified:12 | purple:2662 / — | purple:6210 / — | purple:8872 / — | purple:11977 / fortified:8 | purple:14639 / fortified:12 |
| swamp-charm-t3 | 3/recovery | purple:2000 | — | purple:7000 | fortified:12 | purple:1066 / — | purple:2486 / — | purple:3552 / — | purple:4795 / — | purple:5861 / fortified:8 |
| swamp-boots-t3 | 3/mobility | purple:2000 | — | purple:7000 | fortified:12 | purple:706 / — | purple:1646 / — | purple:2352 / — | purple:3175 / — | purple:3881 / fortified:8 |
| tundra-permafrost-maul | 3/weapon | blue:2480 | — | — | — | blue:2791 / — | blue:6513 / — | blue:9304 / — | blue:12560 / heavy:8 | blue:15352 / heavy:12 |
| tundra-rimebrand | 3/weapon | blue:2400 | — | — | — | blue:2789 / — | blue:6507 / — | blue:9296 / — | blue:12550 / fortified:8 | blue:15338 / fortified:12 |
| tundra-vest-t3 | 3/armor | blue:2000, red:500 | — | — | — | blue:1992, red:498 / — | blue:4648, red:1162 / — | blue:6640, red:1660 / — | blue:8964, red:2241 / heavy:8 | blue:10956, red:2739 / heavy:12 |
| tundra-charm-t3 | 3/recovery | blue:1500, purple:500 | — | — | — | blue:854, purple:286 / — | blue:1994, purple:666 / — | blue:2848, purple:952 / — | blue:3845, purple:1285 / — | blue:4699, purple:1571 / heavy:8 |
| tundra-boots-t3 | 3/mobility | blue:1600 | — | — | — | blue:708 / — | blue:1652 / — | blue:2360 / — | blue:3186 / — | blue:3894 / heavy:8 |
| tundra-glacial-tyrant-maul | 4/weapon | blue:21840 | — | blue:76480 | heavy:32 | blue:22210 / — | blue:51822 / — | blue:74032 / — | blue:99943 / heavy:24 | blue:122153 / heavy:32 |
| tundra-glacial-rimebrand | 4/weapon | blue:20640 | — | blue:72240 | fortified:32 | blue:22224 / — | blue:51856 / — | blue:74080 / — | blue:100008 / fortified:24 | blue:122232 / fortified:32 |
| tundra-vest-t4 | 4/armor | blue:20480, red:5120 | — | blue:71680, red:17920 | heavy:32 | blue:15662, red:3922 / — | blue:36546, red:9150 / — | blue:52208, red:13072 / — | blue:70481, red:17647 / heavy:24 | blue:86143, red:21569 / heavy:32 |
| tundra-charm-t4 | 4/recovery | blue:17600, purple:2400 | — | blue:61600, purple:8400 | heavy:32 | blue:7810, purple:1070 / — | blue:18222, purple:2498 / — | blue:26032, purple:3568 / — | blue:35143, purple:4817 / — | blue:42953, purple:5887 / heavy:24 |
| tundra-charm-t4-deepfreeze | 4/recovery | blue:17600, purple:2400 | — | blue:61600, purple:8400 | heavy:32 | blue:7810, purple:1070 / — | blue:18222, purple:2498 / — | blue:26032, purple:3568 / — | blue:35143, purple:4817 / — | blue:42953, purple:5887 / heavy:24 |
| tundra-boots-t4 | 4/mobility | blue:14080 | — | blue:49280 | heavy:32 | blue:5587 / — | blue:13037 / — | blue:18624 / — | blue:25142 / — | blue:30730 / heavy:24 |
| core-scout | 3/core | blue:24000 | heavy:20 | — | — | — | — | — | — | — |
| relic-glacial-bell | 4/relic | blue:256000 | heavy:72 | — | — | — | — | — | — | — |
| desert-sunsteel-cross | 2/weapon | yellow:420 | — | — | — | yellow:432 / — | yellow:1008 / — | yellow:1440 / — | yellow:1944 / dominion:2 | yellow:2376 / dominion:4 |
| desert-vest-t2 | 2/armor | yellow:210, purple:150 | — | — | — | yellow:259, purple:173 / — | yellow:605, purple:403 / — | yellow:864, purple:576 / — | yellow:1166, purple:778 / dominion:2 | yellow:1426, purple:950 / dominion:4 |
| desert-charm-t2 | 2/recovery | yellow:300, purple:150 | — | — | — | yellow:140, purple:69 / — | yellow:326, purple:161 / — | yellow:465, purple:231 / — | yellow:629, purple:311 / — | yellow:768, purple:380 / dominion:2 |
| desert-boots-t2 | 2/mobility | yellow:348 | — | — | — | yellow:135 / — | yellow:314 / — | yellow:449 / — | yellow:605 / — | yellow:741 / dominion:2 |
| desert-solar-cross | 3/weapon | yellow:2320 | — | yellow:8120 | dominion:12 | yellow:2909 / — | yellow:6787 / — | yellow:9696 / — | yellow:13090 / dominion:8 | yellow:15998 / dominion:12 |
| desert-vest-t3 | 3/armor | yellow:2400, purple:600 | — | yellow:8400, purple:2100 | dominion:12 | yellow:2275, purple:569 / — | yellow:5309, purple:1327 / — | yellow:7584, purple:1896 / — | yellow:10238, purple:2560 / dominion:8 | yellow:12514, purple:3128 / dominion:12 |
| desert-charm-t3 | 3/recovery | yellow:2000, purple:500 | — | yellow:7000, purple:1760 | dominion:12 | yellow:1138, purple:284 / — | yellow:2654, purple:664 / — | yellow:3792, purple:948 / — | yellow:5119, purple:1280 / — | yellow:6257, purple:1564 / dominion:8 |
| desert-boots-t3 | 3/mobility | yellow:1800 | — | yellow:6300 | dominion:12 | yellow:929 / — | yellow:2167 / — | yellow:3096 / — | yellow:4180 / — | yellow:5108 / dominion:8 |
| desert-zenith-cross | 4/weapon | yellow:20400 | — | yellow:71440 | dominion:32 | yellow:23160 / — | yellow:54040 / — | yellow:77200 / — | yellow:104220 / dominion:24 | yellow:127380 / dominion:32 |
| desert-vest-t4 | 4/armor | yellow:17600, purple:4400 | — | yellow:61600, purple:15440 | dominion:32 | yellow:18302, purple:4570 / — | yellow:42706, purple:10662 / — | yellow:61008, purple:15232 / — | yellow:82361, purple:20563 / dominion:24 | yellow:100663, purple:25133 / dominion:32 |
| desert-charm-t4 | 4/recovery | yellow:16000, purple:4000 | — | yellow:56000, purple:14000 | dominion:32 | yellow:9101, purple:2275 / — | yellow:21235, purple:5309 / — | yellow:30336, purple:7584 / — | yellow:40954, purple:10238 / — | yellow:50054, purple:12514 / dominion:24 |
| desert-boots-t4 | 4/mobility | yellow:15840 | — | yellow:55440 | dominion:32 | yellow:7344 / — | yellow:17136 / — | yellow:24480 / — | yellow:33048 / — | yellow:40392 / dominion:24 |
| core-force | 2/core | yellow:3000 | dominion:8 | — | — | — | — | — | — | — |
| core-sniper | 3/core | yellow:26000 | dominion:24 | — | — | — | — | — | — | — |
| relic-withering-lens | 4/relic | yellow:264000 | dominion:72 | — | — | — | — | — | — | — |
| volcanic-cinderlash | 3/weapon | red:2800 | — | — | — | red:2880 / — | red:6720 / — | red:9600 / — | red:12960 / swarming:8 | red:15840 / swarming:12 |
| volcanic-vest-t3 | 3/armor | red:2400, yellow:600 | — | red:8400, yellow:2100 | alacrity:12 | red:1757, yellow:598 / — | red:4099, yellow:1394 / — | red:5856, yellow:1992 / — | red:7906, yellow:2689 / alacrity:8 | red:9662, yellow:3287 / alacrity:12 |
| volcanic-charm-t3 | 3/recovery | red:1500, yellow:500 | — | red:5260, yellow:1760 | alacrity:12 | red:900, yellow:300 / — | red:2100, yellow:700 / — | red:3000, yellow:1000 / — | red:4050, yellow:1350 / — | red:4950, yellow:1650 / alacrity:8 |
| volcanic-boots-t3 | 3/mobility | red:1480 | — | — | — | red:727 / — | red:1697 / — | red:2424 / — | red:3272 / — | red:4000 / swarming:8 |
| volcanic-eruption-lash | 4/weapon | red:24640 | — | red:86240 | swarming:32 | red:22906 / — | red:53446 / — | red:76352 / — | red:103075 / swarming:24 | red:125981 / swarming:32 |
| volcanic-blightbrand | 4/weapon | red:23200 | — | red:81200 | swarming:32 | red:22992 / — | red:53648 / — | red:76640 / — | red:103464 / swarming:24 | red:126456 / swarming:32 |
| volcanic-vest-t4 | 4/armor | red:17600, yellow:4400 | — | red:61600, yellow:15440 | alacrity:32 | red:15168, yellow:3787 / — | red:35392, yellow:8837 / — | red:50560, yellow:12624 / — | red:68256, yellow:17042 / alacrity:24 | red:83424, yellow:20830 / alacrity:32 |
| volcanic-vest-t4-lavatempered | 4/armor | red:17600, yellow:4400 | — | red:61600, yellow:15440 | alacrity:32 | red:15168, yellow:3787 / — | red:35392, yellow:8837 / — | red:50560, yellow:12624 / — | red:68256, yellow:17042 / alacrity:24 | red:83424, yellow:20830 / alacrity:32 |
| volcanic-charm-t4 | 4/recovery | red:16000, yellow:4000 | — | red:56000, yellow:14000 | alacrity:32 | red:7488, yellow:1872 / — | red:17472, yellow:4368 / — | red:24960, yellow:6240 / — | red:33696, yellow:8424 / — | red:41184, yellow:10296 / alacrity:24 |
| volcanic-boots-t4 | 4/mobility | red:13040 | — | red:45680 | swarming:32 | red:5746 / — | red:13406 / — | red:19152 / — | red:25855 / — | red:31601 / swarming:24 |
| core-catalyst | 4/core | red:184000 | swarming:64 | — | — | — | — | — | — | — |
| relic-hastebound-dial | 4/relic | red:264000 | swarming:72 | — | — | — | — | — | — | — |
| graveyard-plague-axe | 4/weapon | purple:21600 | — | purple:75600 | swarming:32 | purple:21053 / — | purple:49123 / — | purple:70176 / — | purple:94738 / swarming:24 | purple:115790 / swarming:32 |
| graveyard-vest-t4 | 4/armor | purple:17600 | — | purple:61600 | fortified:32 | purple:21581 / — | purple:50355 / — | purple:71936 / — | purple:97114 / fortified:24 | purple:118694 / fortified:32 |
| graveyard-vest-t4-debtward | 4/armor | purple:17600 | — | purple:61600 | fortified:32 | purple:21581 / — | purple:50355 / — | purple:71936 / — | purple:97114 / fortified:24 | purple:118694 / fortified:32 |
| graveyard-charm-t4 | 4/recovery | purple:12000 | — | purple:42000 | fortified:32 | purple:8765 / — | purple:20451 / — | purple:29216 / — | purple:39442 / — | purple:48206 / fortified:24 |
| graveyard-charm-t4-gravetide | 4/recovery | purple:12000 | — | purple:42000 | fortified:32 | purple:8765 / — | purple:20451 / — | purple:29216 / — | purple:39442 / — | purple:48206 / fortified:24 |
| graveyard-boots-t4 | 4/mobility | purple:6400 | — | — | — | purple:6010 / — | purple:14022 / — | purple:20032 / — | purple:27043 / — | purple:33053 / swarming:24 |
| core-controller | 4/core | purple:168000 | fortified:56 | — | — | — | — | — | — | — |
| relic-haunted-prism | 4/relic | purple:280000 | fortified:80 | — | — | — | — | — | — | — |
| trench-abyssal-axe | 4/weapon | green:21600 | — | green:75600 | swarming:32 | green:21053 / — | green:49123 / — | green:70176 / — | green:94738 / swarming:24 | green:115790 / swarming:32 |
| trench-vest-t4 | 4/armor | green:17600 | — | green:61600 | swarming:32 | green:22157 / — | green:51699 / — | green:73856 / — | green:99706 / swarming:24 | green:121862 / swarming:32 |
| trench-charm-t4 | 4/recovery | green:12000 | — | — | — | green:8765 / — | green:20451 / — | green:29216 / — | green:39442 / — | green:48206 / dominion:24 |
| trench-boots-t4-stalkers | 4/mobility | green:6400 | — | green:22400 | swarming:32 | green:6010 / — | green:14022 / — | green:20032 / — | green:27043 / — | green:33053 / swarming:24 |
| trench-boots-t4-treaders | 4/mobility | green:6400 | — | — | — | green:6010 / — | green:14022 / — | green:20032 / — | green:27043 / — | green:33053 / dominion:24 |
| relic-virulent-hourglass | 4/relic | green:272000 | dominion:72 | — | — | — | — | — | — | — |

## T3/T4 purchase fragments

Only named new-tier purchases from these checkpoint fragments; inherited gear, wallets and T2 preparation are excluded. The v1z upgrades start at +1. They are not complete canonical budgets.

| Fragment | T | Essence | Catalysts | Base | Upgrades | Tail subset | Systems |
|---|---|---|---|---|---|---|---|
| spirit-volcano-preparation-t3-v1u | 3 | red:66940, green:23000, blue:50640 | alacrity:20, swarming:20, heavy:28 | 31200 | 105880 | 63528 | 3500 |
| voidwalker-mountain-entry-t4-v1y | 4 | blue:60813, red:12426 | — | 45600 | 27639 | 0 | 0 |
| voidwalker-jungle-desert-t4-v1z | 4 | blue:53043, red:11446 | — | 0 | 64489 | 0 | 0 |

## Representative reward changes

Production node modifiers included; unchanged authored monster rewards and stats beneath tier scaling.

| T | Node | Pool | Essence old→new | XP old→new | Catalyst progress old→new |
|---|---|---|---|---|---|
| 1 | node-t1-mountain-01 | weighted ambient mean | 13.667 → 13.667 | 94.667 → 94.667 | 3.333 → 3.333 |
| 2 | node-t2-mountain-01 | weighted ambient mean | 12.000 → 112.333 | 100.000 → 640.000 | 14.000 → 14.000 |
| 3 | node-t3-mountain-01 | weighted ambient mean | 47.667 → 1087.000 | 403.333 → 4840.000 | 68.000 → 102.000 |
| 4 | node-t4-mountain-01 | weighted ambient mean | 67.500 → 5888.250 | 736.750 → 22102.500 | 122.750 → 245.500 |

## Representative price changes

Base craft/evolution prices; reconstruction alternatives and exact upgrade steps are in the full catalogue above.

| T | Kind | Recipe | Old E | New E | Old C | New C |
|---|---|---|---|---|---|---|
| 1 | weapon | chaotic-axe | red:26 | red:26 | — | — |
| 1 | armor | cave-vest-t1 | red:22 | red:22 | — | — |
| 1 | ABILITY | ability-recipe-sweep | yellow:25 | yellow:25 | — | — |
| 1 | STANCE | not authored at this tier | — | — | — | — |
| 1 | RITE | not authored at this tier | — | — | — | — |
| 2 | weapon | ruinous-axe | red:60 | red:360 | — | — |
| 2 | armor | cave-vest-t2 | red:54 | red:324 | — | — |
| 2 | core | core-tempered | red:500 | red:3000 | dominion:4 | dominion:8 |
| 2 | ABILITY | ability-recipe-hamstring | green:70 | green:420 | — | — |
| 2 | STANCE | stance-recipe-offensive | yellow:60 | yellow:360 | alacrity:1 | alacrity:2 |
| 2 | RITE | not authored at this tier | — | — | — | — |
| 3 | weapon | cave-cataclysm-axe | red:120 | red:2400 | — | — |
| 3 | armor | cave-vest-t3 | red:116, yellow:29 | red:2320, yellow:580 | — | — |
| 3 | core | core-duelist | red:1350 | red:27000 | dominion:6 | dominion:24 |
| 3 | ABILITY | ability-recipe-binding-strike | blue:150 | blue:3000 | — | — |
| 3 | STANCE | stance-recipe-tanking | blue:220 | blue:4400 | heavy:2 | heavy:8 |
| 3 | RITE | rite-recipe-swift-repose | red:120 | red:2400 | dominion:2 | dominion:8 |
| 4 | weapon | jungle-deathfang-rapier | green:264 | green:21120 | — | — |
| 4 | armor | jungle-vest-t4 | green:220, yellow:55 | green:17600, yellow:4400 | — | — |
| 4 | core | core-juggernaut | blue:2200 | blue:176000 | heavy:7 | heavy:56 |
| 4 | relic | relic-verdant-flywheel | green:3000 | green:240000 | alacrity:8 | alacrity:64 |
| 4 | ABILITY | ability-recipe-disengage | green:300 | green:24000 | — | — |
| 4 | STANCE | stance-recipe-perfection | green:450 | green:36000 | alacrity:3 | alacrity:24 |
| 4 | RITE | not authored at this tier | — | — | — | — |

## Individual monster reward examples

One body per kill at the named node, ordinary reward multiplier 1; XP before cap.

| T | Node | Monster | Colour | E old→new | XP old→new | Catalyst progress old→new |
|---|---|---|---|---|---|---|
| 1 | node-t1-mountain-01 | cliff-hopper | blue | 12 → 12 | 88 → 88 | 3 → 3 |
| 2 | node-t2-mountain-01 | granite-titan | blue | 13 → 121 | 108 → 688 | 15 → 15 |
| 3 | node-t3-mountain-01 | mountain-colossus | blue | 59 → 1344 | 493 → 5916 | 84 → 126 |
| 4 | node-t4-mountain-01 | granite-mammoth | blue | 61 → 5290 | 661 → 19830 | 110 → 220 |

## All system prices

| Kind | Recipe | T | Essence | Catalysts |
|---|---|---|---|---|
| ABILITY | ability-recipe-sweep | 1 | yellow:25 | — |
| ABILITY | ability-recipe-second-wind | 1 | green:25 | — |
| ABILITY | ability-recipe-cleanse | 1 | purple:30 | — |
| ABILITY | ability-recipe-brace | 1 | blue:45 | — |
| ABILITY | ability-recipe-power-strike | 1 | blue:190 | — |
| ABILITY | ability-recipe-expose-weakness | 1 | red:85 | — |
| ABILITY | ability-recipe-hamstring | 2 | green:420 | — |
| ABILITY | ability-recipe-bramble-guard | 2 | green:540 | — |
| ABILITY | ability-recipe-charge | 2 | yellow:420 | — |
| ABILITY | ability-recipe-endure | 2 | yellow:540 | — |
| ABILITY | ability-recipe-contagion | 2 | purple:540 | — |
| ABILITY | ability-recipe-slam | 2 | blue:540 | — |
| ABILITY | ability-recipe-binding-strike | 3 | blue:3000 | — |
| ABILITY | ability-recipe-break-free | 3 | blue:3800 | — |
| ABILITY | ability-recipe-frenzy | 3 | red:3500 | — |
| ABILITY | ability-recipe-quick-strike | 3 | red:4200 | — |
| ABILITY | ability-recipe-detonate | 3 | purple:4200 | — |
| ABILITY | ability-recipe-disengage | 4 | green:24000 | — |
| ABILITY | ability-recipe-recuperate | 4 | green:30400 | — |
| ABILITY | ability-recipe-snipe | 4 | purple:25600 | — |
| ABILITY | ability-recipe-stunning-strike | 4 | purple:33600 | — |
| ABILITY | ability-recipe-imbue-lightning | 4 | green:25600 | — |
| RUNE | rune-recipe-out-of-combat | 1 | green:180 | — |
| RUNE | rune-recipe-reload-safely | 1 | green:140, blue:60 | — |
| RUNE | rune-recipe-ready-execution | 1 | green:140, red:60 | — |
| RUNE | rune-recipe-focus-highest-hp | 1 | green:220 | — |
| RUNE | rune-recipe-low-hp | 1 | red:90 | — |
| RUNE | rune-recipe-avoid-hazards | 1 | purple:25 | — |
| RUNE | rune-recipe-flee | 1 | red:160, green:80 | — |
| RUNE | rune-recipe-careful-pulling | 1 | red:115 | — |
| RUNE | rune-recipe-recover-first | 1 | red:50, green:30 | — |
| RUNE | rune-recipe-step-back | 1 | red:35 | — |
| RUNE | rune-recipe-keep-distance | 1 | blue:45 | — |
| RUNE | rune-recipe-surrounded | 2 | purple:420 | — |
| RUNE | rune-recipe-focus-lowest-hp | 2 | purple:540 | — |
| RUNE | rune-recipe-let-dots-finish | 2 | purple:540 | — |
| RUNE | rune-recipe-spread-dots | 2 | purple:720 | — |
| RUNE | rune-recipe-focus-elites | 4 | purple:25600, blue:11200 | — |
| STANCE | stance-recipe-offensive | 2 | yellow:360 | alacrity:2 |
| STANCE | stance-recipe-defensive | 2 | yellow:360 | fortified:2 |
| STANCE | stance-recipe-fleeting | 2 | purple:660 | alacrity:2 |
| STANCE | stance-recipe-tanking | 3 | blue:4400 | heavy:8 |
| STANCE | stance-recipe-enraged | 3 | red:4600 | dominion:8 |
| STANCE | stance-recipe-berserker | 3 | red:4600 | dominion:8 |
| STANCE | stance-recipe-warding | 3 | purple:4400 | fortified:8 |
| STANCE | stance-recipe-predator | 3 | blue:4200 | dominion:8 |
| STANCE | stance-recipe-execute | 3 | yellow:4600 | dominion:8 |
| STANCE | stance-recipe-perfection | 4 | green:36000 | alacrity:24 |
| STANCE | stance-recipe-time-to-strike | 4 | blue:36000 | heavy:24 |
| STANCE | stance-recipe-brawler | 4 | green:40000 | swarming:24 |
| STANCE | stance-recipe-reaper | 4 | red:40000 | swarming:24 |
| STANCE | stance-recipe-recuperating | 4 | purple:36000 | fortified:24 |
| STANCE | stance-recipe-powering-up | 4 | green:44000 | dominion:32 |
| RITE | rite-recipe-swift-repose | 3 | red:2400 | dominion:8 |
| RITE | rite-recipe-purification | 3 | purple:2400, green:800 | fortified:8 |
| RITE | rite-recipe-lingering-battle | 3 | blue:2600, yellow:800 | heavy:8 |
| RITE | rite-recipe-blood-offering | 3 | red:2600, green:800 | swarming:8 |
| RITE | rite-recipe-mechanic-renewal | 3 | blue:3200, yellow:1200 | heavy:12 |
| RITE | rite-recipe-ability-reprieve | 3 | red:3200, purple:1200 | dominion:12 |

## Risks and adoption boundary

Large displayed values are intentional denominations; wallets stay numerically unchanged, so old savings buy less. Designer decision: fresh characters only, no save conversion. Existing wallets remain numerically unchanged; old XP/checkpoints are not eligible pacing inputs for this candidate. T1 is unchanged. Bestiary base rewards must be labeled as base values if displayed without node context. Boss authored payout differences and modifier premiums remain, and same-node party members still receive full rewards. Solo projections cannot certify party pacing. Literal prepared wallets, purchase budgets, timeouts and saved checkpoints require regeneration; do not execute an old sealed campaign against this candidate. No deploy.
