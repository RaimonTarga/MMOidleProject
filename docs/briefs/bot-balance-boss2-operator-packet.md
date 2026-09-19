# Boss2 operator packet — T2 coverage on portable references

Prepared and frozen 2026-09-19. Six bosses, six explicit reference packages each, one
declared seed: **36 fights**. It installs nothing and changes no balance value.

Operator: run the specified committed source and stop on drift. Do not choose staged content,
do not commit changes, do not invent a revision, do not treat silence as permission. Your
endpoint is the factual report. No production tuning, commits, pushes or extra experiments.

---

## 1. The question

Carrying **one fixed package per root** across the rest of Tier 2, are failures concentrated in
particular **bosses**, in particular **roots**, or spread across the roster?

This is descriptive coverage. It is **not** a causal separation of boss strength from player
power, **not** a general player-clear probability, and **not** a class ranking.

It deliberately tests **portable references**, not best-possible matchup preparation. The
packages carry no Cleanse and no boss-specific answer. That absence must be visible in
interpretation — it is never repaired mid-run and never read as a boss-design defect.

## 2. Scope, and what Boss1 settled

Boss1 measured two bosses. Its Sovereign block's declaration gap is **closed retrospectively**
and is not reopened here: see the [declaration audit](bot-balance-boss1-stance-declaration-audit.md)
and the [Boss1 review](bot-balance-boss1-review.md). No Boss1 fight is rerun.

**Apex Timberclaw is NOT re-run.** Its six observations already exist at `66d33d57` on these
exact packages; six fights spent reproducing them would buy nothing. They are **carried forward
and tagged as reused Boss1 observations** with their original source and seed. See §9.

Not in scope: reward edits, ECON-1 measurement, earned-progression claims, boss or player
balance changes, mob testing, the T3 Jungle exception, live-server replay, a full cohort, any
seed sweep or variants grid, and any automatic follow-up experiment.

## 3. Frozen identity

| Item | Value |
|---|---|
| Harness commit | `4ca5ff06` |
| **Definitions hash** | **`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial | `boss2` |
| Blocks | `razortusk`, `juggernaut`, `behemoth`, `dreadbore`, `emperor`, `gorger` |
| Seed | `98011`, one per boss |
| Cap | 300,000 ms simulated, per fight |
| Total | 6 × 6 × 1 = **36 fights** |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss2` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss2-preflight` |

**Both hashes are the ones Boss1 froze, unchanged.** That is not a coincidence and it is
load-bearing: the declaration fix touched no monster, item or hitbox definition, so Boss2 runs
the identical simulation Boss1 did — which is what makes carrying the Timberclaw rows forward
legitimate rather than convenient.

**Nothing here is a launch-time placeholder.** The revision and tree are resolved
**mechanically**, not chosen: this packet is a docs-only commit on top of the harness commit
above, so run from the branch tip with

```bash
git rev-parse HEAD          # -> pass as --revision
git rev-parse HEAD^{tree}   # -> pass as --tree
```

`scripts/boss2-run.mjs` asserts, before creating any output, that `HEAD` equals `--revision`,
that `git status --porcelain --untracked-files=no` is empty, that the tree hash matches, and
that the hitbox file hashes to the frozen value. Verification additionally asserts each
block's manifest definitions hash equals the frozen `17aa46cb…`. **A docs-only delta cannot
change that hash; if it has changed, the source is not what this packet froze and the run is
refused.** Stop and report.

## 4. The roster, re-resolved from live source

Confirmed from `DUNGEON_DEFS` and `MONSTER_DATABASE`, not from filenames, comments or
node-name suffixes. Tier 2 holds exactly **seven** dungeon bosses — these six plus Apex
Timberclaw. No roster change, and the deprecated Void Overlord is not among them.
`assertBoss2Definitions()` re-derives this at load and refuses to run if it has moved.

| Block | Biome | Boss | Node | HP | Atk | Plat | DR |
|---|---|---|---|---:|---:|---:|---:|
| `razortusk` | plains | `gorging-razortusk` | `node-t2-plains-dungeon` | 4000 | 96 | 8 | 0.05 |
| `juggernaut` | mountain | `stoneplate-juggernaut` | `node-t2-mountain-dungeon` | 5000 | 128 | 10 | 0.05 |
| `behemoth` | swamp | `mire-gorged-behemoth` | `node-t2-swamp-dungeon` | 3375 | 38 | 6 | 0.08 |
| `dreadbore` | cave | `chitinous-dreadbore` | `node-t2-cave-dungeon` | 4375 | 139 | 12 | 0.12 |
| `emperor` | desert | `dune-stalker-emperor` | `node-t2-desert-dungeon` | 3750 | 85 | 12 | 0.08 |
| `gorger` | jungle | `jungle-dread-gorger` | `node-t2-jungle-dungeon` | 3625 | 85 | 0 | 0.03 |

## 5. The encounters — read from BOTH mechanic fields

A boss's mechanics live in **two** places, and a census of either alone is wrong:

- **`bossScript`** — HP-threshold `phases` and `repeating` cadences.
- **`bossPattern`** — the multi-step signature loop (cast, barrier, charge, conceal, payoff,
  recovery).

`jungle-dread-gorger` has **no `bossScript` at all** and reads as a bare statline from the
script alone, while actually running a three-step escape / stalk / ambush loop.

| Block | `bossScript` | `bossPattern` | Summons | Conceals |
|---|---|---|---|---|
| `razortusk` | 50% + 25% Rallying Cry; repeating 10 s (delay 6 s) | — | **yes** | no |
| `juggernaut` | 50% `empower-charged` ×1.15 / cd ×0.8 | `stoneplate-charge`, cd 11 s, ×2.0 | no | no |
| `behemoth` | 50% enrage cd ×0.7 + `empower-charged` | — (charged *Corrosive Pool*, cd 8.5 s) | no | no |
| `dreadbore` | 50% `empower-shred` +1 plating/stack | `dreadbore-emergence`, cd 9 s, ×1.6 | no | **yes** |
| `emperor` | 50% speed ×1.3 + `empower-charged` | `dune-execution`, cd 9 s, ×1.5 | no | no |
| `gorger` | **none** | `gorger-escape`, cd 14 s, ×1.6 | no | **yes** |

### The Razortusk is the only summoner, and its spawns are nested

Its `spawn-adds` sit **inside a `cast`** and inside its `repeating` block. A census that walks
only `phases[].actions` reports it as a non-summoner — that error was made and corrected during
preparation. It summons `plains-slime` (50 HP / 12 atk) and `boar` (100 HP / 18 atk); both are
declared in its receipt and asserted at runtime.

`summonsNothing` is therefore **per boss**, not per screen. True on a summoner would fail its
legitimate adds as leaked bodies; false on a non-summoner would disable the guard that caught
`resetDungeon` respawning a twelve-strong guard into the add count.

### Concealment is NOT disappearance

The Dreadbore burrows (3 s, untargetable, relocates onto the player, erupts). The Gorger flees
behind a shield, then stalks unseen (6 s) into an Ambush.

That looks exactly like the disappearance the terminal classifier exists to catch. **It is
not.** Concealment attaches an `isConcealed` *component* to a body that stays in the node:
untargetable and damage-immune for the window, but `monsterEntitiesInNode` still yields it, so
`bossPresent` stays true and no `boss-vanished-no-kill` can be produced by a burrow.
`endPattern` detaches it unconditionally on every teardown reason, including a reset.

`server/test/boss2Concealment.test.ts` holds that invariant on both bosses, tick by tick, and
also asserts the classifier still catches a genuine disappearance — without which the test
would pass equally well on a classifier that never terminates.

### Guardian / access is NOT measured

The guard is stripped by design. Every manifest records
`guardianAccess: "not-measured-guard-stripped"`, and access must never be pooled into a boss
figure — that pooling is what produced the stale T1 band.

## 6. The reference policy

Six roots, one cell each, **one seed** (`98011`). Every cell is Boss1's Timberclaw package,
unchanged, on a different boss. The construction is *shared source*
(`referencePackageCells` in `boss1Spec.ts`), not a copy, so the two screens cannot drift apart.

Shape: **defensive stance**, **Expose Weakness**, **Second Wind + Brace**, and five ordered
behaviour rules (`auto-path-enemy`, `inside-telegraph→step-back`, movement, `avoid-hazards`,
`wait-for-regen`) — Step Back ahead of the movement rule, because movement-channel arbitration
is top-to-bottom. Melee roots chase; ranged roots orbit. Kit is the corroborated mixed set:
`cave-vest-t2`, `mountain-charm-t2`, `plains-boots-t2`, `core-tempered`, all +5, with each
root's tier-legal weapon.

Recorded at qualification (zero fights spent), **identical on all six bosses**:

| Root | Weapon | RP | maxHp | attack | plating | DR | barrier |
|---|---|---:|---:|---:|---:|---:|---:|
| striker | `gale-needle` | 26/30 | 268 | 33 | 22 | 0.21 | 70 |
| squire | `quake-hammer` | 26/30 | 300 | 109 | 24 | 0.24 | 78 |
| apprentice | `ruinous-axe` | 28/30 | 256 | 94 | 20 | 0.20 | 67 |
| slinger | `jungle-stinger-rapier` | 28/30 | 239 | 38 | 18 | 0.17 | 62 |
| conduit | `ruinous-axe` | 28/30 | 244 | 86 | 18 | 0.18 | 63 |
| spirit | `ruinous-axe` | 28/30 | 231 | 100 | 18 | 0.19 | 129 |

**Every cell is `reference-portable`. None is corroborated.** Spirit's package is the only one
with a historical clear, and that clear is against Apex Timberclaw — it corroborates nothing on
a different boss. The report must never present a Boss2 row as a historical result.

A loss is data. Boss1 kept five Timberclaw losses that had removed 51–94% of the boss, and that
is what made its phase exposure readable. Nothing here is dropped for losing.

## 7. Seeds, and cap honesty

**Seeds.** Only `gorging-razortusk` has a **declared** randomness consumer among the six — its
Rallying Cry spawns carry `offsetRange`. The other five declare none, but that is an *absence
of declared consumers*, **not a measurement that they are inert**. Timberclaw's inertness was
measured; theirs was not, and this screen spends no fights to measure it. Do not present one
seed as coverage of seed sensitivity for any of the six, and do not pretend a second nominal
seed would add independent evidence on a deterministic encounter.

**Cap.** 300,000 ms simulated, the same window Timberclaw ran under. Boss1's six Timberclaw
fights all resolved in 27.6–49.3 s against it.

**Unlike Boss1's Sovereign window, a cap cannot be ruled out here, and this packet does not
claim a large margin it has not measured.** Timberclaw carries 0 plating and 0 DR; the Boss2
bosses carry up to 12 plating and 0.12 DR against references whose attack runs 33–109, so
mitigation takes a real bite out of the slowest pairings — the Dreadbore and the Juggernaut
against striker (33 attack) and slinger (38) are the ones to watch. No preparation fight was
spent to measure it, so the honest position is that the cap is generous but not proven
unreachable.

**A cap is an incomplete fight observation. It is not a death, and it is not an extrapolated
victory time.** Record it as its own outcome with the HP fraction actually removed, and do not
extend the window, retry adaptively, or infer a time-to-kill from it.

No `ttk` is extrapolated anywhere. Extrapolation assumes constant player DPS and is optimistic
against a boss that hardens late — which is exactly what `empower-shred` and the 50% empowers
do.

## 8. Commands

Qualification at the frozen source, before anything else:

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss2Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss2Concealment.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossDeclaration.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossTerminal.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss1Matrix.test.ts
```

Preflight (qualifies all six blocks, ZERO fights spent, separate root):

```bash
node scripts/boss2-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss2-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"
```

The run:

```bash
node scripts/boss2-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss2" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

The run script drives all six blocks in sequence, verifying each **independently**: a local
problem on one boss never consumes another's allocation.

### Smoke-test receipts from preparation (zero fights spent)

All six blocks qualified at the frozen source, boss awake in every cell, roster = the boss
alone, `nonBossBodiesAtStart: 0`, `hpTreatment: []` everywhere, manifests reading back the
frozen `17aa46cb…` / `08bcc556…`:

```
razortusk  qualify ok — 6 portable references, boss awake, declarations applied
juggernaut qualify ok — 6 portable references, boss awake, declarations applied
behemoth   qualify ok — 6 portable references, boss awake, declarations applied
dreadbore  qualify ok — 6 portable references, boss awake, declarations applied
emperor    qualify ok — 6 portable references, boss awake, declarations applied
gorger     qualify ok — 6 portable references, boss awake, declarations applied
boss2 preflight: ok — 6 blocks, 36 planned observations, ZERO fights spent
```

Verified at this exact tip (`3eed309e`, clean tree) during preparation. Those artifacts are
kept at `.../ttk-survey/boss2-preflight-opus-verify` so the documented preflight root above is
**free** — the runner requires a NEW root and will refuse an existing one.

**Portability is measured, not asserted.** Each root's effective stats are byte-identical
across all six blocks *and* identical to its Boss1 Timberclaw cell — nothing about the player
depends on which boss is standing there, which is precisely the claim that makes the combined
seven-boss table readable.

## 9. Carrying the Timberclaw rows forward

The six Boss1 Timberclaw observations join the coverage map. Build and gameplay equivalence is
**proven from the diff, not assumed**:

- Both blocks re-qualified at this source produce **byte-identical `effectiveStats` and
  `initialRosterHash`** against the sealed Boss1 records, on all twelve cells.
- The definitions hash and hitbox hash are unchanged from Boss1's frozen values.
- The intervening change is declaration-only: the preparation defaults were *moved* into
  `resolveSurveyPackage` and are the same expressions; the one semantic change (`??` → an
  `undefined` test, so an intentional neutral stance is expressible) is inert on every existing
  cell, none of which sets `stance: null`.

They must be labelled **reused Boss1 observations** with their original source `66d33d57` and
seed `96011` — **not** six new Boss2 observations. The combined map is **seven bosses × six
roots = 42 rows, of which only 36 are newly executed.** The revision differs between the two
sets and the table must say so.

## 10. What the report must separate

1. **Terminal outcome first** — killed / died / capped / encounter-reset / boss-vanished-no-kill
   / simultaneous-terminal / invalid — before any other number. The last four are real outcomes
   and are never rounded to a win or a loss.
2. **One row per actual observation.** Every failure and unfinished outcome is preserved. Never
   average a failure extrapolation into a successful kill time.
3. **Terminal evidence.** Every victory carries `bossKillEvidence` naming the boss as victim. A
   record with `outcome: boss-killed` and no evidence is a defect, not a result — the runner
   fails on it.
4. **Remaining boss HP on failure**, and the fraction actually removed. A near-clear and a
   half-clear are different data; do not flatten them.
5. **Minimum and terminal player HP, with sampling age.** Sampling is 1000 ms, so an unmarked
   terminal value lags the true one by up to 1 s. Say which is which.
6. **Phase exposure** — `crossedHalfAtMs`, cast labels, pattern steps reached. Not one pooled
   figure. Crossing a threshold is exposure, **not** evidence that the phase caused a death.
7. **Adds attributed to the adds** (Razortusk only), never folded into the boss's own output.
8. **Owner vs. summon** damage: Conduit records zero `attackBeats` by design (`CannotAttack`).
   Do not use that to invalidate its evidence.
9. **Guardian/access is unmeasured** and must be stated as such, never pooled in.
10. **Unmeasured stated as unmeasured.** Zero casts does not mean zero mechanics — ramps,
    cadence finishers, openings and venom emit no cast events, so an absent cast counter is
    inapplicable evidence, not a demonstrated failure. The Gorger has no `bossScript` at all.
11. **Portable reference, never corroboration.** No Boss2 row is a historical result.

Two measurement properties to carry, not restate as findings:

- **HP lost is sampled as per-tick HP decreases**, not the pipeline's `damageTaken`. Monster
  DoT, ground pools (the Behemoth's Corrosive Pool) and AoE splash bypass that pipeline. Both
  are recorded so the gap is visible rather than silently attributed.
- **No `ttk` is extrapolated.** A boss that is not killed reports its outcome and the HP
  fraction actually removed.

## 11. Endpoint

A **seven-boss × six-root coverage table**, with the reused Timberclaw rows clearly tagged, and
**at most three prioritized follow-up decisions**.

Reading rules for those three:

- Failure concentrated on particular **bosses** suggests where to inspect encounter pressure.
- Failure concentrated on particular **roots** suggests a reference/build question, not a boss
  question.
- Both are **prioritization signals, not causal verdicts.** Subsequent adjustments are chosen
  at command center; no automatic new grid follows from this screen.

## 12. Stop rules

- **New output root required.** The runner refuses an existing one. There are no retries.
- **HEAD must equal `--revision`, the tree must be clean, and both hashes must match** before
  any output is created. Otherwise: stop and report.
- **Verification failure preserves the data and does not retry**, per block. A failed block is
  reported as completed-but-unverified, never quietly re-run — that is exactly how Boss1's
  Sovereign block was handled, and handling it that way is what made the retrospective review
  possible at all.
- **Declared-vs-applied is checked at qualification AND at verification.** A divergence visible
  in a READY receipt stops the screen before any combat is spent. Boss1 ran this on one slot
  only, which is why its gap surfaced after twelve fights.
- **Per-block watchdog**, 40 minutes. A timeout writes `stopped-<block>.json` and moves on.
- **No limit increases, no adaptive retries, no mid-run repair.** A proven setup or legality
  defect is corrected and disclosed *before* freezing, never during the run. A loss is not such
  a defect.
- **Do not grow the screen.** 36 fights is the whole thing; `boss2Matrix.test.ts` asserts the
  size. No pilot cohort is authorized.
