# Balance campaign closeout and near-term priorities

**Assessment date:** 2026-09-19  
**Purpose:** Preserve the useful decisions and evidence while ending the serial experiment-led roadmap. This is a closeout and prioritized backlog, not a new Operator Packet or authorization to launch experiments, edit gameplay, or deploy.

## 1. Evidence and scope

Primary sources are the supplied `bot-balance-boss5-report.md` and `bot-balance-campaign-state.md`. Boss5 reports execution at `e1a6f321bc17ea2d3d051e33c24ca250ae52fec2`, tree `1b5737857a83170a58f365c9d390f3628b2aeb86`, on 2026-09-19. This assessment reviews those documents and cross-checks their tables. It does not independently inspect the local raw artifacts or certify the latest repository state.

The user's new direction supersedes historical scheduling instructions in the campaign ledger: prioritize directly observed playtest problems, implement scoped changes, and use bots as targeted regression tools rather than continuously generating the next balance matrix. The user's newest manual-playtest defects are not described in the two files; their exact causes, severities, and fixes cannot be inferred here.

## 2. Closeout decision

**End the broad experiment-led calibration sequence with an integrated mob baseline and a boss risk map, not a claim that every matchup or the whole playtest is certified.** Do not discard the existing work. Do not automatically prepare Boss6.

Retain the implemented mob changes and T2 Swamp adoption. Recommend adopting T2 Dreadbore's tested **85 Attack** as its first-pass value, subject to ordinary source reconciliation and a scoped implementation check. Keep the unresolved early-tier, T3, reference-build, and progression risks explicit.

## 3. What changed in the game, and what did not

| Work | Recorded status | What survives this roadmap change |
|---|---|---|
| Consolidated ordinary-mob pass | The ledger records a 37-species integrated adoption, in addition to earlier adopted changes. | Keep the committed package, role separation, coupled-defense checks, and retired-overlay protections. This is not a recommendation to replay every historical treatment. |
| T1 Mountain pressure | Ridge Ambusher and Cliff Hopper base Attack 50 -> 40 implemented. Power Shot remains 2.2; Strong Kick remains 1.9. | Keep the enemy relief. Local armor is post-acquisition preparation, not evidence about the very first visit. Apprentice/swarming remains a recorded limitation. |
| Jungle ordinary-mob duration | D37 confirmed the representative primary-lineage centers at about 10.95 / 14.84 / 23.85 seconds across T2/T3/T4. | The desired longer elite progression has a measured example. It is not universal certification of all roles or classes. T3 pressure remains open. |
| Navigation and measurement | The ledger records repairs to hazard escape, the footprint boundary, outcome classification, and declaration handling. | Keep the regressions; do not reopen the historical diagnoses absent a new reproduction. |
| T2 Swamp boss | Venom per-stack damage 9 -> 6 adopted; the obsolete Boss4 treatment was retired. | Keep 6. The tested practical package used Cleanse and won on four of six references; no universal safety or acquisition claim follows. |
| T2 Cave boss | Source still 139 Attack during Boss5; 104 and 85 were process-local treatments. | 85 is a recommended adoption, not an already-shipped fix. |
| Economy and natural access | ECON-1 is a recorded hypothesis; Boss5 stripped guardians. | Do not claim earned progression, reward efficiency, or current full-route readiness from the isolated fights. |

**Sources:** campaign ledger, Boss4 disposition, D35 adoption, D36/D37 integration sections, and ECON-1; Boss5 §§4–5, 8–9.

## 4. The final Cave decision

Boss5's 104-vs-85 comparison used the same six root-specific Brace reference packages and the carried seed. Both arms were treatments relative to authored 139.

| Root | 104 Attack | 85 Attack |
|---|---|---|
| Striker | Died after removing 79.2% | Cleared at 145.4 s elapsed |
| Squire | Cleared at 69.6 s | Cleared at 69.6 s |
| Apprentice | Died after removing 65.7% | Cleared at 51.1 s |
| Slinger | Died after removing 94.2% | Cleared at 53.7 s |
| Conduit | Died after removing 31.7% | Died after removing 36.1% |
| Spirit | Died after removing 96.4% | Cleared at 48.0 s |

**Recommendation:** integrate the absolute value 85 with all other boss fields unchanged. Four losses become clears; the existing clear remains; Conduit stays an exception. The report supplies evidence of broader clearability with the existing encounter loop, not a fitted optimum or comprehensive margin assessment. There is no need to continue the scalar search solely to make Conduit pass.

The 104 rows repeat the previous candidate's endpoints; they are reproducibility evidence, not new independent replication. The source must not accidentally retain 139 or stack a percentage reduction onto an already-treated value. Preserve historical artifacts and qualify the actual adopted value on the implementation revision.

**Source:** Boss5 §§4–5; campaign ledger current phase.

## 5. Roster handoff: observation and disposition

Counts below are observed outcomes of the declared packages, not estimated win probabilities. `K/D/C` means boss kill / player death / cap with the boss alive. Boss5 breadth used Mountain-family gear, unlike the earlier T2 portable package. T1 additionally had no attuned Technique. Results do not establish a universal tier curve or class ranking.

| Tier | Boss | Evidence/status | Suggested disposition |
|---|---|---|---|
| T1 | Obsidian Broodmother | Boss5 verified, 0K/6D | Early-game pressure/reference-fit priority; compare with current human preparation before selecting a nerf. |
| T1 | Gnarled Greatbear | Boss5 verified, 0K/6D | Same priority; all selected references failed. |
| T1 | Crag Behemoth | Boss5 verified, 6K | Retain for now; no numeric change indicated by this screen alone. |
| T1 | Tusked Razorback | Boss5 unverified, 0K/6D with 5–6 additional fauna present | Establish encounter composition before attributing losses to boss-only pressure. |
| T1 | Grave-Toadeater | Boss5 verified, 1K/5D | Early-game preparation/status-pressure watch item. |
| T2 | Gorging Razortusk | Prior portable screen, 2K/4D | Difficult matchup; address when human evidence or progression impact makes it a priority. |
| T2 | Apex Timberclaw | Prior portable screen, 1K/5D; recovered Spirit clear reproduced | Keep the known reference. No return to the discarded all-T2-unbeatable inference. |
| T2 | Stoneplate Juggernaut | Prior portable screen, 5K/1D | Retain; keep slow clears and Apprentice exception visible. |
| T2 | Mire-Gorged Behemoth | Adopted venom 6; candidate evidence 4K/2D with Cleanse | Stop dedicated Swamp tuning; retain preparation caveat. |
| T2 | Chitinous Dreadbore | Boss5 verified: 85 gives 5K/1D; not yet adopted | Recommend adopting 85; route Conduit's remaining problem to reference-fit work. |
| T2 | Dune Stalker Emperor | Prior portable screen, 4K/2D | Retain with matchup exceptions. |
| T2 | Jungle Dread-Gorger | Prior portable screen, 5K/1D | Retain with Conduit exception. |
| T3 | Deep-Core Burrow-Gorger | Boss5 verified, 4K/2D | Retain pending human issues; Apprentice early loss and Conduit long loss remain useful cases. |
| T3 | Dune-Carapace Monarch | Boss5 verified, 1K/5D | High-priority pressure/counterplay review. |
| T3 | Apex Bramble-Slasher | Boss5 verified, 2K/4D | High-priority pressure/counterplay review; distinct from ordinary Jungle pressure. |
| T3 | Crag-Gorged Horn-Behemoth | Boss5 verified, 4K/2D | Retain; Conduit 555.5 s clear is a pacing exception. |
| T3 | Rot-Spore Croc-Behemoth | Boss5 unverified attribution; 0K/6D observed | Serious provisional risk; reconcile the hazard attribution from existing evidence when needed. |
| T3 | Frost-Plated Rime-Mammoth | Boss5 verified, 5K/1C | Retain boss baseline; Conduit survives 600 s without clearing. |
| T3 | Cinder-Shell Magma-Salamander | Boss5 unverified attribution; 1K/5D observed | Serious provisional risk; some references die without reaching named casts. |
| T4 | Dune-Throne Sovereign | Boss5 verified, 6K | Retain; six clears alone are not a reason to increase difficulty. |
| T4 | Verdant-Crown Predator | Boss5 verified, 5K/1D | Retain; Conduit exception. |
| T4 | Iron-Crest Titan | Boss5 verified, 6K | Retain; Conduit 557.5 s clear needs a pacing disposition. |
| T4 | Elder Trench Serpent | Boss5 verified, 6K | Retain with class-specific duration differences. |
| T4 | Glacial Patriarch | Boss5 verified, 5K/1C | Retain; Conduit survives 900 s without clearing. |
| T4 | Caldera Sovereign | Boss5 unverified attribution; 4K/2D observed | Reconcile hazard attribution; preserve the actual Conduit/Spirit failures. |
| T4 | Charnel-Crown Sovereign | Earlier 12 clears; retrospectively reviewed declaration issue | Retain reviewed evidence; keep the original failed-verification label and addendum distinct. |

**Sources:** Boss5 §3 and §4; campaign ledger Boss1/Boss2/Boss4 dispositions. This table is a handoff of existing evidence and proposed priorities, not a new all-boss acceptance test.

## 6. Near-term work, ordered by decision value

### A. User-reproduced defects and the already-supported Cave change

The user's direct-play defects take precedence where they break controls, combat, progression, or recovery. Their details are absent from these files, so do not invent a diagnosis or claim they are covered. Pair the actual reproduction with a narrow fix and the smallest relevant regression. Land Cave 85 if approved; do not commission another selection grid for that decision.

### B. Early-tier accessibility and T3 pressure

T1 Cave and Forest's six-reference losses, T1 Swamp's one clear, and the T3 Desert/Jungle/Swamp/Volcano warnings deserve attention before broad release. They identify risk, not a ready-made coefficient prescription.

The T1 no-Technique package is a choice of how to spend the budget. It does not establish that T1 cannot legally use Techniques in other packages. Keep that opportunity cost explicit when comparing human play and old successful routes. Do not tune the whole tier around this one template or start an exhaustive alternative-build search.

The ordinary T3 Jungle pressure exception remains outstanding in the ledger. Its wording about a "defensive margin" is not authorization for a global player-defense buff. Treat the mob issue and Jungle boss issue as separate until evidence links them.

### C. Conduit reference-fit and extreme duration

Prioritize the observed cases rather than a global class ranking: T3/T4 Mountain clears at 555.5/557.5 s; T3/T4 Tundra caps at 600/900 s with 82.5%/95.3% removed; persistent Cave failure at 85. Those are consequential player-experience risks even when the player survives. `CannotAttack` explains zero owner attacks, not why a summon build takes this long or dies.

The side item/build review is useful here if it identifies a specific delivery, equipment, ability, or targeting interaction in these setups. The sources do not identify that cause, and no universal Conduit buff is selected by this closeout.

### D. Small measurement maintenance, only where the next decision needs it

The three hazard-attribution failures are different from actual extra creatures in T1 Plains. For the former, source-linked attribution and a separate retrospective review may be enough; preserve original verification failures and do not rerun by default. For Plains, actual extra bodies alter the fight, so relabeling or subtracting their damage cannot reconstruct a boss-alone counterfactual. Determine whether their presence is intended gameplay or benchmark setup before fixing either.

Do not disable the contradiction check wholesale, call all four bosses broken, or require a broad harness rewrite before manual bug fixes. Prepare/commit source before handing future execution to an operator; clean-tree bookkeeping should not require the operator to choose adoption content.

### E. Progression and rewards before the invited playtest

Boss5 measures no guardian access. Retain earlier scoped route evidence without promoting it to current all-class readiness. Confirm credible, non-circular preparation and the required progression path on the release candidate, including clear credit and recovery/return where relevant.

ECON-1 is still untested: compare the same later-tier character's usable rewards and credited biome XP in lower/current-tier versions of a biome at x1 and per elapsed gameplay time. Include caps and recovery/death costs; keep travel/setup visible. Do not infer reward rates from kills, or undo longer combat solely to restore the former kill count.

## 7. Document caveats that must not become new campaigns

Boss5 completed 120 observations, of which 96 passed block verification: 84 breadth rows plus 12 Cave rows. Its reported 62 kills / 56 deaths / 2 caps agree with a tally of its tables. These are bookkeeping totals, not a pooled success-rate score.

The report calls all 120 observations new in §10 while also reporting a new 104-vs-85 execution and earlier Boss4 104 evidence. Read the 104 arm as a replayed comparison, not independent corroboration. Its "strict dominance" wording should be limited to the recorded outcome direction, not all possible contexts or metrics.

The documents assert seed inertness largely from the absence of scripted summons. Their own Plains exception shows the limitation of that argument; the provided evidence does not establish invariance to all randomness in every other subsystem. Retain a one-declared-seed screen interpretation, not a probability claim. No extra seed sweep is required to make the closeout honest.

Do not convert every old correction or historical "NOT LAUNCHED" section into pending work. The ledger is an archive as well as a state file, and the user's new roadmap now governs scheduling.

## 8. Operating mode from here

Use one short current-state backlog, with status **implemented / selected-not-applied / needs diagnosis / deferred**, affected build/revision, evidence, next action, and a concrete done condition. Preserve the detailed campaign ledger as an archive. New agents should read the compact backlog and relevant files, not reconstruct every old packet.

Prioritize a small batch of player-visible fixes; re-test the affected scenario manually and with an existing bot fixture where useful. Parallel reviewers supply bounded recommendations; they do not mutate the active baseline independently. A new combat experiment is justified only when different plausible results would change a decision, not simply because more data is available to collect.

**The next milestone is a playable release candidate with known nonblocking limitations, not universal six-root victory or a fully green historical artifact archive.** Before inviting players, the supported progression paths must be credible, reproduced release-blocking defects fixed, accepted changes integrated, and basic rewards/operations checked. Perfect item, stance, ability, and class parity can continue with playtest feedback.

## Bottom line

The campaign has produced real source improvements, useful regressions, a boss roster map, and a well-supported Cave adoption candidate. Its remaining risks are sufficiently localized to hand back to direct development. Stop expanding the routine experiment pipeline; preserve the evidence and use it to close concrete gameplay decisions.
