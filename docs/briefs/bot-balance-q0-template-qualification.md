# Q0 — Template qualification and readiness preparation

Status: Astra-owned preparation, implemented as six local readiness routes. This packet describes qualification work,
not gameplay balance changes or live experiment launches.
Parent: [campaign state](bot-balance-campaign-state.md).
Audit anchor: `353d5eceeea31bd14de9eb38dbeb70dca85abc95`.

## Question and hypothesis

Can the six existing T2 entry builds and their first encounter-loadout transitions
be expressed legally and exactly under current RP rules, with an actionable
runtime readiness check for each behavior?

Hypothesis: the historical route/automation skeleton is reusable, but full-budget
ranged builds require explicit RP tradeoffs when adding tools. All six current
entry costs fit; four are already 22/22. This does not predict later transitions.

## Why this is the shortest useful work

Reuse generated profiles, shared pricing, normal intents, `DesiredBuild`, existing
preflight and telemetry. Check the first contested reservation before spending
time farming an entire tier. No class ranking, boss balancing or exhaustive frame
search is part of Q0.

## Entry states and treatments

Use exactly the six `-clean` profile IDs and seed configurations in campaign state.
Resolve them from current source, not transcribed snippets. The source profile
declares full T1 progression, T2 Sanctuary entry, no range branch and a synthetic
wallet. Preserve that labeling. Check all 18 existing profile variants using the
existing validator, but prepare runtime cases only for the six distinct builds.

For each class produce a source-derived qualification record containing:

1. Exact full `DesiredBuild`, gear IDs/upgrades, root/frame/range, tier, mastery,
   recipe/unlock proof, RP breakdown and capacity, and profile source revision.
2. The existing initial T2 farm build and first stance acquisition/configuration
   sequence, including the actual GM when it occurs. Do not assume GM30 persists
   through acquisition or that the full-budget entry makes a later stance illegal.
3. A proposed economical farming build and prepared boss build using available
   tools. Explain each departure from the historical seed. Derive all costs and
   acquisition gates live; do not silently trim rules or replace abilities.
4. A bounded runtime case proving its exact transition and distinctive behavior.
   Reuse common cases where they prove the same interface, but keep per-class
   build legality and ownership evidence.

Apply entry and build changes through existing mechanisms. Preserve historical
route controls; add new named profiles/routes for alternative behavior. Do not
invent a policy fork or hidden-state bot controller.

## Qualification procedure

1. Read project instructions and check source/diffs; preserve unrelated changes.
2. Run `pnpm bot:preflight` once. Report individual failures and distinguish
   unrelated regressions from failures of this packet. Do not waive a relevant
   failed gate because a previous revision passed.
3. Inspect the first build transitions in route source. Check exact ownership,
   ordered targets, RP legality, default stance reservation and acquisition order.
4. Inspect behavior evidence support: default firing versus custom suppression;
   Step Back priority; Chase/Keep Distance; Recover First; stance changes; relevant
   DoT targeting and Conduit reconstruction. Avoid unlocking later-tier tools in
   a supposedly ordinary T2 readiness case.
5. Add only missing focused qualification tests or bot assertions needed to
   establish these contracts. Existing isolated test-room fixtures may validate
   later mechanics if explicitly labeled noncanonical infrastructure evidence.
6. Prepare Q1 as exact runnable routes and a reviewed command/manifest proposal:
   exact profile/build/checkpoint, rewards, endpoint, limits and artifact location.
   Do not create/launch Docker experiments, queue cohorts or replay tiers in Q0.

## Replication and reward mode

Q0 has no gameplay replicates. Deterministic checks establish implementation
contracts, not success rates. Proposed Q1 begins with one bounded readiness case
per distinct class/behavior; no expansion until Astra reads the report.

Q1 recommendation: synthetic-combat-progression start and explicitly accelerated
acquisition only where needed. Select and justify the exact multiplier in Q1;
remember reward acceleration does not accelerate catalyst minting. Do not inject
future progression to bypass a gate. Measure combat from a fixed qualified build.
No economy conclusion is permitted from these cases.

## Validity assertions and metrics

Require exact source identity, entry state, equipment/upgrades, Core eligibility,
full ordered RP configuration, known/owned tools, budget, policy and reward mode.
Validate before measurement and after each dependent mutation. Confirm treatment
assertions precede checkpoint capture and terminal completion.

Report static legality separately from socket/World fixture results and actual
runtime evidence. Capture requested/observed build, error reason, RP categories,
eligible trigger opportunities, activations, unexpected suppression and state
convergence. An ability that never had a valid opportunity is untested.

## Stops and interpretation

- Q0 preparation is owned by Astra; runtime limits do not impose a preparation cutoff.
- Stop the dependent path on invalid entry, missing unlock or unexplained drift.
- Shared-controller failure blocks all affected cases; a local profile defect
  need not prevent reporting independent passing cases.
- Proposed Q1: 5-minute runtime ceiling per case. Separate fixture/setup time;
  fail promptly on invalid state. State a case-specific progress watchdog.
- Legal configuration alone does not prove firing; one successful fixture does
  not establish bot route or Docker deployment readiness.
- Do not interpret failures as numerical balance evidence or automatically retry
  a treatment under an altered configuration.

## Allowed fixes and forbidden changes

Allowed: experiment-specific route/profile data, truthful assertion expectations,
snapshot selection, intent acknowledgement/observation issues, telemetry plumbing,
and focused tests that restore the declared experiment contract. Preserve a diff
and explain every fix. Re-run only relevant checks after a change.

Forbidden: changing gameplay numbers, RP prices/capacity, acquisition rules,
ability/Rune/stance mechanics, enemy behavior, or server gameplay behavior.
Suspected engine defects return to Astra with reproduction evidence. Astra may freeze scoped preparation in a local commit; no
pushes, experiment launches or automatic follow-on campaigns in this packet.

## Deliverable

Write `docs/briefs/bot-balance-q0-report.md` and update the docs index. Include:

- inspected revision and working-tree changes;
- six qualification records and exact proposed profile definitions;
- existing checks run, results, failure evidence and remaining limitations;
- fixes with scoped diffs; distinguish source inspection from executed checks;
- a ready-to-review Q1 packet with exact commands and limits, or explicit reasons
  it cannot yet be made runnable;
- no balance verdicts and no invented runtime success.

Astra owns all preparation and subsequent fixes. Luna operates the separate Q1 packet and reports without changing treatments.
