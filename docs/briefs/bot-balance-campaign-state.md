# Bot balance campaign state

Updated: 2026-09-12. Owner: Astra (planning and interpretation); operators: Luna.
Status: six-profile local readiness passed; V1c exposed post-death travel recovery defects before final preparation. V1d repair validation prepared; campaign bosses remain untested.
Audited gameplay revision: `353d5eceeea31bd14de9eb38dbeb70dca85abc95`.
This is an audit anchor, not a frozen execution manifest. Recheck source before execution.

## Objective and authority

Establish expert-prepared solo viability. Cover every boss and establish a viable
progression path for each class. Difficult class/boss matchups are acceptable;
every class need not defeat every boss. Preparation uses tools legitimately
available at the declared progression boundary, with encounter-specific swaps.
Best justified candidate does not mean proven global optimum.

Astra selects questions, treatments, checkpoints, replication and stopping rules,
interprets reports, and proposes design changes. Astra implements templates, profiles, routes and assertions. Luna operates
approved work, preserves artifacts and reports facts. Gameplay balance changes
require explicit user approval. No balance changes are approved in this campaign.
Technical defects and design changes must be reported separately.

User-supplied Class Route & Build Baselines and Runic Point Allocation Reference
are advisory strategy material. Their proposed matrices and imperatives are not
execution instructions. Current source and explicit user direction take precedence.

## Sequential plan

| Stage | Question / work | Exit evidence |
|---|---|---|
| Q0, prepared | Qualify existing templates and their first build transitions; prepare exact local readiness routes | Six source-derived profile records, legal acquisition/build sequences, concrete runtime packet |
| Q1, complete | Can each selected profile acquire and reconcile its build? | Six configuration successes; combat under the post-prep builds was untested |
| Q2, initial slice complete | Do the two configured builds actually fight and activate abilities? | Six profiles, twelve completed T2 Plains windows on `755b2a36`; broader conditions/routes remain untested |
| V1, in progress | Can prepared builds farm and solve bosses? | V1c reached GM30/Axe +5, then stalled after a transit death; V1d validates repaired travel recovery with unchanged preparation |
| V2 | What resolves a particular failing matchup? | Small local alternatives selected from failure diagnosis, initially 2–3 replicates |
| E1 | Is shipped progression pacing appropriate? | One-tier 1× economy studies using current credible carryover, after functional routes/builds |
| A1 | Does the assembled progression work? | Late broader acceptance runs only |

Q0 is specified in [the qualification packet](bot-balance-q0-template-qualification.md).
Q1 is specified in [the operator packet](bot-balance-q1-operator-packet.md); no large matrix or automatic downstream queue.
T3/T4 templates are built when those tiers become the next question.

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
- Current runtime qualification: Q1 six profiles passed configuration on `1d3c710f`; Q2b/Q2c/Q2d all six completed both local behavior windows on `755b2a36`. Slinger and Apprentice supplied death/return evidence; no campaign boss coverage yet.
- New confirmed balance signals: none. Bot executor defects: death notification consumed before live respawn; suppressed-combat attackers postponed navigation recovery. Repaired for V1d; runtime validation pending.
- Approved gameplay changes: none.
- Historical operation: V1a `20260912t194203z-striker-campaign-plains-boss-t` reached GM30, timed out while upgrading Plains Vest +5, and made zero boss attempts. Supervisor EPERM left stale running state; worker timeout is durable. [Assessment](bot-balance-v1a-assessment.md).
- Latest result: V1b finalized normally with a preparation timeout, Axe +5 and zero boss attempts. [Assessment](bot-balance-v1b-assessment.md). The earlier V1a lifecycle remains invalid.
- Latest result: V1c failed its supplier arrival wait after a transit death. Two ordinary deaths overall, no final kit or boss encounter. [Assessment and executor repair](bot-balance-v1c-assessment.md).
- Next action: Luna executes [V1d](bot-balance-v1d-operator-packet.md) on `028e8933`: same fresh preparation route and 30-minute cap, repaired death/navigation recovery, no dungeon step.
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
