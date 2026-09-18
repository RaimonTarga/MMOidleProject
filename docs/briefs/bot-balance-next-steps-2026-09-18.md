# Bot balance roadmap and Opus handoff — fix, then prepare

Date: 2026-09-18
Project: `RaimonTarga/MMOidleProject`
Audience: Opus preparation/implementation agent; web command center; Sonnet operator
Reference inspected: `develop` at `a5d0fce28759d3cd715a66bba5d333642d2a75ea`
Status: **Assignment and experiment-design brief. Not an executable Operator Packet, not a launch receipt, and not approval to adopt experimental monster stats.**

> **Execution record (added on filing, 2026-09-18).** This assignment was carried out at
> `7247b6e22993a896065c25ce458017948923f6d7`. Task A (the Jungle status-hazard escape repair)
> is implemented, regression-tested and mutation-checked. Task B is
> [the Durability32 operator packet](bot-balance-durability32-operator-packet.md) —
> PREPARED, NOT LAUNCHED, 120 observations across three blocks. Task C is
> [the mob adoption review](bot-balance-mob-adoption-review.md), whose headline is that
> **no retained mob candidate is live**. The roadmap, matrix and 1.8 candidate below remain
> command-center recommendations, not findings.

## 1. Assignment and authority

Work in the live repository. First implement and test the diagnosed Jungle status-hazard escape repair. Then prepare and qualify a bounded experiment packet for a separate Sonnet operator. Also reconcile the already-retained mob candidates into a current-source adoption review. Stop after the preparation deliverables; do not run the full experiments or begin the boss/item/ability/class passes.

The user has added an explicit T1 exception: Mountain's archers and their Power Shot may be excessively punishing. Include a focused experiment on this issue even though T1 is otherwise treated as substantially calibrated. Do not reopen all T1 content.

The responsibility split is:

| Role | Responsibility |
|---|---|
| Web command center | Campaign direction, interpretation, scope, adoption decisions, and decisions to advance phases. |
| Opus | Scoped repair, source/build audit, experiment design, small qualification pilots, frozen launch tooling, Operator Packet, and adoption proposal. |
| Sonnet operator | Execute the frozen packet once, run its verifier, preserve every outcome, and produce the factual report. No adaptive tuning or unplanned retries. |

Latest user instructions govern design intent. Current code establishes actual behavior, not necessarily desired behavior. Where old comments describe different numbers or mechanics, do not silently substitute them for executable values. Recheck the branch and working tree before starting; the reference commit above is context, not the revision to freeze after your repair.

## 2. Agreed direction and finite roadmap

**Primary balance order: ordinary mobs → bosses → coordinated items and abilities → final class tuning → integrated regression and basic x1/operational checks → invited playtest.**

These are bounded initial passes, not exhaustive parity projects. Class identities guide equipment and ability choices from the beginning; class coefficients are tuned last so they do not compensate for broken or badly calibrated supporting systems. Functional defects that invalidate combat or progression are repaired when discovered, not postponed because their nominal phase is later.

Preserve the expedited-playtest principle from the Night5-R1 roadmap: full specialization parity, exhaustive economy research, and every nonblocking polish issue are not release prerequisites. At each phase exit, make remaining exceptions explicit. Do not turn the sequence below into an indefinitely expanding checklist.

### Phase 1 — Close the initial T1–T4 mob pass

1. Repair Jungle status-only hazard escape and qualify it against the known reproductions.
2. Run the new focused T1 Mountain Power Shot comparison and a post-repair Jungle screen.
3. Resolve the residual T2 Mountain Striker question through existing sequence/build evidence first; request only a narrowly justified follow-up if needed.
4. Reconcile retained Forest, Volcano, Desert, Mountain, Tundra, Trench, Graveyard and other recorded decisions against current authored data. Separate already-live values from experiment-only overlays and superseded candidates.
5. Have the command center review one explicit production proposal. Apply only approved changes, then verify the assembled baseline on current source.

**Exit:** every implemented T1–T4 ordinary-mob role has an explicit retain/change/unknown disposition; adopted changes are actually implemented and checked; no known severe combat/navigation blocker is concealed; remaining pressure and pacing exceptions have a reasoned disposition. A promising overlay alone does not complete the phase. Acknowledged nonblocking asymmetry is acceptable; unknown coverage is not a pass.

### Phase 2 — Boss baseline

Audit current implemented bosses and reuse relevant prior evidence after checking source drift. Cover access, guardians/dungeon preparation, actual boss victory or failure, survival/pressure, fight duration, mechanic cycles, and post-fight return/recovery. Use sensible legal builds and appropriate progression, not unavailable equipment or idealized perfect execution. Do not revive discarded encounters such as the Void Overlord.

Set boss-specific pacing expectations before tuning; do not apply ordinary-mob TTK guides to bosses by default. Separate preparation failure from boss failure. Correct gross durability, damage, mechanic, or progression problems without demanding every build clear every boss equally easily.

**Exit:** credible access and clearability with ordinary competent preparation across implemented tiers; key mechanics have a chance to occur; severe progression blockers are resolved; remaining tuning is documented. Later player-power changes trigger focused boss regression, not a whole-campaign restart.

### Phase 3 — Items and abilities as one supporting layer

Coordinate these two passes rather than independently finalizing one against stale assumptions about the other. Start with equipment power and progression anchors, then ability/guard/stance/RP packages, revisiting a specific interaction when necessary. Include relevant charms, cores and relics; audit rites and rune interactions where they materially affect a build. This is not permission to redesign every system.

Check functional effects, tier scaling, misleading or dead options, gross dominance, acquisition timing, and synergies with intended class play patterns. Use controlled comparisons: changing an entire build estimates a package effect, not the causal contribution of each component. Preserve representative reference builds and encounter benchmarks.

**Exit:** supporting options work, obvious power-budget outliers are addressed, and plausible builds exist without a mandatory universal item/ability package. Deep parity and every niche option can remain later work.

### Phase 4 — Classes and specializations

With supporting systems reasonably stable, review the six roots and representative specialization branches. Determine which residual weaknesses or excesses actually belong to the class rather than the equipped item, ability setup, automation policy, acquisition state, or encounter matchup. Preserve intended differences in ramp, burst, sustain, range, AoE and summon behavior. Do not normalize every class to identical DPS, TTK or survival.

**Exit:** each root has a credible functional progression/build path; severe class-specific outliers are resolved or explicitly bounded; later specialization exploration is listed separately.

### Phase 5 — Integrated release-baseline check

Run a compact regression over changed mob/boss benchmarks after player-power tuning. Check basic x1 early progression and major upgrade gates, reasonable access to feedback-relevant tiers, save/reconnect/restart behavior, death recovery, and applicable release/security requirements. Verify their current status rather than copying old roadmap claims. Record source/build/reward provenance and a known-limitations list.

**Exit:** a coherent, reproducible playtest baseline with credible progression and no known severe blocker. This is not a complete economy calibration. Release/deployment requires its normal separate authorization.

### Phase 6 — Invited playtest and continued iteration

Start small, retain versioned logs and qualitative feedback, and continue deeper class/item/ability/economy work in batches. Keep player feedback and synthetic combat evidence distinguishable. Do not wait for perfect balance or extrapolate T5–T8 now.

### Design invariants throughout

- T4 is approximately the midpoint of the eventual T8 progression, not the final endgame ceiling.
- Durable one-on-one and elite encounters should generally take longer over T2–T4; smaller swarm followers should grow more gently and remain distinct from leaders/controllers.
- Longer fights should create meaningful ability cycles and enemy-mechanic exposure, not merely idle time or movement stalls.
- Historical representative guides are T2 toughest bodies around 15–25s and T3 around 25–35s. The explicit 40–60s T4 mini-boss guide applies to the three Trench species; it is not a universal T4 monster or boss target. Preserve role-specific interpretation and class tails. [R1, R3]
- Occasional deaths are not automatic failure. Systematic severe pressure, inaccessible counterplay, or broken automation cannot be excused as ordinary asymmetry.

## 3. Read these sources before making changes

Start with repository instructions (`AGENTS.md`, `CLAUDE.md`, or their current equivalents), then:

| Source | Purpose |
|---|---|
| `docs/briefs/bot-balance-campaign-state.md` | Current decision, retained candidates, explicit exceptions, and chronological history. Read the current section first. |
| `docs/briefs/bot-balance-night5-r1-review.md` | Expedited playtest scope and coverage-before-depth principle. |
| `docs/briefs/bot-balance-durability31-report.md` | Diagnosed Jungle mechanism, exact reproduction cells, and five repair invariants. |
| `docs/briefs/bot-balance-durability31-operator-packet.md` | Operator-packet structure and diagnostic provenance. Its preparation-era NOT LAUNCHED label is superseded by the completed report/current ledger. Do not relaunch it. |
| `docs/briefs/bot-balance-durability29-report.md` and `bot-balance-durability30-report.md` | Latest Mountain pressure and Trench evidence; read planner corrections in the campaign ledger too. |
| `docs/briefs/bot-balance-ttk-survey-operator-packet.md` | Actual-World synthetic benchmark, exact builds, preparation qualification, natural ecology, and evidence limits. |
| `docs/bot-harness-capability-audit.md` and `docs/bot-experience-command-center.md` | Legal build configuration, attunement, progression/economy distinctions, and reporting contracts. |

For adoption reconciliation, follow the ledger to the relevant Durability19 and Durability22–30 packets/reports and their actual overlay implementations. Read only the portions necessary to resolve live values and provenance; do not restart the campaign by rereading every historical document.

For T1 Mountain, inspect:

- `shared/src/data/monsters/mountain.monsters.ts`, live biome pools, node modifiers and node placement.
- `server/src/systems/combat/engine/monsterMechanics.ts`, `combat.ts`, the actual damage pipeline, guard/interrupt handling and existing telemetry.
- Current T1 route/build/acquisition sources; `server/bench/balance/ttkSurveySpec.ts` as a benchmark reference, not an automatic first-arrival template.
- `docs/balance/t1-numerical-balance-packet-2026-08-27.md` as historical context only. Reconfirm all material mechanics and numbers in current source.

## 4. Task A — Implement the Jungle status-only escape repair

### Diagnosed issue

Durability31 completed 12 observations: six reached the simulated window and six hit the process wall ceiling. Its diagnosis is a player stationary inside a player-targeted, status-only Jungle slow bush. Hazard-aware pathfinding avoids the status shape and rejects paths starting inside it, while the persistent-hazard escape owner does not include that status-only feature. Repeated target reachability scans then request failing paths. A completed window is not automatically defect-free: one completed observation also had a substantial repeated-null tail. [R1, R2]

Current relevant source is `server/src/systems/combat/ai/dynamicHazardAvoidance.ts`, with node-feature and navigation helpers. Its hazard collection at the reference commit includes persistent ground zones and active player-damage features. Extend the existing owner; do not introduce a competing movement controller. [R4]

### Authorized implementation

Recognize live player-targeted `statusWhileInside` features as escape hazards using the same activation, target applicability and geometry semantics as runtime navigation/status application. Preserve existing damage/persistent-hazard behavior. Handle status-only metadata without dereferencing a nonexistent damage effect; avoid duplicate hazard identities when a feature has both damage and status.

Use the existing collision/standability checks and a short escape leg with `avoidHazards=false`. Hold escape ownership until clear of the relevant avoidance envelope, then resume ordinary hazard-aware target acquisition and combat. Preserve existing manual/automatic movement and rune-enablement semantics.

The five Durability31 invariants are binding:

1. Trigger only inside a live applicable status, damage or persistent hazard. Unaffected outside behavior and target priority remain unchanged.
2. Escape destinations stay within the node and physically standable against actual block shapes and node obstacles. No collider resizing or routing through physical walls.
3. Combat/retargeting movement must not override an active escape; normal targeting, approach and attack resume once safe.
4. Unaffected clear paths and successful hazard-aware approaches retain their existing range/reachability behavior.
5. Add the inside-status-only-slow-bush regression: escape outside the clearance envelope, then acquire/approach a target. Keep related dynamic-hazard, telegraph, retarget and combat tests green. [R2]

Also cover a non-player-targeted or inactive feature not triggering escape, a status-only metadata case, and overlapping hazards where relevant to the existing regression fixtures. Prefer extending existing tests over building a new test framework.

### Not authorized

No global hazard-avoidance disable, caching/debouncing workaround, monster-stat change, new targeting preference, general navigation rewrite, or unrelated class/item/ability rebalance. Fix misleading nearby commentary when necessary, but do not restore an old numerical comment as gameplay truth.

### Required repair receipt

Record exact files changed, the diagnosed behavior and fix, regression commands/results, and the qualified revision. Preserve unrelated working-tree edits. Clearly separate unit/regression checks and short pilots from the operator's unlaunched full experiment. Browser/live validation that has not happened stays unverified.

## 5. Task B — Prepare one bounded next Operator Packet

Use `Durability32` only if still unused; otherwise choose the next unused identifier and explain the mapping. Save the packet in `docs/briefs/` using the established `bot-balance-<id>-operator-packet.md` convention. This handoff proposes the design; your packet must resolve every executable detail and freeze it before Sonnet receives it.

Reuse the in-process actual-server-World benchmark for these combat questions. Do not accidentally substitute the Docker progression runner or start development services. Synthetic starts remain explicitly `economyEligible=false`; legal build state is not proof that gear was earned or represents the average player.

### Proposed matrix

| Block | Question | Default design | Planned observations |
|---|---|---|---:|
| A — Jungle repair regression | Do the known defective situations recover correctly on the repaired runtime? | Four historical T4 Jungle setups × three historical seeds, unchanged build/geometry inputs, repaired source. | 12 |
| B — T1 Mountain Power Shot | Is the special-hit spike excessive, and does one local reduction improve it without flattening Mountain? | Six T1 roots × two preparation contexts × two multiplier arms × three fresh seeds. | 72 |
| C — Jungle post-repair breadth | What usable T4 Jungle durability/pressure evidence remains once the navigation defect is removed? | Six roots × two Jungle nodes × three fresh seeds, current mob stats, one sensible specialization per root. | 36 |
| **Total** | Three separately reported blocks, not one pooled dataset. | No adaptive additions or retries. | **120** |

These are design targets, not a claim that the matrix is already qualified. Narrowing before freeze is allowed with an explicit coverage explanation. Do not silently expand into more arms, all specialization branches, or unrelated biomes. Three seeds are a directional starting sample, not statistical certification.

### Block A — Known Jungle reproductions

Use Durability31's four setups: node03 Apprentice/Slinger and node05 Apprentice/Spirit, with seeds `44017`, `46021`, `48017`. Resolve exact IDs and loadouts from the prior packet/implementation. Default observation limit is 120 simulated seconds or first death, using the existing 100ms fixed-step convention.

Inspect the prior trapped trajectories and verify actual escape, clearance handoff, resumed target acquisition and productive combat. Track repeated-null navigation/quiet-time evidence with existing bounded diagnostics where useful. Do not attach a CPU profile to every ordinary run unless newly necessary; do not make profiling overhead part of a balance comparison.

The old reports are diagnostic references, not a same-source causal control when other code has changed. Audit source/input drift. After a gameplay repair, exact post-repair event-prefix equality is not expected. A death before the relevant situation is reached is neither a repair pass nor automatically a repair failure; the verifier/report must preserve whether the required behavior was exercised.

Freeze objective technical pass/fail predicates before launch. A new legitimate gameplay death is distinct from a navigation recurrence. Persistent trapped behavior blocks Jungle pacing interpretation.

### Block B — T1 Mountain Power Shot

**Verified starting point, not a tuning verdict:** at the reference commit the enemy ID is `ridge-archer`, displayed as **Ridge Ambusher**. Its authored stats include HP240, attack50, basic cooldown3100ms and range210. Power Shot is authored with cast2000ms, cooldown8000ms, initial cooldown3500ms, and multiplier**2.2**. Nearby comments mention 2x/1.8 and are stale. This is not T2's `peak-archer` / Boulder Thrower. [R5]

**Primary comparison:** current **2.2** versus one experimental **1.8** Power Shot multiplier. The candidate is a modest local test, not a presumed correct value and not a restoration justified by an old comment. If the live definition has changed since this handoff, reconcile first and state the revised proposal before freezing; do not mislabel a different control as 2.2.

Change only this enemy's `chargedAttack.multiplier` in the candidate overlay. Keep basic attack, HP, cast time, cooldowns, range, AI, population, geometry and every other species unchanged. In particular, do not alter Cliff Hopper/Strong Kick or global damage mitigation. Assert overlay application, including subsequently spawned monsters where relevant, and complete restoration on success and failure.

**Two preparation contexts per root:**

- **First arrival:** a credible, legally reachable Mountain-entry character with equipment and abilities obtainable before that encounter. Do not give it a full +5 Mountain kit, later-tier features, or future mastery merely because the durability factory does so.
- **Ordinary prepared farming:** a sensible, legally reachable T1 Mountain farming build with an explicitly documented preparation level and ordinary defensive tools. Not deliberately naked and not a hand-optimized invulnerable showcase.

Resolve exact gear, upgrades, mastery, root/frame availability, learned/attuned abilities, RP budget, rune order and acquisition constraints from current source. Do not grant a T2 system to a T1 character. Use class-appropriate builds while keeping each control/candidate pair identical. Choose representative natural T1 Mountain nodes for the two contexts and document modifiers and actual rosters. Contexts may differ in multiple preparation inputs and possibly node; **do not interpret their contrast as the causal effect of one item.** The causal treatment is the multiplier within each matched context.

Prefer both contexts to exercise the user's normal Mountain experience. Do not replace the population with one conveniently isolated archer as the main evidence. Small single-enemy fixtures are acceptable for damage/telemetry qualification only.

Default window: 300 simulated seconds or first death, 100ms steps. Predeclare fresh seeds and rotate paired arm order; verify READY build and geometry parity rather than assuming equal seeds ensure it. Do not expect identical later trajectories after the damage treatment changes survival or recovery.

**Counterplay audit:** Power Shot has no planted AoE in its current definition. The current mechanics predicate treats a non-AoE charged cast as mobile. Trace the actual resolution/range, guard and interrupt paths before claiming that Step Back or Orbit dodges it. Distinguish movement, interruption and mitigation. Do not solve the experiment by granting a future interrupt or disabling ordinary automatic behavior. [R5, R6]

**Required evidence:** per-root/context/seed terminal outcome and exposure; Power Shot starts/completions/landed hits or interrupted/cancelled/unresolved casts where observable; HP immediately before/after verified shots and HP loss as a fraction of maximum; barrier absorption and relevant cap/guard effects when exposed by telemetry; largest short-window burst; simultaneous attackers, late joins and companion Strong Kick/basic-hit contributions; minimum HP; recovery/quiet gaps; kills/throughput and body/encounter duration.

Audit representative death and near-death sequences, including successful counterparts. A final Ridge Ambusher hit does not establish that Power Shot caused the whole death sequence. Do not infer exact cast damage from timestamps alone when the schema cannot uniquely attribute it. Report unresolved attribution explicitly; add only minimal, validated instrumentation if it is essential to answer the question. The 2.2→1.8 coefficient change is not necessarily an equal percentage change in final HP damage after mitigation, caps and rounding.

A cell where archers never meaningfully attack is missing exposure, not proof that Power Shot is fair. Do not extend/rerun that cell adaptively. Report whether to retain current behavior, retain the candidate for adoption review, or investigate a specific remaining mechanic/preparation issue. No global T1 damage conclusion follows from this block.

### Block C — Jungle breadth after the repair gate

Use six roots, one credible T4 specialization each, nodes03/05 and three fresh seeds. Default window: 300 simulated seconds or first death. Reuse justified existing builds and current stats; do not silently equip a new universal setup or introduce an unselected Jungle HP overlay. Keep prior situational build findings visible.

Measure species/role body timing, true engagement durations, mechanism exposure, incoming pressure, survival and quiet/navigation gaps. This is a usable-coverage and gross-durability screen, not proof that every Jungle tier or specialization is balanced. Reuse valid T2/T3 evidence after source reconciliation; request extra tier coverage only where a material gap remains.

### Scheduling and gates

Prepare independent block budgets and unique artifact roots. Use order A → B → C with explicit dependency rules. C requires the repaired-Jungle gate; B is logically independent and must not lose its allocation to a slow Jungle block. A diagnosed Jungle-only failure may skip C while B proceeds **only if that behavior is encoded in the packet and global validity is intact**. Source/hash mismatch, broken common setup/verification, or a global harness fault stops every affected block. No discretionary operator continuation.

Set hard per-observation and per-block wall/resource limits from bounded qualification, distinct from simulated time. Preserve cutoffs and unstarted rows; never increase a limit mid-run or recycle failed observations. Stop when the declared work ends.

## 6. Task C — Reconcile adoption and the remaining T2 exception

Produce or update one compact current-source adoption review, preferably `docs/briefs/bot-balance-mob-adoption-review.md`. This is a source/decision audit, not authorization to change all listed values.

For every retained package, record:

| Required field | Meaning |
|---|---|
| Biome/tier/species/role | Exact scope, including followers and summoned/risen variants where relevant. |
| Current authored values | Actual source values and locations at the inspected revision. |
| Selected candidate | Exact overlay/source proposal, distinguishing base from post-modifier runtime values. |
| Provenance | Experiment, arm, frozen revision and the later planner decision that retained or superseded it. |
| Defense coupling | Absolute shield/ward/self-shatter semantics and required inverse scaling or other preservation. |
| Status | Already live / selected but not applied / superseded / inconclusive / explicitly deferred. |
| Remaining gate | A specific approval, current-source check, missing exposure or targeted decision. |

Do not stack successive overlay multipliers by accident or copy a READY HP value into a base-stat field. Several comparisons preserved absolute shields/wards; an adoption that scales those again is a different treatment.

Carry forward at least: retained Forest/Volcano directions; selected Graveyard leader/escort redistribution under normal targeting; Desert controller direction with situational Defensive Striker; retained T4 Mountain durability/pressure package; retained Trench configuration rather than the rejected universal Stalker21000 increase; other retained T4 packages named by the ledger. Exact values come from their installers and source, not this prose. [R1, R3]

**T2 Mountain Striker remains mandatory to disposition.** Review existing Durability27–29/Night5 evidence and available raw death/survivor sequences. The latest comparison reduced T2 total deaths10/36→5/36, but Striker remained3/6 in the candidate. Do not label this resolved or attribute it solely to the terminal Boulder hit. Identify whether legal preparation, encounter pressure, a functional defect, or unresolved evidence explains the remaining concern. If a new experiment is necessary, propose the smallest question/matrix separately for command-center review; do not append another broad Mountain grid to the 120-observation packet. If raw artifacts are unavailable, say so and retain that limitation. [R1, R3]

## 7. Operator Packet contract

The packet must stand alone for Sonnet and contain no unresolved execution placeholders. Use existing packets as a blueprint, not a source of reusable old hashes or obsolete instructions. Include:

1. Purpose, hypotheses, independent blocks, exact treatment differences, shared endpoints and evidence limits.
2. Exact source revision/tree, applicable definitions/hitbox/build/input hashes, manifest identity, and actual accessible input paths. Prove the frozen revision contains the repair, tests and tooling; do not freeze the pre-repair reference commit by accident.
3. Complete matrix, class/branch/build IDs, gear/upgrades, legal progression/RP state, nodes/modifiers, seed list, arm order and counts.
4. Setup/treatment/geometry assertions, observation limits, wall/resource budgets, gated scheduling and terminal-outcome classifications.
5. Validated PowerShell commands for checkout/setup, running and verification; safe quoting; unique output roots; explicit handling of an existing root. No invented commands or local paths presented as verified.
6. Operator boundaries: execute once, no code/build adaptation, no extra experiments, no unplanned retries, no deletion/overwriting of evidence, no unrelated services, no production tuning, no commit/push/deploy by the operator unless separately authorized.
7. Artifacts: manifest/index, READY state, events/samples/summaries, verification, terminal markers/exit status, and a machine-readable result table where the existing tooling supports it. Preserve partial, invalid, censored and unstarted outcomes distinctly.
8. Report path and template: observations first, then supported interpretation, uncertainty, and recommendations. Retain source and artifact provenance and all exclusion reasons.

For timing summaries use seed-level summaries, then root/profile summaries, then explicitly equal-weight role comparisons where justified. Do not pool all kills so fast classes dominate. Keep progression contexts separate, show missing/dead/censored observations beside successful timing, and distinguish body TTK from actual encounter duration and quiet time. Counts/quantiles are descriptive, not confidence intervals. Include owner and summon damage correctly. Zero deaths in completed windows is bounded survival evidence, not unlimited safety.

## 8. Qualification, repository deliverables and stop point

Before freezing, run the relevant typechecks, focused navigation/combat tests, matrix/build legality assertions, overlay-restoration checks, and verifier fixtures. Reuse existing preflight where applicable; do not invoke unrelated full systems merely to accumulate green checks.

Perform zero-tick preparation checks for the declared configurations and seed-dependent geometry, plus a small number of explicitly logged short smoke pilots sufficient to exercise repaired escape, both T1 treatment arms/preparation contexts, and report generation. Pilots must not become the full cohort under another name. State their limits beforehand and preserve them separately; never pool them into the operator dataset. Do not iterate candidate multipliers based on pilot outcomes.

Expected repository deliverables:

| Deliverable | Required content |
|---|---|
| Scoped repair and regression tests | Jungle status-feature escape; no experimental monster stats in production. |
| Repair/preparation receipt | Files, source identity, commands, actual check results and unverified boundaries. |
| `docs/briefs/bot-balance-<next-id>-operator-packet.md` | Fully resolved frozen instructions for Sonnet; clearly PREPARED, NOT LAUNCHED. |
| Supporting matrix/runner/verifier files | Minimal extensions to existing tools, with exact artifact contract. |
| `docs/briefs/bot-balance-mob-adoption-review.md` | Current-source package reconciliation and explicit T2 Mountain disposition/proposal. |
| Campaign state and documentation index updates | New T1 exception, roadmap order, repair status, prepared packet link, and unchanged outstanding gates. Preserve historical reports. |

Save this assignment in the repository at the destination shown above or link it from the campaign ledger without creating competing current-state documents. Follow the repository's approved commit workflow to create the exact source needed for a freeze. Never commit unrelated dirty changes, rewrite shared history, or move the user's branch merely to obtain a snapshot. Do not push or deploy without the appropriate authorization.

Uncommitted or unpushed local files are not automatically visible to the web command center. Return the completed packet and reconciliation as attachments or make them visible through the user's approved repository publishing workflow, with their exact paths and commit. Do not claim they are visible remotely when they are only local.

End your response with: repair status; tests/pilots actually performed; files produced; frozen revision and final observation count; packet readiness or precise blockers; candidate/live distinction; remaining T2/Jungle limitations; and **full experiment not launched**.

Do not ask the operator to redesign the study. Do not claim mob closure or playtest readiness at this preparation stop. The next decision belongs to the command center after Sonnet's verified report and the adoption review.

## Source references for this handoff

All references below were read at `a5d0fce28759d3cd715a66bba5d333642d2a75ea` unless identifying a historical experiment within a document. They are repository citations, not a claim of independently rerun raw evidence.

- **R1:** `docs/briefs/bot-balance-campaign-state.md`, current September18 decision and prior planner decisions.
- **R2:** `docs/briefs/bot-balance-durability31-report.md`, diagnosis, endpoint audit and five repair invariants; companion operator packet for exact historical matrix.
- **R3:** `docs/briefs/bot-balance-durability29-report.md`, `bot-balance-durability30-report.md`, and planner corrections in R1; `bot-balance-night5-r1-review.md` for bounded playtest scope.
- **R4:** `server/src/systems/combat/ai/dynamicHazardAvoidance.ts` and the helpers it imports.
- **R5:** `shared/src/data/monsters/mountain.monsters.ts`, `ridge-archer` entry; executable multiplier2.2 supersedes nearby numerical commentary.
- **R6:** `server/src/systems/combat/engine/monsterMechanics.ts`, `hasMobileMonsterCast`; trace callers/resolution before stronger counterplay claims.
- **R7:** `docs/briefs/bot-balance-ttk-survey-operator-packet.md`, synthetic actual-World benchmark and prepared-build limits; `docs/bot-harness-capability-audit.md` and `docs/bot-experience-command-center.md` for legality and evidence boundaries.

The future roadmap, proposed 120-observation matrix and 1.8 candidate in this document are command-center recommendations for the user's requested next assignment. They are not findings from a completed experiment.
