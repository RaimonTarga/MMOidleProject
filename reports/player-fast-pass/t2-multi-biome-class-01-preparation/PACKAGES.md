# Fixed packages and explicit tradeoffs

The catalogue has 126 primary packages (108 A + 18 D) and six weapon alternatives, each repeated for two seeds. Definitions are in server/bench/balance/t2MultiBiomeSpec.ts. PACKAGE_CATALOGUE.json contains the exact applied equipment, upgrades, skill path, guards with tier-resolved effects, production RP, ownership gates, and Conduit readbacks. QUALIFICATION_RECEIPTS.json binds every seeded observation to its initial roster hash.

## Identity templates

| Root | Light / Balanced / Heavy weapons | Core | Stance |
|---|---|---|---|
| Striker | Gale Needle / Gale Needle / Knight Steelsword | Tempered | Offensive / Offensive / Defensive |
| Squire | Quake Hammer / Quake Hammer / Quake Hammer | Tempered | Defensive throughout |
| Apprentice | Ruinous Axe / Ruinous Axe / Quake Hammer | Tempered | Offensive / Offensive / Defensive |
| Slinger | Stinger Rapier throughout | Tempered | Offensive / Offensive / Defensive |
| Conduit | Stinger Rapier / Ruinous Axe / Quake Hammer | Survivalist | Defensive throughout |
| Spirit | Stinger Rapier / Ruinous Axe / Quake Hammer | Tempered | Offensive / Offensive / Defensive |

Gale Needle is 1.60 attacks/s; Stinger Rapier 1.55; Ruinous Axe 1.20 with every-fourth-swing drawback; Knight Steelsword and Mirebrand 1.00; Quake Hammer 0.55 with empowered and Technique cast-speed modifiers. These are whole items, not equalized Attack or calculated best-in-slot scores. Squire expresses empowered-hit delivery. Heavy Apprentice and Heavy Conduit express slow/high-potency delivery; Conduit uses existing formation adapters, not a new estimator. Survivalist's recovery supports normal Conduit owner payment/reconstruction at the expense of Tempered's potency; availability is not delivered damage.

All templates use native T2 frames without T3 paths/range nodes. The pre-T3 ranged roots are Apprentice, Slinger, Conduit and Spirit. All primary packages retain Second Wind, Brace and Cleanse. No Break Free (T3), Endure, Frenzy, Detonate, Quick Strike, extra rites or Wait It Out. Cleanse's existing removal semantics remain unchanged; T2 hard-control gaps remain real limitations.

## Biome overrides

| Biome | Technique | Armor | Charm | Boots / intent |
|---|---|---|---|---|
| Plains | Sweep, or Slam for Quake Hammer primaries | Plains plating; Slinger Jungle attack-hit synergy; Spirit Mountain Guard support | Swamp pulse; Spirit Mountain barrier | Melee Mountain approach / ranged Desert mobility |
| Forest | Same class-appropriate AoE, no alpha factorial | Same as Plains | Swamp pulse; Spirit Mountain barrier | Same as Plains |
| Swamp | Same AoE; innate Apprentice DoT and W2 test are distinct | Swamp DoT resistance for all | Swamp recovery pulse for all | Melee Mountain approach / ranged Desert mobility |
| Mountain | Power Strike | Mountain Guard potency and bulk | Mountain barrier | Cave stealth reduces incidental pulls; native kiting retained |
| Cave | Power Strike | Cave generalist DR | Swamp pulse; Spirit Mountain barrier | Cave stealth; no spawn/aggro isolation |
| Jungle | Same class-appropriate AoE | Plains plating; Slinger Jungle; Spirit Mountain | Swamp pulse for all | Melee Mountain approach / ranged Desert mobility; Avoid Hazards |
| Desert | Power Strike | Mountain Guard potency and bulk | Swamp pulse; Spirit Mountain barrier | Melee approach with delayed lowest-HP rule; ranged mobility/Keep Distance |

Plains armor buys frequent-hit plating instead of specialized Guard potency/DR/DoT resistance. Jungle armor is Slinger-specific and gives up that plating specialization; Spirit's Mountain shell and barrier support its frame mechanic but accept attrition/recharge risk. Swamp armor trades burst mitigation for sustained DoT defense. Cave DR and stealth trade class-specific offensive effects and approach speed for mixed-elite survival and fewer incidental pulls. Mountain Guard potency depends on actual Brace windows; it is not permanent immunity. Swamp charm gives periodic HP recovery instead of Mountain's larger rechargeable secondary pool; Jungle breaks the Spirit barrier default deliberately because dense attrition may interrupt recharge. No kill-chain charm is imposed on slow-kill frames.

Rules are ordered Find Enemies, Step Back, ranged Keep Distance when applicable, Avoid Hazards, Recover First. Abilities use normal native triggers; no private timing controller. Fixed stance costs 1 RP, one Technique and all three Guards are paid normally. Melee starts at 27/30 RP; ranged at 30/30. Desert melee reserves the remaining 3 RP for In Combat -> Focus Lowest HP, prepended once at the midpoint. No required primary defense was removed to fund an alternative.

## B: only the declared weapon changes

| Pair | Identity | Primary -> alternative | Fixtures |
|---|---|---|---|
| W1 | Apprentice Balanced | Ruinous Axe -> Quake Hammer | Swamp and Cave |
| W2 | Slinger Balanced | Stinger Rapier -> Mirebrand | Swamp and Cave |
| W3 | Striker Light | Gale Needle -> Knight Steelsword | Swamp and Cave |

Technique stays fixed even when a weapon changes: W1 Swamp retains Sweep in both arms. Armor, core, charm, boots, stance, frame, rules and ability triggers remain identical. Controls are fresh A observations. Pairs are adjacent and reversed on seed 101021; initial native roster hashes must agree. Later exposure may diverge naturally. Squire Slam comparison is absent; Slam as the fixed primary AoE for slow weapons is not that excluded comparison.

No numerical values are adopted from eventual results. Desert before/after windows are a scheduled within-life strategy change with survivor selection, not an independent randomized treatment comparison. A death before five minutes cannot establish failure of the rune that was never used.
