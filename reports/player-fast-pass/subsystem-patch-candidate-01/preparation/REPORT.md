# Subsystem patch candidate 01 — preparation

Preparation complete: **24/24 zero-tick qualifications and 24/24 identical receipt replays passed**, with **zero fresh combat observations**. The four-part candidate is implemented on an isolated experiment branch. The 24-cell combined regression is reserved and has not run. This report does not recommend adopting numerical changes before the regression results exist. No experiment candidate has been merged into develop or deployed.

## Source boundary

At the user's explicit follow-up request, pending repository changes were committed as `9b974bc5`, and the Heat correctness closeout branch through `27817f39` was merged into develop. The resulting starting baseline `2930d58fdd008329027e93be8564669bed461452` was pushed and verified against origin/develop. Its Git tree is `e552634994299644d1b81d306c1c6302a41c342d`. HUD and Heat focused checks, all-package typecheck and the full build passed at that baseline.

The experiment adds common benchmark support in `aef86952` and `48951beb`. Baseline execution source is `48951bebb60400fc5a6a420f46fe96bb5cb2f546`, tree `8625e38c2d1f222596e61b2b6ccfebf22a06367c`. These commits add a fixed case manifest, retained historical references and a two-source dispatcher, and route the existing survey to the new cases and correct endpoint intervals. They contain no production gameplay changes from develop.

Combined candidate source is `fa72a310be573d167474f36b393edb38e747398d`, tree `209a6c855155d127e6018d78843937daec488dd7`. Retirement commits are `d8b1096a` and `b29d8d1a` (reviewed copies of the prior unmerged proposal); numerical changes and additional compatibility/evolution checks are in `fa72a310`. `source-receipt.json` records complete identities and changed-file lists; `candidate.diff` is the exact candidate versus control diff. File-byte SHA-256 identities also appear in the copied packet receipts.

## Candidate changes

- Desert boots: T2/T3/T4 kiting bonuses are 20%/25%/30%. Flat speed, upgrades, acquisition and economy fields are unchanged.
- Swamp boots: the resistance curve below uses the original completed-item targets. It remains slow resistance, without changes to root or hard-control resistance.
- Arcanist Core: Technique Power rises from 20% to 30%; Technique cooldown reduction remains 20%. No other core property changes.
- Blood Offering: remove active definition and recipe, reject stale acquisition/equip requests, preserve known acquisition identity in legacy saves, normalize it out of equipped saves, exclude it from RP cost, and remove its kill-healing listener. The legacy `hunters-instinct` alias is handled. No refunds or replacement Rite.

| Swamp tier | Base | +1 | +2 | +3 | +4 | +5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | .25 | .28 | .31 | .34 | .37 | .40 |
| T2 | .40 | .42 | .44 | .46 | .48 | .50 |
| T3 | .50 | .52 | .54 | .56 | .58 | .60 |

Evolution consumes the completed predecessor and does not transfer upgrades. The proposed T1 +5 → T2 base and T2 +5 → T3 base transitions therefore preserve .40 and .50 resistance. The real equipped-evolution test verifies passive recalculation and nondecreasing flat speed. The lineage still ends at T3; a T4 successor remains a future design question.

UI audit: `RitesPanel` resolves known IDs through the active Rite database and filters missing definitions. Crafting, map unlocks and gated unlocks derive from the active recipe registry. Removing both definition and recipe hides Blood Offering from those available-Rite surfaces. Its retained icon vocabulary is inert historical compatibility, not an available Rite. No browser or live-player verification was performed.

## Fixed regression packet

24 fresh observations maximum, two seeds (101009 and 101033), two source arms, one worker, 100 ms ticks, 600,000 ms cap and 300,000/600,000 ms endpoints. First owner death ends the observation; subsequent endpoints stay null. No extra Tempered, ability-choice, Rite-choice, T4 Swamp, pilot, recovery, or adaptive arm is included.

| Block | Packages | Observations |
| --- | --- | ---: |
| A | Prior Arcanist Reverb and Idolwright | 8 |
| B | Prior `desert-ranger` (Slinger light-a/Duelist) and closing Spirit light-a (Flash) | 8 |
| C | Prior T2 and T3 slow-exposure packages | 8 |

Every prior Arcanist/D/S package is copied directly from its retained baseline manifest. The additional Flash package is copied from `closing-spirit-light-a-T` in the closing T4 references, including its weapon, Desert boots, stance, abilities and Rune policy. It uses the same T4 Tundra pressure fixture as D; only its historical 20-minute observation cap is shortened to the common ten-minute cap. It is a ranged Keep Distance package (internal action `orbit`) without the channel/standing exception. The first ten minutes contain 328/600 and 257/600 sampled `mob-kite` observations. Selection was based on required mobility exposure, not a kill ranking. `reference-inventory.json` hashes the consulted inputs and raw historical samples.

Snapshots remain T4 GM148/45 RP/+4 ordinary gear/+0 cores and relics, T2 GM70/30 RP/+4, and T3 GM102/36 RP/+3. Thus the actual tested Swamp candidate values are .48 at T2 +4 and .56 at T3 +3; the +5 targets are verified separately without changing historical builds. Historical resolved builds and newly constructed receipts are retained. The older Flash receipt predates develop commit `ca90ec3f`: current source additionally grants the unequipped starter Runes `tactical-reload`, `wait-for-execution` and `wait-for-summons` in both arms. These are the only historical package-readback differences; equipped rules, costs, purchases and all other fields match. No reconstruction or receipt was silently changed. Both arms use their authored source definitions; no child-local numerical overlay is applied.

## Preparation verification

See `validation.json`, qualification completion, replay completion and resolved builds for machine-verifiable final status. The validator requires 24 zero-tick constructions, an identical 24-receipt replay from the final execution paths, exact historical equipped-package readbacks with the documented starter ownership difference, paired initial ecology, unchanged flat combat stats and only the intended passive differences. It also refuses a preparation-success claim if the reserved combat directory or launch marker already exists.

Focused `rites.test.ts` passed: load-safe legacy aliases, acquisition history preservation, removal from equipped IDs, idempotence, stale crafting/equipping rejection, zero kill healing even for an injected legacy equipped copy, full-loadout RP exclusion, and no resource refund. `equippedEvolutionAbilityTags.test.ts` passed, including both real Swamp evolutions. Candidate typecheck and full build passed; build output contains the existing Vite chunk-size warnings. `git diff --check` passed. Full-suite tests and browser/live-play were not run.

Qualification and replay are construction evidence only. Fresh combat results, survival comparisons, delivery comparisons and numerical adoption decisions remain pending.

## Required result interpretation

Use completed work at equal endpoints and owner minimum HP/damage taken. For Arcanist, count Technique starts, fires and aborts, and delivered player-source AoE HP damage from recorded events; AoE totals are not exclusive Technique attribution. Review channel/cast/summon anomalies explicitly. For mobility, use recorded kite/away-motion and slow/root samples; do not label sampled exposure as continuous uptime or invent counterfactual damage/contact gaps. Record unavailable measures as unavailable. The existing event, sample, guard, sustain and Conduit streams provide supporting evidence.

The previous 44 observations are reused as historical support, not rerun or relabeled as current combined-candidate results. Desert compression is design-directed; Swamp contrasts were mixed; Arcanist increased sampled eligible delivery but did not consistently increase completed kills. A deliberate nerf need not win, and a buff does not qualify merely by gaining kills in one seed. The four final dispositions must remain separate in `PATCH_DECISION.md`.

## Publication and execution boundary

Preparation is published on `codex/subsystem-patch-candidate-01` from `D:/spc1pub`. Frozen control, candidate and packet paths stay under `D:/mmo-idle/subsystem-patch-candidate-01`. Read `LUNA_RUN.md` for the exact later authorized execution. No combat is automatically launched by preparation or publication. No candidate merge, deployment, or additional combat is authorized by this packet.
