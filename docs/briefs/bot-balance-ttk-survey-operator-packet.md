# T1–T3 fight-duration survey — executable operator packet

Prepared 2026-09-15. **Ready to execute; full survey NOT run.** Luna operates the
fixed batch below and reports; no subagents, source edits, loadout adaptation,
balance changes, automatic retries or additional experiments.

## Purpose and evidence boundary

Measure current fight durations before choosing target durations. Establish six
provisional baseline classes with medium frames and their normal range as those
layers become legally available. Compare T1, T2 and T3 and investigate the
Conduit on-hit and Slinger DoT weapon hypotheses.

This packet uses the existing **in-process server benchmark**, not the Docker
bot-route runner. It executes the actual World, combat bootstrap, auto-combat,
monster AI, ecology and normal repopulation. There is no travel or acquisition
run. Characters are explicitly synthetic, capped in reachable biome mastery and
wear legal fully upgraded gear. No claim of earned progression, normal economy,
network/client fidelity or average-player preparedness follows from these runs.
No monster stats or mechanics are modified, no enemies are removed to make a
fight easier, and deaths end the observation rather than triggering a respawn.

Simulation uses normal100ms steps and a matching simulation clock; it runs
faster than real time without increasing tick size. Each replicate is a fresh
World with its own fixed RNG seed. One process runs sequentially, with no new
Docker resources or database writes. Initial roster hashes are recorded: verify
them rather than assuming the same seed guarantees identical states. Subsequent
random consumption can diverge as builds behave differently.

## Frozen identity

| Item | Value |
|---|---|
| Source revision | `60817047ffec3065cfd9807dd09868aa08f9b2b4` |
| Source tree | `297553dc950d20b791c79cca9161a306bc29e471` |
| Survey definition hash | `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1` |
| Frozen hitboxes | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox SHA256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Qualification directory | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/frozen-qualification` |
| Qualification index SHA256 | `7A2573FF3CE1FEA9FA79F795033508CDDE873A94903EBE5DCEC207D5139C9C84` |
| Instrumentation pilot | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/frozen-instrumentation-pilot` |
| Pilot index SHA256 | `A47F60E61D596AC9CB28079A8C3417E753579FC5D9E5D9D026849376CBF9EE61` |

Hitboxes were exported read-only from the current live baked cache (406 frames).
Execution loads only that frozen artifact and refuses a missing cache. The survey
registry does not register development-only items, so its definition hash is not
the earlier Docker packet hash. This is an explicit tooling distinction.

Qualification materialized all66 builds with zero ticks, checked item acquisition
and upgrade gates, runic legality, medium-frame/range selection and nonempty node
populations. Initial roster hashes matched across classes within each tier/node
for the qualification seed. The pilot exercised three30-second windows (T1
Striker Cave, T2 Slinger Mountain, T3 Conduit Volcano) and verified kill, owned
summon damage, cast, unfinished-encounter and report-output surfaces. Those are
instrumentation samples, not the full balance dataset or evidence for tuning.
Server diagnostic and benchmark typechecks and focused metrics tests passed.
Full game tests and live browser playtests were not run for this tooling change.

## Fixed matrix

54 baseline cells = six classes × three tiers × three node roles.
12 additional cells = Conduit and Slinger alternate weapons × T2/T3 × three roles.
Each of the66 cells runs seeds173,947,2027, for198 independent observations.
Each observation lasts at most300 simulated seconds and stops on first death.
No repeat is added because an outcome looks surprising. The three seeds are
predeclared replicates, not retries. Maximum scheduled simulation:16.5 hours;
actual wall time is faster and machine-dependent.

| Intended role | T1 | T2 | T3 |
|---|---|---|---|
| Durable solo candidate | `node-t1-cave-02` | `node-t2-cave-02` | `node-t3-cave-02` |
| Small-group / Mountain candidate | `node-t1-mountain-04` | `node-t2-mountain-04` | `node-t3-mountain-04` |
| Swarm candidate | `node-t1-plains-03` | `node-t2-plains-03` | `node-t3-volcanic-03` |

These are natural populations, not forced1/3/6-enemy arenas. Measured groups
are classified by participating enemies:1,2–3,4+. The Mountain pilot yielded
single-enemy fights for a fast-killing build; do not relabel them small groups.
An episode can include successive pulls and therefore is an observed engagement,
not proof of membership in one authored pack. Retain initial and late participants.
Report actual population and enemy identities, node modifier and group sizes.
Cave and Mountain offer same-biome tier comparisons. Plains ends atT2: the
T3 Volcano swarm comparison also changes biome/ecology, so it cannot isolate tier.

## Six provisional templates

| Class | T1 weapon | T2 weapon | T3 weapon |
|---|---|---|---|
| Striker | Flash Rapier (`flash-rapier`) | Gale Needle (`gale-needle`) | Cinderlash (`volcanic-cinderlash`) |
| Squire | Heavy Hammer | Quake Hammer | Mountain Avalanche Maul |
| Apprentice | Chaotic Axe | Ruinous Axe | Cave Cataclysm Axe |
| Slinger | Ashbrand Blade | Jungle Stinger Rapier | Jungle Venomthorn Rapier |
| Conduit | Chaotic Axe | Ruinous Axe | Cave Cataclysm Axe |
| Spirit | Chaotic Axe | Ruinous Axe | Cave Cataclysm Axe |

Exact source: `server/bench/balance/ttkSurveySpec.ts`; generated qualification
`index.json` includes every full PlayerView and starting roster for reuse.

- T1: class root only. Medium frame becomes available inT2, range layer inT3.
  Do not grant future skill layers to make the labels superficially match.
- T2: balanced/medium frame for all six. T3: retain that frame, select `close`
  for Striker/Squire and `mid` for Apprentice/Slinger/Conduit/Spirit.
- Matching-biome armor and charm at the encounter's tier, Mountain boots at that
  tier, all up to+5 within their actual item maximum and progression gates.
- T1 core empty; T2/T3 Tempered Core (the unrestricted balanced core). Relic
  empty throughout. Offensive stance fromT2; no future stance granted inT1.
- Sweep and Second Wind throughout. Cleanse added inT2; Frenzy added inT3.
  T1 retains its lower RP limit: no illegal Sweep/SW/Cleanse/kiting combination.
- Auto-target, Step Back, Avoid Hazards and Recover First throughout; Orbit for
  the four ranged classes only. No rites and no manual skill timing.
- All reachable biome masteries are capped for the tier. This fixes the legal
  upgrade/RP ceiling, not farming time. Factory unlock scaffolding is removed
  before the ready record; no999 unspent points remain during measurement.

Conduit alternatives atT2/T3 substitute Jungle Stinger/Venomthorn for the axe.
Slinger alternatives substitute Swamp Mirebrand/Blightbrand for the on-hit rapier.
Only that weapon changes within each comparison. T1 Slinger uses the available
DoT weapon as its baseline; no equivalent T1 on-hit comparison is claimed.
No other weapon exploration or branch sweep is included. These templates remain
provisional: a weak result must prompt a build/mechanic review before a nerf/buff.

## Operator execution

Use one new detached worktree at the frozen revision. Preserve the shared dirty
checkout. This is deliberately not `experiment:create`: the benchmark needs no
Docker worker, services or progression checkpoint. Do not run both workflows.

```powershell
$surveyRevision = '60817047ffec3065cfd9807dd09868aa08f9b2b4'
$surveyRoot = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915'
$surveyCheckout = "$surveyRoot/source"
$surveyHitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $surveyRoot) { throw 'Output already exists; inspect and report, do not overwrite or relaunch.' }
if ((Get-FileHash -LiteralPath $surveyHitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $surveyRoot | Out-Null
git worktree add --detach "$surveyCheckout" $surveyRevision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$surveyCheckout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed; do not substitute inputs' }
git -C "$surveyCheckout" rev-parse HEAD 'HEAD^{tree}'
git -C "$surveyCheckout" status --short
```

Confirm the exact revision/tree and clean tracked source. The existing pilot
already qualified instrumentation; do not rerun it or count it as another cell.
Then execute the full batch exactly once:

```powershell
pnpm --dir "$surveyCheckout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --mode=run "--revision=$surveyRevision" "--hitboxes=$surveyHitboxes" "--out=$surveyRoot/results"
```

Record the exit status. Gameplay deaths are normal reported outcomes and do not
stop subsequent predeclared cells. The runner stops on a setup exception,2GiB
RSS ceiling or four-hour batch wall ceiling; each replicate also has a two-minute
wall ceiling. A wall-ceiling observation is censored, never a gameplay timeout.
A process interruption or failed.json ends this packet: retain partial results,
do not launch a replacement batch. One process only; no parallel workers.

After completion, or after failure if an index exists, generate the tables:

```powershell
node "$surveyCheckout/scripts/ttk-survey-report.mjs" "$surveyRoot/results"
```

A complete run must have `complete.json` reporting66 cells/198 runs, no
`failed.json`, and the expected manifest definition/hitbox hashes. Preserve the
worktree and artifacts for reproducibility. There are no newly created Docker
resources to release. Record UTC, wall duration, disk capacity and process memory;
do not prune/restart Docker or alter shared services.

## Required interpretation and report

Write `docs/briefs/bot-balance-ttk-survey-report.md` in the shared repository and
index it in `docs/README.md`. Start with generated `analysis.md` and `analysis.json`,
then inspect raw events only for specific outliers. All raw `events.jsonl`,
`samples.jsonl`, per-run `ready.json` and `summary.json` remain available.

Measurements:

1. Individual TTK starts at first positive damage or absorption caused by the
   player or an owned summon and ends at the authoritative kill. Direct, DoT,
   weapon-DoT and AoE therefore contribute. An enemy killed in its first damage
   tick has0ms on this definition: identify it as a same-tick kill, not a
   literally zero-duration attack. Multiple damage events can share that tick.
   Time resolution is100ms; the generated `oneHitWindow` field counts these
   same-tick windows and must not be interpreted as an exact attack count.
2. Damaged enemies alive at death/window end are censored, not dropped or assigned
   zero TTK. Observed HP regain flags possible healing/regeneration/reset; clean
   summary medians exclude those targets, while raw elapsed durations remain.
   HP regain is not proof of a leash reset. Maximum damage gaps remain recorded.
3. Engagement duration starts at the first observed aggression/damage and ends
   when all recorded participants die. Late joins are explicit. Unfinished or
   disengaged groups stay censored, never silently become successful pack clears.
4. Recovery is the interval after a clear until full HP/barrier and no incoming
   DoT; a new pull before recovery marks interruption. This is distinct from
   travel/target-acquisition time. One-second player samples preserve auto intent,
   targeting, position, attack timestamps, HP/barrier and remaining enemies.
5. Incoming pressure includes HP damage, largest logged hit, maximum sliding
   one-second HP-damage total, sampled minima, deaths and shield state. These are
   complementary measures; HP damage alone understates absorbed pressure.
6. Monster cast starts and fired ends are captured from actual server combat
   events, with identity and label in raw evidence. This covers emitted casts,
   not every passive mechanic; absence is not proof of missing implementation.

Required result tables: six classes by tier/node; enemy-type TTK and HP; observed
solo/small/swarm engagement durations; survival/recovery; Conduit and Slinger
weapon comparisons. Show each seed and censor/death counts beside any median.
The headline is a median of available seed medians, not hundreds of independent
replicates. Fewer than five clean kills or fewer than three seeds is sparse.
Do not rank a frequently dying build using only its quick successful kills.

Report whether Cave/Mountain duration rises or falls with tier, which casts get
an opportunity to fire, whether swarms are individually quick but collectively
oppressive, and whether any template needs qualification before comparison.
The same enemy types and initial roster hashes are the strongest comparisons;
population mix and class-driven pulling can confound a node-wide median.
Do not turn an unexplained idle window into an enemy-HP recommendation.

No target TTK, balance edits or follow-on experiment is decided automatically.
Return the evidence for discussion. The proposed ground-slam-like AoE ability or
inherent-AoE weapon remains a future design option, to assess only if the slow-build
swarm measurements establish a need. SwampT3 viability and Volcano farming
inactivity remain separate open questions; this survey does not declare them fixed.
