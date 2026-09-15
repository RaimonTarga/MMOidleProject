# Durability 2 — T2/T3 elite lifetime and pressure calibration

Prepared 2026-09-15. READY; full batch NOT executed. Luna operates once and
reports. No subagents, source/build adaptation, live balance patches or retries.

## Decision from Durability 1

The completed 576-observation trial took44m41s, with13 deaths and no runner
failure. Its manifest/index hashes were rechecked against the report. T3
Cavern Troll high-treatment clean medians ranged4.90–10.90s; Mountain Colossus
3.55–10.50s. These remain below the user's provisional20–30s toughest-enemy
target. No T3 Cave/Mountain deaths occurred, but that does not certify stronger
treatments. T2 is UNFINISHED: current data is a measurement control, not a
balanced reference. Its toughest enemies have a provisional10–20s target.

Tundra cannot receive the same blanket increase: Glacier Bear high had clean
lifetimes above140s for Conduit. Source confirms its recurring shell is
`shieldPct * maxHp` (`monsterMechanics.ts`); increasing HP strengthens the shell
too. This is a plausible nonlinear contributor, not a completed causal audit.
Jungle/Volcano/Swamp inactivity remains a separate movement qualification issue.
Desert is closer to the intended durations for some classes and needs its own
controller/dealer analysis. These cases are held out of this focused batch.

Slam and the proposed T2+ attack-driven Sweep cooldown reduction can wait.
Continue ordinary-elite calibration now; compare old/new abilities in a later
frozen swarm trial after implementation and proc/cadence qualification. Do not
use these current ability results as a final swarm or class balance verdict.

## Fixed treatment matrix

Natural nodes and populations; only the named enemy definition is overlaid:

| Node | Target enemy | HP-low | HP-high |
|---|---|---:|---:|
| node-t2-cave-02 | cave-troll (Cave Troll) | x2 | x3 |
| node-t2-mountain-04 | granite-titan (Granite Titan) | x2 | x3 |
| node-t3-cave-02 | cavern-troll (Cavern Troll) | x3 | x5 |
| node-t3-mountain-04 | mountain-colossus (Mountain Colossus) | x3 | x5 |

Five arms for every node/build: control; HP-low; HP-high; HP-low-soft;
HP-high-soft. Soft means target elite base attack x0.75, rounded, at identical
HP. Compare each soft arm directly to its corresponding unchanged-attack arm.
The large HP brackets are probes motivated by the gap to target, not approved
live multipliers and not a promise that all classes land inside the band.

Only target HP/base attack change. Companions, plating, DR, DoT defenses,
population, rewards, attack interval, cast duration/multiplier and AI stay fixed.
Normal repopulation inherits the overlay. Mountain's existing low-health ward
scales with HP; retain it and report its exposure rather than assuming linear
HP-to-TTK scaling. Attack x0.75 affects attack-derived basics/slams, not an
arbitrary universal final-damage multiplier; player mitigation also makes the
realized incoming reduction nonlinear. Non-target attackers retain full damage.

Eight builds per node: six existing survey baselines plus Slinger DoT and
Conduit on-hit alternatives. Exact code: server/bench/balance/durability2Spec.ts,
reusing ttkSurveySpec.ts. Same legal fully upgraded tier gear, medium frame,
normal range when available, runes/abilities/stance/mastery as the original
survey. Matching biome armor/charm, Mountain boots, Tempered Core, no relic.
No new techniques, defensive build adaptation, future skill layers or boss runs.

4 nodes x8 builds x5 arms =160 cells. Seeds173,947,2027 =480 observations.
300s each, stop on first death; maximum40 simulated hours. Approximately40–60
minutes wall time is a planning estimate only. One sequential process;2GiB RSS,
two-minute replicate and four-hour batch wall ceilings. Interruption/failure
ends this packet with partial evidence; no replacement or extra attempt.

## Evidence and frozen inputs

Real in-process World, normal100ms combat/AI/ecology/repopulation; synthetic
fully prepared players and experimental stats. No travel, earned progression,
economy, network/client or human-feel claim. No Docker/services/database writes.

- Source revision: `9fc34ff94b0d6a82490bcc32c8036f25105ccc84`
- Source tree: `5f2b2b0da07a9e14ee149d8af19e6cadf615c1e2`
- Untreated definitions hash: `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability2/frozen-qualification`
- Qualification index SHA256: `6EF82B2AF72391BA384A17DEC3519340435CA102936DA992680FF4B6CB8BD5DE`

All160 cells qualified with actual target elites, legal builds and populations.
Preparation verified matched initial geometry, intended spawned HP/attack,
unchanged companions/plating/DR. Three30-second pilots exercised control,
reduced-attack T2 Cave and high-HP T3 Mountain with alternate Conduit, and report
generation passed. Pilot artifacts at the sibling `pilot` directory precede
the source commit and therefore name its parent; instrumentation evidence only.
Overlay/isolation tests and diagnostic/bench typechecks passed. Full repository
suite and browser tests were not run. Qualification is zero-tick setup evidence.

## Execute exactly once

Run from shared repo; preserve its dirty files and use a detached source tree.

```powershell
$dur2Revision = '9fc34ff94b0d6a82490bcc32c8036f25105ccc84'
$dur2Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915'
$dur2Checkout = "$dur2Root/source"
$dur2Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur2Root) { throw 'Output exists: inspect/report, never overwrite or relaunch.' }
if ((Get-FileHash -LiteralPath $dur2Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur2Root | Out-Null
git worktree add --detach "$dur2Checkout" $dur2Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$dur2Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
git -C "$dur2Checkout" rev-parse HEAD 'HEAD^{tree}'
git -C "$dur2Checkout" status --short
```

Verify exact revision/tree and clean tracked source, then:

```powershell
pnpm --dir "$dur2Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability2 --mode=run "--revision=$dur2Revision" "--hitboxes=$dur2Hitboxes" "--out=$dur2Root/results"
```

Record exit status. Deaths advance to the next declared observation. If index
exists, generate tables even after a partial failure:

```powershell
node "$dur2Checkout/scripts/ttk-survey-report.mjs" "$dur2Root/results"
```

Require complete.json160cells/480runs, mode run, trial durability2, matching
hashes and no failed.json for completion. Retain checkout/results, no Docker
cleanup or service restart. Do not rerun qualification/pilot as another batch.

## Required report and decision boundary

Write docs/briefs/bot-balance-durability2-report.md, index in docs/README.md.
Include UTC/wall time, outcome counts, resource observations, artifact hashes
and paths. Generate analysis first, then inspect relevant raw outliers.

1. Verify geometryRosterHash for each paired seed/build/node. Check hpTreatment
   (includes beforeAttack/afterAttack) and ready.initialStats against controls;
   only named elite HP/attack may differ. Later ecology/RNG may diverge.
2. LEAD with named-elite TTK for each class/weapon/arm, all three seed medians,
   kills, unfinished targets and HP-regain flags. Do not judge the elite target
   band using a whole-node median dominated by unchanged companions. Use
   first-positive-damage-to-kill; same-tick0ms is not an instantaneous attack.
3. Compare T2 to10–20s and T3 to20–30s as provisional bands for these toughest
   enemies at this preparation level, not hard pass/fail for every class.
   Report shorter/inside/longer, with sparse/censored/death context. Where
   needed compute per-enemy seed medians from index.targets; the generated
   perType median pools kills and is not a substitute for seed-level evidence.
4. For equal HP, show whether reduced attack changes survival, peak hit/1s
   damage, minHP, recovery and interrupted recovery. Identify the actual killer:
   unchanged companions may remain the problem. Retain cast starts/fired ends
   and ward-related traces; no blanket '25% less pressure' assumption.
5. Show class/weapon spread. Keep Slinger DoT and Conduit on-hit comparisons
   descriptive; neither switch becomes an automatic template decision. A slower
   weapon may have survival benefits; dying fast builds cannot win by clean TTK.
6. Audit long outgoing-damage gaps including owned summons, HP regain,
   unfinished engagements and movement. Natural episodes can merge pulls and
   repopulation; do not label them authored-pack clears. No survival inference
   from a full-health idle window. Cap/ward/regen thresholds need explanation
   before interpreting a non-linear result as a simple HP requirement.

Return candidates, not live edits. If a bracket approaches the duration band
without excessive pressure across builds, recommend a narrower value and a
targeted defense-identity comparison against that HP/attack reference. If all
arms remain short/long or pressure fails, show which axis needs adjustment.
Do not endlessly expand defensive stats or automatically choose a winner.
User decision comes when there is a concrete pacing/survival/class tradeoff to
approve. T2 remains unfinished. Boss-duration work and later Slam/Sweep swarm
comparisons remain on the campaign roadmap.
