# Durability33 — post-repair Jungle regression, T1 Mountain earned entry, gated Jungle breadth

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches,
commits or pushes. Three separately reported blocks, 84 observations.

## Purpose and hypotheses

| Block | Question | Hypothesis | Observations |
|---|---|---|---:|
| A `jungle-repair` | Do the diagnosed Jungle stalls recover on repaired source? | The escape owner now admits on the navigation footprint, so a player stopping on a bush edge escapes instead of idling. | 12 |
| B `mountain-entry` | At a defensible earned entry, does 2.2 → 1.8 change T1 Mountain outcomes? | Unknown. Durability32 showed the multiplier is not the lever at its two contexts; this is the context where it could be. | 36 |
| C `jungle-breadth` | What usable T4 Jungle durability evidence exists once navigation is trustworthy? | Unknown. Coverage and gross durability only. | 36 |

Report the three blocks separately. **Never pool them.** Three seeds is a directional sample,
not statistical certification. All evidence is synthetic: `synthetic=true`,
`economyEligible=false`. Legal build state is not proof the gear was earned.

## What changed since Durability32, and why this packet exists

Durability32's Jungle cutoffs were **not** a second undiagnosed bug. Recomputed from its raw
samples, all 18 wall-ceiling rows plus one window-ended row end with the player centre
1.6–21.9 px **outside** a slow bush with its navigation footprint overlapping; none end inside.
The escape predicate tested the centre point, so it could never fire in exactly the band where
hazard-aware planning had already died. Admission now uses `moverOverlapsBlockShapes` with the
mover's pad — the same primitive the nav grid blocks cells with.

Durability32 also authorized its breadth block on `verifySurvey` alone, which certifies only
artifact shape, so five correctly recorded cutoffs still opened the gate. **That was a tooling
defect, not operator disobedience.** Block C now depends on a behavioral gate.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `e4e39bc59a270da94f9461fb8afbdf94c8690c9a` |
| Frozen tree | `aa24ae5ae6ed8b5713f62698fbe6401384d43241` |
| Definitions hash | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability33` |
| Simulation | 100 ms fixed step, natural ecology |
| Navigation diagnostics | **off** — gameplay screen, not a profiling packet |

The frozen revision contains the footprint repair, its measured-coordinate fixtures, the
navigation gate and this tooling.

## Block A — Jungle repair regression (12)

The four Durability30/31/32 setups, seeds `44017`, `46021`, `48017`, window 120 simulated
seconds or first death. T4A builds, no overlay (`ready.hpTreatment` must be `[]`).

| Cell | Node | Root |
|---|---|---|
| `dur33-t4a-jungle-03-apprentice-baseline` | node-t4-jungle-03 | apprentice |
| `dur33-t4a-jungle-03-slinger-baseline` | node-t4-jungle-03 | slinger |
| `dur33-t4a-jungle-05-apprentice-baseline` | node-t4-jungle-05 | apprentice |
| `dur33-t4a-jungle-05-spirit-baseline` | node-t4-jungle-05 | spirit |

Historical seeds are reused **deliberately, to revisit known failures**. Post-repair
trajectories will differ; this is not a fresh independent confirmation and exact event-prefix
equality with Durability32 is not expected.

### Frozen acceptance predicates — decided before results are read

`server/scripts/navigationGate.ts` computes these from sample positions against the frozen
geometry. Exposure is **never** inferred from the presence or absence of a `hazard-escape`
event: a repair that fails to fire emits no event either.

| Field | Meaning |
|---|---|
| `scenarioExposure.exercised` | the trajectory entered a feature's padded avoidance envelope at least once |
| `verdict: trapped` | ends inside the padded envelope with ≥10 s stationary, target-less, path-less tail — the diagnosed signature |
| `verdict: unexplained-cutoff` | a `wall-ceiling` with no identified cause |
| `navigationGate: fail` | any trapped or unexplained row |
| `navigationGate: inconclusive` | nothing was exercised, so the repair was never tested |
| `navigationGate: pass` | at least one row exercised the envelope and no row is trapped or unexplained |

An ordinary gameplay death after real exposure is a **gameplay result**, not a navigation
failure — and zero deaths is not the gate. A row that never approached a feature is
**not-exercised**, which is neither pass nor fail on its own.

For reference, run retroactively over Durability32 this gate returns `fail` for both Jungle
blocks (Block A: 5 trapped; Block C: 12 trapped + 1 unexplained).

## Block B — T1 Mountain at the route's earned entry (36)

Six roots × two arms × three fresh declared seeds (`57001`, `59021`, `61003`), window 300
simulated seconds or first death, node `node-t1-mountain-01` (heavy).

### Why a third context, and why only one

Durability32 tested two contexts and neither can answer the question:

- `first-arrival` (+0 previous-biome gear): 29/36 deaths in 13–26 s, **29 of 41 fatal blows
  overkilled** the HP they hit, and 10 of 12 matched pairs died at the identical millisecond.
  A ~13 HP reduction cannot move an outcome there.
- `prepared-farming` (+5 local gear): flips were **symmetric**, four each way, 6/18 deaths in
  both arms.

Checked against the shipped T1 route (`bot/src/routes/apprenticeV2T1.ts`), a character on first
travel to Mountain has maxed Forest and Swamp and carries **+3** gear including a Swamp vest
and charm. Durability32's preset was materially weaker than the game's own progression. This
block uses the route's actual arrival kit.

| Slot | Value |
|---|---|
| Weapon | class T1 weapon (striker `flash-rapier`, squire `heavy-hammer`, apprentice/conduit/spirit `chaotic-axe`, slinger `ashbrand-blade`) |
| Armor | `swamp-vest-t1` |
| Recovery | `swamp-charm-t1` |
| Mobility | `plains-boots-t1` |
| Upgrades | **+3** |
| Guards | `second-wind` (tier default, unchanged from Durability32) |

**Exactly one delta** from Durability32's first-arrival: the earned kit. Guards stay at the
tier default so this does not become a guard experiment in the same arm.

### Treatment

`control` = 2.2 (current authored), `candidate` = 1.8. The overlay changes exactly one field,
`ridge-archer.chargedAttack.multiplier`, installed per observation and restored in a `finally`
on success and failure. HP, basic attack, cast time, cooldowns, range, AI, population,
geometry, Cliff Hopper and global mitigation are untouched. Every `ready.json` carries
`{type:'ridge-archer', before:240, after:240, beforeAttack:2.2, afterAttack:<arm>}` — the HP
columns are equal **by design**. `assertDurability33Definitions()` pins the archer, the Cliff
Hopper, and the T1 Runic Point budget, and aborts on drift.

### Counterplay, and a constraint the operator should not try to fix

Power Shot authors no `aoe`, so no `slam-telegraph` zone is published and the Step Back rune
never sees it; `hasMobileMonsterCast` is true, so the archer tracks through the wind-up and
neither Orbit nor leaving range denies it. A stun or freeze during the cast does abort it.

**Brace is the only mitigation counterplay and is not affordable at T1.** The budget is 22 and
Sweep (6) + Second Wind (6) + Brace (5) plus rune logic does not fit — 23 for a melee root,
more for a ranged root that also pays for Orbit. This is a design question for the command
center, recorded here so the result is not misread as "the player declined to mitigate". Do
not grant a future-tier tool or disable ordinary automatic behavior to work around it.

### Required evidence

Per root/arm/seed: terminal outcome and exposure; **attributed** Power Shot and Strong Kick
events with HP immediately before, concurrent attackers and short-window damage; largest hit
kept **separate** from attributed cast damage; minimum HP; recovery and quiet gaps; kills,
productive-combat time, body TTK and actual encounter duration; paired survival transitions in
both directions.

`scripts/charged-cast-audit.mjs` produces the attribution and only counts a cast that a
`monster-cast-end` with `fired:true` ties to a damage event from the same monster within
200 ms. Anything else is reported unresolved rather than guessed from timestamps.

Two traps Durability32 fell into: do **not** compare the control's largest hit with the
candidate's largest hit — at 1.8 the largest hit becomes an unchanged Strong Kick, which is
what produced the false "−9%" (the attributed Power Shot moved −19.3%). And check owner versus
minion attack beats before reading a survival result: Conduit recorded **0 owner attack beats**
in all 12 of its Durability32 runs, so its survival was missing exposure, not durability.

A cell where archers never meaningfully attack is missing exposure, not proof of fairness. Do
not extend or rerun it adaptively. Conclude with: retain current behavior, retain the candidate
for adoption review, or investigate a named remaining issue. **No global T1 conclusion.**

## Block C — Jungle breadth, gated on Block A's behavior (36)

Six roots × nodes 03/05 × Durability32's breadth seeds (`51001`, `53017`, `55009`), window 300
simulated seconds or first death. Shipped T4A cells, current stats, **no overlay**.

**C runs only if Block A is both artifact-verified and behavior-passed.** Artifact validity
alone does not open it; neither does an `inconclusive` gate. The launcher records
`skipped-gate` with the reason. Measure species/role body timing, true engagement duration,
mechanism exposure, pressure, survival and quiet gaps. **No new Jungle HP treatment is
proposed and none may be introduced here.**

## Scheduling, gates and budgets

Order **A → B → C**, sequentially, one process at a time.

- **C depends on A's behavior**, via `scripts/block-gate.mjs`.
- **B is independent** and keeps its allocation whatever happens in Jungle.
- **A global identity failure stops everything**: a verification failure naming `trial`,
  `revision`, `definitionsHash` or `hitboxesSha256` writes `stopped.json` and breaks the batch.
  A block-local failure is recorded and execution continues.
- No discretionary continuation, no retry, no recycling of failed observations.

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Block A | 20 min watchdog |
| Blocks B and C | 35 min watchdog each |
| In-runner per-block budget | 30 min |
| Batch | 3 h ceiling; 4 h hard assert |

Expected 45–90 wall minutes, uncertain. **Never raise a limit mid-run.** A watchdog kill writes
`stopped.json` for that block; preserve everything and report it.

## Qualification already performed

At the frozen revision, by the preparing agent:

- `pnpm typecheck` green across all packages **and** `typecheck:bench`.
- `runeDynamicHazardAvoidance.test.ts` green, including fixtures built from the **measured**
  Durability32 trap coordinates. **Mutation-checked**: with the pad removed from the admission
  predicate it fails on `an obstructed footprint must claim escape ownership`.
- `navigationGate.test.ts` green: a trapped cutoff fails and skips dependent breadth; a
  never-exercised block is inconclusive and also blocks; an unexplained cutoff cannot pass;
  artifact validity alone never opens the gate; a death after real exposure passes; identity
  failures are global and count mismatches are block-local.
- `durability33Matrix.test.ts` green: 84 planned observations, blocks A and C identical to
  Durability32's cells apart from ids, matched Block B pairs, the documented single delta, and
  overlay restoration on success, on a thrown observation and on the no-overlay blocks.
- `node scripts/durability33-preflight.mjs` green — qualify and 30 s pilot for all three
  blocks, asserting counts, seeds, windows, `synthetic`/`economyEligible`, roster contents,
  both arms in READY, and that the gate produces an explicit verdict and decision.
  The pilots report `gate=inconclusive, exercised=0`: a 30 s pilot does not reach a bush, which
  is the correct conservative verdict and demonstrates the gate distinguishes *not exercised*
  from *passed*.
- Full suite at the documented baseline; the pre-existing failures are unrelated
  (`biomeEcology`, `durability8` float drift, `tier1Snapshot`, `bot/harness`).

Pilots are smoke checks, logged separately, and **must never be pooled into the operator
dataset**. Their outcomes must not drive any candidate change.

## Execute once

```powershell
$dur33Revision = 'e4e39bc59a270da94f9461fb8afbdf94c8690c9a'
$dur33Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability33-20260918'
$dur33Source = "$dur33Root/source"
if (Test-Path -LiteralPath $dur33Root) { throw 'Root exists; inspect and report, no retry' }
New-Item -ItemType Directory -Path $dur33Root | Out-Null
git worktree add --detach "$dur33Source" $dur33Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur33Source" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
node "$dur33Source/scripts/durability33-run.mjs" "--out=$dur33Root/results" "--revision=$dur33Revision" --tree=aa24ae5ae6ed8b5713f62698fbe6401384d43241 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur33Exit = $LASTEXITCODE
@{ exit = $dur33Exit; ended = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content "$dur33Root/operator-exit.json"
```

The launcher refuses a dirty tree, a wrong revision, a mismatched hitbox hash and an existing
output root.

## Operator boundaries

Execute once. No code or build adaptation, no extra experiments, no unplanned retries, no
deletion or overwriting of evidence, no unrelated services, no production tuning, and no
commit, push or deploy. Do not redesign the study. Partial, censored, invalid and unstarted
outcomes are evidence — preserve them distinctly. **A behavior failure skips dependent breadth
with a recorded reason; it does not delete the failed observation.**

## Artifacts

Per block under `<root>/results/<block>/`: `manifest.json`, `index.json`, `complete.json`,
`verification.json`, `<block>-navigation-gate.json`, `analysis.json`, `analysis.md`,
`night5-audit.json`, and per observation
`<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`. Batch level:
`batch-manifest.json`, `operator-ledger.jsonl` (including every gate decision and skip reason),
`batch-ended.json`, `stopped.json` if a watchdog or identity fault fired, and
`operator-exit.json`.

## Required report

Write `docs/briefs/bot-balance-durability33-report.md` and index it in `docs/README.md`.
Observations first, then supported interpretation, then uncertainty, then recommendations,
kept visibly separate.

Report `artifactVerified`, `scenarioExposure`, `navigationGate` and `balanceExposure` as
**four separate answers**, never collapsed into one "verified". Summarize timing per seed, then
per root, then equal-weight role comparisons where justified; do not pool kills so fast classes
dominate. Show missing, dead and censored observations beside successful timing. Distinguish
body TTK from encounter duration and quiet time. Counts and quantiles are descriptive, not
confidence intervals. Include owner and summon damage correctly, and state owner-versus-minion
beats wherever a survival claim is made. Zero deaths in completed windows is bounded survival
evidence, not unlimited safety.

Retain source and artifact provenance and every exclusion reason. Do not claim mob closure or
playtest readiness. The next decision belongs to the command center.
