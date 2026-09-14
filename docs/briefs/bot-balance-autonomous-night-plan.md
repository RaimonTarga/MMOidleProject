# Autonomous overnight session plan

Prepared 2026-09-13; **activated by the user's explicit green light** at 2026-09-13 21:04:42 UTC. Hard deadline 2026-09-14 05:04:42 UTC; finalization begins no later than 04:34:42 UTC. Luna operator `/root/luna_operator` spawned. See [Night 2 ledger](bot-balance-night2-ledger.md). V1k has finished.

**Night 2 is now closed** after four packets and12 terminal cases; see [handoff](bot-balance-night2-handoff.md). This plan describes the completed activation, not an ongoing authorization to launch more cases.

## Objective and proposed limits

Make progress from isolated T2 viability toward one continuous T2-to-T3 path, while investigating failures with encounter-specific builds. Learn transferable mechanics and preserve that reasoning for future classes. Produce evidence-backed balance proposals where justified, but apply no gameplay balance changes.

Proposed ceiling: **eight hours from activation, at most20 gameplay cases, at most four newly frozen operator packets**, one Luna operator and one active manifest at a time. These are ceilings, not work quotas. Preparation, analysis and cleanup count against the eight hours. Finish earlier when the evidence answers the useful questions or a blocker needs the user. No token budget has been specified. Record an exact UTC deadline when activated; reserve the final30 minutes for finalization and handoff. Do not launch a case whose configured cap plus finalization allowance exceeds remaining time.

Astra owns source review, theorycrafting, templates, scoped harness work, verification, packet freezing and interpretation. A Luna subagent operates only its supplied packet, monitors health/deadlines, writes the report and verifies network release. Give Luna a compact self-contained instruction plus exact file paths, not the entire conversation history. Astra uses completion-driven waiting and renews bounded waits as required by the runtime; routine Astra log polling is not part of the plan. If delegation is unavailable, stop and report that limitation instead of silently operating the whole night on Astra.

## Starting evidence: V1k

Read [the completed report](bot-balance-v1k-report.md) and verify its durable artifacts at session start before designing the first packet.

| Reported result | Planning implication |
|---|---|
| Swamp: both arm packages killed the boss2/2; Bog Wrappings had safe tails2/2, Cave Vest1/2 | Anti-DoT armor is a promising encounter candidate. The sample does not prove superiority or isolate its passive; avoid spending the night chasing a precise armor ranking. |
| Cave: both prepared triple-Guard cases lost; boss remaining16.4% and68.3%; all seven recorded slam outcomes failed | Investigate the defensive response window and actual incoming damage before adding more recovery or proposing a nerf. Ordinary melee delivered the final blows; a failed telegraph and the later lethal hit must remain distinct. |
| Desert: two kills and two safe tails | Retain this candidate for a continuous progression route. No need to repeat it solely to accumulate wins. |
| All entries valid; automatic release worked; one Swamp post-kill death led to a bounded observation stall | Separate safe survival, boss defeat and observation completeness. Repair tail reporting only if needed; this is not a pre-kill boss loss. |

Together with earlier reports, Spirit has candidate T2 wins in Plains, Forest, Mountain, Swamp and Desert. Cave is unresolved; Jungle remains untested in this pass. These are independent prepared runs, not a combined character with five seals. Synthetic/25x taints and false eligibility remain intact; they do not establish normal-speed economy or every class's progression.

## Night sequence and branching decisions

Time allocations are planning envelopes, not promises that every phase will run. Actual manifests have fixed case counts, per-case caps and explicit stop rules. Select later packets only after reviewing earlier results; never let Luna improvise arms mid-packet.

### 1. Evidence, source and first-packet preparation — approximately45–75 minutes

- Read the campaign state, theorycrafting reference, V1k packet/report and source changes since `a419a7ff`. Current HEAD includes a later Bog Lurker Deathroll correction; inspect its relevance rather than silently pooling old/new Swamp observations.
- Reconstruct the two Cave boss windows from raw events: slam/Step Back timeline, Brace activations relative to impacts, Cleanse targets, preceding HP/barrier/shred and the next ordinary hit. Verify that the alleged failure is a usable cue/response limitation rather than assuming the aggregate explains it.
- Audit the player-visible guardable-threat conditions and ability arbitration. Determine whether a named Brace rule can target the damaging response window, whether it fires prematurely on a non-damaging burrow cue, and whether the equipment/RP/acquisition path remains legal. Do not invent a bot-only dodge or privileged phase signal.
- Review Jungle's shield/flee/conceal/ambush sequence. Select a candidate based on maintaining damage through its vulnerable windows and surviving re-engagement. Consider Hamstring only if source shows useful control in the relevant movement phase; it is movement slow, not reduced attack cadence.
- Freeze a clean revision and the first packet after required focused checks and preflight. Preserve unrelated working-tree changes. Prepare on a separate checkout if another session is actively editing relevant files.

### 2. First operator packet: Cave diagnosis plus Jungle coverage — target6 cases

**Cave: four cases, two per arm.** Retain the V1k triple-Guard package as the current-revision control. First candidate hypothesis: make existing burst protection arrive at a useful telegraph window instead of relying solely on a low-HP trigger. Hold gear/frame fixed if the runtime exposes a valid ordinary player rule. Exact trigger, rule order and RP are selected only after the phase1 audit. If that candidate cannot legally express the desired timing, choose one source-justified defensive alternative (for example a different armor/HP package), document its tradeoff, and keep a contemporaneous control. Do not run a knowingly nonfunctional trigger just to fill a slot.

**Jungle: two cases of one source-derived candidate.** Start with the supported Heavy Spirit/Axe delivery and a deliberately selected defensive/control package. Record whether it actually attacks/breaks the escape shield and what happens at ambush if telemetry permits. One boss attempt per case, ordinary guardians, bounded post-clear observation. A win establishes feasibility, not proof every mechanic was countered.

Use at most20 minutes per case unless acquisition review justifies a different cap within the night ceiling. If an intended build is invalid, freeze a corrected future packet only after analysis; do not rewrite or retry that slot. If telemetry cannot discriminate the alternatives, stop the comparison and document the missing observation rather than deriving a causal ranking from win counts.

### 3. Review and a continuous T2-to-T3 bridge — target1–2 cases

Do not make the bridge depend on solving Cave. Use three supported T2 encounters on **one character**, tentatively Plains → Forest → Desert, with encounter-specific gear/ability swaps through ordinary costs. Recheck route feasibility and current-source behavior before freezing it. This avoids relying on the still-fragile Swamp case or treating separate snapshots as one progression history.

Start from a verified prepared T2 checkpoint with no current-tier seals; preserve its synthetic/accelerated provenance. Earn all three required seals sequentially, satisfy actual ascent conditions and export a credible T3-entry snapshot. Do not grant seals, merge snapshots, reset death counts, relabel entry state or import future-tier abilities. Include recovery between encounters using ordinary player behavior.

Proposed cap45 minutes per case; one initial case, with a second declared replicate only if affordable within the session budget. A progression failure is useful evidence. No unplanned restart until success. If the bridge cannot be completed, later work stays on its concrete blocker rather than bypassing it to reach T3.

### 4. Conditional exploration — choose the useful branch, not both by default

**If a valid continuous T3 entry exists and time permits:** prepare a small T3 mechanics/acquisition screen, initially2–4 cases capped at20–30 minutes. Audit one class's newly legal branch, runes, stance/ability ranks and reachable recipes. Test actual spending/equipping/behavior and one justified alternative if available. Use the observed earned entry, independently copied when required by the design. Do not assume GM, +5 gear, currency or recipes that this entry has not earned. T3 boss attempts require a separately qualified entry/build and an explicit case in that packet; they are not a promised night objective. Low ordinary-mob eHP/TTK means quick kills are not a balance pass.

**User steering: T3 Volcano and Tundra are the highest-risk biomes for potentially excessive mob damage.** This is a reported concern, not a confirmed balance verdict. Establish a reference in another source-audited T3 biome first; none is assumed safe merely by exclusion. Then, if entry/preparation is credible and time remains, allocate separate bounded Volcano/Tundra probes from the same qualified checkpoint. Inspect direct bursts, attack frequency, DoTs, hazards and overlapping attackers separately. Do not let a broad farming route repeatedly feed deaths into either biome or treat failed acquisition there as general T3 unviability. Stop each exploratory probe at its first death or explicit unsafe-progress limit, retain the lethal trace and return to analysis. If ordinary reachable preparation cannot support a credible test, document that dependency instead of granting gear. High incoming damage can coexist with low enemy eHP; keep those two balance concerns separate. Propose changes only, with no overnight tuning. These probes fit inside the same T3 case allocation and overall ceilings; they do not add a new budget.

**If the bridge or first packet exposes an actionable T2 problem:** spend the next small packet on that failure, changing one interpretable factor or explicitly labelling a whole-package comparison. At most one further Cave comparison during the night. If multiple valid alternatives still fail and evidence suggests a gameplay decision is needed, record the balance proposal and park Cave; do not consume the night repeating it.

**If T3 is blocked but T2 evidence is healthy:** select one contrasting class for a bounded prepared T2 screen, using its own verified checkpoint and damage-delivery reasoning. Do not copy Spirit's Axe/ability choices automatically. Striker or Squire are candidates because preparation checkpoints exist; inspect them before choosing. No new six-class matrix overnight.

These later branches share the20-case/four-packet/eight-hour ceilings. Unused slots are not permission for extra runs. If no useful branch is ready, finish the analysis and stop.

### 5. Final synthesis — reserve at least30 minutes

Write a morning handoff with:

- Exact packets/cases completed, stopped and unstarted, with artifact paths, source/input hashes and network-release status.
- Boss defeats separately from post-clear survival; template validity separately from observed gameplay, and normal acquisition separately from accelerated economy.
- A compact class/encounter strategy ledger: mechanism predicted, observed result, competing explanation and where the principle may transfer.
- Template/harness changes with validation and limitations. No concealed gameplay modifications.
- Proposed balance changes, if warranted: observed problem, candidate alternatives already tried, proposed direction or values, expected tradeoffs, confidence and the validation experiment. Explicitly mark every proposal **unapplied**. Where evidence is too weak, record a question instead of inventing a numerical nerf.
- The best next experiment and any precise question for the user.

## Authority and stopping

After the user activates this plan, Astra may prepare and dispatch successive bounded packets within it without requiring the user to relay messages. Luna may operate only the current frozen packet. No gameplay balance edits, even temporary ones in an experimental image. Ordinary bot templates, routes and scoped harness fixes are permitted; a gameplay-mechanics fix needing user judgment is proposed and parked.

Respect each packet's entry/treatment/infrastructure stops. Preserve every started slot and artifact. A real blocker returns to Astra; if it needs the user or cannot be safely resolved within preparation authority, stop and wait for input. Do not repeatedly poll an unresolved blocker or schedule automatic restarts. The user explicitly accepts an overnight stall.

Verify terminal automatic release after every manifest; retain reports, snapshots and database volumes. Do not globally prune Docker, resume historical experiments or kill unrelated services. Stop early for insufficient remaining time, exhausted usage, unavailable delegation, unstable source or evidence loss; do not promise uninterrupted execution through host shutdown or limits.

## Standalone task start prompt

Use this only when the user chooses to start the night:

> Act as Astra, command center for the MMO Idle bot campaign. Read CLAUDE.md, docs/briefs/bot-balance-campaign-state.md and docs/briefs/bot-balance-autonomous-night-plan.md in C:/Users/osaif/Documents/Claude/Projects/MMO idle. Execute the approved overnight plan within its eight-hour,20-case,four-packet ceilings, starting the clock now. You own analysis, source-based theorycrafting, bot preparation and interpretation; delegate frozen operator packets to Luna subagents with minimal essential context. Wait for their completion instead of routinely supervising their logs yourself. Review each result before choosing the next packet. Apply no gameplay balance changes; record evidence-backed proposals only. Stop safely for blockers requiring my input, preserve artifacts and verify network release. Leave a concise morning handoff and update the campaign and strategy documents. Do not launch overlapping operators or silently replace Luna with Astra for long runtime supervision.

This document is a session plan, not a ready-to-run frozen experiment packet. Templates, exact new arms and source freeze are intentionally completed during the authorized night after the initial evidence audit. No task or operator was created while preparing it.
