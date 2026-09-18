# Durability35 — T1 Mountain local enemy-pressure package

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches, commits
or pushes. One block, **72 observations**.

## Purpose

Does a single local enemy-pressure package make the T1 Mountain entry survivable, without
making another Mountain context trivially easy?

Durability34 settled that the guard choice is not the lever. The substitution died 14/18 against
the reference's 12/18, with Striker, Squire and Apprentice dying in all three seeds in **both**
arms. The guard-window audit showed why without blaming Brace: matched hits inside a Brace
window take **0.648×** — its authored 35% reduction, measured — but Brace covers only **5.07% of
alive time** and **14 of 147** hits. So this packet moves to the enemy side.

All evidence is synthetic: `synthetic=true`, `economyEligible=false`. Three seeds is a
directional sample, not certification.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `f123d46b25f5ce64229ea4cea59fd870d6695873` |
| Frozen tree | `93f3239891ed579c8e389bf180ab6b1d245f5f53` |
| Definitions hash | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability35` |
| Block | `mountain-pressure` |
| Simulation | 100 ms fixed step, 300 simulated seconds or first death, natural ecology |
| Seeds | `75011`, `77003`, `79001` |

## Matrix — 24 cells, 72 observations

Six roots × two nodes × two arms × three seeds.

| Axis | Values |
|---|---|
| Roots | striker, squire, apprentice, slinger, conduit, spirit |
| Nodes | `node-t1-mountain-01` (**heavy**, the problematic entry) and `node-t1-mountain-02` (**swarming**) |
| Arms | `control` / `candidate` — declared on every cell in the manifest |

Both node modifiers are asserted at launch, so the two contexts cannot silently become one
context run twice.

### Treatment — resolved from frozen source, not assumed

| Species | Attack now | Attack candidate |
|---|---:|---:|
| `ridge-archer` | 50 | **40** |
| `cliff-hopper` | 50 | **40** |

A deliberate **two-species package effect**. It does not attempt to isolate either species'
contribution, because the concern is the combined ordinary and charged pressure of the
two-species encounter, not one killing blow.

**Attack-derived special damage moves with it, and that was verified through the real pipeline
rather than assumed.** In qualification: Strong Kick hp 65 → 55 and gross 55 → 44; Power Shot hp
69 → 57.5 and gross 52.5 → 42. Both fall by **less than 20%** — a 20% authored attack cut is not
a promise of 20% less final HP damage after plating, damage caps, guards and rounding. Basic-hit
gross confirms both contexts respond: 55 → 44 on heavy, 50 → 40 on swarming.

### Held fixed

Monster HP, charged multipliers (**Power Shot stays 2.2 in both arms; 1.8 is NOT installed**),
wind-ups, cooldowns, range, movement, ecology, density, node modifiers and rewards. Player build,
the +3 entry kit (`swamp-vest-t1`, `swamp-charm-t1`, `plains-boots-t1`, class T1 weapon),
mastery/RP, Sweep, **Second Wind** as the reference guard in both arms, and ordinary rune
automation. Every other T1 biome and every T2–T4 monster. No global attack multiplier, no
mitigation-system change, no ability buff, no RP expansion.

`assertDurability35Definitions()` pins all of the above and aborts on drift.

The 1.8 Power Shot candidate remains parked. It is not combined here and is not declared
disproven in all contexts.

## Budgets and stop behaviour

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Block | 35 min watchdog |
| In-runner block budget | 30 min |
| Batch | 3 h ceiling; 4 h hard assert |

A global identity failure (`trial`, `revision`, `definitionsHash`, `hitboxesSha256`) writes
`stopped.json` and stops the batch. **Never raise a limit mid-run.** No retries, no recycled
observations, no adaptive scalar ladder. Durability34 finished 108 observations in about seven
minutes; these ceilings are safety, not a work estimate, and there is no requirement to use them.

The navigation gate is deliberately **not** run: T1 Mountain nodes author no player-avoided
feature, and Durability33 already reported `not-applicable` for exactly this node family.

## Qualification already performed

At the frozen revision, by the preparing agent:

- `pnpm typecheck` green across all packages and `typecheck:bench`.
- `durability35Matrix.test.ts` green: 72 planned observations, arms declared on every cell and
  balanced, two genuinely different node modifiers, matched pairs differing only by arm label,
  attack-only overlay with HP/cadence/multipliers pinned, and restoration on success, on a
  thrown observation and on the control arm.
- `node scripts/durability35-preflight.mjs` green — qualify and 30 s pilot, asserting counts,
  seeds, windows, both species present in every roster, the overlay shape, **and** that
  attack-derived special damage actually falls for both Strong Kick and Power Shot.
- The preflight also checks the derived reports **semantically**: both arms resolved by the cast
  and guard audits, and all four joint outcome categories present. A generator exiting zero is
  not sufficient.
- Full suite 236/240; the four failures are pre-existing and unrelated (`biomeEcology`,
  `durability8` float drift, `tier1Snapshot`, `bot/harness`).

Pilots are infrastructure checks, logged separately, and **must never be pooled into the operator
dataset**. They must not drive any candidate change.

## Execute once

```powershell
$dur35Revision = 'f123d46b25f5ce64229ea4cea59fd870d6695873'
$dur35Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability35-20260918'
$dur35Source = "$dur35Root/source"
if (Test-Path -LiteralPath $dur35Root) { throw 'Root exists; inspect and report, no retry' }
New-Item -ItemType Directory -Path $dur35Root | Out-Null
git worktree add --detach "$dur35Source" $dur35Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur35Source" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
node "$dur35Source/scripts/durability35-run.mjs" "--out=$dur35Root/results" "--revision=$dur35Revision" --tree=93f3239891ed579c8e389bf180ab6b1d245f5f53 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur35Exit = $LASTEXITCODE
@{ exit = $dur35Exit; ended = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content "$dur35Root/operator-exit.json"
```

The launcher refuses a dirty tree, a wrong revision, a mismatched hitbox hash and an existing
output root. It also runs the charged-cast and guard-window audits into `<root>/audits`, so an
undeclared arm fails there rather than silently pooling.

## Operator boundaries

Execute once. No code or build adaptation, no extra experiments, no unplanned retries, no
deletion or overwriting of evidence, no unrelated services, no production tuning, and no commit,
push or deploy. Do not redesign the study. Partial, censored, invalid and unstarted outcomes are
evidence — preserve them distinctly.

## Artifacts

`<root>/results/mountain-pressure/`: `manifest.json`, `index.json`, `complete.json`,
`verification.json`, `analysis.json`, `analysis.md`, `night5-audit.json`, and per observation
`<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`. Derived audits in
`<root>/results/audits/`. Batch level: `batch-manifest.json`, `operator-ledger.jsonl`,
`batch-ended.json`, `stopped.json` if a watchdog or identity fault fired, `operator-exit.json`.

## Required report

Write `docs/briefs/bot-balance-durability35-report.md` and index it in `docs/README.md`. Favour
generated factual tables over hand-written causal verdicts, and **check counts mechanically
against `index.json` before writing prose** — a hand-typed table that disagreed with the raw
index produced the last three correction records.

Report:

- paired starting-build and geometry parity, and exact runtime monster stats per arm (authored
  and post-modifier values are different things);
- root / node / seed outcomes, and **all four** paired survival categories — two terminal labels
  still make four joint outcomes;
- whether the systematic early failure among Striker, Squire and Apprentice is materially
  relieved, **and** whether the swarming context becomes disproportionately easy;
- early fatal sequences and low-HP survivors, with actual combat and recovery exposure, not
  deaths-only medians — a median over dying runs is conditional on dying;
- alive time per arm alongside run counts, because equal run counts do not imply equal exposure;
- owner and summon damage kept attributable. A T1 Conduit deals damage only through minions **by
  design** (`CannotAttack`); zero owner attack beats is not missing exposure;
- final-blow attribution kept separate from the whole fatal sequence, and an unmatched final blow
  labelled unattributed rather than "basic".

Use `scripts/charged-cast-audit.mjs` and prefer its `pairedSameState` contrast over pooled
medians. If trajectories diverge before any matchable cast, **report that honestly** rather than
manufacturing a nonzero count or declaring no effect. Do not read a coefficient effect from
`mitigation.grossDamage` — for a charged hit it records only the base component.

Ordinary occasional deaths and class asymmetry are not automatic rejection criteria. After this,
choose retain / adjust / adopt for the package; do not open another grid merely for more
confidence. Zero deaths would be bounded survival evidence, not proof of safety. Do not claim mob
closure or playtest readiness. The next decision belongs to the command center.
