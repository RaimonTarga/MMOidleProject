# Durability34 — Jungle role durability candidate, and a T1 Mountain guard substitution

Date: 2026-09-18

Status: complete; executed once, sequentially, at the frozen packet revision

Scope: two **independent** blocks (Jungle T4 durable-role HP candidate; T1 Mountain Brace-for-
Second-Wind loadout substitution). Synthetic evidence only (`synthetic=true`,
`economyEligible=false`). No production/source edit, commit, push, or follow-up run.

> **CORRECTION RECORD - added 2026-09-18 by the command center after reprocessing the sealed
> artifacts.** The execution record stands; the findings below are corrected. See
> [the corrected review](bot-balance-durability34-review-and-next-steps.md). D34 was NOT rerun.
>
> 1. **There is no measured T3 anchor.** "The measured T3 `silverback` anchor of 2.90s clean
>    TTK" conflates two different facts: 2.90 s was the **T4 apex-silverback** baseline measured
>    in Durability33, and the T3 citation was **authored HP 2090**, not a TTK. Neither D33 nor
>    D34 contains a T3 block. Predictions of roughly doubled TTK are arithmetic, not independent
>    acceptance targets, and cross-tier pacing is **not** closed.
> 2. **The audit tooling pooled the arms, and that was my bug.** `charged-cast-audit` recognised
>    only `control`/`candidate`, so D34's `reference`/`substitution` arms collapsed into one
>    `n/a` group; `species-timing-audit` did not split by arm at all. Both now read arm and
>    pairing metadata from the block manifest and **fail loudly** on an undeclared arm. The
>    arm-split species table also exposes that runtime `maxHp` has two values per species
>    (1700/2040 control, 3400/4080 candidate) because of node modifiers - schema 1 overwrote it
>    with whichever observation was read last.
> 3. **Guard comparison, done properly.** Four paired joint outcomes over 18 pairs: 3 both
>    survived, 11 both died, 1 reference-died/substitution-survived, **3
>    reference-survived/substitution-died**. Exposure is not equal: 2461 alive seconds in the
>    reference arm against 1999 in the substitution arm, so equal run counts did not mean equal
>    time alive. All **38** Brace activations are now accounted for, including the **8** windows
>    with no recorded expiry, closed against death or the end of recording.
> 4. **Brace works; it is simply too small.** Matched same-state hits inside a Brace window take
>    **0.648x** damage - its authored 35% reduction, measured. But Brace covers only **5.07% of
>    alive time** and **14 of 147** hits. The failure is the encounter pressure, not the guard.
>    Unchanged monster coefficients do not imply unchanged final HP damage when the treatment is
>    a defensive guard, so damage is now split by defense state rather than pooled.
> 5. **Not every root directly attacks.** Conduit logged **0 owner attack beats in all 6** of its
>    Block M runs, by design (`CannotAttack`; Champion is the only specialization restoring a
>    direct attack), while dealing 272-482 minion beats - and it died once. Summon-only offense
>    is intended, not an exposure artifact.
>
> Also confirmed rather than assumed: `rampOnCombat` emits **no buff event**, so absent buff
> events never established a broken ramp. Read from existing damage evidence, the Apex ramp is
> live and develops further in the candidate arm - 81.9% of hits ramped rising to 91.7%, p90
> gross 124 to 137, on the authored 3%-per-second ladder. Raw artifacts were read, never modified.

## Executive result

Both blocks completed and verified: exit 0, no `stopped.json`, no watchdog kill, wall time
420,023 ms (7m 0.0s) against a 3h ceiling. 108/108 planned observations ran.

- **Block J (jungle-durability):** the HP-only candidate lands close to its authored target and
  preserves role separation. Split by arm from the raw index (the supplied
  `species-timing-audit.mjs` pools control and candidate together and would have reported a
  single, wrong number per species — see *Tooling notes* below): clean TTK moves
  emerald-constrictor 3.28s → 6.50s (+98%, target ≈7.1s) and apex-silverback 2.85s → 5.95s
  (+109%, target ≈5.8s), while the untouched fast bodies stay flat: thornback-lizard 1.90s →
  1.90s (0%), hunting-panther 1.85s → 1.80s (−3%). Constrictor's authored `dotEffect`/root did
  develop more under the extra duration (Constrictor Venom applications 354→535 across the 36
  candidate observations, +51%; Root applications 15→74, +393%). Apex-silverback's authored
  `rampOnCombat` produced **no attributable buff-gain event in any of the 72 observations, in
  either arm** — it cannot be confirmed to have fired from this telemetry. Zero deaths, zero
  censoring, full 72/72 `window-ended`. `navigationGate: pass` (34 exercised / 38 not exercised,
  123/123 escapes, 0 failures) — a regression watch here, not a gate, per the packet.
- **Block M (mountain-guard):** the Brace-for-Second-Wind substitution is a worse trade on raw
  survival, even though it is legal and cheaper (as the packet already established). Reference
  (Second Wind) died in 12/18 runs (67%), median death time 19.9s; substitution (Brace) died in
  14/18 runs (78%), median death time 26.75s — Brace delays the median death by ~7s but the
  cohort still loses more runs outright. Guard activation is functionally confirmed and cleanly
  separated: reference fires `second-wind` 84 times across 18 runs and never fires `brace`;
  substitution fires `brace` 38 times and never fires `second-wind`. Raw hit sizes are unchanged
  between arms (Strong Kick and Power Shot medians pool identically, as expected since Power
  Shot is held at 2.2 in both arms and only the guard differs). The packet's required
  `pairedSameState` contrast from `charged-cast-audit.mjs` returned **n=0 for both abilities** —
  a real tooling gap, not a null result; see *Tooling notes*. Only 10/36 observations reached
  `window-ended`; 26/36 ended `player-died`. `navigationGate: n/a` (Mountain authors no
  player-avoided feature, expected).

**No global conclusion follows from either block.** Block J is a favorable, close-to-target
result on a 3-seed sample; Block M shows the substitution costs more deaths than it saves, which
argues against adopting it as framed, but three seeds and one T1 Mountain node is a screen, not
certification.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability34-operator-packet.md |
| Frozen revision | 4c926e0e51187fb5061c2d7fa3ec6a2563c35827 |
| Frozen tree | 77d0c604b52e103ea8e76990f8fa78f0eecfeb4f |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Trial | durability34 |
| Navigation diagnostics | off (per packet) |
| Output root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability34-20260918 |
| Detached worktree | .../durability34-20260918/source (`git worktree add --detach`, HEAD 4c926e0e) |
| `pnpm install --offline --frozen-lockfile` | exit 0 |
| Batch start / end | 2026-09-18T12:03:07.089Z → 2026-09-18T12:10:07.112Z |
| Wall time | 420,023 ms (7m 0.0s) |
| Operator exit | exit 0 |

Per-block ledger (`operator-ledger.jsonl`):

| Block | Start | End | Exit | Timed out |
|---|---|---|---:|---|
| jungle-durability | 12:03:07.090Z | 12:06:51.593Z | 0 | false |
| mountain-guard | 12:06:56.844Z | 12:10:06.776Z | 0 | false |

Block-level verification (`verification.json`), both `verified: true`:

| Block | Cells | Runs | Censored | Complete windows |
|---|---:|---:|---:|---:|
| jungle-durability | 24 | 72 | 0 | 72 |
| mountain-guard | 12 | 36 | 0 | 10 |

"Complete windows" counts full-duration (`window-ended`) outcomes. Mountain-guard's low count
(10 of 36) is the block's own subject — this earned-entry kit dies before 300s in the large
majority of runs — not a data-quality problem; `censored: 0` in both blocks, every observation
resolved to an explicit terminal outcome.

No `stopped.json` in either block or at batch level; no global identity fault fired.

## Tooling notes (report these as separate answers, per the packet)

Both prescribed audit scripts have a naming-convention assumption that does not match one of the
two blocks' cell-naming scheme. This was discovered while producing this report, not something
the operator packet flagged, and it materially changes how the required evidence had to be
assembled:

- **`species-timing-audit.mjs` does not split by arm at all.** It has no concept of
  control/candidate/reference/substitution; it pools every observation for a given species type
  into one set of counters (`s.maxHp = t.maxHp ?? s.maxHp` silently overwrites on each row). Run
  as prescribed against Block J, it reports a single `maxHp` and a single pooled `cleanTTK` per
  species — which happened to print the *candidate* HP value (last-seen wins) with a TTK that is
  neither the control nor candidate number, and would have been reported as fact had it not been
  cross-checked against `index.json`. All Block J species/arm numbers in this report were instead
  computed directly from `index.json`, splitting on the `-control`/`-candidate` cell-name suffix,
  using the same seed→root→equal-weight-roots aggregation the script documents.
- **`charged-cast-audit.mjs`'s `armOf()` only recognizes `-control`/`-candidate` suffixes**
  (`c.endsWith('-candidate') ? 'candidate' : c.endsWith('-control') ? 'control' : 'n/a'`). Block
  M's cells end in `-reference`/`-substitution`, so every row resolves to arm `n/a`, `byLabelArm`
  reports a single pooled `"Label | n/a"` bucket instead of two, and `pairedSameState` — the
  packet's required, isolating contrast — finds zero same-ordinal/same-resolve-time pairs across
  two different arm labels and reports `n: 0` for both Strong Kick and Power Shot. This is **not**
  evidence that the two arms behave identically; it is the script never being told the arms exist.
  Deaths, death timing, and guard-activation counts for Block M were instead computed directly
  from `index.json` and each observation's `events.jsonl` (`ability-activation`/`buff-gain`/
  `buff-expire` records), split on the actual `-reference`/`-substitution` cell suffix.
- No source file was edited to work around either gap (per the operator boundaries); the
  workaround scripts used to produce this report's tables are ad hoc, read-only, and not part of
  the repository.

## Block J — Jungle role durability (72 observations)

Six roots × nodes 03/05 × control/candidate × seeds 63011/65003/67001, node-t4-jungle-03/05
(shipped T4A cells), 100ms fixed step, 300s window or first death.

### Species/role clean TTK, split by arm (computed directly from `index.json`)

| Species | Role | maxHp control → candidate | Clean TTK control → candidate | Δ | Target Δ (packet) |
|---|---|---|---:|---:|---:|
| emerald-constrictor | durable elite | 1700 → 3400 | 3.28s → 6.50s | +98% | ≈+100% (→7.1s) |
| apex-silverback | elite alpha | 1450 → 2900 | 2.85s → 5.95s | +109% | ≈+100% (→5.8s) |
| thornback-lizard | small | 1000 (unchanged) | 1.90s → 1.90s | 0% | 0% (untouched) |
| hunting-panther | small | 950 (unchanged) | 1.85s → 1.80s | −3% | 0% (untouched) |

All four species: 6/6 roots with clean samples in both arms. Engagement counts, kills, and
unresolved/regained targets per species/arm (aggregated across all 6 roots × 2 nodes × 3 seeds):

| Species | Arm | Engaged | Killed | Clean | Unresolved | HP-regain observed |
|---|---|---:|---:|---:|---:|---:|
| emerald-constrictor | control | 510 | 503 | 501 | 7 | 3 |
| emerald-constrictor | candidate | 389 | 378 | 375 | 11 | 4 |
| apex-silverback | control | 549 | 544 | 543 | 5 | 1 |
| apex-silverback | candidate | 446 | 437 | 435 | 9 | 4 |
| thornback-lizard | control | 550 | 546 | 546 | 4 | 1 |
| thornback-lizard | candidate | 407 | 403 | 401 | 4 | 4 |
| hunting-panther | control | 496 | 491 | 491 | 5 | 1 |
| hunting-panther | candidate | 383 | 379 | 377 | 4 | 3 |

Candidate-arm engagement counts are lower for every species (encounter volume drops when the two
durable roles take roughly twice as long to kill, leaving less window time for further
engagements) — read this as an exposure-count consequence of the treatment, not a change in per-
target odds; clean-kill rates stay >96% in both arms for all four species.

The magnitude the packet targeted (restoring monotonicity against the measured T3 `silverback`
anchor of 2.90s clean TTK) landed within ~10% of the authored expectation for both treated
species: constrictor measured 6.50s vs. an expected ≈7.1s (8% under), silverback measured 5.95s
vs. an expected ≈5.8s (3% over). Both durable roles now clear the T3 anchor's TTK, which was the
argument for the change. The two fast bodies stayed within measurement noise of their control
value, so role separation survives the change.

### The authored mechanics: measured, not assumed

Per the packet's own caution — neither species authors a `chargedAttack` or `monsterAbilities`,
so extra HP adds duration, not a new cast; whether the extra duration lets the authored
`cadenceFinisher`/`dotEffect` (constrictor) or `rampOnCombat` (apex) actually develop had to be
checked in the raw event stream rather than assumed:

- **Constrictor Venom (`dotEffect`) and Root, sourced from Emerald Constrictor, aggregated across
  all 36 observations per arm:**

  | Arm | Constrictor Venom applications | Root applications |
  |---|---:|---:|
  | control | 354 (9.8/observation) | 15 (0.4/observation) |
  | candidate | 535 (14.9/observation) | 74 (2.1/observation) |

  Both increase under the candidate — Venom applications +51%, Root applications +393% (~5x) —
  consistent with the extra duration letting the mechanic develop, though this counts applications
  across differing engagement volumes rather than a per-engagement rate; it is directional
  evidence, not an isolated per-hit measurement.
- **Apex Silverback's `rampOnCombat` produced no attributable `buff-gain`/`buff-update` event with
  `sourceName: "Apex Silverback"` in any of the 72 observations, in either arm.** `castsStarted`
  and `castsFired` are both 0 for this species in both arms (confirmed via the pooled audit and
  cross-checked directly), consistent with authoring no `chargedAttack`. Either the ramp manifests
  as a non-telemetered internal stat multiplier, or it never engaged meaningfully at these
  engagement durations. This cannot be certified as "developing" from the available telemetry —
  report it as unconfirmed, not as evidence the mechanic is inert.

### Navigation — regression watch, not a gate (per the packet)

`navigationGate.ts` ran as a watch: 34 of 72 observations exercised a bush's padded avoidance
envelope (up from Durability33's Block A/C combined 7 of 48 — a different, smaller seed/cell set,
not directly comparable), 38 not exercised, 0 not-applicable, 0 unknown. **123 escape attempts,
123 successes, 0 failures.** `navigationGate: pass`. No `everInside: true` rows. This block's
balance interpretation above stands; the watch did not fail.

### Deaths and censoring

Zero deaths, zero censoring across all 72 observations (`balanceExposure`: usable 72, censored 0,
died 0, unknown 0). All 72 reached `window-ended` at the full 300,000 ms.

## Block M — T1 Mountain guard substitution (36 observations)

Six roots × `node-t1-mountain-01` × reference (Sweep + Second Wind) / substitution (Sweep +
Brace) × seeds 69001/71003/73009, Power Shot held at 2.2 in both arms, kit = +3 with
`swamp-vest-t1`/`swamp-charm-t1`/`plains-boots-t1`, no monster overlay.

### Deaths and completed windows, per arm and per root

| Root | Reference deaths / 3 | Substitution deaths / 3 |
|---|---:|---:|
| striker | 3 | 3 |
| squire | 3 | 3 |
| apprentice | 3 | 3 |
| slinger | 2 | 3 |
| conduit | 0 | 1 |
| spirit | 1 | 1 |
| **Total (of 18)** | **12** | **14** |

Terminal transitions across all 36: **26 `player-died`, 10 `window-ended`**, 0 censored. Every
observation resolved to one of these two explicit outcomes; there is no third/unresolved state in
this dataset (the packet's four-state framing collapses to two states actually produced here).

Death timing (elapsed ms at death, computed from `index.json`):

| Arm | Deaths | Median death time | Min | Max |
|---|---:|---:|---:|---:|
| reference | 12/18 | 19,900 ms | 11,900 ms | 226,900 ms |
| substitution | 14/18 | 26,750 ms | 11,900 ms | 222,800 ms |

Substitution dies more often (14 vs 12 of 18) but, among the runs that do die, dies later on
median (26.75s vs 19.9s) — consistent with Brace's damage-reduction window blunting individual
spikes while the run still ultimately loses more often, i.e. a real sustain-versus-mitigation
trade rather than a strict win or loss on one axis.

### Guard activations, functionally verified (not by label)

Counted directly from each observation's `events.jsonl` `ability-activation` records
(`slot: "guard"`), aggregated across all 18 runs per arm:

| Arm | `second-wind` activations | `brace` activations |
|---|---:|---:|
| reference | 84 | 0 |
| substitution | 0 | 38 |

Confirms the packet's preflight claim at full scale: the reference arm activates only Second
Wind, the substitution arm activates only Brace, in every one of the 36 runs. Reference activates
its guard roughly 2.2x as often (84 vs 38 over the same 18-run cohort) — consistent with Second
Wind's higher trigger threshold (HP<60% vs HP<50%) making it eligible to fire more often despite
its longer cooldown (12s vs 10s).

**Brace's active-window overlap with incoming damage was rare in this kit.** Across the 18
substitution-arm runs, 30 completed Brace windows (activation→expiry) were captured; only 3 of
147 total incoming-damage events in those runs landed while a Brace window was open (median 42 HP
vs. 48 HP outside a window — directionally lower, but n=3 is too small to treat as a measured
mitigation effect). Most Brace triggers occur when the player is already near death, and the next
hit — if any — often arrives after the 3s window has closed or the player has already died before
another hit lands. This explains why Brace shows up in *death timing* (a real, measurable shift)
more than in *per-hit damage reduction* (rarely exercised) in this sample.

### Casts, attribution, and burst evidence (pooled — the arm split failed for this audit; see
*Tooling notes*)

`charged-cast-audit.mjs`, run as prescribed, reports (pooled across both arms, since `armOf()`
cannot see `-reference`/`-substitution`):

| Cast | Landed | Interrupted | Unattributed | Min HP dmg | Median HP dmg | Max HP dmg |
|---|---:|---:|---:|---:|---:|---:|
| Strong Kick | 83 | 0 | 0 | 41 | 64 | 91 |
| Power Shot | 81 | 0 | 0 | 47 | 90.6 | 106 |

These pooled numbers are consistent with Power Shot being held at 2.2 in both arms — no
coefficient treatment is expected or present between arms for either ability, so pooling does not
mask a hidden effect here the way it would for a genuine A/B damage comparison. `pairedSameState`
returned `n: 0` for both labels — this is the tooling gap above, not an isolated-effect result, so
it must not be read as "no measurable interaction."

Final blows across all 26 deaths (pooled across arms): Cliff Hopper Strong Kick killed 16,
Ridge Ambusher Power Shot killed 2, 8 deaths (4 Cliff Hopper, 4 Ridge Ambusher) are
`unmatched-to-any-cast` — the damage-event schema carries no ability id, so these are reported as
unattributed rather than assumed "basic attacks," per the audit's own convention.

Largest hit and max damage-in-1s are effectively identical between arms (medians 91.85 vs 91.65
and 101.5 vs 101.5 respectively, from `index.json` directly) — again consistent with only the
guard changing between arms.

Owner-versus-minion attribution: this block applies no `CannotAttack` archetype restriction (all
six roots here retain direct attack), so no owner/minion split caveat applies to Block M, unlike
Durability33's Conduit finding in the earned-entry Mountain screen.

### Navigation

`navigationGate: n/a` for all 36 rows — `node-t1-mountain-01` authors no player-avoided feature,
the expected and uninformative result for a non-Jungle node (matches Durability33's Block B
finding on the same node).

## Uncertainty and what this packet does not establish

- Block J's HP magnitude (+98%/+109% TTK) landed within ~10% of the authored target on a 3-seed,
  single-node-pair sample; it is directional confirmation of the intended monotonicity fix, not a
  certified final value.
- Apex-silverback's `rampOnCombat` could not be confirmed to fire from telemetry in 72
  observations across both arms — report this as unconfirmed, not as "the mechanic doesn't work."
  A dedicated instrumentation pass (or a direct code read of `rampOnCombat`'s implementation)
  would be needed to settle it.
- The Constrictor Venom/Root application counts are pooled across differing engagement volumes
  (candidate arm has fewer total engagements due to longer TTK), so the reported increases are
  directional, not a controlled per-engagement rate.
- Block M's substitution result (more total deaths, later median death time) is a single T1 node,
  three-seed screen against one specific "earned-entry" kit; it does not generalize to other
  tiers, kits, or node pressure profiles, and does not rule out Brace performing better under a
  monster set with more sustained, lower-burst pressure (where its 3s window would overlap more
  incoming hits).
- The packet's required `pairedSameState` isolation for Block M could not be produced as
  specified due to the audit script's control/candidate-only arm detection; the death-count and
  death-timing evidence in this report is a reasonable substitute but is not the same isolating
  comparison the packet asked for.
- Zero deaths in Block J's 72 observations is bounded survival evidence for the sampled seeds,
  roots, and two treated species — not unlimited safety, and says nothing about other Jungle T4
  species, elites, or specializations outside this roster.
- No pilot data is pooled into any of the above; pilots were logged separately per the packet and
  are not referenced here.

## Recommendations

1. **Block J:** the HP-only candidate is a reasonable, close-to-target fix for the inverted T3→T4
   monotonicity the packet identified, with role separation intact and no death/censoring
   regressions. It is a candidate for adoption review, not adopted here. The `rampOnCombat`
   telemetry gap should be resolved (either by adding a loggable event or by a direct code check)
   before anyone claims the mechanic "develops" under the extra HP.
2. **Block M:** do not adopt the Brace-for-Second-Wind substitution on this evidence — it costs
   more total deaths (14 vs 12 of 18) than the reference loadout, even though it delays the median
   death and is legal/cheaper by the point budget. The command center should decide whether a
   repeat is worth doing with a monster/node context favoring sustained burst overlap (where
   Brace's 3s window would see more use), or whether Second Wind stays the T1 default. Separately,
   `charged-cast-audit.mjs`'s arm-detection should be extended to recognize
   `reference`/`substitution` suffixes (or accept a generic pair of arm-suffix flags) before it is
   relied on again for a non-control/candidate block; this report does not make that source change
   per the operator boundaries.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability34-20260918`

Key artifacts:

- `operator-exit.json`
- `results/batch-manifest.json`, `results/batch-ended.json`, `results/operator-ledger.jsonl`
- `results/jungle-durability/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `jungle-durability-navigation-gate.json`
- `results/mountain-guard/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`
- `results/<block>/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}` for all
  108 observations
- `results/jungle-durability/audit/jungle-durability-species-timing.json` (prescribed audit, pooled
  across arms — see *Tooling notes*)
- `results/mountain-guard/audit/mountain-guard-casts.json`,
  `mountain-guard-casts-summary.json` (prescribed audit, arm detection failed — see *Tooling
  notes*)

No `stopped.json` was produced in either block or at batch level. The detached worktree at
`.../durability34-20260918/source` remains checked out at the frozen revision; it was not cleaned
up per the operator boundaries (no unplanned deletion of evidence or working state).
