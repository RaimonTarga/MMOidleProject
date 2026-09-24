# ECONOMY V2 CANDIDATE

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

## Opportunity summary

All 108 static comparisons pass. The limiting comparison in each category is shown below. These are reward/work ratios, not rewards/hour.

| Tier | Category | Work proxy | Current/old | Target |
|---|---|---|---|---|
| 2 | Essence | h100 | 1.694 | 1.250 |
| 2 | XP | drWork | 1.442 | 1.250 |
| 2 | Catalysts | hp | 1.261 | 1.100 |
| 3 | Essence | drWork | 1.656 | 1.250 |
| 3 | XP | h100 | 1.950 | 1.250 |
| 3 | Catalysts | drWork | 2.287 | 1.100 |
| 4 | Essence | drWork | 1.336 | 1.250 |
| 4 | XP | h100 | 1.333 | 1.250 |
| 4 | Catalysts | h100 | 1.162 | 1.100 |

## Primary-item affordability

Gross mastery income from one illustrative node, excluding competing purchases and cross-colour travel. Upgrade mastery gates are unchanged.

| Biome | T | Item | Mastery E | Through +3 | Through +5 | +3/income | +5/income | Tail % |
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

## Decision and evidence boundary

Implement this as one candidate with fresh characters and no save conversion. Preserve T1, combat values and within-tier item identity. Correct dominated predecessor reconstruction and explicit-zero add rewards. Preserve family-specific catalysts. Do not launch the deferred economy experiment or deploy. Full canonical route budgets and node comparisons are in the JSON companion; exact prices, example rewards, risk details and post-implementation comparisons are in [static validation](ECONOMY_V2_STATIC_VALIDATION.md).
