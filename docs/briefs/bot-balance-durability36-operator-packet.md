# Durability36 — T1 Mountain local armor adaptation, and the Jungle T2/T3/T4 duration ladder

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches, commits
or pushes. Two **independent** blocks, 72 observations.

## Purpose

| Block | Question | Runs |
|---|---|---:|
| M `mountain-armor` | At the adopted enemy baseline, does one ordinary local armor swap help the remaining vulnerable root/node cases? | 18 |
| J `jungle-ladder` | Does representative Jungle encounter duration actually rise across T2 → T3 → T4 with legal tier-appropriate builds? | 54 |

Neither block gates the other. All evidence is synthetic: `synthetic=true`,
`economyEligible=false`. Three seeds is directional, not certification.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `0e28217b76df2d1ec130ff753cf09ffe69d04710` |
| Frozen tree | `979afe19bfc8d2d00f463eb006d6b7d8ef9619d5` |
| Definitions hash | `80f64f6e9857708e29d126643bd1da4cdfdd17fecdd0482ae1c48593e1e45839` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability36` |
| Simulation | 100 ms fixed step, 300 simulated seconds or first death, natural ecology |

**The definitions hash changed** from `a30458ee…` to `80f64f6e…` because the T1 Mountain package
was adopted into authored source at this revision. That is expected. The hitbox hash is
unchanged, because no geometry moved.

## Adopted baseline this packet sits on

`ridge-archer` and `cliff-hopper` base attack are now **40** in authored source (Durability35,
accepted). Power Shot stays 2.2 and Strong Kick 1.9. Block M has **no monster contrast at all** —
both arms see the adopted baseline — and Block J does not touch Mountain.

`assertDurability36Definitions()` pins the adopted 40, both charged multipliers, the three ladder
nodes and their shared modifier, and aborts on drift.

## Block M — local armor adaptation (18)

Three residual contexts × two arms × three seeds.

| Context | Why it is here |
|---|---|
| Slinger / `node-t1-mountain-01` (heavy) | still 0/3 at the terminal endpoint in Durability35, though its deaths moved from 14.5–23.1 s to 146.3–288.8 s |
| Apprentice / `node-t1-mountain-01` (heavy) | 3/6 candidate survivors across both nodes |
| Apprentice / `node-t1-mountain-02` (swarming) | as above |

Seeds `75011`, `77003`, `79001` — **Durability35's seeds, reused deliberately** to revisit those
specific cases. This is targeted diagnostic reuse, **not** a fresh independent confirmation of
the adopted nerf.

### The one thing that changes

| Arm | Armor |
|---|---|
| `reference` | `swamp-vest-t1` +3 — the Durability35 candidate kit |
| `local-armor` | `mountain-vest-t1` +3 |

Weapon, charm, boots, every upgrade level, abilities, runes, mastery/RP and frame are identical.
The preflight asserts that only the armor slot differs.

**Read from source, not from names.** Arcane Wrappings (swamp): `maxHp 30`, `plating 4`,
`defense.dot-resistance 0.2`. Fallen Knight Plate (mountain): `maxHp 32`, `plating 5`,
`guard.potency-pct 0.15`. The plate is **not** a damage-cap item. Mountain has no DoT, so the
swamp mechanic is inert there while the plate amplifies Second Wind. **This is the whole armor
substitution, not an isolated estimate of guard potency** — HP and plating move too, and the
report must not attribute the result to guard potency alone.

### Acquisition boundary — preserve this distinction

The Fallen Knight Plate recipe requires **Mountain level 2**, and **+3 requires Mountain level
4**. So this tests an available **post-acquisition farming adaptation**, not protection already
owned on the first step into Mountain.

If the local armor helps, that does **not** mean first entry is fixed. Do not grant a later-tier
unlock, do not pretend the item was earned inside the synthetic run, and do not present it as the
only viable route. Natural acquisition and pacing remain a separate question.

## Block J — the actual Jungle duration ladder (54)

Six roots × T2/T3/T4 × one node per tier × three fresh seeds `81013`, `83003`, `85009`.

| Tier | Node | Modifier | Primary lineage member |
|---|---|---|---|
| 2 | `node-t2-jungle-03` | dominion | `jungle-ape` |
| 3 | `node-t3-jungle-03` | dominion | `silverback` |
| 4 | `node-t4-jungle-03` | dominion | `apex-silverback` |

**The shared `dominion` modifier was verified from `NODE_BIOMES`, not inferred from the `03`
suffix**, and `assertDurability36Definitions()` re-checks it at launch. Equal seed numbers across
tiers do **not** make geometries or trajectories identical; within-tier setup parity is what the
READY artifacts establish.

**One configuration per tier, not two HP arms.** Builds are tier-legal: root plus the balanced
branch at T2, plus the range pick at T3, and the shipped T4A specialization cells at T4, with
tier-matched Jungle gear and a core from T2 onward. Skill-path depth increases with tier by
assertion — no future layers are granted to make templates look alike. The result measures
**experienced progression with those builds**, not a pure mob-stat causal effect.

T4 uses the retained Durability34 values: `apex-silverback` 2900, `emerald-constrictor` 3400,
fast bodies unchanged. They are not yet integrated, so the installer applies them as an overlay
and restores after each observation. It asserts the package is **either fully pre-adoption or
fully live** and refuses to guess at a half-integrated state, so it can never be applied twice.
T2/T3 Jungle numbers are not changed by this experiment.

Report `emerald-constrictor` as a **separate T4 control-predator role**, and the fast lineages
separately. Do not demand that every fast T4 body exceed every durable T3 body.

**No invented T3 baseline.** The 2.9 s figure from earlier reports was the old T4 Apex baseline,
not T3. This block measures T3 directly.

## Scheduling and budgets

Order **M → J**, sequentially. Independent allocations: a local problem in one never consumes the
other's. A global identity failure (`trial`, `revision`, `definitionsHash`, `hitboxesSha256`)
writes `stopped.json` and stops the batch.

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Each block | 35 min watchdog |
| In-runner per-block budget | 30 min |
| Batch | 3 h ceiling; 4 h hard assert |

**Never raise a limit mid-run.** No retries, no recycled observations. A budget is a safety
limit, not a quota to consume or a promised duration. The navigation watch runs on Block J as
existing protection, not a new study; T1 Mountain nodes author no avoided feature.

## Qualification already performed

At the frozen revision, by the preparing agent:

- `pnpm typecheck` green across all packages and `typecheck:bench`.
- `t1MountainPressureAdoption.test.ts` green: the adopted values are live, a second cut has not
  happened, nothing else about either species moved, no other Mountain species was swept along,
  and both charged attacks still derive from `stats.attack`.
- `durability36Matrix.test.ts` green: 18 + 54 planned observations, three residual contexts with
  only the armor slot differing, the item properties read from source, the acquisition boundary,
  one configuration per tier with matched modifiers and deepening skill paths, and overlay
  restoration on success, on a thrown observation and on Block M.
- `durability32/33/35Matrix` rebased and green after the adoption.
- `node scripts/durability36-preflight.mjs` green — qualify and 30 s pilot for both blocks,
  asserting counts, seeds, windows, the adopted runtime attack (40, or 44 on the heavy node),
  the T4 overlay shape, and that the derived audits resolve arms correctly. In particular it
  asserts the cast audit resolves `baseline: reference, comparison: local-armor`, because
  `local-armor` sorts alphabetically **before** `reference` and alphabetical order would invert
  the baseline — the exact defect corrected in schema 4.
- Full suite at the documented baseline; the four remaining failures are pre-existing and
  unrelated (`biomeEcology`, `durability8` float drift, `tier1Snapshot`, `bot/harness`).

Pilots are infrastructure checks, logged separately, and **must never be pooled into the operator
dataset**. They must not drive any candidate change.

## Execute once

```powershell
$dur36Revision = '0e28217b76df2d1ec130ff753cf09ffe69d04710'
$dur36Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability36-20260918'
$dur36Source = "$dur36Root/source"
if (Test-Path -LiteralPath $dur36Root) { throw 'Root exists; inspect and report, no retry' }
New-Item -ItemType Directory -Path $dur36Root | Out-Null
git worktree add --detach "$dur36Source" $dur36Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur36Source" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
node "$dur36Source/scripts/durability36-run.mjs" "--out=$dur36Root/results" "--revision=$dur36Revision" --tree=979afe19bfc8d2d00f463eb006d6b7d8ef9619d5 --definitions=80f64f6e9857708e29d126643bd1da4cdfdd17fecdd0482ae1c48593e1e45839 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur36Exit = $LASTEXITCODE
@{ exit = $dur36Exit; ended = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content "$dur36Root/operator-exit.json"
```

The launcher refuses a dirty tree, a wrong revision, a mismatched hitbox hash and an existing
output root, and writes the derived audits into `<root>/results/audits`.

## Operator boundaries

Execute once. No code or build adaptation, no extra experiments, no unplanned retries, no
deletion or overwriting of evidence, no unrelated services, no production tuning, and no commit,
push or deploy. Do not redesign the study. Partial, censored, invalid and unstarted outcomes are
evidence — preserve them distinctly.

## Required report

Write `docs/briefs/bot-balance-durability36-report.md` and index it in `docs/README.md`. Favour
generated factual tables over hand-written causal verdicts, and **check every count mechanically
against `index.json` before writing prose** — hand-typed tables produced the last four correction
records.

Report for both blocks:

- arm and outcome tables generated from explicit **manifest metadata**, never inferred from an id
  suffix;
- **all four** paired joint outcomes for Block M, not two terminal labels;
- capped observed survival time, deaths, productive combat and throughput, HP minima and
  **terminal HP separately** — `minHP` is the lowest observed value, not the ending value;
- recovery, recent damage sequences, and guard activity with activations against **alive time**;
- owner and summon damage kept attributable. `CannotAttack` describes the **owner's outgoing
  attacks only**: it never invalidates a summon build's survival, and an isolated Power-Shot
  claim needs owner-targeted shot evidence;
- missing exposure reported as **unknown**, never as a zero-effect datum.

For Block J use `scripts/species-timing-audit.mjs`: per-species seed summaries, then root
summaries, then an equal-weight root centre. Expose root-specific fast, slow, death and missing
cases instead of pooling kills. Preserve unresolved and HP-regain counts. Report body
first-hit-to-kill time **and** actual episode/approach duration separately — a body TTK median is
not an episode clear time. A below-window death is not an infrastructure failure.

For Block M use `scripts/charged-cast-audit.mjs` with its **declared** baseline and comparison,
and prefer the timing-matched contrast over pooled medians. If trajectories diverge before any
matchable cast, report that honestly rather than manufacturing a nonzero count. Do not read a
coefficient effect from `mitigation.grossDamage`. Do not call an unmatched final blow a basic
attack. Note that a defensive treatment means identical monster coefficients do **not** imply
identical final HP damage, so condition on defense state.

Do not claim mob closure or playtest readiness. The next decision belongs to the command center.
