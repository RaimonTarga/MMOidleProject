# Player defense structural study — 25 September 2026

Status: analysis and design proposals only. No gameplay edits, adoption, deployment, or new combat campaign. Local source HEAD `ff98ba4513cb9fcb1e5752acfd56495268aff416`; pre-existing dirty work preserved. Findings describe the inspected local source, not a verified production deployment. “Damage depth” is interpreted as **damage debt**, the existing hit-to-DoT mechanic.

## Judgment

The concern is justified, but reducing plating coefficients alone would leave the structural problem intact. Plating is a near-universal armor substrate, amplified by classes and post-class multipliers; some incoming attack multipliers also amplify the amount it prevents. Meanwhile, competing layers have narrower runtime coverage and different activation requirements. First define coverage and stacking; then redistribute item budgets; then retune class amplification and encounter pressure together.

Keep flat subtraction as plating's identity. Give generalist protection an accessible, moderate role. Let specialists outperform it against their named threat while accepting a real weakness elsewhere. Do not make every build collect every layer, and do not require a complete gear swap at every biome border.

## 1. What the code actually does

### Direct attacks

The ordinary monster-to-player path starts approximately with `max(1, round(max(0, baseAttack − plating) × (1 − DR)))`. It then applies various monster multipliers, on-hit effects and the incoming-damage listeners. Defense listeners resolve evasion, soft cap, wards, barrier, barrier-break healing, damage debt, cheat death and damage-absorb healing in that order. Other registered listeners can change incoming damage before those layers.

The distinction between subtracting plating before or after an attack multiplier is consequential. For the charge/empower route, an illustrative 20 attack, 15 plating, ×4 attack gives **20 damage before later defenses**, because `(20−15)×4=20`. Applying the multiplier to the incoming attack first would give **65**, because `80−15=65`. In the current route plating prevents 60 of the 80 gross damage; the supposed large hit retains the same plating vulnerability as the small base swing. Attacks supplying a precomputed `rawDamage` are different. This is not a claim that every boss hit follows the same route.

**Recommendation:** for player incoming direct hits, establish gross hit magnitude before the one flat subtraction. Keep attacker-side weapon/reload compensation and monster defenses out of that change unless separately studied. This ordering change could sharply increase boss damage, so it must be paired with encounter recalibration rather than shipped as an isolated correction.

Sources: `server/src/systems/combat/engine/combat.ts` (`runMonsterAttackOnPlayer`); `server/src/systems/defense/index.ts`; `server/src/systems/combat/damage/playerAmplifiers.ts`.

### Coverage differs by damage path

| Inspected path | Plating | Stat DR | Evasion / cap / debt | Wards and barrier |
|---|---|---|---|---|
| Pipeline monster direct hit | Yes | Full | Yes, when applicable | Yes |
| Generic secondary monster attack splash | Yes | Full | Bypassed | Bypassed |
| Monster-applied DoT ticks | No | Half stat value | No direct-hit evasion/cap/debt | Yes unless authored bypass |
| Node-feature damage ticks | No | Full | Bypassed | Bypassed in inspected path |
| Damage debt drain | No second subtraction | No second stat-DR pass; DoT resistance applies | Separate debt/cheat-death logic | No pool absorption in drain |

Final core/stance damage multipliers also apply on several paths outside the pipeline. Committed ground slams deliberately use the pipeline, unlike generic secondary splash. Do not generalize the splash finding to every AoE mechanic.

This is a coverage policy problem before it is a coefficient problem. A barrier build can be weak against a particular area attack because its shield is bypassed, while an armor build still works. Players need to be able to predict that distinction.

**Proposed default policy:** all direct damage gets DR and shields; plating gets one subtraction per authored hit; evasion applies to explicitly evadable attacks; cap/debt apply to eligible direct damage. DoT and environmental damage have separate, consistently documented policies. Reserve shield bypass for named, communicated exceptions. Decide whether generalist DR retains half effectiveness against monster DoTs or becomes uniform; either choice must be priced against dedicated DoT resistance. Do not accidentally mitigate debt twice.

Sources: `combat/damage/aoeDamage.ts`, `combat/engine/combat.ts` (committed slam), `classes/archetypes/dot/dotPrototype.ts`, `world/nodeFeatures.ts`, `defense/mitigation/hitToDot.ts`, all under `server/src/systems/`.

## 2. Item supply is structurally tilted

The accompanying executable census imports the actual item database and upgrade helpers. It inventories definitions, not owned items, affordable choices, or live selection rates.

| Authored item tier | Armor definitions | With plating | With unconditional stat DR | With evasion | With debt conversion |
|---|---:|---:|---:|---:|---:|
| Tutorial 0 | 1 | 1 | 0 | 0 | 0 |
| 1 | 5 | 5 | 1 | 1 | 0 |
| 2 | 7 | 7 | 1 | 2 | 1 |
| 3 | 7 | 7 | 1 | 1 | 1 |
| 4 | 10 | 10 | 1 | 1 | 2 |

All **30/30** armors supply plating. Only **4/30** supply unconditional stat DR. This count excludes conditional DR, core/stance protection and Guard skills; it establishes item distribution, not total defensive availability.

Some examples, item plating alone at +0 → maximum authored upgrade:

| Armor | Plating |
|---|---:|
| T1 Plains | 7 → 12 |
| T1 Forest evasion armor | 3 → 5 |
| T1 Cave DR armor | 4 → 6 |
| T4 Mountain | 29 → 44 |
| T4 Jungle evasion armor | 24 → 54 |
| T4 Trench DR armor | 24 → 54 |
| T4 Desert | 38 → 83 |
| T4 Volcanic | 38 → 88 |

The late-tier specialist progression is especially revealing: an evasion or sustain choice also delivers substantial flat mitigation. Plains-named armor definitions end at T2, but Volcano T3 explicitly evolves from Plains T2: the plating lineage already continues across biomes. Preserve that route rather than adding a redundant late plating family; see the [deep redesign proposal](REDESIGN-PROPOSAL.md). A theme label does not guarantee a distinct mathematical role.

A concrete early-game illustration: base player plating is 2. T1 Plains armor +0 brings that to 9 before class scaling. Against the authored Field Hare attack of 12, that leaves 3 damage: 75% raw reduction. The Squire root's +30% plating rounds this to 12, putting this attack at the 1-damage floor before later multipliers. No frame, core or stance is required for that arithmetic. It demonstrates a breakpoint, not live farming performance. The tutorial vest itself brings base plating to 6, already halving that attack.

Plating has increasing practical value as residual damage approaches zero. Against a 20-damage hit, moving from 5 to 10 plating reduces remaining damage from 15 to 10; moving from 10 to 15 reduces it from 10 to 5. The second equal investment doubles direct-hit endurance, while the first increases it by half. Recovery turns this into another threshold: once healing exceeds incoming HP loss, farming may become indefinitely sustainable under that fixed pressure.

**Item recommendation:** move most incidental plating out of evasion, debt, generalist DR and sustain armor. Keep a modest HP foundation, then pay for one primary defensive identity and, where useful, one smaller complementary effect. Give the plating specialist a clear progression into late tiers. Make a modest generalist DR option available early and at ordinary progression budgets. Access means unlock, cost, upgrade ceiling and replacement cost, not merely existence in the database.

Do not automatically replace every removed plating point with DR. Reprice the complete item including HP, healing access, Guard potency, barrier riders and offense. Avoid powerful unconditional DR on every slot: that would recreate the same universal stacking problem.

Sources: `shared/src/data/recipes/*.recipes.ts`, `shared/src/config/gameConfig.ts`, `shared/src/systems/itemUpgrades.ts`; generated `census.json`.

## 3. Desired jobs for the layers

| Layer | Main reason to choose it | Meaningful limitation |
|---|---|---|
| HP | Survive bursts, create a response window | Does not by itself reduce damage; already scales Recovery and percentage shields |
| Moderate DR | Predictable broad protection | Lower efficiency than a specialist in its preferred matchup |
| Plating | Many genuinely small direct hits | Weak proportional reduction against large hits; no DoT protection |
| Evasion | Evadable attacks and avoiding their on-hit status applications | Cannot guarantee protection on a particular opening/burst; explicit non-evadable threats |
| Barrier/wards | Front-loaded buffer, recovery between engagements | Recharge interruption, depletion, specific communicated bypasses |
| Damage debt | Convert immediate lethal pressure into time to recover or retreat | Does not intrinsically erase damage; sustained pressure and antiheal challenge it |
| DoT/status resistance and cleanse | Sustained ailments and disabling environments | Less value against clean direct attacks |
| Recovery/absorb | Maintain health through repeated encounters | Requires time and often activation; does not save an immediately lethal hit |
| Guards, movement, control | Respond to predictable threat windows or prevent contact | RP, cooldown, automation conditions, opportunity cost |

These are proposed roles, not equal expected damage-reduction targets. Evaluate complete packages against threat profiles. “Fast attacks” alone does not distinguish evasion from plating: for equal-sized hits over a long sequence, evasion's fractional mitigation is roughly independent of hit frequency. Plating's relative efficiency depends on per-hit size. Give evasion value through evadable attack coverage, status prevention and class interactions rather than describing both stats as the fast-hit answer.

### Evasion

Current evasion is deterministic accumulation, starting at zero out of combat. It is not independent random avoidance. Below the 50% frequency soft cap, 20% evasion triggers roughly once every five eligible attacks, and base evade mitigation is only 50%: approximately **10% average direct mitigation on equal hits**, ignoring rounding. It also prevents most associated debuffs/DoTs, which can be much more valuable. Slinger already has +30% frequency and +20 percentage points of evade mitigation; specialist investment can therefore be substantially stronger than a non-Slinger armor-only comparison.

Priorities: expose frequency and evade strength separately in readable terms; audit applicability; compare opening-hit and mixed-attacker sequences; then consider improving baseline evade strength or reallocating item budget. Do not blindly increase both frequency and strength. Preserve deterministic behavior unless a separate design decision changes it.

Sources: `shared/src/systems/stats.ts`, `shared/src/config/gameConfig.ts`, `server/src/systems/defense/mitigation/evasion.ts`.

### Damage debt

Conversion applies after shields and caps, to surviving direct damage, and is capped at 50%. DoT resistance applies when debt drains. Ignoring rounding and forgiveness, conversion `c` with resistance `r` produces total eventual loss `D × (1 − c×r)`: most of its initial value is time, not raw mitigation. Apprentice's root values, 10% conversion and 18% resistance, imply only **1.8% eventual reduction** of eligible post-layer damage while delaying 10% initially.

The current pool drains one quarter of its remaining value each second (`POOL_DRAIN_MS=4000`); it does **not** finish paying a hit in exactly four seconds. About 31.6% remains after four drains before rounding. Low residual amounts are discarded, and sufficiently low rounded drain damage clears the remaining pool. That behavior matters for small hits and high resistance; it must not be misread as free linear four-second smoothing.

Keep debt as a distinct recovery-oriented option, give it sufficient conversion to be perceptible, and make owed damage/next payment legible. First choose a precise drain contract and rounding policy. Measure both immediate HP and remaining liability at the endpoint; a larger debt pool is not a survival win. Avoid making debt require simultaneously owning several rare complementary pieces before it functions.

### The soft cap

It currently reduces excess above `maxHp × thresholdFraction`; it is not global. Striker has it at root, and several Mountain/Tundra items supply it. With a 25% threshold and 50% excess reduction, a hit of 40% max HP becomes 32.5%; a hit of 100% becomes 62.5%, before subsequent layers.

There is a non-monotonic stacking problem. `mergePassives` adds threshold fractions but multiplies excess factors. Two identical sources produce a **50% HP threshold and 25% excess factor**. A 40%-HP hit therefore becomes 40%, worse than the 32.5% from one source. Above 75% HP gross damage the double-source curve becomes better than the single-source curve. This comparison holds incoming damage and HP fixed; a real armor swap also changes HP and other defenses. A second source nevertheless has a mechanically surprising downside.

My preferred simplification candidate is **remove the cap as a broadly distributed passive layer**, replacing its anti-burst role with well-priced HP, barriers/wards, debt and timed Guards. It overlaps several existing systems and has unusual HP interactions: increasing max HP raises the threshold, reducing absolute cap prevention against a fixed large hit even while increasing overall health.

Retaining it is a defensible alternative if Striker's “shrug off huge impacts” identity proves valuable. In that case make it one explicit specialist mechanic, name it as excess-hit reduction, and use a monotonic rule such as selecting the strongest complete cap profile for the current hit. Do not independently sum thresholds. Compare retention versus removal with compensation; removing it naked would conflate simplification with a large Striker/Mountain nerf. Titan's Keep also refills its barrier on cap triggers with a cooldown, so deleting the cap requires replacing that rider deliberately.

Sources: `shared/src/passives.ts`, `shared/src/data/skillTree/rootsAndFrames.ts`, Mountain/Tundra recipe files, `server/src/systems/defense/mitigation/damageCap.ts`.

## 4. Classes and complete builds

Class HP/plating affinities add across unlocked nodes, then multiply base-plus-equipment once. They do not compound independently at every node. Stance and core modifiers are separate subsequent layers. Dynamic reactive/hardening effects add still more state. Thus item-only tuning is insufficient even though items should carry most of the rework.

Keep class identity, but reduce how much identity is expressed as repeated generic plating multipliers. Squire can emphasize reliable bulk and guarding; Striker recovery and surviving burst windows; Slinger evasion/status avoidance; Spirit barrier and mobility; Apprentice debt/ailment tolerance; Conduit interception and formation continuity. These are directions, not finalized coefficients or mandatory armor pairings.

Evaluate every root/frame/range chain before setting item numbers. A defensive class should obtain a useful advantage from its favored equipment without crossing ordinary-enemy damage floors almost automatically. A lighter class must still have a viable generalist option. Watch HP especially: it scales Recovery (`maxHp × Recovery/100 × activeFraction`), barriers and wards as well as raw endurance. Replacing plating with HP can simply transfer dominance to a different stat.

Conduit needs a separate ledger: owner damage, summon interception, formation uptime and reconstruction HP payments are different quantities. Likewise offense, reach, control, kill speed and movement change how much incoming exposure a build experiences. Hold them fixed in mechanical comparisons, then restore them in complete-build evaluations.

## 5. What existing evidence establishes

Reviewed local reports are historical synthetic package evidence on their own frozen revisions, not current human telemetry or causal estimates of an individual stat.

- `reports/player-fast-pass/guard-coverage-01/run-01/REPORT.md`: 32 observations, two seeds, 22 cap survivors and 10 deaths. Endure rescued the four relevant Striker Desert deaths, but did not uniformly improve work; Champion Mountain + Endure still died to Hound Plague in one Graveyard seed. Guard timing and DoT coverage matter alongside bulk.
- `reports/player-fast-pass/farming-sustain-01/run-01/REPORT.md`: 20 synthetic observations, one seed, five-minute cap. The Skirmisher Volcano Mountain arm died at 105 seconds with 24 kills; Volcanic reached the cap with 76. Knight and Ember mage showed analogous Volcano improvements. This supports studying sustain packages, not declaring a universal armor winner or acquired economy throughput.
- `reports/player-fast-pass/farming-stance-01-run-01/REPORT.md`: posture could improve survival in one environment and reduce useful work or survival in another. Conduit formation delivery and replacement payments must accompany owner outcomes.
- Historical memory recap of `encounter-counterplay-01`: Mountain armor helped one Striker package but not the Apprentice comparison; Endure enabled the two measured Mountain boss kills. This recap was not re-audited against raw artifacts here and may be stale relative to current source. It is a pointer for the next evidence pass, not additional current proof.

Do not pool these revisions or interpret two seeds as survival probabilities. Preserve first-death stopping, missing post-death endpoints and package/RP differences. Historic equipment provision does not establish that a human can acquire or afford the package.

## 6. Human telemetry: useful, but not sufficient yet

No callable MMO telemetry MCP was exposed in this session. The local setup document describes a prepared read-only service; no production query or deployment parity check was performed.

Current recorder source captures equipment/upgrades/skills, decisions and available option pools, exposure, encounter outcomes and a short recent-damage death history. This can identify selection conditional on ownership/unlocks, progression bottlenecks, repeated deaths and behavior changes. Stratify by game version, class/frame/range, tier, biome, party size and upgrade budget; account for repeated observations from the same character. Avoid interpreting popularity as strength or death-conditioned samples as the whole incoming-hit distribution.

Important gap: persisted build stats currently omit dodge frequency, evade strength, Recovery, barrier size and debt parameters. Recent incoming records retain HP damage/type/source but not a full defense-stage ledger. Consequently the forthcoming MCP cannot by itself reconstruct exactly how much each layer prevented. Static reconstruction from gear is possible only against matching source and does not recover temporary state.

For a future instrumentation pass, use bounded encounter aggregates plus sampled hit traces: gross attack and modifiers, damage category/eligibility, effective plating and prevented amount, DR, evade decision/strength, cap threshold/prevention, ward/barrier absorption, debt added/paid/forgiven, healing and overheal, dynamic buffs, final HP loss and timestamp/phase. Record events that deal zero HP damage too. Attribute sequential prevention honestly: these totals depend on layer order and are not independent causal contributions. Counterfactual marginal value belongs in controlled replay/simulation.

Sources: `docs/gameplay-telemetry-current-state.md`, `docs/telemetry-mcp-setup.md`, `server/src/analytics/gameplayRecorder.ts`.

## 7. Proposed validation sequence

1. **Freeze the baseline and coverage contract.** Capture production version, source and actual representative builds. Enumerate direct, splash, committed slam, DoT, environment, debt and reconstruction routes. Verify monotonic stacking, rounding and multipliers in focused mechanical fixtures before any ranking.
2. **Controlled threat profiles.** Compare equal-budget defensive packages against small frequent hits, large slow hits, mixed attacks/statuses, DoTs, environmental attrition and burst-plus-attrition. Include opening windows, multiple attackers and sustained engagements. Use real combat paths; formula worksheets only explain the results.
3. **Separate major interventions.** First isolate ordering/coverage corrections, then item redistribution, then class coefficients, then cap retention/removal with compensation. Measure interactions with a limited predeclared factorial screen before adopting a combined package. Do not change everything and lose causal interpretation.
4. **Complete-build screen.** Cover all six roots, relevant frames/ranges, early/middle/late upgrade states, at least one unfavorable matchup per specialist and representative boss abilities. Start with a bounded screen, then spend more seeds/time on uncertain or promising comparisons. Freeze each execution packet before running; no adaptive repair within it.
5. **Progression and human confirmation.** Evaluate real acquisition and replacement cost, viable first-entry gear, respec friction and tutorial-to-T1 transition. Follow staged human cohorts by version once accessible. A mature synthetic package is not a progression test.

Report death-free completion, time to death, burst/low-HP windows, incoming damage by category, productive work at common endpoints, downtime, retreats, Guard uptime, RP cost, debt liability and class-specific costs. A cap survivor is right-censored, not immortal. Include failures and confidence/seed sensitivity; do not rank by lifetime kills when exposure differs.

Design acceptance criteria: specialists clearly win their intended threat at comparable attainable budget; a generalist remains viable; no one package dominates the entire tested matrix; adding a beneficial defense does not perversely weaken its own protection; class identity survives without forcing one armor; players can explain why they died and which available choice would help.

## Recommended first candidate to specify

Define consistent incoming-hit semantics, reduce incidental plating across non-plating armor, make moderate generalist DR accessible, preserve a dedicated plating progression, make debt useful without a mandatory rare combo, and rebalance class plating amplification against actual hit sizes. Test cap removal with explicit Striker/item compensation against a corrected specialist-cap alternative. Keep precise coefficients provisional until actual damage distributions and attainable builds are measured.

This is a coordinated redesign proposal, not approval to execute a campaign or ship changes.

## Reproduction and limits

Run the static census from the repository root:

`pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/player-defense-study-2026-09-25/census.ts`

Outputs `census.json` beside the script. It records every armor's base/max-upgrade stats, root definitions, authored monster attack/cooldown values and the actual passive cap merge. Monster definitions are not encounter-weighted damage distributions. The study does not claim exhaustive dynamic-path testing, raw historical replay, live-player sampling or a validated numerical replacement balance. No gameplay tests were run because no gameplay code was changed.
