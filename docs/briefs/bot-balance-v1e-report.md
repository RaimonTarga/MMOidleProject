# V1e execution report — earned T1 entry and first Plains encounter

2026-09-13 local time; the sealed worker ran on 2026-09-12 UTC. This is the
one exact execution authorized by the [V1e operator packet](</C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1e-operator-packet.md>).
No source, route, manifest, runtime, economy, assertion, retry, resource
injection, tactical intervention, guardian bypass, budget extension, cleanup,
reconciliation, snapshot edit, or follow-on run was made.

## Result

**Disposition: candidate possibility demonstrated.** The imported earned T1
Striker completed the Plains dungeon guardian cycle and produced an
authoritative `plains:1` clear with a `Tusked Razorback` kill in one authored
attempt. It did not die, retry, or use a boss/guardian bypass. This is evidence
for this declared candidate only; it is not a canonical 1x economy result, a
class-wide balance claim, or a comparison against another charm.

The summary marks the treatment `valid` and the run `isolated`, while retaining
`canonical=false`, `soloBaselineEligible=false`, `combatEvidenceEligible=false`,
and `economyEvidenceEligible=false` because the run used the packet's 25x
accelerated rewards. Replication and charm comparisons require a later
decision.

## Frozen provenance and setup

| Field | Recorded value |
|---|---|
| Experiment | `20260912t225510z-striker-campaign-plains-entry` |
| Run | `001-striker-campaign-plains-entry-t1-intended-r01` |
| Artifact run ID | `striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255` |
| Frozen revision | `40f0ebb7dd0f4c557a640f974388823d8ef713f1` |
| Source tree | `18384d706a734b956d8df7d966ef70ee4bd99af5` |
| Image | `sha256:8c57ac9ab501cd4a94f1af7843f9507ea481815ae7c20b44ed6e282f77126a3c` |
| Build ID | `885932920d3e8e86ffa0aa88` |
| Tooling hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` |
| Runtime tree hash | `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Manifest SHA-256 | `e1493c7aa24362a08ac27f558e1d9af3f26c6b03aa7d2b2b7f56393e219b4d44` |
| Mode / worker / policy | `smoke-isolated` / 1 / `intended` |
| Reward / cap | 25x / `900,000 ms` |
| Automatic retries / fast boss retry | 0 / `false` |
| Entry | `clean` plus the imported file Snapshot B |

The [sealed manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/experiment.json>)
and [manifest digest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/experiment.sha256>)
record the exact source, image, one-run configuration, and copied input. The
[copied runtime](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runtime/lib.mjs:70>)
retains the six-byte temporary suffix and bounded 20-attempt atomic-rename
retry. The image labels and build metadata agree with the frozen revision,
source tree, build ID, and tooling hash.

The V1d source file was used unchanged. Its SHA-256 was
`7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29`; the
[original V1d Snapshot B](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/snapshot-b.json>)
retains `snapshotKind=tier2-handoff`. The sealed copy in the V1e manifest has
the same digest and is a file input at `/inputs/tier-entry/snapshot-b.json`;
no directory, Snapshot A, synthetic profile, or relabeled snapshot was used.

`pnpm bot:preflight` passed before creation and launch. The invoking checkout
was dirty only from concurrent human-playtest telemetry; those untracked
directories were excluded from the frozen image and preserved.

## Entry validation and build

The recorded profile and spawn validation passed: `profilePass=true`,
`spawnPass=true`, `checked=213`, and `failures=[]` for profile
`snapshot-striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475-b`.
The [run-start record](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:1>)
also records the imported state and the `tierEntry` assertion.

At entry the state was level 127, player Tier 1, GM30, `cadence-root`, no
frame, no stance, no Rite, no Core, no Relic, no cleared bosses, and full
164/164 HP at Clearing. The imported equipment and upgrades were:

| Slot / item | Entry state |
|---|---|
| Weapon | `chaotic-axe` +5 |
| Armor | `plains-vest-t1` +5 |
| Recovery — Murk Eye | `swamp-charm-t1` +5 |
| Mobility — Fleet Boots | `plains-boots-t1` +5 |
| Other upgrades | `iron-broadsword` +1, `plains-charm-t1` +2, `flash-rapier` +4, `mountain-vest-t1` +4 |

The input had no target, no active effects/buffs, and auto and auto-traverse
off. Known abilities were `sweep`, `second-wind`, `cleanse`, and
`expose-weakness`; only Sweep and Second Wind were attuned. The exact equipped
rules were Always → `auto-path-enemy`, Inside Telegraph → `step-back`, In
Combat → `chase-enemy`, Always → `avoid-hazards`, and Always →
`wait-for-regen` (Recover First).

The ordinary swap used the already-owned `plains-charm-t1` (Plains Stone),
starting at +2. It upgraded +2 → +3 for 30 Yellow essence, +3 → +4 for 45,
and +4 → +5 for 45, then equipped it in the recovery slot. The [upgrade
events](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:35>)
show the first step; the [final upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:42>)
and [equip](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:46>)
complete the transition. Total swap cost was 120 Yellow essence. There was no
resource block, craft, catalyst gain, or fresh mastery/kit acquisition;
`totalBlockedOnResourceMs=0` and the only three upgrades were these authored
charm steps.

The [verified build event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:56>)
records `v1e:verified-plains-build`, exact rule convergence, and observed RP
19/22. The following [entry-ready milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:59>)
passed at 3,118 ms with Tier 1, GM30, and no cleared bosses.

The final observed build was Chaotic Axe +5, Plains Vest +5, Plains Stone
(`plains-charm-t1`) +5, and Fleet Boots (`plains-boots-t1`) +5; Sweep / Second
Wind; no frame, stance, Rite, Core, or Relic; and the same five equipped rules.
The [post-run Snapshot B](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/snapshot-b.json>)
records the final loadout and upgrades. Its nearest recorded post-encounter
state was Tier 1, GM30, level 155, 113.745584/164 HP, attack 51, max HP 164,
recovery 12, plating 16, damage reduction 0.02, attack range 12, speed 149,
slash/cadence. There is no dedicated state snapshot at the exact boss
engagement timestamp, so the level/stat row is explicitly post-encounter, not
silently presented as an engagement-time capture. GM30 is observed at entry
and in the final state, with no tier-up event.

## Encounter boundaries

| Boundary | Observed evidence |
|---|---|
| Build/setup | Readiness completed at 3,118 ms; setup and charm swap took 3,118 ms from run start. |
| Authored attempt cycle | `v1e:plains-attempt` started at 3,118 ms and emitted one `boss-attempt` start at 3,119 ms. |
| Ordinary travel | Clearing → Swamp 06 at 19,599 ms → Swamp 04 at 51,607 ms → Swamp 05 at 83,612 ms → Plains dungeon at 114,615 ms. No travel combat, death, or resource block occurred. |
| Guardian phase | Started at 114,753 ms with 12 guardians; ended at 156,835 ms with 0 alive, `cleared`, duration 42,082 ms. |
| Altar activation | No `altar` event is emitted. The 10,012 ms from guardian clear to the recorded boss combat start is preserved as an unobserved internal interval, not attributed to altar activation. |
| Boss appearance | No separate boss-spawn/appearance event is emitted. |
| Actual boss engagement | `bossCombatStartedAtMs=166,847`; combat ended at 213,395 ms after 46,548 ms. |
| Boss result | Tusked Razorback kill at 213,030 ms; attempt end at 213,896 ms with `outcome=victory` and `bossHpFraction=0`. |
| Run terminal | Route step ended at 213,897 ms; run ended at 213,920 ms with completed duration 213,919 ms, well below the 900,000 ms cap. |

The [dungeon guardian start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:232>)
and [guardian clear](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:312>)
are separate from the [boss-attempt result](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:427>).
The route had 17/17 completed steps, one guardian cycle, and one authored boss
attempt; the authored cycle counter is not being used as a fight count.

## Combat and boss evidence

The run recorded 24 kills: 12 guardian kills before the guardian-clear event,
11 non-boss add kills after boss combat began, and one Tusked Razorback kill.
The [Tusked kill event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:425>)
names `Tusked Razorback`, targets `node-t1-plains-dungeon_monster-13`, and
grants 5,000 Yellow essence, but its payload has `isBoss=false`. The
[authoritative attempt record](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:427>)
reports the boss victory and the summary's progression records
`bossesCleared=["plains:1"]`; both facts are retained without rewriting the
event's flag.

| Measure | Observed result |
|---|---:|
| Boss attempts / victories | 1 / 1 |
| Boss combat duration | 46,548 ms |
| Boss terminal HP fraction | 0 |
| Player damage dealt | 3,409 |
| Damage taken | 399, all direct |
| Aggregate healing | 318 |
| Deaths | 0; `deaths.jsonl` is empty |
| Target switches | 11 |
| Sweep activations | 11 |
| Second Wind activations | 2 |
| Step Back activations / attempts | 0 / 0 |
| Hazard escape attempts / successes | 0 / 0 |
| Other players seen / contested samples | 0 / 0 |

The highest incoming source was Tusked Razorback at 342 damage, followed by
Field Hare 39, Prairie Defender 14, and Boar 4. The lowest sampled player
`hpFraction` in the boss combat window was 0.549388 at 204,624 ms; the last
sample before the kill was 0.750455 at 212,626 ms. The post-run snapshot's
113.745584/164 HP is a later last-state observation and is not the lowest HP.

Boss-window concurrency samples show up to five other monsters present with
the boss; the broader 99-sample boss diagnostic summary reports mean others
4.48 and maximum others 12. No boss phase event or phase-specific HP series
was emitted, so phase transitions are unobserved beyond the terminal
`bossHpFraction=0`.

Target telemetry shows the bot returning to Tusked Razorback's target ID at
197,623 ms after clearing add targets; the target was then killed at 213,030
ms. The [target return](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:397>)
and [kill](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl:425>)
are both in the preserved event stream.

No event kind exposes a Plains Charm-specific recovery activation, healing
window, or heal attribution. The stream has no `heal` or `recovery` event;
therefore the aggregate 318 healing is not attributed to Plains Charm.

## Economy boundary

The run retained the packet's `NON_CANONICAL_REWARD_MULTIPLIER` taint and the
recorded T1 candidate F economy policy. Initial and final essence wallets were:

| Essence | Initial | Final |
|---|---:|---:|
| Red | 11,502 | 11,502 |
| Blue | 20 | 20 |
| Green | 1,559 | 1,559 |
| Yellow | 10,601 | 17,981 |
| Purple | 303 | 303 |

The only spend was 120 Yellow for the Plains Charm +2 → +5 swap. Plains
encounter rewards supplied 7,500 Yellow; no catalysts were gained or spent.
The result is therefore a candidate encounter possibility, not evidence for
1x pacing, charm balance, or a class-wide tuning decision.

## Terminal agreement and evidence disposition

The [supervisor event stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/supervisor-events.jsonl:4>)
records `run-terminal status=completed reason=bot_completed`, followed by
supervisor completion. The [worker result](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/worker-result.json>)
and [completed healthy heartbeat](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/worker-heartbeat.json>)
agree. The worker result is `completed/bot_completed`; the heartbeat ended with
`phase=completed`, `lastHealth.status=ok`, and zero consecutive health
failures.

The [cohort summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/cohort-summary.json>)
agrees on 1/1 completed run, max memory 154.8 MiB, max container CPU 51%,
event-loop p99 30.1 ms, and 44 resource samples. The [full summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/summary.json>)
and [event stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/events.jsonl>)
are preserved with SHA-256 values `ee9fd04e0d86068065a47db2647094dff628bad9a2fc416f15fc498d2c465d0c`
and `db826c0466b2ac9074edb338fe351555c670110d3fda8816b682696be9bd1ff3`.
The preserved [empty deaths stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t225510z-striker-campaign-plains-entry/runs/001-striker-campaign-plains-entry-t1-intended-r01/artifacts/striker-campaign-plains-entry-t1-intended-2026-09-12T22-58-54-130Z-3f5a7255/deaths.jsonl>)
has SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Observed result: this exact imported earned T1 Striker, after the affordable
Plains Charm swap, cleared the Plains dungeon and killed Tusked Razorback in
one bounded authored attempt. Interpretation: the declared candidate can
complete this encounter under the accelerated test economy. Uncertainty:
altar activation, boss appearance, boss phase transitions, exact
engagement-time level/stats, and Plains Charm-specific healing attribution
were not separately recorded. No automatic winner, impossibility claim,
balance change, replication, or follow-on run is authorized by this packet.
