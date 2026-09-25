# Volcano area investigation — 2026-09-25

Follow-up: the six proposed values were subsequently applied on local `develop` and tested in 52 observations. See [EXPERIMENT.md](EXPERIMENT.md) for results and limitations. The census and proposal below retain the original pre-change baseline.

Recommendation: test a targeted damage reduction, preserving mixed packs and Heat. Evidence is strongest for T3 encounter-level attrition and T4 filler/Burn pressure. Individual T3 attack values do not support a blanket roster nerf.

This is a proposal, not an applied balance change. Current-source audit at HEAD `ff98ba4513cb9fcb1e5752acfd56495268aff416`, with existing unrelated working changes present. Census imports current shared source. No fresh combat simulation or live telemetry was run; historical results below are explicitly historical. The JSON contains authoring values, not delivered player damage, spawn-weighted averages, or acquisition evidence.

## 1. Why the combination hurts

Volcano's hound packs contain 4–5 bodies, tortoise packs 5–6, and T4 elite packs 4. The runtime chooses exactly one follower variant in addition to the core. Pack members share acquisition and pursuit; touching a follower can engage the group, and killing the alpha does not dissolve surviving followers. Those are real coordinated encounters, not merely a dense field of independently selectable enemies.

Base population target is 36 versus Jungle 40, Tundra 16, Desert 16. Native Swarming Volcano targets round to 42 at T3 and 43 at T4. Packs consume the population budget; they are not added on top of 36 independent enemies. The final whole pack can overshoot a target. Smaller packs at unchanged population also change the mixture of anchors versus followers, so reducing pack size is not a clean population nerf.

Heat starts at one stack when combat begins, then gains one every 3 seconds at baseline. It also grows through the post-combat grace period (normally 4 seconds). At stacks above 10, effective stacks are `10 + 5 × ln(1 + (stacks − 10)/5)`. It has diminishing returns, not a hard cap.

| Heat stacks | Approximate uninterrupted time from first stack, no accelerators | Direct outgoing bonus | Incoming pipeline-hit bonus |
| ---: | ---: | ---: | ---: |
| 5 | 12 s | 15% | 22.5% |
| 10 | 27 s | 30% | 45% |
| 20 | 57 s | 46.5% | 69.7% |
| 25 | 72 s | 50.8% | 76.2% |
| 40 | 117 s | 59.2% | 88.8% |

Cooling begins after combat eligibility ends. At 10 stacks or fewer it removes one stack per 1.5 seconds; above 10 it accelerates with stack count. An optional Manage Heat rule stops seeking fresh encounters at 25 and resumes at 10, but finishes existing threats. It cannot protect a weak build from its first pack. Heat's outgoing multiplier is read in the direct player attack path; do not assume every damage channel or summoned attacker receives the same benefit.

Sources: `shared/src/data/monsters/volcano.monsters.ts`; `shared/src/biomeDatabase.ts`; `shared/src/world/nodeModifiers.ts`; `server/src/world/World.ts:getMobDensity`; `server/src/systems/world/spawning/index.ts:packFollowerGroups, spawnPack, ensurePopulation`; `server/src/systems/combat/ai/packs.ts`; `shared/src/world/nodeFeatures.ts:volcanicHeat`; `shared/src/systems/playerAmplifiers.ts`; `server/src/systems/world/nodeFeatures.ts:updateAmbientRamp`; `server/src/systems/combat/ai/engagement.ts`; `server/src/systems/combat/ai/heatManagement.ts`.

## 2. Ordinary attack comparison

Basic DPS below means attack / authored cooldown, before mitigation, modifier, Heat, travel, cast occupancy, evasion, target uptime, abilities, or DoT. These are comparable arithmetic components, not universal biome difficulty rankings.

| Roster | Basic DPS per monster, range | Encounter interpretation |
| --- | ---: | --- |
| T3 Volcano | 28.1–61.5 | Guaranteed coordinated packs; full pack sums 145.9–193.2 |
| T3 Jungle | 32.1–55.0 | Terrain/ambush and abilities contribute beyond basic attacks |
| T3 Tundra | 46.3–61.5 | Larger isolated hits, low population; Chill suppresses player tempo |
| T3 Desert, including follower | 27.9–50.5 | Controller plus dealer; control/vulnerability matters |
| T4 Volcano | 33.3–78.6 | Full pack sums 230.8–322.0, before Burn/abilities |
| T4 Jungle | 34.7–43.3 | Substantially larger authored HP on several enemies |
| T4 Tundra | 55.0–68.8 | Larger hits and distinct defenses/abilities |
| T4 Desert, including follower | 30.0–78.9 | Paired pressure and control |

Example: a T3 tortoise + four Scuttlers + one Ash Salamander has 6,930 HP and 193.2 raw basic DPS. Holding 10 Heat fixed would scale its basic-hit budget to 280.1 before player defenses, assuming all six continuously attack. This is a pressure illustration, not measured loss of HP per second: the slow tortoise may arrive late, followers die, and casts/movement interrupt attacks.

The T3 Scuttler is already relatively weak: 45 attack / 1.6 s = 28.1 basic DPS, 650 HP. By contrast, T4 Skink is 75 / 1.3 s = 57.7 basic DPS, 720 HP, plus Burn. Its basic DPS rises 105% while HP rises only 11%. A follower that dies quickly can still deal substantial opening damage when four or five arrive together.

Node modifiers require separate accounting: T4 Alacrity gives approximately 25% more basic DPS, Heavy about 16.7%, Dominion 40% plus defensive changes, while Fortified prolongs encounters. Swarming changes population instead. Monster DoT also receives the authored modifier's damage scaling. Do not compare different modifiers as if Heat alone caused the result.

## 3. T4 Burn is a separate pressure layer

- Skink: 13 damage per stack, maximum 4, 1-second ticks, 2-second refreshed duration: 52 raw DPS at full stacks.
- Ashspitter: 16 per stack, maximum 5, 1-second ticks, 2.5-second refreshed duration: 80 raw DPS at full stacks.
- These are distinct debuff IDs. Their combined full-stack ceiling is 132 raw DPS before modifiers/resistance. Multiple Skinks share the same capped status; it is not 52 DPS per Skink. Repeated applications build and refresh stacks; actual uptime depends on landed hits and mitigation.
- Monster Burn uses linear stacks. It bypasses plating and the direct-hit cap, applies ordinary DR at half strength, then dedicated DoT resistance and final core/stance layers. Wards/barrier can absorb it, and ticks reset barrier recharge delay.
- Crucially, this tick path does not call `playerIncomingDamageMult`: Heat does not multiply this Burn. Lava feature damage also has its own path. Do not multiply the 132 ceiling by Heat.

This interaction pressures builds relying on plating, damage caps, or barrier recharge between attacks, despite their direct-hit defenses. The maximum is not an assertion that every pack immediately reaches both caps.

Sources: `server/src/systems/combat/status/monsterDot.ts`; `shared/src/systems/monsterDotFlavor.ts`; `shared/src/systems/damage.ts:computeLinearDotDamage`; `server/src/systems/classes/archetypes/dot/dotPrototype.ts`; `server/src/systems/combat/damage/playerAmplifiers.ts`; `server/src/systems/combat/damage/finalDamage.ts`; `shared/src/world/nodeModifiers.ts:modifiedDotDamagePerStack`.

## 4. Historical combat evidence

The retained `reports/player-fast-pass/overnight-endurance-01/run-01/REPORT.md`, executed at `e26fdccd3baaa96fe1d19263349d57d9c5abc626`, reports the same T3 package/seed coverage across two fixtures:

| Historical fixture | Survived 5 minutes | Survived 30 minutes | Deaths |
| --- | ---: | ---: | ---: |
| T3 Tundra-03 | 42/48 | 36/48 | 12/48 |
| T3 Volcano-03 | 23/48 | 17/48 | 31/48 |

Ash Salamander (`ash-slinger`) was the recorded killer in 18 observations. This strengthens the case for examining persistent backline pressure. Last-hit attribution is not a damage-share breakdown. These are synthetic fixed-build observations on an older revision, not a current production death rate. No raw stream revalidation or current rerun was performed for this study.

The later `reports/player-fast-pass/volcano-heat-closeout-01/REPORT.md` covers 26 observations in total, with six managed-Heat farming lives. Survival included two long hazard-approach stalls. Their missing kills were not caused by a Heat acquisition veto; do not count quiet survival as sustained farming or propose a damage nerf as a fix for navigation. This also shows why the older negative result must not be generalized to all prepared builds.

## 5. Recommended candidate values

Test the following as separate steps so their contributions remain measurable. Values are initial tuning proposals, not fitted or combat-validated optima.

| Priority | Parameter | Current → candidate | Purpose |
| --- | --- | --- | --- |
| A | Heat incoming damage per effective stack | 4.5% → 3.5% | Reduce shared direct-hit escalation while keeping taken growth above the 3% dealt growth |
| B, T3 | Ash Salamander attack | 84 → 70 | Reduce persistent backline basic DPS 16.7% |
| B, T4 | Ashspitter attack | 110 → 95 | Reduce backline basic DPS 13.6% |
| B, T4 | Ember Skink attack | 75 → 60 | Make massed filler hits less punishing; basic DPS 57.7 → 46.2 |
| C, T4 | Ember Burn damage per stack | 13 → 8, retain cap 4 | Full-stack budget 52 → 32 |
| C, T4 | Ash Burn damage per stack | 16 → 12, retain cap 5 | Full-stack budget 80 → 60 |

Heat A changes the incoming multiplier at 10 stacks from 1.45 to 1.35 (6.9% less at this layer), at 25 from 1.762 to 1.593 (9.6% less), and at 40 from 1.888 to 1.691 (10.5% less). It leaves cold opening damage unchanged. Downstream cap/barrier effects mean HP loss need not fall by those exact percentages. Heat applies in boss rooms too: changing the common coefficient requires separate boss validation.

C reduces the combined full-stack Burn ceiling from 132 to 92, about 30%, with no extra mechanics. The two Burn types remain distinct, and durations/stack counts remain unchanged. A alone cannot address Burn pressure, and C alone cannot address T3 failure.

My preferred first test is A, followed by B and then C as needed from damage traces. If T4 deaths already happen while cold, prioritize its B/C comparisons rather than expecting A to solve opening damage. Do not simultaneously cut HP, density, pack size and Heat: that would obscure the cause and could overbuff clear speed and recovery-on-kill access.

Fallback if deaths remain concentrated before the first kill: reduce the tortoise's guaranteed filler count from 3 to 2, changing 5–6-body herds to 4–5, then remeasure actual population composition. Keep hound/elite formation identities. Prefer this only if traces show opening concurrency is the residual problem. Keep tortoise/elite HP and signature casts for the first candidate; they are deliberate long-fight threats.

## 6. Validation needed before adoption

Use a fresh matched baseline and candidates at the same source, builds, seeds, modifier and starting Heat. Cover T3/T4 separately, including arrival and prepared kits with melee, ranged and summon ownership. Start with isolated full packs to measure first-kill time and cold damage; follow with populated ordinary nodes to measure carry-over Heat and overlapping engagements.

Capture attackers at death, damage split by source and hit/Burn/lava, Heat at first kill/death, HP damage plus absorption, attack delivery, active fighting time, kills, and no-progress windows. Compare same-tier Jungle/Tundra/Desert with declared modifiers; analyze boss rooms separately because the common Heat coefficient reaches them. Require survival with continuing progress; do not treat a stalled run as successful farming. Judge nerf magnitude from those results before combining candidates.

Executed here: current-source census and arithmetic generation only (`pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/volcano-area-study-2026-09-25/census.ts`). No gameplay source edits, combat runs, full test suite, browser session, production telemetry query, merge or deployment.
