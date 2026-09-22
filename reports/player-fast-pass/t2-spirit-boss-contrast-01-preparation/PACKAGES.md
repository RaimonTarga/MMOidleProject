# Ten resolved boss packages

All receipts were constructed through the final frozen child with zero World ticks. Same package across seeds 101009/101021. Full details are in PACKAGES.json and qualification/resolved-builds.json.

| Identity (live frame name) | Boss | Weapon +5 | Armor +5 | Charm +5 | Boots +5 | RP used / spare | Start HP / barrier | Native range |
|---|---|---|---|---|---|---|---|---|
| breadth-t2-spirit-light (Spark) | apex-timberclaw | jungle-stinger-rapier | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 221 / 124 | 142 |
| breadth-t2-spirit-light (Spark) | stoneplate-juggernaut | jungle-stinger-rapier | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 221 / 124 | 142 |
| breadth-t2-spirit-balanced (Wraith) | apex-timberclaw | jungle-stinger-rapier | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 230 / 129 | 142 |
| breadth-t2-spirit-balanced (Wraith) | stoneplate-juggernaut | jungle-stinger-rapier | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 230 / 129 | 142 |
| breadth-t2-spirit-heavy (Phantasm) | apex-timberclaw | quake-hammer | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 244 / 137 | 142 |
| breadth-t2-spirit-heavy (Phantasm) | stoneplate-juggernaut | quake-hammer | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 244 / 137 | 142 |
| breadth-t2-slinger-light (Scout) | apex-timberclaw | jungle-stinger-rapier | jungle-vest-t2 | swamp-charm-t2 | desert-boots-t2 | 30 / 0 | 253 / 0 | 132 |
| breadth-t2-slinger-light (Scout) | stoneplate-juggernaut | jungle-stinger-rapier | mountain-vest-t2 | mountain-charm-t2 | desert-boots-t2 | 30 / 0 | 231 / 60 | 132 |
| breadth-t2-squire-heavy (Bulwark) | apex-timberclaw | quake-hammer | plains-vest-t2 | swamp-charm-t2 | mountain-boots-t2 | 27 / 3 | 281 / 0 | 12 |
| breadth-t2-squire-heavy (Bulwark) | stoneplate-juggernaut | quake-hammer | mountain-vest-t2 | mountain-charm-t2 | mountain-boots-t2 | 27 / 3 | 317 / 82 | 12 |

Tempered Core +0, Offensive Stance, empty relic/rites, no T3 range node. Returning biomes 12; Jungle/Desert 6; GM72; budget 30. All ordinary items are +5. Squire leaves 3 RP unused; ranged packages use 30/30.

All use Power Strike II, Second Wind II and Brace II. Find Enemies, telegraph Step Back, Avoid Hazards and Recover First are retained; the four ranged identities also Orbit. `target-casting -> use-ability (brace)` replaces Brace's default trigger; it is not an additional independent default. Second Wind remains native.

All Spirit packages start energy 0/100, no armed discharge and empty ability cooldown map. Squire starts uninitialized with executionCooldownMs 0 and no armed execution: its first production tick starts the native frame timer; zero does not mean a free empowered opener. All start at (2400,2800), 400 units from the boss at (2400,2400), full owner HP/barrier and full boss HP, boss barrier zero. Initial boss bodies/positions match across seeds, and seeded RNG state is explicitly 101009 or 101021 with no initialization draws. Seed variation applies to subsequent production randomness; identical outcomes must remain recorded.

Farming-to-boss translation: fixed Power Strike instead of farming Technique selections; Second Wind/Brace instead of the three-Guard farming set; reactive Brace Rune added; Offensive applies to every frame including Heavy Spirit. Spirit uses the specified common Mountain armor/charm; Balanced uses the previously measured Stinger alternative and Heavy uses Quake. Forest retains Slinger Jungle/Swamp and Squire Plains/Swamp; Mountain gives every identity Mountain/Mountain. Ranged Desert boots and melee Mountain boots follow the brief. No outcome-based optimization was performed.

Initial Forest boss HP is 3750 and Mountain boss HP is 5000 (verify authoritative bossRuntime in each receipt). Guardian access, travel and prior clearing are excluded: the accepted harness removes guardians and invokes the production dungeon boss spawn. This trial replaces the old unmeasured full World wake tick with the same production `tickDungeons` initialization only, for both qualification and execution. No precombat energy gain, cooldown advancement or owner movement is introduced.
