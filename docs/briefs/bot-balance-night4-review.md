# Night 4 planner review and next-stage recommendation

Reviewed 2026-09-16. Source report: [Night4](bot-balance-night4-report.md).
Analysis only: no live balance changes, new experiment implementation or launch.

## Evidence and interpretation

Verified all three manifest/index hashes against the operator report, frozen
revision115297985869598fe49b215a2c40e19b331b998f and complete counts504/144/288.
936 observations completed in62m55s, with37 deaths, not tooling failures.
Read raw indices, selected death event streams and authoritative attack/ability
and measurement code. Operator TTK tables remain the duration reference; this
review independently checked provenance/death identities, not every table cell.

The broad pass is useful: it separates already-calibrated elites, short-lived
unadjusted bodies, and encounters where attrition already constrains HP increases.
Do not translate an under-band strongest body into an automatic global HP factor.

## Findings that support decisions

- Cave/Mountain elite duration is broadly in the intended neighborhood across
  two nodes: T2 approximately15–19.5s centers; T3 approximately22.7–28.4s.
  Retain these HP values as anchors rather than chase every node into the band.
  Mountain pressure remains separate: six T2 deaths and one T3 death in A.
- T2 Desert is the urgent existing-pressure exception. Striker died in all six
  runs, plus two Apprentice deaths. In all eight inspected final30s windows,
  Sun Scarab damage exceeded the individual controller contribution. This supports
  testing the T2 dealer analogue, not copying a T3 HP increase into T2 unchanged.
- T3 Desert's same-HP comparison supports dealer attack80% as a local candidate:
  Striker minimum HP rises0.8%->38.8% with effectively unchanged controller TTK.
  HP3x/dealer80% has zero baseline deaths, centers21–22s, and one alternate
  Slinger death. It is the leading combined candidate; confirm node05 and inspect
  the alternate failure before selecting live values. Do not force25s by another
  HP increase while Conduit already takes38–44s in that arm.
- Bear fixed-capacity shell remains preferable to HP-proportional shell growth
  for this durability work. Increasing HP1.5x->2.5x produces only12.8->17.38s
  center while Apprentice deaths increase0->2 and alternate Slinger0->3.
  At HP2x the alternate also dies3/3. Across those nine Tundra deaths, raw final30s
  events show Bear as the largest damage source every time; Rime Caster contributes
  to some. This supports a Bear output/control-exposure follow-up, not more HP alone.
  Do not nerf the caster or all Tundra enemies based on these deaths.
- Forest/Jungle/Plains/Swamp contain many short-lived bodies. Broad changes should
  differentiate the durable member from smaller bodies. Jungle ape/Silverback and
  Swamp shell enemies are sensible next durability candidates; Forest wolf and
  Plains bull roles should receive smaller exploratory changes. Swarm health and
  cumulative pressure must be assessed per group, not against the elite band.
- Slam is promising for Squire in T2 Plains and T3 Volcano: observed Scuttler
  kills70->128 and cleared recorded episodes23->48 across six runs, with no Squire
  deaths in either arm. These are screening results, not independent pack trials.
  T2 Jungle Squire minimum HP falls60.3%->2.9% with Slam despite no deaths.
  Do not declare Slam universally better or nerf either ability from this batch.

## Corrections and measurement limits

1. All zero attackBeats rows are Conduit: A84, B36, C48. The runner counts changes
   to the PLAYER lastAttackAt. Conduit uses the summoner root, and formation AI
   advances MINION lastAttackAt. These zeros do not establish inactivity or a
   Volcano-specific failure. Conduit damage/kills are present. Likewise zero player
   incoming damage does not capture attacks absorbed by its minions.
2. Body TTK starts at first damaging/absorbed event and ends at kill. A one-hit
   kill legitimately yields0ms but omits acquisition and pre-hit charge time.
   Compare Slam using engagement-to-clear time as well; do not call it instant.
3. Sweep's generic cleave excludes the primary target. Slam's direct AoE can hit
   that target. Low Sweep secondary-hit counts in sparse Jungle encounters may
   reflect limited splash opportunities, not merely missing telemetry or a broken
   activation. Conduit secondary-damage adapter events record a delivery/budget
   against the primary BEFORE applyPlayerAoe selects secondary targets; they are
   not themselves proof that a distinct secondary enemy was damaged. Deduplicate
   adapter versus damage events before comparing true hit counts across classes.
4. Recorded episodes are damage/target-connected lifetimes. In the runner, enemies
   targeting the player and owned damage touch episode membership; minion aggro
   is not equivalent to player aggro. A surviving or regained member can keep an
   episode open across later pulls. Thus zero cleared episodes with many kills
   does not prove an unkillable authored pack. Recoveries inherit this boundary.
5. Lava-contact samples demonstrate contact, not an unresolved escape loop.
   Volcano still warrants inspection of position, targets, gaps, regains and actual
   contact duration, but the zero-attack argument must be removed from that case.
6. Bear absorb events are available; explicit break/vulnerability chronology is
   not. Targeted instrumentation would help separate shield break reward and
   player exposure. It need not block unrelated roster durability experiments.

## Recommended next experiment, not yet prepared

Keep six medium-frame baseline classes and normal close/mid range choices,
three seeds, two nodes, frozen current code and no adaptive operator decisions.
Keep weapon alternatives only where existing results identify a meaningful tail.

### Main work: transfer durability by enemy role

Run one grouped screen across under-tested T2/T3 roles, instead of another long
ladder on Cave/Mountain. Compare current definitions with a proposed conservative
role package: roughly2x HP on selected durable ape/shell bodies and1.5x on selected
Forest/Plains sturdier pack members, keeping small swarm bodies/dealers unchanged.
Exact species and factors must be checked against definitions and observed role
before freezing a packet. These are exploratory factors, not approved live stats
or an attempt to reach elite duration in one step. Keep attacks/DR/plating fixed
in this block; measure cumulative pressure and class tails alongside duration.
Use results to select a shared rule for each role and list local exceptions.

### Targeted pressure block

- T2 Desert: current versus dealer attack80%, controller HP unchanged first.
- T3 Desert: current versus HP3x/controllers plus dealer80%, nodes03/05; retain
  Slinger alternate and Conduit tail. Same-HP causal dealer evidence already exists.
- Bear: HP2.5x with original shell capacity, attack100% versus80%, nodes03/05;
  include failing Apprentice/Slinger alternative. Do not increase HP again yet.
  Inspect slow/root/attack sequence and minion exposure; consider a separate
  control-ability substitution later if failures are avoidable with a credible build.

### Small measurement preparation, no mass rerun

Make attack counters class-aware, distinguish primary/secondary technique hits,
and add engagement/charge timing needed for fair AoE comparisons. Inspect existing
Volcano raw runs before deciding whether a new diagnostic run is needed. Preserve
old body-TTK for continuity. Do not invalidate the entire936-observation batch or
repeat it solely to improve one counter.

No further full Sweep/Slam matrix yet: carry it into the durable-swarm follow-up
once enemies survive long enough for the ability tradeoff to matter. Boss TTK,
T4, broader item/class balance and x1 economy remain later stages. Next progress
should be a transferable roster proposal plus a short exception list, not an
indefinite attempt to perfect each enemy before looking at the next one.
