# Durability36 — T1 Mountain local armor adaptation, and the Jungle T2/T3/T4 duration ladder

Date: 2026-09-18

> **CORRECTION NOTE — 2026-09-18, added after the command-center review.** The execution and every
> count in this report stand and were verified against raw; D36 was **not** rerun. Five prose/
> interpretation findings are corrected below. Numbers in the tables are unchanged.
>
> 1. **The "Conduit is consistently the slowest root" claim is wrong at T4.** The root tables in
>    this report make **Squire** slower than Conduit for both durable T4 bodies: Apex Silverback
>    12,800 ms (Squire) vs 9,550 ms (Conduit), and Emerald Constrictor 17,000 vs 14,900. The claim
>    holds only for T3 Silverback (27,450 vs 12,400). Do not use the original sentence to rank
>    roots.
> 2. **"every other root's T4 range (38–53)" is contradicted by this report's own Conduit
>    figures.** Conduit's T4 kill counts are 31, 26 and 29 — outside 38–53. Squire (21, 22, 24) is
>    the lowest, but it is not the only root below that band. Do not use that sentence to rank
>    classes.
> 3. **Zero casts does not mean zero non-cast mechanics.** Seven Block J species recorded no cast
>    activity, but `rampOnCombat` (Apex/Silverback), `cadenceFinisher` (Constrict),
>    `openingStrike` (Snake/Stalker/Panther) and `dotEffect` venom all emit **no cast event by
>    construction**. Their exposure must be read from the existing damage evidence or stated as
>    **unmeasured**; an inapplicable cast counter is not evidence of an absent mechanic, and no new
>    broad instrumentation is needed to say so.
> 4. **Second Wind activations are not Brace mitigation windows.** The zero `ability-guard`
>    interval metric in Block M is **inapplicable/unverified** for the question it was read
>    against, not a newly established ability failure. The report's own uncertainty bullet already
>    declined to diagnose it; this note makes the disposition explicit.
> 5. **The episode-duration figures need a definition check before being called pull-to-clear
>    time.** The T2 and T4 p10 values are 0 ms, i.e. the set contains zero-duration observations.
>    That is a secondary field; it does **not** delay or alter the body-TTK decision, which is the
>    primary measurement for the ladder.
>
> What is **not** corrected: the Block J direction. Primary-lineage equal-weight body clean-TTK
> falls 10,950 → 9,950 → 6,550 ms, and that finding drove the adopted Jungle ladder.

Status: complete; executed once, sequentially, at the frozen packet revision. Two independent
blocks, 24 cells / 72 observations. Synthetic evidence only (`synthetic=true`,
`economyEligible=false`). No production/source edit, commit, push, or follow-up run. Counts below
are read mechanically from `index.json`, `manifest.json`, `verification.json`, and the derived
audits, not hand-typed.

## Executive result

Batch completed and verified: `batch-ended.json` records `artifactVerified: true` for both blocks
and `navigationGate.status: "pass"` for Block J, wall time 290,277 ms (4m 50.3s) against a 3h
ceiling. No `stopped.json` at block or batch level. Both blocks report `verified: true` in their
own `verification.json` with 0 censored *runs* (Block M has partial-window `censored` targets
within surviving runs — see below, not censored runs).

| Block | Cells | Runs | Complete windows (`window-ended`) | Deaths (`player-died`) |
|---|---:|---:|---:|---:|
| `mountain-armor` | 6 | 18 | 10 | 8 |
| `jungle-ladder` | 18 | 54 | 54 | 0 |

- **Block M (armor swap):** across the 9 matched control/candidate pairs (3 residual contexts × 3
  seeds), the local-armor arm (Fallen Knight Plate) never does worse than the reference arm
  (Arcane Wrappings) in more than one of the four joint-outcome cells, and in one specific pair
  (Apprentice, swarming node, seed 75011) the *reference* arm is the one that survives while
  local-armor dies. Full joint table below — this is not a uniform win.
- **Block J (duration ladder):** all 54 observations reached `window-ended` (0 deaths). Both the
  primary-lineage equal-weight body clean-TTK (jungle-ape 10,950 ms → silverback 9,950 ms →
  apex-silverback 6,550 ms) and the median multi-species episode/pull-to-clear duration (T2 5,200
  ms → T3 5,050 ms → T4 4,400 ms) **decrease** tier to tier in this dataset, while median
  kills-per-300s **rises** (T2 22.5 → T3 30 → T4 41). These are reported together, not resolved
  into one verdict — see the Block J caveats.

No mob closure or playtest readiness is claimed. The next decision belongs to the balance command
center.

## Frozen identity and execution

| Item | Value |
|---|---|
| Packet | docs/briefs/bot-balance-durability36-operator-packet.md |
| Frozen revision | 0e28217b76df2d1ec130ff753cf09ffe69d04710 |
| Frozen tree | 979afe19bfc8d2d00f463eb006d6b7d8ef9619d5 |
| Definitions hash | 80f64f6e9857708e29d126643bd1da4cdfdd17fecdd0482ae1c48593e1e45839 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Trial / Blocks | durability36 / `mountain-armor`, `jungle-ladder` |
| Output root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability36-20260918 |
| Batch started / ended | 2026-09-18T14:49:10.582Z → 2026-09-18T14:54:00.858Z |
| Wall time | 290,277 ms (4m 50.3s) |
| Order | M → J, sequential, per the packet |

Adopted baseline this packet sits on: `ridge-archer` and `cliff-hopper` base attack is 40 in
authored source (the Durability35 package, accepted before this run). Block M carries **no
monster contrast** — both arms fight the same adopted-baseline monsters; the only manifest-level
difference between arms is the `armor` slot in `gearItemIds` (`swamp-vest-t1` reference vs
`mountain-vest-t1` local-armor), confirmed cell-by-cell in `mountain-armor/manifest.json`.

---

## Block M — `mountain-armor` (18 observations, 3 contexts × 2 arms × 3 seeds)

Contexts (all read from `manifest.json`, not inferred from cell-id text):

| Context | Node | Root | Class root |
|---|---|---|---|
| Slinger / heavy | `node-t1-mountain-01` | slinger | `reload-root` |
| Apprentice / heavy | `node-t1-mountain-01` | apprentice | `dot-root` |
| Apprentice / swarming | `node-t1-mountain-02` | apprentice | `dot-root` |

Seeds `75011`, `77003`, `79001` — reused deliberately from Durability35 to revisit these specific
cases, not a fresh independent confirmation.

### All four paired joint outcomes (from `audits/mountain-armor-guard-windows.json`, `paired.joint`)

9 pairs, matched on (root, node, seed):

| Joint category | Count |
|---|---:|
| control (reference) died → candidate (local-armor) survived | 5 |
| both survived | 2 |
| both died | 1 |
| control (reference) survived → candidate (local-armor) died | **1** |

Unlike Durability35's enemy-pressure package (which produced zero occurrences of the "reference
survived, candidate died" category across 36 pairs), **this packet's armor swap does produce one
adverse flip**: `apprentice|node-t1-mountain-02|75011` — reference survives the full 300 s window,
local-armor dies at 221,900 ms. The other discordant pairs all favour local-armor:

| Pair key | Favoured | local-armor aliveMs | reference aliveMs |
|---|---|---:|---:|
| slinger\|node-t1-mountain-01\|75011 | local-armor | 300,000 | 204,500 |
| slinger\|node-t1-mountain-01\|77003 | local-armor | 300,000 | 146,300 |
| slinger\|node-t1-mountain-01\|79001 | local-armor | 300,000 | 288,800 |
| apprentice\|node-t1-mountain-01\|75011 | local-armor | 300,000 | 242,500 |
| apprentice\|node-t1-mountain-02\|75011 | **reference** | 221,900 | 300,000 |
| apprentice\|node-t1-mountain-02\|77003 | local-armor | 300,000 | 259,800 |

Arm-level summary (`armSummary`): reference 9 observations / 6 deaths / 3 complete windows /
2,233.9 total alive-seconds; local-armor 9 observations / 2 deaths / 7 complete windows / 2,393.2
total alive-seconds.

### Per-observation survival, minHP, and terminal HP (from `index.json`, cross-checked against
`ready.json` maxHp and the final `samples.jsonl` line — 18/18 records tallied)

`minHpFraction` is the **lowest HP ever observed** in the run (index.json). Terminal HP is a
separate figure: for `player-died` runs it is 0 by definition (the run ends in death); the
1000 ms-granularity sample immediately preceding death is reported separately below and is **not**
the same thing (it can read well above 0, since death lands between samples). For `window-ended`
runs, terminal HP is the last recorded `hp / maxHp` sample fraction.

| Node | Root | Arm | Seed | Outcome | Alive (ms) | minHP | Terminal HP | Last pre-death sample HP |
|---|---|---|---:|---|---:|---:|---:|---:|
| heavy | slinger | reference | 75011 | died | 204,500 | 0.000 | 0 | 0.146 (203,500ms) |
| heavy | slinger | reference | 77003 | died | 146,300 | 0.000 | 0 | 0.417 (145,300ms) |
| heavy | slinger | reference | 79001 | died | 288,800 | 0.000 | 0 | 0.878 (287,800ms) |
| heavy | slinger | local-armor | 75011 | survived | 300,000 | 0.137 | 0.824 | — |
| heavy | slinger | local-armor | 77003 | survived | 300,000 | 0.024 | 1.000 | — |
| heavy | slinger | local-armor | 79001 | survived | 300,000 | 0.152 | 1.000 | — |
| heavy | apprentice | reference | 75011 | died | 242,500 | 0.000 | 0 | 0.329 (241,500ms) |
| heavy | apprentice | reference | 77003 | survived | 300,000 | 0.346 | 1.000 | — |
| heavy | apprentice | reference | 79001 | survived | 300,000 | 0.037 | 0.731 | — |
| heavy | apprentice | local-armor | 75011 | survived | 300,000 | 0.217 | 0.802 | — |
| heavy | apprentice | local-armor | 77003 | survived | 300,000 | 0.065 | 1.000 | — |
| heavy | apprentice | local-armor | 79001 | survived | 300,000 | 0.104 | 1.000 | — |
| swarming | apprentice | reference | 75011 | survived | 300,000 | 0.036 | 1.000 | — |
| swarming | apprentice | reference | 77003 | died | 259,800 | 0.000 | 0 | 0.298 (258,800ms) |
| swarming | apprentice | reference | 79001 | died | 192,000 | 0.000 | 0 | 0.000 (191,000ms) |
| swarming | apprentice | local-armor | 75011 | died | 221,900 | 0.000 | 0 | 0.118 (220,900ms) |
| swarming | apprentice | local-armor | 77003 | survived | 300,000 | 0.037 | 1.000 | — |
| swarming | apprentice | local-armor | 79001 | died | 71,300 | 0.000 | 0 | 0.000 (70,300ms) |

Several survivors end the window well below full HP despite never dipping to the observed
minimum inside that same run being much lower (e.g. heavy/apprentice/local-armor/75011 bottoms at
21.7% but ends at 80.2%) — a near-miss followed by recovery, not a comfortable margin the whole
run. `apprentice|swarming|79001` (both arms) is the fastest recorded death in the block (71,300 ms
local-armor, 192,000 ms reference), and its last pre-death sample already reads 0 HP — a case where
the 1000 ms sampling window happened to catch a near-zero tick, unlike the other deaths.

### Productive combat and throughput (from `mountain-armor/analysis.md`, tallied against
`index.json`)

| Cell | Kills / censored (3 seeds pooled) | Clean N | Median clean TTK (s) | Deaths /3 |
|---|---:|---:|---:|---:|
| slinger-reference (heavy) | 53 / 9 | 52 | 6.00 | 3 |
| slinger-local-armor (heavy) | 71 / 4 | 68 | 6.00 | 0 |
| apprentice-reference (heavy) | 58 / 2 | 55 | 5.40 | 1 |
| apprentice-local-armor (heavy) | 61 / 3 | 59 | 5.50 | 0 |
| apprentice-reference (swarming) | 53 / 7 | 48 | 5.40 | 2 |
| apprentice-local-armor (swarming) | 45 / 7 | 41 | 5.40 | 2 |

"Censored" here means monster-kill targets still in progress or unresolved when the observation
ended (death or window end), not censored *runs* — every one of the 18 planned runs completed and
is present in `index.json`.

### Guard/ability activity against alive time (activations are ability *casts*, not confirmed
"guard windows" — see below)

`audits/mountain-armor-guard-windows.json` reports `guardWindows: 0` and
`activationsPerAliveMinute: 0` for **both** arms in its own `armSummary`, and every one of the 18
per-row `guardWindows` / `hitsGuarded` fields is also 0 — despite Second Wind (`second-wind`)
firing 93 times (reference) and 107 times (local-armor) across the block. Recomputing activations
per alive minute directly from the 18 rows:

| Arm | Second Wind activations | Sweep activations | Total alive time | Second Wind / alive-min | Sweep / alive-min |
|---|---:|---:|---:|---:|---:|
| reference | 93 | 248 | 37.23 min | 2.50 | 6.66 |
| local-armor | 107 | 252 | 39.89 min | 2.68 | 6.32 |

`hitsGuarded` is 0 in every row of both arms (`hitsUnguarded` 634 reference / 817 local-armor).
Read together, the ability fires regularly but this audit never observed a damage event land while
inside a recorded guard interval under `guardBuffId: "ability-guard"` in this dataset — reported as
the audit's own observed zero, not asserted as Second Wind having no combat effect (that would
require checking the buff id and interval-closing logic independently, which is out of scope for
this report).

### Recovery between clears

From `index.json` `recovery[]` (`recoveredAtMs - afterClearMs`, all events, both nodes):

| Arm | Recovery events | Median recovery (ms) | Interrupted by next pull |
|---|---:|---:|---:|
| reference | 55 | 5,200 | 1 |
| local-armor | 43 | 4,300 | 0 |

Local-armor has fewer recovery events (fewer clears logged before censor/death cut runs short in
some reference observations) and a shorter median recovery gap; this tracks with local-armor's
higher survival rate producing longer, more continuous engagement rather than a directly
comparable per-clear effect.

### Recent damage sequences before each death

From `audits/mountain-armor-casts.json` `rows[].casts[]`, the last **matched charged cast**
recorded before each death (not necessarily the literal final blow — see final-blow attribution
below, where 4 of 8 deaths carry no ability id on the actual killing event):

| Cell | Seed | Death at (ms) | Last matched cast | Recent damage sources (3s) | Player damage (3s) | HP before that cast |
|---|---:|---:|---|---:|---:|---:|
| slinger-reference (heavy) | 75011 | 204,500 | Strong Kick | 2 | 151 | 77.2 |
| slinger-reference (heavy) | 77003 | 146,300 | Strong Kick | 2 | 151 | 63.3 |
| slinger-reference (heavy) | 79001 | 288,800 | Power Shot | 2 | 151 | 133.4 |
| apprentice-reference (heavy) | 75011 | 242,500 | Strong Kick | 3 | 133.3 | 144.4 |
| apprentice-reference (swarming) | 77003 | 259,800 | Power Shot | 2 | 66.0 | 47.4 |
| apprentice-reference (swarming) | 79001 | 192,000 | Strong Kick | 2 | 57.9 | 72.4 |
| apprentice-local-armor (swarming) | 75011 | 221,900 | Power Shot | 2 | 64.2 | 19.0 |
| apprentice-local-armor (swarming) | 79001 | 71,300 | Power Shot | 2 | 66.2 | 63.2 |

`recentDamageSources3s` counts distinct sources that damaged the player in the previous 3 s (not
simultaneous attackers, per the audit's own convention). Most fatal sequences in this block involve
2 distinct recent sources; one (apprentice-reference, heavy, seed 75011) shows 3.

### Owner vs. summon damage attribution

No Conduit (summoner) root is in Block M's three contexts. `minionAttackBeats` is 0 in all 18
`index.json` records; all combat exposure and all outgoing damage is owner-attributed
(`attackBeats` 54–247 per run). `CannotAttack` framing is not applicable to this block — that
caveat matters for Block J (below), where Conduit is present.

### Charged-cast contrast: declared baseline `reference`, comparison `local-armor`

From `audits/mountain-armor-casts-summary.json`, using its declared `armRoles` (`baseline:
reference`, `comparison: local-armor` — **not** alphabetical, per the audit's schema-4 fix) and its
`pairedSameState` (timing-matched: same cast ordinal and resolve time, **not** state-matched per
the audit's own convention):

| Cast | Matched hits | Matched run pairs | Pairs with no comparable hit | Median ratio (comparison ÷ baseline) | Median reduction from baseline |
|---|---:|---:|---:|---:|---:|
| Power Shot | 8 | 8 | 1 | 0.97468 | 2.53% |
| Strong Kick | 13 | 9 | 0 | 0.97143 | 2.86% |

Both matched-pair samples are thin (8 and 9 run pairs respectively) but show trajectories staying
comparable in almost every attempted pair here — unlike Durability35's enemy-pressure package,
where most Power Shot pairs diverged before a matchable cast. The measured per-hit reduction from
this armor swap (~2.5–2.9%) is small and consistent with the packet's framing that HP and plating
also move, not just guard potency — this is **not** an isolated guard-potency estimate.

Pooled `byLabelArm` medians (not matched-pair; descriptive only): Power Shot HP damage 71.1
(reference) → 69.3 (local-armor); Strong Kick 61.2 → 60.3. `mitigation.grossDamage` was not used to
read a coefficient effect for either cast, per the audit's own convention (a charged multiplier is
applied outside the mitigation record).

### Final-blow attribution

8 deaths total. From `mountain-armor-casts-summary.json` `finalBlows`:

| Final blow | Count |
|---|---:|
| Ridge Ambusher — unmatched to any cast | 2 |
| Cliff Hopper — unmatched to any cast | 2 |
| Cliff Hopper — charged: Strong Kick | 1 |
| Ridge Ambusher — charged: Power Shot | 3 |

4 of 8 (50%) killing blows resolve to a named charged cast; the other 4 of 8 (50%) carry no ability
id on the killing damage event and are reported as **unattributed**, not assumed to be a basic
attack.

### Acquisition boundary — preserved, not resolved

The Fallen Knight Plate recipe requires Mountain level 2, and +3 requires Mountain level 4. This
block tests a **post-acquisition farming adaptation**: an available upgrade for a build that has
already progressed past first entry into Mountain. The result above does not say anything about
first-step-into-Mountain protection, and does not grant or assume any unlock inside the synthetic
run.

---

## Block J — `jungle-ladder` (54 observations, 6 roots × 3 tiers × 3 seeds)

All 54 observations reached `window-ended` at `elapsedMs: 300,000` — **zero deaths** across the
entire block (confirmed by tallying `index.json` outcomes: `{"window-ended": 54}`). A below-window
death would not have been an infrastructure failure had one occurred; none occurred, so that
question does not arise in this dataset.

| Tier | Node | Primary lineage member | Other engaged species |
|---|---|---|---|
| T2 | `node-t2-jungle-03` | jungle-ape | jungle-snake, jungle-blowdarter (Vine Chameleon) |
| T3 | `node-t3-jungle-03` | silverback | jungle-stalker, canopy-harrier (Canopy Chameleon) |
| T4 | `node-t4-jungle-03` | apex-silverback | emerald-constrictor, thornback-lizard (Thornback Chameleon), hunting-panther |

The shared `dominion` modifier and node identity were asserted from `NODE_BIOMES` by the packet's
own preflight, not inferred from the `-03` node suffix.

### Body clean-TTK: per-species seed summaries → root summaries → equal-weight root centre

From `audits/jungle-ladder-species-timing.json` (`cleanTtkMsByRoot` / `cleanTtkMsEqualWeightRoots`;
"clean" = harness clean flag AND no observed HP regain AND a resolved kill time; median-within-seed
then median-within-root, then equally weighted across roots — every species here has
`rootsWithCleanSample: 6`, i.e. no root ever failed to produce a clean sample for any species,
so there are no missing-root cases to flag):

**T2**

| Species | striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---|---:|---:|---:|---:|---:|---:|---:|
| Jungle Ape (primary) | 13,500 | 11,400 | 10,500 | 8,800 | 11,600 | 8,400 | **10,950** |
| Jungle Snake | 5,500 | 3,800 | 4,500 | 2,950 | 4,900 | 3,500 | 4,150 |
| Vine Chameleon | 5,000 | 3,800 | 4,500 | 3,500 | 4,100 | 2,800 | 3,950 |

**T3**

| Species | striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---|---:|---:|---:|---:|---:|---:|---:|
| Silverback (primary) | 7,100 | 12,400 | 10,500 | 9,400 | 27,450 | 7,200 | **9,950** |
| Jungle Stalker | 2,600 | 2,800 | 4,500 | 3,400 | 8,400 | 2,600 | 3,100 |
| Canopy Chameleon | 2,200 | 2,800 | 4,100 | 3,450 | 5,800 | 2,500 | 3,125 |

**T4**

| Species | striker | squire | apprentice | slinger | conduit | spirit | Equal-weight centre |
|---|---:|---:|---:|---:|---:|---:|---:|
| Apex Silverback (primary) | 4,100 | 12,800 | 4,400 | 6,700 | 9,550 | 6,400 | **6,550** |
| Emerald Constrictor (**T4 control-predator role, reported separately**) | 4,850 | 17,000 | 5,000 | 7,700 | 14,900 | 7,800 | 7,750 |
| Thornback Chameleon (fast body) | 1,500 | 3,900 | 2,700 | 1,800 | 2,850 | 2,400 | 2,550 |
| Hunting Panther (fast body) | 1,300 | 4,200 | 3,000 | 1,800 | 2,950 | 2,000 | 2,475 |

Root-specific spread within a single species is large and not pooled away: Conduit is consistently
the slowest root against the durable T3/T4 bodies (Silverback 27,450 ms, Emerald Constrictor
14,900 ms, Apex Silverback 9,550 ms — all far above every other root's figure for that same
species), while Striker is consistently fastest against those same durable bodies (7,100 / 4,850 /
4,100 ms respectively). No claim is made that every fast T4 body (Thornback Chameleon, Hunting
Panther) beats every durable T3 body (Silverback, Jungle Stalker, Canopy Chameleon) in duration —
they do not have to, and this dataset does not test that comparison directly since the species
differ by tier and node.

**Primary-lineage equal-weight centre across tiers: 10,950 ms (T2, Jungle Ape) → 9,950 ms (T3,
Silverback) → 6,550 ms (T4, Apex Silverback) — this figure falls, it does not rise**, across this
specific ladder of primary lineage members and tier-legal builds. No prior-report T3 figure exists
to compare against; the "2.9 s" number appearing in earlier reports belongs to the old T4 Apex
Silverback baseline, not T3, and is not reused here — T3 is measured fresh from this data.

### Unresolved and HP-regain, kept distinct (not folded into kills)

| Species | Tier | Engaged | Killed | Clean kills | Unresolved | HP-regain observed |
|---|---|---:|---:|---:|---:|---:|
| Jungle Ape | T2 | 162 | 153 | 153 | 9 | 0 |
| Jungle Snake | T2 | 82 | 82 | 81 | 0 | 1 |
| Vine Chameleon | T2 | 179 | 178 | 177 | 1 | 1 |
| Silverback | T3 | 189 | 182 | 181 | 7 | 1 |
| Jungle Stalker | T3 | 175 | 169 | 169 | 6 | 2 |
| Canopy Chameleon | T3 | 172 | 171 | 171 | 1 | 0 |
| Emerald Constrictor | T4 | 169 | 164 | 163 | 5 | 2 |
| Apex Silverback | T4 | 191 | 184 | 182 | 7 | 3 |
| Thornback Chameleon | T4 | 180 | 179 | 179 | 1 | 0 |
| Hunting Panther | T4 | 158 | 156 | 154 | 2 | 2 |
| **Total** | | 1,657 | 1,618 | 1,610 | **39** | **12** |

This cross-checks exactly against `index.json`: summed `counts.killed` across all 54 records is
1,618 and summed `counts.hpRegain` is 12, matching the species table above. Summed `counts.censored`
is 39, matching summed `unresolved`.

### Episode/approach duration — a separate figure from body clean-TTK

Body clean-TTK (above) measures a single target's damage-to-kill window. Episode duration, from
`index.json` `episodes[]` (`outcome: "cleared"`, pull to full clear of that engagement, which can
include multiple species and late joiners in one pack), measures the actual approach/engagement
length players experience:

| Tier | Cleared episodes (n) | Median episode duration | p10 | p90 |
|---|---:|---:|---:|---:|
| T2 | 402 | 5,200 ms | 0 ms | 12,000 ms |
| T3 | 438 | 5,050 ms | 2,800 ms | 13,000 ms |
| T4 | 619 | 4,400 ms | 0 ms | 11,900 ms |

Median episode duration also falls slightly T2 → T3 → T4 in this dataset, tracking the same
direction as the body clean-TTK figures above, though it is a materially different measurement (a
single episode can bundle several kills and late joiners, so it is not a body-TTK median restated).

By root (median episode duration, ms):

| Root | T2 | T3 | T4 |
|---|---:|---:|---:|
| striker | 6,200 | 3,700 | 2,850 |
| squire | 5,200 | 5,400 | 7,600 |
| apprentice | 5,600 | 5,200 | 4,700 |
| slinger | 3,900 | 4,300 | 4,300 |
| conduit | 4,400 | 10,600 | 4,250 |
| spirit | 3,900 | 3,800 | 4,400 |

Squire is the one root whose median episode duration *rises* sharply at T4 (7,600 ms, the highest
figure in the table) rather than falling with the rest of the roster; Conduit's T3 figure
(10,600 ms) is also an outlier relative to its own T2 and T4 figures. Both are reported as
observed, not explained — this packet does not diagnose why.

### Throughput (kills per 300 s window)

| Tier | Median kills/window | Min | Max |
|---|---:|---:|---:|
| T2 | 22.5 | 18 | 29 |
| T3 | 30 | 16 | 37 |
| T4 | 41 | 21 | 53 |

Throughput **rises** tier to tier even as body clean-TTK and episode duration fall — consistent
with tier-legal gear/skill-path depth increasing player power alongside monster HP, per the
packet's own framing that this measures "experienced progression with those builds," not an
isolated mob-stat effect. Squire is the one root whose T4 kill count (21, 22, 24) sits well below
every other root's T4 range (38–53), mirroring its episode-duration outlier above.

### Owner vs. summon damage — Conduit stays attributable

Conduit's `attackBeats` is 0 in all 9 of its Block J observations (T2/T3/T4 × 3 seeds each,
confirmed directly from `index.json`); every kill Conduit's build records (23, 20, 21 at T2; 16,
16, 16 at T3; 31, 26, 29 at T4) is attributed to `minionAttackBeats` (770–1,770 per run). This is
the same `CannotAttack`-by-design shape observed in prior packets: Conduit's Block J numbers above
are minion/summon durability and throughput, not player-melee/ranged evidence, on every tier tested
here.

### Mechanic engagement, where a mechanic exists

Only three of the ten Block J species have any recorded cast activity: Jungle Ape (T2,
`castsFired`/`castsStarted` 198/200, fires on 99% of starts), Canopy Chameleon (T3, 38/70, 54%),
and Thornback Chameleon (T4, 41/72, 57%). The remaining seven species show 0 casts started across
the whole block — `mechanicFiredPerEngagement: 0` — which per the audit's own convention means the
species never showed its mechanic in this run, reported as the observed zero rather than assumed
absent by design.

---

## Uncertainty and what this packet does not establish

- Three seeds per cell (Block M) and three seeds per root/tier (Block J) are directional samples,
  not certification, for every claim above.
- Block M's one adverse flip (`apprentice|node-t1-mountain-02|75011`, reference survives,
  local-armor dies) is measured evidence from 9 pairs, not a claim that the armor swap is net
  harmful — 5 of 9 pairs still favour local-armor outright and 2 more are ties at "both survived."
- The Second Wind guard-window audit records zero guarded hits and zero guard-window intervals in
  both arms despite regular Second Wind activations; this report states that observation as-is and
  does not diagnose whether it reflects the ability's actual mechanics, a buff-id mismatch in the
  audit, or genuine non-overlap between guard timing and incoming hits.
- Block M's charged-cast paired-same-state samples are thin (8 and 9 run pairs); the ~2.5–2.9%
  measured reduction is real for those matched pairs but is not a block-wide guarantee, and this is
  a compound armor swap (HP, plating, and guard potency all move together), not an isolated
  guard-potency estimate.
- Block J's declining body clean-TTK and episode duration alongside rising throughput, tier to
  tier, is reported as measured, not resolved into a single "does duration rise" verdict — the
  packet's own framing is that these are tier-legal builds experiencing progression, not a pure
  mob-stat contrast, and the packet explicitly forbids inventing a prior T3 baseline to compare
  against.
- Emerald Constrictor is reported as its own T4 control-predator line, separate from the primary
  Apex Silverback lineage and from the two faster T4 bodies; no claim is made that fast T4 bodies
  must exceed every durable T3 body in duration.
- Squire's T4 episode-duration and throughput outliers, and Conduit's T3 episode-duration outlier,
  are observed and not explained by this dataset.
- No mob closure, no playtest readiness, and no adoption decision is claimed or made here for
  either block — that belongs to the command center.

## Artifact index

Primary batch root: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability36-20260918`

Key artifacts:

- `operator-exit.json` (if written by the launcher), `results/batch-manifest.json`,
  `results/batch-ended.json`, `results/operator-ledger.jsonl`
- `results/mountain-armor/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, and 18 per-observation
  `results/mountain-armor/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`
  directories
- `results/jungle-ladder/{manifest,index,complete,verification,analysis}.json`, `analysis.md`,
  `night5-audit.json`, `jungle-ladder-navigation-gate.json`, and 54 per-observation
  `results/jungle-ladder/<cell>-s<seed>/{ready.json,events.jsonl,samples.jsonl,summary.json}`
  directories
- `results/audits/mountain-armor-casts.json`, `results/audits/mountain-armor-casts-summary.json`
  (declared baseline `reference` / comparison `local-armor`, `pairedSameState`, `finalBlows`)
- `results/audits/mountain-armor-guard-windows.json` (arm summaries, paired joint outcomes,
  per-row activation and recovery detail)
- `results/audits/jungle-ladder-species-timing.json` (per-species seed → root → equal-weight
  centre, `perObservation` kills/engaged-species detail)
- `results/audits/jungle-ladder-casts.json`, `results/audits/jungle-ladder-casts-summary.json`
- `.log` files per block: `*-night5-audit.mjs.log`, `*-ttk-survey-report.mjs.log`,
  `*-charged-cast-audit.mjs.log`, `mountain-armor-guard-window-audit.mjs.log`,
  `jungle-ladder-species-timing-audit.mjs.log`, `jungle-ladder-navigation-gate.log`

No `stopped.json` was produced at block or batch level.
