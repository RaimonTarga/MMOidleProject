# Bot balance theorycrafting reference

Updated: 2026-09-13. Owner: Astra. Reusable reasoning and candidate builds, not an execution packet or balance specification.

Source anchor: `99391c589fe7828e90de780ec95be6d1beb70100`. Concurrent uncommitted monster slow/root changes were visible at the end of this review; control-dependent candidates require a fresh audit on their eventual execution revision. The human recording does not identify its gameplay revision. Revalidate after ability, RP, equipment, class-delivery, movement, or boss changes.

## Decision and evidence boundaries

September14 update: user manually confirmed the lava bug and had it fixed in
`6e1f1ee11cb9c8732468b68c97ddffddd2226b41`. Static damaging features/contact
bands now join escape planning before recovery. Focused hazard tests pass;
the old isolated diagnostic now moves toward a safe destination with Recover
First enabled. Live transit remains unvalidated. V1l holds Night2-C's build
fixed, including Recover First, to test the fix. Historical lava-gap notes
below describe the old revision, not the current implementation.

Cave counterplay reminder from the user: Cleanse can remove the slow, allowing
Step Back/movement to clear the AoE. Treat mobility restoration as a separate
benefit from removing corrosion stacks. Check actual removed effects and
activation timing; a Cleanse activation alone does not establish a safe exit,
especially if another debuff is selected or the slow is reapplied. Prior
V1k records already include a slow removal. No new Cave arm is needed for V1l.

Night 2 source follow-up (`14bda8be`, then harness-only bridge `8ebfbbad`): [ledger](bot-balance-night2-ledger.md) reconstructs the two Cave losses and freezes a timing comparison. These are new hypotheses, not observed improvements. The operator has the immutable packet; no gameplay balance changed.

Night2-A observed update: Cave control2/2, timed Brace2/2 and Jungle Hamstring2/2, all safe tails. Timed Brace precedes three of six slams per case by about600ms, but all boss slams still hit. It works as a timing instruction, not a dodge, and neither arm wins more often in this small sample. Jungle activates Hamstring5 times per boss; shield/slow contact is not recorded. Historical Cave losses plus contemporary control wins mean feasibility is established while consistency remains uncertain. The next test combines three known candidate wins into one actual progression history.

- Match a timing rule to its **actual runtime cue**. Enemy Charging currently recognizes damaging pattern `cast` steps, but Cave Eruption is an `impact` and Jungle Ambush is a `payoff`. A visible animation/name does not prove that a specific Rune condition sees it. Inside Telegraph uses hostile ground geometry and can drive Brace independently of the movement channel.
- A low-HP Guard can arrive after the event it needed to prevent. Compare activation to impact, duration expiry and the next ordinary hit. Also compare cooldown to encounter recurrence: a10s Brace cannot automatically cover every9s eruption. Earlier activation trades later low-HP coverage for earlier burst mitigation; test both outcomes.
- Movement control earns value only when it improves delivery or reduces exposure. Jungle's fleeing speed passes through the shared monster slow multiplier, so Hamstring can buy contact time. It does not slow attack cadence, guarantee a shield break or cancel stealth. Heavy Spirit's burst and a short breakable shield window make that a plausible package, with Expose omitted to avoid competing for the armed Technique channel.
- Be precise about lethal traces: the V1k Cave `killingBlow` fields point to earlier eruptions; authoritative death causes identify later melee88/90. Timestamp joins are required. An absorb-labelled heal event with unchanged HP is not recovered HP. Neither run-wide heal totals nor a stale damage window establishes boss sustain.

Conditional T3 source screen: Desert controller/dealer pairs provide a reference question about range and target access. Gilded Scarab has510HP,120attack/1900ms and1.6× Sunbeam; controller root/vulnerability can amplify exposure. Wisp adds80 range and12% move speed, whereas Shade adds more HP/attack growth; compare actual reachable builds from the same earned unspent-point checkpoint before ranking. Tundra's160–185 ordinary base attacks and Volcano's multi-body engagement/Heat remain separate high-risk concerns. Low enemy eHP/TTK can shorten exposure while concealing dangerous damage spikes; short survival does not establish a balanced farming loop. Base stat lines are not final runtime hit predictions.

V1j follow-up: [assessment](bot-balance-v1j-assessment.md) records Mountain2/2 and fragile Swamp kills. The important new hypothesis is damage-type mitigation before additional recovery tuning: Bog Wrappings' DoT resistance versus Cave armor, with the charm fixed. Post-kill poison/debt survival is a separate outcome. V1k also opens Cave/Desert; it does not rank the V1j charms or claim class-wide optimal builds.

V1i follow-up: [assessment](bot-balance-v1i-assessment.md) accepts the narrow Axe Plains/Forest feasibility results, closes two resource blocks and selects Mountain plus a Swamp charm comparison. The next step tests principles on different encounters rather than repeatedly optimizing the human Plains example. No energy/delivery telemetry supports a causal explanation for the Needle losses. Monster-control changes are now committed in `bab111f9`; V1j uses a new frozen source.

Build around the encounter's damage distribution, target behavior and recovery opportunities. A generic defensive package is a useful control, but should not remain the presumed best build. The user's Plains playtest demonstrates why: flat plating, recovery on kill, speed on kill and automatic kiting form a coherent solution to an add encounter.

The campaign asks whether an expert-prepared character can succeed using ordinary player tools. It does not require every class to beat every boss, predict average-player preparation, or establish a global optimum. User strategy documents are pointers; current code and observed behavior take precedence.

Night2-B travel lesson: the continuous three-seal sequence succeeded, but the
unbranched T3 character died in Volcano transit with five attackers and no
ability activation. Navigation has Auto off; without the ordinary Fight Back
travel Rune, merely equipping Guards does not make them run. Audit the control
mode as well as the loadout. Shipped Fight Back attaches fightsWhileTraveling,
enabling normal targeting/ability firing; Recover First can hold that pause
until healed. Avoid Enemies reduces avoidable local contact but cannot promise
an empty path. C tests these rules with Sweep and dual Guards as a whole transit
package, keeping previous acquisition and bosses unchanged. The hit window
starts full HP and collapses in about4.8seconds; it is a density/burst warning,
not yet proof that optimized T3 entry is impossible.

Night2-C result: both Guards and Sweep do fire during travel; one Scuttler
dies. The character still dies after52.287seconds in Volcano, with repeated
environmental14HP ticks and zero attackers in the last samples. `Tiny Wisp`
is the node-feature death logger's fallback name. Separate positional lava
burn from ambient Heat. Static lava is absent from the runtime-ground-pool
escape helper; Recover First holds a hurt character's travel, while damaging
terrain suppresses out-of-combat regeneration. This is a source-supported
behavior-gap hypothesis, not an exact trajectory reconstruction or a mob
attack balance verdict. Static contact includes a40px edge band. A diagnostic
must include that band, active Rune intent, position and damage-effect ID.

The isolated `server/scripts/botStaticLavaDiagnostic.ts` now reproduces the
interaction with real static lava geometry: Recover First leaves a hurt
post-combat traveler paused/motionless; omitting it resumes navigation.
Both variants report actual damaging contact and no dynamic escape destination.
Do not interpret that as proof the alternative survives the crossing. The
general lesson is to verify that a recovery policy can leave the condition
which suppresses recovery; defensive abilities alone cannot repair that loop.

Night2-D candidate: transfer the kill-chain principle to Bulwark Squire, not
Spirit's weapon. Quake Hammer supports Squire's8s empowered cadence; the
class's slow swings make reliable Sweep/add delivery worth testing. Hold
Plains charm/boots and Sweep/SW/Brace fixed, compare Mountain armor's HP/Guard
potency with Plains armor's flat plating under defensive stance. Buy both
armors identically first. Extra plating helps repeated small hits; Guard
potency needs actual Guard windows. Neither armor grants T3 Mountain hit caps.
Leave outcome and passive attribution open until measured.

Night2-D measured update: Mountain armor2/2 safe victories; Plains1/2, with
the other case dying to a47HP boss melee amid11 attackers. Observed Mountain
317HP/30plating versus Plains281HP/40plating. This supports prepared Squire
Plains feasibility and retaining both as candidates; it does not establish
armor superiority. Boss-only Sweep/SW/Brace counts and complete HP/DoT tails
are in the D report. Guard potency, kill recovery and Execution contributions
are not separately attributed. For another boss, revisit the charm: the
Plains kill-chain benefit need not transfer to encounters without adds.

Evidence labels used below:

- **Observed:** present in a recording or completed report, with that run's limitations.
- **Verified:** read from current source or calculated with its shared functions; not proof of runtime effectiveness.
- **Hypothesis:** a plausible interaction requiring a controlled encounter test.

V1i's [operator packet](bot-balance-v1i-operator-packet.md) remains unchanged. Read its results before selecting the next small comparison. T3/T4 ordinary-mob low TTK / insufficient eHP remains deferred; repaired boss mechanics do not establish balance.

## Human Spirit Plains clear: corrected calibration

Local evidence: [summary](../../server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/summary.json) and [raw events](../../server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/events.jsonl). These are local, uncommitted artifacts and may not exist in another checkout; preserve them before relying on this reference elsewhere.

Observed character: Spirit / energy-heavy, T2, GM72; Ruinous Axe, Plains Vest, Plains Charm and Plains Boots, all +5; Tempered Core, no relic. Recorded stats include 216 max HP, 100 attack, 817 ms attack cooldown, 142 range, 29 plating and 0.02 damage reduction. The user reports defensive stance and fully automatic combat with kiting.

| Recording time | Evidence |
|---|---|
| 0 s | Sweep, Hamstring, Second Wind, Bramble Guard and Brace equipped; Find Enemies and Keep Distance rules |
| 14.094 s | Hamstring removed |
| 15.094 s | Bramble Guard removed |
| 17.234 s | Altar interaction |
| 25.410 s | First tracked boss segment, boss already at 97.925% HP |
| 27.212 s | Before Empowered → Use Ability rule added; named ability target omitted by recorder |
| 82.235 s | Gorging Razortusk victory |

**Correction to earlier interpretation:** the final summary alone hid the initial five-ability loadout. However, neither Hamstring nor Bramble remained equipped for the actual boss encounter, and neither activated in the recording. This is evidence for Sweep / Second Wind / Brace, not a successful test of the full utility package.

The ten recorded boss segments refer to the same boss instance, with nine disengagements and a final victory. Together with the user's explanation, these describe automatic kiting and add targeting, not ten independent attempts or manual rescues. First tracked contact to victory spans 56.825 seconds; altar to victory spans 65.001 seconds. The final segment's 1.702 seconds is not the encounter TTK.

| Recorded incoming source | Damage events | HP damage | Reported plating blocked |
|---|---:|---:|---:|
| Field Hare | 19 | 17 | 228 |
| Boar | 5 | 5 | 90 |
| Gorging Razortusk | 12 | 542.789 | 348 |

The boss accounts for about 96.1% of observed HP damage. This is the **residual after this build's mitigation**: it supports the plating strategy, not a claim that unmitigated adds are harmless. More plating could have little marginal defensive value against already floored add hits. Bramble's reflection remains a separate question.

Run-wide totals: zero deaths, one boss and 22 other kills; Sweep activated six times, Second Wind three, Brace once. The 311.925-second recording includes substantial time after victory. Its 555 healing total cannot be divided by boss duration to infer encounter sustain. Reward multiplier 100 makes this noncanonical economy evidence, and unknown revision prevents exact historical reproduction.

## How to evaluate a build

1. Separate small repeated hits, isolated bursts, DoTs and ground damage. Flat mitigation can dominate the first and be inadequate for the others.
2. Identify what the character actually attacks. Boss vulnerability has little value while killing adds; add removal can simultaneously restore HP, renew speed and reduce future pressure.
3. Separate staying alive from maintaining delivery. Range, pursuit, target selection, channel contention and invulnerability windows can matter more than sheet DPS.
4. Price every ability and rule. Include stance, acquisition gates and the useful behavior surrendered to fit a new slot.
5. State a falsifier before testing: what observation would make this proposed interaction irrelevant or harmful?

### Armor and recovery are encounter choices

At +5, T2 Plains Vest supplies 65 HP and 19 plating. T2 Cave Vest supplies 76 HP, 11 plating and 17% DR. Plains trades 11 HP and percentage mitigation for eight additional item plating. Defensive stance increases plating by 20%, reduces outgoing damage by 15%, and reduces damage taken by 10%; it costs one RP. Displayed DR is not a summary of every final damage modifier.

Illustration using the shared direct-hit estimator, with fixed total defenses rather than a predicted item swap:

| Raw hit | 29 plating / 2% DR | 19 plating / 19% DR |
|---|---:|---:|
| 20 | 1 | 1 |
| 40 | 11 | 17 |
| 96 | 66 | 62 |
| 139 | 108 | 97 |

These exclude stance's final multiplier, barriers, absorbs, evasion, crits and class effects. They explain why an armor ranking changes with hit size; they are not a combat simulation. Sources: [recipes](../../shared/src/data/recipes/plains.recipes.ts), [Cave recipes](../../shared/src/data/recipes/cave.recipes.ts), [stats](../../shared/src/systems/stats.ts), [stances](../../shared/src/stances.ts), [estimator](../../shared/src/systems/combatEstimates.ts), [on-hit mitigation](../../shared/src/systems/onHitDamage.ts).

Recovery choices:

- **Plains Charm:** at T2 +5, Recovery 3 and a 42% Recovery activation for four seconds after a qualifying kill. Further kills refresh that window; they do not stack it. Plains Boots +5 add a 60% speed burst for three seconds on kill. Hypothesis: add kills sustain both spacing and recovery. Measure window uptime and kill credit, not just kill count.
- **Swamp Charm:** periodic Recovery access does not need kills. A stronger prior for isolated bosses or long gaps between adds; pulse timing can still miss the dangerous interval.
- **Cave Charm:** converts eligible positive, non-DoT damage taken into a healing pool. It is delayed recovery, not DR or one-shot protection. A build that barely takes direct damage generates little pool. V1h's small Cave screen did not establish it as the superior recovery choice.
- **Mountain Charm:** barrier offers a different defensive layer. Its value depends on how much usable barrier survives or regenerates through the encounter, not just maximum barrier.

Recovery healing is based on max HP × Recovery / 100 × active recovery fractions per second. Second Wind grants access to Recovery; “60%” does not mean an instant heal for 60% max HP. Sources: [recovery](../../server/src/systems/defense/regen/recovery.ts), [kill recovery](../../server/src/systems/defense/regen/recoveryOnKill.ts), [damage absorb](../../server/src/systems/defense/regen/damageAbsorb.ts), [Swamp recipes](../../shared/src/data/recipes/swamp.recipes.ts), [Mountain recipes](../../shared/src/data/recipes/mountain.recipes.ts).

## T2 ability and RP opportunities

T1 abilities use rank II at player tier 2; T2 abilities use rank I. Use the rank selector, not the first effect row. The following are verified source values, before build-specific cooldown modifiers.

| Ability | RP | T2 effect relevant to planning | Main opportunity cost / limitation |
|---|---:|---|---|
| Sweep | 6 | Armed cleave; 80% splash, radius 90, 6 s cooldown | Requires delivery and nearby targets; class behavior differs |
| Second Wind | 6 | Below 60% HP; 60% Recovery activation for 4 s, 12 s cooldown | Needs actual Recovery and enough time to heal |
| Brace | 5 | Below 50% HP; 40% DR for 3 s, 10 s cooldown | Reactive threshold may be too late for a lethal burst |
| Cleanse | 3 | Removes two stacks from one debuff, 10 s cooldown | Not all debuffs/stacks at once; do not assume it breaks hard control |
| Expose Weakness | 7 | Armed; target takes +17.5% damage for 4 s, 12 s cooldown | Expensive when target uptime is low or targets change |
| Hamstring | 4 | Armed 1.15× attack; 40% movement slow for 3 s, 6 s cooldown | Does not slow attacks; competes for Technique delivery |
| Bramble Guard | 5 | At least three aggro; +6 plating and reflection for 5 s, 12 s cooldown | Extra plating may be redundant; boss alone does not satisfy trigger |

Expose's idealized 4/12 uptime gives about 5.83% average extra damage against one continuously attacked target before other cooldown/timing effects. It is not a permanent 17.5% DPS gain. Burst alignment can improve its practical value; add switching can erase it.

Bramble adds flat plating at runtime; do not automatically multiply its +6 by stance. Reflection requires a qualifying positive-damage hit, excludes DoTs and fully absorbed hits, and passes through outgoing final-damage scaling. Do not count every attack animation as six guaranteed reflected HP damage.

Hamstring requires Jungle level 3 / 70 green catalysts; Bramble requires Jungle level 5 / 90 green catalysts. Affordable RP does not prove a checkpoint owns the ability. Sources: [abilities and rank selection](../../shared/src/abilities.ts), [acquisition](../../shared/src/abilityRecipes.ts), [Bramble runtime](../../server/src/systems/player/abilities/abilityBramble.ts).

### Legal GM72 Spirit candidates

Shared `runicPointBreakdown` calculation: GM72 supplies 30 RP. Every row below includes defensive stance, no Rites. “Minimal” logic is Always → Find Enemies and In Combat → Keep Distance, costing three RP. “Timed” adds Before Empowered → Use Ability **with `targetAbilityId: "sweep"`**, for six logic RP total.

| Candidate | Techniques | Guards | Logic | Total RP |
|---|---|---|---|---:|
| Minimal baseline | Sweep | Second Wind, Brace | Minimal | 21 |
| Timed baseline | Sweep | Second Wind, Brace | Timed | 24 |
| Timed + Hamstring | Sweep, Hamstring | Second Wind, Brace | Timed | 28 |
| Timed + Bramble | Sweep | Second Wind, Bramble, Brace | Timed | 29 |
| Untimed full utility | Sweep, Hamstring | Second Wind, Bramble, Brace | Minimal | 30 |

Full utility **plus** the timing rule costs 33 and is illegal here. The full utility build is a legal hypothesis, not what won the recorded fight. The human timing rule's target cannot be recovered from these events; the explicit Sweep target above is a proposed treatment.

Minimal movement logic sacrifices behaviors present in the bot's larger rule package. Do not apply it blindly to transit, guardians, ground hazards or recovery. A boss-phase swap needs its own entry/convergence assertion. RP source: [runic points](../../shared/src/runicPoints.ts).

### Class delivery changes the answer

For Heavy Spirit, normal attacks build energy and empowered attacks have a large payoff (base frame: 10 energy per normal hit, 6× empowered multiplier). Ordinary missed attacks still build energy; an empowered miss retains the armed empowerment. Do not explain Axe results using an assumed loss of energy on every dead swing.

Sweep uses delivered hit damage for Spirit splash, so synchronizing it with empowerment is promising. But waiting can delay add removal, lose a cluster or overkill weak adds. Compare delivered empowered cleaves and their targets, not activation count alone. Multiple Techniques share the offensive channel; Hamstring can compete with Sweep.

Apprentice Sweep spreads class DoT rather than generic direct cleave; Slinger uses clip-aware normalization; Conduit has formation-specific delivery. Cadence and cooldown roots also need their own attack/ability timing analysis. The Spirit weapon result cannot select the other five classes' weapons.

Keep the V1i Axe/Needle comparison useful: it changes several weapon properties, not attack speed alone. A cooldown-focused weapon such as Knight's Steelsword is a later candidate if ability downtime is the measured bottleneck, not a reason to expand immediately into every weapon × armor × charm × ability combination. Sources: [frames](../../shared/src/data/skillTree/rootsAndFrames.ts), [energy runtime](../../server/src/systems/classes/archetypes/energy/energyPrototype.ts), [ability arbitration](../../server/src/systems/player/abilities/abilityFiring.ts), [delivery effects](../../server/src/systems/player/abilities/abilityEffects.ts).

## T2 encounter hypotheses

Definitions: [T2 bosses](../../shared/src/data/monsters/bossesT2.ts). These are candidate priorities, not completed viability results. HP below excludes barriers, regeneration and untargetable time.

| Encounter | Verified pressure | First candidate reasoning | What could disprove it |
|---|---|---|---|
| Plains — 4,000 HP | 96 attack; add waves at 50% and 25% | Plains armor/charm/boots, Sweep/SW/Brace; test empowerment timing, then Hamstring if boss contact dominates | Timing delays kills; slow lands mostly on irrelevant adds; kill recovery has low uptime |
| Forest — 3,750 HP | 44 attack with two consecutive hits; accelerating frenzy and stunning charged swipe | Test flat mitigation against repeated hits, retain burst response and assess telegraph avoidance | Late frenzy/swipe overwhelms thresholds; damage loss extends dangerous phase |
| Mountain — 5,000 HP | 128 attack, 6%-HP barrier, break stagger; 2× charge, accelerating instinct | Sufficient barrier-breaking offense plus avoidance/guard coverage; compare burst survival separately from kill speed | Barrier persists; apparent win bypasses the charge instead of validating response |
| Swamp — 3,375 HP | 38 attack, stacking venom, persistent corrosive pools and vulnerability | Cleanse + SW with reliable pool avoidance; evaluate passive recovery during low target uptime | Cleanse cannot keep up, chooses an unhelpful debuff, or movement remains inside pools |
| Cave — 4,375 HP | 139 attack, on-hit corrosion, burrow/untargetability and 1.6× eruption | Percentage mitigation, Brace/Cleanse/SW alternatives, movement against eruption | Burst kills before recovery; corrosion invalidates flat mitigation; apparent DPS deficit is downtime |
| Desert — 3,750 HP | 85 attack; sequenced Death Sting mark, Numbing cast and amplified execution | Match defensive/cleanse timing to the sequence before selecting a generic package | Cleanse is consumed on another effect; protection expires before execution |
| Jungle — 3,625 HP | 85 attack, escape shield, fleeing/concealment and ambush | Compare shield-breaking delivery with movement control only after control changes settle | Slow does not help in the scripted phase; control steals the hit needed to break shield |

T2 Cave still authors on-hit corrosion: two plating per stack, maximum six, with stronger phase behavior. Do not inherit the recent **T1** Breach-only nerf into T2 assumptions. Likewise, use current Desert fields rather than older comments about opening attacks or support adds.

Do not compress these bosses into one eHP ranking. Armor-sensitive hit size, shields, fleeing, adds and exposure windows change effective time to kill by class and build.

## Next experiment selection after V1i

1. Incorporate V1i's valid encounter results, separating progression/tooling failures. Preserve the Axe/Needle question before replacing its package.
2. Establish a human-inspired Plains reference on a known revision and qualified entry: recorded gear, Sweep/SW/Brace, defensive stance and explicit movement rules. The added Sweep timing rule is an intentional candidate, not a claim of exact replay.
3. Select two or three arms around the dominant uncertainty. Minimal baseline versus timed baseline isolates the timing rule. Timed baseline versus timed Hamstring isolates adding Hamstring. Timed Bramble is lower priority if adds remain near the damage floor, unless reflection or a different phase provides a clear reason.
4. If changing armor/charm relative to V1i, first bridge with the same weapon, abilities and rules; change armor and then charm separately when attribution is needed. A full human package comparison tests the package, not which component caused improvement.
5. Keep the untimed five-ability build as a separate package hypothesis. Comparing it with timed baseline trades timing for two abilities and cannot identify their individual effects.

Use a small fixed replication count and explicit stop rules in the eventual packet. Do not retry until a favored setup wins, rank builds from one lucky clear, or interpret a harness failure as a balance wall. A clear establishes candidate feasibility; repeated outcomes and failure traces decide what to investigate next.

V1h provides a useful warning: all eight Cave cases succeeded, while low-HP margins differed and the sample was only two per arm. Expose/SW was fast there, but that does not make it the right Plains build. See [V1h assessment](bot-balance-v1h-assessment.md).

## V1m: earned progression is part of preparation

V1l repeated three T2 seals but died to Ash Salamander ranged damage while its
earned range point was unspent. Avoid Enemies was already equipped; exit-target
avoidance does not prevent all route contacts or engaged attacks. The next
candidate spends the point ordinarily on Wisp before travel, keeping gear,
guards, stance and movement rules fixed. Authored Wisp effects: +80 range,
+12% movement, +3% attack/HP and +2% attack speed. Greater reach and mobility
may reduce incoming contacts and support barrier recovery; actual spacing and
recovery uptime must be observed, not inferred from the branch description.

[V1m](bot-balance-v1m-operator-packet.md) tests this whole branch package once,
not pure range or a proven winner. Death before unlock gives no Wisp travel
evidence. A success requires separate strict branched-snapshot import
qualification before reuse; never remove an earned advantage merely because
an older importer assumes it is unspent. Retain this general rule when later
tiers offer new branches, runes and gear. No balance values change here.

### V1m outcome and V1n selection

V1m completed all three seals and recovered at T3 Sanctuary with zero deaths.
This supports Wisp as a viable prepared travel candidate under the observed
conditions; independent enemy encounters prevent attributing the improvement
to Wisp alone. It does not validate live lava escape. Its earned Volcano mastery6
and Wisp branch are preserved by the qualified T3 importer, not reset.

V1n uses that checkpoint for separate Volcano/Tundra entry-kit screens with
Sweep/SW/Brace and the established movement rules. Measure transit, sustained
combat and return separately. In Tundra distinguish ambient Chill from roots
before choosing Cleanse; in Volcano distinguish ranged/charge hits from lava.
First inspect whether damage arrives before guards, recovery or useful attacks,
then select a focused gear/ability/rule change. Both low mob TTK and excessive
incoming burst remain possible simultaneously. No balance edits follow from a
single death, and accelerated mastery changes must remain visible in analysis.

## Evidence needed for reliable reuse

V1n audit update: Heat and Chill are both cleansable ambient statuses, not only
discrete slow candidates. Heavy Glacier Bear hits totaled163 before absorption;
default low-HP Brace activated after hit two and expired before hit three.
Neither fact proves a winning replacement: inspect contact and guard timing
first. Volcano's pack durability and time-to-first-kill matter alongside its
per-hit damage. Do not interpret telemetry `totalHealed` as HP restoration; it
also counts ward gain and absorption. [Detailed audit](bot-balance-v1n-biome-audit.md).

The [human recorder](../../server/src/playtest/humanPlaytestRecorder.ts) omits named rule targets from its build snapshot. Future instrumentation should preserve `targetAbilityId`, `targetStanceId`, stance, RP breakdown and runtime revision. This pass documents the gap; it does not change telemetry or running sessions.

For each future comparison retain:

- Full entry inventory, upgrades, acquisition legality, class/frame, stats, rules and successful runtime reconciliation.
- One boss-instance timeline across retargeting, with altar/spawn/contact/victory times and explicit resets/deaths.
- Damage by source and phase; barriers, healing, recovery-window uptime and HP minima during the encounter only.
- Current target, distance, add count, empowerment and ability delivery together. Distinguish activation from landing a useful cleave or debuff.
- Actual slow/movement behavior on the frozen revision, especially after the concurrent control fixes.

Before authoring any template, write one sentence per slot or rule explaining its job, its cost and what observation would justify replacing it. Carry successful interactions forward into the next proposal, while retaining their encounter/class limitations. No additional user information is required to start those controlled comparisons; the missing historical rule target simply remains unknown.
