# Durability32 — post-repair Jungle regression, T1 Mountain Power Shot, Jungle breadth

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches,
commits or pushes. Three separately reported blocks, 120 observations.

## Purpose and hypotheses

| Block | Question | Hypothesis | Observations |
|---|---|---|---:|
| A `jungle-repair` | Do the six diagnosed Jungle wall-ceilings recover on repaired source? | The status-only bush no longer traps hazard-aware target selection, so the cutoffs become ordinary terminal outcomes. | 12 |
| B `mountain-powershot` | Is Ridge Ambusher's Power Shot spike excessive at T1, and does one local multiplier cut improve it? | Unknown. This is a screen, not a presumed verdict. | 72 |
| C `jungle-breadth` | What usable T4 Jungle durability/pressure evidence exists once the navigation defect is gone? | Unknown. Coverage and gross durability only. | 36 |

Report the three blocks separately. **Never pool them into one dataset.** Three seeds is a
directional starting sample, not statistical certification.

All evidence is synthetic: `synthetic=true`, `economyEligible=false`. Legal build state is
not proof the gear was earned or that it represents an average player.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `7247b6e22993a896065c25ce458017948923f6d7` |
| Frozen tree | `af48f537c42d3b17f70a03883c435809a59e5709` |
| Definitions hash | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability32` |
| Simulation | 100 ms fixed step, natural ecology, synthetic +5 preparation unless a cell says otherwise |
| Navigation diagnostics | **off** — this is a gameplay screen, not a profiling packet |

The frozen revision **contains the repair**, its regression and this tooling. It is not the
`a5d0fce2` reference commit. The definitions and hitbox hashes are unchanged from
Durability31, so progression definitions and collision geometry did not drift under the
repair.

## Block A — Jungle repair regression (12)

The four Durability30/31 setups, unchanged, on repaired source. Seeds `44017`, `46021`,
`48017`. Window 120 simulated seconds or first death.

| Cell | Node | Root |
|---|---|---|
| `dur32-t4a-jungle-03-apprentice-baseline` | node-t4-jungle-03 | apprentice |
| `dur32-t4a-jungle-03-slinger-baseline` | node-t4-jungle-03 | slinger |
| `dur32-t4a-jungle-05-apprentice-baseline` | node-t4-jungle-05 | apprentice |
| `dur32-t4a-jungle-05-spirit-baseline` | node-t4-jungle-05 | spirit |

T4A builds, `jungle-vest-t4` / `jungle-charm-t4` / `mountain-boots-t4` / `core-tempered` /
`relic-colossus-heart`, +5. No overlay is applied; `ready.hpTreatment` must be `[]`.

### Frozen pass/fail predicates — decide these before reading results

1. **Navigation recurrence (fail):** an observation ends `wall-ceiling` **and** its samples
   show the player stationary with no selected target, motion or path for a quiet interval
   longer than 10 s while inside a `jungle_bush_*` shape. This is the diagnosed behavior
   recurring.
2. **Repair exercised (required):** the observation's trajectory actually entered a bush
   envelope at least once. A run that never touches a bush neither passes nor fails the
   repair — record it as **not exercised**.
3. **Legitimate death (neither):** a `player-died` outcome with ordinary combat pressure is
   a gameplay result, not a repair failure, and not a repair pass either.
4. **Repair pass:** the observation exercised a bush, left it, and continued to acquire and
   fight targets for the remainder of its window.

Exact post-repair event-prefix equality with Durability30/31 is **not expected** — the
repair changes movement. Use the old reports as diagnostic references, not as a same-source
causal control. Audit source and input drift before comparing anything.

Persistent trapped behavior blocks Jungle pacing interpretation and gates Block C.

## Block B — T1 Mountain Power Shot (72)

Six roots x two preparation contexts x two arms x three fresh seeds (`51001`, `53017`,
`55009`). Window 300 simulated seconds or first death.

### Verified starting point

At the frozen revision, `ridge-archer` (displayed **Ridge Ambusher**) authors: HP 240,
attack 50, basic cooldown 3100 ms, range 210; Power Shot cast 2000 ms, cooldown 8000 ms,
initial cooldown 3500 ms, **multiplier 2.2**, no `aoe`. `assertDurability32Definitions()`
re-checks every one of these at launch and aborts on drift. This is not T2's `peak-archer`.

Earlier comments in the data file claimed a "2x" shot and a 3 → 1.8 cut. Both were stale;
they were corrected in the frozen revision **without changing the executable 2.2**.

### Treatment

`control` = 2.2 (current). `candidate` = 1.8. A modest local test, **not** a presumed correct
value and **not** a restoration justified by an old comment.

The overlay changes exactly one field: `ridge-archer.chargedAttack.multiplier`. Basic
attack, HP, cast time, cooldowns, range, AI, population, geometry, Cliff Hopper / Strong
Kick and global mitigation are untouched. It is installed per observation and restored in a
`finally`, on success and on failure. It rides the survey's change record in the attack
columns, so every `ready.json` carries
`{type:'ridge-archer', before:240, after:240, beforeAttack:2.2, afterAttack:<arm>}` — the HP
columns are equal **by design**, not by mistake.

### Preparation contexts

| Context | Node | Modifier | Gear | Upgrades |
|---|---|---|---|---|
| `first-arrival` | node-t1-mountain-01 | heavy | `plains-vest-t1`, `plains-charm-t1`, `plains-boots-t1` + class T1 weapon | **+0** |
| `prepared-farming` | node-t1-mountain-04 | fortified | `mountain-vest-t1`, `mountain-charm-t1`, `mountain-boots-t1` + class T1 weapon | +5 |

Class T1 weapons: striker `flash-rapier`, squire `heavy-hammer`, apprentice `chaotic-axe`,
slinger `ashbrand-blade`, conduit `chaotic-axe`, spirit `chaotic-axe`. T1 characters carry
one root skill, no stance, no core, technique `sweep`, guard `second-wind`; ranged roots
orbit, melee roots do not — the shipped defaults, deliberately untouched so this block does
not quietly become a movement-policy experiment.

Observed rosters at both nodes are 8 `ridge-archer` + 16 `cliff-hopper`. Every observation
asserts archer presence at setup and fails loudly without it.

**The contexts differ in several preparation inputs at once (gear family, upgrade level and
node). Their contrast is NOT the causal effect of any one item.** The causal treatment is
the multiplier *within* a matched context; the matrix test asserts that paired arms share
node, gear, upgrades and skill path.

**Bounded limitation, stated up front:** both contexts carry the bench's canonical T1 biome
mastery, so they share a Runic Point budget and upgrade ceiling. A true first arrival would
have less mastery. Mastery gates upgrades, RP and recipe visibility — it feeds no combat
stat — so this inflates the first-arrival context's *preparation*, not its damage taken. It
does not affect the within-context causal comparison.

### Counterplay audit — traced, not assumed

Power Shot authors no `aoe`. The charged-attack path publishes a `slam-telegraph` ground
zone **only** when `charged.aoe` is set, so no telegraph zone exists and the Step Back rune
— which reads `activeAttackTelegraphs` — never sees the wind-up. `hasMobileMonsterCast`
returns true for an unplanted targeted charge, so the archer keeps tracking through the cast
and the generic range bail deliberately does not break it; Orbit and walking out of range do
not deny it. A stun or freeze landing during the wind-up **does** abort it
(`abortMonsterCast`). So the available counterplay is mitigation or an interrupt.

Do not "solve" the experiment by granting a future interrupt or disabling ordinary automatic
behavior. Report what the shipped T1 kit can actually do.

### Required evidence

Per root / context / seed: terminal outcome and exposure; Power Shot starts, completions,
landed hits, and interrupted / cancelled / unresolved casts where observable; HP immediately
before and after verified shots, and HP loss as a fraction of maximum; barrier absorption and
any cap or guard effect the telemetry exposes; largest short-window burst; simultaneous
attackers, late joins and Cliff Hopper Strong Kick / basic-hit contributions; minimum HP;
recovery and quiet gaps; kills, throughput, body TTK and actual encounter duration.

Audit representative death **and near-death** sequences, including successful counterparts.
A final Ridge Ambusher hit does not establish that Power Shot caused the whole death
sequence. Do not infer exact cast damage from timestamps alone where the schema cannot
uniquely attribute it — report unresolved attribution explicitly. **2.2 → 1.8 is not an
equal percentage change in final HP damage** after mitigation, caps and rounding.

A cell where archers never meaningfully attack is **missing exposure**, not proof that Power
Shot is fair. Do not extend or rerun it adaptively.

Conclude with one of: retain current behavior; retain the candidate for adoption review; or
investigate a specific remaining mechanic or preparation issue. **No global T1 damage
conclusion follows from this block.**

## Block C — Jungle breadth after the repair gate (36)

Six roots x nodes 03/05 x the same three fresh seeds. Window 300 simulated seconds or first
death. Shipped T4A specialization cells and current mob stats; **no overlay**
(`ready.hpTreatment` must be `[]`) and no unselected Jungle HP candidate.

Measure species/role body timing, true engagement duration, mechanism exposure, incoming
pressure, survival, and quiet/navigation gaps. This is a usable-coverage and gross-durability
screen, **not** proof that every Jungle tier or specialization is balanced. Keep prior
situational build findings visible.

## Scheduling and gates

Order **A → B → C**, sequentially, one process at a time.

- **C is gated on A.** If Block A is not verified, C is skipped and the ledger records
  `skipped-gate`. Jungle breadth is uninterpretable while navigation may still trap.
- **B is independent and keeps its allocation** even if a Jungle block fails. The launcher
  encodes this: a block-local verification failure is recorded and execution continues.
- **A global fault stops everything.** A verification failure naming `trial`, `revision`,
  `definitionsHash` or `hitboxesSha256` writes `stopped.json` and breaks the batch, because
  every remaining block would be measuring the wrong source.
- No discretionary operator continuation. No retry. No recycling of failed observations.

### Budgets

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Block A | 20 min watchdog |
| Blocks B and C | 35 min watchdog each |
| In-runner per-block budget | 30 min |
| Batch | 3 h ceiling; 4 h hard assert in the runner |

Expected 45–90 wall minutes, uncertain. **Never increase a limit mid-run.** A watchdog kill
writes `stopped.json` for that block; preserve everything and report it.

## Qualification already performed

At the frozen revision, by the preparing agent:

- `pnpm typecheck` green across all packages **and** `typecheck:bench`.
- `server/test/runeDynamicHazardAvoidance.test.ts` green, including the new status-only bush
  regression. **Mutation-checked**: with the repair reverted it fails on
  `a status-only bush must claim escape ownership`.
- `server/test/hazardPullApproach.test.ts` and `shared/src/collision/pathDiagnostics.test.ts`
  green.
- `server/test/durability32Matrix.test.ts` green: block shape, 120 planned observations,
  matched pairs, and overlay restoration on success, on a thrown observation, and on the
  no-overlay Jungle blocks.
- `node scripts/durability32-preflight.mjs` green — qualify **and** 30 s pilot for all three
  blocks, asserting cell counts, seeds, windows, `synthetic`/`economyEligible`, roster
  contents, both Power Shot arms and both preparation contexts in READY, plus the audit and
  report generators.
- Full suite 232/236. The four failures are **pre-existing and unrelated**: `biomeEcology`,
  `durability8` (a float last-digit drift on `tiny-slime` shieldPct), `tier1Snapshot`, and
  `bot/harness` (needs a live server).

Pilots are smoke checks. They are logged separately and **must never be pooled into the
operator dataset**. Their outcomes must not drive any candidate change.

## Execute once

```powershell
$dur32Revision = '7247b6e22993a896065c25ce458017948923f6d7'
$dur32Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability32-20260918'
$dur32Source = "$dur32Root/source"
if (Test-Path -LiteralPath $dur32Root) { throw 'Root exists; inspect and report, no retry' }
New-Item -ItemType Directory -Path $dur32Root | Out-Null
git worktree add --detach "$dur32Source" $dur32Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur32Source" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
node "$dur32Source/scripts/durability32-run.mjs" "--out=$dur32Root/results" "--revision=$dur32Revision" --tree=af48f537c42d3b17f70a03883c435809a59e5709 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur32Exit = $LASTEXITCODE
@{ exit = $dur32Exit; ended = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content "$dur32Root/operator-exit.json"
```

The launcher refuses a dirty tree, a wrong revision, a mismatched hitbox hash and an existing
output root. The shared checkout is irrelevant to the run; do not clean it.

## Operator boundaries

Execute once. No code or build adaptation, no extra experiments, no unplanned retries, no
deletion or overwriting of evidence, no unrelated services, no production tuning, and no
commit, push or deploy. Do not redesign the study. Partial, censored, invalid and unstarted
outcomes are evidence — preserve them distinctly.

## Artifacts

Per block, under `<root>/results/<block>/`: `manifest.json`, `index.json`, `complete.json`,
`verification.json`, `analysis.json`, `analysis.md`, `night5-audit.json`, and per observation
`<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`. Batch level:
`batch-manifest.json`, `operator-ledger.jsonl`, `batch-ended.json`, `stopped.json` if a
watchdog or identity fault fired, and `operator-exit.json`.

## Required report

Write `docs/briefs/bot-balance-durability32-report.md` and index it in `docs/README.md`.
Observations first, then supported interpretation, then uncertainty, then recommendations —
kept visibly separate.

For timing, summarize per seed, then per root/profile, then equal-weight role comparisons
where justified. Do not pool all kills so fast classes dominate. Keep the two preparation
contexts separate. Show missing, dead and censored observations beside successful timing.
Distinguish body TTK from actual encounter duration and quiet time. Counts and quantiles are
descriptive, not confidence intervals. Include owner and summon damage correctly. Zero deaths
in completed windows is bounded survival evidence, not unlimited safety.

Retain source and artifact provenance and every exclusion reason. Do not claim mob closure or
playtest readiness. The next decision belongs to the command center.
