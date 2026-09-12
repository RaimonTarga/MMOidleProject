# V1e assessment and T1/T2 status

2026-09-13. Astra checked the sealed manifest digest and durable terminal events
against [V1e's report](bot-balance-v1e-report.md). The prepared Striker achieved
an authoritative Plains clear in one ordinary dungeon cycle, no deaths, roughly
47 seconds of boss combat and a lowest sampled combat HP fraction near 55%.
Entry validation passed all 213 checks; the charm swap required no farming.

This is a current candidate success, not proof of canonical economy, reliability
or superiority of Plains Charm. All source/run reward taints remain. The kill
event's `isBoss=false` is a confirmed recorder limitation: `recorder.ts` currently
writes that literal for the world-event kill stream. Preserve it unchanged and
corroborate boss kills with the named victim, dungeon attempt outcome and
authoritative boss-clear progression. Do not use that flag alone for overnight
boss counts. Healing-source attribution and exact engagement-time stats remain
missing; aggregate healing cannot establish charm contribution.

## Current confidence

| Tier | Supported by current campaign | What remains open |
|---|---|---|
| T1 | Earned Striker end-of-T1 preparation, live restored entry, natural transit recovery, one Plains kill with exact build | Other four bosses, repeatability, other classes, full campaign continuity and current 1x pacing |
| T2 | Six profiles passed legal acquisition/build and two local behavior windows each | Current full progression after XP/RP/engine changes, later build transitions and all current campaign boss coverage |
| T3/T4 | Outside this overnight campaign | User reports insufficient ordinary-mob eHP and unfinished boss mechanics; tuning/mechanics work remains pending |

T1/T2 are the more finished content tiers and appropriate targets for balance
investigation, but neither has a current comprehensive balance acceptance result.
Earlier T2 studies remain useful: the September 10 focused campaign completed
164 terminal runs and identified a Jungle engagement collapse; prior canonical
pacing studies found long mastery farming. Those outcomes precede relevant
engine, RP and XP changes. They guide targeted checks, not current failure rates
or unchanged pacing claims. See [focused campaign](t2-focused-experiment-2026-09-10.md)
and [pacing study](t2-economy-pacing-analysis-2026-09-10.md).

## Next program

[Night 1](bot-balance-night1-operator-packet.md) expands current gameplay evidence:
one missing armor upgrade earned once, independent T1 boss probes from that
common preparation, and six T2 progression screens. It deliberately avoids
repeating the whole fresh preparation route or requiring earlier boss wins to
unlock later test cases. All interventions and budgets are frozen in advance.

The user's manual finding motivates a specific Swamp comparison: Expose Weakness
plus Cleanse (17 RP) versus no Technique and Second Wind plus Cleanse (16 RP).
Equipment and ordered Rune rules are identical. Unused RP remains unused; no
unrelated rule is added to fill the budget. Three runs per arm alternate order.
This tests the damage/sustain tradeoff; it does not assume two Guards are better.

No gameplay tuning is applied overnight. Valid failures can motivate morning
build alternatives, harness diagnosis or concrete balance proposals. T3/T4 are
excluded regardless of whether tonight's work finishes early.

## Preparation validation

The exact frozen source `0514ad0139b7c4d6a48b3512ae496857de8f4164` passed
bot preflight in a clean detached validation checkout, including bot/server
TypeScript checks, route/loadout/harness checks and experiment tooling tests.
Focused campaign route tests also passed. Pure plan construction verified phase
counts of 1, 6, 12 and 6, totaling 25 runs and 7h50 of maximum run time.
The nine-hour session ceiling includes setup and reporting. No experiment was
created or launched during preparation.

Four completed historical experiments had only their verified PostgreSQL/Redis
services stopped and disconnected from their exact isolated networks, then the
empty networks removed. Containers, database volumes and evidence were retained.
Each experiment root holds a `night1-network-preparation.json` receipt:

- `20260912t225510z-striker-campaign-plains-entry`
- `20260912t185404z-apprentice-campaign-local-beha`
- `20260912t154251z-striker-campaign-readiness-t2`
- `20260912t162628z-striker-campaign-behavior-t2-s`

Four simultaneous temporary bridge networks were then created successfully and
removed, proving capacity for the four planned manifests at preparation time.
Concurrent activity can change capacity; Luna stops on infrastructure failure.
Any future restoration of those historical services requires recreating their
isolated network and original PostgreSQL/Redis aliases before restart; it is not
part of tonight's work.
