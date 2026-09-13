# V1j assessment and V1k selection

2026-09-13. Astra review of the [completed V1j report](bot-balance-v1j-report.md). Both manifest hashes and all six summary hashes match the report; both durable network-release receipts say released.

## Accepted observations

- Mountain: two treatment-valid Heavy Spirit wins, about 61.1 and 62.5 seconds of named-boss combat. This establishes candidate feasibility. Six discarded Step Back attempts per run, zero attributed damage and absent charge/plate telemetry do not establish which counterplay won the encounter.
- Swamp: both charm packages achieved one boss kill and one pre-kill death. The barrier loss left the boss at 1.78%; the recovery loss left 10.46%. Both killing blows were monster DoT, at three and four stacks respectively. Run-wide DoT damage exceeded direct damage in three cases, but those totals include preparation and guardians.
- The barrier win emitted a death after the named boss kill, before the attempt closed. The recovery win's snapshot still had Poison 3, incoming DoT and about 31/231 HP. Treat boss defeat and safe survival afterward as separate outcomes. Neither charm is established as the winner, and the snapshot/event discrepancies are not grounds to erase the recorded death.
- Preparation and final builds were valid in all six cases; automatic runtime release worked. These are not recurring preparation defects or a proven balance wall.

Evidence remains synthetic/prepared and 25x. Preserve false combat/economy eligibility and existing taints. Diagnostic feasibility does not become canonical evidence or a reliable win probability.

## The mechanism worth testing next

V1j varied recovery before sufficiently testing damage-type mitigation. That was an incomplete priority choice. Swamp armor is a direct candidate against the observed failure and should be tested before expanding the charm matrix.

Current [Bog Wrappings recipe](../../shared/src/data/recipes/swamp.recipes.ts), T2 +5: 81 HP, 11 plating, 42% DoT resistance, 8% hit-to-DoT conversion. Cave Vest +5 has 76 HP, 11 plating and 17% DR. The armor trade therefore changes several properties; V1k compares whole armor packages, not one isolated passive.

[Monster DoT ticking](../../server/src/systems/classes/archetypes/dot/dotPrototype.ts) bypasses plating, applies half the normal DR and then DoT resistance. With all other effects held fixed, moving from the recorded 19% DR to 2% DR plus 42% DoT resistance gives a pre-rounding tick ratio of `(1 - .02/2) * (1 - .42) / (1 - .19/2)`, about 0.634. That suggests roughly 37% lower equal-stack poison ticks, not a guaranteed 37% reduction in total fight damage. Stack timing, barriers, healing, HP and direct hits still change the outcome. The trade gives up substantial direct-hit DR.

[Hit-to-DoT](../../server/src/systems/defense/mitigation/hitToDot.ts) defers a fraction of surviving non-DoT damage; deferred damage receives DoT resistance when drained. It is not simply deleting 8% of all damage and it can leave debt after victory. A post-clear observation is particularly relevant here.

Cleanse selects the highest-stack eligible debuff, breaking ties by ID, and the T2 rank removes two stacks from one debuff. It does not continuously prevent reapplication or let the bot name a debuff to remove. [Runtime policy](../../server/src/systems/player/abilities/abilityFiring.ts). This is why mitigation can complement Cleanse rather than making it redundant.

## V1k: eight runs

| Phase | Cases | Candidate / question |
|---|---:|---|
| Swamp armor study | 4 | Cave Vest versus Bog Wrappings, two each; Bog Eye, Axe, boots, Core, Expose/SW/Cleanse and movement fixed |
| Cave coverage | 2 | Axe + Cave Vest + Mountain Charm; SW/Cleanse/Brace, no Technique; preserve movement rules |
| Desert coverage | 2 | Axe + Cave Vest + Mountain Charm; Expose/SW/Cleanse; preserve movement rules |

Bog Eye is held fixed to test a sustained-recovery package with reduced incoming poison, not because V1j proved it superior. Both Swamp arms acquire and upgrade the candidate armor while wearing the same preparation gear. Only the final armor differs; historical V1j is context, not a contemporaneous control.

Cave's actual T2 definition retains on-hit corrosion, heavy direct hits, burrow untargetability and eruption. The T1 Breach-only nerf does not apply. The first candidate prioritizes three defensive functions over Expose: remove corrosion, buffer bursts and recover. Heavy Spirit still deals damage through normal/empowered attacks. If it survives but cannot finish, examine exposure windows and damage delivery before changing boss HP.

Desert's authored mark → slow → execution sequence supports a different first candidate: Cleanse with ordinary triggering, burst buffering from the charm, movement and Expose to exploit attack windows. Mark removal does not cancel Execution, and Cleanse may be unavailable or choose another debuff. Record which effect it actually removes. No assumed guaranteed dodge or manual timing is built into this candidate.

Unused RP stays unspent in these initial cases: Cave 24/30; Swamp and Desert 26/30. A full Expose/SW/Cleanse/Brace package with these rules costs 31 and is illegal. Do not silently drop a movement/recovery rule to fit it. Hamstring and additional attack techniques remain options if observed contact or damage delivery warrants them; they are not free additions without opportunity cost.

Each successful boss attempt is followed by a bounded observation using ordinary auto behavior in the dungeon: 20 seconds of alive/auto time, capped at 60 seconds. Record every death from the named kill onward. The tail is skipped after a boss loss and never requests another boss attempt. Completing it after a respawn does not count as safe survival. This improves outcome interpretation without altering gameplay or the old routes.

## Source and next milestone

The committed change since V1j gameplay is Mountain entrance variation (`161f7632`). Concurrent uncommitted Bog Lurker drag/visual/control work exists and is excluded from the frozen image. It may matter to a later Swamp retest; do not silently mix it into this controlled comparison. Record the exact eventual source/tree and use the working host's automatic release tooling.

If V1k qualifies Cave/Desert, Jungle is the last untested T2 boss in this coverage pass. Do not require every class to defeat every boss before T3. After that pass, prepare one continuous three-seal/ascent route from a credible T2 checkpoint, then a limited T3 mechanics/acquisition exploration. Independent boss-clear snapshots cannot be merged into three seals. Other classes' T2 paths remain open, and T3/T4 low mob eHP stays a separate balance issue.

No balance change, launched experiment, or automatic next phase is part of this assessment.
