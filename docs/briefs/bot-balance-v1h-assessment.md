# V1h assessment and V1i decisions

2026-09-13. Astra reviewed the report, terminal resource events and current code.

V1h completed all 13 slots without infrastructure loss. Cave won 8/8 (2/2 per
arm); current Mountain won 2/2. Expose/Second Wind was the fastest Cave package
at about44.5 seconds. Swamp charm candidates had better sampled survival margins
than dual Guard with Cave charm; Brace improved the Cave-charm candidate. These
are small candidate screens, not win-rate rankings. No further T1 tuning is
justified here. Earlier T1 successes remain class/build/source-specific.

Mountain victory establishes current build viability. Discarded charge-corridor
results and missing Instinct telemetry do not establish that charge acceleration
was exercised correctly; that mechanical question remains separate from viability.

Spirit reached GM72 in about16 minutes and emitted a current Snapshot B. Striker
and Squire reached GM66/Jungle6 before timing out. Direct terminal events reveal:

| Run | Unchanged shortfall at final block | Authored farm destination |
|---|---|---|
| Striker | ruinous-axe+4: red215, wallet72, required287 | node-t2-jungle-02 |
| Squire | mountain-vest-t2+4: blue118, wallet158, required276 | node-t2-jungle-04 |

Both spent about17 minutes in these spans. These are wrong-resource routing
failures, not legitimate evidence that more time or easier mobs was required.
The prior Core catalyst acquisitions did complete; catalyst acceleration exposed
a second preparation defect. Spirit's completion does not make this common
route defect harmless. Per-biome blocked aggregates and explicit block spans
use different accounting and must not be summed or substituted for each other.

## Preparation changes

Upgrade steps can now opt into `farmForMissingResources`. T2 generated routes
and the new boss preparations opt in. The resolver reads the next authoritative
upgrade cost and live wallet, selects same-tier normal nodes for missing essence
and catalysts, and reselects between resource spans. It prefers a node producing
both where available; otherwise essence is earned first. Explicit frozen farming
policies retain their old behavior without opt-in. No reward or balance change.

Spirit's original file is a tier2-handoff-labelled Snapshot B containing current
T2 mastery/items. Ordinary entry validation correctly rejects that as a T1-to-T2
entry. New routes explicitly require `resumePreparedT2`: full T2 mastery, tier2,
no T2+ clears, spent skill point, preserved root/frame and all existing strict
checks. Conversion marks the entry profile prepared-t2/synthetic progression;
it never rewrites or relabels the source file. The actual source passed166
offline checks with no findings; the ordinary import still rejects it. Live
atomic spawn validation remains mandatory. Runtime HP/cooldowns are reset by
the existing entry path, not replayed as historical combat state.

## V1i scope

Eight runs across three manifests: two30-minute progression checks (Striker,
Squire), four20-minute independent Spirit Plains attempts (Axe/Needle twice),
and two20-minute Spirit Forest attempts. Three hours of worker ceilings, four
hours total. The phases share no output snapshots and boss phases are independent
of progression success, subject to infrastructure/entry/build stop rules.

Spirit boss cases use the same original V1h snapshot and earn four equipped items
to+5 normally. Cave Vest, Mountain Charm, Plains Boots and Tempered Core stay
fixed. Plains compares Ruinous Axe's heavier/dead-swing package with Gale Needle's
faster cadence for Energy generation: Sweep + Expose + Second Wind, defensive
stance, unchanged orbit/telegraph/hazard/recovery rules,29/30RP. This is a whole
weapon comparison, not a claim to isolate attack speed alone.

Forest uses Axe, Expose + Second Wind + Brace, defensive stance and the same
movement rules,28/30RP. Brace is learned normally; its default low-HP trigger is
retained, not replaced by an untested cast-trigger rule. Plains preparation uses
its final package; Forest prepares under the same farming package then switches.
Preparation effort is separate from guardian and boss outcomes.

Success advances us toward remaining T2 bosses and additional class candidates.
A boss loss with confirmed readiness triggers an encounter-specific alternative,
not a broad rerun or automatic nerf. A preparation failure is classified by its
actual resource/build problem. T1 broad class coverage remains later acceptance
work. T3/T4 low ordinary-mob eHP/TTK and normal-speed economy studies remain deferred.
