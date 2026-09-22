# T2 multi-biome class screen 01 — preparation handoff

**Give this document to Astra.** Prepare the wider T2 experiment approved by the designer. Luna executes the resulting runnable packet, writes a readable report, and commits and pushes the scoped publication. This is a command-center preparation brief, not an implemented manifest or a claim that combat has run.

## 1. Decision and allocation

Test all **18 T2 identities: six roots × Light/Balanced/Heavy**, using sensible biome-specific packages. Broaden encounter coverage, not the number of independently optimized gear permutations. Identify persistent weak/strong outliers and distinguish class/frame problems from encounter specialization and support costs.

| Block | Coverage | New observations |
| --- | --- | ---: |
| A — primary | 18 identities × Plains, Forest, Swamp, Mountain, Cave, Jungle × 2 seeds | 216 |
| B — weapon alternatives | 3 selected identities × Swamp/Cave × 2 seeds; primary controls already in A | 12 |
| D — T2 Desert, conditional | 18 identities × 1 Desert fixture × 2 seeds, only after its legal T2 strategy is settled | 36 |
| Main executable allocation after preparation | A + B | **228** |
| Complete allocation if D is authorized | A + B + D | **264** |

No other optional combat, extra seeds, repeated failed lives, automatic candidate patches, boss matrix, or cross-tier combat block is authorized. D is a specific designer decision, not a harness-qualification prerequisite. A/B must not wait for it. Resolve D before sealing if the designer answers in time; otherwise leave it explicitly deferred, not failed or silently tested with generic play.

The three weapon comparisons remain in their two revealing settings rather than being multiplied through all biomes. Historical T2 Plains rows remain context, not reused current controls: the new study has a different source, preparation, seeds, and duration.

## 2. Evidence and fixed baseline

Repository: `RaimonTarga/MMOidleProject`. Command-center inspection reference: **`e504a0db1b74764249c60558bf507b56d8cf35f3`**, published develop when this brief was written. Resolve the actual intended committed playtest baseline locally before sealing; do not assume this remains the newest work or overwrite another agent's changes.

Source facts inspected for scope:
- `shared/src/world/map/regionT2.ts` authors **seven** T2 biome families: Forest, Plains, Mountain, Cave, Swamp, Jungle, Desert. Resolve final ordinary nodes through the production registry, not just monster-pool availability.
- `shared/src/biomeDatabase.ts` has the corresponding T2 pools. Tundra and Volcanic begin at T3 in these definitions.
- `shared/src/runeDatabase.ts` authors **Focus Lowest HP at T4**, Keep Distance at T1, and several other targeting options at their own tiers. Do not transfer the successful T4 Desert targeting rule to synthetic T2 ownership.
- The new Wait It Out Rune is present in this published source; its designer gameplay check is not established as complete. Leave it unequipped in this experiment. Do not delay the class screen to validate or optimize it.

Use normal Conduit R2, accepted session continuity/owner-target inheritance corrections, and **movement-only Hamstring**, where legally equipped. Record the actual source containing these changes. Heat's current implementation is part of source provenance, but no Heat environment or Heat change is being tested here.

Evidence to retain without replay:
- `reports/player-fast-pass/t3-tundra-class-frame-01/run-02/REPORT.md`, measured source `7d0dadb2b4397141c5a654ab9bb658871c56147b`: 52 accepted observations; Balanced Apprentice primary died at 36.2/123.9 seconds while its Light/Heavy siblings survived both seeds; timed Detonate helped but was not universally successful. These are T3 packages, not controls for T2.
- Tundra run-01 has **zero accepted observations** and is not pooled with run-02.
- Historical T2 farming in `reports/player-fast-pass/conduit-recovery-preparation/farm-completion-run-01/`, measured source `5024be692d8a1854b7f61e007d371f2ee9aab46b`: earlier five-minute, seed-101003 Plains coverage. Preserve its source/treatment distinctions.
- Designer biome notes and class equipment suggestions in this conversation are intent/hypothesis authority. Do not treat stale source comments about anticipated monster retuning as instructions to reopen enemy balance.

## 3. Biome answers: preserve designer intent, then express it legally

These are the designer's strategy families, not assertions that each item is universally best. Build the first credible references from them; no outcome-driven optimization during preparation.

| Biome | Intended answer | What the reference should express |
| --- | --- | --- |
| Plains | High plating and AoE against swarms; Hawk roots are secondary pressure | Functional class-appropriate AoE, suitable plating/survival, practical recovery. Plains kill-chain charm is a candidate, not mandatory for every frame. |
| Forest | Similar to Plains, with less AoE emphasis; alpha focus optional, not essential | Plating or a class-relevant alternative with a stated tradeoff, useful crowd handling, sustained combat. Do not add an alpha-targeting factorial. |
| Swamp | Cleanse is central; Recover First, hazard avoidance, optional Cleansing Rite and DoT-resistant Swamp armor; DoT can help turtles | Pay for functioning Cleanse and avoidance. Use legal recovery/DoT defense. A rite can be included when eligible and affordable, without making it a universal extra treatment. Do not give every non-DoT class an unrelated poison build solely to make turtles trivial. |
| Mountain | Sparse hard hits, single-target pressure, Brace/Endure where appropriate, consistent recovery; avoid incidental pulls while kiting | Appropriate mitigation and telegraph response; useful single-target output. Cave boots/approach rules are designer-approved anti-overpull options. Endure may support a tanking identity but must not become a blanket unreported addition. |
| Cave | Avoid overpulls, isolate elites, kite where possible; handle charge/root/slam and occasional poison | Single-target pressure, native telegraph avoidance and appropriate control removal/Guard support. Do not force one enemy at a time by changing World spawns or aggro rules. |
| Jungle | Dense chaotic fights; AoE, plating, Avoid Hazards to avoid bushes, relevant poison handling | An actual AoE farming package and movement/defense capable of the intended terrain response. Keep natural density and incidental encounters. |
| Desert — D only | Kill the vulnerable dealer first or use an appropriate ranged separation/kiting response; Cleanse matters | **Resolve the tier-legal tactic before execution.** Do not quietly replace intended counterplay with extra Endure or grant T4 target selection. |

**Desert decision to send to the command center:** “Focus Lowest HP is currently authored at T4. What is the intended repeatable T2 answer for melee/autonomous builds: another existing targeting/cleave policy, manually initiated dealer selection, or acceptance of a different early-tier approach?” The designer already supplied the bonded-pair theory; do not ask them to repeat it. Existing ranged kiting may be usable, but it does not settle the melee catalogue automatically. Do not implement privileged dealer-ID targeting, change unlock tiers, invent a manual-input bot controller, or run knowingly incomplete play and call the result a class defect.

If the designer's answer requires a separate gameplay change, leave D deferred here. If an existing legal approach is confirmed, prepare D with the same source, duration and seeds as A/B, record the strategy by identity, and use the 36-cell allocation. No Desert weapon alternatives are scheduled.

**Ask-before-inventing applies everywhere:** routine item-ID resolution and legal preparation are delegated. A consequential unexplained failure, missing design answer, or materially different strategy returns as a specific question with the affected build and available evidence. It does not trigger an automatic rescue build, new instrumentation campaign, or numerical patch. Valid deaths do not stop other approved observations.

## 4. Reference construction: one identity, several declared biome loadouts

Build **18 reusable class/frame templates**, then a small set of biome loadout overrides. The final A catalogue has 108 identity/biome packages; it does not require 108 separate theorycrafting essays. Share identical packages where sensible, but do not force a swarm package into sparse elites or a barrier setup into every attrition context merely for uniformity.

Use synthetic mature-T2 ownership: correct frame nodes, native pre-T3 range behavior, legal ordinary upgrades up to +5 and actual item maxima, reachable mastery/recipe gates and production-computed RP. No future-tier equipment, cores, relics, range nodes, or abilities. Resolve rank progression at the actual player tier. Do not turn this into an acquisition run or claim tier-arrival readiness.

Starting class directions, inherited from the designer's suggestions and subject to actual T2 implementation:
- **Striker:** cadence-compatible fast/medium T2 weapons; frame and encounter determine the support. Do not use Cinderlash or Frenzy from T3. Light's fast/medium comparison is explicit in B.
- **Squire:** T2 Mountain empowered-hit hammer as the single-target starting point; suitable durable armor and legal offensive/area tools by encounter. Do not resurrect the specifically excluded Squire Slam comparison or assume old T3 choices apply unchanged.
- **Apprentice:** medium-speed T2 weapons for Light/Balanced and a genuinely slow/heavy candidate for Heavy, based on real cadence rather than weapon icons. Include legal DoT/area support where useful. No Detonate/Frenzy or later range layer. Balanced receives the explicit medium/heavy comparison in B.
- **Slinger:** Jungle on-hit T2 weapon and class-relevant armor as starting candidates; Swamp DoT alternative in B. Quick Strike is not a T2 default. Preserve native reload behavior and lawful control choices.
- **Conduit:** choose a credible T2 weapon by the actual formation/frame delivery; no new regeneration/damage treatment. Read existing adapters for the selected effects, not a new theoretical estimator. Keep living-body availability separate from delivered damage.
- **Spirit:** frame-appropriate fast/medium/heavy choices with Mountain barrier armor/charm as a designer-supported starting point, not a requirement to ignore biome-specific survival.

Choose an eligible core; Tempered is the fallback where no documented interaction warrants another eligible option. Do not import T3 Accelerant/Arcanist merely because the Tundra recipes used them. Equipment family choices can change between biomes, but **every choice and its RP/defense/output tradeoff must be explicit**. No raw-Attack equalization, made-up DPS/EHP ranking, or all-item unlock shortcut that bypasses tier gates.

Primary builds should be independently credible. Do not remove Break Free, Cleanse, or another required answer from a primary just to reserve RP for a hypothetical alternative. T2's actual control-removal availability must be checked; do not treat T3 tools as implicitly available. Keep the current authorized Cleanse semantics; do not alter root removal in this task.

No generic Flee policy. Step Back for a telegraph is not Flee. Retain appropriate Find Enemies, Recover First, Avoid Hazards and native class maintenance, with ranged Keep Distance where the designer's strategy calls for it. Pay for rules/stances/abilities/rites through normal allocation. No private target selection or forced recovery between encounters. Leave spare RP visible rather than filling it cosmetically. Endure dependence is reported, not treated as proof the class itself supplies that durability.

Seal all selections before main combat. Preparation may perform the existing focused/zero-tick checks, not iterative combat shopping for a winning package.

## 5. Block B: three approved whole-weapon comparisons

Each alternative inherits the exact primary for its identity and biome; only the weapon and its legitimate derived effects change. Keep core, armor, charm, boots, stance, skill path, Rune order, ability timing and preparation fixed inside a pair. Choose and record the exact **two legal T2 weapons** before execution.

| Comparison | Identity | Primary -> alternative | Settings / added cells |
| --- | --- | --- | ---: |
| W1 | Apprentice Balanced | Medium-speed T2 weapon -> slower/heavier T2 weapon | Swamp + Cave × 2 seeds = 4 |
| W2 | Slinger Balanced | T2 Jungle on-hit weapon -> T2 Swamp DoT weapon | Swamp + Cave × 2 seeds = 4 |
| W3 | Striker Light | Fast T2 weapon -> medium-speed T2 weapon | Swamp + Cave × 2 seeds = 4 |

The 12 primary controls already exist in A. These are comparisons of actual items in fixed support packages, not estimates of an isolated attack-speed coefficient or global best-in-slot searches. If the alternative cannot legally express the proposed category, return that specific conflict and omit the affected comparison rather than inventing a fourth one.

## 6. Apprentice question integrated into the class assessment

The designer does not yet know why T3 Balanced struggles against Rime Caster and may manually playtest it. Do not preselect crowd control as the explanation from a ranged lethal event.

Compare all three T2 Apprentice frames **within each biome**, focusing on useful work, survival and actual ranged/control exposure. Before execution, read a concise existing T3 death sequence when available and record whether control, lost attacks, failed delivery, mitigation timing or overlapping enemies is actually visible. No new T3 combat and no new full telemetry system. Missing evidence stays unknown; the wider T2 screen proceeds.

The final interpretation must distinguish:
- Repeated Balanced weakness across T2 contexts: a shared frame/support problem becomes more plausible, not yet proven.
- Competitive T2 performance but T3-specific failure: focus the next decision on the transition, range layer, scaling or encounter; T2 success does not certify T3.
- A ranged-pressure association: identify the actual ranged enemy/exposure, not all kills or all deaths pooled together.
- A useful medium/heavy alternative: a legitimate option with explicit costs, not automatic evidence to buff the discarded weapon.

Do not reserve better defense for the siblings while crippling Balanced to fit the comparison. Different class mechanics can justify different builds; those differences limit attribution to the frame alone.

## 7. Execution: broad queue, fixed measurement

Experiment ID: `t2-multi-biome-class-01`. Seeds **101009 and 101021**. One production World per life, **100 ms** steps, **600,000 ms** maximum, first player death ends that life. Retain 300,000/600,000 ms checkpoints from the same continuous run. No revival, reset between pulls, extra seeds, adaptive retries, or cap extensions.

For each biome, resolve one ordinary T2 node in the current registry, preferentially the existing `-03` fixture when valid. Confirm its tier, node modifiers, native population and progression role; record the exact ID. Do not invent a node, remove its hazards, adjust enemies, or assume ordinal “03” makes different biomes equal difficulty. Swamp/Cave must preserve real mixed encounters, including possible ranged pressure, rather than guaranteeing an artificial isolated caster duel.

Use fresh observations on one fixed baseline. Match initial ecology within each weapon pair; identical seeds do not imply identical later target exposure after behavior diverges. Interleave roots and biomes, and keep local pairs adjacent with order reversed across seeds. Publish the fixed ledger before execution; meaningful partial coverage should exist if the run stops.

Reuse the repaired Tundra execution path: create the final execution checkout first, qualify there, and run there. Compare semantic source/build fields while retaining location provenance; do not transplant main-checkout qualification and rediscover the absolute-path failure after combat. Use the already repaired receipt check and existing focused tests—no new framework or full-suite repair.

The first scheduled live case counts toward the allocation and continues into the queue; no separate balance pilot or ceremonial approval checkpoint. One worker with existing watchdogs and compact progress at block boundaries. A shared operational error stops the affected family rather than duplicating it across all cells. Valid losses continue. No agent edits to source or packages while Luna is measuring.

## 8. Results that produce decisions

Report primary rows separately from alternatives and any deferred Desert block. By biome and frame, include both seeds' survival/time-to-death, completed kills, first-kill latency, 0–5/5–10-minute work, unfinished targets, significant progress gaps, owner HP/barrier pressure, and concise lethal/pressure context. Keep ordinary HP progress separate from absorption and summon payments. No post-death endpoint imputation and no death-shortened rate presented as sustained farming.

For consequential outliers use available evidence of counterplay: AoE delivery, relevant Cleanse/control-removal activations, hazard/overpull context, recovery interruption and enemy types encountered. Insufficient relevant exposure means unknown for that mechanism, not balance approval. Existing counters are enough unless a narrow missing field actually prevents a decision; do not turn each uncertainty into a new experiment.

Astra seeds **`CLASS_ASSESSMENT.md`** from current compact campaign summaries; Luna appends the new evidence. Produce an 18-identity-by-biome map plus short six-root conclusions. Identify credible niches, weaknesses, unusual support/RP dependence and strong as well as weak outliers. No pooled cross-biome kill leaderboard: HP, density, progression role, targets and build choices differ. Two seeds and ten-minute caps are limited screening evidence, not population win probabilities or endurance certification.

Required decision categories are: retain class values; promote a named strategy/package; scoped buff candidate; scoped nerf candidate; or a specific designer question/known limitation. **Return up to three concrete balance priorities, not only generic “cannot infer universal balance” warnings and not another automatic roster survey.** There is no quota of numerical changes, but persistent justified outliers should receive an actionable proposal, including old/new values when supported and the mechanic that would be affected. No adoption during execution.

Boss conclusions remain a separate evidence column. This is a wide ordinary-combat screen, not certification of seven boss fights. Future tests should check a selected correction or unresolved important gap, not endlessly expand Runic Point combinations; human playtesting owns much of that discovery space.

## 9. Handoff and publication are part of completion

**Astra prepares:** one compact package catalogue with biome overrides, exact legal readbacks, source/asset identities, fixed observation ledger, zero-tick/focused check results, seeded class evidence table, and **`LUNA_RUN.md` with actual verified commands**. The document must state whether D is authorized or deferred. Routine implementation choices do not require another approval cycle. Commit/push the scoped preparation through the existing workflow; no gameplay patch or main combat during preparation.

**Luna executes:** run the authorized fixed ledger once, preserve operational failures separately from deaths, and stop at completion. Write one readable **`REPORT.md`** leading with outcomes and decisions, accompanied by a compact `results-summary.json`, `CLASS_ASSESSMENT.md`, relevant identity/build/completion receipts, and a raw-artifact inventory. No per-tick arrays or giant embedded target histories in the top-level summary. Keep large raw streams external.

**Commit AND push the scoped readable report and compact evidence. Verify the remote publication and return its branch, full publication SHA, measured SHA, report path, and planned/completed/failed/deferred/not-run counts.** Never force-push, stage unrelated work or credentials, relabel the publication revision as measured, or rerun combat for a publication problem. If push fails, state the actual failure and preserve the local report. Deployment and release troubleshooting belong to another session.

Stop after reporting. Unknown intent or an unexplained failure returns to the designer before another strategy is invented. This packet's finish line is a cross-biome T2 class assessment and a short decision list—not universally green builds.

## Source note

Map and Rune availability above were read at `e504a0db1b74764249c60558bf507b56d8cf35f3` from `shared/src/world/map/regionT2.ts`, `shared/src/biomeDatabase.ts`, `shared/src/world/nodeBiomes.ts`, and `shared/src/runeDatabase.ts`. Prior experiment counts and Apprentice outcomes are from the supplied T3 Tundra run-01/run-02 reports, with their stated measured revisions. The new allocation, duration and preparation policies are command-center instructions, not already measured results. Exact new build IDs and commands are intentionally resolved by the preparation agent against the frozen source.
