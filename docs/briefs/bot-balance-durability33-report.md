# Durability33 — post-repair Jungle regression, T1 Mountain earned entry, gated Jungle breadth

Date: 2026-09-18

Status: complete; executed once, sequentially, at the frozen packet revision

Scope: three separately reported blocks (Jungle repair regression, T1 Mountain at the route's
earned entry, Jungle breadth gated on Block A's behavior). Synthetic evidence only
(`synthetic=true`, `economyEligible=false`). No production/source edit, commit, push, or
follow-up run.

> **CORRECTION RECORD - added 2026-09-18 by the command center after recomputing from the
> sealed raw artifacts.** The execution record below stands; five conclusions do not. See
> [the corrected review](bot-balance-durability33-review-and-next-steps.md).
>
> 1. **The Durability32 stall was diagnosed, not a separate undiagnosed bug.** It was located
>    at measured coordinates as a centre-outside / footprint-overlapping false negative, and
>    that is exactly what this packet's admission fix targeted. The claim that it "was never
>    diagnosed or targeted" is wrong.
> 2. **Exposure was undercounted, and the comparison used mismatched definitions.** 3/12 was
>    sampled-geometry exposure compared against Durability32's superseded event-based 1/12;
>    the corrected Durability32 figure is 8/12 geometric. Measured by escape events,
>    Durability33 Block A is also **8 of 12**, with **17 attempts and 17 successes**. Block C
>    is 15 of 36 with **41 attempts and 41 successes**. Across both blocks: **58 escapes, 58
>    successes, zero failures.** 1 Hz sampling misses contacts resolved between samples.
> 3. **The Mountain death table is wrong for Striker: control is 2/3, not 3/3.** Striker
>    control seed 57001 survived its full window (minHP 0.479); the candidate died at
>    273,700 ms. Arm totals are control 15/18 and candidate 14/18, and the three outcome flips
>    are striker 57001 survived->died, conduit 57001 and spirit 57001 died->survived.
> 4. **Conduit's zero owner attack beats is BY DESIGN, not missing exposure.** The summoner
>    archetype attaches `CannotAttack`; Champion (`battle-bond`) is the one specialization that
>    restores a direct attack, and it is not available at T1. Conduit also *did* take Power
>    Shots on the owner in every run (1-2 landed each) and *did* die once. Calling its survival
>    invalid was a shortcut, and it came from this chain's own earlier framing.
> 5. **The Power Shot effect is -18.71%, not -22.1%.** The pooled medians compared 41 landed
>    hits against 48 from diverging sequences. Matched hits at the same cast ordinal and the
>    same resolve time give a median ratio of 0.8129 over 18 pairs, ranging -12.5% (striker) to
>    -22.1% (spirit). Strong Kick over 21 matched pairs is ratio **exactly 1.000** - which is
>    the rigorous form of "unchanged", not equal medians over unequal counts.
>
> Also: `navigationGate` on Mountain is now reported as **not-applicable** rather than
> `inconclusive`; the node authors no player-avoided feature, so there was never a question to
> answer. Raw artifacts were read and never modified.

## Executive result

All three blocks completed and verified: exit 0, no `stopped.json`, no watchdog kill, wall time
295,682 ms (4m 55.7s) against a 3h ceiling. 84/84 planned observations ran.

- **Block A (jungle-repair):** the centre-vs-footprint fix holds where exercised. 3 of 12
  observations entered a bush's padded avoidance envelope (vs. Durability32's 1 of 12); all 3
  escaped cleanly and none ended trapped or unexplained. **`navigationGate: pass`.** Just as
  important: **all 12 observations reached `window-ended`** — the separate idle/no-target/no-
  motion freeze that hit 5 of 12 Block A observations in Durability32 did not recur here. That
  freeze was never diagnosed or targeted by this packet's fix, so its absence is a favorable
  incidental finding, not a certified repair of a second bug — 12 observations is too thin a
  sample to rule out recurrence under different seeds.
- **Block B (mountain-entry):** using the route's actual arrival kit (+3, Swamp vest/charm,
  Plains boots) instead of Durability32's weaker +0 first-arrival preset, death rates stay high
  for melee/ranged roots (striker, squire, apprentice, slinger: 2–3 deaths of 3 seeds per arm)
  and low for the two roots with owner-side sustain (conduit, spirit). Conduit again logs **zero
  owner attack beats in all 6 of its cells** — its survival is minion-driven, not player
  durability, exactly the Durability32 trap the packet warned against. Three seed/root pairs
  flip terminal outcome between arms (striker 57001: control survives, candidate dies — opposite
  the naive expectation; conduit 57001 and spirit 57001: control dies, candidate survives). The
  attributed Power Shot audit (`charged-cast-audit.mjs`, 200 ms window) shows the **real**,
  isolated effect: median landed Power Shot damage drops from 90.6 HP (control) to 70.6 HP
  (candidate), a −22.1% cut, while Strong Kick is unchanged (median 65 HP both arms) — the
  packet's own warning about comparing largest-hit-to-largest-hit confirmed again: at this kit,
  Strong Kick (not Power Shot) is Cliff Hopper's largest hit in both arms. `navigationGate` on
  this block reports **inconclusive** — expected and uninformative, since `node-t1-mountain-01`
  authors no player-avoided feature; the gate machinery is Jungle-scoped and was applied
  uniformly, not a finding about Mountain.
- **Block C (jungle-breadth):** gate opened correctly (`jungle-repair` verified and
  behavior-passed). **All 36 observations reached `window-ended`, zero deaths, zero
  wall-ceiling** — a marked change from Durability32's 13 of 36 wall-ceiling censoring
  concentrated in apprentice/spirit. `navigationGate: pass` (4 of 36 exercised a bush envelope,
  all clean, no trapped or unexplained rows). Minimum HP fraction stayed in 0.878–1.000 across
  all 36 runs; `longQuiet` never fired; peak concurrent player-pursuers never exceeded 3. This is
  now full-window, uncensored gross-durability coverage for all six roots on both T4A Jungle
  nodes, not the apprentice/spirit-truncated picture from Durability32.

**No global conclusion follows from any block.** Block A and C's clean, fully-uncensored windows
are a favorable result but a 3-seed, single-packet sample; Block B is a screen, not a verdict,
per the packet's own framing, and its one class with the most survival (Conduit) is missing
exposure rather than demonstrating durability.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability33-operator-packet.md |
| Frozen revision | e4e39bc59a270da94f9461fb8afbdf94c8690c9a |
| Frozen tree | aa24ae5ae6ed8b5713f62698fbe6401384d43241 |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Trial | durability33 |
| Navigation diagnostics | off (per packet — gameplay screen, not profiling) |
| Output root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability33-20260918 |
| Detached worktree | .../durability33-20260918/source (`git worktree add --detach`, HEAD e4e39bc5) |
| `pnpm install --offline --frozen-lockfile` | exit 0 |
| Batch start / end | 2026-09-18T10:53:41.909Z → 2026-09-18T10:58:37.590Z |
| Wall time | 295,682 ms (4m 55.7s) |
| Operator exit | exit 0 |

Per-block ledger (`operator-ledger.jsonl`):

| Block | Start | End | Exit | Timed out |
|---|---|---|---:|---|
| jungle-repair | 10:53:41.909Z | 10:54:04.493Z | 0 | false |
| mountain-entry | 10:54:06.727Z | 10:56:32.537Z | 0 | false |
| jungle-breadth | 10:56:34.502Z | 10:58:34.342Z | 0 | false |

Block-level verification (`verification.json`), all `verified: true`:

| Block | Cells | Runs | Censored | Complete windows |
|---|---:|---:|---:|---:|
| jungle-repair | 4 | 12 | 0 | 12 |
| mountain-entry | 12 | 36 | 0 | 7 |
| jungle-breadth | 12 | 36 | 0 | 36 |

"Complete windows" counts full-duration (`window-ended`) outcomes; mountain-entry's low count
(7 of 36) is the block's own subject — most builds die before the 300 s window, which is the
expected shape at T1 against an 8-archer roster, not a data-quality problem. `censored: 0`
everywhere — every observation resolved to an explicit terminal outcome.

No `stopped.json` in any block or at batch level; no global identity fault fired.

## Block A — Jungle repair regression (12 observations)

Setups: the four Durability30/31/32 T4A cells (node-t4-jungle-03 apprentice/slinger,
node-t4-jungle-05 apprentice/spirit), seeds 44017/46021/48017, 120 s window or first death,
`ready.hpTreatment: []` confirmed. Historical seeds reused deliberately, per the packet, to
revisit the known Durability32 failures — not a fresh independent sample.

### Outcomes

All 12 observations reached `window-ended` at the full 120,000 ms. Zero `wall-ceiling`, zero
`player-died`.

### Applying the packet's frozen predicates

`server/scripts/navigationGate.ts` computed exposure/verdict from sample positions against the
frozen geometry (`moverOverlapsBlockShapes`), not from `hazard-escape` event presence:

| Observation | `everObstructed` | `everInside` | Exposure | Verdict |
|---|---|---|---|---|
| jungle-03-apprentice-s44017 | false | false | not-exercised | clean |
| jungle-03-apprentice-s46021 | false | false | not-exercised | clean |
| jungle-03-apprentice-s48017 | true | false | **exercised** | clean |
| jungle-03-slinger-s44017 | false | false | not-exercised | clean |
| jungle-03-slinger-s46021 | false | false | not-exercised | clean |
| jungle-03-slinger-s48017 | false | false | not-exercised | clean |
| jungle-05-apprentice-s44017 | true | false | **exercised** | clean |
| jungle-05-apprentice-s46021 | false | false | not-exercised | clean |
| jungle-05-apprentice-s48017 | false | false | not-exercised | clean |
| jungle-05-spirit-s44017 | false | false | not-exercised | clean |
| jungle-05-spirit-s46021 | false | false | not-exercised | clean |
| jungle-05-spirit-s48017 | true | false | **exercised** | clean |

**3 of 12: exercised, all clean (repair pass). 9 of 12: not exercised. 0 of 12: trapped or
unexplained.** `navigationGate: pass`. None of the 3 exercised rows ever end `everInside: true`
(the exact Durability32 failure signature — centre outside the bush with its footprint still
overlapping — is absent in every exercised row here).

Exercised is still a minority (3 of 12): these seeds mostly steer clear of bush geometry in
these four setups, same conclusion as Durability32. A repeat designed to force bush contact
would still give a stronger read, but this run's exercised sample tripled and remained
100% clean.

### The Durability32 idle-freeze signature: absent here

Durability32 found 5 of 12 Block A observations hitting `wall-ceiling` with a fixed position, no
selected target, no motion, and no `hazard-escape` event — a distinct failure the fix did not
target. **None of the 12 observations in this run show that signature; all 12 completed their
full window.** This packet did not diagnose or repair that freeze, so its absence here is
reported as an observation, not a claim that it is fixed — 3 historical seeds is not enough to
rule out recurrence.

### TTK evidence (all 12, full window)

| Cell | Seeds | Kills / censored | Clean N | Median TTK (s) | Deaths |
|---|---:|---:|---:|---:|---:|
| jungle-03-apprentice-baseline | 3 | 64 / 1 | 64 | 3.30 | 0 |
| jungle-03-slinger-baseline | 3 | 70 / 3 | 70 | 2.15 | 0 |
| jungle-05-apprentice-baseline | 3 | 70 / 1 | 70 | 2.20 | 0 |
| jungle-05-spirit-baseline | 3 | 79 / 2 | 79 | 2.30 | 0 |

Full-window coverage in all four cells (no wall-ceiling truncation), unlike Durability32's
partial coverage for the same four setups.

## Block B — T1 Mountain at the route's earned entry (36 observations)

Six roots × two arms (control Power Shot 2.2 / candidate 1.8) × three fresh seeds
(57001/59021/61003), 300 s window or first death, `node-t1-mountain-01` (heavy), the route's
actual arrival kit (+3, `swamp-vest-t1`/`swamp-charm-t1`/`plains-boots-t1`, `second-wind`
guard) — the packet's single deliberate delta from Durability32's weaker +0 first-arrival
preset. `verification.json`: 12 cells / 36 runs / 0 censored / 7 complete windows.

### Terminal outcomes and exposure

| Root | Control deaths / 3 | Candidate deaths / 3 | Owner attack beats (6 cells) | Notes |
|---|---:|---:|---:|---|
| striker | 3 | 3 | present (11–204/run) | s57001 flips: **control survives (47.9% min HP, window-ended), candidate dies** |
| squire | 3 | 3 | present (3–14/run) | identical seed-by-seed outcomes both arms |
| apprentice | 3 | 3 | present (5–35/run) | identical seed-by-seed outcomes and elapsed times both arms |
| slinger | 3 | 3 | present (20–149/run) | identical outcomes s57001/s59021; s61003 both die but at very different elapsed times (111.8s vs 193.4s) |
| conduit | 1 | 0 | **zero in all 6 cells** (94–483 minion beats instead) | control dies once (s57001); candidate survives all 3 — but 0 owner attack beats means this is missing exposure, not durability |
| spirit | 3 | 1 | present (52–215/run) | s57001 flips: **control dies (73.2s), candidate survives (window-ended, 40.6% min HP)** |

Three seed/root pairs flip terminal outcome between arms: striker/57001 (opposite the naive
"weaker archer = safer" expectation — control, the *higher*-multiplier arm, is the one that
survives), and conduit/57001 and spirit/57001 (both in the expected direction — the weaker
candidate arm survives where control died). With only 3 seeds and mixed-direction flips, this
does not establish a consistent survival effect; it is consistent with the packet's own framing
that the earned-entry context is "unknown" territory rather than a settled lever.

Conduit's near-total survival (5 of 6 cells window-ended) mirrors the exact Durability32 trap
flagged in the packet: **0 owner attack beats in every one of its 6 runs**, confirmed again
here. All of conduit's combat activity in this block is minion attack beats (94–483 per run).
Conduit's outcome in this block is not evidence about player durability at this kit.

### Attributed Power Shot and Strong Kick (`charged-cast-audit.mjs`, 200 ms window)

Run read-only over the sealed Block B evidence (`events.jsonl` + `samples.jsonl`, no
timestamp-only guessing — only a `monster-cast-end{fired:true}` tied to a same-monster damage
event within 200 ms counts as landed):

| Cast | Arm | Landed | Interrupted | Unattributed | Min | Median | Max |
|---|---|---:|---:|---:|---:|---:|---:|
| Power Shot | control | 41 | 1 | 0 | 72 | 90.6 | 106 |
| Power Shot | candidate | 48 | 1 | 0 | 60 | 70.6 | 86 |
| Strong Kick | control | 40 | — | — | 64 | 65 | 91 |
| Strong Kick | candidate | 47 | — | — | 64 | 65 | 91 |

**Attributed Power Shot median drops 90.6 → 70.6 HP, a −22.1% cut** (not the naive 18% implied
by the raw 2.2→1.8 multiplier ratio). **Strong Kick is bit-for-bit unchanged between arms**
(same distinct value set, same median). This reproduces the packet's warned-about trap directly:
comparing "largest hit" between arms without attribution would compare an unchanged Strong Kick
against itself and read as no effect, when the isolated Power Shot effect is a real −22.1%.

Final blows across all 29 deaths: Cliff Hopper Strong Kick killed 16, an unspecified Ridge
Ambusher basic attack killed 9, Ridge Ambusher Power Shot killed 4. Power Shot is a minority of
kill-attributed final blows at this kit even though its own hit size shrinks substantially under
the candidate.

### Counterplay audit

Consistent with the packet's description: Power Shot authors no `aoe` (no `slam-telegraph`
event anywhere in the block), and the archer's cast completes regardless of player movement.
Brace was not in the guard loadout (tier-default `second-wind` only, per the packet's
instruction not to grant an unaffordable mitigation tool).

### `navigationGate` for this block

`inconclusive` — every one of the 36 rows reports `exposure: unknown`, `reason: "node authors
no player-avoided feature"`. This is the expected, correct result for a non-Jungle node; the
gate's geometry-derived predicate is Jungle-scoped machinery applied uniformly across blocks and
is not a finding about Mountain's navigation.

### Conclusion for Block B

**No global T1 conclusion follows.** At the route's actual earned-entry kit, four of six roots
(striker, squire, apprentice, slinger) die at a similarly high rate in both arms with mixed-
direction flips on the seeds that do diverge — the multiplier is not a clean, isolated survival
lever here either. Conduit's apparent safety is a missing-exposure artifact (0 owner attack
beats), not durability evidence, and must not be read as "conduit is fine at this kit." The one
attributable, consistent effect across the block is that **2.2→1.8 cuts the attributed Power
Shot hit by 22.1% (median)** without a correspondingly clean survival-rate effect at n=3 seeds.
Per the packet: retain current behavior, retain the candidate for adoption review, or investigate
a named remaining issue — **no adoption decision is made here.**

## Block C — Jungle breadth, gated on Block A's behavior (36 observations)

Gate check: Block A `artifactVerified: true` and `navigationGate: pass` → `jungle-breadth`
opened (`operator-ledger.jsonl`: `status: gate-open, reason: prerequisite-verified-and-behavior-
passed`). Six roots × nodes 03/05 × Durability32's breadth seeds (51001/53017/55009), 300 s
window or first death, shipped T4A cells, current stats, no overlay. `verification.json`: 12
cells / 36 runs / 0 censored / 36 complete windows.

### Zero deaths, zero censoring — full-window coverage for all six roots

**36 of 36 observations reached `window-ended`. 0 deaths. 0 `wall-ceiling`.** This is a marked
change from Durability32's 13 of 36 wall-ceiling rows (concentrated 6/6 apprentice, 5/6 spirit)
— every root now has complete, uncensored 300 s coverage on both nodes, not just
striker/squire/slinger/conduit. This block did not diagnose why the prior censoring occurred (no
new Jungle HP treatment proposed or introduced here, per the packet); it is reported as an
observation.

`navigationGate: pass`. 4 of 36 rows exercised a bush envelope (jungle-03-spirit/51001,
jungle-05-apprentice/51001, jungle-05-apprentice/53017, jungle-05-spirit/51001), all clean
(`everInside: false` in every case), 32 not-exercised, 0 trapped, 0 unexplained.

### Pressure and quiet-gap evidence

Across all 36 runs: minimum HP fraction ranged 0.878–1.000 (never dropped below 88% of max HP);
`maxQuietMs` ranged 3,700–20,000 ms with `longQuiet` never triggering; peak concurrent
player-pursuers never exceeded 3. This is low, bounded pressure for the sampled roster at this
kit — not a claim that Jungle T4 is universally safe or that no specialization/elite variant
would pressure harder.

### Gross durability by root and node

| Cell | Kills / censored | Clean N | Median TTK (s) | Solo/small/swarm |
|---|---:|---:|---:|---|
| jungle-03-striker | 200 / 1 | 200 | 1.90 | 205 / 5 / 0 |
| jungle-03-squire | 103 / 1 | 103 | 6.20 | 109 / 6 / 0 |
| jungle-03-apprentice | 157 / 3 | 157 | 3.40 | 126 / 4 / 2 |
| jungle-03-slinger | 160 / 2 | 159 | 3.00 | 112 / 2 / 3 |
| jungle-03-conduit | 151 / 0 | 151 | 3.70 | 140 / 8 / 0 |
| jungle-03-spirit | 194 / 2 | 194 | 2.40 | 183 / 6 / 0 |
| jungle-05-striker | 242 / 1 | 242 | 1.50 | 241 / 14 / 0 |
| jungle-05-squire | 129 / 2 | 129 | 4.60 | 123 / 11 / 0 |
| jungle-05-apprentice | 172 / 1 | 172 | 2.40 | 149 / 16 / 1 |
| jungle-05-slinger | 212 / 0 | 212 | 1.60 | 195 / 9 / 0 |
| jungle-05-conduit | 178 / 3 | 178 | 2.10 | 163 / 3 / 1 |
| jungle-05-spirit | 218 / 2 | 217 | 2.00 | 205 / 3 / 1 |

Do not pool across cells: fast classes (striker, spirit, slinger) log 2–3× the kills of squire
in the same window, which would dominate any pooled median. Read per-cell/per-root, as above.

### Conclusion for Block C

This is a usable-coverage and gross-durability screen only — zero deaths and full-window
coverage for all six roots at this kit, not proof that every Jungle T4 tier, specialization, or
elite variant is balanced. No new Jungle HP treatment is proposed here, per the packet.

## Uncertainty and what this packet does not establish

- Block A's repair predicate was exercised in only 3 of 12 observations (up from 1 of 12 in
  Durability32); all 3 were clean, but this remains a thin sample for full certification.
- Block A's and Block C's absence of the Durability32 idle-freeze signature (0 wall-ceiling in
  48 combined observations, vs. 18 in Durability32) was not diagnosed as fixed — it was never
  the target of this packet's repair. Do not treat this as a confirmed second fix.
- Block B's earned-entry context produced mixed-direction outcome flips on 3 of 18 seed/root
  pairs at n=3 seeds — not enough to establish a directional survival effect, even though the
  attributed Power Shot hit-size effect (−22.1% median) is directly measured and consistent.
- Conduit's survival in Block B is a missing-exposure artifact (0 owner attack beats in all 6
  cells) and must not be cited as class durability evidence.
- Zero deaths in Block C's 36 observations is bounded survival evidence for the sampled seeds,
  roots, and gear — not unlimited safety, and says nothing about Jungle elites or
  specializations outside this roster.
- No pilot data is pooled into any of the above; pilots were logged separately per the packet
  and are not referenced here.

## Recommendations

1. **Block A / repair:** the centre-vs-footprint fix looks solid where exercised (3/3 clean,
   tripled exercised rate vs. Durability32) and the previously-unexplained idle-freeze did not
   recur in this run. Neither claim is fully certified at this sample size; a repeat targeted at
   guaranteeing bush contact, and a separate look at whether the idle-freeze is actually gone or
   just not hit by these seeds, would both strengthen the read.
2. **Block B:** retain current Power Shot behavior (2.2) for now; flag the 1.8 candidate for
   adoption review given the consistent, directly attributed −22.1% Power Shot hit-size
   reduction — but do not adopt on this screen alone. Separately, flag Conduit's missing owner
   attack-beat exposure at T1 Mountain as a named remaining issue worth its own investigation,
   independent of this A/B question. The affordability gap for Brace at T1 (documented in the
   packet) remains a design question for the command center, not something to work around here.
3. **Block C:** no action needed on Jungle T4 HP; the full-window, zero-death, zero-censoring
   result is a clean baseline for future comparisons but not a balance verdict.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability33-20260918`

Key artifacts:

- `operator-exit.json`
- `results/batch-manifest.json`, `results/batch-ended.json`, `results/operator-ledger.jsonl`
- `results/jungle-repair/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `jungle-repair-navigation-gate.json`
- `results/mountain-entry/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `mountain-entry-navigation-gate.json`,
  `mountain-entry-casts.json`/`mountain-entry-casts-summary.json` (charged-cast attribution, run
  post hoc over the sealed evidence)
- `results/jungle-breadth/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `jungle-breadth-navigation-gate.json`
- `results/<block>/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}` for all
  84 observations

No `stopped.json` was produced in any block or at batch level. The detached worktree at
`.../durability33-20260918/source` remains checked out at the frozen revision; it was not
cleaned up per the operator boundaries (no unplanned deletion of evidence or working state).
