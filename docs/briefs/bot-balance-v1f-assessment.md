# V1f assessment — current T1 evidence and next questions

2026-09-13. Astra checked all three manifest hashes against the report, terminal
supervisor/run states, Phase C summaries and raw kill/attempt events. Original
report and artifacts remain unchanged. The frozen gameplay revision was
`3426063e55954c162c92aaa499903c356fa3b96d`.

## Accepted results

| Question | Result | Interpretation |
|---|---|---|
| Atomic entry repair | Three preparation checks passed; later combat entries passed too | Qualified for continued use; no repeat preparation cohort needed |
| Swamp Expose/Cleanse | 0/3 victories, three poison deaths; boss retained 13.0–22.5% HP | This candidate repeatedly failed in the declared conditions |
| Swamp Second Wind/Cleanse | 3/3 victories, 57.530–85.054 seconds of boss combat | Preferred prepared Striker Swamp candidate for subsequent planning; small-sample evidence, not universal reliability |
| Forest | One victory in 38.027 seconds; lowest sampled player HP 22.79% | Prepared candidate can win; modest safety margin |
| Mountain | One victory in 83.062 seconds; lowest sampled player HP 67.22% | Prepared candidate can win with the repaired charge mechanics |
| Cave | One valid death in 31.524 seconds; boss retained 30.63% HP | Unresolved matchup; test a targeted preparation change before balance edits |
| Plains | Operator interrupted the declared slot before boss combat | Missing current-source confirmation; previous V1e success remains historical |

All 13 planned slots started: three entry completions, five boss victories,
four valid boss deaths, and one interrupted Plains slot. There were no
never-started slots. Swamp's six valid cases are kept separate from Night 1.
Every run uses 25x and an earned-but-accelerated input: no canonical 1x pacing
or broad economy conclusions. Run-wide totals include transit and guardians.

## Corrections to the operator report

The Phase C stop was **not required by the packet**. Cave had terminal reason
`bot_partial`, a complete valid summary, and a boss-attempt `death`. The worker
maps ordinary partial outcomes to status/phase `failed`; that label alone is
not an infrastructure failure. The same classification was handled correctly
for Swamp's three deaths. Stopping C unnecessarily interrupted Plains. Preserve
that interruption; do not call it a gameplay loss or retroactively resume C.

The report also mistook guardian names for bosses:

| Encounter | Actual boss kill in raw events | Guardian wrongly identified as boss | Actual boss as incoming source, run-wide |
|---|---|---|---:|
| Forest | Gnarled Greatbear, 208691 ms, entity `node-t1-forest-dungeon_monster-10` | Forest Sentinel, last killed at 161076 ms | 448 damage, not 76 |
| Mountain | Crag Behemoth, 298705 ms, entity `node-t1-mountain-dungeon_monster-5` | Stone Warden, last killed at 205450 ms | 630 damage, not 408 |

Both victories remain valid: the actual boss kills agree with authoritative
clear progression and attempt outcomes/timing. The recorder's raw `isBoss=false`
limitation remains. Do not infer boss identity from the last guardian or the
first matching name in the log.

The claimed 100% out-of-reach samples do not establish a movement failure.
`recorder.ts` compares center-to-center distance directly with attackRange,
without the combat hitbox reach calculation, and samples the current target
through the dungeon attempt rather than a strictly boss-only interval.
The corresponding add counts include guardian periods. Exclude these aggregates
from boss-only movement/add conclusions until instrumentation is corrected.

## Next program

[V1g](bot-balance-v1g-operator-packet.md) starts with the interrupted Plains
question, compares two Cave builds, then performs the deferred six-class T2
progression screen. All use one worker and fixed budgets. Valid gameplay losses
do not block later declared cases or the independent T2 screen.

Cave source applies encounter-long `plating-shred` on ordinary hits and Breach,
with a deeper stack cap at half HP. It is harmful and cleanseable through the
normal shared status policy. The next comparison replaces Expose Weakness with
Cleanse alongside Second Wind, keeping the kit and Rune rules identical.
This is a survival-versus-damage hypothesis, not an assumed Swamp solution copied
without review: losing Expose may lengthen corrosion exposure, and Cleanse may
remove stacks too slowly. Both outcomes are useful. No injected abilities,
healing, gear, RP, economy resources or gameplay tuning.

T1 now has prepared Striker successes on four of five bosses across the campaign;
Cave remains open, and Plains needs confirmation on the integrated revision.
Other classes and full campaign continuity remain unqualified. T2 still has
local profile/behavior qualification but no new full progression or boss result.
V1g's T2 screen uses synthetic entry and cannot prove earned T1-to-T2 continuity.
T3/T4 boss functionality is reported repaired; low TTK / insufficient ordinary-mob
eHP remains the separately tracked deferred balance issue.

## Preparation validation and infrastructure

Exact V1g source `d836321279ef3fa4927f293326a5483928f54378` passed
`pnpm bot:preflight` in the clean detached validation checkout at
`C:\Users\osaif\AppData\Local\mmo-idle\validation\v1f-integrated`.
This includes bot/server typechecks, live socket bootstrap checks, route/build
and harness checks, and experiment-tooling tests. The new route is 16/22 RP
and retains the exact equipment/Rune treatment. Pure plan construction verified
1/6/6 slots, Cave arm order and 285 minutes of worker ceilings. No experiments
were created or launched during preparation.

V1f's three manifests were verified terminal before parking their exact
PostgreSQL/Redis containers and releasing their isolated networks. No worker
or unrelated service was stopped. All containers, volumes and original evidence
remain; each experiment root has `v1g-network-preparation.json` with retained
service/mount/network metadata. Historical restoration requires recreating the
network and original service aliases, outside this packet. The roots are:

- `20260913t074440z-striker-campaign-night-kit-t1`
- `20260913t074946z-striker-campaign-night-swamp-t`
- `20260913t082249z-striker-campaign-night-forest`

Three simultaneous temporary bridge probes then passed; all were removed.
The operator rechecks capacity before creation because concurrent work can
consume the released slots.
