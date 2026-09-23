# T4 overnight closing pass 01 — Astra preparation / Luna execution

**Experiment ID:** `t4-overnight-closing-pass-01`  
**Purpose:** finish the playtest's broad class assessment using credible, path-specific builds on the corrected gameplay baseline, then propose a limited outlier patch for designer approval. This is not an exhaustive search for optimal equipment or a new combat-validation campaign.

**Assignment:** Astra prepares; Luna executes one sealed queue and publishes; the designer and command center approve the subsequent numerical patch. This document authorizes preparation, not a claim that a runnable packet exists or that combat has started.

**Allocation:** **432 primary observations** = 54 specializations × 4 encounter contexts × 2 seeds. Up to **32 additional, predeclared setup observations** are permitted under section 5. **464 fresh observations maximum.** No automatic tuning, adaptive rescue builds, extra seeds, reruns, or replacement Wasteland fight.

## 1. Decisions and finish line

The designer wants a final useful overnight class screen, not perfect balance. Use it to identify grossly weak or strong paths and credible specialization tradeoffs. After reviewing this run, propose the small patch that the evidence supports, run focused regression after approval, and close the class pass for this playtest. The subsequent item/ability/stance/Rune/rite review is a shallow outlier triage, not a prerequisite to proving every class optimal.

Broad coverage is authorized; indiscriminate numerical changes are not. There is no quota of buffs or nerfs, and no requirement that all paths survive every encounter. A new numerical proposal must identify the responsible production field(s), current and proposed values, inheritance scope, reasoning, expected benefit, and risk. Do not infer a nerf percentage directly from a kills-per-minute gap.

**Wasteland boss remains excluded.** Its deliberately extreme AoE/resurrection design is being revised. Do not run it, audit its corpse behavior, prescribe class buffs to pass it, or use its old win rate as a class-closure gate. Existing Wasteland items/mastery remain available where legitimately earned. Do not replace it with another exceptional boss such as Trench.

**The ask-first rule remains active.** Existing designer guidance and the bounded construction choices below are permission to prepare, not permission to solve every subsequent failure independently. When a materially weak package might reflect setup, send its exact gear, upgrades, abilities, stance, rules, budget and observed symptom, and ask what the designer would choose and why. Batch substantive questions before launch. During the overnight run, leave newly unexplained cases for the morning; do not awaken an autonomous build-search loop. A gameplay death continues the approved queue.

**Important pending build question:** Idolwright's weak Tundra package already has a designer-advice request. Do not silently declare a new optimal rescue. Section 4 proposes a direction for review; get that answer before sealing its revised primary and optional contrast. Preparation of other identities can proceed. If the designer is unavailable, retain the last explicitly accepted Idolwright package as a labelled limited reference, mark its new-build decision unresolved, and make no numerical weakness verdict from that limitation. Do not silently remove the identity or grant an unapproved rescue.

## 2. What the latest report established — and what it did not

Source: `corrected-baseline-followup-01/run-01/REPORT.md`, measured at **`22a349bf7dab6e42a412a231444fa4b8df41f28e`**.

- All 32 observations completed; there were no operational failures. All eight Conduit Mountain boss cases succeeded, all eight T4 Conduit Tundra cases reached ten minutes, and all four T1 Conduit cases reached twenty minutes. Volcano had eleven deaths and one ten-minute survivor.
- T1 Plains Conduit completed **228/225 kills**, versus **202/204** historically. Sweep delivery and secondary damage were recorded. T1 Cave remained **52/54**, and had **no offensive Technique**. Its equality does not test the corrected targeted-cast toolkit.
- T4 Conduit Mountain times were unchanged: Ritualist **293.3 s**, Iconoclast **245.7 s**, Idolwright **111.7 s**, Champion **109.4 s**. The repeated seed-labelled boss results are not independent robustness samples. These restrained offensive packages are not an exhaustive assessment of the corrected ability kit.
- Idolwright's Tundra work improved to **6/8 kills in ten minutes** from **4/1**, but remains low. Its inherited package is Deathfang Rapier, Mountain armor/charm/boots, Survivalist, Colossus Heart, Defensive, Expose Weakness, Second Wind/Brace/Cleanse/Break Free, and the existing movement/recovery rules.
- Volcano's sole survivor, Duelist seed101033, recorded **35 kills at five minutes and 35 at ten minutes**. That is zero additional completed kills in the last five minutes, not proof of productive sustained farming. The existing data must distinguish waiting, fighting a durable target, target acquisition, or other stalled work where possible; do not infer a cause solely from the endpoints.
- Volcano's twelve rows retained 202 recovery intervals, 155 interrupted by the next pull. Causes of death mixed ranged, melee and DoT damage; no hazard-attributed terminal was recorded. Sampled no-target time is not proof of full disengagement or adequate cooling. A dedicated stack-loss event is not required merely to acknowledge those limitations.

The old T4 screen used common Defensive posture and Mountain supports, with 1–14 RP unused and single-target references often limited to Expose Weakness. That was a declared fixed-package comparison. **Do not just duplicate it for longer and call this a closing class pass.** This new experiment changes the question to credible whole builds, and historical changes in work cannot be attributed solely to class coefficients.

## 3. Source, progression, fixtures and caps

### One committed gameplay baseline

Latest remote `develop` inspected for this handoff: **`5b81ddf5f5ed1099ea9e282ed4b9eb9946fc20eb`**. Latest follow-up measurement: `22a349bf…`. Use the intended committed successor containing the accepted fixes, after a bounded diff check. Record the actual execution SHA, not just either reference above. Import needed bench support without restoring old gameplay modules. Preserve uncommitted work and never reset another agent's checkout.

Keep these existing changes exactly once: the adopted Light/Balanced Spirit four-field reduction; corrected Conduit default engagement, targeted summon casts, temporary haste and Champion exception; empowered weapon-reservoir contribution; movement-only Hamstring; uncapped/soft-scaled Heat and 2× out-of-combat cooling. Keep no-frame Conduit at the existing **3,500 ms** base and retain framed R2. Do not import the rejected 2,500 ms no-frame candidate or invent another Heat treatment.

The newer Wasteland corpse-lifetime commit is not authority to reopen Wasteland testing. Record any shared-code implications in provenance, without making boss-specific work a prerequisite. Presentation-only changes do not demand a general combat replay.

No numerical gameplay edits during the night. If preparation discovers a definite correctness blocker, preserve it and ask about the affected scope; no silent repair midway through a sealed run. Common support/recording edits must be identical for comparisons and must not alter gameplay.

### Established T4 checkpoint — not entry, not maximum gear

Use the established **GM148 / 45 RP / ordinary +4 / core and relic +0** checkpoint. Mastery:

| Biome | Mastery |
|---|---:|
| Plains / Forest | 12 / 12 |
| Swamp / Cave | 18 / 18 |
| Mountain | 24 |
| Jungle / Desert | 18 / 18 |
| Volcano / Tundra | 12 / 12 |
| Wasteland (`graveyard`) / Trench | 4 / 0 |

This sums to 148. Use production gate and reservation calculations, actual per-slot upgrade support, and lawful assumed prior purchases/seals from the accepted T4 snapshot. It is not an affordability/time-to-acquire experiment. No +5, hidden extra RP, Trench gear, or Powering Up stance at Trench0. Equilibrium and Colossus are eligible through Mountain24; Hastebound is eligible through the established Volcano progress, not a mandatory replacement for every relic. Specialized stances still pay their own attunement and rule costs.

Per case record class nodes/range, mastery, exact gear IDs/upgrades, core/relic, learned and attuned abilities, stance destinations, ordered Rune rules, rites, RP used/free, and resulting stats. Do not normalize Attack, HP or Recovery across paths, and do not recalculate a class's tier from the zero-indexed node name incorrectly.

### Primary matrix

| Context | Fixture | Role and intended strategy | Cap |
|---|---|---|---:|
| V | `node-t4-volcanic-01` | Swarm farming: useful AoE, appropriate plating/mitigation, sustained recovery, hazard avoidance and timely clearing under Heat | **1,200,000 ms** |
| T | `node-t4-tundra-01` | Sparse elite farming: single-target delivery, control/kiting or durable engagement, suitable burst response | **1,200,000 ms** |
| D | `node-t4-desert-03` | Bonded controller/dealer pressure: legal early targeting/separation, Cleanse and appropriate movement/mitigation | **1,200,000 ms** |
| M | `node-t4-mountain-dungeon` / `iron-crest-titan` | Boss output with the actual T4 charge/impact/fault-line response | **300,000 ms** |

Resolve these existing node IDs in the production data before sealing; an unavailable fixture is a concrete preparation conflict, not permission for an invented substitute. Wasteland, Trench and additional bosses are outside scope.

Seeds **101009 and 101033**, **100 ms World steps**. All farming endpoints come from one continuous life at **300,000 / 600,000 / 1,200,000 ms**. First owner death stops; bosses also stop at an authoritative kill, with simultaneous outcomes retained. Never revive, refill, reset target state, pause simulation between endpoints, or extend an individual cap after inspecting results.

Use the native initial class/formation/energy state and the accepted measured boss initialization. Do not precharge a particular class for an unmeasured interval. Native preparation Runes may act during the measured life. Fixed ownership/mastery; no mid-run shopping or leveling into a new package.

## 4. Build preparation: expressive packages, not exhaustive optimization

### Construction method

Reuse the 54 production IDs and existing legal snapshot/runner. Make **three role templates per identity** where appropriate: swarm, controlled elite/pair farming, and boss. Apply small declared biome-specific support changes. The four contexts yield 216 primary identity/context packages; do not perform 216 independent theorycrafting projects.

Inspect defining effects through production consumers, not tooltip text or raw Attack alone. Retain common supports among siblings where sensible; document exceptions instead of forcing inappropriate uniformity. Resolve ordinary legal selections directly from the authorized menu. Publish a compact before/after loadout diff from the old screen, especially where a reference previously omitted its relevant offense.

There is no obligation to spend 45/45. There **is** an obligation to explain a large unused budget when an obvious, eligible and useful ability from the approved menu could exercise the path. A cast-oriented core with no useful cast should not be kept on a single-target reference by accident. Do not add all Guards first and fit the actual class payoff into the remainder. Equally, do not remove intended counterplay merely to maximize a damage score.

### Encounter support menus from designer guidance

**Volcano:** paid, useful AoE and practical recovery; plating-oriented protection, with Mountain or legal Volcanic armor selected for actual mechanics rather than a universal armor template. Volcanic kill-recovery charm is an established swarm candidate; preserve Mountain/barrier support where intrinsic to a particular package or preferred by the designer. Swamp recovery remains a lawful alternative. Retain Cleanse where useful against the present DoTs and Avoid Hazards; neither is labelled a Heat cleanse. Defensive, Offensive or a specifically justified eligible posture is allowed. Do not automatically force Defensive onto all 54 paths.

**Tundra:** single-target offense and native ranged control (Hamstring/Binding where useful), existing kiting, owner sustain and burst defense. Desert kiting boots, Mountain melee approach boots, and Swamp slow-resistance boots are authorized role choices. Slow resistance is not root immunity. Avoid relying on the previously reported moving-stack persistence of Tundra armor unless the designer has explicitly accepted the corrected behavior. Do not redesign that armor here.

**Desert:** the GM148 character can legitimately own Focus Lowest HP from the opening. Use dealer-first targeting where it fits, or the already-described ranged separation strategy. Cleanse, correct boots and meaningful DPS are part of the answer. Tanking melee can use Mountain armor and Brace. Do not force a targeting policy onto paths for which the existing designer-backed alternative makes more sense. No scripted knowledge of dealer IDs, forced kill order, free Rune, or midpoint unlock.

**Mountain boss:** preserve the established T4 script and supported telegraph movement. Use single-target offense that actually fits the path. Brace/Endure are legitimate tanking tools, not proof of survival just because they are attuned. Do not copy a T3 charge timing rule into T4 without reading its semantics. No hardcoded clock-to-boss-attack policy that a player cannot author.

### Root and mechanism menus

- **Striker:** choose cadence-supporting weapons for regular-hit paths, actual on-hit support for Shockblade, and an appropriate empowered/Attack payload for Heavy paths. Eruption Lash, Plague Axe and the eligible empowered maul are candidates alongside Deathfang; no rule that every Striker must use the same speed. Frenzy is a credible offense; use Sweep or a suitable heavy cast for swarms and a useful single-target tool for elites. A faster weapon is not automatically better because of its name.
- **Squire:** empowered Mountain weapon is the default for execution-focused paths. Power Strike belongs in a cast-oriented single-target package where its payoff justifies the commitment; Slam belongs where enough targets make its AoE useful. Arcanist is justified by actual useful Technique contribution, not simply by Squire's name. Devout Priest is the on-hit/channel exception. Do not interrupt its channel needlessly to fire weaker automatic casts.
- **Apprentice:** preserve the designer's medium-weapon direction for Light/Balanced and genuinely heavy options for Heavy, except when a specific path mechanic warrants an explicit exception. Avoid unusable maximum-stack conditions on auto-consuming/uncapped paths. Swarm options include appropriate Contagion/Sweep; a timed Detonate is not universally beneficial and must not erase a path's own stack payoff. Account for casting opportunity cost and native payload presence. Do not put every slow Heavy path on the very slowest weapon without explaining cadence/stack maintenance.
- **Slinger:** on-hit weapons are established candidates for relevant paths; high-Attack Sniper is an exception. Quick Strike/Frenzy can be useful when the actual adapter supports them. Melter must not be forced into an ordinary-magazine assumption or interrupt its sustained beam for a low-value cast. Jungle evasion armor is an eligible designer-backed option, not assumed globally best. Compare its safety cost with any stronger support.
- **Conduit:** use the corrected toolkit. Appropriate candidates include medium axe for formation Attack, on-hit for Light/secondary-effect paths, and a heavier weapon where plating or a path's payload justifies it. Give an actual useful offensive Technique or buff to elite/boss references rather than testing Expose alone again. Frenzy now reaches summon timing; cast Techniques can use one eligible summon while other bodies work; armed techniques use one normalized formation budget. Charge is a possible legal delivery tool, not compulsory. Self-Guards retain owner triggers. Champion is owner-attacking, not a proxy for every formation. Do not assume additional bodies multiply all procs at full value.
- **Spirit:** retain the adopted frame nerf. Fast-energy, on-hit, repeat-empowered, high-Attack, and persistent-DoT paths need different weapons; the largest single hit is not automatically the best cycle. Use Mountain barrier/Guard supports where appropriate. Stormbringer's four sequential strikes, Surge's charge-to-buff cycle and Tempest's hit-based storm extension deserve particular attention to real attack opportunities. No additional root-wide Spirit nerf or Heavy buff before results.

### Cores, relics, stances and rules

Tempered is the designer's fallback when no clear eligible interaction supports a specialist. Use Arcanist, Accelerant, Catalyst, Duelist, Bruiser or Survivalist only with a stated mechanism; do not rank from an unvalidated estimator. Relics trade frequency/potency/reconstruction and are not free multipliers. In particular, examine whether Colossus aggravates a one-body formation's downtime or a slow path's cycle.

Keep the existing Find Enemies, relevant recovery and hazard avoidance. No generic low-HP Flee unless the designer explicitly revises that decision. Channel/standing paths should not receive incidental Orbit that defeats their payoff. Actual danger avoidance remains meaningful; it is not removed merely to inflate a channel's output.

A small, existing stance automation (for example empowered-ready -> Time to Strike on a genuinely empowered path, or low-target-HP -> Execute with paid attunement) is allowed when it is essential to expressing the proposed role and already supported. Do not start a stance optimization grid. Keep the base/destination cost and fallback behavior explicit; a permanent Time to Strike stance can impose a real ordinary-hit cost. Powering Up is unavailable at Trench0.

**Wait It Out remains a separate approval choice**, not a silent addition. Its availability does not prove the designer's intended behavior was manually confirmed. Do not mix an unreviewed waiting policy into all Volcano primaries or declare it a rescue for uninterrupted combat. The permitted overnight default leaves it out. A later approved bounded waiting comparison would replace part of the setup allowance, not create extra allocation.

### Priority designer advice: Idolwright

Known weak package: Deathfang + Mountain armor/charm/boots + Survivalist + Colossus + Defensive, with Expose-only offense and the inherited movement/recovery policy. At this checkpoint it survived but completed just 6/8 Tundra kills; Mountain remained 111.7 s.

**Proposal for review, not an adopted winner:** start from the designer's medium-axe direction with a useful summon-delivered single-target Technique/Frenzy where affordable, and consider Equilibrium rather than Colossus to avoid automatically compounding its existing reconstruction slowdown. Keep actual durable support. Ask whether that is the intended Idolwright setup, or which weapon/relic/Technique combination the designer would prefer and why. Do not test an arbitrary altered package until the answer or express permission is provided. Both retained-reference and unresolved status must remain visible if the answer is unavailable.

## 5. Bounded alternatives: at most eight, selected before combat

The main job is one credible build per path/context. A small contrast allowance is useful for cases already suspected to be limited by setup; it is not permission to search until a path passes.

**Eligible priority identities:** Idolwright, Ritualist, Stormbringer, Surge, Tempest, Icebreaker, Melter, Reverb. At most **one alternative per identity**, evaluated in **Tundra and Mountain**, on the same two seeds: 8 × 2 × 2 = **32 extra lives**. The primary observations are the controls; do not duplicate them.

Prefer one clear equipment/core/relic/timing choice: e.g. a faster versus heavy weapon, a reconstruction/frequency versus potency relic, or a core that fits the actual offense. Declare the exact unchanged fields within each pair. A whole-kit comparison is allowed only when explicitly designer-approved and labelled as such; do not claim it isolates a stat. No selection after viewing the new results. No added variant merely because a primary died.

The preparer resolves exact alternatives with the designer's existing guidance and batches any material unapproved conflict before launch. Omit an unsupported alternative rather than inventing it or spending the allocation elsewhere. Primary coverage must not depend on having all eight alternatives. Record the final count; **432–464 is the intended allocation, not a hidden commitment to fill every optional row**.

## 6. Overnight execution without an open-ended loop

Reuse the accepted one-worker farm/boss dispatcher and existing qualification machinery. Do not write a new simulator, balance estimator, or general experiment framework. Verify legal construction and the actual child path in the final execution checkout; freeze it once. No unallocated combat pilot. The first scheduled observation counts as part of the run and continues automatically when valid.

The designer's approximate eight-hour unattended window is a resource envelope, **not a promise about wall time or a demand to keep consuming compute**. Fast simulation means twenty simulated minutes is not twenty wall minutes. Record actual elapsed compute time and completed coverage. If the fixed queue finishes earlier, publish and stop; do not sleep artificially, add repeats, or create a second experiment to fill the night.

Prepare a documented soft scheduling deadline of about eight wall hours from launch using existing runner facilities or a minimal scheduling guard: finish the active observation, then preserve an honest partial report rather than start another. Do not invent a verified command-line flag in the runbook; only provide commands actually supported and checked by the preparation. If no deadline is used by designer choice, the queue still stops at its sealed case count.

Order: primary coverage before optional alternatives; root/frame/path/context interleaving, with at least one useful pass through every path before concentrating resources. Prioritize the first seed's broad coverage, then the second, while keeping sibling and paired identity/context interpretation straightforward. Optional variants are a separately identified tail. Seal the order and resource limits before launch. Do not use outcomes to reorder it.

Reuse established resource limits: one child, 5 GiB disk floor, 1 GiB host free memory, 2 GiB child RSS, 5-second supervision polling and the existing advancing-heartbeat bound. A valid gameplay death continues. Shared source or qualification failure stops affected work, preserves outputs and reports the specific blocker; it is not an invitation to repair and silently replay a life.

Bulky raw JSONL remains external. Only enough retrospective trace review to explain the chosen outliers is needed; no per-tick model narration, full-repository test repair or manual interpretation after every case. The user is not required to supervise the night.

## 7. Measures: productive survival and useful boss progress

For each farm report lifetime survival/time and completed work, cumulative endpoint kills, and **per-life** 0–5, 5–10 and 10–20-minute rates. Post-death endpoints are null, not zero. A measured 35 -> 35 is a real zero-kill interval, but still needs HP-progress/engagement context before being called a navigation bug. Include first-kill delay, useful HP damage versus absorption, unfinished targets, prolonged no-progress periods, owner HP and barrier separately, actual relevant enemy exposure, and available recovery/waiting observations.

Report survival and throughput separately. A very fast short life followed by death is not a sustainable farming winner; a capped life with negligible work is not a healthy clear. Do not pool different fixtures, unequal sample counts or only survivors into a universal class ranking. Endpoints from one life are not independent repetitions.

For bosses, retain authoritative kill/time, HP progress if unsuccessful, owner danger, and actual opportunity/delivery of the relevant encounter response. Two identical seed-labelled outcomes are duplicate scenario evidence, not independent robustness. No synthetic target-HP inflation, cooldown reset or boss-mechanic removal to make ranking cleaner.

For Conduit, record actual learned/attuned tools, default versus Rune firing, owner versus summon delivery, cast interruptions, formation availability and HP payments. More activations do not prove more useful damage. The available formation fraction is not a direct DPS multiplier. Distinguish losing the only active body from being unable to afford replacement; no numerical attribution from a payment total alone.

For Volcano, record Heat and engagement trajectories where already available, whether recovery completes or is interrupted, and whether damage is direct, DoT, or hazard. Do not assert cooling caused improvement/worsening from a changed route. Missing exact stack-loss events narrow inference but do not prevent a package/encounter decision. Wait It Out is not implied by an empty target slot.

Path-expression evidence should be compact: the intended mechanic had a realistic opportunity; it was observed where instrumentation supports it; it contributed useful work or failed to do so. The absence of bespoke instrumentation for one passive is not an excuse to add a telemetry project or label all its observations uninformative.

## 8. Required morning deliverables — decisions, not another preparation request

### Main report

One readable `REPORT.md` with a compact 54-path × four-context map, per-seed outcomes, gear/checkpoint and source, role-specific notable strengths/weaknesses, explicit exception cases, and comparisons to prior reports with their distinct sources/packages. Preserve the old fixed-package evidence; changed kits are new packages, not isolated class treatments.

For every path assign a provisional disposition: **leave unchanged**, **credible niche/tradeoff**, **buff candidate**, **nerf candidate**, **setup advice needed**, or **implementation issue**. This is a playtest decision register, not a statistical certification. Every path gets a line; no permanent "needs more data" default.

### Outlier patch proposal

Provide at most **eight priority adjustment proposals**, fewer when supported. Several paths can share a proposal only when the same underlying mechanism really connects them. Include:

- Exact stable path ID, file/key, current value, proposed value and scope; read actual consumers, do not repeat stale comments.
- Within-context evidence from credible packages, sibling/reference comparisons, and available exposure explanation; preserve counterexamples.
- Why this is class/path balance rather than bad equipment, missing counterplay, a broken ability, or intentionally exceptional content.
- Expected tradeoff and a focused regression case. Avoid a uniform percentage applied to every class or a forced match to Melter's peak.
- Explicit labels: **new numerical candidate, untested** versus **previously tested** versus **already adopted**. No change is automatically approved merely because it appears in this report.

Prefer T4-local fields for genuinely T4-local issues. Do not weaken T1 or every frame to adjust one T4 path. Check threshold/cadence directions: less energy per hit does not normally mean an earlier discharge. Proposed reconstruction changes must consider payment and owner risk, not just body uptime.

An agent may generate a clearly unmerged proposed diff after analysis for review, but it must not edit the measured checkout or execute it. Separate independent candidate changes so the designer can approve them selectively. Do not self-approve new treatments during the night.

### Encounter and holdover register

Volcano is a separate shared-pressure watch item. If many credible full packages still fail, propose a bounded encounter/entry correction or a concrete designer decision—not buffs to 40 unrelated classes. Do not mandate a universal waiting rule as the only way out. Wasteland remains excluded. T2 Plains opening, T3 Jungle/Volcano entry, and T3 Apprentice's Volcano finisher remain explicitly accepted/deferred/pending items; tonight neither tests nor silently clears them. No additional T1–T3 campaign is hidden here.

### Stop after the report

Return a morning decision bundle supporting: (1) a limited approved outlier patch, (2) approximately **24–48 focused before/after or inherited-regression lives** to be separately assigned, and (3) class-pass closure for the playtest with recorded residual risks. That small confirmation is a future proposal, not an automatic second execution tonight. Uncertain minor matchups may be deferred by the designer; genuine broken progression or nonfunctional class mechanics require explicit disposition.

## 9. Responsibilities and publication

**Astra:** reuse the current catalogue and runner, prepare expressive lawful packages under the approved menus, resolve the bounded designer questions, freeze source and all arms, qualify from the final execution path, and provide `LUNA_RUN.md` with exact verified commands and paths. Commit/push scoped preparation. No main balance combat or numerical patch adoption during preparation.

**Luna:** run once, supervise operational limits and any deadline, preserve every outcome, and produce the readable report, compact `results-summary.json`, applied-build/source/manifest/completion receipts, per-path disposition and `PATCH_PROPOSALS.md`. Preserve an external raw inventory. Compare equal windows accurately; record partial coverage rather than concealing skipped rows.

**Commit AND push the report and compact evidence; verify remote ref and report retrieval.** Suggested destination: `reports/player-fast-pass/t4-overnight-closing-pass-01/run-01/`; suggested publication branch: `codex/t4-overnight-closing-pass-01-packet`. These are new intended locations, not claims that they exist. Keep publication separate from the frozen executable checkout. Return the measured SHA, publication SHA, branch, report path, planned/primary/alternative/completed/gameplay-dead/failed/omitted/not-run counts and actual wall time.

Publication failure is not a reason to rerun combat. No force-push, deployment, release action, automatic patch merge, or modification of previous reports.

## 10. Reference index

- Current uploaded `REPORT.md`: corrected-baseline-followup-01 / run-01, execution `22a349bf7dab6e42a412a231444fa4b8df41f28e`.
- Corrected follow-up run bundle at `reports/player-fast-pass/corrected-baseline-followup-01/run-01/` and its preparation bundle: resolve the existing publication branch and reuse its receipts/source identity rather than guessing local raw paths.
- T4 specialization screen report, preparation, `t4SpecializationSpec.ts` and dispatcher at execution `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`; publication `185b22bc136e30c33f16be9dc61f753dc5fe5566`. Its Wasteland outcomes are excluded by the later designer decision.
- At reviewed `5b81ddf…`: `shared/src/data/skillTree/{t3CombatA,t3CombatB,t3Summoner}.ts`, `shared/src/data/summoner.ts`, ability/rune/stance and recipe catalogues, and their production consumers.
- Original approved Spirit patch / adoption: `e47c48f9…` / `d073dc19…`; no-frame Conduit candidate remained rejected.
- Designer's biome strategies, T1 axe-first observation, T2 mitigation-first Desert entry, T3 equipment/ability guidance, and Wasteland exclusion remain intent inputs, not measured universal item rankings.

### 54-path coverage checklist

The old source calls player-facing T4 specialization IDs `t3-*`; retain those stable IDs. Reconcile against production if a subsequent committed roster change exists rather than inventing/removing identities.

| Root | Frame | Path A | Path B | Path C |
|---|---|---|---|---|
| Striker (`cadence`) | Light | Shockblade | Scrapper | Swiftblade |
| Striker (`cadence`) | Balanced | Maestro | Wavecrest | Justicar |
| Striker (`cadence`) | Heavy | Berserker | Hemomancer | Juggernaut |
| Squire (`cooldown`) | Light | Assassin | Transcendant | Sunderer |
| Squire (`cooldown`) | Balanced | Reverb | Dynamo | Stalwart |
| Squire (`cooldown`) | Heavy | Avenger | Destroyer | Devout Priest |
| Apprentice (`dot`) | Light | Venomslinger | Cultist | Zealot |
| Apprentice (`dot`) | Balanced | Pyromancer | Firebrand | Cinder Lord |
| Apprentice (`dot`) | Heavy | Icebreaker | Winter Warden | Wind Spirit |
| Slinger (`reload`) | Light | Duelist | Desperado | Sniper |
| Slinger (`reload`) | Balanced | Bounty hunter | Blunderbuss | Dualslinger |
| Slinger (`reload`) | Heavy | Melter | Warmonger | Cannoneer |
| Conduit (`summoner`) | Light | Inquisitor | Kilnmaster | Iconoclast |
| Conduit (`summoner`) | Balanced | Marshal | Chorister | Ritualist |
| Conduit (`summoner`) | Heavy | Covenanter | Champion | Idolwright |
| Spirit (`energy`) | Light | Stormdancer | Surge | Channeler |
| Spirit (`energy`) | Balanced | Equinox | Stormbringer | Aetherist |
| Spirit (`energy`) | Heavy | Voidwalker | Invoker | Tempest |

Default range follows established close Striker/Squire and mid Apprentice/Slinger/Conduit/Spirit guidance, with known close exceptions for Blunderbuss and Champion and explicit stationary/channel policies. A further range change must be a named designer-approved package choice, not another cross-product.

**Finish line: one broad corrected-kit T4 pass, one limited outlier-patch decision, one focused confirmation, then move on to the shallow subsystem pass.**
