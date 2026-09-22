# Entry profiles — source analysis, no combat

The +5 restriction is explained by production code: T2 upgrade steps require Global Mastery **38, 47, 55, 64, 72** for +1 through +5. Global Mastery excludes Clearing. Five returning biomes contribute at most 12 each; Jungle and Desert contribute at most 6 each at T2. This is a hard aggregate gate, applied alongside per-item biome mastery, essence payment, catalysts and structural maximum. T1 items use their own lower band and can already be +5. Cores have maximum +0. A uniform +3/+4 label is therefore not a complete character profile.

Source: `shared/src/systems/itemUpgrades.ts` (`globalMasteryRequiredForUpgrade`, `checkUpgrade`), `shared/src/config/gameConfig.ts` (`globalMastery`, `biomeLevelCap`), and `server/src/systems/player/economy/itemUpgrade.ts` (supplies actual Global Mastery). ENTRY_FACTS.json records source-extracted item chains, costs, upgrade gates, recipe unlocks, catalyst nodes and three proposed mastery profiles.

## Arrival boundaries

| Scenario | Hard ceiling for ordinary T2 equipment | Ownership boundary |
|---|---|---|
| First Jungle, Desert also unvisited | GM at most 60, hence +3 | No Jungle recipes; no Stinger, Jungle armor or Survivalist. Earlier five biomes can supply equipment. |
| First Jungle after Desert instead | GM at most 66, hence +4 | Requires an explicitly different route; do not silently assume this. |
| First Desert after Jungle | GM at most 66, hence +4 | Jungle gear can be owned only after its actual mastery/payment. No Desert boots, armor, Force or Focus Lowest HP yet. |
| First Desert without Jungle mastery | GM at most 60, hence +3 | Earlier five biomes only. |
| Established Desert mastery 4, Jungle 6 | GM at most 70, hence +4 | Desert base armor and boots and the targeting recipe are reachable. +5 remains locked until GM72. |

These maxima assume all other reachable biomes are capped, not that every incoming player has done so. The designer's +3/+4 expectation is consistent with these boundaries on the Jungle-then-Desert route, but actual arrival may be earlier and lower. The code does not enforce a uniform +3 loadout or force this biome order. Physical node crossings use map exits in `server/src/systems/world/transitions.ts`; auto-traverse's completion picker in `shared/src/systems/biomeProgress.ts` does not encode this narrative route. The intended route and farming time remain designer assumptions.

T2 progression requires two distinct T1 boss first-clear seals (`shared/src/systems/tierAdvancement.ts`); it does not require all T1 mastery capped. Relevant ordinary equipment and these core recipes have no extra boss-clear field. Dungeon guardians are encounter barriers on the way to boss seals, not a universal +4/+5 catalyst or item unlock. Do not infer an additional Jungle/Desert guardian gate from the mature harness. T2's three-seal advance to T3 is separate and grants no T3 equipment here.

## Item provenance and maxima

All ordinary items below have structural maximum +5; actual upgrade is the minimum of that cap, the GM gate and paid per-item mastery gates. Cores have +0. Returning T2 pieces evolve from their named T1 predecessor at +3, or use the authored reconstruction price. Evolution consumes the predecessor and starts the new piece at +0, not its old upgrade. Sources: `shared/src/data/recipes/{forest,cave,mountain,swamp,jungle,desert}.recipes.ts`, `server/src/systems/player/economy/{crafting,itemEvolution}.ts`.

| Item | Base mastery | Per-item requirement for +3 / +4 / +5 | Catalyst step costs |
|---|---|---|---|
| Gale Needle (Flash Rapier lineage) | Forest 7 | 10 / 11 / 12 | +4: 1 Alacrity; +5: 2 Alacrity |
| Ruinous Axe (Chaotic Axe lineage) | Cave 7 | 10 / 10 / 10 | +4: 1 Swarming; +5: 2 Swarming |
| Mountain armor | Mountain 8 | 10 / 10 / 10 | +4: 1 Heavy; +5: 2 Heavy |
| Cave armor | Cave 8 | 10 / 10 / 10 | +4: 1 Swarming; +5: 2 Swarming |
| Swamp armor | Swamp 8 | 10 / 10 / 10 | +4: 1 Fortified; +5: 2 Fortified |
| Swamp charm | Swamp 9 | 10 / 10 / 10 | +5: 1 Fortified |
| Mountain charm | Mountain 9 | 10 / 10 / 10 | +5: 1 Heavy |
| Mountain boots | Mountain 10 | 10 / 10 / 10 | +5: 1 Heavy |
| Cave boots | Cave 10 | 10 / 10 / 10 | +5: 1 Swarming |
| Stinger Rapier | Jungle 1 | 4 / 4 / 4 | +4: 1 Alacrity; +5: 2 Alacrity |
| Jungle armor | Jungle 2 | 4 / 4 / 4 | +4: 1 Alacrity; +5: 2 Alacrity |
| Jungle charm | Jungle 3 | 4 / 4 / 4 | +5: 1 Alacrity |
| Desert armor | Desert 2 | 4 / 4 / 4 | +4: 1 Dominion; +5: 2 Dominion |
| Desert boots | Desert 4 | 4 / 4 / 4 | +5: 1 Dominion |
| Tempered Core | Cave 12 | +0 only | Craft: 500 red and 4 Dominion |
| Survivalist Core | Jungle 6 | +0 only | Craft: 500 green and 4 Fortified |
| Force Core | Desert 6 | +0 only | Craft: 500 yellow and 4 Dominion |

Jungle and Desert debut at T2, so their relevant ordinary items are plain crafts without a T1 predecessor. Tempered is legally possible before Jungle if Cave12/payment were already earned; it is not automatically present on entry. Survivalist is unavailable before first Jungle and remains unavailable at Jungle4. Force remains unavailable at Desert4. Established early Desert is pre-Desert-capstone, not necessarily pre-capstone in every earlier biome.

Catalysts are combat-family rewards from matching node modifiers, not biome-unique or boss-only tokens. `server/src/systems/player/progression/rewards.ts` mints one per 100 progress, with monster weights and tier reward scaling; T1 has the configured 0.5 multiplier. Examples already available in earlier T2 biomes: Alacrity Forest-01, Swarming Forest-02, Dominion Forest-03, Fortified Forest-04, Heavy Mountain-01. Exact node IDs and every relevant cost are in ENTRY_FACTS.json. Their presence proves a legal resource source, not affordability at a particular playtime; no farm loop or economy simulation was run.

## Proposed legal profiles for later approval

These are concrete gear/mastery proposals for a Light or Balanced Striker, not executed builds or an armor ranking. They intentionally leave the core slot empty unless an independently earned core is approved. All include no relic, no later-tier range/skills, and only earned ability/rune ownership. They assume enough previously farmed essence and catalysts to pay the authored costs; no synthetic wallet is proposed for an entry test.

| Profile | Mastery: Plains / Forest / Swamp / Mountain / Cave / Jungle / Desert | GM / RP | Weapon / armor / charm / boots / core |
|---|---|---|---|
| First Jungle | 12 / 12 / 12 / 10 / 10 / 0 / 0 | 56 / 27 | Gale Needle +3 / Mountain +3 / Swamp +3 / Mountain +3 / empty |
| First Desert after Jungle | 12 / 12 / 12 / 11 / 11 / 6 / 0 | 64 / 28 | Gale Needle +4 / Mountain +4 / Swamp +4 / Mountain +4 / empty |
| Established early Desert | 12 / 12 / 12 / 11 / 11 / 6 / 4 | 68 / 29 | Same +4 gear / empty; Desert boots +4 legally craftable but not selected as a treatment |

The first profile can substitute a retained T1 +5 piece rather than pretending every slot must be T2 +3. For the second, a paid Stinger +4 is legal after Jungle4, but its selection is a later whole-weapon choice. Cave armor is a legal generalist alternative at these mastery levels; Mountain remains only the Guard-oriented reference, not a measured winner. Survivalist +0 becomes an affordable-ownership option after Jungle6; Tempered is excluded from the proposed Cave10/11 profiles.

Native Striker policy/Offensive/Power Strike/Second Wind/Brace/Cleanse costs 27 RP and fits all three proposed budgets. Relevant ability recipes: Sweep Plains2, Second Wind Forest2, Cleanse Swamp3, Brace Mountain3, Power Strike Mountain5; relevant purchased runes: Avoid Hazards Swamp2, Step Back Cave2, Keep Distance Mountain3 if a later ranged profile needs it. Find Enemies/Recover First use current starter ownership; the deprecated Recover First craft is not a new purchase. Do not transfer the mature GM72 skill tree, ability ranks or ownership wholesale into these proposals: an eventual entry packet must apply its chosen class tree and ranks from this declared mastery and actual purchases.

At Desert4 the Focus Lowest HP recipe costs 90 yellow and becomes legal, but equipping it adds 3 RP. The unchanged native 27-RP reference plus Focus costs 30, so the GM68 proposal has **one RP too little**. GM70 (for example, earlier five biomes at12, Jungle6, Desert4) supplies 30 RP while T2 gear still caps at+4; alternatively the designer must approve a different loadout. No Guard/strategy is silently removed to manufacture an opening-policy entry profile. Wait It Out remains unequipped and Cleanse unchanged. This is an acquisition/capacity boundary, not a combat failure.

Approval later must select the actual route, affordability checkpoint and class-specific tree/ranks; none authorizes entry combat now. No elapsed farming time, entry survival, economy calibration or optimal armor is claimed.
