> Original supplied brief. The later user-requested canonical formation targeting fix in DESIGNER_DECISION.json supersedes its no-gameplay-change boundary for that specific fix only. Main experiment remains unrun.

# Desert strategy 01 — intended counterplay and class assessment

**Assignment: give this document to Astra.** Prepare the approved experiment; Luna executes the resulting packet. This is not a reporting-only task, a new broad validation campaign, or permission to change gameplay values.

**Approved scope:** six T4 representatives × two targeting policies × two seeds = **24 fresh observations**. One ordinary Desert fixture, ten-minute maximum lives, no Endure in either arm. Return a class-level assessment using these results and existing campaign evidence.

This document supersedes the completed Guard-comparison briefs as the next preparation assignment. It is an instruction brief, not an already implemented executable packet. Astra supplies the actual verified launch command and resolved manifest.

## 1. Decision and designer intent

**Question:** With the same legal build and existing Cleanse behavior, does low-HP target prioritization execute the intended Desert counterplay, and which substantial performance problems remain?

The designer describes Desert's bonded encounters as a durable controller that slows/roots the player plus a more vulnerable damage dealer. Intended responses include killing the dealer first, or separating/kiting the controller with a suitable ranged build, while using control removal. The designer approves testing the targeting response first. Separation/kiting changes are not an extra arm in this packet.

Treat this as intended design, not proof that every spawned pair or every Rune decision behaves that way. The experiment must observe the actual target order. A lower-HP targeting rule is the proposed player-accessible implementation of dealer-first play; those two descriptions are not automatically equivalent.

**Ask-before-inventing rule:** use the designer's existing explanation rather than requesting it again. If an unexplained failure or an implementation constraint leaves the intended answer unclear, return a concrete question to the command center before choosing another strategy, changing equipment, or proposing a corrective experiment. Include the affected package, observed failure, and the specific missing decision. Do not guess a replacement strategy and spend runs on it. A gameplay loss alone does not require stopping the remaining approved cases.

Healthy class asymmetry is expected. The goal is to identify persistent weak or strong outliers after credible intended play, not equalize all throughput or make every path survive every biome.

## 2. Baseline and evidence to reuse

The attached **Guard coverage 01 — run 01** report records:

- Measured source: `15aef70b72bc0eead1511a32a93f72a97299ea7c`.
- Integrated session correction: `214d28cd4375bd179219fe5964785df4978e3df6`.
- Production Conduit R2 remains the existing baseline; no further reconstruction treatment is requested.
- Seeds: `101009`, `101021`.
- Existing hitbox identity: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`.
- Static Guard-screen packages used 40/47 RP; adding Endure used 46/47. The readable ledger is the basis for comparisons where report prose and aggregate wording differ.

Use one frozen gameplay baseline carrying R2 and the integrated session correction for **all 24 observations**. Start from the measured source above or a verified gameplay-equivalent descendant; preparation/recording changes may create a new execution commit. Record that actual commit and source identity. Do not assume a later publication commit or current checkout is equivalent without checking. Do not re-integrate the correction, reapply R2, or commission another efficacy test for them.

Reuse the existing dispatcher, preparation, legality checks, fixed hitboxes, fixture generator, and output conventions. Keep source preparation and result publication checkouts distinct. Run the existing exact-source verification against the real child entrypoint once during qualification; do not repeat the earlier parent/child revision mismatch. No simulator acceleration, estimator repair, general harness redesign, or unallocated combat pilots.

**Endure remains numerically unchanged and flagged for later opportunity-cost review.** Its exclusion here asks whether intended targeting reduces the need for that extra mitigation. This is neither a nerf, a rule banning the ability from class builds, nor evidence that one fewer failure proves it balanced. Historical Endure results are context, not additional matched arms.

## 3. The six approved representatives

All are T4 mature synthetic packages. Preserve the actual learned/evolved ownership, +5 ordinary equipment, core/relic levels, ability rank resolution, and legal mastery/RP budget from the identified references. Resolve the catalogue to actual runtime readbacks; do not normalize Attack, HP, barrier, Recovery, or range across roots.

| Root / representative | Stable identity | Selected specialization / range | Recovery item, both arms |
|---|---|---|---|
| Striker / Berserker | `breadth-t4-striker-heavy-a` | `cadence-heavy-t3-a` / close | `volcanic-charm-t4` +5, Inferno Heart |
| Squire / Avenger | `breadth-t4-squire-heavy-a` | `cooldown-heavy-t3-a` / close | `volcanic-charm-t4` +5, Inferno Heart |
| Apprentice / Icebreaker | `breadth-t4-apprentice-heavy-a` | `dot-heavy-t3-a` / mid | `mountain-charm-t4` +5, Fortress Heart |
| Slinger / Melter | `breadth-t4-slinger-heavy-a` | `reload-heavy-t3-a` / mid | `volcanic-charm-t4` +5, Inferno Heart |
| Conduit / Champion | `breadth-t4-conduit-heavy-b` | `summoner-heavy-t3-b` / **close** | `volcanic-charm-t4` +5, Inferno Heart |
| Spirit / Voidwalker | `breadth-t4-spirit-heavy-a` | `energy-heavy-t3-a` / mid | `mountain-charm-t4` +5, Fortress Heart |

Use the Guard-screen **Inferno static, no-Endure** receipts for Berserker and Champion. Use the corresponding overnight catalogue/readbacks for Avenger, Icebreaker, Melter, and Voidwalker. Preserve Champion rather than substituting Covenanter or a generic ranged Conduit.

The catalogue identifies the following starting equipment and ordered Techniques. These are reference selections, not fresh optimization proposals. Resolve against the actual receipts; explain a substantive conflict rather than silently choosing another item.

| Representative | Weapon +5 | Armor +5 | Core | Relic | Ordered Techniques |
|---|---|---|---|---|---|
| Berserker | `mountain-warmaul` | `mountain-vest-t4` | `core-bruiser` | `relic-colossus-heart` | `sweep`, `frenzy`, `expose-weakness` |
| Avenger | `mountain-warmaul` | `mountain-vest-t4` | `core-arcanist` | `relic-colossus-heart` | `slam`, `frenzy`, `expose-weakness` |
| Icebreaker | `graveyard-plague-axe` | `jungle-vest-t4` | `core-tempered` | `relic-colossus-heart` | `slam`, `frenzy`, `expose-weakness` |
| Melter | `jungle-deathfang-rapier` | `jungle-vest-t4` | `core-catalyst` | `relic-equilibrium-shard` | `sweep`, `frenzy`, `expose-weakness` |
| Champion | `jungle-deathfang-rapier` | `mountain-vest-t4` | `core-survivalist` | `relic-colossus-heart` | `sweep`, `frenzy`, `expose-weakness` |
| Voidwalker | `volcanic-eruption-lash` | `jungle-vest-t4` | `core-tempered` | `relic-colossus-heart` | `sweep`, `frenzy`, `expose-weakness` |

All six retain Mountain boots +5 and **Offensive Stance** from their selected references. All retain ordered Guards **Second Wind, Brace, Cleanse**, with their existing native triggers. No Endure, Recuperate, or Recuperating policy is added. Berserker is a class-path label, not an instruction to use Berserker Stance.

Preserve existing movement/safety/recovery rules and their relative order: Find Enemies, telegraph Step Back, Avoid Hazards, Recover First, and existing Orbit where the reference has it. Icebreaker and Voidwalker have Orbit; the selected Melter and close Champion references do not. Do not add Orbit merely because a package has mid range, nor remove it to improve a result.

## 4. Arms: only targeting changes within each pair

**A — `baseline-targeting`:** exact approved static package, retaining its existing targeting behavior and Cleanse setup; no added low-HP rule.

**B — `lowhp-targeting`:** the identical package plus the native assembled Rune:

```json
{"conditionId":"in-combat","actionId":"focus-lowest-hp"}
```

At measured source `15aef70b…`, `in-combat` costs **1 RP** and `focus-lowest-hp` costs **2 RP**, for **3 additional RP**. The action is T4. Use production attunement/accounting and lawful fragment acquisition. Do not grant the behavior without paying for it.

Expected used RP from the references is **40 → 43 of 47** for Berserker, Avenger, Melter, and Champion; **43 → 46 of 47** for Icebreaker and Voidwalker. Confirm the resolved values. Leave spare RP unused in both arms; do not fill it with another ability to make the comparison look equal. This measures the marginal value of a three-point policy, not an equal-budget optimization contest.

Put the added rule where it can win the existing TARGETING channel without changing movement, Guard, or other channel priority. Preserve all other rules. If a reference already contains that exact effective policy or cannot afford the rule, identify the mismatch before sealing; do not invent a new arm.

### Narrow preparation checks, not a new investigation

Read the native targeting comparator and arbitration path. Record whether it ranks current absolute HP, HP fraction, or something else; what candidate set it uses; and whether target persistence or attack-range eligibility can prevent a dealer switch. Follow the same player targeting through Champion's formation commands. Do not implement a private dealer-role selector, target by monster ID in the combat controller, bypass reach, or change the comparator to make the hypothesis true.

Read the relevant spawned bonded roles/HP and existing Cleanse handling. Cleanse already exists in **both** arms: do not change its trigger, priority, cooldown, root-removal behavior, or substitute Break Free in this experiment. The designer has explicitly deferred changing Cleanse's ability to remove roots. Observe whether Cleanse actually clears the relevant control and permits useful movement; do not assume it does from its attunement alone.

A practical limitation is acceptable evidence: the low-HP rule may not select the dealer in every situation. If preparation shows the policy cannot meaningfully express the approved strategy, ask the designer the specific question before sealing affected cases. If the limitation emerges during approved execution, record it and finish the remaining cases; do not silently call a strategy-unexercised failure a class deficit. No new theorycrafting branch is authorized by that limitation.

## 5. Fixed execution contract

| Parameter | Decision |
|---|---|
| Experiment ID | `desert-strategy-01` |
| Fixture | `node-t4-desert-03`, ordinary production ecology |
| Representatives | Six listed above |
| Arms | A baseline targeting; B native low-HP targeting |
| Seeds | `101009`, `101021` |
| Main observations | **24 fresh**, 12 matched pairs; controls included |
| World step | **100 ms**, normal production execution |
| Maximum life | **600,000 ms / ten simulated minutes** |
| Endpoints | 300,000 and 600,000 ms from the same continuous life |
| Stop | First player death or fixed cap; no respawn/revival resets |
| Retries / adaptive additions | Zero |
| Exclusions | Bosses, other biomes, T1–T3, new frames/paths, extra charms/Guards, live deployment, economy/progression tests |

Use natural seeded fixture generation. Matched arms must start from the same roster/state; retain the initial roster identity. Do not select convenient pairs or reseed a troublesome opening. Keep ordinary patrols, terrain, pack AI, regeneration, and reinforcements intact.

Keep paired arms adjacent; use A then B for seed 101009 and B then A for seed 101021, cycling the six representatives. Freeze the complete order before Luna begins. Do not reuse thirty-minute summaries as ten-minute matched observations or replay only failed cells. Historical endpoints may inform interpretation, with their original sources and durations attached.

Reuse existing resource/watchdog limits and one-worker execution. Qualification covers package legality and the actual child launcher, not another set of combat samples. If the recorder needs a 600-second endpoint or a small target/kill-order field, add that narrowly before freezing. A common operational failure stops affected work; gameplay deaths continue. Preserve partials without changing the packet mid-run.

## 6. Evidence needed to answer the question

**Primary outcomes:** survival/death and elapsed time; completed kills; completed bonded pairs; dealer-versus-controller kill order; time until the dealer is removed while both members are engaged; owner damage/control exposure during that interval; completed work in 0–5 and 5–10 minutes; unfinished targets and meaningful progress gaps.

Pair analysis must use actual bond/pack membership, not assume that adjacent monster deaths belong together. Separate pairs cleared, pairs lost at player death, pairs unfinished at the cap, and ambiguous cases. Multiple nearby bonds, late joins, simultaneous/AoE deaths, and non-bonded enemies remain explicit. Read role labels only for observation; they are not privileged targeting inputs.

Record the selected player target and, for Champion, actual formation target changes; whether an eligible dealer was present; relevant Cleanse activations and control changes; RP used/free; and the final damage/debuff context of a death. Summons alive are not proof of damage delivered. Distinguish owner damage from Conduit replacement payments and HP damage from barrier absorption.

Use existing event/summary capture and add only missing fields needed for this question. Unsupported measurements remain unavailable with a reason, not fabricated zeros. Do not create a general telemetry platform or repeat historical combat to repair its reporting. A case with no relevant bonded-pair exposure is uninformative for the strategy question, not evidence that the strategy works.

Keep lifetime `completedKills` and endpoint `work.kills` distinct where the existing recorder differs; use a declared counter consistently. Post-death endpoints are null. A ten-minute survivor has not established thirty-minute endurance. Two seeds do not establish a reliable population win probability, and a fast death-shortened kill rate is not sustainable farming throughput.

## 7. Required decision output: class assessment, not another rescue loop

Luna first reports what the experiment measured. Separate **policy effectiveness** (did kill order change?) from **combat effectiveness** (did that improve pressure, completed work, and survival?). Interpret effects within each matched pair before comparing representatives.

Astra should seed a compact six-root evidence table from the existing reports during preparation; Luna appends the new comparison and a short assessment. Use existing breadth, boss, sustain, stance, overnight, and correction summaries **without replaying campaigns or rereading every historical raw log**. The table should identify the measured frame/path and tier, apparent strong/weak environments, intended-strategy coverage, important RP/equipment dependencies, evidence source, and one of:

- Leave unchanged / plausible specialization tradeoff.
- Targeted buff candidate with the specific root, frame, path, or tier implicated.
- Potential nerf candidate with the relevant mechanic and cost/tradeoff evidence.
- Unresolved designer question or insufficient strategy-aware evidence.

Use boss and farming evidence separately. An untested environment remains unknown; a six-representative T4 Desert comparison cannot certify every class frame/path or replace missing T3 evidence. Do not promote pre-session-fix Conduit rows to current measurements. Earlier generic-targeting failures are useful context but weaker class evidence where the intended counterplay was absent.

Flag unusually strong packages as well as weak ones. Melter is a deliberate strong comparison, not the throughput all roots must reach. A class may legitimately require different tactics or be weaker in one biome. Conversely, repeated weakness in intended favorable content, unusually costly counterplay, or broad dominance with little sacrifice may justify a targeted balance proposal.

Return **at most three prioritized balance decisions or candidate proposals**, only as supported. There is no quota of buffs/nerfs. A successful targeting change updates a reference policy; it is not a class-stat buff. A failure despite changed kill order does not by itself identify whether player values, encounter values, or another mechanic are responsible.

Do not require every row to survive, issue an automatic Endure add-back run, open another charm factorial, or create an experiment for each uncertainty. If the cause or intended answer is unclear, ask the designer before selecting another strategy. Endure's possible dominance stays a separately labelled future opportunity-cost question; this packet does not resolve or retune it.

## 8. Responsibilities and publication

**Astra:** prepare only this bounded packet. Produce a short `LUNA_RUN.md` with exact commands, pinned source/hitbox identity, ordered 24-case manifest, six base-package and twelve applied-arm readbacks, and a concise note on the native targeting/role/Cleanse interpretation. Reuse existing assertions and relevant checks; no broad harness audit or new prerequisite campaign. Commit scoped preparation code and handoff through the normal workflow so the packet is traceable. Do not launch the main balance run or alter gameplay values.

**Luna:** run the sealed packet once with routine supervision, preserve evidence, and stop after completing it. Do not adapt builds or tune coefficients. Publish **one readable `REPORT.md`**, including the paired results and class assessment above, plus a compact `results-summary.json`, applied build/identity/completion records, and an inventory of external raw streams. Keep findings to at most five and next decisions/questions to at most three. Distinguish proposed, measured, accepted-as-reference, integrated, and deployed states.

**Commit AND push the scoped compact publication**, verify the remote report is accessible, and return branch, publication SHA, measured execution SHA, report path, and new/completed/failed/omitted counts. Do not commit raw gigabytes, credentials, player databases, or unrelated changes. If publication fails, report the actual failure and local location; never rerun combat for a publication problem. Do not claim deployment or start deployment work.

**Command center + designer:** interpret the combined class evidence and approve substantive next designs. Completing this packet does not authorize a further experiment automatically.

## Evidence references for preparation

- Designer's biome/boss notes and approval of the six-representative targeting comparison in this conversation: intended strategy and scope authority.
- Attached `REPORT.md`, **Guard coverage 01 — run 01**: measured source `15aef70b72bc0eead1511a32a93f72a97299ea7c`, integration status, static/Endure outcomes, RP and replacement-payment evidence. Locate the matching existing `guard-coverage-01` compact receipts in the local report tree; this brief does not claim to have downloaded their raw Windows streams.
- `reports/player-fast-pass/overnight-endurance-01-preparation/CATALOGUE.md`, inspected at `15aef70b…`: stable identities, skill paths, equipment, ordered abilities and Rune policies. Resolve to its associated actual readbacks.
- `reports/player-fast-pass/day2-bounded-01/run-01/REPORT.md`: historical session correction and charm/stance comparisons, with separate control/candidate sources.
- `shared/src/runeDatabase.ts`, inspected at `15aef70b…`: `in-combat` costs 1 RP; `focus-lowest-hp` costs 2 RP, is T4, and uses the TARGETING channel. Catalogue text does not establish the server comparator or actual kill order; those remain the stated narrow preparation/readout checks.

**Completion means a measured counterplay comparison and a short class-decision assessment—not another definition of what must be validated before class balance can begin.**
