# Fixed packages

All comparisons retain mature T2 mastery: Plains/Forest/Swamp/Mountain/Cave 12, Jungle/Desert 6; Global Mastery 72, budget 30 RP. Ordinary equipment is +5, Tempered +0, relic empty. Skills, ranks and stats are in applied receipts; no T3 range nodes or later skills. Starting HP/barrier equal their composed maxima. These are synthetic mature packages, not measured acquisition paths.

| Block | Identities | Weapons | Armor | Charm | Boots | Core | Stance / Technique | RP |
|---|---|---|---|---|---|---|---|---|
| A Swamp | Light Spirit, Balanced Spirit, Light Slinger | Stinger / Ruinous Axe | Swamp | Swamp | Desert | Tempered | Offensive / Sweep | 30/30 |
| A Mountain | Same three | Same two | Mountain | Mountain | Cave | Tempered | Offensive / Power Strike | 30/30 |
| B Desert | Light Striker, Balanced Striker | Gale Needle | Mountain | Swamp | Mountain | Tempered | Offensive / Power Strike | native 27/30; opening 30/30 |

Ordered Guards: Second Wind, Brace, Cleanse. A keeps Find Enemies; inside-telegraph Step Back; in-combat Keep Distance; Avoid Hazards; Recover First, in that order with native triggers. B keeps the same order without Keep Distance. Candidate prepends `in-combat -> focus-lowest-hp`, preserving every original rule's relative order.

Both B arms reserve 90 yellow initially. Candidate has no Focus Lowest HP before calling production `craftRuneRecipe`, pays 90 at Desert mastery 6 (gate 4), and performs the existing sanitized/RP-validated edit at time zero. Final yellow is 0, ownership true. Native retains 90 and never schedules an edit. Receipts record prior rules/HP and final payment/ownership/RP. No combat grant, forced target or movement bypass.

Whole weapons carry attack, cadence, on-hit effects and axe drawback. Fixed core interactions are part of the declared context. Compare useful work and health pressure together, not an isolated proc or coefficient estimate. Swamp uses Sweep for both weapons regardless of generic slow-weapon defaults.

B uses the existing strategy/bond recorder as observation only. Selection, eligibility limits, damage and kill order remain distinct. Heavy Spirit/boss specialization, T1 Conduit, T3 Apprentice and Jungle DoT remain later questions. Cleanse stays unchanged; Wait It Out and Endure stay unequipped. No armor search or extra biome.
