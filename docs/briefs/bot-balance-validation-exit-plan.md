# Validation exit and transition to balance checks

Updated 2026-09-15. Planning document, not an executable operator packet.
Astra plans/prepares; user launches Luna for fixed batches. No subagents or balance
changes are authorized by this plan. Keep current gameplay definitions frozen
until a concrete change is approved.

## What is already established

The selected reference is an expert-prepared Heavy Spirit -> ranged Wisp ->
Voidwalker family, with encounter-specific legal gear/abilities. It is not one
immutable loadout, an all-class balance result, or a fresh canonical economy run.

T3 has six of seven boss diagnostic wins; Swamp remains unresolved. T4 has farming
candidates in all seven biomes across V1y/V1z/Night3, but these are limited node/
modifier/package samples. Mountain T4 boss passed4/4 and does not need another
routine replica. Six T4 bosses remain unscreened. Separate returned checkpoints
must not be combined into a fictional character or uninterrupted campaign.

Night3 was12/12 route completions, but raw logs qualify the success statement:
Volcano control had a572051ms continuous idle-classified interval, full sampled
HP, zero attackers and monsters present. Last target kill at423068ms, after a
successful lava escape at420067ms; measurement ended995264ms. This supports a
productive-farming gap, not a diagnosed hazard bug. Colossus had a much shorter
longest idle interval67009ms. Therefore221 vs91 Volcano kills is not a reliable
relic-DPS comparison. The Colossus arm still demonstrates sustained farming
survival, and the control demonstrates some pack kills and a recovered return.

Graveyard Colossus reached sampled9.9% HP versus64.4% control. Mountain control
averaged44.0295s versus49.535s Colossus. Prefer empty relic as the provisional
Mountain reference; neither result establishes universal relic balance.

## Stage 1 - Close the measurement gap

Before interpreting another Volcano arm comparison, inspect the pause following
lava escape: movement/target acquisition, recovery ownership, hazard avoidance,
reachable targets and barrier/effect state. Seek the actual reason; full HP alone
does not prove all recovery prerequisites were satisfied. Ask for human context
if the intended recovery/target behavior is unclear.

Prepare a short fixed Volcano diagnostic using the original control and retained
source/state where reproducible. Record activity reason, target/path/movement,
HP/barrier/debuff/hazard state and recent combat progress around prolonged idle.
Use bounded event-triggered records rather than permanent per-tick log expansion.
Preserve seed/environment when possible; explicitly label a new-world replay.

Add a productive-activity qualification to reporting: a long auto-enabled window
with no engagement must be flagged for review, even when the route completes.
Do not automatically call all idle time a bug or require arbitrary kill quotas
across biomes. Declare thresholds for the focused diagnostic based on observed
recovery/encounter cadence. No more control-versus-relic throughput interpretation
until the long gap is explained or excluded with an explicit evidence boundary.

The Night3 diagnostic TypeScript error is our preparation defect: the final
profile edit passed possibly undefined passive values. Narrow actual numeric
values and verify them; do not silence with defaults or alter runtime values.
Historical frozen Night3 remains unchanged. Fix the current diagnostic before
freezing another packet. This does not invalidate recorded live boss victories.

## Stage 2 - Finish T4 boss coverage

Prepare one breadth packet for the six remaining bosses, with one independent
ordinary attempt each, first-death stop and safe returned captures. Proposed
order: Jungle, Desert, Tundra, Trench, Graveyard, Volcano; confirm after source
review of guardians, mechanics and bidirectional paths. Do not dispatch from
this planning document. Freeze a fully qualified packet first.

Use a single declared actual checkpoint, preferably first Night3 Mountain control
return, after verifying its file/state hash and legal restore. This retains the
earned Mountain4 seal. No pooling mastery/seals from other Night3 cases. Any
purchases must pass ordinary recipe, mastery, upgrade, RP and wallet checks.
Preserve Wisp range; use the user's attack-speed strategy as a baseline, with
abilities/equipment tailored to each encounter. Empty relic is a provisional
reference; Colossus can be a declared candidate where the mechanic supports it.

Do not replay the entire preparation history or repeat Mountain. Do not require
all remaining mastery caps before trying a boss. Conversely, a failed+2 attempt
is not proof a boss is overtuned: check reachable stronger preparation, control
options and encounter behavior before recommending balance changes.

Six independent cases do not earn six seals on one character. Require named boss
kill, victorious attempt and authoritative matching seal for every accepted win.
Report guardian, boss and return outcomes separately. A return failure preserves
a verified encounter win but does not supply a reusable progression checkpoint.
Continue other predeclared cases after gameplay failure; stop on invalid shared
setup/infrastructure. No operator adaptation, balance patch or automatic retries.

## Stage 3 - Resolve only the exceptions

For any failed boss, distinguish entry/controller defect from tactical failure
and game tuning. Prepare one focused, source-grounded alternate build or better
legal preparation; ask the user for a targeted playtest when counterplay is
unclear. Do not repeat unchanged failures or launch a broad parameter sweep.

Keep Swamp T3 explicitly open. A human win with a documented legal setup is
useful viability evidence and a bot-behavior reference; distinguish it from an
automated clear. If no human test is available, prepare one focused anti-pool/
DoT candidate after inspecting the actual low-health pool and movement behavior.
Do not relabel this unresolved boss as validated to accelerate the scoreboard.

Graveyard's narrow Colossus survival margin is a robustness concern, not a failed
beatability gate. A defensive follow-up may run beside boss coverage, but do not
make repeated comfortable farming screens a prerequisite for progress.

## Exit criteria and what is not required

The accepted validation target is a viable expert-prepared reference strategy
for each required encounter, with correct ordinary preparation and usable bot
behavior. One verified boss win can establish sampled beatability; repeat only
when the result is ambiguous, marginal or fails to exercise the intended test.
All-class coverage, every relic variant, perfect win rates and fully upgraded
gear everywhere are not prerequisites for the first balance pass.

Close six T4 boss entries and Swamp T3, resolve/contain the silent Volcano
inactivity, and retain explicit progression/return evidence. Reconcile any final
campaign completion requirement against source before claiming the whole game
is end-to-end validated. Do not impose a new from-zero1x grind as a validation
gate: canonical economy/pacing is intentionally later. If a final continuous
route is requested, reuse earned checkpoints and prove continuity separately.

An isolated controller problem should not block balance measurements for other
clean encounters. Begin scoped balance measurements once their encounters are
viable and measurement is reliable, while keeping remaining exceptions visible.
There is no need for an indefinite extra validation phase.

## First balance pass - mobs

Prepare comparisons by encounter role and expected concurrent enemy count:
solo/small-group enemies versus swarm fodder/supports. Freeze the reference
build and record upgrades/mastery, incoming burst/attrition, kills, fight/recovery
time, concurrency and mechanic exposure. Do not compare unlike gear tiers or
call kill throughput per-target TTK.

The user's first question is higher-tier enemies dying before their mechanics.
Minimum measurement needed: identified target first engagement/first damage and
kill time with a stated definition, relevant cast completion/interruption, and
player downtime reason. Capture discharge sources only if needed to explain a
specific anomaly. Add bounded authoritative telemetry to support the question,
not a general instrumentation rewrite.

Use those measurements to propose small biome/role-specific HP, damage or
mechanic adjustments. Avoid a blanket T3/T4 HP increase that also buffs swarm
fodder. Test a proposed change against the same reference and representative
encounters; obtain approval for the actual balance edit. Current Night3 data
alone does not justify a new buff or nerf.

## Subsequent balance order

After a useful mob baseline: items/relic tradeoffs with reliable activity and
comparable encounters, then classes/ranges/build interactions, then canonical1x
acquisition/pacing runs. Additional classes can provide spot checks during mob
work, but exhaustive class balancing comes later. Preserve clear separation
between expert beatability, measured balance and typical human difficulty.

Next deliverable: a qualified Volcano diagnostic and remaining-T4-boss operator
packet, with exact source/input hashes, routes, treatments and reporting gates.
This plan does not launch or claim those experiments are already prepared.
