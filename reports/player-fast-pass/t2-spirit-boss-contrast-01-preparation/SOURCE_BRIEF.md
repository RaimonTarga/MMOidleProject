# T2 Spirit boss contrast 01 — Astra preparation brief

**Next assignment: Astra prepares the runnable packet; Luna executes it once, reports, and commits AND pushes the scoped results.** The designer approved proceeding with the five-package, two-boss comparison. This document is the command-center brief, not an executed or qualified manifest.

**Allocation: 20 fresh boss observations.** Five T2 representatives × two bosses × two seeds. Five-minute simulated cap, normal 100 ms World steps, first owner death or authoritative boss kill ends the observation. No farming rerun, weapon factorial, numerical treatment, or extra pilot campaign.

## 1. Decision to reach

Determine whether Spirit's strong mature farming performance also appears against durable single targets, and whether Heavy has the boss payoff the designer expects. Use the result to choose the scope of a possible Spirit adjustment: a shared mechanic, selected frames, a supporting interaction, or no adjustment supported yet.

The designer's hypothesis is that Heavy's slower energy accumulation and large discharges may waste damage on ordinary enemies but pay off against bosses. This is a hypothesis, not established overkill evidence. A large discharge multiplier alone does not establish sustained output. Do not begin with the conclusion that Heavy is weak, that it must be best at bosses, or that every Spirit frame needs the same nerf.

The latest farming comparison found Light and Balanced Spirit ahead of Light Slinger with either Stinger or Ruinous Axe in the tested settings. It did not isolate an energy coefficient or measure Heavy. Stop adding farming weapons to that question; this packet supplies the missing boss contrast.

**Ask before inventing:** use the designer's already-provided Forest and Mountain strategies. Routine translation into the existing boss harness and legal loadouts does not require another approval round. A substantive build conflict or unexplained failure requiring a new strategy goes back to the designer with the relevant evidence. Do not create a rescue variant, silently change a failed package, or ask the designer to repeat intent already in this brief. Valid gameplay losses do not stop other scheduled cases.

## 2. Baseline and provenance

Repository: `RaimonTarga/MMOidleProject`.

Latest measured reference: `t2-spirit-desert-followup-01/run-01`, at **`3e27da0bdecd442b0a40e2c2ab41afbf013f6fa6`**; source SHA-256 **`f1dd63a98cb1031fd3c0005e7621bf18862f30bc68f096f7469f83474929f644`**. The report was inspected at publication **`183ded66cd412d1442b53d8f82f72fcd20040632`** on `codex/t2-spirit-desert-followup-01-packet`. These are reference identities, not an assertion about a later local checkout.

Use that gameplay baseline or a deliberately reconciled intended-playtest descendant. Record the actual execution SHA and relevant differences; do not silently execute an obsolete branch or merge unrelated work. Keep movement-only Hamstring, Conduit R2, accepted session/target-inheritance behavior, and the Desert unlock correction as applicable to the chosen source. Do not reapply any treatment. Heat is source provenance only; there is no Volcano encounter or Heat tuning here.

Pin the existing valid hitbox bundle; latest reference SHA-256: **`6a75e0e8417e0936bdaffe389f1d5b73b06a78b49d163961e02cf18ecca166bf`**. Record any intentional asset change rather than labelling it identical.

Preparation may add the new case definition and narrowly necessary read-only output. It may not change class, weapon, armor, core, ability, Rune, boss, AI, or progression values. One frozen gameplay source applies to all twenty observations. Historical boss/farming rows remain contextual; none is reused as a matched control.

## 3. Fixed matrix

| Representative | Stable identity | Weapon starting point |
| --- | --- | --- |
| Spirit Light | `breadth-t2-spirit-light` | `jungle-stinger-rapier` +5 |
| Spirit Balanced | `breadth-t2-spirit-balanced` | `jungle-stinger-rapier` +5, the already measured alternative |
| Spirit Heavy | `breadth-t2-spirit-heavy` | `quake-hammer` +5 |
| Slinger Light | `breadth-t2-slinger-light` | `jungle-stinger-rapier` +5 |
| Squire Heavy | `breadth-t2-squire-heavy` | `quake-hammer` +5 |

Use actual T2 root/frame skill paths, native pre-T3 ranges and current tier-resolved abilities. Resolve display names from readbacks, not from T3/T4 labels. There is no later-tier range node, path, core or relic.

| Boss | Type ID confirmed at the reference source | Designer strategy |
| --- | --- | --- |
| Forest | `apex-timberclaw` — Apex Timberclaw | Appropriate protection against frequent attacks; enough single-target pressure to finish before the ramp overwhelms the build. |
| Mountain | `stoneplate-juggernaut` — Stoneplate Juggernaut | Keep damaging the target, avoid the charge when feasible, and use reactive mitigation because repeated misses do not make indefinite avoidance safe. |

Resolve each real dungeon node through `DUNGEON_DEFS` using `boss.bossId`, as the existing boss spec does. Do not invent a node suffix or substitute an ordinary elite. Use the existing production-backed boss encounter mode, retaining the authored boss HP, mitigation, ramp, charge/barrier sequence, collision, phases and any authored reinforcements. Do not add room-clearing travel or guardian endurance as another variable; record the harness's actual encounter boundary.

At the inspected source, Forest has repeated Bestial Frenzy and a charged swipe. Mountain's live pattern includes a non-damaging Stoneplate step, a breakable barrier, a charge and recovery. These source facts refine the existing strategy; they do not authorize an encounter redesign. In particular, breaking the plate is a legitimate outcome, not evidence that the charge was missing.

**Seeds:** `101009` and `101021`. Five representatives × two bosses × two seeds = **20**. One package per identity per boss, repeated unchanged across seeds. No second weapon, stance or defensive arm. Freeze the ledger before execution; interleave bosses/identities and reverse identity order in the second seed block. Changing a seed label alone is not RNG variation; record the actual seeded initial encounter identity. Identical deterministic outcomes remain identical outcomes, not an invitation to find a more interesting seed.

## 4. Packages — reuse established choices, not an optimization search

Retain mature synthetic T2 mastery: returning biomes at 12, Jungle/Desert at 6, GM72 and the production-resolved 30-RP budget. Ordinary weapon/armor/charm/boots are +5 where structurally supported; Tempered Core is +0; relic and rites are empty. Starting owner HP and legitimate barrier are full.

These are developed class-capability tests, **not first Jungle/Desert entry or progression tests**. The previously identified +3/+4 and RP entry constraints remain valid but are not additional treatments here.

Use the weapons above, **Tempered throughout**, and **Offensive Stance throughout** as the default boss reference. In particular, do not copy Heavy Spirit's Defensive farming stance into this boss comparison merely because the frame is Heavy. Its slower charge/bigger discharge tradeoff should not be entangled with a uniquely defensive posture by accident.

Reuse the following already-used support families; Astra resolves the complete receipts and logs the limited farming-to-boss changes:

| Support | Spirit Light / Balanced / Heavy | Slinger Light | Squire Heavy |
| --- | --- | --- | --- |
| Forest armor / charm | Mountain / Mountain, retaining the designer's Spirit support | Jungle / Swamp, retaining the established Slinger reference | Plains / Swamp, retaining the established plating reference |
| Mountain armor / charm | Mountain / Mountain | Mountain / Mountain | Mountain / Mountain |
| Boots in both fights | Desert for native ranged kiting | Desert for native ranged kiting | Mountain for melee approach |

All three Spirit frames share supporting equipment within each boss. Mountain gives the Spirit/Slinger comparison a common support context; Forest deliberately retains established class-specific armor choices and is a practical-package comparison, not a pure root coefficient comparison. The boots follow the designer's existing ranged/melee guidance; anti-overpull Cave boots are not needed simply because the boss is in Mountain.

**Technique:** Power Strike for all five, using native delivery and timing. This is an established single-target option, not a new Technique search. No Frenzy, Quick Strike, Detonate, Time to Strike, Execute experiment, or extra empowered-timing variation.

**Guards:** Second Wind and Brace, following the existing T2 boss package rather than copying all three Guards from farming. Cleanse is not an automatic extra in this packet; neither is Endure. The inspected existing T2 boss reference already uses Second Wind/Brace and a reactive Brace rule. Do not remove a required countermechanic to reserve RP for an unrequested arm.

**Automation:** retain the established boss-policy components: Find Enemies; `inside-telegraph -> step-back`; `in-combat -> orbit` for the four ranged representatives; relevant Avoid Hazards and Recover First; and **`target-casting -> use-ability` with `targetAbilityId: brace`**. Use the ordinary production override behavior, not both a new private trigger and an assumed independent default. Second Wind keeps its native trigger. Preserve movement and targeting arbitration; no generic Flee, Wait It Out, or low-HP targeting search.

For Mountain, confirm from the existing production path that the reactive condition treats the non-damaging Stoneplate step as non-guardable; record Brace timing relative to actual charge impact. Do not make Brace last longer or trigger it through privileged knowledge of the future hit. Misses, shield breaks, casts canceled by normal play, and coverage gaps are legitimate outcomes. A material inability to express the agreed response is a specific designer question, not authorization for a new timing strategy.

Resolve all costs through production, including stance and the reactive Rune. Leave spare RP visible and unused. Do not increase the budget or spend remaining points to make a package look optimized. If these defaults encounter a substantive legality or mechanical-fit conflict in the selected source, explain it before sealing the affected package; do not substitute another weapon/armor/stance on outcome evidence.

### Starting charge and cooldowns

Use the boss harness's normal fresh production initialization, consistently across representatives. Record Spirit's starting energy/charge, Squire's execution readiness, ability cooldown state, owner position and boss distance. No unrecorded pre-charging on trash, free empowered opener, manual warmup, pre-damaged boss or health refill after the fight starts. Do not artificially suppress a legitimate native starting state either. Comparisons that end before a full energy cycle must say so rather than claiming steady-state superiority.

## 5. Evidence required to make the Spirit decision

Primary measures: authoritative boss kill, elapsed simulation time, first-death/cap outcome, initial and terminal boss HP and barrier, net HP fraction removed for unsuccessful attempts, owner minimum/terminal HP and barrier, and consequential mechanic exposure. Capture boss progress at 60/120/300 seconds when still running; post-terminal snapshots are null, not additional observations. Confirm kills from the established event/terminal evidence, not merely a zero-looking HP field or a cap outcome. Preserve any simultaneous terminal outcome in the raw chronology.

Report attack/Technique delivery, relevant defensive activations and coverage, Forest ramp exposure, and Mountain plate breaks/charges dodged or taken where existing records support them. Boss HP removed and barrier absorbed are separate. A shorter successful fight and a fast failed attempt must not be combined into a misleading DPS average. Two seeds are limited scenario evidence, not a reliable win-probability estimate.

**Spirit mechanism readout:** the last farming report explicitly lacked dedicated energy/discharge events. Astra should first read the real T2 root/frame and runtime energy/discharge code. Produce a short source note on energy gain, discharge trigger/consumption, multipliers, weapon/Technique/proc interactions and the protection effects that may matter. Follow implementation rather than tooltips. Calculations under fixed assumptions must be labelled as such and must not be equated to measured output.

Reuse existing data; if a small read-only observer at the actual discharge point is needed and straightforward, record starting energy, time to first discharge, landed discharge count/timing, and direct boss HP/absorption contribution when truly attributable. Keep the observer on the same code for every cell and preserve RNG consumption and execution order. Do not infer counts from a damage threshold, count a full-energy flag every tick as a discharge, or call attempted damage useful damage. If precise contribution/overkill is unavailable, say so. No general telemetry framework or separate validation campaign is required to run this packet.

This boss comparison can test Heavy's performance on sustained targets. It cannot retroactively prove how much damage it wasted in the earlier farming screen. In particular, do not invent ordinary-mob overkill measurements from a boss result.

## 6. Interpretation and next decision

Luna's report combines the twenty outcomes with the latest compact farming tables without replaying those campaigns. Distinguish complete-package performance from a pure frame effect: Heavy's Quake Hammer and Squire/Slinger adapters are intentional class-package differences. Forest's support equipment also differs between roots. A peer is a reference, not a mandated target value.

Answer:

1. Does Heavy demonstrate a meaningful boss payoff relative to its ordinary farming performance, and what charging/defensive costs are visible?
2. Do Light and Balanced Spirit retain an unusually broad advantage against the same bosses, or do peers/Heavy reveal credible tradeoffs?
3. Which actual Spirit mechanic, if any, is the narrowest supported adjustment target without erasing Heavy's role?

**Return one concrete Spirit proposal if supported:** name the exact root/frame/tier parameter or interaction, current value, proposed value, expected effect and risk to the other frames and later tiers. A proposal is not adoption. Do not choose a percentage by subtracting the farming kill-count gap. If the evidence instead supports leaving values unchanged, or cannot identify a causal parameter, give that disposition and one precise unresolved question; do not manufacture a nerf to satisfy a quota.

No numerical treatment is executed here. Bring the recommendation back to the command center for designer approval. Do not automatically run another weapon grid, nerf arm, or boss campaign. Do not reopen Desert, T3 Apprentice, Jungle exposure, T1 Conduit, entry progression, or deployment merely because they remain unresolved elsewhere.

## 7. Execution and handoff

Astra extends the accepted boss dispatcher/spec minimally. Reuse `playerBreadthSpec.ts`, `playerPackageFitSpec.ts` and `playerFastPassSpec.ts` for role selection, dungeon resolution, reactive Brace and source/readback patterns; do not copy their historical reconstruction arms, old seeds, unrelated cells, or pilot allocation.

Qualify legal packages and the exact child launcher from the final frozen execution checkout. Retain meaningful source/hitbox/runtime/applied-build checks and the working distinction between machine paths and semantic identity. Do not revive the earlier C:/D: qualification mismatch, rebuild the harness, or repair the entire test suite. Zero-tick preparation checks and focused code tests do not become new balance observations; there are no extra combat pilots. The first scheduled boss life counts as one of twenty and the accepted queue proceeds without an extra approval round.

Suggested experiment ID: **`t2-spirit-boss-contrast-01`**. Fresh packet and run roots; no overwritten prior evidence. One worker; normal 100 ms steps; **300,000 ms cap**. Stop each case at the existing authoritative first-death/boss-kill/cap boundary. No revival, retry, reseeding, boss weakening, mid-run loadout change, healing reset or cap extension. Use existing resource/heartbeat watchdogs; operational failures are not character deaths. On a shared execution/source failure, preserve the partial run and report affected/not-run cells rather than knowingly continuing invalid work. No autonomous repairs during the sealed run.

Astra supplies one short **`LUNA_RUN.md`** with exact tested verify commands and a real, unexecuted run command; a fixed ordered twenty-case manifest; ten resolved packages (one per representative/boss); execution SHA/assets; and the compact Spirit source note. Commands must match the real runner, not guessed CLI flags. Commit and push scoped preparation/handoff through the normal repository workflow. Do not launch main combat during preparation or merge unrelated branches.

Luna runs the packet once when assigned, then writes **one readable `REPORT.md`** with the full twenty-row ledger, at most five substantive findings, and at most three decisions. Publish compact `results-summary.json`, applied-build and initial-state receipts, manifest/identity/completion records, and the inventory of external raw streams. Do not commit per-tick gigabytes, credentials, player databases or unrelated files.

**Commit AND push the report and scoped compact evidence; verify the remote files exist.** Return branch, full publication SHA, measured SHA, report path, and planned/completed/new/failed/not-run counts. A publication failure is reported with its actual error and local report path; it never authorizes combat replay. A blocked run must be labelled partial/blocked, not completed. No force-push, deployment or automatic next campaign.

## Sources and status

- Designer's Forest/Mountain strategy notes, Heavy Spirit hypothesis, and approval in this conversation establish scope and intent. They are not measured winners.
- `reports/player-fast-pass/t2-spirit-desert-followup-01/run-01/REPORT.md`, measured `3e27da0b...`: latest Spirit/Slinger weapon evidence and the explicit lack of discharge attribution.
- Its preparation `PACKAGES.md` at publication `183ded66...`: established mature support, core, weapon and RP context.
- `reports/player-fast-pass/t2-multi-biome-class-01-preparation/PACKAGES.md` and `server/bench/balance/t2MultiBiomeSpec.ts`: T2 Heavy Spirit/Squire and Forest reference selections.
- `shared/src/data/monsters/bossesT2.ts`, `server/bench/balance/{playerBreadthSpec,playerPackageFitSpec,playerFastPassSpec}.ts`, read at `3e27da0b...`: current reference boss definitions and the existing boss preparation/Brace/dungeon paths. No code or tests were executed in this command-center review.

**Completion means a measured boss-role comparison and a scoped Spirit balance decision—not another definition of prerequisites for beginning class balance.**
