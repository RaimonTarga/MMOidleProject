# Item and ability outlier pass 01 — parallel preparation handoff

**Owner:** Astra prepares; Luna executes when assigned; the command center/designer approves adoption.  
**Experiment family:** `item-ability-outlier-pass-01`  
**Status:** Preparation brief, not an executed or qualified packet. Issuing this document does not change gameplay, launch combat, or adopt the illustrative candidates below.  
**Combat budget:** At most **48 fresh observations** for the first subsystem packet. This is a ceiling, not a requirement to fill every slot. No broad roster census, factorial loadout search, or automatic extension.  
**Immediate instruction:** Start the source/evidence review and packet preparation while the separate Volcano Heat-management experiment finishes. Exclude Blood Offering from every new package and candidate pool.

## 1. Purpose and approved design direction

Move from broad class exploration to a shallow, decision-oriented subsystem pass for the playtest. Reuse the existing class packages and the measured weapon/core/relic/charm comparisons. Find obvious implementation failures, disproportionate tier scaling, poor specialization payoffs, and dominant interactions. Preserve worthwhile asymmetry; do not demand equal item use or equal throughput across classes.

Designer intent:

- Abilities are higher priority than a comprehensive stance search. Boots and Arcanist are specifically nominated review targets.
- The Cave dead-swing axe family may remain a particularly strong weapon. Its meaningful drawback is intentional. Do not flatten it merely for winning comparisons or buff it because players disliked the drawback. Trace whether individual attack adapters really pay the drawback.
- Swamp's **soft-slow magnitude resistance** is a utility identity worth preserving into later progression. It is not interchangeable with control-duration reduction.
- Conditional boot bonuses should have restrained tier progression, normally around **5–10 percentage points** at comparable maturity, not runaway increments stacked on rising base movement. Check both like-for-like upgrades and the predecessor +5 -> successor +0 transition. This is a design guide, not a requirement to make every mobility effect share a numerical ceiling.
- Base movement and item `stats.speed` are not approved retune targets in this first candidate. Inspect them separately, but do not change them to compensate for a passive adjustment.
- Basic automation should remain affordable. Do not raise Rune prices solely because a competent build uses the rule frequently. Count assembled condition + action costs and the underlying ability/stance attunements.
- Blood Offering is unwanted design. It is excluded from new experiments, not a missing sustain tool to add to failing packages. No replacement Rite is required.
- An inverse Accelerant Core is a possible future design, **not authorized new content in this packet**.
- Wasteland boss is excluded from this work and from generic class-balance pass/fail criteria. Earned Wasteland gear is still allowed at its actual gates.
- Ask the designer before inventing an answer when a plausible setup mismatch explains a failure. Supply the exact build and evidence; do not ask for biome intent already provided.

## 2. Parallel work and source isolation

The active `volcano-heat-management-01` run is owned by its existing frozen checkout. Never edit its source, dependencies, hitbox file, packet, outputs, launch markers, or publication directory. Never wait for that run merely to read unrelated item definitions or design a Tundra/core comparison.

At this review, remote `develop` was **`ca90ec3fb77937e3bfef4705ff3950795a81998e`**, whose tip is `feat: make class maintenance runes baseline and add Rebuild Formation`. Re-read the intended branch when preparing: record the full actual SHA, approved changes and any relevant subsequent commits. Do not mistake starter availability for zero RP or silently import a new default Rune into both historical and current packages. Resolve current behavior and costs.

Use a separate worktree/branch and separate output root. Carry the approved Spirit nerf and accepted Conduit/weapon-reservoir/Hamstring fixes once. Do not import the rejected root-only 2,500 ms reconstruction treatment.

Non-Volcano comparisons can be prepared and, once assigned, executed on a frozen source independently of the Heat candidate. Heat-dependent recovery conclusions wait for the candidate's disposition; do not cherry-pick an unapproved Heat mode into this packet. There is no blanket requirement to stop all subsystem work until that disposition.

Preparation parallelism does not imply permission to saturate the same host with combat workers. Preserve the existing one-worker execution discipline unless the operator explicitly assigns separate resources. One sealed comparison must not be rebuilt during measurement. If a new relevant patch lands later, retain the result under its measured source and review applicability; do not relabel or automatically rerun it.

## 3. Numbers review: source-grounded, not a replacement DPS/EHP oracle

Inspect the active item database across T1–T4 for weapons, armor, recovery items, mobility, cores and relics. Inspect ability ranks, RP costs, tags and effect consumers; inspect the five intended remaining Rites and relevant stances/Rune costs. This is one breadth-of-definitions pass, not an exhaustive analysis of every combination.

Prefer a throwaway script importing production objects to hand-transcribed tables. Emit a compact inventory with item/ability ID, tier, recipe/mastery/boss gates, predecessor, slot, base values, legal +3/+4/+5 readbacks where applicable, passive fields and consumers. Cores/relics remain on their supported +0 state. Clearly distinguish authored item contributions from composed character values.

For a shortlisted effect, trace the production consumer: units, additive versus multiplicative composition, caps, conditions, trigger cadence, temporary uptime, per-hit versus per-cast behavior, and applicable owner/summon/channel delivery. Check whether an apparent penalty is paid by the evaluated mechanic. Tooltips and old comments can point to intent but do not override code.

Use transparent calculations to screen candidates. Label assumptions. Examples: residual soft slow under one multiplicative resistance; useful cast cycles accounting for wind-up; availability of a conditional speed bonus; overflow at caps; theoretical damage/cadence products. Do not rank every item with an unvalidated global DPS/EHP score or derive a class patch from a nominal Attack comparison.

Classify each finding as: implementation fact; calculation under stated assumptions; prior measured contrast; designer preference; untested balance hypothesis. A design-policy normalization can be proposed without a new combat census, but its actual gameplay impact is still unmeasured until tested.

## 4. Reuse the evidence already available

Build `EVIDENCE_INDEX.md` with exact run/source, package/gear/fixture, comparison field, measured result, important counterexamples and current relevance. Do not rerun a successful contrast just to give it a new report title.

High-value existing anchors:

- `t4-overnight-closing-pass-01`, source `056b5cd66c2f6aeccca840265a0cbce30a2a77f3`: seven one-field alternatives, all 28 alternative lives completed without death. Tundra values below are sums over two twenty-minute lives; Mountain values are medians.
  - Stormbringer, Eruption Lash: Tundra **48 -> 143**, Mountain **149.9 -> 64.8 s**.
  - Surge, Plague Axe: **41 -> 196**, **116.6 -> 52.7 s**.
  - Tempest, Plague Axe: **49 -> 223**, **93.9 -> 30.1 s**.
  - Icebreaker, Earthsunder Maul: **81 -> 82**, **88.2 -> 69.1 s**.
  - Ritualist, Hastebound instead of primary relic: **176 -> 133**, **72.4 -> 79.5 s**.
  - Melter, Tempered instead of Catalyst: **246 -> 162**, **30.6 -> 52.8 s**.
  - Reverb, Eruption Lash: **91 -> 114**, **159.9 -> 164.6 s**.
- `overnight-t1-t3-progression-01`, source `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`: Cave charm failed to become the Desert default; 23/24 versus 24/24 survivors, and lower work among jointly completed pairs. It does not prove Cave's charm has no niche.
- T1 rapier alternatives were not an unconditional win: one additional Striker death, higher work in the other jointly surviving pairs. Preserve the survival counterexample and unequal root sample counts.
- Older T2 Jungle-on-hit versus Swamp-reservoir results remain historical, with current empowered-reservoir fixes identified. Do not turn them into current universal weapon rankings.

Reference promotion is not numerical patch adoption. Results from different source/gear/progression states remain separate. Source hashes and an external raw-file inventory do not constitute an archive of the raw files themselves.

## 5. Specific initial review targets and candidate boundaries

### 5A. Mobility: preserve function, restrain progression

The following are authored/readback calculations from recipes at `ca90ec3f…`, not measured final player speed:

| Family | Current passive | Upgrade behavior / qualification |
|---|---|---|
| Swamp T1 | 25% slow resistance | +3 pp per upgrade; 37% at +4, 40% at +5 |
| Swamp T2 | 45% slow resistance | +3/+3/+2/+3/+2 pp; 56% at +4, 58% at +5 |
| Swamp T3 | 62% slow resistance | +2 pp per upgrade; 70% at +4, 72% at +5 |
| Desert T2/T3/T4 | 20% / 30% / 40% kiting speed | Upgrades add flat speed, not more of this passive |
| Mountain T4 | 125% approach speed | +5 pp per upgrade; 145% at +4, 150% at +5 |
| Volcano T4 | 70% conditional speed | Has 3,500 ms suppression field; verify exact activation/suppression in runtime |
| Tundra T4 | 75% maximum ramp speed | Has ramp-rate 0.35; verify build/decay and actual uptime |
| Trench T4 Treaders | 55% tenacity | Different duration-based utility; not Swamp slow-magnitude resistance |

A large printed percentage is a review flag, not proof of excessive benefit. Persistent kiting, brief gap-closing, a movement ramp and a hit-suppressed bonus are different services. Pay attention to relative player/enemy speed, range, roots versus slows, and whether changing speed breaks engagement or causes overpulls. Do not compensate with class or enemy buffs.

**Proposed candidate D, not adopted:** Desert `mobility.kite-speed-pct` at T2/T3/T4 **0.20/0.30/0.40 -> 0.20/0.25/0.30**. Keep flat speed, upgrades, triggers, gates, and Rune costs unchanged. This is a gentler design curve, not a claim that current values are already proven OP. A no-change recommendation remains acceptable after the consumer review.

**Proposed candidate S, not adopted:** retain Swamp T1 unchanged; target **40% / 50% / 60% at +5** across T1/T2/T3. A concrete internally consistent version is T2 base **0.40** with **+0.02 at each upgrade**, and T3 base **0.50** with its existing **+0.02 at each upgrade**. This gives T2/T3 +4 values **0.48/0.58**. It preserves T1 +5 -> T2 +0 and T2 +5 -> T3 +0 utility continuity. Do not alter flat speed, hard-control behavior, immunity rules, or other passives. This candidate is a modest correction to the later curve, not permission to erase the utility.

Confirm that evolution replaces the old item's passives rather than summing predecessor bonuses. Enumerate all successor links: the inspected Swamp chain stops at T3, while Trench and Graveyard boots express stealth/tenacity/kill-momentum rather than the same slow-magnitude utility. If no T4 continuation exists, record a lineage gap and offer one minimal designer proposal. Keep T3 boots usable at T4. **Do not silently repurpose Abyssal Treaders, create assets, change biome caps, or launch a new-item project.** A new T4 successor needs a home/gate/value decision and is outside this first numerical packet.

Audit Mountain/Volcano/Tundra and other boots in the same table, but do not automatically reduce every mobility passive to 30%. Return any additional proposed normalization for approval; do not expand the initial comparison allocation.

### 5B. Arcanist and cast opportunity cost

Current `core-arcanist`: T3, Mountain18, unrestricted; **20% Technique power and 20% Technique cooldown reduction**, no general damage or HP bonus. Trace `TECHNIQUE_POWER_FIELDS`, rank payloads and cooldown consumers. It is not a blanket increase to the class's autonomous execution/discharge mechanic, not a Guard buff, and not automatically a cast-time reduction. Confirm which equipped Techniques receive each benefit, including instant buffs and summon-delivered casts.

The idealized factor `1.20 / 0.80 = 1.50` applies only to eligible cooldown-limited Technique damage under restrictive assumptions. It is not 50% whole-build DPS and ignores cast occupation, competing Techniques, target interruptions and caps. Measure when a stronger Technique contribution displaces ordinary attacks or prevents the class mechanic from being delivered.

**Proposed candidate A, not adopted:** `technique.power-pct` **0.20 -> 0.30**, retaining cooldown reduction **0.20**. One field only; no simultaneous cast-speed, Guard, eligibility or class changes. In the simplified model it raises the affected Technique contribution by 1.30/1.20, not total DPS by 10%. If source review reveals a delivery/eligibility defect, report it and do not mask it with this buff.

Use current Arcanist and Tempered as useful comparators in an actual Technique-supported build. Do not claim Arcanist is weak merely because an old package equipped no cast, or because a cast occupied a channel specialization. Summoner casts and native owner casts can be contrasting cases; owner/summon HP and replacement burden remain relevant.

### 5C. Abilities first; no blanket repricing

Priority questions: Endure's marginal versus alternative-budget value; Power Strike/Slam cast occupation versus armed or instant offense; Quick Strike/Frenzy value in native and adapted delivery; correct Contagion/Detonate semantics where the stack system permits them.

Inspect all nominated abilities before choosing at most two focused combat questions. Preserve native timing unless the purpose is explicitly a timing-package comparison. Price the ability, required Rune and displaced alternatives together. Do not spend points on incompatible or unreachable conditions. Never use an unequipped ability as evidence of its weakness, or activations alone as evidence of usefulness.

Do not lower Endure merely because the experiment catalogue uses it often. Distinguish a threat-specific necessary answer from a universal bargain. Do not delete a required defense from a failing package and use the predictable death as proof of excessive power. There is no approved ability-number patch in this brief; any candidate other than Arcanist must return exact values and rationale before execution.

### 5D. Remaining Rites, stances, armor, charms, relics, and Runes

Review the five intended Rites: Swift Repose, Lingering Battle, Purification, Mechanic Renewal and Ability Reprieve. Source-check exact combat-transition conditions and archetype differences. Mechanic Renewal's actual benefit, especially DoT and special channel/formation cases, must not be assumed from its name. Purification does not get a Heat-clearing role by inference. Check whether recent maintenance Rune changes reduce or change the marginal value of particular Rites.

First combat choices, if justified, are Swift Repose and Ability Reprieve in non-Volcano, repeated-encounter packages with real boundary and cooldown opportunity. Do not insert them into the current Heat experiment. If no meaningful activation opportunity exists in the retained fixture, report that fact rather than simulate a useless arm.

Armor/charm/relic review emphasizes progression cliffs, mislabeled units, wrong passive consumers and missing role support. Reuse the old charm and relic contrasts. Stances get a small compatibility/value screen, not a 54-path switch-stance campaign. Rides and Rites are separate systems; do not silently claim rides have been assessed by reviewing Rites. Preserve low-cost basic Rune behavior; review concrete anomalies only.

## 6. Bounded comparison allocation

Astra supplies exact cells, qualified package readbacks and executable commands after the source review. The following are **planning caps**, not preexisting sealed cases. Fewer observations are preferable when a question is settled by code or existing evidence. Do not replace unused capacity with another survey.

| Module | Maximum new lives | Intended shape |
|---|---:|---|
| Mobility candidates | 16 | Two relevant package/tier cases per nominated boot family; two arms and two seeds. Include a T3/T4 kiter for Desert scaling and actual slow exposure for Swamp. Do not choose only existing immediate-failure Desert packages. |
| Arcanist | 12 | Two appropriate delivery packages x current Arcanist / power-30% candidate / Tempered x two seeds. Keep all other slots and the Technique kit fixed. |
| Ability contribution/opportunity cost | 12 | Up to two bounded questions, at most three declared arms each and two seeds. An exact useful alternate allocation is required for an opportunity-cost claim; add/remove alone measures marginal contribution. |
| Remaining Rites | 8 | Two meaningful matched contrasts, each current package versus one Rite and two seeds, on non-Volcano farming. |
| **Ceiling** | **48** | Count fresh controls, alternatives and any indispensable replay inside this cap. |

Representative directions, not manufactured finalized packages: T4 Reverb or Dynamo with real Power Strike; T4 Idolwright with the designer-endorsed medium axe/Equilibrium and summon-delivered offense; a T3/T4 ranged farmer already capable in Tundra; a legal established T2 melee Desert package for soft-slow pressure. Use the successful measured alternatives for Stormbringer/Surge/Tempest where relevant, not their superseded slow-weapon references.

Use existing fixture IDs, production ecology and accepted boss initialization. Prefer Tundra and Mountain to isolate the pass from Heat; Swamp/Cave or established Desert are allowed for a specific nominated mechanic after reading the actual package. No Wasteland boss, fresh Volcano campaign, or guardian/economy test.

Default caps: **600,000 ms farming and 300,000 ms bosses**, 100 ms ticks, seeds **101009/101033**, first owner death or authoritative boss terminal stops. Select all cases before combat. If a Rite needs longer gaps, use an existing suitable fixture rather than adapt duration after inspecting outcomes.

Use explicit legitimate snapshots. T4 may reuse **GM148 / 45 RP / +4 ordinary gear / +0 cores and relics**, Mountain24/Wasteland4/Trench0. A T3 item retained at T4 keeps its documented own upgrade; it is not promoted to tier 4. T2/T3 comparisons must name actual mastery, RP, prerequisite paid ownership and per-slot upgrades from available progression receipts. Do not assume a uniform tier label grants every unlock, or seed +5 at a +3/+4 entry checkpoint.

Each pair/triple fixes class/path, armor, recovery, boots unless targeted, weapon unless targeted, core unless targeted, relic unless targeted, stance, Techniques/Guards, Rune timing, mastery and initial-state contract. Recalculate the candidate's resulting stats normally. For modified upgrades, report the resolved passive actually applied. Each historical comparison keeps its own source; fresh same-source controls are required when relevant current corrections or contract changes prevent reuse.

Preparation may stage the explicitly proposed boot/Arcanist candidates on isolated branches for review. **Luna launches only when assigned after the exact matrix and candidate values have been surfaced. No candidate is adopted or merged by this brief.** A substantive change to the proposal is a command-center decision, not an automatic preparer refinement. No new build-approval round is needed for routine reuse of already endorsed strategies.

## 7. Blood Offering: exclude immediately; retire safely as a separate change

**Immediate preparation instruction:** omit `blood-offering` from every active candidate/reference pool, all new seeded ownership/attunement and all new Rune/RP plans. Do not use it to rescue farming. Preserve historical reports and their original definitions unchanged.

**Recommended production disposition:** retire the gameplay option, not merely hide it while its healing remains active. Prepare an independent retirement patch, separate from boots/Arcanist and from the Heat candidate. Before adoption it must cover:

1. No new crafting, unlock/equip endpoints or UI discovery; stale clients cannot re-equip it.
2. Legacy equipped instances are removed or explicitly deactivated, and no longer reserve RP. Merely removing a recipe is insufficient.
3. The runtime kill-healing listener cannot still grant the effect through a saved ID.
4. Stable old IDs are retained only as migration/deprecation aliases where necessary; no crash or unrelated save loss. Do not delete historical acquisition records or bulk-edit the live database.
5. Document the legacy-owner policy. No arbitrary currency/item compensation is authorized; any refund proposal is separate and idempotent.
6. Focused checks: fresh acquisition blocked; old save loads; no healing; no RP charge; other Rites unaffected; repeated migration safe.

There is no combat balancing experiment for Blood Offering. It is being retired for design identity, not because a numerical loss has to be proved. Production adoption of the retirement patch still goes through the designer's normal approval. Keep it out of the new combat set regardless of whether retirement has merged.

## 8. Inverse Accelerant: design note only

Current Accelerant authors +55% attack speed and -18% damage dealt. A high-damage/slow-attack counterpart is a distinct proposed design; Colossus Heart already offers slower **class-mechanic frequency** for greater potency, which is not the same thing as slowing ordinary attacks.

Do not choose inverse percentages by symmetry. Under a deliberately simple basic-attack model, +35% Attack and -25% attack rate gives 1.35 x 0.75 = 1.0125, near-neutral baseline output before mitigation and all other mechanics. That is an illustrative sanity check, **not a proposed balanced item**. Flat on-hit frequency, fixed-rate channels, casts, cooldown executions, DoT behavior and summon cadence can radically change the payoff or bypass the nominal penalty.

Record the desired target builds, which damage channel would be increased (Attack versus final damage is a real decision), the actual penalty consumer and overlap with current items. Do not create/rename a core, add recipes/art, or include it as an eighth design axis before the playtest without a separate request.

## 9. Checks, reporting and stopping rule

Use the established runners. One bounded source/loadout check and focused tests of touched mechanics are enough; no estimator rehabilitation, general harness rewrite, full-suite repair campaign, or separate combat pilot. The first real scheduled observation counts toward the allocation. Qualify from the exact execution path; retain semantic/source checks without rediscovering an absolute-path mismatch after combat.

A gameplay death is evidence and the approved queue continues. Source drift/process failure is operational, not a balance outcome. No retry to improve outcomes, new seed, adaptive build rescue, extra duration or unattended tuning. A failed publication never authorizes rerunning combat.

Report within matched fixture and progression: completed kills and equal-window work, survival/time-to-death, unfinished targets/stalls, actual useful ability delivery, boss progress/TTK, owner HP and barriers, meaningful status/uptime exposure, and opportunity cost. Keep post-death endpoints null. Do not pool rates across biomes, treat identical boss seeds as independent robustness, claim exclusive healing absent from traces, or convert a passive percentage into exact kills/minute.

Return at most **six proposed changes**, with exact current/candidate numbers, source field and consumer, inheritance and gates, rationale, observed effect or explicit untested status, counterexamples, and adoption risk. Distinguish adoption-ready, needs one bounded confirmation, and deliberate post-playtest deferral. No quota of nerfs or requirement that every specialty pass every encounter.

Deliver:
- `REVIEW.md`: source-grounded numeric/consumer review across slots and active systems; shortlist and decisions.
- `EVIDENCE_INDEX.md`: reusable previous comparisons and applicability labels.
- `CANDIDATES.md`: exact isolated boot/Arcanist candidates and the independent Blood Offering retirement proposal.
- `LUNA_RUN.md`, exact manifest/ordered cases, resolved snapshots/recipes/RP and source/runtime receipts.
- On execution: readable `REPORT.md`, compact results, applied/terminal receipts, patch proposals and preserved external raw inventory.

**Commit and push scoped preparation and final compact results; verify the remote report blob and branch SHA.** Keep measured and publication revisions distinct. No force-push, deployment or production merge without adoption approval. Retain one release-risk/backlog ledger so a deferred T4 path, missing utility lineage or encounter question is not silently declared solved.

Finish this playtest subsystem pass through selective changes and focused regression of the actual patch, not through independent campaigns for each slot. Continued post-playtest work will combine the release baseline, archived significant traces and player telemetry.

## 10. Source anchors inspected for this brief

At `ca90ec3fb77937e3bfef4705ff3950795a81998e`:
- `shared/src/data/recipes/index.ts`: active biome recipe collection.
- `swamp.recipes.ts`: T1–T3 slow-resistance boots, upgrades and evolution gates.
- `desert.recipes.ts`: T2–T4 kiting boots and flat speed upgrades.
- `mountain.recipes.ts`: T4 approach boots; Arcanist; Colossus and Equilibrium relics.
- `jungle.recipes.ts`: Accelerant/Survivalist/Bruiser and T4 mobility.
- `volcanic.recipes.ts`: T4 hit-suppressed speed, Catalyst and Hastebound.
- `tundra.recipes.ts`: T4 movement-ramp boots and support options.
- `graveyard.recipes.ts` and `trench.recipes.ts`: inherited utility families and distinct T4 mobility mechanics.
- `shared/src/data/abilityModifierInfo.ts`: Technique modifier eligibility vocabulary; production consumers still need the focused preparer trace.
- `shared/src/items.ts`: slot definitions and additive upgrade deltas.
- `shared/src/rites.ts`: Blood Offering still active in the inspected definition and the five intended remaining Rites.

Measured reports: `t4-overnight-closing-pass-01/run-01`, `corrected-baseline-followup-01/run-01`, `overnight-t1-t3-progression-01/run-01`, and named T2 item comparisons. Preserve their individual sources and scopes; none supplies a universal item score.
