# Bot experience experiments: command-center handoff

Implemented 2026-09-11. This is the operating guide for the external model coordinating practical economy, route and build experiments. These features collect and compare real character runs; they do not calculate simulated balance outcomes or automatically change game balance.

## Capabilities

| Feature | Entry point | Result |
| --- | --- | --- |
| Explain a run's progression | `pnpm bot:timeline` | JSON activity/purpose timeline, resource blocks, route steps and build/progression markers |
| Reusable player behavior | `--policy` on bot runs; `policy` in study arms | Authored, affordable-upgrade, early-boss or familiar-gear behavior |
| Controlled replicated experiments | `pnpm experiment:plan`, then normal create/launch | Sealed explicit arms, replica pairing, rotated launch order |
| Progression decisions | Route `choice` metadata; arm `choices` | Explicit alternative sequences using normal game intents |
| Human calibration | `pnpm bot:calibrate` | Windowed human/bot observations with mismatch flags and coverage |

Use `pnpm bot:preflight` before long runs. It includes the real socket/build harness checks, policy/choice checks, existing experiment scheduling tests, and the new timeline/comparison/calibration tests. A green preflight validates infrastructure and route semantics, not balance or realistic human behavior.

## First study

All commands below run from the repository root. Paths containing spaces need PowerShell quotes. The examples are checked-in JSON files; the planner reads them without starting Docker or characters.

```powershell
pnpm experiment:plan --revision=HEAD --study=scripts/experiment/examples/affordable-upgrades.json --count=3 --out=tmp/affordable-plan.json
```

Review the plan's question, arms, replicas, budget and shared runner settings. Then freeze a **committed revision containing this implementation**:

```powershell
pnpm experiment:create --revision=HEAD --study=scripts/experiment/examples/affordable-upgrades.json --count=3 --workers=2 --maxRunMs=21600000
pnpm experiment:launch --id=EXPERIMENT_ID
pnpm experiment:status --id=EXPERIMENT_ID
pnpm experiment:report --id=EXPERIMENT_ID
pnpm experiment:compare --id=EXPERIMENT_ID --out=tmp/affordable-comparison.json
```

Replace `EXPERIMENT_ID` with the actual create result. The implementation has not automatically committed this checkout or launched these studies. `--revision=HEAD` excludes dirty working-tree edits. Creation rejects a study revision lacking the choice implementation. All existing isolation, snapshot sealing, worker limits and zero automatic retries remain in force. Canonical T2 still requires a real Snapshot B file/directory; pass `--requireTierEntrySnapshot=true` to forbid fallback. Never use synthetic starts or accelerated rewards for economy conclusions.

`experiment:report` remains the existing resource/cohort report. `experiment:compare` is the new gameplay comparison. It verifies the manifest checksum and reads the summary path recorded for each scheduled run; missing or malformed summaries stay visible as unavailable/invalid evidence.

## Study schema

```json
{
  "schemaVersion": 1,
  "question": "Do early boss attempts offset the cost of postponing upgrades?",
  "factor": "choice",
  "choiceId": "boss-preparation",
  "arms": [
    { "id": "prepared", "route": "striker-decisions-t1", "policy": "intended", "choices": { "boss-preparation": "prepared" } },
    { "id": "early", "route": "striker-decisions-t1", "policy": "intended", "choices": { "boss-preparation": "early" } }
  ]
}
```

There are 2–8 arms; IDs use lowercase letters, digits and hyphens. `factor` is `route`, `policy`, or `choice`. Only that declared input may vary. For `choice`, name `choiceId` and set it explicitly in every arm. Unknown fields, repeated arm IDs, duplicate treatments and changes to additional inputs are rejected. Do not combine `--study` with `--routes` or `--policies`. `--count` is replicas per arm, not total characters.

Source revision, snapshot inputs, reward settings, budget and completion mode are shared at experiment level. Arm IDs, replica/pair IDs and choices are preserved through plan, manifest/state and worker configuration. The first arm is the comparison baseline. Launch order rotates by replica. Pairing shares inputs; it does **not** imply matched random seeds, synchronized encounters or deterministic combat.

A `policy` factor may alter several player decisions. A `route` factor may alter several build/ordering decisions. Those estimate the whole policy/route effect, not an isolated mechanic. To isolate one decision, use a `choice` study and hold the other inputs constant.

## Profiles and shipped decision route

| Policy | Behavior |
| --- | --- |
| `intended` | Existing authored progression, upgrades and Rune configuration |
| `rusher` | Existing minimal upgrades, less farming, skipped optional preparation and starter Runes |
| `generic` | Existing reduced upgrades/farming and generic defensive configuration |
| `affordable-upgrades` | Intended behavior except upgrade steps buy only while the next upgrade is currently payable; a gate/resource shortfall ends that upgrade step, with a reason event |
| `early-boss` | Intended behavior with authored `boss-preparation=early` |
| `familiar-gear` | Intended behavior with authored `gear-adoption=keep` |

Affordable upgrades do not reserve a percentage of the wallet, skip mandatory crafts, or revisit deferred purchases automatically. Later authored upgrade steps may buy more. Other route farming can still earn currency. This isolates “farm specifically for upgrades” from the existing intended policy.

Early-boss and familiar-gear profiles require the corresponding decision in the selected route; unsupported routes fail before connecting. Explicit arm choices override profile preferences. They do not add tactical intelligence or bypass Rune constraints.

`striker-decisions-t1` is an opt-in derivative of the current Striker baseline:

- `boss-preparation=prepared` (default): upgrades stay at their original progression locations.
- `boss-preparation=early`: all top-level upgrade steps before the first boss are postponed until after that boss step. The boss step can end in victory or attempt exhaustion. Other farming, crafts, skills and Rune preparation remain authored. This also changes equipment strength during pre-boss farming; it is a progression policy, not a boss-only damage test.
- `gear-adoption=replace` (default): retain the baseline's later boss equipment swaps.
- `gear-adoption=keep`: keep the first boss kit instead of the later equipment swaps. Techniques and Guards still follow the route.

The existing baseline IDs and controlled-cohort membership are unchanged. The `boss-preparation.json` example exercises the first choice. Change that example to a `gear-adoption` choice study to compare `replace` with `keep`.

## Authoring more decisions

Add `choice: { id, option, defaultOption }` to existing `RouteStep` entries. Every step tagged with the selected option remains in the route; the other options are removed once before execution. Untagged steps always remain. Several steps can belong to one option. The same decision must use one default, and that default must exist. Unknown overrides/options are errors. Nested `repeatUntil` and `ifPossible` steps are traversed too.

```typescript
{ type: "craftStance", recipeId: VALID_STANCE_RECIPE,
  choice: { id: "stance-timing", option: "early", defaultOption: "early" } },
// ... shared authored progression ...
{ type: "craftStance", recipeId: VALID_STANCE_RECIPE,
  choice: { id: "stance-timing", option: "later", defaultOption: "early" } },
```

`VALID_STANCE_RECIPE` is a placeholder: resolve a live legal recipe before authoring. Use the same mechanism for evolution/reconstruction sequences, weapon adoption, or alternative biome ordering. Include all required equip/unequip/build dependencies in each branch. A branch doing nothing can contain a named milestone. Route completion and milestones remain shared; use distinct routes if endpoints differ, and do not treat unlike endpoints as a fair duration comparison.

Selected choices appear in `run.behavior.choices`; successfully reached tagged steps emit `build-change/system=policy-choice` and appear in the final `run.behavior.reachedChoices`. Selection is not proof a branch was reached. The comparison refuses a choice contrast without reached-choice evidence. Use explicit treatment assertions at important boundaries to prove the desired equipment/build actually existed; a reached step does not prove every subsequent prerequisite succeeded. Test every authored branch, not just the default. The raw route registry contains all alternatives, so static ordering tools must resolve choices before reasoning about a particular treatment.

## Reading a run timeline

```powershell
pnpm bot:timeline --summary="ABSOLUTE_RUN_DIRECTORY/summary.json" --out=tmp/run-timeline.json
```

The command reads sibling `events.jsonl`. Output includes:

- `segments`: merged intervals with start/end, node, activity and route purpose.
- `activityMs`: one partition of sampled time: combat, dead, travel, waiting, idle, unavailable.
- `purposeMs`: a separate partition such as farm, blocked, boss, travel or craft.
- `blocks`: resource/gate spans with initial/end reasons; unfinished spans are censored.
- `steps`: authored route intervals, including unfinished steps.
- `markers`: equipment, upgrades, build changes, deaths, mastery/tier changes and milestones.

Activity is an approximation from normal observations at the existing sampling cadence. Combat means a target or attacker was observed. Travel means travel intent outside observed combat. Idle does not prove recovery, and an unavailable state does not prove a gameplay stall. The first sample and gaps over three seconds are unavailable. Older streams without the new samples have unknown activity rather than invented estimates. Unrecorded tail time is unavailable too.

**Never add activity totals to purpose totals.** Resource blocks overlap fighting/farming, and nested route steps overlap their parents. Do not add those to zone time either. A span with multiple resource/gate blockers does not establish an exclusive causal breakdown: inspect wallet, mastery and gate events to determine what changed. `summary.economy.zoneTiming` remains the authoritative existing zone aggregation. Timeline events explain its context.

## Reading a comparison

Every scheduled row retains terminal status, completion, duration if available, progression, deaths, economy context and eligibility issues. `evidenceClass` separates completed, incomplete-observation, invalid and unavailable records. Incomplete runs have false canonical/completion eligibility flags in the existing summary by design; that alone does not make them harness failures. `provisional` identifies reports with unfinished or missing scheduled records. Each replica lists whether a completion-time contrast is usable. A usable pair requires completed eligible members, matching observed start state/class/economy/rewards, correct source and arm provenance, and observed choices when applicable. Incomplete rows are not assigned zero completion time. Missing prep/harness artifacts are not gameplay failures.

Arm distributions contain `n`, median, p10, p90, min and max. Positive duration deltas mean slower than the first arm; negative means faster. These are descriptive sample quantiles, not confidence intervals. Report both successful completion counts and unfinished/invalid counts: completed-only timings have survivor bias. Inspect where unsuccessful builds stopped before ranking them. Three replicas is an example starting budget, not a claim of statistical sufficiency. No report automatically declares a winner, retries failures or adjusts balance.

Observed start state is new provenance; older summaries without it cannot supply paired controlled comparisons. Matching inputs still does not prove behavior resembles a human. Canonical flags describe admissible evidence, not experimental truth.

## Human calibration

Use actual logs from the existing in-game human playtest recorder. This command does not start/stop the recorder or fabricate sessions. The native streams must have a `run-end` covering the requested window.

Copy `scripts/experiment/examples/calibration-window.json` and replace its label/timestamps with equivalent progression windows (milliseconds relative to each recording's start):

```powershell
pnpm bot:calibrate --bot="BOT_RUN/events.jsonl" --human="HUMAN_RUN/events.jsonl" --window=tmp/calibration-window.json --out=tmp/calibration.json
```

Review class/source/reward mismatch flags, both headers, build evidence and sampled coverage first. Then inspect windowed kill/death counts and combat fractions. Human world events are attributed to the player or owned summons; other players' kills are excluded. Human combat fraction is time weighted because its sampling interval changes in combat. Gaps remain unknown. Bot and human combat detection differ, so combat-fraction differences are diagnostic leads, not exact behavior equivalence.

The caller must verify equivalent starting gear, mastery, location and activities; matching elapsed time alone does not establish this. Header frame is a start-of-recording value and can be stale for later windows. The report returns build evidence for manual review and never labels the pair calibrated. Native human logs do not currently support a complete wallet/resource-block timeline equivalent to the bot's. Repeat human playtests before accepting any calibration or balance adjustment.

## Command-center operating rules

1. State the question, treatment, shared endpoint, start/snapshot, replicas and time budget before launch.
2. Verify all branches and legal progression gates with preflight and a bounded practical run before a long cohort.
3. Freeze a committed source and sealed inputs. Record the resulting experiment ID.
4. Preserve every terminal outcome. Diagnose prep/harness invalidity separately from gameplay stalls. Do not auto-retry or silently pool replacement attempts.
5. Produce the existing resource report, the study comparison, and timelines for outliers/incomplete runs.
6. Report observations, interpretation, uncertainty and proposed tuning separately. Human realism remains a calibration question requiring actual playtests.

Implementation locations: `bot/src/policy/choices.ts`, `bot/src/policy/profiles.ts`, `bot/src/routes/strikerDecisionsT1.ts`, telemetry recorder/summary, and `scripts/experiment/{study,experience,experience-cli}.mjs`. Party experiments, optimized play agents, automatic tuning, exact replay and matched RNG seeds are not implemented by this change.

## Implementation validation

Validated locally on 2026-09-11: `pnpm typecheck` passed across packages and benches; final `pnpm bot:preflight` passed, including real socket/build checks, native human recorder, new activity sampling, choices/affordable spending, existing route/template checks, paired-study reports and calibration fixtures. Both shipped study examples produced six-run dry plans. Scoped whitespace checks passed. No long economy cohort or new human calibration session was launched, and this turn did not rerun the entire repository test suite. These are implementation checks, not new balance findings.
