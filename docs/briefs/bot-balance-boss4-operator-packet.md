# Boss4 operator packet — one local pressure candidate per boss, Swamp and Cave

Prepared and frozen 2026-09-19. Two bosses, six roots, **two arms**, one reused seed:
**24 fights**. It installs exactly ONE authored boss number per block, process-locally,
and restores it after every observation. **It adopts nothing into source.**

Operator: run the specified committed source and stop on drift. Do not choose staged
content, do not commit changes, do not invent a revision, do not treat silence as
permission. Your endpoint is the factual report. No production tuning, commits, pushes
or extra experiments, and no automatic follow-on.

Companion evidence: [`bot-balance-boss3-report.md`](bot-balance-boss3-report.md) — read
§§4-5 and the **§11 corrections** before interpreting anything here.

---

## 1. The question

At the Boss3 reference package that is sensible for each matchup, does a deliberate
reduction in that boss's relevant damage pressure make the reference more viable,
while preserving the fight's duration, phases and counterplay?

This is a **paired candidate comparison on six known cases**. It is deliberately
**not** a scalar search (one candidate value per boss, chosen before the run and never
re-picked), **not** a build search (the player package is frozen and IDENTICAL in both
arms of a block), **not** a win-rate estimate (one seed, six roots), and **not** an
adoption.

**These numbers are NEW DESIGN PROPOSALS.** Boss3 did not estimate an optimal
percentage and did not establish a correct damage threshold for either boss. Do not
describe either candidate as validated before it has been run. A candidate that fails
does not justify a larger cut; a candidate that succeeds does not license a general
boss nerf.

## 2. Scope, and what Boss3 settled

Boss3 ran the promised single status-removal comparison, 24/24 verified. Swamp
responded — `mire-gorged-behemoth` 0/6 → **2/6** with Cleanse in place of Brace, and
the four remaining deaths all lasted longer and removed more boss HP. Cave did not —
`chitinous-dreadbore` 0/6 → 0/6, with small mixed shifts in both directions and no
victory in either arm.

The guard/equipment permutation sequence **stops there**. Boss4 carries each block's
practical reference forward unchanged and moves the boss instead.

Not reopened, and not in scope: Boss3's sampling and HP-accounting questions (settled
as corrections, see §11 of that report), the durability campaign, Jungle navigation,
T3 Jungle pressure, earlier Mountain limitations, ECON-1, reward edits, mob testing,
guardian access, live-server replay, a full cohort, any seed sweep or variants grid, a
third arm, a second scalar, and any automatic follow-up experiment. The four remaining
T2 bosses, Timberclaw and Razortusk are **not** re-run. T1/T3/T4 boss breadth remains
separate work. Ongoing item/class/stance side reviews are read-only proposals and
**do not** alter this frozen experiment; they are excluded from the run's source.

## 3. Frozen identity

| Item | Value |
|---|---|
| Boss3 execution revision | `aedef12270214c4172c107b9596d76d29370c262` (tree `c08f1a8270b9eece69fb28c4662f111c97af6c56`) |
| Revision / tree to run | resolved **mechanically** from the branch tip; see below |
| Frozen at | `a10ed1531d30ff5fd27c369ea326ebebb22cc6a0` (tree `a873f7061715abc9e0b2704f755cdb990e59b933`), clean — the base definitions hash was re-read from this committed tip and is the `17aa46cb…` below |
| **Base definitions hash** | **`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial | `boss4` |
| Blocks | `swamp-pressure`, `cave-pressure` |
| Arms (swamp) | `swamp-current` (control), `swamp-reduced-venom` (candidate) |
| Arms (cave) | `cave-current` (control), `cave-reduced-attack` (candidate) |
| Seed | `98011` per block — the Boss2 seed, carried through Boss3 |
| Cap | 300,000 ms simulated, per fight |
| Total | 2 x 6 x 2 x 1 = **24 fights** |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss4` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss4-preflight` |

**The base definitions hash is the one Boss1 froze and Boss2/Boss3 ran, unchanged.**
That is the load-bearing pin on the *source*, and it is what makes each control arm a
replay of a specific Boss3 arm rather than a fresh measurement on a moved simulation.

**THE BASE HASH IS NOT PROOF THAT A FIGHT RAN UNTREATED, AND MUST NEVER BE READ AS
ONE.** It is computed once when the child process loads, *before* any candidate is
installed. What proves a treated arm actually ran treated is three separate per-cell
records, all asserted by the runner and all present in `ready.json`:

- `damageTreatment` — the explicit before/after change, named field and all. Empty on
  a control, exactly one entry on a candidate arm.
- `bossRuntime` — the runtime readback: the spawned body's `attack` on Cave, and
  `effectiveMonsterDot`'s live `dotDamagePerStack` on Swamp (the same function the
  on-hit listener calls, against the same entity).
- `definitionsIdentity` — `base` versus `live`, re-hashed with the treatment standing.
  A control's `live` must EQUAL `base`; a candidate's must DIFFER from it.

`hpTreatment` stays an accurate empty list on every boss screen and is **not** reused
to record a damage treatment. A run that installed a candidate never claims "installs
nothing".

**The TREE differs from Boss3's, and the simulation does not.** Boss4 adds its own
spec, tests and runner scripts (`boss4Spec.ts`, `boss4Matrix`/`boss4Pressure`,
`scripts/boss4-*.mjs`) and threads an optional per-trial treatment seam through
`bossScreen.ts`, which also gains two receipt fields (`damageTreatment`,
`definitionsIdentity`) and one readback (`bossRuntime.dotDamagePerStack`). None of
that is a monster, item, ability, Rune, reward or hitbox definition, so the base
definitions hash is **still `17aa46cb…`** — verified after the change, not assumed.
The seam is inert for Boss1-Boss3, which is checked rather than claimed: the Boss3
preflight was re-run against the modified runner during preparation and reproduced its
twelve receipt lines exactly (§6.4).

**Nothing here is a launch-time placeholder.** The revision and tree are resolved
**mechanically**, not chosen:

```bash
git rev-parse HEAD          # -> pass as --revision
git rev-parse HEAD^{tree}   # -> pass as --tree
```

`scripts/boss4-run.mjs` asserts, before creating any output, that `HEAD` equals
`--revision`, that `git status --porcelain --untracked-files=no` is empty, that the
tree hash matches, and that the hitbox file hashes to the frozen value. Verification
additionally asserts each block's manifest base definitions hash equals `17aa46cb…`
**and** that every receipt's own `definitionsIdentity.base` does too. **If a hash has
changed, the source is not what this packet froze and the run is refused.** Stop and
report.

## 4. The two encounters, and one candidate each

Re-resolved from `DUNGEON_DEFS` and `MONSTER_DATABASE`, not from filenames or
comments. `assertBoss4Definitions()` re-derives all of it at load and refuses to run
if anything has moved.

| Block | Boss | Node | HP | Atk | Plat | DR | Pattern | Summons |
|---|---|---|---:|---:|---:|---:|---|---|
| `swamp-pressure` | `mire-gorged-behemoth` | `node-t2-swamp-dungeon` | 3375 | 38 | 6 | 0.08 | none | no |
| `cave-pressure` | `chitinous-dreadbore` | `node-t2-cave-dungeon` | 4375 | 139 | 12 | 0.12 | `dreadbore-emergence` | no |

### 4.1 Swamp candidate — one field only

```
MONSTER_DATABASE['mire-gorged-behemoth'].dotEffect.damagePerStack: 9 -> 6
```

A one-third reduction of the authored Gorged Venom coefficient. **It is not a claim of
one-third lower total fight damage.** The raw four-stack coefficient changes from
**36 to 24 before any defense or multiplier** — those are authored coefficients, never
report them as measured HP damage. What the treated payload actually resolved in a
fixture is in §6.2.

**Held fixed, and pinned by assertion:** max stacks 4, tick interval 1000 ms, duration
8000 ms, the debuff identity `mire-gorged-venom`, application/refresh behaviour (no
opener stacks), ordinary attack 38, attack cadence 2800 ms, boss HP 3375, plating 6,
DR 0.08, the Corrosive Pool in full (1.1x, 1100 ms cast, 8500 ms cooldown, 115 radius,
5 per tick, 1000 ms cadence, 0.60 slow, 0.12 vulnerability for 1500 ms), and the 50%
phase exactly as authored (`enrage` atkMult 1.0 / cdMult 0.70, plus `empower-charged`
0.70 / 1.15).

**Rationale, and its limits.** Boss3 recorded every baseline death and three of four
substitution deaths with Gorged Venom as the terminal channel, and removing venom
produced a consistent practical improvement while four references still died. Lowering
the ordinary Attack field would not reach this separately authored coefficient. That
is enough to justify one local trial; it is **not** evidence that poison is the only
contributor, and the candidate deliberately preserves poison and Cleanse as meaningful
mechanics rather than deleting the mechanic or buffing Cleanse globally.

### 4.2 Cave candidate — one field only

```
MONSTER_DATABASE['chitinous-dreadbore'].stats.attack: 139 -> 104
```

`104 = round(139 x 0.75)`: approximately **25.2% less authored attack**. The intended
scope is the boss's ordinary and attack-derived pattern damage, not a global
incoming-damage modifier — and **landed damage does not fall by 25.2%**. It falls by
more, because plating subtracts before the scaling. Measured, per root, in §6.2.

**Held fixed, and pinned by assertion:** HP 4375, plating 12, DR 0.12, attack cadence
3600 ms, the `dreadbore-emergence` multiplier 1.6, the Eruption step multiplier 1.0
(and its absence of a `rawDamage` override, which would bypass the treated attack
entirely), Eruption radius 165 and its 750 ms tell, the burrow (3000 ms ceiling,
380 px/s, contact slow 0.5 for 2000 ms), the 2200 ms recovery window, base plating
shred 2/stack to 6, and the 50% phase (`empower-shred` +1 plating per stack).

The screen also asserts that neither boss carries an `engageSequence`, an ambient
ramp, or an enrage action — so `stats.attack` reaches the fight through exactly one
path (`dealsDamage.attack`, baked at spawn) and no second multiplier compounds a
number the candidate has already moved.

**Rationale, and its limits.** Both Guards were genuinely exercised on Cave, status
removal rescued nothing, and the reported failures include single hits worth 40-65% of
the player pool. A local direct-damage reduction is the next deliberate numerical
lever. It does **not** establish that Eruption alone causes the failures, that
alternative builds cannot win, or that the multiplier, the concealment, the HP pool or
player mitigation should move as well — none of which this screen touches.

## 5. The arms

Six roots, two arms, one seed. **The player package is identical in both arms of a
block**, carried from the Boss3 arm that is the practical reference for that matchup —
so the only difference within a pair is the installed boss field.

| Block | Carried from | Ordered Guards | Why that arm |
|---|---|---|---|
| `swamp-pressure` | Boss3 `cleanse-substitution` | `second-wind`, `cleanse` | Boss3's two Swamp clears came on it; it is the practical Swamp reference |
| `cave-pressure` | Boss3 `portable-reference` | `second-wind`, `brace` | the substitution did not solve Cave; the original reference is what the record is against |

Everything else is the frozen reference shape in both blocks: **defensive stance**,
**Expose Weakness**, five ordered behaviour rules (`auto-path-enemy`,
`inside-telegraph→step-back`, movement, `avoid-hazards`, `wait-for-regen`) with Step
Back ahead of the movement rule, kit `cave-vest-t2` / `mountain-charm-t2` /
`plains-boots-t2` / `core-tempered` all at +5, each root's tier-legal weapon, no
ability-specific Rune rule, and the authored default triggers.

**A CONTROL MUST ONLY EVER BE COMPARED TO ITS OWN HISTORICAL ARM.** Swamp current ↔
Boss3 **Cleanse substitution**. Cave current ↔ Boss3 **portable reference**. Comparing
Swamp's candidate against Boss3's *Brace* result would silently fold the guard
substitution into what is supposed to be an isolated boss-stat effect, and the report
must not do it.

**ARM NEUTRALITY IS MEASURED, NOT ASSUMED.** A boss-side candidate must not move a
single player stat. The preflight compares an explicitly enumerated fingerprint of
each root's two receipts — declared and applied package (guard list included, in
order), runes, equipment, upgrades, global mastery, biome levels, **effective stats**,
resources, RP, encounter setup — and they are byte-identical across both arms on both
bosses. Separately it compares a **boss-side projection with the candidate field
masked** — boss ID, runtime HP/plating/DR, the rest of the starting roster — which
must also be identical; the candidate field's actual values are then asserted outright
against the declared before/after. Skipping the boss entirely would have let a second
boss-side difference pass unnoticed.

### Recorded at qualification, zero fights spent

Per-root RP is unchanged within each block (the candidate is a boss field and costs
the player nothing), and each block's RP matches its Boss3 origin arm exactly:

| Root | Swamp RP (both arms) | Cave RP (both arms) |
|---|---:|---:|
| striker | 24 | 26 |
| squire | 24 | 26 |
| apprentice | 26 | 28 |
| slinger | 26 | 28 |
| conduit | 26 | 28 |
| spirit | 26 | 28 |

## 6. Qualification — actually run, during preparation

All of the following was executed at this source before freezing. Results are quoted,
not predicted.

### 6.1 Typecheck and tests

`pnpm typecheck` passes, including `typecheck:bench`. The named tests all pass:

```
boss4Matrix: ok
boss4Pressure: ok
boss3Matrix: ok
boss3Cleanse: ok
boss2Matrix: ok
boss1Matrix: ok
bossDeclaration: ok
bossTerminal: ok
```

`boss2Matrix`, `boss1Matrix` and the two Boss3 tests are the regression guard that the
shared `referencePackageCells` construction and the earlier screens' packages did not
move when Boss4 extended them.

The full `pnpm test` gate was also run once at this source: **250/254 passed**, with
the four **pre-existing** failures `biomeEcology`, `durability8`, `tier1Snapshot` and
`bot/harness` — none of which imports `bossScreen.ts` or anything Boss4 added. They
are the campaign's known baseline and are **not** reopened here. Note that the runner
can report a zero exit for a failing full run, so read the `N/M passed` count rather
than the exit code.

**Mutation-checked during preparation.** With the candidate write removed,
`boss4Pressure` fails (`the live venom payload is 9, expected the installed 6`). With
`restore()` made a no-op, `boss4Matrix` fails (`restore left 6 standing instead of the
authored 9`). Both pass again once the code is put back.

### 6.2 The functional fixture — `server/test/boss4Pressure.test.ts`

Zero fights, no boss wake, no combat loop. It installs the real candidate through the
real seam, spawns the real body through the real spawn path, and fires the real damage
entry points. Measured:

**Swamp.** The treated coefficient reaches `effectiveMonsterDot` (the function the
on-hit listener calls), the status payload it paints on a real reference bot, and a
real 1000 ms tick of the real DoT system:

```
venom 9 -> 6/stack; one 1000ms tick at 4 stacks resolved 14 -> 10 damage
(cap 4, cadence 1000ms, 8000ms — unchanged)
```

A 33.3% cut in the coefficient resolved as a **28.6% fall in that tick** — per-stack
mitigation and rounding sit in between. Report measured ticks, never the coefficient
ratio, as the effect size.

**Cave.** The treated attack reaches the spawned body and is the gross damage of both
the ordinary swing and the 1.6x pattern hit. `post-mitigation` is
`grossDamage − mitigatedTotal`; `landed` is HP plus barrier absorption:

| Root | post-mitigation | landed x1 | landed x1.6 |
|---|---|---|---|
| striker | 92.43 → 64.78 (−29.9%) | 75 → 59 (−21.3%) | 100 → 81 |
| squire | 87.4 → 60.8 (−30.4%) | 78 → 55 (−29.5%) | 125 → 88 |
| apprentice | 95.2 → 67.2 (−29.4%) | 84.1 → 60 (−28.7%) | 130 → 93.1 |
| slinger | 100.43 → 71.38 (−28.9%) | 90 → 64 (−28.9%) | 144 → 103 |
| conduit | 99.22 → 70.52 (−28.9%) | 89 → 64 (−28.1%) | 142 → 103 |
| spirit | 98.01 → 69.66 (−28.9%) | 88 → 63 (−28.4%) | 141 → 101 |

**The 25.2% authored cut is not the effect size.** Post-mitigation damage falls
28.9-30.4% on every root, because plating subtracts before the scaling. Landed damage
falls by a *different* and non-uniform amount (21.3-29.5%), because barrier and the
final mitigation layers sit on top. Both are single-hit fixture measurements against a
full-HP bot and are **not** predictions of fight outcomes.

The fixture also checks the control fields directly: the venom cap, cadence and
duration are identical across arms; player plating is identical across arms; and the
1.6x path still exceeds the ordinary one in both arms.

### 6.3 Restoration and isolation — proven, not assumed

The fixture exercises the exception path (an install that threw still restores), the
`control -> candidate -> control` sequence the run actually drives, and cross-block
isolation (installing one boss's candidate leaves the other boss, and the treated
boss's own HP/plating/DR/attack, untouched). It re-runs `assertBoss4Definitions()`
afterwards, so a fixture that left a candidate standing would fail rather than poison
the next file.

The install seam **re-reads the live value on every arm, including a control**, and
refuses one that is not the declared `before`. A missed restore therefore fails loudly
on the next control instead of being recorded as a clean baseline. The two blocks also
run in separate child processes, so a candidate cannot cross between them even if a
restore were missed.

### 6.4 Preflight receipts from preparation (zero fights spent)

Both blocks qualified, boss awake in every cell, roster = the boss alone,
`nonBossBodiesAtStart: 0`, `hpTreatment: []` everywhere, `escortsDeclared: {}`
everywhere, every manifest reading back the frozen `17aa46cb…` / `08bcc556…`:

```
  swamp-pressure/striker — package identical, RP 24; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
  swamp-pressure/squire — package identical, RP 24; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
  swamp-pressure/apprentice — package identical, RP 26; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
  swamp-pressure/slinger — package identical, RP 26; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
  swamp-pressure/conduit — package identical, RP 26; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
  swamp-pressure/spirit — package identical, RP 26; boss dotDamagePerStack 9 -> 6 (candidate 9 -> 6)
swamp-pressure qualify ok — 2 arms x 6 roots, boss awake, one field treated, control restored
  cave-pressure/striker — package identical, RP 26; boss attack 139 -> 104 (candidate 139 -> 104)
  cave-pressure/squire — package identical, RP 26; boss attack 139 -> 104 (candidate 139 -> 104)
  cave-pressure/apprentice — package identical, RP 28; boss attack 139 -> 104 (candidate 139 -> 104)
  cave-pressure/slinger — package identical, RP 28; boss attack 139 -> 104 (candidate 139 -> 104)
  cave-pressure/conduit — package identical, RP 28; boss attack 139 -> 104 (candidate 139 -> 104)
  cave-pressure/spirit — package identical, RP 28; boss attack 139 -> 104 (candidate 139 -> 104)
cave-pressure qualify ok — 2 arms x 6 roots, boss awake, one field treated, control restored
boss4 preflight: ok — 2 blocks, 24 planned observations, ZERO fights spent
```

The 24 qualification receipts carry exactly one base definitions hash —
`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f` — and the live
hashes split exactly as they must:

| Block | Control `live` | Candidate `live` |
|---|---|---|
| `swamp-pressure` | `17aa46cb…` (= base) | `cd8077b49ce658c2467ba20e692c01c354003b1782ff2f0a8027876895a32f9a` |
| `cave-pressure` | `17aa46cb…` (= base) | `4af6e4f23d4a7fe1b79116c7665fd6831ce38e56fcbc4787639a7e8be23ce33a` |

**Stated precisely:** these were produced during preparation with the Boss4 harness in
the working tree, *before* it was committed — the preflight, unlike the run, does not
require a clean tree. That is disclosed rather than glossed, and it is not
load-bearing: the machine-checked base definitions hash read back `17aa46cb…` with
those changes present, which is the whole point. The operator re-runs the preflight
from the committed tip and must get the same fifteen lines; a divergence is a stop
condition, not a rounding difference.

Those artifacts are kept at `.../ttk-survey/boss4-preflight-opus-verify`, and the
Boss3 regression re-qualification at
`.../ttk-survey/boss3-preflight-boss4-regression`, so the documented preflight root
above is **free** — the runner requires a NEW root and will refuse an existing one.

## 7. Seeds, the repeated control, and cap honesty

**Seeds.** Each block reuses `98011`, the Boss2 seed carried through Boss3. Neither
boss has a declared randomness consumer — no adds, fixed spawns, deterministic
evasion — but that is an *absence of declared consumers*, **not** a measurement that
they are inert. Do not present one seed as coverage of seed sensitivity, and do not
pretend a second nominal seed would add independent evidence on a deterministic
encounter.

**The control arm is a CHECK, not a replicate.** Reusing the seed and the package
means the control revisits a known Boss3 result. It is a reproducibility observation
and **must never be counted as new independent coverage**, nor pooled with Boss3's
figures. If a control row diverges from its Boss3 arm, that is a reproducibility
finding in its own right and is reported as one — not smoothed over and not retried.

**Cap.** 300,000 ms simulated. Boss3's twenty-four fights on these two bosses all
resolved between 20.0 s and 47.0 s, so the cap is generous with real measured margin. A cap is still an
incomplete fight observation: it is not a death and not an extrapolated victory time.
Record it as its own outcome with the HP fraction actually removed, and do not extend
the window, retry adaptively, or infer a time-to-kill from it. **No `ttk` is
extrapolated anywhere** — extrapolation assumes constant player DPS and is optimistic
against a boss that hardens late, which is exactly what `empower-shred` does.

## 8. Commands

Check first that no `boss4` study output already exists; never overwrite another
study. The runner refuses an existing root, and qualification artifacts live in their
own roots, separate from the cohort.

Qualification at the frozen source, before anything else:

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Pressure.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Cleanse.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss2Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss1Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossDeclaration.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossTerminal.test.ts
```

Preflight (qualifies both blocks, ZERO fights spent, separate root):

```bash
node scripts/boss4-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss4-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"
```

The run:

```bash
node scripts/boss4-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss4" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

The run script drives both blocks in sequence, in separate child processes, verifying
each **independently**: a local problem on one boss never consumes the other's
allocation. Per-block watchdog is 40 minutes.

## 9. What the report must separate

1. **Terminal outcome first** — killed / died / capped / encounter-reset /
   `boss-vanished-no-kill` / simultaneous-terminal / invalid — before any other
   number. The last four are real outcomes and are never rounded to a win or a loss.
   Require corroborated boss-specific terminal evidence; preserve reset, concealment,
   disappearance, simultaneous-terminal and ordinary-death distinctions.
2. **Planned / started / terminal / verified counts**, and **one row per actual
   observation**, all 24. Every failure and unfinished outcome is preserved. Never
   average a failure extrapolation into a successful kill time.
3. **The paired readout**, per root and per block: control outcome, candidate outcome,
   and which of the four categories the pair falls in — `both-won`,
   `candidate-only-won`, `control-only-won`, `both-lost`. `verification.json` derives
   these from the records; report them from there rather than composing them by hand.
   **Do not pool the two bosses**, and do not pool historical controls as new
   replications.
4. **Control-versus-Boss3 reproduction**, per cell, against the CORRECT historical arm
   (§5). State whether the replay reproduced Boss3's recorded outcome. These are
   checks, not extra independent coverage. A divergence is a reproducibility finding.
5. **Remaining boss HP and the fraction removed**, on every non-kill, both arms; and
   the **actual clear duration** on every win. A near-clear and a half-clear are
   different data, and time-to-death is not time-to-victory. Longer survival before
   losing and a longer successful fight are not the same endpoint.
6. **The treatment record itself** — the before/after fields, the runtime readback and
   the live definitions hash, per arm. A damage-treated run must state what it
   installed. An empty `hpTreatment` is not a substitute.
7. **Starting stats, and player minimum and terminal HP with recording interval and
   age.** Boss3's §11 corrections apply and are not re-litigated: `minHpFraction` is
   the minimum of the 100 ms tick observations, `samples.jsonl` is a separate 1000 ms
   series, and the terminal reading is a third thing. Say which is which. Do not claim
   coarse samples are generally reliable for DoT deaths.
8. **Guard activity and available mitigation/removal data**, both arms. Normalize by
   time alive when comparing exposure — a fight that lasted twice as long had twice
   the opportunity. Longer fights can raise total stack removal; totals do not isolate
   per-use efficacy. An activation with an empty removal record is legal.
9. **Swamp specifically**: actual venom tick and removal evidence; direct and pool
   contribution **only where supported**; whether the existing Spirit/Slinger winners
   survive the change; and the progress of the four remaining references.
10. **Cave specifically**: ordinary and pattern hit evidence and burst; defensiveness
    and Brace state where available; phase reached and clearability. Prefer supported
    comparisons — identical timestamps alone do not guarantee identical mitigation
    state, and identical endpoints do not prove zero intermediate effect.
11. **Owner and summon damage separately.** Conduit records zero `attackBeats` by
    design (`CannotAttack`). Do **not** use that to invalidate its evidence.
12. **Phase exposure** — `crossedHalfAtMs`, cast labels, pattern steps reached.
    Crossing a threshold is exposure, **not** evidence that the phase caused a death.
    Zero casts does not mean zero mechanics.
13. **Guardian/access is unmeasured** (`not-measured-guard-stripped`) and must be
    stated as such, never pooled into a boss figure.
14. **Reference, never corroboration.** A fight against a treated boss has no history
    at all, and a control is a replay rather than a corroboration.

Two measurement properties to carry, not restate as findings:

- **HP lost is sampled as per-tick HP decreases**, not the pipeline's `damageTaken`.
  Both are recorded so the relationship is visible, and it runs in both directions.
  **The Conduit/Dreadbore gap stays unknown** — do not fill missing attribution by
  subtracting incompatible counters, do not treat the excess as unattributed boss
  output, do not exclude the summoner to make it balance, and do not make a logger
  migration a prerequisite for reporting. Omit an unsupported aggregate rather than
  blocking valid outcome evidence.
- **No `ttk` is extrapolated.** A boss that is not killed reports its outcome and the
  HP fraction actually removed.

Correct mechanical count and percentage errors before prose.

## 10. Endpoint and reading rules

A **two-block paired table** — 6 roots x 2 arms x 2 bosses — plus the four paired
categories, the channel evidence, and the control-versus-Boss3 reproduction. End with
a short **retain / adjust / defer** recommendation for **each candidate separately**,
not a new permutation grid.

- **Judge the candidates separately.** The desired direction is a material reduction in
  the shared early failures and credible prepared clears, without erasing mechanics or
  manufacturing six-root parity. More than one root and contrasting combat styles
  matter; there is **no hard "6/6 or fail" rule**. Preserve difficult, long and
  near-clear tails for later build review.
- If a candidate is useful, recommend its **exact** adoption with a scoped
  source/runtime regression — do not reopen scalar selection merely for confidence.
- If pressure remains broadly excessive, say whether a single further coarse
  adjustment is justified **by the recorded channels**. A weak root alone does not
  require lowering every boss.
- If a concrete setup or functional fault appears, identify that dependency rather
  than compensating with a balance change.
- Prioritization signals, not causal verdicts. **Boss4 is a decision checkpoint, not
  permission for endless Swamp/Cave tests.** After review the main coverage work moves
  toward the missing boss tiers.

## 11. Stop rules

- **New output root required.** The runner refuses an existing one. There are no
  retries. Never overwrite another study's output.
- **HEAD must equal `--revision`, the tree must be clean, and both hashes must match**
  before any output is created. Otherwise: stop and report.
- **Run from a committed tip that excludes the unapproved side-review gameplay
  changes.** Do not run from a moving branch. If gameplay has changed since Boss3,
  prefer the compatible committed baseline; otherwise disclose the relevant diff and
  mark any failure to reproduce rather than silently merging evidence.
- **Verification failure preserves the data and does not retry**, per block. A failed
  block is reported as completed-but-unverified, never quietly re-run.
- **Declared-vs-applied is checked at qualification AND at verification**, including
  the **ordered** guard list on both sides. A divergence visible in a READY receipt
  stops the screen before any combat is spent.
- **Treatment identity is checked per cell.** A candidate arm with an empty
  `damageTreatment`, a runtime readback that still shows the authored value, or a live
  definitions hash equal to the base, fails the block. So does a control arm whose
  live hash differs from the base — that is a missed restore, not a rounding
  difference.
- **Arm pairing is verified.** Every root must carry both arms; the player package
  must be byte-identical and the boss must differ in the candidate field and nowhere
  else.
- **Per-block watchdog**, 40 minutes. A timeout writes `stopped-<block>.json` and
  moves on.
- **Player deaths are valid outcomes, not stop conditions.** A global identity failure
  stops the batch; block-local problems follow the established independent-block
  policy. Existing same-tick death/reset and boss-specific kill-evidence protections
  remain enabled.
- **No limit increases, no adaptive retries, no mid-run repair.** A proven setup or
  legality defect is corrected and disclosed *before* freezing, never during the run.
  **A loss is not such a defect**, and neither is a candidate that changed nothing
  observable — that is a real result.
- **Do not grow the screen.** 24 fights is the whole thing; `boss4Matrix.test.ts`
  asserts the size and `assertBoss4Arms()` asserts it again in both scripts. No pilot,
  no third arm, no second scalar, and no "try until it wins" qualification.
- **Do not adopt either candidate into source.** The candidate is installed
  process-locally and restored; no production boss-stat change is authorized by this
  packet. Preserve unrelated working changes. No commits, pushes, production changes,
  local services or deployment by the operator, and no automatic follow-on experiment.
