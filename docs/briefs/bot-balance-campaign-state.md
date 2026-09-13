# Bot balance campaign state

Updated: 2026-09-13. Owner: Astra (planning and interpretation); operators: Luna.
Status: Night2-A completed6/6 boss wins with safe tails (Cave control2/2, reactive2/2, Jungle2/2). Spirit has independent candidate wins on all seven T2 bosses. Night2-B also earned Plains→Forest→Desert seals and T3 continuously, but died in Volcano transit before a recovered checkpoint. [Active ledger](bot-balance-night2-ledger.md): preparing ordinary Fight Back/Avoid Enemies travel and a defensive travel build for a new bounded bridge case. No gameplay balance edits authorized overnight.
V1j's original capacity stop is historical; both rerun manifests completed and released their networks automatically. [Lifecycle](bot-experiment-resource-lifecycle.md).
Audited gameplay revision: `353d5eceeea31bd14de9eb38dbeb70dca85abc95`.
This is an audit anchor, not a frozen execution manifest. Recheck source before execution.

Reusable strategy reasoning: [theorycrafting reference](bot-balance-theorycrafting-reference.md), reviewed September 13 against `99391c5` with a concurrent control-change caveat. It corrects the human Plains loadout timeline and records encounter-specific gear, ability and RP hypotheses for selection after V1i; it does not amend the frozen packet.

## Objective and authority

Establish expert-prepared solo viability. Cover every boss and establish a viable
progression path for each class. Difficult class/boss matchups are acceptable;
every class need not defeat every boss. Preparation uses tools legitimately
available at the declared progression boundary, with encounter-specific swaps.
Best justified candidate does not mean proven global optimum.

Astra selects questions, treatments, checkpoints, replication and stopping rules,
interprets reports, and proposes design changes. Astra implements templates, profiles, routes and assertions. Luna operates
approved work, preserves artifacts and reports facts. Gameplay balance changes
require explicit user approval. On September 13 the user approved removing T1
Cave corrosion from ordinary hits and retaining two or three stacks on Breach;
the follow-up human playtest requested two stacks, now implemented. Other balance changes still require approval.
Technical defects and design changes must be reported separately.

User-supplied Class Route & Build Baselines and Runic Point Allocation Reference
are advisory strategy material. Their proposed matrices and imperatives are not
execution instructions. Current source and explicit user direction take precedence.

## Sequential plan

### Active operating mode: autonomous Astra–Luna overnight loop

Activated by the user's explicit start instruction on 2026-09-13 at21:04:42 UTC. The [overnight plan](bot-balance-autonomous-night-plan.md) has an eight-hour,20-case,four-packet ceiling and conditional experiment sequence. Deadline2026-09-14 05:04:42 UTC. Follow the active ledger for packet state; this authorization does not include gameplay balance edits.

Once activated, the purpose is to remove the user's messenger role while keeping expensive Astra work focused on decisions:

1. **Astra plans and prepares:** inspect current source and completed evidence; choose a useful bounded question; implement/test bot templates, routes and necessary harness work; freeze a concrete operator packet with inputs, revision, run limits, evidence requirements and stopping rules.
2. **Luna operates:** delegate the packet to a Luna subagent with minimal essential context and explicit document paths. Luna runs the frozen cases, supervises execution, preserves artifacts, verifies terminal resource release and returns a concise report. Luna does not redesign builds, tune gameplay, improvise retries or expand the experiment.
3. **Astra waits:** use completion-driven agent waiting while Luna operates. Renew bounded waits only as required by the available tools; a wait timeout is not a reason for a fresh gameplay analysis or repeated log inspection. Avoid routine five-/ten-minute supervisory polling by Astra. Waits/messages still have some overhead; exact limits depend on the current runtime. Give Luna responsibility for packet deadlines and runtime health.
4. **Astra reviews and iterates:** verify the returned evidence, update this campaign state and the reusable theorycrafting reference, select the next experiment and repeat within the activated session's scope and deadline. The user should not need to relay completion messages between agents. Keep each packet bounded; autonomy does not permit extra attempts inside a frozen packet.

The overnight work continues **validation, analysis and experimentation** toward expert-prepared solo viability and credible progression. Improve general understanding of class delivery, gear/ability/rune/stance synergies and encounter counters; do not just copy the last successful build. Continue the existing tier roadmap, including a credible continuous T2-to-T3 path before limited T3 exploration; preserve the T3/T4 low-eHP balance caveat.

**Balance proposals are allowed; balance changes are not.** Astra may record what it would rebalance, the evidence, proposed direction/values, expected tradeoffs, confidence and the test that would validate the proposal. Do not implement those changes, even in a new experimental image, without separate user approval. Distinguish weak bot preparation, behavior defects, instrumentation gaps and actual balance pressure. Scoped bot/harness fixes remain within preparation authority; a proposed gameplay-mechanics change needing user judgment must be surfaced rather than disguised as a bot fix.

At activation, record a finite session deadline and scope in the first packet. No token budget or exact overnight duration has been specified yet. Retain one active operator/manifest unless separately authorized. Use normal terminal network release and preserve artifacts/volumes; do not revive or alter old runs to create new evidence.

Latest T3 steering: the user identifies **Volcano and Tundra as highest risk for excessive mob damage**, possibly badly unbalanced. Treat this as an explicit investigation priority, not a confirmed result. Establish another source-audited T3 reference before separate bounded probes; avoid uncontrolled death loops. Keep incoming-damage risk distinct from the existing T3/T4 low enemy-eHP concern. No balance changes without approval.

If progress is blocked, evidence is insufficient for a responsible next step, the session deadline is reached, or a decision requires the user, stop safely and leave a concise handoff. The user explicitly accepts waiting until they return, including an overnight stall; there is no requirement to keep producing runs or spend tokens repeatedly checking an unresolved blocker. Preserve the current facts, failed/unstarted slots, candidate balance proposals and the exact input needed to continue. Do not automatically schedule reminders or restart after a stop.

End-of-session handoff: completed experiments and artifact/report links; conclusions versus hypotheses; template/harness changes and validation; proposed balance changes (unapplied); remaining blockers; recommended next experiment.

| Stage | Question / work | Exit evidence |
|---|---|---|
| Q0, prepared | Qualify existing templates and their first build transitions; prepare exact local readiness routes | Six source-derived profile records, legal acquisition/build sequences, concrete runtime packet |
| Q1, complete | Can each selected profile acquire and reconcile its build? | Six configuration successes; combat under the post-prep builds was untested |
| Q2, initial slice complete | Do the two configured builds actually fight and activate abilities? | Six profiles, twelve completed T2 Plains windows on `755b2a36`; broader conditions/routes remain untested |
| V1, in progress | Can prepared builds farm and solve bosses? | Four of five T1 bosses have historical Striker candidate wins; human Cave success recorded. Current Cave/Mountain checks and targeted T2 progression are prepared in V1h |
| V2 | What resolves a particular failing matchup? | Small local alternatives selected from failure diagnosis, initially 2–3 replicates |
| E1 | Is shipped progression pacing appropriate? | One-tier 1× economy studies using current credible carryover, after functional routes/builds |
| A1 | Does the assembled progression work? | Late broader acceptance runs only |

Q0 is specified in [the qualification packet](bot-balance-q0-template-qualification.md).
Q1 is specified in [the operator packet](bot-balance-q1-operator-packet.md); no large matrix or automatic downstream queue.
T3/T4 remain outside V1g. Update from the user on September 13: formerly nonfunctional boss mechanics are repaired; do not keep that as an active known defect. Low TTK / insufficient ordinary-mob eHP remains an open T3/T4 balance issue for a later pass. V1f used integrated mechanic source `3426063e`; V1g retains that gameplay.

## Template shortlist and current RP audit

Calculated directly from `TIER_ENTRY_PROFILES` with shared `runicPointBreakdown`
and `runeBudgetForGlobalMastery` on 2026-09-12. This is cost arithmetic, not a
runtime validation or acquisition proof. Each row uses its `-clean` profile;
the other wallet modes are not additional combat treatments.

All six have GM30 / 22 RP, Expose Weakness + Second Wind (13 RP), no attuned
stance or Rite. Armor/recovery/mobility are `mountain-vest-t1`,
`swamp-charm-t1`, `plains-boots-t1`; Core and relic are null.

| Seed profile ID | Frame | Weapon | Logic / total RP | First issue to qualify |
|---|---|---|---|---|
| striker-t1-t2-entry-clean | cadence-balanced | chaotic-axe | 7 / 20 | Frequency-compatible abilities; stance transition |
| squire-t1-t2-entry-clean | cooldown-heavy | chaotic-axe | 7 / 20 | Recovery/telegraph response; later heavy-weapon alternative |
| slinger-t1-t2-entry-clean | reload-heavy | ashbrand-blade | 9 / 22 | Ranged spacing and first additional reservation |
| spirit-t1-t2-entry-clean | energy-heavy | chaotic-axe | 9 / 22 | Ranged spacing/barrier and first additional reservation |
| apprentice-t1-t2-entry-clean | dot-balanced | chaotic-axe | 9 / 22 | DoT targeting opportunity cost and first additional reservation |
| conduit-t1-t2-entry-clean | summoner-balanced | chaotic-axe | 9 / 22 | Formation/reconstruction and first additional reservation |

Common ordered logic: Always → Find Enemies; Inside Telegraph → Step Back;
In Combat → Chase Enemy (first two) or Keep Distance (`orbit`, remaining four);
Always → Avoid Hazards; Always → Recover First.

These are compatibility seeds, not optimized recommendations. Keep their source
controls intact; author new named profiles for deliberate improvements. Examine
both an economical farm repertoire and a prepared boss repertoire per class,
but only run alternatives that address an observed question. Conduit frame,
Apprentice frame/weapon and Slinger weapon alternatives remain targeted branches.

## Entry-state policy

- Synthetic T2 profiles: reusable for explicitly labeled combat/integration work;
  even `natural` is a modeled wallet, not measured natural carryover.
- Snapshot B: authentic historical T1 handoff; requalify current legality and
  representativeness independently. Snapshot A is not interchangeable.
- J0/J3/D0: local T2 checkpoint support exists. Seal exact files and checkpoint
  kinds; avoid a broad directory that also contains nested source inputs.
- No qualified T3/T4 entry catalogue established by this audit.
- Reconstructed runtime state (HP, cooldowns, summons, stance ownership) requires
  explicit readiness; a persistent snapshot is not an exact combat replay.
- Earlier-tier items are allowed; future-tier power and circular acquisition
  (requiring the target boss's first-clear to prepare for that first-clear) are not.

## Validity and evidence rules

Assert source/build identity, isolation, checkpoint kind, tier, root/frame/range,
equipment IDs and upgrades, Core eligibility, known tools, exact ordered build,
RP capacity/cost, policy, reward mode and reached treatment before measurement.
Recheck after evolution, death, swaps and resync. An accepted partial build is
invalid, not a weak build. Active stance may change legitimately via Rune rules.

Configuration evidence and behavior evidence are separate. For conditional
firing, record an eligible opportunity, expected activation/suppression and
observed result. No opportunity means untested, not failed. Exclude cooldown,
targeting, cast arbitration and interruption explanations before diagnosing a bug.

Classify outcomes: invalid treatment; bot configuration; route deficiency;
harness/orchestration; engine defect; economy/progression; build weakness;
encounter difficulty; or unresolved. Preserve timeouts and partial observations.
No automatic retries, pooling replacements or automatic winners. Fixed RNG replay
is not available; paired launch order does not imply matched random encounters.

## Time and sample policy

Default runtime readiness ceiling: 5 minutes per case, setup reported separately.
Default local viability ceiling: 15 minutes per run, with an initial maximum of
3 boss attempts. Packet-specific changes must be justified before execution.
Begin with one readiness case per distinct behavior, then 2–3 real replicates.
Stop early when sufficient evidence answers the question; one valid kill proves
possibility, repeat kills support reliability, neither proves universal balance.

Define progress for each objective (kills/XP for farming, phase/HP advancement for
bosses, prerequisite convergence for prep). Account for legitimate recovery and
scripted invulnerability. Never use a universal idle timeout as a balance verdict.
Record preparation, transit, recovery, attempts and elapsed-time cap separately.
Do not extend a live run merely because it has already consumed time.

## Historical evidence and invalidation ledger

| Evidence / change | Current interpretation |
|---|---|
| Final T1 cohort, 2026-09-05: 24 full, 5 Slinger partial, 1 Spirit infrastructure failure | Route/provenance assets survive; mastery/+5 success did not prove boss success |
| T2 day closeout: invalid prep, wrong treatment boundaries and stranded manifests | Readiness/assertion-order lessons; non-runs are not gameplay evidence |
| T2 focused closeout, 2026-09-10 | Cross-cohort queue was repaired; do not repeat the obsolete missing-queue diagnosis |
| Jungle thicket / Recover First softlock | Engine confound fixed in source; old frame/weapon stall rankings are not clean balance evidence |
| Unified RP | Reprice all legacy packages; custom rules suppress the named ability default |
| XP redesign: T1–T4 segment budgets 1750/5000/7000/9000 | Old pacing and accumulated wallets are not current pacing evidence |
| September 12 stance gates / attack-speed changes | Requalify affected combat comparisons |
| Splinter/Kilnmaster secondary efficiency | Advisory future idea is already live at 1.2/1.3; weighted formation model still applies |

Source/report links: [build audit](../bot-harness-capability-audit.md),
[command-center tooling](../bot-experience-command-center.md),
[runner](../bot-experiment-runner-current-state.md),
[T2 day closeout](t2-day-experiment-closeout-2026-09-09.md),
[focused closeout](t2-focused-experiment-2026-09-10.md),
[old pacing](t2-economy-pacing-analysis-2026-09-10.md),
[XP redesign](biome-mastery-progression-redesign-2026-09-11.md).

## Campaign ledger

- Validated: shared-cost projection and source-ordered build/acquisition tests; see Q0 report for executed checks.
- Current runtime qualification: Q1 six profiles passed configuration on `1d3c710f`; Q2b/Q2c/Q2d all six completed both local behavior windows on `755b2a36`. Slinger and Apprentice supplied death/return evidence. Later T1 Striker boss results are recorded below; T2 boss coverage remains open.
- New confirmed balance signals: none. Bot executor defects: death notification consumed before live respawn; suppressed-combat attackers postponed navigation recovery. Repaired for V1d; one natural death recovered and preparation completed.
- Approved gameplay change, 2026-09-13: T1 Cave corrosion only on Breach, two stacks per cast after a follow-up human test found three still too strong; ordinary attacks apply none. Base cap six and half-HP cap nine retained and displayed explicitly in the bestiary. Further approval reduces base attack 47 to 40, retaining Breach's 1.1x multiplier; HP remains 1750 under discussion. No T2/T3 change. Await the user's playtest before preparing the next Cave experiment; beatability remains unvalidated.
- Historical operation: V1a `20260912t194203z-striker-campaign-plains-boss-t` reached GM30, timed out while upgrading Plains Vest +5, and made zero boss attempts. Supervisor EPERM left stale running state; worker timeout is durable. [Assessment](bot-balance-v1a-assessment.md).
- Latest result: V1b finalized normally with a preparation timeout, Axe +5 and zero boss attempts. [Assessment](bot-balance-v1b-assessment.md). The earlier V1a lifecycle remains invalid.
- Latest result: V1c failed its supplier arrival wait after a transit death. Two ordinary deaths overall, no final kit or boss encounter. [Assessment and executor repair](bot-balance-v1c-assessment.md).
- Latest result: V1d completed 105/105 steps in 18m42s with one natural transit death recovered. [Assessment and inherited-lessons review](bot-balance-v1d-assessment.md).
- Latest result: V1e completed in 213.919 seconds with one authoritative Plains clear, zero deaths and 46.548 seconds of boss combat. This demonstrates prepared Striker possibility, not reliability, other-class viability or canonical pacing. [Assessment](bot-balance-v1e-assessment.md).
- Latest result: [Night 1](bot-balance-night1-report.md) earned Mountain armor +5, then produced one valid Swamp Expose/Cleanse loss and one dual-Guard victory. Third entry failed HP/buff checks; fourth case interrupted, all remaining slots unstarted. [Assessment and count clarification](bot-balance-night1-assessment.md). No new T2 results.
- Latest result: [V1f assessment](bot-balance-v1f-assessment.md): atomic entry qualified; dual Guard is the preferred prepared Striker Swamp candidate (3/3 versus 0/3). Gnarled Greatbear and Crag Behemoth killed; Cave retained 30.63% HP after a valid death. Cave's `bot_partial` did not justify stopping Plains. Guardian/boss identity and range-metric corrections are recorded in the assessment. No T2 execution evidence added.
- Active operation: V1g is frozen on `d836321279ef3fa4927f293326a5483928f54378`. Cave phase `20260913t090242z-striker-campaign-night-cave-t1` is terminal with six `bot_partial` losses. T2 phase `20260913t093354z-striker-t2-progression-squire` was running when the user approved the Cave nerf. Leave this independent T2 screen running; do not alter images/manifests or mix pre-nerf Cave evidence with later results. After its final report, qualify the patched source and repeat the bounded Cave comparison with the same earned input.
- Historical Q2d Spirit, Apprentice and Squire passed. Apprentice died once and returned; Spirit's Q2c pre-worker failure remains separate. [Overall readiness state](bot-balance-q2d-assessment.md).
- Historical Q2c Conduit/Slinger passed and Spirit stopped before startup due to Docker address exhaustion. [Assessment and infrastructure repair](bot-balance-q2c-assessment.md).
- Historical Q2b `20260912t170727z-striker-campaign-local-behavio`: Striker completed, no deaths or unwanted transit; Sweep 8 kills/8 activations, Expose 5 kills/6 activations. Readiness only.
- [Q2b assessment](bot-balance-q2b-assessment.md) accepts the repair and corrects the report's truncated manifest hash and Defensive Rune count. No template or gameplay edits needed.
- Historical Q2 `20260912t162628z-striker-campaign-behavior-t2-s`: Striker timeout, Squire cancelled after start, four cancelled before start. Keep its partial evidence separate.
- [Q2 assessment](bot-balance-q2-assessment.md): unnecessary catalogue-first node transit consumed 278 seconds. This is route/observation evidence, not a build weakness verdict.
- [Astra Q1 assessment](bot-balance-q1-assessment.md): raw event verification and reason for Q2. Uncommitted gameplay changes are excluded from the Q2 source.
- On return: record exact revisions/artifacts, classify evidence, update affected
  profile/checkpoint status, then choose one next question. Historical passing
  preflight reports must not be presented as fresh verification.

## V1g review / V1h prepared

See [V1g assessment](bot-balance-v1g-assessment.md) and [V1h operator packet](bot-balance-v1h-operator-packet.md). Source 3145246a includes current Cave/Mountain mechanics and corrected catalyst acceleration. Thirteen bounded runs; no experiment launched by Astra. T2 legacy screens remain not-asserted diagnostics. Next direction: isolate build improvements, acquire credible current T2 checkpoints, then qualify separate boss encounters. T3/T4 low TTK remains deferred.

## V1h reviewed / V1i prepared

[Assessment](bot-balance-v1h-assessment.md) and [operator packet](bot-balance-v1i-operator-packet.md). Frozen source61080e54. Resource-aware upgrades and strict explicit prepared-T2 resume are tested. The original Spirit snapshot stays unchanged and retains synthetic/25x provenance. Plains compares two weapons with dual Techniques; Forest tests a prepared burst-defense candidate. Eight runs; three hours of worker ceilings, four hours total. No manifest created or launched by Astra. T2 boss coverage begins here; T3/T4 low TTK and normal-speed economy remain deferred.

## V1i reviewed / V1j prepared

[Assessment](bot-balance-v1i-assessment.md), [V1j packet](bot-balance-v1j-operator-packet.md). Frozen source `6365651b` includes the monster-control correction. Expand encounter coverage while testing a transferable defensive distinction: burst buffering versus sustained Recovery access. Two Mountain and four Swamp cases independently reuse the original Spirit prepared input. No class-wide weapon ranking, canonical evidence promotion, gameplay changes or launched manifest. Remaining T2 bosses and broader class paths follow after these results; T3/T4 balance stays deferred.

## V1j reviewed / V1k prepared

[Assessment](bot-balance-v1j-assessment.md), [V1k packet](bot-balance-v1k-operator-packet.md). Frozen source `a419a7ff`. Swamp losses identify poison as the lethal pressure; test Bog Wrappings against Cave armor with recovery/abilities fixed. Add Cave triple-Guard and Desert Cleanse candidates. A boss kill and surviving its remaining effects are now separate reported outcomes. Eight independent cases reuse original Spirit input; no manifest launched. Jungle remains after this coverage pass, then one continuous three-seal/ascent route can open limited T3 exploration without requiring every class/boss combination. T3/T4 low mob eHP remains deferred.
