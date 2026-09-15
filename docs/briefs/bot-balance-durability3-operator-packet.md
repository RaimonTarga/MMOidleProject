# Durability 3 — defense identity and T2 companion pressure

Prepared2026-09-15. READY; full batch NOT run. Luna operates exactly once;
no subagents, source changes, build adaptation, retries or live balance edits.

## Purpose and source findings

Replace some experimental HP with defenses, preserving useful class differences.
Separately identify which T2 Mountain companions need lower output. T2 remains
unfinished; provisional toughest-enemy bands are10–20s T2 and20–30s T3.
Neither band applies to swarm bodies or mandates identical class performance.

Durability2's corrected named-elite table is the reference. Its original table
overwrote baseline Slinger/Conduit with alternatives and contained a spurious
T3 Spirit death. Always join exact manifest cell IDs and alternate flags.
At high HP, actual T3 baseline ranges were Cave16.05–29.70s and Mountain
19.40–28.40s. No high-HP T3 deaths. T2 Cave benefited from reduced troll attack;
Mountain still had companion pressure. A final10s HP-damage audit found, e.g.,
Conduit T2 Mountain high seed2027: Eagle307, Thrower56; Spirit high seed947:
Eagle224, Thrower44.525. Killing blow attribution alone was misleading. Repeated
same-seed traces across arms are not independent confirmations.

Verified source semantics, left UNCHANGED:
- `combat.ts` resolves plating/DR before `onHit`. `weaponEffects.ts` funds
  reservoir DoT from that resolved hit (excluding empowered bonus), with a
  Slinger effectiveness adjustment in `classSecondaryDamage.ts`. Reservoir
  ticks do not apply plating/DR again. Thus these weapon DoTs are not generally
  pre-mitigation armor bypass tools.
- Apprentice ordinary class stacks use their own attack-derived application;
  `dotPrototype.ts` monster ticking applies vulnerabilities/final modifiers,
  not monster plating/DR. Do not mistake the player-receiving-DoT half-DR rule
  in that file for monster mitigation. This audit concerns the baseline paths,
  not every later branch or shield interaction.
- Cave Troll/Cavern Troll root1700ms, then slam wind-up2000/2200ms. Nominal
  unrooted remainder is only300/500ms if those timers begin together; actual
  event ordering, collision and Cleanse eligibility matter. Keep the rush
  fantasy. A shorter root/more post-root escape time is a future proposal,
  not a change in this packet. Cast multipliers and patterns remain unchanged.

No DoT resistance is added. A sustained advantage is acceptable. A roughly4x
TTK advantage over peers is a REVIEW flag after checking sparse kills,
censoring, proc/mitigation and builds, not an automatic nerf or live decision.

## Fixed matrix

Same four natural nodes and eight builds as Durability2: T2/T3 Cave02 and
Mountain04; six baselines plus Slinger DoT and Conduit on-hit alternatives.
Named targets: cave-troll, granite-titan, cavern-troll, mountain-colossus.
Exact executable definitions: server/bench/balance/durability3Spec.ts.

| Defense arm | Target HP vs live | Target defense |
|---|---|---|
| reference | T2 x3; T3 x5 | Existing |
| hp-trim | T2 x2.4; T3 x4 | Existing |
| plating | T2 x2.4; T3 x4 | Existing plating +8 T2 / +16 T3 |
| dr | T2 x2.4; T3 x4 | DR = 1 - (1 - original DR) x0.8 |

DR replaces the20% HP reduction with nominally equivalent direct-hit eHP
before rounding, penetration, DoTs or shields. Actual authored DR: T2 Cave
0.264, T3 Cave0.28, Mountain0.20. Plating amounts are exploratory, not declared
equivalent eHP across weapons. Compare plating/DR to hp-trim to isolate the
defense effect; compare to reference to judge the entire HP/defense exchange.
Mountain wards still scale with HP; record this endogenous consequence.

Target attack is fixed across defense arms: T2 Cave x0.75 live base attack;
all other targets x1. All companions remain unchanged in these four arms.

T2 Mountain only adds three pressure arms at reference HP/defenses and full
Titan attack: eagle-soft (stone-eagle attack x0.75), thrower-soft (peak-archer
attack x0.75), both-soft (both). Compare with the SAME reference arm; no defense
and companion changes are combined. Attack rounding applies, and player
mitigation makes realized damage reduction nonlinear. All attack patterns,
cast times/multipliers, cadence, rewards, population and ability rules stay fixed.

4nodes x8builds x4defense arms +1node x8builds x3pressure arms =152 cells.
Seeds173,947,2027 =456 observations. Each300s, first death stops that observation.
Maximum38 simulated hours; approximately40–60 minutes wall time, not guaranteed.
Two-minute replicate/four-hour batch wall and2GiB RSS limits remain. One process,
sequential worlds. No Docker. Runtime-only stat overlays restore after each world
and apply consistently to normal repopulation. No live definitions change.

Fully prepared legal +5 synthetic gear, medium frames, normal range when
available, matching biome armor/charm, Mountain boots, Tempered Core, no relic;
existing survey abilities/runes/stance/mastery unchanged. No acquisition,
travel, economy, persistence, client or human-feel evidence. No Slam/Sweep changes.

## Frozen identity and qualification

- Revision: `5d64868501ebb3f3c877e1980ffbe0e0e269ec28`
- Tree: `f1d790774df9b09a6ccb72ceaf154e870b565f24`
- Untreated definitions: `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability3/frozen-qualification`
- Qualification index SHA256: `4BE4753E33108DFBA4D009449D8EE432EEA803A255111A9F36D2C7DB266C9A32`

All152 cells qualified. Initial geometry and actual attack/defense comparison
checks passed; overlay/restoration test and server diagnostic typecheck passed.
Three30s pilots exercised Apprentice DR, Slinger alternative plating and both
companion reductions; report generation passed. Sibling pilot directory records
the parent revision because it ran before committing identical runtime code.
These are instrumentation checks, not treatment outcomes. Full game suite and
live/browser tests were not run. Do not repeat pilots as another batch.

## Execute once

From shared repo, preserving its dirty files:

```powershell
$dur3Revision = '5d64868501ebb3f3c877e1980ffbe0e0e269ec28'
$dur3Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915'
$dur3Checkout = "$dur3Root/source"
$dur3Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur3Root) { throw 'Output exists; inspect/report, never overwrite or relaunch.' }
if ((Get-FileHash -LiteralPath $dur3Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur3Root | Out-Null
git worktree add --detach "$dur3Checkout" $dur3Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$dur3Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
git -C "$dur3Checkout" rev-parse HEAD 'HEAD^{tree}'
git -C "$dur3Checkout" status --short
```

Verify exact revision/tree and clean tracked source, then:

```powershell
pnpm --dir "$dur3Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability3 --mode=run "--revision=$dur3Revision" "--hitboxes=$dur3Hitboxes" "--out=$dur3Root/results"
```

Record exit status; deaths continue to next declared cell. Interruption/failure
ends packet, no retry. If index exists, generate tables even for partial results:

```powershell
node "$dur3Checkout/scripts/ttk-survey-report.mjs" "$dur3Root/results"
```

Complete requires152cells/456runs, trial durability3, mode run, no failed.json
and correct hashes. Preserve source/results; no Docker/services to clean up.

## Required report

Write docs/briefs/bot-balance-durability3-report.md and index in docs/README.md.
Record identity/hashes, times/resources and all partial/death outcomes. Verify
geometryRosterHash within seed/build/node; hpTreatment records before/after
HP, attack, plating and DR; initialStats verifies actual spawned values.

- Show all32 node/build combinations and seven arms where applicable. Label
  baseline/weapon-alt from manifest.alternate, not parsed class name alone.
  Show named-elite per-seed clean medians, kills/censors/HP-regain and deaths.
  Use median of seed medians; do not substitute whole-node or pooled-kill TTK.
- Compare defense vs hp-trim and vs reference. Report baseline and alternate
  weapon ratios, class spread, casts/wards, recovery and pressure. Apprentice
  strengths are allowed; flag repeated roughly4x speed advantages against the
  median other baseline class TTK AND list pairwise ratios/counts. A single
  sparse or dying comparator does not justify DoT resistance.
- User highlighted Stone Eagle's opening dive. Source: Skyfall Rend has1000ms
  cast, damageMultiplier1.75 and a cast-charge-strike engage sequence. Separate
  its opening strike from ordinary Eagle attacks using cast/charge chronology;
  do not assume every Eagle hit is a dive. Base-attack reductions affect both.
  If dive spikes dominate, recommend a later multiplier-only comparison that
  preserves ordinary attack. Do not implement that change during this batch.
- For pressure arms show pre-death10s and30s damage by attacker/type, absorbed
  damage where available, peak hit/1s, HP minima, recovery and death attribution.
  Include nearby enemy counts and root/slam/cast chronology for relevant Cave
  spikes. If Cleanse use/cooldown cannot be reconstructed, explicitly leave it
  unknown; do not infer a cleanse bug from death alone.
- Preserve inactivity diagnostics, owned-summon outgoing damage, unfinished
  encounters and same-tick kills. Natural episodes may merge pulls/repopulation;
  they are not authored-pack clears. Repeated seeds can diverge after initial
  state, and differences in HP-scaled wards are part of the treatment.
- Recommend concrete candidate profiles/pressure changes or state why evidence
  is insufficient. No operator-chosen follow-on trials, resistance, mechanics,
  live patches or class nerfs. Return for user/Astra decision. Boss TTK, other
  biomes, hazard/retargeting investigation and future Slam/Sweep remain separate.
