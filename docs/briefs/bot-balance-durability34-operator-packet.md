# Durability34 — Jungle role durability candidate, and a T1 Mountain guard substitution

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches,
commits or pushes. Two **independent** blocks, 108 observations.

## Purpose

| Block | Question | Runs |
|---|---|---:|
| J `jungle-durability` | Does one HP-only package on the two durable T4 Jungle roles produce a defensible encounter length without flattening the fast bodies? | 72 |
| M `mountain-guard` | At T1 Mountain, does substituting Brace for Second Wind trade better than it costs? | 36 |

Report the blocks separately; never pool them. Three seeds is a directional sample, not
certification. All evidence is synthetic: `synthetic=true`, `economyEligible=false`.

Neither block gates the other. A failure in one never costs the other its allocation.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `4c926e0e51187fb5061c2d7fa3ec6a2563c35827` |
| Frozen tree | `77d0c604b52e103ea8e76990f8fa78f0eecfeb4f` |
| Definitions hash | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability34` |
| Simulation | 100 ms fixed step, 300 simulated seconds or first death, natural ecology |
| Navigation diagnostics | off |

## Block J — Jungle role durability (72)

Six roots × nodes 03/05 × control/candidate × seeds `63011`, `65003`, `67001`. Shipped T4A
cells, unchanged from Durability33's breadth block apart from their ids and the arm split.

### The candidate, and why this magnitude

Durability33 measured clean body TTK over **2,134 engagements** across all six roots and both
nodes, aggregated seed → root → equally weighted across roots:

| Species | Role | HP | Clean TTK |
|---|---|---:|---:|
| `emerald-constrictor` | durable elite | 1700 | 3.55 s |
| `apex-silverback` | elite alpha | 1450 | 2.90 s |
| `thornback-lizard` | small | 1000 | 1.77 s |
| `hunting-panther` | small | 950 | 1.90 s |

And the authored ladder runs backwards: the **T3** Jungle anchor `silverback` is 2090 HP / 83
attack, while every **T4** Jungle species sits below it — the T4 alpha is 1450 / 77, a 31% HP
drop from its own T3 predecessor.

| Species | HP now | HP candidate | Expected TTK |
|---|---:|---:|---:|
| `apex-silverback` | 1450 | **2900** | ≈ 5.8 s |
| `emerald-constrictor` | 1700 | **3400** | ≈ 7.1 s |
| `hunting-panther` | 950 | *unchanged* | — |
| `thornback-lizard` | 1000 | *unchanged* | — |

The magnitude restores monotonicity against the measured T3 anchor rather than asserting a
universal T4 duration band. The Trench 40–60 s mini-boss guide is **not** a Jungle target. The
fast bodies are deliberately untouched so role separation survives.

**HP only.** No damage, modifier, population, density, navigation, ecology or build-policy
change accompanies it. `assertDurability34Definitions()` pins the two treated values, the two
untouched ones, and the T3 anchor whose value is the entire argument — it aborts on drift.

**A caution to carry into the report:** none of these four species authors a `chargedAttack` or
`monsterAbilities`, so raising HP adds duration, **not** a new cast. What it does add is time
for the authored `rampOnCombat` (apex) and `cadenceFinisher` / `dotEffect` (constrictor) to
develop, which a 2.9 s body cannot. Measure that; do not assume it.

### Navigation is a watch here, not a gate

Durability33 closed the navigation question: 58 escape attempts, 58 successes, zero trapped
rows. `navigationGate.ts` still runs on this block, but as a **regression watch**. A `fail`
invalidates this block's balance interpretation and must be visible in the report; it does not
skip work, because nothing depends on it. No separate navigation block is included.

## Block M — T1 Mountain guard substitution (36)

Six roots × `node-t1-mountain-01` × two guard arms × seeds `69001`, `71003`, `73009`. Kit is
Durability33's earned-entry context, unchanged: class T1 weapon, `swamp-vest-t1`,
`swamp-charm-t1`, `plains-boots-t1`, **+3**.

| Arm | Loadout |
|---|---|
| `reference` | Sweep + **Second Wind**, current automation |
| `substitution` | Sweep + **Brace instead of Second Wind**, same automation |

**Power Shot is held at 2.2 in BOTH arms.** The 1.8 candidate stays on the adoption list and is
deliberately not crossed into this grid. Cliff Hopper, all monster stats, rosters, geometry and
rune rules are identical between arms. Block M applies **no monster overlay at all**: its
treatment is the loadout.

### This is a substitution, and it is cheaper

Measured against a T1 budget of 22: Sweep 6, Second Wind 6, Brace 5.

| Root kind | Reference total | Substitution total |
|---|---:|---:|
| melee | 18 | **17** |
| ranged (also pays for Orbit) | 21 | **20** |

An earlier claim in this chain that "Brace is unaffordable at T1" was about *adding* Brace on
top of Second Wind. It is **retracted**: the substitution is legal for all six roots and costs
less than the reference. The freed point is left unspent, so the contrast stays one factor.

### What the two guards actually do

Neither reacts to a cast. Both are `hp-below` instants:

| Guard | Trigger | Effect | Cooldown |
|---|---|---|---|
| Second Wind | HP < 60% | heal, recoveryPct 0.5 over 4 s | 12 s |
| Brace | HP < 50% | 35% damage reduction for 3 s, knockback resist | 10 s |

So this is a **sustain versus mitigation opportunity cost**, not reactive counterplay to Power
Shot — which publishes no telegraph and tracks the player, and therefore cannot be dodged by
Step Back or Orbit in either arm. Do not describe the result as counterplay to the cast.

**Verified functionally, not by label.** A 30 s pilot activated `second-wind` ×2 in the
reference arm and `brace` ×1 in the substitution arm. The preflight asserts that the reference
arm actually activates Second Wind, that the substitution arm actually activates Brace, and
that the substitution arm no longer carries Second Wind. If an arm never applies its defense in
the cohort, say so rather than comparing loadout labels.

### Required evidence

Deaths and completed windows per root/arm/seed; paired terminal transitions in all four states;
guard activations per arm with cooldown-limited opportunities; short-window bursts; HP floors
and rest time; productive throughput and kills; casts actually protected by an active Brace
window versus HP restored by Second Wind.

Interpret the whole tradeoff. Brace may cut spikes while losing the recovery Second Wind
supplies. A failed substitution does not justify a global guard buff; a successful one does not
prove this is the only viable Mountain kit, and damage-cap gear and other mitigation exist
independently of Brace.

## Scheduling and budgets

Order **J → M**, sequentially, one process at a time. Independent allocations.

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Each block | 35 min watchdog |
| In-runner per-block budget | 30 min |
| Batch | 3 h ceiling; 4 h hard assert |

A global identity failure (`trial`, `revision`, `definitionsHash`, `hitboxesSha256`) writes
`stopped.json` and stops the batch. A block-local verification failure is recorded and the
other block still runs. **Never raise a limit mid-run.** No retries, no recycled observations.
Durability33 finished 84 observations in under five minutes; these ceilings are safety, not a
work estimate, and there is no requirement to consume them.

## Qualification already performed

At the frozen revision, by the preparing agent:

- `pnpm typecheck` green across all packages and `typecheck:bench`.
- `durability34Matrix.test.ts` green: 108 planned observations, matched pairs in both blocks,
  the candidate clearing the T3 anchor while the fast bodies stay put, HP-only assertions,
  the substitution proven legal *and* cheaper for melee and ranged, both guards confirmed
  `hp-below`, and overlay restoration on success, on a thrown observation and on Block M.
- `navigationGate.test.ts` green, extended for the new states: escape events count as exposure,
  a failed escape fails the gate, and a node with no avoided feature is `not-applicable` and
  cannot be a navigation prerequisite.
- `node scripts/durability34-preflight.mjs` green — qualify and 30 s pilot for both blocks,
  asserting counts, seeds, windows, roster contents, HP-only overlay shape with the fast bodies
  untouched, the control arm carrying no overlay, and the guard-activation check above.
- Full suite 235/239; the four failures are pre-existing and unrelated (`biomeEcology`,
  `durability8` float drift, `tier1Snapshot`, `bot/harness`).

Pilots are infrastructure checks, logged separately, and **must never be pooled into the
operator dataset**. They must not drive any candidate change.

## Execute once

```powershell
$dur34Revision = '4c926e0e51187fb5061c2d7fa3ec6a2563c35827'
$dur34Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability34-20260918'
$dur34Source = "$dur34Root/source"
if (Test-Path -LiteralPath $dur34Root) { throw 'Root exists; inspect and report, no retry' }
New-Item -ItemType Directory -Path $dur34Root | Out-Null
git worktree add --detach "$dur34Source" $dur34Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur34Source" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
node "$dur34Source/scripts/durability34-run.mjs" "--out=$dur34Root/results" "--revision=$dur34Revision" --tree=77d0c604b52e103ea8e76990f8fa78f0eecfeb4f --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur34Exit = $LASTEXITCODE
@{ exit = $dur34Exit; ended = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content "$dur34Root/operator-exit.json"
```

The launcher refuses a dirty tree, a wrong revision, a mismatched hitbox hash and an existing
output root.

## Operator boundaries

Execute once. No code or build adaptation, no extra experiments, no unplanned retries, no
deletion or overwriting of evidence, no unrelated services, no production tuning, and no
commit, push or deploy. Do not redesign the study. Partial, censored, invalid and unstarted
outcomes are evidence — preserve them distinctly.

## Artifacts

Per block under `<root>/results/<block>/`: `manifest.json`, `index.json`, `complete.json`,
`verification.json`, `analysis.json`, `analysis.md`, `night5-audit.json`, plus
`jungle-durability-navigation-gate.json` for Block J, and per observation
`<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`. Batch level:
`batch-manifest.json`, `operator-ledger.jsonl`, `batch-ended.json`, `stopped.json` if a
watchdog or identity fault fired, and `operator-exit.json`.

## Required report

Write `docs/briefs/bot-balance-durability34-report.md` and index it in `docs/README.md`.
Favour generated factual tables over hand-written causal verdicts. Observations first, then
supported interpretation, then uncertainty, then recommendations.

Mechanically check observation counts, arm totals and paired outcomes before writing prose; a
hand-typed table that disagrees with `index.json` is what produced the last two correction
records. Report artifact verification and the navigation watch as **separate** answers.

Use `scripts/species-timing-audit.mjs` for Block J: species/role clean TTK aggregated seed →
root → equally weighted roots, with unresolved and HP-regain targets counted separately and
never folded into a median. Report actual encounter duration apart from body lifetime, and
state denominators for any pooled statistic. Say plainly if a species was rarely encountered or
never showed its mechanic rather than assigning it a pooled median.

Use `scripts/charged-cast-audit.mjs` for Block M and prefer its `pairedSameState` contrast over
pooled medians. Do not read a coefficient effect from `mitigation.grossDamage`. Do not call an
unmatched final blow a basic attack. Report owner and summon damage separately, and state
owner-versus-minion attack beats wherever a survival claim is made — a T1 Conduit deals damage
only through minions **by design** (`CannotAttack`), which is not missing exposure.

Zero deaths in completed windows is bounded survival evidence, not unlimited safety, and is not
by itself evidence that no durability action is needed. Retain source and artifact provenance
and every exclusion reason. Do not claim mob closure or playtest readiness. The next decision
belongs to the command center.
