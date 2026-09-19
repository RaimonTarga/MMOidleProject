# Boss3 operator packet — one defensive substitution, Swamp and Cave

Prepared and frozen 2026-09-19. Two bosses, six roots, **two arms**, one reused seed:
**24 fights**. It installs nothing and changes no balance value.

Operator: run the specified committed source and stop on drift. Do not choose staged
content, do not commit changes, do not invent a revision, do not treat silence as
permission. Your endpoint is the factual report. No production tuning, commits, pushes or
extra experiments.

Companion evidence: [`bot-balance-boss2-review.md`](bot-balance-boss2-review.md) — read §3
before interpreting anything here.

---

## 1. The question

At unchanged T2 boss values and otherwise unchanged Boss2 references, does replacing
**Brace** with **Cleanse** produce a useful tradeoff against Swamp and Cave?

This is a **complete-build substitution effect**: status removal INSTEAD OF burst
mitigation. It is **not** a causal estimate of any particular debuff's damage contribution,
**not** an optimised Cleanse-timing study, **not** proof that Cleanse should be universal,
and **not** a search over builds. There are exactly two arms and nothing is retried.

A failed substitution does not show that no other build could work, and does not justify an
ability buff. A successful one does not make Cleanse a general answer. After this ONE screen
the disposition is chosen at command center.

## 2. Scope, and what Boss2 settled

Boss2 completed T2 boss **coverage** (7 x 6 = 42 rows, 17 killed / 25 died) and found
exactly two total wipes: `mire-gorged-behemoth` 0/6 and `chitinous-dreadbore` 0/6. Both were
fought on packages carrying **no** status-removal tool — a stated property of the reference,
never a boss-design defect. Boss3 is the one bounded question that follows.

Not reopened, and not in scope: the durability campaign, Jungle navigation, the
historical-versus-legacy reference comparison, global player/build selection, the T3 Jungle
pressure exception, earlier Mountain limitations, ECON-1, reward edits, mob testing,
guardian access, live-server replay, a full cohort, any seed sweep or variants grid, a third
arm, and any automatic follow-up experiment.

Boss1's Sovereign block keeps its **separate retrospective-verification** status; nothing
here certifies it. The four remaining T2 bosses and the reused Timberclaw rows are **not**
re-run: their outcomes are not this screen's question.

## 3. Frozen identity

| Item | Value |
|---|---|
| Harness commit | `83040603ea0900e2102a413b868e55b52a9ba290` |
| Boss2 reference revision | `96cf77d4d24f4c3f0e813ee699c31facdcb2de06` (tree `2bf3a8c44dee64a0516e4496fa57838e2a476c44`) |
| Revision / tree to run | resolved **mechanically** from the branch tip; see below |
| **Definitions hash** | **`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial | `boss3` |
| Blocks | `swamp-response`, `cave-response` |
| Arms | `portable-reference` (baseline), `cleanse-substitution` |
| Seed | `98011` per block — **reused from Boss2**, read from its frozen block manifests |
| Cap | 300,000 ms simulated, per fight |
| Total | 2 x 6 x 2 x 1 = **24 fights** |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss3` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss3-preflight` |

**The definitions hash and hitbox hash are the ones Boss1 froze and Boss2 ran, unchanged.**
That is the load-bearing pin, not the commit id: it is what makes the baseline arm a replay of
the Boss2 failure rather than a fresh measurement on a moved simulation.

**The TREE differs from Boss2's, and the simulation does not.** Boss3 adds its own spec, tests
and runner scripts (`boss3Spec.ts`, `boss3Matrix`/`boss3Cleanse`, `scripts/boss3-*.mjs`) and
threads an optional guard list through the shared `referencePackageCells` construction. None of
that is a monster, item, ability, Rune, reward or hitbox definition, so the definitions hash is
**still `17aa46cb…`** — verified after the change, not assumed. A packet that claimed Boss2's
tree hash here would be stating something false; the honest pin is the definitions hash, and the
runner checks it.

**Nothing here is a launch-time placeholder.** The revision and tree are resolved
**mechanically**, not chosen:

```bash
git rev-parse HEAD          # -> pass as --revision
git rev-parse HEAD^{tree}   # -> pass as --tree
```

`scripts/boss3-run.mjs` asserts, before creating any output, that `HEAD` equals
`--revision`, that `git status --porcelain --untracked-files=no` is empty, that the tree
hash matches, and that the hitbox file hashes to the frozen value. Verification
additionally asserts each block's manifest definitions hash equals the frozen
`17aa46cb…`. **If a hash has changed, the source is not what this packet froze and the run
is refused.** Stop and report.

Because this packet is a **docs-only commit on top of the harness commit above**, the operator
runs from the branch tip and the assertions resolve to it. A docs-only delta cannot move the
definitions hash; if that hash has moved, something other than documentation changed and the run
is refused.

## 4. The two encounters, and why one substitution is legible on both

Re-resolved from `DUNGEON_DEFS` and `MONSTER_DATABASE`, not from filenames or comments.
`assertBoss3Definitions()` re-derives all of this at load and refuses to run if it has
moved. **No boss value is touched by this screen.**

| Block | Boss | Node | HP | Atk | Plat | DR | Pattern | Summons |
|---|---|---|---:|---:|---:|---:|---|---|
| `swamp-response` | `mire-gorged-behemoth` | `node-t2-swamp-dungeon` | 3375 | 38 | 6 | 0.08 | none | no |
| `cave-response` | `chitinous-dreadbore` | `node-t2-cave-dungeon` | 4375 | 139 | 12 | 0.12 | `dreadbore-emergence` | no |

**These two bosses fail the references in opposite ways**, measured from the Boss2
recordings rather than inferred from their stat lines. This is the whole reason one
substitution is worth running on both at once — they are not the same experiment twice.

**Swamp is ~87-92% DoT.** Across its six fights the player took 281-419 damage from
`monster-dot:mire-gorged-venom` against 26-46 from direct hits. `largestHit` is **30** in
every fight — the venom tick; there is no burst in this encounter at all. All six deaths
record `kind: "dot"`, `effectName: "Gorged Venom"`, 4 stacks. Venom is the lethal channel
**and** the only cleanseable effect present. Swamp therefore tests Cleanse against the thing
that is killing the player.

**Cave is 100% direct.** No DoT channel appears in any of its six recordings. The lethal
blows are 92-149 point melee/Eruption hits against 231-300 max HP — 40-65% of the pool in
one strike. Its cleanseable effect, `plating-shred` (2 plating/stack, ramping to 5 observed,
no expiry), is a **mitigation lever**, not a damage channel. Four of its six deaths occurred
*before* 50% HP, so `empower-shred` had not fired in them. Cave therefore tests whether
restoring plating is worth more than a 40% burst-mitigation window against hits that large.

**The honest prior, recorded before the run: Swamp is the plausible block and Cave is the
one that may get worse.** Do not resolve a Cave regression by reaching for a boss nerf or an
ability buff; report it.

### Corrections carried in, not re-litigated

The Boss2 report's prose claimed the Corrosive Pool "bypasses the `damageTaken` pipeline".
It does not: `damageFromBoss` fully accounts for what the player took, and `hpLost` is
*lower* in every fight because barrier and healing sit between them. The report also read
Dreadbore as attritional; it is sparse burst. Both are corrected in the review §2, with the
per-fight figures. **Do not re-derive these and do not re-run Boss2 to repair prose.**

## 5. The arms

Six roots, one cell per arm, **one seed**. The baseline arm is produced by the same
`referencePackageCells` construction Boss1 and Boss2 use, with the guard list **omitted** so
it cannot drift from the baseline it reproduces.

`portable-reference` — the EXACT Boss2 package: **defensive stance**, **Expose Weakness**,
**Second Wind + Brace**, five ordered behaviour rules (`auto-path-enemy`,
`inside-telegraph→step-back`, movement, `avoid-hazards`, `wait-for-regen`) with Step Back
ahead of the movement rule, kit `cave-vest-t2` / `mountain-charm-t2` / `plains-boots-t2` /
`core-tempered` all at +5, each root's tier-legal weapon.

`cleanse-substitution` — `brace` replaced by `cleanse` **at the same position (index 1)** in
the ordered Guard list. Second Wind, the offensive ability, all other attunements,
gear/upgrades, core, frame/path, stance, Rite choices, RP capacity, the ordered Rune policy
and starting resources are unchanged. **No additional ability-specific Rune rule**; Cleanse
runs on its authored default trigger. **The freed RP is left unspent.**

**ORDER is mechanical, not cosmetic.** Guards are walked top-to-bottom and the first
eligible one claims a one-activation-per-window gate (`GUARD_WINDOW_KEY`, 100 ms), so the
same two Guards in the other order are a different package. The shared
declared-versus-applied checker compares ability **sets** (it sorts) — correct for every
earlier screen, insufficient for this one — so **both** Boss3 scripts assert the ordered
list explicitly, declared and applied.

### Recorded at qualification, zero fights spent

| Root | Weapon | RP baseline | RP substitution | freed | maxHp | attack | plating | DR | barrier |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | `gale-needle` | 26/30 | 24/30 | 2 | 268 | 33 | 22 | 0.21 | 70 |
| squire | `quake-hammer` | 26/30 | 24/30 | 2 | 300 | 109 | 24 | 0.24 | 78 |
| apprentice | `ruinous-axe` | 28/30 | 26/30 | 2 | 256 | 94 | 20 | 0.20 | 67 |
| slinger | `jungle-stinger-rapier` | 28/30 | 26/30 | 2 | 239 | 38 | 18 | 0.17 | 62 |
| conduit | `ruinous-axe` | 28/30 | 26/30 | 2 | 244 | 86 | 18 | 0.18 | 63 |
| spirit | `ruinous-axe` | 28/30 | 26/30 | 2 | 231 | 100 | 18 | 0.19 | 129 |

**ARM NEUTRALITY IS MEASURED, NOT ASSUMED.** Brace and Cleanse are both instant Guards with
no passive rider, so a substitution must not move a single starting stat. The preflight
compares an explicitly enumerated fingerprint of each root's two receipts — applied stance,
attuned stances, techniques, rune rules, equipment, upgrades, global mastery, biome levels,
**effective stats**, resources, encounter setup, boss runtime, initial roster hash — and
they are **byte-identical** across both arms on both bosses. If they were not, the contrast
would be confounded by a stat change and nothing could be attributed to the substitution.

**Every cell is a reference, and neither arm is corroborated.** Spirit's package is the only
one with a historical clear and that clear is against Apex Timberclaw; a substituted package
has no history at all. `boss3Matrix.test.ts` asserts no cell claims corroboration.

## 6. Cleanse — what it actually does at this source

All of this is re-asserted mechanically at run time. A later edit fails qualification
instead of silently invalidating the packet.

- **Cost 3 RP** against Brace's 5. `assertBoss3Definitions()` refuses a substitution that
  costs more; the budget is never enlarged.
- **Rank II at player tier 2** (`abilityRankIndex = playerTier − homeTier`; home tier 1):
  `{ stacks: 2, debuffs: 1 }`, cooldown 10,000 ms, trigger `has-debuff`. It removes up to
  **2 stacks from ONE** effect per use. It does **not** clear every affliction, grant
  immunity, remove a pool from the floor, touch Eruption's direct damage, or replace
  positional counterplay.
- **Brace, for the record:** `drPct 0.40 / 3000 ms / knockbackResist 0.55`, cooldown
  10,000 ms, trigger `hp-below 0.5`. The two arms therefore differ in *when* a Guard can act
  at all, not only in what it does — Cleanse fires at full HP, Brace cannot.
- **Eligibility.** `statusPolicyFor` defaults an unlisted, non-ambient effect to
  `cleanse: 'full'`. Both bosses' riders are unlisted, so both are fully strippable. The
  declared targets are re-derived from each monster definition (`dotEffect` →
  `resolveMonsterDotDebuff`, `appliesPlatingShred`, `contactSlow`) and compared against the
  declaration, so a renamed effect stops the screen.

| Block | Effects actually generated | Cleanse's target |
|---|---|---|
| `swamp-response` | `monster-dot:mire-gorged-venom` (9/stack, max 4, 8 s, refreshed on hit) | the venom |
| `cave-response` | `plating-shred` (2/stack, max 6, no expiry) + `slow` (0.5x, 2000 ms, 1 stack) | `plating-shred` |

- **Selection is load-bearing on Cave**, where two effects are live. `applyCleanse` orders by
  **deepest stack first, ties broken by ascending id**. `plating-shred` wins the ramped case
  *and* the 1-vs-1 tie (`'p' < 's'`). Had it gone the other way, the treatment would spend a
  10 s cooldown on a 2 s rider that expires by itself — a no-op dressed as a substitution.
- **Not declared as targets:** the Corrosive Pool's own slow and its 1500 ms
  `damageTakenPct 0.12` vulnerability. They are hazard-local and appeared as no standing
  player status in any of the six Behemoth recordings. This packet does not pretend Cleanse
  answers the pool.
- **A known limit, recorded not repaired.** The `has-debuff` trigger reads harmfulness, not
  cleanseability, so Cleanse can legally fire against an immune effect and remove nothing.
  No immune effect is present on either boss, so it is inert here — but it means **an
  activation with an empty `removedEffects` is a legal outcome and must not be reported as a
  defect.**

### Prediction, recorded before the run

The authored default trigger is used and deliberately **not** tuned, so these inefficiencies
are part of what is measured, not flaws to be fixed mid-run:

- **Swamp:** `has-debuff` fires at the *first* venom stack (~6.6-6.8 s), when only 1 stack
  exists, so the first use strips 1 and burns the 10 s cooldown; the second lands at
  ~16.6-16.8 s against 3-4 stacks. Expect ~2 activations before a death at ~22-25 s, and a
  partial rather than total reduction in DoT throughput.
- **Cave:** the first Cleanse (~6.3 s) fires when only the `slow` is live — corrosion
  arrives at ~7.1 s — so it is spent on the 2 s rider regardless of the tiebreak.

If the measured activity contradicts these, the measurement wins. Report it; do not tune
toward the prediction.

## 7. Seeds, the repeated baseline, and cap honesty

**Seeds.** Each block reuses **its own original Boss2 seed** (`98011`), read from the frozen
block manifest. Neither of these two bosses has a declared randomness consumer — no adds,
fixed spawns, deterministic evasion — but that is an *absence of declared consumers*, **not
a measurement that they are inert**. Do not present one seed as coverage of seed
sensitivity, and do not pretend a second nominal seed would add independent evidence on a
deterministic encounter.

**The repeated baseline is a CONTROL, not a replicate.** Reusing the seed means the baseline
arm deliberately revisits a known failure. It is a reproducibility observation and **must
never be counted as a new independent replicate of Boss2**, nor pooled into Boss2's 42-row
map. If a baseline row diverges from Boss2's recorded outcome for the same cell, that is a
reproducibility finding in its own right and is reported as one — not smoothed over and not
retried.

**Cap.** 300,000 ms simulated, the window Boss2 ran. Its twelve fights on these two bosses
resolved in 20.0-43.4 s, so the cap is generous here with real measured margin. **A cap is
still an incomplete fight observation. It is not a death, and it is not an extrapolated
victory time.** Record it as its own outcome with the HP fraction actually removed, and do
not extend the window, retry adaptively, or infer a time-to-kill from it.

No `ttk` is extrapolated anywhere. Extrapolation assumes constant player DPS and is
optimistic against a boss that hardens late — which is exactly what `empower-shred` does.

## 8. Commands

Qualification at the frozen source, before anything else:

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Cleanse.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss2Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss1Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossDeclaration.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossTerminal.test.ts
```

`boss2Matrix` and `boss1Matrix` are in the list because Boss3 extends the **shared**
`referencePackageCells` construction; they are the regression guard that the earlier screens'
packages did not move.

Preflight (qualifies both blocks, ZERO fights spent, separate root):

```bash
node scripts/boss3-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss3-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"
```

The run:

```bash
node scripts/boss3-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss3" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

The run script drives both blocks in sequence, verifying each **independently**: a local
problem on one boss never consumes the other's allocation.

### Preflight receipts from preparation (zero fights spent)

Both blocks qualified, boss awake in every cell, roster = the boss alone,
`nonBossBodiesAtStart: 0`, `hpTreatment: []` everywhere, `escortsDeclared: {}` everywhere,
manifests reading back the frozen `17aa46cb…` / `08bcc556…`:

```
  swamp-response/striker — arms paired; RP 26 -> 24 (2 freed, unspent)
  swamp-response/squire — arms paired; RP 26 -> 24 (2 freed, unspent)
  swamp-response/apprentice — arms paired; RP 28 -> 26 (2 freed, unspent)
  swamp-response/slinger — arms paired; RP 28 -> 26 (2 freed, unspent)
  swamp-response/conduit — arms paired; RP 28 -> 26 (2 freed, unspent)
  swamp-response/spirit — arms paired; RP 28 -> 26 (2 freed, unspent)
swamp-response qualify ok — 2 arms x 6 roots, boss awake, declarations applied in order
  cave-response/striker — arms paired; RP 26 -> 24 (2 freed, unspent)
  cave-response/squire — arms paired; RP 26 -> 24 (2 freed, unspent)
  cave-response/apprentice — arms paired; RP 28 -> 26 (2 freed, unspent)
  cave-response/slinger — arms paired; RP 28 -> 26 (2 freed, unspent)
  cave-response/conduit — arms paired; RP 28 -> 26 (2 freed, unspent)
  cave-response/spirit — arms paired; RP 28 -> 26 (2 freed, unspent)
cave-response qualify ok — 2 arms x 6 roots, boss awake, declarations applied in order
boss3 preflight: ok — 2 blocks, 24 planned observations, ZERO fights spent
```

**Stated precisely:** these were produced during preparation with the Boss3 harness still in
the working tree, *before* it was committed — the preflight, unlike the run, does not require a
clean tree. That is disclosed rather than glossed, and it is not load-bearing: the machine-checked
definitions hash read back `17aa46cb…` with those changes present, which is the whole point. The
operator re-runs the preflight from the committed tip and must get the same twelve lines; a
divergence is a stop condition, not a rounding difference.

Those artifacts are kept at `.../ttk-survey/boss3-preflight-opus-verify` so the documented
preflight root above is **free** — the runner requires a NEW root and will refuse an existing
one.

The functional half of qualification is `server/test/boss3Cleanse.test.ts`: it paints the
real effects with their authored shapes read out of `MONSTER_DATABASE`, fires the real
ability driver, and asserts the eligible removals, the Cave priority (ramped **and** at a
1-1 tie), the `ability-activation.removedEffects` recording, and that the Guard-order gate
does not suppress Cleanse behind Second Wind. It carries four negative controls — an
immune effect is not stripped, an empty removal record is legal, the cooldown is held with
nothing eligible, and the baseline arm removes nothing at full HP — and it **fails** when
`applyCleanse`'s sort is inverted (mutation-checked during preparation). It spends zero
fights and starts no arena.

## 9. What the report must separate

1. **Terminal outcome first** — killed / died / capped / encounter-reset /
   `boss-vanished-no-kill` / simultaneous-terminal / invalid — before any other number. The
   last four are real outcomes and are never rounded to a win or a loss. Require corroborated
   boss-specific terminal events; preserve reset, concealment, disappearance,
   simultaneous-terminal and ordinary-death distinctions.
2. **One row per actual observation**, all 24. Every failure and unfinished outcome is
   preserved. Never average a failure extrapolation into a successful kill time.
3. **The paired readout**, per root: baseline outcome, substitution outcome, and which of the
   four categories the pair falls in — `both-won`, `substitution-only-won`,
   `baseline-only-won`, `both-lost`. `verification.json` derives these from the records;
   report them from there rather than composing them by hand.
4. **Baseline-versus-Boss2 consistency**, per cell. State whether the replay reproduced
   Boss2's recorded outcome. A divergence is a reproducibility finding, not noise.
5. **Remaining boss HP and the fraction removed**, on every non-kill, both arms. A near-clear
   and a half-clear are different data.
6. **Minimum and terminal player HP, with sampling age.** Sampling is 1000 ms, so an unmarked
   terminal value lags the true one by up to 1 s. Say which is sampled and which is
   continuous — a death between samples may coexist with a positive sampled minimum.
7. **Guard activity, both arms.** Cleanse activations and the **actual removed effect IDs and
   stack counts** in the substitution arm; Brace activations in the baseline. Normalize counts
   by time alive when comparing exposure — a fight that lasted twice as long had twice the
   opportunity. An activation with an empty removal record is legal and is reported as such.
8. **The lethal sequence and the damage channels.** Recognized direct / DoT / ground channels
   separately, relevant debuff state at death, defensive response and recovery evidence where
   already logged.
9. **Owner and summon damage separately.** Conduit records zero `attackBeats` by design
   (`CannotAttack`). Do **not** use that to invalidate its evidence.
10. **Phase exposure** — `crossedHalfAtMs`, cast labels, pattern steps reached. Crossing a
    threshold is exposure, **not** evidence that the phase caused a death. Zero casts does not
    mean zero mechanics.
11. **Guardian/access is unmeasured** (`not-measured-guard-stripped`) and must be stated as
    such, never pooled into a boss figure.
12. **Reference, never corroboration.** No Boss3 row is a historical result.

Two measurement properties to carry, not restate as findings:

- **HP lost is sampled as per-tick HP decreases**, not the pipeline's `damageTaken`. Both are
  recorded so the relationship is visible. A per-tick decrease is **not** automatically
  exhaustive gross damage: same-tick healing and barrier changes matter, and the relationship
  **runs in both directions**. In Boss2, 11 of these 12 recordings have `hpLost` *below*
  `damageFromBoss` (barrier absorbs 62-432, heals up to ~285), while **Conduit on Dreadbore has
  `hpLost` 473.7 against `damageFromBoss` 389.0 — ~85 HP of decrease with no damage event behind
  it at all.** That gap is preserved as **unknown** (see review §2.6); a summoner-side HP cost is
  a hypothesis, not a finding. Do **not** fill missing attribution by subtracting incompatible
  counters, do not treat the excess as unattributed boss output, and do not refactor the damage
  logger to chase perfect attribution.
- **No `ttk` is extrapolated.** A boss that is not killed reports its outcome and the HP
  fraction actually removed.

## 10. Endpoint and reading rules

A **two-block paired table** — 6 roots x 2 arms x 2 bosses — plus the four paired categories
and the measured Cleanse activity. At most **three** prioritized follow-up decisions.

- A useful win, or a substantial change in boss progress, **together with demonstrated
  removal**, supports a situational adaptation. Removal without a change in outcome is also a
  result and is reported as one.
- All-loss outcomes with genuinely exercised counterplay keep **local** pressure tuning on the
  table. They do not establish by how much.
- A failed default Cleanse policy is **not** permission for an unlimited search over timing,
  gear or stances. A Cave regression is **not** a reason to reach for a boss nerf.
- Prioritization signals, not causal verdicts. The next disposition — retain with preparation
  guidance, prepare one deliberate local boss-pressure candidate from the recorded channels, or
  repair a concrete functional defect — is chosen at command center. **Do not create Boss4 as
  another equipment permutation study.**

## 11. Stop rules

- **New output root required.** The runner refuses an existing one. There are no retries.
- **HEAD must equal `--revision`, the tree must be clean, and both hashes must match** before
  any output is created. Otherwise: stop and report.
- **Verification failure preserves the data and does not retry**, per block. A failed block is
  reported as completed-but-unverified, never quietly re-run.
- **Declared-vs-applied is checked at qualification AND at verification**, including the
  **ordered** guard list on both sides. A divergence visible in a READY receipt stops the
  screen before any combat is spent. A wrong declared stance or build must fail qualification,
  not be discovered after the cohort.
- **Arm pairing is verified.** Every root must carry both arms, and the pair must differ in
  nothing but the substituted Guard. A pair that differs elsewhere fails the block.
- **The substitution may only FREE RP.** A cheaper Guard that somehow cost more, or freed
  points that were spent, fails verification.
- **Per-block watchdog**, 40 minutes. A timeout writes `stopped-<block>.json` and moves on.
- **No limit increases, no adaptive retries, no mid-run repair.** A proven setup or legality
  defect is corrected and disclosed *before* freezing, never during the run. **A loss is not
  such a defect**, and neither is a Cleanse that fired at a bad moment — that is the authored
  default trigger, which is what this screen measures.
- **Do not grow the screen.** 24 fights is the whole thing; `boss3Matrix.test.ts` asserts the
  size, and `assertBoss3Arms()` asserts it again in both scripts. No pilot and no third arm
  are authorized.
- **Do not change boss, mob, player, item, ability, Rune or reward numbers or mechanics.**
  Preserve unrelated working changes. No commits, pushes, production changes or deployment by
  the operator, and no automatic follow-on experiment.
